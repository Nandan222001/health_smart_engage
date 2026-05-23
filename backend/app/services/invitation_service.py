import secrets
import string
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt as _bcrypt
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.core.security import CurrentUser
from app.models.auth import User
from app.models.invitations import OrgInvitation
from app.models.tenant import Tenant
from app.services.email_service import send_invitation_email


def _generate_password() -> str:
    """Generate a human-readable secure password: Hse@<8 alphanum chars>"""
    chars = string.ascii_letters + string.digits
    return "Hse@" + "".join(secrets.choice(chars) for _ in range(8))


def _hash(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()


def _org_code(org_name: str) -> str:
    """Derive a short uppercase org code from the org name."""
    words = org_name.upper().split()
    if len(words) >= 2:
        code = "".join(w[0] for w in words[:4])
    else:
        code = org_name.upper()[:4]
    suffix = secrets.token_hex(2).upper()
    return f"{code}-{suffix}"


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
        admin_email = data["admin_email"].lower().strip()
        admin_name = data["admin_name"]
        org_name = data["org_name"]
        expiry_days = int(data.get("expiry_days", 7))

        # 1. Generate credentials
        password = _generate_password()
        token = secrets.token_urlsafe(32)
        expiry = datetime.now(timezone.utc) + timedelta(days=expiry_days)

        # 2. Create tenant
        tenant_id = str(uuid.uuid4())
        tenant = Tenant(
            id=tenant_id,
            name=org_name,
            status="active",
            org_code=_org_code(org_name),
            contact_email=admin_email,
        )
        self.db.add(tenant)

        # 3. Create org admin user with generated password
        user_id = str(uuid.uuid4())
        org_user = User(
            id=user_id,
            email=admin_email,
            display_name=admin_name,
            status="active",
            tenant_id=tenant_id,
            password_hash=_hash(password),
            is_superadmin=False,
        )
        self.db.add(org_user)

        # 4. Create the invitation record linked to the tenant
        inv = OrgInvitation(
            id=str(uuid.uuid4()),
            org_name=org_name,
            admin_name=admin_name,
            admin_email=admin_email,
            subscription_plan=None,
            allowed_modules=data.get("allowed_modules", []),
            expiry_date=expiry,
            token=token,
            status="pending",
            invited_by=user.user_id,
            tenant_id=tenant_id,
            notes=data.get("notes"),
        )
        self.db.add(inv)
        self.db.flush()

        # 5. Send email with credentials
        send_invitation_email(
            admin_email=admin_email,
            admin_name=admin_name,
            org_name=org_name,
            token=token,
            password=password,
        )

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

        # Generate a new password and update the user account
        new_password = _generate_password()
        new_token = secrets.token_urlsafe(32)

        org_user = self.db.scalars(
            select(User).where(User.email == inv.admin_email)
        ).first()
        if org_user:
            org_user.password_hash = _hash(new_password)
        else:
            # User was never created (invitation sent before user-creation code was deployed).
            # Create the tenant if it also doesn't exist, then create the user.
            from app.models.tenant import Tenant as TenantModel
            tenant = self.db.scalars(
                select(TenantModel).where(TenantModel.id == inv.tenant_id)
            ).first() if inv.tenant_id else None
            if not tenant:
                tenant_id = str(uuid.uuid4())
                tenant = TenantModel(
                    id=tenant_id,
                    name=inv.org_name,
                    status="active",
                    org_code=_org_code(inv.org_name),
                    contact_email=inv.admin_email,
                )
                self.db.add(tenant)
                inv.tenant_id = tenant_id
            new_user = User(
                id=str(uuid.uuid4()),
                email=inv.admin_email,
                display_name=inv.admin_name,
                status="active",
                tenant_id=inv.tenant_id,
                password_hash=_hash(new_password),
                is_superadmin=False,
            )
            self.db.add(new_user)

        inv.token = new_token
        inv.expiry_date = datetime.now(timezone.utc) + timedelta(days=7)
        inv.status = "pending"

        email_sent = send_invitation_email(
            admin_email=inv.admin_email,
            admin_name=inv.admin_name,
            org_name=inv.org_name,
            token=new_token,
            password=new_password,
        )
        return {"message": "Invitation resent" if email_sent else "User created but email failed — check server logs", "id": inv.id, "email_sent": email_sent}

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
            "subscription_plan": inv.subscription_plan or "",
            "allowed_modules": inv.allowed_modules or [],
            "expiry_date": inv.expiry_date.isoformat() if inv.expiry_date else None,
            "token": inv.token,
            "status": inv.status,
            "invited_by": inv.invited_by,
            "tenant_id": inv.tenant_id,
            "notes": inv.notes,
            "created_at": inv.created_at.isoformat() if inv.created_at else None,
        }
