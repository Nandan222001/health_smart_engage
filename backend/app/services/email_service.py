"""
Email delivery service.

Provider priority (runtime, based on env config):
  1. SendGrid  — SENDGRID_API_KEY is set  → POST to SendGrid REST API via httpx
  2. SMTP      — SMTP_USER + SMTP_HOST set → smtplib STARTTLS / SSL
  3. Neither   → logs a warning, returns False / {status: skipped}
"""

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send"


class EmailService:
    """Sends transactional email via SendGrid or SMTP depending on env config."""

    def send_email(
        self,
        to: str | list[str],
        subject: str,
        html_body: str,
        text_body: str | None = None,
    ) -> dict:
        recipients = [to] if isinstance(to, str) else to
        if not recipients:
            return {"status": "skipped", "reason": "no recipients"}

        if settings.sendgrid_api_key:
            return self._send_via_sendgrid(recipients, subject, html_body, text_body)
        if settings.smtp_user and settings.smtp_host:
            return self._send_via_smtp(recipients, subject, html_body, text_body)

        logger.warning(
            "Email not sent — neither SENDGRID_API_KEY nor SMTP_USER is configured. "
            "subject=%s recipients=%s",
            subject,
            recipients,
        )
        return {"status": "skipped", "reason": "no mail provider configured"}

    # ------------------------------------------------------------------
    # SendGrid via httpx (no extra SDK dependency)
    # ------------------------------------------------------------------

    def _send_via_sendgrid(
        self,
        recipients: list[str],
        subject: str,
        html_body: str,
        text_body: str | None,
    ) -> dict:
        content = []
        if text_body:
            content.append({"type": "text/plain", "value": text_body})
        content.append({"type": "text/html", "value": html_body})

        payload = {
            "personalizations": [{"to": [{"email": r} for r in recipients]}],
            "from": {
                "email": settings.sendgrid_from_email,
                "name": settings.sendgrid_from_name,
            },
            "subject": subject,
            "content": content,
        }
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
            if response.status_code in (200, 202):
                logger.info("SendGrid email sent status=%s subject=%s", response.status_code, subject)
                return {"status": "sent", "provider": "sendgrid", "status_code": response.status_code}
            logger.error("SendGrid rejected email — %s: %s", response.status_code, response.text[:300])
            return {"status": "error", "provider": "sendgrid", "status_code": response.status_code}
        except Exception as exc:
            logger.error("SendGrid send failed: %s", exc)
            return {"status": "error", "provider": "sendgrid", "error": str(exc)}

    # ------------------------------------------------------------------
    # SMTP fallback
    # ------------------------------------------------------------------

    def _send_via_smtp(
        self,
        recipients: list[str],
        subject: str,
        html_body: str,
        text_body: str | None,
    ) -> dict:
        from_email = settings.smtp_from_email or settings.smtp_user
        from_display = (
            f"{settings.smtp_from_name} <{from_email}>" if settings.smtp_from_name else from_email
        )
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = from_display
            msg["To"] = ", ".join(recipients)
            if text_body:
                msg.attach(MIMEText(text_body, "plain", "utf-8"))
            msg.attach(MIMEText(html_body, "html", "utf-8"))

            if settings.smtp_use_tls:
                server = smtplib.SMTP(settings.smtp_host, settings.smtp_port)
                server.ehlo()
                server.starttls()
                server.ehlo()
            else:
                server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port)

            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(from_email, recipients, msg.as_string())
            server.quit()

            logger.info("SMTP email sent subject=%s recipients=%s", subject, recipients)
            return {"status": "sent", "provider": "smtp"}
        except Exception as exc:
            logger.error("SMTP send failed: %s", exc)
            return {"status": "error", "provider": "smtp", "error": str(exc)}


_email_service = EmailService()


def get_email_service() -> EmailService:
    return _email_service


# ---------------------------------------------------------------------------
# Convenience wrapper — used by InvitationService
# ---------------------------------------------------------------------------

def send_invitation_email(
    *,
    admin_email: str,
    admin_name: str,
    org_name: str,
    token: str,
    password: str,
) -> bool:
    """Send a branded onboarding invitation with login credentials."""
    login_url = f"{settings.frontend_base_url}/auth/login"

    html_body = f"""
    <div style="font-family:Arial,sans-serif;max-width:580px;margin:auto;padding:32px;background:#F3F7FF;border-radius:12px;">
      <div style="background:linear-gradient(135deg,#4A57B9,#6F80E8);padding:28px 24px;border-radius:10px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:-0.3px;">Welcome to HSE Platform</h1>
        <p style="color:#c7d0ff;margin:6px 0 0;font-size:13px;">Your organisation has been set up</p>
      </div>
      <div style="background:#ffffff;padding:32px 28px;border-radius:10px;margin-top:12px;">
        <p style="color:#374151;font-size:15px;margin-top:0;">Hello <strong>{admin_name}</strong>,</p>
        <p style="color:#374151;font-size:14px;line-height:1.6;">
          You have been invited as the <strong>Organisation Admin</strong> for
          <strong>{org_name}</strong> on the HSE Platform.
          Your account has been created and you can log in immediately using the credentials below.
        </p>
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
        <div style="text-align:center;margin:28px 0 20px;">
          <a href="{login_url}"
             style="background:linear-gradient(135deg,#4A57B9,#6F80E8);color:#fff;padding:13px 32px;
                    border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
            Log In Now
          </a>
        </div>
        <p style="color:#9CA3AF;font-size:12px;text-align:center;margin-bottom:0;">
          If the button doesn't work, visit:
          <a href="{login_url}" style="color:#4A57B9;">{login_url}</a>
        </p>
      </div>
      <div style="padding:16px 4px 0;text-align:center;">
        <p style="color:#9CA3AF;font-size:11px;margin:0;">
          We recommend changing your password after your first login.<br/>
          This invitation expires in 7 days.
        </p>
      </div>
    </div>
    """

    text_body = (
        f"Hi {admin_name},\n\n"
        f"You have been invited as Organisation Admin for {org_name} on the HSE Platform.\n\n"
        f"Email:    {admin_email}\n"
        f"Password: {password}\n\n"
        f"Log in at: {login_url}\n\n"
        "We recommend changing your password after your first login.\n"
    )

    result = _email_service.send_email(
        to=admin_email,
        subject=f"Your HSE Platform account is ready — {org_name}",
        html_body=html_body,
        text_body=text_body,
    )
    return result.get("status") == "sent"
