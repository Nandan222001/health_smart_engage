from typing import Any
from sqlalchemy.orm import Session
from app.core.security import CurrentUser
from app.models.domain import KnowledgeDocument, TrainingCompletion
from app.repositories.domain_repository import DomainRepository
from app.core.exceptions import AppError
import uuid

class KnowledgeService:
    def __init__(self, db: Session):
        self.repo = DomainRepository(db)
        self.db = db

    def list_documents(self, user: CurrentUser, filters: dict = None) -> list[KnowledgeDocument]:
        return self.repo.list(KnowledgeDocument, user.tenant_id, filters)

    def get_document(self, user: CurrentUser, document_id: str) -> KnowledgeDocument:
        doc = self.repo.get(KnowledgeDocument, user.tenant_id, document_id)
        if not doc:
            raise AppError("DOCUMENT_NOT_FOUND", "Document not found", 404)
        return doc

    def create_document(self, user: CurrentUser, data: dict) -> KnowledgeDocument:
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        return self.repo.create(KnowledgeDocument, user.tenant_id, data)

    def acknowledge_document(self, user: CurrentUser, document_id: str, data: dict) -> TrainingCompletion:
        # Acknowledging a document often counts as a training completion or similar record
        return self.repo.create(TrainingCompletion, user.tenant_id, {
            "id": str(uuid.uuid4()),
            "employee_id": user.user_id, # Simplified: assuming user is employee
            "training_requirement_id": document_id, # Linking to doc
            "completed_on": data.get("completed_on") or data.get("completedOn"),
            "evidence_file_id": data.get("evidence_file_id")
        })
