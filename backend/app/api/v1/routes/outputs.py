from fastapi import APIRouter
from app.api.v1.route_factory import register_catalog_routes

router = APIRouter()

ENDPOINTS = [
    ("GET",   "/outputs/dashboard",              "outputs_dashboard",         "Operational dashboard KPIs"),
    ("GET",   "/outputs/reports",                "outputs_reports_list",      "List reports"),
    ("POST",  "/outputs/reports/generate",       "outputs_reports_generate",  "Generate report"),
    ("GET",   "/outputs/insights",               "outputs_insights_list",     "AI insights feed"),
    ("POST",  "/outputs/insights/{insightId}/action", "outputs_insights_action", "Action an insight"),
    ("GET",   "/outputs/alerts",                 "outputs_alerts_dashboard",  "Alerts dashboard"),
    ("PATCH", "/outputs/alerts/rules/{ruleId}",  "outputs_alert_rules_update","Update alert rule"),
    ("GET",   "/outputs/exports",                "outputs_exports_list",      "List export jobs"),
    ("POST",  "/outputs/exports",                "outputs_exports_create",    "Create export job"),
]

register_catalog_routes(router, "web", ENDPOINTS)
