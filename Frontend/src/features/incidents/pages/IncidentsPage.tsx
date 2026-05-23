import { useState } from "react";
import { AlertTriangle, Search } from "lucide-react";
import { useListIncidentsQuery } from "@/features/incidents/api/incidentsApi";
import type { Incident } from "@/features/incidents/api/incidentsApi";

const SEV_COLOR: Record<string, string> = {
  low: "#10B981", medium: "#F59E0B", high: "#F97316", critical: "#EF4444",
};

function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ background: SEV_COLOR[severity] + "1A", color: SEV_COLOR[severity] }}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = status === "resolved" || status === "closed" ? "#10B981" : status === "investigating" ? "#F59E0B" : "#EF4444";
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ background: color + "1A", color }}>
      {status}
    </span>
  );
}

function IncidentRow({ incident }: { incident: Incident }) {
  return (
    <tr className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F3F4F6" }}>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: SEV_COLOR[incident.severity] }} />
          <div>
            <div className="text-sm font-semibold" style={{ color: "#111827" }}>{incident.title}</div>
            <div className="text-xs" style={{ color: "#9CA3AF" }}>{incident.type}</div>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5"><SeverityBadge severity={incident.severity} /></td>
      <td className="px-5 py-3.5"><StatusBadge status={incident.status} /></td>
      <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{incident.reported_by}</td>
      <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{new Date(incident.occurred_at).toLocaleDateString()}</td>
    </tr>
  );
}

export function IncidentsPage() {
  const { data: incidents = [], isLoading } = useListIncidentsQuery();
  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState("");

  const filtered = incidents.filter((i) => {
    const matchSearch = i.title.toLowerCase().includes(search.toLowerCase());
    const matchSev = !sevFilter || i.severity === sevFilter;
    return matchSearch && matchSev;
  });

  const open = incidents.filter((i) => i.status === "open").length;
  const investigating = incidents.filter((i) => i.status === "investigating").length;
  const critical = incidents.filter((i) => i.severity === "critical").length;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Incidents</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Track, classify, and investigate workplace incidents</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open Incidents", value: open, color: "#EF4444" },
          { label: "Under Investigation", value: investigating, color: "#F59E0B" },
          { label: "Critical Severity", value: critical, color: "#7C3AED" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E3E9F6" }}>
            <div className="text-2xl font-bold" style={{ color }}>{isLoading ? "…" : value}</div>
            <div className="text-xs font-medium mt-0.5" style={{ color: "#6B7280" }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: "#E3E9F6", background: "#F9FAFB" }}
            placeholder="Search incidents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E3E9F6" }} value={sevFilter} onChange={(e) => setSevFilter(e.target.value)}>
          <option value="">All severities</option>
          {["low", "medium", "high", "critical"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
              {["Incident", "Severity", "Status", "Reported By", "Date"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-10 text-sm" style={{ color: "#9CA3AF" }}>Loading incidents…</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
                  <p className="text-sm" style={{ color: "#6B7280" }}>No incidents found</p>
                </td>
              </tr>
            ) : (
              filtered.map((i) => <IncidentRow key={i.id} incident={i} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
