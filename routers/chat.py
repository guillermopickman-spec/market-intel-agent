from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from services.ai_service import ask_document_question

router = APIRouter(prefix="/chat", tags=["chat"])

@router.get("/preguntar")
async def ask_question(
    query: str, 
    conversation_id: Optional[int] = Query(None, description="Filter RAG results by a specific conversation ID")
):
    """
    Endpoint to chat with documents. 
    Now supports conversation_id filtering for isolated context.
    """
    try:
        # --- WEEK 8 UPDATE: Pass conversation_id to the service ---
        # This ensures the AI only sees documents ingested during this specific session.
        respuesta_ia, fuentes = ask_document_question(query, conversation_id=conversation_id)
        
        return {
            "pregunta": query,
            "conversation_id": conversation_id,
            "respuesta": respuesta_ia,
            "fuentes": fuentes,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing the query: {str(e)}"
        )