"""Add extra_fields JSON column to core domain tables for org-specific overflow data.

Revision ID: 0025_extra_fields
Revises: 0024_incident_injured_persons
Create Date: 2026-05-29
"""
from alembic import op
import sqlalchemy as sa

revision = "0025_extra_fields"
down_revision = "0024_incident_injured_persons"
branch_labels = None
depends_on = None

TABLES = [
    "assets",
    "employees",
    "vendors",
    "incidents",
    "risk_assessments",
]


def upgrade() -> None:
    for table in TABLES:
        op.add_column(table, sa.Column("extra_fields", sa.JSON(), nullable=True))


def downgrade() -> None:
    for table in TABLES:
        op.drop_column(table, "extra_fields")
