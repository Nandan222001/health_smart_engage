# Asset Compliance Dashboard

| Field | Detail |
|---|---|
| Page Type | Dashboard |
| Module | Asset Compliance |
| Primary Roles | Maintenance Manager, Safety Manager |
| Purpose | Show equipment readiness. |

## What This Page Shows

| Area | Content |
|---|---|
| Header | Page title, site/tenant context, date range where applicable, role-aware actions |
| Filters | Status, site, department, owner, date range, severity, category, or module-specific filters |
| Main Content | Overdue inspections, due-soon inspections, asset criticality, non-compliant assets |
| Primary Action | Open asset profile or schedule inspection |
| Output | Asset compliance action |
| Audit Behavior | View, create, update, approve, reject, export, and confidential access actions are audit logged where applicable |

## Page Flowchart

```mermaid
flowchart TD
    Start([User opens Asset Compliance Dashboard])
    Auth[Validate session, tenant, role, and record access]
    Context[Load page context: site, department, date range, permissions]
    Data[Load data: Overdue inspections, due-soon inspections, asset criticality, non-compliant assets]
    View[Render page layout and status indicators]
    Decision{User action}
    Action[Perform action: Open asset profile or schedule inspection]
    Validate[Validate business rules and permissions]
    Save[Save changes and write audit event]
    Notify[Send notifications or refresh dashboards if needed]
    Output[Result: Asset compliance action]
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