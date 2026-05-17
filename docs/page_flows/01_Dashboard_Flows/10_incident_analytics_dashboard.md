# Incident Analytics Dashboard

| Field | Detail |
|---|---|
| Page Type | Dashboard |
| Module | Incident Management |
| Primary Roles | Safety Manager, Legal/HR Officer, Plant Manager |
| Purpose | Show incident trends and hotspots. |

## What This Page Shows

| Area | Content |
|---|---|
| Header | Page title, site/tenant context, date range where applicable, role-aware actions |
| Filters | Status, site, department, owner, date range, severity, category, or module-specific filters |
| Main Content | Incidents by type, severity, location, time, RCA status, confidential indicators |
| Primary Action | Open incident, export analytics, or start investigation |
| Output | Incident insight and actions |
| Audit Behavior | View, create, update, approve, reject, export, and confidential access actions are audit logged where applicable |

## Page Flowchart

```mermaid
flowchart TD
    Start([User opens Incident Analytics Dashboard])
    Auth[Validate session, tenant, role, and record access]
    Context[Load page context: site, department, date range, permissions]
    Data[Load data: Incidents by type, severity, location, time, RCA status, confidential indicators]
    View[Render page layout and status indicators]
    Decision{User action}
    Action[Perform action: Open incident, export analytics, or start investigation]
    Validate[Validate business rules and permissions]
    Save[Save changes and write audit event]
    Notify[Send notifications or refresh dashboards if needed]
    Output[Result: Incident insight and actions]
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