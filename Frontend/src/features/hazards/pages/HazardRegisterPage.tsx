import { useMemo, useState } from "react";
import {
  ShieldAlert, Search, AlertTriangle, CheckCircle2, XCircle,
  MapPin, Layers, BarChart3, Shield, Globe, Clock, Filter,
} from "lucide-react";
import { useListHazardsQuery } from "@/features/hazards/api/hazardsApi";
import { useGetSitesQuery, useGetZonesQuery } from "@/features/sites/api/sitesApi";
import type { Hazard } from "@/features/hazards/api/hazardsApi";

// ─── colour maps ───────────────────────────────────────────────────────────────
const SEV_COLOR: Record<string, string> = {
  low: "#10B981", medium: "#F59E0B", high: "#F97316", critical: "#EF4444",
};
const SEV_BG: Record<string, string> = {
  low: "#D1FAE5", medium: "#FEF3C7", high: "#FFEDD5", critical: "#FEE2E2",
};
const STATUS_COLOR: Record<string, string> = {
  open: "#EF4444", mitigated: "#10B981", closed: "#9CA3AF",
};
const STATUS_BG: Record<string, string> = {
  open: "#FEE2E2", mitigated: "#D1FAE5", closed: "#F3F4F6",
};
const SEV_ORDER: Hazard["severity"][] = ["critical", "high", "medium", "low"];

// ─── shared components ─────────────────────────────────────────────────────────
function HeroStat({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
      <div className="text-3xl font-bold" style={{ color }}>{value}</div>
      <div className="text-sm font-semibold mt-1" style={{ color: "#111827" }}>{label}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{sub}</div>}
    </div>
  );
}

function SevBadge({ sev }: { sev: string }) {
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ background: SEV_BG[sev] || "#F3F4F6", color: SEV_COLOR[sev] || "#6B7280" }}>
      {sev}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ background: STATUS_BG[status] || "#F3F4F6", color: STATUS_COLOR[status] || "#6B7280" }}>
      {status}
    </span>
  );
}

function SectionCard({ title, icon: Icon, children, accent = "#4A57B9" }: {
  title: string; icon: React.ElementType; children: React.ReactNode; accent?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
      <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: "#F0F4FC", background: "#FAFBFF" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: accent + "18" }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        <span className="text-base font-bold" style={{ color: "#111827" }}>{title}</span>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function FilterBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
      style={active
        ? { background: "linear-gradient(135deg,#4A57B9,#6F80E8)", color: "#fff", boxShadow: "0 2px 8px rgba(74,87,185,0.22)" }
        : { background: "#F1F5F9", color: "#64748B" }}>
      {label}
    </button>
  );
}

function SevBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 text-xs font-semibold capitalize" style={{ color: "#374151" }}>{label}</div>
      <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="w-8 text-right text-xs font-bold" style={{ color }}>{count}</div>
      <div className="w-8 text-right text-xs" style={{ color: "#9CA3AF" }}>{pct}%</div>
    </div>
  );
}

// ─── Section 1: Hazard List ────────────────────────────────────────────────────
function HazardListSection({ hazards, loading }: { hazards: Hazard[]; loading: boolean }) {
  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    let h = hazards;
    if (search) h = h.filter((x) => x.title.toLowerCase().includes(search.toLowerCase()) || (x.type || "").toLowerCase().includes(search.toLowerCase()));
    if (sevFilter !== "all") h = h.filter((x) => x.severity === sevFilter);
    if (statusFilter !== "all") h = h.filter((x) => x.status === statusFilter);
    return [...h].sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity));
  }, [hazards, search, sevFilter, statusFilter]);

  return (
    <SectionCard title="Hazard List" icon={ShieldAlert} accent="#EF4444">
      {/* Search + filters */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: "#E3E9F6", background: "#F9FAFB" }}
            placeholder="Search hazards by title or type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5" style={{ color: "#9CA3AF" }} />
          <span className="text-xs" style={{ color: "#9CA3AF" }}>Severity:</span>
          {["all", "critical", "high", "medium", "low"].map((s) => (
            <FilterBtn key={s} label={s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)} active={sevFilter === s} onClick={() => setSevFilter(s)} />
          ))}
          <span className="text-xs ml-3" style={{ color: "#9CA3AF" }}>Status:</span>
          {["all", "open", "mitigated", "closed"].map((s) => (
            <FilterBtn key={s} label={s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
          ))}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#E9EEF8" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
              {["Hazard / Type", "Severity", "Status", "Site / Zone", "Reported By", "Identified"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: "#9CA3AF" }}>Loading hazards…</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <ShieldAlert className="w-8 h-8 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
                  <p className="text-sm" style={{ color: "#6B7280" }}>No hazards match the current filters</p>
                </td>
              </tr>
            ) : filtered.map((h) => (
              <tr key={h.id} className="border-t hover:bg-blue-50/30 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                <td className="px-4 py-3">
                  <div className="text-sm font-semibold" style={{ color: "#111827" }}>{h.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{h.type || "—"}</div>
                </td>
                <td className="px-4 py-3"><SevBadge sev={h.severity} /></td>
                <td className="px-4 py-3"><StatusBadge status={h.status} /></td>
                <td className="px-4 py-3">
                  <div className="text-xs" style={{ color: "#6B7280" }}>{h.site_id || "—"}</div>
                  {h.zone_id && <div className="text-xs" style={{ color: "#9CA3AF" }}>{h.zone_id}</div>}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: "#6B7280" }}>{h.reported_by}</td>
                <td className="px-4 py-3 text-xs" style={{ color: "#9CA3AF" }}>
                  {h.identified_at ? new Date(h.identified_at).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 text-xs" style={{ color: "#9CA3AF" }}>
        Showing {filtered.length} of {hazards.length} hazards
      </div>
    </SectionCard>
  );
}

// ─── Section 2: Hazard Severity ────────────────────────────────────────────────
function HazardSeveritySection({ hazards }: { hazards: Hazard[] }) {
  const criticalList = hazards.filter((h) => h.severity === "critical");
  const highList     = hazards.filter((h) => h.severity === "high");
  const medList      = hazards.filter((h) => h.severity === "medium");
  const lowList      = hazards.filter((h) => h.severity === "low");

  const typeGroups = useMemo(() => {
    const map: Record<string, { total: number; critical: number; high: number }> = {};
    for (const h of hazards) {
      const t = h.type || "Unclassified";
      if (!map[t]) map[t] = { total: 0, critical: 0, high: 0 };
      map[t].total++;
      if (h.severity === "critical") map[t].critical++;
      if (h.severity === "high") map[t].high++;
    }
    return Object.entries(map).sort((a, b) => b[1].critical - a[1].critical || b[1].high - a[1].high);
  }, [hazards]);

  const openCritical = criticalList.filter((h) => h.status === "open").length;

  return (
    <SectionCard title="Hazard Severity" icon={BarChart3} accent="#F97316">
      {openCritical > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5 border" style={{ background: "#FFF1F2", borderColor: "#FECDD3" }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "#EF4444" }} />
          <p className="text-sm font-semibold" style={{ color: "#991B1B" }}>
            {openCritical} critical hazard{openCritical !== 1 ? "s" : ""} remain open and unmitigated — immediate action required.
          </p>
        </div>
      )}

      {/* Tally cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        {[
          { label: "Critical", list: criticalList, color: "#EF4444" },
          { label: "High",     list: highList,     color: "#F97316" },
          { label: "Medium",   list: medList,       color: "#F59E0B" },
          { label: "Low",      list: lowList,       color: "#10B981" },
        ].map(({ label, list, color }) => (
          <div key={label} className="rounded-xl p-4 border text-center" style={{ background: color + "0D", borderColor: color + "33" }}>
            <div className="text-3xl font-bold" style={{ color }}>{list.length}</div>
            <div className="text-xs font-semibold mt-1" style={{ color: "#374151" }}>{label}</div>
            <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
              {list.filter((h) => h.status === "open").length} open
            </div>
          </div>
        ))}
      </div>

      {/* Severity distribution bar */}
      <div className="space-y-3 mb-6">
        <div className="text-sm font-semibold mb-2" style={{ color: "#374151" }}>Severity Distribution</div>
        {([["critical", "#EF4444"], ["high", "#F97316"], ["medium", "#F59E0B"], ["low", "#10B981"]] as const).map(([sev, color]) => (
          <SevBar key={sev} label={sev} count={hazards.filter((h) => h.severity === sev).length} total={hazards.length} color={color} />
        ))}
      </div>

      {/* By hazard type */}
      <div className="text-sm font-semibold mb-3" style={{ color: "#374151" }}>Severity by Hazard Type</div>
      <div className="space-y-2">
        {typeGroups.map(([type, counts]) => (
          <div key={type} className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ background: "#FAFBFF", borderColor: "#E9EEF8" }}>
            <Layers className="w-4 h-4 flex-shrink-0" style={{ color: "#94A3B8" }} />
            <span className="flex-1 text-sm font-medium" style={{ color: "#111827" }}>{type}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#374151" }}>
              {counts.total} total
            </span>
            {counts.critical > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#EF4444" }}>
                {counts.critical} critical
              </span>
            )}
            {counts.high > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FFEDD5", color: "#F97316" }}>
                {counts.high} high
              </span>
            )}
          </div>
        ))}
        {typeGroups.length === 0 && (
          <div className="text-center py-8 text-sm" style={{ color: "#9CA3AF" }}>No hazard type data available</div>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Section 3: Risk Controls ──────────────────────────────────────────────────
function RiskControlsSection({ hazards }: { hazards: Hazard[] }) {
  const withControls    = hazards.filter((h) => !!(h.mitigation && h.mitigation.trim()));
  const withoutControls = hazards.filter((h) => !(h.mitigation && h.mitigation.trim()));
  const controlledMitigated = withControls.filter((h) => h.status === "mitigated" || h.status === "closed").length;
  const controlledOpen      = withControls.filter((h) => h.status === "open").length;
  const uncontrolledCritical = withoutControls.filter((h) => h.severity === "critical" || h.severity === "high").length;

  return (
    <SectionCard title="Risk Controls" icon={Shield} accent="#7C3AED">
      {uncontrolledCritical > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5 border" style={{ background: "#FFF7ED", borderColor: "#FED7AA" }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "#F97316" }} />
          <p className="text-sm font-semibold" style={{ color: "#9A3412" }}>
            {uncontrolledCritical} critical/high hazard{uncontrolledCritical !== 1 ? "s" : ""} have no risk control defined — assign mitigation measures urgently.
          </p>
        </div>
      )}

      {/* Overview tallies */}
      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        {[
          { label: "Hazards with Controls", value: withControls.length,    color: "#7C3AED", bg: "#EDE9FE" },
          { label: "Controls Effective",     value: controlledMitigated,   color: "#10B981", bg: "#D1FAE5" },
          { label: "Controls Open",          value: controlledOpen,         color: "#F59E0B", bg: "#FEF3C7" },
          { label: "No Controls Assigned",   value: withoutControls.length, color: "#EF4444", bg: "#FEE2E2" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="rounded-xl p-4 border text-center" style={{ background: bg, borderColor: color + "44" }}>
            <div className="text-2xl font-bold" style={{ color }}>{value}</div>
            <div className="text-xs font-semibold mt-1" style={{ color: "#374151" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* With controls */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4" style={{ color: "#10B981" }} />
          <span className="text-sm font-bold" style={{ color: "#111827" }}>Hazards with Risk Controls ({withControls.length})</span>
        </div>
        {withControls.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "#9CA3AF" }}>No hazards have controls recorded yet</p>
        ) : (
          <div className="space-y-2">
            {withControls.sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity)).map((h) => (
              <div key={h.id} className="rounded-xl border p-4" style={{ background: "#FAFBFF", borderColor: "#E9EEF8" }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "#111827" }}>{h.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{h.type || "—"}</div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <SevBadge sev={h.severity} />
                    <StatusBadge status={h.status} />
                  </div>
                </div>
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                  <Shield className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#10B981" }} />
                  <p className="text-xs" style={{ color: "#166534" }}>{h.mitigation}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Without controls */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <XCircle className="w-4 h-4" style={{ color: "#EF4444" }} />
          <span className="text-sm font-bold" style={{ color: "#111827" }}>Hazards Without Controls ({withoutControls.length})</span>
        </div>
        {withoutControls.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color: "#10B981" }} />
            <p className="text-sm font-semibold" style={{ color: "#10B981" }}>All hazards have risk controls assigned</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#E9EEF8" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#FFF5F5", borderBottom: "1px solid #FEE2E2" }}>
                  {["Hazard", "Type", "Severity", "Status", "Reported By"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "#EF4444" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {withoutControls.sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity)).map((h) => (
                  <tr key={h.id} className="border-t" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#111827" }}>{h.title}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{h.type || "—"}</td>
                    <td className="px-4 py-3"><SevBadge sev={h.severity} /></td>
                    <td className="px-4 py-3"><StatusBadge status={h.status} /></td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#6B7280" }}>{h.reported_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Section 4: Site Mapping ───────────────────────────────────────────────────
function SiteMappingSection({ hazards, sitesLoading, zonesLoading }: {
  hazards: Hazard[];
  sitesLoading: boolean;
  zonesLoading: boolean;
}) {
  const { data: sites = [] } = useGetSitesQuery();
  const { data: zones  = [] } = useGetZonesQuery();
  const [selectedSite, setSelectedSite] = useState<string | null>(null);

  const siteMap = useMemo(() => {
    const map: Record<string, { name: string; location: string; hazards: Hazard[] }> = {};
    // seed from sites API
    for (const s of sites) {
      map[s.Site_ID] = { name: s.Site_Name, location: s.Location, hazards: [] };
    }
    // assign hazards
    for (const h of hazards) {
      const key = h.site_id || "__unassigned__";
      if (!map[key]) map[key] = { name: key === "__unassigned__" ? "Unassigned" : h.site_id!, location: "—", hazards: [] };
      map[key].hazards.push(h);
    }
    return Object.entries(map)
      .map(([id, data]) => ({ id, ...data }))
      .filter((s) => s.hazards.length > 0)
      .sort((a, b) => {
        const critA = a.hazards.filter((h) => h.severity === "critical").length;
        const critB = b.hazards.filter((h) => h.severity === "critical").length;
        return critB - critA || b.hazards.length - a.hazards.length;
      });
  }, [hazards, sites]);

  const zoneMap = useMemo(() => {
    const map: Record<string, { name: string; type: string; riskScore: number; hazards: Hazard[] }> = {};
    for (const z of zones) {
      map[z.Zone_ID] = { name: z.Zone_Name, type: z.Zone_Type, riskScore: z.Risk_Score, hazards: [] };
    }
    for (const h of hazards) {
      if (!h.zone_id) continue;
      if (!map[h.zone_id]) map[h.zone_id] = { name: h.zone_id, type: "—", riskScore: 0, hazards: [] };
      map[h.zone_id].hazards.push(h);
    }
    return Object.entries(map)
      .map(([id, data]) => ({ id, ...data }))
      .filter((z) => z.hazards.length > 0)
      .sort((a, b) => b.hazards.filter((h) => h.severity === "critical").length - a.hazards.filter((h) => h.severity === "critical").length);
  }, [hazards, zones]);

  const sitesWithHighRisk = siteMap.filter((s) =>
    s.hazards.some((h) => h.severity === "critical" || h.severity === "high"),
  ).length;

  const activeSite = selectedSite ? siteMap.find((s) => s.id === selectedSite) : null;

  return (
    <SectionCard title="Site Mapping" icon={MapPin} accent="#0EA5E9">
      {sitesWithHighRisk > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5 border" style={{ background: "#EFF6FF", borderColor: "#BFDBFE" }}>
          <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: "#3B82F6" }} />
          <p className="text-sm font-semibold" style={{ color: "#1E40AF" }}>
            {sitesWithHighRisk} site{sitesWithHighRisk !== 1 ? "s" : ""} have critical or high-severity hazards — review site safety plans.
          </p>
        </div>
      )}

      {/* Site grid */}
      <div className="text-sm font-semibold mb-3" style={{ color: "#374151" }}>Sites with Reported Hazards</div>
      {sitesLoading ? (
        <div className="text-center py-10 text-sm" style={{ color: "#9CA3AF" }}>Loading site data…</div>
      ) : siteMap.length === 0 ? (
        <div className="text-center py-10">
          <Globe className="w-8 h-8 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
          <p className="text-sm" style={{ color: "#6B7280" }}>No site data available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-2">
          {siteMap.map((site) => {
            const critCount = site.hazards.filter((h) => h.severity === "critical").length;
            const highCount = site.hazards.filter((h) => h.severity === "high").length;
            const openCount = site.hazards.filter((h) => h.status === "open").length;
            const isSelected = selectedSite === site.id;
            return (
              <button
                key={site.id}
                onClick={() => setSelectedSite(isSelected ? null : site.id)}
                className="text-left rounded-xl border p-4 transition-all"
                style={{
                  background: isSelected ? "#EEF2FF" : "#FAFBFF",
                  borderColor: isSelected ? "#6366F1" : "#E9EEF8",
                  boxShadow: isSelected ? "0 0 0 2px #6366F133" : "none",
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="text-sm font-bold" style={{ color: "#111827" }}>{site.name}</div>
                    {site.location !== "—" && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" style={{ color: "#9CA3AF" }} />
                        <span className="text-xs" style={{ color: "#9CA3AF" }}>{site.location}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: critCount > 0 ? "#FEE2E2" : highCount > 0 ? "#FFEDD5" : "#F3F4F6", color: critCount > 0 ? "#EF4444" : highCount > 0 ? "#F97316" : "#6B7280" }}>
                    {site.hazards.length} hazard{site.hazards.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {critCount > 0 && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#EF4444" }}>{critCount} critical</span>}
                  {highCount > 0 && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FFEDD5", color: "#F97316" }}>{highCount} high</span>}
                  {openCount > 0 && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>{openCount} open</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Expanded site detail */}
      {activeSite && (
        <div className="mb-6 rounded-xl border overflow-hidden" style={{ borderColor: "#C7D2FE", background: "#EEF2FF" }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "#C7D2FE", background: "#E0E7FF" }}>
            <span className="text-sm font-bold" style={{ color: "#3730A3" }}>{activeSite.name} — Hazard Detail</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#EEF2FF", borderBottom: "1px solid #C7D2FE" }}>
                {["Hazard", "Severity", "Status", "Zone", "Reporter"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "#6366F1" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeSite.hazards.sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity)).map((h) => (
                <tr key={h.id} className="border-t bg-white" style={{ borderColor: "#E0E7FF" }}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold" style={{ color: "#111827" }}>{h.title}</div>
                    <div className="text-xs" style={{ color: "#9CA3AF" }}>{h.type || "—"}</div>
                  </td>
                  <td className="px-4 py-3"><SevBadge sev={h.severity} /></td>
                  <td className="px-4 py-3"><StatusBadge status={h.status} /></td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{h.zone_id || "—"}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#6B7280" }}>{h.reported_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Zone risk table */}
      <div className="text-sm font-semibold mb-3" style={{ color: "#374151" }}>Zone-Level Hazard Distribution</div>
      {zonesLoading ? (
        <div className="text-center py-6 text-sm" style={{ color: "#9CA3AF" }}>Loading zone data…</div>
      ) : zoneMap.length === 0 ? (
        <div className="text-center py-8">
          <Layers className="w-8 h-8 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
          <p className="text-sm" style={{ color: "#6B7280" }}>No zones with hazards found</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#E9EEF8" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                {["Zone", "Type", "Risk Score", "Hazards", "Worst Severity"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {zoneMap.map((z) => {
                const worst = z.hazards.reduce<Hazard["severity"] | null>((acc, h) => {
                  if (!acc) return h.severity;
                  const sevs: Hazard["severity"][] = ["critical", "high", "medium", "low"];
                  return sevs.indexOf(h.severity) < sevs.indexOf(acc) ? h.severity : acc;
                }, null);
                return (
                  <tr key={z.id} className="border-t hover:bg-blue-50/20" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold" style={{ color: "#111827" }}>{z.name}</div>
                      <div className="text-xs" style={{ color: "#9CA3AF" }}>{z.id}</div>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#6B7280" }}>{z.type || "—"}</td>
                    <td className="px-4 py-3">
                      {z.riskScore > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.min(z.riskScore, 100)}%`, background: z.riskScore >= 75 ? "#EF4444" : z.riskScore >= 50 ? "#F97316" : z.riskScore >= 25 ? "#F59E0B" : "#10B981" }} />
                          </div>
                          <span className="text-xs font-semibold" style={{ color: "#374151" }}>{z.riskScore}</span>
                        </div>
                      ) : <span className="text-xs" style={{ color: "#9CA3AF" }}>N/A</span>}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#111827" }}>{z.hazards.length}</td>
                    <td className="px-4 py-3">{worst ? <SevBadge sev={worst} /> : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Unassigned hazards */}
      {(() => {
        const unassigned = hazards.filter((h) => !h.site_id);
        if (unassigned.length === 0) return null;
        return (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4" style={{ color: "#F59E0B" }} />
              <span className="text-sm font-bold" style={{ color: "#111827" }}>Unassigned Hazards ({unassigned.length})</span>
              <span className="text-xs" style={{ color: "#9CA3AF" }}>— no site linked</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {unassigned.map((h) => (
                <div key={h.id} className="px-3 py-2 rounded-xl border text-xs font-medium" style={{ background: "#FFFBEB", borderColor: "#FDE68A", color: "#92400E" }}>
                  {h.title}
                  <span className="ml-2 font-bold" style={{ color: SEV_COLOR[h.severity] }}>({h.severity})</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </SectionCard>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function HazardRegisterPage() {
  const { data: hazards = [], isLoading: hLoading } = useListHazardsQuery();
  const { isLoading: sitesLoading } = useGetSitesQuery();
  const { isLoading: zonesLoading } = useGetZonesQuery();

  const totalOpen       = hazards.filter((h) => h.status === "open").length;
  const totalMitigated  = hazards.filter((h) => h.status === "mitigated").length;
  const totalCritical   = hazards.filter((h) => h.severity === "critical").length;
  const withControls    = hazards.filter((h) => !!(h.mitigation && h.mitigation.trim())).length;

  return (
    <div style={{ minHeight: "100vh", background: "#F3F7FF" }}>
      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #1D2E5B 100%)", padding: "32px 32px 28px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#EF4444,#F97316)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldAlert style={{ width: 20, height: 20, color: "#fff" }} />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F8FAFC", margin: 0 }}>Hazard Register</h1>
            </div>
            <p style={{ color: "#94A3B8", fontSize: 14, margin: 0 }}>
              Full hazard inventory — severity profiling, risk controls, and site-level mapping
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 20 }}>
          {[
            { label: "Total Hazards",    value: hLoading ? "…" : hazards.length,    color: "#94A3B8",  sub: "all records" },
            { label: "Open",             value: hLoading ? "…" : totalOpen,          color: "#F87171",  sub: "require action" },
            { label: "Critical",         value: hLoading ? "…" : totalCritical,      color: "#FB923C",  sub: "highest severity" },
            { label: "With Controls",    value: hLoading ? "…" : withControls,       color: "#34D399",  sub: "mitigation assigned" },
          ].map(({ label, value, color, sub }) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#CBD5E1", marginTop: 2 }}>{label}</div>
              <div style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <HeroStat label="Mitigated" value={totalMitigated}  sub="hazard addressed" color="#10B981" />
          <HeroStat label="Uncontrolled" value={hazards.length - withControls} sub="no mitigation plan" color="#EF4444" />
        </div>

        <HazardListSection     hazards={hazards} loading={hLoading} />
        <HazardSeveritySection hazards={hazards} />
        <RiskControlsSection   hazards={hazards} />
        <SiteMappingSection    hazards={hazards} sitesLoading={sitesLoading} zonesLoading={zonesLoading} />
      </div>
    </div>
  );
}
