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
        # If the service returned an auth token payload, return it directly.
        # Support both direct payload and wrapped payload under a "data" key.
        if isinstance(data, dict):
            if "access_token" in data and "token_type" in data:
                return data
            if "data" in data and isinstance(data["data"], dict) and "access_token" in data["data"]:
                return data["data"]
        return accepted(data)
