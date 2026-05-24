import { useState } from "react";
import { Mail, Plus, RefreshCw, X, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";
import { inviteUser } from "@/features/admin/api/orgAdminApi";


type InvitationRole = "HSE Manager" | "Site Inspector" | "Site Engineer" | "Supervisor" | "Worker";
type InvitationStatus = "pending" | "accepted" | "expired" | "cancelled";

interface Invitation {
  id: string;
  name: string;
  email: string;
  role: InvitationRole;
  site: string;
  sentAt: string;
  expiryDate: string;
  status: InvitationStatus;
}

const MOCK_INVITATIONS: Invitation[] = [
  { id: "1", name: "Rajan Mehta", email: "rajan.mehta@site.com", role: "HSE Manager", site: "North Plant", sentAt: "2026-05-20", expiryDate: "2026-05-27", status: "pending" },
  { id: "2", name: "Priya Sharma", email: "priya.s@site.com", role: "Site Inspector", site: "South Zone", sentAt: "2026-05-18", expiryDate: "2026-05-25", status: "accepted" },
  { id: "3", name: "Ajay Kumar", email: "ajay.k@site.com", role: "Site Engineer", site: "East Block", sentAt: "2026-05-10", expiryDate: "2026-05-17", status: "expired" },
  { id: "4", name: "Sunita Verma", email: "sunita.v@site.com", role: "HSE Manager", site: "West Gate", sentAt: "2026-05-22", expiryDate: "2026-05-29", status: "pending" },
];

const ROLES: InvitationRole[] = ["HSE Manager", "Site Inspector", "Site Engineer", "Supervisor", "Worker"];
const SITES = ["North Plant", "South Zone", "East Block", "West Gate", "Central Hub"];

const STATUS_CONFIG: Record<InvitationStatus, { bg: string; text: string; icon: typeof CheckCircle }> = {
  pending:   { bg: "#FEF3C7", text: "#92400E", icon: Clock },
  accepted:  { bg: "#D1FAE5", text: "#065F46", icon: CheckCircle },
  expired:   { bg: "#FEE2E2", text: "#991B1B", icon: XCircle },
  cancelled: { bg: "#F3F4F6", text: "#6B7280", icon: XCircle },
};

export function OrgInvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>(MOCK_INVITATIONS);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "HSE Manager" as InvitationRole, site: SITES[0], expiryDays: 7 });
  const [filterStatus, setFilterStatus] = useState<"all" | InvitationStatus>("all");

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const result = await inviteUser({ name: form.name, email: form.email, role: form.role, site: form.site });
      const now = new Date();
      const expiry = new Date(now);
      expiry.setDate(expiry.getDate() + form.expiryDays);
      const newInv: Invitation = {
        id: result.id ?? String(Date.now()),
        name: form.name,
        email: form.email,
        role: form.role,
        site: form.site,
        sentAt: now.toISOString().slice(0, 10),
        expiryDate: expiry.toISOString().slice(0, 10),
        status: "pending",
      };
      setInvitations((prev) => [newInv, ...prev]);
      setShowForm(false);
      setForm({ name: "", email: "", role: "HSE Manager", site: SITES[0], expiryDays: 7 });
      showToast(`Invitation sent to ${form.email}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to send invitation.", false);
    } finally {
      setSending(false);
    }
  };

  const handleResend = (id: string, email: string) => {
    showToast(`Invitation resent to ${email}`);
  };

  const handleCancel = (id: string) => {
    setInvitations((prev) => prev.map((inv) => inv.id === id ? { ...inv, status: "cancelled" } : inv));
    showToast("Invitation cancelled.");
  };

  const filtered = filterStatus === "all" ? invitations : invitations.filter((inv) => inv.status === filterStatus);
  const counts = { pending: invitations.filter((i) => i.status === "pending").length, accepted: invitations.filter((i) => i.status === "accepted").length };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border px-5 py-4" style={{ borderColor: "#DCE4F3", background: "#FFFFFF" }}>
        <div>
          <h1 className="text-[22px]" style={{ color: "#111827", fontWeight: 700 }}>Team Invitations</h1>
          <p className="text-[13px] mt-0.5" style={{ color: "#64748B" }}>Invite HSE managers, inspectors, and site engineers to your organisation.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-semibold"
          style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
        >
          <Plus className="w-4 h-4" /> New Invitation
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Sent", value: invitations.length, color: "#4A57B9" },
          { label: "Pending", value: counts.pending, color: "#D97706" },
          { label: "Accepted", value: counts.accepted, color: "#059669" },
          { label: "Expired", value: invitations.filter((i) => i.status === "expired").length, color: "#DC2626" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border px-4 py-3" style={{ borderColor: "#E3E9F6" }}>
            <div className="text-[28px] font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[12px] font-medium mt-0.5" style={{ color: "#6B7280" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div className="rounded-xl px-4 py-3 text-[13px] font-medium flex items-center gap-2" style={{ background: toast.ok ? "#D1FAE5" : "#FEE2E2", color: toast.ok ? "#065F46" : "#991B1B" }}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#E3E9F6" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold" style={{ color: "#111827" }}>Send New Invitation</h2>
            <button onClick={() => setShowForm(false)}><X className="w-5 h-5" style={{ color: "#6B7280" }} /></button>
          </div>
          <form onSubmit={handleSend} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wide" style={{ color: "#6B7280" }}>Full Name</label>
              <input
                className="w-full border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-blue-200"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                placeholder="e.g. Rajan Mehta"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wide" style={{ color: "#6B7280" }}>Email Address</label>
              <input
                type="email"
                className="w-full border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-blue-200"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                placeholder="manager@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wide" style={{ color: "#6B7280" }}>Role</label>
              <select
                className="w-full border rounded-xl px-3 py-2.5 text-[13px] bg-white outline-none"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as InvitationRole })}
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wide" style={{ color: "#6B7280" }}>Assign to Site</label>
              <select
                className="w-full border rounded-xl px-3 py-2.5 text-[13px] bg-white outline-none"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                value={form.site}
                onChange={(e) => setForm({ ...form, site: e.target.value })}
              >
                {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wide" style={{ color: "#6B7280" }}>Expiry (days)</label>
              <input
                type="number"
                min={1}
                max={30}
                className="w-full border rounded-xl px-3 py-2.5 text-[13px] outline-none"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                value={form.expiryDays}
                onChange={(e) => setForm({ ...form, expiryDays: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-end gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={sending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-[13px] font-semibold disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {sending ? "Sending..." : "Send Invitation"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl text-[13px] font-medium border"
                style={{ borderColor: "#E3E9F6", color: "#6B7280" }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "pending", "accepted", "expired", "cancelled"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-all"
            style={filterStatus === s
              ? { background: "linear-gradient(135deg, #4A57B9, #6F80E8)", color: "#fff" }
              : { background: "#F3F7FF", color: "#64748B" }
            }
          >
            {s === "all" ? `All (${invitations.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${invitations.filter((i) => i.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#6B7280" }}>Name</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#6B7280" }}>Email</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#6B7280" }}>Role</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#6B7280" }}>Site</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#6B7280" }}>Status</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#6B7280" }}>Expiry</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#6B7280" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center" style={{ color: "#9CA3AF" }}>No invitations found</td>
                </tr>
              ) : filtered.map((inv) => {
                const cfg = STATUS_CONFIG[inv.status];
                const StatusIcon = cfg.icon;
                return (
                  <tr key={inv.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-5 py-3.5 font-semibold" style={{ color: "#111827" }}>{inv.name}</td>
                    <td className="px-5 py-3.5" style={{ color: "#4B5563" }}>{inv.email}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: "#EEF2FF", color: "#4338CA" }}>{inv.role}</span>
                    </td>
                    <td className="px-5 py-3.5" style={{ color: "#4B5563" }}>{inv.site}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize" style={{ background: cfg.bg, color: cfg.text }}>
                        <StatusIcon className="w-3 h-3" />{inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[12px]" style={{ color: "#9CA3AF" }}>{inv.expiryDate}</td>
                    <td className="px-5 py-3.5">
                      {inv.status === "pending" ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleResend(inv.id, inv.email)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-semibold border transition-colors"
                            style={{ borderColor: "#4A57B9", color: "#4A57B9" }}
                          >
                            <RefreshCw className="w-3 h-3" /> Resend
                          </button>
                          <button
                            onClick={() => handleCancel(inv.id)}
                            className="px-3 py-1 rounded-lg text-[11px] font-semibold border transition-colors"
                            style={{ borderColor: "#EF4444", color: "#EF4444" }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="text-[12px]" style={{ color: "#9CA3AF" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
