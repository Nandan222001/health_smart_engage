import { baseApi } from "@/services/api/baseApi";

// ─── Shared types ──────────────────────────────────────────────────────────

export interface TrendPoint { label: string; value: number }

// ─── Azure AI Foundry types ────────────────────────────────────────────────

export interface ChatMessage { role: "user" | "assistant"; content: string }

export interface AiChatResponse {
  content: string;
  model: string;
  finish_reason: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  configured: boolean;
}

export interface AiStatus {
  configured: boolean;
  model: string;
  endpoint: string;
  provider: string;
}

export interface AiDashboard {
  configured: boolean;
  model: string;
  stats: Record<string, number>;
  top_risks: string[];
  ai_summary: string;
}

export interface AiRiskPrediction {
  entity: string;
  likelihood: number;
  impact: number;
  score: number;
  recommendation: string;
}

export interface AiRiskPredictions {
  configured: boolean;
  predictions: AiRiskPrediction[];
  raw_data: Record<string, unknown>;
  generated_at: string;
}

export interface ComplianceGap {
  area: string;
  current: number;
  required: number;
  gap: number;
  priority: string;
}

export interface AiComplianceIntelligence {
  configured: boolean;
  benchmarking: Record<string, unknown>;
  gaps: ComplianceGap[];
  overall_assessment: string;
  generated_at: string;
}

export interface AiSafetyRec {
  title: string;
  description: string;
  priority: string;
  category: string;
}

export interface AiSafetyRecommendations {
  configured: boolean;
  ai_recommendations: AiSafetyRec[];
  platform_recommendations: AiSafetyRec[];
  generated_at: string;
}

export interface MonthlyTrendPoint {
  month: string;
  incidents: number;
  near_misses: number;
  resolved: number;
}

export interface AiTrendAnalysis {
  configured: boolean;
  monthly_data: MonthlyTrendPoint[];
  analysis: string;
  generated_at: string;
}

export interface KnowledgeResult {
  id: string;
  title?: string;
  content: string;
  score?: number;
  source?: string;
}

export interface AiKnowledgeSearchResponse {
  query: string;
  results: KnowledgeResult[];
  answer: string;
  total: number;
}

// ─── Compliance Benchmarking ───────────────────────────────────────────────

export interface ComplianceBenchmark {
  standard: string;
  your_score: number;
  industry_avg: number;
  best_in_class: number;
  gap: number;
  status: "above" | "on_par" | "below";
}

export interface ComplianceBenchmarkingData {
  overall_score: number;
  benchmarks: ComplianceBenchmark[];
  trend: TrendPoint[];
  last_updated: string;
}

// ─── Risk Scoring ──────────────────────────────────────────────────────────

export interface RiskScore {
  id: string;
  entity_type: "task" | "site" | "permit" | "workforce";
  entity_name: string;
  score: number;
  level: "low" | "medium" | "high" | "critical";
  factors: string[];
  changed_at: string;
}

export interface RiskScoringData {
  overall_risk_level: "low" | "medium" | "high" | "critical";
  avg_score: number;
  scores: RiskScore[];
  trend: TrendPoint[];
}

// ─── KPI Intelligence ──────────────────────────────────────────────────────

export interface KPIIndicator {
  id: string;
  name: string;
  type: "leading" | "lagging";
  current_value: number;
  target: number;
  unit: string;
  trend: "improving" | "stable" | "declining";
  change_pct: number;
}

export interface KPIIntelligenceData {
  leading_indicators: KPIIndicator[];
  lagging_indicators: KPIIndicator[];
  health_score: number;
}

// ─── PIRS (Predictive Injury Risk Scoring) ─────────────────────────────────

export interface PIRSEntry {
  entity_id: string;
  entity_name: string;
  entity_type: "worker" | "site" | "task";
  injury_probability: number;
  risk_factors: { factor: string; weight: number }[];
  recommended_action: string;
  urgency: "low" | "medium" | "high";
}

export interface PIRSData {
  high_risk_count: number;
  predictions: PIRSEntry[];
  model_accuracy: number;
  last_trained: string;
}

// ─── Corrective Recommendations ────────────────────────────────────────────

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  confidence: number;
  source_events: string[];
  suggested_action: string;
  created_at: string;
}

export interface CorrectiveRecommendationsData {
  total: number;
  unactioned: number;
  recommendations: AIRecommendation[];
}

// ─── Work Execution Oversight ──────────────────────────────────────────────

export interface OversightAlert {
  id: string;
  type: "violation" | "drift" | "unsafe_act";
  description: string;
  site: string;
  zone?: string;
  severity: "low" | "medium" | "high" | "critical";
  detected_at: string;
  resolved: boolean;
}

export interface WorkOversightData {
  active_alerts: number;
  violations_today: number;
  drift_events: number;
  unsafe_acts: number;
  alerts: OversightAlert[];
}

// ─── Leadership Intelligence ───────────────────────────────────────────────

export interface LeadershipMetric {
  dimension: string;
  score: number;
  benchmark: number;
  insights: string[];
}

export interface LeadershipIntelligenceData {
  engagement_score: number;
  safety_culture_score: number;
  communication_score: number;
  metrics: LeadershipMetric[];
  top_insights: string[];
}

// ─── Continuous Learning ───────────────────────────────────────────────────

export interface ModelStatus {
  model_name: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  last_trained: string;
  training_samples: number;
  status: "active" | "training" | "staged" | "deprecated";
}

export interface ContinuousLearningData {
  models: ModelStatus[];
  data_points_collected: number;
  improvements_this_month: number;
  next_training_at: string;
}

// ─── Storage Layer ─────────────────────────────────────────────────────────

export interface StorageMetrics {
  relational: { used_gb: number; total_gb: number; entities: { name: string; row_count: number }[]; status: "healthy" | "degraded" | "offline" };
  object: { used_gb: number; total_gb: number; file_count: number; status: "healthy" | "degraded" | "offline" };
  vector: { used_gb: number; total_gb: number; embedding_count: number; status: "healthy" | "degraded" | "offline" };
  search_index: { used_gb: number; total_gb: number; index_count: number; status: "healthy" | "degraded" | "offline" };
}

// ─── RTK Query Endpoints ───────────────────────────────────────────────────

export const aiIntelligenceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getComplianceBenchmarking: builder.query<ComplianceBenchmarkingData, void>({
      query: () => "/ai/compliance-benchmarking",
      providesTags: ["Analytics"],
    }),
    getRiskScoring: builder.query<RiskScoringData, void>({
      query: () => "/ai/risk-scoring",
      providesTags: ["Analytics"],
    }),
    getKPIIntelligence: builder.query<KPIIntelligenceData, void>({
      query: () => "/ai/kpi-intelligence",
      providesTags: ["Analytics"],
    }),
    getPIRS: builder.query<PIRSData, void>({
      query: () => "/ai/pirs",
      providesTags: ["Analytics"],
    }),
    getCorrectiveRecommendations: builder.query<CorrectiveRecommendationsData, void>({
      query: () => "/ai/recommendations",
      providesTags: ["Analytics"],
      transformResponse: (raw: AIRecommendation[] | CorrectiveRecommendationsData) => {
        if (Array.isArray(raw)) {
          return {
            total: raw.length,
            unactioned: raw.filter((r: any) => !r.actioned && !r.dismissed).length,
            recommendations: raw,
          };
        }
        return raw;
      },
    }),
    getWorkOversight: builder.query<WorkOversightData, void>({
      query: () => "/ai/work-oversight",
      providesTags: ["Analytics"],
      transformResponse: (raw: any): WorkOversightData => {
        const alerts: OversightAlert[] = Array.isArray(raw) ? raw : (raw?.alerts ?? []);
        const violations = alerts.filter((a) => a.type === "violation" && !a.resolved).length;
        const drift     = alerts.filter((a) => a.type === "drift"     && !a.resolved).length;
        const unsafe    = alerts.filter((a) => a.type === "unsafe_act"&& !a.resolved).length;
        return {
          active_alerts:    alerts.filter((a) => !a.resolved).length,
          violations_today: raw?.violations_today ?? violations,
          drift_events:     raw?.drift_events     ?? drift,
          unsafe_acts:      raw?.unsafe_acts      ?? unsafe,
          alerts,
        };
      },
    }),
    getLeadershipIntelligence: builder.query<LeadershipIntelligenceData, void>({
      query: () => "/ai/leadership-intelligence",
      providesTags: ["Analytics"],
    }),
    getContinuousLearning: builder.query<ContinuousLearningData, void>({
      query: () => "/ai/continuous-learning",
      providesTags: ["Analytics"],
    }),
    getStorageMetrics: builder.query<StorageMetrics, void>({
      query: () => "/admin/storage/metrics",
      providesTags: ["Analytics"],
    }),
    triggerModelRetraining: builder.mutation<{ message: string; job_id: string }, string>({
      query: (modelName) => ({ url: "/ai/models/retrain", method: "POST", body: { model_name: modelName } }),
    }),
    dismissRecommendation: builder.mutation<void, string>({
      query: (id) => ({ url: `/ai/recommendations/${id}/dismiss`, method: "POST" }),
      invalidatesTags: ["Analytics"],
    }),
    actOnRecommendation: builder.mutation<void, { id: string; notes?: string }>({
      query: ({ id, notes }) => ({ url: `/ai/recommendations/${id}/act`, method: "POST", body: { notes } }),
      invalidatesTags: ["Analytics"],
    }),

    // ── Azure AI Foundry endpoints ──────────────────────────────────────────
    aiChat: builder.mutation<AiChatResponse, { messages: ChatMessage[] }>({
      query: (body) => ({ url: "/ai/chat", method: "POST", body }),
    }),
    getAiStatus: builder.query<AiStatus, void>({
      query: () => "/ai/status",
      providesTags: ["Analytics"],
    }),
    getAiDashboard: builder.query<AiDashboard, void>({
      query: () => "/ai/dashboard",
      providesTags: ["Analytics"],
    }),
    getRiskPredictions: builder.query<AiRiskPredictions, void>({
      query: () => "/ai/risk-predictions",
      providesTags: ["Analytics"],
    }),
    getComplianceIntelligence: builder.query<AiComplianceIntelligence, void>({
      query: () => "/ai/compliance-intelligence",
      providesTags: ["Analytics"],
    }),
    getSafetyRecommendations: builder.query<AiSafetyRecommendations, void>({
      query: () => "/ai/safety-recommendations",
      providesTags: ["Analytics"],
    }),
    getTrendAnalysis: builder.query<AiTrendAnalysis, void>({
      query: () => "/ai/trend-analysis",
      providesTags: ["Analytics"],
    }),
    aiKnowledgeSearch: builder.mutation<AiKnowledgeSearchResponse, { query: string }>({
      query: (body) => ({ url: "/ai/knowledge/search", method: "POST", body }),
    }),
  }),
});

export const {
  useGetComplianceBenchmarkingQuery,
  useGetRiskScoringQuery,
  useGetKPIIntelligenceQuery,
  useGetPIRSQuery,
  useGetCorrectiveRecommendationsQuery,
  useGetWorkOversightQuery,
  useGetLeadershipIntelligenceQuery,
  useGetContinuousLearningQuery,
  useGetStorageMetricsQuery,
  useTriggerModelRetrainingMutation,
  useDismissRecommendationMutation,
  useActOnRecommendationMutation,
  useAiChatMutation,
  useGetAiStatusQuery,
  useGetAiDashboardQuery,
  useGetRiskPredictionsQuery,
  useGetComplianceIntelligenceQuery,
  useGetSafetyRecommendationsQuery,
  useGetTrendAnalysisQuery,
  useAiKnowledgeSearchMutation,
} = aiIntelligenceApi;
