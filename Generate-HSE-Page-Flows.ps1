Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Root = Get-Location
$OutDir = Join-Path $Root "page_flows"
$DashboardDir = Join-Path $OutDir "01_Dashboard_Flows"
$WebDir = Join-Path $OutDir "02_Web_Page_Flows"
$MobileDir = Join-Path $OutDir "03_Mobile_Screen_Flows"
$Fence = '```'

foreach ($dir in @($OutDir, $DashboardDir, $WebDir, $MobileDir)) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
    }
}

function Write-Utf8 {
    param([string]$Path, [string]$Text)
    [System.IO.File]::WriteAllText($Path, $Text, [System.Text.Encoding]::UTF8)
}

function Convert-ToSlug {
    param([string]$Text)
    $slug = $Text.ToLowerInvariant()
    $slug = [regex]::Replace($slug, "[^a-z0-9]+", "_")
    $slug = $slug.Trim("_")
    return $slug
}

function New-PageRecord {
    param(
        [string]$Name,
        [string]$Module,
        [string]$Roles,
        [string]$Purpose,
        [string]$PrimaryData,
        [string]$PrimaryAction,
        [string]$Output
    )
    return [pscustomobject]@{
        Name = $Name
        Module = $Module
        Roles = $Roles
        Purpose = $Purpose
        PrimaryData = $PrimaryData
        PrimaryAction = $PrimaryAction
        Output = $Output
    }
}

function New-FlowMarkdown {
    param([object]$Page, [string]$Kind)

    $safeName = $Page.Name.Replace('"', "'")
    $safePurpose = $Page.Purpose.Replace('"', "'")
    $safeData = $Page.PrimaryData.Replace('"', "'")
    $safeAction = $Page.PrimaryAction.Replace('"', "'")
    $safeOutput = $Page.Output.Replace('"', "'")

    return @"
# $($Page.Name)

| Field | Detail |
|---|---|
| Page Type | $Kind |
| Module | $($Page.Module) |
| Primary Roles | $($Page.Roles) |
| Purpose | $($Page.Purpose) |

## What This Page Shows

| Area | Content |
|---|---|
| Header | Page title, site/tenant context, date range where applicable, role-aware actions |
| Filters | Status, site, department, owner, date range, severity, category, or module-specific filters |
| Main Content | $($Page.PrimaryData) |
| Primary Action | $($Page.PrimaryAction) |
| Output | $($Page.Output) |
| Audit Behavior | View, create, update, approve, reject, export, and confidential access actions are audit logged where applicable |

## Page Flowchart

$($Fence)mermaid
flowchart TD
    Start([User opens $safeName])
    Auth[Validate session, tenant, role, and record access]
    Context[Load page context: site, department, date range, permissions]
    Data[Load data: $safeData]
    View[Render page layout and status indicators]
    Decision{User action}
    Action[Perform action: $safeAction]
    Validate[Validate business rules and permissions]
    Save[Save changes and write audit event]
    Notify[Send notifications or refresh dashboards if needed]
    Output[Result: $safeOutput]
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
$Fence
"@
}

function Write-PageSet {
    param(
        [object[]]$Pages,
        [string]$Dir,
        [string]$Kind,
        [string]$IndexTitle
    )

    $index = New-Object System.Collections.Generic.List[string]
    $index.Add("# $IndexTitle")
    $index.Add("")
    $index.Add("Each file contains a page-level content table and Mermaid flowchart.")
    $index.Add("")
    $index.Add("| # | Page | Module | Roles | File |")
    $index.Add("|---:|---|---|---|---|")

    $i = 1
    foreach ($page in $Pages) {
        $fileName = ("{0:D2}_{1}.md" -f $i, (Convert-ToSlug $page.Name))
        $path = Join-Path $Dir $fileName
        Write-Utf8 $path (New-FlowMarkdown -Page $page -Kind $Kind)
        $index.Add("| $i | $($page.Name) | $($page.Module) | $($page.Roles) | [$fileName]($fileName) |")
        $i++
    }

    Write-Utf8 (Join-Path $Dir "README.md") ($index -join [Environment]::NewLine)
}

$Dashboards = @(
    New-PageRecord "Executive Safety Intelligence Dashboard" "Executive" "Executive Sponsor, Plant Manager, Safety Manager" "Show board-level safety intelligence." "KPIs, incidents, compliance score, CAPA, leading indicators, AI briefing summary" "Export board report or drill down into risk areas" "Executive dashboard insights and report exports"
    New-PageRecord "Site HSE Command Dashboard" "Operations" "Plant Manager, Safety Manager" "Show site-level operational safety status." "Open hazards, active permits, incidents, overdue CAPA, vendor blocks, asset exceptions" "Drill down to site exception records" "Site action queue and situational awareness"
    New-PageRecord "My Tasks Dashboard" "Cross-cutting" "All authenticated users" "Show assigned work." "Approvals, CAPAs, audits, permit actions, hazard actions, notifications" "Open assigned task or mark action progress" "Updated task status"
    New-PageRecord "Training Compliance Dashboard" "People and Training" "HR Admin, Training Coordinator, Safety Manager" "Show workforce training compliance." "Training gaps, expiry alerts, department heatmap, role compliance" "Open gap list or export training report" "Training compliance report"
    New-PageRecord "Vendor Compliance Dashboard" "Vendor Compliance" "Procurement Manager, Compliance Manager, Gate Security" "Show vendor readiness." "Vendor statuses, expiring documents, blocked vendors, review queues" "Review vendor documents or export history" "Vendor compliance decisions"
    New-PageRecord "Asset Compliance Dashboard" "Asset Compliance" "Maintenance Manager, Safety Manager" "Show equipment readiness." "Overdue inspections, due-soon inspections, asset criticality, non-compliant assets" "Open asset profile or schedule inspection" "Asset compliance action"
    New-PageRecord "Audit and CAPA Dashboard" "Compliance and CAPA" "Compliance Manager, Safety Auditor, Safety Manager" "Show audit and corrective action health." "Audit progress, findings, CAPA aging, overdue actions, closure rates" "Open finding or CAPA detail" "CAPA or audit action"
    New-PageRecord "Risk Register Dashboard" "Risk and Hazard" "Risk Manager, Safety Manager, Plant Manager" "Show risk trends." "Risk scores, severity bands, open controls, hazard trends, high-risk locations" "Open risk assessment or export register" "Risk register report"
    New-PageRecord "Permit Live Board" "Permit to Work" "Permit Coordinator, Safety Manager, Plant Manager" "Show live work status." "Active permits, pending permits, conflicts, expiries, zones, equipment" "Approve, reject, close, extend, or resolve conflict" "Updated permit board"
    New-PageRecord "Incident Analytics Dashboard" "Incident Management" "Safety Manager, Legal/HR Officer, Plant Manager" "Show incident trends and hotspots." "Incidents by type, severity, location, time, RCA status, confidential indicators" "Open incident, export analytics, or start investigation" "Incident insight and actions"
    New-PageRecord "Knowledge Usage Dashboard" "Knowledge Centre" "Document Controller, Safety Manager" "Show SOP and document usage." "SOP acknowledgements, outdated documents, search usage, lesson views" "Open document control actions" "Knowledge usage report"
    New-PageRecord "AI Safety Intelligence Dashboard" "AI Intelligence" "Executive Sponsor, Safety Manager" "Show AI-generated insights." "Predictive risk, audit insights, recommended controls, weekly briefing" "Open insight, approve briefing, review source citations" "AI intelligence action"
    New-PageRecord "Organisation Admin Dashboard" "Foundation" "System Admin, IT Admin" "Show administrative setup status." "Tenants, organisation nodes, users, roles, SSO, integrations" "Open admin configuration" "Configuration update"
    New-PageRecord "Notification and Escalation Dashboard" "Cross-cutting" "System Admin, Safety Manager" "Show alert delivery and escalation health." "Notification delivery, failed messages, escalation rules, pending escalations" "Retry delivery or update escalation rule" "Notification action"
    New-PageRecord "Compliance Score Dashboard" "Compliance" "Compliance Manager, Executive Sponsor" "Show ISO and internal compliance score." "Clause coverage, non-conformances, overdue CAPA, audit completion" "Export compliance report or open clause details" "Compliance score evidence"
    New-PageRecord "Contractor Entry Dashboard" "Vendor Compliance" "Gate Security Officer, Security Supervisor" "Show contractor entry decisions." "QR scan results, blocked access, amber warnings, scan history" "Open scan result or verify contractor" "Entry decision log"
    New-PageRecord "Data Quality Dashboard" "Administration" "Product Owner, System Admin" "Show missing or invalid data." "Missing master data, sync errors, invalid references, duplicate records" "Resolve issue or assign data fix" "Data quality remediation"
)

$WebPages = @(
    New-PageRecord "Login / SSO Callback" "Foundation" "All users" "Authenticate users." "Identity provider response, session status, fallback login controls" "Complete login or show authentication error" "Authenticated session"
    New-PageRecord "Tenant and Organisation Setup" "Foundation" "System Admin" "Configure tenant and hierarchy." "Tenant settings, company, plant, department structure" "Create or update organisation node" "Saved organisation model"
    New-PageRecord "Organisation Tree" "Foundation" "System Admin, Plant Manager" "View hierarchy." "Group, company, plant, department tree and inherited settings" "Drill down or edit node" "Selected organisation context"
    New-PageRecord "User Directory" "Foundation" "System Admin, IT Admin" "Manage users." "Users, status, roles, department, login status" "Invite, revoke, or edit user" "Updated user access"
    New-PageRecord "User Invitation" "Foundation" "System Admin" "Invite users." "Email, role, organisation, invitation status" "Send invitation" "One-time invitation link sent"
    New-PageRecord "Role and Permission Builder" "Foundation" "System Admin, Safety Manager" "Configure RBAC." "Roles, module permissions, read/write/approve flags" "Create or update role" "Updated permission set"
    New-PageRecord "SSO Configuration" "Foundation" "IT Admin" "Configure identity provider." "SAML/OIDC provider settings and test status" "Test or enable provider" "SSO provider configuration"
    New-PageRecord "Audit Log Viewer" "Foundation" "System Admin, Compliance Manager" "Review system audit events." "Event timeline, actor, record, timestamp, action" "Filter or export logs" "Audit evidence"
    New-PageRecord "Employee Directory" "People" "HR Admin, Safety Manager" "Find employees." "Employee list, department, role, certification status" "Open employee profile" "Selected employee record"
    New-PageRecord "Employee Profile" "People" "HR Admin, Manager" "Manage employee details." "Profile, certifications, training, shifts, assignments" "Update profile or add certification" "Updated employee record"
    New-PageRecord "Certification Management" "People" "HR Admin, Training Coordinator" "Manage certifications." "Certification issue/expiry dates, evidence, alerts" "Add, renew, or revoke certification" "Certification status"
    New-PageRecord "Shift Schedule Calendar" "People" "Supervisor, HR Admin" "Manage shifts." "Shift calendar, conflicts, assigned employees" "Publish shift schedule" "Updated shift calendar"
    New-PageRecord "Training Matrix" "People" "Safety Manager, Training Coordinator" "Map training to roles." "Roles, mandatory training, gaps, expiry rules" "Update training requirement" "Versioned training matrix"
    New-PageRecord "Training Completion Entry" "People" "Training Coordinator" "Record training completion." "Employee, course, trainer, date, evidence" "Submit completion" "Training completion record"
    New-PageRecord "Training Compliance Heatmap" "People" "Plant Manager, Safety Manager" "Visualise training gaps." "Department heatmap, compliance bands, filters" "Export heatmap or open gaps" "Training compliance view"
    New-PageRecord "Vendor Directory" "Vendors" "Procurement Manager" "Find vendors." "Vendor list, status, trade, expiry indicators" "Open vendor profile" "Selected vendor record"
    New-PageRecord "Vendor Profile" "Vendors" "Procurement Manager, Compliance Manager" "Manage vendor details." "Company, contact, trade, status, documents, history" "Update profile or submit for review" "Vendor profile update"
    New-PageRecord "Vendor Document Review" "Vendors" "Compliance Manager" "Review vendor documents." "Document checklist, versions, expiry, validation status" "Approve or reject document" "Document review decision"
    New-PageRecord "Vendor Standards Configuration" "Vendors" "Safety Manager" "Define vendor requirements." "Standards by vendor category and effective date" "Create or update standard" "Versioned standard"
    New-PageRecord "Vendor Expiry Register" "Vendors" "Compliance Officer" "Track expiring documents." "Expiry list, alert dates, vendor contacts" "Notify vendor or suspend access" "Expiry action"
    New-PageRecord "Vendor Compliance History" "Vendors" "Auditor" "Review vendor audit history." "Approvals, rejections, renewals, scan events" "Export history" "Vendor audit report"
    New-PageRecord "Asset Register" "Assets" "Maintenance Manager" "Find assets." "Asset list, category, criticality, location, compliance" "Open asset profile" "Selected asset"
    New-PageRecord "Asset Profile" "Assets" "Maintenance Manager, Safety Manager" "Manage asset record." "Asset metadata, inspections, SOPs, permit links" "Update asset or view history" "Asset update"
    New-PageRecord "Asset Inspection Schedule" "Assets" "Maintenance Manager" "Schedule inspections." "Inspection calendar, due dates, overdue assets" "Schedule or assign inspection" "Inspection schedule"
    New-PageRecord "Asset Compliance Rules" "Assets" "Safety Manager" "Configure asset rules." "Category rules, inspection frequency, escalation" "Update rule" "Applied compliance rule"
    New-PageRecord "Asset Inspection History" "Assets" "Auditor" "Review asset inspection evidence." "Inspection timeline, inspector, result, evidence" "Export history" "Asset compliance report"
    New-PageRecord "Checklist Builder" "Compliance" "Compliance Manager" "Build audit checklist." "Sections, questions, evidence requirements" "Add question or publish checklist" "Checklist version"
    New-PageRecord "ISO Clause Mapping" "Compliance" "Compliance Manager, Auditor" "Map clauses to questions." "ISO clauses, checklist questions, coverage" "Assign clause" "Clause coverage"
    New-PageRecord "Audit Plan" "Compliance" "Compliance Manager" "Plan audits." "Audit calendar, checklist, auditor, site scope" "Create audit plan" "Scheduled audit"
    New-PageRecord "Audit Execution Review" "Compliance" "Safety Auditor" "Review audit execution." "Answers, evidence, findings, progress" "Submit audit or create finding" "Audit result"
    New-PageRecord "Findings Register" "Compliance" "Compliance Manager" "Track findings." "Findings, severity, clause, owner, status" "Open finding or generate CAPA" "Finding action"
    New-PageRecord "CAPA Register" "Compliance" "Safety Manager" "Track corrective actions." "CAPA list, owner, due date, status, aging" "Open CAPA or escalate" "CAPA action"
    New-PageRecord "CAPA Detail and Approval" "Compliance" "CAPA Owner, Manager" "Complete and approve CAPA." "Action details, evidence, workflow status" "Submit or approve closure" "CAPA status update"
    New-PageRecord "Risk Matrix Configuration" "Risk" "Safety Manager" "Configure scoring model." "Likelihood, consequence, color bands, version" "Publish matrix version" "Risk matrix version"
    New-PageRecord "Risk Assessment Builder" "Risk" "Safety Officer" "Create risk assessment." "Hazards, scores, controls, residual risk" "Submit risk assessment" "Risk assessment record"
    New-PageRecord "Risk Register" "Risk" "Risk Manager" "Track risks." "Risks by severity, location, owner, trend" "Filter, drill down, or export" "Risk register output"
    New-PageRecord "Hazard Observation Register" "Risk" "Supervisor" "Track hazards." "Hazards, severity, location, assigned owner, status" "Assign or close hazard" "Hazard status"
    New-PageRecord "Risk Trend Analytics" "Risk" "Safety Manager" "Analyse risk trends." "Trend charts, severity bands, location patterns" "Export analytics" "Risk analytics report"
    New-PageRecord "Permit Request Form" "Permit" "Permit Requester" "Create permit." "Task, location, asset, SOP, RA, controls" "Submit permit request" "Permit reference ID"
    New-PageRecord "Permit Review Queue" "Permit" "Permit Coordinator" "Review submitted permits." "Pending permits, missing controls, conflicts" "Route, approve, reject, or request changes" "Permit workflow update"
    New-PageRecord "Permit Approval Detail" "Permit" "Permit Approver" "Approve permit." "Permit summary, controls, conflicts, risk, asset status" "Approve or reject" "Approval decision"
    New-PageRecord "Concurrent Permit Conflict View" "Permit" "Plant Manager" "Resolve concurrent work conflicts." "Conflicting permits, zone/equipment overlap, justification" "Approve override or block permit" "Conflict decision"
    New-PageRecord "Permit Extension and Closure" "Permit" "Permit Holder" "Extend or close permit." "Permit status, expiry, evidence, sign-off" "Request extension or close permit" "Permit status update"
    New-PageRecord "Permit Audit Trail Export" "Permit" "Auditor" "Export permit audit evidence." "Permit timeline, approvals, changes, closure" "Generate export" "Signed permit audit report"
    New-PageRecord "Incident Report Detail" "Incident" "Safety Manager" "Review incident." "Incident details, photos, location, reporter, severity" "Classify or assign investigation" "Incident workflow update"
    New-PageRecord "Incident Classification" "Incident" "Safety Manager" "Classify incident severity." "Incident facts, classification rules, escalation settings" "Classify incident" "Escalation trigger"
    New-PageRecord "Investigation Workspace" "Incident" "Investigation Lead" "Manage investigation." "Timeline, evidence, team, RCA, findings" "Add findings or submit investigation" "Investigation status"
    New-PageRecord "RCA Tool Page" "Incident" "Investigation Lead" "Perform RCA." "5-Why, Fishbone, Bow-Tie inputs" "Save RCA findings" "Root cause findings"
    New-PageRecord "Confidential Incident Access Review" "Incident" "Legal / HR Officer" "Control sensitive incident access." "Confidential record, access log, export justification" "Approve access or export" "Confidential access decision"
    New-PageRecord "Knowledge Library" "Knowledge" "All authorised users" "Search documents." "SOPs, policies, lessons, tags, versions" "Open document" "Knowledge result"
    New-PageRecord "Document Upload and Versioning" "Knowledge" "Document Controller" "Control documents." "Document metadata, version, approval, change reason" "Upload or publish version" "Approved document version"
    New-PageRecord "SOP Detail and Acknowledgement" "Knowledge" "Employee" "Read SOP." "SOP content, version, linked tasks, acknowledgement" "Acknowledge SOP" "Acknowledgement record"
    New-PageRecord "Lessons Learned Articles" "Knowledge" "Safety Manager" "Share incident learnings." "Lessons, tags, hazard type, related incidents" "Publish lesson" "Knowledge article"
    New-PageRecord "AI Safety Advisor Chat" "AI" "Safety Manager, Employee" "Ask AI safety questions." "Chat thread, retrieved sources, citations" "Ask question or rate response" "Source-cited answer"
    New-PageRecord "Predictive Risk Detail" "AI" "Plant Manager" "Review predicted risk." "Risk score, 12-week trend, contributing factors" "Drill down or assign action" "Risk intervention"
    New-PageRecord "AI Weekly Briefing" "AI" "Executive Sponsor" "Review weekly AI briefing." "Narrative summary, incidents, CAPA, compliance, leading indicators" "Approve or publish briefing" "Executive briefing"
    New-PageRecord "Notification Centre" "Cross-cutting" "All users" "Review notifications." "Unread/read alerts, escalation messages, task links" "Open notification or mark read" "Notification state"
    New-PageRecord "Escalation Rules" "Cross-cutting" "System Admin, Safety Manager" "Configure escalations." "Rules, thresholds, owners, notification templates" "Update rule" "Escalation configuration"
    New-PageRecord "Report Builder" "Cross-cutting" "Managers, Auditors" "Build reports." "Report templates, filters, fields, output format" "Generate report" "Report job"
    New-PageRecord "Export Centre" "Cross-cutting" "Auditors, Managers" "Access exports." "Generated files, status, expiry, audit events" "Download export" "Exported file"
    New-PageRecord "Master Data Import" "Cross-cutting" "System Admin" "Import master data." "Upload file, validation errors, preview, import status" "Validate or apply import" "Master data update"
    New-PageRecord "Data Quality Review" "Cross-cutting" "Product Owner, Admin" "Resolve data quality issues." "Missing fields, duplicates, invalid links, sync errors" "Assign or resolve issue" "Data quality fix"
    New-PageRecord "Integration Monitoring" "Cross-cutting" "IT Admin" "Monitor integrations." "Sync jobs, webhook deliveries, failures, retries" "Retry job or open failure" "Integration status"
    New-PageRecord "System Settings" "Cross-cutting" "System Admin" "Configure system settings." "Tenant defaults, retention, features, security options" "Update setting" "System configuration"
    New-PageRecord "Help and Support" "Cross-cutting" "All users" "Support users." "Help articles, support tickets, contact options" "Open article or create ticket" "Support request"
    New-PageRecord "User Preferences" "Cross-cutting" "All users" "Manage personal settings." "Language, timezone, notifications, display settings" "Save preferences" "Updated user preference"
)

$MobileScreens = @(
    New-PageRecord "Mobile Login / SSO" "Mobile Foundation" "All users" "Authenticate mobile user." "SSO provider, token, device context" "Complete login" "Mobile session"
    New-PageRecord "Mobile Home / My Tasks" "Mobile Home" "All users" "Show mobile priority tasks." "Assigned tasks, alerts, approvals, offline status" "Open task" "Task detail"
    New-PageRecord "Notifications" "Mobile Shared" "All users" "Review mobile alerts." "Unread alerts, escalation messages, task links" "Open or mark read" "Notification state"
    New-PageRecord "SOP Search" "Mobile Knowledge" "All users" "Find procedure quickly." "Keyword, tag, module, cached documents" "Search and open SOP" "SOP result"
    New-PageRecord "SOP Detail and Acknowledgement" "Mobile Knowledge" "All users" "Read and acknowledge SOP." "SOP version, content, related task" "Acknowledge SOP" "Acknowledgement record"
    New-PageRecord "Incident / Near Miss Quick Report" "Mobile Incident" "Employee, Contractor" "Submit incident rapidly." "Incident type, photo, location, description" "Submit report" "Incident reference"
    New-PageRecord "Hazard Observation Report" "Mobile Risk" "Employee, Supervisor" "Report hazard." "Photo, GPS, severity, description" "Submit hazard" "Hazard action"
    New-PageRecord "My CAPA Actions" "Mobile CAPA" "CAPA Owner" "Show assigned CAPAs." "CAPA list, due dates, status" "Open CAPA" "CAPA detail"
    New-PageRecord "CAPA Evidence Upload" "Mobile CAPA" "CAPA Owner" "Upload closure evidence." "Evidence, notes, status" "Submit evidence" "CAPA pending approval"
    New-PageRecord "Permit Request Mobile Form" "Mobile Permit" "Permit Requester" "Create field permit." "Task, location, asset, controls, SOP, RA" "Submit permit" "Permit request"
    New-PageRecord "Permit Approval Notification" "Mobile Permit" "Permit Approver" "Approve permit from notification." "Permit summary, controls, conflict status" "Approve or reject" "Permit decision"
    New-PageRecord "Permit Detail" "Mobile Permit" "Permit Holder, Approver" "View permit controls." "Permit status, approvals, controls, SOP, RA" "Open related item" "Permit context"
    New-PageRecord "Permit Extension Request" "Mobile Permit" "Permit Holder" "Request permit extension." "Current expiry, reason, evidence" "Submit extension" "Extension approval request"
    New-PageRecord "Permit Closure Evidence" "Mobile Permit" "Permit Holder" "Close permit with evidence." "Completion sign-off, evidence, notes" "Submit closure" "Permit closed/pending approval"
    New-PageRecord "Live Permit Board Mobile" "Mobile Permit" "Safety Manager" "View live work on mobile." "Active permits, zones, conflicts, expiries" "Open permit" "Permit detail"
    New-PageRecord "Contractor QR Scan" "Mobile Vendor" "Gate Security Officer" "Scan contractor QR." "QR payload, cached vendor status, access rules" "Scan QR" "Green/amber/red decision"
    New-PageRecord "Contractor Status Detail" "Mobile Vendor" "Gate Security Officer" "Explain contractor access decision." "Vendor status, blocked reasons, expiry warnings" "Allow/deny per policy" "Scan log"
    New-PageRecord "Audit Checklist Execution" "Mobile Audit" "Safety Auditor" "Execute checklist." "Checklist questions, clause mapping, answer controls" "Answer questions" "Audit progress"
    New-PageRecord "Audit Evidence Capture" "Mobile Audit" "Safety Auditor" "Capture evidence." "Photo, notes, question link, offline queue" "Attach evidence" "Evidence record"
    New-PageRecord "Audit Sync Queue" "Mobile Audit" "Safety Auditor" "Manage offline sync." "Pending answers, failed uploads, conflicts" "Retry sync" "Synced audit data"
    New-PageRecord "Risk Assessment Review" "Mobile Risk" "Safety Officer" "Review risk assessment." "Hazards, scores, controls, linked task" "Acknowledge or edit controls" "Risk update"
    New-PageRecord "Control Measure Capture" "Mobile Risk" "Safety Officer" "Add control measure." "Control details, owner, target date" "Save control" "Control record"
    New-PageRecord "Asset Lookup" "Mobile Asset" "Maintenance, Permit Team" "Find asset in field." "Asset ID/QR, location, compliance status" "Open asset" "Asset status"
    New-PageRecord "Asset Inspection Capture" "Mobile Asset" "Maintenance" "Record inspection." "Inspection checklist, result, photo evidence" "Submit inspection" "Inspection record"
    New-PageRecord "Training Completion Scan / Entry" "Mobile Training" "Training Coordinator" "Record completion." "Employee scan, course, trainer, date" "Submit completion" "Training record"
    New-PageRecord "Employee Certification View" "Mobile People" "Supervisor" "Validate employee qualification." "Employee profile, certifications, expiry status" "Confirm eligibility" "Qualification decision"
    New-PageRecord "Vendor Document Status" "Mobile Vendor" "Procurement, Gate Security" "Check vendor readiness." "Document status, expiry, compliance result" "Open vendor or notify" "Vendor status"
    New-PageRecord "Incident Investigation Notes" "Mobile Incident" "Investigation Lead" "Capture investigation notes." "Timeline, notes, photos, interviews" "Save note" "Investigation update"
    New-PageRecord "RCA Mobile Capture" "Mobile Incident" "Investigation Lead" "Capture RCA inputs." "5-Why/Fishbone/Bow-Tie fields" "Save RCA" "Root cause record"
    New-PageRecord "AI Safety Advisor Mobile" "Mobile AI" "Safety Manager, Employee" "Ask AI safety question." "Question, source citations, feedback controls" "Ask question" "Source-cited response"
    New-PageRecord "Offline Data Sync Status" "Mobile Shared" "Mobile users" "Show sync status." "Pending changes, conflicts, failed uploads" "Retry or resolve sync" "Sync result"
)

Write-PageSet -Pages $Dashboards -Dir $DashboardDir -Kind "Dashboard" -IndexTitle "Dashboard Flowcharts"
Write-PageSet -Pages $WebPages -Dir $WebDir -Kind "Web Page" -IndexTitle "Web Page Flowcharts"
Write-PageSet -Pages $MobileScreens -Dir $MobileDir -Kind "Mobile Screen" -IndexTitle "Mobile Screen Flowcharts"

$rootIndex = @"
# Page Flowcharts

This folder contains page-level flowcharts for the HSE Safety, Compliance & Intelligence Platform.

## Contents

| Folder | Count | Description |
|---|---:|---|
| [01_Dashboard_Flows](01_Dashboard_Flows/README.md) | $($Dashboards.Count) | Flowcharts for dashboard pages |
| [02_Web_Page_Flows](02_Web_Page_Flows/README.md) | $($WebPages.Count) | Flowcharts for web operational and admin pages |
| [03_Mobile_Screen_Flows](03_Mobile_Screen_Flows/README.md) | $($MobileScreens.Count) | Flowcharts for mobile screens |

## Total

| Type | Count |
|---|---:|
| Dashboard flowcharts | $($Dashboards.Count) |
| Web page flowcharts | $($WebPages.Count) |
| Mobile screen flowcharts | $($MobileScreens.Count) |
| Total page/screen flowcharts | $($Dashboards.Count + $WebPages.Count + $MobileScreens.Count) |

Each page file includes:

- Page type
- Module
- Primary roles
- Purpose
- What the page shows
- Main action
- Output
- Mermaid flowchart
"@

Write-Utf8 (Join-Path $OutDir "README.md") $rootIndex

Write-Host "Generated page flowcharts in $OutDir"
Write-Host "Dashboard flowcharts: $($Dashboards.Count)"
Write-Host "Web page flowcharts: $($WebPages.Count)"
Write-Host "Mobile screen flowcharts: $($MobileScreens.Count)"
