"""Add missing tenant and user columns

Revision ID: 0020_tenant_user_schema
Revises: 0019_superadmin_features
Create Date: 2026-05-24
"""

from alembic import op
import sqlalchemy as sa

revision = "0020_tenant_user_schema"
down_revision = "0019_superadmin_features"
branch_labels = None
depends_on = None


def _has_column(table: str, column: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return any(c["name"] == column for c in inspector.get_columns(table))


def upgrade() -> None:
    # tenants: add columns the model expects but DB is missing
    tenant_cols = [
        ("org_code",        sa.Column("org_code", sa.String(64), nullable=True)),
        ("contact_email",   sa.Column("contact_email", sa.String(255), nullable=True)),
        ("employee_count",  sa.Column("employee_count", sa.Integer(), nullable=True, server_default="0")),
        ("sites_count",     sa.Column("sites_count", sa.Integer(), nullable=True, server_default="0")),
    ]
    for col_name, col_def in tenant_cols:
        if not _has_column("tenants", col_name):
            op.add_column("tenants", col_def)

    # users: add is_superadmin flag
    if not _has_column("users", "is_superadmin"):
        op.add_column("users", sa.Column("is_superadmin", sa.Boolean(), nullable=False, server_default="0"))


def downgrade() -> None:
    for col in ("sites_count", "employee_count", "contact_email", "org_code"):
        if _has_column("tenants", col):
            op.drop_column("tenants", col)
    if _has_column("users", "is_superadmin"):
        op.drop_column("users", "is_superadmin")
