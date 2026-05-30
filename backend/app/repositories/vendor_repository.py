from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository
from app.models.vendors import Vendor, VendorDocument


class VendorRepository(BaseRepository[Vendor]):
    def __init__(self, db: Session):
        super().__init__(db, Vendor)

    def list_by_tenant(self, tenant_id: str, filters: dict = None) -> list[Vendor]:
        stmt = select(Vendor).where(Vendor.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(Vendor, k) and v is not None:
                    stmt = stmt.where(getattr(Vendor, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_by_tenant(self, tenant_id: str, vendor_id: str) -> Vendor | None:
        return self.db.scalars(
            select(Vendor).where(Vendor.tenant_id == tenant_id, Vendor.id == vendor_id)
        ).first()

    def list_documents(self, tenant_id: str, vendor_id: str = None) -> list[VendorDocument]:
        stmt = select(VendorDocument).where(VendorDocument.tenant_id == tenant_id)
        if vendor_id:
            stmt = stmt.where(VendorDocument.vendor_id == vendor_id)
        return list(self.db.scalars(stmt).all())

    def get_document(self, tenant_id: str, doc_id: str) -> VendorDocument | None:
        return self.db.scalars(
            select(VendorDocument).where(
                VendorDocument.tenant_id == tenant_id, VendorDocument.id == doc_id
            )
        ).first()
