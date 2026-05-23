"""Create knowledge_documents table

Revision ID: 0011_knowledge
Revises: 0010_incidents
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0011_knowledge"
down_revision = "0010_incidents"
branch_labels = None
depends_on = None


def tenant_columns():
    return [
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    ]


def upgrade() -> None:
    op.create_table(
        "knowledge_documents",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("document_type", sa.String(128), nullable=False),
        sa.Column("version", sa.String(64), nullable=False),
        sa.Column("file_id", sa.String(64), nullable=True),
        sa.Column("status", sa.String(64), nullable=False, server_default="draft"),
        sa.Column("tags", sa.JSON(), nullable=False),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("knowledge_documents")
