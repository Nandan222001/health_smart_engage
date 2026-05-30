"""Add dedicated tables replacing generic_records writes

Revision ID: 0029_new_tables
Revises: 0028_sites
Create Date: 2026-05-31
"""

from alembic import op
import sqlalchemy as sa

revision = "0029_new_tables"
down_revision = "0028_sites"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Org Setup Data ─────────────────────────────────────────────────────────

    op.create_table(
        "org_profiles",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("organization_name", sa.String(255), nullable=True),
        sa.Column("industry_type", sa.String(128), nullable=True),
        sa.Column("employee_count", sa.String(64), nullable=True),
        sa.Column("official_email", sa.String(255), nullable=True),
        sa.Column("contact_number", sa.String(64), nullable=True),
        sa.Column("country", sa.String(128), nullable=True),
        sa.Column("headquarters_address", sa.Text, nullable=True),
        sa.Column("extra_fields", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )

    op.create_table(
        "org_compliance_setups",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("standards", sa.JSON, nullable=True),
        sa.Column("modules_enabled", sa.JSON, nullable=True),
        sa.Column("extra_fields", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )

    op.create_table(
        "org_workflow_configs",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("approval_levels", sa.JSON, nullable=True),
        sa.Column("escalation_rules", sa.JSON, nullable=True),
        sa.Column("notification_settings", sa.JSON, nullable=True),
        sa.Column("extra_fields", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )

    op.create_table(
        "org_ai_configs",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("ai_enabled", sa.Boolean, nullable=True),
        sa.Column("ai_features", sa.JSON, nullable=True),
        sa.Column("extra_fields", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )

    op.create_table(
        "org_activations",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("confirmed", sa.Boolean, nullable=False, default=False),
        sa.Column("extra_fields", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )

    op.create_table(
        "departments",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("manager", sa.String(255), nullable=True),
        sa.Column("teams", sa.String(128), nullable=True),
        sa.Column("site", sa.String(255), nullable=True),
        sa.Column("extra_fields", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )
    op.create_index("ix_departments_name", "departments", ["name"])

    op.create_table(
        "org_custom_roles",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("level", sa.String(64), nullable=True),
        sa.Column("modules", sa.Text, nullable=True),
        sa.Column("extra_fields", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )
    op.create_index("ix_org_custom_roles_name", "org_custom_roles", ["name"])

    op.create_table(
        "org_user_records",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("role", sa.String(128), nullable=True),
        sa.Column("department", sa.String(255), nullable=True),
        sa.Column("status", sa.String(64), nullable=False, default="pending"),
        sa.Column("extra_fields", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )
    op.create_index("ix_org_user_records_email", "org_user_records", ["email"])

    op.create_table(
        "org_import_records",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("module", sa.String(128), nullable=False),
        sa.Column("file_name", sa.String(255), nullable=True),
        sa.Column("record_count", sa.Integer, nullable=False, default=0),
        sa.Column("status", sa.String(64), nullable=False, default="imported"),
        sa.Column("extra_fields", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )
    op.create_index("ix_org_import_records_module", "org_import_records", ["module"])

    # ── Operations ─────────────────────────────────────────────────────────────

    op.create_table(
        "shifts",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("start_time", sa.String(32), nullable=True),
        sa.Column("end_time", sa.String(32), nullable=True),
        sa.Column("days", sa.JSON, nullable=True),
        sa.Column("status", sa.String(64), nullable=False, default="active"),
        sa.Column("extra_fields", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )

    op.create_table(
        "help_tickets",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("subject", sa.String(512), nullable=True),
        sa.Column("category", sa.String(128), nullable=True),
        sa.Column("priority", sa.String(64), nullable=False, default="medium"),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("status", sa.String(64), nullable=False, default="open"),
        sa.Column("extra_fields", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )

    op.create_table(
        "data_imports",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("file_name", sa.String(512), nullable=False),
        sa.Column("import_type", sa.String(64), nullable=False, default="excel"),
        sa.Column("data_type", sa.String(128), nullable=True),
        sa.Column("records_total", sa.Integer, nullable=False, default=0),
        sa.Column("records_success", sa.Integer, nullable=False, default=0),
        sa.Column("records_failed", sa.Integer, nullable=False, default=0),
        sa.Column("status", sa.String(64), nullable=False, default="success"),
        sa.Column("uploaded_by", sa.String(128), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )

    op.create_table(
        "validation_logs",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("import_id", sa.String(64), nullable=True),
        sa.Column("file_name", sa.String(512), nullable=True),
        sa.Column("rule", sa.String(255), nullable=True),
        sa.Column("status", sa.String(64), nullable=False, default="pass"),
        sa.Column("records_affected", sa.Integer, nullable=False, default=0),
        sa.Column("message", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )
    op.create_index("ix_validation_logs_import_id", "validation_logs", ["import_id"])

    op.create_table(
        "api_integrations",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("integration_type", sa.String(128), nullable=True),
        sa.Column("endpoint_url", sa.Text, nullable=True),
        sa.Column("api_key", sa.String(512), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, default=True),
        sa.Column("last_sync", sa.String(128), nullable=True),
        sa.Column("records_synced", sa.Integer, nullable=False, default=0),
        sa.Column("extra_fields", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )

    op.create_table(
        "sync_integrations",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("integration_type", sa.String(128), nullable=True),
        sa.Column("last_sync", sa.String(128), nullable=True),
        sa.Column("status", sa.String(64), nullable=False, default="active"),
        sa.Column("records_synced", sa.Integer, nullable=False, default=0),
        sa.Column("extra_fields", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )

    op.create_table(
        "zones",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("site_id", sa.String(64), nullable=True),
        sa.Column("zone_type", sa.String(128), nullable=True),
        sa.Column("status", sa.String(64), nullable=False, default="active"),
        sa.Column("extra_fields", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )
    op.create_index("ix_zones_name", "zones", ["name"])
    op.create_index("ix_zones_site_id", "zones", ["site_id"])

    op.create_table(
        "escalation_rules",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("trigger_condition", sa.String(512), nullable=True),
        sa.Column("escalate_to", sa.String(255), nullable=True),
        sa.Column("time_limit_hours", sa.Integer, nullable=True),
        sa.Column("status", sa.String(64), nullable=False, default="active"),
        sa.Column("extra_fields", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )

    op.create_table(
        "generated_reports",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("name", sa.String(512), nullable=False),
        sa.Column("report_type", sa.String(128), nullable=False),
        sa.Column("format", sa.String(32), nullable=False, default="pdf"),
        sa.Column("period_start", sa.String(64), nullable=True),
        sa.Column("period_end", sa.String(64), nullable=True),
        sa.Column("status", sa.String(64), nullable=False, default="ready"),
        sa.Column("size", sa.String(64), nullable=True),
        sa.Column("created_by", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )

    # ── Knowledge ──────────────────────────────────────────────────────────────

    op.create_table(
        "knowledge_chunks",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("doc_id", sa.String(64), nullable=False),
        sa.Column("title", sa.String(255), nullable=True),
        sa.Column("chunk_index", sa.Integer, nullable=False, default=0),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("tokens", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )
    op.create_index("ix_knowledge_chunks_doc_id", "knowledge_chunks", ["doc_id"])

    # ── Incidents ──────────────────────────────────────────────────────────────

    op.create_table(
        "incident_rcas",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("incident_id", sa.String(64), sa.ForeignKey("incidents.id"), nullable=False),
        sa.Column("method", sa.String(128), nullable=True),
        sa.Column("root_cause", sa.Text, nullable=True),
        sa.Column("contributing_factors", sa.JSON, nullable=True),
        sa.Column("status", sa.String(64), nullable=False, default="draft"),
        sa.Column("extra_fields", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )
    op.create_index("ix_incident_rcas_incident_id", "incident_rcas", ["incident_id"])

    op.create_table(
        "corrective_actions",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, index=True),
        sa.Column("incident_id", sa.String(64), nullable=True),
        sa.Column("title", sa.String(512), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("assigned_to", sa.String(255), nullable=True),
        sa.Column("due_date", sa.String(64), nullable=True),
        sa.Column("status", sa.String(64), nullable=False, default="open"),
        sa.Column("extra_fields", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )
    op.create_index("ix_corrective_actions_incident_id", "corrective_actions", ["incident_id"])

    # ── KnowledgeDocument new columns ─────────────────────────────────────────
    op.add_column("knowledge_documents", sa.Column("file_name", sa.String(512), nullable=True))
    op.add_column("knowledge_documents", sa.Column("file_type", sa.String(32), nullable=True))
    op.add_column("knowledge_documents", sa.Column("category", sa.String(64), nullable=True))
    op.add_column("knowledge_documents", sa.Column("size", sa.String(64), nullable=True))
    op.add_column("knowledge_documents", sa.Column("uploaded_by", sa.String(255), nullable=True))
    op.add_column("knowledge_documents", sa.Column("indexed", sa.Boolean, nullable=True, default=False))
    op.add_column("knowledge_documents", sa.Column("record_type", sa.String(128), nullable=True))
    op.add_column("knowledge_documents", sa.Column("extra_fields", sa.JSON, nullable=True))


def downgrade() -> None:
    op.drop_table("corrective_actions")
    op.drop_table("incident_rcas")
    op.drop_table("knowledge_chunks")
    op.drop_table("generated_reports")
    op.drop_table("escalation_rules")
    op.drop_table("zones")
    op.drop_table("sync_integrations")
    op.drop_table("api_integrations")
    op.drop_table("validation_logs")
    op.drop_table("data_imports")
    op.drop_table("help_tickets")
    op.drop_table("shifts")
    op.drop_table("org_import_records")
    op.drop_table("org_user_records")
    op.drop_table("org_custom_roles")
    op.drop_table("departments")
    op.drop_table("org_activations")
    op.drop_table("org_ai_configs")
    op.drop_table("org_workflow_configs")
    op.drop_table("org_compliance_setups")
    op.drop_table("org_profiles")
    op.drop_column("knowledge_documents", "extra_fields")
    op.drop_column("knowledge_documents", "record_type")
    op.drop_column("knowledge_documents", "indexed")
    op.drop_column("knowledge_documents", "uploaded_by")
    op.drop_column("knowledge_documents", "size")
    op.drop_column("knowledge_documents", "category")
    op.drop_column("knowledge_documents", "file_type")
    op.drop_column("knowledge_documents", "file_name")
