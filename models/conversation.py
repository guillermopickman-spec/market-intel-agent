from __future__ import annotations
from sqlalchemy import Integer, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
from typing import List, TYPE_CHECKING
from database import Base # Importación directa desde raíz

if TYPE_CHECKING:
    from .message import ChatMessage

class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    messages: Mapped[List["ChatMessage"]] = relationship(
        "ChatMessage",
        back_populates="conversation",
        cascade="all, delete-orphan"
    )