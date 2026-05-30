import { useState, useMemo } from "react";
import {
  MapPin, TrendingUp, AlertOctagon, RefreshCw,
  ChevronDown, ChevronRight, BarChart2, Zap,
} from "lucide-react";
import { useListHazardsQuery } from "@/features/hazards/api/hazardsApi";
import { useGetNearMissQuery } from "@/features/near-miss/api/nearMissApi";
import { useGetViolationsQuery } from "@/features/violations/api/violationsApi";
import type { Hazard } from "@/features/hazards/api/hazardsApi";
import type { NearMiss } from "@/services/api";
import type { Violation } from "@/services/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Tab = "zones" | "trends" | "violations";

const SEV_SCORE: Record<string, number> = {
  critical: 4, Critical: 4,
  high: 3, High: 3,
  medium: 2, Medium: 2,
  low: 1, Low: 1,
};

const SEV_COLOR: Record<string, string> = {
  critical: "#DC2626", Critical: "#DC2626",
  high: "#EA580C",     High: "#EA580C",
  medium: "#D97706",   Medium: "#D97706",
  low: "#16A34A",      Low: "#16A34A",
};

function sevLabel(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

interface ZoneRisk {
  id: string;
  score: number;
  hazards: Hazard[];
  nearMisses: NearMiss[];
  violations: Violation[];
}

function buildZoneMap(
  hazards: Hazard[],
  nearMisses: NearMiss[],
  violations: Violation[],
): Map<string, ZoneRisk> {
  const map = new Map<string, ZoneRisk>();

  const getOrCreate = (id: string): ZoneRisk => {
    if (!map.has(id)) map.set(id, { id, score: 0, hazards: [], nearMisses: [], violations: [] });
    return map.get(id)!;
  };

  for (const h of hazards) {
    const key = h.zone_id || h.site_id || "Unknown";
    const z = getOrCreate(key);
    z.hazards.push(h);
    z.score += SEV_SCORE[h.severity] ?? 1;
  }
  for (const nm of nearMisses) {
    const key = nm.Zone_ID || nm.Site_ID || "Unknown";
    const z = getOrCreate(key);
    z.nearMisses.push(nm);
    z.score += SEV_SCORE[nm.Severity] ?? 1;
  }
  for (const v of violations) {
    const key = v.Zone_ID || v.Site_ID || "Unknown";
    const z = getOrCreate(key);
    z.violations.push(v);
    z.score += SEV_SCORE[v.Severity] ?? 1;
  }

  return map;
}

function zoneTone(score: number): { bg: string; border: string; text: string; badge: string; label: string } {
  if (score >= 20) return { bg: "#FEF2F2", border: "#FECACA", text: "#DC2626", badge: "#DC2626", label: "Critical" };
  if (score >= 10) return { bg: "#FFF7ED", border: "#FED7AA", text: "#EA580C", badge: "#EA580C", label: "High Risk" };
  if (score >=  5) return { bg: "#FFFBEB", border: "#FDE68A", text: "#D97706", badge: "#D97706", label: "Elevated" };
  return           { bg: "#F0FDF4", border: "#BBF7D0", text: "#16A34A", badge: "#16A34A", label: "Monitored" };
}

// Group dates by month label (e.g. "Jan 26")
function toMonthKey(dateStr: string): string {
  if (!dateStr) return "Unknown";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Unknown";
  return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

function last6Months(): string[] {
  const now = new Date();
  const out: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Tab 1 — Critical Zones
// ---------------------------------------------------------------------------

function CriticalZonesTab({
  hazards, nearMisses, violations,
}: { hazards: Hazard[]; nearMisses: NearMiss[]; violations: Violation[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const zones = useMemo(() => {
    const map = buildZoneMap(hazards, nearMisses, violations);
    return Array.from(map.values()).sort((a, b) => b.score - a.score);
  }, [hazards, nearMisses, violations]);

  const criticalCount = zones.filter((z) => z.score >= 20).length;
  const highCount     = zones.filter((z) => z.score >= 10 && z.score < 20).length;

  if (zones.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>
        No zone data available.
      </div>
    );
  }

  const maxScore = Math.max(...zones.map((z) => z.score), 1);

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Summary strip */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Total Zones", value: zones.length, color: "#374151", bg: "#F9FAFB", border: "#E5E7EB" },
          { label: "Critical Zones", value: criticalCount, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
          { label: "High-Risk Zones", value: highCount, color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA" },
          { label: "Total Events", value: hazards.length + nearMisses.length + violations.length, color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
        ].map((s) => (
          <div key={s.label} style={{ flex: "1 1 140px", background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Zone cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {zones.map((zone, idx) => {
          const tone = zoneTone(zone.score);
          const isOpen = expanded === zone.id;
          const pct = Math.round((zone.score / maxScore) * 100);

          // severity counts
          const sevCounts: Record<string, number> = {};
          [...zone.hazards.map((h) => h.severity), ...zone.nearMisses.map((nm) => nm.Severity), ...zone.violations.map((v) => v.Severity)]
            .forEach((s) => { sevCounts[s] = (sevCounts[s] ?? 0) + 1; });

          return (
            <div key={zone.id} style={{ border: `1px solid ${isOpen ? tone.border : "#E5E7EB"}`, borderRadius: 12, overflow: "hidden", background: "#fff" }}>
              <button
                onClick={() => setExpanded(isOpen ? null : zone.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
              >
                {/* Rank */}
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: idx < 3 ? tone.badge : "#E5E7EB", color: idx < 3 ? "#fff" : "#6B7280", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {idx + 1}
                </div>
                {/* Zone ID */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 4 }}>{zone.id}</div>
                  {/* Progress bar */}
                  <div style={{ height: 6, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: tone.badge, borderRadius: 3, transition: "width 0.4s" }} />
                  </div>
                </div>
                {/* Counts */}
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  {[
                    { label: "H", val: zone.hazards.length, color: "#7C3AED" },
                    { label: "NM", val: zone.nearMisses.length, color: "#2563EB" },
                    { label: "V", val: zone.violations.length, color: "#DC2626" },
                  ].map((c) => (
                    <div key={c.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 32 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: c.color }}>{c.val}</div>
                      <div style={{ fontSize: 10, color: "#9CA3AF" }}>{c.label}</div>
                    </div>
                  ))}
                </div>
                {/* Badge */}
                <div style={{ padding: "3px 10px", borderRadius: 20, background: tone.bg, border: `1px solid ${tone.border}`, fontSize: 11, fontWeight: 700, color: tone.text, flexShrink: 0 }}>
                  {tone.label}
                </div>
                <div style={{ color: "#9CA3AF", flexShrink: 0 }}>
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div style={{ borderTop: `1px solid ${tone.border}`, padding: "16px 18px", background: tone.bg }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4, width: "100%" }}>Severity Breakdown</div>
                    {Object.entries(sevCounts).sort((a, b) => (SEV_SCORE[b[0]] ?? 0) - (SEV_SCORE[a[0]] ?? 0)).map(([sev, cnt]) => (
                      <div key={sev} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 8, background: "#fff", border: "1px solid #E5E7EB" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: SEV_COLOR[sev] ?? "#9CA3AF" }} />
                        <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>{sevLabel(sev)}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: SEV_COLOR[sev] ?? "#374151" }}>{cnt}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                    {zone.hazards.slice(0, 4).map((h) => (
                      <div key={h.id} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: SEV_COLOR[h.severity], textTransform: "uppercase", marginBottom: 2 }}>{h.severity} Hazard</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{h.title}</div>
                        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{h.type} · {h.status}</div>
                      </div>
                    ))}
                    {zone.nearMisses.slice(0, 3).map((nm) => (
                      <div key={nm.NearMiss_ID} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: SEV_COLOR[nm.Severity], textTransform: "uppercase", marginBottom: 2 }}>{nm.Severity} Near Miss</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{nm.Title}</div>
                        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{nm.Category} · {nm.Status}</div>
                      </div>
                    ))}
                    {zone.violations.slice(0, 3).map((v) => (
                      <div key={v.Violation_ID} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: SEV_COLOR[v.Severity], textTransform: "uppercase", marginBottom: 2 }}>{v.Severity} Violation</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{v.Violation_Type}</div>
                        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{v.Status}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 8 }}>
                    Risk Score: <strong style={{ color: tone.text }}>{zone.score}</strong> — {zone.hazards.length} hazard{zone.hazards.length !== 1 ? "s" : ""}, {zone.nearMisses.length} near miss{zone.nearMisses.length !== 1 ? "es" : ""}, {zone.violations.length} violation{zone.violations.length !== 1 ? "s" : ""}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 — Risk Trends
// ---------------------------------------------------------------------------

function RiskTrendsTab({
  hazards, nearMisses, violations,
}: { hazards: Hazard[]; nearMisses: NearMiss[]; violations: Violation[] }) {
  const months = last6Months();

  const hByMonth  = useMemo(() => {
    const m: Record<string, number> = {};
    for (const h of hazards)      m[toMonthKey(h.identified_at)] = (m[toMonthKey(h.identified_at)] ?? 0) + 1;
    return m;
  }, [hazards]);

  const nmByMonth = useMemo(() => {
    const m: Record<string, number> = {};
    for (const nm of nearMisses)  m[toMonthKey(nm.Incident_Date)] = (m[toMonthKey(nm.Incident_Date)] ?? 0) + 1;
    return m;
  }, [nearMisses]);

  const vByMonth  = useMemo(() => {
    const m: Record<string, number> = {};
    for (const v of violations)   m[toMonthKey(v.Detected_At)] = (m[toMonthKey(v.Detected_At)] ?? 0) + 1;
    return m;
  }, [violations]);

  const series = months.map((mo) => ({
    month: mo,
    hazards:    hByMonth[mo]  ?? 0,
    nearMisses: nmByMonth[mo] ?? 0,
    violations: vByMonth[mo]  ?? 0,
    total:      (hByMonth[mo] ?? 0) + (nmByMonth[mo] ?? 0) + (vByMonth[mo] ?? 0),
  }));

  const maxTotal = Math.max(...series.map((s) => s.total), 1);

  // Severity trend (critical+high share per month across all sources)
  const critMonthly = useMemo(() => {
    const m: Record<string, { crit: number; total: number }> = {};
    const add = (key: string, sev: string) => {
      if (!m[key]) m[key] = { crit: 0, total: 0 };
      m[key].total += 1;
      if (sev === "critical" || sev === "Critical" || sev === "high" || sev === "High") m[key].crit += 1;
    };
    for (const h  of hazards)    add(toMonthKey(h.identified_at),  h.severity);
    for (const nm of nearMisses) add(toMonthKey(nm.Incident_Date),  nm.Severity);
    for (const v  of violations) add(toMonthKey(v.Detected_At),     v.Severity);
    return m;
  }, [hazards, nearMisses, violations]);

  const SERIES_CFG = [
    { key: "hazards",    label: "Hazards",    color: "#7C3AED" },
    { key: "nearMisses", label: "Near Misses",color: "#2563EB" },
    { key: "violations", label: "Violations", color: "#DC2626" },
  ] as const;

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Summary stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        {[
          { label: "Total Hazards",     value: hazards.length,    color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
          { label: "Total Near Misses", value: nearMisses.length, color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
          { label: "Total Violations",  value: violations.length, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
          { label: "Combined Events",   value: hazards.length + nearMisses.length + violations.length, color: "#374151", bg: "#F9FAFB", border: "#E5E7EB" },
        ].map((s) => (
          <div key={s.label} style={{ flex: "1 1 140px", background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Monthly grouped bar chart */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Monthly Event Volume — Last 6 Months</div>
        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          {SERIES_CFG.map((sc) => (
            <div key={sc.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: sc.color }} />
              <span style={{ fontSize: 12, color: "#6B7280" }}>{sc.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
          {series.map((s) => (
            <div key={s.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              {/* Grouped bars */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, width: "100%" }}>
                {SERIES_CFG.map((sc) => {
                  const val = s[sc.key] as number;
                  const barH = Math.max(4, Math.round((val / maxTotal) * 120));
                  return (
                    <div
                      key={sc.key}
                      style={{ flex: 1, height: barH, background: sc.color, borderRadius: "3px 3px 0 0", opacity: 0.85, transition: "height 0.3s" }}
                      title={`${sc.label}: ${val}`}
                    />
                  );
                })}
              </div>
              <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center" }}>{s.month}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{s.total}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Critical/High share trend */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "20px 24px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Critical + High Severity Rate by Month</div>
        <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 16 }}>Percentage of events rated Critical or High</div>
        <div style={{ display: "flex", gap: 12 }}>
          {months.map((mo) => {
            const data = critMonthly[mo];
            const pct  = data ? Math.round((data.crit / data.total) * 100) : 0;
            const tone = pct >= 60 ? "#DC2626" : pct >= 40 ? "#EA580C" : pct >= 20 ? "#D97706" : "#16A34A";
            return (
              <div key={mo} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                {/* Circular gauge */}
                <div style={{ width: 52, height: 52, borderRadius: "50%", border: `4px solid ${tone}`, display: "flex", alignItems: "center", justifyContent: "center", background: "#FAFAFA" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: tone }}>{pct}%</span>
                </div>
                <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center" }}>{mo}</div>
                {data && <div style={{ fontSize: 10, color: "#D1D5DB" }}>{data.crit}/{data.total}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Data table */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, marginTop: 24, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px repeat(4, 1fr)", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", padding: "10px 16px", gap: 12 }}>
          {["Month", "Hazards", "Near Misses", "Violations", "Total"].map((h) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>{h}</div>
          ))}
        </div>
        {series.map((s, i) => (
          <div key={s.month} style={{ display: "grid", gridTemplateColumns: "120px repeat(4, 1fr)", padding: "10px 16px", gap: 12, background: i % 2 === 0 ? "#fff" : "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>{s.month}</div>
            <div style={{ fontSize: 13, color: "#7C3AED", fontWeight: 600 }}>{s.hazards}</div>
            <div style={{ fontSize: 13, color: "#2563EB", fontWeight: 600 }}>{s.nearMisses}</div>
            <div style={{ fontSize: 13, color: "#DC2626", fontWeight: 600 }}>{s.violations}</div>
            <div style={{ fontSize: 13, color: "#111827", fontWeight: 700 }}>{s.total}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3 — Frequent Violations
// ---------------------------------------------------------------------------

function FrequentViolationsTab({
  hazards, nearMisses, violations,
}: { hazards: Hazard[]; nearMisses: NearMiss[]; violations: Violation[] }) {
  type Source = "Violation" | "Near Miss" | "Hazard";
  interface EventGroup {
    label: string;
    source: Source;
    count: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }

  const groups = useMemo<EventGroup[]>(() => {
    const vMap = new Map<string, EventGroup>();
    const nmMap = new Map<string, EventGroup>();
    const hMap  = new Map<string, EventGroup>();

    const getOrCreate = (map: Map<string, EventGroup>, key: string, source: Source): EventGroup => {
      if (!map.has(key)) map.set(key, { label: key, source, count: 0, critical: 0, high: 0, medium: 0, low: 0 });
      return map.get(key)!;
    };

    for (const v of violations) {
      const g = getOrCreate(vMap, v.Violation_Type || "Unknown", "Violation");
      g.count++;
      const sev = (v.Severity || "").toLowerCase();
      if (sev === "critical") g.critical++;
      else if (sev === "high") g.high++;
      else if (sev === "medium") g.medium++;
      else g.low++;
    }
    for (const nm of nearMisses) {
      const g = getOrCreate(nmMap, nm.Category || "Unknown", "Near Miss");
      g.count++;
      const sev = (nm.Severity || "").toLowerCase();
      if (sev === "critical") g.critical++;
      else if (sev === "high") g.high++;
      else if (sev === "medium") g.medium++;
      else g.low++;
    }
    for (const h of hazards) {
      const g = getOrCreate(hMap, h.type || "Unknown", "Hazard");
      g.count++;
      const sev = (h.severity || "").toLowerCase();
      if (sev === "critical") g.critical++;
      else if (sev === "high") g.high++;
      else if (sev === "medium") g.medium++;
      else g.low++;
    }

    return [
      ...Array.from(vMap.values()),
      ...Array.from(nmMap.values()),
      ...Array.from(hMap.values()),
    ].sort((a, b) => b.count - a.count);
  }, [hazards, nearMisses, violations]);

  const topGroups = groups.slice(0, 15);
  const maxCount  = Math.max(...topGroups.map((g) => g.count), 1);

  const SOURCE_COLOR: Record<Source, string> = {
    Violation: "#DC2626",
    "Near Miss": "#2563EB",
    Hazard: "#7C3AED",
  };

  const totalViolations = violations.length;
  const topVType = groups.find((g) => g.source === "Violation");
  const critPct  = totalViolations > 0
    ? Math.round((violations.filter((v) => v.Severity === "Critical").length / totalViolations) * 100)
    : 0;

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Violation Types",  value: new Set(violations.map((v) => v.Violation_Type)).size, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
          { label: "Near Miss Categories", value: new Set(nearMisses.map((nm) => nm.Category)).size, color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
          { label: "Hazard Types",     value: new Set(hazards.map((h) => h.type)).size, color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
          { label: "Critical Rate",    value: `${critPct}%`, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
        ].map((s) => (
          <div key={s.label} style={{ flex: "1 1 140px", background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Top type callout */}
      {topVType && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "14px 18px", marginBottom: 24, display: "flex", gap: 14, alignItems: "center" }}>
          <Zap size={20} color="#DC2626" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>Most Frequent Violation Type</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{topVType.label} <span style={{ color: "#9CA3AF", fontWeight: 400 }}>— {topVType.count} recorded events</span></div>
          </div>
        </div>
      )}

      {/* Frequency chart */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Top Risk Event Types (All Sources)</div>
        <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 16 }}>Ranked by total recorded count</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {(["Violation", "Near Miss", "Hazard"] as Source[]).map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: SOURCE_COLOR[s] }} />
              <span style={{ fontSize: 11, color: "#6B7280" }}>{s}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {topGroups.map((g, idx) => {
            const barW = Math.round((g.count / maxCount) * 100);
            const sevTotal = g.critical + g.high + g.medium + g.low;
            return (
              <div key={`${g.source}-${g.label}`} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 20, fontSize: 11, color: "#9CA3AF", textAlign: "right", flexShrink: 0 }}>{idx + 1}</div>
                <div style={{ width: 120, fontSize: 12, color: "#374151", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }} title={g.label}>{g.label}</div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                  {/* Stacked severity bar */}
                  <div style={{ height: 18, flex: 1, display: "flex", borderRadius: 4, overflow: "hidden", background: "#F3F4F6" }}>
                    {sevTotal > 0 && [
                      { cnt: g.critical, color: "#DC2626" },
                      { cnt: g.high,     color: "#EA580C" },
                      { cnt: g.medium,   color: "#D97706" },
                      { cnt: g.low,      color: "#16A34A" },
                    ].map((seg, si) => seg.cnt > 0 ? (
                      <div
                        key={si}
                        style={{ width: `${(seg.cnt / sevTotal) * barW}%`, background: seg.color, transition: "width 0.3s", minWidth: seg.cnt > 0 ? 2 : 0 }}
                        title={`${seg.cnt}`}
                      />
                    ) : null)}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: SOURCE_COLOR[g.source], width: 28, textAlign: "right" }}>{g.count}</div>
                </div>
                <div style={{ padding: "2px 8px", borderRadius: 10, background: "#F3F4F6", fontSize: 10, fontWeight: 600, color: SOURCE_COLOR[g.source], flexShrink: 0 }}>
                  {g.source === "Near Miss" ? "NM" : g.source.charAt(0)}
                </div>
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div style={{ display: "flex", gap: 12, marginTop: 16, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
          {[{ label: "Critical", c: "#DC2626" }, { label: "High", c: "#EA580C" }, { label: "Medium", c: "#D97706" }, { label: "Low", c: "#16A34A" }].map((l) => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: l.c }} />
              <span style={{ fontSize: 11, color: "#6B7280" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail table */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "30px 1fr 80px 60px 60px 60px 60px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", padding: "10px 16px", gap: 8 }}>
          {["#", "Type / Category", "Source", "Crit", "High", "Med", "Total"].map((h) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>{h}</div>
          ))}
        </div>
        {topGroups.map((g, i) => (
          <div key={`${g.source}-${g.label}-row`} style={{ display: "grid", gridTemplateColumns: "30px 1fr 80px 60px 60px 60px 60px", padding: "10px 16px", gap: 8, background: i % 2 === 0 ? "#fff" : "#FAFAFA", borderBottom: "1px solid #F3F4F6", alignItems: "center" }}>
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>{i + 1}</div>
            <div style={{ fontSize: 13, color: "#111827", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.label}</div>
            <div style={{ padding: "2px 8px", borderRadius: 10, background: "#F3F4F6", fontSize: 11, fontWeight: 600, color: SOURCE_COLOR[g.source], display: "inline-block" }}>{g.source}</div>
            <div style={{ fontSize: 13, color: "#DC2626", fontWeight: 600 }}>{g.critical}</div>
            <div style={{ fontSize: 13, color: "#EA580C", fontWeight: 600 }}>{g.high}</div>
            <div style={{ fontSize: 13, color: "#D97706", fontWeight: 600 }}>{g.medium}</div>
            <div style={{ fontSize: 13, color: "#111827", fontWeight: 700 }}>{g.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const TABS: { key: Tab; label: string; icon: typeof MapPin }[] = [
  { key: "zones",      label: "Critical Zones",      icon: MapPin },
  { key: "trends",     label: "Risk Trends",          icon: TrendingUp },
  { key: "violations", label: "Frequent Violations",  icon: AlertOctagon },
];

export function HighRiskAreasPage() {
  const { data: hazards    = [], isLoading: l1, refetch: r1 } = useListHazardsQuery();
  const { data: nearMisses = [], isLoading: l2, refetch: r2 } = useGetNearMissQuery();
  const { data: violations = [], isLoading: l3, refetch: r3 } = useGetViolationsQuery();
  const [activeTab, setActiveTab] = useState<Tab>("zones");

  const isLoading = l1 || l2 || l3;

  const criticalHazards    = hazards.filter((h) => h.severity === "critical" || h.severity === "high");
  const criticalNearMisses = nearMisses.filter((nm) => nm.Severity === "Critical" || nm.Severity === "High");
  const criticalViolations = violations.filter((v) => v.Severity === "Critical" || v.Severity === "High");
  const zonesAffected      = new Set([
    ...hazards.map((h) => h.zone_id || h.site_id).filter(Boolean),
    ...nearMisses.map((nm) => nm.Zone_ID || nm.Site_ID).filter(Boolean),
    ...violations.map((v) => v.Zone_ID || v.Site_ID).filter(Boolean),
  ]).size;

  const stats = [
    { label: "Zones Monitored", value: zonesAffected, color: "#E0E7FF" },
    { label: "Critical Events",  value: criticalHazards.length + criticalNearMisses.length + criticalViolations.length, color: "#FECACA" },
    { label: "Violations",       value: violations.length, color: "#FED7AA" },
    { label: "Near Misses",      value: nearMisses.length, color: "#FDE68A" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F3F7FF" }}>
      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, #7F1D1D 0%, #450A0A 40%, #1C1917 100%)", padding: "28px 32px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <MapPin size={22} color="#FCA5A5" />
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#fff" }}>High-Risk Areas</h1>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#FECACA", opacity: 0.85 }}>
              Zone-level risk concentration · trend analysis · violation frequency
            </p>
          </div>
          <button
            onClick={() => { r1(); r2(); r3(); }}
            disabled={isLoading}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "#fff", fontSize: 13, cursor: "pointer" }}
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Stats strip */}
        <div style={{ display: "flex", gap: 0, marginBottom: 0 }}>
          {stats.map((s, i) => (
            <div key={s.label} style={{ flex: 1, padding: "12px 20px", borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 4, marginTop: 16 }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "10px 20px", border: "none", cursor: "pointer",
                  borderRadius: "8px 8px 0 0", fontSize: 13, fontWeight: active ? 600 : 500,
                  ...(active
                    ? { background: "#F5F7FF", color: "#111827" }
                    : { background: "transparent", color: "rgba(255,255,255,0.65)" }),
                }}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
          <BarChart2 size={32} color="#DC2626" style={{ opacity: 0.4 }} />
          <span style={{ marginLeft: 12, color: "#9CA3AF", fontSize: 14 }}>Loading risk data…</span>
        </div>
      )}

      {/* Tab content */}
      {!isLoading && (
        <div style={{ background: "#fff", borderRadius: "0 0 12px 12px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          {activeTab === "zones"      && <CriticalZonesTab     hazards={hazards} nearMisses={nearMisses} violations={violations} />}
          {activeTab === "trends"     && <RiskTrendsTab        hazards={hazards} nearMisses={nearMisses} violations={violations} />}
          {activeTab === "violations" && <FrequentViolationsTab hazards={hazards} nearMisses={nearMisses} violations={violations} />}
        </div>
      )}
    </div>
  );
}
