from app.core.security import CurrentUser
from app.helpers.response import accepted, ok
from app.services.workflow_engine_service import WorkflowEngineService


class WorkflowController:
    def __init__(self, service: WorkflowEngineService):
        self.service = service

    def list_cases(self, user: CurrentUser, filters: dict) -> dict:
        result = self.service.list_cases(user, filters)
        return ok(result)

    def get_case(self, user: CurrentUser, case_id: str) -> dict:
        result = self.service.get_case(user, case_id)
        return ok(result)

    def create_case(self, user: CurrentUser, payload: dict) -> dict:
        result = self.service.create_case(user, payload)
        return accepted(result)

    def advance_stage(self, user: CurrentUser, case_id: str, payload: dict) -> dict:
        result = self.service.advance_stage(user, case_id, payload)
        return accepted(result)

    def list_approvals(self, user: CurrentUser, case_id: str) -> dict:
        result = self.service.list_approvals(user, case_id)
        return ok(result)

    def submit_approval(self, user: CurrentUser, case_id: str, approval_id: str, payload: dict) -> dict:
        result = self.service.submit_approval(user, case_id, approval_id, payload)
        return accepted(result)

    def list_capas(self, user: CurrentUser, case_id: str) -> dict:
        result = self.service.list_capas(user, case_id)
        return ok(result)

    def update_capa(self, user: CurrentUser, case_id: str, capa_id: str, payload: dict) -> dict:
        result = self.service.update_capa(user, case_id, capa_id, payload)
        return accepted(result)
