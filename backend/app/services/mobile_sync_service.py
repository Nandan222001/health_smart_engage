class MobileSyncService:
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
