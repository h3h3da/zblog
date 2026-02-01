"""Add page_slug to comments, make post_id nullable for page comments.

Revision ID: 002
Revises: 001
Create Date: 2025-01-31

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("comments", sa.Column("page_slug", sa.String(64), nullable=True, index=True))
    op.alter_column(
        "comments",
        "post_id",
        existing_type=sa.Integer(),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "comments",
        "post_id",
        existing_type=sa.Integer(),
        nullable=False,
    )
    op.drop_column("comments", "page_slug")
