# Compliance Score Dashboard

| Field | Detail |
|---|---|
| Page Type | Dashboard |
| Module | Compliance |
| Primary Roles | Compliance Manager, Executive Sponsor |
| Purpose | Show ISO and internal compliance score. |

## What This Page Shows

| Area | Content |
|---|---|
| Header | Page title, site/tenant context, date range where applicable, role-aware actions |
| Filters | Status, site, department, owner, date range, severity, category, or module-specific filters |
| Main Content | Clause coverage, non-conformances, overdue CAPA, audit completion |
| Primary Action | Export compliance report or open clause details |
| Output | Compliance score evidence |
| Audit Behavior | View, create, update, approve, reject, export, and confidential access actions are audit logged where applicable |

## Page Flowchart

```mermaid
flowchart TD
    Start([User opens Compliance Score Dashboard])
    Auth[Validate session, tenant, role, and record access]
    Context[Load page context: site, department, date range, permissions]
    Data[Load data: Clause coverage, non-conformances, overdue CAPA, audit completion]
    View[Render page layout and status indicators]
    Decision{User action}
    Action[Perform action: Export compliance report or open clause details]
    Validate[Validate business rules and permissions]
    Save[Save changes and write audit event]
    Notify[Send notifications or refresh dashboards if needed]
    Output[Result: Compliance score evidence]
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