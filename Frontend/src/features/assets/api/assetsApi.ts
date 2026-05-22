import { baseApi } from "@/services/api/baseApi";
import type { EquipmentCertification, EquipmentCertFilters } from "@/services/api";

export const assetsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEquipmentCertifications: builder.query<EquipmentCertification[], EquipmentCertFilters | void>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
          });
        }
        const query = params.toString();
        return `/equipment-certification${query ? `?${query}` : ""}`;
      },
      providesTags: ["EquipmentCert"],
    }),
  }),
});

export const { useGetEquipmentCertificationsQuery } = assetsApi;
