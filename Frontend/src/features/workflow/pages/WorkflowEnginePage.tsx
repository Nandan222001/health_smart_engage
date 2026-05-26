import { useState } from "react";
import {
  AlertTriangle, Bell, GitBranch, UserCheck, ClipboardList,
  CheckCircle2, Database, ChevronRight, Clock, ArrowUpRight,
  TrendingUp, Zap, XCircle, AlertCircle, Play, Plus, Trash2, Loader2, X,
} from "lucide-react";
import { useGetWorkflowDashboardQuery } from "@/features/workflow/api/workflowEngineApi";
import {
  useListEscalationRulesQuery,
  useCreateEscalationRuleMutation,
  useDeleteEscalationRuleMutation,
} from "@/features/workflow/api/escalationRulesApi";
import type { EscalationRule } from "@/features/workflow/api/escalationRulesApi";
import type {
  WorkflowCase, ApprovalRequest, WorkflowCAPA,
  ResolutionItem, WorkflowAlert, WorkflowStage, CaseSeverity,
} from "@/features/workflow/api/workflowEngineApi";

// ─── Mock data ─────────────────────────────────────────────────────────────

const now = new Date().toISOString();
const h = (n: number) => new Date(Date.now() - n * 3_600_000).toISOString();

const MOCK_CASES: WorkflowCase[] = [
  { id: "c1", case_number: "WF-2024-001", title: "PPE violation — Zone 4 Main Factory", type: "violation", severity: "high", current_stage: "approvals_escalations", priority: "high", assigned_to: "Ravi Kumar", site: "Main Factory", zone: "Zone 4", created_at: h(5), updated_at: h(1), due_at: h(-2), overdue: true, escalated: false, stage_history: [{ stage: "risk_detected", entered_at: h(5), completed_at: h(4), actor: "AI Camera" }, { stage: "alerts_sent", entered_at: h(4), completed_at: h(4), actor: "System" }, { stage: "workflow_triggered", entered_at: h(4), completed_at: h(3), actor: "Auto" }, { stage: "approvals_escalations", entered_at: h(3) }] },
  { id: "c2", case_number: "WF-2024-002", title: "Conveyor belt maintenance — permit required", type: "permit", severity: "critical", current_stage: "workflow_triggered", priority: "critical", assigned_to: "Sarah Lee", site: "Warehouse A", created_at: h(2), updated_at: h(0.5), due_at: h(-1), overdue: true, escalated: true, stage_history: [{ stage: "risk_detected", entered_at: h(2), completed_at: h(1.5), actor: "Inspector" }, { stage: "alerts_sent", entered_at: h(1.5), completed_at: h(1.2), actor: "System" }, { stage: "workflow_triggered", entered_at: h(1.2) }] },
  { id: "c3", case_number: "WF-2024-003", title: "Chemical spill near-miss — Dock 3", type: "near_miss", severity: "medium", current_stage: "actions_capa", priority: "medium", assigned_to: "James O.", site: "Warehouse A", zone: "Dock 3", created_at: h(12), updated_at: h(3), overdue: false, escalated: false, stage_history: [{ stage: "risk_detected", entered_at: h(12), completed_at: h(11) }, { stage: "alerts_sent", entered_at: h(11), completed_at: h(10.5) }, { stage: "workflow_triggered", entered_at: h(10.5), completed_at: h(10) }, { stage: "approvals_escalations", entered_at: h(10), completed_at: h(8), actor: "Mgr. Singh" }, { stage: "actions_capa", entered_at: h(8) }] },
  { id: "c4", case_number: "WF-2024-004", title: "Electrical hazard — switchboard room", type: "hazard", severity: "critical", current_stage: "resolution_verification", priority: "critical", assigned_to: "Maria G.", site: "Main Factory", created_at: h(48), updated_at: h(6), overdue: false, escalated: false, stage_history: [{ stage: "risk_detected", entered_at: h(48) }, { stage: "alerts_sent", entered_at: h(47) }, { stage: "workflow_triggered", entered_at: h(46) }, { stage: "approvals_escalations", entered_at: h(44), completed_at: h(36) }, { stage: "actions_capa", entered_at: h(36), completed_at: h(12) }, { stage: "resolution_verification", entered_at: h(12) }] },
  { id: "c5", case_number: "WF-2024-005", title: "Audit finding — fire exit blocked", type: "audit_finding", severity: "medium", current_stage: "records_updated", priority: "medium", assigned_to: "System", site: "Office Block", created_at: h(72), updated_at: h(2), overdue: false, escalated: false, stage_history: [{ stage: "risk_detected", entered_at: h(72) }, { stage: "alerts_sent", entered_at: h(71) }, { stage: "workflow_triggered", entered_at: h(70) }, { stage: "approvals_escalations", entered_at: h(68), completed_at: h(64) }, { stage: "actions_capa", entered_at: h(64), completed_at: h(24) }, { stage: "resolution_verification", entered_at: h(24), completed_at: h(4) }, { stage: "records_updated", entered_at: h(4) }] },
];

const MOCK_APPROVALS: ApprovalRequest[] = [
  { id: "a1", case_id: "c1", case_number: "WF-2024-001", case_title: "PPE violation — Zone 4", case_type: "violation", severity: "high", approver: "Mgr. Patel", approver_role: "HSE Manager", status: "pending", requested_at: h(3), due_at: h(-2), overdue: true, escalated_to: undefined },
  { id: "a2", case_id: "c2", case_number: "WF-2024-002", case_title: "Conveyor belt permit", case_type: "permit", severity: "critical", approver: "Dir. Walsh", approver_role: "Site Director", status: "escalated", requested_at: h(1), due_at: h(-0.5), overdue: true, escalated_to: "VP Operations" },
  { id: "a3", case_id: "c6", case_number: "WF-2024-006", case_title: "Hot work permit — Roof section B", case_type: "permit", severity: "high", approver: "Mgr. Diaz", approver_role: "Safety Manager", status: "pending", requested_at: h(0.5), due_at: h(3), overdue: false },
];

const MOCK_CAPAS: WorkflowCAPA[] = [
  { id: "cp1", case_id: "c3", case_number: "WF-2024-003", title: "Install secondary spill containment at Dock 3", description: "Chemical spill risk requires secondary bunded containment around storage rack.", assignee: "Facilities Team", priority: "high", due_date: h(-24), status: "in_progress", root_cause: "Inadequate secondary containment", created_at: h(8), overdue: true },
  { id: "cp2", case_id: "c3", case_number: "WF-2024-003", title: "COSHH refresher for Dock workers", description: "All Dock 3 workers to complete COSHH refresher training within 7 days.", assignee: "HR Training", priority: "medium", due_date: h(72), status: "open", created_at: h(8), overdue: false },
  { id: "cp3", case_id: "c4", case_number: "WF-2024-004", title: "Switchboard room electrical inspection", description: "Full PAT inspection and thermal imaging of switchboard panel.", assignee: "Electrical Team", priority: "critical", due_date: h(0), status: "pending_closure", root_cause: "Overloaded circuits, heat build-up", created_at: h(36), overdue: false },
];

const MOCK_RESOLUTIONS: ResolutionItem[] = [
  { id: "rv1", case_id: "c4", case_number: "WF-2024-004", case_title: "Electrical hazard — switchboard room", verified_by: "Lead Inspector", verification_due: h(-6), evidence_submitted: true, status: "under_review", submitted_at: h(9) },
  { id: "rv2", case_id: "c7", case_number: "WF-2024-007", case_title: "Slippery floor — canteen entrance", verified_by: "Safety Manager", verification_due: h(12), evidence_submitted: false, status: "awaiting_evidence" },
];

const MOCK_ALERTS: WorkflowAlert[] = [
  { id: "al1", case_id: "c1", case_title: "PPE violation — Zone 4", type: "push", recipient: "Ravi Kumar", message: "Action required: PPE violation case WF-2024-001 is overdue for approval.", sent_at: h(1), acknowledged: false },
  { id: "al2", case_id: "c2", case_title: "Conveyor belt permit", type: "email", recipient: "Dir. Walsh", message: "ESCALATED: Permit request WF-2024-002 has been escalated to VP Operations.", sent_at: h(0.5), acknowledged: false },
  { id: "al3", case_id: "c3", case_title: "Chemical spill near-miss", type: "sms", recipient: "James O.", message: "CAPA WF-2024-003/cp1 is now overdue. Immediate action required.", sent_at: h(0.25), acknowledged: true, acknowledged_at: h(0.1) },
];

const MOCK_STAGE_COUNTS: Record<WorkflowStage, number> = {
  risk_detected: 2,
  alerts_sent: 1,
  workflow_triggered: 1,
  approvals_escalations: 3,
  actions_capa: 2,
  resolution_verification: 2,
  records_updated: 14,
};

const MOCK_DASHBOARD = {
  stage_counts: MOCK_STAGE_COUNTS,
  overdue_count: 4,
  escalated_count: 1,
  resolved_today: 3,
  avg_resolution_hours: 28.4,
  active_cases: MOCK_CASES,
  pending_approvals: MOCK_APPROVALS,
  open_capas: MOCK_CAPAS,
  pending_resolutions: MOCK_RESOLUTIONS,
  recent_alerts: MOCK_ALERTS,
};

// ─── Pipeline stage definitions ────────────────────────────────────────────

const SEV_COLOR: Record<CaseSeverity, string> = {
  low: "#10B981", medium: "#F59E0B", high: "#F97316", critical: "#EF4444",
};

const STAGE_DEF: { id: WorkflowStage; label: string; sub: string; icon: typeof AlertTriangle; color: string; bg: string }[] = [
  { id: "risk_detected",          label: "Risk / Issue Detected",    sub: "Trigger point",            icon: AlertTriangle,  color: "#EF4444", bg: "#FEE2E2" },
  { id: "alerts_sent",            label: "Alerts & Notifications",   sub: "Notify stakeholders",      icon: Bell,           color: "#F97316", bg: "#FFEDD5" },
  { id: "workflow_triggered",     label: "Workflow Triggered",       sub: "Route to template",        icon: GitBranch,      color: "#F59E0B", bg: "#FEF3C7" },
  { id: "approvals_escalations",  label: "Approvals & Escalations",  sub: "Route to approvers",       icon: UserCheck,      color: "#06B6D4", bg: "#ECFEFF" },
  { id: "actions_capa",           label: "Actions / CAPA Created",   sub: "Corrective actions",       icon: ClipboardList,  color: "#8B5CF6", bg: "#F5F3FF" },
  { id: "resolution_verification",label: "Resolution & Verification","sub": "Verify closure evidence", icon: CheckCircle2,   color: "#10B981", bg: "#D1FAE5" },
  { id: "records_updated",        label: "Records Updated",          sub: "Audit trail complete",     icon: Database,       color: "#4A57B9", bg: "#EEF2FB" },
];

// ─── Shared helpers ────────────────────────────────────────────────────────

function SevBadge({ severity }: { severity: CaseSeverity }) {
  const color = SEV_COLOR[severity];
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ background: color + "1A", color }}>{severity}</span>;
}

function OverdueBadge() {
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ background: "#FEE2E2", color: "#EF4444" }}>Overdue</span>;
}

function EscalatedBadge() {
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ background: "#FEF3C7", color: "#D97706" }}>Escalated</span>;
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 60) return `${Math.round(diff)}m ago`;
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
  return `${Math.round(diff / 1440)}d ago`;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border ${className}`} style={{ borderColor: "#E3E9F6" }}>{children}</div>;
}

function CardHeader({ title, sub, count, countColor = "#EF4444" }: { title: string; sub?: string; count?: number; countColor?: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E9EEF8" }}>
      <div>
        <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>{title}</h2>
        {sub && <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{sub}</p>}
      </div>
      {count !== undefined && (
        <span className="text-sm font-bold px-2.5 py-0.5 rounded-full" style={{ background: countColor + "1A", color: countColor }}>{count}</span>
      )}
    </div>
  );
}

// ─── 1. Pipeline Visualiser ────────────────────────────────────────────────

function PipelineBar({ counts, total }: { counts: Record<WorkflowStage, number>; total: number }) {
  return (
    <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#9CA3AF" }}>Layer 5 — Decision & Workflow Engine</p>
      <div className="flex items-start gap-1 overflow-x-auto pb-2">
        {STAGE_DEF.map((stage, i) => {
          const count = counts[stage.id] ?? 0;
          const Icon = stage.icon;
          return (
            <div key={stage.id} className="flex items-center gap-1 flex-shrink-0">
              <div className="flex flex-col items-center gap-2 w-[110px]">
                {/* Icon + count bubble */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: stage.bg }}>
                    <Icon className="w-5 h-5" style={{ color: stage.color }} />
                  </div>
                  {count > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-black" style={{ background: stage.color }}>
                      {count}
                    </div>
                  )}
                </div>
                {/* Label */}
                <div className="text-center">
                  <div className="text-[10px] font-semibold leading-tight text-center" style={{ color: "#374151" }}>{stage.label}</div>
                  <div className="text-[9px] mt-0.5 text-center" style={{ color: "#9CA3AF" }}>{stage.sub}</div>
                </div>
                {/* Stage volume bar */}
                <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                  <div className="h-full rounded-full" style={{ width: total > 0 ? `${(count / total) * 100}%` : "0%", background: stage.color }} />
                </div>
              </div>
              {i < STAGE_DEF.length - 1 && (
                <ChevronRight className="w-4 h-4 flex-shrink-0 mt-[-20px]" style={{ color: "#D1D5DB" }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 2. Active Workflow Cases ──────────────────────────────────────────────

function StageChip({ stage }: { stage: WorkflowStage }) {
  const def = STAGE_DEF.find((s) => s.id === stage)!;
  const Icon = def.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: def.bg, color: def.color }}>
      <Icon className="w-3 h-3" />{def.label}
    </span>
  );
}

function CaseTimeline({ history }: { history: WorkflowCase["stage_history"] }) {
  return (
    <div className="flex items-center gap-1 mt-2 overflow-x-auto">
      {STAGE_DEF.map((def, i) => {
        const event = history.find((h) => h.stage === def.id);
        const done = Boolean(event?.completed_at);
        const active = event && !event.completed_at;
        return (
          <div key={def.id} className="flex items-center gap-1 flex-shrink-0">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              title={def.label}
              style={{ background: done ? def.color : active ? def.bg : "#F3F4F6", border: active ? `2px solid ${def.color}` : "none" }}
            >
              {done && <CheckCircle2 className="w-3 h-3 text-white" />}
              {active && <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: def.color }} />}
            </div>
            {i < STAGE_DEF.length - 1 && (
              <div className="w-4 h-px" style={{ background: done ? def.color : "#E5E7EB" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CaseRow({ wc }: { wc: WorkflowCase }) {
  return (
    <div className="px-5 py-4 border-b last:border-0 hover:bg-gray-50 transition-colors" style={{ borderColor: "#F3F4F6" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-semibold" style={{ color: "#9CA3AF" }}>{wc.case_number}</span>
            <SevBadge severity={wc.severity} />
            {wc.overdue && <OverdueBadge />}
            {wc.escalated && <EscalatedBadge />}
          </div>
          <div className="text-sm font-semibold mt-1" style={{ color: "#111827" }}>{wc.title}</div>
          <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
            {[wc.site, wc.zone].filter(Boolean).join(" · ")} — {timeAgo(wc.created_at)}
          </div>
          <CaseTimeline history={wc.stage_history} />
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <StageChip stage={wc.current_stage} />
          {wc.assigned_to && (
            <span className="text-xs" style={{ color: "#9CA3AF" }}>→ {wc.assigned_to}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ActiveCasesPanel({ cases }: { cases: WorkflowCase[] }) {
  const [filter, setFilter] = useState<WorkflowStage | "all">("all");
  const filtered = filter === "all" ? cases : cases.filter((c) => c.current_stage === filter);

  return (
    <Card>
      <CardHeader title="Active Workflow Cases" sub="All cases currently moving through the pipeline" count={cases.filter((c) => c.current_stage !== "records_updated").length} />
      <div className="px-5 py-3 border-b flex gap-2 overflow-x-auto" style={{ borderColor: "#E9EEF8" }}>
        <button
          onClick={() => setFilter("all")}
          className="flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition-all"
          style={filter === "all" ? { background: "#4A57B9", color: "#fff" } : { background: "#F3F4F6", color: "#6B7280" }}
        >
          All
        </button>
        {STAGE_DEF.map((s) => (
          <button
            key={s.id}
            onClick={() => setFilter(s.id)}
            className="flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition-all"
            style={filter === s.id ? { background: s.color, color: "#fff" } : { background: "#F3F4F6", color: "#6B7280" }}
          >
            {s.label.split(" ")[0]}
          </button>
        ))}
      </div>
      <div className="divide-y" style={{ borderColor: "#F3F4F6" }}>
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-sm" style={{ color: "#9CA3AF" }}>No cases in this stage</div>
        ) : (
          filtered.map((wc) => <CaseRow key={wc.id} wc={wc} />)
        )}
      </div>
    </Card>
  );
}

// ─── 3. Approval Queue ────────────────────────────────────────────────────

function ApprovalQueue({ approvals }: { approvals: ApprovalRequest[] }) {
  const pending = approvals.filter((a) => a.status === "pending" || a.status === "escalated");

  return (
    <Card>
      <CardHeader title="Approval Queue" sub="Items awaiting decision or escalation" count={pending.length} countColor="#06B6D4" />
      <div className="divide-y" style={{ borderColor: "#F3F4F6" }}>
        {pending.length === 0 ? (
          <div className="py-10 text-center text-sm" style={{ color: "#9CA3AF" }}>No pending approvals</div>
        ) : pending.map((ap) => (
          <div key={ap.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-mono" style={{ color: "#9CA3AF" }}>{ap.case_number}</span>
                  <SevBadge severity={ap.severity} />
                  {ap.overdue && <OverdueBadge />}
                  {ap.status === "escalated" && <EscalatedBadge />}
                </div>
                <div className="text-sm font-semibold" style={{ color: "#111827" }}>{ap.case_title}</div>
                <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                  Approver: <span className="font-medium" style={{ color: "#374151" }}>{ap.approver}</span> ({ap.approver_role})
                  {ap.escalated_to && <> · Escalated to: <span className="font-medium" style={{ color: "#D97706" }}>{ap.escalated_to}</span></>}
                </div>
                {ap.overdue && (
                  <div className="flex items-center gap-1 text-xs mt-1" style={{ color: "#EF4444" }}>
                    <Clock className="w-3 h-3" /> Due {timeAgo(ap.due_at)} — overdue
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "#10B981" }}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                </button>
                <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "#EF4444" }}>
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
                <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
                  <ArrowUpRight className="w-3.5 h-3.5" /> Escalate
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── 4. Open CAPAs ────────────────────────────────────────────────────────

const CAPA_STATUS_COLOR: Record<string, string> = {
  open: "#EF4444", in_progress: "#F59E0B", pending_closure: "#8B5CF6", closed: "#10B981",
};

function CAPAPanel({ capas }: { capas: WorkflowCAPA[] }) {
  return (
    <Card>
      <CardHeader title="Actions / CAPA" sub="Corrective and preventive actions from workflow cases" count={capas.filter((c) => c.status !== "closed").length} countColor="#8B5CF6" />
      <div className="divide-y" style={{ borderColor: "#F3F4F6" }}>
        {capas.map((capa) => {
          const statusColor = CAPA_STATUS_COLOR[capa.status];
          return (
            <div key={capa.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-mono" style={{ color: "#9CA3AF" }}>{capa.case_number}</span>
                    <SevBadge severity={capa.priority} />
                    {capa.overdue && <OverdueBadge />}
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: statusColor + "1A", color: statusColor }}>{capa.status.replace(/_/g, " ")}</span>
                  </div>
                  <div className="text-sm font-semibold" style={{ color: "#111827" }}>{capa.title}</div>
                  <div className="text-xs mt-0.5 line-clamp-1" style={{ color: "#9CA3AF" }}>{capa.description}</div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs" style={{ color: "#9CA3AF" }}>
                    <span>→ {capa.assignee}</span>
                    <span>Due: {new Date(capa.due_date).toLocaleDateString()}</span>
                    {capa.root_cause && <span>RC: {capa.root_cause}</span>}
                  </div>
                </div>
                <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border flex-shrink-0" style={{ borderColor: "#8B5CF6", color: "#8B5CF6" }}>
                  <Play className="w-3 h-3" /> Update
                </button>
              </div>
            </div>
          );
        })}
        {capas.length === 0 && (
          <div className="py-10 text-center text-sm" style={{ color: "#9CA3AF" }}>No open CAPAs</div>
        )}
      </div>
    </Card>
  );
}

// ─── 5. Resolution & Verification ─────────────────────────────────────────

const RES_STATUS_COLOR: Record<string, string> = {
  awaiting_evidence: "#F59E0B",
  under_review: "#06B6D4",
  approved: "#10B981",
  rejected: "#EF4444",
};

function ResolutionPanel({ resolutions }: { resolutions: ResolutionItem[] }) {
  return (
    <Card>
      <CardHeader title="Resolution & Verification" sub="Evidence review before closing cases" count={resolutions.filter((r) => r.status !== "approved").length} countColor="#10B981" />
      <div className="divide-y" style={{ borderColor: "#F3F4F6" }}>
        {resolutions.map((r) => {
          const color = RES_STATUS_COLOR[r.status];
          return (
            <div key={r.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono" style={{ color: "#9CA3AF" }}>{r.case_number}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: color + "1A", color }}>{r.status.replace(/_/g, " ")}</span>
                  </div>
                  <div className="text-sm font-semibold" style={{ color: "#111827" }}>{r.case_title}</div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs" style={{ color: "#9CA3AF" }}>
                    {r.verified_by && <span>Verifier: {r.verified_by}</span>}
                    <span>Due: {new Date(r.verification_due).toLocaleDateString()}</span>
                    <span className={r.evidence_submitted ? "text-green-600" : "text-amber-600"} style={{ fontWeight: 600 }}>
                      Evidence: {r.evidence_submitted ? "Submitted" : "Pending"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {r.evidence_submitted && r.status === "under_review" && (
                    <>
                      <button type="button" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "#10B981" }}>Verify</button>
                      <button type="button" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "#EF4444" }}>Reject</button>
                    </>
                  )}
                  {!r.evidence_submitted && (
                    <button type="button" className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: "#F59E0B", color: "#D97706" }}>Request Evidence</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {resolutions.length === 0 && (
          <div className="py-10 text-center text-sm" style={{ color: "#9CA3AF" }}>No items pending verification</div>
        )}
      </div>
    </Card>
  );
}

// ─── 6. Alerts Feed ───────────────────────────────────────────────────────

const ALERT_ICON: Record<string, typeof Bell> = {
  email: Bell, sms: Bell, push: Bell, in_app: Bell,
};

const ALERT_COLOR: Record<string, string> = {
  email: "#4A57B9", sms: "#10B981", push: "#F97316", in_app: "#8B5CF6",
};

function AlertsPanel({ alerts }: { alerts: WorkflowAlert[] }) {
  return (
    <Card>
      <CardHeader title="Alerts & Notifications" sub="Sent by workflow engine" count={alerts.filter((a) => !a.acknowledged).length} countColor="#F97316" />
      <div className="divide-y" style={{ borderColor: "#F3F4F6" }}>
        {alerts.map((alert) => {
          const Icon = ALERT_ICON[alert.type] ?? Bell;
          const color = ALERT_COLOR[alert.type];
          return (
            <div key={alert.id} className="flex items-start gap-3 px-5 py-4" style={{ background: alert.acknowledged ? undefined : "#FFFBF5" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "1A" }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold uppercase" style={{ color }}>{alert.type}</span>
                  <span className="text-xs" style={{ color: "#9CA3AF" }}>→ {alert.recipient}</span>
                  <span className="text-xs ml-auto" style={{ color: "#9CA3AF" }}>{timeAgo(alert.sent_at)}</span>
                </div>
                <div className="text-sm font-semibold" style={{ color: "#111827" }}>{alert.case_title}</div>
                <div className="text-xs mt-0.5 line-clamp-2" style={{ color: "#6B7280" }}>{alert.message}</div>
              </div>
              {!alert.acknowledged && (
                <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: "#F97316" }} />
              )}
            </div>
          );
        })}
        {alerts.length === 0 && (
          <div className="py-10 text-center text-sm" style={{ color: "#9CA3AF" }}>No recent alerts</div>
        )}
      </div>
    </Card>
  );
}

// ─── 7. Escalation Rules ──────────────────────────────────────────────────────

const TRIGGER_EVENTS = [
  "permit_submitted",
  "permit_overdue",
  "incident_critical",
  "capa_overdue",
  "approval_pending",
  "near_miss_reported",
  "high_risk_assessment",
];

const ROLES = ["HSE Manager", "Site Manager", "Operations Director", "VP Safety", "CEO", "Admin"];
const NOTIFY_VIA_OPTIONS = ["email", "sms", "push", "in_app"];

interface EscRuleForm {
  name: string;
  trigger_event: string;
  delay_minutes: number;
  escalate_to_role: string;
  notify_via: string[];
  description: string;
}

const EMPTY_ESC_FORM: EscRuleForm = {
  name: "",
  trigger_event: "permit_overdue",
  delay_minutes: 60,
  escalate_to_role: "HSE Manager",
  notify_via: ["email"],
  description: "",
};

function EscalationRulesPanel() {
  const { data: rules = [], isLoading } = useListEscalationRulesQuery();
  const [createRule, { isLoading: creating }] = useCreateEscalationRuleMutation();
  const [deleteRule] = useDeleteEscalationRuleMutation();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EscRuleForm>(EMPTY_ESC_FORM);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function toggleNotify(channel: string) {
    setForm((f) => ({
      ...f,
      notify_via: f.notify_via.includes(channel)
        ? f.notify_via.filter((c) => c !== channel)
        : [...f.notify_via, channel],
    }));
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    await createRule({ ...form, is_active: true });
    setForm(EMPTY_ESC_FORM);
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this escalation rule?")) return;
    setDeletingId(id);
    await deleteRule(id);
    setDeletingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>Escalation Rules</h2>
          <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>Auto-escalate workflow items when conditions are met</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
        >
          <Plus className="w-4 h-4" /> Add Rule
        </button>
      </div>

      {showForm && (
        <Card>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E9EEF8" }}>
            <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>New Escalation Rule</h3>
            <button onClick={() => { setForm(EMPTY_ESC_FORM); setShowForm(false); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold" style={{ color: "#374151" }}>Rule Name *</label>
              <input className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E3E9F6" }} placeholder="e.g. Permit Overdue → Director" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: "#374151" }}>Trigger Event</label>
              <select className="w-full px-3 py-2.5 rounded-xl border text-sm bg-white outline-none" style={{ borderColor: "#E3E9F6" }} value={form.trigger_event} onChange={(e) => setForm((f) => ({ ...f, trigger_event: e.target.value }))}>
                {TRIGGER_EVENTS.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: "#374151" }}>Delay (minutes)</label>
              <input type="number" min={0} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E3E9F6" }} value={form.delay_minutes} onChange={(e) => setForm((f) => ({ ...f, delay_minutes: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: "#374151" }}>Escalate To Role</label>
              <select className="w-full px-3 py-2.5 rounded-xl border text-sm bg-white outline-none" style={{ borderColor: "#E3E9F6" }} value={form.escalate_to_role} onChange={(e) => setForm((f) => ({ ...f, escalate_to_role: e.target.value }))}>
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: "#374151" }}>Notify Via</label>
              <div className="flex gap-2 flex-wrap">
                {NOTIFY_VIA_OPTIONS.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => toggleNotify(ch)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize"
                    style={form.notify_via.includes(ch)
                      ? { background: "#4A57B9", color: "#fff", borderColor: "#4A57B9" }
                      : { background: "#F3F4F6", color: "#6B7280", borderColor: "#E3E9F6" }}
                  >
                    {ch.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold" style={{ color: "#374151" }}>Description</label>
              <input className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E3E9F6" }} placeholder="Optional description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <div className="px-5 pb-5 flex gap-3">
            <button onClick={handleSave} disabled={creating || !form.name.trim()} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-60" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save Rule
            </button>
            <button onClick={() => { setForm(EMPTY_ESC_FORM); setShowForm(false); }} className="px-4 py-2 rounded-xl border text-sm font-semibold" style={{ borderColor: "#E3E9F6", color: "#374151" }}>Cancel</button>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Active Escalation Rules" sub="Rules that auto-escalate workflow items" count={rules.filter((r) => (r as EscalationRule & { is_active?: boolean }).is_active !== false).length} countColor="#4A57B9" />
        <div className="divide-y" style={{ borderColor: "#F3F4F6" }}>
          {isLoading ? (
            <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "#4A57B9" }} /></div>
          ) : rules.length === 0 ? (
            <div className="py-12 text-center text-sm" style={{ color: "#9CA3AF" }}>No escalation rules yet. Add one above.</div>
          ) : rules.map((rule) => (
            <div key={rule.id} className="px-5 py-4 hover:bg-gray-50 flex items-start justify-between gap-3 group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#EEF2FF", color: "#4A57B9" }}>
                    {(rule.trigger_event || "—").replace(/_/g, " ")}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#D1FAE5", color: "#059669" }}>
                    +{rule.delay_minutes || 0}m delay
                  </span>
                  {(rule.notify_via || []).map((ch: string) => (
                    <span key={ch} className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: "#FEF3C7", color: "#D97706" }}>{ch}</span>
                  ))}
                </div>
                <div className="text-sm font-semibold" style={{ color: "#111827" }}>{rule.name}</div>
                <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                  Escalates to: <span className="font-medium" style={{ color: "#374151" }}>{rule.escalate_to_role}</span>
                  {rule.description && <> · {rule.description}</>}
                </div>
              </div>
              <button
                onClick={() => handleDelete(rule.id)}
                disabled={deletingId === rule.id}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all disabled:opacity-50"
                title="Delete rule"
              >
                {deletingId === rule.id
                  ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#EF4444" }} />
                  : <Trash2 className="w-4 h-4" style={{ color: "#EF4444" }} />}
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

type TabId = "overview" | "cases" | "approvals" | "capas" | "resolution" | "alerts" | "escalation";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview",    label: "Overview" },
  { id: "cases",       label: "Active Cases" },
  { id: "approvals",   label: "Approval Queue" },
  { id: "capas",       label: "Actions / CAPA" },
  { id: "resolution",  label: "Resolution" },
  { id: "alerts",      label: "Alerts" },
  { id: "escalation",  label: "Escalation Rules" },
];

export function WorkflowEnginePage() {
  const [tab, setTab] = useState<TabId>("overview");
  const { data: raw } = useGetWorkflowDashboardQuery();
  const d = raw ?? MOCK_DASHBOARD;

  const total = Object.values(d.stage_counts).reduce((s, v) => s + v, 0);

  const kpis = [
    { label: "Active Cases",       value: d.active_cases.filter((c) => c.current_stage !== "records_updated").length, icon: GitBranch,    color: "#4A57B9" },
    { label: "Overdue",            value: d.overdue_count,        icon: Clock,        color: "#EF4444" },
    { label: "Escalated",          value: d.escalated_count,      icon: ArrowUpRight, color: "#D97706" },
    { label: "Resolved Today",     value: d.resolved_today,       icon: CheckCircle2, color: "#10B981" },
    { label: "Avg Resolution",     value: `${d.avg_resolution_hours}h`, icon: TrendingUp,  color: "#8B5CF6" },
    { label: "Pending Approvals",  value: d.pending_approvals.filter((a) => a.status === "pending").length, icon: UserCheck,    color: "#06B6D4" },
    { label: "Open CAPAs",         value: d.open_capas.filter((c) => c.status !== "closed").length, icon: ClipboardList, color: "#F97316" },
    { label: "Unread Alerts",      value: d.recent_alerts.filter((a) => !a.acknowledged).length, icon: Bell,          color: "#F59E0B" },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Decision & Workflow Engine</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Layer 5 — Risk Detected → Alerts → Workflow → Approvals → CAPA → Verification → Records</p>
      </div>

      {/* 7-stage pipeline bar */}
      <PipelineBar counts={d.stage_counts} total={total} />

      {/* KPI strip */}
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border p-3 flex flex-col items-center gap-1 text-center" style={{ borderColor: "#E3E9F6" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + "18" }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="text-lg font-black" style={{ color }}>{value}</div>
            <div className="text-[10px] font-medium leading-tight" style={{ color: "#9CA3AF" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(({ id, label }) => {
          const badges: Partial<Record<TabId, number>> = {
            approvals: d.pending_approvals.filter((a) => a.status === "pending" || a.status === "escalated").length,
            capas: d.open_capas.filter((c) => c.status !== "closed").length,
            resolution: d.pending_resolutions.filter((r) => r.status !== "approved").length,
            alerts: d.recent_alerts.filter((a) => !a.acknowledged).length,
          };
          const badge = badges[id];
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={tab === id
                ? { background: "#4A57B9", color: "#fff", boxShadow: "0 4px 10px rgba(74,87,185,0.25)" }
                : { background: "#F3F4F6", color: "#6B7280" }}
            >
              {label}
              {badge != null && badge > 0 && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full" style={{ background: tab === id ? "rgba(255,255,255,0.25)" : "#EF444430", color: tab === id ? "#fff" : "#EF4444" }}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="space-y-5">
        {(tab === "overview" || tab === "cases")      && <ActiveCasesPanel cases={d.active_cases} />}
        {(tab === "overview" || tab === "approvals")  && <ApprovalQueue approvals={d.pending_approvals} />}
        {(tab === "overview" || tab === "capas")      && <CAPAPanel capas={d.open_capas} />}
        {(tab === "overview" || tab === "resolution") && <ResolutionPanel resolutions={d.pending_resolutions} />}
        {(tab === "overview" || tab === "alerts")     && <AlertsPanel alerts={d.recent_alerts} />}
        {tab === "escalation"                         && <EscalationRulesPanel />}
      </div>
    </div>
  );
}
