from app.core.security import CurrentUser
from app.helpers.response import accepted, ok
from app.services.people_service import PeopleService


class PeopleController:
    def __init__(self, service: PeopleService):
        self.service = service

    def list_employees(self, user: CurrentUser, filters: dict) -> dict:
        items = self.service.list_employees(user, filters)
        return ok({"items": items})

    def create_employee(self, user: CurrentUser, payload: dict) -> dict:
        result = self.service.create_employee(user, payload)
        return accepted(result)

    def get_employee(self, user: CurrentUser, employee_id: str) -> dict:
        result = self.service.get_employee(user, employee_id)
        return ok(result)

    def update_employee(self, user: CurrentUser, employee_id: str, payload: dict) -> dict:
        result = self.service.update_employee(user, employee_id, payload)
        return accepted(result)

    def delete_employee(self, user: CurrentUser, employee_id: str) -> dict:
        self.service.delete_employee(user, employee_id)
        return accepted({"id": employee_id})

    def list_certifications(self, user: CurrentUser, filters: dict) -> dict:
        items = self.service.list_certifications(user, filters)
        return ok({"items": items})

    def create_certification(self, user: CurrentUser, payload: dict) -> dict:
        result = self.service.create_certification(user, payload)
        return accepted(result)

    def get_certification(self, user: CurrentUser, cert_id: str) -> dict:
        result = self.service.get_certification(user, cert_id)
        return ok(result)

    def update_certification(self, user: CurrentUser, cert_id: str, payload: dict) -> dict:
        result = self.service.update_certification(user, cert_id, payload)
        return accepted(result)

    def list_training_requirements(self, user: CurrentUser, filters: dict) -> dict:
        items = self.service.list_training_requirements(user, filters)
        return ok({"items": items})

    def create_training_requirement(self, user: CurrentUser, payload: dict) -> dict:
        result = self.service.create_training_requirement(user, payload)
        return accepted(result)

    def list_training_completions(self, user: CurrentUser, filters: dict) -> dict:
        items = self.service.list_training_completions(user, filters)
        return ok({"items": items})

    def create_training_completion(self, user: CurrentUser, payload: dict) -> dict:
        result = self.service.create_training_completion(user, payload)
        return accepted(result)
