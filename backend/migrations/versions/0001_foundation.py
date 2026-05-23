"""Create tenants table

Revision ID: 0001_foundation
Revises:
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0001_foundation"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tenants",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("org_code", sa.String(64), nullable=True),
        sa.Column("industry", sa.String(128), nullable=True),
        sa.Column("plan", sa.String(64), nullable=True, server_default="starter"),
        sa.Column("contact_email", sa.String(255), nullable=True),
        sa.Column("employee_count", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("sites_count", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("tenants")
