# User Flow Diagram — Health Smart Engage

## 1. Authentication & Onboarding Flow

```mermaid
flowchart TD
    START([App Launch]) --> SPLASH[Splash Screen]
    SPLASH --> AUTH_CHECK{Session\nValid?}

    AUTH_CHECK -->|Yes| SITE_CHECK{Multiple\nSites?}
    AUTH_CHECK -->|No| LOGIN[Login Screen]

    LOGIN --> AUTH_METHOD{Auth\nMethod}
    AUTH_METHOD -->|Username + Password| JWT[JWT Login]
    AUTH_METHOD -->|SSO / Enterprise| OIDC[OIDC / OAuth Login]

    JWT --> MFA{MFA\nRequired?}
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
    subgraph Field Worker
        FW_DASH[Dashboard\nMy Tasks & Alerts]
        FW_INC[Report Incident]
        FW_HAZ[Log Hazard\nObservation]
        FW_PERMIT[Create Permit\nRequest]
        FW_SOP[Browse SOPs /\nKnowledge Docs]
        FW_TRAIN[Record Training\nCompletion]
        FW_CERT[Upload Certification]
        FW_AI[AI Safety Advisor]
        FW_SYNC[Sync Status\n& Offline Queue]
    end

    subgraph Safety Manager
        SM_DASH[Dashboard\nKPIs & Alerts]
        SM_PERMIT[Live Permit Board]
        SM_AUDIT[Conduct Audit]
        SM_CAPA[Manage CAPAs]
        SM_RISK[Risk Register]
        SM_INC[Incident Analytics]
        SM_VENDOR[Vendor Compliance]
        SM_ASSET[Asset Compliance]
        SM_TRAIN_MGR[Training Matrix\n& Gaps]
        SM_REPORT[Generate Reports]
    end

    subgraph Gate Security
        GS_DASH[Dashboard]
        GS_SCAN[Scan Contractor\nQR Code]
        GS_VENDOR[View Vendor\nStatus]
        GS_PERMIT_VIEW[View Active\nPermits]
    end

    subgraph Administrator
        ADM_USERS[User Management]
        ADM_ROLES[Role & Permission\nManagement]
        ADM_ORG[Organisation\nStructure]
        ADM_SETTINGS[System Settings\n& Integrations]
        ADM_LOGS[Audit Log Viewer]
    end
```

---

## 3. Work Permit Flow

```mermaid
flowchart TD
    FW([Field Worker]) --> CREATE[Open Permit\nRequest Screen]
    CREATE --> FORM[Fill Permit Form\nWork type / Zone / Times / Assets]
    FORM --> SUBMIT[Submit Permit]

    SUBMIT --> CONFLICT{Conflict\nDetected?}
    CONFLICT -->|Yes| WARN[Show Conflict Warning\nOverlapping zone / asset / time]
    WARN --> EDIT[Edit Permit Details]
    EDIT --> SUBMIT

    CONFLICT -->|No| PENDING[Permit in PENDING state\nManager notified]

    PENDING --> MGR([Safety Manager])
    MGR --> REVIEW[Review Permit\nDetails & Conflicts]
    REVIEW --> DECISION{Approve /\nReject?}

    DECISION -->|Approve| APPROVAL[Record Approval\nGPS location captured]
    APPROVAL --> ACTIVE[Permit ACTIVE\nRequester notified]

    DECISION -->|Reject| REJECTED[Permit REJECTED\nReason provided\nRequester notified]

    ACTIVE --> EXT_Q{Extension\nNeeded?}
    EXT_Q -->|Yes| EXT_REQ[Submit Extension\nRequest]
    EXT_REQ --> MGR
    EXT_Q -->|No| CLOSE_FLOW

    CLOSE_FLOW[Closure Flow]
    CLOSE_FLOW --> EVIDENCE[Upload Closure Evidence\nPhotos / Sign-off]
    EVIDENCE --> CLOSED[Permit CLOSED\nAudit log updated]
```

---

## 4. Incident Reporting & Investigation Flow

```mermaid
flowchart TD
    FW([Field Worker]) --> INC_SCREEN[Incident Report Screen]
    INC_SCREEN --> CAPTURE[Capture Details\nDescription / Photos / Location / Time]
    CAPTURE --> CLASSIFY[Classify Incident\nType / Severity / Confidentiality]
    CLASSIFY --> SUBMIT_INC[Submit Incident Report]

    SUBMIT_INC --> SM([Safety Manager])
    SM --> REVIEW_INC[Review Incident\nReport]
    REVIEW_INC --> ASSIGN{Assign\nInvestigation?}

    ASSIGN -->|Yes| INV_SCREEN[Investigation Screen]
    INV_SCREEN --> RCA[Root Cause Analysis\nFindings Entry]
    RCA --> CAPA_GEN[Generate CAPA\nCorrective / Preventive Action]

    CAPA_GEN --> CAPA_ASSIGN[Assign CAPA\nOwner / Due Date / Priority]
    CAPA_ASSIGN --> OWNER([CAPA Owner])
    OWNER --> ACTION[Implement\nCorrective Action]
    ACTION --> EVIDENCE_C[Upload Evidence\nof Completion]
    EVIDENCE_C --> SM
    SM --> CLOSE_CAPA{Verify &\nClose CAPA?}

    CLOSE_CAPA -->|Yes| CAPA_CLOSED[CAPA CLOSED\nAudit log updated]
    CLOSE_CAPA -->|No| OWNER

    ASSIGN -->|No| MONITOR[Monitor &\nClose Incident]
    MONITOR --> INC_CLOSED[Incident CLOSED]
```

---

## 5. Audit & Compliance Flow

```mermaid
flowchart TD
    SM([Safety Manager]) --> AUDIT_PLAN[Plan Audit\nSelect Standard / Checklist / Date]
    AUDIT_PLAN --> SCHEDULE[Schedule Audit\nAssign Auditor / Location]
    SCHEDULE --> AUDITOR([Auditor])

    AUDITOR --> EXECUTE[Open Audit Execution\nScreen On-Site]
    EXECUTE --> QUESTIONS[Answer Checklist\nQuestions with Evidence Photos]
    QUESTIONS --> SUBMIT_AUDIT[Submit Completed\nAudit]

    SUBMIT_AUDIT --> FINDINGS[System Generates\nFindings with ISO Clause Mapping]
    FINDINGS --> SM

    SM --> REVIEW_FINDINGS[Review Findings\n& Severity]
    REVIEW_FINDINGS --> CAPA_Q{CAPAs\nRequired?}

    CAPA_Q -->|Yes| CAPA_CREATE[Create CAPA\nRecords from Findings]
    CAPA_CREATE --> CAPA_FLOW[→ CAPA Assignment Flow\nsee Incident Flow]

    CAPA_Q -->|No| AUDIT_CLOSED[Audit CLOSED\nReport Generated]
    CAPA_FLOW --> AUDIT_CLOSED
```

---

## 6. Training & Certification Flow

```mermaid
flowchart TD
    ADM([Admin / Manager]) --> MATRIX[Define Training Matrix\nRole → Required Training]
    MATRIX --> DS_MATRIX[(Training Requirements)]

    FW([Field Worker]) --> TRAIN_SCREEN[Training Completion\nScreen]
    TRAIN_SCREEN --> FILL[Enter Training Details\nDate / Provider / Score]
    FILL --> UPLOAD_CERT[Upload Evidence /\nCertificate File]
    UPLOAD_CERT --> SUBMIT_TRAIN[Submit Completion Record]

    SUBMIT_TRAIN --> DS_TRAIN[(Training Completions)]

    SYSTEM([System / Scheduler]) --> GAP_CHECK[Check Training\nGaps vs Matrix]
    DS_TRAIN --> GAP_CHECK
    DS_MATRIX --> GAP_CHECK
    GAP_CHECK --> GAP_ALERT{Gaps or\nExpiring Soon?}

    GAP_ALERT -->|Yes| NOTIFY[Send Alert\nto Manager & Employee]
    GAP_ALERT -->|No| COMPLIANT[Mark Compliant]

    FW --> CERT_SCREEN[Certification\nManagement Screen]
    CERT_SCREEN --> UPLOAD_CERT2[Upload Certification\nExpiry Date / Type]
    UPLOAD_CERT2 --> DS_CERTS[(Certifications)]

    DS_CERTS --> EXPIRY_CHECK[Expiry Monitor\nScheduled Check]
    EXPIRY_CHECK -->|Expiring / Expired| RENEW_ALERT[Send Renewal\nAlert]
```

---

## 7. Vendor Management Flow

```mermaid
flowchart TD
    SM([Safety Manager]) --> VENDOR_SCREEN[Vendor\nManagement Screen]
    VENDOR_SCREEN --> CREATE_VENDOR[Create Vendor\nProfile]
    CREATE_VENDOR --> VENDOR_DETAILS[Enter Details\nName / Contact / Services / Region]
    VENDOR_DETAILS --> DS_VENDOR[(Vendors)]

    VENDOR_SCREEN --> UPLOAD_DOCS[Upload Compliance\nDocuments]
    UPLOAD_DOCS --> DOC_TYPE[Classify Document\nInsurance / Certification / License]
    DOC_TYPE --> DS_VENDOR_DOCS[(Vendor Documents)]

    DS_VENDOR_DOCS --> REVIEW[Review Documents\nValidity / Expiry]
    REVIEW --> DECISION{Approve /\nReject?}

    DECISION -->|Approve| APPROVED[Vendor APPROVED\nStatus Active]
    DECISION -->|Reject| REJECTED_V[Vendor REJECTED\nReason provided]
    REJECTED_V --> VENDOR_SCREEN

    APPROVED --> GS([Gate Security])
    GS --> SCAN[Scan Contractor\nQR Code at Gate]
    SCAN --> VERIFY{Vendor\nApproved &\nDocuments Valid?}
    VERIFY -->|Yes| CLEARANCE[Grant Entry\nClearance]
    VERIFY -->|No| DENY[Deny Entry\nAlert Manager]
```

---

## 8. AI Safety Advisor Flow

```mermaid
flowchart TD
    USER([Any User]) --> AI_SCREEN[AI Advisor\nScreen]
    AI_SCREEN --> QUERY[Enter Safety\nQuestion / Query]
    QUERY --> SUBMIT_AI[Submit Query]

    SUBMIT_AI --> AI_PROC[AI Service\nProcesses Query]
    AI_PROC --> CONTEXT[Retrieve Relevant\nKnowledge Documents\n& Past Conversations]
    CONTEXT --> AI_ENGINE([AI / ML Engine])
    AI_ENGINE --> ANSWER[Generate Answer\nwith Source Citations]

    ANSWER --> DISPLAY[Display Answer\n& Referenced Documents]
    DISPLAY --> FOLLOW_UP{Follow-up\nQuery?}
    FOLLOW_UP -->|Yes| QUERY
    FOLLOW_UP -->|No| SAVE[Save Conversation\nto History]

    RISK_SCORE[Predictive Risk\nScoring — Background]
    AI_ENGINE --> RISK_SCORE
    RISK_SCORE --> RISK_ALERT{High Risk\nPredicted?}
    RISK_ALERT -->|Yes| SM([Safety Manager Alert])
```

---

## 9. Mobile Offline Sync Flow

```mermaid
flowchart TD
    FW([Field Worker]) --> OFFLINE_ACTION[Perform Action\nOffline — Incident / Permit / Hazard]
    OFFLINE_ACTION --> QUEUE[Add to Sync\nQueue — MobileSyncItem]
    QUEUE --> DS_SYNC[(Local Sync Queue)]

    CONNECTIVITY{Device Online?}
    DS_SYNC --> CONNECTIVITY

    CONNECTIVITY -->|No| WAIT[Wait for\nConnectivity]
    WAIT --> CONNECTIVITY

    CONNECTIVITY -->|Yes| PUSH[Push Queued\nOperations to API]
    PUSH --> CONFLICT_CHECK{Conflict\nDetected?}

    CONFLICT_CHECK -->|No conflict| APPLIED[Records Applied\nRemote DB Updated]
    CONFLICT_CHECK -->|Conflict| CONFLICT_SCREEN[Show Conflict\nResolution Screen]
    CONFLICT_SCREEN --> FW
    FW --> RESOLVE[User Resolves\nConflict — Keep Local / Remote / Merge]
    RESOLVE --> APPLIED

    APPLIED --> PULL[Pull Latest\nData from Server]
    PULL --> LOCAL_DB[Update Local\nCache]
    LOCAL_DB --> SYNC_STATUS[Sync Status Screen\nShows Complete]
```

---

## 10. Executive Dashboard Flow

```mermaid
flowchart TD
    EXEC([Executive / Safety Manager]) --> DASH_HOME[Dashboard Home]

    DASH_HOME --> CHOOSE{Select\nDashboard View}

    CHOOSE --> EXEC_KPI[Executive Safety\nKPIs & Trends]
    CHOOSE --> SITE_CMD[Site Command\nOperational Overview]
    CHOOSE --> PERMIT_BOARD[Live Permit\nBoard]
    CHOOSE --> INCIDENT_ANALYTICS[Incident Analytics\n& RCA Status]
    CHOOSE --> AUDIT_CAPA[Audit & CAPA\nStatus]
    CHOOSE --> RISK_REG[Risk Register\n& Trends]
    CHOOSE --> TRAIN_COMP[Training Compliance\nMatrix & Gaps]
    CHOOSE --> VENDOR_COMP[Vendor Compliance\nStatus]
    CHOOSE --> ASSET_COMP[Asset Compliance\n& Inspection Schedule]
    CHOOSE --> AI_INTEL[AI Intelligence\nQuery Metrics]
    CHOOSE --> DATA_QUAL[Data Quality\nCompleteness]

    EXEC_KPI & SITE_CMD & PERMIT_BOARD & INCIDENT_ANALYTICS --> DRILL{Drill Down?}
    DRILL -->|Yes| DETAIL[Open Detail\nRecord / Report]
    DRILL -->|Export| REPORT[Download\nExport Report]
```

---

## Summary: User Journey Map

| User Role | Entry Point | Core Tasks | Exit / Output |
|---|---|---|---|
| Field Worker | Login → Dashboard | Report incident, Log hazard, Create permit, Browse SOPs, Record training | Submitted records, Accessed SOPs |
| Safety Manager | Login → Dashboard | Review permits, Conduct audits, Manage CAPAs, View dashboards, Generate reports | Approved permits, Closed CAPAs, Reports |
| Gate Security | Login → Dashboard | Scan contractor QR, Verify vendor status, View active permits | Entry clearance granted / denied |
| Administrator | Login → Admin Panel | Manage users/roles, Configure org structure, View audit logs, Manage integrations | System configured, Users provisioned |
| Executive | Login → Dashboard | View KPI dashboards, Drill into incidents/risk/compliance | Insight reports, Data exports |
