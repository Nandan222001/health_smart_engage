import { useMemo, useState } from "react";
import {
  Flame, AlertTriangle, AlertCircle, CheckCircle2, Search,
  RefreshCw, BarChart3, Loader2,
} from "lucide-react";
import { useListIncidentsQuery } from "@/features/incidents/api/incidentsApi";
import type { Incident } from "@/features/incidents/api/incidentsApi";

// ── Helpers ─────────────────────────────────────────────────────────────────

const SEV_LEVELS = ["critical", "high", "medium", "low", "unclassified"] as const;

const SEV_CFG: Record<string, { color: string; bg: string; border: string; label: string; Icon: React.ElementType }> = {
  critical:     { color: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5", label: "Critical",     Icon: Flame },
  high:         { color: "#EA580C", bg: "#FFEDD5", border: "#FDB898", label: "High",         Icon: AlertCircle },
  medium:       { color: "#D97706", bg: "#FEF3C7", border: "#FCD34D", label: "Medium",       Icon: AlertTriangle },
  low:          { color: "#16A34A", bg: "#DCFCE7", border: "#86EFAC", label: "Low",          Icon: CheckCircle2 },
  unclassified: { color: "#6B7280", bg: "#F3F4F6", border: "#D1D5DB", label: "Unclassified", Icon: AlertTriangle },
};

function sevCfg(s: string) { return SEV_CFG[s?.toLowerCase()] ?? SEV_CFG.unclassified; }

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
  const color = ["resolved", "closed"].includes(status) ? "#16A34A"
    : status === "investigating" ? "#2563EB"
    : "#DC2626";
  const bg = ["resolved", "closed"].includes(status) ? "#DCFCE7"
    : status === "investigating" ? "#DBEAFE"
    : "#FEE2E2";
  return (
    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize"
      style={{ color, background: bg }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ── Hero Stat ────────────────────────────────────────────────────────────────

function HeroStat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex-1 px-6 py-4 text-center">
      <div className="text-[26px] font-black text-white leading-none" style={color ? { color } : undefined}>{value}</div>
      <div className="text-[11px] font-semibold mt-1 uppercase tracking-wide"
        style={{ color: "rgba(255,255,255,0.55)" }}>{label}</div>
    </div>
  );
}

// ── Severity Distribution Section ────────────────────────────────────────────

function SeverityDistributionSection({ incidents }: { incidents: Incident[] }) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const i of incidents) {
      const s = i.severity?.toLowerCase() || "unclassified";
      map[s] = (map[s] || 0) + 1;
    }
    return map;
  }, [incidents]);

  const total = incidents.length || 1;

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#FEE2E220" }}>
            <BarChart3 className="w-5 h-5" style={{ color: "#DC2626" }} />
          </div>
          <div>
            <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>Severity Distribution</h2>
            <p className="text-[12px]" style={{ color: "#9CA3AF" }}>Breakdown of incidents by severity level</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {SEV_LEVELS.map((sev) => {
          const cfg = SEV_CFG[sev];
          const Icon = cfg.Icon;
          const count = counts[sev] || 0;
          const pct   = Math.round((count / total) * 100);
          return (
            <div key={sev} className="rounded-2xl border p-4 flex flex-col gap-2"
              style={{ borderColor: cfg.border, background: cfg.bg + "40" }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: cfg.bg }}>
                  <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>
                <span className="text-[12px] font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
              </div>
              <div className="text-[28px] font-black leading-none" style={{ color: "#111827" }}>{count}</div>
              <div className="w-full rounded-full h-1.5" style={{ background: "#E5E7EB" }}>
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: cfg.color }} />
              </div>
              <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{pct}% of total</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Incidents by Severity Section ────────────────────────────────────────────

function IncidentsBySeveritySection({ incidents }: { incidents: Incident[] }) {
  const [search, setSearch]       = useState("");
  const [sevFilter, setSevFilter] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const sorted = [...incidents].sort((a, b) => {
      const order = ["critical", "high", "medium", "low", "unclassified"];
      return order.indexOf(a.severity?.toLowerCase()) - order.indexOf(b.severity?.toLowerCase());
    });
    return sorted.filter((i) => {
      const matchQ   = !q || (i.title || "").toLowerCase().includes(q) || (i.type || "").toLowerCase().includes(q);
      const matchSev = !sevFilter || i.severity?.toLowerCase() === sevFilter;
      return matchQ && matchSev;
    });
  }, [incidents, search, sevFilter]);

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-6 pt-5 pb-4 border-b flex flex-wrap items-center gap-3" style={{ borderColor: "#F3F4F6" }}>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FEF3C7" }}>
            <AlertTriangle className="w-5 h-5" style={{ color: "#D97706" }} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>All Incidents by Severity</h2>
            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{filtered.length} record{filtered.length !== 1 ? "s" : ""} · sorted highest first</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#9CA3AF" }} />
          <input
            className="pl-8 pr-3 py-2 rounded-xl border text-[12px] outline-none"
            style={{ borderColor: "#E5E7EB", width: 200 }}
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 rounded-xl border text-[12px] outline-none"
          style={{ borderColor: "#E5E7EB" }}
          value={sevFilter}
          onChange={(e) => setSevFilter(e.target.value)}
        >
          <option value="">All Severities</option>
          {SEV_LEVELS.map((s) => <option key={s} value={s}>{SEV_CFG[s].label}</option>)}
        </select>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
            {["Incident", "Severity", "Status", "Type", "Date"].map((h) => (
              <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-12">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2" style={{ color: "#E5E7EB" }} />
                <p className="text-[13px]" style={{ color: "#9CA3AF" }}>No incidents match your filters</p>
              </td>
            </tr>
          ) : (
            filtered.map((i) => (
              <tr key={i.id} className="border-t hover:bg-blue-50/30 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                <td className="px-5 py-3.5">
                  <div className="flex items-start gap-2.5">
                    <Flame className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: sevCfg(i.severity).color }} />
                    <div>
                      <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{i.title || "—"}</div>
                      <div className="text-[11px]" style={{ color: "#9CA3AF" }}>ID: {i.id.slice(0, 8)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5"><SeverityBadge severity={i.severity} /></td>
                <td className="px-5 py-3.5"><StatusBadge status={i.status} /></td>
                <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{i.type || "—"}</td>
                <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>
                  {i.occurred_at ? new Date(i.occurred_at).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Severity by Type Section ─────────────────────────────────────────────────

function SeverityByTypeSection({ incidents }: { incidents: Incident[] }) {
  const matrix = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const i of incidents) {
      const type = i.type || "Unknown";
      const sev  = i.severity?.toLowerCase() || "unclassified";
      if (!map[type]) map[type] = {};
      map[type][sev] = (map[type][sev] || 0) + 1;
    }
    return Object.entries(map).sort(([, a], [, b]) => {
      const score = (m: Record<string, number>) =>
        (m.critical || 0) * 4 + (m.high || 0) * 3 + (m.medium || 0) * 2 + (m.low || 0);
      return score(b) - score(a);
    }).slice(0, 10);
  }, [incidents]);

  if (matrix.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FFEDD5" }}>
            <BarChart3 className="w-5 h-5" style={{ color: "#EA580C" }} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>Severity by Incident Type</h2>
            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Top incident types ranked by severity risk</p>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-3">
        {matrix.map(([type, sevMap]) => {
          const total = Object.values(sevMap).reduce((a, b) => a + b, 0);
          return (
            <div key={type} className="flex items-center gap-4">
              <div className="w-36 text-[12px] font-semibold truncate" style={{ color: "#374151" }} title={type}>{type}</div>
              <div className="flex-1 flex h-5 rounded-full overflow-hidden gap-px">
                {["critical", "high", "medium", "low"].map((sev) => {
                  const cnt = sevMap[sev] || 0;
                  if (!cnt) return null;
                  const pct = Math.round((cnt / total) * 100);
                  return (
                    <div key={sev} className="h-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ width: `${pct}%`, background: SEV_CFG[sev].color, minWidth: 20 }}>
                      {cnt}
                    </div>
                  );
                })}
              </div>
              <div className="text-[11px] w-8 text-right font-semibold" style={{ color: "#6B7280" }}>{total}</div>
            </div>
          );
        })}
        {/* Legend */}
        <div className="flex items-center gap-4 pt-2 flex-wrap">
          {["critical", "high", "medium", "low"].map((sev) => (
            <div key={sev} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: SEV_CFG[sev].color }} />
              <span className="text-[11px]" style={{ color: "#6B7280" }}>{SEV_CFG[sev].label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function IncidentSeverityPage() {
  const { data: incidents = [], isLoading, refetch } = useListIncidentsQuery();

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const i of incidents) {
      const s = i.severity?.toLowerCase() || "unclassified";
      map[s] = (map[s] || 0) + 1;
    }
    return map;
  }, [incidents]);

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>
      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, #7C2D12 0%, #1C1917 100%)" }}>
        <div className="px-8 pt-8 pb-0">
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Incident Management
          </p>
          <h1 className="text-[26px] font-black text-white">Incident Severity</h1>
          <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Severity classification · Risk level analysis · Incident prioritisation
          </p>
        </div>
        <div className="flex border-t mt-6 divide-x" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <HeroStat label="Critical"     value={isLoading ? "…" : (counts.critical || 0)}     color="#FCA5A5" />
          <HeroStat label="High"         value={isLoading ? "…" : (counts.high || 0)}          color="#FDB898" />
          <HeroStat label="Medium"       value={isLoading ? "…" : (counts.medium || 0)}        color="#FCD34D" />
          <HeroStat label="Low"          value={isLoading ? "…" : (counts.low || 0)}           color="#86EFAC" />
          <HeroStat label="Unclassified" value={isLoading ? "…" : (counts.unclassified || 0)} />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Refresh */}
        <div className="flex justify-end">
          <button onClick={() => refetch()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] font-semibold bg-white transition-colors hover:bg-gray-50"
            style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#D1D5DB" }} />
          </div>
        ) : (
          <>
            <SeverityDistributionSection incidents={incidents} />
            <SeverityByTypeSection incidents={incidents} />
            <IncidentsBySeveritySection incidents={incidents} />
          </>
        )}
      </div>
    </div>
  );
}
