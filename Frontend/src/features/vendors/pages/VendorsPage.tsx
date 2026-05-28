import { useState, useMemo } from "react";
import {
  Building2, Search, Plus, X, Phone, Mail, MapPin, Shield,
  RefreshCw, CheckCircle2, Clock, AlertTriangle, Loader2,
  ChevronDown, ChevronUp, Users,
} from "lucide-react";
import {
  useGetVendorsQuery,
  useCreateVendorMutation,
  useGetVendorComplianceQuery,
  type Vendor,
  type CreateVendorInput,
} from "@/features/vendors/api/vendorsApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { color: string; bg: string; border: string }> = {
  Active:    { color: "#16A34A", bg: "#DCFCE7", border: "#86EFAC" },
  Inactive:  { color: "#6B7280", bg: "#F3F4F6", border: "#D1D5DB" },
  Suspended: { color: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5" },
  Pending:   { color: "#D97706", bg: "#FEF3C7", border: "#FCD34D" },
};
function statusCfg(s: string) { return STATUS_CFG[s] ?? STATUS_CFG.Inactive; }

function complianceCfg(score: number | null): { label: string; color: string; bg: string } {
  if (score === null) return { label: "N/A",       color: "#9CA3AF", bg: "#F3F4F6" };
  if (score >= 85)   return { label: "Compliant",  color: "#16A34A", bg: "#DCFCE7" };
  if (score >= 70)   return { label: "Moderate",   color: "#D97706", bg: "#FEF3C7" };
  return                    { label: "At Risk",    color: "#DC2626", bg: "#FEE2E2" };
}

// ── Shared atoms ──────────────────────────────────────────────────────────────

function HeroStat({ label, value, color, sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div className="flex-1 px-5 py-4 text-center">
      <div className="text-[24px] font-black text-white leading-none" style={color ? { color } : undefined}>{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{sub}</div>}
      <div className="text-[11px] font-semibold mt-1 uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.55)" }}>{label}</div>
    </div>
  );
}
function HeroDivider() { return <div className="w-px my-3" style={{ background: "rgba(255,255,255,0.15)" }} />; }

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold"
      style={{ color, background: bg }}>{label}</span>
  );
}

// ── Create Vendor Modal ───────────────────────────────────────────────────────

function CreateVendorModal({ onClose }: { onClose: () => void }) {
  const [createVendor, { isLoading }] = useCreateVendorMutation();
  const [form, setForm] = useState<Record<string, string>>({
    company_name: "", contact: "", email: "", phone: "",
    trade_type: "General", status: "Active", site_location: "",
  });
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.company_name.trim()) { setError("Company name is required"); return; }
    try {
      const payload: CreateVendorInput = {
        company_name:  form.company_name.trim(),
        contact:       form.contact       || undefined,
        email:         form.email         || undefined,
        phone:         form.phone         || undefined,
        trade_type:    form.trade_type    || "General",
        status:        form.status        || "Active",
        site_location: form.site_location || undefined,
      };
      await createVendor(payload).unwrap();
      onClose();
    } catch {
      setError("Failed to create vendor. Please try again.");
    }
  };

  const inp = "w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-colors";
  const inpStyle = { borderColor: "#D1D9F0", background: "#F9FAFB" };
  const lbl = "block text-[11px] font-bold mb-1 uppercase tracking-wide";
  const lblStyle = { color: "#6B7280" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
          <div>
            <h2 className="text-base font-black text-gray-900">Add New Vendor</h2>
            <p className="text-xs text-gray-400 mt-0.5">Register a new vendor or contractor</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "#FEF2F2", color: "#DC2626" }}>
              {error}
            </div>
          )}
          <div>
            <label className={lbl} style={lblStyle}>Company Name *</label>
            <input className={inp} style={inpStyle} placeholder="e.g. Acme Safety Ltd"
              value={form.company_name} onChange={(e) => set("company_name", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl} style={lblStyle}>Contact Person</label>
              <input className={inp} style={inpStyle} placeholder="Full name"
                value={form.contact} onChange={(e) => set("contact", e.target.value)} />
            </div>
            <div>
              <label className={lbl} style={lblStyle}>Phone</label>
              <input className={inp} style={inpStyle} placeholder="+1 234 567 8900"
                value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </div>
          <div>
            <label className={lbl} style={lblStyle}>Email</label>
            <input className={inp} style={inpStyle} type="email" placeholder="contact@company.com"
              value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl} style={lblStyle}>Services / Trade</label>
              <select className={inp} style={inpStyle} value={form.trade_type} onChange={(e) => set("trade_type", e.target.value)}>
                {["General", "Electrical", "Plumbing", "HVAC", "Civil", "Safety", "Mechanical", "Cleaning", "Security", "Catering"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl} style={lblStyle}>Status</label>
              <select className={inp} style={inpStyle} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {["Active", "Pending", "Inactive", "Suspended"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={lbl} style={lblStyle}>Assigned Sites</label>
            <input className={inp} style={inpStyle} placeholder="e.g. Site A, Site B"
              value={form.site_location} onChange={(e) => set("site_location", e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "#E3E9F6" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-colors text-gray-500">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-colors"
            style={{ background: "linear-gradient(135deg, #3B57C4, #1E3A8A)" }}>
            {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            {isLoading ? "Adding…" : "Add Vendor"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Vendor Row ────────────────────────────────────────────────────────────────

function VendorRow({ vendor, complianceScore }: { vendor: Vendor; complianceScore: number | null }) {
  const [expanded, setExpanded] = useState(false);
  const vs = statusCfg(vendor.status);
  const cs = complianceCfg(complianceScore);

  return (
    <>
      <tr className="border-b hover:bg-blue-50/20 transition-colors cursor-pointer"
        style={{ borderColor: "#E3E9F6" }} onClick={() => setExpanded((v) => !v)}>

        {/* Vendor Name */}
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#EEF2FF" }}>
              <Building2 size={15} style={{ color: "#3B57C4" }} />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-800">{vendor.company_name}</div>
              {vendor.active_since && (
                <div className="text-[10px] text-gray-400">
                  Since {new Date(vendor.active_since).getFullYear()}
                </div>
              )}
            </div>
          </div>
        </td>

        {/* Services */}
        <td className="px-5 py-3.5">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
            style={{ background: "#EEF2FF", color: "#3B57C4" }}>
            {vendor.trade_type || "General"}
          </span>
        </td>

        {/* Contact Details */}
        <td className="px-5 py-3.5">
          <div className="space-y-0.5">
            {vendor.contact && (
              <div className="text-xs font-semibold text-gray-700">{vendor.contact}</div>
            )}
            {vendor.email && (
              <div className="flex items-center gap-1.5">
                <Mail size={11} className="text-gray-400 flex-shrink-0" />
                <span className="text-[11px] text-gray-500 truncate max-w-[160px]">{vendor.email}</span>
              </div>
            )}
            {vendor.phone && (
              <div className="flex items-center gap-1.5">
                <Phone size={11} className="text-gray-400 flex-shrink-0" />
                <span className="text-[11px] text-gray-500">{vendor.phone}</span>
              </div>
            )}
            {!vendor.contact && !vendor.email && !vendor.phone && (
              <span className="text-[11px] text-gray-300">—</span>
            )}
          </div>
        </td>

        {/* Vendor Status */}
        <td className="px-5 py-3.5">
          <Badge label={vendor.status} color={vs.color} bg={vs.bg} />
        </td>

        {/* Assigned Sites */}
        <td className="px-5 py-3.5">
          {vendor.site_location ? (
            <div className="flex items-center gap-1.5">
              <MapPin size={12} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-600">{vendor.site_location}</span>
            </div>
          ) : (
            <span className="text-[11px] text-gray-300">Unassigned</span>
          )}
        </td>

        {/* Compliance Status */}
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Badge label={cs.label} color={cs.color} bg={cs.bg} />
            {complianceScore !== null && (
              <span className="text-[11px] font-bold text-gray-400">{Math.round(complianceScore)}%</span>
            )}
          </div>
        </td>

        {/* Expand toggle */}
        <td className="px-3 py-3.5 text-center">
          {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </td>
      </tr>

      {/* Expanded row */}
      {expanded && (
        <tr style={{ borderColor: "#E3E9F6" }} className="border-b bg-blue-50/20">
          <td colSpan={7} className="px-8 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {[
                { label: "Total Workers",    value: vendor.total_workers    ?? "—" },
                { label: "On-Site Workers",  value: vendor.on_site_workers  ?? "—" },
                { label: "Safety Score",     value: vendor.safety_score     != null ? `${vendor.safety_score}%` : "—" },
                { label: "Risk Score",       value: vendor.risk_score       != null ? vendor.risk_score : "—" },
                { label: "Incident Count",   value: vendor.incident_count   ?? 0 },
                { label: "Contract Expiry",  value: vendor.contract_expiry  ? new Date(vendor.contract_expiry).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
                { label: "Active Since",     value: vendor.active_since     ? new Date(vendor.active_since).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
                { label: "Tenant ID",        value: vendor.tenant_id?.slice(0, 8) + "…" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
                  <p className="font-semibold text-gray-700 mt-0.5">{String(value)}</p>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ["All", "Active", "Pending", "Inactive", "Suspended"];

export function VendorsPage() {
  const { data: rawVendors, isLoading, refetch } = useGetVendorsQuery();
  const { data: rawCompliance } = useGetVendorComplianceQuery();

  const vendors = Array.isArray(rawVendors) ? rawVendors : [];
  const complianceRecords = Array.isArray(rawCompliance) ? rawCompliance : [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);

  const complianceMap = useMemo(() => {
    const map: Record<string, number> = {};
    complianceRecords.forEach((r) => { map[r.vendor_id] = r.overall_score; });
    return map;
  }, [complianceRecords]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return vendors.filter((v) => {
      const matchQ = !q
        || v.company_name.toLowerCase().includes(q)
        || (v.contact ?? "").toLowerCase().includes(q)
        || (v.trade_type ?? "").toLowerCase().includes(q)
        || (v.site_location ?? "").toLowerCase().includes(q)
        || (v.email ?? "").toLowerCase().includes(q);
      const matchS = statusFilter === "All" || v.status === statusFilter;
      return matchQ && matchS;
    });
  }, [vendors, search, statusFilter]);

  const active    = vendors.filter((v) => v.status === "Active").length;
  const pending   = vendors.filter((v) => v.status === "Pending").length;
  const suspended = vendors.filter((v) => v.status === "Suspended").length;
  const compliant = complianceRecords.filter((r) => r.overall_score >= 85).length;
  const atRisk    = complianceRecords.filter((r) => r.overall_score < 70).length;

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>
      {/* Banner */}
      <div className="relative overflow-hidden px-8 pt-8 pb-6"
        style={{ background: "linear-gradient(135deg, #1E2A5A 0%, #0F172A 100%)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 70% 50%, rgba(59,87,196,0.18) 0%, transparent 70%)" }} />

        <div className="relative flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={18} style={{ color: "#93C5FD" }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#93C5FD" }}>
                Vendor Management
              </span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">Vendor List</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
              {vendors.length} vendor{vendors.length !== 1 ? "s" : ""} registered across all sites
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} disabled={isLoading}
              className="p-2 rounded-xl transition-all"
              style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}>
              {isLoading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            </button>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <Plus size={14} /> Add Vendor
            </button>
          </div>
        </div>

        {/* Hero Stats */}
        <div className="relative flex rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <HeroStat label="Total Vendors" value={vendors.length} />
          <HeroDivider />
          <HeroStat label="Active" value={active} color="#34D399" />
          <HeroDivider />
          <HeroStat label="Pending" value={pending} color="#FBBF24" />
          <HeroDivider />
          <HeroStat label="Suspended" value={suspended} color="#F87171" />
          <HeroDivider />
          <HeroStat label="Compliant" value={compliant} color="#34D399" sub={atRisk > 0 ? `${atRisk} at risk` : undefined} />
        </div>
      </div>

      {/* Table Section */}
      <div className="px-8 py-6">
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-9 pr-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
                style={{ borderColor: "#D1D9F0", background: "#F9FAFB" }}
                placeholder="Search vendors, services, sites…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Status:</span>
              <div className="flex gap-1 flex-wrap">
                {STATUS_OPTIONS.map((s) => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors"
                    style={statusFilter === s
                      ? { background: "#3B57C4", color: "#fff" }
                      : { background: "#F0F3FA", color: "#6B7280" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="ml-auto text-xs text-gray-400 font-semibold">
              {filtered.length} / {vendors.length}
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="py-20 flex items-center justify-center">
              <Loader2 size={26} className="animate-spin" style={{ color: "#3B57C4" }} />
              <span className="ml-3 text-sm text-gray-400">Loading vendors…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Building2 size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-400">
                {search || statusFilter !== "All" ? "No vendors match your filters." : "No vendors added yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead style={{ background: "#F8FAFF" }}>
                  <tr className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    <th className="px-5 py-3">Vendor Name</th>
                    <th className="px-5 py-3">Services</th>
                    <th className="px-5 py-3">Contact Details</th>
                    <th className="px-5 py-3">Vendor Status</th>
                    <th className="px-5 py-3">Assigned Sites</th>
                    <th className="px-5 py-3">Compliance Status</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v) => (
                    <VendorRow key={v.id} vendor={v} complianceScore={complianceMap[v.id] ?? null} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {!isLoading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: "#E3E9F6" }}>
              <p className="text-xs text-gray-400">
                Showing <span className="font-bold text-gray-600">{filtered.length}</span> of <span className="font-bold text-gray-600">{vendors.length}</span> vendors
              </p>
              <div className="flex gap-3">
                {[
                  { label: "Active", count: filtered.filter((v) => v.status === "Active").length, color: "#16A34A" },
                  { label: "Pending", count: filtered.filter((v) => v.status === "Pending").length, color: "#D97706" },
                  { label: "At Risk", count: filtered.filter((v) => (complianceMap[v.id] ?? 100) < 70).length, color: "#DC2626" },
                ].map(({ label, count, color }) => count > 0 && (
                  <span key={label} className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ color, background: `${color}18` }}>
                    {count} {label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && <CreateVendorModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
