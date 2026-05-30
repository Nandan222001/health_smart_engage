import { useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FilePlus2,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Briefcase,
  ShieldAlert,
  BrainCircuit,
  BarChart3,
  Zap,
  TrendingUp,
  Target,
  Activity,
  type LucideIcon,
} from "lucide-react";
import {
  useListReportsQuery,
  useGenerateReportMutation,
  ReportType,
  ReportFormat,
  Report
} from "@/features/outputs/api/outputsApi";

type ManagementReportId = "executive" | "safety" | "ai" | "performance";

interface ManagementReportCategory {
  id: ManagementReportId;
  title: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  description: string;
  sections: string[];
  reportType: ReportType;
}

const MANAGEMENT_REPORTS: ManagementReportCategory[] = [
  {
    id: "executive",
    title: "Executive Summary",
    icon: Briefcase,
    color: "#4A57B9",
    bg: "#EEF2FF",
    reportType: "management",
    description: "High-level board-ready briefing covering safety trends, compliance posture, and key risks.",
    sections: ["Safety performance", "Compliance status", "Top risk areas", "Executive briefing"],
  },
  {
    id: "safety",
    title: "Monthly Safety Reports",
    icon: ShieldCheck,
    color: "#059669",
    bg: "#D1FAE5",
    reportType: "incident",
    description: "Detailed analysis of incidents, near-misses, and safety performance across all sites.",
    sections: ["Incident trends", "Near-miss analysis", "Site performance", "Severity breakdown"],
  },
  {
    id: "ai",
    title: "AI Intelligence Reports",
    icon: BrainCircuit,
    color: "#8B5CF6",
    bg: "#F5F3FF",
    reportType: "ai_intelligence",
    description: "Predictive risk modelling and AI-driven insights into potential safety blindspots.",
    sections: ["Risk predictions", "Anomaly detection", "Safety recommendations", "Pattern analysis"],
  },
  {
    id: "performance",
    title: "Performance Dashboards",
    icon: BarChart3,
    color: "#D97706",
    bg: "#FEF3C7",
    reportType: "kpi",
    description: "Visual KPI report including department rankings and safety score trends.",
    sections: ["KPI tracking", "Dept ranking", "Safety score trend", "Target achievement"],
  },
];

const FORMAT_STYLES: Record<ReportFormat, { label: string; bg: string; color: string }> = {
  pdf: { label: "PDF", bg: "#FEE2E2", color: "#DC2626" },
  excel: { label: "Excel", bg: "#D1FAE5", color: "#059669" },
  csv: { label: "CSV", bg: "#E0F2FE", color: "#0284C7" },
};

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  ready: { label: "Ready", bg: "#D1FAE5", color: "#059669" },
  generating: { label: "Generating", bg: "#FEF3C7", color: "#D97706" },
  failed: { label: "Failed", bg: "#FEE2E2", color: "#DC2626" },
  scheduled: { label: "Scheduled", bg: "#E0E7FF", color: "#4A57B9" },
};

function formatDate(value: string) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
  } catch {
    return value;
  }
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>
      {children}
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "#E3E9F6" }}>
      <div className="text-[24px] font-black leading-none" style={{ color }}>{value}</div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: "#6B7280" }}>{label}</div>
    </div>
  );
}

export function ManagementReportsPage() {
  const [selectedId, setSelectedId] = useState<ManagementReportId>("executive");
  const [format, setFormat] = useState<ReportFormat>("pdf");
  const [periodStart, setPeriodStart] = useState("2026-05-01");
  const [periodEnd, setPeriodEnd] = useState("2026-05-31");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const selected = MANAGEMENT_REPORTS.find((item) => item.id === selectedId) ?? MANAGEMENT_REPORTS[0];
  
  const { data: reports = [], isLoading: reportsLoading } = useListReportsQuery();
  const [generateReport, { isLoading: generating }] = useGenerateReportMutation();

  const managementReports = useMemo(() => reports.filter((report) => 
    ["management", "incident", "ai_intelligence", "kpi"].includes(report.type)
  ), [reports]);

  const filteredReports = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return managementReports.filter((report) => (
      !normalizedQuery ||
      report.title.toLowerCase().includes(normalizedQuery) ||
      report.generated_by.toLowerCase().includes(normalizedQuery)
    ));
  }, [query, managementReports]);

  // Mock stats for the dashboard tiles
  const selectedStats = useMemo(() => {
    if (selected.id === "executive") {
      return [
        { label: "Safety Score", value: "92%", color: "#059669" },
        { label: "Compliance Avg", value: "88%", color: "#4A57B9" },
        { label: "Risk Level", value: "Medium", color: "#D97706" },
        { label: "Audit Pass", value: "94%", color: "#7C3AED" },
      ];
    }
    if (selected.id === "safety") {
      return [
        { label: "Incidents YTD", value: "14", color: "#DC2626" },
        { label: "Near Misses", value: "28", color: "#F59E0B" },
        { label: "Severity Rate", value: "2.1", color: "#7C3AED" },
        { label: "Open Actions", value: "7", color: "#4A57B9" },
      ];
    }
    if (selected.id === "ai") {
      return [
        { label: "Risk Prediction", value: "High", color: "#DC2626" },
        { label: "Confidence", value: "91%", color: "#059669" },
        { label: "Anomalies", value: "3", color: "#D97706" },
        { label: "Insights Today", value: "12", color: "#4A57B9" },
      ];
    }
    return [
      { label: "Target Achieved", value: "85%", color: "#7C3AED" },
      { label: "Dept Ranking", value: "1st", color: "#059669" },
      { label: "KPIs Tracked", value: "24", color: "#D97706" },
      { label: "Trend Score", value: "+3.2", color: "#4A57B9" },
    ];
  }, [selected.id]);

  async function handleGenerate() {
    setResult(null);
    try {
      await generateReport({
        type: selected.reportType,
        format,
        period_start: periodStart,
        period_end: periodEnd,
      }).unwrap();
      setResult({ ok: true, message: `${selected.title} generated successfully.` });
    } catch {
      setResult({ ok: false, message: "Failed to generate report. Please try again." });
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>
      <div style={{ background: "linear-gradient(135deg, #0B3D91 0%, #1E3A8A 48%, #1D4ED8 100%)" }}>
        <div className="px-8 pt-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.48)" }}>
                Management Intelligence
              </p>
              <div className="flex items-center gap-3">
                <Briefcase className="h-6 w-6" style={{ color: "#67E8F9" }} />
                <h1 className="text-[26px] font-black text-white">Management Reports</h1>
              </div>
              <p className="mt-1 text-[13px]" style={{ color: "rgba(255,255,255,0.66)" }}>
                Generate board-level safety intelligence and performance insights.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold disabled:opacity-60 shadow-lg"
              style={{ background: "#FFFFFF", color: "#1E3A8A" }}
            >
              <Zap className={`h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
              {generating ? "Generating..." : "Generate Selected Report"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 divide-x divide-y border-t sm:grid-cols-4" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
          {[
            { label: "Executive Score", value: "92%", icon: Target, color: "#A7F3D0" },
            { label: "Total Incidents", value: "14", icon: ShieldAlert, color: "#FCA5A5" },
            { label: "AI Insights", value: "124", icon: BrainCircuit, color: "#C7D2FE" },
            { label: "KPI Performance", value: "High", icon: Activity, color: "#FDE68A" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="p-4 text-center">
              <Icon className="mx-auto mb-2 h-4 w-4" style={{ color }} />
              <div className="text-[24px] font-black leading-none text-white">{value}</div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.58)" }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6 p-6">
        <div>
          <SectionLabel>Admin can generate</SectionLabel>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            {MANAGEMENT_REPORTS.map((report) => {
              const Icon = report.icon;
              const active = selected.id === report.id;
              return (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => setSelectedId(report.id)}
                  className="rounded-2xl border bg-white p-4 text-left transition-all"
                  style={{ borderColor: active ? report.color : "#E3E9F6", boxShadow: active ? `0 8px 24px ${report.color}24` : "none" }}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: report.bg }}>
                      <Icon className="h-5 w-5" style={{ color: report.color }} />
                    </div>
                    {active && <CheckCircle2 className="h-4 w-4" style={{ color: report.color }} />}
                  </div>
                  <div className="text-[14px] font-bold" style={{ color: "#111827" }}>{report.title}</div>
                  <p className="mt-1 text-[11px] leading-5" style={{ color: "#6B7280" }}>{report.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5 xl:col-span-2" style={{ borderColor: "#E3E9F6" }}>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <selected.icon className="h-5 w-5" style={{ color: selected.color }} />
                  <h2 className="text-[18px] font-black" style={{ color: "#111827" }}>{selected.title}</h2>
                </div>
                <p className="mt-2 text-[13px]" style={{ color: "#6B7280" }}>{selected.description}</p>
              </div>
              <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: selected.bg, color: selected.color }}>
                {selected.sections.length} sections
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {selectedStats.map((item) => <StatTile key={item.label} {...item} />)}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {selected.sections.map((item) => (
                <div key={item} className="rounded-xl border px-3 py-2 text-[12px] font-semibold" style={{ borderColor: "#E3E9F6", color: "#374151" }}>
                  <ShieldCheck className="mr-2 inline h-3.5 w-3.5" style={{ color: selected.color }} />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "#E3E9F6" }}>
            <SectionLabel>Generate report</SectionLabel>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold" style={{ color: "#374151" }}>Output Format</label>
                <select value={format} onChange={(event) => setFormat(event.target.value as ReportFormat)} className="h-10 w-full rounded-xl border bg-white px-3 text-[13px] outline-none" style={{ borderColor: "#E3E9F6", color: "#111827" }}>
                  <option value="pdf">PDF Report</option>
                  <option value="excel">Excel Datasheet</option>
                  <option value="csv">Raw CSV</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold" style={{ color: "#374151" }}>Period Start</label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4" style={{ color: "#9CA3AF" }} />
                  <input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} className="h-10 w-full rounded-xl border pl-9 pr-3 text-[13px] outline-none" style={{ borderColor: "#E3E9F6", color: "#111827" }} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold" style={{ color: "#374151" }}>Period End</label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4" style={{ color: "#9CA3AF" }} />
                  <input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} className="h-10 w-full rounded-xl border pl-9 pr-3 text-[13px] outline-none" style={{ borderColor: "#E3E9F6", color: "#111827" }} />
                </div>
              </div>
              {result && (
                <div className="rounded-xl px-3 py-2 text-[12px] font-semibold" style={{ background: result.ok ? "#D1FAE5" : "#FEE2E2", color: result.ok ? "#065F46" : "#991B1B" }}>
                  {result.message}
                </div>
              )}
              <button type="button" onClick={handleGenerate} disabled={generating} className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold text-white disabled:opacity-60 shadow-lg" style={{ background: `linear-gradient(135deg, ${selected.color}, #111827)` }}>
                <Zap className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
                {generating ? "Generating..." : `Generate ${selected.title}`}
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <SectionLabel>Generated management reports</SectionLabel>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[260px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4" style={{ color: "#9CA3AF" }} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reports" className="h-10 w-full rounded-xl border pl-9 pr-3 text-[13px] outline-none" style={{ borderColor: "#E3E9F6", color: "#111827" }} />
              </div>
              <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold" style={{ background: "#FFFFFF", color: "#6B7280", border: "1px solid #E3E9F6" }}>
                <Filter className="h-3.5 w-3.5" />
                {filteredReports.length} shown
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: "#E3E9F6" }}>
            {reportsLoading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="h-6 w-6 animate-spin" style={{ color: "#D1D5DB" }} />
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <Briefcase className="mb-3 h-10 w-10" style={{ color: "#E5E7EB" }} />
                <p className="mb-1 text-sm font-semibold" style={{ color: "#374151" }}>No management reports generated</p>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>Choose a report type and generate the first report.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-sm">
                  <thead>
                    <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                      {["Report", "Format", "Period", "Generated By", "Date", "Status", "Actions"].map((header) => (
                        <th key={header} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => {
                      const formatStyle = FORMAT_STYLES[report.format] ?? FORMAT_STYLES.pdf;
                      const statusStyle = STATUS_STYLES[report.status] ?? STATUS_STYLES.ready;
                      return (
                        <tr key={report.id} className="border-t transition-colors hover:bg-blue-50/30" style={{ borderColor: "#F3F4F6" }}>
                          <td className="px-4 py-3 text-[12px] font-bold" style={{ color: "#111827" }}>{report.title}</td>
                          <td className="px-4 py-3"><span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: formatStyle.bg, color: formatStyle.color }}>{formatStyle.label}</span></td>
                          <td className="px-4 py-3 text-[12px]" style={{ color: "#6B7280" }}>{report.period}</td>
                          <td className="px-4 py-3 text-[12px]" style={{ color: "#6B7280" }}>{report.generated_by}</td>
                          <td className="px-4 py-3 text-[12px]" style={{ color: "#9CA3AF" }}>{formatDate(report.generated_at || "")}</td>
                          <td className="px-4 py-3"><span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: statusStyle.bg, color: statusStyle.color }}>{statusStyle.label}</span></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-blue-50" title="Download report">
                                <Download className="h-3.5 w-3.5" style={{ color: "#4A57B9" }} />
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
        </div>
      </div>
    </div>
  );
}
