"""Create incidents and investigations tables

Revision ID: 0010_incidents
Revises: 0009_compliance
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0010_incidents"
down_revision = "0009_compliance"
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
        "incidents",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("incident_ref", sa.String(128), nullable=False),
        sa.Column("reporter_user_id", sa.String(64), nullable=False),
        sa.Column("incident_type", sa.String(128), nullable=False),
        sa.Column("severity", sa.String(64), nullable=False, server_default="unclassified"),
        sa.Column("location_id", sa.String(64), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("is_confidential", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(64), nullable=False, server_default="reported"),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_incidents_incident_ref", "incidents", ["incident_ref"])

    op.create_table(
        "investigations",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("incident_id", sa.String(64), nullable=False),
        sa.Column("lead_user_id", sa.String(64), nullable=False),
        sa.Column("rca_method", sa.String(64), nullable=False, server_default="5-why"),
        sa.Column("findings", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(64), nullable=False, server_default="open"),
        *tenant_columns(),
        sa.ForeignKeyConstraint(["incident_id"], ["incidents.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("investigations")
    op.drop_index("ix_incidents_incident_ref", table_name="incidents")
    op.drop_table("incidents")
