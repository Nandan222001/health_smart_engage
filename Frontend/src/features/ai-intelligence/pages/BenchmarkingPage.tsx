import { useMemo, useState } from "react";
import {
  BarChart3, Building2, Users, Globe, Trophy, RefreshCw,
  Loader2, TrendingUp, TrendingDown, Minus, Medal,
  AlertTriangle, CheckCircle2, ArrowUpRight, ArrowDownRight,
  Target, Star,
} from "lucide-react";
import {
  useGetComplianceBenchmarkingQuery,
  useGetRiskScoringQuery,
  useGetKPIIntelligenceQuery,
} from "@/features/ai-intelligence/api/aiIntelligenceApi";
import { useListSitesQuery } from "@/features/sites/api/sitesApi";
import { useGetIncidentReportsQuery, useGetIncidentAnalyticsQuery } from "@/features/incidents/api/incidentsApi";
import { useListHazardsQuery } from "@/features/hazards/api/hazardsApi";
import { useListTrainingGapsQuery } from "@/features/training/api/trainingApi";
import { useGetComplianceDashboardQuery } from "@/features/compliance/api/complianceApi";
import type { ComplianceBenchmark, RiskScore } from "@/features/ai-intelligence/api/aiIntelligenceApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  return score >= 80 ? "#16A34A" : score >= 60 ? "#D97706" : score >= 40 ? "#EA580C" : "#DC2626";
}
function scoreBg(score: number): string {
  return score >= 80 ? "#DCFCE7" : score >= 60 ? "#FEF3C7" : score >= 40 ? "#FFEDD5" : "#FEE2E2";
}
function scoreLabel(score: number): string {
  return score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Poor";
}

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

// ── Shared atoms ──────────────────────────────────────────────────────────────

function HeroStat({ label, value, color, sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div className="flex-1 px-5 py-4 text-center">
      <div className="text-[24px] font-black text-white leading-none" style={color ? { color } : undefined}>{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{sub}</div>}
      <div className="text-[11px] font-semibold mt-1 uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.55)" }}>{label}</div>
    </div>
  );
}
function HeroDivider() { return <div className="w-px my-3" style={{ background: "rgba(255,255,255,0.15)" }} />; }

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border bg-white ${className}`} style={{ borderColor: "#E3E9F6" }}>{children}</div>;
}

function SectionHeader({ icon: Icon, title, accent, sub }: {
  icon: React.ElementType; title: string; accent: string; sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
      <div className="p-2 rounded-xl" style={{ background: `${accent}1A` }}>
        <Icon size={16} style={{ color: accent }} />
      </div>
      <div>
        <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ScoreBar({ score, max = 100, color }: { score: number; max?: number; color: string }) {
  const pct = Math.min(100, (score / max) * 100);
  return (
    <div className="flex-1 h-2 rounded-full" style={{ background: "#F0F3FA" }}>
      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function TrendPill({ value, inverse = false }: { value: number; inverse?: boolean }) {
  const good = inverse ? value < 0 : value > 0;
  const neutral = value === 0;
  const color = neutral ? "#6B7280" : good ? "#16A34A" : "#DC2626";
  const bg    = neutral ? "#F3F4F6" : good ? "#DCFCE7" : "#FEE2E2";
  const Icon  = neutral ? Minus : good ? (inverse ? ArrowDownRight : ArrowUpRight) : (inverse ? ArrowUpRight : ArrowDownRight);
  return (
    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ color, background: bg }}>
      <Icon size={9} />{value > 0 ? "+" : ""}{value}%
    </span>
  );
}

// ── Grouped bar (3 values side by side) ──────────────────────────────────────

function GroupedBar({ label, yours, industryAvg, bestInClass }: {
  label: string; yours: number; industryAvg: number; bestInClass: number;
}) {
  const max = Math.max(yours, industryAvg, bestInClass, 1);
  const bars = [
    { label: "You", value: yours,       color: "#4F46E5" },
    { label: "Avg", value: industryAvg, color: "#9CA3AF" },
    { label: "Best",value: bestInClass, color: "#16A34A" },
  ];
  return (
    <div className="p-3 rounded-xl" style={{ background: "#F8FAFF" }}>
      <div className="text-xs font-bold text-gray-700 mb-2 truncate">{label}</div>
      <div className="space-y-1.5">
        {bars.map(({ label: bl, value, color }) => (
          <div key={bl} className="flex items-center gap-2">
            <span className="w-6 text-[10px] font-semibold text-gray-400">{bl}</span>
            <div className="flex-1 h-2 rounded-full" style={{ background: "#E3E9F6" }}>
              <div className="h-2 rounded-full" style={{ width: `${(value / max) * 100}%`, background: color }} />
            </div>
            <span className="w-7 text-right text-[10px] font-bold" style={{ color }}>{value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 1. Site Comparison ────────────────────────────────────────────────────────

interface SiteStats {
  id: string;
  name: string;
  incidents: number;
  hazards: number;
  score: number;
  riskLevel: string;
}

function SiteComparisonSection({ sites, siteDist, hazards, riskScores }: {
  sites: { id: string; name: string }[];
  siteDist: Record<string, number>;
  hazards: { id: string; site_id?: string; severity: string; status: string }[];
  riskScores: RiskScore[];
}) {
  const [sort, setSort] = useState<"score" | "incidents" | "hazards">("score");

  const siteStats: SiteStats[] = useMemo(() => {
    const allNames = new Set([
      ...sites.map((s) => s.name),
      ...Object.keys(siteDist),
    ]);

    const byName = sites.reduce<Record<string, string>>((acc, s) => {
      acc[s.id] = s.name;
      return acc;
    }, {});

    const hazardBySite: Record<string, number> = {};
    hazards.forEach((h) => {
      const siteId = h.site_id ?? "unknown";
      const name = byName[siteId] ?? siteId;
      hazardBySite[name] = (hazardBySite[name] ?? 0) + 1;
    });

    const riskBySite: Record<string, number> = {};
    riskScores.filter((r) => r.entity_type === "site").forEach((r) => {
      riskBySite[r.entity_name] = r.score;
    });

    const allSiteNames = Array.from(new Set([
      ...Object.keys(siteDist),
      ...Object.keys(hazardBySite),
      ...Object.keys(riskBySite),
    ]));

    if (allSiteNames.length === 0) return [];

    const maxInc = Math.max(...allSiteNames.map((n) => siteDist[n] ?? 0), 1);
    const maxHaz = Math.max(...allSiteNames.map((n) => hazardBySite[n] ?? 0), 1);
    const maxRisk = Math.max(...allSiteNames.map((n) => riskBySite[n] ?? 0), 1);

    return allSiteNames.map((name) => {
      const inc = siteDist[name] ?? 0;
      const haz = hazardBySite[name] ?? 0;
      const risk = riskBySite[name] ?? 0;
      const rawScore = 100
        - Math.round((inc / maxInc) * 45)
        - Math.round((haz / maxHaz) * 30)
        - Math.round((risk / maxRisk) * 25);
      const score = Math.max(0, rawScore);
      const site = sites.find((s) => s.name === name);
      return {
        id: site?.id ?? name,
        name,
        incidents: inc,
        hazards: haz,
        score,
        riskLevel: score >= 80 ? "low" : score >= 60 ? "medium" : score >= 40 ? "high" : "critical",
      };
    });
  }, [sites, siteDist, hazards, riskScores]);

  const sorted = useMemo(() =>
    [...siteStats].sort((a, b) =>
      sort === "score" ? b.score - a.score :
      sort === "incidents" ? b.incidents - a.incidents :
      b.hazards - a.hazards
    ),
    [siteStats, sort]
  );

  const best  = sorted[0];
  const worst = sorted[sorted.length - 1];

  return (
    <Card>
      <SectionHeader icon={Building2} title="Site Comparison" accent="#2563EB"
        sub="Safety score derived from incidents, hazards, and risk" />

      {/* Best / Worst callout */}
      {sorted.length >= 2 && (
        <div className="px-5 pt-4 grid grid-cols-2 gap-3">
          {[
            { label: "Safest Site", site: best, icon: CheckCircle2, iconColor: "#16A34A" },
            { label: "Needs Attention", site: worst, icon: AlertTriangle, iconColor: "#DC2626" },
          ].map(({ label, site, icon: Icon, iconColor }) => (
            <div key={label} className="p-3 rounded-xl" style={{ background: "#F8FAFF" }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={13} style={{ color: iconColor }} />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</span>
              </div>
              <div className="text-sm font-black text-gray-800 truncate">{site?.name ?? "—"}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold" style={{ color: scoreColor(site?.score ?? 0) }}>
                  {site?.score ?? 0} / 100
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ color: scoreColor(site?.score ?? 0), background: scoreBg(site?.score ?? 0) }}>
                  {scoreLabel(site?.score ?? 0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sort tabs */}
      <div className="px-5 pt-4 flex gap-2">
        {(["score", "incidents", "hazards"] as const).map((s) => (
          <button key={s} onClick={() => setSort(s)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all"
            style={{
              background: sort === s ? "#2563EB" : "#F0F3FA",
              color: sort === s ? "#fff" : "#6B7280",
            }}>
            {s}
          </button>
        ))}
      </div>

      {/* Site list */}
      <div className="px-5 pt-3 pb-5 space-y-2 max-h-96 overflow-y-auto">
        {sorted.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border"
            style={{ borderColor: "#E3E9F6" }}>
            <span className="text-sm w-5 text-center font-black text-gray-300">
              {i < 3 ? RANK_MEDALS[i] : `${i + 1}`}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-800 truncate">{s.name}</span>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <ScoreBar score={s.score} color={scoreColor(s.score)} />
                <span className="text-xs font-black w-7 text-right" style={{ color: scoreColor(s.score) }}>{s.score}</span>
              </div>
              <div className="flex gap-3 mt-1">
                <span className="text-[10px] text-gray-400">{s.incidents} incidents</span>
                <span className="text-[10px] text-gray-400">{s.hazards} hazards</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
              style={{ color: scoreColor(s.score), background: scoreBg(s.score) }}>
              {scoreLabel(s.score)}
            </span>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-400">No site data available</div>
        )}
      </div>
    </Card>
  );
}

// ── 2. Department Benchmarking ────────────────────────────────────────────────

function DeptBenchmarkingSection({ deptDist, gaps }: {
  deptDist: Record<string, number>;
  gaps: { role: string; priority: string }[];
}) {
  const deptStats = useMemo(() => {
    const allDepts = new Set([
      ...Object.keys(deptDist),
      ...gaps.map((g) => g.role).filter(Boolean),
    ]);

    const gapsByRole: Record<string, { high: number; total: number }> = {};
    gaps.forEach((g) => {
      const r = g.role || "Unknown";
      if (!gapsByRole[r]) gapsByRole[r] = { high: 0, total: 0 };
      gapsByRole[r].total += 1;
      if (g.priority === "high") gapsByRole[r].high += 1;
    });

    const maxInc = Math.max(...Array.from(allDepts).map((d) => deptDist[d] ?? 0), 1);
    const maxGap = Math.max(...Object.values(gapsByRole).map((g) => g.total), 1);

    return Array.from(allDepts).map((dept) => {
      const inc = deptDist[dept] ?? 0;
      const gapData = gapsByRole[dept] ?? { high: 0, total: 0 };
      const score = Math.max(0, 100
        - Math.round((inc / maxInc) * 50)
        - Math.round((gapData.total / maxGap) * 30)
        - Math.round((gapData.high / Math.max(gapData.total, 1)) * 20)
      );
      return { dept, incidents: inc, gapTotal: gapData.total, gapHigh: gapData.high, score };
    }).sort((a, b) => b.score - a.score);
  }, [deptDist, gaps]);

  const topDept  = deptStats[0];
  const riskDept = deptStats[deptStats.length - 1];

  return (
    <Card>
      <SectionHeader icon={Users} title="Department Benchmarking" accent="#7C3AED"
        sub="Incidents, training gaps, and safety score by department" />

      {/* Top + Risk spotlight */}
      {deptStats.length >= 2 && (
        <div className="px-5 pt-4 grid grid-cols-2 gap-3">
          {[
            { label: "Top Department", item: topDept, color: "#16A34A" },
            { label: "At Risk", item: riskDept, color: "#DC2626" },
          ].map(({ label, item, color }) => (
            <div key={label} className="p-3 rounded-xl" style={{ background: "#F8FAFF" }}>
              <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">{label}</div>
              <div className="text-sm font-black text-gray-800 truncate">{item?.dept ?? "—"}</div>
              <div className="text-xs font-bold mt-0.5" style={{ color }}>{item?.score ?? 0} / 100</div>
            </div>
          ))}
        </div>
      )}

      {/* Department table */}
      <div className="px-5 pt-4 pb-5">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wide text-gray-400"
                style={{ background: "#F8FAFF" }}>
                <th className="px-3 py-2 text-left">Rank</th>
                <th className="px-3 py-2 text-left">Department</th>
                <th className="px-3 py-2 text-center">Incidents</th>
                <th className="px-3 py-2 text-center">Train. Gaps</th>
                <th className="px-3 py-2 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#E3E9F6" }}>
              {deptStats.map((d, i) => (
                <tr key={d.dept} className="hover:bg-purple-50/20 transition-colors">
                  <td className="px-3 py-2.5 text-sm text-center">
                    {i < 3 ? RANK_MEDALS[i] : <span className="text-[11px] text-gray-400">{i + 1}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-semibold text-gray-800 max-w-[120px] truncate">{d.dept}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-xs font-bold" style={{ color: d.incidents > 0 ? "#DC2626" : "#16A34A" }}>
                      {d.incidents}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-xs font-bold" style={{ color: d.gapTotal > 3 ? "#D97706" : "#6B7280" }}>
                      {d.gapTotal}
                      {d.gapHigh > 0 && <span className="text-[10px] text-red-500 ml-1">({d.gapHigh}H)</span>}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="w-16 h-1.5 rounded-full" style={{ background: "#F0F3FA" }}>
                        <div className="h-1.5 rounded-full"
                          style={{ width: `${d.score}%`, background: scoreColor(d.score) }} />
                      </div>
                      <span className="text-xs font-black w-7" style={{ color: scoreColor(d.score) }}>{d.score}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {deptStats.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-gray-400">No department data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

// ── 3. Industry Benchmark Comparison ─────────────────────────────────────────

function IndustryBenchmarkSection({ benchmarks, overallScore, trend }: {
  benchmarks: ComplianceBenchmark[];
  overallScore: number;
  trend: { label: string; value: number }[];
}) {
  const above  = benchmarks.filter((b) => b.status === "above").length;
  const onPar  = benchmarks.filter((b) => b.status === "on_par").length;
  const below  = benchmarks.filter((b) => b.status === "below").length;

  const avgGap = benchmarks.length > 0
    ? Math.round(benchmarks.reduce((s, b) => s + b.gap, 0) / benchmarks.length)
    : 0;

  return (
    <Card>
      <SectionHeader icon={Globe} title="Industry Benchmark Comparison" accent="#0891B2"
        sub="Your performance vs industry average and best-in-class" />

      {/* Summary row */}
      <div className="px-5 pt-4 grid grid-cols-4 gap-2">
        {[
          { label: "Overall Score", value: `${overallScore}%`, color: scoreColor(overallScore) },
          { label: "Above Avg", value: above, color: "#16A34A" },
          { label: "On Par", value: onPar, color: "#D97706" },
          { label: "Below Avg", value: below, color: "#DC2626" },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-3 rounded-xl text-center" style={{ background: "#F8FAFF" }}>
            <div className="text-base font-black" style={{ color }}>{value}</div>
            <div className="text-[10px] text-gray-400 mt-0.5 font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Grouped bars per standard */}
      {benchmarks.length > 0 ? (
        <div className="px-5 pt-4 pb-5">
          <div className="flex items-center gap-4 mb-3">
            {[
              { label: "You", color: "#4F46E5" },
              { label: "Industry Avg", color: "#9CA3AF" },
              { label: "Best in Class", color: "#16A34A" },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-3 h-2 rounded-sm" style={{ background: color }} />
                <span className="text-[10px] text-gray-500 font-semibold">{label}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3">
            {benchmarks.map((b) => (
              <GroupedBar key={b.standard}
                label={b.standard}
                yours={b.your_score}
                industryAvg={b.industry_avg}
                bestInClass={b.best_in_class}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="px-5 pt-4 pb-5">
          {/* Static fallback standards */}
          <div className="grid grid-cols-1 gap-3">
            {[
              { standard: "ISO 45001 (OHS)", your_score: overallScore || 72, industry_avg: 68, best_in_class: 94, gap: -4 },
              { standard: "ISO 14001 (Environment)", your_score: 65, industry_avg: 71, best_in_class: 92, gap: 6 },
              { standard: "OSHA Compliance", your_score: 78, industry_avg: 74, best_in_class: 96, gap: -4 },
              { standard: "Safety Culture Score", your_score: 61, industry_avg: 65, best_in_class: 90, gap: 4 },
            ].map((b) => (
              <GroupedBar key={b.standard}
                label={b.standard}
                yours={b.your_score}
                industryAvg={b.industry_avg}
                bestInClass={b.best_in_class}
              />
            ))}
          </div>
        </div>
      )}

      {/* Gap summary */}
      {benchmarks.length > 0 && (
        <div className="px-5 pb-5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Gap to Industry Average</p>
          <div className="space-y-2">
            {benchmarks.map((b) => {
              const isPositive = b.gap <= 0;
              const displayGap = Math.abs(b.gap);
              return (
                <div key={b.standard} className="flex items-center gap-3">
                  <span className="w-36 text-xs text-gray-600 truncate">{b.standard}</span>
                  <div className="flex-1 flex items-center gap-2">
                    {isPositive ? (
                      <>
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: "#F0F3FA" }} />
                        <div className="h-1.5 rounded-full" style={{ width: `${Math.min(displayGap * 3, 100)}%`, background: "#16A34A" }} />
                      </>
                    ) : (
                      <>
                        <div className="h-1.5 rounded-full" style={{ width: `${Math.min(displayGap * 3, 100)}%`, background: "#DC2626" }} />
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: "#F0F3FA" }} />
                      </>
                    )}
                  </div>
                  <span className="text-[10px] font-bold w-12 text-right"
                    style={{ color: isPositive ? "#16A34A" : "#DC2626" }}>
                    {isPositive ? "+" : "-"}{displayGap}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

// ── 4. Safety Performance Ranking ─────────────────────────────────────────────

interface RankedEntity {
  id: string;
  name: string;
  type: string;
  safetyScore: number;
  riskScore: number;
  level: string;
  factors: string[];
  badge: "gold" | "silver" | "bronze" | "none";
}

function SafetyPerformanceRankingSection({ riskScores, sites, deptDist, analytics }: {
  riskScores: RiskScore[];
  sites: { id: string; name: string }[];
  deptDist: Record<string, number>;
  analytics: { trir: number; total_incidents: number } | undefined;
}) {
  const [filter, setFilter] = useState<"all" | "site" | "task" | "workforce" | "permit">("all");

  const ranked: RankedEntity[] = useMemo(() => {
    const fromRisk: RankedEntity[] = riskScores.map((r, i) => ({
      id: r.id,
      name: r.entity_name,
      type: r.entity_type,
      safetyScore: Math.max(0, 100 - r.score),
      riskScore: r.score,
      level: r.level,
      factors: Array.isArray(r.factors) ? r.factors : [],
      badge: i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "none",
    })).sort((a, b) => b.safetyScore - a.safetyScore);

    // Supplement with site data if risk scores don't have site entities
    const hasSites = fromRisk.some((r) => r.type === "site");
    if (!hasSites && sites.length > 0) {
      const maxInc = Math.max(...sites.map((s) => deptDist[s.name] ?? 0), 1);
      const siteEntries: RankedEntity[] = sites.map((s, i) => {
        const inc = deptDist[s.name] ?? 0;
        const safety = Math.max(0, 100 - Math.round((inc / maxInc) * 60));
        return {
          id: s.id, name: s.name, type: "site",
          safetyScore: safety, riskScore: 100 - safety,
          level: safety >= 80 ? "low" : safety >= 60 ? "medium" : safety >= 40 ? "high" : "critical",
          factors: [], badge: i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "none",
        };
      }).sort((a, b) => b.safetyScore - a.safetyScore);
      return siteEntries;
    }

    return fromRisk;
  }, [riskScores, sites, deptDist]);

  const filtered = filter === "all" ? ranked : ranked.filter((r) => r.type === filter);

  const LEVEL_CFG: Record<string, { color: string; bg: string }> = {
    low:      { color: "#16A34A", bg: "#DCFCE7" },
    medium:   { color: "#D97706", bg: "#FEF3C7" },
    high:     { color: "#EA580C", bg: "#FFEDD5" },
    critical: { color: "#DC2626", bg: "#FEE2E2" },
  };

  const BADGE_ICONS: Record<string, React.ReactNode> = {
    gold:   <Medal size={14} style={{ color: "#F59E0B" }} />,
    silver: <Medal size={14} style={{ color: "#9CA3AF" }} />,
    bronze: <Medal size={14} style={{ color: "#B45309" }} />,
    none:   null,
  };

  const TYPE_COLORS: Record<string, string> = {
    site: "#2563EB", task: "#7C3AED", workforce: "#0891B2", permit: "#D97706",
  };

  return (
    <Card>
      <SectionHeader icon={Trophy} title="Safety Performance Ranking" accent="#F59E0B"
        sub="Overall safety ranking across sites, tasks, permits, and workforce" />

      {/* Overall KPIs */}
      <div className="px-5 pt-4 grid grid-cols-3 gap-3">
        {[
          { label: "Entities Ranked", value: ranked.length, color: "#F59E0B" },
          { label: "TRIR", value: (analytics?.trir ?? 0).toFixed(2), color: "#DC2626", sub: "per 100 workers" },
          { label: "Total Incidents", value: analytics?.total_incidents ?? 0, color: "#EA580C" },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="p-3 rounded-xl text-center" style={{ background: "#FFFBEB" }}>
            <div className="text-lg font-black" style={{ color }}>{value}</div>
            {sub && <div className="text-[9px] text-gray-400">{sub}</div>}
            <div className="text-[10px] text-gray-500 font-medium mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="px-5 pt-4 flex flex-wrap gap-2">
        {(["all", "site", "task", "workforce", "permit"] as const).map((t) => (
          <button key={t} onClick={() => setFilter(t)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all"
            style={{
              background: filter === t ? "#F59E0B" : "#F8FAFF",
              color: filter === t ? "#fff" : "#6B7280",
            }}>
            {t === "all" ? "All Entities" : t}
          </button>
        ))}
      </div>

      {/* Ranking list */}
      <div className="px-5 pt-3 pb-5 space-y-2 max-h-[420px] overflow-y-auto">
        {/* Top 3 podium */}
        {filter === "all" && filtered.length >= 3 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {filtered.slice(0, 3).map((e, i) => (
              <div key={e.id} className="p-3 rounded-xl text-center border"
                style={{
                  borderColor: i === 0 ? "#F59E0B" : i === 1 ? "#9CA3AF" : "#B45309",
                  background: i === 0 ? "#FFFBEB" : i === 1 ? "#F9FAFB" : "#FFF7ED",
                }}>
                <div className="text-xl mb-1">{["🥇", "🥈", "🥉"][i]}</div>
                <div className="text-xs font-black text-gray-800 truncate">{e.name}</div>
                <div className="text-[10px] capitalize font-medium mt-0.5"
                  style={{ color: TYPE_COLORS[e.type] ?? "#6B7280" }}>{e.type}</div>
                <div className="text-lg font-black mt-1" style={{ color: scoreColor(e.safetyScore) }}>
                  {e.safetyScore}
                </div>
                <div className="text-[9px] text-gray-400">safety score</div>
              </div>
            ))}
          </div>
        )}

        {/* Full ranked list */}
        {filtered.map((e, i) => {
          const lvlCfg = LEVEL_CFG[e.level] ?? { color: "#6B7280", bg: "#F3F4F6" };
          return (
            <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm transition-all"
              style={{ borderColor: "#E3E9F6" }}>
              <div className="w-6 flex items-center justify-center flex-shrink-0">
                {BADGE_ICONS[e.badge] ?? <span className="text-[11px] font-bold text-gray-300">{i + 1}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-800 truncate">{e.name}</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize"
                    style={{ background: `${TYPE_COLORS[e.type] ?? "#6B7280"}18`, color: TYPE_COLORS[e.type] ?? "#6B7280" }}>
                    {e.type}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: "#F0F3FA" }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${e.safetyScore}%`, background: scoreColor(e.safetyScore) }} />
                  </div>
                  <span className="text-xs font-black w-8 text-right" style={{ color: scoreColor(e.safetyScore) }}>
                    {e.safetyScore}
                  </span>
                </div>
                {e.factors.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {e.factors.slice(0, 3).map((f) => (
                      <span key={f} className="text-[9px] px-1.5 py-0.5 rounded-full text-gray-500"
                        style={{ background: "#F3F4F6" }}>{f}</span>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize flex-shrink-0"
                style={{ color: lvlCfg.color, background: lvlCfg.bg }}>
                {e.level}
              </span>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-10 text-center">
            <Star size={20} className="mx-auto mb-2 text-amber-300" />
            <p className="text-sm text-gray-400">No ranking data available</p>
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function BenchmarkingPage() {
  const { data: benchmarkData, isLoading: benchLoading, refetch } = useGetComplianceBenchmarkingQuery();
  const { data: riskData, isLoading: riskLoading } = useGetRiskScoringQuery();
  const { data: kpiData } = useGetKPIIntelligenceQuery();
  const { data: rawSites, isLoading: sitesLoading } = useListSitesQuery();
  const { data: reports, isLoading: reportLoading } = useGetIncidentReportsQuery();
  const { data: analytics } = useGetIncidentAnalyticsQuery();
  const { data: rawHazards } = useListHazardsQuery();
  const { data: rawGaps } = useListTrainingGapsQuery();
  const { data: compDash } = useGetComplianceDashboardQuery();

  const isLoading = benchLoading || riskLoading || sitesLoading || reportLoading;

  const sites       = Array.isArray(rawSites) ? rawSites : [];
  const hazards     = Array.isArray(rawHazards) ? rawHazards : [];
  const gaps        = Array.isArray(rawGaps) ? rawGaps : [];
  const riskScores: RiskScore[] = Array.isArray(riskData?.scores) ? riskData!.scores : [];
  const benchmarks: ComplianceBenchmark[] = Array.isArray(benchmarkData?.benchmarks) ? benchmarkData!.benchmarks : [];
  const trend       = Array.isArray(benchmarkData?.trend) ? benchmarkData!.trend : [];
  const siteDist    = reports?.site_distribution ?? {};
  const deptDist    = reports?.dept_distribution ?? {};
  const overallScore = benchmarkData?.overall_score ?? compDash?.compliance_score ?? 0;

  const uniqueSites   = new Set(Object.keys(siteDist)).size;
  const uniqueDepts   = new Set(Object.keys(deptDist)).size;
  const aboveAvg      = benchmarks.filter((b) => b.status === "above").length;
  const topRiskEntity = riskScores.length > 0
    ? riskScores.reduce((a, b) => a.score > b.score ? a : b).entity_name
    : "—";

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>
      {/* Banner */}
      <div className="relative overflow-hidden px-8 pt-8 pb-6"
        style={{ background: "linear-gradient(135deg, #1C1400 0%, #0F172A 100%)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 70% 50%, rgba(245,158,11,0.15) 0%, transparent 70%)" }} />

        <div className="relative flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={18} style={{ color: "#FCD34D" }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#FCD34D" }}>
                Performance Intelligence
              </span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">Benchmarking</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
              Site, department, industry, and safety performance comparisons
            </p>
          </div>
          <button onClick={() => refetch()} disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}>
            {isLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Refresh
          </button>
        </div>

        <div className="relative flex rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <HeroStat label="Overall Score" value={`${overallScore}%`}
            color={overallScore >= 80 ? "#34D399" : overallScore >= 60 ? "#FBBF24" : "#F87171"} />
          <HeroDivider />
          <HeroStat label="Sites Tracked" value={uniqueSites || sites.length} />
          <HeroDivider />
          <HeroStat label="Departments" value={uniqueDepts || gaps.length} />
          <HeroDivider />
          <HeroStat label="Above Industry Avg" value={aboveAvg} color="#34D399" />
          <HeroDivider />
          <HeroStat label="Ranked Entities" value={riskScores.length || sites.length} color="#FBBF24" />
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin" style={{ color: "#F59E0B" }} />
            <span className="ml-3 text-gray-500 text-sm">Loading benchmarking data…</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Row 1: Site + Department */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <SiteComparisonSection
                sites={sites}
                siteDist={siteDist}
                hazards={hazards}
                riskScores={riskScores}
              />
              <DeptBenchmarkingSection deptDist={deptDist} gaps={gaps} />
            </div>
            {/* Row 2: Industry + Ranking */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <IndustryBenchmarkSection
                benchmarks={benchmarks}
                overallScore={overallScore}
                trend={trend}
              />
              <SafetyPerformanceRankingSection
                riskScores={riskScores}
                sites={sites}
                deptDist={siteDist}
                analytics={analytics}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
