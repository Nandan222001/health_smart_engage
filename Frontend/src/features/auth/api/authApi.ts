import { baseApi } from "@/services/api/baseApi";

export interface AuthLoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  is_superadmin: boolean;
  user: {
    id: string;
    email: string;
    display_name: string;
    roles: string[];
    permissions: string[];
    tenant_id?: string;
    is_superadmin: boolean;
  };
}

export interface AuthMeResponse {
  id: string;
  email: string;
  display_name: string;
  roles: string[];
  permissions: string[];
  tenant_id?: string;
  is_superadmin: boolean;
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
