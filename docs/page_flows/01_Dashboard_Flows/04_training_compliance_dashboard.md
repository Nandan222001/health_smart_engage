# Training Compliance Dashboard

| Field | Detail |
|---|---|
| Page Type | Dashboard |
| Module | People and Training |
| Primary Roles | HR Admin, Training Coordinator, Safety Manager |
| Purpose | Show workforce training compliance. |

## What This Page Shows

| Area | Content |
|---|---|
| Header | Page title, site/tenant context, date range where applicable, role-aware actions |
| Filters | Status, site, department, owner, date range, severity, category, or module-specific filters |
| Main Content | Training gaps, expiry alerts, department heatmap, role compliance |
| Primary Action | Open gap list or export training report |
| Output | Training compliance report |
| Audit Behavior | View, create, update, approve, reject, export, and confidential access actions are audit logged where applicable |

## Page Flowchart

```mermaid
flowchart TD
    Start([User opens Training Compliance Dashboard])
    Auth[Validate session, tenant, role, and record access]
    Context[Load page context: site, department, date range, permissions]
    Data[Load data: Training gaps, expiry alerts, department heatmap, role compliance]
    View[Render page layout and status indicators]
    Decision{User action}
    Action[Perform action: Open gap list or export training report]
    Validate[Validate business rules and permissions]
    Save[Save changes and write audit event]
    Notify[Send notifications or refresh dashboards if needed]
    Output[Result: Training compliance report]
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