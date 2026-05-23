"""add extra fields to tenants table

Revision ID: 0003_tenant_extra_fields
Revises: 0002_users_password_hash
Create Date: 2026-05-24
"""

from alembic import op
import sqlalchemy as sa

revision = "0003_tenant_extra_fields"
down_revision = "0002_users_password_hash"
branch_labels = None
depends_on = None


def _has_column(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def upgrade() -> None:
    columns = [
        ("country", sa.Column("country", sa.String(128), nullable=True)),
        ("timezone", sa.Column("timezone", sa.String(64), nullable=True)),
        ("email", sa.Column("email", sa.String(255), nullable=True)),
        ("phone", sa.Column("phone", sa.String(64), nullable=True)),
        ("sites", sa.Column("sites", sa.Integer(), nullable=True)),
    ]
    for column_name, column in columns:
        if not _has_column("tenants", column_name):
            op.add_column("tenants", column)


def downgrade() -> None:
    for column_name in ("sites", "phone", "email", "timezone", "country"):
        if _has_column("tenants", column_name):
            op.drop_column("tenants", column_name)
