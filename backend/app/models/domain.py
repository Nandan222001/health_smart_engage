from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.helpers.datetime import utc_now


class TenantScopedMixin:
    tenant_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class OrganisationNode(Base, TenantScopedMixin):
    __tablename__ = "organisation_nodes"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    parent_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    node_type: Mapped[str] = mapped_column(String(64), nullable=False)
    settings: Mapped[dict] = mapped_column(JSON, default=dict)


class User(Base, TenantScopedMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(64), default="invited")
    organisation_node_id: Mapped[str | None] = mapped_column(String(64), nullable=True)


class Role(Base, TenantScopedMixin):
    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)
    permissions: Mapped[dict] = mapped_column(JSON, default=dict)


class Employee(Base, TenantScopedMixin):
    __tablename__ = "employees"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    employee_code: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role_name: Mapped[str] = mapped_column(String(128), nullable=False)
    department_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    contact: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="active")


class Certification(Base, TenantScopedMixin):
    __tablename__ = "certifications"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    employee_id: Mapped[str] = mapped_column(String(64), ForeignKey("employees.id"), index=True)
    certification_type: Mapped[str] = mapped_column(String(128), nullable=False)
    issue_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    expiry_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    evidence_file_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="active")


class TrainingRequirement(Base, TenantScopedMixin):
    __tablename__ = "training_requirements"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    role_name: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    training_name: Mapped[str] = mapped_column(String(255), nullable=False)
    validity_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=True)


class TrainingCompletion(Base, TenantScopedMixin):
    __tablename__ = "training_completions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    employee_id: Mapped[str] = mapped_column(String(64), ForeignKey("employees.id"), index=True)
    training_requirement_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    completed_on: Mapped[Date] = mapped_column(Date, nullable=False)
    trainer: Mapped[str | None] = mapped_column(String(255), nullable=True)
    evidence_file_id: Mapped[str | None] = mapped_column(String(64), nullable=True)


class Vendor(Base, TenantScopedMixin):
    __tablename__ = "vendors"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact: Mapped[str | None] = mapped_column(String(255), nullable=True)
    trade_type: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(64), default="pending_approval")


class VendorDocument(Base, TenantScopedMixin):
    __tablename__ = "vendor_documents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    vendor_id: Mapped[str] = mapped_column(String(64), ForeignKey("vendors.id"), index=True)
    document_type: Mapped[str] = mapped_column(String(128), nullable=False)
    file_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    expiry_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="pending_review")
    review_comment: Mapped[str | None] = mapped_column(Text, nullable=True)


class Asset(Base, TenantScopedMixin):
    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    asset_code: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(128), nullable=False)
    location_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    criticality: Mapped[str] = mapped_column(String(64), default="medium")
    manufacturer: Mapped[str | None] = mapped_column(String(255), nullable=True)
    compliance_status: Mapped[str] = mapped_column(String(64), default="compliant")


class AssetInspection(Base, TenantScopedMixin):
    __tablename__ = "asset_inspections"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    asset_id: Mapped[str] = mapped_column(String(64), ForeignKey("assets.id"), index=True)
    inspection_type: Mapped[str] = mapped_column(String(128), nullable=False)
    inspected_on: Mapped[Date] = mapped_column(Date, nullable=False)
    inspector_user_id: Mapped[str] = mapped_column(String(64), nullable=False)
    result: Mapped[str] = mapped_column(String(64), nullable=False)
    evidence_file_id: Mapped[str | None] = mapped_column(String(64), nullable=True)


class RiskAssessment(Base, TenantScopedMixin):
    __tablename__ = "risk_assessments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    task_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    location_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    asset_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    hazard_description: Mapped[str] = mapped_column(Text, nullable=False)
    likelihood: Mapped[int] = mapped_column(Integer, nullable=False)
    consequence: Mapped[int] = mapped_column(Integer, nullable=False)
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False)
    residual_risk_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="draft")


class HazardObservation(Base, TenantScopedMixin):
    __tablename__ = "hazard_observations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    location_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    severity: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    photo_file_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="logged")
    assigned_to_user_id: Mapped[str | None] = mapped_column(String(64), nullable=True)


class Permit(Base, TenantScopedMixin):
    __tablename__ = "permits"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    permit_ref: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    permit_type: Mapped[str] = mapped_column(String(128), nullable=False)
    requester_user_id: Mapped[str] = mapped_column(String(64), nullable=False)
    asset_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    zone_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    risk_assessment_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    vendor_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    start_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="draft", index=True)
    controls: Mapped[dict] = mapped_column(JSON, default=dict)


class PermitApproval(Base, TenantScopedMixin):
    __tablename__ = "permit_approvals"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    permit_id: Mapped[str] = mapped_column(String(64), ForeignKey("permits.id"), index=True)
    approver_user_id: Mapped[str] = mapped_column(String(64), nullable=False)
    decision: Mapped[str] = mapped_column(String(64), nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    gps_location: Mapped[str | None] = mapped_column(String(255), nullable=True)


class AuditChecklist(Base, TenantScopedMixin):
    __tablename__ = "audit_checklists"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    standard: Mapped[str] = mapped_column(String(128), nullable=False)
    version: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(64), default="draft")


class AuditExecution(Base, TenantScopedMixin):
    __tablename__ = "audit_executions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    checklist_id: Mapped[str] = mapped_column(String(64), ForeignKey("audit_checklists.id"))
    site_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    auditor_user_id: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(64), default="scheduled")
    answers: Mapped[dict] = mapped_column(JSON, default=dict)


class Finding(Base, TenantScopedMixin):
    __tablename__ = "findings"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    audit_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    source_type: Mapped[str] = mapped_column(String(64), nullable=False)
    severity: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    iso_clause: Mapped[str | None] = mapped_column(String(128), nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="open")


class Capa(Base, TenantScopedMixin):
    __tablename__ = "capas"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    source_type: Mapped[str] = mapped_column(String(64), nullable=False)
    source_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    owner_user_id: Mapped[str] = mapped_column(String(64), nullable=False)
    due_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    severity: Mapped[str] = mapped_column(String(64), default="medium")
    status: Mapped[str] = mapped_column(String(64), default="open")
    evidence_file_id: Mapped[str | None] = mapped_column(String(64), nullable=True)


class Incident(Base, TenantScopedMixin):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    incident_ref: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    reporter_user_id: Mapped[str] = mapped_column(String(64), nullable=False)
    incident_type: Mapped[str] = mapped_column(String(128), nullable=False)
    severity: Mapped[str] = mapped_column(String(64), default="unclassified")
    location_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    is_confidential: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(64), default="reported")


class Investigation(Base, TenantScopedMixin):
    __tablename__ = "investigations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    incident_id: Mapped[str] = mapped_column(String(64), ForeignKey("incidents.id"), index=True)
    lead_user_id: Mapped[str] = mapped_column(String(64), nullable=False)
    rca_method: Mapped[str] = mapped_column(String(64), default="5-why")
    findings: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(64), default="open")


class KnowledgeDocument(Base, TenantScopedMixin):
    __tablename__ = "knowledge_documents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    document_type: Mapped[str] = mapped_column(String(128), nullable=False)
    version: Mapped[str] = mapped_column(String(64), nullable=False)
    file_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="draft")
    tags: Mapped[dict] = mapped_column(JSON, default=dict)


class FileObject(Base, TenantScopedMixin):
    __tablename__ = "file_objects"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str | None] = mapped_column(String(128), nullable=True)
    storage_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    checksum: Mapped[str | None] = mapped_column(String(128), nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="uploaded")


class AiConversation(Base, TenantScopedMixin):
    __tablename__ = "ai_conversations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_citations: Mapped[dict] = mapped_column(JSON, default=dict)
    feedback: Mapped[str | None] = mapped_column(String(64), nullable=True)


class PredictiveRiskScore(Base, TenantScopedMixin):
    __tablename__ = "predictive_risk_scores"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    area_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    trend: Mapped[dict] = mapped_column(JSON, default=dict)
    contributing_factors: Mapped[dict] = mapped_column(JSON, default=dict)


class MobileSyncItem(Base, TenantScopedMixin):
    __tablename__ = "mobile_sync_items"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    client_item_id: Mapped[str] = mapped_column(String(128), nullable=False)
    operation: Mapped[str] = mapped_column(String(128), nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    sync_status: Mapped[str] = mapped_column(String(64), default="pending")
    conflict_details: Mapped[dict] = mapped_column(JSON, default=dict)
