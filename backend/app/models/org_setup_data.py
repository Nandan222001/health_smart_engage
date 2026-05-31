from sqlalchemy import JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TenantScopedMixin


class OrgProfile(Base, TenantScopedMixin):
    """Stores org setup step 1 — organisation details (one row per tenant)."""
    __tablename__ = "org_profiles"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    organisation_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    organization_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    country: Mapped[str | None] = mapped_column(String(128), nullable=True)
    industry_type: Mapped[str | None] = mapped_column(String(128), nullable=True)
    employee_count: Mapped[str | None] = mapped_column(String(64), nullable=True)
    headquarters_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    parent_company: Mapped[str | None] = mapped_column(String(255), nullable=True)
    iso_45001_status: Mapped[str | None] = mapped_column(String(128), nullable=True)
    regulatory_authority: Mapped[str | None] = mapped_column(String(255), nullable=True)
    establishment_date: Mapped[str | None] = mapped_column(String(64), nullable=True)
    extra_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class OrgComplianceSetup(Base, TenantScopedMixin):
    """Stores org setup step 2 — compliance selection (one row per tenant)."""
    __tablename__ = "org_compliance_setups"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    standards: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    modules_enabled: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    extra_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class OrgWorkflowConfig(Base, TenantScopedMixin):
    """Stores org setup step 5 — workflow configuration (one row per tenant)."""
    __tablename__ = "org_workflow_configs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    approval_levels: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    escalation_rules: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    notification_settings: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    extra_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class OrgAIConfig(Base, TenantScopedMixin):
    """Stores org setup step 7 — AI configuration (one row per tenant)."""
    __tablename__ = "org_ai_configs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    ai_enabled: Mapped[bool | None] = mapped_column(nullable=True)
    ai_features: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    extra_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class OrgActivation(Base, TenantScopedMixin):
    """Tracks whether the org setup wizard has been completed and activated."""
    __tablename__ = "org_activations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    confirmed: Mapped[bool] = mapped_column(default=False)
    extra_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class Department(Base, TenantScopedMixin):
    """Organisation department records."""
    __tablename__ = "departments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    manager: Mapped[str | None] = mapped_column(String(255), nullable=True)
    teams: Mapped[str | None] = mapped_column(String(128), nullable=True)
    site: Mapped[str | None] = mapped_column(String(255), nullable=True)
    extra_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class OrgCustomRole(Base, TenantScopedMixin):
    """Custom roles defined during org setup (distinct from auth roles)."""
    __tablename__ = "org_custom_roles"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    level: Mapped[str | None] = mapped_column(String(64), nullable=True)
    modules: Mapped[str | None] = mapped_column(Text, nullable=True)
    extra_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class OrgUserRecord(Base, TenantScopedMixin):
    """User entries created during org setup wizard (step 4) before full auth."""
    __tablename__ = "org_user_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    role: Mapped[str | None] = mapped_column(String(128), nullable=True)
    department: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="pending")
    extra_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class OrgImportRecord(Base, TenantScopedMixin):
    """Tracks onboarding data imports (step 6a)."""
    __tablename__ = "org_import_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    module: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    record_count: Mapped[int] = mapped_column(default=0)
    status: Mapped[str] = mapped_column(String(64), default="imported")
    extra_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)
