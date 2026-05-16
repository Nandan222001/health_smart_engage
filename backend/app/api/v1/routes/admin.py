from fastapi import APIRouter

from app.api.v1.route_factory import register_catalog_routes

router = APIRouter()

ENDPOINTS = [
    ("GET", "/admin/tenants", "admin_tenants_list", "List tenants"),
    ("POST", "/admin/tenants", "admin_tenants_create", "Create tenant"),
    ("GET", "/admin/tenants/{tenantId}", "admin_tenants_get", "Get tenant"),
    ("PATCH", "/admin/tenants/{tenantId}", "admin_tenants_update", "Update tenant"),
    ("GET", "/admin/organisation-nodes", "admin_org_nodes_list", "Organisation hierarchy tree"),
    ("POST", "/admin/organisation-nodes", "admin_org_nodes_create", "Create organisation node"),
    ("PATCH", "/admin/organisation-nodes/{nodeId}", "admin_org_nodes_update", "Update organisation node"),
    ("POST", "/admin/organisation-nodes/{nodeId}/move", "admin_org_nodes_move", "Move organisation node"),
    ("GET", "/admin/users", "admin_users_list", "List users"),
    ("POST", "/admin/users/invitations", "admin_user_invitations_create", "Invite user"),
    ("POST", "/admin/users/{userId}/revoke", "admin_users_revoke", "Revoke user"),
    ("PATCH", "/admin/users/{userId}/roles", "admin_users_roles_update", "Assign roles"),
    ("GET", "/admin/roles", "admin_roles_list", "List roles"),
    ("POST", "/admin/roles", "admin_roles_create", "Create role"),
    ("PATCH", "/admin/roles/{roleId}", "admin_roles_update", "Update role"),
    ("DELETE", "/admin/roles/{roleId}", "admin_roles_delete", "Delete role"),
    ("GET", "/admin/permissions", "admin_permissions_list", "List permissions"),
    ("PUT", "/admin/roles/{roleId}/permissions", "admin_role_permissions_update", "Replace role permissions"),
    ("GET", "/admin/sso/providers", "admin_sso_providers_list", "List SSO providers"),
    ("POST", "/admin/sso/providers", "admin_sso_providers_create", "Configure SSO provider"),
    ("PATCH", "/admin/sso/providers/{providerId}", "admin_sso_providers_update", "Update SSO provider"),
    ("POST", "/admin/sso/providers/{providerId}/test", "admin_sso_providers_test", "Test SSO provider"),
    ("POST", "/admin/sso/providers/{providerId}/enable", "admin_sso_providers_enable", "Enable SSO provider"),
    ("POST", "/admin/sso/providers/{providerId}/disable", "admin_sso_providers_disable", "Disable SSO provider"),
    ("GET", "/admin/workflows", "admin_workflows_list", "List workflows"),
    ("PUT", "/admin/workflows/{workflowKey}", "admin_workflows_update", "Update workflow"),
    ("GET", "/admin/escalation-rules", "admin_escalation_rules_list", "List escalation rules"),
    ("PUT", "/admin/escalation-rules/{ruleId}", "admin_escalation_rules_update", "Update escalation rule"),
    ("GET", "/admin/notification-templates", "admin_notification_templates_list", "List notification templates"),
    ("PUT", "/admin/notification-templates/{templateId}", "admin_notification_templates_update", "Update notification template"),
    ("GET", "/admin/retention-rules", "admin_retention_rules_list", "List retention rules"),
    ("PUT", "/admin/retention-rules/{ruleId}", "admin_retention_rules_update", "Update retention rule"),
    ("GET", "/admin/system-settings", "admin_system_settings_get", "Read system settings"),
    ("PUT", "/admin/system-settings", "admin_system_settings_update", "Update system settings"),
    ("GET", "/admin/data-quality/issues", "admin_data_quality_issues", "List data quality issues"),
    ("POST", "/admin/data-quality/issues/{issueId}/resolve", "admin_data_quality_resolve", "Resolve data quality issue"),
    ("GET", "/admin/audit-logs", "admin_audit_logs_list", "Search audit logs"),
    ("GET", "/admin/audit-logs/{eventId}", "admin_audit_logs_get", "Get audit event"),
    ("POST", "/admin/master-data/imports", "admin_master_data_imports_create", "Import master data"),
    ("GET", "/admin/master-data/imports/{importId}", "admin_master_data_imports_get", "Import status"),
]

register_catalog_routes(router, "admin", ENDPOINTS)
