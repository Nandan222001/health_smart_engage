from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository
from app.models.outputs import Report, AlertRule, ExportJob, Integration


class OutputsRepository(BaseRepository[Report]):
    def __init__(self, db: Session):
        super().__init__(db, Report)

    def list_reports(self, tenant_id: str, filters: dict = None) -> list[Report]:
        stmt = select(Report).where(Report.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(Report, k) and v is not None:
                    stmt = stmt.where(getattr(Report, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_report(self, tenant_id: str, report_id: str) -> Report | None:
        return self.db.scalars(
            select(Report).where(Report.tenant_id == tenant_id, Report.id == report_id)
        ).first()

    def list_alert_rules(self, tenant_id: str, filters: dict = None) -> list[AlertRule]:
        stmt = select(AlertRule).where(AlertRule.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(AlertRule, k) and v is not None:
                    stmt = stmt.where(getattr(AlertRule, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_alert_rule(self, tenant_id: str, rule_id: str) -> AlertRule | None:
        return self.db.scalars(
            select(AlertRule).where(AlertRule.tenant_id == tenant_id, AlertRule.id == rule_id)
        ).first()

    def list_export_jobs(self, tenant_id: str, filters: dict = None) -> list[ExportJob]:
        stmt = select(ExportJob).where(ExportJob.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(ExportJob, k) and v is not None:
                    stmt = stmt.where(getattr(ExportJob, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_export_job(self, tenant_id: str, job_id: str) -> ExportJob | None:
        return self.db.scalars(
            select(ExportJob).where(ExportJob.tenant_id == tenant_id, ExportJob.id == job_id)
        ).first()

    def list_integrations(self, tenant_id: str, filters: dict = None) -> list[Integration]:
        stmt = select(Integration).where(Integration.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(Integration, k) and v is not None:
                    stmt = stmt.where(getattr(Integration, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_integration(self, tenant_id: str, integration_id: str) -> Integration | None:
        return self.db.scalars(
            select(Integration).where(
                Integration.tenant_id == tenant_id, Integration.id == integration_id
            )
        ).first()
