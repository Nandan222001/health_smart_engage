import { baseApi } from "@/services/api/baseApi";

export interface SiteRecord {
  id: string;
  name: string;
  type: string;
  address?: string;
  status?: string;
}

export interface ZoneRecord {
  id: string;
  name: string;
  site_id?: string;
  type?: string;
  description?: string;
  status?: string;
}

export const sitesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listSites: builder.query<SiteRecord[], void>({
      query: () => "/sites",
      transformResponse: (raw: { items?: SiteRecord[] } | SiteRecord[]) =>
        Array.isArray(raw) ? raw : (raw?.items ?? []),
      providesTags: ["Site"],
    }),
    createSite: builder.mutation<SiteRecord, Partial<SiteRecord>>({
      query: (body) => ({ url: "/sites", method: "POST", body }),
      invalidatesTags: ["Site"],
    }),
    updateSite: builder.mutation<SiteRecord, { siteId: string; body: Partial<SiteRecord> }>({
      query: ({ siteId, body }) => ({ url: `/sites/${siteId}`, method: "PATCH", body }),
      invalidatesTags: ["Site"],
    }),
    deleteSite: builder.mutation<{ deleted: boolean }, string>({
      query: (siteId) => ({ url: `/sites/${siteId}`, method: "DELETE" }),
      invalidatesTags: ["Site"],
    }),
    listZones: builder.query<ZoneRecord[], string | void>({
      query: (siteId) => `/zones${siteId ? `?site_id=${siteId}` : ""}`,
      transformResponse: (raw: { items?: ZoneRecord[] } | ZoneRecord[]) =>
        Array.isArray(raw) ? raw : (raw?.items ?? []),
      providesTags: ["Zone"],
    }),
    createZone: builder.mutation<ZoneRecord, Partial<ZoneRecord>>({
      query: (body) => ({ url: "/zones", method: "POST", body }),
      invalidatesTags: ["Zone"],
    }),
    updateZone: builder.mutation<ZoneRecord, { zoneId: string; body: Partial<ZoneRecord> }>({
      query: ({ zoneId, body }) => ({ url: `/zones/${zoneId}`, method: "PATCH", body }),
      invalidatesTags: ["Zone"],
    }),
    deleteZone: builder.mutation<{ deleted: boolean }, string>({
      query: (zoneId) => ({ url: `/zones/${zoneId}`, method: "DELETE" }),
      invalidatesTags: ["Zone"],
    }),
  }),
});

export const {
  useListSitesQuery,
  useCreateSiteMutation,
  useUpdateSiteMutation,
  useDeleteSiteMutation,
  useListZonesQuery,
  useCreateZoneMutation,
  useUpdateZoneMutation,
  useDeleteZoneMutation,
} = sitesApi;
