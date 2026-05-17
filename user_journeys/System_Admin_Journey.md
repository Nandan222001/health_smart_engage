# User Journey: System Administrator

This document details the platform governance journey for a System Administrator.

**Total Screens: 6**

---

## Screen 1: Web Login Portal
*   **Purpose:** Secure entry to the admin console.
*   **Content:** Company branding, "SSO Login" button.
*   **Action:** Click "SSO Login".

## Screen 2: Corporate Authentication
*   **Note:** Handled by corporate IdP.
*   **Action:** Enter credentials/MFA.

## Screen 3: Organisation Admin Dashboard (Landing)
*   **Purpose:** Monitor platform-wide health and activity.
*   **Content:** 
    *   **Tenant Summary:** Total tenants (12), Total active users (1,500).
    *   **Integration Status:** HR sync (Success), ERP sync (Failed - 2 records).
    *   **System Alerts:** SSO certificate expiring in 15 days.
*   **Action:** Click on "Tenant Setup" to configure a new site.

## Screen 4: Tenant and Organisation Setup
*   **Purpose:** Manage the organizational structure.
*   **Content:** Hierarchical tree of Plants, Departments, and Work Zones.
*   **Action:** Add a new "South Wing" zone to the "Main Plant".

## Screen 5: User Directory & Invitations
*   **Purpose:** Provision access for new personnel.
*   **Content:** List of users, roles, and last login dates.
*   **Action:** Tap "Invite User", enter email, and assign "Safety Manager" role.

## Screen 6: Audit Log Viewer
*   **Purpose:** Investigate system-wide changes for compliance.
*   **Content:** Filterable log of every API call (Who, What, When).
*   **Action:** Filter for "Role Changes" to verify recent access updates.

---

### Backend "Stitch":
*   **Admin Dashboard**: `GET /api/v1/admin/tenants` (Internal/System only)
*   **Org Setup**: `POST /api/v1/admin/organisation-nodes`
*   **User Invitation**: `POST /api/v1/admin/users/invitations`
*   **Audit Logs**: `GET /api/v1/admin/audit-logs`
