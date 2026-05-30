import { useState, useMemo } from "react";
import { 
  Search, RefreshCw, Loader2, Filter, ChevronLeft, ChevronRight,
  AlertTriangle, FileText, ClipboardCheck, UserPlus, HardHat,
  UploadCloud, CheckCircle2, ShieldAlert, Clock, MapPin, Building2,
  MoreHorizontal, Download
} from "lucide-react";
import { useGetOrgAdminActivitiesQuery } from "@/features/org-setup/api/orgSetupApi";

interface ActivityLog {
  id: string;
  type: "Incident" | "Permit" | "Audit" | "User" | "Contractor" | "SOP" | "CAPA" | "Risk";
  description: string;
  user: string;
  site: string;
  department: string;
  timestamp: string;
  status: "Completed" | "Pending" | "Critical" | "Approved" | "Closed";
  action: string;
}

const CATEGORY_CONFIG: Record<ActivityLog["type"], { icon: any, color: string, bg: string }> = {
  Incident:   { icon: AlertTriangle, color: "#DC2626", bg: "#FEF2F2" },
  Permit:     { icon: FileText,      color: "#2563EB", bg: "#EFF6FF" },
  Audit:      { icon: ClipboardCheck,color: "#7C3AED", bg: "#EDE9FE" },
  User:       { icon: UserPlus,      color: "#059669", bg: "#ECFDF5" },
  Contractor: { icon: HardHat,       color: "#D97706", bg: "#FEF3C7" },
  SOP:        { icon: UploadCloud,   color: "#0891B2", bg: "#ECFEFF" },
  CAPA:       { icon: CheckCircle2,  color: "#1B5E20", bg: "#E8F5E9" },
  Risk:       { icon: ShieldAlert,   color: "#B91C1C", bg: "#FEF2F2" },
};

const MOCK_ACTIVITIES: ActivityLog[] = [
  {
    id: "1",
    type: "Incident",
    description: "New High-Severity Incident Reported",
    user: "Robert Wilson",
    site: "Site A - PetroChem",
    department: "Production",
    timestamp: new Date().toISOString(),
    status: "Critical",
    action: "Incident Creation"
  },
  {
    id: "2",
    type: "Permit",
    description: "Hot Work Permit Approved",
    user: "Sarah Jenkins",
    site: "Site B - Logistics",
    department: "Maintenance",
    timestamp: new Date(Date.now() - 1000 * 1800).toISOString(),
    status: "Approved",
    action: "Permit Approval"
  },
  {
    id: "3",
    type: "Audit",
    description: "Safety Audit Completed",
    user: "Michael Chen",
    site: "Site A - PetroChem",
    department: "Quality Control",
    timestamp: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),
    status: "Completed",
    action: "Audit Closure"
  },
  {
    id: "4",
    type: "User",
    description: "New HSE Supervisor Added",
    user: "Admin System",
    site: "Headquarters",
    department: "Human Resources",
    timestamp: new Date(Date.now() - 1000 * 3600 * 4).toISOString(),
    status: "Completed",
    action: "User Provisioning"
  },
  {
    id: "5",
    type: "Contractor",
    description: "New Contractor Entity Registered",
    user: "David Miller",
    site: "Site C - Refinement",
    department: "Operations",
    timestamp: new Date(Date.now() - 1000 * 3600 * 6).toISOString(),
    status: "Pending",
    action: "Registration"
  },
  {
    id: "6",
    type: "SOP",
    description: "Working at Height SOP Updated",
    user: "Emma Thompson",
    site: "Organization-wide",
    department: "HSE Compliance",
    timestamp: new Date(Date.now() - 1000 * 3600 * 12).toISOString(),
    status: "Completed",
    action: "File Upload"
  },
  {
    id: "7",
    type: "CAPA",
    description: "Corrective Action for Fire Safety Closed",
    user: "James Bond",
    site: "Site D - Offshore",
    department: "Maintenance",
    timestamp: new Date(Date.now() - 1000 * 3600 * 24).toISOString(),
    status: "Closed",
    action: "CAPA Closure"
  },
  {
    id: "8",
    type: "Risk",
    description: "Facility Risk Assessment Updated",
    user: "Linda García",
    site: "Site A - PetroChem",
    department: "Safety",
    timestamp: new Date(Date.now() - 1000 * 3600 * 48).toISOString(),
    status: "Completed",
    action: "Assessment Update"
  }
];

export function ActivitiesPage() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("All");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // In real implementation, we would merge real API data with these detailed logs
  // For now, we enhance the UI as per the prompt requirements
  const { isFetching, refetch } = useGetOrgAdminActivitiesQuery();

  const filtered = useMemo(() => {
    return MOCK_ACTIVITIES.filter(a => {
      const matchesSearch = a.description.toLowerCase().includes(search.toLowerCase()) || 
                          a.user.toLowerCase().includes(search.toLowerCase()) ||
                          a.site.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === "All" || a.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [search, filterType]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-sm mt-1 text-gray-500">Track all operational activities and safety events across the organization</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-[13px] font-bold text-gray-600 hover:bg-gray-50 transition-all">
            <Download className="w-4 h-4" />
            Export Logs
          </button>
          <button 
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-[13px] font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border p-4 shadow-sm border-gray-100 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search by action, username, or site..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {["All", ...Object.keys(CATEGORY_CONFIG)].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition-all border ${filterType === type ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-200'}`}
            >
              {type === "All" ? "All Activities" : type}
            </button>
          ))}
        </div>
      </div>

      {/* ── Activity Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Action Performed</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Site & Department</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Timestamp</th>
                <th className="px-6 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-400">
                     <Clock className="w-12 h-12 mx-auto mb-3 opacity-10" />
                     <p className="font-bold">No recent activities found</p>
                  </td>
                </tr>
              ) : paged.map((log) => {
                const config = CATEGORY_CONFIG[log.type];
                const Icon = config.icon;
                
                return (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: config.bg }}>
                           <Icon className="w-5 h-5" style={{ color: config.color }} />
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-gray-900 leading-tight">{log.action}</div>
                          <div className="text-[12px] text-gray-500 mt-0.5 truncate max-w-[240px]">{log.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-500 border border-white">
                             {log.user.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-[13px] font-semibold text-gray-700">{log.user}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-1 text-[13px] font-bold text-gray-700">
                          <MapPin className="w-3 h-3 text-indigo-500" />
                          {log.site}
                       </div>
                       <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium mt-0.5">
                          <Building2 className="w-3 h-3" />
                          {log.department}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-tighter ${
                         log.status === 'Critical' ? 'bg-rose-100 text-rose-600' :
                         log.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                         log.status === 'Closed' ? 'bg-slate-100 text-slate-600' :
                         log.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                       }`}>
                         {log.status}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="text-[13px] font-bold text-gray-700">
                          {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                       </div>
                       <div className="text-[11px] text-gray-400 font-medium">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="p-2 rounded-lg hover:bg-slate-100 text-gray-400 transition-colors opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="w-4 h-4" />
                       </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Footer / Pagination ── */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
           <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
              Showing {paged.length} of {filtered.length} activities
           </p>
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-[13px] font-bold text-gray-600 px-2">Page {page} of {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
