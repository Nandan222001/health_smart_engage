from fastapi import HTTPException, status

from app.core.security import CurrentUser


ROLE_PERMISSIONS: dict[str, set[str]] = {
    "System Admin": {"admin:*"},
    # Org-level admin (created by super admin via invitation)
    "Admin": {
        "admin:read", "admin:write",
        "web:read", "web:write", "web:approve",
        "permits:write", "permits:approve",
        "audit:write", "capa:write",
        "reports:export",
        "vendors:read", "vendors:write",
        "assets:write", "training:write",
        "knowledge:write", "incidents:confidential",
        "ai:read", "ai:write",
    },
    "IT Admin": {"admin:read", "admin:write", "integrations:write", "shared:read"},
    "Safety Manager": {"web:write", "mobile:write", "ai:read", "ai:write", "reports:export"},
    "Compliance Manager": {"web:write", "reports:export", "audit:write", "capa:write"},
    "Plant Manager": {"web:read", "web:approve", "reports:export"},
    "HR Admin": {"people:write", "training:write", "web:read"},
    "Training Coordinator": {"training:write", "web:read", "mobile:write"},
    "Procurement Manager": {"vendors:write", "web:read"},
    "Maintenance Manager": {"assets:write", "web:read", "mobile:write"},
    "Permit Coordinator": {"permits:write", "web:approve"},
    "Permit Approver": {"permits:approve", "mobile:approve", "web:approve"},
    "Safety Auditor": {"audit:write", "mobile:write", "web:read"},
    "CAPA Owner": {"capa:write", "mobile:write"},
    "Document Controller": {"knowledge:write", "ai:read"},
    "Employee": {"mobile:write", "knowledge:read", "ai:read"},
    "Contractor": {"mobile:write", "knowledge:read"},
    "Gate Security Officer": {"vendors:read", "mobile:scan"},
    "Legal / HR Officer": {"incidents:confidential", "web:read"},
    "Authenticated User": {"shared:read"},
}


def permissions_for_user(user: CurrentUser) -> set[str]:
    permissions = set(user.permissions)
    for role in user.roles:
        permissions.update(ROLE_PERMISSIONS.get(role, set()))
    return permissions


def infer_required_permission(group: str, operation: str, method: str) -> str:
    if group == "admin":
        return "admin:write" if method != "GET" else "admin:read"
    if group == "org_setup" or group == "org_admin":
        return "web:write" if method != "GET" else "web:read"
    if group == "integrations":
        return "integrations:write" if method != "GET" else "integrations:read"
    if group == "ai":
        return "ai:write" if method != "GET" else "ai:read"
    if "permit" in operation:
        if "approve" in operation:
            return "permits:approve"
        return "permits:write" if method != "GET" else "web:read"
    if "incident" in operation:
        if "confidential" in operation:
            return "incidents:confidential"
        return "mobile:write" if group == "mobile" and method != "GET" else "web:read"
    if "vendor" in operation or "contractor" in operation:
        if "scan" in operation:
            return "mobile:scan"
        return "vendors:write" if method != "GET" else "vendors:read"
    if "asset" in operation:
        return "assets:write" if method != "GET" else "web:read"
    if "training" in operation or "employee" in operation:
        return "training:write" if method != "GET" else "web:read"
    if "audit" in operation:
        return "audit:write" if method != "GET" else "web:read"
    if "capa" in operation:
        return "capa:write" if method != "GET" else "web:read"
    if "knowledge" in operation:
        return "knowledge:write" if method != "GET" else "knowledge:read"
    if method != "GET":
        return f"{group}:write"
    return f"{group}:read"


def enforce_permission(user: CurrentUser, required: str) -> None:
    effective = permissions_for_user(user)
    if "admin:*" in effective or required in effective:
        return
    prefix = required.split(":", 1)[0]
    if f"{prefix}:write" in effective and required.endswith(":read"):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Missing required permission: {required}",
    )
