import { useState } from "react";
import { useParams } from "react-router";
import {
  useGetTenantQuery,
  useUpdateTenantMutation,
  useAssignTenantSubscriptionMutation,
  useListSubscriptionPlansQuery,
} from "@/features/superadmin/api/adminApi";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active:    { bg: "#D1FAE5", text: "#065F46" },
  pending:   { bg: "#FEF3C7", text: "#92400E" },
  suspended: { bg: "#FEE2E2", text: "#991B1B" },
  inactive:  { bg: "#F3F4F6", text: "#6B7280" },
};

export function TenantDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { data: tenant, isLoading, isError } = useGetTenantQuery(tenantId ?? "");
  const [updateTenant, { isLoading: updating }] = useUpdateTenantMutation();
  const [assignSubscription, { isLoading: assigning }] = useAssignTenantSubscriptionMutation();
  const { data: plans = [] } = useListSubscriptionPlansQuery();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");

  const handleEditStart = () => {
    if (!tenant) return;
    setEditName(tenant.name);
    setEditStatus(tenant.status);
    setEditing(true);
  };

  const handleEditSave = async () => {
    if (!tenantId) return;
    await updateTenant({ tenantId, body: { name: editName, status: editStatus } });
    setEditing(false);
  };

  const handleAssignPlan = async () => {
    if (!tenantId || !selectedPlanId) return;
    await assignSubscription({ tenantId, planId: selectedPlanId });
    setSelectedPlanId("");
  };

  if (isLoading) {
    return (
      <div className="p-6" style={{ color: "#9CA3AF" }}>Loading…</div>
    );
  }

  if (isError || !tenant) {
    return (
      <div className="p-6" style={{ color: "#EF4444" }}>Failed to load</div>
    );
  }

  const statusBadge = STATUS_COLORS[tenant.status] ?? STATUS_COLORS.inactive;

  return (
    <div className="p-6 space-y-6" style={{ background: "#F3F7FF", minHeight: "100vh" }}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-lg font-bold" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
            {tenant.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>{tenant.name}</h1>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize" style={{ background: statusBadge.bg, color: statusBadge.text }}>
                {tenant.status}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "#EEF2FB", color: "#4A57B9" }}>
                {tenant.plan}
              </span>
            </div>
            <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>{tenant.org_code}</p>
          </div>
        </div>
        {!editing && (
          <button
            onClick={handleEditStart}
            className="px-4 py-2 rounded-xl text-sm font-semibold border"
            style={{ borderColor: "#4A57B9", color: "#4A57B9" }}
          >
            Edit
          </button>
        )}
      </div>

      {editing && (
        <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>Edit Tenant</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Name</label>
              <input
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Status</label>
              <select
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleEditSave}
              disabled={updating}
              className="px-5 py-2 rounded-xl text-white text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
            >
              {updating ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium border"
              style={{ borderColor: "#E3E9F6", color: "#6B7280" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>Subscription</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: "#374151" }}>Current Plan:</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "#EEF2FB", color: "#4A57B9" }}>
              {tenant.plan}
            </span>
          </div>
          {plans.length > 0 && (
            <div className="flex items-center gap-3">
              <select
                className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
              >
                <option value="">Change Plan…</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button
                onClick={handleAssignPlan}
                disabled={!selectedPlanId || assigning}
                className="px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
              >
                {assigning ? "Assigning…" : "Assign"}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold mb-4" style={{ color: "#111827" }}>Stats</h2>
          <div className="flex flex-wrap gap-3">
            <div className="px-4 py-2.5 rounded-xl" style={{ background: "#F8FAFF", border: "1px solid #E9EEF8" }}>
              <div className="text-xs" style={{ color: "#9CA3AF" }}>Created</div>
              <div className="text-sm font-semibold mt-0.5" style={{ color: "#111827" }}>
                {new Date(tenant.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="px-4 py-2.5 rounded-xl" style={{ background: "#F8FAFF", border: "1px solid #E9EEF8" }}>
              <div className="text-xs" style={{ color: "#9CA3AF" }}>Users</div>
              <div className="text-sm font-semibold mt-0.5" style={{ color: "#111827" }}>
                {tenant.users_count ?? "—"}
              </div>
            </div>
            <div className="px-4 py-2.5 rounded-xl" style={{ background: "#F8FAFF", border: "1px solid #E9EEF8" }}>
              <div className="text-xs" style={{ color: "#9CA3AF" }}>Sites</div>
              <div className="text-sm font-semibold mt-0.5" style={{ color: "#111827" }}>
                {tenant.sites_count ?? "—"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
