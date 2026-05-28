import { CheckCircle2 } from "lucide-react";
import { ReportPageLayout } from "./_ReportPageLayout";

export function AuditReportsPage() {
  return (
    <ReportPageLayout
      reportType="audit"
      title="Audit Reports"
      description="Audit findings, open actions, and compliance record summaries"
      icon={CheckCircle2}
    />
  );
}
