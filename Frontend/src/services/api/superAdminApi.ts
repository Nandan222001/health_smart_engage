import { baseApi } from "./baseApi";

export interface Tenant {
  id: string;
  name: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  // extra fields stored in generic_records payload
  industry?: string;
  country?: string;
  plan?: string;
  phone?: string;
  email?: string;
  sites?: number;
  timezone?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  status: string;
  tenant_id?: string;
  organisation_node_id?: string;
  created_at?: string;
}

export interface AuditLog {
  id: string;
  actor_user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  created_at: string;
  tenant_id: string;
}

export interface CreateTenantPayload {
  name: string;
  status: string;
  industry?: string;
  country?: string;
  timezone?: string;
  email?: string;
  phone?: string;
  sites?: number;
  plan?: string;
}

export interface CreateUserPayload {
  email: string;
  display_name: string;
  phone?: string;
  organisation_node_id?: string;
  role?: string;
  status?: string;
  password?: string;
  tenant_id?: string;
}

export const superAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listTenants: build.query<{ items: Tenant[] }, void>({
      query: () => "/v1/admin/tenants",
      providesTags: ["User"],
    }),

    createTenant: build.mutation<{ id: string; recordId: string; status: string }, CreateTenantPayload>({
      query: (payload) => ({
        url: "/v1/admin/tenants",
        method: "POST",
        body: { data: payload },
      }),
      invalidatesTags: ["User"],
    }),

    updateTenant: build.mutation<{ id: string }, { tenantId: string; data: Partial<CreateTenantPayload> }>({
      query: ({ tenantId, data }) => ({
        url: `/v1/admin/tenants/${tenantId}`,
        method: "PATCH",
        body: { data },
      }),
      invalidatesTags: ["User"],
    }),

    listUsers: build.query<{ items: AdminUser[] }, void>({
      query: () => "/v1/admin/users",
      providesTags: ["User"],
    }),

    inviteUser: build.mutation<{ id: string; status: string }, CreateUserPayload>({
      query: (payload) => ({
        url: "/v1/admin/users/invitations",
        method: "POST",
        body: { data: payload },
      }),
      invalidatesTags: ["User"],
    }),

    listAuditLogs: build.query<{ items: AuditLog[] }, void>({
      query: () => "/v1/admin/audit-logs",
    }),
  }),
  overrideExisting: false,
});

export const {
  useListTenantsQuery,
  useCreateTenantMutation,
  useUpdateTenantMutation,
  useListUsersQuery,
  useInviteUserMutation,
  useListAuditLogsQuery,
} = superAdminApi;
