# API Specification Document

*HSE Safety, Compliance & Intelligence Platform*

Generated on 2026-05-17 from source: HSE_Epics_UserStories_FreightFlexStyle.docx

## Document Control

Version: 1.0

Status: Draft for review

Owner: Project Manager / Product Owner

Source baseline: HSE epics and user stories in HSE_Epics_UserStories_FreightFlexStyle.docx

Review cycle: Business, HSE, IT, Security, Compliance, and Operations review before approval.

## API Style

Use REST or a documented equivalent API style with JSON payloads, versioned endpoints, standard error format, pagination, filtering, sorting, idempotency where needed, and correlation IDs.

## Endpoint Groups

/auth, /organisations, /users, /roles, /employees, /training, /vendors, /assets, /compliance, /audits, /capa, /risks, /hazards, /permits, /incidents, /investigations, /knowledge, /ai, /notifications, /reports, /audit-logs.

Detailed endpoint tables are maintained outside the project document pack in the [API Catalog](../../api_catalog/README.md), separated into web, mobile, admin, integration, AI, and shared platform API folders.

## API Catalog Folders

| Folder | Purpose |
|---|---|
| [Web APIs](../../api_catalog/01_Web_APIs/README.md) | Dashboard, operational workflow, report, and export endpoints for the web app |
| [Mobile APIs](../../api_catalog/02_Mobile_APIs/README.md) | Offline-capable mobile, field reporting, QR scan, permit, audit, and SOP endpoints |
| [Admin APIs](../../api_catalog/03_Admin_APIs/README.md) | Tenant, organisation, user, role, SSO, configuration, and data quality endpoints |
| [Integration APIs](../../api_catalog/04_Integration_APIs/README.md) | HR, ERP, asset, vendor, notification, document, and webhook endpoints |
| [AI APIs](../../api_catalog/05_AI_APIs/README.md) | AI advisor, knowledge retrieval, predictive risk, insights, and briefing endpoints |
| [Shared Platform APIs](../../api_catalog/06_Shared_Platform_APIs/README.md) | Auth, files, notifications, search, reports, audit logs, health, and observability endpoints |

## Security

OAuth2/OIDC bearer tokens or approved enterprise equivalent.

Endpoint-level authorization checks against tenant, role, permission, and record sensitivity.

Rate limiting and request validation on public or mobile endpoints.

Audit log for all create, update, approve, reject, export, and confidential view actions.

## Example Operations

POST /permits creates a permit request and starts workflow.

POST /permits/{id}/approve records approval decision.

POST /incidents submits an incident or near miss.

POST /audits/{id}/findings creates finding and may generate CAPA.

GET /knowledge/search returns governed SOP and policy results.

POST /ai/advisor/query returns source-cited answer from approved knowledge.

## Visuals

### API Request Pattern

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant Auth
    participant Service
    participant Database
    participant Audit
    Client->>Gateway: API request with token
    Gateway->>Auth: Validate token and permissions
    Auth-->>Gateway: Claims and access decision
    Gateway->>Service: Forward authorised request
    Service->>Database: Read / write domain data
    Service->>Audit: Record auditable action
    Service-->>Gateway: Response
    Gateway-->>Client: JSON result / error
```
