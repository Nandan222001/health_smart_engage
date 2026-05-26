# Backward-compatibility re-exports. Import from feature modules directly for new code.
from app.models.base import TenantScopedMixin
from app.models.foundation import OrganisationNode
from app.models.auth import User, Role
from app.models.people import Employee, Certification, TrainingRequirement, TrainingCompletion
from app.models.vendors import Vendor, VendorDocument, VendorCompliance
from app.models.assets import Asset, AssetInspection, AssetMaintenanceLog
from app.models.risks import RiskAssessment, HazardObservation
from app.models.permits import Permit, PermitApproval
from app.models.compliance import AuditChecklist, AuditExecution, Finding, Capa
from app.models.incidents import Incident, Investigation
from app.models.knowledge import KnowledgeDocument
from app.models.files import FileObject
from app.models.ai import AiConversation, AIRecommendation, PredictiveRiskScore
from app.models.workflow import WorkflowCase, WorkflowStageEvent, WorkflowApproval, WorkflowCAPA, WorkflowResolution, WorkflowAlert
from app.models.outputs import Report, AlertRule, ExportJob, Integration
from app.models.learning import MLModel, MLModelVersion, DetectedPattern, OperationalEvent
from app.models.sync import MobileSyncItem

__all__ = [
    "TenantScopedMixin", "OrganisationNode", "User", "Role",
    "Employee", "Certification", "TrainingRequirement", "TrainingCompletion",
    "Vendor", "VendorDocument", "Asset", "AssetInspection",
    "RiskAssessment", "HazardObservation", "Permit", "PermitApproval",
    "AuditChecklist", "AuditExecution", "Finding", "Capa",
    "Incident", "Investigation", "KnowledgeDocument", "FileObject",
    "AiConversation", "AIRecommendation", "PredictiveRiskScore",
    "WorkflowCase", "WorkflowStageEvent", "WorkflowApproval", "WorkflowCAPA",
    "WorkflowResolution", "WorkflowAlert", "Report", "AlertRule", "ExportJob",
    "Integration", "MLModel", "MLModelVersion", "DetectedPattern",
    "OperationalEvent", "MobileSyncItem",
]
