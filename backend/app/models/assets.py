from sqlalchemy import Date, Float, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TenantScopedMixin


class Asset(Base, TenantScopedMixin):
    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    asset_code: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(128), nullable=False)
    location_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    criticality: Mapped[str] = mapped_column(String(64), default="medium")
    manufacturer: Mapped[str | None] = mapped_column(String(255), nullable=True)
    serial_number: Mapped[str | None] = mapped_column(String(128), nullable=True)
    compliance_status: Mapped[str] = mapped_column(String(64), default="compliant")
    status: Mapped[str] = mapped_column(String(64), default="Active")
    risk_score: Mapped[float | None] = mapped_column(Float, nullable=True, default=0.0)
    purchase_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    last_maintenance_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    next_maintenance_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    extra_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class AssetMaintenanceLog(Base, TenantScopedMixin):
    __tablename__ = "asset_maintenance_logs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    asset_id: Mapped[str] = mapped_column(String(64), ForeignKey("assets.id"), index=True)
    work_type: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    performed_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    performed_on: Mapped[Date] = mapped_column(Date, nullable=False)
    cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="completed")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class AssetInspection(Base, TenantScopedMixin):
    __tablename__ = "asset_inspections"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    asset_id: Mapped[str] = mapped_column(String(64), ForeignKey("assets.id"), index=True)
    inspection_type: Mapped[str] = mapped_column(String(128), nullable=False)
    inspected_on: Mapped[Date] = mapped_column(Date, nullable=False)
    inspector_user_id: Mapped[str] = mapped_column(String(64), nullable=False)
    result: Mapped[str] = mapped_column(String(64), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    evidence_file_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
