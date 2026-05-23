from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_super_admin, CurrentUser
from app.services.auth_service import AuthService
from app.schemas.auth import OrganizationRegisterRequest, LoginRequest
from app.helpers.response import ok

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register")
def register_organization(
    request: OrganizationRegisterRequest,
    current_user: CurrentUser = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Super admin creates a new organization and its initial organization admin account"""
    try:
        auth_service = AuthService(db)
        result = auth_service.register_organization(
            email=request.email,
            password=request.password,
            organization_code=request.organization_code,
            name=request.name,
            organization_name=request.organization_name,
            country=request.country,
            industry_type=request.industry_type,
            sites=request.sites,
            logo_url=request.logo_url,
        )
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

@router.post("/super-admin/login")
def super_admin_login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    """Login for the system super admin account"""
    try:
        auth_service = AuthService(db)
        result = auth_service.login_super_admin(
            email=request.email,
            password=request.password
        )
        return result["data"]
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
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