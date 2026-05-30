import { useState } from "react";
import { useSearchParams } from "react-router";
import {
  Download, FileText, Trash2, BarChart3, TrendingUp, TrendingDown,
  ShieldAlert, Users, Briefcase, CheckCircle2, AlertTriangle,
  FileBarChart, RefreshCw, Calendar, FilePlus,
} from "lucide-react";
import {
  useListReportsQuery,
  useGetReportStatsQuery,
  useGenerateReportMutation,
  useDeleteReportMutation,
} from "@/features/analytics/api/reportsApi";
import type { GeneratedReport, ReportType, ReportFormat } from "@/features/analytics/api/reportsApi";

// ─── Shared helpers ───────────────────────────────────────────────────────

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

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border p-5 ${className}`} style={{ borderColor: "#E3E9F6" }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: "#E3E9F6" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "18" }}>
        <BarChart3 className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <div className="text-xl font-black" style={{ color: "#111827" }}>{value}</div>
        <div className="text-xs font-semibold" style={{ color: "#6B7280" }}>{label}</div>
        {sub && <div className="text-xs" style={{ color: "#9CA3AF" }}>{sub}</div>}
      </div>
    </div>
  );
}

function Spinner() {
  return <p className="text-sm text-center py-6" style={{ color: "#9CA3AF" }}>Loading…</p>;
}

// ─── Shared Generate + History panel ─────────────────────────────────────

function ReportPanel({ reportType, title }: { reportType: ReportType; title: string }) {
  const { data: allReports = [], isLoading: histLoading } = useListReportsQuery();
  const [generateReport, { isLoading: generating }] = useGenerateReportMutation();
  const [deleteReport]  = useDeleteReportMutation();

  const [form, setForm] = useState({
    name: "",
    format: "pdf" as ReportFormat,
    period_start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 10),
    period_end:   new Date().toISOString().slice(0, 10),
  });
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const reports = allReports.filter((r) => r.type === reportType);

  async function handleGenerate() {
    setResult(null);
    try {
      const res = await generateReport({ type: reportType, ...form }).unwrap();
      setResult({ ok: true, msg: res.message });
      setForm((f) => ({ ...f, name: "" }));
    } catch {
      setResult({ ok: false, msg: "Failed to generate report. Please try again." });
    }
  }

  function formatDate(iso: string) {
    try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return iso; }
  }

  return (
    <div className="space-y-5">
      {/* Generate form */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#EEF2FF" }}>
            <FilePlus className="w-4.5 h-4.5" style={{ color: "#4A57B9" }} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: "#111827" }}>Generate {title}</h3>
            <p className="text-xs" style={{ color: "#6B7280" }}>Configure parameters and generate a new report</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Report Name (optional)</label>
            <input
              className="w-full text-sm px-3 py-2.5 rounded-xl border outline-none"
              style={{ borderColor: "#E3E9F6", color: "#111827" }}
              placeholder="Leave blank for default…"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Format</label>
            <select
              className="w-full text-sm px-3 py-2.5 rounded-xl border outline-none bg-white"
              style={{ borderColor: "#E3E9F6", color: "#111827" }}
              value={form.format}
              onChange={(e) => setForm({ ...form, format: e.target.value as ReportFormat })}
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel (.xlsx)</option>
              <option value="csv">CSV</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Period Start</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#9CA3AF" }} />
              <input
                type="date"
                className="w-full text-sm pl-8 pr-3 py-2.5 rounded-xl border outline-none"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                value={form.period_start}
                onChange={(e) => setForm({ ...form, period_start: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Period End</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#9CA3AF" }} />
              <input
                type="date"
                className="w-full text-sm pl-8 pr-3 py-2.5 rounded-xl border outline-none"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                value={form.period_end}
                onChange={(e) => setForm({ ...form, period_end: e.target.value })}
              />
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
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
          >
            <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Generating…" : "Generate Report"}
          </button>
        </div>
      </Card>

      {/* History table */}
      <Card className="!p-0 overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E9EEF8" }}>
          <div>
            <h3 className="text-sm font-bold" style={{ color: "#111827" }}>Report History</h3>
            <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{reports.length} report{reports.length !== 1 ? "s" : ""} generated</p>
          </div>
        </div>

        {histLoading ? (
          <div className="p-5"><Spinner /></div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center">
            <FileBarChart className="w-8 h-8 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
            <p className="text-sm" style={{ color: "#9CA3AF" }}>No reports generated yet. Use the form above to create one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                  {["Report Name", "Format", "Period", "Size", "Generated By", "Date", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r: GeneratedReport) => {
                  const fmtStyle = FORMAT_STYLES[r.format] ?? FORMAT_STYLES.pdf;
                  const stStyle  = STATUS_STYLES[r.status]  ?? STATUS_STYLES.ready;
                  return (
                    <tr key={r.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#4A57B9" }} />
                          <span className="text-xs font-semibold" style={{ color: "#111827" }}>{r.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase" style={{ background: fmtStyle.bg, color: fmtStyle.color }}>
                          {fmtStyle.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>
                        {r.period_start && r.period_end ? `${formatDate(r.period_start)} – ${formatDate(r.period_end)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{r.size ?? "—"}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{r.created_by}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#9CA3AF" }}>{formatDate(r.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: stStyle.bg, color: stStyle.color }}>
                          {stStyle.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {r.status === "ready" && (
                            <button type="button" className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-blue-50">
                              <Download className="w-3.5 h-3.5" style={{ color: "#4A57B9" }} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteReport(r.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50"
                          >
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
      </Card>
    </div>
  );
}

// ─── Per-tab stat rows ────────────────────────────────────────────────────

function KpiStatsRow() {
  const { data, isLoading } = useGetReportStatsQuery();
  if (isLoading || !data) return null;
  const d = data.kpi;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <StatCard label="Total Incidents"  value={d.total_incidents}   color="#EF4444" />
      <StatCard label="TRIR"             value={d.trir}              color="#F97316" sub="per 200k hrs" />
      <StatCard label="Near Misses"      value={d.near_misses}       color="#F59E0B" />
      <StatCard label="Open Actions"     value={d.open_actions}      color="#8B5CF6" />
      <StatCard label="Safety Score"     value={`${d.safety_score}%`} color="#10B981" />
    </div>
  );
}

function IncidentStatsRow() {
  const { data, isLoading } = useGetReportStatsQuery();
  if (isLoading || !data) return null;
  const d = data.incident;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <StatCard label="Total Incidents"  value={d.total}       color="#EF4444" />
      <StatCard label="Open"             value={d.open}        color="#F97316" />
      <StatCard label="Resolved"         value={d.resolved}    color="#10B981" />
      <StatCard label="Near Misses"      value={d.near_misses} color="#F59E0B" />
      <StatCard label="With RCA"         value={d.with_rca}    color="#8B5CF6" />
    </div>
  );
}

function AuditStatsRow() {
  const { data, isLoading } = useGetReportStatsQuery();
  if (isLoading || !data) return null;
  const d = data.audit;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Total Records"          value={d.total_records}            color="#4A57B9" />
      <StatCard label="Open Actions"           value={d.open_actions}             color="#F97316" />
      <StatCard label="Compliance Items"       value={d.compliance_items}         color="#10B981" />
      <StatCard label="Records w/ Findings"   value={d.records_with_findings}    color="#EF4444" />
    </div>
  );
}

function ComplianceStatsRow() {
  const { data, isLoading } = useGetReportStatsQuery();
  if (isLoading || !data) return null;
  const d = data.compliance;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Compliance Score"   value={`${d.score}%`}         color="#10B981" />
      <StatCard label="Standards Tracked"  value={d.standards_tracked}   color="#4A57B9" />
      <StatCard label="Open Gaps"          value={d.open_gaps}           color="#F97316" />
      <StatCard label="Overdue Reviews"    value={d.overdue}             color="#EF4444" />
    </div>
  );
}

function RiskStatsRow() {
  const { data, isLoading } = useGetReportStatsQuery();
  if (isLoading || !data) return null;
  const d = data.risk;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Total Assessments" value={d.total}              color="#4A57B9" />
      <StatCard label="High Risk"         value={d.high_risk}          color="#EF4444" />
      <StatCard label="Medium Risk"       value={d.medium_risk}        color="#F59E0B" />
      <StatCard label="Controls Reviewed" value={d.controls_reviewed}  color="#10B981" />
    </div>
  );
}

function WorkforceStatsRow() {
  const { data, isLoading } = useGetReportStatsQuery();
  if (isLoading || !data) return null;
  const d = data.workforce;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Total Employees"     value={d.total_employees}      color="#4A57B9" />
      <StatCard label="Active Workers"      value={d.active_workers}       color="#10B981" />
      <StatCard label="Incident Rate (TRIR)"value={d.incident_rate}        color="#F97316" sub="per 200k hrs" />
      <StatCard label="Near Misses Reported"value={d.near_misses_reported} color="#F59E0B" />
    </div>
  );
}

function ManagementStatsRow() {
  const { data, isLoading } = useGetReportStatsQuery();
  if (isLoading || !data) return null;
  const d = data.management;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Safety Score"      value={`${d.safety_score}%`}  color="#10B981" />
      <StatCard label="Incidents YTD"     value={d.incidents_ytd}       color="#EF4444" />
      <StatCard label="Compliance Avg"    value={`${d.compliance_avg}%`} color="#4A57B9" />
      <StatCard label="Open CAPAs"        value={d.open_capas}          color="#F97316" />
    </div>
  );
}

// ─── Tab definitions ──────────────────────────────────────────────────────

type TabId = "kpi" | "incidents" | "audits" | "compliance" | "risk" | "workforce" | "management";

const TABS: { id: TabId; label: string; icon: typeof BarChart3; StatsRow: () => React.ReactElement | null; reportType: ReportType }[] = [
  { id: "kpi",        label: "KPI Reports",        icon: TrendingUp,    StatsRow: KpiStatsRow,        reportType: "kpi" },
  { id: "incidents",  label: "Incident Reports",   icon: AlertTriangle, StatsRow: IncidentStatsRow,   reportType: "incident" },
  { id: "audits",     label: "Audit Reports",      icon: CheckCircle2,  StatsRow: AuditStatsRow,      reportType: "audit" },
  { id: "compliance", label: "Compliance Reports", icon: ShieldAlert,   StatsRow: ComplianceStatsRow, reportType: "compliance" },
  { id: "risk",       label: "Risk Reports",       icon: TrendingDown,  StatsRow: RiskStatsRow,       reportType: "risk" },
  { id: "workforce",  label: "Workforce Reports",  icon: Users,         StatsRow: WorkforceStatsRow,  reportType: "workforce" },
  { id: "management", label: "Management Reports", icon: Briefcase,     StatsRow: ManagementStatsRow, reportType: "management" },
];

// ─── Main Page ─────────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabId = (searchParams.get("tab") ?? "kpi") as TabId;
  const current = TABS.find((t) => t.id === tabId) ?? TABS[0];

  function setTab(id: TabId) {
    setSearchParams({ tab: id });
  }

  const { StatsRow, reportType, label } = current;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Reports</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Generate, download and manage safety reports across all categories</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(({ id, label: lbl, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={tabId === id
              ? { background: "#4A57B9", color: "#fff", boxShadow: "0 4px 10px rgba(74,87,185,0.25)" }
              : { background: "#F3F4F6", color: "#6B7280" }}
          >
            <Icon className="w-3.5 h-3.5" />
            {lbl}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <StatsRow />

      {/* Generate + History */}
      <ReportPanel reportType={reportType} title={label} />
    </div>
  );
}
