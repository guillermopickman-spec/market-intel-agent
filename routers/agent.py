from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
import json
import asyncio

from database import get_db
from services.agent_service import AgentService
from core.logger import get_logger
from models import MissionLog
from sqlalchemy import desc

logger = get_logger("AgentRouter")

class MissionRequest(BaseModel):
    """
    Schema for incoming mission requests.
    'user_input' matches the standard expected by the frontend/Swagger.
    """
    user_input: str
    conversation_id: Optional[int] = None

router = APIRouter(tags=["Agent"])

@router.post("/analyze")
async def analyze_mission(data: MissionRequest):
    """
    Step 1: Understand Intent
    Analyzes the user input using Gemini to identify the core mission goal 
    without triggering expensive tool executions.
    """
    try:
        agent = AgentService() 
        intent = await agent.identify_intent(data.user_input)
        return {"intent": intent}
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Analysis Error: {str(e)}"
        )

@router.post("/execute")
async def execute_mission(data: MissionRequest, db: Session = Depends(get_db)):
    """
    Step 2: Full Execution
    Triggers the ReAct loop: Planning -> Web Research -> Synthesis -> Action.
    """
    try:
        agent = AgentService(db)
        result = await agent.process_mission(data.user_input, data.conversation_id)
        return result
    except Exception as e:
        logger.error(f"Execution Error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Execution Error: {str(e)}"
        )

@router.post("/execute/stream")
async def execute_mission_stream(data: MissionRequest, db: Session = Depends(get_db)):
    """
    Streaming version of mission execution.
    Streams ReAct loop steps as JSON lines (NDJSON format).
    """
    async def generate_stream():
        try:
            agent = AgentService(db)
            mission_id = data.conversation_id or 999
            
            # Send thinking step
            yield json.dumps({"type": "thinking", "content": f"Analyzing mission: {data.user_input[:50]}..."}) + "\n"
            
            # Generate plan
            plan = await agent.generate_plan(data.user_input)
            agent.current_intel = ""
            logs = []
            
            yield json.dumps({"type": "thinking", "content": f"Plan generated with {len(plan)} steps"}) + "\n"
            
            # Execute research steps
            for step in [s for s in plan if s.get('tool') in ["web_research", "web_search"]]:
                tool_name = step.get('tool', 'unknown')
                yield json.dumps({"type": "tool", "tool": tool_name, "result": f"Executing {tool_name}..."}) + "\n"
                
                res = await agent.execute_tool(step['tool'], step['args'], mission_id)
                
                # Limit each search result
                if len(res) > 2000:
                    res = res[:2000] + "... [truncated]"
                
                agent.current_intel += f"\n---\n{res}\n"
                logs.append({"tool": step['tool'], "status": "Gathered"})
                
                yield json.dumps({"type": "tool", "tool": tool_name, "result": f"Completed: {res[:100]}..."}) + "\n"
            
            # Truncate intel pool
            max_allowed_chars = agent._calculate_max_intel_pool_size()
            intel_pool_size = len(agent.current_intel)
            
            if intel_pool_size > max_allowed_chars * 1.5:
                truncated_intel = agent._extract_price_summary(agent.current_intel)
                if len(truncated_intel) > max_allowed_chars:
                    truncated_intel = agent._truncate_intel_pool(truncated_intel, max_chars=max_allowed_chars)
            else:
                truncated_intel = agent._truncate_intel_pool(agent.current_intel, max_chars=max_allowed_chars)
            
            yield json.dumps({"type": "thinking", "content": "Synthesizing final report..."}) + "\n"
            
            # Generate final report
            from core.prompts import REPORT_SYNTHESIS_PROMPT
            final_prompt = REPORT_SYNTHESIS_PROMPT.format(intel_pool=truncated_intel)
            
            loop = asyncio.get_running_loop()
            agent.current_intel = await loop.run_in_executor(
                None,
                agent.llm.generate,
                final_prompt
            )
            
            agent._persist_to_memory(agent.current_intel, mission_id)
            
            # Execute action steps
            for step in [s for s in plan if s.get('tool') in ["save_to_notion", "dispatch_email"]]:
                step['args']['content'] = agent.current_intel
                res = await agent.execute_tool(step['tool'], step['args'], mission_id)
                logs.append({"tool": step['tool'], "result": res})
            
            # Send completion
            yield json.dumps({
                "type": "complete",
                "report": agent.current_intel
            }) + "\n"
            
        except Exception as e:
            logger.error(f"Streaming Execution Error: {e}", exc_info=True)
            yield json.dumps({
                "type": "error",
                "error": str(e)
            }) + "\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="application/x-ndjson",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

@router.get("/reports")
async def get_reports(db: Session = Depends(get_db), limit: int = 100):
    """
    Get all mission logs/reports.
    """
    try:
        logs = db.query(MissionLog).order_by(desc(MissionLog.created_at)).limit(limit).all()
        return [
            {
                "id": log.id,
                "conversation_id": log.conversation_id,
                "query": log.query,
                "response": log.response,
                "status": log.status,
                "created_at": log.created_at.isoformat() if log.created_at is not None else None,
            }
            for log in logs
        ]
    except Exception as e:
        logger.error(f"Reports Error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Reports Error: {str(e)}"
        )

@router.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    """
    Get mission statistics for dashboard.
    """
    try:
        from sqlalchemy import func
        total = db.query(func.count(MissionLog.id)).scalar() or 0
        completed = db.query(func.count(MissionLog.id)).filter(MissionLog.status == "COMPLETED").scalar() or 0
        failed = db.query(func.count(MissionLog.id)).filter(MissionLog.status == "FAILED").scalar() or 0
        
        # Get recent logs for price extraction
        recent_logs = db.query(MissionLog).order_by(desc(MissionLog.created_at)).limit(50).all()
        
        return {
            "total_missions": total,
            "completed_missions": completed,
            "failed_missions": failed,
        }
    except Exception as e:
        logger.error(f"Stats Error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Stats Error: {str(e)}"
        )