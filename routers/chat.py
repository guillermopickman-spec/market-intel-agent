from fastapi import APIRouter, HTTPException, Depends, Body
from typing import Optional, List
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from services.ai_service import ask_document_question
from services.conversation_service import (
    create_conversation,
    get_conversation,
    list_conversations,
    save_message,
    update_conversation_title,
    delete_conversation,
    generate_title_from_messages
)
from services.mission_detection_service import detect_mission_id
from models.mission_log import MissionLog

router = APIRouter(prefix="/chat", tags=["Chat"])


class ChatRequest(BaseModel):
    query: str
    conversation_id: Optional[int] = None
    mission_id: Optional[int] = None


class UpdateTitleRequest(BaseModel):
    title: str


@router.post("/ask")
async def ask_rag_question(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    RAG-powered chat endpoint.
    Creates/loads conversation, saves messages, and returns response.
    Supports mission filtering via mission_id parameter or smart detection.
    """
    try:
        # Determine mission ID for RAG filtering (priority: UI selection > Smart detection > None)
        rag_mission_id = None
        
        if request.mission_id:
            # UI explicitly selected a mission
            rag_mission_id = request.mission_id
        else:
            # Try smart detection from query text
            detected_mission_id = detect_mission_id(request.query)
            if detected_mission_id:
                rag_mission_id = detected_mission_id
        
        # If mission_id specified, verify it exists and get its conversation_id
        if rag_mission_id:
            mission = db.query(MissionLog).filter(
                MissionLog.conversation_id == rag_mission_id
            ).first()
            
            if mission:
                # Use the mission's conversation_id for RAG filtering
                rag_mission_id = mission.conversation_id
            else:
                # Mission not found, but continue without filtering (search all)
                rag_mission_id = None
        
        # Get or create conversation (chat conversation, separate from mission)
        if request.conversation_id:
            conversation = get_conversation(db, request.conversation_id)
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")
        else:
            conversation = create_conversation(db)
        
        # Save user message
        user_message = save_message(db, conversation.id, "user", request.query)
        
        # Get RAG response (filter by mission_id if specified)
        # Note: conversation_id parameter in ask_document_question is for RAG filtering (mission ID)
        # NOT the chat conversation ID
        ai_response, sources = ask_document_question(request.query, conversation_id=rag_mission_id)
        
        # Save assistant response
        assistant_message = save_message(db, conversation.id, "assistant", ai_response)
        
        # Auto-generate title if conversation is new and has 2+ messages
        if not conversation.title:
            all_messages = conversation.messages
            if len(all_messages) >= 2:
                title = generate_title_from_messages(all_messages)
                update_conversation_title(db, conversation.id, title)
                conversation.title = title
        
        return {
            "query": request.query,
            "conversation_id": conversation.id,
            "title": conversation.title,
            "mission_id": rag_mission_id,  # Return the mission ID used for filtering
            "response": ai_response,
            "sources": sources,
            "status": "success"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Chat processing error: {str(e)}"
        )


@router.get("/conversations")
async def get_conversations_list(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """List all conversations with metadata."""
    try:
        conversations = list_conversations(db, limit=limit)
        return [
            {
                "id": conv.id,
                "title": conv.title,
                "created_at": conv.created_at.isoformat(),
                "updated_at": conv.updated_at.isoformat(),
                "message_count": len(conv.messages)
            }
            for conv in conversations
        ]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list conversations: {str(e)}"
        )


@router.get("/conversations/{conversation_id}")
async def get_conversation_with_messages(
    conversation_id: int,
    db: Session = Depends(get_db)
):
    """Get a conversation with all its messages."""
    try:
        conversation = get_conversation(db, conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return {
            "id": conversation.id,
            "title": conversation.title,
            "created_at": conversation.created_at.isoformat(),
            "updated_at": conversation.updated_at.isoformat(),
            "messages": [
                {
                    "id": msg.id,
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.created_at.isoformat()
                }
                for msg in sorted(conversation.messages, key=lambda m: m.created_at)
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get conversation: {str(e)}"
        )


@router.delete("/conversations/{conversation_id}")
async def delete_conversation_endpoint(
    conversation_id: int,
    db: Session = Depends(get_db)
):
    """Delete a conversation and all its messages."""
    try:
        success = delete_conversation(db, conversation_id)
        if not success:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return {"status": "success", "message": f"Conversation {conversation_id} deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete conversation: {str(e)}"
        )


@router.patch("/conversations/{conversation_id}/title")
async def update_conversation_title_endpoint(
    conversation_id: int,
    request: UpdateTitleRequest,
    db: Session = Depends(get_db)
):
    """Update a conversation's title."""
    try:
        conversation = update_conversation_title(db, conversation_id, request.title)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return {
            "id": conversation.id,
            "title": conversation.title,
            "updated_at": conversation.updated_at.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update title: {str(e)}"
        )


@router.get("/missions")
async def get_missions(
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all available missions from mission_logs."""
    try:
        missions = (
            db.query(MissionLog)
            .order_by(desc(MissionLog.created_at))
            .limit(limit)
            .all()
        )
        
        result = []
        for mission in missions:
            # Extract title from query (mission prompt), truncate to 60 chars
            title = mission.query or f"Mission {mission.conversation_id}"
            if len(title) > 60:
                title = title[:57] + "..."
            
            result.append({
                "id": mission.id,
                "conversation_id": mission.conversation_id,
                "query": mission.query,
                "title": title,
                "status": mission.status,
                "created_at": mission.created_at.isoformat() if mission.created_at else None,
            })
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get missions: {str(e)}"
        )