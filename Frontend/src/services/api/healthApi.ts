import { baseApi } from "./baseApi";

export const healthApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    healthCheck: builder.query<{ status: string; timestamp: string }, void>({
      query: () => "/health",
    }),
  }),
});

export const { useHealthCheckQuery } = healthApi;
