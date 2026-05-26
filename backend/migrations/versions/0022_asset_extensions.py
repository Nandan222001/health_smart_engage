"""asset_extensions

Revision ID: 0022_asset_extensions
Revises: 0021_vendor_extensions
Create Date: 2026-05-26
"""
from alembic import op
import sqlalchemy as sa

revision = "0022_asset_extensions"
down_revision = "0021_vendor_extensions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Extend assets table
    op.add_column("assets", sa.Column("name", sa.String(255), nullable=True))
    op.add_column("assets", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("assets", sa.Column("location", sa.String(255), nullable=True))
    op.add_column("assets", sa.Column("serial_number", sa.String(128), nullable=True))
    op.add_column("assets", sa.Column("status", sa.String(64), nullable=True, server_default="Active"))
    op.add_column("assets", sa.Column("risk_score", sa.Float(), nullable=True))
    op.add_column("assets", sa.Column("purchase_date", sa.Date(), nullable=True))
    op.add_column("assets", sa.Column("last_maintenance_date", sa.Date(), nullable=True))
    op.add_column("assets", sa.Column("next_maintenance_date", sa.Date(), nullable=True))

    # Add notes column to asset_inspections
    op.add_column("asset_inspections", sa.Column("notes", sa.Text(), nullable=True))

    # Create asset_maintenance_logs table
    op.create_table(
        "asset_maintenance_logs",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("asset_id", sa.String(64), sa.ForeignKey("assets.id"), nullable=False, index=True),
        sa.Column("work_type", sa.String(128), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("performed_by", sa.String(255), nullable=True),
        sa.Column("performed_on", sa.Date(), nullable=False),
        sa.Column("cost", sa.Float(), nullable=True),
        sa.Column("status", sa.String(64), nullable=True, server_default="completed"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("asset_maintenance_logs")
    op.drop_column("asset_inspections", "notes")
    for col in ["name", "description", "location", "serial_number", "status",
                "risk_score", "purchase_date", "last_maintenance_date", "next_maintenance_date"]:
        op.drop_column("assets", col)
