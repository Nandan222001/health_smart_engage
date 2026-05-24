from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import CurrentUser
from app.models.generic_record import GenericRecord
from app.models.tenant import Tenant
from app.repositories.generic_repository import GenericRepository

MODULE = "org_setup"

STEP_RECORD_TYPES = {
    1: "step1_org_details",
    2: "step2_compliance",
    5: "step5_workflow_config",
    7: "step7_ai_config",
}

ALL_STEPS = [1, 2, 3, 4, 5, 6, 7, 8]
MODULES_ENABLED = [
    "permits",
    "incidents",
    "audits",
    "capa",
    "risk",
    "training",
    "knowledge",
    "ai_assistant",
]


class OrgSetupService:
    def __init__(self, db: Session):
        self.repo = GenericRepository(db)
        self.db = db

    # ── helpers ───────────────────────────────────────────────────────────────

    def _first(self, tenant_id: str, record_type: str) -> GenericRecord | None:
        stmt = (
            select(GenericRecord)
            .where(GenericRecord.tenant_id == tenant_id)
            .where(GenericRecord.module == MODULE)
            .where(GenericRecord.record_type == record_type)
            .order_by(GenericRecord.created_at.desc())
            .limit(1)
        )
        return self.db.scalars(stmt).first()

    def _upsert(self, tenant_id: str, record_type: str, payload: dict, status: str = "saved") -> GenericRecord:
        existing = self._first(tenant_id, record_type)
        if existing:
            existing.payload = payload
            existing.status = status
            self.db.flush()
            return existing
        return self.repo.create(
            tenant_id=tenant_id,
            module=MODULE,
            record_type=record_type,
            payload=payload,
            status=status,
        )

    def _step_number_from_record_type(self, rt: str) -> int | None:
        mapping = {
            "step1_org_details": 1,
            "step2_compliance": 2,
            "step3_site": 3,
            "step4_user": 4,
            "step5_workflow_config": 5,
            "step6_document": 6,
            "step6a_import": 7,  # step 6a counts as step 7 in 8-step model
            "step7_ai_config": 7,
            "activation": 8,
        }
        return mapping.get(rt)

    # ── progress ─────────────────────────────────────────────────────────────

    def get_progress(self, user: CurrentUser) -> dict:
        tenant_id = user.tenant_id

        step1_rec = self._first(tenant_id, "step1_org_details")
        step2_rec = self._first(tenant_id, "step2_compliance")
        step5_rec = self._first(tenant_id, "step5_workflow_config")
        step7_rec = self._first(tenant_id, "step7_ai_config")
        activation_rec = self._first(tenant_id, "activation")

        sites = self.repo.list_by_type(tenant_id, MODULE, "step3_site", limit=1)
        users = self.repo.list_by_type(tenant_id, MODULE, "step4_user", limit=1)
        docs = self.repo.list_by_type(tenant_id, MODULE, "step6_document", limit=1)
        imports = self.repo.list_by_type(tenant_id, MODULE, "step6a_import", limit=1)

        step_status = {
            1: step1_rec is not None,
            2: step2_rec is not None,
            3: len(sites) > 0,
            4: len(users) > 0,
            5: step5_rec is not None,
            6: len(docs) > 0,
            7: len(imports) > 0,
            8: activation_rec is not None,
        }

        steps_completed = [s for s, done in step_status.items() if done]
        activated = activation_rec is not None and activation_rec.payload.get("confirmed", False)

        def _step_detail(step: int, rec: GenericRecord | None) -> dict:
            return {"completed": rec is not None, "data": rec.payload if rec else {}}

        def _list_step_detail(step: int, has_records: bool) -> dict:
            return {"completed": has_records, "data": {}}

        step_details = {
            "step1": _step_detail(1, step1_rec),
            "step2": _step_detail(2, step2_rec),
            "step3": _list_step_detail(3, len(sites) > 0),
            "step4": _list_step_detail(4, len(users) > 0),
            "step5": _step_detail(5, step5_rec),
            "step6": _list_step_detail(6, len(docs) > 0),
            "step6a": _list_step_detail(7, len(imports) > 0),
            "step7": _step_detail(7, step7_rec),
            "step8": {"completed": activated, "data": {}},
        }

        total = len(ALL_STEPS)
        percent = round(len(steps_completed) / total * 100)

        return {
            "steps_completed": steps_completed,
            "steps_total": total,
            "percent": percent,
            "activated": activated,
            "step_details": step_details,
        }

    # ── step 1: org details ───────────────────────────────────────────────────

    def save_step1(self, user: CurrentUser, data: dict) -> dict:
        record = self._upsert(user.tenant_id, "step1_org_details", data)
        return {"step": 1, "status": "saved", "record_id": record.id}

    def get_step1(self, user: CurrentUser) -> dict:
        record = self._first(user.tenant_id, "step1_org_details")
        return record.payload if record else {}

    # ── step 2: compliance ────────────────────────────────────────────────────

    def save_step2(self, user: CurrentUser, data: dict) -> dict:
        record = self._upsert(user.tenant_id, "step2_compliance", data)
        return {"step": 2, "status": "saved", "record_id": record.id}

    def get_step2(self, user: CurrentUser) -> dict:
        record = self._first(user.tenant_id, "step2_compliance")
        return record.payload if record else {}

    # ── step 3: sites ─────────────────────────────────────────────────────────

    def create_site(self, user: CurrentUser, data: dict) -> dict:
        record = self.repo.create(
            tenant_id=user.tenant_id,
            module=MODULE,
            record_type="step3_site",
            payload=data,
            status="active",
        )
        return {"step": 3, "status": "created", "record_id": record.id, "site_id": record.id}

    def bulk_upload_sites(self, user: CurrentUser, data: dict) -> dict:
        sites = data.get("sites", [])
        created_ids = []
        for site in sites:
            rec = self.repo.create(
                tenant_id=user.tenant_id,
                module=MODULE,
                record_type="step3_site",
                payload=site,
                status="active",
            )
            created_ids.append(rec.id)
        return {"step": 3, "status": "bulk_uploaded", "count": len(created_ids), "record_ids": created_ids}

    def list_sites(self, user: CurrentUser) -> dict:
        records = self.repo.list_by_type(user.tenant_id, MODULE, "step3_site")
        return {
            "items": [{"id": r.id, "status": r.status, **r.payload} for r in records],
            "total": len(records),
        }

    # ── step 4: users ─────────────────────────────────────────────────────────

    def create_user(self, user: CurrentUser, data: dict) -> dict:
        record = self.repo.create(
            tenant_id=user.tenant_id,
            module=MODULE,
            record_type="step4_user",
            payload=data,
            status="pending",
        )
        return {"step": 4, "status": "created", "record_id": record.id, "user_id": record.id}

    def bulk_upload_users(self, user: CurrentUser, data: dict) -> dict:
        users = data.get("users", [])
        created_ids = []
        for u in users:
            rec = self.repo.create(
                tenant_id=user.tenant_id,
                module=MODULE,
                record_type="step4_user",
                payload=u,
                status="pending",
            )
            created_ids.append(rec.id)
        return {"step": 4, "status": "bulk_uploaded", "count": len(created_ids), "record_ids": created_ids}

    def list_users(self, user: CurrentUser) -> dict:
        records = self.repo.list_by_type(user.tenant_id, MODULE, "step4_user")
        return {
            "items": [{"id": r.id, "status": r.status, **r.payload} for r in records],
            "total": len(records),
        }

    # ── step 5: workflow config ───────────────────────────────────────────────

    def save_step5(self, user: CurrentUser, data: dict) -> dict:
        record = self._upsert(user.tenant_id, "step5_workflow_config", data)
        return {"step": 5, "status": "saved", "record_id": record.id}

    def get_step5(self, user: CurrentUser) -> dict:
        record = self._first(user.tenant_id, "step5_workflow_config")
        return record.payload if record else {}

    # ── step 6: knowledge upload ──────────────────────────────────────────────

    def upload_document(self, user: CurrentUser, data: dict) -> dict:
        record = self.repo.create(
            tenant_id=user.tenant_id,
            module=MODULE,
            record_type="step6_document",
            payload=data,
            status="uploaded",
        )
        return {"step": 6, "status": "uploaded", "record_id": record.id, "document_id": record.id}

    def list_documents(self, user: CurrentUser) -> dict:
        records = self.repo.list_by_type(user.tenant_id, MODULE, "step6_document")
        return {
            "items": [{"id": r.id, "status": r.status, **r.payload} for r in records],
            "total": len(records),
        }

    # ── step 6a: data import ──────────────────────────────────────────────────

    def import_data(self, user: CurrentUser, data: dict) -> dict:
        record = self.repo.create(
            tenant_id=user.tenant_id,
            module=MODULE,
            record_type="step6a_import",
            payload=data,
            status="imported",
        )
        return {"step": "6a", "status": "imported", "record_id": record.id, "import_id": record.id}

    def list_imports(self, user: CurrentUser) -> dict:
        records = self.repo.list_by_type(user.tenant_id, MODULE, "step6a_import")
        return {
            "items": [{"id": r.id, "status": r.status, **r.payload} for r in records],
            "total": len(records),
        }

    # ── step 7: ai config ─────────────────────────────────────────────────────

    def save_step7(self, user: CurrentUser, data: dict) -> dict:
        record = self._upsert(user.tenant_id, "step7_ai_config", data)
        return {"step": 7, "status": "saved", "record_id": record.id}

    def get_step7(self, user: CurrentUser) -> dict:
        record = self._first(user.tenant_id, "step7_ai_config")
        return record.payload if record else {}

    # ── activate (step 8) ─────────────────────────────────────────────────────

    def activate(self, user: CurrentUser, data: dict) -> dict:
        if not data.get("confirmed", False):
            return {"error": "Activation requires confirmed=true"}

        # Persist activation record
        self._upsert(
            user.tenant_id,
            "activation",
            {"confirmed": True, "activated_by": user.user_id},
            status="activated",
        )

        # Attempt to update tenant status to active
        tenant = self.db.get(Tenant, user.tenant_id)
        if tenant:
            tenant.status = "active"
            self.db.flush()

        return {
            "status": "activated",
            "tenant_id": user.tenant_id,
            "modules_enabled": MODULES_ENABLED,
            "dashboard_url": "/",
            "message": "Organization activated successfully",
        }
