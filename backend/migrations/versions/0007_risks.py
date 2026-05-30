"""Create risk_assessments and hazard_observations tables

Revision ID: 0007_risks
Revises: 0006_assets
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0007_risks"
down_revision = "0006_assets"
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
        "risk_assessments",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("task_name", sa.String(255), nullable=True),
        sa.Column("location_id", sa.String(64), nullable=True),
        sa.Column("asset_id", sa.String(64), nullable=True),
        sa.Column("hazard_description", sa.Text(), nullable=False),
        sa.Column("likelihood", sa.Integer(), nullable=False),
        sa.Column("consequence", sa.Integer(), nullable=False),
        sa.Column("risk_score", sa.Integer(), nullable=False),
        sa.Column("residual_risk_score", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(64), nullable=False, server_default="draft"),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "hazard_observations",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("location_id", sa.String(64), nullable=True),
        sa.Column("severity", sa.String(64), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("photo_file_id", sa.String(64), nullable=True),
        sa.Column("status", sa.String(64), nullable=False, server_default="logged"),
        sa.Column("assigned_to_user_id", sa.String(64), nullable=True),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("hazard_observations")
    op.drop_table("risk_assessments")
