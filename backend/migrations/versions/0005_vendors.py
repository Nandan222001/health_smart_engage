"""Create vendors and vendor_documents tables

Revision ID: 0005_vendors
Revises: 0004_people
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0005_vendors"
down_revision = "0004_people"
branch_labels = None
depends_on = None


def tenant_columns():
    return [
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    ]


def upgrade() -> None:
    op.create_table(
        "vendors",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("company_name", sa.String(255), nullable=False),
        sa.Column("contact", sa.String(255), nullable=True),
        sa.Column("trade_type", sa.String(128), nullable=False),
        sa.Column("status", sa.String(64), nullable=False, server_default="pending_approval"),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "vendor_documents",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("vendor_id", sa.String(64), nullable=False),
        sa.Column("document_type", sa.String(128), nullable=False),
        sa.Column("file_id", sa.String(64), nullable=True),
        sa.Column("expiry_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(64), nullable=False, server_default="pending_review"),
        sa.Column("review_comment", sa.Text(), nullable=True),
        *tenant_columns(),
        sa.ForeignKeyConstraint(["vendor_id"], ["vendors.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("vendor_documents")
    op.drop_table("vendors")
