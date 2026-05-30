import { baseApi } from "@/services/api/baseApi";

// ─── Import types ────────────────────────────────────────────────────────

export interface ImportRecord {
  id: string;
  file_name: string;
  import_type: "excel" | "csv";
  data_type: string;
  records_total: number;
  records_success: number;
  records_failed: number;
  status: "processing" | "success" | "failed" | "partial";
  uploaded_by: string;
  created_at: string;
  error_message?: string;
}

export interface ValidationLog {
  id: string;
  import_id?: string;
  file_name: string;
  rule: string;
  status: "pass" | "fail" | "warning";
  records_affected: number;
  message?: string;
  timestamp: string;
}

export interface ApiIntegration {
  id: string;
  name: string;
  type: string;
  endpoint_url: string;
  auth_type: string;
  is_active: boolean;
  last_sync?: string;
  sync_frequency?: string;
  records_synced?: number;
  description?: string;
  created_at?: string;
}

export interface SyncStatusEntry {
  id?: string;
  name: string;
  integration_type?: string;
  last_sync: string;
  status: "active" | "syncing" | "warning" | "error" | "paused";
  records_synced: number;
  error_message?: string;
  next_sync?: string;
}

export interface SyncStatusData {
  integrations: SyncStatusEntry[];
}

// ─── RTK Query endpoints ──────────────────────────────────────────────────

export const dataManagementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listImports: builder.query<ImportRecord[], void>({
      query: () => "/org-admin/data-management/imports",
      providesTags: ["Import"],
      transformResponse: (raw: { items?: ImportRecord[] } | ImportRecord[]) =>
        Array.isArray(raw) ? raw : (raw?.items ?? []),
    }),

    createImport: builder.mutation<{ status: string; id: string; message: string }, {
      file_name: string;
      import_type: "excel" | "csv";
      data_type: string;
      records_estimated?: number;
    }>({
      query: (body) => ({ url: "/org-admin/data-management/import", method: "POST", body }),
      invalidatesTags: ["Import"],
    }),

    listValidationLogs: builder.query<ValidationLog[], void>({
      query: () => "/org-admin/data-management/validation-logs",
      providesTags: ["Import"],
      transformResponse: (raw: { items?: ValidationLog[] } | ValidationLog[]) =>
        Array.isArray(raw) ? raw : (raw?.items ?? []),
    }),

    getSyncStatus: builder.query<SyncStatusData, void>({
      query: () => "/org-admin/data-management/sync-status",
      providesTags: ["ApiIntegration"],
    }),

    triggerSync: builder.mutation<{ status: string; integration: string }, { integration?: string }>({
      query: (body) => ({ url: "/org-admin/data-management/sync", method: "POST", body }),
      invalidatesTags: ["ApiIntegration"],
    }),

    listApiIntegrations: builder.query<ApiIntegration[], void>({
      query: () => "/org-admin/data-management/api-integrations",
      providesTags: ["ApiIntegration"],
      transformResponse: (raw: { items?: (Omit<ApiIntegration, "type"> & { integration_type?: string })[] } | ApiIntegration[]) => {
        const arr = Array.isArray(raw) ? raw : (raw?.items ?? []);
        return arr.map((item) => ({
          ...item,
          type: (item as { integration_type?: string; type?: string }).integration_type ?? (item as { type?: string }).type ?? "",
        })) as ApiIntegration[];
      },
    }),

    createApiIntegration: builder.mutation<{ status: string; id: string }, {
      name: string;
      type: string;
      endpoint_url: string;
      auth_type: string;
      is_active?: boolean;
      sync_frequency?: string;
      description?: string;
    }>({
      query: (body) => ({ url: "/org-admin/data-management/api-integrations", method: "POST", body }),
      invalidatesTags: ["ApiIntegration"],
    }),

    updateApiIntegration: builder.mutation<{ status: string; id: string }, {
      integrationId: string;
      name?: string;
      type?: string;
      endpoint_url?: string;
      auth_type?: string;
      is_active?: boolean;
      sync_frequency?: string;
      description?: string;
    }>({
      query: ({ integrationId, ...body }) => ({
        url: `/org-admin/data-management/api-integrations/${integrationId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["ApiIntegration"],
    }),

    deleteApiIntegration: builder.mutation<{ status: string; id: string }, string>({
      query: (id) => ({
        url: `/org-admin/data-management/api-integrations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ApiIntegration"],
    }),
  }),
});

export const {
  useListImportsQuery,
  useCreateImportMutation,
  useListValidationLogsQuery,
  useGetSyncStatusQuery,
  useTriggerSyncMutation,
  useListApiIntegrationsQuery,
  useCreateApiIntegrationMutation,
  useUpdateApiIntegrationMutation,
  useDeleteApiIntegrationMutation,
} = dataManagementApi;
