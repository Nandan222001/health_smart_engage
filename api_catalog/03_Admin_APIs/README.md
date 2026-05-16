# Admin APIs

APIs for tenant setup, organisation configuration, identity, roles, permissions, workflow settings, and system administration.

## Tenant and Organisation APIs

| Method | Endpoint | Purpose | Roles |
|---|---|---|---|
| GET | `/api/v1/admin/tenants` | List tenants | System Admin |
| POST | `/api/v1/admin/tenants` | Create tenant | System Admin |
| GET | `/api/v1/admin/tenants/{tenantId}` | Tenant detail | System Admin |
| PATCH | `/api/v1/admin/tenants/{tenantId}` | Update tenant settings | System Admin |
| GET | `/api/v1/admin/organisation-nodes` | Organisation hierarchy tree | System Admin, Plant Manager |
| POST | `/api/v1/admin/organisation-nodes` | Create organisation node | System Admin |
| PATCH | `/api/v1/admin/organisation-nodes/{nodeId}` | Update node | System Admin |
| POST | `/api/v1/admin/organisation-nodes/{nodeId}/move` | Move node in hierarchy | System Admin |

## User, Role, and Permission APIs

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| GET | `/api/v1/admin/users` | List users | Filter by role/status/site |
| POST | `/api/v1/admin/users/invitations` | Invite user | Sends one-time link |
| POST | `/api/v1/admin/users/{userId}/revoke` | Revoke user access | Audited |
| PATCH | `/api/v1/admin/users/{userId}/roles` | Assign/change roles | Takes effect on next login |
| GET | `/api/v1/admin/roles` | List roles | Includes default/custom |
| POST | `/api/v1/admin/roles` | Create custom role | Cannot overwrite system roles |
| PATCH | `/api/v1/admin/roles/{roleId}` | Update custom role | Audited |
| DELETE | `/api/v1/admin/roles/{roleId}` | Delete custom role | Block if assigned/system role |
| GET | `/api/v1/admin/permissions` | List available permissions | Module-level |
| PUT | `/api/v1/admin/roles/{roleId}/permissions` | Replace role permission set | Read/write/approve flags |

## Identity and SSO APIs

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| GET | `/api/v1/admin/sso/providers` | List SSO providers | IT Admin |
| POST | `/api/v1/admin/sso/providers` | Configure SSO provider | SAML/OIDC |
| PATCH | `/api/v1/admin/sso/providers/{providerId}` | Update SSO provider | Audited |
| POST | `/api/v1/admin/sso/providers/{providerId}/test` | Test SSO configuration | No production change |
| POST | `/api/v1/admin/sso/providers/{providerId}/enable` | Enable provider | IT Admin |
| POST | `/api/v1/admin/sso/providers/{providerId}/disable` | Disable provider | IT Admin |

## Configuration APIs

| Method | Endpoint | Purpose | Owner |
|---|---|---|---|
| GET | `/api/v1/admin/workflows` | List workflow definitions | System Admin |
| PUT | `/api/v1/admin/workflows/{workflowKey}` | Update workflow definition | System Admin |
| GET | `/api/v1/admin/escalation-rules` | List escalation rules | Safety Manager |
| PUT | `/api/v1/admin/escalation-rules/{ruleId}` | Update escalation rule | Safety Manager |
| GET | `/api/v1/admin/notification-templates` | List notification templates | System Admin |
| PUT | `/api/v1/admin/notification-templates/{templateId}` | Update notification template | System Admin |
| GET | `/api/v1/admin/retention-rules` | List retention rules | Compliance Manager |
| PUT | `/api/v1/admin/retention-rules/{ruleId}` | Update retention rule | Compliance Manager |
| GET | `/api/v1/admin/system-settings` | Read platform settings | System Admin |
| PUT | `/api/v1/admin/system-settings` | Update platform settings | System Admin |

## Data Quality and Audit Administration APIs

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| GET | `/api/v1/admin/data-quality/issues` | List data quality issues | Missing/invalid/sync |
| POST | `/api/v1/admin/data-quality/issues/{issueId}/resolve` | Mark issue resolved | Audited |
| GET | `/api/v1/admin/audit-logs` | Search audit logs | Restricted |
| GET | `/api/v1/admin/audit-logs/{eventId}` | Audit event detail | Immutable |
| POST | `/api/v1/admin/master-data/imports` | Import master data | Validates before apply |
| GET | `/api/v1/admin/master-data/imports/{importId}` | Import status | Includes errors |
