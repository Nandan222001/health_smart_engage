import { baseApi } from "@/services/api/baseApi";

interface AuthLoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    roles: string[];
    permissions: string[];
    tenant_id?: string;
  };
}

interface AuthMeResponse {
  user_id: string;
  email: string;
  roles: string[];
  permissions: string[];
  tenant_id?: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    backendLogin: builder.mutation<AuthLoginResponse, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    backendLogout: builder.mutation<{ message: string }, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
    }),
    refreshToken: builder.mutation<AuthLoginResponse, { refresh_token: string }>({
      query: (body) => ({ url: "/auth/refresh", method: "POST", body }),
    }),
    getAuthMe: builder.query<AuthMeResponse, void>({
      query: () => "/auth/me",
    }),
  }),
});

export const {
  useBackendLoginMutation,
  useBackendLogoutMutation,
  useRefreshTokenMutation,
  useGetAuthMeQuery,
} = authApi;
