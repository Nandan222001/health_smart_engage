from app.helpers.datetime import utc_now_iso
from sqlalchemy.orm import Session
from app.core.security import CurrentUser

class NotificationService:
    def __init__(self, db: Session = None):
        self.db = db

    def send(self, template_key: str, recipients: list[str], context: dict) -> dict:
        return {
            "templateKey": template_key,
            "recipients": recipients,
            "status": "queued",
            "context": context,
            "queuedAt": utc_now_iso(),
        }

    def list_notifications(self, user: CurrentUser) -> list[dict]:
        # Return mock notifications if no DB logic implemented for actual notification storage
        return [
            {"id": "n1", "title": "Permit Approved", "body": "Your permit PTW-123 has been approved.", "read": False},
            {"id": "n2", "title": "CAPA Overdue", "body": "A CAPA assigned to you is overdue.", "read": True}
        ]

    def mark_read(self, user: CurrentUser, notification_id: str) -> dict:
        return {"id": notification_id, "status": "read"}

    def send_email(self, recipients: list[str], subject: str, body: str) -> dict:
        return self.send("email.generic", recipients, {"subject": subject, "body": body})

    def send_push(self, recipients: list[str], title: str, body: str) -> dict:
        return self.send("push.generic", recipients, {"title": title, "body": body})
