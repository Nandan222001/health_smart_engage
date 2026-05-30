import { useMemo } from "react";
import {
  ShieldCheck, AlertTriangle, ClipboardList, Wrench, BookOpen,
  CheckCircle2, XCircle, Clock, TrendingUp, TrendingDown,
  Calendar, User, Tag, BarChart2, Activity, FileText,
  AlertOctagon, ChevronRight, CircleDot,
} from "lucide-react";
import {
  useGetComplianceDashboardQuery,
  useGetFindingsQuery,
  useGetCapasQuery,
  useGetAuditsQuery,
  useGetRegulatoryRequirementsQuery,
  useGetComplianceStandardsQuery,
  type FindingRecord,
  type CapaRecord,
  type AuditRecord,
  type RegulatoryRequirement,
} from "@/features/compliance/api/complianceApi";

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function daysDiff(dateStr: string | null | undefined): number {
  if (!dateStr) return 9999;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function severityStyle(sev: string): { bg: string; color: string; border: string } {
  const s = sev.toLowerCase();
  if (s === "critical") return { bg: "#FEF2F2", color: "#7F1D1D", border: "#FECACA" };
  if (s === "high")     return { bg: "#FFF1F2", color: "#9F1239", border: "#FECDD3" };
  if (s === "medium")   return { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" };
  return { bg: "#FFFBEB", color: "#92400E", border: "#FDE68A" };
}

function statusStyle(status: string): { bg: string; color: string } {
  const s = status.toLowerCase().replace(/_/g, " ");
  if (s === "open")                    return { bg: "#FEE2E2", color: "#991B1B" };
  if (s === "in progress")             return { bg: "#DBEAFE", color: "#1E40AF" };
  if (s === "closed" || s === "done")  return { bg: "#D1FAE5", color: "#065F46" };
  if (s === "pending closure")         return { bg: "#F3E8FF", color: "#6D28D9" };
  if (s === "scheduled" || s === "planned") return { bg: "#E0F2FE", color: "#0369A1" };
  if (s === "completed")               return { bg: "#D1FAE5", color: "#065F46" };
  if (s === "compliant")               return { bg: "#D1FAE5", color: "#065F46" };
  if (s === "non compliant" || s === "non-compliant") return { bg: "#FEE2E2", color: "#991B1B" };
  return { bg: "#F3F4F6", color: "#374151" };
}

function StatusBadge({ status }: { status: string }) {
  const s = statusStyle(status);
  return (
    <span style={{
      background: s.bg, color: s.color, borderRadius: 6,
      padding: "2px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const s = severityStyle(severity);
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 700,
    }}>
      {severity}
    </span>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#16A34A" : score >= 60 ? "#D97706" : "#DC2626";
  const label = score >= 80 ? "Good" : score >= 60 ? "Moderate" : "At Risk";
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={130} height={130} viewBox="0 0 130 130">
        <circle cx={65} cy={65} r={54} fill="none" stroke="#F3F4F6" strokeWidth={12} />
        <circle
          cx={65} cy={65} r={54} fill="none"
          stroke={color} strokeWidth={12}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <text x={65} y={62} textAnchor="middle" fontSize={28} fontWeight={800} fill={color}>{score}</text>
        <text x={65} y={80} textAnchor="middle" fontSize={11} fill="#9CA3AF">/ 100</text>
      </svg>
      <span style={{
        fontSize: 13, fontWeight: 700, borderRadius: 8, padding: "4px 14px",
        background: color === "#16A34A" ? "#D1FAE5" : color === "#D97706" ? "#FEF3C7" : "#FEE2E2",
        color,
      }}>{label}</span>
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

// ─── main page ───────────────────────────────────────────────────────────────

export function ComplianceDashboardPage() {
  const { data: dash,       isLoading: l1 } = useGetComplianceDashboardQuery();
  const { data: findings  = [], isLoading: l2 } = useGetFindingsQuery();
  const { data: capas     = [], isLoading: l3 } = useGetCapasQuery();
  const { data: audits    = [], isLoading: l4 } = useGetAuditsQuery();
  const { data: regReqs   = [], isLoading: l5 } = useGetRegulatoryRequirementsQuery();
  const { data: standards = [], isLoading: l6 } = useGetComplianceStandardsQuery();

  const loading = l1 || l2 || l3 || l4 || l5 || l6;

  // ── compliance score ──────────────────────────────────────────────────────
  const compScore = dash?.compliance_score ?? 0;

  // ── findings (non-conformities) ───────────────────────────────────────────
  const openFindings = useMemo(
    () => findings.filter((f) => !["closed", "resolved"].includes(f.status.toLowerCase())),
    [findings],
  );
  const findingsBySev = useMemo(() => {
    const map: Record<string, number> = {};
    openFindings.forEach((f) => { map[f.severity] = (map[f.severity] || 0) + 1; });
    return map;
  }, [openFindings]);

  // ── audits ────────────────────────────────────────────────────────────────
  const completedAudits  = useMemo(() => audits.filter((a) => a.status.toLowerCase() === "completed"), [audits]);
  const inProgressAudits = useMemo(() => audits.filter((a) => a.status.toLowerCase() === "in_progress" || a.status.toLowerCase() === "in progress"), [audits]);
  const scheduledAudits  = useMemo(() => audits.filter((a) => ["scheduled", "planned"].includes(a.status.toLowerCase())), [audits]);
  const overdueAudits    = useMemo(
    () => audits.filter((a) => {
      const notDone = !["completed"].includes(a.status.toLowerCase());
      return notDone && a.scheduled_date && daysDiff(a.scheduled_date) < 0;
    }),
    [audits],
  );

  // ── CAPAs ─────────────────────────────────────────────────────────────────
  const openCapas    = useMemo(() => capas.filter((c) => !["closed"].includes(c.status.toLowerCase())), [capas]);
  const closedCapas  = useMemo(() => capas.filter((c) => c.status.toLowerCase() === "closed"), [capas]);
  const overdueCapas = useMemo(() => capas.filter((c) => c.overdue), [capas]);
  const pendingCapas = useMemo(() => capas.filter((c) => c.status.toLowerCase() === "pending_closure" || c.status.toLowerCase() === "pending closure"), [capas]);
  const capaProgress = capas.length > 0 ? Math.round((closedCapas.length / capas.length) * 100) : 0;

  // ── regulatory ────────────────────────────────────────────────────────────
  const compliantRegs    = useMemo(() => regReqs.filter((r) => r.status.toLowerCase() === "compliant"), [regReqs]);
  const nonCompliantRegs = useMemo(() => regReqs.filter((r) => ["non-compliant", "non_compliant", "non compliant"].includes(r.status.toLowerCase())), [regReqs]);
  const dueSoonRegs      = useMemo(() => regReqs.filter((r) => (r.days_until_due ?? 999) <= 30 && (r.days_until_due ?? 999) >= 0), [regReqs]);
  const overdueRegs      = useMemo(() => regReqs.filter((r) => (r.days_until_due ?? 0) < 0), [regReqs]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F3F7FF", paddingBottom: 40 }}>

      {/* ── Banner ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 35%, #1D4ED8 70%, #2563EB 100%)",
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
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff" }}>Compliance Dashboard</h1>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              Compliance · Non-Conformities · Audits · CAPA · Regulatory
            </p>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <HeroStat icon={ShieldCheck}    label="Compliance Score"    value={`${compScore}%`}          sub="overall rating"           iconBg="rgba(5,150,105,0.45)" />
          <HeroStat icon={AlertTriangle}  label="Open Non-Conformities" value={openFindings.length}    sub={`${findings.length} total`} iconBg="rgba(220,38,38,0.45)" />
          <HeroStat icon={ClipboardList}  label="Audits Completed"    value={completedAudits.length}   sub={`${overdueAudits.length} overdue`} iconBg="rgba(30,58,138,0.5)" />
          <HeroStat icon={Wrench}         label="Open CAPAs"          value={openCapas.length}         sub={`${overdueCapas.length} overdue`}  iconBg="rgba(124,45,212,0.5)" />
          <HeroStat icon={BookOpen}       label="Regulatory Items"    value={regReqs.length}           sub={`${nonCompliantRegs.length} non-compliant`} iconBg="rgba(217,119,6,0.45)" />
          <HeroStat icon={Activity}       label="Standards Active"    value={standards.filter((s) => s.status === "active").length} sub={`${standards.length} total`} iconBg="rgba(15,118,110,0.5)" />
        </div>
      </div>

      <div style={{ padding: "28px 32px 0", display: "flex", flexDirection: "column", gap: 28 }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>Loading compliance data…</div>
        )}

        {!loading && (
          <>
            {/* ── Section 1: Compliance Percentage ─────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={ShieldCheck} title="Compliance Percentage" color="#059669" />

              <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
                {/* Gauge */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <ScoreGauge score={compScore} />
                  <div style={{ fontSize: 13, color: "#6B7280", textAlign: "center" }}>
                    Overall Compliance Score
                  </div>
                  {/* Breakdown from dashboard */}
                  {dash && (
                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ textAlign: "center", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "8px 14px" }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#065F46" }}>{dash.standards.active}</div>
                        <div style={{ fontSize: 11, color: "#065F46" }}>Active Standards</div>
                      </div>
                      <div style={{ textAlign: "center", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "8px 14px" }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#1E40AF" }}>{dash.standards.total}</div>
                        <div style={{ fontSize: 11, color: "#1E40AF" }}>Total Standards</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Standards breakdown */}
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 12 }}>
                    Standards & Policies Overview
                  </div>
                  {standards.length === 0 ? (
                    <div style={{ color: "#9CA3AF", fontSize: 13 }}>No standards configured.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {standards.slice(0, 8).map((std) => {
                        const ss = statusStyle(std.status);
                        return (
                          <div key={std.id} style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "10px 14px", background: "#F9FAFB", borderRadius: 8,
                          }}>
                            <BookOpen size={14} color="#6B7280" style={{ flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: "#111827", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {std.name}
                              </div>
                              <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                                {std.code ? `${std.code} · ` : ""}{std.category}{std.jurisdiction ? ` · ${std.jurisdiction}` : ""}
                              </div>
                            </div>
                            <span style={{
                              background: ss.bg, color: ss.color,
                              borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, flexShrink: 0,
                            }}>{std.status}</span>
                          </div>
                        );
                      })}
                      {standards.length > 8 && (
                        <div style={{ fontSize: 12, color: "#9CA3AF", textAlign: "right" }}>
                          +{standards.length - 8} more standards
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Dashboard quick stats */}
                {dash && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 180 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 2 }}>At a Glance</div>
                    {[
                      { label: "Audits Completed",   value: dash.audits.completed,   color: "#059669", bg: "#D1FAE5" },
                      { label: "Audits Scheduled",   value: dash.audits.scheduled,   color: "#1D4ED8", bg: "#DBEAFE" },
                      { label: "Audits In Progress", value: dash.audits.in_progress, color: "#D97706", bg: "#FEF3C7" },
                      { label: "Open Findings",      value: dash.findings.open,      color: "#DC2626", bg: "#FEE2E2" },
                      { label: "Open CAPAs",         value: dash.capas.open,         color: "#7C3AED", bg: "#F3E8FF" },
                      { label: "Overdue CAPAs",      value: dash.capas.overdue,      color: "#991B1B", bg: "#FEF2F2" },
                    ].map((s) => (
                      <div key={s.label} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "8px 12px", background: s.bg, borderRadius: 8,
                      }}>
                        <span style={{ fontSize: 12, color: s.color, fontWeight: 500 }}>{s.label}</span>
                        <span style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Section 2: Open Non-Conformities ─────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={AlertTriangle} title="Open Non-Conformities" count={openFindings.length} color="#DC2626" />

              {/* Severity tally */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                {[
                  { label: "Critical", color: "#7F1D1D", bg: "#FEF2F2", border: "#FECACA" },
                  { label: "High",     color: "#9F1239", bg: "#FFF1F2", border: "#FECDD3" },
                  { label: "Medium",   color: "#C2410C", bg: "#FFF7ED", border: "#FED7AA" },
                  { label: "Low",      color: "#92400E", bg: "#FFFBEB", border: "#FDE68A" },
                ].map((s) => (
                  <TallyCard
                    key={s.label}
                    label={s.label}
                    value={findingsBySev[s.label] ?? findingsBySev[s.label.toLowerCase()] ?? 0}
                    bg={s.bg} color={s.color} border={s.border}
                  />
                ))}
                <TallyCard label="Total Open" value={openFindings.length} bg="#EFF6FF" color="#1E40AF" border="#BFDBFE" />
              </div>

              {openFindings.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: 32, background: "#F0FDF4",
                  borderRadius: 10, border: "1px solid #BBF7D0",
                }}>
                  <CheckCircle2 size={36} color="#16A34A" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#15803D" }}>
                    No open non-conformities — great compliance standing!
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        {["Title", "Severity", "Source", "ISO Clause", "Status"].map((h) => (
                          <th key={h} style={{
                            padding: "10px 14px", textAlign: "left", fontWeight: 600,
                            color: "#6B7280", fontSize: 12, whiteSpace: "nowrap",
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {openFindings.map((f) => (
                        <tr key={f.id} style={{ borderTop: "1px solid #F3F4F6" }}>
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ fontWeight: 600, color: "#111827" }}>{f.title || "—"}</div>
                            <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{f.description?.slice(0, 60)}{f.description && f.description.length > 60 ? "…" : ""}</div>
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
                          <td style={{ padding: "10px 14px" }}><StatusBadge status={f.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Section 3: Audit Status ───────────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={ClipboardList} title="Audit Status" count={audits.length} color="#1D4ED8" />

              {/* Status tally */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                <TallyCard label="Completed"  value={completedAudits.length}  bg="#D1FAE5" color="#065F46"  border="#BBF7D0" />
                <TallyCard label="In Progress" value={inProgressAudits.length} bg="#DBEAFE" color="#1E40AF"  border="#BFDBFE" />
                <TallyCard label="Scheduled"  value={scheduledAudits.length}  bg="#E0F2FE" color="#0369A1"  border="#BAE6FD" />
                <TallyCard label="Overdue"    value={overdueAudits.length}    bg="#FEE2E2" color="#991B1B"  border="#FECACA" />
              </div>

              {/* Overdue alert */}
              {overdueAudits.length > 0 && (
                <div style={{
                  background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8,
                  padding: "10px 14px", marginBottom: 16,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <AlertOctagon size={14} color="#DC2626" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#991B1B" }}>
                    {overdueAudits.length} audit{overdueAudits.length > 1 ? "s are" : " is"} overdue and need immediate attention
                  </span>
                </div>
              )}

              {audits.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>No audits found.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        {["Audit Title", "Type", "Standard", "Auditor", "Scheduled", "Completed", "Status"].map((h) => (
                          <th key={h} style={{
                            padding: "10px 14px", textAlign: "left", fontWeight: 600,
                            color: "#6B7280", fontSize: 12, whiteSpace: "nowrap",
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...audits]
                        .sort((a, b) => {
                          // Overdue first, then by scheduled date
                          const aOver = !["completed"].includes(a.status.toLowerCase()) && a.scheduled_date && daysDiff(a.scheduled_date) < 0;
                          const bOver = !["completed"].includes(b.status.toLowerCase()) && b.scheduled_date && daysDiff(b.scheduled_date) < 0;
                          if (aOver && !bOver) return -1;
                          if (!aOver && bOver) return 1;
                          return 0;
                        })
                        .slice(0, 25)
                        .map((audit) => {
                          const isOverdue = !["completed"].includes(audit.status.toLowerCase()) && audit.scheduled_date && daysDiff(audit.scheduled_date) < 0;
                          return (
                            <tr key={audit.id} style={{ borderTop: "1px solid #F3F4F6", background: isOverdue ? "#FFF5F5" : "transparent" }}>
                              <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827" }}>
                                {audit.title}
                                {isOverdue && <span style={{ marginLeft: 6, fontSize: 10, color: "#DC2626", fontWeight: 700 }}>OVERDUE</span>}
                              </td>
                              <td style={{ padding: "10px 14px", color: "#374151" }}>{audit.audit_type || "—"}</td>
                              <td style={{ padding: "10px 14px", color: "#374151" }}>{audit.standard || "—"}</td>
                              <td style={{ padding: "10px 14px", color: "#6B7280" }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <User size={11} />{audit.auditor_user_id}
                                </span>
                              </td>
                              <td style={{ padding: "10px 14px", color: "#374151", whiteSpace: "nowrap" }}>{fmt(audit.scheduled_date)}</td>
                              <td style={{ padding: "10px 14px", color: "#374151", whiteSpace: "nowrap" }}>{fmt(audit.completed_date)}</td>
                              <td style={{ padding: "10px 14px" }}><StatusBadge status={audit.status} /></td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                  {audits.length > 25 && (
                    <p style={{ margin: "10px 0 0", fontSize: 12, color: "#9CA3AF", textAlign: "right" }}>
                      Showing 25 of {audits.length} audits
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── Section 4: CAPA Progress ──────────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={Wrench} title="CAPA Progress" count={capas.length} color="#7C3AED" />

              {/* Progress bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                    Closure Rate
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#7C3AED" }}>{capaProgress}%</span>
                </div>
                <div style={{ height: 10, background: "#F3F4F6", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{
                    width: `${capaProgress}%`, height: "100%",
                    background: capaProgress >= 75 ? "#16A34A" : capaProgress >= 50 ? "#D97706" : "#DC2626",
                    borderRadius: 6, transition: "width 0.6s ease",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{closedCapas.length} closed</span>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{capas.length} total</span>
                </div>
              </div>

              {/* CAPA tally */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                <TallyCard label="Open"            value={openCapas.filter((c) => c.status.toLowerCase() === "open").length}                bg="#FEE2E2" color="#991B1B"  border="#FECACA" />
                <TallyCard label="In Progress"     value={openCapas.filter((c) => ["in_progress","in progress"].includes(c.status.toLowerCase())).length} bg="#DBEAFE" color="#1E40AF" border="#BFDBFE" />
                <TallyCard label="Pending Closure" value={pendingCapas.length}                                                                bg="#F3E8FF" color="#6D28D9"  border="#DDD6FE" />
                <TallyCard label="Overdue"         value={overdueCapas.length}                                                                bg="#FEF2F2" color="#7F1D1D"  border="#FECACA" />
                <TallyCard label="Closed"          value={closedCapas.length}                                                                 bg="#D1FAE5" color="#065F46"  border="#BBF7D0" />
              </div>

              {capas.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>No CAPA records found.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[...capas]
                    .sort((a, b) => {
                      if (a.overdue && !b.overdue) return -1;
                      if (!a.overdue && b.overdue) return 1;
                      return (a.days_left ?? 999) - (b.days_left ?? 999);
                    })
                    .slice(0, 20)
                    .map((capa) => {
                      const isClosed  = capa.status.toLowerCase() === "closed";
                      const borderCol = capa.overdue ? "#DC2626" : isClosed ? "#16A34A" : "#7C3AED";
                      const bgCol     = capa.overdue ? "#FEF2F2" : isClosed ? "#F0FDF4" : "#F5F3FF";
                      return (
                        <div key={capa.id} style={{
                          borderLeft: `4px solid ${borderCol}`,
                          background: bgCol, borderRadius: "0 10px 10px 0",
                          padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 14,
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                              <span style={{ fontWeight: 700, color: "#111827", fontSize: 14 }}>{capa.title || "CAPA"}</span>
                              <SeverityBadge severity={capa.severity} />
                              {capa.overdue && (
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#991B1B", background: "#FEE2E2", borderRadius: 4, padding: "1px 6px" }}>
                                  OVERDUE
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                                <Tag size={11} /> {capa.source_type}
                              </span>
                              <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                                <User size={11} /> {capa.owner_user_id}
                              </span>
                              {capa.due_date && (
                                <span style={{ fontSize: 12, color: capa.overdue ? "#DC2626" : "#6B7280", fontWeight: capa.overdue ? 700 : 400, display: "flex", alignItems: "center", gap: 4 }}>
                                  <Calendar size={11} /> Due: {fmt(capa.due_date)}
                                  {capa.days_left != null && !capa.overdue && (
                                    <span style={{ color: "#9CA3AF" }}> ({capa.days_left}d left)</span>
                                  )}
                                </span>
                              )}
                            </div>
                            {capa.corrective_action && (
                              <div style={{ marginTop: 6, fontSize: 12, color: "#374151", fontStyle: "italic" }}>
                                Action: {capa.corrective_action.slice(0, 100)}{capa.corrective_action.length > 100 ? "…" : ""}
                              </div>
                            )}
                          </div>
                          <StatusBadge status={capa.status} />
                        </div>
                      );
                    })}
                  {capas.length > 20 && (
                    <p style={{ margin: 0, fontSize: 12, color: "#9CA3AF", textAlign: "right" }}>
                      Showing 20 of {capas.length} CAPAs
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── Section 5: Regulatory Status ──────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={BookOpen} title="Regulatory Status" count={regReqs.length} color="#B45309" />

              {/* Tally */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                <TallyCard label="Compliant"     value={compliantRegs.length}    bg="#D1FAE5" color="#065F46"  border="#BBF7D0" />
                <TallyCard label="Non-Compliant" value={nonCompliantRegs.length} bg="#FEE2E2" color="#991B1B"  border="#FECACA" />
                <TallyCard label="Overdue"       value={overdueRegs.length}      bg="#FEF2F2" color="#7F1D1D"  border="#FECACA" />
                <TallyCard label="Due ≤30 days"  value={dueSoonRegs.length}      bg="#FEF3C7" color="#92400E"  border="#FDE68A" />
                <TallyCard label="Total"         value={regReqs.length}          bg="#EFF6FF" color="#1E40AF"  border="#BFDBFE" />
              </div>

              {/* Due soon alert */}
              {(dueSoonRegs.length > 0 || overdueRegs.length > 0) && (
                <div style={{
                  background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8,
                  padding: "10px 14px", marginBottom: 16,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <AlertTriangle size={14} color="#D97706" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#92400E" }}>
                    {overdueRegs.length > 0 ? `${overdueRegs.length} regulatory items are overdue. ` : ""}
                    {dueSoonRegs.length > 0 ? `${dueSoonRegs.length} due within 30 days.` : ""}
                  </span>
                </div>
              )}

              {regReqs.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>No regulatory requirements found.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        {["Regulation", "Jurisdiction", "Category", "Due Date", "Days Until Due", "Owner", "Status"].map((h) => (
                          <th key={h} style={{
                            padding: "10px 14px", textAlign: "left", fontWeight: 600,
                            color: "#6B7280", fontSize: 12, whiteSpace: "nowrap",
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...regReqs]
                        .sort((a, b) => (a.days_until_due ?? 999) - (b.days_until_due ?? 999))
                        .map((req) => {
                          const daysLeft = req.days_until_due;
                          const isOverdue = daysLeft != null && daysLeft < 0;
                          const isDueSoon = daysLeft != null && daysLeft >= 0 && daysLeft <= 30;
                          return (
                            <tr key={req.id} style={{ borderTop: "1px solid #F3F4F6", background: isOverdue ? "#FFF5F5" : isDueSoon ? "#FFFBEB" : "transparent" }}>
                              <td style={{ padding: "10px 14px" }}>
                                <div style={{ fontWeight: 600, color: "#111827" }}>{req.regulation_name}</div>
                                {req.notes && (
                                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                                    {req.notes.slice(0, 50)}{req.notes.length > 50 ? "…" : ""}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: "10px 14px", color: "#374151" }}>{req.jurisdiction || "—"}</td>
                              <td style={{ padding: "10px 14px", color: "#374151" }}>{req.category || "—"}</td>
                              <td style={{ padding: "10px 14px", color: "#374151", whiteSpace: "nowrap" }}>{fmt(req.due_date)}</td>
                              <td style={{ padding: "10px 14px" }}>
                                {daysLeft == null ? (
                                  <span style={{ color: "#9CA3AF" }}>—</span>
                                ) : isOverdue ? (
                                  <span style={{ fontSize: 12, fontWeight: 700, color: "#DC2626" }}>
                                    {Math.abs(daysLeft)}d overdue
                                  </span>
                                ) : isDueSoon ? (
                                  <span style={{ fontSize: 12, fontWeight: 700, color: "#D97706" }}>
                                    {daysLeft}d left
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 12, color: "#6B7280" }}>{daysLeft}d</span>
                                )}
                              </td>
                              <td style={{ padding: "10px 14px", color: "#6B7280" }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <User size={11} />{req.owner || "—"}
                                </span>
                              </td>
                              <td style={{ padding: "10px 14px" }}><StatusBadge status={req.status} /></td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
