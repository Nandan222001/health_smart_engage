"""Record user credential fields

Revision ID: 0002_users_password_hash
Revises: 0003_auth
Create Date: 2026-05-23
"""

revision = "0002_users_password_hash"
down_revision = "0003_auth"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # password_hash is already created with the users table in 0003_auth.
    pass


def downgrade() -> None:
    pass
