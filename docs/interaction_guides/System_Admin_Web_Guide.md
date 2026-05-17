# Interaction Guide: System Administrator (Governance Console)

This guide details the technical and administrative interactions for platform governance.

---

## Screen 1: Organisation Admin Dashboard
**Technical health and tenant monitoring.**

### UI Elements & Interactions
| Element | UI Type | Action | Destination / Result |
| :--- | :--- | :--- | :--- |
| **Tenant Stats Card** | Summary Card | Click | Navigates to `Tenant Management` |
| **Integration Health**| Status List | Hover | Shows timestamp of last successful sync with HR/ERP |
| **"System Alert"** | Alert Banner | Click | Opens `System Settings` to address expiring SSL/SSO |
| **"New Tenant"** | Button | Click | Opens `Tenant Creation` wizard |

---

## Screen 2: User Directory & RBAC Builder
**Identity and access management.**

### UI Elements & Interactions
| Element | UI Type | Action | Destination / Result |
| :--- | :--- | :--- | :--- |
| **User Search** | Input | Typing | Instant search of users by email, name, or role |
| **"Revoke Access"** | Red Button | Click | Disables user account and kills active sessions |
| **Permission Grid** | Matrix | Toggle | Enables/Disables specific API permissions for a role |
| **"Invite User"** | Action Button | Click | Opens `User Invitation` modal |

---

## Screen 3: Audit Log & Forensic Viewer
**Tracing system-wide changes.**

### UI Elements & Interactions
| Element | UI Type | Action | Destination / Result |
| :--- | :--- | :--- | :--- |
| **Date Range Picker** | Date Selector | Select | Filters logs by specific time period |
| **"JSON" Button** | Icon | Click | Expands the raw API request/response payload for forensic review |
| **"Export Trail"** | Button | Click | Exports filtered logs as an immutable CSV for compliance |
| **Filter by User** | Search/Tag | Selection | Shows all actions performed by a specific user |
