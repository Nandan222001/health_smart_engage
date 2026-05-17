# Site HSE Command Dashboard

| Field | Detail |
|---|---|
| Page Type | Dashboard |
| Module | Operations |
| Primary Roles | Plant Manager, Safety Manager |
| Purpose | Show site-level operational safety status. |

## What This Page Shows

| Area | Content |
|---|---|
| Header | Page title, site/tenant context, date range where applicable, role-aware actions |
| Filters | Status, site, department, owner, date range, severity, category, or module-specific filters |
| Main Content | Open hazards, active permits, incidents, overdue CAPA, vendor blocks, asset exceptions |
| Primary Action | Drill down to site exception records |
| Output | Site action queue and situational awareness |
| Audit Behavior | View, create, update, approve, reject, export, and confidential access actions are audit logged where applicable |

## Page Flowchart

```mermaid
flowchart TD
    Start([User opens Site HSE Command Dashboard])
    Auth[Validate session, tenant, role, and record access]
    Context[Load page context: site, department, date range, permissions]
    Data[Load data: Open hazards, active permits, incidents, overdue CAPA, vendor blocks, asset exceptions]
    View[Render page layout and status indicators]
    Decision{User action}
    Action[Perform action: Drill down to site exception records]
    Validate[Validate business rules and permissions]
    Save[Save changes and write audit event]
    Notify[Send notifications or refresh dashboards if needed]
    Output[Result: Site action queue and situational awareness]
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