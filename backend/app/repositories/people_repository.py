from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository
from app.models.people import Employee, Certification, TrainingRequirement, TrainingCompletion


class PeopleRepository(BaseRepository[Employee]):
    def __init__(self, db: Session):
        super().__init__(db, Employee)

    def list_by_tenant(self, tenant_id: str, filters: dict = None) -> list[Employee]:
        stmt = select(Employee).where(Employee.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(Employee, k) and v is not None:
                    stmt = stmt.where(getattr(Employee, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_by_tenant(self, tenant_id: str, employee_id: str) -> Employee | None:
        return self.db.scalars(
            select(Employee).where(Employee.tenant_id == tenant_id, Employee.id == employee_id)
        ).first()

    def list_certifications(self, tenant_id: str, employee_id: str = None) -> list[Certification]:
        stmt = select(Certification).where(Certification.tenant_id == tenant_id)
        if employee_id:
            stmt = stmt.where(Certification.employee_id == employee_id)
        return list(self.db.scalars(stmt).all())

    def get_certification(self, tenant_id: str, cert_id: str) -> Certification | None:
        return self.db.scalars(
            select(Certification).where(
                Certification.tenant_id == tenant_id, Certification.id == cert_id
            )
        ).first()

    def has_valid_certification(
        self, tenant_id: str, employee_id: str, certification_type: str
    ) -> bool:
        stmt = select(Certification).where(
            Certification.tenant_id == tenant_id,
            Certification.employee_id == employee_id,
            Certification.certification_type == certification_type,
            Certification.status == "active",
        )
        return self.db.scalars(stmt).first() is not None

    def list_training_requirements(self, tenant_id: str, role_name: str = None) -> list[TrainingRequirement]:
        stmt = select(TrainingRequirement).where(TrainingRequirement.tenant_id == tenant_id)
        if role_name:
            stmt = stmt.where(TrainingRequirement.role_name == role_name)
        return list(self.db.scalars(stmt).all())

    def get_training_requirement(self, tenant_id: str, req_id: str) -> TrainingRequirement | None:
        return self.db.scalars(
            select(TrainingRequirement).where(
                TrainingRequirement.tenant_id == tenant_id, TrainingRequirement.id == req_id
            )
        ).first()

    def list_training_completions(self, tenant_id: str, employee_id: str = None) -> list[TrainingCompletion]:
        stmt = select(TrainingCompletion).where(TrainingCompletion.tenant_id == tenant_id)
        if employee_id:
            stmt = stmt.where(TrainingCompletion.employee_id == employee_id)
        return list(self.db.scalars(stmt).all())

    def get_training_completion(self, tenant_id: str, completion_id: str) -> TrainingCompletion | None:
        return self.db.scalars(
            select(TrainingCompletion).where(
                TrainingCompletion.tenant_id == tenant_id, TrainingCompletion.id == completion_id
            )
        ).first()
