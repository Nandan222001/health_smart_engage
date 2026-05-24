import { useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

type TimeRange = "Today" | "This Week" | "This Month" | "This Year";

const TIME_RANGES: TimeRange[] = ["Today", "This Week", "This Month", "This Year"];

interface KPI {
  name: string;
  value: string;
  trend: "up" | "down";
  trendValue: string;
  positive: boolean; // true if "up" is good
}

const kpis: KPI[] = [
  { name: "TRIR", value: "0.42", trend: "down", trendValue: "0.05", positive: false },
  { name: "LTIR", value: "0.08", trend: "down", trendValue: "0.02", positive: false },
  { name: "Near Miss Rate", value: "2.1", trend: "up", trendValue: "0.3", positive: true },
  { name: "Compliance Rate", value: "94%", trend: "up", trendValue: "2%", positive: true },
  { name: "Open CAPAs", value: "7", trend: "down", trendValue: "3", positive: false },
  { name: "Audit Completion", value: "87%", trend: "up", trendValue: "4%", positive: true },
  { name: "PTW Active", value: "14", trend: "up", trendValue: "2", positive: true },
  { name: "Training Completion", value: "91%", trend: "up", trendValue: "1%", positive: true },
];

interface KPITarget {
  kpi: string;
  target: string;
  actual: string;
  status: "On Track" | "At Risk" | "Breached";
}

const kpiTargets: KPITarget[] = [
  { kpi: "TRIR", target: "< 0.50", actual: "0.42", status: "On Track" },
  { kpi: "LTIR", target: "< 0.10", actual: "0.08", status: "On Track" },
  { kpi: "Near Miss Rate", target: "> 1.5", actual: "2.1", status: "On Track" },
  { kpi: "Compliance Rate", target: "> 90%", actual: "94%", status: "On Track" },
  { kpi: "Open CAPAs", target: "< 5", actual: "7", status: "At Risk" },
  { kpi: "Audit Completion", target: "> 90%", actual: "87%", status: "At Risk" },
  { kpi: "PTW Active", target: "< 20", actual: "14", status: "On Track" },
  { kpi: "Training Completion", target: "> 95%", actual: "91%", status: "Breached" },
];

const statusStyles: Record<KPITarget["status"], { bg: string; color: string }> = {
  "On Track": { bg: "#D1FAE5", color: "#10B981" },
  "At Risk": { bg: "#FEF3C7", color: "#F59E0B" },
  "Breached": { bg: "#FEE2E2", color: "#EF4444" },
};

export function KPIsPage() {
  const [activeRange, setActiveRange] = useState<TimeRange>("This Month");

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Real-Time KPIs</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Live safety performance indicators</p>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-1 bg-white rounded-xl border p-1 w-fit" style={{ borderColor: "#E3E9F6" }}>
        {TIME_RANGES.map((range) => (
          <button
            key={range}
            onClick={() => setActiveRange(range)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={
              activeRange === range
                ? { background: "linear-gradient(135deg, #4A57B9, #6F80E8)", color: "#fff" }
                : { color: "#6B7280" }
            }
          >
            {range}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(({ name, value, trend, trendValue, positive }) => {
          const isGood = trend === "up" ? positive : !positive;
          const trendColor = isGood ? "#10B981" : "#EF4444";
          return (
            <div key={name} className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
              <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#6B7280" }}>{name}</div>
              <div className="text-3xl font-bold mb-2" style={{ color: "#111827" }}>{value}</div>
              <div className="flex items-center gap-1">
                {trend === "up" ? (
                  <TrendingUp className="w-4 h-4" style={{ color: trendColor }} />
                ) : (
                  <TrendingDown className="w-4 h-4" style={{ color: trendColor }} />
                )}
                <span className="text-xs font-semibold" style={{ color: trendColor }}>
                  {trend === "up" ? "+" : "-"}{trendValue}
                </span>
                <span className="text-xs" style={{ color: "#9CA3AF" }}>vs last period</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* KPI Targets Table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#E9EEF8" }}>
          <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>KPI Targets</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
              {["KPI", "Target", "Actual", "Status"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kpiTargets.map((row) => (
              <tr key={row.kpi} className="border-t hover:bg-gray-50" style={{ borderColor: "#E3E9F6" }}>
                <td className="px-5 py-3.5 font-semibold" style={{ color: "#111827" }}>{row.kpi}</td>
                <td className="px-5 py-3.5" style={{ color: "#6B7280" }}>{row.target}</td>
                <td className="px-5 py-3.5 font-semibold" style={{ color: "#374151" }}>{row.actual}</td>
                <td className="px-5 py-3.5">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: statusStyles[row.status].bg, color: statusStyles[row.status].color }}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
