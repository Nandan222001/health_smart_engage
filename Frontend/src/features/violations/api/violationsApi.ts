import { baseApi } from "@/services/api/baseApi";
import type { Violation, ViolationFilters } from "@/services/api";

export const violationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getViolations: builder.query<Violation[], ViolationFilters | void>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
          });
        }
        const query = params.toString();
        return `/violations${query ? `?${query}` : ""}`;
      },
      providesTags: ["Violation"],
    }),
    getViolationDetail: builder.query<Violation, string>({
      query: (id) => `/violations/${id}`,
      providesTags: ["Violation"],
    }),
  }),
});

export const { useGetViolationsQuery, useGetViolationDetailQuery } = violationsApi;
