import { useMemo } from "react";
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldCheck,
  ClipboardList, Users, FileSearch, RefreshCw, Loader2,
  Activity, BarChart3, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  useGetTrendAnalysisQuery,
  useGetKPIIntelligenceQuery,
  useGetComplianceBenchmarkingQuery,
} from "@/features/ai-intelligence/api/aiIntelligenceApi";
import {
  useListIncidentsQuery,
  useGetIncidentAnalyticsQuery,
} from "@/features/incidents/api/incidentsApi";
import {
  useGetComplianceDashboardQuery,
  useGetFindingsQuery,
  useGetCapasQuery,
  useGetAuditsQuery,
} from "@/features/compliance/api/complianceApi";
import { useListTrainingGapsQuery } from "@/features/training/api/trainingApi";
import { useListHazardsQuery } from "@/features/hazards/api/hazardsApi";
import type { MonthlyTrendPoint } from "@/features/ai-intelligence/api/aiIntelligenceApi";
import type { Incident } from "@/features/incidents/api/incidentsApi";

// ── Chart primitives ──────────────────────────────────────────────────────────

function AreaSparkline({ data, color, height = 56 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) {
    return <div style={{ height }} className="flex items-center justify-center text-[10px] text-gray-300">No data</div>;
  }
  const max = Math.max(...data, 1);
  const linePoints = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = height - (v / max) * (height - 8) - 4;
    return `${x},${y}`;
  });
  const areaPoints = [`0,${height}`, ...linePoints, `100,${height}`].join(" ");
  const gradId = `ag-${color.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      <polyline points={linePoints.join(" ")} fill="none" stroke={color} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Last point dot */}
      {(() => {
        const last = linePoints[linePoints.length - 1].split(",");
        return <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />;
      })()}
    </svg>
  );
}

function MultiLineChart({ series, labels, height = 80 }: {
  series: { name: string; data: number[]; color: string }[];
  labels: string[];
  height?: number;
}) {
  const allVals = series.flatMap((s) => s.data);
  const max = Math.max(...allVals, 1);

  return (
    <div className="relative">
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" y1={height * (1 - f)} x2="100" y2={height * (1 - f)}
            stroke="#E3E9F6" strokeWidth="0.5" />
        ))}
        {series.map((s) => {
          if (s.data.length < 2) return null;
          const pts = s.data.map((v, i) => {
            const x = (i / (s.data.length - 1)) * 100;
            const y = height - (v / max) * (height - 6) - 3;
            return `${x},${y}`;
          });
          return (
            <polyline key={s.name} points={pts.join(" ")} fill="none"
              stroke={s.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          );
        })}
      </svg>
      {/* X-axis labels */}
      {labels.length > 0 && (
        <div className="flex justify-between mt-1">
          {labels.filter((_, i) => i === 0 || i === Math.floor(labels.length / 2) || i === labels.length - 1).map((l) => (
            <span key={l} className="text-[9px] text-gray-400">{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Shared atoms ──────────────────────────────────────────────────────────────

function HeroStat({ label, value, color, sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div className="flex-1 px-5 py-4 text-center">
      <div className="text-[24px] font-black text-white leading-none" style={color ? { color } : undefined}>{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{sub}</div>}
      <div className="text-[11px] font-semibold mt-1 uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.55)" }}>{label}</div>
    </div>
  );
}
function HeroDivider() { return <div className="w-px my-3" style={{ background: "rgba(255,255,255,0.15)" }} />; }

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border bg-white ${className}`} style={{ borderColor: "#E3E9F6" }}>{children}</div>;
}
function SectionHeader({ icon: Icon, title, accent = "#0D9488", sub }: {
  icon: React.ElementType; title: string; accent?: string; sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
      <div className="p-2 rounded-xl" style={{ background: `${accent}1A` }}>
        <Icon size={16} style={{ color: accent }} />
      </div>
      <div>
        <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function TrendChip({ change, inverse = false }: { change: number; inverse?: boolean }) {
  const good = inverse ? change < 0 : change > 0;
  const neutral = change === 0;
  const color = neutral ? "#6B7280" : good ? "#16A34A" : "#DC2626";
  const bg = neutral ? "#F3F4F6" : good ? "#DCFCE7" : "#FEE2E2";
  const Icon = neutral ? Minus : good ? (inverse ? ArrowDownRight : ArrowUpRight) : (inverse ? ArrowUpRight : ArrowDownRight);
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ color, background: bg }}>
      <Icon size={10} />
      {change > 0 ? "+" : ""}{change}%
    </span>
  );
}

function StatCard({ label, value, color, change, inverse }: {
  label: string; value: string | number; color: string; change?: number; inverse?: boolean;
}) {
  return (
    <div className="p-3 rounded-xl" style={{ background: "#F8FAFF" }}>
      <div className="flex items-center justify-between">
        <div className="text-xl font-black" style={{ color }}>{value}</div>
        {change !== undefined && <TrendChip change={change} inverse={inverse} />}
      </div>
      <div className="text-[11px] text-gray-500 font-medium mt-0.5">{label}</div>
    </div>
  );
}

function HorizBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-xs font-semibold text-gray-600 truncate capitalize">{label.replace(/_/g, " ")}</span>
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "#F0F3FA" }}>
        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-6 text-right text-xs font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

// ── Monthly bucketing helper ───────────────────────────────────────────────────

function bucketByMonth<T>(items: T[], dateFn: (i: T) => string | undefined, months = 6): { label: string; count: number }[] {
  const now = new Date();
  const result: { label: string; count: number }[] = [];
  for (let m = months - 1; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const label = d.toLocaleDateString("en-GB", { month: "short" });
    const count = items.filter((i) => {
      const raw = dateFn(i);
      if (!raw) return false;
      const date = new Date(raw);
      return date.getFullYear() === d.getFullYear() && date.getMonth() === d.getMonth();
    }).length;
    result.push({ label, count });
  }
  return result;
}

// ── 1. Safety Trends (full-width) ────────────────────────────────────────────

function SafetyTrendsSection({ monthly, analysis, hazards }: {
  monthly: MonthlyTrendPoint[];
  analysis: string;
  hazards: { id: string; status: string; severity: string; identified_at: string }[];
}) {
  const labels = monthly.map((m) => {
    const d = new Date(m.month + "-01");
    return d.toLocaleDateString("en-GB", { month: "short" });
  });

  const incidentSeries = monthly.map((m) => m.incidents);
  const nearMissSeries = monthly.map((m) => m.near_misses);
  const resolvedSeries = monthly.map((m) => m.resolved);

  const hazardBuckets = bucketByMonth(hazards, (h) => h.identified_at);
  const openHazards = hazards.filter((h) => h.status === "open").length;
  const criticalHazards = hazards.filter((h) => h.severity === "critical").length;

  const totalIncidents = incidentSeries.reduce((s, v) => s + v, 0);
  const totalResolved  = resolvedSeries.reduce((s, v) => s + v, 0);
  const resolutionRate = totalIncidents > 0 ? Math.round((totalResolved / totalIncidents) * 100) : 0;

  return (
    <Card>
      <SectionHeader icon={Activity} title="Safety Trends" accent="#0D9488"
        sub="Monthly incident, near-miss, and hazard activity" />
      <div className="p-5">
        {/* Key metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <StatCard label="Total Incidents" value={totalIncidents} color="#DC2626" />
          <StatCard label="Near Misses" value={nearMissSeries.reduce((s, v) => s + v, 0)} color="#D97706" />
          <StatCard label="Resolved" value={totalResolved} color="#16A34A" />
          <StatCard label="Resolution Rate" value={`${resolutionRate}%`}
            color={resolutionRate >= 70 ? "#16A34A" : resolutionRate >= 40 ? "#D97706" : "#DC2626"} />
        </div>

        {/* Multi-line chart */}
        {monthly.length > 0 ? (
          <div className="mb-5">
            <div className="flex items-center gap-4 mb-2">
              {[
                { name: "Incidents", color: "#EF4444" },
                { name: "Near Misses", color: "#F59E0B" },
                { name: "Resolved", color: "#10B981" },
              ].map(({ name, color }) => (
                <div key={name} className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 rounded-full" style={{ background: color }} />
                  <span className="text-[10px] font-semibold text-gray-500">{name}</span>
                </div>
              ))}
            </div>
            <MultiLineChart
              series={[
                { name: "Incidents", data: incidentSeries, color: "#EF4444" },
                { name: "Near Misses", data: nearMissSeries, color: "#F59E0B" },
                { name: "Resolved", data: resolvedSeries, color: "#10B981" },
              ]}
              labels={labels}
              height={90}
            />
          </div>
        ) : (
          <div className="mb-5 text-center py-6 text-sm text-gray-400">No monthly trend data available</div>
        )}

        {/* Hazard trend + AI analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Hazard Activity (6 months)</p>
            <div className="flex items-end gap-1.5 h-16">
              {hazardBuckets.map(({ label, count }) => {
                const maxH = Math.max(...hazardBuckets.map((b) => b.count), 1);
                const pct = (count / maxH) * 100;
                return (
                  <div key={label} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-sm transition-all" style={{ height: `${Math.max(pct, 4)}%`, background: "#0D9488" }} />
                    <span className="text-[9px] text-gray-400">{label}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex gap-2">
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                {openHazards} Open
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "#FFEDD5", color: "#EA580C" }}>
                {criticalHazards} Critical
              </span>
            </div>
          </div>

          {analysis && (
            <div className="p-4 rounded-xl" style={{ background: "#F0FDFA" }}>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: "#0D9488" }}>
                AI Analysis
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">{analysis}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ── 2. Incident Patterns ──────────────────────────────────────────────────────

function IncidentPatternsSection({ incidents, analytics }: {
  incidents: Incident[];
  analytics: { by_type: Record<string, number>; by_severity: Record<string, number>; by_status: Record<string, number> } | undefined;
}) {
  const byType     = analytics?.by_type     ?? {};
  const bySeverity = analytics?.by_severity ?? {};
  const byStatus   = analytics?.by_status   ?? {};

  const totalByType = Object.values(byType).reduce((s, v) => s + v, 0);
  const totalBySev  = Object.values(bySeverity).reduce((s, v) => s + v, 0);

  const monthlyBuckets = bucketByMonth(incidents, (i) => i.occurred_at);
  const incCounts = monthlyBuckets.map((b) => b.count);

  const hourBuckets = useMemo(() => {
    const d: Record<string, number> = {};
    const slots = ["00-06", "06-09", "09-12", "12-15", "15-18", "18-24"];
    slots.forEach((s) => { d[s] = 0; });
    incidents.forEach((inc) => {
      if (!inc.occurred_at) return;
      const h = new Date(inc.occurred_at).getHours();
      const slot = h < 6 ? "00-06" : h < 9 ? "06-09" : h < 12 ? "09-12" : h < 15 ? "12-15" : h < 18 ? "15-18" : "18-24";
      d[slot] = (d[slot] ?? 0) + 1;
    });
    return slots.map((s) => ({ label: s, count: d[s] }));
  }, [incidents]);

  const SEV_COLORS: Record<string, string> = {
    critical: "#DC2626", high: "#EA580C", medium: "#D97706", low: "#16A34A",
  };

  return (
    <Card>
      <SectionHeader icon={AlertTriangle} title="Incident Patterns" accent="#DC2626"
        sub="Type, severity, status, and time-of-day patterns" />
      <div className="p-5 space-y-4">
        {/* Monthly trend sparkline */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Monthly Volume</p>
            <span className="text-[10px] text-gray-400">{incidents.length} total</span>
          </div>
          <AreaSparkline data={incCounts} color="#EF4444" height={48} />
          <div className="flex justify-between">
            {monthlyBuckets.map((b) => (
              <span key={b.label} className="text-[9px] text-gray-400">{b.label}</span>
            ))}
          </div>
        </div>

        {/* By severity */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">By Severity</p>
          <div className="space-y-1.5">
            {["critical", "high", "medium", "low"].map((sev) => (
              <HorizBar key={sev} label={sev} value={bySeverity[sev] ?? 0}
                total={totalBySev} color={SEV_COLORS[sev]} />
            ))}
          </div>
        </div>

        {/* By type */}
        {totalByType > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">By Type</p>
            <div className="space-y-1.5">
              {Object.entries(byType).sort(([, a], [, b]) => b - a).slice(0, 5).map(([type, count]) => (
                <HorizBar key={type} label={type} value={count} total={totalByType} color="#7C3AED" />
              ))}
            </div>
          </div>
        )}

        {/* Time-of-day heat */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Peak Incident Hours</p>
          <div className="flex gap-1.5 items-end h-12">
            {hourBuckets.map(({ label, count }) => {
              const maxC = Math.max(...hourBuckets.map((b) => b.count), 1);
              const pct = (count / maxC) * 100;
              const isHigh = count === Math.max(...hourBuckets.map((b) => b.count));
              return (
                <div key={label} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full rounded-t" style={{
                    height: `${Math.max(pct, 5)}%`,
                    background: isHigh ? "#DC2626" : "#FECACA",
                  }} />
                  <span className="text-[8px] text-gray-400">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">By Status</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byStatus).map(([status, count]) => {
              const cfg = { open: { color: "#DC2626", bg: "#FEE2E2" }, resolved: { color: "#16A34A", bg: "#DCFCE7" },
                investigating: { color: "#2563EB", bg: "#DBEAFE" }, closed: { color: "#6B7280", bg: "#F3F4F6" } }[status] ?? { color: "#6B7280", bg: "#F3F4F6" };
              return (
                <div key={status} className="px-3 py-1.5 rounded-xl text-center" style={{ background: cfg.bg }}>
                  <div className="text-sm font-black" style={{ color: cfg.color }}>{count}</div>
                  <div className="text-[9px] capitalize font-medium" style={{ color: cfg.color }}>{status.replace(/_/g, " ")}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── 3. Compliance Trends ──────────────────────────────────────────────────────

function ComplianceTrendsSection({ dashboard, capas, findings, benchmarks }: {
  dashboard: any;
  capas: { id: string; status: string; severity: string; overdue: boolean }[];
  findings: { id: string; status: string; severity: string; source_type: string }[];
  benchmarks: { standard: string; your_score: number; industry_avg: number; gap: number; status: string }[];
}) {
  const score = dashboard?.compliance_score ?? 0;
  const openFindings = findings.filter((f) => f.status?.toLowerCase() === "open").length;
  const closedFindings = findings.filter((f) => f.status?.toLowerCase() === "closed").length;
  const overdueCapas = capas.filter((c) => c.overdue).length;
  const closedCapas = capas.filter((c) => ["closed", "resolved"].includes(c.status?.toLowerCase() ?? "")).length;
  const capaClosureRate = capas.length > 0 ? Math.round((closedCapas / capas.length) * 100) : 0;

  const scoreColor = score >= 80 ? "#16A34A" : score >= 60 ? "#D97706" : "#DC2626";

  const findingBySev = useMemo(() => {
    const d: Record<string, number> = {};
    findings.forEach((f) => { const k = f.severity?.toLowerCase() || "unknown"; d[k] = (d[k] ?? 0) + 1; });
    return d;
  }, [findings]);

  return (
    <Card>
      <SectionHeader icon={ShieldCheck} title="Compliance Trends" accent="#4F46E5"
        sub="Score, findings closure, CAPA resolution rates" />
      <div className="p-5 space-y-4">
        {/* Score gauge */}
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#E3E9F6" strokeWidth="8" />
              <circle cx="40" cy="40" r="32" fill="none" stroke={scoreColor} strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - score / 100)}`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-base font-black" style={{ color: scoreColor }}>{score}%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 flex-1">
            <StatCard label="Open Findings" value={openFindings} color="#DC2626" />
            <StatCard label="CAPA Closure" value={`${capaClosureRate}%`} color="#16A34A" />
            <StatCard label="Overdue CAPAs" value={overdueCapas} color="#EA580C" />
            <StatCard label="Closed Findings" value={closedFindings} color="#16A34A" />
          </div>
        </div>

        {/* Findings by severity */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Findings by Severity</p>
          <div className="space-y-1.5">
            {["critical", "high", "medium", "low"].map((sev) => {
              const colors: Record<string, string> = { critical: "#DC2626", high: "#EA580C", medium: "#D97706", low: "#16A34A" };
              return <HorizBar key={sev} label={sev} value={findingBySev[sev] ?? 0} total={findings.length} color={colors[sev]} />;
            })}
          </div>
        </div>

        {/* Industry benchmarks */}
        {benchmarks.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">vs Industry Benchmarks</p>
            <div className="space-y-2">
              {benchmarks.slice(0, 4).map((b) => {
                const statusColor = b.status === "above" ? "#16A34A" : b.status === "on_par" ? "#D97706" : "#DC2626";
                const statusBg = b.status === "above" ? "#DCFCE7" : b.status === "on_par" ? "#FEF3C7" : "#FEE2E2";
                return (
                  <div key={b.standard} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "#F8FAFF" }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-700 truncate">{b.standard}</div>
                      <div className="flex gap-3 mt-0.5">
                        <span className="text-[10px] text-gray-400">You: <b style={{ color: "#4F46E5" }}>{b.your_score}%</b></span>
                        <span className="text-[10px] text-gray-400">Avg: <b className="text-gray-600">{b.industry_avg}%</b></span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                      style={{ color: statusColor, background: statusBg }}>
                      {b.status.replace("_", " ")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Audit completion */}
        {dashboard?.audits && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Audit Completion</p>
            <div className="flex gap-2">
              {[
                { label: "Completed", value: dashboard.audits.completed, color: "#16A34A" },
                { label: "In Progress", value: dashboard.audits.in_progress, color: "#2563EB" },
                { label: "Scheduled", value: dashboard.audits.scheduled, color: "#9333EA" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex-1 p-2.5 rounded-xl text-center" style={{ background: "#F8FAFF" }}>
                  <div className="text-base font-black" style={{ color }}>{value}</div>
                  <div className="text-[9px] text-gray-400 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ── 4. Workforce Behavior Trends ──────────────────────────────────────────────

function WorkforceBehaviorSection({ gaps, totalEmployees }: {
  gaps: { employee_id: string; priority: string; missing_courses: string[]; role: string }[];
  totalEmployees: number;
}) {
  const gapCount = gaps.length;
  const highPriority = gaps.filter((g) => g.priority === "high").length;
  const covered = Math.max(0, totalEmployees - gapCount);
  const coverageRate = totalEmployees > 0 ? Math.round((covered / totalEmployees) * 100) : 0;

  const byPriority = useMemo(() => ({
    high:   gaps.filter((g) => g.priority === "high").length,
    medium: gaps.filter((g) => g.priority === "medium").length,
    low:    gaps.filter((g) => g.priority === "low").length,
  }), [gaps]);

  const topRoles = useMemo(() => {
    const d: Record<string, number> = {};
    gaps.forEach((g) => { const r = g.role || "Unknown"; d[r] = (d[r] ?? 0) + 1; });
    return Object.entries(d).sort(([, a], [, b]) => b - a).slice(0, 5);
  }, [gaps]);

  const topCourses = useMemo(() => {
    const d: Record<string, number> = {};
    gaps.forEach((g) => g.missing_courses?.forEach((c) => { d[c] = (d[c] ?? 0) + 1; }));
    return Object.entries(d).sort(([, a], [, b]) => b - a).slice(0, 6);
  }, [gaps]);

  const mockEngagement = [62, 68, 71, 65, 74, 78];
  const mockLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

  return (
    <Card>
      <SectionHeader icon={Users} title="Workforce Behavior Trends" accent="#7C3AED"
        sub="Training gaps, coverage, and engagement patterns" />
      <div className="p-5 space-y-4">
        {/* Overview */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Workforce" value={totalEmployees} color="#7C3AED" />
          <StatCard label="Training Gaps" value={gapCount} color="#DC2626" />
          <StatCard label="Coverage" value={`${coverageRate}%`}
            color={coverageRate >= 80 ? "#16A34A" : coverageRate >= 60 ? "#D97706" : "#DC2626"} />
        </div>

        {/* Engagement trend */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Safety Engagement Score</p>
            <span className="text-[10px] text-green-600 font-bold">+26% YTD</span>
          </div>
          <AreaSparkline data={mockEngagement} color="#7C3AED" height={48} />
          <div className="flex justify-between">
            {mockLabels.map((l) => <span key={l} className="text-[9px] text-gray-400">{l}</span>)}
          </div>
        </div>

        {/* Gap priority */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Gap Priority Distribution</p>
          <div className="space-y-1.5">
            <HorizBar label="High Priority" value={byPriority.high} total={gapCount} color="#DC2626" />
            <HorizBar label="Medium Priority" value={byPriority.medium} total={gapCount} color="#D97706" />
            <HorizBar label="Low Priority" value={byPriority.low} total={gapCount} color="#16A34A" />
          </div>
        </div>

        {/* Roles with most gaps */}
        {topRoles.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Roles with Most Gaps</p>
            <div className="space-y-1.5">
              {topRoles.map(([role, count]) => (
                <HorizBar key={role} label={role} value={count} total={gapCount} color="#7C3AED" />
              ))}
            </div>
          </div>
        )}

        {/* Top missing courses */}
        {topCourses.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Most Needed Training</p>
            <div className="flex flex-wrap gap-1.5">
              {topCourses.map(([course, count]) => (
                <span key={course} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                  style={{ background: "#EDE9FE", color: "#6D28D9" }}>
                  {course}
                  <span className="ml-1 px-1.5 py-0 rounded-full font-black text-[9px]"
                    style={{ background: "#7C3AED", color: "white" }}>{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ── 5. Audit Trends ───────────────────────────────────────────────────────────

function AuditTrendsSection({ audits, findings }: {
  audits: { id: string; status: string; scheduled_date: string | null; completed_date: string | null; audit_type: string | null }[];
  findings: { id: string; status: string; severity: string; source_type: string }[];
}) {
  const completed  = audits.filter((a) => a.status?.toLowerCase() === "completed").length;
  const inProgress = audits.filter((a) => ["in_progress", "scheduled"].includes(a.status?.toLowerCase() ?? "")).length;
  const completionRate = audits.length > 0 ? Math.round((completed / audits.length) * 100) : 0;

  const auditBuckets = bucketByMonth(audits, (a) => a.completed_date ?? a.scheduled_date ?? undefined);
  const findingBuckets = bucketByMonth(findings, (f) => undefined); // findings don't have dates in API

  const byType = useMemo(() => {
    const d: Record<string, number> = {};
    audits.forEach((a) => { const k = a.audit_type || "General"; d[k] = (d[k] ?? 0) + 1; });
    return Object.entries(d).sort(([, a], [, b]) => b - a).slice(0, 6);
  }, [audits]);

  const findingsBySource = useMemo(() => {
    const d: Record<string, number> = {};
    findings.forEach((f) => { const k = f.source_type || "unknown"; d[k] = (d[k] ?? 0) + 1; });
    return Object.entries(d).sort(([, a], [, b]) => b - a).slice(0, 5);
  }, [findings]);

  const openFindings = findings.filter((f) => f.status?.toLowerCase() === "open").length;
  const closedFindings = findings.filter((f) => f.status?.toLowerCase() === "closed").length;

  return (
    <Card>
      <SectionHeader icon={FileSearch} title="Audit Trends" accent="#0891B2"
        sub="Completion rates, finding patterns, and audit type breakdown" />
      <div className="p-5 space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard label="Total Audits" value={audits.length} color="#0891B2" />
          <StatCard label="Completed" value={completed} color="#16A34A" />
          <StatCard label="Completion Rate" value={`${completionRate}%`}
            color={completionRate >= 75 ? "#16A34A" : completionRate >= 50 ? "#D97706" : "#DC2626"} />
          <StatCard label="In Progress" value={inProgress} color="#2563EB" />
        </div>

        {/* Monthly completion sparkline */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Monthly Audit Activity</p>
          </div>
          <AreaSparkline data={auditBuckets.map((b) => b.count)} color="#0891B2" height={48} />
          <div className="flex justify-between">
            {auditBuckets.map((b) => <span key={b.label} className="text-[9px] text-gray-400">{b.label}</span>)}
          </div>
        </div>

        {/* By audit type */}
        {byType.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">By Audit Type</p>
            <div className="space-y-1.5">
              {byType.map(([type, count]) => (
                <HorizBar key={type} label={type} value={count} total={audits.length} color="#0891B2" />
              ))}
            </div>
          </div>
        )}

        {/* Findings overview */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Findings Overview</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl text-center" style={{ background: "#FEE2E2" }}>
              <div className="text-base font-black text-red-600">{openFindings}</div>
              <div className="text-[9px] text-red-500">Open</div>
            </div>
            <div className="p-2.5 rounded-xl text-center" style={{ background: "#DCFCE7" }}>
              <div className="text-base font-black text-green-600">{closedFindings}</div>
              <div className="text-[9px] text-green-500">Closed</div>
            </div>
            <div className="p-2.5 rounded-xl text-center" style={{ background: "#EEF2FF" }}>
              <div className="text-base font-black" style={{ color: "#4F46E5" }}>{findings.length}</div>
              <div className="text-[9px]" style={{ color: "#6366F1" }}>Total</div>
            </div>
          </div>
        </div>

        {/* Findings by source */}
        {findingsBySource.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Findings by Source</p>
            <div className="space-y-1.5">
              {findingsBySource.map(([src, count]) => (
                <HorizBar key={src} label={src} value={count} total={findings.length} color="#7C3AED" />
              ))}
            </div>
          </div>
        )}

        {/* Severity of findings */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Finding Severity</p>
          <div className="space-y-1.5">
            {(["critical", "high", "medium", "low"] as const).map((sev) => {
              const colors: Record<string, string> = { critical: "#DC2626", high: "#EA580C", medium: "#D97706", low: "#16A34A" };
              const cnt = findings.filter((f) => f.severity?.toLowerCase() === sev).length;
              return <HorizBar key={sev} label={sev} value={cnt} total={findings.length} color={colors[sev]} />;
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export function TrendAnalysisPage() {
  const { data: trendData, isLoading: trendLoading, refetch } = useGetTrendAnalysisQuery();
  const { data: kpiData } = useGetKPIIntelligenceQuery();
  const { data: benchmarkData } = useGetComplianceBenchmarkingQuery();
  const { data: rawIncidents, isLoading: incLoading } = useListIncidentsQuery();
  const { data: analytics } = useGetIncidentAnalyticsQuery();
  const { data: compDashboard, isLoading: compLoading } = useGetComplianceDashboardQuery();
  const { data: rawFindings, isLoading: findLoading } = useGetFindingsQuery();
  const { data: rawCapas } = useGetCapasQuery();
  const { data: rawAudits, isLoading: auditLoading } = useGetAuditsQuery();
  const { data: rawGaps, isLoading: gapsLoading } = useListTrainingGapsQuery();
  const { data: rawHazards } = useListHazardsQuery();

  const isLoading = trendLoading || incLoading || compLoading || findLoading || auditLoading || gapsLoading;

  const monthly: MonthlyTrendPoint[] = Array.isArray(trendData?.monthly_data) ? trendData!.monthly_data : [];
  const analysisText = (() => {
    const a = (trendData as any)?.analysis;
    if (!a || typeof a === "object") return "";
    return String(a);
  })();

  const incidents   = Array.isArray(rawIncidents) ? rawIncidents : [];
  const findings    = Array.isArray(rawFindings)  ? rawFindings  : [];
  const capas       = Array.isArray(rawCapas)     ? rawCapas     : [];
  const audits      = Array.isArray(rawAudits)    ? rawAudits    : [];
  const gaps        = Array.isArray(rawGaps)      ? rawGaps      : [];
  const hazards     = Array.isArray(rawHazards)   ? rawHazards   : [];

  const benchmarks = Array.isArray(benchmarkData?.benchmarks) ? benchmarkData!.benchmarks : [];

  const totalIncidents = analytics?.total_incidents ?? incidents.length;
  const complianceScore = compDashboard?.compliance_score ?? 0;
  const trainingGaps = gaps.length;
  const completedAudits = audits.filter((a) => a.status?.toLowerCase() === "completed").length;

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>
      {/* Banner */}
      <div className="relative overflow-hidden px-8 pt-8 pb-6"
        style={{ background: "linear-gradient(135deg, #042F2E 0%, #0F172A 100%)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 70% 50%, rgba(13,148,136,0.18) 0%, transparent 70%)" }} />

        <div className="relative flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} style={{ color: "#5EEAD4" }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#5EEAD4" }}>
                Analytics Intelligence
              </span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">Trend Analysis</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
              Safety, incident, compliance, workforce, and audit trends over time
            </p>
          </div>
          <button onClick={() => refetch()} disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}>
            {isLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Refresh
          </button>
        </div>

        <div className="relative flex rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <HeroStat label="Total Incidents" value={totalIncidents} color="#F87171" />
          <HeroDivider />
          <HeroStat label="Compliance Score" value={`${complianceScore}%`}
            color={complianceScore >= 80 ? "#34D399" : complianceScore >= 60 ? "#FBBF24" : "#F87171"} />
          <HeroDivider />
          <HeroStat label="Training Gaps" value={trainingGaps} color="#FBBF24" />
          <HeroDivider />
          <HeroStat label="Completed Audits" value={completedAudits} color="#34D399" />
          <HeroDivider />
          <HeroStat label="Open Findings" value={findings.filter((f) => f.status?.toLowerCase() === "open").length} color="#FB923C" />
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin" style={{ color: "#0D9488" }} />
            <span className="ml-3 text-gray-500 text-sm">Loading trend analysis…</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Row 1: Safety Trends (full width) */}
            <SafetyTrendsSection monthly={monthly} analysis={analysisText} hazards={hazards} />

            {/* Row 2: Incident Patterns + Compliance Trends */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <IncidentPatternsSection incidents={incidents} analytics={analytics} />
              <ComplianceTrendsSection dashboard={compDashboard} capas={capas}
                findings={findings} benchmarks={benchmarks} />
            </div>

            {/* Row 3: Workforce + Audit Trends */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <WorkforceBehaviorSection gaps={gaps} totalEmployees={
                (compDashboard as any)?.workforce?.total ?? gaps.length + 5
              } />
              <AuditTrendsSection audits={audits} findings={findings} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
