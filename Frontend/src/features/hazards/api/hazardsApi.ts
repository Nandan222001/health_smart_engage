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

export interface HazardCreatePayload {
  title: string;
  type: string;
  severity: string;
  description?: string;
  location_id?: string;
  site_id?: string;
  zone_id?: string;
  mitigation?: string;
}

export interface RiskAssessmentCreatePayload {
  title: string;
  hazard_description: string;
  likelihood: number; // 1-5
  consequence: number; // 1-5
  location_id?: string;
  department?: string;
}

export interface NearMiss {
  id: string;
  ref: string;
  title: string;
  description?: string;
  severity: string;
  status: string;
  incident_type?: string;
  created_at?: string;
}

export interface RiskMatrixData {
  matrix_counts: Record<string, number>;
  total_assessments: number;
  by_level: { critical: number; high: number; medium: number; low: number };
  assessments: Array<{ id: string; title: string; likelihood: number; consequence: number; risk_score: number; status: string }>;
}

export interface HighRiskArea {
  id: string;
  title: string;
  risk_score: number;
  likelihood: number;
  consequence: number;
  location_id?: string;
  status: string;
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
    createHazard: builder.mutation<Hazard, HazardCreatePayload>({
      query: (body) => ({ url: "/hazards", method: "POST", body }),
      invalidatesTags: ["Risk"],
    }),
    updateHazard: builder.mutation<Hazard, { id: string; data: Partial<Hazard> }>({
      query: ({ id, data }) => ({ url: `/hazards/${id}`, method: "PATCH", body: data }),
      invalidatesTags: ["Risk"],
    }),
    listRiskAssessments: builder.query<RiskAssessment[], void>({
      query: () => "/risks/assessments",
      providesTags: ["Risk"],
    }),
    createRiskAssessment: builder.mutation<RiskAssessment, Partial<RiskAssessment>>({
      query: (body) => ({ url: "/risks/assessments", method: "POST", body }),
      invalidatesTags: ["Risk"],
    }),
    listNearMiss: builder.query<{ items: NearMiss[]; total: number }, void>({
      query: () => "/near-miss",
      providesTags: ["Risk"],
    }),
    createNearMiss: builder.mutation<NearMiss, { title: string; description: string; severity: string }>({
      query: (body) => ({ url: "/near-miss", method: "POST", body }),
      invalidatesTags: ["Risk"],
    }),
    getRiskMatrix: builder.query<RiskMatrixData, void>({
      query: () => "/risks/matrix",
      providesTags: ["Risk"],
    }),
    getHighRiskAreas: builder.query<{ items: HighRiskArea[]; total: number }, void>({
      query: () => "/risks/high-risk-areas",
      providesTags: ["Risk"],
    }),
    closeRiskAssessment: builder.mutation<{ id: string; status: string }, string>({
      query: (id) => ({ url: `/risks/assessments/${id}/close`, method: "POST" }),
      invalidatesTags: ["Risk"],
    }),
  }),
});

export const {
  useListHazardsQuery,
  useCreateHazardMutation,
  useUpdateHazardMutation,
  useListRiskAssessmentsQuery,
  useCreateRiskAssessmentMutation,
  useListNearMissQuery,
  useCreateNearMissMutation,
  useGetRiskMatrixQuery,
  useGetHighRiskAreasQuery,
  useCloseRiskAssessmentMutation,
} = hazardsApi;
