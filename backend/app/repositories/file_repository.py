from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository
from app.models.files import FileObject


class FileRepository(BaseRepository[FileObject]):
    def __init__(self, db: Session):
        super().__init__(db, FileObject)

    def list_by_tenant(self, tenant_id: str, filters: dict = None) -> list[FileObject]:
        stmt = select(FileObject).where(FileObject.tenant_id == tenant_id)
        if filters:
            for k, v in filters.items():
                if hasattr(FileObject, k) and v is not None:
                    stmt = stmt.where(getattr(FileObject, k) == v)
        return list(self.db.scalars(stmt).all())

    def get_by_tenant(self, tenant_id: str, file_id: str) -> FileObject | None:
        return self.db.scalars(
            select(FileObject).where(
                FileObject.tenant_id == tenant_id, FileObject.id == file_id
            )
        ).first()
