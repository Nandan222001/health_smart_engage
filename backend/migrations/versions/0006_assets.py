"""Create assets and asset_inspections tables

Revision ID: 0006_assets
Revises: 0005_vendors
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0006_assets"
down_revision = "0005_vendors"
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
        "assets",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("asset_code", sa.String(128), nullable=False),
        sa.Column("category", sa.String(128), nullable=False),
        sa.Column("location_id", sa.String(64), nullable=True),
        sa.Column("criticality", sa.String(64), nullable=False, server_default="medium"),
        sa.Column("manufacturer", sa.String(255), nullable=True),
        sa.Column("compliance_status", sa.String(64), nullable=False, server_default="compliant"),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_assets_asset_code", "assets", ["asset_code"])

    op.create_table(
        "asset_inspections",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("asset_id", sa.String(64), nullable=False),
        sa.Column("inspection_type", sa.String(128), nullable=False),
        sa.Column("inspected_on", sa.Date(), nullable=False),
        sa.Column("inspector_user_id", sa.String(64), nullable=False),
        sa.Column("result", sa.String(64), nullable=False),
        sa.Column("evidence_file_id", sa.String(64), nullable=True),
        *tenant_columns(),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("asset_inspections")
    op.drop_index("ix_assets_asset_code", table_name="assets")
    op.drop_table("assets")
