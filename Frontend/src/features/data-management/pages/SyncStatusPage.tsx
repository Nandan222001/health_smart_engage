import { Navigate } from "react-router";

export function SyncStatusPage() {
  return <Navigate to="/data-management?tab=sync-status" replace />;
}
