"""add injured persons to incidents

Revision ID: 0024_incident_injured_persons
Revises: 0023_compliance_extensions
Create Date: 2026-05-27
"""
from alembic import op
import sqlalchemy as sa

revision = "0024_incident_injured_persons"
down_revision = "0023_compliance_extensions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("incidents", sa.Column("injured_persons", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("incidents", "injured_persons")
