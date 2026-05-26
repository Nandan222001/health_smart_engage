import { useMemo, useState } from "react";
import {
  Search, CheckCircle2, AlertTriangle, Clock, AlertOctagon,
  Calendar, User, MapPin, Tag, BookOpen, Shield,
  FileText, RefreshCw, Globe, ChevronRight, Newspaper,
} from "lucide-react";
import {
  useGetRegulatoryRequirementsQuery,
  useGetComplianceStandardsQuery,
  type RegulatoryRequirement,
  type ComplianceStandard,
} from "@/features/compliance/api/complianceApi";

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function daysFrom(d: string | null | undefined): number {
  if (!d) return 9999;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
}

function regulatoryStatusStyle(status: string): { bg: string; color: string; dot: string } {
  const s = status.toLowerCase().replace(/_/g, " ");
  if (s === "active" || s === "compliant")
    return { bg: "#D1FAE5", color: "#065F46", dot: "#16A34A" };
  if (s === "under review" || s === "in review")
    return { bg: "#DBEAFE", color: "#1E40AF", dot: "#3B82F6" };
  if (s === "expired" || s === "overdue" || s === "non-compliant")
    return { bg: "#FEE2E2", color: "#991B1B", dot: "#DC2626" };
  if (s === "draft" || s === "pending")
    return { bg: "#FEF3C7", color: "#92400E", dot: "#D97706" };
  return { bg: "#F3F4F6", color: "#374151", dot: "#9CA3AF" };
}

function deadlineUrgency(days: number): { bg: string; color: string; label: string; border: string } {
  if (days < 0)   return { bg: "#FEF2F2", color: "#991B1B", label: "Overdue",   border: "#FECACA" };
  if (days <= 7)  return { bg: "#FFF1F2", color: "#9F1239", label: "Critical",  border: "#FECDD3" };
  if (days <= 30) return { bg: "#FFF7ED", color: "#C2410C", label: "Due Soon",  border: "#FED7AA" };
  if (days <= 90) return { bg: "#FFFBEB", color: "#92400E", label: "Upcoming",  border: "#FDE68A" };
  return { bg: "#F0FDF4", color: "#065F46", label: "On Track", border: "#BBF7D0" };
}

function standardStatusStyle(status: string): { bg: string; color: string; dot: string } {
  const s = status.toLowerCase();
  if (s === "active" || s === "published")
    return { bg: "#D1FAE5", color: "#065F46", dot: "#16A34A" };
  if (s === "under review" || s === "in_review")
    return { bg: "#DBEAFE", color: "#1E40AF", dot: "#3B82F6" };
  if (s === "draft")
    return { bg: "#FEF3C7", color: "#92400E", dot: "#D97706" };
  if (s === "archived" || s === "expired" || s === "superseded")
    return { bg: "#F3F4F6", color: "#6B7280", dot: "#9CA3AF" };
  return { bg: "#EFF6FF", color: "#1E40AF", dot: "#3B82F6" };
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

function StatusBadge({ status, styleFunc }: {
  status: string;
  styleFunc: (s: string) => { bg: string; color: string; dot: string };
}) {
  const s = styleFunc(status);
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

function FilterBar({
  search, onSearch, placeholder,
  options, active, onFilter, activeColor,
}: {
  search: string; onSearch: (v: string) => void; placeholder: string;
  options: string[]; active: string; onFilter: (v: string) => void; activeColor: string;
}) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
      <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
        <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input
          value={search} onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 34px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "#F9FAFB" }}
        />
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {options.map((o) => (
          <button key={o} type="button" onClick={() => onFilter(o)}
            style={{
              padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none",
              background: active === o ? activeColor : "#F3F4F6",
              color:      active === o ? "#fff"       : "#374151",
            }}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export function RegulatoryTrackingPage() {
  const { data: regs = [],       isLoading: l1 } = useGetRegulatoryRequirementsQuery();
  const { data: standards = [],  isLoading: l2 } = useGetComplianceStandardsQuery();

  const loading = l1 || l2;

  const [regSearch,  setRegSearch]  = useState("");
  const [regStatus,  setRegStatus]  = useState("All");
  const [dlineSearch, setDlineSearch] = useState("");
  const [dlineWindow, setDlineWindow] = useState("All");
  const [stdSearch,  setStdSearch]  = useState("");
  const [stdStatus,  setStdStatus]  = useState("All");

  // ── regulation derived ────────────────────────────────────────────────────
  const activeRegs   = useMemo(() => regs.filter((r) => r.status.toLowerCase() === "active"),           [regs]);
  const reviewRegs   = useMemo(() => regs.filter((r) => r.status.toLowerCase().includes("review")),     [regs]);
  const expiredRegs  = useMemo(() => regs.filter((r) => ["expired","non-compliant"].includes(r.status.toLowerCase())), [regs]);
  const draftRegs    = useMemo(() => regs.filter((r) => ["draft","pending"].includes(r.status.toLowerCase())), [regs]);

  // ── deadline derived ──────────────────────────────────────────────────────
  const regsWithDeadline = useMemo(
    () => regs.filter((r) => !!r.due_date).sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()),
    [regs],
  );
  const overdueCount    = useMemo(() => regsWithDeadline.filter((r) => daysFrom(r.due_date) < 0).length,          [regsWithDeadline]);
  const due7Count       = useMemo(() => regsWithDeadline.filter((r) => { const d = daysFrom(r.due_date); return d >= 0 && d <= 7; }).length, [regsWithDeadline]);
  const due30Count      = useMemo(() => regsWithDeadline.filter((r) => { const d = daysFrom(r.due_date); return d > 7 && d <= 30; }).length, [regsWithDeadline]);
  const onTrackCount    = useMemo(() => regsWithDeadline.filter((r) => daysFrom(r.due_date) > 30).length,         [regsWithDeadline]);

  // ── standards (updates) derived ───────────────────────────────────────────
  const stdActive       = useMemo(() => standards.filter((s) => ["active","published"].includes(s.status.toLowerCase())),    [standards]);
  const stdReview       = useMemo(() => standards.filter((s) => s.status.toLowerCase().includes("review")),                   [standards]);
  const stdDraft        = useMemo(() => standards.filter((s) => s.status.toLowerCase() === "draft"),                          [standards]);
  const stdArchived     = useMemo(() => standards.filter((s) => ["archived","expired","superseded"].includes(s.status.toLowerCase())), [standards]);
  const stdDueReview    = useMemo(() => standards.filter((s) => s.review_date && daysFrom(s.review_date) <= 30 && daysFrom(s.review_date) >= 0), [standards]);

  // Recently effective — those with effective_date in the past 90 days
  const recentlyEffective = useMemo(() => standards.filter((s) => {
    if (!s.effective_date) return false;
    const d = daysFrom(s.effective_date);
    return d >= -90 && d <= 0;
  }), [standards]);

  // ── filtered lists ────────────────────────────────────────────────────────
  const filteredRegs = useMemo(() => regs.filter((r) => {
    const q = regSearch.toLowerCase();
    const mQ = !q || r.regulation_name.toLowerCase().includes(q)
      || (r.category || "").toLowerCase().includes(q)
      || (r.jurisdiction || "").toLowerCase().includes(q)
      || (r.owner || "").toLowerCase().includes(q);
    const mS = regStatus === "All" || r.status.toLowerCase().replace(/_/g," ").includes(regStatus.toLowerCase());
    return mQ && mS;
  }), [regs, regSearch, regStatus]);

  const filteredDeadlines = useMemo(() => regsWithDeadline.filter((r) => {
    const q = dlineSearch.toLowerCase();
    const mQ = !q || r.regulation_name.toLowerCase().includes(q) || (r.owner || "").toLowerCase().includes(q);
    const d = daysFrom(r.due_date);
    let mW = true;
    if (dlineWindow === "Overdue")   mW = d < 0;
    if (dlineWindow === "≤7 days")   mW = d >= 0 && d <= 7;
    if (dlineWindow === "≤30 days")  mW = d >= 0 && d <= 30;
    if (dlineWindow === "On Track")  mW = d > 30;
    return mQ && mW;
  }), [regsWithDeadline, dlineSearch, dlineWindow]);

  const filteredStandards = useMemo(() => standards.filter((s) => {
    const q = stdSearch.toLowerCase();
    const mQ = !q || s.name.toLowerCase().includes(q)
      || (s.code || "").toLowerCase().includes(q)
      || (s.category || "").toLowerCase().includes(q)
      || (s.jurisdiction || "").toLowerCase().includes(q);
    const mS = stdStatus === "All" || s.status.toLowerCase().replace(/_/g," ").includes(stdStatus.toLowerCase());
    return mQ && mS;
  }), [standards, stdSearch, stdStatus]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F3F7FF", paddingBottom: 40 }}>

      {/* Banner */}
      <div style={{
        background: "linear-gradient(135deg, #0C1A2E 0%, #1A3A5C 35%, #1E5799 65%, #2980B9 100%)",
        padding: "32px 32px 28px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{
            background: "rgba(255,255,255,0.15)", borderRadius: 10, width: 44, height: 44,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Globe size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff" }}>Regulatory Tracking</h1>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              Applicable Regulations · Compliance Deadlines · Regulatory Updates
            </p>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <HeroStat icon={BookOpen}     label="Total Regulations"   value={regs.length}              sub={`${activeRegs.length} active`}      iconBg="rgba(30,87,153,0.55)" />
          <HeroStat icon={CheckCircle2} label="Active"              value={activeRegs.length}        iconBg="rgba(5,150,105,0.5)" />
          <HeroStat icon={RefreshCw}    label="Under Review"        value={reviewRegs.length}        iconBg="rgba(29,78,216,0.5)" />
          <HeroStat icon={AlertOctagon} label="Overdue Deadlines"   value={overdueCount}             sub="need immediate action"              iconBg="rgba(185,28,28,0.6)" />
          <HeroStat icon={Clock}        label="Due ≤30 Days"        value={due7Count + due30Count}   iconBg="rgba(217,119,6,0.5)" />
          <HeroStat icon={Newspaper}    label="Standard Updates"    value={recentlyEffective.length} sub="effective last 90 days"             iconBg="rgba(124,45,212,0.5)" />
        </div>
      </div>

      <div style={{ padding: "28px 32px 0", display: "flex", flexDirection: "column", gap: 28 }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>Loading regulatory data…</div>
        )}

        {!loading && (
          <>
            {/* ── Section 1: Applicable Regulations ────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={BookOpen} title="Applicable Regulations" count={regs.length} color="#1D4ED8" />

              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>
                All regulatory requirements applicable to this organisation, tracked by jurisdiction and compliance status.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <TallyCard label="Active"       value={activeRegs.length}  bg="#D1FAE5" color="#065F46" border="#BBF7D0" />
                <TallyCard label="Under Review" value={reviewRegs.length}  bg="#DBEAFE" color="#1E40AF" border="#BFDBFE" />
                <TallyCard label="Expired"      value={expiredRegs.length} bg="#FEE2E2" color="#991B1B" border="#FECACA" />
                <TallyCard label="Draft"        value={draftRegs.length}   bg="#FEF3C7" color="#92400E" border="#FDE68A" />
              </div>

              {expiredRegs.length > 0 && (
                <div style={{
                  background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8,
                  padding: "10px 14px", marginBottom: 16,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <AlertOctagon size={14} color="#DC2626" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#991B1B" }}>
                    {expiredRegs.length} regulation{expiredRegs.length > 1 ? "s" : ""} expired or non-compliant — review required
                  </span>
                </div>
              )}

              <FilterBar
                search={regSearch} onSearch={setRegSearch} placeholder="Search by name, category, jurisdiction…"
                options={["All", "Active", "Under Review", "Expired", "Draft"]}
                active={regStatus} onFilter={setRegStatus} activeColor="#1D4ED8"
              />

              {filteredRegs.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>
                  {regSearch || regStatus !== "All" ? "No regulations match your filter." : "No regulatory requirements found."}
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        {["Regulation", "Category", "Jurisdiction", "Owner", "Last Reviewed", "Due Date", "Status"].map((h) => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#6B7280", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRegs.map((r) => {
                        const od = r.due_date && daysFrom(r.due_date) < 0 && r.status.toLowerCase() !== "active";
                        return (
                          <tr key={r.id} style={{ borderTop: "1px solid #F3F4F6", background: od ? "#FFFBFB" : "transparent" }}>
                            <td style={{ padding: "10px 14px" }}>
                              <div style={{ fontWeight: 600, color: "#111827" }}>{r.regulation_name}</div>
                              {r.description && (
                                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {r.description}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              {r.category
                                ? <span style={{ fontSize: 12, background: "#EFF6FF", color: "#1E40AF", borderRadius: 5, padding: "2px 8px", fontWeight: 500 }}>{r.category}</span>
                                : <span style={{ color: "#9CA3AF" }}>—</span>}
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              {r.jurisdiction
                                ? <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#374151" }}><MapPin size={11} color="#9CA3AF" />{r.jurisdiction}</span>
                                : <span style={{ color: "#9CA3AF" }}>—</span>}
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#6B7280" }}><User size={11} />{r.owner || "—"}</span>
                            </td>
                            <td style={{ padding: "10px 14px", color: "#374151", whiteSpace: "nowrap" }}>{fmt(r.last_reviewed_date)}</td>
                            <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                              {r.due_date ? (
                                <span style={{ color: daysFrom(r.due_date) < 0 ? "#DC2626" : daysFrom(r.due_date) <= 30 ? "#D97706" : "#374151", fontWeight: daysFrom(r.due_date) < 0 ? 600 : 400 }}>
                                  {fmt(r.due_date)}
                                  {r.days_until_due !== null && (
                                    <span style={{ marginLeft: 5, fontSize: 11, color: "#9CA3AF" }}>
                                      {r.days_until_due < 0 ? `(${Math.abs(r.days_until_due)}d ago)` : `(${r.days_until_due}d)`}
                                    </span>
                                  )}
                                </span>
                              ) : <span style={{ color: "#9CA3AF" }}>—</span>}
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              <StatusBadge status={r.status} styleFunc={regulatoryStatusStyle} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredRegs.length < regs.length && (
                    <p style={{ margin: "10px 0 0", fontSize: 12, color: "#9CA3AF", textAlign: "right" }}>
                      Showing {filteredRegs.length} of {regs.length}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── Section 2: Compliance Deadlines ───────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={Calendar} title="Compliance Deadlines" count={regsWithDeadline.length} color="#D97706" />

              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>
                Regulatory requirements with active due dates, sorted by urgency. Overdue and critical deadlines are highlighted.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <TallyCard label="Overdue"     value={overdueCount}  bg="#FEF2F2" color="#7F1D1D" border="#FECACA" />
                <TallyCard label="Due ≤7 days" value={due7Count}     bg="#FFF1F2" color="#9F1239" border="#FECDD3" />
                <TallyCard label="Due ≤30 days" value={due30Count}   bg="#FFF7ED" color="#C2410C" border="#FED7AA" />
                <TallyCard label="On Track"    value={onTrackCount}  bg="#F0FDF4" color="#065F46" border="#BBF7D0" />
              </div>

              {overdueCount > 0 && (
                <div style={{
                  background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8,
                  padding: "10px 14px", marginBottom: 16,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <AlertOctagon size={14} color="#DC2626" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#991B1B" }}>
                    {overdueCount} regulatory deadline{overdueCount > 1 ? "s" : ""} overdue — immediate action required
                  </span>
                </div>
              )}

              <FilterBar
                search={dlineSearch} onSearch={setDlineSearch} placeholder="Search deadlines by regulation or owner…"
                options={["All", "Overdue", "≤7 days", "≤30 days", "On Track"]}
                active={dlineWindow} onFilter={setDlineWindow} activeColor="#D97706"
              />

              {filteredDeadlines.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: 32, background: "#F0FDF4",
                  borderRadius: 10, border: "1px solid #BBF7D0",
                }}>
                  <CheckCircle2 size={32} color="#16A34A" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#15803D" }}>
                    {dlineSearch || dlineWindow !== "All"
                      ? "No deadlines match your filter."
                      : "No compliance deadlines with due dates found."}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {filteredDeadlines.map((r) => {
                    const days = daysFrom(r.due_date);
                    const urg = deadlineUrgency(days);
                    return (
                      <div key={r.id} style={{
                        borderLeft: `4px solid ${urg.color}`,
                        background: urg.bg,
                        border: `1px solid ${urg.border}`,
                        borderLeftWidth: 4,
                        borderRadius: "0 10px 10px 0",
                        padding: "14px 16px",
                        display: "flex", alignItems: "flex-start", gap: 14,
                      }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 8,
                          background: "rgba(255,255,255,0.6)",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          {days < 0
                            ? <AlertOctagon size={18} color={urg.color} />
                            : days <= 7
                            ? <AlertTriangle size={18} color={urg.color} />
                            : <Calendar size={18} color={urg.color} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 700, color: "#111827" }}>{r.regulation_name}</span>
                            <span style={{
                              background: urg.bg, color: urg.color, border: `1px solid ${urg.border}`,
                              borderRadius: 6, padding: "1px 8px", fontSize: 11, fontWeight: 700,
                            }}>
                              {urg.label}
                            </span>
                            {r.category && (
                              <span style={{ fontSize: 11, background: "#EFF6FF", color: "#1D4ED8", borderRadius: 4, padding: "1px 6px" }}>
                                {r.category}
                              </span>
                            )}
                          </div>
                          <div style={{ marginTop: 5, display: "flex", gap: 16, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, color: urg.color, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                              <Calendar size={11} />
                              Due: {fmt(r.due_date)}
                              {days < 0
                                ? <span style={{ marginLeft: 4 }}>({Math.abs(days)}d overdue)</span>
                                : days === 0
                                ? <span style={{ marginLeft: 4 }}>(Today!)</span>
                                : <span style={{ marginLeft: 4 }}>({days}d remaining)</span>}
                            </span>
                            {r.owner && (
                              <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                                <User size={11} />{r.owner}
                              </span>
                            )}
                            {r.jurisdiction && (
                              <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                                <MapPin size={11} />{r.jurisdiction}
                              </span>
                            )}
                          </div>
                          {r.notes && (
                            <div style={{ marginTop: 5, fontSize: 12, color: "#374151", fontStyle: "italic" }}>
                              {r.notes.slice(0, 100)}{r.notes.length > 100 ? "…" : ""}
                            </div>
                          )}
                        </div>
                        <StatusBadge status={r.status} styleFunc={regulatoryStatusStyle} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Section 3: Regulatory Updates ─────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={Newspaper} title="Regulatory Updates" count={standards.length} color="#6D28D9" />

              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>
                Compliance standards and their current versions. Recently effective updates and standards approaching review are highlighted.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <TallyCard label="Active"           value={stdActive.length}    bg="#D1FAE5" color="#065F46" border="#BBF7D0" />
                <TallyCard label="Under Review"     value={stdReview.length}    bg="#DBEAFE" color="#1E40AF" border="#BFDBFE" />
                <TallyCard label="Draft"            value={stdDraft.length}     bg="#FEF3C7" color="#92400E" border="#FDE68A" />
                <TallyCard label="Archived"         value={stdArchived.length}  bg="#F3F4F6" color="#6B7280" border="#E5E7EB" />
                <TallyCard label="Due for Review"   value={stdDueReview.length} bg="#EDE9FE" color="#4C1D95" border="#C4B5FD" />
              </div>

              {/* Recently effective strip */}
              {recentlyEffective.length > 0 && (
                <div style={{
                  background: "#EDE9FE", border: "1px solid #C4B5FD", borderRadius: 8,
                  padding: "10px 14px", marginBottom: 16,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <Newspaper size={14} color="#7C3AED" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#4C1D95" }}>
                    {recentlyEffective.length} standard{recentlyEffective.length > 1 ? "s" : ""} became effective in the last 90 days
                  </span>
                </div>
              )}

              {/* Due for review strip */}
              {stdDueReview.length > 0 && (
                <div style={{
                  background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8,
                  padding: "10px 14px", marginBottom: 16,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <RefreshCw size={14} color="#D97706" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#92400E" }}>
                    {stdDueReview.length} standard{stdDueReview.length > 1 ? "s" : ""} due for review within 30 days
                  </span>
                </div>
              )}

              <FilterBar
                search={stdSearch} onSearch={setStdSearch} placeholder="Search by name, code, category, jurisdiction…"
                options={["All", "Active", "Under Review", "Draft", "Archived"]}
                active={stdStatus} onFilter={setStdStatus} activeColor="#6D28D9"
              />

              {filteredStandards.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>
                  {stdSearch || stdStatus !== "All" ? "No standards match your filter." : "No compliance standards found."}
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        {["Standard / Code", "Category", "Version", "Jurisdiction", "Effective Date", "Review Date", "Owner", "Status"].map((h) => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#6B7280", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStandards.map((s) => {
                        const reviewDays   = daysFrom(s.review_date);
                        const effectiveDays= daysFrom(s.effective_date);
                        const recentlyEff  = effectiveDays >= -90 && effectiveDays <= 0;
                        const reviewSoon   = reviewDays >= 0 && reviewDays <= 30;
                        return (
                          <tr key={s.id} style={{ borderTop: "1px solid #F3F4F6", background: recentlyEff ? "#F5F3FF" : reviewSoon ? "#FFFBEB" : "transparent" }}>
                            <td style={{ padding: "10px 14px" }}>
                              <div style={{ fontWeight: 600, color: "#111827" }}>
                                {s.name}
                                {recentlyEff && (
                                  <span style={{ marginLeft: 7, fontSize: 10, background: "#EDE9FE", color: "#6D28D9", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>NEW</span>
                                )}
                                {reviewSoon && (
                                  <span style={{ marginLeft: 7, fontSize: 10, background: "#FEF3C7", color: "#D97706", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>REVIEW DUE</span>
                                )}
                              </div>
                              {s.code && (
                                <div style={{ fontFamily: "monospace", fontSize: 11, color: "#6B7280", marginTop: 2 }}>{s.code}</div>
                              )}
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              {s.category
                                ? <span style={{ fontSize: 12, background: "#EFF6FF", color: "#1E40AF", borderRadius: 5, padding: "2px 8px", fontWeight: 500 }}>{s.category}</span>
                                : <span style={{ color: "#9CA3AF" }}>—</span>}
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              {s.version
                                ? <span style={{ fontFamily: "monospace", background: "#F3F4F6", borderRadius: 4, padding: "2px 7px", fontSize: 12 }}>{s.version}</span>
                                : <span style={{ color: "#9CA3AF" }}>—</span>}
                            </td>
                            <td style={{ padding: "10px 14px", color: "#374151" }}>
                              {s.jurisdiction
                                ? <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Globe size={11} color="#9CA3AF" />{s.jurisdiction}</span>
                                : <span style={{ color: "#9CA3AF" }}>—</span>}
                            </td>
                            <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                              <span style={{ color: recentlyEff ? "#6D28D9" : "#374151", fontWeight: recentlyEff ? 600 : 400 }}>
                                {fmt(s.effective_date)}
                              </span>
                            </td>
                            <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                              <span style={{ color: reviewSoon ? "#D97706" : "#374151", fontWeight: reviewSoon ? 600 : 400 }}>
                                {fmt(s.review_date)}
                                {reviewSoon && <span style={{ marginLeft: 5, fontSize: 11, color: "#D97706" }}>({reviewDays}d)</span>}
                              </span>
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#6B7280" }}>
                                <User size={11} />{s.owner || "—"}
                              </span>
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              <StatusBadge status={s.status} styleFunc={standardStatusStyle} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredStandards.length < standards.length && (
                    <p style={{ margin: "10px 0 0", fontSize: 12, color: "#9CA3AF", textAlign: "right" }}>
                      Showing {filteredStandards.length} of {standards.length}
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
