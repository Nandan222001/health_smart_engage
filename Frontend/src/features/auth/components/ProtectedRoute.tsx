import { Navigate } from "react-router";
import { useLocation } from "react-router";
import { useAuth } from "@/app/context/AuthContext";
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

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // Keep these props accepted for compatibility, but do not fallback to base URL.
  void requiredModule;
  void hideForOnboardingScoped;

  const setupRequired = Boolean(user?.onboardingSetupRequired && !user?.onboardingSetupCompleted);
  // First-time invited org admins must complete org setup before accessing any other page.
  if (setupRequired && location.pathname !== "/org-setup") {
    return <Navigate to="/org-setup" replace />;
  }

  return <>{children}</>;
}
