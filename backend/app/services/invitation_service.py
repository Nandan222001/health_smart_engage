import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.exceptions import AppError
from app.core.security import CurrentUser
from app.models.invitations import OrgInvitation
from app.services.email_service import get_email_service

logger = logging.getLogger(__name__)


class InvitationService:
    def __init__(self, db: Session):
        self.db = db
        self._email = get_email_service()

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
        result = self._serialize(inv)
        self._send_invitation_email(inv)
        return result

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
        self._send_invitation_email(inv)
        return {"message": "Invitation resent", "id": inv.id}

    def cancel_invitation(self, invitation_id: str) -> dict:
        inv = self.db.scalars(select(OrgInvitation).where(OrgInvitation.id == invitation_id)).first()
        if not inv:
            raise AppError("NOT_FOUND", "Invitation not found", 404)
        inv.status = "cancelled"
        return {"message": "Invitation cancelled", "id": inv.id}

    def _send_invitation_email(self, inv: OrgInvitation) -> None:
        subject = f"You're invited to set up {inv.org_name} on HSE Platform"
        html_body = f"""
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
  <h2 style="color:#111827">Welcome to HSE Platform</h2>
  <p style="color:#374151">Hi <strong>{inv.admin_name}</strong>,</p>
  <p style="color:#374151">
    You have been invited to set up <strong>{inv.org_name}</strong> on the HSE Safety,
    Compliance &amp; Intelligence Platform.
  </p>
  <p style="color:#374151">
    Your invitation token: <code style="background:#F3F7FF;padding:4px 8px;border-radius:4px">{inv.token}</code>
  </p>
  <p style="color:#6B7280;font-size:13px">
    This invitation expires on {inv.expiry_date.strftime('%d %b %Y') if inv.expiry_date else 'N/A'}.
  </p>
  <hr style="border:none;border-top:1px solid #E3E9F6;margin:24px 0"/>
  <p style="color:#9CA3AF;font-size:12px">HSE Platform · automated notification</p>
</div>
"""
        text_body = (
            f"Hi {inv.admin_name},\n\n"
            f"You have been invited to set up {inv.org_name} on the HSE Platform.\n"
            f"Invitation token: {inv.token}\n"
            f"Expires: {inv.expiry_date.strftime('%d %b %Y') if inv.expiry_date else 'N/A'}\n"
        )
        try:
            self._email.send_email(
                to=inv.admin_email,
                subject=subject,
                html_body=html_body,
                text_body=text_body,
            )
        except Exception as exc:
            logger.error("Failed to send invitation email to %s: %s", inv.admin_email, exc)

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
