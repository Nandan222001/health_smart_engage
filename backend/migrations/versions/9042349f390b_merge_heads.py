"""merge heads

Revision ID: 9042349f390b
Revises: 0003_tenant_extra_fields, 0027_users_role_column
Create Date: 2026-05-30 16:52:41.485089
"""

from alembic import op
import sqlalchemy as sa


revision = '9042349f390b'
down_revision = ('0003_tenant_extra_fields', '0027_users_role_column')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
