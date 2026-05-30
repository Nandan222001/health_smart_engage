from app.core.security import CurrentUser
from app.helpers.response import accepted, ok
from app.services.permit_service import PermitService


class PermitController:
    def __init__(self, service: PermitService):
        self.service = service

    def list_permits(self, user: CurrentUser, filters: dict) -> dict:
        items = self.service.list_permits(user, filters)
        return ok({"items": items})

    def get_permit(self, user: CurrentUser, permit_id: str) -> dict:
        item = self.service.get_permit(user, permit_id)
        return ok(item)

    def create_permit(self, user: CurrentUser, payload: dict) -> dict:
        result = self.service.create_permit(user, payload)
        return accepted(result)

    def update_permit(self, user: CurrentUser, permit_id: str, payload: dict) -> dict:
        result = self.service.update_permit(user, permit_id, payload)
        return accepted(result)

    def submit_permit(self, user: CurrentUser, permit_id: str, payload: dict) -> dict:
        result = self.service.submit_permit(user, permit_id, payload)
        return accepted(result)

    def approve_permit(self, user: CurrentUser, permit_id: str, payload: dict) -> dict:
        result = self.service.approve_permit(user, permit_id, payload)
        return accepted(result)

    def reject_permit(self, user: CurrentUser, permit_id: str, payload: dict) -> dict:
        result = self.service.reject_permit(user, permit_id, payload)
        return accepted(result)

    def close_permit(self, user: CurrentUser, permit_id: str, payload: dict) -> dict:
        result = self.service.close_permit(user, permit_id, payload)
        return accepted(result)

    def extend_permit(self, user: CurrentUser, permit_id: str, payload: dict) -> dict:
        result = self.service.extend_permit(user, permit_id, payload)
        return accepted(result)

    def check_conflicts(self, user: CurrentUser, permit_id: str) -> dict:
        result = self.service.check_conflicts(user, permit_id)
        return ok(result)
