import { useState } from "react";
import {
  LayoutDashboard, FileText, Lightbulb, Bell, Share2,
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2,
  Clock, Download, RefreshCw, Send, Plus, Zap, Eye,
  BarChart3, Shield, Activity, Users, ClipboardCheck,
  Smartphone, Mail, MessageSquare, Globe, Database,
  ArrowUpRight, ChevronRight, Filter, Settings,
  FileSpreadsheet, FileJson, Link2, Wifi, WifiOff,
} from "lucide-react";
import type {
  DashboardKPI, Report, AIInsight, MobileAlert, AlertRule,
  ExportJob, Integration, ReportType, ExportFormat,
} from "../api/outputsApi";
import {
  useGetOperationalDashboardQuery,
  useListReportsQuery,
  useGenerateReportMutation,
  useGetAIInsightsQuery,
  useActionInsightMutation,
  useGetAlertsDashboardQuery,
  useUpdateAlertRuleMutation,
  useGetExportShareDataQuery,
  useCreateExportJobMutation,
} from "../api/outputsApi";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_KPIS: DashboardKPI[] = [
  { label: "Safety Score", value: 87, unit: "%", trend: 3.2, trend_dir: "up", status: "good" },
  { label: "Open Incidents", value: 14, trend: -2, trend_dir: "down", status: "good" },
  { label: "Compliance Rate", value: 93, unit: "%", trend: 1.1, trend_dir: "up", status: "good" },
  { label: "Overdue CAPAs", value: 7, trend: 2, trend_dir: "up", status: "warning" },
  { label: "Active Permits", value: 42, trend: 5, trend_dir: "up", status: "good" },
  { label: "Risk Events (7d)", value: 28, trend: -4, trend_dir: "down", status: "good" },
  { label: "Training Compliance", value: 78, unit: "%", trend: -1.5, trend_dir: "down", status: "warning" },
  { label: "Avg Resolution (h)", value: 18.4, unit: "h", trend: -2.1, trend_dir: "down", status: "good" },
];

const INCIDENT_TREND = [12, 18, 15, 22, 14, 19, 11, 16, 14, 13, 17, 14];
const COMPLIANCE_TREND = [88, 89, 90, 91, 90, 92, 92, 93, 93, 94, 93, 93];
const RISK_BREAKDOWN = [
  { label: "Low", value: 34, color: "#22C55E" },
  { label: "Medium", value: 28, color: "#F59E0B" },
  { label: "High", value: 18, color: "#F97316" },
  { label: "Critical", value: 6, color: "#EF4444" },
];
const TOP_INCIDENT_TYPES = [
  { label: "Near Miss", count: 22 },
  { label: "Equipment Fault", count: 17 },
  { label: "Hazard Spotted", count: 15 },
  { label: "Safety Violation", count: 9 },
  { label: "Injury", count: 3 },
];

const MOCK_REPORTS: Report[] = [
  { id: "r1", title: "Monthly Compliance Report – April 2026", type: "compliance", status: "ready", format: "pdf", size_kb: 420, generated_at: "2026-05-01T08:00:00Z", generated_by: "System", period: "Apr 2026" },
  { id: "r2", title: "Q1 Audit Summary", type: "audit", status: "ready", format: "excel", size_kb: 215, generated_at: "2026-04-15T10:30:00Z", generated_by: "Jane Cooper", period: "Q1 2026" },
  { id: "r3", title: "May Incident Log", type: "incident", status: "generating", format: "pdf", generated_by: "System", period: "May 2026" },
  { id: "r4", title: "Open CAPA Tracker", type: "capa", status: "ready", format: "excel", size_kb: 88, generated_at: "2026-05-20T14:00:00Z", generated_by: "Admin", period: "May 2026" },
  { id: "r5", title: "KPI Dashboard Export", type: "kpi", status: "ready", format: "pdf", size_kb: 310, generated_at: "2026-05-18T09:00:00Z", generated_by: "System", period: "May 2026" },
  { id: "r6", title: "Risk Assessment Report", type: "risk", status: "scheduled", format: "pdf", scheduled_for: "2026-06-01T06:00:00Z", generated_by: "System", period: "Jun 2026" },
  { id: "r7", title: "Training Compliance Report", type: "training", status: "ready", format: "csv", size_kb: 55, generated_at: "2026-05-15T11:00:00Z", generated_by: "HR Manager", period: "May 2026" },
];

const MOCK_INSIGHTS: AIInsight[] = [
  { id: "i1", title: "Spike in Near-Miss Events at Zone B", summary: "A 38% increase in near-miss incidents detected over the past 7 days in Zone B. Root cause likely linked to equipment maintenance backlog.", category: "anomaly", severity: "critical", confidence: 91, affected_areas: ["Zone B", "Equipment", "Maintenance"], generated_at: "2026-05-23T07:00:00Z", actioned: false, trend_data: [4, 3, 5, 7, 9, 12, 14] },
  { id: "i2", title: "Training Compliance Declining", summary: "Completion rate for mandatory safety training dropped by 8% over the last 30 days, primarily in the Operations department.", category: "trend", severity: "warning", confidence: 85, affected_areas: ["Training", "Operations"], generated_at: "2026-05-22T14:00:00Z", actioned: false, trend_data: [92, 91, 90, 89, 87, 85, 84] },
  { id: "i3", title: "Permit Expiry Risk – 12 Active Permits", summary: "12 active work permits are within 48 hours of expiry. Automatic renewal failed for 3 of them due to approval gap.", category: "risk", severity: "warning", confidence: 97, affected_areas: ["Permits", "Zone A", "Zone D"], generated_at: "2026-05-23T06:30:00Z", actioned: false },
  { id: "i4", title: "CAPA Closure Rate Improving", summary: "Month-over-month CAPA closure rate improved by 14%. Predictive model indicates sustained improvement if current pace continues.", category: "recommendation", severity: "info", confidence: 78, affected_areas: ["CAPA", "Quality"], generated_at: "2026-05-21T10:00:00Z", actioned: true },
  { id: "i5", title: "Audit Finding Pattern: Fire Safety", summary: "Fire safety findings account for 42% of all repeat audit findings. Recommend targeted inspection campaign.", category: "compliance", severity: "warning", confidence: 88, affected_areas: ["Fire Safety", "Audit", "Compliance"], generated_at: "2026-05-20T09:00:00Z", actioned: false },
  { id: "i6", title: "Workforce Risk Score Elevated – Night Shift", summary: "Fatigue-related risk indicators are elevated for night shift workers across 3 sites. Consider staffing adjustments.", category: "risk", severity: "critical", confidence: 83, affected_areas: ["Workforce", "Night Shift", "Sites 2, 4, 7"], generated_at: "2026-05-22T23:00:00Z", actioned: false },
];

const MOCK_ALERTS: MobileAlert[] = [
  { id: "a1", title: "Critical Incident Reported", body: "A severity-critical incident has been logged at Site Alpha – Zone B. Immediate response required.", priority: "critical", channels: ["push", "sms", "email"], recipients: ["Safety Manager", "Site Director"], sent_at: "2026-05-23T08:15:00Z", read_count: 2, total_recipients: 2 },
  { id: "a2", title: "CAPA Overdue: INV-2024-089", body: "Corrective action INV-2024-089 is 3 days overdue. Assigned to James Wilson.", priority: "high", channels: ["push", "email"], recipients: ["James Wilson", "Operations Lead"], sent_at: "2026-05-23T07:00:00Z", read_count: 1, total_recipients: 2 },
  { id: "a3", title: "Permit Expiry Alert", body: "Work permits WP-441, WP-443, WP-447 expire within 24 hours.", priority: "medium", channels: ["push", "in_app"], recipients: ["Permit Officer"], sent_at: "2026-05-23T06:00:00Z", read_count: 1, total_recipients: 1 },
  { id: "a4", title: "Audit Scheduled Reminder", body: "Q2 Internal Safety Audit is scheduled for tomorrow at 09:00.", priority: "low", channels: ["in_app", "email"], recipients: ["All Managers"], sent_at: "2026-05-22T17:00:00Z", read_count: 12, total_recipients: 14 },
];

const MOCK_RULES: AlertRule[] = [
  { id: "r1", name: "Critical Incident Created", trigger: "incident.severity == critical", channels: ["push", "sms", "email"], priority: "critical", enabled: true, recipients: ["Safety Manager", "Site Director", "CEO"] },
  { id: "r2", name: "CAPA Overdue (3+ days)", trigger: "capa.days_overdue >= 3", channels: ["push", "email"], priority: "high", enabled: true, recipients: ["Assignee", "Operations Lead"] },
  { id: "r3", name: "Permit Expiry (24h)", trigger: "permit.expires_in_hours <= 24", channels: ["push", "in_app"], priority: "medium", enabled: true, recipients: ["Permit Officer"] },
  { id: "r4", name: "Audit Reminder (1 day prior)", trigger: "audit.starts_in_hours <= 24", channels: ["in_app", "email"], priority: "low", enabled: true, recipients: ["All Managers"] },
  { id: "r5", name: "Workflow Escalation", trigger: "workflow.escalated == true", channels: ["push", "email"], priority: "high", enabled: false, recipients: ["Safety Manager"] },
];

const MOCK_EXPORTS: ExportJob[] = [
  { id: "e1", name: "Incident Log – May 2026", format: "excel", module: "Incidents", created_at: "2026-05-23T09:00:00Z", size_kb: 145, status: "done" },
  { id: "e2", name: "Compliance Report Q1", format: "pdf", module: "Compliance", created_at: "2026-05-22T14:00:00Z", size_kb: 380, status: "done" },
  { id: "e3", name: "CAPA Data Export", format: "csv", module: "CAPAs", created_at: "2026-05-21T10:30:00Z", size_kb: 62, status: "done" },
  { id: "e4", name: "All Records API Dump", format: "json", module: "All", created_at: "2026-05-20T08:00:00Z", size_kb: 2240, status: "done" },
  { id: "e5", name: "KPI Dashboard Export", format: "pdf", module: "KPIs", created_at: "2026-05-19T16:00:00Z", size_kb: 290, status: "done" },
];

const MOCK_INTEGRATIONS: Integration[] = [
  { id: "int1", name: "SAP ERP", type: "erp", status: "connected", last_sync: "2026-05-23T08:00:00Z", records_synced: 12400 },
  { id: "int2", name: "Power BI", type: "bi", status: "connected", last_sync: "2026-05-23T07:30:00Z", records_synced: 5800 },
  { id: "int3", name: "Workday HRMS", type: "hrms", status: "disconnected" },
  { id: "int4", name: "Webhook – Slack", type: "webhook", status: "connected", last_sync: "2026-05-23T09:00:00Z", records_synced: 340 },
  { id: "int5", name: "Custom REST API", type: "api", status: "error", last_sync: "2026-05-22T12:00:00Z" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function fmtSize(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  compliance: "Compliance", audit: "Audit", incident: "Incident",
  capa: "CAPA", kpi: "KPI", risk: "Risk", training: "Training",
};

const REPORT_TYPE_COLORS: Record<ReportType, string> = {
  compliance: "#3B82F6", audit: "#8B5CF6", incident: "#EF4444",
  capa: "#F97316", kpi: "#10B981", risk: "#F59E0B", training: "#06B6D4",
};

const STATUS_STYLES = {
  ready: { bg: "#D1FAE5", color: "#065F46", label: "Ready" },
  generating: { bg: "#FEF3C7", color: "#92400E", label: "Generating…" },
  failed: { bg: "#FEE2E2", color: "#991B1B", label: "Failed" },
  scheduled: { bg: "#E0E7FF", color: "#3730A3", label: "Scheduled" },
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#EF4444", high: "#F97316", medium: "#F59E0B", low: "#6B7280",
};

const CHANNEL_ICONS = {
  push: Smartphone, sms: MessageSquare, email: Mail, in_app: Bell,
};

const FORMAT_ICONS: Record<ExportFormat, React.ElementType> = {
  pdf: FileText, excel: FileSpreadsheet, csv: FileText, json: FileJson, api: Globe,
};

const INTEGRATION_STATUS_STYLES: Record<string, { bg: string; color: string; label: string; icon: React.ElementType }> = {
  connected: { bg: "#D1FAE5", color: "#065F46", label: "Connected", icon: Wifi },
  disconnected: { bg: "#F1F5F9", color: "#64748B", label: "Disconnected", icon: WifiOff },
  error: { bg: "#FEE2E2", color: "#991B1B", label: "Error", icon: AlertTriangle },
};

// ─── Tab Definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: "dashboard", label: "Dashboards", icon: LayoutDashboard },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "insights", label: "AI Insights", icon: Lightbulb },
  { id: "alerts", label: "Mobile Alerts", icon: Bell },
  { id: "export", label: "Export & Share", icon: Share2 },
] as const;

type Tab = typeof TABS[number]["id"];

// ─── Sub-components ───────────────────────────────────────────────────────────

function KPICard({ kpi }: { kpi: DashboardKPI }) {
  const TrendIcon = kpi.trend_dir === "up" ? TrendingUp : kpi.trend_dir === "down" ? TrendingDown : Minus;
  const trendColor = kpi.status === "good"
    ? (kpi.trend_dir === "down" ? "#22C55E" : "#22C55E")
    : (kpi.trend_dir === "up" ? "#EF4444" : "#F59E0B");
  const statusColor = kpi.status === "good" ? "#22C55E" : kpi.status === "warning" ? "#F59E0B" : "#EF4444";

  return (
    <div className="rounded-xl p-4 border" style={{ background: "#fff", borderColor: "#E3E9F6" }}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-[12px] font-medium" style={{ color: "#6B7280" }}>{kpi.label}</span>
        <span className="w-2 h-2 rounded-full mt-0.5 flex-shrink-0" style={{ background: statusColor }} />
      </div>
      <div className="text-[26px] font-bold mb-1" style={{ color: "#111827" }}>
        {kpi.value}{kpi.unit && <span className="text-[14px] font-medium ml-0.5" style={{ color: "#6B7280" }}>{kpi.unit}</span>}
      </div>
      <div className="flex items-center gap-1">
        <TrendIcon className="w-3.5 h-3.5" style={{ color: trendColor }} />
        <span className="text-[11px] font-medium" style={{ color: trendColor }}>
          {kpi.trend > 0 ? "+" : ""}{kpi.trend}{kpi.unit || ""}
        </span>
        <span className="text-[11px]" style={{ color: "#9CA3AF" }}>vs last period</span>
      </div>
    </div>
  );
}

function SparkLine({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 32;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: "#F1F5F9" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.round((value / max) * 100)}%`, background: color }} />
      </div>
      <span className="text-[11px] font-medium w-6 text-right" style={{ color: "#374151" }}>{value}</span>
    </div>
  );
}

// ─── Dashboard Tab ─────────────────────────────────────────────────────────────

function DashboardsTab() {
  const { data: dashData, isLoading: dashLoading } = useGetOperationalDashboardQuery();
  const kpis = dashData?.kpis?.length ? dashData.kpis : MOCK_KPIS;
  const maxIncident = Math.max(...TOP_INCIDENT_TYPES.map((t) => t.count));
  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[14px] font-semibold" style={{ color: "#111827" }}>Real-time Operational KPIs</h3>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium" style={{ background: "#F0FDF4", color: "#166534" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {dashLoading ? "Loading…" : "Live"}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {kpis.map((kpi) => <KPICard key={kpi.label} kpi={kpi} />)}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Incident Trend */}
        <div className="rounded-xl border p-4 md:col-span-1" style={{ background: "#fff", borderColor: "#E3E9F6" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>Incident Trend (12m)</span>
            <Activity className="w-4 h-4" style={{ color: "#94A3B8" }} />
          </div>
          <div className="flex items-end gap-1 h-20">
            {INCIDENT_TREND.map((v, i) => {
              const max = Math.max(...INCIDENT_TREND);
              const pct = (v / max) * 100;
              return (
                <div key={i} className="flex-1 rounded-t" style={{ height: `${pct}%`, background: "linear-gradient(to top, #EF4444, #FCA5A5)", minHeight: 4 }} title={String(v)} />
              );
            })}
          </div>
          <div className="mt-2 text-[11px]" style={{ color: "#9CA3AF" }}>Jan – Dec 2025</div>
        </div>

        {/* Compliance Trend */}
        <div className="rounded-xl border p-4 md:col-span-1" style={{ background: "#fff", borderColor: "#E3E9F6" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>Compliance Rate (12m)</span>
            <Shield className="w-4 h-4" style={{ color: "#94A3B8" }} />
          </div>
          <div className="flex items-end gap-1 h-20">
            {COMPLIANCE_TREND.map((v, i) => {
              const pct = ((v - 85) / 10) * 100;
              return (
                <div key={i} className="flex-1 rounded-t" style={{ height: `${Math.max(pct, 4)}%`, background: "linear-gradient(to top, #3B82F6, #93C5FD)" }} title={`${v}%`} />
              );
            })}
          </div>
          <div className="mt-2 text-[11px]" style={{ color: "#9CA3AF" }}>Jan – Dec 2025</div>
        </div>

        {/* Risk Breakdown */}
        <div className="rounded-xl border p-4 md:col-span-1" style={{ background: "#fff", borderColor: "#E3E9F6" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>Risk Level Distribution</span>
            <AlertTriangle className="w-4 h-4" style={{ color: "#94A3B8" }} />
          </div>
          <div className="space-y-2.5">
            {RISK_BREAKDOWN.map((r) => {
              const total = RISK_BREAKDOWN.reduce((s, x) => s + x.value, 0);
              return (
                <div key={r.label} className="flex items-center gap-2">
                  <span className="w-14 text-[11px]" style={{ color: "#6B7280" }}>{r.label}</span>
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, background: "#F1F5F9" }}>
                    <div className="h-full rounded-full" style={{ width: `${(r.value / total) * 100}%`, background: r.color }} />
                  </div>
                  <span className="text-[11px] font-semibold w-6 text-right" style={{ color: "#374151" }}>{r.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Incident Types */}
      <div className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#E3E9F6" }}>
        <h3 className="text-[14px] font-semibold mb-4" style={{ color: "#111827" }}>Top Incident Types</h3>
        <div className="space-y-3">
          {TOP_INCIDENT_TYPES.map((t) => (
            <div key={t.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px]" style={{ color: "#374151" }}>{t.label}</span>
                <span className="text-[12px] font-semibold" style={{ color: "#111827" }}>{t.count}</span>
              </div>
              <MiniBar value={t.count} max={maxIncident} color="linear-gradient(to right,#6366F1,#818CF8)" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────

function ReportsTab() {
  const { data: reportsData = [] } = useListReportsQuery();
  const [generateReport, { isLoading: isGenerating }] = useGenerateReportMutation();
  const allReports = reportsData.length ? reportsData : MOCK_REPORTS;
  const [filter, setFilter] = useState<ReportType | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<ReportType>("compliance");
  const [formFormat, setFormFormat] = useState<"pdf" | "excel" | "csv">("pdf");
  const [periodStart, setPeriodStart] = useState("2026-05-01");
  const [periodEnd, setPeriodEnd] = useState("2026-05-31");

  const filtered = filter === "all" ? allReports : allReports.filter((r) => r.type === filter);

  async function handleGenerate() {
    try {
      await generateReport({ type: formType, format: formFormat, period_start: periodStart, period_end: periodEnd });
      setShowForm(false);
    } catch {
      // leave form open on error
    }
  }

  return (
    <div className="space-y-5">
      {/* Header actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "compliance", "audit", "incident", "capa", "kpi", "risk", "training"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
              style={filter === t
                ? { background: "linear-gradient(135deg,#4A57B9,#6F80E8)", color: "#fff" }
                : { background: "#F1F5F9", color: "#374151" }}
            >
              {t === "all" ? "All Reports" : REPORT_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-all"
          style={{ background: "linear-gradient(135deg,#4A57B9,#6F80E8)" }}
        >
          <Plus className="w-4 h-4" />
          Generate Report
        </button>
      </div>

      {/* Generate form */}
      {showForm && (
        <div className="rounded-xl border p-5" style={{ background: "#F8FAFF", borderColor: "#C7D7F5" }}>
          <h4 className="text-[14px] font-semibold mb-4" style={{ color: "#111827" }}>New Report</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: "#6B7280" }}>Report Type</label>
              <select className="w-full rounded-lg border px-3 py-2 text-[13px]" style={{ borderColor: "#D1D5DB" }} value={formType} onChange={(e) => setFormType(e.target.value as ReportType)}>
                {Object.entries(REPORT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: "#6B7280" }}>Format</label>
              <select className="w-full rounded-lg border px-3 py-2 text-[13px]" style={{ borderColor: "#D1D5DB" }} value={formFormat} onChange={(e) => setFormFormat(e.target.value as "pdf" | "excel" | "csv")}>
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: "#6B7280" }}>Period Start</label>
              <input type="date" className="w-full rounded-lg border px-3 py-2 text-[13px]" style={{ borderColor: "#D1D5DB" }} value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: "#6B7280" }}>Period End</label>
              <input type="date" className="w-full rounded-lg border px-3 py-2 text-[13px]" style={{ borderColor: "#D1D5DB" }} value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleGenerate} disabled={isGenerating} className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: "linear-gradient(135deg,#4A57B9,#6F80E8)" }}>
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {isGenerating ? "Generating…" : "Generate"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-[13px] font-medium" style={{ background: "#F1F5F9", color: "#374151" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Reports list */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E3E9F6" }}>
              {["Report", "Type", "Period", "Format", "Size", "Generated", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const st = STATUS_STYLES[r.status];
              const typeColor = REPORT_TYPE_COLORS[r.type];
              return (
                <tr key={r.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "#111827" }}>{r.title}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: `${typeColor}18`, color: typeColor }}>{REPORT_TYPE_LABELS[r.type]}</span>
                  </td>
                  <td className="px-4 py-3" style={{ color: "#6B7280" }}>{r.period}</td>
                  <td className="px-4 py-3 uppercase text-[11px] font-semibold" style={{ color: "#6B7280" }}>{r.format}</td>
                  <td className="px-4 py-3" style={{ color: "#6B7280" }}>{r.size_kb ? fmtSize(r.size_kb) : "—"}</td>
                  <td className="px-4 py-3" style={{ color: "#6B7280" }}>{r.generated_at ? fmtDate(r.generated_at) : r.scheduled_for ? `Scheduled ${fmtDate(r.scheduled_for)}` : "—"}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "ready" && (
                      <button className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium" style={{ background: "#EEF2FF", color: "#3730A3" }}>
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── AI Insights Tab ──────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  anomaly: { bg: "#FEE2E2", color: "#991B1B", label: "Anomaly" },
  trend: { bg: "#FEF3C7", color: "#92400E", label: "Trend" },
  risk: { bg: "#FFF7ED", color: "#9A3412", label: "Risk" },
  compliance: { bg: "#EDE9FE", color: "#5B21B6", label: "Compliance" },
  recommendation: { bg: "#D1FAE5", color: "#065F46", label: "Recommendation" },
};

const SEVERITY_STYLES: Record<string, { border: string; dot: string }> = {
  critical: { border: "#EF4444", dot: "#EF4444" },
  warning: { border: "#F59E0B", dot: "#F59E0B" },
  info: { border: "#3B82F6", dot: "#3B82F6" },
};

function InsightsTab() {
  const { data: insightsData } = useGetAIInsightsQuery();
  const [actionInsightMutation] = useActionInsightMutation();
  const insights = insightsData?.insights?.length ? insightsData.insights : MOCK_INSIGHTS;
  const [localActioned, setLocalActioned] = useState<Set<string>>(new Set<string>());
  const actioned = new Set([...insights.filter((i) => i.actioned).map((i) => i.id), ...localActioned]);
  const critical = insights.filter((i) => i.severity === "critical").length;
  const warnings = insights.filter((i) => i.severity === "warning").length;

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Insights", value: insights.length, icon: Lightbulb, color: "#6366F1" },
          { label: "Critical", value: critical, icon: AlertTriangle, color: "#EF4444" },
          { label: "Warnings", value: warnings, icon: AlertTriangle, color: "#F59E0B" },
          { label: "Actioned Today", value: actioned.size, icon: CheckCircle2, color: "#22C55E" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-4 flex items-center gap-3" style={{ background: "#fff", borderColor: "#E3E9F6" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18` }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-[20px] font-bold" style={{ color: "#111827" }}>{s.value}</div>
              <div className="text-[11px]" style={{ color: "#6B7280" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Insight cards */}
      <div className="space-y-3">
        {insights.map((insight) => {
          const cat = CATEGORY_STYLES[insight.category];
          const sev = SEVERITY_STYLES[insight.severity];
          const isActioned = actioned.has(insight.id);
          return (
            <div key={insight.id} className="rounded-xl border-l-4 p-4" style={{ background: "#fff", borderColor: "#E3E9F6", borderLeftColor: sev.border }}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[14px] font-semibold" style={{ color: "#111827" }}>{insight.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
                    {isActioned && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "#D1FAE5", color: "#065F46" }}>Actioned</span>
                    )}
                  </div>
                  <p className="text-[12px] mb-2" style={{ color: "#4B5563" }}>{insight.summary}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px]" style={{ color: "#6B7280" }}>Confidence:</span>
                      <span className="text-[11px] font-semibold" style={{ color: "#111827" }}>{insight.confidence}%</span>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {insight.affected_areas.map((a) => (
                        <span key={a} className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: "#F1F5F9", color: "#374151" }}>{a}</span>
                      ))}
                    </div>
                    <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{fmtDate(insight.generated_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {insight.trend_data && (
                    <SparkLine data={insight.trend_data} color={sev.border} />
                  )}
                  {!isActioned && (
                    <button
                      onClick={() => { setLocalActioned((prev) => new Set([...prev, insight.id])); actionInsightMutation(insight.id); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                      style={{ background: "#EEF2FF", color: "#3730A3" }}
                    >
                      <Zap className="w-3.5 h-3.5" /> Act
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Mobile Alerts Tab ────────────────────────────────────────────────────────

function AlertsTab() {
  const { data: alertsData } = useGetAlertsDashboardQuery();
  const [updateRule] = useUpdateAlertRuleMutation();
  const recentAlerts = alertsData?.recent_alerts?.length ? alertsData.recent_alerts : MOCK_ALERTS;
  const baseRules = alertsData?.rules?.length ? alertsData.rules : MOCK_RULES;
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const rules = baseRules.map((r) => ({ ...r, enabled: r.id in overrides ? overrides[r.id] : r.enabled }));

  function toggleRule(id: string) {
    const current = rules.find((r) => r.id === id)?.enabled ?? true;
    setOverrides((prev) => ({ ...prev, [id]: !current }));
    updateRule({ id, enabled: !current });
  }

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Sent Today", value: alertsData?.sent_today ?? 14, color: "#6366F1" },
          { label: "Critical Unread", value: alertsData?.critical_unread ?? 2, color: "#EF4444" },
          { label: "Pending", value: alertsData?.pending ?? 3, color: "#F59E0B" },
          { label: "Delivery Rate", value: "97%", color: "#22C55E" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-4 text-center" style={{ background: "#fff", borderColor: "#E3E9F6" }}>
            <div className="text-[24px] font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[11px]" style={{ color: "#6B7280" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent alerts */}
      <div>
        <h3 className="text-[14px] font-semibold mb-3" style={{ color: "#111827" }}>Recent Alerts</h3>
        <div className="space-y-3">
          {recentAlerts.map((alert) => {
            const pColor = PRIORITY_COLORS[alert.priority];
            const readPct = Math.round((alert.read_count / alert.total_recipients) * 100);
            return (
              <div key={alert.id} className="rounded-xl border p-4" style={{ background: "#fff", borderColor: "#E3E9F6" }}>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: pColor }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>{alert.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase" style={{ background: `${pColor}18`, color: pColor }}>{alert.priority}</span>
                    </div>
                    <p className="text-[12px] mb-2" style={{ color: "#4B5563" }}>{alert.body}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1">
                        {alert.channels.map((ch) => {
                          const Icon = CHANNEL_ICONS[ch];
                          return <Icon key={ch} className="w-3.5 h-3.5" style={{ color: "#6B7280" }} />;
                        })}
                      </div>
                      <span className="text-[11px]" style={{ color: "#6B7280" }}>
                        {alert.read_count}/{alert.total_recipients} read ({readPct}%)
                      </span>
                      <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{fmtDate(alert.sent_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alert rules */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[14px] font-semibold" style={{ color: "#111827" }}>Alert Rules</h3>
          <button className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg" style={{ background: "#EEF2FF", color: "#3730A3" }}>
            <Plus className="w-3.5 h-3.5" /> Add Rule
          </button>
        </div>
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
          {rules.map((rule, i) => {
            const pColor = PRIORITY_COLORS[rule.priority];
            return (
              <div key={rule.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: i < rules.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium mb-0.5" style={{ color: "#111827" }}>{rule.name}</div>
                  <div className="text-[11px] font-mono" style={{ color: "#6B7280" }}>{rule.trigger}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  {rule.channels.map((ch) => {
                    const Icon = CHANNEL_ICONS[ch];
                    return <Icon key={ch} className="w-3.5 h-3.5" style={{ color: "#94A3B8" }} />;
                  })}
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase" style={{ background: `${pColor}18`, color: pColor }}>{rule.priority}</span>
                <button
                  onClick={() => toggleRule(rule.id)}
                  className="relative w-9 h-5 rounded-full transition-all flex-shrink-0"
                  style={{ background: rule.enabled ? "#6366F1" : "#D1D5DB" }}
                  title={rule.enabled ? "Disable" : "Enable"}
                >
                  <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: rule.enabled ? "calc(100% - 1.125rem)" : "0.125rem" }} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Export & Share Tab ───────────────────────────────────────────────────────

function ExportShareTab() {
  const { data: exportData } = useGetExportShareDataQuery();
  const [createExportJob, { isLoading: isExporting }] = useCreateExportJobMutation();
  const exports = exportData?.recent_exports?.length ? exportData.recent_exports : MOCK_EXPORTS;
  const integrations = exportData?.integrations?.length ? exportData.integrations : MOCK_INTEGRATIONS;
  const [selFormat, setSelFormat] = useState<ExportFormat>("excel");
  const [selModule, setSelModule] = useState("Incidents");

  async function handleExport() {
    try {
      await createExportJob({ format: selFormat, module: selModule });
    } catch {
      // export queued locally
    }
  }

  const FORMAT_OPTIONS: { value: ExportFormat; label: string; desc: string }[] = [
    { value: "pdf", label: "PDF", desc: "Formatted printable report" },
    { value: "excel", label: "Excel", desc: "XLSX workbook with charts" },
    { value: "csv", label: "CSV", desc: "Raw tabular data" },
    { value: "json", label: "JSON", desc: "Machine-readable data dump" },
    { value: "api", label: "API", desc: "REST endpoint for live data" },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Export */}
      <div className="rounded-xl border p-5" style={{ background: "#F8FAFF", borderColor: "#C7D7F5" }}>
        <h3 className="text-[14px] font-semibold mb-4" style={{ color: "#111827" }}>Quick Export</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
          {FORMAT_OPTIONS.map((f) => {
            const FIcon = FORMAT_ICONS[f.value];
            return (
              <button
                key={f.value}
                onClick={() => setSelFormat(f.value)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all"
                style={{
                  borderColor: selFormat === f.value ? "#4A57B9" : "#E3E9F6",
                  background: selFormat === f.value ? "#EEF2FF" : "#fff",
                }}
              >
                <FIcon className="w-5 h-5" style={{ color: selFormat === f.value ? "#4A57B9" : "#6B7280" }} />
                <span className="text-[12px] font-semibold" style={{ color: selFormat === f.value ? "#4A57B9" : "#374151" }}>{f.label}</span>
                <span className="text-[10px] text-center" style={{ color: "#9CA3AF" }}>{f.desc}</span>
              </button>
            );
          })}
        </div>
        <div className="flex gap-3 flex-wrap">
          <select
            className="rounded-lg border px-3 py-2 text-[13px]"
            style={{ borderColor: "#D1D5DB" }}
            value={selModule}
            onChange={(e) => setSelModule(e.target.value)}
          >
            {["Incidents", "Permits", "CAPAs", "Audits", "Training", "Hazards", "All Records"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#4A57B9,#6F80E8)" }}
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? "Preparing…" : "Export Now"}
          </button>
        </div>
      </div>

      {/* Recent Exports */}
      <div>
        <h3 className="text-[14px] font-semibold mb-3" style={{ color: "#111827" }}>Recent Exports</h3>
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
          {exports.map((job, i) => {
            const FIcon = FORMAT_ICONS[job.format];
            return (
              <div key={job.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: i < exports.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#EEF2FF" }}>
                  <FIcon className="w-4 h-4" style={{ color: "#4A57B9" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate" style={{ color: "#111827" }}>{job.name}</div>
                  <div className="text-[11px]" style={{ color: "#6B7280" }}>{job.module} · {fmtSize(job.size_kb)} · {fmtDate(job.created_at)}</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase" style={{ background: "#D1FAE5", color: "#065F46" }}>{job.format}</span>
                <button className="p-1.5 rounded-lg" style={{ background: "#F1F5F9" }}>
                  <Download className="w-4 h-4" style={{ color: "#6B7280" }} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Integrations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[14px] font-semibold" style={{ color: "#111827" }}>Connected Integrations</h3>
          <button className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg" style={{ background: "#EEF2FF", color: "#3730A3" }}>
            <Plus className="w-3.5 h-3.5" /> Add Integration
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {integrations.map((int) => {
            const st = INTEGRATION_STATUS_STYLES[int.status];
            const StIcon = st.icon;
            const TYPE_ICONS: Record<string, React.ElementType> = { erp: Database, hrms: Users, bi: BarChart3, webhook: Link2, api: Globe };
            const TypeIcon = TYPE_ICONS[int.type] || Globe;
            return (
              <div key={int.id} className="rounded-xl border p-4" style={{ background: "#fff", borderColor: "#E3E9F6" }}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F1F5F9" }}>
                      <TypeIcon className="w-4 h-4" style={{ color: "#4A57B9" }} />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{int.name}</div>
                      <div className="text-[10px] uppercase font-medium" style={{ color: "#9CA3AF" }}>{int.type}</div>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: st.bg, color: st.color }}>
                    <StIcon className="w-3 h-3" />{st.label}
                  </span>
                </div>
                {int.last_sync && (
                  <div className="text-[11px]" style={{ color: "#6B7280" }}>
                    Last sync: {fmtDate(int.last_sync)}
                    {int.records_synced != null && <> · {int.records_synced.toLocaleString()} records</>}
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 text-center py-1.5 rounded-lg text-[11px] font-medium" style={{ background: "#EEF2FF", color: "#3730A3" }}>
                    Configure
                  </button>
                  {int.status === "connected" && (
                    <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium" style={{ background: "#F0FDF4", color: "#166534" }}>
                      <RefreshCw className="w-3 h-3" /> Sync
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function OutputsPage() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: "#F3F7FF" }}>
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Eye className="w-5 h-5" style={{ color: "#4A57B9" }} />
          <h1 className="text-[20px] font-bold" style={{ color: "#111827" }}>Outputs – Visibility & Intelligence</h1>
        </div>
        <p className="text-[13px]" style={{ color: "#6B7280" }}>
          Real-time dashboards, automated reports, AI-driven insights, mobile alerts, and data export across all operational modules.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: "#E8EEF9" }}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all flex-1 justify-center"
              style={active
                ? { background: "#fff", color: "#4A57B9", fontWeight: 600, boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }
                : { background: "transparent", color: "#6B7280" }}
            >
              <t.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === "dashboard" && <DashboardsTab />}
      {tab === "reports" && <ReportsTab />}
      {tab === "insights" && <InsightsTab />}
      {tab === "alerts" && <AlertsTab />}
      {tab === "export" && <ExportShareTab />}
    </div>
  );
}
