"""Create permits and permit_approvals tables

Revision ID: 0008_permits
Revises: 0007_risks
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0008_permits"
down_revision = "0007_risks"
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
        "permits",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("permit_ref", sa.String(128), nullable=False),
        sa.Column("permit_type", sa.String(128), nullable=False),
        sa.Column("requester_user_id", sa.String(64), nullable=False),
        sa.Column("asset_id", sa.String(64), nullable=True),
        sa.Column("zone_id", sa.String(64), nullable=True),
        sa.Column("risk_assessment_id", sa.String(64), nullable=True),
        sa.Column("vendor_id", sa.String(64), nullable=True),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(64), nullable=False, server_default="draft"),
        sa.Column("controls", sa.JSON(), nullable=False),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_permits_permit_ref", "permits", ["permit_ref"])
    op.create_index("ix_permits_status", "permits", ["status"])

    op.create_table(
        "permit_approvals",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("permit_id", sa.String(64), nullable=False),
        sa.Column("approver_user_id", sa.String(64), nullable=False),
        sa.Column("decision", sa.String(64), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("gps_location", sa.String(255), nullable=True),
        *tenant_columns(),
        sa.ForeignKeyConstraint(["permit_id"], ["permits.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("permit_approvals")
    op.drop_index("ix_permits_status", table_name="permits")
    op.drop_index("ix_permits_permit_ref", table_name="permits")
    op.drop_table("permits")
