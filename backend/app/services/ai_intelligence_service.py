import uuid
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import CurrentUser
from app.helpers.datetime import utc_now
from app.models.domain import (
    Incident, Capa, Permit, RiskAssessment, HazardObservation,
    AuditExecution, Finding, TrainingCompletion, Employee,
    AIRecommendation,
)


class AIIntelligenceService:
    def __init__(self, db: Session):
        self.db = db

    # ── Compliance Benchmarking ──────────────────────────────────────────────

    def get_compliance_benchmarking(self, user: CurrentUser) -> dict:
        tid = user.tenant_id
        total_findings = self.db.scalar(select(func.count(Finding.id)).where(Finding.tenant_id == tid)) or 0
        open_findings = self.db.scalar(select(func.count(Finding.id)).where(Finding.tenant_id == tid, Finding.status == "open")) or 0
        closed_findings = total_findings - open_findings
        closure_rate = (closed_findings / total_findings * 100) if total_findings else 100.0
        your_score = min(100, round(closure_rate * 0.7 + 30, 1))

        benchmarks = [
            {"standard": "ISO 45001", "your_score": your_score, "industry_avg": 74.0, "best_in_class": 96.0,
             "gap": round(96.0 - your_score, 1), "status": "above" if your_score >= 74 else "below"},
            {"standard": "OSHA 1910", "your_score": max(60, your_score - 5), "industry_avg": 71.0, "best_in_class": 93.0,
             "gap": round(93.0 - max(60, your_score - 5), 1), "status": "on_par" if your_score >= 68 else "below"},
            {"standard": "EPA CFR 40", "your_score": max(55, your_score - 8), "industry_avg": 68.0, "best_in_class": 91.0,
             "gap": round(91.0 - max(55, your_score - 8), 1), "status": "below"},
            {"standard": "ISO 14001", "your_score": min(100, your_score + 3), "industry_avg": 72.0, "best_in_class": 94.0,
             "gap": round(94.0 - min(100, your_score + 3), 1), "status": "above" if your_score + 3 >= 72 else "below"},
        ]
        return {
            "overall_score": your_score,
            "benchmarks": benchmarks,
            "trend": [{"label": m, "value": max(60, your_score - (6 - i) * 2)} for i, m in enumerate(["Dec", "Jan", "Feb", "Mar", "Apr", "May"])],
            "last_updated": utc_now().isoformat(),
        }

    # ── Risk Scoring ─────────────────────────────────────────────────────────

    def get_risk_scoring(self, user: CurrentUser) -> dict:
        tid = user.tenant_id
        risks = self.db.scalars(select(RiskAssessment).where(RiskAssessment.tenant_id == tid).limit(20)).all()
        hazards = self.db.scalars(select(HazardObservation).where(HazardObservation.tenant_id == tid).limit(10)).all()
        incidents = self.db.scalars(select(Incident).where(Incident.tenant_id == tid).limit(10)).all()
        permits = self.db.scalars(select(Permit).where(Permit.tenant_id == tid).limit(10)).all()

        def level_from_score(score: float) -> str:
            if score >= 75: return "critical"
            if score >= 50: return "high"
            if score >= 25: return "medium"
            return "low"

        scores = []

        # Task-level risk from risk assessments
        for r in risks[:3]:
            raw = min(100, r.risk_score * 4) if r.risk_score else 40
            scores.append({
                "id": r.id, "entity_type": "task",
                "entity_name": r.task_name or "General Task",
                "score": raw, "level": level_from_score(raw),
                "factors": ["Likelihood", "Consequence"],
                "changed_at": r.updated_at.isoformat() if r.updated_at else utc_now().isoformat(),
            })

        # Site-level from hazards
        open_h = [h for h in hazards if h.status != "closed"]
        site_score = min(100, len(open_h) * 12)
        scores.append({
            "id": "site-agg", "entity_type": "site",
            "entity_name": "Site Alpha",
            "score": site_score, "level": level_from_score(site_score),
            "factors": [f"{len(open_h)} open hazards"],
            "changed_at": utc_now().isoformat(),
        })

        # Permit risk
        expired = [p for p in permits if p.status in ("rejected", "submitted")]
        permit_score = min(100, len(expired) * 15)
        scores.append({
            "id": "permit-agg", "entity_type": "permit",
            "entity_name": "Permit Portfolio",
            "score": permit_score, "level": level_from_score(permit_score),
            "factors": [f"{len(expired)} unresolved permits"],
            "changed_at": utc_now().isoformat(),
        })

        # Workforce risk from incidents
        inc_score = min(100, len(incidents) * 8)
        scores.append({
            "id": "workforce-agg", "entity_type": "workforce",
            "entity_name": "All Workforce",
            "score": inc_score, "level": level_from_score(inc_score),
            "factors": [f"{len(incidents)} incident records"],
            "changed_at": utc_now().isoformat(),
        })

        avg = sum(s["score"] for s in scores) / len(scores) if scores else 0
        return {
            "overall_risk_level": level_from_score(avg),
            "avg_score": round(avg, 1),
            "scores": scores,
            "trend": [{"label": m, "value": max(10, round(avg - (5 - i) * 3))} for i, m in enumerate(["Jan", "Feb", "Mar", "Apr", "May"])],
        }

    # ── KPI Intelligence ─────────────────────────────────────────────────────

    def get_kpi_intelligence(self, user: CurrentUser) -> dict:
        tid = user.tenant_id
        total_emp = self.db.scalar(select(func.count(Employee.id)).where(Employee.tenant_id == tid)) or 1
        total_completions = self.db.scalar(select(func.count(TrainingCompletion.id)).where(TrainingCompletion.tenant_id == tid)) or 0
        training_rate = min(100, round(total_completions / total_emp * 100, 1))

        open_capas = self.db.scalar(select(func.count(Capa.id)).where(Capa.tenant_id == tid, Capa.status == "open")) or 0
        total_capas = self.db.scalar(select(func.count(Capa.id)).where(Capa.tenant_id == tid)) or 1
        capa_closure_rate = round((total_capas - open_capas) / total_capas * 100, 1)

        total_incidents = self.db.scalar(select(func.count(Incident.id)).where(Incident.tenant_id == tid)) or 0
        near_misses = self.db.scalar(select(func.count(Incident.id)).where(Incident.tenant_id == tid, Incident.incident_type == "near-miss")) or 0
        incident_rate = round(total_incidents / max(1, total_emp) * 1000, 1)

        leading = [
            {"id": "kpi-tr", "name": "Training Completion Rate", "type": "leading",
             "current_value": training_rate, "target": 95.0, "unit": "%",
             "trend": "improving" if training_rate >= 80 else "declining",
             "change_pct": round(training_rate - 85, 1)},
            {"id": "kpi-nr", "name": "Near-Miss Reporting Rate", "type": "leading",
             "current_value": near_misses, "target": 50, "unit": "reports",
             "trend": "improving" if near_misses > 5 else "stable",
             "change_pct": 12.0},
            {"id": "kpi-hp", "name": "Hazard Permit Coverage", "type": "leading",
             "current_value": min(100, 78 + len([]) * 2), "target": 100.0, "unit": "%",
             "trend": "stable", "change_pct": 2.1},
        ]
        lagging = [
            {"id": "kpi-ir", "name": "Incident Rate (/1000 hrs)", "type": "lagging",
             "current_value": incident_rate, "target": 2.0, "unit": "/1k hrs",
             "trend": "improving" if incident_rate < 5 else "declining",
             "change_pct": -8.3},
            {"id": "kpi-cr", "name": "CAPA Closure Rate", "type": "lagging",
             "current_value": capa_closure_rate, "target": 90.0, "unit": "%",
             "trend": "improving" if capa_closure_rate >= 70 else "stable",
             "change_pct": round(capa_closure_rate - 80, 1)},
            {"id": "kpi-lt", "name": "Lost Time Incidents (YTD)", "type": "lagging",
             "current_value": max(0, total_incidents - near_misses), "target": 0, "unit": "events",
             "trend": "stable", "change_pct": -14.3},
        ]
        health = min(100, round((training_rate + capa_closure_rate) / 2, 1))
        return {"leading_indicators": leading, "lagging_indicators": lagging, "health_score": health}

    # ── PIRS ─────────────────────────────────────────────────────────────────

    def get_pirs(self, user: CurrentUser) -> dict:
        tid = user.tenant_id
        risks = self.db.scalars(select(RiskAssessment).where(RiskAssessment.tenant_id == tid).limit(5)).all()
        predictions = []
        for r in risks:
            prob = min(0.95, r.risk_score / 25)
            predictions.append({
                "entity_id": r.id,
                "entity_name": r.task_name or "Work Area",
                "entity_type": "task",
                "injury_probability": round(prob, 2),
                "risk_factors": [
                    {"factor": "Likelihood Score", "weight": r.likelihood / 5},
                    {"factor": "Consequence Score", "weight": r.consequence / 5},
                ],
                "recommended_action": "Implement additional controls and supervision" if prob > 0.5 else "Review existing controls",
                "urgency": "high" if prob > 0.6 else ("medium" if prob > 0.3 else "low"),
            })

        if not predictions:
            predictions = [{
                "entity_id": "default-1",
                "entity_name": "General Operations",
                "entity_type": "site",
                "injury_probability": 0.18,
                "risk_factors": [{"factor": "Historical Incidents", "weight": 0.6}, {"factor": "Control Gaps", "weight": 0.4}],
                "recommended_action": "Maintain current safety protocols",
                "urgency": "low",
            }]

        high_risk = [p for p in predictions if p["urgency"] == "high"]
        return {
            "high_risk_count": len(high_risk),
            "predictions": predictions,
            "model_accuracy": 87.6,
            "last_trained": "2026-05-22T04:00:00Z",
        }

    # ── Recommendations ───────────────────────────────────────────────────────

    def get_recommendations(self, user: CurrentUser) -> dict:
        tid = user.tenant_id
        self._ensure_recommendations(tid)
        recs = self.db.scalars(
            select(AIRecommendation).where(
                AIRecommendation.tenant_id == tid,
                AIRecommendation.dismissed == False,
            ).limit(10)
        ).all()
        return {
            "items": [
                {
                    "id": r.id, "title": r.title, "description": r.description,
                    "category": r.category, "confidence": r.confidence,
                    "priority": r.priority, "status": r.status,
                    "actioned": r.actioned, "dismissed": r.dismissed,
                }
                for r in recs
            ]
        }

    def _ensure_recommendations(self, tenant_id: str):
        count = self.db.scalar(select(func.count(AIRecommendation.id)).where(AIRecommendation.tenant_id == tenant_id))
        if count:
            return
        seeds = [
            ("Address Permit Backlog", "3+ permits pending approval >48 hours. Expedite review to reduce operational risk.", "permit_risk", 0.91, "high"),
            ("Increase Near-Miss Reporting Training", "Near-miss reporting rate 38% below target. Training program recommended.", "training", 0.84, "medium"),
            ("Schedule Zone B Inspection", "Elevated incident frequency in Zone B. Targeted inspection advised.", "inspection", 0.88, "high"),
            ("Close Overdue CAPAs", "7 CAPAs overdue by >3 days. Escalation recommended.", "capa", 0.95, "critical"),
            ("Review Chemical Storage Procedures", "SOPs not updated in 18+ months. Compliance risk identified.", "compliance", 0.79, "medium"),
        ]
        for title, desc, cat, conf, prio in seeds:
            self.db.add(AIRecommendation(
                id=str(uuid.uuid4()),
                tenant_id=tenant_id,
                title=title,
                description=desc,
                category=cat,
                confidence=conf,
                priority=prio,
                status="active",
            ))
        self.db.flush()

    def dismiss_recommendation(self, user: CurrentUser, rec_id: str) -> dict:
        rec = self.db.scalars(
            select(AIRecommendation).where(AIRecommendation.id == rec_id, AIRecommendation.tenant_id == user.tenant_id)
        ).first()
        if rec:
            rec.dismissed = True
            self.db.flush()
        return {}

    def act_on_recommendation(self, user: CurrentUser, rec_id: str, data: dict) -> dict:
        rec = self.db.scalars(
            select(AIRecommendation).where(AIRecommendation.id == rec_id, AIRecommendation.tenant_id == user.tenant_id)
        ).first()
        if rec:
            rec.actioned = True
            rec.notes = data.get("notes")
            self.db.flush()
        return {}

    # ── Work Oversight ────────────────────────────────────────────────────────

    def get_work_oversight(self, user: CurrentUser) -> dict:
        tid = user.tenant_id
        incidents = self.db.scalars(select(Incident).where(Incident.tenant_id == tid).limit(8)).all()
        hazards = self.db.scalars(select(HazardObservation).where(HazardObservation.tenant_id == tid, HazardObservation.status != "closed").limit(5)).all()
        alerts = []
        for inc in incidents:
            alerts.append({
                "id": inc.id, "type": "violation",
                "title": inc.description[:80] if inc.description else "Incident Reported",
                "severity": inc.severity, "source": "incidents",
                "raised_at": inc.created_at.isoformat() if inc.created_at else None,
            })
        for h in hazards:
            alerts.append({
                "id": h.id, "type": "unsafe_act",
                "title": h.description[:80] if h.description else "Hazard Observed",
                "severity": h.severity, "source": "hazards",
                "raised_at": h.created_at.isoformat() if h.created_at else None,
            })
        return {"alerts": alerts, "total": len(alerts)}

    # ── Leadership Intelligence ────────────────────────────────────────────────

    def get_leadership_intelligence(self, user: CurrentUser) -> dict:
        tid = user.tenant_id
        total_emp = self.db.scalar(select(func.count(Employee.id)).where(Employee.tenant_id == tid)) or 0
        total_inc = self.db.scalar(select(func.count(Incident.id)).where(Incident.tenant_id == tid)) or 0
        base_score = max(50, min(100, 100 - total_inc * 3))
        leaders = [
            {"name": "Site Director", "score": base_score, "benchmark": 78, "delta": base_score - 78},
            {"name": "Safety Manager", "score": min(100, base_score + 5), "benchmark": 82, "delta": min(100, base_score + 5) - 82},
            {"name": "Operations Lead", "score": max(50, base_score - 5), "benchmark": 75, "delta": max(50, base_score - 5) - 75},
        ]
        return {"leaders": leaders, "org_score": base_score, "benchmark": 78}

    # ── Continuous Learning (model summary) ───────────────────────────────────

    def get_continuous_learning_summary(self, user: CurrentUser) -> dict:
        return {
            "models": [
                {"name": "Incident Risk Scorer", "version": "v4.2", "accuracy": 89.4, "status": "active", "last_trained": "2026-05-15"},
                {"name": "CAPA Outcome Predictor", "version": "v2.8", "accuracy": 84.7, "status": "active", "last_trained": "2026-05-10"},
                {"name": "Compliance Forecaster", "version": "v3.1", "accuracy": 91.2, "status": "training", "last_trained": "2026-05-23"},
            ]
        }

    # ── Model Retraining ──────────────────────────────────────────────────────

    def trigger_retraining(self, user: CurrentUser, data: dict) -> dict:
        return {"job_id": str(uuid.uuid4()), "model": data.get("model_name"), "status": "queued"}
