import { baseApi } from "@/services/api/baseApi";
import type { Camera, RFIDReader, EdgeDevice } from "@/services/api";

export const camerasApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCameras: builder.query<Camera[], string | void>({
      query: (siteId) => `/cameras${siteId ? `?site_id=${siteId}` : ""}`,
      providesTags: ["Camera"],
    }),
    getRFIDReaders: builder.query<RFIDReader[], void>({
      query: () => "/rfid-readers",
      providesTags: ["RFIDReader"],
    }),
    getEdgeDevices: builder.query<EdgeDevice[], void>({
      query: () => "/edge-devices",
      providesTags: ["EdgeDevice"],
    }),
  }),
});

export const { useGetCamerasQuery, useGetRFIDReadersQuery, useGetEdgeDevicesQuery } = camerasApi;
