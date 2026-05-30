import { useState } from "react";
import { Plus, Building, Users, MapPin, Edit, Trash2, X, ChevronRight } from "lucide-react";

interface Department {
  id: string;
  name: string;
  site: string;
  head: string;
  headEmail: string;
  workersCount: number;
  status: "Active" | "Inactive";
  createdAt: string;
}

const SITES = ["North Plant", "South Zone", "East Block", "West Gate", "Central Hub"];

const MOCK_DEPARTMENTS: Department[] = [
  { id: "1", name: "Safety & Compliance", site: "North Plant", head: "Rajan Mehta", headEmail: "rajan@site.com", workersCount: 24, status: "Active", createdAt: "2026-04-01" },
  { id: "2", name: "Operations", site: "South Zone", head: "Priya Sharma", headEmail: "priya@site.com", workersCount: 58, status: "Active", createdAt: "2026-04-01" },
  { id: "3", name: "Maintenance", site: "East Block", head: "Ajay Kumar", headEmail: "ajay@site.com", workersCount: 32, status: "Active", createdAt: "2026-04-05" },
  { id: "4", name: "Environmental", site: "West Gate", head: "Sunita Verma", headEmail: "sunita@site.com", workersCount: 15, status: "Active", createdAt: "2026-04-10" },
  { id: "5", name: "Security", site: "Central Hub", head: "Mohan Das", headEmail: "mohan@site.com", workersCount: 20, status: "Inactive", createdAt: "2026-03-15" },
];

const emptyForm = { name: "", site: SITES[0], head: "", headEmail: "", workersCount: 0 };

export function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>(MOCK_DEPARTMENTS);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterSite, setFilterSite] = useState("All Sites");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (dep: Department) => {
    setEditId(dep.id);
    setForm({ name: dep.name, site: dep.site, head: dep.head, headEmail: dep.headEmail, workersCount: dep.workersCount });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      setDepartments((prev) => prev.map((d) => d.id === editId ? { ...d, ...form } : d));
      showToast("Department updated.");
    } else {
      const newDep: Department = {
        id: String(Date.now()),
        ...form,
        status: "Active",
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setDepartments((prev) => [newDep, ...prev]);
      showToast("Department created.");
    }
    setShowForm(false);
    setEditId(null);
  };

  const handleDelete = (id: string) => {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    setDeleteId(null);
    showToast("Department deleted.", false);
  };

  const filtered = filterSite === "All Sites" ? departments : departments.filter((d) => d.site === filterSite);
  const activeSites = [...new Set(departments.map((d) => d.site))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border px-5 py-4" style={{ borderColor: "#DCE4F3", background: "#FFFFFF" }}>
        <div>
          <h1 className="text-[22px]" style={{ color: "#111827", fontWeight: 700 }}>Departments</h1>
          <p className="text-[13px] mt-0.5" style={{ color: "#64748B" }}>Manage organisation departments across all sites.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-semibold"
          style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
        >
          <Plus className="w-4 h-4" /> New Department
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border px-4 py-3" style={{ borderColor: "#E3E9F6" }}>
          <div className="text-[28px] font-bold" style={{ color: "#4A57B9" }}>{departments.length}</div>
          <div className="text-[12px] font-medium mt-0.5" style={{ color: "#6B7280" }}>Total Departments</div>
        </div>
        <div className="bg-white rounded-2xl border px-4 py-3" style={{ borderColor: "#E3E9F6" }}>
          <div className="text-[28px] font-bold" style={{ color: "#059669" }}>{departments.filter((d) => d.status === "Active").length}</div>
          <div className="text-[12px] font-medium mt-0.5" style={{ color: "#6B7280" }}>Active</div>
        </div>
        <div className="bg-white rounded-2xl border px-4 py-3" style={{ borderColor: "#E3E9F6" }}>
          <div className="text-[28px] font-bold" style={{ color: "#D97706" }}>{activeSites.length}</div>
          <div className="text-[12px] font-medium mt-0.5" style={{ color: "#6B7280" }}>Sites Covered</div>
        </div>
        <div className="bg-white rounded-2xl border px-4 py-3" style={{ borderColor: "#E3E9F6" }}>
          <div className="text-[28px] font-bold" style={{ color: "#111827" }}>{departments.reduce((s, d) => s + d.workersCount, 0)}</div>
          <div className="text-[12px] font-medium mt-0.5" style={{ color: "#6B7280" }}>Total Workers</div>
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
            <h3 className="text-[16px] font-bold mb-2" style={{ color: "#111827" }}>Delete Department</h3>
            <p className="text-[13px] mb-4" style={{ color: "#6B7280" }}>This will permanently remove the department and cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-semibold" style={{ background: "#EF4444" }}>Delete</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit form */}
      {showForm && (
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#E3E9F6" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold" style={{ color: "#111827" }}>{editId ? "Edit Department" : "Create Department"}</h2>
            <button onClick={() => setShowForm(false)}><X className="w-5 h-5" style={{ color: "#6B7280" }} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wide" style={{ color: "#6B7280" }}>Department Name</label>
              <input
                className="w-full border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-blue-200"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                placeholder="e.g. Safety & Compliance"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wide" style={{ color: "#6B7280" }}>Site</label>
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
              <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wide" style={{ color: "#6B7280" }}>Department Head</label>
              <input
                className="w-full border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-blue-200"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                placeholder="Full name"
                value={form.head}
                onChange={(e) => setForm({ ...form, head: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wide" style={{ color: "#6B7280" }}>Head Email</label>
              <input
                type="email"
                className="w-full border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-blue-200"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                placeholder="head@company.com"
                value={form.headEmail}
                onChange={(e) => setForm({ ...form, headEmail: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wide" style={{ color: "#6B7280" }}>Workers Count</label>
              <input
                type="number"
                min={0}
                className="w-full border rounded-xl px-3 py-2.5 text-[13px] outline-none"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                value={form.workersCount}
                onChange={(e) => setForm({ ...form, workersCount: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-end gap-3 md:col-span-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-[13px] font-semibold"
                style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
              >
                {editId ? "Update Department" : "Create Department"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl text-[13px] font-medium border" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Site filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {["All Sites", ...SITES].map((s) => (
          <button
            key={s}
            onClick={() => setFilterSite(s)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
            style={filterSite === s
              ? { background: "linear-gradient(135deg, #4A57B9, #6F80E8)", color: "#fff" }
              : { background: "#F3F7FF", color: "#64748B" }
            }
          >
            {s}
          </button>
        ))}
      </div>

      {/* Grid of departments */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((dep) => (
          <div key={dep.id} className="bg-white rounded-2xl border p-5 hover:shadow-md transition-all group" style={{ borderColor: "#E3E9F6", boxShadow: "0 2px 8px rgba(15,23,42,0.06)" }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)" }}>
                  <Building className="w-5 h-5" style={{ color: "#4338CA" }} />
                </div>
                <div>
                  <div className="text-[14px] font-bold" style={{ color: "#111827" }}>{dep.name}</div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${dep.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {dep.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(dep)} className="p-1.5 rounded-lg hover:bg-blue-50" title="Edit">
                  <Edit className="w-3.5 h-3.5" style={{ color: "#4A57B9" }} />
                </button>
                <button onClick={() => setDeleteId(dep.id)} className="p-1.5 rounded-lg hover:bg-red-50" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />
                </button>
              </div>
            </div>
            <div className="space-y-2 text-[12px]">
              <div className="flex items-center gap-2" style={{ color: "#4B5563" }}>
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#9CA3AF" }} />
                <span>{dep.site}</span>
              </div>
              <div className="flex items-center gap-2" style={{ color: "#4B5563" }}>
                <Users className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#9CA3AF" }} />
                <span>{dep.workersCount} workers</span>
              </div>
              <div className="flex items-center gap-2" style={{ color: "#4B5563" }}>
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#9CA3AF" }} />
                <span>{dep.head}</span>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-3 py-12 text-center" style={{ color: "#9CA3AF" }}>
            No departments found for this site.
          </div>
        )}
      </div>
    </div>
  );
}
