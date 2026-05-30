from fastapi import APIRouter
from app.api.v1.route_factory import register_catalog_routes

router = APIRouter()

# ─── Foundation Endpoints ───────────────────────────────────────────────────
# These routes use the Catalog pattern (Group: foundation)
# Permissions will be inferred as foundation:read, foundation:write, etc.

ENDPOINTS = [
    # Organisation Nodes (Business Units, Sites, Departments)
    ("GET",    "/org-nodes",             "foundation_org_nodes_list",   "List organisation nodes"),
    ("POST",   "/org-nodes",             "foundation_org_nodes_create", "Create organisation node"),
    ("GET",    "/org-nodes/{nodeId}",    "foundation_org_nodes_get",    "Get organisation node"),
    ("PATCH",  "/org-nodes/{nodeId}",    "foundation_org_nodes_update", "Update organisation node"),
    ("DELETE", "/org-nodes/{nodeId}",    "foundation_org_nodes_delete", "Delete organisation node"),

    # Users
    ("GET",    "/users",                 "foundation_users_list",       "List users"),
    ("POST",   "/users",                 "foundation_users_create",     "Create user"),
    ("GET",    "/users/{userId}",        "foundation_users_get",        "Get user"),
    ("PATCH",  "/users/{userId}",        "foundation_users_update",     "Update user"),
    ("DELETE", "/users/{userId}",        "foundation_users_delete",     "Delete user"),

    # Roles
    ("GET",    "/roles",                 "foundation_roles_list",       "List roles"),
    ("POST",   "/roles",                 "foundation_roles_create",     "Create role"),
    ("GET",    "/roles/{roleId}",        "foundation_roles_get",        "Get role"),
    ("PATCH",  "/roles/{roleId}",        "foundation_roles_update",     "Update role"),
    ("DELETE", "/roles/{roleId}",        "foundation_roles_delete",     "Delete role"),
]

register_catalog_routes(router, "foundation", ENDPOINTS)
