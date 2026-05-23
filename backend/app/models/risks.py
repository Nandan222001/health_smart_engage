from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TenantScopedMixin


class RiskAssessment(Base, TenantScopedMixin):
    __tablename__ = "risk_assessments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    task_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    location_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    asset_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    hazard_description: Mapped[str] = mapped_column(Text, nullable=False)
    likelihood: Mapped[int] = mapped_column(Integer, nullable=False)
    consequence: Mapped[int] = mapped_column(Integer, nullable=False)
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False)
    residual_risk_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="draft")


class HazardObservation(Base, TenantScopedMixin):
    __tablename__ = "hazard_observations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    location_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    severity: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    photo_file_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="logged")
    assigned_to_user_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
