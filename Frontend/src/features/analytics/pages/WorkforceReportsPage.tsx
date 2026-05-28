"use client";
import React, { useState, useMemo } from "react";
import {
  Users, FileText, Download, RefreshCw, Trash2,
  CheckCircle2, AlertTriangle, Clock, UserCheck,
  Zap, Search, Calendar, GraduationCap,
  BarChart3, Award, ClipboardList, TrendingUp,
  TrendingDown, Shield, BookOpen, Briefcase,
} from "lucide-react";
import {
  useGetReportStatsQuery,
  useListReportsQuery,
  useGenerateReportMutation,
  useDeleteReportMutation,
  type ReportFormat,
} from "@/features/analytics/api/reportsApi";
import {
  useListEmployeesQuery,
  type Employee,
} from "@/features/employees/api/employeesApi";
import {
  useListShiftsQuery,
  type Shift,
} from "@/features/shift-management/api/shiftApi";
import {
  useListTrainingGapsQuery,
  type TrainingGap,
} from "@/features/training/api/trainingApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d?: string | null) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "—"
      : dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return "—"; }
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── Style maps ───────────────────────────────────────────────────────────────

const PRIORITY_META: Record<string, { label: string; color: string; bg: string; bar: string }> = {
  high:   { label: "High",   color: "#DC2626", bg: "#FEF2F2", bar: "#EF4444" },
  medium: { label: "Medium", color: "#D97706", bg: "#FFFBEB", bar: "#FBBF24" },
  low:    { label: "Low",    color: "#059669", bg: "#ECFDF5", bar: "#34D399" },
};

const SHIFT_TYPE_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  Morning:   { label: "Morning",   color: "#D97706", bg: "#FFFBEB", icon: TrendingUp   },
  Afternoon: { label: "Afternoon", color: "#2563EB", bg: "#EFF6FF", icon: BarChart3    },
  Night:     { label: "Night",     color: "#7C3AED", bg: "#F5F3FF", icon: TrendingDown },
};

const SHIFT_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: "Active",    color: "#059669", bg: "#ECFDF5" },
  scheduled: { label: "Scheduled", color: "#2563EB", bg: "#EFF6FF" },
  completed: { label: "Completed", color: "#6B7280", bg: "#F3F4F6" },
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
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize={9} fill="#64748B">{label}</text>
      {sub && <text x={cx} y={cy + 20} textAnchor="middle" fontSize={8} fill="#94A3B8">{sub}</text>}
    </svg>
  );
}

// ─── SVG: Radial Gauge ────────────────────────────────────────────────────────

function RadialGauge({ pct, color, label }: { pct: number; color: string; label: string }) {
  const r = 40, cx = 48, cy = 48;
  const circ = 2 * Math.PI * r;
  const arc  = Math.min(pct / 100, 1) * circ;
  return (
    <svg width={96} height={96} viewBox="0 0 96 96">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth={10} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${arc} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cx - 3} textAnchor="middle" fontSize={15} fontWeight={900} fill={color}>{pct}%</text>
      <text x={cx} y={cx + 13} textAnchor="middle" fontSize={8} fill="#6B7280">{label}</text>
    </svg>
  );
}

// ─── SVG: Mini Bar Chart ──────────────────────────────────────────────────────

function MiniBarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const W = 260, H = 60, PB = 18;
  const barW = Math.floor((W / data.length) - 4);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {data.map((d, i) => {
        const bH = Math.max(2, ((d.value / max) * (H - PB)));
        const x  = i * (W / data.length) + 2;
        const y  = H - PB - bH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bH} rx={2} fill={color} opacity={0.85} />
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize={8} fill="#475569" fontWeight={600}>{d.value}</text>
            )}
            <text x={x + barW / 2} y={H - 3} textAnchor="middle" fontSize={7} fill="#94A3B8">{d.label}</text>
          </g>
        );
      })}
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
  const [name, setName] = useState(sectionLabel ? `${sectionLabel} Report` : "Workforce Report");
  const [fmt, setFmt]   = useState<ReportFormat>("pdf");
  const [from, setFrom] = useState("");
  const [to, setTo]     = useState("");

  return (
    <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Zap size={15} className="text-indigo-500" />Generate Workforce Report
        </h3>
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600">✕ Close</button>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Report Name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
            style={{ borderColor: "#E3E9F6" }} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Format</label>
          <select value={fmt} onChange={e => setFmt(e.target.value as ReportFormat)}
            className="w-full text-sm border rounded-lg px-3 py-2 outline-none bg-white focus:ring-2 focus:ring-indigo-200"
            style={{ borderColor: "#E3E9F6" }}>
            <option value="pdf">PDF</option>
            <option value="excel">Excel (.xlsx)</option>
            <option value="csv">CSV</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">From Date</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
            style={{ borderColor: "#E3E9F6" }} />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="col-span-3" />
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">To Date</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
            style={{ borderColor: "#E3E9F6" }} />
        </div>
      </div>
      <button
        disabled={generating}
        onClick={() => onSubmit({ name, format: fmt, period_start: from, period_end: to })}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: "linear-gradient(90deg, #4F46E5, #2563EB)" }}>
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
    .filter(r => r.type === "workforce")
    .filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="rounded-2xl border" style={{ borderColor: "#E3E9F6" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <FileText size={15} className="text-indigo-500" />Generated Reports
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">{list.length}</span>
        </h3>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            className="pl-7 pr-3 py-1.5 text-xs border rounded-lg outline-none focus:ring-1 focus:ring-indigo-200 w-44"
            style={{ borderColor: "#E3E9F6" }} />
        </div>
      </div>
      {list.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="w-8 h-8 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
          <p className="text-sm text-slate-400">No workforce reports generated yet.</p>
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
                        <button className="p-1 rounded hover:bg-slate-100 text-slate-500"><Download size={14} /></button>
                      )}
                      <button onClick={() => onDelete(r.id)}
                        className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500">
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

export function WorkforceReportsPage() {
  const [showPanel, setShowPanel]       = useState(false);
  const [panelSection, setPanelSection] = useState("");

  const { data: stats }                              = useGetReportStatsQuery();
  const { data: reports }                            = useListReportsQuery();
  const { data: rawEmployees, refetch: refetchEmp }  = useListEmployeesQuery();
  const { data: rawShifts,    refetch: refetchShift }= useListShiftsQuery();
  const { data: rawGaps,      refetch: refetchGaps } = useListTrainingGapsQuery();
  const [generateReport, { isLoading: genBusy }]     = useGenerateReportMutation();
  const [deleteReport]                               = useDeleteReportMutation();

  const employees: Employee[]    = Array.isArray(rawEmployees) ? rawEmployees : [];
  const shifts:    Shift[]       = Array.isArray(rawShifts)    ? rawShifts    : [];
  const gaps:      TrainingGap[] = Array.isArray(rawGaps)      ? rawGaps      : [];

  function refetchAll() { refetchEmp(); refetchShift(); refetchGaps(); }

  // ── Workforce stats ────────────────────────────────────────────────────────

  const wfStats = stats?.workforce ?? { total_employees: 0, active_workers: 0, incident_rate: 0, near_misses_reported: 0 };

  // ── Attendance derived ─────────────────────────────────────────────────────

  const totalEmp   = wfStats.total_employees || employees.length;
  const activeEmp  = wfStats.active_workers  || employees.filter(e => e.status === "active").length;
  const inactiveEmp= totalEmp - activeEmp;
  const activeRate = totalEmp > 0 ? Math.round((activeEmp / totalEmp) * 100) : 0;

  const empByDept = useMemo(() => {
    const d: Record<string, number> = {};
    employees.forEach(e => { const dept = e.department || "Unassigned"; d[dept] = (d[dept] ?? 0) + 1; });
    return Object.entries(d).sort((a, b) => b[1] - a[1]).slice(0, 7);
  }, [employees]);
  const deptMax = empByDept.length > 0 ? empByDept[0][1] : 1;

  const empByRole = useMemo(() => {
    const d: Record<string, number> = {};
    employees.forEach(e => { const r = e.role || "Staff"; d[r] = (d[r] ?? 0) + 1; });
    return Object.entries(d).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [employees]);
  const roleMax = empByRole.length > 0 ? empByRole[0][1] : 1;

  // Monthly join trend (last 6 months)
  const joinTrend = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { label: MONTH_LABELS[d.getMonth()], month: d.getMonth(), year: d.getFullYear(), value: 0 };
    });
    employees.forEach(e => {
      if (!e.joined_at) return;
      const dt = new Date(e.joined_at);
      const idx = buckets.findIndex(b => b.month === dt.getMonth() && b.year === dt.getFullYear());
      if (idx >= 0) buckets[idx].value++;
    });
    return buckets;
  }, [employees]);

  const recentJoiners = useMemo(() =>
    [...employees]
      .filter(e => e.joined_at)
      .sort((a, b) => new Date(b.joined_at!).getTime() - new Date(a.joined_at!).getTime())
      .slice(0, 6),
  [employees]);

  // ── Shift derived ──────────────────────────────────────────────────────────

  const shiftByType = useMemo(() => {
    const d: Record<string, { count: number; workers: number }> = {};
    shifts.forEach(s => {
      const t = s.type || "Morning";
      if (!d[t]) d[t] = { count: 0, workers: 0 };
      d[t].count++;
      d[t].workers += s.workers ?? 0;
    });
    return d;
  }, [shifts]);

  const shiftByStatus = useMemo(() => {
    const d: Record<string, number> = {};
    shifts.forEach(s => { d[s.status] = (d[s.status] ?? 0) + 1; });
    return d;
  }, [shifts]);

  const totalShiftWorkers = shifts.reduce((acc, s) => acc + (s.workers ?? 0), 0);
  const activeShifts      = shifts.filter(s => s.status === "active");
  const uniqueSupervisors = new Set(shifts.map(s => s.supervisor).filter(Boolean)).size;

  // ── Training derived ───────────────────────────────────────────────────────

  const gapsByPriority = useMemo(() => {
    const d: Record<string, number> = {};
    gaps.forEach(g => { d[g.priority] = (d[g.priority] ?? 0) + 1; });
    return d;
  }, [gaps]);

  const gapsByRole = useMemo(() => {
    const d: Record<string, number> = {};
    gaps.forEach(g => { const r = g.role || "Staff"; d[r] = (d[r] ?? 0) + 1; });
    return Object.entries(d).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [gaps]);
  const gapRoleMax = gapsByRole.length > 0 ? gapsByRole[0][1] : 1;

  const coursesNeeded = useMemo(() => {
    const d: Record<string, number> = {};
    gaps.forEach(g => g.missing_courses.forEach(c => { d[c] = (d[c] ?? 0) + 1; }));
    return Object.entries(d).sort((a, b) => b[1] - a[1]).slice(0, 7);
  }, [gaps]);
  const courseMax = coursesNeeded.length > 0 ? coursesNeeded[0][1] : 1;

  const highPriorityGaps = gapsByPriority["high"]   ?? 0;
  const medPriorityGaps  = gapsByPriority["medium"] ?? 0;
  const lowPriorityGaps  = gapsByPriority["low"]    ?? 0;
  const totalGaps        = gaps.length;
  const trainingRate     = totalEmp > 0 ? Math.round(((totalEmp - totalGaps) / totalEmp) * 100) : 100;

  // ── Competency derived ─────────────────────────────────────────────────────

  const topGapEmployees = useMemo(() =>
    [...gaps]
      .sort((a, b) => b.missing_courses.length - a.missing_courses.length)
      .slice(0, 8),
  [gaps]);

  const totalMissingCourses = gaps.reduce((acc, g) => acc + g.missing_courses.length, 0);
  const avgGapPerEmployee   = totalGaps > 0 ? (totalMissingCourses / totalGaps).toFixed(1) : "0";
  const fullyCompetent      = totalEmp - totalGaps;
  const competencyRate      = totalEmp > 0 ? Math.round((fullyCompetent / totalEmp) * 100) : 100;

  // ── Hero stats ─────────────────────────────────────────────────────────────

  const heroStats = [
    { label: "Total Employees",   value: totalEmp,                       icon: Users,        color: "#4F46E5", bg: "rgba(79,70,229,0.12)" },
    { label: "Active Workers",    value: activeEmp,                      icon: UserCheck,    color: "#059669", bg: "rgba(5,150,105,0.12)" },
    { label: "Workforce TRIR",    value: wfStats.incident_rate.toFixed(2), icon: Shield,     color: "#DC2626", bg: "rgba(220,38,38,0.12)" },
    { label: "Training Gaps",     value: totalGaps,                      icon: BookOpen,     color: "#D97706", bg: "rgba(217,119,6,0.12)" },
    { label: "Active Shifts",     value: activeShifts.length,            icon: Briefcase,    color: "#0891B2", bg: "rgba(8,145,178,0.12)" },
  ];

  function openPanel(section: string) {
    setPanelSection(section);
    setShowPanel(true);
    setTimeout(() => document.getElementById("gen-panel")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function handleGenerate(p: { name: string; format: ReportFormat; period_start: string; period_end: string }) {
    await generateReport({ type: "workforce", ...p });
    setShowPanel(false);
  }

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>

      {/* ── Banner ── */}
      <div className="relative overflow-hidden px-6 pt-8 pb-7"
        style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #3730A3 50%, #0F172A 100%)" }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users size={20} className="text-indigo-300" />
                <span className="text-indigo-200 text-sm font-semibold tracking-wide uppercase">Analytics</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white">Workforce Reports</h1>
              <p className="text-indigo-200 text-sm mt-1">
                Attendance, shifts, training &amp; competency — complete workforce view
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={refetchAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white border border-white/20 hover:bg-white/10 transition-colors">
                <RefreshCw size={13} />Refresh
              </button>
              <button onClick={() => openPanel("Workforce Summary")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-indigo-900 transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(90deg, #A5B4FC, #818CF8)" }}>
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
                <div className="text-xs text-indigo-200 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-6 py-6 space-y-6">

        {/* ── Section 1: Attendance Reports ── */}
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E3E9F6" }}>
          <SectionHeader icon={UserCheck} title="Attendance Reports"
            subtitle="Employee headcount, active rate, department breakdown and join trends"
            color="#4F46E5" onGenerate={() => openPanel("Attendance")} />

          <div className="grid grid-cols-3 gap-6">

            {/* Gauge + active/inactive chips */}
            <div className="flex flex-col items-center">
              <ArcGauge pct={activeRate} color="#4F46E5" label="Active Rate"
                sub={`${activeEmp} of ${totalEmp} employees`} />

              <div className="w-full grid grid-cols-2 gap-2 mt-4">
                {[
                  { label: "Active",   value: activeEmp,   color: "#059669", bg: "#ECFDF5" },
                  { label: "Inactive", value: inactiveEmp, color: "#6B7280", bg: "#F3F4F6" },
                  { label: "Total",    value: totalEmp,    color: "#4F46E5", bg: "#EEF2FF" },
                  { label: "TRIR",     value: wfStats.incident_rate.toFixed(2), color: "#DC2626", bg: "#FEF2F2" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
                    <div className="text-xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs mt-0.5 leading-tight" style={{ color: s.color }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Join trend mini chart */}
              <div className="w-full mt-4 rounded-xl p-3" style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
                <p className="text-xs font-semibold text-indigo-700 mb-2">New Joiners (6 months)</p>
                <MiniBarChart data={joinTrend} color="#4F46E5" />
              </div>
            </div>

            {/* Department breakdown */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Employees by Department</p>
              {empByDept.length > 0 ? (
                <div className="space-y-0.5 mb-5">
                  {empByDept.map(([dept, count]) => (
                    <HBar key={dept} label={dept} value={count} max={deptMax} color="#4F46E5" />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 mb-5">No department data available.</p>
              )}

              <p className="text-xs font-semibold text-slate-600 mb-3">Employees by Role</p>
              {empByRole.length > 0 ? (
                <div className="space-y-0.5">
                  {empByRole.map(([role, count]) => (
                    <HBar key={role} label={role} value={count} max={roleMax} color="#6366F1" />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No role data available.</p>
              )}
            </div>

            {/* Recent joiners */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Recent Joiners</p>
              {recentJoiners.length === 0 ? (
                <div className="rounded-xl p-6 text-center" style={{ background: "#EEF2FF" }}>
                  <Users size={24} className="mx-auto mb-2 text-indigo-400" />
                  <p className="text-xs font-semibold text-indigo-600">No employee data yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentJoiners.map(e => (
                    <div key={e.id} className="p-3 rounded-xl border text-xs" style={{ borderColor: "#E3E9F6" }}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
                            {e.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-700 truncate">{e.name}</span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${e.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                          {e.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 pl-8">
                        {e.department && <span>{e.department}</span>}
                        {e.role && <><span>·</span><span>{e.role}</span></>}
                        <span className="ml-auto">{fmtDate(e.joined_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Near misses stat */}
              <div className="mt-4 rounded-xl p-4" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
                <p className="text-xs font-semibold text-orange-700 mb-1">Near Misses Reported</p>
                <p className="text-2xl font-extrabold text-orange-700">{wfStats.near_misses_reported}</p>
                <p className="text-xs text-orange-500">By workforce this period</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2: Shift Reports ── */}
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E3E9F6" }}>
          <SectionHeader icon={Clock} title="Shift Reports"
            subtitle="Shift coverage, worker distribution across Morning / Afternoon / Night rotations"
            color="#0891B2" onGenerate={() => openPanel("Shift")} />

          <div className="grid grid-cols-3 gap-6">

            {/* Shift type tiles */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Shifts by Type</p>
              <div className="space-y-3">
                {(["Morning", "Afternoon", "Night"] as const).map(type => {
                  const m    = SHIFT_TYPE_META[type];
                  const info = shiftByType[type] ?? { count: 0, workers: 0 };
                  const Icon = m.icon;
                  return (
                    <div key={type} className="flex items-center gap-3 p-4 rounded-xl" style={{ background: m.bg, border: `1px solid ${m.color}20` }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: m.color + "20" }}>
                        <Icon size={18} style={{ color: m.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold" style={{ color: m.color }}>{type} Shift</div>
                        <div className="text-xs mt-0.5" style={{ color: m.color + "BB" }}>
                          {info.count} shift{info.count !== 1 ? "s" : ""} · {info.workers} workers
                        </div>
                      </div>
                      <div className="text-2xl font-extrabold" style={{ color: m.color }}>{info.count}</div>
                    </div>
                  );
                })}
              </div>

              {/* Status summary */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {(["active", "scheduled", "completed"] as const).map(status => {
                  const m = SHIFT_STATUS_META[status];
                  return (
                    <div key={status} className="rounded-xl p-3 text-center" style={{ background: m.bg }}>
                      <div className="text-lg font-extrabold" style={{ color: m.color }}>{shiftByStatus[status] ?? 0}</div>
                      <div className="text-xs mt-0.5 leading-tight" style={{ color: m.color }}>{m.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary stats */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Shift Overview</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Total Shifts",        value: shifts.length,       color: "#0891B2", bg: "#F0F9FF" },
                  { label: "Total Workers",        value: totalShiftWorkers,   color: "#4F46E5", bg: "#EEF2FF" },
                  { label: "Active Right Now",     value: activeShifts.length, color: "#059669", bg: "#ECFDF5" },
                  { label: "Supervisors",          value: uniqueSupervisors,   color: "#D97706", bg: "#FFFBEB" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: s.bg }}>
                    <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs mt-0.5 font-semibold" style={{ color: s.color }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Workers per shift type bar chart */}
              <div className="rounded-xl p-4" style={{ background: "#F0F9FF", border: "1px solid #BAE6FD" }}>
                <p className="text-xs font-semibold text-sky-700 mb-3">Workers per Shift Type</p>
                <div className="space-y-2">
                  {(["Morning", "Afternoon", "Night"] as const).map(type => {
                    const m       = SHIFT_TYPE_META[type];
                    const workers = shiftByType[type]?.workers ?? 0;
                    const pct     = totalShiftWorkers > 0 ? Math.round((workers / totalShiftWorkers) * 100) : 0;
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-semibold" style={{ color: m.color }}>{type}</span>
                          <span className="text-xs font-bold" style={{ color: m.color }}>{workers} workers ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E0F2FE" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: m.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Active shifts list */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">
                Active Shifts
                {activeShifts.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">{activeShifts.length}</span>
                )}
              </p>
              {shifts.length === 0 ? (
                <div className="rounded-xl p-6 text-center" style={{ background: "#F0F9FF" }}>
                  <Clock size={24} className="mx-auto mb-2 text-sky-400" />
                  <p className="text-xs font-semibold text-sky-600">No shifts recorded yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {shifts.map(s => {
                    const m  = SHIFT_TYPE_META[s.type] ?? SHIFT_TYPE_META.Morning;
                    const sm = SHIFT_STATUS_META[s.status] ?? SHIFT_STATUS_META.scheduled;
                    return (
                      <div key={s.id} className="p-3 rounded-xl border text-xs" style={{ borderColor: "#E3E9F6" }}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-semibold text-slate-700">{s.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0"
                            style={{ background: m.bg, color: m.color }}>{s.type}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>{s.startTime} – {s.endTime} · {s.workers} workers</span>
                          <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: sm.bg, color: sm.color }}>{sm.label}</span>
                        </div>
                        {s.supervisor && (
                          <div className="mt-1 text-slate-400">Supervisor: {s.supervisor}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 3: Training Reports ── */}
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E3E9F6" }}>
          <SectionHeader icon={GraduationCap} title="Training Reports"
            subtitle="Training gap analysis, priority breakdown and most-needed courses"
            color="#D97706" onGenerate={() => openPanel("Training")} />

          <div className="grid grid-cols-3 gap-6">

            {/* Training rate gauge + priority chips */}
            <div className="flex flex-col items-center">
              <ArcGauge pct={trainingRate} color="#D97706" label="Training Completion"
                sub={`${totalEmp - totalGaps} of ${totalEmp} trained`} />

              <div className="w-full mt-4 space-y-2">
                {(["high", "medium", "low"] as const).map(p => {
                  const count = gapsByPriority[p] ?? 0;
                  const m     = PRIORITY_META[p];
                  const pct   = totalGaps > 0 ? Math.round((count / totalGaps) * 100) : 0;
                  return (
                    <div key={p} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: m.bg }}>
                      <span className="w-16 text-xs font-bold flex-shrink-0" style={{ color: m.color }}>{m.label}</span>
                      <div className="flex-1 h-2.5 rounded-full bg-white overflow-hidden shadow-inner">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: m.bar }} />
                      </div>
                      <span className="w-6 text-sm font-extrabold text-right" style={{ color: m.color }}>{count}</span>
                    </div>
                  );
                })}
              </div>

              <div className="w-full mt-4 grid grid-cols-2 gap-2">
                {[
                  { label: "Total Gaps",      value: totalGaps,          color: "#D97706", bg: "#FFFBEB" },
                  { label: "High Priority",   value: highPriorityGaps,   color: "#DC2626", bg: "#FEF2F2" },
                  { label: "Courses Missing", value: totalMissingCourses, color: "#7C3AED", bg: "#F5F3FF" },
                  { label: "Avg / Employee",  value: avgGapPerEmployee,  color: "#0891B2", bg: "#F0F9FF" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
                    <div className="text-lg font-extrabold" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[10px] mt-0.5 leading-tight" style={{ color: s.color }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gaps by role + most-needed courses */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Training Gaps by Role</p>
              {gapsByRole.length > 0 ? (
                <div className="space-y-0.5 mb-5">
                  {gapsByRole.map(([role, count]) => (
                    <HBar key={role} label={role} value={count} max={gapRoleMax} color="#D97706" />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl p-4 text-center mb-5" style={{ background: "#ECFDF5" }}>
                  <CheckCircle2 size={20} className="mx-auto mb-1 text-emerald-500" />
                  <p className="text-xs font-semibold text-emerald-700">No training gaps found</p>
                </div>
              )}

              <p className="text-xs font-semibold text-slate-600 mb-3">Most Needed Courses</p>
              {coursesNeeded.length > 0 ? (
                <div className="space-y-0.5">
                  {coursesNeeded.map(([course, count]) => (
                    <HBar key={course} label={course} value={count} max={courseMax} color="#F59E0B" />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No course gap data available.</p>
              )}
            </div>

            {/* Employees with gaps */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">
                Employees Needing Training
                {totalGaps > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">{totalGaps}</span>
                )}
              </p>
              {gaps.length === 0 ? (
                <div className="rounded-xl p-6 text-center" style={{ background: "#ECFDF5" }}>
                  <Award size={24} className="mx-auto mb-2 text-emerald-500" />
                  <p className="text-xs font-semibold text-emerald-700">All employees fully trained</p>
                  <p className="text-xs text-emerald-500 mt-0.5">No training gaps detected</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {gaps.slice(0, 8).map(g => {
                    const m = PRIORITY_META[g.priority] ?? PRIORITY_META.low;
                    return (
                      <div key={g.employee_id} className="p-3 rounded-xl border text-xs" style={{ borderColor: "#E3E9F6" }}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-semibold text-slate-700">{g.employee_name}</span>
                          <span className="px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0"
                            style={{ background: m.bg, color: m.color }}>{m.label}</span>
                        </div>
                        <div className="text-slate-500 mb-1 capitalize">{g.role}</div>
                        <div className="flex flex-wrap gap-1">
                          {g.missing_courses.slice(0, 3).map(c => (
                            <span key={c} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700">{c}</span>
                          ))}
                          {g.missing_courses.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                              +{g.missing_courses.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 4: Competency Reports ── */}
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E3E9F6" }}>
          <SectionHeader icon={Award} title="Competency Reports"
            subtitle="Role-based competency coverage, gap depth analysis and employees requiring upskilling"
            color="#7C3AED" onGenerate={() => openPanel("Competency")} />

          <div className="grid grid-cols-3 gap-6">

            {/* Competency gauge + summary */}
            <div className="flex flex-col items-center">
              <RadialGauge pct={competencyRate} color="#7C3AED" label="Competent" />
              <p className="text-xs text-slate-500 mt-2 text-center">
                {fullyCompetent} of {totalEmp} employees fully competent
              </p>

              <div className="w-full grid grid-cols-2 gap-2 mt-4">
                {[
                  { label: "Fully Competent",    value: fullyCompetent,       color: "#059669", bg: "#ECFDF5" },
                  { label: "Have Gaps",           value: totalGaps,            color: "#DC2626", bg: "#FEF2F2" },
                  { label: "High Priority",       value: highPriorityGaps,     color: "#DC2626", bg: "#FEF2F2" },
                  { label: "Medium Priority",     value: medPriorityGaps,      color: "#D97706", bg: "#FFFBEB" },
                  { label: "Low Priority",        value: lowPriorityGaps,      color: "#059669", bg: "#ECFDF5" },
                  { label: "Courses Needed",      value: totalMissingCourses,  color: "#7C3AED", bg: "#F5F3FF" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
                    <div className="text-base font-extrabold" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[10px] mt-0.5 leading-tight" style={{ color: s.color }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Competency by role heatmap-style */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Competency Gaps by Role</p>
              {gapsByRole.length > 0 ? (
                <div className="space-y-3">
                  {gapsByRole.map(([role, gapCount]) => {
                    const totalInRole = employees.filter(e => e.role === role).length || gapCount;
                    const covPct = totalInRole > 0 ? Math.round(((totalInRole - gapCount) / totalInRole) * 100) : 0;
                    const color  = covPct >= 80 ? "#059669" : covPct >= 50 ? "#D97706" : "#DC2626";
                    return (
                      <div key={role} className="rounded-xl p-3 border" style={{ borderColor: "#E3E9F6" }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-slate-700 capitalize">{role}</span>
                          <span className="text-xs font-bold" style={{ color }}>{covPct}% covered</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                          <div className="h-full rounded-full" style={{ width: `${covPct}%`, background: color }} />
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-slate-400">{gapCount} employee{gapCount !== 1 ? "s" : ""} with gaps</span>
                          <span className="text-[10px] text-slate-400">{totalInRole} total in role</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl p-6 text-center" style={{ background: "#F5F3FF" }}>
                  <CheckCircle2 size={24} className="mx-auto mb-2 text-violet-400" />
                  <p className="text-xs font-semibold text-violet-700">Full competency across all roles</p>
                </div>
              )}
            </div>

            {/* Top gap employees */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Employees with Most Gaps</p>
              {topGapEmployees.length === 0 ? (
                <div className="rounded-xl p-6 text-center" style={{ background: "#ECFDF5" }}>
                  <Award size={24} className="mx-auto mb-2 text-emerald-500" />
                  <p className="text-xs font-semibold text-emerald-700">No competency gaps</p>
                  <p className="text-xs text-emerald-500 mt-0.5">Entire workforce is fully qualified</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {topGapEmployees.map((g, idx) => {
                    const m = PRIORITY_META[g.priority] ?? PRIORITY_META.low;
                    return (
                      <div key={g.employee_id} className="p-3 rounded-xl border text-xs" style={{ borderColor: "#E3E9F6" }}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                            style={{ background: idx < 3 ? "#7C3AED" : "#CBD5E1" }}>
                            {idx + 1}
                          </span>
                          <span className="flex-1 font-semibold text-slate-700 truncate">{g.employee_name}</span>
                          <span className="px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0"
                            style={{ background: m.bg, color: m.color }}>{g.missing_courses.length} gaps</span>
                        </div>
                        <div className="pl-7 text-slate-500 mb-1.5 capitalize">{g.role}</div>
                        <div className="pl-7 flex flex-wrap gap-1">
                          {g.missing_courses.slice(0, 2).map(c => (
                            <span key={c} className="px-1.5 py-0.5 rounded text-[10px] bg-violet-50 text-violet-700">{c}</span>
                          ))}
                          {g.missing_courses.length > 2 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500">
                              +{g.missing_courses.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Competency summary strip */}
              <div className="mt-4 rounded-xl p-4" style={{ background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <ClipboardList size={14} className="text-violet-600" />
                  <span className="text-xs font-bold text-violet-700">Avg Gaps per Employee</span>
                </div>
                <p className="text-3xl font-extrabold text-violet-700">{avgGapPerEmployee}</p>
                <p className="text-xs text-violet-500 mt-0.5">Missing courses per affected worker</p>
              </div>
            </div>
          </div>

          {/* Bottom strip */}
          <div className="mt-5 pt-5 border-t grid grid-cols-4 gap-4" style={{ borderColor: "#F1F5F9" }}>
            {[
              { label: "Competency Rate",    value: `${competencyRate}%`,   color: "#7C3AED", bg: "#F5F3FF" },
              { label: "Training Rate",      value: `${trainingRate}%`,     color: "#D97706", bg: "#FFFBEB" },
              { label: "Total Employees",    value: totalEmp,               color: "#4F46E5", bg: "#EEF2FF" },
              { label: "Active Workers",     value: activeEmp,              color: "#059669", bg: "#ECFDF5" },
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
