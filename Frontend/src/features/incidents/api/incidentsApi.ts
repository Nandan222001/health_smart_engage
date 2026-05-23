import { baseApi } from "@/services/api/baseApi";

export interface Incident {
  id: string;
  title: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved" | "closed";
  site_id?: string;
  zone_id?: string;
  reported_by: string;
  occurred_at: string;
  description?: string;
  created_at: string;
}

export const incidentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listIncidents: builder.query<Incident[], Record<string, string> | void>({
      query: (params) => {
        const qs = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : "";
        return `/incidents${qs}`;
      },
      providesTags: ["Incident"],
    }),
    classifyIncident: builder.mutation<{ message: string }, { incidentId: string; classification: string; severity: string }>({
      query: ({ incidentId, ...body }) => ({ url: `/incidents/${incidentId}/classify`, method: "POST", body }),
      invalidatesTags: ["Incident"],
    }),
    startIncidentInvestigation: builder.mutation<{ message: string }, { incidentId: string; lead_investigator: string; notes?: string }>({
      query: ({ incidentId, ...body }) => ({ url: `/incidents/${incidentId}/investigations`, method: "POST", body }),
      invalidatesTags: ["Incident"],
    }),
  }),
});

export const {
  useListIncidentsQuery,
  useClassifyIncidentMutation,
  useStartIncidentInvestigationMutation,
} = incidentsApi;
