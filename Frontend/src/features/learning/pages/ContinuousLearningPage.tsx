import { useState } from "react";
import {
  Database, BrainCircuit, TrendingUp, Target, Shield,
  RefreshCw, CheckCircle2, Clock, AlertTriangle, ArrowRight,
  Zap, Activity, BarChart3, ChevronRight, Play,
  ArrowUpRight, ArrowDownRight, Minus, Cpu, FlaskConical,
  Star, GitBranch as GitBranchIcon, Layers,
} from "lucide-react";
import type { MLModel, DetectedPattern, SafetyOutcome, PredictionMetric } from "../api/learningApi";
import {
  useGetLearningLoopDataQuery,
  useListOperationalEventsQuery,
  useListPatternsQuery,
  useListModelsQuery,
  useTriggerTrainingMutation,
  usePromoteModelVersionMutation,
  useGetSafetyOutcomesQuery,
} from "../api/learningApi";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_EVENTS = [
  { id: "e1", source: "incident", title: "Severity-High incident logged – Zone B", payload_size_kb: 4.2, ingested_at: "2026-05-23T09:14:00Z", processed: true, features_extracted: 28 },
  { id: "e2", source: "audit", title: "Q2 Audit findings submitted – Site Alpha", payload_size_kb: 12.8, ingested_at: "2026-05-23T09:10:00Z", processed: true, features_extracted: 41 },
  { id: "e3", source: "permit", title: "Work permit WP-447 approved", payload_size_kb: 1.6, ingested_at: "2026-05-23T09:05:00Z", processed: true, features_extracted: 14 },
  { id: "e4", source: "capa", title: "CAPA INV-089 closed with evidence", payload_size_kb: 6.1, ingested_at: "2026-05-23T08:58:00Z", processed: true, features_extracted: 33 },
  { id: "e5", source: "hazard", title: "Chemical spill near-miss – Lab C", payload_size_kb: 3.4, ingested_at: "2026-05-23T08:45:00Z", processed: false, features_extracted: 0 },
  { id: "e6", source: "training", title: "Batch training completions – 24 employees", payload_size_kb: 8.7, ingested_at: "2026-05-23T08:30:00Z", processed: true, features_extracted: 19 },
  { id: "e7", source: "workflow", title: "Escalation triggered – case WF-1182", payload_size_kb: 2.1, ingested_at: "2026-05-23T08:22:00Z", processed: true, features_extracted: 22 },
  { id: "e8", source: "sensor", title: "Temperature anomaly – Compressor Unit 4", payload_size_kb: 0.8, ingested_at: "2026-05-23T08:15:00Z", processed: true, features_extracted: 9 },
];

const MOCK_PATTERNS: DetectedPattern[] = [
  { id: "p1", type: "anomaly", description: "Near-miss frequency in Zone B 3× above 90-day baseline", confidence: 94, supporting_events: 18, detected_at: "2026-05-23T08:00:00Z", affected_module: "Incidents", used_for_training: true },
  { id: "p2", type: "trend", description: "Steady decline in training compliance for night-shift workers over 6 weeks", confidence: 88, supporting_events: 42, detected_at: "2026-05-22T18:00:00Z", affected_module: "Training", used_for_training: true },
  { id: "p3", type: "correlation", description: "Strong correlation (r=0.81) between permit backlogs and incident rate the following week", confidence: 81, supporting_events: 61, detected_at: "2026-05-22T12:00:00Z", affected_module: "Permits", used_for_training: true },
  { id: "p4", type: "seasonality", description: "Incident rate peaks on Mondays and Fridays — consistent across 12 months", confidence: 76, supporting_events: 112, detected_at: "2026-05-21T09:00:00Z", affected_module: "Incidents", used_for_training: false },
  { id: "p5", type: "drift", description: "Risk model input distribution shifted 14% from training distribution — retraining advised", confidence: 91, supporting_events: 200, detected_at: "2026-05-20T07:00:00Z", affected_module: "Risk Scoring", used_for_training: false },
  { id: "p6", type: "correlation", description: "CAPA closure speed correlates with safety audit score improvement (r=0.74)", confidence: 79, supporting_events: 55, detected_at: "2026-05-19T14:00:00Z", affected_module: "CAPA", used_for_training: true },
];

const MOCK_MODELS: MLModel[] = [
  {
    id: "m1", name: "Incident Risk Scorer", domain: "Risk", status: "active",
    current_version: "v4.2", accuracy: 89.4, accuracy_delta: +3.1,
    last_trained: "2026-05-15T04:00:00Z", next_scheduled: "2026-06-15T04:00:00Z", training_runs: 12,
    versions: [
      { version: "v4.2", trained_at: "2026-05-15T04:00:00Z", accuracy: 89.4, precision: 91.2, recall: 87.6, f1_score: 89.4, training_samples: 8400, validation_loss: 0.118 },
      { version: "v4.1", trained_at: "2026-04-15T04:00:00Z", accuracy: 86.3, precision: 88.1, recall: 84.5, f1_score: 86.3, training_samples: 7800, validation_loss: 0.143 },
      { version: "v4.0", trained_at: "2026-03-15T04:00:00Z", accuracy: 83.8, precision: 85.4, recall: 82.2, f1_score: 83.8, training_samples: 7100, validation_loss: 0.169 },
    ],
  },
  {
    id: "m2", name: "CAPA Outcome Predictor", domain: "CAPA", status: "active",
    current_version: "v2.8", accuracy: 84.7, accuracy_delta: +5.4,
    last_trained: "2026-05-10T04:00:00Z", next_scheduled: "2026-06-10T04:00:00Z", training_runs: 8,
    versions: [
      { version: "v2.8", trained_at: "2026-05-10T04:00:00Z", accuracy: 84.7, precision: 86.0, recall: 83.4, f1_score: 84.7, training_samples: 5200, validation_loss: 0.162 },
      { version: "v2.7", trained_at: "2026-04-10T04:00:00Z", accuracy: 79.3, precision: 80.9, recall: 77.7, f1_score: 79.3, training_samples: 4700, validation_loss: 0.201 },
    ],
  },
  {
    id: "m3", name: "Compliance Trend Forecaster", domain: "Compliance", status: "training",
    current_version: "v3.1", accuracy: 91.2, accuracy_delta: +1.8,
    last_trained: "2026-05-23T07:00:00Z", next_scheduled: "2026-06-23T04:00:00Z", training_runs: 9,
    versions: [
      { version: "v3.1", trained_at: "2026-04-23T04:00:00Z", accuracy: 91.2, precision: 92.4, recall: 90.0, f1_score: 91.2, training_samples: 9800, validation_loss: 0.091 },
      { version: "v3.0", trained_at: "2026-03-23T04:00:00Z", accuracy: 89.4, precision: 90.8, recall: 88.0, f1_score: 89.4, training_samples: 9200, validation_loss: 0.109 },
    ],
  },
  {
    id: "m4", name: "Near-Miss Anomaly Detector", domain: "Incidents", status: "staged",
    current_version: "v1.5", accuracy: 87.6, accuracy_delta: +7.2,
    last_trained: "2026-05-22T04:00:00Z", next_scheduled: "2026-06-22T04:00:00Z", training_runs: 5,
    versions: [
      { version: "v1.5", trained_at: "2026-05-22T04:00:00Z", accuracy: 87.6, precision: 89.1, recall: 86.1, f1_score: 87.6, training_samples: 3100, validation_loss: 0.131 },
      { version: "v1.4", trained_at: "2026-04-22T04:00:00Z", accuracy: 80.4, precision: 82.0, recall: 78.8, f1_score: 80.4, training_samples: 2800, validation_loss: 0.194 },
    ],
  },
  {
    id: "m5", name: "Workforce Safety Index", domain: "Workforce", status: "active",
    current_version: "v2.3", accuracy: 82.1, accuracy_delta: +2.9,
    last_trained: "2026-05-01T04:00:00Z", next_scheduled: "2026-06-01T04:00:00Z", training_runs: 7,
    versions: [
      { version: "v2.3", trained_at: "2026-05-01T04:00:00Z", accuracy: 82.1, precision: 83.8, recall: 80.4, f1_score: 82.1, training_samples: 6400, validation_loss: 0.185 },
      { version: "v2.2", trained_at: "2026-04-01T04:00:00Z", accuracy: 79.2, precision: 80.9, recall: 77.5, f1_score: 79.2, training_samples: 5900, validation_loss: 0.213 },
    ],
  },
];

const MOCK_PREDICTION_METRICS: PredictionMetric[] = [
  { model_id: "m1", model_name: "Incident Risk Scorer", period: "May 2026", predictions_made: 1240, correct: 1109, accuracy: 89.4, avg_confidence: 84.2, high_confidence_pct: 71, improvement_vs_prior: 3.1 },
  { model_id: "m2", model_name: "CAPA Outcome Predictor", period: "May 2026", predictions_made: 310, correct: 262, accuracy: 84.7, avg_confidence: 79.8, high_confidence_pct: 62, improvement_vs_prior: 5.4 },
  { model_id: "m3", model_name: "Compliance Trend Forecaster", period: "May 2026", predictions_made: 85, correct: 78, accuracy: 91.2, avg_confidence: 87.5, high_confidence_pct: 78, improvement_vs_prior: 1.8 },
  { model_id: "m4", model_name: "Near-Miss Anomaly Detector", period: "May 2026", predictions_made: 520, correct: 455, accuracy: 87.6, avg_confidence: 82.1, high_confidence_pct: 68, improvement_vs_prior: 7.2 },
  { model_id: "m5", model_name: "Workforce Safety Index", period: "May 2026", predictions_made: 670, correct: 550, accuracy: 82.1, avg_confidence: 76.4, high_confidence_pct: 57, improvement_vs_prior: 2.9 },
];

const MOCK_SAFETY_OUTCOMES: SafetyOutcome[] = [
  { metric: "Incident Rate (per 1000 hours)", baseline: 4.8, current: 2.9, unit: "/1k hrs", improvement_pct: 39.6, direction: "lower_is_better" },
  { metric: "CAPA Closure Time (days)", baseline: 28.4, current: 17.6, unit: "days", improvement_pct: 38.0, direction: "lower_is_better" },
  { metric: "Compliance Score", baseline: 76, current: 93, unit: "%", improvement_pct: 22.4, direction: "higher_is_better" },
  { metric: "Near-Miss Detection Rate", baseline: 61, current: 88, unit: "%", improvement_pct: 44.3, direction: "higher_is_better" },
  { metric: "Repeat Incidents (30d)", baseline: 22, current: 9, unit: "events", improvement_pct: 59.1, direction: "lower_is_better" },
  { metric: "Avg Risk Score", baseline: 6.4, current: 4.1, unit: "/10", improvement_pct: 35.9, direction: "lower_is_better" },
  { metric: "Training Completion Rate", baseline: 68, current: 87, unit: "%", improvement_pct: 27.9, direction: "higher_is_better" },
  { metric: "Critical Hazards Unresolved", baseline: 14, current: 3, unit: "hazards", improvement_pct: 78.6, direction: "lower_is_better" },
];

const ACCURACY_HISTORY = [74, 76, 78, 79, 81, 82, 83, 85, 85, 87, 88, 89];
const MONTHS = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const SOURCE_COLORS: Record<string, string> = {
  incident: "#EF4444", audit: "#8B5CF6", permit: "#3B82F6",
  capa: "#F97316", hazard: "#F59E0B", training: "#10B981",
  workflow: "#6366F1", sensor: "#06B6D4",
};

const PATTERN_TYPE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  anomaly: { bg: "#FEE2E2", color: "#991B1B", label: "Anomaly" },
  trend: { bg: "#FEF3C7", color: "#92400E", label: "Trend" },
  correlation: { bg: "#EDE9FE", color: "#5B21B6", label: "Correlation" },
  seasonality: { bg: "#D1FAE5", color: "#065F46", label: "Seasonality" },
  drift: { bg: "#FFF7ED", color: "#9A3412", label: "Model Drift" },
};

const MODEL_STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: "#D1FAE5", color: "#065F46", label: "Active" },
  training: { bg: "#FEF3C7", color: "#92400E", label: "Training…" },
  staged: { bg: "#EDE9FE", color: "#5B21B6", label: "Staged" },
  retired: { bg: "#F1F5F9", color: "#64748B", label: "Retired" },
};

// ─── Stage Pipeline Component ─────────────────────────────────────────────────

const LOOP_STAGES = [
  { id: 1, label: "Operational Data", sublabel: "New events", icon: Database, color: "#6366F1", bg: "#EEF2FF" },
  { id: 2, label: "AI Processes", sublabel: "Detects Patterns", icon: BrainCircuit, color: "#8B5CF6", bg: "#F3E8FF" },
  { id: 3, label: "Models Learn", sublabel: "& Improve", icon: TrendingUp, color: "#3B82F6", bg: "#EFF6FF" },
  { id: 4, label: "Better Predictions", sublabel: "& Recommendations", icon: Target, color: "#10B981", bg: "#ECFDF5" },
  { id: 5, label: "Safer Operations", sublabel: "& Reduced Risk", icon: Shield, color: "#22C55E", bg: "#F0FDF4" },
];

function LoopPipeline({ activeStage }: { activeStage: number | null }) {
  return (
    <div className="relative">
      {/* Connecting line */}
      <div className="absolute top-10 left-12 right-12 h-0.5 hidden sm:block" style={{ background: "linear-gradient(to right, #6366F1, #8B5CF6, #3B82F6, #10B981, #22C55E)" }} />

      <div className="grid grid-cols-5 gap-2">
        {LOOP_STAGES.map((stage, idx) => {
          const isActive = activeStage === stage.id;
          const Icon = stage.icon;
          return (
            <div key={stage.id} className="flex flex-col items-center gap-2 relative">
              {/* Arrow between stages */}
              {idx > 0 && (
                <div className="absolute -left-1 top-9 hidden sm:block z-10">
                  <ArrowRight className="w-3 h-3" style={{ color: "#C7D2FE" }} />
                </div>
              )}

              {/* Stage icon */}
              <div
                className="relative w-[72px] h-[72px] rounded-2xl flex items-center justify-center transition-all duration-300 z-20"
                style={{
                  background: isActive ? stage.color : stage.bg,
                  boxShadow: isActive ? `0 8px 24px ${stage.color}44` : "0 2px 8px rgba(0,0,0,0.06)",
                  transform: isActive ? "scale(1.08)" : "scale(1)",
                }}
              >
                <Icon className="w-8 h-8" style={{ color: isActive ? "#fff" : stage.color }} />
                {/* Pulse ring when active */}
                {isActive && (
                  <span className="absolute inset-0 rounded-2xl animate-ping opacity-30" style={{ background: stage.color }} />
                )}
                <span
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: stage.color }}
                >
                  {stage.id}
                </span>
              </div>

              {/* Label */}
              <div className="text-center">
                <div className="text-[11px] font-semibold leading-tight" style={{ color: "#111827" }}>{stage.label}</div>
                <div className="text-[10px]" style={{ color: "#6B7280" }}>{stage.sublabel}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Return arrow (loop back) */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <div className="flex-1 h-px" style={{ background: "#E3E9F6" }} />
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium" style={{ background: "#EEF2FF", color: "#4A57B9" }}>
          <RefreshCw className="w-3 h-3" />
          Loop closes — outcomes feed back into operational data
        </div>
        <div className="flex-1 h-px" style={{ background: "#E3E9F6" }} />
      </div>
    </div>
  );
}

// ─── Tab Definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Overview", icon: Layers },
  { id: "data", label: "Data Feed", icon: Database },
  { id: "patterns", label: "Patterns", icon: BrainCircuit },
  { id: "models", label: "Models", icon: Cpu },
  { id: "outcomes", label: "Outcomes", icon: Shield },
] as const;
type Tab = typeof TABS[number]["id"];

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data: loopData } = useGetLearningLoopDataQuery();
  const [activeStage, setActiveStage] = useState<number | null>(null);
  const models = loopData?.models?.length ? loopData.models : MOCK_MODELS;
  const summary = loopData?.summary;
  const avgAccuracy = models.reduce((s, m) => s + m.accuracy, 0) / models.length;
  const maxAcc = Math.max(...ACCURACY_HISTORY);
  const minAcc = Math.min(...ACCURACY_HISTORY);
  const range = maxAcc - minAcc || 1;

  return (
    <div className="space-y-6">
      {/* Pipeline */}
      <div className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#E3E9F6" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[14px] font-semibold" style={{ color: "#111827" }}>The Learning Cycle</h3>
            <p className="text-[12px] mt-0.5" style={{ color: "#6B7280" }}>Hover a stage to highlight it</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium" style={{ background: "#F0FDF4", color: "#166534" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Cycle Running
          </div>
        </div>
        <div onMouseLeave={() => setActiveStage(null)}>
          <div className="grid grid-cols-5 gap-2" onMouseLeave={() => setActiveStage(null)}>
            {LOOP_STAGES.map((stage) => {
              const isActive = activeStage === stage.id;
              const Icon = stage.icon;
              return (
                <div
                  key={stage.id}
                  className="flex flex-col items-center gap-2 cursor-pointer"
                  onMouseEnter={() => setActiveStage(stage.id)}
                >
                  <div className="relative w-[72px] h-[72px] rounded-2xl flex items-center justify-center transition-all duration-300"
                    style={{
                      background: isActive ? stage.color : stage.bg,
                      boxShadow: isActive ? `0 8px 24px ${stage.color}44` : "0 2px 8px rgba(0,0,0,0.06)",
                      transform: isActive ? "scale(1.08)" : "scale(1)",
                    }}>
                    <Icon className="w-8 h-8" style={{ color: isActive ? "#fff" : stage.color }} />
                    {isActive && <span className="absolute inset-0 rounded-2xl animate-ping opacity-25" style={{ background: stage.color }} />}
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: stage.color }}>{stage.id}</span>
                  </div>
                  <div className="text-center">
                    <div className="text-[11px] font-semibold" style={{ color: isActive ? stage.color : "#111827" }}>{stage.label}</div>
                    <div className="text-[10px]" style={{ color: "#6B7280" }}>{stage.sublabel}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="flex-1 h-px" style={{ background: "#E3E9F6" }} />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium" style={{ background: "#EEF2FF", color: "#4A57B9" }}>
              <RefreshCw className="w-3 h-3" /> Outcomes feed back into operational data
            </div>
            <div className="flex-1 h-px" style={{ background: "#E3E9F6" }} />
          </div>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Events Ingested Today", value: summary?.events_ingested_today ?? 284, icon: Database, color: "#6366F1", sub: "Operational data stream" },
          { label: "Patterns Detected", value: summary?.patterns_detected ?? 6, icon: BrainCircuit, color: "#8B5CF6", sub: `${summary?.cycle_runs_this_month ?? 0} cycle runs this month` },
          { label: "Avg Model Accuracy", value: `${avgAccuracy.toFixed(1)}%`, icon: Target, color: "#10B981", sub: `+${summary?.accuracy_improvement_30d?.toFixed(1) ?? "4.1"}% over 30 days` },
          { label: "Incidents Prevented (est.)", value: summary?.incidents_prevented_estimate ?? 34, icon: Shield, color: "#22C55E", sub: "based on predictions" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-4" style={{ background: "#fff", borderColor: "#E3E9F6" }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18` }}>
                <s.icon className="w-4.5 h-4.5" style={{ color: s.color, width: 18, height: 18 }} />
              </div>
            </div>
            <div className="text-[24px] font-bold mb-0.5" style={{ color: "#111827" }}>{s.value}</div>
            <div className="text-[11px] font-medium" style={{ color: "#6B7280" }}>{s.label}</div>
            <div className="text-[10px] mt-1" style={{ color: s.color }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Accuracy history chart */}
      <div className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#E3E9F6" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[14px] font-semibold" style={{ color: "#111827" }}>Average Model Accuracy – 12 Month Trend</h3>
            <p className="text-[12px]" style={{ color: "#6B7280" }}>Continuous improvement as models retrain on new operational data</p>
          </div>
          <div className="text-right">
            <div className="text-[22px] font-bold" style={{ color: "#10B981" }}>{ACCURACY_HISTORY[ACCURACY_HISTORY.length - 1]}%</div>
            <div className="text-[11px]" style={{ color: "#6B7280" }}>Current avg</div>
          </div>
        </div>
        <div className="flex items-end gap-2 h-28">
          {ACCURACY_HISTORY.map((v, i) => {
            const pct = ((v - minAcc) / range) * 90 + 10;
            const isLast = i === ACCURACY_HISTORY.length - 1;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-md relative" style={{ height: `${pct}%`, background: isLast ? "linear-gradient(to top, #10B981, #34D399)" : "linear-gradient(to top, #4A57B9, #818CF8)", opacity: isLast ? 1 : 0.7 }}>
                  {isLast && <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold" style={{ color: "#10B981" }}>{v}%</div>}
                </div>
                <span className="text-[9px]" style={{ color: "#94A3B8" }}>{MONTHS[i]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Model mini-cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {models.map((model) => {
          const st = MODEL_STATUS_STYLES[model.status];
          const pos = model.accuracy_delta >= 0;
          return (
            <div key={model.id} className="rounded-xl border p-4" style={{ background: "#fff", borderColor: "#E3E9F6" }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate" style={{ color: "#111827" }}>{model.name}</div>
                  <div className="text-[11px]" style={{ color: "#6B7280" }}>{model.domain} · {model.current_version}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0" style={{ background: st.bg, color: st.color }}>{st.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-[20px] font-bold" style={{ color: "#111827" }}>{model.accuracy}%</div>
                  <div className="text-[10px]" style={{ color: "#6B7280" }}>accuracy</div>
                </div>
                <div className="flex items-center gap-0.5" style={{ color: pos ? "#22C55E" : "#EF4444" }}>
                  {pos ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  <span className="text-[12px] font-semibold">{pos ? "+" : ""}{model.accuracy_delta}%</span>
                </div>
                <div className="flex-1 text-right text-[10px]" style={{ color: "#9CA3AF" }}>
                  {model.training_runs} runs
                </div>
              </div>
              <div className="mt-2 rounded-full overflow-hidden" style={{ height: 4, background: "#F1F5F9" }}>
                <div className="h-full rounded-full" style={{ width: `${model.accuracy}%`, background: "linear-gradient(to right,#4A57B9,#10B981)" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Data Feed Tab ────────────────────────────────────────────────────────────

function DataFeedTab() {
  const { data: eventsData = [] } = useListOperationalEventsQuery();
  const events = eventsData.length ? eventsData : MOCK_EVENTS;
  const [filter, setFilter] = useState<string>("all");
  const sources = ["all", "incident", "audit", "permit", "capa", "hazard", "training", "workflow", "sensor"];
  const filtered = filter === "all" ? events : events.filter((e) => e.source === filter);
  const processed = events.filter((e) => e.processed).length;
  const pending = events.length - processed;
  const totalFeatures = events.reduce((s, e) => s + e.features_extracted, 0);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Events Today", value: events.length, color: "#6366F1" },
          { label: "Processed", value: processed, color: "#10B981" },
          { label: "Pending", value: pending, color: "#F59E0B" },
          { label: "Features Extracted", value: totalFeatures > 999 ? `${(totalFeatures / 1000).toFixed(1)}k` : totalFeatures, color: "#3B82F6" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-4 text-center" style={{ background: "#fff", borderColor: "#E3E9F6" }}>
            <div className="text-[22px] font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[11px]" style={{ color: "#6B7280" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Source filter */}
      <div className="flex gap-1.5 flex-wrap">
        {sources.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-medium capitalize transition-all"
            style={filter === s
              ? { background: SOURCE_COLORS[s] || "#4A57B9", color: "#fff" }
              : { background: "#F1F5F9", color: "#374151" }}
          >
            {s === "all" ? "All Sources" : s}
          </button>
        ))}
      </div>

      {/* Event feed */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        {filtered.map((event, i) => {
          const srcColor = SOURCE_COLORS[event.source] || "#6B7280";
          return (
            <div key={event.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F1F5F9" : "none", background: "#fff" }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: srcColor }} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate" style={{ color: "#111827" }}>{event.title}</div>
                <div className="text-[11px]" style={{ color: "#6B7280" }}>
                  {fmtDate(event.ingested_at)} · {event.payload_size_kb} KB
                  {event.processed && <> · <span style={{ color: "#10B981" }}>{event.features_extracted} features extracted</span></>}
                </div>
              </div>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize flex-shrink-0"
                style={{ background: `${srcColor}18`, color: srcColor }}
              >
                {event.source}
              </span>
              {event.processed
                ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#22C55E" }} />
                : <RefreshCw className="w-4 h-4 flex-shrink-0 animate-spin" style={{ color: "#F59E0B" }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Patterns Tab ─────────────────────────────────────────────────────────────

function PatternsTab() {
  const { data: patternsData = [] } = useListPatternsQuery();
  const patterns = patternsData.length ? patternsData : MOCK_PATTERNS;
  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(PATTERN_TYPE_STYLES).map(([type, style]) => {
          const count = patterns.filter((p) => p.type === type).length;
          return (
            <div key={type} className="rounded-xl border p-3 text-center" style={{ background: "#fff", borderColor: "#E3E9F6" }}>
              <div className="text-[20px] font-bold mb-1" style={{ color: style.color }}>{count}</div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: style.bg, color: style.color }}>{style.label}</span>
            </div>
          );
        })}
      </div>

      {/* Pattern cards */}
      <div className="space-y-3">
        {patterns.map((pattern) => {
          const pt = PATTERN_TYPE_STYLES[pattern.type];
          const confColor = pattern.confidence >= 85 ? "#22C55E" : pattern.confidence >= 70 ? "#F59E0B" : "#EF4444";
          return (
            <div key={pattern.id} className="rounded-xl border p-4" style={{ background: "#fff", borderColor: "#E3E9F6" }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: pt.bg }}>
                  <BrainCircuit className="w-5 h-5" style={{ color: pt.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: pt.bg, color: pt.color }}>{pt.label}</span>
                    <span className="text-[11px]" style={{ color: "#6B7280" }}>{pattern.affected_module}</span>
                    {pattern.used_for_training && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "#EEF2FF", color: "#3730A3" }}>Used for training</span>
                    )}
                  </div>
                  <p className="text-[13px] font-medium mb-2" style={{ color: "#111827" }}>{pattern.description}</p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px]" style={{ color: "#6B7280" }}>Confidence:</span>
                      <div className="flex items-center gap-1">
                        <div className="w-16 rounded-full overflow-hidden" style={{ height: 4, background: "#F1F5F9" }}>
                          <div className="h-full rounded-full" style={{ width: `${pattern.confidence}%`, background: confColor }} />
                        </div>
                        <span className="text-[11px] font-semibold" style={{ color: confColor }}>{pattern.confidence}%</span>
                      </div>
                    </div>
                    <span className="text-[11px]" style={{ color: "#6B7280" }}>{pattern.supporting_events} supporting events</span>
                    <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{fmtDate(pattern.detected_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Models Tab ───────────────────────────────────────────────────────────────

function ModelsTab() {
  const { data: modelsData = [] } = useListModelsQuery();
  const [triggerTraining] = useTriggerTrainingMutation();
  const [promoteVersion] = usePromoteModelVersionMutation();
  const models = modelsData.length ? modelsData : MOCK_MODELS;
  const [expanded, setExpanded] = useState<string | null>(null);
  const [localTraining, setLocalTraining] = useState<Set<string>>(new Set());

  async function triggerTrain(id: string) {
    setLocalTraining((prev) => new Set([...prev, id]));
    try {
      await triggerTraining({ model_id: id });
    } finally {
      setTimeout(() => setLocalTraining((prev) => { const n = new Set(prev); n.delete(id); return n; }), 2500);
    }
  }

  return (
    <div className="space-y-4">
      {models.map((model) => {
        const st = MODEL_STATUS_STYLES[model.status];
        const isExpanded = expanded === model.id;
        const isTraining = localTraining.has(model.id) || model.status === "training";
        const pos = model.accuracy_delta >= 0;

        return (
          <div key={model.id} className="rounded-xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
            {/* Model header */}
            <div
              className="flex items-center gap-3 px-4 py-4 cursor-pointer"
              style={{ background: "#fff" }}
              onClick={() => setExpanded(isExpanded ? null : model.id)}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#EEF2FF" }}>
                <Cpu className="w-5 h-5" style={{ color: "#4A57B9" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-semibold" style={{ color: "#111827" }}>{model.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  <span className="text-[11px] font-mono" style={{ color: "#6B7280" }}>{model.current_version}</span>
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: "#6B7280" }}>
                  Domain: {model.domain} · Last trained: {fmtDateShort(model.last_trained)} · {model.training_runs} runs
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <div className="text-[18px] font-bold" style={{ color: "#111827" }}>{model.accuracy}%</div>
                  <div className="flex items-center gap-0.5 justify-end" style={{ color: pos ? "#22C55E" : "#EF4444" }}>
                    {pos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span className="text-[11px] font-semibold">{pos ? "+" : ""}{model.accuracy_delta}%</span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); triggerTrain(model.id); }}
                  disabled={isTraining}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                  style={{ background: isTraining ? "#F1F5F9" : "#EEF2FF", color: isTraining ? "#94A3B8" : "#3730A3" }}
                >
                  {isTraining ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  {isTraining ? "Training…" : "Train"}
                </button>
                <ChevronRight className="w-4 h-4 transition-transform" style={{ color: "#94A3B8", transform: isExpanded ? "rotate(90deg)" : "none" }} />
              </div>
            </div>

            {/* Version history */}
            {isExpanded && (
              <div style={{ background: "#F8FAFF", borderTop: "1px solid #E3E9F6" }}>
                <div className="px-4 py-3">
                  <div className="text-[12px] font-semibold mb-3" style={{ color: "#374151" }}>Version History</div>
                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr style={{ background: "#F1F5F9", borderBottom: "1px solid #E3E9F6" }}>
                          {["Version", "Trained", "Accuracy", "Precision", "Recall", "F1", "Samples", "Val. Loss", ""].map((h) => (
                            <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {model.versions.map((v, i) => {
                          const isCurrent = v.version === model.current_version;
                          return (
                            <tr key={v.version} style={{ borderBottom: i < model.versions.length - 1 ? "1px solid #F1F5F9" : "none", background: "#fff" }}>
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-semibold" style={{ color: isCurrent ? "#4A57B9" : "#374151" }}>{v.version}</span>
                                  {isCurrent && <Star className="w-3 h-3" style={{ color: "#F59E0B" }} fill="#F59E0B" />}
                                </div>
                              </td>
                              <td className="px-3 py-2.5" style={{ color: "#6B7280" }}>{fmtDateShort(v.trained_at)}</td>
                              <td className="px-3 py-2.5 font-semibold" style={{ color: "#111827" }}>{v.accuracy}%</td>
                              <td className="px-3 py-2.5" style={{ color: "#374151" }}>{v.precision}%</td>
                              <td className="px-3 py-2.5" style={{ color: "#374151" }}>{v.recall}%</td>
                              <td className="px-3 py-2.5" style={{ color: "#374151" }}>{v.f1_score}%</td>
                              <td className="px-3 py-2.5" style={{ color: "#374151" }}>{v.training_samples.toLocaleString()}</td>
                              <td className="px-3 py-2.5" style={{ color: "#374151" }}>{v.validation_loss}</td>
                              <td className="px-3 py-2.5">
                                {!isCurrent && (
                                  <button
                                    onClick={() => promoteVersion({ model_id: model.id, version: v.version })}
                                    className="px-2 py-1 rounded text-[10px] font-medium"
                                    style={{ background: "#EEF2FF", color: "#3730A3" }}
                                  >Promote</button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 text-[11px]" style={{ color: "#6B7280" }}>
                    Next scheduled training: {fmtDateShort(model.next_scheduled)}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Outcomes Tab ─────────────────────────────────────────────────────────────

function OutcomesTab() {
  const { data: loopData } = useGetLearningLoopDataQuery();
  const { data: outcomesData = [] } = useGetSafetyOutcomesQuery();
  const safetyOutcomes = outcomesData.length ? outcomesData : MOCK_SAFETY_OUTCOMES;
  const predictionMetrics = loopData?.prediction_metrics?.length ? loopData.prediction_metrics : MOCK_PREDICTION_METRICS;
  const incidentsPrevented = loopData?.summary?.incidents_prevented_estimate ?? 34;
  return (
    <div className="space-y-6">
      {/* Hero stat */}
      <div className="rounded-xl p-6 text-center" style={{ background: "linear-gradient(135deg, #4A57B9 0%, #6F80E8 100%)" }}>
        <Shield className="w-10 h-10 text-white mx-auto mb-3 opacity-80" />
        <div className="text-[40px] font-bold text-white mb-1">{incidentsPrevented}</div>
        <div className="text-white text-[14px] font-medium opacity-90">Estimated Incidents Prevented This Month</div>
        <div className="text-white text-[12px] opacity-70 mt-1">Based on AI predictions acted upon before incidents escalated</div>
      </div>

      {/* Prediction quality */}
      <div>
        <h3 className="text-[14px] font-semibold mb-3" style={{ color: "#111827" }}>Prediction Quality – May 2026</h3>
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E3E9F6" }}>
                {["Model", "Predictions", "Correct", "Accuracy", "Avg Confidence", "High Confidence", "vs Prior"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {predictionMetrics.map((m, i) => {
                const pos = m.improvement_vs_prior >= 0;
                return (
                  <tr key={m.model_id} style={{ borderBottom: i < predictionMetrics.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                    <td className="px-4 py-3 font-medium" style={{ color: "#111827" }}>{m.model_name}</td>
                    <td className="px-4 py-3" style={{ color: "#374151" }}>{m.predictions_made.toLocaleString()}</td>
                    <td className="px-4 py-3" style={{ color: "#374151" }}>{m.correct.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 rounded-full overflow-hidden" style={{ height: 4, background: "#F1F5F9" }}>
                          <div className="h-full rounded-full" style={{ width: `${m.accuracy}%`, background: "#4A57B9" }} />
                        </div>
                        <span className="font-semibold" style={{ color: "#111827" }}>{m.accuracy}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: "#374151" }}>{m.avg_confidence}%</td>
                    <td className="px-4 py-3" style={{ color: "#374151" }}>{m.high_confidence_pct}%</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 font-semibold" style={{ color: pos ? "#22C55E" : "#EF4444" }}>
                        {pos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {pos ? "+" : ""}{m.improvement_vs_prior}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety outcomes */}
      <div>
        <h3 className="text-[14px] font-semibold mb-3" style={{ color: "#111827" }}>Safety Outcomes vs Baseline</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {safetyOutcomes.map((outcome) => {
            const improved = outcome.direction === "lower_is_better"
              ? outcome.current < outcome.baseline
              : outcome.current > outcome.baseline;
            const color = improved ? "#22C55E" : "#EF4444";
            const ImpIcon = improved ? ArrowDownRight : ArrowUpRight;

            return (
              <div key={outcome.metric} className="rounded-xl border p-4" style={{ background: "#fff", borderColor: "#E3E9F6" }}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-[12px] font-medium" style={{ color: "#374151" }}>{outcome.metric}</span>
                  <span className="flex items-center gap-0.5 text-[12px] font-bold flex-shrink-0" style={{ color }}>
                    <ImpIcon className="w-4 h-4" />
                    {outcome.improvement_pct.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-end gap-3">
                  <div>
                    <div className="text-[10px] mb-0.5" style={{ color: "#9CA3AF" }}>Baseline</div>
                    <div className="text-[18px] font-bold" style={{ color: "#6B7280" }}>
                      {outcome.baseline}{outcome.unit}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 mb-1" style={{ color: "#D1D5DB" }} />
                  <div>
                    <div className="text-[10px] mb-0.5" style={{ color: "#9CA3AF" }}>Now</div>
                    <div className="text-[22px] font-bold" style={{ color: "#111827" }}>
                      {outcome.current}{outcome.unit}
                    </div>
                  </div>
                </div>
                <div className="mt-3 rounded-full overflow-hidden relative" style={{ height: 6, background: "#F1F5F9" }}>
                  <div className="h-full rounded-full" style={{ width: `${outcome.improvement_pct}%`, maxWidth: "100%", background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ContinuousLearningPage() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: "#F3F7FF" }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <RefreshCw className="w-5 h-5" style={{ color: "#4A57B9" }} />
          <h1 className="text-[20px] font-bold" style={{ color: "#111827" }}>Continuous Learning Loop</h1>
          <span className="ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "#EEF2FF", color: "#3730A3" }}>Layer 7</span>
        </div>
        <p className="text-[13px]" style={{ color: "#6B7280" }}>
          Operational data → AI pattern detection → model retraining → better predictions → safer operations — cycling continuously to reduce risk.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: "#E8EEF9" }}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all flex-1 justify-center"
              style={active
                ? { background: "#fff", color: "#4A57B9", fontWeight: 600, boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }
                : { background: "transparent", color: "#6B7280" }}
            >
              <t.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "data" && <DataFeedTab />}
      {tab === "patterns" && <PatternsTab />}
      {tab === "models" && <ModelsTab />}
      {tab === "outcomes" && <OutcomesTab />}
    </div>
  );
}
