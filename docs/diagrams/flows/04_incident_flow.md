# Incident Reporting & Investigation Flow

## Incident Report Submission (Mobile)

```mermaid
flowchart TD
    FW([Field Worker]) --> INC_SCREEN[Open Incident Report Screen\nMobile App]
    INC_SCREEN --> INC_TYPE[Select Incident Type\nNear Miss · Injury · Equipment Damage\nEnvironmental · Fire · Chemical]
    INC_TYPE --> SEVERITY[Select Severity\nLow · Medium · High · Critical]
    SEVERITY --> PHOTO[Capture Evidence Photo\n- optional but recommended -]
    PHOTO --> LOCATION[Enter Location\nZone / Area\n- GPS auto-detected or manual -]
    LOCATION --> DESCRIPTION[Enter Description\nWhat happened · When · Who involved]
    DESCRIPTION --> CONFIDENTIAL{Mark as\nConfidential?}
    CONFIDENTIAL -->|Yes| CONF_FLAG[Confidential flag set\nAccess restricted to authorised roles]
    CONFIDENTIAL -->|No| SUBMIT_INC

    CONF_FLAG --> SUBMIT_INC
    SUBMIT_INC[Submit Incident Report\nPOST /mobile/incidents]

    SUBMIT_INC --> ATTACH{Evidence\nPhoto to attach?}
    ATTACH -->|Yes| UPLOAD_ATTACH[POST /mobile/incidents/:incidentId/attachments\nUpload photo file]
    UPLOAD_ATTACH --> NOTIFY_SM
    ATTACH -->|No| NOTIFY_SM

    NOTIFY_SM[Safety Manager notified\nPush / Email alert dispatched]
    NOTIFY_SM --> REPORTER_CONF[Reporter sees confirmation\nIncident ID assigned]
```

---

## Incident Classification & Investigation (Safety Manager)

```mermaid
flowchart TD
    SM([Safety Manager]) --> INC_LIST[Open Incident List\nGET /incidents]
    INC_LIST --> SELECT_INC[Select Incident]
    SELECT_INC --> REVIEW_DETAIL[Review Incident Detail\nGET /incidents/:incidentId]

    REVIEW_DETAIL --> CLASSIFY[Classify Incident\nPOST /incidents/:incidentId/classify\nType · Severity · Body part · Cause category]
    CLASSIFY --> NOTIFIABLE{Regulatory\nNotification Required?}
    NOTIFIABLE -->|Yes| REG_NOTIFY[Mark as notifiable\nExternal reporting triggered]
    NOTIFIABLE -->|No| INV_DECISION

    REG_NOTIFY --> INV_DECISION
    INV_DECISION{Start\nInvestigation?}
    INV_DECISION -->|Yes| OPEN_INV[POST /incidents/:incidentId/investigations\nInvestigation workspace created]
    INV_DECISION -->|No - minor incident| MONITOR[Monitor & close without\nformal investigation]
    MONITOR --> CLOSE_INC

    OPEN_INV --> INVESTIGATOR([Assign Investigator])
    INVESTIGATOR --> RCA_WORK[Investigation Workspace\nRoot Cause Analysis Tool]
    RCA_WORK --> EVIDENCE_INV[Gather Evidence\nInterviews · Photos · Documents]
    EVIDENCE_INV --> CAUSE_CATS[Identify Root Causes\nImmediate · Underlying · Systemic]
    CAUSE_CATS --> FINDINGS[Document Findings\nRecommendations for prevention]
    FINDINGS --> CAPA_GEN{CAPA\nRequired?}
    CAPA_GEN -->|Yes| CREATE_CAPA[Create CAPA Record\nsee CAPA Flow]
    CAPA_GEN -->|No| REVIEW_SM

    CREATE_CAPA --> REVIEW_SM
    REVIEW_SM[Safety Manager\nreviews investigation report]
    REVIEW_SM --> APPROVE_INV{Approve\nFindings?}
    APPROVE_INV -->|Revisions needed| INVESTIGATOR
    APPROVE_INV -->|Approved| CLOSE_INC

    CLOSE_INC[Close Incident\nStatus - CLOSED\nAudit log updated]
    CLOSE_INC --> LESSONS[Lessons Learned\nArticle published to Knowledge Base]
```

---

## Confidential Incident Access Flow

```mermaid
flowchart TD
    USER([User]) --> ACCESS_INC[Attempt to view\nConfidential Incident]
    ACCESS_INC --> PERM_CHECK{Has\nconfidential_incidents\npermission?}
    PERM_CHECK -->|No| DENIED[403 Forbidden\nAccess Denied message shown]
    PERM_CHECK -->|Yes| VIEW_INC[Incident detail visible\nAccess logged in Audit Trail]
    VIEW_INC --> ACCESS_LOG[GET /audit-logs/record/incident/:id]
```

---

## Incident States

```mermaid
stateDiagram-v2
    [*] --> REPORTED : Field worker submits
    REPORTED --> CLASSIFIED : Safety Manager classifies
    CLASSIFIED --> UNDER_INVESTIGATION : Investigation started
    CLASSIFIED --> CLOSED : No investigation needed
    UNDER_INVESTIGATION --> PENDING_CAPA : Findings documented
    PENDING_CAPA --> CLOSED : All CAPAs resolved
    UNDER_INVESTIGATION --> CLOSED : Investigation complete, no CAPA
    CLOSED --> [*]
```
