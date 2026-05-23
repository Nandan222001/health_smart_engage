from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository
from app.models.sync import MobileSyncItem


class SyncRepository(BaseRepository[MobileSyncItem]):
    def __init__(self, db: Session):
        super().__init__(db, MobileSyncItem)

    def list_by_tenant(self, tenant_id: str, filters: dict = None) -> list[MobileSyncItem]:
        stmt = select(MobileSyncItem).where(MobileSyncItem.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(MobileSyncItem, k) and v is not None:
                    stmt = stmt.where(getattr(MobileSyncItem, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_by_tenant(self, tenant_id: str, item_id: str) -> MobileSyncItem | None:
        return self.db.scalars(
            select(MobileSyncItem).where(
                MobileSyncItem.tenant_id == tenant_id, MobileSyncItem.id == item_id
            )
        ).first()

    def list_pending_for_user(self, tenant_id: str, user_id: str) -> list[MobileSyncItem]:
        return list(self.db.scalars(
            select(MobileSyncItem).where(
                MobileSyncItem.tenant_id == tenant_id,
                MobileSyncItem.user_id == user_id,
                MobileSyncItem.sync_status == "pending",
            )
        ).all())

    def find_by_client_item_id(
        self, tenant_id: str, user_id: str, client_item_id: str
    ) -> MobileSyncItem | None:
        return self.db.scalars(
            select(MobileSyncItem).where(
                MobileSyncItem.tenant_id == tenant_id,
                MobileSyncItem.user_id == user_id,
                MobileSyncItem.client_item_id == client_item_id,
            )
        ).first()
