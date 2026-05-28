import { useMemo } from "react";
import {
  Brain, AlertTriangle, ShieldCheck, TrendingUp, TrendingDown,
  Bell, BarChart3, CheckCircle2, Minus, Zap, Activity,
  Sparkles, RefreshCw, Eye, CheckSquare, Wifi, WifiOff,
} from "lucide-react";
import {
  useGetRiskScoringQuery,
  useGetRiskPredictionsQuery,
  useGetSafetyRecommendationsQuery,
  useGetComplianceIntelligenceQuery,
  useGetComplianceBenchmarkingQuery,
  useGetWorkOversightQuery,
  useGetTrendAnalysisQuery,
  useGetKPIIntelligenceQuery,
  useGetAiStatusQuery,
} from "@/features/ai-intelligence/api/aiIntelligenceApi";
import type {
  RiskScore, OversightAlert,
  KPIIndicator, ComplianceBenchmark,
} from "@/features/ai-intelligence/api/aiIntelligenceApi";

// ── Mock fallbacks ─────────────────────────────────────────────────────────

const MOCK_RISK = {
  overall_risk_level: "medium" as const,
  avg_score: 42,
  trend: [],
  scores: [
    { id: "1", entity_type: "site" as const,      entity_name: "Main Factory",         score: 68, level: "high" as const,     factors: ["High footfall", "Machinery exposure"],          changed_at: new Date().toISOString() },
    { id: "2", entity_type: "permit" as const,    entity_name: "Hot Work PTW #12",     score: 55, level: "medium" as const,   factors: ["Flammable materials nearby"],                   changed_at: new Date().toISOString() },
    { id: "3", entity_type: "workforce" as const, entity_name: "Night Shift Team",     score: 34, level: "low" as const,      factors: ["Fatigue risk"],                                 changed_at: new Date().toISOString() },
    { id: "4", entity_type: "task" as const,      entity_name: "Conveyor Maintenance", score: 81, level: "critical" as const, factors: ["Lockout/Tagout required", "Confined space"],    changed_at: new Date().toISOString() },
  ],
};

const MOCK_OVERSIGHT = {
  active_alerts: 7, violations_today: 3, drift_events: 2, unsafe_acts: 2,
  alerts: [
    { id: "a1", type: "violation" as const,  description: "No-helmet zone breach — Zone 4 camera 3",          site: "Main Factory", zone: "Zone 4", severity: "high" as const,     detected_at: new Date().toISOString(), resolved: false },
    { id: "a2", type: "drift" as const,      description: "Process deviation: conveyor speed 18% above SOP", site: "Warehouse A",  severity: "medium" as const,                    detected_at: new Date().toISOString(), resolved: false },
    { id: "a3", type: "unsafe_act" as const, description: "Worker bypassed lockout procedure on Line 2",      site: "Main Factory", zone: "Line 2", severity: "critical" as const, detected_at: new Date().toISOString(), resolved: false },
  ],
};

const MOCK_KPI = {
  health_score: 76,
  leading_indicators: [
    { id: "l1", name: "Safety Observations Filed", type: "leading" as const, current_value: 143, target: 120, unit: "count", trend: "improving" as const, change_pct: 12 },
    { id: "l2", name: "Toolbox Talk Completion",   type: "leading" as const, current_value: 88,  target: 95,  unit: "%",     trend: "stable" as const,    change_pct: 1 },
  ],
  lagging_indicators: [
    { id: "g1", name: "Lost Time Injury Rate", type: "lagging" as const, current_value: 0.8, target: 0.5, unit: "per 200k hrs", trend: "improving" as const, change_pct: -12 },
    { id: "g2", name: "Days Since Lost Time",  type: "lagging" as const, current_value: 127, target: 200, unit: "days",         trend: "improving" as const, change_pct: 15 },
  ],
};

const MOCK_COMPLIANCE = {
  overall_score: 83,
  last_updated: new Date().toISOString(),
  trend: [],
  benchmarks: [
    { standard: "ISO 45001", your_score: 87, industry_avg: 72, best_in_class: 95, gap: 8,  status: "above" as const },
    { standard: "OSHA 300",  your_score: 78, industry_avg: 80, best_in_class: 96, gap: 18, status: "below" as const },
    { standard: "RIDDOR",    your_score: 91, industry_avg: 68, best_in_class: 94, gap: 3,  status: "above" as const },
    { standard: "ISO 14001", your_score: 75, industry_avg: 75, best_in_class: 92, gap: 17, status: "on_par" as const },
  ],
};

// ── Colour maps ────────────────────────────────────────────────────────────

const RISK_COLOR: Record<string, string> = { low: "#10B981", medium: "#F59E0B", high: "#F97316", critical: "#EF4444" };
const ALERT_COLOR: Record<string, string> = { violation: "#EF4444", drift: "#F59E0B", unsafe_act: "#7C3AED" };
const PRIORITY_COLOR: Record<string, string> = { low: "#10B981", medium: "#F59E0B", high: "#F97316", critical: "#EF4444" };
const BENCH_COLOR = (s: string) =>
  s === "above" ? { color: "#10B981", label: "Above avg" } :
  s === "below" ? { color: "#EF4444", label: "Below avg" } :
  { color: "#F59E0B", label: "On par" };

// ── Shared primitives ──────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border p-5 ${className}`} style={{ borderColor: "#E3E9F6" }}>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, sub, accent }: { icon: typeof Brain; title: string; sub: string; accent: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: accent + "18" }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <div>
        <h2 className="text-base font-bold" style={{ color: "#111827" }}>{title}</h2>
        <p className="text-xs" style={{ color: "#6B7280" }}>{sub}</p>
      </div>
    </div>
  );
}

function HeroStat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex-1 px-6 py-4 text-center">
      <div className="text-[26px] font-black text-white leading-none" style={color ? { color } : undefined}>{value}</div>
      <div className="text-[11px] font-semibold mt-1 uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</div>
    </div>
  );
}

function ScoreRing({ value, size = 68, color = "#4A57B9" }: { value: number; size?: number; color?: string }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={8} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" style={{ fontSize: size / 4.5, fontWeight: 700, fill: "#111827" }} transform={`rotate(90, ${size / 2}, ${size / 2})`}>
        {value}
      </text>
    </svg>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ background: color + "1A", color }}>
      {label}
    </span>
  );
}

function TrendIcon({ trend }: { trend: "improving" | "stable" | "declining" }) {
  if (trend === "improving") return <TrendingUp className="w-3.5 h-3.5" style={{ color: "#10B981" }} />;
  if (trend === "declining") return <TrendingDown className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />;
  return <Minus className="w-3.5 h-3.5" style={{ color: "#9CA3AF" }} />;
}

// ── Section 1: AI Risk Score ───────────────────────────────────────────────

function AiRiskScoreSection() {
  const { data: riskData, isLoading, refetch } = useGetRiskScoringQuery();
  const d = riskData ?? MOCK_RISK;
  const overallColor = RISK_COLOR[d.overall_risk_level] ?? "#F59E0B";

  const entityIcon: Record<string, string> = { site: "🏭", permit: "📄", workforce: "👷", task: "🔧" };

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 pb-4 mb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <SectionHeader icon={Brain} title="AI Risk Score" sub="Entity risk scores calculated by the AI engine" accent="#4A57B9" />
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => refetch()} disabled={isLoading}
            className="flex items-center gap-1 rounded-xl border px-3 py-1.5 text-[12px] font-semibold disabled:opacity-50"
            style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall risk pill */}
      <div className="flex items-center gap-4 mb-5 p-4 rounded-2xl" style={{ background: overallColor + "10", border: `1px solid ${overallColor}30` }}>
        <ScoreRing value={d.avg_score} color={overallColor} />
        <div>
          <div className="text-xs font-semibold uppercase mb-1" style={{ color: "#9CA3AF" }}>Overall Risk Level</div>
          <div className="text-[20px] font-black capitalize mb-1" style={{ color: overallColor }}>{d.overall_risk_level}</div>
          <div className="text-xs" style={{ color: "#6B7280" }}>Average composite risk score across all entities</div>
        </div>
      </div>

      {/* Entity risk list */}
      <div className="space-y-2">
        {(Array.isArray(d.scores) ? d.scores : MOCK_RISK.scores).map((s: RiskScore) => {
          const c = RISK_COLOR[s.level];
          return (
            <div key={s.id} className="rounded-xl border p-3 flex items-center gap-3" style={{ borderColor: `${c}33`, background: `${c}0A` }}>
              <span className="text-[18px]">{entityIcon[s.entity_type] ?? "📌"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold truncate" style={{ color: "#111827" }}>{s.entity_name}</span>
                  <Badge label={s.level} color={c} />
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, s.score)}%`, background: c }} />
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {s.factors.slice(0, 2).map((f) => (
                    <span key={f} className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "#F3F4F6", color: "#6B7280" }}>{f}</span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[22px] font-black leading-none" style={{ color: c }}>{s.score}</div>
                <div className="text-[10px]" style={{ color: "#9CA3AF" }}>/ 100</div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── Section 2: AI Incident Predictions ────────────────────────────────────

function AiIncidentPredictionsSection() {
  const { data: predData, isLoading, refetch } = useGetRiskPredictionsQuery();

  const predictions = useMemo(() => {
    if (Array.isArray(predData?.predictions) && predData!.predictions.length) return predData!.predictions;
    return [
      { entity: "Zone: Compressor Bay", likelihood: 0.78, impact: 0.85, score: 82, recommendation: "Mandatory PPE audit + noise monitoring" },
      { entity: "Worker: Night Shift Team", likelihood: 0.61, impact: 0.72, score: 66, recommendation: "Rotate duties, reduce consecutive shifts" },
      { entity: "Task: Tank Cleaning", likelihood: 0.44, impact: 0.90, score: 58, recommendation: "Buddy system + gas detection required" },
      { entity: "Permit: Hot Work #12", likelihood: 0.55, impact: 0.65, score: 54, recommendation: "Increase inspection frequency" },
    ];
  }, [predData]);

  const LEVEL = (score: number) => score >= 70 ? "Critical" : score >= 50 ? "High" : score >= 30 ? "Medium" : "Low";
  const LC: Record<string, string> = { Critical: "#EF4444", High: "#F97316", Medium: "#F59E0B", Low: "#10B981" };

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 pb-4 mb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <SectionHeader icon={AlertTriangle} title="AI Incident Predictions" sub="Predicted incidents ranked by AI risk score" accent="#EF4444" />
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => refetch()} disabled={isLoading}
            className="flex items-center gap-1 rounded-xl border px-3 py-1.5 text-[12px] font-semibold disabled:opacity-50"
            style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase" style={{ background: "#FEE2E2", color: "#EF4444" }}>Predictive AI</span>
        </div>
      </div>

      <div className="space-y-3">
        {predictions.map((p, i) => {
          const score = typeof p.score === "number" ? p.score : Math.round(((p as any).likelihood + (p as any).impact) / 2 * 100);
          const lvl = LEVEL(score);
          const c = LC[lvl];
          return (
            <div key={i} className="rounded-xl border p-4" style={{ borderColor: `${c}33`, background: `${c}0A` }}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-bold truncate" style={{ color: "#111827" }}>{p.entity}</span>
                  <Badge label={lvl} color={c} />
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[20px] font-black leading-none" style={{ color: c }}>{score}</div>
                  <div className="text-[10px]" style={{ color: "#9CA3AF" }}>risk score</div>
                </div>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden mb-2" style={{ background: "#E5E7EB" }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, score)}%`, background: c }} />
              </div>
              <div className="flex items-start gap-1.5">
                <Zap className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#D97706" }} />
                <p className="text-[12px]" style={{ color: "#6B7280" }}>{p.recommendation}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── Section 3: Safety Intelligence ────────────────────────────────────────

function SafetyIntelligenceSection() {
  const { data: aiRecs, isLoading } = useGetSafetyRecommendationsQuery();

  const recs = useMemo(() => {
    const a = Array.isArray(aiRecs?.ai_recommendations) ? aiRecs!.ai_recommendations : [];
    const rawPlatform = (aiRecs as any)?.platform_recommendations;
    const b = Array.isArray(rawPlatform) ? rawPlatform
            : Array.isArray(rawPlatform?.items) ? rawPlatform.items
            : [];
    const list = [...a, ...b];
    if (list.length) return list;
    return [
      { title: "Increase inspection frequency in Compressor Bay", description: "AI detected 3 anomalies in 7 days.", category: "Compliance", priority: "critical" },
      { title: "Upgrade PPE for Night Shift Teams", description: "Fatigue indicators correlate with increased PPE non-compliance.", category: "Safety", priority: "high" },
      { title: "Digitise permit-to-work workflow", description: "Paper permits show 23% higher error rate than digital.", category: "Process", priority: "high" },
      { title: "Schedule quarterly toolbox talks for Zone 3", description: "Last recorded toolbox talk is over 90 days ago.", category: "Training", priority: "medium" },
    ];
  }, [aiRecs]);

  return (
    <Card>
      <div className="pb-4 mb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <SectionHeader icon={ShieldCheck} title="Safety Intelligence" sub="AI-generated safety recommendations from platform data" accent="#10B981" />
      </div>

      {isLoading ? (
        <p className="text-sm text-center py-6" style={{ color: "#9CA3AF" }}>Loading…</p>
      ) : (
        <div className="space-y-3">
          {recs.map((r, i) => {
            const c = PRIORITY_COLOR[r.priority] ?? "#F59E0B";
            return (
              <div key={i} className="rounded-xl border p-4 space-y-1.5" style={{ borderColor: "#E3E9F6" }}>
                <div className="flex items-center gap-2">
                  <Badge label={r.priority} color={c} />
                  <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{r.category}</span>
                </div>
                <p className="text-[13px] font-semibold" style={{ color: "#111827" }}>{r.title}</p>
                <p className="text-[12px]" style={{ color: "#6B7280" }}>{r.description}</p>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ── Section 4: Compliance Intelligence ────────────────────────────────────

function ComplianceIntelligenceSection() {
  const { data: aiComp, isLoading: aiLoading } = useGetComplianceIntelligenceQuery();
  const { data: benchData, isLoading: benchLoading } = useGetComplianceBenchmarkingQuery();
  const benchD = benchData ?? MOCK_COMPLIANCE;

  return (
    <Card>
      <div className="pb-4 mb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <SectionHeader icon={CheckCircle2} title="Compliance Intelligence" sub="Standards benchmarking and AI gap analysis" accent="#4A57B9" />
      </div>

      {/* Score ring + benchmarks */}
      {benchLoading ? (
        <p className="text-sm text-center py-6" style={{ color: "#9CA3AF" }}>Loading…</p>
      ) : (
        <>
          <div className="flex items-center gap-5 mb-5">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <ScoreRing value={benchD.overall_score} color="#4A57B9" />
              <span className="text-[11px] font-semibold" style={{ color: "#4A57B9" }}>Overall</span>
            </div>
            <div className="flex-1 space-y-2">
              {(Array.isArray(benchD.benchmarks) ? benchD.benchmarks : MOCK_COMPLIANCE.benchmarks).map((b: ComplianceBenchmark) => {
                const cfg = BENCH_COLOR(b.status);
                return (
                  <div key={b.standard} className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold w-20 flex-shrink-0" style={{ color: "#374151" }}>{b.standard}</span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                      <div className="h-full rounded-full" style={{ width: `${b.your_score}%`, background: cfg.color }} />
                    </div>
                    <span className="text-[11px] font-bold w-8 text-right" style={{ color: "#111827" }}>{b.your_score}%</span>
                    <Badge label={cfg.label} color={cfg.color} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI gap analysis */}
          {!aiLoading && aiComp?.configured && Array.isArray(aiComp?.gaps) && aiComp.gaps.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "#EF4444" }}>Identified Gaps</p>
              <div className="space-y-2">
                {aiComp.gaps.slice(0, 3).map((gap, i) => {
                  const c = PRIORITY_COLOR[gap.priority] ?? "#F59E0B";
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "#E3E9F6" }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[12px] font-semibold truncate" style={{ color: "#111827" }}>{gap.area}</span>
                          <Badge label={gap.priority} color={c} />
                        </div>
                        <div className="flex gap-3 text-[11px]" style={{ color: "#6B7280" }}>
                          <span>Current: <strong style={{ color: "#111827" }}>{gap.current}%</strong></span>
                          <span>Required: <strong style={{ color: "#111827" }}>{gap.required}%</strong></span>
                          <span>Gap: <strong style={{ color: c }}>{gap.gap}%</strong></span>
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
    </Card>
  );
}

// ── Section 5: AI Alerts ───────────────────────────────────────────────────

function AiAlertsSection() {
  const { data: oversightData, isLoading } = useGetWorkOversightQuery();
  const d = oversightData ?? MOCK_OVERSIGHT;
  const typeLabel: Record<string, string> = { violation: "Violation", drift: "Process Drift", unsafe_act: "Unsafe Act" };

  const statTiles = [
    { label: "Active Alerts",    value: d.active_alerts,    color: "#EF4444" },
    { label: "Violations Today", value: d.violations_today, color: "#F97316" },
    { label: "Drift Events",     value: d.drift_events,     color: "#F59E0B" },
    { label: "Unsafe Acts",      value: d.unsafe_acts,      color: "#7C3AED" },
  ];

  return (
    <Card>
      <div className="pb-4 mb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <SectionHeader icon={Bell} title="AI Alerts" sub="Live violations, process drift and unsafe acts" accent="#EF4444" />
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {statTiles.map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ background: color + "0F" }}>
            <div className="text-[22px] font-black leading-none" style={{ color }}>{isLoading ? "…" : value}</div>
            <div className="text-[10px] font-semibold mt-0.5 uppercase" style={{ color: "#6B7280" }}>{label}</div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-center py-6" style={{ color: "#9CA3AF" }}>Loading…</p>
      ) : (
        <div className="space-y-2">
          {(Array.isArray(d.alerts) ? d.alerts : MOCK_OVERSIGHT.alerts).map((a: OversightAlert) => {
            const c = ALERT_COLOR[a.type] ?? "#9CA3AF";
            const sc = RISK_COLOR[a.severity];
            return (
              <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl border" style={{ borderColor: "#E3E9F6" }}>
                <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: c, display: "inline-block" }} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="text-[12px] font-semibold" style={{ color: c }}>{typeLabel[a.type]}</span>
                    <Badge label={a.severity} color={sc} />
                    <span className="text-[11px] ml-auto" style={{ color: "#9CA3AF" }}>{a.site}{a.zone ? ` · ${a.zone}` : ""}</span>
                  </div>
                  <p className="text-[12px]" style={{ color: "#374151" }}>{a.description}</p>
                </div>
                {!a.resolved && (
                  <button className="text-[11px] px-2 py-1 rounded-lg font-semibold flex-shrink-0" style={{ background: "#EEF2FB", color: "#4A57B9" }}>Resolve</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ── Section 6: Predictive Analytics ───────────────────────────────────────

function PredictiveAnalyticsSection() {
  const { data: trendData, isLoading: trendLoading } = useGetTrendAnalysisQuery();
  const { data: kpiData, isLoading: kpiLoading } = useGetKPIIntelligenceQuery();
  const kpiD = kpiData ?? MOCK_KPI;
  const monthly = Array.isArray(trendData?.monthly_data) ? trendData!.monthly_data : [];
  const maxVal = monthly.length ? Math.max(...monthly.map((m) => Math.max(m.incidents, m.near_misses, m.resolved)), 1) : 1;

  const analysisText = (() => {
    const a = (trendData as any)?.analysis;
    if (!a) return '';
    if (typeof a === 'string') return a;
    if (typeof a === 'object') return (a.trend_summary || a.summary || a.analysis || '') as string;
    return '';
  })();

  const allKPIs = [
    ...(Array.isArray(kpiD.leading_indicators) ? kpiD.leading_indicators : MOCK_KPI.leading_indicators),
    ...(Array.isArray(kpiD.lagging_indicators) ? kpiD.lagging_indicators : MOCK_KPI.lagging_indicators),
  ];

  return (
    <Card>
      <div className="pb-4 mb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <SectionHeader icon={BarChart3} title="Predictive Analytics" sub="Monthly trend forecasts and KPI performance" accent="#8B5CF6" />
      </div>

      {/* Trend chart */}
      {!trendLoading && monthly.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: "#6B7280" }}>Monthly Incident Trend</p>
          <div className="flex items-end gap-2 h-28">
            {monthly.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end gap-0.5" style={{ height: "90px" }}>
                  {[{ val: m.incidents, color: "#EF4444" }, { val: m.near_misses, color: "#F59E0B" }, { val: m.resolved, color: "#10B981" }].map(({ val, color }, j) => (
                    <div key={j} className="flex-1 rounded-t" style={{ height: `${(val / maxVal) * 100}%`, background: color, minHeight: "2px" }} />
                  ))}
                </div>
                <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{m.month}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-2">
            {[{ color: "#EF4444", label: "Incidents" }, { color: "#F59E0B", label: "Near Misses" }, { color: "#10B981", label: "Resolved" }].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-[11px]" style={{ color: "#6B7280" }}>
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />{label}
              </div>
            ))}
          </div>
        </div>
      )}

      {analysisText && (
        <div className="rounded-xl p-3 mb-4" style={{ background: "#F8FAFF", border: "1px solid #E3E9F6" }}>
          <p className="text-[11px] font-semibold uppercase mb-1" style={{ color: "#4A57B9" }}>AI Analysis</p>
          <p className="text-[12px] leading-relaxed" style={{ color: "#374151" }}>{analysisText}</p>
        </div>
      )}

      {/* KPIs */}
      <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "#6B7280" }}>KPI Performance</p>
      {kpiLoading ? (
        <p className="text-sm text-center py-4" style={{ color: "#9CA3AF" }}>Loading…</p>
      ) : (
        <div className="space-y-2">
          {allKPIs.map((k: KPIIndicator) => {
            const hit = k.current_value >= k.target;
            const pct = Math.min((k.current_value / (k.target * 1.2)) * 100, 100);
            return (
              <div key={k.id} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: "#F3F4F6" }}>
                <TrendIcon trend={k.trend} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-semibold truncate" style={{ color: "#374151" }}>{k.name}</span>
                    <span style={{ color: "#9CA3AF" }}>Target: {k.target} {k.unit}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: hit ? "#10B981" : "#F59E0B" }} />
                  </div>
                </div>
                <span className="text-[12px] font-bold w-24 text-right flex-shrink-0" style={{ color: hit ? "#10B981" : "#F59E0B" }}>
                  {k.current_value} {k.unit}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export function AIDashboardPage() {
  const { data: riskData } = useGetRiskScoringQuery();
  const { data: oversightData } = useGetWorkOversightQuery();
  const { data: statusData } = useGetAiStatusQuery();

  const d = riskData ?? MOCK_RISK;
  const od = oversightData ?? MOCK_OVERSIGHT;
  const configured = statusData?.configured ?? false;

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>

      {/* ── Banner ──────────────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, #0B3D91 0%, #1D4ED8 100%)" }}>
        <div className="px-8 pt-8 pb-0">
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            AI Intelligence
          </p>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-[26px] font-black text-white">AI Dashboard</h1>
              <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                Risk Score · Incident Predictions · Safety Intelligence · Compliance · Alerts · Predictive Analytics
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {configured
                ? <Wifi className="w-4 h-4" style={{ color: "#6EE7B7" }} />
                : <WifiOff className="w-4 h-4" style={{ color: "#FCD34D" }} />}
              <span
                className="px-3 py-1 rounded-full text-[11px] uppercase font-bold"
                style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                {configured ? `AI Online · ${statusData?.model ?? "gpt-4o"}` : "AI Offline"}
              </span>
            </div>
          </div>
        </div>

        {/* Hero stats */}
        <div className="flex border-t mt-6 divide-x" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
          <HeroStat label="Overall Risk"       value={d.overall_risk_level.toUpperCase()} color={RISK_COLOR[d.overall_risk_level] ?? "#FCD34D"} />
          <HeroStat label="Risk Avg Score"     value={d.avg_score}                        color="#93C5FD" />
          <HeroStat label="Active Alerts"      value={od.active_alerts}                   color="#FCA5A5" />
          <HeroStat label="Violations Today"   value={od.violations_today}                color="#FCD34D" />
          <HeroStat label="Entities Tracked"   value={d.scores.length}                    color="#6EE7B7" />
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="p-6 space-y-5">

        {/* Row 1: Risk Score + Incident Predictions */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <AiRiskScoreSection />
          <AiIncidentPredictionsSection />
        </div>

        {/* Row 2: Safety Intelligence + Compliance Intelligence */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <SafetyIntelligenceSection />
          <ComplianceIntelligenceSection />
        </div>

        {/* Row 3: AI Alerts + Predictive Analytics */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <AiAlertsSection />
          <PredictiveAnalyticsSection />
        </div>

      </div>
    </div>
  );
}
