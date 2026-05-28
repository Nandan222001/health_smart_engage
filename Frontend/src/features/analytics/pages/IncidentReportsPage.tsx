import { AlertTriangle } from "lucide-react";
import { ReportPageLayout } from "./_ReportPageLayout";

export function IncidentReportsPage() {
  return (
    <ReportPageLayout
      reportType="incident"
      title="Incident Reports"
      description="Detailed incident analysis, trends, and root cause summaries"
      icon={AlertTriangle}
    />
  );
}
