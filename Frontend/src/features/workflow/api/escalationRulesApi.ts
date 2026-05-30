import { baseApi } from "@/services/api/baseApi";

export interface EscalationRule {
  id: string;
  name: string;
  trigger_event: string;
  delay_minutes: number;
  escalate_to_role: string;
  escalate_to_user?: string;
  notify_via: string[];
  is_active: boolean;
  description?: string;
}

export type EscalationRulePayload = Omit<EscalationRule, "id">;

export const escalationRulesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listEscalationRules: builder.query<EscalationRule[], void>({
      query: () => "/escalation-rules",
      transformResponse: (raw: { items?: EscalationRule[] } | EscalationRule[]) =>
        Array.isArray(raw) ? raw : (raw?.items ?? []),
      providesTags: ["EscalationRule"],
    }),
    createEscalationRule: builder.mutation<EscalationRule, Partial<EscalationRulePayload>>({
      query: (body) => ({ url: "/escalation-rules", method: "POST", body }),
      invalidatesTags: ["EscalationRule"],
    }),
    updateEscalationRule: builder.mutation<EscalationRule, { ruleId: string; body: Partial<EscalationRulePayload> }>({
      query: ({ ruleId, body }) => ({ url: `/escalation-rules/${ruleId}`, method: "PATCH", body }),
      invalidatesTags: ["EscalationRule"],
    }),
    deleteEscalationRule: builder.mutation<{ deleted: boolean }, string>({
      query: (ruleId) => ({ url: `/escalation-rules/${ruleId}`, method: "DELETE" }),
      invalidatesTags: ["EscalationRule"],
    }),
  }),
});

export const {
  useListEscalationRulesQuery,
  useCreateEscalationRuleMutation,
  useUpdateEscalationRuleMutation,
  useDeleteEscalationRuleMutation,
} = escalationRulesApi;
