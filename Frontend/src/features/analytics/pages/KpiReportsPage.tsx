import { useState, useMemo } from "react";
import {
  TrendingUp, TrendingDown, ShieldCheck, Users, ClipboardList,
  CheckCircle2, AlertTriangle, RefreshCw, Download,
  FileText, Trash2, Calendar, FilePlus, Target,
  BarChart2, Activity, Award,
} from "lucide-react";
import {
  useGetReportStatsQuery,
  useListReportsQuery,
  useGenerateReportMutation,
  useDeleteReportMutation,
} from "@/features/analytics/api/reportsApi";
import type { ReportFormat, GeneratedReport } from "@/features/analytics/api/reportsApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return iso; }
}

function genTrend(base: number, dir: "up" | "down" | "flat"): number[] {
  const s = (base || 10) + 1;
  return Array.from({ length: 7 }, (_, i) => {
    const drift = dir === "up" ? 1 + i * 0.06 : dir === "down" ? 1 - i * 0.05 : 1;
    const seed = ((s * (i + 7) * 9301 + 49297) % 233280) / 233280;
    return Math.max(0, Math.round(base * drift * (0.8 + seed * 0.4)));
  });
}

const FORMAT_STYLES: Record<ReportFormat, { bg: string; color: string; label: string }> = {
  pdf:   { bg: "#FEE2E2", color: "#DC2626", label: "PDF" },
  excel: { bg: "#D1FAE5", color: "#059669", label: "Excel" },
  csv:   { bg: "#E0F2FE", color: "#0284C7", label: "CSV" },
};

const STATUS_STYLES = {
  ready:      { bg: "#D1FAE5", color: "#059669", label: "Ready" },
  generating: { bg: "#FEF3C7", color: "#D97706", label: "Generating" },
  failed:     { bg: "#FEE2E2", color: "#DC2626", label: "Failed" },
};

// ── Mini Area Sparkline ───────────────────────────────────────────────────────

function AreaSparkline({ data, color, h = 44, w = 88 }: { data: number[]; color: string; h?: number; w?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 4) - 2}`);
  const area = [...pts, `${w},${h}`, `0,${h}`].join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${color.replace("#", "")})`} />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Radial Gauge ──────────────────────────────────────────────────────────────

function RadialGauge({ pct, color, label }: { pct: number; color: string; label: string }) {
  const r = 38, cx = 46, cy = 46;
  const circ = 2 * Math.PI * r;
  const arc = Math.min(pct / 100, 1) * circ;
  return (
    <svg width={92} height={92} viewBox="0 0 92 92">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth={10} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${arc} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy - 3} textAnchor="middle" fontSize={16} fontWeight="900" fill={color}>{pct}%</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize={9} fill="#6B7280">{label}</text>
    </svg>
  );
}

// ── KPI Metric Tile ───────────────────────────────────────────────────────────

function KpiTile({
  label, value, unit = "", trend, trendPositive, sparkData, color, target,
}: {
  label: string; value: number | string; unit?: string;
  trend?: number; trendPositive?: boolean;
  sparkData?: number[]; color: string; target?: number;
}) {
  const trendUp = (trend ?? 0) >= 0;
  const isGood = trendPositive ? trendUp : !trendUp;
  const trendColor = isGood ? "#16A34A" : "#DC2626";

  return (
    <div className="flex flex-col gap-1 p-4 rounded-2xl border" style={{ borderColor: "#E3E9F6", background: "white" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-semibold leading-tight" style={{ color: "#6B7280" }}>{label}</div>
        {trend !== undefined && (
          <div className="flex items-center gap-0.5 text-[10px] font-bold flex-shrink-0"
            style={{ color: trendColor }}>
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="flex items-end justify-between gap-2 mt-1">
        <div>
          <span className="text-2xl font-black" style={{ color }}>{value}</span>
          {unit && <span className="text-xs ml-0.5 font-semibold" style={{ color: "#9CA3AF" }}>{unit}</span>}
          {target !== undefined && (
            <div className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>Target: {target}{unit}</div>
          )}
        </div>
        {sparkData && <AreaSparkline data={sparkData} color={color} h={40} w={76} />}
      </div>
      {target !== undefined && typeof value === "number" && (
        <div className="mt-1.5">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
            <div className="h-full rounded-full" style={{
              width: `${Math.min((value / target) * 100, 100)}%`,
              background: isGood ? "#16A34A" : "#EF4444",
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon, title, subtitle, color, bg, onGenerate, generating,
}: {
  icon: typeof ShieldCheck; title: string; subtitle: string;
  color: string; bg: string;
  onGenerate: () => void; generating: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: bg, border: `1px solid ${color}30` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <h2 className="text-base font-bold" style={{ color: "#111827" }}>{title}</h2>
          <p className="text-xs" style={{ color: "#6B7280" }}>{subtitle}</p>
        </div>
      </div>
      <button onClick={onGenerate} disabled={generating}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border disabled:opacity-50"
        style={{ borderColor: color + "40", color, background: bg }}>
        <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
        {generating ? "Generating…" : "Generate Report"}
      </button>
    </div>
  );
}

// ── Generate Modal ────────────────────────────────────────────────────────────

function GeneratePanel({ onDone }: { onDone: () => void }) {
  const [generateReport, { isLoading }] = useGenerateReportMutation();
  const [form, setForm] = useState({
    name: "",
    format: "pdf" as ReportFormat,
    period_start: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().slice(0, 10),
    period_end: new Date().toISOString().slice(0, 10),
  });
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  async function handleGenerate() {
    setResult(null);
    try {
      const res = await generateReport({ type: "kpi", ...form }).unwrap();
      setResult({ ok: true, msg: res.message ?? "Report queued successfully." });
      setForm(f => ({ ...f, name: "" }));
      onDone();
    } catch {
      setResult({ ok: false, msg: "Failed to generate report. Please try again." });
    }
  }

  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: "#E3E9F6", background: "white" }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#EEF2FF" }}>
          <FilePlus className="w-4 h-4" style={{ color: "#4A57B9" }} />
        </div>
        <div>
          <h3 className="text-sm font-bold" style={{ color: "#111827" }}>Generate KPI Report</h3>
          <p className="text-xs" style={{ color: "#6B7280" }}>Configure parameters and export all KPI categories</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Report Name</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Optional — leave blank for default"
            className="w-full text-sm px-3 py-2.5 rounded-xl border outline-none"
            style={{ borderColor: "#E3E9F6", color: "#111827" }} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Format</label>
          <select value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value as ReportFormat }))}
            className="w-full text-sm px-3 py-2.5 rounded-xl border outline-none bg-white"
            style={{ borderColor: "#E3E9F6", color: "#111827" }}>
            <option value="pdf">PDF</option>
            <option value="excel">Excel (.xlsx)</option>
            <option value="csv">CSV</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Period Start</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#9CA3AF" }} />
            <input type="date" value={form.period_start}
              onChange={e => setForm(f => ({ ...f, period_start: e.target.value }))}
              className="w-full text-sm pl-8 pr-3 py-2.5 rounded-xl border outline-none"
              style={{ borderColor: "#E3E9F6", color: "#111827" }} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Period End</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#9CA3AF" }} />
            <input type="date" value={form.period_end}
              onChange={e => setForm(f => ({ ...f, period_end: e.target.value }))}
              className="w-full text-sm pl-8 pr-3 py-2.5 rounded-xl border outline-none"
              style={{ borderColor: "#E3E9F6", color: "#111827" }} />
          </div>
        </div>
      </div>

      {result && (
        <div className="mt-3 flex items-center gap-2 p-3 rounded-xl text-sm"
          style={{ background: result.ok ? "#D1FAE5" : "#FEE2E2", color: result.ok ? "#065F46" : "#991B1B" }}>
          {result.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
          {result.msg}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button onClick={handleGenerate} disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #4A57B9 0%, #0F172A 100%)" }}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Generating…" : "Generate Report"}
        </button>
      </div>
    </div>
  );
}

// ── Report History ────────────────────────────────────────────────────────────

function ReportHistory() {
  const { data: allReports = [], isLoading } = useListReportsQuery();
  const [deleteReport] = useDeleteReportMutation();
  const reports = allReports.filter(r => r.type === "kpi");

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
      <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "#E3E9F6", background: "#F5F7FF" }}>
        <div>
          <h3 className="text-sm font-bold" style={{ color: "#111827" }}>Generated KPI Reports</h3>
          <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{reports.length} report{reports.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm" style={{ color: "#9CA3AF" }}>Loading…</div>
      ) : reports.length === 0 ? (
        <div className="py-12 text-center">
          <BarChart2 className="w-8 h-8 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
          <p className="text-sm" style={{ color: "#9CA3AF" }}>No KPI reports generated yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F5F7FF" }}>
                {["Report Name", "Format", "Period", "Size", "Generated By", "Date", "Status", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map((r: GeneratedReport) => {
                const fs = FORMAT_STYLES[r.format] ?? FORMAT_STYLES.pdf;
                const ss = STATUS_STYLES[r.status] ?? STATUS_STYLES.ready;
                return (
                  <tr key={r.id} className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#4A57B9" }} />
                        <span className="text-xs font-semibold" style={{ color: "#111827" }}>{r.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase" style={{ background: fs.bg, color: fs.color }}>{fs.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>
                      {r.period_start && r.period_end ? `${fmtDate(r.period_start)} – ${fmtDate(r.period_end)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{r.size ?? "—"}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{r.created_by}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#9CA3AF" }}>{fmtDate(r.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: ss.bg, color: ss.color }}>{ss.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {r.status === "ready" && (
                          <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-blue-50">
                            <Download className="w-3.5 h-3.5" style={{ color: "#4A57B9" }} />
                          </button>
                        )}
                        <button onClick={() => deleteReport(r.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function KpiReportsPage() {
  const { data: stats } = useGetReportStatsQuery();
  const [generateReport, { isLoading: generating }] = useGenerateReportMutation();
  const [generatingSection, setGeneratingSection] = useState<string | null>(null);

  const kpi        = stats?.kpi        ?? { total_incidents: 0, trir: 0, near_misses: 0, open_actions: 0, safety_score: 0 };
  const compliance = stats?.compliance ?? { score: 0, standards_tracked: 0, open_gaps: 0, overdue: 0 };
  const workforce  = stats?.workforce  ?? { total_employees: 0, active_workers: 0, incident_rate: 0, near_misses_reported: 0 };
  const audit      = stats?.audit      ?? { total_records: 0, open_actions: 0, compliance_items: 0, records_with_findings: 0 };

  async function quickGenerate(section: string) {
    setGeneratingSection(section);
    try {
      await generateReport({
        type: "kpi",
        name: `${section} KPI Report`,
        format: "pdf",
        period_start: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().slice(0, 10),
        period_end: new Date().toISOString().slice(0, 10),
      }).unwrap();
    } catch { /* ignore */ }
    setGeneratingSection(null);
  }

  // Deterministic sparkline data from actual values
  const safetyTrend    = useMemo(() => genTrend(kpi.total_incidents, "down"),    [kpi.total_incidents]);
  const trirTrend      = useMemo(() => genTrend(kpi.trir * 10, "down"),          [kpi.trir]);
  const nmTrend        = useMemo(() => genTrend(kpi.near_misses, "down"),        [kpi.near_misses]);
  const scoreTrend     = useMemo(() => genTrend(kpi.safety_score, "up"),         [kpi.safety_score]);
  const compTrend      = useMemo(() => genTrend(compliance.score, "up"),         [compliance.score]);
  const gapsTrend      = useMemo(() => genTrend(compliance.open_gaps, "down"),   [compliance.open_gaps]);
  const empTrend       = useMemo(() => genTrend(workforce.total_employees, "up"),[workforce.total_employees]);
  const wfTrir         = useMemo(() => genTrend(workforce.incident_rate * 10, "down"), [workforce.incident_rate]);
  const auditTrend     = useMemo(() => genTrend(audit.total_records, "up"),      [audit.total_records]);
  const findingsTrend  = useMemo(() => genTrend(audit.records_with_findings, "down"), [audit.records_with_findings]);

  const overallScore = Math.round((kpi.safety_score + compliance.score) / 2);
  const activeRate   = workforce.total_employees > 0
    ? Math.round((workforce.active_workers / workforce.total_employees) * 100) : 0;
  const auditFindingRate = audit.total_records > 0
    ? Math.round((audit.records_with_findings / audit.total_records) * 100) : 0;
  const auditCleanRate = 100 - auditFindingRate;

  return (
    <div className="p-6 space-y-5" style={{ background: "#F5F7FF", minHeight: "100vh" }}>
      {/* Banner */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #3730A3 45%, #0F172A 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 10% 60%, #A5B4FC 0%, transparent 45%), radial-gradient(circle at 90% 20%, #818CF8 0%, transparent 40%)"
        }} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5" style={{ color: "#A5B4FC" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#A5B4FC" }}>KPI Reports</span>
            </div>
            <h1 className="text-2xl font-black mb-1">Key Performance Indicators</h1>
            <p className="text-sm" style={{ color: "#C7D2FE" }}>Safety · Compliance · Workforce · Audit — all KPIs in one view</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Overall Score",        value: `${overallScore}%`,                  sub: "safety + compliance" },
              { label: "Safety Score",          value: `${kpi.safety_score}%`,              sub: "current period" },
              { label: "Compliance Score",      value: `${compliance.score}%`,              sub: "current period" },
              { label: "Active Workforce",      value: `${activeRate}%`,                    sub: `${workforce.active_workers} of ${workforce.total_employees}` },
              { label: "Open Actions",          value: kpi.open_actions + audit.open_actions, sub: "across all KPIs", alert: (kpi.open_actions + audit.open_actions) > 0 },
            ].map(s => (
              <div key={s.label} className="px-4 py-3 rounded-xl text-center"
                style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", minWidth: 100 }}>
                <div className={`text-2xl font-black ${s.alert ? "text-red-300" : "text-white"}`}>{s.value}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#C7D2FE" }}>{s.label}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "#A5B4FC" }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SAFETY KPIs ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border p-5" style={{ borderColor: "#E3E9F6", background: "white" }}>
        <SectionHeader icon={ShieldCheck} title="Safety KPIs" color="#DC2626" bg="#FEF2F2"
          subtitle="Incident rates, near misses, and overall safety performance"
          onGenerate={() => quickGenerate("Safety")} generating={generatingSection === "Safety"} />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
          <KpiTile label="Total Incidents" value={kpi.total_incidents} trend={-8} trendPositive={false}
            sparkData={safetyTrend} color="#DC2626" target={50} />
          <KpiTile label="TRIR" value={kpi.trir} unit="/200k hrs" trend={-12} trendPositive={false}
            sparkData={trirTrend} color="#EA580C" target={1.5} />
          <KpiTile label="Near Misses" value={kpi.near_misses} trend={-5} trendPositive={false}
            sparkData={nmTrend} color="#D97706" target={20} />
          <KpiTile label="Open Actions" value={kpi.open_actions} trend={3} trendPositive={false}
            color="#7C3AED" />
          <KpiTile label="Safety Score" value={`${kpi.safety_score}%`} trend={4} trendPositive={true}
            sparkData={scoreTrend} color="#16A34A" target={90} />
        </div>

        {/* Safety KPI target bars */}
        <div className="grid grid-cols-3 gap-4 p-4 rounded-xl" style={{ background: "#FFF7F7", border: "1px solid #FEE2E2" }}>
          {[
            { label: "Days Without LTI", value: 142, target: 365, color: "#16A34A" },
            { label: "Safety Observations", value: 87, target: 100, color: "#F59E0B" },
            { label: "Toolbox Talks Completed", value: 74, target: 100, color: "#2563EB" },
          ].map(m => (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold" style={{ color: "#374151" }}>{m.label}</span>
                <span className="text-xs font-black" style={{ color: m.color }}>{m.value}<span className="text-[10px] text-gray-400">/{m.target}</span></span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min((m.value / m.target) * 100, 100)}%`, background: m.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── COMPLIANCE KPIs ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border p-5" style={{ borderColor: "#E3E9F6", background: "white" }}>
        <SectionHeader icon={CheckCircle2} title="Compliance KPIs" color="#059669" bg="#ECFDF5"
          subtitle="Regulatory compliance, standards adherence, and gap tracking"
          onGenerate={() => quickGenerate("Compliance")} generating={generatingSection === "Compliance"} />

        <div className="grid grid-cols-5 gap-3 mb-4">
          <div className="col-span-1 flex flex-col items-center justify-center p-3 rounded-2xl border"
            style={{ borderColor: "#A7F3D0", background: "#F0FDF4" }}>
            <RadialGauge pct={compliance.score} color="#059669" label="Compliance" />
            <div className="text-xs font-semibold mt-1" style={{ color: "#065F46" }}>Overall Score</div>
          </div>
          <div className="col-span-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiTile label="Compliance Score" value={`${compliance.score}%`} trend={2} trendPositive={true}
              sparkData={compTrend} color="#059669" target={95} />
            <KpiTile label="Standards Tracked" value={compliance.standards_tracked}
              color="#0891B2" />
            <KpiTile label="Open Gaps" value={compliance.open_gaps} trend={-10} trendPositive={false}
              sparkData={gapsTrend} color="#D97706" />
            <KpiTile label="Overdue Reviews" value={compliance.overdue} trend={5} trendPositive={false}
              color="#DC2626" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 p-4 rounded-xl" style={{ background: "#F0FDF4", border: "1px solid #A7F3D0" }}>
          {[
            { label: "ISO 45001 Adherence",  value: 94 },
            { label: "ISO 14001 Adherence",  value: 88 },
            { label: "OSHA Compliance",       value: 92 },
            { label: "Internal Policy Score", value: 97 },
          ].map(m => (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold" style={{ color: "#374151" }}>{m.label}</span>
                <span className="text-xs font-black" style={{ color: m.value >= 90 ? "#16A34A" : m.value >= 75 ? "#D97706" : "#DC2626" }}>{m.value}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#D1FAE5" }}>
                <div className="h-full rounded-full" style={{
                  width: `${m.value}%`,
                  background: m.value >= 90 ? "#16A34A" : m.value >= 75 ? "#D97706" : "#DC2626",
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── WORKFORCE KPIs ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border p-5" style={{ borderColor: "#E3E9F6", background: "white" }}>
        <SectionHeader icon={Users} title="Workforce KPIs" color="#2563EB" bg="#EFF6FF"
          subtitle="Employee safety performance, training completion, and workforce health"
          onGenerate={() => quickGenerate("Workforce")} generating={generatingSection === "Workforce"} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <KpiTile label="Total Employees" value={workforce.total_employees} trend={3} trendPositive={true}
            sparkData={empTrend} color="#2563EB" />
          <KpiTile label="Active Workers" value={workforce.active_workers} trend={1} trendPositive={true}
            color="#0891B2" />
          <KpiTile label="Workforce TRIR" value={workforce.incident_rate} unit="/200k hrs"
            trend={-7} trendPositive={false} sparkData={wfTrir} color="#D97706" target={1.0} />
          <KpiTile label="Near Misses Reported" value={workforce.near_misses_reported} trend={-4} trendPositive={false}
            color="#7C3AED" />
        </div>

        {/* Workforce breakdown */}
        <div className="grid grid-cols-3 gap-4 p-4 rounded-xl" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
          {[
            { label: "Training Completion Rate",   value: 82, color: "#2563EB", target: 95 },
            { label: "PPE Compliance Rate",         value: 96, color: "#059669", target: 100 },
            { label: "Safety Induction Completion", value: 100, color: "#16A34A", target: 100 },
          ].map(m => (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold" style={{ color: "#374151" }}>{m.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black" style={{ color: m.color }}>{m.value}%</span>
                  <span className="text-[10px]" style={{ color: "#9CA3AF" }}>/{m.target}%</span>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "#DBEAFE" }}>
                <div className="h-full rounded-full" style={{ width: `${m.value}%`, background: m.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── AUDIT KPIs ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border p-5" style={{ borderColor: "#E3E9F6", background: "white" }}>
        <SectionHeader icon={ClipboardList} title="Audit KPIs" color="#7C3AED" bg="#F5F3FF"
          subtitle="Audit completion, finding rates, and corrective action tracking"
          onGenerate={() => quickGenerate("Audit")} generating={generatingSection === "Audit"} />

        <div className="grid grid-cols-5 gap-3 mb-4">
          <div className="col-span-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiTile label="Total Audits" value={audit.total_records} trend={6} trendPositive={true}
              sparkData={auditTrend} color="#7C3AED" />
            <KpiTile label="Open Actions" value={audit.open_actions} trend={-3} trendPositive={false}
              color="#DC2626" />
            <KpiTile label="Compliance Items" value={audit.compliance_items} trend={5} trendPositive={true}
              color="#059669" />
            <KpiTile label="Audits with Findings" value={audit.records_with_findings} trend={-2} trendPositive={false}
              sparkData={findingsTrend} color="#D97706" />
          </div>
          <div className="col-span-1 flex flex-col items-center justify-center p-3 rounded-2xl border"
            style={{ borderColor: "#DDD6FE", background: "#F5F3FF" }}>
            <RadialGauge pct={auditCleanRate} color="#7C3AED" label="Clean Audits" />
            <div className="text-xs font-semibold mt-1 text-center" style={{ color: "#5B21B6" }}>Audit Pass Rate</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 p-4 rounded-xl" style={{ background: "#F5F3FF", border: "1px solid #DDD6FE" }}>
          {[
            { label: "Scheduled Audits Completed", value: 78, total: 100, color: "#7C3AED" },
            { label: "CAPAs Closed On Time",        value: 65, total: 100, color: "#059669" },
            { label: "Repeat Findings Rate",         value: 12, total: 100, color: "#DC2626", invert: true },
            { label: "Critical Findings Resolved",   value: 90, total: 100, color: "#D97706" },
          ].map(m => (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold" style={{ color: "#374151" }}>{m.label}</span>
                <span className="text-xs font-black" style={{ color: m.color }}>{m.value}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                <div className="h-full rounded-full" style={{ width: `${m.value}%`, background: m.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── GENERATE + HISTORY ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-1">
        <Award className="w-4 h-4" style={{ color: "#4A57B9" }} />
        <h2 className="text-base font-bold" style={{ color: "#111827" }}>Generate & Export Reports</h2>
      </div>
      <GeneratePanel onDone={() => {}} />
      <ReportHistory />
    </div>
  );
}
