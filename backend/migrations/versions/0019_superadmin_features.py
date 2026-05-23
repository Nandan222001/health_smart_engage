"""Add superadmin feature tables: org_invitations, subscription_plans, notification_templates, security_policies

Revision ID: 0019_superadmin_features
Revises: 0018_audit_generic
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0019_superadmin_features"
down_revision = "0018_audit_generic"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "org_invitations",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("org_name", sa.String(255), nullable=False),
        sa.Column("admin_name", sa.String(255), nullable=False),
        sa.Column("admin_email", sa.String(255), nullable=False),
        sa.Column("subscription_plan", sa.String(64), nullable=True),
        sa.Column("allowed_modules", sa.JSON(), nullable=True),
        sa.Column("expiry_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("token", sa.String(128), nullable=False),
        sa.Column("status", sa.String(32), nullable=True),
        sa.Column("invited_by", sa.String(64), nullable=False),
        sa.Column("tenant_id", sa.String(64), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token"),
    )
    op.create_index("ix_org_invitations_admin_email", "org_invitations", ["admin_email"])
    op.create_index("ix_org_invitations_token", "org_invitations", ["token"])
    op.create_index("ix_org_invitations_status", "org_invitations", ["status"])

    op.create_table(
        "subscription_plans",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("price_monthly", sa.Float(), nullable=True),
        sa.Column("price_yearly", sa.Float(), nullable=True),
        sa.Column("user_limit", sa.Integer(), nullable=True),
        sa.Column("storage_gb", sa.Float(), nullable=True),
        sa.Column("api_requests_per_day", sa.Integer(), nullable=True),
        sa.Column("module_access", sa.JSON(), nullable=True),
        sa.Column("ai_features", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(32), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "notification_templates",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("channel", sa.String(32), nullable=False),
        sa.Column("subject", sa.String(512), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("variables", sa.JSON(), nullable=True),
        sa.Column("is_system", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "security_policies",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("key", sa.String(128), nullable=False),
        sa.Column("value", sa.JSON(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key"),
    )
    op.create_index("ix_security_policies_key", "security_policies", ["key"])


def downgrade() -> None:
    op.drop_index("ix_security_policies_key", table_name="security_policies")
    op.drop_table("security_policies")
    op.drop_table("notification_templates")
    op.drop_table("subscription_plans")
    op.drop_index("ix_org_invitations_status", table_name="org_invitations")
    op.drop_index("ix_org_invitations_token", table_name="org_invitations")
    op.drop_index("ix_org_invitations_admin_email", table_name="org_invitations")
    op.drop_table("org_invitations")
