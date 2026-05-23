from typing import Any
from sqlalchemy.orm import Session
from app.core.security import CurrentUser


def _to_dict(obj) -> dict:
    """Serialize a SQLAlchemy model instance to a plain dict, stripping internal state."""
    return {k: v for k, v in obj.__dict__.items() if not k.startswith("_")}
from app.services.ai_service import AiService
from app.services.file_storage_service import FileStorageService
from app.services.mobile_sync_service import MobileSyncService
from app.services.notification_service import NotificationService
from app.services.report_service import ReportService
from app.services.workflow_service import WorkflowService
from app.services.permit_service import PermitService
from app.services.people_service import PeopleService
from app.services.asset_service import AssetService
from app.services.compliance_service import ComplianceService
from app.services.dashboard_service import DashboardService
from app.services.foundation_service import FoundationService
from app.services.vendor_service import VendorService
from app.services.knowledge_service import KnowledgeService
# New services
from app.services.workflow_engine_service import WorkflowEngineService
from app.services.ai_intelligence_service import AIIntelligenceService
from app.services.outputs_service import OutputsService
from app.services.learning_service import LearningService
from app.services.superadmin_service import SuperAdminService
from app.services.auth_service import AuthService
from app.services.invitation_service import InvitationService
from app.services.subscription_service import SubscriptionService
from app.services.platform_config_service import PlatformConfigService
from app.services.notification_template_service import NotificationTemplateService
from app.services.org_setup_service import OrgSetupService

class DomainDispatcher:
    def __init__(self):
        self.workflow = WorkflowService()
        self.notifications = NotificationService()
        self.files = FileStorageService()
        self.reports = ReportService()
        self.mobile_sync = MobileSyncService()
        self.ai = AiService()

    def _get_services(self, db: Session):
        return {
            "permits": PermitService(db),
            "people": PeopleService(db),
            "assets": AssetService(db),
            "compliance": ComplianceService(db),
            "dashboards": DashboardService(db),
            "foundation": FoundationService(db),
            "vendors": VendorService(db),
            "knowledge": KnowledgeService(db),
            "sync": MobileSyncService(db),
            "notifications": NotificationService(db),
            "workflow_engine": WorkflowEngineService(db),
            "ai_intelligence": AIIntelligenceService(db),
            "outputs": OutputsService(db),
            "learning": LearningService(db),
            "superadmin": SuperAdminService(db),
            "auth": AuthService(db),
            "invitations": InvitationService(db),
            "subscriptions": SubscriptionService(db),
            "platform_config": PlatformConfigService(db),
            "notif_templates": NotificationTemplateService(db),
            "org_setup": OrgSetupService(db),
        }

    def execute_special_command(
        self,
        user: CurrentUser,
        operation: str,
        payload: dict[str, Any],
        path_params: dict[str, Any],
        db: Session = None
    ) -> dict[str, Any] | None:
        data = payload.get("data", payload)
        svc = self._get_services(db) if db else {}

        # Auth Commands
        if operation == "auth_login":
            return svc["auth"].login(data.get("email", ""), data.get("password", ""))
        if operation == "auth_logout":
            return {"message": "Logged out successfully"}

        # Mobile Specific Commands
        if operation == "mobile_notification_read":
            return svc["notifications"].mark_read(user, path_params.get("notificationId"))
        if operation == "mobile_sync_conflict_resolve":
            return svc["sync"].resolve_conflict(user.user_id, user.tenant_id, path_params.get("conflictId"), data.get("decision"))
        if operation == "mobile_contractors_scan":
            # Simplified: lookup vendor status
            vendor_id = data.get("vendorId") or data.get("vendor_id")
            vendor = svc["vendors"].get_vendor(user, vendor_id)
            return {"status": vendor.status, "access": "allowed" if vendor.status == "approved" else "denied"}
        if operation == "mobile_audit_complete":
            # Real logic would finalize AuditExecution
            return {"id": path_params.get("auditId"), "status": "completed"}

        # Knowledge Commands
        if operation == "mobile_knowledge_acknowledge":
            res = svc["knowledge"].acknowledge_document(user, path_params.get("documentId"), data)
            return {"id": res.id}
        
        # Vendor Commands
        if operation == "vendors_create":
            res = svc["vendors"].create_vendor(user, data)
            return {"id": res.id, "status": res.status}
        if operation == "vendor_documents_upload":
            res = svc["vendors"].upload_vendor_document(user, path_params.get("vendorId"), data)
            return {"id": res.id}
        if operation == "vendor_documents_review":
            res = svc["vendors"].review_vendor_document(user, path_params.get("documentId"), data)
            return {"id": res.id, "status": res.status}

        # Foundation Commands
        if operation in ("admin_org_nodes_create", "admin_organisation_nodes_create"):
            res = svc["foundation"].create_organisation_node(user, data)
            return {"id": res.id}
        if operation in ("admin_user_invitations_create", "admin_users_invitations_create"):
            res = svc["foundation"].invite_user(user, data)
            return {"id": res.id, "status": res.status}
        if operation == "admin_roles_create":
            res = svc["foundation"].create_role(user, data)
            return {"id": res.id}
        if operation == "admin_roles_update":
            res = svc["foundation"].update_role(user, path_params.get("roleId"), data)
            return {"id": res.id}

        # Permit Commands
        if operation in ["permits_create", "mobile_permits_create"]:
            res = svc["permits"].create_permit(user, data)
            return {"id": res.id, "ref": res.permit_ref, "status": res.status}
        if operation == "permits_submit":
            res = svc["permits"].submit_permit(user, path_params.get("permitId"))
            return {"id": res.id, "status": res.status}
        if operation in ["permits_approve", "mobile_permits_approve"]:
            res = svc["permits"].approve_permit(user, path_params.get("permitId"), data)
            return {"id": res.id, "status": res.status}
        if operation in ["permits_reject", "mobile_permits_reject"]:
            res = svc["permits"].reject_permit(user, path_params.get("permitId"), data)
            return {"id": res.id, "status": res.status}
        if operation == "permits_close" or operation == "mobile_permits_close":
            res = svc["permits"].close_permit(user, path_params.get("permitId"), data)
            return {"id": res.id, "status": res.status}
        if operation == "permits_override_conflict":
            res = svc["permits"].override_conflict(user, path_params.get("permitId"), data)
            return {"id": res.id, "status": res.status}

        # People & Training Commands
        if operation == "employees_create":
            res = svc["people"].create_employee(user, data)
            return {"id": res.id}
        if operation == "employee_certifications_create":
            res = svc["people"].add_certification(user, path_params.get("employeeId"), data)
            return {"id": res.id}

        # Asset Commands
        if operation == "assets_create":
            res = svc["assets"].create_asset(user, data)
            return {"id": res.id}
        if operation in ["asset_inspections_create", "mobile_asset_inspections_create"]:
            res = svc["assets"].record_inspection(user, path_params.get("assetId"), data)
            return {"id": res.id}

        # Compliance Commands
        if operation == "audits_create":
            res = svc["compliance"].create_audit_execution(user, data)
            return {"id": res.id}
        if operation == "audit_findings_create":
            res = svc["compliance"].create_finding(user, path_params.get("auditId"), data)
            return {"id": res.id}
        if operation == "incidents_classify":
            res = svc["compliance"].classify_incident(user, path_params.get("incidentId"), data)
            return {"id": res.id, "status": res.status}
        if operation == "incident_investigations_create":
            res = svc["compliance"].start_investigation(user, path_params.get("incidentId"), data)
            return {"id": res.id}
        if operation == "capas_submit_closure":
            res = svc["compliance"].submit_capa_closure(user, path_params.get("capaId"), data)
            return {"id": res.id, "status": res.status}
        if operation == "capas_approve_closure":
            res = svc["compliance"].approve_capa_closure(user, path_params.get("capaId"), data)
            return {"id": res.id, "status": res.status}

        # Integration Commands
        if operation == "integrations_hr_employees_upsert":
            res = svc["people"].create_employee(user, data)
            return {"id": res.id, "status": "upserted"}
        if operation == "integrations_assets_upsert":
            res = svc["assets"].create_asset(user, data)
            return {"id": res.id, "status": "upserted"}

        # ── Workflow Engine Commands ──────────────────────────────────────────
        if operation == "workflow_cases_approve":
            return svc["workflow_engine"].approve_case(
                user, path_params.get("caseId"), path_params.get("approvalId"), data
            )
        if operation == "workflow_cases_reject":
            return svc["workflow_engine"].reject_case(
                user, path_params.get("caseId"), path_params.get("approvalId"), data
            )
        if operation == "workflow_cases_escalate":
            return svc["workflow_engine"].escalate_case(user, path_params.get("caseId"), data)
        if operation == "workflow_cases_advance":
            return svc["workflow_engine"].advance_stage(user, path_params.get("caseId"), data)
        if operation == "workflow_resolutions_evidence":
            return svc["workflow_engine"].submit_evidence(user, path_params.get("resolutionId"), data)
        if operation == "workflow_resolutions_verify":
            return svc["workflow_engine"].verify_resolution(user, path_params.get("resolutionId"), data)
        if operation == "workflow_alerts_acknowledge":
            return svc["workflow_engine"].acknowledge_alert(user, path_params.get("alertId"))

        # ── AI Intelligence Commands ──────────────────────────────────────────
        if operation == "ai_intelligence_models_retrain":
            return svc["ai_intelligence"].trigger_retraining(user, data)
        if operation == "ai_recommendations_dismiss":
            return svc["ai_intelligence"].dismiss_recommendation(user, path_params.get("recommendationId"))
        if operation == "ai_recommendations_act":
            return svc["ai_intelligence"].act_on_recommendation(user, path_params.get("recommendationId"), data)

        # ── Outputs Commands ──────────────────────────────────────────────────
        if operation == "outputs_reports_generate":
            return svc["outputs"].generate_report(user, data)
        if operation == "outputs_insights_action":
            return svc["outputs"].action_insight(user, path_params.get("insightId"))
        if operation == "outputs_alert_rules_update":
            return svc["outputs"].update_alert_rule(user, path_params.get("ruleId"), data)
        if operation == "outputs_exports_create":
            return svc["outputs"].create_export(user, data)

        # ── Learning Commands ─────────────────────────────────────────────────
        if operation == "learning_models_train":
            return svc["learning"].trigger_training(user, data)
        if operation == "learning_models_promote":
            return svc["learning"].promote_version(user, data)

        # ── Super Admin Commands ──────────────────────────────────────────────
        if operation == "superadmin_tenants_create":
            return svc["superadmin"].create_tenant(data)
        if operation == "superadmin_tenants_update":
            return svc["superadmin"].update_tenant(path_params.get("tenantId"), data)

        # Invitations
        if operation == "superadmin_invitations_create":
            return svc["invitations"].create_invitation(user, data)
        if operation == "superadmin_invitations_update":
            return svc["invitations"].update_invitation(path_params.get("invitationId"), data)
        if operation == "superadmin_invitations_resend":
            return svc["invitations"].resend_invitation(path_params.get("invitationId"))
        if operation == "superadmin_invitations_cancel":
            return svc["invitations"].cancel_invitation(path_params.get("invitationId"))

        # Subscription plans
        if operation == "superadmin_plans_create":
            return svc["subscriptions"].create_plan(data)
        if operation == "superadmin_plans_update":
            return svc["subscriptions"].update_plan(path_params.get("planId"), data)
        if operation == "superadmin_tenant_subscription":
            return svc["subscriptions"].assign_to_tenant(path_params.get("tenantId"), data)

        # Notification templates
        if operation == "superadmin_notif_templates_create":
            return svc["notif_templates"].create_template(data)
        if operation == "superadmin_notif_templates_update":
            return svc["notif_templates"].update_template(path_params.get("templateId"), data)
        if operation == "superadmin_notif_templates_delete":
            return svc["notif_templates"].delete_template(path_params.get("templateId"))

        # Security/compliance config
        if operation == "superadmin_security_policy_update":
            return svc["platform_config"].update_security_policy(data)
        if operation == "superadmin_compliance_config_update":
            return svc["platform_config"].update_compliance_config(data)

        # Original Generic Logic
        if operation == "integrations_documents_upload_url":
            file_name = data.get("fileName") or data.get("file_name") or "upload.bin"
            target = self.files.create_upload_target(file_name, data.get("contentType"))
            return {"upload": target.__dict__}
        if operation == "reports_generate" or operation.startswith("reports_"):
            return self.reports.generate(operation, data)
        if operation == "mobile_sync_pull":
            return self.mobile_sync.pull(user.user_id, data.get("lastSyncToken"))
        if operation == "mobile_sync_push":
            return self.mobile_sync.push(user.user_id, data.get("changes", []))
        if operation.startswith("ai_advisor_query") or operation == "mobile_ai_advisor_query":
            return self.ai.answer(data.get("question", ""), data)

        # ── Org Admin Commands ────────────────────────────────────────────────
        if operation == "org_admin_shifts_create":
            from app.repositories.generic_repository import GenericRepository
            import uuid
            repo = GenericRepository(db)
            payload = {**data, "id": str(uuid.uuid4()), "status": "active"}
            repo.create(tenant_id=user.tenant_id, module="org_admin", record_type="shift", payload=payload, status="active")
            return {"status": "created", "id": payload["id"]}

        if operation == "org_admin_shifts_update":
            return {"status": "updated", "id": path_params.get("shiftId")}

        if operation == "org_admin_shifts_delete":
            return {"status": "deleted", "id": path_params.get("shiftId")}

        if operation == "org_admin_import_create":
            from app.repositories.generic_repository import GenericRepository
            import uuid
            repo = GenericRepository(db)
            record = repo.create(tenant_id=user.tenant_id, module="org_admin", record_type="data_import", payload=data, status="processing")
            return {"status": "processing", "id": record.id}

        if operation == "org_admin_sync_trigger":
            return {"status": "sync_triggered", "integration": data.get("integration", "all")}

        if operation == "org_admin_tickets_create":
            from app.repositories.generic_repository import GenericRepository
            import uuid
            repo = GenericRepository(db)
            ticket_data = {**data, "id": str(uuid.uuid4()), "status": "open", "created_at": "now"}
            repo.create(tenant_id=user.tenant_id, module="org_admin", record_type="help_ticket", payload=ticket_data, status="open")
            return {"status": "created", "ticket_id": ticket_data["id"], "message": "Your support ticket has been submitted successfully."}

        # ── Org Setup Commands ────────────────────────────────────────────────
        if operation == "org_setup_step1_save":
            return svc["org_setup"].save_step1(user, data)
        if operation == "org_setup_step2_save":
            return svc["org_setup"].save_step2(user, data)
        if operation == "org_setup_step3_site_create":
            return svc["org_setup"].create_site(user, data)
        if operation == "org_setup_step3_bulk_upload":
            return svc["org_setup"].bulk_upload_sites(user, data)
        if operation == "org_setup_step4_user_create":
            return svc["org_setup"].create_user(user, data)
        if operation == "org_setup_step4_bulk_upload":
            return svc["org_setup"].bulk_upload_users(user, data)
        if operation == "org_setup_step5_save":
            return svc["org_setup"].save_step5(user, data)
        if operation == "org_setup_step6_upload":
            return svc["org_setup"].upload_document(user, data)
        if operation == "org_setup_step6a_import":
            return svc["org_setup"].import_data(user, data)
        if operation == "org_setup_step7_save":
            return svc["org_setup"].save_step7(user, data)
        if operation == "org_setup_activate":
            return svc["org_setup"].activate(user, data)

        return None

    def execute_special_query(
        self,
        user: CurrentUser,
        operation: str,
        path_params: dict[str, Any],
        db: Session = None
    ) -> dict[str, Any] | None:
        svc = self._get_services(db) if db else {}

        # Auth Queries
        if operation == "auth_me":
            return svc["auth"].me(user.user_id, user.tenant_id)

        # Mobile Specific Queries
        if operation == "mobile_profile":
            return {"userId": user.user_id, "displayName": user.display_name, "tenantId": user.tenant_id}
        if operation == "mobile_home":
            return {"summary": "Safe Day", "tasksCount": 3, "notificationsCount": 1}
        if operation == "mobile_notifications":
            items = svc["notifications"].list_notifications(user)
            return {"items": items}
        if operation == "mobile_sync_status":
            return svc["sync"].get_sync_status(user.user_id, user.tenant_id)
        if operation == "mobile_asset_status":
            asset = svc["assets"].get_asset(user, path_params.get("assetId"))
            return {"id": asset.id, "status": asset.compliance_status}

        # Vendor Queries
        if operation == "vendors_list":
            items = svc["vendors"].list_vendors(user)
            return {"items": [_to_dict(i) for i in items]}
        if operation == "vendors_get":
            res = svc["vendors"].get_vendor(user, path_params.get("vendorId"))
            return _to_dict(res)

        # Foundation Queries
        if operation in ("admin_org_nodes_list", "admin_organisation_nodes_list"):
            items = svc["foundation"].list_organisation_nodes(user)
            return {"items": [_to_dict(i) for i in items]}
        if operation == "admin_users_list":
            items = svc["foundation"].list_users(user)
            return {"items": [_to_dict(i) for i in items]}
        if operation == "admin_roles_list":
            items = svc["foundation"].list_roles(user)
            return {"items": [_to_dict(i) for i in items]}

        # Dashboard Queries
        if operation == "dashboard_executive_safety":
            return svc["dashboards"].get_executive_safety(user)
        if operation == "dashboard_site_command":
            return svc["dashboards"].get_site_command(user)
        if operation == "dashboard_training_compliance":
            return svc["dashboards"].get_training_compliance(user)
        if operation == "dashboard_vendor_compliance":
            return svc["dashboards"].get_vendor_compliance(user)
        if operation == "dashboard_asset_compliance":
            return svc["dashboards"].get_asset_compliance(user)
        if operation == "dashboard_my_tasks":
            return svc["dashboards"].get_my_tasks(user)
        if operation == "dashboard_audit_capa":
            return svc["dashboards"].get_audit_capa(user)
        if operation == "dashboard_risk_register":
            return svc["dashboards"].get_risk_register(user)
        if operation == "dashboard_permit_live_board":
            return svc["dashboards"].get_permit_live_board(user)
        if operation == "dashboard_incident_analytics":
            return svc["dashboards"].get_incident_analytics(user)
        if operation == "dashboard_knowledge_usage":
            return svc["dashboards"].get_knowledge_usage(user)
        if operation == "dashboard_ai_intelligence":
            return svc["dashboards"].get_ai_intelligence(user)
        if operation == "dashboard_data_quality":
            return svc["dashboards"].get_data_quality(user)

        # Compliance Queries
        if operation == "capas_list":
            items = svc["compliance"].list_capas(user, {})
            return {"items": [_to_dict(i) for i in items]}
        if operation == "capas_get":
            res = svc["compliance"].get_capa(user, path_params.get("capaId"))
            return _to_dict(res)

        # Knowledge Queries
        if operation == "mobile_knowledge_search":
            items = svc["knowledge"].list_documents(user)
            return {"items": [_to_dict(i) for i in items]}
        if operation == "mobile_knowledge_document":
            res = svc["knowledge"].get_document(user, path_params.get("documentId"))
            return _to_dict(res)

        # Queries
        if operation in ["permits_list", "mobile_permits_list"]:
            items = svc["permits"].list_permits(user, {})
            return {"items": [_to_dict(i) for i in items]}
        if operation in ["permits_get", "mobile_permits_get"]:
            res = svc["permits"].get_permit(user, path_params.get("permitId"))
            return _to_dict(res)
        if operation == "permits_conflicts":
            items = svc["permits"].get_conflicts(user, path_params.get("permitId"))
            return {"items": [_to_dict(i) for i in items]}
        
        if operation == "employees_list":
            items = svc["people"].list_employees(user, {})
            return {"items": [_to_dict(i) for i in items]}
        
        if operation == "assets_list":
            items = svc["assets"].list_assets(user, {})
            return {"items": [_to_dict(i) for i in items]}

        if operation == "health_dependencies":
            return {"database": "configured", "storage": "configured", "ai": "configured"}
        if operation == "ai_predictive_risk_area_get":
            return self.ai.predictive_risk(path_params.get("areaId", "unknown"))

        # ── Workflow Engine Queries ───────────────────────────────────────────
        if operation == "workflows_dashboard":
            return svc["workflow_engine"].get_dashboard(user)
        if operation == "workflows_cases_list":
            return svc["workflow_engine"].list_cases(user, path_params)
        if operation == "workflows_cases_get":
            return svc["workflow_engine"].get_case(user, path_params.get("caseId"))

        # ── AI Intelligence Queries ───────────────────────────────────────────
        if operation == "ai_compliance_benchmarking":
            return svc["ai_intelligence"].get_compliance_benchmarking(user)
        if operation == "ai_risk_scoring":
            return svc["ai_intelligence"].get_risk_scoring(user)
        if operation == "ai_kpi_intelligence":
            return svc["ai_intelligence"].get_kpi_intelligence(user)
        if operation == "ai_pirs":
            return svc["ai_intelligence"].get_pirs(user)
        if operation == "ai_recommendations":
            return svc["ai_intelligence"].get_recommendations(user)
        if operation == "ai_work_oversight":
            return svc["ai_intelligence"].get_work_oversight(user)
        if operation == "ai_leadership_intelligence":
            return svc["ai_intelligence"].get_leadership_intelligence(user)
        if operation == "ai_continuous_learning_summary":
            return svc["ai_intelligence"].get_continuous_learning_summary(user)

        # ── Outputs Queries ───────────────────────────────────────────────────
        if operation == "outputs_dashboard":
            return svc["outputs"].get_dashboard(user)
        if operation == "outputs_reports_list":
            return svc["outputs"].list_reports(user, path_params.get("type"))
        if operation == "outputs_insights_list":
            return svc["outputs"].get_insights(user)
        if operation == "outputs_alerts_dashboard":
            return svc["outputs"].get_alerts_dashboard(user)
        if operation == "outputs_exports_list":
            return svc["outputs"].get_exports(user)

        # ── Learning Queries ──────────────────────────────────────────────────
        if operation == "learning_loop_summary":
            return svc["learning"].get_loop_summary(user)
        if operation == "learning_events_list":
            return svc["learning"].list_events(user, path_params)
        if operation == "learning_patterns_list":
            return svc["learning"].list_patterns(user)
        if operation == "learning_models_list":
            return svc["learning"].list_models(user)
        if operation == "learning_outcomes_list":
            return svc["learning"].get_outcomes(user)

        # ── Super Admin Queries ───────────────────────────────────────────────
        if operation in ("superadmin_dashboard", "admin_superadmin_dashboard"):
            return svc["superadmin"].get_dashboard()
        if operation in ("superadmin_tenants_list", "admin_tenants_list"):
            return svc["superadmin"].list_tenants()
        if operation in ("superadmin_tenants_get", "admin_tenants_get"):
            return svc["superadmin"].get_tenant(path_params.get("tenantId"))
        if operation in ("superadmin_users_list", "admin_superadmin_users_list"):
            return svc["superadmin"].list_all_users()
        if operation == "admin_storage_metrics":
            return svc["superadmin"].get_storage_metrics()

        # Invitations
        if operation == "superadmin_invitations_list":
            return svc["invitations"].list_invitations()
        if operation == "superadmin_invitations_get":
            return svc["invitations"].get_invitation(path_params.get("invitationId"))

        # Subscription plans
        if operation == "superadmin_plans_list":
            return svc["subscriptions"].list_plans()

        # Notification templates
        if operation == "superadmin_notif_templates_list":
            return svc["notif_templates"].list_templates()

        # Security/compliance
        if operation == "superadmin_security_policy_get":
            return svc["platform_config"].get_security_policy()
        if operation == "superadmin_compliance_config_get":
            return svc["platform_config"].get_compliance_config()

        # Analytics
        if operation == "superadmin_analytics":
            return svc["superadmin"].get_platform_analytics()
        if operation == "superadmin_analytics_incidents":
            return svc["superadmin"].get_incident_analytics()
        if operation == "superadmin_analytics_compliance":
            return svc["superadmin"].get_compliance_analytics()

        # ── Org Admin Queries ─────────────────────────────────────────────────
        if operation == "org_admin_overview_get":
            return {
                "total_sites": 12,
                "active_employees": 847,
                "open_incidents": 3,
                "compliance_score": 94,
                "org_name": user.tenant_id,
                "system_health": {"database": "healthy", "ai_engine": "active", "last_sync": "2 minutes ago"},
            }

        if operation == "org_admin_kpis_get":
            return {
                "period": "today",
                "kpis": [
                    {"id": "trir", "label": "TRIR", "value": 0.42, "target": 0.5, "trend": "down", "status": "on_track"},
                    {"id": "ltir", "label": "LTIR", "value": 0.08, "target": 0.1, "trend": "down", "status": "on_track"},
                    {"id": "near_miss_rate", "label": "Near Miss Rate", "value": 2.1, "target": 2.0, "trend": "up", "status": "at_risk"},
                    {"id": "compliance_rate", "label": "Compliance Rate", "value": 94, "target": 95, "trend": "up", "status": "at_risk"},
                    {"id": "open_capas", "label": "Open CAPAs", "value": 7, "target": 5, "trend": "up", "status": "breached"},
                    {"id": "audit_completion", "label": "Audit Completion", "value": 87, "target": 90, "trend": "up", "status": "at_risk"},
                    {"id": "ptw_active", "label": "PTW Active", "value": 14, "target": 20, "trend": "down", "status": "on_track"},
                    {"id": "training_completion", "label": "Training Completion", "value": 91, "target": 90, "trend": "up", "status": "on_track"},
                ],
            }

        if operation == "org_admin_activities_list":
            return {
                "items": [
                    {"id": "1", "type": "incident", "description": "New incident reported at Site A", "user": "John Smith", "timestamp": "2 minutes ago"},
                    {"id": "2", "type": "permit", "description": "Hot work permit approved for Zone B", "user": "Sarah Lee", "timestamp": "15 minutes ago"},
                    {"id": "3", "type": "audit", "description": "Monthly safety audit completed", "user": "Mike Chen", "timestamp": "1 hour ago"},
                    {"id": "4", "type": "user", "description": "New user added: James Wilson", "user": "Admin", "timestamp": "2 hours ago"},
                    {"id": "5", "type": "incident", "description": "Near miss reported at Warehouse C", "user": "Tom Brown", "timestamp": "3 hours ago"},
                ],
                "total": 248,
            }

        if operation == "org_admin_shifts_list":
            from app.repositories.generic_repository import GenericRepository
            repo = GenericRepository(db)
            records = repo.list_by_type(user.tenant_id, module="org_admin", record_type="shift")
            if records:
                return {"items": [r.payload for r in records]}
            return {
                "items": [
                    {"id": "1", "name": "Morning Shift", "type": "Morning", "start": "06:00", "end": "14:00", "workers": 85, "supervisor": "Alex Johnson", "status": "active"},
                    {"id": "2", "name": "Afternoon Shift", "type": "Afternoon", "start": "14:00", "end": "22:00", "workers": 92, "supervisor": "Maria Garcia", "status": "active"},
                    {"id": "3", "name": "Night Shift", "type": "Night", "start": "22:00", "end": "06:00", "workers": 70, "supervisor": "David Kim", "status": "active"},
                ],
            }

        if operation == "org_admin_imports_list":
            return {
                "items": [
                    {"id": "1", "file_name": "employees_jan_2026.xlsx", "type": "Employees", "records": 245, "status": "completed", "uploaded_by": "Admin", "date": "Jan 15, 2026"},
                    {"id": "2", "file_name": "incidents_q4_2025.csv", "type": "Incidents", "records": 89, "status": "completed", "uploaded_by": "Safety Mgr", "date": "Jan 10, 2026"},
                    {"id": "3", "file_name": "training_records.xlsx", "type": "Training", "records": 312, "status": "processing", "uploaded_by": "HR Admin", "date": "Jan 8, 2026"},
                ],
            }

        if operation == "org_admin_validation_logs_list":
            return {
                "items": [
                    {"id": "1", "file": "employees_jan_2026.xlsx", "rule": "Email format validation", "status": "pass", "records_affected": 245, "timestamp": "Jan 15, 2026 09:32"},
                    {"id": "2", "file": "incidents_q4_2025.csv", "rule": "Date range check", "status": "warning", "records_affected": 3, "timestamp": "Jan 10, 2026 14:15"},
                    {"id": "3", "file": "training_records.xlsx", "rule": "Duplicate detection", "status": "fail", "records_affected": 12, "timestamp": "Jan 8, 2026 11:45"},
                ],
            }

        if operation == "org_admin_sync_status_get":
            return {
                "integrations": [
                    {"name": "ERP System", "last_sync": "5 minutes ago", "status": "active", "records_synced": 1247},
                    {"name": "HRMS", "last_sync": "1 hour ago", "status": "active", "records_synced": 847},
                    {"name": "IoT Sensors", "last_sync": "30 seconds ago", "status": "active", "records_synced": 3892},
                    {"name": "Safety Sensors", "last_sync": "2 minutes ago", "status": "warning", "records_synced": 156},
                ],
            }

        if operation == "org_admin_tickets_list":
            from app.repositories.generic_repository import GenericRepository
            repo = GenericRepository(db)
            records = repo.list_by_type(user.tenant_id, module="org_admin", record_type="help_ticket")
            return {"items": [r.payload for r in records] if records else []}

        if operation == "org_admin_tickets_get":
            return {"id": path_params.get("ticketId"), "status": "open"}

        # ── Org Setup Queries ─────────────────────────────────────────────────
        if operation == "org_setup_progress_get":
            return svc["org_setup"].get_progress(user)
        if operation == "org_setup_step1_get":
            return svc["org_setup"].get_step1(user)
        if operation == "org_setup_step2_get":
            return svc["org_setup"].get_step2(user)
        if operation == "org_setup_step3_sites_list":
            return svc["org_setup"].list_sites(user)
        if operation == "org_setup_step4_users_list":
            return svc["org_setup"].list_users(user)
        if operation == "org_setup_step5_get":
            return svc["org_setup"].get_step5(user)
        if operation == "org_setup_step6_documents_list":
            return svc["org_setup"].list_documents(user)
        if operation == "org_setup_step6a_imports_list":
            return svc["org_setup"].list_imports(user)
        if operation == "org_setup_step7_get":
            return svc["org_setup"].get_step7(user)

        return None
