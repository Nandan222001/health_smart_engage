import { TrendingUp } from "lucide-react";
import { ReportPageLayout } from "./_ReportPageLayout";

export function KpiReportsPage() {
  return (
    <ReportPageLayout
      reportType="kpi"
      title="KPI Reports"
      description="Key performance indicators and safety metrics across your organisation"
      icon={TrendingUp}
    />
  );
}
