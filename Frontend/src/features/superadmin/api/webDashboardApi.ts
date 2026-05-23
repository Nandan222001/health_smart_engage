import { baseApi } from "@/services/api/baseApi";

type DashboardData = Record<string, unknown>;

export const webDashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExecutiveSafetyDashboard: builder.query<DashboardData, void>({
      query: () => "/dashboards/executive-safety",
      providesTags: ["Dashboard"],
    }),
    getSiteCommandDashboard: builder.query<DashboardData, void>({
      query: () => "/dashboards/site-command",
      providesTags: ["Dashboard"],
    }),
    getMyTasksDashboard: builder.query<DashboardData, void>({
      query: () => "/dashboards/my-tasks",
      providesTags: ["Dashboard"],
    }),
    getTrainingComplianceDashboard: builder.query<DashboardData, void>({
      query: () => "/dashboards/training-compliance",
      providesTags: ["Dashboard"],
    }),
    getVendorComplianceDashboard: builder.query<DashboardData, void>({
      query: () => "/dashboards/vendor-compliance",
      providesTags: ["Dashboard"],
    }),
    getAssetComplianceDashboard: builder.query<DashboardData, void>({
      query: () => "/dashboards/asset-compliance",
      providesTags: ["Dashboard"],
    }),
    getAuditCapaDashboard: builder.query<DashboardData, void>({
      query: () => "/dashboards/audit-capa",
      providesTags: ["Dashboard"],
    }),
    getRiskRegisterDashboard: builder.query<DashboardData, void>({
      query: () => "/dashboards/risk-register",
      providesTags: ["Dashboard"],
    }),
    getPermitLiveBoardDashboard: builder.query<DashboardData, void>({
      query: () => "/dashboards/permit-live-board",
      providesTags: ["Dashboard"],
    }),
    getIncidentAnalyticsDashboard: builder.query<DashboardData, void>({
      query: () => "/dashboards/incident-analytics",
      providesTags: ["Dashboard"],
    }),
    getKnowledgeUsageDashboard: builder.query<DashboardData, void>({
      query: () => "/dashboards/knowledge-usage",
      providesTags: ["Dashboard"],
    }),
    getAiIntelligenceDashboard: builder.query<DashboardData, void>({
      query: () => "/dashboards/ai-intelligence",
      providesTags: ["Dashboard"],
    }),
    getDataQualityDashboard: builder.query<DashboardData, void>({
      query: () => "/dashboards/data-quality",
      providesTags: ["Dashboard"],
    }),
  }),
});

export const {
  useGetExecutiveSafetyDashboardQuery,
  useGetSiteCommandDashboardQuery,
  useGetMyTasksDashboardQuery,
  useGetTrainingComplianceDashboardQuery,
  useGetVendorComplianceDashboardQuery,
  useGetAssetComplianceDashboardQuery,
  useGetAuditCapaDashboardQuery,
  useGetRiskRegisterDashboardQuery,
  useGetPermitLiveBoardDashboardQuery,
  useGetIncidentAnalyticsDashboardQuery,
  useGetKnowledgeUsageDashboardQuery,
  useGetAiIntelligenceDashboardQuery,
  useGetDataQualityDashboardQuery,
} = webDashboardApi;
