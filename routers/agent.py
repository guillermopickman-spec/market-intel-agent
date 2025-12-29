from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

# Internal imports
from database import get_db
from services.agent_service import AgentService

# 1. Schema for user requests
class AgentRequest(BaseModel):
    query: str
    conversation_id: Optional[int] = None

router = APIRouter(prefix="/agent", tags=["Agent"])

@router.post("/analyze")
async def analyze_intent(data: AgentRequest):
    """Step 1: Understand what the user wants without executing tools."""
    try:
        agent = AgentService() 
        intent = agent.identify_intent(data.query)
        return intent
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis Error: {str(e)}")

@router.post("/execute")
async def run_mission(data: AgentRequest, db: Session = Depends(get_db)):
    """Step 2: Full ReAct loop with database persistence."""
    try:
        # Pass the database session to the service
        agent = AgentService(db)
        # Process the mission asynchronously
        result = await agent.process_mission(data.query, data.conversation_id)
        return result
    except Exception as e:
        print(f"DEBUG: Error in /execute -> {e}")
        raise HTTPException(status_code=500, detail=str(e))