import uuid
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.core.security import CurrentUser
from app.core.exceptions import AppError
from app.helpers.datetime import utc_now
from app.models.tenant import Tenant
from app.models.domain import (
    Employee, Permit, Incident, Capa, Vendor, Asset,
    AuditExecution, TrainingCompletion, HazardObservation,
    Finding, KnowledgeDocument, User as DomainUser,
    WorkflowCase, MLModel, OperationalEvent,
)


class SuperAdminService:
    def __init__(self, db: Session):
        self.db = db

    # ── Tenants ───────────────────────────────────────────────────────────────

    def list_tenants(self) -> dict:
        tenants = self.db.scalars(select(Tenant).order_by(Tenant.created_at.desc())).all()
        return {"items": [self._serialize_tenant(t) for t in tenants]}

    def get_tenant(self, tenant_id: str) -> dict:
        t = self.db.scalars(select(Tenant).where(Tenant.id == tenant_id)).first()
        if not t:
            raise AppError("TENANT_NOT_FOUND", "Tenant not found", 404)
        return self._serialize_tenant(t)

    def create_tenant(self, data: dict) -> dict:
        tenant = Tenant(
            id=str(uuid.uuid4()),
            name=data.get("name", "New Org"),
            status=data.get("status", "active"),
            org_code=data.get("org_code"),
            industry=data.get("industry"),
            plan=data.get("plan", "starter"),
            contact_email=data.get("contact_email"),
            employee_count=data.get("employee_count", 0),
            sites_count=data.get("sites_count", 0),
        )
        self.db.add(tenant)
        self.db.flush()
        return self._serialize_tenant(tenant)

    def update_tenant(self, tenant_id: str, data: dict) -> dict:
        t = self.db.scalars(select(Tenant).where(Tenant.id == tenant_id)).first()
        if not t:
            raise AppError("TENANT_NOT_FOUND", "Tenant not found", 404)
        for field in ("name", "status", "industry", "plan", "contact_email", "employee_count", "sites_count"):
            if field in data:
                setattr(t, field, data[field])
        self.db.flush()
        return self._serialize_tenant(t)

    def _serialize_tenant(self, t: Tenant) -> dict:
        # Count live records for this tenant
        emp_count = self.db.scalar(select(func.count(Employee.id)).where(Employee.tenant_id == t.id)) or 0
        return {
            "id": t.id,
            "name": t.name,
            "status": t.status,
            "org_code": t.org_code or t.id[:8].upper(),
            "industry": t.industry or "General Industry",
            "plan": t.plan or "starter",
            "contact_email": t.contact_email,
            "employee_count": emp_count or t.employee_count or 0,
            "sites_count": t.sites_count or 1,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None,
        }

    # ── Users (cross-tenant) ──────────────────────────────────────────────────

    def list_all_users(self) -> dict:
        users = self.db.scalars(select(DomainUser).order_by(DomainUser.created_at.desc()).limit(200)).all()
        return {
            "items": [
                {
                    "id": u.id, "email": u.email, "display_name": u.display_name,
                    "status": u.status, "tenant_id": u.tenant_id,
                    "created_at": u.created_at.isoformat() if u.created_at else None,
                }
                for u in users
            ]
        }

    # ── Storage Metrics ───────────────────────────────────────────────────────

    def get_storage_metrics(self) -> dict:
        """Aggregate real record counts across all tables to produce storage metrics."""
        def count(model) -> int:
            return self.db.scalar(select(func.count(model.id))) or 0

        emp = count(Employee)
        permits = count(Permit)
        incidents = count(Incident)
        capas = count(Capa)
        vendors = count(Vendor)
        assets = count(Asset)
        audits = count(AuditExecution)
        training = count(TrainingCompletion)
        hazards = count(HazardObservation)
        findings = count(Finding)
        knowledge = count(KnowledgeDocument)
        workflow_cases = count(WorkflowCase)
        ml_models = count(MLModel)
        events = count(OperationalEvent)

        total_records = emp + permits + incidents + capas + vendors + assets + audits + training + hazards + findings + knowledge

        # Estimate sizes: ~2 KB avg per relational record, ~50 KB per doc, ~10 KB per vector
        relational_gb = round(total_records * 2 / 1024 / 1024, 3)
        object_gb = round(knowledge * 50 / 1024 / 1024, 3)
        vector_gb = round(knowledge * 10 / 1024 / 1024, 3)
        search_gb = round(total_records * 0.5 / 1024 / 1024, 3)

        return {
            "stores": [
                {
                    "id": "relational", "name": "Relational DB", "type": "postgresql",
                    "status": "healthy", "used_gb": relational_gb, "capacity_gb": 50.0,
                    "entities": {
                        "employees": emp, "permits": permits, "incidents": incidents,
                        "capas": capas, "vendors": vendors, "assets": assets,
                        "audits": audits, "training_completions": training,
                        "hazards": hazards, "findings": findings,
                        "workflow_cases": workflow_cases,
                    },
                },
                {
                    "id": "object", "name": "Object Storage", "type": "s3",
                    "status": "healthy", "used_gb": object_gb, "capacity_gb": 500.0,
                    "entities": {"documents": knowledge, "evidence_files": capas},
                },
                {
                    "id": "vector", "name": "Vector DB", "type": "pgvector",
                    "status": "healthy", "used_gb": vector_gb, "capacity_gb": 20.0,
                    "entities": {"knowledge_chunks": knowledge * 12, "ml_embeddings": ml_models * 1000},
                },
                {
                    "id": "search", "name": "Search Index", "type": "elasticsearch",
                    "status": "healthy", "used_gb": search_gb, "capacity_gb": 10.0,
                    "entities": {"indexed_records": total_records, "events": events},
                },
            ],
            "summary": {
                "total_used_gb": round(relational_gb + object_gb + vector_gb + search_gb, 3),
                "total_capacity_gb": 580.0,
                "healthy_stores": 4,
                "degraded_stores": 0,
                "total_records": total_records,
            },
        }

    # ── Dashboard Summary ─────────────────────────────────────────────────────

    def get_dashboard(self) -> dict:
        tenants = self.db.scalars(select(Tenant)).all()
        total = len(tenants)
        active = len([t for t in tenants if t.status == "active"])
        pending = len([t for t in tenants if t.status in ("pending", "onboarding")])
        suspended = len([t for t in tenants if t.status == "suspended"])

        total_users = self.db.scalar(select(func.count(DomainUser.id))) or 0
        total_incidents = self.db.scalar(select(func.count(Incident.id))) or 0

        return {
            "total_tenants": total,
            "active_tenants": active,
            "pending_tenants": pending,
            "suspended_tenants": suspended,
            "total_users": total_users,
            "total_incidents": total_incidents,
            "recent_tenants": [self._serialize_tenant(t) for t in tenants[:5]],
        }
