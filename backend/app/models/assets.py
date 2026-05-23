from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TenantScopedMixin


class Asset(Base, TenantScopedMixin):
    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    asset_code: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(128), nullable=False)
    location_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    criticality: Mapped[str] = mapped_column(String(64), default="medium")
    manufacturer: Mapped[str | None] = mapped_column(String(255), nullable=True)
    compliance_status: Mapped[str] = mapped_column(String(64), default="compliant")


class AssetInspection(Base, TenantScopedMixin):
    __tablename__ = "asset_inspections"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    asset_id: Mapped[str] = mapped_column(String(64), ForeignKey("assets.id"), index=True)
    inspection_type: Mapped[str] = mapped_column(String(128), nullable=False)
    inspected_on: Mapped[Date] = mapped_column(Date, nullable=False)
    inspector_user_id: Mapped[str] = mapped_column(String(64), nullable=False)
    result: Mapped[str] = mapped_column(String(64), nullable=False)
    evidence_file_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
