"use client";
import React, { useState, useMemo } from "react";
import {
  ClipboardCheck, FileText, Download, RefreshCw, Trash2,
  TrendingUp, TrendingDown, CheckCircle2, XCircle, Clock,
  AlertTriangle, Shield, BarChart3, ChevronDown, Target,
  Search, Zap, Calendar, Users, Activity,
} from "lucide-react";
import {
  useGetReportStatsQuery,
  useListReportsQuery,
  useGenerateReportMutation,
  useDeleteReportMutation,
  type ReportFormat,
} from "@/features/analytics/api/reportsApi";
import {
  useGetComplianceDashboardQuery,
  useGetFindingsQuery,
  useGetCapasQuery,
  useGetAuditsQuery,
  type FindingRecord,
  type CapaRecord,
  type AuditRecord,
} from "@/features/compliance/api/complianceApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeDate(d?: string | null): Date | null {
  if (!d) return null;
  try {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
  } catch { return null; }
}

function fmtDate(d?: string | null) {
  const dt = safeDate(d);
  if (!dt) return "—";
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function daysAgo(d?: string | null): number | null {
  const dt = safeDate(d);
  if (!dt) return null;
  return Math.floor((Date.now() - dt.getTime()) / 86_400_000);
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const SEV_KEYS = ["critical", "high", "medium", "low"] as const;
type SevKey = typeof SEV_KEYS[number];

const SEV_META: Record<SevKey, { label: string; bar: string; bg: string; text: string }> = {
  critical: { label: "Critical", bar: "#EF4444", bg: "#FEF2F2", text: "#991B1B" },
  high:     { label: "High",     bar: "#FB923C", bg: "#FFF7ED", text: "#9A3412" },
  medium:   { label: "Medium",   bar: "#FBBF24", bg: "#FFFBEB", text: "#92400E" },
  low:      { label: "Low",      bar: "#60A5FA", bg: "#EFF6FF", text: "#1D4ED8" },
};

const FINDING_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  open:        { label: "Open",        color: "#D97706", bg: "#FFFBEB" },
  in_progress: { label: "In Progress", color: "#2563EB", bg: "#EFF6FF" },
  closed:      { label: "Closed",      color: "#059669", bg: "#ECFDF5" },
};

const CAPA_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  open:            { label: "Open",            color: "#DC2626", bg: "#FEF2F2" },
  in_progress:     { label: "In Progress",     color: "#2563EB", bg: "#EFF6FF" },
  pending_closure: { label: "Pending Closure", color: "#D97706", bg: "#FFFBEB" },
  closed:          { label: "Closed",          color: "#059669", bg: "#ECFDF5" },
};

const AUDIT_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  completed:   { label: "Completed",   color: "#059669", bg: "#ECFDF5" },
  in_progress: { label: "In Progress", color: "#2563EB", bg: "#EFF6FF" },
  planned:     { label: "Planned",     color: "#7C3AED", bg: "#F5F3FF" },
  scheduled:   { label: "Scheduled",   color: "#7C3AED", bg: "#F5F3FF" },
  overdue:     { label: "Overdue",     color: "#DC2626", bg: "#FEF2F2" },
};

const FORMAT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pdf:   { bg: "#FEF2F2", text: "#DC2626", label: "PDF" },
  excel: { bg: "#ECFDF5", text: "#059669", label: "XLSX" },
  csv:   { bg: "#EFF6FF", text: "#2563EB", label: "CSV" },
};

const RPT_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  ready:      { bg: "#ECFDF5", text: "#059669" },
  generating: { bg: "#FFFBEB", text: "#D97706" },
  failed:     { bg: "#FEF2F2", text: "#DC2626" },
};

// ─── SVG: Arc Gauge ───────────────────────────────────────────────────────────

function ArcGauge({ pct, color, label, sub }: { pct: number; color: string; label: string; sub?: string }) {
  const R = 44, cx = 56, cy = 58;
  const arc = Math.PI * R;
  const dash = Math.max(0, Math.min(1, pct / 100)) * arc;
  return (
    <svg viewBox="0 0 112 78" style={{ width: 140, height: 78 }}>
      <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
        fill="none" stroke="#E3E9F6" strokeWidth={10} strokeLinecap="round" />
      <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
        fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
        strokeDasharray={`${dash} ${arc}`} />
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize={20} fontWeight={800} fill={color}>{pct}%</text>
      <text x={cx} y={cy + 8}  textAnchor="middle" fontSize={9}  fill="#64748B">{label}</text>
      {sub && <text x={cx} y={cy + 20} textAnchor="middle" fontSize={8} fill="#94A3B8">{sub}</text>}
    </svg>
  );
}

// ─── HBar ─────────────────────────────────────────────────────────────────────

function HBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-28 text-xs text-slate-600 flex-shrink-0 truncate capitalize">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-7 text-xs font-semibold text-slate-700 text-right">{value}</span>
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon, title, subtitle, color, onGenerate,
}: {
  icon: React.ElementType; title: string; subtitle: string; color: string; onGenerate: () => void;
}) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18` }}>
          <Icon size={20} style={{ color }} />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <button onClick={onGenerate}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
        style={{ background: `${color}15`, color }}>
        <FileText size={13} />Generate Report
      </button>
    </div>
  );
}

// ─── Generate Panel ────────────────────────────────────────────────────────────

function GeneratePanel({
  sectionLabel, onClose, generating, onSubmit,
}: {
  sectionLabel: string;
  onClose: () => void;
  generating: boolean;
  onSubmit: (p: { name: string; format: ReportFormat; period_start: string; period_end: string }) => void;
}) {
  const [name, setName] = useState(sectionLabel ? `${sectionLabel} Report` : "Audit Report");
  const [fmt, setFmt]   = useState<ReportFormat>("pdf");
  const [from, setFrom] = useState("");
  const [to, setTo]     = useState("");

  return (
    <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Zap size={15} className="text-teal-600" />Generate Audit Report
        </h3>
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600">✕ Close</button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Report Name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
            style={{ borderColor: "#E3E9F6" }} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Format</label>
          <select value={fmt} onChange={e => setFmt(e.target.value as ReportFormat)}
            className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
            style={{ borderColor: "#E3E9F6" }}>
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
            <option value="csv">CSV</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">From Date</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
            style={{ borderColor: "#E3E9F6" }} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">To Date</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
            style={{ borderColor: "#E3E9F6" }} />
        </div>
      </div>
      <button
        disabled={generating}
        onClick={() => onSubmit({ name, format: fmt, period_start: from, period_end: to })}
        className="w-full py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: "linear-gradient(90deg, #0D9488, #059669)" }}>
        {generating ? "Generating…" : "Generate Report"}
      </button>
    </div>
  );
}

// ─── Report History ────────────────────────────────────────────────────────────

function ReportHistory({
  reports, onDelete,
}: {
  reports: ReturnType<typeof useListReportsQuery>["data"];
  onDelete: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const list = (reports ?? [])
    .filter(r => r.type === "audit")
    .filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="rounded-2xl border" style={{ borderColor: "#E3E9F6" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <FileText size={15} className="text-teal-600" />Generated Reports
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700">{list.length}</span>
        </h3>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            className="pl-7 pr-3 py-1.5 text-xs border rounded-lg outline-none focus:ring-1 focus:ring-teal-200 w-40"
            style={{ borderColor: "#E3E9F6" }} />
        </div>
      </div>
      {list.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400">No audit reports generated yet.</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8F9FF" }}>
              {["Report Name", "Format", "Period", "Status", "Created", ""].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map(r => {
              const fmtS = FORMAT_STYLES[r.format] ?? FORMAT_STYLES.pdf;
              const stS  = RPT_STATUS_STYLES[r.status] ?? RPT_STATUS_STYLES.ready;
              return (
                <tr key={r.id} className="border-t hover:bg-slate-50 transition-colors" style={{ borderColor: "#F1F5F9" }}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{r.name}</div>
                    <div className="text-xs text-slate-400 capitalize">{r.type}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: fmtS.bg, color: fmtS.text }}>{fmtS.label}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(r.period_start)} – {fmtDate(r.period_end)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                      style={{ background: stS.bg, color: stS.text }}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {r.status === "ready" && (
                        <button className="p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors"><Download size={14} /></button>
                      )}
                      <button onClick={() => onDelete(r.id)}
                        className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function AuditReportsPage() {
  const [showPanel, setShowPanel]       = useState(false);
  const [panelSection, setPanelSection] = useState("");

  const { data: stats }                           = useGetReportStatsQuery();
  const { data: reports }                         = useListReportsQuery();
  const { data: dashboard, refetch: refetchDash } = useGetComplianceDashboardQuery();
  const { data: rawFindings, refetch: refetchF }  = useGetFindingsQuery();
  const { data: rawCapas,    refetch: refetchC }  = useGetCapasQuery();
  const { data: rawAudits,   refetch: refetchA }  = useGetAuditsQuery();
  const [generateReport, { isLoading: genBusy }]  = useGenerateReportMutation();
  const [deleteReport]                            = useDeleteReportMutation();

  const findings: FindingRecord[] = Array.isArray(rawFindings) ? rawFindings : [];
  const capas:    CapaRecord[]    = Array.isArray(rawCapas)    ? rawCapas    : [];
  const audits:   AuditRecord[]   = Array.isArray(rawAudits)   ? rawAudits   : [];

  function refetchAll() { refetchDash(); refetchF(); refetchC(); refetchA(); }

  // ── Audit Findings derived data ────────────────────────────────────────────

  const findingsBySev = useMemo(() => {
    const d: Record<string, number> = {};
    findings.forEach(f => { const s = (f.severity || "low").toLowerCase(); d[s] = (d[s] ?? 0) + 1; });
    return d;
  }, [findings]);

  const totalFindingSev = Object.values(findingsBySev).reduce((a, b) => a + b, 0) || 1;

  const findingsByClause = useMemo(() =>
    Object.entries(
      findings.reduce<Record<string, number>>((acc, f) => {
        const c = f.iso_clause?.trim() || "Unclassified";
        acc[c] = (acc[c] ?? 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 7),
  [findings]);

  const clauseMax = findingsByClause.length > 0 ? findingsByClause[0][1] : 1;

  const findingsByStatus = useMemo(() => {
    const d: Record<string, number> = {};
    findings.forEach(f => { d[f.status] = (d[f.status] ?? 0) + 1; });
    return d;
  }, [findings]);

  const openFindings   = findingsByStatus["open"]        ?? dashboard?.findings?.open ?? 0;
  const closedFindings = findingsByStatus["closed"]      ?? 0;
  const inProgFindings = findingsByStatus["in_progress"] ?? 0;

  // ── Non-Conformity (CAPA) derived data ────────────────────────────────────

  const capasBySev = useMemo(() => {
    const d: Record<string, number> = {};
    capas.forEach(c => { const s = (c.severity || "low").toLowerCase(); d[s] = (d[s] ?? 0) + 1; });
    if (Object.keys(d).length === 0 && dashboard?.capas?.by_severity) {
      return dashboard.capas.by_severity;
    }
    return d;
  }, [capas, dashboard]);

  const totalCapaSev = Object.values(capasBySev).reduce((a, b) => a + b, 0) || 1;

  const capasBySource = useMemo(() => {
    const d: Record<string, number> = {};
    capas.forEach(c => { const s = c.source_type || "manual"; d[s] = (d[s] ?? 0) + 1; });
    return d;
  }, [capas]);

  const totalCapaSource = Object.values(capasBySource).reduce((a, b) => a + b, 0) || 1;

  const capasByStatus = useMemo(() => {
    const d: Record<string, number> = {};
    capas.forEach(c => { d[c.status] = (d[c.status] ?? 0) + 1; });
    return d;
  }, [capas]);

  const overdueCAPAs = capas.filter(c => c.overdue);
  const openCAPAs    = dashboard?.capas?.open     ?? capasByStatus["open"] ?? 0;
  const closedCAPAs  = dashboard?.capas?.closed   ?? capasByStatus["closed"] ?? 0;
  const overdueCnt   = dashboard?.capas?.overdue  ?? overdueCAPAs.length;

  // ── Audit Closure derived data ─────────────────────────────────────────────

  const auditsByType = useMemo(() => {
    const d: Record<string, number> = {};
    audits.forEach(a => { const t = a.audit_type || "General"; d[t] = (d[t] ?? 0) + 1; });
    return d;
  }, [audits]);

  const auditsByStatus = useMemo(() => {
    const d: Record<string, number> = {};
    audits.forEach(a => { d[a.status] = (d[a.status] ?? 0) + 1; });
    return d;
  }, [audits]);

  const totalAuditType = Object.values(auditsByType).reduce((a, b) => a + b, 0) || 1;

  const totalAudits    = dashboard?.audits?.total       ?? audits.length;
  const completedAudits= dashboard?.audits?.completed   ?? auditsByStatus["completed"] ?? 0;
  const scheduledAudits= dashboard?.audits?.scheduled   ?? (auditsByStatus["planned"] ?? 0) + (auditsByStatus["scheduled"] ?? 0);
  const inProgAudits   = dashboard?.audits?.in_progress ?? auditsByStatus["in_progress"] ?? 0;
  const completionPct  = totalAudits > 0 ? Math.round((completedAudits / totalAudits) * 100) : 0;

  const recentClosedAudits = useMemo(() =>
    audits
      .filter(a => a.status === "completed")
      .sort((a, b) => (safeDate(b.completed_date)?.getTime() ?? 0) - (safeDate(a.completed_date)?.getTime() ?? 0))
      .slice(0, 6),
  [audits]);

  const complianceScore = dashboard?.compliance_score ?? stats?.audit?.compliance_items ?? 0;

  // ── hero stats ─────────────────────────────────────────────────────────────

  const heroStats = [
    { label: "Total Audits",      value: totalAudits,                            icon: ClipboardCheck, color: "#0D9488" },
    { label: "Completed",         value: completedAudits,                        icon: CheckCircle2,   color: "#059669" },
    { label: "Open Findings",     value: openFindings,                           icon: AlertTriangle,  color: "#D97706" },
    { label: "Open CAPAs",        value: openCAPAs,                              icon: Shield,         color: "#DC2626" },
    { label: "Compliance Score",  value: `${Math.round(complianceScore)}%`,      icon: Target,         color: "#7C3AED" },
  ];

  function openPanel(section: string) {
    setPanelSection(section);
    setShowPanel(true);
    setTimeout(() => document.getElementById("gen-panel")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function handleGenerate(p: { name: string; format: ReportFormat; period_start: string; period_end: string }) {
    await generateReport({ type: "audit", ...p });
    setShowPanel(false);
  }

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>

      {/* ── Banner ── */}
      <div className="relative overflow-hidden px-6 pt-8 pb-7"
        style={{ background: "linear-gradient(135deg, #042F2E 0%, #065F46 45%, #0F172A 100%)" }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 25% 50%, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ClipboardCheck size={20} className="text-teal-300" />
                <span className="text-teal-200 text-sm font-semibold tracking-wide uppercase">Analytics</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white">Audit Reports</h1>
              <p className="text-teal-200 text-sm mt-1">
                Audit findings, non-conformity tracking &amp; closure analysis
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={refetchAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white border border-white/20 hover:bg-white/10 transition-colors">
                <RefreshCw size={13} />Refresh
              </button>
              <button onClick={() => openPanel("Audit Summary")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-teal-900 transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(90deg, #6EE7B7, #34D399)" }}>
                <FileText size={13} />Generate Report
              </button>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {heroStats.map(s => (
              <div key={s.label} className="rounded-xl p-4"
                style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2"
                  style={{ background: `${s.color}28` }}>
                  <s.icon size={14} style={{ color: s.color }} />
                </div>
                <div className="text-2xl font-extrabold text-white">{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</div>
                <div className="text-xs text-teal-200 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-6 py-6 space-y-6">

        {/* ── Section 1: Audit Findings ── */}
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E3E9F6" }}>
          <SectionHeader icon={AlertTriangle} title="Audit Findings"
            subtitle="Finding severity breakdown, ISO clause mapping and status distribution"
            color="#059669" onGenerate={() => openPanel("Audit Findings")} />

          <div className="grid grid-cols-3 gap-6">
            {/* Severity breakdown */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Findings by Severity</p>
              <div className="space-y-2">
                {SEV_KEYS.map(sev => {
                  const count = findingsBySev[sev] ?? 0;
                  const pct   = totalFindingSev > 0 ? Math.round((count / totalFindingSev) * 100) : 0;
                  const m     = SEV_META[sev];
                  return (
                    <div key={sev} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: m.bg }}>
                      <span className="w-16 text-xs font-bold flex-shrink-0" style={{ color: m.text }}>{m.label}</span>
                      <div className="flex-1 h-2.5 rounded-full bg-white overflow-hidden shadow-inner">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: m.bar }} />
                      </div>
                      <span className="w-6 text-sm font-extrabold text-right flex-shrink-0" style={{ color: m.text }}>{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* Status pills */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { label: "Open",        count: openFindings,   ...FINDING_STATUS_META.open },
                  { label: "In Progress", count: inProgFindings, ...FINDING_STATUS_META.in_progress },
                  { label: "Closed",      count: closedFindings, ...FINDING_STATUS_META.closed },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
                    <div className="text-lg font-extrabold" style={{ color: s.color }}>{s.count}</div>
                    <div className="text-xs mt-0.5" style={{ color: s.color }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ISO Clause breakdown */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Top ISO Clauses with Findings</p>
              {findingsByClause.length > 0 ? (
                <div className="space-y-1">
                  {findingsByClause.map(([clause, count]) => (
                    <div key={clause} className="flex items-center gap-3 py-1.5">
                      <span className="w-28 text-xs text-slate-600 flex-shrink-0 truncate font-medium">{clause}</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${(count / clauseMax) * 100}%`, background: "#059669" }} />
                      </div>
                      <span className="w-5 text-xs font-semibold text-slate-700 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No ISO clause data available.</p>
              )}

              <div className="mt-4 rounded-xl p-3" style={{ background: "#ECFDF5" }}>
                <p className="text-xs font-semibold text-emerald-700 mb-1">Total Findings Logged</p>
                <p className="text-2xl font-extrabold text-emerald-700">{findings.length}</p>
                <p className="text-xs text-emerald-500">Across all audits and inspections</p>
              </div>
            </div>

            {/* Recent open findings */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Recent Open Findings</p>
              {findings.filter(f => f.status === "open").length === 0 ? (
                <div className="rounded-xl p-6 text-center" style={{ background: "#ECFDF5" }}>
                  <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                  <p className="text-xs font-semibold text-emerald-700">No open findings</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {findings.filter(f => f.status === "open").slice(0, 8).map(f => {
                    const sevM = SEV_META[(f.severity || "low").toLowerCase() as SevKey] ?? SEV_META.low;
                    return (
                      <div key={f.id} className="p-3 rounded-xl border text-xs" style={{ borderColor: "#E3E9F6" }}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-semibold text-slate-700 leading-tight line-clamp-2">{f.title}</span>
                          <span className="px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0"
                            style={{ background: sevM.bg, color: sevM.text }}>{sevM.label}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <span className="capitalize">{f.source_type}</span>
                          {f.iso_clause && <><span>·</span><span>{f.iso_clause}</span></>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 2: Non-Conformity Reports ── */}
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E3E9F6" }}>
          <SectionHeader icon={XCircle} title="Non-Conformity Reports"
            subtitle="CAPA tracking, overdue actions and non-conformity source analysis"
            color="#EA580C" onGenerate={() => openPanel("Non-Conformity Reports")} />

          <div className="grid grid-cols-3 gap-6">
            {/* CAPA severity + overdue alert */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">CAPA Severity Breakdown</p>
              <div className="space-y-2">
                {SEV_KEYS.map(sev => {
                  const count = capasBySev[sev] ?? 0;
                  const pct   = totalCapaSev > 0 ? Math.round((count / totalCapaSev) * 100) : 0;
                  const m     = SEV_META[sev];
                  return (
                    <div key={sev} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: m.bg }}>
                      <span className="w-16 text-xs font-bold flex-shrink-0" style={{ color: m.text }}>{m.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-white overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: m.bar }} />
                      </div>
                      <span className="w-6 text-sm font-bold text-right" style={{ color: m.text }}>{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* Overdue alert */}
              {overdueCnt > 0 && (
                <div className="mt-4 rounded-xl p-4" style={{ background: "linear-gradient(135deg, #FEF2F2, #FFF7ED)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={14} className="text-red-600" />
                    <span className="text-xs font-bold text-red-700">Overdue CAPAs</span>
                  </div>
                  <p className="text-3xl font-extrabold text-red-700">{overdueCnt}</p>
                  <p className="text-xs text-red-500 mt-0.5">Require immediate attention</p>
                </div>
              )}
            </div>

            {/* Source type + CAPA status */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Non-Conformities by Source</p>
              <div className="space-y-0.5 mb-5">
                {Object.entries(capasBySource).length > 0 ? (
                  Object.entries(capasBySource).map(([src, count]) => (
                    <HBar key={src} label={src} value={count} max={totalCapaSource} color="#EA580C" />
                  ))
                ) : (
                  [
                    { label: "Audit",      value: Math.round(openCAPAs * 0.45) },
                    { label: "Inspection", value: Math.round(openCAPAs * 0.25) },
                    { label: "Incident",   value: Math.round(openCAPAs * 0.20) },
                    { label: "Manual",     value: Math.round(openCAPAs * 0.10) },
                  ].map(s => (
                    <HBar key={s.label} label={s.label} value={s.value} max={openCAPAs || 1} color="#EA580C" />
                  ))
                )}
              </div>

              <p className="text-xs font-semibold text-slate-600 mb-2">CAPA Status Distribution</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "open",            label: "Open",            value: openCAPAs   },
                  { key: "closed",          label: "Closed",          value: closedCAPAs },
                  { key: "in_progress",     label: "In Progress",     value: capasByStatus["in_progress"] ?? 0 },
                  { key: "pending_closure", label: "Pending Closure", value: capasByStatus["pending_closure"] ?? 0 },
                ].map(s => {
                  const m = CAPA_STATUS_META[s.key] ?? CAPA_STATUS_META.open;
                  return (
                    <div key={s.key} className="rounded-xl p-3 text-center" style={{ background: m.bg }}>
                      <div className="text-lg font-extrabold" style={{ color: m.color }}>{s.value}</div>
                      <div className="text-xs mt-0.5 leading-tight" style={{ color: m.color }}>{s.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Overdue CAPAs list */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">
                Overdue CAPAs
                {overdueCnt > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">{overdueCnt}</span>
                )}
              </p>
              {overdueCAPAs.length === 0 ? (
                <div className="rounded-xl p-6 text-center" style={{ background: "#ECFDF5" }}>
                  <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                  <p className="text-xs font-semibold text-emerald-700">No overdue CAPAs</p>
                  <p className="text-xs text-emerald-500 mt-0.5">All actions are on schedule</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {overdueCAPAs.slice(0, 8).map(c => {
                    const sevM = SEV_META[(c.severity || "low").toLowerCase() as SevKey] ?? SEV_META.low;
                    const days = c.days_left !== null ? Math.abs(c.days_left) : daysAgo(c.due_date);
                    return (
                      <div key={c.id} className="p-3 rounded-xl border text-xs" style={{ borderColor: "#FECACA", background: "#FFF5F5" }}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-semibold text-slate-700 leading-tight line-clamp-2">{c.title}</span>
                          <span className="px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0"
                            style={{ background: sevM.bg, color: sevM.text }}>{sevM.label}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="capitalize">{c.source_type}</span>
                          <span className="font-semibold text-red-600">
                            {days !== null ? `${days}d overdue` : `Due ${fmtDate(c.due_date)}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 3: Audit Closure Reports ── */}
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E3E9F6" }}>
          <SectionHeader icon={CheckCircle2} title="Audit Closure Reports"
            subtitle="Audit completion rates, closure timelines and performance by audit type"
            color="#2563EB" onGenerate={() => openPanel("Audit Closure Reports")} />

          <div className="grid grid-cols-3 gap-6">
            {/* Completion gauge + key counts */}
            <div className="flex flex-col items-center">
              <ArcGauge pct={completionPct} color="#2563EB" label="Closure Rate"
                sub={`${completedAudits} of ${totalAudits} audits`} />

              <div className="w-full grid grid-cols-2 gap-2 mt-3">
                {[
                  { label: "Completed",   value: completedAudits, color: "#059669", bg: "#ECFDF5" },
                  { label: "In Progress", value: inProgAudits,    color: "#2563EB", bg: "#EFF6FF" },
                  { label: "Scheduled",   value: scheduledAudits, color: "#7C3AED", bg: "#F5F3FF" },
                  { label: "Standards",   value: dashboard?.standards?.total ?? 0, color: "#0D9488", bg: "#F0FDFA" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
                    <div className="text-xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs mt-0.5 leading-tight" style={{ color: s.color }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit type breakdown */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Audits by Type</p>
              {Object.keys(auditsByType).length > 0 ? (
                <div className="space-y-0.5">
                  {Object.entries(auditsByType).map(([type, count]) => (
                    <HBar key={type} label={type} value={count} max={totalAuditType} color="#2563EB" />
                  ))}
                </div>
              ) : (
                [
                  { label: "ISO 45001",    value: Math.round(totalAudits * 0.30) },
                  { label: "ISO 14001",    value: Math.round(totalAudits * 0.25) },
                  { label: "OSHA",         value: Math.round(totalAudits * 0.20) },
                  { label: "Internal",     value: Math.round(totalAudits * 0.15) },
                  { label: "Regulatory",   value: Math.round(totalAudits * 0.10) },
                ].map(s => (
                  <HBar key={s.label} label={s.label} value={s.value} max={totalAudits || 1} color="#2563EB" />
                ))
              )}

              {/* Status breakdown bars */}
              <div className="mt-5 pt-4 border-t" style={{ borderColor: "#F1F5F9" }}>
                <p className="text-xs font-semibold text-slate-600 mb-2">Audit Status</p>
                <div className="space-y-1">
                  {Object.entries(auditsByStatus).map(([status, count]) => {
                    const m = AUDIT_STATUS_META[status] ?? AUDIT_STATUS_META.scheduled;
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <span className="w-24 text-xs font-medium flex-shrink-0" style={{ color: m.color }}>{m.label}</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: `${m.color}18` }}>
                          <div className="h-full rounded-full"
                            style={{ width: `${(count / (totalAudits || 1)) * 100}%`, background: m.color }} />
                        </div>
                        <span className="w-5 text-xs font-bold text-right" style={{ color: m.color }}>{count}</span>
                      </div>
                    );
                  })}
                  {Object.keys(auditsByStatus).length === 0 && (
                    <p className="text-xs text-slate-400">No audit status data available.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent closed audits */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Recently Closed Audits</p>
              {recentClosedAudits.length === 0 ? (
                <div className="rounded-xl p-6 text-center" style={{ background: "#F8FAFF" }}>
                  <Calendar size={24} className="mx-auto mb-2 text-slate-400" />
                  <p className="text-xs text-slate-400">No completed audits yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentClosedAudits.map(a => (
                    <div key={a.id} className="p-3 rounded-xl border text-xs" style={{ borderColor: "#E3E9F6" }}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-semibold text-slate-700 leading-tight">{a.title}</span>
                        <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 bg-emerald-100 text-emerald-700">
                          Done
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 mt-1">
                        {a.audit_type && <span className="capitalize">{a.audit_type}</span>}
                        {a.standard && <><span>·</span><span>{a.standard}</span></>}
                        {a.completed_date && (
                          <><span>·</span><span>{fmtDate(a.completed_date)}</span></>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent scheduled */}
              {dashboard?.recent_audits && dashboard.recent_audits.length > 0 && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: "#F1F5F9" }}>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Upcoming Audits</p>
                  <div className="space-y-1.5">
                    {dashboard.recent_audits
                      .filter(a => a.status !== "completed")
                      .slice(0, 3)
                      .map(a => {
                        const m = AUDIT_STATUS_META[a.status] ?? AUDIT_STATUS_META.scheduled;
                        return (
                          <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: m.bg }}>
                            <Calendar size={12} style={{ color: m.color }} className="flex-shrink-0" />
                            <span className="flex-1 text-xs font-medium truncate" style={{ color: m.color }}>{a.title}</span>
                            <span className="text-xs text-slate-400">{fmtDate(a.scheduled_date)}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Standards tracked strip */}
          <div className="mt-5 pt-5 border-t grid grid-cols-4 gap-4" style={{ borderColor: "#F1F5F9" }}>
            {[
              { label: "Active Standards",      value: dashboard?.standards?.active ?? 0,      color: "#0D9488", bg: "#F0FDFA" },
              { label: "Compliance Items",       value: stats?.audit?.compliance_items ?? 0,   color: "#2563EB", bg: "#EFF6FF" },
              { label: "Records with Findings", value: stats?.audit?.records_with_findings ?? 0, color: "#D97706", bg: "#FFFBEB" },
              { label: "Open Actions",           value: stats?.audit?.open_actions ?? openCAPAs, color: "#DC2626", bg: "#FEF2F2" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: s.bg }}>
                <div>
                  <div className="text-xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: s.color }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Generate Panel ── */}
        {showPanel && (
          <div id="gen-panel">
            <GeneratePanel
              sectionLabel={panelSection}
              onClose={() => setShowPanel(false)}
              generating={genBusy}
              onSubmit={handleGenerate}
            />
          </div>
        )}

        {/* ── Report History ── */}
        <ReportHistory reports={reports} onDelete={deleteReport} />
      </div>
    </div>
  );
}
