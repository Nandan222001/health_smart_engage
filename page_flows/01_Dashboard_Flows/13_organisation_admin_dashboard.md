# Organisation Admin Dashboard

| Field | Detail |
|---|---|
| Page Type | Dashboard |
| Module | Foundation |
| Primary Roles | System Admin, IT Admin |
| Purpose | Show administrative setup status. |

## What This Page Shows

| Area | Content |
|---|---|
| Header | Page title, site/tenant context, date range where applicable, role-aware actions |
| Filters | Status, site, department, owner, date range, severity, category, or module-specific filters |
| Main Content | Tenants, organisation nodes, users, roles, SSO, integrations |
| Primary Action | Open admin configuration |
| Output | Configuration update |
| Audit Behavior | View, create, update, approve, reject, export, and confidential access actions are audit logged where applicable |

## Page Flowchart

```mermaid
flowchart TD
    Start([User opens Organisation Admin Dashboard])
    Auth[Validate session, tenant, role, and record access]
    Context[Load page context: site, department, date range, permissions]
    Data[Load data: Tenants, organisation nodes, users, roles, SSO, integrations]
    View[Render page layout and status indicators]
    Decision{User action}
    Action[Perform action: Open admin configuration]
    Validate[Validate business rules and permissions]
    Save[Save changes and write audit event]
    Notify[Send notifications or refresh dashboards if needed]
    Output[Result: Configuration update]
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