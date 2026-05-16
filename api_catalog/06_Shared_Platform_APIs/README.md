# Shared Platform APIs

Cross-cutting APIs used by web, mobile, admin, integration, and AI features.

## Authentication and Session APIs

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Email/password login | Fallback where enabled |
| POST | `/api/v1/auth/logout` | Logout current session | Revokes refresh token |
| POST | `/api/v1/auth/refresh` | Refresh access token | Silent refresh |
| GET | `/api/v1/auth/me` | Current user profile and claims | Used by all clients |
| GET | `/api/v1/auth/sso/{providerKey}/start` | Start SSO flow | Redirect |
| GET | `/api/v1/auth/sso/{providerKey}/callback` | Complete SSO flow | Establishes session |

## File and Evidence APIs

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| POST | `/api/v1/files` | Upload file/evidence | Multipart |
| GET | `/api/v1/files/{fileId}` | File metadata | Access controlled |
| GET | `/api/v1/files/{fileId}/download` | Download file | Signed URL or stream |
| DELETE | `/api/v1/files/{fileId}` | Delete draft file | Not for immutable evidence |
| POST | `/api/v1/files/{fileId}/link` | Link file to business record | Audited |

## Notification APIs

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| GET | `/api/v1/notifications` | List user notifications | Web/mobile |
| POST | `/api/v1/notifications/{notificationId}/read` | Mark read | User scoped |
| POST | `/api/v1/notifications/read-all` | Mark all read | User scoped |
| GET | `/api/v1/notifications/preferences` | Get preferences | User scoped |
| PUT | `/api/v1/notifications/preferences` | Update preferences | User scoped |

## Search APIs

| Method | Endpoint | Purpose | Scope |
|---|---|---|---|
| GET | `/api/v1/search/global` | Global search across permitted modules | Web |
| GET | `/api/v1/search/people` | Search employees/users | People |
| GET | `/api/v1/search/assets` | Search assets | Assets/permits |
| GET | `/api/v1/search/vendors` | Search vendors | Vendors/permits |
| GET | `/api/v1/search/knowledge` | Search SOPs/policies | Knowledge |

## Report APIs

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| GET | `/api/v1/reports/templates` | List report templates | Role-filtered |
| POST | `/api/v1/reports/generate` | Generate report | Async for large reports |
| GET | `/api/v1/reports/jobs/{jobId}` | Report generation status | Includes download link |
| GET | `/api/v1/reports/jobs/{jobId}/download` | Download generated report | Audited |

## Audit Log APIs

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| GET | `/api/v1/audit-logs/record/{recordType}/{recordId}` | Record audit timeline | Immutable |
| GET | `/api/v1/audit-logs/my-access` | User access log | Privacy support |
| GET | `/api/v1/audit-logs/exports` | Export event logs | Restricted |

## Health and Observability APIs

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| GET | `/api/v1/health/live` | Liveness check | No auth or internal auth |
| GET | `/api/v1/health/ready` | Readiness check | Checks dependencies |
| GET | `/api/v1/health/dependencies` | Dependency status | Internal/admin |
| GET | `/api/v1/observability/correlation/{correlationId}` | Trace request by correlation ID | IT/Admin |
