import { baseApi } from "@/services/api/baseApi";
import type { Site, Zone, Shift } from "@/services/api";

export const sitesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSites: builder.query<Site[], void>({
      query: () => "/sites",
      providesTags: ["Site"],
    }),
    getZones: builder.query<Zone[], string | void>({
      query: (siteId) => `/zones${siteId ? `?site_id=${siteId}` : ""}`,
      providesTags: ["Zone"],
    }),
    getShifts: builder.query<Shift[], void>({
      query: () => "/shifts",
      providesTags: ["Shift"],
    }),
  }),
});

export const { useGetSitesQuery, useGetZonesQuery, useGetShiftsQuery } = sitesApi;
