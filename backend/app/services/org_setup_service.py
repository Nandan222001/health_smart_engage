from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import CurrentUser
from app.models.generic_record import GenericRecord
from app.models.people import Employee
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

    def _check_prerequisite(self, tenant_id: str, required_step: int) -> dict | None:
        """Return error dict if `required_step` is not yet complete, else None."""
        step_names = {
            1: "Organization Details",
            2: "Compliance Setup",
            3: "Sites Setup",
            4: "Users Setup",
            5: "Workflow Configuration",
            6: "Knowledge & Data Import",
            7: "AI Configuration",
        }

        def _is_complete(step: int) -> bool:
            if step == 1:
                return self._first(tenant_id, "step1_org_details") is not None
            if step == 2:
                return self._first(tenant_id, "step2_compliance") is not None
            if step == 3:
                return len(self.repo.list_by_type(tenant_id, MODULE, "step3_site", limit=1)) > 0
            if step == 4:
                return len(self.repo.list_by_type(tenant_id, MODULE, "step4_user", limit=1)) > 0
            if step == 5:
                return self._first(tenant_id, "step5_workflow_config") is not None
            if step == 6:
                has_doc = len(self.repo.list_by_type(tenant_id, MODULE, "step6_document", limit=1)) > 0
                has_import = len(self.repo.list_by_type(tenant_id, MODULE, "step6a_import", limit=1)) > 0
                return has_doc or has_import
            if step == 7:
                return self._first(tenant_id, "step7_ai_config") is not None
            return False

        if not _is_complete(required_step):
            name = step_names.get(required_step, f"Step {required_step}")
            return {
                "error": f"Step {required_step} ({name}) must be completed before proceeding.",
                "prerequisite_step": required_step,
            }
        return None

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
        err = self._check_prerequisite(user.tenant_id, 1)
        if err:
            return err
        record = self._upsert(user.tenant_id, "step2_compliance", data)
        return {"step": 2, "status": "saved", "record_id": record.id}

    def get_step2(self, user: CurrentUser) -> dict:
        record = self._first(user.tenant_id, "step2_compliance")
        return record.payload if record else {}

    # ── step 3: sites ─────────────────────────────────────────────────────────

    def create_site(self, user: CurrentUser, data: dict) -> dict:
        err = self._check_prerequisite(user.tenant_id, 2)
        if err:
            return err
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

    def _sync_user_to_employees(self, tenant_id: str, payload: dict, record_id: str) -> None:
        """Upsert a step4_user payload into the employees table (keyed by email/contact)."""
        email = payload.get("email", "").strip()
        if not email:
            return
        from sqlalchemy import select as _sa_select
        existing = self.db.scalars(
            _sa_select(Employee)
            .where(Employee.tenant_id == tenant_id)
            .where(Employee.contact == email)
        ).first()
        if existing:
            existing.name = payload.get("name", existing.name) or existing.name
            existing.role_name = payload.get("role") or existing.role_name
            existing.department_id = payload.get("department") or existing.department_id
            self.db.flush()
        else:
            emp = Employee(
                id=str(uuid4()),
                tenant_id=tenant_id,
                name=payload.get("name", ""),
                role_name=payload.get("role", "Employee") or "Employee",
                department_id=payload.get("department"),
                contact=email,
                status="active",
            )
            self.db.add(emp)
            self.db.flush()

    def create_user(self, user: CurrentUser, data: dict) -> dict:
        err = self._check_prerequisite(user.tenant_id, 3)
        if err:
            return err
        record = self.repo.create(
            tenant_id=user.tenant_id,
            module=MODULE,
            record_type="step4_user",
            payload=data,
            status="pending",
        )
        self._sync_user_to_employees(user.tenant_id, data, record.id)
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
            self._sync_user_to_employees(user.tenant_id, u, rec.id)
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
        err = self._check_prerequisite(user.tenant_id, 4)
        if err:
            return err
        record = self._upsert(user.tenant_id, "step5_workflow_config", data)
        return {"step": 5, "status": "saved", "record_id": record.id}

    def get_step5(self, user: CurrentUser) -> dict:
        record = self._first(user.tenant_id, "step5_workflow_config")
        return record.payload if record else {}

    # ── step 6: knowledge upload ──────────────────────────────────────────────

    def upload_document(self, user: CurrentUser, data: dict) -> dict:
        err = self._check_prerequisite(user.tenant_id, 5)
        if err:
            return err
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

    # ── generic bulk import (onboarding) ──────────────────────────────────────

    def bulk_import_module(self, user: CurrentUser, module_key: str, rows: list[dict]) -> dict:
        """Parse and persist rows for any onboarding module.

        Mapping:
        - organisation / sites / users → dedicated record types + employee sync
        - departments / roles          → generic org record types
        - incidents                    → generic_records + Incident domain rows
        - risk                         → generic_records + RiskAssessment rows
        - all other modules            → generic_records as org_import_{module}
        """
        tenant_id = user.tenant_id
        created = 0
        errors: list[str] = []

        # ── helpers ──
        def _v(row: dict, *keys: str) -> str:
            low = {k.lower().strip(): v for k, v in row.items()}
            for k in keys:
                v = low.get(k.lower())
                if v:
                    return str(v).strip()
            return ""

        # ── organisation (upsert step1) ──
        if module_key == "organisation":
            for row in rows[:1]:  # only first row matters for org details
                payload = {
                    "organizationName":    _v(row, "organisation name", "org name", "name"),
                    "industryType":        _v(row, "industry type", "industry"),
                    "employeeCount":       _v(row, "employee count", "employees"),
                    "officialEmail":       _v(row, "official email", "email"),
                    "contactNumber":       _v(row, "contact number", "phone", "contact"),
                    "country":             _v(row, "country"),
                    "headquartersAddress": _v(row, "hq address", "address"),
                }
                payload = {k: v for k, v in payload.items() if v}
                self._upsert(tenant_id, "step1_org_details", payload)
                created = 1
            return {"module": module_key, "status": "imported", "count": created}

        # ── sites (same as step3/bulk) ──
        if module_key == "sites":
            for row in rows:
                name = _v(row, "site name", "name")
                if not name:
                    continue
                self.repo.create(
                    tenant_id=tenant_id, module=MODULE, record_type="step3_site",
                    payload={
                        "name":    name,
                        "type":    _v(row, "site type", "type") or "Site",
                        "address": _v(row, "address", "location"),
                        "region":  _v(row, "region"),
                        "hazard":  _v(row, "hazard level", "hazard"),
                    },
                    status="active",
                )
                created += 1
            return {"module": module_key, "status": "imported", "count": created}

        # ── users (same as step4/bulk + employee sync) ──
        if module_key == "users":
            for row in rows:
                email = _v(row, "email", "email address")
                if not email:
                    continue
                payload = {
                    "name":       _v(row, "full name", "name"),
                    "email":      email,
                    "role":       _v(row, "role", "job title", "position") or "Worker",
                    "department": _v(row, "department", "dept", "team"),
                }
                rec = self.repo.create(
                    tenant_id=tenant_id, module=MODULE, record_type="step4_user",
                    payload=payload, status="pending",
                )
                self._sync_user_to_employees(tenant_id, payload, rec.id)
                created += 1
            return {"module": module_key, "status": "imported", "count": created}

        # ── departments ──
        if module_key == "departments":
            for row in rows:
                name = _v(row, "department name", "name")
                if not name:
                    continue
                self.repo.create(
                    tenant_id=tenant_id, module=MODULE, record_type="org_department",
                    payload={
                        "name":    name,
                        "manager": _v(row, "manager name", "manager"),
                        "teams":   _v(row, "number of teams", "teams"),
                        "site":    _v(row, "assigned site", "site"),
                    },
                    status="active",
                )
                created += 1
            return {"module": module_key, "status": "imported", "count": created}

        # ── roles ──
        if module_key == "roles":
            for row in rows:
                name = _v(row, "role name", "name")
                if not name:
                    continue
                self.repo.create(
                    tenant_id=tenant_id, module=MODULE, record_type="org_role",
                    payload={
                        "name":        name,
                        "description": _v(row, "description"),
                        "level":       _v(row, "access level", "level"),
                        "modules":     _v(row, "module access", "modules"),
                    },
                    status="active",
                )
                created += 1
            return {"module": module_key, "status": "imported", "count": created}

        # ── incidents → real Incident records + generic backup ──
        if module_key == "incidents":
            try:
                from app.models.incidents import Incident
                import random as _rand
                for row in rows:
                    payload = {
                        "incident_type": _v(row, "incident type", "type") or "incident_report",
                        "severity":      _v(row, "severity") or "unclassified",
                        "description":   _v(row, "description") or "",
                        "location_id":   _v(row, "location", "location / station"),
                        "occurred_at":   _v(row, "incident date", "date"),
                    }
                    inc = Incident(
                        id=str(uuid4()),
                        tenant_id=tenant_id,
                        incident_ref=f"INC-{_rand.randint(10000, 99999)}",
                        reporter_user_id=user.user_id,
                        incident_type=payload["incident_type"],
                        severity=payload["severity"],
                        description=payload["description"],
                        is_confidential=False,
                        status="reported",
                    )
                    self.db.add(inc)
                    created += 1
                self.db.flush()
            except Exception as exc:
                errors.append(f"Incident domain save failed: {exc}")
            return {"module": module_key, "status": "imported", "count": created, "errors": errors}

        # ── risk assessments → RiskAssessment records ──
        if module_key == "risk":
            try:
                from app.models.domain import RiskAssessment
                for row in rows:
                    hazard = _v(row, "hazard description", "hazard")
                    if not hazard:
                        continue
                    likelihood  = int(_v(row, "likelihood (1-5)", "likelihood") or 1)
                    consequence = int(_v(row, "consequence (1-5)", "consequence") or 1)
                    ra = RiskAssessment(
                        id=str(uuid4()),
                        tenant_id=tenant_id,
                        hazard_description=hazard,
                        task_name=hazard[:100],
                        likelihood=likelihood,
                        consequence=consequence,
                        risk_score=likelihood * consequence,
                        status="draft",
                    )
                    self.db.add(ra)
                    created += 1
                self.db.flush()
            except Exception as exc:
                errors.append(f"Risk domain save failed: {exc}")
            return {"module": module_key, "status": "imported", "count": created, "errors": errors}

        # ── all other modules → store in generic_records ──
        record_type = f"org_import_{module_key}"
        for row in rows:
            if not any(v for v in row.values()):
                continue
            self.repo.create(
                tenant_id=tenant_id, module=MODULE, record_type=record_type,
                payload=dict(row), status="imported",
            )
            created += 1
        return {"module": module_key, "status": "imported", "count": created, "errors": errors}

    def list_imports(self, user: CurrentUser) -> dict:
        records = self.repo.list_by_type(user.tenant_id, MODULE, "step6a_import")
        return {
            "items": [{"id": r.id, "status": r.status, **r.payload} for r in records],
            "total": len(records),
        }

    # ── step 7: ai config ─────────────────────────────────────────────────────

    def save_step7(self, user: CurrentUser, data: dict) -> dict:
        err = self._check_prerequisite(user.tenant_id, 6)
        if err:
            return err
        record = self._upsert(user.tenant_id, "step7_ai_config", data)
        return {"step": 7, "status": "saved", "record_id": record.id}

    def get_step7(self, user: CurrentUser) -> dict:
        record = self._first(user.tenant_id, "step7_ai_config")
        return record.payload if record else {}

    # ── activate (step 8) ─────────────────────────────────────────────────────

    def activate(self, user: CurrentUser, data: dict) -> dict:
        if not data.get("confirmed", False):
            return {"error": "Activation requires confirmed=true"}

        # Only require step 1 (org details) to activate; other steps are optional
        err = self._check_prerequisite(user.tenant_id, 1)
        if err:
            return {
                "error": f"Cannot activate: {err['error']}",
                "prerequisite_step": err["prerequisite_step"],
            }

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

        # Sync all step4_user records into employees table (idempotent)
        step4_records = self.repo.list_by_type(user.tenant_id, MODULE, "step4_user", limit=500)
        for rec in step4_records:
            self._sync_user_to_employees(user.tenant_id, rec.payload, rec.id)

        return {
            "status": "activated",
            "tenant_id": user.tenant_id,
            "modules_enabled": MODULES_ENABLED,
            "dashboard_url": "/",
            "message": "Organization activated successfully",
        }
