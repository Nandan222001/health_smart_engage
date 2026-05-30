import { baseApi } from "@/services/api/baseApi";

const cmd = (body: unknown) => ({ data: body });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ComplianceDashboardData {
  compliance_score: number;
  audits: { total: number; completed: number; scheduled: number; in_progress: number };
  capas: { open: number; closed: number; overdue: number; by_severity: Record<string, number> };
  findings: { open: number; by_severity: Record<string, number> };
  standards: { total: number; active: number };
  recent_audits: { id: string; title: string; status: string; audit_type: string; scheduled_date: string | null }[];
}

export interface AuditChecklist {
  id: string;
  name: string;
  standard: string;
  version: string;
  status: string;
  description: string | null;
  audit_type: string | null;
  tenant_id: string;
}

export interface AuditRecord {
  id: string;
  title: string;
  checklist_name: string | null;
  standard: string | null;
  audit_type: string | null;
  site_id: string | null;
  auditor_user_id: string;
  status: string;
  scheduled_date: string | null;
  completed_date: string | null;
}

export interface FindingRecord {
  id: string;
  audit_id: string | null;
  title: string;
  description: string;
  source_type: string;
  severity: string;
  iso_clause: string | null;
  status: string;
}

export interface CapaRecord {
  id: string;
  title: string;
  description: string | null;
  source_type: string;
  source_id: string | null;
  owner_user_id: string;
  due_date: string | null;
  days_left: number | null;
  severity: string;
  status: string;
  overdue: boolean;
  root_cause: string | null;
  corrective_action: string | null;
}

export interface InspectionRecord {
  id: string;
  title: string;
  checklist_name: string | null;
  audit_type: string | null;
  site_id: string | null;
  auditor_user_id: string;
  status: string;
  scheduled_date: string | null;
  completed_date: string | null;
}

export interface ComplianceStandard {
  id: string;
  name: string;
  code: string | null;
  category: string;
  description: string | null;
  status: string;
  version: string | null;
  effective_date: string | null;
  review_date: string | null;
  owner: string | null;
  jurisdiction: string | null;
}

export interface RegulatoryRequirement {
  id: string;
  regulation_name: string;
  jurisdiction: string | null;
  category: string | null;
  description: string | null;
  due_date: string | null;
  days_until_due: number | null;
  status: string;
  owner: string | null;
  notes: string | null;
  last_reviewed_date: string | null;
}

export interface ComplianceDocument {
  id: string;
  title: string;
  document_type: string;
  category: string | null;
  version: string | null;
  status: string;
  description: string | null;
  effective_date: string | null;
  created_by: string | null;
}

// ─── Inputs ───────────────────────────────────────────────────────────────────

export interface CreateChecklistInput {
  name: string;
  standard: string;
  version: string;
  description?: string;
  audit_type?: string;
}

export interface CreateAuditInput {
  checklist_id: string;
  title?: string;
  audit_type?: string;
  site_id?: string;
  scheduled_date?: string;
}

export interface CreateFindingInput {
  title?: string;
  description: string;
  source_type: string;
  severity: string;
  iso_clause?: string;
}

export interface CreateCapaInput {
  title?: string;
  description?: string;
  source_type: string;
  source_id?: string;
  owner_user_id?: string;
  due_date?: string;
  severity?: string;
  root_cause?: string;
  corrective_action?: string;
}

export interface CreateStandardInput {
  name: string;
  code?: string;
  category?: string;
  description?: string;
  status?: string;
  version?: string;
  effective_date?: string;
  review_date?: string;
  owner?: string;
  jurisdiction?: string;
}

export interface CreateRegulatoryInput {
  regulation_name: string;
  jurisdiction?: string;
  category?: string;
  description?: string;
  due_date?: string;
  status?: string;
  owner?: string;
  notes?: string;
}

export interface CreateDocumentInput {
  title: string;
  document_type?: string;
  category?: string;
  version?: string;
  status?: string;
  description?: string;
  effective_date?: string;
}

export interface CreateInspectionInput {
  title?: string;
  checklist_id?: string;
  audit_type?: string;
  site_id?: string;
  scheduled_date?: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const complianceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getComplianceDashboard: builder.query<ComplianceDashboardData, void>({
      query: () => "/compliance-dashboard",
      providesTags: ["Audit", "CAPA"],
    }),
    getAuditChecklists: builder.query<AuditChecklist[], void>({
      query: () => "/audit-checklists",
      providesTags: ["Audit"],
    }),
    createAuditChecklist: builder.mutation<{ id: string; status: string }, CreateChecklistInput>({
      query: (data) => ({ url: "/audit-checklists", method: "POST", body: cmd(data) }),
      invalidatesTags: ["Audit"],
    }),
    publishChecklist: builder.mutation<{ id: string; status: string }, string>({
      query: (id) => ({ url: `/audit-checklists/${id}/publish`, method: "POST", body: cmd({}) }),
      invalidatesTags: ["Audit"],
    }),
    getAudits: builder.query<AuditRecord[], void>({
      query: () => "/audits",
      providesTags: ["Audit"],
    }),
    createAudit: builder.mutation<{ id: string; status: string }, CreateAuditInput>({
      query: (data) => ({ url: "/audits", method: "POST", body: cmd(data) }),
      invalidatesTags: ["Audit"],
    }),
    updateAudit: builder.mutation<{ id: string; status: string }, { id: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({ url: `/audits/${id}`, method: "PATCH", body: cmd(data) }),
      invalidatesTags: ["Audit"],
    }),
    getFindings: builder.query<FindingRecord[], void>({
      query: () => "/audit-findings",
      providesTags: ["Audit"],
    }),
    createFinding: builder.mutation<{ id: string }, { auditId: string; data: CreateFindingInput }>({
      query: ({ auditId, data }) => ({ url: `/audits/${auditId}/findings`, method: "POST", body: cmd(data) }),
      invalidatesTags: ["Audit", "CAPA"],
    }),
    getCapas: builder.query<CapaRecord[], void>({
      query: () => "/capas",
      providesTags: ["CAPA"],
    }),
    createCapa: builder.mutation<{ id: string; status: string }, CreateCapaInput>({
      query: (data) => ({ url: "/capas", method: "POST", body: cmd(data) }),
      invalidatesTags: ["CAPA"],
    }),
    updateCapa: builder.mutation<{ id: string; status: string }, { id: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({ url: `/capas/${id}`, method: "PATCH", body: cmd(data) }),
      invalidatesTags: ["CAPA"],
    }),
    submitCapaClosure: builder.mutation<{ id: string; status: string }, string>({
      query: (id) => ({ url: `/capas/${id}/submit-closure`, method: "POST", body: cmd({}) }),
      invalidatesTags: ["CAPA"],
    }),
    approveCapaClosure: builder.mutation<{ id: string; status: string }, string>({
      query: (id) => ({ url: `/capas/${id}/approve-closure`, method: "POST", body: cmd({}) }),
      invalidatesTags: ["CAPA"],
    }),
    getInspections: builder.query<InspectionRecord[], void>({
      query: () => "/inspections",
      providesTags: ["Audit"],
    }),
    createInspection: builder.mutation<{ id: string; status: string }, CreateInspectionInput>({
      query: (data) => ({ url: "/inspections", method: "POST", body: cmd(data) }),
      invalidatesTags: ["Audit"],
    }),
    getComplianceStandards: builder.query<ComplianceStandard[], void>({
      query: () => "/compliance-standards",
      providesTags: ["ComplianceStandard"],
    }),
    createComplianceStandard: builder.mutation<{ id: string; status: string }, CreateStandardInput>({
      query: (data) => ({ url: "/compliance-standards", method: "POST", body: cmd(data) }),
      invalidatesTags: ["ComplianceStandard"],
    }),
    updateComplianceStandard: builder.mutation<{ id: string; status: string }, { id: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({ url: `/compliance-standards/${id}`, method: "PATCH", body: cmd(data) }),
      invalidatesTags: ["ComplianceStandard"],
    }),
    getRegulatoryRequirements: builder.query<RegulatoryRequirement[], void>({
      query: () => "/regulatory-requirements",
      providesTags: ["ComplianceStandard"],
    }),
    createRegulatoryRequirement: builder.mutation<{ id: string; status: string }, CreateRegulatoryInput>({
      query: (data) => ({ url: "/regulatory-requirements", method: "POST", body: cmd(data) }),
      invalidatesTags: ["ComplianceStandard"],
    }),
    updateRegulatoryRequirement: builder.mutation<{ id: string; status: string }, { id: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({ url: `/regulatory-requirements/${id}`, method: "PATCH", body: cmd(data) }),
      invalidatesTags: ["ComplianceStandard"],
    }),
    getComplianceDocuments: builder.query<ComplianceDocument[], void>({
      query: () => "/compliance-documents",
      providesTags: ["ComplianceStandard"],
    }),
    createComplianceDocument: builder.mutation<{ id: string; status: string }, CreateDocumentInput>({
      query: (data) => ({ url: "/compliance-documents", method: "POST", body: cmd(data) }),
      invalidatesTags: ["ComplianceStandard"],
    }),
    updateComplianceDocument: builder.mutation<{ id: string; status: string }, { id: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({ url: `/compliance-documents/${id}`, method: "PATCH", body: cmd(data) }),
      invalidatesTags: ["ComplianceStandard"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetComplianceDashboardQuery,
  useGetAuditChecklistsQuery,
  useCreateAuditChecklistMutation,
  usePublishChecklistMutation,
  useGetAuditsQuery,
  useCreateAuditMutation,
  useUpdateAuditMutation,
  useGetFindingsQuery,
  useCreateFindingMutation,
  useGetCapasQuery,
  useCreateCapaMutation,
  useUpdateCapaMutation,
  useSubmitCapaClosureMutation,
  useApproveCapaClosureMutation,
  useGetInspectionsQuery,
  useCreateInspectionMutation,
  useGetComplianceStandardsQuery,
  useCreateComplianceStandardMutation,
  useUpdateComplianceStandardMutation,
  useGetRegulatoryRequirementsQuery,
  useCreateRegulatoryRequirementMutation,
  useUpdateRegulatoryRequirementMutation,
  useGetComplianceDocumentsQuery,
  useCreateComplianceDocumentMutation,
  useUpdateComplianceDocumentMutation,
} = complianceApi;
