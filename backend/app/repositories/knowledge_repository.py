from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository
from app.models.knowledge import KnowledgeDocument


class KnowledgeRepository(BaseRepository[KnowledgeDocument]):
    def __init__(self, db: Session):
        super().__init__(db, KnowledgeDocument)

    def list_by_tenant(self, tenant_id: str, filters: dict = None) -> list[KnowledgeDocument]:
        stmt = select(KnowledgeDocument).where(KnowledgeDocument.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(KnowledgeDocument, k) and v is not None:
                    stmt = stmt.where(getattr(KnowledgeDocument, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_by_tenant(self, tenant_id: str, doc_id: str) -> KnowledgeDocument | None:
        return self.db.scalars(
            select(KnowledgeDocument).where(
                KnowledgeDocument.tenant_id == tenant_id, KnowledgeDocument.id == doc_id
            )
        ).first()

    def search_by_title(self, tenant_id: str, query: str) -> list[KnowledgeDocument]:
        stmt = select(KnowledgeDocument).where(
            KnowledgeDocument.tenant_id == tenant_id,
            KnowledgeDocument.title.ilike(f"%{query}%"),
        )
        return list(self.db.scalars(stmt).all())
