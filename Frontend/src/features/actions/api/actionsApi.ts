import { baseApi } from "@/services/api/baseApi";
import type { Action } from "@/services/api";

interface ActionsQueryArgs {
  violationId?: string;
  status?: string;
}

export const actionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getActions: builder.query<Action[], ActionsQueryArgs | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.violationId) params.append("violation_id", args.violationId);
        if (args?.status) params.append("status", args.status);
        const query = params.toString();
        return `/actions${query ? `?${query}` : ""}`;
      },
      providesTags: ["Action"],
    }),
  }),
});

export const { useGetActionsQuery } = actionsApi;
