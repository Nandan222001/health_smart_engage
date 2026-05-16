# Data Quality Dashboard

| Field | Detail |
|---|---|
| Page Type | Dashboard |
| Module | Administration |
| Primary Roles | Product Owner, System Admin |
| Purpose | Show missing or invalid data. |

## What This Page Shows

| Area | Content |
|---|---|
| Header | Page title, site/tenant context, date range where applicable, role-aware actions |
| Filters | Status, site, department, owner, date range, severity, category, or module-specific filters |
| Main Content | Missing master data, sync errors, invalid references, duplicate records |
| Primary Action | Resolve issue or assign data fix |
| Output | Data quality remediation |
| Audit Behavior | View, create, update, approve, reject, export, and confidential access actions are audit logged where applicable |

## Page Flowchart

```mermaid
flowchart TD
    Start([User opens Data Quality Dashboard])
    Auth[Validate session, tenant, role, and record access]
    Context[Load page context: site, department, date range, permissions]
    Data[Load data: Missing master data, sync errors, invalid references, duplicate records]
    View[Render page layout and status indicators]
    Decision{User action}
    Action[Perform action: Resolve issue or assign data fix]
    Validate[Validate business rules and permissions]
    Save[Save changes and write audit event]
    Notify[Send notifications or refresh dashboards if needed]
    Output[Result: Data quality remediation]
    Blocked[Show access denied or validation message]

    Start --> Auth
    Auth -->|Allowed| Context
    Auth -->|Denied| Blocked
    Context --> Data
    Data --> View
    View --> Decision
    Decision -->|View / filter / drill down| Data
    Decision -->|Create / update / approve / export| Action
    Action --> Validate
    Validate -->|Valid| Save
    Validate -->|Invalid| Blocked
    Save --> Notify
    Notify --> Output
```