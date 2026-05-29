import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.api.v1.route_factory import register_catalog_routes
from app.core.database import get_db
from app.core.security import CurrentUser, get_current_user
from app.helpers.response import accepted
from app.repositories.generic_repository import GenericRepository

router = APIRouter()

ENDPOINTS = [
    # Overview
    ("GET",    "/overview",                       "org_admin_overview_get",          "Get org overview"),

    # KPIs
    ("GET",    "/kpis",                           "org_admin_kpis_get",              "Get real-time KPIs"),

    # Activities
    ("GET",    "/activities",                     "org_admin_activities_list",       "List recent activities"),

    # Engagement
    ("GET",    "/engagement",                     "org_admin_engagement_get",        "Get engagement & participation data"),

    # Shift Management
    ("GET",    "/shifts",                         "org_admin_shifts_list",           "List shifts"),
    ("POST",   "/shifts",                         "org_admin_shifts_create",         "Create shift"),
    ("PATCH",  "/shifts/{shiftId}",               "org_admin_shifts_update",         "Update shift"),
    ("DELETE", "/shifts/{shiftId}",               "org_admin_shifts_delete",         "Delete shift"),

    # Data Management
    ("GET",    "/data-management/imports",                                  "org_admin_imports_list",               "List import history"),
    ("POST",   "/data-management/import",                                   "org_admin_import_create",              "Create data import"),
    ("GET",    "/data-management/validation-logs",                          "org_admin_validation_logs_list",       "List validation logs"),
    ("GET",    "/data-management/sync-status",                              "org_admin_sync_status_get",            "Get sync status"),
    ("POST",   "/data-management/sync",                                     "org_admin_sync_trigger",               "Trigger sync"),
    ("GET",    "/data-management/api-integrations",                         "org_admin_api_integrations_list",      "List API integrations"),
    ("POST",   "/data-management/api-integrations",                         "org_admin_api_integrations_create",    "Create API integration"),
    ("PATCH",  "/data-management/api-integrations/{integrationId}",         "org_admin_api_integrations_update",    "Update API integration"),
    ("DELETE", "/data-management/api-integrations/{integrationId}",         "org_admin_api_integrations_delete",    "Delete API integration"),

    # Document Library (PDF / DOCX / PPTX)
    ("GET",    "/data-management/documents",                               "org_admin_documents_list",             "List uploaded documents"),
    ("DELETE", "/data-management/documents/{documentId}",                  "org_admin_documents_delete",           "Delete uploaded document"),

    # Help / Support
    ("GET",    "/help/tickets",                   "org_admin_tickets_list",          "List support tickets"),
    ("POST",   "/help/tickets",                   "org_admin_tickets_create",        "Create support ticket"),
    ("GET",    "/help/tickets/{ticketId}",        "org_admin_tickets_get",           "Get support ticket"),

    # Reports
    ("GET",    "/reports/stats",                  "org_admin_reports_stats",         "Report statistics"),
    ("GET",    "/reports",                        "org_admin_reports_list",          "List generated reports"),
    ("POST",   "/reports/generate",               "org_admin_reports_generate",      "Generate a report"),
    ("DELETE", "/reports/{reportId}",             "org_admin_reports_delete",        "Delete a report"),
]

register_catalog_routes(router, "org_admin", ENDPOINTS)


_MODULE = "data_management"
_DOC_RECORD_TYPE = "document"

_ALLOWED_EXTENSIONS = {
    "pdf":  "pdf",
    "doc":  "docx",
    "docx": "docx",
    "ppt":  "pptx",
    "pptx": "pptx",
}

_EXT_CATEGORY = {
    "pdf":  "pdf",
    "docx": "docs",
    "doc":  "docs",
    "pptx": "ppt",
    "ppt":  "ppt",
}


@router.post(
    "/data-management/documents/upload",
    summary="Upload a PDF, DOCX, or PPTX document",
    status_code=status.HTTP_202_ACCEPTED,
)
async def upload_document(
    file: UploadFile = File(...),
    user: Annotated[CurrentUser, Depends(get_current_user)] = None,
    db: Annotated[Session, Depends(get_db)] = None,
):
    filename = file.filename or "upload.bin"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in _ALLOWED_EXTENSIONS:
        return accepted({"error": f"Unsupported file type .{ext}. Allowed: pdf, docx, pptx"}, "Invalid type")

    content = await file.read()
    size_kb = len(content) / 1024
    size_label = f"{size_kb / 1024:.1f} MB" if size_kb > 1024 else f"{size_kb:.0f} KB"

    repo = GenericRepository(db)
    doc_id = str(uuid.uuid4())
    repo.create(
        tenant_id=user.tenant_id,
        module=_MODULE,
        record_type=_DOC_RECORD_TYPE,
        payload={
            "id":          doc_id,
            "file_name":   filename,
            "file_type":   _ALLOWED_EXTENSIONS[ext],
            "category":    _EXT_CATEGORY[ext],
            "size":        size_label,
            "uploaded_by": user.email or user.user_id,
        },
        status="uploaded",
    )
    db.commit()
    return accepted({"id": doc_id, "file_name": filename, "category": _EXT_CATEGORY[ext], "size": size_label}, "Document uploaded")
