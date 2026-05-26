import { useState, useMemo } from "react";
import {
  Building2, Users, Shield, AlertTriangle, Award, BarChart3,
  Search, CheckCircle2, XCircle, Clock, TrendingUp, TrendingDown,
  RefreshCw, MapPin, Phone, Mail, Calendar, ChevronDown,
  ChevronRight, Star, AlertCircle, ShieldAlert, ShieldCheck,
  FileText, Zap, Plus, X,
} from "lucide-react";
import {
  useGetVendorsQuery,
  useCreateVendorMutation,
  useGetVendorComplianceQuery,
  useGetVendorCertificationsQuery,
  useAddVendorCertificationMutation,
  useGetVendorRiskScoresQuery,
  type Vendor,
  type VendorComplianceRecord,
  type VendorCertification,
  type VendorRiskScore,
} from "@/features/vendors/api/vendorsApi";
import { useListIncidentsQuery } from "@/features/incidents/api/incidentsApi";
import { useListEmployeesQuery } from "@/features/employees/api/employeesApi";

// ── Types ──────────────────────────────────────────────────────────────────

type TabId = "vendors" | "workers" | "compliance" | "certifications" | "risk";

// ── Helpers ────────────────────────────────────────────────────────────────

function riskLevel(score: number) {
  if (score >= 70) return { label: "High",     color: "#EF4444", bg: "#FEE2E2" };
  if (score >= 50) return { label: "Medium",   color: "#F59E0B", bg: "#FEF3C7" };
  if (score >= 30) return { label: "Low",      color: "#10B981", bg: "#D1FAE5" };
  return              { label: "Very Low",  color: "#6B7280", bg: "#F3F4F6" };
}

function complianceColor(score: number) {
  return score >= 85 ? "#10B981" : score >= 70 ? "#F59E0B" : "#EF4444";
}

function certStatusStyle(status: string): { color: string; bg: string } {
  if (status === "Valid")    return { color: "#10B981", bg: "#D1FAE5" };
  if (status === "Expiring") return { color: "#F59E0B", bg: "#FEF3C7" };
  return                            { color: "#EF4444", bg: "#FEE2E2" };
}

function computeRiskFactors(v: VendorRiskScore) {
  const inc = Math.min(100, (v.incident_count || 0) * 12);
  const ppe = Math.max(0, Math.round(100 - (v.safety_score || 0)));
  const nm  = Math.min(100, (v.incident_count || 0) * 7);
  const tg  = Math.max(0, Math.round(80 - (v.safety_score || 0) * 0.8));
  const pv  = Math.min(100, (v.incident_count || 0) * 10);
  const ua  = Math.max(0, Math.round(90 - (v.safety_score || 0) * 0.9));
  return [
    { factor: "Incident Rate",          score: inc },
    { factor: "PPE Non-Compliance",     score: ppe },
    { factor: "Near Miss Frequency",    score: nm  },
    { factor: "Training Gaps",          score: tg  },
    { factor: "Permit Violations",      score: pv  },
    { factor: "Unsafe Act Reports",     score: ua  },
  ];
}

// ── Shared UI ──────────────────────────────────────────────────────────────

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ color, background: bg }}>
      {label}
    </span>
  );
}

function ProgressBar({ value, color = "#4A57B9", thin }: { value: number; color?: string; thin?: boolean }) {
  return (
    <div className={`w-full ${thin ? "h-1" : "h-1.5"} bg-slate-100 rounded-full overflow-hidden`}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(value, 100)}%`, background: color }} />
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color, bg }: {
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

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { color: string; bg: string }> = {
    Active:    { color: "#10B981", bg: "#D1FAE5" },
    Inactive:  { color: "#6B7280", bg: "#F3F4F6" },
    Suspended: { color: "#EF4444", bg: "#FEE2E2" },
    Pending:   { color: "#F59E0B", bg: "#FEF3C7" },
  };
  const s = cfg[status] ?? cfg.Inactive;
  return <Badge label={status} color={s.color} bg={s.bg} />;
}

function TableHead({ cols }: { cols: string[] }) {
  return (
    <thead style={{ background: "#F8FAFF" }}>
      <tr>
        {cols.map((h) => (
          <th key={h} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: "#94A3B8" }}>{h}</th>
        ))}
      </tr>
    </thead>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="py-14 text-center">
      <Icon className="w-9 h-9 mx-auto mb-2.5" style={{ color: "#D1D5DB" }} />
      <p className="text-[13px]" style={{ color: "#6B7280" }}>{text}</p>
    </div>
  );
}

// ── Create Vendor Modal ────────────────────────────────────────────────────

function CreateVendorModal({ onClose }: { onClose: () => void }) {
  const [createVendor, { isLoading }] = useCreateVendorMutation();
  const [form, setForm] = useState({
    company_name: "", contact: "", email: "", phone: "",
    trade_type: "General", status: "Active",
    site_location: "", total_workers: "", on_site_workers: "",
    safety_score: "", risk_score: "", contract_expiry: "", active_since: "",
  });
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.company_name.trim()) { setError("Company name is required"); return; }
    try {
      await createVendor({
        company_name: form.company_name.trim(),
        contact: form.contact || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        trade_type: form.trade_type || "General",
        status: form.status,
        site_location: form.site_location || undefined,
        total_workers: form.total_workers ? parseInt(form.total_workers) : undefined,
        on_site_workers: form.on_site_workers ? parseInt(form.on_site_workers) : undefined,
        safety_score: form.safety_score ? parseFloat(form.safety_score) : undefined,
        risk_score: form.risk_score ? parseFloat(form.risk_score) : undefined,
        contract_expiry: form.contract_expiry || undefined,
        active_since: form.active_since || undefined,
      }).unwrap();
      onClose();
    } catch {
      setError("Failed to create vendor. Please try again.");
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-xl border text-sm outline-none focus:border-blue-400 transition-colors";
  const inputStyle = { borderColor: "#E3E9F6", background: "#F9FAFB" };
  const labelCls = "block text-[11px] font-semibold mb-1";
  const labelStyle = { color: "#6B7280" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[16px] font-bold" style={{ color: "#111827" }}>Add Vendor / Contractor</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" style={{ color: "#6B7280" }} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "#FEF2F2", color: "#EF4444" }}>{error}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelCls} style={labelStyle}>Company Name *</label>
              <input className={inputCls} style={inputStyle} placeholder="e.g. Acme Safety Ltd" value={form.company_name} onChange={(e) => set("company_name", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Contact Person</label>
              <input className={inputCls} style={inputStyle} placeholder="Full name" value={form.contact} onChange={(e) => set("contact", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Email</label>
              <input className={inputCls} style={inputStyle} type="email" placeholder="contact@company.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Phone</label>
              <input className={inputCls} style={inputStyle} placeholder="+1 234 567 8900" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Trade Type</label>
              <select className={inputCls} style={inputStyle} value={form.trade_type} onChange={(e) => set("trade_type", e.target.value)}>
                {["General","Electrical","Plumbing","Mechanical","Civil","Safety","Cleaning","Security","Catering","IT"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Status</label>
              <select className={inputCls} style={inputStyle} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {["Active","Inactive","Suspended","Pending"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelCls} style={labelStyle}>Site Location</label>
              <input className={inputCls} style={inputStyle} placeholder="e.g. North Plant" value={form.site_location} onChange={(e) => set("site_location", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Total Workers</label>
              <input className={inputCls} style={inputStyle} type="number" min="0" placeholder="0" value={form.total_workers} onChange={(e) => set("total_workers", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>On-Site Workers</label>
              <input className={inputCls} style={inputStyle} type="number" min="0" placeholder="0" value={form.on_site_workers} onChange={(e) => set("on_site_workers", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Safety Score (0–100)</label>
              <input className={inputCls} style={inputStyle} type="number" min="0" max="100" placeholder="0" value={form.safety_score} onChange={(e) => set("safety_score", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Risk Score (0–100)</label>
              <input className={inputCls} style={inputStyle} type="number" min="0" max="100" placeholder="0" value={form.risk_score} onChange={(e) => set("risk_score", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Active Since</label>
              <input className={inputCls} style={inputStyle} type="date" value={form.active_since} onChange={(e) => set("active_since", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Contract Expiry</label>
              <input className={inputCls} style={inputStyle} type="date" value={form.contract_expiry} onChange={(e) => set("contract_expiry", e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: "#E3E9F6" }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors"
            style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: "linear-gradient(135deg, #0F2D87, #3B52C4)", opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? "Adding…" : "Add Vendor"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab 1: Vendor List ─────────────────────────────────────────────────────

function VendorListTab({ vendors }: { vendors: Vendor[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

  const filtered = vendors.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch = v.company_name.toLowerCase().includes(q) ||
      (v.contact ?? "").toLowerCase().includes(q) ||
      (v.email ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      {showModal && <CreateVendorModal onClose={() => setShowModal(false)} />}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: "#E3E9F6", background: "#F9FAFB" }}
            placeholder="Search vendors…"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {["all", "Active", "Inactive", "Suspended", "Pending"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3 py-2 rounded-xl text-[12px] font-semibold capitalize transition-all"
              style={{ background: statusFilter === s ? "#4A57B9" : "#F1F5F9", color: statusFilter === s ? "#fff" : "#374151" }}>
              {s === "all" ? "All" : s}
            </button>
          ))}
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #0F2D87, #3B52C4)" }}>
            <Plus className="w-3.5 h-3.5" /> Add Vendor
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} text="No vendors found" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((v) => {
            const rl        = riskLevel(v.risk_score ?? 0);
            const expiry    = v.contract_expiry ? new Date(v.contract_expiry) : null;
            const daysLeft  = expiry ? Math.round((expiry.getTime() - Date.now()) / 86400000) : null;
            const expiryColor = daysLeft === null ? "#9CA3AF" : daysLeft < 30 ? "#EF4444" : daysLeft < 90 ? "#F59E0B" : "#10B981";
            const safety    = v.safety_score ?? 0;

            return (
              <div key={v.id} className="bg-white rounded-2xl border p-5 hover:shadow-md transition-all" style={{ borderColor: "#E3E9F6" }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)" }}>
                      <Building2 className="w-5 h-5" style={{ color: "#4A57B9" }} />
                    </div>
                    <div>
                      <div className="text-[14px] font-bold" style={{ color: "#111827" }}>{v.company_name}</div>
                      <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{v.trade_type}</div>
                    </div>
                  </div>
                  <StatusBadge status={v.status} />
                </div>

                <div className="space-y-1.5 mb-4 text-[12px]">
                  {v.contact && (
                    <div className="flex items-center gap-2" style={{ color: "#6B7280" }}>
                      <Users className="w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
                      <span className="font-medium" style={{ color: "#374151" }}>{v.contact}</span>
                    </div>
                  )}
                  {v.email && (
                    <div className="flex items-center gap-2" style={{ color: "#6B7280" }}>
                      <Mail className="w-3.5 h-3.5" style={{ color: "#94A3B8" }} />{v.email}
                    </div>
                  )}
                  {v.phone && (
                    <div className="flex items-center gap-2" style={{ color: "#6B7280" }}>
                      <Phone className="w-3.5 h-3.5" style={{ color: "#94A3B8" }} />{v.phone}
                    </div>
                  )}
                  {v.site_location && (
                    <div className="flex items-center gap-2" style={{ color: "#6B7280" }}>
                      <MapPin className="w-3.5 h-3.5" style={{ color: "#94A3B8" }} />{v.site_location}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: "Workers", value: v.total_workers ?? 0, color: "#4A57B9" },
                    { label: "On Site",  value: v.on_site_workers ?? 0, color: "#10B981" },
                    { label: "Incidents", value: v.incident_count ?? 0, color: (v.incident_count ?? 0) > 3 ? "#EF4444" : "#F59E0B" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl p-2.5 text-center" style={{ background: "#F8FAFF" }}>
                      <div className="text-[16px] font-bold" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-[10px] font-semibold mt-0.5" style={{ color: "#94A3B8" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] font-semibold" style={{ color: "#6B7280" }}>Safety Score</span>
                    <span className="text-[12px] font-bold" style={{ color: complianceColor(safety) }}>{safety}%</span>
                  </div>
                  <ProgressBar value={safety} color={complianceColor(safety)} />
                </div>

                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "#F1F5F9" }}>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
                    {expiry ? (
                      <span className="text-[11px]" style={{ color: expiryColor, fontWeight: 600 }}>
                        Expires {expiry.toLocaleDateString()}
                        {daysLeft !== null && daysLeft < 90 && ` (${daysLeft}d)`}
                      </span>
                    ) : (
                      <span className="text-[11px]" style={{ color: "#9CA3AF" }}>No expiry set</span>
                    )}
                  </div>
                  <Badge label={rl.label + " Risk"} color={rl.color} bg={rl.bg} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab 2: Contractor Management ───────────────────────────────────────────

function ContractorManagementTab({ vendors }: { vendors: Vendor[] }) {
  const { data: employees = [], isLoading } = useListEmployeesQuery();
  const [expanded, setExpanded] = useState<string | null>(vendors[0]?.id ?? null);

  const contractorEmployees = useMemo(
    () => employees.filter((e) =>
      (e.role ?? "").toLowerCase().includes("contractor") ||
      (e.role ?? "").toLowerCase().includes("contract")
    ),
    [employees],
  );

  const totalOnSite   = vendors.reduce((s, v) => s + (v.on_site_workers ?? 0), 0);
  const totalWorkers  = vendors.reduce((s, v) => s + (v.total_workers ?? 0), 0);
  const activeVendors = vendors.filter((v) => v.status === "Active").length;

  if (isLoading) return <div className="flex justify-center py-16"><RefreshCw className="w-5 h-5 animate-spin" style={{ color: "#94A3B8" }} /></div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Contractor Workers", value: totalWorkers, color: "#4A57B9", bg: "#EEF2FF", icon: Users },
          { label: "On Site Now",              value: totalOnSite,   color: "#10B981", bg: "#D1FAE5", icon: CheckCircle2 },
          { label: "Active Companies",         value: activeVendors, color: "#F59E0B", bg: "#FEF3C7", icon: Building2 },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: "#E3E9F6" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-[20px] font-bold" style={{ color: "#111827" }}>{s.value}</div>
              <div className="text-[11px] font-semibold" style={{ color: "#6B7280" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {contractorEmployees.length > 0 && (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
          <div className="px-5 py-4 border-b bg-slate-50/50" style={{ borderColor: "#F1F5F9" }}>
            <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Contractor Employees ({contractorEmployees.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <TableHead cols={["Employee", "Role", "Department", "Status"]} />
              <tbody className="divide-y" style={{ borderColor: "#F8FAFF" }}>
                {contractorEmployees.slice(0, 20).map((e) => {
                  const initials = (e.name ?? "?").split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
                            {initials}
                          </div>
                          <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{e.name}</div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[12px]" style={{ color: "#6B7280" }}>{e.role}</td>
                      <td className="px-5 py-3 text-[12px]" style={{ color: "#6B7280" }}>{e.department}</td>
                      <td className="px-5 py-3">
                        <Badge label={e.status ?? "Active"} color="#10B981" bg="#D1FAE5" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-vendor worker summary */}
      <div className="space-y-3">
        {vendors.filter((v) => v.status === "Active").map((vendor) => {
          const isOpen = expanded === vendor.id;
          return (
            <div key={vendor.id} className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
              <button
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors text-left"
                onClick={() => setExpanded(isOpen ? null : vendor.id)}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#EEF2FF" }}>
                  <Building2 className="w-4 h-4" style={{ color: "#4A57B9" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold" style={{ color: "#111827" }}>{vendor.company_name}</div>
                  <div className="text-[11px]" style={{ color: "#9CA3AF" }}>
                    {vendor.site_location ?? "No site"} · {vendor.contact ?? "No contact"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge label={`${vendor.on_site_workers ?? 0}/${vendor.total_workers ?? 0} on site`} color="#10B981" bg="#D1FAE5" />
                  {isOpen ? <ChevronDown className="w-4 h-4" style={{ color: "#94A3B8" }} /> : <ChevronRight className="w-4 h-4" style={{ color: "#94A3B8" }} />}
                </div>
              </button>
              {isOpen && (
                <div className="border-t px-5 py-4 bg-slate-50/30" style={{ borderColor: "#F1F5F9" }}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Total Workers",  value: vendor.total_workers ?? 0, color: "#4A57B9" },
                      { label: "On Site",         value: vendor.on_site_workers ?? 0, color: "#10B981" },
                      { label: "Safety Score",    value: `${vendor.safety_score ?? 0}%`, color: complianceColor(vendor.safety_score ?? 0) },
                      { label: "Incidents",       value: vendor.incident_count ?? 0, color: "#EF4444" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl p-3 text-center bg-white border" style={{ borderColor: "#E3E9F6" }}>
                        <div className="text-[18px] font-bold" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-[10px] font-semibold mt-0.5" style={{ color: "#94A3B8" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {vendors.filter((v) => v.status === "Active").length === 0 && (
          <EmptyState icon={Users} text="No active contractors" />
        )}
      </div>
    </div>
  );
}

// ── Tab 3: Vendor Compliance ───────────────────────────────────────────────

function VendorComplianceTab() {
  const { data: complianceRecords = [], isLoading } = useGetVendorComplianceQuery();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) return <div className="flex justify-center py-16"><RefreshCw className="w-5 h-5 animate-spin" style={{ color: "#94A3B8" }} /></div>;

  const avgCompliance = complianceRecords.length
    ? Math.round(complianceRecords.reduce((s, r) => s + r.overall_score, 0) / complianceRecords.length)
    : 0;
  const compliant    = complianceRecords.filter((r) => r.overall_score >= 80).length;
  const nonCompliant = complianceRecords.filter((r) => r.overall_score < 70).length;

  const sorted = [...complianceRecords].sort((a, b) => b.overall_score - a.overall_score);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Avg Compliance Score", value: `${avgCompliance}%`, color: complianceColor(avgCompliance), bg: avgCompliance >= 85 ? "#D1FAE5" : "#FEF3C7", icon: BarChart3 },
          { label: "Compliant (≥80%)",     value: compliant,            color: "#10B981", bg: "#D1FAE5", icon: ShieldCheck },
          { label: "Non-Compliant (<70%)", value: nonCompliant,         color: "#EF4444", bg: "#FEE2E2", icon: ShieldAlert },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: "#E3E9F6" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-[20px] font-bold" style={{ color: "#111827" }}>{s.value}</div>
              <div className="text-[11px] font-semibold" style={{ color: "#6B7280" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {complianceRecords.length === 0 ? (
        <EmptyState icon={ShieldCheck} text="No compliance data yet. Add vendors and save compliance scores." />
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
          <div className="px-5 py-4 border-b bg-slate-50/50" style={{ borderColor: "#F1F5F9" }}>
            <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Compliance by Vendor</h3>
            <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>Click to expand domain breakdown</p>
          </div>
          <div className="divide-y" style={{ borderColor: "#F8FAFF" }}>
            {sorted.map((r) => {
              const isOpen = expanded === r.vendor_id;
              const color  = complianceColor(r.overall_score);
              return (
                <div key={r.vendor_id}>
                  <button
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors text-left"
                    onClick={() => setExpanded(isOpen ? null : r.vendor_id)}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#F0F4FF" }}>
                      <Building2 className="w-4 h-4" style={{ color: "#4A57B9" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[13px] font-bold" style={{ color: "#111827" }}>{r.vendor_name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[14px] font-bold" style={{ color }}>{r.overall_score}%</span>
                          {isOpen ? <ChevronDown className="w-4 h-4" style={{ color: "#94A3B8" }} /> : <ChevronRight className="w-4 h-4" style={{ color: "#94A3B8" }} />}
                        </div>
                      </div>
                      <ProgressBar value={r.overall_score} color={color} />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 bg-slate-50/30">
                      {r.domains.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-12">
                          {r.domains.map(({ domain, score }) => {
                            const dc = complianceColor(score);
                            return (
                              <div key={domain}>
                                <div className="flex justify-between mb-1">
                                  <span className="text-[12px]" style={{ color: "#374151" }}>{domain}</span>
                                  <span className="text-[12px] font-bold" style={{ color: dc }}>{score}%</span>
                                </div>
                                <ProgressBar value={score} color={dc} thin />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="pl-12 text-[12px]" style={{ color: "#9CA3AF" }}>No domain scores recorded yet</p>
                      )}
                      <div className="mt-3 pl-12 flex items-center gap-2">
                        <StatusBadge status={r.status} />
                        {r.active_since && (
                          <span className="text-[11px]" style={{ color: "#9CA3AF" }}>
                            Active since {new Date(r.active_since).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 4: Certifications ──────────────────────────────────────────────────

function CertificationsTab({ vendors }: { vendors: Vendor[] }) {
  const { data: certs = [], isLoading } = useGetVendorCertificationsQuery();
  const [addVendorCert, { isLoading: adding }] = useAddVendorCertificationMutation();
  const [statusFilter, setStatusFilter] = useState<"all" | "Valid" | "Expiring" | "Expired">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ vendorId: "", document_type: "", issuing_body: "", expiry_date: "" });
  const [addError, setAddError] = useState("");

  if (isLoading) return <div className="flex justify-center py-16"><RefreshCw className="w-5 h-5 animate-spin" style={{ color: "#94A3B8" }} /></div>;

  const filtered = statusFilter === "all" ? certs : certs.filter((c) => c.cert_status === statusFilter);
  const valid    = certs.filter((c) => c.cert_status === "Valid").length;
  const expiring = certs.filter((c) => c.cert_status === "Expiring").length;
  const expired  = certs.filter((c) => c.cert_status === "Expired").length;

  const handleAdd = async () => {
    if (!addForm.vendorId || !addForm.document_type) { setAddError("Vendor and certification name are required"); return; }
    try {
      await addVendorCert({
        vendorId: addForm.vendorId,
        data: { document_type: addForm.document_type, issuing_body: addForm.issuing_body || undefined, expiry_date: addForm.expiry_date || undefined },
      }).unwrap();
      setShowAddForm(false);
      setAddForm({ vendorId: "", document_type: "", issuing_body: "", expiry_date: "" });
      setAddError("");
    } catch {
      setAddError("Failed to add certification");
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-xl border text-sm outline-none";
  const inputStyle = { borderColor: "#E3E9F6", background: "#F9FAFB" };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Valid Certifications",  value: valid,    color: "#10B981", bg: "#D1FAE5", icon: Award },
          { label: "Expiring Soon (≤30d)",  value: expiring, color: "#F59E0B", bg: "#FEF3C7", icon: Clock },
          { label: "Expired",               value: expired,  color: "#EF4444", bg: "#FEE2E2", icon: XCircle },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: "#E3E9F6" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-[20px] font-bold" style={{ color: "#111827" }}>{s.value}</div>
              <div className="text-[11px] font-semibold" style={{ color: "#6B7280" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {(["all", "Valid", "Expiring", "Expired"] as const).map((f) => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className="px-3 py-1.5 rounded-xl text-[12px] font-semibold capitalize transition-all"
              style={{ background: statusFilter === f ? "#4A57B9" : "#F1F5F9", color: statusFilter === f ? "#fff" : "#374151" }}>
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #0F2D87, #3B52C4)" }}>
          <Plus className="w-3.5 h-3.5" /> Add Certificate
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <h3 className="text-[14px] font-bold mb-4" style={{ color: "#111827" }}>Add Certification</h3>
          {addError && <div className="mb-3 px-3 py-2 rounded-xl text-sm" style={{ background: "#FEF2F2", color: "#EF4444" }}>{addError}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: "#6B7280" }}>Vendor *</label>
              <select className={inputCls} style={inputStyle} value={addForm.vendorId} onChange={(e) => setAddForm((f) => ({ ...f, vendorId: e.target.value }))}>
                <option value="">Select vendor…</option>
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.company_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: "#6B7280" }}>Certification Name *</label>
              <input className={inputCls} style={inputStyle} placeholder="e.g. ISO 45001" value={addForm.document_type} onChange={(e) => setAddForm((f) => ({ ...f, document_type: e.target.value }))} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: "#6B7280" }}>Issuing Body</label>
              <input className={inputCls} style={inputStyle} placeholder="e.g. BSI Group" value={addForm.issuing_body} onChange={(e) => setAddForm((f) => ({ ...f, issuing_body: e.target.value }))} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: "#6B7280" }}>Expiry Date</label>
              <input className={inputCls} style={inputStyle} type="date" value={addForm.expiry_date} onChange={(e) => setAddForm((f) => ({ ...f, expiry_date: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-xl border text-sm font-semibold" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>Cancel</button>
            <button onClick={handleAdd} disabled={adding} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #0F2D87, #3B52C4)" }}>
              {adding ? "Adding…" : "Add Certificate"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Certification Register</h3>
          <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>{filtered.length} certification{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={Award} text="No certifications match this filter" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <TableHead cols={["Certification", "Vendor", "Issuing Body", "Expiry", "Status"]} />
              <tbody className="divide-y" style={{ borderColor: "#F8FAFF" }}>
                {filtered.map((cert) => {
                  const st = certStatusStyle(cert.cert_status);
                  return (
                    <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Award className="w-3.5 h-3.5 flex-shrink-0" style={{ color: st.color }} />
                          <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>{cert.document_type}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{cert.vendor_name}</td>
                      <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{cert.issuing_body ?? "—"}</td>
                      <td className="px-5 py-3.5 text-[12px]"
                        style={{ color: (cert.days_left ?? 0) < 30 ? "#EF4444" : "#9CA3AF", fontWeight: (cert.days_left ?? 0) < 30 ? 700 : 400 }}>
                        {cert.expiry_date ? new Date(cert.expiry_date).toLocaleDateString() : "—"}
                        {cert.days_left !== null && cert.days_left > 0 && cert.days_left < 30 && ` (${cert.days_left}d left)`}
                        {cert.days_left !== null && cert.days_left < 0 && ` (${Math.abs(cert.days_left)}d ago)`}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge label={cert.cert_status} color={st.color} bg={st.bg} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab 5: Vendor Risk Score ───────────────────────────────────────────────

function VendorRiskScoreTab() {
  const { data: riskScores = [], isLoading } = useGetVendorRiskScoresQuery();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) return <div className="flex justify-center py-16"><RefreshCw className="w-5 h-5 animate-spin" style={{ color: "#94A3B8" }} /></div>;

  const highRisk = riskScores.filter((r) => r.risk_score >= 70).length;
  const lowRisk  = riskScores.filter((r) => r.risk_score < 30).length;
  const avgRisk  = riskScores.length
    ? Math.round(riskScores.reduce((s, r) => s + r.risk_score, 0) / riskScores.length)
    : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Avg Risk Score",  value: `${avgRisk}/100`, color: riskLevel(avgRisk).color,  bg: riskLevel(avgRisk).bg,   icon: Zap },
          { label: "High Risk (≥70)", value: highRisk,          color: "#EF4444", bg: "#FEE2E2",  icon: ShieldAlert },
          { label: "Low Risk (<30)",  value: lowRisk,           color: "#10B981", bg: "#D1FAE5",  icon: ShieldCheck },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: "#E3E9F6" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-[20px] font-bold" style={{ color: "#111827" }}>{s.value}</div>
              <div className="text-[11px] font-semibold" style={{ color: "#6B7280" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {riskScores.length === 0 ? (
        <EmptyState icon={Zap} text="No vendors found. Add vendors with risk scores to see rankings." />
      ) : (
        <>
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
            <div className="px-5 py-4 border-b bg-slate-50/50" style={{ borderColor: "#F1F5F9" }}>
              <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Vendor Risk Rankings</h3>
              <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>Higher score = higher risk. Click to expand factor breakdown.</p>
            </div>
            <div className="divide-y" style={{ borderColor: "#F8FAFF" }}>
              {riskScores.map((r, idx) => {
                const rl      = riskLevel(r.risk_score);
                const isOpen  = expanded === r.vendor_id;
                const factors = computeRiskFactors(r);

                return (
                  <div key={r.vendor_id}>
                    <button
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors text-left"
                      onClick={() => setExpanded(isOpen ? null : r.vendor_id)}
                    >
                      <span className="text-[15px] font-bold w-6" style={{ color: idx === 0 ? "#EF4444" : "#CBD5E1" }}>#{idx + 1}</span>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#F0F4FF" }}>
                        <Building2 className="w-4 h-4" style={{ color: "#4A57B9" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[13px] font-bold" style={{ color: "#111827" }}>{r.vendor_name}</span>
                          <div className="flex items-center gap-3">
                            <Badge label={rl.label + " Risk"} color={rl.color} bg={rl.bg} />
                            <span className="text-[14px] font-bold" style={{ color: rl.color }}>{r.risk_score}</span>
                            {isOpen ? <ChevronDown className="w-4 h-4" style={{ color: "#94A3B8" }} /> : <ChevronRight className="w-4 h-4" style={{ color: "#94A3B8" }} />}
                          </div>
                        </div>
                        <ProgressBar value={r.risk_score} color={rl.color} />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 bg-slate-50/30">
                        <div className="pl-14 space-y-3">
                          <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#94A3B8" }}>Risk Factor Breakdown</div>
                          {factors.map(({ factor, score }) => {
                            const fc = riskLevel(score).color;
                            return (
                              <div key={factor}>
                                <div className="flex justify-between mb-1">
                                  <span className="text-[12px]" style={{ color: "#374151" }}>{factor}</span>
                                  <span className="text-[12px] font-bold" style={{ color: fc }}>{score}/100</span>
                                </div>
                                <ProgressBar value={score} color={fc} thin />
                              </div>
                            );
                          })}
                          {r.risk_score >= 50 && (
                            <div className="mt-4 rounded-xl p-3 border-l-4" style={{ background: "#FFF8F0", borderLeftColor: "#F59E0B" }}>
                              <div className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "#D97706" }}>Recommendations</div>
                              <ul className="space-y-1">
                                {factors.filter((f) => f.score >= 60).slice(0, 2).map((f) => (
                                  <li key={f.factor} className="text-[12px] flex items-center gap-1.5" style={{ color: "#374151" }}>
                                    <AlertCircle className="w-3 h-3 flex-shrink-0" style={{ color: "#F59E0B" }} />
                                    Review and remediate: {f.factor}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-4 h-4" style={{ color: "#10B981" }} />
                <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Lowest Risk</h3>
              </div>
              <div className="space-y-3">
                {[...riskScores].reverse().slice(0, 3).map((r) => (
                  <div key={r.vendor_id} className="flex items-center gap-3">
                    <TrendingDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#10B981" }} />
                    <span className="text-[12px] flex-1" style={{ color: "#374151" }}>{r.vendor_name}</span>
                    <Badge label={`Score ${r.risk_score}`} color="#10B981" bg="#D1FAE5" />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4" style={{ color: "#EF4444" }} />
                <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Needs Attention</h3>
              </div>
              <div className="space-y-3">
                {riskScores.slice(0, 3).map((r) => {
                  const rl = riskLevel(r.risk_score);
                  return (
                    <div key={r.vendor_id} className="flex items-center gap-3">
                      <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#EF4444" }} />
                      <span className="text-[12px] flex-1" style={{ color: "#374151" }}>{r.vendor_name}</span>
                      <Badge label={rl.label} color={rl.color} bg={rl.bg} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: "vendors",         label: "Vendor List",           icon: Building2 },
  { id: "workers",         label: "Contractor Management", icon: Users },
  { id: "compliance",      label: "Vendor Compliance",     icon: ShieldCheck },
  { id: "certifications",  label: "Certifications",        icon: Award },
  { id: "risk",            label: "Vendor Risk Score",     icon: Zap },
];

export function ContractorsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("vendors");
  const { data: vendors = [], isLoading } = useGetVendorsQuery();

  const totalWorkers    = vendors.reduce((s, v) => s + (v.total_workers ?? 0), 0);
  const activeCompanies = vendors.filter((v) => v.status === "Active").length;
  const avgSafetyScore  = vendors.length
    ? Math.round(vendors.reduce((s, v) => s + (v.safety_score ?? 0), 0) / vendors.length)
    : 0;
  const highRiskCount   = vendors.filter((v) => (v.risk_score ?? 0) >= 70).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border px-5 py-4" style={{ borderColor: "#DCE4F3", background: "#FFFFFF" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F2D87, #3B52C4)" }}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: "#111827" }}>Vendors & Contractors</h1>
            <p className="text-[12px]" style={{ color: "#64748B" }}>Vendor list, contractor management, compliance, certifications & risk scores</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "#94A3B8" }}>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#10B981" }} />
          Live
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border p-5 animate-pulse" style={{ borderColor: "#E3E9F6" }}>
              <div className="h-11 w-11 rounded-xl bg-gray-100 mb-3" />
              <div className="h-7 w-14 rounded bg-gray-100 mb-2" />
              <div className="h-3 w-24 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard icon={Building2}   label="Vendor Companies"  value={vendors.length}     sub={`${activeCompanies} active`}        color="#4A57B9" bg="#EEF2FF" />
          <KpiCard icon={Users}       label="Total Workers"     value={totalWorkers}        sub="across all vendors"                 color="#10B981" bg="#D1FAE5" />
          <KpiCard icon={Star}        label="Avg Safety Score"  value={`${avgSafetyScore}%`} sub="across active vendors"            color={complianceColor(avgSafetyScore)} bg={avgSafetyScore >= 85 ? "#D1FAE5" : "#FEF3C7"} />
          <KpiCard icon={ShieldAlert} label="High Risk Vendors" value={highRiskCount}       sub="require immediate review"           color="#EF4444" bg="#FEE2E2" />
        </div>
      )}

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex overflow-x-auto border-b" style={{ borderColor: "#F1F5F9" }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-5 py-3.5 text-[12px] font-semibold whitespace-nowrap transition-all border-b-2 flex-shrink-0"
                style={{
                  color: active ? "#4A57B9" : "#6B7280",
                  borderBottomColor: active ? "#4A57B9" : "transparent",
                  background: active ? "#F8FAFF" : "transparent",
                }}>
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "#94A3B8" }} />
            </div>
          ) : (
            <>
              {activeTab === "vendors"        && <VendorListTab         vendors={vendors} />}
              {activeTab === "workers"        && <ContractorManagementTab vendors={vendors} />}
              {activeTab === "compliance"     && <VendorComplianceTab />}
              {activeTab === "certifications" && <CertificationsTab     vendors={vendors} />}
              {activeTab === "risk"           && <VendorRiskScoreTab />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
