# User Flow Diagram - Health Smart Engage

## 1. Authentication and Onboarding Flow

```mermaid
flowchart TD
    START([App Launch]) --> SPLASH[Splash Screen]
    SPLASH --> AUTH_CHECK{Session Valid?}

    AUTH_CHECK -->|Yes| SITE_CHECK{Multiple Sites?}
    AUTH_CHECK -->|No| LOGIN[Login Screen]

    LOGIN --> AUTH_METHOD{Auth Method}
    AUTH_METHOD -->|Username + Password| JWT[JWT Login]
    AUTH_METHOD -->|SSO / Enterprise| OIDC[OIDC / OAuth Login]

    JWT --> MFA{MFA Required?}
    OIDC --> MFA

    MFA -->|Yes| MFA_INPUT[Enter OTP / Authenticator]
    MFA -->|No| SITE_CHECK
    MFA_INPUT --> SITE_CHECK

    SITE_CHECK -->|Single site| ROLE_NAV[Role-Based Navigator]
    SITE_CHECK -->|Multiple sites| SITE_SEL[Site Selection Screen]
    SITE_SEL --> ROLE_NAV

    ROLE_NAV --> FIELD_DASH[Field Worker Dashboard]
    ROLE_NAV --> MANAGER_DASH[Safety Manager Dashboard]
    ROLE_NAV --> SECURITY_DASH[Gate Security Dashboard]
    ROLE_NAV --> ADMIN_DASH[Admin Dashboard]
```

---

## 2. Role-Based Navigation Overview

```mermaid
flowchart TD
    subgraph "Field Worker"
        FW_DASH[Dashboard - My Tasks and Alerts]
        FW_INC[Report Incident]
        FW_HAZ[Log Hazard Observation]
        FW_PERMIT[Create Permit Request]
        FW_SOP[Browse SOPs / Knowledge Docs]
        FW_TRAIN[Record Training Completion]
        FW_CERT[Upload Certification]
        FW_AI[AI Safety Advisor]
        FW_SYNC[Sync Status and Offline Queue]
    end

    subgraph "Safety Manager"
        SM_DASH[Dashboard - KPIs and Alerts]
        SM_PERMIT[Live Permit Board]
        SM_AUDIT[Conduct Audit]
        SM_CAPA[Manage CAPAs]
        SM_RISK[Risk Register]
        SM_INC[Incident Analytics]
        SM_VENDOR[Vendor Compliance]
        SM_ASSET[Asset Compliance]
        SM_TRAIN_MGR[Training Matrix and Gaps]
        SM_REPORT[Generate Reports]
    end

    subgraph "Gate Security"
        GS_DASH[Dashboard]
        GS_SCAN[Scan Contractor QR Code]
        GS_VENDOR[View Vendor Status]
        GS_PERMIT_VIEW[View Active Permits]
    end

    subgraph "Administrator"
        ADM_USERS[User Management]
        ADM_ROLES[Role and Permission Management]
        ADM_ORG[Organisation Structure]
        ADM_SETTINGS[System Settings and Integrations]
        ADM_LOGS[Audit Log Viewer]
    end
```

---

## 3. Work Permit User Flow

```mermaid
flowchart TD
    FW([Field Worker]) --> PERMIT[Open Permit Request Screen]
    PERMIT --> FILL[Fill form - Work type, Zone, Time, Assets]
    FILL --> SUBMIT[Submit Permit]
    SUBMIT --> CONFLICT{Conflict Detected?}
    CONFLICT -->|Yes| WARN[Show conflict warning - Edit or submit anyway]
    WARN --> SUBMIT
    CONFLICT -->|No| PENDING[Permit PENDING - Manager notified]

    PENDING --> SM([Safety Manager])
    SM --> DECIDE{Approve or Reject?}
    DECIDE -->|Approve| ACTIVE[Permit ACTIVE - Requester notified]
    DECIDE -->|Reject| REJECTED[Permit REJECTED - Reason sent]

    ACTIVE --> WORK[Work in Progress]
    WORK --> EXT{Extension Needed?}
    EXT -->|Yes| EXT_REQ[Request Extension - Manager approves]
    EXT_REQ --> ACTIVE
    EXT -->|No| CLOSE[Close with evidence]
    CLOSE --> CLOSED[Permit CLOSED]
```

---

## 4. Incident Reporting User Flow

```mermaid
flowchart TD
    FW([Field Worker]) --> REPORT[Open Incident Report Screen]
    REPORT --> CAPTURE[Select type, severity, location, photo]
    CAPTURE --> SUBMIT_INC[Submit Incident]
    SUBMIT_INC --> SM([Safety Manager])

    SM --> CLASSIFY[Classify incident]
    CLASSIFY --> INV{Investigation needed?}
    INV -->|Yes| RCA[Root Cause Analysis - assign investigator]
    RCA --> CAPA[Generate CAPA]
    CAPA --> ASSIGN[Assign CAPA owner]
    ASSIGN --> EVIDENCE[Owner uploads evidence]
    EVIDENCE --> CLOSE_CAPA[Safety Manager approves closure]
    INV -->|No| CLOSE_INC[Close Incident]
    CLOSE_CAPA --> CLOSE_INC
```

---

## 5. Audit Execution User Flow

```mermaid
flowchart TD
    SM([Safety Manager]) --> PLAN[Plan audit - checklist, date, auditor]
    PLAN --> AUDITOR([Auditor notified])
    AUDITOR --> EXECUTE[Open checklist on mobile]
    EXECUTE --> ANSWER[Answer each question - Pass / Fail / NA]
    ANSWER --> EVIDENCE_A[Attach photo evidence for failures]
    EVIDENCE_A --> COMPLETE[Submit completed audit]
    COMPLETE --> FINDINGS[System generates findings]
    FINDINGS --> SM
    SM --> CAPA_A{CAPA required?}
    CAPA_A -->|Yes| CREATE_CAPA[Create and assign CAPA]
    CAPA_A -->|No| CLOSE_AUDIT[Close Audit]
    CREATE_CAPA --> CLOSE_AUDIT
```

---

## 6. Training and Certification User Flow

```mermaid
flowchart TD
    ADM([Admin]) --> MATRIX[Define training matrix - Role to required training]
    MATRIX --> DS_M[(Training Requirements)]

    FW([Field Worker]) --> TRAIN_SCR[Training Completion Screen]
    TRAIN_SCR --> FILL_T[Enter training details and upload certificate]
    FILL_T --> SUBMIT_T[Submit completion record]
    SUBMIT_T --> DS_T[(Training Completions)]

    DS_T --> GAP[System checks gaps vs matrix daily]
    DS_M --> GAP
    GAP --> ALERT{Gap or expiry found?}
    ALERT -->|Yes| NOTIFY[Alert employee and manager]
    ALERT -->|No| COMPLIANT[Status: Compliant]
```

---

## 7. Vendor and Contractor User Flow

```mermaid
flowchart TD
    SM([Safety Manager]) --> CREATE_V[Create vendor profile]
    CREATE_V --> UPLOAD_D[Upload compliance documents]
    UPLOAD_D --> REVIEW[Review documents - approve or reject]
    REVIEW --> APPROVED{All docs approved?}
    APPROVED -->|No| UPLOAD_D
    APPROVED -->|Yes| VENDOR_ACTIVE[Vendor status - ACTIVE]

    VENDOR_ACTIVE --> GS([Gate Security])
    GS --> SCAN[Scan contractor QR at gate]
    SCAN --> CHECK{Vendor approved and docs valid?}
    CHECK -->|Yes| ENTRY[Grant site entry]
    CHECK -->|No| DENY[Deny entry - alert manager]
```

---

## 8. AI Safety Advisor User Flow

```mermaid
flowchart TD
    USER([Any User]) --> AI[Open AI Advisor Screen]
    AI --> QUERY[Type safety question]
    QUERY --> SUBMIT_AI[Submit query]
    SUBMIT_AI --> ANSWER_AI[AI returns answer with source citations]
    ANSWER_AI --> ACTION{Next action}
    ACTION -->|Follow-up question| QUERY
    ACTION -->|Open cited document| VIEW_DOC[View SOP / knowledge doc]
    ACTION -->|Give feedback| FEEDBACK[Submit helpful / not helpful]
    ACTION -->|End| SAVE[Conversation saved to history]
```

---

## 9. Mobile Offline Sync User Flow

```mermaid
flowchart TD
    FW([Field Worker]) --> OFFLINE[Work offline - actions queued locally]
    OFFLINE --> QUEUE[(Local Sync Queue)]
    QUEUE --> CONN{Device back online?}
    CONN -->|No| OFFLINE
    CONN -->|Yes| PULL[Pull latest data from server]
    PULL --> PUSH[Push queued operations]
    PUSH --> CONFLICT_S{Conflicts?}
    CONFLICT_S -->|No| DONE_S[Sync complete]
    CONFLICT_S -->|Yes| RESOLVE[Conflict resolution screen - choose local or server version]
    RESOLVE --> DONE_S
```

---

## 10. Executive Dashboard User Flow

```mermaid
flowchart TD
    EXEC([Executive / Safety Manager]) --> DASH[Dashboard Home]
    DASH --> CHOOSE{Select Dashboard}

    CHOOSE --> KPI[Executive Safety KPIs]
    CHOOSE --> SITE[Site Command Overview]
    CHOOSE --> PERMITS[Live Permit Board]
    CHOOSE --> INCIDENTS[Incident Analytics]
    CHOOSE --> AUDITS[Audit and CAPA Status]
    CHOOSE --> RISK[Risk Register]
    CHOOSE --> TRAINING[Training Compliance]
    CHOOSE --> VENDORS[Vendor Compliance]
    CHOOSE --> ASSETS[Asset Compliance]
    CHOOSE --> AI_DASH[AI Intelligence Dashboard]

    KPI & SITE & PERMITS & INCIDENTS --> DRILL{Drill down or export?}
    DRILL -->|Drill down| DETAIL[Open detail record]
    DRILL -->|Export| REPORT[Download report]
```

---

## Summary: User Journey Map

| User Role | Entry Point | Core Tasks | Output |
|---|---|---|---|
| Field Worker | Login - Dashboard | Report incident, log hazard, create permit, browse SOPs, record training | Submitted records, accessed SOPs |
| Safety Manager | Login - Dashboard | Review permits, conduct audits, manage CAPAs, view dashboards, generate reports | Approved permits, closed CAPAs, reports |
| Gate Security | Login - Dashboard | Scan contractor QR, verify vendor status, view active permits | Entry clearance granted or denied |
| Administrator | Login - Admin Panel | Manage users and roles, configure org structure, view audit logs | System configured, users provisioned |
| Executive | Login - Dashboard | View KPI dashboards, drill into incidents, risk, compliance | Insight reports, data exports |
