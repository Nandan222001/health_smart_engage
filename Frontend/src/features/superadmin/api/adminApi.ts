import { baseApi } from "@/services/api/baseApi";

interface Tenant {
  id: string;
  name: string;
  org_code: string;
  status: string;
  plan: string;
  created_at: string;
  users_count?: number;
  sites_count?: number;
}

interface OrgNode {
  id: string;
  name: string;
  type: string;
  parent_id?: string;
  tenant_id: string;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  status: string;
  tenant_id: string;
}

interface Role {
  id: string;
  name: string;
  permissions: string[];
  tenant_id?: string;
}

interface Permission {
  id: string;
  group: string;
  operation: string;
  method: string;
  description: string;
}

interface Workflow {
  key: string;
  name: string;
  steps: unknown[];
  enabled: boolean;
}

interface EscalationRule {
  id: string;
  name: string;
  trigger: string;
  actions: unknown[];
}

interface NotificationTemplate {
  id: string;
  name: string;
  channel: string;
  subject?: string;
  body: string;
}

interface RetentionRule {
  id: string;
  data_type: string;
  retention_days: number;
}

interface SystemSettings {
  [key: string]: unknown;
}

interface DataQualityIssue {
  id: string;
  type: string;
  severity: string;
  description: string;
  detected_at: string;
  resolved: boolean;
}

interface AuditLog {
  id: string;
  event_type: string;
  actor_email: string;
  resource: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface OrgInvitation {
  id: string;
  org_name: string;
  admin_name: string;
  admin_email: string;
  subscription_plan?: string;
  allowed_modules?: string[];
  status: string;
  expiry_date?: string;
  expiry_days?: number;
  created_at: string;
  token?: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  price_monthly: number;
  price_annual: number;
  max_users: number;
  max_sites: number;
  allowed_modules: string[];
  is_active: boolean;
  created_at: string;
}

interface SuperAdminNotifTemplate {
  id: string;
  name: string;
  channel: string;
  event_type: string;
  subject?: string;
  body_template: string;
  variables: string[];
  is_active: boolean;
}

interface SecurityPolicy {
  password_min_length: number;
  mfa_required: boolean;
  session_timeout_minutes: number;
  max_login_attempts: number;
  ip_whitelist: string[];
  audit_retention_days: number;
}

interface ComplianceConfig {
  active_standards: string[];
  auto_audit_schedule: string;
  require_evidence_upload: boolean;
  capa_sla_days: number;
  finding_escalation_days: number;
}

interface PlatformAnalytics {
  total_tenants: number;
  active_tenants: number;
  total_users: number;
  total_incidents: number;
  total_violations: number;
  total_audits: number;
  compliance_rate: number;
  incidents_this_month: number;
  new_tenants_this_month: number;
  tenant_growth: { month: string; count: number }[];
  top_incidents_by_type: { type: string; count: number }[];
}

interface SuperAdminUser {
  id: string;
  email: string;
  display_name: string;
  role?: string;
  is_superadmin: boolean;
  status: string;
  tenant_id?: string;
  tenant_name?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const items = (r: any) => r?.data?.items ?? [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const obj = (r: any) => r?.data ?? r;
// Backend CommandPayload requires body wrapped as { data: { ... } }
const cmd = (body: unknown) => ({ data: body });

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Tenants
    listTenants: builder.query<Tenant[], void>({
      query: () => "/admin/tenants",
      transformResponse: items,
      providesTags: ["Tenant"],
    }),
    createTenant: builder.mutation<Tenant, Partial<Tenant>>({
      query: (body) => ({ url: "/admin/tenants", method: "POST", body: cmd(body) }),
      invalidatesTags: ["Tenant"],
    }),
    getTenant: builder.query<Tenant, string>({
      query: (tenantId) => `/admin/tenants/${tenantId}`,
      transformResponse: obj,
      providesTags: ["Tenant"],
    }),
    updateTenant: builder.mutation<Tenant, { tenantId: string; body: Partial<Tenant> }>({
      query: ({ tenantId, body }) => ({ url: `/admin/tenants/${tenantId}`, method: "PATCH", body: cmd(body) }),
      invalidatesTags: ["Tenant"],
    }),

    // Organisation nodes
    listOrgNodes: builder.query<OrgNode[], void>({
      query: () => "/admin/organisation-nodes",
      transformResponse: items,
      providesTags: ["OrgNode"],
    }),
    createOrgNode: builder.mutation<OrgNode, Partial<OrgNode>>({
      query: (body) => ({ url: "/admin/organisation-nodes", method: "POST", body: cmd(body) }),
      invalidatesTags: ["OrgNode"],
    }),
    updateOrgNode: builder.mutation<OrgNode, { nodeId: string; body: Partial<OrgNode> }>({
      query: ({ nodeId, body }) => ({ url: `/admin/organisation-nodes/${nodeId}`, method: "PATCH", body: cmd(body) }),
      invalidatesTags: ["OrgNode"],
    }),
    moveOrgNode: builder.mutation<OrgNode, { nodeId: string; parentId: string }>({
      query: ({ nodeId, parentId }) => ({ url: `/admin/organisation-nodes/${nodeId}/move`, method: "POST", body: cmd({ parent_id: parentId }) }),
      invalidatesTags: ["OrgNode"],
    }),

    // Users
    listAdminUsers: builder.query<AdminUser[], void>({
      query: () => "/admin/users",
      transformResponse: items,
      providesTags: ["User"],
    }),
    inviteUser: builder.mutation<{ message: string }, { email: string; role: string; tenant_id?: string }>({
      query: (body) => ({ url: "/admin/users/invitations", method: "POST", body: cmd(body) }),
      invalidatesTags: ["User"],
    }),
    revokeUser: builder.mutation<{ message: string }, string>({
      query: (userId) => ({ url: `/admin/users/${userId}/revoke`, method: "POST" }),
      invalidatesTags: ["User"],
    }),
    updateUserRoles: builder.mutation<AdminUser, { userId: string; roles: string[] }>({
      query: ({ userId, roles }) => ({ url: `/admin/users/${userId}/roles`, method: "PATCH", body: cmd({ roles }) }),
      invalidatesTags: ["User"],
    }),

    // Roles & Permissions
    listRoles: builder.query<Role[], void>({
      query: () => "/admin/roles",
      transformResponse: items,
      providesTags: ["Role"],
    }),
    createRole: builder.mutation<Role, Partial<Role>>({
      query: (body) => ({ url: "/admin/roles", method: "POST", body: cmd(body) }),
      invalidatesTags: ["Role"],
    }),
    updateRole: builder.mutation<Role, { roleId: string; body: Partial<Role> }>({
      query: ({ roleId, body }) => ({ url: `/admin/roles/${roleId}`, method: "PATCH", body: cmd(body) }),
      invalidatesTags: ["Role"],
    }),
    deleteRole: builder.mutation<void, string>({
      query: (roleId) => ({ url: `/admin/roles/${roleId}`, method: "DELETE" }),
      invalidatesTags: ["Role"],
    }),
    listPermissions: builder.query<Permission[], void>({
      query: () => "/admin/permissions",
      transformResponse: items,
      providesTags: ["Permission"],
    }),
    updateRolePermissions: builder.mutation<Role, { roleId: string; permissions: string[] }>({
      query: ({ roleId, permissions }) => ({ url: `/admin/roles/${roleId}/permissions`, method: "PUT", body: cmd({ permissions }) }),
      invalidatesTags: ["Role", "Permission"],
    }),

    // Workflows
    listWorkflows: builder.query<Workflow[], void>({
      query: () => "/admin/workflows",
      transformResponse: items,
      providesTags: ["Workflow"],
    }),
    updateWorkflow: builder.mutation<Workflow, { workflowKey: string; body: Partial<Workflow> }>({
      query: ({ workflowKey, body }) => ({ url: `/admin/workflows/${workflowKey}`, method: "PUT", body: cmd(body) }),
      invalidatesTags: ["Workflow"],
    }),

    // Escalation rules
    listEscalationRules: builder.query<EscalationRule[], void>({
      query: () => "/admin/escalation-rules",
      transformResponse: items,
    }),
    updateEscalationRule: builder.mutation<EscalationRule, { ruleId: string; body: Partial<EscalationRule> }>({
      query: ({ ruleId, body }) => ({ url: `/admin/escalation-rules/${ruleId}`, method: "PUT", body: cmd(body) }),
    }),

    // Notification templates
    listNotificationTemplates: builder.query<NotificationTemplate[], void>({
      query: () => "/admin/notification-templates",
      transformResponse: items,
    }),
    updateNotificationTemplate: builder.mutation<NotificationTemplate, { templateId: string; body: Partial<NotificationTemplate> }>({
      query: ({ templateId, body }) => ({ url: `/admin/notification-templates/${templateId}`, method: "PUT", body: cmd(body) }),
    }),

    // Retention rules
    listRetentionRules: builder.query<RetentionRule[], void>({
      query: () => "/admin/retention-rules",
      transformResponse: items,
    }),
    updateRetentionRule: builder.mutation<RetentionRule, { ruleId: string; body: Partial<RetentionRule> }>({
      query: ({ ruleId, body }) => ({ url: `/admin/retention-rules/${ruleId}`, method: "PUT", body: cmd(body) }),
    }),

    // System settings
    getSystemSettings: builder.query<SystemSettings, void>({
      query: () => "/admin/system-settings",
      transformResponse: obj,
    }),
    updateSystemSettings: builder.mutation<SystemSettings, SystemSettings>({
      query: (body) => ({ url: "/admin/system-settings", method: "PUT", body: cmd(body) }),
    }),

    // Data quality
    listDataQualityIssues: builder.query<DataQualityIssue[], void>({
      query: () => "/admin/data-quality/issues",
      transformResponse: items,
    }),
    resolveDataQualityIssue: builder.mutation<{ message: string }, string>({
      query: (issueId) => ({ url: `/admin/data-quality/issues/${issueId}/resolve`, method: "POST" }),
      invalidatesTags: [],
    }),

    // Audit logs
    listAdminAuditLogs: builder.query<AuditLog[], Record<string, string> | void>({
      query: (params) => {
        const qs = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : "";
        return `/admin/audit-logs${qs}`;
      },
      transformResponse: items,
    }),
    getAdminAuditLog: builder.query<AuditLog, string>({
      query: (eventId) => `/admin/audit-logs/${eventId}`,
      transformResponse: obj,
    }),

    // Superadmin invitations
    listSuperAdminInvitations: builder.query<OrgInvitation[], void>({
      query: () => "/admin/superadmin/invitations",
      transformResponse: items,
      providesTags: ["Onboarding"],
    }),
    createSuperAdminInvitation: builder.mutation<OrgInvitation, Partial<OrgInvitation>>({
      query: (body) => ({ url: "/admin/superadmin/invitations", method: "POST", body: cmd(body) }),
      invalidatesTags: ["Onboarding"],
    }),
    resendSuperAdminInvitation: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/admin/superadmin/invitations/${id}/resend`, method: "POST" }),
      invalidatesTags: ["Onboarding"],
    }),
    cancelSuperAdminInvitation: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/admin/superadmin/invitations/${id}/cancel`, method: "POST" }),
      invalidatesTags: ["Onboarding"],
    }),

    // Subscription plans
    listSubscriptionPlans: builder.query<SubscriptionPlan[], void>({
      query: () => "/admin/superadmin/subscription-plans",
      transformResponse: items,
      providesTags: ["Tenant"],
    }),
    createSubscriptionPlan: builder.mutation<SubscriptionPlan, Partial<SubscriptionPlan>>({
      query: (body) => ({ url: "/admin/superadmin/subscription-plans", method: "POST", body: cmd(body) }),
      invalidatesTags: ["Tenant"],
    }),
    updateSubscriptionPlan: builder.mutation<SubscriptionPlan, { planId: string; body: Partial<SubscriptionPlan> }>({
      query: ({ planId, body }) => ({ url: `/admin/superadmin/subscription-plans/${planId}`, method: "PATCH", body: cmd(body) }),
      invalidatesTags: ["Tenant"],
    }),
    assignTenantSubscription: builder.mutation<{ message: string }, { tenantId: string; planId: string }>({
      query: ({ tenantId, planId }) => ({ url: `/admin/superadmin/tenants/${tenantId}/subscription`, method: "POST", body: cmd({ plan_id: planId }) }),
      invalidatesTags: ["Tenant"],
    }),

    // Superadmin notification templates
    listSuperAdminNotifTemplates: builder.query<SuperAdminNotifTemplate[], void>({
      query: () => "/admin/superadmin/notification-templates",
      transformResponse: items,
    }),
    createSuperAdminNotifTemplate: builder.mutation<SuperAdminNotifTemplate, Partial<SuperAdminNotifTemplate>>({
      query: (body) => ({ url: "/admin/superadmin/notification-templates", method: "POST", body: cmd(body) }),
    }),
    updateSuperAdminNotifTemplate: builder.mutation<SuperAdminNotifTemplate, { templateId: string; body: Partial<SuperAdminNotifTemplate> }>({
      query: ({ templateId, body }) => ({ url: `/admin/superadmin/notification-templates/${templateId}`, method: "PATCH", body: cmd(body) }),
    }),
    deleteSuperAdminNotifTemplate: builder.mutation<void, string>({
      query: (id) => ({ url: `/admin/superadmin/notification-templates/${id}`, method: "DELETE" }),
    }),

    // Security & compliance
    getSecurityPolicy: builder.query<SecurityPolicy, void>({
      query: () => "/admin/superadmin/security-policy",
      transformResponse: obj,
    }),
    updateSecurityPolicy: builder.mutation<SecurityPolicy, Partial<SecurityPolicy>>({
      query: (body) => ({ url: "/admin/superadmin/security-policy", method: "PUT", body: cmd(body) }),
    }),
    getComplianceConfig: builder.query<ComplianceConfig, void>({
      query: () => "/admin/superadmin/compliance-config",
      transformResponse: obj,
    }),
    updateComplianceConfig: builder.mutation<ComplianceConfig, Partial<ComplianceConfig>>({
      query: (body) => ({ url: "/admin/superadmin/compliance-config", method: "PUT", body: cmd(body) }),
    }),

    // Platform analytics
    getPlatformAnalytics: builder.query<PlatformAnalytics, void>({
      query: () => "/admin/superadmin/analytics",
      transformResponse: obj,
    }),

    // Cross-tenant users
    listSuperAdminUsers: builder.query<SuperAdminUser[], void>({
      query: () => "/admin/superadmin/users",
      transformResponse: items,
      providesTags: ["User"],
    }),
  }),
});

export const {
  useListTenantsQuery,
  useCreateTenantMutation,
  useGetTenantQuery,
  useUpdateTenantMutation,
  useListOrgNodesQuery,
  useCreateOrgNodeMutation,
  useUpdateOrgNodeMutation,
  useMoveOrgNodeMutation,
  useListAdminUsersQuery,
  useInviteUserMutation,
  useRevokeUserMutation,
  useUpdateUserRolesMutation,
  useListRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useListPermissionsQuery,
  useUpdateRolePermissionsMutation,
  useListWorkflowsQuery,
  useUpdateWorkflowMutation,
  useListEscalationRulesQuery,
  useUpdateEscalationRuleMutation,
  useListNotificationTemplatesQuery,
  useUpdateNotificationTemplateMutation,
  useListRetentionRulesQuery,
  useUpdateRetentionRuleMutation,
  useGetSystemSettingsQuery,
  useUpdateSystemSettingsMutation,
  useListDataQualityIssuesQuery,
  useResolveDataQualityIssueMutation,
  useListAdminAuditLogsQuery,
  useGetAdminAuditLogQuery,
  useListSuperAdminInvitationsQuery,
  useCreateSuperAdminInvitationMutation,
  useResendSuperAdminInvitationMutation,
  useCancelSuperAdminInvitationMutation,
  useListSubscriptionPlansQuery,
  useCreateSubscriptionPlanMutation,
  useUpdateSubscriptionPlanMutation,
  useAssignTenantSubscriptionMutation,
  useListSuperAdminNotifTemplatesQuery,
  useCreateSuperAdminNotifTemplateMutation,
  useUpdateSuperAdminNotifTemplateMutation,
  useDeleteSuperAdminNotifTemplateMutation,
  useGetSecurityPolicyQuery,
  useUpdateSecurityPolicyMutation,
  useGetComplianceConfigQuery,
  useUpdateComplianceConfigMutation,
  useGetPlatformAnalyticsQuery,
  useListSuperAdminUsersQuery,
} = adminApi;
