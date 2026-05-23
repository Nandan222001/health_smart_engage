"""Create audit_checklists, audit_executions, findings, and capas tables

Revision ID: 0009_compliance
Revises: 0008_permits
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0009_compliance"
down_revision = "0008_permits"
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
        "audit_checklists",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("standard", sa.String(128), nullable=False),
        sa.Column("version", sa.String(64), nullable=False),
        sa.Column("status", sa.String(64), nullable=False, server_default="draft"),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "audit_executions",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("checklist_id", sa.String(64), nullable=False),
        sa.Column("site_id", sa.String(64), nullable=True),
        sa.Column("auditor_user_id", sa.String(64), nullable=False),
        sa.Column("status", sa.String(64), nullable=False, server_default="scheduled"),
        sa.Column("answers", sa.JSON(), nullable=False),
        *tenant_columns(),
        sa.ForeignKeyConstraint(["checklist_id"], ["audit_checklists.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "findings",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("audit_id", sa.String(64), nullable=True),
        sa.Column("source_type", sa.String(64), nullable=False),
        sa.Column("severity", sa.String(64), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("iso_clause", sa.String(128), nullable=True),
        sa.Column("status", sa.String(64), nullable=False, server_default="open"),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "capas",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("source_type", sa.String(64), nullable=False),
        sa.Column("source_id", sa.String(64), nullable=True),
        sa.Column("owner_user_id", sa.String(64), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("severity", sa.String(64), nullable=False, server_default="medium"),
        sa.Column("status", sa.String(64), nullable=False, server_default="open"),
        sa.Column("evidence_file_id", sa.String(64), nullable=True),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("capas")
    op.drop_table("findings")
    op.drop_table("audit_executions")
    op.drop_table("audit_checklists")
