"""compliance_extensions

Revision ID: 0023_compliance_extensions
Revises: 0022_asset_extensions
Create Date: 2026-05-26
"""
from alembic import op
import sqlalchemy as sa

revision = "0023_compliance_extensions"
down_revision = "0022_asset_extensions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Extend audit_checklists
    op.add_column("audit_checklists", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("audit_checklists", sa.Column("audit_type", sa.String(128), nullable=True))

    # Extend audit_executions
    op.add_column("audit_executions", sa.Column("title", sa.String(255), nullable=True))
    op.add_column("audit_executions", sa.Column("audit_type", sa.String(128), nullable=True))
    op.add_column("audit_executions", sa.Column("scheduled_date", sa.Date(), nullable=True))
    op.add_column("audit_executions", sa.Column("completed_date", sa.Date(), nullable=True))

    # Extend findings
    op.add_column("findings", sa.Column("title", sa.String(255), nullable=True))

    # Extend capas
    op.add_column("capas", sa.Column("title", sa.String(255), nullable=True))
    op.add_column("capas", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("capas", sa.Column("root_cause", sa.Text(), nullable=True))
    op.add_column("capas", sa.Column("corrective_action", sa.Text(), nullable=True))

    # Create compliance_standards table
    op.create_table(
        "compliance_standards",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("code", sa.String(128), nullable=True),
        sa.Column("category", sa.String(128), nullable=True, server_default="General"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(64), nullable=True, server_default="Active"),
        sa.Column("version", sa.String(64), nullable=True),
        sa.Column("effective_date", sa.Date(), nullable=True),
        sa.Column("review_date", sa.Date(), nullable=True),
        sa.Column("owner", sa.String(255), nullable=True),
        sa.Column("jurisdiction", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    # Create regulatory_requirements table
    op.create_table(
        "regulatory_requirements",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("regulation_name", sa.String(255), nullable=False),
        sa.Column("jurisdiction", sa.String(255), nullable=True),
        sa.Column("category", sa.String(128), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(64), nullable=True, server_default="Pending"),
        sa.Column("owner", sa.String(255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("last_reviewed_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    # Create compliance_documents table
    op.create_table(
        "compliance_documents",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("document_type", sa.String(128), nullable=True, server_default="Policy"),
        sa.Column("category", sa.String(128), nullable=True),
        sa.Column("version", sa.String(64), nullable=True),
        sa.Column("status", sa.String(64), nullable=True, server_default="Draft"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("effective_date", sa.Date(), nullable=True),
        sa.Column("created_by", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("compliance_documents")
    op.drop_table("regulatory_requirements")
    op.drop_table("compliance_standards")
    for col in ["title", "description", "root_cause", "corrective_action"]:
        op.drop_column("capas", col)
    op.drop_column("findings", "title")
    for col in ["title", "audit_type", "scheduled_date", "completed_date"]:
        op.drop_column("audit_executions", col)
    for col in ["description", "audit_type"]:
        op.drop_column("audit_checklists", col)
