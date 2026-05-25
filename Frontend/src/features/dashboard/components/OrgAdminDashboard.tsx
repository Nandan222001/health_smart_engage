import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Building2, Users, MapPin, AlertTriangle, CheckCircle2,
  FileText, ClipboardCheck, BarChart3, ArrowRight, ChevronRight,
  TrendingUp, Activity, Loader2, ShieldCheck, UserCheck, Briefcase, 
  GraduationCap, AlertCircle, UserX, Zap, Target, Clock, Search,
  ShieldAlert, Info, ListTodo, Map, Flame, Users2, Database
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { fetchItems } from "@/features/admin/api/orgAdminApi";
import {
  useGetOrgSetupStep3SitesQuery,
  useGetOrgSetupStep4UsersQuery,
  useGetOrgSetupProgressQuery,
  useGetOrgAdminKpisQuery,
  useGetOrgAdminActivitiesQuery,
  useGetOrgAdminEngagementQuery,
} from "@/features/org-setup/api/orgSetupApi";

// Backend progress shape
interface OrgProgress {
  activated: boolean;
  step_details?: {
    step1?: { completed: boolean };
    step2?: { completed: boolean };
    step3?: { completed: boolean };
    step4?: { completed: boolean };
    step5?: { completed: boolean };
    step6?: { completed: boolean };
    step7?: { completed: boolean };
    step8?: { completed: boolean };
  };
}

interface PermitRecord { id: string; status: string; }
interface CapaRecord   { id: string; status: string; }

function StatSkeleton() {
  return (
    <div className="bg-white rounded-xl border p-3.5 animate-pulse" style={{ borderColor: "#E3E9F6" }}>
      <div className="h-8 w-8 rounded-lg bg-gray-100 mb-2.5" />
      <div className="h-6 w-12 rounded bg-gray-100 mb-1" />
      <div className="h-3 w-20 rounded bg-gray-100" />
    </div>
  );
}

export function OrgAdminDashboard() {
  const navigate = useNavigate();
  const { data: sites = [],    isLoading: sitesLoading }   = useGetOrgSetupStep3SitesQuery();
  const { data: orgUsers = [], isLoading: usersLoading }   = useGetOrgSetupStep4UsersQuery();
  const { data: kpiData,       isLoading: kpisLoading }    = useGetOrgAdminKpisQuery();
  const { data: activities = [], isLoading: activityLoading } = useGetOrgAdminActivitiesQuery();
  const { data: engagement,    isLoading: engagementLoading } = useGetOrgAdminEngagementQuery();

  const [permits, setPermits]     = useState<PermitRecord[]>([]);
  const [capas, setCapas]         = useState<CapaRecord[]>([]);
  const [opsLoading, setOpsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setOpsLoading(true);
      try {
        const [permitList, capaList] = await Promise.all([
          fetchItems<PermitRecord>("/permits"),
          fetchItems<CapaRecord>("/capas"),
        ]);
        setPermits(permitList || []);
        setCapas(capaList || []);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setOpsLoading(false);
      }
    }
    load();
  }, []);

  const loading = sitesLoading || usersLoading || opsLoading || kpisLoading || activityLoading || engagementLoading;

  // Helper to find KPI by ID
  const findKpi = (id: string) => kpiData?.kpis.find(k => k.id === id);

  const kpiMetrics = [
    { label: "Total Employees", value: orgUsers.length, icon: Users, color: "#1D4ED8", bg: "#DBEAFE" },
    { label: "Active Workers on Site", value: Math.round(orgUsers.length * 0.85), icon: UserCheck, color: "#059669", bg: "#D1FAE5" },
    { label: "Total Contractors", value: orgUsers.filter(u => u.role === "Contractor").length, icon: Briefcase, color: "#D97706", bg: "#FEF3C7" },
    { label: "Total Sites", value: sites.length, icon: MapPin, color: "#4A57B9", bg: "#EEF2FF" },
    { label: "Open Incidents", value: findKpi("open_incidents")?.value ?? "2", icon: AlertTriangle, color: "#DC2626", bg: "#FEE2E2" },
    { label: "High Severity Incidents", value: "0", icon: ShieldAlert, color: "#991B1B", bg: "#FEF2F2" },
    { label: "Near Miss Reports", value: findKpi("near_miss_rate")?.value ?? "5", icon: Info, color: "#2563EB", bg: "#EFF6FF" },
    { label: "Active Work Permits", value: findKpi("ptw_active")?.value ?? permits.length, icon: FileText, color: "#0891B2", bg: "#ECFEFF" },
    { label: "Pending Audits", value: findKpi("audit_completion")?.value ?? "3", icon: ClipboardCheck, color: "#7C3AED", bg: "#EDE9FE" },
    { label: "Open CAPA", value: findKpi("open_capas")?.value ?? capas.length, icon: ListTodo, color: "#D97706", bg: "#FEF3C7" },
    { label: "Compliance %", value: `${findKpi("compliance_rate")?.value ?? 92}%`, icon: GraduationCap, color: "#10B981", bg: "#ECFDF5" },
    { label: "AI Risk Score", value: "2.4", icon: Target, color: "#F59E0B", bg: "#FFFBEB" },
  ];

  const AI_ALERTS = [
    { id: 1, type: "Predicted High-Risk Area", text: "Site A - Zone 4 (Chemical Handling) risk increased by 15%", icon: Map, color: "#DC2626" },
    { id: 2, type: "Unsafe Behavior Alert", text: "Incomplete PPE usage detected in Site B Loading Bay", icon: UserX, color: "#F59E0B" },
    { id: 3, type: "Fatigue Risk Alert", text: "3 Workers on Shift C exceeding 12h threshold", icon: Zap, color: "#7C3AED" },
    { id: 4, type: "Compliance Violation Warning", text: "Audit overdue for Fire Safety Equipment (Site D)", icon: AlertCircle, color: "#B91C1C" },
    { id: 5, type: "Contractor Risk Alert", text: "Unverified contractor entry attempt - Site A North Gate", icon: Briefcase, color: "#1D4ED8" },
  ];

  const OPERATIONAL_STATUS = [
    { site: "Site A - PetroChem", status: "Active", safety: "Green", incidents: 0, permits: 12 },
    { site: "Site B - Logistics", status: "Active", safety: "Yellow", incidents: 1, permits: 8 },
    { site: "Site C - Refinement", status: "Active", safety: "Green", incidents: 0, permits: 5 },
    { site: "Site D - Offshore", status: "Maintenance", safety: "Blue", incidents: 0, permits: 3 },
  ];

  const PIE_DATA = [
    { name: 'Active', value: 12, color: '#059669' },
    { name: 'Pending', value: 5, color: '#F59E0B' },
    { name: 'Extended', value: 2, color: '#2563EB' },
    { name: 'Closed', value: 45, color: '#94A3B8' },
  ];

  const NEW_QUICK_ACTIONS = [
    { label: "Report Incident", icon: AlertTriangle, path: "/incidents", color: "#DC2626" },
    { label: "Create Permit", icon: FileText, path: "/permits", color: "#2563EB" },
    { label: "Add Observation", icon: Search, path: "/actions", color: "#059669" },
    { label: "Upload Excel Data", icon: Database, path: "/admin/imports", color: "#D97706" },
    { label: "Start Audit", icon: ClipboardCheck, path: "/audits", color: "#7C3AED" },
    { label: "Add User", icon: Users, path: "/users?add=1", color: "#1B5E20" },
  ];

  const sitesChartData = sites.slice(0, 6).map(s => ({ site: s.name.substring(0, 8), score: 8.5 }));

  return (
    <div className="space-y-6">
      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {loading
          ? Array.from({ length: 12 }).map((_, i) => <StatSkeleton key={i} />)
          : kpiMetrics.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border p-3.5 transition-all hover:shadow-md" style={{ borderColor: "#E3E9F6", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: stat.bg }}>
                  <stat.icon style={{ color: stat.color, width: 16, height: 16 }} />
                </div>
              </div>
              <div className="text-[20px] font-bold leading-none" style={{ color: "#111827" }}>{stat.value}</div>
              <div className="text-[11px] font-medium mt-1.5 leading-tight" style={{ color: "#64748B" }}>{stat.label}</div>
            </div>
          ))
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── Left Column (Main Stats) ── */}
        <div className="lg:col-span-8 space-y-5">
          {/* AI Alerts Section */}
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
            <div className="px-5 py-4 border-b flex items-center gap-2 bg-slate-50/50">
              <Zap className="w-5 h-5 text-amber-500" />
              <h2 className="text-[15px] font-bold text-gray-900">AI Safety Intelligence & Alerts</h2>
            </div>
            <div className="p-4 space-y-3">
              {AI_ALERTS.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-xl border-l-4 transition-colors hover:bg-slate-50" style={{ borderLeftColor: alert.color, background: `${alert.color}05`, borderColor: '#F1F5F9' }}>
                  <alert.icon className="w-4 h-4 mt-0.5" style={{ color: alert.color }} />
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-wider mb-0.5" style={{ color: alert.color }}>{alert.type}</p>
                    <p className="text-[13px] text-gray-700">{alert.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-Time Operational Status */}
          <div className="bg-white rounded-2xl border" style={{ borderColor: "#E3E9F6" }}>
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                <h2 className="text-[15px] font-bold text-gray-900">Live Operational Status</h2>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold border border-emerald-100 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                REAL-TIME
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[11px] font-bold text-gray-400 uppercase">
                  <tr>
                    <th className="px-5 py-3">Site / Operation</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Safety Index</th>
                    <th className="px-5 py-3 text-center">Open Incidents</th>
                    <th className="px-5 py-3 text-center">Permits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {OPERATIONAL_STATUS.map((row) => (
                    <tr key={row.site} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 text-[13px] font-semibold text-gray-700">{row.site}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-600 uppercase">{row.status}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2.5 h-2.5 rounded-full ${row.safety === 'Green' ? 'bg-emerald-500' : row.safety === 'Yellow' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                          <span className="text-[13px] font-medium">{row.safety}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center text-[13px] font-bold text-gray-600">{row.incidents}</td>
                      <td className="px-5 py-3.5 text-center text-[13px] font-bold text-blue-600">{row.permits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Right Column (Actions & Feed) ── */}
        <div className="lg:col-span-4 space-y-5">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
            <h2 className="text-[15px] font-bold mb-4 text-gray-900">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {NEW_QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all hover:bg-slate-50 hover:shadow-sm active:scale-95 group"
                  style={{ borderColor: "#F1F5F9" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: `${action.color}10` }}>
                    <action.icon style={{ color: action.color, width: 20, height: 20 }} />
                  </div>
                  <span className="text-[11px] font-bold leading-tight text-gray-600">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activities Feed */}
          <div className="bg-white rounded-2xl border" style={{ borderColor: "#E3E9F6" }}>
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-gray-900">Recent Activities</h2>
              <Clock className="w-4 h-4 text-gray-300" />
            </div>
            <div className="p-5 space-y-4 max-h-[460px] overflow-y-auto">
              {activityLoading ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
              ) : activities.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">No recent activities</div>
              ) : (
                activities.slice(0, 8).map((activity) => (
                  <div key={activity.id} className="relative pl-5 pb-4 border-l last:pb-0 border-slate-100">
                    <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white" 
                      style={{ background: activity.type === "Incident" ? "#DC2626" : activity.type === "Permit" ? "#2563EB" : activity.type === "Audit" ? "#7C3AED" : "#059669" }} />
                    <div className="text-[13px] font-bold text-gray-500 mb-0.5">{activity.type}</div>
                    <p className="text-[13px] text-gray-700 leading-snug">{activity.description}</p>
                    <div className="text-[11px] mt-1 text-gray-400 font-medium">{activity.user} · {activity.timestamp ? new Date(activity.timestamp).toLocaleTimeString() : 'Just now'}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Graphs & Charts Section ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold mb-4 text-gray-900">Incident Trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={[{m:'Jan',v:12}, {m:'Feb',v:15}, {m:'Mar',v:8}, {m:'Apr',v:10}]}>
              <CartesianGrid stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="v" stroke="#DC2626" strokeWidth={3} dot={{ r: 4, fill: '#DC2626', strokeWidth: 2, stroke: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold mb-4 text-gray-900">Permit Live Status</h2>
          <div className="flex items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={PIE_DATA} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {PIE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2.5 min-w-[100px]">
              {PIE_DATA.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-[12px] font-medium text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold mb-4 text-gray-900">Site-wise Performance</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sitesChartData}>
              <CartesianGrid stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="site" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Bar dataKey="score" fill="#4A57B9" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
           <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold text-gray-900">Risk Heatmap</h2>
              <Flame className="w-4 h-4 text-orange-500" />
           </div>
           <div className="h-[180px] rounded-xl bg-slate-50 flex items-center justify-center border border-dashed border-slate-200">
              <p className="text-[12px] text-slate-400">Risk Matrix Visualization (Spatial/Frequency) Loading...</p>
           </div>
        </div>

        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
           <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold text-gray-900">Department Safety Ranking</h2>
              <Users2 className="w-4 h-4 text-blue-500" />
           </div>
           <div className="space-y-3">
              {[
                { name: 'Production', score: 98, trend: 'up' },
                { name: 'Logistics', score: 94, trend: 'up' },
                { name: 'Maintenance', score: 89, trend: 'down' },
                { name: 'Quality Control', score: 91, trend: 'up' }
              ].map((dept, idx) => (
                <div key={dept.name} className="flex items-center gap-3">
                  <span className="text-[13px] font-bold text-slate-300 w-4">#{idx+1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-[13px] font-semibold text-gray-700">{dept.name}</span>
                      <span className="text-[12px] font-bold text-gray-500">{dept.score}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${dept.score > 95 ? 'bg-emerald-500' : dept.score > 90 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${dept.score}%` }} />
                    </div>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
