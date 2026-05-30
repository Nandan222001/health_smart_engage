import { baseApi } from "@/services/api/baseApi";
import type {
  ChecklistTemplate,
  ChecklistSubmissionSummary,
  ChecklistSubmissionDetail,
  CreateChecklistSubmissionPayload,
  SaveChecklistItemPayload,
} from "@/services/api";

export const checklistsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    bootstrapChecklistTemplates: builder.mutation<
      { status: string; message: string; counts: Record<string, number> },
      void
    >({
      query: () => ({ url: "/checklists/templates/bootstrap", method: "POST" }),
      invalidatesTags: ["Checklist"],
    }),
    getChecklistTemplates: builder.query<ChecklistTemplate[], void>({
      query: () => "/checklists/templates",
      providesTags: ["Checklist"],
    }),
    getChecklistSubmissions: builder.query<
      ChecklistSubmissionSummary[],
      Record<string, string | number | undefined> | void
    >({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              params.append(key, String(value));
            }
          });
        }
        const query = params.toString();
        return `/checklists/submissions${query ? `?${query}` : ""}`;
      },
      providesTags: ["Checklist"],
    }),
    getChecklistSubmissionDetail: builder.query<ChecklistSubmissionDetail, string>({
      query: (uuid) => `/checklists/submissions/${uuid}`,
      providesTags: ["Checklist"],
    }),
    createChecklistSubmission: builder.mutation<
      { submission_uuid: string; status: string },
      CreateChecklistSubmissionPayload
    >({
      query: (payload) => ({
        url: "/checklists/submissions",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Checklist"],
    }),
    saveChecklistItems: builder.mutation<
      { status: string; updated_items: number },
      { submissionUuid: string; items: SaveChecklistItemPayload[] }
    >({
      query: ({ submissionUuid, items }) => ({
        url: `/checklists/submissions/${submissionUuid}/items`,
        method: "PUT",
        body: { items },
      }),
      invalidatesTags: ["Checklist"],
    }),
    submitChecklist: builder.mutation<{ status: string; submission_uuid: string }, string>({
      query: (submissionUuid) => ({
        url: `/checklists/submissions/${submissionUuid}/submit`,
        method: "POST",
      }),
      invalidatesTags: ["Checklist"],
    }),
    validateChecklist: builder.mutation<
      { status: string; submission_uuid: string },
      { submissionUuid: string; decision: "approved" | "rejected"; notes?: string }
    >({
      query: ({ submissionUuid, decision, notes }) => ({
        url: `/checklists/submissions/${submissionUuid}/validate`,
        method: "POST",
        body: { decision, notes },
      }),
      invalidatesTags: ["Checklist"],
    }),
  }),
});

export const {
  useBootstrapChecklistTemplatesMutation,
  useGetChecklistTemplatesQuery,
  useGetChecklistSubmissionsQuery,
  useGetChecklistSubmissionDetailQuery,
  useCreateChecklistSubmissionMutation,
  useSaveChecklistItemsMutation,
  useSubmitChecklistMutation,
  useValidateChecklistMutation,
} = checklistsApi;
