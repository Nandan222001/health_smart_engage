# HSE Safety, Compliance & Intelligence Platform

## Overview

This document summarizes the current backend process and available API routes for the HSE platform.

The current implementation supports the following workflow:

1. Super Admin logs in using `POST /api/v1/auth/super-admin/login`.
2. Super Admin creates a new organization using `POST /api/v1/auth/register`.
3. Organization Admin logs in using `POST /api/v1/auth/login`.
4. Organization Admin or Super Admin can create and manage organization details via `/api/v1/organization-details`.

## Roles and flow

- **Super Admin**
  - Platform owner and highest-level administrator.
  - Logs in with `super-admin/login`.
  - Creates new organizations and sets initial company details.
  - Can use the same organization details API if needed.

- **Organization Admin**
  - Created implicitly when Super Admin registers a new organization.
  - Uses `auth/login` to sign in.
  - Manages company sites, departments, and users.

- **Site HSE Manager / Supervisor / Worker**
  - These roles are planned as part of the platform flow.
  - The current backend is primarily focused on organization registration, authentication, and organization details.

## Current API routes

### Authentication

#### 1. Super Admin login

- URI: `POST /api/v1/auth/super-admin/login`
- Purpose: Authenticate the Super Admin and receive a bearer token.

Request body:
```json
{
  "email": "superadmin@example.com",
  "password": "SuperAdminPassword"
}
```

Success response contains:
- `access_token`
- `token_type`
- `user_type` = `super_admin`
- `email`
- `name`
- `expires_in`

---

#### 2. Register organization (Super Admin only)

- URI: `POST /api/v1/auth/register`
- Purpose: Super Admin creates a new organization and optionally stores initial organization details.
- Authentication: requires Super Admin bearer token.

Request headers:
- `Authorization: Bearer <token>`

Request body:
```json
{
  "email": "orgadmin@example.com",
  "password": "OrgAdminPassword123",
  "confirm_password": "OrgAdminPassword123",
  "organization_code": "ABC123",
  "name": "ABC Construction",
  "organization_name": "ABC Construction",
  "country": "USA",
  "industry_type": "Construction",
  "sites": 10,
  "logo_url": "https://example.com/logo.png"
}
```

Success response contains:
- `access_token`
- `token_type`
- `user_type` = `organization`
- `email`
- `organization_code`
- `organization_id`
- `expires_in`

---

#### 3. Organization Admin / user login

- URI: `POST /api/v1/auth/login`
- Purpose: Authenticate an organization admin or user account.

Request body:
```json
{
  "email": "orgadmin@example.com",
  "password": "OrgAdminPassword123"
}
```

Success response contains:
- `access_token`
- `token_type`
- `user_type` (`organization` or `user`)
- `email`
- `organization_code`
- `organization_id`
- `user_id` (for user login)
- `expires_in`

---

### Organization Details CRUD

All organization details routes require a bearer token.

#### 4. Create organization details

- URI: `POST /api/v1/organization-details`
- Purpose: Save detailed organization metadata and HSE settings.
- Authentication: Bearer token required.

Request body:
```json
{
  "organization_id": 123,
  "organization_name": "ABC Construction",
  "country": "USA",
  "industry_type": "Construction",
  "subscription_plan": "Enterprise",
  "governance_hierarchy": "Regional > Site > Team",
  "knowledgebase_data_upload": "Weekly",
  "certifications": ["ISO 45001", "ISO 9001"],
  "active_modules": ["Permits", "Inspections", "Audits"],
  "sites": 12,
  "zones": 5,
  "total_active_workers": 150,
  "admin_count": 3,
  "site_engineers": 4,
  "site_inspectors": 6,
  "workers": 120,
  "contractors": 30,
  "shift_pattern": "3-shift",
  "high_risk_work_categories": ["Working at height", "Confined space"],
  "permit_to_work": true,
  "daily_toolbox_talk": true,
  "onsite_clinic": false,
  "incident_frequency_rate": "0.5",
  "last_audit_date": "2026-05-10",
  "evacuation_drill_cadence": "Quarterly",
  "emergency_contact_name": "Jane Smith",
  "emergency_contact_phone": "+1-555-123-4567",
  "primary_admin_name": "John Doe",
  "admin_email": "john.doe@example.com",
  "admin_phone": "+1-555-987-6543",
  "admin_designation": "Safety Manager",
  "target_go_live_date": "2026-06-01",
  "integration_needs": "HR system, ERP",
  "training_plan": "Initial onboarding + monthly refreshers",
  "additional_notes": "Needs mobile app onboarding.",
  "logo_url": "https://example.com/logo.png",
  "plan_kpi_limit": "50",
  "kpi_selection": "Incident Rate, Audit Completion",
  "custom_kpi": "Near miss closure time",
  "critical_action_closure_sla_hours": 24,
  "standard_action_closure_sla_hours": 72,
  "kpi_reporting_cadence": "Monthly",
  "data_use_confirmed": true,
  "leadership_approved": true
}
```

---

#### 5. List organization details

- URI: `GET /api/v1/organization-details`
- Purpose: Retrieve paginated organization details.
- Query params:
  - `page` (default 1)
  - `pageSize` (default 25)
  - `organizationId` (optional filter)

Example:
`GET /api/v1/organization-details?page=1&pageSize=25&organizationId=123`

---

#### 6. Get one organization details record

- URI: `GET /api/v1/organization-details/{details_id}`

Example:
`GET /api/v1/organization-details/1`

---

#### 7. Update organization details

- URI: `PATCH /api/v1/organization-details/{details_id}`

Example body:
```json
{
  "subscription_plan": "Premium",
  "sites": 14,
  "training_plan": "Updated training schedule",
  "data_use_confirmed": true
}
```

---

#### 8. Soft delete organization details

- URI: `DELETE /api/v1/organization-details/{details_id}`

Deletes by setting `deleted_at`.

## Postman testing summary

### Base URL
`http://localhost:8000/api/v1`

### Required headers
- `Content-Type: application/json`
- `Authorization: Bearer <token>` for protected routes
- `X-Tenant-Id: <tenant-id>` only if your environment or middleware requires it

### Example flow

1. Super Admin login
2. Use `Authorization` token
3. Create organization with `auth/register`
4. Use returned token or login as organization admin with `auth/login`
5. Create or manage org details via `/organization-details`

## Notes

- `POST /api/v1/auth/register` is now protected by Super Admin only.
- `organization_id` in organization details must exist in the `organization` table.
- The current backend is built around organization registration, login, and organization details.
- Future steps include explicit user creation for Organization Admin, Site HSE Manager, Supervisor, and Worker roles.
