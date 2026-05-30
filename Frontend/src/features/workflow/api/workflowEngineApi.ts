import { baseApi } from "@/services/api/baseApi";

// ─── Pipeline stages ───────────────────────────────────────────────────────

export type WorkflowStage =
  | "risk_detected"
  | "alerts_sent"
  | "workflow_triggered"
  | "approvals_escalations"
  | "actions_capa"
  | "resolution_verification"
  | "records_updated";

export type CaseType =
  | "incident" | "permit" | "violation" | "near_miss"
  | "hazard" | "audit_finding" | "capa";

export type CaseSeverity = "low" | "medium" | "high" | "critical";
export type CasePriority = "low" | "medium" | "high" | "critical";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "escalated";

// ─── Workflow Case ─────────────────────────────────────────────────────────

export interface WorkflowCase {
  id: string;
  case_number: string;
  title: string;
  type: CaseType;
  severity: CaseSeverity;
  current_stage: WorkflowStage;
  priority: CasePriority;
  assigned_to?: string;
  site?: string;
  zone?: string;
  created_at: string;
  updated_at: string;
  due_at?: string;
  overdue: boolean;
  escalated: boolean;
  stage_history: StageEvent[];
}

export interface StageEvent {
  stage: WorkflowStage;
  entered_at: string;
  completed_at?: string;
  actor?: string;
  notes?: string;
}

// ─── Alert / Notification ──────────────────────────────────────────────────

export interface WorkflowAlert {
  id: string;
  case_id: string;
  case_title: string;
  type: "email" | "sms" | "push" | "in_app";
  recipient: string;
  message: string;
  sent_at: string;
  acknowledged: boolean;
  acknowledged_at?: string;
}

// ─── Approval ─────────────────────────────────────────────────────────────

export interface ApprovalRequest {
  id: string;
  case_id: string;
  case_number: string;
  case_title: string;
  case_type: CaseType;
  severity: CaseSeverity;
  approver: string;
  approver_role: string;
  status: ApprovalStatus;
  requested_at: string;
  due_at: string;
  overdue: boolean;
  escalated_to?: string;
  notes?: string;
}

// ─── CAPA ──────────────────────────────────────────────────────────────────

export interface WorkflowCAPA {
  id: string;
  case_id: string;
  case_number: string;
  title: string;
  description: string;
  assignee: string;
  priority: CasePriority;
  due_date: string;
  status: "open" | "in_progress" | "pending_closure" | "closed";
  root_cause?: string;
  created_at: string;
  overdue: boolean;
}

// ─── Resolution ────────────────────────────────────────────────────────────

export interface ResolutionItem {
  id: string;
  case_id: string;
  case_number: string;
  case_title: string;
  verified_by?: string;
  verification_due: string;
  evidence_submitted: boolean;
  status: "awaiting_evidence" | "under_review" | "approved" | "rejected";
  submitted_at?: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────

export interface WorkflowDashboard {
  stage_counts: Record<WorkflowStage, number>;
  overdue_count: number;
  escalated_count: number;
  resolved_today: number;
  avg_resolution_hours: number;
  active_cases: WorkflowCase[];
  pending_approvals: ApprovalRequest[];
  open_capas: WorkflowCAPA[];
  pending_resolutions: ResolutionItem[];
  recent_alerts: WorkflowAlert[];
}

// ─── RTK Query endpoints ───────────────────────────────────────────────────

export const workflowEngineApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWorkflowDashboard: builder.query<WorkflowDashboard, void>({
      query: () => "/workflows/dashboard",
      providesTags: ["Workflow"],
    }),
    listWorkflowCases: builder.query<WorkflowCase[], { stage?: WorkflowStage; type?: CaseType } | void>({
      query: (params) => {
        const qs = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : "";
        return `/workflows/cases${qs}`;
      },
      providesTags: ["Workflow"],
    }),
    getWorkflowCase: builder.query<WorkflowCase, string>({
      query: (id) => `/workflows/cases/${id}`,
      providesTags: ["Workflow"],
    }),
    approveCase: builder.mutation<{ message: string }, { caseId: string; approvalId: string; notes?: string }>({
      query: ({ caseId, approvalId, notes }) => ({
        url: `/workflows/cases/${caseId}/approvals/${approvalId}/approve`,
        method: "POST",
        body: { notes },
      }),
      invalidatesTags: ["Workflow"],
    }),
    rejectCase: builder.mutation<{ message: string }, { caseId: string; approvalId: string; reason: string }>({
      query: ({ caseId, approvalId, reason }) => ({
        url: `/workflows/cases/${caseId}/approvals/${approvalId}/reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["Workflow"],
    }),
    escalateCase: builder.mutation<{ message: string }, { caseId: string; escalate_to: string; reason?: string }>({
      query: ({ caseId, ...body }) => ({
        url: `/workflows/cases/${caseId}/escalate`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Workflow"],
    }),
    advanceStage: builder.mutation<WorkflowCase, { caseId: string; notes?: string }>({
      query: ({ caseId, notes }) => ({
        url: `/workflows/cases/${caseId}/advance`,
        method: "POST",
        body: { notes },
      }),
      invalidatesTags: ["Workflow"],
    }),
    submitResolutionEvidence: builder.mutation<{ message: string }, { resolutionId: string; evidence: string; notes?: string }>({
      query: ({ resolutionId, ...body }) => ({
        url: `/workflows/resolutions/${resolutionId}/evidence`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Workflow"],
    }),
    verifyResolution: builder.mutation<{ message: string }, { resolutionId: string; decision: "approved" | "rejected"; notes?: string }>({
      query: ({ resolutionId, ...body }) => ({
        url: `/workflows/resolutions/${resolutionId}/verify`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Workflow"],
    }),
    acknowledgeAlert: builder.mutation<void, string>({
      query: (alertId) => ({ url: `/workflows/alerts/${alertId}/acknowledge`, method: "POST" }),
      invalidatesTags: ["Workflow"],
    }),
  }),
});

export const {
  useGetWorkflowDashboardQuery,
  useListWorkflowCasesQuery,
  useGetWorkflowCaseQuery,
  useApproveCaseMutation,
  useRejectCaseMutation,
  useEscalateCaseMutation,
  useAdvanceStageMutation,
  useSubmitResolutionEvidenceMutation,
  useVerifyResolutionMutation,
  useAcknowledgeAlertMutation,
} = workflowEngineApi;
