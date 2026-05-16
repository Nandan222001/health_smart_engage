from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.repositories.base import BaseRepository


class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self, db: Session):
        super().__init__(db, AuditLog)

    def record(
        self,
        tenant_id: str,
        actor_user_id: str,
        action: str,
        resource_type: str,
        resource_id: str | None,
        details: dict,
    ) -> AuditLog:
        event = AuditLog(
            id=str(uuid4()),
            tenant_id=tenant_id,
            actor_user_id=actor_user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
        )
        return self.add(event)
