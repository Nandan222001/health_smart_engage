import { useState, useMemo } from "react";
import {
  MapPin, Building2, Plus, Trash2, Edit, X, Save,
  ChevronRight, CheckCircle2, AlertCircle, Loader2,
  Users, Shield, Lock, Unlock, Eye, Settings,
  GitBranch, Layers, Info, RefreshCw, Search,
  UserCheck, HardHat, Briefcase, ClipboardCheck,
} from "lucide-react";
import {
  useListSitesQuery,
  useCreateSiteMutation,
  useUpdateSiteMutation,
  useDeleteSiteMutation,
  useListZonesQuery,
  useCreateZoneMutation,
  useDeleteZoneMutation,
  type SiteRecord,
  type ZoneRecord,
} from "@/features/sites/api/sitesApi";
import {
  useListOrganisationNodesQuery,
} from "@/features/admin/api/foundationApi";

// ─── Constants ────────────────────────────────────────────────────────────────

const SITE_TYPES  = ["Plant", "Office", "Depot", "Warehouse", "Port", "Mine", "Refinery", "Construction Site", "Remote Site", "Other"];
const ZONE_TYPES  = ["Production", "Storage", "Administrative", "Maintenance", "Security", "Entry/Exit", "Emergency", "Restricted", "General"];

const DEPT_COLORS = ["#4F46E5","#0891B2","#059669","#D97706","#DC2626","#7C3AED","#DB2777","#2563EB"];

const ROLES = [
  { id: "admin",       label: "Admin",       icon: Shield,        color: "#4F46E5" },
  { id: "hse_manager", label: "HSE Manager", icon: HardHat,       color: "#059669" },
  { id: "supervisor",  label: "Supervisor",  icon: UserCheck,     color: "#0891B2" },
  { id: "worker",      label: "Worker",      icon: Users,         color: "#D97706" },
  { id: "auditor",     label: "Auditor",     icon: ClipboardCheck,color: "#7C3AED" },
  { id: "contractor",  label: "Contractor",  icon: Briefcase,     color: "#DC2626" },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active:      { label: "Active",      color: "#059669", bg: "#ECFDF5" },
  inactive:    { label: "Inactive",    color: "#6B7280", bg: "#F3F4F6" },
  maintenance: { label: "Maintenance", color: "#D97706", bg: "#FFFBEB" },
};

const SITE_BG_COLORS = ["#EEF2FF","#F0F9FF","#ECFDF5","#FFFBEB","#FEF2F2","#F5F3FF"];
const SITE_ICON_COLORS = ["#4F46E5","#0891B2","#059669","#D97706","#DC2626","#7C3AED"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold animate-in"
      style={{ background: ok ? "#ECFDF5" : "#FEF2F2", color: ok ? "#065F46" : "#991B1B", border: `1px solid ${ok ? "#A7F3D0" : "#FECACA"}` }}>
      {ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      {msg}
    </div>
  );
}

function SectionBadge({ count, color }: { count: number; color: string }) {
  return (
    <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold"
      style={{ background: `${color}18`, color }}>
      {count}
    </span>
  );
}

function EmptyState({ icon: Icon, title, sub, color }: { icon: React.ElementType; title: string; sub: string; color: string }) {
  return (
    <div className="py-16 text-center rounded-2xl border-2 border-dashed" style={{ borderColor: "#E3E9F6" }}>
      <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: `${color}12` }}>
        <Icon size={28} style={{ color }} />
      </div>
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

// ─── Tab: Site Information ────────────────────────────────────────────────────

function SiteInfoTab() {
  const { data: rawSites = [], isLoading, refetch } = useListSitesQuery();
  const [createSite, { isLoading: creating }] = useCreateSiteMutation();
  const [updateSite, { isLoading: updating }] = useUpdateSiteMutation();
  const [deleteSite] = useDeleteSiteMutation();

  const sites: SiteRecord[] = Array.isArray(rawSites) ? rawSites : [];

  const [modal, setModal]     = useState<"create" | "edit" | null>(null);
  const [editTarget, setEdit] = useState<SiteRecord | null>(null);
  const [deleteId, setDel]    = useState<string | null>(null);
  const [search, setSearch]   = useState("");
  const [filterType, setFT]   = useState("All");
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null);
  const [form, setForm]       = useState<Partial<SiteRecord>>({ name: "", type: "Plant", address: "", status: "active" });

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const filtered = useMemo(() =>
    sites.filter(s =>
      (filterType === "All" || s.type === filterType) &&
      s.name.toLowerCase().includes(search.toLowerCase())
    ), [sites, filterType, search]);

  const types = [...new Set(sites.map(s => s.type).filter(Boolean))];

  async function handleSubmit() {
    try {
      if (modal === "create") {
        await createSite(form).unwrap();
        showToast("Site created successfully.");
      } else if (modal === "edit" && editTarget) {
        await updateSite({ siteId: editTarget.id, body: form }).unwrap();
        showToast("Site updated.");
      }
      setModal(null); setEdit(null);
      setForm({ name: "", type: "Plant", address: "", status: "active" });
    } catch { showToast("Failed to save site.", false); }
  }

  async function handleDelete(id: string) {
    try { await deleteSite(id).unwrap(); showToast("Site deleted.", false); }
    catch { showToast("Failed to delete site.", false); }
    setDel(null);
  }

  function openCreate() {
    setForm({ name: "", type: "Plant", address: "", status: "active" });
    setEdit(null); setModal("create");
  }

  function openEdit(s: SiteRecord) {
    setForm({ name: s.name, type: s.type, address: s.address, status: s.status });
    setEdit(s); setModal("edit");
  }

  return (
    <div className="space-y-5">
      {toast && <Toast {...toast} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Site Information</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage all sites in your organization — add, edit or deactivate locations.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="p-2 rounded-xl border hover:bg-slate-50 transition-colors" style={{ borderColor: "#E3E9F6" }}>
            <RefreshCw size={14} style={{ color: "#9CA3AF" }} />
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #0891B2, #0E7490)" }}>
            <Plus size={14} />Add Site
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Sites",   value: sites.length,                                           color: "#0891B2", bg: "#F0F9FF" },
          { label: "Active",        value: sites.filter(s => s.status === "active").length,        color: "#059669", bg: "#ECFDF5" },
          { label: "Maintenance",   value: sites.filter(s => s.status === "maintenance").length,   color: "#D97706", bg: "#FFFBEB" },
          { label: "Inactive",      value: sites.filter(s => s.status === "inactive").length,      color: "#6B7280", bg: "#F3F4F6" },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 flex items-center gap-3" style={{ background: s.bg, border: `1px solid ${s.color}20` }}>
            <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs font-semibold" style={{ color: s.color }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sites…"
            className="w-full text-sm border rounded-xl pl-8 pr-3 py-2 outline-none"
            style={{ borderColor: "#E3E9F6" }} />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {["All", ...types].map(t => (
            <button key={t} onClick={() => setFT(t)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={filterType === t
                ? { background: "#0891B2", color: "white" }
                : { background: "#F0F9FF", color: "#0891B2" }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Site cards */}
      {isLoading ? (
        <div className="py-16 text-center"><Loader2 size={28} className="mx-auto animate-spin text-sky-400" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={MapPin} title="No sites found" sub="Add your first site to get started." color="#0891B2" />
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((site, idx) => {
            const sm = STATUS_META[site.status || "active"] ?? STATUS_META.active;
            const bgC = SITE_BG_COLORS[idx % SITE_BG_COLORS.length];
            const ic  = SITE_ICON_COLORS[idx % SITE_ICON_COLORS.length];
            return (
              <div key={site.id} className="rounded-2xl border bg-white p-5 group hover:shadow-md transition-all"
                style={{ borderColor: "#E3E9F6" }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: bgC }}>
                      <MapPin size={20} style={{ color: ic }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{site.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: sm.bg, color: sm.color }}>
                        {sm.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(site)} className="p-1.5 rounded-lg hover:bg-sky-50">
                      <Edit size={13} style={{ color: "#0891B2" }} />
                    </button>
                    <button onClick={() => setDel(site.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                      <Trash2 size={13} style={{ color: "#EF4444" }} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Building2 size={11} style={{ color: "#9CA3AF" }} />
                    <span className="font-medium">{site.type || "—"}</span>
                  </div>
                  {site.address && (
                    <div className="flex items-start gap-2">
                      <MapPin size={11} className="mt-0.5 flex-shrink-0" style={{ color: "#9CA3AF" }} />
                      <span className="line-clamp-2">{site.address}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl border shadow-xl w-full max-w-md mx-4 overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
              <h3 className="text-base font-bold text-slate-800">{modal === "create" ? "Add New Site" : "Edit Site"}</h3>
              <button onClick={() => setModal(null)} className="p-1 rounded-lg hover:bg-slate-100"><X size={16} style={{ color: "#6B7280" }} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { label: "Site Name", key: "name" as const, type: "text", placeholder: "e.g. North Plant Alpha" },
                { label: "Address",   key: "address" as const, type: "text", placeholder: "Street, City, Country" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>{f.label}</label>
                  <input type={f.type} value={String(form[f.key] ?? "")} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full text-sm border rounded-xl px-3 py-2.5 outline-none"
                    style={{ borderColor: "#E3E9F6" }} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Type</label>
                  <select value={form.type || "Plant"} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full text-sm border rounded-xl px-3 py-2.5 bg-white outline-none" style={{ borderColor: "#E3E9F6" }}>
                    {SITE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Status</label>
                  <select value={form.status || "active"} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full text-sm border rounded-xl px-3 py-2.5 bg-white outline-none" style={{ borderColor: "#E3E9F6" }}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex items-center gap-3" style={{ borderColor: "#F1F5F9" }}>
              <button onClick={handleSubmit} disabled={creating || updating || !form.name?.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg, #0891B2, #0E7490)" }}>
                {(creating || updating) ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {modal === "create" ? "Create Site" : "Save Changes"}
              </button>
              <button onClick={() => setModal(null)} className="px-4 py-2.5 rounded-xl text-sm font-medium border text-slate-500" style={{ borderColor: "#E3E9F6" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl border p-6 max-w-sm w-full mx-4 shadow-xl" style={{ borderColor: "#E3E9F6" }}>
            <h3 className="text-base font-bold text-slate-800 mb-2">Delete Site?</h3>
            <p className="text-sm text-slate-500 mb-5">This will permanently remove the site and all associated zones. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: "#EF4444" }}>
                Delete Site
              </button>
              <button onClick={() => setDel(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border text-slate-500" style={{ borderColor: "#E3E9F6" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Departments ─────────────────────────────────────────────────────────

interface Dept {
  id: string; name: string; site: string;
  head: string; headEmail: string;
  workersCount: number; status: "Active" | "Inactive";
}

const SEED_DEPTS: Dept[] = [
  { id: "1", name: "Safety & Compliance", site: "North Plant",  head: "Rajan Mehta",    headEmail: "rajan@co.com",  workersCount: 24, status: "Active"   },
  { id: "2", name: "Operations",          site: "South Zone",   head: "Priya Sharma",   headEmail: "priya@co.com",  workersCount: 58, status: "Active"   },
  { id: "3", name: "Maintenance",         site: "East Block",   head: "Ajay Kumar",     headEmail: "ajay@co.com",   workersCount: 32, status: "Active"   },
  { id: "4", name: "Environmental",       site: "West Gate",    head: "Sunita Verma",   headEmail: "sunita@co.com", workersCount: 15, status: "Active"   },
  { id: "5", name: "Security",            site: "Central Hub",  head: "Mohan Das",      headEmail: "mohan@co.com",  workersCount: 20, status: "Inactive" },
];

function DepartmentsTab() {
  const { data: rawSites = [] } = useListSitesQuery();
  const apiSiteNames = (Array.isArray(rawSites) ? rawSites : []).map(s => s.name);
  const siteOptions  = apiSiteNames.length > 0 ? apiSiteNames : ["North Plant", "South Zone", "East Block", "West Gate", "Central Hub"];

  const [depts, setDepts]       = useState<Dept[]>(SEED_DEPTS);
  const [modal, setModal]       = useState<"create" | "edit" | null>(null);
  const [editId, setEditId]     = useState<string | null>(null);
  const [deleteId, setDel]      = useState<string | null>(null);
  const [filterSite, setFilter] = useState("All");
  const [search, setSearch]     = useState("");
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null);
  const [form, setForm]         = useState({ name: "", site: siteOptions[0] ?? "", head: "", headEmail: "", workersCount: 0 });

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const activeSites = [...new Set(depts.map(d => d.site))];

  const filtered = depts.filter(d =>
    (filterSite === "All" || d.site === filterSite) &&
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setForm({ name: "", site: siteOptions[0] ?? "", head: "", headEmail: "", workersCount: 0 });
    setEditId(null); setModal("create");
  }

  function openEdit(d: Dept) {
    setForm({ name: d.name, site: d.site, head: d.head, headEmail: d.headEmail, workersCount: d.workersCount });
    setEditId(d.id); setModal("edit");
  }

  function handleSubmit() {
    if (!form.name.trim()) return;
    if (editId) {
      setDepts(prev => prev.map(d => d.id === editId ? { ...d, ...form } : d));
      showToast("Department updated.");
    } else {
      setDepts(prev => [{ id: String(Date.now()), ...form, status: "Active" as const }, ...prev]);
      showToast("Department created.");
    }
    setModal(null); setEditId(null);
  }

  function handleDelete(id: string) {
    setDepts(prev => prev.filter(d => d.id !== id));
    setDel(null); showToast("Department removed.", false);
  }

  return (
    <div className="space-y-5">
      {toast && <Toast {...toast} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Departments</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage departments across all sites — assign heads and track workforce.</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)" }}>
          <Plus size={14} />New Department
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Departments", value: depts.length,                                       color: "#4F46E5", bg: "#EEF2FF" },
          { label: "Active",            value: depts.filter(d => d.status === "Active").length,    color: "#059669", bg: "#ECFDF5" },
          { label: "Sites Covered",     value: activeSites.length,                                 color: "#0891B2", bg: "#F0F9FF" },
          { label: "Total Workers",     value: depts.reduce((s, d) => s + d.workersCount, 0),      color: "#D97706", bg: "#FFFBEB" },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 flex items-center gap-3" style={{ background: s.bg, border: `1px solid ${s.color}20` }}>
            <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs font-semibold" style={{ color: s.color }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search departments…"
            className="w-full text-sm border rounded-xl pl-8 pr-3 py-2 outline-none" style={{ borderColor: "#E3E9F6" }} />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {["All", ...activeSites].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={filterSite === s ? { background: "#4F46E5", color: "white" } : { background: "#EEF2FF", color: "#4F46E5" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Department cards */}
      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No departments found" sub="Add departments or change your filter." color="#4F46E5" />
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((dep, idx) => {
            const color = DEPT_COLORS[idx % DEPT_COLORS.length];
            return (
              <div key={dep.id} className="rounded-2xl border bg-white p-5 group hover:shadow-md transition-all"
                style={{ borderColor: "#E3E9F6" }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0"
                      style={{ background: color }}>
                      {dep.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{dep.name}</h3>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${dep.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                        {dep.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(dep)} className="p-1.5 rounded-lg hover:bg-indigo-50">
                      <Edit size={13} style={{ color: "#4F46E5" }} />
                    </button>
                    <button onClick={() => setDel(dep.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                      <Trash2 size={13} style={{ color: "#EF4444" }} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-2"><MapPin size={11} style={{ color: "#9CA3AF" }} /><span>{dep.site}</span></div>
                  <div className="flex items-center gap-2"><Users size={11} style={{ color: "#9CA3AF" }} /><span>{dep.workersCount} workers</span></div>
                  <div className="flex items-center gap-2"><UserCheck size={11} style={{ color: "#9CA3AF" }} /><span>{dep.head}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl border shadow-xl w-full max-w-md mx-4" style={{ borderColor: "#E3E9F6" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
              <h3 className="text-base font-bold text-slate-800">{editId ? "Edit Department" : "New Department"}</h3>
              <button onClick={() => setModal(null)} className="p-1 rounded-lg hover:bg-slate-100"><X size={16} style={{ color: "#6B7280" }} /></button>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Department Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. HSE Operations"
                  className="w-full text-sm border rounded-xl px-3 py-2.5 outline-none" style={{ borderColor: "#E3E9F6" }} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Site</label>
                <select value={form.site} onChange={e => setForm({ ...form, site: e.target.value })}
                  className="w-full text-sm border rounded-xl px-3 py-2.5 bg-white outline-none" style={{ borderColor: "#E3E9F6" }}>
                  {siteOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Workers</label>
                <input type="number" min={0} value={form.workersCount} onChange={e => setForm({ ...form, workersCount: Number(e.target.value) })}
                  className="w-full text-sm border rounded-xl px-3 py-2.5 outline-none" style={{ borderColor: "#E3E9F6" }} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Department Head</label>
                <input value={form.head} onChange={e => setForm({ ...form, head: e.target.value })} placeholder="Full name"
                  className="w-full text-sm border rounded-xl px-3 py-2.5 outline-none" style={{ borderColor: "#E3E9F6" }} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Head Email</label>
                <input type="email" value={form.headEmail} onChange={e => setForm({ ...form, headEmail: e.target.value })} placeholder="head@company.com"
                  className="w-full text-sm border rounded-xl px-3 py-2.5 outline-none" style={{ borderColor: "#E3E9F6" }} />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex gap-3" style={{ borderColor: "#F1F5F9" }}>
              <button onClick={handleSubmit} disabled={!form.name.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)" }}>
                <Save size={14} />{editId ? "Save Changes" : "Create"}
              </button>
              <button onClick={() => setModal(null)} className="px-4 py-2.5 rounded-xl text-sm font-medium border text-slate-500" style={{ borderColor: "#E3E9F6" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl border p-6 max-w-sm w-full mx-4 shadow-xl" style={{ borderColor: "#E3E9F6" }}>
            <h3 className="text-base font-bold text-slate-800 mb-2">Delete Department?</h3>
            <p className="text-sm text-slate-500 mb-5">This action is permanent and cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: "#EF4444" }}>Delete</button>
              <button onClick={() => setDel(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border text-slate-500" style={{ borderColor: "#E3E9F6" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Site Hierarchy ──────────────────────────────────────────────────────

function HierarchyTab() {
  const { data: rawSites = [], isLoading: sitesLoading } = useListSitesQuery();
  const { data: rawZones = [], isLoading: zonesLoading }  = useListZonesQuery();
  const { data: orgNodes = [] }                           = useListOrganisationNodesQuery({ type: "business_unit" });
  const [createZone, { isLoading: creatingZone }]         = useCreateZoneMutation();
  const [deleteZone]                                      = useDeleteZoneMutation();

  const sites: SiteRecord[] = Array.isArray(rawSites) ? rawSites : [];
  const zones: ZoneRecord[] = Array.isArray(rawZones) ? rawZones : [];
  const bus    = Array.isArray(orgNodes) ? orgNodes : [];

  const [expandedSites, setExp]  = useState<Record<string, boolean>>({});
  const [addZoneFor, setAddFor]  = useState<string | null>(null);
  const [zoneForm, setZoneForm]  = useState({ name: "", type: "General", description: "" });
  const [toast, setToast]        = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  function toggleSite(id: string) { setExp(prev => ({ ...prev, [id]: !prev[id] })); }

  const zonesForSite = (siteId: string) => zones.filter(z => z.site_id === siteId);

  async function handleAddZone(siteId: string) {
    if (!zoneForm.name.trim()) return;
    try {
      await createZone({ ...zoneForm, site_id: siteId }).unwrap();
      showToast("Zone added.");
      setAddFor(null); setZoneForm({ name: "", type: "General", description: "" });
    } catch { showToast("Failed to add zone.", false); }
  }

  async function handleDeleteZone(id: string) {
    try { await deleteZone(id).unwrap(); showToast("Zone removed.", false); }
    catch { showToast("Failed to remove zone.", false); }
  }

  return (
    <div className="space-y-5">
      {toast && <Toast {...toast} />}

      <div>
        <h2 className="text-lg font-bold text-slate-800">Site Hierarchy</h2>
        <p className="text-xs text-slate-500 mt-0.5">Visual tree of your organization structure — Business Units → Sites → Zones.</p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {[
          { label: "Organization",   color: "#1E1B4B", bg: "#EEF2FF" },
          { label: "Business Unit",  color: "#0891B2", bg: "#F0F9FF" },
          { label: "Site",           color: "#059669", bg: "#ECFDF5" },
          { label: "Zone",           color: "#D97706", bg: "#FFFBEB" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: l.bg, border: `1.5px solid ${l.color}` }} />
            <span className="text-xs text-slate-500">{l.label}</span>
          </div>
        ))}
      </div>

      {sitesLoading || zonesLoading ? (
        <div className="py-16 text-center"><Loader2 size={28} className="mx-auto animate-spin text-emerald-400" /></div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
          {/* Org root */}
          <div className="flex items-center gap-3 px-5 py-4 border-b"
            style={{ borderColor: "#E3E9F6", background: "linear-gradient(135deg, #1E1B4B, #3730A3)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
              <Building2 size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Organization</p>
              <p className="text-xs text-indigo-300">{sites.length} sites · {zones.length} zones</p>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* Business Units layer */}
            {bus.length > 0 && bus.map(bu => (
              <div key={bu.id} className="ml-4 rounded-xl border p-3" style={{ borderColor: "#BAE6FD", background: "#F0F9FF" }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "#0891B2" }}>
                    <Layers size={12} className="text-white" />
                  </div>
                  <span className="text-sm font-semibold text-sky-800">{bu.name}</span>
                  <span className="text-xs text-sky-500 ml-1">Business Unit</span>
                </div>
              </div>
            ))}

            {/* Sites */}
            {sites.length === 0 ? (
              <EmptyState icon={MapPin} title="No sites defined" sub="Add sites from the Site Information tab." color="#059669" />
            ) : (
              sites.map((site, sIdx) => {
                const siteZones  = zonesForSite(site.id);
                const isExpanded = !!expandedSites[site.id];
                const color      = SITE_ICON_COLORS[sIdx % SITE_ICON_COLORS.length];
                return (
                  <div key={site.id} className="ml-4 rounded-xl border overflow-hidden" style={{ borderColor: "#A7F3D0", background: "#F0FDF4" }}>
                    {/* Site row */}
                    <button onClick={() => toggleSite(site.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-left">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color }}>
                        <MapPin size={13} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-emerald-900">{site.name}</span>
                        {site.type && <span className="ml-2 text-xs text-emerald-600">{site.type}</span>}
                      </div>
                      <span className="text-xs text-emerald-600 mr-2">{siteZones.length} zone{siteZones.length !== 1 ? "s" : ""}</span>
                      <ChevronRight size={14} className="text-emerald-500 transition-transform"
                        style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }} />
                    </button>

                    {/* Zones */}
                    {isExpanded && (
                      <div className="px-4 pb-3 border-t" style={{ borderColor: "#D1FAE5" }}>
                        <div className="ml-6 mt-3 space-y-2">
                          {siteZones.map(zone => (
                            <div key={zone.id} className="flex items-center gap-3 p-2.5 rounded-xl group"
                              style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                              <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ background: "#D97706" }}>
                                <GitBranch size={11} className="text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-semibold text-amber-900">{zone.name}</span>
                                {zone.type && <span className="ml-2 text-[10px] text-amber-600">{zone.type}</span>}
                              </div>
                              <button onClick={() => handleDeleteZone(zone.id)}
                                className="p-1 rounded hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-all">
                                <Trash2 size={11} style={{ color: "#EF4444" }} />
                              </button>
                            </div>
                          ))}

                          {/* Add zone form */}
                          {addZoneFor === site.id ? (
                            <div className="rounded-xl border p-3 space-y-2.5" style={{ borderColor: "#FDE68A", background: "#FEFCE8" }}>
                              <div className="grid grid-cols-2 gap-2">
                                <input value={zoneForm.name} onChange={e => setZoneForm({ ...zoneForm, name: e.target.value })}
                                  placeholder="Zone name…"
                                  className="text-xs border rounded-lg px-2.5 py-2 outline-none col-span-2" style={{ borderColor: "#FDE68A" }} />
                                <select value={zoneForm.type} onChange={e => setZoneForm({ ...zoneForm, type: e.target.value })}
                                  className="text-xs border rounded-lg px-2.5 py-2 bg-white outline-none" style={{ borderColor: "#FDE68A" }}>
                                  {ZONE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <input value={zoneForm.description} onChange={e => setZoneForm({ ...zoneForm, description: e.target.value })}
                                  placeholder="Description (optional)"
                                  className="text-xs border rounded-lg px-2.5 py-2 outline-none" style={{ borderColor: "#FDE68A" }} />
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => handleAddZone(site.id)} disabled={creatingZone || !zoneForm.name.trim()}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-bold disabled:opacity-50"
                                  style={{ background: "#D97706" }}>
                                  {creatingZone ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}Add
                                </button>
                                <button onClick={() => setAddFor(null)} className="px-3 py-1.5 rounded-lg text-xs text-slate-500 border" style={{ borderColor: "#E3E9F6" }}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => { setAddFor(site.id); setZoneForm({ name: "", type: "General", description: "" }); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors border border-dashed"
                              style={{ borderColor: "#FDE68A" }}>
                              <Plus size={11} />Add Zone
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl p-4 flex items-start gap-2" style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
        <Info size={13} className="text-indigo-500 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-indigo-600">
          Zones inherit access controls from their parent site. Expand a site row to add, view or remove zones.
        </p>
      </div>
    </div>
  );
}

// ─── Tab: Site Access ─────────────────────────────────────────────────────────

function SiteAccessTab() {
  const { data: rawSites = [] } = useListSitesQuery();
  const sites: SiteRecord[] = Array.isArray(rawSites) ? rawSites : [];

  const [access, setAccess] = useState<Record<string, Record<string, boolean>>>(() => {
    const init: Record<string, Record<string, boolean>> = {};
    return init;
  });
  const [saved, setSaved]   = useState(false);

  function getAccess(siteId: string, roleId: string): boolean {
    return access[siteId]?.[roleId] ?? (roleId === "admin" || roleId === "hse_manager");
  }

  function toggleAccess(siteId: string, roleId: string) {
    setAccess(prev => ({
      ...prev,
      [siteId]: { ...(prev[siteId] ?? {}), [roleId]: !getAccess(siteId, roleId) },
    }));
  }

  function grantAll(siteId: string) {
    const all: Record<string, boolean> = {};
    ROLES.forEach(r => { all[r.id] = true; });
    setAccess(prev => ({ ...prev, [siteId]: all }));
  }

  function revokeAll(siteId: string) {
    const none: Record<string, boolean> = {};
    ROLES.forEach(r => { none[r.id] = r.id === "admin"; });
    setAccess(prev => ({ ...prev, [siteId]: none }));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Site Access Control</h2>
          <p className="text-xs text-slate-500 mt-0.5">Define which roles can access each site. Admins always retain access.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
              <CheckCircle2 size={14} />Access rules saved
            </div>
          )}
          <button onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #7C3AED, #6D28D9)" }}>
            <Save size={14} />Save Access Rules
          </button>
        </div>
      </div>

      {/* Role legend */}
      <div className="flex items-center gap-3 flex-wrap p-4 rounded-xl border" style={{ borderColor: "#E3E9F6", background: "#F8F9FF" }}>
        {ROLES.map(r => {
          const Icon = r.icon;
          return (
            <div key={r.id} className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: `${r.color}18` }}>
                <Icon size={11} style={{ color: r.color }} />
              </div>
              <span className="text-xs font-semibold" style={{ color: r.color }}>{r.label}</span>
            </div>
          );
        })}
      </div>

      {sites.length === 0 ? (
        <EmptyState icon={Lock} title="No sites to configure" sub="Add sites from the Site Information tab first." color="#7C3AED" />
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
          {/* Table header */}
          <div className="grid border-b" style={{
            gridTemplateColumns: `220px repeat(${ROLES.length}, 1fr) auto`,
            borderColor: "#E3E9F6", background: "#F8F9FF",
          }}>
            <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Site</div>
            {ROLES.map(r => {
              const Icon = r.icon;
              return (
                <div key={r.id} className="px-2 py-3 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: `${r.color}15` }}>
                      <Icon size={13} style={{ color: r.color }} />
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: r.color }}>{r.label}</span>
                  </div>
                </div>
              );
            })}
            <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Actions</div>
          </div>

          {/* Table rows */}
          {sites.map((site, sIdx) => {
            const bgC  = SITE_BG_COLORS[sIdx % SITE_BG_COLORS.length];
            const ic   = SITE_ICON_COLORS[sIdx % SITE_ICON_COLORS.length];
            const granted = ROLES.filter(r => getAccess(site.id, r.id)).length;
            return (
              <div key={site.id} className="grid border-b hover:bg-slate-50 transition-colors"
                style={{
                  gridTemplateColumns: `220px repeat(${ROLES.length}, 1fr) auto`,
                  borderColor: "#F1F5F9",
                }}>
                {/* Site name */}
                <div className="px-4 py-3 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bgC }}>
                    <MapPin size={13} style={{ color: ic }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{site.name}</p>
                    <p className="text-[10px] text-slate-400">{granted}/{ROLES.length} roles</p>
                  </div>
                </div>

                {/* Role toggles */}
                {ROLES.map(role => {
                  const enabled  = getAccess(site.id, role.id);
                  const isAdmin  = role.id === "admin";
                  return (
                    <div key={role.id} className="flex items-center justify-center py-3">
                      <button
                        onClick={() => !isAdmin && toggleAccess(site.id, role.id)}
                        disabled={isAdmin}
                        title={isAdmin ? "Admins always have access" : `${enabled ? "Revoke" : "Grant"} ${role.label} access`}
                        className="relative w-10 h-5 rounded-full transition-colors duration-200 disabled:cursor-not-allowed"
                        style={{ background: enabled ? role.color : "#E5E7EB" }}>
                        <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                          style={{ transform: enabled ? "translateX(21px)" : "translateX(2px)" }} />
                      </button>
                    </div>
                  );
                })}

                {/* Grant all / Revoke all */}
                <div className="px-3 py-3 flex items-center gap-1.5">
                  <button onClick={() => grantAll(site.id)} title="Grant all roles"
                    className="p-1.5 rounded-lg hover:bg-emerald-50 transition-colors" >
                    <Unlock size={13} style={{ color: "#059669" }} />
                  </button>
                  <button onClick={() => revokeAll(site.id)} title="Revoke all (keep admin)"
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                    <Lock size={13} style={{ color: "#DC2626" }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl p-4 flex items-start gap-2" style={{ background: "#F5F3FF", border: "1px solid #DDD6FE" }}>
        <Shield size={13} className="text-violet-500 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-violet-600">
          Access rules are scoped per site. A role with access to a site can view all incidents, permits and audits recorded at that location.
          Admin access cannot be revoked.
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "info",        label: "Site Information", icon: MapPin,    color: "#0891B2" },
  { id: "departments", label: "Departments",       icon: Building2, color: "#4F46E5" },
  { id: "hierarchy",   label: "Site Hierarchy",    icon: GitBranch, color: "#059669" },
  { id: "access",      label: "Site Access",       icon: Shield,    color: "#7C3AED" },
] as const;

type TabId = typeof TABS[number]["id"];

export function SiteSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("info");
  const { data: rawSites = [] }   = useListSitesQuery();
  const { data: rawZones = [] }   = useListZonesQuery();
  const sites: SiteRecord[] = Array.isArray(rawSites) ? rawSites : [];
  const zones: ZoneRecord[] = Array.isArray(rawZones) ? rawZones : [];

  const activeTabMeta = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>

      {/* ── Banner ── */}
      <div className="relative overflow-hidden px-6 pt-7 pb-6"
        style={{ background: "linear-gradient(135deg, #042F2E 0%, #0891B2 50%, #0F172A 100%)" }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 20% 60%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 85% 25%, #67E8F9 0%, transparent 45%)" }} />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <MapPin size={18} className="text-cyan-300" />
              <span className="text-cyan-200 text-xs font-bold tracking-widest uppercase">Administration</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Site Settings</h1>
            <p className="text-cyan-200 text-sm mt-1">Configure sites, departments, hierarchy and access controls.</p>
          </div>
          {/* Summary chips */}
          <div className="flex items-center gap-3 mt-1">
            {[
              { label: "Sites",  value: sites.length },
              { label: "Zones",  value: zones.length },
              { label: "Active", value: sites.filter(s => s.status === "active").length },
            ].map(s => (
              <div key={s.label} className="px-3 py-2 rounded-xl text-center"
                style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <div className="text-sm font-extrabold text-white">{s.value}</div>
                <div className="text-[10px] text-cyan-300 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-6 py-6 flex gap-6">

        {/* Sidebar */}
        <div className="w-52 flex-shrink-0">
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6", background: "white" }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Configuration</p>
            </div>
            <nav className="p-2 space-y-0.5">
              {TABS.map(tab => {
                const active = activeTab === tab.id;
                const Icon   = tab.icon;
                const count  =
                  tab.id === "info"        ? sites.length :
                  tab.id === "hierarchy"   ? zones.length : null;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all"
                    style={active ? {
                      background: `${tab.color}12`,
                      color: tab.color, fontWeight: 700,
                      border: `1px solid ${tab.color}25`,
                    } : {
                      color: "#4B5563", fontWeight: 500,
                      background: "transparent", border: "1px solid transparent",
                    }}>
                    <Icon size={16} style={{ color: active ? tab.color : "#9CA3AF", flexShrink: 0 }} />
                    <span className="flex-1">{tab.label}</span>
                    {count !== null && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: active ? `${tab.color}20` : "#F1F5F9", color: active ? tab.color : "#9CA3AF" }}>
                        {count}
                      </span>
                    )}
                    {active && <ChevronRight size={12} style={{ color: tab.color }} />}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick info */}
          <div className="mt-4 rounded-2xl border p-4 space-y-3" style={{ borderColor: "#E3E9F6", background: "white" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Summary</p>
            {[
              { icon: MapPin,    label: "Total Sites",   value: sites.length },
              { icon: GitBranch, label: "Total Zones",   value: zones.length },
              { icon: Eye,       label: "Active Sites",  value: sites.filter(s => s.status === "active").length },
              { icon: Settings,  label: "Maintenance",   value: sites.filter(s => s.status === "maintenance").length },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <s.icon size={11} style={{ color: "#9CA3AF" }} />{s.label}
                </div>
                <span className="font-bold text-slate-700">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: "#E3E9F6" }}>
            {/* Tab header */}
            <div className="flex items-center gap-3 pb-5 mb-5 border-b" style={{ borderColor: "#F1F5F9" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${activeTabMeta.color}12`, border: `1px solid ${activeTabMeta.color}20` }}>
                <activeTabMeta.icon size={20} style={{ color: activeTabMeta.color }} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">{activeTabMeta.label}
                  {activeTab === "info" && <SectionBadge count={sites.length} color={activeTabMeta.color} />}
                  {activeTab === "hierarchy" && <SectionBadge count={zones.length} color={activeTabMeta.color} />}
                </h2>
                <p className="text-xs text-slate-400">
                  {activeTab === "info"        && "View, add, edit and manage site records."}
                  {activeTab === "departments" && "Departments linked to sites across the organization."}
                  {activeTab === "hierarchy"   && "Organization → Sites → Zones structural tree."}
                  {activeTab === "access"      && "Role-based access matrix per site."}
                </p>
              </div>
            </div>

            {activeTab === "info"        && <SiteInfoTab />}
            {activeTab === "departments" && <DepartmentsTab />}
            {activeTab === "hierarchy"   && <HierarchyTab />}
            {activeTab === "access"      && <SiteAccessTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
