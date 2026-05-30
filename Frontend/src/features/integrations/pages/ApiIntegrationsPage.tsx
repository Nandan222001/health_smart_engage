import { useState, useMemo } from "react";
import {
  Plug, Plus, RefreshCw, Copy, Eye, EyeOff, Trash2,
  CheckCircle2, XCircle, AlertTriangle, Loader2,
  Zap, Clock, Key, Activity,
  ChevronDown, Search, Server, Users, Wifi, Shield,
  X, Globe,
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

// ── Category definitions ──────────────────────────────────────────────────────

interface CategoryDef {
  id: string;
  label: string;
  Icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
  description: string;
  examples: string[];
}

const CATEGORIES: CategoryDef[] = [
  {
    id: "erp",
    label: "ERP Systems",
    Icon: Server,
    color: "#3B82F6",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    description: "Connect enterprise resource planning platforms for unified data flow",
    examples: ["SAP S/4HANA", "Oracle ERP Cloud", "MS Dynamics 365", "NetSuite"],
  },
  {
    id: "hrms",
    label: "HRMS",
    Icon: Users,
    color: "#8B5CF6",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    description: "Sync employee records, org structure, and role assignments",
    examples: ["Workday", "BambooHR", "SAP SuccessFactors", "ADP"],
  },
  {
    id: "attendance",
    label: "Attendance Systems",
    Icon: Clock,
    color: "#F59E0B",
    bg: "#FFFBEB",
    border: "#FDE68A",
    description: "Track workforce attendance, shift schedules, and access control",
    examples: ["ZKTeco", "HID Global", "TimeDock", "Kronos WFC"],
  },
  {
    id: "iot",
    label: "IoT Devices",
    Icon: Wifi,
    color: "#10B981",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    description: "Connect sensors, wearables, and monitoring equipment in real time",
    examples: ["Gas Detectors", "Safety Wearables", "Env. Sensors", "CCTV"],
  },
  {
    id: "hse",
    label: "Existing HSE Software",
    Icon: Shield,
    color: "#EF4444",
    bg: "#FEF2F2",
    border: "#FECACA",
    description: "Migrate or sync with legacy HSE platforms bi-directionally",
    examples: ["Intelex", "Cority EHS", "Enablon", "IsoMetrix"],
  },
];

const AUTH_TYPES = [
  { value: "api_key", label: "API Key" },
  { value: "oauth2", label: "OAuth 2.0" },
  { value: "basic", label: "Basic Auth" },
  { value: "jwt", label: "JWT Token" },
  { value: "none", label: "No Auth" },
];

const SYNC_FREQS = [
  { value: "realtime", label: "Real-Time", desc: "Push events, instant sync" },
  { value: "hourly", label: "Hourly", desc: "Every 60 minutes" },
  { value: "daily", label: "Daily", desc: "Once daily at midnight" },
  { value: "weekly", label: "Weekly", desc: "Every Monday at midnight" },
];

const WEBHOOK_EVENTS = [
  "incident.created", "incident.updated", "incident.closed",
  "audit.completed", "audit.finding.added",
  "compliance.violation", "compliance.resolved",
  "training.completed", "hazard.reported",
  "permit.issued", "permit.expired",
];

const KEY_PERMS = ["read:all", "write:incidents", "write:audits", "write:employees", "write:hazards", "admin"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusDot(status: string): { text: string; bg: string; label: string } {
  switch (status) {
    case "active":   return { text: "#16A34A", bg: "#DCFCE7",  label: "Active" };
    case "syncing":  return { text: "#2563EB", bg: "#DBEAFE",  label: "Syncing" };
    case "warning":  return { text: "#D97706", bg: "#FEF3C7",  label: "Warning" };
    case "error":    return { text: "#DC2626", bg: "#FEE2E2",  label: "Error" };
    case "paused":   return { text: "#6B7280", bg: "#F3F4F6",  label: "Paused" };
    case "revoked":  return { text: "#DC2626", bg: "#FEE2E2",  label: "Revoked" };
    case "disabled": return { text: "#6B7280", bg: "#F3F4F6",  label: "Disabled" };
    default:         return { text: "#6B7280", bg: "#F3F4F6",  label: status };
  }
}

function catForType(type: string): string {
  const t = type.toLowerCase();
  if (["erp", "sap", "oracle", "dynamics", "netsuite"].some(k => t.includes(k))) return "erp";
  if (["hr", "hrms", "workday", "bamboo", "adp", "successfactors"].some(k => t.includes(k))) return "hrms";
  if (["attendance", "biometric", "kronos", "hid", "zk"].some(k => t.includes(k))) return "attendance";
  if (["iot", "sensor", "device", "wifi", "wearable"].some(k => t.includes(k))) return "iot";
  return "hse";
}

function maskKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return key.slice(0, 6) + " •••••••••••••••• " + key.slice(-4);
}

function genKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let k = "hse_live_";
  for (let i = 0; i < 32; i++) k += chars[Math.floor(Math.random() * chars.length)];
  return k;
}

function fmtDate(d?: string): string {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return "—"; }
}

function fmtDT(d?: string): string {
  if (!d) return "Never";
  try { return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
  catch { return "—"; }
}

function copyClip(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); document.body.removeChild(ta);
  });
}

// ── Local types ───────────────────────────────────────────────────────────────

interface ApiKeyRecord {
  id: string; name: string; key: string;
  permissions: string[]; created: string;
  lastUsed?: string; status: "active" | "revoked";
}

interface WebhookRecord {
  id: string; name: string; url: string;
  events: string[]; status: "active" | "disabled";
  lastDelivery?: string; successRate: number;
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = statusDot(status);
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: s.text, background: s.bg }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.text }} />
      {s.label}
    </span>
  );
}

// ── Add Integration Modal ─────────────────────────────────────────────────────

function AddIntegrationModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", endpoint_url: "", auth_type: "api_key", sync_frequency: "daily", description: "" });
  const [createIntegration, { isLoading }] = useCreateApiIntegrationMutation();

  async function handleSubmit() {
    if (!form.name || !form.endpoint_url || !selectedCat) return;
    try {
      await createIntegration({
        name: form.name, type: selectedCat, endpoint_url: form.endpoint_url,
        auth_type: form.auth_type, sync_frequency: form.sync_frequency,
        description: form.description, is_active: true,
      }).unwrap();
      onCreated(); onClose();
    } catch { /* ignore */ }
  }

  const cat = CATEGORIES.find(c => c.id === selectedCat);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4" style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "#E3E9F6" }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "#111827" }}>Add Integration</h2>
            <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Step {step} of 2 — {step === 1 ? "Choose Category" : "Configure Connection"}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" style={{ color: "#6B7280" }} /></button>
        </div>

        <div className="p-5">
          {step === 1 && (
            <div className="space-y-2">
              <p className="text-xs font-medium mb-3" style={{ color: "#374151" }}>Select the type of system to connect:</p>
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => { setSelectedCat(c.id); setStep(2); }}
                  className="w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all hover:shadow-sm"
                  style={{ borderColor: "#E3E9F6", background: "white" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                    <c.Icon className="w-5 h-5" style={{ color: c.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm" style={{ color: "#111827" }}>{c.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{c.description}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.examples.map(ex => (
                        <span key={ex} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>{ex}</span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && cat && (
            <div className="space-y-4">
              <button onClick={() => setStep(1)} className="text-xs hover:underline" style={{ color: "#4A57B9" }}>← Back to category</button>
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: cat.bg, border: `1px solid ${cat.border}` }}>
                <cat.Icon className="w-4 h-4" style={{ color: cat.color }} />
                <span className="text-sm font-semibold" style={{ color: cat.color }}>{cat.label}</span>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Integration Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. SAP Production, Workday HR"
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: "#D1D5DB", color: "#111827" }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Endpoint URL *</label>
                <input type="url" value={form.endpoint_url} onChange={e => setForm(f => ({ ...f, endpoint_url: e.target.value }))}
                  placeholder="https://api.example.com/v1"
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: "#D1D5DB", color: "#111827" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Auth Type</label>
                  <select value={form.auth_type} onChange={e => setForm(f => ({ ...f, auth_type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: "#D1D5DB", color: "#111827" }}>
                    {AUTH_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Sync Frequency</label>
                  <select value={form.sync_frequency} onChange={e => setForm(f => ({ ...f, sync_frequency: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: "#D1D5DB", color: "#111827" }}>
                    {SYNC_FREQS.map(s => <option key={s.value} value={s.value}>{s.label} — {s.desc}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description" rows={2}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none" style={{ borderColor: "#D1D5DB", color: "#111827" }} />
              </div>
              <button onClick={handleSubmit} disabled={isLoading || !form.name || !form.endpoint_url}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #4A57B9 0%, #0F172A 100%)" }}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
                {isLoading ? "Connecting..." : "Connect Integration"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({
  integrations, onAddClick, onToggle, onSyncById, onDelete, syncingIds,
}: {
  integrations: ApiIntegration[];
  onAddClick: () => void;
  onToggle: (id: string, active: boolean) => void;
  onSyncById: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  syncingIds: Set<string>;
}) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const int of integrations) {
      const c = catForType(int.type);
      counts[c] = (counts[c] ?? 0) + 1;
    }
    return counts;
  }, [integrations]);

  const filtered = useMemo(() => integrations.filter(int => {
    const matchSearch = !search || int.name.toLowerCase().includes(search.toLowerCase()) || int.endpoint_url.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || catForType(int.type) === catFilter;
    const matchStatus = statusFilter === "all" || (statusFilter === "active" ? int.is_active : !int.is_active);
    return matchSearch && matchCat && matchStatus;
  }), [integrations, search, catFilter, statusFilter]);

  function handleCopy(id: string, url: string) {
    copyClip(url); setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="space-y-6">
      {/* Category grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold" style={{ color: "#111827" }}>Integration Categories</h2>
          <button onClick={onAddClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #4A57B9 0%, #0F172A 100%)" }}>
            <Plus className="w-4 h-4" /> Add Integration
          </button>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {CATEGORIES.map(cat => {
            const count = catCounts[cat.id] ?? 0;
            const active = catFilter === cat.id;
            return (
              <button key={cat.id} onClick={() => setCatFilter(active ? "all" : cat.id)}
                className="p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md"
                style={{ borderColor: active ? cat.color : "#E3E9F6", background: active ? cat.bg : "white" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: cat.bg, border: `1px solid ${cat.border}` }}>
                  <cat.Icon className="w-5 h-5" style={{ color: cat.color }} />
                </div>
                <div className="text-sm font-bold mb-1" style={{ color: "#111827" }}>{cat.label}</div>
                <div className="text-[11px] leading-snug mb-2" style={{ color: "#6B7280" }}>{cat.description.split(",")[0]}</div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: count > 0 ? cat.bg : "#F3F4F6", color: count > 0 ? cat.color : "#6B7280", border: `1px solid ${count > 0 ? cat.border : "#E5E7EB"}` }}>
                  {count} connected
                </span>
                <div className="flex flex-wrap gap-1 mt-2">
                  {cat.examples.slice(0, 2).map(ex => (
                    <span key={ex} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#F3F4F6", color: "#6B7280" }}>{ex}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Connected integrations table */}
      <div className="rounded-2xl border" style={{ borderColor: "#E3E9F6", background: "white" }}>
        <div className="p-4 border-b flex flex-wrap items-center gap-3" style={{ borderColor: "#E3E9F6" }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 min-w-48"
            style={{ borderColor: "#E3E9F6", background: "#F5F7FF" }}>
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#9CA3AF" }} />
            <input type="text" placeholder="Search integrations..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none flex-1" style={{ color: "#111827" }} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: "#E3E9F6", color: "#374151" }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <span className="text-xs" style={{ color: "#6B7280" }}>{filtered.length} integration{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-14 flex flex-col items-center" style={{ color: "#9CA3AF" }}>
            <Plug className="w-8 h-8 mb-2" />
            <p className="text-sm">No integrations found</p>
            <button onClick={onAddClick} className="mt-3 text-xs font-semibold hover:underline" style={{ color: "#4A57B9" }}>
              + Add your first integration
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#F3F4F6" }}>
            {filtered.map(int => {
              const cat = CATEGORIES.find(c => c.id === catForType(int.type)) ?? CATEGORIES[0];
              const expanded = expandedId === int.id;
              const syncing = syncingIds.has(int.id);
              return (
                <div key={int.id}>
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedId(expanded ? null : int.id)}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: cat.bg, border: `1px solid ${cat.border}` }}>
                      <cat.Icon className="w-4 h-4" style={{ color: cat.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: "#111827" }}>{int.name}</div>
                      <div className="text-xs truncate" style={{ color: "#6B7280" }}>{int.endpoint_url}</div>
                    </div>
                    <span className="hidden md:block text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "#F3F4F6", color: "#374151" }}>
                      {AUTH_TYPES.find(a => a.value === int.auth_type)?.label ?? int.auth_type}
                    </span>
                    <StatusBadge status={int.is_active ? "active" : "paused"} />
                    <span className="hidden lg:block text-xs whitespace-nowrap" style={{ color: "#6B7280" }}>{fmtDT(int.last_sync)}</span>
                    <span className="hidden lg:block text-xs font-semibold whitespace-nowrap" style={{ color: "#374151" }}>
                      {(int.records_synced ?? 0).toLocaleString()} rec.
                    </span>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleCopy(int.id, int.endpoint_url)}
                        className="p-1.5 rounded-lg hover:bg-gray-100" title="Copy endpoint">
                        {copiedId === int.id
                          ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#16A34A" }} />
                          : <Copy className="w-3.5 h-3.5" style={{ color: "#9CA3AF" }} />}
                      </button>
                      <button onClick={() => onSyncById(int.id, int.name)}
                        disabled={syncing || !int.is_active}
                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40" title="Trigger sync">
                        <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`}
                          style={{ color: syncing ? "#2563EB" : "#9CA3AF" }} />
                      </button>
                      <button onClick={() => onToggle(int.id, !int.is_active)}
                        className="p-1.5 rounded-lg hover:bg-gray-100"
                        title={int.is_active ? "Disable" : "Enable"}>
                        {int.is_active
                          ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#16A34A" }} />
                          : <XCircle className="w-3.5 h-3.5" style={{ color: "#9CA3AF" }} />}
                      </button>
                      <button onClick={() => onDelete(int.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />
                      </button>
                    </div>
                    <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
                      style={{ color: "#9CA3AF" }} />
                  </div>

                  {expanded && (
                    <div className="px-4 pb-4" style={{ background: "#F9FAFB" }}>
                      <div className="grid grid-cols-3 gap-4 p-3 rounded-xl border mt-2"
                        style={{ borderColor: "#E3E9F6", background: "white" }}>
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: "#9CA3AF" }}>Category</div>
                          <div className="text-sm font-semibold" style={{ color: cat.color }}>{cat.label}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: "#9CA3AF" }}>Sync Frequency</div>
                          <div className="text-sm font-semibold" style={{ color: "#111827" }}>
                            {SYNC_FREQS.find(f => f.value === int.sync_frequency)?.label ?? int.sync_frequency ?? "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: "#9CA3AF" }}>Created</div>
                          <div className="text-sm font-semibold" style={{ color: "#111827" }}>{fmtDate(int.created_at)}</div>
                        </div>
                        {int.description && (
                          <div className="col-span-3">
                            <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: "#9CA3AF" }}>Description</div>
                            <div className="text-sm" style={{ color: "#374151" }}>{int.description}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── API Keys Tab ──────────────────────────────────────────────────────────────

const SEED_KEYS: ApiKeyRecord[] = [
  {
    id: "k1", name: "Production Integration Key",
    key: genKey(), permissions: ["read:all", "write:incidents", "write:audits"],
    created: new Date(Date.now() - 86400000 * 30).toISOString(),
    lastUsed: new Date(Date.now() - 3600000 * 2).toISOString(), status: "active",
  },
  {
    id: "k2", name: "Data Sync Key",
    key: genKey(), permissions: ["read:all", "write:employees"],
    created: new Date(Date.now() - 86400000 * 60).toISOString(),
    lastUsed: new Date(Date.now() - 86400000 * 7).toISOString(), status: "active",
  },
];

function ApiKeysTab() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>(SEED_KEYS);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPerms, setNewPerms] = useState<string[]>(["read:all"]);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);

  function handleGenerate() {
    if (!newName) return;
    const key = genKey();
    setKeys(prev => [{
      id: `k_${Date.now()}`, name: newName, key,
      permissions: newPerms, created: new Date().toISOString(), status: "active",
    }, ...prev]);
    setGeneratedKey(key);
    setNewName(""); setNewPerms(["read:all"]);
  }

  function handleCopy(id: string, key: string) {
    copyClip(key); setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  function toggleReveal(id: string) {
    setRevealed(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold" style={{ color: "#111827" }}>API Keys</h2>
          <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Manage API keys for authenticating external systems</p>
        </div>
        <button onClick={() => { setShowModal(true); setGeneratedKey(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #4A57B9 0%, #0F172A 100%)" }}>
          <Plus className="w-4 h-4" /> Generate Key
        </button>
      </div>

      <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "#FEF3C7", border: "1px solid #FDE68A" }}>
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#D97706" }} />
        <p className="text-xs" style={{ color: "#92400E" }}>
          API keys grant access to your HSE data. Keep them secret and never share in public repositories.
          Revoke immediately if compromised. Keys are shown only once upon creation.
        </p>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F5F7FF" }}>
              {["Name", "API Key", "Permissions", "Created", "Last Used", "Status", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map(k => (
              <tr key={k.id} className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6", opacity: k.status === "revoked" ? 0.55 : 1 }}>
                <td className="px-4 py-3 font-semibold text-sm" style={{ color: "#111827" }}>{k.name}</td>
                <td className="px-4 py-3">
                  <code className="text-xs px-2 py-1 rounded" style={{ background: "#F3F4F6", color: "#374151", fontFamily: "monospace" }}>
                    {revealed.has(k.id) ? k.key : maskKey(k.key)}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {k.permissions.map(p => (
                      <span key={p} className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: "#EFF6FF", color: "#2563EB" }}>{p}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{fmtDate(k.created)}</td>
                <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{fmtDT(k.lastUsed)}</td>
                <td className="px-4 py-3"><StatusBadge status={k.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleReveal(k.id)} className="p-1.5 rounded-lg hover:bg-gray-100"
                      title={revealed.has(k.id) ? "Hide" : "Reveal"}>
                      {revealed.has(k.id)
                        ? <EyeOff className="w-3.5 h-3.5" style={{ color: "#9CA3AF" }} />
                        : <Eye className="w-3.5 h-3.5" style={{ color: "#9CA3AF" }} />}
                    </button>
                    <button onClick={() => handleCopy(k.id, k.key)} className="p-1.5 rounded-lg hover:bg-gray-100" title="Copy">
                      {copied === k.id
                        ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#16A34A" }} />
                        : <Copy className="w-3.5 h-3.5" style={{ color: "#9CA3AF" }} />}
                    </button>
                    {k.status === "active" && (
                      <button onClick={() => setKeys(prev => prev.map(x => x.id === k.id ? { ...x, status: "revoked" as const } : x))}
                        className="p-1.5 rounded-lg hover:bg-red-50" title="Revoke">
                        <Trash2 className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: "#111827" }}>Generate API Key</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" style={{ color: "#6B7280" }} />
              </button>
            </div>

            {generatedKey ? (
              <div className="space-y-4">
                <div className="p-3 rounded-xl" style={{ background: "#DCFCE7", border: "1px solid #BBF7D0" }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: "#166534" }}>Key generated successfully</div>
                  <div className="text-xs" style={{ color: "#166534" }}>Copy it now — it won't be shown again.</div>
                </div>
                <div className="p-3 rounded-xl border" style={{ borderColor: "#E3E9F6", background: "#F5F7FF" }}>
                  <code className="text-xs break-all" style={{ color: "#111827", fontFamily: "monospace" }}>{generatedKey}</code>
                </div>
                <button onClick={() => handleCopy("gen", generatedKey)}
                  className="w-full py-2 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #4A57B9 0%, #0F172A 100%)" }}>
                  {copied === "gen" ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied === "gen" ? "Copied!" : "Copy to Clipboard"}
                </button>
                <button onClick={() => setShowModal(false)}
                  className="w-full py-2 rounded-xl text-sm font-semibold border" style={{ borderColor: "#E3E9F6", color: "#374151" }}>
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Key Name *</label>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. SAP Integration Key"
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: "#D1D5DB", color: "#111827" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "#374151" }}>Permissions</label>
                  <div className="grid grid-cols-2 gap-2">
                    {KEY_PERMS.map(p => (
                      <label key={p} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                        <input type="checkbox" checked={newPerms.includes(p)}
                          onChange={e => setNewPerms(prev => e.target.checked ? [...prev, p] : prev.filter(x => x !== p))}
                          className="rounded" />
                        <span className="text-xs" style={{ color: "#374151" }}>{p}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button onClick={handleGenerate} disabled={!newName}
                  className="w-full py-2 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #4A57B9 0%, #0F172A 100%)" }}>
                  <Key className="w-4 h-4" /> Generate Key
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Webhooks Tab ──────────────────────────────────────────────────────────────

const SEED_WEBHOOKS: WebhookRecord[] = [
  {
    id: "wh1", name: "ERP Incident Sync",
    url: "https://erp.example.com/webhooks/hse-incidents",
    events: ["incident.created", "incident.updated", "incident.closed"],
    status: "active", lastDelivery: new Date(Date.now() - 3600000).toISOString(), successRate: 98.5,
  },
  {
    id: "wh2", name: "Compliance Alert Webhook",
    url: "https://compliance.example.com/api/alerts",
    events: ["compliance.violation", "audit.completed"],
    status: "active", lastDelivery: new Date(Date.now() - 7200000).toISOString(), successRate: 95.0,
  },
];

function WebhooksTab() {
  const [webhooks, setWebhooks] = useState<WebhookRecord[]>(SEED_WEBHOOKS);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", events: [] as string[], secret: "" });
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, boolean>>({});

  function handleAdd() {
    if (!form.name || !form.url || form.events.length === 0) return;
    setWebhooks(prev => [...prev, {
      id: `wh_${Date.now()}`, name: form.name, url: form.url,
      events: form.events, status: "active", successRate: 100,
    }]);
    setForm({ name: "", url: "", events: [], secret: "" });
    setShowModal(false);
  }

  async function handleTest(id: string) {
    setTesting(id);
    await new Promise(r => setTimeout(r, 1500));
    setTesting(null);
    const ok = Math.random() > 0.2;
    setTestResult(prev => ({ ...prev, [id]: ok }));
    setTimeout(() => setTestResult(prev => { const n = { ...prev }; delete n[id]; return n; }), 3000);
  }

  function toggleEvent(ev: string) {
    setForm(f => ({ ...f, events: f.events.includes(ev) ? f.events.filter(e => e !== ev) : [...f.events, ev] }));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold" style={{ color: "#111827" }}>Webhooks</h2>
          <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Receive real-time push notifications when HSE events occur</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #4A57B9 0%, #0F172A 100%)" }}>
          <Plus className="w-4 h-4" /> Add Webhook
        </button>
      </div>

      <div className="space-y-3">
        {webhooks.map(wh => (
          <div key={wh.id} className="rounded-2xl border p-4" style={{ borderColor: "#E3E9F6", background: "white" }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                <Globe className="w-5 h-5" style={{ color: "#16A34A" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold" style={{ color: "#111827" }}>{wh.name}</span>
                  <StatusBadge status={wh.status} />
                  {testResult[wh.id] !== undefined && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${testResult[wh.id] ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"}`}>
                      {testResult[wh.id] ? "✓ Test passed" : "✗ Test failed"}
                    </span>
                  )}
                </div>
                <div className="text-xs mt-0.5 break-all" style={{ color: "#6B7280", fontFamily: "monospace" }}>{wh.url}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {wh.events.map(ev => (
                    <span key={ev} className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={{ background: "#EFF6FF", color: "#2563EB" }}>{ev}</span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs" style={{ color: "#6B7280" }}>Success rate</div>
                <div className="text-sm font-bold"
                  style={{ color: wh.successRate >= 95 ? "#16A34A" : wh.successRate >= 80 ? "#D97706" : "#DC2626" }}>
                  {wh.successRate.toFixed(1)}%
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>Last: {fmtDT(wh.lastDelivery)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: "#F3F4F6" }}>
              <button onClick={() => handleTest(wh.id)} disabled={testing === wh.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border"
                style={{ borderColor: "#E3E9F6", color: "#374151" }}>
                {testing === wh.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                {testing === wh.id ? "Testing..." : "Test Webhook"}
              </button>
              <button
                onClick={() => setWebhooks(prev => prev.map(w => w.id === wh.id ? { ...w, status: w.status === "active" ? "disabled" : "active" } : w))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border"
                style={{ borderColor: "#E3E9F6", color: wh.status === "active" ? "#D97706" : "#16A34A" }}>
                {wh.status === "active" ? "Disable" : "Enable"}
              </button>
              <button onClick={() => setWebhooks(prev => prev.filter(w => w.id !== wh.id))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ml-auto"
                style={{ borderColor: "#FEE2E2", color: "#DC2626" }}>
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          </div>
        ))}
        {webhooks.length === 0 && (
          <div className="py-10 flex flex-col items-center rounded-2xl border" style={{ borderColor: "#E3E9F6", color: "#9CA3AF" }}>
            <Globe className="w-8 h-8 mb-2" />
            <p className="text-sm">No webhooks configured</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-5" style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: "#111827" }}>Add Webhook</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" style={{ color: "#6B7280" }} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Webhook Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. ERP Incident Sync"
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: "#D1D5DB", color: "#111827" }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Endpoint URL *</label>
                <input type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://your-app.com/webhooks/hse"
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: "#D1D5DB", color: "#111827" }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Signing Secret (optional)</label>
                <input type="text" value={form.secret} onChange={e => setForm(f => ({ ...f, secret: e.target.value }))}
                  placeholder="HMAC signing secret"
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: "#D1D5DB", color: "#111827" }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "#374151" }}>Events to Subscribe *</label>
                <div className="grid grid-cols-2 gap-1">
                  {WEBHOOK_EVENTS.map(ev => (
                    <label key={ev} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                      <input type="checkbox" checked={form.events.includes(ev)} onChange={() => toggleEvent(ev)} className="rounded" />
                      <span className="text-xs" style={{ color: "#374151" }}>{ev}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={handleAdd} disabled={!form.name || !form.url || form.events.length === 0}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #4A57B9 0%, #0F172A 100%)" }}>
                Add Webhook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sync Tab ──────────────────────────────────────────────────────────────────

function SyncTab({ integrations }: { integrations: ApiIntegration[] }) {
  const { data: syncData, isFetching } = useGetSyncStatusQuery();
  const [triggerSync, { isLoading: isSyncing }] = useTriggerSyncMutation();
  const [triggeringId, setTriggeringId] = useState<string | null>(null);

  const syncEntries = Array.isArray(syncData?.integrations) ? syncData!.integrations : [];
  const activeCount = syncEntries.filter(s => s.status === "active").length;
  const syncingCount = syncEntries.filter(s => s.status === "syncing").length;
  const errorCount = syncEntries.filter(s => s.status === "error").length;
  const totalRecords = syncEntries.reduce((sum, s) => sum + (s.records_synced ?? 0), 0);

  async function handleTrigger(name?: string, id?: string) {
    if (id) setTriggeringId(id);
    try { await triggerSync({ integration: name }).unwrap(); } catch { /* ignore */ }
    setTriggeringId(null);
  }

  const realtimeCount = integrations.filter(i => i.sync_frequency === "realtime" && i.is_active).length;
  const scheduledCount = integrations.filter(i => i.sync_frequency !== "realtime" && i.is_active).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold" style={{ color: "#111827" }}>Sync Status</h2>
          <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Monitor real-time and scheduled sync activity across all integrations</p>
        </div>
        <button onClick={() => handleTrigger()} disabled={isSyncing || isFetching}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #4A57B9 0%, #0F172A 100%)" }}>
          {isSyncing || isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sync All
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active Streams", value: activeCount, color: "#16A34A", bg: "#DCFCE7" },
          { label: "Currently Syncing", value: syncingCount, color: "#2563EB", bg: "#DBEAFE" },
          { label: "Sync Errors", value: errorCount, color: "#DC2626", bg: "#FEE2E2" },
          { label: "Total Records Synced", value: totalRecords >= 1000 ? `${(totalRecords / 1000).toFixed(1)}k` : String(totalRecords), color: "#7C3AED", bg: "#EDE9FE" },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl border p-4" style={{ borderColor: "#E3E9F6", background: "white" }}>
            <div className="text-2xl font-black mb-1" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs font-medium" style={{ color: "#6B7280" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Real-time vs Scheduled cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border p-4" style={{ borderColor: "#BFDBFE", background: "#EFF6FF" }}>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4" style={{ color: "#2563EB" }} />
            <span className="text-sm font-bold" style={{ color: "#1E40AF" }}>Real-Time Sync</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "#1D4ED8" }}>
            Push-based webhooks deliver data instantly as events occur. Ideal for incidents, alerts, and time-sensitive safety data. Zero latency, event-driven.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#3B82F6" }} />
            <span className="text-xs font-semibold" style={{ color: "#1E40AF" }}>{realtimeCount} integrations on real-time</span>
          </div>
        </div>
        <div className="rounded-2xl border p-4" style={{ borderColor: "#A7F3D0", background: "#ECFDF5" }}>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4" style={{ color: "#059669" }} />
            <span className="text-sm font-bold" style={{ color: "#065F46" }}>Scheduled Sync</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "#047857" }}>
            Periodic batch sync at configured intervals — hourly, daily, or weekly. Best for bulk employee data, compliance records, and historical imports.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Clock className="w-3 h-3" style={{ color: "#059669" }} />
            <span className="text-xs font-semibold" style={{ color: "#065F46" }}>{scheduledCount} integrations on schedule</span>
          </div>
        </div>
      </div>

      {/* Sync details table */}
      {syncEntries.length > 0 ? (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "#E3E9F6", background: "#F5F7FF" }}>
            <span className="text-sm font-bold" style={{ color: "#111827" }}>Live Sync Details</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F5F7FF" }}>
                {["Integration", "Type", "Last Sync", "Next Sync", "Records", "Status", "Trigger"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {syncEntries.map((entry, i) => (
                <tr key={entry.id ?? i} className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-4 py-3 font-semibold text-sm" style={{ color: "#111827" }}>{entry.name}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{entry.integration_type ?? "—"}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{fmtDT(entry.last_sync)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{fmtDT(entry.next_sync)}</td>
                  <td className="px-4 py-3 text-xs font-semibold" style={{ color: "#374151" }}>{(entry.records_synced ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={entry.status} />
                    {entry.error_message && (
                      <div className="text-[10px] mt-0.5 truncate max-w-32" style={{ color: "#DC2626" }} title={entry.error_message}>
                        {entry.error_message}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleTrigger(entry.name, entry.id)} disabled={triggeringId === entry.id}
                      className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40">
                      <RefreshCw className={`w-3.5 h-3.5 ${triggeringId === entry.id ? "animate-spin" : ""}`}
                        style={{ color: "#4A57B9" }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : integrations.length > 0 ? (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "#E3E9F6", background: "#F5F7FF" }}>
            <span className="text-sm font-bold" style={{ color: "#111827" }}>Integration Sync Configuration</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F5F7FF" }}>
                {["Integration", "Frequency", "Last Sync", "Records Synced", "Status", "Trigger"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {integrations.map(int => (
                <tr key={int.id} className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-4 py-3 font-semibold text-sm" style={{ color: "#111827" }}>{int.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: int.sync_frequency === "realtime" ? "#EFF6FF" : "#F3F4F6", color: int.sync_frequency === "realtime" ? "#2563EB" : "#374151" }}>
                      {int.sync_frequency === "realtime" && <Zap className="w-2.5 h-2.5" />}
                      {SYNC_FREQS.find(f => f.value === int.sync_frequency)?.label ?? int.sync_frequency ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{fmtDT(int.last_sync)}</td>
                  <td className="px-4 py-3 text-xs font-semibold" style={{ color: "#374151" }}>{(int.records_synced ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={int.is_active ? "active" : "paused"} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleTrigger(int.name, int.id)}
                      disabled={triggeringId === int.id || !int.is_active}
                      className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40">
                      <RefreshCw className={`w-3.5 h-3.5 ${triggeringId === int.id ? "animate-spin" : ""}`}
                        style={{ color: "#4A57B9" }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-10 flex flex-col items-center rounded-2xl border" style={{ borderColor: "#E3E9F6", color: "#9CA3AF" }}>
          <Activity className="w-8 h-8 mb-2" />
          <p className="text-sm">No sync data available. Add integrations to monitor sync activity.</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type TabId = "overview" | "api-keys" | "webhooks" | "sync";

interface TabDef { id: TabId; label: string; Icon: LucideIcon }
const TABS: TabDef[] = [
  { id: "overview",  label: "Overview",    Icon: Globe },
  { id: "api-keys",  label: "API Keys",    Icon: Key },
  { id: "webhooks",  label: "Webhooks",    Icon: Globe },
  { id: "sync",      label: "Sync Status", Icon: Activity },
];

export function ApiIntegrationsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());

  const { data: integrationsRaw = [], refetch } = useListApiIntegrationsQuery();
  const { data: syncData } = useGetSyncStatusQuery();
  const [updateIntegration] = useUpdateApiIntegrationMutation();
  const [deleteIntegration] = useDeleteApiIntegrationMutation();
  const [triggerSync] = useTriggerSyncMutation();

  const integrations: ApiIntegration[] = Array.isArray(integrationsRaw) ? integrationsRaw : [];
  const syncEntries = Array.isArray(syncData?.integrations) ? syncData!.integrations : [];

  const activeCount = integrations.filter(i => i.is_active).length;
  const realtimeCount = integrations.filter(i => i.sync_frequency === "realtime" && i.is_active).length;
  const totalRecords = integrations.reduce((sum, i) => sum + (i.records_synced ?? 0), 0);
  const errorCount = syncEntries.filter(s => s.status === "error").length;

  async function handleToggle(id: string, active: boolean) {
    try { await updateIntegration({ integrationId: id, is_active: active }).unwrap(); } catch { /* ignore */ }
  }

  async function handleSyncById(id: string, name: string) {
    setSyncingIds(prev => new Set(prev).add(id));
    try { await triggerSync({ integration: name }).unwrap(); } catch { /* ignore */ }
    setSyncingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  }

  async function handleDelete(id: string) {
    try { await deleteIntegration(id).unwrap(); } catch { /* ignore */ }
  }

  return (
    <div className="p-6 space-y-5" style={{ background: "#F5F7FF", minHeight: "100vh" }}>
      {/* Banner */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0C1A3D 0%, #1A2F6B 45%, #0F172A 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 15% 50%, #4A57B9 0%, transparent 50%), radial-gradient(circle at 85% 20%, #60A5FA 0%, transparent 40%)"
        }} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Plug className="w-5 h-5 text-blue-300" />
              <span className="text-xs font-semibold text-blue-300 uppercase tracking-widest">API Integrations</span>
            </div>
            <h1 className="text-2xl font-black mb-1">Connect External Systems</h1>
            <p className="text-sm" style={{ color: "#93C5FD" }}>ERP Systems · HRMS · Attendance · IoT Devices · Existing HSE Software</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Total Integrations", value: integrations.length, sub: `${activeCount} active` },
              { label: "Real-Time Streams",  value: realtimeCount,        sub: "push-based" },
              { label: "Records Synced",     value: totalRecords >= 1000 ? `${(totalRecords / 1000).toFixed(1)}k` : totalRecords, sub: "all time" },
              { label: "Sync Errors",        value: errorCount,           sub: errorCount > 0 ? "action needed" : "all clear", alert: errorCount > 0 },
            ].map(stat => (
              <div key={stat.label} className="px-4 py-3 rounded-xl text-center"
                style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", minWidth: 110 }}>
                <div className={`text-2xl font-black ${stat.alert ? "text-red-300" : "text-white"}`}>{stat.value}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#93C5FD" }}>{stat.label}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "#BFDBFE" }}>{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "white", border: "1px solid #E3E9F6", width: "fit-content" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={activeTab === tab.id
              ? { background: "linear-gradient(135deg, #4A57B9 0%, #0F172A 100%)", color: "white" }
              : { color: "#6B7280" }}>
            <tab.Icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <OverviewTab integrations={integrations} onAddClick={() => setShowAddModal(true)}
          onToggle={handleToggle} onSyncById={handleSyncById} onDelete={handleDelete} syncingIds={syncingIds} />
      )}
      {activeTab === "api-keys"  && <ApiKeysTab />}
      {activeTab === "webhooks"  && <WebhooksTab />}
      {activeTab === "sync"      && <SyncTab integrations={integrations} />}

      {showAddModal && (
        <AddIntegrationModal onClose={() => setShowAddModal(false)} onCreated={() => refetch()} />
      )}
    </div>
  );
}
