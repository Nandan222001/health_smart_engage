from app.core.security import CurrentUser
from app.helpers.response import accepted, ok
from app.services.foundation_service import FoundationService


class FoundationController:
    def __init__(self, service: FoundationService):
        self.service = service

    def list_org_nodes(self, user: CurrentUser, filters: dict) -> dict:
        items = self.service.list_organisation_nodes(user, filters)
        return ok({"items": items})

    def create_org_node(self, user: CurrentUser, payload: dict) -> dict:
        result = self.service.create_organisation_node(user, payload)
        return accepted(result)

    def get_org_node(self, user: CurrentUser, node_id: str) -> dict:
        result = self.service.get_organisation_node(user, node_id)
        return ok(result)

    def update_org_node(self, user: CurrentUser, node_id: str, payload: dict) -> dict:
        result = self.service.update_organisation_node(user, node_id, payload)
        return accepted(result)

    def delete_org_node(self, user: CurrentUser, node_id: str) -> dict:
        self.service.delete_organisation_node(user, node_id)
        return accepted({"id": node_id})

    def list_users(self, user: CurrentUser, filters: dict) -> dict:
        items = self.service.list_users(user, filters)
        return ok({"items": items})

    def create_user(self, user: CurrentUser, payload: dict) -> dict:
        result = self.service.create_user(user, payload)
        return accepted(result)

    def get_user(self, user: CurrentUser, user_id: str) -> dict:
        result = self.service.get_user(user, user_id)
        return ok(result)

    def update_user(self, user: CurrentUser, user_id: str, payload: dict) -> dict:
        result = self.service.update_user(user, user_id, payload)
        return accepted(result)

    def delete_user(self, user: CurrentUser, user_id: str) -> dict:
        self.service.delete_user(user, user_id)
        return accepted({"id": user_id})

    def list_roles(self, user: CurrentUser, filters: dict) -> dict:
        items = self.service.list_roles(user, filters)
        return ok({"items": items})

    def create_role(self, user: CurrentUser, payload: dict) -> dict:
        result = self.service.create_role(user, payload)
        return accepted(result)

    def get_role(self, user: CurrentUser, role_id: str) -> dict:
        result = self.service.get_role(user, role_id)
        return ok(result)

    def update_role(self, user: CurrentUser, role_id: str, payload: dict) -> dict:
        result = self.service.update_role(user, role_id, payload)
        return accepted(result)

    def delete_role(self, user: CurrentUser, role_id: str) -> dict:
        self.service.delete_role(user, role_id)
        return accepted({"id": role_id})
