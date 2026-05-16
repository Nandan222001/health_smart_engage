# ISO Clause Mapping

| Field | Detail |
|---|---|
| Page Type | Web Page |
| Module | Compliance |
| Primary Roles | Compliance Manager, Auditor |
| Purpose | Map clauses to questions. |

## What This Page Shows

| Area | Content |
|---|---|
| Header | Page title, site/tenant context, date range where applicable, role-aware actions |
| Filters | Status, site, department, owner, date range, severity, category, or module-specific filters |
| Main Content | ISO clauses, checklist questions, coverage |
| Primary Action | Assign clause |
| Output | Clause coverage |
| Audit Behavior | View, create, update, approve, reject, export, and confidential access actions are audit logged where applicable |

## Page Flowchart

```mermaid
flowchart TD
    Start([User opens ISO Clause Mapping])
    Auth[Validate session, tenant, role, and record access]
    Context[Load page context: site, department, date range, permissions]
    Data[Load data: ISO clauses, checklist questions, coverage]
    View[Render page layout and status indicators]
    Decision{User action}
    Action[Perform action: Assign clause]
    Validate[Validate business rules and permissions]
    Save[Save changes and write audit event]
    Notify[Send notifications or refresh dashboards if needed]
    Output[Result: Clause coverage]
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