# Mobile APIs

APIs consumed by the mobile app or PWA for field workflows, fast reporting, QR scan, offline operation, and evidence capture.

## Mobile Home and Task APIs

| Method | Endpoint | Purpose | Offline |
|---|---|---|---|
| GET | `/api/v1/mobile/profile` | Get mobile user profile and role context | Cache |
| GET | `/api/v1/mobile/home` | Mobile home summary and priority actions | Cache |
| GET | `/api/v1/mobile/tasks` | Assigned mobile tasks | Cache |
| PATCH | `/api/v1/mobile/tasks/{taskId}/status` | Update assigned task status | Queue |
| GET | `/api/v1/mobile/notifications` | Mobile notifications | Cache |
| POST | `/api/v1/mobile/notifications/{notificationId}/read` | Mark notification read | Queue |

## Offline Sync APIs

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| POST | `/api/v1/mobile/sync/pull` | Pull delta data for offline use | Uses last sync token |
| POST | `/api/v1/mobile/sync/push` | Push queued offline changes | Idempotency required |
| GET | `/api/v1/mobile/sync/status` | Get sync status and conflicts | Shows failed records |
| POST | `/api/v1/mobile/sync/conflicts/{conflictId}/resolve` | Resolve sync conflict | User/admin decision |

## Incident and Hazard Mobile APIs

| Method | Endpoint | Purpose | Evidence |
|---|---|---|---|
| POST | `/api/v1/mobile/incidents` | Submit incident or near miss | Photo optional |
| POST | `/api/v1/mobile/incidents/{incidentId}/attachments` | Upload incident attachment | Multipart |
| GET | `/api/v1/mobile/incidents/{incidentId}` | Get submitted incident | Cache |
| POST | `/api/v1/mobile/hazards` | Submit hazard observation | Photo/GPS supported |
| POST | `/api/v1/mobile/hazards/{hazardId}/close` | Close hazard action | Evidence required by severity |
| GET | `/api/v1/mobile/hazards/my` | List user's hazard actions | Cache |

## Mobile Permit APIs

| Method | Endpoint | Purpose | Offline |
|---|---|---|---|
| GET | `/api/v1/mobile/permits` | List mobile-visible permits | Cache |
| POST | `/api/v1/mobile/permits` | Create field permit request | Queue if offline |
| GET | `/api/v1/mobile/permits/{permitId}` | Permit detail | Cache |
| POST | `/api/v1/mobile/permits/{permitId}/approve` | One-tap approval | Queue with timestamp/GPS |
| POST | `/api/v1/mobile/permits/{permitId}/reject` | Reject permit | Comment required |
| POST | `/api/v1/mobile/permits/{permitId}/extend` | Request extension | Queue |
| POST | `/api/v1/mobile/permits/{permitId}/close` | Close permit with evidence | Queue |
| GET | `/api/v1/mobile/permits/live-board` | Mobile live permit board | Cache |

## Mobile Audit APIs

| Method | Endpoint | Purpose | Offline |
|---|---|---|---|
| GET | `/api/v1/mobile/audits/assigned` | Assigned audits | Cache |
| GET | `/api/v1/mobile/audits/{auditId}/checklist` | Download checklist for execution | Cache |
| PATCH | `/api/v1/mobile/audits/{auditId}/answers/{questionId}` | Save audit answer | Queue |
| POST | `/api/v1/mobile/audits/{auditId}/evidence` | Upload audit evidence | Queue multipart |
| POST | `/api/v1/mobile/audits/{auditId}/complete` | Complete audit | Requires sync validation |

## QR, Asset, SOP, and Contractor APIs

| Method | Endpoint | Purpose | Offline |
|---|---|---|---|
| POST | `/api/v1/mobile/contractors/scan` | Scan contractor QR and return status | Uses cached status if offline |
| GET | `/api/v1/mobile/vendors/{vendorId}/status` | Vendor compliance status | Cache |
| GET | `/api/v1/mobile/assets/search` | Search asset by ID/QR/location | Cache |
| GET | `/api/v1/mobile/assets/{assetId}/status` | Asset compliance and SOP status | Cache |
| POST | `/api/v1/mobile/assets/{assetId}/inspections` | Record inspection | Queue |
| GET | `/api/v1/mobile/knowledge/search` | SOP search | Cache selected docs |
| GET | `/api/v1/mobile/knowledge/documents/{documentId}` | SOP detail | Cache |
| POST | `/api/v1/mobile/knowledge/documents/{documentId}/acknowledge` | Record SOP acknowledgement | Queue |

## Mobile AI APIs

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| POST | `/api/v1/mobile/ai/advisor/query` | Ask AI safety question | Source citation required |
| GET | `/api/v1/mobile/ai/conversations` | List user's AI conversations | Record-level access |
| POST | `/api/v1/mobile/ai/responses/{responseId}/feedback` | Accept/reject AI answer feedback | Improves quality review |
