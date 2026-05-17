# SOP Detail and Acknowledgement

| Field | Detail |
|---|---|
| Page Type | Web Page |
| Module | Knowledge |
| Primary Roles | Employee |
| Purpose | Read SOP. |

## What This Page Shows

| Area | Content |
|---|---|
| Header | Page title, site/tenant context, date range where applicable, role-aware actions |
| Filters | Status, site, department, owner, date range, severity, category, or module-specific filters |
| Main Content | SOP content, version, linked tasks, acknowledgement |
| Primary Action | Acknowledge SOP |
| Output | Acknowledgement record |
| Audit Behavior | View, create, update, approve, reject, export, and confidential access actions are audit logged where applicable |

## Page Flowchart

```mermaid
flowchart TD
    Start([User opens SOP Detail and Acknowledgement])
    Auth[Validate session, tenant, role, and record access]
    Context[Load page context: site, department, date range, permissions]
    Data[Load data: SOP content, version, linked tasks, acknowledgement]
    View[Render page layout and status indicators]
    Decision{User action}
    Action[Perform action: Acknowledge SOP]
    Validate[Validate business rules and permissions]
    Save[Save changes and write audit event]
    Notify[Send notifications or refresh dashboards if needed]
    Output[Result: Acknowledgement record]
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