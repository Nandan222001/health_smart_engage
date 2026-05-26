import { useState } from "react";
import { useSearchParams } from "react-router";
import { Loader2, Plus, Search, X, ChevronRight } from "lucide-react";
import {
  useListRiskAssessmentsQuery,
  useCreateRiskAssessmentMutation,
  useGetRiskMatrixQuery,
  useGetHighRiskAreasQuery,
  useCloseRiskAssessmentMutation,
} from "@/features/hazards/api/hazardsApi";
import type { RiskAssessmentCreatePayload } from "@/features/hazards/api/hazardsApi";

// Extended interface that matches backend response (score-based, not level-based)
interface RiskAssessmentExtended {
  id: string;
  title: string;
  hazard_description?: string;
  likelihood: number;
  consequence: number;
  risk_score: number;
  residual_risk_score?: number;
  status: string;
  location_id?: string;
  department?: string;
}

const STATUS_COLORS: Record<string, string> = {
  open: "#EF4444",
  in_progress: "#F59E0B",
  closed: "#10B981",
  draft: "#9CA3AF",
  active: "#3B82F6",
  archived: "#9CA3AF",
};

function statusStyle(status: string) {
  const color = STATUS_COLORS[status] ?? "#9CA3AF";
  return { background: color + "1A", color };
}

function riskScoreColor(score: number): string {
  if (score >= 15) return "#EF4444";
  if (score >= 10) return "#F59E0B";
  if (score >= 5) return "#3B82F6";
  return "#10B981";
}

function riskScoreLabel(score: number): string {
  if (score >= 15) return "Critical";
  if (score >= 10) return "High";
  if (score >= 5) return "Medium";
  return "Low";
}

function matrixCellColor(likelihood: number, consequence: number): string {
  const score = likelihood * consequence;
  if (score >= 15) return "#EF4444";
  if (score >= 10) return "#F59E0B";
  if (score >= 5) return "#FDE68A";
  return "#D1FAE5";
}

function matrixCellTextColor(likelihood: number, consequence: number): string {
  const score = likelihood * consequence;
  if (score >= 10) return "#FFFFFF";
  if (score >= 5) return "#92400E";
  return "#065F46";
}

// ─────────────────────────────────────────────────
// Risk Assessments (Default) View
// ─────────────────────────────────────────────────
function RiskAssessmentsView() {
  const { data: rawData, isLoading, isError } = useListRiskAssessmentsQuery();
  const [createAssessment, { isLoading: creating }] = useCreateRiskAssessmentMutation();
  const [closeAssessment, { isLoading: closing }] = useCloseRiskAssessmentMutation();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [form, setForm] = useState<RiskAssessmentCreatePayload>({
    title: "",
    hazard_description: "",
    likelihood: 1,
    consequence: 1,
    department: "",
  });

  // The baseApi unwraps { data: { items: [...] } } to just the array,
  // but our new endpoints return shaped objects. Handle both shapes.
  const items: RiskAssessmentExtended[] = Array.isArray(rawData)
    ? (rawData as unknown as RiskAssessmentExtended[])
    : ((rawData as unknown as { items?: RiskAssessmentExtended[] })?.items ?? []);

  const total = items.length;
  const critical = items.filter((r) => (r.risk_score ?? 0) >= 15).length;
  const high = items.filter((r) => (r.risk_score ?? 0) >= 10 && (r.risk_score ?? 0) < 15).length;
  const draft = items.filter((r) => r.status === "draft").length;

  const filtered = items.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave() {
    if (!form.title || !form.hazard_description) return;
    await createAssessment(form as unknown as Partial<import("@/features/hazards/api/hazardsApi").RiskAssessment>);
    setShowForm(false);
    setForm({ title: "", hazard_description: "", likelihood: 1, consequence: 1, department: "" });
  }

  async function handleClose(id: string) {
    setClosingId(id);
    await closeAssessment(id);
    setClosingId(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin w-8 h-8" style={{ color: "#4A57B9" }} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl border p-8 text-center" style={{ borderColor: "#E3E9F6" }}>
        <p className="text-sm" style={{ color: "#EF4444" }}>Failed to load risk assessments. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Risk Assessments</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Manage and track risk assessment records</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "New Assessment"}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total", value: total, color: "#4A57B9" },
          { label: "Critical (≥15)", value: critical, color: "#EF4444" },
          { label: "High (10–14)", value: high, color: "#F59E0B" },
          { label: "Draft", value: draft, color: "#9CA3AF" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
            <div className="text-2xl font-bold" style={{ color }}>{value}</div>
            <div className="text-xs font-medium mt-0.5" style={{ color: "#6B7280" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-sm font-bold" style={{ color: "#111827" }}>New Risk Assessment</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "#6B7280" }}>Title *</label>
              <input
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#E3E9F6" }}
                placeholder="Assessment title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "#6B7280" }}>Department</label>
              <input
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#E3E9F6" }}
                placeholder="e.g. Operations"
                value={form.department ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium" style={{ color: "#6B7280" }}>Hazard Description *</label>
              <textarea
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                style={{ borderColor: "#E3E9F6" }}
                rows={2}
                placeholder="Describe the hazard"
                value={form.hazard_description}
                onChange={(e) => setForm((f) => ({ ...f, hazard_description: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "#6B7280" }}>Likelihood (1–5)</label>
              <select
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#E3E9F6" }}
                value={form.likelihood}
                onChange={(e) => setForm((f) => ({ ...f, likelihood: Number(e.target.value) }))}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "#6B7280" }}>Consequence (1–5)</label>
              <select
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#E3E9F6" }}
                value={form.consequence}
                onChange={(e) => setForm((f) => ({ ...f, consequence: Number(e.target.value) }))}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={creating || !form.title || !form.hazard_description}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save Assessment
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
        <input
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
          style={{ borderColor: "#E3E9F6", background: "#F9FAFB" }}
          placeholder="Search assessments…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
              {["Title", "Likelihood", "Consequence", "Risk Score", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-sm" style={{ color: "#6B7280" }}>
                  No risk assessments found
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const score = r.risk_score ?? r.likelihood * r.consequence;
                const scoreColor = riskScoreColor(score);
                return (
                  <tr key={r.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-semibold" style={{ color: "#111827" }}>{r.title}</div>
                      {r.department && (
                        <div className="text-xs" style={{ color: "#9CA3AF" }}>{r.department}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{r.likelihood}</td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{r.consequence}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: scoreColor + "1A", color: scoreColor }}
                      >
                        {score} — {riskScoreLabel(score)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
                        style={statusStyle(r.status)}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {r.status !== "closed" && r.status !== "archived" && (
                        <button
                          onClick={() => handleClose(r.id)}
                          disabled={closing && closingId === r.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-50 hover:bg-gray-50 transition-colors"
                          style={{ borderColor: "#E3E9F6", color: "#6B7280" }}
                        >
                          {closing && closingId === r.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : null}
                          Close
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Risk Matrix View
// ─────────────────────────────────────────────────
function RiskMatrixView() {
  const { data, isLoading, isError } = useGetRiskMatrixQuery();
  const [selectedCell, setSelectedCell] = useState<{ l: number; c: number } | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin w-8 h-8" style={{ color: "#4A57B9" }} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-white rounded-2xl border p-8 text-center" style={{ borderColor: "#E3E9F6" }}>
        <p className="text-sm" style={{ color: "#EF4444" }}>Failed to load risk matrix data.</p>
      </div>
    );
  }

  const { matrix_counts, total_assessments, by_level, assessments } = data;
  const medLow = (by_level.medium ?? 0) + (by_level.low ?? 0);

  const filteredAssessments = selectedCell
    ? assessments.filter(
        (a) => a.likelihood === selectedCell.l && a.consequence === selectedCell.c
      )
    : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Risk Matrix</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>5×5 likelihood vs consequence matrix</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Assessments", value: total_assessments, color: "#4A57B9" },
          { label: "Critical", value: by_level.critical ?? 0, color: "#EF4444" },
          { label: "High", value: by_level.high ?? 0, color: "#F59E0B" },
          { label: "Medium / Low", value: medLow, color: "#3B82F6" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
            <div className="text-2xl font-bold" style={{ color }}>{value}</div>
            <div className="text-xs font-medium mt-0.5" style={{ color: "#6B7280" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Matrix */}
      <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: "#111827" }}>Click a cell to view assessments</h2>
        <div className="overflow-x-auto">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="px-3 py-2 text-xs text-left font-semibold" style={{ color: "#6B7280", minWidth: 80 }}>
                  C ↓ / L →
                </th>
                {[1, 2, 3, 4, 5].map((l) => (
                  <th key={l} className="px-2 py-2 text-xs font-semibold text-center" style={{ color: "#6B7280", minWidth: 64 }}>
                    L={l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[5, 4, 3, 2, 1].map((consequence) => (
                <tr key={consequence}>
                  <td className="px-3 py-2 text-xs font-semibold" style={{ color: "#6B7280" }}>C={consequence}</td>
                  {[1, 2, 3, 4, 5].map((likelihood) => {
                    const key = `${likelihood}_${consequence}`;
                    const count = matrix_counts[key] ?? 0;
                    const bgColor = matrixCellColor(likelihood, consequence);
                    const textColor = matrixCellTextColor(likelihood, consequence);
                    const isSelected =
                      selectedCell?.l === likelihood && selectedCell?.c === consequence;
                    return (
                      <td key={key} className="px-1 py-1">
                        <button
                          onClick={() =>
                            setSelectedCell(
                              isSelected ? null : { l: likelihood, c: consequence }
                            )
                          }
                          className="w-16 h-12 rounded-lg flex flex-col items-center justify-center transition-all hover:opacity-90"
                          style={{
                            background: bgColor,
                            color: textColor,
                            outline: isSelected ? `2px solid #4A57B9` : "none",
                            outlineOffset: 2,
                          }}
                        >
                          <span className="text-base font-bold leading-none">{likelihood * consequence}</span>
                          <span className="text-[10px] font-medium mt-0.5">{count > 0 ? `${count} item${count !== 1 ? "s" : ""}` : "—"}</span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs" style={{ color: "#6B7280" }}>
          {[
            { bg: "#EF4444", label: "Critical (≥15)" },
            { bg: "#F59E0B", label: "High (10–14)" },
            { bg: "#FDE68A", label: "Medium (5–9)" },
            { bg: "#D1FAE5", label: "Low (<5)" },
          ].map(({ bg, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded" style={{ background: bg }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Selected cell assessments */}
      {selectedCell && (
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-sm font-bold mb-3" style={{ color: "#111827" }}>
            Assessments for L={selectedCell.l}, C={selectedCell.c} (Score: {selectedCell.l * selectedCell.c})
          </h2>
          {filteredAssessments.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: "#6B7280" }}>No assessments for this cell</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                  {["Title", "Risk Score", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAssessments.map((a) => (
                  <tr key={a.id} className="border-t" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: "#111827" }}>{a.title}</td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: riskScoreColor(a.risk_score) + "1A", color: riskScoreColor(a.risk_score) }}
                      >
                        {a.risk_score}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
                        style={statusStyle(a.status)}
                      >
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────
// High-Risk Areas View
// ─────────────────────────────────────────────────
function HighRiskAreasView() {
  const { data, isLoading, isError } = useGetHighRiskAreasQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin w-8 h-8" style={{ color: "#4A57B9" }} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-white rounded-2xl border p-8 text-center" style={{ borderColor: "#E3E9F6" }}>
        <p className="text-sm" style={{ color: "#EF4444" }}>Failed to load high-risk areas.</p>
      </div>
    );
  }

  const { items, total } = data;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>High-Risk Areas</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Assessments with risk score ≥ 15</p>
      </div>

      {/* Stat Card */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <div className="text-2xl font-bold" style={{ color: "#EF4444" }}>{total}</div>
          <div className="text-xs font-medium mt-0.5" style={{ color: "#6B7280" }}>Total High-Risk</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <ChevronRight className="w-10 h-10" style={{ color: "#D1D5DB" }} />
            <p className="text-sm font-medium" style={{ color: "#6B7280" }}>No high-risk areas found</p>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>Assessments with risk score ≥ 15 will appear here</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                {["Title", "Risk Score", "Likelihood", "Consequence", "Location", "Status"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((area) => {
                const scoreBg = area.risk_score >= 20 ? "#EF4444" : "#F59E0B";
                return (
                  <tr key={area.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-semibold" style={{ color: "#111827" }}>{area.title}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: scoreBg + "1A", color: scoreBg }}
                      >
                        {area.risk_score}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{area.likelihood}</td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{area.consequence}</td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{area.location_id ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
                        style={statusStyle(area.status)}
                      >
                        {area.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Navigation Tab Bar
// ─────────────────────────────────────────────────
const TABS = [
  { key: "", label: "Risk Assessments" },
  { key: "matrix", label: "Risk Matrix" },
  { key: "high-risk", label: "High-Risk Areas" },
] as const;

// ─────────────────────────────────────────────────
// Main RiskPage
// ─────────────────────────────────────────────────
export function RiskPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") ?? "";

  function setTab(key: string) {
    if (key === "") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: key });
    }
  }

  return (
    <div className="p-6 space-y-5">
      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
            style={
              tab === key
                ? { background: "#fff", color: "#4A57B9", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }
                : { color: "#6B7280" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "matrix" ? (
        <RiskMatrixView />
      ) : tab === "high-risk" ? (
        <HighRiskAreasView />
      ) : (
        <RiskAssessmentsView />
      )}
    </div>
  );
}
