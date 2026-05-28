import { useMemo, useState } from "react";
import {
  ShieldCheck, BookOpen, HardHat, Building2, Workflow,
  RefreshCw, Loader2, AlertTriangle, CheckCircle2, Clock,
  ChevronDown, ChevronUp, Sparkles, AlertCircle, Users,
  Target, ArrowRight, Zap,
} from "lucide-react";
import {
  useGetSafetyRecommendationsQuery,
  useGetCorrectiveRecommendationsQuery,
  useGetWorkOversightQuery,
} from "@/features/ai-intelligence/api/aiIntelligenceApi";
import { useGetCapasQuery } from "@/features/compliance/api/complianceApi";
import { useListTrainingGapsQuery } from "@/features/training/api/trainingApi";
import { useListHazardsQuery, useGetHighRiskAreasQuery } from "@/features/hazards/api/hazardsApi";
import type { AIRecommendation, AiSafetyRec } from "@/features/ai-intelligence/api/aiIntelligenceApi";
import type { CapaRecord } from "@/features/compliance/api/complianceApi";
import type { TrainingGap } from "@/features/training/api/trainingApi";
import type { Hazard, HighRiskArea } from "@/features/hazards/api/hazardsApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

const PRIORITY_CFG: Record<string, { color: string; bg: string; order: number }> = {
  critical: { color: "#DC2626", bg: "#FEE2E2", order: 0 },
  high:     { color: "#EA580C", bg: "#FFEDD5", order: 1 },
  medium:   { color: "#D97706", bg: "#FEF3C7", order: 2 },
  low:      { color: "#16A34A", bg: "#DCFCE7", order: 3 },
};
function priCfg(p: string) { return PRIORITY_CFG[p?.toLowerCase()] ?? { color: "#6B7280", bg: "#F3F4F6", order: 4 }; }

function sortByPriority<T extends { priority: string }>(arr: T[]) {
  return [...arr].sort((a, b) => (priCfg(a.priority).order) - (priCfg(b.priority).order));
}

function matchesCategory(cat: string, keywords: string[]): boolean {
  const c = cat?.toLowerCase() ?? "";
  return keywords.some((k) => c.includes(k));
}

// ── Shared atoms ──────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = priCfg(priority);
  return (
    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold capitalize"
      style={{ color: cfg.color, background: cfg.bg }}>{priority || "unknown"}</span>
  );
}

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
  return (
    <div className={`rounded-2xl border bg-white ${className}`} style={{ borderColor: "#E3E9F6" }}>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, count, accent = "#16A34A" }: {
  icon: React.ElementType; title: string; count?: number; accent?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
      <div className="p-2 rounded-xl" style={{ background: `${accent}1A` }}>
        <Icon size={16} style={{ color: accent }} />
      </div>
      <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
      {count !== undefined && (
        <span className="ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full"
          style={{ background: `${accent}1A`, color: accent }}>{count}</span>
      )}
    </div>
  );
}

function AiRecCard({ rec, expanded, onToggle }: {
  rec: AiSafetyRec | AIRecommendation; expanded: boolean; onToggle: () => void;
}) {
  const title = rec.title;
  const description = rec.description;
  const priority = rec.priority;
  const suggestedAction = "suggested_action" in rec ? rec.suggested_action : undefined;
  const confidence = "confidence" in rec ? rec.confidence : undefined;

  return (
    <div className="border rounded-xl overflow-hidden transition-all" style={{ borderColor: "#E3E9F6" }}>
      <div className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-green-50/30 transition-colors"
        onClick={onToggle}>
        <div className="mt-0.5 p-1.5 rounded-lg flex-shrink-0" style={{ background: priCfg(priority).bg }}>
          <Sparkles size={11} style={{ color: priCfg(priority).color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-800">{title}</span>
            <PriorityBadge priority={priority} />
            {confidence !== undefined && (
              <span className="text-[10px] text-gray-400">{Math.round(confidence * 100)}% conf.</span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{description}</p>
        </div>
        {expanded ? <ChevronUp size={13} className="text-gray-400 flex-shrink-0 mt-1" /> : <ChevronDown size={13} className="text-gray-400 flex-shrink-0 mt-1" />}
      </div>
      {expanded && (
        <div className="px-4 pb-3 bg-green-50/20 border-t" style={{ borderColor: "#E3E9F6" }}>
          <p className="text-xs text-gray-600 leading-relaxed mt-2">{description}</p>
          {suggestedAction && (
            <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg" style={{ background: "#F0FDF4" }}>
              <ArrowRight size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-green-700 font-medium">{suggestedAction}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 1. AI Suggested CAPA ─────────────────────────────────────────────────────

function AISuggestedCAPASection({ aiRecs, capas }: { aiRecs: AIRecommendation[]; capas: CapaRecord[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const capaRecs = useMemo(() =>
    sortByPriority(aiRecs.filter((r) =>
      matchesCategory(r.category, ["capa", "corrective", "action", "safety", "hazard", "risk"])
    )),
    [aiRecs]
  );

  const openCapas = useMemo(() =>
    capas.filter((c) => c.status?.toLowerCase() === "open").sort((a, b) =>
      (priCfg(a.severity).order) - (priCfg(b.severity).order)
    ),
    [capas]
  );

  const allRecs: (AiSafetyRec | AIRecommendation)[] = capaRecs.length > 0 ? capaRecs : aiRecs.slice(0, 6);

  return (
    <Card>
      <SectionHeader icon={ShieldCheck} title="AI Suggested CAPA" count={allRecs.length + openCapas.length} accent="#DC2626" />

      {/* AI recommendations */}
      {allRecs.length > 0 && (
        <div className="px-5 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5">
            <Sparkles size={10} /> AI Recommendations
          </p>
          <div className="space-y-2">
            {allRecs.slice(0, 5).map((rec, i) => (
              <AiRecCard key={i} rec={rec} expanded={expandedId === `ai-${i}`}
                onToggle={() => setExpandedId(expandedId === `ai-${i}` ? null : `ai-${i}`)} />
            ))}
          </div>
        </div>
      )}

      {/* Open CAPAs requiring action */}
      {openCapas.length > 0 && (
        <div className="px-5 pt-4 pb-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Open CAPAs Requiring Action</p>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {openCapas.slice(0, 8).map((c) => (
              <div key={c.id} className="flex items-start gap-3 p-3 rounded-xl border"
                style={{ borderColor: c.overdue ? "#FCA5A5" : "#E3E9F6", background: c.overdue ? "#FFF5F5" : "#F8FAFF" }}>
                <AlertCircle size={13} className="flex-shrink-0 mt-0.5"
                  style={{ color: c.overdue ? "#DC2626" : "#D97706" }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800 truncate">{c.title}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <PriorityBadge priority={c.severity} />
                    {c.overdue && <span className="text-[10px] font-bold text-red-600">Overdue</span>}
                    {c.days_left !== null && !c.overdue && (
                      <span className="text-[10px] text-gray-400">{c.days_left}d left</span>
                    )}
                    {c.root_cause && (
                      <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
                        Cause: {c.root_cause}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {allRecs.length === 0 && openCapas.length === 0 && (
        <div className="py-10 text-center">
          <CheckCircle2 size={20} className="mx-auto mb-2 text-green-500" />
          <p className="text-sm text-gray-400">No CAPA actions required at this time</p>
        </div>
      )}
    </Card>
  );
}

// ── 2. Recommended Training ───────────────────────────────────────────────────

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as Record<string, number>;

function RecommendedTrainingSection({ gaps, aiRecs }: { gaps: TrainingGap[]; aiRecs: AiSafetyRec[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const trainingAiRecs = useMemo(() =>
    aiRecs.filter((r) => matchesCategory(r.category, ["training", "competency", "education", "skill", "certification"])),
    [aiRecs]
  );

  const sortedGaps = useMemo(() =>
    [...gaps].sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)),
    [gaps]
  );

  const courseCounts = useMemo(() => {
    const d: Record<string, number> = {};
    gaps.forEach((g) => g.missing_courses?.forEach((c) => { d[c] = (d[c] ?? 0) + 1; }));
    return Object.entries(d).sort(([, a], [, b]) => b - a).slice(0, 6);
  }, [gaps]);

  return (
    <Card>
      <SectionHeader icon={BookOpen} title="Recommended Training" count={gaps.length} accent="#2563EB" />

      {/* Most-needed courses */}
      {courseCounts.length > 0 && (
        <div className="px-5 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Most Needed Courses</p>
          <div className="space-y-1.5">
            {courseCounts.map(([course, count]) => (
              <div key={course} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: "#EFF6FF" }}>
                <BookOpen size={12} className="text-blue-600 flex-shrink-0" />
                <span className="flex-1 text-xs font-semibold text-blue-800 truncate">{course}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#DBEAFE", color: "#1D4ED8" }}>
                  {count} {count === 1 ? "person" : "people"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI training recommendations */}
      {trainingAiRecs.length > 0 && (
        <div className="px-5 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5">
            <Sparkles size={10} /> AI Training Recommendations
          </p>
          <div className="space-y-2">
            {trainingAiRecs.slice(0, 3).map((rec, i) => (
              <AiRecCard key={i} rec={rec} expanded={expandedId === `train-${i}`}
                onToggle={() => setExpandedId(expandedId === `train-${i}` ? null : `train-${i}`)} />
            ))}
          </div>
        </div>
      )}

      {/* Employees with training gaps */}
      <div className="px-5 pt-4 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Employees with Training Gaps</p>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {sortedGaps.slice(0, 10).map((g) => (
            <div key={g.employee_id} className="p-3 rounded-xl border" style={{ borderColor: "#E3E9F6" }}>
              <div className="flex items-center gap-2">
                <Users size={12} className="text-blue-500 flex-shrink-0" />
                <span className="text-xs font-bold text-gray-800">{g.employee_name}</span>
                <PriorityBadge priority={g.priority} />
                <span className="ml-auto text-[10px] text-gray-400 italic">{g.role}</span>
              </div>
              {g.missing_courses.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {g.missing_courses.slice(0, 4).map((c) => (
                    <span key={c} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "#DBEAFE", color: "#1E40AF" }}>{c}</span>
                  ))}
                  {g.missing_courses.length > 4 && (
                    <span className="text-[10px] text-gray-400">+{g.missing_courses.length - 4} more</span>
                  )}
                </div>
              )}
            </div>
          ))}
          {sortedGaps.length === 0 && (
            <div className="py-6 text-center">
              <CheckCircle2 size={18} className="mx-auto mb-2 text-green-500" />
              <p className="text-xs text-gray-400">All employees are up to date</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ── 3. PPE Recommendations ────────────────────────────────────────────────────

const PPE_KEYWORDS = ["ppe", "personal protective", "helmet", "glove", "respiratory", "harness", "goggle", "boot", "vest", "chemical"];
const PPE_HAZARD_TYPES = ["chemical", "physical", "biological", "ergonomic", "electrical", "fall", "noise", "thermal"];

function PPERecommendationsSection({ hazards, aiRecs }: { hazards: Hazard[]; aiRecs: AiSafetyRec[] }) {
  const ppeAiRecs = useMemo(() =>
    aiRecs.filter((r) => matchesCategory(r.category, PPE_KEYWORDS) ||
      PPE_KEYWORDS.some((k) => r.title?.toLowerCase().includes(k) || r.description?.toLowerCase().includes(k))
    ),
    [aiRecs]
  );

  const ppeHazards = useMemo(() =>
    hazards.filter((h) =>
      PPE_HAZARD_TYPES.some((t) => h.type?.toLowerCase().includes(t)) ||
      PPE_KEYWORDS.some((k) => (h.title + " " + (h.description ?? "")).toLowerCase().includes(k))
    ).sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
    }),
    [hazards]
  );

  // Static PPE recommendation matrix if no AI data
  const staticRecs = [
    { title: "Head Protection", description: "Hard hats required in all active construction zones and where overhead work is in progress.", priority: "high", category: "ppe" },
    { title: "Respiratory Protection", description: "N95 or higher respirators mandated in areas with dust, fumes, or chemical exposure.", priority: "high", category: "ppe" },
    { title: "Eye & Face Protection", description: "Safety goggles required when working with chemicals, grinding, or high-pressure systems.", priority: "medium", category: "ppe" },
    { title: "Hand Protection", description: "Cut-resistant gloves required for sharp material handling; chemical gloves for solvent use.", priority: "medium", category: "ppe" },
    { title: "Fall Protection", description: "Full-body harness mandatory for work at heights exceeding 1.8m.", priority: "critical", category: "ppe" },
    { title: "Foot Protection", description: "Steel-toed boots required on all plant floors and construction sites.", priority: "medium", category: "ppe" },
  ] as AiSafetyRec[];

  const displayRecs = sortByPriority(ppeAiRecs.length > 0 ? ppeAiRecs : staticRecs);

  return (
    <Card>
      <SectionHeader icon={HardHat} title="PPE Recommendations" count={displayRecs.length} accent="#D97706" />

      {/* Hazards requiring PPE */}
      {ppeHazards.length > 0 && (
        <div className="px-5 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Active Hazards Requiring PPE</p>
          <div className="space-y-2 max-h-36 overflow-y-auto">
            {ppeHazards.slice(0, 6).map((h) => {
              const cfg = { critical: { color: "#DC2626", bg: "#FEE2E2" }, high: { color: "#EA580C", bg: "#FFEDD5" }, medium: { color: "#D97706", bg: "#FEF3C7" }, low: { color: "#16A34A", bg: "#DCFCE7" } }[h.severity] ?? { color: "#6B7280", bg: "#F3F4F6" };
              return (
                <div key={h.id} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: cfg.bg + "60" }}>
                  <AlertTriangle size={12} style={{ color: cfg.color }} className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-gray-800 truncate block">{h.title}</span>
                    <span className="text-[10px] text-gray-500 capitalize">{h.type} hazard</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                    style={{ color: cfg.color, background: cfg.bg }}>{h.severity}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PPE recommendation cards */}
      <div className="px-5 pt-4 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5">
          {ppeAiRecs.length > 0 && <><Sparkles size={10} /> AI</>} PPE Requirements
        </p>
        <div className="grid grid-cols-1 gap-2">
          {displayRecs.slice(0, 6).map((rec, i) => {
            const cfg = priCfg(rec.priority);
            return (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border"
                style={{ borderColor: `${cfg.color}30`, background: `${cfg.bg}50` }}>
                <HardHat size={14} style={{ color: cfg.color }} className="flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-800">{rec.title}</span>
                    <PriorityBadge priority={rec.priority} />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{rec.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

// ── 4. Site Improvement Suggestions ──────────────────────────────────────────

function SiteImprovementSection({ hazards, highRiskAreas, aiRecs }: {
  hazards: Hazard[]; highRiskAreas: HighRiskArea[]; aiRecs: AiSafetyRec[];
}) {
  const siteAiRecs = useMemo(() =>
    aiRecs.filter((r) => matchesCategory(r.category, ["site", "facility", "infrastructure", "environment", "equipment", "maintenance", "inspection"])),
    [aiRecs]
  );

  const openHazards = useMemo(() =>
    hazards.filter((h) => h.status === "open").sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
    }),
    [hazards]
  );

  const sortedRiskAreas = useMemo(() =>
    [...highRiskAreas].sort((a, b) => b.risk_score - a.risk_score),
    [highRiskAreas]
  );

  return (
    <Card>
      <SectionHeader icon={Building2} title="Site Improvement Suggestions" accent="#7C3AED" />

      {/* High risk areas */}
      {sortedRiskAreas.length > 0 && (
        <div className="px-5 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">High Risk Areas</p>
          <div className="space-y-2">
            {sortedRiskAreas.slice(0, 4).map((area) => {
              const riskColor = area.risk_score >= 15 ? "#DC2626" : area.risk_score >= 10 ? "#EA580C" : area.risk_score >= 5 ? "#D97706" : "#16A34A";
              const riskBg = area.risk_score >= 15 ? "#FEE2E2" : area.risk_score >= 10 ? "#FFEDD5" : area.risk_score >= 5 ? "#FEF3C7" : "#DCFCE7";
              return (
                <div key={area.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "#E3E9F6" }}>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-gray-800 block truncate">{area.title}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400">Likelihood: {area.likelihood} · Consequence: {area.consequence}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black" style={{ color: riskColor }}>{area.risk_score}</div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: riskColor, background: riskBg }}>
                      risk score
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI site improvement recs */}
      {siteAiRecs.length > 0 && (
        <div className="px-5 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5">
            <Sparkles size={10} /> AI Site Improvements
          </p>
          <div className="space-y-2">
            {siteAiRecs.slice(0, 3).map((rec, i) => {
              const cfg = priCfg(rec.priority);
              return (
                <div key={i} className="p-3 rounded-xl border" style={{ borderColor: `${cfg.color}30`, background: `${cfg.bg}40` }}>
                  <div className="flex items-center gap-2">
                    <Target size={12} style={{ color: cfg.color }} />
                    <span className="text-xs font-bold text-gray-800">{rec.title}</span>
                    <PriorityBadge priority={rec.priority} />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{rec.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Open hazards by site */}
      <div className="px-5 pt-4 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Open Hazards Requiring Mitigation</p>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {openHazards.slice(0, 8).map((h) => {
            const order = { critical: 0, high: 1, medium: 2, low: 3 };
            const orderVal = order[h.severity] ?? 4;
            const color = orderVal === 0 ? "#DC2626" : orderVal === 1 ? "#EA580C" : orderVal === 2 ? "#D97706" : "#16A34A";
            const bg = orderVal === 0 ? "#FEE2E2" : orderVal === 1 ? "#FFEDD5" : orderVal === 2 ? "#FEF3C7" : "#DCFCE7";
            return (
              <div key={h.id} className="p-3 rounded-xl" style={{ background: "#F8FAFF" }}>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={12} style={{ color }} className="flex-shrink-0" />
                  <span className="text-xs font-semibold text-gray-800 flex-1 truncate">{h.title}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                    style={{ color, background: bg }}>{h.severity}</span>
                </div>
                {h.description && (
                  <p className="text-[11px] text-gray-500 mt-1 ml-5 leading-relaxed line-clamp-2">{h.description}</p>
                )}
                {h.mitigation && (
                  <div className="mt-1.5 ml-5 flex items-center gap-1.5">
                    <ArrowRight size={10} className="text-purple-500 flex-shrink-0" />
                    <span className="text-[10px] text-purple-600 font-medium">{h.mitigation}</span>
                  </div>
                )}
              </div>
            );
          })}
          {openHazards.length === 0 && (
            <div className="py-6 text-center">
              <CheckCircle2 size={18} className="mx-auto mb-2 text-green-500" />
              <p className="text-xs text-gray-400">No open hazards — all sites are clear</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ── 5. Workflow Optimization ──────────────────────────────────────────────────

function WorkflowOptimizationSection({ capas, aiRecs, alerts }: {
  capas: CapaRecord[]; aiRecs: AiSafetyRec[]; alerts: number;
}) {
  const workflowAiRecs = useMemo(() =>
    aiRecs.filter((r) => matchesCategory(r.category, ["workflow", "process", "procedure", "efficiency", "optimiz", "system", "communication", "reporting"])),
    [aiRecs]
  );

  const processCAPAs = useMemo(() =>
    capas.filter((c) =>
      ["process", "procedure", "workflow", "system", "communication"].some((k) =>
        (c.source_type ?? "").toLowerCase().includes(k) ||
        (c.root_cause ?? "").toLowerCase().includes(k) ||
        (c.title ?? "").toLowerCase().includes(k)
      )
    ),
    [capas]
  );

  const staticWorkflowRecs = [
    { title: "Automate Safety Reporting", description: "Implement automated daily safety report generation to reduce manual effort and improve accuracy.", priority: "high", category: "workflow" },
    { title: "Digital Permit-to-Work System", description: "Transition paper-based PTW to digital workflows to eliminate approval delays and improve traceability.", priority: "high", category: "workflow" },
    { title: "Standardise Incident Classification", description: "Adopt a single severity matrix across all sites to ensure consistent incident classification and reporting.", priority: "medium", category: "workflow" },
    { title: "Real-time Alert Escalation", description: "Configure multi-level alert escalation rules so critical incidents immediately reach the right stakeholders.", priority: "critical", category: "workflow" },
    { title: "CAPA Workflow Integration", description: "Link CAPA actions directly to incidents and findings to automatically track closure and prevent recurrence.", priority: "medium", category: "workflow" },
    { title: "Inspection Scheduling Optimisation", description: "Use risk-based scheduling to prioritise high-risk areas for more frequent inspection cycles.", priority: "low", category: "workflow" },
  ] as AiSafetyRec[];

  const displayRecs = sortByPriority(workflowAiRecs.length >= 3 ? workflowAiRecs : [...workflowAiRecs, ...staticWorkflowRecs].slice(0, 6));

  return (
    <Card>
      <SectionHeader icon={Workflow} title="Workflow Optimization" count={displayRecs.length} accent="#0891B2" />

      <div className="p-5">
        {/* Quick metrics */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Process CAPAs", value: processCAPAs.length, color: "#DC2626", icon: AlertCircle },
            { label: "Active Alerts", value: alerts, color: "#D97706", icon: Zap },
            { label: "AI Suggestions", value: displayRecs.length, color: "#0891B2", icon: Sparkles },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="p-3 rounded-xl text-center" style={{ background: "#F8FAFF" }}>
              <Icon size={14} className="mx-auto mb-1" style={{ color }} />
              <div className="text-lg font-black" style={{ color }}>{value}</div>
              <div className="text-[10px] text-gray-500 font-medium mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Workflow recommendations */}
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-3 flex items-center gap-1.5">
          {workflowAiRecs.length > 0 && <><Sparkles size={10} /> AI</>} Workflow Recommendations
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {displayRecs.map((rec, i) => {
            const cfg = priCfg(rec.priority);
            return (
              <div key={i} className="p-4 rounded-xl border flex flex-col gap-2"
                style={{ borderColor: `${cfg.color}25`, background: `${cfg.bg}35` }}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-gray-800 leading-snug">{rec.title}</span>
                  <PriorityBadge priority={rec.priority} />
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed flex-1">{rec.description}</p>
                <div className="flex items-center gap-1.5 pt-1 border-t" style={{ borderColor: `${cfg.color}20` }}>
                  <Workflow size={10} style={{ color: cfg.color }} />
                  <span className="text-[10px] font-semibold capitalize" style={{ color: cfg.color }}>
                    {rec.category?.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Process CAPAs */}
        {processCAPAs.length > 0 && (
          <div className="mt-5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Process-Related CAPAs</p>
            <div className="space-y-2">
              {processCAPAs.slice(0, 4).map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "#E3E9F6" }}>
                  <Clock size={12} className="text-cyan-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-gray-800 truncate block">{c.title}</span>
                    <span className="text-[10px] text-gray-400 capitalize">{c.source_type?.replace(/_/g, " ")}</span>
                  </div>
                  <PriorityBadge priority={c.severity} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export function SafetyRecommendationsPage() {
  const { data: safetyRecs, isLoading: safetyLoading, refetch } = useGetSafetyRecommendationsQuery();
  const { data: corrRecs, isLoading: corrLoading } = useGetCorrectiveRecommendationsQuery();
  const { data: rawCapas, isLoading: capaLoading } = useGetCapasQuery();
  const { data: rawGaps, isLoading: gapsLoading } = useListTrainingGapsQuery();
  const { data: rawHazards, isLoading: hazLoading } = useListHazardsQuery();
  const { data: riskAreaData, isLoading: riskLoading } = useGetHighRiskAreasQuery();
  const { data: oversight } = useGetWorkOversightQuery();

  const isLoading = safetyLoading || corrLoading || capaLoading || gapsLoading || hazLoading || riskLoading;

  // Safe array extraction
  const aiRecs: AIRecommendation[] = Array.isArray(corrRecs?.recommendations) ? corrRecs!.recommendations : [];

  const rawAiSafetyRecs = (safetyRecs as any)?.ai_recommendations;
  const aiSafetyRecs: AiSafetyRec[] = Array.isArray(rawAiSafetyRecs) ? rawAiSafetyRecs
    : Array.isArray(rawAiSafetyRecs?.items) ? rawAiSafetyRecs.items : [];

  const rawPlatformRecs = (safetyRecs as any)?.platform_recommendations;
  const platformRecs: AiSafetyRec[] = Array.isArray(rawPlatformRecs) ? rawPlatformRecs
    : Array.isArray(rawPlatformRecs?.items) ? rawPlatformRecs.items : [];

  const allSafetyRecs: AiSafetyRec[] = [...aiSafetyRecs, ...platformRecs];

  const capas: CapaRecord[] = Array.isArray(rawCapas) ? rawCapas : [];
  const gaps: TrainingGap[] = Array.isArray(rawGaps) ? rawGaps : [];
  const hazards: Hazard[] = Array.isArray(rawHazards) ? rawHazards : [];
  const highRiskAreas: HighRiskArea[] = Array.isArray(riskAreaData?.items) ? riskAreaData!.items
    : Array.isArray(riskAreaData) ? riskAreaData as unknown as HighRiskArea[] : [];

  const totalRecs = aiSafetyRecs.length + platformRecs.length + aiRecs.length;
  const criticalRecs = [...allSafetyRecs, ...aiRecs].filter((r) => r.priority?.toLowerCase() === "critical").length;
  const openHazards = hazards.filter((h) => h.status === "open").length;
  const activeAlerts = oversight?.active_alerts ?? 0;

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>
      {/* Banner */}
      <div className="relative overflow-hidden px-8 pt-8 pb-6"
        style={{ background: "linear-gradient(135deg, #064E3B 0%, #0F172A 100%)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 70% 50%, rgba(16,185,129,0.15) 0%, transparent 70%)" }} />

        <div className="relative flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={18} style={{ color: "#6EE7B7" }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#6EE7B7" }}>
                AI Safety Intelligence
              </span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">Safety Recommendations</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
              AI-powered CAPA, training, PPE, site improvement, and workflow suggestions
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
          <HeroStat label="Total Recommendations" value={totalRecs} />
          <HeroDivider />
          <HeroStat label="Critical Actions" value={criticalRecs} color="#EF4444" />
          <HeroDivider />
          <HeroStat label="Training Gaps" value={gaps.length} color="#F59E0B" />
          <HeroDivider />
          <HeroStat label="Open Hazards" value={openHazards} color="#F97316" />
          <HeroDivider />
          <HeroStat label="Active Alerts" value={activeAlerts} color="#A78BFA" />
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin" style={{ color: "#16A34A" }} />
            <span className="ml-3 text-gray-500 text-sm">Loading safety recommendations…</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Row 1: CAPA + Training */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <AISuggestedCAPASection aiRecs={aiRecs} capas={capas} />
              <RecommendedTrainingSection gaps={gaps} aiRecs={allSafetyRecs} />
            </div>
            {/* Row 2: PPE + Site Improvement */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <PPERecommendationsSection hazards={hazards} aiRecs={allSafetyRecs} />
              <SiteImprovementSection hazards={hazards} highRiskAreas={highRiskAreas} aiRecs={allSafetyRecs} />
            </div>
            {/* Row 3: Workflow Optimization (full width) */}
            <WorkflowOptimizationSection capas={capas} aiRecs={allSafetyRecs} alerts={activeAlerts} />
          </div>
        )}
      </div>
    </div>
  );
}
