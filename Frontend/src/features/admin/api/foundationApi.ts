import { baseApi } from "@/services/api/baseApi";

const cmd = (body: unknown) => ({ data: body });

export interface OrganisationNode {
  id: string;
  parent_id?: string;
  name: string;
  node_type: string;
  settings: Record<string, any>;
}

export const foundationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listOrganisationNodes: builder.query<OrganisationNode[], { type?: string }>({
      query: (params) => {
        const qs = params?.type ? `?type=${params.type}` : "";
        return `/foundation/org-nodes${qs}`;
      },
      providesTags: ["OrgSetup"],
    }),
    createOrganisationNode: builder.mutation<OrganisationNode, Partial<OrganisationNode>>({
      query: (data) => ({
        url: "/foundation/org-nodes",
        method: "POST",
        body: cmd(data),
      }),
      invalidatesTags: ["OrgSetup"],
    }),
    updateOrganisationNode: builder.mutation<OrganisationNode, { id: string; payload: Partial<OrganisationNode> }>({
      query: ({ id, payload }) => ({
        url: `/foundation/org-nodes/${id}`,
        method: "PATCH",
        body: cmd(payload),
      }),
      invalidatesTags: ["OrgSetup"],
    }),
    deleteOrganisationNode: builder.mutation<{ id: string }, string>({
      query: (id) => ({
        url: `/foundation/org-nodes/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["OrgSetup"],
    }),
  }),
});

export const {
  useListOrganisationNodesQuery,
  useCreateOrganisationNodeMutation,
  useUpdateOrganisationNodeMutation,
  useDeleteOrganisationNodeMutation,
} = foundationApi;
