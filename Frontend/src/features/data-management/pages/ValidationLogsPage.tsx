import { Navigate } from "react-router";

export function ValidationLogsPage() {
  return <Navigate to="/data-management?tab=validation-logs" replace />;
}
