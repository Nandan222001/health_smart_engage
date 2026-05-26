import { useMemo, useState } from "react";
import {
  Search, TrendingUp, AlertTriangle, Loader2, RefreshCw,
  BarChart3, Target, Repeat, ShieldAlert,
} from "lucide-react";
import {
  useListIncidentsQuery,
  useListInvestigationsQuery,
} from "@/features/incidents/api/incidentsApi";
import type { Incident } from "@/features/incidents/api/incidentsApi";

// ── Helpers ─────────────────────────────────────────────────────────────────

const SEV_CFG: Record<string, { color: string; bg: string }> = {
  critical:     { color: "#DC2626", bg: "#FEE2E2" },
  high:         { color: "#EA580C", bg: "#FFEDD5" },
  medium:       { color: "#D97706", bg: "#FEF3C7" },
  low:          { color: "#16A34A", bg: "#DCFCE7" },
  unclassified: { color: "#6B7280", bg: "#F3F4F6" },
};

function sevCfg(s: string) { return SEV_CFG[s?.toLowerCase()] ?? SEV_CFG.unclassified; }

function SeverityBadge({ severity }: { severity: string }) {
  const cfg = sevCfg(severity);
  return (
    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize"
      style={{ color: cfg.color, background: cfg.bg }}>
      {severity || "—"}
    </span>
  );
}

function HeroStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex-1 px-6 py-4 text-center">
      <div className="text-[26px] font-black text-white leading-none">{value}</div>
      <div className="text-[11px] font-semibold mt-1 uppercase tracking-wide"
        style={{ color: "rgba(255,255,255,0.55)" }}>{label}</div>
    </div>
  );
}

// ── Root Cause Categories Section ─────────────────────────────────────────────

function RootCauseCategoriesSection({ incidents }: { incidents: Incident[] }) {
  const categories = useMemo(() => {
    const map: Record<string, { count: number; critical: number; high: number; medium: number; low: number }> = {};
    for (const i of incidents) {
      const type = i.type || "Unclassified";
      if (!map[type]) map[type] = { count: 0, critical: 0, high: 0, medium: 0, low: 0 };
      map[type].count++;
      const sev = i.severity?.toLowerCase();
      if (sev === "critical") map[type].critical++;
      else if (sev === "high") map[type].high++;
      else if (sev === "medium") map[type].medium++;
      else map[type].low++;
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => (b.critical * 4 + b.high * 3 + b.medium * 2 + b.low) - (a.critical * 4 + a.high * 3 + a.medium * 2 + a.low))
      .map(([type, stats]) => ({ type, ...stats }));
  }, [incidents]);

  const maxCount = Math.max(...categories.map((c) => c.count), 1);

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#DCFCE7" }}>
            <Target className="w-5 h-5" style={{ color: "#16A34A" }} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>Root Cause Categories</h2>
            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Incident types ranked by risk impact and frequency</p>
          </div>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="p-12 text-center">
          <BarChart3 className="w-10 h-10 mx-auto mb-3" style={{ color: "#E5E7EB" }} />
          <p className="text-[13px]" style={{ color: "#9CA3AF" }}>No incident data available</p>
        </div>
      ) : (
        <div className="p-6 space-y-3.5">
          {categories.map(({ type, count, critical, high, medium, low }, idx) => {
            const barWidth = Math.round((count / maxCount) * 100);
            const riskColor = critical > 0 ? "#DC2626" : high > 0 ? "#EA580C" : medium > 0 ? "#D97706" : "#16A34A";
            return (
              <div key={type} className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                    style={{ background: riskColor + "20", color: riskColor }}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[13px] font-semibold truncate" style={{ color: "#111827" }}>{type}</span>
                      <span className="text-[12px] font-bold flex-shrink-0" style={{ color: riskColor }}>{count} incidents</span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background: "#F3F4F6" }}>
                      <div className="h-2 rounded-full transition-all" style={{ width: `${barWidth}%`, background: riskColor }} />
                    </div>
                  </div>
                </div>
                <div className="ml-8 flex items-center gap-3 flex-wrap">
                  {critical > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: "#DC2626", background: "#FEE2E2" }}>
                      {critical} critical
                    </span>
                  )}
                  {high > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: "#EA580C", background: "#FFEDD5" }}>
                      {high} high
                    </span>
                  )}
                  {medium > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: "#D97706", background: "#FEF3C7" }}>
                      {medium} medium
                    </span>
                  )}
                  {low > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: "#16A34A", background: "#DCFCE7" }}>
                      {low} low
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Recurring Patterns Section ───────────────────────────────────────────────

function RecurringPatternsSection({ incidents }: { incidents: Incident[] }) {
  const patterns = useMemo(() => {
    const typeMap: Record<string, Incident[]> = {};
    for (const i of incidents) {
      const type = i.type || "Unknown";
      if (!typeMap[type]) typeMap[type] = [];
      typeMap[type].push(i);
    }
    return Object.entries(typeMap)
      .filter(([, incs]) => incs.length > 1)
      .sort(([, a], [, b]) => b.length - a.length)
      .map(([type, incs]) => ({
        type,
        count: incs.length,
        latestSeverity: incs[0]?.severity || "unclassified",
        lastOccurred: incs.sort((a, b) => (b.occurred_at || "").localeCompare(a.occurred_at || ""))[0]?.occurred_at,
      }));
  }, [incidents]);

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#EDE9FE" }}>
            <Repeat className="w-5 h-5" style={{ color: "#7C3AED" }} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>Recurring Patterns</h2>
            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Incident types that have occurred more than once — systemic indicators</p>
          </div>
        </div>
      </div>

      {patterns.length === 0 ? (
        <div className="p-12 text-center">
          <Repeat className="w-10 h-10 mx-auto mb-3" style={{ color: "#E5E7EB" }} />
          <p className="text-[14px] font-semibold" style={{ color: "#374151" }}>No recurring patterns detected</p>
          <p className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>Each incident type has only occurred once.</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
              {["Incident Pattern", "Occurrences", "Highest Severity", "Last Occurrence", "Risk Level"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {patterns.map(({ type, count, latestSeverity, lastOccurred }) => {
              const sev = latestSeverity?.toLowerCase();
              const riskLevel = sev === "critical" ? "High Risk" : sev === "high" ? "Elevated" : sev === "medium" ? "Moderate" : "Low";
              const riskColor = sev === "critical" || sev === "high" ? "#DC2626" : sev === "medium" ? "#D97706" : "#16A34A";
              return (
                <tr key={type} className="border-t hover:bg-blue-50/30 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#7C3AED" }} />
                      <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>{type}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 text-[13px] font-bold" style={{ color: "#111827" }}>
                      <Repeat className="w-3.5 h-3.5" style={{ color: "#7C3AED" }} />
                      {count}×
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <SeverityBadge severity={latestSeverity} />
                  </td>
                  <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>
                    {lastOccurred ? new Date(lastOccurred).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[12px] font-bold" style={{ color: riskColor }}>{riskLevel}</span>
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

// ── Incident Details Table Section ────────────────────────────────────────────

function IncidentDetailsSection({ incidents }: { incidents: Incident[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return incidents.filter((i) =>
      !q || (i.title || "").toLowerCase().includes(q) || (i.type || "").toLowerCase().includes(q) || (i.description || "").toLowerCase().includes(q),
    );
  }, [incidents, search]);

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-6 pt-5 pb-4 border-b flex flex-wrap items-center gap-3" style={{ borderColor: "#F3F4F6" }}>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FEE2E2" }}>
            <TrendingUp className="w-5 h-5" style={{ color: "#DC2626" }} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>Incident Root Cause Detail</h2>
            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{filtered.length} record{filtered.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#9CA3AF" }} />
          <input
            className="pl-8 pr-3 py-2 rounded-xl border text-[12px] outline-none"
            style={{ borderColor: "#E5E7EB", width: 220 }}
            placeholder="Search by type or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
            {["Incident", "Type / Category", "Severity", "Status", "Description"].map((h) => (
              <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-12">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2" style={{ color: "#E5E7EB" }} />
                <p className="text-[13px]" style={{ color: "#9CA3AF" }}>No incidents found</p>
              </td>
            </tr>
          ) : (
            filtered.map((i) => (
              <tr key={i.id} className="border-t hover:bg-blue-50/30 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                <td className="px-5 py-3.5">
                  <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{i.title || "—"}</div>
                  <div className="text-[11px]" style={{ color: "#9CA3AF" }}>ID: {i.id.slice(0, 8)}</div>
                </td>
                <td className="px-5 py-3.5 text-[12px] font-medium" style={{ color: "#374151" }}>{i.type || "—"}</td>
                <td className="px-5 py-3.5"><SeverityBadge severity={i.severity} /></td>
                <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>
                  <span className="capitalize">{i.status?.replace(/_/g, " ") || "—"}</span>
                </td>
                <td className="px-5 py-3.5 max-w-xs">
                  <p className="text-[12px] truncate" style={{ color: "#6B7280" }} title={i.description}>
                    {i.description || "No description provided"}
                  </p>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function RootCausesPage() {
  const { data: incidents      = [], isLoading: l1, refetch: r1 } = useListIncidentsQuery();
  const { data: investigations = [], isLoading: l2, refetch: r2 } = useListInvestigationsQuery();
  const isLoading = l1 || l2;

  const uniqueTypes   = useMemo(() => new Set(incidents.map((i) => i.type)).size, [incidents]);
  const criticalCount = useMemo(() => incidents.filter((i) => i.severity === "critical").length, [incidents]);
  const recurringCount = useMemo(() => {
    const typeMap: Record<string, number> = {};
    for (const i of incidents) { const t = i.type || "Unknown"; typeMap[t] = (typeMap[t] || 0) + 1; }
    return Object.values(typeMap).filter((c) => c > 1).length;
  }, [incidents]);
  const withRcaCount = investigations.filter((inv) => inv.rca_method && inv.status !== "open").length;

  const handleRefresh = () => { r1(); r2(); };

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>
      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, #14532D 0%, #1C1917 100%)" }}>
        <div className="px-8 pt-8 pb-0">
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Incident Management
          </p>
          <h1 className="text-[26px] font-black text-white">Root Causes</h1>
          <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Root cause categories · Recurring patterns · Contributing factors
          </p>
        </div>
        <div className="flex border-t mt-6 divide-x" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <HeroStat label="Cause Categories"  value={isLoading ? "…" : uniqueTypes} />
          <HeroStat label="Recurring Patterns" value={isLoading ? "…" : recurringCount} />
          <HeroStat label="Critical Incidents" value={isLoading ? "…" : criticalCount} />
          <HeroStat label="RCAs Completed"     value={isLoading ? "…" : withRcaCount} />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Refresh */}
        <div className="flex justify-end">
          <button onClick={handleRefresh} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] font-semibold bg-white transition-colors hover:bg-gray-50"
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
            <RootCauseCategoriesSection incidents={incidents} />
            <RecurringPatternsSection incidents={incidents} />
            <IncidentDetailsSection incidents={incidents} />
          </>
        )}
      </div>
    </div>
  );
}
