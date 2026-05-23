from app.core.security import CurrentUser
from app.helpers.response import accepted, ok
from app.services.compliance_service import ComplianceService


class RiskController:
    def __init__(self, service: ComplianceService):
        self.service = service

    def list_risk_assessments(self, user: CurrentUser, filters: dict) -> dict:
        items = self.service.list_risk_assessments(user, filters)
        return ok({"items": items})

    def create_risk_assessment(self, user: CurrentUser, payload: dict) -> dict:
        result = self.service.create_risk_assessment(user, payload)
        return accepted(result)

    def list_hazards(self, user: CurrentUser, filters: dict) -> dict:
        items = self.service.list_hazards(user, filters)
        return ok({"items": items})

    def create_hazard(self, user: CurrentUser, payload: dict) -> dict:
        result = self.service.create_hazard(user, payload)
        return accepted(result)

    def update_hazard(self, user: CurrentUser, hazard_id: str, payload: dict) -> dict:
        result = self.service.update_hazard(user, hazard_id, payload)
        return accepted(result)
