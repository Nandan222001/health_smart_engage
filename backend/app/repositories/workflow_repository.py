from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository
from app.models.workflow import (
    WorkflowCase, WorkflowStageEvent, WorkflowApproval,
    WorkflowCAPA, WorkflowResolution, WorkflowAlert,
)


class WorkflowRepository(BaseRepository[WorkflowCase]):
    def __init__(self, db: Session):
        super().__init__(db, WorkflowCase)

    def list_cases(self, tenant_id: str, filters: dict = None) -> list[WorkflowCase]:
        stmt = select(WorkflowCase).where(WorkflowCase.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(WorkflowCase, k) and v is not None:
                    stmt = stmt.where(getattr(WorkflowCase, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_case(self, tenant_id: str, case_id: str) -> WorkflowCase | None:
        return self.db.scalars(
            select(WorkflowCase).where(
                WorkflowCase.tenant_id == tenant_id, WorkflowCase.id == case_id
            )
        ).first()

    def list_stage_events(self, tenant_id: str, case_id: str) -> list[WorkflowStageEvent]:
        return list(self.db.scalars(
            select(WorkflowStageEvent).where(
                WorkflowStageEvent.tenant_id == tenant_id,
                WorkflowStageEvent.case_id == case_id,
            )
        ).all())

    def list_approvals(self, tenant_id: str, case_id: str) -> list[WorkflowApproval]:
        return list(self.db.scalars(
            select(WorkflowApproval).where(
                WorkflowApproval.tenant_id == tenant_id,
                WorkflowApproval.case_id == case_id,
            )
        ).all())

    def get_approval(self, tenant_id: str, approval_id: str) -> WorkflowApproval | None:
        return self.db.scalars(
            select(WorkflowApproval).where(
                WorkflowApproval.tenant_id == tenant_id, WorkflowApproval.id == approval_id
            )
        ).first()

    def list_capas(self, tenant_id: str, case_id: str = None) -> list[WorkflowCAPA]:
        stmt = select(WorkflowCAPA).where(WorkflowCAPA.tenant_id == tenant_id)
        if case_id:
            stmt = stmt.where(WorkflowCAPA.case_id == case_id)
        return list(self.db.scalars(stmt).all())

    def get_resolution(self, tenant_id: str, case_id: str) -> WorkflowResolution | None:
        return self.db.scalars(
            select(WorkflowResolution).where(
                WorkflowResolution.tenant_id == tenant_id,
                WorkflowResolution.case_id == case_id,
            )
        ).first()

    def list_alerts(self, tenant_id: str, case_id: str = None) -> list[WorkflowAlert]:
        stmt = select(WorkflowAlert).where(WorkflowAlert.tenant_id == tenant_id)
        if case_id:
            stmt = stmt.where(WorkflowAlert.case_id == case_id)
        return list(self.db.scalars(stmt).all())
