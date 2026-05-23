from sqlalchemy.orm import Session
from app.models.super_admin import SuperAdmin
from app.core.security import get_password_hash


class SuperAdminRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> SuperAdmin | None:
        return self.db.query(SuperAdmin).filter(
            SuperAdmin.email == email
        ).first()

    def create(self, name: str, email: str, password: str) -> SuperAdmin:
        super_admin = SuperAdmin(
            name=name,
            email=email,
            password_hash=get_password_hash(password),
        )
        self.db.add(super_admin)
        self.db.commit()
        self.db.refresh(super_admin)
        return super_admin
