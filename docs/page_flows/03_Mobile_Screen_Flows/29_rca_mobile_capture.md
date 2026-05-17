# RCA Mobile Capture

| Field | Detail |
|---|---|
| Page Type | Mobile Screen |
| Module | Mobile Incident |
| Primary Roles | Investigation Lead |
| Purpose | Capture RCA inputs. |

## What This Page Shows

| Area | Content |
|---|---|
| Header | Page title, site/tenant context, date range where applicable, role-aware actions |
| Filters | Status, site, department, owner, date range, severity, category, or module-specific filters |
| Main Content | 5-Why/Fishbone/Bow-Tie fields |
| Primary Action | Save RCA |
| Output | Root cause record |
| Audit Behavior | View, create, update, approve, reject, export, and confidential access actions are audit logged where applicable |

## Page Flowchart

```mermaid
flowchart TD
    Start([User opens RCA Mobile Capture])
    Auth[Validate session, tenant, role, and record access]
    Context[Load page context: site, department, date range, permissions]
    Data[Load data: 5-Why/Fishbone/Bow-Tie fields]
    View[Render page layout and status indicators]
    Decision{User action}
    Action[Perform action: Save RCA]
    Validate[Validate business rules and permissions]
    Save[Save changes and write audit event]
    Notify[Send notifications or refresh dashboards if needed]
    Output[Result: Root cause record]
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