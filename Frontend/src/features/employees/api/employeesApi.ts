import { baseApi } from "@/services/api/baseApi";

export interface Employee {
  id: string;
  name: string;
  email: string;
  department?: string;
  role?: string;
  site_id?: string;
  status: "active" | "inactive";
  joined_at?: string;
}

export interface EmployeeCertification {
  id: string;
  employee_id: string;
  name: string;
  issued_by: string;
  issued_at: string;
  expires_at?: string;
  status: "valid" | "expiring" | "expired";
}

export const employeesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listEmployees: builder.query<Employee[], Record<string, string> | void>({
      query: (params) => {
        const qs = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : "";
        return `/employees${qs}`;
      },
      providesTags: ["Employee"],
    }),
    createEmployee: builder.mutation<Employee, Partial<Employee>>({
      query: (body) => ({ url: "/employees", method: "POST", body }),
      invalidatesTags: ["Employee"],
    }),
    getEmployee: builder.query<Employee, string>({
      query: (employeeId) => `/employees/${employeeId}`,
      providesTags: ["Employee"],
    }),
    updateEmployee: builder.mutation<Employee, { employeeId: string; body: Partial<Employee> }>({
      query: ({ employeeId, body }) => ({ url: `/employees/${employeeId}`, method: "PATCH", body }),
      invalidatesTags: ["Employee"],
    }),
    listEmployeeCertifications: builder.query<EmployeeCertification[], string>({
      query: (employeeId) => `/employees/${employeeId}/certifications`,
      providesTags: ["EquipmentCert"],
    }),
    addEmployeeCertification: builder.mutation<EmployeeCertification, { employeeId: string } & Partial<EmployeeCertification>>({
      query: ({ employeeId, ...body }) => ({ url: `/employees/${employeeId}/certifications`, method: "POST", body }),
      invalidatesTags: ["EquipmentCert"],
    }),
  }),
});

export const {
  useListEmployeesQuery,
  useCreateEmployeeMutation,
  useGetEmployeeQuery,
  useUpdateEmployeeMutation,
  useListEmployeeCertificationsQuery,
  useAddEmployeeCertificationMutation,
} = employeesApi;
