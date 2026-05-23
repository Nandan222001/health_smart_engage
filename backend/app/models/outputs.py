from sqlalchemy import Boolean, DateTime, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TenantScopedMixin


class Report(Base, TenantScopedMixin):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    report_type: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(64), default="generating")
    format: Mapped[str] = mapped_column(String(32), default="pdf")
    size_kb: Mapped[int | None] = mapped_column(Integer, nullable=True)
    generated_by: Mapped[str] = mapped_column(String(255), nullable=False)
    period: Mapped[str | None] = mapped_column(String(128), nullable=True)
    download_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    scheduled_for: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    generated_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    filters: Mapped[dict] = mapped_column(JSON, default=dict)


class AlertRule(Base, TenantScopedMixin):
    __tablename__ = "alert_rules"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    trigger_expr: Mapped[str] = mapped_column(String(255), nullable=False)
    channels: Mapped[dict] = mapped_column(JSON, default=list)
    priority: Mapped[str] = mapped_column(String(64), default="medium")
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    recipients: Mapped[dict] = mapped_column(JSON, default=list)


class ExportJob(Base, TenantScopedMixin):
    __tablename__ = "export_jobs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    format: Mapped[str] = mapped_column(String(32), nullable=False)
    module: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(64), default="processing")
    size_kb: Mapped[int | None] = mapped_column(Integer, nullable=True)
    download_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    filters: Mapped[dict] = mapped_column(JSON, default=dict)


class Integration(Base, TenantScopedMixin):
    __tablename__ = "integrations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    integration_type: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(64), default="disconnected")
    last_sync: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    records_synced: Mapped[int | None] = mapped_column(Integer, nullable=True)
    config: Mapped[dict] = mapped_column(JSON, default=dict)
