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
