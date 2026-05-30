import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.core.security import CurrentUser
from app.models.compliance import (
    AuditChecklist, AuditExecution, Capa, ComplianceDocument,
    ComplianceStandard, Finding, RegulatoryRequirement,
)
from app.models.foundation import OrganisationNode
from app.models.incidents import Incident, Investigation
from app.models.risks import RiskAssessment, HazardObservation
from app.repositories.domain_repository import DomainRepository


class ComplianceService:
    def __init__(self, db: Session):
        self.repo = DomainRepository(db)
        self.db = db

    # ── Dashboard ─────────────────────────────────────────────────────────────

    def get_compliance_dashboard(self, user: CurrentUser) -> dict:
        tid = user.tenant_id

        total_audits = self.db.scalar(
            select(func.count()).where(AuditExecution.tenant_id == tid)
        ) or 0
        completed_audits = self.db.scalar(
            select(func.count()).where(AuditExecution.tenant_id == tid, AuditExecution.status == "completed")
        ) or 0
        scheduled_audits = self.db.scalar(
            select(func.count()).where(AuditExecution.tenant_id == tid, AuditExecution.status == "scheduled")
        ) or 0
        in_progress_audits = self.db.scalar(
            select(func.count()).where(AuditExecution.tenant_id == tid, AuditExecution.status == "in_progress")
        ) or 0

        open_capas = self.db.scalar(
            select(func.count()).where(Capa.tenant_id == tid, Capa.status == "open")
        ) or 0
        closed_capas = self.db.scalar(
            select(func.count()).where(Capa.tenant_id == tid, Capa.status == "closed")
        ) or 0
        overdue_capas = self.db.scalar(
            select(func.count()).where(
                Capa.tenant_id == tid,
                Capa.status == "open",
                Capa.due_date < date.today(),
            )
        ) or 0

        open_findings = self.db.scalar(
            select(func.count()).where(Finding.tenant_id == tid, Finding.status == "open")
        ) or 0

        findings_by_severity: dict[str, int] = {}
        for sev in ["critical", "major", "minor", "observation"]:
            findings_by_severity[sev] = self.db.scalar(
                select(func.count()).where(Finding.tenant_id == tid, Finding.severity == sev)
            ) or 0

        capas_by_severity: dict[str, int] = {}
        for sev in ["critical", "high", "medium", "low"]:
            capas_by_severity[sev] = self.db.scalar(
                select(func.count()).where(Capa.tenant_id == tid, Capa.severity == sev)
            ) or 0

        compliance_score = round((completed_audits / total_audits * 100) if total_audits else 0)

        total_standards = self.db.scalar(
            select(func.count()).where(ComplianceStandard.tenant_id == tid)
        ) or 0
        active_standards = self.db.scalar(
            select(func.count()).where(ComplianceStandard.tenant_id == tid, ComplianceStandard.status == "Active")
        ) or 0

        recent_audits = self.db.scalars(
            select(AuditExecution).where(AuditExecution.tenant_id == tid)
            .order_by(AuditExecution.created_at.desc()).limit(5)
        ).all()

        return {
            "compliance_score": compliance_score,
            "audits": {
                "total": total_audits,
                "completed": completed_audits,
                "scheduled": scheduled_audits,
                "in_progress": in_progress_audits,
            },
            "capas": {
                "open": open_capas,
                "closed": closed_capas,
                "overdue": overdue_capas,
                "by_severity": capas_by_severity,
            },
            "findings": {
                "open": open_findings,
                "by_severity": findings_by_severity,
            },
            "standards": {
                "total": total_standards,
                "active": active_standards,
            },
            "recent_audits": [
                {
                    "id": a.id,
                    "title": a.title or f"Audit {a.id[:8]}",
                    "status": a.status,
                    "audit_type": a.audit_type or "Internal",
                    "scheduled_date": str(a.scheduled_date) if a.scheduled_date else None,
                }
                for a in recent_audits
            ],
        }

    # ── Audit Checklists ──────────────────────────────────────────────────────

    def list_audit_checklists(self, user: CurrentUser, filters: dict = None) -> list[AuditChecklist]:
        return self.repo.list(AuditChecklist, user.tenant_id, filters or {})

    def create_audit_checklist(self, user: CurrentUser, data: dict) -> AuditChecklist:
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        data.setdefault("status", "draft")
        return self.repo.create(AuditChecklist, user.tenant_id, data)

    def publish_checklist(self, user: CurrentUser, checklist_id: str) -> AuditChecklist:
        return self.repo.update(AuditChecklist, user.tenant_id, checklist_id, {"status": "published"})

    # ── Audit Executions ──────────────────────────────────────────────────────

    def list_audits_enriched(self, user: CurrentUser) -> dict:
        audits = self.repo.list(AuditExecution, user.tenant_id, {})
        checklists = {c.id: c for c in self.list_audit_checklists(user)}
        items = []
        for a in audits:
            cl = checklists.get(a.checklist_id)
            ef = a.extra_fields or {}
            items.append({
                "id": a.id,
                "title": a.title or (cl.name if cl else f"Audit {a.id[:8]}"),
                "checklist_name": cl.name if cl else None,
                "standard": cl.standard if cl else None,
                "audit_type": a.audit_type or (cl.audit_type if cl else "Internal"),
                "site_id": a.site_id,
                "auditor_user_id": a.auditor_user_id,
                "status": a.status,
                "scheduled_date": str(a.scheduled_date) if a.scheduled_date else None,
                "completed_date": str(a.completed_date) if a.completed_date else None,
                "result": ef.get("result"),
                "issues_found": ef.get("issues_found"),
                "inspector": ef.get("inspector"),
            })
        items.sort(key=lambda x: x["scheduled_date"] or "", reverse=True)
        return {"items": items}

    def create_audit_execution(self, user: CurrentUser, data: dict) -> AuditExecution:
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        data["auditor_user_id"] = user.user_id
        data.setdefault("status", "scheduled")
        return self.repo.create(AuditExecution, user.tenant_id, data)

    def update_audit_execution(self, user: CurrentUser, audit_id: str, data: dict) -> AuditExecution:
        return self.repo.update(AuditExecution, user.tenant_id, audit_id, data)

    def get_audit(self, user: CurrentUser, audit_id: str) -> AuditExecution:
        audit = self.repo.get(AuditExecution, user.tenant_id, audit_id)
        if not audit:
            raise AppError("AUDIT_NOT_FOUND", "Audit not found", 404)
        return audit

    # ── Findings ──────────────────────────────────────────────────────────────

    def list_findings_enriched(self, user: CurrentUser) -> dict:
        findings = self.repo.list(Finding, user.tenant_id, {})
        items = [
            {
                "id": f.id,
                "audit_id": f.audit_id,
                "title": f.title or f.description[:80],
                "description": f.description,
                "source_type": f.source_type,
                "severity": f.severity,
                "iso_clause": f.iso_clause,
                "status": f.status,
            }
            for f in findings
        ]
        items.sort(key=lambda x: x["severity"])
        return {"items": items}

    def create_finding(self, user: CurrentUser, audit_id: str, data: dict) -> Finding:
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        data["audit_id"] = audit_id
        data.setdefault("status", "open")
        return self.repo.create(Finding, user.tenant_id, data)

    # ── CAPA ──────────────────────────────────────────────────────────────────

    def list_capas(self, user: CurrentUser, filters: dict = None) -> list[Capa]:
        return self.repo.list(Capa, user.tenant_id, filters or {})

    def list_capas_enriched(self, user: CurrentUser) -> dict:
        capas = self.list_capas(user)
        today = date.today()
        items = []
        for c in capas:
            overdue = c.due_date and c.due_date < today and c.status == "open"
            days_left = (c.due_date - today).days if c.due_date else None
            items.append({
                "id": c.id,
                "title": c.title or f"CAPA-{c.id[:8]}",
                "description": c.description,
                "source_type": c.source_type,
                "source_id": c.source_id,
                "owner_user_id": c.owner_user_id,
                "due_date": str(c.due_date) if c.due_date else None,
                "days_left": days_left,
                "severity": c.severity,
                "status": c.status,
                "overdue": overdue,
                "root_cause": c.root_cause,
                "corrective_action": c.corrective_action,
            })
        items.sort(key=lambda x: (x["status"] != "open", x["due_date"] or "9999"))
        return {"items": items}

    def get_capa(self, user: CurrentUser, capa_id: str) -> Capa:
        capa = self.repo.get(Capa, user.tenant_id, capa_id)
        if not capa:
            raise AppError("CAPA_NOT_FOUND", "CAPA not found", 404)
        return capa

    def create_capa(self, user: CurrentUser, data: dict) -> Capa:
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        data.setdefault("owner_user_id", user.user_id)
        data.setdefault("status", "open")
        data.setdefault("severity", "medium")
        return self.repo.create(Capa, user.tenant_id, data)

    def update_capa(self, user: CurrentUser, capa_id: str, data: dict) -> Capa:
        return self.repo.update(Capa, user.tenant_id, capa_id, data)

    def submit_capa_closure(self, user: CurrentUser, capa_id: str, data: dict) -> Capa:
        return self.repo.update(Capa, user.tenant_id, capa_id, {
            "status": "pending_approval",
            "evidence_file_id": data.get("evidence_file_id") or data.get("evidenceFileId"),
        })

    def approve_capa_closure(self, user: CurrentUser, capa_id: str, data: dict) -> Capa:
        return self.repo.update(Capa, user.tenant_id, capa_id, {"status": "closed"})

    # ── Standards & Policies ──────────────────────────────────────────────────

    def list_standards(self, user: CurrentUser) -> dict:
        items = self.repo.list(ComplianceStandard, user.tenant_id, {})
        return {
            "items": [
                {
                    "id": s.id, "name": s.name, "code": s.code, "category": s.category,
                    "description": s.description, "status": s.status, "version": s.version,
                    "effective_date": str(s.effective_date) if s.effective_date else None,
                    "review_date": str(s.review_date) if s.review_date else None,
                    "owner": s.owner, "jurisdiction": s.jurisdiction,
                }
                for s in items
            ]
        }

    def create_standard(self, user: CurrentUser, data: dict) -> ComplianceStandard:
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        data.setdefault("status", "Active")
        data.setdefault("category", "General")
        return self.repo.create(ComplianceStandard, user.tenant_id, data)

    def update_standard(self, user: CurrentUser, std_id: str, data: dict) -> ComplianceStandard:
        return self.repo.update(ComplianceStandard, user.tenant_id, std_id, data)

    # ── Regulatory Tracking ───────────────────────────────────────────────────

    def list_regulatory_requirements(self, user: CurrentUser) -> dict:
        items = self.repo.list(RegulatoryRequirement, user.tenant_id, {})
        today = date.today()
        return {
            "items": [
                {
                    "id": r.id, "regulation_name": r.regulation_name,
                    "jurisdiction": r.jurisdiction, "category": r.category,
                    "description": r.description, "status": r.status,
                    "due_date": str(r.due_date) if r.due_date else None,
                    "days_until_due": (r.due_date - today).days if r.due_date else None,
                    "owner": r.owner, "notes": r.notes,
                    "last_reviewed_date": str(r.last_reviewed_date) if r.last_reviewed_date else None,
                }
                for r in items
            ]
        }

    def create_regulatory_requirement(self, user: CurrentUser, data: dict) -> RegulatoryRequirement:
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        data.setdefault("status", "Pending")
        return self.repo.create(RegulatoryRequirement, user.tenant_id, data)

    def update_regulatory_requirement(self, user: CurrentUser, req_id: str, data: dict) -> RegulatoryRequirement:
        return self.repo.update(RegulatoryRequirement, user.tenant_id, req_id, data)

    # ── Documentation ─────────────────────────────────────────────────────────

    def list_compliance_documents(self, user: CurrentUser) -> dict:
        items = self.repo.list(ComplianceDocument, user.tenant_id, {})
        return {
            "items": [
                {
                    "id": d.id, "title": d.title, "document_type": d.document_type,
                    "category": d.category, "version": d.version, "status": d.status,
                    "description": d.description,
                    "effective_date": str(d.effective_date) if d.effective_date else None,
                    "created_by": d.created_by,
                }
                for d in items
            ]
        }

    def create_compliance_document(self, user: CurrentUser, data: dict) -> ComplianceDocument:
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        data.setdefault("status", "Draft")
        data.setdefault("document_type", "Policy")
        if not data.get("created_by"):
            data["created_by"] = user.display_name or user.user_id
        return self.repo.create(ComplianceDocument, user.tenant_id, data)

    def update_compliance_document(self, user: CurrentUser, doc_id: str, data: dict) -> ComplianceDocument:
        return self.repo.update(ComplianceDocument, user.tenant_id, doc_id, data)

    # ── Inspections (reuses AuditExecution with type filter) ─────────────────

    def list_inspections_enriched(self, user: CurrentUser) -> dict:
        audits = self.repo.list(AuditExecution, user.tenant_id, {})
        inspections = [a for a in audits if (a.audit_type or "").lower() in ("inspection", "safety inspection", "site inspection")]
        checklists = {c.id: c for c in self.list_audit_checklists(user)}
        items = [
            {
                "id": a.id,
                "title": a.title or f"Inspection {a.id[:8]}",
                "checklist_name": checklists[a.checklist_id].name if a.checklist_id in checklists else None,
                "audit_type": a.audit_type,
                "site_id": a.site_id,
                "auditor_user_id": a.auditor_user_id,
                "status": a.status,
                "scheduled_date": str(a.scheduled_date) if a.scheduled_date else None,
                "completed_date": str(a.completed_date) if a.completed_date else None,
            }
            for a in inspections
        ]
        return {"items": items}

    def create_inspection(self, user: CurrentUser, data: dict) -> AuditExecution:
        data["audit_type"] = data.get("audit_type") or "Safety Inspection"
        return self.create_audit_execution(user, data)

    # ── Risks & Hazards ───────────────────────────────────────────────────────

    def list_risk_assessments(self, user: CurrentUser, filters: dict = None) -> list[RiskAssessment]:
        return self.repo.list(RiskAssessment, user.tenant_id, filters or {})

    def create_risk_assessment(self, user: CurrentUser, data: dict) -> RiskAssessment:
        likelihood = data.get("likelihood", 0)
        consequence = data.get("consequence", 0)
        data["risk_score"] = likelihood * consequence
        return self.repo.create(RiskAssessment, user.tenant_id, data)

    def list_hazards(self, user: CurrentUser, filters: dict = None) -> list[HazardObservation]:
        return self.repo.list(HazardObservation, user.tenant_id, filters or {})

    # ── Incidents ─────────────────────────────────────────────────────────────

    def list_incidents(self, user: CurrentUser, filters: dict = None) -> list[Incident]:
        return self.repo.list(Incident, user.tenant_id, filters or {})

    def classify_incident(self, user: CurrentUser, incident_id: str, data: dict) -> Incident:
        return self.repo.update(Incident, user.tenant_id, incident_id, {
            "severity": data.get("severity"),
            "status": "classified",
        })

    def start_investigation(self, user: CurrentUser, incident_id: str, data: dict) -> Investigation:
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        data["incident_id"] = incident_id
        data["lead_user_id"] = user.user_id
        return self.repo.create(Investigation, user.tenant_id, data)

    def get_incident_reports(self, user: CurrentUser) -> dict:
        tid = user.tenant_id
        
        # 1. Fetch all related data
        all_incidents = self.db.scalars(
            select(Incident).where(Incident.tenant_id == tid).order_by(Incident.created_at.desc())
        ).all()
        
        investigations = self.db.scalars(
            select(Investigation).where(Investigation.tenant_id == tid)
        ).all()
        
        nodes = self.db.scalars(
            select(OrganisationNode).where(OrganisationNode.tenant_id == tid)
        ).all()
        node_map = {n.id: n for n in nodes}
        
        from app.repositories.generic_repository import GenericRepository
        g_repo = GenericRepository(self.db)
        rcas = g_repo.list_by_type(tid, "incidents", "rca", limit=1000)
        cas = g_repo.list_by_type(tid, "incidents", "corrective_action", limit=1000)
        
        # 2. Aggregations
        total_incidents = len(all_incidents)
        severity_dist = {}
        status_dist = {}
        site_dist = {}
        dept_dist = {}
        investigation_dist = {}
        
        for i in all_incidents:
            severity_dist[i.severity] = severity_dist.get(i.severity, 0) + 1
            status_dist[i.status] = status_dist.get(i.status, 0) + 1
            
            if i.location_id and i.location_id in node_map:
                node = node_map[i.location_id]
                if node.node_type == "site":
                    site_dist[node.name] = site_dist.get(node.name, 0) + 1
                elif node.node_type == "department":
                    dept_dist[node.name] = dept_dist.get(node.name, 0) + 1
        
        for inv in investigations:
            investigation_dist[inv.status] = investigation_dist.get(inv.status, 0) + 1
            
        # 3. Mapping RCA and Corrective Actions for detailed list
        rca_map = {r.payload.get("incident_id"): r.payload.get("root_cause") for r in rcas}
        ca_map = {}
        for c in cas:
            inc_id = c.payload.get("incident_id")
            if inc_id:
                if inc_id not in ca_map:
                    ca_map[inc_id] = []
                ca_map[inc_id].append(c.payload.get("title") or c.payload.get("description"))
                
        # 4. Detailed list
        detailed_items = []
        for i in all_incidents:
            loc_name = node_map[i.location_id].name if i.location_id and i.location_id in node_map else "Unknown"
            detailed_items.append({
                "id": i.id,
                "ref": i.incident_ref,
                "occurred_at": str(i.created_at) if i.created_at else None,
                "location": loc_name,
                "severity": i.severity,
                "status": i.status,
                "description": i.description,
                "injured_persons": i.injured_persons or "None",
                "root_cause": rca_map.get(i.id, "Pending"),
                "corrective_actions": ", ".join(ca_map.get(i.id, ["Pending"])),
            })
            
        return {
            "total_incidents": total_incidents,
            "severity_distribution": severity_dist,
            "status_distribution": status_dist,
            "site_distribution": site_dist,
            "dept_distribution": dept_dist,
            "investigation_distribution": investigation_dist,
            "items": detailed_items
        }
