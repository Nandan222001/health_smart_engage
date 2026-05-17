# Integration APIs

APIs and webhooks for connecting the HSE platform with HR, ERP, procurement, asset systems, notification providers, document storage, and external analytics.

## Inbound Master Data APIs

| Method | Endpoint | Purpose | Source System |
|---|---|---|---|
| POST | `/api/v1/integrations/hr/employees/upsert` | Create/update employee master data | HRIS |
| POST | `/api/v1/integrations/hr/departments/upsert` | Create/update department data | HRIS |
| POST | `/api/v1/integrations/hr/shifts/upsert` | Create/update shift schedule data | HRIS/WFM |
| POST | `/api/v1/integrations/procurement/vendors/upsert` | Create/update vendor master data | ERP/Procurement |
| POST | `/api/v1/integrations/assets/upsert` | Create/update asset master data | CMMS/EAM |
| POST | `/api/v1/integrations/locations/upsert` | Create/update site/zone/location data | ERP/CMMS |

## Outbound Event APIs and Webhooks

| Event | Webhook Topic | Payload Summary |
|---|---|---|
| Permit approved | `permit.approved` | Permit ID, site, zone, asset, requester, approver, valid period |
| Permit closed | `permit.closed` | Permit ID, closure status, evidence references |
| Incident reported | `incident.reported` | Incident ID, type, severity, site, reported timestamp |
| CAPA overdue | `capa.overdue` | CAPA ID, owner, due date, severity |
| Vendor suspended | `vendor.suspended` | Vendor ID, reason, expiry/non-compliance details |
| Asset inspection overdue | `asset.inspection_overdue` | Asset ID, inspection type, due date |
| Training gap escalated | `training.gap_escalated` | Employee ID, training requirement, manager |

## Webhook Management APIs

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| GET | `/api/v1/integrations/webhooks/subscriptions` | List webhook subscriptions | IT Admin |
| POST | `/api/v1/integrations/webhooks/subscriptions` | Create webhook subscription | URL and secret required |
| PATCH | `/api/v1/integrations/webhooks/subscriptions/{subscriptionId}` | Update subscription | Audited |
| DELETE | `/api/v1/integrations/webhooks/subscriptions/{subscriptionId}` | Disable subscription | Soft delete |
| POST | `/api/v1/integrations/webhooks/subscriptions/{subscriptionId}/test` | Send test event | No business effect |
| GET | `/api/v1/integrations/webhooks/deliveries` | Delivery history | Retry/error visibility |

## Notification Integration APIs

| Method | Endpoint | Purpose | Provider |
|---|---|---|---|
| POST | `/api/v1/integrations/notifications/email/send` | Send email notification | Email provider |
| POST | `/api/v1/integrations/notifications/push/send` | Send push notification | Push provider |
| POST | `/api/v1/integrations/notifications/sms/send` | Send SMS notification if enabled | SMS provider |
| GET | `/api/v1/integrations/notifications/deliveries/{deliveryId}` | Delivery status | Provider callback |

## Document and Evidence Integration APIs

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| POST | `/api/v1/integrations/documents/upload-url` | Create pre-signed upload URL | Large files |
| POST | `/api/v1/integrations/documents/scan-callback` | Receive malware scan callback | Quarantine if failed |
| GET | `/api/v1/integrations/documents/{documentId}/metadata` | Document metadata | No binary content |
| POST | `/api/v1/integrations/documents/{documentId}/archive` | Archive document | Retention rules apply |

## Integration Monitoring APIs

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| GET | `/api/v1/integrations/status` | Overall integration health | IT Admin |
| GET | `/api/v1/integrations/jobs` | Sync job list | Filter by source/status |
| GET | `/api/v1/integrations/jobs/{jobId}` | Sync job detail | Includes failed rows |
| POST | `/api/v1/integrations/jobs/{jobId}/retry` | Retry failed sync job | Idempotent |
