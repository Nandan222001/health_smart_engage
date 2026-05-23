from sqlalchemy import Boolean, Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TenantScopedMixin


class Employee(Base, TenantScopedMixin):
    __tablename__ = "employees"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    employee_code: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role_name: Mapped[str] = mapped_column(String(128), nullable=False)
    department_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    contact: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="active")


class Certification(Base, TenantScopedMixin):
    __tablename__ = "certifications"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    employee_id: Mapped[str] = mapped_column(String(64), ForeignKey("employees.id"), index=True)
    certification_type: Mapped[str] = mapped_column(String(128), nullable=False)
    issue_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    expiry_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    evidence_file_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="active")


class TrainingRequirement(Base, TenantScopedMixin):
    __tablename__ = "training_requirements"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    role_name: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    training_name: Mapped[str] = mapped_column(String(255), nullable=False)
    validity_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=True)


class TrainingCompletion(Base, TenantScopedMixin):
    __tablename__ = "training_completions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    employee_id: Mapped[str] = mapped_column(String(64), ForeignKey("employees.id"), index=True)
    training_requirement_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    completed_on: Mapped[Date] = mapped_column(Date, nullable=False)
    trainer: Mapped[str | None] = mapped_column(String(255), nullable=True)
    evidence_file_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
