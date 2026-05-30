"""Create audit_logs and generic_records tables

Revision ID: 0018_audit_generic
Revises: 0017_sync
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0018_audit_generic"
down_revision = "0017_sync"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("tenant_id", sa.String(64), nullable=False),
        sa.Column("actor_user_id", sa.String(64), nullable=False),
        sa.Column("action", sa.String(128), nullable=False),
        sa.Column("resource_type", sa.String(128), nullable=False),
        sa.Column("resource_id", sa.String(128), nullable=True),
        sa.Column("details", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_logs_tenant_id", "audit_logs", ["tenant_id"])

    op.create_table(
        "generic_records",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("tenant_id", sa.String(64), nullable=False),
        sa.Column("module", sa.String(128), nullable=False),
        sa.Column("record_type", sa.String(128), nullable=False),
        sa.Column("external_ref", sa.String(128), nullable=True),
        sa.Column("status", sa.String(64), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_generic_records_tenant_id", "generic_records", ["tenant_id"])
    op.create_index("ix_generic_records_module", "generic_records", ["module"])
    op.create_index("ix_generic_records_record_type", "generic_records", ["record_type"])


def downgrade() -> None:
    op.drop_index("ix_generic_records_record_type", table_name="generic_records")
    op.drop_index("ix_generic_records_module", table_name="generic_records")
    op.drop_index("ix_generic_records_tenant_id", table_name="generic_records")
    op.drop_table("generic_records")
    op.drop_index("ix_audit_logs_tenant_id", table_name="audit_logs")
    op.drop_table("audit_logs")
