from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository
from app.models.learning import MLModel, MLModelVersion, DetectedPattern, OperationalEvent


class LearningRepository(BaseRepository[MLModel]):
    def __init__(self, db: Session):
        super().__init__(db, MLModel)

    def list_models(self, tenant_id: str, filters: dict = None) -> list[MLModel]:
        stmt = select(MLModel).where(MLModel.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(MLModel, k) and v is not None:
                    stmt = stmt.where(getattr(MLModel, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_model(self, tenant_id: str, model_id: str) -> MLModel | None:
        return self.db.scalars(
            select(MLModel).where(MLModel.tenant_id == tenant_id, MLModel.id == model_id)
        ).first()

    def list_model_versions(self, tenant_id: str, model_id: str) -> list[MLModelVersion]:
        return list(self.db.scalars(
            select(MLModelVersion).where(
                MLModelVersion.tenant_id == tenant_id,
                MLModelVersion.model_id == model_id,
            )
        ).all())

    def list_patterns(self, tenant_id: str, filters: dict = None) -> list[DetectedPattern]:
        stmt = select(DetectedPattern).where(DetectedPattern.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(DetectedPattern, k) and v is not None:
                    stmt = stmt.where(getattr(DetectedPattern, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_pattern(self, tenant_id: str, pattern_id: str) -> DetectedPattern | None:
        return self.db.scalars(
            select(DetectedPattern).where(
                DetectedPattern.tenant_id == tenant_id, DetectedPattern.id == pattern_id
            )
        ).first()

    def list_events(self, tenant_id: str, filters: dict = None) -> list[OperationalEvent]:
        stmt = select(OperationalEvent).where(OperationalEvent.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(OperationalEvent, k) and v is not None:
                    stmt = stmt.where(getattr(OperationalEvent, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_event(self, tenant_id: str, event_id: str) -> OperationalEvent | None:
        return self.db.scalars(
            select(OperationalEvent).where(
                OperationalEvent.tenant_id == tenant_id, OperationalEvent.id == event_id
            )
        ).first()
