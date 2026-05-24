"""
Email delivery service.

Priority:
  1. SendGrid  — when SENDGRID_API_KEY is set in env
  2. SMTP      — fallback using SMTP_HOST / SMTP_USER / SMTP_PASSWORD

Both paths share the same public interface: send_email().
If neither backend is configured the call is a no-op and a warning is logged.
"""

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


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
    # SendGrid
    # ------------------------------------------------------------------

    def _send_via_sendgrid(
        self,
        recipients: list[str],
        subject: str,
        html_body: str,
        text_body: str | None,
    ) -> dict:
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail, Content, To

            from_email = (
                f"{settings.sendgrid_from_name} <{settings.sendgrid_from_email}>"
                if settings.sendgrid_from_name
                else settings.sendgrid_from_email
            )

            message = Mail(from_email=from_email, subject=subject)
            message.to = [To(r) for r in recipients]
            message.content = [Content("text/html", html_body)]
            if text_body:
                message.content.insert(0, Content("text/plain", text_body))

            sg = SendGridAPIClient(settings.sendgrid_api_key)
            response = sg.send(message)
            logger.info("SendGrid email sent status=%s subject=%s", response.status_code, subject)
            return {"status": "sent", "provider": "sendgrid", "status_code": response.status_code}
        except Exception as exc:
            logger.error("SendGrid send failed: %s", exc)
            return {"status": "error", "provider": "sendgrid", "error": str(exc)}

    # ------------------------------------------------------------------
    # SMTP
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
            f"{settings.smtp_from_name} <{from_email}>"
            if settings.smtp_from_name
            else from_email
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
