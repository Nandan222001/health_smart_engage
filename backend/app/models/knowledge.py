from sqlalchemy import Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TenantScopedMixin


class KnowledgeDocument(Base, TenantScopedMixin):
    __tablename__ = "knowledge_documents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    document_type: Mapped[str] = mapped_column(String(128), nullable=False)
    version: Mapped[str] = mapped_column(String(64), nullable=False)
    file_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="draft")
    tags: Mapped[dict] = mapped_column(JSON, default=dict)
    # Extended fields for document library uploads
    file_name: Mapped[str | None] = mapped_column(String(512), nullable=True)
    file_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    category: Mapped[str | None] = mapped_column(String(64), nullable=True)
    size: Mapped[str | None] = mapped_column(String(64), nullable=True)
    uploaded_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    indexed: Mapped[bool] = mapped_column(default=False)
    record_type: Mapped[str | None] = mapped_column(String(128), nullable=True)
    extra_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class KnowledgeChunk(Base, TenantScopedMixin):
    """Text chunks extracted from knowledge documents for TF-IDF/vector search."""
    __tablename__ = "knowledge_chunks"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    doc_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    chunk_index: Mapped[int] = mapped_column(Integer, default=0)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    tokens: Mapped[dict | None] = mapped_column(JSON, nullable=True)
