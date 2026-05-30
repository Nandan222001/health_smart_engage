import { baseApi } from "@/services/api/baseApi";
import type { User, Worker } from "@/services/api";

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => "/users",
      providesTags: ["User"],
    }),
    getWorkers: builder.query<Worker[], string | void>({
      query: (contractor) => `/workers${contractor ? `?contractor=${contractor}` : ""}`,
      providesTags: ["Worker"],
    }),
  }),
});

export const { useGetUsersQuery, useGetWorkersQuery } = usersApi;
