from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.route_factory import register_catalog_routes
from app.controllers.foundation_controller import FoundationController
from app.core.database import get_db
from app.services.foundation_service import FoundationService

router = APIRouter()


def get_controller(db: Session = Depends(get_db)) -> FoundationController:
    service = FoundationService(db)
    return FoundationController(service)


# ─── Foundation Endpoints ───────────────────────────────────────────────────

ENDPOINTS = [
    # Organisation Nodes (Business Units, Sites, Departments)
    ("GET",    "/org-nodes",      "foundation_org_nodes_list",   "List organisation nodes"),
    ("POST",   "/org-nodes",      "foundation_org_nodes_create", "Create organisation node"),
    ("GET",    "/org-nodes/{node_id}", "foundation_org_nodes_get",    "Get organisation node"),
    ("PATCH",  "/org-nodes/{node_id}", "foundation_org_nodes_update", "Update organisation node"),
    ("DELETE", "/org-nodes/{node_id}", "foundation_org_nodes_delete", "Delete organisation node"),

    # Users
    ("GET",    "/users",          "foundation_users_list",       "List users"),
    ("POST",   "/users",          "foundation_users_create",     "Create user"),
    ("GET",    "/users/{user_id}", "foundation_users_get",        "Get user"),
    ("PATCH",  "/users/{user_id}", "foundation_users_update",     "Update user"),
    ("DELETE", "/users/{user_id}", "foundation_users_delete",     "Delete user"),

    # Roles
    ("GET",    "/roles",          "foundation_roles_list",       "List roles"),
    ("POST",   "/roles",          "foundation_roles_create",     "Create role"),
    ("GET",    "/roles/{role_id}", "foundation_roles_get",        "Get role"),
    ("PATCH",  "/roles/{role_id}", "foundation_roles_update",     "Update role"),
    ("DELETE", "/roles/{role_id}", "foundation_roles_delete",     "Delete role"),
]

register_catalog_routes(router, "web", ENDPOINTS, controller_getter=get_controller)
