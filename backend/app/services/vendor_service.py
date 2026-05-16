from typing import Any
from sqlalchemy.orm import Session
from app.core.security import CurrentUser
from app.models.domain import Vendor, VendorDocument
from app.repositories.domain_repository import DomainRepository
from app.core.exceptions import AppError
import uuid

class VendorService:
    def __init__(self, db: Session):
        self.repo = DomainRepository(db)
        self.db = db

    def list_vendors(self, user: CurrentUser, filters: dict = None) -> list[Vendor]:
        return self.repo.list(Vendor, user.tenant_id, filters)

    def create_vendor(self, user: CurrentUser, data: dict) -> Vendor:
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        data["status"] = "pending_approval"
        return self.repo.create(Vendor, user.tenant_id, data)

    def get_vendor(self, user: CurrentUser, vendor_id: str) -> Vendor:
        vendor = self.repo.get(Vendor, user.tenant_id, vendor_id)
        if not vendor:
            raise AppError("VENDOR_NOT_FOUND", "Vendor not found", 404)
        return vendor

    def update_vendor(self, user: CurrentUser, vendor_id: str, data: dict) -> Vendor:
        return self.repo.update(Vendor, user.tenant_id, vendor_id, data)

    def list_vendor_documents(self, user: CurrentUser, vendor_id: str) -> list[VendorDocument]:
        return self.repo.list(VendorDocument, user.tenant_id, {"vendor_id": vendor_id})

    def upload_vendor_document(self, user: CurrentUser, vendor_id: str, data: dict) -> VendorDocument:
        data["vendor_id"] = vendor_id
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        data["status"] = "pending_review"
        return self.repo.create(VendorDocument, user.tenant_id, data)

    def review_vendor_document(self, user: CurrentUser, document_id: str, data: dict) -> VendorDocument:
        return self.repo.update(VendorDocument, user.tenant_id, document_id, {
            "status": data.get("status"),
            "review_comment": data.get("comment")
        })
