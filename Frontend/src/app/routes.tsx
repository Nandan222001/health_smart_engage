import { createBrowserRouter, Navigate, useRouteError } from "react-router";
import { AppLayout } from "@/shared/components/layout/AppLayout";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { ViolationsPage } from "@/features/violations/pages/ViolationsPage";
import { ViolationDetailPage } from "@/features/violations/pages/ViolationDetailPage";
import { PoliciesPage } from "@/features/policies/pages/PoliciesPage";
import { SitesZonesPage } from "@/features/sites/pages/SitesZonesPage";
import { SiteOperationsPage } from "@/features/sites/pages/SiteOperationsPage";
import { CamerasDevicesPage } from "@/features/cameras/pages/CamerasDevicesPage";
import { UsersPage } from "@/features/users/pages/UsersPage";
import { VendorsPage } from "@/features/vendors/pages/VendorsPage";
import { VendorCompliancePage } from "@/features/vendors/pages/VendorCompliancePage";
import { VendorCertificationsPage } from "@/features/vendors/pages/VendorCertificationsPage";
import { VendorRiskScorePage } from "@/features/vendors/pages/VendorRiskScorePage";
import { ActionsPage } from "@/features/actions/pages/ActionsPage";
import { AnalyticsPage } from "@/features/analytics/pages/AnalyticsPage";
import { KpiReportsPage } from "@/features/analytics/pages/KpiReportsPage";
import { IncidentReportsPage } from "@/features/analytics/pages/IncidentReportsPage";
import { AuditReportsPage } from "@/features/analytics/pages/AuditReportsPage";
import { ComplianceReportsPage } from "@/features/analytics/pages/ComplianceReportsPage";
import { RiskReportsPage } from "@/features/analytics/pages/RiskReportsPage";
import { WorkforceReportsPage } from "@/features/analytics/pages/WorkforceReportsPage";
import { AIAgentPage } from "@/features/ai-agent/pages/AIAgentPage";
import { CompliancePage } from "@/features/compliance/pages/CompliancePage";
import { ChecklistPage } from "@/features/checklists/pages/ChecklistPage";
import { BillingPage } from "@/features/billing/pages/BillingPage";
import { NotificationsPage } from "@/features/notifications/pages/NotificationsPage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { SubscriptionPage } from "@/features/subscription/pages/SubscriptionPage";
import { NearMissPage } from "@/features/near-miss/pages/NearMissPage";
import { RiskPage } from "@/features/risk/pages/RiskPage";
import { RiskAssessmentsPage } from "@/features/risk/pages/RiskAssessmentsPage";
import { AssetsPage } from "@/features/assets/pages/AssetsPage";
import { AssetRegisterPage } from "@/features/assets/pages/AssetRegisterPage";
import { AssetCategoriesPage } from "@/features/assets/pages/AssetCategoriesPage";
import { MaintenanceLogsPage } from "@/features/assets/pages/MaintenanceLogsPage";
import { EquipmentInspectionsPage } from "@/features/assets/pages/EquipmentInspectionsPage";
import { AssetRiskMappingPage } from "@/features/assets/pages/AssetRiskMappingPage";
import { ComplianceDashboardPage } from "@/features/compliance/pages/ComplianceDashboardPage";
import { StandardsPoliciesPage } from "@/features/compliance/pages/StandardsPoliciesPage";
import { AuditManagementPage } from "@/features/compliance/pages/AuditManagementPage";
import { InspectionsPage } from "@/features/compliance/pages/InspectionsPage";
import { CAPAPage } from "@/features/compliance/pages/CAPAPage";
import { RegulatoryTrackingPage } from "@/features/compliance/pages/RegulatoryTrackingPage";
import { DocumentationPage } from "@/features/compliance/pages/DocumentationPage";
import { OnboardingPage } from "@/features/auth/pages/OnboardingPage";
// Org Admin pages
import { OrgInvitationsPage } from "@/features/admin/pages/OrgInvitationsPage";
import { DepartmentsPage } from "@/features/admin/pages/DepartmentsPage";
import { HSEManagersPage } from "@/features/admin/pages/HSEManagersPage";
import { ManagementReportsPage } from "@/features/admin/pages/ManagementReportsPage";
import { OrganizationSettingsPage } from "@/features/admin/pages/OrganizationSettingsPage";
import { SiteSettingsPage } from "@/features/admin/pages/SiteSettingsPage";
import { WorkflowSettingsPage } from "@/features/admin/pages/WorkflowSettingsPage";
import { ApprovalMatrixPage } from "@/features/admin/pages/ApprovalMatrixPage";
import { NotificationSettingsPage } from "@/features/admin/pages/NotificationSettingsPage";
import { SecuritySettingsPage } from "@/features/admin/pages/SecuritySettingsPage";
import { ApiSettingsPage } from "@/features/admin/pages/ApiSettingsPage";
import { AdminDocumentationPage } from "@/features/admin/pages/AdminDocumentationPage";
import { SupportTicketsPage } from "@/features/admin/pages/SupportTicketsPage";
// Super Admin
import { SuperAdminDashboard } from "@/features/superadmin/pages/SuperAdminDashboard";
import { TenantListPage } from "@/features/superadmin/pages/TenantListPage";
import { OnboardingWizardPage } from "@/features/superadmin/pages/OnboardingWizardPage";
import { StorageLayerPage } from "@/features/superadmin/pages/StorageLayerPage";
import { InvitationsPage } from "@/features/superadmin/pages/InvitationsPage";
import { TenantDetailPage } from "@/features/superadmin/pages/TenantDetailPage";
import { RolesPermissionsPage as SuperAdminRolesPage } from "@/features/superadmin/pages/RolesPermissionsPage";
import { RolesPermissionsPage } from "@/features/roles/pages/RolesPermissionsPage";
import { SubscriptionsPage } from "@/features/superadmin/pages/SubscriptionsPage";
import { PlatformAnalyticsPage } from "@/features/superadmin/pages/PlatformAnalyticsPage";
import { NotificationsEnginePage } from "@/features/superadmin/pages/NotificationsEnginePage";
import { SystemSettingsPage } from "@/features/superadmin/pages/SystemSettingsPage";
import { PlatformAuditLogsPage } from "@/features/superadmin/pages/PlatformAuditLogsPage";
import { SuperAdminUsersPage } from "@/features/superadmin/pages/SuperAdminUsersPage";
// AI Intelligence (Layer 4)
import { AIIntelligencePage } from "@/features/ai-intelligence/pages/AIIntelligencePage";
import { AIDashboardPage } from "@/features/ai-intelligence/pages/AIDashboardPage";
import { ComplianceIntelligencePage } from "@/features/compliance/pages/ComplianceIntelligencePage";
import { SafetyRecommendationsPage } from "@/features/ai-intelligence/pages/SafetyRecommendationsPage";
import { TrendAnalysisPage } from "@/features/ai-intelligence/pages/TrendAnalysisPage";
import { BenchmarkingPage } from "@/features/ai-intelligence/pages/BenchmarkingPage";
// Decision & Workflow Engine (Layer 5)
import { WorkflowEnginePage } from "@/features/workflow/pages/WorkflowEnginePage";
import { WorkflowManagementPage } from "@/features/workflow/pages/WorkflowManagementPage";
// Outputs – Visibility & Intelligence (Layer 6)
import { OutputsPage } from "@/features/outputs/pages/OutputsPage";
// Continuous Learning Loop (Layer 7)
import { ContinuousLearningPage } from "@/features/learning/pages/ContinuousLearningPage";
// New feature pages
import { PermitsPage } from "@/features/permits/pages/PermitsPage";
import { IncidentsPage } from "@/features/incidents/pages/IncidentsPage";
import AdminIncidentReportsPage from "@/features/incidents/pages/AdminIncidentReportsPage";
import { IncidentSeverityPage } from "@/features/incidents/pages/IncidentSeverityPage";
import { InvestigationStatusPage } from "@/features/incidents/pages/InvestigationStatusPage";
import { RootCausesPage } from "@/features/incidents/pages/RootCausesPage";
import { EmployeesPage } from "@/features/employees/pages/EmployeesPage";
import { TrainingCompetencyPage } from "@/features/training/pages/TrainingCompetencyPage";
import { AuditsPage } from "@/features/audits/pages/AuditsPage";
import { HazardsPage } from "@/features/hazards/pages/HazardsPage";
import { HazardListPage } from "@/features/hazards/pages/HazardListPage";
import { RiskMatrixPage } from "@/features/risk/pages/RiskMatrixPage";
import { HighRiskAreasPage } from "@/features/risk/pages/HighRiskAreasPage";
import { PredictiveRiskAIPage } from "@/features/risk/pages/PredictiveRiskAIPage";
import { RiskPredictionsPage } from "@/features/risk/pages/RiskPredictionsPage";
import { ApprovalQueuePage } from "@/features/permits/pages/ApprovalQueuePage";
import { PermitRequestsPage } from "@/features/permits/pages/PermitRequestsPage";
import { ActiveWorkPermitsPage } from "@/features/permits/pages/ActiveWorkPermitsPage";
import { OrgSetupWizardPage } from "@/features/org-setup/pages/OrgSetupWizardPage";
import { OverviewPage } from "@/features/overview/pages/OverviewPage";
import { KPIsPage } from "@/features/kpis/pages/KPIsPage";
import { ActivitiesPage } from "@/features/activities/pages/ActivitiesPage";
import { ShiftDashboardPage } from "@/features/shift-management/pages/ShiftDashboardPage";
import { DataManagementPage } from "@/features/data-management/pages/DataManagementPage";
import { CSVImportPage } from "@/features/data-management/pages/CSVImportPage";
import { ImportHistoryPage } from "@/features/data-management/pages/ImportHistoryPage";
import { ValidationLogsPage } from "@/features/data-management/pages/ValidationLogsPage";
import { SyncStatusPage }     from "@/features/data-management/pages/SyncStatusPage";
import { HelpPage } from "@/features/help/pages/HelpPage";
import { ContactSupportPage } from "@/features/help/pages/ContactSupportPage";
import { WorkersPage } from "@/features/workers/pages/WorkersPage";

import { SupervisorsPage } from "@/features/supervisors/pages/SupervisorsPage";
import { HSEManagersScreen } from "@/features/hse-managers/pages/HSEManagersScreen";
import { AuditorsPage } from "@/features/auditors/pages/AuditorsPage";
import { ContractorsPage } from "@/features/contractors/pages/ContractorsPage";
import type { ComponentType } from "react";

function RouteErrorFallback() {
  const error = useRouteError() as { message?: string; statusText?: string } | undefined;
  const detail = error?.message || error?.statusText || "Unexpected route error";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#F3F7FF",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 600,
          background: "#fff",
          border: "1px solid #D6E4FF",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ margin: "0 0 8px", color: "#0A0A0A" }}>Page failed to load</h2>
        <p style={{ margin: "0 0 12px", color: "#374151" }}>An unexpected app error occurred.</p>
        <p style={{ margin: "0 0 16px", color: "#6B7280", fontSize: 13 }}>Details: {detail}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            background: "linear-gradient(135deg, #0B3D91, #1D4ED8)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </div>
    </div>
  );
}

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  );
}

const DashboardRoute = DashboardPage;
const ViolationsRoute = ViolationsPage;
const ViolationDetailRoute = ViolationDetailPage;
const ActionsRoute = ActionsPage;
const ChecklistsRoute = ChecklistPage;
const ComplianceRoute = CompliancePage;
const SitesZonesRoute = SitesZonesPage;
const CamerasDevicesRoute = CamerasDevicesPage;
const AIAgentRoute = AIAgentPage;
const AnalyticsRoute = AnalyticsPage;
const NearMissRoute = NearMissPage;
const RootCauseAnalysisRoute = RiskPage;
const EquipmentCertificationRoute = AssetsPage;

function hiddenForOnboarding<T extends object>(Component: ComponentType<T>) {
  return function HiddenForOnboardingScopedRoute(props: T) {
    return (
      <ProtectedRoute hideForOnboardingScoped>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

const PoliciesRoute = hiddenForOnboarding(PoliciesPage);
const UsersRoute = UsersPage;
const VendorsRoute = VendorsPage;
const BillingRoute = hiddenForOnboarding(BillingPage);
const NotificationsRoute = NotificationsPage;
const EngagementRoute = NotificationsPage;
const SettingsRoute = hiddenForOnboarding(SettingsPage);
const SubscriptionRoute = hiddenForOnboarding(SubscriptionPage);

export const router = createBrowserRouter([
  {
    path: "/auth/login",
    Component: LoginPage,
    errorElement: <RouteErrorFallback />,
  },
  {
    path: "/auth/signup",
    Component: () => <Navigate to="/auth/login?mode=signup" replace />,
  },
  {
    path: "/auth/onboarding",
    Component: OnboardingPage,
  },
  {
    path: "/auth/onboarding/form",
    Component: OnboardingPage,
  },
  {
    path: "/auth/onboarding/admin",
    Component: OnboardingPage,
  },
  {
    path: "/auth/onboarding/tracker",
    Component: OnboardingPage,
  },
  {
    path: "/login",
    Component: () => <Navigate to="/auth/login" replace />,
  },
  {
    path: "/onboarding",
    Component: () => <Navigate to="/auth/onboarding" replace />,
  },
  {
    path: "/onboarding/form",
    Component: () => <Navigate to="/auth/onboarding/form" replace />,
  },
  {
    path: "/onboarding/admin",
    Component: () => <Navigate to="/auth/onboarding/admin" replace />,
  },
  {
    path: "/onboarding/tracker",
    Component: () => <Navigate to="/auth/onboarding/tracker" replace />,
  },
  {
    path: "/",
    Component: ProtectedLayout,
    errorElement: <RouteErrorFallback />,
    children: [
      { index: true, Component: DashboardRoute },
      { path: "violations", Component: ViolationsRoute },
      { path: "violations/:id", Component: ViolationDetailRoute },
      { path: "actions", Component: ActionsRoute },
      { path: "checklists", Component: ChecklistsRoute },
      { path: "compliance", Component: ComplianceRoute },
      { path: "sites-zones", Component: SiteOperationsPage },
      { path: "cameras-devices", Component: CamerasDevicesRoute },
      { path: "policies", Component: PoliciesRoute },
      { path: "users", Component: UsersRoute },
      { path: "vendors", Component: VendorsRoute },
      { path: "vendor-compliance",    Component: VendorCompliancePage },
      { path: "vendor-certifications", Component: VendorCertificationsPage },
      { path: "vendor-risk-score",     Component: VendorRiskScorePage },
      { path: "analytics", Component: AnalyticsRoute },
      { path: "kpi-reports", Component: KpiReportsPage },
      { path: "audit-reports", Component: AuditReportsPage },
      { path: "compliance-reports", Component: ComplianceReportsPage },
      { path: "risk-reports", Component: RiskReportsPage },
      { path: "workforce-reports", Component: WorkforceReportsPage },
      { path: "ai-agent", Component: AIAgentRoute },
      { path: "billing", Component: BillingRoute },
      { path: "notifications", Component: NotificationsRoute },
      { path: "engagement", Component: EngagementRoute },
      { path: "settings", Component: SettingsRoute },
      { path: "subscription", Component: SubscriptionRoute },
      { path: "near-miss", Component: NearMissRoute },
      { path: "root-cause-analysis", Component: RootCauseAnalysisRoute },
      { path: "risk-assessments",     Component: RiskAssessmentsPage },
      { path: "equipment-certification", Component: EquipmentCertificationRoute },
      { path: "asset-register",          Component: AssetRegisterPage },
      { path: "asset-categories",        Component: AssetCategoriesPage },
      { path: "maintenance-logs",        Component: MaintenanceLogsPage },
      { path: "equipment-inspections",   Component: EquipmentInspectionsPage },
      { path: "asset-risk-mapping",      Component: AssetRiskMappingPage },
      { path: "compliance-dashboard",    Component: ComplianceDashboardPage },
      { path: "standards-policies",      Component: StandardsPoliciesPage },
      { path: "audit-management",        Component: AuditManagementPage },
      { path: "inspections",             Component: InspectionsPage },
      { path: "capa",                    Component: CAPAPage },
      { path: "regulatory-tracking",    Component: RegulatoryTrackingPage },
      { path: "documentation",          Component: DocumentationPage },
      // New operational pages
      { path: "permits", Component: PermitsPage },
      { path: "incidents", Component: IncidentsPage },
      { path: "incident-management", Component: AdminIncidentReportsPage },
      { path: "incident-reports", Component: IncidentReportsPage },
      { path: "incident-severity",    Component: IncidentSeverityPage },
      { path: "investigation-status", Component: InvestigationStatusPage },
      { path: "root-causes",          Component: RootCausesPage },
      { path: "employees", Component: EmployeesPage },
      { path: "training", Component: TrainingCompetencyPage },
      { path: "audits", Component: AuditsPage },
      { path: "hazards",         Component: HazardsPage },
      { path: "hazard-list",    Component: HazardListPage },
      { path: "risk-matrix",    Component: RiskMatrixPage },
      { path: "high-risk-areas",    Component: HighRiskAreasPage },
      { path: "predictive-risk-ai",  Component: PredictiveRiskAIPage },
      { path: "risk-predictions",    Component: RiskPredictionsPage },
      { path: "approval-queue",    Component: ApprovalQueuePage },
      { path: "permit-requests",   Component: PermitRequestsPage },
      { path: "active-work-permits", Component: ActiveWorkPermitsPage },
      // Org Admin pages
      { path: "roles-permissions", Component: RolesPermissionsPage },
      { path: "admin/invitations", Component: OrgInvitationsPage },
      { path: "admin/departments", Component: DepartmentsPage },
      { path: "admin/hse-managers", Component: HSEManagersPage },
      { path: "admin/management-reports", Component: ManagementReportsPage },
      { path: "admin/organization-settings", Component: OrganizationSettingsPage },
      { path: "admin/site-settings",        Component: SiteSettingsPage },
      { path: "admin/workflow-settings",   Component: WorkflowSettingsPage },
      { path: "admin/approval-matrix",        Component: ApprovalMatrixPage },
      { path: "admin/notification-settings", Component: NotificationSettingsPage },
      { path: "admin/security-settings", Component: SecuritySettingsPage },
      { path: "admin/api-settings",      Component: ApiSettingsPage },
      { path: "admin/documentation",     Component: AdminDocumentationPage },
      { path: "admin/support-tickets",   Component: SupportTicketsPage },
      { path: "org-setup", Component: OrgSetupWizardPage },
      { path: "overview", Component: OverviewPage },
      { path: "kpis", Component: KPIsPage },
      { path: "activities", Component: ActivitiesPage },
      { path: "shift-management", Component: ShiftDashboardPage },
      { path: "workers", Component: WorkersPage },
      { path: "supervisors", Component: SupervisorsPage },
      { path: "hse-managers", Component: HSEManagersScreen },
      { path: "auditors", Component: AuditorsPage },
      { path: "contractors", Component: ContractorsPage },
      { path: "data-management", Component: DataManagementPage },
      { path: "data-management/documents", Component: DataManagementPage },
      { path: "csv-import",      Component: CSVImportPage      },
      { path: "import-history",  Component: ImportHistoryPage  },
      { path: "validation-logs", Component: ValidationLogsPage },
      { path: "sync-status",     Component: SyncStatusPage     },
      { path: "api-integrations", Component: ApiSettingsPage },
      { path: "help", Component: HelpPage },
      { path: "contact-support", Component: ContactSupportPage },
      // Super Admin pages
      { path: "superadmin", Component: SuperAdminDashboard },
      { path: "superadmin/tenants", Component: TenantListPage },
      { path: "superadmin/onboarding-wizard", Component: OnboardingWizardPage },
      { path: "superadmin/users", Component: SuperAdminUsersPage },
      { path: "superadmin/storage", Component: StorageLayerPage },
      { path: "superadmin/invitations", Component: InvitationsPage },
      { path: "superadmin/roles", Component: SuperAdminRolesPage },
      { path: "superadmin/subscriptions", Component: SubscriptionsPage },
      { path: "superadmin/analytics", Component: PlatformAnalyticsPage },
      { path: "superadmin/notifications", Component: NotificationsEnginePage },
      { path: "superadmin/settings", Component: SystemSettingsPage },
      { path: "superadmin/audit-logs", Component: PlatformAuditLogsPage },
      { path: "superadmin/tenants/:tenantId", Component: TenantDetailPage },
      // AI Intelligence Layer 4
      { path: "ai-dashboard", Component: AIDashboardPage },
      { path: "ai-intelligence", Component: AIIntelligencePage },
      { path: "compliance-intelligence",   Component: ComplianceIntelligencePage },
      { path: "safety-recommendations",   Component: SafetyRecommendationsPage },
      { path: "trend-analysis",           Component: TrendAnalysisPage },
      { path: "benchmarking",             Component: BenchmarkingPage },
      // Decision & Workflow Engine Layer 5
      { path: "workflow", Component: WorkflowEnginePage },
      { path: "workflow-management", Component: WorkflowManagementPage },
      // Outputs – Visibility & Intelligence Layer 6
      { path: "outputs", Component: OutputsPage },
      // Continuous Learning Loop Layer 7
      { path: "learning", Component: ContinuousLearningPage },
    ],
  },
  {
    path: "*",
    Component: () => <Navigate to="/auth/login" replace />,
    errorElement: <RouteErrorFallback />,
  },
]);
