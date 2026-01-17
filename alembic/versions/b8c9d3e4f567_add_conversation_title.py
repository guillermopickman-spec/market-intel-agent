"""Add conversation title and updated_at

Revision ID: b8c9d3e4f567
Revises: a7a0c26c2328
Create Date: 2026-01-15 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b8c9d3e4f567'
down_revision: Union[str, None] = 'a7a0c26c2328'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add title column to conversations table
    op.add_column('conversations', sa.Column('title', sa.String(), nullable=True))
    
    # Add updated_at column to conversations table
    op.add_column('conversations', sa.Column('updated_at', sa.DateTime(), nullable=True))
    
    # Set updated_at to created_at for existing rows
    op.execute("UPDATE conversations SET updated_at = created_at WHERE updated_at IS NULL")
    
    # Make updated_at NOT NULL after setting values
    op.alter_column('conversations', 'updated_at', nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'))
    
    # Create index on updated_at for sorting
    op.create_index('ix_conversations_updated_at', 'conversations', ['updated_at'])


def downgrade() -> None:
    # Drop index
    op.drop_index('ix_conversations_updated_at', table_name='conversations')
    
    # Drop columns
    op.drop_column('conversations', 'updated_at')
    op.drop_column('conversations', 'title')
