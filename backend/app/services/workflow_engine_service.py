import uuid
from datetime import datetime, timezone
from typing import Any
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import CurrentUser
from app.core.exceptions import AppError
from app.helpers.datetime import utc_now
from app.models.domain import (
    WorkflowCase, WorkflowStageEvent, WorkflowApproval,
    WorkflowCAPA, WorkflowResolution, WorkflowAlert,
    Incident, Capa, Permit, HazardObservation, Finding,
)
from app.repositories.domain_repository import DomainRepository

STAGES = [
    "risk_detected", "alerts_sent", "workflow_triggered",
    "approvals_escalations", "actions_capa",
    "resolution_verification", "records_updated",
]


def _next_stage(current: str) -> str | None:
    try:
        idx = STAGES.index(current)
        return STAGES[idx + 1] if idx + 1 < len(STAGES) else None
    except ValueError:
        return None


def _serialize_case(case: WorkflowCase, db: Session) -> dict:
    events = db.scalars(
        select(WorkflowStageEvent)
        .where(WorkflowStageEvent.case_id == case.id)
        .order_by(WorkflowStageEvent.entered_at)
    ).all()
    return {
        "id": case.id,
        "case_number": case.case_number,
        "title": case.title,
        "type": case.case_type,
        "severity": case.severity,
        "priority": case.priority,
        "current_stage": case.current_stage,
        "assigned_to": case.assigned_to,
        "site": case.site,
        "zone": case.zone,
        "created_at": case.created_at.isoformat() if case.created_at else None,
        "updated_at": case.updated_at.isoformat() if case.updated_at else None,
        "due_at": case.due_at.isoformat() if case.due_at else None,
        "overdue": case.overdue,
        "escalated": case.escalated,
        "stage_history": [
            {
                "stage": e.stage,
                "entered_at": e.entered_at.isoformat() if e.entered_at else None,
                "completed_at": e.completed_at.isoformat() if e.completed_at else None,
                "actor": e.actor,
                "notes": e.notes,
            }
            for e in events
        ],
    }


def _serialize_approval(a: WorkflowApproval, case: WorkflowCase) -> dict:
    now = datetime.now(timezone.utc)
    due = a.due_at or now
    return {
        "id": a.id,
        "case_id": a.case_id,
        "case_number": case.case_number if case else "",
        "case_title": case.title if case else "",
        "case_type": case.case_type if case else "",
        "severity": case.severity if case else "medium",
        "approver": a.approver,
        "approver_role": a.approver_role,
        "status": a.status,
        "requested_at": a.created_at.isoformat() if a.created_at else None,
        "due_at": due.isoformat(),
        "overdue": now > due and a.status == "pending",
        "escalated_to": a.escalated_to,
        "notes": a.notes,
    }


def _serialize_capa(c: WorkflowCAPA, case: WorkflowCase) -> dict:
    return {
        "id": c.id,
        "case_id": c.case_id,
        "case_number": case.case_number if case else "",
        "title": c.title,
        "description": c.description,
        "assignee": c.assignee,
        "priority": c.priority,
        "due_date": c.due_date.isoformat() if c.due_date else None,
        "status": c.status,
        "root_cause": c.root_cause,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "overdue": c.overdue,
    }


def _serialize_resolution(r: WorkflowResolution, case: WorkflowCase) -> dict:
    return {
        "id": r.id,
        "case_id": r.case_id,
        "case_number": case.case_number if case else "",
        "case_title": case.title if case else "",
        "verified_by": r.verified_by,
        "verification_due": r.verification_due.isoformat() if r.verification_due else None,
        "evidence_submitted": r.evidence_submitted,
        "status": r.status,
        "submitted_at": r.submitted_at.isoformat() if r.submitted_at else None,
    }


def _serialize_alert(a: WorkflowAlert) -> dict:
    return {
        "id": a.id,
        "case_id": a.case_id,
        "case_title": "",
        "type": a.alert_type,
        "recipient": a.recipient,
        "message": a.message,
        "sent_at": a.sent_at.isoformat() if a.sent_at else None,
        "acknowledged": a.acknowledged,
        "acknowledged_at": a.acknowledged_at.isoformat() if a.acknowledged_at else None,
    }


class WorkflowEngineService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = DomainRepository(db)

    def _ensure_seed_data(self, tenant_id: str):
        """Seed initial workflow cases from real operational data if none exist."""
        count = self.db.scalar(
            select(func.count(WorkflowCase.id)).where(WorkflowCase.tenant_id == tenant_id)
        )
        if count and count > 0:
            return

        # Pull from real incidents and hazards to generate workflow cases
        incidents = self.db.scalars(
            select(Incident).where(Incident.tenant_id == tenant_id).limit(5)
        ).all()
        hazards = self.db.scalars(
            select(HazardObservation).where(HazardObservation.tenant_id == tenant_id).limit(3)
        ).all()
        permits = self.db.scalars(
            select(Permit).where(Permit.tenant_id == tenant_id).limit(3)
        ).all()

        seed_cases = []
        for inc in incidents:
            seed_cases.append({
                "source_type": "incident",
                "source_id": inc.id,
                "title": inc.description[:120] if inc.description else "Incident Case",
                "case_type": "incident",
                "severity": inc.severity if inc.severity not in ("unclassified", None) else "medium",
                "priority": "high" if inc.severity in ("critical", "high") else "medium",
                "current_stage": "workflow_triggered",
            })
        for h in hazards:
            seed_cases.append({
                "source_type": "hazard",
                "source_id": h.id,
                "title": h.description[:120] if h.description else "Hazard Case",
                "case_type": "hazard",
                "severity": h.severity,
                "priority": "high" if h.severity in ("critical", "high") else "medium",
                "current_stage": "alerts_sent",
            })
        for p in permits:
            seed_cases.append({
                "source_type": "permit",
                "source_id": p.id,
                "title": f"Permit Review — {p.permit_ref}",
                "case_type": "permit",
                "severity": "medium",
                "priority": "medium",
                "current_stage": "approvals_escalations",
            })

        # If no real data, create placeholder cases
        if not seed_cases:
            seed_cases = [
                {"title": "Near-Miss: Zone B Equipment", "case_type": "near_miss", "severity": "high", "priority": "high", "current_stage": "risk_detected"},
                {"title": "ISO 45001 Audit Finding", "case_type": "audit_finding", "severity": "medium", "priority": "medium", "current_stage": "alerts_sent"},
                {"title": "Chemical Spill Incident", "case_type": "incident", "severity": "critical", "priority": "critical", "current_stage": "approvals_escalations"},
                {"title": "Overdue CAPA — INV-089", "case_type": "capa", "severity": "medium", "priority": "high", "current_stage": "actions_capa"},
                {"title": "Fire Door Violation", "case_type": "violation", "severity": "high", "priority": "high", "current_stage": "resolution_verification"},
            ]

        for i, data in enumerate(seed_cases):
            case_id = str(uuid.uuid4())
            case = WorkflowCase(
                id=case_id,
                tenant_id=tenant_id,
                case_number=f"WF-{1000 + i + 1}",
                title=data["title"],
                case_type=data["case_type"],
                severity=data.get("severity", "medium"),
                priority=data.get("priority", "medium"),
                current_stage=data.get("current_stage", "risk_detected"),
                assigned_to=data.get("assigned_to", "Safety Manager"),
                site=data.get("site", "Site Alpha"),
                zone=data.get("zone"),
                source_type=data.get("source_type"),
                source_id=data.get("source_id"),
                overdue=False,
                escalated=data.get("severity") == "critical",
            )
            self.db.add(case)
            self.db.flush()  # Ensure case is persisted before adding children

            # Add initial stage event
            self.db.add(WorkflowStageEvent(
                id=str(uuid.uuid4()),
                tenant_id=tenant_id,
                case_id=case_id,
                stage=data.get("current_stage", "risk_detected"),
                entered_at=utc_now(),
                actor=user_display if (user_display := data.get("assigned_to")) else "System",
            ))

            # Add approval if in approval stage
            if data.get("current_stage") == "approvals_escalations":
                self.db.add(WorkflowApproval(
                    id=str(uuid.uuid4()),
                    tenant_id=tenant_id,
                    case_id=case_id,
                    approver="Jane Cooper",
                    approver_role="Safety Manager",
                    status="pending",
                ))

            # Add CAPA if in capa stage
            if data.get("current_stage") == "actions_capa":
                self.db.add(WorkflowCAPA(
                    id=str(uuid.uuid4()),
                    tenant_id=tenant_id,
                    case_id=case_id,
                    title=f"CAPA for {data['title'][:60]}",
                    description="Corrective action required to address root cause.",
                    assignee="Operations Lead",
                    priority=data.get("priority", "medium"),
                    status="in_progress",
                    overdue=False,
                ))

            # Add resolution if in resolution stage
            if data.get("current_stage") == "resolution_verification":
                self.db.add(WorkflowResolution(
                    id=str(uuid.uuid4()),
                    tenant_id=tenant_id,
                    case_id=case_id,
                    verified_by="Quality Manager",
                    evidence_submitted=False,
                    status="awaiting_evidence",
                ))

            # Add alert
            self.db.add(WorkflowAlert(
                id=str(uuid.uuid4()),
                tenant_id=tenant_id,
                case_id=case_id,
                alert_type="in_app",
                recipient="Safety Team",
                message=f"Workflow case {data.get('case_type', 'case')} requires attention: {data['title'][:80]}",
                sent_at=utc_now(),
                acknowledged=False,
            ))

        self.db.flush()

    def get_dashboard(self, user: CurrentUser) -> dict:
        self._ensure_seed_data(user.tenant_id)
        tid = user.tenant_id

        stage_counts = {}
        for stage in STAGES:
            c = self.db.scalar(
                select(func.count(WorkflowCase.id)).where(
                    WorkflowCase.tenant_id == tid,
                    WorkflowCase.current_stage == stage,
                )
            )
            stage_counts[stage] = c or 0

        overdue = self.db.scalar(select(func.count(WorkflowCase.id)).where(WorkflowCase.tenant_id == tid, WorkflowCase.overdue == True)) or 0
        escalated = self.db.scalar(select(func.count(WorkflowCase.id)).where(WorkflowCase.tenant_id == tid, WorkflowCase.escalated == True)) or 0

        active_cases = self.db.scalars(select(WorkflowCase).where(WorkflowCase.tenant_id == tid).limit(10)).all()
        pending_approvals = self.db.scalars(select(WorkflowApproval).where(WorkflowApproval.tenant_id == tid, WorkflowApproval.status == "pending").limit(10)).all()
        open_capas = self.db.scalars(select(WorkflowCAPA).where(WorkflowCAPA.tenant_id == tid, WorkflowCAPA.status.in_(["open", "in_progress"])).limit(10)).all()
        pending_resolutions = self.db.scalars(select(WorkflowResolution).where(WorkflowResolution.tenant_id == tid, WorkflowResolution.status != "approved").limit(10)).all()
        recent_alerts = self.db.scalars(select(WorkflowAlert).where(WorkflowAlert.tenant_id == tid).order_by(WorkflowAlert.sent_at.desc()).limit(10)).all()

        case_map = {c.id: c for c in active_cases}

        return {
            "stage_counts": stage_counts,
            "overdue_count": overdue,
            "escalated_count": escalated,
            "resolved_today": 0,
            "avg_resolution_hours": 18.4,
            "active_cases": [_serialize_case(c, self.db) for c in active_cases],
            "pending_approvals": [
                _serialize_approval(a, case_map.get(a.case_id))
                for a in pending_approvals
            ],
            "open_capas": [
                _serialize_capa(c, case_map.get(c.case_id))
                for c in open_capas
            ],
            "pending_resolutions": [
                _serialize_resolution(r, case_map.get(r.case_id))
                for r in pending_resolutions
            ],
            "recent_alerts": [_serialize_alert(a) for a in recent_alerts],
        }

    def list_cases(self, user: CurrentUser, filters: dict) -> dict:
        self._ensure_seed_data(user.tenant_id)
        stmt = select(WorkflowCase).where(WorkflowCase.tenant_id == user.tenant_id)
        if filters.get("stage"):
            stmt = stmt.where(WorkflowCase.current_stage == filters["stage"])
        if filters.get("type"):
            stmt = stmt.where(WorkflowCase.case_type == filters["type"])
        cases = self.db.scalars(stmt).all()
        return {"items": [_serialize_case(c, self.db) for c in cases]}

    def get_case(self, user: CurrentUser, case_id: str) -> dict:
        case = self.db.scalars(
            select(WorkflowCase).where(WorkflowCase.tenant_id == user.tenant_id, WorkflowCase.id == case_id)
        ).first()
        if not case:
            raise AppError("CASE_NOT_FOUND", "Workflow case not found", 404)
        return _serialize_case(case, self.db)

    def approve_case(self, user: CurrentUser, case_id: str, approval_id: str, data: dict) -> dict:
        approval = self.db.scalars(
            select(WorkflowApproval).where(WorkflowApproval.id == approval_id, WorkflowApproval.tenant_id == user.tenant_id)
        ).first()
        if not approval:
            raise AppError("APPROVAL_NOT_FOUND", "Approval not found", 404)
        approval.status = "approved"
        approval.notes = data.get("notes")
        self.db.flush()
        return {"message": "Approved successfully"}

    def reject_case(self, user: CurrentUser, case_id: str, approval_id: str, data: dict) -> dict:
        approval = self.db.scalars(
            select(WorkflowApproval).where(WorkflowApproval.id == approval_id, WorkflowApproval.tenant_id == user.tenant_id)
        ).first()
        if not approval:
            raise AppError("APPROVAL_NOT_FOUND", "Approval not found", 404)
        approval.status = "rejected"
        approval.notes = data.get("reason")
        self.db.flush()
        return {"message": "Rejected"}

    def escalate_case(self, user: CurrentUser, case_id: str, data: dict) -> dict:
        case = self.db.scalars(
            select(WorkflowCase).where(WorkflowCase.id == case_id, WorkflowCase.tenant_id == user.tenant_id)
        ).first()
        if not case:
            raise AppError("CASE_NOT_FOUND", "Case not found", 404)
        case.escalated = True
        # Update pending approval
        approval = self.db.scalars(
            select(WorkflowApproval).where(WorkflowApproval.case_id == case_id, WorkflowApproval.status == "pending")
        ).first()
        if approval:
            approval.status = "escalated"
            approval.escalated_to = data.get("escalate_to")
        self.db.flush()
        return {"message": "Escalated"}

    def advance_stage(self, user: CurrentUser, case_id: str, data: dict) -> dict:
        case = self.db.scalars(
            select(WorkflowCase).where(WorkflowCase.id == case_id, WorkflowCase.tenant_id == user.tenant_id)
        ).first()
        if not case:
            raise AppError("CASE_NOT_FOUND", "Case not found", 404)
        next_s = _next_stage(case.current_stage)
        if not next_s:
            raise AppError("ALREADY_AT_FINAL_STAGE", "Case is at final stage", 400)

        # Mark current stage event complete
        current_event = self.db.scalars(
            select(WorkflowStageEvent).where(
                WorkflowStageEvent.case_id == case_id,
                WorkflowStageEvent.stage == case.current_stage,
                WorkflowStageEvent.completed_at.is_(None),
            )
        ).first()
        if current_event:
            current_event.completed_at = utc_now()

        case.current_stage = next_s
        self.db.add(WorkflowStageEvent(
            id=str(uuid.uuid4()),
            tenant_id=user.tenant_id,
            case_id=case_id,
            stage=next_s,
            entered_at=utc_now(),
            actor=user.display_name,
            notes=data.get("notes"),
        ))
        self.db.flush()
        return _serialize_case(case, self.db)

    def submit_evidence(self, user: CurrentUser, resolution_id: str, data: dict) -> dict:
        res = self.db.scalars(
            select(WorkflowResolution).where(WorkflowResolution.id == resolution_id, WorkflowResolution.tenant_id == user.tenant_id)
        ).first()
        if not res:
            raise AppError("RESOLUTION_NOT_FOUND", "Resolution not found", 404)
        res.evidence_submitted = True
        res.status = "under_review"
        res.submitted_at = utc_now()
        res.evidence_notes = data.get("notes")
        self.db.flush()
        return {"message": "Evidence submitted"}

    def verify_resolution(self, user: CurrentUser, resolution_id: str, data: dict) -> dict:
        res = self.db.scalars(
            select(WorkflowResolution).where(WorkflowResolution.id == resolution_id, WorkflowResolution.tenant_id == user.tenant_id)
        ).first()
        if not res:
            raise AppError("RESOLUTION_NOT_FOUND", "Resolution not found", 404)
        res.status = data.get("decision", "approved")
        res.verified_by = user.display_name
        self.db.flush()
        return {"message": f"Resolution {res.status}"}

    def acknowledge_alert(self, user: CurrentUser, alert_id: str) -> dict:
        alert = self.db.scalars(
            select(WorkflowAlert).where(WorkflowAlert.id == alert_id, WorkflowAlert.tenant_id == user.tenant_id)
        ).first()
        if not alert:
            raise AppError("ALERT_NOT_FOUND", "Alert not found", 404)
        alert.acknowledged = True
        alert.acknowledged_at = utc_now()
        self.db.flush()
        return {}
