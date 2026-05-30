import { useState } from "react";
import {
  useListSuperAdminInvitationsQuery,
  useCreateSuperAdminInvitationMutation,
  useResendSuperAdminInvitationMutation,
  useCancelSuperAdminInvitationMutation,
} from "@/features/superadmin/api/adminApi";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:   { bg: "#FEF3C7", text: "#92400E" },
  accepted:  { bg: "#D1FAE5", text: "#065F46" },
  expired:   { bg: "#FEE2E2", text: "#991B1B" },
  cancelled: { bg: "#F3F4F6", text: "#6B7280" },
};

export function InvitationsPage() {
  const { data: invitations = [], isLoading, isError } = useListSuperAdminInvitationsQuery();
  const [createInvitation, { isLoading: creating }] = useCreateSuperAdminInvitationMutation();
  const [resendInvitation] = useResendSuperAdminInvitationMutation();
  const [cancelInvitation] = useCancelSuperAdminInvitationMutation();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ org_name: "", admin_name: "", admin_email: "", expiry_days: 7 });

  const [resendingId, setResendingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createInvitation({
        org_name: form.org_name,
        admin_name: form.admin_name,
        admin_email: form.admin_email,
        expiry_days: form.expiry_days,
      } as Parameters<typeof createInvitation>[0]).unwrap();
      setShowForm(false);
      setForm({ org_name: "", admin_name: "", admin_email: "", expiry_days: 7 });
      showToast(`Invitation sent to ${form.admin_email}`);
    } catch {
      showToast("Failed to send invitation. Please try again.", false);
    }
  };

  const handleResend = async (id: string, email: string) => {
    setResendingId(id);
    try {
      await resendInvitation(id).unwrap();
      showToast(`Invitation resent to ${email}`);
    } catch {
      showToast("Failed to resend invitation.", false);
    } finally {
      setResendingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await cancelInvitation(id).unwrap();
      showToast("Invitation cancelled.");
    } catch {
      showToast("Failed to cancel invitation.", false);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6" style={{ background: "#F3F7FF", minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Org Invitations</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Invite new organisations to the platform</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
        >
          + New Invitation
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="rounded-xl px-4 py-3 text-sm font-medium"
          style={{ background: toast.ok ? "#D1FAE5" : "#FEE2E2", color: toast.ok ? "#065F46" : "#991B1B" }}
        >
          {toast.msg}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold mb-4" style={{ color: "#111827" }}>New Organisation Invitation</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Organisation Name</label>
              <input
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                placeholder="e.g. Acme Corp"
                value={form.org_name}
                onChange={(e) => setForm({ ...form, org_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Admin Name</label>
              <input
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                placeholder="e.g. John Smith"
                value={form.admin_name}
                onChange={(e) => setForm({ ...form, admin_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Admin Email</label>
              <input
                type="email"
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                placeholder="admin@company.com"
                value={form.admin_email}
                onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Expiry (days)</label>
              <input
                type="number"
                min={1}
                max={30}
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                value={form.expiry_days}
                onChange={(e) => setForm({ ...form, expiry_days: Number(e.target.value) })}
                required
              />
            </div>
            <div className="flex items-end gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)", opacity: creating ? 0.7 : 1 }}
              >
                {creating ? "Sending…" : "Send Invitation"}
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

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Org Name</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Admin</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Expiry</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ color: "#9CA3AF" }}>Loading…</td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ color: "#EF4444" }}>Failed to load</td>
              </tr>
            ) : invitations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ color: "#9CA3AF" }}>No invitations yet</td>
              </tr>
            ) : (
              invitations.map((inv) => {
                const badge = STATUS_COLORS[inv.status] ?? STATUS_COLORS.cancelled;
                const isResending = resendingId === inv.id;
                const isCancelling = cancellingId === inv.id;
                return (
                  <tr key={inv.id} className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-5 py-3.5 font-medium" style={{ color: "#111827" }}>{inv.org_name}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-xs" style={{ color: "#111827" }}>{inv.admin_name}</div>
                      <div className="text-xs" style={{ color: "#9CA3AF" }}>{inv.admin_email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize" style={{ background: badge.bg, color: badge.text }}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "#9CA3AF" }}>
                      {inv.expiry_date ? new Date(inv.expiry_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      {inv.status === "pending" ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleResend(inv.id, inv.admin_email)}
                            disabled={isResending}
                            className="px-3 py-1 rounded-lg text-xs font-medium border transition-opacity"
                            style={{ borderColor: "#4A57B9", color: "#4A57B9", opacity: isResending ? 0.5 : 1 }}
                          >
                            {isResending ? "Sending…" : "Resend"}
                          </button>
                          <button
                            onClick={() => handleCancel(inv.id)}
                            disabled={isCancelling}
                            className="px-3 py-1 rounded-lg text-xs font-medium border transition-opacity"
                            style={{ borderColor: "#EF4444", color: "#EF4444", opacity: isCancelling ? 0.5 : 1 }}
                          >
                            {isCancelling ? "Cancelling…" : "Cancel"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: "#9CA3AF" }}>—</span>
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
