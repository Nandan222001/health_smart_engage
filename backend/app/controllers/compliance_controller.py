from app.core.security import CurrentUser
from app.helpers.response import accepted, ok
from app.services.compliance_service import ComplianceService


class ComplianceController:
    def __init__(self, service: ComplianceService):
        self.service = service

    def list_checklists(self, user: CurrentUser, filters: dict) -> dict:
        items = self.service.list_checklists(user, filters)
        return ok({"items": items})

    def create_checklist(self, user: CurrentUser, payload: dict) -> dict:
        result = self.service.create_checklist(user, payload)
        return accepted(result)

    def publish_checklist(self, user: CurrentUser, checklist_id: str, payload: dict) -> dict:
        result = self.service.publish_checklist(user, checklist_id, payload)
        return accepted(result)

    def create_audit(self, user: CurrentUser, payload: dict) -> dict:
        result = self.service.create_audit(user, payload)
        return accepted(result)

    def get_audit(self, user: CurrentUser, audit_id: str) -> dict:
        item = self.service.get_audit(user, audit_id)
        return ok(item)

    def create_finding(self, user: CurrentUser, audit_id: str, payload: dict) -> dict:
        result = self.service.create_finding(user, audit_id, payload)
        return accepted(result)

    def list_capas(self, user: CurrentUser, filters: dict) -> dict:
        items = self.service.list_capas(user, filters)
        return ok({"items": items})

    def submit_capa_closure(self, user: CurrentUser, capa_id: str, payload: dict) -> dict:
        result = self.service.submit_capa_closure(user, capa_id, payload)
        return accepted(result)

    def approve_capa_closure(self, user: CurrentUser, capa_id: str, payload: dict) -> dict:
        result = self.service.approve_capa_closure(user, capa_id, payload)
        return accepted(result)
