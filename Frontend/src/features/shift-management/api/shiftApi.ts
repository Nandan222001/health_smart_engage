import { baseApi } from "@/services/api/baseApi";

export interface Shift {
  id: string;
  name: string;
  type: "Morning" | "Afternoon" | "Night";
  startTime: string;
  endTime: string;
  workers: number;
  supervisor: string;
  status: "active" | "scheduled" | "completed";
}

const cmd = (body: unknown) => ({ data: body });

export const shiftApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listShifts: builder.query<Shift[], void>({
      query: () => "/org-admin/shifts",
      providesTags: ["Shift"],
    }),
    createShift: builder.mutation<{ id: string; status: string }, Omit<Shift, "id" | "workers" | "status">>({
      query: (body) => ({ url: "/org-admin/shifts", method: "POST", body: cmd(body) }),
      invalidatesTags: ["Shift"],
    }),
    updateShift: builder.mutation<{ id: string; status: string }, { shiftId: string } & Partial<Omit<Shift, "id">>>({
      query: ({ shiftId, ...body }) => ({ url: `/org-admin/shifts/${shiftId}`, method: "PATCH", body: cmd(body) }),
      invalidatesTags: ["Shift"],
    }),
    deleteShift: builder.mutation<{ id: string; status: string }, string>({
      query: (shiftId) => ({ url: `/org-admin/shifts/${shiftId}`, method: "DELETE", body: cmd({}) }),
      invalidatesTags: ["Shift"],
    }),
  }),
});

export const {
  useListShiftsQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
} = shiftApi;
