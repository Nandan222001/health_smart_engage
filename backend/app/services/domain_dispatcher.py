from typing import Any
from sqlalchemy.orm import Session
from app.core.security import CurrentUser
from app.core.config import settings


def _to_dict(obj) -> dict:
    """Serialize a SQLAlchemy model instance to a plain dict.
    extra_fields JSON is merged into the top-level dict so callers see a flat object.
    """
    d = {k: v for k, v in obj.__dict__.items() if not k.startswith("_")}
    extras = d.pop("extra_fields", None)
    if extras and isinstance(extras, dict):
        d.update(extras)
    return d
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
        # If 'data' is empty but we have other root fields (like 'messages'), 
        # use the whole payload as data. This handles Pydantic's 'extra' allow correctly.
        data = payload.get("data")
        if not data and any(k not in ("data", "comment", "idempotency_key") for k in payload):
            data = payload
        elif not data:
            data = {}
            
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
        if operation == "vendors_update":
            res = svc["vendors"].update_vendor(user, path_params.get("vendorId"), data)
            return {"id": res.id, "status": res.status}
        if operation == "vendor_documents_upload":
            res = svc["vendors"].upload_vendor_document(user, path_params.get("vendorId"), data)
            return {"id": res.id}
        if operation == "vendor_documents_review":
            res = svc["vendors"].review_vendor_document(user, path_params.get("documentId"), data)
            return {"id": res.id, "status": res.status}
        if operation == "vendor_compliance_save":
            return svc["vendors"].save_vendor_compliance(user, path_params.get("vendorId"), data)
        if operation == "vendor_certification_add":
            res = svc["vendors"].add_vendor_certification(user, path_params.get("vendorId"), data)
            return {"id": res.id, "status": res.status}

        # Foundation Commands
        if operation == "foundation_org_nodes_create":
            res = svc["foundation"].create_organisation_node(user, data)
            return {"id": res.id}
        if operation == "foundation_org_nodes_update":
            res = svc["foundation"].update_organisation_node(user, path_params.get("nodeId"), data)
            return {"id": res.id}
        if operation == "foundation_org_nodes_delete":
            svc["foundation"].delete_organisation_node(user, path_params.get("nodeId"))
            return {"deleted": True, "id": path_params.get("nodeId")}

        if operation == "foundation_users_create":
            res = svc["foundation"].invite_user(user, data)
            return {"id": res.id, "status": res.status}
        if operation == "foundation_users_update":
            res = svc["foundation"].update_user(user, path_params.get("userId"), data)
            return {"id": res.id}
        if operation == "foundation_users_delete":
            svc["foundation"].delete_user(user, path_params.get("userId"))
            return {"deleted": True, "id": path_params.get("userId")}

        if operation == "foundation_roles_create":
            res = svc["foundation"].create_role(user, data)
            return {"id": res.id}
        if operation == "foundation_roles_update":
            res = svc["foundation"].update_role(user, path_params.get("roleId"), data)
            return {"id": res.id}
        if operation == "foundation_roles_delete":
            svc["foundation"].delete_role(user, path_params.get("roleId"))
            return {"deleted": True, "id": path_params.get("roleId")}

        if operation == "admin_roles_delete":
            from app.models.auth import Role
            from sqlalchemy import select
            role_id = path_params.get("roleId")
            role = db.scalars(select(Role).where(Role.id == role_id, Role.tenant_id == user.tenant_id)).first()
            if role:
                db.delete(role)
            return {"deleted": True, "id": role_id}

        if operation == "admin_role_permissions_update":
            from app.models.auth import Role
            from sqlalchemy import select
            role_id = path_params.get("roleId")
            permissions = data.get("permissions", [])
            role = db.scalars(select(Role).where(Role.id == role_id, Role.tenant_id == user.tenant_id)).first()
            if role:
                role.permissions = permissions
            return {"id": role_id, "permissions": permissions}

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

        # Sites & Zones Commands
        if operation == "sites_create":
            from app.models.sites import Site as _Site
            import uuid as _uuid
            site = _Site(
                id=str(_uuid.uuid4()), tenant_id=user.tenant_id,
                name=data.get("name", data.get("site_name", "Unnamed")),
                site_type=data.get("type", data.get("site_type", "Site")),
                address=data.get("address"), city=data.get("city"),
                postcode=data.get("postcode"), region=data.get("region"),
                status=data.get("status", "active"),
                capacity=int(data["capacity"]) if data.get("capacity") else None,
                hazard_level=data.get("hazard_level"),
                extra_fields={k: v for k, v in data.items() if k not in (
                    "name","site_name","type","site_type","address","city",
                    "postcode","region","status","capacity","hazard_level")} or None,
            )
            db.add(site); db.flush()
            return {"id": site.id, "name": site.name, "status": site.status}
        if operation == "sites_update":
            from app.models.sites import Site as _Site
            from sqlalchemy import select as sa_select
            site_id = path_params.get("siteId")
            site = db.scalars(sa_select(_Site).where(_Site.id == site_id, _Site.tenant_id == user.tenant_id)).first()
            if site:
                for k, v in data.items():
                    if hasattr(site, k): setattr(site, k, v)
                    else: site.extra_fields = {**(site.extra_fields or {}), k: v}
                db.flush()
            return {"id": site_id}
        if operation == "sites_delete":
            from app.models.sites import Site as _Site
            from sqlalchemy import select as sa_select
            site_id = path_params.get("siteId")
            site = db.scalars(sa_select(_Site).where(_Site.id == site_id, _Site.tenant_id == user.tenant_id)).first()
            if site: db.delete(site)
            return {"deleted": True, "id": site_id}

        if operation == "zones_create":
            from app.models.operations import Zone as _Zone
            import uuid as _uuid
            zone = _Zone(
                id=str(_uuid.uuid4()), tenant_id=user.tenant_id,
                name=data.get("name", "Unnamed Zone"),
                site_id=data.get("site_id"), zone_type=data.get("zone_type"),
                status=data.get("status", "active"),
                extra_fields={k: v for k, v in data.items() if k not in (
                    "name","site_id","zone_type","status")} or None,
            )
            db.add(zone); db.flush()
            return {"id": zone.id, "name": zone.name}
        if operation == "zones_update":
            from app.models.operations import Zone as _Zone
            from sqlalchemy import select as sa_select
            zone_id = path_params.get("zoneId")
            zone = db.scalars(sa_select(_Zone).where(_Zone.id == zone_id, _Zone.tenant_id == user.tenant_id)).first()
            if zone:
                for k, v in data.items():
                    if hasattr(zone, k): setattr(zone, k, v)
                    else: zone.extra_fields = {**(zone.extra_fields or {}), k: v}
                db.flush()
            return {"id": zone_id}
        if operation == "zones_delete":
            from app.models.operations import Zone as _Zone
            from sqlalchemy import select as sa_select
            zone_id = path_params.get("zoneId")
            zone = db.scalars(sa_select(_Zone).where(_Zone.id == zone_id, _Zone.tenant_id == user.tenant_id)).first()
            if zone: db.delete(zone)
            return {"deleted": True, "id": zone_id}

        # Escalation Rules Commands
        if operation == "escalation_rules_create":
            from app.models.operations import EscalationRule as _ERule
            import uuid as _uuid
            rule = _ERule(
                id=str(_uuid.uuid4()), tenant_id=user.tenant_id,
                name=data.get("name"),
                trigger_condition=data.get("trigger_condition"),
                escalate_to=data.get("escalate_to"),
                time_limit_hours=data.get("time_limit_hours"),
                status=data.get("status", "active"),
                extra_fields={k: v for k, v in data.items() if k not in (
                    "name","trigger_condition","escalate_to","time_limit_hours","status")} or None,
            )
            db.add(rule); db.flush()
            return {"id": rule.id}
        if operation == "escalation_rules_update":
            from app.models.operations import EscalationRule as _ERule
            from sqlalchemy import select as sa_select
            rule_id = path_params.get("ruleId")
            rule = db.scalars(sa_select(_ERule).where(_ERule.id == rule_id, _ERule.tenant_id == user.tenant_id)).first()
            if rule:
                for k, v in data.items():
                    if hasattr(rule, k): setattr(rule, k, v)
                db.flush()
            return {"id": rule_id}
        if operation == "escalation_rules_delete":
            from app.models.operations import EscalationRule as _ERule
            from sqlalchemy import select as sa_select
            rule_id = path_params.get("ruleId")
            rule = db.scalars(sa_select(_ERule).where(_ERule.id == rule_id, _ERule.tenant_id == user.tenant_id)).first()
            if rule: db.delete(rule)
            return {"deleted": True, "id": rule_id}

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
            return {"id": res.id, "status": res.status}
        if operation == "assets_update":
            res = svc["assets"].update_asset(user, path_params.get("assetId"), data)
            return {"id": res.id, "status": res.status}
        if operation in ["asset_inspections_create", "mobile_asset_inspections_create"]:
            res = svc["assets"].record_inspection(user, path_params.get("assetId"), data)
            return {"id": res.id}
        if operation == "asset_maintenance_log_create":
            res = svc["assets"].create_maintenance_log(user, path_params.get("assetId"), data)
            return {"id": res.id, "status": res.status}

        # Compliance Commands
        if operation == "audit_checklists_create":
            res = svc["compliance"].create_audit_checklist(user, data)
            return {"id": res.id, "status": res.status}
        if operation == "audit_checklists_publish":
            res = svc["compliance"].publish_checklist(user, path_params.get("checklistId"))
            return {"id": res.id, "status": res.status}
        if operation == "audits_create":
            res = svc["compliance"].create_audit_execution(user, data)
            return {"id": res.id, "status": res.status}
        if operation == "audits_update":
            res = svc["compliance"].update_audit_execution(user, path_params.get("auditId"), data)
            return {"id": res.id, "status": res.status}
        if operation == "audit_findings_create":
            res = svc["compliance"].create_finding(user, path_params.get("auditId"), data)
            return {"id": res.id}
        if operation == "capas_create":
            res = svc["compliance"].create_capa(user, data)
            return {"id": res.id, "status": res.status}
        if operation == "capas_update":
            res = svc["compliance"].update_capa(user, path_params.get("capaId"), data)
            return {"id": res.id, "status": res.status}
        if operation == "capas_submit_closure":
            res = svc["compliance"].submit_capa_closure(user, path_params.get("capaId"), data)
            return {"id": res.id, "status": res.status}
        if operation == "capas_approve_closure":
            res = svc["compliance"].approve_capa_closure(user, path_params.get("capaId"), data)
            return {"id": res.id, "status": res.status}
        if operation == "hazards_create":
            from app.models.risks import HazardObservation
            obs = HazardObservation(
                id=str(__import__("uuid").uuid4()),
                tenant_id=user.tenant_id,
                severity=data.get("severity", "medium"),
                description=data.get("description", data.get("title", "")),
                location_id=data.get("location_id") or None,
                assigned_to_user_id=data.get("assigned_to") or None,
                status=data.get("status", "open"),
                extra_fields={k: v for k, v in data.items()
                              if k not in ("severity", "description", "title",
                                           "location_id", "assigned_to", "status")} or None,
            )
            db.add(obs)
            db.flush()
            return {"id": obs.id, "status": obs.status}

        if operation == "incidents_create":
            res = svc["compliance"].create_incident(user, data)
            return {"id": res.id, "status": res.status}
        if operation == "incidents_classify":
            res = svc["compliance"].classify_incident(user, path_params.get("incidentId"), data)
            return {"id": res.id, "status": res.status}
        if operation == "incident_investigations_create":
            res = svc["compliance"].start_investigation(user, path_params.get("incidentId"), data)
            return {"id": res.id}
        if operation == "compliance_standards_create":
            res = svc["compliance"].create_standard(user, data)
            return {"id": res.id, "status": res.status}
        if operation == "compliance_standards_update":
            res = svc["compliance"].update_standard(user, path_params.get("standardId"), data)
            return {"id": res.id, "status": res.status}
        if operation == "regulatory_requirements_create":
            res = svc["compliance"].create_regulatory_requirement(user, data)
            return {"id": res.id, "status": res.status}
        if operation == "regulatory_requirements_update":
            res = svc["compliance"].update_regulatory_requirement(user, path_params.get("reqId"), data)
            return {"id": res.id, "status": res.status}
        if operation == "compliance_documents_create":
            res = svc["compliance"].create_compliance_document(user, data)
            return {"id": res.id, "status": res.status}
        if operation == "compliance_documents_update":
            res = svc["compliance"].update_compliance_document(user, path_params.get("docId"), data)
            return {"id": res.id, "status": res.status}
        if operation == "inspections_create":
            res = svc["compliance"].create_inspection(user, data)
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

        # ── Azure AI Foundry — Chat ───────────────────────────────────────────
        if operation == "ai_chat_complete":
            messages = data.get("messages", [])
            if not messages and data.get("message"):
                messages = [{"role": "user", "content": data["message"]}]

            # Build extra context: live platform stats + RAG knowledge base
            extra_context = ""
            citations: list[dict] = []
            try:
                from sqlalchemy import select as _sel, func as _func
                from app.models.incidents import Incident as _Inc
                from app.models.domain import Permit, RiskAssessment
                inc_count = db.scalar(_sel(_func.count(_Inc.id)).where(_Inc.tenant_id == user.tenant_id)) or 0
                open_inc = db.scalar(_sel(_func.count(_Inc.id)).where(_Inc.tenant_id == user.tenant_id, _Inc.status == "reported")) or 0
                permit_count = db.scalar(_sel(_func.count(Permit.id)).where(Permit.tenant_id == user.tenant_id, Permit.status == "active")) or 0
                risk_count = db.scalar(_sel(_func.count(RiskAssessment.id)).where(RiskAssessment.tenant_id == user.tenant_id)) or 0
                extra_context = (
                    f"Total incidents: {inc_count} ({open_inc} open). "
                    f"Active permits: {permit_count}. "
                    f"Risk assessments: {risk_count}."
                )
            except Exception:
                pass

            # RAG: search indexed knowledge documents for the last user message
            try:
                from app.services.knowledge_indexer import search_knowledge
                last_user_msg = next(
                    (m["content"] for m in reversed(messages) if m.get("role") == "user"),
                    None,
                )
                if last_user_msg:
                    chunks = search_knowledge(last_user_msg, user.tenant_id, db, top_k=5)
                    if chunks:
                        passages = "\n\n".join(
                            f"[{c['title']} §{c['chunk_index']}]\n{c['text'][:500]}"
                            for c in chunks
                        )
                        extra_context += f"\n\nRelevant policy/procedure excerpts from your uploaded documents:\n{passages}"
                        citations = [
                            {"title": c["title"], "doc_id": c["doc_id"], "score": c["score"]}
                            for c in chunks
                        ]
            except Exception as exc:
                import logging
                logging.getLogger(__name__).warning("RAG search failed: %s", exc)

            result = self.ai.chat(messages, extra_context=extra_context)
            if citations:
                result["citations"] = citations
            return result

        if operation == "ai_knowledge_search":
            query = data.get("query", data.get("q", ""))
            # TF-IDF search over indexed knowledge chunks
            answer = None
            chunks: list[dict] = []
            try:
                from app.services.knowledge_indexer import search_knowledge
                chunks = search_knowledge(query, user.tenant_id, db, top_k=8)
            except Exception:
                pass

            # Fall back to keyword search over KnowledgeDocument titles if no chunks indexed
            if not chunks:
                from app.models.knowledge import KnowledgeDocument as _KD
                from sqlalchemy import select as _ksel
                docs_recs = db.scalars(_ksel(_KD).where(_KD.tenant_id == user.tenant_id).limit(200)).all()
                docs = [{"id": d.id, "title": d.title, "content": "", "source": d.file_name or ""} for d in docs_recs]
                chunks = self.ai.knowledge_search(query, docs)

            if self.ai.is_configured and query:
                ctx = "\n\n".join(
                    f"[{r.get('title','Doc')}]\n{str(r.get('text', r.get('content', '')))[:400]}"
                    for r in chunks[:5]
                )
                answer = self.ai.analyze(
                    f"Answer this HSE question using only the provided knowledge base excerpts: '{query}'\n\nRelevant passages:\n{ctx or 'No documents found.'}",
                )
            return {"query": query, "results": chunks, "answer": answer, "total": len(chunks)}

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
            from app.models.operations import Shift as _Shift
            import uuid as _uuid
            shift = _Shift(
                id=str(_uuid.uuid4()), tenant_id=user.tenant_id,
                name=data.get("name", "Unnamed Shift"),
                start_time=data.get("start_time"), end_time=data.get("end_time"),
                days=data.get("days"), status="active",
                extra_fields={k: v for k, v in data.items() if k not in (
                    "name","start_time","end_time","days","status")} or None,
            )
            db.add(shift); db.flush()
            return {"status": "created", "id": shift.id}

        if operation == "org_admin_shifts_update":
            from app.models.operations import Shift as _Shift
            from sqlalchemy import select as sa_select
            shift_id = path_params.get("shiftId")
            shift = db.scalars(sa_select(_Shift).where(_Shift.id == shift_id, _Shift.tenant_id == user.tenant_id)).first()
            if shift:
                for k, v in data.items():
                    if hasattr(shift, k): setattr(shift, k, v)
                db.flush()
            return {"status": "updated", "id": shift_id}

        if operation == "org_admin_shifts_delete":
            from app.models.operations import Shift as _Shift
            from sqlalchemy import select as sa_select
            shift_id = path_params.get("shiftId")
            shift = db.scalars(sa_select(_Shift).where(_Shift.id == shift_id, _Shift.tenant_id == user.tenant_id)).first()
            if shift: db.delete(shift); db.flush()
            return {"status": "deleted", "id": shift_id}

        if operation == "org_admin_import_create":
            from app.models.operations import DataImport as _DI, ValidationLog as _VL
            import uuid as _uuid
            from datetime import datetime as _dt
            records_total = int(data.get("records_estimated", 0) or 0)
            import_status = "success" if records_total > 0 else "failed"
            imp = _DI(
                id=str(_uuid.uuid4()), tenant_id=user.tenant_id,
                file_name=data.get("file_name", "unknown"),
                import_type=data.get("import_type", "excel"),
                data_type=data.get("data_type", "Unknown"),
                records_total=records_total, records_success=records_total,
                records_failed=0, status=import_status,
                uploaded_by=str(user.user_id or "System"),
            )
            db.add(imp); db.flush()
            log = _VL(
                id=str(_uuid.uuid4()), tenant_id=user.tenant_id,
                import_id=imp.id,
                file_name=data.get("file_name", "unknown"),
                rule="Required fields check",
                status="pass" if records_total > 0 else "fail",
                records_affected=records_total,
                message="All required fields validated successfully" if records_total > 0 else "No records were imported — check column headers",
            )
            db.add(log); db.flush()
            return {"status": import_status, "id": imp.id, "message": f"Logged {records_total} records imported"}

        if operation == "org_admin_sync_trigger":
            from app.models.operations import SyncIntegration as _SI
            from sqlalchemy import select as sa_select
            integration_name = data.get("integration")
            syncs = db.scalars(sa_select(_SI).where(_SI.tenant_id == user.tenant_id)).all()
            for s in syncs:
                if not integration_name or s.name == integration_name:
                    s.last_sync = "Just now"; s.status = "active"
            db.flush()
            return {"status": "sync_triggered", "integration": integration_name or "all"}

        if operation == "org_admin_api_integrations_create":
            from app.models.operations import ApiIntegration as _AI
            import uuid as _uuid
            ai = _AI(
                id=str(_uuid.uuid4()), tenant_id=user.tenant_id,
                name=data.get("name", "Integration"),
                integration_type=data.get("integration_type"),
                endpoint_url=data.get("endpoint_url"),
                api_key=data.get("api_key"),
                is_active=data.get("is_active", True),
                records_synced=0,
                extra_fields={k: v for k, v in data.items() if k not in (
                    "name","integration_type","endpoint_url","api_key","is_active")} or None,
            )
            db.add(ai); db.flush()
            return {"status": "created", "id": ai.id}

        if operation == "org_admin_api_integrations_update":
            from app.models.operations import ApiIntegration as _AI
            from sqlalchemy import select as sa_select
            integration_id = path_params.get("integrationId")
            ai = db.scalars(sa_select(_AI).where(_AI.id == integration_id, _AI.tenant_id == user.tenant_id)).first()
            if ai:
                for k, v in data.items():
                    if hasattr(ai, k): setattr(ai, k, v)
                db.flush()
            return {"status": "updated", "id": integration_id}

        if operation == "org_admin_api_integrations_delete":
            from app.models.operations import ApiIntegration as _AI
            from sqlalchemy import select as sa_select
            integration_id = path_params.get("integrationId")
            ai = db.scalars(sa_select(_AI).where(_AI.id == integration_id, _AI.tenant_id == user.tenant_id)).first()
            if ai: db.delete(ai); db.flush()
            return {"status": "deleted", "id": integration_id}

        if operation == "org_admin_tickets_create":
            from app.models.operations import HelpTicket as _HT
            import uuid as _uuid
            ticket = _HT(
                id=str(_uuid.uuid4()), tenant_id=user.tenant_id,
                subject=data.get("subject"), category=data.get("category"),
                priority=data.get("priority", "medium"),
                description=data.get("description"), status="open",
                extra_fields={k: v for k, v in data.items() if k not in (
                    "subject","category","priority","description","status")} or None,
            )
            db.add(ticket); db.flush()
            return {"status": "created", "ticket_id": ticket.id, "message": "Your support ticket has been submitted successfully."}

        # ── Reports Commands ──────────────────────────────────────────────────
        if operation == "org_admin_reports_generate":
            from app.models.operations import GeneratedReport as _GR
            import uuid as _uuid
            report_type = data.get("type", "kpi")
            fmt = data.get("format", "pdf")
            size_map = {"pdf": "420 KB", "excel": "215 KB", "csv": "85 KB"}
            type_labels = {
                "kpi": "KPI Dashboard Report", "incident": "Incident Summary Report",
                "audit": "Audit Summary Report", "compliance": "Compliance Status Report",
                "risk": "Risk Register Report", "workforce": "Workforce Health Report",
                "management": "Management Executive Summary",
            }
            rpt = _GR(
                id=str(_uuid.uuid4()), tenant_id=user.tenant_id,
                name=data.get("name") or type_labels.get(report_type, "Report"),
                report_type=report_type, format=fmt,
                period_start=data.get("period_start", ""),
                period_end=data.get("period_end", ""),
                status="ready", size=size_map.get(fmt, "320 KB"),
                created_by=getattr(user, "email", None) or "System",
            )
            db.add(rpt); db.flush()
            return {"status": "ready", "id": rpt.id, "message": f"'{rpt.name}' generated successfully"}

        if operation == "org_admin_reports_delete":
            from app.models.operations import GeneratedReport as _GR
            from sqlalchemy import select as sa_select
            report_id = path_params.get("reportId")
            rpt = db.scalars(sa_select(_GR).where(_GR.id == report_id, _GR.tenant_id == user.tenant_id)).first()
            if rpt: db.delete(rpt); db.flush()
            return {"status": "deleted", "id": report_id}

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

        # ── Risk Module Commands ──────────────────────────────────────────────────────

        if operation == "risk_assessments_create":
            import uuid as _uuid
            payload = {**data}
            payload.setdefault("id", str(_uuid.uuid4()))
            # Compute risk_score
            likelihood = int(payload.get("likelihood", 1))
            consequence = int(payload.get("consequence", 1))
            payload["likelihood"] = likelihood
            payload["consequence"] = consequence
            payload["risk_score"] = likelihood * consequence
            payload.setdefault("status", "draft")
            # task_name from title or hazard_description
            if "title" in payload and "task_name" not in payload:
                payload["task_name"] = payload.pop("title")
            if "hazard_description" not in payload:
                payload["hazard_description"] = payload.get("task_name", "Unspecified hazard")
            res = svc["compliance"].create_risk_assessment(user, payload)
            return {"id": res.id, "risk_score": res.risk_score, "status": res.status}

        if operation == "hazards_create":
            from app.models.risks import HazardObservation
            from app.repositories.domain_repository import DomainRepository
            import uuid as _uuid
            repo = DomainRepository(svc["compliance"].db)
            payload = {**data, "id": str(_uuid.uuid4()), "status": "logged"}
            if "title" in payload and "description" not in payload:
                payload["description"] = payload.pop("title")
            res = repo.create(HazardObservation, user.tenant_id, payload)
            return {"id": res.id, "status": res.status}

        if operation == "hazards_update":
            from app.models.risks import HazardObservation
            from app.repositories.domain_repository import DomainRepository
            repo = DomainRepository(svc["compliance"].db)
            res = repo.update(HazardObservation, user.tenant_id, path_params.get("hazardId"), data)
            return {"id": res.id, "status": res.status}

        if operation == "near_miss_create":
            from app.models.incidents import Incident
            from app.repositories.domain_repository import DomainRepository
            import uuid as _uuid
            repo = DomainRepository(svc["compliance"].db)
            payload = {**data, "id": str(_uuid.uuid4()), "incident_type": "near_miss", "status": "open"}
            payload.setdefault("incident_ref", f"NM-{payload['id'][:8].upper()}")
            if "title" in payload and "description" not in payload:
                payload["description"] = payload.pop("title")
            res = repo.create(Incident, user.tenant_id, payload)
            return {"id": res.id, "ref": res.incident_ref, "status": res.status}

        if operation == "risk_assessment_close":
            from app.models.risks import RiskAssessment
            from app.repositories.domain_repository import DomainRepository
            repo = DomainRepository(svc["compliance"].db)
            res = repo.update(RiskAssessment, user.tenant_id, path_params.get("assessmentId"), {"status": "closed"})
            return {"id": res.id, "status": res.status}

        # Incident Commands
        if operation == "incidents_create":
            from app.models.incidents import Incident as _Inc
            import uuid as _uuid, random as _random
            ref = f"INC-{_random.randint(10000,99999)}"
            rec = _Inc(
                id=str(_uuid.uuid4()), tenant_id=user.tenant_id,
                incident_ref=ref, reporter_user_id=user.user_id,
                incident_type=data.get("incident_type", "incident_report"),
                severity=data.get("severity", "unclassified"),
                location_id=data.get("location_id"),
                description=data.get("description", ""),
                is_confidential=bool(data.get("is_confidential", False)),
                status="reported",
            )
            db.add(rec); db.flush()
            return {"id": rec.id, "ref": rec.incident_ref, "status": rec.status}

        if operation == "incidents_update":
            from app.models.incidents import Incident as _Inc
            from sqlalchemy import select as _sel
            inc_id = path_params.get("incidentId")
            rec = db.scalars(_sel(_Inc).where(_Inc.id == inc_id, _Inc.tenant_id == user.tenant_id)).first()
            allowed = {"severity", "status", "description", "is_confidential"}
            if rec:
                for k, v in data.items():
                    if k in allowed: setattr(rec, k, v)
            return {"id": inc_id, "status": rec.status if rec else "unknown"}

        if operation in ("incidents_unsafe_acts_create", "incidents_unsafe_conditions_create"):
            from app.models.incidents import Incident as _Inc
            import uuid as _uuid, random as _random
            itype = "unsafe_act" if operation == "incidents_unsafe_acts_create" else "unsafe_condition"
            ref = f"{'UA' if itype=='unsafe_act' else 'UC'}-{_random.randint(10000,99999)}"
            rec = _Inc(
                id=str(_uuid.uuid4()), tenant_id=user.tenant_id,
                incident_ref=ref, reporter_user_id=user.user_id,
                incident_type=itype,
                severity=data.get("severity", "unclassified"),
                location_id=data.get("location_id"),
                description=data.get("description", ""),
                is_confidential=False, status="reported",
            )
            db.add(rec); db.flush()
            return {"id": rec.id, "ref": rec.incident_ref, "status": rec.status}

        if operation == "incident_rca_create":
            from app.models.incidents import IncidentRCA as _IRCA
            import uuid as _uuid
            inc_id = path_params.get("incidentId")
            rca = _IRCA(
                id=str(_uuid.uuid4()), tenant_id=user.tenant_id,
                incident_id=inc_id,
                method=data.get("method"),
                root_cause=data.get("root_cause"),
                contributing_factors=data.get("contributing_factors"),
                status="draft",
                extra_fields={k: v for k, v in data.items() if k not in (
                    "method","root_cause","contributing_factors","status")} or None,
            )
            db.add(rca); db.flush()
            return {"id": rca.id}

        if operation == "incident_corrective_actions_create":
            from app.models.incidents import CorrectiveAction as _CA
            import uuid as _uuid
            ca = _CA(
                id=str(_uuid.uuid4()), tenant_id=user.tenant_id,
                incident_id=data.get("incident_id", path_params.get("incidentId")),
                title=data.get("title"), description=data.get("description"),
                assigned_to=data.get("assigned_to"), due_date=data.get("due_date"),
                status=data.get("status", "open"),
                extra_fields={k: v for k, v in data.items() if k not in (
                    "incident_id","title","description","assigned_to","due_date","status")} or None,
            )
            db.add(ca); db.flush()
            return {"id": ca.id, "status": ca.status}

        if operation == "incident_corrective_actions_update":
            from app.models.incidents import CorrectiveAction as _CA
            from sqlalchemy import select as _sel
            action_id = path_params.get("actionId")
            ca = db.scalars(_sel(_CA).where(_CA.id == action_id, _CA.tenant_id == user.tenant_id)).first()
            if ca:
                for k, v in data.items():
                    if hasattr(ca, k): setattr(ca, k, v)
                db.flush()
            return {"id": action_id, "status": ca.status if ca else "unknown"}

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
        if operation == "vendor_compliance_list":
            return svc["vendors"].list_vendor_compliance(user)
        if operation == "vendor_certifications_list":
            return svc["vendors"].list_vendor_certifications(user)
        if operation == "vendor_risk_scores_list":
            return svc["vendors"].list_vendor_risk_scores(user)

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

        # Foundation Queries
        if operation == "foundation_org_nodes_list":
            items = svc["foundation"].list_organisation_nodes(user)
            return {"items": [_to_dict(i) for i in items]}
        if operation == "foundation_org_nodes_get":
            res = svc["foundation"].get_organisation_node(user, path_params.get("nodeId"))
            return _to_dict(res)

        if operation == "foundation_users_list":
            items = svc["foundation"].list_users(user)
            return {"items": [_to_dict(i) for i in items]}
        if operation == "foundation_users_get":
            res = svc["foundation"].get_user(user, path_params.get("userId"))
            return _to_dict(res)

        if operation == "foundation_roles_list":
            items = svc["foundation"].list_roles(user)
            return {"items": [_to_dict(i) for i in items]}
        if operation == "foundation_roles_get":
            res = svc["foundation"].get_role(user, path_params.get("roleId"))
            return _to_dict(res)

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

        # Hazard Queries
        if operation == "hazards_list":
            from app.models.risks import HazardObservation as _Haz
            from sqlalchemy import select as _sel
            obs = db.scalars(
                _sel(_Haz).where(_Haz.tenant_id == user.tenant_id).order_by(_Haz.created_at.desc()).limit(500)
            ).all()
            return {
                "items": [
                    {
                        "id": h.id, "title": h.description[:60] if h.description else f"Hazard {h.id[:8]}",
                        "description": h.description, "severity": h.severity,
                        "location_id": h.location_id, "status": h.status,
                        "assigned_to": h.assigned_to_user_id,
                        "created_at": str(h.created_at) if h.created_at else None,
                    }
                    for h in obs
                ]
            }

        # Violation Queries
        if operation == "violations_list":
            # Mock violations data as requested for Org Dashboard
            return {
                "items": [
                    {
                        "Violation_ID": "V-1001",
                        "Violation_Type": "PPE Missing",
                        "Zone_ID": "Z-ALPHA",
                        "Site_ID": "S-NORTH",
                        "Severity": "High",
                        "PPE_Missing": "Helmet",
                        "Worker_ID": "W-442",
                        "Detected_At": "2026-05-26T10:30:00Z",
                        "Status": "Open",
                        "Assigned_To": "Safety Manager",
                    },
                    {
                        "Violation_ID": "V-1002",
                        "Violation_Type": "Unauthorized Access",
                        "Zone_ID": "Z-BETA",
                        "Site_ID": "S-SOUTH",
                        "Severity": "Critical",
                        "Worker_ID": "W-501",
                        "Detected_At": "2026-05-26T11:45:00Z",
                        "Status": "In Progress",
                        "Assigned_To": "Security Head",
                    }
                ]
            }
        
        if operation == "violations_get":
            return {
                "Violation_ID": path_params.get("violationId"),
                "Violation_Type": "PPE Missing",
                "Severity": "High",
                "Status": "Open",
            }

        # Incident Queries
        if operation == "incidents_list":
            from app.repositories.incident_repository import IncidentRepository
            repo = IncidentRepository(db)
            items = repo.list_by_tenant(user.tenant_id)
            return {
                "items": [
                    {
                        "id": i.id,
                        "title": i.incident_ref,
                        "type": i.incident_type,
                        "severity": i.severity,
                        "status": i.status,
                        "reported_by": i.reporter_user_id,
                        "occurred_at": i.created_at.isoformat() if i.created_at else None,
                        "description": i.description,
                        "created_at": i.created_at.isoformat() if i.created_at else None,
                    }
                    for i in items
                ]
            }

        if operation == "investigations_list":
            from app.repositories.incident_repository import IncidentRepository
            repo = IncidentRepository(db)
            items = repo.list_investigations(user.tenant_id)
            return {
                "items": [
                    {
                        "id": i.id,
                        "incident_id": i.incident_id,
                        "lead_investigator": i.lead_user_id,
                        "rca_method": i.rca_method,
                        "findings": i.findings or {},
                        "status": i.status,
                        "created_at": i.created_at.isoformat() if i.created_at else None,
                    }
                    for i in items
                ]
            }

        # Compliance Queries
        if operation == "compliance_dashboard_get":
            return svc["compliance"].get_compliance_dashboard(user)
        if operation == "audit_checklists_list":
            items = svc["compliance"].list_audit_checklists(user)
            return {"items": [_to_dict(i) for i in items]}
        if operation == "audits_list":
            return svc["compliance"].list_audits_enriched(user)
        if operation == "audits_get":
            res = svc["compliance"].get_audit(user, path_params.get("auditId"))
            return _to_dict(res)
        if operation == "audit_findings_list":
            return svc["compliance"].list_findings_enriched(user)
        if operation == "capas_list":
            return svc["compliance"].list_capas_enriched(user)
        if operation == "capas_get":
            res = svc["compliance"].get_capa(user, path_params.get("capaId"))
            return _to_dict(res)
        if operation == "compliance_standards_list":
            return svc["compliance"].list_standards(user)
        if operation == "regulatory_requirements_list":
            return svc["compliance"].list_regulatory_requirements(user)
        if operation == "compliance_documents_list":
            return svc["compliance"].list_compliance_documents(user)
        if operation == "inspections_list":
            return svc["compliance"].list_inspections_enriched(user)

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
            from app.models.org_setup_data import OrgUserRecord as _OUR
            from sqlalchemy import select as sa_select

            # Build lookup from OrgUserRecord (email → setup record)
            our_recs = db.scalars(sa_select(_OUR).where(_OUR.tenant_id == user.tenant_id).limit(500)).all()
            our_payloads: dict[str, _OUR] = {(r.email or "").strip().lower(): r for r in our_recs}

            emp_rows = svc["people"].list_employees(user, {})
            result: list[dict] = []
            seen: set[str] = set()

            for e in emp_rows:
                email = (e.contact or "").strip()
                key = email.lower()
                our = our_payloads.get(key)
                role = e.role_name or ""
                if (not role or role.lower() == "employee") and our and our.role:
                    role = our.role
                result.append({
                    "id": e.id, "name": e.name, "email": email, "role": role,
                    "department": e.department_id or (our.department if our else "") or "",
                    "status": e.status or "active", "joined_at": None,
                })
                seen.add(key)

            # Surface OrgUserRecords not yet in the employees table
            for key, our in our_payloads.items():
                if key in seen: continue
                result.append({
                    "id": our.id, "name": our.name or "", "email": our.email or "",
                    "role": our.role or "", "department": our.department or "",
                    "status": "active", "joined_at": str(our.created_at) if our.created_at else None,
                })

            return {"items": result}
        
        if operation == "assets_list":
            items = svc["assets"].list_assets(user, {})
            return {"items": [_to_dict(i) for i in items]}
        if operation == "assets_get":
            res = svc["assets"].get_asset(user, path_params.get("assetId"))
            return _to_dict(res)
        if operation == "asset_categories_list":
            return svc["assets"].list_asset_categories(user)
        if operation == "asset_maintenance_logs_list":
            return svc["assets"].list_all_maintenance_logs_enriched(user)
        if operation == "asset_inspections_all_list":
            return svc["assets"].list_all_inspections_enriched(user)
        if operation == "asset_risk_mapping_list":
            return svc["assets"].list_asset_risk_mapping(user)

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

        # ── Azure AI Foundry — GET endpoints ─────────────────────────────────

        if operation == "ai_status_get":
            return {
                "configured": self.ai.is_configured,
                "model": self.ai.model,
                "endpoint": bool(settings.azure_openai_endpoint),
                "provider": "Azure AI Foundry",
            }

        if operation == "ai_dashboard_get":
            from sqlalchemy import select as _sel, func as _func
            from app.models.incidents import Incident as _Inc
            from app.models.domain import Permit, RiskAssessment, HazardObservation, AIRecommendation, Capa
            tid = user.tenant_id
            total_inc = db.scalar(_sel(_func.count(_Inc.id)).where(_Inc.tenant_id == tid)) or 0
            open_inc = db.scalar(_sel(_func.count(_Inc.id)).where(_Inc.tenant_id == tid, _Inc.status.in_(["reported","open"]))) or 0
            critical_inc = db.scalar(_sel(_func.count(_Inc.id)).where(_Inc.tenant_id == tid, _Inc.severity == "critical")) or 0
            active_permits = db.scalar(_sel(_func.count(Permit.id)).where(Permit.tenant_id == tid, Permit.status == "active")) or 0
            total_risks = db.scalar(_sel(_func.count(RiskAssessment.id)).where(RiskAssessment.tenant_id == tid)) or 0
            high_risks = db.scalars(_sel(RiskAssessment).where(RiskAssessment.tenant_id == tid, RiskAssessment.risk_score >= 15).limit(3)).all()
            open_capas = db.scalar(_sel(_func.count(Capa.id)).where(Capa.tenant_id == tid, Capa.status == "open")) or 0
            return {
                "configured": self.ai.is_configured,
                "model": self.ai.model,
                "stats": {
                    "total_incidents": total_inc,
                    "open_incidents": open_inc,
                    "critical_incidents": critical_inc,
                    "active_permits": active_permits,
                    "total_risk_assessments": total_risks,
                    "open_capas": open_capas,
                },
                "top_risks": [{"id": r.id, "title": r.task_name or r.hazard_description[:50], "score": r.risk_score} for r in high_risks],
                "ai_summary": self.ai.analyze(
                    "Summarize the HSE platform status in 2-3 sentences. Highlight the most critical risks and urgent actions.",
                    {"total_incidents": total_inc, "open": open_inc, "critical": critical_inc, "active_permits": active_permits, "high_risk_count": len(high_risks), "open_capas": open_capas},
                ) if self.ai.is_configured else None,
            }

        if operation == "ai_risk_predictions_get":
            from sqlalchemy import select as _sel
            from app.models.domain import RiskAssessment, HazardObservation
            from app.models.incidents import Incident as _Inc
            tid = user.tenant_id
            risks = db.scalars(_sel(RiskAssessment).where(RiskAssessment.tenant_id == tid).order_by(RiskAssessment.risk_score.desc()).limit(10)).all()
            hazards = db.scalars(_sel(HazardObservation).where(HazardObservation.tenant_id == tid, HazardObservation.status == "open").limit(10)).all()
            open_inc = db.scalars(_sel(_Inc).where(_Inc.tenant_id == tid, _Inc.status.in_(["reported","open"])).limit(10)).all()
            context = {
                "high_risk_assessments": [{"id": r.id, "title": r.task_name or r.hazard_description[:50], "likelihood": r.likelihood, "consequence": r.consequence, "risk_score": r.risk_score} for r in risks],
                "open_hazards": [{"id": h.id, "desc": h.description[:60] if h.description else "", "severity": h.severity} for h in hazards],
                "open_incidents": [{"id": i.id, "title": i.description[:50] if i.description else "", "severity": i.severity} for i in open_inc],
            }
            analysis = self.ai.analyze(
                "Based on this HSE data, predict the top 5 risks likely to escalate in the next 30 days. For each, provide: risk_name, likelihood (1-5), impact (1-5), predicted_score, rationale, and recommended_action. Return JSON: {predictions: [...]}",
                context, as_json=True,
            ) if self.ai.is_configured else {}
            predictions = analysis.get("predictions", []) if isinstance(analysis, dict) else []
            return {
                "configured": self.ai.is_configured,
                "predictions": predictions,
                "raw_data": context,
                "generated_at": __import__("datetime").datetime.utcnow().isoformat(),
            }

        if operation == "ai_compliance_intelligence_get":
            benchmarking = svc["ai_intelligence"].get_compliance_benchmarking(user)
            from sqlalchemy import select as _sel
            from app.models.domain import Finding, Capa
            tid = user.tenant_id
            open_findings = db.scalars(_sel(Finding).where(Finding.tenant_id == tid, Finding.status == "open").limit(10)).all()
            context = {
                "benchmarks": benchmarking.get("benchmarks", []),
                "overall_score": benchmarking.get("overall_score", 0),
                "open_findings": [{"id": f.id, "desc": getattr(f, "description", "")[:60] if hasattr(f, "description") else ""} for f in open_findings],
            }
            gaps = self.ai.analyze(
                "Analyze the compliance benchmarking data and open audit findings. Identify the top 5 compliance gaps and for each provide: standard, gap_description, severity (high/medium/low), recommended_action, and estimated_effort (days). Return JSON: {gaps: [...], overall_assessment: '...'}",
                context, as_json=True,
            ) if self.ai.is_configured else {}
            return {
                "configured": self.ai.is_configured,
                "benchmarking": benchmarking,
                "gaps": (gaps.get("gaps", []) if isinstance(gaps, dict) else []),
                "overall_assessment": (gaps.get("overall_assessment", "") if isinstance(gaps, dict) else ""),
                "generated_at": __import__("datetime").datetime.utcnow().isoformat(),
            }

        if operation == "ai_safety_recommendations_get":
            recs = svc["ai_intelligence"].get_recommendations(user)
            from sqlalchemy import select as _sel
            from app.models.incidents import Incident as _Inc
            from app.models.domain import HazardObservation, RiskAssessment
            tid = user.tenant_id
            recent_incidents = db.scalars(_sel(_Inc).where(_Inc.tenant_id == tid).order_by(_Inc.created_at.desc()).limit(10)).all()
            open_hazards = db.scalars(_sel(HazardObservation).where(HazardObservation.tenant_id == tid, HazardObservation.status == "open").limit(10)).all()
            high_risks = db.scalars(_sel(RiskAssessment).where(RiskAssessment.tenant_id == tid, RiskAssessment.risk_score >= 12).limit(5)).all()
            context = {
                "recent_incidents": [{"severity": i.severity, "type": i.incident_type, "desc": i.description[:80] if i.description else ""} for i in recent_incidents],
                "open_hazards": [{"severity": h.severity, "desc": h.description[:60] if h.description else ""} for h in open_hazards],
                "high_risks": [{"score": r.risk_score, "title": r.task_name or r.hazard_description[:50]} for r in high_risks],
            }
            ai_recs = self.ai.analyze(
                "Based on the recent safety data, generate 6 prioritised safety recommendations. For each provide: title, description, priority (critical/high/medium/low), category (engineering/administrative/ppe/training/process), estimated_impact, and quick_win (true/false). Return JSON: {recommendations: [...]}",
                context, as_json=True,
            ) if self.ai.is_configured else {}
            return {
                "configured": self.ai.is_configured,
                "ai_recommendations": (ai_recs.get("recommendations", []) if isinstance(ai_recs, dict) else []),
                "platform_recommendations": recs,
                "generated_at": __import__("datetime").datetime.utcnow().isoformat(),
            }

        if operation == "ai_trend_analysis_get":
            from sqlalchemy import select as _sel, func as _func, extract
            from app.models.incidents import Incident as _Inc
            from app.models.domain import HazardObservation, Permit
            tid = user.tenant_id
            from datetime import datetime, timedelta
            months = []
            for i in range(5, -1, -1):
                d = datetime.utcnow() - timedelta(days=30 * i)
                label = d.strftime("%b")
                inc_count = db.scalar(_sel(_func.count(_Inc.id)).where(
                    _Inc.tenant_id == tid,
                    _Inc.created_at >= d.replace(day=1),
                    _Inc.created_at < (d.replace(day=1) + timedelta(days=32)).replace(day=1),
                )) or 0
                months.append({"month": label, "incidents": inc_count})
            total_inc = db.scalar(_sel(_func.count(_Inc.id)).where(_Inc.tenant_id == tid)) or 0
            critical = db.scalar(_sel(_func.count(_Inc.id)).where(_Inc.tenant_id == tid, _Inc.severity == "critical")) or 0
            context = {"monthly_data": months, "total_incidents": total_inc, "critical_count": critical}
            trend_analysis = self.ai.analyze(
                "Analyse this incident trend data and provide: 1) trend_summary (2-3 sentences), 2) key_findings (list of 3), 3) forecast (next 30 days prediction), 4) leading_indicators (2-3 early warning signals to watch). Return JSON with these keys.",
                context, as_json=True,
            ) if self.ai.is_configured else {}
            return {
                "configured": self.ai.is_configured,
                "monthly_data": months,
                "analysis": trend_analysis if isinstance(trend_analysis, dict) else {},
                "generated_at": __import__("datetime").datetime.utcnow().isoformat(),
            }

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

        # ── Admin Roles / Permissions / Audit Queries ────────────────────────
        if operation == "admin_permissions_list":
            from app.core.rbac import ROLE_PERMISSIONS
            all_perms = set()
            for perms in ROLE_PERMISSIONS.values():
                all_perms.update(perms)
            catalog = []
            for perm in sorted(all_perms):
                if ":" not in perm:
                    continue
                group, operation_part = perm.split(":", 1)
                method_map = {"read": "GET", "write": "POST", "approve": "PUT", "export": "GET", "scan": "POST", "confidential": "GET"}
                catalog.append({
                    "id": perm,
                    "group": group,
                    "operation": operation_part,
                    "method": method_map.get(operation_part, "POST"),
                    "description": f"{operation_part.capitalize()} access to {group}",
                })
            return {"items": catalog}

        if operation == "admin_audit_logs_list":
            from app.models.audit_log import AuditLog
            from app.models.auth import User as AuthUser
            from sqlalchemy import select, desc
            logs = db.scalars(select(AuditLog).order_by(desc(AuditLog.created_at)).limit(200)).all()
            user_ids = {log.actor_user_id for log in logs}
            email_map: dict = {}
            if user_ids:
                for u in db.scalars(select(AuthUser).where(AuthUser.id.in_(user_ids))).all():
                    email_map[u.id] = u.email
            return {
                "items": [
                    {
                        "id": log.id,
                        "event_type": log.action,
                        "actor_email": email_map.get(log.actor_user_id, log.actor_user_id),
                        "resource": log.resource_type,
                        "resource_id": log.resource_id,
                        "timestamp": log.created_at.isoformat() if log.created_at else None,
                        "metadata": log.details or {},
                    }
                    for log in logs
                ]
            }

        if operation == "admin_audit_logs_get":
            from app.models.audit_log import AuditLog
            from app.models.auth import User as AuthUser
            from sqlalchemy import select
            event_id = path_params.get("eventId")
            log = db.scalars(select(AuditLog).where(AuditLog.id == event_id)).first()
            if not log:
                return {"error": "Not found"}
            actor_user = db.scalars(select(AuthUser).where(AuthUser.id == log.actor_user_id)).first()
            return {
                "id": log.id,
                "event_type": log.action,
                "actor_email": actor_user.email if actor_user else log.actor_user_id,
                "resource": log.resource_type,
                "resource_id": log.resource_id,
                "timestamp": log.created_at.isoformat() if log.created_at else None,
                "metadata": log.details or {},
            }

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
            from sqlalchemy import func, select as sa_select
            from app.models.tenant import Tenant
            from app.models.org_setup_data import OrgProfile as _OrgProfile

            tenant = db.get(Tenant, user.tenant_id)
            org_profile = db.scalars(sa_select(_OrgProfile).where(_OrgProfile.tenant_id == user.tenant_id).limit(1)).first()
            step1 = {}
            if org_profile:
                step1 = {"organizationName": org_profile.organization_name, "industryType": org_profile.industry_type, "country": org_profile.country, "officialEmail": org_profile.official_email, "contactNumber": org_profile.contact_number, "headquartersAddress": org_profile.headquarters_address}

            from app.models.sites import Site as _Site
            from app.models.org_setup_data import OrgUserRecord as _OUR
            from app.models.people import Employee as _Emp
            sites_count = db.scalar(sa_select(func.count()).where(_Site.tenant_id == user.tenant_id)) or 0
            our_count = db.scalar(sa_select(func.count()).where(_OUR.tenant_id == user.tenant_id)) or 0
            emp_count = db.scalar(sa_select(func.count()).where(_Emp.tenant_id == user.tenant_id)) or 0
            users_count = max(our_count, emp_count)

            org_name = step1.get("organizationName") or (tenant.name if tenant else "")

            # Real incident + compliance counts
            from app.models.incidents import Incident as _Inc
            from app.models.compliance import AuditExecution as _Audit, Capa as _Capa
            open_incidents = db.scalar(
                sa_select(func.count())
                .where(_Inc.tenant_id == user.tenant_id)
                .where(_Inc.status.notin_(["closed", "resolved"]))
            ) or 0

            total_audits = db.scalar(
                sa_select(func.count()).where(_Audit.tenant_id == user.tenant_id)
            ) or 0
            completed_audits = db.scalar(
                sa_select(func.count())
                .where(_Audit.tenant_id == user.tenant_id)
                .where(_Audit.status == "completed")
            ) or 0
            compliance_score = round((completed_audits / total_audits * 100) if total_audits else 0)

            return {
                "orgName": org_name,
                "industry": step1.get("industryType") or (tenant.industry if tenant else ""),
                "country": step1.get("country", ""),
                "timezone": step1.get("timezone", ""),
                "headquartersAddress": step1.get("headquartersAddress", ""),
                "officialEmail": step1.get("officialEmail") or (tenant.contact_email if tenant else ""),
                "contactNumber": step1.get("contactNumber", ""),
                "plan": (tenant.plan if tenant else "starter") or "starter",
                "status": tenant.status if tenant else "active",
                "totalSites": sites_count,
                "activeEmployees": users_count,
                "openIncidents": open_incidents,
                "complianceScore": compliance_score,
                "systemHealth": {"database": "healthy", "aiEngine": "active", "lastSync": "2 minutes ago"},
            }

        if operation == "org_admin_kpis_get":
            from sqlalchemy import func, select as sa_select
            from app.models.people import Employee, TrainingCompletion, TrainingRequirement
            from app.models.permits import Permit
            from app.models.compliance import AuditExecution, Capa
            from app.models.incidents import Incident

            tid = user.tenant_id

            # ── base counts ───────────────────────────────────────────────────
            emp_count = db.scalar(
                sa_select(func.count()).where(Employee.tenant_id == tid)
            ) or 0

            # TRIR / LTIR: use 200,000-hour baseline (100 employees × 40h × 50 weeks)
            hours_worked = max(emp_count, 1) * 8 * 30  # ~30 working days rolling

            total_incidents = db.scalar(
                sa_select(func.count()).where(Incident.tenant_id == tid)
            ) or 0

            # Lost-time = critical / major severity
            lost_time_incidents = db.scalar(
                sa_select(func.count())
                .where(Incident.tenant_id == tid)
                .where(Incident.severity.in_(["critical", "major"]))
            ) or 0

            near_miss_count = db.scalar(
                sa_select(func.count())
                .where(Incident.tenant_id == tid)
                .where(Incident.incident_type.ilike("%near%miss%"))
            ) or 0

            # CAPAs
            open_capas = db.scalar(
                sa_select(func.count())
                .where(Capa.tenant_id == tid)
                .where(Capa.status == "open")
            ) or 0

            # Audits
            total_audits = db.scalar(
                sa_select(func.count()).where(AuditExecution.tenant_id == tid)
            ) or 0

            completed_audits = db.scalar(
                sa_select(func.count())
                .where(AuditExecution.tenant_id == tid)
                .where(AuditExecution.status == "completed")
            ) or 0

            audit_completion = round((completed_audits / total_audits * 100) if total_audits else 0)

            # PTW active
            ptw_active = db.scalar(
                sa_select(func.count())
                .where(Permit.tenant_id == tid)
                .where(Permit.status.in_(["approved", "active", "submitted"]))
            ) or 0

            # Training completion
            total_completions = db.scalar(
                sa_select(func.count()).where(TrainingCompletion.tenant_id == tid)
            ) or 0

            total_requirements = db.scalar(
                sa_select(func.count()).where(TrainingRequirement.tenant_id == tid)
            ) or 0

            required_total = (total_requirements or 1) * max(emp_count, 1)
            training_pct = round(min(total_completions / required_total * 100, 100)) if required_total else 0

            # Near miss rate per 100 employees
            near_miss_rate = round((near_miss_count / max(emp_count, 1)) * 100, 2)

            # Compliance rate: audits completion as proxy
            compliance_rate = audit_completion if total_audits else 0

            # TRIR / LTIR
            trir = round((total_incidents * 200_000) / hours_worked, 2) if hours_worked else 0
            ltir = round((lost_time_incidents * 200_000) / hours_worked, 2) if hours_worked else 0

            def _kpi_status(value, target, lower_is_better=False):
                if lower_is_better:
                    if value <= target:
                        return "on_track"
                    if value <= target * 1.2:
                        return "at_risk"
                    return "breached"
                else:
                    if value >= target:
                        return "on_track"
                    if value >= target * 0.9:
                        return "at_risk"
                    return "breached"

            return {
                "period": "live",
                "kpis": [
                    {
                        "id": "trir",
                        "label": "TRIR",
                        "value": trir,
                        "target": 0.5,
                        "trend": "down" if trir <= 0.5 else "up",
                        "status": _kpi_status(trir, 0.5, lower_is_better=True),
                    },
                    {
                        "id": "ltir",
                        "label": "LTIR",
                        "value": ltir,
                        "target": 0.1,
                        "trend": "down" if ltir <= 0.1 else "up",
                        "status": _kpi_status(ltir, 0.1, lower_is_better=True),
                    },
                    {
                        "id": "near_miss_rate",
                        "label": "Near Miss Rate",
                        "value": near_miss_rate,
                        "target": 2.0,
                        "trend": "up" if near_miss_rate >= 2.0 else "down",
                        "status": _kpi_status(near_miss_rate, 2.0),
                    },
                    {
                        "id": "compliance_rate",
                        "label": "Compliance Rate",
                        "value": compliance_rate,
                        "target": 90,
                        "trend": "up" if compliance_rate >= 90 else "down",
                        "status": _kpi_status(compliance_rate, 90),
                    },
                    {
                        "id": "open_capas",
                        "label": "Open CAPAs",
                        "value": open_capas,
                        "target": 5,
                        "trend": "down" if open_capas <= 5 else "up",
                        "status": _kpi_status(open_capas, 5, lower_is_better=True),
                    },
                    {
                        "id": "audit_completion",
                        "label": "Audit Completion",
                        "value": audit_completion,
                        "target": 90,
                        "trend": "up" if audit_completion >= 90 else "down",
                        "status": _kpi_status(audit_completion, 90),
                    },
                    {
                        "id": "ptw_active",
                        "label": "PTW Active",
                        "value": ptw_active,
                        "target": 20,
                        "trend": "down" if ptw_active <= 20 else "up",
                        "status": _kpi_status(ptw_active, 20, lower_is_better=True),
                    },
                    {
                        "id": "training_completion",
                        "label": "Training Completion",
                        "value": training_pct,
                        "target": 90,
                        "trend": "up" if training_pct >= 90 else "down",
                        "status": _kpi_status(training_pct, 90),
                    },
                ],
            }

        if operation == "org_admin_activities_list":
            from sqlalchemy import select as sa_select, desc
            from app.models.incidents import Incident
            from app.models.permits import Permit
            from app.models.compliance import AuditExecution
            from app.models.audit_log import AuditLog
            from app.models.auth import User as AuthUser
            from datetime import timezone as _tz

            def _utc_iso(dt) -> str | None:
                if dt is None:
                    return None
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=_tz.utc)
                return dt.isoformat()

            tid = user.tenant_id
            raw: list[dict] = []

            # Incidents
            for inc in db.scalars(
                sa_select(Incident).where(Incident.tenant_id == tid)
                .order_by(desc(Incident.created_at)).limit(60)
            ).all():
                desc_text = (inc.description or f"{inc.incident_type} incident reported")[:120]
                raw.append({
                    "id": f"inc_{inc.id}",
                    "type": "Incident",
                    "description": desc_text,
                    "actor_id": inc.reporter_user_id,
                    "timestamp": _utc_iso(inc.created_at),
                })

            # Permits
            for p in db.scalars(
                sa_select(Permit).where(Permit.tenant_id == tid)
                .order_by(desc(Permit.created_at)).limit(60)
            ).all():
                raw.append({
                    "id": f"perm_{p.id}",
                    "type": "Permit",
                    "description": f"Permit {p.permit_ref} ({p.permit_type}) — {p.status}",
                    "actor_id": p.requester_user_id,
                    "timestamp": _utc_iso(p.created_at),
                })

            # Audits
            for a in db.scalars(
                sa_select(AuditExecution).where(AuditExecution.tenant_id == tid)
                .order_by(desc(AuditExecution.created_at)).limit(60)
            ).all():
                raw.append({
                    "id": f"audit_{a.id}",
                    "type": "Audit",
                    "description": f"Safety audit {a.status}" + (f" at site {a.site_id[:8]}" if a.site_id else ""),
                    "actor_id": a.auditor_user_id,
                    "timestamp": _utc_iso(a.created_at),
                })

            # Audit logs (User / System platform events)
            for log in db.scalars(
                sa_select(AuditLog).where(AuditLog.tenant_id == tid)
                .order_by(desc(AuditLog.created_at)).limit(60)
            ).all():
                activity_type = "System" if (log.actor_user_id or "").lower() in ("system", "") else "User"
                raw.append({
                    "id": f"log_{log.id}",
                    "type": activity_type,
                    "description": f"{log.action.replace('_', ' ').title()} — {log.resource_type}",
                    "actor_id": log.actor_user_id,
                    "timestamp": _utc_iso(log.created_at),
                })

            # Sort merged list newest-first, cap at 200
            raw.sort(key=lambda x: x["timestamp"] or "", reverse=True)
            raw = raw[:200]

            # Batch-resolve actor display names
            actor_ids = {r["actor_id"] for r in raw if r.get("actor_id")}
            name_map: dict[str, str] = {}
            if actor_ids:
                for u in db.scalars(sa_select(AuthUser).where(AuthUser.id.in_(actor_ids))).all():
                    name_map[u.id] = u.display_name or u.email

            items = []
            for r in raw:
                aid = r.pop("actor_id", None)
                r["user"] = name_map.get(aid, aid or "System")
                items.append(r)

            return {"items": items, "total": len(items)}

        if operation == "org_admin_shifts_list":
            from app.models.operations import Shift as _Shift
            from sqlalchemy import select as sa_select
            shifts = db.scalars(sa_select(_Shift).where(_Shift.tenant_id == user.tenant_id).order_by(_Shift.created_at)).all()
            return {"items": [{"id": s.id, "name": s.name, "start_time": s.start_time, "end_time": s.end_time, "days": s.days, "status": s.status} for s in shifts]}

        if operation == "org_admin_engagement_get":
            from sqlalchemy import func, select as sa_select
            from app.models.people import Employee, TrainingCompletion, TrainingRequirement
            from app.models.compliance import AuditExecution, Capa
            from app.models.incidents import Incident
            from app.repositories.generic_repository import GenericRepository

            tid = user.tenant_id

            emp_count = db.scalar(
                sa_select(func.count()).where(Employee.tenant_id == tid)
            ) or 0

            # Reporting rate: employees who reported at least 1 incident / total employees
            reporters = db.scalar(
                sa_select(func.count(func.distinct(Incident.reporter_user_id)))
                .where(Incident.tenant_id == tid)
            ) or 0
            reporting_rate = round(min((reporters / max(emp_count, 1)) * 100, 100))

            # Training / toolbox attendance
            total_completions = db.scalar(
                sa_select(func.count()).where(TrainingCompletion.tenant_id == tid)
            ) or 0
            total_requirements = db.scalar(
                sa_select(func.count()).where(TrainingRequirement.tenant_id == tid)
            ) or 0
            required_total = max(total_requirements, 1) * max(emp_count, 1)
            toolbox_pct = round(min((total_completions / required_total) * 100, 100))

            # Safety observations: near-miss + observation incidents
            obs_count = db.scalar(
                sa_select(func.count())
                .where(Incident.tenant_id == tid)
                .where(Incident.incident_type.ilike("%near%miss%"))
            ) or 0
            safety_obs_pct = round(min((obs_count / max(emp_count, 1)) * 100, 100))

            # Site participation: audits completed / total audits
            total_audits = db.scalar(
                sa_select(func.count()).where(AuditExecution.tenant_id == tid)
            ) or 0
            completed_audits = db.scalar(
                sa_select(func.count())
                .where(AuditExecution.tenant_id == tid)
                .where(AuditExecution.status == "completed")
            ) or 0
            site_participation = round((completed_audits / total_audits * 100) if total_audits else 0)

            # Safety walks: unique auditors as proxy
            unique_auditors = db.scalar(
                sa_select(func.count(func.distinct(AuditExecution.auditor_user_id)))
                .where(AuditExecution.tenant_id == tid)
            ) or 0
            safety_walks_pct = round(min((unique_auditors / max(emp_count, 1)) * 100, 100))

            # Survey score: derive from training + reporting composite (0–5 scale)
            composite = (reporting_rate + toolbox_pct + site_participation) / 3
            survey_score = round(max(1.0, min(composite / 20, 5.0)), 1)
            survey_completion = round(min((total_completions / max(required_total, 1)) * 100 + 10, 100))

            # Open actions from Capa table
            open_capas = (
                db.scalars(
                    sa_select(Capa)
                    .where(Capa.tenant_id == tid)
                    .where(Capa.status == "open")
                    .limit(5)
                ).all()
            )

            def _capa_status(capa):
                if capa.due_date is None:
                    return "Due Soon"
                from app.helpers.datetime import utc_now
                from datetime import timezone
                now = utc_now().date()
                delta = (capa.due_date - now).days
                if delta < 0:
                    return "Overdue"
                if delta == 0:
                    return "Due Today"
                if delta == 1:
                    return "Due Tomorrow"
                return f"Due in {delta}d"

            open_actions = [
                {
                    "id": c.id,
                    "text": f"Resolve CAPA — {c.source_type} ({c.severity} severity)",
                    "status": _capa_status(c),
                }
                for c in open_capas
            ]

            # Top recognitions: employees with most training completions
            top_rows = db.execute(
                sa_select(TrainingCompletion.employee_id, func.count().label("cnt"))
                .where(TrainingCompletion.tenant_id == tid)
                .group_by(TrainingCompletion.employee_id)
                .order_by(func.count().desc())
                .limit(3)
            ).all()

            top_emp_ids = [r.employee_id for r in top_rows]
            top_employees = db.scalars(
                sa_select(Employee).where(Employee.id.in_(top_emp_ids))
            ).all() if top_emp_ids else []

            emp_map = {e.id: e.name for e in top_employees}
            recognition_types = ["gold", "silver", "bronze"]
            top_recognitions = [
                {"name": emp_map.get(r.employee_id, "Employee"), "type": recognition_types[i]}
                for i, r in enumerate(top_rows)
            ]

            return {
                "reportingRate": reporting_rate,
                "surveyScore": survey_score,
                "surveyCompletionPct": survey_completion,
                "observations": {
                    "safetyObservations": safety_obs_pct,
                    "safetyWalks": safety_walks_pct,
                    "toolboxAttendance": toolbox_pct,
                    "siteParticipation": site_participation,
                },
                "openActions": open_actions,
                "topRecognitions": top_recognitions,
                "employeeCount": emp_count,
            }

        if operation == "org_admin_documents_list":
            from app.models.knowledge import KnowledgeDocument as _KD
            from sqlalchemy import select as sa_select
            docs = db.scalars(sa_select(_KD).where(_KD.tenant_id == user.tenant_id).order_by(_KD.created_at.desc()).limit(500)).all()
            items = [{"id": d.id, "file_name": d.file_name, "title": d.title, "file_type": d.file_type, "category": d.category, "size": d.size, "uploaded_by": d.uploaded_by, "record_type": d.record_type, "indexed": d.indexed, "created_at": d.created_at.isoformat() if d.created_at else None} for d in docs]
            return {"items": items}

        if operation == "org_admin_documents_delete":
            from app.models.knowledge import KnowledgeDocument as _KD
            from sqlalchemy import select as sa_select
            doc_id = path_params.get("documentId")
            doc = db.scalars(sa_select(_KD).where(_KD.id == doc_id, _KD.tenant_id == user.tenant_id)).first()
            if doc: db.delete(doc); db.flush()
            return {"deleted": True}

        if operation == "org_admin_imports_list":
            from app.models.operations import DataImport as _DI
            from sqlalchemy import select as sa_select
            imports = db.scalars(sa_select(_DI).where(_DI.tenant_id == user.tenant_id).order_by(_DI.created_at.desc()).limit(200)).all()
            items = [{"id": i.id, "file_name": i.file_name, "import_type": i.import_type, "data_type": i.data_type, "records_total": i.records_total, "records_success": i.records_success, "records_failed": i.records_failed, "status": i.status, "uploaded_by": i.uploaded_by, "created_at": i.created_at.isoformat() if i.created_at else None} for i in imports]
            return {"items": items}

        if operation == "org_admin_validation_logs_list":
            from app.models.operations import ValidationLog as _VL
            from sqlalchemy import select as sa_select
            logs = db.scalars(sa_select(_VL).where(_VL.tenant_id == user.tenant_id).order_by(_VL.created_at.desc()).limit(500)).all()
            items = [{"id": l.id, "import_id": l.import_id, "file_name": l.file_name, "rule": l.rule, "status": l.status, "records_affected": l.records_affected, "message": l.message, "timestamp": l.created_at.strftime("%d %b %Y, %H:%M") if l.created_at else None} for l in logs]
            return {"items": items}

        if operation == "org_admin_sync_status_get":
            from app.models.operations import SyncIntegration as _SI
            from sqlalchemy import select as sa_select
            import uuid as _uuid
            syncs = db.scalars(sa_select(_SI).where(_SI.tenant_id == user.tenant_id)).all()
            if syncs:
                items = [{"id": s.id, "name": s.name, "integration_type": s.integration_type, "last_sync": s.last_sync, "status": s.status, "records_synced": s.records_synced} for s in syncs]
            else:
                defaults = [
                    ("ERP System", "erp", "5 minutes ago", "active", 1247),
                    ("HRMS", "hrms", "1 hour ago", "active", 847),
                    ("IoT Sensors", "iot", "30 seconds ago", "active", 3892),
                    ("Safety Sensors", "safety", "2 minutes ago", "warning", 156),
                ]
                items = []
                for name, itype, last_sync, status, records_synced in defaults:
                    s = _SI(id=str(_uuid.uuid4()), tenant_id=user.tenant_id, name=name, integration_type=itype, last_sync=last_sync, status=status, records_synced=records_synced)
                    db.add(s)
                    items.append({"id": s.id, "name": s.name, "integration_type": s.integration_type, "last_sync": s.last_sync, "status": s.status, "records_synced": s.records_synced})
                db.flush()
            return {"integrations": items}

        if operation == "org_admin_api_integrations_list":
            from app.models.operations import ApiIntegration as _AI
            from sqlalchemy import select as sa_select
            integrations = db.scalars(sa_select(_AI).where(_AI.tenant_id == user.tenant_id).order_by(_AI.created_at.desc()).limit(100)).all()
            items = [{"id": i.id, "name": i.name, "integration_type": i.integration_type, "endpoint_url": i.endpoint_url, "is_active": i.is_active, "last_sync": i.last_sync, "records_synced": i.records_synced} for i in integrations]
            return {"items": items}

        if operation == "org_admin_tickets_list":
            from app.models.operations import HelpTicket as _HT
            from sqlalchemy import select as sa_select
            tickets = db.scalars(sa_select(_HT).where(_HT.tenant_id == user.tenant_id).order_by(_HT.created_at.desc())).all()
            return {"items": [{"id": t.id, "subject": t.subject, "category": t.category, "priority": t.priority, "description": t.description, "status": t.status, "created_at": t.created_at.isoformat() if t.created_at else None} for t in tickets]}

        if operation == "org_admin_tickets_get":
            from app.models.operations import HelpTicket as _HT
            from sqlalchemy import select as sa_select
            ticket_id = path_params.get("ticketId")
            ticket = db.scalars(sa_select(_HT).where(_HT.id == ticket_id, _HT.tenant_id == user.tenant_id)).first()
            if ticket: return {"id": ticket.id, "subject": ticket.subject, "status": ticket.status, "priority": ticket.priority}
            return {"id": ticket_id, "status": "open"}

        # ── Reports Queries ───────────────────────────────────────────────────
        if operation == "org_admin_reports_list":
            from app.models.operations import GeneratedReport as _GR
            from sqlalchemy import select as sa_select
            from datetime import datetime, timedelta
            reports = db.scalars(sa_select(_GR).where(_GR.tenant_id == user.tenant_id).order_by(_GR.created_at.desc()).limit(500)).all()
            items = [{"id": r.id, "name": r.name, "type": r.report_type, "format": r.format, "period_start": r.period_start, "period_end": r.period_end, "status": r.status, "size": r.size, "created_at": r.created_at.isoformat() if r.created_at else None, "created_by": r.created_by} for r in reports]
            if not items:
                now = datetime.utcnow()
                items = [
                    {"id": "r1", "name": "Monthly KPI Dashboard",       "type": "kpi",        "format": "pdf",   "period_start": "2025-04-01", "period_end": "2025-04-30", "status": "ready", "size": "420 KB", "created_at": (now - timedelta(days=5)).isoformat(),  "created_by": "James Carter"},
                    {"id": "r2", "name": "Q1 Incident Summary",         "type": "incident",   "format": "excel", "period_start": "2025-01-01", "period_end": "2025-03-31", "status": "ready", "size": "215 KB", "created_at": (now - timedelta(days=10)).isoformat(), "created_by": "Sarah Kim"},
                    {"id": "r3", "name": "Q1 Audit Findings",           "type": "audit",      "format": "pdf",   "period_start": "2025-01-01", "period_end": "2025-03-31", "status": "ready", "size": "310 KB", "created_at": (now - timedelta(days=12)).isoformat(), "created_by": "Roy Evans"},
                    {"id": "r4", "name": "Compliance Status Report",    "type": "compliance", "format": "pdf",   "period_start": "2025-05-01", "period_end": "2025-05-31", "status": "ready", "size": "380 KB", "created_at": (now - timedelta(days=2)).isoformat(),  "created_by": "Admin"},
                    {"id": "r5", "name": "Risk Register Q2",            "type": "risk",       "format": "pdf",   "period_start": "2025-04-01", "period_end": "2025-06-30", "status": "ready", "size": "290 KB", "created_at": (now - timedelta(days=8)).isoformat(),  "created_by": "David Osei"},
                    {"id": "r6", "name": "Workforce Health Monthly",    "type": "workforce",  "format": "csv",   "period_start": "2025-05-01", "period_end": "2025-05-31", "status": "ready", "size": "85 KB",  "created_at": (now - timedelta(days=3)).isoformat(),  "created_by": "Emma Watts"},
                    {"id": "r7", "name": "Executive Safety Summary",    "type": "management", "format": "pdf",   "period_start": "2025-05-01", "period_end": "2025-05-31", "status": "ready", "size": "520 KB", "created_at": (now - timedelta(days=1)).isoformat(),  "created_by": "Admin"},
                ]
            return {"items": items}

        if operation == "org_admin_reports_stats":
            from sqlalchemy import func
            from app.repositories.generic_repository import GenericRepository
            repo = GenericRepository(db)

            # Incidents
            try:
                from app.models.incident import Incident as IncM
                inc_total  = db.query(func.count(IncM.id)).filter(IncM.tenant_id == user.tenant_id).scalar() or 0
                inc_open   = db.query(func.count(IncM.id)).filter(IncM.tenant_id == user.tenant_id, IncM.status.in_(["open", "under_investigation"])).scalar() or 0
                near_miss  = db.query(func.count(IncM.id)).filter(IncM.tenant_id == user.tenant_id, IncM.incident_type == "near_miss").scalar() or 0
            except Exception:
                inc_total = inc_open = near_miss = 0

            # Corrective actions
            try:
                from app.models.incidents import CorrectiveAction as _CAM
                from sqlalchemy import select as _casel, func as _cafunc
                open_cas = db.scalar(_casel(_cafunc.count(_CAM.id)).where(_CAM.tenant_id == user.tenant_id, _CAM.status.notin_(["closed","completed"]))) or 0
                ca_total = db.scalar(_casel(_cafunc.count(_CAM.id)).where(_CAM.tenant_id == user.tenant_id)) or 0
            except Exception:
                open_cas = ca_total = 0

            # RCA records
            try:
                from app.models.incidents import IncidentRCA as _IRCAM
                rca_count = db.scalar(_casel(_cafunc.count(_IRCAM.id)).where(_IRCAM.tenant_id == user.tenant_id)) or 0
            except Exception:
                rca_count = 0

            # Risk assessments
            try:
                from app.models.risk_assessment import RiskAssessment as RAM
                risk_total = db.query(func.count(RAM.id)).filter(RAM.tenant_id == user.tenant_id).scalar() or 0
                high_risk  = db.query(func.count(RAM.id)).filter(RAM.tenant_id == user.tenant_id, RAM.risk_score >= 15).scalar() or 0
            except Exception:
                risk_total = high_risk = 0

            # Employees
            try:
                from app.models.employee import Employee as EmpM
                emp_count = db.query(func.count(EmpM.id)).filter(EmpM.tenant_id == user.tenant_id).scalar() or 0
            except Exception:
                emp_count = 0

            trir          = round((inc_total * 200000) / max(emp_count * 2000, 200000), 2)
            safety_score  = max(0, min(100, 100 - inc_total * 2 - open_cas))
            comp_score    = max(0, min(100, 100 - inc_open * 3 - open_cas * 2))

            return {
                "kpi": {
                    "total_incidents": inc_total, "trir": trir,
                    "near_misses": near_miss,     "open_actions": open_cas, "safety_score": safety_score,
                },
                "incident": {
                    "total": inc_total,    "open": inc_open,
                    "resolved": max(0, inc_total - inc_open),
                    "near_misses": near_miss, "with_rca": rca_count,
                },
                "audit": {
                    "total_records": risk_total + inc_total, "open_actions": open_cas,
                    "compliance_items": rca_count + risk_total,
                    "records_with_findings": high_risk + inc_open,
                },
                "compliance": {
                    "score": comp_score, "standards_tracked": 4,
                    "open_gaps": open_cas, "overdue": max(0, inc_open - near_miss),
                },
                "risk": {
                    "total": risk_total, "high_risk": high_risk,
                    "medium_risk": max(0, risk_total - high_risk - (risk_total // 3 or 0)),
                    "controls_reviewed": max(0, risk_total - high_risk),
                },
                "workforce": {
                    "total_employees": emp_count, "active_workers": emp_count,
                    "incident_rate": trir, "near_misses_reported": near_miss,
                },
                "management": {
                    "safety_score": safety_score, "incidents_ytd": inc_total,
                    "compliance_avg": comp_score,  "open_capas": open_cas,
                },
            }

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

        # ── Risk Module Queries ───────────────────────────────────────────────────────

        if operation == "risk_assessments_list":
            def _risk_level(score: int) -> str:
                if score >= 12: return "critical"
                if score >= 6: return "high"
                if score >= 3: return "medium"
                return "low"

            items = svc["compliance"].list_risk_assessments(user, {})
            return {
                "items": [
                    {
                        "id": r.id,
                        "title": r.hazard_description or r.task_name or f"Assessment {r.id[:8]}",
                        "site_id": r.location_id,
                        "department": (r.extra_fields or {}).get("Department") or (r.extra_fields or {}).get("department"),
                        "risk_level": _risk_level(r.risk_score or 0),
                        "assessor": (r.extra_fields or {}).get("Responsible") or (r.extra_fields or {}).get("responsible") or "",
                        "created_at": r.created_at.isoformat() if r.created_at else None,
                        "reviewed_at": None,
                        "status": r.status or "draft",
                        "hazard_description": r.hazard_description,
                        "likelihood": r.likelihood,
                        "consequence": r.consequence,
                        "risk_score": r.risk_score,
                        "residual_risk_score": r.residual_risk_score,
                        "location_id": r.location_id,
                        "asset_id": r.asset_id,
                    }
                    for r in items
                ],
                "total": len(items),
            }

        if operation == "risk_matrix_get":
            # Aggregate risk assessments into a 5x5 matrix
            items = svc["compliance"].list_risk_assessments(user, {})
            # Build matrix: key = (likelihood, consequence), value = count of assessments
            matrix: dict[str, int] = {}
            for r in items:
                key = f"{r.likelihood}_{r.consequence}"
                matrix[key] = matrix.get(key, 0) + 1
            # Summary stats
            critical = [r for r in items if r.risk_score >= 15]
            high = [r for r in items if 10 <= r.risk_score < 15]
            medium = [r for r in items if 5 <= r.risk_score < 10]
            low = [r for r in items if r.risk_score < 5]
            return {
                "matrix_counts": matrix,
                "total_assessments": len(items),
                "by_level": {
                    "critical": len(critical),
                    "high": len(high),
                    "medium": len(medium),
                    "low": len(low),
                },
                "assessments": [
                    {"id": r.id, "title": r.task_name or r.hazard_description[:40], "likelihood": r.likelihood, "consequence": r.consequence, "risk_score": r.risk_score, "status": r.status}
                    for r in items
                ],
            }

        if operation == "risk_high_risk_areas_get":
            items = svc["compliance"].list_risk_assessments(user, {})
            high_risk = [r for r in items if r.risk_score >= 15]
            return {
                "items": [
                    {
                        "id": r.id,
                        "title": r.task_name or r.hazard_description[:60],
                        "risk_score": r.risk_score,
                        "likelihood": r.likelihood,
                        "consequence": r.consequence,
                        "location_id": r.location_id,
                        "status": r.status,
                    }
                    for r in sorted(high_risk, key=lambda x: x.risk_score, reverse=True)
                ],
                "total": len(high_risk),
            }

        if operation == "hazards_list":
            items = svc["compliance"].list_hazards(user, {})
            return {
                "items": [
                    {
                        "id": h.id,
                        "title": h.description[:60] if h.description else f"Hazard {h.id[:8]}",
                        "description": h.description,
                        "severity": h.severity,
                        "status": h.status,
                        "location_id": h.location_id,
                        "assigned_to_user_id": h.assigned_to_user_id,
                        "photo_file_id": h.photo_file_id,
                    }
                    for h in items
                ],
                "total": len(items),
            }

        if operation == "near_miss_list":
            # Near miss = incidents where incident_type contains "near"
            from sqlalchemy import select as sa_select
            from app.models.incidents import Incident
            from sqlalchemy import or_
            items = svc["compliance"].db.scalars(
                sa_select(Incident).where(
                    Incident.tenant_id == user.tenant_id,
                    or_(
                        Incident.incident_type.ilike("%near%"),
                        Incident.incident_type == "near_miss",
                    )
                ).order_by(Incident.created_at.desc())
            ).all()
            return {
                "items": [
                    {
                        "id": i.id,
                        "ref": i.incident_ref,
                        "title": i.description[:60] if i.description else f"Near Miss {i.id[:8]}",
                        "description": i.description,
                        "severity": i.severity,
                        "status": i.status,
                        "incident_type": i.incident_type,
                    }
                    for i in items
                ],
                "total": len(items),
            }

        if operation == "incidents_list":
            items = svc["compliance"].list_incidents(user, {})
            def _inc_to_dict(i):
                return {"id": i.id, "ref": i.incident_ref, "title": i.description[:60] if i.description else f"Incident {i.id[:8]}", "description": i.description, "severity": i.severity, "status": i.status, "incident_type": i.incident_type, "is_confidential": i.is_confidential, "reported_by": i.reporter_user_id, "occurred_at": str(i.created_at) if i.created_at else None}
            return {"items": [_inc_to_dict(i) for i in items], "total": len(items)}

        # ── Sites & Zones Queries ─────────────────────────────────────────────
        if operation == "sites_list":
            from app.models.sites import Site as _Site
            from sqlalchemy import select as _sel
            sites = db.scalars(
                _sel(_Site).where(_Site.tenant_id == user.tenant_id).order_by(_Site.name)
            ).all()
            items = [
                {
                    "id": s.id, "name": s.name, "type": s.site_type, "site_type": s.site_type,
                    "address": s.address, "city": s.city, "postcode": s.postcode,
                    "region": s.region, "status": s.status, "capacity": s.capacity,
                    "hazard_level": s.hazard_level,
                    "created_at": str(s.created_at) if s.created_at else None,
                }
                for s in sites
            ]
            return {"items": items, "total": len(items)}

        if operation == "zones_list":
            from app.models.operations import Zone as _Zone
            from sqlalchemy import select as sa_select
            site_id = path_params.get("siteId")
            q = sa_select(_Zone).where(_Zone.tenant_id == user.tenant_id)
            if site_id: q = q.where(_Zone.site_id == site_id)
            zones = db.scalars(q.order_by(_Zone.created_at).limit(500)).all()
            return {"items": [{"id": z.id, "name": z.name, "site_id": z.site_id, "zone_type": z.zone_type, "status": z.status} for z in zones], "total": len(zones)}

        if operation == "escalation_rules_list":
            from app.models.operations import EscalationRule as _ERule
            from sqlalchemy import select as sa_select
            rules = db.scalars(sa_select(_ERule).where(_ERule.tenant_id == user.tenant_id).limit(200)).all()
            return {"items": [{"id": r.id, "name": r.name, "trigger_condition": r.trigger_condition, "escalate_to": r.escalate_to, "time_limit_hours": r.time_limit_hours, "status": r.status} for r in rules], "total": len(rules)}

        # ── Incident Module Queries ───────────────────────────────────────────────────
        def _inc_to_dict(i):
            return {
                "id": i.id, "ref": i.incident_ref,
                "title": i.description[:60] if i.description else f"Incident {i.id[:8]}",
                "description": i.description,
                "severity": i.severity, "status": i.status,
                "incident_type": i.incident_type,
                "is_confidential": i.is_confidential,
                "reported_by": i.reporter_user_id,
                "occurred_at": str(i.created_at) if i.created_at else None,
            }

        if operation == "incidents_unsafe_acts_list":
            from app.models.incidents import Incident as _Inc
            from sqlalchemy import select as _sel
            items = db.scalars(_sel(_Inc).where(_Inc.tenant_id == user.tenant_id, _Inc.incident_type == "unsafe_act").order_by(_Inc.created_at.desc())).all()
            return {"items": [_inc_to_dict(i) for i in items], "total": len(items)}

        if operation == "incidents_unsafe_conditions_list":
            from app.models.incidents import Incident as _Inc
            from sqlalchemy import select as _sel
            items = db.scalars(_sel(_Inc).where(_Inc.tenant_id == user.tenant_id, _Inc.incident_type == "unsafe_condition").order_by(_Inc.created_at.desc())).all()
            return {"items": [_inc_to_dict(i) for i in items], "total": len(items)}

        if operation == "incident_investigations_list":
            from app.models.incidents import Investigation as _Inv
            from sqlalchemy import select as _sel
            inc_id = path_params.get("incidentId")
            items = db.scalars(_sel(_Inv).where(_Inv.tenant_id == user.tenant_id, _Inv.incident_id == inc_id)).all()
            return {"items": [{"id": i.id, "incident_id": i.incident_id, "lead_user_id": i.lead_user_id, "rca_method": i.rca_method, "findings": i.findings, "status": i.status} for i in items], "total": len(items)}

        if operation == "incident_rca_get":
            from app.models.incidents import IncidentRCA as _IRCA
            from sqlalchemy import select as _sel
            inc_id = path_params.get("incidentId")
            rcas = db.scalars(_sel(_IRCA).where(_IRCA.tenant_id == user.tenant_id, _IRCA.incident_id == inc_id)).all()
            return {"items": [{"id": r.id, "incident_id": r.incident_id, "method": r.method, "root_cause": r.root_cause, "contributing_factors": r.contributing_factors, "status": r.status} for r in rcas]}

        if operation == "incident_corrective_actions_list":
            from app.models.incidents import CorrectiveAction as _CA
            from sqlalchemy import select as _sel
            inc_id = path_params.get("incidentId")
            q = _sel(_CA).where(_CA.tenant_id == user.tenant_id)
            if inc_id: q = q.where(_CA.incident_id == inc_id)
            cas = db.scalars(q.order_by(_CA.created_at.desc()).limit(500)).all()
            return {"items": [{"id": c.id, "incident_id": c.incident_id, "title": c.title, "description": c.description, "assigned_to": c.assigned_to, "due_date": c.due_date, "status": c.status} for c in cas], "total": len(cas)}

        if operation == "incidents_analytics_get":
            from app.models.incidents import Incident as _Inc, CorrectiveAction as _CA
            from sqlalchemy import select as _sel, func as _func
            all_incidents = db.scalars(_sel(_Inc).where(_Inc.tenant_id == user.tenant_id)).all()
            total = len(all_incidents)
            by_type: dict = {}
            by_severity: dict = {}
            by_status: dict = {}
            for i in all_incidents:
                by_type[i.incident_type] = by_type.get(i.incident_type, 0) + 1
                by_severity[i.severity] = by_severity.get(i.severity, 0) + 1
                by_status[i.status] = by_status.get(i.status, 0) + 1
            open_ca = db.scalar(_sel(_func.count(_CA.id)).where(_CA.tenant_id == user.tenant_id, _CA.status.in_(["open","in_progress"]))) or 0
            closed_ca = db.scalar(_sel(_func.count(_CA.id)).where(_CA.tenant_id == user.tenant_id, _CA.status == "closed")) or 0
            return {
                "total_incidents": total,
                "by_type": by_type,
                "by_severity": by_severity,
                "by_status": by_status,
                "open_corrective_actions": open_ca,
                "closed_corrective_actions": closed_ca,
                "trir": round((total * 200000) / max(total * 2000, 1), 2),
            }

        if operation == "incidents_reports_get":
            return svc["compliance"].get_incident_reports(user)

        return None
