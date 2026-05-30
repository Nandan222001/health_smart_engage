import { baseApi } from "@/services/api/baseApi";
import type { PPEComplianceData, ZoneRiskData } from "@/services/api";

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPPECompliance: builder.query<PPEComplianceData[], void>({
      query: () => "/analytics/ppe-compliance",
      providesTags: ["Analytics"],
    }),
    getZoneRisk: builder.query<ZoneRiskData[], void>({
      query: () => "/analytics/zone-risk",
      providesTags: ["Analytics"],
    }),
  }),
});

export const { useGetPPEComplianceQuery, useGetZoneRiskQuery } = analyticsApi;
