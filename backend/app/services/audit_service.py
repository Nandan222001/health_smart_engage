from sqlalchemy.orm import Session

from app.core.security import CurrentUser
from app.repositories.audit_log_repository import AuditLogRepository


class AuditService:
    def __init__(self, db: Session):
        self.audit_logs = AuditLogRepository(db)

    def record_action(
        self,
        user: CurrentUser,
        action: str,
        resource_type: str,
        resource_id: str | None,
        details: dict,
    ) -> None:
        self.audit_logs.record(
            tenant_id=user.tenant_id,
            actor_user_id=user.user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
        )
