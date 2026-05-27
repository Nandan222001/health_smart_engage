import { useState, useMemo } from "react";
import {
  Building2, Search, Plus, X, Phone, Mail, MapPin, Shield,
  RefreshCw, CheckCircle2, Clock,
} from "lucide-react";
import {
  useGetVendorsQuery,
  useCreateVendorMutation,
  useGetVendorComplianceQuery,
  type Vendor,
  type CreateVendorInput,
} from "@/features/vendors/api/vendorsApi";

// ── Helpers ────────────────────────────────────────────────────────────────

function statusStyle(status: string): { color: string; bg: string } {
  const map: Record<string, { color: string; bg: string }> = {
    Active:    { color: "#10B981", bg: "#D1FAE5" },
    Inactive:  { color: "#6B7280", bg: "#F3F4F6" },
    Suspended: { color: "#EF4444", bg: "#FEE2E2" },
    Pending:   { color: "#F59E0B", bg: "#FEF3C7" },
  };
  return map[status] ?? map.Inactive;
}

function complianceStyle(score: number | null): { label: string; color: string; bg: string } {
  if (score === null) return { label: "N/A",        color: "#9CA3AF", bg: "#F3F4F6" };
  if (score >= 85)    return { label: "Compliant",  color: "#10B981", bg: "#D1FAE5" };
  if (score >= 70)    return { label: "Moderate",   color: "#F59E0B", bg: "#FEF3C7" };
  return                     { label: "At Risk",    color: "#EF4444", bg: "#FEE2E2" };
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ color, background: bg }}
    >
      {label}
    </span>
  );
}

function KpiCard({
  icon: Icon, label, value, sub, color, bg,
}: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string; bg: string;
}) {
  return (
    <div className="bg-white rounded-2xl border p-5 flex items-start gap-4" style={{ borderColor: "#E3E9F6" }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <div className="text-[22px] font-bold leading-none" style={{ color: "#111827" }}>{value}</div>
        <div className="text-[12px] font-semibold mt-1" style={{ color: "#6B7280" }}>{label}</div>
        {sub && <div className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Create Vendor Modal ────────────────────────────────────────────────────

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
        company_name: form.company_name.trim(),
        contact:      form.contact       || undefined,
        email:        form.email         || undefined,
        phone:        form.phone         || undefined,
        trade_type:   form.trade_type    || "General",
        status:       form.status        || "Active",
        site_location: form.site_location || undefined,
      };
      await createVendor(payload).unwrap();
      onClose();
    } catch {
      setError("Failed to create vendor. Please try again.");
    }
  };

  const inp = "w-full px-3 py-2 rounded-xl border text-sm outline-none focus:border-blue-400 transition-colors";
  const inpStyle = { borderColor: "#E3E9F6", background: "#F9FAFB" };
  const lbl = "block text-[11px] font-semibold mb-1";
  const lblStyle = { color: "#6B7280" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[16px] font-bold" style={{ color: "#111827" }}>Add New Vendor</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" style={{ color: "#6B7280" }} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "#FEF2F2", color: "#EF4444" }}>
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
              <label className={lbl} style={lblStyle}>Services / Trade Type</label>
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
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors hover:bg-slate-100"
            style={{ color: "#6B7280" }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isLoading}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60"
            style={{ background: "#4A57B9" }}>
            {isLoading ? "Adding…" : "Add Vendor"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Vendor Row ─────────────────────────────────────────────────────────────

function VendorRow({ vendor, complianceScore }: { vendor: Vendor; complianceScore: number | null }) {
  const vs = statusStyle(vendor.status);
  const cs = complianceStyle(complianceScore);

  return (
    <tr className="border-b hover:bg-slate-50 transition-colors" style={{ borderColor: "#F1F5F9" }}>
      {/* Vendor Name */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#EEF0FB" }}>
            <Building2 className="w-4 h-4" style={{ color: "#4A57B9" }} />
          </div>
          <div>
            <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{vendor.company_name}</div>
            {vendor.active_since && (
              <div className="text-[11px]" style={{ color: "#9CA3AF" }}>
                Since {new Date(vendor.active_since).getFullYear()}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Services */}
      <td className="px-5 py-4">
        <span className="text-[12px] font-medium px-2.5 py-1 rounded-lg" style={{ background: "#F0F4FF", color: "#4A57B9" }}>
          {vendor.trade_type || "General"}
        </span>
      </td>

      {/* Contact Details */}
      <td className="px-5 py-4">
        <div className="space-y-1">
          {vendor.contact && (
            <div className="text-[12px] font-medium" style={{ color: "#374151" }}>{vendor.contact}</div>
          )}
          {vendor.email && (
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3 flex-shrink-0" style={{ color: "#9CA3AF" }} />
              <span className="text-[11px]" style={{ color: "#6B7280" }}>{vendor.email}</span>
            </div>
          )}
          {vendor.phone && (
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3 flex-shrink-0" style={{ color: "#9CA3AF" }} />
              <span className="text-[11px]" style={{ color: "#6B7280" }}>{vendor.phone}</span>
            </div>
          )}
          {!vendor.contact && !vendor.email && !vendor.phone && (
            <span className="text-[11px]" style={{ color: "#D1D5DB" }}>—</span>
          )}
        </div>
      </td>

      {/* Vendor Status */}
      <td className="px-5 py-4">
        <Badge label={vendor.status} color={vs.color} bg={vs.bg} />
      </td>

      {/* Assigned Sites */}
      <td className="px-5 py-4">
        {vendor.site_location ? (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#9CA3AF" }} />
            <span className="text-[12px]" style={{ color: "#374151" }}>{vendor.site_location}</span>
          </div>
        ) : (
          <span className="text-[11px]" style={{ color: "#D1D5DB" }}>Unassigned</span>
        )}
      </td>

      {/* Compliance Status */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <Badge label={cs.label} color={cs.color} bg={cs.bg} />
          {complianceScore !== null && (
            <span className="text-[11px] font-semibold" style={{ color: "#9CA3AF" }}>
              {Math.round(complianceScore)}%
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ["All", "Active", "Pending", "Inactive", "Suspended"];

export function VendorsPage() {
  const { data: vendors = [], isLoading, refetch } = useGetVendorsQuery();
  const { data: complianceRecords = [] } = useGetVendorComplianceQuery();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);

  const complianceMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of complianceRecords) map[r.vendor_id] = r.overall_score;
    return map;
  }, [complianceRecords]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return vendors.filter((v) => {
      const matchSearch =
        !q ||
        v.company_name.toLowerCase().includes(q) ||
        (v.contact ?? "").toLowerCase().includes(q) ||
        (v.trade_type ?? "").toLowerCase().includes(q) ||
        (v.site_location ?? "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "All" || v.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [vendors, search, statusFilter]);

  // KPI counts
  const active    = vendors.filter((v) => v.status === "Active").length;
  const pending   = vendors.filter((v) => v.status === "Pending").length;
  const compliant = complianceRecords.filter((r) => r.overall_score >= 85).length;
  const atRisk    = complianceRecords.filter((r) => r.overall_score < 70).length;

  return (
    <div className="min-h-screen p-6 space-y-6" style={{ background: "#F5F7FF" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: "#111827" }}>Vendor Management</h1>
          <p className="text-[13px] mt-0.5" style={{ color: "#6B7280" }}>
            {vendors.length} vendor{vendors.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl border bg-white hover:bg-slate-50 transition-colors"
            style={{ borderColor: "#E3E9F6" }}
          >
            <RefreshCw className="w-4 h-4" style={{ color: "#6B7280" }} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: "#4A57B9" }}
          >
            <Plus className="w-4 h-4" />
            Add Vendor
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Building2}    label="Total Vendors"    value={vendors.length} color="#4A57B9" bg="#EEF0FB" />
        <KpiCard icon={CheckCircle2} label="Active"           value={active}         color="#10B981" bg="#D1FAE5" />
        <KpiCard icon={Clock}        label="Pending"          value={pending}         color="#F59E0B" bg="#FEF3C7" />
        <KpiCard icon={Shield}       label="Compliant"        value={compliant}
          sub={atRisk > 0 ? `${atRisk} at risk` : undefined} color="#8B5CF6" bg="#EDE9FE" />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-xl border text-sm outline-none focus:border-blue-400 transition-colors"
              style={{ borderColor: "#E3E9F6", background: "#F9FAFB" }}
              placeholder="Search vendors, services, sites…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold" style={{ color: "#6B7280" }}>Status:</span>
            <div className="flex gap-1 flex-wrap">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className="px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors"
                  style={
                    statusFilter === s
                      ? { background: "#4A57B9", color: "#fff" }
                      : { background: "#F1F5F9", color: "#64748B" }
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-7 h-7 mx-auto mb-2 animate-spin" style={{ color: "#D1D5DB" }} />
            <p className="text-[13px]" style={{ color: "#9CA3AF" }}>Loading vendors…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 className="w-9 h-9 mx-auto mb-2.5" style={{ color: "#D1D5DB" }} />
            <p className="text-[13px]" style={{ color: "#6B7280" }}>
              {search || statusFilter !== "All" ? "No vendors match your filters." : "No vendors added yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: "#F8FAFF" }}>
                <tr>
                  {["Vendor Name", "Services", "Contact Details", "Status", "Assigned Sites", "Compliance Status"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: "#94A3B8" }}>
                      {h}
                    </th>
                  ))}
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

        {/* Footer count */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t" style={{ borderColor: "#F1F5F9" }}>
            <p className="text-[12px]" style={{ color: "#9CA3AF" }}>
              Showing {filtered.length} of {vendors.length} vendor{vendors.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>

      {showModal && <CreateVendorModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
