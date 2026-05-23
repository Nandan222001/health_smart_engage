from app.core.security import CurrentUser
from app.helpers.response import accepted, ok
from app.services.asset_service import AssetService


class AssetController:
    def __init__(self, service: AssetService):
        self.service = service

    def list_assets(self, user: CurrentUser, filters: dict) -> dict:
        items = self.service.list_assets(user, filters)
        return ok({"items": items})

    def create_asset(self, user: CurrentUser, payload: dict) -> dict:
        result = self.service.create_asset(user, payload)
        return accepted(result)

    def get_asset(self, user: CurrentUser, asset_id: str) -> dict:
        result = self.service.get_asset(user, asset_id)
        return ok(result)

    def update_asset(self, user: CurrentUser, asset_id: str, payload: dict) -> dict:
        result = self.service.update_asset(user, asset_id, payload)
        return accepted(result)

    def delete_asset(self, user: CurrentUser, asset_id: str) -> dict:
        self.service.delete_asset(user, asset_id)
        return accepted({"id": asset_id})

    def list_inspections(self, user: CurrentUser, asset_id: str, filters: dict) -> dict:
        items = self.service.list_inspections(user, asset_id, filters)
        return ok({"items": items})

    def create_inspection(self, user: CurrentUser, asset_id: str, payload: dict) -> dict:
        result = self.service.create_inspection(user, asset_id, payload)
        return accepted(result)

    def get_inspection(self, user: CurrentUser, asset_id: str, inspection_id: str) -> dict:
        result = self.service.get_inspection(user, asset_id, inspection_id)
        return ok(result)
