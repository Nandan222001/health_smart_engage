# Training & Certification Flow

## Training Matrix Setup (Admin / Manager)

```mermaid
flowchart TD
    ADM([Admin / Safety Manager]) --> MATRIX_SCREEN[Open Training Matrix\nGET /training/matrix]
    MATRIX_SCREEN --> NEW_REQ[Create Training Requirement\nRole - Required Training]
    NEW_REQ --> FILL_REQ[Define Requirement\nRole · Training name · Frequency\nValidity period · Mandatory flag]
    FILL_REQ --> SAVE_REQ[PUT /training/matrix/:roleId\nRequirement saved]
    SAVE_REQ --> PUBLISH[Requirement active\nGap checker will use this]
    PUBLISH --> MATRIX[(Training Requirements DB)]
```

---

## Training Completion Recording (Mobile / Web)

```mermaid
flowchart TD
    FW([Field Worker]) --> TRAIN_SCREEN[Open Training Completion Screen\nMobile: TrainingCompletionScreen\nWeb: Training Completion Entry page]
    TRAIN_SCREEN --> FILL_TRAIN[Enter Training Details\nTraining name · Provider\nDate completed · Score / Result]
    FILL_TRAIN --> UPLOAD_CERT[Upload Evidence\nCertificate · Attendance record · Photo\nPOST /files]
    UPLOAD_CERT --> SUBMIT_TRAIN[Submit Completion Record\nPOST /mobile/training/completions\nor POST /training/completions]
    SUBMIT_TRAIN --> SAVED[Record saved to\nTraining Completions DB]
    SAVED --> GAP_UPDATE[Gap checker re-evaluates\ntraining status for this employee]
```

---

## Training Gap Detection & Alerts (System / Scheduler)

```mermaid
flowchart TD
    SCHEDULER([Scheduled Job\nDaily / Weekly]) --> LOAD_MATRIX[Load Training Requirements\nGET /training/matrix - all roles]
    LOAD_MATRIX --> LOAD_COMPLETIONS[Load Training Completions\n& Certifications for all employees]
    LOAD_COMPLETIONS --> GAP_LOOP[For each Employee × Required Training]
    GAP_LOOP --> HAS_RECORD{Completion\nRecord Exists?}
    HAS_RECORD -->|No| GAP[Mark as: MISSING\nGap identified]
    HAS_RECORD -->|Yes| EXPIRY_CHECK{Expired or\nExpiring Soon?}
    EXPIRY_CHECK -->|Expired| EXPIRED_FLAG[Mark as: EXPIRED]
    EXPIRY_CHECK -->|Expiring within 30 days| EXPIRING_SOON[Mark as: EXPIRING SOON]
    EXPIRY_CHECK -->|Valid| COMPLIANT_FLAG[Mark as: COMPLIANT]

    GAP & EXPIRED_FLAG & EXPIRING_SOON --> ALERT_Q{Send\nAlert?}
    ALERT_Q -->|Yes| NOTIFY_BOTH[Notify Employee & Manager\nEmail / Push notification]
    NOTIFY_BOTH --> GAP_REPORT[Update Training Gaps\nGET /training/gaps - refreshed]
    COMPLIANT_FLAG --> GAP_REPORT

    GAP_REPORT --> HEATMAP[Training Compliance Heatmap\nUpdated for dashboard]
```

---

## Certification Management Flow

```mermaid
flowchart TD
    FW([Field Worker]) --> CERT_SCREEN[Open Certification Screen\nMobile: EmployeeCertificationScreen]
    CERT_SCREEN --> VIEW_CERTS[View My Certifications\nStatus · Expiry dates]

    VIEW_CERTS --> ADD_CERT[Add New Certification\nPOST /employees/:employeeId/certifications]
    ADD_CERT --> CERT_DETAILS[Enter Details\nCert type · Issuing body\nIssue date · Expiry date]
    CERT_DETAILS --> UPLOAD_CERT_FILE[Upload Certificate File\nPOST /files + link to certification]
    UPLOAD_CERT_FILE --> CERT_SAVED[Certification record saved]

    CERT_SAVED --> EXPIRY_MONITOR[System monitors expiry\nAlerts at 60 / 30 / 7 days before expiry]
    EXPIRY_MONITOR --> RENEWAL_ALERT{Expiry\nApproaching?}
    RENEWAL_ALERT -->|Yes| RENEW_NOTIF[Push / Email alert sent\nto employee and manager]
    RENEWAL_ALERT -->|No| COMPLIANT_CERT[Certification: VALID]
    RENEW_NOTIF --> RENEW_FLOW[Employee renews certification\nrepeat Add Certification flow]
```

---

## Training Compliance Dashboard (Safety Manager)

```mermaid
flowchart TD
    SM([Safety Manager]) --> TRAIN_DASH[Open Training Compliance Dashboard\nGET /dashboards/training-compliance]
    TRAIN_DASH --> OVERVIEW[See Overview\nCompliance % · Gaps count · Expiring soon]
    OVERVIEW --> HEATMAP_VIEW[View Heatmap\nRole × Training item grid\nColour-coded: Green / Amber / Red]
    HEATMAP_VIEW --> DRILL{Drill Down}
    DRILL -->|Select employee| EMP_DETAIL[Employee Training Profile\nGET /training/gaps?employee=:id]
    DRILL -->|Select training item| TRAIN_DETAIL[Who's compliant vs. gap\nfor this specific training]
    DRILL -->|Export| EXPORT[POST /reports/training/export\nDownload CSV / PDF]
    EMP_DETAIL --> REMIND[Send Reminder\nNotification to employee]
```
