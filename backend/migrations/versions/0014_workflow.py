"""Create workflow_cases, workflow_stage_events, workflow_approvals, workflow_capas, workflow_resolutions, workflow_alerts tables

Revision ID: 0014_workflow
Revises: 0013_ai
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0014_workflow"
down_revision = "0013_ai"
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
        "workflow_cases",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("case_number", sa.String(128), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("case_type", sa.String(128), nullable=False),
        sa.Column("severity", sa.String(64), nullable=False, server_default="medium"),
        sa.Column("priority", sa.String(64), nullable=False, server_default="medium"),
        sa.Column("current_stage", sa.String(64), nullable=False, server_default="risk_detected"),
        sa.Column("assigned_to", sa.String(64), nullable=True),
        sa.Column("site", sa.String(128), nullable=True),
        sa.Column("zone", sa.String(128), nullable=True),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("overdue", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("escalated", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("source_type", sa.String(64), nullable=True),
        sa.Column("source_id", sa.String(64), nullable=True),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_workflow_cases_case_number", "workflow_cases", ["case_number"])

    op.create_table(
        "workflow_stage_events",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("case_id", sa.String(64), nullable=False),
        sa.Column("stage", sa.String(64), nullable=False),
        sa.Column("entered_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("actor", sa.String(64), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        *tenant_columns(),
        sa.ForeignKeyConstraint(["case_id"], ["workflow_cases.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_workflow_stage_events_case_id", "workflow_stage_events", ["case_id"])

    op.create_table(
        "workflow_approvals",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("case_id", sa.String(64), nullable=False),
        sa.Column("approver", sa.String(64), nullable=False),
        sa.Column("approver_role", sa.String(128), nullable=False),
        sa.Column("status", sa.String(64), nullable=False, server_default="pending"),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("escalated_to", sa.String(64), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        *tenant_columns(),
        sa.ForeignKeyConstraint(["case_id"], ["workflow_cases.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_workflow_approvals_case_id", "workflow_approvals", ["case_id"])

    op.create_table(
        "workflow_capas",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("case_id", sa.String(64), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("assignee", sa.String(64), nullable=False),
        sa.Column("priority", sa.String(64), nullable=False, server_default="medium"),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(64), nullable=False, server_default="open"),
        sa.Column("root_cause", sa.Text(), nullable=True),
        sa.Column("overdue", sa.Boolean(), nullable=False, server_default="0"),
        *tenant_columns(),
        sa.ForeignKeyConstraint(["case_id"], ["workflow_cases.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_workflow_capas_case_id", "workflow_capas", ["case_id"])

    op.create_table(
        "workflow_resolutions",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("case_id", sa.String(64), nullable=False),
        sa.Column("verified_by", sa.String(64), nullable=True),
        sa.Column("verification_due", sa.DateTime(timezone=True), nullable=True),
        sa.Column("evidence_submitted", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(64), nullable=False, server_default="awaiting_evidence"),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("evidence_notes", sa.Text(), nullable=True),
        *tenant_columns(),
        sa.ForeignKeyConstraint(["case_id"], ["workflow_cases.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_workflow_resolutions_case_id", "workflow_resolutions", ["case_id"])

    op.create_table(
        "workflow_alerts",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("case_id", sa.String(64), nullable=False),
        sa.Column("alert_type", sa.String(64), nullable=False, server_default="in_app"),
        sa.Column("recipient", sa.String(64), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("acknowledged", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_workflow_alerts_case_id", "workflow_alerts", ["case_id"])


def downgrade() -> None:
    op.drop_index("ix_workflow_alerts_case_id", table_name="workflow_alerts")
    op.drop_table("workflow_alerts")
    op.drop_index("ix_workflow_resolutions_case_id", table_name="workflow_resolutions")
    op.drop_table("workflow_resolutions")
    op.drop_index("ix_workflow_capas_case_id", table_name="workflow_capas")
    op.drop_table("workflow_capas")
    op.drop_index("ix_workflow_approvals_case_id", table_name="workflow_approvals")
    op.drop_table("workflow_approvals")
    op.drop_index("ix_workflow_stage_events_case_id", table_name="workflow_stage_events")
    op.drop_table("workflow_stage_events")
    op.drop_index("ix_workflow_cases_case_number", table_name="workflow_cases")
    op.drop_table("workflow_cases")
