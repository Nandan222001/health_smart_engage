import { useState, useEffect } from "react";
import {
  Building2, Users, MapPin, AlertTriangle, ShieldCheck,
  BarChart3, CheckCircle2, Loader2, Briefcase, GraduationCap,
  ClipboardCheck, ListTodo, TrendingUp, Target, Activity,
  Info, ShieldAlert, Users2, Map
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { useGetOrgAdminOverviewQuery, useGetOrgAdminKpisQuery, useGetOrgSetupStep3SitesQuery, useGetOrgSetupStep4UsersQuery } from "@/features/org-setup/api/orgSetupApi";
import { fetchItems } from "@/features/admin/api/orgAdminApi";

interface PermitRecord { id: string; status: string; }
interface CapaRecord   { id: string; status: string; }

export function OverviewPage() {
  const { data: overview, isLoading: overviewLoading } = useGetOrgAdminOverviewQuery();
  const { data: kpiData, isLoading: kpisLoading } = useGetOrgAdminKpisQuery();
  const { data: sites = [], isLoading: sitesLoading } = useGetOrgSetupStep3SitesQuery();
  const { data: orgUsers = [], isLoading: usersLoading } = useGetOrgSetupStep4UsersQuery();

  const [permits, setPermits] = useState<PermitRecord[]>([]);
  const [capas, setCapas] = useState<CapaRecord[]>([]);
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
        console.error("Overview data load error:", err);
      } finally {
        setOpsLoading(false);
      }
    }
    load();
  }, []);

  const loading = overviewLoading || kpisLoading || sitesLoading || usersLoading || opsLoading;

  // Helper to find KPI by ID
  const findKpi = (id: string) => kpiData?.kpis.find(k => k.id === id);

  const orgSummary = [
    { label: "Organization Name", value: overview?.orgName || "—", icon: Building2 },
    { label: "Industry Type", value: overview?.industry || "—", icon: Info },
    { label: "Active Sites", value: sites.length, icon: MapPin },
    { label: "Departments", value: [...new Set(orgUsers.map(u => u.department).filter(Boolean))].length, icon: Users2 },
    { label: "Active Projects", value: sites.filter(s => s.type === "Project").length || "—", icon: Briefcase },
    { label: "Total Workforce", value: orgUsers.length, icon: Users },
    { label: "Contractors Count", value: orgUsers.filter(u => u.role === "Contractor").length, icon: UserCheck },
  ];

  const safetyOverview = [
    { label: "Total Incidents", value: findKpi("total_incidents")?.value ?? "15", icon: AlertTriangle, color: "#DC2626" },
    { label: "Open Risks", value: "8", icon: ShieldAlert, color: "#F59E0B" },
    { label: "Audit Findings", value: "24", icon: ClipboardCheck, color: "#7C3AED" },
    { label: "CAPA Pending", value: findKpi("open_capas")?.value ?? capas.length, icon: ListTodo, color: "#D97706" },
    { label: "Training Compliance", value: `${findKpi("training_completion")?.value ?? 94}%`, icon: GraduationCap, color: "#059669" },
  ];

  const DEPT_RANKING = [
    { name: 'Production', incidents: 2, risk: 'Low', score: 98 },
    { name: 'Logistics', incidents: 5, risk: 'Medium', score: 94 },
    { name: 'Maintenance', incidents: 8, risk: 'High', score: 89 },
    { name: 'Quality Control', incidents: 3, risk: 'Low', score: 91 }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Organization Overview</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Comprehensive operational and safety summary</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold" style={{ background: "#F0F4FF", color: "#4A57B9" }}>
          <Activity className="w-4 h-4" />
          Live Summary
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Organization Summary ── */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: "#E3E9F6" }}>
            <h2 className="text-[16px] font-bold text-gray-900 border-b pb-3" style={{ borderColor: "#F1F5F9" }}>Organization Summary</h2>
            <div className="space-y-4">
              {orgSummary.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="text-[13px] font-medium text-gray-500">{item.label}</span>
                  </div>
                  <span className="text-[13px] font-bold text-gray-900">{loading ? "—" : item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Overview Stats */}
          <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: "#E3E9F6" }}>
            <h2 className="text-[16px] font-bold text-gray-900 border-b pb-3" style={{ borderColor: "#F1F5F9" }}>Safety Overview</h2>
            <div className="grid grid-cols-1 gap-3">
              {safetyOverview.map((item) => (
                <div key={item.label} className="flex items-center gap-4 p-3 rounded-xl border border-dashed transition-all hover:border-solid hover:bg-slate-50" style={{ borderColor: '#E2E8F0' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${item.color}10` }}>
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[20px] font-bold leading-none text-gray-900">{loading ? "—" : item.value}</div>
                    <div className="text-[12px] font-medium text-gray-500 mt-1">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main Dashboard Area ── */}
        <div className="lg:col-span-8 space-y-6">
          {/* Site Summary Table */}
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
            <div className="px-5 py-4 border-b flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-500" />
                <h2 className="text-[16px] font-bold text-gray-900">Site Performance & Summary</h2>
              </div>
              <button className="text-[12px] font-bold text-indigo-600 hover:underline">View All Sites</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[11px] font-bold text-gray-400 uppercase">
                  <tr>
                    <th className="px-5 py-3">Site Name</th>
                    <th className="px-5 py-3 text-center">Risk Score</th>
                    <th className="px-5 py-3 text-center">Compliance</th>
                    <th className="px-5 py-3 text-center">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sites.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400 text-sm italic">No sites registered yet</td></tr>
                  ) : sites.slice(0, 5).map((site) => (
                    <tr key={site.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="text-[13px] font-bold text-gray-800">{site.name}</div>
                        <div className="text-[11px] text-gray-400">{site.type}</div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[12px] font-bold">
                           <Target className="w-3 h-3" /> 2.4
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="text-[13px] font-bold text-gray-700">92%</div>
                        <div className="w-16 h-1 bg-slate-100 rounded-full mx-auto mt-1 overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: '92%' }} />
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-[12px] font-bold text-emerald-500 flex items-center justify-center gap-1">
                          High <TrendingUp className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Department Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: "#E3E9F6" }}>
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-gray-900">Department Safety Ranking</h2>
                <Users2 className="w-4 h-4 text-slate-300" />
              </div>
              <div className="space-y-4">
                {DEPT_RANKING.map((dept, idx) => (
                  <div key={dept.name} className="flex items-center gap-3">
                    <span className="text-[14px] font-black text-slate-200 w-5">0{idx+1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-end mb-1.5">
                        <span className="text-[13px] font-bold text-gray-700 truncate">{dept.name}</span>
                        <span className="text-[11px] font-bold text-indigo-600">{dept.score}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${dept.score}%` }} />
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] font-medium text-gray-400">
                        <span>Risk: {dept.risk}</span>
                        <span>{dept.incidents} Incidents</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Department Trends Chart */}
            <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: "#E3E9F6" }}>
              <h2 className="text-[15px] font-bold text-gray-900">Department Incident Trends</h2>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={DEPT_RANKING}>
                    <CartesianGrid stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="incidents" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Risk Heatmap Visualization */}
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">Department Risk Levels</h2>
                <p className="text-[12px] text-gray-400">Spatial distribution of risk intensity by department</p>
              </div>
              <Activity className="w-5 h-5 text-rose-500" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {DEPT_RANKING.map(dept => (
                <div key={dept.name} className="p-4 rounded-2xl text-center space-y-2 border border-slate-50 bg-slate-50/50 transition-transform hover:scale-105">
                  <div className={`w-3 h-3 rounded-full mx-auto ${dept.risk === 'High' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse' : dept.risk === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <div className="text-[12px] font-bold text-gray-700">{dept.name}</div>
                  <div className="text-[10px] font-bold uppercase tracking-tight text-gray-400">{dept.risk} Risk</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}
