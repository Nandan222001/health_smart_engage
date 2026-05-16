from typing import Any
from sqlalchemy.orm import Session
from app.core.security import CurrentUser
from app.models.domain import AuditChecklist, AuditExecution, Finding, Capa, RiskAssessment, HazardObservation, Incident, Investigation
from app.repositories.domain_repository import DomainRepository
from app.core.exceptions import AppError
import uuid

class ComplianceService:
    def __init__(self, db: Session):
        self.repo = DomainRepository(db)
        self.db = db

    # Audits
    def list_audit_checklists(self, user: CurrentUser, filters: dict) -> list[AuditChecklist]:
        return self.repo.list(AuditChecklist, user.tenant_id, filters)

    def create_audit_execution(self, user: CurrentUser, data: dict) -> AuditExecution:
        data["auditor_user_id"] = user.user_id
        return self.repo.create(AuditExecution, user.tenant_id, data)

    def create_finding(self, user: CurrentUser, audit_id: str, data: dict) -> Finding:
        data["audit_id"] = audit_id
        return self.repo.create(Finding, user.tenant_id, data)

    # CAPA
    def list_capas(self, user: CurrentUser, filters: dict) -> list[Capa]:
        return self.repo.list(Capa, user.tenant_id, filters)

    def get_capa(self, user: CurrentUser, capa_id: str) -> Capa:
        capa = self.repo.get(Capa, user.tenant_id, capa_id)
        if not capa:
            raise AppError("CAPA_NOT_FOUND", "CAPA not found", 404)
        return capa

    def submit_capa_closure(self, user: CurrentUser, capa_id: str, data: dict) -> Capa:
        return self.repo.update(Capa, user.tenant_id, capa_id, {
            "status": "pending_approval",
            "evidence_file_id": data.get("evidence_file_id") or data.get("evidenceFileId")
        })

    def approve_capa_closure(self, user: CurrentUser, capa_id: str, data: dict) -> Capa:
        return self.repo.update(Capa, user.tenant_id, capa_id, {"status": "closed"})

    # Risks & Hazards
    def list_risk_assessments(self, user: CurrentUser, filters: dict) -> list[RiskAssessment]:
        return self.repo.list(RiskAssessment, user.tenant_id, filters)

    def create_risk_assessment(self, user: CurrentUser, data: dict) -> RiskAssessment:
        # Simplified risk calculation
        likelihood = data.get("likelihood", 0)
        consequence = data.get("consequence", 0)
        data["risk_score"] = likelihood * consequence
        return self.repo.create(RiskAssessment, user.tenant_id, data)

    def list_hazards(self, user: CurrentUser, filters: dict) -> list[HazardObservation]:
        return self.repo.list(HazardObservation, user.tenant_id, filters)

    # Incidents
    def list_incidents(self, user: CurrentUser, filters: dict) -> list[Incident]:
        return self.repo.list(Incident, user.tenant_id, filters)

    def classify_incident(self, user: CurrentUser, incident_id: str, data: dict) -> Incident:
        return self.repo.update(Incident, user.tenant_id, incident_id, {
            "severity": data.get("severity"),
            "status": "classified"
        })

    def start_investigation(self, user: CurrentUser, incident_id: str, data: dict) -> Investigation:
        data["incident_id"] = incident_id
        data["lead_user_id"] = user.user_id
        return self.repo.create(Investigation, user.tenant_id, data)
