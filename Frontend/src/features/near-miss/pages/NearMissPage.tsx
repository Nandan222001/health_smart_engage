import { useState } from "react";
import { AlertTriangle, Plus, X, Loader2 } from "lucide-react";
import {
  useListNearMissQuery,
  useCreateNearMissMutation,
} from "@/features/hazards/api/hazardsApi";
import type { NearMiss } from "@/features/hazards/api/hazardsApi";

const SEV_COLOR: Record<string, string> = {
  low: "#10B981",
  medium: "#3B82F6",
  high: "#F59E0B",
  critical: "#EF4444",
};

const STATUS_COLOR: Record<string, string> = {
  open: "#EF4444",
  investigating: "#F59E0B",
  closed: "#10B981",
};

function SeverityBadge({ severity }: { severity: string }) {
  const color = SEV_COLOR[severity] ?? "#9CA3AF";
  return (
    <span
      className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ background: color + "1A", color }}
    >
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? "#9CA3AF";
  return (
    <span
      className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ background: color + "1A", color }}
    >
      {status.replace("_", " ")}
    </span>
  );
}

const SEVERITIES = ["low", "medium", "high", "critical"] as const;

interface NearMissFormState {
  title: string;
  description: string;
  severity: string;
}

const EMPTY_FORM: NearMissFormState = {
  title: "",
  description: "",
  severity: "low",
};

export function NearMissPage() {
  const { data: rawData, isLoading, isError } = useListNearMissQuery();
  const [createNearMiss, { isLoading: creating }] = useCreateNearMissMutation();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NearMissFormState>(EMPTY_FORM);
  const [sevFilter, setSevFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // baseApi unwraps { data: { items: [...] } } to a plain array.
  const records: NearMiss[] = Array.isArray(rawData)
    ? (rawData as NearMiss[])
    : ((rawData as unknown as { items?: NearMiss[] })?.items ?? []);

  const filtered = records.filter((r) => {
    const matchSev = !sevFilter || r.severity === sevFilter;
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSev && matchStatus;
  });

  const stats = {
    total: records.length,
    critical: records.filter((r) => r.severity === "critical").length,
    open: records.filter((r) => r.status === "open").length,
    closed: records.filter((r) => r.status === "closed").length,
  };

  async function handleCreate() {
    if (!form.title || !form.description) return;
    await createNearMiss(form);
    setShowForm(false);
    setForm(EMPTY_FORM);
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Near Miss</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Report and analyze near miss incidents</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "Report Near Miss"}
        </button>
      </div>

      {/* Inline Report Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-sm font-bold" style={{ color: "#111827" }}>Report a Near Miss</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "#6B7280" }}>Title *</label>
              <input
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#E3E9F6" }}
                placeholder="Brief title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "#6B7280" }}>Severity</label>
              <select
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#E3E9F6" }}
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium" style={{ color: "#6B7280" }}>Description *</label>
              <textarea
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                style={{ borderColor: "#E3E9F6" }}
                rows={3}
                placeholder="Describe what happened and potential outcome"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleCreate}
              disabled={creating || !form.title || !form.description}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Submit Report
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Incidents", value: stats.total, color: "#4A57B9" },
          { label: "Critical", value: stats.critical, color: "#EF4444" },
          { label: "Open", value: stats.open, color: "#F59E0B" },
          { label: "Closed", value: stats.closed, color: "#10B981" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
            <div className="text-2xl font-bold" style={{ color }}>{isLoading ? "…" : value}</div>
            <div className="text-xs font-medium mt-0.5" style={{ color: "#6B7280" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          className="px-3 py-2.5 rounded-xl border text-sm outline-none"
          style={{ borderColor: "#E3E9F6" }}
          value={sevFilter}
          onChange={(e) => setSevFilter(e.target.value)}
        >
          <option value="">All Severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select
          className="px-3 py-2.5 rounded-xl border text-sm outline-none"
          style={{ borderColor: "#E3E9F6" }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "#E9EEF8" }}>
          <AlertTriangle className="w-4 h-4" style={{ color: "#F59E0B" }} />
          <span className="text-sm font-semibold" style={{ color: "#111827" }}>
            Incidents ({filtered.length})
          </span>
        </div>

        {isError ? (
          <div className="p-8 text-center text-sm" style={{ color: "#EF4444" }}>
            Failed to load near miss records. Please try again.
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#4A57B9" }} />
            <p className="text-sm" style={{ color: "#9CA3AF" }}>Loading…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: "#6B7280" }}>
            No near miss records found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                {["Ref", "Title", "Type", "Severity", "Status"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-5 py-3.5 font-mono text-xs" style={{ color: "#9CA3AF" }}>{r.ref}</td>
                  <td className="px-5 py-3.5">
                    <div className="text-sm font-semibold" style={{ color: "#111827" }}>{r.title}</div>
                    {r.description && (
                      <div className="text-xs truncate max-w-xs" style={{ color: "#9CA3AF" }} title={r.description}>
                        {r.description}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{r.incident_type}</td>
                  <td className="px-5 py-3.5"><SeverityBadge severity={r.severity} /></td>
                  <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
