from datetime import datetime

from sqlalchemy import DateTime, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TenantScopedMixin


class Shift(Base, TenantScopedMixin):
    __tablename__ = "shifts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    start_time: Mapped[str | None] = mapped_column(String(32), nullable=True)
    end_time: Mapped[str | None] = mapped_column(String(32), nullable=True)
    days: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="active")
    extra_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class HelpTicket(Base, TenantScopedMixin):
    __tablename__ = "help_tickets"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    subject: Mapped[str | None] = mapped_column(String(512), nullable=True)
    category: Mapped[str | None] = mapped_column(String(128), nullable=True)
    priority: Mapped[str] = mapped_column(String(64), default="medium")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="open")
    extra_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class DataImport(Base, TenantScopedMixin):
    __tablename__ = "data_imports"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    file_name: Mapped[str] = mapped_column(String(512), nullable=False)
    import_type: Mapped[str] = mapped_column(String(64), default="excel")
    data_type: Mapped[str | None] = mapped_column(String(128), nullable=True)
    records_total: Mapped[int] = mapped_column(Integer, default=0)
    records_success: Mapped[int] = mapped_column(Integer, default=0)
    records_failed: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(64), default="success")
    uploaded_by: Mapped[str | None] = mapped_column(String(128), nullable=True)


class ValidationLog(Base, TenantScopedMixin):
    __tablename__ = "validation_logs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    import_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    file_name: Mapped[str | None] = mapped_column(String(512), nullable=True)
    rule: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="pass")
    records_affected: Mapped[int] = mapped_column(Integer, default=0)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)


class ApiIntegration(Base, TenantScopedMixin):
    __tablename__ = "api_integrations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    integration_type: Mapped[str | None] = mapped_column(String(128), nullable=True)
    endpoint_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    api_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    last_sync: Mapped[str | None] = mapped_column(String(128), nullable=True)
    records_synced: Mapped[int] = mapped_column(Integer, default=0)
    extra_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class SyncIntegration(Base, TenantScopedMixin):
    """Tracks scheduled sync integrations (ERP, HRMS, IoT, etc.)."""
    __tablename__ = "sync_integrations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    integration_type: Mapped[str | None] = mapped_column(String(128), nullable=True)
    last_sync: Mapped[str | None] = mapped_column(String(128), nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="active")
    records_synced: Mapped[int] = mapped_column(Integer, default=0)
    extra_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class Zone(Base, TenantScopedMixin):
    __tablename__ = "zones"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    site_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    zone_type: Mapped[str | None] = mapped_column(String(128), nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="active")
    extra_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class EscalationRule(Base, TenantScopedMixin):
    __tablename__ = "escalation_rules"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    trigger_condition: Mapped[str | None] = mapped_column(String(512), nullable=True)
    escalate_to: Mapped[str | None] = mapped_column(String(255), nullable=True)
    time_limit_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="active")
    extra_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class GeneratedReport(Base, TenantScopedMixin):
    __tablename__ = "generated_reports"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(512), nullable=False)
    report_type: Mapped[str] = mapped_column(String(128), nullable=False)
    format: Mapped[str] = mapped_column(String(32), default="pdf")
    period_start: Mapped[str | None] = mapped_column(String(64), nullable=True)
    period_end: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="ready")
    size: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
