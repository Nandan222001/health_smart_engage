# Audit Execution & CAPA Flow

## Audit Planning & Scheduling

```mermaid
flowchart TD
    SM([Safety Manager]) --> CHECKLIST_Q{Checklist\nExists?}
    CHECKLIST_Q -->|No| BUILD_CHECKLIST[Build Audit Checklist\nPOST /audit-checklists\nStandard: ISO 45001 · ISO 14001 · Custom]
    BUILD_CHECKLIST --> ADD_CLAUSES[Add Clauses & Questions\nMap to ISO clause numbers]
    ADD_CLAUSES --> PUBLISH_CL[Publish Checklist\nPOST /audit-checklists/:checklistId/publish]
    PUBLISH_CL --> ISO_MAP[Map ISO Clauses\nPOST /iso-clause-mappings]
    ISO_MAP --> PLAN_AUDIT

    CHECKLIST_Q -->|Yes| PLAN_AUDIT

    PLAN_AUDIT[Plan Audit\nPOST /audits\nSchedule date · Location · Assign Auditor]
    PLAN_AUDIT --> AUDITOR_NOTIF[Auditor receives\nnotification of assignment]
```

---

## Audit Execution (Mobile - On Site)

```mermaid
flowchart TD
    AUDITOR([Auditor]) --> OPEN_AUDIT[Open Assigned Audit\nGET /mobile/audits/assigned]
    OPEN_AUDIT --> DOWNLOAD_CL[Download Checklist\nGET /mobile/audits/:auditId/checklist]
    DOWNLOAD_CL --> OFFLINE_Q{Network\nAvailable?}
    OFFLINE_Q -->|Yes| ONLINE_MODE[Online Mode\nAnswers sync in real time]
    OFFLINE_Q -->|No| OFFLINE_MODE[Offline Mode\nAnswers queued locally]

    ONLINE_MODE & OFFLINE_MODE --> ANSWER_LOOP

    ANSWER_LOOP[For each question in checklist]
    ANSWER_LOOP --> RESPOND[Select Response\nPass · Fail · N/A · Observation]
    RESPOND --> NOTES[Add Notes\n- optional -]
    NOTES --> EVIDENCE_Q{Evidence\nRequired?}
    EVIDENCE_Q -->|Yes| CAPTURE_PHOTO[Capture Photo / Attach File\nPOST /mobile/audits/:auditId/evidence]
    EVIDENCE_Q -->|No| SAVE_ANS
    CAPTURE_PHOTO --> SAVE_ANS

    SAVE_ANS[Save Answer\nPATCH /mobile/audits/:auditId/answers/:questionId]
    SAVE_ANS --> MORE_Q{More\nQuestions?}
    MORE_Q -->|Yes| ANSWER_LOOP
    MORE_Q -->|No| REVIEW_AUDIT

    REVIEW_AUDIT[Review Completed Checklist\nProgress: N of N answered]
    REVIEW_AUDIT --> SUBMIT_AUDIT[Complete Audit\nPOST /mobile/audits/:auditId/complete]
    SUBMIT_AUDIT --> OFFLINE_Q2{Was Offline?}
    OFFLINE_Q2 -->|Yes| SYNC_QUEUE[Add to Sync Queue\nsee Offline Sync Flow]
    OFFLINE_Q2 -->|No| FINDINGS_GEN
    SYNC_QUEUE --> FINDINGS_GEN

    FINDINGS_GEN[System Auto-generates Findings\nFailed answers - Finding records\nISO clause mapped automatically]
    FINDINGS_GEN --> SM_NOTIF[Safety Manager notified]
```

---

## Findings Review & CAPA Creation

```mermaid
flowchart TD
    SM([Safety Manager]) --> FINDINGS_LIST[Open Findings Register\nGET /audits/:auditId/findings]
    FINDINGS_LIST --> SELECT_FINDING[Select Finding]
    SELECT_FINDING --> CLASSIFY_FINDING[Classify Severity\nMinor · Major · Critical · Observation]
    CLASSIFY_FINDING --> CAPA_Q{CAPA\nRequired?}

    CAPA_Q -->|No - observation only| ACCEPT[Mark as Accepted\nNo CAPA needed]
    CAPA_Q -->|Yes| CREATE_CAPA

    CREATE_CAPA[Create CAPA Record\nPOST /capas\nLinked to Finding & Audit]
    CREATE_CAPA --> CAPA_DETAIL[Set CAPA Details\nDescription · Type: Corrective / Preventive\nRoot cause · Due date · Priority]
    CAPA_DETAIL --> ASSIGN_OWNER[Assign CAPA Owner\nResponsible person notified]
```

---

## CAPA Execution & Closure Flow

```mermaid
flowchart TD
    OWNER([CAPA Owner]) --> VIEW_CAPA[View Assigned CAPA\nGET /capas/:capaId\nMobile: GET /mobile/tasks]
    VIEW_CAPA --> IMPLEMENT[Implement Corrective Action\nDocument steps taken]
    IMPLEMENT --> UPLOAD_EV[Upload Evidence of Completion\nPOST /files then POST /files/:id/link\nMobile: CAPA evidence upload screen]
    UPLOAD_EV --> SUBMIT_CLOSE[Submit Closure Request\nPOST /capas/:capaId/submit-closure]
    SUBMIT_CLOSE --> SM([Safety Manager / Reviewer])

    SM --> REVIEW_CAPA[Review Closure Evidence]
    REVIEW_CAPA --> EV_VALID{Evidence\nAcceptable?}

    EV_VALID -->|No - insufficient evidence| REJECT_CLOSE[Reject Closure\nFeedback sent to Owner]
    REJECT_CLOSE --> OWNER

    EV_VALID -->|Yes| APPROVE_CLOSE[Approve Closure\nPOST /capas/:capaId/approve-closure]
    APPROVE_CLOSE --> CAPA_CLOSED[CAPA - CLOSED\nAudit log updated\nFinding marked resolved]
    CAPA_CLOSED --> OVERDUE_CHECK{Was it\nOverdue?}
    OVERDUE_CHECK -->|Yes| FLAG_OVERDUE[Flag in reporting\nfor trend analysis]
    OVERDUE_CHECK -->|No| DONE([Done])
    FLAG_OVERDUE --> DONE
```

---

## CAPA States

```mermaid
stateDiagram-v2
    [*] --> OPEN : CAPA created from finding
    OPEN --> IN_PROGRESS : Owner starts work
    IN_PROGRESS --> OVERDUE : Due date passed without closure
    IN_PROGRESS --> PENDING_REVIEW : Owner submits closure
    OVERDUE --> PENDING_REVIEW : Owner submits closure late
    PENDING_REVIEW --> CLOSED : Reviewer approves
    PENDING_REVIEW --> IN_PROGRESS : Reviewer rejects - needs more evidence
    CLOSED --> [*]
```

---

## Audit States

```mermaid
stateDiagram-v2
    [*] --> SCHEDULED : Audit planned and assigned
    SCHEDULED --> IN_PROGRESS : Auditor opens and starts answering
    IN_PROGRESS --> COMPLETED : All questions answered and submitted
    COMPLETED --> FINDINGS_GENERATED : System auto-generates findings
    FINDINGS_GENERATED --> CAPA_OPEN : CAPAs created from findings
    CAPA_OPEN --> CLOSED : All CAPAs resolved
    FINDINGS_GENERATED --> CLOSED : No CAPAs needed
    CLOSED --> [*]
```
