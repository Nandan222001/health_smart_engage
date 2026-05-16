# User Requirement Document (URD)

*HSE Safety, Compliance & Intelligence Platform*

Generated on 2026-05-17 from source: HSE_Epics_UserStories_FreightFlexStyle.docx

## Document Control

Version: 1.0

Status: Draft for review

Owner: Project Manager / Product Owner

Source baseline: HSE epics and user stories in HSE_Epics_UserStories_FreightFlexStyle.docx

Review cycle: Business, HSE, IT, Security, Compliance, and Operations review before approval.

## User Groups

Executive Sponsor: requires role-appropriate access, clear task queues, dashboards, alerts, and export capability.

Project Manager: requires role-appropriate access, clear task queues, dashboards, alerts, and export capability.

Product Owner: requires role-appropriate access, clear task queues, dashboards, alerts, and export capability.

Safety Manager: requires role-appropriate access, clear task queues, dashboards, alerts, and export capability.

Compliance Manager: requires role-appropriate access, clear task queues, dashboards, alerts, and export capability.

Plant Manager: requires role-appropriate access, clear task queues, dashboards, alerts, and export capability.

IT Admin: requires role-appropriate access, clear task queues, dashboards, alerts, and export capability.

HR Admin: requires role-appropriate access, clear task queues, dashboards, alerts, and export capability.

Procurement Manager: requires role-appropriate access, clear task queues, dashboards, alerts, and export capability.

Maintenance Manager: requires role-appropriate access, clear task queues, dashboards, alerts, and export capability.

Permit Coordinator: requires role-appropriate access, clear task queues, dashboards, alerts, and export capability.

Safety Auditor: requires role-appropriate access, clear task queues, dashboards, alerts, and export capability.

CAPA Owner: requires role-appropriate access, clear task queues, dashboards, alerts, and export capability.

Document Controller: requires role-appropriate access, clear task queues, dashboards, alerts, and export capability.

Employee: requires role-appropriate access, clear task queues, dashboards, alerts, and export capability.

Vendor/Contractor: requires role-appropriate access, clear task queues, dashboards, alerts, and export capability.

Gate Security Officer: requires role-appropriate access, clear task queues, dashboards, alerts, and export capability.

Legal/HR Officer: requires role-appropriate access, clear task queues, dashboards, alerts, and export capability.

## User Needs

Employees need fast mobile reporting for incidents, near misses, hazards, and SOP access.

Managers need dashboards, escalations, approvals, and exception handling.

Auditors need immutable evidence, checklist execution, ISO clause mapping, and exportable reports.

Admins need configurable structures, roles, permissions, workflows, and master data controls.

## Usability Requirements

Mobile forms must be concise and usable in field conditions.

Critical status must use clear visual indicators and explanatory reasons.

Users must see assigned tasks, overdue work, and pending approvals without manual searching.

Offline-capable workflows must clearly show sync state.

## Visuals

### User Journey Overview

```mermaid
journey
    title Field Safety User Journey
    section Start Work
      View assigned tasks: 4: Employee
      Open relevant SOP: 4: Employee
      Confirm permit status: 5: Employee, Permit Holder
    section Execute Safely
      Report hazard or near miss: 5: Employee
      Capture photo evidence: 4: Employee
      Receive safety alert: 4: Employee
    section Close Loop
      Complete action: 4: CAPA Owner
      Manager approval: 3: Manager
      Dashboard updated: 5: Safety Manager
```

## Role Coverage and Access Summary

The platform covers the following role families:

- Executive and governance roles
- Platform and IT administration roles
- HSE, safety, compliance, audit, and CAPA roles
- Plant, maintenance, permit, and operational management roles
- HR, training, procurement, vendor, and contractor roles
- Employee self-service and field reporting roles
- Gate security and confidential incident review roles

Detailed access is maintained in [Application Screen, Role, Dashboard, Mobile, and Data Flow Inventory](../06_Application_Inventory/23_Application_Screen_Role_DataFlow_Inventory.md).

### Role Coverage Map

```mermaid
flowchart TD
    Roles[All User Roles] --> Governance[Executive / PM / Product]
    Roles --> Admin[System Admin / IT Admin]
    Roles --> HSE[Safety / Compliance / Auditor / CAPA]
    Roles --> Operations[Plant / Maintenance / Permit]
    Roles --> Workforce[HR / Training / Employee]
    Roles --> External[Vendors / Contractors / Gate Security]
    Roles --> Sensitive[Legal / HR Confidential Access]
```
