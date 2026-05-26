import { baseApi } from "@/services/api/baseApi";

const cmd = (body: unknown) => ({ data: body });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Asset {
  id: string;
  asset_code: string;
  name: string | null;
  description: string | null;
  category: string;
  location_id: string | null;
  location: string | null;
  criticality: string;
  manufacturer: string | null;
  serial_number: string | null;
  compliance_status: string;
  status: string;
  risk_score: number | null;
  purchase_date: string | null;
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface AssetCategory {
  category: string;
  total: number;
  active: number;
  maintenance: number;
  retired: number;
  high_criticality: number;
}

export interface AssetMaintenanceLog {
  id: string;
  asset_id: string;
  asset_name: string;
  asset_code: string;
  category: string;
  work_type: string;
  description: string | null;
  performed_by: string | null;
  performed_on: string | null;
  cost: number | null;
  status: string;
  notes: string | null;
}

export interface AssetInspectionRecord {
  id: string;
  asset_id: string;
  asset_name: string;
  asset_code: string;
  category: string;
  inspection_type: string;
  inspected_on: string | null;
  inspector_user_id: string;
  result: string;
  notes: string | null;
}

export interface AssetRiskItem {
  id: string;
  asset_code: string;
  name: string;
  category: string;
  location: string | null;
  criticality: string;
  status: string;
  compliance_status: string;
  risk_score: number;
  risk_level: string;
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
}

export interface CreateAssetInput {
  asset_code: string;
  name?: string;
  description?: string;
  category: string;
  location?: string;
  criticality?: string;
  manufacturer?: string;
  serial_number?: string;
  status?: string;
  risk_score?: number;
  purchase_date?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
}

export interface CreateMaintenanceLogInput {
  work_type: string;
  description?: string;
  performed_by?: string;
  performed_on?: string;
  cost?: number;
  status?: string;
  notes?: string;
}

export interface CreateInspectionInput {
  inspection_type: string;
  inspected_on?: string;
  result: string;
  notes?: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const assetsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAssets: builder.query<Asset[], void>({
      query: () => "/assets",
      providesTags: ["Asset"],
    }),
    createAsset: builder.mutation<{ id: string; status: string }, CreateAssetInput>({
      query: (data) => ({ url: "/assets", method: "POST", body: cmd(data) }),
      invalidatesTags: ["Asset"],
    }),
    updateAsset: builder.mutation<{ id: string; status: string }, { id: string; data: Partial<CreateAssetInput> }>({
      query: ({ id, data }) => ({ url: `/assets/${id}`, method: "PATCH", body: cmd(data) }),
      invalidatesTags: ["Asset"],
    }),
    getAssetCategories: builder.query<AssetCategory[], void>({
      query: () => "/asset-categories",
      providesTags: ["Asset"],
    }),
    getMaintenanceLogs: builder.query<AssetMaintenanceLog[], void>({
      query: () => "/asset-maintenance-logs",
      providesTags: ["Asset"],
    }),
    createMaintenanceLog: builder.mutation<{ id: string; status: string }, { assetId: string; data: CreateMaintenanceLogInput }>({
      query: ({ assetId, data }) => ({
        url: `/assets/${assetId}/maintenance-logs`,
        method: "POST",
        body: cmd(data),
      }),
      invalidatesTags: ["Asset"],
    }),
    getAllInspections: builder.query<AssetInspectionRecord[], void>({
      query: () => "/asset-inspections",
      providesTags: ["Asset"],
    }),
    createInspection: builder.mutation<{ id: string }, { assetId: string; data: CreateInspectionInput }>({
      query: ({ assetId, data }) => ({
        url: `/assets/${assetId}/inspections`,
        method: "POST",
        body: cmd(data),
      }),
      invalidatesTags: ["Asset"],
    }),
    getAssetRiskMapping: builder.query<AssetRiskItem[], void>({
      query: () => "/asset-risk-mapping",
      providesTags: ["Asset"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAssetsQuery,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useGetAssetCategoriesQuery,
  useGetMaintenanceLogsQuery,
  useCreateMaintenanceLogMutation,
  useGetAllInspectionsQuery,
  useCreateInspectionMutation,
  useGetAssetRiskMappingQuery,
} = assetsApi;
