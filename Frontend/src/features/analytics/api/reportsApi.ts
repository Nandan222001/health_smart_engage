import { baseApi } from "@/services/api/baseApi";

// ─── Types ────────────────────────────────────────────────────────────────

export type ReportType = "kpi" | "incident" | "audit" | "compliance" | "risk" | "workforce" | "management";
export type ReportFormat = "pdf" | "excel" | "csv";
export type ReportStatus = "ready" | "generating" | "failed";

export interface GeneratedReport {
  id: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  period_start: string;
  period_end: string;
  status: ReportStatus;
  size?: string;
  created_at: string;
  created_by: string;
}

export interface ReportStats {
  kpi: {
    total_incidents: number;
    trir: number;
    near_misses: number;
    open_actions: number;
    safety_score: number;
  };
  incident: {
    total: number;
    open: number;
    resolved: number;
    near_misses: number;
    with_rca: number;
  };
  audit: {
    total_records: number;
    open_actions: number;
    compliance_items: number;
    records_with_findings: number;
  };
  compliance: {
    score: number;
    standards_tracked: number;
    open_gaps: number;
    overdue: number;
  };
  risk: {
    total: number;
    high_risk: number;
    medium_risk: number;
    controls_reviewed: number;
  };
  workforce: {
    total_employees: number;
    active_workers: number;
    incident_rate: number;
    near_misses_reported: number;
  };
  management: {
    safety_score: number;
    incidents_ytd: number;
    compliance_avg: number;
    open_capas: number;
  };
}

// ─── RTK Query endpoints ──────────────────────────────────────────────────

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listReports: builder.query<GeneratedReport[], void>({
      query: () => "/org-admin/reports",
      providesTags: ["Report"],
    }),

    getReportStats: builder.query<ReportStats, void>({
      query: () => "/org-admin/reports/stats",
      providesTags: ["Report"],
    }),

    generateReport: builder.mutation<{ status: string; id: string; message: string }, {
      type: ReportType;
      format: ReportFormat;
      name?: string;
      period_start?: string;
      period_end?: string;
    }>({
      query: (body) => ({ url: "/org-admin/reports/generate", method: "POST", body }),
      invalidatesTags: ["Report"],
    }),

    deleteReport: builder.mutation<{ status: string; id: string }, string>({
      query: (reportId) => ({ url: `/org-admin/reports/${reportId}`, method: "DELETE" }),
      invalidatesTags: ["Report"],
    }),
  }),
});

export const {
  useListReportsQuery,
  useGetReportStatsQuery,
  useGenerateReportMutation,
  useDeleteReportMutation,
} = reportsApi;
