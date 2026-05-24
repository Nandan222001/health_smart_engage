import { useState } from "react";
import {
  LayoutDashboard, Building2, Users, Database, Brain, BarChart3,
  ScrollText, Monitor, Settings, Bell, Search, ChevronDown, Shield,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Globe, Clock, Server, Cpu, HardDrive, Wifi, LogOut, Menu, X,
  Plus, Filter, Download, MoreHorizontal, Eye, Edit, Trash2,
  Activity, Lock, RefreshCw, ChevronRight, Zap, Loader2, AlertCircle,
  CreditCard, Package, Key, FileText, Layers, ToggleLeft, ToggleRight,
  UserCheck, BookOpen, Gavel,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Navigate, useNavigate } from "react-router";
import {
  useListTenantsQuery,
  useCreateTenantMutation,
  useInviteUserMutation,
  useListUsersQuery,
  useListAuditLogsQuery,
  type CreateTenantPayload,
  type CreateUserPayload,
} from "@/services/api/superAdminApi";

// ─── Static chart data ────────────────────────────────────────────────────────

const incidentTrendData = [
  { month: "Jan", incidents: 42, resolved: 38 },
  { month: "Feb", incidents: 38, resolved: 35 },
  { month: "Mar", incidents: 51, resolved: 44 },
  { month: "Apr", incidents: 35, resolved: 33 },
  { month: "May", incidents: 29, resolved: 28 },
  { month: "Jun", incidents: 44, resolved: 40 },
  { month: "Jul", incidents: 33, resolved: 31 },
];

const orgGrowthData = [
  { month: "Jan", orgs: 12 }, { month: "Feb", orgs: 18 },
  { month: "Mar", orgs: 22 }, { month: "Apr", orgs: 31 },
  { month: "May", orgs: 38 }, { month: "Jun", orgs: 44 },
  { month: "Jul", orgs: 52 },
];

const complianceData = [
  { name: "Compliant", value: 74, color: "#16A34A" },
  { name: "At Risk", value: 18, color: "#F59E0B" },
  { name: "Non-Compliant", value: 8, color: "#DC2626" },
];

const subscriptionData = [
  { plan: "Enterprise", count: 18, revenue: "₹54,000", color: "#7C3AED" },
  { plan: "Pro", count: 31, revenue: "₹46,500", color: "#2563EB" },
  { plan: "Trial", count: 12, revenue: "₹0", color: "#0891B2" },
  { plan: "Suspended", count: 4, revenue: "₹0", color: "#DC2626" },
];

const notifications = [
  { id: 1, type: "critical", title: "Critical Risk Alert", desc: "High-risk incident at Tata Steel Site 3", time: "2 min ago" },
  { id: 2, type: "warning", title: "Security Warning", desc: "Multiple failed login attempts from IP 203.88.12.4", time: "14 min ago" },
  { id: 3, type: "info", title: "Pending Approval", desc: "Bharat Petroleum subscription renewal awaiting approval", time: "1 hr ago" },
  { id: 4, type: "info", title: "New Org Request", desc: "Adani Ports submitted a platform onboarding request", time: "3 hrs ago" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(dt?: string) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

type BStatus = string;

function StatusBadge({ status }: { status: BStatus }) {
  const map: Record<string, string> = {
    Active: "bg-green-50 text-green-700 border-green-200",
    active: "bg-green-50 text-green-700 border-green-200",
    invited: "bg-blue-50 text-blue-700 border-blue-200",
    Suspended: "bg-red-50 text-red-700 border-red-200",
    suspended: "bg-red-50 text-red-700 border-red-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    Trial: "bg-cyan-50 text-cyan-700 border-cyan-200",
    trial: "bg-cyan-50 text-cyan-700 border-cyan-200",
    Success: "bg-green-50 text-green-700 border-green-200",
    Failed: "bg-red-50 text-red-700 border-red-200",
    Warning: "bg-amber-50 text-amber-700 border-amber-200",
    Enterprise: "bg-violet-50 text-violet-700 border-violet-200",
    Pro: "bg-blue-50 text-blue-700 border-blue-200",
  };
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded ${map[status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
      {label}
    </span>
  );
}

function KpiCard({ icon, label, value, trend, trendUp, color }: {
  icon: React.ReactNode; label: string; value: string; trend: string; trendUp: boolean; color: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${color}`} />
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-slate-50 rounded-md">{icon}</div>
        <span className={`flex items-center gap-0.5 text-xs font-medium ${trendUp ? "text-green-600" : "text-red-500"}`}>
          {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend}
        </span>
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-0.5">{value}</div>
      <div className="text-xs text-slate-500 font-medium">{label}</div>
    </div>
  );
}

function SectionHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";
const selectCls = inputCls;

// ─── Platform Flow Banner ─────────────────────────────────────────────────────

const FLOW_STEPS = [
  { id: "dashboard",    label: "Dashboard",     icon: <LayoutDashboard size={11} /> },
  { id: "organizations",label: "Create Org",    icon: <Building2 size={11} /> },
  { id: "users",        label: "Assign Admin",  icon: <UserCheck size={11} /> },
  { id: "settings",     label: "Configure",     icon: <Settings size={11} /> },
  { id: "compliance",   label: "Compliance",    icon: <CheckCircle2 size={11} /> },
  { id: "billing",      label: "Subscriptions", icon: <CreditCard size={11} /> },
  { id: "monitoring",   label: "System Health", icon: <Monitor size={11} /> },
  { id: "audit",        label: "Audit Logs",    icon: <ScrollText size={11} /> },
  { id: "reports",      label: "Reports",       icon: <BarChart3 size={11} /> },
  { id: "governance",   label: "Governance",    icon: <Gavel size={11} /> },
];

function PlatformFlowBanner({ active }: { active: string }) {
  const idx = FLOW_STEPS.findIndex(s => s.id === active);
  return (
    <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-xl px-4 py-3 mb-5 overflow-x-auto">
      <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-semibold">Platform Governance Flow</p>
      <div className="flex items-center gap-1 min-w-max">
        {FLOW_STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center gap-1">
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
              step.id === active
                ? "bg-blue-500 text-white shadow-md shadow-blue-500/30"
                : i < idx
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-white/10 text-slate-400"
            }`}>
              {i < idx ? <CheckCircle2 size={10} className="text-green-400" /> : step.icon}
              {step.label}
            </div>
            {i < FLOW_STEPS.length - 1 && (
              <ChevronRight size={10} className={i < idx ? "text-green-500" : "text-slate-600"} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Create Org Modal ─────────────────────────────────────────────────────────

interface OrgFormState {
  name: string; industry: string; country: string; timezone: string;
  email: string; phone: string; sites: string; plan: string; status: string;
}

interface AdminFormState {
  display_name: string; email: string; phone: string;
  role: string; password: string; confirm_password: string;
}

const ORG_DEFAULT: OrgFormState = {
  name: "", industry: "", country: "", timezone: "UTC+05:30",
  email: "", phone: "", sites: "", plan: "Pro", status: "Active",
};

const ADMIN_DEFAULT: AdminFormState = {
  display_name: "", email: "", phone: "",
  role: "Organization Admin", password: "", confirm_password: "",
};

function CreateOrgModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (info: CredInfo) => void }) {
  const [createTenant, { isLoading: creatingTenant }] = useCreateTenantMutation();
  const [inviteUser, { isLoading: creatingUser }] = useInviteUserMutation();
  const [step, setStep] = useState(1);
  const [org, setOrg] = useState<OrgFormState>(ORG_DEFAULT);
  const [admin, setAdmin] = useState<AdminFormState>(ADMIN_DEFAULT);
  const [error, setError] = useState("");
  const isLoading = creatingTenant || creatingUser;

  const setOrgField = (f: keyof OrgFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setOrg(o => ({ ...o, [f]: e.target.value }));
  const setAdminField = (f: keyof AdminFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setAdmin(a => ({ ...a, [f]: e.target.value }));

  const handleNext = () => {
    if (!org.name.trim()) { setError("Organization name is required."); return; }
    setError("");
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!admin.display_name.trim()) { setError("Admin full name is required."); return; }
    if (!admin.email.trim()) { setError("Admin email is required."); return; }
    if (!admin.password) { setError("Password is required."); return; }
    if (admin.password !== admin.confirm_password) { setError("Passwords do not match."); return; }
    setError("");

    try {
      const tenantPayload: CreateTenantPayload = {
        name: org.name.trim(),
        status: org.status.toLowerCase(),
        industry: org.industry || undefined,
        country: org.country || undefined,
        timezone: org.timezone || undefined,
        email: org.email || undefined,
        phone: org.phone || undefined,
        sites: org.sites ? Number(org.sites) : undefined,
        plan: org.plan || undefined,
      };
      const tenantRes = await createTenant(tenantPayload).unwrap();
      const newTenantId = tenantRes.id;

      const userPayload: CreateUserPayload = {
        email: admin.email.trim(),
        display_name: admin.display_name.trim(),
        phone: admin.phone || undefined,
        role: admin.role || "Organization Admin",
        status: "active",
        password: admin.password,
        tenant_id: newTenantId,
      };
      await inviteUser(userPayload).unwrap();
      onSuccess({
        orgName: org.name.trim(),
        adminName: admin.display_name.trim(),
        email: admin.email.trim(),
        password: admin.password,
      });
    } catch (err: unknown) {
      const msg = (err as { data?: { detail?: string } })?.data?.detail;
      setError(msg ?? "Failed to create organization. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Create Organization</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Step {step} of 2 — {step === 1 ? "Organization Details" : "Admin Account"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-md transition-colors">
            <X size={16} className="text-slate-500" />
          </button>
        </div>
        <div className="px-6 py-2 bg-slate-50 border-b border-slate-100 flex gap-2">
          {[1, 2].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? "bg-blue-600" : "bg-slate-200"}`} />
          ))}
        </div>
        <div className="px-6 py-5">
          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
              <AlertCircle size={13} /> {error}
            </div>
          )}
          {step === 1 ? (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Organization Name *">
                <input value={org.name} onChange={setOrgField("name")} placeholder="e.g. Tata Steel Ltd" className={inputCls} />
              </Field>
              <Field label="Industry Type">
                <select value={org.industry} onChange={setOrgField("industry")} className={selectCls}>
                  <option value="">Select industry</option>
                  {["Manufacturing","Construction","Oil & Gas","Mining","Chemical","Pharmaceutical","Logistics","Utilities","Healthcare","Other"].map(i => (
                    <option key={i}>{i}</option>
                  ))}
                </select>
              </Field>
              <Field label="Country">
                <select value={org.country} onChange={setOrgField("country")} className={selectCls}>
                  <option value="">Select country</option>
                  {["India","UAE","USA","UK","Australia","Singapore","Other"].map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Timezone">
                <select value={org.timezone} onChange={setOrgField("timezone")} className={selectCls}>
                  {["UTC+05:30","UTC+00:00","UTC+04:00","UTC-05:00","UTC+08:00","UTC+10:00"].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Official Email">
                <input type="email" value={org.email} onChange={setOrgField("email")} placeholder="contact@company.com" className={inputCls} />
              </Field>
              <Field label="Phone">
                <input value={org.phone} onChange={setOrgField("phone")} placeholder="+91 98765 43210" className={inputCls} />
              </Field>
              <Field label="Number of Sites">
                <input type="number" min={1} value={org.sites} onChange={setOrgField("sites")} placeholder="e.g. 5" className={inputCls} />
              </Field>
              <Field label="Subscription Plan">
                <select value={org.plan} onChange={setOrgField("plan")} className={selectCls}>
                  {["Trial","Pro","Enterprise"].map(p => <option key={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={org.status} onChange={setOrgField("status")} className={selectCls}>
                  {["Active","Trial","Pending","Suspended"].map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 flex items-center gap-2">
                <Building2 size={13} className="text-blue-600 shrink-0" />
                <p className="text-xs text-blue-700">Creating admin for <span className="font-semibold">{org.name}</span> — this user can log in at /auth/login</p>
              </div>
              <Field label="Full Name *">
                <input value={admin.display_name} onChange={setAdminField("display_name")} placeholder="e.g. Rajesh Kumar" className={inputCls} />
              </Field>
              <Field label="Email Address *">
                <input type="email" value={admin.email} onChange={setAdminField("email")} placeholder="admin@company.com" className={inputCls} />
              </Field>
              <Field label="Phone">
                <input value={admin.phone} onChange={setAdminField("phone")} placeholder="+91 98765 43210" className={inputCls} />
              </Field>
              <Field label="Role">
                <select value={admin.role} onChange={setAdminField("role")} className={selectCls}>
                  {["Organization Admin","Site Manager","Safety Officer","Compliance Officer"].map(r => <option key={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Password *">
                <input type="password" value={admin.password} onChange={setAdminField("password")} placeholder="Min. 8 characters" className={inputCls} />
              </Field>
              <Field label="Confirm Password *">
                <input type="password" value={admin.confirm_password} onChange={setAdminField("confirm_password")} placeholder="Re-enter password" className={inputCls} />
              </Field>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          {step === 2 ? (
            <button onClick={() => setStep(1)} className="px-4 py-2 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">← Back</button>
          ) : <div />}
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
            {step === 1 ? (
              <button onClick={handleNext} className="px-5 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                Next: Admin Account →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={isLoading} className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors">
                {isLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                {isLoading ? "Creating…" : "Create Organization & Admin"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add Admin Modal ──────────────────────────────────────────────────────────

const inputCls2 = "w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-400";

function AddAdminModal({ tenantId, tenantName, onClose, onSuccess }: {
  tenantId: string; tenantName: string; onClose: () => void; onSuccess: (info: CredInfo) => void;
}) {
  const [inviteUser, { isLoading }] = useInviteUserMutation();
  const [form, setForm] = useState({ display_name: "", email: "", phone: "", role: "Organization Admin", password: "", confirm_password: "" });
  const [error, setError] = useState("");

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.display_name.trim()) { setError("Full name is required."); return; }
    if (!form.email.trim()) { setError("Email is required."); return; }
    if (!form.password) { setError("Password is required."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (form.password !== form.confirm_password) { setError("Passwords do not match."); return; }
    setError("");
    try {
      await inviteUser({
        email: form.email.trim(),
        display_name: form.display_name.trim(),
        phone: form.phone || undefined,
        role: form.role,
        status: "active",
        password: form.password,
        tenant_id: tenantId,
      }).unwrap();
      onSuccess({
        orgName: tenantName,
        adminName: form.display_name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
    } catch (err: unknown) {
      const msg = (err as { data?: { detail?: string } })?.data?.detail;
      setError(msg ?? "Failed to create admin. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Add Organization Admin</h2>
            <p className="text-xs text-slate-500 mt-0.5">Creating admin for <span className="font-medium text-slate-700">{tenantName}</span></p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"><X size={16} className="text-slate-500" /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
              <AlertCircle size={13} /> {error}
            </div>
          )}
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700 flex items-center gap-2">
            <Key size={12} /> This admin can log in at <span className="font-mono font-semibold ml-1">/auth/login</span>
          </div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label><input value={form.display_name} onChange={set("display_name")} placeholder="e.g. Rajesh Kumar" className={inputCls2} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Email Address *</label><input type="email" value={form.email} onChange={set("email")} placeholder="admin@company.com" className={inputCls2} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Phone</label><input value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" className={inputCls2} /></div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
            <select value={form.role} onChange={set("role")} className={inputCls2}>
              <option>Organization Admin</option><option>Site Manager</option><option>Safety Officer</option><option>Compliance Officer</option>
            </select>
          </div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Password *</label><input type="password" value={form.password} onChange={set("password")} placeholder="Min. 8 characters" className={inputCls2} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Confirm Password *</label><input type="password" value={form.confirm_password} onChange={set("confirm_password")} placeholder="Re-enter password" className={inputCls2} /></div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={isLoading} className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">
            {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Users size={12} />}
            {isLoading ? "Creating…" : "Create Admin"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Success Toast ────────────────────────────────────────────────────────────

function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 bg-white border border-green-200 rounded-xl shadow-xl px-5 py-4 max-w-sm">
      <CheckCircle2 size={18} className="text-green-600 mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800">Success</p>
        <p className="text-xs text-slate-500 mt-0.5 whitespace-pre-line">{message}</p>
      </div>
      <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X size={13} className="text-slate-400" /></button>
    </div>
  );
}

// ─── Credentials Modal ────────────────────────────────────────────────────────

interface CredInfo { email: string; password: string; orgName: string; adminName: string; }

function CredentialsModal({ info, onClose }: { info: CredInfo; onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const copyAll = () => {
    const text = `Organization: ${info.orgName}\nAdmin Name: ${info.adminName}\nLogin URL: ${window.location.origin}/auth/login\nEmail: ${info.email}\nPassword: ${info.password}`;
    copy(text, "all");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Organization Created!</h2>
              <p className="text-xs text-green-100 mt-0.5">Share these login credentials with the org admin</p>
            </div>
          </div>
        </div>

        {/* Org Info */}
        <div className="px-6 pt-5 pb-2">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Organization</p>
            <p className="text-sm font-bold text-slate-800">{info.orgName}</p>
            <p className="text-xs text-slate-500 mt-0.5">Admin: {info.adminName}</p>
          </div>

          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Login Credentials</p>

          {/* Login URL */}
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 mb-2">
            <div>
              <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wide">Login URL</p>
              <p className="text-xs font-mono text-blue-800 mt-0.5">{window.location.origin}/auth/login</p>
            </div>
            <button
              onClick={() => copy(`${window.location.origin}/auth/login`, "url")}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-medium px-2 py-1 hover:bg-blue-100 rounded transition-colors"
            >
              {copied === "url" ? "✓ Copied" : "Copy"}
            </button>
          </div>

          {/* Email */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 mb-2">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Email</p>
              <p className="text-xs font-mono text-slate-800 mt-0.5">{info.email}</p>
            </div>
            <button
              onClick={() => copy(info.email, "email")}
              className="text-[11px] text-slate-600 hover:text-slate-800 font-medium px-2 py-1 hover:bg-slate-200 rounded transition-colors"
            >
              {copied === "email" ? "✓ Copied" : "Copy"}
            </button>
          </div>

          {/* Password */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 mb-4">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Password</p>
              <p className="text-xs font-mono text-slate-800 mt-0.5">{info.password}</p>
            </div>
            <button
              onClick={() => copy(info.password, "password")}
              className="text-[11px] text-slate-600 hover:text-slate-800 font-medium px-2 py-1 hover:bg-slate-200 rounded transition-colors"
            >
              {copied === "password" ? "✓ Copied" : "Copy"}
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-4 flex items-start gap-2">
            <AlertCircle size={13} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Share these credentials securely with the org admin. They should change their password after first login.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 pb-5">
          <button
            onClick={copyAll}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            {copied === "all" ? <CheckCircle2 size={13} /> : <Download size={13} />}
            {copied === "all" ? "Copied All!" : "Copy All Details"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

type NavId = "dashboard" | "organizations" | "users" | "settings" | "compliance" | "billing" | "monitoring" | "audit" | "reports" | "governance";

const MODULE_LIST = [
  { key: "permits", label: "Permit to Work", icon: <FileText size={14} />, enabled: true, desc: "Digital PTW workflows" },
  { key: "incidents", label: "Incident Management", icon: <AlertTriangle size={14} />, enabled: true, desc: "Report & investigate incidents" },
  { key: "checklists", label: "Checklists & Inspections", icon: <CheckCircle2 size={14} />, enabled: true, desc: "Digital inspection forms" },
  { key: "assets", label: "Asset Management", icon: <Database size={14} />, enabled: true, desc: "Equipment & asset tracking" },
  { key: "compliance", label: "Compliance & Audits", icon: <Shield size={14} />, enabled: true, desc: "Audit execution & CAPA" },
  { key: "training", label: "Training & Certifications", icon: <BookOpen size={14} />, enabled: false, desc: "Worker training records" },
  { key: "vendors", label: "Vendor Management", icon: <Package size={14} />, enabled: false, desc: "Contractor compliance" },
  { key: "ai", label: "AI Intelligence", icon: <Brain size={14} />, enabled: true, desc: "Predictive risk analytics" },
  { key: "mobile", label: "Mobile App", icon: <Monitor size={14} />, enabled: true, desc: "Field worker mobile access" },
  { key: "reports", label: "Reports & Analytics", icon: <BarChart3 size={14} />, enabled: true, desc: "Scheduled reports" },
];

// ─── Super Admin Credentials (from .env) ─────────────────────────────────────

const SA_EMAIL    = (import.meta.env.VITE_DEV_SUPER_ADMIN_EMAIL    as string | undefined) ?? "superadmin@hse.com";
const SA_PASSWORD = (import.meta.env.VITE_DEV_SUPER_ADMIN_PASSWORD as string | undefined) ?? "SuperAdmin@123";
const SA_SESSION_KEY = "hse_sa_auth";

// ─── Super Admin Login Gate ───────────────────────────────────────────────────

function SuperAdminLoginGate({ onAuth }: { onAuth: () => void }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));   // brief visual feedback
    const ok = email.trim().toLowerCase() === SA_EMAIL.toLowerCase() && password === SA_PASSWORD;
    if (ok) {
      sessionStorage.setItem(SA_SESSION_KEY, "true");
      onAuth();
    } else {
      setError("Invalid super admin credentials.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 mb-4">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">HSE Platform</h1>
          <p className="text-sm text-slate-400 mt-1">Super Admin Access</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-base font-semibold text-white mb-1">Sign in to Super Admin</h2>
          <p className="text-xs text-slate-400 mb-5">Platform-level access only. Not for org users.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2.5 rounded-lg">
                <AlertCircle size={13} className="shrink-0" /> {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="superadmin@hse.com"
                required
                className="w-full px-3 py-2.5 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  className="w-full px-3 py-2.5 pr-10 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <Eye size={14} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded-lg transition-colors shadow-lg shadow-blue-600/20"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
              {loading ? "Verifying…" : "Sign In"}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-700/60">
            <p className="text-[11px] text-slate-500 text-center">
              Org admin login is at{" "}
              <a href="/auth/login" className="text-blue-400 hover:underline">/auth/login</a>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-600 mt-4">
          HSE Platform · Super Admin Portal · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

// ─── Main Dashboard (with gate) ───────────────────────────────────────────────

export function SuperAdminDashboard() {
  const authed = sessionStorage.getItem(SA_SESSION_KEY) === "true";

  if (!authed) {
    return <Navigate to="/auth/login" replace />;
  }

  return <SuperAdminDashboardInner />;
}

function SuperAdminDashboardInner() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState<NavId>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [credentialInfo, setCredentialInfo] = useState<CredInfo | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [orgSearch, setOrgSearch] = useState("");
  const [addAdminFor, setAddAdminFor] = useState<{ id: string; name: string } | null>(null);
  const [modules, setModules] = useState(MODULE_LIST);

  const { data: tenantsData, isLoading: loadingTenants, refetch: refetchTenants } = useListTenantsQuery();
  const { data: usersData, isLoading: loadingUsers, refetch: refetchUsers } = useListUsersQuery();
  const { data: auditData, isLoading: loadingAudit } = useListAuditLogsQuery();

  const tenants = tenantsData?.items ?? [];
  const users = usersData?.items ?? [];
  const auditLogs = auditData?.items ?? [];

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(orgSearch.toLowerCase())
  );

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  const handleSignOut = () => {
    sessionStorage.removeItem(SA_SESSION_KEY);
    navigate("/auth/login", { replace: true });
  };

  const navItems: { id: NavId; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "dashboard",     label: "Platform Overview",   icon: <LayoutDashboard size={15} /> },
    { id: "organizations", label: "Organizations",        icon: <Building2 size={15} />, badge: tenants.length || undefined },
    { id: "users",         label: "Users & Admins",       icon: <Users size={15} />, badge: users.length || undefined },
    { id: "settings",      label: "Modules & Config",     icon: <Settings size={15} /> },
    { id: "compliance",    label: "Compliance & AI",       icon: <CheckCircle2 size={15} /> },
    { id: "billing",       label: "Subscriptions",         icon: <CreditCard size={15} /> },
    { id: "monitoring",    label: "System Health",         icon: <Monitor size={15} /> },
    { id: "audit",         label: "Audit Logs",            icon: <ScrollText size={15} /> },
    { id: "reports",       label: "Reports & Analytics",   icon: <BarChart3 size={15} /> },
    { id: "governance",    label: "Platform Governance",   icon: <Gavel size={15} /> },
  ];

  // ── Section Renderers ───────────────────────────────────────────────────────

  const renderDashboard = () => (
    <div className="space-y-5">
      <SectionHeader title="Platform Overview" subtitle={`Last updated: ${new Date().toLocaleString()}`} actions={
        <>
          <button onClick={() => { refetchTenants(); refetchUsers(); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors">
            <RefreshCw size={12} /> Refresh
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            <Download size={12} /> Export Report
          </button>
        </>
      } />

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <KpiCard icon={<Building2 size={15} className="text-blue-600" />} label="Organizations" value={loadingTenants ? "…" : String(tenants.length)} trend="+8%" trendUp color="bg-blue-600" />
        <KpiCard icon={<Users size={15} className="text-indigo-600" />} label="Total Users" value={loadingUsers ? "…" : String(users.length)} trend="+12%" trendUp color="bg-indigo-600" />
        <KpiCard icon={<Globe size={15} className="text-cyan-600" />} label="Total Sites" value="186" trend="+5%" trendUp color="bg-cyan-600" />
        <KpiCard icon={<AlertTriangle size={15} className="text-amber-500" />} label="Open Incidents" value="34" trend="-18%" trendUp={false} color="bg-amber-500" />
        <KpiCard icon={<ScrollText size={15} className="text-violet-600" />} label="Active Permits" value="127" trend="+3%" trendUp color="bg-violet-600" />
        <KpiCard icon={<CheckCircle2 size={15} className="text-green-600" />} label="Compliance" value="87.4%" trend="+2.1%" trendUp color="bg-green-600" />
        <KpiCard icon={<Brain size={15} className="text-red-500" />} label="AI Risk Alerts" value="9" trend="+4" trendUp={false} color="bg-red-500" />
        <KpiCard icon={<Zap size={15} className="text-blue-500" />} label="Enterprise Plans" value={loadingTenants ? "…" : String(tenants.filter(t => t.plan === "Enterprise").length)} trend="+6" trendUp color="bg-blue-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="text-sm font-semibold text-slate-800">Incident Trends</h3><p className="text-xs text-slate-500">Monthly reported vs resolved</p></div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Reported</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Resolved</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={incidentTrendData}>
              <defs>
                <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} /><stop offset="95%" stopColor="#EF4444" stopOpacity={0} /></linearGradient>
                <linearGradient id="resGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16A34A" stopOpacity={0.15} /><stop offset="95%" stopColor="#16A34A" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
              <Area type="monotone" dataKey="incidents" stroke="#EF4444" strokeWidth={2} fill="url(#incGrad)" />
              <Area type="monotone" dataKey="resolved" stroke="#16A34A" strokeWidth={2} fill="url(#resGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="mb-3"><h3 className="text-sm font-semibold text-slate-800">Compliance Overview</h3><p className="text-xs text-slate-500">Platform-wide status</p></div>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={complianceData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                {complianceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {complianceData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600"><span className="w-2 h-2 rounded-full inline-block" style={{ background: d.color }} />{d.name}</span>
                <span className="font-semibold text-slate-800">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="mb-3"><h3 className="text-sm font-semibold text-slate-800">Organization Growth</h3><p className="text-xs text-slate-500">Cumulative organizations onboarded</p></div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={orgGrowthData} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="orgs" fill="#1D4ED8" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="text-sm font-semibold text-slate-800">AI & System Monitoring</h3><p className="text-xs text-slate-500">Real-time operational status</p></div>
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-md"><Activity size={10} /> All Systems Operational</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "AI Model", value: "Online", icon: <Brain size={14} className="text-violet-600" /> },
              { label: "API Health", value: "99.8%", icon: <Wifi size={14} className="text-blue-600" /> },
              { label: "Server CPU", value: "34%", icon: <Cpu size={14} className="text-amber-500" /> },
              { label: "Storage", value: "61%", icon: <HardDrive size={14} className="text-slate-500" /> },
              { label: "Prediction Acc.", value: "94.2%", icon: <Zap size={14} className="text-violet-500" /> },
              { label: "Active Sessions", value: "1,204", icon: <Monitor size={14} className="text-blue-500" /> },
              { label: "Backup Status", value: "Current", icon: <Server size={14} className="text-green-600" /> },
              { label: "Threat Level", value: "Low", icon: <Shield size={14} className="text-green-600" /> },
            ].map(m => (
              <div key={m.label} className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">{m.icon}<span className="w-1.5 h-1.5 rounded-full bg-green-500" /></div>
                <div className="text-sm font-bold text-slate-800">{m.value}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "MFA Enabled Users", value: "94.2%", icon: <Lock size={15} className="text-green-600" />, bg: "bg-green-50", border: "border-green-100", detail: "2,677 of 2,841 users" },
          { label: "Encryption Status", value: "AES-256", icon: <Shield size={15} className="text-blue-600" />, bg: "bg-blue-50", border: "border-blue-100", detail: "All data encrypted at rest" },
          { label: "API Security", value: "Healthy", icon: <Wifi size={15} className="text-violet-600" />, bg: "bg-violet-50", border: "border-violet-100", detail: "Rate limiting active" },
          { label: "Backup Status", value: "Up to Date", icon: <Server size={15} className="text-slate-600" />, bg: "bg-slate-50", border: "border-slate-200", detail: "Last backup: 2 hrs ago" },
        ].map(item => (
          <div key={item.label} className={`${item.bg} border ${item.border} rounded-xl p-4`}>
            <div className="flex items-start justify-between mb-2">{item.icon}<CheckCircle2 size={12} className="text-green-500" /></div>
            <div className="text-sm font-bold text-slate-800">{item.value}</div>
            <div className="text-xs font-medium text-slate-700 mt-0.5">{item.label}</div>
            <div className="text-[11px] text-slate-500 mt-1">{item.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOrganizations = () => (
    <div className="space-y-5">
      <SectionHeader
        title="Organizations"
        subtitle={`${tenants.length} registered organizations on the platform`}
        actions={
          <>
            <button onClick={() => refetchTenants()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors">
              <RefreshCw size={12} /> Refresh
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors">
              <Download size={12} /> Export
            </button>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              <Plus size={12} /> Create Organization
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Orgs", value: String(tenants.length), color: "border-blue-200 bg-blue-50", text: "text-blue-700" },
          { label: "Active", value: String(tenants.filter(t => t.status === "active" || t.status === "Active").length), color: "border-green-200 bg-green-50", text: "text-green-700" },
          { label: "Trial", value: String(tenants.filter(t => t.status?.toLowerCase() === "trial").length), color: "border-cyan-200 bg-cyan-50", text: "text-cyan-700" },
          { label: "Suspended", value: String(tenants.filter(t => t.status?.toLowerCase() === "suspended").length), color: "border-red-200 bg-red-50", text: "text-red-700" },
        ].map(s => (
          <div key={s.label} className={`border ${s.color} rounded-xl p-4`}>
            <div className={`text-2xl font-bold ${s.text}`}>{loadingTenants ? "…" : s.value}</div>
            <div className="text-xs text-slate-600 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={orgSearch} onChange={e => setOrgSearch(e.target.value)} placeholder="Search organizations…" className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-blue-500 w-52" />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 border border-slate-200 bg-white rounded-lg hover:bg-slate-50"><Filter size={11} /> Filter</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Organization", "Industry", "Country", "Plan", "Sites", "Status", "Created", "Actions"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingTenants ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400"><Loader2 size={16} className="animate-spin inline mr-2" />Loading…</td></tr>
              ) : filteredTenants.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  <Building2 size={32} className="mx-auto mb-2 text-slate-200" />
                  No organizations yet. Click <span className="font-semibold text-blue-600">Create Organization</span> to get started.
                </td></tr>
              ) : filteredTenants.map((org, i) => (
                <tr key={org.id} className={`border-b border-slate-50 hover:bg-blue-50/30 transition-colors ${i % 2 !== 0 ? "bg-slate-50/30" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold text-[10px] shrink-0">{initials(org.name)}</div>
                      <div>
                        <div className="font-semibold text-slate-800 whitespace-nowrap">{org.name}</div>
                        {org.email && <div className="text-[10px] text-slate-400">{org.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{org.industry ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{org.country ?? "—"}</td>
                  <td className="px-4 py-3">
                    {org.plan ? <StatusBadge status={org.plan} /> : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-center">{org.sites ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={org.status} /></td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmt(org.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setAddAdminFor({ id: org.id, name: org.name })} title="Add Admin" className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors whitespace-nowrap">
                        <Users size={10} /> Add Admin
                      </button>
                      <button className="p-1 hover:bg-slate-100 rounded transition-colors"><Eye size={12} className="text-slate-500" /></button>
                      <button className="p-1 hover:bg-slate-100 rounded transition-colors"><Edit size={12} className="text-slate-500" /></button>
                      <button className="p-1 hover:bg-red-50 rounded transition-colors"><Trash2 size={12} className="text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTenants.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Showing {filteredTenants.length} of {tenants.length} organizations</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-5">
      <SectionHeader
        title="Users & Admins"
        subtitle={`${users.length} users across all organizations`}
        actions={
          <>
            <button onClick={() => refetchUsers()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors">
              <RefreshCw size={12} /> Refresh
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors">
              <Download size={12} /> Export
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Users", value: String(users.length), color: "border-indigo-200 bg-indigo-50", text: "text-indigo-700" },
          { label: "Active", value: String(users.filter(u => u.status === "active").length), color: "border-green-200 bg-green-50", text: "text-green-700" },
          { label: "Invited", value: String(users.filter(u => u.status === "invited").length), color: "border-blue-200 bg-blue-50", text: "text-blue-700" },
          { label: "Org Admins", value: String(users.length), color: "border-violet-200 bg-violet-50", text: "text-violet-700" },
        ].map(s => (
          <div key={s.label} className={`border ${s.color} rounded-xl p-4`}>
            <div className={`text-2xl font-bold ${s.text}`}>{loadingUsers ? "…" : s.value}</div>
            <div className="text-xs text-slate-600 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">All Users</h3>
          <span className="text-xs text-slate-500">Org admins can log in at <span className="font-mono text-blue-600">/auth/login</span></span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Name", "Email", "Role", "Status", "Organization", "Created", "Actions"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingUsers ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400"><Loader2 size={16} className="animate-spin inline mr-2" />Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  <Users size={32} className="mx-auto mb-2 text-slate-200" />
                  No users yet. Create an organization to invite admins.
                </td></tr>
              ) : users.map((u, i) => (
                <tr key={u.id} className={`border-b border-slate-50 hover:bg-blue-50/30 transition-colors ${i % 2 !== 0 ? "bg-slate-50/30" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-[10px]">{initials(u.display_name || u.email)}</div>
                      <span className="font-medium text-slate-800">{u.display_name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px]">Organization Admin</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                  <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">{u.tenant_id ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmt(u.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1 hover:bg-slate-100 rounded transition-colors"><Eye size={12} className="text-slate-500" /></button>
                      <button className="p-1 hover:bg-slate-100 rounded transition-colors"><Edit size={12} className="text-slate-500" /></button>
                      <button className="p-1 hover:bg-red-50 rounded transition-colors"><Trash2 size={12} className="text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-5">
      <SectionHeader title="Modules & Configuration" subtitle="Enable or disable platform modules and configure default settings" />

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Platform Modules</h3>
          <p className="text-xs text-slate-500 mt-0.5">Toggle modules on/off for all new organizations</p>
        </div>
        <div className="divide-y divide-slate-50">
          {modules.map((mod) => (
            <div key={mod.key} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${mod.enabled ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"}`}>{mod.icon}</div>
                <div>
                  <div className="text-sm font-medium text-slate-800">{mod.label}</div>
                  <div className="text-xs text-slate-500">{mod.desc}</div>
                </div>
              </div>
              <button
                onClick={() => setModules(prev => prev.map(m => m.key === mod.key ? { ...m, enabled: !m.enabled } : m))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${mod.enabled ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
              >
                {mod.enabled ? <><ToggleRight size={13} /> Enabled</> : <><ToggleLeft size={13} /> Disabled</>}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Default Organization Settings</h3>
          <div className="space-y-3">
            {[
              { label: "Default Timezone", value: "UTC+05:30 (IST)" },
              { label: "Default Language", value: "English (en-IN)" },
              { label: "Default Plan", value: "Trial (30 days)" },
              { label: "Max Users per Org", value: "500" },
              { label: "Storage Limit", value: "50 GB per org" },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{s.label}</span>
                <span className="font-medium text-slate-800 bg-slate-50 px-2 py-0.5 rounded">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Security Defaults</h3>
          <div className="space-y-3">
            {[
              { label: "MFA Enforcement", value: "Optional", status: "warning" },
              { label: "Password Policy", value: "Strong (8+ chars)", status: "success" },
              { label: "Session Timeout", value: "8 hours", status: "success" },
              { label: "IP Allowlisting", value: "Disabled", status: "warning" },
              { label: "Audit Logging", value: "Enabled (All)", status: "success" },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{s.label}</span>
                <span className={`font-medium px-2 py-0.5 rounded ${s.status === "success" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompliance = () => (
    <div className="space-y-5">
      <SectionHeader title="Compliance & AI Insights" subtitle="Platform-wide compliance tracking and AI-powered risk intelligence" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Compliance by Organization</h3>
          <div className="space-y-3">
            {[
              { org: "Tata Steel Ltd", score: 94, status: "Compliant" },
              { org: "Bharat Petroleum", score: 88, status: "Compliant" },
              { org: "Adani Ports", score: 72, status: "At Risk" },
              { org: "Hindalco Industries", score: 61, status: "At Risk" },
              { org: "ONGC Offshore", score: 45, status: "Non-Compliant" },
            ].map(r => (
              <div key={r.org} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-blue-700 font-bold text-[10px] shrink-0">{initials(r.org)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-700">{r.org}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{r.score}%</span>
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${r.score >= 85 ? "bg-green-500" : r.score >= 65 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${r.score}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Overall Platform Compliance</h3>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={complianceData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                  {complianceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 mt-2">
              {complianceData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: d.color }} />{d.name}</span>
                  <span className="font-bold text-slate-800">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={14} className="text-violet-600" />
              <h3 className="text-sm font-semibold text-slate-800">AI Risk Insights</h3>
            </div>
            <div className="space-y-2">
              {[
                { risk: "High chemical exposure risk at Hindalco Site 2", level: "High" },
                { risk: "Permit backlog growing — ONGC Offshore", level: "Medium" },
                { risk: "Training certification expiring — 34 workers", level: "Medium" },
              ].map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${r.level === "High" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{r.level}</span>
                  <span className="text-slate-600 leading-relaxed">{r.risk}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBilling = () => (
    <div className="space-y-5">
      <SectionHeader title="Subscriptions & Billing" subtitle="Manage organization subscription plans and revenue" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {subscriptionData.map(s => (
          <div key={s.plan} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{s.plan}</span>
              <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            </div>
            <div className="text-2xl font-bold text-slate-900">{s.count}</div>
            <div className="text-xs text-slate-500 mt-0.5">organizations</div>
            <div className="text-sm font-semibold mt-2" style={{ color: s.color }}>{s.revenue}<span className="text-xs text-slate-400 font-normal">/mo</span></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Subscription Overview</h3>
            <button className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><Download size={11} /> Export</button>
          </div>
          <div className="divide-y divide-slate-50">
            {tenants.slice(0, 6).map((t) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-blue-700 font-bold text-[10px]">{initials(t.name)}</div>
                  <span className="text-xs font-medium text-slate-800">{t.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {t.plan ? <StatusBadge status={t.plan} /> : <span className="text-xs text-slate-400">No plan</span>}
                  <StatusBadge status={t.status} />
                </div>
              </div>
            ))}
            {tenants.length === 0 && <div className="px-5 py-8 text-center text-xs text-slate-400">No organizations yet.</div>}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Platform Revenue Summary</h3>
          <div className="space-y-3">
            {[
              { label: "Monthly Recurring Revenue", value: "₹1,00,500", trend: "+12%", up: true },
              { label: "Annual Contracted Value", value: "₹12,06,000", trend: "+8%", up: true },
              { label: "Average Revenue per Org", value: "₹1,545", trend: "+3%", up: true },
              { label: "Churn Rate (30d)", value: "2.1%", trend: "-0.4%", up: false },
              { label: "Expansion Revenue", value: "₹18,000", trend: "+22%", up: true },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{r.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{r.value}</span>
                  <span className={`flex items-center gap-0.5 font-medium ${r.up ? "text-green-600" : "text-red-500"}`}>
                    {r.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}{r.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMonitoring = () => (
    <div className="space-y-5">
      <SectionHeader title="System Health Monitor" subtitle="Real-time infrastructure and service health" actions={
        <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg font-medium">
          <Activity size={12} /> All Systems Operational
        </span>
      } />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "API Uptime", value: "99.98%", icon: <Wifi size={16} className="text-blue-600" />, status: "ok" },
          { label: "Server CPU", value: "34%", icon: <Cpu size={16} className="text-amber-500" />, status: "ok" },
          { label: "Memory Usage", value: "62%", icon: <Server size={16} className="text-violet-600" />, status: "ok" },
          { label: "Disk Storage", value: "61%", icon: <HardDrive size={16} className="text-slate-500" />, status: "warn" },
          { label: "Active Sessions", value: "1,204", icon: <Monitor size={16} className="text-blue-500" />, status: "ok" },
          { label: "DB Connections", value: "48 / 200", icon: <Database size={16} className="text-green-600" />, status: "ok" },
          { label: "AI Model", value: "Online", icon: <Brain size={16} className="text-violet-600" />, status: "ok" },
          { label: "Threat Level", value: "Low", icon: <Shield size={16} className="text-green-600" />, status: "ok" },
        ].map(m => (
          <div key={m.label} className={`bg-white border rounded-xl p-4 shadow-sm ${m.status === "warn" ? "border-amber-200" : "border-slate-200"}`}>
            <div className="flex items-center justify-between mb-2">
              {m.icon}
              <span className={`w-2 h-2 rounded-full ${m.status === "ok" ? "bg-green-500" : "bg-amber-400"}`} />
            </div>
            <div className="text-lg font-bold text-slate-900">{m.value}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Service Status</h3>
          <div className="space-y-2.5">
            {[
              { service: "Authentication API", status: "Operational", latency: "12ms" },
              { service: "Core HSE API", status: "Operational", latency: "24ms" },
              { service: "AI Risk Engine", status: "Operational", latency: "340ms" },
              { service: "File Storage (S3)", status: "Operational", latency: "65ms" },
              { service: "Email Service", status: "Operational", latency: "120ms" },
              { service: "Mobile Push Notifications", status: "Degraded", latency: "890ms" },
              { service: "MySQL Database", status: "Operational", latency: "8ms" },
              { service: "Redis Cache", status: "Operational", latency: "2ms" },
            ].map(s => (
              <div key={s.service} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${s.status === "Operational" ? "bg-green-500" : "bg-amber-400"}`} />
                  <span className="text-slate-700">{s.service}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-mono">{s.latency}</span>
                  <span className={`font-medium ${s.status === "Operational" ? "text-green-600" : "text-amber-600"}`}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Infrastructure Details</h3>
          <div className="space-y-3">
            {[
              { label: "Backend", value: "FastAPI + Uvicorn (port 8000)" },
              { label: "Frontend", value: "React + Vite (port 5173)" },
              { label: "Database", value: "MySQL 8.0 (port 3306)" },
              { label: "Database Name", value: "hse" },
              { label: "Environment", value: "local (dev)" },
              { label: "Last Deploy", value: "Today, 10:45 AM" },
              { label: "Backend Version", value: "v1.4.2" },
              { label: "Python Version", value: "3.11.x" },
            ].map(d => (
              <div key={d.label} className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{d.label}</span>
                <span className="font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAudit = () => (
    <div className="space-y-5">
      <SectionHeader title="Audit Logs" subtitle="Complete history of all platform actions" actions={
        <>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors"><Filter size={11} /> Filter</button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors"><Download size={11} /> Export Logs</button>
        </>
      } />

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["User ID", "Action", "Module", "Resource ID", "Date & Time", "Tenant"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingAudit ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400"><Loader2 size={16} className="animate-spin inline mr-2" />Loading…</td></tr>
              ) : auditLogs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  <ScrollText size={32} className="mx-auto mb-2 text-slate-200" />
                  No audit entries yet. Actions will appear here as users interact with the platform.
                </td></tr>
              ) : auditLogs.map((log, i) => (
                <tr key={log.id} className={`border-b border-slate-50 hover:bg-blue-50/30 ${i % 2 !== 0 ? "bg-slate-50/30" : ""}`}>
                  <td className="px-4 py-3 font-medium text-slate-700">{log.actor_user_id}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${log.action.startsWith("DELETE") ? "bg-red-50 text-red-700" : log.action.startsWith("CREATE") ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}>{log.action}</span>
                  </td>
                  <td className="px-4 py-3"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px]">{log.resource_type}</span></td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">{log.resource_id ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap"><Clock size={10} className="inline mr-1" />{fmt(log.created_at)}</td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">{log.tenant_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-5">
      <SectionHeader title="Reports & Analytics" subtitle="Generate, schedule and export platform reports" actions={
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={12} /> New Report
        </button>
      } />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: "Incident Summary Report", desc: "Monthly breakdown by org, severity, and resolution", icon: <AlertTriangle size={16} className="text-amber-500" />, last: "Generated 2 days ago", tag: "Compliance" },
          { title: "Compliance Scorecard", desc: "Organization-wise compliance scores and gaps", icon: <Shield size={16} className="text-green-600" />, last: "Generated 1 day ago", tag: "Compliance" },
          { title: "User Activity Report", desc: "Login patterns, feature usage, and session data", icon: <Users size={16} className="text-blue-600" />, last: "Generated 5 days ago", tag: "Admin" },
          { title: "Permit Workflow Analytics", desc: "PTW approval times and bottleneck analysis", icon: <ScrollText size={16} className="text-violet-600" />, last: "Generated 1 week ago", tag: "Operations" },
          { title: "AI Prediction Accuracy", desc: "Model performance, false positives and drift", icon: <Brain size={16} className="text-purple-600" />, last: "Generated 3 days ago", tag: "AI" },
          { title: "Subscription & Revenue", desc: "MRR, plan distribution, and churn analytics", icon: <CreditCard size={16} className="text-indigo-600" />, last: "Generated yesterday", tag: "Finance" },
        ].map(r => (
          <div key={r.title} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-slate-50 rounded-lg">{r.icon}</div>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wide">{r.tag}</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-800 mb-1">{r.title}</h4>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">{r.desc}</p>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">{r.last}</span>
              <div className="flex items-center gap-1.5">
                <button className="flex items-center gap-1 px-2 py-1 text-[11px] text-blue-600 hover:bg-blue-50 rounded transition-colors"><Eye size={10} /> View</button>
                <button className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-100 rounded transition-colors"><Download size={10} /> Export</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGovernance = () => (
    <div className="space-y-5">
      <SectionHeader title="Platform Governance" subtitle="Policies, compliance frameworks, and data stewardship" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: "ISO 45001 Framework", desc: "Occupational health & safety management alignment", status: "Active", coverage: "86%" },
          { title: "OSHA Compliance Rules", desc: "US/International OSHA standard configurations", status: "Active", coverage: "91%" },
          { title: "Data Retention Policy", desc: "7-year retention with automated archival", status: "Active", coverage: "100%" },
          { title: "GDPR Data Privacy", desc: "User consent, data rights and export controls", status: "Pending", coverage: "68%" },
          { title: "SOC 2 Type II", desc: "Security, availability, and confidentiality controls", status: "In Progress", coverage: "74%" },
          { title: "Role-Based Access Control", desc: "Fine-grained permission model across all modules", status: "Active", coverage: "100%" },
        ].map(f => (
          <div key={f.title} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 bg-slate-50 rounded-lg"><Gavel size={14} className="text-slate-600" /></div>
              <StatusBadge status={f.status} />
            </div>
            <h4 className="text-sm font-semibold text-slate-800 mb-1">{f.title}</h4>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">{f.desc}</p>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500">Coverage</span>
                <span className="font-bold text-slate-700">{f.coverage}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${parseInt(f.coverage) >= 90 ? "bg-green-500" : parseInt(f.coverage) >= 70 ? "bg-blue-500" : "bg-amber-400"}`} style={{ width: f.coverage }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Data Governance</h3>
          <div className="space-y-2.5">
            {[
              { label: "Data Encryption at Rest", value: "AES-256", ok: true },
              { label: "Encryption in Transit", value: "TLS 1.3", ok: true },
              { label: "Data Residency", value: "India (ap-south-1)", ok: true },
              { label: "Automated Backups", value: "Daily at 02:00 UTC", ok: true },
              { label: "Backup Retention", value: "90 days", ok: true },
              { label: "Right to Erasure", value: "Manual (Pending Automation)", ok: false },
            ].map(d => (
              <div key={d.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {d.ok ? <CheckCircle2 size={12} className="text-green-500" /> : <AlertCircle size={12} className="text-amber-500" />}
                  <span className="text-slate-600">{d.label}</span>
                </div>
                <span className={`text-xs font-medium ${d.ok ? "text-slate-700" : "text-amber-600"}`}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Access Control Policies</h3>
          <div className="space-y-2.5">
            {[
              { role: "Super Admin", permissions: "Full platform access", color: "bg-red-100 text-red-700" },
              { role: "Organization Admin", permissions: "Full org access, no cross-tenant", color: "bg-blue-100 text-blue-700" },
              { role: "Site Manager", permissions: "Site-level data & permits", color: "bg-green-100 text-green-700" },
              { role: "Safety Officer", permissions: "Incidents, audits, checklists", color: "bg-amber-100 text-amber-700" },
              { role: "Worker (Mobile)", permissions: "View permits, report incidents", color: "bg-slate-100 text-slate-700" },
            ].map(r => (
              <div key={r.role} className="flex items-center justify-between text-xs">
                <span className={`px-2 py-0.5 rounded font-semibold ${r.color}`}>{r.role}</span>
                <span className="text-slate-500 text-right ml-2">{r.permissions}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeNav) {
      case "dashboard":     return renderDashboard();
      case "organizations": return renderOrganizations();
      case "users":         return renderUsers();
      case "settings":      return renderSettings();
      case "compliance":    return renderCompliance();
      case "billing":       return renderBilling();
      case "monitoring":    return renderMonitoring();
      case "audit":         return renderAudit();
      case "reports":       return renderReports();
      case "governance":    return renderGovernance();
      default:              return renderDashboard();
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      {showModal && (
        <CreateOrgModal
          onClose={() => setShowModal(false)}
          onSuccess={(info) => {
            setShowModal(false);
            refetchTenants();
            refetchUsers();
            setCredentialInfo(info);
            showSuccess(
              `Organization "${info.orgName}" and its admin account have been created successfully.\nLogin: ${window.location.origin}/auth/login\nEmail: ${info.email}\nPassword: ${info.password}`,
            );
          }}
        />
      )}
      {addAdminFor && (
        <AddAdminModal
          tenantId={addAdminFor.id}
          tenantName={addAdminFor.name}
          onClose={() => setAddAdminFor(null)}
          onSuccess={(info) => {
            setAddAdminFor(null);
            refetchUsers();
            setCredentialInfo(info);
            showSuccess(
              `Admin account added to "${info.orgName}".\nLogin: ${window.location.origin}/auth/login\nEmail: ${info.email}\nPassword: ${info.password}`,
            );
          }}
        />
      )}
      {successMsg && <SuccessToast message={successMsg} onClose={() => setSuccessMsg(null)} />}
      {credentialInfo && <CredentialsModal info={credentialInfo} onClose={() => setCredentialInfo(null)} />}

      {/* ── Sidebar ───────────────────────────────────────────────────────────── */}
      <aside className={`${sidebarCollapsed ? "w-14" : "w-56"} flex flex-col bg-slate-900 border-r border-slate-700/50 shrink-0 transition-all duration-200`}>
        <div className="px-4 py-4 border-b border-slate-700/50 flex items-center gap-3">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Shield size={14} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <div className="text-xs font-bold text-white tracking-wide">HSE Platform</div>
              <div className="text-slate-400 text-[10px]">Super Admin</div>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                activeNav === item.id
                  ? "bg-blue-600/20 text-blue-400 border-r-2 border-blue-500"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {!sidebarCollapsed && <span className="text-xs font-medium flex-1 whitespace-nowrap">{item.label}</span>}
              {!sidebarCollapsed && item.badge != null && (
                <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-slate-700/50">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center gap-2 text-slate-400 hover:text-slate-200 text-xs transition-colors px-1"
          >
            <Menu size={14} />
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Header ───────────────────────────────────────────────────────────  */}
        <header className="bg-white border-b border-slate-200 px-5 py-3 flex items-center gap-4 shrink-0">
          <div className="flex-1 max-w-md relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search organizations, users, incidents..."
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-400"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="hidden sm:flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs px-2 py-1 rounded-md font-medium">
              <Lock size={10} /> MFA Active
            </span>
            <span className="hidden sm:flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-1 rounded-md font-medium">
              <Shield size={10} /> Secure
            </span>

            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Bell size={16} className="text-slate-500" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-10 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-40">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-800">Notifications</span>
                    <span className="text-xs text-blue-600 cursor-pointer">Mark all read</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className="flex gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.type === "critical" ? "bg-red-500" : n.type === "warning" ? "bg-amber-500" : "bg-blue-500"}`} />
                        <div>
                          <p className="text-xs font-medium text-slate-800">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.desc}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 border border-violet-200 text-violet-700 rounded-lg text-xs font-medium hover:bg-violet-100 transition-colors">
              <Zap size={12} /> AI Alerts <span className="bg-violet-600 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">4</span>
            </button>

            <div className="relative">
              <button
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">SA</div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-800">Super Admin</div>
                  <div className="text-[10px] text-slate-500">admin@gmail.com</div>
                </div>
                <ChevronDown size={12} className="text-slate-400" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-11 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-40 py-1">
                  {["Profile", "Security", "API Keys", "Preferences"].map(item => (
                    <button key={item} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50">{item}</button>
                  ))}
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 flex items-center gap-2">
                      <LogOut size={12} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Scrollable Content ───────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-5">
          <PlatformFlowBanner active={activeNav} />
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
