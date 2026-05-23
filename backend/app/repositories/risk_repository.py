from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository
from app.models.risks import RiskAssessment, HazardObservation


class RiskRepository(BaseRepository[RiskAssessment]):
    def __init__(self, db: Session):
        super().__init__(db, RiskAssessment)

    def list_by_tenant(self, tenant_id: str, filters: dict = None) -> list[RiskAssessment]:
        stmt = select(RiskAssessment).where(RiskAssessment.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(RiskAssessment, k) and v is not None:
                    stmt = stmt.where(getattr(RiskAssessment, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_by_tenant(self, tenant_id: str, assessment_id: str) -> RiskAssessment | None:
        return self.db.scalars(
            select(RiskAssessment).where(
                RiskAssessment.tenant_id == tenant_id, RiskAssessment.id == assessment_id
            )
        ).first()

    def list_hazards(self, tenant_id: str, filters: dict = None) -> list[HazardObservation]:
        stmt = select(HazardObservation).where(HazardObservation.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(HazardObservation, k) and v is not None:
                    stmt = stmt.where(getattr(HazardObservation, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_hazard(self, tenant_id: str, hazard_id: str) -> HazardObservation | None:
        return self.db.scalars(
            select(HazardObservation).where(
                HazardObservation.tenant_id == tenant_id, HazardObservation.id == hazard_id
            )
        ).first()
