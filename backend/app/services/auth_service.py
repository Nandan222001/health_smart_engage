from datetime import datetime, timedelta, timezone

import bcrypt as _bcrypt_lib
from jose import jwt
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import AppError
from app.models.domain import User


def _hash_password(password: str) -> str:
    return _bcrypt_lib.hashpw(password.encode(), _bcrypt_lib.gensalt()).decode()


def _verify_password(password: str, hashed: str) -> bool:
    try:
        return _bcrypt_lib.checkpw(password.encode(), hashed.encode())
    except Exception:
        return False


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    # ── Public API ────────────────────────────────────────────────────────────

    def login(self, email: str, password: str) -> dict:
        user = self._get_user_by_email(email)
        if not user or not user.password_hash:
            # 404 lets the frontend fall through to Theta/Firebase for non-backend users
            raise AppError("USER_NOT_FOUND", "No account found", 404)
        if not _verify_password(password, user.password_hash):
            raise AppError("INVALID_CREDENTIALS", "Invalid email or password", 401)
        if user.status == "revoked":
            raise AppError("ACCOUNT_REVOKED", "Account has been revoked", 403)
        first_login = user.status == "invited"
        if first_login:
            user.status = "active"
            self.db.flush()
        token = self._create_token(user)
        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": settings.access_token_expire_minutes * 60,
            "is_superadmin": user.is_superadmin,
            "first_login": first_login,
            "user": self._serialize(user),
        }

    def me(self, user_id: str, tenant_id: str) -> dict:
        user = self.db.scalars(select(User).where(User.id == user_id)).first()
        if not user:
            return {"id": user_id, "tenant_id": tenant_id, "is_superadmin": False}
        return self._serialize(user)

    def set_password(self, user_id: str, password: str) -> None:
        user = self.db.scalars(select(User).where(User.id == user_id)).first()
        if not user:
            raise AppError("USER_NOT_FOUND", "User not found", 404)
        user.password_hash = _hash_password(password)
        self.db.flush()

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def hash_password(password: str) -> str:
        return _hash_password(password)

    def _get_user_by_email(self, email: str):
        return self.db.scalars(
            select(User).where(User.email == email.strip().lower())
        ).first()

    def _create_token(self, user: User) -> str:
        now = datetime.now(timezone.utc)
        expire = now + timedelta(minutes=settings.access_token_expire_minutes)
        roles = ["System Admin"] if user.is_superadmin else ["Org Admin"]
        permissions = (
            ["admin:*"]
            if user.is_superadmin
            else ["org_setup:read", "org_setup:write", "web:read", "web:write"]
        )
        claims = {
            "sub": user.id,
            "email": user.email,
            "tenant_id": user.tenant_id,
            "is_superadmin": user.is_superadmin,
            "roles": roles,
            "permissions": permissions,
            "iss": settings.jwt_issuer,
            "aud": settings.jwt_audience,
            "iat": now,
            "exp": expire,
        }
        return jwt.encode(claims, settings.jwt_secret, algorithm=settings.jwt_algorithm)

    @staticmethod
    def _serialize(user: User) -> dict:
        return {
            "id": user.id,
            "email": user.email,
            "display_name": user.display_name,
            "tenant_id": user.tenant_id,
            "status": user.status,
            "is_superadmin": user.is_superadmin,
            "roles": ["System Admin"] if user.is_superadmin else [],
            "permissions": ["admin:*"] if user.is_superadmin else [],
        }
