import { Navigate } from "react-router";

export default function AdminIncidentReportsPage() {
  return <Navigate to="/incidents?tab=analytics" replace />;
}
