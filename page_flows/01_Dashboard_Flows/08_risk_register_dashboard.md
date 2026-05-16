# Risk Register Dashboard

| Field | Detail |
|---|---|
| Page Type | Dashboard |
| Module | Risk and Hazard |
| Primary Roles | Risk Manager, Safety Manager, Plant Manager |
| Purpose | Show risk trends. |

## What This Page Shows

| Area | Content |
|---|---|
| Header | Page title, site/tenant context, date range where applicable, role-aware actions |
| Filters | Status, site, department, owner, date range, severity, category, or module-specific filters |
| Main Content | Risk scores, severity bands, open controls, hazard trends, high-risk locations |
| Primary Action | Open risk assessment or export register |
| Output | Risk register report |
| Audit Behavior | View, create, update, approve, reject, export, and confidential access actions are audit logged where applicable |

## Page Flowchart

```mermaid
flowchart TD
    Start([User opens Risk Register Dashboard])
    Auth[Validate session, tenant, role, and record access]
    Context[Load page context: site, department, date range, permissions]
    Data[Load data: Risk scores, severity bands, open controls, hazard trends, high-risk locations]
    View[Render page layout and status indicators]
    Decision{User action}
    Action[Perform action: Open risk assessment or export register]
    Validate[Validate business rules and permissions]
    Save[Save changes and write audit event]
    Notify[Send notifications or refresh dashboards if needed]
    Output[Result: Risk register report]
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