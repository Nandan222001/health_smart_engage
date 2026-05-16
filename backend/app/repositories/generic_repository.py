from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.generic_record import GenericRecord
from app.repositories.base import BaseRepository


class GenericRepository(BaseRepository[GenericRecord]):
    def __init__(self, db: Session):
        super().__init__(db, GenericRecord)

    def list_by_type(
        self,
        tenant_id: str,
        module: str,
        record_type: str,
        limit: int = 25,
        offset: int = 0,
    ) -> list[GenericRecord]:
        stmt = (
            select(GenericRecord)
            .where(GenericRecord.tenant_id == tenant_id)
            .where(GenericRecord.module == module)
            .where(GenericRecord.record_type == record_type)
            .limit(limit)
            .offset(offset)
        )
        return list(self.db.scalars(stmt).all())

    def create(
        self,
        tenant_id: str,
        module: str,
        record_type: str,
        payload: dict,
        status: str = "draft",
    ) -> GenericRecord:
        record = GenericRecord(
            id=str(uuid4()),
            tenant_id=tenant_id,
            module=module,
            record_type=record_type,
            status=status,
            payload=payload,
        )
        return self.add(record)
