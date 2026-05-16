# API Catalog

This folder separates the HSE platform APIs by consuming channel and technical responsibility.

## API Folder Structure

| Folder | Audience | Contents |
|---|---|---|
| [01_Web_APIs](01_Web_APIs/README.md) | Web frontend team | Dashboard, admin, operational workflow, report, and export APIs |
| [02_Mobile_APIs](02_Mobile_APIs/README.md) | Mobile/PWA team | Field reporting, offline sync, QR scan, mobile permits, mobile audits, SOP access |
| [03_Admin_APIs](03_Admin_APIs/README.md) | Platform/admin team | Tenant, organisation, users, roles, permissions, SSO, configuration |
| [04_Integration_APIs](04_Integration_APIs/README.md) | Integration/backend team | HR, ERP, vendor, asset, notification, document, and webhook integrations |
| [05_AI_APIs](05_AI_APIs/README.md) | AI/data team | AI advisor, retrieval, predictive risk, audit insights, recommended controls |
| [06_Shared_Platform_APIs](06_Shared_Platform_APIs/README.md) | All engineering teams | Auth, files, notifications, reports, audit logs, master data, health checks |

## API Standards

| Standard | Baseline |
|---|---|
| Base path | `/api/v1` |
| Payload format | JSON, except multipart file upload endpoints |
| Auth | OAuth2/OIDC bearer token or approved enterprise token |
| Tenant scoping | Required on all business APIs, resolved from token claims or explicit tenant context |
| Pagination | `page`, `pageSize`, `sort`, `filter` query parameters |
| Idempotency | Required for create operations that may be retried by mobile/offline clients |
| Correlation | `X-Correlation-Id` required for traceability |
| Audit logging | Required for create, update, approve, reject, delete/archive, export, and confidential view actions |

## Standard Error Model

| Field | Description |
|---|---|
| `code` | Stable machine-readable error code |
| `message` | User-safe error message |
| `details` | Optional validation or diagnostic details |
| `correlationId` | Request correlation identifier |
| `timestamp` | Server timestamp |

```json
{
  "code": "PERMIT_CONFLICT_DETECTED",
  "message": "Permit conflicts with active work in the same zone.",
  "details": {
    "conflictingPermitId": "PTW-2026-0012"
  },
  "correlationId": "8dbf4b19-4e8b-4a5b-83f7-234bbd94ad73",
  "timestamp": "2026-05-17T10:30:00Z"
}
```

## Endpoint Naming Rules

| Rule | Example |
|---|---|
| Use plural nouns for resources | `/api/v1/permits` |
| Use sub-resources for owned records | `/api/v1/audits/{auditId}/findings` |
| Use action endpoints only for workflow commands | `/api/v1/permits/{permitId}/approve` |
| Use export endpoints for generated files | `/api/v1/reports/permits/export` |
| Use sync endpoints for offline mobile deltas | `/api/v1/mobile/sync/pull` |
