from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository
from app.models.compliance import AuditChecklist, AuditExecution, Finding, Capa


class ComplianceRepository(BaseRepository[AuditChecklist]):
    def __init__(self, db: Session):
        super().__init__(db, AuditChecklist)

    def list_checklists(self, tenant_id: str, filters: dict = None) -> list[AuditChecklist]:
        stmt = select(AuditChecklist).where(AuditChecklist.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(AuditChecklist, k) and v is not None:
                    stmt = stmt.where(getattr(AuditChecklist, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_checklist(self, tenant_id: str, checklist_id: str) -> AuditChecklist | None:
        return self.db.scalars(
            select(AuditChecklist).where(
                AuditChecklist.tenant_id == tenant_id, AuditChecklist.id == checklist_id
            )
        ).first()

    def list_executions(self, tenant_id: str, filters: dict = None) -> list[AuditExecution]:
        stmt = select(AuditExecution).where(AuditExecution.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(AuditExecution, k) and v is not None:
                    stmt = stmt.where(getattr(AuditExecution, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_execution(self, tenant_id: str, execution_id: str) -> AuditExecution | None:
        return self.db.scalars(
            select(AuditExecution).where(
                AuditExecution.tenant_id == tenant_id, AuditExecution.id == execution_id
            )
        ).first()

    def list_findings(self, tenant_id: str, filters: dict = None) -> list[Finding]:
        stmt = select(Finding).where(Finding.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(Finding, k) and v is not None:
                    stmt = stmt.where(getattr(Finding, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_finding(self, tenant_id: str, finding_id: str) -> Finding | None:
        return self.db.scalars(
            select(Finding).where(Finding.tenant_id == tenant_id, Finding.id == finding_id)
        ).first()

    def list_capas(self, tenant_id: str, filters: dict = None) -> list[Capa]:
        stmt = select(Capa).where(Capa.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(Capa, k) and v is not None:
                    stmt = stmt.where(getattr(Capa, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_capa(self, tenant_id: str, capa_id: str) -> Capa | None:
        return self.db.scalars(
            select(Capa).where(Capa.tenant_id == tenant_id, Capa.id == capa_id)
        ).first()
