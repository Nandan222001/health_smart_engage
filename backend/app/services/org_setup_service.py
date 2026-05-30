from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import CurrentUser
from app.models.generic_record import GenericRecord
from app.models.people import Employee
from app.models.tenant import Tenant
from app.repositories.generic_repository import GenericRepository

MODULE = "org_setup"

# Known core columns per module — anything not listed ends up in extra_fields.
# Keys are lowercased & stripped for matching.
_KNOWN: dict[str, set[str]] = {
    "organisation": {
        "organisation name", "org name", "name", "industry type", "industry",
        "employee count", "employees", "official email", "email",
        "contact number", "phone", "contact", "country",
        "hq address", "address",
    },
    "sites": {
        "site id", "site_id", "siteid",
        "site name", "name", "site_name", "sitename", "facility name", "facility", "site",
        "site type", "type", "operational status", "operational_status", "category",
        "address", "location", "city", "town", "postcode", "post code", "zip", "postal code",
        "region", "area",
        "capacity", "number_of_working_stations", "stations",
        "hazard classification", "hazard_classification", "hazard level", "hazard",
        "status", "primary_products", "primary products",
    },
    "users": {
        "full name", "name", "email", "email address",
        "role", "job title", "position", "department", "dept", "team",
    },
    "employees": {
        "full name", "name", "employee code", "code",
        "role", "job title", "position", "department", "dept",
        "contact", "phone", "status",
    },
    "departments": {
        "department name", "name", "manager name", "manager",
        "number of teams", "teams", "assigned site", "site",
    },
    "roles": {
        "role name", "name", "description", "access level", "level",
        "module access", "modules",
    },
    "vendors": {
        "company name", "name", "vendor name", "contact", "email",
        "phone", "trade type", "type", "status", "site", "site location",
        "total workers", "workers", "contract expiry",
    },
    "assets": {
        "asset code", "code", "name", "asset name", "description",
        "category", "location", "criticality", "manufacturer",
        "serial number", "serial", "status", "purchase date",
        "last maintenance", "next maintenance",
    },
    "incidents": {
        "incident type", "type", "severity", "description",
        "location", "location / station", "incident date", "date",
    },
    "risk": {
        "risk id", "hazard", "hazard description", "hazard / risk description",
        "risk description", "location", "location / station",
        "consequence description", "probability (1-5)", "probability",
        "likelihood (1-5)", "likelihood", "consequence (1-5)", "consequence",
        "inherent score", "inherent risk score", "risk score", "initial score",
        "residual score", "residual risk score", "residual",
        "status",
    },
    "training": {
        "module code", "module title", "course name", "training name", "name",
        "duration (hours)", "duration", "trainer required",
        "assessment type", "competency framework",
        "role", "target role", "job title",
        "frequency months", "frequency", "validity period (months)", "validity period",
        "mandatory", "required", "annual refresher required",
        "due date", "review date", "next due", "next review date",
    },
}

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

    @staticmethod
    def _split_row(module_key: str, row: dict) -> tuple[dict, dict | None]:
        """Split a row dict into (core_fields, extra_fields | None).
        core_fields contains only columns known to the template.
        extra_fields contains any additional org-specific columns, or None if empty.
        """
        known = _KNOWN.get(module_key, set())
        core: dict = {}
        extra: dict = {}
        for k, v in row.items():
            if k.lower().strip() in known:
                core[k] = v
            else:
                extra[k] = v
        return core, (extra if extra else None)

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

    def _sync_user_to_employees(
        self, tenant_id: str, payload: dict, record_id: str, extra_fields: dict | None = None
    ) -> None:
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
            if extra_fields:
                existing.extra_fields = {**(existing.extra_fields or {}), **extra_fields}
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
                extra_fields=extra_fields,
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
            "items": [
                {
                    "id": r.id,
                    "status": r.status,
                    "uploadedAt": r.created_at.isoformat() if r.created_at else None,
                    **r.payload,
                }
                for r in records
            ],
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
        # normalise Step-6 UI keys to canonical handler keys
        _ALIASES = {
            "incident_records": "incidents",
            "permit_records": "permits",
            "audit_reports": "audits",
            "training_records": "training",
            "sops_policies": "compliance",
            "risk_assessments": "risk",
            "capa_data": "capa",
            "contractor_records": "vendors",
        }
        module_key = _ALIASES.get(module_key, module_key)

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
            if not rows:
                return {"module": module_key, "status": "imported", "count": 0,
                        "errors": ["No rows found in file. Check that the file has data and a valid header row."]}
            for row in rows:
                name = _v(row, "site name", "name", "site_name", "sitename",
                          "facility name", "facility", "site")
                if not name:
                    errors.append(f"Skipped row (no site name found). Columns detected: {list(row.keys())[:5]}")
                    continue
                _, extra = self._split_row("sites", row)
                site_id = _v(row, "site id", "site_id", "id", "siteid")
                core_payload = {
                    "name":    name,
                    "type":    _v(row, "site type", "type", "operational status",
                                  "operational_status", "category") or "Site",
                    "address": _v(row, "address", "location"),
                    "city":    _v(row, "city", "town"),
                    "postcode": _v(row, "postcode", "post code", "zip", "postal code"),
                    "region":  _v(row, "region", "city", "area"),
                    "status":  _v(row, "operational status", "operational_status", "status") or "Active",
                    "capacity": _v(row, "capacity", "number_of_working_stations", "stations"),
                    "hazard":  _v(row, "hazard classification", "hazard_classification",
                                  "hazard level", "hazard"),
                }
                if site_id:
                    core_payload["site_id"] = site_id
                if extra:
                    core_payload["extra_fields"] = extra
                self.repo.create(
                    tenant_id=tenant_id, module=MODULE, record_type="step3_site",
                    payload=core_payload, status="active",
                )
                created += 1
            return {"module": module_key, "status": "imported", "count": created, "errors": errors[:5]}

        # ── users (same as step4/bulk + employee sync) ──
        if module_key == "users":
            for row in rows:
                email = _v(row, "email", "email address")
                if not email:
                    continue
                _, extra = self._split_row("users", row)
                payload = {
                    "name":       _v(row, "full name", "name"),
                    "email":      email,
                    "role":       _v(row, "role", "job title", "position") or "Worker",
                    "department": _v(row, "department", "dept", "team"),
                }
                if extra:
                    payload["extra_fields"] = extra
                rec = self.repo.create(
                    tenant_id=tenant_id, module=MODULE, record_type="step4_user",
                    payload=payload, status="pending",
                )
                self._sync_user_to_employees(tenant_id, payload, rec.id, extra_fields=extra)
                created += 1
            return {"module": module_key, "status": "imported", "count": created}

        # ── departments ──
        if module_key == "departments":
            for row in rows:
                name = _v(row, "department name", "name")
                if not name:
                    continue
                _, extra = self._split_row("departments", row)
                core_payload = {
                    "name":    name,
                    "manager": _v(row, "manager name", "manager"),
                    "teams":   _v(row, "number of teams", "teams"),
                    "site":    _v(row, "assigned site", "site"),
                }
                if extra:
                    core_payload["extra_fields"] = extra
                self.repo.create(
                    tenant_id=tenant_id, module=MODULE, record_type="org_department",
                    payload=core_payload, status="active",
                )
                created += 1
            return {"module": module_key, "status": "imported", "count": created}

        # ── roles ──
        if module_key == "roles":
            for row in rows:
                name = _v(row, "role name", "name")
                if not name:
                    continue
                _, extra = self._split_row("roles", row)
                core_payload = {
                    "name":        name,
                    "description": _v(row, "description"),
                    "level":       _v(row, "access level", "level"),
                    "modules":     _v(row, "module access", "modules"),
                }
                if extra:
                    core_payload["extra_fields"] = extra
                self.repo.create(
                    tenant_id=tenant_id, module=MODULE, record_type="org_role",
                    payload=core_payload, status="active",
                )
                created += 1
            return {"module": module_key, "status": "imported", "count": created}

        # ── incidents → real Incident records + generic backup ──
        if module_key == "incidents":
            try:
                from app.models.incidents import Incident
                import random as _rand
                for row in rows:
                    _, extra = self._split_row("incidents", row)
                    inc = Incident(
                        id=str(uuid4()),
                        tenant_id=tenant_id,
                        incident_ref=f"INC-{_rand.randint(10000, 99999)}",
                        reporter_user_id=user.user_id,
                        incident_type=_v(row, "incident type", "type") or "incident_report",
                        severity=_v(row, "severity") or "unclassified",
                        description=_v(row, "description") or "",
                        is_confidential=False,
                        status="reported",
                        extra_fields=extra,
                    )
                    self.db.add(inc)
                    created += 1
                self.db.flush()
            except Exception as exc:
                errors.append(f"Incident domain save failed: {exc}")
            return {"module": module_key, "status": "imported", "count": created, "errors": errors}

        # ── risk assessments → RiskAssessment records ──
        if module_key in ("risk", "risk_assessments"):
            try:
                from app.models.risks import RiskAssessment
                for row in rows:
                    hazard = _v(
                        row,
                        "hazard", "hazard description", "hazard / risk description",
                        "risk description", "description",
                    )
                    if not hazard:
                        continue
                    _, extra = self._split_row("risk", row)

                    # Likelihood / probability
                    raw_likelihood = _v(row, "probability (1-5)", "likelihood (1-5)", "likelihood", "probability")
                    likelihood = max(1, min(5, int(float(raw_likelihood or 1))))

                    # Inherent (initial) risk score
                    raw_inherent = _v(row, "inherent score", "inherent risk score", "risk score", "initial score")
                    inherent = int(float(raw_inherent)) if raw_inherent else likelihood

                    # Derive consequence: inherent_score / likelihood
                    consequence = max(1, round(inherent / likelihood)) if likelihood else 1

                    # Residual risk score
                    raw_residual = _v(row, "residual score", "residual risk score", "residual")
                    residual = int(float(raw_residual)) if raw_residual else None

                    ra = RiskAssessment(
                        id=str(uuid4()),
                        tenant_id=tenant_id,
                        task_name=_v(row, "risk id", "id", "risk id / hazard") or hazard[:100],
                        location_id=_v(row, "location", "location / station") or None,
                        hazard_description=hazard,
                        likelihood=likelihood,
                        consequence=consequence,
                        risk_score=inherent,
                        residual_risk_score=residual,
                        status=_v(row, "status") or "draft",
                        extra_fields=extra or None,
                    )
                    self.db.add(ra)
                    created += 1
                self.db.flush()
            except Exception as exc:
                errors.append(f"Risk domain save failed: {exc}")
            return {"module": module_key, "status": "imported", "count": created, "errors": errors}

        # ── assets → real Asset records ──
        if module_key == "assets":
            try:
                from app.models.assets import Asset
                for row in rows:
                    name = _v(row, "asset name", "name")
                    if not name:
                        continue
                    _, extra = self._split_row("assets", row)
                    asset = Asset(
                        id=str(uuid4()),
                        tenant_id=tenant_id,
                        asset_code=_v(row, "asset code", "code") or f"AST-{str(uuid4())[:8].upper()}",
                        name=name,
                        description=_v(row, "description"),
                        category=_v(row, "category") or "General",
                        location=_v(row, "location"),
                        criticality=_v(row, "criticality") or "medium",
                        manufacturer=_v(row, "manufacturer"),
                        serial_number=_v(row, "serial number", "serial"),
                        status=_v(row, "status") or "Active",
                        extra_fields=extra,
                    )
                    self.db.add(asset)
                    created += 1
                self.db.flush()
            except Exception as exc:
                errors.append(f"Asset domain save failed: {exc}")
            return {"module": module_key, "status": "imported", "count": created, "errors": errors}

        # ── vendors → real Vendor records ──
        if module_key == "vendors":
            try:
                from app.models.vendors import Vendor
                for row in rows:
                    name = _v(row, "company name", "vendor name", "name")
                    if not name:
                        continue
                    _, extra = self._split_row("vendors", row)
                    vendor = Vendor(
                        id=str(uuid4()),
                        tenant_id=tenant_id,
                        company_name=name,
                        contact=_v(row, "contact"),
                        email=_v(row, "email"),
                        phone=_v(row, "phone"),
                        trade_type=_v(row, "trade type", "type") or "General",
                        status=_v(row, "status") or "Pending",
                        site_location=_v(row, "site", "site location"),
                        extra_fields=extra,
                    )
                    self.db.add(vendor)
                    created += 1
                self.db.flush()
            except Exception as exc:
                errors.append(f"Vendor domain save failed: {exc}")
            return {"module": module_key, "status": "imported", "count": created, "errors": errors}

        # ── permits → real Permit records ──
        if module_key in ("permits", "permit_records"):
            try:
                from app.models.permits import Permit
                import random as _rand
                for row in rows:
                    ptype = _v(row, "permit type", "type") or "General"
                    _, extra = self._split_row("permits", row)
                    permit = Permit(
                        id=str(uuid4()),
                        tenant_id=tenant_id,
                        permit_ref=_v(row, "permit ref", "permit id", "ref") or f"PTW-{_rand.randint(10000, 99999)}",
                        permit_type=ptype,
                        title=_v(row, "title", "description", "work description") or ptype,
                        requester_user_id=user.user_id,
                        status=_v(row, "status") or "closed",
                        extra_fields=extra,
                    )
                    self.db.add(permit)
                    created += 1
                self.db.flush()
            except Exception as exc:
                errors.append(f"Permit domain save failed: {exc}")
            return {"module": module_key, "status": "imported", "count": created, "errors": errors}

        # ── near_miss → Incident with type=near_miss ──
        if module_key == "near_miss":
            try:
                from app.models.incidents import Incident
                import random as _rand
                for row in rows:
                    _, extra = self._split_row("incidents", row)
                    inc = Incident(
                        id=str(uuid4()),
                        tenant_id=tenant_id,
                        incident_ref=_v(row, "ref", "near miss id", "id") or f"NM-{_rand.randint(10000, 99999)}",
                        reporter_user_id=user.user_id,
                        incident_type="near_miss",
                        severity=_v(row, "severity") or "unclassified",
                        description=_v(row, "description", "summary") or "",
                        is_confidential=False,
                        status="reported",
                        extra_fields=extra,
                    )
                    self.db.add(inc)
                    created += 1
                self.db.flush()
            except Exception as exc:
                errors.append(f"Near miss domain save failed: {exc}")
            return {"module": module_key, "status": "imported", "count": created, "errors": errors}

        # ── capa → real Capa records ──
        if module_key in ("capa", "capa_data"):
            try:
                from app.models.compliance import Capa
                for row in rows:
                    _, extra = self._split_row("capa", row)
                    import datetime as _dt
                    raw_due = _v(row, "due date", "due")
                    due_date = None
                    if raw_due:
                        try:
                            due_date = _dt.date.fromisoformat(str(raw_due)[:10])
                        except Exception:
                            pass
                    capa = Capa(
                        id=str(uuid4()),
                        tenant_id=tenant_id,
                        source_type=_v(row, "source type", "source") or "import",
                        owner_user_id=user.user_id,
                        title=_v(row, "title", "action", "description"),
                        description=_v(row, "description"),
                        root_cause=_v(row, "root cause"),
                        corrective_action=_v(row, "corrective action", "action"),
                        due_date=due_date,
                        status=_v(row, "status") or "open",
                        extra_fields=extra,
                    )
                    self.db.add(capa)
                    created += 1
                self.db.flush()
            except Exception as exc:
                errors.append(f"CAPA domain save failed: {exc}")
            return {"module": module_key, "status": "imported", "count": created, "errors": errors}

        # ── audits → real AuditExecution records ──
        if module_key in ("audits", "audit_reports"):
            try:
                from app.models.compliance import AuditExecution
                import datetime as _dt
                for row in rows:
                    _, extra = self._split_row("audits", row)
                    raw_date = _v(row, "audit date", "date", "scheduled date")
                    sched_date = None
                    if raw_date:
                        try:
                            sched_date = _dt.date.fromisoformat(str(raw_date)[:10])
                        except Exception:
                            pass
                    audit = AuditExecution(
                        id=str(uuid4()),
                        tenant_id=tenant_id,
                        auditor_user_id=user.user_id,
                        title=_v(row, "title", "audit name", "description"),
                        audit_type=_v(row, "audit type", "type") or "General Audit",
                        status=_v(row, "status") or "completed",
                        scheduled_date=sched_date,
                        completed_date=sched_date,
                        extra_fields=extra,
                    )
                    self.db.add(audit)
                    created += 1
                self.db.flush()
            except Exception as exc:
                errors.append(f"Audit domain save failed: {exc}")
            return {"module": module_key, "status": "imported", "count": created, "errors": errors}

        # ── training → TrainingRequirement records ──
        if module_key in ("training", "training_records"):
            try:
                from app.models.people import TrainingRequirement
                for row in rows:
                    training_name = _v(
                        row,
                        "module title", "course name", "training name",
                        "module code", "name",
                    ) or "Training"
                    role_name = _v(
                        row,
                        "role", "target role", "job title", "competency framework",
                    ) or "All"
                    raw_validity = _v(
                        row,
                        "validity period (months)", "validity period",
                        "frequency months", "frequency",
                    )
                    validity_days: int | None = None
                    if raw_validity:
                        try:
                            validity_days = int(float(raw_validity)) * 30
                        except (ValueError, TypeError):
                            pass
                    is_mandatory = _v(
                        row, "mandatory", "required", "annual refresher required",
                    ).lower() in ("yes", "true", "1", "y")
                    tr = TrainingRequirement(
                        id=str(uuid4()),
                        tenant_id=tenant_id,
                        training_name=training_name,
                        role_name=role_name,
                        validity_days=validity_days,
                        is_mandatory=is_mandatory,
                    )
                    self.db.add(tr)
                    created += 1
                self.db.flush()
            except Exception as exc:
                errors.append(f"Training domain save failed: {exc}")
            return {"module": module_key, "status": "imported", "count": created, "errors": errors}

        # ── compliance documents / SOPs / policies ──
        if module_key in ("compliance", "sops_policies"):
            try:
                from app.models.compliance import ComplianceDocument
                for row in rows:
                    _, extra = self._split_row("compliance", row)
                    doc = ComplianceDocument(
                        id=str(uuid4()),
                        tenant_id=tenant_id,
                        title=_v(row, "title", "document name", "name") or "Policy",
                        document_type=_v(row, "document type", "type") or "Policy",
                        version=_v(row, "version") or "1.0",
                        status=_v(row, "status") or "Active",
                        description=_v(row, "description", "summary"),
                        created_by=user.user_id,
                    )
                    self.db.add(doc)
                    created += 1
                self.db.flush()
            except Exception as exc:
                errors.append(f"Compliance document save failed: {exc}")
            return {"module": module_key, "status": "imported", "count": created, "errors": errors}

        # ── all other modules → store in generic_records ──
        record_type = f"org_import_{module_key}"
        for row in rows:
            if not any(v for v in row.values()):
                continue
            _, extra = self._split_row(module_key, row)
            payload = dict(row)
            if extra:
                payload["extra_fields"] = extra
            self.repo.create(
                tenant_id=tenant_id, module=MODULE, record_type=record_type,
                payload=payload, status="imported",
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
