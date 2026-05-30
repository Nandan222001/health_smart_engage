import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.exceptions import AppError
from app.models.notification_templates import NotificationTemplate

DEFAULT_TEMPLATES = [
    {
        "name": "Organisation Invitation",
        "channel": "email",
        "event_type": "org_invitation",
        "subject": "You have been invited to HSE Platform",
        "body": "Dear {{admin_name}}, you have been invited to set up {{org_name}} on the HSE Platform. Click here to get started: {{invite_link}}",
        "variables": ["admin_name", "org_name", "invite_link"],
        "is_system": True,
        "is_active": True,
    },
    {
        "name": "Account Approved",
        "channel": "email",
        "event_type": "account_approved",
        "subject": "Your HSE account has been approved",
        "body": "Dear {{user_name}}, your account for {{org_name}} has been approved. Login at: {{login_link}}",
        "variables": ["user_name", "org_name", "login_link"],
        "is_system": True,
        "is_active": True,
    },
    {
        "name": "Incident Alert",
        "channel": "push",
        "event_type": "incident_reported",
        "subject": None,
        "body": "New {{severity}} incident reported: {{description}}",
        "variables": ["severity", "description"],
        "is_system": True,
        "is_active": True,
    },
    {
        "name": "CAPA Due Reminder",
        "channel": "email",
        "event_type": "capa_due",
        "subject": "CAPA Action Due - {{capa_title}}",
        "body": "This is a reminder that CAPA action '{{capa_title}}' is due on {{due_date}}.",
        "variables": ["capa_title", "due_date"],
        "is_system": True,
        "is_active": True,
    },
    {
        "name": "Audit Scheduled",
        "channel": "email",
        "event_type": "audit_scheduled",
        "subject": "Audit Scheduled: {{audit_name}}",
        "body": "An audit has been scheduled for {{scheduled_date}}. Auditor: {{auditor_name}}",
        "variables": ["audit_name", "scheduled_date", "auditor_name"],
        "is_system": True,
        "is_active": True,
    },
]


class NotificationTemplateService:
    def __init__(self, db: Session):
        self.db = db

    def list_templates(self) -> dict:
        templates = self.db.scalars(
            select(NotificationTemplate).order_by(NotificationTemplate.name)
        ).all()
        if not templates:
            templates = self._seed_defaults()
        return {"items": [self._serialize(t) for t in templates]}

    def create_template(self, data: dict) -> dict:
        body = data.get("body_template") or data.get("body", "")
        tmpl = NotificationTemplate(
            id=str(uuid.uuid4()),
            name=data["name"],
            channel=data["channel"],
            event_type=data.get("event_type"),
            subject=data.get("subject"),
            body=body,
            variables=data.get("variables", []),
            is_system=data.get("is_system", False),
            is_active=data.get("is_active", True),
        )
        self.db.add(tmpl)
        self.db.flush()
        return self._serialize(tmpl)

    def update_template(self, template_id: str, data: dict) -> dict:
        tmpl = self.db.scalars(
            select(NotificationTemplate).where(NotificationTemplate.id == template_id)
        ).first()
        if not tmpl:
            raise AppError("NOT_FOUND", "Template not found", 404)
        for field in ("name", "channel", "event_type", "subject", "variables", "is_system", "is_active"):
            if field in data:
                setattr(tmpl, field, data[field])
        # Accept body_template as alias for body
        if "body_template" in data:
            tmpl.body = data["body_template"]
        elif "body" in data:
            tmpl.body = data["body"]
        return self._serialize(tmpl)

    def delete_template(self, template_id: str) -> dict:
        tmpl = self.db.scalars(
            select(NotificationTemplate).where(NotificationTemplate.id == template_id)
        ).first()
        if not tmpl:
            raise AppError("NOT_FOUND", "Template not found", 404)
        if tmpl.is_system:
            raise AppError("FORBIDDEN", "Cannot delete system templates", 403)
        self.db.delete(tmpl)
        return {"message": "Template deleted", "id": template_id}

    def _seed_defaults(self) -> list:
        seeded = []
        for tdata in DEFAULT_TEMPLATES:
            tmpl = NotificationTemplate(id=str(uuid.uuid4()), **tdata)
            self.db.add(tmpl)
            seeded.append(tmpl)
        self.db.flush()
        return seeded

    @staticmethod
    def _serialize(t: NotificationTemplate) -> dict:
        return {
            "id": t.id,
            "name": t.name,
            "channel": t.channel,
            "event_type": t.event_type or "",
            "subject": t.subject,
            "body_template": t.body,
            "body": t.body,
            "variables": t.variables or [],
            "is_system": t.is_system,
            "is_active": t.is_active if t.is_active is not None else True,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None,
        }
