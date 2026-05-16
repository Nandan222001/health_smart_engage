from dataclasses import dataclass, field
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import settings

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


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)],
    tenant_id: Annotated[str | None, Header(alias="X-Tenant-Id")] = None,
) -> CurrentUser:
    if credentials is None:
        if settings.app_env != "local":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing bearer token",
            )
        return CurrentUser(
            user_id="local-dev-user",
            tenant_id=tenant_id or "local-tenant",
            roles=("System Admin",),
            permissions=("admin:*",),
        )

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
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid bearer token",
        ) from exc

    roles_claim = claims.get("roles", [])
    permissions_claim = claims.get("permissions", [])
    if isinstance(roles_claim, str):
        roles_claim = [roles_claim]
    if isinstance(permissions_claim, str):
        permissions_claim = [permissions_claim]

    return CurrentUser(
        user_id=str(claims.get("sub")),
        tenant_id=tenant_id or str(claims.get("tenant_id", "default-tenant")),
        roles=tuple(roles_claim),
        permissions=tuple(permissions_claim),
    )
