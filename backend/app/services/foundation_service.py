import secrets
import string
import uuid
from typing import Any

import bcrypt as _bcrypt
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.core.security import CurrentUser
from app.models.domain import OrganisationNode, User, Role
from app.repositories.domain_repository import DomainRepository
from app.services.email_service import send_user_invitation_email


def _generate_password() -> str:
    chars = string.ascii_letters + string.digits
    return "Hse@" + "".join(secrets.choice(chars) for _ in range(8))


def _hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()


class FoundationService:
    def __init__(self, db: Session):
        self.repo = DomainRepository(db)
        self.db = db

    # Organisation
    def list_organisation_nodes(self, user: CurrentUser, filters: dict = None) -> list[OrganisationNode]:
        return self.repo.list(OrganisationNode, user.tenant_id, filters)

    def create_organisation_node(self, user: CurrentUser, data: dict) -> OrganisationNode:
        payload = {k: v for k, v in data.items()}
        payload.setdefault("id", str(uuid.uuid4()))
        # Frontend sends "type"; model column is "node_type"
        if "type" in payload and "node_type" not in payload:
            payload["node_type"] = payload.pop("type")
        payload.setdefault("node_type", "site")
        return self.repo.create(OrganisationNode, user.tenant_id, payload)

    def update_organisation_node(self, user: CurrentUser, node_id: str, data: dict) -> OrganisationNode:
        return self.repo.update(OrganisationNode, user.tenant_id, node_id, data)

    # Users
    def list_users(self, user: CurrentUser, filters: dict = None) -> list[User]:
        return self.repo.list(User, user.tenant_id, filters)

    def invite_user(self, user: CurrentUser, data: dict) -> User:
        if not data.get("email"):
            raise AppError("VALIDATION_ERROR", "email is required", 400)

        # Generate login credentials
        password = _generate_password()

        payload = {k: v for k, v in data.items()}
        payload["status"] = "invited"
        payload.setdefault("id", str(uuid.uuid4()))
        payload["password_hash"] = _hash_password(password)

        # Normalise "name" → "display_name" (frontend sends "name")
        if "name" in payload and "display_name" not in payload:
            payload["display_name"] = payload.pop("name")
        payload.setdefault("display_name", payload.get("email", "User"))

        # Capture role for email; keep it in payload so it's stored on the user record
        role_label = str(payload.get("role", "") or payload.get("roles", "") or "Team Member")
        if "roles" in payload:
            payload.pop("roles")  # normalise multi-value field; role is already set
        site_label = str(payload.pop("site", "") or "")

        created_user = self.repo.create(User, user.tenant_id, payload)

        # Send invitation email with generated credentials
        send_user_invitation_email(
            user_email=created_user.email,
            user_name=created_user.display_name,
            role=role_label,
            site=site_label,
            password=password,
        )

        return created_user

    def revoke_user(self, user: CurrentUser, user_id: str) -> User:
        return self.repo.update(User, user.tenant_id, user_id, {"status": "revoked"})

    # Roles
    def list_roles(self, user: CurrentUser, filters: dict = None) -> list[Role]:
        return self.repo.list(Role, user.tenant_id, filters)

    def create_role(self, user: CurrentUser, data: dict) -> Role:
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        return self.repo.create(Role, user.tenant_id, data)

    def update_role(self, user: CurrentUser, role_id: str, data: dict) -> Role:
        return self.repo.update(Role, user.tenant_id, role_id, data)
