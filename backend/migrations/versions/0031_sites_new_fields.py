"""sites step3 new fields

Revision ID: 0031_sites_new_fields
Revises: 0030_org_profile_step1_fields
Create Date: 2026-05-31
"""
from alembic import op
import sqlalchemy as sa

revision = "0031_sites_new_fields"
down_revision = "0030_org_profile_step1_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("sites", sa.Column("working_stations", sa.Integer(), nullable=True))
    op.add_column("sites", sa.Column("primary_products", sa.String(255), nullable=True))
    op.alter_column("sites", "hazard_level", type_=sa.String(128))


def downgrade() -> None:
    op.drop_column("sites", "primary_products")
    op.drop_column("sites", "working_stations")
    op.alter_column("sites", "hazard_level", type_=sa.String(64))
