from app.core.security import CurrentUser
from app.helpers.response import accepted, ok
from app.services.superadmin_service import SuperAdminService


class SuperAdminController:
    def __init__(self, service: SuperAdminService):
        self.service = service

    def get_dashboard(self, user: CurrentUser) -> dict:
        result = self.service.get_dashboard()
        return ok(result)

    def list_tenants(self, user: CurrentUser) -> dict:
        result = self.service.list_tenants()
        return ok(result)

    def get_tenant(self, user: CurrentUser, tenant_id: str) -> dict:
        result = self.service.get_tenant(tenant_id)
        return ok(result)

    def create_tenant(self, user: CurrentUser, payload: dict) -> dict:
        result = self.service.create_tenant(payload)
        return accepted(result)

    def update_tenant(self, user: CurrentUser, tenant_id: str, payload: dict) -> dict:
        result = self.service.update_tenant(tenant_id, payload)
        return accepted(result)

    def list_all_users(self, user: CurrentUser) -> dict:
        result = self.service.list_all_users()
        return ok(result)

    def get_storage_metrics(self, user: CurrentUser) -> dict:
        result = self.service.get_storage_metrics()
        return ok(result)
