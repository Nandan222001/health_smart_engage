import { useMemo, useState } from "react";
import {
  MapPin, Layers, Globe, Clock, AlertTriangle,
  Loader2, RefreshCw, ShieldAlert, Building2,
} from "lucide-react";
import { useListHazardsQuery } from "@/features/hazards/api/hazardsApi";
import { useGetSitesQuery, useGetZonesQuery } from "@/features/sites/api/sitesApi";
import type { Hazard } from "@/features/hazards/api/hazardsApi";

// ── Helpers ─────────────────────────────────────────────────────────────────

const SEV_ORDER: Hazard["severity"][] = ["critical", "high", "medium", "low"];

const SEV_CFG: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: "#DC2626", bg: "#FEE2E2", label: "Critical" },
  high:     { color: "#EA580C", bg: "#FFEDD5", label: "High" },
  medium:   { color: "#D97706", bg: "#FEF3C7", label: "Medium" },
  low:      { color: "#16A34A", bg: "#DCFCE7", label: "Low" },
};

const ST_CFG: Record<string, { color: string; bg: string }> = {
  open:      { color: "#DC2626", bg: "#FEE2E2" },
  mitigated: { color: "#16A34A", bg: "#DCFCE7" },
  closed:    { color: "#6B7280", bg: "#F3F4F6" },
};

function sevCfg(s: string) { return SEV_CFG[s?.toLowerCase()] ?? { color: "#6B7280", bg: "#F3F4F6", label: s }; }

function SevBadge({ sev }: { sev: string }) {
  const cfg = sevCfg(sev);
  return <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize" style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const cfg = ST_CFG[status?.toLowerCase()] ?? ST_CFG.open;
  return <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize" style={{ color: cfg.color, background: cfg.bg }}>{status}</span>;
}

function HeroStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex-1 px-6 py-4 text-center">
      <div className="text-[26px] font-black text-white leading-none">{value}</div>
      <div className="text-[11px] font-semibold mt-1 uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.55)" }}>{label}</div>
    </div>
  );
}

// ── Site Hazard Cards Section ─────────────────────────────────────────────────

function SiteHazardCardsSection({ hazards }: { hazards: Hazard[] }) {
  const { data: sites = [] } = useGetSitesQuery();
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  const siteMap = useMemo(() => {
    const map: Record<string, { name: string; location: string; hazards: Hazard[] }> = {};
    for (const s of sites) {
      map[s.Site_ID] = { name: s.Site_Name, location: s.Location, hazards: [] };
    }
    for (const h of hazards) {
      const key = h.site_id || "__unassigned__";
      if (!map[key]) map[key] = { name: key === "__unassigned__" ? "Unassigned" : (h.site_id ?? "Unknown"), location: "—", hazards: [] };
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

  const activeSite = selectedSiteId ? siteMap.find((s) => s.id === selectedSiteId) ?? null : null;
  const sitesWithHighRisk = siteMap.filter((s) => s.hazards.some((h) => h.severity === "critical" || h.severity === "high")).length;

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#DBEAFE" }}>
            <Building2 className="w-5 h-5" style={{ color: "#2563EB" }} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>Sites with Hazards</h2>
            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>
              {siteMap.length} site{siteMap.length !== 1 ? "s" : ""} · {sitesWithHighRisk} with critical/high hazards · click to expand
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {sitesWithHighRisk > 0 && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl border mb-5" style={{ background: "#EFF6FF", borderColor: "#BFDBFE" }}>
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#2563EB" }} />
            <p className="text-[12px] font-semibold" style={{ color: "#1E40AF" }}>
              {sitesWithHighRisk} site{sitesWithHighRisk !== 1 ? "s" : ""} have critical or high-severity hazards — review site safety plans.
            </p>
          </div>
        )}

        {siteMap.length === 0 ? (
          <div className="py-12 text-center">
            <Globe className="w-10 h-10 mx-auto mb-3" style={{ color: "#E5E7EB" }} />
            <p className="text-[14px] font-semibold" style={{ color: "#374151" }}>No site data available</p>
            <p className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>Hazards will appear here once they have site assignments.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            {siteMap.map((site) => {
              const critCount = site.hazards.filter((h) => h.severity === "critical").length;
              const highCount = site.hazards.filter((h) => h.severity === "high").length;
              const openCount = site.hazards.filter((h) => h.status === "open").length;
              const isSelected = selectedSiteId === site.id;
              const riskColor = critCount > 0 ? "#DC2626" : highCount > 0 ? "#EA580C" : openCount > 0 ? "#D97706" : "#16A34A";
              const riskBg    = critCount > 0 ? "#FEE2E2" : highCount > 0 ? "#FFEDD5" : openCount > 0 ? "#FEF3C7" : "#DCFCE7";
              return (
                <button key={site.id} onClick={() => setSelectedSiteId(isSelected ? null : site.id)}
                  className="text-left rounded-xl border p-4 transition-all"
                  style={{
                    background: isSelected ? "#EEF2FF" : "#FAFBFF",
                    borderColor: isSelected ? "#6366F1" : "#E9EEF8",
                    boxShadow: isSelected ? "0 0 0 2px #6366F133" : "none",
                  }}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="text-[13px] font-bold" style={{ color: "#111827" }}>{site.name}</div>
                      {site.location && site.location !== "—" && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" style={{ color: "#9CA3AF" }} />
                          <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{site.location}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: riskBg, color: riskColor }}>
                      {site.hazards.length} hazard{site.hazards.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {critCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>{critCount} critical</span>}
                    {highCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FFEDD5", color: "#EA580C" }}>{highCount} high</span>}
                    {openCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>{openCount} open</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Expanded site detail */}
        {activeSite && (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#C7D2FE", background: "#EEF2FF" }}>
            <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "#C7D2FE", background: "#E0E7FF" }}>
              <MapPin className="w-4 h-4" style={{ color: "#6366F1" }} />
              <span className="text-[13px] font-bold" style={{ color: "#3730A3" }}>{activeSite.name} — Hazard Detail</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#EEF2FF", borderBottom: "1px solid #C7D2FE" }}>
                  {["Hazard", "Severity", "Status", "Zone", "Reporter"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#6366F1" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeSite.hazards.sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity)).map((h) => (
                  <tr key={h.id} className="border-t bg-white" style={{ borderColor: "#E0E7FF" }}>
                    <td className="px-4 py-3">
                      <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{h.title || "—"}</div>
                      <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{h.type || "—"}</div>
                    </td>
                    <td className="px-4 py-3"><SevBadge sev={h.severity} /></td>
                    <td className="px-4 py-3"><StatusBadge status={h.status} /></td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: "#6B7280" }}>{h.zone_id || "—"}</td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: "#6B7280" }}>{h.reported_by ? String(h.reported_by).slice(0, 16) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Zone Distribution Section ─────────────────────────────────────────────────

function ZoneDistributionSection({ hazards }: { hazards: Hazard[] }) {
  const { data: zones = [] } = useGetZonesQuery();

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
      .sort((a, b) => {
        const critA = a.hazards.filter((h) => h.severity === "critical").length;
        const critB = b.hazards.filter((h) => h.severity === "critical").length;
        return critB - critA || b.hazards.length - a.hazards.length;
      });
  }, [hazards, zones]);

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FEF3C7" }}>
            <Layers className="w-5 h-5" style={{ color: "#D97706" }} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>Zone-Level Hazard Distribution</h2>
            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Hazard counts and risk scores by zone</p>
          </div>
        </div>
      </div>

      {zoneMap.length === 0 ? (
        <div className="p-12 text-center">
          <Layers className="w-10 h-10 mx-auto mb-3" style={{ color: "#E5E7EB" }} />
          <p className="text-[13px]" style={{ color: "#9CA3AF" }}>No zones with hazards found</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
              {["Zone", "Type", "Risk Score", "Hazards", "Worst Severity", "Open"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {zoneMap.map((z) => {
              const worst = z.hazards.reduce<Hazard["severity"] | null>((acc, h) => {
                if (!acc) return h.severity;
                return SEV_ORDER.indexOf(h.severity) < SEV_ORDER.indexOf(acc) ? h.severity : acc;
              }, null);
              const openCount = z.hazards.filter((h) => h.status === "open").length;
              return (
                <tr key={z.id} className="border-t hover:bg-blue-50/20 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-5 py-3.5">
                    <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{z.name}</div>
                    <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{z.id}</div>
                  </td>
                  <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{z.type || "—"}</td>
                  <td className="px-5 py-3.5">
                    {z.riskScore > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                          <div className="h-full rounded-full" style={{
                            width: `${Math.min(z.riskScore, 100)}%`,
                            background: z.riskScore >= 75 ? "#DC2626" : z.riskScore >= 50 ? "#EA580C" : z.riskScore >= 25 ? "#D97706" : "#16A34A",
                          }} />
                        </div>
                        <span className="text-[12px] font-semibold" style={{ color: "#374151" }}>{z.riskScore}</span>
                      </div>
                    ) : <span className="text-[11px]" style={{ color: "#9CA3AF" }}>N/A</span>}
                  </td>
                  <td className="px-5 py-3.5 text-[13px] font-semibold" style={{ color: "#111827" }}>{z.hazards.length}</td>
                  <td className="px-5 py-3.5">{worst ? <SevBadge sev={worst} /> : "—"}</td>
                  <td className="px-5 py-3.5">
                    {openCount > 0 ? (
                      <span className="text-[12px] font-bold" style={{ color: "#DC2626" }}>{openCount} open</span>
                    ) : (
                      <span className="text-[11px]" style={{ color: "#16A34A" }}>All controlled</span>
                    )}
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

// ── Unassigned Hazards Section ────────────────────────────────────────────────

function UnassignedHazardsSection({ hazards }: { hazards: Hazard[] }) {
  const unassigned = useMemo(() =>
    hazards.filter((h) => !h.site_id).sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity)),
    [hazards],
  );

  if (unassigned.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FEF3C7" }}>
            <Clock className="w-5 h-5" style={{ color: "#D97706" }} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>
              Unassigned Hazards
              <span className="ml-2 text-[12px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#D97706" }}>
                {unassigned.length}
              </span>
            </h2>
            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Hazards with no site linked — assign to a site for full mapping</p>
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-wrap gap-2">
        {unassigned.map((h) => (
          <div key={h.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-medium"
            style={{ background: "#FFFBEB", borderColor: "#FDE68A", color: "#92400E" }}>
            <ShieldAlert className="w-3.5 h-3.5" style={{ color: sevCfg(h.severity).color }} />
            {h.title || "—"}
            <span className="font-bold ml-1" style={{ color: sevCfg(h.severity).color }}>({h.severity})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function HazardSiteMappingPage() {
  const { data: hazards = [], isLoading: l1, refetch: r1 } = useListHazardsQuery();
  const { isLoading: l2, refetch: r2 } = useGetSitesQuery();
  const { isLoading: l3, refetch: r3 } = useGetZonesQuery();
  const isLoading = l1 || l2 || l3;

  const { data: sites = [] } = useGetSitesQuery();
  const sitesWithHazards = useMemo(() => {
    const siteIds = new Set(hazards.filter((h) => h.site_id).map((h) => h.site_id));
    return siteIds.size;
  }, [hazards]);

  const highRiskSites = useMemo(() => {
    const map: Record<string, Hazard[]> = {};
    for (const h of hazards) {
      if (!h.site_id) continue;
      if (!map[h.site_id]) map[h.site_id] = [];
      map[h.site_id].push(h);
    }
    return Object.values(map).filter((siteHazards) => siteHazards.some((h) => h.severity === "critical" || h.severity === "high")).length;
  }, [hazards]);

  const unassigned = hazards.filter((h) => !h.site_id).length;
  const zonesWithHazards = useMemo(() => new Set(hazards.filter((h) => h.zone_id).map((h) => h.zone_id)).size, [hazards]);

  const handleRefresh = () => { r1(); r2(); r3(); };

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>
      <div style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #0F172A 100%)" }}>
        <div className="px-8 pt-8 pb-0">
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Hazard Register</p>
          <h1 className="text-[26px] font-black text-white">Site Mapping</h1>
          <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Site-level hazard distribution · Zone risk scores · Unassigned hazards
          </p>
        </div>
        <div className="flex border-t mt-6 divide-x" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <HeroStat label="Sites with Hazards" value={isLoading ? "…" : sitesWithHazards} />
          <HeroStat label="High-Risk Sites"    value={isLoading ? "…" : highRiskSites} />
          <HeroStat label="Zones Mapped"       value={isLoading ? "…" : zonesWithHazards} />
          <HeroStat label="Unassigned"          value={isLoading ? "…" : unassigned} />
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <button onClick={handleRefresh} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] font-semibold bg-white hover:bg-gray-50 transition-colors"
            style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#D1D5DB" }} />
          </div>
        ) : (
          <>
            <SiteHazardCardsSection hazards={hazards} />
            <ZoneDistributionSection hazards={hazards} />
            <UnassignedHazardsSection hazards={hazards} />
          </>
        )}
      </div>
    </div>
  );
}
