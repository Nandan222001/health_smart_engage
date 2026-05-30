import { baseApi } from "@/services/api/baseApi";
import type { RootCauseAnalysis, RCAFilters } from "@/services/api";

export const riskApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRootCauseAnalysis: builder.query<RootCauseAnalysis[], RCAFilters | void>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
          });
        }
        const query = params.toString();
        return `/root-cause-analysis${query ? `?${query}` : ""}`;
      },
      providesTags: ["RCA"],
    }),
  }),
});

export const { useGetRootCauseAnalysisQuery } = riskApi;
