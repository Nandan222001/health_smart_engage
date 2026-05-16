# Training Compliance Heatmap

| Field | Detail |
|---|---|
| Page Type | Web Page |
| Module | People |
| Primary Roles | Plant Manager, Safety Manager |
| Purpose | Visualise training gaps. |

## What This Page Shows

| Area | Content |
|---|---|
| Header | Page title, site/tenant context, date range where applicable, role-aware actions |
| Filters | Status, site, department, owner, date range, severity, category, or module-specific filters |
| Main Content | Department heatmap, compliance bands, filters |
| Primary Action | Export heatmap or open gaps |
| Output | Training compliance view |
| Audit Behavior | View, create, update, approve, reject, export, and confidential access actions are audit logged where applicable |

## Page Flowchart

```mermaid
flowchart TD
    Start([User opens Training Compliance Heatmap])
    Auth[Validate session, tenant, role, and record access]
    Context[Load page context: site, department, date range, permissions]
    Data[Load data: Department heatmap, compliance bands, filters]
    View[Render page layout and status indicators]
    Decision{User action}
    Action[Perform action: Export heatmap or open gaps]
    Validate[Validate business rules and permissions]
    Save[Save changes and write audit event]
    Notify[Send notifications or refresh dashboards if needed]
    Output[Result: Training compliance view]
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