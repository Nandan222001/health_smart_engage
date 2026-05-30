"""Create mobile_sync_items table

Revision ID: 0017_sync
Revises: 0016_learning
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0017_sync"
down_revision = "0016_learning"
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
        "mobile_sync_items",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("user_id", sa.String(64), nullable=False),
        sa.Column("client_item_id", sa.String(128), nullable=False),
        sa.Column("operation", sa.String(128), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("sync_status", sa.String(64), nullable=False, server_default="pending"),
        sa.Column("conflict_details", sa.JSON(), nullable=False),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_mobile_sync_items_user_id", "mobile_sync_items", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_mobile_sync_items_user_id", table_name="mobile_sync_items")
    op.drop_table("mobile_sync_items")
