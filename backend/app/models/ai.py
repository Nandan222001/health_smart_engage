from sqlalchemy import Boolean, Float, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TenantScopedMixin


class AiConversation(Base, TenantScopedMixin):
    __tablename__ = "ai_conversations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_citations: Mapped[dict] = mapped_column(JSON, default=dict)
    feedback: Mapped[str | None] = mapped_column(String(64), nullable=True)


class AIRecommendation(Base, TenantScopedMixin):
    __tablename__ = "ai_recommendations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    priority: Mapped[str] = mapped_column(String(64), default="medium")
    status: Mapped[str] = mapped_column(String(64), default="active")
    actioned: Mapped[bool] = mapped_column(Boolean, default=False)
    dismissed: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class PredictiveRiskScore(Base, TenantScopedMixin):
    __tablename__ = "predictive_risk_scores"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    area_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    trend: Mapped[dict] = mapped_column(JSON, default=dict)
    contributing_factors: Mapped[dict] = mapped_column(JSON, default=dict)
