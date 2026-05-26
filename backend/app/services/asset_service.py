import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.core.security import CurrentUser
from app.models.assets import Asset, AssetInspection, AssetMaintenanceLog
from app.repositories.domain_repository import DomainRepository


class AssetService:
    def __init__(self, db: Session):
        self.repo = DomainRepository(db)
        self.db = db

    # ── Assets ────────────────────────────────────────────────────────────────

    def list_assets(self, user: CurrentUser, filters: dict = None) -> list[Asset]:
        return self.repo.list(Asset, user.tenant_id, filters or {})

    def create_asset(self, user: CurrentUser, data: dict) -> Asset:
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        data.setdefault("status", "Active")
        data.setdefault("criticality", "medium")
        data.setdefault("compliance_status", "compliant")
        return self.repo.create(Asset, user.tenant_id, data)

    def get_asset(self, user: CurrentUser, asset_id: str) -> Asset:
        asset = self.repo.get(Asset, user.tenant_id, asset_id)
        if not asset:
            raise AppError("ASSET_NOT_FOUND", "Asset not found", 404)
        return asset

    def update_asset(self, user: CurrentUser, asset_id: str, data: dict) -> Asset:
        return self.repo.update(Asset, user.tenant_id, asset_id, data)

    # ── Categories ────────────────────────────────────────────────────────────

    def list_asset_categories(self, user: CurrentUser) -> dict:
        assets = self.list_assets(user)
        grouped: dict[str, dict] = {}
        for a in assets:
            cat = a.category or "Uncategorised"
            if cat not in grouped:
                grouped[cat] = {
                    "category": cat,
                    "total": 0,
                    "active": 0,
                    "maintenance": 0,
                    "retired": 0,
                    "high_criticality": 0,
                }
            g = grouped[cat]
            g["total"] += 1
            status = (a.status or "Active").lower()
            if status == "active":
                g["active"] += 1
            elif status == "maintenance":
                g["maintenance"] += 1
            elif status in ("retired", "decommissioned"):
                g["retired"] += 1
            if (a.criticality or "").lower() == "high":
                g["high_criticality"] += 1
        return {"items": sorted(grouped.values(), key=lambda x: -x["total"])}

    # ── Maintenance Logs ──────────────────────────────────────────────────────

    def list_maintenance_logs(self, user: CurrentUser, asset_id: str = None) -> list[AssetMaintenanceLog]:
        filters = {}
        if asset_id:
            filters["asset_id"] = asset_id
        return self.repo.list(AssetMaintenanceLog, user.tenant_id, filters)

    def create_maintenance_log(self, user: CurrentUser, asset_id: str, data: dict) -> AssetMaintenanceLog:
        data["asset_id"] = asset_id
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        data.setdefault("status", "completed")
        if "performed_on" not in data:
            data["performed_on"] = str(date.today())
        return self.repo.create(AssetMaintenanceLog, user.tenant_id, data)

    def list_all_maintenance_logs_enriched(self, user: CurrentUser) -> dict:
        logs = self.list_maintenance_logs(user)
        assets = {a.id: a for a in self.list_assets(user)}
        items = []
        for log in logs:
            asset = assets.get(log.asset_id)
            items.append({
                "id": log.id,
                "asset_id": log.asset_id,
                "asset_name": asset.name or asset.asset_code if asset else log.asset_id,
                "asset_code": asset.asset_code if asset else "",
                "category": asset.category if asset else "",
                "work_type": log.work_type,
                "description": log.description,
                "performed_by": log.performed_by,
                "performed_on": str(log.performed_on) if log.performed_on else None,
                "cost": log.cost,
                "status": log.status,
                "notes": log.notes,
            })
        items.sort(key=lambda x: x["performed_on"] or "", reverse=True)
        return {"items": items}

    # ── Inspections ───────────────────────────────────────────────────────────

    def list_inspections(self, user: CurrentUser, asset_id: str) -> list[AssetInspection]:
        return self.repo.list(AssetInspection, user.tenant_id, {"asset_id": asset_id})

    def record_inspection(self, user: CurrentUser, asset_id: str, data: dict) -> AssetInspection:
        data["asset_id"] = asset_id
        data["inspector_user_id"] = user.user_id
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        if "inspected_on" not in data:
            data["inspected_on"] = str(date.today())
        return self.repo.create(AssetInspection, user.tenant_id, data)

    def list_all_inspections_enriched(self, user: CurrentUser) -> dict:
        inspections = self.repo.list(AssetInspection, user.tenant_id, {})
        assets = {a.id: a for a in self.list_assets(user)}
        items = []
        for ins in inspections:
            asset = assets.get(ins.asset_id)
            items.append({
                "id": ins.id,
                "asset_id": ins.asset_id,
                "asset_name": asset.name or asset.asset_code if asset else ins.asset_id,
                "asset_code": asset.asset_code if asset else "",
                "category": asset.category if asset else "",
                "inspection_type": ins.inspection_type,
                "inspected_on": str(ins.inspected_on) if ins.inspected_on else None,
                "inspector_user_id": ins.inspector_user_id,
                "result": ins.result,
                "notes": ins.notes,
            })
        items.sort(key=lambda x: x["inspected_on"] or "", reverse=True)
        return {"items": items}

    # ── Risk Mapping ──────────────────────────────────────────────────────────

    def list_asset_risk_mapping(self, user: CurrentUser) -> dict:
        assets = self.list_assets(user)
        items = []
        for a in assets:
            risk = a.risk_score or 0.0
            criticality = (a.criticality or "medium").lower()
            if risk >= 70 or criticality == "high":
                risk_level = "High"
            elif risk >= 40 or criticality == "medium":
                risk_level = "Medium"
            else:
                risk_level = "Low"

            items.append({
                "id": a.id,
                "asset_code": a.asset_code,
                "name": a.name or a.asset_code,
                "category": a.category,
                "location": a.location,
                "criticality": a.criticality or "medium",
                "status": a.status or "Active",
                "compliance_status": a.compliance_status or "compliant",
                "risk_score": round(risk, 1),
                "risk_level": risk_level,
                "last_maintenance_date": str(a.last_maintenance_date) if a.last_maintenance_date else None,
                "next_maintenance_date": str(a.next_maintenance_date) if a.next_maintenance_date else None,
            })
        items.sort(key=lambda x: -x["risk_score"])
        return {"items": items}
