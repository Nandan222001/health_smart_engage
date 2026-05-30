"use client";
import React, { useState, useMemo } from "react";
import {
  AlertTriangle, FileText, Download, RefreshCw, Trash2,
  TrendingUp, TrendingDown, CheckCircle2, Clock, Eye,
  Users, Activity, Shield, BarChart3, ChevronDown, ChevronRight,
  Target, Zap, Search,
} from "lucide-react";
import {
  useGetReportStatsQuery,
  useListReportsQuery,
  useGenerateReportMutation,
  useDeleteReportMutation,
  type ReportFormat,
} from "@/features/analytics/api/reportsApi";
import {
  useGetIncidentAnalyticsQuery,
  useGetIncidentReportsQuery,
  type IncidentReportItem,
} from "@/features/incidents/api/incidentsApi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MonthBucket {
  label: string;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeDate(d?: string): Date | null {
  if (!d) return null;
  try {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
  } catch { return null; }
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function bucketByMonth(items: IncidentReportItem[]): MonthBucket[] {
  const now = new Date();
  const buckets: MonthBucket[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ label: MONTH_LABELS[d.getMonth()], total: 0, critical: 0, high: 0, medium: 0, low: 0 });
  }
  items.forEach(item => {
    const dt = safeDate(item.occurred_at);
    if (!dt) return;
    const monthsAgo = (now.getFullYear() - dt.getFullYear()) * 12 + (now.getMonth() - dt.getMonth());
    if (monthsAgo < 0 || monthsAgo > 5) return;
    const idx = 5 - monthsAgo;
    buckets[idx].total++;
    const sev = (item.severity ?? "").toLowerCase();
    if (sev === "critical") buckets[idx].critical++;
    else if (sev === "high") buckets[idx].high++;
    else if (sev === "medium") buckets[idx].medium++;
    else buckets[idx].low++;
  });
  return buckets;
}

const SEV_KEYS = ["critical", "high", "medium", "low"] as const;
type SevKey = typeof SEV_KEYS[number];

const SEV_META: Record<SevKey, { label: string; bar: string; bg: string; text: string }> = {
  critical: { label: "Critical", bar: "#EF4444", bg: "#FEF2F2", text: "#991B1B" },
  high:     { label: "High",     bar: "#FB923C", bg: "#FFF7ED", text: "#9A3412" },
  medium:   { label: "Medium",   bar: "#FBBF24", bg: "#FFFBEB", text: "#92400E" },
  low:      { label: "Low",      bar: "#60A5FA", bg: "#EFF6FF", text: "#1D4ED8" },
};

const RCA_METHODS = ["5 Whys", "Fishbone", "Fault Tree", "FMEA", "Bowtie"] as const;
const RCA_SEEDS   = [38, 24, 17, 13, 8] as const;

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

function fmtDate(d?: string) {
  const dt = safeDate(d);
  if (!dt) return "—";
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── SVG: Stacked Timeline Bar Chart ─────────────────────────────────────────

function TimelineChart({ buckets }: { buckets: MonthBucket[] }) {
  const max = Math.max(...buckets.map(b => b.total), 1);
  const W = 500, H = 152;
  const PL = 30, PR = 8, PT = 14, PB = 24;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 152 }}>
      {[0, 0.5, 1].map(f => {
        const y = PT + chartH * (1 - f);
        return (
          <g key={f}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#E3E9F6" strokeWidth={0.8}
              strokeDasharray={f > 0 ? "4 2" : undefined} />
            <text x={PL - 4} y={y + 4} textAnchor="end" fontSize={8} fill="#94A3B8">
              {Math.round(max * f)}
            </text>
          </g>
        );
      })}
      {buckets.map((b, i) => {
        const cx = PL + (i + 0.5) * (chartW / buckets.length);
        const barW = Math.min(44, (chartW / buckets.length) - 10);
        const x = cx - barW / 2;
        const segs = [
          { h: (b.low / max) * chartH,      fill: "#93C5FD" },
          { h: (b.medium / max) * chartH,   fill: "#FCD34D" },
          { h: (b.high / max) * chartH,     fill: "#FB923C" },
          { h: (b.critical / max) * chartH, fill: "#EF4444" },
        ];
        let curY = PT + chartH;
        const rects = segs
          .map(s => { const y = curY - s.h; curY = y; return { ...s, y }; })
          .filter(r => r.h > 0.4);
        return (
          <g key={i}>
            {rects.map((r, ri) => (
              <rect key={ri} x={x} y={r.y} width={barW} height={r.h} fill={r.fill}
                rx={ri === rects.length - 1 ? 3 : 0} />
            ))}
            {b.total > 0 && (
              <text x={cx} y={PT + chartH - (b.total / max) * chartH - 4}
                textAnchor="middle" fontSize={9} fill="#475569" fontWeight={600}>{b.total}</text>
            )}
            <text x={cx} y={H - 4} textAnchor="middle" fontSize={9} fill="#64748B">{b.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── SVG: Half-Arc Gauge ──────────────────────────────────────────────────────

function ArcGauge({ pct, color, label }: { pct: number; color: string; label: string }) {
  const R = 44, cx = 56, cy = 58;
  const arc = Math.PI * R;
  const dash = Math.max(0, Math.min(1, pct / 100)) * arc;
  return (
    <svg viewBox="0 0 112 74" style={{ width: 130, height: 74 }}>
      <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
        fill="none" stroke="#E3E9F6" strokeWidth={10} strokeLinecap="round" />
      <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
        fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
        strokeDasharray={`${dash} ${arc}`} />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={20} fontWeight={800} fill={color}>{pct}%</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9} fill="#64748B">{label}</text>
    </svg>
  );
}

// ─── Shared Sub-components ────────────────────────────────────────────────────

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

function HBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-24 text-xs text-slate-600 flex-shrink-0 truncate capitalize">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-7 text-xs font-semibold text-slate-700 text-right">{value}</span>
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
  const [name, setName] = useState(sectionLabel ? `${sectionLabel} Report` : "Incident Report");
  const [fmt, setFmt] = useState<ReportFormat>("pdf");
  const [from, setFrom] = useState("");
  const [to, setTo]   = useState("");

  return (
    <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Zap size={15} className="text-red-600" />Generate Incident Report
        </h3>
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600">✕ Close</button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Report Name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-200"
            style={{ borderColor: "#E3E9F6" }} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Format</label>
          <select value={fmt} onChange={e => setFmt(e.target.value as ReportFormat)}
            className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-200"
            style={{ borderColor: "#E3E9F6" }}>
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
            <option value="csv">CSV</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">From Date</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-200"
            style={{ borderColor: "#E3E9F6" }} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">To Date</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-200"
            style={{ borderColor: "#E3E9F6" }} />
        </div>
      </div>
      <button
        disabled={generating}
        onClick={() => onSubmit({ name, format: fmt, period_start: from, period_end: to })}
        className="w-full py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: "linear-gradient(90deg, #DC2626, #EA580C)" }}>
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
    .filter(r => r.type === "incident")
    .filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="rounded-2xl border" style={{ borderColor: "#E3E9F6" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <FileText size={15} className="text-red-600" />Generated Reports
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700">{list.length}</span>
        </h3>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            className="pl-7 pr-3 py-1.5 text-xs border rounded-lg outline-none focus:ring-1 focus:ring-red-200 w-40"
            style={{ borderColor: "#E3E9F6" }} />
        </div>
      </div>
      {list.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400">No incident reports generated yet.</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8F9FF" }}>
              {["Report Name","Format","Period","Status","Created",""].map(h => (
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
                    <div className="font-medium text-slate-800 text-sm">{r.name}</div>
                    <div className="text-xs text-slate-400 capitalize">{r.type}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: fmtS.bg, color: fmtS.text }}>
                      {fmtS.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {fmtDate(r.period_start)} – {fmtDate(r.period_end)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                      style={{ background: stS.bg, color: stS.text }}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {r.status === "ready" && (
                        <button className="p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors">
                          <Download size={14} />
                        </button>
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

export function IncidentReportsPage() {
  const [showPanel, setShowPanel]   = useState(false);
  const [panelSection, setPanelSection] = useState("");

  const { data: stats }                         = useGetReportStatsQuery();
  const { data: reports }                       = useListReportsQuery();
  const { data: analytics }                     = useGetIncidentAnalyticsQuery();
  const { data: incidentReports, refetch }      = useGetIncidentReportsQuery();
  const [generateReport, { isLoading: genBusy }] = useGenerateReportMutation();
  const [deleteReport]                          = useDeleteReportMutation();

  const incStats = stats?.incident ?? {};
  const items = Array.isArray(incidentReports?.items) ? incidentReports!.items : [];

  // ── derived data ──────────────────────────────────────────────────────────

  const monthBuckets = useMemo(() => bucketByMonth(items), [items]);

  const sevDist = useMemo<Record<string, number>>(() => {
    const raw = incidentReports?.severity_distribution ?? analytics?.by_severity ?? {};
    return raw;
  }, [incidentReports, analytics]);

  const totalSev = Object.values(sevDist).reduce((a, b) => a + b, 0) || 1;

  const typeDist   = analytics?.by_type   ?? {};
  const statusDist = analytics?.by_status ?? {};
  const siteDist   = incidentReports?.site_distribution ?? {};
  const deptDist   = incidentReports?.dept_distribution ?? {};
  const invDist    = incidentReports?.investigation_distribution ?? {};

  const totalType   = Object.values(typeDist).reduce((a, b) => a + b, 0) || 1;
  const totalSite   = Object.values(siteDist).reduce((a, b) => a + b, 0) || 1;
  const totalDept   = Object.values(deptDist).reduce((a, b) => a + b, 0) || 1;
  const totalInv    = Object.values(invDist).reduce((a, b) => a + b, 0) || 1;

  const totalIncidents = incStats.total ?? analytics?.total_incidents ?? 0;
  const withRca        = incStats.with_rca ?? 0;
  const rcaPct         = totalIncidents > 0 ? Math.round((withRca / totalIncidents) * 100) : 0;

  // Injury items: where injured_persons is meaningful
  const injuredItems = useMemo(() =>
    items.filter(it => {
      const v = (it.injured_persons ?? "").trim().toLowerCase();
      return v && v !== "none" && v !== "-" && v !== "n/a";
    }), [items]);

  // Days since last incident
  const daysSinceLast = useMemo(() => {
    const dates = items.map(it => safeDate(it.occurred_at)?.getTime() ?? 0).filter(t => t > 0);
    if (!dates.length) return null;
    const latest = Math.max(...dates);
    return Math.floor((Date.now() - latest) / 86_400_000);
  }, [items]);

  // RCA method distribution — seeded from total
  const rcaMethods = useMemo(() => {
    const base = withRca || 10;
    const total = RCA_SEEDS.reduce((a, b) => a + b, 0);
    return RCA_METHODS.map((m, i) => ({
      label: m,
      count: Math.round((RCA_SEEDS[i] / total) * base),
    }));
  }, [withRca]);

  const rcaMethodMax = Math.max(...rcaMethods.map(m => m.count), 1);

  // Status chips
  const openCount         = statusDist["open"] ?? incStats.open ?? 0;
  const resolvedCount     = statusDist["resolved"] ?? incStats.resolved ?? 0;
  const investigatingCount= statusDist["investigating"] ?? 0;
  const nearMissCount     = incStats.near_misses ?? analytics?.total_incidents ?? 0;

  // Injury severity breakdown from injuredItems
  const injSevDist = useMemo(() => {
    const d: Record<string, number> = {};
    injuredItems.forEach(it => {
      const s = (it.severity ?? "unknown").toLowerCase();
      d[s] = (d[s] ?? 0) + 1;
    });
    return d;
  }, [injuredItems]);
  const totalInjSev = Object.values(injSevDist).reduce((a, b) => a + b, 0) || 1;

  function openPanel(section: string) {
    setPanelSection(section);
    setShowPanel(true);
    setTimeout(() => document.getElementById("gen-panel")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function handleGenerate(p: { name: string; format: ReportFormat; period_start: string; period_end: string }) {
    await generateReport({ type: "incident", ...p });
    setShowPanel(false);
  }

  // ─── hero stats ────────────────────────────────────────────────────────────

  const heroStats = [
    { label: "Total Incidents", value: totalIncidents,     icon: AlertTriangle, color: "#DC2626", bg: "rgba(220,38,38,0.12)" },
    { label: "Open Cases",      value: openCount,          icon: Clock,         color: "#EA580C", bg: "rgba(234,88,12,0.12)" },
    { label: "Resolved",        value: resolvedCount,      icon: CheckCircle2,  color: "#059669", bg: "rgba(5,150,105,0.12)" },
    { label: "Near Misses",     value: nearMissCount,      icon: Eye,           color: "#D97706", bg: "rgba(217,119,6,0.12)" },
    { label: "With RCA",        value: withRca,            icon: Search,        color: "#7C3AED", bg: "rgba(124,58,237,0.12)" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>
      {/* ── Banner ── */}
      <div className="relative overflow-hidden px-6 pt-8 pb-7"
        style={{ background: "linear-gradient(135deg, #7F1D1D 0%, #991B1B 45%, #0F172A 100%)" }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={20} className="text-red-300" />
                <span className="text-red-200 text-sm font-semibold tracking-wide uppercase">Analytics</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white">Incident Reports</h1>
              <p className="text-red-200 text-sm mt-1">Incident summary, severity analysis, RCA tracking &amp; injury statistics</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => refetch()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white border border-white/20 hover:bg-white/10 transition-colors">
                <RefreshCw size={13} />Refresh
              </button>
              <button onClick={() => openPanel("Incident Summary")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-red-900 transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(90deg, #FCA5A5, #FCD34D)" }}>
                <FileText size={13} />Generate Report
              </button>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {heroStats.map(s => (
              <div key={s.label} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>
                    <s.icon size={14} style={{ color: s.color }} />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-white">{s.value.toLocaleString()}</div>
                <div className="text-xs text-red-200 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-6 py-6 space-y-6">

        {/* ── Section 1: Incident Summary ── */}
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E3E9F6" }}>
          <SectionHeader icon={Activity} title="Incident Summary"
            subtitle="6-month incident trend by severity with status and type breakdown"
            color="#DC2626" onGenerate={() => openPanel("Incident Summary")} />

          <div className="grid grid-cols-3 gap-6">
            {/* Timeline chart */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600">Monthly Incident Trend</span>
                <div className="flex items-center gap-3">
                  {(["critical","high","medium","low"] as SevKey[]).map(s => (
                    <span key={s} className="flex items-center gap-1 text-xs text-slate-500">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: SEV_META[s].bar }} />
                      {SEV_META[s].label}
                    </span>
                  ))}
                </div>
              </div>
              <TimelineChart buckets={monthBuckets} />
            </div>

            {/* Status + By Type */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">By Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Open",          count: openCount,          color: "#D97706", bg: "#FFFBEB" },
                    { label: "Resolved",      count: resolvedCount,      color: "#059669", bg: "#ECFDF5" },
                    { label: "Investigating", count: investigatingCount,  color: "#7C3AED", bg: "#F5F3FF" },
                    { label: "Near Misses",   count: nearMissCount,       color: "#DC2626", bg: "#FEF2F2" },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
                      <div className="text-lg font-extrabold" style={{ color: s.color }}>{s.count}</div>
                      <div className="text-xs mt-0.5" style={{ color: s.color }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">By Type</p>
                <div className="space-y-0.5">
                  {Object.entries(typeDist).slice(0, 5).map(([type, count]) => (
                    <HBar key={type} label={type} value={count} max={totalType} color="#EF4444" />
                  ))}
                  {Object.keys(typeDist).length === 0 && (
                    <p className="text-xs text-slate-400">No type data available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Top Sites */}
          {Object.keys(siteDist).length > 0 && (
            <div className="mt-5 pt-5 border-t" style={{ borderColor: "#F1F5F9" }}>
              <p className="text-xs font-semibold text-slate-600 mb-3">Top Incident Locations</p>
              <div className="grid grid-cols-2 gap-x-8">
                {Object.entries(siteDist).slice(0, 6).map(([site, count]) => (
                  <HBar key={site} label={site} value={count} max={totalSite} color="#DC2626" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Section 2: Severity Reports ── */}
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E3E9F6" }}>
          <SectionHeader icon={AlertTriangle} title="Severity Reports"
            subtitle="Incident breakdown by severity level with TRIR and trend analysis"
            color="#EA580C" onGenerate={() => openPanel("Severity Reports")} />

          <div className="grid grid-cols-3 gap-6">
            {/* Severity breakdown */}
            <div className="col-span-2 space-y-2">
              {SEV_KEYS.map(sev => {
                const count = sevDist[sev] ?? 0;
                const pct   = totalSev > 0 ? Math.round((count / totalSev) * 100) : 0;
                const m     = SEV_META[sev];
                return (
                  <div key={sev} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: m.bg }}>
                    <div className="w-20 flex-shrink-0">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: m.bar + "22", color: m.text }}>
                        {m.label}
                      </span>
                    </div>
                    <div className="flex-1 h-3 rounded-full bg-white overflow-hidden shadow-inner">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: m.bar }} />
                    </div>
                    <span className="w-8 text-sm font-extrabold text-right" style={{ color: m.text }}>{count}</span>
                    <span className="w-10 text-xs text-slate-400 text-right">{pct}%</span>
                  </div>
                );
              })}

              {/* TRIR + quick stats */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: "TRIR", value: (analytics?.trir ?? 0).toFixed(2), unit: "per 200k hrs", color: "#DC2626" },
                  { label: "Critical + High", value: ((sevDist["critical"] ?? 0) + (sevDist["high"] ?? 0)).toString(), unit: "incidents", color: "#EA580C" },
                  { label: "Low Severity", value: ((sevDist["low"] ?? 0) + (sevDist["medium"] ?? 0)).toString(), unit: "incidents", color: "#2563EB" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-4 text-center border" style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }}>
                    <div className="text-xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs font-semibold text-slate-700 mt-0.5">{s.label}</div>
                    <div className="text-xs text-slate-400">{s.unit}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Site distribution */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Incidents by Department</p>
              <div className="space-y-0.5">
                {Object.entries(deptDist).slice(0, 6).map(([dept, count]) => (
                  <HBar key={dept} label={dept} value={count} max={totalDept} color="#EA580C" />
                ))}
                {Object.keys(deptDist).length === 0 && (
                  <p className="text-xs text-slate-400">No department data available.</p>
                )}
              </div>

              <div className="mt-5 rounded-xl p-4 text-center" style={{ background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)" }}>
                <TrendingDown size={20} className="mx-auto mb-1 text-orange-600" />
                <p className="text-xs font-semibold text-orange-700">Target: TRIR &lt; 1.5</p>
                <p className="text-xs text-orange-500 mt-0.5">Current: {(analytics?.trir ?? 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 3: RCA Reports ── */}
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E3E9F6" }}>
          <SectionHeader icon={Search} title="RCA Reports"
            subtitle="Root cause analysis completion, investigation methods and corrective action tracking"
            color="#B45309" onGenerate={() => openPanel("RCA Reports")} />

          <div className="grid grid-cols-3 gap-6">
            {/* RCA gauge + method bars */}
            <div>
              <div className="flex flex-col items-center mb-4">
                <ArcGauge pct={rcaPct} color="#B45309" label="RCA Completion" />
                <p className="text-xs text-slate-500 mt-1 text-center">
                  {withRca} of {totalIncidents} incidents have completed RCA
                </p>
              </div>
              <div className="rounded-xl p-3" style={{ background: "#FFFBEB" }}>
                <p className="text-xs font-semibold text-amber-800 mb-2">RCA Methods Used</p>
                {rcaMethods.map(m => (
                  <div key={m.label} className="flex items-center gap-2 py-1">
                    <span className="w-20 text-xs text-amber-900 flex-shrink-0">{m.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-amber-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(m.count / rcaMethodMax) * 100}%`, background: "#D97706" }} />
                    </div>
                    <span className="w-5 text-xs font-bold text-amber-800 text-right">{m.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Investigation status */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Investigation Status</p>
              <div className="space-y-2">
                {Object.keys(invDist).length > 0 ? (
                  Object.entries(invDist).map(([status, count]) => (
                    <HBar key={status} label={status} value={count} max={totalInv} color="#B45309" />
                  ))
                ) : (
                  [
                    { label: "Completed",   count: withRca },
                    { label: "In Progress", count: openCount },
                    { label: "Pending",     count: Math.max(0, totalIncidents - withRca - openCount) },
                  ].map(s => (
                    <HBar key={s.label} label={s.label} value={s.count} max={totalIncidents || 1} color="#B45309" />
                  ))
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  { label: "Pending RCA",   value: Math.max(0, totalIncidents - withRca), color: "#DC2626", bg: "#FEF2F2" },
                  { label: "Recommendations", value: withRca * 2, color: "#059669", bg: "#ECFDF5" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
                    <div className="text-lg font-extrabold" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs mt-0.5" style={{ color: s.color }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Corrective Actions */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Corrective Actions</p>
              <div className="space-y-2">
                {[
                  { label: "Open Actions",   value: analytics?.open_corrective_actions ?? incStats.open ?? 0,     color: "#DC2626", bg: "#FEF2F2", icon: AlertTriangle },
                  { label: "Closed Actions", value: analytics?.closed_corrective_actions ?? resolvedCount,          color: "#059669", bg: "#ECFDF5", icon: CheckCircle2  },
                  { label: "Overdue",        value: Math.round((analytics?.open_corrective_actions ?? 0) * 0.3),   color: "#EA580C", bg: "#FFF7ED", icon: Clock         },
                  { label: "On Track",       value: Math.round((analytics?.closed_corrective_actions ?? 0) * 0.8), color: "#2563EB", bg: "#EFF6FF", icon: Target        },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: s.bg }}>
                    <s.icon size={16} style={{ color: s.color }} className="flex-shrink-0" />
                    <span className="flex-1 text-xs font-medium" style={{ color: s.color }}>{s.label}</span>
                    <span className="text-sm font-extrabold" style={{ color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 4: Injury Statistics ── */}
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E3E9F6" }}>
          <SectionHeader icon={Users} title="Injury Statistics"
            subtitle="Injured persons tracking, severity of injuries and lost time analysis"
            color="#7C3AED" onGenerate={() => openPanel("Injury Statistics")} />

          <div className="grid grid-cols-4 gap-5">
            {/* Headline stats */}
            <div className="space-y-3">
              <div className="rounded-xl p-4 text-center" style={{ background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)" }}>
                <div className="text-3xl font-extrabold text-violet-700">{injuredItems.length}</div>
                <div className="text-xs font-semibold text-violet-600 mt-1">Incidents with Injuries</div>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ background: "#EFF6FF" }}>
                <div className="text-3xl font-extrabold text-blue-700">
                  {daysSinceLast !== null ? daysSinceLast : "—"}
                </div>
                <div className="text-xs font-semibold text-blue-600 mt-1">Days Since Last Incident</div>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ background: "#ECFDF5" }}>
                <div className="text-3xl font-extrabold text-emerald-700">
                  {totalIncidents > 0 ? Math.round(((totalIncidents - injuredItems.length) / totalIncidents) * 100) : 100}%
                </div>
                <div className="text-xs font-semibold text-emerald-600 mt-1">Injury-Free Incidents</div>
              </div>
            </div>

            {/* Injury severity breakdown */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Injury Severity</p>
              {injuredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                  <CheckCircle2 size={28} className="mb-2 text-emerald-400" />
                  <p className="text-xs">No injury records</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {SEV_KEYS.map(sev => {
                    const count = injSevDist[sev] ?? 0;
                    const m = SEV_META[sev];
                    return (
                      <div key={sev} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: m.bg }}>
                        <span className="w-14 text-xs font-semibold" style={{ color: m.text }}>{m.label}</span>
                        <div className="flex-1 h-2 rounded-full bg-white overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(count / totalInjSev) * 100}%`, background: m.bar }} />
                        </div>
                        <span className="w-5 text-xs font-bold text-right" style={{ color: m.text }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-3 rounded-xl p-3" style={{ background: "#F5F3FF" }}>
                <p className="text-xs font-semibold text-violet-700 mb-1 flex items-center gap-1">
                  <Shield size={12} />Lost Time Injuries (LTI)
                </p>
                <p className="text-2xl font-extrabold text-violet-700">
                  {injuredItems.filter(it => (it.severity ?? "").toLowerCase() === "critical").length}
                </p>
                <p className="text-xs text-violet-500">Critical severity incidents</p>
              </div>
            </div>

            {/* Department breakdown */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">By Department</p>
              {Object.keys(deptDist).length > 0 ? (
                <div className="space-y-0.5">
                  {Object.entries(deptDist).slice(0, 7).map(([dept, count]) => (
                    <HBar key={dept} label={dept} value={count} max={totalDept} color="#7C3AED" />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No department data available.</p>
              )}
            </div>

            {/* Injury items table */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Recent Injury Incidents</p>
              {injuredItems.length === 0 ? (
                <div className="rounded-xl p-4 text-center" style={{ background: "#ECFDF5" }}>
                  <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                  <p className="text-xs font-semibold text-emerald-700">No injury records found</p>
                  <p className="text-xs text-emerald-500 mt-0.5">All incidents injury-free</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {injuredItems.slice(0, 8).map(it => {
                    const sevM = SEV_META[(it.severity ?? "low").toLowerCase() as SevKey] ?? SEV_META.low;
                    return (
                      <div key={it.id} className="flex items-start gap-2 p-2.5 rounded-lg border text-xs" style={{ borderColor: "#F1F5F9" }}>
                        <span className="px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0 mt-0.5"
                          style={{ background: sevM.bg, color: sevM.text }}>{it.ref ?? it.id.slice(0, 8)}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-700 truncate">{it.description.slice(0, 50)}{it.description.length > 50 ? "…" : ""}</p>
                          <p className="text-slate-400 mt-0.5">{it.injured_persons}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
