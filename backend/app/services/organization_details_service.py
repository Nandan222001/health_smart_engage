from datetime import datetime
from sqlalchemy.orm import Session
from app.core.security import CurrentUser
from app.repositories.organization_details_repository import OrganizationDetailsRepository
from app.repositories.organization_repository import OrganizationRepository
from app.core.exceptions import AppError


def _parse_user_id(user: CurrentUser) -> int | None:
    if user is None:
        return None
    try:
        return int(user.user_id)
    except (TypeError, ValueError):
        return None


class OrganizationDetailsService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = OrganizationDetailsRepository(db)
        self.organization_repo = OrganizationRepository(db)

    def create(self, user: CurrentUser, payload: dict) -> dict:
        if not self.organization_repo.get_by_id(payload.get("organization_id")):
            raise AppError("Organization does not exist")

        payload["created_by"] = _parse_user_id(user)
        payload["updated_by"] = _parse_user_id(user)
        return self.repo.create(payload)

    def get(self, details_id: int) -> dict | None:
        return self.repo.get(details_id)

    def update(self, user: CurrentUser, details_id: int, payload: dict) -> dict | None:
        if "organization_id" in payload and not self.organization_repo.get_by_id(payload.get("organization_id")):
            raise AppError("Organization does not exist")

        payload["updated_by"] = _parse_user_id(user)
        return self.repo.update(details_id, payload)

    def soft_delete(self, user: CurrentUser, details_id: int) -> dict | None:
        return self.repo.soft_delete(details_id, datetime.utcnow())

    def list(self, page: int = 1, page_size: int = 25, organization_id: int | None = None) -> tuple[list[dict], int]:
        offset = max(page - 1, 0) * page_size
        items = self.repo.list(limit=page_size, offset=offset, organization_id=organization_id)
        total = self.repo.count(organization_id=organization_id)
        return items, total
