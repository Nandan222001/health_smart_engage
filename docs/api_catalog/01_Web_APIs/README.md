# Web APIs

APIs consumed by the desktop/tablet web application for dashboards, operational workflows, administration screens, and reporting.

## Dashboard APIs

| Method | Endpoint | Purpose | Primary Roles |
|---|---|---|---|
| GET | `/api/v1/dashboards/executive-safety` | Executive safety KPIs, incidents, CAPA, compliance, leading indicators | Executive Sponsor, Plant Manager |
| GET | `/api/v1/dashboards/site-command` | Site-level operational safety status | Plant Manager, Safety Manager |
| GET | `/api/v1/dashboards/my-tasks` | User task queue across approvals, CAPA, audits, permits | All authenticated users |
| GET | `/api/v1/dashboards/training-compliance` | Training compliance by department and role | HR Admin, Training Coordinator |
| GET | `/api/v1/dashboards/vendor-compliance` | Vendor status, expiry, blocked vendors | Procurement Manager, Compliance Manager |
| GET | `/api/v1/dashboards/asset-compliance` | Asset readiness, overdue inspections, due-soon inspections | Maintenance Manager |
| GET | `/api/v1/dashboards/audit-capa` | Audit progress, findings, CAPA aging | Compliance Manager, Safety Manager |
| GET | `/api/v1/dashboards/risk-register` | Risk severity, trends, open controls | Risk Manager, Safety Manager |
| GET | `/api/v1/dashboards/permit-live-board` | Active, pending, expired, and conflicting permits | Permit Coordinator, Safety Manager |
| GET | `/api/v1/dashboards/incident-analytics` | Incident trends by type, severity, location, time | Safety Manager |
| GET | `/api/v1/dashboards/knowledge-usage` | SOP usage, acknowledgements, outdated documents | Document Controller |
| GET | `/api/v1/dashboards/ai-intelligence` | AI insights, predictive risk, weekly briefing summaries | Executive Sponsor, Safety Manager |
| GET | `/api/v1/dashboards/data-quality` | Missing master data, sync errors, invalid records | Product Owner, System Admin |

## People and Training APIs

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| GET | `/api/v1/employees` | List employees | Supports department, role, status filters |
| POST | `/api/v1/employees` | Create employee profile | Audited |
| GET | `/api/v1/employees/{employeeId}` | Get employee profile | Includes certifications and training summary |
| PATCH | `/api/v1/employees/{employeeId}` | Update employee profile | HR/Admin only |
| GET | `/api/v1/employees/{employeeId}/certifications` | List employee certifications | Used by permit validation |
| POST | `/api/v1/employees/{employeeId}/certifications` | Add certification | Requires expiry date |
| GET | `/api/v1/training/matrix` | Get training requirements matrix | Filter by role/department |
| PUT | `/api/v1/training/matrix/{roleId}` | Update role training requirements | Versioned change |
| POST | `/api/v1/training/completions` | Record training completion | Evidence attachment optional/required by rule |
| GET | `/api/v1/training/gaps` | List training gaps | Supports overdue filter |

## Vendor and Contractor APIs

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| GET | `/api/v1/vendors` | List vendors | Filter by status, trade, expiry |
| POST | `/api/v1/vendors` | Create vendor profile | Starts onboarding |
| GET | `/api/v1/vendors/{vendorId}` | Get vendor profile | Includes compliance status |
| PATCH | `/api/v1/vendors/{vendorId}` | Update vendor profile | Procurement/Compliance |
| POST | `/api/v1/vendors/{vendorId}/documents` | Upload vendor document | Multipart upload |
| POST | `/api/v1/vendors/{vendorId}/documents/{documentId}/review` | Approve/reject document | Requires reviewer comment on rejection |
| GET | `/api/v1/vendor-standards` | List vendor compliance standards | Versioned |
| POST | `/api/v1/vendor-standards` | Create compliance standard | Compliance Manager |
| GET | `/api/v1/vendors/{vendorId}/history` | Vendor compliance history | Immutable timeline |

## Asset APIs

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| GET | `/api/v1/assets` | List asset register | Search by ID, location, category |
| POST | `/api/v1/assets` | Register asset | Generates unique asset ID |
| GET | `/api/v1/assets/{assetId}` | Get asset detail | Includes compliance status |
| PATCH | `/api/v1/assets/{assetId}` | Update asset metadata | Maintenance/Admin |
| GET | `/api/v1/assets/{assetId}/inspections` | Inspection history | Auditor view |
| POST | `/api/v1/assets/{assetId}/inspections` | Record inspection | Evidence supported |
| GET | `/api/v1/asset-compliance-rules` | Compliance rules by category | Used for auto-scheduling |
| PUT | `/api/v1/asset-compliance-rules/{ruleId}` | Update compliance rule | Applies to category |

## Permit APIs

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| GET | `/api/v1/permits` | List permits | Filter by status, zone, type, date |
| POST | `/api/v1/permits` | Create permit request | Starts workflow |
| GET | `/api/v1/permits/{permitId}` | Permit detail | Includes SOP, RA, asset, approvals |
| PATCH | `/api/v1/permits/{permitId}` | Update draft permit | Draft/requester only |
| POST | `/api/v1/permits/{permitId}/submit` | Submit permit | Validates required controls |
| POST | `/api/v1/permits/{permitId}/approve` | Approve permit | Records approver, timestamp, optional GPS |
| POST | `/api/v1/permits/{permitId}/reject` | Reject permit | Comment required |
| GET | `/api/v1/permits/{permitId}/conflicts` | Check concurrent work conflicts | Same zone/equipment |
| POST | `/api/v1/permits/{permitId}/override-conflict` | Override conflict | Senior approval required |
| POST | `/api/v1/permits/{permitId}/extend` | Request extension | Reapproval required |
| POST | `/api/v1/permits/{permitId}/close` | Close permit | Evidence required by rule |
| GET | `/api/v1/permits/{permitId}/audit-trail` | Permit event timeline | Immutable |

## Audit, CAPA, Risk, and Incident APIs

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| GET | `/api/v1/audit-checklists` | List checklist versions | Filter by standard/status |
| POST | `/api/v1/audit-checklists` | Create checklist | Draft |
| POST | `/api/v1/audit-checklists/{checklistId}/publish` | Publish checklist version | Locks version |
| POST | `/api/v1/audits` | Create audit execution | Based on published checklist |
| GET | `/api/v1/audits/{auditId}` | Audit detail | Includes progress and findings |
| POST | `/api/v1/audits/{auditId}/findings` | Create finding | May generate CAPA |
| GET | `/api/v1/capas` | List CAPAs | Filter by owner/status/overdue |
| POST | `/api/v1/capas/{capaId}/submit-closure` | Submit closure evidence | Owner action |
| POST | `/api/v1/capas/{capaId}/approve-closure` | Approve closure | Manager action |
| GET | `/api/v1/risks/assessments` | List risk assessments | Filter by task/location/asset |
| POST | `/api/v1/risks/assessments` | Create risk assessment | Calculates residual risk |
| GET | `/api/v1/hazards` | List hazard observations | Filter by severity/status |
| GET | `/api/v1/incidents` | List incidents | Record-level access enforced |
| POST | `/api/v1/incidents/{incidentId}/classify` | Classify incident | Triggers escalation |
| POST | `/api/v1/incidents/{incidentId}/investigations` | Start investigation | Investigation Lead |

## Report and Export APIs

| Method | Endpoint | Purpose | Output |
|---|---|---|---|
| POST | `/api/v1/reports/permits/export` | Export permit audit trails | PDF/Excel |
| POST | `/api/v1/reports/audits/export` | Export audit report | PDF |
| POST | `/api/v1/reports/capas/export` | Export CAPA register | Excel/PDF |
| POST | `/api/v1/reports/incidents/export` | Export incident analytics | PDF/PPTX |
| POST | `/api/v1/reports/vendors/export` | Export vendor compliance history | PDF |
| POST | `/api/v1/reports/assets/export` | Export asset compliance | Excel/PDF |
| POST | `/api/v1/reports/training/export` | Export training compliance | Excel/PDF |
