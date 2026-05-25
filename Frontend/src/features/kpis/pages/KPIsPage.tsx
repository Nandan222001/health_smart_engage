import { TrendingUp, TrendingDown, Loader2, RefreshCw, Users, FileText, AlertTriangle, Zap, ShieldAlert, BarChart3, Clock, CheckCircle2 } from "lucide-react";
import { useGetOrgAdminKpisQuery, type KpiItem } from "@/features/org-setup/api/orgSetupApi";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  on_track: { bg: "#D1FAE5", color: "#10B981", label: "On Track" },
  at_risk:  { bg: "#FEF3C7", color: "#F59E0B", label: "At Risk" },
  breached: { bg: "#FEE2E2", color: "#EF4444", label: "Breached" },
};

const KPI_CONFIG: Record<string, { label: string; target: string; lowerIsBetter: boolean; suffix: string }> = {
  trir:                { label: "TRIR", target: "< 0.50", lowerIsBetter: true, suffix: "" },
  ltir:                { label: "LTIFR", target: "< 0.10", lowerIsBetter: true, suffix: "" },
  near_miss_rate:      { label: "Near Miss Ratio", target: "> 2.0", lowerIsBetter: false, suffix: "%" },
  compliance_rate:     { label: "Compliance %", target: "> 90%", lowerIsBetter: false, suffix: "%" },
  open_capas:          { label: "Open CAPAs", target: "< 5", lowerIsBetter: true, suffix: "" },
  audit_completion:    { label: "Audit Completion %", target: "> 90%", lowerIsBetter: false, suffix: "%" },
  ptw_active:          { label: "Active Permits", target: "< 20", lowerIsBetter: true, suffix: "" },
  training_completion: { label: "Training Completion %", target: "> 90%", lowerIsBetter: false, suffix: "%" },
};

const TREND_DATA = [
  { name: 'Mon', kpi: 85, target: 90 },
  { name: 'Tue', kpi: 88, target: 90 },
  { name: 'Wed', kpi: 92, target: 90 },
  { name: 'Thu', kpi: 90, target: 90 },
  { name: 'Fri', kpi: 94, target: 90 },
  { name: 'Sat', kpi: 93, target: 90 },
  { name: 'Sun', kpi: 95, target: 90 },
];

export function KPIsPage() {
  const { data, isLoading, isFetching, refetch } = useGetOrgAdminKpisQuery();

  const kpis = data?.kpis ?? [];

  const monitoringCards = [
    { label: "Workers On Site", value: "124", icon: Users, color: "#4A57B9", bg: "#EEF2FF" },
    { label: "Live Work Permits", value: "18", icon: FileText, color: "#10B981", bg: "#D1FAE5" },
    { label: "Critical Activities", value: "3", icon: AlertTriangle, color: "#F59E0B", bg: "#FEF3C7" },
    { label: "Shift Fatigue Alerts", value: "2", icon: Zap, color: "#7C3AED", bg: "#EDE9FE" },
    { label: "Unsafe Conditions", value: "5", icon: ShieldAlert, color: "#EF4444", bg: "#FEE2E2" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Real-Time HSE KPIs</h1>
          <p className="text-sm mt-1 text-gray-500">Live safety monitoring & performance analytics</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          Sync Data
        </button>
      </div>

      {/* ── Live Monitoring Section ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {monitoringCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border p-4 shadow-sm border-gray-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: card.bg }}>
              <card.icon className="w-5 h-5" style={{ color: card.color }} />
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900 leading-none">{card.value}</div>
              <div className="text-[11px] font-bold text-gray-400 uppercase mt-1 tracking-tight">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Live KPI Metrics Grid ── */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-50 animate-pulse rounded-2xl" />
              ))
            ) : kpis.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="font-bold">Waiting for live data...</p>
              </div>
            ) : kpis.map((kpi) => {
              const config = KPI_CONFIG[kpi.id] || { label: kpi.label, target: String(kpi.target), lowerIsBetter: false, suffix: "" };
              const style = STATUS_STYLES[kpi.status] ?? STATUS_STYLES.on_track;
              const isGood = kpi.trend === "up" ? !config.lowerIsBetter : config.lowerIsBetter;

              return (
                <div key={kpi.id} className="bg-white rounded-2xl border p-5 shadow-sm border-gray-100 transition-transform hover:scale-[1.02]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{config.label}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase" style={{ background: style.bg, color: style.color }}>
                      {style.label}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-gray-900">{kpi.value}{config.suffix}</span>
                    <div className={`flex items-center text-[11px] font-bold ${isGood ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {kpi.trend === 'up' ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                      {isGood ? 'Improving' : 'Deteriorating'}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-gray-400 uppercase tracking-tighter">Target: {config.target}</span>
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                       <div className={`h-full ${isGood ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: '70%' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Weekly Performance Trend ── */}
          <div className="bg-white rounded-2xl border p-6 border-gray-100 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-[16px] font-bold text-gray-900">Weekly Performance Trend</h2>
                  <p className="text-[12px] text-gray-400 font-medium">Core Compliance Index (%)</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="text-[11px] font-bold text-gray-500">Actual</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-slate-200" />
                    <span className="text-[11px] font-bold text-gray-500">Target</span>
                  </div>
                </div>
             </div>
             <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={TREND_DATA}>
                    <defs>
                      <linearGradient id="colorKpi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94A3B8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94A3B8' }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="kpi" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorKpi)" />
                    <Area type="monotone" dataKey="target" stroke="#E2E8F0" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* ── Right Column: Daily & Monthly Analytics ── */}
        <div className="lg:col-span-4 space-y-6">
          {/* Daily Status Tracker */}
          <div className="bg-white rounded-2xl border p-5 border-gray-100 shadow-sm">
            <h2 className="text-[15px] font-bold text-gray-900 mb-4 flex items-center gap-2">
               <Clock className="w-4 h-4 text-indigo-500" /> Daily KPI Trends
            </h2>
            <div className="space-y-4">
               {[
                 { label: 'PPE Compliance', value: 98, trend: '+2%' },
                 { label: 'Incident Resolution', value: 75, trend: '+12%' },
                 { label: 'Permit Issuance', value: 92, trend: '-3%' },
                 { label: 'Fatigue Monitoring', value: 88, trend: '+5%' }
               ].map(item => (
                 <div key={item.label} className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[12px] font-bold text-gray-600">{item.label}</span>
                       <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${item.trend.startsWith('+') ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{item.trend}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${item.value}%` }} />
                       </div>
                       <span className="text-[13px] font-black text-gray-900">{item.value}%</span>
                    </div>
                 </div>
               ))}
            </div>
          </div>

          {/* Monthly Safety Trend (Bar) */}
          <div className="bg-white rounded-2xl border p-5 border-gray-100 shadow-sm">
            <h2 className="text-[15px] font-bold text-gray-900 mb-4 flex items-center gap-2">
               <TrendingUp className="w-4 h-4 text-emerald-500" /> Monthly Safety Performance
            </h2>
            <div className="h-[200px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{n:'Jan',v:88}, {n:'Feb',v:91}, {n:'Mar',v:89}, {n:'Apr',v:94}]}>
                    <XAxis dataKey="n" hide />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8, border: 'none' }} />
                    <Bar dataKey="v" radius={[4,4,4,4]} barSize={32}>
                       {[{n:'Jan',v:88}, {n:'Feb',v:91}, {n:'Mar',v:89}, {n:'Apr',v:94}].map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={index === 3 ? '#6366f1' : '#E2E8F0'} />
                       ))}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-between text-[12px] font-bold text-gray-500">
               <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>94% Success Rate</span>
               </div>
               <span className="text-emerald-500">+6.5% vs Prev Month</span>
            </div>
          </div>

          {/* Critical Risk Activity Feed */}
          <div className="bg-white rounded-2xl border overflow-hidden border-gray-100 shadow-sm">
             <div className="px-5 py-4 border-b border-gray-50 bg-slate-50/50">
                <h2 className="text-[14px] font-bold text-gray-900">Critical Risk Monitoring</h2>
             </div>
             <div className="p-2 space-y-1">
                {[
                  { site: 'Site A', task: 'Hot Work (Welding)', risk: 'High', time: 'Active' },
                  { site: 'Site C', task: 'Confined Space Entry', risk: 'Critical', time: 'Pending' },
                  { site: 'Site D', task: 'Working at Height', risk: 'High', time: 'Active' }
                ].map(risk => (
                  <div key={risk.task} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                     <div className="min-w-0">
                        <div className="text-[12px] font-bold text-gray-800 truncate">{risk.task}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{risk.site}</div>
                     </div>
                     <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${risk.risk === 'Critical' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>{risk.risk}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
