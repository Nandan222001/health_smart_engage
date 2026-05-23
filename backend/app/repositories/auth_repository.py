from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository
from app.models.auth import User


class AuthRepository(BaseRepository[User]):
    def __init__(self, db: Session):
        super().__init__(db, User)

    def find_by_email(self, email: str) -> User | None:
        return self.db.scalars(
            select(User).where(User.email == email)
        ).first()

    def find_by_email_and_tenant(self, email: str, tenant_id: str) -> User | None:
        return self.db.scalars(
            select(User).where(User.email == email, User.tenant_id == tenant_id)
        ).first()

    def list_by_tenant(self, tenant_id: str, filters: dict = None) -> list[User]:
        stmt = select(User).where(User.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(User, k) and v is not None:
                    stmt = stmt.where(getattr(User, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_by_tenant(self, tenant_id: str, user_id: str) -> User | None:
        return self.db.scalars(
            select(User).where(User.tenant_id == tenant_id, User.id == user_id)
        ).first()
