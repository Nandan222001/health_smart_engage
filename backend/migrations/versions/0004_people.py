"""Create employees, certifications, training_requirements, training_completions tables

Revision ID: 0004_people
Revises: 0003_auth
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0004_people"
down_revision = "0003_auth"
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
        "employees",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("employee_code", sa.String(64), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("role_name", sa.String(128), nullable=False),
        sa.Column("department_id", sa.String(64), nullable=True),
        sa.Column("contact", sa.String(255), nullable=True),
        sa.Column("status", sa.String(64), nullable=False, server_default="active"),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_employees_employee_code", "employees", ["employee_code"])

    op.create_table(
        "certifications",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("employee_id", sa.String(64), nullable=False),
        sa.Column("certification_type", sa.String(128), nullable=False),
        sa.Column("issue_date", sa.Date(), nullable=True),
        sa.Column("expiry_date", sa.Date(), nullable=True),
        sa.Column("evidence_file_id", sa.String(64), nullable=True),
        sa.Column("status", sa.String(64), nullable=False, server_default="active"),
        *tenant_columns(),
        sa.ForeignKeyConstraint(["employee_id"], ["employees.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "training_requirements",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("role_name", sa.String(128), nullable=False),
        sa.Column("training_name", sa.String(255), nullable=False),
        sa.Column("validity_days", sa.Integer(), nullable=True),
        sa.Column("is_mandatory", sa.Boolean(), nullable=False),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_training_requirements_role_name", "training_requirements", ["role_name"])

    op.create_table(
        "training_completions",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("employee_id", sa.String(64), nullable=False),
        sa.Column("training_requirement_id", sa.String(64), nullable=True),
        sa.Column("completed_on", sa.Date(), nullable=False),
        sa.Column("trainer", sa.String(255), nullable=True),
        sa.Column("evidence_file_id", sa.String(64), nullable=True),
        *tenant_columns(),
        sa.ForeignKeyConstraint(["employee_id"], ["employees.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("training_completions")
    op.drop_index("ix_training_requirements_role_name", table_name="training_requirements")
    op.drop_table("training_requirements")
    op.drop_table("certifications")
    op.drop_index("ix_employees_employee_code", table_name="employees")
    op.drop_table("employees")
