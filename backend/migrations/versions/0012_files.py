"""Create file_objects table

Revision ID: 0012_files
Revises: 0011_knowledge
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0012_files"
down_revision = "0011_knowledge"
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
        "file_objects",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("file_name", sa.String(255), nullable=False),
        sa.Column("content_type", sa.String(128), nullable=True),
        sa.Column("storage_url", sa.String(1024), nullable=True),
        sa.Column("checksum", sa.String(128), nullable=True),
        sa.Column("status", sa.String(64), nullable=False, server_default="uploaded"),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("file_objects")
