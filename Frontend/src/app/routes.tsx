import { createBrowserRouter, Navigate, useRouteError } from "react-router";
import { AppLayout } from "@/shared/components/layout/AppLayout";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { ViolationsPage } from "@/features/violations/pages/ViolationsPage";
import { ViolationDetailPage } from "@/features/violations/pages/ViolationDetailPage";
import { PoliciesPage } from "@/features/policies/pages/PoliciesPage";
import { SitesZonesPage } from "@/features/sites/pages/SitesZonesPage";
import { CamerasDevicesPage } from "@/features/cameras/pages/CamerasDevicesPage";
import { UsersPage } from "@/features/users/pages/UsersPage";
import { VendorsPage } from "@/features/vendors/pages/VendorsPage";
import { ActionsPage } from "@/features/actions/pages/ActionsPage";
import { AnalyticsPage } from "@/features/analytics/pages/AnalyticsPage";
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
import { AssetsPage } from "@/features/assets/pages/AssetsPage";
import { OnboardingPage } from "@/features/auth/pages/OnboardingPage";
// Super Admin
import { SuperAdminDashboard } from "@/features/superadmin/pages/SuperAdminDashboard";
import { TenantListPage } from "@/features/superadmin/pages/TenantListPage";
import { OnboardingWizardPage } from "@/features/superadmin/pages/OnboardingWizardPage";
import { StorageLayerPage } from "@/features/superadmin/pages/StorageLayerPage";
// AI Intelligence (Layer 4)
import { AIIntelligencePage } from "@/features/ai-intelligence/pages/AIIntelligencePage";
// Decision & Workflow Engine (Layer 5)
import { WorkflowEnginePage } from "@/features/workflow/pages/WorkflowEnginePage";
// New feature pages
import { PermitsPage } from "@/features/permits/pages/PermitsPage";
import { IncidentsPage } from "@/features/incidents/pages/IncidentsPage";
import { EmployeesPage } from "@/features/employees/pages/EmployeesPage";
import { TrainingPage } from "@/features/training/pages/TrainingPage";
import { AuditsPage } from "@/features/audits/pages/AuditsPage";
import { HazardsPage } from "@/features/hazards/pages/HazardsPage";
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
      { path: "sites-zones", Component: SitesZonesRoute },
      { path: "cameras-devices", Component: CamerasDevicesRoute },
      { path: "policies", Component: PoliciesRoute },
      { path: "users", Component: UsersRoute },
      { path: "vendors", Component: VendorsRoute },
      { path: "analytics", Component: AnalyticsRoute },
      { path: "ai-agent", Component: AIAgentRoute },
      { path: "billing", Component: BillingRoute },
      { path: "notifications", Component: NotificationsRoute },
      { path: "engagement", Component: EngagementRoute },
      { path: "settings", Component: SettingsRoute },
      { path: "subscription", Component: SubscriptionRoute },
      { path: "near-miss", Component: NearMissRoute },
      { path: "root-cause-analysis", Component: RootCauseAnalysisRoute },
      { path: "equipment-certification", Component: EquipmentCertificationRoute },
      // New operational pages
      { path: "permits", Component: PermitsPage },
      { path: "incidents", Component: IncidentsPage },
      { path: "employees", Component: EmployeesPage },
      { path: "training", Component: TrainingPage },
      { path: "audits", Component: AuditsPage },
      { path: "hazards", Component: HazardsPage },
      // Super Admin pages
      { path: "superadmin", Component: SuperAdminDashboard },
      { path: "superadmin/tenants", Component: TenantListPage },
      { path: "superadmin/onboarding-wizard", Component: OnboardingWizardPage },
      { path: "superadmin/users", Component: UsersPage },
      { path: "superadmin/storage", Component: StorageLayerPage },
      // AI Intelligence Layer 4
      { path: "ai-intelligence", Component: AIIntelligencePage },
      // Decision & Workflow Engine Layer 5
      { path: "workflow", Component: WorkflowEnginePage },
    ],
  },
  {
    path: "*",
    Component: () => <Navigate to="/auth/login" replace />,
    errorElement: <RouteErrorFallback />,
  },
]);
