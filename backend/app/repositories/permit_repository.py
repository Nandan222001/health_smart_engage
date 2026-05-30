from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository
from app.models.permits import Permit, PermitApproval


class PermitRepository(BaseRepository[Permit]):
    def __init__(self, db: Session):
        super().__init__(db, Permit)

    def list_by_tenant(self, tenant_id: str, filters: dict = None) -> list[Permit]:
        stmt = select(Permit).where(Permit.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(Permit, k) and v is not None:
                    stmt = stmt.where(getattr(Permit, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_by_tenant(self, tenant_id: str, permit_id: str) -> Permit | None:
        return self.db.scalars(
            select(Permit).where(Permit.tenant_id == tenant_id, Permit.id == permit_id)
        ).first()

    def list_active_conflicts(
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

    def list_approvals(self, tenant_id: str, permit_id: str) -> list[PermitApproval]:
        return list(self.db.scalars(
            select(PermitApproval).where(
                PermitApproval.tenant_id == tenant_id,
                PermitApproval.permit_id == permit_id,
            )
        ).all())

    def get_approval(self, tenant_id: str, approval_id: str) -> PermitApproval | None:
        return self.db.scalars(
            select(PermitApproval).where(
                PermitApproval.tenant_id == tenant_id, PermitApproval.id == approval_id
            )
        ).first()
