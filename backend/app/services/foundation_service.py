from typing import Any
from sqlalchemy.orm import Session
from app.core.security import CurrentUser
from app.models.domain import OrganisationNode, User, Role
from app.repositories.domain_repository import DomainRepository
from app.core.exceptions import AppError
import uuid

class FoundationService:
    def __init__(self, db: Session):
        self.repo = DomainRepository(db)
        self.db = db

    # Organisation
    def list_organisation_nodes(self, user: CurrentUser, filters: dict = None) -> list[OrganisationNode]:
        return self.repo.list(OrganisationNode, user.tenant_id, filters)

    def create_organisation_node(self, user: CurrentUser, data: dict) -> OrganisationNode:
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        return self.repo.create(OrganisationNode, user.tenant_id, data)

    def update_organisation_node(self, user: CurrentUser, node_id: str, data: dict) -> OrganisationNode:
        return self.repo.update(OrganisationNode, user.tenant_id, node_id, data)

    # Users
    def list_users(self, user: CurrentUser, filters: dict = None) -> list[User]:
        return self.repo.list(User, user.tenant_id, filters)

    def invite_user(self, user: CurrentUser, data: dict) -> User:
        data["status"] = "invited"
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        return self.repo.create(User, user.tenant_id, data)

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
