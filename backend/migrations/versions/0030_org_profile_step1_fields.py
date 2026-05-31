"""org_profile step1 fields update

Revision ID: 0030_org_profile_step1_fields
Revises: 0029_new_tables
Create Date: 2026-05-31
"""
from alembic import op
import sqlalchemy as sa

revision = "0030_org_profile_step1_fields"
down_revision = "0029_new_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("org_profiles", sa.Column("organisation_id", sa.String(128), nullable=True))
    op.add_column("org_profiles", sa.Column("parent_company", sa.String(255), nullable=True))
    op.add_column("org_profiles", sa.Column("iso_45001_status", sa.String(128), nullable=True))
    op.add_column("org_profiles", sa.Column("regulatory_authority", sa.String(255), nullable=True))
    op.add_column("org_profiles", sa.Column("establishment_date", sa.String(64), nullable=True))


def downgrade() -> None:
    op.drop_column("org_profiles", "establishment_date")
    op.drop_column("org_profiles", "regulatory_authority")
    op.drop_column("org_profiles", "iso_45001_status")
    op.drop_column("org_profiles", "parent_company")
    op.drop_column("org_profiles", "organisation_id")
