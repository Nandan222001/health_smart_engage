from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TenantScopedMixin


class WorkflowCase(Base, TenantScopedMixin):
    __tablename__ = "workflow_cases"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    case_number: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    case_type: Mapped[str] = mapped_column(String(64), nullable=False)
    severity: Mapped[str] = mapped_column(String(64), default="medium")
    priority: Mapped[str] = mapped_column(String(64), default="medium")
    current_stage: Mapped[str] = mapped_column(String(64), default="risk_detected")
    assigned_to: Mapped[str | None] = mapped_column(String(255), nullable=True)
    site: Mapped[str | None] = mapped_column(String(255), nullable=True)
    zone: Mapped[str | None] = mapped_column(String(255), nullable=True)
    due_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    overdue: Mapped[bool] = mapped_column(Boolean, default=False)
    escalated: Mapped[bool] = mapped_column(Boolean, default=False)
    source_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    source_id: Mapped[str | None] = mapped_column(String(64), nullable=True)


class WorkflowStageEvent(Base, TenantScopedMixin):
    __tablename__ = "workflow_stage_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    case_id: Mapped[str] = mapped_column(String(64), ForeignKey("workflow_cases.id"), index=True)
    stage: Mapped[str] = mapped_column(String(64), nullable=False)
    entered_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    actor: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class WorkflowApproval(Base, TenantScopedMixin):
    __tablename__ = "workflow_approvals"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    case_id: Mapped[str] = mapped_column(String(64), ForeignKey("workflow_cases.id"), index=True)
    approver: Mapped[str] = mapped_column(String(255), nullable=False)
    approver_role: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(64), default="pending")
    due_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    escalated_to: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class WorkflowCAPA(Base, TenantScopedMixin):
    __tablename__ = "workflow_capas"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    case_id: Mapped[str] = mapped_column(String(64), ForeignKey("workflow_cases.id"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    assignee: Mapped[str] = mapped_column(String(255), nullable=False)
    priority: Mapped[str] = mapped_column(String(64), default="medium")
    due_date: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="open")
    root_cause: Mapped[str | None] = mapped_column(Text, nullable=True)
    overdue: Mapped[bool] = mapped_column(Boolean, default=False)


class WorkflowResolution(Base, TenantScopedMixin):
    __tablename__ = "workflow_resolutions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    case_id: Mapped[str] = mapped_column(String(64), ForeignKey("workflow_cases.id"), index=True)
    verified_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    verification_due: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    evidence_submitted: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(64), default="awaiting_evidence")
    submitted_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    evidence_notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class WorkflowAlert(Base, TenantScopedMixin):
    __tablename__ = "workflow_alerts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    case_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    alert_type: Mapped[str] = mapped_column(String(32), default="in_app")
    recipient: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    sent_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    acknowledged_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
