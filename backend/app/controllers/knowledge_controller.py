from app.core.security import CurrentUser
from app.helpers.response import accepted, ok
from app.services.knowledge_service import KnowledgeService


class KnowledgeController:
    def __init__(self, service: KnowledgeService):
        self.service = service

    def list_documents(self, user: CurrentUser, filters: dict) -> dict:
        items = self.service.list_documents(user, filters)
        return ok({"items": items})

    def get_document(self, user: CurrentUser, doc_id: str) -> dict:
        item = self.service.get_document(user, doc_id)
        return ok(item)

    def create_document(self, user: CurrentUser, payload: dict) -> dict:
        result = self.service.create_document(user, payload)
        return accepted(result)

    def update_document(self, user: CurrentUser, doc_id: str, payload: dict) -> dict:
        result = self.service.update_document(user, doc_id, payload)
        return accepted(result)

    def search_documents(self, user: CurrentUser, query: str) -> dict:
        results = self.service.search_documents(user, query)
        return ok({"results": results})
