import { useState } from "react";
import { ShieldAlert, Search, Plus } from "lucide-react";
import { useListHazardsQuery, useListRiskAssessmentsQuery } from "@/features/hazards/api/hazardsApi";
import type { Hazard, RiskAssessment } from "@/features/hazards/api/hazardsApi";

const SEV_COLOR: Record<string, string> = {
  low: "#10B981", medium: "#F59E0B", high: "#F97316", critical: "#EF4444",
};

function HazardRow({ hazard }: { hazard: Hazard }) {
  const color = SEV_COLOR[hazard.severity];
  return (
    <tr className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
      <td className="px-5 py-3.5">
        <div className="text-sm font-semibold" style={{ color: "#111827" }}>{hazard.title}</div>
        <div className="text-xs" style={{ color: "#9CA3AF" }}>{hazard.type}</div>
      </td>
      <td className="px-5 py-3.5">
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ background: color + "1A", color }}>{hazard.severity}</span>
      </td>
      <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{hazard.reported_by}</td>
      <td className="px-5 py-3.5">
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ background: hazard.status === "mitigated" ? "#D1FAE5" : hazard.status === "open" ? "#FEE2E2" : "#F3F4F6", color: hazard.status === "mitigated" ? "#10B981" : hazard.status === "open" ? "#EF4444" : "#9CA3AF" }}>
          {hazard.status}
        </span>
      </td>
    </tr>
  );
}

function RiskRow({ risk }: { risk: RiskAssessment }) {
  const color = SEV_COLOR[risk.risk_level];
  return (
    <tr className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
      <td className="px-5 py-3.5">
        <div className="text-sm font-semibold" style={{ color: "#111827" }}>{risk.title}</div>
        <div className="text-xs" style={{ color: "#9CA3AF" }}>{risk.department || "—"}</div>
      </td>
      <td className="px-5 py-3.5">
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ background: color + "1A", color }}>{risk.risk_level}</span>
      </td>
      <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{risk.assessor}</td>
      <td className="px-5 py-3.5">
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ background: "#EEF2FB", color: "#4A57B9" }}>{risk.status}</span>
      </td>
    </tr>
  );
}

export function HazardsPage() {
  const { data: hazards = [], isLoading: hLoading } = useListHazardsQuery();
  const { data: risks = [], isLoading: rLoading } = useListRiskAssessmentsQuery();
  const [tab, setTab] = useState<"hazards" | "risks">("hazards");
  const [search, setSearch] = useState("");

  const openHazards = hazards.filter((h) => h.status === "open").length;
  const criticalHazards = hazards.filter((h) => h.severity === "critical").length;
  const highRisks = risks.filter((r) => r.risk_level === "high" || r.risk_level === "critical").length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Hazards & Risk</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Hazard register and risk assessment management</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
          <Plus className="w-4 h-4" /> Report Hazard
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open Hazards", value: openHazards, color: "#EF4444" },
          { label: "Critical Hazards", value: criticalHazards, color: "#7C3AED" },
          { label: "High Risk Assessments", value: highRisks, color: "#F59E0B" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E3E9F6" }}>
            <div className="text-2xl font-bold" style={{ color }}>{hLoading || rLoading ? "…" : value}</div>
            <div className="text-xs font-medium mt-0.5" style={{ color: "#6B7280" }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(["hazards", "risks"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all" style={tab === t ? { background: "#fff", color: "#4A57B9", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" } : { color: "#6B7280" }}>
            {t === "risks" ? "Risk Assessments" : "Hazard Register"}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
        <input className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E3E9F6", background: "#F9FAFB" }} placeholder={`Search ${tab}…`} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        {tab === "hazards" ? (
          <table className="w-full text-sm">
            <thead><tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>{["Hazard", "Severity", "Reported By", "Status"].map((h) => <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>)}</tr></thead>
            <tbody>
              {hLoading ? <tr><td colSpan={4} className="text-center py-10 text-sm" style={{ color: "#9CA3AF" }}>Loading…</td></tr>
                : hazards.filter((h) => h.title.toLowerCase().includes(search.toLowerCase())).map((h) => <HazardRow key={h.id} hazard={h} />)}
              {!hLoading && hazards.length === 0 && <tr><td colSpan={4} className="text-center py-12"><ShieldAlert className="w-8 h-8 mx-auto mb-2" style={{ color: "#D1D5DB" }} /><p className="text-sm" style={{ color: "#6B7280" }}>No hazards reported</p></td></tr>}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead><tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>{["Assessment", "Risk Level", "Assessor", "Status"].map((h) => <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>)}</tr></thead>
            <tbody>
              {rLoading ? <tr><td colSpan={4} className="text-center py-10 text-sm" style={{ color: "#9CA3AF" }}>Loading…</td></tr>
                : risks.filter((r) => r.title.toLowerCase().includes(search.toLowerCase())).map((r) => <RiskRow key={r.id} risk={r} />)}
              {!rLoading && risks.length === 0 && <tr><td colSpan={4} className="text-center py-12"><p className="text-sm" style={{ color: "#6B7280" }}>No risk assessments found</p></td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
