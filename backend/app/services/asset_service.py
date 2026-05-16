from typing import Any
from sqlalchemy.orm import Session
from app.core.security import CurrentUser
from app.models.domain import Asset, AssetInspection
from app.repositories.domain_repository import DomainRepository
from app.core.exceptions import AppError

class AssetService:
    def __init__(self, db: Session):
        self.repo = DomainRepository(db)
        self.db = db

    def list_assets(self, user: CurrentUser, filters: dict) -> list[Asset]:
        return self.repo.list(Asset, user.tenant_id, filters)

    def create_asset(self, user: CurrentUser, data: dict) -> Asset:
        return self.repo.create(Asset, user.tenant_id, data)

    def get_asset(self, user: CurrentUser, asset_id: str) -> Asset:
        asset = self.repo.get(Asset, user.tenant_id, asset_id)
        if not asset:
            raise AppError("ASSET_NOT_FOUND", "Asset not found", 404)
        return asset

    def update_asset(self, user: CurrentUser, asset_id: str, data: dict) -> Asset:
        return self.repo.update(Asset, user.tenant_id, asset_id, data)

    def list_inspections(self, user: CurrentUser, asset_id: str) -> list[AssetInspection]:
        return self.repo.list(AssetInspection, user.tenant_id, {"asset_id": asset_id})

    def record_inspection(self, user: CurrentUser, asset_id: str, data: dict) -> AssetInspection:
        data["asset_id"] = asset_id
        data["inspector_user_id"] = user.user_id
        return self.repo.create(AssetInspection, user.tenant_id, data)
