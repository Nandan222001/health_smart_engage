from fastapi import APIRouter
from app.api.v1.route_factory import register_catalog_routes

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
