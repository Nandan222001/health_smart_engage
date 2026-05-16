from typing import Any
from sqlalchemy.orm import Session
from app.core.security import CurrentUser
from app.services.ai_service import AiService
from app.services.file_storage_service import FileStorageService
from app.services.mobile_sync_service import MobileSyncService
from app.services.notification_service import NotificationService
from app.services.report_service import ReportService
from app.services.workflow_service import WorkflowService
from app.services.permit_service import PermitService
from app.services.people_service import PeopleService
from app.services.asset_service import AssetService
from app.services.compliance_service import ComplianceService

from app.services.dashboard_service import DashboardService

class DomainDispatcher:
    def __init__(self):
        self.workflow = WorkflowService()
        self.notifications = NotificationService()
        self.files = FileStorageService()
        self.reports = ReportService()
        self.mobile_sync = MobileSyncService()
        self.ai = AiService()

    def _get_services(self, db: Session):
        return {
            "permits": PermitService(db),
            "people": PeopleService(db),
            "assets": AssetService(db),
            "compliance": ComplianceService(db),
            "dashboards": DashboardService(db)
        }

    def execute_special_command(
        self,
        user: CurrentUser,
        operation: str,
        payload: dict[str, Any],
        path_params: dict[str, Any],
        db: Session = None
    ) -> dict[str, Any] | None:
        data = payload.get("data", payload)
        svc = self._get_services(db) if db else {}

        # Permit Commands
        if operation in ["permits_create", "mobile_permits_create"]:
            res = svc["permits"].create_permit(user, data)
            return {"id": res.id, "ref": res.permit_ref, "status": res.status}
        if operation == "permits_submit":
            res = svc["permits"].submit_permit(user, path_params.get("permitId"))
            return {"id": res.id, "status": res.status}
        if operation in ["permits_approve", "mobile_permits_approve"]:
            res = svc["permits"].approve_permit(user, path_params.get("permitId"), data)
            return {"id": res.id, "status": res.status}
        if operation in ["permits_reject", "mobile_permits_reject"]:
            res = svc["permits"].reject_permit(user, path_params.get("permitId"), data)
            return {"id": res.id, "status": res.status}
        if operation in ["permits_close", "mobile_permits_close"]:
            res = svc["permits"].close_permit(user, path_params.get("permitId"), data)
            return {"id": res.id, "status": res.status}

        # People & Training Commands
        if operation == "employees_create":
            res = svc["people"].create_employee(user, data)
            return {"id": res.id}
        if operation == "employee_certifications_create":
            res = svc["people"].add_certification(user, path_params.get("employeeId"), data)
            return {"id": res.id}

        # Asset Commands
        if operation == "assets_create":
            res = svc["assets"].create_asset(user, data)
            return {"id": res.id}
        if operation in ["asset_inspections_create", "mobile_asset_inspections_create"]:
            res = svc["assets"].record_inspection(user, path_params.get("assetId"), data)
            return {"id": res.id}

        # Compliance Commands
        if operation == "audits_create":
            res = svc["compliance"].create_audit_execution(user, data)
            return {"id": res.id}
        if operation == "audit_findings_create":
            res = svc["compliance"].create_finding(user, path_params.get("auditId"), data)
            return {"id": res.id}
        if operation == "incidents_classify":
            res = svc["compliance"].classify_incident(user, path_params.get("incidentId"), data)
            return {"id": res.id, "status": res.status}
        if operation == "incident_investigations_create":
            res = svc["compliance"].start_investigation(user, path_params.get("incidentId"), data)
            return {"id": res.id}

        # Integration Commands
        if operation == "integrations_hr_employees_upsert":
            res = svc["people"].create_employee(user, data)
            return {"id": res.id, "status": "upserted"}
        if operation == "integrations_assets_upsert":
            res = svc["assets"].create_asset(user, data)
            return {"id": res.id, "status": "upserted"}

        # Original Generic Logic
        if operation == "integrations_documents_upload_url":
            file_name = data.get("fileName") or data.get("file_name") or "upload.bin"
            target = self.files.create_upload_target(file_name, data.get("contentType"))
            return {"upload": target.__dict__}
        if operation == "reports_generate" or operation.startswith("reports_"):
            return self.reports.generate(operation, data)
        if operation == "mobile_sync_pull":
            return self.mobile_sync.pull(user.user_id, data.get("lastSyncToken"))
        if operation == "mobile_sync_push":
            return self.mobile_sync.push(user.user_id, data.get("changes", []))
        if operation.startswith("ai_advisor_query") or operation == "mobile_ai_advisor_query":
            return self.ai.answer(data.get("question", ""), data)
        
        return None

    def execute_special_query(
        self,
        user: CurrentUser,
        operation: str,
        path_params: dict[str, Any],
        db: Session = None
    ) -> dict[str, Any] | None:
        svc = self._get_services(db) if db else {}

        # Dashboard Queries
        if operation == "dashboard_executive_safety":
            return svc["dashboards"].get_executive_safety(user)
        if operation == "dashboard_site_command":
            return svc["dashboards"].get_site_command(user)
        if operation == "dashboard_training_compliance":
            return svc["dashboards"].get_training_compliance(user)
        if operation == "dashboard_vendor_compliance":
            return svc["dashboards"].get_vendor_compliance(user)
        if operation == "dashboard_asset_compliance":
            return svc["dashboards"].get_asset_compliance(user)

        # Queries
        if operation in ["permits_list", "mobile_permits_list"]:
            items = svc["permits"].list_permits(user, {})
            return {"items": [i.__dict__ for i in items]}
        if operation in ["permits_get", "mobile_permits_get"]:
            res = svc["permits"].get_permit(user, path_params.get("permitId"))
            return res.__dict__
        
        if operation == "employees_list":
            items = svc["people"].list_employees(user, {})
            return {"items": [i.__dict__ for i in items]}
        
        if operation == "assets_list":
            items = svc["assets"].list_assets(user, {})
            return {"items": [i.__dict__ for i in items]}

        if operation == "health_dependencies":
            return {"database": "configured", "storage": "configured", "ai": "configured"}
        if operation == "ai_predictive_risk_area_get":
            return self.ai.predictive_risk(path_params.get("areaId", "unknown"))
        
        return None
