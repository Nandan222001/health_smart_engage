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
    extra_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class Investigation(Base, TenantScopedMixin):
    __tablename__ = "investigations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    incident_id: Mapped[str] = mapped_column(String(64), ForeignKey("incidents.id"), index=True)
    lead_user_id: Mapped[str] = mapped_column(String(64), nullable=False)
    rca_method: Mapped[str] = mapped_column(String(64), default="5-why")
    findings: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(64), default="open")


class IncidentRCA(Base, TenantScopedMixin):
    """Root cause analysis records linked to an incident."""
    __tablename__ = "incident_rcas"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    incident_id: Mapped[str] = mapped_column(String(64), ForeignKey("incidents.id"), index=True)
    method: Mapped[str | None] = mapped_column(String(128), nullable=True)
    root_cause: Mapped[str | None] = mapped_column(Text, nullable=True)
    contributing_factors: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="draft")
    extra_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class CorrectiveAction(Base, TenantScopedMixin):
    """Corrective actions raised for incidents."""
    __tablename__ = "corrective_actions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    incident_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    title: Mapped[str | None] = mapped_column(String(512), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    assigned_to: Mapped[str | None] = mapped_column(String(255), nullable=True)
    due_date: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="open")
    extra_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)
