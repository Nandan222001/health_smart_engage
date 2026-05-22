import { baseApi } from "@/services/api/baseApi";
import type { NearMiss, NearMissFilters } from "@/services/api";

export const nearMissApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNearMiss: builder.query<NearMiss[], NearMissFilters | void>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
          });
        }
        const query = params.toString();
        return `/near-miss${query ? `?${query}` : ""}`;
      },
      providesTags: ["NearMiss"],
    }),
    getNearMissDetail: builder.query<NearMiss, string>({
      query: (id) => `/near-miss/${id}`,
      providesTags: ["NearMiss"],
    }),
  }),
});

export const { useGetNearMissQuery, useGetNearMissDetailQuery } = nearMissApi;
