# User Invitation & Onboarding Flow

> Health Smart Engage is an enterprise platform. There is no public self-registration.
> New users are invited by a System Administrator via email invitation.

## Invitation Flow (Admin Side)

```mermaid
flowchart TD
    ADMIN([System Administrator]) --> USER_DIR[Open User Directory\nWeb Admin Console]
    USER_DIR --> INVITE_BTN[Click Invite User]
    INVITE_BTN --> INVITE_FORM[Fill Invitation Form\nEmail · Name · Role · Site]
    INVITE_FORM --> ROLE_SEL[Select Role\nField Worker / Safety Manager /\nGate Security / Executive / Admin]
    ROLE_SEL --> SITE_SEL[Assign Site/s]
    SITE_SEL --> SEND_INVITE[POST /admin/users/invitations\nInvitation email dispatched]
    SEND_INVITE --> PENDING[User appears as PENDING\nin User Directory]
    PENDING --> WATCH{User\nAccepts?}
    WATCH -->|Yes, within expiry| ACTIVE_USER[User status - ACTIVE\nAdmin notified]
    WATCH -->|Invitation expired| RESEND{Resend\nInvitation?}
    RESEND -->|Yes| SEND_INVITE
    RESEND -->|No| REVOKE[Keep as PENDING\nor Revoke]
```

---

## Onboarding Flow (New User Side)

```mermaid
flowchart TD
    EMAIL([New User receives\nInvitation Email]) --> LINK[Click Invitation Link\n- time-limited token -]
    LINK --> TOKEN_VALID{Link\nValid & Not Expired?}
    TOKEN_VALID -->|No| EXPIRED_PAGE[Show Expired Page\nContact your Administrator]
    TOKEN_VALID -->|Yes| ONBOARD_PAGE[Onboarding Screen\nWelcome message · Name pre-filled]

    ONBOARD_PAGE --> AUTH_METHOD{Organisation\nAuth Method}

    AUTH_METHOD -->|Email + Password| SET_PWD[Set Password\nConfirm Password\nPassword strength check]
    SET_PWD --> PWD_VALID{Password\nMeets Policy?}
    PWD_VALID -->|No| SET_PWD
    PWD_VALID -->|Yes| PROFILE_SETUP

    AUTH_METHOD -->|SSO Only| SSO_PROMPT[Redirected to SSO Provider\nSign in with corporate account]
    SSO_PROMPT --> SSO_MATCH{Email matches\ninvitation?}
    SSO_MATCH -->|No| MISMATCH[Show Error\nEmail mismatch]
    SSO_MATCH -->|Yes| PROFILE_SETUP

    PROFILE_SETUP[Complete Profile\nPhone · Department · Job Title]
    PROFILE_SETUP --> MFA_SETUP{MFA\nRequired for Role?}
    MFA_SETUP -->|Yes| MFA_ENROL[Enrol MFA\nScan QR with Authenticator App\nVerify with OTP]
    MFA_ENROL --> ACCEPT_TERMS
    MFA_SETUP -->|No| ACCEPT_TERMS

    ACCEPT_TERMS[Accept Terms of Use\n& Privacy Policy]
    ACCEPT_TERMS --> SUBMIT[Submit Onboarding]
    SUBMIT --> ACTIVATE[Account ACTIVATED\nPATCH /admin/users/:userId/roles applied]
    ACTIVATE --> LOGIN_REDIRECT[Redirect to Login Screen]
    LOGIN_REDIRECT --> FIRST_LOGIN[First Login\nsee Login Flow]
```

---

## Admin: Revoke / Deactivate User Flow

```mermaid
flowchart TD
    ADMIN([Administrator]) --> USER_PROFILE[Open User Profile\nUser Directory]
    USER_PROFILE --> REVOKE_BTN[Click Revoke Access]
    REVOKE_BTN --> CONFIRM{Confirm\nRevocation?}
    CONFIRM -->|Cancel| USER_PROFILE
    CONFIRM -->|Confirm| POST_REVOKE[POST /admin/users/:userId/revoke]
    POST_REVOKE --> STATUS_CHANGE[User status - REVOKED\nAll active sessions invalidated\nUser cannot log in]
    STATUS_CHANGE --> AUDIT_LOG[Audit log entry created]
```

---

## Role Assignment Flow

```mermaid
flowchart TD
    ADMIN([Administrator]) --> OPEN_USER[Open User Profile]
    OPEN_USER --> ROLES_TAB[Go to Roles & Permissions Tab]
    ROLES_TAB --> ASSIGN[Select Role/s to Assign\nPATCH /admin/users/:userId/roles]
    ASSIGN --> PERMS_APPLIED[Permissions from Role applied immediately\nNext request by user uses new permissions]
    PERMS_APPLIED --> NOTIFY_USER[Optional: Notify user of role change]
```
