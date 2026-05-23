import { baseApi } from "@/services/api/baseApi";

export interface TrainingGap {
  employee_id: string;
  employee_name: string;
  role: string;
  missing_courses: string[];
  priority: "low" | "medium" | "high";
}

export interface TrainingCompletion {
  employee_id: string;
  course_id: string;
  completed_at: string;
  score?: number;
  certified_by?: string;
}

export const trainingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTrainingMatrix: builder.query<Record<string, unknown>, void>({
      query: () => "/training/matrix",
      providesTags: ["Training"],
    }),
    updateTrainingMatrix: builder.mutation<Record<string, unknown>, { roleId: string; courses: string[] }>({
      query: ({ roleId, courses }) => ({ url: `/training/matrix/${roleId}`, method: "PUT", body: { courses } }),
      invalidatesTags: ["Training"],
    }),
    recordTrainingCompletion: builder.mutation<{ message: string }, TrainingCompletion>({
      query: (body) => ({ url: "/training/completions", method: "POST", body }),
      invalidatesTags: ["Training"],
    }),
    listTrainingGaps: builder.query<TrainingGap[], void>({
      query: () => "/training/gaps",
      providesTags: ["Training"],
    }),
  }),
});

export const {
  useGetTrainingMatrixQuery,
  useUpdateTrainingMatrixMutation,
  useRecordTrainingCompletionMutation,
  useListTrainingGapsQuery,
} = trainingApi;
