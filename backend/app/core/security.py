from dataclasses import dataclass, field
from typing import Annotated, Generator

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db

security_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    user_id: str
    tenant_id: str
    roles: tuple[str, ...] = field(default_factory=tuple)
    permissions: tuple[str, ...] = field(default_factory=tuple)

    def has_any_role(self, allowed_roles: set[str]) -> bool:
        return bool(set(self.roles).intersection(allowed_roles))

    def has_permission(self, permission: str) -> bool:
        return permission in self.permissions or "admin:*" in self.permissions


def _resolve_tenant_by_email(db: Session, email: str) -> str | None:
    """In local/dev mode only — look up a user's tenant_id by email."""
    from sqlalchemy import select as _sel
    from app.models.auth import User as _User
    from app.models.invitations import OrgInvitation as _Inv

    email_lc = email.strip().lower()
    user = db.scalars(_sel(_User).where(_User.email == email_lc)).first()
    if user and user.tenant_id:
        return user.tenant_id
    inv = db.scalars(
        _sel(_Inv)
        .where(_Inv.admin_email == email_lc)
        .where(_Inv.tenant_id.isnot(None))
    ).first()
    if inv and inv.tenant_id:
        return inv.tenant_id
    return None


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)],
    tenant_id: Annotated[str | None, Header(alias="X-Tenant-Id")] = None,
    user_email: Annotated[str | None, Header(alias="X-User-Email")] = None,
    user_role: Annotated[str | None, Header(alias="X-User-Role")] = None,
    db: Annotated[Session, Depends(get_db)] = None,
) -> CurrentUser:
    is_local = settings.app_env == "local"

    # In local mode, if X-Tenant-Id is missing but we have an email, resolve the
    # tenant from the DB so Firebase-authenticated users see their own org's data.
    resolved_tid = tenant_id
    if is_local and not resolved_tid and user_email and db:
        resolved_tid = _resolve_tenant_by_email(db, user_email)

    if credentials is None:
        if not is_local:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing bearer token",
            )
        return _local_fallback(resolved_tid, user_email, user_role)

    token = credentials.credentials
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid bearer token",
        )

    try:
        claims = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer,
        )
    except JWTError:
        # In local env a Firebase token (or any non-backend token) may arrive.
        # Fall back to the custom identity headers that baseApi always sends.
        if is_local and (resolved_tid or user_email):
            return _local_fallback(resolved_tid, user_email, user_role)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid bearer token",
        )

    roles_claim = claims.get("roles", [])
    permissions_claim = claims.get("permissions", [])
    if isinstance(roles_claim, str):
        roles_claim = [roles_claim]
    if isinstance(permissions_claim, str):
        permissions_claim = [permissions_claim]

    # JWT claim is authoritative when present — it was signed at login time
    # and reflects the user's real tenant. Only fall back to the header/email
    # lookup if the JWT itself carries no tenant_id.
    jwt_tid = claims.get("tenant_id")
    effective_tid = jwt_tid or resolved_tid or "default-tenant"

    return CurrentUser(
        user_id=str(claims.get("sub")),
        tenant_id=str(effective_tid),
        roles=tuple(roles_claim),
        permissions=tuple(permissions_claim),
    )


def _local_fallback(tenant_id: str | None, user_email: str | None, user_role: str | None) -> CurrentUser:
    """Dev/local fallback identity derived from custom request headers."""
    role = (user_role or "Admin").strip()
    if role in ("System Admin", "Admin"):
        roles = (role,)
        permissions = ("admin:*",)
    else:
        roles = (role,)
        permissions = ("web:read", "web:write", "web:approve",
                       "admin:read", "admin:write",
                       "permits:write", "permits:approve",
                       "audit:write", "capa:write",
                       "reports:export", "vendors:read", "vendors:write",
                       "assets:write", "training:write",
                       "knowledge:write", "incidents:confidential")
    return CurrentUser(
        user_id=user_email or "local-dev-user",
        tenant_id=tenant_id or "local-tenant",
        roles=roles,
        permissions=permissions,
    )
