import { baseApi } from "@/services/api/baseApi";

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardKPI {
  label: string;
  value: number | string;
  unit?: string;
  trend: number;
  trend_dir: "up" | "down" | "flat";
  status: "good" | "warning" | "critical";
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: "kpi" | "bar" | "line" | "donut" | "table";
  data: Record<string, unknown>;
}

export interface OperationalDashboard {
  refreshed_at: string;
  kpis: DashboardKPI[];
  widgets: DashboardWidget[];
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export type ReportType = "compliance" | "audit" | "incident" | "capa" | "kpi" | "risk" | "training";
export type ReportStatus = "ready" | "generating" | "failed" | "scheduled";
export type ReportFormat = "pdf" | "excel" | "csv";

export interface Report {
  id: string;
  title: string;
  type: ReportType;
  status: ReportStatus;
  format: ReportFormat;
  size_kb?: number;
  generated_at?: string;
  scheduled_for?: string;
  generated_by: string;
  period: string;
  download_url?: string;
}

export interface GenerateReportPayload {
  type: ReportType;
  format: ReportFormat;
  period_start: string;
  period_end: string;
  filters?: Record<string, string>;
}

// ─── AI Insights ──────────────────────────────────────────────────────────────

export type InsightSeverity = "info" | "warning" | "critical";
export type InsightCategory = "risk" | "compliance" | "trend" | "anomaly" | "recommendation";

export interface AIInsight {
  id: string;
  title: string;
  summary: string;
  category: InsightCategory;
  severity: InsightSeverity;
  confidence: number;
  affected_areas: string[];
  generated_at: string;
  actioned: boolean;
  trend_data?: number[];
}

export interface InsightsSummary {
  total: number;
  critical: number;
  warnings: number;
  actioned_today: number;
  insights: AIInsight[];
}

// ─── Mobile Alerts ────────────────────────────────────────────────────────────

export type AlertChannel = "push" | "sms" | "email" | "in_app";
export type AlertPriority = "low" | "medium" | "high" | "critical";

export interface MobileAlert {
  id: string;
  title: string;
  body: string;
  priority: AlertPriority;
  channels: AlertChannel[];
  recipients: string[];
  sent_at: string;
  read_count: number;
  total_recipients: number;
  linked_case_id?: string;
  linked_case_type?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  trigger: string;
  channels: AlertChannel[];
  priority: AlertPriority;
  enabled: boolean;
  recipients: string[];
}

export interface AlertsDashboard {
  sent_today: number;
  pending: number;
  failed: number;
  critical_unread: number;
  recent_alerts: MobileAlert[];
  rules: AlertRule[];
}

// ─── Export & Share ───────────────────────────────────────────────────────────

export type ExportFormat = "pdf" | "excel" | "csv" | "json" | "api";
export type IntegrationStatus = "connected" | "disconnected" | "error";

export interface ExportJob {
  id: string;
  name: string;
  format: ExportFormat;
  module: string;
  created_at: string;
  size_kb: number;
  status: "done" | "processing" | "failed";
  download_url?: string;
}

export interface Integration {
  id: string;
  name: string;
  type: "erp" | "hrms" | "bi" | "webhook" | "api";
  status: IntegrationStatus;
  last_sync?: string;
  records_synced?: number;
}

export interface ExportShareData {
  recent_exports: ExportJob[];
  integrations: Integration[];
}

// ─── RTK Query ────────────────────────────────────────────────────────────────

export const outputsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOperationalDashboard: builder.query<OperationalDashboard, void>({
      query: () => "/outputs/dashboard",
      providesTags: ["Workflow"],
    }),
    listReports: builder.query<Report[], { type?: ReportType } | void>({
      query: (params) => {
        const qs = params && (params as { type?: ReportType }).type
          ? `?type=${(params as { type?: ReportType }).type}`
          : "";
        return `/outputs/reports${qs}`;
      },
      providesTags: ["Workflow"],
    }),
    generateReport: builder.mutation<Report, GenerateReportPayload>({
      query: (body) => ({ url: "/outputs/reports/generate", method: "POST", body }),
      invalidatesTags: ["Workflow"],
    }),
    downloadReport: builder.query<Blob, string>({
      query: (id) => ({ url: `/outputs/reports/${id}/download`, responseHandler: (r) => r.blob() }),
    }),
    getAIInsights: builder.query<InsightsSummary, void>({
      query: () => "/outputs/insights",
      providesTags: ["Workflow"],
    }),
    actionInsight: builder.mutation<void, string>({
      query: (id) => ({ url: `/outputs/insights/${id}/action`, method: "POST" }),
      invalidatesTags: ["Workflow"],
    }),
    getAlertsDashboard: builder.query<AlertsDashboard, void>({
      query: () => "/outputs/alerts",
      providesTags: ["Workflow"],
    }),
    updateAlertRule: builder.mutation<AlertRule, { id: string; enabled: boolean }>({
      query: ({ id, ...body }) => ({ url: `/outputs/alerts/rules/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Workflow"],
    }),
    getExportShareData: builder.query<ExportShareData, void>({
      query: () => "/outputs/exports",
      providesTags: ["Workflow"],
    }),
    createExportJob: builder.mutation<ExportJob, { format: ExportFormat; module: string; filters?: Record<string, string> }>({
      query: (body) => ({ url: "/outputs/exports", method: "POST", body }),
      invalidatesTags: ["Workflow"],
    }),
  }),
});

export const {
  useGetOperationalDashboardQuery,
  useListReportsQuery,
  useGenerateReportMutation,
  useGetAIInsightsQuery,
  useActionInsightMutation,
  useGetAlertsDashboardQuery,
  useUpdateAlertRuleMutation,
  useGetExportShareDataQuery,
  useCreateExportJobMutation,
} = outputsApi;
