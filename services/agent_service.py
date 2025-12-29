import json
import re
import asyncio
import concurrent.futures
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

# Core & LLM
from services.llm.huggingface import HuggingFaceClient
from core.prompts import AGENT_SYSTEM_PROMPT

# Models
from models.conversation import Conversation
from models.message import ChatMessage

# Tools
from services.scraper_service import scrape_and_ingest
from services.notion_service import send_report_to_notion
from services.email_service import send_custom_email

class AgentService:
    def __init__(self, db: Optional[Session] = None):
        self.llm = HuggingFaceClient()
        self.db = db

    def identify_intent(self, context_prompt: str) -> Dict[str, Any]:
        """Identifies agent intent with defensive parsing for LLM hallucination repair."""
        prompt = f"{AGENT_SYSTEM_PROMPT}\n\nCONTEXT AND HISTORY:\n{context_prompt}\n\nRespond ONLY with a valid JSON object."
        
        try:
            raw_response = self.llm.generate(prompt)
            
            # Clean possible markdown block markers
            clean_response = re.sub(r"```json|```", "", raw_response).strip()
            json_match = re.search(r"\{.*\}", clean_response, re.DOTALL)
            
            if not json_match:
                return {"thought": "Failed to parse JSON", "tool": "none", "args": {}}

            intent = json.loads(json_match.group())
            
            # --- REPAIR LOGIC: Handle misplaced 'url' argument ---
            if "url" in intent and "args" in intent:
                if "url" not in intent["args"]:
                    intent["args"]["url"] = intent["url"]
            
            # --- REPAIR LOGIC: Extract URL from thought if args is empty ---
            if intent.get("tool") == "web_research" and not intent.get("args"):
                url_found = re.search(r'https?://[^\s<>"]+', raw_response)
                if url_found:
                    intent["args"] = {"url": url_found.group()}

            print(f"🤖 [PLAN]: {intent.get('thought')[:80]}... | [TOOL]: {intent.get('tool')}")
            return intent

        except Exception as e:
            print(f"⚠️ AI Parsing Error: {e}")
            return {"thought": f"Parsing Error: {str(e)}", "tool": "none", "args": {}}

    def execute_tool(self, tool_name: str, args: Dict[str, Any], conversation_id: Optional[int] = None) -> str:
        """Central tool dispatcher with argument validation."""
        try:
            if tool_name == "web_research":
                url = args.get('url')
                if url and isinstance(url, str):
                    return scrape_and_ingest(url, conversation_id=conversation_id)
                return f"❌ Error: Invalid URL provided: {url}"

            elif tool_name == "save_to_notion":
                title = str(args.get("title", "Market Intelligence Report"))
                content = str(args.get("content", "No content provided."))
                success = send_report_to_notion(title, content)
                return "✅ Report successfully saved to Notion." if success else "❌ Notion API error."

            elif tool_name == "dispatch_email":
                return send_custom_email(
                    to_email=str(args.get("to_email", "")),
                    subject=str(args.get("subject", "Agent Intelligence Update")),
                    content=str(args.get("content", ""))
                )
            
            return f"❌ Error: Tool '{tool_name}' is not supported."
        except Exception as e:
            return f"❌ Execution Exception: {str(e)}"

    async def process_mission(self, user_input: str, conversation_id: Optional[int] = None):
        """Main agent loop: ReAct (Reason + Act) cycle."""
        execution_history: List[Dict[str, Any]] = []
        loop = asyncio.get_running_loop()

        # 1. Database & Session Setup (Ensures foreign key exists)
        current_conv_id = conversation_id
        if self.db:
            if current_conv_id:
                # FIX: Check if conversation exists; if not, create it to satisfy constraints
                conversation = self.db.get(Conversation, current_conv_id)
                if not conversation:
                    self.db.add(Conversation(id=current_conv_id))
                    self.db.commit()
            else:
                # Auto-generate a new conversation
                new_conv = Conversation()
                self.db.add(new_conv)
                self.db.commit()
                self.db.refresh(new_conv)
                current_conv_id = new_conv.id

            # Save the user's mission to the message history
            self.db.add(ChatMessage(role="user", content=user_input, conversation_id=current_conv_id))
            self.db.commit()

        try:
            # ReAct Loop: Maximum 3 iterations to prevent infinite loops
            for i in range(3):
                # Build context from mission and history
                compact_history = [
                    {"step": h["step"], "tool": h["action"], "result": str(h["result"])[:150]}
                    for h in execution_history
                ]

                context_prompt = (
                    f"MISSION: {user_input}\n"
                    f"HISTORY: {json.dumps(compact_history)}\n"
                    f"TASK: Determine the next tool or respond 'none' if finished."
                )

                intent = self.identify_intent(context_prompt)
                tool_name = str(intent.get("tool", "none")).lower()
                tool_args = intent.get("args", {})

                if tool_name == "none":
                    break

                # Execute the selected tool in a thread pool (since some tools are blocking)
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    result = await loop.run_in_executor(
                        pool, self.execute_tool, tool_name, tool_args, current_conv_id
                    )

                execution_history.append({
                    "step": i + 1,
                    "thought": intent.get("thought"),
                    "action": tool_name,
                    "result": result
                })

            # 2. Final Logging
            if self.db and current_conv_id:
                # Log the agent's full execution path to the DB
                self.db.add(ChatMessage(
                    role="assistant", 
                    content=json.dumps(execution_history), 
                    conversation_id=current_conv_id
                ))
                self.db.commit()

            return {
                "status": "success",
                "conversation_id": current_conv_id,
                "mission": user_input,
                "logs": execution_history
            }

        except Exception as e:
            return {"status": "error", "message": f"Agent loop failed: {str(e)}", "logs": execution_history}