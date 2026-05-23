from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository
from app.models.incidents import Incident, Investigation


class IncidentRepository(BaseRepository[Incident]):
    def __init__(self, db: Session):
        super().__init__(db, Incident)

    def list_by_tenant(self, tenant_id: str, filters: dict = None) -> list[Incident]:
        stmt = select(Incident).where(Incident.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(Incident, k) and v is not None:
                    stmt = stmt.where(getattr(Incident, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_by_tenant(self, tenant_id: str, incident_id: str) -> Incident | None:
        return self.db.scalars(
            select(Incident).where(Incident.tenant_id == tenant_id, Incident.id == incident_id)
        ).first()

    def list_investigations(self, tenant_id: str, incident_id: str = None) -> list[Investigation]:
        stmt = select(Investigation).where(Investigation.tenant_id == tenant_id)
        if incident_id:
            stmt = stmt.where(Investigation.incident_id == incident_id)
        return list(self.db.scalars(stmt).all())

    def get_investigation(self, tenant_id: str, investigation_id: str) -> Investigation | None:
        return self.db.scalars(
            select(Investigation).where(
                Investigation.tenant_id == tenant_id, Investigation.id == investigation_id
            )
        ).first()
