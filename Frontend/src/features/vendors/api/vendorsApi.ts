import { baseApi } from "@/services/api/baseApi";

const cmd = (body: unknown) => ({ data: body });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Vendor {
  id: string;
  company_name: string;
  contact: string | null;
  email: string | null;
  phone: string | null;
  trade_type: string;
  status: string;
  site_location: string | null;
  total_workers: number | null;
  on_site_workers: number | null;
  safety_score: number | null;
  risk_score: number | null;
  incident_count: number | null;
  contract_expiry: string | null;
  active_since: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface VendorComplianceDomain {
  domain: string;
  score: number;
}

export interface VendorComplianceRecord {
  vendor_id: string;
  vendor_name: string;
  overall_score: number;
  status: string;
  active_since: string | null;
  domains: VendorComplianceDomain[];
}

export interface VendorCertification {
  id: string;
  vendor_id: string;
  vendor_name: string;
  document_type: string;
  issuing_body: string | null;
  expiry_date: string | null;
  days_left: number | null;
  cert_status: "Valid" | "Expiring" | "Expired" | string;
  status: string;
}

export interface VendorRiskScore {
  vendor_id: string;
  vendor_name: string;
  risk_score: number;
  incident_count: number;
  safety_score: number;
  status: string;
}

export interface CreateVendorInput {
  company_name: string;
  contact?: string;
  email?: string;
  phone?: string;
  trade_type?: string;
  status?: string;
  site_location?: string;
  total_workers?: number;
  on_site_workers?: number;
  safety_score?: number;
  risk_score?: number;
  incident_count?: number;
  contract_expiry?: string;
  active_since?: string;
}

export interface AddCertificationInput {
  document_type: string;
  issuing_body?: string;
  expiry_date?: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const vendorsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVendors: builder.query<Vendor[], void>({
      query: () => "/vendors",
      providesTags: ["Vendor"],
    }),
    createVendor: builder.mutation<{ id: string; status: string }, CreateVendorInput>({
      query: (data) => ({ url: "/vendors", method: "POST", body: cmd(data) }),
      invalidatesTags: ["Vendor"],
    }),
    updateVendor: builder.mutation<{ id: string; status: string }, { id: string; data: Partial<CreateVendorInput> }>({
      query: ({ id, data }) => ({ url: `/vendors/${id}`, method: "PATCH", body: cmd(data) }),
      invalidatesTags: ["Vendor"],
    }),
    getVendorCompliance: builder.query<VendorComplianceRecord[], void>({
      query: () => "/vendor-compliance",
      providesTags: ["Vendor"],
    }),
    saveVendorCompliance: builder.mutation<{ vendor_id: string; updated: number }, { vendorId: string; domains: VendorComplianceDomain[] }>({
      query: ({ vendorId, domains }) => ({
        url: `/vendors/${vendorId}/compliance`,
        method: "POST",
        body: cmd({ domains }),
      }),
      invalidatesTags: ["Vendor"],
    }),
    getVendorCertifications: builder.query<VendorCertification[], void>({
      query: () => "/vendor-certifications",
      providesTags: ["Vendor"],
    }),
    addVendorCertification: builder.mutation<{ id: string; status: string }, { vendorId: string; data: AddCertificationInput }>({
      query: ({ vendorId, data }) => ({
        url: `/vendors/${vendorId}/certifications`,
        method: "POST",
        body: cmd(data),
      }),
      invalidatesTags: ["Vendor"],
    }),
    getVendorRiskScores: builder.query<VendorRiskScore[], void>({
      query: () => "/vendor-risk-scores",
      providesTags: ["Vendor"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetVendorsQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useGetVendorComplianceQuery,
  useSaveVendorComplianceMutation,
  useGetVendorCertificationsQuery,
  useAddVendorCertificationMutation,
  useGetVendorRiskScoresQuery,
} = vendorsApi;

// Legacy export kept for any remaining imports
export const { useGetVendorsQuery: useGetContractorsQuery } = vendorsApi;
