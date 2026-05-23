import { baseApi } from "@/services/api/baseApi";

export interface AuditChecklist {
  id: string;
  name: string;
  category: string;
  status: "draft" | "published";
  items: AuditChecklistItem[];
  created_at: string;
}

export interface AuditChecklistItem {
  id: string;
  question: string;
  type: "yes_no" | "rating" | "text";
  required: boolean;
}

export interface Audit {
  id: string;
  checklist_id: string;
  site_id?: string;
  auditor: string;
  status: "planned" | "in_progress" | "completed";
  scheduled_at?: string;
  completed_at?: string;
  findings_count?: number;
}

export interface CAPA {
  id: string;
  audit_id?: string;
  title: string;
  description: string;
  assignee: string;
  due_date: string;
  status: "open" | "in_progress" | "pending_closure" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  created_at: string;
}

export const auditsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAuditChecklists: builder.query<AuditChecklist[], void>({
      query: () => "/audit-checklists",
      providesTags: ["Audit"],
    }),
    createAuditChecklist: builder.mutation<AuditChecklist, Partial<AuditChecklist>>({
      query: (body) => ({ url: "/audit-checklists", method: "POST", body }),
      invalidatesTags: ["Audit"],
    }),
    publishAuditChecklist: builder.mutation<{ message: string }, string>({
      query: (checklistId) => ({ url: `/audit-checklists/${checklistId}/publish`, method: "POST" }),
      invalidatesTags: ["Audit"],
    }),
    createAudit: builder.mutation<Audit, { checklist_id: string; site_id?: string; scheduled_at?: string }>({
      query: (body) => ({ url: "/audits", method: "POST", body }),
      invalidatesTags: ["Audit"],
    }),
    getAudit: builder.query<Audit, string>({
      query: (auditId) => `/audits/${auditId}`,
      providesTags: ["Audit"],
    }),
    createAuditFinding: builder.mutation<{ message: string }, { auditId: string; description: string; severity: string; recommendation?: string }>({
      query: ({ auditId, ...body }) => ({ url: `/audits/${auditId}/findings`, method: "POST", body }),
      invalidatesTags: ["Audit", "CAPA"],
    }),
    listCAPAs: builder.query<CAPA[], void>({
      query: () => "/capas",
      providesTags: ["CAPA"],
    }),
    submitCAPAClosure: builder.mutation<{ message: string }, { capaId: string; evidence?: string; notes?: string }>({
      query: ({ capaId, ...body }) => ({ url: `/capas/${capaId}/submit-closure`, method: "POST", body }),
      invalidatesTags: ["CAPA"],
    }),
    approveCAPAClosure: builder.mutation<{ message: string }, { capaId: string; decision: "approved" | "rejected"; notes?: string }>({
      query: ({ capaId, ...body }) => ({ url: `/capas/${capaId}/approve-closure`, method: "POST", body }),
      invalidatesTags: ["CAPA"],
    }),
  }),
});

export const {
  useListAuditChecklistsQuery,
  useCreateAuditChecklistMutation,
  usePublishAuditChecklistMutation,
  useCreateAuditMutation,
  useGetAuditQuery,
  useCreateAuditFindingMutation,
  useListCAPAsQuery,
  useSubmitCAPAClosureMutation,
  useApproveCAPAClosureMutation,
} = auditsApi;
