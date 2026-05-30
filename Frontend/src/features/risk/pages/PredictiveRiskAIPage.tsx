import { useState, useMemo } from "react";
import {
  BrainCircuit, TrendingUp, TrendingDown, Minus,
  Zap, RefreshCw, ShieldAlert, Lightbulb,
  AlertTriangle, CheckCircle2, Clock, ArrowUpRight,
} from "lucide-react";
import { useListHazardsQuery } from "@/features/hazards/api/hazardsApi";
import { useGetNearMissQuery } from "@/features/near-miss/api/nearMissApi";
import { useGetViolationsQuery } from "@/features/violations/api/violationsApi";
import type { Hazard } from "@/features/hazards/api/hazardsApi";
import type { NearMiss, Violation } from "@/services/api";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

type Tab = "predictions" | "forecast" | "patterns" | "recommendations";

const SEV_SCORE: Record<string, number> = {
  critical: 4, Critical: 4,
  high: 3,     High: 3,
  medium: 2,   Medium: 2,
  low: 1,      Low: 1,
};

function toMonthKey(d: string): string {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

function monthsBack(n: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - n, 1);
  return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

function monthsForward(n: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + n, 1);
  return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

function zoneKey(h: Hazard) { return h.zone_id || h.site_id || "Unknown"; }
function nmZoneKey(nm: NearMiss) { return nm.Zone_ID || nm.Site_ID || "Unknown"; }
function vZoneKey(v: Violation)  { return v.Zone_ID  || v.Site_ID  || "Unknown"; }

function hourBucket(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Unknown";
  const h = d.getHours();
  if (h >= 6  && h < 12) return "Morning (06–12)";
  if (h >= 12 && h < 18) return "Afternoon (12–18)";
  if (h >= 18 && h < 22) return "Evening (18–22)";
  return "Night (22–06)";
}

// ---------------------------------------------------------------------------
// Derived data
// ---------------------------------------------------------------------------

interface ZonePrediction {
  zone: string;
  score: number;
  confidence: number;
  level: "Critical" | "High" | "Medium" | "Low";
  trend: "up" | "down" | "stable";
  hazardCount: number;
  nearMissCount: number;
  violationCount: number;
  openCritical: number;
}

function usePredictions(
  hazards: Hazard[],
  nearMisses: NearMiss[],
  violations: Violation[],
): ZonePrediction[] {
  return useMemo(() => {
    const map = new Map<string, {
      score: number; events: number; openCrit: number;
      h: number; nm: number; v: number;
      recentEvents: number; olderEvents: number;
    }>();

    const now = new Date();
    const twoMonthsAgo   = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const fourMonthsAgo  = new Date(now.getFullYear(), now.getMonth() - 4, 1);

    const get = (k: string) => {
      if (!map.has(k)) map.set(k, { score: 0, events: 0, openCrit: 0, h: 0, nm: 0, v: 0, recentEvents: 0, olderEvents: 0 });
      return map.get(k)!;
    };

    for (const h of hazards) {
      const k = zoneKey(h); const z = get(k);
      z.score += SEV_SCORE[h.severity] ?? 1; z.events++; z.h++;
      if ((h.severity === "critical" || h.severity === "high") && h.status === "open") z.openCrit++;
      const dt = new Date(h.identified_at);
      if (!isNaN(dt.getTime())) {
        if (dt >= twoMonthsAgo) z.recentEvents++;
        else if (dt >= fourMonthsAgo) z.olderEvents++;
      }
    }
    for (const nm of nearMisses) {
      const k = nmZoneKey(nm); const z = get(k);
      z.score += SEV_SCORE[nm.Severity] ?? 1; z.events++; z.nm++;
      const dt = new Date(nm.Incident_Date);
      if (!isNaN(dt.getTime())) {
        if (dt >= twoMonthsAgo) z.recentEvents++;
        else if (dt >= fourMonthsAgo) z.olderEvents++;
      }
    }
    for (const v of violations) {
      const k = vZoneKey(v); const z = get(k);
      z.score += SEV_SCORE[v.Severity] ?? 1; z.events++; z.v++;
      const dt = new Date(v.Detected_At);
      if (!isNaN(dt.getTime())) {
        if (dt >= twoMonthsAgo) z.recentEvents++;
        else if (dt >= fourMonthsAgo) z.olderEvents++;
      }
    }

    return Array.from(map.entries())
      .map(([zone, d]) => {
        const confidence = Math.min(100, Math.round(d.events * 15 + 10));
        const level: ZonePrediction["level"] =
          d.score >= 20 ? "Critical" : d.score >= 10 ? "High" : d.score >= 5 ? "Medium" : "Low";
        const trend: ZonePrediction["trend"] =
          d.recentEvents > d.olderEvents ? "up" :
          d.recentEvents < d.olderEvents ? "down" : "stable";
        return {
          zone, score: d.score, confidence, level, trend,
          hazardCount: d.h, nearMissCount: d.nm, violationCount: d.v, openCritical: d.openCrit,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [hazards, nearMisses, violations]);
}

interface MonthData { month: string; total: number; forecast: boolean; low: number; high: number; }

function useForecast(
  hazards: Hazard[],
  nearMisses: NearMiss[],
  violations: Violation[],
): MonthData[] {
  return useMemo(() => {
    const historical = [5, 4, 3, 2, 1, 0].map((n) => monthsBack(n));
    const future     = [1, 2, 3].map((n) => monthsForward(n));

    const counts: Record<string, number> = {};
    for (const h  of hazards)    { const k = toMonthKey(h.identified_at);  counts[k] = (counts[k] ?? 0) + 1; }
    for (const nm of nearMisses) { const k = toMonthKey(nm.Incident_Date); counts[k] = (counts[k] ?? 0) + 1; }
    for (const v  of violations) { const k = toMonthKey(v.Detected_At);   counts[k] = (counts[k] ?? 0) + 1; }

    const histData = historical.map((mo) => counts[mo] ?? 0);
    const avg3 = histData.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const avg3early = histData.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const trend = (avg3 - avg3early) / 3;

    const lastVal = histData[histData.length - 1];
    return [
      ...historical.map((mo, i) => ({ month: mo, total: histData[i], forecast: false, low: 0, high: 0 })),
      ...future.map((mo, i) => {
        const projected = Math.max(0, Math.round(lastVal + trend * (i + 1)));
        const uncertainty = Math.max(1, Math.round(projected * 0.2));
        return { month: mo, total: projected, forecast: true, low: Math.max(0, projected - uncertainty), high: projected + uncertainty };
      }),
    ];
  }, [hazards, nearMisses, violations]);
}

interface Pattern {
  id: string;
  type: "zone_hotspot" | "recurring_type" | "time_cluster" | "category_cluster" | "open_backlog";
  title: string;
  detail: string;
  severity: "critical" | "high" | "medium" | "low";
  count: number;
}

function usePatterns(
  hazards: Hazard[],
  nearMisses: NearMiss[],
  violations: Violation[],
): Pattern[] {
  return useMemo(() => {
    const patterns: Pattern[] = [];

    // Zone hotspots
    const zoneScore = new Map<string, number>();
    for (const h  of hazards)    zoneScore.set(zoneKey(h),   (zoneScore.get(zoneKey(h))   ?? 0) + (SEV_SCORE[h.severity]  ?? 1));
    for (const nm of nearMisses) zoneScore.set(nmZoneKey(nm),(zoneScore.get(nmZoneKey(nm))  ?? 0) + (SEV_SCORE[nm.Severity] ?? 1));
    for (const v  of violations) zoneScore.set(vZoneKey(v),  (zoneScore.get(vZoneKey(v))   ?? 0) + (SEV_SCORE[v.Severity]  ?? 1));
    for (const [zone, score] of zoneScore.entries()) {
      if (score >= 15) patterns.push({
        id: `hotspot-${zone}`, type: "zone_hotspot",
        title: `Zone Hotspot: ${zone}`,
        detail: `Risk score ${score} — multi-source critical events converging in this zone.`,
        severity: score >= 20 ? "critical" : "high", count: score,
      });
    }

    // Recurring violation types
    const vtCount = new Map<string, number>();
    for (const v of violations) vtCount.set(v.Violation_Type || "Unknown", (vtCount.get(v.Violation_Type || "Unknown") ?? 0) + 1);
    for (const [type, cnt] of vtCount.entries()) {
      if (cnt >= 3) patterns.push({
        id: `vtype-${type}`, type: "recurring_type",
        title: `Recurring: ${type}`,
        detail: `Detected ${cnt} times across multiple zones — systemic training gap indicated.`,
        severity: cnt >= 6 ? "critical" : cnt >= 4 ? "high" : "medium", count: cnt,
      });
    }

    // Time clusters
    const hourCount = new Map<string, number>();
    for (const v of violations) {
      if (v.Detected_At) { const b = hourBucket(v.Detected_At); hourCount.set(b, (hourCount.get(b) ?? 0) + 1); }
    }
    const maxHour = Math.max(...Array.from(hourCount.values()), 0);
    for (const [bucket, cnt] of hourCount.entries()) {
      if (cnt === maxHour && cnt >= 3) patterns.push({
        id: `time-${bucket}`, type: "time_cluster",
        title: `Time Cluster: ${bucket}`,
        detail: `${cnt} violations concentrated during this shift window — increased vigilance needed.`,
        severity: cnt >= 8 ? "critical" : cnt >= 5 ? "high" : "medium", count: cnt,
      });
    }

    // Near-miss category clusters
    const catCount = new Map<string, number>();
    for (const nm of nearMisses) catCount.set(nm.Category || "Unknown", (catCount.get(nm.Category || "Unknown") ?? 0) + 1);
    for (const [cat, cnt] of catCount.entries()) {
      if (cnt >= 2) patterns.push({
        id: `cat-${cat}`, type: "category_cluster",
        title: `Near Miss Cluster: ${cat}`,
        detail: `${cnt} near-miss events share this category — latent systemic risk detected.`,
        severity: cnt >= 4 ? "high" : "medium", count: cnt,
      });
    }

    // Open high/critical hazard backlog per zone
    const openBacklog = new Map<string, number>();
    for (const h of hazards) {
      if ((h.severity === "critical" || h.severity === "high") && h.status === "open") {
        openBacklog.set(zoneKey(h), (openBacklog.get(zoneKey(h)) ?? 0) + 1);
      }
    }
    for (const [zone, cnt] of openBacklog.entries()) {
      if (cnt >= 2) patterns.push({
        id: `backlog-${zone}`, type: "open_backlog",
        title: `Unmitigated Backlog: ${zone}`,
        detail: `${cnt} open critical/high hazards unmitigated — escalation risk high.`,
        severity: cnt >= 4 ? "critical" : "high", count: cnt,
      });
    }

    return patterns.sort((a, b) => {
      const ord = { critical: 0, high: 1, medium: 2, low: 3 };
      return ord[a.severity] - ord[b.severity];
    });
  }, [hazards, nearMisses, violations]);
}

interface Recommendation {
  id: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  action: string;
  rationale: string;
  target: string;
  category: "inspection" | "training" | "monitoring" | "mitigation" | "process";
}

function useRecommendations(
  predictions: ZonePrediction[],
  patterns: Pattern[],
  hazards: Hazard[],
): Recommendation[] {
  return useMemo(() => {
    const recs: Recommendation[] = [];

    // Critical zones → immediate inspection
    for (const p of predictions.slice(0, 3)) {
      if (p.level === "Critical" || p.level === "High") {
        recs.push({
          id: `insp-${p.zone}`, priority: p.level,
          action: "Conduct Immediate Site Inspection",
          rationale: `Zone ${p.zone} has a risk score of ${p.score} with ${p.openCritical} unmitigated critical hazards.`,
          target: p.zone, category: "inspection",
        });
      }
    }

    // Recurring violation patterns → training
    for (const pat of patterns.filter((p) => p.type === "recurring_type").slice(0, 2)) {
      recs.push({
        id: `train-${pat.id}`, priority: pat.severity === "critical" ? "Critical" : "High",
        action: "Deploy Targeted Safety Training",
        rationale: pat.detail,
        target: pat.title.replace("Recurring: ", ""), category: "training",
      });
    }

    // Upward trend zones → monitoring
    for (const p of predictions.filter((p) => p.trend === "up").slice(0, 2)) {
      recs.push({
        id: `mon-${p.zone}`, priority: "High",
        action: "Increase Real-Time Monitoring Frequency",
        rationale: `Event frequency is increasing in ${p.zone} — automated alerts should be elevated.`,
        target: p.zone, category: "monitoring",
      });
    }

    // Time cluster → shift briefing
    for (const pat of patterns.filter((p) => p.type === "time_cluster").slice(0, 1)) {
      recs.push({
        id: `shift-${pat.id}`, priority: "Medium",
        action: "Implement Shift-Specific Safety Briefings",
        rationale: pat.detail,
        target: pat.title.replace("Time Cluster: ", ""), category: "process",
      });
    }

    // Open backlog → mitigation
    for (const pat of patterns.filter((p) => p.type === "open_backlog").slice(0, 2)) {
      recs.push({
        id: `mit-${pat.id}`, priority: pat.severity === "critical" ? "Critical" : "High",
        action: "Escalate Hazard Mitigation Plan",
        rationale: pat.detail,
        target: pat.title.replace("Unmitigated Backlog: ", ""), category: "mitigation",
      });
    }

    // Generic if few recs
    if (recs.length < 3) {
      const openHigh = hazards.filter((h) => h.status === "open" && (h.severity === "high" || h.severity === "critical"));
      if (openHigh.length > 0) recs.push({
        id: "gen-openhigh", priority: "Medium",
        action: "Review and Close Open High-Severity Hazards",
        rationale: `${openHigh.length} high/critical hazards remain open. Systematic closure review recommended.`,
        target: "All Sites", category: "mitigation",
      });
    }

    const ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return recs.sort((a, b) => ORDER[a.priority] - ORDER[b.priority]);
  }, [predictions, patterns, hazards]);
}

// ---------------------------------------------------------------------------
// Style helpers
// ---------------------------------------------------------------------------

const LEVEL_TONE: Record<string, { bg: string; border: string; text: string; ring: string }> = {
  Critical: { bg: "#FEF2F2", border: "#FECACA", text: "#DC2626", ring: "#DC2626" },
  High:     { bg: "#FFF7ED", border: "#FED7AA", text: "#EA580C", ring: "#EA580C" },
  Medium:   { bg: "#FFFBEB", border: "#FDE68A", text: "#D97706", ring: "#D97706" },
  Low:      { bg: "#F0FDF4", border: "#BBF7D0", text: "#16A34A", ring: "#16A34A" },
};

const CAT_ICON: Record<string, typeof ShieldAlert> = {
  inspection: ShieldAlert, training: Lightbulb,
  monitoring: BrainCircuit, mitigation: AlertTriangle, process: Clock,
};
const CAT_COLOR: Record<string, string> = {
  inspection: "#DC2626", training: "#7C3AED",
  monitoring: "#2563EB", mitigation: "#EA580C", process: "#D97706",
};

// ---------------------------------------------------------------------------
// Tab 1 — AI Risk Predictions
// ---------------------------------------------------------------------------

function AIPredictionsTab({ predictions }: { predictions: ZonePrediction[] }) {
  const [filter, setFilter] = useState<"All" | "Critical" | "High" | "Medium" | "Low">("All");
  const visible = filter === "All" ? predictions : predictions.filter((p) => p.level === filter);

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {(["All", "Critical", "High", "Medium", "Low"] as const).map((f) => {
          const cnt = f === "All" ? predictions.length : predictions.filter((p) => p.level === f).length;
          const tone = f === "All"
            ? { bg: "#F9FAFB", border: "#E5E7EB", text: "#374151" }
            : { bg: LEVEL_TONE[f].bg, border: LEVEL_TONE[f].border, text: LEVEL_TONE[f].text };
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              flex: "1 1 80px", padding: "12px 14px", borderRadius: 10,
              border: `2px solid ${filter === f ? tone.text : tone.border}`,
              background: tone.bg, cursor: "pointer",
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: tone.text }}>{cnt}</div>
              <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>{f === "All" ? "Total Zones" : `${f} Risk`}</div>
            </button>
          );
        })}
      </div>

      {/* Prediction cards */}
      {visible.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>No predictions for this filter.</div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
        {visible.map((p) => {
          const tone = LEVEL_TONE[p.level];
          const TrendIcon = p.trend === "up" ? TrendingUp : p.trend === "down" ? TrendingDown : Minus;
          const trendColor = p.trend === "up" ? "#DC2626" : p.trend === "down" ? "#16A34A" : "#9CA3AF";
          return (
            <div key={p.zone} style={{ background: "#fff", border: `1px solid ${tone.border}`, borderRadius: 14, padding: "18px 20px", position: "relative" }}>
              {/* Level badge */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{p.zone}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ padding: "2px 10px", borderRadius: 20, background: tone.bg, border: `1px solid ${tone.border}`, fontSize: 11, fontWeight: 700, color: tone.text }}>{p.level} Risk</span>
                    <TrendIcon size={14} color={trendColor} />
                    <span style={{ fontSize: 11, color: trendColor, fontWeight: 600 }}>
                      {p.trend === "up" ? "Increasing" : p.trend === "down" ? "Improving" : "Stable"}
                    </span>
                  </div>
                </div>
                {/* Confidence ring */}
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", border: `4px solid ${tone.ring}`, display: "flex", alignItems: "center", justifyContent: "center", background: tone.bg }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: tone.text }}>{p.confidence}%</span>
                  </div>
                  <div style={{ fontSize: 9, color: "#9CA3AF", marginTop: 3 }}>Confidence</div>
                </div>
              </div>

              {/* Score bar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#6B7280" }}>Predicted Risk Score</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: tone.text }}>{p.score}</span>
                </div>
                <div style={{ height: 6, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, (p.score / 30) * 100)}%`, background: tone.ring, borderRadius: 3 }} />
                </div>
              </div>

              {/* Event counts */}
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { label: "Hazards", val: p.hazardCount, color: "#7C3AED" },
                  { label: "Near Misses", val: p.nearMissCount, color: "#2563EB" },
                  { label: "Violations", val: p.violationCount, color: "#DC2626" },
                ].map((c) => (
                  <div key={c.label} style={{ flex: 1, background: "#F9FAFB", borderRadius: 8, padding: "8px 0", textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: c.color }}>{c.val}</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>{c.label}</div>
                  </div>
                ))}
              </div>

              {p.openCritical > 0 && (
                <div style={{ marginTop: 10, padding: "6px 10px", background: "#FEF2F2", borderRadius: 8, display: "flex", gap: 6, alignItems: "center" }}>
                  <AlertTriangle size={12} color="#DC2626" />
                  <span style={{ fontSize: 11, color: "#DC2626", fontWeight: 600 }}>{p.openCritical} open critical hazard{p.openCritical > 1 ? "s" : ""} unmitigated</span>
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
// Tab 2 — Future Incident Forecast
// ---------------------------------------------------------------------------

function ForecastTab({ data }: { data: MonthData[] }) {
  const historical = data.filter((d) => !d.forecast);
  const future     = data.filter((d) =>  d.forecast);
  const maxVal = Math.max(...data.map((d) => d.high || d.total), 1);

  const lastH  = historical[historical.length - 1]?.total ?? 0;
  const firstH = historical[0]?.total ?? 0;
  const totalH = historical.reduce((a, b) => a + b.total, 0);
  const avgH   = historical.length > 0 ? Math.round(totalH / historical.length) : 0;
  const trendDir = lastH > firstH ? "up" : lastH < firstH ? "down" : "stable";

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Historical Average / Month", value: avgH, color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
          { label: "Last Month Events",          value: lastH, color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
          { label: "Projected Next Month",       value: future[0]?.total ?? "—", color: future[0]?.total ?? 0 >= avgH ? "#DC2626" : "#16A34A", bg: "#FEF2F2", border: "#FECACA" },
          { label: "Trend",                      value: trendDir === "up" ? "↑ Rising" : trendDir === "down" ? "↓ Falling" : "→ Stable", color: trendDir === "up" ? "#DC2626" : trendDir === "down" ? "#16A34A" : "#6B7280", bg: "#F9FAFB", border: "#E5E7EB" },
        ].map((s) => (
          <div key={s.label} style={{ flex: "1 1 140px", background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: "24px", marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>9-Month View — Historical + AI Forecast</div>
        <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 20 }}>Shaded bars = AI-projected with ±20% uncertainty band</div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          {[
            { label: "Historical", color: "#4F46E5", dashed: false },
            { label: "AI Forecast", color: "#A78BFA", dashed: true },
          ].map((l) => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 24, height: 10, borderRadius: 2, background: l.dashed ? "transparent" : l.color, border: l.dashed ? `2px dashed ${l.color}` : "none" }} />
              <span style={{ fontSize: 12, color: "#6B7280" }}>{l.label}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
          {data.map((d) => {
            const barH = Math.max(4, Math.round(((d.high || d.total) / maxVal) * 160));
            const mainH = Math.max(4, Math.round((d.total / maxVal) * 160));
            return (
              <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                  {/* Uncertainty band (forecast only) */}
                  {d.forecast && d.high > 0 && (
                    <div style={{ position: "absolute", bottom: 0, width: "100%", height: barH, background: "#EDE9FE", borderRadius: "4px 4px 0 0", opacity: 0.5 }} />
                  )}
                  {/* Main bar */}
                  <div style={{
                    position: "relative", width: "80%", height: mainH,
                    background: d.forecast ? "transparent" : "#4F46E5",
                    border: d.forecast ? "2px dashed #7C3AED" : "none",
                    borderRadius: "4px 4px 0 0",
                    transition: "height 0.3s",
                  }} />
                </div>
                <div style={{ fontSize: 10, color: "#9CA3AF", textAlign: "center" }}>{d.month}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: d.forecast ? "#7C3AED" : "#374151" }}>{d.total}</div>
                {d.forecast && (
                  <div style={{ fontSize: 9, color: "#C4B5FD" }}>±{d.high - d.total}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Forecast table */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", padding: "10px 16px", gap: 8 }}>
          {["Month", "Type", "Projected", "Low Bound", "High Bound"].map((h) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>{h}</div>
          ))}
        </div>
        {data.map((d, i) => (
          <div key={d.month} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", padding: "10px 16px", gap: 8, background: i % 2 === 0 ? "#fff" : "#FAFAFA", borderBottom: "1px solid #F3F4F6", alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{d.month}</div>
            <div>
              <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: d.forecast ? "#F5F3FF" : "#EFF6FF", color: d.forecast ? "#7C3AED" : "#2563EB" }}>
                {d.forecast ? "Forecast" : "Historical"}
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: d.forecast ? "#7C3AED" : "#111827" }}>{d.total}</div>
            <div style={{ fontSize: 13, color: "#9CA3AF" }}>{d.forecast ? d.low : "—"}</div>
            <div style={{ fontSize: 13, color: "#9CA3AF" }}>{d.forecast ? d.high : "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3 — Unsafe Pattern Detection
// ---------------------------------------------------------------------------

const PATTERN_ICON: Record<Pattern["type"], typeof ShieldAlert> = {
  zone_hotspot: MapPinIcon, recurring_type: AlertOctagonIcon,
  time_cluster: ClockIcon, category_cluster: LayersIcon, open_backlog: PackageIcon,
};

import { MapPin as MapPinIcon, AlertOctagon as AlertOctagonIcon, Clock as ClockIcon, Layers as LayersIcon, Package as PackageIcon } from "lucide-react";

function PatternsTab({ patterns }: { patterns: Pattern[] }) {
  const sev = (s: string) => LEVEL_TONE[s.charAt(0).toUpperCase() + s.slice(1)] ?? LEVEL_TONE.Low;

  const TYPE_LABEL: Record<Pattern["type"], string> = {
    zone_hotspot: "Zone Hotspot", recurring_type: "Recurring Type",
    time_cluster: "Time Cluster", category_cluster: "Category Cluster", open_backlog: "Open Backlog",
  };

  if (patterns.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>
        <BrainCircuit size={40} style={{ opacity: 0.2, marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
        No significant patterns detected with current data volume.
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Total Patterns", value: patterns.length, color: "#374151", bg: "#F9FAFB", border: "#E5E7EB" },
          { label: "Critical", value: patterns.filter((p) => p.severity === "critical").length, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
          { label: "High", value: patterns.filter((p) => p.severity === "high").length, color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA" },
          { label: "Pattern Types", value: new Set(patterns.map((p) => p.type)).size, color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
        ].map((s) => (
          <div key={s.label} style={{ flex: "1 1 120px", background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pattern list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {patterns.map((p) => {
          const tone = sev(p.severity);
          const Icon = PATTERN_ICON[p.type] ?? Zap;
          return (
            <div key={p.id} style={{ background: "#fff", border: `1px solid ${tone.border}`, borderRadius: 12, padding: "16px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: tone.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={18} color={tone.text} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{p.title}</span>
                  <span style={{ padding: "2px 8px", borderRadius: 10, background: tone.bg, border: `1px solid ${tone.border}`, fontSize: 10, fontWeight: 700, color: tone.text }}>
                    {p.severity.toUpperCase()}
                  </span>
                  <span style={{ padding: "2px 8px", borderRadius: 10, background: "#F3F4F6", fontSize: 10, fontWeight: 600, color: "#6B7280" }}>
                    {TYPE_LABEL[p.type]}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "#6B7280" }}>{p.detail}</div>
              </div>
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: tone.text }}>{p.count}</div>
                <div style={{ fontSize: 10, color: "#9CA3AF" }}>events</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 4 — Risk Recommendations
// ---------------------------------------------------------------------------

function RecommendationsTab({ recommendations }: { recommendations: Recommendation[] }) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const toggle = (id: string) => setCompleted((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  if (recommendations.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>
        No recommendations generated — all zones appear controlled.
      </div>
    );
  }

  const done = completed.size;
  const pct  = Math.round((done / recommendations.length) * 100);

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Progress header */}
      <div style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)", borderRadius: 14, padding: "20px 24px", marginBottom: 24, color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Action Completion</div>
            <div style={{ fontSize: 12, color: "#C7D2FE", marginTop: 2 }}>{done} of {recommendations.length} recommendations actioned</div>
          </div>
          <div style={{ width: 56, height: 56, borderRadius: "50%", border: "4px solid #818CF8", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{pct}%</span>
          </div>
        </div>
        <div style={{ height: 8, background: "rgba(255,255,255,0.15)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "#818CF8", borderRadius: 4, transition: "width 0.4s" }} />
        </div>
      </div>

      {/* Summary chips */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {(["Critical", "High", "Medium", "Low"] as const).map((pr) => {
          const cnt = recommendations.filter((r) => r.priority === pr).length;
          if (cnt === 0) return null;
          const tone = LEVEL_TONE[pr];
          return (
            <div key={pr} style={{ padding: "8px 16px", borderRadius: 20, background: tone.bg, border: `1px solid ${tone.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: tone.text }}>{cnt} {pr}</span>
            </div>
          );
        })}
      </div>

      {/* Recommendation cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {recommendations.map((rec) => {
          const tone = LEVEL_TONE[rec.priority];
          const Icon = CAT_ICON[rec.category] ?? Lightbulb;
          const catColor = CAT_COLOR[rec.category] ?? "#374151";
          const done = completed.has(rec.id);
          return (
            <div key={rec.id} style={{ background: "#fff", border: `1px solid ${done ? "#BBF7D0" : tone.border}`, borderRadius: 14, padding: "18px 20px", opacity: done ? 0.65 : 1, transition: "opacity 0.2s" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                {/* Category icon */}
                <div style={{ width: 44, height: 44, borderRadius: 12, background: done ? "#F0FDF4" : tone.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {done ? <CheckCircle2 size={20} color="#16A34A" /> : <Icon size={20} color={catColor} />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: done ? "#6B7280" : "#111827", textDecoration: done ? "line-through" : "none" }}>
                      {rec.action}
                    </span>
                    <span style={{ padding: "2px 8px", borderRadius: 10, background: tone.bg, border: `1px solid ${tone.border}`, fontSize: 10, fontWeight: 700, color: tone.text }}>
                      {rec.priority}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 8 }}>{rec.rationale}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <ArrowUpRight size={12} color="#9CA3AF" />
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>Target: <strong style={{ color: "#374151" }}>{rec.target}</strong></span>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => toggle(rec.id)}
                  style={{
                    padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, flexShrink: 0,
                    background: done ? "#F0FDF4" : tone.bg,
                    color: done ? "#16A34A" : tone.text,
                  }}
                >
                  {done ? "✓ Done" : "Mark Done"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page shell
// ---------------------------------------------------------------------------

const TABS: { key: Tab; label: string; icon: typeof BrainCircuit }[] = [
  { key: "predictions",     label: "AI Risk Predictions",      icon: BrainCircuit },
  { key: "forecast",        label: "Future Incident Forecast",  icon: TrendingUp },
  { key: "patterns",        label: "Unsafe Pattern Detection",  icon: Zap },
  { key: "recommendations", label: "Risk Recommendations",      icon: Lightbulb },
];

export function PredictiveRiskAIPage() {
  const { data: hazards    = [], isLoading: l1, refetch: r1 } = useListHazardsQuery();
  const { data: nearMisses = [], isLoading: l2, refetch: r2 } = useGetNearMissQuery();
  const { data: violations = [], isLoading: l3, refetch: r3 } = useGetViolationsQuery();
  const [activeTab, setActiveTab] = useState<Tab>("predictions");

  const isLoading = l1 || l2 || l3;

  const predictions    = usePredictions(hazards, nearMisses, violations);
  const forecastData   = useForecast(hazards, nearMisses, violations);
  const patterns       = usePatterns(hazards, nearMisses, violations);
  const recommendations = useRecommendations(predictions, patterns, hazards);

  const criticalZones   = predictions.filter((p) => p.level === "Critical").length;
  const totalEvents     = hazards.length + nearMisses.length + violations.length;
  const upTrend         = predictions.filter((p) => p.trend === "up").length;

  return (
    <div style={{ minHeight: "100vh", background: "#F3F7FF" }}>
      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #4C1D95 45%, #1E3A5F 100%)", padding: "28px 32px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <BrainCircuit size={22} color="#A78BFA" />
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#fff" }}>Predictive Risk AI</h1>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#C7D2FE", opacity: 0.9 }}>
              AI-derived predictions · incident forecasting · pattern detection · smart recommendations
            </p>
          </div>
          <button
            onClick={() => { r1(); r2(); r3(); }}
            disabled={isLoading}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "#fff", fontSize: 13, cursor: "pointer" }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 0, marginBottom: 0 }}>
          {[
            { label: "Zones Analysed",       value: predictions.length,       color: "#C7D2FE" },
            { label: "Critical Zones",        value: criticalZones,            color: "#FCA5A5" },
            { label: "Patterns Detected",     value: patterns.length,          color: "#FDE68A" },
            { label: "Rising-Trend Zones",    value: upTrend,                  color: "#FCA5A5" },
            { label: "Recommendations",       value: recommendations.length,   color: "#A7F3D0" },
          ].map((s, i) => (
            <div key={s.label} style={{ flex: 1, padding: "12px 20px", borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* AI model note */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, padding: "8px 14px", background: "rgba(255,255,255,0.08)", borderRadius: 8, width: "fit-content" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34D399" }} />
          <span style={{ fontSize: 11, color: "#A7F3D0" }}>
            AI model active · Analysing {totalEvents} events across {predictions.length} zones
          </span>
        </div>

        {/* Tabs */}
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
                  padding: "10px 18px", border: "none", cursor: "pointer",
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
          <BrainCircuit size={32} color="#7C3AED" style={{ opacity: 0.4 }} />
          <span style={{ marginLeft: 12, color: "#9CA3AF", fontSize: 14 }}>AI model processing data…</span>
        </div>
      )}

      {/* Tab content */}
      {!isLoading && (
        <div style={{ background: "#fff", borderRadius: "0 0 12px 12px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          {activeTab === "predictions"     && <AIPredictionsTab    predictions={predictions} />}
          {activeTab === "forecast"        && <ForecastTab         data={forecastData} />}
          {activeTab === "patterns"        && <PatternsTab         patterns={patterns} />}
          {activeTab === "recommendations" && <RecommendationsTab  recommendations={recommendations} />}
        </div>
      )}
    </div>
  );
}
