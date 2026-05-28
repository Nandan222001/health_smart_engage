import { Users } from "lucide-react";
import { ReportPageLayout } from "./_ReportPageLayout";

export function WorkforceReportsPage() {
  return (
    <ReportPageLayout
      reportType="workforce"
      title="Workforce Reports"
      description="Employee safety metrics, active workers, incident rates, and near misses"
      icon={Users}
    />
  );
}
