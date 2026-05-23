from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import CurrentUser, get_current_user
from app.services.organization_details_service import OrganizationDetailsService
from app.schemas.organization_details import (
    OrganizationDetailsCreateRequest,
    OrganizationDetailsResponse,
    OrganizationDetailsUpdateRequest,
)
from app.helpers.response import ok
from app.api.v1.dependencies import get_pagination

router = APIRouter(prefix="/organization-details", tags=["organization-details"])


def get_service(db: Annotated[Session, Depends(get_db)]) -> OrganizationDetailsService:
    return OrganizationDetailsService(db)


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_organization_details(
    request: OrganizationDetailsCreateRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    service: Annotated[OrganizationDetailsService, Depends(get_service)],
):
    try:
        details = service.create(current_user, request.model_dump())
        return ok(data=OrganizationDetailsResponse.model_validate(details).model_dump(), message="Organization details created")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("", response_model=dict)
def list_organization_details(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    service: Annotated[OrganizationDetailsService, Depends(get_service)],
    pagination: Annotated[object, Depends(get_pagination)],
    organization_id: int | None = Query(default=None, alias="organizationId"),
):
    items, total = service.list(page=pagination.page, page_size=pagination.page_size, organization_id=organization_id)
    return ok(data={
        "items": [OrganizationDetailsResponse.model_validate(item).model_dump() for item in items],
        "total": total,
        "page": pagination.page,
        "pageSize": pagination.page_size,
        "organizationId": organization_id,
    })


@router.get("/{details_id}", response_model=dict)
def get_organization_details(
    details_id: int,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    service: Annotated[OrganizationDetailsService, Depends(get_service)],
):
    details = service.get(details_id)
    if not details:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization details not found")
    return ok(data=OrganizationDetailsResponse.model_validate(details).model_dump())


@router.patch("/{details_id}", response_model=dict)
def update_organization_details(
    details_id: int,
    request: OrganizationDetailsUpdateRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    service: Annotated[OrganizationDetailsService, Depends(get_service)],
):
    details = service.update(current_user, details_id, request.model_dump(exclude_none=True))
    if not details:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization details not found")
    return ok(data=OrganizationDetailsResponse.model_validate(details).model_dump(), message="Organization details updated")


@router.delete("/{details_id}", response_model=dict)
def delete_organization_details(
    details_id: int,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    service: Annotated[OrganizationDetailsService, Depends(get_service)],
):
    details = service.soft_delete(current_user, details_id)
    if not details:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization details not found")
    return ok(message="Organization details soft deleted")
