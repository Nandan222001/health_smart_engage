import { useState } from "react";
import { FileText, Plus, Search, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { useListPermitsQuery } from "@/features/permits/api/permitsApi";
import type { Permit } from "@/features/permits/api/permitsApi";

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle2; bg: string }> = {
  draft:     { color: "#9CA3AF", icon: Clock,        bg: "#F3F4F6" },
  submitted: { color: "#F59E0B", icon: Clock,        bg: "#FEF3C7" },
  approved:  { color: "#10B981", icon: CheckCircle2, bg: "#D1FAE5" },
  rejected:  { color: "#EF4444", icon: XCircle,      bg: "#FEE2E2" },
  active:    { color: "#4A57B9", icon: CheckCircle2, bg: "#EEF2FB" },
  closed:    { color: "#6B7280", icon: AlertCircle,  bg: "#F3F4F6" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ background: cfg.bg, color: cfg.color }}>
      <Icon className="w-3 h-3" />{status}
    </span>
  );
}

function PermitRow({ permit }: { permit: Permit }) {
  return (
    <tr className="border-t hover:bg-gray-50 transition-colors cursor-pointer" style={{ borderColor: "#F3F4F6" }}>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#EEF2FB" }}>
            <FileText className="w-4 h-4" style={{ color: "#4A57B9" }} />
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "#111827" }}>{permit.title}</div>
            <div className="text-xs" style={{ color: "#9CA3AF" }}>{permit.type}</div>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5"><StatusBadge status={permit.status} /></td>
      <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{permit.requested_by}</td>
      <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{permit.start_date ? new Date(permit.start_date).toLocaleDateString() : "—"}</td>
      <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{permit.end_date ? new Date(permit.end_date).toLocaleDateString() : "—"}</td>
    </tr>
  );
}

export function PermitsPage() {
  const { data: permits = [], isLoading } = useListPermitsQuery();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = permits.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    active: permits.filter((p) => p.status === "active").length,
    submitted: permits.filter((p) => p.status === "submitted").length,
    approved: permits.filter((p) => p.status === "approved").length,
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Permits</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Permit-to-work management and approval workflow</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
          <Plus className="w-4 h-4" /> New Permit
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Permits", value: counts.active, color: "#4A57B9" },
          { label: "Pending Approval", value: counts.submitted, color: "#F59E0B" },
          { label: "Approved Today", value: counts.approved, color: "#10B981" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E3E9F6" }}>
            <div className="text-2xl font-bold" style={{ color }}>{isLoading ? "…" : value}</div>
            <div className="text-xs font-medium mt-0.5" style={{ color: "#6B7280" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: "#E3E9F6", background: "#F9FAFB" }}
            placeholder="Search permits…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2.5 rounded-xl border text-sm outline-none"
          style={{ borderColor: "#E3E9F6" }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {Object.keys(STATUS_CONFIG).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
              {["Permit", "Status", "Requested By", "Start Date", "End Date"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-10 text-sm" style={{ color: "#9CA3AF" }}>Loading permits…</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12">
                  <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
                  <p className="text-sm" style={{ color: "#6B7280" }}>No permits found</p>
                </td>
              </tr>
            ) : (
              filtered.map((p) => <PermitRow key={p.id} permit={p} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
