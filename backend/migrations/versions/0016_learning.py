"""Create ml_models, ml_model_versions, detected_patterns, operational_events tables

Revision ID: 0016_learning
Revises: 0015_outputs
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0016_learning"
down_revision = "0015_outputs"
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
        "ml_models",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("domain", sa.String(128), nullable=False),
        sa.Column("status", sa.String(64), nullable=False, server_default="active"),
        sa.Column("current_version", sa.String(64), nullable=False, server_default="v1.0"),
        sa.Column("accuracy", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("accuracy_delta", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("last_trained", sa.DateTime(timezone=True), nullable=True),
        sa.Column("next_scheduled", sa.DateTime(timezone=True), nullable=True),
        sa.Column("training_runs", sa.Integer(), nullable=False, server_default="0"),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "ml_model_versions",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("model_id", sa.String(64), nullable=False),
        sa.Column("version", sa.String(64), nullable=False),
        sa.Column("trained_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accuracy", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("precision", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("recall", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("f1_score", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("training_samples", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("validation_loss", sa.Float(), nullable=False, server_default="0.0"),
        *tenant_columns(),
        sa.ForeignKeyConstraint(["model_id"], ["ml_models.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ml_model_versions_model_id", "ml_model_versions", ["model_id"])

    op.create_table(
        "detected_patterns",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("pattern_type", sa.String(64), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("supporting_events", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("affected_module", sa.String(128), nullable=False),
        sa.Column("used_for_training", sa.Boolean(), nullable=False, server_default="0"),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "operational_events",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("source", sa.String(64), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("payload_size_kb", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("processed", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("features_extracted", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ingested_at", sa.DateTime(timezone=True), nullable=False),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("operational_events")
    op.drop_table("detected_patterns")
    op.drop_index("ix_ml_model_versions_model_id", table_name="ml_model_versions")
    op.drop_table("ml_model_versions")
    op.drop_table("ml_models")
