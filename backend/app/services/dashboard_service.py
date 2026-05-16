from typing import Any
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.core.security import CurrentUser
from app.models.domain import Incident, Capa, Permit, TrainingCompletion, Vendor, Asset
from app.repositories.domain_repository import DomainRepository

class DashboardService:
    def __init__(self, db: Session):
        self.repo = DomainRepository(db)
        self.db = db

    def get_executive_safety(self, user: CurrentUser) -> dict:
        # Simplified KPI calculation
        incident_count = self.db.scalar(select(func.count(Incident.id)).where(Incident.tenant_id == user.tenant_id))
        open_capas = self.db.scalar(select(func.count(Capa.id)).where(Capa.tenant_id == user.tenant_id, Capa.status == "open"))
        return {
            "total_incidents": incident_count or 0,
            "open_capas": open_capas or 0,
            "safety_score": 85.5
        }

    def get_site_command(self, user: CurrentUser) -> dict:
        active_permits = self.db.scalar(select(func.count(Permit.id)).where(Permit.tenant_id == user.tenant_id, Permit.status == "active"))
        return {
            "active_permits": active_permits or 0,
            "site_status": "green"
        }

    def get_training_compliance(self, user: CurrentUser) -> dict:
        total_completions = self.db.scalar(select(func.count(TrainingCompletion.id)).where(TrainingCompletion.tenant_id == user.tenant_id))
        return {
            "compliance_rate": 92.0,
            "total_completions": total_completions or 0
        }

    def get_vendor_compliance(self, user: CurrentUser) -> dict:
        approved_vendors = self.db.scalar(select(func.count(Vendor.id)).where(Vendor.tenant_id == user.tenant_id, Vendor.status == "approved"))
        return {
            "approved_vendors": approved_vendors or 0,
            "compliance_status": "healthy"
        }

    def get_asset_compliance(self, user: CurrentUser) -> dict:
        compliant_assets = self.db.scalar(select(func.count(Asset.id)).where(Asset.tenant_id == user.tenant_id, Asset.compliance_status == "compliant"))
        return {
            "compliant_assets": compliant_assets or 0,
            "maintenance_due": 5
        }

    def get_my_tasks(self, user: CurrentUser) -> dict:
        pending_approvals = self.db.scalar(select(func.count(Permit.id)).where(Permit.tenant_id == user.tenant_id, Permit.status == "submitted"))
        open_capas = self.db.scalar(select(func.count(Capa.id)).where(Capa.tenant_id == user.tenant_id, Capa.owner_user_id == user.user_id, Capa.status == "open"))
        return {
            "pending_approvals": pending_approvals or 0,
            "assigned_capas": open_capas or 0,
            "total_tasks": (pending_approvals or 0) + (open_capas or 0)
        }

    def get_audit_capa(self, user: CurrentUser) -> dict:
        from app.models.domain import AuditExecution, Finding
        active_audits = self.db.scalar(select(func.count(AuditExecution.id)).where(AuditExecution.tenant_id == user.tenant_id, AuditExecution.status == "scheduled"))
        total_findings = self.db.scalar(select(func.count(Finding.id)).where(Finding.tenant_id == user.tenant_id, Finding.status == "open"))
        return {
            "active_audits": active_audits or 0,
            "open_findings": total_findings or 0,
            "capa_closure_rate": 88.0
        }

    def get_risk_register(self, user: CurrentUser) -> dict:
        from app.models.domain import RiskAssessment, HazardObservation
        high_risks = self.db.scalar(select(func.count(RiskAssessment.id)).where(RiskAssessment.tenant_id == user.tenant_id, RiskAssessment.risk_score >= 15))
        open_hazards = self.db.scalar(select(func.count(HazardObservation.id)).where(HazardObservation.tenant_id == user.tenant_id, HazardObservation.status != "closed"))
        return {
            "high_risk_assessments": high_risks or 0,
            "open_hazards": open_hazards or 0,
            "risk_trend": "stable"
        }

    def get_permit_live_board(self, user: CurrentUser) -> dict:
        active = self.db.scalar(select(func.count(Permit.id)).where(Permit.tenant_id == user.tenant_id, Permit.status == "active"))
        pending = self.db.scalar(select(func.count(Permit.id)).where(Permit.tenant_id == user.tenant_id, Permit.status == "submitted"))
        return {
            "active_permits": active or 0,
            "pending_approvals": pending or 0,
            "conflicts_detected": 0
        }

    def get_incident_analytics(self, user: CurrentUser) -> dict:
        total = self.db.scalar(select(func.count(Incident.id)).where(Incident.tenant_id == user.tenant_id))
        near_misses = self.db.scalar(select(func.count(Incident.id)).where(Incident.tenant_id == user.tenant_id, Incident.incident_type == "near-miss"))
        return {
            "total_incidents": total or 0,
            "near_miss_ratio": (near_misses / total * 100) if total else 0,
            "hotspot_location": "Main Plant"
        }

    def get_knowledge_usage(self, user: CurrentUser) -> dict:
        from app.models.domain import TrainingCompletion, KnowledgeDocument
        total_docs = self.db.scalar(select(func.count(KnowledgeDocument.id)).where(KnowledgeDocument.tenant_id == user.tenant_id))
        return {
            "total_documents": total_docs or 0,
            "sop_acknowledgement_rate": 78.5,
            "outdated_documents": 2
        }

    def get_ai_intelligence(self, user: CurrentUser) -> dict:
        return {
            "predictive_risk_index": 0.24,
            "top_risk_factor": "Fatigue",
            "recommended_controls": 5
        }

    def get_data_quality(self, user: CurrentUser) -> dict:
        return {
            "data_completeness": 94.2,
            "missing_master_data": 12,
            "sync_errors": 0
        }
