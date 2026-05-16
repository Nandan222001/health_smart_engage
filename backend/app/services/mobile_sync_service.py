from typing import Any
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.domain import MobileSyncItem

class MobileSyncService:
    def __init__(self, db: Session = None):
        self.db = db

    def pull(self, user_id: str, last_sync_token: str | None) -> dict:
        return {
            "userId": user_id,
            "syncToken": "next-sync-token",
            "changes": [],
            "lastSyncToken": last_sync_token,
        }

    def push(self, user_id: str, changes: list[dict]) -> dict:
        conflicts = [
            item for item in changes if item.get("serverVersion") and item.get("clientVersion") != item.get("serverVersion")
        ]
        return {
            "userId": user_id,
            "accepted": len(changes) - len(conflicts),
            "conflicts": conflicts,
        }

    def get_sync_status(self, user_id: str, tenant_id: str) -> dict:
        if not self.db:
             return {"pending": 0, "conflicts": 0}
        
        stmt = select(MobileSyncItem).where(
            MobileSyncItem.tenant_id == tenant_id,
            MobileSyncItem.user_id == user_id,
            MobileSyncItem.sync_status != "synced"
        )
        items = list(self.db.scalars(stmt).all())
        return {
            "userId": user_id,
            "pending": len([i for i in items if i.sync_status == "pending"]),
            "conflicts": len([i for i in items if i.sync_status == "conflict"]),
            "items": [i.__dict__ for i in items]
        }

    def resolve_conflict(self, user_id: str, tenant_id: str, conflict_id: str, decision: str) -> dict:
        # Simplified resolution: just mark as synced
        return {"id": conflict_id, "status": "resolved", "decision": decision}
