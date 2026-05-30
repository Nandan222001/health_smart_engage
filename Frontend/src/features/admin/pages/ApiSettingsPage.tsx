import { useState, useMemo } from "react";
import {
  Plug, Plus, RefreshCw, Copy, Eye, EyeOff, Trash2,
  CheckCircle2, XCircle, AlertTriangle, Loader2,
  Zap, Clock, Key, Activity,
  ChevronDown, Search, Server, Users, Wifi, Shield,
  X, Globe, ShieldCheck, ChevronRight, Lock, 
  Terminal, Database, Link2, Share2, Code2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  useListApiIntegrationsQuery,
  useCreateApiIntegrationMutation,
  useUpdateApiIntegrationMutation,
  useDeleteApiIntegrationMutation,
  useGetSyncStatusQuery,
  useTriggerSyncMutation,
} from "@/features/data-management/api/dataManagementApi";
import type { ApiIntegration } from "@/features/data-management/api/dataManagementApi";

// ── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "keys",      label: "API Keys",       icon: Key,        color: "#1D4ED8" },
  { id: "webhooks",  label: "Webhooks",       icon: Globe,      color: "#059669" },
  { id: "tokens",    label: "Integration Tokens", icon: Lock,    color: "#7C3AED" },
  { id: "permissions",label: "API Access",    icon: ShieldCheck,color: "#DC2626" },
  { id: "activity",  label: "Activity Log",   icon: Activity,   color: "#0891B2" },
] as const;

type TabId = typeof TABS[number]["id"];

const WEBHOOK_EVENTS = [
  "incident.created", "incident.updated", "incident.closed",
  "audit.completed", "audit.finding.added",
  "compliance.violation", "compliance.resolved",
  "training.completed", "hazard.reported",
  "permit.issued", "permit.expired",
];

const API_PERMISSIONS = [
  { id: "read:all",      label: "Global Read",       desc: "Read access to all organisation data" },
  { id: "write:incidents",label: "Manage Incidents",  desc: "Create and update incident reports" },
  { id: "write:audits",   label: "Manage Audits",     desc: "Create and update audit findings" },
  { id: "write:employees",label: "Sync Employees",    desc: "Update employee and workforce records" },
  { id: "write:hazards",  label: "Manage Hazards",    desc: "Report and update hazard data" },
  { id: "admin",         label: "API Admin",         desc: "Full administrative access via API" },
];

const SEED_KEYS = [
  {
    id: "k1", name: "Production ERP Sync",
    key: "hse_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6", permissions: ["read:all", "write:employees"],
    created: "2026-05-10T10:00:00Z", lastUsed: "2026-05-29T14:20:00Z", status: "active",
  },
  {
    id: "k2", name: "Mobile App Integration",
    key: "hse_live_z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4", permissions: ["read:all", "write:incidents"],
    created: "2026-04-15T08:30:00Z", lastUsed: "2026-05-28T11:45:00Z", status: "active",
  },
];

const SEED_WEBHOOKS = [
  {
    id: "wh1", name: "Global Incident Alert",
    url: "https://hooks.company.com/v1/hse/incidents",
    events: ["incident.created", "incident.critical"],
    status: "active", lastDelivery: "2026-05-29T13:05:00Z", successRate: 99.2,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const meta = {
    active:   { text: "#16A34A", bg: "#DCFCE7", label: "Active" },
    warning:  { text: "#D97706", bg: "#FEF3C7", label: "Warning" },
    error:    { text: "#DC2626", bg: "#FEE2E2", label: "Error" },
    revoked:  { text: "#DC2626", bg: "#FEE2E2", label: "Revoked" },
    disabled: { text: "#6B7280", bg: "#F3F4F6", label: "Disabled" },
  }[status] || { text: "#6B7280", bg: "#F3F4F6", label: status };

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ color: meta.text, background: meta.bg }}>
      <span className="w-1 h-1 rounded-full" style={{ background: meta.text }} />
      {meta.label}
    </span>
  );
}

function maskKey(key: string): string {
  return key.slice(0, 8) + " •••• " + key.slice(-4);
}

function fmtDT(d?: string): string {
  if (!d) return "Never";
  return new Date(d).toLocaleString("en-GB", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

function KeysTab() {
  const [keys, setKeys] = useState(SEED_KEYS);
  const [modal, setModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPerms, setNewPerms] = useState<string[]>(["read:all"]);
  const [genKey, setGenKey] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const handleGenerate = () => {
    if (!newName) return;
    const k = `hse_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    setGenKey(k);
    setKeys(prev => [{ id: `k${Date.now()}`, name: newName, key: k, permissions: newPerms, created: new Date().toISOString(), status: "active" }, ...prev]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800">API Keys</h3>
          <p className="text-xs text-slate-500 mt-0.5">Manage authentication credentials for external software and automated scripts.</p>
        </div>
        <button onClick={() => { setModal(true); setGenKey(null); setNewName(""); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg shadow-blue-200"
          style={{ background: "linear-gradient(135deg, #1E3A5F, #1D4ED8)" }}>
          <Plus size={16} /> Generate Key
        </button>
      </div>

      <div className="grid gap-3">
        {keys.map(k => (
          <div key={k.id} className="bg-white rounded-2xl border p-4 hover:shadow-md transition-all group"
            style={{ borderColor: "#E3E9F6", opacity: k.status === "revoked" ? 0.6 : 1 }}>
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#EFF6FF" }}>
                  <Terminal size={18} style={{ color: "#1D4ED8" }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-800">{k.name}</p>
                    <StatusBadge status={k.status} />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                      {revealed.has(k.id) ? k.key : maskKey(k.key)}
                    </code>
                    <button onClick={() => setRevealed(p => { const n = new Set(p); n.has(k.id) ? n.delete(k.id) : n.add(k.id); return n; })}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400">
                      {revealed.has(k.id) ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(k.key); }} className="p-1 rounded hover:bg-slate-100 text-slate-400">
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Last Used</p>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">{fmtDT(k.lastUsed)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: "#F1F5F9" }}>
              <div className="flex gap-1.5">
                {k.permissions.map(p => (
                  <span key={p} className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 uppercase">{p}</span>
                ))}
              </div>
              {k.status === "active" && (
                <button onClick={() => setKeys(prev => prev.map(x => x.id === k.id ? { ...x, status: "revoked" } : x))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 size={12} /> Revoke Access
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border shadow-2xl w-full max-w-md mx-4 p-6" style={{ borderColor: "#E3E9F6" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">Generate New Key</h3>
              <button onClick={() => setModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X size={20} /></button>
            </div>
            {genKey ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <p className="text-xs text-emerald-700 font-semibold leading-relaxed">
                    Key generated successfully! Copy it now. For security, we won't show it to you again.
                  </p>
                </div>
                <div className="relative group">
                  <code className="block w-full p-4 rounded-2xl bg-slate-900 text-blue-300 text-xs break-all font-mono">
                    {genKey}
                  </code>
                  <button onClick={() => navigator.clipboard.writeText(genKey)}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                    <Copy size={14} />
                  </button>
                </div>
                <button onClick={() => setModal(false)}
                  className="w-full py-3 rounded-2xl bg-slate-800 text-white font-bold text-sm">
                  Close and Finish
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Key Name</label>
                  <input value={newName} onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. ERP Integration"
                    className="w-full px-4 py-3 rounded-2xl border outline-none text-sm font-medium focus:ring-2 focus:ring-blue-100 transition-all"
                    style={{ borderColor: "#E3E9F6" }} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Permissions</label>
                  <div className="grid grid-cols-2 gap-2">
                    {API_PERMISSIONS.slice(0, 4).map(p => (
                      <button key={p.id} onClick={() => setNewPerms(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[11px] font-bold text-left transition-all"
                        style={{ background: newPerms.includes(p.id) ? "#EFF6FF" : "white", borderColor: newPerms.includes(p.id) ? "#1D4ED8" : "#E3E9F6", color: newPerms.includes(p.id) ? "#1D4ED8" : "#64748B" }}>
                        {newPerms.includes(p.id) ? <CheckCircle2 size={12} /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleGenerate} disabled={!newName}
                  className="w-full py-3.5 rounded-2xl text-white font-extrabold text-sm shadow-xl shadow-blue-200 mt-2 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #1E3A5F, #1D4ED8)" }}>
                  Create API Key
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function WebhooksTab() {
  const [webhooks, setWebhooks] = useState(SEED_WEBHOOKS);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800">Outgoing Webhooks</h3>
          <p className="text-xs text-slate-500 mt-0.5">Automate downstream workflows by pushing real-time events to your custom endpoints.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg shadow-emerald-200"
          style={{ background: "linear-gradient(135deg, #059669, #10B981)" }}>
          <Plus size={16} /> Create Webhook
        </button>
      </div>

      <div className="space-y-3">
        {webhooks.map(wh => (
          <div key={wh.id} className="bg-white rounded-2xl border p-5 hover:shadow-md transition-all" style={{ borderColor: "#E3E9F6" }}>
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
                  <Globe size={22} style={{ color: "#059669" }} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="text-base font-bold text-slate-800">{wh.name}</p>
                    <StatusBadge status={wh.status} />
                  </div>
                  <p className="text-xs font-mono text-slate-400 mt-1 truncate max-w-md">{wh.url}</p>
                </div>
              </div>
              <div className="flex gap-4 text-right">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Success Rate</p>
                  <p className="text-sm font-black text-emerald-600 mt-0.5">{wh.successRate}%</p>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Delivery</p>
                  <p className="text-xs font-semibold text-slate-600 mt-1">{fmtDT(wh.lastDelivery)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-5 pt-4 border-t" style={{ borderColor: "#F1F5F9" }}>
              <div className="flex gap-1.5 flex-wrap">
                {wh.events.map(ev => (
                  <span key={ev} className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-600 uppercase tracking-tight">{ev}</span>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
                  <Zap size={14} />
                </button>
                <button className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
                  <Link2 size={14} />
                </button>
                <button className="p-2 rounded-xl border border-red-100 hover:bg-red-50 text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TokensTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800">Integration Tokens</h3>
          <p className="text-xs text-slate-500 mt-0.5">Short-lived and session-specific tokens for secure browser-to-server communication.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg shadow-purple-200"
          style={{ background: "linear-gradient(135deg, #6D28D9, #7C3AED)" }}>
          <Plus size={16} /> New Token
        </button>
      </div>

      <div className="p-12 text-center rounded-3xl border-2 border-dashed" style={{ borderColor: "#E3E9F6" }}>
        <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
          <Lock size={32} className="text-purple-400" />
        </div>
        <h4 className="text-sm font-bold text-slate-700">No active integration tokens</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
          Integration tokens are typically used for embedding HSE dashboards in your own apps or secure portal access.
        </p>
        <button className="mt-4 text-xs font-bold text-purple-600 hover:underline">Read API Documentation →</button>
      </div>
    </div>
  );
}

function PermissionsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-800">API Access Permissions</h3>
        <p className="text-xs text-slate-500 mt-0.5">Define granular access scopes for system-level integrations and automated agents.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {API_PERMISSIONS.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border p-4 flex gap-4" style={{ borderColor: "#E3E9F6" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#FEF2F2" }}>
              <ShieldCheck size={20} style={{ color: "#DC2626" }} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{p.label}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{p.desc}</p>
              <div className="flex items-center gap-1.5 mt-3">
                <code className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{p.id}</code>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={10} /> Active Scope</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 flex gap-4">
        <Info size={20} className="text-blue-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-blue-900">Custom API Scopes</p>
          <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
            Need more granular control? You can define custom permission scopes to restrict integrations to specific sites, departments, or data categories.
          </p>
          <button className="mt-2 text-xs font-bold text-blue-600 hover:underline">Contact HSE Integration Support</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ApiSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("keys");
  const activeTabMeta = TABS.find(t => t.id === activeTab)!;

  const bannerStats = [
    { label: "Active Keys", value: "12" },
    { label: "Webhooks",    value: "4" },
    { label: "Health",      value: "99.9%", color: "#059669" },
    { label: "Rate Limit",  value: "5k/hr" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>

      {/* ── Banner ── */}
      <div className="relative overflow-hidden px-6 pt-7 pb-6"
        style={{ background: "linear-gradient(135deg, #0C1A3D 0%, #1A2F6B 50%, #0F172A 100%)" }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 15% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 85% 25%, #60A5FA 0%, transparent 40%)" }} />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Share2 size={18} className="text-blue-300" />
              <span className="text-blue-200 text-xs font-bold tracking-widest uppercase">Developer Platform</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">API & Integrations</h1>
            <p className="text-blue-200/80 text-sm mt-1">Connect your ecosystem via high-performance APIs and real-time data streams.</p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {bannerStats.map(s => (
              <div key={s.label} className="px-3 py-2 rounded-xl text-center min-w-[80px]"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div className="text-sm font-extrabold text-white" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] text-blue-300/80 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-6 py-6 flex gap-6">

        {/* Sidebar */}
        <div className="w-52 flex-shrink-0">
          <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: "#E3E9F6", background: "white" }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Settings</p>
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

          <div className="mt-4 rounded-2xl border p-4 bg-white shadow-sm" style={{ borderColor: "#E3E9F6" }}>
            <div className="flex items-center gap-2 mb-3">
              <Database size={14} className="text-blue-500" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Environment</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">API Status</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">Online <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /></span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Version</span>
                <span className="font-bold text-slate-700">v2.4.0</span>
              </div>
            </div>
            <button className="w-full mt-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
              <Code2 size={12} /> API Docs
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
                  {activeTab === "keys"        && "Global access keys for system-to-system integrations."}
                  {activeTab === "webhooks"    && "Push notifications for real-time safety events."}
                  {activeTab === "tokens"      && "Secure temporary tokens for delegated portal access."}
                  {activeTab === "permissions" && "Scopes and role-based constraints for API access."}
                  {activeTab === "activity"    && "Audit trail of all integration requests and sync jobs."}
                </p>
              </div>
            </div>

            {activeTab === "keys"        && <KeysTab />}
            {activeTab === "webhooks"    && <WebhooksTab />}
            {activeTab === "tokens"      && <TokensTab />}
            {activeTab === "permissions" && <PermissionsTab />}
            {activeTab === "activity"    && (
              <div className="py-20 text-center text-slate-400">
                <Activity size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-xs font-medium">Activity logging is currently being indexed...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
