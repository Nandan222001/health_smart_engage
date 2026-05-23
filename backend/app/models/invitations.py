from sqlalchemy import Boolean, DateTime, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.helpers.datetime import utc_now


class OrgInvitation(Base):
    __tablename__ = "org_invitations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    org_name: Mapped[str] = mapped_column(String(255), nullable=False)
    admin_name: Mapped[str] = mapped_column(String(255), nullable=False)
    admin_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    subscription_plan: Mapped[str] = mapped_column(String(64), default="starter")
    allowed_modules: Mapped[dict] = mapped_column(JSON, default=list)
    expiry_date: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    token: Mapped[str] = mapped_column(String(128), nullable=False, unique=True, index=True)
    status: Mapped[str] = mapped_column(String(32), default="pending", index=True)
    invited_by: Mapped[str] = mapped_column(String(64), nullable=False)  # user_id
    tenant_id: Mapped[str | None] = mapped_column(String(64), nullable=True)  # set after tenant created
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
