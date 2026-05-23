from app.core.security import CurrentUser
from app.helpers.response import accepted, ok
from app.services.outputs_service import OutputsService


class OutputsController:
    def __init__(self, service: OutputsService):
        self.service = service

    def get_operational_dashboard(self, user: CurrentUser) -> dict:
        result = self.service.get_operational_dashboard(user)
        return ok(result)

    def list_reports(self, user: CurrentUser) -> dict:
        result = self.service.list_reports(user)
        return ok(result)

    def generate_report(self, user: CurrentUser, payload: dict) -> dict:
        result = self.service.generate_report(user, payload)
        return accepted(result)

    def get_ai_insights(self, user: CurrentUser) -> dict:
        result = self.service.get_ai_insights(user)
        return ok(result)

    def action_insight(self, user: CurrentUser, insight_id: str, payload: dict) -> dict:
        result = self.service.action_insight(user, insight_id, payload)
        return accepted(result)

    def get_alerts_dashboard(self, user: CurrentUser) -> dict:
        result = self.service.get_alerts_dashboard(user)
        return ok(result)

    def update_alert_rule(self, user: CurrentUser, rule_id: str, payload: dict) -> dict:
        result = self.service.update_alert_rule(user, rule_id, payload)
        return accepted(result)

    def get_export_share_data(self, user: CurrentUser) -> dict:
        result = self.service.get_export_share_data(user)
        return ok(result)

    def create_export_job(self, user: CurrentUser, payload: dict) -> dict:
        result = self.service.create_export_job(user, payload)
        return accepted(result)
