import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Building2, Users, MapPin, AlertTriangle, CheckCircle2,
  FileText, ClipboardCheck, BarChart3, ArrowRight, Plus, ChevronRight,
  TrendingUp, Activity, Clock, Loader2, ShieldCheck,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { fetchItems } from "@/features/admin/api/orgAdminApi";

// --- Types ---
interface OrgNode { id: string; name: string; node_type: string; }
interface UserRecord { id: string; email: string; display_name: string; status: string; }
interface PermitRecord { id: string; status: string; }
interface CapaRecord { id: string; status: string; }

// --- Static config (navigation/labels only, no mock numbers) ---
const QUICK_ACTIONS = [
  { label: "Add Site",          icon: MapPin,         path: "/sites-zones",        color: "#4A57B9" },
  { label: "Create Department", icon: Building2,      path: "/admin/departments",  color: "#059669" },
  { label: "Add HSE Manager",   icon: ShieldCheck,    path: "/admin/hse-managers", color: "#D97706" },
  { label: "Invite User",       icon: Users,          path: "/admin/invitations",  color: "#7C3AED" },
  { label: "Log Incident",      icon: AlertTriangle,  path: "/incidents",          color: "#DC2626" },
  { label: "View Reports",      icon: BarChart3,      path: "/analytics",          color: "#2563EB" },
];

const OPERATIONS_LINKS = [
  { label: "Audits & CAPA",   path: "/audits",      color: "#D97706" },
  { label: "Hazards & Risk",  path: "/hazards",     color: "#DC2626" },
  { label: "Training Status", path: "/training",    color: "#7C3AED" },
  { label: "Compliance",      path: "/compliance",  color: "#059669" },
];

// --- Stat card skeleton ---
function StatSkeleton() {
  return (
    <div className="bg-white rounded-2xl border p-4 animate-pulse" style={{ borderColor: "#E3E9F6" }}>
      <div className="h-9 w-9 rounded-xl bg-gray-100 mb-3" />
      <div className="h-8 w-16 rounded bg-gray-100 mb-1" />
      <div className="h-3 w-24 rounded bg-gray-100" />
    </div>
  );
}

export function OrgAdminDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [orgNodes, setOrgNodes]   = useState<OrgNode[]>([]);
  const [users, setUsers]         = useState<UserRecord[]>([]);
  const [permits, setPermits]     = useState<PermitRecord[]>([]);
  const [capas, setCapas]         = useState<CapaRecord[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [nodes, userList, permitList, capaList] = await Promise.all([
        fetchItems<OrgNode>("/admin/organisation-nodes"),
        fetchItems<UserRecord>("/admin/users"),
        fetchItems<PermitRecord>("/permits"),
        fetchItems<CapaRecord>("/capas"),
      ]);
      setOrgNodes(nodes);
      setUsers(userList);
      setPermits(permitList);
      setCapas(capaList);
      setLoading(false);
    }
    load();
  }, []);

  // --- Derived counts ---
  const sites        = orgNodes.filter(n => n.node_type === "site");
  const departments  = orgNodes.filter(n => n.node_type === "department");
  const openPermits  = permits.filter(p => ["submitted", "approved", "active", "extended"].includes(p.status));
  const pendingCapas = capas.filter(c => !["closed", "approved_closure"].includes(c.status));

  const orgStats = [
    { label: "Active Sites",  value: sites.length,       icon: MapPin,      color: "#4A57B9", bg: "#EEF2FF" },
    { label: "Departments",   value: departments.length,  icon: Building2,   color: "#059669", bg: "#D1FAE5" },
    { label: "Total Users",   value: users.length,        icon: Users,       color: "#7C3AED", bg: "#EDE9FE" },
    { label: "Open Permits",  value: openPermits.length,  icon: FileText,    color: "#2563EB", bg: "#DBEAFE" },
  ];

  const operationsStats = [
    { label: "Open Permits",   value: openPermits.length,  icon: FileText,      color: "#2563EB", bg: "#DBEAFE" },
    { label: "Open Incidents", value: "—",                 icon: AlertTriangle, color: "#DC2626", bg: "#FEE2E2" },
    { label: "Pending CAPAs",  value: pendingCapas.length, icon: ClipboardCheck,color: "#D97706", bg: "#FEF3C7" },
    { label: "Compliance",     value: "—",                 icon: TrendingUp,    color: "#059669", bg: "#D1FAE5" },
  ];

  // Setup checklist — mark steps done from real data
  const setupSteps = [
    { step: "Create Organisation Sites",      done: sites.length > 0,       path: "/sites-zones" },
    { step: "Set Up Departments",             done: departments.length > 0,  path: "/admin/departments" },
    { step: "Add HSE Managers",               done: users.length > 1,        path: "/admin/hse-managers" },
    { step: "Invite Team Members",            done: users.length > 0,        path: "/admin/invitations" },
    { step: "Configure Compliance Workflows", done: false,                   path: "/compliance" },
    { step: "Set Up Incident Reporting",      done: false,                   path: "/incidents" },
  ];
  const completedSteps = setupSteps.filter(s => s.done).length;
  const setupProgress  = Math.round((completedSteps / setupSteps.length) * 100);

  // Compliance by site chart — real site names, score shown as 0 until data arrives
  const complianceBySite = sites.slice(0, 6).map(s => ({ site: s.name, score: 0 }));

  return (
    <div className="space-y-6">

      {/* Org KPI stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : orgStats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E3E9F6", boxShadow: "0 2px 8px rgba(15,23,42,0.06)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                  <stat.icon style={{ color: stat.color, width: 18, height: 18 }} />
                </div>
              </div>
              <div className="text-[30px] font-bold leading-none mt-1" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-[12px] font-medium mt-1" style={{ color: "#6B7280" }}>{stat.label}</div>
            </div>
          ))
        }
      </div>

      {/* Setup Progress + Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Setup checklist */}
        <div className="xl:col-span-2 bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6", boxShadow: "0 2px 8px rgba(15,23,42,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[16px] font-bold" style={{ color: "#111827" }}>Organisation Setup</h2>
              <p className="text-[12px] mt-0.5" style={{ color: "#6B7280" }}>{completedSteps} of {setupSteps.length} steps completed</p>
            </div>
            <div className="text-right">
              <div className="text-[24px] font-bold" style={{ color: setupProgress >= 80 ? "#059669" : setupProgress >= 50 ? "#D97706" : "#4A57B9" }}>{setupProgress}%</div>
              <div className="text-[11px]" style={{ color: "#9CA3AF" }}>complete</div>
            </div>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden mb-5" style={{ background: "#F3F4F6" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${setupProgress}%`, background: "linear-gradient(90deg, #4A57B9, #6F80E8)" }}
            />
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2" style={{ color: "#9CA3AF" }}>
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : (
            <div className="space-y-2">
              {setupSteps.map((step) => (
                <button
                  key={step.step}
                  onClick={() => navigate(step.path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-blue-50/50 group"
                  style={{ border: "1px solid transparent" }}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? "bg-green-500" : "border-2 border-gray-300 bg-white"}`}>
                    {step.done && <CheckCircle2 className="w-5 h-5 text-white" />}
                  </div>
                  <span className="flex-1 text-[13px]" style={{ color: step.done ? "#6B7280" : "#111827", fontWeight: step.done ? 400 : 600, textDecoration: step.done ? "line-through" : "none" }}>
                    {step.step}
                  </span>
                  {!step.done && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#4A57B9" }}>
                      Start <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6", boxShadow: "0 2px 8px rgba(15,23,42,0.06)" }}>
          <h2 className="text-[16px] font-bold mb-4" style={{ color: "#111827" }}>Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all hover:shadow-md active:scale-95"
                style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${action.color}15` }}>
                  <action.icon style={{ color: action.color, width: 18, height: 18 }} />
                </div>
                <span className="text-[11px] font-semibold leading-tight" style={{ color: "#374151" }}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Operations stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {operationsStats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E3E9F6", boxShadow: "0 2px 8px rgba(15,23,42,0.06)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: stat.bg }}>
                <stat.icon style={{ color: stat.color, width: 18, height: 18 }} />
              </div>
              <div>
                <div className="text-[22px] font-bold leading-none" style={{ color: stat.color }}>{loading ? "…" : stat.value}</div>
                <div className="text-[11px] mt-0.5 font-medium" style={{ color: "#6B7280" }}>{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Incident Trend */}
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6", boxShadow: "0 2px 8px rgba(15,23,42,0.06)" }}>
          <h2 className="text-[16px] font-bold mb-1" style={{ color: "#111827" }}>Incident Trend</h2>
          <p className="text-[12px] mb-4" style={{ color: "#9CA3AF" }}>Data will appear once incidents are logged</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={[]}>
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E3E9F6", borderRadius: 10, fontSize: 12 }} />
              <Line type="monotone" dataKey="incidents" stroke="#DC2626" strokeWidth={2.5} dot={{ r: 3 }} name="Reported" />
              <Line type="monotone" dataKey="resolved"  stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} name="Resolved" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Compliance by Site */}
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6", boxShadow: "0 2px 8px rgba(15,23,42,0.06)" }}>
          <h2 className="text-[16px] font-bold mb-1" style={{ color: "#111827" }}>Sites Overview</h2>
          <p className="text-[12px] mb-4" style={{ color: "#9CA3AF" }}>
            {sites.length === 0 ? "Add sites to see them here" : `${sites.length} site${sites.length !== 1 ? "s" : ""} in your organisation`}
          </p>
          {sites.length === 0 ? (
            <div className="flex items-center justify-center h-[200px]" style={{ color: "#D1D5DB" }}>
              <div className="text-center">
                <MapPin className="w-8 h-8 mx-auto mb-2" />
                <p className="text-[12px]">No sites yet</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={complianceBySite} barSize={32}>
                <CartesianGrid stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="site" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} domain={[0, 10]} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E3E9F6", borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="score" fill="#4A57B9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent activity + Nav links */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent users */}
        <div className="xl:col-span-2 bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6", boxShadow: "0 2px 8px rgba(15,23,42,0.06)" }}>
          <h2 className="text-[16px] font-bold mb-4" style={{ color: "#111827" }}>Team Members</h2>
          {loading ? (
            <div className="flex items-center gap-2 py-4" style={{ color: "#9CA3AF" }}>
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10" style={{ color: "#D1D5DB" }}>
              <Users className="w-8 h-8 mb-2" />
              <p className="text-[12px]">No team members yet. Invite your first member.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.slice(0, 5).map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
                    {(u.display_name || u.email)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate" style={{ color: "#374151" }}>{u.display_name || u.email}</div>
                    <div className="text-[11px] truncate" style={{ color: "#9CA3AF" }}>{u.email}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize"
                    style={{ background: u.status === "active" ? "#D1FAE5" : "#FEF3C7", color: u.status === "active" ? "#065F46" : "#92400E" }}>
                    {u.status}
                  </span>
                </div>
              ))}
              {users.length > 5 && (
                <p className="text-[12px] pt-1" style={{ color: "#9CA3AF" }}>+{users.length - 5} more members</p>
              )}
            </div>
          )}
          <button onClick={() => navigate("/admin/invitations")} className="mt-4 flex items-center gap-1 text-[12px] font-semibold" style={{ color: "#4A57B9" }}>
            Manage invitations <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Operations links */}
          <div className="bg-white rounded-2xl border p-5 flex-1" style={{ borderColor: "#E3E9F6", boxShadow: "0 2px 8px rgba(15,23,42,0.06)" }}>
            <h2 className="text-[14px] font-bold mb-3" style={{ color: "#111827" }}>Operations Overview</h2>
            <div className="space-y-2.5">
              {OPERATIONS_LINKS.map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                  style={{ border: "1px solid #F3F4F6" }}
                >
                  <span className="text-[13px] font-medium" style={{ color: "#374151" }}>{item.label}</span>
                  <ChevronRight className="w-4 h-4" style={{ color: item.color }} />
                </button>
              ))}
            </div>
          </div>

          {/* Near miss CTA */}
          <button
            onClick={() => navigate("/near-miss")}
            className="w-full py-4 rounded-2xl text-white font-bold text-[15px] transition-transform hover:scale-[1.02] active:scale-95"
            style={{ background: "linear-gradient(135deg, #DC2626, #EF4444)", boxShadow: "0 8px 20px rgba(220, 38, 38, 0.3)" }}
          >
            <Activity className="w-5 h-5 inline mr-2" />
            Near Miss Reporting
          </button>
        </div>
      </div>

    </div>
  );
}
