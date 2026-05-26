"""vendor: extend vendor table, add issuing_body to documents, add compliance model

Revision ID: 0021_vendor_extensions
Revises: 0020_tenant_user_schema
Create Date: 2026-05-26
"""

from alembic import op
import sqlalchemy as sa

revision = "0021_vendor_extensions"
down_revision = "0020_tenant_user_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Extend vendors table with operational fields
    with op.batch_alter_table("vendors") as batch_op:
        batch_op.add_column(sa.Column("email", sa.String(255), nullable=True))
        batch_op.add_column(sa.Column("phone", sa.String(64), nullable=True))
        batch_op.add_column(sa.Column("site_location", sa.String(255), nullable=True))
        batch_op.add_column(sa.Column("total_workers", sa.Integer(), nullable=True, server_default="0"))
        batch_op.add_column(sa.Column("on_site_workers", sa.Integer(), nullable=True, server_default="0"))
        batch_op.add_column(sa.Column("safety_score", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("risk_score", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("incident_count", sa.Integer(), nullable=True, server_default="0"))
        batch_op.add_column(sa.Column("contract_expiry", sa.Date(), nullable=True))
        batch_op.add_column(sa.Column("active_since", sa.Date(), nullable=True))

    # Add issuing_body to vendor_documents
    with op.batch_alter_table("vendor_documents") as batch_op:
        batch_op.add_column(sa.Column("issuing_body", sa.String(255), nullable=True))

    # Create vendor_compliance table
    op.create_table(
        "vendor_compliance",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("vendor_id", sa.String(64), sa.ForeignKey("vendors.id"), nullable=False, index=True),
        sa.Column("domain", sa.String(128), nullable=False),
        sa.Column("score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("assessed_at", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("vendor_compliance")
    with op.batch_alter_table("vendor_documents") as batch_op:
        batch_op.drop_column("issuing_body")
    with op.batch_alter_table("vendors") as batch_op:
        batch_op.drop_column("active_since")
        batch_op.drop_column("contract_expiry")
        batch_op.drop_column("incident_count")
        batch_op.drop_column("risk_score")
        batch_op.drop_column("safety_score")
        batch_op.drop_column("on_site_workers")
        batch_op.drop_column("total_workers")
        batch_op.drop_column("site_location")
        batch_op.drop_column("phone")
        batch_op.drop_column("email")
