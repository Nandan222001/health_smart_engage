from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TenantScopedMixin


class Vendor(Base, TenantScopedMixin):
    __tablename__ = "vendors"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact: Mapped[str | None] = mapped_column(String(255), nullable=True)
    trade_type: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(64), default="pending_approval")


class VendorDocument(Base, TenantScopedMixin):
    __tablename__ = "vendor_documents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    vendor_id: Mapped[str] = mapped_column(String(64), ForeignKey("vendors.id"), index=True)
    document_type: Mapped[str] = mapped_column(String(128), nullable=False)
    file_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    expiry_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="pending_review")
    review_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
