from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository
from app.models.foundation import OrganisationNode
from app.models.auth import User, Role


class FoundationRepository(BaseRepository[OrganisationNode]):
    def __init__(self, db: Session):
        super().__init__(db, OrganisationNode)

    def list_nodes(self, tenant_id: str, filters: dict = None) -> list[OrganisationNode]:
        stmt = select(OrganisationNode).where(OrganisationNode.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(OrganisationNode, k) and v is not None:
                    stmt = stmt.where(getattr(OrganisationNode, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_node(self, tenant_id: str, node_id: str) -> OrganisationNode | None:
        return self.db.scalars(
            select(OrganisationNode).where(
                OrganisationNode.tenant_id == tenant_id,
                OrganisationNode.id == node_id,
            )
        ).first()

    def list_users(self, tenant_id: str, filters: dict = None) -> list[User]:
        stmt = select(User).where(User.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(User, k) and v is not None:
                    stmt = stmt.where(getattr(User, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_user(self, tenant_id: str, user_id: str) -> User | None:
        return self.db.scalars(
            select(User).where(User.tenant_id == tenant_id, User.id == user_id)
        ).first()

    def list_roles(self, tenant_id: str, filters: dict = None) -> list[Role]:
        stmt = select(Role).where(Role.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(Role, k) and v is not None:
                    stmt = stmt.where(getattr(Role, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_role(self, tenant_id: str, role_id: str) -> Role | None:
        return self.db.scalars(
            select(Role).where(Role.tenant_id == tenant_id, Role.id == role_id)
        ).first()
