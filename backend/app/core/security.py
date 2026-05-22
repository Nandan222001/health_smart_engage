from dataclasses import dataclass, field
from typing import Annotated, Optional, Union
from datetime import datetime, timedelta

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.organization import Organization
from app.models.user import User

security_scheme = HTTPBearer(auto_error=False)
# Use pbkdf2_sha256 to avoid platform-specific bcrypt issues and the 72-byte limit.
# If you prefer bcrypt, ensure the correct `bcrypt` wheel is installed for your Python.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


@dataclass(frozen=True)
class CurrentUser:
    user_id: str
    tenant_id: str
    roles: tuple[str, ...] = field(default_factory=tuple)
    permissions: tuple[str, ...] = field(default_factory=tuple)
    user_type: str = "user"  # "organization" or "user"
    email: str = ""
    organization_id: Optional[str] = None

    def has_any_role(self, allowed_roles: set[str]) -> bool:
        return bool(set(self.roles).intersection(allowed_roles))

    def has_permission(self, permission: str) -> bool:
        return permission in self.permissions or "admin:*" in self.permissions


# Password utilities
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    # bcrypt has a 72-byte limit for the password; truncate safely to avoid errors.
    pw_bytes = password.encode("utf-8")
    if len(pw_bytes) > 72:
        # Truncate while preserving UTF-8 character boundaries.
        truncated = pw_bytes[:72]
        # If the last byte is a continuation byte (10xxxxxx), drop bytes until valid UTF-8.
        while True:
            try:
                safe_password = truncated.decode("utf-8")
                break
            except UnicodeDecodeError:
                truncated = truncated[:-1]
        return pwd_context.hash(safe_password)
    return pwd_context.hash(password)


# JWT utilities
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)],
    tenant_id: Annotated[str | None, Header(alias="X-Tenant-Id")] = None,
    db: Session = Depends(get_db),
) -> CurrentUser:
    # Local development mode
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
            user_type="user",
            email="local@example.com",
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

    # Extract claims from JWT
    user_type = claims.get("user_type", "user")
    email = claims.get("email", "")
    user_id = str(claims.get("user_id", claims.get("sub", "")))
    organization_id = claims.get("organization_id")
    
    roles_claim = claims.get("roles", [])
    permissions_claim = claims.get("permissions", [])
    
    if isinstance(roles_claim, str):
        roles_claim = [roles_claim]
    if isinstance(permissions_claim, str):
        permissions_claim = [permissions_claim]

    # For production, verify user still exists in database
    if settings.app_env != "local":
        if user_type == "organization":
            org = db.query(Organization).filter(
                Organization.id == int(user_id) if user_id.isdigit() else user_id,
                Organization.is_active == True
            ).first()
            if not org:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Organization no longer exists or is inactive",
                )
        else:
            user = db.query(User).filter(
                User.id == int(user_id) if user_id.isdigit() else user_id,
                User.is_active == True
            ).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User no longer exists or is inactive",
                )

    # Build default roles and permissions based on user_type
    default_roles = []
    default_permissions = []
    
    if user_type == "organization":
        default_roles = ["Organization Admin"]
        default_permissions = ["org:*", "user:manage", "settings:manage"]
    else:
        default_roles = ["User"]
        default_permissions = ["profile:read", "profile:write"]
    
    final_roles = roles_claim if roles_claim else default_roles
    final_permissions = permissions_claim if permissions_claim else default_permissions

    return CurrentUser(
        user_id=user_id,
        tenant_id=tenant_id or str(organization_id) or "default-tenant",
        roles=tuple(final_roles),
        permissions=tuple(final_permissions),
        user_type=user_type,
        email=email,
        organization_id=str(organization_id) if organization_id else None,
    )


def get_current_organization_admin(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> CurrentUser:
    """Dependency to ensure the current user is an organization admin"""
    if current_user.user_type != "organization":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization admins can access this resource",
        )
    return current_user


def get_current_active_user(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> CurrentUser:
    """Dependency to ensure the current user is an active regular user"""
    if current_user.user_type != "user":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only active users can access this resource",
        )
    return current_user