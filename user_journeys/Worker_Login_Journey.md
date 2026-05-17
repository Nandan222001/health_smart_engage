# User Journey: Field Worker Login

This document details the sequence of screens and interactions a Field Worker encounters when logging into the HSE Mobile App.

**Total Screens: 5**

---

## Screen 1: Welcome & Branding (Splash)
*   **Purpose:** Initial app entry and brand recognition.
*   **Content:**
    *   Company Logo (HSE Platform).
    *   Version Number.
    *   "Secure Login" indicator.
*   **User Action:** Automatic transition or "Get Started" button.

## Screen 2: Login Method Selection
*   **Purpose:** Choose how to authenticate.
*   **Content:**
    *   "Sign in with Corporate Account" (Primary - SSO).
    *   "Sign in with Email" (Secondary - Fallback).
    *   Privacy Policy & Terms of Service links.
*   **User Action:** Tap "Sign in with Corporate Account".

## Screen 3: Corporate Authentication (SSO Page)
*   **Note:** This screen is often hosted by the corporate Identity Provider (e.g., Microsoft Azure AD, Okta).
*   **Purpose:** Secure credential entry.
*   **Content:**
    *   Corporate email input field.
    *   Password input field.
    *   Multi-Factor Authentication (MFA) prompt (if enabled).
*   **User Action:** Enter credentials and approve MFA.

## Screen 4: Site & Context Selection
*   **Note:** Only shown if the worker has access to multiple sites or organisations.
*   **Purpose:** Set the operational context for the session.
*   **Content:**
    *   "Select Your Site" dropdown or list.
    *   Search bar for sites.
    *   "Remember my selection" checkbox.
*   **User Action:** Select current site (e.g., "Main Plant - South") and tap "Confirm".

## Screen 5: Mobile Home Dashboard (Landing)
*   **Purpose:** The main operational hub for the worker.
*   **Content:**
    *   **Greeting:** "Hello, [Name]".
    *   **Status Indicator:** "Safe Day" or "High Risk Alert" (AI driven).
    *   **Quick Actions:** Report Incident, Scan QR, My Tasks (3).
    *   **Bottom Navigation:** Home, SOPs, Permits, Profile.
*   **User Action:** Begin field work or check assigned tasks.

---

### Backend "Stitch" during this Journey:
1.  **Screen 2 -> 3**: App redirects to `/api/v1/auth/sso/{provider}/start`.
2.  **Screen 3 -> 4**: Callback to `/api/v1/auth/sso/callback` validates token and fetches user roles/claims.
3.  **Screen 4 -> 5**: Session established with `tenant_id` and `site_id` in the bearer token claims.
