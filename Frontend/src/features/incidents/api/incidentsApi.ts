import { baseApi } from "@/services/api/baseApi";

export interface Incident {
  id: string;
  ref?: string;
  title: string;
  description?: string;
  type: string;
  incident_type: string;
  severity: string;
  status: string;
  is_confidential?: boolean;
  reported_by: string;
  occurred_at: string;
}

export interface Investigation {
  id: string;
  incident_id: string;
  lead_user_id: string;
  rca_method: string;
  findings?: Record<string, unknown>;
  status: string;
}

export interface RcaRecord {
  id: string;
  incident_id: string;
  root_cause?: string;
  contributing_factors?: string;
  recommendations?: string;
  rca_method?: string;
}

export interface CorrectiveAction {
  id: string;
  title?: string;
  description?: string;
  incident_id?: string;
  assigned_to?: string;
  due_date?: string;
  priority?: string;
  status: string;
}

export interface IncidentAnalytics {
  total_incidents: number;
  trir: number;
  open_corrective_actions: number;
  closed_corrective_actions: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
  by_status: Record<string, number>;
}

type ListResponse<T> = T[] | { items: T[]; total?: number };

function toArray<T>(data: ListResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  return data?.items ?? [];
}

export const incidentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listIncidents: builder.query<Incident[], Record<string, string> | void>({
      query: (params) => {
        const qs = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : "";
        return `/incidents${qs}`;
      },
      transformResponse: (raw: ListResponse<Incident>) => toArray(raw),
      providesTags: ["Incident"],
    }),

    createIncident: builder.mutation<{ id: string; ref: string; status: string }, {
      description: string;
      incident_type: string;
      severity: string;
      location_id?: string;
      is_confidential?: boolean;
    }>({
      query: (body) => ({ url: "/incidents", method: "POST", body }),
      invalidatesTags: ["Incident"],
    }),

    updateIncident: builder.mutation<{ id: string; status: string }, {
      incidentId: string;
      severity?: string;
      status?: string;
      description?: string;
      is_confidential?: boolean;
    }>({
      query: ({ incidentId, ...body }) => ({ url: `/incidents/${incidentId}`, method: "PATCH", body }),
      invalidatesTags: ["Incident"],
    }),

    classifyIncident: builder.mutation<{ message: string }, { incidentId: string; classification: string; severity: string }>({
      query: ({ incidentId, ...body }) => ({ url: `/incidents/${incidentId}/classify`, method: "POST", body }),
      invalidatesTags: ["Incident"],
    }),

    startIncidentInvestigation: builder.mutation<{ message: string }, { incidentId: string; lead_investigator: string; rca_method?: string; notes?: string }>({
      query: ({ incidentId, ...body }) => ({ url: `/incidents/${incidentId}/investigations`, method: "POST", body }),
      invalidatesTags: ["Incident"],
    }),

    listUnsafeActs: builder.query<Incident[], void>({
      query: () => "/incidents/unsafe-acts",
      transformResponse: (raw: ListResponse<Incident>) => toArray(raw),
      providesTags: ["Incident"],
    }),

    createUnsafeAct: builder.mutation<{ id: string; ref: string; status: string }, {
      description: string;
      severity: string;
      location_id?: string;
    }>({
      query: (body) => ({ url: "/incidents/unsafe-acts", method: "POST", body }),
      invalidatesTags: ["Incident"],
    }),

    listUnsafeConditions: builder.query<Incident[], void>({
      query: () => "/incidents/unsafe-conditions",
      transformResponse: (raw: ListResponse<Incident>) => toArray(raw),
      providesTags: ["Incident"],
    }),

    createUnsafeCondition: builder.mutation<{ id: string; ref: string; status: string }, {
      description: string;
      severity: string;
      location_id?: string;
    }>({
      query: (body) => ({ url: "/incidents/unsafe-conditions", method: "POST", body }),
      invalidatesTags: ["Incident"],
    }),

    listInvestigations: builder.query<Investigation[], string>({
      query: (incidentId) => `/incidents/${incidentId}/investigations`,
      transformResponse: (raw: ListResponse<Investigation>) => toArray(raw),
      providesTags: ["Incident"],
    }),

    getIncidentRca: builder.query<RcaRecord[], string>({
      query: (incidentId) => `/incidents/${incidentId}/rca`,
      transformResponse: (raw: ListResponse<RcaRecord>) => toArray(raw),
      providesTags: ["RCA"],
    }),

    createIncidentRca: builder.mutation<{ id: string }, {
      incidentId: string;
      root_cause: string;
      contributing_factors?: string;
      recommendations?: string;
      rca_method: string;
    }>({
      query: ({ incidentId, ...body }) => ({ url: `/incidents/${incidentId}/rca`, method: "POST", body }),
      invalidatesTags: ["RCA", "Incident"],
    }),

    listCorrectiveActions: builder.query<CorrectiveAction[], void>({
      query: () => "/incidents/corrective-actions",
      transformResponse: (raw: ListResponse<CorrectiveAction>) => toArray(raw),
      providesTags: ["Incident"],
    }),

    createCorrectiveAction: builder.mutation<{ id: string }, {
      title: string;
      description?: string;
      incident_id?: string;
      assigned_to?: string;
      due_date?: string;
      priority?: string;
      status?: string;
    }>({
      query: (body) => ({ url: "/incidents/corrective-actions", method: "POST", body }),
      invalidatesTags: ["Incident"],
    }),

    updateCorrectiveAction: builder.mutation<{ id: string }, {
      actionId: string;
      status?: string;
      title?: string;
      description?: string;
      assigned_to?: string;
      due_date?: string;
      priority?: string;
    }>({
      query: ({ actionId, ...body }) => ({ url: `/incidents/corrective-actions/${actionId}`, method: "PATCH", body }),
      invalidatesTags: ["Incident"],
    }),

    getIncidentAnalytics: builder.query<IncidentAnalytics, void>({
      query: () => "/incidents/analytics",
      providesTags: ["Incident"],
    }),
  }),
});

export const {
  useListIncidentsQuery,
  useCreateIncidentMutation,
  useUpdateIncidentMutation,
  useClassifyIncidentMutation,
  useStartIncidentInvestigationMutation,
  useListUnsafeActsQuery,
  useCreateUnsafeActMutation,
  useListUnsafeConditionsQuery,
  useCreateUnsafeConditionMutation,
  useListInvestigationsQuery,
  useGetIncidentRcaQuery,
  useCreateIncidentRcaMutation,
  useListCorrectiveActionsQuery,
  useCreateCorrectiveActionMutation,
  useUpdateCorrectiveActionMutation,
  useGetIncidentAnalyticsQuery,
} = incidentsApi;
