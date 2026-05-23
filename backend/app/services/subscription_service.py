import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.exceptions import AppError
from app.models.subscriptions import SubscriptionPlan
from app.models.tenant import Tenant


class SubscriptionService:
    def __init__(self, db: Session):
        self.db = db

    def list_plans(self) -> dict:
        plans = self.db.scalars(select(SubscriptionPlan).order_by(SubscriptionPlan.price_monthly)).all()
        return {"items": [self._serialize(p) for p in plans]}

    def create_plan(self, data: dict) -> dict:
        plan = SubscriptionPlan(
            id=str(uuid.uuid4()),
            **{k: v for k, v in data.items() if hasattr(SubscriptionPlan, k)}
        )
        self.db.add(plan)
        self.db.flush()
        return self._serialize(plan)

    def update_plan(self, plan_id: str, data: dict) -> dict:
        plan = self.db.scalars(select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id)).first()
        if not plan:
            raise AppError("NOT_FOUND", "Plan not found", 404)
        for k, v in data.items():
            if hasattr(plan, k):
                setattr(plan, k, v)
        return self._serialize(plan)

    def assign_to_tenant(self, tenant_id: str, data: dict) -> dict:
        tenant = self.db.scalars(select(Tenant).where(Tenant.id == tenant_id)).first()
        if not tenant:
            raise AppError("NOT_FOUND", "Tenant not found", 404)
        tenant.plan = data.get("plan", tenant.plan)
        return {"tenant_id": tenant_id, "plan": tenant.plan, "message": "Subscription updated"}

    @staticmethod
    def _serialize(p: SubscriptionPlan) -> dict:
        return {
            "id": p.id,
            "name": p.name,
            "price_monthly": p.price_monthly,
            "price_yearly": p.price_yearly,
            "user_limit": p.user_limit,
            "storage_gb": p.storage_gb,
            "api_requests_per_day": p.api_requests_per_day,
            "module_access": p.module_access or [],
            "ai_features": p.ai_features or [],
            "status": p.status,
        }
