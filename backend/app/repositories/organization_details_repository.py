from datetime import datetime
from sqlalchemy.orm import Session
from app.models.organization_details import OrganizationDetails


class OrganizationDetailsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, details_id: int) -> OrganizationDetails | None:
        return (
            self.db.query(OrganizationDetails)
            .filter(OrganizationDetails.id == details_id, OrganizationDetails.deleted_at.is_(None))
            .first()
        )

    def list(self, limit: int = 25, offset: int = 0, organization_id: int | None = None) -> list[OrganizationDetails]:
        query = self.db.query(OrganizationDetails).filter(OrganizationDetails.deleted_at.is_(None))
        if organization_id is not None:
            query = query.filter(OrganizationDetails.organization_id == organization_id)
        return (
            query.order_by(OrganizationDetails.id.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )

    def count(self, organization_id: int | None = None) -> int:
        query = self.db.query(OrganizationDetails).filter(OrganizationDetails.deleted_at.is_(None))
        if organization_id is not None:
            query = query.filter(OrganizationDetails.organization_id == organization_id)
        return query.count()

    def create(self, payload: dict) -> OrganizationDetails:
        details = OrganizationDetails(**payload)
        self.db.add(details)
        self.db.commit()
        self.db.refresh(details)
        return details

    def update(self, details_id: int, payload: dict) -> OrganizationDetails | None:
        details = self.get(details_id)
        if not details:
            return None
        for key, value in payload.items():
            setattr(details, key, value)
        details.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(details)
        return details

    def soft_delete(self, details_id: int, deleted_at: datetime) -> OrganizationDetails | None:
        details = self.get(details_id)
        if not details:
            return None
        details.deleted_at = deleted_at
        self.db.commit()
        self.db.refresh(details)
        return details
