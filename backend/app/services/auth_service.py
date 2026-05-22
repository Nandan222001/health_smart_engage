from sqlalchemy.orm import Session
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.user_repository import UserRepository
from app.core.security import verify_password, create_access_token
from app.schemas.auth import TokenData
from datetime import timedelta
from app.core.config import settings
from uuid import uuid4  # For generating operation ID

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.org_repo = OrganizationRepository(db)
        self.user_repo = UserRepository(db)
    
    def register_organization(self, email: str, password: str, organization_code: str, name: str = None):
        # Check if org already exists
        existing_org = self.org_repo.get_by_email(email)
        if existing_org:
            raise ValueError("Organization with this email already exists")
        
        # Check if org code is taken
        existing_code = self.org_repo.get_by_code(organization_code)
        if existing_code:
            raise ValueError("Organization code already taken")
        
        # Create organization
        org = self.org_repo.create(email, password, organization_code, name)
        
        # Generate token with roles and permissions
        token_data = TokenData(
            sub=str(org.id),
            email=org.email,
            user_type="organization",
            user_id=org.id,
            organization_id=org.id,
            roles=["Organization Admin"],
            permissions=["org:*", "user:manage", "settings:manage"]
        )
        
        access_token = create_access_token(
            token_data.dict(exclude_none=True),
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
        )
        
        # Return data in your app's expected format
        return {
            "operation": "auth_register",
            "group": "shared",
            "recordId": str(uuid4()),
            "status": "created",
            "data": {
                "access_token": access_token,
                "token_type": "bearer",
                "user_type": "organization",
                "email": org.email,
                "organization_code": org.organization_code,
                "organization_id": org.id,
                "expires_in": settings.access_token_expire_minutes
            }
        }
    
    def login(self, email: str, password: str):
        # First check organization table
        org = self.org_repo.get_by_email(email)
        if org and verify_password(password, org.password_hash):
            token_data = TokenData(
                sub=str(org.id),
                email=org.email,
                user_type="organization",
                user_id=org.id,
                organization_id=org.id,
                roles=["Organization Admin"],
                permissions=["org:*", "user:manage", "settings:manage"]
            )
            
            access_token = create_access_token(
                token_data.dict(exclude_none=True),
                expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
            )
            
            # Return data in your app's expected format
            return {
                "operation": "auth_login",
                "group": "shared",
                "recordId": str(uuid4()),
                "status": "accepted",
                "data": {
                    "access_token": access_token,
                    "token_type": "bearer",
                    "user_type": "organization",
                    "email": org.email,
                    "organization_code": org.organization_code,
                    "organization_id": org.id,
                    "expires_in": settings.access_token_expire_minutes
                }
            }
        
        # If not found in organization, check user table
        user = self.user_repo.get_by_email(email)
        if user and verify_password(password, user.password_hash):
            from app.models.organization import Organization
            org = self.db.query(Organization).filter(Organization.id == user.organization_id).first()
            
            token_data = TokenData(
                sub=str(user.id),
                email=user.email,
                user_type="user",
                user_id=user.id,
                organization_id=user.organization_id,
                roles=["User"],
                permissions=["profile:read", "profile:write"]
            )
            
            access_token = create_access_token(
                token_data.dict(exclude_none=True),
                expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
            )
            
            # Return data in your app's expected format
            return {
                "operation": "auth_login",
                "group": "shared",
                "recordId": str(uuid4()),
                "status": "accepted",
                "data": {
                    "access_token": access_token,
                    "token_type": "bearer",
                    "user_type": "user",
                    "email": user.email,
                    "organization_code": org.organization_code if org else None,
                    "organization_id": user.organization_id,
                    "user_id": user.id,
                    "expires_in": settings.access_token_expire_minutes
                }
            }
        
        raise ValueError("Invalid email or password")