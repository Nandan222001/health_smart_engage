"""Create ai_conversations, ai_recommendations, and predictive_risk_scores tables

Revision ID: 0013_ai
Revises: 0012_files
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0013_ai"
down_revision = "0012_files"
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
        "ai_conversations",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("user_id", sa.String(64), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("answer", sa.Text(), nullable=True),
        sa.Column("source_citations", sa.JSON(), nullable=False),
        sa.Column("feedback", sa.String(64), nullable=True),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "ai_recommendations",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category", sa.String(128), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("priority", sa.String(64), nullable=False, server_default="medium"),
        sa.Column("status", sa.String(64), nullable=False, server_default="active"),
        sa.Column("actioned", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("dismissed", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("notes", sa.Text(), nullable=True),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "predictive_risk_scores",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("area_id", sa.String(64), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("trend", sa.JSON(), nullable=False),
        sa.Column("contributing_factors", sa.JSON(), nullable=False),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_predictive_risk_scores_area_id", "predictive_risk_scores", ["area_id"])


def downgrade() -> None:
    op.drop_index("ix_predictive_risk_scores_area_id", table_name="predictive_risk_scores")
    op.drop_table("predictive_risk_scores")
    op.drop_table("ai_recommendations")
    op.drop_table("ai_conversations")
