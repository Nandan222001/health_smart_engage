"""Add extra_fields + nullable checklist_id to permits, audit_executions, capas, hazard_observations.

Revision ID: 0026_model_extra_fields
Revises: 0025_extra_fields
Create Date: 2026-05-29
"""
from alembic import op
import sqlalchemy as sa

revision = "0026_model_extra_fields"
down_revision = "0025_extra_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # title may already exist on permits from earlier work
    try:
        op.add_column("permits", sa.Column("title", sa.String(255), nullable=True))
    except Exception:
        pass
    op.add_column("permits",           sa.Column("extra_fields", sa.JSON(),       nullable=True))
    op.add_column("audit_executions",  sa.Column("extra_fields", sa.JSON(),       nullable=True))
    op.add_column("capas",             sa.Column("extra_fields", sa.JSON(),       nullable=True))
    op.add_column("hazard_observations",sa.Column("extra_fields",sa.JSON(),       nullable=True))
    # Make audit_executions.checklist_id nullable for direct imports
    op.alter_column("audit_executions", "checklist_id",
                    existing_type=sa.String(64), nullable=True)


def downgrade() -> None:
    op.drop_column("permits",           "extra_fields")
    op.drop_column("permits",           "title")
    op.drop_column("audit_executions",  "extra_fields")
    op.drop_column("capas",             "extra_fields")
    op.drop_column("hazard_observations","extra_fields")
    op.alter_column("audit_executions", "checklist_id",
                    existing_type=sa.String(64), nullable=False)
