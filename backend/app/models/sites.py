from sqlalchemy import Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TenantScopedMixin


class Site(Base, TenantScopedMixin):
    __tablename__ = "sites"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    site_type: Mapped[str] = mapped_column(String(128), nullable=False, default="Site")
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(128), nullable=True)
    postcode: Mapped[str | None] = mapped_column(String(32), nullable=True)
    region: Mapped[str | None] = mapped_column(String(128), nullable=True)
    status: Mapped[str] = mapped_column(String(64), nullable=False, default="Active", index=True)
    capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    hazard_level: Mapped[str | None] = mapped_column(String(64), nullable=True)
    extra_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)
