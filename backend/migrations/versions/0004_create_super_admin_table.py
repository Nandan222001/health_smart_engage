"""create super_admin table

Revision ID: 0004_create_super_admin_table
Revises: 0003
Create Date: 2026-05-23
"""

from alembic import op
import sqlalchemy as sa

revision = "0004_create_super_admin_table"
down_revision = "0003"
branch_labels = None
depends_on = None

SUPER_ADMIN_PASSWORD_HASH = "$pbkdf2-sha256$29000$oxTCWOtdy3mvldL6f.89Zw$coCIdl/qwoaae/njujHWzxLHIVF1o6QCG.A90qSmZYQ"


def upgrade() -> None:
    op.create_table(
        "super_admin",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
    )

    op.bulk_insert(
        sa.table(
            "super_admin",
            sa.column("id", sa.Integer),
            sa.column("name", sa.String),
            sa.column("email", sa.String),
            sa.column("password_hash", sa.String),
        ),
        [
            {
                "id": 1,
                "name": "System Super Admin",
                "email": "superadmin@example.com",
                "password_hash": SUPER_ADMIN_PASSWORD_HASH,
            }
        ],
    )


def downgrade() -> None:
    op.drop_table("super_admin")
