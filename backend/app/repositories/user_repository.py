from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import get_password_hash

class UserRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(
            User.email == email,
            User.is_active == True
        ).first()
    
    def create(self, email: str, password: str, organization_id: int, **kwargs) -> User:
        user = User(
            email=email,
            password_hash=get_password_hash(password),
            organization_id=organization_id,
            **kwargs
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user