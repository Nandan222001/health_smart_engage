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


class AuditExecution(Base, TenantScopedMixin):
    __tablename__ = "audit_executions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    checklist_id: Mapped[str] = mapped_column(String(64), ForeignKey("audit_checklists.id"))
    site_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    auditor_user_id: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(64), default="scheduled")
    answers: Mapped[dict] = mapped_column(JSON, default=dict)


class Finding(Base, TenantScopedMixin):
    __tablename__ = "findings"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    audit_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    source_type: Mapped[str] = mapped_column(String(64), nullable=False)
    severity: Mapped[str] = mapped_column(String(64), nullable=False)
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
