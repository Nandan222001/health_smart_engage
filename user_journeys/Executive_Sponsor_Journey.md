# User Journey: Executive Sponsor

This document details the strategic oversight journey for an Executive Sponsor on the Web Platform.

**Total Screens: 5**

---

## Screen 1: Web Login Portal
*   **Purpose:** Secure entry to the desktop platform.
*   **Content:** Company branding, "SSO Login" button.
*   **Action:** Click "SSO Login".

## Screen 2: Corporate Authentication
*   **Note:** Handled by corporate IdP (e.g., Azure AD).
*   **Purpose:** Authenticate and authorize.
*   **Action:** Enter credentials/MFA.

## Screen 3: Executive Safety Intelligence Dashboard (Landing)
*   **Purpose:** Immediate pulse-check of global safety performance.
*   **Content:** 
    *   **Global Safety Score** (Gauge chart).
    *   **Total Recordable Incident Rate (TRIR)** trend.
    *   **CAPA Closure Rate** (90-day avg).
    *   **AI predictive risk** alert for the week.
*   **Action:** Review global metrics, identify underperforming regions.

## Screen 4: AI Safety Intelligence Dashboard
*   **Purpose:** Deep dive into predictive insights.
*   **Content:** 
    *   **Predictive Risk Hotspots** (Map).
    *   **AI-Suggested Strategic Controls**.
    *   **Draft Weekly Safety Briefing**.
*   **Action:** Review and "Approve" the Weekly Safety Briefing.

## Screen 5: Compliance Scorecard & Export
*   **Purpose:** Verify regulatory standing for board reporting.
*   **Content:** ISO 45001/14001 status, Audit completion rates.
*   **Action:** Click "Export Executive Report" (PDF).

---

### Backend "Stitch":
*   **Landing**: `GET /api/v1/dashboards/executive-safety`
*   **AI Intelligence**: `GET /api/v1/dashboards/ai-intelligence`
*   **Export**: `POST /api/v1/reports/incidents/export`
