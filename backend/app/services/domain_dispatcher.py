from typing import Any

from app.core.security import CurrentUser
from app.services.ai_service import AiService
from app.services.file_storage_service import FileStorageService
from app.services.mobile_sync_service import MobileSyncService
from app.services.notification_service import NotificationService
from app.services.report_service import ReportService
from app.services.workflow_service import WorkflowService


class DomainDispatcher:
    def __init__(self):
        self.workflow = WorkflowService()
        self.notifications = NotificationService()
        self.files = FileStorageService()
        self.reports = ReportService()
        self.mobile_sync = MobileSyncService()
        self.ai = AiService()

    def execute_special_command(
        self,
        user: CurrentUser,
        operation: str,
        payload: dict[str, Any],
        path_params: dict[str, Any],
    ) -> dict[str, Any] | None:
        data = payload.get("data", payload)
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
        if operation.endswith("_approve") or "approve" in operation:
            return self.workflow.transition(operation, "approve", {"pathParams": path_params, "payload": data})
        if operation.endswith("_reject") or "reject" in operation:
            return self.workflow.transition(operation, "reject", {"pathParams": path_params, "payload": data})
        if operation.startswith("ai_advisor_query") or operation == "mobile_ai_advisor_query":
            return self.ai.answer(data.get("question", ""), data)
        return None

    def execute_special_query(
        self,
        user: CurrentUser,
        operation: str,
        path_params: dict[str, Any],
    ) -> dict[str, Any] | None:
        if operation == "health_dependencies":
            return {"database": "configured", "storage": "configured", "ai": "configured"}
        if operation == "ai_predictive_risk_area_get":
            return self.ai.predictive_risk(path_params.get("areaId", "unknown"))
        return None
