from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.domain import Asset, Certification, Permit, Vendor


class DomainRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_asset(self, tenant_id: str, asset_id: str | None) -> Asset | None:
        if not asset_id:
            return None
        stmt = select(Asset).where(Asset.tenant_id == tenant_id, Asset.id == asset_id)
        return self.db.scalars(stmt).first()

    def get_vendor(self, tenant_id: str, vendor_id: str | None) -> Vendor | None:
        if not vendor_id:
            return None
        stmt = select(Vendor).where(Vendor.tenant_id == tenant_id, Vendor.id == vendor_id)
        return self.db.scalars(stmt).first()

    def list_active_permit_conflicts(
        self,
        tenant_id: str,
        zone_id: str | None,
        asset_id: str | None,
        exclude_permit_id: str | None = None,
    ) -> list[Permit]:
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
