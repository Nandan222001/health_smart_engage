import { baseApi } from "@/services/api/baseApi";

// ─── Stage 1: Operational Data ────────────────────────────────────────────────

export type EventSource = "incident" | "permit" | "audit" | "capa" | "hazard" | "training" | "workflow" | "sensor";

export interface OperationalEvent {
  id: string;
  source: EventSource;
  title: string;
  payload_size_kb: number;
  ingested_at: string;
  processed: boolean;
  features_extracted: number;
}

// ─── Stage 2: Pattern Detection ───────────────────────────────────────────────

export type PatternType = "anomaly" | "trend" | "correlation" | "seasonality" | "drift";

export interface DetectedPattern {
  id: string;
  type: PatternType;
  description: string;
  confidence: number;
  supporting_events: number;
  detected_at: string;
  affected_module: string;
  used_for_training: boolean;
}

// ─── Stage 3: Model Learning ──────────────────────────────────────────────────

export type ModelStatus = "active" | "training" | "staged" | "retired";

export interface ModelVersion {
  version: string;
  trained_at: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  training_samples: number;
  validation_loss: number;
}

export interface MLModel {
  id: string;
  name: string;
  domain: string;
  status: ModelStatus;
  current_version: string;
  accuracy: number;
  accuracy_delta: number;
  last_trained: string;
  next_scheduled: string;
  versions: ModelVersion[];
  training_runs: number;
}

// ─── Stage 4: Predictions ─────────────────────────────────────────────────────

export interface PredictionMetric {
  model_id: string;
  model_name: string;
  period: string;
  predictions_made: number;
  correct: number;
  accuracy: number;
  avg_confidence: number;
  high_confidence_pct: number;
  improvement_vs_prior: number;
}

// ─── Stage 5: Safety Outcomes ─────────────────────────────────────────────────

export interface SafetyOutcome {
  metric: string;
  baseline: number;
  current: number;
  unit: string;
  improvement_pct: number;
  direction: "lower_is_better" | "higher_is_better";
}

// ─── Loop Summary ─────────────────────────────────────────────────────────────

export interface LearningLoopSummary {
  events_ingested_today: number;
  patterns_detected: number;
  models_active: number;
  avg_model_accuracy: number;
  accuracy_improvement_30d: number;
  incidents_prevented_estimate: number;
  cycle_runs_this_month: number;
  last_cycle_completed_at: string;
}

export interface LearningLoopData {
  summary: LearningLoopSummary;
  recent_events: OperationalEvent[];
  detected_patterns: DetectedPattern[];
  models: MLModel[];
  prediction_metrics: PredictionMetric[];
  safety_outcomes: SafetyOutcome[];
}

// ─── RTK Query ────────────────────────────────────────────────────────────────

export const learningApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLearningLoopData: builder.query<LearningLoopData, void>({
      query: () => "/learning/loop",
      providesTags: ["Workflow"],
    }),
    listOperationalEvents: builder.query<OperationalEvent[], { source?: EventSource; limit?: number } | void>({
      query: (p) => {
        const params = p ? new URLSearchParams(p as Record<string, string>).toString() : "";
        return `/learning/events${params ? `?${params}` : ""}`;
      },
      providesTags: ["Workflow"],
    }),
    listPatterns: builder.query<DetectedPattern[], void>({
      query: () => "/learning/patterns",
      providesTags: ["Workflow"],
    }),
    listModels: builder.query<MLModel[], void>({
      query: () => "/learning/models",
      providesTags: ["Workflow"],
    }),
    triggerTraining: builder.mutation<{ job_id: string; message: string }, { model_id: string; reason?: string }>({
      query: (body) => ({ url: "/learning/models/train", method: "POST", body }),
      invalidatesTags: ["Workflow"],
    }),
    promoteModelVersion: builder.mutation<{ message: string }, { model_id: string; version: string }>({
      query: (body) => ({ url: "/learning/models/promote", method: "POST", body }),
      invalidatesTags: ["Workflow"],
    }),
    getSafetyOutcomes: builder.query<SafetyOutcome[], void>({
      query: () => "/learning/outcomes",
      providesTags: ["Workflow"],
    }),
  }),
});

export const {
  useGetLearningLoopDataQuery,
  useListOperationalEventsQuery,
  useListPatternsQuery,
  useListModelsQuery,
  useTriggerTrainingMutation,
  usePromoteModelVersionMutation,
  useGetSafetyOutcomesQuery,
} = learningApi;
