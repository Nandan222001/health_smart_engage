"""Add role column to users table.

Revision ID: 0027_users_role_column
Revises: 0026_model_extra_fields
Create Date: 2026-05-30
"""
from alembic import op
import sqlalchemy as sa

revision = "0027_users_role_column"
down_revision = "0026_model_extra_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    try:
        op.add_column("users", sa.Column("role", sa.String(128), nullable=True))
    except Exception:
        pass  # column already exists


def downgrade() -> None:
    op.drop_column("users", "role")
