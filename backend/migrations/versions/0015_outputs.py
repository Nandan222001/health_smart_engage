"""Create reports, alert_rules, export_jobs, and integrations tables

Revision ID: 0015_outputs
Revises: 0014_workflow
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0015_outputs"
down_revision = "0014_workflow"
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
        "reports",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("report_type", sa.String(128), nullable=False),
        sa.Column("status", sa.String(64), nullable=False, server_default="generating"),
        sa.Column("format", sa.String(64), nullable=False, server_default="pdf"),
        sa.Column("size_kb", sa.Integer(), nullable=True),
        sa.Column("generated_by", sa.String(64), nullable=False),
        sa.Column("period", sa.String(128), nullable=True),
        sa.Column("download_url", sa.String(1024), nullable=True),
        sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("filters", sa.JSON(), nullable=False),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "alert_rules",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("trigger_expr", sa.Text(), nullable=False),
        sa.Column("channels", sa.JSON(), nullable=False),
        sa.Column("priority", sa.String(64), nullable=False, server_default="medium"),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("recipients", sa.JSON(), nullable=False),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "export_jobs",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("format", sa.String(64), nullable=False),
        sa.Column("module", sa.String(128), nullable=False),
        sa.Column("status", sa.String(64), nullable=False, server_default="processing"),
        sa.Column("size_kb", sa.Integer(), nullable=True),
        sa.Column("download_url", sa.String(1024), nullable=True),
        sa.Column("filters", sa.JSON(), nullable=False),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "integrations",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("integration_type", sa.String(128), nullable=False),
        sa.Column("status", sa.String(64), nullable=False, server_default="disconnected"),
        sa.Column("last_sync", sa.DateTime(timezone=True), nullable=True),
        sa.Column("records_synced", sa.Integer(), nullable=True),
        sa.Column("config", sa.JSON(), nullable=False),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("integrations")
    op.drop_table("export_jobs")
    op.drop_table("alert_rules")
    op.drop_table("reports")
