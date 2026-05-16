import pytest
from fastapi import HTTPException

from app.core.rbac import enforce_permission, infer_required_permission, permissions_for_user
from app.core.security import CurrentUser


def test_system_admin_has_admin_permissions() -> None:
    user = CurrentUser(user_id="u1", tenant_id="t1", roles=("System Admin",), permissions=())

    assert "admin:*" in permissions_for_user(user)
    enforce_permission(user, "permits:approve")


def test_missing_permission_raises_403() -> None:
    user = CurrentUser(user_id="u1", tenant_id="t1", roles=("Employee",), permissions=())

    with pytest.raises(HTTPException) as exc:
        enforce_permission(user, "admin:write")

    assert exc.value.status_code == 403


def test_infer_permit_approval_permission() -> None:
    assert infer_required_permission("web", "permits_approve", "POST") == "permits:approve"
