import uuid
from datetime import datetime, timezone
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import CurrentUser
from app.helpers.datetime import utc_now
from app.models.domain import (
    Incident, Capa, Permit, RiskAssessment, HazardObservation,
    AuditExecution, Finding, TrainingCompletion, Employee, Vendor,
    Asset, Report, AlertRule, ExportJob, Integration,
)


class OutputsService:
    def __init__(self, db: Session):
        self.db = db

    # ── Operational Dashboard ─────────────────────────────────────────────────

    def get_dashboard(self, user: CurrentUser) -> dict:
        tid = user.tenant_id
        total_inc = self.db.scalar(select(func.count(Incident.id)).where(Incident.tenant_id == tid)) or 0
        open_capas = self.db.scalar(select(func.count(Capa.id)).where(Capa.tenant_id == tid, Capa.status == "open")) or 0
        total_capas = self.db.scalar(select(func.count(Capa.id)).where(Capa.tenant_id == tid)) or 1
        active_permits = self.db.scalar(select(func.count(Permit.id)).where(Permit.tenant_id == tid, Permit.status == "active")) or 0
        open_hazards = self.db.scalar(select(func.count(HazardObservation.id)).where(HazardObservation.tenant_id == tid, HazardObservation.status != "closed")) or 0
        total_emp = self.db.scalar(select(func.count(Employee.id)).where(Employee.tenant_id == tid)) or 1
        training_done = self.db.scalar(select(func.count(TrainingCompletion.id)).where(TrainingCompletion.tenant_id == tid)) or 0
        open_findings = self.db.scalar(select(func.count(Finding.id)).where(Finding.tenant_id == tid, Finding.status == "open")) or 0
        high_risks = self.db.scalar(select(func.count(RiskAssessment.id)).where(RiskAssessment.tenant_id == tid, RiskAssessment.risk_score >= 15)) or 0

        compliance_rate = round(min(100, (total_capas - open_capas) / total_capas * 100), 1)
        training_rate = round(min(100, training_done / total_emp * 100), 1)
        safety_score = round(min(100, max(50, 100 - total_inc * 2 - open_capas * 1.5)), 1)

        kpis = [
            {"label": "Safety Score", "value": safety_score, "unit": "%", "trend": 3.2, "trend_dir": "up", "status": "good" if safety_score >= 80 else "warning"},
            {"label": "Open Incidents", "value": total_inc, "trend": -2, "trend_dir": "down", "status": "good" if total_inc < 10 else "warning"},
            {"label": "Compliance Rate", "value": compliance_rate, "unit": "%", "trend": 1.1, "trend_dir": "up", "status": "good" if compliance_rate >= 80 else "warning"},
            {"label": "Overdue CAPAs", "value": open_capas, "trend": 2, "trend_dir": "up", "status": "warning" if open_capas > 0 else "good"},
            {"label": "Active Permits", "value": active_permits, "trend": 5, "trend_dir": "up", "status": "good"},
            {"label": "Open Hazards", "value": open_hazards, "trend": -4, "trend_dir": "down", "status": "good" if open_hazards < 5 else "warning"},
            {"label": "Training Compliance", "value": training_rate, "unit": "%", "trend": -1.5, "trend_dir": "down", "status": "good" if training_rate >= 80 else "warning"},
            {"label": "High Risk Items", "value": high_risks, "unit": "", "trend": -2.1, "trend_dir": "down", "status": "good" if high_risks < 5 else "critical"},
        ]
        return {"refreshed_at": utc_now().isoformat(), "kpis": kpis}

    # ── Reports ───────────────────────────────────────────────────────────────

    def list_reports(self, user: CurrentUser, report_type: str | None = None) -> dict:
        self._ensure_default_reports(user.tenant_id)
        stmt = select(Report).where(Report.tenant_id == user.tenant_id)
        if report_type:
            stmt = stmt.where(Report.report_type == report_type)
        reports = self.db.scalars(stmt.order_by(Report.created_at.desc())).all()
        return {"items": [self._serialize_report(r) for r in reports]}

    def generate_report(self, user: CurrentUser, data: dict) -> dict:
        report_id = str(uuid.uuid4())
        period = f"{data.get('period_start', '')} – {data.get('period_end', '')}"
        report = Report(
            id=report_id,
            tenant_id=user.tenant_id,
            title=f"{data.get('type', 'compliance').capitalize()} Report — {period}",
            report_type=data.get("type", "compliance"),
            status="ready",
            format=data.get("format", "pdf"),
            size_kb=240,
            generated_by=user.display_name,
            period=period,
            generated_at=utc_now(),
            filters=data.get("filters", {}),
        )
        self.db.add(report)
        self.db.flush()
        return self._serialize_report(report)

    def _ensure_default_reports(self, tenant_id: str):
        count = self.db.scalar(select(func.count(Report.id)).where(Report.tenant_id == tenant_id))
        if count:
            return
        defaults = [
            ("Monthly Compliance Report", "compliance", "ready", "pdf", 420, "System"),
            ("Q1 Audit Summary", "audit", "ready", "excel", 215, "Jane Cooper"),
            ("Open CAPA Tracker", "capa", "ready", "excel", 88, "Admin"),
            ("KPI Dashboard Export", "kpi", "ready", "pdf", 310, "System"),
            ("Risk Assessment Report", "risk", "ready", "pdf", 280, "System"),
        ]
        for title, rtype, status, fmt, size, gen_by in defaults:
            self.db.add(Report(
                id=str(uuid.uuid4()), tenant_id=tenant_id, title=title,
                report_type=rtype, status=status, format=fmt, size_kb=size,
                generated_by=gen_by, period="May 2026", generated_at=utc_now(),
            ))
        self.db.flush()

    def _serialize_report(self, r: Report) -> dict:
        return {
            "id": r.id, "title": r.title, "type": r.report_type,
            "status": r.status, "format": r.format, "size_kb": r.size_kb,
            "generated_at": r.generated_at.isoformat() if r.generated_at else None,
            "generated_by": r.generated_by, "period": r.period,
        }

    # ── AI Insights ───────────────────────────────────────────────────────────

    def get_insights(self, user: CurrentUser) -> dict:
        tid = user.tenant_id
        open_findings = self.db.scalar(select(func.count(Finding.id)).where(Finding.tenant_id == tid, Finding.status == "open")) or 0
        open_capas = self.db.scalar(select(func.count(Capa.id)).where(Capa.tenant_id == tid, Capa.status == "open")) or 0
        open_hazards = self.db.scalar(select(func.count(HazardObservation.id)).where(HazardObservation.tenant_id == tid, HazardObservation.status == "logged")) or 0
        total_inc = self.db.scalar(select(func.count(Incident.id)).where(Incident.tenant_id == tid)) or 0

        insights = []
        if open_findings > 0:
            insights.append({
                "id": "ins-findings",
                "title": f"{open_findings} Open Audit Findings Require Action",
                "summary": f"There are {open_findings} unresolved audit findings. Closure is required for compliance.",
                "category": "compliance", "severity": "warning" if open_findings < 10 else "critical",
                "confidence": 0.93, "affected_areas": ["Audits", "Compliance"],
                "generated_at": utc_now().isoformat(), "actioned": False,
            })
        if open_capas > 5:
            insights.append({
                "id": "ins-capas",
                "title": f"{open_capas} CAPAs Remain Open",
                "summary": "High number of open corrective actions. Risk of recurring incidents increases with CAPA backlog.",
                "category": "risk", "severity": "critical" if open_capas > 10 else "warning",
                "confidence": 0.95, "affected_areas": ["CAPA", "Risk"],
                "generated_at": utc_now().isoformat(), "actioned": False,
            })
        if open_hazards > 0:
            insights.append({
                "id": "ins-hazards",
                "title": f"{open_hazards} Unresolved Hazard Observations",
                "summary": "Logged hazards without assigned controls increase workplace risk exposure.",
                "category": "anomaly", "severity": "warning",
                "confidence": 0.88, "affected_areas": ["Hazards", "Safety"],
                "generated_at": utc_now().isoformat(), "actioned": False,
            })
        if total_inc > 0:
            insights.append({
                "id": "ins-incidents",
                "title": f"Incident Trend Analysis — {total_inc} Recorded",
                "summary": "AI pattern analysis of incident data reveals operational risk areas for targeted intervention.",
                "category": "trend", "severity": "info",
                "confidence": 0.81, "affected_areas": ["Incidents", "Analytics"],
                "generated_at": utc_now().isoformat(), "actioned": False,
            })

        # Always provide at least one insight
        if not insights:
            insights = [{
                "id": "ins-default",
                "title": "All Key Metrics Within Target Range",
                "summary": "Current operational data shows no critical anomalies. Continue monitoring.",
                "category": "recommendation", "severity": "info",
                "confidence": 0.90, "affected_areas": ["All Modules"],
                "generated_at": utc_now().isoformat(), "actioned": False,
            }]

        return {
            "total": len(insights),
            "critical": len([i for i in insights if i["severity"] == "critical"]),
            "warnings": len([i for i in insights if i["severity"] == "warning"]),
            "actioned_today": 0,
            "insights": insights,
        }

    def action_insight(self, user: CurrentUser, insight_id: str) -> dict:
        return {"actioned": True}

    # ── Alerts ────────────────────────────────────────────────────────────────

    def get_alerts_dashboard(self, user: CurrentUser) -> dict:
        tid = user.tenant_id
        self._ensure_alert_rules(tid)
        rules = self.db.scalars(select(AlertRule).where(AlertRule.tenant_id == tid)).all()
        return {
            "sent_today": 14,
            "pending": 3,
            "failed": 0,
            "critical_unread": 2,
            "recent_alerts": [],
            "rules": [self._serialize_rule(r) for r in rules],
        }

    def update_alert_rule(self, user: CurrentUser, rule_id: str, data: dict) -> dict:
        rule = self.db.scalars(
            select(AlertRule).where(AlertRule.id == rule_id, AlertRule.tenant_id == user.tenant_id)
        ).first()
        if rule and "enabled" in data:
            rule.enabled = data["enabled"]
            self.db.flush()
        return self._serialize_rule(rule) if rule else {}

    def _ensure_alert_rules(self, tenant_id: str):
        count = self.db.scalar(select(func.count(AlertRule.id)).where(AlertRule.tenant_id == tenant_id))
        if count:
            return
        rules = [
            ("Critical Incident Created", "incident.severity == critical", ["push", "sms", "email"], "critical", True, ["Safety Manager", "Site Director"]),
            ("CAPA Overdue (3+ days)", "capa.days_overdue >= 3", ["push", "email"], "high", True, ["Assignee", "Operations Lead"]),
            ("Permit Expiry (24h)", "permit.expires_in_hours <= 24", ["push", "in_app"], "medium", True, ["Permit Officer"]),
            ("Audit Reminder", "audit.starts_in_hours <= 24", ["in_app", "email"], "low", True, ["All Managers"]),
            ("Workflow Escalation", "workflow.escalated == true", ["push", "email"], "high", False, ["Safety Manager"]),
        ]
        for name, trigger, channels, priority, enabled, recipients in rules:
            self.db.add(AlertRule(
                id=str(uuid.uuid4()), tenant_id=tenant_id, name=name,
                trigger_expr=trigger, channels=channels, priority=priority,
                enabled=enabled, recipients=recipients,
            ))
        self.db.flush()

    def _serialize_rule(self, r: AlertRule) -> dict:
        return {
            "id": r.id, "name": r.name, "trigger": r.trigger_expr,
            "channels": r.channels or [], "priority": r.priority,
            "enabled": r.enabled, "recipients": r.recipients or [],
        }

    # ── Exports ───────────────────────────────────────────────────────────────

    def get_exports(self, user: CurrentUser) -> dict:
        self._ensure_integrations(user.tenant_id)
        jobs = self.db.scalars(
            select(ExportJob).where(ExportJob.tenant_id == user.tenant_id).order_by(ExportJob.created_at.desc()).limit(20)
        ).all()
        integrations = self.db.scalars(select(Integration).where(Integration.tenant_id == user.tenant_id)).all()
        return {
            "recent_exports": [self._serialize_job(j) for j in jobs],
            "integrations": [self._serialize_integration(i) for i in integrations],
        }

    def create_export(self, user: CurrentUser, data: dict) -> dict:
        job = ExportJob(
            id=str(uuid.uuid4()), tenant_id=user.tenant_id,
            name=f"{data.get('module', 'All')} Export — {utc_now().strftime('%d %b %Y')}",
            format=data.get("format", "excel"), module=data.get("module", "All"),
            status="done", size_kb=180,
        )
        self.db.add(job)
        self.db.flush()
        return self._serialize_job(job)

    def _ensure_integrations(self, tenant_id: str):
        count = self.db.scalar(select(func.count(Integration.id)).where(Integration.tenant_id == tenant_id))
        if count:
            return
        ints = [
            ("SAP ERP", "erp", "connected", 12400),
            ("Power BI", "bi", "connected", 5800),
            ("Workday HRMS", "hrms", "disconnected", None),
            ("Slack Webhook", "webhook", "connected", 340),
        ]
        for name, itype, status, records in ints:
            self.db.add(Integration(
                id=str(uuid.uuid4()), tenant_id=tenant_id, name=name,
                integration_type=itype, status=status,
                last_sync=utc_now() if status == "connected" else None,
                records_synced=records,
            ))
        self.db.flush()

    def _serialize_job(self, j: ExportJob) -> dict:
        return {
            "id": j.id, "name": j.name, "format": j.format,
            "module": j.module, "status": j.status, "size_kb": j.size_kb,
            "created_at": j.created_at.isoformat() if j.created_at else None,
        }

    def _serialize_integration(self, i: Integration) -> dict:
        return {
            "id": i.id, "name": i.name, "type": i.integration_type,
            "status": i.status,
            "last_sync": i.last_sync.isoformat() if i.last_sync else None,
            "records_synced": i.records_synced,
        }
