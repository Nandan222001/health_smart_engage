"""initial full HSE schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-05-17
"""

from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def tenant_columns() -> list[sa.Column]:
    return [
        sa.Column("tenant_id", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    ]


def upgrade() -> None:
    op.create_table(
        "tenants",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "organisation_nodes",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("parent_id", sa.String(length=64), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("node_type", sa.String(length=64), nullable=False),
        sa.Column("settings", sa.JSON(), nullable=False),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.Column("organisation_node_id", sa.String(length=64), nullable=True),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "roles",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("is_system", sa.Boolean(), nullable=False),
        sa.Column("permissions", sa.JSON(), nullable=False),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "employees",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("employee_code", sa.String(length=64), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("role_name", sa.String(length=128), nullable=False),
        sa.Column("department_id", sa.String(length=64), nullable=True),
        sa.Column("contact", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=64), nullable=False),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "certifications",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("employee_id", sa.String(length=64), nullable=False),
        sa.Column("certification_type", sa.String(length=128), nullable=False),
        sa.Column("issue_date", sa.Date(), nullable=True),
        sa.Column("expiry_date", sa.Date(), nullable=True),
        sa.Column("evidence_file_id", sa.String(length=64), nullable=True),
        sa.Column("status", sa.String(length=64), nullable=False),
        *tenant_columns(),
        sa.ForeignKeyConstraint(["employee_id"], ["employees.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "training_requirements",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("role_name", sa.String(length=128), nullable=False),
        sa.Column("training_name", sa.String(length=255), nullable=False),
        sa.Column("validity_days", sa.Integer(), nullable=True),
        sa.Column("is_mandatory", sa.Boolean(), nullable=False),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "training_completions",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("employee_id", sa.String(length=64), nullable=False),
        sa.Column("training_requirement_id", sa.String(length=64), nullable=True),
        sa.Column("completed_on", sa.Date(), nullable=False),
        sa.Column("trainer", sa.String(length=255), nullable=True),
        sa.Column("evidence_file_id", sa.String(length=64), nullable=True),
        *tenant_columns(),
        sa.ForeignKeyConstraint(["employee_id"], ["employees.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "vendors",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("company_name", sa.String(length=255), nullable=False),
        sa.Column("contact", sa.String(length=255), nullable=True),
        sa.Column("trade_type", sa.String(length=128), nullable=False),
        sa.Column("status", sa.String(length=64), nullable=False),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "vendor_documents",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("vendor_id", sa.String(length=64), nullable=False),
        sa.Column("document_type", sa.String(length=128), nullable=False),
        sa.Column("file_id", sa.String(length=64), nullable=True),
        sa.Column("expiry_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.Column("review_comment", sa.Text(), nullable=True),
        *tenant_columns(),
        sa.ForeignKeyConstraint(["vendor_id"], ["vendors.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "assets",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("asset_code", sa.String(length=128), nullable=False),
        sa.Column("category", sa.String(length=128), nullable=False),
        sa.Column("location_id", sa.String(length=64), nullable=True),
        sa.Column("criticality", sa.String(length=64), nullable=False),
        sa.Column("manufacturer", sa.String(length=255), nullable=True),
        sa.Column("compliance_status", sa.String(length=64), nullable=False),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "asset_inspections",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("asset_id", sa.String(length=64), nullable=False),
        sa.Column("inspection_type", sa.String(length=128), nullable=False),
        sa.Column("inspected_on", sa.Date(), nullable=False),
        sa.Column("inspector_user_id", sa.String(length=64), nullable=False),
        sa.Column("result", sa.String(length=64), nullable=False),
        sa.Column("evidence_file_id", sa.String(length=64), nullable=True),
        *tenant_columns(),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "risk_assessments",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("task_name", sa.String(length=255), nullable=True),
        sa.Column("location_id", sa.String(length=64), nullable=True),
        sa.Column("asset_id", sa.String(length=64), nullable=True),
        sa.Column("hazard_description", sa.Text(), nullable=False),
        sa.Column("likelihood", sa.Integer(), nullable=False),
        sa.Column("consequence", sa.Integer(), nullable=False),
        sa.Column("risk_score", sa.Integer(), nullable=False),
        sa.Column("residual_risk_score", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=64), nullable=False),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "hazard_observations",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("location_id", sa.String(length=64), nullable=True),
        sa.Column("severity", sa.String(length=64), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("photo_file_id", sa.String(length=64), nullable=True),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.Column("assigned_to_user_id", sa.String(length=64), nullable=True),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "permits",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("permit_ref", sa.String(length=128), nullable=False),
        sa.Column("permit_type", sa.String(length=128), nullable=False),
        sa.Column("requester_user_id", sa.String(length=64), nullable=False),
        sa.Column("asset_id", sa.String(length=64), nullable=True),
        sa.Column("zone_id", sa.String(length=64), nullable=True),
        sa.Column("risk_assessment_id", sa.String(length=64), nullable=True),
        sa.Column("vendor_id", sa.String(length=64), nullable=True),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.Column("controls", sa.JSON(), nullable=False),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "permit_approvals",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("permit_id", sa.String(length=64), nullable=False),
        sa.Column("approver_user_id", sa.String(length=64), nullable=False),
        sa.Column("decision", sa.String(length=64), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("gps_location", sa.String(length=255), nullable=True),
        *tenant_columns(),
        sa.ForeignKeyConstraint(["permit_id"], ["permits.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "audit_checklists",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("standard", sa.String(length=128), nullable=False),
        sa.Column("version", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=64), nullable=False),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "audit_executions",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("checklist_id", sa.String(length=64), nullable=False),
        sa.Column("site_id", sa.String(length=64), nullable=True),
        sa.Column("auditor_user_id", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.Column("answers", sa.JSON(), nullable=False),
        *tenant_columns(),
        sa.ForeignKeyConstraint(["checklist_id"], ["audit_checklists.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "findings",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("audit_id", sa.String(length=64), nullable=True),
        sa.Column("source_type", sa.String(length=64), nullable=False),
        sa.Column("severity", sa.String(length=64), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("iso_clause", sa.String(length=128), nullable=True),
        sa.Column("status", sa.String(length=64), nullable=False),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "capas",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("source_type", sa.String(length=64), nullable=False),
        sa.Column("source_id", sa.String(length=64), nullable=True),
        sa.Column("owner_user_id", sa.String(length=64), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("severity", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.Column("evidence_file_id", sa.String(length=64), nullable=True),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "incidents",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("incident_ref", sa.String(length=128), nullable=False),
        sa.Column("reporter_user_id", sa.String(length=64), nullable=False),
        sa.Column("incident_type", sa.String(length=128), nullable=False),
        sa.Column("severity", sa.String(length=64), nullable=False),
        sa.Column("location_id", sa.String(length=64), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("is_confidential", sa.Boolean(), nullable=False),
        sa.Column("status", sa.String(length=64), nullable=False),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "investigations",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("incident_id", sa.String(length=64), nullable=False),
        sa.Column("lead_user_id", sa.String(length=64), nullable=False),
        sa.Column("rca_method", sa.String(length=64), nullable=False),
        sa.Column("findings", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=64), nullable=False),
        *tenant_columns(),
        sa.ForeignKeyConstraint(["incident_id"], ["incidents.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "knowledge_documents",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("document_type", sa.String(length=128), nullable=False),
        sa.Column("version", sa.String(length=64), nullable=False),
        sa.Column("file_id", sa.String(length=64), nullable=True),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.Column("tags", sa.JSON(), nullable=False),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "file_objects",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=128), nullable=True),
        sa.Column("storage_url", sa.String(length=1024), nullable=True),
        sa.Column("checksum", sa.String(length=128), nullable=True),
        sa.Column("status", sa.String(length=64), nullable=False),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "ai_conversations",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("answer", sa.Text(), nullable=True),
        sa.Column("source_citations", sa.JSON(), nullable=False),
        sa.Column("feedback", sa.String(length=64), nullable=True),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "predictive_risk_scores",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("area_id", sa.String(length=64), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("trend", sa.JSON(), nullable=False),
        sa.Column("contributing_factors", sa.JSON(), nullable=False),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "mobile_sync_items",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("client_item_id", sa.String(length=128), nullable=False),
        sa.Column("operation", sa.String(length=128), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("sync_status", sa.String(length=64), nullable=False),
        sa.Column("conflict_details", sa.JSON(), nullable=False),
        *tenant_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("tenant_id", sa.String(length=64), nullable=False),
        sa.Column("actor_user_id", sa.String(length=64), nullable=False),
        sa.Column("action", sa.String(length=128), nullable=False),
        sa.Column("resource_type", sa.String(length=128), nullable=False),
        sa.Column("resource_id", sa.String(length=128), nullable=True),
        sa.Column("details", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "generic_records",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("tenant_id", sa.String(length=64), nullable=False),
        sa.Column("module", sa.String(length=128), nullable=False),
        sa.Column("record_type", sa.String(length=128), nullable=False),
        sa.Column("external_ref", sa.String(length=128), nullable=True),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    for table, columns in {
        "audit_logs": ["tenant_id", "created_at"],
        "generic_records": ["tenant_id", "module", "record_type"],
        "permits": ["tenant_id", "status", "permit_ref"],
        "incidents": ["tenant_id", "incident_ref"],
        "employees": ["tenant_id", "employee_code"],
        "vendors": ["tenant_id"],
        "assets": ["tenant_id", "asset_code"],
        "mobile_sync_items": ["tenant_id", "user_id"],
    }.items():
        for column in columns:
            op.create_index(f"ix_{table}_{column}", table, [column])


def downgrade() -> None:
    for table in [
        "generic_records",
        "audit_logs",
        "mobile_sync_items",
        "predictive_risk_scores",
        "ai_conversations",
        "file_objects",
        "knowledge_documents",
        "investigations",
        "incidents",
        "capas",
        "findings",
        "audit_executions",
        "audit_checklists",
        "permit_approvals",
        "permits",
        "hazard_observations",
        "risk_assessments",
        "asset_inspections",
        "assets",
        "vendor_documents",
        "vendors",
        "training_completions",
        "training_requirements",
        "certifications",
        "employees",
        "roles",
        "users",
        "organisation_nodes",
        "tenants",
    ]:
        op.drop_table(table)
