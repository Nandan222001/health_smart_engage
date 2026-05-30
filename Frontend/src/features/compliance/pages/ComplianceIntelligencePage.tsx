import { useMemo, useState } from "react";
import {
  ShieldAlert, BarChart3, TrendingUp, Bell, RefreshCw, Loader2,
  AlertTriangle, CheckCircle2, Clock, AlertCircle, Search,
  ChevronDown, ChevronUp, Activity, FileWarning, Scale, Target,
} from "lucide-react";
import {
  useGetComplianceDashboardQuery,
  useGetFindingsQuery,
  useGetAuditsQuery,
  useGetCapasQuery,
  useGetRegulatoryRequirementsQuery,
} from "@/features/compliance/api/complianceApi";
import {
  useGetComplianceIntelligenceQuery,
  useGetComplianceBenchmarkingQuery,
} from "@/features/ai-intelligence/api/aiIntelligenceApi";
import type { FindingRecord, AuditRecord, CapaRecord, RegulatoryRequirement } from "@/features/compliance/api/complianceApi";
import type { ComplianceGap, ComplianceBenchmark } from "@/features/ai-intelligence/api/aiIntelligenceApi";

// ── Severity / status helpers ─────────────────────────────────────────────────

const SEV_CFG: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: "#DC2626", bg: "#FEE2E2", label: "Critical" },
  high:     { color: "#EA580C", bg: "#FFEDD5", label: "High" },
  medium:   { color: "#D97706", bg: "#FEF3C7", label: "Medium" },
  low:      { color: "#16A34A", bg: "#DCFCE7", label: "Low" },
};
function sevCfg(s: string) { return SEV_CFG[s?.toLowerCase()] ?? { color: "#6B7280", bg: "#F3F4F6", label: s || "Unknown" }; }

const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  open:        { color: "#DC2626", bg: "#FEE2E2" },
  closed:      { color: "#16A34A", bg: "#DCFCE7" },
  resolved:    { color: "#16A34A", bg: "#DCFCE7" },
  in_progress: { color: "#2563EB", bg: "#DBEAFE" },
  pending:     { color: "#D97706", bg: "#FEF3C7" },
  overdue:     { color: "#DC2626", bg: "#FEE2E2" },
  completed:   { color: "#16A34A", bg: "#DCFCE7" },
  scheduled:   { color: "#9333EA", bg: "#F3E8FF" },
};
function statusCfg(s: string) { return STATUS_CFG[s?.toLowerCase()] ?? { color: "#6B7280", bg: "#F3F4F6" }; }

// ── Shared UI atoms ───────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const cfg = sevCfg(severity);
  return (
    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize"
      style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
  );
}
function StatusBadge({ status }: { status: string }) {
  const cfg = statusCfg(status);
  return (
    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize"
      style={{ color: cfg.color, background: cfg.bg }}>{status.replace(/_/g, " ")}</span>
  );
}
function HeroStat({ label, value, color, sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div className="flex-1 px-6 py-4 text-center">
      <div className="text-[26px] font-black text-white leading-none" style={color ? { color } : undefined}>{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{sub}</div>}
      <div className="text-[11px] font-semibold mt-1 uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.55)" }}>{label}</div>
    </div>
  );
}
function HeroDivider() {
  return <div className="w-px my-3" style={{ background: "rgba(255,255,255,0.15)" }} />;
}
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border bg-white ${className}`} style={{ borderColor: "#E3E9F6" }}>
      {children}
    </div>
  );
}
function SectionHeader({ icon: Icon, title, count, accent = "#4F46E5" }: {
  icon: React.ElementType; title: string; count?: number; accent?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
      <div className="p-2 rounded-xl" style={{ background: `${accent}18` }}>
        <Icon size={16} style={{ color: accent }} />
      </div>
      <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
      {count !== undefined && (
        <span className="ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full"
          style={{ background: `${accent}18`, color: accent }}>{count}</span>
      )}
    </div>
  );
}
function DistBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-xs font-semibold text-gray-600 truncate capitalize">{label.replace(/_/g, " ")}</span>
      <div className="flex-1 h-2 rounded-full" style={{ background: "#F0F3FA" }}>
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-7 text-right text-xs font-bold" style={{ color }}>{value}</span>
      <span className="w-8 text-right text-[11px] text-gray-400">{pct}%</span>
    </div>
  );
}

// ── 1. Compliance Violations ──────────────────────────────────────────────────

function ComplianceViolationsSection({ findings }: { findings: FindingRecord[] }) {
  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const sevDist = useMemo(() => {
    const d: Record<string, number> = {};
    findings.forEach((f) => { d[f.severity?.toLowerCase() ?? "unknown"] = (d[f.severity?.toLowerCase() ?? "unknown"] ?? 0) + 1; });
    return d;
  }, [findings]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return findings.filter((f) => {
      const matchQ = !q || f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q);
      const matchS = sevFilter === "all" || f.severity?.toLowerCase() === sevFilter;
      const matchSt = statusFilter === "all" || f.status?.toLowerCase() === statusFilter;
      return matchQ && matchS && matchSt;
    });
  }, [findings, search, sevFilter, statusFilter]);

  const openCount = findings.filter((f) => f.status?.toLowerCase() === "open").length;
  const critCount = findings.filter((f) => f.severity?.toLowerCase() === "critical").length;

  return (
    <Card>
      <SectionHeader icon={ShieldAlert} title="Compliance Violations" count={filtered.length} accent="#DC2626" />

      {/* Summary pills */}
      <div className="px-5 pt-4 flex flex-wrap gap-3">
        {[
          { label: "Total Findings", value: findings.length, color: "#4F46E5" },
          { label: "Open", value: openCount, color: "#DC2626" },
          { label: "Critical", value: critCount, color: "#B91C1C" },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex-1 min-w-[90px] p-3 rounded-xl text-center" style={{ background: "#F8FAFF" }}>
            <div className="text-xl font-black" style={{ color }}>{value}</div>
            <div className="text-[11px] text-gray-500 font-medium mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Severity distribution */}
      <div className="px-5 pt-4 space-y-2">
        {["critical", "high", "medium", "low"].map((sev) => (
          <DistBar key={sev} label={sev} value={sevDist[sev] ?? 0} total={findings.length} color={sevCfg(sev).color} />
        ))}
      </div>

      {/* Filters */}
      <div className="px-5 py-3 mt-3 border-t flex flex-wrap gap-2" style={{ borderColor: "#E3E9F6" }}>
        <div className="relative flex-1 min-w-[150px]">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border outline-none focus:ring-2 focus:ring-red-100"
            style={{ borderColor: "#D1D9F0" }} placeholder="Search findings…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="text-xs rounded-lg border px-2 py-1.5 outline-none" style={{ borderColor: "#D1D9F0" }}
          value={sevFilter} onChange={(e) => setSevFilter(e.target.value)}>
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select className="text-xs rounded-lg border px-2 py-1.5 outline-none" style={{ borderColor: "#D1D9F0" }}
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="in_progress">In Progress</option>
        </select>
      </div>

      {/* Findings list */}
      <div className="divide-y max-h-72 overflow-y-auto" style={{ borderColor: "#E3E9F6" }}>
        {filtered.slice(0, 30).map((f) => (
          <div key={f.id}>
            <div className="px-5 py-3 flex items-start gap-3 hover:bg-red-50/30 cursor-pointer transition-colors"
              onClick={() => setExpanded(expanded === f.id ? null : f.id)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-gray-800 truncate">{f.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={f.severity} />
                  <StatusBadge status={f.status} />
                  {f.iso_clause && (
                    <span className="text-[10px] text-gray-400 font-mono">{f.iso_clause}</span>
                  )}
                </div>
              </div>
              {expanded === f.id ? <ChevronUp size={13} className="text-gray-400 mt-1" /> : <ChevronDown size={13} className="text-gray-400 mt-1" />}
            </div>
            {expanded === f.id && (
              <div className="px-5 pb-3 text-xs text-gray-600 leading-relaxed bg-red-50/20">
                {f.description || "No description provided."}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-400">No violations match the filters.</div>
        )}
      </div>
    </Card>
  );
}

// ── 2. Audit Risk Predictions ────────────────────────────────────────────────

function auditRiskScore(audit: AuditRecord): { score: number; level: "low" | "medium" | "high" | "critical" } {
  let score = 0;
  const s = audit.status?.toLowerCase();
  if (s === "overdue") score += 40;
  else if (s === "open" || s === "pending") score += 20;
  else if (s === "in_progress") score += 10;
  if (!audit.completed_date && audit.scheduled_date) {
    const diff = new Date(audit.scheduled_date).getTime() - Date.now();
    if (diff < 0) score += 30;
    else if (diff < 7 * 86400000) score += 15;
  }
  if (!audit.auditor_user_id) score += 15;
  const level = score >= 60 ? "critical" : score >= 35 ? "high" : score >= 15 ? "medium" : "low";
  return { score: Math.min(score, 100), level };
}

function AuditRiskPredictionsSection({ audits, gaps, benchmarks }: {
  audits: AuditRecord[];
  gaps: ComplianceGap[];
  benchmarks: ComplianceBenchmark[];
}) {
  const scored = useMemo(() =>
    audits.map((a) => ({ ...a, ...auditRiskScore(a) })).sort((a, b) => b.score - a.score),
    [audits]
  );

  const riskCounts = useMemo(() => ({
    critical: scored.filter((a) => a.level === "critical").length,
    high:     scored.filter((a) => a.level === "high").length,
    medium:   scored.filter((a) => a.level === "medium").length,
    low:      scored.filter((a) => a.level === "low").length,
  }), [scored]);

  return (
    <Card>
      <SectionHeader icon={Target} title="Audit Risk Predictions" count={audits.length} accent="#7C3AED" />

      {/* Risk summary */}
      <div className="px-5 pt-4 grid grid-cols-4 gap-2">
        {(["critical", "high", "medium", "low"] as const).map((l) => (
          <div key={l} className="p-2.5 rounded-xl text-center" style={{ background: sevCfg(l).bg }}>
            <div className="text-lg font-black" style={{ color: sevCfg(l).color }}>{riskCounts[l]}</div>
            <div className="text-[10px] font-bold capitalize" style={{ color: sevCfg(l).color }}>{l}</div>
          </div>
        ))}
      </div>

      {/* AI compliance gaps */}
      {gaps.length > 0 && (
        <div className="px-5 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">AI Compliance Gaps</p>
          <div className="space-y-2">
            {gaps.slice(0, 4).map((g) => (
              <div key={g.area} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "#F8FAFF" }}>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-700 truncate">{g.area}</div>
                  <div className="flex gap-3 mt-0.5">
                    <span className="text-[10px] text-gray-400">Current: <b className="text-gray-600">{g.current}%</b></span>
                    <span className="text-[10px] text-gray-400">Required: <b className="text-gray-600">{g.required}%</b></span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ color: g.gap > 20 ? "#DC2626" : g.gap > 10 ? "#D97706" : "#16A34A",
                    background: g.gap > 20 ? "#FEE2E2" : g.gap > 10 ? "#FEF3C7" : "#DCFCE7" }}>
                  -{g.gap}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High-risk audits */}
      <div className="px-5 pt-4 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">High Risk Audits</p>
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {scored.filter((a) => a.level === "critical" || a.level === "high").slice(0, 10).map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "#F8FAFF" }}>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-800 truncate">{a.title}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <StatusBadge status={a.status} />
                  {a.scheduled_date && (
                    <span className="text-[10px] text-gray-400">
                      {new Date(a.scheduled_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black" style={{ color: sevCfg(a.level).color }}>{a.score}</div>
                <div className="text-[10px] text-gray-400">risk</div>
              </div>
            </div>
          ))}
          {scored.filter((a) => a.level === "critical" || a.level === "high").length === 0 && (
            <div className="py-6 text-center">
              <CheckCircle2 size={20} className="mx-auto mb-2 text-green-500" />
              <p className="text-xs text-gray-400">No high-risk audits detected</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ── 3. Non-Compliance Trends ──────────────────────────────────────────────────

function NonComplianceTrendsSection({ capas, findings, score }: {
  capas: CapaRecord[];
  findings: FindingRecord[];
  score: number;
}) {
  const overdueCapas = capas.filter((c) => c.overdue);
  const openCapas = capas.filter((c) => c.status?.toLowerCase() === "open");
  const closedCapas = capas.filter((c) => ["closed", "resolved"].includes(c.status?.toLowerCase() ?? ""));
  const closureRate = capas.length > 0 ? Math.round((closedCapas.length / capas.length) * 100) : 0;

  const findingsBySource = useMemo(() => {
    const d: Record<string, number> = {};
    findings.forEach((f) => { const k = f.source_type || "unknown"; d[k] = (d[k] ?? 0) + 1; });
    return d;
  }, [findings]);

  const capaBySeverity = useMemo(() => {
    const d: Record<string, number> = {};
    capas.forEach((c) => { const k = c.severity?.toLowerCase() || "unknown"; d[k] = (d[k] ?? 0) + 1; });
    return d;
  }, [capas]);

  const scoreColor = score >= 80 ? "#16A34A" : score >= 60 ? "#D97706" : "#DC2626";

  return (
    <Card>
      <SectionHeader icon={TrendingUp} title="Non-Compliance Trends" accent="#2563EB" />

      {/* Compliance score ring */}
      <div className="px-5 pt-4 flex items-center gap-5">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#E3E9F6" strokeWidth="8" />
            <circle cx="40" cy="40" r="34" fill="none" stroke={scoreColor} strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - score / 100)}`}
              strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-black" style={{ color: scoreColor }}>{score}%</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">Overall Compliance Score</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {score >= 80 ? "Good — within acceptable range" : score >= 60 ? "Moderate — improvement needed" : "Poor — immediate action required"}
          </p>
          <div className="flex gap-3 mt-2">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>
              {overdueCapas.length} Overdue CAPAs
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#DBEAFE", color: "#2563EB" }}>
              {closureRate}% Closure Rate
            </span>
          </div>
        </div>
      </div>

      {/* CAPA trends */}
      <div className="px-5 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">CAPA Trend</p>
        <div className="space-y-2">
          <DistBar label="Open" value={openCapas.length} total={capas.length} color="#DC2626" />
          <DistBar label="Overdue" value={overdueCapas.length} total={capas.length} color="#B91C1C" />
          <DistBar label="Closed" value={closedCapas.length} total={capas.length} color="#16A34A" />
        </div>
      </div>

      {/* CAPA by severity */}
      <div className="px-5 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">CAPAs by Severity</p>
        <div className="space-y-2">
          {["critical", "high", "medium", "low"].map((sev) => (
            <DistBar key={sev} label={sev} value={capaBySeverity[sev] ?? 0} total={capas.length} color={sevCfg(sev).color} />
          ))}
        </div>
      </div>

      {/* Findings by source */}
      {Object.keys(findingsBySource).length > 0 && (
        <div className="px-5 pt-4 pb-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Findings by Source</p>
          <div className="space-y-2">
            {Object.entries(findingsBySource).sort(([, a], [, b]) => b - a).slice(0, 5).map(([src, cnt]) => (
              <DistBar key={src} label={src} value={cnt} total={findings.length} color="#4F46E5" />
            ))}
          </div>
        </div>
      )}

      {/* Overdue CAPA list */}
      {overdueCapas.length > 0 && (
        <div className="px-5 pb-4 border-t pt-3" style={{ borderColor: "#E3E9F6" }}>
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Overdue CAPAs</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {overdueCapas.slice(0, 8).map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "#FFF5F5" }}>
                <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800 truncate">{c.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <SeverityBadge severity={c.severity} />
                    {c.days_left !== null && (
                      <span className="text-[10px] font-bold text-red-600">{Math.abs(c.days_left)} days overdue</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// ── 4. Regulatory Risk Alerts ─────────────────────────────────────────────────

function urgencyLevel(reg: RegulatoryRequirement): "critical" | "high" | "medium" | "low" {
  const d = reg.days_until_due;
  if (d === null || d === undefined) return "low";
  if (d < 0) return "critical";
  if (d <= 7) return "critical";
  if (d <= 30) return "high";
  if (d <= 90) return "medium";
  return "low";
}

function RegulatoryRiskAlertsSection({ regs }: { regs: RegulatoryRequirement[] }) {
  const [search, setSearch] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("all");

  const sorted = useMemo(() => {
    const priority = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...regs].sort((a, b) => {
      const pa = priority[urgencyLevel(a)];
      const pb = priority[urgencyLevel(b)];
      return pa !== pb ? pa - pb : (a.days_until_due ?? 999) - (b.days_until_due ?? 999);
    });
  }, [regs]);

  const urgencyCounts = useMemo(() => ({
    critical: regs.filter((r) => urgencyLevel(r) === "critical").length,
    high:     regs.filter((r) => urgencyLevel(r) === "high").length,
    medium:   regs.filter((r) => urgencyLevel(r) === "medium").length,
    low:      regs.filter((r) => urgencyLevel(r) === "low").length,
  }), [regs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sorted.filter((r) => {
      const matchQ = !q || r.regulation_name.toLowerCase().includes(q)
        || (r.jurisdiction ?? "").toLowerCase().includes(q)
        || (r.category ?? "").toLowerCase().includes(q);
      const matchU = urgencyFilter === "all" || urgencyLevel(r) === urgencyFilter;
      return matchQ && matchU;
    });
  }, [sorted, search, urgencyFilter]);

  return (
    <Card>
      <SectionHeader icon={Bell} title="Regulatory Risk Alerts" count={regs.length} accent="#F59E0B" />

      {/* Urgency summary */}
      <div className="px-5 pt-4 grid grid-cols-4 gap-2">
        {(["critical", "high", "medium", "low"] as const).map((u) => (
          <div key={u} className="p-2.5 rounded-xl text-center cursor-pointer transition-all hover:shadow-sm"
            style={{ background: sevCfg(u).bg }}
            onClick={() => setUrgencyFilter(urgencyFilter === u ? "all" : u)}>
            <div className="text-lg font-black" style={{ color: sevCfg(u).color }}>{urgencyCounts[u]}</div>
            <div className="text-[10px] font-bold capitalize" style={{ color: sevCfg(u).color }}>{u}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="px-5 py-3 mt-2 border-t flex gap-2" style={{ borderColor: "#E3E9F6" }}>
        <div className="relative flex-1">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border outline-none"
            style={{ borderColor: "#D1D9F0" }} placeholder="Search regulations…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="text-xs rounded-lg border px-2 py-1.5 outline-none" style={{ borderColor: "#D1D9F0" }}
          value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)}>
          <option value="all">All Urgency</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Regulation list */}
      <div className="divide-y max-h-[480px] overflow-y-auto" style={{ borderColor: "#E3E9F6" }}>
        {filtered.map((r) => {
          const u = urgencyLevel(r);
          const cfg = sevCfg(u);
          const d = r.days_until_due;
          const dLabel = d === null ? "No due date"
            : d < 0 ? `${Math.abs(d)} days overdue`
            : d === 0 ? "Due today"
            : `${d} days left`;
          return (
            <div key={r.id} className="px-5 py-3 hover:bg-amber-50/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1.5 rounded-lg flex-shrink-0" style={{ background: cfg.bg }}>
                  <Bell size={11} style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-800">{r.regulation_name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                      style={{ color: cfg.color, background: cfg.bg }}>{u}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {r.jurisdiction && (
                      <span className="text-[10px] text-gray-400">{r.jurisdiction}</span>
                    )}
                    {r.category && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: "#EEF2FF", color: "#4F46E5" }}>
                        {r.category}
                      </span>
                    )}
                    <span className="text-[10px] font-semibold" style={{ color: d !== null && d < 0 ? "#DC2626" : d !== null && d <= 7 ? "#EA580C" : "#6B7280" }}>
                      {dLabel}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                  {r.description && (
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed line-clamp-2">{r.description}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <CheckCircle2 size={20} className="mx-auto mb-2 text-green-500" />
            <p className="text-sm text-gray-400">No regulatory alerts match the filters.</p>
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export function ComplianceIntelligencePage() {
  const { data: dashboard, isLoading: dashLoading, refetch: refetchDash } = useGetComplianceDashboardQuery();
  const { data: rawFindings, isLoading: findLoading, refetch: refetchFindings } = useGetFindingsQuery();
  const { data: rawAudits, isLoading: auditLoading } = useGetAuditsQuery();
  const { data: rawCapas, isLoading: capaLoading } = useGetCapasQuery();
  const { data: rawRegs, isLoading: regLoading } = useGetRegulatoryRequirementsQuery();
  const { data: aiCompliance } = useGetComplianceIntelligenceQuery();
  const { data: benchmarking } = useGetComplianceBenchmarkingQuery();

  const isLoading = dashLoading || findLoading || auditLoading || capaLoading || regLoading;

  const findings = Array.isArray(rawFindings) ? rawFindings : [];
  const audits   = Array.isArray(rawAudits)   ? rawAudits   : [];
  const capas    = Array.isArray(rawCapas)    ? rawCapas    : [];
  const regs     = Array.isArray(rawRegs)     ? rawRegs     : [];

  const rawGaps = (aiCompliance as any)?.gaps;
  const gaps: ComplianceGap[] = Array.isArray(rawGaps) ? rawGaps : [];

  const rawBenchmarks = benchmarking?.benchmarks;
  const benchmarks: ComplianceBenchmark[] = Array.isArray(rawBenchmarks) ? rawBenchmarks : [];

  const overallScore = dashboard?.compliance_score ?? benchmarking?.overall_score ?? 0;
  const openFindings = dashboard?.findings?.open ?? findings.filter((f) => f.status?.toLowerCase() === "open").length;
  const overdueCapas = dashboard?.capas?.overdue ?? capas.filter((c) => c.overdue).length;
  const regsAtRisk   = regs.filter((r) => { const u = urgencyLevel(r); return u === "critical" || u === "high"; }).length;

  function refetchAll() { refetchDash(); refetchFindings(); }

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>
      {/* Banner */}
      <div className="relative overflow-hidden px-8 pt-8 pb-6"
        style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 70% 50%, rgba(79,70,229,0.2) 0%, transparent 70%)" }} />

        <div className="relative flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Scale size={18} style={{ color: "#A5B4FC" }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#A5B4FC" }}>
                Compliance Intelligence
              </span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">Compliance Intelligence</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
              Violations, audit risk predictions, non-compliance trends, and regulatory alerts
            </p>
          </div>
          <button onClick={refetchAll} disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}>
            {isLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Refresh
          </button>
        </div>

        {/* Hero Stats */}
        <div className="relative flex rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <HeroStat label="Compliance Score" value={`${overallScore}%`}
            color={overallScore >= 80 ? "#34D399" : overallScore >= 60 ? "#F59E0B" : "#EF4444"} />
          <HeroDivider />
          <HeroStat label="Open Findings" value={openFindings} color="#F97316" />
          <HeroDivider />
          <HeroStat label="Overdue CAPAs" value={overdueCapas} color="#EF4444" />
          <HeroDivider />
          <HeroStat label="Regs at Risk" value={regsAtRisk} color="#F59E0B" />
          <HeroDivider />
          <HeroStat label="Total Audits" value={dashboard?.audits?.total ?? audits.length} />
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin" style={{ color: "#4F46E5" }} />
            <span className="ml-3 text-gray-500 text-sm">Loading compliance intelligence…</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ComplianceViolationsSection findings={findings} />
            <AuditRiskPredictionsSection audits={audits} gaps={gaps} benchmarks={benchmarks} />
            <NonComplianceTrendsSection capas={capas} findings={findings} score={overallScore} />
            <RegulatoryRiskAlertsSection regs={regs} />
          </div>
        )}
      </div>
    </div>
  );
}
