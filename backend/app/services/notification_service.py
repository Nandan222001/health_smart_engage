from app.helpers.datetime import utc_now_iso


class NotificationService:
    def send(self, template_key: str, recipients: list[str], context: dict) -> dict:
        return {
            "templateKey": template_key,
            "recipients": recipients,
            "status": "queued",
            "context": context,
            "queuedAt": utc_now_iso(),
        }

    def send_email(self, recipients: list[str], subject: str, body: str) -> dict:
        return self.send("email.generic", recipients, {"subject": subject, "body": body})

    def send_push(self, recipients: list[str], title: str, body: str) -> dict:
        return self.send("push.generic", recipients, {"title": title, "body": body})
