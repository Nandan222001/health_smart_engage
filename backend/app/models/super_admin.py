from sqlalchemy import Column, Integer, String
from app.core.database import Base


class SuperAdmin(Base):
    __tablename__ = "super_admin"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
