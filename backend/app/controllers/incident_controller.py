from app.core.security import CurrentUser
from app.helpers.response import accepted, ok
from app.services.compliance_service import ComplianceService


class IncidentController:
    def __init__(self, service: ComplianceService):
        self.service = service

    def list_incidents(self, user: CurrentUser, filters: dict) -> dict:
        items = self.service.list_incidents(user, filters)
        return ok({"items": items})

    def create_incident(self, user: CurrentUser, payload: dict) -> dict:
        result = self.service.create_incident(user, payload)
        return accepted(result)

    def get_incident(self, user: CurrentUser, incident_id: str) -> dict:
        result = self.service.get_incident(user, incident_id)
        return ok(result)

    def update_incident(self, user: CurrentUser, incident_id: str, payload: dict) -> dict:
        result = self.service.update_incident(user, incident_id, payload)
        return accepted(result)

    def delete_incident(self, user: CurrentUser, incident_id: str) -> dict:
        self.service.delete_incident(user, incident_id)
        return accepted({"id": incident_id})

    def classify_incident(self, user: CurrentUser, incident_id: str, payload: dict) -> dict:
        result = self.service.classify_incident(user, incident_id, payload)
        return accepted(result)

    def start_investigation(self, user: CurrentUser, incident_id: str, payload: dict) -> dict:
        result = self.service.start_investigation(user, incident_id, payload)
        return accepted(result)

    def update_investigation(self, user: CurrentUser, incident_id: str, investigation_id: str, payload: dict) -> dict:
        result = self.service.update_investigation(user, incident_id, investigation_id, payload)
        return accepted(result)
