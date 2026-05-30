from sqlalchemy import Date, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TenantScopedMixin


class AuditChecklist(Base, TenantScopedMixin):
    __tablename__ = "audit_checklists"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    standard: Mapped[str] = mapped_column(String(128), nullable=False)
    version: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(64), default="draft")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    audit_type: Mapped[str | None] = mapped_column(String(128), nullable=True)


class AuditExecution(Base, TenantScopedMixin):
    __tablename__ = "audit_executions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    checklist_id: Mapped[str | None] = mapped_column(String(64), ForeignKey("audit_checklists.id"), nullable=True)
    site_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    auditor_user_id: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(64), default="scheduled")
    answers: Mapped[dict] = mapped_column(JSON, default=dict)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    audit_type: Mapped[str | None] = mapped_column(String(128), nullable=True)
    scheduled_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    completed_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    extra_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class Finding(Base, TenantScopedMixin):
    __tablename__ = "findings"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    audit_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    source_type: Mapped[str] = mapped_column(String(64), nullable=False)
    severity: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    iso_clause: Mapped[str | None] = mapped_column(String(128), nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="open")


class Capa(Base, TenantScopedMixin):
    __tablename__ = "capas"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    source_type: Mapped[str] = mapped_column(String(64), nullable=False)
    source_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    owner_user_id: Mapped[str] = mapped_column(String(64), nullable=False)
    due_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    severity: Mapped[str] = mapped_column(String(64), default="medium")
    status: Mapped[str] = mapped_column(String(64), default="open")
    evidence_file_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    root_cause: Mapped[str | None] = mapped_column(Text, nullable=True)
    corrective_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    extra_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class ComplianceStandard(Base, TenantScopedMixin):
    __tablename__ = "compliance_standards"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str | None] = mapped_column(String(128), nullable=True)
    category: Mapped[str] = mapped_column(String(128), nullable=False, default="General")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="Active")
    version: Mapped[str | None] = mapped_column(String(64), nullable=True)
    effective_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    review_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    owner: Mapped[str | None] = mapped_column(String(255), nullable=True)
    jurisdiction: Mapped[str | None] = mapped_column(String(255), nullable=True)


class RegulatoryRequirement(Base, TenantScopedMixin):
    __tablename__ = "regulatory_requirements"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    regulation_name: Mapped[str] = mapped_column(String(255), nullable=False)
    jurisdiction: Mapped[str | None] = mapped_column(String(255), nullable=True)
    category: Mapped[str | None] = mapped_column(String(128), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    due_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="Pending")
    owner: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_reviewed_date: Mapped[Date | None] = mapped_column(Date, nullable=True)


class ComplianceDocument(Base, TenantScopedMixin):
    __tablename__ = "compliance_documents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    document_type: Mapped[str] = mapped_column(String(128), nullable=False, default="Policy")
    category: Mapped[str | None] = mapped_column(String(128), nullable=True)
    version: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="Draft")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    effective_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    created_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
