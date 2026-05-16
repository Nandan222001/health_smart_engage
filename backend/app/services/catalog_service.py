from typing import Any

from sqlalchemy.orm import Session

from app.core.security import CurrentUser
from app.core.rbac import enforce_permission, infer_required_permission
from app.helpers.pagination import PaginationParams
from app.repositories.generic_repository import GenericRepository
from app.services.audit_service import AuditService
from app.services.business_rules import BusinessRuleService
from app.services.domain_dispatcher import DomainDispatcher


class CatalogEndpointService:
    """Dispatches catalog-defined routes through RBAC, business rules, domain actions, and audit."""

    def __init__(self, db: Session):
        self.records = GenericRepository(db)
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
        special = self.dispatcher.execute_special_query(user, operation, path_params)
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
        special = self.dispatcher.execute_special_command(user, operation, payload, path_params)
        record = self.records.create(
            tenant_id=user.tenant_id,
            module=group,
            record_type=operation,
            payload={"payload": payload, "pathParams": path_params},
            status="accepted",
        )
        self.audit.record_action(
            user=user,
            action=f"{group}.{operation}.command",
            resource_type=operation,
            resource_id=record.id,
            details={"pathParams": path_params},
        )
        self.db.commit()
        if special is not None:
            special["recordId"] = record.id
            special["status"] = record.status
            return special
        return {
            "operation": operation,
            "group": group,
            "recordId": record.id,
            "status": record.status,
        }
