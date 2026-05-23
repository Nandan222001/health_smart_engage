import secrets
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.exceptions import AppError
from app.core.security import CurrentUser
from app.models.invitations import OrgInvitation


class InvitationService:
    def __init__(self, db: Session):
        self.db = db

    def list_invitations(self, filters: dict = None) -> dict:
        stmt = select(OrgInvitation).order_by(OrgInvitation.created_at.desc())
        if filters and filters.get("status"):
            stmt = stmt.where(OrgInvitation.status == filters["status"])
        items = self.db.scalars(stmt).all()
        return {"items": [self._serialize(i) for i in items]}

    def get_invitation(self, invitation_id: str) -> dict:
        inv = self.db.scalars(select(OrgInvitation).where(OrgInvitation.id == invitation_id)).first()
        if not inv:
            raise AppError("NOT_FOUND", "Invitation not found", 404)
        return self._serialize(inv)

    def create_invitation(self, user: CurrentUser, data: dict) -> dict:
        token = secrets.token_urlsafe(32)
        expiry = datetime.now(timezone.utc) + timedelta(days=int(data.get("expiry_days", 7)))
        inv = OrgInvitation(
            id=str(uuid.uuid4()),
            org_name=data["org_name"],
            admin_name=data["admin_name"],
            admin_email=data["admin_email"].lower().strip(),
            subscription_plan=data.get("subscription_plan", "starter"),
            allowed_modules=data.get("allowed_modules", []),
            expiry_date=expiry,
            token=token,
            status="pending",
            invited_by=user.user_id,
            notes=data.get("notes"),
        )
        self.db.add(inv)
        self.db.flush()
        return self._serialize(inv)

    def update_invitation(self, invitation_id: str, data: dict) -> dict:
        inv = self.db.scalars(select(OrgInvitation).where(OrgInvitation.id == invitation_id)).first()
        if not inv:
            raise AppError("NOT_FOUND", "Invitation not found", 404)
        for field in ("org_name", "admin_name", "admin_email", "subscription_plan", "allowed_modules", "notes", "status"):
            if field in data:
                setattr(inv, field, data[field])
        return self._serialize(inv)

    def resend_invitation(self, invitation_id: str) -> dict:
        inv = self.db.scalars(select(OrgInvitation).where(OrgInvitation.id == invitation_id)).first()
        if not inv:
            raise AppError("NOT_FOUND", "Invitation not found", 404)
        inv.token = secrets.token_urlsafe(32)
        inv.expiry_date = datetime.now(timezone.utc) + timedelta(days=7)
        inv.status = "pending"
        return {"message": "Invitation resent", "id": inv.id}

    def cancel_invitation(self, invitation_id: str) -> dict:
        inv = self.db.scalars(select(OrgInvitation).where(OrgInvitation.id == invitation_id)).first()
        if not inv:
            raise AppError("NOT_FOUND", "Invitation not found", 404)
        inv.status = "cancelled"
        return {"message": "Invitation cancelled", "id": inv.id}

    @staticmethod
    def _serialize(inv: OrgInvitation) -> dict:
        return {
            "id": inv.id,
            "org_name": inv.org_name,
            "admin_name": inv.admin_name,
            "admin_email": inv.admin_email,
            "subscription_plan": inv.subscription_plan,
            "allowed_modules": inv.allowed_modules or [],
            "expiry_date": inv.expiry_date.isoformat() if inv.expiry_date else None,
            "token": inv.token,
            "status": inv.status,
            "invited_by": inv.invited_by,
            "tenant_id": inv.tenant_id,
            "notes": inv.notes,
            "created_at": inv.created_at.isoformat() if inv.created_at else None,
        }
