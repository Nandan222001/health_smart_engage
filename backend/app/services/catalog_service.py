import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.core.security import CurrentUser
from app.core.rbac import enforce_permission, infer_required_permission
from app.helpers.pagination import PaginationParams
from app.services.audit_service import AuditService
from app.services.business_rules import BusinessRuleService
from app.services.domain_dispatcher import DomainDispatcher


class CatalogEndpointService:
    """Dispatches catalog-defined routes through RBAC, business rules, domain actions, and audit."""

    def __init__(self, db: Session):
        self.audit = AuditService(db)
        self.rules = BusinessRuleService(db)
        self.dispatcher = DomainDispatcher()
        self.db = db

    def query(
        self,
        user: CurrentUser,
        group: str,
        operation: str,
        pagination: PaginationParams,
        path_params: dict[str, Any],
        method: str = "GET",
    ) -> dict[str, Any]:
        enforce_permission(user, infer_required_permission(group, operation, method))
        special = self.dispatcher.execute_special_query(user, operation, path_params, db=self.db)
        self.audit.record_action(
            user=user,
            action=f"{group}.{operation}.query",
            resource_type=operation,
            resource_id=next(iter(path_params.values()), None),
            details={"pathParams": path_params},
        )
        self.db.commit()
        if special is not None:
            return special
        return {
            "operation": operation,
            "group": group,
            "pathParams": path_params,
            "items": [],
            "page": pagination.page,
            "pageSize": pagination.page_size,
        }

    def command(
        self,
        user: CurrentUser,
        group: str,
        operation: str,
        payload: dict[str, Any],
        path_params: dict[str, Any],
        method: str = "POST",
    ) -> dict[str, Any]:
        enforce_permission(user, infer_required_permission(group, operation, method))
        self.rules.validate_command(user, operation, payload, path_params)
        special = self.dispatcher.execute_special_command(user, operation, payload, path_params, db=self.db)
        record_id = (special or {}).get("id") or str(uuid.uuid4())
        self.audit.record_action(
            user=user,
            action=f"{group}.{operation}.command",
            resource_type=operation,
            resource_id=record_id,
            details={"pathParams": path_params},
        )
        self.db.commit()
        if special is not None:
            special.setdefault("recordId", record_id)
            special.setdefault("status", "accepted")
            return special
        return {
            "operation": operation,
            "group": group,
            "recordId": record_id,
            "status": "accepted",
        }
