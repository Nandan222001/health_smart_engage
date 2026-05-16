from typing import Any
from sqlalchemy.orm import Session
from app.core.security import CurrentUser
from app.models.domain import Employee, Certification, TrainingRequirement, TrainingCompletion
from app.repositories.domain_repository import DomainRepository
from app.core.exceptions import AppError

class PeopleService:
    def __init__(self, db: Session):
        self.repo = DomainRepository(db)
        self.db = db

    def list_employees(self, user: CurrentUser, filters: dict) -> list[Employee]:
        return self.repo.list(Employee, user.tenant_id, filters)

    def create_employee(self, user: CurrentUser, data: dict) -> Employee:
        return self.repo.create(Employee, user.tenant_id, data)

    def get_employee(self, user: CurrentUser, employee_id: str) -> Employee:
        employee = self.repo.get(Employee, user.tenant_id, employee_id)
        if not employee:
            raise AppError("EMPLOYEE_NOT_FOUND", "Employee not found", 404)
        return employee

    def update_employee(self, user: CurrentUser, employee_id: str, data: dict) -> Employee:
        return self.repo.update(Employee, user.tenant_id, employee_id, data)

    def list_certifications(self, user: CurrentUser, employee_id: str) -> list[Certification]:
        return self.repo.list(Certification, user.tenant_id, {"employee_id": employee_id})

    def add_certification(self, user: CurrentUser, employee_id: str, data: dict) -> Certification:
        data["employee_id"] = employee_id
        return self.repo.create(Certification, user.tenant_id, data)

    def get_training_matrix(self, user: CurrentUser, role_id: str = None) -> list[TrainingRequirement]:
        filters = {"role_id": role_id} if role_id else {}
        return self.repo.list(TrainingRequirement, user.tenant_id, filters)

    def record_training_completion(self, user: CurrentUser, data: dict) -> TrainingCompletion:
        return self.repo.create(TrainingCompletion, user.tenant_id, data)
