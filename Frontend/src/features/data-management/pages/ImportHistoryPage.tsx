import { Navigate } from "react-router";

export function ImportHistoryPage() {
  return <Navigate to="/data-management?tab=import-history" replace />;
}
