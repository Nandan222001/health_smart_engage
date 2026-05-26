import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.core.security import CurrentUser
from app.models.domain import Vendor, VendorCompliance, VendorDocument
from app.repositories.domain_repository import DomainRepository

COMPLIANCE_DOMAINS = [
    "Safety Training",
    "PPE Compliance",
    "Permit-to-Work",
    "Inspection Schedule",
    "Incident Reporting",
]


class VendorService:
    def __init__(self, db: Session):
        self.repo = DomainRepository(db)
        self.db = db

    # ── Vendors ───────────────────────────────────────────────────────────────

    def list_vendors(self, user: CurrentUser, filters: dict = None) -> list[Vendor]:
        return self.repo.list(Vendor, user.tenant_id, filters)

    def create_vendor(self, user: CurrentUser, data: dict) -> Vendor:
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        if "status" not in data:
            data["status"] = "Pending"
        return self.repo.create(Vendor, user.tenant_id, data)

    def get_vendor(self, user: CurrentUser, vendor_id: str) -> Vendor:
        vendor = self.repo.get(Vendor, user.tenant_id, vendor_id)
        if not vendor:
            raise AppError("VENDOR_NOT_FOUND", "Vendor not found", 404)
        return vendor

    def update_vendor(self, user: CurrentUser, vendor_id: str, data: dict) -> Vendor:
        return self.repo.update(Vendor, user.tenant_id, vendor_id, data)

    # ── Documents ─────────────────────────────────────────────────────────────

    def list_vendor_documents(self, user: CurrentUser, vendor_id: str) -> list[VendorDocument]:
        return self.repo.list(VendorDocument, user.tenant_id, {"vendor_id": vendor_id})

    def upload_vendor_document(self, user: CurrentUser, vendor_id: str, data: dict) -> VendorDocument:
        data["vendor_id"] = vendor_id
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        data.setdefault("status", "pending_review")
        return self.repo.create(VendorDocument, user.tenant_id, data)

    def review_vendor_document(self, user: CurrentUser, document_id: str, data: dict) -> VendorDocument:
        return self.repo.update(VendorDocument, user.tenant_id, document_id, {
            "status": data.get("status"),
            "review_comment": data.get("comment"),
        })

    # ── Certifications ────────────────────────────────────────────────────────

    def add_vendor_certification(self, user: CurrentUser, vendor_id: str, data: dict) -> VendorDocument:
        data["vendor_id"] = vendor_id
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        if "expiry_date" in data and data["expiry_date"]:
            try:
                from datetime import datetime
                exp = datetime.strptime(str(data["expiry_date"]), "%Y-%m-%d").date()
                days_left = (exp - date.today()).days
                data["status"] = "expired" if days_left < 0 else ("expiring" if days_left <= 30 else "valid")
            except Exception:
                data.setdefault("status", "pending_review")
        else:
            data.setdefault("status", "pending_review")
        return self.repo.create(VendorDocument, user.tenant_id, data)

    def list_vendor_certifications(self, user: CurrentUser) -> dict:
        records = self.repo.list(VendorDocument, user.tenant_id)
        vendors = {v.id: v for v in self.list_vendors(user)}
        today = date.today()

        items = []
        for r in records:
            vendor = vendors.get(r.vendor_id)
            if not vendor:
                continue
            if r.expiry_date:
                days_left = (r.expiry_date - today).days
                cert_status = "Expired" if days_left < 0 else ("Expiring" if days_left <= 30 else "Valid")
            else:
                cert_status = r.status.capitalize() if r.status else "Unknown"
            items.append({
                "id": r.id,
                "vendor_id": r.vendor_id,
                "vendor_name": vendor.company_name,
                "document_type": r.document_type,
                "issuing_body": getattr(r, "issuing_body", None),
                "expiry_date": str(r.expiry_date) if r.expiry_date else None,
                "days_left": (r.expiry_date - today).days if r.expiry_date else None,
                "cert_status": cert_status,
                "status": r.status,
            })
        return {"items": items}

    # ── Compliance ────────────────────────────────────────────────────────────

    def list_vendor_compliance(self, user: CurrentUser) -> dict:
        records = self.db.scalars(
            select(VendorCompliance).where(VendorCompliance.tenant_id == user.tenant_id)
        ).all()
        vendors = {v.id: v for v in self.list_vendors(user)}

        grouped: dict[str, dict] = {}
        for r in records:
            if r.vendor_id not in grouped:
                vendor = vendors.get(r.vendor_id)
                grouped[r.vendor_id] = {
                    "vendor_id": r.vendor_id,
                    "vendor_name": vendor.company_name if vendor else "Unknown",
                    "status": vendor.status if vendor else "Unknown",
                    "active_since": str(vendor.active_since) if vendor and vendor.active_since else None,
                    "domains": [],
                }
            grouped[r.vendor_id]["domains"].append({"domain": r.domain, "score": r.score})

        for v in grouped.values():
            v["overall_score"] = (
                round(sum(d["score"] for d in v["domains"]) / len(v["domains"]))
                if v["domains"] else 0
            )

        # Vendors with no compliance records still appear (using safety_score as overall)
        for vid, vendor in vendors.items():
            if vid not in grouped:
                grouped[vid] = {
                    "vendor_id": vid,
                    "vendor_name": vendor.company_name,
                    "status": vendor.status,
                    "active_since": str(vendor.active_since) if vendor.active_since else None,
                    "domains": [],
                    "overall_score": int(vendor.safety_score or 0),
                }

        return {"items": list(grouped.values())}

    def save_vendor_compliance(self, user: CurrentUser, vendor_id: str, data: dict) -> dict:
        today = date.today()
        domains = data.get("domains", [])
        updated = 0

        for domain_data in domains:
            domain = domain_data.get("domain")
            score = float(domain_data.get("score", 0))
            existing = self.db.scalars(
                select(VendorCompliance).where(
                    VendorCompliance.tenant_id == user.tenant_id,
                    VendorCompliance.vendor_id == vendor_id,
                    VendorCompliance.domain == domain,
                )
            ).first()
            if existing:
                existing.score = score
                existing.assessed_at = today
            else:
                self.db.add(VendorCompliance(
                    id=str(uuid.uuid4()),
                    tenant_id=user.tenant_id,
                    vendor_id=vendor_id,
                    domain=domain,
                    score=score,
                    assessed_at=today,
                ))
            updated += 1

        return {"vendor_id": vendor_id, "updated": updated}

    # ── Risk Scores ───────────────────────────────────────────────────────────

    def list_vendor_risk_scores(self, user: CurrentUser) -> dict:
        vendors = self.list_vendors(user)
        items = [
            {
                "vendor_id": v.id,
                "vendor_name": v.company_name,
                "risk_score": round(v.risk_score or 0),
                "incident_count": v.incident_count or 0,
                "safety_score": round(v.safety_score or 0),
                "status": v.status,
            }
            for v in vendors
        ]
        items.sort(key=lambda x: x["risk_score"], reverse=True)
        return {"items": items}
