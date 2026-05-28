import { Navigate } from "react-router";

export function CSVImportPage() {
  return <Navigate to="/data-management?tab=csv-import" replace />;
}
