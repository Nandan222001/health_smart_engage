import { useState, useRef } from "react";
import {
  Ticket, Plus, Paperclip, MessageSquare, 
  Clock, CheckCircle2, AlertTriangle, 
  ChevronRight, Search, FileText, X,
  ArrowUpRight, LifeBuoy, Filter, 
  History, ShieldAlert, Send, Upload,
  MoreVertical, Info
} from "lucide-react";

type TabId = "new" | "active" | "history" | "escalations";

const TABS = [
  { id: "active",      label: "Active Tickets",   icon: Ticket,         color: "#1D4ED8" },
  { id: "new",         label: "Raise New Ticket", icon: Plus,           color: "#059669" },
  { id: "history",     label: "Ticket History",   icon: History,        color: "#6B7280" },
  { id: "escalations", label: "Escalations",      icon: ShieldAlert,    color: "#DC2626" },
] as const;

// ── Types ───────────────────────────────────────────────────────────────────

interface SupportTicket {
  id: string;
  title: string;
  category: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "In Progress" | "Waiting on User" | "Resolved" | "Closed" | "Escalated";
  created: string;
  lastUpdate: string;
  attachments?: string[];
  description: string;
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_TICKETS: SupportTicket[] = [
  {
    id: "HSE-92831",
    title: "Issue with API Authentication in Prod",
    category: "Technical Support",
    priority: "High",
    status: "In Progress",
    created: "2026-05-28T10:00:00Z",
    lastUpdate: "2 hours ago",
    description: "The production API is returning 401 Unauthorized for valid keys.",
    attachments: ["debug_logs.txt"]
  },
  {
    id: "HSE-92754",
    title: "New Site Setup Wizard Stuck at Step 4",
    category: "Platform Usage",
    priority: "Medium",
    status: "Waiting on User",
    created: "2026-05-27T14:30:00Z",
    lastUpdate: "1 day ago",
    description: "The site coordinates are not being saved. Need verification.",
  },
  {
    id: "HSE-92612",
    title: "Request for Custom Report Export",
    category: "Feature Request",
    priority: "Low",
    status: "Resolved",
    created: "2026-05-25T09:15:00Z",
    lastUpdate: "3 days ago",
    description: "Need an export of the last 6 months of permit data in CSV.",
  },
  {
    id: "HSE-92901",
    title: "Critical Security Vulnerability Report",
    category: "Security",
    priority: "Critical",
    status: "Escalated",
    created: "2026-05-29T08:00:00Z",
    lastUpdate: "15 mins ago",
    description: "Potential IDOR vulnerability found in document access module.",
  }
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SupportTicket["status"] }) {
  const meta = {
    "Open":            { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
    "In Progress":     { bg: "#F0FDF4", text: "#16A34A", dot: "#22C55E" },
    "Waiting on User": { bg: "#FFFBEB", text: "#D97706", dot: "#F59E0B" },
    "Resolved":        { bg: "#F8FAFC", text: "#475569", dot: "#64748B" },
    "Closed":          { bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
    "Escalated":       { bg: "#FEF2F2", text: "#DC2626", dot: "#EF4444" },
  }[status];

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ background: meta.bg, color: meta.text }}>
      <span className="w-1 h-1 rounded-full" style={{ background: meta.dot }} />
      {status}
    </span>
  );
}

function PriorityPill({ priority }: { priority: SupportTicket["priority"] }) {
  const color = {
    Low:      "#64748B",
    Medium:   "#D97706",
    High:     "#EA580C",
    Critical: "#DC2626",
  }[priority];

  return (
    <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color }}>{priority}</span>
  );
}

// ── Components ───────────────────────────────────────────────────────────────

function NewTicketForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setTimeout(() => {
      setFiles(prev => [...prev, file.name]);
      setIsUploading(false);
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Ticket Title</label>
          <input className="w-full px-4 py-3 rounded-2xl border outline-none text-sm font-medium" 
            style={{ borderColor: "#E3E9F6" }} placeholder="Brief summary of the issue" />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Issue Category</label>
          <select className="w-full px-4 py-3 rounded-2xl border outline-none text-sm bg-white font-medium" style={{ borderColor: "#E3E9F6" }}>
            <option>Technical Support</option>
            <option>Platform Usage</option>
            <option>Account & Billing</option>
            <option>Feature Request</option>
            <option>Security Report</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Priority Level</label>
          <div className="grid grid-cols-4 gap-2">
            {["Low", "Medium", "High", "Critical"].map(p => (
              <button key={p} className="py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all"
                style={{ borderColor: "#E3E9F6", background: "white" }}>{p}</button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Related Module</label>
          <select className="w-full px-4 py-3 rounded-2xl border outline-none text-sm bg-white font-medium" style={{ borderColor: "#E3E9F6" }}>
            <option>Organisation Admin</option>
            <option>Sites & Zones</option>
            <option>AI Intelligence</option>
            <option>Permit System</option>
            <option>Reports & Analytics</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Description</label>
        <textarea className="w-full px-4 py-4 rounded-2xl border outline-none text-sm resize-none font-medium" 
          rows={5} style={{ borderColor: "#E3E9F6" }} placeholder="Describe the issue in detail..." />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Attachments</label>
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
          style={{ borderColor: "#E3E9F6" }}>
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Uploading...</span>
            </div>
          ) : (
            <>
              <Upload size={32} className="text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-500">Drop files here or click to browse</p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">Max size 10MB • Support: JPG, PNG, PDF, LOG, CSV</p>
            </>
          )}
          <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
        </div>
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-bold text-blue-600">
                <Paperclip size={12} /> {f}
                <button onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter((_, idx) => idx !== i)); }}><X size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={onSubmitted}
        className="w-full py-4 rounded-2xl text-white font-extrabold text-sm shadow-xl shadow-blue-200 mt-4"
        style={{ background: "linear-gradient(135deg, #1E3A5F, #1D4ED8)" }}>
        Raise Support Ticket
      </button>
    </div>
  );
}

function TicketList({ tickets, onEscalate }: { tickets: SupportTicket[], onEscalate: (id: string) => void }) {
  return (
    <div className="grid gap-3">
      {tickets.map(ticket => (
        <div key={ticket.id} className="bg-white rounded-2xl border p-5 flex items-center justify-between hover:shadow-md transition-all group" style={{ borderColor: "#E3E9F6" }}>
          <div className="flex gap-5 min-w-0">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#F8FAFC" }}>
              <MessageSquare size={22} className="text-slate-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{ticket.id}</p>
                <StatusBadge status={ticket.status} />
                <PriorityPill priority={ticket.priority} />
              </div>
              <h4 className="text-[15px] font-bold text-slate-800 mt-1 truncate">{ticket.title}</h4>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5"><Clock size={12} /> Created {new Date(ticket.created).toLocaleDateString()}</span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5"><Info size={12} /> {ticket.category}</span>
                {ticket.attachments && (
                  <span className="text-[11px] text-blue-500 font-bold flex items-center gap-1.5"><Paperclip size={12} /> {ticket.attachments.length} Attachment</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {ticket.status !== "Escalated" && ticket.status !== "Resolved" && ticket.status !== "Closed" && (
              <button 
                onClick={() => onEscalate(ticket.id)}
                className="px-4 py-2 rounded-xl text-[11px] font-bold text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100">
                Escalate Issue
              </button>
            )}
            <button className="p-2.5 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function SupportTicketsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("active");
  const [search, setSearch] = useState("");
  const [tickets, setTickets] = useState(MOCK_TICKETS);
  const [submitted, setSubmitted] = useState(false);

  const activeTabMeta = TABS.find(t => t.id === activeTab)!;

  const handleEscalate = (id: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: "Escalated", priority: "Critical" } : t));
  };

  const filteredTickets = tickets.filter(t => {
    if (activeTab === "active") return t.status !== "Resolved" && t.status !== "Closed";
    if (activeTab === "history") return t.status === "Resolved" || t.status === "Closed";
    if (activeTab === "escalations") return t.status === "Escalated";
    return true;
  }).filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>

      {/* ── Banner ── */}
      <div className="relative overflow-hidden px-6 pt-10 pb-16"
        style={{ background: "linear-gradient(135deg, #0C1A3D 0%, #1A2F6B 50%, #0F172A 100%)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 15% 50%, #4A57B9 0%, transparent 50%), radial-gradient(circle at 85% 20%, #60A5FA 0%, transparent 40%)" }} />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <LifeBuoy size={20} className="text-blue-300" />
              <span className="text-blue-200 text-xs font-bold tracking-widest uppercase">Support System</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Support Tickets</h1>
            <p className="text-blue-200/80 text-sm mt-2 max-w-xl">Raise technical queries, report platform issues, and track your requests with our executive support team.</p>
          </div>
          <div className="flex items-center gap-3">
            {[
              { label: "Open",      value: tickets.filter(t => t.status === "Open").length },
              { label: "Active",    value: tickets.filter(t => t.status === "In Progress" || t.status === "Waiting on User").length },
              { label: "Escalated", value: tickets.filter(t => t.status === "Escalated").length, color: "#EF4444" },
            ].map(s => (
              <div key={s.label} className="px-4 py-3 rounded-2xl text-center min-w-[90px]"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div className="text-lg font-extrabold text-white" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] text-blue-300/80 mt-0.5 uppercase tracking-widest font-bold">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-6 flex gap-6">
        
        {/* Sidebar */}
        <div className="w-60 flex-shrink-0">
          <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: "#E3E9F6", background: "white" }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Management</p>
            </div>
            <nav className="p-2 space-y-0.5">
              {TABS.map(tab => {
                const active = activeTab === tab.id;
                const Icon   = tab.icon;
                return (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSubmitted(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all"
                    style={active ? {
                      background: `${tab.color}12`, color: tab.color,
                      fontWeight: 700, border: `1px solid ${tab.color}25`,
                    } : {
                      color: "#4B5563", fontWeight: 500,
                      background: "transparent", border: "1px solid transparent",
                    }}>
                    <Icon size={16} style={{ color: active ? tab.color : "#9CA3AF", flexShrink: 0 }} />
                    <span className="flex-1">{tab.label}</span>
                    {active && <ChevronRight size={12} style={{ color: tab.color }} />}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-4 p-5 rounded-2xl bg-white border shadow-sm" style={{ borderColor: "#E3E9F6" }}>
            <div className="flex items-center gap-2 mb-3">
              <Send size={14} className="text-blue-500" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Contact</p>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">Average response time for Org Admins is <strong>under 2 hours</strong>.</p>
            <div className="mt-4 space-y-2">
              <button className="w-full py-2 rounded-xl bg-slate-50 border text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors uppercase tracking-widest">Email Support</button>
              <button className="w-full py-2 rounded-xl bg-slate-50 border text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors uppercase tracking-widest">Call HSE Help</button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border bg-white p-6 shadow-sm min-h-[600px]" style={{ borderColor: "#E3E9F6" }}>
            <div className="flex items-center justify-between gap-3 pb-5 mb-5 border-b" style={{ borderColor: "#F1F5F9" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${activeTabMeta.color}12`, border: `1px solid ${activeTabMeta.color}20` }}>
                  <activeTabMeta.icon size={20} style={{ color: activeTabMeta.color }} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">{activeTabMeta.label}</h2>
                  <p className="text-xs text-slate-400">
                    {activeTab === "active"      && "Track and manage your currently open support requests."}
                    {activeTab === "new"         && "Create a new support request for our expert technical team."}
                    {activeTab === "history"     && "Review resolved and closed support cases from your organisation."}
                    {activeTab === "escalations" && "View high-priority issues that have been escalated to senior management."}
                  </p>
                </div>
              </div>
              {activeTab !== "new" && (
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input className="w-full pl-9 pr-4 py-2 rounded-xl border text-xs outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                    style={{ borderColor: "#E3E9F6" }} placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              )}
            </div>

            {submitted && activeTab === "new" ? (
              <div className="py-20 text-center space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={40} className="text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Ticket Submitted Successfully!</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  Your ticket ID is <strong>#HSE-{Math.floor(Math.random() * 90000) + 10000}</strong>. 
                  Our support engineers have been notified and will respond via email and dashboard notification.
                </p>
                <div className="pt-8 flex items-center justify-center gap-3">
                  <button onClick={() => { setActiveTab("active"); setSubmitted(false); }} className="px-6 py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm shadow-xl shadow-slate-200">View Active Tickets</button>
                  <button onClick={() => setSubmitted(false)} className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">Raise Another</button>
                </div>
              </div>
            ) : (
              <>
                {activeTab === "new"         && <NewTicketForm onSubmitted={() => setSubmitted(true)} />}
                {activeTab === "active"      && <TicketList tickets={filteredTickets} onEscalate={handleEscalate} />}
                {activeTab === "history"     && <TicketList tickets={filteredTickets} onEscalate={handleEscalate} />}
                {activeTab === "escalations" && <TicketList tickets={filteredTickets} onEscalate={handleEscalate} />}
              </>
            )}

            {filteredTickets.length === 0 && activeTab !== "new" && !submitted && (
              <div className="py-20 text-center text-slate-400">
                <Search size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-xs font-medium">No tickets found matching your current filters.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
