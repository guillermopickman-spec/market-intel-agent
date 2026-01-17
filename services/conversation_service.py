from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from models.conversation import Conversation
from models.message import ChatMessage
from core.logger import get_logger

logger = get_logger("ConversationService")


def create_conversation(db: Session) -> Conversation:
    """Create a new conversation."""
    conversation = Conversation(
        title=None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    logger.info(f"Created conversation {conversation.id}")
    return conversation


def get_conversation(db: Session, conversation_id: int) -> Optional[Conversation]:
    """Get a conversation with all its messages."""
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conversation:
        # Eagerly load messages
        _ = conversation.messages
    return conversation


def list_conversations(db: Session, limit: int = 50) -> List[Conversation]:
    """List all conversations ordered by updated_at descending."""
    conversations = (
        db.query(Conversation)
        .order_by(desc(Conversation.updated_at))
        .limit(limit)
        .all()
    )
    return conversations


def save_message(db: Session, conversation_id: int, role: str, content: str) -> ChatMessage:
    """Save a message to a conversation."""
    message = ChatMessage(
        conversation_id=conversation_id,
        role=role,
        content=content,
        created_at=datetime.utcnow()
    )
    db.add(message)
    
    # Update conversation's updated_at timestamp
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conversation:
        conversation.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(message)
    logger.info(f"Saved {role} message to conversation {conversation_id}")
    return message


def update_conversation_title(db: Session, conversation_id: int, title: str) -> Optional[Conversation]:
    """Update a conversation's title."""
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conversation:
        conversation.title = title
        conversation.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(conversation)
        logger.info(f"Updated title for conversation {conversation_id}: {title}")
    return conversation


def delete_conversation(db: Session, conversation_id: int) -> bool:
    """Delete a conversation and all its messages (cascade)."""
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conversation:
        db.delete(conversation)
        db.commit()
        logger.info(f"Deleted conversation {conversation_id}")
        return True
    return False


def generate_title_from_messages(messages: List[ChatMessage]) -> str:
    """
    Generate a title from the first 2-3 messages.
    Takes the first user message and truncates to 60 characters.
    """
    if not messages:
        return "New Chat"
    
    # Find first user message
    for message in messages:
        if message.role == "user":
            title = message.content.strip()
            # Remove newlines and extra spaces
            title = " ".join(title.split())
            # Truncate to 60 characters
            if len(title) > 60:
                title = title[:57] + "..."
            return title
    
    # Fallback: use first message regardless of role
    if messages:
        title = messages[0].content.strip()
        title = " ".join(title.split())
        if len(title) > 60:
            title = title[:57] + "..."
        return title
    
    return "New Chat"
