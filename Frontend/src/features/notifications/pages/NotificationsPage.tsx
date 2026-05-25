import { useState, useMemo } from "react";
import { 
  Bell, Search, Filter, CheckCircle2, AlertTriangle, 
  Clock, ShieldAlert, FileText, ClipboardCheck, 
  GraduationCap, Zap, Siren, X, Trash2, MailOpen
} from "lucide-react";

interface Notification {
  id: string;
  category: "Incident" | "Permit" | "CAPA" | "Audit" | "Training" | "Compliance" | "AI Safety" | "Emergency";
  title: string;
  message: string;
  priority: "High" | "Medium" | "Low";
  timestamp: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    category: "Emergency",
    title: "Fire Alarm Triggered - Site A",
    message: "A fire alarm has been triggered in the chemical storage area of Site A. Evacuate immediately.",
    priority: "High",
    timestamp: new Date().toISOString(),
    read: false,
  },
  {
    id: "2",
    category: "AI Safety",
    title: "AI Warning: Unsafe Behavior Detected",
    message: "AI Vision detected a worker without a helmet in Zone 4 (Loading Bay).",
    priority: "High",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    read: false,
  },
  {
    id: "3",
    category: "Permit",
    title: "Permit Approval Required",
    message: "New Hot Work Permit request from Site B requires your immediate review.",
    priority: "Medium",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    read: false,
  },
  {
    id: "4",
    category: "Training",
    title: "Training Expiry Alert",
    message: "John Doe's First Aid certification expires in 5 days.",
    priority: "Low",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    read: true,
  },
  {
    id: "5",
    category: "Incident",
    title: "New Incident Reported",
    message: "A minor slip and fall incident has been reported at Site C - Logistics.",
    priority: "Medium",
    timestamp: new Date(Date.now() - 1000 * 3600 * 4).toISOString(),
    read: false,
  },
  {
    id: "6",
    category: "CAPA",
    title: "CAPA Escalation",
    message: "Corrective action for Site D electrical fault is now 48 hours overdue.",
    priority: "High",
    timestamp: new Date(Date.now() - 1000 * 3600 * 12).toISOString(),
    read: false,
  },
  {
    id: "7",
    category: "Audit",
    title: "Audit Reminder",
    message: "Quarterly Safety Audit for Site A scheduled for tomorrow at 09:00 AM.",
    priority: "Low",
    timestamp: new Date(Date.now() - 1000 * 3600 * 24).toISOString(),
    read: true,
  },
  {
    id: "8",
    category: "Compliance",
    title: "Compliance Violation",
    message: "Monthly emissions report for Refinement Center has not been submitted.",
    priority: "Medium",
    timestamp: new Date(Date.now() - 1000 * 3600 * 36).toISOString(),
    read: true,
  }
];

const CATEGORY_MAP: Record<Notification["category"], { icon: any, color: string, bg: string }> = {
  Emergency:  { icon: Siren, color: "#DC2626", bg: "#FEF2F2" },
  "AI Safety": { icon: Zap, color: "#7C3AED", bg: "#EDE9FE" },
  Permit:     { icon: FileText, color: "#2563EB", bg: "#EFF6FF" },
  Training:   { icon: GraduationCap, color: "#059669", bg: "#ECFDF5" },
  Incident:   { icon: AlertTriangle, color: "#EA580C", bg: "#FFF7ED" },
  CAPA:       { icon: ShieldAlert, color: "#B91C1C", bg: "#FEF2F2" },
  Audit:      { icon: ClipboardCheck, color: "#4F46E5", bg: "#EEF2FF" },
  Compliance: { icon: CheckCircle2, color: "#10B981", bg: "#ECFDF5" },
};

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("All");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || 
                          n.message.toLowerCase().includes(search.toLowerCase());
      const matchesPriority = filterPriority === "All" || n.priority === filterPriority;
      const matchesCategory = activeCategory === "All" || n.category === activeCategory;
      return matchesSearch && matchesPriority && matchesCategory;
    });
  }, [notifications, search, filterPriority, activeCategory]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            Notification Center
            {unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full animate-pulse">
                {unreadCount} NEW
              </span>
            )}
          </h1>
          <p className="text-sm mt-1 text-gray-500">Centralized alerts for HSE operations and compliance</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-[13px] font-bold text-gray-600 hover:bg-gray-50 transition-all"
          >
            <MailOpen className="w-4 h-4" />
            Mark all read
          </button>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="bg-white rounded-2xl border p-4 shadow-sm border-gray-100 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search notifications, alerts, or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
            />
          </div>
          
          {/* Priority Filters */}
          <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100 self-start">
            {["All", "High", "Medium", "Low"].map(p => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all ${filterPriority === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {["All", ...Object.keys(CATEGORY_MAP)].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition-all border ${activeCategory === cat ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Notifications List ── */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-20 text-center text-gray-400">
             <Bell className="w-12 h-12 mx-auto mb-3 opacity-10" />
             <p className="font-bold">No notifications found matching your filters</p>
          </div>
        ) : filteredNotifications.map((notif) => {
          const config = CATEGORY_MAP[notif.category];
          const Icon = config.icon;
          
          return (
            <div 
              key={notif.id}
              onClick={() => !notif.read && markAsRead(notif.id)}
              className={`group relative bg-white rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md cursor-pointer ${notif.read ? 'border-gray-100 opacity-80' : 'border-indigo-100 ring-1 ring-indigo-50 shadow-indigo-100/20'}`}
            >
              {!notif.read && (
                <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-1.5 h-10 bg-indigo-500 rounded-r-full" />
              )}
              
              <div className="flex gap-4">
                {/* Category Icon */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: config.bg }}>
                   <Icon className="w-6 h-6" style={{ color: config.color }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: config.color }}>{notif.category}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${notif.priority === 'High' ? 'bg-rose-100 text-rose-600' : notif.priority === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                        {notif.priority}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap">
                       <Clock className="w-3 h-3 inline mr-1" />
                       {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <h3 className={`text-[15px] font-bold leading-tight mb-1 ${notif.read ? 'text-gray-600' : 'text-gray-900'}`}>{notif.title}</h3>
                  <p className="text-[13px] text-gray-500 leading-snug">{notif.message}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                    className="p-2 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                    className="p-2 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-500 transition-colors"
                    disabled={notif.read}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* History Status */}
      {filteredNotifications.length > 0 && (
        <div className="text-center py-4">
          <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Showing last {filteredNotifications.length} alerts</p>
        </div>
      )}
    </div>
  );
}
