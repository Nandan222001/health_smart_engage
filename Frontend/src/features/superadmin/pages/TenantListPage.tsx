import { useState } from "react";
import { useNavigate } from "react-router";
import { Building2, Search, Plus, CheckCircle2, Clock, XCircle, ChevronRight } from "lucide-react";
import { useListTenantsQuery } from "@/features/superadmin/api/adminApi";

const STATUS_COLOR: Record<string, string> = {
  active: "#10B981",
  pending: "#F59E0B",
  suspended: "#EF4444",
  inactive: "#9CA3AF",
};

export function TenantListPage() {
  const navigate = useNavigate();
  const { data: tenants = [], isLoading } = useListTenantsQuery();
  const [search, setSearch] = useState("");

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.org_code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Tenant Management</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>{tenants.length} organisations registered</p>
        </div>
        <button
          onClick={() => navigate("/superadmin/onboarding-wizard")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
        >
          <Plus className="w-4 h-4" /> New Tenant
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
        <input
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
          style={{ borderColor: "#E3E9F6", background: "#F9FAFB" }}
          placeholder="Search by name or org code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Organisation</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Code</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Plan</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-sm" style={{ color: "#9CA3AF" }}>Loading…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Building2 className="w-8 h-8 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
                  <p className="text-sm" style={{ color: "#6B7280" }}>No tenants found</p>
                </td>
              </tr>
            ) : (
              filtered.map((tenant) => {
                const color = STATUS_COLOR[tenant.status] ?? "#9CA3AF";
                const Icon = tenant.status === "active" ? CheckCircle2 : tenant.status === "pending" ? Clock : XCircle;
                return (
                  <tr
                    key={tenant.id}
                    className="border-t hover:bg-gray-50 cursor-pointer transition-colors"
                    style={{ borderColor: "#F3F4F6" }}
                    onClick={() => navigate(`/superadmin/tenants/${tenant.id}`)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
                          {tenant.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium" style={{ color: "#111827" }}>{tenant.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs" style={{ color: "#6B7280" }}>{tenant.org_code}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "#EEF2FB", color: "#4A57B9" }}>{tenant.plan}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1.5 text-xs font-medium capitalize" style={{ color }}>
                        <Icon className="w-3.5 h-3.5" /> {tenant.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "#9CA3AF" }}>
                      {new Date(tenant.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <ChevronRight className="w-4 h-4" style={{ color: "#D1D5DB" }} />
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
