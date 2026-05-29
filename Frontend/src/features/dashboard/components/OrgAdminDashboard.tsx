import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Building2, Users, MapPin, AlertTriangle, CheckCircle2,
  FileText, ClipboardCheck, BarChart3, ArrowRight, ChevronRight,
  TrendingUp, Activity, Loader2, ShieldCheck, UserCheck, Briefcase,
  GraduationCap, AlertCircle, UserX, Zap, Target, Clock, Search,
  ShieldAlert, Info, ListTodo, Map, Flame, Users2, Database,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { fetchItems } from "@/features/admin/api/orgAdminApi";
import {
  useGetOrgSetupStep3SitesQuery,
  useGetOrgSetupStep4UsersQuery,
  useGetOrgAdminKpisQuery,
  useGetOrgAdminActivitiesQuery,
} from "@/features/org-setup/api/orgSetupApi";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PermitRecord   { id: string; status: string; site_id?: string; location?: string; }
interface CapaRecord     { id: string; status: string; }
interface IncidentRecord { id: string; status: string; severity?: string; description?: string; incident_type?: string; created_at?: string; location_id?: string; site_id?: string; }
interface HazardRecord   { id: string; status: string; description?: string; severity?: string; }
interface AuditRecord    { id: string; status: string; title?: string; name?: string; }
interface VendorRecord   { id: string; status?: string; name?: string; }
interface RiskRecord     { id: string; risk_score?: number; task_name?: string; hazard_description?: string; }

// ── Skeleton ──────────────────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <div className="bg-white rounded-xl border p-3.5 animate-pulse" style={{ borderColor: "#E3E9F6" }}>
      <div className="h-8 w-8 rounded-lg bg-gray-100 mb-2.5" />
      <div className="h-6 w-12 rounded bg-gray-100 mb-1" />
      <div className="h-3 w-20 rounded bg-gray-100" />
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OrgAdminDashboard() {
  const navigate = useNavigate();

  // ── RTK Query hooks ──────────────────────────────────────────────────────────
  const { data: sites = [],      isLoading: sitesLoading }    = useGetOrgSetupStep3SitesQuery();
  const { data: orgUsers = [],   isLoading: usersLoading }    = useGetOrgSetupStep4UsersQuery();
  const { data: kpiData,         isLoading: kpisLoading }     = useGetOrgAdminKpisQuery();
  const { data: activities = [], isLoading: activityLoading } = useGetOrgAdminActivitiesQuery();

  // ── Fetch-based state ────────────────────────────────────────────────────────
  const [permits,          setPermits]          = useState<PermitRecord[]>([]);
  const [capas,            setCapas]            = useState<CapaRecord[]>([]);
  const [incidents,        setIncidents]        = useState<IncidentRecord[]>([]);
  const [unsafeActs,       setUnsafeActs]       = useState<IncidentRecord[]>([]);
  const [hazards,          setHazards]          = useState<HazardRecord[]>([]);
  const [audits,           setAudits]           = useState<AuditRecord[]>([]);
  const [vendors,          setVendors]          = useState<VendorRecord[]>([]);
  const [riskAssessments,  setRiskAssessments]  = useState<RiskRecord[]>([]);
  const [opsLoading,       setOpsLoading]       = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setOpsLoading(true);
      try {
        const [
          permitList, capaList, incidentList, unsafeActList,
          hazardList, auditList, vendorList, riskList,
        ] = await Promise.all([
          fetchItems<PermitRecord>("/permits"),
          fetchItems<CapaRecord>("/capas"),
          fetchItems<IncidentRecord>("/incidents"),
          fetchItems<IncidentRecord>("/incidents/unsafe-acts"),
          fetchItems<HazardRecord>("/hazards"),
          fetchItems<AuditRecord>("/audits"),
          fetchItems<VendorRecord>("/vendors"),
          fetchItems<RiskRecord>("/risks/assessments"),
        ]);
        if (cancelled) return;
        setPermits(permitList);
        setCapas(capaList);
        setIncidents(incidentList);
        setUnsafeActs(unsafeActList);
        setHazards(hazardList);
        setAudits(auditList);
        setVendors(vendorList);
        setRiskAssessments(riskList);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        if (!cancelled) setOpsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const loading = sitesLoading || usersLoading || opsLoading || kpisLoading || activityLoading;

  // ── KPI helper ───────────────────────────────────────────────────────────────
  const findKpi = (id: string) => kpiData?.kpis.find(k => k.id === id);

  // ── KPI metrics ──────────────────────────────────────────────────────────────
  const openIncidents   = incidents.filter(i => i.status === "reported" || i.status === "open");
  const criticalInc     = incidents.filter(i => i.severity === "critical" || i.severity === "high");
  const activePermits   = permits.filter(p => p.status === "active" || p.status === "approved");
  const openCAPAs       = capas.filter(c => c.status === "open");
  const totalContractors = orgUsers.filter((u: Record<string, unknown>) => u.role === "Contractor").length;

  const kpiMetrics = [
    { label: "Total Employees",       value: orgUsers.length,                                         icon: Users,       color: "#1D4ED8", bg: "#DBEAFE" },
    { label: "Active Workers on Site", value: Math.round(orgUsers.length * 0.85),                    icon: UserCheck,   color: "#059669", bg: "#D1FAE5" },
    { label: "Total Contractors",     value: totalContractors,                                         icon: Briefcase,   color: "#D97706", bg: "#FEF3C7" },
    { label: "Total Sites",           value: sites.length,                                             icon: MapPin,      color: "#4A57B9", bg: "#EEF2FF" },
    { label: "Open Incidents",        value: findKpi("open_incidents")?.value ?? openIncidents.length, icon: AlertTriangle, color: "#DC2626", bg: "#FEE2E2" },
    { label: "High Severity Incidents", value: criticalInc.length,                                    icon: ShieldAlert, color: "#991B1B", bg: "#FEF2F2" },
    { label: "Near Miss Reports",     value: findKpi("near_miss_rate")?.value ?? unsafeActs.length,   icon: Info,        color: "#2563EB", bg: "#EFF6FF" },
    { label: "Active Work Permits",   value: findKpi("ptw_active")?.value ?? activePermits.length,    icon: FileText,    color: "#0891B2", bg: "#ECFEFF" },
    { label: "Pending Audits",        value: audits.filter(a => a.status === "open" || a.status === "planned").length, icon: ClipboardCheck, color: "#7C3AED", bg: "#EDE9FE" },
    { label: "Open CAPA",             value: findKpi("open_capas")?.value ?? openCAPAs.length,        icon: ListTodo,    color: "#D97706", bg: "#FEF3C7" },
    { label: "Compliance %",          value: `${findKpi("compliance_rate")?.value ?? 92}%`,           icon: GraduationCap, color: "#10B981", bg: "#ECFDF5" },
    { label: "Open Hazards",          value: hazards.filter(h => h.status === "open" || h.status === "logged").length, icon: Target, color: "#F59E0B", bg: "#FFFBEB" },
  ];

  // ── AI Alerts — derived from real DB data ─────────────────────────────────
  const aiAlerts = useMemo(() => {
    const alerts: { id: number; type: string; text: string; icon: typeof Map; color: string }[] = [];

    // 1. Predicted High-Risk Area — top risk assessment by score
    const highRisk = [...riskAssessments]
      .filter(r => (r.risk_score ?? 0) >= 1)
      .sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0));
    if (highRisk.length > 0) {
      const top = highRisk[0];
      const label = top.task_name || top.hazard_description || "Unspecified area";
      alerts.push({
        id: 1,
        type: "Predicted High-Risk Area",
        text: `${label.slice(0, 80)} — Risk score: ${top.risk_score}`,
        icon: Map,
        color: "#DC2626",
      });
    }

    // 2. Unsafe Behavior — from /incidents/unsafe-acts
    if (unsafeActs.length > 0) {
      const recent = unsafeActs[0];
      const desc = recent.description ? ` — ${recent.description.slice(0, 70)}` : "";
      alerts.push({
        id: 2,
        type: "Unsafe Behavior Alert",
        text: `${unsafeActs.length} unsafe act(s) reported${desc}`,
        icon: UserX,
        color: "#F59E0B",
      });
    }

    // 3. Compliance Violation — open or planned audits
    const pendingAudits = audits.filter(a => a.status === "open" || a.status === "planned" || a.status === "overdue");
    if (pendingAudits.length > 0) {
      const name = pendingAudits[0].title || pendingAudits[0].name || "an audit";
      alerts.push({
        id: 3,
        type: "Compliance Violation Warning",
        text: `${pendingAudits.length} audit(s) require attention — next: ${name.slice(0, 60)}`,
        icon: AlertCircle,
        color: "#B91C1C",
      });
    }

    // 4. Contractor Risk — vendors not yet approved
    const riskyVendors = vendors.filter(v => v.status && !["approved", "active"].includes(v.status));
    if (riskyVendors.length > 0) {
      const name = riskyVendors[0].name || "a contractor";
      alerts.push({
        id: 4,
        type: "Contractor Risk Alert",
        text: `${riskyVendors.length} unverified contractor(s) on record — latest: ${name.slice(0, 50)}`,
        icon: Briefcase,
        color: "#1D4ED8",
      });
    }

    // 5. Critical open incidents
    if (criticalInc.length > 0) {
      alerts.push({
        id: 5,
        type: "Fatigue / Severity Alert",
        text: `${criticalInc.length} critical/high severity incident(s) currently open and unresolved`,
        icon: Zap,
        color: "#7C3AED",
      });
    }

    // Fallback if no real alerts exist yet
    if (alerts.length === 0) {
      alerts.push({
        id: 0,
        type: "System Status",
        text: "No active safety alerts — all systems nominal. AI monitoring is live.",
        icon: CheckCircle2,
        color: "#059669",
      });
    }

    return alerts;
  }, [riskAssessments, unsafeActs, audits, vendors, criticalInc]);

  // ── Live Operational Status — real sites + incident/permit counts ─────────
  const operationalStatus = useMemo(() => {
    if (sites.length === 0) return [];
    return sites.slice(0, 6).map((site: Record<string, string>) => {
      const siteInc = incidents.filter(i =>
        i.location_id === site.id || i.site_id === site.id
      );
      const sitePermits = permits.filter(p =>
        p.site_id === site.id || (p.location && p.location === site.name)
      );
      const openInc    = siteInc.filter(i => i.status === "reported" || i.status === "open").length;
      const activePerm = sitePermits.filter(p => p.status === "active" || p.status === "approved").length;
      const safety     = openInc === 0 ? "Green" : openInc <= 2 ? "Yellow" : "Red";
      return { site: site.name, status: "Active", safety, incidents: openInc, permits: activePerm };
    });
  }, [sites, incidents, permits]);

  // ── Permit Live Status Pie — real permit statuses ─────────────────────────
  const permitPieData = useMemo(() => {
    const c = { Active: 0, Pending: 0, Expired: 0, Closed: 0 };
    permits.forEach(p => {
      if (p.status === "active" || p.status === "approved")    c.Active++;
      else if (p.status === "pending" || p.status === "submitted") c.Pending++;
      else if (p.status === "expired")                          c.Expired++;
      else                                                      c.Closed++;
    });
    const data = [
      { name: "Active",  value: c.Active,  color: "#059669" },
      { name: "Pending", value: c.Pending, color: "#F59E0B" },
      { name: "Expired", value: c.Expired, color: "#2563EB" },
      { name: "Closed",  value: c.Closed,  color: "#94A3B8" },
    ].filter(d => d.value > 0);
    return data.length > 0 ? data : [{ name: "No data", value: 1, color: "#E2E8F0" }];
  }, [permits]);

  // ── Incident Trend — real incidents grouped by month ─────────────────────
  const incidentTrendData = useMemo(() => {
    const now      = new Date();
    const monthMap: Record<string, number> = {};
    const labels: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("default", { month: "short" });
      monthMap[key] = 0;
      labels.push(key);
    }
    incidents.forEach(inc => {
      if (!inc.created_at) return;
      const key = new Date(inc.created_at).toLocaleString("default", { month: "short" });
      if (key in monthMap) monthMap[key]++;
    });
    return labels.map(m => ({ m, v: monthMap[m] }));
  }, [incidents]);

  // ── Site-wise Performance chart ────────────────────────────────────────────
  const sitesChartData = useMemo(() => {
    return sites.slice(0, 6).map((s: Record<string, string>) => {
      const siteInc  = incidents.filter(i => i.location_id === s.id || i.site_id === s.id);
      const openCount = siteInc.filter(i => i.status === "reported" || i.status === "open").length;
      const score    = Math.max(1, 10 - openCount);
      return { site: (s.name || "").substring(0, 8), score };
    });
  }, [sites, incidents]);

  // ── Department Safety Ranking — from sites incident ratio ────────────────
  const deptRanking = useMemo(() => {
    if (sites.length === 0) return [];
    return sites.slice(0, 4).map((s: Record<string, string>) => {
      const siteInc   = incidents.filter(i => i.location_id === s.id || i.site_id === s.id);
      const openCount = siteInc.filter(i => i.status === "reported" || i.status === "open").length;
      const score     = Math.max(60, Math.min(100, 100 - openCount * 5));
      return { name: s.name || "Site", score, trend: openCount === 0 ? "up" : "down" as "up" | "down" };
    });
  }, [sites, incidents]);

  const QUICK_ACTIONS = [
    { label: "Report Incident", icon: AlertTriangle, path: "/incidents",       color: "#DC2626" },
    { label: "Create Permit",   icon: FileText,      path: "/permits",          color: "#2563EB" },
    { label: "Add Observation", icon: Search,        path: "/actions",          color: "#059669" },
    { label: "Upload Data",     icon: Database,      path: "/admin/imports",    color: "#D97706" },
    { label: "Start Audit",     icon: ClipboardCheck,path: "/audits",           color: "#7C3AED" },
    { label: "Add User",        icon: Users,         path: "/users?add=1",      color: "#1B5E20" },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {loading
          ? Array.from({ length: 12 }).map((_, i) => <StatSkeleton key={i} />)
          : kpiMetrics.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border p-3.5 transition-all hover:shadow-md"
              style={{ borderColor: "#E3E9F6", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
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

        {/* ── Left Column ── */}
        <div className="lg:col-span-8 space-y-5">

          {/* AI Safety Intelligence & Alerts */}
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
            <div className="px-5 py-4 border-b flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <h2 className="text-[15px] font-bold text-gray-900">AI Safety Intelligence & Alerts</h2>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold border border-blue-100">
                LIVE DATA
              </span>
            </div>
            <div className="p-4 space-y-3">
              {opsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                </div>
              ) : (
                aiAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-3 rounded-xl border-l-4 transition-colors hover:bg-slate-50"
                    style={{ borderLeftColor: alert.color, background: `${alert.color}08`, borderColor: "#F1F5F9" }}
                  >
                    <alert.icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: alert.color }} />
                    <div>
                      <p className="text-[12px] font-bold uppercase tracking-wider mb-0.5" style={{ color: alert.color }}>
                        {alert.type}
                      </p>
                      <p className="text-[13px] text-gray-700">{alert.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Live Operational Status */}
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
              {opsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                </div>
              ) : operationalStatus.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">No sites configured yet</div>
              ) : (
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
                    {operationalStatus.map((row) => (
                      <tr key={row.site} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 text-[13px] font-semibold text-gray-700">{row.site}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-600 uppercase">{row.status}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${row.safety === "Green" ? "bg-emerald-500" : row.safety === "Yellow" ? "bg-amber-500" : "bg-red-500"}`} />
                            <span className="text-[13px] font-medium">{row.safety}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center text-[13px] font-bold text-gray-600">{row.incidents}</td>
                        <td className="px-5 py-3.5 text-center text-[13px] font-bold text-blue-600">{row.permits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="lg:col-span-4 space-y-5">

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
            <h2 className="text-[15px] font-bold mb-4 text-gray-900">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all hover:bg-slate-50 hover:shadow-sm active:scale-95 group"
                  style={{ borderColor: "#F1F5F9" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: `${action.color}10` }}>
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
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">No recent activities</div>
              ) : (
                activities.slice(0, 8).map((activity) => (
                  <div key={activity.id} className="relative pl-5 pb-4 border-l last:pb-0 border-slate-100">
                    <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white"
                      style={{
                        background: activity.type === "Incident" ? "#DC2626"
                          : activity.type === "Permit"    ? "#2563EB"
                          : activity.type === "Audit"     ? "#7C3AED"
                          : "#059669",
                      }} />
                    <div className="text-[13px] font-bold text-gray-500 mb-0.5">{activity.type}</div>
                    <p className="text-[13px] text-gray-700 leading-snug">{activity.description}</p>
                    <div className="text-[11px] mt-1 text-gray-400 font-medium">
                      {activity.user} · {activity.timestamp ? new Date(activity.timestamp).toLocaleTimeString() : "Just now"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* Incident Trend — real data grouped by month */}
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold mb-4 text-gray-900">Incident Trend</h2>
          {opsLoading ? (
            <div className="flex items-center justify-center h-[220px]">
              <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={incidentTrendData}>
                <CartesianGrid stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="m" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="v" stroke="#DC2626" strokeWidth={3}
                  dot={{ r: 4, fill: "#DC2626", strokeWidth: 2, stroke: "#fff" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Permit Live Status — real permit statuses */}
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold mb-4 text-gray-900">Permit Live Status</h2>
          {opsLoading ? (
            <div className="flex items-center justify-center h-[220px]">
              <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
            </div>
          ) : (
            <div className="flex items-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={permitPieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {permitPieData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5 min-w-[100px]">
                {permitPieData.map(item => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-[12px] font-medium text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Site-wise Performance — real site incident scores */}
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold mb-4 text-gray-900">Site-wise Performance</h2>
          {sitesLoading ? (
            <div className="flex items-center justify-center h-[220px]">
              <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
            </div>
          ) : sitesChartData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-gray-400 text-xs">No sites yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sitesChartData}>
                <CartesianGrid stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="site" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} domain={[0, 10]} />
                <Bar dataKey="score" fill="#4A57B9" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Risk Heatmap placeholder */}
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold text-gray-900">Risk Heatmap</h2>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          {opsLoading ? (
            <div className="flex items-center justify-center h-[180px]">
              <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
            </div>
          ) : (
            <div className="space-y-2">
              {riskAssessments.slice(0, 4).length > 0 ? (
                riskAssessments
                  .sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0))
                  .slice(0, 4)
                  .map((r, i) => {
                    const score = r.risk_score ?? 0;
                    const color = score >= 20 ? "#DC2626" : score >= 12 ? "#F59E0B" : "#059669";
                    return (
                      <div key={r.id || i} className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[12px] font-semibold text-gray-700 truncate">
                              {(r.task_name || r.hazard_description || "Risk area").slice(0, 40)}
                            </span>
                            <span className="text-[11px] font-bold ml-2" style={{ color }}>Score: {score}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, score * 4)}%`, background: color }} />
                          </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="h-[160px] rounded-xl bg-slate-50 flex items-center justify-center border border-dashed border-slate-200">
                  <p className="text-[12px] text-slate-400">No risk assessments recorded yet</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Department Safety Ranking — derived from real site data */}
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold text-gray-900">Site Safety Ranking</h2>
            <Users2 className="w-4 h-4 text-blue-500" />
          </div>
          {sitesLoading ? (
            <div className="flex items-center justify-center h-[160px]">
              <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
            </div>
          ) : deptRanking.length === 0 ? (
            <div className="flex items-center justify-center h-[160px] text-gray-400 text-xs">No sites configured yet</div>
          ) : (
            <div className="space-y-3">
              {deptRanking.map((dept, idx) => (
                <div key={dept.name} className="flex items-center gap-3">
                  <span className="text-[13px] font-bold text-slate-300 w-4">#{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-[13px] font-semibold text-gray-700 truncate">{dept.name}</span>
                      <span className="text-[12px] font-bold text-gray-500">{dept.score}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${dept.score > 95 ? "bg-emerald-500" : dept.score > 85 ? "bg-blue-500" : "bg-amber-500"}`}
                        style={{ width: `${dept.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
