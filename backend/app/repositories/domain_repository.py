from typing import Any, Type, TypeVar, List
from sqlalchemy import select, update, delete
from sqlalchemy.orm import Session
from app.models.domain import (
    Asset, Certification, Permit, Vendor, Employee, OrganisationNode, 
    User, Role, TrainingRequirement, TrainingCompletion, VendorDocument,
    AssetInspection, RiskAssessment, HazardObservation, AuditChecklist,
    AuditExecution, Finding, Capa, Incident, Investigation, KnowledgeDocument,
    FileObject, AiConversation, PredictiveRiskScore, MobileSyncItem
)

T = TypeVar("T")

class DomainRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, model: Type[T], tenant_id: str, id: str) -> T | None:
        stmt = select(model).where(model.tenant_id == tenant_id, model.id == id)
        return self.db.scalars(stmt).first()

    def list(self, model: Type[T], tenant_id: str, filters: dict = None) -> list[T]:
        stmt = select(model).where(model.tenant_id == tenant_id)
        if filters:
            for key, value in filters.items():
                if hasattr(model, key) and value is not None:
                    stmt = stmt.where(getattr(model, key) == value)
        return list(self.db.scalars(stmt).all())

    def create(self, model: Type[T], tenant_id: str, data: dict) -> T:
        instance = model(tenant_id=tenant_id, **data)
        self.db.add(instance)
        return instance

    def update(self, model: Type[T], tenant_id: str, id: str, data: dict) -> T | None:
        instance = self.get(model, tenant_id, id)
        if instance:
            for key, value in data.items():
                if hasattr(instance, key):
                    setattr(instance, key, value)
        return instance

    def delete(self, model: Type[T], tenant_id: str, id: str) -> bool:
        instance = self.get(model, tenant_id, id)
        if instance:
            self.db.delete(instance)
            return True
        return False

    def get_asset(self, tenant_id: str, asset_id: str | None) -> Asset | None:
        return self.get(Asset, tenant_id, asset_id) if asset_id else None

    def get_vendor(self, tenant_id: str, vendor_id: str | None) -> Vendor | None:
        return self.get(Vendor, tenant_id, vendor_id) if vendor_id else None

    def list_active_permit_conflicts(
        self,
        tenant_id: str,
        zone_id: str | None,
        asset_id: str | None,
        exclude_permit_id: str | None = None,
    ) -> List[Permit]:
        stmt = select(Permit).where(
            Permit.tenant_id == tenant_id,
            Permit.status.in_(("approved", "active", "extended")),
        )
        if zone_id:
            stmt = stmt.where(Permit.zone_id == zone_id)
        if asset_id:
            stmt = stmt.where(Permit.asset_id == asset_id)
        if exclude_permit_id:
            stmt = stmt.where(Permit.id != exclude_permit_id)
        return list(self.db.scalars(stmt).all())

    def has_valid_certification(
        self,
        tenant_id: str,
        employee_id: str | None,
        certification_type: str | None,
    ) -> bool:
        if not employee_id or not certification_type:
            return True
        stmt = select(Certification).where(
            Certification.tenant_id == tenant_id,
            Certification.employee_id == employee_id,
            Certification.certification_type == certification_type,
            Certification.status == "active",
        )
        return self.db.scalars(stmt).first() is not None

    def payload_value(self, payload: dict[str, Any], key: str) -> Any:
        data = payload.get("data", payload)
        return data.get(key)
