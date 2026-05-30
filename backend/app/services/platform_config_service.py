import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.security_policy import SecurityPolicy

COMPLIANCE_CONFIG_KEY = "global_compliance_config"
SECURITY_CONFIG_KEY = "security_policy"

DEFAULT_COMPLIANCE_CONFIG = {
    "standards": ["ISO 45001", "OSHA", "HSE", "Internal SOP"],
    "audit_templates": ["Safety Audit", "Environmental Audit", "Process Audit"],
    "risk_categories": ["Physical", "Chemical", "Biological", "Ergonomic", "Psychosocial"],
    "incident_severity_matrix": {"low": 1, "medium": 2, "high": 3, "critical": 4},
    "escalation_workflows": [],
}

DEFAULT_SECURITY_CONFIG = {
    "min_password_length": 8,
    "password_expiry_days": 90,
    "session_timeout_minutes": 60,
    "max_login_attempts": 5,
    "ip_whitelist": [],
    "mfa_required": False,
    "sso_enabled": False,
    "audit_log_retention_days": 365,
}


class PlatformConfigService:
    def __init__(self, db: Session):
        self.db = db

    def get_security_policy(self) -> dict:
        pol = self._get_or_create(SECURITY_CONFIG_KEY, DEFAULT_SECURITY_CONFIG)
        return pol.value

    def update_security_policy(self, data: dict) -> dict:
        pol = self._get_or_create(SECURITY_CONFIG_KEY, DEFAULT_SECURITY_CONFIG)
        pol.value = {**pol.value, **data}
        return pol.value

    def get_compliance_config(self) -> dict:
        pol = self._get_or_create(COMPLIANCE_CONFIG_KEY, DEFAULT_COMPLIANCE_CONFIG)
        return pol.value

    def update_compliance_config(self, data: dict) -> dict:
        pol = self._get_or_create(COMPLIANCE_CONFIG_KEY, DEFAULT_COMPLIANCE_CONFIG)
        pol.value = {**pol.value, **data}
        return pol.value

    def _get_or_create(self, key: str, default: dict) -> SecurityPolicy:
        pol = self.db.scalars(select(SecurityPolicy).where(SecurityPolicy.key == key)).first()
        if not pol:
            pol = SecurityPolicy(id=str(uuid.uuid4()), key=key, value=default)
            self.db.add(pol)
            self.db.flush()
        return pol
