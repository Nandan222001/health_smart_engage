# Audit and CAPA Dashboard

| Field | Detail |
|---|---|
| Page Type | Dashboard |
| Module | Compliance and CAPA |
| Primary Roles | Compliance Manager, Safety Auditor, Safety Manager |
| Purpose | Show audit and corrective action health. |

## What This Page Shows

| Area | Content |
|---|---|
| Header | Page title, site/tenant context, date range where applicable, role-aware actions |
| Filters | Status, site, department, owner, date range, severity, category, or module-specific filters |
| Main Content | Audit progress, findings, CAPA aging, overdue actions, closure rates |
| Primary Action | Open finding or CAPA detail |
| Output | CAPA or audit action |
| Audit Behavior | View, create, update, approve, reject, export, and confidential access actions are audit logged where applicable |

## Page Flowchart

```mermaid
flowchart TD
    Start([User opens Audit and CAPA Dashboard])
    Auth[Validate session, tenant, role, and record access]
    Context[Load page context: site, department, date range, permissions]
    Data[Load data: Audit progress, findings, CAPA aging, overdue actions, closure rates]
    View[Render page layout and status indicators]
    Decision{User action}
    Action[Perform action: Open finding or CAPA detail]
    Validate[Validate business rules and permissions]
    Save[Save changes and write audit event]
    Notify[Send notifications or refresh dashboards if needed]
    Output[Result: CAPA or audit action]
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