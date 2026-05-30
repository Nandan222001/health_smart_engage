from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import CurrentUser
from app.models.people import Employee
from app.models.sites import Site
from app.models.tenant import Tenant
from app.models.knowledge import KnowledgeDocument
from app.models.org_setup_data import (
    OrgProfile, OrgComplianceSetup, OrgWorkflowConfig, OrgAIConfig,
    OrgActivation, Department, OrgCustomRole, OrgUserRecord, OrgImportRecord,
)

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
        self.db = db

    # ── helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _split_row(module_key: str, row: dict) -> tuple[dict, dict | None]:
        known = _KNOWN.get(module_key, set())
        core: dict = {}
        extra: dict = {}
        for k, v in row.items():
            if k.lower().strip() in known:
                core[k] = v
            else:
                extra[k] = v
        return core, (extra if extra else None)

    def _get_org_profile(self, tenant_id: str) -> OrgProfile | None:
        return self.db.scalars(select(OrgProfile).where(OrgProfile.tenant_id == tenant_id).limit(1)).first()

    def _get_compliance_setup(self, tenant_id: str) -> OrgComplianceSetup | None:
        return self.db.scalars(select(OrgComplianceSetup).where(OrgComplianceSetup.tenant_id == tenant_id).limit(1)).first()

    def _get_workflow_config(self, tenant_id: str) -> OrgWorkflowConfig | None:
        return self.db.scalars(select(OrgWorkflowConfig).where(OrgWorkflowConfig.tenant_id == tenant_id).limit(1)).first()

    def _get_ai_config(self, tenant_id: str) -> OrgAIConfig | None:
        return self.db.scalars(select(OrgAIConfig).where(OrgAIConfig.tenant_id == tenant_id).limit(1)).first()

    def _get_activation(self, tenant_id: str) -> OrgActivation | None:
        return self.db.scalars(select(OrgActivation).where(OrgActivation.tenant_id == tenant_id).limit(1)).first()

    def _check_prerequisite(self, tenant_id: str, required_step: int) -> dict | None:
        step_names = {1: "Organization Details", 2: "Compliance Setup", 3: "Sites Setup",
                      4: "Users Setup", 5: "Workflow Configuration", 6: "Knowledge & Data Import", 7: "AI Configuration"}

        def _is_complete(step: int) -> bool:
            if step == 1:
                p = self._get_org_profile(tenant_id)
                # Profile must exist AND have a non-empty org name to count as complete
                return p is not None and bool(p.organization_name and p.organization_name.strip())
            if step == 2: return self._get_compliance_setup(tenant_id) is not None
            if step == 3: return self.db.scalars(select(Site).where(Site.tenant_id == tenant_id).limit(1)).first() is not None
            if step == 4: return self.db.scalars(select(OrgUserRecord).where(OrgUserRecord.tenant_id == tenant_id).limit(1)).first() is not None
            if step == 5: return self._get_workflow_config(tenant_id) is not None
            if step == 6:
                has_doc = self.db.scalars(select(KnowledgeDocument).where(KnowledgeDocument.tenant_id == tenant_id).limit(1)).first() is not None
                has_import = self.db.scalars(select(OrgImportRecord).where(OrgImportRecord.tenant_id == tenant_id).limit(1)).first() is not None
                return has_doc or has_import
            if step == 7: return self._get_ai_config(tenant_id) is not None
            return False

        if not _is_complete(required_step):
            name = step_names.get(required_step, f"Step {required_step}")
            return {"error": f"Step {required_step} ({name}) must be completed before proceeding.", "prerequisite_step": required_step}
        return None

    # ── progress ─────────────────────────────────────────────────────────────

    def get_progress(self, user: CurrentUser) -> dict:
        tenant_id = user.tenant_id

        org_profile = self._get_org_profile(tenant_id)
        compliance = self._get_compliance_setup(tenant_id)
        workflow = self._get_workflow_config(tenant_id)
        ai_cfg = self._get_ai_config(tenant_id)
        activation = self._get_activation(tenant_id)

        has_sites = self.db.scalars(select(Site).where(Site.tenant_id == tenant_id).limit(1)).first() is not None
        has_users = self.db.scalars(select(OrgUserRecord).where(OrgUserRecord.tenant_id == tenant_id).limit(1)).first() is not None
        has_docs = self.db.scalars(select(KnowledgeDocument).where(KnowledgeDocument.tenant_id == tenant_id).limit(1)).first() is not None
        has_imports = self.db.scalars(select(OrgImportRecord).where(OrgImportRecord.tenant_id == tenant_id).limit(1)).first() is not None

        step_status = {
            1: org_profile is not None and bool(org_profile.organization_name and org_profile.organization_name.strip()),
            2: compliance is not None,
            3: has_sites,
            4: has_users,
            5: workflow is not None,
            6: has_docs or has_imports,
            7: ai_cfg is not None,
            8: activation is not None,
        }

        steps_completed = [s for s, done in step_status.items() if done]
        activated = activation is not None and activation.confirmed

        def _profile_data(p: OrgProfile | None) -> dict:
            if not p: return {}
            return {"organizationName": p.organization_name, "industryType": p.industry_type, "employeeCount": p.employee_count, "officialEmail": p.official_email, "contactNumber": p.contact_number, "country": p.country, "headquartersAddress": p.headquarters_address}

        step_details = {
            "step1": {"completed": org_profile is not None, "data": _profile_data(org_profile)},
            "step2": {"completed": compliance is not None, "data": {"standards": (compliance.standards or {}), "modules": (compliance.modules_enabled or {})} if compliance else {}},
            "step3": {"completed": has_sites, "data": {}},
            "step4": {"completed": has_users, "data": {}},
            "step5": {"completed": workflow is not None, "data": {}},
            "step6": {"completed": has_docs, "data": {}},
            "step6a": {"completed": has_imports, "data": {}},
            "step7": {"completed": ai_cfg is not None, "data": {}},
            "step8": {"completed": activated, "data": {}},
        }

        total = len(ALL_STEPS)
        percent = round(len(steps_completed) / total * 100)

        return {"steps_completed": steps_completed, "steps_total": total, "percent": percent, "activated": activated, "step_details": step_details}

    # ── step 1: org details ───────────────────────────────────────────────────

    def save_step1(self, user: CurrentUser, data: dict) -> dict:
        existing = self._get_org_profile(user.tenant_id)
        if existing:
            existing.organization_name = data.get("organizationName", data.get("organization_name", existing.organization_name))
            existing.industry_type = data.get("industryType", data.get("industry_type", existing.industry_type))
            existing.employee_count = data.get("employeeCount", data.get("employee_count", existing.employee_count))
            existing.official_email = data.get("officialEmail", data.get("official_email", existing.official_email))
            existing.contact_number = data.get("contactNumber", data.get("contact_number", existing.contact_number))
            existing.country = data.get("country", existing.country)
            existing.headquarters_address = data.get("headquartersAddress", data.get("headquarters_address", existing.headquarters_address))
            existing.extra_fields = {k: v for k, v in data.items() if k not in ("organizationName","organization_name","industryType","industry_type","employeeCount","employee_count","officialEmail","official_email","contactNumber","contact_number","country","headquartersAddress","headquarters_address")} or None
            self.db.flush()
            return {"step": 1, "status": "saved", "record_id": existing.id}
        profile = OrgProfile(
            id=str(uuid4()), tenant_id=user.tenant_id,
            organization_name=data.get("organizationName", data.get("organization_name")),
            industry_type=data.get("industryType", data.get("industry_type")),
            employee_count=str(data["employeeCount"]) if data.get("employeeCount") else (str(data["employee_count"]) if data.get("employee_count") else None),
            official_email=data.get("officialEmail", data.get("official_email")),
            contact_number=data.get("contactNumber", data.get("contact_number")),
            country=data.get("country"),
            headquarters_address=data.get("headquartersAddress", data.get("headquarters_address")),
            extra_fields={k: v for k, v in data.items() if k not in ("organizationName","organization_name","industryType","industry_type","employeeCount","employee_count","officialEmail","official_email","contactNumber","contact_number","country","headquartersAddress","headquarters_address")} or None,
        )
        self.db.add(profile)
        self.db.flush()
        return {"step": 1, "status": "saved", "record_id": profile.id}

    def get_step1(self, user: CurrentUser) -> dict:
        p = self._get_org_profile(user.tenant_id)
        if not p: return {}
        result = {
            "organizationName": p.organization_name,
            "industryType": p.industry_type,
            "employeeCount": p.employee_count,
            "officialEmail": p.official_email,
            "contactNumber": p.contact_number,
            "country": p.country,
            "headquartersAddress": p.headquarters_address,
        }
        if p.extra_fields:
            result.update(p.extra_fields)
        return result

    # ── step 2: compliance ────────────────────────────────────────────────────

    def save_step2(self, user: CurrentUser, data: dict) -> dict:
        err = self._check_prerequisite(user.tenant_id, 1)
        if err: return err
        # Frontend sends applicableStandards; normalise to standards
        standards = data.get("standards") or data.get("applicableStandards")
        modules = data.get("modules_enabled") or data.get("modulesEnabled")
        core_keys = {"standards", "applicableStandards", "modules_enabled", "modulesEnabled"}
        extra = {k: v for k, v in data.items() if k not in core_keys} or None
        existing = self._get_compliance_setup(user.tenant_id)
        if existing:
            if standards is not None:
                existing.standards = standards
            if modules is not None:
                existing.modules_enabled = modules
            existing.extra_fields = extra
            self.db.flush()
            return {"step": 2, "status": "saved", "record_id": existing.id}
        rec = OrgComplianceSetup(
            id=str(uuid4()), tenant_id=user.tenant_id,
            standards=standards,
            modules_enabled=modules,
            extra_fields=extra,
        )
        self.db.add(rec); self.db.flush()
        return {"step": 2, "status": "saved", "record_id": rec.id}

    def get_step2(self, user: CurrentUser) -> dict:
        c = self._get_compliance_setup(user.tenant_id)
        if not c: return {}
        result = {
            "applicableStandards": c.standards or [],
            "modulesEnabled": c.modules_enabled or {},
        }
        if c.extra_fields:
            result.update(c.extra_fields)
        return result

    # ── step 3: sites ─────────────────────────────────────────────────────────

    def _site_to_dict(self, s: Site) -> dict:
        return {
            "id": s.id,
            "name": s.name,
            "type": s.site_type,
            "site_type": s.site_type,
            "address": s.address,
            "city": s.city,
            "postcode": s.postcode,
            "region": s.region,
            "status": s.status,
            "capacity": s.capacity,
            "hazard_level": s.hazard_level,
            "extra_fields": s.extra_fields,
            "created_at": str(s.created_at) if s.created_at else None,
        }

    def create_site(self, user: CurrentUser, data: dict) -> dict:
        err = self._check_prerequisite(user.tenant_id, 2)
        if err:
            return err
        site = Site(
            id=str(uuid4()),
            tenant_id=user.tenant_id,
            name=data.get("name", data.get("site_name", "Unnamed Site")),
            site_type=data.get("type", data.get("site_type", "Site")),
            address=data.get("address"),
            city=data.get("city"),
            postcode=data.get("postcode"),
            region=data.get("region"),
            status=data.get("status", "Active"),
            capacity=int(data["capacity"]) if data.get("capacity") else None,
            hazard_level=data.get("hazard_level", data.get("hazard")),
            extra_fields={k: v for k, v in data.items()
                          if k not in ("name", "site_name", "type", "site_type", "address",
                                       "city", "postcode", "region", "status", "capacity",
                                       "hazard_level", "hazard")} or None,
        )
        self.db.add(site)
        self.db.flush()
        return {"step": 3, "status": "created", "record_id": site.id, "site_id": site.id}

    def bulk_upload_sites(self, user: CurrentUser, data: dict) -> dict:
        sites_data = data.get("sites", [])
        created_ids = []
        for s in sites_data:
            site = Site(
                id=str(uuid4()),
                tenant_id=user.tenant_id,
                name=s.get("name", s.get("site_name", "Unnamed Site")),
                site_type=s.get("type", s.get("site_type", "Site")),
                address=s.get("address"),
                city=s.get("city"),
                postcode=s.get("postcode"),
                region=s.get("region"),
                status=s.get("status", "Active"),
                capacity=int(s["capacity"]) if s.get("capacity") else None,
                hazard_level=s.get("hazard_level", s.get("hazard")),
            )
            self.db.add(site)
            created_ids.append(site.id)
        self.db.flush()
        return {"step": 3, "status": "bulk_uploaded", "count": len(created_ids), "record_ids": created_ids}

    def list_sites(self, user: CurrentUser) -> dict:
        from sqlalchemy import select as _sel
        sites = self.db.scalars(
            _sel(Site).where(Site.tenant_id == user.tenant_id).order_by(Site.name)
        ).all()
        return {
            "items": [self._site_to_dict(s) for s in sites],
            "total": len(sites),
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
        if err: return err
        our = OrgUserRecord(
            id=str(uuid4()), tenant_id=user.tenant_id,
            name=data.get("name"), email=data.get("email", ""),
            role=data.get("role"), department=data.get("department"),
            status="pending",
            extra_fields={k: v for k, v in data.items() if k not in ("name","email","role","department","status")} or None,
        )
        self.db.add(our); self.db.flush()
        self._sync_user_to_employees(user.tenant_id, data, our.id)
        return {"step": 4, "status": "created", "record_id": our.id, "user_id": our.id}

    def bulk_upload_users(self, user: CurrentUser, data: dict) -> dict:
        users = data.get("users", [])
        created_ids = []
        for u in users:
            our = OrgUserRecord(
                id=str(uuid4()), tenant_id=user.tenant_id,
                name=u.get("name"), email=u.get("email", ""),
                role=u.get("role"), department=u.get("department"),
                status="pending",
                extra_fields={k: v for k, v in u.items() if k not in ("name","email","role","department","status")} or None,
            )
            self.db.add(our)
            self._sync_user_to_employees(user.tenant_id, u, our.id)
            created_ids.append(our.id)
        self.db.flush()
        return {"step": 4, "status": "bulk_uploaded", "count": len(created_ids), "record_ids": created_ids}

    def list_users(self, user: CurrentUser) -> dict:
        records = self.db.scalars(select(OrgUserRecord).where(OrgUserRecord.tenant_id == user.tenant_id)).all()
        return {"items": [{"id": r.id, "name": r.name, "email": r.email, "role": r.role, "department": r.department, "status": r.status} for r in records], "total": len(records)}

    # ── step 5: workflow config ───────────────────────────────────────────────

    def save_step5(self, user: CurrentUser, data: dict) -> dict:
        err = self._check_prerequisite(user.tenant_id, 4)
        if err: return err
        existing = self._get_workflow_config(user.tenant_id)
        if existing:
            existing.approval_levels = data.get("approval_levels", existing.approval_levels)
            existing.escalation_rules = data.get("escalation_rules", existing.escalation_rules)
            existing.notification_settings = data.get("notification_settings", existing.notification_settings)
            existing.extra_fields = {k: v for k, v in data.items() if k not in ("approval_levels","escalation_rules","notification_settings")} or None
            self.db.flush()
            return {"step": 5, "status": "saved", "record_id": existing.id}
        cfg = OrgWorkflowConfig(
            id=str(uuid4()), tenant_id=user.tenant_id,
            approval_levels=data.get("approval_levels"),
            escalation_rules=data.get("escalation_rules"),
            notification_settings=data.get("notification_settings"),
            extra_fields={k: v for k, v in data.items() if k not in ("approval_levels","escalation_rules","notification_settings")} or None,
        )
        self.db.add(cfg); self.db.flush()
        return {"step": 5, "status": "saved", "record_id": cfg.id}

    def get_step5(self, user: CurrentUser) -> dict:
        w = self._get_workflow_config(user.tenant_id)
        if not w: return {}
        result = {
            "approval_levels": w.approval_levels or {},
            "escalation_rules": w.escalation_rules or {},
            "notification_settings": w.notification_settings or {},
        }
        if w.extra_fields:
            result.update(w.extra_fields)
        return result

    # ── step 6: knowledge upload ──────────────────────────────────────────────

    def upload_document(self, user: CurrentUser, data: dict) -> dict:
        err = self._check_prerequisite(user.tenant_id, 5)
        if err: return err
        doc = KnowledgeDocument(
            id=str(uuid4()), tenant_id=user.tenant_id,
            title=data.get("title", data.get("name", data.get("file_name", "Document"))),
            document_type=data.get("document_type", data.get("type", data.get("file_type", "Document"))),
            version=data.get("version", "1.0"),
            file_name=data.get("file_name"), file_type=data.get("file_type"),
            category=data.get("category"), size=data.get("size"),
            uploaded_by=data.get("uploaded_by"), indexed=False, status="uploaded",
            extra_fields={k: v for k, v in data.items() if k not in ("title","document_type","file_type","version","file_name","category","size","uploaded_by")} or None,
        )
        self.db.add(doc); self.db.flush()
        return {"step": 6, "status": "uploaded", "record_id": doc.id, "document_id": doc.id}

    def list_documents(self, user: CurrentUser) -> dict:
        docs = self.db.scalars(select(KnowledgeDocument).where(KnowledgeDocument.tenant_id == user.tenant_id).order_by(KnowledgeDocument.created_at.desc())).all()
        return {
            "items": [
                {
                    "id": d.id,
                    # Frontend KnowledgeDocument type uses `name` and `type`
                    "name": d.title,
                    "type": d.document_type,
                    # Also expose canonical names for other consumers
                    "title": d.title,
                    "document_type": d.document_type,
                    "file_name": d.file_name,
                    "file_type": d.file_type,
                    "category": d.category,
                    "size": d.size,
                    "status": d.status,
                    "uploadedAt": d.created_at.isoformat() if d.created_at else None,
                }
                for d in docs
            ],
            "total": len(docs),
        }

    # ── step 6a: data import ──────────────────────────────────────────────────

    def import_data(self, user: CurrentUser, data: dict) -> dict:
        module = data.get("module") or data.get("dataType", "general")
        method = data.get("method", "api")
        imp = OrgImportRecord(
            id=str(uuid4()), tenant_id=user.tenant_id,
            module=module,
            file_name=data.get("file_name"),
            record_count=int(data.get("count", data.get("records", 0)) or 0),
            status="imported",
            extra_fields={k: v for k, v in data.items() if k not in ("module","dataType","file_name","count","records","method")} or {"method": method},
        )
        self.db.add(imp); self.db.flush()
        return {
            "step": "6a", "status": "imported", "record_id": imp.id, "import_id": imp.id,
            "id": imp.id,
            "dataType": module,
            "method": method,
            "records": imp.record_count,
            "importedAt": imp.created_at.isoformat() if imp.created_at else None,
        }

    # ── generic bulk import (onboarding) ──────────────────────────────────────

    def bulk_import_module(self, user: CurrentUser, module_key: str, rows: list[dict]) -> dict:
        """Parse and persist rows for any onboarding module.

        Mapping:
        - organisation → OrgProfile
        - sites → Site records
        - users → OrgUserRecord + Employee sync
        - departments → Department records
        - roles → OrgCustomRole records
        - incidents → Incident domain rows
        - risk → RiskAssessment rows
        - all other modules → OrgImportRecord
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
                self.save_step1(user, payload)
                created = 1
            return {"module": module_key, "status": "imported", "count": created}

        # ── sites → real Site records ──
        if module_key == "sites":
            if not rows:
                return {"module": module_key, "status": "imported", "count": 0,
                        "errors": ["No rows found in file. Check that the file has data and a valid header row."]}
            try:
                for row in rows:
                    name = _v(row, "site name", "name", "site_name", "sitename",
                              "facility name", "facility", "site")
                    if not name:
                        errors.append(f"Skipped row (no site name found). Columns detected: {list(row.keys())[:5]}")
                        continue
                    _, extra = self._split_row("sites", row)
                    raw_cap = _v(row, "capacity", "number_of_working_stations", "stations")
                    capacity: int | None = None
                    if raw_cap:
                        try:
                            capacity = int(float(raw_cap))
                        except (ValueError, TypeError):
                            pass
                    site = Site(
                        id=str(uuid4()),
                        tenant_id=tenant_id,
                        name=name,
                        site_type=_v(row, "site type", "type", "operational status",
                                     "operational_status", "category") or "Site",
                        address=_v(row, "address", "location") or None,
                        city=_v(row, "city", "town") or None,
                        postcode=_v(row, "postcode", "post code", "zip", "postal code") or None,
                        region=_v(row, "region", "area") or None,
                        status=_v(row, "operational status", "operational_status", "status") or "Active",
                        capacity=capacity,
                        hazard_level=_v(row, "hazard classification", "hazard_classification",
                                        "hazard level", "hazard") or None,
                        extra_fields=extra or None,
                    )
                    self.db.add(site)
                    created += 1
                self.db.flush()
            except Exception as exc:
                errors.append(f"Site domain save failed: {exc}")
            return {"module": module_key, "status": "imported", "count": created, "errors": errors[:5]}

        # ── users (same as step4/bulk + employee sync) ──
        if module_key == "users":
            for row in rows:
                email = _v(row, "email", "email address")
                if not email: continue
                _, extra = self._split_row("users", row)
                our = OrgUserRecord(
                    id=str(uuid4()), tenant_id=tenant_id,
                    name=_v(row, "full name", "name"),
                    email=email,
                    role=_v(row, "role", "job title", "position") or "Worker",
                    department=_v(row, "department", "dept", "team"),
                    status="pending", extra_fields=extra or None,
                )
                self.db.add(our)
                self._sync_user_to_employees(tenant_id, {"name": our.name, "email": email, "role": our.role, "department": our.department}, our.id, extra_fields=extra)
                created += 1
            self.db.flush()
            return {"module": module_key, "status": "imported", "count": created}

        # ── departments ──
        if module_key == "departments":
            for row in rows:
                name = _v(row, "department name", "name")
                if not name: continue
                _, extra = self._split_row("departments", row)
                dept = Department(
                    id=str(uuid4()), tenant_id=tenant_id, name=name,
                    manager=_v(row, "manager name", "manager"),
                    teams=_v(row, "number of teams", "teams"),
                    site=_v(row, "assigned site", "site"),
                    extra_fields=extra or None,
                )
                self.db.add(dept)
                created += 1
            self.db.flush()
            return {"module": module_key, "status": "imported", "count": created}

        # ── roles ──
        if module_key == "roles":
            for row in rows:
                name = _v(row, "role name", "name")
                if not name: continue
                _, extra = self._split_row("roles", row)
                role = OrgCustomRole(
                    id=str(uuid4()), tenant_id=tenant_id, name=name,
                    description=_v(row, "description"),
                    level=_v(row, "access level", "level"),
                    modules=_v(row, "module access", "modules"),
                    extra_fields=extra or None,
                )
                self.db.add(role)
                created += 1
            self.db.flush()
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

        # ── all other modules → log as OrgImportRecord ──
        if rows:
            imp = OrgImportRecord(
                id=str(uuid4()), tenant_id=tenant_id,
                module=module_key, record_count=len(rows), status="imported",
                extra_fields={"rows_sample": rows[:3]},
            )
            self.db.add(imp)
            created = len(rows)
            self.db.flush()
        return {"module": module_key, "status": "imported", "count": created, "errors": errors}

    def list_imports(self, user: CurrentUser) -> dict:
        records = self.db.scalars(select(OrgImportRecord).where(OrgImportRecord.tenant_id == user.tenant_id)).all()
        return {
            "items": [
                {
                    "id": r.id,
                    "dataType": r.module,
                    "method": (r.extra_fields or {}).get("method", "bulk"),
                    "records": r.record_count,
                    "importedAt": r.created_at.isoformat() if r.created_at else None,
                    "module": r.module,
                    "file_name": r.file_name,
                    "status": r.status,
                }
                for r in records
            ],
            "total": len(records),
        }

    # ── step 7: ai config ─────────────────────────────────────────────────────

    def save_step7(self, user: CurrentUser, data: dict) -> dict:
        err = self._check_prerequisite(user.tenant_id, 6)
        if err: return err
        existing = self._get_ai_config(user.tenant_id)
        if existing:
            existing.ai_enabled = data.get("ai_enabled", data.get("aiEnabled", existing.ai_enabled))
            existing.ai_features = data.get("ai_features", data.get("aiFeatures", existing.ai_features))
            existing.extra_fields = {k: v for k, v in data.items() if k not in ("ai_enabled","aiEnabled","ai_features","aiFeatures")} or None
            self.db.flush()
            return {"step": 7, "status": "saved", "record_id": existing.id}
        cfg = OrgAIConfig(
            id=str(uuid4()), tenant_id=user.tenant_id,
            ai_enabled=data.get("ai_enabled", data.get("aiEnabled")),
            ai_features=data.get("ai_features", data.get("aiFeatures")),
            extra_fields={k: v for k, v in data.items() if k not in ("ai_enabled","aiEnabled","ai_features","aiFeatures")} or None,
        )
        self.db.add(cfg); self.db.flush()
        return {"step": 7, "status": "saved", "record_id": cfg.id}

    def get_step7(self, user: CurrentUser) -> dict:
        a = self._get_ai_config(user.tenant_id)
        if not a: return {}
        return {"ai_enabled": a.ai_enabled, "ai_features": a.ai_features or {}}

    # ── activate (step 8) ─────────────────────────────────────────────────────

    def activate(self, user: CurrentUser, data: dict) -> dict:
        if not data.get("confirmed", False):
            return {"error": "Activation requires confirmed=true"}

        for required in [1, 2, 3, 4, 5, 6, 7]:
            err = self._check_prerequisite(user.tenant_id, required)
            if err:
                return {"error": f"Cannot activate: complete step {required} first", "prerequisite_step": required}

        existing_act = self._get_activation(user.tenant_id)
        if existing_act:
            existing_act.confirmed = True
            self.db.flush()
        else:
            act = OrgActivation(id=str(uuid4()), tenant_id=user.tenant_id, confirmed=True)
            self.db.add(act); self.db.flush()

        # Attempt to update tenant status to active
        tenant = self.db.get(Tenant, user.tenant_id)
        if tenant:
            tenant.status = "active"
            self.db.flush()

        # Sync all OrgUserRecord entries into employees table (idempotent)
        our_records = self.db.scalars(select(OrgUserRecord).where(OrgUserRecord.tenant_id == user.tenant_id).limit(500)).all()
        for rec in our_records:
            self._sync_user_to_employees(user.tenant_id, {"name": rec.name, "email": rec.email, "role": rec.role, "department": rec.department}, rec.id)

        return {
            "status": "activated",
            "tenant_id": user.tenant_id,
            "modules_enabled": MODULES_ENABLED,
            "dashboard_url": "/",
            "message": "Organization activated successfully",
        }
