"""knowledge_documents add missing columns

Revision ID: 0032_knowledge_doc_new_fields
Revises: 0031_sites_new_fields
Create Date: 2026-05-31
"""
from alembic import op
import sqlalchemy as sa

revision = "0032_knowledge_doc_new_fields"
down_revision = "0031_sites_new_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("knowledge_documents", sa.Column("file_name", sa.String(512), nullable=True))
    op.add_column("knowledge_documents", sa.Column("file_type", sa.String(32), nullable=True))
    op.add_column("knowledge_documents", sa.Column("category", sa.String(64), nullable=True))
    op.add_column("knowledge_documents", sa.Column("size", sa.String(64), nullable=True))
    op.add_column("knowledge_documents", sa.Column("uploaded_by", sa.String(255), nullable=True))
    op.add_column("knowledge_documents", sa.Column("indexed", sa.Boolean(), nullable=True, server_default="0"))
    op.add_column("knowledge_documents", sa.Column("record_type", sa.String(128), nullable=True))
    op.add_column("knowledge_documents", sa.Column("extra_fields", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("knowledge_documents", "extra_fields")
    op.drop_column("knowledge_documents", "record_type")
    op.drop_column("knowledge_documents", "indexed")
    op.drop_column("knowledge_documents", "uploaded_by")
    op.drop_column("knowledge_documents", "size")
    op.drop_column("knowledge_documents", "category")
    op.drop_column("knowledge_documents", "file_type")
    op.drop_column("knowledge_documents", "file_name")
