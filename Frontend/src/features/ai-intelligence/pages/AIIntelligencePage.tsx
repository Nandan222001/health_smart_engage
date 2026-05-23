import { useState } from "react";
import {
  Brain, Gauge, BarChart3, ShieldAlert, CheckSquare,
  Eye, Users, RefreshCw, TrendingUp, TrendingDown,
  Minus, AlertTriangle, CheckCircle2, Zap, ArrowUpRight, ArrowDownRight,
  Activity, Cpu, Database, Star,
} from "lucide-react";
import {
  useGetComplianceBenchmarkingQuery,
  useGetRiskScoringQuery,
  useGetKPIIntelligenceQuery,
  useGetPIRSQuery,
  useGetCorrectiveRecommendationsQuery,
  useGetWorkOversightQuery,
  useGetLeadershipIntelligenceQuery,
  useGetContinuousLearningQuery,
} from "@/features/ai-intelligence/api/aiIntelligenceApi";
import type {
  ComplianceBenchmark, RiskScore, KPIIndicator, PIRSEntry,
  AIRecommendation, OversightAlert, LeadershipMetric, ModelStatus,
} from "@/features/ai-intelligence/api/aiIntelligenceApi";

// ─── Mock data (used when backend returns stub) ────────────────────────────

const MOCK_COMPLIANCE = {
  overall_score: 83,
  last_updated: new Date().toISOString(),
  trend: [{ label: "Jan", value: 74 }, { label: "Feb", value: 77 }, { label: "Mar", value: 80 }, { label: "Apr", value: 83 }],
  benchmarks: [
    { standard: "ISO 45001", your_score: 87, industry_avg: 72, best_in_class: 95, gap: 8, status: "above" as const },
    { standard: "OSHA 300",  your_score: 78, industry_avg: 80, best_in_class: 96, gap: 18, status: "below" as const },
    { standard: "RIDDOR",    your_score: 91, industry_avg: 68, best_in_class: 94, gap: 3, status: "above" as const },
    { standard: "ISO 14001", your_score: 75, industry_avg: 75, best_in_class: 92, gap: 17, status: "on_par" as const },
  ],
};

const MOCK_RISK = {
  overall_risk_level: "medium" as const,
  avg_score: 42,
  trend: [{ label: "Mon", value: 55 }, { label: "Tue", value: 48 }, { label: "Wed", value: 42 }, { label: "Thu", value: 38 }],
  scores: [
    { id: "1", entity_type: "site" as const,      entity_name: "Main Factory",   score: 68, level: "high" as const,   factors: ["High footfall", "Machinery exposure"], changed_at: new Date().toISOString() },
    { id: "2", entity_type: "permit" as const,    entity_name: "Hot Work PTW #12", score: 55, level: "medium" as const, factors: ["Flammable materials nearby"], changed_at: new Date().toISOString() },
    { id: "3", entity_type: "workforce" as const, entity_name: "Night Shift Team", score: 34, level: "low" as const,    factors: ["Fatigue risk"], changed_at: new Date().toISOString() },
    { id: "4", entity_type: "task" as const,      entity_name: "Conveyor Maintenance", score: 81, level: "critical" as const, factors: ["Lockout/Tagout required", "Confined space"], changed_at: new Date().toISOString() },
  ],
};

const MOCK_KPI = {
  health_score: 76,
  leading_indicators: [
    { id: "l1", name: "Safety Observations Filed", type: "leading" as const, current_value: 143, target: 120, unit: "count", trend: "improving" as const, change_pct: 12 },
    { id: "l2", name: "Toolbox Talk Completion", type: "leading" as const, current_value: 88, target: 95, unit: "%", trend: "stable" as const, change_pct: 1 },
    { id: "l3", name: "PPE Inspection Rate",    type: "leading" as const, current_value: 94, target: 90, unit: "%", trend: "improving" as const, change_pct: 4 },
    { id: "l4", name: "Near-Miss Reports",      type: "leading" as const, current_value: 28, target: 40, unit: "count", trend: "declining" as const, change_pct: -8 },
  ],
  lagging_indicators: [
    { id: "g1", name: "Lost Time Injury Rate",  type: "lagging" as const, current_value: 0.8, target: 0.5, unit: "per 200k hrs", trend: "improving" as const, change_pct: -12 },
    { id: "g2", name: "Total Recordable Rate",  type: "lagging" as const, current_value: 2.1, target: 1.8, unit: "per 200k hrs", trend: "stable" as const, change_pct: -2 },
    { id: "g3", name: "Days Since Lost Time",   type: "lagging" as const, current_value: 127, target: 200, unit: "days", trend: "improving" as const, change_pct: 15 },
  ],
};

const MOCK_PIRS = {
  high_risk_count: 4,
  model_accuracy: 91.4,
  last_trained: "2026-05-20T02:00:00Z",
  predictions: [
    { entity_id: "w1", entity_name: "Worker: Marcus T.", entity_type: "worker" as const, injury_probability: 0.73, risk_factors: [{ factor: "Fatigue pattern detected", weight: 0.4 }, { factor: "Recent near-miss report", weight: 0.33 }], recommended_action: "Rotate to lighter duties for 48h", urgency: "high" as const },
    { entity_id: "s1", entity_name: "Zone: Compressor Bay", entity_type: "site" as const, injury_probability: 0.61, risk_factors: [{ factor: "Noise level > 85dB", weight: 0.35 }, { factor: "Inadequate PPE compliance", weight: 0.26 }], recommended_action: "Mandatory hearing protection audit", urgency: "high" as const },
    { entity_id: "t1", entity_name: "Task: Tank Cleaning", entity_type: "task" as const, injury_probability: 0.44, risk_factors: [{ factor: "Chemical exposure risk", weight: 0.3 }, { factor: "Lone worker detected", weight: 0.14 }], recommended_action: "Buddy system mandatory + gas detection", urgency: "medium" as const },
  ],
};

const MOCK_RECS = {
  total: 18,
  unactioned: 11,
  recommendations: [
    { id: "r1", title: "Increase inspection frequency in Compressor Bay", description: "AI detected 3 anomalies in 7 days — inspection cadence should double.", category: "Compliance", priority: "critical" as const, confidence: 0.94, source_events: ["Near-miss #44", "Audit finding #12"], suggested_action: "Schedule daily walkthrough for next 2 weeks", created_at: new Date().toISOString() },
    { id: "r2", title: "Replace PTW paper forms with digital workflow", description: "Paper permits have 23% error rate vs 2% digital. Transition recommended.", category: "Process", priority: "high" as const, confidence: 0.88, source_events: ["Permit audit March", "Error log analysis"], suggested_action: "Migrate to digital PTW by end of quarter", created_at: new Date().toISOString() },
    { id: "r3", title: "Schedule refresher training for Night Shift", description: "Night shift shows 31% higher violation rate. Training gap detected.", category: "Training", priority: "high" as const, confidence: 0.82, source_events: ["Violation data Q1", "Training matrix gap"], suggested_action: "Book COSHH refresher training for 18 workers", created_at: new Date().toISOString() },
  ],
};

const MOCK_OVERSIGHT = {
  active_alerts: 7,
  violations_today: 3,
  drift_events: 2,
  unsafe_acts: 2,
  alerts: [
    { id: "a1", type: "violation" as const,  description: "No-helmet zone breach — Zone 4 camera 3", site: "Main Factory", zone: "Zone 4", severity: "high" as const,   detected_at: new Date().toISOString(), resolved: false },
    { id: "a2", type: "drift" as const,      description: "Process deviation: conveyor speed 18% above SOP", site: "Warehouse A", severity: "medium" as const,           detected_at: new Date().toISOString(), resolved: false },
    { id: "a3", type: "unsafe_act" as const, description: "Worker bypassed lockout procedure on Line 2", site: "Main Factory", zone: "Line 2", severity: "critical" as const, detected_at: new Date().toISOString(), resolved: false },
  ],
};

const MOCK_LEADERSHIP = {
  engagement_score: 72,
  safety_culture_score: 68,
  communication_score: 81,
  top_insights: [
    "Leadership visibility in safety walks up 15% this month",
    "Communication response time improved by 22%",
    "Safety suggestion uptake below benchmark — encourage reporting culture",
  ],
  metrics: [
    { dimension: "Safety Walk Frequency", score: 78, benchmark: 70, insights: ["Above industry avg", "Consistent week-on-week"] },
    { dimension: "Toolbox Talk Engagement", score: 64, benchmark: 75, insights: ["Below benchmark", "Night shift participation low"] },
    { dimension: "Incident Reporting Willingness", score: 71, benchmark: 68, insights: ["Good reporting culture", "Near-miss under-reported"] },
    { dimension: "Corrective Action Follow-through", score: 82, benchmark: 72, insights: ["Strong closure rate", "Average 4.2 day resolution"] },
  ],
};

const MOCK_LEARNING = {
  data_points_collected: 284_033,
  improvements_this_month: 7,
  next_training_at: "2026-06-01T02:00:00Z",
  models: [
    { model_name: "PPE Violation Detector",      version: "v3.2.1", accuracy: 94.1, precision: 92.8, recall: 95.3, last_trained: "2026-05-15", training_samples: 82_400, status: "active" as const },
    { model_name: "Predictive Injury Risk (PIRS)", version: "v2.0.4", accuracy: 91.4, precision: 89.1, recall: 93.6, last_trained: "2026-05-10", training_samples: 44_200, status: "active" as const },
    { model_name: "Anomaly / Drift Detector",    version: "v1.8.0", accuracy: 88.7, precision: 87.2, recall: 90.1, last_trained: "2026-04-28", training_samples: 31_800, status: "active" as const },
    { model_name: "NLP Compliance Extractor",    version: "v4.1.0", accuracy: 96.2, precision: 95.0, recall: 97.4, last_trained: "2026-05-18", training_samples: 28_100, status: "active" as const },
    { model_name: "Risk Scoring Engine",         version: "v2.3.0-beta", accuracy: 89.3, precision: 88.0, recall: 90.5, last_trained: "2026-05-20", training_samples: 15_200, status: "staged" as const },
  ],
};

// ─── Shared UI helpers ─────────────────────────────────────────────────────

const RISK_COLOR: Record<string, string> = { low: "#10B981", medium: "#F59E0B", high: "#F97316", critical: "#EF4444" };
const PRIORITY_COLOR: Record<string, string> = { low: "#10B981", medium: "#F59E0B", high: "#F97316", critical: "#EF4444" };
const ALERT_TYPE_COLOR: Record<string, string> = { violation: "#EF4444", drift: "#F59E0B", unsafe_act: "#7C3AED" };

function ScoreRing({ value, size = 72, color = "#4A57B9" }: { value: number; size?: number; color?: string }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={8} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="rotate-90" style={{ fontSize: size / 4.5, fontWeight: 700, fill: "#111827" }} transform={`rotate(90, ${size / 2}, ${size / 2})`}>
        {value}
      </text>
    </svg>
  );
}

function TrendIcon({ trend }: { trend: "improving" | "stable" | "declining" }) {
  if (trend === "improving") return <TrendingUp className="w-3.5 h-3.5" style={{ color: "#10B981" }} />;
  if (trend === "declining") return <TrendingDown className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />;
  return <Minus className="w-3.5 h-3.5" style={{ color: "#9CA3AF" }} />;
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

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border p-5 ${className}`} style={{ borderColor: "#E3E9F6" }}>
      {children}
    </div>
  );
}

// ─── Module 1: Compliance Benchmarking ────────────────────────────────────

function ComplianceModule() {
  const { data: raw, isLoading } = useGetComplianceBenchmarkingQuery();
  const d = raw ?? MOCK_COMPLIANCE;
  const statusCfg = (s: string) =>
    s === "above" ? { color: "#10B981", label: "Above avg" } :
    s === "below" ? { color: "#EF4444", label: "Below avg" } :
    { color: "#F59E0B", label: "On par" };

  return (
    <Card>
      <SectionHeader icon={Brain} title="Compliance Benchmarking" sub="Compare vs standards and best practices" accent="#4A57B9" />
      {isLoading ? <p className="text-sm text-center py-4" style={{ color: "#9CA3AF" }}>Loading…</p> : (
        <div className="flex gap-5 items-start">
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <ScoreRing value={d.overall_score} color="#4A57B9" />
            <span className="text-xs font-semibold" style={{ color: "#4A57B9" }}>Overall score</span>
          </div>
          <div className="flex-1 space-y-2">
            {d.benchmarks.map((b: ComplianceBenchmark) => {
              const cfg = statusCfg(b.status);
              return (
                <div key={b.standard} className="flex items-center gap-3 py-1.5">
                  <div className="w-24 text-xs font-semibold flex-shrink-0" style={{ color: "#374151" }}>{b.standard}</div>
                  <div className="flex-1">
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                      <div className="h-full rounded-full" style={{ width: `${b.your_score}%`, background: cfg.color }} />
                    </div>
                  </div>
                  <div className="w-10 text-xs font-bold text-right" style={{ color: "#111827" }}>{b.your_score}%</div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold w-20 text-center" style={{ background: cfg.color + "18", color: cfg.color }}>{cfg.label}</span>
                  <div className="text-xs text-right w-28 flex-shrink-0" style={{ color: "#9CA3AF" }}>
                    Avg {b.industry_avg}% · Best {b.best_in_class}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Module 2: Risk Scoring ────────────────────────────────────────────────

function RiskScoringModule() {
  const { data: raw, isLoading } = useGetRiskScoringQuery();
  const d = raw ?? MOCK_RISK;

  return (
    <Card>
      <SectionHeader icon={Gauge} title="Risk Scoring (Real-time)" sub="Task · Site · Permit · Workforce risk" accent="#EF4444" />
      {isLoading ? <p className="text-sm text-center py-4" style={{ color: "#9CA3AF" }}>Loading…</p> : (
        <div className="space-y-3">
          {d.scores.map((s: RiskScore) => {
            const color = RISK_COLOR[s.level];
            const pct = s.score;
            return (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F8FAFF" }}>
                <div className="w-28 text-xs font-semibold flex-shrink-0" style={{ color: "#374151" }}>
                  <div>{s.entity_name}</div>
                  <div className="font-normal capitalize" style={{ color: "#9CA3AF" }}>{s.entity_type}</div>
                </div>
                <div className="flex-1">
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
                <div className="w-8 text-sm font-bold text-right" style={{ color }}>{pct}</div>
                <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full w-16 text-center" style={{ background: color + "1A", color }}>{s.level}</span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─── Module 3: KPI Intelligence ───────────────────────────────────────────

function KPIRow({ kpi }: { kpi: KPIIndicator }) {
  const hitTarget = kpi.current_value >= kpi.target;
  const pct = Math.min((kpi.current_value / (kpi.target * 1.2)) * 100, 100);
  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: "#F3F4F6" }}>
      <TrendIcon trend={kpi.trend} />
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="font-semibold" style={{ color: "#374151" }}>{kpi.name}</span>
          <span style={{ color: "#9CA3AF" }}>Target: {kpi.target} {kpi.unit}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: hitTarget ? "#10B981" : "#F59E0B" }} />
        </div>
      </div>
      <div className="text-xs font-bold w-20 text-right" style={{ color: hitTarget ? "#10B981" : "#F59E0B" }}>
        {kpi.current_value} {kpi.unit}
      </div>
      <span className="text-xs w-10 text-right" style={{ color: kpi.change_pct > 0 ? "#10B981" : kpi.change_pct < 0 ? "#EF4444" : "#9CA3AF" }}>
        {kpi.change_pct > 0 ? "+" : ""}{kpi.change_pct}%
      </span>
    </div>
  );
}

function KPIModule() {
  const { data: raw, isLoading } = useGetKPIIntelligenceQuery();
  const d = raw ?? MOCK_KPI;

  return (
    <Card>
      <SectionHeader icon={BarChart3} title="KPI Intelligence" sub="Leading & lagging indicators" accent="#8B5CF6" />
      {isLoading ? <p className="text-sm text-center py-4" style={{ color: "#9CA3AF" }}>Loading…</p> : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#10B981" }}>Leading Indicators</p>
            {d.leading_indicators.map((k: KPIIndicator) => <KPIRow key={k.id} kpi={k} />)}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#EF4444" }}>Lagging Indicators</p>
            {d.lagging_indicators.map((k: KPIIndicator) => <KPIRow key={k.id} kpi={k} />)}
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Module 4: PIRS ───────────────────────────────────────────────────────

function PIRSModule() {
  const { data: raw, isLoading } = useGetPIRSQuery();
  const d = raw ?? MOCK_PIRS;

  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <SectionHeader icon={ShieldAlert} title="PIRS — Predictive Injury Risk Scoring" sub="AI predicts injury probability per worker, site and task" accent="#F97316" />
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold" style={{ color: "#4A57B9" }}>{d.model_accuracy}%</div>
          <div className="text-xs" style={{ color: "#9CA3AF" }}>Model accuracy</div>
        </div>
      </div>
      {isLoading ? <p className="text-sm text-center py-4" style={{ color: "#9CA3AF" }}>Loading…</p> : (
        <div className="space-y-3">
          {d.predictions.map((p: PIRSEntry) => {
            const pct = Math.round(p.injury_probability * 100);
            const color = pct > 65 ? "#EF4444" : pct > 40 ? "#F97316" : "#F59E0B";
            return (
              <div key={p.entity_id} className="rounded-xl border p-3.5 space-y-2" style={{ borderColor: pct > 65 ? "#FECACA" : "#E3E9F6", background: pct > 65 ? "#FFF5F5" : "#F8FAFF" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "#111827" }}>{p.entity_name}</div>
                    <div className="text-xs capitalize" style={{ color: "#9CA3AF" }}>{p.entity_type}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black" style={{ color }}>{pct}%</div>
                    <div className="text-xs font-semibold" style={{ color }}>injury probability</div>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
                <div className="flex items-start gap-2 pt-1">
                  <div className="flex-1 text-xs space-y-0.5" style={{ color: "#6B7280" }}>
                    {p.risk_factors.map((f) => (
                      <div key={f.factor} className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                        {f.factor}
                        <span className="font-medium" style={{ color: "#374151" }}>({Math.round(f.weight * 100)}%)</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 text-xs p-2 rounded-lg" style={{ background: "#EEF2FB", color: "#3730A3" }}>
                    <span className="font-semibold">Recommended: </span>{p.recommended_action}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─── Module 5: Corrective Recommendations ────────────────────────────────

function RecommendationsModule() {
  const { data: raw, isLoading } = useGetCorrectiveRecommendationsQuery();
  const d = raw ?? MOCK_RECS;

  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <SectionHeader icon={CheckSquare} title="Corrective Recommendations" sub="AI suggests actions and improvements" accent="#10B981" />
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-xl font-bold" style={{ color: "#EF4444" }}>{d.unactioned}</div>
            <div className="text-xs" style={{ color: "#9CA3AF" }}>Unactioned</div>
          </div>
        </div>
      </div>
      {isLoading ? <p className="text-sm text-center py-4" style={{ color: "#9CA3AF" }}>Loading…</p> : (
        <div className="space-y-3">
          {d.recommendations.map((r: AIRecommendation) => {
            const color = PRIORITY_COLOR[r.priority];
            return (
              <div key={r.id} className="rounded-xl border p-4 space-y-2" style={{ borderColor: "#E3E9F6" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: color + "1A", color }}>{r.priority}</span>
                      <span className="text-xs" style={{ color: "#9CA3AF" }}>{r.category}</span>
                      <span className="text-xs font-semibold ml-auto" style={{ color: "#4A57B9" }}>{Math.round(r.confidence * 100)}% confidence</span>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "#111827" }}>{r.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{r.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs px-2.5 py-1.5 rounded-lg" style={{ background: "#EEF2FB", color: "#3730A3" }}>
                    <span className="font-semibold">Action: </span>{r.suggested_action}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="text-xs px-3 py-1.5 rounded-lg border font-semibold" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>Dismiss</button>
                    <button type="button" className="text-xs px-3 py-1.5 rounded-lg text-white font-semibold" style={{ background: "#10B981" }}>Act Now</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─── Module 6: Work Execution Oversight ──────────────────────────────────

function OversightModule() {
  const { data: raw, isLoading } = useGetWorkOversightQuery();
  const d = raw ?? MOCK_OVERSIGHT;

  const typeLabel: Record<string, string> = { violation: "Violation", drift: "Process Drift", unsafe_act: "Unsafe Act" };

  return (
    <Card>
      <SectionHeader icon={Eye} title="Work Execution Oversight" sub="Detect violations, drift, and unsafe acts in real-time" accent="#7C3AED" />
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: "Active Alerts", value: d.active_alerts, color: "#EF4444" },
          { label: "Violations Today", value: d.violations_today, color: "#F97316" },
          { label: "Drift Events", value: d.drift_events, color: "#F59E0B" },
          { label: "Unsafe Acts", value: d.unsafe_acts, color: "#7C3AED" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ background: color + "0F" }}>
            <div className="text-2xl font-bold" style={{ color }}>{isLoading ? "…" : value}</div>
            <div className="text-xs font-medium mt-0.5" style={{ color: "#6B7280" }}>{label}</div>
          </div>
        ))}
      </div>
      {!isLoading && (
        <div className="space-y-2">
          {d.alerts.map((a: OversightAlert) => {
            const color = ALERT_TYPE_COLOR[a.type] ?? "#9CA3AF";
            const sevColor = RISK_COLOR[a.severity];
            return (
              <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl border" style={{ borderColor: "#E3E9F6" }}>
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold" style={{ color }}>{typeLabel[a.type]}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold capitalize" style={{ background: sevColor + "1A", color: sevColor }}>{a.severity}</span>
                    <span className="text-xs ml-auto" style={{ color: "#9CA3AF" }}>{a.site}{a.zone ? ` · ${a.zone}` : ""}</span>
                  </div>
                  <p className="text-xs" style={{ color: "#374151" }}>{a.description}</p>
                </div>
                {!a.resolved && (
                  <button type="button" className="text-xs px-2 py-1 rounded-lg font-semibold flex-shrink-0" style={{ background: "#EEF2FB", color: "#4A57B9" }}>Resolve</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─── Module 7: Leadership Intelligence ────────────────────────────────────

function LeadershipModule() {
  const { data: raw, isLoading } = useGetLeadershipIntelligenceQuery();
  const d = raw ?? MOCK_LEADERSHIP;

  return (
    <Card>
      <SectionHeader icon={Users} title="Leadership Intelligence" sub="Engagement, communications, and safety culture" accent="#06B6D4" />
      {isLoading ? <p className="text-sm text-center py-4" style={{ color: "#9CA3AF" }}>Loading…</p> : (
        <div className="space-y-4">
          {/* Score rings */}
          <div className="flex items-center gap-6 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
            {[
              { label: "Engagement", value: d.engagement_score, color: "#06B6D4" },
              { label: "Safety Culture", value: d.safety_culture_score, color: "#8B5CF6" },
              { label: "Communication", value: d.communication_score, color: "#10B981" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <ScoreRing value={value} size={60} color={color} />
                <span className="text-xs font-medium" style={{ color: "#6B7280" }}>{label}</span>
              </div>
            ))}
            {/* Top insights */}
            <div className="flex-1 space-y-1.5">
              {d.top_insights.map((insight: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "#374151" }}>
                  <Star className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "#F59E0B" }} />
                  {insight}
                </div>
              ))}
            </div>
          </div>
          {/* Metric rows */}
          <div className="space-y-2">
            {d.metrics.map((m: LeadershipMetric) => {
              const above = m.score >= m.benchmark;
              return (
                <div key={m.dimension} className="flex items-center gap-3">
                  <div className="w-44 text-xs font-semibold flex-shrink-0" style={{ color: "#374151" }}>{m.dimension}</div>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                    <div className="h-full rounded-full" style={{ width: `${m.score}%`, background: above ? "#10B981" : "#F59E0B" }} />
                  </div>
                  <span className="text-xs font-bold w-8" style={{ color: above ? "#10B981" : "#F59E0B" }}>{m.score}</span>
                  {above
                    ? <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#10B981" }} />
                    : <ArrowDownRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#EF4444" }} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Module 8: Continuous Learning ────────────────────────────────────────

function ModelRow({ model }: { model: ModelStatus }) {
  const statusCfg = {
    active:     { color: "#10B981", bg: "#D1FAE5", label: "Active" },
    training:   { color: "#F59E0B", bg: "#FEF3C7", label: "Training" },
    staged:     { color: "#8B5CF6", bg: "#F5F3FF", label: "Staged" },
    deprecated: { color: "#9CA3AF", bg: "#F3F4F6", label: "Deprecated" },
  }[model.status];

  return (
    <tr className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
      <td className="px-4 py-3">
        <div className="text-sm font-semibold" style={{ color: "#111827" }}>{model.model_name}</div>
        <div className="text-xs font-mono" style={{ color: "#9CA3AF" }}>{model.version}</div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
            <div className="h-full rounded-full" style={{ width: `${model.accuracy}%`, background: model.accuracy > 90 ? "#10B981" : "#F59E0B" }} />
          </div>
          <span className="text-xs font-bold" style={{ color: "#111827" }}>{model.accuracy}%</span>
        </div>
      </td>
      <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{model.training_samples.toLocaleString()}</td>
      <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{model.last_trained}</td>
      <td className="px-4 py-3">
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</span>
      </td>
    </tr>
  );
}

function ContinuousLearningModule() {
  const { data: raw, isLoading } = useGetContinuousLearningQuery();
  const d = raw ?? MOCK_LEARNING;

  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <SectionHeader icon={RefreshCw} title="Continuous Learning" sub="Models learn and improve from operational data" accent="#F59E0B" />
        <div className="grid grid-cols-2 gap-3 flex-shrink-0">
          {[
            { label: "Data Points", value: (d.data_points_collected ?? 0).toLocaleString(), icon: Database, color: "#4A57B9" },
            { label: "Improvements", value: `+${d.improvements_this_month} this month`, icon: Activity, color: "#10B981" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="text-center px-3 py-2 rounded-xl" style={{ background: color + "0F" }}>
              <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
              <div className="text-sm font-bold" style={{ color }}>{value}</div>
              <div className="text-xs" style={{ color: "#9CA3AF" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
      {isLoading ? <p className="text-sm text-center py-4" style={{ color: "#9CA3AF" }}>Loading…</p> : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                {["Model", "Accuracy", "Training Samples", "Last Trained", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.models.map((m: ModelStatus) => <ModelRow key={m.model_name} model={m} />)}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-3 flex items-center justify-between text-xs" style={{ color: "#9CA3AF" }}>
        <span>Next scheduled training: {new Date(d.next_training_at).toLocaleDateString()}</span>
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5" />
          <span>Auto-retraining enabled</span>
        </div>
      </div>
    </Card>
  );
}

// ─── Overview header with summary KPIs ────────────────────────────────────

function OverviewHeader() {
  const { data: risk } = useGetRiskScoringQuery();
  const { data: recs } = useGetCorrectiveRecommendationsQuery();
  const { data: oversight } = useGetWorkOversightQuery();
  const { data: compliance } = useGetComplianceBenchmarkingQuery();
  const { data: learning } = useGetContinuousLearningQuery();

  const riskD = risk ?? MOCK_RISK;
  const recsD = recs ?? MOCK_RECS;
  const oversightD = oversight ?? MOCK_OVERSIGHT;
  const complianceD = compliance ?? MOCK_COMPLIANCE;
  const learningD = learning ?? MOCK_LEARNING;

  const kpis = [
    { label: "Compliance Score",       value: `${complianceD.overall_score}%`, icon: Brain,       color: "#4A57B9" },
    { label: "Overall Risk Level",     value: riskD.overall_risk_level,        icon: Gauge,       color: RISK_COLOR[riskD.overall_risk_level] ?? "#F59E0B" },
    { label: "AI Recommendations",     value: `${recsD.unactioned} open`,      icon: Zap,         color: "#10B981" },
    { label: "Active Oversight Alerts",value: oversightD.active_alerts,        icon: Eye,         color: "#EF4444" },
    { label: "Avg Model Accuracy",     value: `${(learningD.models.reduce((s, m) => s + m.accuracy, 0) / (learningD.models.length || 1)).toFixed(1)}%`, icon: Cpu, color: "#8B5CF6" },
  ];

  return (
    <div className="grid grid-cols-5 gap-3">
      {kpis.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: "#E3E9F6" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "18" }}>
            <Icon className="w-4.5 h-4.5" style={{ color }} />
          </div>
          <div>
            <div className="text-base font-bold capitalize" style={{ color: "#111827" }}>{value}</div>
            <div className="text-xs" style={{ color: "#6B7280" }}>{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

type TabId = "overview" | "compliance" | "risk" | "kpi" | "pirs" | "recommendations" | "oversight" | "leadership" | "learning";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview",       label: "Overview" },
  { id: "compliance",     label: "Compliance" },
  { id: "risk",           label: "Risk Scoring" },
  { id: "kpi",            label: "KPI Intelligence" },
  { id: "pirs",           label: "PIRS" },
  { id: "recommendations",label: "Recommendations" },
  { id: "oversight",      label: "Oversight" },
  { id: "leadership",     label: "Leadership" },
  { id: "learning",       label: "Learning" },
];

export function AIIntelligencePage() {
  const [tab, setTab] = useState<TabId>("overview");

  const showAll = tab === "overview";

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>AI Intelligence & Analytics</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Layer 4 — 8 AI-powered modules running continuously across your organisation</p>
      </div>

      {/* Summary KPIs */}
      <OverviewHeader />

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={tab === id
              ? { background: "#4A57B9", color: "#fff", boxShadow: "0 4px 10px rgba(74,87,185,0.25)" }
              : { background: "#F3F4F6", color: "#6B7280" }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Module grid */}
      <div className="space-y-5">
        {(showAll || tab === "compliance")    && <ComplianceModule />}
        {(showAll || tab === "risk")          && <RiskScoringModule />}
        {(showAll || tab === "kpi")           && <KPIModule />}
        {(showAll || tab === "pirs")          && <PIRSModule />}
        {(showAll || tab === "recommendations") && <RecommendationsModule />}
        {(showAll || tab === "oversight")     && <OversightModule />}
        {(showAll || tab === "leadership")    && <LeadershipModule />}
        {(showAll || tab === "learning")      && <ContinuousLearningModule />}
      </div>
    </div>
  );
}
