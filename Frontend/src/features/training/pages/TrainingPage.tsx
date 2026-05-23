import { BookOpen, AlertCircle, Users, CheckCircle2 } from "lucide-react";
import { useListTrainingGapsQuery, useGetTrainingMatrixQuery } from "@/features/training/api/trainingApi";
import type { TrainingGap } from "@/features/training/api/trainingApi";

const PRIORITY_COLOR: Record<string, string> = {
  low: "#10B981", medium: "#F59E0B", high: "#EF4444",
};

function GapRow({ gap }: { gap: TrainingGap }) {
  return (
    <tr className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
      <td className="px-5 py-3.5">
        <div className="text-sm font-semibold" style={{ color: "#111827" }}>{gap.employee_name}</div>
        <div className="text-xs" style={{ color: "#9CA3AF" }}>{gap.role}</div>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex flex-wrap gap-1">
          {gap.missing_courses.map((c) => (
            <span key={c} className="px-2 py-0.5 rounded-md text-xs" style={{ background: "#FEF3C7", color: "#92400E" }}>{c}</span>
          ))}
        </div>
      </td>
      <td className="px-5 py-3.5">
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ background: PRIORITY_COLOR[gap.priority] + "1A", color: PRIORITY_COLOR[gap.priority] }}>
          {gap.priority}
        </span>
      </td>
    </tr>
  );
}

export function TrainingPage() {
  const { data: gaps = [], isLoading: gapsLoading } = useListTrainingGapsQuery();
  const { isLoading: matrixLoading } = useGetTrainingMatrixQuery();

  const high = gaps.filter((g) => g.priority === "high").length;
  const medium = gaps.filter((g) => g.priority === "medium").length;
  const compliant = 0; // would come from real data

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Training & Compliance</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Training matrix, gaps, and completion tracking</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "High Priority Gaps", value: high, icon: AlertCircle, color: "#EF4444" },
          { label: "Medium Priority Gaps", value: medium, icon: Users, color: "#F59E0B" },
          { label: "Fully Compliant", value: compliant, icon: CheckCircle2, color: "#10B981" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border p-5 flex items-center gap-4" style={{ borderColor: "#E3E9F6" }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: color + "18" }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color }}>{gapsLoading || matrixLoading ? "…" : value}</div>
              <div className="text-xs font-medium" style={{ color: "#6B7280" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: "#E9EEF8" }}>
          <BookOpen className="w-4 h-4" style={{ color: "#4A57B9" }} />
          <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>Training Gaps</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
              {["Employee / Role", "Missing Courses", "Priority"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gapsLoading ? (
              <tr><td colSpan={3} className="text-center py-10 text-sm" style={{ color: "#9CA3AF" }}>Loading training gaps…</td></tr>
            ) : gaps.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-12">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color: "#10B981" }} />
                  <p className="text-sm font-semibold" style={{ color: "#10B981" }}>All employees are compliant!</p>
                </td>
              </tr>
            ) : (
              gaps.map((g, i) => <GapRow key={`${g.employee_id}-${i}`} gap={g} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
