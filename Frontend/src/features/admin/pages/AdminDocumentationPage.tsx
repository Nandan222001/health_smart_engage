import { useState } from "react";
import {
  BookOpen, FileText, Code2, ShieldCheck, 
  Search, Download, ExternalLink, ChevronRight,
  BookMarked, ScrollText, ClipboardList, Info,
  Zap, LifeBuoy, Monitor, Layout, Library,
  ArrowUpRight, Share2, Globe, FileCheck,
  CheckCircle2, Clock, AlertCircle
} from "lucide-react";

type TabId = "sop" | "api" | "manuals" | "compliance" | "library";

const TABS = [
  { id: "sop",        label: "SOP Documentation",  icon: ClipboardList, color: "#0E7490" },
  { id: "api",        label: "API Documentation",  icon: Code2,         color: "#1D4ED8" },
  { id: "manuals",    label: "User Manuals",       icon: BookOpen,      color: "#059669" },
  { id: "compliance", label: "Compliance Guides",  icon: ShieldCheck,   color: "#6D28D9" },
  { id: "library",    label: "Resource Library",   icon: Library,       color: "#F59E0B" },
] as const;

// ── Data ────────────────────────────────────────────────────────────────────

const SOP_DOCS = [
  { id: "sop1", title: "Incident Reporting Procedure", version: "2.4", updated: "2026-05-15", size: "1.2 MB", type: "PDF", status: "Active" },
  { id: "sop2", title: "Hot Work Permit Protocol", version: "1.8", updated: "2026-04-20", size: "850 KB", type: "PDF", status: "Active" },
  { id: "sop3", title: "Confined Space Entry SOP", version: "3.1", updated: "2026-05-02", size: "2.1 MB", type: "DOCX", status: "Review" },
  { id: "sop4", title: "Emergency Evacuation Plan", version: "5.0", updated: "2026-01-10", size: "4.5 MB", type: "PDF", status: "Active" },
];

const API_DOCS = [
  { id: "api1", title: "Core REST API Reference", desc: "Complete endpoint documentation for data integration.", icon: Globe },
  { id: "api2", title: "Webhook Events Guide", desc: "Payload structures and retry logic for real-time alerts.", icon: Zap },
  { id: "api3", title: "Authentication Flow (OAuth2)", desc: "Securely connecting external applications via tokens.", icon: ShieldCheck },
  { id: "api4", title: "SDK & Libraries", desc: "Python, Node.js and Go client libraries for HSE.", icon: Code2 },
];

const USER_MANUALS = [
  { id: "man1", title: "Admin Portal Guide", pages: 120, views: "2.4k", updated: "2 weeks ago", color: "#4A57B9" },
  { id: "man2", title: "Mobile App Handbook", pages: 45, views: "5.1k", updated: "1 month ago", color: "#10B981" },
  { id: "man3", title: "Auditor Training Module", pages: 32, views: "850", updated: "3 days ago", color: "#F59E0B" },
];

const COMPLIANCE_GUIDES = [
  { id: "comp1", title: "ISO 45001 Readiness Kit", desc: "Occupational health and safety management standards.", color: "#DC2626" },
  { id: "comp2", title: "GDPR Data Privacy Policy", desc: "Platform compliance with global data protection rules.", color: "#2563EB" },
  { id: "comp3", title: "OSHA Reporting Standards", desc: "Guidelines for mandatory incident and injury logging.", color: "#D97706" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const meta = {
    Active: { bg: "#DCFCE7", text: "#16A34A" },
    Review: { bg: "#DBEAFE", text: "#1E40AF" },
    Draft:  { bg: "#F3F4F6", text: "#6B7280" },
  }[status] || { bg: "#F3F4F6", text: "#6B7280" };

  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ background: meta.bg, color: meta.text }}>{status}</span>
  );
}

// ── Sections ─────────────────────────────────────────────────────────────────

function SOPSection() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {SOP_DOCS.map(doc => (
          <div key={doc.id} className="bg-white rounded-2xl border p-4 flex items-center justify-between hover:border-blue-200 transition-colors" style={{ borderColor: "#E3E9F6" }}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <FileText size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-800">{doc.title}</h4>
                  <StatusBadge status={doc.status} />
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                  <span className="font-mono">v{doc.version}</span>
                  <span>•</span>
                  <span>Updated {doc.updated}</span>
                  <span>•</span>
                  <span>{doc.size}</span>
                </div>
              </div>
            </div>
            <button className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors">
              <Download size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function APISection() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {API_DOCS.map(doc => (
        <div key={doc.id} className="bg-white rounded-2xl border p-5 flex gap-4 hover:shadow-md transition-all group" style={{ borderColor: "#E3E9F6" }}>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <doc.icon size={22} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-[15px] font-bold text-slate-800">{doc.title}</h4>
            <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">{doc.desc}</p>
            <button className="flex items-center gap-1.5 mt-4 text-[11px] font-bold text-blue-600 uppercase tracking-wider">
              Open Docs <ExternalLink size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ManualsSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {USER_MANUALS.map(man => (
        <div key={man.id} className="bg-white rounded-3xl border p-6 flex flex-col items-center text-center group hover:shadow-lg transition-all" style={{ borderColor: "#E3E9F6" }}>
          <div className="w-16 h-20 bg-slate-100 rounded-lg relative mb-4 shadow-sm group-hover:rotate-3 transition-transform overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full" style={{ background: man.color }} />
            <div className="p-2 pt-6">
              <div className="w-full h-1 bg-slate-200 rounded-full mb-1" />
              <div className="w-3/4 h-1 bg-slate-200 rounded-full mb-1" />
              <div className="w-1/2 h-1 bg-slate-200 rounded-full" />
            </div>
            <div className="absolute bottom-2 right-2">
              <BookOpen size={16} className="text-slate-300" />
            </div>
          </div>
          <h4 className="text-[15px] font-bold text-slate-800">{man.title}</h4>
          <div className="mt-2 flex flex-col gap-1 text-[11px] text-slate-400">
            <span>{man.pages} Pages • {man.views} Views</span>
            <span>Updated {man.updated}</span>
          </div>
          <button className="w-full mt-6 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            Read Manual
          </button>
        </div>
      ))}
    </div>
  );
}

function ComplianceSection() {
  return (
    <div className="space-y-4">
      {COMPLIANCE_GUIDES.map(guide => (
        <div key={guide.id} className="bg-white rounded-2xl border p-5 flex items-start gap-5 hover:border-purple-200 transition-colors" style={{ borderColor: "#E3E9F6" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: guide.color + "12" }}>
            <ShieldCheck size={24} style={{ color: guide.color }} />
          </div>
          <div className="flex-1">
            <h4 className="text-base font-bold text-slate-800">{guide.title}</h4>
            <p className="text-sm text-slate-500 mt-1">{guide.desc}</p>
          </div>
          <button className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-lg shadow-slate-200">
            View Guide
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function AdminDocumentationPage() {
  const [activeTab, setActiveTab] = useState<TabId>("sop");
  const [search, setSearch] = useState("");

  const activeTabMeta = TABS.find(t => t.id === activeTab)!;

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
              <BookMarked size={20} className="text-blue-300" />
              <span className="text-blue-200 text-xs font-bold tracking-widest uppercase">Knowledge Centre</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Documentation Hub</h1>
            <p className="text-blue-200/80 text-sm mt-2 max-w-xl">Access standard procedures, technical references, and administrative manuals for the HSE Intelligence platform.</p>
          </div>
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-none text-sm outline-none shadow-2xl"
              style={{ background: "rgba(255,255,255,1)", color: "#111827" }}
              placeholder="Search documents, guides, and SOPs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="px-6 py-6 flex gap-6">
        
        {/* Sidebar */}
        <div className="w-60 flex-shrink-0">
          <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: "#E3E9F6", background: "white" }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Categories</p>
            </div>
            <nav className="p-2 space-y-0.5">
              {TABS.map(tab => {
                const active = activeTab === tab.id;
                const Icon   = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
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

          <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-xl">
            <LifeBuoy size={24} className="text-blue-400 mb-3" />
            <h4 className="text-sm font-bold">Need Help?</h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Can't find a specific document? Our support team can assist you.</p>
            <button className="w-full mt-4 py-2 rounded-xl bg-blue-600 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500 transition-colors">
              Contact Support
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border bg-white p-6 shadow-sm min-h-[600px]" style={{ borderColor: "#E3E9F6" }}>
            <div className="flex items-center gap-3 pb-5 mb-5 border-b" style={{ borderColor: "#F1F5F9" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${activeTabMeta.color}12`, border: `1px solid ${activeTabMeta.color}20` }}>
                <activeTabMeta.icon size={20} style={{ color: activeTabMeta.color }} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">{activeTabMeta.label}</h2>
                <p className="text-xs text-slate-400">
                  {activeTab === "sop"        && "Standard procedures for operational safety and platform governance."}
                  {activeTab === "api"        && "Developer resources for integrating HSE with external systems."}
                  {activeTab === "manuals"    && "Step-by-step guides for all platform modules and user roles."}
                  {activeTab === "compliance" && "Regulatory compliance kits and industrial safety standards."}
                  {activeTab === "library"    && "A repository of all shared organizational resources and assets."}
                </p>
              </div>
            </div>

            {activeTab === "sop"        && <SOPSection />}
            {activeTab === "api"        && <APISection />}
            {activeTab === "manuals"    && <ManualsSection />}
            {activeTab === "compliance" && <ComplianceSection />}
            {activeTab === "library"    && (
              <div className="py-20 text-center text-slate-400">
                <Library size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-xs font-medium">Resources are being synchronized with the document server...</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
