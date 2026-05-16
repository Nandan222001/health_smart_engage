Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$PreferredMdDir = Join-Path (Get-Location) "docs"
$LegacyMdDir = Join-Path (Get-Location) "HSE_Project_Documents_MD"
if (Test-Path $PreferredMdDir) {
    $MdDir = $PreferredMdDir
}
elseif (Test-Path $LegacyMdDir) {
    $MdDir = $LegacyMdDir
}
else {
    throw "Markdown directory not found. Checked: $PreferredMdDir and $LegacyMdDir"
}

function Write-Utf8 {
    param([string]$Path, [string]$Text)
    [System.IO.File]::WriteAllText($Path, $Text, [System.Text.Encoding]::UTF8)
}

function Append-Or-Replace-Section {
    param(
        [string]$FileName,
        [string]$Heading,
        [string]$SectionMarkdown
    )

    $path = Join-Path $MdDir $FileName
    if (!(Test-Path $path)) {
        throw "File not found: $path"
    }

    $content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
    $escapedHeading = [regex]::Escape($Heading)
    $pattern = "(?ms)^## $escapedHeading\s.*?(?=^## |\z)"
    $section = "## $Heading" + [Environment]::NewLine + [Environment]::NewLine + $SectionMarkdown.Trim() + [Environment]::NewLine
    if ($content -match $pattern) {
        $content = [regex]::Replace($content, $pattern, [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $section })
    }
    else {
        $content = $content.TrimEnd() + [Environment]::NewLine + [Environment]::NewLine + $section
    }
    Write-Utf8 $path $content
}

$Inventory = @'
# Application Screen, Role, Dashboard, Mobile, and Data Flow Inventory

*HSE Safety, Compliance & Intelligence Platform*

Generated as an expanded planning artifact for the Markdown document pack.

## Executive Summary

This inventory defines the expected application surface for the HSE platform across web dashboards, web administration pages, mobile screens, user roles, and data flows.

The current baseline contains:

- Total web dashboard pages: 17
- Total web operational/admin pages: 66
- Total mobile screens: 31
- Total named user roles: 20
- Total primary modules: 10
- Total major data flow diagrams: 6

These counts are planning estimates for requirements and design. Final counts may change during UX design, sprint refinement, and stakeholder review.

## Primary User Roles

| Role | Primary Need | Typical Access Level |
|---|---|---|
| Executive Sponsor | Portfolio visibility and board-level safety intelligence | Read dashboards, reports, executive briefings |
| Project Manager | Delivery governance and rollout tracking | Project documentation, status, risk, issue views |
| Product Owner | Backlog ownership and acceptance | Full functional review, acceptance, reporting |
| System Admin | Platform configuration and tenant setup | Full admin configuration |
| IT Admin | Identity, SSO, integrations, technical settings | Technical admin |
| Safety Manager | Safety operations, risk, permits, incidents, compliance | Broad operational management |
| Compliance Manager | ISO alignment, audits, checklists, CAPA governance | Compliance configuration and reporting |
| Plant Manager | Site-level visibility, approvals, performance | Site dashboard, approvals, reports |
| HR Admin | Employee profiles, training, certification records | People and training administration |
| Training Coordinator | Training completion and evidence capture | Training operations |
| Procurement Manager | Vendor onboarding and compliance readiness | Vendor administration |
| Maintenance Manager | Asset compliance, inspections, equipment readiness | Asset management and reporting |
| Permit Coordinator | Permit request validation and coordination | Permit operations |
| Permit Approver | Permit approval, rejection, extension decisions | Assigned approval actions |
| Safety Auditor | Audit checklist execution and evidence capture | Audit execution |
| CAPA Owner | Corrective action completion and evidence upload | Assigned CAPA actions |
| Document Controller | SOP, policy, ISO manual upload and version control | Knowledge document administration |
| Employee / Contractor | Mobile reporting, SOP access, assigned work actions | Limited self-service and assigned tasks |
| Gate Security Officer | Contractor entry verification | QR scan and access status only |
| Legal / HR Officer | Confidential incident review | Restricted confidential records |

## Web Dashboard Pages

| # | Dashboard | Primary Roles | Purpose |
|---:|---|---|---|
| 1 | Executive Safety Intelligence Dashboard | Executive Sponsor, Plant Manager, Safety Manager | Incidents, compliance score, CAPA, leading indicators |
| 2 | Site HSE Command Dashboard | Plant Manager, Safety Manager | Site-level safety status and escalations |
| 3 | My Tasks Dashboard | All authenticated users | Assigned approvals, CAPAs, audits, permits, actions |
| 4 | Training Compliance Dashboard | HR Admin, Training Coordinator, Safety Manager | Training gaps, expiry, department compliance |
| 5 | Vendor Compliance Dashboard | Procurement Manager, Compliance Manager, Gate Security | Vendor status, expiry, blocked vendors |
| 6 | Asset Compliance Dashboard | Maintenance Manager, Safety Manager | Due/overdue inspections and asset readiness |
| 7 | Audit and CAPA Dashboard | Compliance Manager, Safety Auditor, Safety Manager | Audit status, findings, CAPA aging |
| 8 | Risk Register Dashboard | Risk Manager, Safety Manager, Plant Manager | Risk trends, high-risk areas, open controls |
| 9 | Permit Live Board | Permit Coordinator, Safety Manager, Plant Manager | Active, pending, conflicting, expired permits |
| 10 | Incident Analytics Dashboard | Safety Manager, Legal/HR Officer, Plant Manager | Incidents by type, severity, location, trend |
| 11 | Knowledge Usage Dashboard | Document Controller, Safety Manager | SOP usage, acknowledgements, outdated documents |
| 12 | AI Safety Intelligence Dashboard | Executive Sponsor, Safety Manager | AI insights, predictive risk, weekly briefing |
| 13 | Organisation Admin Dashboard | System Admin, IT Admin | Tenant, organisation, users, roles, SSO |
| 14 | Notification and Escalation Dashboard | System Admin, Safety Manager | Alert delivery, escalation status |
| 15 | Compliance Score Dashboard | Compliance Manager, Executive Sponsor | ISO readiness and clause coverage |
| 16 | Contractor Entry Dashboard | Gate Security Officer, Security Supervisor | Entry scan results and blocked access |
| 17 | Data Quality Dashboard | Product Owner, System Admin | Missing master data, invalid records, sync errors |

## Web Operational and Admin Pages

| Module | Pages |
|---|---:|
| Platform Foundation and Identity | 8 |
| People, Workforce, and Training | 7 |
| Vendor and Contractor Compliance | 6 |
| Asset Management and Equipment Compliance | 5 |
| Compliance, Audit, and CAPA | 7 |
| Risk Assessment and Hazard Management | 5 |
| Permit to Work | 6 |
| Incident and Investigation Management | 5 |
| Knowledge Centre | 4 |
| AI Safety Advisor and Intelligence | 3 |
| Cross-cutting reports, notifications, audit logs | 10 |
| Total | 66 |

## Detailed Web Page Inventory

| # | Page | Module | Main Roles |
|---:|---|---|---|
| 1 | Login / SSO Callback | Foundation | All users |
| 2 | Tenant and Organisation Setup | Foundation | System Admin |
| 3 | Organisation Tree | Foundation | System Admin, Plant Manager |
| 4 | User Directory | Foundation | System Admin, IT Admin |
| 5 | User Invitation | Foundation | System Admin |
| 6 | Role and Permission Builder | Foundation | System Admin, Safety Manager |
| 7 | SSO Configuration | Foundation | IT Admin |
| 8 | Audit Log Viewer | Foundation | System Admin, Compliance Manager |
| 9 | Employee Directory | People | HR Admin, Safety Manager |
| 10 | Employee Profile | People | HR Admin, Manager |
| 11 | Certification Management | People | HR Admin, Training Coordinator |
| 12 | Shift Schedule Calendar | People | Supervisor, HR Admin |
| 13 | Training Matrix | People | Safety Manager, Training Coordinator |
| 14 | Training Completion Entry | People | Training Coordinator |
| 15 | Training Compliance Heatmap | People | Plant Manager, Safety Manager |
| 16 | Vendor Directory | Vendors | Procurement Manager |
| 17 | Vendor Profile | Vendors | Procurement Manager, Compliance Manager |
| 18 | Vendor Document Review | Vendors | Compliance Manager |
| 19 | Vendor Standards Configuration | Vendors | Safety Manager |
| 20 | Vendor Expiry Register | Vendors | Compliance Officer |
| 21 | Vendor Compliance History | Vendors | Auditor |
| 22 | Asset Register | Assets | Maintenance Manager |
| 23 | Asset Profile | Assets | Maintenance Manager, Safety Manager |
| 24 | Asset Inspection Schedule | Assets | Maintenance Manager |
| 25 | Asset Compliance Rules | Assets | Safety Manager |
| 26 | Asset Inspection History | Assets | Auditor |
| 27 | Checklist Builder | Compliance | Compliance Manager |
| 28 | ISO Clause Mapping | Compliance | Compliance Manager, Auditor |
| 29 | Audit Plan | Compliance | Compliance Manager |
| 30 | Audit Execution Review | Compliance | Safety Auditor |
| 31 | Findings Register | Compliance | Compliance Manager |
| 32 | CAPA Register | Compliance | Safety Manager |
| 33 | CAPA Detail and Approval | Compliance | CAPA Owner, Manager |
| 34 | Risk Matrix Configuration | Risk | Safety Manager |
| 35 | Risk Assessment Builder | Risk | Safety Officer |
| 36 | Risk Register | Risk | Risk Manager |
| 37 | Hazard Observation Register | Risk | Supervisor |
| 38 | Risk Trend Analytics | Risk | Safety Manager |
| 39 | Permit Request Form | Permit | Permit Requester |
| 40 | Permit Review Queue | Permit | Permit Coordinator |
| 41 | Permit Approval Detail | Permit | Permit Approver |
| 42 | Concurrent Permit Conflict View | Permit | Plant Manager |
| 43 | Permit Extension and Closure | Permit | Permit Holder |
| 44 | Permit Audit Trail Export | Permit | Auditor |
| 45 | Incident Report Detail | Incident | Safety Manager |
| 46 | Incident Classification | Incident | Safety Manager |
| 47 | Investigation Workspace | Incident | Investigation Lead |
| 48 | RCA Tool Page | Incident | Investigation Lead |
| 49 | Confidential Incident Access Review | Incident | Legal / HR Officer |
| 50 | Knowledge Library | Knowledge | All authorised users |
| 51 | Document Upload and Versioning | Knowledge | Document Controller |
| 52 | SOP Detail and Acknowledgement | Knowledge | Employee |
| 53 | Lessons Learned Articles | Knowledge | Safety Manager |
| 54 | AI Safety Advisor Chat | AI | Safety Manager, Employee |
| 55 | Predictive Risk Detail | AI | Plant Manager |
| 56 | AI Weekly Briefing | AI | Executive Sponsor |
| 57 | Notification Centre | Cross-cutting | All users |
| 58 | Escalation Rules | Cross-cutting | System Admin, Safety Manager |
| 59 | Report Builder | Cross-cutting | Managers, Auditors |
| 60 | Export Centre | Cross-cutting | Auditors, Managers |
| 61 | Master Data Import | Cross-cutting | System Admin |
| 62 | Data Quality Review | Cross-cutting | Product Owner, Admin |
| 63 | Integration Monitoring | Cross-cutting | IT Admin |
| 64 | System Settings | Cross-cutting | System Admin |
| 65 | Help and Support | Cross-cutting | All users |
| 66 | User Preferences | Cross-cutting | All users |

## Mobile Screen Inventory

| # | Mobile Screen | Primary Roles | Purpose |
|---:|---|---|---|
| 1 | Mobile Login / SSO | All users | Authenticate securely |
| 2 | Mobile Home / My Tasks | All users | See assigned actions |
| 3 | Notifications | All users | Review alerts and escalations |
| 4 | SOP Search | All users | Find procedures |
| 5 | SOP Detail and Acknowledgement | All users | Read and acknowledge SOP |
| 6 | Incident / Near Miss Quick Report | Employee, Contractor | Submit incident in under 2 minutes |
| 7 | Hazard Observation Report | Employee, Supervisor | Capture hazard with photo/GPS |
| 8 | My CAPA Actions | CAPA Owner | View assigned CAPAs |
| 9 | CAPA Evidence Upload | CAPA Owner | Add closure evidence |
| 10 | Permit Request Mobile Form | Permit Requester | Create field permit |
| 11 | Permit Approval Notification | Permit Approver | One-tap approve/reject |
| 12 | Permit Detail | Permit Holder, Approver | View permit controls |
| 13 | Permit Extension Request | Permit Holder | Request extension |
| 14 | Permit Closure Evidence | Permit Holder | Close work with evidence |
| 15 | Live Permit Board Mobile | Safety Manager | View active work |
| 16 | Contractor QR Scan | Gate Security Officer | Verify contractor access |
| 17 | Contractor Status Detail | Gate Security Officer | Show reason for blocked/amber result |
| 18 | Audit Checklist Execution | Safety Auditor | Execute mobile audit |
| 19 | Audit Evidence Capture | Safety Auditor | Attach photos and notes |
| 20 | Audit Sync Queue | Safety Auditor | Offline sync management |
| 21 | Risk Assessment Review | Safety Officer | Review task/asset risk |
| 22 | Control Measure Capture | Safety Officer | Add controls |
| 23 | Asset Lookup | Maintenance, Permit Team | Search asset status |
| 24 | Asset Inspection Capture | Maintenance | Record inspection result |
| 25 | Training Completion Scan / Entry | Training Coordinator | Record completion |
| 26 | Employee Certification View | Supervisor | Validate qualification |
| 27 | Vendor Document Status | Procurement, Gate Security | Check vendor readiness |
| 28 | Incident Investigation Notes | Investigation Lead | Capture investigation notes |
| 29 | RCA Mobile Capture | Investigation Lead | Capture 5-Why/Fishbone inputs |
| 30 | AI Safety Advisor Mobile | Safety Manager, Employee | Ask governed HSE questions |
| 31 | Offline Data Sync Status | Mobile users | Show pending uploads and sync errors |

## Role to Module Access Matrix

| Role | Foundation | People | Vendors | Assets | Compliance/CAPA | Risk | Permits | Incidents | Knowledge | AI |
|---|---|---|---|---|---|---|---|---|---|---|
| Executive Sponsor | R | R | R | R | R | R | R | R | R | R |
| Project Manager | R | R | R | R | R | R | R | R | R | R |
| Product Owner | R/W | R/W | R/W | R/W | R/W | R/W | R/W | R/W | R/W | R/W |
| System Admin | A | A | A | A | A | A | A | A | A | A |
| IT Admin | A | R | R | R | R | R | R | R | R | R |
| Safety Manager | R/W | R/W | R/W | R/W | A | A | A | A | R/W | R/W |
| Compliance Manager | R | R | R/W | R | A | R/W | R | R/W | R/W | R/W |
| Plant Manager | R | R | R | R | R/W | R/W | A | R/W | R | R |
| HR Admin | R | A | - | - | R | - | - | R | R | - |
| Training Coordinator | - | R/W | - | - | R | - | - | - | R | - |
| Procurement Manager | - | - | A | - | R | - | R | - | R | - |
| Maintenance Manager | - | R | - | A | R | R/W | R/W | R | R | - |
| Permit Coordinator | R | R | R | R | R | R | A | R | R | - |
| Permit Approver | R | R | R | R | R | R | R/W | R | R | - |
| Safety Auditor | R | R | R | R | R/W | R | R | R | R | - |
| CAPA Owner | - | - | - | - | R/W | R | R | R | R | - |
| Document Controller | - | - | - | - | R | R | R | R | A | R |
| Employee / Contractor | - | R-self | - | R | R-assigned | R/W-limited | R/W-limited | R/W-limited | R | R-limited |
| Gate Security Officer | - | - | R | - | - | - | - | - | - | - |
| Legal / HR Officer | R | R | - | - | R | - | - | A-confidential | R | - |

Legend: A = administer/approve, R/W = read and write, R = read, - = no normal access, limited = constrained by assigned work and record permissions.

## Data Flow Diagram - Level 0 Context

```mermaid
flowchart LR
    Users[Employees, Managers, Auditors, Admins] --> HSE[HSE Platform]
    Contractors[Vendors and Contractors] --> HSE
    Security[Gate Security] --> HSE
    HSE --> IdP[Identity Provider / SSO]
    HSE --> Notify[Email / Push / SMS]
    HSE --> HR[HR / Employee Master]
    HSE --> ERP[ERP / Procurement / Asset Systems]
    HSE --> Storage[Document and Evidence Storage]
    HSE --> AI[Enterprise AI Service]
    HSE --> Reports[Reports and Dashboards]
    Regulators[Regulators / Auditors] -. receive exports .- Reports
```

## Data Flow Diagram - Level 1 Platform

```mermaid
flowchart TB
    subgraph Channels
        Web[Web Application]
        Mobile[Mobile Application]
        APIClients[Integration Clients]
    end
    subgraph CorePlatform
        Gateway[API Gateway]
        Auth[Auth and RBAC]
        Workflow[Workflow Engine]
        Rules[Rules and Validation Engine]
        Notifications[Notification Service]
        Reports[Reporting Service]
        Audit[Audit Logging Service]
    end
    subgraph DomainServices
        People[People and Training]
        Vendor[Vendor Compliance]
        Asset[Asset Compliance]
        Compliance[Audit and CAPA]
        Risk[Risk and Hazard]
        Permit[Permit to Work]
        Incident[Incident and Investigation]
        Knowledge[Knowledge Centre]
        Advisor[AI Safety Advisor]
    end
    subgraph DataStores
        DB[(Operational Database)]
        Files[(Evidence and Document Store)]
        Log[(Immutable Audit Log)]
        Analytics[(Analytics Store)]
        Vector[(Knowledge Index / Vector Store)]
    end
    Web --> Gateway
    Mobile --> Gateway
    APIClients --> Gateway
    Gateway --> Auth
    Gateway --> DomainServices
    DomainServices --> Workflow
    DomainServices --> Rules
    Workflow --> Notifications
    DomainServices --> Audit
    DomainServices --> DB
    DomainServices --> Files
    Audit --> Log
    Reports --> Analytics
    DB --> Analytics
    Knowledge --> Vector
    Advisor --> Vector
```

## Data Flow Diagram - Permit to Work

```mermaid
flowchart TD
    Requester[Permit Requester] --> Form[Permit Request Form]
    Form --> Validate[Validate required controls]
    Validate --> AssetStatus[Check asset compliance]
    Validate --> RiskStatus[Check linked risk assessment]
    Validate --> VendorStatus[Check vendor / contractor approval]
    AssetStatus --> Conflict[Concurrent work conflict detection]
    RiskStatus --> Conflict
    VendorStatus --> Conflict
    Conflict --> Workflow[Approval workflow]
    Workflow --> Approver[Permit Approver]
    Approver --> Decision{Decision}
    Decision -->|Approve| Active[Active permit]
    Decision -->|Reject| Rework[Return to requester]
    Active --> LiveBoard[Live permit board]
    Active --> Closure[Closure / extension]
    Closure --> AuditTrail[Immutable permit audit trail]
```

## Data Flow Diagram - Incident to CAPA

```mermaid
flowchart TD
    Reporter[Employee / Contractor] --> Incident[Incident or Near Miss Report]
    Incident --> Classify[Auto-classification]
    Classify --> Escalate[Escalation and notifications]
    Classify --> Investigation[Investigation workflow]
    Investigation --> RCA[RCA tools: 5-Why / Fishbone / Bow-Tie]
    RCA --> Findings[Root cause findings]
    Findings --> CAPA[CAPA generation]
    CAPA --> Owner[CAPA owner action]
    Owner --> Evidence[Evidence upload]
    Evidence --> Approval[Manager approval]
    Approval --> Lessons[Lessons learned article]
    Lessons --> Knowledge[Knowledge Centre]
    Knowledge --> AI[AI Safety Advisor]
```

## Data Flow Diagram - Audit and Compliance

```mermaid
flowchart TD
    Standard[ISO / Internal Standard] --> Checklist[Checklist Builder]
    SOP[SOP / Policy Document] --> Checklist
    Checklist --> Publish[Published checklist version]
    Publish --> MobileAudit[Mobile audit execution]
    MobileAudit --> Evidence[Evidence and observations]
    Evidence --> Findings[Findings / non-conformance]
    Findings --> CAPA[CAPA workflow]
    CAPA --> Closure[Closure evidence and approval]
    Closure --> Score[Compliance score dashboard]
    Score --> Report[Audit-ready report]
```

## Data Flow Diagram - AI Knowledge Retrieval

```mermaid
flowchart TD
    DocumentController[Document Controller] --> Upload[Upload SOP / policy / manual]
    Upload --> Version[Version control and approval]
    Version --> Index[Knowledge indexing]
    User[User question] --> Advisor[AI Safety Advisor]
    Advisor --> Retrieve[Retrieve approved source passages]
    Retrieve --> Generate[Generate grounded response]
    Generate --> Cite[Cite source document and version]
    Cite --> Log[Conversation quality log]
    Log --> Review[Human review and improvement]
```

## Recommended Dashboard Layout

Each major dashboard should use the following layout pattern:

- Header: site, date range, role context, export action
- KPI band: 4 to 6 key metrics
- Priority queue: overdue, blocked, pending approval, high risk
- Trend chart: 30-day, 12-week, or 12-month trend depending on module
- Drill-down table: searchable and filterable records
- Export and audit action: PDF, Excel, or board report where applicable

## Recommended Mobile Navigation

Mobile should use a bottom navigation model:

- Home
- Tasks
- Report
- Scan/Search
- Profile

The Report action should open quick actions for incident, near miss, hazard, evidence upload, and permit closure depending on role.
'@

Write-Utf8 (Join-Path $MdDir "23_Application_Screen_Role_DataFlow_Inventory.md") $Inventory

Append-Or-Replace-Section "15_High_Level_Design.md" "Expanded Data Flow Diagrams" @'
The complete screen, role, dashboard, mobile, and data flow inventory is maintained in `23_Application_Screen_Role_DataFlow_Inventory.md`.

### Level 0 Context DFD

```mermaid
flowchart LR
    Users[Employees, Managers, Auditors, Admins] --> HSE[HSE Platform]
    Contractors[Vendors and Contractors] --> HSE
    Security[Gate Security] --> HSE
    HSE --> IdP[Identity Provider / SSO]
    HSE --> Notify[Email / Push / SMS]
    HSE --> HR[HR / Employee Master]
    HSE --> ERP[ERP / Procurement / Asset Systems]
    HSE --> Storage[Document and Evidence Storage]
    HSE --> AI[Enterprise AI Service]
    HSE --> Reports[Reports and Dashboards]
```

### Level 1 Platform DFD

```mermaid
flowchart TB
    Web[Web Application] --> Gateway[API Gateway]
    Mobile[Mobile Application] --> Gateway
    Gateway --> Auth[Auth and RBAC]
    Gateway --> Services[Domain Services]
    Services --> Workflow[Workflow Engine]
    Services --> Rules[Rules Engine]
    Services --> DB[(Operational Database)]
    Services --> Files[(Document Store)]
    Services --> Audit[(Audit Log)]
    Services --> Analytics[(Analytics Store)]
    Services --> Knowledge[(Knowledge Index)]
    Knowledge --> Advisor[AI Safety Advisor]
```
'@

Append-Or-Replace-Section "18_UI_UX_Design_Specs.md" "Page and Screen Inventory" @'
The application is expected to contain:

- Web dashboard pages: 17
- Web operational/admin pages: 66
- Mobile screens: 31
- Primary roles covered: 20 role entries, including combined Employee / Contractor and Legal / HR Officer

Refer to `23_Application_Screen_Role_DataFlow_Inventory.md` for the full dashboard list, detailed page inventory, mobile screen inventory, and role access matrix.

### Dashboard Families

```mermaid
mindmap
  root((Dashboards))
    Executive
      Safety Intelligence
      Compliance Score
      AI Briefing
    Site Operations
      Site HSE Command
      Live Permit Board
      Incident Analytics
    Compliance
      Audit and CAPA
      Risk Register
      Vendor Compliance
    Administration
      Organisation Admin
      Notification Escalation
      Data Quality
```

### Mobile Screen Groups

```mermaid
mindmap
  root((Mobile App))
    Home
      My Tasks
      Notifications
      Sync Status
    Report
      Incident
      Near Miss
      Hazard
    Work
      Permit
      CAPA
      Audit
      Inspection
    Search
      SOP
      Asset
      Vendor
      Employee Certification
    Intelligence
      AI Advisor
```
'@

Append-Or-Replace-Section "08_User_Requirement_Document.md" "Role Coverage and Access Summary" @'
The platform covers the following role families:

- Executive and governance roles
- Platform and IT administration roles
- HSE, safety, compliance, audit, and CAPA roles
- Plant, maintenance, permit, and operational management roles
- HR, training, procurement, vendor, and contractor roles
- Employee self-service and field reporting roles
- Gate security and confidential incident review roles

Detailed access is maintained in `23_Application_Screen_Role_DataFlow_Inventory.md`.

### Role Coverage Map

```mermaid
flowchart TD
    Roles[All User Roles] --> Governance[Executive / PM / Product]
    Roles --> Admin[System Admin / IT Admin]
    Roles --> HSE[Safety / Compliance / Auditor / CAPA]
    Roles --> Operations[Plant / Maintenance / Permit]
    Roles --> Workforce[HR / Training / Employee]
    Roles --> External[Vendors / Contractors / Gate Security]
    Roles --> Sensitive[Legal / HR Confidential Access]
```
'@

$readmePath = Join-Path $MdDir "README.md"
$readme = [System.IO.File]::ReadAllText($readmePath, [System.Text.Encoding]::UTF8)
if ($readme -notmatch "23_Application_Screen_Role_DataFlow_Inventory.md") {
    $readme = $readme.TrimEnd() + [Environment]::NewLine + "- 23_Application_Screen_Role_DataFlow_Inventory.md" + [Environment]::NewLine
    Write-Utf8 $readmePath $readme
}

Write-Host "Added application inventory and expanded DFD/page/role details."
