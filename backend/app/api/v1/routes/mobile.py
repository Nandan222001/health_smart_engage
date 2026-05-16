from fastapi import APIRouter

from app.api.v1.route_factory import register_catalog_routes

router = APIRouter()

ENDPOINTS = [
    ("GET", "/mobile/profile", "mobile_profile", "Get mobile profile"),
    ("GET", "/mobile/home", "mobile_home", "Get mobile home"),
    ("GET", "/mobile/tasks", "mobile_tasks", "Get mobile tasks"),
    ("PATCH", "/mobile/tasks/{taskId}/status", "mobile_task_status", "Update mobile task status"),
    ("GET", "/mobile/notifications", "mobile_notifications", "Get mobile notifications"),
    ("POST", "/mobile/notifications/{notificationId}/read", "mobile_notification_read", "Mark mobile notification read"),
    ("POST", "/mobile/sync/pull", "mobile_sync_pull", "Pull offline sync delta"),
    ("POST", "/mobile/sync/push", "mobile_sync_push", "Push offline sync delta"),
    ("GET", "/mobile/sync/status", "mobile_sync_status", "Get mobile sync status"),
    ("POST", "/mobile/sync/conflicts/{conflictId}/resolve", "mobile_sync_conflict_resolve", "Resolve sync conflict"),
    ("POST", "/mobile/incidents", "mobile_incidents_create", "Submit mobile incident"),
    ("POST", "/mobile/incidents/{incidentId}/attachments", "mobile_incident_attachments", "Upload incident attachment"),
    ("GET", "/mobile/incidents/{incidentId}", "mobile_incidents_get", "Get mobile incident"),
    ("POST", "/mobile/hazards", "mobile_hazards_create", "Submit mobile hazard"),
    ("POST", "/mobile/hazards/{hazardId}/close", "mobile_hazards_close", "Close mobile hazard"),
    ("GET", "/mobile/hazards/my", "mobile_hazards_my", "List user's hazards"),
    ("GET", "/mobile/permits", "mobile_permits_list", "List mobile permits"),
    ("POST", "/mobile/permits", "mobile_permits_create", "Create mobile permit"),
    ("GET", "/mobile/permits/live-board", "mobile_permit_live_board", "Mobile live permit board"),
    ("GET", "/mobile/permits/{permitId}", "mobile_permits_get", "Get mobile permit"),
    ("POST", "/mobile/permits/{permitId}/approve", "mobile_permits_approve", "Approve mobile permit"),
    ("POST", "/mobile/permits/{permitId}/reject", "mobile_permits_reject", "Reject mobile permit"),
    ("POST", "/mobile/permits/{permitId}/extend", "mobile_permits_extend", "Extend mobile permit"),
    ("POST", "/mobile/permits/{permitId}/close", "mobile_permits_close", "Close mobile permit"),
    ("GET", "/mobile/audits/assigned", "mobile_audits_assigned", "Assigned mobile audits"),
    ("GET", "/mobile/audits/{auditId}/checklist", "mobile_audit_checklist", "Download mobile checklist"),
    ("PATCH", "/mobile/audits/{auditId}/answers/{questionId}", "mobile_audit_answer", "Save audit answer"),
    ("POST", "/mobile/audits/{auditId}/evidence", "mobile_audit_evidence", "Upload audit evidence"),
    ("POST", "/mobile/audits/{auditId}/complete", "mobile_audit_complete", "Complete mobile audit"),
    ("POST", "/mobile/contractors/scan", "mobile_contractors_scan", "Scan contractor QR"),
    ("GET", "/mobile/vendors/{vendorId}/status", "mobile_vendor_status", "Vendor compliance status"),
    ("GET", "/mobile/assets/search", "mobile_assets_search", "Search mobile assets"),
    ("GET", "/mobile/assets/{assetId}/status", "mobile_asset_status", "Asset compliance status"),
    ("POST", "/mobile/assets/{assetId}/inspections", "mobile_asset_inspections_create", "Record mobile inspection"),
    ("GET", "/mobile/knowledge/search", "mobile_knowledge_search", "Search mobile SOPs"),
    ("GET", "/mobile/knowledge/documents/{documentId}", "mobile_knowledge_document", "Mobile SOP detail"),
    ("POST", "/mobile/knowledge/documents/{documentId}/acknowledge", "mobile_knowledge_acknowledge", "Acknowledge SOP"),
    ("POST", "/mobile/ai/advisor/query", "mobile_ai_advisor_query", "Mobile AI advisor query"),
    ("GET", "/mobile/ai/conversations", "mobile_ai_conversations", "List mobile AI conversations"),
    ("POST", "/mobile/ai/responses/{responseId}/feedback", "mobile_ai_feedback", "AI feedback"),
]

register_catalog_routes(router, "mobile", ENDPOINTS)
