from sqlalchemy.orm import Session
from app.models.organization import Organization
from app.core.security import get_password_hash

class OrganizationRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, email: str, password: str, organization_code: str, name: str = None) -> Organization:
        org = Organization(
            email=email,
            password_hash=get_password_hash(password),
            organization_code=organization_code,
            name=name
        )
        self.db.add(org)
        self.db.commit()
        self.db.refresh(org)
        return org
    
    def get_by_email(self, email: str) -> Organization | None:
        return self.db.query(Organization).filter(
            Organization.email == email,
            Organization.is_active == True
        ).first()
    
    def get_by_code(self, code: str) -> Organization | None:
        return self.db.query(Organization).filter(
            Organization.organization_code == code,
            Organization.is_active == True
        ).first()