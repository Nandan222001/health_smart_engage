import { useState, useMemo } from "react";
import {
  FileText, Search, RefreshCw, Clock, CheckCircle2,
  XCircle, AlertTriangle, User, MapPin, Briefcase,
  Calendar, Shield, FileCheck, Flame, Zap,
  ArrowUpFromLine, Disc, Layers, Lock, ChevronDown,
  Plus, Filter,
} from "lucide-react";
import {
  useListPermitsQuery,
  useApprovePermitMutation,
  useRejectPermitMutation,
} from "@/features/permits/api/permitsApi";
import type { Permit } from "@/features/permits/api/permitsApi";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type FilterKey = "all" | "pending" | "approved" | "rejected" | "expired";

interface TypeCfg { icon: typeof Flame; color: string; bg: string; border: string; riskLabel: string; riskColor: string; }
const TYPE_CFG: Record<string, TypeCfg> = {
  "Hot Work":        { icon: Flame,           color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", riskLabel: "High Risk",  riskColor: "#DC2626" },
  "Electrical Work": { icon: Zap,             color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", riskLabel: "High Risk",  riskColor: "#EA580C" },
  "Work at Height":  { icon: ArrowUpFromLine, color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", riskLabel: "High Risk",  riskColor: "#EA580C" },
  "Confined Space":  { icon: Disc,            color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", riskLabel: "Critical",   riskColor: "#DC2626" },
  "Excavation":      { icon: Layers,          color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA", riskLabel: "High Risk",  riskColor: "#EA580C" },
  "Isolation/LOTO":  { icon: Lock,            color: "#374151", bg: "#F3F4F6", border: "#E5E7EB", riskLabel: "Controlled", riskColor: "#6B7280" },
};

function getTypeCfg(type: string): TypeCfg {
  const k = Object.keys(TYPE_CFG).find((k) => type?.toLowerCase().includes(k.toLowerCase()));
  return k ? TYPE_CFG[k] : { icon: FileText, color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", riskLabel: "Standard", riskColor: "#6B7280" };
}

function isExpired(p: Permit) {
  return !!p.end_date && new Date(p.end_date) < new Date() && p.status !== "closed" && p.status !== "rejected";
}

function durationDays(p: Permit): string {
  if (!p.start_date || !p.end_date) return "—";
  const diff = Math.ceil((new Date(p.end_date).getTime() - new Date(p.start_date).getTime()) / 86_400_000);
  return diff <= 0 ? "Same day" : `${diff} day${diff !== 1 ? "s" : ""}`;
}

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_CFG: Record<string, { color: string; bg: string; border: string; label: string; Icon: typeof Clock }> = {
  draft:     { color: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB", label: "Draft",    Icon: FileText },
  submitted: { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", label: "Pending",  Icon: Clock },
  approved:  { color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", label: "Approved", Icon: CheckCircle2 },
  rejected:  { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", label: "Rejected", Icon: XCircle },
  active:    { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", label: "Active",   Icon: CheckCircle2 },
  closed:    { color: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB", label: "Closed",   Icon: AlertTriangle },
  expired:   { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", label: "Expired",  Icon: AlertTriangle },
};

function getStatusCfg(p: Permit) {
  return isExpired(p) ? STATUS_CFG.expired : (STATUS_CFG[p.status] ?? STATUS_CFG.draft);
}

function matchesFilter(p: Permit, f: FilterKey): boolean {
  if (f === "all")      return true;
  if (f === "pending")  return p.status === "submitted";
  if (f === "approved") return p.status === "approved" || p.status === "active";
  if (f === "rejected") return p.status === "rejected";
  if (f === "expired")  return isExpired(p);
  return true;
}

// ---------------------------------------------------------------------------
// Approve / Reject modals (inline lightweight)
// ---------------------------------------------------------------------------

function ApproveModal({ permitId, onClose }: { permitId: string; onClose: () => void }) {
  const [approve, { isLoading }] = useApprovePermitMutation();
  const [notes, setNotes] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.48)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 400, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle2 size={20} color="#16A34A" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Approve Request</div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>Optional notes for the requestor</div>
          </div>
        </div>
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Approval conditions or remarks…"
          style={{ width: "100%", padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>Cancel</button>
          <button disabled={isLoading} onClick={async () => { try { await approve({ permitId, notes }).unwrap(); onClose(); } catch { /**/ } }}
            style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#16A34A", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
            {isLoading ? "Approving…" : "Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectModal({ permitId, onClose }: { permitId: string; onClose: () => void }) {
  const [reject, { isLoading }] = useRejectPermitMutation();
  const [reason, setReason] = useState(""); const [err, setErr] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.48)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 400, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <XCircle size={20} color="#DC2626" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Reject Request</div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>Reason required</div>
          </div>
        </div>
        {err && <div style={{ padding: "8px 12px", background: "#FEF2F2", borderRadius: 8, fontSize: 12, color: "#DC2626", marginBottom: 10 }}>{err}</div>}
        <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this request rejected?"
          style={{ width: "100%", padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>Cancel</button>
          <button disabled={isLoading}
            onClick={async () => {
              if (!reason.trim()) { setErr("Reason is required."); return; }
              try { await reject({ permitId, reason }).unwrap(); onClose(); } catch { /**/ }
            }}
            style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#DC2626", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
            {isLoading ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Request Card
// ---------------------------------------------------------------------------

function RequestCard({
  permit, onApprove, onReject,
}: { permit: Permit; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  const typeCfg  = getTypeCfg(permit.type);
  const TypeIcon = typeCfg.icon;
  const sCfg     = getStatusCfg(permit);
  const SIcon    = sCfg.Icon;
  const expired  = isExpired(permit);
  const isPending = permit.status === "submitted";

  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${expired ? "#FECACA" : isPending ? "#FDE68A" : "#E5E7EB"}`,
      borderRadius: 14,
      overflow: "hidden",
    }}>
      {/* Coloured top stripe */}
      <div style={{ height: 4, background: expired ? "#DC2626" : isPending ? "#D97706" : sCfg.color }} />

      <div style={{ padding: "18px 20px" }}>
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{permit.title}</span>
              {expired && (
                <span style={{ padding: "2px 8px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", fontSize: 10, fontWeight: 700, color: "#DC2626" }}>EXPIRED</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>Permit ID: {permit.id} · Submitted {fmt(permit.created_at)}</div>
          </div>
          {/* Status badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: sCfg.bg, border: `1px solid ${sCfg.border}`, flexShrink: 0 }}>
            <SIcon size={12} color={sCfg.color} />
            <span style={{ fontSize: 12, fontWeight: 700, color: sCfg.color }}>{sCfg.label}</span>
          </div>
        </div>

        {/* Info grid — 3 columns */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px 24px", marginBottom: 14 }}>

          {/* Requestor */}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
              <User size={15} color="#6B7280" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 2 }}>Requestor</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{permit.requested_by || "—"}</div>
            </div>
          </div>

          {/* Site & Department */}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
              <MapPin size={15} color="#6B7280" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 2 }}>Site &amp; Department</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{permit.site_id || "Unassigned"}</div>
              {permit.zone_id && <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>Dept / Zone: {permit.zone_id}</div>}
            </div>
          </div>

          {/* Work Type */}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: typeCfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
              <TypeIcon size={15} color={typeCfg.color} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 2 }}>Work Type</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: typeCfg.color }}>{permit.type || "Unspecified"}</div>
            </div>
          </div>

          {/* Requested Duration */}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
              <Calendar size={15} color="#6B7280" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 2 }}>Requested Duration</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{durationDays(permit)}</div>
              {permit.start_date && (
                <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>{fmt(permit.start_date)} → {fmt(permit.end_date)}</div>
              )}
            </div>
          </div>

          {/* Risk Level */}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
              <Shield size={15} color={typeCfg.riskColor} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 2 }}>Risk Level</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: typeCfg.riskColor }}>{typeCfg.riskLabel}</div>
            </div>
          </div>

          {/* Approved By (if resolved) */}
          {permit.approved_by && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <Briefcase size={15} color="#16A34A" />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 2 }}>Approved By</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#16A34A" }}>{permit.approved_by}</div>
              </div>
            </div>
          )}
        </div>

        {/* Supporting Documents / Notes */}
        {permit.description ? (
          <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <FileCheck size={13} color="#6B7280" />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>Supporting Notes</span>
            </div>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.55 }}>{permit.description}</div>
          </div>
        ) : (
          <div style={{ background: "#FAFAFA", border: "1px dashed #E5E7EB", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <FileCheck size={13} color="#D1D5DB" />
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>No supporting documents attached</span>
          </div>
        )}

        {/* Actions for pending requests */}
        {isPending && (
          <div style={{ display: "flex", gap: 8, paddingTop: 14, borderTop: "1px solid #F3F4F6" }}>
            <button onClick={() => onApprove(permit.id)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 8, border: "none", background: "#16A34A", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <CheckCircle2 size={14} /> Approve
            </button>
            <button onClick={() => onReject(permit.id)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 8, border: "none", background: "#DC2626", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <XCircle size={14} /> Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "all",      label: "All Requests" },
  { key: "pending",  label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "expired",  label: "Expired" },
];

export function PermitRequestsPage() {
  const { data: permits = [], isLoading, refetch } = useListPermitsQuery();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [search, setSearch]             = useState("");
  const [typeFilter, setTypeFilter]     = useState("All");
  const [approveId, setApproveId]       = useState<string | null>(null);
  const [rejectId,  setRejectId]        = useState<string | null>(null);

  const filtered = useMemo(() => {
    return permits.filter((p) => {
      const matchFilter = matchesFilter(p, activeFilter);
      const matchSearch = !search
        || p.title?.toLowerCase().includes(search.toLowerCase())
        || p.requested_by?.toLowerCase().includes(search.toLowerCase())
        || p.site_id?.toLowerCase().includes(search.toLowerCase())
        || p.type?.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "All" || p.type?.toLowerCase().includes(typeFilter.toLowerCase());
      return matchFilter && matchSearch && matchType;
    });
  }, [permits, activeFilter, search, typeFilter]);

  const counts = useMemo(() => ({
    all:      permits.length,
    pending:  permits.filter((p) => p.status === "submitted").length,
    approved: permits.filter((p) => p.status === "approved" || p.status === "active").length,
    rejected: permits.filter((p) => p.status === "rejected").length,
    expired:  permits.filter(isExpired).length,
  }), [permits]);

  const FILTER_COLOR: Record<FilterKey, string> = {
    all: "#374151", pending: "#D97706", approved: "#16A34A", rejected: "#DC2626", expired: "#EA580C",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F3F7FF" }}>
      {approveId && <ApproveModal permitId={approveId} onClose={() => setApproveId(null)} />}
      {rejectId  && <RejectModal  permitId={rejectId}  onClose={() => setRejectId(null)} />}

      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, #0F2746 0%, #1E3A5F 50%, #164E63 100%)", padding: "28px 32px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <FileText size={22} color="#93C5FD" />
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#fff" }}>Permit Requests</h1>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#BAE6FD", opacity: 0.85 }}>
              All permit requests — requestor details, work type, duration, risk level and supporting documents
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => refetch()} disabled={isLoading}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "#fff", fontSize: 13, cursor: "pointer" }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: "flex", gap: 0, marginBottom: 0 }}>
          {FILTER_TABS.map((f, i) => (
            <div key={f.key} style={{ flex: 1, padding: "12px 20px", borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: i === 0 ? "#BAE6FD" : i === 1 ? "#FDE68A" : i === 2 ? "#A7F3D0" : i === 3 ? "#FCA5A5" : "#FED7AA" }}>
                {counts[f.key]}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{f.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 4, marginTop: 16 }}>
          {FILTER_TABS.map((f) => {
            const active = activeFilter === f.key;
            return (
              <button key={f.key} onClick={() => setActiveFilter(f.key)} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 18px", border: "none", cursor: "pointer",
                borderRadius: "8px 8px 0 0", fontSize: 13, fontWeight: active ? 600 : 500,
                ...(active ? { background: "#F5F7FF", color: "#111827" } : { background: "transparent", color: "rgba(255,255,255,0.65)" }),
              }}>
                {f.label}
                {counts[f.key] > 0 && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    minWidth: 18, height: 18, borderRadius: 9, padding: "0 4px",
                    background: active ? FILTER_COLOR[f.key] : "rgba(255,255,255,0.2)",
                    color: active ? "#fff" : "rgba(255,255,255,0.8)",
                    fontSize: 10, fontWeight: 700,
                  }}>{counts[f.key]}</span>
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
          <span style={{ marginLeft: 12, color: "#9CA3AF", fontSize: 14 }}>Loading permit requests…</span>
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <div style={{ background: "#fff", borderRadius: "0 0 12px 12px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          {/* Search + type filter bar */}
          <div style={{ padding: "16px 28px", borderBottom: "1px solid #F3F4F6", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, requestor, site or type…"
                style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Filter size={13} color="#9CA3AF" />
              <div style={{ position: "relative" }}>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                  style={{ padding: "9px 32px 9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", appearance: "none", background: "#fff", cursor: "pointer" }}>
                  <option value="All">All Work Types</option>
                  {Object.keys(TYPE_CFG).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>
              {filtered.length} of {permits.length} requests
            </div>
          </div>

          {/* Cards */}
          <div style={{ padding: "20px 28px" }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48 }}>
                <Plus size={36} color="#D1D5DB" style={{ display: "block", margin: "0 auto 12px" }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>No requests found</div>
                <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>
                  {activeFilter !== "all" ? `No ${activeFilter} permit requests.` : "No permit requests match your search."}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {filtered.map((p) => (
                  <RequestCard key={p.id} permit={p} onApprove={setApproveId} onReject={setRejectId} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
