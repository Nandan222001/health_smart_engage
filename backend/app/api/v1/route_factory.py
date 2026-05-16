from collections.abc import Callable
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request, status

from app.api.v1.dependencies import get_catalog_controller, get_pagination
from app.controllers.catalog_controller import CatalogController
from app.core.security import CurrentUser, get_current_user
from app.helpers.pagination import PaginationParams
from app.schemas.common import CommandPayload


EndpointDef = tuple[str, str, str, str]


def operation_id(method: str, path: str) -> str:
    clean = path.strip("/").replace("{", "by_").replace("}", "")
    for char in ["/", "-"]:
        clean = clean.replace(char, "_")
    return f"{method.lower()}_{clean}"


def extract_path_params(request: Request) -> dict[str, Any]:
    return dict(request.path_params)


def make_get_handler(group: str, operation: str, method: str) -> Callable:
    async def handler(
        request: Request,
        user: Annotated[CurrentUser, Depends(get_current_user)],
        controller: Annotated[CatalogController, Depends(get_catalog_controller)],
        pagination: Annotated[PaginationParams, Depends(get_pagination)],
    ) -> dict:
        return controller.query(
            user=user,
            group=group,
            operation=operation,
            pagination=pagination,
            path_params=extract_path_params(request),
            method=method,
        )

    return handler


def make_command_handler(group: str, operation: str, method: str) -> Callable:
    async def handler(
        request: Request,
        user: Annotated[CurrentUser, Depends(get_current_user)],
        controller: Annotated[CatalogController, Depends(get_catalog_controller)],
        payload: CommandPayload | None = None,
    ) -> dict:
        return controller.command(
            user=user,
            group=group,
            operation=operation,
            payload=payload.model_dump() if payload else {},
            path_params=extract_path_params(request),
            method=method,
        )

    return handler


def register_catalog_routes(router: APIRouter, group: str, endpoints: list[EndpointDef]) -> None:
    for method, path, name, summary in endpoints:
        handler = make_get_handler(group, name, method) if method == "GET" else make_command_handler(group, name, method)
        router.add_api_route(
            path=path,
            endpoint=handler,
            methods=[method],
            summary=summary,
            operation_id=operation_id(method, path),
            status_code=status.HTTP_200_OK if method == "GET" else status.HTTP_202_ACCEPTED,
        )
