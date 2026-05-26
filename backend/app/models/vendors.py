from datetime import date
from sqlalchemy import Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TenantScopedMixin


class Vendor(Base, TenantScopedMixin):
    __tablename__ = "vendors"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    trade_type: Mapped[str] = mapped_column(String(128), nullable=False, default="General")
    status: Mapped[str] = mapped_column(String(64), default="Pending")
    site_location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    total_workers: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    on_site_workers: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    safety_score: Mapped[float | None] = mapped_column(Float, nullable=True, default=0.0)
    risk_score: Mapped[float | None] = mapped_column(Float, nullable=True, default=0.0)
    incident_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    contract_expiry: Mapped[date | None] = mapped_column(Date, nullable=True)
    active_since: Mapped[date | None] = mapped_column(Date, nullable=True)


class VendorDocument(Base, TenantScopedMixin):
    __tablename__ = "vendor_documents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    vendor_id: Mapped[str] = mapped_column(String(64), ForeignKey("vendors.id"), index=True)
    document_type: Mapped[str] = mapped_column(String(128), nullable=False)
    file_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="pending_review")
    issuing_body: Mapped[str | None] = mapped_column(String(255), nullable=True)
    review_comment: Mapped[str | None] = mapped_column(Text, nullable=True)


class VendorCompliance(Base, TenantScopedMixin):
    __tablename__ = "vendor_compliance"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    vendor_id: Mapped[str] = mapped_column(String(64), ForeignKey("vendors.id"), index=True)
    domain: Mapped[str] = mapped_column(String(128), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    assessed_at: Mapped[date | None] = mapped_column(Date, nullable=True)
