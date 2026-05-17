# HSE Platform API Data Contracts

This document defines the expected request payloads and successful response data structures for the HSE platform APIs.

## Common Request Envelope (POST/PUT/PATCH)

All mutation requests use a standard envelope to support audit comments and idempotency.

```json
{
  "data": {
    "//": "Operation-specific payload"
  },
  "comment": "Optional audit comment",
  "idempotency_key": "Optional UUID for retry safety"
}
```

## Common Response Envelope

```json
{
  "success": true,
  "message": "OK" or "Accepted",
  "data": {
    "//": "Operation-specific result"
  }
}
```

---

## 1. Dashboard APIs (Web & Mobile)

### GET /api/v1/dashboards/*

**Response Data:**
*   **Executive Safety**: `{"total_incidents": 10, "open_capas": 5, "safety_score": 85.5}`
*   **Site Command**: `{"active_permits": 12, "site_status": "green"}`
*   **Training Compliance**: `{"compliance_rate": 92.0, "total_completions": 150}`
*   **My Tasks**: `{"pending_approvals": 3, "assigned_capas": 2, "total_tasks": 5}`

---

## 2. People & Training APIs

### POST /api/v1/employees

**Request Data:**
```json
{
  "name": "John Doe",
  "employee_code": "EMP001",
  "role_name": "Safety Officer",
  "department_id": "DEPT_01",
  "contact": "john@example.com"
}
```

**Response Data:** `{"id": "uuid-string"}`

### POST /api/v1/employees/{id}/certifications

**Request Data:**
```json
{
  "certification_type": "Working at Heights",
  "issue_date": "2026-01-01",
  "expiry_date": "2027-01-01",
  "evidence_file_id": "file-uuid"
}
```

**Response Data:** `{"id": "cert-uuid"}`

---

## 3. Vendor APIs

### POST /api/v1/vendors

**Request Data:**
```json
{
  "company_name": "SafeBuild Ltd",
  "trade_type": "Construction",
  "contact": "contact@safebuild.com"
}
```

**Response Data:** `{"id": "vendor-uuid", "status": "pending_approval"}`

### POST /api/v1/vendors/{id}/documents

**Request Data:**
```json
{
  "document_type": "Insurance",
  "file_id": "file-uuid",
  "expiry_date": "2026-12-31"
}
```

**Response Data:** `{"id": "doc-uuid"}`

---

## 4. Asset APIs

### POST /api/v1/assets

**Request Data:**
```json
{
  "asset_code": "CRANE-01",
  "category": "Heavy Machinery",
  "location_id": "LOC_MAIN",
  "criticality": "high"
}
```

**Response Data:** `{"id": "asset-uuid"}`

### POST /api/v1/assets/{id}/inspections

**Request Data:**
```json
{
  "inspection_type": "Monthly Safety",
  "inspected_on": "2026-05-17",
  "result": "passed",
  "evidence_file_id": "file-uuid"
}
```

**Response Data:** `{"id": "insp-uuid"}`

---

## 5. Permit APIs

### POST /api/v1/permits

**Request Data:**
```json
{
  "permit_type": "Hot Work",
  "asset_id": "asset-uuid",
  "zone_id": "zone-01",
  "risk_assessment_id": "ra-uuid",
  "start_at": "2026-05-18T08:00:00Z",
  "end_at": "2026-05-18T17:00:00Z",
  "controls": {"harness": true, "fire_watch": true}
}
```

**Response Data:** `{"id": "permit-uuid", "ref": "PTW-A1B2C3D4", "status": "draft"}`

### POST /api/v1/permits/{id}/approve

**Request Data:**
```json
{
  "comment": "All controls verified.",
  "gps_location": "12.34, 56.78"
}
```

**Response Data:** `{"id": "permit-uuid", "status": "approved"}`

---

## 6. Compliance & Incident APIs

### POST /api/v1/incidents

**Request Data:**
```json
{
  "incident_type": "near-miss",
  "location_id": "LOC_02",
  "description": "Loose railing detected on staircase B.",
  "is_confidential": false
}
```

**Response Data:** `{"id": "inc-uuid", "ref": "INC-2026-0001"}`

### POST /api/v1/capas/{id}/submit-closure

**Request Data:**
```json
{
  "evidence_file_id": "file-uuid"
}
```

**Response Data:** `{"id": "capa-uuid", "status": "pending_approval"}`

---

## 7. Mobile & Sync APIs

### POST /api/v1/mobile/sync/pull

**Request Data:** `{"lastSyncToken": "token-string"}`

**Response Data:**
```json
{
  "userId": "user-uuid",
  "syncToken": "new-token",
  "changes": [],
  "lastSyncToken": "old-token"
}
```

### POST /api/v1/mobile/contractors/scan

**Request Data:** `{"vendorId": "vendor-uuid"}`

**Response Data:** `{"status": "approved", "access": "allowed"}`

---

## 8. AI APIs

### POST /api/v1/ai/advisor/query

**Request Data:** `{"question": "What are the requirements for hot work?"}`

**Response Data:**
```json
{
  "answer": "Hot work requires a valid permit...",
  "source_citations": ["SOP-01", "Policy-HSE-04"]
}
```
