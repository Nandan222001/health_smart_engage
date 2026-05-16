# Permit Live Board

| Field | Detail |
|---|---|
| Page Type | Dashboard |
| Module | Permit to Work |
| Primary Roles | Permit Coordinator, Safety Manager, Plant Manager |
| Purpose | Show live work status. |

## What This Page Shows

| Area | Content |
|---|---|
| Header | Page title, site/tenant context, date range where applicable, role-aware actions |
| Filters | Status, site, department, owner, date range, severity, category, or module-specific filters |
| Main Content | Active permits, pending permits, conflicts, expiries, zones, equipment |
| Primary Action | Approve, reject, close, extend, or resolve conflict |
| Output | Updated permit board |
| Audit Behavior | View, create, update, approve, reject, export, and confidential access actions are audit logged where applicable |

## Page Flowchart

```mermaid
flowchart TD
    Start([User opens Permit Live Board])
    Auth[Validate session, tenant, role, and record access]
    Context[Load page context: site, department, date range, permissions]
    Data[Load data: Active permits, pending permits, conflicts, expiries, zones, equipment]
    View[Render page layout and status indicators]
    Decision{User action}
    Action[Perform action: Approve, reject, close, extend, or resolve conflict]
    Validate[Validate business rules and permissions]
    Save[Save changes and write audit event]
    Notify[Send notifications or refresh dashboards if needed]
    Output[Result: Updated permit board]
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