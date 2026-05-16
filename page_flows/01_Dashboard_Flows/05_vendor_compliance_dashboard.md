# Vendor Compliance Dashboard

| Field | Detail |
|---|---|
| Page Type | Dashboard |
| Module | Vendor Compliance |
| Primary Roles | Procurement Manager, Compliance Manager, Gate Security |
| Purpose | Show vendor readiness. |

## What This Page Shows

| Area | Content |
|---|---|
| Header | Page title, site/tenant context, date range where applicable, role-aware actions |
| Filters | Status, site, department, owner, date range, severity, category, or module-specific filters |
| Main Content | Vendor statuses, expiring documents, blocked vendors, review queues |
| Primary Action | Review vendor documents or export history |
| Output | Vendor compliance decisions |
| Audit Behavior | View, create, update, approve, reject, export, and confidential access actions are audit logged where applicable |

## Page Flowchart

```mermaid
flowchart TD
    Start([User opens Vendor Compliance Dashboard])
    Auth[Validate session, tenant, role, and record access]
    Context[Load page context: site, department, date range, permissions]
    Data[Load data: Vendor statuses, expiring documents, blocked vendors, review queues]
    View[Render page layout and status indicators]
    Decision{User action}
    Action[Perform action: Review vendor documents or export history]
    Validate[Validate business rules and permissions]
    Save[Save changes and write audit event]
    Notify[Send notifications or refresh dashboards if needed]
    Output[Result: Vendor compliance decisions]
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