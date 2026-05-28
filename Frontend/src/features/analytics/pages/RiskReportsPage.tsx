import { TrendingDown } from "lucide-react";
import { ReportPageLayout } from "./_ReportPageLayout";

export function RiskReportsPage() {
  return (
    <ReportPageLayout
      reportType="risk"
      title="Risk Reports"
      description="Risk assessments, high/medium risk items, and controls review status"
      icon={TrendingDown}
    />
  );
}
