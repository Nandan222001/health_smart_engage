from datetime import date, datetime
from typing import Any
from pydantic import BaseModel, Field, EmailStr


class OrganizationDetailsBase(BaseModel):
    organization_id: int
    organization_name: str | None = None
    country: str | None = None
    industry_type: str | None = None
    subscription_plan: str | None = None
    governance_hierarchy: str | None = None
    knowledgebase_data_upload: str | None = None
    certifications: list[str] | None = None
    active_modules: list[str] | None = None
    sites: int | None = None
    zones: int | None = None
    total_active_workers: int | None = None
    admin_count: int | None = None
    site_engineers: int | None = None
    site_inspectors: int | None = None
    workers: int | None = None
    contractors: int | None = None
    shift_pattern: str | None = None
    high_risk_work_categories: list[str] | None = None
    permit_to_work: bool | None = None
    daily_toolbox_talk: bool | None = None
    onsite_clinic: bool | None = None
    incident_frequency_rate: str | None = None
    last_audit_date: date | None = None
    evacuation_drill_cadence: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    primary_admin_name: str | None = None
    admin_email: EmailStr | None = None
    admin_phone: str | None = None
    admin_designation: str | None = None
    target_go_live_date: date | None = None
    integration_needs: str | None = None
    training_plan: str | None = None
    additional_notes: str | None = None
    logo_url: str | None = None
    plan_kpi_limit: str | None = None
    kpi_selection: str | None = None
    custom_kpi: str | None = None
    critical_action_closure_sla_hours: int | None = None
    standard_action_closure_sla_hours: int | None = None
    kpi_reporting_cadence: str | None = None
    data_use_confirmed: bool | None = None
    leadership_approved: bool | None = None


class OrganizationDetailsCreateRequest(OrganizationDetailsBase):
    pass


class OrganizationDetailsUpdateRequest(OrganizationDetailsBase):
    pass


class OrganizationDetailsResponse(OrganizationDetailsBase):
    id: int
    created_at: datetime
    updated_at: datetime
    created_by: int | None = None
    updated_by: int | None = None
    deleted_at: datetime | None = None

    model_config = {
        "from_attributes": True,
    }
