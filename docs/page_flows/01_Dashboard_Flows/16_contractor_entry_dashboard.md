# Contractor Entry Dashboard

| Field | Detail |
|---|---|
| Page Type | Dashboard |
| Module | Vendor Compliance |
| Primary Roles | Gate Security Officer, Security Supervisor |
| Purpose | Show contractor entry decisions. |

## What This Page Shows

| Area | Content |
|---|---|
| Header | Page title, site/tenant context, date range where applicable, role-aware actions |
| Filters | Status, site, department, owner, date range, severity, category, or module-specific filters |
| Main Content | QR scan results, blocked access, amber warnings, scan history |
| Primary Action | Open scan result or verify contractor |
| Output | Entry decision log |
| Audit Behavior | View, create, update, approve, reject, export, and confidential access actions are audit logged where applicable |

## Page Flowchart

```mermaid
flowchart TD
    Start([User opens Contractor Entry Dashboard])
    Auth[Validate session, tenant, role, and record access]
    Context[Load page context: site, department, date range, permissions]
    Data[Load data: QR scan results, blocked access, amber warnings, scan history]
    View[Render page layout and status indicators]
    Decision{User action}
    Action[Perform action: Open scan result or verify contractor]
    Validate[Validate business rules and permissions]
    Save[Save changes and write audit event]
    Notify[Send notifications or refresh dashboards if needed]
    Output[Result: Entry decision log]
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