from fastapi import APIRouter

from app.api.v1.route_factory import register_catalog_routes
from app.core.config import settings

router = APIRouter()


@router.get("/health/live", summary="Liveness check")
async def live() -> dict:
    return {"success": True, "message": "OK", "data": {"status": "live"}}


@router.get("/health/ready", summary="Readiness check")
async def ready() -> dict:
    return {
        "success": True,
        "message": "OK",
        "data": {"status": "ready", "environment": settings.app_env},
    }


ENDPOINTS = [
    ("POST", "/auth/login", "auth_login", "Email/password login"),
    ("POST", "/auth/logout", "auth_logout", "Logout current session"),
    ("POST", "/auth/refresh", "auth_refresh", "Refresh access token"),
    ("GET", "/auth/me", "auth_me", "Current user profile and claims"),
    ("GET", "/auth/sso/{providerKey}/start", "auth_sso_start", "Start SSO flow"),
    ("GET", "/auth/sso/{providerKey}/callback", "auth_sso_callback", "Complete SSO flow"),
    ("POST", "/files", "files_upload", "Upload file/evidence"),
    ("GET", "/files/{fileId}", "files_get_metadata", "File metadata"),
    ("GET", "/files/{fileId}/download", "files_download", "Download file"),
    ("DELETE", "/files/{fileId}", "files_delete_draft", "Delete draft file"),
    ("POST", "/files/{fileId}/link", "files_link", "Link file to business record"),
    ("GET", "/notifications", "notifications_list", "List user notifications"),
    ("POST", "/notifications/{notificationId}/read", "notifications_mark_read", "Mark notification read"),
    ("POST", "/notifications/read-all", "notifications_read_all", "Mark all notifications read"),
    ("GET", "/notifications/preferences", "notification_preferences_get", "Get notification preferences"),
    ("PUT", "/notifications/preferences", "notification_preferences_update", "Update notification preferences"),
    ("GET", "/search/global", "search_global", "Global search"),
    ("GET", "/search/people", "search_people", "Search employees/users"),
    ("GET", "/search/assets", "search_assets", "Search assets"),
    ("GET", "/search/vendors", "search_vendors", "Search vendors"),
    ("GET", "/search/knowledge", "search_knowledge", "Search knowledge"),
    ("GET", "/reports/templates", "reports_templates", "List report templates"),
    ("POST", "/reports/generate", "reports_generate", "Generate report"),
    ("GET", "/reports/jobs/{jobId}", "reports_job_status", "Report generation status"),
    ("GET", "/reports/jobs/{jobId}/download", "reports_job_download", "Download generated report"),
    ("GET", "/audit-logs/record/{recordType}/{recordId}", "audit_logs_record", "Record audit timeline"),
    ("GET", "/audit-logs/my-access", "audit_logs_my_access", "User access log"),
    ("GET", "/audit-logs/exports", "audit_logs_exports", "Export event logs"),
    ("GET", "/health/dependencies", "health_dependencies", "Dependency status"),
    ("GET", "/observability/correlation/{correlationId}", "observability_correlation", "Trace by correlation ID"),
]

register_catalog_routes(router, "shared", ENDPOINTS)
