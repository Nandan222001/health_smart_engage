import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import {
  Search,
  BookOpen,
  Code2,
  ShieldCheck,
  FileText,
  PlayCircle,
  Mail,
  Phone,
  MessageCircle,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Ticket,
  HelpCircle,
  Video,
  Monitor,
  Layout,
  LifeBuoy,
  BookMarked,
  ArrowUpRight,
  Zap,
  X,
  Info,
  Database
} from "lucide-react";

type TabId = "Help Center" | "Training Guides" | "Tutorials" | "Walkthroughs" | "FAQs" | "Support";

const TABS: TabId[] = ["Help Center", "Training Guides", "Tutorials", "Walkthroughs", "FAQs", "Support"];

// Map sidebar paths/tabs to page tabs
const TAB_MAP: Record<string, TabId> = {
  "docs": "Training Guides",
  "ticket": "Support",
  "contact": "Support"
};

// ── FAQs ────────────────────────────────────────────────────────────────────

const FAQ_CARDS = [
  {
    category: "Onboarding",
    title: "How do I set up my organisation?",
    description: "Follow our 7-step wizard to configure your branding, sites, and initial user roles.",
  },
  {
    category: "Users",
    title: "How to manage role permissions?",
    description: "Navigate to Security Settings > Role Permissions to define granular access levels for your team.",
  },
  {
    category: "Safety",
    title: "How to approve a hot work permit?",
    description: "All pending permits appear in the Permit Queue. Review the risk assessment and click 'Approve'.",
  },
  {
    category: "AI",
    title: "How does the AI risk score work?",
    description: "Our HSE engine analyzes historical data, weather, and active permits to calculate real-time risk scores.",
  },
  {
    category: "Integrations",
    title: "Can I sync with my existing HRMS?",
    description: "Yes, use the API Settings to connect with Workday, BambooHR, or custom ERP systems.",
  },
  {
    category: "Billing",
    title: "Where can I find my invoices?",
    description: "Administrators can access the Billing & Subscription module from the primary navigation.",
  },
];

// ── Training Guides ──────────────────────────────────────────────────────────

const GUIDES = [
  { title: "Admin Governance Handbook", pages: "42 Pages", format: "PDF", size: "4.2 MB", icon: ShieldCheck, color: "#4A57B9" },
  { title: "Site Manager Training Manual", pages: "28 Pages", format: "PDF", size: "2.8 MB", icon: BookOpen, color: "#10B981" },
  { title: "Standard Operating Procedures (SOP)", pages: "15 Pages", format: "DOCX", size: "1.1 MB", icon: FileText, color: "#F59E0B" },
  { title: "Compliance Checklist Guide", pages: "12 Pages", format: "PDF", size: "1.5 MB", icon: BookMarked, color: "#EF4444" },
];

// ── Tutorials ───────────────────────────────────────────────────────────────

const TUTORIALS = [
  { title: "Introduction to HSE Platform", duration: "5:30", level: "Beginner", views: "1.2k", icon: PlayCircle, color: "#4A57B9" },
  { title: "Configuring Notification Workflows", duration: "8:45", level: "Advanced", views: "850", icon: Video, color: "#10B981" },
  { title: "Mastering the AI Insights Dashboard", duration: "12:20", level: "Intermediate", views: "2.1k", icon: Zap, color: "#7C3AED" },
  { title: "Advanced Audit Management", duration: "10:15", level: "Expert", views: "430", icon: ShieldCheck, color: "#DC2626" },
];

// ── Walkthroughs ───────────────────────────────────────────────────────────

const WALKTHROUGHS = [
  { title: "Organisational Setup", steps: "7 Steps", status: "Recommended", icon: Layout, color: "#4A57B9" },
  { title: "First Incident Report", steps: "4 Steps", status: "Guided", icon: AlertCircle, color: "#EF4444" },
  { title: "Setting Up API Access", steps: "5 Steps", status: "Technical", icon: Code2, color: "#10B981" },
  { title: "Defining Approval Matrices", steps: "6 Steps", status: "Advanced", icon: Monitor, color: "#F59E0B" },
];

// ── Support ─────────────────────────────────────────────────────────────────

const CONTACT_CARDS = [
  { title: "Email Support", detail: "support@hse.com", icon: Mail, color: "#4A57B9", action: "Send Email" },
  { title: "Phone", detail: "+1 800 HSE HELP", icon: Phone, color: "#10B981", action: "Call Now" },
  { title: "Live Chat", detail: "Available 9am – 6pm GMT", icon: MessageCircle, color: "#F59E0B", action: "Start Chat" },
  { title: "Knowledge Base", detail: "Search 500+ articles", icon: BookOpen, color: "#6B7280", action: "Open Wiki" },
];

// ── Main Page ───────────────────────────────────────────────────────────────

export function HelpPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>("Help Center");
  const [helpSearch, setHelpSearch] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && TAB_MAP[tabParam]) {
      setActiveTab(TAB_MAP[tabParam]);
    }
  }, [searchParams]);

  const handleTabChange = (id: TabId) => {
    setActiveTab(id);
    // Find the param key if it exists in TAB_MAP
    const param = Object.keys(TAB_MAP).find(key => TAB_MAP[key] === id);
    if (param) setSearchParams({ tab: param });
    else setSearchParams({});
  };

  const filteredFaqs = FAQ_CARDS.filter(
    (faq) =>
      helpSearch.trim() === "" ||
      faq.title.toLowerCase().includes(helpSearch.toLowerCase()) ||
      faq.description.toLowerCase().includes(helpSearch.toLowerCase()),
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
              <span className="text-blue-200 text-xs font-bold tracking-widest uppercase">Support Center</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">How can we help you today?</h1>
            <p className="text-blue-200/80 text-sm mt-2 max-w-xl">Search our extensive library of guides, tutorials, and walkthroughs to get the most out of the HSE Intelligence platform.</p>
          </div>
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-none text-sm outline-none shadow-2xl"
              style={{ background: "rgba(255,255,255,1)", color: "#111827" }}
              placeholder="Search help articles, guides, and more..."
              value={helpSearch}
              onChange={(e) => setHelpSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="px-6 -mt-8 relative z-10">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white rounded-2xl border p-1.5 shadow-2xl w-fit flex-wrap" style={{ borderColor: "#E3E9F6" }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={
                activeTab === tab
                  ? { background: "linear-gradient(135deg, #4A57B9, #6F80E8)", color: "#fff", boxShadow: "0 4px 12px rgba(74,87,185,0.2)" }
                  : { color: "#64748B" }
              }
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="py-8">
          
          {/* ── Help Center (Overview) ── */}
          {activeTab === "Help Center" && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: "Video Tutorials", desc: "Watch walkthroughs", icon: PlayCircle, tab: "Tutorials", color: "#10B981" },
                  { title: "Support Tickets", desc: "Track your requests", icon: Ticket, path: "/admin/support-tickets", color: "#DC2626" },
                  { title: "Live System Tour", desc: "Guided tour", icon: Monitor, tab: "Walkthroughs", color: "#F59E0B" },
                ].map(card => (
                  <button key={card.title} onClick={() => card.path ? navigate(card.path) : setActiveTab(card.tab as TabId)}
                    className="bg-white rounded-3xl border p-6 text-left hover:shadow-xl transition-all group" style={{ borderColor: "#E3E9F6" }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                      style={{ background: card.color + "12" }}>
                      <card.icon size={24} style={{ color: card.color }} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">{card.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{card.desc}</p>
                    <div className="flex items-center gap-2 mt-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: card.color }}>
                      Explore <ChevronRight size={14} />
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <ArrowUpRight size={20} className="text-blue-500" />
                  Featured FAQs
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FAQ_CARDS.slice(0, 4).map((faq) => (
                    <div key={faq.title} className="bg-white rounded-2xl border p-5 space-y-2 hover:border-blue-200 transition-colors" style={{ borderColor: "#E3E9F6" }}>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">{faq.category}</span>
                      <h3 className="text-[15px] font-bold text-slate-800">{faq.title}</h3>
                      <p className="text-sm leading-relaxed text-slate-500">{faq.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Training Guides ── */}
          {activeTab === "Training Guides" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GUIDES.map((doc) => {
                const Icon = doc.icon;
                return (
                  <div key={doc.title} className="bg-white rounded-2xl border p-5 flex items-center gap-4 hover:shadow-md transition-shadow" style={{ borderColor: "#E3E9F6" }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: doc.color + "12" }}>
                      <Icon size={24} style={{ color: doc.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-bold text-slate-800">{doc.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-400 flex items-center gap-1"><FileText size={12} /> {doc.pages}</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1"><Database size={12} /> {doc.size}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500 uppercase">{doc.format}</span>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold transition-all hover:scale-105"
                      style={{ background: "linear-gradient(135deg, #1E3A5F, #1D4ED8)" }}>
                      Download <ArrowUpRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Tutorials ── */}
          {activeTab === "Tutorials" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {TUTORIALS.map((vid) => (
                <div key={vid.title} className="bg-white rounded-3xl border overflow-hidden hover:shadow-xl transition-all group" style={{ borderColor: "#E3E9F6" }}>
                  <div className="aspect-video relative overflow-hidden" style={{ background: vid.color + "12" }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PlayCircle size={48} style={{ color: vid.color }} className="opacity-50 group-hover:scale-110 group-hover:opacity-100 transition-all cursor-pointer" />
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-white text-[10px] font-bold">
                      {vid.duration}
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500">{vid.level}</span>
                      <span className="text-[10px] font-bold text-slate-400">{vid.views} views</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 leading-snug h-10 overflow-hidden">{vid.title}</h3>
                    <button className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                      Watch Video
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Walkthroughs ── */}
          {activeTab === "Walkthroughs" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {WALKTHROUGHS.map((wt) => (
                <div key={wt.title} className="bg-white rounded-3xl border p-6 flex items-start gap-5 hover:shadow-md transition-shadow" style={{ borderColor: "#E3E9F6" }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: wt.color + "12" }}>
                    <wt.icon size={28} style={{ color: wt.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-slate-800">{wt.title}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        style={{ background: wt.color + "12", color: wt.color }}>{wt.status}</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">Complete this interactive guide to master the {wt.title.toLowerCase()} process.</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Layout size={14} /> {wt.steps}</span>
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5"><ChevronRight size={14} /> Available</span>
                      </div>
                      <button className="px-5 py-2 rounded-xl text-white text-xs font-bold"
                        style={{ background: "linear-gradient(135deg, #1E3A5F, #1D4ED8)" }}>
                        Start Tour
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── FAQs ── */}
          {activeTab === "FAQs" && (
            <div className="max-w-4xl mx-auto space-y-4">
              {filteredFaqs.map((faq, idx) => (
                <div key={faq.title} className="bg-white rounded-2xl border p-6 hover:border-blue-200 transition-all cursor-pointer group" style={{ borderColor: "#E3E9F6" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      <span className="text-lg font-black text-blue-100 group-hover:text-blue-500 transition-colors">{(idx + 1).toString().padStart(2, '0')}</span>
                      <div>
                        <h3 className="text-[15px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{faq.title}</h3>
                        <p className="text-sm text-slate-500 mt-2 leading-relaxed">{faq.description}</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Support ── */}
          {activeTab === "Support" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {CONTACT_CARDS.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.title} className="bg-white rounded-3xl border p-6 space-y-4 hover:shadow-lg transition-all" style={{ borderColor: "#E3E9F6" }}>
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: card.color + "12" }}>
                        <Icon size={24} style={{ color: card.color }} />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-slate-800">{card.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">{card.detail}</p>
                      </div>
                      <button className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                        {card.action}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white rounded-3xl border p-8 max-w-3xl mx-auto shadow-sm" style={{ borderColor: "#E3E9F6" }}>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 border border-blue-100">
                    <Ticket size={28} className="text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Submit a Request</h2>
                    <p className="text-sm text-slate-500">Can't find what you're looking for? Open a ticket and we'll get back to you.</p>
                  </div>
                </div>

                {submitted ? (
                  <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in duration-500">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                      <ShieldCheck size={32} className="text-emerald-600" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800">Ticket Submitted!</h4>
                    <p className="text-sm text-slate-500">Your ticket ID is #HSE-92831. We'll contact you via email shortly.</p>
                    <button onClick={() => setSubmitted(false)} className="px-6 py-2 rounded-xl bg-slate-800 text-white font-bold text-sm">Submit Another</button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                        <input className="w-full px-4 py-3 rounded-2xl border outline-none text-sm" style={{ borderColor: "#E3E9F6" }} placeholder="John Doe" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                        <input className="w-full px-4 py-3 rounded-2xl border outline-none text-sm" style={{ borderColor: "#E3E9F6" }} placeholder="john@company.com" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Issue Category</label>
                      <select className="w-full px-4 py-3 rounded-2xl border outline-none text-sm bg-white" style={{ borderColor: "#E3E9F6" }}>
                        <option>Technical Support</option>
                        <option>Account & Billing</option>
                        <option>Feature Request</option>
                        <option>Bug Report</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Message Description</label>
                      <textarea className="w-full px-4 py-3 rounded-2xl border outline-none text-sm resize-none" rows={4} style={{ borderColor: "#E3E9F6" }} placeholder="How can we help?" />
                    </div>
                    <button onClick={() => setSubmitted(true)}
                      className="w-full py-4 rounded-2xl text-white font-extrabold text-sm shadow-xl shadow-blue-200"
                      style={{ background: "linear-gradient(135deg, #1E3A5F, #1D4ED8)" }}>
                      Open Ticket
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
