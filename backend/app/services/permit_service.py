from typing import Any
from sqlalchemy.orm import Session
from app.core.security import CurrentUser
from app.models.domain import Permit, PermitApproval
from app.repositories.domain_repository import DomainRepository
from app.core.exceptions import AppError
import uuid

class PermitService:
    def __init__(self, db: Session):
        self.repo = DomainRepository(db)
        self.db = db

    def list_permits(self, user: CurrentUser, filters: dict) -> list[Permit]:
        return self.repo.list(Permit, user.tenant_id, filters)

    def create_permit(self, user: CurrentUser, data: dict) -> Permit:
        permit_ref = f"PTW-{uuid.uuid4().hex[:8].upper()}"
        data["permit_ref"] = permit_ref
        data["requester_user_id"] = user.user_id
        data["status"] = "draft"
        return self.repo.create(Permit, user.tenant_id, data)

    def get_permit(self, user: CurrentUser, permit_id: str) -> Permit:
        permit = self.repo.get(Permit, user.tenant_id, permit_id)
        if not permit:
            raise AppError("PERMIT_NOT_FOUND", "Permit not found", 404)
        return permit

    def update_permit(self, user: CurrentUser, permit_id: str, data: dict) -> Permit:
        permit = self.get_permit(user, permit_id)
        if permit.status not in ["draft", "rejected"]:
             raise AppError("INVALID_PERMIT_STATUS", f"Cannot update permit in {permit.status} status", 400)
        return self.repo.update(Permit, user.tenant_id, permit_id, data)

    def submit_permit(self, user: CurrentUser, permit_id: str) -> Permit:
        permit = self.get_permit(user, permit_id)
        permit.status = "submitted"
        return permit

    def approve_permit(self, user: CurrentUser, permit_id: str, payload: dict) -> Permit:
        permit = self.get_permit(user, permit_id)
        approval = self.repo.create(PermitApproval, user.tenant_id, {
            "permit_id": permit_id,
            "approver_user_id": user.user_id,
            "decision": "approved",
            "comment": payload.get("comment"),
            "gps_location": payload.get("gps_location")
        })
        permit.status = "approved"
        return permit

    def reject_permit(self, user: CurrentUser, permit_id: str, payload: dict) -> Permit:
        permit = self.get_permit(user, permit_id)
        approval = self.repo.create(PermitApproval, user.tenant_id, {
            "permit_id": permit_id,
            "approver_user_id": user.user_id,
            "decision": "rejected",
            "comment": payload.get("comment")
        })
        permit.status = "rejected"
        return permit

    def close_permit(self, user: CurrentUser, permit_id: str, payload: dict) -> Permit:
        permit = self.get_permit(user, permit_id)
        permit.status = "closed"
        # Logic for evidence check would be in BusinessRuleService
        return permit

    def get_conflicts(self, user: CurrentUser, permit_id: str) -> list[Permit]:
        permit = self.get_permit(user, permit_id)
        return self.repo.list_active_permit_conflicts(
            user.tenant_id, 
            permit.zone_id, 
            permit.asset_id, 
            exclude_permit_id=permit_id
        )

    def override_conflict(self, user: CurrentUser, permit_id: str, payload: dict) -> Permit:
        permit = self.get_permit(user, permit_id)
        # In a real app, we'd store the override justification/approver
        permit.status = "approved"
        return permit
