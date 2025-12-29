from __future__ import annotations
from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
from typing import TYPE_CHECKING
from database import Base # Importación directa desde raíz

if TYPE_CHECKING:
    from .conversation import Conversation

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    role: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    conversation_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("conversations.id"),
        nullable=False
    )

    conversation: Mapped["Conversation"] = relationship(
        "Conversation",
        back_populates="messages"
    )