import { useState } from "react";
import {
  useListSubscriptionPlansQuery,
  useCreateSubscriptionPlanMutation,
  useUpdateSubscriptionPlanMutation,
} from "@/features/superadmin/api/adminApi";

interface PlanFormState {
  name: string;
  code: string;
  price_monthly: number;
  price_annual: number;
  max_users: number;
  max_sites: number;
}

const EMPTY_FORM: PlanFormState = {
  name: "",
  code: "",
  price_monthly: 0,
  price_annual: 0,
  max_users: 0,
  max_sites: 0,
};

export function SubscriptionsPage() {
  const { data: plans = [], isLoading, isError } = useListSubscriptionPlansQuery();
  const [createPlan, { isLoading: creating }] = useCreateSubscriptionPlanMutation();
  const [updatePlan, { isLoading: updating }] = useUpdateSubscriptionPlanMutation();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PlanFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PlanFormState>(EMPTY_FORM);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPlan(form);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const handleEditStart = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    setEditingId(planId);
    setEditForm({
      name: plan.name,
      code: plan.code,
      price_monthly: plan.price_monthly,
      price_annual: plan.price_annual,
      max_users: plan.max_users,
      max_sites: plan.max_sites,
    });
  };

  const handleEditSave = async (planId: string) => {
    await updatePlan({ planId, body: editForm });
    setEditingId(null);
  };

  const field = (
    label: string,
    key: keyof PlanFormState,
    state: PlanFormState,
    setter: (v: PlanFormState) => void,
    type = "text"
  ) => (
    <div>
      <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>{label}</label>
      <input
        type={type}
        className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
        style={{ borderColor: "#E3E9F6", color: "#111827" }}
        value={state[key] as string | number}
        onChange={(e) =>
          setter({ ...state, [key]: type === "number" ? Number(e.target.value) : e.target.value })
        }
        required
      />
    </div>
  );

  return (
    <div className="p-6 space-y-6" style={{ background: "#F3F7FF", minHeight: "100vh" }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Subscription Plans</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Manage platform subscription tiers</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
        >
          + New Plan
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold mb-4" style={{ color: "#111827" }}>New Subscription Plan</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {field("Name", "name", form, setForm)}
            {field("Code", "code", form, setForm)}
            {field("Monthly Price ($)", "price_monthly", form, setForm, "number")}
            {field("Annual Price ($)", "price_annual", form, setForm, "number")}
            {field("Max Users", "max_users", form, setForm, "number")}
            {field("Max Sites", "max_sites", form, setForm, "number")}
            <div className="md:col-span-3 flex gap-3">
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
              >
                {creating ? "Creating…" : "Create Plan"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium border"
                style={{ borderColor: "#E3E9F6", color: "#6B7280" }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Name</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Code</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Monthly</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Annual</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Max Users</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Max Sites</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-sm" style={{ color: "#9CA3AF" }}>Loading…</td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-sm" style={{ color: "#EF4444" }}>Failed to load</td>
              </tr>
            ) : plans.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-sm" style={{ color: "#9CA3AF" }}>No plans yet</td>
              </tr>
            ) : (
              plans.map((plan) =>
                editingId === plan.id ? (
                  <tr key={plan.id} className="border-t" style={{ borderColor: "#F3F4F6", background: "#FAFBFF" }}>
                    <td className="px-3 py-2">
                      <input
                        className="w-full border rounded-xl px-2 py-1.5 text-sm outline-none"
                        style={{ borderColor: "#E3E9F6", color: "#111827" }}
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full border rounded-xl px-2 py-1.5 text-sm outline-none"
                        style={{ borderColor: "#E3E9F6", color: "#111827" }}
                        value={editForm.code}
                        onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="w-20 border rounded-xl px-2 py-1.5 text-sm outline-none"
                        style={{ borderColor: "#E3E9F6", color: "#111827" }}
                        value={editForm.price_monthly}
                        onChange={(e) => setEditForm({ ...editForm, price_monthly: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="w-20 border rounded-xl px-2 py-1.5 text-sm outline-none"
                        style={{ borderColor: "#E3E9F6", color: "#111827" }}
                        value={editForm.price_annual}
                        onChange={(e) => setEditForm({ ...editForm, price_annual: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="w-20 border rounded-xl px-2 py-1.5 text-sm outline-none"
                        style={{ borderColor: "#E3E9F6", color: "#111827" }}
                        value={editForm.max_users}
                        onChange={(e) => setEditForm({ ...editForm, max_users: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="w-20 border rounded-xl px-2 py-1.5 text-sm outline-none"
                        style={{ borderColor: "#E3E9F6", color: "#111827" }}
                        value={editForm.max_sites}
                        onChange={(e) => setEditForm({ ...editForm, max_sites: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: plan.is_active ? "#D1FAE5" : "#F3F4F6", color: plan.is_active ? "#065F46" : "#6B7280" }}>
                        {plan.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSave(plan.id)}
                          disabled={updating}
                          className="px-3 py-1 rounded-lg text-xs font-semibold text-white"
                          style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
                        >
                          {updating ? "…" : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 rounded-lg text-xs font-medium border"
                          style={{ borderColor: "#E3E9F6", color: "#6B7280" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={plan.id} className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-5 py-3.5 font-medium" style={{ color: "#111827" }}>{plan.name}</td>
                    <td className="px-5 py-3.5" style={{ color: "#374151" }}>{plan.code}</td>
                    <td className="px-5 py-3.5" style={{ color: "#374151" }}>${plan.price_monthly}</td>
                    <td className="px-5 py-3.5" style={{ color: "#374151" }}>${plan.price_annual}</td>
                    <td className="px-5 py-3.5" style={{ color: "#374151" }}>{plan.max_users}</td>
                    <td className="px-5 py-3.5" style={{ color: "#374151" }}>{plan.max_sites}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: plan.is_active ? "#D1FAE5" : "#F3F4F6", color: plan.is_active ? "#065F46" : "#6B7280" }}>
                        {plan.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleEditStart(plan.id)}
                        className="px-3 py-1 rounded-lg text-xs font-medium border"
                        style={{ borderColor: "#4A57B9", color: "#4A57B9" }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
