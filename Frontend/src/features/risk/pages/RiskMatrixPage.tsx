import { useMemo, useState } from "react";
import {
  ShieldAlert, AlertTriangle, Loader2, RefreshCw,
  Flame, AlertCircle, CheckCircle2, BarChart3,
  Layers, TrendingUp, Info,
} from "lucide-react";
import { useListHazardsQuery, useListRiskAssessmentsQuery } from "@/features/hazards/api/hazardsApi";
import { useGetNearMissQuery } from "@/features/near-miss/api/nearMissApi";
import type { Hazard } from "@/features/hazards/api/hazardsApi";
import type { NearMiss } from "@/services/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "likelihood" | "severity" | "heatmap";

interface RiskItem {
  id: string;
  title: string;
  source: "Hazard" | "Near Miss";
  sevValue: number;   // 1-5
  likValue: number;   // 1-5
  severity: string;
  status: string;
}

// ── Shared Config ─────────────────────────────────────────────────────────────

const SEV_ROWS = [
  { label: "Catastrophic", value: 5, sub: "Fatality / Major disaster" },
  { label: "Major",        value: 4, sub: "Serious injury / Large loss" },
  { label: "Moderate",     value: 3, sub: "Medical treatment required" },
  { label: "Minor",        value: 2, sub: "First aid / Small loss" },
  { label: "Negligible",   value: 1, sub: "No injury / Minimal impact" },
] as const;

const LIK_COLS = [
  { label: "Frequent",    value: 5, sub: "Daily / Very common" },
  { label: "Probable",    value: 4, sub: "Weekly / Likely" },
  { label: "Occasional",  value: 3, sub: "Monthly / Possible" },
  { label: "Remote",      value: 2, sub: "Yearly / Unlikely" },
  { label: "Improbable",  value: 1, sub: "Rare / Very unlikely" },
] as const;

function riskScore(sev: number, lik: number) { return sev * lik; }

function riskTone(score: number): { bg: string; border: string; text: string; label: string } {
  if (score >= 15) return { bg: "#DC2626", border: "#B91C1C", text: "#fff",     label: "Stop" };
  if (score >= 8)  return { bg: "#EA580C", border: "#C2410C", text: "#fff",     label: "Urgent" };
  if (score >= 4)  return { bg: "#D97706", border: "#B45309", text: "#fff",     label: "Action" };
  return              { bg: "#16A34A", border: "#15803D", text: "#fff",     label: "Monitor" };
}

function sevToValue(sev: string): number {
  const s = sev.toLowerCase();
  if (s === "critical" || s === "Critical") return 5;
  if (s === "high"     || s === "High")     return 4;
  if (s === "medium"   || s === "Medium")   return 3;
  if (s === "low"      || s === "Low")      return 2;
  return 2;
}

function likFromFreqStatus(freq: number, status: string): number {
  const st = (status || "").toLowerCase();
  if (freq >= 5)                            return 5;
  if (freq >= 3)                            return 4;
  if (freq >= 2)                            return 3;
  if (st === "open" || st === "under investigation") return 3;
  if (st === "mitigated")                   return 2;
  return 1;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function HeroStat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex-1 px-6 py-4 text-center">
      <div className="text-[26px] font-black text-white leading-none" style={color ? { color } : undefined}>{value}</div>
      <div className="text-[11px] font-semibold mt-1 uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.55)" }}>{label}</div>
    </div>
  );
}

function SevBadge({ sev }: { sev: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    critical: { color: "#DC2626", bg: "#FEE2E2" }, Critical: { color: "#DC2626", bg: "#FEE2E2" },
    high:     { color: "#EA580C", bg: "#FFEDD5" }, High:     { color: "#EA580C", bg: "#FFEDD5" },
    medium:   { color: "#D97706", bg: "#FEF3C7" }, Medium:   { color: "#D97706", bg: "#FEF3C7" },
    low:      { color: "#16A34A", bg: "#DCFCE7" }, Low:      { color: "#16A34A", bg: "#DCFCE7" },
  };
  const c = map[sev] ?? { color: "#6B7280", bg: "#F3F4F6" };
  return <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize" style={{ color: c.color, background: c.bg }}>{sev}</span>;
}

function SourceBadge({ source }: { source: string }) {
  const isHazard = source === "Hazard";
  return (
    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ color: isHazard ? "#7C3AED" : "#2563EB", background: isHazard ? "#EDE9FE" : "#DBEAFE" }}>
      {source}
    </span>
  );
}

// ── Derive combined risk items from hazards + near misses ─────────────────────

function useRiskItems(hazards: Hazard[], nearMisses: NearMiss[]): RiskItem[] {
  return useMemo(() => {
    // Count type frequencies across all items to derive likelihood
    const typeFreq: Record<string, number> = {};
    for (const h of hazards)     typeFreq[h.type || "Unknown"] = (typeFreq[h.type || "Unknown"] || 0) + 1;
    for (const n of nearMisses)  typeFreq[n.Category || "Unknown"] = (typeFreq[n.Category || "Unknown"] || 0) + 1;

    const items: RiskItem[] = [];

    for (const h of hazards) {
      const freq = typeFreq[h.type || "Unknown"] || 1;
      const sv = sevToValue(h.severity);
      const lv = likFromFreqStatus(freq, h.status);
      items.push({ id: h.id, title: h.title || "Unnamed hazard", source: "Hazard", sevValue: sv, likValue: lv, severity: h.severity, status: h.status });
    }

    for (const n of nearMisses) {
      const freq = typeFreq[n.Category || "Unknown"] || 1;
      const sv = sevToValue(n.Severity);
      const lv = likFromFreqStatus(freq, n.Status);
      items.push({ id: n.NearMiss_ID, title: n.Title, source: "Near Miss", sevValue: sv, likValue: lv, severity: n.Severity, status: n.Status });
    }

    return items;
  }, [hazards, nearMisses]);
}

// ── TAB 1: Likelihood Matrix ──────────────────────────────────────────────────

function LikelihoodMatrixTab({ items, isLoading, refetch }: { items: RiskItem[]; isLoading: boolean; refetch: () => void }) {
  const [selected, setSelected] = useState<{ sev: number; lik: number } | null>(null);

  const cellItems = useMemo(() => {
    const map: Record<string, RiskItem[]> = {};
    for (const item of items) {
      const key = `${item.sevValue}-${item.likValue}`;
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }
    return map;
  }, [items]);

  const selectedItems = selected ? (cellItems[`${selected.sev}-${selected.lik}`] || []) : [];
  const stopCount    = items.filter((i) => riskScore(i.sevValue, i.likValue) >= 15).length;
  const urgentCount  = items.filter((i) => { const s = riskScore(i.sevValue, i.likValue); return s >= 8 && s < 15; }).length;

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
          {/* Alert strip */}
          {(stopCount > 0 || urgentCount > 0) && (
            <div className="flex flex-wrap gap-3">
              {stopCount > 0 && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border flex-1" style={{ background: "#FEF2F2", borderColor: "#FECACA" }}>
                  <Flame className="w-4 h-4 flex-shrink-0" style={{ color: "#DC2626" }} />
                  <span className="text-[13px] font-semibold" style={{ color: "#991B1B" }}>
                    {stopCount} item{stopCount !== 1 ? "s" : ""} in the <strong>Stop / Critical</strong> zone — immediate action required
                  </span>
                </div>
              )}
              {urgentCount > 0 && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border flex-1" style={{ background: "#FFF7ED", borderColor: "#FED7AA" }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#EA580C" }} />
                  <span className="text-[13px] font-semibold" style={{ color: "#9A3412" }}>
                    {urgentCount} item{urgentCount !== 1 ? "s" : ""} in <strong>Urgent Action</strong> zone
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Matrix */}
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
            <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#DBEAFE" }}>
                  <Layers className="w-5 h-5" style={{ color: "#2563EB" }} />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>Likelihood × Severity Matrix</h2>
                  <p className="text-[11px]" style={{ color: "#9CA3AF" }}>
                    {items.length} items plotted · click a cell to see its contents · likelihood derived from event frequency & status
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-x-auto">
              <table className="border-collapse">
                <thead>
                  <tr>
                    <th className="text-[11px] font-bold text-right pr-3 pb-2 w-28" style={{ color: "#6B7280" }}>
                      Severity ↓ / Likelihood →
                    </th>
                    {LIK_COLS.map((col) => (
                      <th key={col.value} className="text-center px-1 pb-2" style={{ minWidth: 100 }}>
                        <div className="text-[11px] font-bold" style={{ color: "#374151" }}>{col.label} ({col.value})</div>
                        <div className="text-[9px]" style={{ color: "#9CA3AF" }}>{col.sub}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SEV_ROWS.map((row) => (
                    <tr key={row.value}>
                      <td className="text-right pr-3 py-1" style={{ minWidth: 112 }}>
                        <div className="text-[11px] font-bold" style={{ color: "#374151" }}>{row.label} ({row.value})</div>
                        <div className="text-[9px]" style={{ color: "#9CA3AF" }}>{row.sub}</div>
                      </td>
                      {LIK_COLS.map((col) => {
                        const score = riskScore(row.value, col.value);
                        const tone  = riskTone(score);
                        const count = (cellItems[`${row.value}-${col.value}`] || []).length;
                        const isSelected = selected?.sev === row.value && selected?.lik === col.value;
                        return (
                          <td key={col.value} className="px-1 py-1">
                            <button
                              onClick={() => setSelected(isSelected ? null : { sev: row.value, lik: col.value })}
                              className="w-full rounded-xl transition-all"
                              style={{
                                background: tone.bg,
                                border: `2px solid ${isSelected ? "#6366F1" : tone.border}`,
                                boxShadow: isSelected ? "0 0 0 3px #6366F133" : "none",
                                padding: "10px 8px",
                                minWidth: 90,
                              }}>
                              <div className="text-[16px] font-black" style={{ color: tone.text }}>{score}</div>
                              <div className="text-[10px] font-bold" style={{ color: tone.text, opacity: 0.85 }}>{tone.label}</div>
                              {count > 0 && (
                                <div className="mt-1.5 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full"
                                  style={{ background: "rgba(0,0,0,0.18)", color: "#fff" }}>
                                  <span className="text-[10px] font-black">{count}</span>
                                </div>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-5 flex-wrap">
                {[
                  { bg: "#DC2626", label: "Stop (≥15)" },
                  { bg: "#EA580C", label: "Urgent (8–14)" },
                  { bg: "#D97706", label: "Action (4–7)" },
                  { bg: "#16A34A", label: "Monitor (1–3)" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ background: l.bg }} />
                    <span className="text-[11px] font-semibold" style={{ color: "#6B7280" }}>{l.label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 ml-auto">
                  <Info className="w-3.5 h-3.5" style={{ color: "#9CA3AF" }} />
                  <span className="text-[11px]" style={{ color: "#9CA3AF" }}>Score = Severity × Likelihood · numbers in cells = item count</span>
                </div>
              </div>
            </div>
          </div>

          {/* Selected cell detail */}
          {selected && selectedItems.length > 0 && (
            <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#C7D2FE" }}>
              <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: "#E0E7FF", background: "#EEF2FF" }}>
                <ShieldAlert className="w-4 h-4" style={{ color: "#6366F1" }} />
                <span className="text-[13px] font-bold" style={{ color: "#3730A3" }}>
                  {SEV_ROWS.find((r) => r.value === selected.sev)?.label} × {LIK_COLS.find((c) => c.value === selected.lik)?.label}
                  {" "}— Score {riskScore(selected.sev, selected.lik)} · {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""}
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                    {["Item", "Source", "Severity", "Status"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-blue-50/20 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                      <td className="px-5 py-3">
                        <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{item.title}</div>
                        <div className="text-[10px]" style={{ color: "#9CA3AF" }}>ID: {item.id.slice(0, 12)}</div>
                      </td>
                      <td className="px-5 py-3"><SourceBadge source={item.source} /></td>
                      <td className="px-5 py-3"><SevBadge sev={item.severity} /></td>
                      <td className="px-5 py-3 text-[12px] capitalize" style={{ color: "#6B7280" }}>{item.status}</td>
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

// ── TAB 2: Severity Matrix ────────────────────────────────────────────────────

function SeverityMatrixTab({ hazards, nearMisses, isLoading, refetch }: {
  hazards: Hazard[]; nearMisses: NearMiss[]; isLoading: boolean; refetch: () => void;
}) {
  const { data: assessments = [] } = useListRiskAssessmentsQuery();

  const SEV_LEVELS = [
    { key: "critical", label: "Critical", color: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5", Icon: Flame },
    { key: "high",     label: "High",     color: "#EA580C", bg: "#FFEDD5", border: "#FDB898", Icon: AlertCircle },
    { key: "medium",   label: "Medium",   color: "#D97706", bg: "#FEF3C7", border: "#FCD34D", Icon: AlertTriangle },
    { key: "low",      label: "Low",      color: "#16A34A", bg: "#DCFCE7", border: "#86EFAC", Icon: CheckCircle2 },
  ] as const;

  const hazardCounts  = useMemo(() => ({ critical: hazards.filter((h) => h.severity === "critical").length, high: hazards.filter((h) => h.severity === "high").length, medium: hazards.filter((h) => h.severity === "medium").length, low: hazards.filter((h) => h.severity === "low").length }), [hazards]);
  const nmCounts      = useMemo(() => ({ critical: nearMisses.filter((n) => n.Severity === "Critical").length, high: nearMisses.filter((n) => n.Severity === "High").length, medium: nearMisses.filter((n) => n.Severity === "Medium").length, low: nearMisses.filter((n) => n.Severity === "Low").length }), [nearMisses]);
  const raCounts      = useMemo(() => ({ critical: assessments.filter((a) => a.risk_level === "critical").length, high: assessments.filter((a) => a.risk_level === "high").length, medium: assessments.filter((a) => a.risk_level === "medium").length, low: assessments.filter((a) => a.risk_level === "low").length }), [assessments]);

  function SevBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
      <div className="flex items-center gap-3 mb-2">
        <div className="w-16 text-[12px] font-semibold" style={{ color: "#374151" }}>{label}</div>
        <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        </div>
        <div className="w-7 text-right text-[12px] font-bold" style={{ color }}>{count}</div>
        <div className="w-9 text-right text-[11px]" style={{ color: "#9CA3AF" }}>{pct}%</div>
      </div>
    );
  }

  const sources = [
    { title: "Hazards", total: hazards.length, counts: hazardCounts, icon: ShieldAlert, iconBg: "#FEE2E2", iconColor: "#DC2626" },
    { title: "Near Miss Events", total: nearMisses.length, counts: nmCounts, icon: AlertTriangle, iconBg: "#FEF3C7", iconColor: "#D97706" },
    { title: "Risk Assessments", total: assessments.length, counts: raCounts, icon: BarChart3, iconBg: "#DBEAFE", iconColor: "#2563EB" },
  ];

  const combined = useMemo(() => ({
    critical: hazardCounts.critical + nmCounts.critical + raCounts.critical,
    high:     hazardCounts.high     + nmCounts.high     + raCounts.high,
    medium:   hazardCounts.medium   + nmCounts.medium   + raCounts.medium,
    low:      hazardCounts.low      + nmCounts.low      + raCounts.low,
  }), [hazardCounts, nmCounts, raCounts]);
  const combinedTotal = combined.critical + combined.high + combined.medium + combined.low;

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
          {/* Combined overview */}
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
            <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FEE2E2" }}>
                  <TrendingUp className="w-5 h-5" style={{ color: "#DC2626" }} />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>Combined Severity Overview</h2>
                  <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Across all {combinedTotal} risk items — hazards, near misses, and assessments</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {SEV_LEVELS.map(({ key, label, color, bg, border, Icon }) => {
                  const cnt = combined[key];
                  const pct = combinedTotal > 0 ? Math.round((cnt / combinedTotal) * 100) : 0;
                  return (
                    <div key={key} className="rounded-2xl border p-4 text-center" style={{ background: bg + "40", borderColor: border }}>
                      <div className="flex items-center justify-center mb-2">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                          <Icon className="w-5 h-5" style={{ color }} />
                        </div>
                      </div>
                      <div className="text-[28px] font-black leading-none" style={{ color: "#111827" }}>{cnt}</div>
                      <div className="text-[12px] font-bold mt-1" style={{ color }}>{label}</div>
                      <div className="w-full h-1.5 rounded-full mt-2" style={{ background: "#E5E7EB" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <div className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>{pct}% of total</div>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2.5">
                {SEV_LEVELS.map(({ key, label, color }) => (
                  <SevBar key={key} label={label} count={combined[key]} total={combinedTotal} color={color} />
                ))}
              </div>
            </div>
          </div>

          {/* Per-source breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {sources.map(({ title, total, counts, icon: Icon, iconBg, iconColor }) => (
              <div key={title} className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
                <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
                      <Icon className="w-4 h-4" style={{ color: iconColor }} />
                    </div>
                    <div>
                      <h3 className="text-[13px] font-bold" style={{ color: "#111827" }}>{title}</h3>
                      <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{total} total</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  {SEV_LEVELS.map(({ key, label, color }) => (
                    <SevBar key={key} label={label} count={counts[key]} total={total} color={color} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
            <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
              <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>Severity Comparison Table</h2>
              <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Side-by-side severity counts across all risk sources</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Severity Level</th>
                    <th className="text-center px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Hazards</th>
                    <th className="text-center px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Near Miss</th>
                    <th className="text-center px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Risk Assessments</th>
                    <th className="text-center px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {SEV_LEVELS.map(({ key, label, color, bg }) => {
                    const rowTotal = hazardCounts[key] + nmCounts[key] + raCounts[key];
                    return (
                      <tr key={key} className="border-t" style={{ borderColor: "#F3F4F6" }}>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex px-3 py-1 rounded-full text-[12px] font-bold" style={{ color, background: bg }}>{label}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center text-[14px] font-bold" style={{ color: hazardCounts[key] > 0 ? color : "#9CA3AF" }}>{hazardCounts[key]}</td>
                        <td className="px-5 py-3.5 text-center text-[14px] font-bold" style={{ color: nmCounts[key] > 0 ? color : "#9CA3AF" }}>{nmCounts[key]}</td>
                        <td className="px-5 py-3.5 text-center text-[14px] font-bold" style={{ color: raCounts[key] > 0 ? color : "#9CA3AF" }}>{raCounts[key]}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="text-[15px] font-black" style={{ color: rowTotal > 0 ? "#111827" : "#9CA3AF" }}>{rowTotal}</span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-t" style={{ background: "#F8FAFF", borderColor: "#E9EEF8" }}>
                    <td className="px-5 py-3 text-[12px] font-bold" style={{ color: "#374151" }}>Total</td>
                    <td className="px-5 py-3 text-center text-[13px] font-black" style={{ color: "#374151" }}>{hazards.length}</td>
                    <td className="px-5 py-3 text-center text-[13px] font-black" style={{ color: "#374151" }}>{nearMisses.length}</td>
                    <td className="px-5 py-3 text-center text-[13px] font-black" style={{ color: "#374151" }}>{assessments.length}</td>
                    <td className="px-5 py-3 text-center text-[14px] font-black" style={{ color: "#111827" }}>{combinedTotal}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── TAB 3: Risk Heatmap ───────────────────────────────────────────────────────

function RiskHeatmapTab({ items, isLoading, refetch }: { items: RiskItem[]; isLoading: boolean; refetch: () => void }) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const cellData = useMemo(() => {
    const map: Record<string, RiskItem[]> = {};
    for (const item of items) {
      const key = `${item.sevValue}-${item.likValue}`;
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }
    return map;
  }, [items]);

  const riskBuckets = useMemo(() => {
    const stop   = items.filter((i) => riskScore(i.sevValue, i.likValue) >= 15);
    const urgent = items.filter((i) => { const s = riskScore(i.sevValue, i.likValue); return s >= 8 && s < 15; });
    const action = items.filter((i) => { const s = riskScore(i.sevValue, i.likValue); return s >= 4 && s < 8; });
    const monitor = items.filter((i) => riskScore(i.sevValue, i.likValue) < 4);
    return { stop, urgent, action, monitor };
  }, [items]);

  const hoveredItems = hoveredCell ? (cellData[hoveredCell] || []) : [];

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
          {/* Risk zone summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Stop Zone", count: riskBuckets.stop.length,    color: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5", score: "≥15", Icon: Flame },
              { label: "Urgent",    count: riskBuckets.urgent.length,  color: "#EA580C", bg: "#FFEDD5", border: "#FDB898", score: "8–14", Icon: AlertCircle },
              { label: "Action",    count: riskBuckets.action.length,  color: "#D97706", bg: "#FEF3C7", border: "#FCD34D", score: "4–7",  Icon: AlertTriangle },
              { label: "Monitor",   count: riskBuckets.monitor.length, color: "#16A34A", bg: "#DCFCE7", border: "#86EFAC", score: "1–3",  Icon: CheckCircle2 },
            ].map(({ label, count, color, bg, border, score, Icon }) => (
              <div key={label} className="bg-white rounded-2xl border p-4 text-center" style={{ borderColor: border }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: bg }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="text-[28px] font-black leading-none" style={{ color: "#111827" }}>{count}</div>
                <div className="text-[12px] font-bold mt-1" style={{ color }}>{label}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>Score {score}</div>
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
            <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FEE2E2" }}>
                  <BarChart3 className="w-5 h-5" style={{ color: "#DC2626" }} />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>Risk Heatmap</h2>
                  <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Hover a cell to see items · intensity reflects number of risk items per zone</p>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-x-auto">
              <table className="border-collapse">
                <thead>
                  <tr>
                    <th className="text-[10px] font-bold text-right pr-3 pb-2 w-24" style={{ color: "#6B7280" }}>Severity ↓ / Likelihood →</th>
                    {LIK_COLS.map((col) => (
                      <th key={col.value} className="text-center px-1 pb-2" style={{ minWidth: 90 }}>
                        <div className="text-[11px] font-bold" style={{ color: "#374151" }}>{col.label}</div>
                        <div className="text-[9px]" style={{ color: "#9CA3AF" }}>L{col.value}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SEV_ROWS.map((row) => (
                    <tr key={row.value}>
                      <td className="text-right pr-3 py-1">
                        <div className="text-[11px] font-bold" style={{ color: "#374151" }}>{row.label}</div>
                        <div className="text-[9px]" style={{ color: "#9CA3AF" }}>S{row.value}</div>
                      </td>
                      {LIK_COLS.map((col) => {
                        const score = riskScore(row.value, col.value);
                        const tone  = riskTone(score);
                        const cellKey = `${row.value}-${col.value}`;
                        const count = (cellData[cellKey] || []).length;
                        const intensity = Math.min(count / 5, 1); // 0–1 scale for opacity
                        const isHovered = hoveredCell === cellKey;

                        return (
                          <td key={col.value} className="px-1 py-1">
                            <div
                              onMouseEnter={() => setHoveredCell(cellKey)}
                              onMouseLeave={() => setHoveredCell(null)}
                              className="rounded-xl cursor-pointer transition-all"
                              style={{
                                background: tone.bg,
                                opacity: count === 0 ? 0.25 + 0.15 : 0.4 + intensity * 0.6,
                                border: `2px solid ${isHovered ? "#6366F1" : tone.border}`,
                                padding: "14px 8px",
                                minWidth: 82,
                                textAlign: "center",
                                boxShadow: isHovered ? "0 0 0 3px #6366F133" : "none",
                              }}>
                              <div className="text-[18px] font-black leading-none" style={{ color: count > 0 ? "#111827" : "#CBD5E1" }}>
                                {count > 0 ? count : "·"}
                              </div>
                              <div className="text-[9px] font-bold mt-0.5" style={{ color: count > 0 ? tone.bg === "#DC2626" ? "#fff" : "#374151" : "#CBD5E1" }}>
                                {score}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-5 flex-wrap">
                <span className="text-[11px] font-semibold" style={{ color: "#6B7280" }}>Color = Risk Zone</span>
                {[
                  { bg: "#DC2626", label: "Stop" },
                  { bg: "#EA580C", label: "Urgent" },
                  { bg: "#D97706", label: "Action" },
                  { bg: "#16A34A", label: "Monitor" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ background: l.bg }} />
                    <span className="text-[11px]" style={{ color: "#6B7280" }}>{l.label}</span>
                  </div>
                ))}
                <span className="text-[11px] ml-auto" style={{ color: "#9CA3AF" }}>Number = items · opacity = density</span>
              </div>
            </div>
          </div>

          {/* Hovered cell breakdown */}
          {hoveredCell && hoveredItems.length > 0 && (
            <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
              <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "#F3F4F6", background: "#F8FAFF" }}>
                <Info className="w-4 h-4" style={{ color: "#6366F1" }} />
                <span className="text-[12px] font-bold" style={{ color: "#374151" }}>
                  {hoveredItems.length} item{hoveredItems.length !== 1 ? "s" : ""} in this zone
                </span>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {hoveredItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px]"
                    style={{ background: "#FAFBFF", borderColor: "#E9EEF8" }}>
                    <SourceBadge source={item.source} />
                    <span className="font-semibold" style={{ color: "#111827" }}>{item.title.slice(0, 40)}{item.title.length > 40 ? "…" : ""}</span>
                    <SevBadge sev={item.severity} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string }[] = [
  { key: "likelihood", label: "Likelihood Matrix" },
  { key: "severity",   label: "Severity Matrix" },
  { key: "heatmap",    label: "Risk Heatmap" },
];

export function RiskMatrixPage() {
  const { data: hazards    = [], isLoading: l1, refetch: r1 } = useListHazardsQuery();
  const { data: nearMisses = [], isLoading: l2, refetch: r2 } = useGetNearMissQuery();
  const isLoading = l1 || l2;
  const refetch = () => { r1(); r2(); };

  const [activeTab, setActiveTab] = useState<Tab>("likelihood");

  const items = useRiskItems(hazards, nearMisses);

  const stopCount   = items.filter((i) => riskScore(i.sevValue, i.likValue) >= 15).length;
  const urgentCount = items.filter((i) => { const s = riskScore(i.sevValue, i.likValue); return s >= 8 && s < 15; }).length;
  const totalItems  = items.length;
  const controlled  = [...hazards].filter((h) => h.status === "mitigated" || h.status === "closed").length;

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>
      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 40%, #1E3A5F 100%)" }}>
        <div className="px-8 pt-8 pb-0">
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Risk Module</p>
          <h1 className="text-[26px] font-black text-white">Risk Matrix</h1>
          <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Likelihood analysis · Severity classification · Visual risk heatmap
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex border-t mt-6 divide-x" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <HeroStat label="Total Risk Items" value={isLoading ? "…" : totalItems} />
          <HeroStat label="Stop Zone"        value={isLoading ? "…" : stopCount}   color="#FCA5A5" />
          <HeroStat label="Urgent Zone"      value={isLoading ? "…" : urgentCount} color="#FCD34D" />
          <HeroStat label="Controlled"       value={isLoading ? "…" : controlled}  color="#86EFAC" />
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
        {activeTab === "likelihood" && <LikelihoodMatrixTab items={items} isLoading={isLoading} refetch={refetch} />}
        {activeTab === "severity"   && <SeverityMatrixTab   hazards={hazards} nearMisses={nearMisses} isLoading={isLoading} refetch={refetch} />}
        {activeTab === "heatmap"    && <RiskHeatmapTab      items={items} isLoading={isLoading} refetch={refetch} />}
      </div>
    </div>
  );
}
