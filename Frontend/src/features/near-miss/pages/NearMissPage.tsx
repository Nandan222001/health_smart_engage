import { useMemo, useState } from "react";
import {
  AlertTriangle, Search, RefreshCw, Loader2,
  AlertCircle, Flame, CheckCircle2, Filter,
  MapPin, Building2, Layers, BarChart3,
  ShieldAlert, Clock, Eye, TrendingUp,
} from "lucide-react";
import { useGetNearMissQuery } from "@/features/near-miss/api/nearMissApi";

// ── Shared Helpers ────────────────────────────────────────────────────────────

const SEV_ORDER = ["Critical", "High", "Medium", "Low"] as const;

const SEV_CFG: Record<string, { color: string; bg: string; border: string; Icon: React.ElementType }> = {
  Critical: { color: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5", Icon: Flame },
  High:     { color: "#EA580C", bg: "#FFEDD5", border: "#FDB898", Icon: AlertCircle },
  Medium:   { color: "#D97706", bg: "#FEF3C7", border: "#FCD34D", Icon: AlertTriangle },
  Low:      { color: "#16A34A", bg: "#DCFCE7", border: "#86EFAC", Icon: CheckCircle2 },
};

const INV_CFG: Record<string, { color: string; bg: string }> = {
  Completed:    { color: "#16A34A", bg: "#DCFCE7" },
  "In Progress":{ color: "#2563EB", bg: "#DBEAFE" },
  Pending:      { color: "#D97706", bg: "#FEF3C7" },
};

function sevCfg(s: string) { return SEV_CFG[s] ?? { color: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB", Icon: AlertTriangle }; }
function invCfg(s: string) { return INV_CFG[s] ?? { color: "#6B7280", bg: "#F3F4F6" }; }

function SevBadge({ sev }: { sev: string }) {
  const c = sevCfg(sev);
  return <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold" style={{ color: c.color, background: c.bg }}>{sev}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const isOpen = status === "Open" || status === "Under Investigation";
  return (
    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold"
      style={{ color: isOpen ? "#DC2626" : "#16A34A", background: isOpen ? "#FEE2E2" : "#DCFCE7" }}>{status}</span>
  );
}

function InvBadge({ status }: { status: string }) {
  const c = invCfg(status);
  return <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold" style={{ color: c.color, background: c.bg }}>{status}</span>;
}

function HeroStat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex-1 px-6 py-4 text-center">
      <div className="text-[26px] font-black text-white leading-none" style={color ? { color } : undefined}>{value}</div>
      <div className="text-[11px] font-semibold mt-1 uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.55)" }}>{label}</div>
    </div>
  );
}

function FilterBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
      style={active
        ? { background: "linear-gradient(135deg,#78350F,#B45309)", color: "#fff" }
        : { background: "#F1F5F9", color: "#64748B" }}>
      {label}
    </button>
  );
}

// ── TAB 1: Near Miss History ──────────────────────────────────────────────────

function NearMissHistoryTab({ records, isLoading, refetch }: { records: any[]; isLoading: boolean; refetch: () => void }) {
  const [search, setSearch]       = useState("");
  const [sevFilter, setSevFilter] = useState("all");
  const [statusFilter, setStatus] = useState("all");

  const filtered = useMemo(() => {
    let r = records;
    if (search) r = r.filter((x) =>
      (x.Title || "").toLowerCase().includes(search.toLowerCase()) ||
      (x.Category || "").toLowerCase().includes(search.toLowerCase()) ||
      (x.Site_ID || "").toLowerCase().includes(search.toLowerCase())
    );
    if (sevFilter !== "all")    r = r.filter((x) => x.Severity === sevFilter);
    if (statusFilter !== "all") r = r.filter((x) => x.Status === statusFilter);
    return [...r].sort((a, b) => SEV_ORDER.indexOf(a.Severity) - SEV_ORDER.indexOf(b.Severity));
  }, [records, search, sevFilter, statusFilter]);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
          <input className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-[13px] outline-none bg-white"
            style={{ borderColor: "#E3E9F6" }} placeholder="Search by title, category, or site…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button onClick={refetch} className="p-2.5 rounded-xl border bg-white hover:bg-gray-50 transition-colors" style={{ borderColor: "#E3E9F6" }}>
          <RefreshCw className="w-4 h-4" style={{ color: "#6B7280" }} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#9CA3AF" }} />
        <span className="text-[11px] font-semibold" style={{ color: "#9CA3AF" }}>Severity:</span>
        {["all", ...SEV_ORDER].map((s) => (
          <FilterBtn key={s} label={s === "all" ? "All" : s} active={sevFilter === s} onClick={() => setSevFilter(s)} />
        ))}
        <span className="text-[11px] font-semibold ml-3" style={{ color: "#9CA3AF" }}>Status:</span>
        {["all", "Open", "Under Investigation", "Closed"].map((s) => (
          <FilterBtn key={s} label={s === "all" ? "All" : s} active={statusFilter === s} onClick={() => setStatus(s)} />
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: "#F3F4F6" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#FEF3C7" }}>
            <AlertTriangle className="w-4 h-4" style={{ color: "#D97706" }} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>All Near Miss Records</h2>
            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{filtered.length} of {records.length} records · sorted by severity</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                {["Title / Category", "Severity", "Status", "Investigation", "Site / Zone", "Potential Outcome", "Reported By", "Date"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "#9CA3AF" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" style={{ color: "#D1D5DB" }} />
                  <p className="text-[13px]" style={{ color: "#9CA3AF" }}>Loading records…</p>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-14">
                  <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: "#E5E7EB" }} />
                  <p className="text-[14px] font-semibold" style={{ color: "#374151" }}>No records found</p>
                  <p className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>Try adjusting your filters.</p>
                </td></tr>
              ) : filtered.map((r) => (
                <tr key={r.NearMiss_ID} className="border-t hover:bg-amber-50/20 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-5 py-3.5 max-w-[200px]">
                    <div className="text-[13px] font-semibold truncate" style={{ color: "#111827" }} title={r.Title}>{r.Title}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>{r.Category}</div>
                  </td>
                  <td className="px-5 py-3.5"><SevBadge sev={r.Severity} /></td>
                  <td className="px-5 py-3.5"><StatusBadge status={r.Status} /></td>
                  <td className="px-5 py-3.5"><InvBadge status={r.Investigation_Status} /></td>
                  <td className="px-5 py-3.5">
                    <div className="text-[12px] font-semibold" style={{ color: "#374151" }}>{r.Site_ID || "—"}</div>
                    <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{r.Zone_ID || "—"}</div>
                  </td>
                  <td className="px-5 py-3.5 max-w-[160px]">
                    <p className="text-[11px] truncate" style={{ color: "#6B7280" }} title={r.Potential_Outcome}>{r.Potential_Outcome || "—"}</p>
                  </td>
                  <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{r.Reported_By || "—"}</td>
                  <td className="px-5 py-3.5 text-[12px] whitespace-nowrap" style={{ color: "#9CA3AF" }}>{r.Incident_Date || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── TAB 2: Unsafe Events ──────────────────────────────────────────────────────

function UnsafeEventsTab({ records, isLoading, refetch }: { records: any[]; isLoading: boolean; refetch: () => void }) {
  const openEvents = records.filter((r) => r.Status !== "Closed");

  const categoryStats = useMemo(() => {
    const map: Record<string, { total: number; Critical: number; High: number; Medium: number; Low: number; open: number }> = {};
    for (const r of records) {
      const cat = r.Category || "Unclassified";
      if (!map[cat]) map[cat] = { total: 0, Critical: 0, High: 0, Medium: 0, Low: 0, open: 0 };
      map[cat].total++;
      if (r.Severity === "Critical") map[cat].Critical++;
      else if (r.Severity === "High") map[cat].High++;
      else if (r.Severity === "Medium") map[cat].Medium++;
      else map[cat].Low++;
      if (r.Status !== "Closed") map[cat].open++;
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b.Critical - a.Critical || b.High - a.High || b.total - a.total);
  }, [records]);

  const outcomeGroups = useMemo(() => {
    const map: Record<string, { count: number; critical: number }> = {};
    for (const r of records) {
      const key = r.Potential_Outcome || "Unknown";
      if (!map[key]) map[key] = { count: 0, critical: 0 };
      map[key].count++;
      if (r.Severity === "Critical" || r.Severity === "High") map[key].critical++;
    }
    return Object.entries(map).sort(([, a], [, b]) => b.critical - a.critical || b.count - a.count).slice(0, 8);
  }, [records]);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={refetch} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] font-semibold bg-white hover:bg-gray-50 transition-colors"
          style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
          <RefreshCw className="w-3.5 h-3.5" />Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-7 h-7 animate-spin" style={{ color: "#D1D5DB" }} /></div>
      ) : (
        <>
          {/* Open unsafe events alert */}
          {openEvents.length > 0 && (
            <div className="rounded-2xl border p-5" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#FEF3C7" }}>
                  <Eye className="w-4 h-4" style={{ color: "#D97706" }} />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold" style={{ color: "#92400E" }}>
                    {openEvents.length} Open Unsafe Event{openEvents.length !== 1 ? "s" : ""} — Require Attention
                  </h3>
                  <p className="text-[11px]" style={{ color: "#A16207" }}>These events are unresolved and may pose ongoing risk.</p>
                </div>
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {openEvents
                  .sort((a, b) => SEV_ORDER.indexOf(a.Severity) - SEV_ORDER.indexOf(b.Severity))
                  .map((r) => (
                    <div key={r.NearMiss_ID} className="bg-white rounded-xl border px-4 py-3 flex items-center gap-3" style={{ borderColor: "#FDE68A" }}>
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: sevCfg(r.Severity).color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold truncate" style={{ color: "#111827" }}>{r.Title}</div>
                        <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{r.Category} · {r.Site_ID || "—"}</div>
                      </div>
                      <SevBadge sev={r.Severity} />
                      <StatusBadge status={r.Status} />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Category breakdown */}
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
            <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FEF3C7" }}>
                  <BarChart3 className="w-5 h-5" style={{ color: "#D97706" }} />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>Unsafe Events by Category</h2>
                  <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Severity profile across {categoryStats.length} event categories</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {categoryStats.length === 0 ? (
                <p className="text-center text-[13px] py-8" style={{ color: "#9CA3AF" }}>No event data available</p>
              ) : categoryStats.map(([cat, counts]) => {
                const total = counts.total;
                return (
                  <div key={cat} className="rounded-xl border px-4 py-3" style={{ background: "#FAFBFF", borderColor: "#E9EEF8" }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
                        <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>{cat}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {counts.open > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>{counts.open} open</span>
                        )}
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#374151" }}>{total} total</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-px h-3.5 rounded-full overflow-hidden mb-2">
                      {SEV_ORDER.map((sev) => {
                        const cnt = counts[sev] || 0;
                        if (!cnt) return null;
                        const pct = Math.round((cnt / total) * 100);
                        return (
                          <div key={sev} style={{ width: `${pct}%`, background: SEV_CFG[sev].color, minWidth: 12 }}
                            className="h-full flex items-center justify-center text-white text-[9px] font-bold">{cnt}</div>
                        );
                      })}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {SEV_ORDER.map((sev) => {
                        const cnt = counts[sev] || 0;
                        if (!cnt) return null;
                        return (
                          <span key={sev} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ color: SEV_CFG[sev].color, background: SEV_CFG[sev].bg }}>{cnt} {sev}</span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Potential Outcomes */}
          {outcomeGroups.length > 0 && (
            <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
              <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FEE2E2" }}>
                    <TrendingUp className="w-5 h-5" style={{ color: "#DC2626" }} />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>Top Potential Outcomes</h2>
                    <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Most common consequences if events had escalated</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-2.5">
                {outcomeGroups.map(([outcome, data], idx) => {
                  const maxCount = outcomeGroups[0][1].count;
                  const pct = Math.round((data.count / maxCount) * 100);
                  return (
                    <div key={outcome} className="flex items-center gap-4">
                      <div className="w-5 text-[11px] font-black text-center" style={{ color: "#9CA3AF" }}>#{idx + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-semibold truncate" style={{ color: "#374151" }} title={outcome}>{outcome}</span>
                          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                            {data.critical > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>{data.critical} high-risk</span>
                            )}
                            <span className="text-[11px] font-bold" style={{ color: "#374151" }}>{data.count}</span>
                          </div>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: data.critical > 0 ? "#DC2626" : "#D97706" }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── TAB 3: High-Risk Areas ────────────────────────────────────────────────────

function HighRiskAreasTab({ records, isLoading, refetch }: { records: any[]; isLoading: boolean; refetch: () => void }) {
  const [selectedSite, setSelectedSite] = useState<string | null>(null);

  const siteStats = useMemo(() => {
    const map: Record<string, { total: number; Critical: number; High: number; Medium: number; Low: number; open: number; zones: Set<string> }> = {};
    for (const r of records) {
      const site = r.Site_ID || "Unassigned";
      if (!map[site]) map[site] = { total: 0, Critical: 0, High: 0, Medium: 0, Low: 0, open: 0, zones: new Set() };
      map[site].total++;
      if (r.Severity === "Critical") map[site].Critical++;
      else if (r.Severity === "High") map[site].High++;
      else if (r.Severity === "Medium") map[site].Medium++;
      else map[site].Low++;
      if (r.Status !== "Closed") map[site].open++;
      if (r.Zone_ID) map[site].zones.add(r.Zone_ID);
    }
    return Object.entries(map)
      .map(([site, data]) => ({ site, ...data, zoneCount: data.zones.size }))
      .sort((a, b) => b.Critical - a.Critical || b.High - a.High || b.total - a.total);
  }, [records]);

  const zoneStats = useMemo(() => {
    const map: Record<string, { site: string; total: number; Critical: number; High: number; open: number }> = {};
    for (const r of records) {
      const zone = r.Zone_ID || "—";
      if (!map[zone]) map[zone] = { site: r.Site_ID || "—", total: 0, Critical: 0, High: 0, open: 0 };
      map[zone].total++;
      if (r.Severity === "Critical") map[zone].Critical++;
      if (r.Severity === "High") map[zone].High++;
      if (r.Status !== "Closed") map[zone].open++;
    }
    return Object.entries(map)
      .map(([zone, data]) => ({ zone, ...data }))
      .filter((z) => z.zone !== "—")
      .sort((a, b) => b.Critical - a.Critical || b.High - a.High || b.total - a.total);
  }, [records]);

  const activeSiteRecords = useMemo(() => {
    if (!selectedSite) return [];
    return records
      .filter((r) => (r.Site_ID || "Unassigned") === selectedSite)
      .sort((a, b) => SEV_ORDER.indexOf(a.Severity) - SEV_ORDER.indexOf(b.Severity));
  }, [records, selectedSite]);

  const criticalSites = siteStats.filter((s) => s.Critical > 0 || s.High > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={refetch} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] font-semibold bg-white hover:bg-gray-50 transition-colors"
          style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
          <RefreshCw className="w-3.5 h-3.5" />Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-7 h-7 animate-spin" style={{ color: "#D1D5DB" }} /></div>
      ) : (
        <>
          {/* Site risk summary alert */}
          {criticalSites > 0 && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl border" style={{ background: "#FFF1F2", borderColor: "#FECDD3" }}>
              <Flame className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#DC2626" }} />
              <p className="text-[12px] font-semibold" style={{ color: "#991B1B" }}>
                {criticalSites} site{criticalSites !== 1 ? "s" : ""} have critical or high-severity near miss events — prioritise safety reviews.
              </p>
            </div>
          )}

          {/* Site cards */}
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
            <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#DBEAFE" }}>
                  <Building2 className="w-5 h-5" style={{ color: "#2563EB" }} />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>Sites by Risk Level</h2>
                  <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{siteStats.length} sites · click a site to see its events</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {siteStats.length === 0 ? (
                <div className="py-12 text-center">
                  <Building2 className="w-10 h-10 mx-auto mb-3" style={{ color: "#E5E7EB" }} />
                  <p className="text-[13px]" style={{ color: "#9CA3AF" }}>No site data available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {siteStats.map((s) => {
                    const riskColor = s.Critical > 0 ? "#DC2626" : s.High > 0 ? "#EA580C" : s.open > 0 ? "#D97706" : "#16A34A";
                    const riskBg    = s.Critical > 0 ? "#FEE2E2" : s.High > 0 ? "#FFEDD5" : s.open > 0 ? "#FEF3C7" : "#DCFCE7";
                    const isSelected = selectedSite === s.site;
                    return (
                      <button key={s.site} onClick={() => setSelectedSite(isSelected ? null : s.site)}
                        className="text-left rounded-xl border p-4 transition-all"
                        style={{ background: isSelected ? "#EEF2FF" : "#FAFBFF", borderColor: isSelected ? "#6366F1" : "#E9EEF8", boxShadow: isSelected ? "0 0 0 2px #6366F133" : "none" }}>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: riskColor }} />
                            <div className="text-[13px] font-bold" style={{ color: "#111827" }}>{s.site}</div>
                          </div>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: riskBg, color: riskColor }}>
                            {s.total} event{s.total !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-px h-2.5 rounded-full overflow-hidden mb-2">
                          {SEV_ORDER.map((sev) => {
                            const cnt = (s as any)[sev] || 0;
                            if (!cnt) return null;
                            const pct = Math.round((cnt / s.total) * 100);
                            return <div key={sev} style={{ width: `${pct}%`, background: SEV_CFG[sev].color }} className="h-full" />;
                          })}
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {s.Critical > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>{s.Critical} critical</span>}
                          {s.High > 0     && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#FFEDD5", color: "#EA580C" }}>{s.High} high</span>}
                          {s.open > 0     && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#D97706" }}>{s.open} open</span>}
                          {s.zoneCount > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#6B7280" }}>{s.zoneCount} zone{s.zoneCount !== 1 ? "s" : ""}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Drill-down table */}
              {selectedSite && activeSiteRecords.length > 0 && (
                <div className="mt-5 rounded-xl border overflow-hidden" style={{ borderColor: "#C7D2FE", background: "#EEF2FF" }}>
                  <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "#C7D2FE", background: "#E0E7FF" }}>
                    <MapPin className="w-4 h-4" style={{ color: "#6366F1" }} />
                    <span className="text-[13px] font-bold" style={{ color: "#3730A3" }}>{selectedSite} — Events Detail</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: "#EEF2FF", borderBottom: "1px solid #C7D2FE" }}>
                        {["Event", "Severity", "Status", "Zone", "Date"].map((h) => (
                          <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#6366F1" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activeSiteRecords.map((r) => (
                        <tr key={r.NearMiss_ID || r.id} className="border-t bg-white" style={{ borderColor: "#E0E7FF" }}>
                          <td className="px-4 py-3">
                            <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{r.Title || r.title}</div>
                            <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{r.Category || r.category}</div>
                          </td>
                          <td className="px-4 py-3"><SevBadge sev={r.Severity || r.severity} /></td>
                          <td className="px-4 py-3"><StatusBadge status={r.Status || r.status} /></td>
                          <td className="px-4 py-3 text-[12px]" style={{ color: "#6B7280" }}>{r.Zone_ID || r.zone_id || "—"}</td>
                          <td className="px-4 py-3 text-[12px]" style={{ color: "#9CA3AF" }}>{r.Incident_Date || r.created_at || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Zone breakdown */}
          {zoneStats.length > 0 && (
            <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
              <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#EDE9FE" }}>
                    <Layers className="w-5 h-5" style={{ color: "#7C3AED" }} />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>Zone-Level Risk Breakdown</h2>
                    <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{zoneStats.length} zones with near miss events</p>
                  </div>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                    {["Zone", "Site", "Total Events", "Critical", "High-Risk", "Open"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {zoneStats.map((z) => (
                    <tr key={z.zone} className="border-t hover:bg-blue-50/20 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: z.Critical > 0 ? "#DC2626" : "#9CA3AF" }} />
                          <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>{z.zone}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{z.site}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.min((z.total / (zoneStats[0]?.total || 1)) * 100, 100)}%`, background: z.Critical > 0 ? "#DC2626" : "#D97706" }} />
                          </div>
                          <span className="text-[13px] font-bold" style={{ color: "#111827" }}>{z.total}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {z.Critical > 0
                          ? <span className="text-[12px] font-bold" style={{ color: "#DC2626" }}>{z.Critical}</span>
                          : <span className="text-[11px]" style={{ color: "#9CA3AF" }}>—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {z.Critical + z.High > 0
                          ? <span className="text-[12px] font-bold" style={{ color: "#EA580C" }}>{z.Critical + z.High}</span>
                          : <span className="text-[11px]" style={{ color: "#9CA3AF" }}>—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {z.open > 0
                          ? <span className="text-[12px] font-bold" style={{ color: "#D97706" }}>{z.open} open</span>
                          : <span className="text-[11px]" style={{ color: "#16A34A" }}>All closed</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS: { key: string; label: string }[] = [
  { key: "history", label: "Near Miss History" },
  { key: "unsafe",  label: "Unsafe Events" },
  { key: "areas",   label: "High-Risk Areas" },
];

export function NearMissPage() {
  const { data: rawRecords = [], isLoading, refetch } = useGetNearMissQuery();
  const [activeTab, setActiveTab] = useState("history");

  const records = useMemo(() => {
     return Array.isArray(rawRecords) ? rawRecords : ((rawRecords as any)?.items ?? []);
  }, [rawRecords]);

  const total       = records.length;
  const critical    = records.filter((r: any) => (r.Severity || r.severity) === "Critical").length;
  const underInv    = records.filter((r: any) => (r.Status || r.status) === "Under Investigation").length;
  const closed      = records.filter((r: any) => (r.Status || r.status) === "Closed").length;

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>
      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, #78350F 0%, #1C1917 100%)" }}>
        <div className="px-8 pt-8 pb-0">
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Risk Module</p>
          <h1 className="text-[26px] font-black text-white">Near Miss Reports</h1>
          <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Track, analyse, and act on near miss events before they escalate
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex border-t mt-6 divide-x" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <HeroStat label="Total Events"        value={isLoading ? "…" : total} />
          <HeroStat label="Critical"            value={isLoading ? "…" : critical}  color="#FCA5A5" />
          <HeroStat label="Under Investigation" value={isLoading ? "…" : underInv}  color="#FCD34D" />
          <HeroStat label="Closed"              value={isLoading ? "…" : closed}    color="#86EFAC" />
        </div>

        {/* Tab bar */}
        <div className="px-6 pt-4 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="px-5 py-2.5 text-[13px] font-semibold rounded-t-xl transition-all whitespace-nowrap"
              style={activeTab === tab.key
                ? { background: "#F5F7FF", color: "#111827" }
                : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.65)" }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === "history" && <NearMissHistoryTab records={records} isLoading={isLoading} refetch={refetch} />}
        {activeTab === "unsafe"  && <UnsafeEventsTab   records={records} isLoading={isLoading} refetch={refetch} />}
        {activeTab === "areas"   && <HighRiskAreasTab   records={records} isLoading={isLoading} refetch={refetch} />}
      </div>
    </div>
  );
}
