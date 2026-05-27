import { useMemo, useState } from "react";
import {
  Search, AlertTriangle, CheckCircle2, Clock, AlertOctagon,
  Calendar, User, Tag, Wrench, ShieldCheck, ClipboardList,
  XCircle, ArrowRight, TrendingUp, ShieldAlert,
} from "lucide-react";
import { useListCAPAsQuery } from "@/features/audits/api/auditsApi";
import type { CAPA } from "@/features/audits/api/auditsApi";

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function isOverdue(capa: CAPA): boolean {
  if (capa.status === "closed") return false;
  return new Date(capa.due_date).getTime() < Date.now();
}

function daysUntil(d: string): number {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
}

function priorityStyle(priority: string): { bg: string; color: string; border: string } {
  switch (priority.toLowerCase()) {
    case "critical": return { bg: "#FEF2F2", color: "#7F1D1D", border: "#FECACA" };
    case "high":     return { bg: "#FFF1F2", color: "#9F1239", border: "#FECDD3" };
    case "medium":   return { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" };
    default:         return { bg: "#FFFBEB", color: "#92400E", border: "#FDE68A" };
  }
}

function statusStyle(status: string): { bg: string; color: string; dot: string } {
  switch (status) {
    case "open":            return { bg: "#FEE2E2", color: "#991B1B", dot: "#DC2626" };
    case "in_progress":     return { bg: "#DBEAFE", color: "#1E40AF", dot: "#3B82F6" };
    case "pending_closure": return { bg: "#EDE9FE", color: "#4C1D95", dot: "#7C3AED" };
    case "closed":          return { bg: "#D1FAE5", color: "#065F46", dot: "#16A34A" };
    default:                return { bg: "#F3F4F6", color: "#374151", dot: "#9CA3AF" };
  }
}

// ─── sub-components ──────────────────────────────────────────────────────────

function HeroStat({ icon: Icon, label, value, sub, iconBg }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; iconBg: string;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.10)", borderRadius: 12, padding: "18px 22px",
      display: "flex", alignItems: "center", gap: 14, flex: "1 1 150px", minWidth: 130,
    }}>
      <div style={{
        background: iconBg, borderRadius: 10, width: 42, height: 42,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={20} color="#fff" />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, count, color }: {
  icon: React.ElementType; title: string; count?: number; color: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <div style={{
        background: color, borderRadius: 8, width: 34, height: 34,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={17} color="#fff" />
      </div>
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>{title}</h2>
      {count !== undefined && (
        <span style={{
          marginLeft: "auto", background: "#F3F4F6", color: "#374151",
          borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600,
        }}>{count}</span>
      )}
    </div>
  );
}

function TallyCard({ label, value, bg, color, border }: {
  label: string; value: number; bg: string; color: string; border: string;
}) {
  return (
    <div style={{
      background: bg, border: `1px solid ${border}`, borderRadius: 10,
      padding: "14px 18px", textAlign: "center", flex: "1 1 110px",
    }}>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color, fontWeight: 500, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const s = priorityStyle(priority);
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 6, padding: "2px 9px", fontSize: 12, fontWeight: 700,
      textTransform: "capitalize",
    }}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = statusStyle(status);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: s.bg, color: s.color,
      borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

function CAPATable({ capas, emptyMsg }: { capas: CAPA[]; emptyMsg: string }) {
  if (capas.length === 0) {
    return (
      <div style={{
        textAlign: "center", padding: 32, background: "#F9FAFB",
        borderRadius: 10, border: "1px solid #E5E7EB",
      }}>
        <div style={{ fontSize: 13, color: "#9CA3AF" }}>{emptyMsg}</div>
      </div>
    );
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#F9FAFB" }}>
            {["Title", "Assignee", "Priority", "Due Date", "Status"].map((h) => (
              <th key={h} style={{
                padding: "10px 14px", textAlign: "left",
                fontWeight: 600, color: "#6B7280", fontSize: 12, whiteSpace: "nowrap",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {capas.map((c) => {
            const od = isOverdue(c);
            const diff = daysUntil(c.due_date);
            return (
              <tr key={c.id} style={{ borderTop: "1px solid #F3F4F6", background: od ? "#FFFBFB" : "transparent" }}>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ fontWeight: 600, color: "#111827" }}>
                    {c.title}
                    {od && (
                      <span style={{ marginLeft: 8, fontSize: 10, color: "#DC2626", fontWeight: 700 }}>OVERDUE</span>
                    )}
                  </div>
                  {c.description && (
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.description}
                    </div>
                  )}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#6B7280" }}>
                    <User size={12} />{c.assignee || "—"}
                  </span>
                </td>
                <td style={{ padding: "10px 14px" }}><PriorityBadge priority={c.priority} /></td>
                <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                  <span style={{ color: od ? "#DC2626" : diff <= 7 ? "#D97706" : "#374151", fontWeight: od ? 600 : 400 }}>
                    {fmt(c.due_date)}
                  </span>
                  {!od && diff >= 0 && diff <= 30 && (
                    <span style={{ marginLeft: 6, fontSize: 11, color: "#9CA3AF" }}>({diff}d)</span>
                  )}
                  {od && (
                    <span style={{ marginLeft: 6, fontSize: 11, color: "#DC2626" }}>({Math.abs(diff)}d ago)</span>
                  )}
                </td>
                <td style={{ padding: "10px 14px" }}><StatusBadge status={c.status} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export function CAPAPage() {
  const { data: capas = [], isLoading } = useListCAPAsQuery();

  const [corrSearch,    setCorrSearch]    = useState("");
  const [corrPriority,  setCorrPriority]  = useState("All");
  const [prevSearch,    setPrevSearch]    = useState("");
  const [prevPriority,  setPrevPriority]  = useState("All");
  const [pendingSearch, setPendingSearch] = useState("");
  const [overdueSearch, setOverdueSearch] = useState("");

  // ── derived ───────────────────────────────────────────────────────────────
  const correctiveAll  = useMemo(() => capas.filter((c) => !!c.audit_id),  [capas]);
  const preventiveAll  = useMemo(() => capas.filter((c) => !c.audit_id),   [capas]);
  const pendingAll     = useMemo(() => capas.filter((c) => c.status === "open" || c.status === "pending_closure"), [capas]);
  const overdueAll     = useMemo(() => capas.filter(isOverdue), [capas]);

  const openCount      = useMemo(() => capas.filter((c) => c.status === "open").length,            [capas]);
  const inProgressCount= useMemo(() => capas.filter((c) => c.status === "in_progress").length,     [capas]);
  const closedCount    = useMemo(() => capas.filter((c) => c.status === "closed").length,           [capas]);
  const criticalCount  = useMemo(() => capas.filter((c) => c.priority === "critical").length,       [capas]);

  // ── filtered lists ────────────────────────────────────────────────────────
  const corrective = useMemo(() => correctiveAll.filter((c) => {
    const q = corrSearch.toLowerCase();
    const mQ = !q || c.title.toLowerCase().includes(q) || c.assignee.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    const mP = corrPriority === "All" || c.priority === corrPriority.toLowerCase();
    return mQ && mP;
  }), [correctiveAll, corrSearch, corrPriority]);

  const preventive = useMemo(() => preventiveAll.filter((c) => {
    const q = prevSearch.toLowerCase();
    const mQ = !q || c.title.toLowerCase().includes(q) || c.assignee.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    const mP = prevPriority === "All" || c.priority === prevPriority.toLowerCase();
    return mQ && mP;
  }), [preventiveAll, prevSearch, prevPriority]);

  const pending = useMemo(() => pendingAll.filter((c) => {
    const q = pendingSearch.toLowerCase();
    return !q || c.title.toLowerCase().includes(q) || c.assignee.toLowerCase().includes(q);
  }), [pendingAll, pendingSearch]);

  const overdue = useMemo(() => overdueAll.filter((c) => {
    const q = overdueSearch.toLowerCase();
    return !q || c.title.toLowerCase().includes(q) || c.assignee.toLowerCase().includes(q);
  }), [overdueAll, overdueSearch]);

  // ── priority breakdown for corrective ─────────────────────────────────────
  const corrByPriority = useMemo(() => ({
    critical: correctiveAll.filter((c) => c.priority === "critical").length,
    high:     correctiveAll.filter((c) => c.priority === "high").length,
    medium:   correctiveAll.filter((c) => c.priority === "medium").length,
    low:      correctiveAll.filter((c) => c.priority === "low").length,
  }), [correctiveAll]);

  const prevByStatus = useMemo(() => ({
    open:     preventiveAll.filter((c) => c.status === "open").length,
    progress: preventiveAll.filter((c) => c.status === "in_progress").length,
    pending:  preventiveAll.filter((c) => c.status === "pending_closure").length,
    closed:   preventiveAll.filter((c) => c.status === "closed").length,
  }), [preventiveAll]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F3F7FF", paddingBottom: 40 }}>

      {/* Banner */}
      <div style={{
        background: "linear-gradient(135deg, #1A0533 0%, #4C1D95 35%, #6D28D9 65%, #7C3AED 100%)",
        padding: "32px 32px 28px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{
            background: "rgba(255,255,255,0.15)", borderRadius: 10, width: 44, height: 44,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ShieldCheck size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff" }}>CAPA Management</h1>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              Corrective · Preventive · Pending · Overdue
            </p>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <HeroStat icon={Wrench}       label="Corrective Actions" value={correctiveAll.length}  sub={`${corrByPriority.critical} critical`}    iconBg="rgba(220,38,38,0.5)" />
          <HeroStat icon={TrendingUp}   label="Preventive Actions" value={preventiveAll.length}  sub={`${prevByStatus.open} open`}               iconBg="rgba(5,150,105,0.5)" />
          <HeroStat icon={Clock}        label="Pending CAPA"       value={pendingAll.length}      sub={`needs attention`}                        iconBg="rgba(124,45,212,0.5)" />
          <HeroStat icon={AlertOctagon} label="Overdue CAPA"       value={overdueAll.length}      sub={`past due date`}                          iconBg="rgba(185,28,28,0.6)" />
          <HeroStat icon={CheckCircle2} label="Closed"             value={closedCount}            sub={`resolved`}                               iconBg="rgba(5,150,105,0.45)" />
          <HeroStat icon={AlertTriangle}label="Critical Priority"  value={criticalCount}          iconBg="rgba(239,68,68,0.55)" />
        </div>
      </div>

      <div style={{ padding: "28px 32px 0", display: "flex", flexDirection: "column", gap: 28 }}>
        {isLoading && (
          <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>Loading CAPA data…</div>
        )}

        {!isLoading && (
          <>
            {/* ── Section 1: Corrective Actions ─────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={Wrench} title="Corrective Actions" count={correctiveAll.length} color="#DC2626" />

              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>
                Reactive actions raised from audit findings to fix identified non-conformances.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <TallyCard label="Critical" value={corrByPriority.critical} bg="#FEF2F2" color="#7F1D1D" border="#FECACA" />
                <TallyCard label="High"     value={corrByPriority.high}     bg="#FFF1F2" color="#9F1239" border="#FECDD3" />
                <TallyCard label="Medium"   value={corrByPriority.medium}   bg="#FFF7ED" color="#C2410C" border="#FED7AA" />
                <TallyCard label="Low"      value={corrByPriority.low}      bg="#FFFBEB" color="#92400E" border="#FDE68A" />
              </div>

              {criticalCount > 0 && (
                <div style={{
                  background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8,
                  padding: "10px 14px", marginBottom: 16,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <AlertOctagon size={14} color="#DC2626" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#991B1B" }}>
                    {criticalCount} critical corrective action{criticalCount > 1 ? "s" : ""} require immediate attention
                  </span>
                </div>
              )}

              {/* Search + priority filter */}
              <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                  <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input value={corrSearch} onChange={(e) => setCorrSearch(e.target.value)}
                    placeholder="Search corrective actions…"
                    style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 34px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "#F9FAFB" }} />
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["All", "Critical", "High", "Medium", "Low"].map((p) => (
                    <button key={p} type="button" onClick={() => setCorrPriority(p)}
                      style={{ padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none",
                        background: corrPriority === p ? "#DC2626" : "#F3F4F6",
                        color:      corrPriority === p ? "#fff"    : "#374151" }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <CAPATable capas={corrective} emptyMsg={corrSearch || corrPriority !== "All" ? "No corrective actions match your filter." : "No corrective actions found."} />

              {corrective.length < correctiveAll.length && (
                <p style={{ margin: "10px 0 0", fontSize: 12, color: "#9CA3AF", textAlign: "right" }}>
                  Showing {corrective.length} of {correctiveAll.length}
                </p>
              )}
            </div>

            {/* ── Section 2: Preventive Actions ─────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={TrendingUp} title="Preventive Actions" count={preventiveAll.length} color="#059669" />

              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>
                Proactive standalone actions raised to prevent future incidents or non-conformances.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <TallyCard label="Open"     value={prevByStatus.open}     bg="#FEE2E2" color="#991B1B" border="#FECACA" />
                <TallyCard label="Progress" value={prevByStatus.progress} bg="#DBEAFE" color="#1E40AF" border="#BFDBFE" />
                <TallyCard label="Pending"  value={prevByStatus.pending}  bg="#EDE9FE" color="#4C1D95" border="#C4B5FD" />
                <TallyCard label="Closed"   value={prevByStatus.closed}   bg="#D1FAE5" color="#065F46" border="#BBF7D0" />
              </div>

              {/* Progress bar — completion rate */}
              {preventiveAll.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>Completion rate</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#059669" }}>
                      {Math.round((prevByStatus.closed / preventiveAll.length) * 100)}%
                    </span>
                  </div>
                  <div style={{ height: 8, background: "#F3F4F6", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{
                      width: `${(prevByStatus.closed / preventiveAll.length) * 100}%`,
                      height: "100%", background: "#059669", borderRadius: 5,
                    }} />
                  </div>
                </div>
              )}

              {/* Search + priority filter */}
              <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                  <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input value={prevSearch} onChange={(e) => setPrevSearch(e.target.value)}
                    placeholder="Search preventive actions…"
                    style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 34px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "#F9FAFB" }} />
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["All", "Critical", "High", "Medium", "Low"].map((p) => (
                    <button key={p} type="button" onClick={() => setPrevPriority(p)}
                      style={{ padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none",
                        background: prevPriority === p ? "#059669" : "#F3F4F6",
                        color:      prevPriority === p ? "#fff"    : "#374151" }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <CAPATable capas={preventive} emptyMsg={prevSearch || prevPriority !== "All" ? "No preventive actions match your filter." : "No preventive actions found."} />
            </div>

            {/* ── Section 3: Pending CAPA ────────────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={Clock} title="Pending CAPA" count={pendingAll.length} color="#7C3AED" />

              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>
                All CAPAs in <strong>Open</strong> or <strong>Pending Closure</strong> status that require action or review.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <TallyCard
                  label="Open"
                  value={pendingAll.filter((c) => c.status === "open").length}
                  bg="#FEE2E2" color="#991B1B" border="#FECACA"
                />
                <TallyCard
                  label="Pending Closure"
                  value={pendingAll.filter((c) => c.status === "pending_closure").length}
                  bg="#EDE9FE" color="#4C1D95" border="#C4B5FD"
                />
                <TallyCard
                  label="High / Critical"
                  value={pendingAll.filter((c) => ["high","critical"].includes(c.priority)).length}
                  bg="#FFF1F2" color="#9F1239" border="#FECDD3"
                />
              </div>

              {/* Pending-closure highlight strip */}
              {pendingAll.filter((c) => c.status === "pending_closure").length > 0 && (
                <div style={{
                  background: "#EDE9FE", border: "1px solid #C4B5FD", borderRadius: 8,
                  padding: "10px 14px", marginBottom: 16,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <ArrowRight size={14} color="#7C3AED" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#4C1D95" }}>
                    {pendingAll.filter((c) => c.status === "pending_closure").length} CAPA{pendingAll.filter((c) => c.status === "pending_closure").length > 1 ? "s" : ""} awaiting closure approval
                  </span>
                </div>
              )}

              <div style={{ position: "relative", marginBottom: 16 }}>
                <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input value={pendingSearch} onChange={(e) => setPendingSearch(e.target.value)}
                  placeholder="Search pending CAPAs…"
                  style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 34px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "#F9FAFB" }} />
              </div>

              {pending.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: 32, background: "#F0FDF4",
                  borderRadius: 10, border: "1px solid #BBF7D0",
                }}>
                  <CheckCircle2 size={32} color="#16A34A" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#15803D" }}>
                    {pendingSearch ? "No pending CAPAs match your search." : "No pending CAPAs — great work!"}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {pending.map((c) => {
                    const od = isOverdue(c);
                    const diff = daysUntil(c.due_date);
                    const ps = priorityStyle(c.priority);
                    return (
                      <div key={c.id} style={{
                        borderLeft: `4px solid ${c.status === "pending_closure" ? "#7C3AED" : "#DC2626"}`,
                        background: c.status === "pending_closure" ? "#F5F3FF" : "#FFF9F9",
                        borderRadius: "0 10px 10px 0", padding: "14px 16px",
                        display: "flex", alignItems: "flex-start", gap: 14,
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: c.status === "pending_closure" ? "#EDE9FE" : "#FEE2E2",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          {c.status === "pending_closure"
                            ? <ArrowRight size={17} color="#7C3AED" />
                            : <ClipboardList size={17} color="#DC2626" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 700, color: "#111827" }}>{c.title}</span>
                            <PriorityBadge priority={c.priority} />
                            <StatusBadge status={c.status} />
                          </div>
                          <div style={{ marginTop: 5, display: "flex", gap: 16, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><User size={11} />{c.assignee}</span>
                            <span style={{ fontSize: 12, color: od ? "#DC2626" : "#6B7280", fontWeight: od ? 600 : 400, display: "flex", alignItems: "center", gap: 4 }}>
                              <Calendar size={11} />{fmt(c.due_date)}
                              {od ? ` (${Math.abs(diff)}d overdue)` : diff <= 7 ? ` (${diff}d)` : ""}
                            </span>
                          </div>
                          {c.description && (
                            <div style={{ marginTop: 5, fontSize: 12, color: "#374151", fontStyle: "italic" }}>
                              {c.description.slice(0, 100)}{c.description.length > 100 ? "…" : ""}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Section 4: Overdue CAPA ────────────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={AlertOctagon} title="Overdue CAPA" count={overdueAll.length} color="#B91C1C" />

              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>
                CAPAs that have passed their due date and remain open — these require escalation.
              </p>

              {overdueAll.length > 0 && (
                <div style={{
                  background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8,
                  padding: "10px 14px", marginBottom: 18,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <AlertOctagon size={14} color="#DC2626" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#991B1B" }}>
                    {overdueAll.length} overdue CAPA{overdueAll.length > 1 ? "s" : ""} — immediate escalation required
                  </span>
                </div>
              )}

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <TallyCard
                  label="Critical"
                  value={overdueAll.filter((c) => c.priority === "critical").length}
                  bg="#FEF2F2" color="#7F1D1D" border="#FECACA"
                />
                <TallyCard
                  label="High"
                  value={overdueAll.filter((c) => c.priority === "high").length}
                  bg="#FFF1F2" color="#9F1239" border="#FECDD3"
                />
                <TallyCard
                  label="Medium"
                  value={overdueAll.filter((c) => c.priority === "medium").length}
                  bg="#FFF7ED" color="#C2410C" border="#FED7AA"
                />
                <TallyCard
                  label="Low"
                  value={overdueAll.filter((c) => c.priority === "low").length}
                  bg="#FFFBEB" color="#92400E" border="#FDE68A"
                />
              </div>

              <div style={{ position: "relative", marginBottom: 16 }}>
                <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input value={overdueSearch} onChange={(e) => setOverdueSearch(e.target.value)}
                  placeholder="Search overdue CAPAs…"
                  style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 34px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "#F9FAFB" }} />
              </div>

              {overdue.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: 32, background: "#F0FDF4",
                  borderRadius: 10, border: "1px solid #BBF7D0",
                }}>
                  <CheckCircle2 size={32} color="#16A34A" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#15803D" }}>
                    {overdueSearch ? "No overdue CAPAs match your search." : "No overdue CAPAs — all actions on track!"}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {overdue.map((c) => {
                    const diff = daysUntil(c.due_date);
                    const ps = priorityStyle(c.priority);
                    const daysLate = Math.abs(diff);
                    const urgency = daysLate > 30 ? "#7F1D1D" : daysLate > 7 ? "#991B1B" : "#DC2626";
                    return (
                      <div key={c.id} style={{
                        borderLeft: `4px solid ${urgency}`,
                        background: daysLate > 30 ? "#FEF2F2" : "#FFF9F9",
                        borderRadius: "0 10px 10px 0", padding: "14px 16px",
                        display: "flex", alignItems: "flex-start", gap: 14,
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: "#FEE2E2",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <XCircle size={18} color={urgency} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 700, color: "#111827" }}>{c.title}</span>
                            <PriorityBadge priority={c.priority} />
                            <span style={{
                              background: "#FEE2E2", color: urgency,
                              borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700,
                            }}>
                              {daysLate}d OVERDUE
                            </span>
                          </div>
                          <div style={{ marginTop: 5, display: "flex", gap: 16, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><User size={11} />{c.assignee}</span>
                            <span style={{ fontSize: 12, color: "#DC2626", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                              <Calendar size={11} />Due: {fmt(c.due_date)}
                            </span>
                            <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                              <Tag size={11} />Created: {fmt(c.created_at)}
                            </span>
                          </div>
                          {c.description && (
                            <div style={{ marginTop: 5, fontSize: 12, color: "#374151", fontStyle: "italic" }}>
                              {c.description.slice(0, 100)}{c.description.length > 100 ? "…" : ""}
                            </div>
                          )}
                        </div>
                        <StatusBadge status={c.status} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
