# Admin & System Setup Flow

## Tenant & Organisation Setup Flow

```mermaid
flowchart TD
    SUPER_ADMIN([Super Admin /\nPlatform Operator]) --> TENANT_LIST[Open Tenant Management\nGET /admin/tenants]
    TENANT_LIST --> CREATE_TENANT[Create New Tenant\nPOST /admin/tenants\nOrganisation name · Domain · Plan tier]
    CREATE_TENANT --> TENANT_SAVED[Tenant created\nTenant ID assigned]

    TENANT_SAVED --> ORG_TREE[Build Organisation Tree\nGET /admin/organisation-nodes]
    ORG_TREE --> CREATE_ROOT[Create Root Node\nPOST /admin/organisation-nodes\nType: Company / Division / Site / Department]

    CREATE_ROOT --> ADD_CHILDREN[Add child nodes\nSites · Departments · Teams]
    ADD_CHILDREN --> MOVE_NODES{Restructure\nNeeded?}
    MOVE_NODES -->|Yes| MOVE[Move node to new parent\nPOST /admin/organisation-nodes/{nodeId}/move]
    MOVE --> ADD_CHILDREN
    MOVE_NODES -->|No| ORG_DONE[Organisation structure ready]
```

---

## SSO Configuration Flow

```mermaid
flowchart TD
    ADMIN([System Administrator]) --> SSO_LIST[Open SSO Configuration\nGET /admin/sso/providers]
    SSO_LIST --> ADD_SSO[Add SSO Provider\nPOST /admin/sso/providers]
    ADD_SSO --> SSO_FORM[Enter SSO Details\nProvider name · Type: Azure AD / Okta / SAML / OIDC\nClient ID · Client secret · Tenant/Domain\nAuthorisation URL · Token URL · JWKS URI]
    SSO_FORM --> SAVE_SSO[SSO provider saved\nStatus: CONFIGURED — not yet active]
    SAVE_SSO --> TEST_SSO[Test SSO Connection\nPOST /admin/sso/providers/{providerId}/test]
    TEST_SSO --> TEST_RESULT{Test\nSuccessful?}
    TEST_RESULT -->|Fail| FIX_CONFIG[Review configuration\nCheck client ID · Secret · URLs]
    FIX_CONFIG --> SSO_FORM
    TEST_RESULT -->|Pass| ENABLE_SSO[Enable SSO Provider\nPOST /admin/sso/providers/{providerId}/enable]
    ENABLE_SSO --> SSO_ACTIVE[SSO provider ACTIVE\nLogin screen shows SSO option]
```

---

## Role & Permission Management Flow

```mermaid
flowchart TD
    ADMIN([System Administrator]) --> ROLES_LIST[Open Role Management\nGET /admin/roles]
    ROLES_LIST --> NEW_ROLE_Q{Create\nnew role?}
    NEW_ROLE_Q -->|Yes| CREATE_ROLE[POST /admin/roles\nRole name · Description]
    NEW_ROLE_Q -->|No — edit existing| SELECT_ROLE[Select existing role]

    CREATE_ROLE & SELECT_ROLE --> PERM_LIST[View available permissions\nGET /admin/permissions]
    PERM_LIST --> ASSIGN_PERMS[Select permissions to assign\nPUT /admin/roles/{roleId}/permissions\nReplace full permission set]

    ASSIGN_PERMS --> PERMS_SAVED[Permissions saved\nUsers with this role get updated access\non their next request]

    PERMS_SAVED --> REVIEW_Q{Review\nusers with role?}
    REVIEW_Q -->|Yes| USER_LIST[Filter users by role\nGET /admin/users?role={roleId}]
    USER_LIST --> VERIFY[Verify correct users\nhave this role]
    REVIEW_Q -->|No| DONE_ROLE([Done])
    VERIFY --> DONE_ROLE
```

---

## User Management Flow (Admin)

```mermaid
flowchart TD
    ADMIN([System Administrator]) --> USER_DIR[Open User Directory\nGET /admin/users]
    USER_DIR --> SEARCH[Search / filter users\nBy name · email · role · status · site]
    SEARCH --> USER_ACTIONS{Action}

    USER_ACTIONS -->|Invite new user| INVITE[POST /admin/users/invitations\n→ see Invitation Flow]
    USER_ACTIONS -->|Change user role| CHANGE_ROLE[PATCH /admin/users/{userId}/roles\nNew role assigned immediately]
    USER_ACTIONS -->|Revoke access| REVOKE[POST /admin/users/{userId}/revoke\nAll sessions invalidated]
    USER_ACTIONS -->|View audit trail| AUDIT[GET /admin/audit-logs?userId={id}\nAll actions by this user]
    USER_ACTIONS -->|Re-send invitation| RESEND_INV[POST /admin/users/invitations\nnew invite for same email]
```

---

## Workflow & Escalation Configuration

```mermaid
flowchart TD
    ADMIN([System Administrator]) --> WORKFLOW_LIST[Open Workflow Configuration\nGET /admin/workflows]
    WORKFLOW_LIST --> SELECT_WF[Select workflow to configure\nPermit approval · CAPA closure\nIncident classification · Vendor review]
    SELECT_WF --> EDIT_WF[Edit workflow settings\nPUT /admin/workflows/{workflowKey}\nApprovers · Deadlines · Auto-escalation rules]
    EDIT_WF --> SAVE_WF[Workflow updated\nActive immediately]

    ADMIN --> ESC_LIST[Open Escalation Rules\nGET /admin/escalation-rules]
    ESC_LIST --> EDIT_ESC[Edit escalation rule\nPUT /admin/escalation-rules/{ruleId}\nTrigger condition · Delay · Escalation target]
    EDIT_ESC --> SAVE_ESC[Escalation rule saved]
```

---

## Audit Log Review Flow

```mermaid
flowchart TD
    ADMIN([Admin / Compliance Officer]) --> AUDIT_LOG[Open Audit Log Viewer\nGET /admin/audit-logs]
    AUDIT_LOG --> FILTER_LOGS[Filter audit logs\nBy user · entity type · date range\noperation type · tenant]
    FILTER_LOGS --> LOG_LIST[Log entries displayed\nTimestamp · User · Operation\nEntity · Before / After values]
    LOG_LIST --> SELECT_LOG[Select an event]
    SELECT_LOG --> LOG_DETAIL[View event detail\nGET /admin/audit-logs/{eventId}\nFull before/after snapshot · IP · Session ID]
    LOG_DETAIL --> EXPORT_Q{Export\nneeded?}
    EXPORT_Q -->|Yes| EXPORT_LOGS[Export log entries\nGET /audit-logs/exports\nCSV / PDF for compliance audit]
    EXPORT_Q -->|No| DONE_LOG([Done])
```

---

## Data Import Flow (Master Data)

```mermaid
flowchart TD
    ADMIN([System Administrator]) --> IMPORT_SCREEN[Open Master Data Import\nPOST /admin/master-data/imports]
    IMPORT_SCREEN --> SELECT_TYPE[Select import type\nEmployees · Assets · Vendors\nTraining records · Organisation nodes]
    SELECT_TYPE --> DOWNLOAD_TEMPLATE[Download CSV template]
    DOWNLOAD_TEMPLATE --> FILL_DATA[Fill template with data\nValidate format offline]
    FILL_DATA --> UPLOAD_FILE[Upload completed file\nPOST /admin/master-data/imports]
    UPLOAD_FILE --> VALIDATE[Server validates file\nCheck required fields · Formats · Duplicates]
    VALIDATE --> VALIDATE_RESULT{Validation\nPassed?}
    VALIDATE_RESULT -->|Errors found| ERROR_REPORT[Download error report\nFix data errors]
    ERROR_REPORT --> FILL_DATA
    VALIDATE_RESULT -->|Pass| IMPORT_JOB[Import job created\nBackground processing starts]
    IMPORT_JOB --> POLL_STATUS[Poll status\nGET /admin/master-data/imports/{importId}]
    POLL_STATUS --> IMPORT_STATUS{Job\nStatus}
    IMPORT_STATUS -->|Processing| POLL_STATUS
    IMPORT_STATUS -->|Complete| IMPORT_DONE[Import successful\nRecords created in system]
    IMPORT_STATUS -->|Failed| IMPORT_FAILED[View failure details\nPartial rollback applied]
```
