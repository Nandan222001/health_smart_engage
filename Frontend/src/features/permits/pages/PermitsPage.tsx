import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  FileText, Plus, Search, CheckCircle2, Clock, XCircle,
  AlertCircle, RefreshCw, Flame, Zap, ArrowUpFromLine,
  Disc, Layers, Lock, Shield, MapPin, X, ChevronDown,
  AlertTriangle, Ban,
} from "lucide-react";
import {
  useListPermitsQuery,
  useApprovePermitMutation,
  useRejectPermitMutation,
  useClosePermitMutation,
  useCreatePermitMutation,
  useUpdatePermitMutation,
} from "@/features/permits/api/permitsApi";
import type { Permit } from "@/features/permits/api/permitsApi";

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

type TabKey = "dashboard" | "active" | "queue" | "all";

const HIGH_RISK_TYPES = ["Hot Work", "Work at Height", "Confined Space", "hot work", "work at height", "confined space"];

interface TypeCfg {
  icon: typeof Flame;
  color: string;
  bg: string;
  border: string;
  riskLabel: string;
}

const TYPE_CFG: Record<string, TypeCfg> = {
  "Hot Work":        { icon: Flame,            color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", riskLabel: "High Risk" },
  "Electrical Work": { icon: Zap,              color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", riskLabel: "High Risk" },
  "Work at Height":  { icon: ArrowUpFromLine,  color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", riskLabel: "High Risk" },
  "Confined Space":  { icon: Disc,             color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", riskLabel: "Critical" },
  "Excavation":      { icon: Layers,           color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA", riskLabel: "High Risk" },
  "Isolation/LOTO":  { icon: Lock,             color: "#374151", bg: "#F3F4F6", border: "#E5E7EB", riskLabel: "Controlled" },
};

const PERMIT_TYPES_LIST = Object.keys(TYPE_CFG);

function getTypeCfg(type: string): TypeCfg {
  const key = Object.keys(TYPE_CFG).find(
    (k) => type?.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(type?.toLowerCase() ?? ""),
  );
  return key ? TYPE_CFG[key] : { icon: FileText, color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", riskLabel: "Standard" };
}

const STATUS_CFG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  draft:     { color: "#6B7280", bg: "#F3F4F6",  border: "#E5E7EB", label: "Draft" },
  submitted: { color: "#D97706", bg: "#FFFBEB",  border: "#FDE68A", label: "Pending" },
  approved:  { color: "#16A34A", bg: "#F0FDF4",  border: "#BBF7D0", label: "Approved" },
  rejected:  { color: "#DC2626", bg: "#FEF2F2",  border: "#FECACA", label: "Rejected" },
  active:    { color: "#2563EB", bg: "#EFF6FF",  border: "#BFDBFE", label: "Active" },
  closed:    { color: "#6B7280", bg: "#F3F4F6",  border: "#E5E7EB", label: "Closed" },
  expired:   { color: "#DC2626", bg: "#FEF2F2",  border: "#FECACA", label: "Expired" },
};

function getStatusCfg(permit: Permit) {
  const now = new Date();
  if (permit.end_date && new Date(permit.end_date) < now && permit.status !== "closed" && permit.status !== "rejected") {
    return STATUS_CFG.expired;
  }
  return STATUS_CFG[permit.status] ?? STATUS_CFG.draft;
}

function isExpired(p: Permit) {
  return !!p.end_date && new Date(p.end_date) < new Date() && p.status !== "closed" && p.status !== "rejected";
}

function isHighRisk(p: Permit) {
  return HIGH_RISK_TYPES.some((t) => p.type?.toLowerCase().includes(t.toLowerCase()));
}

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ permit }: { permit: Permit }) {
  const cfg = getStatusCfg(permit);
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Create Permit Modal
// ---------------------------------------------------------------------------

interface CreateModalProps { onClose: () => void; onCreated: () => void; }

function CreatePermitModal({ onClose, onCreated }: CreateModalProps) {
  const [createPermit, { isLoading }] = useCreatePermitMutation();
  const [form, setForm] = useState({
    title: "", type: "Hot Work", description: "",
    site_id: "", zone_id: "", start_date: "", end_date: "", requested_by: "",
  });
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title.trim() || !form.requested_by.trim()) { setError("Title and Requested By are required."); return; }
    try {
      await createPermit({ ...form, status: "draft" }).unwrap();
      onCreated();
      onClose();
    } catch {
      setError("Failed to create permit. Please try again.");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 540, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #E5E7EB" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Create New Permit</div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>Fill in the details for the new work permit</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}><X size={20} /></button>
        </div>

        {/* Form */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          {error && <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 13, color: "#DC2626" }}>{error}</div>}

          {[
            { label: "Permit Title *", key: "title", placeholder: "e.g. Hot Work – Roof Section A" },
            { label: "Requested By *", key: "requested_by", placeholder: "Name of requester" },
            { label: "Site ID", key: "site_id", placeholder: "SITE-001" },
            { label: "Zone ID", key: "zone_id", placeholder: "ZONE-A" },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{label}</label>
              <input
                value={form[key as keyof typeof form]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
            </div>
          ))}

          {/* Type */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Permit Type</label>
            <div style={{ position: "relative" }}>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", appearance: "none", background: "#fff" }}
              >
                {PERMIT_TYPES_LIST.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[{ label: "Start Date", key: "start_date" }, { label: "End Date", key: "end_date" }].map(({ label, key }) => (
              <div key={key}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{label}</label>
                <input
                  type="date" value={form[key as keyof typeof form]}
                  onChange={(e) => set(key, e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Description</label>
            <textarea
              rows={3} value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe the scope of work…"
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #E5E7EB", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>Cancel</button>
          <button onClick={submit} disabled={isLoading} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #0F2746, #1E3A5F)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? "Creating…" : "Create Permit"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Approve Modal
// ---------------------------------------------------------------------------

function ApproveModal({ permitId, onClose }: { permitId: string; onClose: () => void }) {
  const [approve, { isLoading }] = useApprovePermitMutation();
  const [notes, setNotes] = useState("");
  const submit = async () => { try { await approve({ permitId, notes }).unwrap(); onClose(); } catch { /**/ } };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 420, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle2 size={20} color="#16A34A" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Approve Permit</div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>This permit will be approved and activated</div>
          </div>
        </div>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Approval Notes (optional)</label>
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any conditions or remarks…"
          style={{ width: "100%", padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>Cancel</button>
          <button onClick={submit} disabled={isLoading} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#16A34A", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
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
  const submit = async () => {
    if (!reason.trim()) { setErr("Rejection reason is required."); return; }
    try { await reject({ permitId, reason }).unwrap(); onClose(); } catch { /**/ }
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 420, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <XCircle size={20} color="#DC2626" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Reject Permit</div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>Provide a reason for rejection</div>
          </div>
        </div>
        {err && <div style={{ padding: "8px 12px", background: "#FEF2F2", borderRadius: 8, fontSize: 12, color: "#DC2626", marginBottom: 10 }}>{err}</div>}
        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Rejection Reason *</label>
        <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain why the permit is rejected…"
          style={{ width: "100%", padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>Cancel</button>
          <button onClick={submit} disabled={isLoading} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#DC2626", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
            {isLoading ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Permit Card (used in active and queue tabs)
// ---------------------------------------------------------------------------

interface PermitCardProps {
  permit: Permit;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onClose?: (id: string) => void;
  onSuspend?: (id: string) => void;
}

function PermitCard({ permit, onApprove, onReject, onClose, onSuspend }: PermitCardProps) {
  const typeCfg = getTypeCfg(permit.type);
  const TypeIcon = typeCfg.icon;
  const expired = isExpired(permit);
  const highRisk = isHighRisk(permit);

  return (
    <div style={{ background: "#fff", border: `1px solid ${expired ? "#FECACA" : typeCfg.border}`, borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* Type icon */}
        <div style={{ width: 44, height: 44, borderRadius: 12, background: typeCfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <TypeIcon size={20} color={typeCfg.color} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title + badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{permit.title}</span>
            <StatusBadge permit={permit} />
            {highRisk && (
              <span style={{ padding: "2px 8px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", fontSize: 10, fontWeight: 700, color: "#DC2626" }}>HIGH RISK</span>
            )}
            {expired && (
              <span style={{ padding: "2px 8px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", fontSize: 10, fontWeight: 700, color: "#DC2626" }}>EXPIRED</span>
            )}
          </div>

          {/* Type + site */}
          <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: typeCfg.color, fontWeight: 600 }}>{permit.type}</span>
            {permit.site_id && <span style={{ fontSize: 12, color: "#9CA3AF" }}>Site: {permit.site_id}</span>}
            {permit.zone_id && <span style={{ fontSize: 12, color: "#9CA3AF" }}>Zone: {permit.zone_id}</span>}
          </div>

          {/* Meta */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: "#6B7280" }}>By: <strong style={{ color: "#374151" }}>{permit.requested_by}</strong></div>
            {permit.start_date && <div style={{ fontSize: 12, color: "#6B7280" }}>Start: <strong style={{ color: "#374151" }}>{fmt(permit.start_date)}</strong></div>}
            {permit.end_date && <div style={{ fontSize: 12, color: expired ? "#DC2626" : "#6B7280" }}>End: <strong style={{ color: expired ? "#DC2626" : "#374151" }}>{fmt(permit.end_date)}</strong></div>}
          </div>

          {permit.description && <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{permit.description}</div>}

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {onApprove && permit.status === "submitted" && (
              <button onClick={() => onApprove(permit.id)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#16A34A", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <CheckCircle2 size={13} /> Approve
              </button>
            )}
            {onReject && (permit.status === "submitted" || permit.status === "approved") && (
              <button onClick={() => onReject(permit.id)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#DC2626", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <XCircle size={13} /> Reject
              </button>
            )}
            {onSuspend && permit.status === "active" && (
              <button onClick={() => onSuspend(permit.id)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #FDE68A", background: "#FFFBEB", color: "#D97706", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <Ban size={13} /> Suspend
              </button>
            )}
            {onClose && (permit.status === "active" || permit.status === "approved") && (
              <button onClick={() => onClose(permit.id)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <AlertCircle size={13} /> Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1 — Dashboard
// ---------------------------------------------------------------------------

function DashboardTab({ permits }: { permits: Permit[] }) {
  const active   = permits.filter((p) => p.status === "active");
  const expired  = permits.filter(isExpired);
  const pending  = permits.filter((p) => p.status === "submitted");
  const highRisk = permits.filter((p) => p.status === "active" && isHighRisk(p));

  // Site-wise breakdown
  const siteMap = useMemo(() => {
    const m = new Map<string, { active: number; pending: number; expired: number; total: number }>();
    for (const p of permits) {
      const site = p.site_id || "Unassigned";
      if (!m.has(site)) m.set(site, { active: 0, pending: 0, expired: 0, total: 0 });
      const s = m.get(site)!;
      s.total++;
      if (p.status === "active") s.active++;
      if (p.status === "submitted") s.pending++;
      if (isExpired(p)) s.expired++;
    }
    return Array.from(m.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [permits]);

  // Type breakdown
  const typeMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of permits) {
      const key = Object.keys(TYPE_CFG).find((k) => p.type?.toLowerCase().includes(k.toLowerCase())) ?? "Other";
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [permits]);

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Total Active Permits",     value: active.length,   color: "#2563EB", bg: "#EFF6FF",  border: "#BFDBFE", Icon: CheckCircle2 },
          { label: "Expired Permits",           value: expired.length,  color: "#DC2626", bg: "#FEF2F2",  border: "#FECACA", Icon: AlertTriangle },
          { label: "Pending Approvals",         value: pending.length,  color: "#D97706", bg: "#FFFBEB",  border: "#FDE68A", Icon: Clock },
          { label: "High-Risk Active",          value: highRisk.length, color: "#7C3AED", bg: "#F5F3FF",  border: "#DDD6FE", Icon: Shield },
          { label: "Total Permits",             value: permits.length,  color: "#374151", bg: "#F9FAFB",  border: "#E5E7EB", Icon: FileText },
        ].map((s) => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <s.Icon size={16} color={s.color} />
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Permit Type Categories */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 14 }}>Permit Categories</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {PERMIT_TYPES_LIST.map((type) => {
            const cfg = TYPE_CFG[type];
            const Icon = cfg.icon;
            const count = typeMap.find(([k]) => k === type)?.[1] ?? 0;
            const activeCount = active.filter((p) => p.type?.toLowerCase().includes(type.toLowerCase())).length;
            return (
              <div key={type} style={{ background: "#fff", border: `1px solid ${cfg.border}`, borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={17} color={cfg.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>{type}</div>
                    <div style={{ fontSize: 10, color: cfg.color, fontWeight: 600 }}>{cfg.riskLabel}</div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: cfg.color }}>{count}</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>Total</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#2563EB" }}>{activeCount}</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>Active</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Site-wise Permit Status */}
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 14 }}>Site-wise Permit Status</div>
        {siteMap.length === 0 ? (
          <div style={{ textAlign: "center", padding: 30, color: "#9CA3AF", fontSize: 13 }}>No site data available.</div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 80px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", padding: "10px 18px", gap: 8 }}>
              {["Site", "Active", "Pending", "Expired", "Total"].map((h) => (
                <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>{h}</div>
              ))}
            </div>
            {siteMap.map(([site, d], i) => (
              <div key={site} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 80px", padding: "12px 18px", gap: 8, background: i % 2 === 0 ? "#fff" : "#FAFAFA", borderBottom: "1px solid #F3F4F6", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <MapPin size={13} color="#9CA3AF" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{site}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#2563EB" }}>{d.active}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#D97706" }}>{d.pending}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: d.expired > 0 ? "#DC2626" : "#9CA3AF" }}>{d.expired}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{d.total}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 — Active Permits
// ---------------------------------------------------------------------------

function ActiveTab({ permits, onApprove, onReject, onClose, onSuspend }: {
  permits: Permit[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onClose: (id: string) => void;
  onSuspend: (id: string) => void;
}) {
  const [typeFilter, setTypeFilter] = useState("All");
  const active = permits.filter((p) => p.status === "active" || p.status === "approved");
  const filtered = typeFilter === "All" ? active : active.filter((p) => p.type?.toLowerCase().includes(typeFilter.toLowerCase()));

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Type filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["All", ...PERMIT_TYPES_LIST].map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)} style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: `1px solid ${typeFilter === t ? "#1E3A5F" : "#E5E7EB"}`,
            background: typeFilter === t ? "#1E3A5F" : "#fff",
            color: typeFilter === t ? "#fff" : "#374151",
          }}>{t}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}><CheckCircle2 size={32} style={{ opacity: 0.2, display: "block", margin: "0 auto 10px" }} />No active permits found.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((p) => <PermitCard key={p.id} permit={p} onApprove={onApprove} onReject={onReject} onClose={onClose} onSuspend={onSuspend} />)}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3 — Approval Queue
// ---------------------------------------------------------------------------

function QueueTab({ permits, onApprove, onReject }: { permits: Permit[]; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  const queue = permits.filter((p) => p.status === "submitted");

  if (queue.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <CheckCircle2 size={40} color="#16A34A" style={{ opacity: 0.3, display: "block", margin: "0 auto 12px" }} />
        <div style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>Approval Queue Clear</div>
        <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>All permit requests have been processed.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 20 }}>
        <Clock size={16} color="#D97706" />
        <span style={{ fontSize: 14, fontWeight: 600, color: "#D97706" }}>{queue.length} permit{queue.length !== 1 ? "s" : ""} awaiting approval</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {queue.map((p) => <PermitCard key={p.id} permit={p} onApprove={onApprove} onReject={onReject} />)}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 4 — All Permits
// ---------------------------------------------------------------------------

function AllPermitsTab({ permits, onApprove, onReject, onClose, onSuspend, onCreateClick }: {
  permits: Permit[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onClose: (id: string) => void;
  onSuspend: (id: string) => void;
  onCreateClick: () => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const filtered = permits.filter((p) => {
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.type?.toLowerCase().includes(search.toLowerCase()) || p.requested_by?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    const matchType   = typeFilter === "All" || p.type?.toLowerCase().includes(typeFilter.toLowerCase());
    return matchSearch && matchStatus && matchType;
  });

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search permits…"
            style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ position: "relative" }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "9px 32px 9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", appearance: "none", background: "#fff", cursor: "pointer" }}>
            <option value="All">All Statuses</option>
            {Object.entries(STATUS_CFG).filter(([k]) => k !== "expired").map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
        </div>
        <div style={{ position: "relative" }}>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            style={{ padding: "9px 32px 9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", appearance: "none", background: "#fff", cursor: "pointer" }}>
            <option value="All">All Types</option>
            {PERMIT_TYPES_LIST.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
        </div>
        <button onClick={onCreateClick} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #0F2746, #1E3A5F)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Plus size={14} /> New Permit
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 140px 1fr 100px 100px 160px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", padding: "10px 16px", gap: 8 }}>
          {["Permit", "Type", "Requested By", "Start", "End", "Actions"].map((h) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>{h}</div>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>No permits match your filters.</div>
        ) : filtered.map((p, i) => {
          const tc = getTypeCfg(p.type);
          const TIcon = tc.icon;
          return (
            <div key={p.id} style={{ display: "grid", gridTemplateColumns: "2fr 140px 1fr 100px 100px 160px", padding: "12px 16px", gap: 8, background: i % 2 === 0 ? "#fff" : "#FAFAFA", borderBottom: "1px solid #F3F4F6", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 2 }}>{p.title}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <StatusBadge permit={p} />
                  {isHighRisk(p) && p.status === "active" && <span style={{ padding: "2px 6px", borderRadius: 8, background: "#FEF2F2", fontSize: 10, fontWeight: 700, color: "#DC2626" }}>HIGH RISK</span>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <TIcon size={13} color={tc.color} />
                <span style={{ fontSize: 12, color: tc.color, fontWeight: 600 }}>{p.type}</span>
              </div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>{p.requested_by}</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>{fmt(p.start_date)}</div>
              <div style={{ fontSize: 12, color: isExpired(p) ? "#DC2626" : "#6B7280" }}>{fmt(p.end_date)}</div>
              <div style={{ display: "flex", gap: 6 }}>
                {p.status === "submitted" && <button onClick={() => onApprove(p.id)} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#16A34A", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Approve</button>}
                {(p.status === "submitted" || p.status === "approved") && <button onClick={() => onReject(p.id)} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#DC2626", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Reject</button>}
                {p.status === "active" && <button onClick={() => onSuspend(p.id)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #FDE68A", background: "#FFFBEB", color: "#D97706", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Suspend</button>}
                {(p.status === "active" || p.status === "approved") && <button onClick={() => onClose(p.id)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#374151", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Close</button>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: "#9CA3AF" }}>Showing {filtered.length} of {permits.length} permits</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page shell
// ---------------------------------------------------------------------------

const TABS: { key: TabKey; label: string; urlParam?: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "active",    label: "Active Permits",  urlParam: "active" },
  { key: "queue",     label: "Approval Queue",  urlParam: "approval" },
  { key: "all",       label: "All Permits",     urlParam: "requests" },
];

export function PermitsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const urlParam  = new URLSearchParams(location.search).get("tab");

  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (urlParam === "approval") return "queue";
    if (urlParam === "active")   return "active";
    if (urlParam === "requests") return "all";
    return "dashboard";
  });

  const { data: rawPermits, isLoading, refetch } = useListPermitsQuery();
  const permits: Permit[] = Array.isArray(rawPermits) ? rawPermits : ((rawPermits as { items?: Permit[] })?.items ?? []);

  const [closePermit]  = useClosePermitMutation();
  const [updatePermit] = useUpdatePermitMutation();

  // Modals
  const [showCreate,   setShowCreate]   = useState(false);
  const [approveId,    setApproveId]    = useState<string | null>(null);
  const [rejectId,     setRejectId]     = useState<string | null>(null);

  const handleTab = (k: TabKey) => {
    setActiveTab(k);
    const t = TABS.find((t) => t.key === k);
    navigate(t?.urlParam ? `/permits?tab=${t.urlParam}` : "/permits", { replace: true });
  };

  const handleClose   = async (id: string) => { try { await closePermit(id).unwrap(); } catch { /**/ } };
  const handleSuspend = async (id: string) => { try { await updatePermit({ permitId: id, body: { status: "closed" } }).unwrap(); } catch { /**/ } };

  const activeCount  = permits.filter((p) => p.status === "active").length;
  const pendingCount = permits.filter((p) => p.status === "submitted").length;
  const expiredCount = permits.filter(isExpired).length;
  const highRiskCount= permits.filter((p) => p.status === "active" && isHighRisk(p)).length;

  return (
    <div style={{ minHeight: "100vh", background: "#F3F7FF" }}>
      {/* Modals */}
      {showCreate && <CreatePermitModal onClose={() => setShowCreate(false)} onCreated={refetch} />}
      {approveId  && <ApproveModal permitId={approveId} onClose={() => setApproveId(null)} />}
      {rejectId   && <RejectModal  permitId={rejectId}  onClose={() => setRejectId(null)} />}

      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, #0F2746 0%, #1E3A5F 50%, #0C4A6E 100%)", padding: "28px 32px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <FileText size={22} color="#93C5FD" />
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#fff" }}>Permit To Work (PTW)</h1>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#BAE6FD", opacity: 0.85 }}>
              Manage all permit operations for hazardous and controlled work activities
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => refetch()} disabled={isLoading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "#fff", fontSize: 13, cursor: "pointer" }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "#2563EB", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> Create Permit
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: "flex", gap: 0 }}>
          {[
            { label: "Total Active",     value: activeCount,   color: "#93C5FD" },
            { label: "Expired",          value: expiredCount,  color: "#FCA5A5" },
            { label: "Pending Approvals",value: pendingCount,  color: "#FDE68A" },
            { label: "High-Risk Active", value: highRiskCount, color: "#FCA5A5" },
            { label: "Total Permits",    value: permits.length, color: "#BAE6FD" },
          ].map((s, i) => (
            <div key={s.label} style={{ flex: 1, padding: "12px 20px", borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 4, marginTop: 16 }}>
          {TABS.map((t) => {
            const active = activeTab === t.key;
            const badge  = t.key === "queue" && pendingCount > 0 ? pendingCount : undefined;
            return (
              <button key={t.key} onClick={() => handleTab(t.key)} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 20px", border: "none", cursor: "pointer",
                borderRadius: "8px 8px 0 0", fontSize: 13, fontWeight: active ? 600 : 500,
                ...(active ? { background: "#F5F7FF", color: "#111827" } : { background: "transparent", color: "rgba(255,255,255,0.65)" }),
              }}>
                {t.label}
                {badge && (
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: "#D97706", color: "#fff", fontSize: 10, fontWeight: 700 }}>{badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
          <FileText size={28} color="#2563EB" style={{ opacity: 0.3 }} />
          <span style={{ marginLeft: 12, color: "#9CA3AF", fontSize: 14 }}>Loading permits…</span>
        </div>
      )}

      {/* Tab content */}
      {!isLoading && (
        <div style={{ background: "#fff", borderRadius: "0 0 12px 12px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          {activeTab === "dashboard" && <DashboardTab permits={permits} />}
          {activeTab === "active"    && <ActiveTab permits={permits} onApprove={setApproveId} onReject={setRejectId} onClose={handleClose} onSuspend={handleSuspend} />}
          {activeTab === "queue"     && <QueueTab  permits={permits} onApprove={setApproveId} onReject={setRejectId} />}
          {activeTab === "all"       && <AllPermitsTab permits={permits} onApprove={setApproveId} onReject={setRejectId} onClose={handleClose} onSuspend={handleSuspend} onCreateClick={() => setShowCreate(true)} />}
        </div>
      )}
    </div>
  );
}
