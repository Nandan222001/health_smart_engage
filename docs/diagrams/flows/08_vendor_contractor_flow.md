# Vendor & Contractor Management Flow

## Vendor Onboarding Flow

```mermaid
flowchart TD
    SM([Safety Manager / Admin]) --> VENDOR_DIR[Open Vendor Directory\nGET /vendors]
    VENDOR_DIR --> NEW_VENDOR[Create New Vendor\nPOST /vendors]
    NEW_VENDOR --> VENDOR_FORM[Enter Vendor Details\nCompany name · ABN / Registration number\nContact person · Email · Phone\nServices provided · Operating regions]
    VENDOR_FORM --> SAVE_VENDOR[Vendor record saved\nStatus: PENDING]

    SAVE_VENDOR --> DOC_UPLOAD[Upload Compliance Documents\nPOST /vendors/:vendorId/documents]
    DOC_UPLOAD --> DOC_TYPES[Documents required per standard:\nPublic Liability Insurance\nWorkers Compensation Insurance\nSafety Management Plan\nInductionCertificates · Licences]
    DOC_TYPES --> DOC_META[For each document enter:\nDocument type · Issue date · Expiry date]
    DOC_META --> DOC_SAVED[Documents saved\nAwaiting review]
    DOC_SAVED --> REVIEW_TRIGGER[Safety Manager\nreceives review task]
```

---

## Vendor Document Review Flow

```mermaid
flowchart TD
    SM([Safety Manager]) --> REVIEW_QUEUE[Open Vendor Document Review\nGET /vendors/:vendorId]
    REVIEW_QUEUE --> SELECT_DOC[Select Document to Review]
    SELECT_DOC --> VIEW_DOC[View Document\nGET /files/:fileId/download]
    VIEW_DOC --> CHECK_VALIDITY{Document\nValid & Current?}

    CHECK_VALIDITY -->|Expired| REJECT_DOC[Reject Document\nPOST /vendors/:vendorId/documents/:docId/review\nstatus: REJECTED · reason provided]
    REJECT_DOC --> VENDOR_NOTIF[Vendor contact notified\nRe-upload requested]
    VENDOR_NOTIF --> DOC_UPLOAD_AGAIN[Vendor uploads updated document]
    DOC_UPLOAD_AGAIN --> SELECT_DOC

    CHECK_VALIDITY -->|Valid| APPROVE_DOC[Approve Document\nPOST /vendors/:vendorId/documents/:docId/review\nstatus: APPROVED]
    APPROVE_DOC --> ALL_DOCS_Q{All required\ndocuments approved?}

    ALL_DOCS_Q -->|No| REVIEW_QUEUE
    ALL_DOCS_Q -->|Yes| APPROVE_VENDOR[Vendor status - APPROVED\nPATCH /vendors/:vendorId]
    APPROVE_VENDOR --> ACTIVE_VENDOR[Vendor: ACTIVE\nCan send contractors on site]
```

---

## Contractor Site Entry Flow (Gate Security)

```mermaid
flowchart TD
    CONTRACTOR([Contractor arrives\nat site gate]) --> GS([Gate Security Officer])
    GS --> SCAN_SCREEN[Open QR Scan Screen\nMobile App: ContractorScanScreen]
    SCAN_SCREEN --> SCAN{Scan Method}
    SCAN -->|QR Code scan| QR_SCAN[POST /mobile/contractors/scan\nQR code payload sent]
    SCAN -->|Manual entry| MANUAL[Enter contractor ID manually]
    MANUAL --> QR_SCAN

    QR_SCAN --> VERIFY_RESP{API Response}
    VERIFY_RESP -->|Vendor not found| NOT_FOUND[Show error:\nContractor not registered]
    NOT_FOUND --> DENY_ENTRY

    VERIFY_RESP -->|Vendor found| CHECK_STATUS[GET /mobile/vendors/:vendorId/status\nFetch compliance status]
    CHECK_STATUS --> STATUS_CHECK{Vendor\nStatus}

    STATUS_CHECK -->|APPROVED - all docs valid| CLEARANCE[Grant Entry Clearance\nContractor permitted on site\nEntry logged]
    STATUS_CHECK -->|PENDING - not yet approved| PENDING_MSG[Show: Pending Approval\nContact Safety Manager]
    STATUS_CHECK -->|EXPIRED docs| EXPIRED_MSG[Show: Documents Expired\nDetails of expired docs shown]
    STATUS_CHECK -->|REVOKED| REVOKED_MSG[Show: Vendor Revoked\nEntry not permitted]

    PENDING_MSG & EXPIRED_MSG & REVOKED_MSG --> DENY_ENTRY[Deny Entry\nAlert Safety Manager]
    CLEARANCE --> LOG_ENTRY[Log site entry\nTimestamp · Contractor · Gate officer]
```

---

## Vendor Expiry Monitoring (System)

```mermaid
flowchart TD
    SCHEDULER([Scheduled Job\nDaily]) --> LOAD_VENDORS[Load all APPROVED vendors\nGET /vendors]
    LOAD_VENDORS --> DOC_LOOP[For each vendor's documents]
    DOC_LOOP --> EXPIRY_CHECK{Document\nExpiry Status}
    EXPIRY_CHECK -->|Expired| FLAG_EXPIRED[Flag: EXPIRED\nVendor status may - SUSPENDED]
    EXPIRY_CHECK -->|Expiring ≤ 30 days| FLAG_SOON[Flag: EXPIRING SOON]
    EXPIRY_CHECK -->|Valid| OK[Mark: VALID]

    FLAG_EXPIRED --> NOTIF_E[Notify Safety Manager\n& Vendor contact]
    FLAG_SOON --> NOTIF_S[Notify Safety Manager\nRenewal reminder]
    NOTIF_E & NOTIF_S --> VENDOR_DASH[Update Vendor Compliance Dashboard\nGET /dashboards/vendor-compliance]
```

---

## Vendor States

```mermaid
stateDiagram-v2
    [*] --> PENDING : Vendor created, docs uploaded
    PENDING --> APPROVED : All documents reviewed and approved
    PENDING --> REJECTED : Documents rejected, re-submission required
    REJECTED --> PENDING : Vendor re-submits updated documents
    APPROVED --> SUSPENDED : A required document expired
    SUSPENDED --> APPROVED : Updated document approved
    APPROVED --> REVOKED : Vendor permanently removed
    REVOKED --> [*]
```
