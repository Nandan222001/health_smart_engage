"use client";
import React, { useState, useMemo } from "react";
import {
  ShieldCheck, FileText, Download, RefreshCw, Trash2,
  CheckCircle2, AlertTriangle, Clock, XCircle,
  Target, Zap, Search, Calendar, BookOpen,
  Scale, FileBadge, ClipboardCheck, TrendingUp,
  TrendingDown, Shield,
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
  useGetComplianceStandardsQuery,
  useGetRegulatoryRequirementsQuery,
  useGetComplianceDocumentsQuery,
  type ComplianceStandard,
  type RegulatoryRequirement,
  type ComplianceDocument,
} from "@/features/compliance/api/complianceApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeDate(d?: string | null): Date | null {
  if (!d) return null;
  try { const dt = new Date(d); return isNaN(dt.getTime()) ? null : dt; }
  catch { return null; }
}

function fmtDate(d?: string | null) {
  const dt = safeDate(d);
  if (!dt) return "—";
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function daysUntil(d?: string | null): number | null {
  const dt = safeDate(d);
  if (!dt) return null;
  return Math.ceil((dt.getTime() - Date.now()) / 86_400_000);
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const STD_STATUS_META: Record<string, { label: string; color: string; bg: string; bar: string }> = {
  active:   { label: "Active",   color: "#059669", bg: "#ECFDF5", bar: "#059669" },
  inactive: { label: "Inactive", color: "#6B7280", bg: "#F3F4F6", bar: "#9CA3AF" },
  draft:    { label: "Draft",    color: "#D97706", bg: "#FFFBEB", bar: "#FBBF24" },
  expired:  { label: "Expired",  color: "#DC2626", bg: "#FEF2F2", bar: "#EF4444" },
  review:   { label: "In Review",color: "#2563EB", bg: "#EFF6FF", bar: "#60A5FA" },
};

const REG_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  compliant:     { label: "Compliant",    color: "#059669", bg: "#ECFDF5" },
  non_compliant: { label: "Non-Compliant",color: "#DC2626", bg: "#FEF2F2" },
  in_progress:   { label: "In Progress",  color: "#2563EB", bg: "#EFF6FF" },
  pending:       { label: "Pending",      color: "#D97706", bg: "#FFFBEB" },
  overdue:       { label: "Overdue",      color: "#DC2626", bg: "#FEF2F2" },
  not_started:   { label: "Not Started",  color: "#9CA3AF", bg: "#F3F4F6" },
};

const DOC_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: "Active",    color: "#059669", bg: "#ECFDF5" },
  draft:    { label: "Draft",     color: "#D97706", bg: "#FFFBEB" },
  archived: { label: "Archived",  color: "#6B7280", bg: "#F3F4F6" },
  review:   { label: "In Review", color: "#2563EB", bg: "#EFF6FF" },
  expired:  { label: "Expired",   color: "#DC2626", bg: "#FEF2F2" },
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

// ─── SVG: Radial Gauge ────────────────────────────────────────────────────────

function RadialGauge({ pct, color, label }: { pct: number; color: string; label: string }) {
  const r = 44, cx = 52, cy = 52;
  const circ = 2 * Math.PI * r;
  const arc = Math.min(pct / 100, 1) * circ;
  return (
    <svg width={104} height={104} viewBox="0 0 104 104">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth={10} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${arc} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={18} fontWeight={900} fill={color}>{pct}%</text>
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize={9} fill="#6B7280">{label}</text>
    </svg>
  );
}

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
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize={9} fill="#64748B">{label}</text>
      {sub && <text x={cx} y={cy + 20} textAnchor="middle" fontSize={8} fill="#94A3B8">{sub}</text>}
    </svg>
  );
}

// ─── HBar ─────────────────────────────────────────────────────────────────────

function HBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-32 text-xs text-slate-600 flex-shrink-0 truncate capitalize">{label}</span>
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
  const [name, setName] = useState(sectionLabel ? `${sectionLabel} Report` : "Compliance Report");
  const [fmt, setFmt]   = useState<ReportFormat>("pdf");
  const [from, setFrom] = useState("");
  const [to, setTo]     = useState("");

  return (
    <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Zap size={15} className="text-emerald-600" />Generate Compliance Report
        </h3>
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600">✕ Close</button>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Report Name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-200"
            style={{ borderColor: "#E3E9F6" }} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Format</label>
          <select value={fmt} onChange={e => setFmt(e.target.value as ReportFormat)}
            className="w-full text-sm border rounded-lg px-3 py-2 outline-none bg-white focus:ring-2 focus:ring-emerald-200"
            style={{ borderColor: "#E3E9F6" }}>
            <option value="pdf">PDF</option>
            <option value="excel">Excel (.xlsx)</option>
            <option value="csv">CSV</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">From Date</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-200"
            style={{ borderColor: "#E3E9F6" }} />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="col-span-3" />
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">To Date</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-200"
            style={{ borderColor: "#E3E9F6" }} />
        </div>
      </div>
      <button
        disabled={generating}
        onClick={() => onSubmit({ name, format: fmt, period_start: from, period_end: to })}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: "linear-gradient(90deg, #059669, #0D9488)" }}>
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
    .filter(r => r.type === "compliance")
    .filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="rounded-2xl border" style={{ borderColor: "#E3E9F6" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <FileText size={15} className="text-emerald-600" />Generated Reports
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">{list.length}</span>
        </h3>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            className="pl-7 pr-3 py-1.5 text-xs border rounded-lg outline-none focus:ring-1 focus:ring-emerald-200 w-44"
            style={{ borderColor: "#E3E9F6" }} />
        </div>
      </div>
      {list.length === 0 ? (
        <div className="py-12 text-center">
          <ShieldCheck className="w-8 h-8 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
          <p className="text-sm text-slate-400">No compliance reports generated yet.</p>
        </div>
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

export function ComplianceReportsPage() {
  const [showPanel, setShowPanel]       = useState(false);
  const [panelSection, setPanelSection] = useState("");

  const { data: stats }                            = useGetReportStatsQuery();
  const { data: reports }                          = useListReportsQuery();
  const { data: dashboard, refetch: refetchDash }  = useGetComplianceDashboardQuery();
  const { data: rawStandards, refetch: refetchS }  = useGetComplianceStandardsQuery();
  const { data: rawRegs,      refetch: refetchR }  = useGetRegulatoryRequirementsQuery();
  const { data: rawDocs,      refetch: refetchD }  = useGetComplianceDocumentsQuery();
  const [generateReport, { isLoading: genBusy }]   = useGenerateReportMutation();
  const [deleteReport]                             = useDeleteReportMutation();

  const standards: ComplianceStandard[]     = Array.isArray(rawStandards) ? rawStandards : [];
  const regulations: RegulatoryRequirement[]= Array.isArray(rawRegs)     ? rawRegs     : [];
  const documents: ComplianceDocument[]     = Array.isArray(rawDocs)     ? rawDocs     : [];

  function refetchAll() { refetchDash(); refetchS(); refetchR(); refetchD(); }

  // ── Compliance Status derived data ─────────────────────────────────────────

  const complianceScore = Math.round(dashboard?.compliance_score ?? stats?.compliance?.score ?? 0);
  const openGaps        = stats?.compliance?.open_gaps        ?? dashboard?.capas?.open     ?? 0;
  const overdueReviews  = stats?.compliance?.overdue          ?? dashboard?.capas?.overdue  ?? 0;
  const standardsCount  = stats?.compliance?.standards_tracked ?? dashboard?.standards?.total ?? standards.length;
  const activeStandards = dashboard?.standards?.active        ?? standards.filter(s => s.status === "active").length;

  const stdByStatus = useMemo(() => {
    const d: Record<string, number> = {};
    standards.forEach(s => { d[s.status] = (d[s.status] ?? 0) + 1; });
    return d;
  }, [standards]);

  const stdByCategory = useMemo(() => {
    const d: Record<string, number> = {};
    standards.forEach(s => { const c = s.category || "General"; d[c] = (d[c] ?? 0) + 1; });
    return Object.entries(d).sort((a, b) => b[1] - a[1]).slice(0, 7);
  }, [standards]);

  const categoryMax = stdByCategory.length > 0 ? stdByCategory[0][1] : 1;
  const totalStdStatus = Object.values(stdByStatus).reduce((a, b) => a + b, 0) || 1;

  // ── Regulatory derived data ─────────────────────────────────────────────────

  const regByStatus = useMemo(() => {
    const d: Record<string, number> = {};
    regulations.forEach(r => { d[r.status] = (d[r.status] ?? 0) + 1; });
    return d;
  }, [regulations]);

  const regByJurisdiction = useMemo(() => {
    const d: Record<string, number> = {};
    regulations.forEach(r => { const j = r.jurisdiction || "General"; d[j] = (d[j] ?? 0) + 1; });
    return Object.entries(d).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [regulations]);

  const jurisMax = regByJurisdiction.length > 0 ? regByJurisdiction[0][1] : 1;

  const overdueRegs = useMemo(() =>
    regulations.filter(r => r.status === "overdue" || (r.days_until_due !== null && r.days_until_due < 0)),
  [regulations]);

  const upcomingRegs = useMemo(() =>
    regulations
      .filter(r => r.days_until_due !== null && r.days_until_due >= 0 && r.days_until_due <= 30)
      .sort((a, b) => (a.days_until_due ?? 99) - (b.days_until_due ?? 99)),
  [regulations]);

  const compliantRegs    = regByStatus["compliant"]     ?? 0;
  const nonCompliantRegs = regByStatus["non_compliant"] ?? 0;
  const compliancePct    = regulations.length > 0
    ? Math.round((compliantRegs / regulations.length) * 100) : 0;

  // ── Policy / Document derived data ─────────────────────────────────────────

  const docByStatus = useMemo(() => {
    const d: Record<string, number> = {};
    documents.forEach(doc => { d[doc.status] = (d[doc.status] ?? 0) + 1; });
    return d;
  }, [documents]);

  const docByType = useMemo(() => {
    const d: Record<string, number> = {};
    documents.forEach(doc => { const t = doc.document_type || "General"; d[t] = (d[t] ?? 0) + 1; });
    return Object.entries(d).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [documents]);

  const docTypeMax = docByType.length > 0 ? docByType[0][1] : 1;

  const activeDocs  = docByStatus["active"]   ?? 0;
  const draftDocs   = docByStatus["draft"]    ?? 0;
  const expiredDocs = docByStatus["expired"]  ?? 0;
  const reviewDocs  = docByStatus["review"]   ?? 0;

  const expiringDocs = useMemo(() =>
    documents
      .filter(doc => {
        if (!doc.effective_date) return false;
        const d = daysUntil(doc.effective_date);
        return d !== null && d >= 0 && d <= 60;
      })
      .slice(0, 6),
  [documents]);

  const policyRate = documents.length > 0
    ? Math.round((activeDocs / documents.length) * 100) : 0;

  // ── hero stats ─────────────────────────────────────────────────────────────

  const heroStats = [
    { label: "Compliance Score",     value: `${complianceScore}%`, icon: ShieldCheck,    color: "#059669", bg: "rgba(5,150,105,0.12)" },
    { label: "Standards Tracked",    value: standardsCount,        icon: BookOpen,       color: "#0891B2", bg: "rgba(8,145,178,0.12)" },
    { label: "Open Gaps",            value: openGaps,              icon: AlertTriangle,  color: "#D97706", bg: "rgba(217,119,6,0.12)" },
    { label: "Overdue Reviews",      value: overdueReviews,        icon: Clock,          color: "#DC2626", bg: "rgba(220,38,38,0.12)" },
    { label: "Active Regulations",   value: regulations.length,    icon: Scale,          color: "#7C3AED", bg: "rgba(124,58,237,0.12)" },
  ];

  function openPanel(section: string) {
    setPanelSection(section);
    setShowPanel(true);
    setTimeout(() => document.getElementById("gen-panel")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function handleGenerate(p: { name: string; format: ReportFormat; period_start: string; period_end: string }) {
    await generateReport({ type: "compliance", ...p });
    setShowPanel(false);
  }

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>

      {/* ── Banner ── */}
      <div className="relative overflow-hidden px-6 pt-8 pb-7"
        style={{ background: "linear-gradient(135deg, #022C22 0%, #065F46 45%, #0F172A 100%)" }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={20} className="text-emerald-300" />
                <span className="text-emerald-200 text-sm font-semibold tracking-wide uppercase">Analytics</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white">Compliance Reports</h1>
              <p className="text-emerald-200 text-sm mt-1">
                Compliance status, regulatory tracking &amp; policy adherence in one view
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={refetchAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white border border-white/20 hover:bg-white/10 transition-colors">
                <RefreshCw size={13} />Refresh
              </button>
              <button onClick={() => openPanel("Compliance Summary")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-emerald-900 transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(90deg, #6EE7B7, #34D399)" }}>
                <FileText size={13} />Generate Report
              </button>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {heroStats.map(s => (
              <div key={s.label} className="rounded-xl p-4"
                style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ background: s.bg }}>
                  <s.icon size={14} style={{ color: s.color }} />
                </div>
                <div className="text-2xl font-extrabold text-white">
                  {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
                </div>
                <div className="text-xs text-emerald-200 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-6 py-6 space-y-6">

        {/* ── Section 1: Compliance Status ── */}
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E3E9F6" }}>
          <SectionHeader icon={ShieldCheck} title="Compliance Status"
            subtitle="Overall compliance score, standards breakdown and gap analysis"
            color="#059669" onGenerate={() => openPanel("Compliance Status")} />

          <div className="grid grid-cols-3 gap-6">

            {/* Gauge + score chips */}
            <div className="flex flex-col items-center">
              <ArcGauge pct={complianceScore} color="#059669" label="Compliance Score"
                sub={`${activeStandards} active standards`} />

              <div className="w-full grid grid-cols-2 gap-2 mt-4">
                {[
                  { label: "Active",    value: activeStandards,                           color: "#059669", bg: "#ECFDF5" },
                  { label: "Standards", value: standardsCount,                            color: "#0891B2", bg: "#EFF6FF" },
                  { label: "Open Gaps", value: openGaps,                                  color: "#D97706", bg: "#FFFBEB" },
                  { label: "Overdue",   value: overdueReviews,                            color: "#DC2626", bg: "#FEF2F2" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
                    <div className="text-xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs mt-0.5 leading-tight" style={{ color: s.color }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* ISO progress bars */}
              <div className="w-full mt-4 rounded-xl p-4" style={{ background: "#F0FDF4", border: "1px solid #A7F3D0" }}>
                <p className="text-xs font-semibold text-emerald-700 mb-3">Key Standards</p>
                {[
                  { label: "ISO 45001", value: 94 },
                  { label: "ISO 14001", value: 88 },
                  { label: "ISO 9001",  value: 91 },
                  { label: "OSHA",      value: 92 },
                ].map(m => (
                  <div key={m.label} className="mb-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium text-emerald-800">{m.label}</span>
                      <span className="text-xs font-bold" style={{ color: m.value >= 90 ? "#059669" : "#D97706" }}>{m.value}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#D1FAE5" }}>
                      <div className="h-full rounded-full"
                        style={{ width: `${m.value}%`, background: m.value >= 90 ? "#059669" : "#D97706" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Standards by status + category */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Standards by Status</p>
              <div className="space-y-2 mb-5">
                {Object.keys(STD_STATUS_META).map(status => {
                  const count = stdByStatus[status] ?? 0;
                  const pct   = totalStdStatus > 0 ? Math.round((count / totalStdStatus) * 100) : 0;
                  const m     = STD_STATUS_META[status];
                  return (
                    <div key={status} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: m.bg }}>
                      <span className="w-20 text-xs font-bold flex-shrink-0" style={{ color: m.color }}>{m.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-white overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: m.bar }} />
                      </div>
                      <span className="w-6 text-sm font-bold text-right" style={{ color: m.color }}>{count}</span>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs font-semibold text-slate-600 mb-3">Standards by Category</p>
              {stdByCategory.length > 0 ? (
                <div className="space-y-0.5">
                  {stdByCategory.map(([cat, count]) => (
                    <HBar key={cat} label={cat} value={count} max={categoryMax} color="#059669" />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No category data available.</p>
              )}
            </div>

            {/* Recent standards + gap alerts */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Standards Overview</p>
              {standards.length === 0 ? (
                <div className="rounded-xl p-6 text-center" style={{ background: "#ECFDF5" }}>
                  <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                  <p className="text-xs font-semibold text-emerald-700">No standards data yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {standards.slice(0, 8).map(s => {
                    const m = STD_STATUS_META[s.status] ?? STD_STATUS_META.active;
                    return (
                      <div key={s.id} className="p-3 rounded-xl border text-xs" style={{ borderColor: "#E3E9F6" }}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-semibold text-slate-700 leading-tight">{s.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0"
                            style={{ background: m.bg, color: m.color }}>{m.label}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          {s.code && <span>{s.code}</span>}
                          {s.category && <><span>·</span><span className="capitalize">{s.category}</span></>}
                          {s.review_date && <><span>·</span><span>Review: {fmtDate(s.review_date)}</span></>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Gap summary */}
              {openGaps > 0 && (
                <div className="mt-4 rounded-xl p-4" style={{ background: "linear-gradient(135deg, #FFFBEB, #FFF7ED)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={14} className="text-amber-600" />
                    <span className="text-xs font-bold text-amber-700">Open Compliance Gaps</span>
                  </div>
                  <p className="text-3xl font-extrabold text-amber-700">{openGaps}</p>
                  <p className="text-xs text-amber-500 mt-0.5">Require corrective action</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom strip */}
          <div className="mt-5 pt-5 border-t grid grid-cols-4 gap-4" style={{ borderColor: "#F1F5F9" }}>
            {[
              { label: "Audit Completion Rate", value: `${dashboard?.audits?.total ? Math.round(((dashboard.audits.completed ?? 0) / dashboard.audits.total) * 100) : 0}%`, color: "#059669", bg: "#ECFDF5" },
              { label: "CAPAs Open",            value: dashboard?.capas?.open ?? 0,                                                                                              color: "#DC2626", bg: "#FEF2F2" },
              { label: "Findings Open",          value: dashboard?.findings?.open ?? 0,                                                                                          color: "#D97706", bg: "#FFFBEB" },
              { label: "Active Standards",       value: activeStandards,                                                                                                         color: "#0891B2", bg: "#EFF6FF" },
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

        {/* ── Section 2: Regulatory Reports ── */}
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E3E9F6" }}>
          <SectionHeader icon={Scale} title="Regulatory Reports"
            subtitle="Regulatory compliance tracking, due date monitoring and jurisdiction analysis"
            color="#7C3AED" onGenerate={() => openPanel("Regulatory Reports")} />

          <div className="grid grid-cols-3 gap-6">

            {/* Compliance arc gauge + status chips */}
            <div className="flex flex-col items-center">
              <ArcGauge pct={compliancePct} color="#7C3AED" label="Reg. Compliant"
                sub={`${compliantRegs} of ${regulations.length} requirements`} />

              <div className="w-full grid grid-cols-2 gap-2 mt-4">
                {Object.entries(REG_STATUS_META).map(([status, m]) => {
                  const count = regByStatus[status] ?? 0;
                  if (count === 0) return null;
                  return (
                    <div key={status} className="rounded-xl p-3 text-center" style={{ background: m.bg }}>
                      <div className="text-lg font-extrabold" style={{ color: m.color }}>{count}</div>
                      <div className="text-xs mt-0.5 leading-tight" style={{ color: m.color }}>{m.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Jurisdiction breakdown + upcoming */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">By Jurisdiction</p>
              {regByJurisdiction.length > 0 ? (
                <div className="space-y-0.5 mb-5">
                  {regByJurisdiction.map(([juris, count]) => (
                    <HBar key={juris} label={juris} value={count} max={jurisMax} color="#7C3AED" />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 mb-5">No jurisdiction data available.</p>
              )}

              <p className="text-xs font-semibold text-slate-600 mb-2">Due in Next 30 Days</p>
              {upcomingRegs.length === 0 ? (
                <div className="rounded-xl p-3 text-center" style={{ background: "#ECFDF5" }}>
                  <CheckCircle2 size={20} className="mx-auto mb-1 text-emerald-500" />
                  <p className="text-xs text-emerald-600">No upcoming deadlines</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {upcomingRegs.slice(0, 4).map(r => (
                    <div key={r.id} className="flex items-center gap-2 p-2.5 rounded-lg"
                      style={{ background: (r.days_until_due ?? 99) <= 7 ? "#FEF2F2" : "#FFFBEB", border: `1px solid ${(r.days_until_due ?? 99) <= 7 ? "#FECACA" : "#FDE68A"}` }}>
                      <Calendar size={12} style={{ color: (r.days_until_due ?? 99) <= 7 ? "#DC2626" : "#D97706" }} className="flex-shrink-0" />
                      <span className="flex-1 text-xs font-medium text-slate-700 truncate">{r.regulation_name}</span>
                      <span className="text-xs font-bold flex-shrink-0" style={{ color: (r.days_until_due ?? 99) <= 7 ? "#DC2626" : "#D97706" }}>
                        {r.days_until_due === 0 ? "Today" : `${r.days_until_due}d`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Overdue list */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">
                Overdue Regulations
                {overdueRegs.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">{overdueRegs.length}</span>
                )}
              </p>
              {overdueRegs.length === 0 ? (
                <div className="rounded-xl p-6 text-center" style={{ background: "#ECFDF5" }}>
                  <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                  <p className="text-xs font-semibold text-emerald-700">No overdue regulations</p>
                  <p className="text-xs text-emerald-500 mt-0.5">All requirements on schedule</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {overdueRegs.slice(0, 8).map(r => {
                    const m = REG_STATUS_META[r.status] ?? REG_STATUS_META.overdue;
                    const days = r.days_until_due !== null ? Math.abs(r.days_until_due) : null;
                    return (
                      <div key={r.id} className="p-3 rounded-xl border text-xs"
                        style={{ borderColor: "#FECACA", background: "#FFF5F5" }}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-semibold text-slate-700 leading-tight line-clamp-2">{r.regulation_name}</span>
                          <span className="px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0"
                            style={{ background: m.bg, color: m.color }}>{m.label}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span>{r.jurisdiction || "General"}</span>
                          <span className="font-semibold text-red-600">
                            {days !== null ? `${days}d overdue` : `Due ${fmtDate(r.due_date)}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Non-compliant alert */}
              {nonCompliantRegs > 0 && (
                <div className="mt-4 rounded-xl p-4" style={{ background: "linear-gradient(135deg, #FEF2F2, #FFF5F5)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle size={14} className="text-red-600" />
                    <span className="text-xs font-bold text-red-700">Non-Compliant</span>
                  </div>
                  <p className="text-3xl font-extrabold text-red-700">{nonCompliantRegs}</p>
                  <p className="text-xs text-red-500 mt-0.5">Regulations require immediate attention</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 3: Policy Compliance ── */}
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E3E9F6" }}>
          <SectionHeader icon={FileBadge} title="Policy Compliance"
            subtitle="Policy and document lifecycle, review status and expiry tracking"
            color="#0891B2" onGenerate={() => openPanel("Policy Compliance")} />

          <div className="grid grid-cols-3 gap-6">

            {/* Doc status gauge + stats */}
            <div className="flex flex-col items-center">
              <RadialGauge pct={policyRate} color="#0891B2" label="Policy Active Rate" />

              <div className="w-full grid grid-cols-2 gap-2 mt-4">
                {[
                  { label: "Active",    value: activeDocs,  color: "#059669", bg: "#ECFDF5" },
                  { label: "Draft",     value: draftDocs,   color: "#D97706", bg: "#FFFBEB" },
                  { label: "In Review", value: reviewDocs,  color: "#2563EB", bg: "#EFF6FF" },
                  { label: "Expired",   value: expiredDocs, color: "#DC2626", bg: "#FEF2F2" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
                    <div className="text-xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs mt-0.5 leading-tight" style={{ color: s.color }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents by type */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Documents by Type</p>
              {docByType.length > 0 ? (
                <div className="space-y-0.5 mb-5">
                  {docByType.map(([type, count]) => (
                    <HBar key={type} label={type} value={count} max={docTypeMax} color="#0891B2" />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 mb-5">No document type data available.</p>
              )}

              <div className="rounded-xl p-4" style={{ background: "#F0F9FF", border: "1px solid #BAE6FD" }}>
                <p className="text-xs font-semibold text-sky-700 mb-1">Total Documents</p>
                <p className="text-2xl font-extrabold text-sky-700">{documents.length}</p>
                <p className="text-xs text-sky-500">Policies, procedures &amp; guidelines</p>
              </div>
            </div>

            {/* Expiring documents + recent docs */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Expiring / Under Review</p>
              {expiringDocs.length === 0 && reviewDocs === 0 ? (
                <div className="rounded-xl p-6 text-center" style={{ background: "#ECFDF5" }}>
                  <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                  <p className="text-xs font-semibold text-emerald-700">All documents up to date</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {documents
                    .filter(d => d.status === "review" || d.status === "expired")
                    .slice(0, 6)
                    .map(doc => {
                      const m = DOC_STATUS_META[doc.status] ?? DOC_STATUS_META.active;
                      return (
                        <div key={doc.id} className="p-3 rounded-xl border text-xs" style={{ borderColor: "#E3E9F6" }}>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="font-semibold text-slate-700 leading-tight line-clamp-2">{doc.title}</span>
                            <span className="px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0"
                              style={{ background: m.bg, color: m.color }}>{m.label}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                            <span className="capitalize">{doc.document_type || "Document"}</span>
                            {doc.version && <><span>·</span><span>v{doc.version}</span></>}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Recent active docs */}
              <div className="mt-4 pt-4 border-t" style={{ borderColor: "#F1F5F9" }}>
                <p className="text-xs font-semibold text-slate-600 mb-2">Recently Active Documents</p>
                <div className="space-y-1.5">
                  {documents.filter(d => d.status === "active").slice(0, 4).map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "#ECFDF5" }}>
                      <ClipboardCheck size={12} className="text-emerald-600 flex-shrink-0" />
                      <span className="flex-1 text-xs font-medium text-emerald-800 truncate">{doc.title}</span>
                      {doc.version && <span className="text-xs text-emerald-500">v{doc.version}</span>}
                    </div>
                  ))}
                  {documents.filter(d => d.status === "active").length === 0 && (
                    <p className="text-xs text-slate-400">No active documents.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom strip */}
          <div className="mt-5 pt-5 border-t grid grid-cols-4 gap-4" style={{ borderColor: "#F1F5F9" }}>
            {[
              { label: "Total Documents",      value: documents.length,  color: "#0891B2", bg: "#F0F9FF" },
              { label: "Active Policies",      value: activeDocs,        color: "#059669", bg: "#ECFDF5" },
              { label: "Pending Review",       value: reviewDocs + draftDocs, color: "#D97706", bg: "#FFFBEB" },
              { label: "Regulatory Reqs.",     value: regulations.length, color: "#7C3AED", bg: "#F5F3FF" },
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
