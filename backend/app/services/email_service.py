import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send"


def _post_to_sendgrid(payload: dict) -> bool:
    """Send a single payload to SendGrid. Returns True on success."""
    if not settings.sendgrid_api_key:
        logger.warning("[email] SENDGRID_API_KEY not configured — email skipped")
        return False
    try:
        with httpx.Client(timeout=15, verify=False) as client:
            response = client.post(
                SENDGRID_API_URL,
                json=payload,
                headers={
                    "Authorization": f"Bearer {settings.sendgrid_api_key}",
                    "Content-Type": "application/json",
                },
            )
        print(f"[SendGrid] status={response.status_code} body={response.text[:500]}", flush=True)
        if response.status_code in (200, 202):
            logger.info("[email] Email sent — status %s", response.status_code)
            return True
        logger.error("[email] SendGrid rejected — %s: %s", response.status_code, response.text)
        return False
    except Exception as exc:
        print(f"[SendGrid] EXCEPTION: {exc}", flush=True)
        logger.error("[email] Failed to send email: %s", exc)
        return False


def send_user_invitation_email(
    *,
    user_email: str,
    user_name: str,
    role: str,
    site: str,
    password: str,
) -> bool:
    """Send an invitation email to an HSE Manager or team member with their login credentials."""
    if not settings.sendgrid_api_key:
        logger.warning("[email] SENDGRID_API_KEY not configured — user invitation email skipped for %s", user_email)
        return False

    login_url = f"{settings.frontend_base_url}/auth/login"

    html_body = f"""
    <div style="font-family:Arial,sans-serif;max-width:580px;margin:auto;padding:32px;background:#F3F7FF;border-radius:12px;">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#4A57B9,#6F80E8);padding:28px 24px;border-radius:10px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:-0.3px;">You have been invited to HSE Platform</h1>
        <p style="color:#c7d0ff;margin:6px 0 0;font-size:13px;">Your account is ready</p>
      </div>

      <!-- Body -->
      <div style="background:#ffffff;padding:32px 28px;border-radius:10px;margin-top:12px;">
        <p style="color:#374151;font-size:15px;margin-top:0;">Hello <strong>{user_name}</strong>,</p>
        <p style="color:#374151;font-size:14px;line-height:1.6;">
          You have been added as <strong>{role}</strong>
          {f'for site <strong>{site}</strong>' if site else ''}
          on the HSE Platform. Your account is active and ready to use.
        </p>

        <!-- Role badge -->
        <div style="text-align:center;margin:16px 0;">
          <span style="background:#EEF2FF;color:#4338CA;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:700;">{role}</span>
          {f'<span style="margin-left:8px;background:#FEF3C7;color:#92400E;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:700;">{site}</span>' if site else ''}
        </div>

        <!-- Credentials box -->
        <div style="background:#F8FAFF;border:1.5px solid #C7D2F6;border-radius:10px;padding:20px 24px;margin:24px 0;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6B7280;">Your Login Credentials</p>
          <table style="width:100%;border-collapse:collapse;margin-top:12px;">
            <tr>
              <td style="padding:8px 0;font-size:13px;color:#6B7280;width:90px;font-weight:600;">Email</td>
              <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:700;">{user_email}</td>
            </tr>
            <tr style="border-top:1px solid #E9EEF8;">
              <td style="padding:8px 0;font-size:13px;color:#6B7280;font-weight:600;">Password</td>
              <td style="padding:8px 0;font-size:16px;color:#4A57B9;font-weight:700;letter-spacing:1px;font-family:monospace;">{password}</td>
            </tr>
          </table>
        </div>

        <!-- CTA -->
        <div style="text-align:center;margin:28px 0 20px;">
          <a href="{login_url}"
             style="background:linear-gradient(135deg,#4A57B9,#6F80E8);color:#fff;padding:13px 32px;
                    border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
            Login to HSE Platform
          </a>
        </div>

        <p style="color:#9CA3AF;font-size:12px;text-align:center;margin-bottom:0;">
          If the button doesn't work, visit:
          <a href="{login_url}" style="color:#4A57B9;">{login_url}</a>
        </p>
      </div>

      <!-- Footer -->
      <div style="padding:16px 4px 0;text-align:center;">
        <p style="color:#9CA3AF;font-size:11px;margin:0;">
          We recommend changing your password after your first login.<br/>
          If you did not expect this invitation, please ignore this email.
        </p>
      </div>
    </div>
    """

    payload = {
        "personalizations": [{"to": [{"email": user_email}]}],
        "from": {"email": settings.sendgrid_from_email, "name": settings.sendgrid_from_name},
        "subject": f"You're invited to HSE Platform as {role}",
        "content": [{"type": "text/html", "value": html_body}],
    }
    return _post_to_sendgrid(payload)


def send_invitation_email(
    *,
    admin_email: str,
    admin_name: str,
    org_name: str,
    token: str,
    password: str,
) -> bool:
    """Send an org onboarding invitation with login credentials via SendGrid."""
    if not settings.sendgrid_api_key:
        logger.warning("[email] SENDGRID_API_KEY not configured — invitation email skipped for %s", admin_email)
        return False

    login_url = f"{settings.frontend_base_url}/auth/login"

    html_body = f"""
    <div style="font-family:Arial,sans-serif;max-width:580px;margin:auto;padding:32px;background:#F3F7FF;border-radius:12px;">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#4A57B9,#6F80E8);padding:28px 24px;border-radius:10px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:-0.3px;">Welcome to HSE Platform</h1>
        <p style="color:#c7d0ff;margin:6px 0 0;font-size:13px;">Your organisation has been set up</p>
      </div>

      <!-- Body -->
      <div style="background:#ffffff;padding:32px 28px;border-radius:10px;margin-top:12px;">
        <p style="color:#374151;font-size:15px;margin-top:0;">Hello <strong>{admin_name}</strong>,</p>
        <p style="color:#374151;font-size:14px;line-height:1.6;">
          You have been invited as the <strong>Organisation Admin</strong> for
          <strong>{org_name}</strong> on the HSE Platform.
          Your account has been created and you can log in immediately using the credentials below.
        </p>

        <!-- Credentials box -->
        <div style="background:#F8FAFF;border:1.5px solid #C7D2F6;border-radius:10px;padding:20px 24px;margin:24px 0;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6B7280;">Your Login Credentials</p>
          <table style="width:100%;border-collapse:collapse;margin-top:12px;">
            <tr>
              <td style="padding:8px 0;font-size:13px;color:#6B7280;width:90px;font-weight:600;">Email</td>
              <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:700;">{admin_email}</td>
            </tr>
            <tr style="border-top:1px solid #E9EEF8;">
              <td style="padding:8px 0;font-size:13px;color:#6B7280;font-weight:600;">Password</td>
              <td style="padding:8px 0;font-size:16px;color:#4A57B9;font-weight:700;letter-spacing:1px;font-family:monospace;">{password}</td>
            </tr>
          </table>
        </div>

        <!-- CTA -->
        <div style="text-align:center;margin:28px 0 20px;">
          <a href="{login_url}"
             style="background:linear-gradient(135deg,#4A57B9,#6F80E8);color:#fff;padding:13px 32px;
                    border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;letter-spacing:0.2px;">
            Accept Invitation
          </a>
        </div>

        <p style="color:#9CA3AF;font-size:12px;text-align:center;margin-bottom:0;">
          If the button doesn't work, visit:
          <a href="{login_url}" style="color:#4A57B9;">{login_url}</a>
        </p>
      </div>

      <!-- Footer -->
      <div style="padding:16px 4px 0;text-align:center;">
        <p style="color:#9CA3AF;font-size:11px;margin:0;">
          We recommend changing your password after your first login.<br/>
          This invitation expires in 7 days. If you did not request this, please ignore this email.
        </p>
      </div>
    </div>
    """

    payload = {
        "personalizations": [{"to": [{"email": admin_email}]}],
        "from": {"email": settings.sendgrid_from_email, "name": settings.sendgrid_from_name},
        "subject": f"Your HSE Platform account is ready — {org_name}",
        "content": [{"type": "text/html", "value": html_body}],
    }

    return _post_to_sendgrid(payload)
