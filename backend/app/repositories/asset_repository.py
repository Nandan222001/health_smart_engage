from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository
from app.models.assets import Asset, AssetInspection


class AssetRepository(BaseRepository[Asset]):
    def __init__(self, db: Session):
        super().__init__(db, Asset)

    def list_by_tenant(self, tenant_id: str, filters: dict = None) -> list[Asset]:
        stmt = select(Asset).where(Asset.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(Asset, k) and v is not None:
                    stmt = stmt.where(getattr(Asset, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_by_tenant(self, tenant_id: str, asset_id: str) -> Asset | None:
        return self.db.scalars(
            select(Asset).where(Asset.tenant_id == tenant_id, Asset.id == asset_id)
        ).first()

    def list_inspections(self, tenant_id: str, asset_id: str = None) -> list[AssetInspection]:
        stmt = select(AssetInspection).where(AssetInspection.tenant_id == tenant_id)
        if asset_id:
            stmt = stmt.where(AssetInspection.asset_id == asset_id)
        return list(self.db.scalars(stmt).all())

    def get_inspection(self, tenant_id: str, inspection_id: str) -> AssetInspection | None:
        return self.db.scalars(
            select(AssetInspection).where(
                AssetInspection.tenant_id == tenant_id, AssetInspection.id == inspection_id
            )
        ).first()
