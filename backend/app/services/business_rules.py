from typing import Any

from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.core.security import CurrentUser
from app.repositories.domain_repository import DomainRepository


class BusinessRuleService:
    def __init__(self, db: Session):
        self.repo = DomainRepository(db)

    def validate_command(
        self,
        user: CurrentUser,
        operation: str,
        payload: dict[str, Any],
        path_params: dict[str, Any],
    ) -> None:
        if "permit" in operation:
            self._validate_permit(user, operation, payload, path_params)
        if "training" in operation or "employee_certifications" in operation:
            self._validate_training_or_certification(operation, payload)
        if "vendor" in operation:
            self._validate_vendor(user, operation, payload)
        if "capa" in operation:
            self._validate_capa(operation, payload)
        if "incident" in operation:
            self._validate_incident(operation, payload)

    def _validate_permit(
        self,
        user: CurrentUser,
        operation: str,
        payload: dict[str, Any],
        path_params: dict[str, Any],
    ) -> None:
        data = payload.get("data", payload)
        asset_id = data.get("asset_id") or data.get("assetId")
        zone_id = data.get("zone_id") or data.get("zoneId")
        vendor_id = data.get("vendor_id") or data.get("vendorId")
        employee_id = data.get("employee_id") or data.get("employeeId")
        required_cert = data.get("required_certification") or data.get("requiredCertification")

        asset = self.repo.get_asset(user.tenant_id, asset_id)
        if asset and asset.compliance_status != "compliant":
            raise AppError(
                code="ASSET_NOT_COMPLIANT",
                message="Permit cannot proceed because the selected asset is not compliant.",
                status_code=422,
                details={"assetId": asset_id, "status": asset.compliance_status},
            )

        vendor = self.repo.get_vendor(user.tenant_id, vendor_id)
        if vendor and vendor.status != "approved":
            raise AppError(
                code="VENDOR_NOT_APPROVED",
                message="Permit cannot proceed because the selected vendor is not approved.",
                status_code=422,
                details={"vendorId": vendor_id, "status": vendor.status},
            )

        if not self.repo.has_valid_certification(user.tenant_id, employee_id, required_cert):
            raise AppError(
                code="CERTIFICATION_REQUIRED",
                message="Employee does not have the required active certification.",
                status_code=422,
                details={"employeeId": employee_id, "certification": required_cert},
            )

        if operation in {"permits_create", "mobile_permits_create", "permits_submit"}:
            conflicts = self.repo.list_active_permit_conflicts(
                tenant_id=user.tenant_id,
                zone_id=zone_id,
                asset_id=asset_id,
                exclude_permit_id=path_params.get("permitId"),
            )
            if conflicts:
                raise AppError(
                    code="PERMIT_CONFLICT_DETECTED",
                    message="Permit conflicts with active work in the same zone or asset.",
                    status_code=409,
                    details={"conflictingPermitIds": [item.id for item in conflicts]},
                )

    def _validate_training_or_certification(self, operation: str, payload: dict[str, Any]) -> None:
        data = payload.get("data", payload)
        if "completion" in operation and not data.get("completed_on") and not data.get("completedOn"):
            raise AppError("TRAINING_DATE_REQUIRED", "Training completion date is required.", 422)

    def _validate_vendor(self, user: CurrentUser, operation: str, payload: dict[str, Any]) -> None:
        data = payload.get("data", payload)
        if "documents_review" in operation and data.get("decision") == "rejected" and not data.get("comment"):
            raise AppError("REJECTION_COMMENT_REQUIRED", "Rejection comment is required.", 422)

    def _validate_capa(self, operation: str, payload: dict[str, Any]) -> None:
        data = payload.get("data", payload)
        if "submit_closure" in operation and not data.get("evidence_file_id") and not data.get("evidenceFileId"):
            raise AppError("CAPA_EVIDENCE_REQUIRED", "Evidence is required before CAPA closure.", 422)

    def _validate_incident(self, operation: str, payload: dict[str, Any]) -> None:
        data = payload.get("data", payload)
        if "classify" in operation and not data.get("severity"):
            raise AppError("INCIDENT_SEVERITY_REQUIRED", "Incident severity is required.", 422)
