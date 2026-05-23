from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.helpers.datetime import utc_now


class TenantScopedMixin:
    tenant_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
