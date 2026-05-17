# Vendor Compliance History

| Field | Detail |
|---|---|
| Page Type | Web Page |
| Module | Vendors |
| Primary Roles | Auditor |
| Purpose | Review vendor audit history. |

## What This Page Shows

| Area | Content |
|---|---|
| Header | Page title, site/tenant context, date range where applicable, role-aware actions |
| Filters | Status, site, department, owner, date range, severity, category, or module-specific filters |
| Main Content | Approvals, rejections, renewals, scan events |
| Primary Action | Export history |
| Output | Vendor audit report |
| Audit Behavior | View, create, update, approve, reject, export, and confidential access actions are audit logged where applicable |

## Page Flowchart

```mermaid
flowchart TD
    Start([User opens Vendor Compliance History])
    Auth[Validate session, tenant, role, and record access]
    Context[Load page context: site, department, date range, permissions]
    Data[Load data: Approvals, rejections, renewals, scan events]
    View[Render page layout and status indicators]
    Decision{User action}
    Action[Perform action: Export history]
    Validate[Validate business rules and permissions]
    Save[Save changes and write audit event]
    Notify[Send notifications or refresh dashboards if needed]
    Output[Result: Vendor audit report]
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