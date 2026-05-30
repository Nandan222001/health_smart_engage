import { useMemo, useState } from "react";
import {
  FileText, AlertTriangle, CheckCircle2, Clock, Search,
  RefreshCw, BarChart3, Loader2, Building2, Users, TrendingUp,
  AlertCircle, Flame, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  useGetIncidentReportsQuery,
  useGetIncidentAnalyticsQuery,
} from "@/features/incidents/api/incidentsApi";
import type { IncidentReportItem } from "@/features/incidents/api/incidentsApi";

// ── Severity config ───────────────────────────────────────────────────────────

const SEV_CFG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  critical:     { color: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5", label: "Critical" },
  high:         { color: "#EA580C", bg: "#FFEDD5", border: "#FDB898", label: "High" },
  medium:       { color: "#D97706", bg: "#FEF3C7", border: "#FCD34D", label: "Medium" },
  low:          { color: "#16A34A", bg: "#DCFCE7", border: "#86EFAC", label: "Low" },
  unclassified: { color: "#6B7280", bg: "#F3F4F6", border: "#D1D5DB", label: "Unclassified" },
};
function sevCfg(s: string) { return SEV_CFG[s?.toLowerCase()] ?? SEV_CFG.unclassified; }

const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  resolved:     { color: "#16A34A", bg: "#DCFCE7" },
  closed:       { color: "#16A34A", bg: "#DCFCE7" },
  investigating:{ color: "#2563EB", bg: "#DBEAFE" },
  open:         { color: "#DC2626", bg: "#FEE2E2" },
  reported:     { color: "#9333EA", bg: "#F3E8FF" },
  pending:      { color: "#D97706", bg: "#FEF3C7" },
};
function statusCfg(s: string) {
  return STATUS_CFG[s?.toLowerCase()] ?? { color: "#6B7280", bg: "#F3F4F6" };
}

// ── Shared components ─────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const cfg = sevCfg(severity);
  return (
    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize"
      style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusCfg(status);
  return (
    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize"
      style={{ color: cfg.color, background: cfg.bg }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function HeroStat({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
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

function SectionHeader({ icon: Icon, title, count }: { icon: React.ElementType; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
      <div className="p-2 rounded-xl" style={{ background: "#EEF2FF" }}>
        <Icon size={16} style={{ color: "#3B57C4" }} />
      </div>
      <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
      {count !== undefined && (
        <span className="ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full"
          style={{ background: "#EEF2FF", color: "#3B57C4" }}>{count}</span>
      )}
    </div>
  );
}

// ── Distribution bar ──────────────────────────────────────────────────────────

function DistributionBar({
  label, value, total, color, bg,
}: { label: string; value: number; total: number; color: string; bg: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-xs font-semibold text-gray-600 truncate capitalize">{label.replace(/_/g, " ")}</span>
      <div className="flex-1 h-2 rounded-full" style={{ background: "#F0F3FA" }}>
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-8 text-right text-xs font-bold" style={{ color }}>{value}</span>
      <span className="w-8 text-right text-[11px] text-gray-400">{pct}%</span>
    </div>
  );
}

// ── Severity Distribution Section ────────────────────────────────────────────

function SeverityDistributionSection({ dist }: { dist: Record<string, number> }) {
  const total = Object.values(dist).reduce((s, v) => s + v, 0);
  const order = ["critical", "high", "medium", "low", "unclassified"];
  const rows = order.map((k) => ({ key: k, val: dist[k] ?? 0, cfg: sevCfg(k) }));

  return (
    <Card>
      <SectionHeader icon={AlertCircle} title="Incidents by Severity" count={total} />
      <div className="p-5 space-y-3">
        {rows.map(({ key, val, cfg }) => (
          <DistributionBar key={key} label={cfg.label} value={val} total={total} color={cfg.color} bg={cfg.bg} />
        ))}
      </div>
    </Card>
  );
}

// ── Status Distribution Section ──────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  open: "#DC2626", reported: "#9333EA", investigating: "#2563EB",
  resolved: "#16A34A", closed: "#6B7280", pending: "#D97706",
};

function StatusDistributionSection({ dist }: { dist: Record<string, number> }) {
  const total = Object.values(dist).reduce((s, v) => s + v, 0);
  const rows = Object.entries(dist).sort(([, a], [, b]) => b - a);

  return (
    <Card>
      <SectionHeader icon={BarChart3} title="Incidents by Status" count={total} />
      <div className="p-5 space-y-3">
        {rows.map(([key, val]) => (
          <DistributionBar key={key} label={key} value={val} total={total}
            color={STATUS_COLORS[key.toLowerCase()] ?? "#6B7280"} bg="#F0F3FA" />
        ))}
        {rows.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No data</p>}
      </div>
    </Card>
  );
}

// ── Site Distribution Section ────────────────────────────────────────────────

function SiteDistributionSection({ dist }: { dist: Record<string, number> }) {
  const total = Object.values(dist).reduce((s, v) => s + v, 0);
  const rows = Object.entries(dist).sort(([, a], [, b]) => b - a).slice(0, 8);

  return (
    <Card>
      <SectionHeader icon={Building2} title="Incidents by Site" count={total} />
      <div className="p-5 space-y-3">
        {rows.map(([key, val]) => (
          <DistributionBar key={key} label={key || "Unknown"} value={val} total={total}
            color="#3B57C4" bg="#EEF2FF" />
        ))}
        {rows.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No data</p>}
      </div>
    </Card>
  );
}

// ── Dept Distribution Section ────────────────────────────────────────────────

function DeptDistributionSection({ dist }: { dist: Record<string, number> }) {
  const total = Object.values(dist).reduce((s, v) => s + v, 0);
  const rows = Object.entries(dist).sort(([, a], [, b]) => b - a).slice(0, 8);

  return (
    <Card>
      <SectionHeader icon={Users} title="Incidents by Department" count={total} />
      <div className="p-5 space-y-3">
        {rows.map(([key, val]) => (
          <DistributionBar key={key} label={key || "Unknown"} value={val} total={total}
            color="#7C3AED" bg="#F5F3FF" />
        ))}
        {rows.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No data</p>}
      </div>
    </Card>
  );
}

// ── Expandable row ────────────────────────────────────────────────────────────

function IncidentRow({ item }: { item: IncidentReportItem }) {
  const [expanded, setExpanded] = useState(false);
  const date = item.occurred_at ? new Date(item.occurred_at).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  }) : "—";

  return (
    <>
      <tr className="border-b hover:bg-blue-50/30 transition-colors cursor-pointer"
        style={{ borderColor: "#E3E9F6" }} onClick={() => setExpanded((v) => !v)}>
        <td className="px-4 py-3">
          <span className="text-xs font-mono font-bold text-blue-700">{item.ref || item.id?.slice(0, 8)}</span>
        </td>
        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{date}</td>
        <td className="px-4 py-3 text-xs text-gray-700 max-w-[180px] truncate">{item.location || "—"}</td>
        <td className="px-4 py-3"><SeverityBadge severity={item.severity} /></td>
        <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
        <td className="px-4 py-3 text-xs text-gray-600 max-w-[220px] truncate">{item.description || "—"}</td>
        <td className="px-4 py-3 text-xs text-gray-500">{item.injured_persons || "—"}</td>
        <td className="px-4 py-3">
          <button className="p-1 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr style={{ borderColor: "#E3E9F6" }} className="border-b bg-blue-50/20">
          <td colSpan={8} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Root Cause</p>
                <p className="text-gray-700 leading-relaxed">{item.root_cause || "Not identified"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Corrective Actions</p>
                <p className="text-gray-700 leading-relaxed">{item.corrective_actions || "None recorded"}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Reports Table Section ─────────────────────────────────────────────────────

function ReportsTableSection({ items }: { items: IncidentReportItem[] }) {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((i) => {
      const matchQ = !q || (i.ref ?? "").toLowerCase().includes(q)
        || (i.description ?? "").toLowerCase().includes(q)
        || (i.location ?? "").toLowerCase().includes(q);
      const matchSev = severityFilter === "all" || i.severity?.toLowerCase() === severityFilter;
      const matchStat = statusFilter === "all" || i.status?.toLowerCase() === statusFilter;
      return matchQ && matchSev && matchStat;
    });
  }, [items, search, severityFilter, statusFilter]);

  return (
    <Card>
      <SectionHeader icon={FileText} title="Detailed Incident Reports" count={filtered.length} />

      {/* Filters */}
      <div className="px-5 py-3 border-b flex flex-wrap items-center gap-3" style={{ borderColor: "#E3E9F6" }}>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none focus:ring-2 focus:ring-blue-200"
            style={{ borderColor: "#D1D9F0" }}
            placeholder="Search by ref, description, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="text-xs rounded-lg border px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-200"
          style={{ borderColor: "#D1D9F0" }}
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
          <option value="unclassified">Unclassified</option>
        </select>
        <select
          className="text-xs rounded-lg border px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-200"
          style={{ borderColor: "#D1D9F0" }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="reported">Reported</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-wide text-gray-400"
              style={{ background: "#F8FAFF" }}>
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Injured</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => <IncidentRow key={item.id} item={item} />)}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm text-gray-400">
                  No incidents match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ── Investigation Distribution ────────────────────────────────────────────────

function InvestigationDistributionSection({ dist }: { dist: Record<string, number> }) {
  const total = Object.values(dist).reduce((s, v) => s + v, 0);
  const COLOR_MAP: Record<string, string> = {
    open: "#2563EB", in_progress: "#D97706", completed: "#16A34A",
    pending: "#9333EA", closed: "#6B7280",
  };
  const rows = Object.entries(dist).sort(([, a], [, b]) => b - a);

  return (
    <Card>
      <SectionHeader icon={TrendingUp} title="Investigation Status" count={total} />
      <div className="p-5 space-y-3">
        {rows.map(([key, val]) => (
          <DistributionBar key={key} label={key} value={val} total={total}
            color={COLOR_MAP[key.toLowerCase()] ?? "#6B7280"} bg="#F0F3FA" />
        ))}
        {rows.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No data</p>}
      </div>
    </Card>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function AdminIncidentReportsPage() {
  const { data: reports, isLoading: reportsLoading, refetch } = useGetIncidentReportsQuery();
  const { data: analytics, isLoading: analyticsLoading } = useGetIncidentAnalyticsQuery();

  const isLoading = reportsLoading || analyticsLoading;

  const totalIncidents = reports?.total_incidents ?? analytics?.total_incidents ?? 0;
  const trir = analytics?.trir ?? 0;
  const openActions = analytics?.open_corrective_actions ?? 0;
  const closedActions = analytics?.closed_corrective_actions ?? 0;

  const sevDist = reports?.severity_distribution ?? {};
  const statDist = reports?.status_distribution ?? {};
  const siteDist = reports?.site_distribution ?? {};
  const deptDist = reports?.dept_distribution ?? {};
  const invDist = reports?.investigation_distribution ?? {};
  const items: IncidentReportItem[] = Array.isArray(reports?.items) ? reports!.items : [];

  const criticalCount = sevDist["critical"] ?? 0;

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>
      {/* Banner */}
      <div className="relative overflow-hidden px-8 pt-8 pb-6"
        style={{ background: "linear-gradient(135deg, #1A2E5A 0%, #0F172A 100%)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 70% 50%, rgba(59,87,196,0.18) 0%, transparent 70%)" }} />

        <div className="relative flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText size={18} style={{ color: "#7C9CF0" }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#7C9CF0" }}>
                Incident Management
              </span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">Incident Reports</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
              Comprehensive overview of all recorded incidents, distributions, and investigations
            </p>
          </div>
          <button onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}>
            {isLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Refresh
          </button>
        </div>

        {/* Hero Stats */}
        <div className="relative flex rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <HeroStat label="Total Incidents" value={totalIncidents} />
          <HeroDivider />
          <HeroStat label="TRIR" value={trir.toFixed(2)} sub="Total Recordable Incident Rate" color="#F59E0B" />
          <HeroDivider />
          <HeroStat label="Critical" value={criticalCount} color="#EF4444" />
          <HeroDivider />
          <HeroStat label="Open Actions" value={openActions} color="#F97316" />
          <HeroDivider />
          <HeroStat label="Closed Actions" value={closedActions} color="#34D399" />
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin" style={{ color: "#3B57C4" }} />
            <span className="ml-3 text-gray-500 text-sm">Loading incident reports…</span>
          </div>
        ) : (
          <>
            {/* Distribution grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              <SeverityDistributionSection dist={sevDist} />
              <StatusDistributionSection dist={statDist} />
              <SiteDistributionSection dist={siteDist} />
              <DeptDistributionSection dist={deptDist} />
            </div>

            {/* Investigation distribution */}
            {Object.keys(invDist).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InvestigationDistributionSection dist={invDist} />
                {/* Summary card */}
                <Card>
                  <SectionHeader icon={BarChart3} title="Report Summary" />
                  <div className="p-5 grid grid-cols-2 gap-4">
                    {[
                      { label: "Total Recorded", value: totalIncidents, color: "#3B57C4" },
                      { label: "TRIR Score", value: trir.toFixed(2), color: "#D97706" },
                      { label: "Critical Incidents", value: criticalCount, color: "#DC2626" },
                      { label: "High Severity", value: sevDist["high"] ?? 0, color: "#EA580C" },
                      { label: "Under Investigation", value: statDist["investigating"] ?? 0, color: "#2563EB" },
                      { label: "Resolved", value: statDist["resolved"] ?? 0, color: "#16A34A" },
                      { label: "Open Actions", value: openActions, color: "#F97316" },
                      { label: "Closed Actions", value: closedActions, color: "#34D399" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="p-3 rounded-xl" style={{ background: "#F8FAFF" }}>
                        <div className="text-lg font-black" style={{ color }}>{value}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5 font-medium">{label}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Detailed table */}
            <ReportsTableSection items={items} />
          </>
        )}
      </div>
    </div>
  );
}
