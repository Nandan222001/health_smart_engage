# Shift Schedule Calendar

| Field | Detail |
|---|---|
| Page Type | Web Page |
| Module | People |
| Primary Roles | Supervisor, HR Admin |
| Purpose | Manage shifts. |

## What This Page Shows

| Area | Content |
|---|---|
| Header | Page title, site/tenant context, date range where applicable, role-aware actions |
| Filters | Status, site, department, owner, date range, severity, category, or module-specific filters |
| Main Content | Shift calendar, conflicts, assigned employees |
| Primary Action | Publish shift schedule |
| Output | Updated shift calendar |
| Audit Behavior | View, create, update, approve, reject, export, and confidential access actions are audit logged where applicable |

## Page Flowchart

```mermaid
flowchart TD
    Start([User opens Shift Schedule Calendar])
    Auth[Validate session, tenant, role, and record access]
    Context[Load page context: site, department, date range, permissions]
    Data[Load data: Shift calendar, conflicts, assigned employees]
    View[Render page layout and status indicators]
    Decision{User action}
    Action[Perform action: Publish shift schedule]
    Validate[Validate business rules and permissions]
    Save[Save changes and write audit event]
    Notify[Send notifications or refresh dashboards if needed]
    Output[Result: Updated shift calendar]
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