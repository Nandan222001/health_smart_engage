from typing import Any

from app.core.security import CurrentUser
from app.helpers.pagination import PaginationParams
from app.helpers.response import accepted, ok
from app.services.catalog_service import CatalogEndpointService


class CatalogController:
    def __init__(self, service: CatalogEndpointService):
        self.service = service

    def query(
        self,
        user: CurrentUser,
        group: str,
        operation: str,
        pagination: PaginationParams,
        path_params: dict[str, Any],
        method: str = "GET",
    ) -> dict:
        data = self.service.query(
            user=user,
            group=group,
            operation=operation,
            pagination=pagination,
            path_params=path_params,
            method=method,
        )
        return ok(data)

    def command(
        self,
        user: CurrentUser,
        group: str,
        operation: str,
        payload: dict[str, Any],
        path_params: dict[str, Any],
        method: str = "POST",
    ) -> dict:
        data = self.service.command(
            user=user,
            group=group,
            operation=operation,
            payload=payload,
            path_params=path_params,
            method=method,
        )
        return accepted(data)
