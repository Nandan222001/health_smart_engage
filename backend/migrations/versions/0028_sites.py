"""Create sites table

Revision ID: 0028_sites
Revises: 9042349f390b
Create Date: 2026-05-31
"""

from alembic import op
import sqlalchemy as sa

revision = "0028_sites"
down_revision = "9042349f390b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "sites",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("site_type", sa.String(128), nullable=False, server_default="Site"),
        sa.Column("address", sa.Text, nullable=True),
        sa.Column("city", sa.String(128), nullable=True),
        sa.Column("postcode", sa.String(32), nullable=True),
        sa.Column("region", sa.String(128), nullable=True),
        sa.Column("status", sa.String(64), nullable=False, server_default="Active"),
        sa.Column("capacity", sa.Integer, nullable=True),
        sa.Column("hazard_level", sa.String(64), nullable=True),
        sa.Column("extra_fields", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_sites_tenant_id", "sites", ["tenant_id"])
    op.create_index("ix_sites_name", "sites", ["name"])
    op.create_index("ix_sites_status", "sites", ["status"])


def downgrade() -> None:
    op.drop_table("sites")
