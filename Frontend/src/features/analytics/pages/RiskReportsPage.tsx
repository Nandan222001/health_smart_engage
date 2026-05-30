"use client";
import React, { useState, useMemo } from "react";
import {
  ShieldAlert, FileText, Download, RefreshCw, Trash2,
  AlertTriangle, CheckCircle2, Clock, TrendingDown,
  TrendingUp, Zap, Search, MapPin, BarChart3,
  Activity, Target, Flame, Eye,
} from "lucide-react";
import {
  useGetReportStatsQuery,
  useListReportsQuery,
  useGenerateReportMutation,
  useDeleteReportMutation,
  type ReportFormat,
} from "@/features/analytics/api/reportsApi";
import {
  useListHazardsQuery,
  useListRiskAssessmentsQuery,
  useGetRiskMatrixQuery,
  useGetHighRiskAreasQuery,
  useListNearMissQuery,
  type Hazard,
  type RiskAssessment,
  type HighRiskArea,
} from "@/features/hazards/api/hazardsApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d?: string | null) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return "—"; }
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const SEV_KEYS = ["critical", "high", "medium", "low"] as const;
type SevKey = typeof SEV_KEYS[number];

const SEV_META: Record<SevKey, { label: string; bar: string; bg: string; text: string }> = {
  critical: { label: "Critical", bar: "#EF4444", bg: "#FEF2F2", text: "#991B1B" },
  high:     { label: "High",     bar: "#FB923C", bg: "#FFF7ED", text: "#9A3412" },
  medium:   { label: "Medium",   bar: "#FBBF24", bg: "#FFFBEB", text: "#92400E" },
  low:      { label: "Low",      bar: "#34D399", bg: "#ECFDF5", text: "#065F46" },
};

const RISK_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  draft:    { label: "Draft",    color: "#6B7280", bg: "#F3F4F6" },
  active:   { label: "Active",   color: "#2563EB", bg: "#EFF6FF" },
  archived: { label: "Archived", color: "#9CA3AF", bg: "#F9FAFB" },
};

const HAZ_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  open:      { label: "Open",      color: "#DC2626", bg: "#FEF2F2" },
  mitigated: { label: "Mitigated", color: "#D97706", bg: "#FFFBEB" },
  closed:    { label: "Closed",    color: "#059669", bg: "#ECFDF5" },
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

// ─── Heatmap color helper ─────────────────────────────────────────────────────

function cellColor(likelihood: number, consequence: number): string {
  const score = likelihood * consequence;
  if (score >= 15) return "#EF4444";
  if (score >= 8)  return "#FB923C";
  if (score >= 4)  return "#FBBF24";
  return "#34D399";
}

function cellLabel(likelihood: number, consequence: number): string {
  const score = likelihood * consequence;
  if (score >= 15) return "Critical";
  if (score >= 8)  return "High";
  if (score >= 4)  return "Medium";
  return "Low";
}

// ─── SVG: Risk Heatmap ────────────────────────────────────────────────────────

function RiskHeatmap({
  matrixCounts,
  assessments,
}: {
  matrixCounts: Record<string, number>;
  assessments: Array<{ likelihood: number; consequence: number; risk_score: number; title: string; status: string }>;
}) {
  const CELL = 52, PAD = 36;
  const W = PAD + 5 * CELL + 10;
  const H = PAD + 5 * CELL + 10;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 310 }}>
      {/* Axis labels */}
      <text x={PAD + 5 * CELL / 2} y={H - 2} textAnchor="middle" fontSize={9} fill="#64748B" fontWeight={600}>
        Consequence →
      </text>
      <text x={10} y={PAD + 5 * CELL / 2} textAnchor="middle" fontSize={9} fill="#64748B" fontWeight={600}
        transform={`rotate(-90, 10, ${PAD + 5 * CELL / 2})`}>
        Likelihood →
      </text>

      {[1, 2, 3, 4, 5].map((l) =>
        [1, 2, 3, 4, 5].map((c) => {
          const x = PAD + (c - 1) * CELL;
          const y = PAD + (5 - l) * CELL;
          const key = `${l}_${c}`;
          const count = matrixCounts[key] ?? matrixCounts[`${l},${c}`] ?? 0;
          const color = cellColor(l, c);
          const opacity = count > 0 ? 1 : 0.18;

          return (
            <g key={key}>
              <rect x={x + 1} y={y + 1} width={CELL - 2} height={CELL - 2}
                rx={4} fill={color} opacity={opacity} />
              {count > 0 && (
                <>
                  <circle cx={x + CELL / 2} cy={y + CELL / 2} r={14} fill="rgba(0,0,0,0.18)" />
                  <text x={x + CELL / 2} y={y + CELL / 2 + 5}
                    textAnchor="middle" fontSize={13} fontWeight={800} fill="white">{count}</text>
                </>
              )}
            </g>
          );
        })
      )}

      {/* Axis tick numbers */}
      {[1, 2, 3, 4, 5].map(n => (
        <React.Fragment key={n}>
          {/* consequence (x axis) */}
          <text x={PAD + (n - 1) * CELL + CELL / 2} y={PAD - 6}
            textAnchor="middle" fontSize={9} fill="#94A3B8">{n}</text>
          {/* likelihood (y axis) */}
          <text x={PAD - 8} y={PAD + (5 - n) * CELL + CELL / 2 + 3}
            textAnchor="middle" fontSize={9} fill="#94A3B8">{n}</text>
        </React.Fragment>
      ))}
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
  const [name, setName] = useState(sectionLabel ? `${sectionLabel} Report` : "Risk Report");
  const [fmt, setFmt]   = useState<ReportFormat>("pdf");
  const [from, setFrom] = useState("");
  const [to, setTo]     = useState("");

  return (
    <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Zap size={15} className="text-orange-500" />Generate Risk Report
        </h3>
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600">✕ Close</button>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Report Name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200"
            style={{ borderColor: "#E3E9F6" }} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Format</label>
          <select value={fmt} onChange={e => setFmt(e.target.value as ReportFormat)}
            className="w-full text-sm border rounded-lg px-3 py-2 outline-none bg-white focus:ring-2 focus:ring-orange-200"
            style={{ borderColor: "#E3E9F6" }}>
            <option value="pdf">PDF</option>
            <option value="excel">Excel (.xlsx)</option>
            <option value="csv">CSV</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">From Date</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200"
            style={{ borderColor: "#E3E9F6" }} />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="col-span-3" />
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">To Date</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200"
            style={{ borderColor: "#E3E9F6" }} />
        </div>
      </div>
      <button
        disabled={generating}
        onClick={() => onSubmit({ name, format: fmt, period_start: from, period_end: to })}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: "linear-gradient(90deg, #EA580C, #DC2626)" }}>
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
    .filter(r => r.type === "risk")
    .filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="rounded-2xl border" style={{ borderColor: "#E3E9F6" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <FileText size={15} className="text-orange-500" />Generated Reports
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700">{list.length}</span>
        </h3>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            className="pl-7 pr-3 py-1.5 text-xs border rounded-lg outline-none focus:ring-1 focus:ring-orange-200 w-44"
            style={{ borderColor: "#E3E9F6" }} />
        </div>
      </div>
      {list.length === 0 ? (
        <div className="py-12 text-center">
          <BarChart3 className="w-8 h-8 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
          <p className="text-sm text-slate-400">No risk reports generated yet.</p>
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

export function RiskReportsPage() {
  const [showPanel, setShowPanel]       = useState(false);
  const [panelSection, setPanelSection] = useState("");

  const { data: stats }                              = useGetReportStatsQuery();
  const { data: reports }                            = useListReportsQuery();
  const { data: rawHazards,     refetch: refetchH }  = useListHazardsQuery();
  const { data: rawAssessments, refetch: refetchA }  = useListRiskAssessmentsQuery();
  const { data: matrixData,     refetch: refetchM }  = useGetRiskMatrixQuery();
  const { data: highRiskData,   refetch: refetchHR } = useGetHighRiskAreasQuery();
  const { data: nearMissData,   refetch: refetchNM } = useListNearMissQuery();
  const [generateReport, { isLoading: genBusy }]     = useGenerateReportMutation();
  const [deleteReport]                               = useDeleteReportMutation();

  const hazards:     Hazard[]          = Array.isArray(rawHazards)              ? rawHazards              : [];
  const assessments: RiskAssessment[]  = Array.isArray(rawAssessments)          ? rawAssessments          : [];
  const highRiskAreas: HighRiskArea[]  = Array.isArray(highRiskData?.items)     ? highRiskData!.items     : [];
  const nearMisses                     = Array.isArray(nearMissData?.items)      ? nearMissData!.items     : [];

  function refetchAll() { refetchH(); refetchA(); refetchM(); refetchHR(); refetchNM(); }

  // ── Risk Register derived ──────────────────────────────────────────────────

  const riskStats = stats?.risk ?? { total: 0, high_risk: 0, medium_risk: 0, controls_reviewed: 0 };

  const assessByLevel = useMemo(() => {
    const d: Record<string, number> = {};
    assessments.forEach(a => { d[a.risk_level] = (d[a.risk_level] ?? 0) + 1; });
    if (Object.keys(d).length === 0 && matrixData?.by_level) return matrixData.by_level;
    return d;
  }, [assessments, matrixData]);

  const assessByStatus = useMemo(() => {
    const d: Record<string, number> = {};
    assessments.forEach(a => { d[a.status] = (d[a.status] ?? 0) + 1; });
    return d;
  }, [assessments]);

  const assessByDept = useMemo(() => {
    const d: Record<string, number> = {};
    assessments.forEach(a => { const dept = a.department || "General"; d[dept] = (d[dept] ?? 0) + 1; });
    return Object.entries(d).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [assessments]);

  const deptMax = assessByDept.length > 0 ? assessByDept[0][1] : 1;

  const totalAssess = matrixData?.total_assessments ?? riskStats.total ?? assessments.length;
  const highRisk    = (assessByLevel["critical"] ?? 0) + (assessByLevel["high"] ?? 0);
  const highRiskPct = totalAssess > 0 ? Math.round((highRisk / totalAssess) * 100) : 0;

  const recentAssessments = useMemo(() =>
    [...assessments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6),
  [assessments]);

  // ── Hazard derived ─────────────────────────────────────────────────────────

  const hazBySev = useMemo(() => {
    const d: Record<string, number> = {};
    hazards.forEach(h => { d[h.severity] = (d[h.severity] ?? 0) + 1; });
    return d;
  }, [hazards]);

  const hazByStatus = useMemo(() => {
    const d: Record<string, number> = {};
    hazards.forEach(h => { d[h.status] = (d[h.status] ?? 0) + 1; });
    return d;
  }, [hazards]);

  const hazByType = useMemo(() => {
    const d: Record<string, number> = {};
    hazards.forEach(h => { const t = h.type || "Other"; d[t] = (d[t] ?? 0) + 1; });
    return Object.entries(d).sort((a, b) => b[1] - a[1]).slice(0, 7);
  }, [hazards]);

  const hazTypeMax = hazByType.length > 0 ? hazByType[0][1] : 1;

  const totalHaz     = hazards.length;
  const openHazards  = hazByStatus["open"]      ?? 0;
  const mitigated    = hazByStatus["mitigated"] ?? 0;
  const closedHaz    = hazByStatus["closed"]    ?? 0;
  const criticalHaz  = hazBySev["critical"]     ?? 0;
  const highHaz      = hazBySev["high"]         ?? 0;
  const mitigPct     = totalHaz > 0 ? Math.round(((mitigated + closedHaz) / totalHaz) * 100) : 0;

  const totalHazSev = Object.values(hazBySev).reduce((a, b) => a + b, 0) || 1;

  const recentOpenHazards = useMemo(() =>
    hazards.filter(h => h.status === "open")
      .sort((a, b) => new Date(b.identified_at).getTime() - new Date(a.identified_at).getTime())
      .slice(0, 6),
  [hazards]);

  // ── Heatmap derived ────────────────────────────────────────────────────────

  const matrixCounts = matrixData?.matrix_counts ?? {};
  const matrixAssessments = matrixData?.assessments ?? [];

  const heatmapLegend = [
    { label: "Low (1–3)",      color: "#34D399" },
    { label: "Medium (4–7)",   color: "#FBBF24" },
    { label: "High (8–14)",    color: "#FB923C" },
    { label: "Critical (15+)", color: "#EF4444" },
  ];

  const topHighRisk = useMemo(() =>
    [...highRiskAreas].sort((a, b) => b.risk_score - a.risk_score).slice(0, 6),
  [highRiskAreas]);

  // ── Hero stats ─────────────────────────────────────────────────────────────

  const heroStats = [
    { label: "Total Assessments", value: totalAssess,               icon: BarChart3,    color: "#EA580C", bg: "rgba(234,88,12,0.12)" },
    { label: "High Risk Items",   value: highRisk,                  icon: Flame,        color: "#DC2626", bg: "rgba(220,38,38,0.12)" },
    { label: "Open Hazards",      value: openHazards,               icon: AlertTriangle,color: "#D97706", bg: "rgba(217,119,6,0.12)" },
    { label: "Near Misses",       value: nearMisses.length,         icon: Eye,          color: "#7C3AED", bg: "rgba(124,58,237,0.12)" },
    { label: "Controls Reviewed", value: riskStats.controls_reviewed, icon: CheckCircle2, color: "#059669", bg: "rgba(5,150,105,0.12)" },
  ];

  function openPanel(section: string) {
    setPanelSection(section);
    setShowPanel(true);
    setTimeout(() => document.getElementById("gen-panel")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function handleGenerate(p: { name: string; format: ReportFormat; period_start: string; period_end: string }) {
    await generateReport({ type: "risk", ...p });
    setShowPanel(false);
  }

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>

      {/* ── Banner ── */}
      <div className="relative overflow-hidden px-6 pt-8 pb-7"
        style={{ background: "linear-gradient(135deg, #431407 0%, #9A3412 45%, #0F172A 100%)" }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert size={20} className="text-orange-300" />
                <span className="text-orange-200 text-sm font-semibold tracking-wide uppercase">Analytics</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white">Risk Reports</h1>
              <p className="text-orange-200 text-sm mt-1">
                Risk register, hazard tracking &amp; heatmap analysis in one view
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={refetchAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white border border-white/20 hover:bg-white/10 transition-colors">
                <RefreshCw size={13} />Refresh
              </button>
              <button onClick={() => openPanel("Risk Summary")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-orange-900 transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(90deg, #FED7AA, #FCA5A5)" }}>
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
                <div className="text-xs text-orange-200 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-6 py-6 space-y-6">

        {/* ── Section 1: Risk Register Reports ── */}
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E3E9F6" }}>
          <SectionHeader icon={Activity} title="Risk Register Reports"
            subtitle="Risk assessment breakdown by level, status, department and review timeline"
            color="#EA580C" onGenerate={() => openPanel("Risk Register")} />

          <div className="grid grid-cols-3 gap-6">

            {/* Arc gauge + status chips */}
            <div className="flex flex-col items-center">
              <ArcGauge pct={highRiskPct} color="#EA580C" label="High / Critical"
                sub={`${highRisk} of ${totalAssess} assessments`} />

              <div className="w-full grid grid-cols-2 gap-2 mt-4">
                {SEV_KEYS.map(sev => {
                  const count = (assessByLevel[sev] ?? 0) as number;
                  const m = SEV_META[sev];
                  return (
                    <div key={sev} className="rounded-xl p-3 text-center" style={{ background: m.bg }}>
                      <div className="text-xl font-extrabold" style={{ color: m.text }}>{count}</div>
                      <div className="text-xs mt-0.5 leading-tight" style={{ color: m.text }}>{m.label}</div>
                    </div>
                  );
                })}
              </div>

              {/* Status distribution */}
              <div className="w-full mt-4 rounded-xl p-3" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
                <p className="text-xs font-semibold text-orange-700 mb-2">Assessment Status</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.entries(RISK_STATUS_META).map(([status, m]) => {
                    const count = assessByStatus[status] ?? 0;
                    return (
                      <div key={status} className="rounded-lg p-2 text-center" style={{ background: m.bg }}>
                        <div className="text-base font-extrabold" style={{ color: m.color }}>{count}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: m.color }}>{m.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Risk level bars + dept breakdown */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Risk Level Distribution</p>
              <div className="space-y-2 mb-5">
                {SEV_KEYS.map(sev => {
                  const count = (assessByLevel[sev] ?? 0) as number;
                  const pct   = totalAssess > 0 ? Math.round((count / totalAssess) * 100) : 0;
                  const m     = SEV_META[sev];
                  return (
                    <div key={sev} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: m.bg }}>
                      <span className="w-16 text-xs font-bold flex-shrink-0" style={{ color: m.text }}>{m.label}</span>
                      <div className="flex-1 h-3 rounded-full bg-white overflow-hidden shadow-inner">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: m.bar }} />
                      </div>
                      <span className="w-8 text-sm font-extrabold text-right" style={{ color: m.text }}>{count}</span>
                      <span className="w-10 text-xs text-slate-400 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs font-semibold text-slate-600 mb-3">By Department</p>
              {assessByDept.length > 0 ? (
                <div className="space-y-0.5">
                  {assessByDept.map(([dept, count]) => (
                    <HBar key={dept} label={dept} value={count} max={deptMax} color="#EA580C" />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No department data available.</p>
              )}
            </div>

            {/* Recent assessments */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Recent Risk Assessments</p>
              {recentAssessments.length === 0 ? (
                <div className="rounded-xl p-6 text-center" style={{ background: "#FFF7ED" }}>
                  <Activity size={24} className="mx-auto mb-2 text-orange-400" />
                  <p className="text-xs font-semibold text-orange-600">No assessments yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentAssessments.map(a => {
                    const lm = SEV_META[a.risk_level as SevKey] ?? SEV_META.low;
                    const sm = RISK_STATUS_META[a.status] ?? RISK_STATUS_META.draft;
                    return (
                      <div key={a.id} className="p-3 rounded-xl border text-xs" style={{ borderColor: "#E3E9F6" }}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-semibold text-slate-700 leading-tight line-clamp-2">{a.title}</span>
                          <span className="px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0"
                            style={{ background: lm.bg, color: lm.text }}>{lm.label}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>{a.assessor}</span>
                          <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: sm.bg, color: sm.color }}>{sm.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Controls reviewed */}
              <div className="mt-4 rounded-xl p-4" style={{ background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">Controls Reviewed</span>
                </div>
                <p className="text-3xl font-extrabold text-emerald-700">{riskStats.controls_reviewed}</p>
                <p className="text-xs text-emerald-500 mt-0.5">Risk controls verified this period</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2: Hazard Reports ── */}
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E3E9F6" }}>
          <SectionHeader icon={AlertTriangle} title="Hazard Reports"
            subtitle="Hazard severity breakdown, type classification and open hazard tracking"
            color="#DC2626" onGenerate={() => openPanel("Hazard Reports")} />

          <div className="grid grid-cols-3 gap-6">

            {/* Severity breakdown */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Hazards by Severity</p>
              <div className="space-y-2">
                {SEV_KEYS.map(sev => {
                  const count = hazBySev[sev] ?? 0;
                  const pct   = totalHazSev > 0 ? Math.round((count / totalHazSev) * 100) : 0;
                  const m     = SEV_META[sev];
                  return (
                    <div key={sev} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: m.bg }}>
                      <span className="w-16 text-xs font-bold flex-shrink-0" style={{ color: m.text }}>{m.label}</span>
                      <div className="flex-1 h-2.5 rounded-full bg-white overflow-hidden shadow-inner">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: m.bar }} />
                      </div>
                      <span className="w-6 text-sm font-extrabold text-right" style={{ color: m.text }}>{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* Status chips */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { label: "Open",      count: openHazards, ...HAZ_STATUS_META.open },
                  { label: "Mitigated", count: mitigated,   ...HAZ_STATUS_META.mitigated },
                  { label: "Closed",    count: closedHaz,   ...HAZ_STATUS_META.closed },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
                    <div className="text-lg font-extrabold" style={{ color: s.color }}>{s.count}</div>
                    <div className="text-xs mt-0.5" style={{ color: s.color }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Mitigation rate */}
              <div className="mt-4 rounded-xl p-3" style={{ background: "#F0FDF4", border: "1px solid #A7F3D0" }}>
                <p className="text-xs font-semibold text-emerald-700 mb-1">Mitigation Rate</p>
                <p className="text-2xl font-extrabold text-emerald-700">{mitigPct}%</p>
                <div className="h-2 mt-1 rounded-full overflow-hidden" style={{ background: "#D1FAE5" }}>
                  <div className="h-full rounded-full" style={{ width: `${mitigPct}%`, background: "#059669" }} />
                </div>
              </div>
            </div>

            {/* Hazard by type + near miss */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Hazards by Type</p>
              {hazByType.length > 0 ? (
                <div className="space-y-0.5 mb-5">
                  {hazByType.map(([type, count]) => (
                    <HBar key={type} label={type} value={count} max={hazTypeMax} color="#DC2626" />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 mb-5">No hazard type data available.</p>
              )}

              {/* Near miss + critical summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-4 text-center" style={{ background: "#F5F3FF" }}>
                  <div className="text-2xl font-extrabold text-violet-700">{nearMisses.length}</div>
                  <div className="text-xs font-semibold text-violet-600 mt-1">Near Misses</div>
                </div>
                <div className="rounded-xl p-4 text-center" style={{ background: "#FEF2F2" }}>
                  <div className="text-2xl font-extrabold text-red-700">{criticalHaz + highHaz}</div>
                  <div className="text-xs font-semibold text-red-600 mt-1">Critical + High</div>
                </div>
              </div>

              {/* Total hazards */}
              <div className="mt-3 rounded-xl p-4" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
                <p className="text-xs font-semibold text-orange-700 mb-1">Total Hazards Logged</p>
                <p className="text-2xl font-extrabold text-orange-700">{totalHaz}</p>
                <p className="text-xs text-orange-500">Across all sites and departments</p>
              </div>
            </div>

            {/* Open hazards list */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">
                Open Hazards
                {openHazards > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">{openHazards}</span>
                )}
              </p>
              {recentOpenHazards.length === 0 ? (
                <div className="rounded-xl p-6 text-center" style={{ background: "#ECFDF5" }}>
                  <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                  <p className="text-xs font-semibold text-emerald-700">No open hazards</p>
                  <p className="text-xs text-emerald-500 mt-0.5">All hazards mitigated or closed</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {recentOpenHazards.map(h => {
                    const m = SEV_META[h.severity as SevKey] ?? SEV_META.low;
                    return (
                      <div key={h.id} className="p-3 rounded-xl border text-xs"
                        style={{ borderColor: "#FECACA", background: "#FFF5F5" }}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-semibold text-slate-700 leading-tight line-clamp-2">{h.title}</span>
                          <span className="px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0"
                            style={{ background: m.bg, color: m.text }}>{m.label}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <span className="capitalize">{h.type}</span>
                          {h.site_id && <><span>·</span><MapPin size={10} /><span>{h.site_id}</span></>}
                          <span className="ml-auto">{fmtDate(h.identified_at)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 3: Risk Heatmap ── */}
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E3E9F6" }}>
          <SectionHeader icon={Target} title="Risk Heatmap"
            subtitle="Likelihood vs consequence matrix — each cell shows the number of risk assessments at that score"
            color="#7C3AED" onGenerate={() => openPanel("Risk Heatmap")} />

          <div className="grid grid-cols-3 gap-6">

            {/* Heatmap SVG */}
            <div className="col-span-2">
              <div className="flex items-center gap-4 mb-3 flex-wrap">
                {heatmapLegend.map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
                    <span className="text-xs text-slate-500">{l.label}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl p-4" style={{ background: "#F8F9FF", border: "1px solid #E3E9F6" }}>
                <RiskHeatmap matrixCounts={matrixCounts} assessments={matrixAssessments} />
              </div>

              {/* Heatmap totals row */}
              <div className="grid grid-cols-4 gap-3 mt-4">
                {[
                  { label: "Critical",     count: (matrixData?.by_level?.critical ?? assessByLevel["critical"] ?? 0) as number, color: "#EF4444", bg: "#FEF2F2" },
                  { label: "High",         count: (matrixData?.by_level?.high     ?? assessByLevel["high"]     ?? 0) as number, color: "#FB923C", bg: "#FFF7ED" },
                  { label: "Medium",       count: (matrixData?.by_level?.medium   ?? assessByLevel["medium"]   ?? 0) as number, color: "#FBBF24", bg: "#FFFBEB" },
                  { label: "Low",          count: (matrixData?.by_level?.low      ?? assessByLevel["low"]      ?? 0) as number, color: "#34D399", bg: "#ECFDF5" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
                    <div className="text-xl font-extrabold" style={{ color: s.color }}>{s.count}</div>
                    <div className="text-xs mt-0.5 font-semibold" style={{ color: s.color }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* High risk areas list */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">
                High Risk Areas
                {highRiskAreas.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">{highRiskAreas.length}</span>
                )}
              </p>

              {topHighRisk.length === 0 ? (
                <div className="rounded-xl p-6 text-center" style={{ background: "#F5F3FF" }}>
                  <Target size={24} className="mx-auto mb-2 text-violet-400" />
                  <p className="text-xs font-semibold text-violet-600">No high-risk areas recorded</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {topHighRisk.map(area => {
                    const score = area.risk_score;
                    const color = score >= 15 ? "#EF4444" : score >= 8 ? "#FB923C" : score >= 4 ? "#FBBF24" : "#34D399";
                    const bg    = score >= 15 ? "#FEF2F2" : score >= 8 ? "#FFF7ED" : score >= 4 ? "#FFFBEB" : "#ECFDF5";
                    const label = cellLabel(area.likelihood, area.consequence);
                    return (
                      <div key={area.id} className="p-3 rounded-xl border text-xs" style={{ borderColor: "#E3E9F6" }}>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="font-semibold text-slate-700 leading-tight line-clamp-2">{area.title}</span>
                          <span className="px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0"
                            style={{ background: bg, color }}>{label}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500">
                          <span>L: {area.likelihood}</span>
                          <span>C: {area.consequence}</span>
                          <span className="ml-auto font-bold" style={{ color }}>Score: {area.risk_score}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min((area.risk_score / 25) * 100, 100)}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Near miss summary */}
              <div className="mt-4 rounded-xl p-4" style={{ background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <Eye size={14} className="text-violet-600" />
                  <span className="text-xs font-bold text-violet-700">Near Misses Logged</span>
                </div>
                <p className="text-3xl font-extrabold text-violet-700">{nearMisses.length}</p>
                <p className="text-xs text-violet-500 mt-0.5">Unplanned events requiring review</p>
              </div>

              {/* Total assessments */}
              <div className="mt-3 rounded-xl p-4 text-center"
                style={{ background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)" }}>
                <p className="text-xs font-semibold text-orange-700 mb-0.5">Total Assessments</p>
                <p className="text-3xl font-extrabold text-orange-700">{totalAssess}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {highRiskPct > 20
                    ? <TrendingUp size={12} className="text-red-500" />
                    : <TrendingDown size={12} className="text-emerald-500" />}
                  <span className="text-xs" style={{ color: highRiskPct > 20 ? "#DC2626" : "#059669" }}>
                    {highRiskPct}% high / critical
                  </span>
                </div>
              </div>
            </div>
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
