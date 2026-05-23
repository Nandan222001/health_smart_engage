from app.core.security import CurrentUser
from app.helpers.response import accepted, ok
from app.services.vendor_service import VendorService


class VendorController:
    def __init__(self, service: VendorService):
        self.service = service

    def list_vendors(self, user: CurrentUser, filters: dict) -> dict:
        items = self.service.list_vendors(user, filters)
        return ok({"items": items})

    def create_vendor(self, user: CurrentUser, payload: dict) -> dict:
        result = self.service.create_vendor(user, payload)
        return accepted(result)

    def get_vendor(self, user: CurrentUser, vendor_id: str) -> dict:
        result = self.service.get_vendor(user, vendor_id)
        return ok(result)

    def update_vendor(self, user: CurrentUser, vendor_id: str, payload: dict) -> dict:
        result = self.service.update_vendor(user, vendor_id, payload)
        return accepted(result)

    def delete_vendor(self, user: CurrentUser, vendor_id: str) -> dict:
        self.service.delete_vendor(user, vendor_id)
        return accepted({"id": vendor_id})

    def list_documents(self, user: CurrentUser, vendor_id: str, filters: dict) -> dict:
        items = self.service.list_vendor_documents(user, vendor_id, filters)
        return ok({"items": items})

    def create_document(self, user: CurrentUser, vendor_id: str, payload: dict) -> dict:
        result = self.service.create_vendor_document(user, vendor_id, payload)
        return accepted(result)

    def review_document(self, user: CurrentUser, vendor_id: str, doc_id: str, payload: dict) -> dict:
        result = self.service.review_vendor_document(user, vendor_id, doc_id, payload)
        return accepted(result)
