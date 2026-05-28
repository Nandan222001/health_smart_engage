import { ShieldAlert } from "lucide-react";
import { ReportPageLayout } from "./_ReportPageLayout";

export function ComplianceReportsPage() {
  return (
    <ReportPageLayout
      reportType="compliance"
      title="Compliance Reports"
      description="Compliance scores, standards tracking, open gaps, and overdue reviews"
      icon={ShieldAlert}
    />
  );
}
