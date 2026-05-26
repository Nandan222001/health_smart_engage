import { useState, useMemo } from "react";
import {
  ClipboardList, CheckCircle2, XCircle, Clock, AlertTriangle,
  RefreshCw, ChevronRight, ArrowUpCircle, RotateCcw,
  Shield, Flame, Zap, ArrowUpFromLine, Disc, Layers, Lock,
  FileText, TrendingUp, Ban,
} from "lucide-react";
import {
  useListPermitsQuery,
  useApprovePermitMutation,
  useRejectPermitMutation,
  useUpdatePermitMutation,
} from "@/features/permits/api/permitsApi";
import type { Permit } from "@/features/permits/api/permitsApi";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Tab = "pending" | "escalated" | "sla" | "history";

const SLA_WARNING_H  = 24;
const SLA_OVERDUE_H  = 48;
const SLA_ESCALATE_H = 72;

function hoursSince(d: string): number {
  if (!d) return 0;
  return Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 3_600_000));
}

interface SlaTone { label: string; color: string; bg: string; border: string; }
function slaTone(h: number): SlaTone {
  if (h >= SLA_ESCALATE_H) return { label: "Escalated",  color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" };
  if (h >= SLA_OVERDUE_H)  return { label: "Overdue",    color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" };
  if (h >= SLA_WARNING_H)  return { label: "Warning",    color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" };
  return                          { label: "On Time",    color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" };
}

function fmtHours(h: number): string {
  if (h < 1)   return "< 1h";
  if (h < 24)  return `${h}h`;
  const d = Math.floor(h / 24), r = h % 24;
  return r > 0 ? `${d}d ${r}h` : `${d}d`;
}

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

interface TypeCfg { icon: typeof Flame; color: string; bg: string; riskLabel: string; riskColor: string; }
const TYPE_CFG: Record<string, TypeCfg> = {
  "Hot Work":        { icon: Flame,           color: "#DC2626", bg: "#FEF2F2", riskLabel: "High Risk",   riskColor: "#DC2626" },
  "Electrical Work": { icon: Zap,             color: "#D97706", bg: "#FFFBEB", riskLabel: "High Risk",   riskColor: "#EA580C" },
  "Work at Height":  { icon: ArrowUpFromLine, color: "#2563EB", bg: "#EFF6FF", riskLabel: "High Risk",   riskColor: "#EA580C" },
  "Confined Space":  { icon: Disc,            color: "#7C3AED", bg: "#F5F3FF", riskLabel: "Critical",    riskColor: "#DC2626" },
  "Excavation":      { icon: Layers,          color: "#EA580C", bg: "#FFF7ED", riskLabel: "High Risk",   riskColor: "#EA580C" },
  "Isolation/LOTO":  { icon: Lock,            color: "#374151", bg: "#F3F4F6", riskLabel: "Controlled",  riskColor: "#6B7280" },
};
function getTypeCfg(type: string): TypeCfg {
  const k = Object.keys(TYPE_CFG).find((k) => type?.toLowerCase().includes(k.toLowerCase()));
  return k ? TYPE_CFG[k] : { icon: FileText, color: "#6B7280", bg: "#F9FAFB", riskLabel: "Standard", riskColor: "#6B7280" };
}

// Multi-level approval steps derived from status
interface Step { label: string; role: string; done: boolean; active: boolean; }
function approvalSteps(status: string): Step[] {
  const submitted = status !== "draft";
  const l1Done    = ["approved", "active", "closed"].includes(status);
  const l2Done    = ["active", "closed"].includes(status);
  return [
    { label: "Submitted",         role: "Requester",      done: submitted, active: submitted && !l1Done },
    { label: "Supervisor Review", role: "Site Supervisor", done: l1Done,    active: submitted && !l1Done },
    { label: "HSE Manager",       role: "HSE Manager",     done: l2Done,    active: l1Done && !l2Done },
    { label: "Activated",         role: "System",          done: l2Done,    active: false },
  ];
}

// ---------------------------------------------------------------------------
// Multi-Level Approval Tracker
// ---------------------------------------------------------------------------

function ApprovalTracker({ status }: { status: string }) {
  const steps = approvalSteps(status);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 12, marginBottom: 4 }}>
      {steps.map((s, i) => (
        <div key={s.label} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              background: s.done ? "#16A34A" : s.active ? "#D97706" : "#E5E7EB",
              border: s.active ? "2px solid #D97706" : "none",
              flexShrink: 0,
            }}>
              {s.done
                ? <CheckCircle2 size={14} color="#fff" />
                : s.active
                  ? <Clock size={12} color="#fff" />
                  : <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#9CA3AF" }} />}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: s.done ? "#16A34A" : s.active ? "#D97706" : "#9CA3AF", whiteSpace: "nowrap" }}>{s.label}</div>
              <div style={{ fontSize: 9, color: "#9CA3AF", whiteSpace: "nowrap" }}>{s.role}</div>
            </div>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: s.done ? "#16A34A" : "#E5E7EB", margin: "0 4px", marginBottom: 26 }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Approve Modal
// ---------------------------------------------------------------------------

function ApproveModal({ permitId, onClose }: { permitId: string; onClose: () => void }) {
  const [approve, { isLoading }] = useApprovePermitMutation();
  const [notes, setNotes] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 400, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle2 size={20} color="#16A34A" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Approve Permit</div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>Will advance to Level 2 / Activate</div>
          </div>
        </div>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Approval Notes (optional)</label>
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Conditions or remarks…"
          style={{ width: "100%", padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>Cancel</button>
          <button onClick={async () => { try { await approve({ permitId, notes }).unwrap(); onClose(); } catch { /**/ } }} disabled={isLoading}
            style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#16A34A", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
            {isLoading ? "Approving…" : "Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reject Modal
// ---------------------------------------------------------------------------

function RejectModal({ permitId, onClose }: { permitId: string; onClose: () => void }) {
  const [reject, { isLoading }] = useRejectPermitMutation();
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 400, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <XCircle size={20} color="#DC2626" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Reject Permit</div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>Reason is required</div>
          </div>
        </div>
        {err && <div style={{ padding: "8px 12px", background: "#FEF2F2", borderRadius: 8, fontSize: 12, color: "#DC2626", marginBottom: 10 }}>{err}</div>}
        <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain why this permit is rejected…"
          style={{ width: "100%", padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>Cancel</button>
          <button
            onClick={async () => {
              if (!reason.trim()) { setErr("Reason is required."); return; }
              try { await reject({ permitId, reason }).unwrap(); onClose(); } catch { /**/ }
            }}
            disabled={isLoading}
            style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#DC2626", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
            {isLoading ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Approval Card
// ---------------------------------------------------------------------------

interface CardProps {
  permit: Permit;
  escalated: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSendBack: (id: string) => void;
  onEscalate: (id: string) => void;
}

function ApprovalCard({ permit, escalated, onApprove, onReject, onSendBack, onEscalate }: CardProps) {
  const typeCfg = getTypeCfg(permit.type);
  const TypeIcon = typeCfg.icon;
  const hours = hoursSince(permit.created_at);
  const sla   = slaTone(hours);
  const isPending = permit.status === "submitted";

  const leftBorderColor = escalated ? "#DC2626" : sla.color;

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #E5E7EB",
      borderLeft: `4px solid ${leftBorderColor}`,
      borderRadius: "0 14px 14px 0",
      padding: "18px 20px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{permit.title}</span>
            {escalated && (
              <span style={{ padding: "2px 8px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", fontSize: 10, fontWeight: 700, color: "#DC2626" }}>ESCALATED</span>
            )}
            <span style={{ padding: "2px 8px", borderRadius: 10, background: sla.bg, border: `1px solid ${sla.border}`, fontSize: 10, fontWeight: 700, color: sla.color }}>{sla.label}</span>
          </div>
          <div style={{ fontSize: 11, color: "#9CA3AF" }}>ID: {permit.id}</div>
        </div>
        {/* SLA clock */}
        <div style={{ textAlign: "center", flexShrink: 0, marginLeft: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", border: `3px solid ${sla.color}`, display: "flex", alignItems: "center", justifyContent: "center", background: sla.bg }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: sla.color, lineHeight: 1.1, textAlign: "center" }}>{fmtHours(hours)}</span>
          </div>
          <div style={{ fontSize: 9, color: "#9CA3AF", marginTop: 3 }}>Waiting</div>
        </div>
      </div>

      {/* Info grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "8px 20px", marginBottom: 12 }}>
        {[
          { label: "Requestor",        value: permit.requested_by },
          { label: "Site",             value: permit.site_id || "—" },
          { label: "Zone / Dept",      value: permit.zone_id || "—" },
          { label: "Duration",         value: permit.start_date && permit.end_date
              ? `${fmt(permit.start_date)} → ${fmt(permit.end_date)}`
              : permit.start_date ? `From ${fmt(permit.start_date)}` : "Not set" },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 1 }}>{label}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Work Type + Risk Level */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: typeCfg.bg, border: `1px solid ${typeCfg.color}20` }}>
          <TypeIcon size={13} color={typeCfg.color} />
          <span style={{ fontSize: 12, fontWeight: 600, color: typeCfg.color }}>{permit.type || "Unspecified"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <Shield size={12} color={typeCfg.riskColor} />
          <span style={{ fontSize: 12, fontWeight: 600, color: typeCfg.riskColor }}>{typeCfg.riskLabel}</span>
        </div>
      </div>

      {/* Description / Supporting Notes */}
      {permit.description && (
        <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 3 }}>Supporting Notes</div>
          <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{permit.description}</div>
        </div>
      )}

      {/* Multi-Level Approval Tracker */}
      <ApprovalTracker status={permit.status} />

      {/* Action buttons */}
      {isPending && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14, paddingTop: 14, borderTop: "1px solid #F3F4F6" }}>
          <button onClick={() => onApprove(permit.id)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: "#16A34A", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <CheckCircle2 size={13} /> Approve
          </button>
          <button onClick={() => onReject(permit.id)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: "#DC2626", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <XCircle size={13} /> Reject
          </button>
          <button onClick={() => onSendBack(permit.id)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid #FDE68A", background: "#FFFBEB", color: "#D97706", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <RotateCcw size={13} /> Send Back
          </button>
          {!escalated && (
            <button onClick={() => onEscalate(permit.id)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <ArrowUpCircle size={13} /> Escalate
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1 — Pending Queue
// ---------------------------------------------------------------------------

function PendingTab({
  permits, escalated, onApprove, onReject, onSendBack, onEscalate,
}: {
  permits: Permit[]; escalated: Set<string>;
  onApprove: (id: string) => void; onReject: (id: string) => void;
  onSendBack: (id: string) => void; onEscalate: (id: string) => void;
}) {
  const pending = permits.filter((p) => p.status === "submitted");
  const [typeFilter, setTypeFilter] = useState("All");

  const typeKeys = ["All", ...Object.keys(TYPE_CFG)];
  const filtered = typeFilter === "All" ? pending : pending.filter((p) => p.type?.toLowerCase().includes(typeFilter.toLowerCase()));

  if (pending.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <CheckCircle2 size={40} color="#16A34A" style={{ opacity: 0.3, display: "block", margin: "0 auto 12px" }} />
        <div style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>Approval Queue is Clear</div>
        <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>All permit requests have been processed.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Type filter chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {typeKeys.map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)} style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: `1px solid ${typeFilter === t ? "#3730A3" : "#E5E7EB"}`,
            background: typeFilter === t ? "#3730A3" : "#fff",
            color: typeFilter === t ? "#fff" : "#374151",
          }}>{t}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filtered.map((p) => (
          <ApprovalCard key={p.id} permit={p} escalated={escalated.has(p.id)}
            onApprove={onApprove} onReject={onReject} onSendBack={onSendBack} onEscalate={onEscalate} />
        ))}
      </div>
      {filtered.length === 0 && <div style={{ textAlign: "center", padding: 30, color: "#9CA3AF" }}>No permits match this type filter.</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 — Escalated & Delayed
// ---------------------------------------------------------------------------

function EscalatedTab({
  permits, escalated, onApprove, onReject, onSendBack, onEscalate,
}: {
  permits: Permit[]; escalated: Set<string>;
  onApprove: (id: string) => void; onReject: (id: string) => void;
  onSendBack: (id: string) => void; onEscalate: (id: string) => void;
}) {
  const delayed   = permits.filter((p) => p.status === "submitted" && hoursSince(p.created_at) >= SLA_WARNING_H);
  const overdue   = delayed.filter((p) => hoursSince(p.created_at) >= SLA_OVERDUE_H);
  const autoEsc   = delayed.filter((p) => hoursSince(p.created_at) >= SLA_ESCALATE_H);
  const manualEsc = permits.filter((p) => escalated.has(p.id) && !autoEsc.some((e) => e.id === p.id));
  const allEsc    = [...new Map([...autoEsc, ...manualEsc].map((p) => [p.id, p])).values()];

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Overdue (>48h)",     value: overdue.length,  color: "#DC2626", bg: "#FEF2F2",  border: "#FECACA" },
          { label: "Warning (>24h)",     value: delayed.length - overdue.length, color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
          { label: "Escalated",          value: allEsc.length,   color: "#DC2626", bg: "#FEF2F2",  border: "#FECACA" },
          { label: "Total Delayed",      value: delayed.length,  color: "#374151", bg: "#F9FAFB",  border: "#E5E7EB" },
        ].map((s) => (
          <div key={s.label} style={{ flex: "1 1 140px", background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {allEsc.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <ArrowUpCircle size={16} color="#DC2626" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#DC2626" }}>Escalated Requests</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            {allEsc.map((p) => <ApprovalCard key={p.id} permit={p} escalated={true} onApprove={onApprove} onReject={onReject} onSendBack={onSendBack} onEscalate={onEscalate} />)}
          </div>
        </>
      )}

      {delayed.filter((p) => !allEsc.some((e) => e.id === p.id)).length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Clock size={16} color="#D97706" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#D97706" }}>Delayed — Awaiting Action</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {delayed.filter((p) => !allEsc.some((e) => e.id === p.id)).map((p) => (
              <ApprovalCard key={p.id} permit={p} escalated={false} onApprove={onApprove} onReject={onReject} onSendBack={onSendBack} onEscalate={onEscalate} />
            ))}
          </div>
        </>
      )}

      {delayed.length === 0 && (
        <div style={{ padding: 40, textAlign: "center" }}>
          <CheckCircle2 size={36} color="#16A34A" style={{ opacity: 0.3, display: "block", margin: "0 auto 10px" }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>No delayed requests</div>
          <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>All permits are within SLA.</div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3 — SLA Tracking
// ---------------------------------------------------------------------------

function SLATab({ permits }: { permits: Permit[] }) {
  const pending = permits.filter((p) => p.status === "submitted");
  const onTime  = pending.filter((p) => hoursSince(p.created_at) < SLA_WARNING_H);
  const warning = pending.filter((p) => hoursSince(p.created_at) >= SLA_WARNING_H && hoursSince(p.created_at) < SLA_OVERDUE_H);
  const overdue = pending.filter((p) => hoursSince(p.created_at) >= SLA_OVERDUE_H);
  const slaRate = pending.length > 0 ? Math.round((onTime.length / pending.length) * 100) : 100;

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* SLA headline */}
      <div style={{ background: "linear-gradient(135deg, #3730A3 0%, #1E1B4B 100%)", borderRadius: 14, padding: "20px 24px", marginBottom: 24, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#C7D2FE", marginBottom: 4 }}>SLA Compliance Rate</div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>{slaRate}%</div>
          <div style={{ fontSize: 12, color: "#A5B4FC", marginTop: 4 }}>{onTime.length} of {pending.length} pending permits within 24h SLA</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "right" }}>
          {[
            { label: "SLA Target", value: "< 24h", color: "#A7F3D0" },
            { label: "Warning",    value: "24–48h", color: "#FDE68A" },
            { label: "Overdue",    value: "> 48h",  color: "#FCA5A5" },
          ].map((r) => (
            <div key={r.label} style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{r.label}:</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SLA bands */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {[
          { label: "On Time",  count: onTime.length,  color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", band: "< 24h" },
          { label: "Warning",  count: warning.length, color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", band: "24–48h" },
          { label: "Overdue",  count: overdue.length, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", band: "> 48h" },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{s.label}</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{s.band}</div>
          </div>
        ))}
      </div>

      {/* Detailed SLA table */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 100px 100px 110px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", padding: "10px 16px", gap: 8 }}>
          {["Permit", "Type", "Requestor", "Submitted", "End Date", "SLA Status"].map((h) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>{h}</div>
          ))}
        </div>
        {pending.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>No pending permits.</div>
        ) : (
          [...pending].sort((a, b) => hoursSince(b.created_at) - hoursSince(a.created_at)).map((p, i) => {
            const h = hoursSince(p.created_at);
            const tone = slaTone(h);
            const tc = getTypeCfg(p.type);
            const TI = tc.icon;
            return (
              <div key={p.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 100px 100px 110px", padding: "12px 16px", gap: 8, background: i % 2 === 0 ? "#fff" : "#FAFAFA", borderBottom: "1px solid #F3F4F6", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}><TI size={12} color={tc.color} /><span style={{ fontSize: 12, color: tc.color, fontWeight: 600 }}>{p.type}</span></div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>{p.requested_by}</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>{fmtHours(h)} ago</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>{fmt(p.end_date)}</div>
                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: tone.bg, border: `1px solid ${tone.border}`, color: tone.color }}>{tone.label}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 4 — History
// ---------------------------------------------------------------------------

function HistoryTab({ permits }: { permits: Permit[] }) {
  const [filter, setFilter] = useState<"all" | "approved" | "rejected">("all");
  const history = permits.filter((p) => ["approved", "rejected", "active", "closed"].includes(p.status));
  const visible = filter === "all" ? history : history.filter((p) => filter === "approved" ? ["approved", "active", "closed"].includes(p.status) : p.status === "rejected");

  const STATUS_TONE: Record<string, { color: string; bg: string; border: string }> = {
    approved: { color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
    active:   { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
    closed:   { color: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB" },
    rejected: { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  };

  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["all", "approved", "rejected"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "7px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
            border: `1px solid ${filter === f ? "#3730A3" : "#E5E7EB"}`,
            background: filter === f ? "#3730A3" : "#fff",
            color: filter === f ? "#fff" : "#374151",
          }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>
      {visible.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>No records found.</div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 100px 120px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", padding: "10px 16px", gap: 8 }}>
            {["Permit", "Type", "Requestor", "Approved By", "End Date", "Status"].map((h) => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>{h}</div>
            ))}
          </div>
          {visible.map((p, i) => {
            const tone = STATUS_TONE[p.status] ?? STATUS_TONE.closed;
            const tc = getTypeCfg(p.type);
            const TI = tc.icon;
            return (
              <div key={p.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 100px 120px", padding: "12px 16px", gap: 8, background: i % 2 === 0 ? "#fff" : "#FAFAFA", borderBottom: "1px solid #F3F4F6", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}><TI size={12} color={tc.color} /><span style={{ fontSize: 12, color: tc.color, fontWeight: 600 }}>{p.type}</span></div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>{p.requested_by}</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>{p.approved_by || "—"}</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>{fmt(p.end_date)}</div>
                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: tone.bg, border: `1px solid ${tone.border}`, color: tone.color, textTransform: "capitalize" }}>{p.status}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page shell
// ---------------------------------------------------------------------------

const TABS: { key: Tab; label: string; icon: typeof ClipboardList }[] = [
  { key: "pending",   label: "Pending Queue",   icon: ClipboardList },
  { key: "escalated", label: "Escalated",        icon: ArrowUpCircle },
  { key: "sla",       label: "SLA Tracking",     icon: TrendingUp },
  { key: "history",   label: "History",          icon: CheckCircle2 },
];

export function ApprovalQueuePage() {
  const { data: permits = [], isLoading, refetch } = useListPermitsQuery();
  const [updatePermit] = useUpdatePermitMutation();

  const [activeTab, setActiveTab]   = useState<Tab>("pending");
  const [approveId, setApproveId]   = useState<string | null>(null);
  const [rejectId,  setRejectId]    = useState<string | null>(null);
  const [escalated, setEscalated]   = useState<Set<string>>(new Set());

  const handleSendBack = async (id: string) => {
    try { await updatePermit({ permitId: id, body: { status: "draft" } }).unwrap(); } catch { /**/ }
  };

  const handleEscalate = async (id: string) => {
    const p = permits.find((x) => x.id === id);
    if (!p) return;
    try {
      await updatePermit({ permitId: id, body: { description: `[ESCALATED] ${p.description || ""}`.trim() } }).unwrap();
    } catch { /**/ }
    setEscalated((prev) => new Set([...prev, id]));
  };

  const pending  = permits.filter((p) => p.status === "submitted");
  const delayed  = pending.filter((p) => hoursSince(p.created_at) >= SLA_OVERDUE_H);
  const autoEsc  = pending.filter((p) => hoursSince(p.created_at) >= SLA_ESCALATE_H);
  const allEscCount = new Set([...autoEsc.map((p) => p.id), ...escalated]).size;
  const slaRate  = pending.length > 0
    ? Math.round((pending.filter((p) => hoursSince(p.created_at) < SLA_WARNING_H).length / pending.length) * 100)
    : 100;

  const stats = [
    { label: "Pending Approvals",   value: pending.length,                                                 color: "#FDE68A" },
    { label: "Escalated",           value: allEscCount,                                                    color: "#FCA5A5" },
    { label: "Delayed (>48h)",      value: delayed.length,                                                 color: "#FCA5A5" },
    { label: "SLA Compliance",      value: `${slaRate}%`,                                                  color: "#A7F3D0" },
    { label: "Processed Total",     value: permits.filter((p) => ["approved","rejected","active","closed"].includes(p.status)).length, color: "#C7D2FE" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F3F7FF" }}>
      {approveId && <ApproveModal permitId={approveId} onClose={() => setApproveId(null)} />}
      {rejectId  && <RejectModal  permitId={rejectId}  onClose={() => setRejectId(null)} />}

      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #3730A3 45%, #1E3A5F 100%)", padding: "28px 32px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <ClipboardList size={22} color="#A5B4FC" />
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#fff" }}>Approval Queue</h1>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#C7D2FE", opacity: 0.85 }}>
              Multi-level permit approvals · SLA tracking · escalation management
            </p>
          </div>
          <button onClick={() => refetch()} disabled={isLoading}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "#fff", fontSize: 13, cursor: "pointer" }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 0 }}>
          {stats.map((s, i) => (
            <div key={s.label} style={{ flex: 1, padding: "12px 20px", borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginTop: 16 }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            const badge  = t.key === "pending" && pending.length > 0 ? pending.length
                         : t.key === "escalated" && allEscCount > 0 ? allEscCount : undefined;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "10px 20px", border: "none", cursor: "pointer",
                borderRadius: "8px 8px 0 0", fontSize: 13, fontWeight: active ? 600 : 500,
                ...(active ? { background: "#F5F7FF", color: "#111827" } : { background: "transparent", color: "rgba(255,255,255,0.65)" }),
              }}>
                <Icon size={14} />
                {t.label}
                {badge !== undefined && (
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: t.key === "escalated" ? "#DC2626" : "#D97706", color: "#fff", fontSize: 10, fontWeight: 700 }}>{badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
          <ClipboardList size={28} color="#7C3AED" style={{ opacity: 0.3 }} />
          <span style={{ marginLeft: 12, color: "#9CA3AF", fontSize: 14 }}>Loading queue…</span>
        </div>
      )}

      {/* Tab content */}
      {!isLoading && (
        <div style={{ background: "#fff", borderRadius: "0 0 12px 12px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          {activeTab === "pending"   && <PendingTab   permits={permits} escalated={escalated} onApprove={setApproveId} onReject={setRejectId} onSendBack={handleSendBack} onEscalate={handleEscalate} />}
          {activeTab === "escalated" && <EscalatedTab permits={permits} escalated={escalated} onApprove={setApproveId} onReject={setRejectId} onSendBack={handleSendBack} onEscalate={handleEscalate} />}
          {activeTab === "sla"       && <SLATab       permits={permits} />}
          {activeTab === "history"   && <HistoryTab   permits={permits} />}
        </div>
      )}
    </div>
  );
}
