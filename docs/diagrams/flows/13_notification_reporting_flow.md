# Notification & Reporting Flow

## Notification Delivery Flow

```mermaid
flowchart TD
    TRIGGER([System Event Trigger\nPermit approved · Incident reported\nCAPA due · Doc expiring · Audit assigned\nHazard observation submitted etc.])

    TRIGGER --> NOTIF_SERVICE[Notification Service\nEvaluates: who needs to be notified?]
    NOTIF_SERVICE --> PREF_CHECK[Load user notification preferences\nGET /notifications/preferences]
    PREF_CHECK --> CHANNEL_LOOP[For each recipient]

    CHANNEL_LOOP --> EMAIL_PREF{Email\nEnabled?}
    EMAIL_PREF -->|Yes| SEND_EMAIL[Send email notification\nAzure Email Service / SMTP]
    EMAIL_PREF -->|No| SKIP_EMAIL[Skip email]

    CHANNEL_LOOP --> PUSH_PREF{Push\nEnabled?}
    PUSH_PREF -->|Yes| SEND_PUSH[Send mobile push notification\nExpo Push / FCM / APNs]
    PUSH_PREF -->|No| SKIP_PUSH[Skip push]

    CHANNEL_LOOP --> IN_APP[In-app notification\nalways created regardless of prefs]

    SEND_EMAIL & SEND_PUSH & IN_APP --> NOTIF_STORED[(Notifications stored\nfor inbox retrieval)]
```

---

## Notification Centre Flow (User)

```mermaid
flowchart TD
    USER([User]) --> NOTIF_SCREEN[Open Notification Centre\nMobile: NotificationScreen\nWeb: Notification Centre page]
    NOTIF_SCREEN --> LOAD_NOTIFS[Load notifications\nGET /mobile/notifications\nor GET /notifications]
    LOAD_NOTIFS --> NOTIF_LIST[List of notifications\nUnread · Read · All]
    NOTIF_LIST --> SELECT_NOTIF[Select notification]
    SELECT_NOTIF --> MARK_READ[Mark as read\nPOST /mobile/notifications/:notificationId/read\nor POST /notifications/:notificationId/read]
    MARK_READ --> DEEP_LINK{Navigate to\nrelated record?}
    DEEP_LINK -->|Yes| OPEN_RECORD[Navigate to linked record\nPermit detail · Incident · CAPA · Audit etc.]
    DEEP_LINK -->|No| BACK[Back to notification list]

    USER --> MARK_ALL[Mark all as read\nPOST /notifications/read-all]
    USER --> PREF_SETTINGS[Notification Preferences\nGET / PUT /notifications/preferences\nToggle email · push · in-app per event type]
```

---

## Escalation Flow (Overdue Actions)

```mermaid
flowchart TD
    SCHEDULER([Scheduled Job - Hourly]) --> CHECK_OVERDUE[Check for overdue items\nCAPAs past due date\nPermits expiring without action\nInspections overdue\nVendor docs expired]

    CHECK_OVERDUE --> FOR_EACH[For each overdue item]
    FOR_EACH --> ESC_RULE[Load escalation rule\nGET /admin/escalation-rules]
    ESC_RULE --> LEVEL{Escalation\nLevel}

    LEVEL -->|Level 1 - owner reminder| L1[Notify assigned owner\nFirst reminder]
    LEVEL -->|Level 2 - manager escalation| L2[Notify owner's manager\nEscalation alert]
    LEVEL -->|Level 3 - executive alert| L3[Notify Safety Manager + Executive\nUrgent escalation]

    L1 & L2 & L3 --> LOG_ESC[Log escalation event\nAudit trail updated]
    LOG_ESC --> UPDATE_DASH[Escalation appears on\nNotification & Escalation Dashboard]
```

---

## Report Generation Flow

```mermaid
flowchart TD
    USER([User - Manager / Admin / Executive]) --> REPORT_SCREEN[Open Report Builder\nGET /reports/templates]
    REPORT_SCREEN --> SELECT_TEMPLATE[Select report template\nPermits · Audits · Incidents · CAPAs\nVendors · Assets · Training]
    SELECT_TEMPLATE --> CONFIG_REPORT[Configure parameters\nDate range · Sites · Departments\nStatus filters · Format: PDF / CSV / Excel]
    CONFIG_REPORT --> GENERATE[Generate report\nPOST /reports/generate]
    GENERATE --> JOB_CREATED[Report job queued\nJob ID returned]
    JOB_CREATED --> POLL_STATUS[Poll job status\nGET /reports/jobs/:jobId]
    POLL_STATUS --> JOB_STATUS{Job\nStatus}
    JOB_STATUS -->|Processing| POLL_STATUS
    JOB_STATUS -->|Complete| DOWNLOAD[Download report\nGET /reports/jobs/:jobId/download]
    JOB_STATUS -->|Failed| RETRY[Show error\nRetry option]
    DOWNLOAD --> SAVE[Save / open file locally]
```

---

## Quick Export Flows

```mermaid
flowchart TD
    USER([User]) --> EXPORT_CENTRE[Export Centre\nSelect export type]

    EXPORT_CENTRE --> P_EXP[Permits export\nPOST /reports/permits/export]
    EXPORT_CENTRE --> A_EXP[Audits export\nPOST /reports/audits/export]
    EXPORT_CENTRE --> C_EXP[CAPAs export\nPOST /reports/capas/export]
    EXPORT_CENTRE --> I_EXP[Incidents export\nPOST /reports/incidents/export]
    EXPORT_CENTRE --> V_EXP[Vendors export\nPOST /reports/vendors/export]
    EXPORT_CENTRE --> AS_EXP[Assets export\nPOST /reports/assets/export]
    EXPORT_CENTRE --> T_EXP[Training export\nPOST /reports/training/export]

    P_EXP & A_EXP & C_EXP & I_EXP & V_EXP & AS_EXP & T_EXP --> DOWNLOAD_FILE[File ready for download\nCSV / Excel]
```

---

## Notification Preference Categories

| Event Type | Default: Email | Default: Push | Default: In-App |
|---|---|---|---|
| Permit approval / rejection | Yes | Yes | Yes |
| Permit expiring soon | Yes | Yes | Yes |
| CAPA assigned | Yes | Yes | Yes |
| CAPA overdue | Yes | Yes | Yes |
| Incident reported (manager) | Yes | Yes | Yes |
| Audit assigned | Yes | Yes | Yes |
| Training gap identified | Yes | No | Yes |
| Certification expiring | Yes | No | Yes |
| Vendor document expiring | Yes | No | Yes |
| Escalation alert | Yes | Yes | Yes |
| Report ready | No | No | Yes |
| Sync conflict detected | No | Yes | Yes |
