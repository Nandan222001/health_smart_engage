from sqlalchemy import DateTime, Float, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.helpers.datetime import utc_now


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    price_monthly: Mapped[float] = mapped_column(Float, default=0.0)
    price_yearly: Mapped[float] = mapped_column(Float, default=0.0)
    user_limit: Mapped[int] = mapped_column(Integer, default=10)
    storage_gb: Mapped[float] = mapped_column(Float, default=5.0)
    api_requests_per_day: Mapped[int] = mapped_column(Integer, default=1000)
    module_access: Mapped[dict] = mapped_column(JSON, default=list)
    ai_features: Mapped[dict] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(32), default="active")
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
