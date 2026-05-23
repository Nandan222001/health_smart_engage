import { baseApi } from "@/services/api/baseApi";

export interface Permit {
  id: string;
  title: string;
  type: string;
  status: "draft" | "submitted" | "approved" | "rejected" | "active" | "closed";
  site_id?: string;
  zone_id?: string;
  requested_by: string;
  approved_by?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export const permitsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listPermits: builder.query<Permit[], Record<string, string> | void>({
      query: (params) => {
        const qs = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : "";
        return `/permits${qs}`;
      },
      providesTags: ["Permit"],
    }),
    createPermit: builder.mutation<Permit, Partial<Permit>>({
      query: (body) => ({ url: "/permits", method: "POST", body }),
      invalidatesTags: ["Permit"],
    }),
    getPermit: builder.query<Permit, string>({
      query: (permitId) => `/permits/${permitId}`,
      providesTags: ["Permit"],
    }),
    updatePermit: builder.mutation<Permit, { permitId: string; body: Partial<Permit> }>({
      query: ({ permitId, body }) => ({ url: `/permits/${permitId}`, method: "PATCH", body }),
      invalidatesTags: ["Permit"],
    }),
    submitPermit: builder.mutation<{ message: string }, string>({
      query: (permitId) => ({ url: `/permits/${permitId}/submit`, method: "POST" }),
      invalidatesTags: ["Permit"],
    }),
    approvePermit: builder.mutation<{ message: string }, { permitId: string; notes?: string }>({
      query: ({ permitId, notes }) => ({ url: `/permits/${permitId}/approve`, method: "POST", body: { notes } }),
      invalidatesTags: ["Permit"],
    }),
    rejectPermit: builder.mutation<{ message: string }, { permitId: string; reason: string }>({
      query: ({ permitId, reason }) => ({ url: `/permits/${permitId}/reject`, method: "POST", body: { reason } }),
      invalidatesTags: ["Permit"],
    }),
    closePermit: builder.mutation<{ message: string }, string>({
      query: (permitId) => ({ url: `/permits/${permitId}/close`, method: "POST" }),
      invalidatesTags: ["Permit"],
    }),
    extendPermit: builder.mutation<Permit, { permitId: string; new_end_date: string; reason?: string }>({
      query: ({ permitId, ...body }) => ({ url: `/permits/${permitId}/extend`, method: "POST", body }),
      invalidatesTags: ["Permit"],
    }),
    getPermitConflicts: builder.query<unknown[], string>({
      query: (permitId) => `/permits/${permitId}/conflicts`,
    }),
    getPermitAuditTrail: builder.query<unknown[], string>({
      query: (permitId) => `/permits/${permitId}/audit-trail`,
    }),
  }),
});

export const {
  useListPermitsQuery,
  useCreatePermitMutation,
  useGetPermitQuery,
  useUpdatePermitMutation,
  useSubmitPermitMutation,
  useApprovePermitMutation,
  useRejectPermitMutation,
  useClosePermitMutation,
  useExtendPermitMutation,
  useGetPermitConflictsQuery,
  useGetPermitAuditTrailQuery,
} = permitsApi;
