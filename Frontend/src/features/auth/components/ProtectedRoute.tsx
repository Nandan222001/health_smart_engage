import { Navigate } from "react-router";
import { useLocation } from "react-router";
import { useAuth } from "@/app/context/AuthContext";
import { useGetOrgSetupProgressQuery } from "@/features/org-setup/api/orgSetupApi";
import type { ReactNode } from "react";
import type { UiModuleLabel } from "@/app/context/AuthContext";

export function ProtectedRoute({
  children,
  requiredModule,
  hideForOnboardingScoped,
}: {
  children: ReactNode;
  requiredModule?: UiModuleLabel;
  hideForOnboardingScoped?: boolean;
}) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Keep these props accepted for compatibility.
  void requiredModule;
  void hideForOnboardingScoped;

  const isSuperAdmin = Boolean(user?.is_superadmin);

  // Always verify org setup activation from the backend so page-refresh and
  // direct URL access are properly guarded (localStorage can be stale).
  const { data: progress, isLoading: progressLoading } = useGetOrgSetupProgressQuery(undefined, {
    skip: !isAuthenticated || isSuperAdmin,
  });

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // While the activation check is in flight, render nothing to avoid a flash.
  if (!isSuperAdmin && progressLoading) {
    return null;
  }

  const orgSetupDone = isSuperAdmin || Boolean(progress?.activated);
  if (!orgSetupDone && location.pathname !== "/org-setup") {
    return <Navigate to="/org-setup" replace />;
  }

  return <>{children}</>;
}
