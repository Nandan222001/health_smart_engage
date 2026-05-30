from fastapi import APIRouter
from app.api.v1.route_factory import register_catalog_routes

router = APIRouter()

ENDPOINTS = [
    ("GET",  "/workflows/dashboard",                                          "workflows_dashboard",            "Workflow engine dashboard"),
    ("GET",  "/workflows/cases",                                              "workflows_cases_list",           "List workflow cases"),
    ("GET",  "/workflows/cases/{caseId}",                                     "workflows_cases_get",            "Get workflow case"),
    ("POST", "/workflows/cases/{caseId}/approvals/{approvalId}/approve",      "workflow_cases_approve",         "Approve case"),
    ("POST", "/workflows/cases/{caseId}/approvals/{approvalId}/reject",       "workflow_cases_reject",          "Reject case"),
    ("POST", "/workflows/cases/{caseId}/escalate",                            "workflow_cases_escalate",        "Escalate case"),
    ("POST", "/workflows/cases/{caseId}/advance",                             "workflow_cases_advance",         "Advance case stage"),
    ("POST", "/workflows/resolutions/{resolutionId}/evidence",                "workflow_resolutions_evidence",  "Submit resolution evidence"),
    ("POST", "/workflows/resolutions/{resolutionId}/verify",                  "workflow_resolutions_verify",    "Verify resolution"),
    ("POST", "/workflows/alerts/{alertId}/acknowledge",                       "workflow_alerts_acknowledge",    "Acknowledge alert"),
]

register_catalog_routes(router, "web", ENDPOINTS)
