# User Journey: Safety Manager

This document details the operational management journey for a Safety Manager on the Web Platform.

**Total Screens: 6**

---

## Screen 1: Web Login Portal
*   **Purpose:** Secure entry to the command center.
*   **Content:** Company branding, "SSO Login" button.
*   **Action:** Click "SSO Login".

## Screen 2: Corporate Authentication
*   **Note:** Handled by corporate IdP.
*   **Action:** Enter credentials/MFA.

## Screen 3: Site HSE Command Dashboard (Landing)
*   **Purpose:** Review immediate site-level priorities.
*   **Content:** 
    *   **Live Metrics:** Active Permits (8), Pending Approvals (3), Open Hazards (5).
    *   **Critical Alerts:** High-severity incident reported in last 24h.
*   **Action:** Click on "Pending Approvals" to open the queue.

## Screen 4: Permit Review Queue
*   **Purpose:** Process permit requests to keep operations moving.
*   **Content:** List of submitted permits with risk indicators.
*   **Action:** Select a "Hot Work" permit for detail review.

## Screen 5: Permit Detail & Approval
*   **Purpose:** Verify safety controls and authorize work.
*   **Content:** Task info, Asset compliance status, Risk Assessment link.
*   **Action:** Enter approval comment and click "Approve".

## Screen 6: Incident Classification Workspace
*   **Purpose:** Categorize new incident reports.
*   **Content:** Worker's mobile report, Photos, Preliminary description.
*   **Action:** Set severity (e.g., "Moderate"), Assign an investigator.

---

### Backend "Stitch":
*   **Command Center**: `GET /api/v1/dashboards/site-command`
*   **Permit Queue**: `GET /api/v1/permits?status=submitted`
*   **Approve**: `POST /api/v1/permits/{id}/approve`
*   **Classify**: `POST /api/v1/incidents/{id}/classify`
