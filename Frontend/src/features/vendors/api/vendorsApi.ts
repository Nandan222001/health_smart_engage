import { baseApi } from "@/services/api/baseApi";
import type { Contractor } from "@/services/api";

export const vendorsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getContractors: builder.query<Contractor[], void>({
      query: () => "/contractors",
      providesTags: ["Contractor"],
    }),
  }),
});

export const { useGetContractorsQuery } = vendorsApi;
