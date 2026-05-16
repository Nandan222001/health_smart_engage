from typing import Annotated

from fastapi import Depends, Query
from sqlalchemy.orm import Session

from app.controllers.catalog_controller import CatalogController
from app.core.database import get_db
from app.helpers.pagination import PaginationParams
from app.services.catalog_service import CatalogEndpointService


def get_catalog_service(db: Annotated[Session, Depends(get_db)]) -> CatalogEndpointService:
    return CatalogEndpointService(db)


def get_catalog_controller(
    service: Annotated[CatalogEndpointService, Depends(get_catalog_service)],
) -> CatalogController:
    return CatalogController(service)


def get_pagination(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, alias="pageSize", ge=1, le=250),
    sort: str | None = Query(default=None),
    filter: str | None = Query(default=None),
) -> PaginationParams:
    return PaginationParams(page=page, page_size=page_size, sort=sort, filter=filter)
