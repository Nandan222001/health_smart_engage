from app.helpers.datetime import utc_now_iso
from sqlalchemy.orm import Session
from app.core.security import CurrentUser
from app.services.email_service import get_email_service


class NotificationService:
    def __init__(self, db: Session = None):
        self.db = db
        self._email = get_email_service()

    def send(self, template_key: str, recipients: list[str], context: dict) -> dict:
        return {
            "templateKey": template_key,
            "recipients": recipients,
            "status": "queued",
            "context": context,
            "queuedAt": utc_now_iso(),
        }

    def list_notifications(self, user: CurrentUser) -> list[dict]:
        return [
            {"id": "n1", "title": "Permit Approved", "body": "Your permit PTW-123 has been approved.", "read": False},
            {"id": "n2", "title": "CAPA Overdue", "body": "A CAPA assigned to you is overdue.", "read": True},
        ]

    def mark_read(self, user: CurrentUser, notification_id: str) -> dict:
        return {"id": notification_id, "status": "read"}

    def send_email(self, recipients: list[str], subject: str, body: str) -> dict:
        html = body if "<" in body else f"<p>{body}</p>"
        result = self._email.send_email(to=recipients, subject=subject, html_body=html, text_body=body)
        return {**self.send("email.generic", recipients, {"subject": subject}), **result}

    def send_push(self, recipients: list[str], title: str, body: str) -> dict:
        return self.send("push.generic", recipients, {"title": title, "body": body})
