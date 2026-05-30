import { baseApi } from "@/services/api/baseApi";

const cmd = (body: unknown) => ({ data: body });

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ActivityItem {
  id: string;
  type: "Incident" | "Permit" | "Audit" | "User" | "System";
  description: string;
  user: string;
  timestamp: string | null;
}

export interface OrgAdminActivities {
  items: ActivityItem[];
  total: number;
}

export interface EngagementAction {
  id: string;
  text: string;
  status: string;
}

export interface EngagementRecognition {
  name: string;
  type: "gold" | "silver" | "bronze";
}

export interface OrgAdminEngagement {
  reportingRate: number;
  surveyScore: number;
  surveyCompletionPct: number;
  observations: {
    safetyObservations: number;
    safetyWalks: number;
    toolboxAttendance: number;
    siteParticipation: number;
  };
  openActions: EngagementAction[];
  topRecognitions: EngagementRecognition[];
  employeeCount: number;
}

export interface KpiItem {
  id: string;
  label: string;
  value: number;
  target: number;
  trend: "up" | "down";
  status: "on_track" | "at_risk" | "breached";
}

export interface OrgAdminKpis {
  period: string;
  kpis: KpiItem[];
}

export interface OrgSetupProgress {
  currentStep: number;
  completedSteps: number[];
  activated: boolean;
}

export interface Step1Data {
  organizationName: string;
  industryType: string;
  employeeCount: number;
  numberOfSites: number;
  officialEmail: string;
  contactNumber: string;
  country: string;
  timezone: string;
  headquartersAddress: string;
  dataEntryOption: "manual" | "excel" | "api";
}

export interface Step2Data {
  applicableStandards: string[];
  regulatoryRegion: string;
  incidentSeverityMatrix: { level: string; description: string }[];
  auditFrequency: string;
  capaSlaCriticalDays: number;
  capaSlaStandardDays: number;
  permitTypes: string[];
}

export interface Site {
  id: string;
  name: string;
  type: string;
  address: string;
}

export interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

export interface Step5Data {
  workflows: {
    permitWorkflows: { enabled: boolean; config: string };
    incidentWorkflows: { enabled: boolean; config: string };
    auditWorkflows: { enabled: boolean; config: string };
    capaWorkflows: { enabled: boolean; config: string };
    escalationRules: { enabled: boolean; config: string };
    approvalLevels: { enabled: boolean; config: string };
  };
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  size: string;
}

export interface KnowledgeDocumentInput {
  name: string;
  type: string;
  size?: string;
  fileName?: string;
}

export interface DataImport {
  id: string;
  dataType: string;
  method: string;
  importedAt: string;
  records: number;
}

export interface Step7Data {
  aiFeatures: {
    aiAssistant: boolean;
    predictiveRiskEngine: boolean;
    complianceAI: boolean;
    aiRecommendations: boolean;
    benchmarkingEngine: boolean;
    fatigueAnalysis: boolean;
    trendAnalysis: boolean;
  };
}

export interface ActivateOrgData {
  confirmed: boolean;
}

export interface HrmsImportPayload {
  url: string;
  token?: string;
}

export interface OrgApiConnectPayload {
  url: string;
  api_key?: string;
  token?: string;
}

export interface OrgOverview {
  orgName: string;
  industry: string;
  country: string;
  timezone: string;
  headquartersAddress: string;
  officialEmail: string;
  contactNumber: string;
  plan: string;
  status: string;
  totalSites: number;
  activeEmployees: number;
  openIncidents: number;
  complianceScore: number;
  systemHealth: { database: string; aiEngine: string; lastSync: string };
}

export interface OrgDetailsFromExternal {
  organizationName?: string;
  industryType?: string;
  employeeCount?: string;
  numberOfSites?: string;
  officialEmail?: string;
  contactNumber?: string;
  country?: string;
  timezone?: string;
  headquartersAddress?: string;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const orgSetupApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Queries
    getOrgAdminOverview: builder.query<OrgOverview, void>({
      query: () => "/org-admin/overview",
      providesTags: ["OrgSetup"],
    }),
    getOrgAdminKpis: builder.query<OrgAdminKpis, void>({
      query: () => "/org-admin/kpis",
      providesTags: ["OrgSetup"],
    }),
    getOrgAdminEngagement: builder.query<OrgAdminEngagement, void>({
      query: () => "/org-admin/engagement",
      providesTags: ["OrgSetup"],
    }),
    getOrgAdminActivities: builder.query<ActivityItem[], void>({
      query: () => "/org-admin/activities",
      providesTags: ["Activity"],
    }),
    getOrgSetupProgress: builder.query<OrgSetupProgress, void>({
      query: () => "/org-setup/progress",
      providesTags: ["OrgSetup"],
    }),
    getOrgSetupStep1: builder.query<Partial<Step1Data>, void>({
      query: () => "/org-setup/step1",
      providesTags: ["OrgSetup"],
    }),
    getOrgSetupStep2: builder.query<Partial<Step2Data>, void>({
      query: () => "/org-setup/step2",
      providesTags: ["OrgSetup"],
    }),
    getOrgSetupStep3Sites: builder.query<Site[], void>({
      query: () => "/org-setup/step3/sites",
      providesTags: ["OrgSetup"],
      transformResponse: (raw: { items?: Site[] } | Site[]) =>
        Array.isArray(raw) ? raw : (raw?.items ?? []),
    }),
    getOrgSetupStep4Users: builder.query<OrgUser[], void>({
      query: () => "/org-setup/step4/users",
      providesTags: ["OrgSetup"],
      transformResponse: (raw: { items?: OrgUser[] } | OrgUser[]) =>
        Array.isArray(raw) ? raw : (raw?.items ?? []),
    }),
    getOrgSetupStep5: builder.query<Partial<Step5Data>, void>({
      query: () => "/org-setup/step5",
      providesTags: ["OrgSetup"],
    }),
    getOrgSetupStep6Documents: builder.query<KnowledgeDocument[], void>({
      query: () => "/org-setup/step6/documents",
      providesTags: ["OrgSetup"],
      transformResponse: (raw: { items?: KnowledgeDocument[] } | KnowledgeDocument[]) =>
        Array.isArray(raw) ? raw : (raw?.items ?? []),
    }),
    getOrgSetupStep6aImports: builder.query<DataImport[], void>({
      query: () => "/org-setup/step6a/imports",
      providesTags: ["OrgSetup"],
      transformResponse: (raw: { items?: DataImport[] } | DataImport[]) =>
        Array.isArray(raw) ? raw : (raw?.items ?? []),
    }),
    getOrgSetupStep7: builder.query<Partial<Step7Data>, void>({
      query: () => "/org-setup/step7",
      providesTags: ["OrgSetup"],
    }),

    // Mutations
    saveOrgSetupStep1: builder.mutation<void, Partial<Step1Data>>({
      query: (data) => ({ url: "/org-setup/step1", method: "POST", body: cmd(data) }),
      invalidatesTags: ["OrgSetup"],
    }),
    saveOrgSetupStep2: builder.mutation<void, Partial<Step2Data>>({
      query: (data) => ({ url: "/org-setup/step2", method: "POST", body: cmd(data) }),
      invalidatesTags: ["OrgSetup"],
    }),
    createOrgSetupSite: builder.mutation<Site, Omit<Site, "id">>({
      query: (data) => ({ url: "/org-setup/step3/site", method: "POST", body: cmd(data) }),
      invalidatesTags: ["OrgSetup"],
    }),
    bulkUploadOrgSetupSites: builder.mutation<void, FormData>({
      query: (data) => ({ url: "/org-setup/step3/bulk", method: "POST", body: data }),
      invalidatesTags: ["OrgSetup"],
    }),
    createOrgSetupUser: builder.mutation<OrgUser, Omit<OrgUser, "id">>({
      query: (data) => ({ url: "/org-setup/step4/user", method: "POST", body: cmd(data) }),
      invalidatesTags: ["OrgSetup"],
    }),
    bulkUploadOrgSetupUsers: builder.mutation<void, FormData>({
      query: (data) => ({ url: "/org-setup/step4/bulk", method: "POST", body: data }),
      invalidatesTags: ["OrgSetup"],
    }),
    saveOrgSetupStep5: builder.mutation<void, Partial<Step5Data>>({
      query: (data) => ({ url: "/org-setup/step5", method: "POST", body: cmd(data) }),
      invalidatesTags: ["OrgSetup"],
    }),
    uploadOrgSetupKnowledge: builder.mutation<KnowledgeDocument, KnowledgeDocumentInput>({
      query: (data) => ({ url: "/org-setup/step6/upload", method: "POST", body: cmd(data) }),
      invalidatesTags: ["OrgSetup"],
    }),
    importOrgSetupData: builder.mutation<DataImport, Record<string, unknown>>({
      query: (data) => ({ url: "/org-setup/step6a/import", method: "POST", body: cmd(data) }),
      invalidatesTags: ["OrgSetup"],
    }),
    bulkImportModule: builder.mutation<{ count: number; errors?: string[] }, { module: string; file: File }>({
      query: ({ module, file }) => {
        const fd = new FormData();
        fd.append("file", file);
        return { url: `/org-setup/onboarding-bulk?module=${encodeURIComponent(module)}`, method: "POST", body: fd };
      },
      invalidatesTags: ["OrgSetup"],
    }),
    saveOrgSetupStep7: builder.mutation<void, Partial<Step7Data>>({
      query: (data) => ({ url: "/org-setup/step7", method: "POST", body: cmd(data) }),
      invalidatesTags: ["OrgSetup"],
    }),
    activateOrganization: builder.mutation<{ success: boolean }, ActivateOrgData>({
      query: (data) => ({ url: "/org-setup/activate", method: "POST", body: cmd(data) }),
      invalidatesTags: ["OrgSetup"],
    }),
    hrmsImport: builder.mutation<{ count: number; error?: string }, HrmsImportPayload>({
      query: (data) => ({ url: "/org-setup/step4/hrms-import", method: "POST", body: data }),
      invalidatesTags: ["OrgSetup"],
    }),
    parseOrgExcel: builder.mutation<OrgDetailsFromExternal, FormData>({
      query: (data) => ({ url: "/org-setup/step1/parse-excel", method: "POST", body: data }),
    }),
    connectOrgApi: builder.mutation<OrgDetailsFromExternal, OrgApiConnectPayload>({
      query: (data) => ({ url: "/org-setup/step1/api-connect", method: "POST", body: data }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetOrgAdminOverviewQuery,
  useGetOrgAdminKpisQuery,
  useGetOrgAdminEngagementQuery,
  useGetOrgAdminActivitiesQuery,
  useGetOrgSetupProgressQuery,
  useGetOrgSetupStep1Query,
  useGetOrgSetupStep2Query,
  useGetOrgSetupStep3SitesQuery,
  useGetOrgSetupStep4UsersQuery,
  useGetOrgSetupStep5Query,
  useGetOrgSetupStep6DocumentsQuery,
  useGetOrgSetupStep6aImportsQuery,
  useGetOrgSetupStep7Query,
  useSaveOrgSetupStep1Mutation,
  useSaveOrgSetupStep2Mutation,
  useCreateOrgSetupSiteMutation,
  useBulkUploadOrgSetupSitesMutation,
  useCreateOrgSetupUserMutation,
  useBulkUploadOrgSetupUsersMutation,
  useSaveOrgSetupStep5Mutation,
  useUploadOrgSetupKnowledgeMutation,
  useImportOrgSetupDataMutation,
  useBulkImportModuleMutation,
  useSaveOrgSetupStep7Mutation,
  useActivateOrganizationMutation,
  useHrmsImportMutation,
  useParseOrgExcelMutation,
  useConnectOrgApiMutation,
} = orgSetupApi;
