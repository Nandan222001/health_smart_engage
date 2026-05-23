import { baseApi } from "@/services/api/baseApi";

export interface Hazard {
  id: string;
  title: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "mitigated" | "closed";
  site_id?: string;
  zone_id?: string;
  reported_by: string;
  identified_at: string;
  description?: string;
  mitigation?: string;
}

export interface RiskAssessment {
  id: string;
  title: string;
  site_id?: string;
  department?: string;
  risk_level: "low" | "medium" | "high" | "critical";
  status: "draft" | "active" | "archived";
  assessor: string;
  created_at: string;
  reviewed_at?: string;
}

export const hazardsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listHazards: builder.query<Hazard[], Record<string, string> | void>({
      query: (params) => {
        const qs = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : "";
        return `/hazards${qs}`;
      },
      providesTags: ["Risk"],
    }),
    listRiskAssessments: builder.query<RiskAssessment[], void>({
      query: () => "/risks/assessments",
      providesTags: ["Risk"],
    }),
    createRiskAssessment: builder.mutation<RiskAssessment, Partial<RiskAssessment>>({
      query: (body) => ({ url: "/risks/assessments", method: "POST", body }),
      invalidatesTags: ["Risk"],
    }),
  }),
});

export const {
  useListHazardsQuery,
  useListRiskAssessmentsQuery,
  useCreateRiskAssessmentMutation,
} = hazardsApi;
