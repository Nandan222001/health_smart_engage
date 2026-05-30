from sqlalchemy import DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TenantScopedMixin


class Permit(Base, TenantScopedMixin):
    __tablename__ = "permits"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    permit_ref: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    permit_type: Mapped[str] = mapped_column(String(128), nullable=False)
    requester_user_id: Mapped[str] = mapped_column(String(64), nullable=False)
    asset_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    zone_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    risk_assessment_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    vendor_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    start_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="draft", index=True)
    controls: Mapped[dict] = mapped_column(JSON, default=dict)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    extra_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class PermitApproval(Base, TenantScopedMixin):
    __tablename__ = "permit_approvals"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    permit_id: Mapped[str] = mapped_column(String(64), ForeignKey("permits.id"), index=True)
    approver_user_id: Mapped[str] = mapped_column(String(64), nullable=False)
    decision: Mapped[str] = mapped_column(String(64), nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    gps_location: Mapped[str | None] = mapped_column(String(255), nullable=True)
