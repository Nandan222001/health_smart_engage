from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.auth_service import AuthService
from app.schemas.auth import OrganizationRegisterRequest, LoginRequest
from app.helpers.response import ok, accepted  # Import your response helpers

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register")
def register_organization(
    request: OrganizationRegisterRequest,
    db: Session = Depends(get_db)
):
    """Register a new organization"""
    try:
        auth_service = AuthService(db)
        result = auth_service.register_organization(
            email=request.email,
            password=request.password,
            organization_code=request.organization_code,
            name=request.name
        )
        # Use your 'ok' helper with status code 201 for creation
        return ok(
            data=result["data"],
            message="Organization registered successfully",
            operation=result["operation"],
            group=result["group"],
            record_id=result["recordId"],
            status_code=status.HTTP_201_CREATED
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    """Login for both organization and user accounts"""
    try:
        auth_service = AuthService(db)
        result = auth_service.login(
            email=request.email,
            password=request.password
        )
        # Return raw token payload directly for login
        return result["data"]
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )