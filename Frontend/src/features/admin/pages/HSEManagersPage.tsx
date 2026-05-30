import { useState } from "react";
import { Plus, ShieldCheck, MapPin, Mail, Phone, Edit, Trash2, X, UserCheck, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { inviteUser } from "@/features/admin/api/orgAdminApi";

interface HSEManager {
  id: string;
  name: string;
  email: string;
  phone: string;
  site: string;
  department: string;
  status: "Active" | "Inactive" | "Pending";
  complianceScore: number;
  openIncidents: number;
  joinedAt: string;
}

const SITES = ["North Plant", "South Zone", "East Block", "West Gate", "Central Hub"];
const DEPARTMENTS = ["Safety & Compliance", "Operations", "Maintenance", "Environmental", "Security"];

const MOCK_MANAGERS: HSEManager[] = [
  { id: "1", name: "Rajan Mehta", email: "rajan.mehta@site.com", phone: "+91-9876543210", site: "North Plant", department: "Safety & Compliance", status: "Active", complianceScore: 94, openIncidents: 2, joinedAt: "2026-04-01" },
  { id: "2", name: "Priya Sharma", email: "priya.s@site.com", phone: "+91-9123456780", site: "South Zone", department: "Operations", status: "Active", complianceScore: 88, openIncidents: 5, joinedAt: "2026-04-05" },
  { id: "3", name: "Sunita Verma", email: "sunita.v@site.com", phone: "+91-9234567891", site: "West Gate", department: "Environmental", status: "Pending", complianceScore: 0, openIncidents: 0, joinedAt: "2026-05-20" },
  { id: "4", name: "Mohan Das", email: "mohan@site.com", phone: "+91-9345678902", site: "Central Hub", department: "Security", status: "Active", complianceScore: 76, openIncidents: 8, joinedAt: "2026-03-15" },
  { id: "5", name: "Ajay Kumar", email: "ajay.k@site.com", phone: "+91-9456789013", site: "East Block", department: "Maintenance", status: "Inactive", complianceScore: 65, openIncidents: 0, joinedAt: "2026-02-10" },
];

const STATUS_CONFIG = {
  Active: { bg: "#D1FAE5", text: "#065F46" },
  Inactive: { bg: "#F3F4F6", text: "#6B7280" },
  Pending: { bg: "#FEF3C7", text: "#92400E" },
};

const emptyForm = { name: "", email: "", phone: "", site: SITES[0], department: DEPARTMENTS[0] };

function scoreColor(score: number) {
  return score >= 90 ? "#059669" : score >= 70 ? "#D97706" : "#DC2626";
}

export function HSEManagersPage() {
  const [managers, setManagers] = useState<HSEManager[]>(MOCK_MANAGERS);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterSite, setFilterSite] = useState("All Sites");
  const [filterStatus, setFilterStatus] = useState("All");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedManager, setSelectedManager] = useState<HSEManager | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
    setSelectedManager(null);
  };

  const openEdit = (mgr: HSEManager) => {
    setEditId(mgr.id);
    setForm({ name: mgr.name, email: mgr.email, phone: mgr.phone, site: mgr.site, department: mgr.department });
    setShowForm(true);
    setSelectedManager(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      setManagers((prev) => prev.map((m) => m.id === editId ? { ...m, ...form } : m));
      showToast("HSE Manager updated.");
      setShowForm(false);
      setEditId(null);
      return;
    }

    setSubmitting(true);
    try {
      await inviteUser({
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: "HSE Manager",
        site: form.site,
        department: form.department,
      });
      const newMgr: HSEManager = {
        id: String(Date.now()),
        ...form,
        status: "Pending",
        complianceScore: 0,
        openIncidents: 0,
        joinedAt: new Date().toISOString().slice(0, 10),
      };
      setManagers((prev) => [newMgr, ...prev]);
      showToast(`Invitation sent to ${form.email}. They will receive login credentials via email.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to send invitation. Please try again.", false);
    } finally {
      setSubmitting(false);
    }
    setShowForm(false);
    setEditId(null);
  };

  const handleDelete = (id: string) => {
    setManagers((prev) => prev.filter((m) => m.id !== id));
    setDeleteId(null);
    if (selectedManager?.id === id) setSelectedManager(null);
    showToast("HSE Manager removed.", false);
  };

  let filtered = managers;
  if (filterSite !== "All Sites") filtered = filtered.filter((m) => m.site === filterSite);
  if (filterStatus !== "All") filtered = filtered.filter((m) => m.status === filterStatus);

  const scoreColor = (score: number) => score >= 90 ? "#059669" : score >= 70 ? "#D97706" : "#DC2626";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border px-5 py-4" style={{ borderColor: "#DCE4F3", background: "#FFFFFF" }}>
        <div>
          <h1 className="text-[22px]" style={{ color: "#111827", fontWeight: 700 }}>HSE Managers</h1>
          <p className="text-[13px] mt-0.5" style={{ color: "#64748B" }}>Assign and monitor HSE managers across all sites and departments.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-semibold"
          style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
        >
          <Plus className="w-4 h-4" /> Add HSE Manager
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border px-4 py-3" style={{ borderColor: "#E3E9F6" }}>
          <div className="text-[28px] font-bold" style={{ color: "#4A57B9" }}>{managers.length}</div>
          <div className="text-[12px] font-medium mt-0.5" style={{ color: "#6B7280" }}>Total Managers</div>
        </div>
        <div className="bg-white rounded-2xl border px-4 py-3" style={{ borderColor: "#E3E9F6" }}>
          <div className="text-[28px] font-bold" style={{ color: "#059669" }}>{managers.filter((m) => m.status === "Active").length}</div>
          <div className="text-[12px] font-medium mt-0.5" style={{ color: "#6B7280" }}>Active</div>
        </div>
        <div className="bg-white rounded-2xl border px-4 py-3" style={{ borderColor: "#E3E9F6" }}>
          <div className="text-[28px] font-bold" style={{ color: "#D97706" }}>{managers.filter((m) => m.status === "Pending").length}</div>
          <div className="text-[12px] font-medium mt-0.5" style={{ color: "#6B7280" }}>Pending Invite</div>
        </div>
        <div className="bg-white rounded-2xl border px-4 py-3" style={{ borderColor: "#E3E9F6" }}>
          <div className="text-[28px] font-bold" style={{ color: "#DC2626" }}>{managers.reduce((s, m) => s + m.openIncidents, 0)}</div>
          <div className="text-[12px] font-medium mt-0.5" style={{ color: "#6B7280" }}>Open Incidents</div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="rounded-xl px-4 py-3 text-[13px] font-medium" style={{ background: toast.ok ? "#D1FAE5" : "#FEE2E2", color: toast.ok ? "#065F46" : "#991B1B" }}>
          {toast.msg}
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl border p-6 max-w-sm w-full mx-4" style={{ borderColor: "#E3E9F6" }}>
            <h3 className="text-[16px] font-bold mb-2" style={{ color: "#111827" }}>Remove HSE Manager</h3>
            <p className="text-[13px] mb-4" style={{ color: "#6B7280" }}>This will remove the manager from the organisation. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-semibold" style={{ background: "#EF4444" }}>Remove</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Profile drawer */}
      {selectedManager && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-end bg-black/20" onClick={() => setSelectedManager(null)}>
          <div className="bg-white w-full sm:w-[360px] h-full sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl overflow-y-auto" style={{ borderColor: "#E3E9F6", boxShadow: "0 20px 60px rgba(15,23,42,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "#F3F4F6" }}>
              <h2 className="text-[16px] font-bold" style={{ color: "#111827" }}>Manager Profile</h2>
              <button onClick={() => setSelectedManager(null)}><X className="w-5 h-5" style={{ color: "#6B7280" }} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-[18px] font-bold" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
                  {selectedManager.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-[16px] font-bold" style={{ color: "#111827" }}>{selectedManager.name}</div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: STATUS_CONFIG[selectedManager.status].bg, color: STATUS_CONFIG[selectedManager.status].text }}>
                    {selectedManager.status}
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-[13px]">
                <div className="flex items-center gap-2" style={{ color: "#4B5563" }}><Mail className="w-4 h-4 flex-shrink-0" style={{ color: "#9CA3AF" }} />{selectedManager.email}</div>
                <div className="flex items-center gap-2" style={{ color: "#4B5563" }}><Phone className="w-4 h-4 flex-shrink-0" style={{ color: "#9CA3AF" }} />{selectedManager.phone}</div>
                <div className="flex items-center gap-2" style={{ color: "#4B5563" }}><MapPin className="w-4 h-4 flex-shrink-0" style={{ color: "#9CA3AF" }} />{selectedManager.site}</div>
                <div className="flex items-center gap-2" style={{ color: "#4B5563" }}><ShieldCheck className="w-4 h-4 flex-shrink-0" style={{ color: "#9CA3AF" }} />{selectedManager.department}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3 text-center" style={{ borderColor: "#E3E9F6" }}>
                  <div className="text-[24px] font-bold" style={{ color: scoreColor(selectedManager.complianceScore) }}>{selectedManager.complianceScore}%</div>
                  <div className="text-[11px] mt-0.5" style={{ color: "#6B7280" }}>Compliance Score</div>
                </div>
                <div className="rounded-xl border p-3 text-center" style={{ borderColor: "#E3E9F6" }}>
                  <div className="text-[24px] font-bold" style={{ color: selectedManager.openIncidents > 0 ? "#DC2626" : "#059669" }}>{selectedManager.openIncidents}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: "#6B7280" }}>Open Incidents</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { openEdit(selectedManager); }} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)", color: "#fff" }}>Edit</button>
                <button onClick={() => { setDeleteId(selectedManager.id); setSelectedManager(null); }} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border" style={{ borderColor: "#EF4444", color: "#EF4444" }}>Remove</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit form */}
      {showForm && (
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#E3E9F6" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold" style={{ color: "#111827" }}>{editId ? "Edit HSE Manager" : "Add HSE Manager"}</h2>
            <button onClick={() => setShowForm(false)}><X className="w-5 h-5" style={{ color: "#6B7280" }} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wide" style={{ color: "#6B7280" }}>Full Name</label>
              <input className="w-full border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: "#E3E9F6", color: "#111827" }} placeholder="e.g. Rajan Mehta" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wide" style={{ color: "#6B7280" }}>Email</label>
              <input type="email" className="w-full border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: "#E3E9F6", color: "#111827" }} placeholder="manager@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wide" style={{ color: "#6B7280" }}>Phone</label>
              <input className="w-full border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: "#E3E9F6", color: "#111827" }} placeholder="+91-9876543210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wide" style={{ color: "#6B7280" }}>Assign to Site</label>
              <select className="w-full border rounded-xl px-3 py-2.5 text-[13px] bg-white outline-none" style={{ borderColor: "#E3E9F6", color: "#111827" }} value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })}>
                {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wide" style={{ color: "#6B7280" }}>Department</label>
              <select className="w-full border rounded-xl px-3 py-2.5 text-[13px] bg-white outline-none" style={{ borderColor: "#E3E9F6", color: "#111827" }} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-[13px] font-semibold disabled:opacity-70"
                style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                {submitting ? "Sending…" : editId ? "Update" : "Add & Invite"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl text-[13px] font-medium border" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {["All Sites", ...SITES].map((s) => (
            <button key={s} onClick={() => setFilterSite(s)} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all" style={filterSite === s ? { background: "linear-gradient(135deg, #4A57B9, #6F80E8)", color: "#fff" } : { background: "#F3F7FF", color: "#64748B" }}>{s}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {["All", "Active", "Pending", "Inactive"].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all" style={filterStatus === s ? { background: "#1F2937", color: "#fff" } : { background: "#F3F7FF", color: "#64748B" }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#6B7280" }}>Manager</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#6B7280" }}>Site</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#6B7280" }}>Department</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#6B7280" }}>Status</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#6B7280" }}>Compliance</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#6B7280" }}>Incidents</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#6B7280" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center" style={{ color: "#9CA3AF" }}>No HSE managers found</td></tr>
              ) : filtered.map((mgr) => {
                const sc = STATUS_CONFIG[mgr.status];
                return (
                  <tr key={mgr.id} className="border-t hover:bg-blue-50/30 cursor-pointer transition-colors" style={{ borderColor: "#F3F4F6" }} onClick={() => setSelectedManager(mgr)}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
                          {mgr.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold" style={{ color: "#111827" }}>{mgr.name}</div>
                          <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{mgr.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5" style={{ color: "#4B5563" }}>{mgr.site}</td>
                    <td className="px-5 py-3.5" style={{ color: "#4B5563" }}>{mgr.department}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: sc.bg, color: sc.text }}>{mgr.status}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {mgr.status === "Pending" ? (
                        <span className="text-[12px]" style={{ color: "#9CA3AF" }}>—</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                            <div className="h-full rounded-full" style={{ width: `${mgr.complianceScore}%`, background: scoreColor(mgr.complianceScore) }} />
                          </div>
                          <span className="font-semibold" style={{ color: scoreColor(mgr.complianceScore) }}>{mgr.complianceScore}%</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {mgr.openIncidents > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: "#DC2626" }}>
                          <AlertTriangle className="w-3.5 h-3.5" />{mgr.openIncidents}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: "#059669" }}>
                          <CheckCircle className="w-3.5 h-3.5" />None
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(mgr)} className="p-1.5 rounded-lg hover:bg-blue-50" title="Edit"><Edit className="w-3.5 h-3.5" style={{ color: "#4A57B9" }} /></button>
                        <button onClick={() => setDeleteId(mgr.id)} className="p-1.5 rounded-lg hover:bg-red-50" title="Remove"><Trash2 className="w-3.5 h-3.5" style={{ color: "#EF4444" }} /></button>
                      </div>
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
