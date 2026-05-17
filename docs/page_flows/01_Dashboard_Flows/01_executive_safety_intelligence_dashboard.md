# Executive Safety Intelligence Dashboard

| Field | Detail |
|---|---|
| Page Type | Dashboard |
| Module | Executive |
| Primary Roles | Executive Sponsor, Plant Manager, Safety Manager |
| Purpose | Show board-level safety intelligence. |

## What This Page Shows

| Area | Content |
|---|---|
| Header | Page title, site/tenant context, date range where applicable, role-aware actions |
| Filters | Status, site, department, owner, date range, severity, category, or module-specific filters |
| Main Content | KPIs, incidents, compliance score, CAPA, leading indicators, AI briefing summary |
| Primary Action | Export board report or drill down into risk areas |
| Output | Executive dashboard insights and report exports |
| Audit Behavior | View, create, update, approve, reject, export, and confidential access actions are audit logged where applicable |

## Page Flowchart

```mermaid
flowchart TD
    Start([User opens Executive Safety Intelligence Dashboard])
    Auth[Validate session, tenant, role, and record access]
    Context[Load page context: site, department, date range, permissions]
    Data[Load data: KPIs, incidents, compliance score, CAPA, leading indicators, AI briefing summary]
    View[Render page layout and status indicators]
    Decision{User action}
    Action[Perform action: Export board report or drill down into risk areas]
    Validate[Validate business rules and permissions]
    Save[Save changes and write audit event]
    Notify[Send notifications or refresh dashboards if needed]
    Output[Result: Executive dashboard insights and report exports]
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