from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository
from app.models.tenant import Tenant


class SuperAdminRepository(BaseRepository[Tenant]):
    def __init__(self, db: Session):
        super().__init__(db, Tenant)

    def list_tenants(self, filters: dict = None) -> list[Tenant]:
        stmt = select(Tenant)
        if filters:
            for k, v in filters.items():
                if hasattr(Tenant, k) and v is not None:
                    stmt = stmt.where(getattr(Tenant, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_tenant(self, tenant_id: str) -> Tenant | None:
        return self.db.get(Tenant, tenant_id)

    def find_by_org_code(self, org_code: str) -> Tenant | None:
        return self.db.scalars(
            select(Tenant).where(Tenant.org_code == org_code)
        ).first()

    def count_tenants(self) -> int:
        return len(list(self.db.scalars(select(Tenant)).all()))
