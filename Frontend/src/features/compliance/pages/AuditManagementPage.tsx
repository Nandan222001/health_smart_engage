import { useMemo, useState } from "react";
import {
  ClipboardList, AlertTriangle, CheckCircle2, Clock, XCircle,
  Calendar, User, Tag, Search, AlertOctagon,
  TrendingUp, BarChart2, UserCheck, CalendarDays,
  ChevronDown, ChevronRight, Layers,
} from "lucide-react";
import {
  useGetAuditsQuery,
  useGetFindingsQuery,
  useGetComplianceDashboardQuery,
  type AuditRecord,
  type FindingRecord,
} from "@/features/compliance/api/complianceApi";

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtMonth(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function daysDiff(dateStr: string | null | undefined): number {
  if (!dateStr) return 9999;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function isOverdue(audit: AuditRecord) {
  return !["completed"].includes(audit.status.toLowerCase()) &&
    !!audit.scheduled_date &&
    daysDiff(audit.scheduled_date) < 0;
}

function auditStatusStyle(status: string): { bg: string; color: string; dot: string } {
  const s = status.toLowerCase().replace(/_/g, " ");
  if (s === "completed")                    return { bg: "#D1FAE5", color: "#065F46", dot: "#16A34A" };
  if (s === "in progress" || s === "in_progress") return { bg: "#DBEAFE", color: "#1E40AF", dot: "#3B82F6" };
  if (s === "scheduled" || s === "planned") return { bg: "#E0F2FE", color: "#0369A1", dot: "#0EA5E9" };
  return { bg: "#F3F4F6", color: "#374151", dot: "#9CA3AF" };
}

function severityStyle(sev: string): { bg: string; color: string; border: string } {
  const s = sev.toLowerCase();
  if (s === "critical") return { bg: "#FEF2F2", color: "#7F1D1D", border: "#FECACA" };
  if (s === "high")     return { bg: "#FFF1F2", color: "#9F1239", border: "#FECDD3" };
  if (s === "medium")   return { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" };
  return                       { bg: "#FFFBEB", color: "#92400E", border: "#FDE68A" };
}

function StatusBadge({ status }: { status: string }) {
  const s = auditStatusStyle(status);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: s.bg, color: s.color,
      borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {status.replace(/_/g, " ")}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const s = severityStyle(severity);
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 6, padding: "2px 9px", fontSize: 12, fontWeight: 700,
    }}>
      {severity}
    </span>
  );
}

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
      padding: "14px 16px", textAlign: "center", flex: "1 1 110px",
    }}>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color, fontWeight: 500, marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ─── Audit Calendar Row ──────────────────────────────────────────────────────

function CalendarAuditRow({ audit }: { audit: AuditRecord }) {
  const diff      = daysDiff(audit.scheduled_date);
  const overdue   = isOverdue(audit);
  const isDueSoon = !overdue && diff >= 0 && diff <= 7;
  const bgColor   = overdue ? "#FFF5F5" : isDueSoon ? "#FFFBEB" : "#F9FAFB";
  const leftColor = overdue ? "#DC2626"  : isDueSoon ? "#D97706"  : "#3B82F6";

  return (
    <div style={{
      borderLeft: `4px solid ${leftColor}`, background: bgColor,
      borderRadius: "0 10px 10px 0", padding: "12px 16px",
      display: "flex", alignItems: "center", gap: 16,
    }}>
      {/* Date block */}
      <div style={{
        flexShrink: 0, width: 52, textAlign: "center",
        background: overdue ? "#FEE2E2" : "#EFF6FF",
        borderRadius: 8, padding: "6px 4px",
      }}>
        {audit.scheduled_date ? (
          <>
            <div style={{ fontSize: 20, fontWeight: 800, color: overdue ? "#991B1B" : "#1E40AF", lineHeight: 1 }}>
              {new Date(audit.scheduled_date).getDate()}
            </div>
            <div style={{ fontSize: 10, color: overdue ? "#B91C1C" : "#3B82F6", fontWeight: 600 }}>
              {new Date(audit.scheduled_date).toLocaleString("en", { month: "short" }).toUpperCase()}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 11, color: "#9CA3AF" }}>TBD</div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          <span style={{ fontWeight: 700, color: "#111827", fontSize: 14 }}>{audit.title}</span>
          {overdue && (
            <span style={{ fontSize: 11, fontWeight: 700, background: "#FEE2E2", color: "#991B1B", borderRadius: 4, padding: "1px 6px" }}>
              OVERDUE
            </span>
          )}
          {isDueSoon && (
            <span style={{ fontSize: 11, fontWeight: 700, background: "#FEF3C7", color: "#92400E", borderRadius: 4, padding: "1px 6px" }}>
              DUE SOON
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {audit.audit_type && (
            <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
              <Tag size={11} />{audit.audit_type}
            </span>
          )}
          {audit.standard && (
            <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
              <Layers size={11} />{audit.standard}
            </span>
          )}
          <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
            <User size={11} />{audit.auditor_user_id}
          </span>
          {!overdue && audit.scheduled_date && diff < 9999 && (
            <span style={{ fontSize: 12, color: diff <= 7 ? "#D97706" : "#6B7280", fontWeight: diff <= 7 ? 600 : 400 }}>
              {diff === 0 ? "Today" : diff > 0 ? `in ${diff}d` : `${Math.abs(diff)}d ago`}
            </span>
          )}
        </div>
      </div>
      <StatusBadge status={audit.status} />
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export function AuditManagementPage() {
  const { data: audits   = [], isLoading: l1 } = useGetAuditsQuery();
  const { data: findings = [], isLoading: l2 } = useGetFindingsQuery();
  const { data: dash,          isLoading: l3 } = useGetComplianceDashboardQuery();

  const [findingSearch,    setFindingSearch]    = useState("");
  const [findingSevFilter, setFindingSevFilter] = useState("All");
  const [assigneeSearch,   setAssigneeSearch]   = useState("");

  const loading = l1 || l2 || l3;

  // ── derived ───────────────────────────────────────────────────────────────
  const completed  = useMemo(() => audits.filter((a) => a.status.toLowerCase() === "completed"), [audits]);
  const inProgress = useMemo(() => audits.filter((a) => ["in_progress", "in progress"].includes(a.status.toLowerCase())), [audits]);
  const scheduled  = useMemo(() => audits.filter((a) => ["scheduled", "planned"].includes(a.status.toLowerCase())), [audits]);
  const overdue    = useMemo(() => audits.filter(isOverdue), [audits]);

  const completionRate = audits.length > 0 ? Math.round((completed.length / audits.length) * 100) : 0;

  // Calendar — upcoming + overdue, sorted by date
  const calendarAudits = useMemo(
    () =>
      [...audits]
        .filter((a) => a.scheduled_date)
        .sort((a, b) => {
          const aOver = isOverdue(a);
          const bOver = isOverdue(b);
          if (aOver && !bOver) return -1;
          if (!aOver && bOver) return 1;
          return new Date(a.scheduled_date!).getTime() - new Date(b.scheduled_date!).getTime();
        }),
    [audits],
  );

  // Group calendar by month
  const calendarByMonth = useMemo(() => {
    const map: Record<string, AuditRecord[]> = {};
    calendarAudits.forEach((a) => {
      const key = fmtMonth(a.scheduled_date!);
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return Object.entries(map);
  }, [calendarAudits]);

  // Findings filtered
  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchSev = findingSevFilter === "All" || f.severity.toLowerCase() === findingSevFilter.toLowerCase();
      const q = findingSearch.toLowerCase();
      const matchQ = !q || f.title?.toLowerCase().includes(q) || f.description.toLowerCase().includes(q) || (f.iso_clause || "").toLowerCase().includes(q);
      return matchSev && matchQ;
    });
  }, [findings, findingSearch, findingSevFilter]);

  const openFindings   = useMemo(() => findings.filter((f) => !["closed", "resolved"].includes(f.status.toLowerCase())), [findings]);
  const closedFindings = useMemo(() => findings.filter((f) => ["closed", "resolved"].includes(f.status.toLowerCase())), [findings]);

  const findingsBySev = useMemo(() => {
    const map: Record<string, number> = {};
    findings.forEach((f) => { map[f.severity] = (map[f.severity] || 0) + 1; });
    return map;
  }, [findings]);

  // Audit Assignments — group by auditor
  const assignments = useMemo(() => {
    const map: Record<string, AuditRecord[]> = {};
    audits.forEach((a) => {
      const key = a.auditor_user_id || "Unassigned";
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return Object.entries(map)
      .map(([auditor, list]) => ({
        auditor,
        total: list.length,
        completed: list.filter((a) => a.status.toLowerCase() === "completed").length,
        inProgress: list.filter((a) => ["in_progress", "in progress"].includes(a.status.toLowerCase())).length,
        overdue: list.filter(isOverdue).length,
        audits: list,
      }))
      .sort((a, b) => b.total - a.total)
      .filter((a) => {
        const q = assigneeSearch.toLowerCase();
        return !q || a.auditor.toLowerCase().includes(q);
      });
  }, [audits, assigneeSearch]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F3F7FF", paddingBottom: 40 }}>

      {/* Banner */}
      <div style={{
        background: "linear-gradient(135deg, #0A1628 0%, #0F2952 35%, #0D4A6B 65%, #0E6688 100%)",
        padding: "32px 32px 28px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{
            background: "rgba(255,255,255,0.15)", borderRadius: 10, width: 44, height: 44,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ClipboardList size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff" }}>Audit Management</h1>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              Calendar · Findings · Assignments · Completion Status
            </p>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <HeroStat icon={CalendarDays}  label="Total Audits"    value={audits.length}          iconBg="rgba(255,255,255,0.2)" />
          <HeroStat icon={CheckCircle2}  label="Completed"       value={completed.length}        sub={`${completionRate}% rate`}          iconBg="rgba(5,150,105,0.5)" />
          <HeroStat icon={Clock}         label="In Progress"     value={inProgress.length}       iconBg="rgba(59,130,246,0.5)" />
          <HeroStat icon={Calendar}      label="Scheduled"       value={scheduled.length}        iconBg="rgba(14,165,233,0.5)" />
          <HeroStat icon={AlertOctagon}  label="Overdue"         value={overdue.length}          iconBg="rgba(220,38,38,0.5)" />
          <HeroStat icon={AlertTriangle} label="Total Findings"  value={findings.length}         sub={`${openFindings.length} open`}  iconBg="rgba(217,119,6,0.5)" />
        </div>
      </div>

      <div style={{ padding: "28px 32px 0", display: "flex", flexDirection: "column", gap: 28 }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>Loading audit data…</div>
        )}

        {!loading && (
          <>
            {/* ── Section 1: Audit Calendar ─────────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={CalendarDays} title="Audit Calendar" count={calendarAudits.length} color="#0369A1" />

              {/* Quick filters */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
                {[
                  { label: "Overdue",   count: overdue.length,    bg: "#FEE2E2", color: "#991B1B" },
                  { label: "This Week", count: calendarAudits.filter((a) => { const d = daysDiff(a.scheduled_date); return d >= 0 && d <= 7; }).length, bg: "#FEF3C7", color: "#92400E" },
                  { label: "This Month", count: calendarAudits.filter((a) => { const d = daysDiff(a.scheduled_date); return d >= 0 && d <= 30; }).length, bg: "#DBEAFE", color: "#1E40AF" },
                  { label: "Upcoming",  count: calendarAudits.filter((a) => (daysDiff(a.scheduled_date) ?? 0) > 30).length,  bg: "#D1FAE5", color: "#065F46" },
                ].map((b) => (
                  <div key={b.label} style={{
                    background: b.bg, borderRadius: 8, padding: "8px 14px",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: b.color }}>{b.count}</span>
                    <span style={{ fontSize: 12, color: b.color, fontWeight: 500 }}>{b.label}</span>
                  </div>
                ))}
              </div>

              {calendarAudits.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>No scheduled audits found.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {calendarByMonth.map(([month, monthAudits]) => (
                    <div key={month}>
                      <div style={{
                        fontSize: 13, fontWeight: 700, color: "#374151",
                        marginBottom: 10, display: "flex", alignItems: "center", gap: 8,
                      }}>
                        <Calendar size={14} color="#6B7280" />
                        {month}
                        <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 400 }}>
                          ({monthAudits.length} audit{monthAudits.length !== 1 ? "s" : ""})
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {monthAudits.map((audit) => (
                          <CalendarAuditRow key={audit.id} audit={audit} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Section 2: Audit Findings ─────────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={AlertTriangle} title="Audit Findings" count={findings.length} color="#DC2626" />

              {/* Severity tally */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <TallyCard label="Critical" value={findingsBySev["critical"] ?? findingsBySev["Critical"] ?? 0} bg="#FEF2F2" color="#7F1D1D"  border="#FECACA" />
                <TallyCard label="High"     value={findingsBySev["high"]     ?? findingsBySev["High"]     ?? 0} bg="#FFF1F2" color="#9F1239"  border="#FECDD3" />
                <TallyCard label="Medium"   value={findingsBySev["medium"]   ?? findingsBySev["Medium"]   ?? 0} bg="#FFF7ED" color="#C2410C"  border="#FED7AA" />
                <TallyCard label="Low"      value={findingsBySev["low"]      ?? findingsBySev["Low"]      ?? 0} bg="#FFFBEB" color="#92400E"  border="#FDE68A" />
                <TallyCard label="Open"     value={openFindings.length}                                          bg="#FEE2E2" color="#991B1B"  border="#FECACA" />
                <TallyCard label="Closed"   value={closedFindings.length}                                        bg="#D1FAE5" color="#065F46"  border="#BBF7D0" />
              </div>

              {/* Search + severity filter */}
              <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                  <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    value={findingSearch}
                    onChange={(e) => setFindingSearch(e.target.value)}
                    placeholder="Search findings…"
                    style={{
                      width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 34px",
                      border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "#F9FAFB",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["All", "Critical", "High", "Medium", "Low"].map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setFindingSevFilter(sev)}
                      style={{
                        padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none",
                        background: findingSevFilter === sev ? "#1D4ED8" : "#F3F4F6",
                        color:      findingSevFilter === sev ? "#fff"    : "#374151",
                      }}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              {filteredFindings.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: 32, background: "#F0FDF4",
                  borderRadius: 10, border: "1px solid #BBF7D0",
                }}>
                  <CheckCircle2 size={32} color="#16A34A" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#15803D" }}>
                    {findingSearch || findingSevFilter !== "All" ? "No findings match your filter." : "No audit findings — excellent!"}
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        {["Title / Description", "Severity", "Source", "ISO Clause", "Status"].map((h) => (
                          <th key={h} style={{
                            padding: "10px 14px", textAlign: "left", fontWeight: 600,
                            color: "#6B7280", fontSize: 12, whiteSpace: "nowrap",
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFindings.map((f) => {
                        const isOpen = !["closed", "resolved"].includes(f.status.toLowerCase());
                        return (
                          <tr key={f.id} style={{ borderTop: "1px solid #F3F4F6", background: isOpen && f.severity.toLowerCase() === "critical" ? "#FFF9F9" : "transparent" }}>
                            <td style={{ padding: "10px 14px", maxWidth: 280 }}>
                              <div style={{ fontWeight: 600, color: "#111827" }}>{f.title || "Finding"}</div>
                              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {f.description?.slice(0, 80)}{f.description && f.description.length > 80 ? "…" : ""}
                              </div>
                            </td>
                            <td style={{ padding: "10px 14px" }}><SeverityBadge severity={f.severity} /></td>
                            <td style={{ padding: "10px 14px", color: "#374151" }}>{f.source_type}</td>
                            <td style={{ padding: "10px 14px" }}>
                              {f.iso_clause ? (
                                <span style={{ fontFamily: "monospace", background: "#F3F4F6", borderRadius: 4, padding: "2px 6px", fontSize: 11 }}>
                                  {f.iso_clause}
                                </span>
                              ) : "—"}
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              <span style={{
                                background: isOpen ? "#FEE2E2" : "#D1FAE5",
                                color: isOpen ? "#991B1B" : "#065F46",
                                borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600,
                              }}>
                                {f.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredFindings.length < findings.length && (
                    <p style={{ margin: "10px 0 0", fontSize: 12, color: "#9CA3AF", textAlign: "right" }}>
                      Showing {filteredFindings.length} of {findings.length} findings
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── Section 3: Audit Assignments ──────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={UserCheck} title="Audit Assignments" count={assignments.length} color="#7C3AED" />

              {/* Auditor search */}
              <div style={{ position: "relative", marginBottom: 18 }}>
                <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  value={assigneeSearch}
                  onChange={(e) => setAssigneeSearch(e.target.value)}
                  placeholder="Search by auditor…"
                  style={{
                    width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 34px",
                    border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "#F9FAFB",
                  }}
                />
              </div>

              {assignments.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>No auditor assignments found.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {assignments.map(({ auditor, total, completed: done, inProgress: inProg, overdue: over, audits: list }) => {
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    const barColor = pct >= 75 ? "#16A34A" : pct >= 50 ? "#D97706" : "#DC2626";
                    return (
                      <div key={auditor} style={{
                        border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden",
                      }}>
                        {/* Auditor header */}
                        <div style={{
                          padding: "14px 18px", background: "#F9FAFB",
                          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
                        }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: "50%",
                            background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
                              {auditor.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div style={{ flex: 1, minWidth: 160 }}>
                            <div style={{ fontWeight: 700, color: "#111827", fontSize: 14 }}>{auditor}</div>
                            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 1 }}>
                              {total} audit{total !== 1 ? "s" : ""} assigned
                            </div>
                          </div>
                          {/* Mini stats */}
                          <div style={{ display: "flex", gap: 10 }}>
                            {[
                              { label: "Done",        val: done,    bg: "#D1FAE5", color: "#065F46" },
                              { label: "In Progress", val: inProg,  bg: "#DBEAFE", color: "#1E40AF" },
                              { label: "Overdue",     val: over,    bg: "#FEE2E2", color: "#991B1B" },
                            ].map((s) => (
                              <div key={s.label} style={{
                                background: s.bg, borderRadius: 8, padding: "6px 12px", textAlign: "center",
                              }}>
                                <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.val}</div>
                                <div style={{ fontSize: 10, color: s.color }}>{s.label}</div>
                              </div>
                            ))}
                          </div>
                          {/* Completion % */}
                          <div style={{ minWidth: 80, textAlign: "right" }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: barColor }}>{pct}%</div>
                            <div style={{ fontSize: 11, color: "#9CA3AF" }}>complete</div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{ height: 5, background: "#F3F4F6" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: barColor, transition: "width 0.4s" }} />
                        </div>

                        {/* Audit list */}
                        <div style={{ padding: "10px 18px 14px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {list.slice(0, 5).map((a) => {
                              const od = isOverdue(a);
                              return (
                                <div key={a.id} style={{
                                  display: "flex", alignItems: "center", gap: 10,
                                  padding: "7px 10px", borderRadius: 7,
                                  background: od ? "#FFF5F5" : "#F9FAFB",
                                }}>
                                  <ChevronRight size={12} color="#9CA3AF" style={{ flexShrink: 0 }} />
                                  <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {a.title}
                                  </span>
                                  {a.scheduled_date && (
                                    <span style={{ fontSize: 11, color: od ? "#DC2626" : "#9CA3AF", flexShrink: 0 }}>
                                      {fmt(a.scheduled_date)}
                                    </span>
                                  )}
                                  <StatusBadge status={a.status} />
                                </div>
                              );
                            })}
                            {list.length > 5 && (
                              <div style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center", marginTop: 4 }}>
                                +{list.length - 5} more audits
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Section 4: Audit Completion Status ────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={BarChart2} title="Audit Completion Status" count={audits.length} color="#059669" />

              {/* Overall progress bar */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Overall Completion Rate</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: completionRate >= 75 ? "#16A34A" : completionRate >= 50 ? "#D97706" : "#DC2626" }}>
                    {completionRate}%
                  </span>
                </div>
                <div style={{ height: 12, background: "#F3F4F6", borderRadius: 8, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 8, transition: "width 0.6s ease",
                    width: `${completionRate}%`,
                    background: completionRate >= 75 ? "linear-gradient(90deg, #059669, #34D399)" :
                                completionRate >= 50 ? "linear-gradient(90deg, #D97706, #FBBF24)" :
                                                      "linear-gradient(90deg, #DC2626, #F87171)",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{completed.length} completed</span>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{audits.length} total</span>
                </div>
              </div>

              {/* Status distribution */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
                <TallyCard label="Completed"   value={completed.length}  bg="#D1FAE5" color="#065F46" border="#BBF7D0" />
                <TallyCard label="In Progress" value={inProgress.length} bg="#DBEAFE" color="#1E40AF" border="#BFDBFE" />
                <TallyCard label="Scheduled"   value={scheduled.length}  bg="#E0F2FE" color="#0369A1" border="#BAE6FD" />
                <TallyCard label="Overdue"     value={overdue.length}    bg="#FEE2E2" color="#991B1B" border="#FECACA" />
              </div>

              {/* Audit type breakdown */}
              {(() => {
                const byType: Record<string, { total: number; done: number }> = {};
                audits.forEach((a) => {
                  const t = a.audit_type || "General";
                  if (!byType[t]) byType[t] = { total: 0, done: 0 };
                  byType[t].total++;
                  if (a.status.toLowerCase() === "completed") byType[t].done++;
                });
                const entries = Object.entries(byType).sort((a, b) => b[1].total - a[1].total);
                if (entries.length === 0) return null;
                return (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 12 }}>
                      Completion by Audit Type
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {entries.map(([type, data]) => {
                        const pct = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;
                        const bc  = pct >= 75 ? "#16A34A" : pct >= 50 ? "#D97706" : "#DC2626";
                        return (
                          <div key={type}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                              <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                                {type}
                                <span style={{ marginLeft: 6, fontSize: 11, color: "#9CA3AF" }}>
                                  ({data.done}/{data.total})
                                </span>
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: bc }}>{pct}%</span>
                            </div>
                            <div style={{ height: 7, background: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
                              <div style={{ width: `${pct}%`, height: "100%", background: bc, borderRadius: 4 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Recent completions */}
              {completed.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>
                    Recently Completed
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {[...completed]
                      .sort((a, b) => new Date(b.completed_date || 0).getTime() - new Date(a.completed_date || 0).getTime())
                      .slice(0, 5)
                      .map((a) => (
                        <div key={a.id} style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "8px 12px", background: "#F0FDF4", borderRadius: 8,
                          borderLeft: "3px solid #16A34A",
                        }}>
                          <CheckCircle2 size={14} color="#16A34A" style={{ flexShrink: 0 }} />
                          <span style={{ flex: 1, fontWeight: 600, color: "#111827", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {a.title}
                          </span>
                          {a.audit_type && (
                            <span style={{ fontSize: 11, color: "#6B7280", flexShrink: 0 }}>{a.audit_type}</span>
                          )}
                          <span style={{ fontSize: 12, color: "#065F46", flexShrink: 0, fontWeight: 600 }}>
                            {fmt(a.completed_date)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Overdue table */}
              {overdue.length > 0 && (
                <div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
                    padding: "8px 12px", background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA",
                  }}>
                    <AlertOctagon size={14} color="#DC2626" />
                    <span style={{ fontWeight: 700, color: "#991B1B", fontSize: 13 }}>
                      {overdue.length} overdue audit{overdue.length > 1 ? "s" : ""} — action required
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {overdue.map((a) => (
                      <div key={a.id} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "8px 12px", background: "#FFF5F5", borderRadius: 8,
                        borderLeft: "3px solid #DC2626",
                      }}>
                        <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0 }} />
                        <span style={{ flex: 1, fontWeight: 600, color: "#111827", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {a.title}
                        </span>
                        <span style={{ fontSize: 12, color: "#6B7280", flexShrink: 0 }}>{a.auditor_user_id}</span>
                        <span style={{ fontSize: 12, color: "#DC2626", fontWeight: 700, flexShrink: 0 }}>
                          {Math.abs(daysDiff(a.scheduled_date))}d overdue
                        </span>
                        <StatusBadge status={a.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
