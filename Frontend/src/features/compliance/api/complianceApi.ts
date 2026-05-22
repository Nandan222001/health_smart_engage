import { baseApi } from "@/services/api/baseApi";
import type { ComplianceStandard, AuditTrail, SLAConfig, Rule, PPEType, AccessLog } from "@/services/api";

export const complianceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAccessLog: builder.query<AccessLog[], void>({
      query: () => "/access-log",
      providesTags: ["AccessLog"],
    }),
    getComplianceStandards: builder.query<ComplianceStandard[], void>({
      query: () => "/compliance-standards",
      providesTags: ["ComplianceStandard"],
    }),
    getAuditTrail: builder.query<AuditTrail[], void>({
      query: () => "/audit-trail",
      providesTags: ["AuditTrail"],
    }),
    getSLAConfig: builder.query<SLAConfig[], void>({
      query: () => "/sla-config",
      providesTags: ["SLAConfig"],
    }),
    getRules: builder.query<Rule[], void>({
      query: () => "/rules",
      providesTags: ["Rule"],
    }),
    getPPETypes: builder.query<PPEType[], void>({
      query: () => "/ppe-types",
      providesTags: ["PPEType"],
    }),
  }),
});

export const {
  useGetAccessLogQuery,
  useGetComplianceStandardsQuery,
  useGetAuditTrailQuery,
  useGetSLAConfigQuery,
  useGetRulesQuery,
  useGetPPETypesQuery,
} = complianceApi;
