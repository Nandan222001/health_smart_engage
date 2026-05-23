from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TenantScopedMixin


class MLModel(Base, TenantScopedMixin):
    __tablename__ = "ml_models"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    domain: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(64), default="active")
    current_version: Mapped[str] = mapped_column(String(64), default="v1.0")
    accuracy: Mapped[float] = mapped_column(Float, default=0.0)
    accuracy_delta: Mapped[float] = mapped_column(Float, default=0.0)
    last_trained: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    next_scheduled: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    training_runs: Mapped[int] = mapped_column(Integer, default=0)


class MLModelVersion(Base, TenantScopedMixin):
    __tablename__ = "ml_model_versions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    model_id: Mapped[str] = mapped_column(String(64), ForeignKey("ml_models.id"), index=True)
    version: Mapped[str] = mapped_column(String(64), nullable=False)
    trained_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    accuracy: Mapped[float] = mapped_column(Float, default=0.0)
    precision: Mapped[float] = mapped_column(Float, default=0.0)
    recall: Mapped[float] = mapped_column(Float, default=0.0)
    f1_score: Mapped[float] = mapped_column(Float, default=0.0)
    training_samples: Mapped[int] = mapped_column(Integer, default=0)
    validation_loss: Mapped[float] = mapped_column(Float, default=0.0)


class DetectedPattern(Base, TenantScopedMixin):
    __tablename__ = "detected_patterns"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    pattern_type: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    supporting_events: Mapped[int] = mapped_column(Integer, default=0)
    affected_module: Mapped[str] = mapped_column(String(128), nullable=False)
    used_for_training: Mapped[bool] = mapped_column(Boolean, default=False)


class OperationalEvent(Base, TenantScopedMixin):
    __tablename__ = "operational_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    source: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    payload_size_kb: Mapped[float] = mapped_column(Float, default=0.0)
    processed: Mapped[bool] = mapped_column(Boolean, default=False)
    features_extracted: Mapped[int] = mapped_column(Integer, default=0)
    ingested_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
