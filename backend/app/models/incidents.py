from sqlalchemy import Boolean, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TenantScopedMixin


class Incident(Base, TenantScopedMixin):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    incident_ref: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    reporter_user_id: Mapped[str] = mapped_column(String(64), nullable=False)
    incident_type: Mapped[str] = mapped_column(String(128), nullable=False)
    severity: Mapped[str] = mapped_column(String(64), default="unclassified")
    location_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    injured_persons: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_confidential: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(64), default="reported")


class Investigation(Base, TenantScopedMixin):
    __tablename__ = "investigations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    incident_id: Mapped[str] = mapped_column(String(64), ForeignKey("incidents.id"), index=True)
    lead_user_id: Mapped[str] = mapped_column(String(64), nullable=False)
    rca_method: Mapped[str] = mapped_column(String(64), default="5-why")
    findings: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(64), default="open")
