import { useMemo, useState } from "react";
import {
  ShieldAlert, Search, Plus, X, Loader2, Filter,
  RefreshCw, AlertTriangle, CheckCircle2, AlertCircle,
  Flame, Layers, BarChart3, Shield, XCircle, Lock, Unlock,
  MapPin, Globe, Clock, Building2,
} from "lucide-react";
import { useListHazardsQuery, useCreateHazardMutation } from "@/features/hazards/api/hazardsApi";
import { useGetSitesQuery, useGetZonesQuery } from "@/features/sites/api/sitesApi";
import type { Hazard } from "@/features/hazards/api/hazardsApi";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "list" | "severity" | "controls" | "mapping";

// ── Shared Helpers ────────────────────────────────────────────────────────────

const SEV_ORDER: Hazard["severity"][] = ["critical", "high", "medium", "low"];

const SEV_CFG: Record<string, { color: string; bg: string; border: string; label: string; Icon: React.ElementType }> = {
  critical: { color: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5", label: "Critical", Icon: Flame },
  high:     { color: "#EA580C", bg: "#FFEDD5", border: "#FDB898", label: "High",     Icon: AlertCircle },
  medium:   { color: "#D97706", bg: "#FEF3C7", border: "#FCD34D", label: "Medium",   Icon: AlertTriangle },
  low:      { color: "#16A34A", bg: "#DCFCE7", border: "#86EFAC", label: "Low",      Icon: CheckCircle2 },
};

const ST_CFG: Record<string, { color: string; bg: string }> = {
  open:      { color: "#DC2626", bg: "#FEE2E2" },
  mitigated: { color: "#16A34A", bg: "#DCFCE7" },
  closed:    { color: "#6B7280", bg: "#F3F4F6" },
};

function sevCfg(s: string) {
  return SEV_CFG[s?.toLowerCase()] ?? { color: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB", label: s, Icon: ShieldAlert };
}

function SevBadge({ sev }: { sev: string }) {
  const cfg = sevCfg(sev);
  return (
    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize"
      style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = ST_CFG[status?.toLowerCase()] ?? ST_CFG.open;
  return (
    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize"
      style={{ color: cfg.color, background: cfg.bg }}>{status}</span>
  );
}

function HeroStat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex-1 px-6 py-4 text-center">
      <div className="text-[26px] font-black text-white leading-none" style={color ? { color } : undefined}>{value}</div>
      <div className="text-[11px] font-semibold mt-1 uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.55)" }}>{label}</div>
    </div>
  );
}

// ── TAB 1: Hazard List ────────────────────────────────────────────────────────

function FilterBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
      style={active
        ? { background: "linear-gradient(135deg,#DC2626,#EF4444)", color: "#fff", boxShadow: "0 2px 8px rgba(220,38,38,0.25)" }
        : { background: "#F1F5F9", color: "#64748B" }}>
      {label}
    </button>
  );
}

function CreateHazardModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [createHazard, { isLoading }] = useCreateHazardMutation();
  const [form, setForm] = useState({ title: "", type: "", severity: "medium", description: "", site_id: "", mitigation: "" });
  const [error, setError] = useState("");
  const set = (field: string, val: string) => setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.type.trim())  { setError("Hazard type is required."); return; }
    try {
      await createHazard({ title: form.title, type: form.type, severity: form.severity, description: form.description, site_id: form.site_id || undefined, mitigation: form.mitigation || undefined }).unwrap();
      onCreated(); onClose();
    } catch { setError("Failed to create hazard. Please try again."); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E5E7EB" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#FEE2E2" }}>
              <ShieldAlert className="w-4 h-4" style={{ color: "#DC2626" }} />
            </div>
            <span className="font-bold text-[15px]" style={{ color: "#111827" }}>Report Hazard</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4" style={{ color: "#6B7280" }} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <div className="text-[12px] px-3 py-2 rounded-lg font-medium" style={{ background: "#FEE2E2", color: "#DC2626" }}>{error}</div>}
          {[
            { label: "Hazard Title",    field: "title",   placeholder: "e.g. Exposed electrical wiring in Zone C" },
            { label: "Hazard Type",     field: "type",    placeholder: "e.g. Electrical, Chemical, Mechanical" },
            { label: "Site / Location", field: "site_id", placeholder: "e.g. Main Plant, Warehouse A" },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "#374151" }}>{label}</label>
              <input className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] outline-none" style={{ borderColor: "#E5E7EB" }}
                placeholder={placeholder} value={form[field as keyof typeof form]} onChange={(e) => set(field, e.target.value)} />
            </div>
          ))}
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "#374151" }}>Severity</label>
            <select className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] outline-none" style={{ borderColor: "#E5E7EB" }}
              value={form.severity} onChange={(e) => set("severity", e.target.value)}>
              {["low", "medium", "high", "critical"].map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "#374151" }}>Description</label>
            <textarea rows={2} className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] outline-none resize-none"
              style={{ borderColor: "#E5E7EB" }} placeholder="Describe the hazard…"
              value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "#374151" }}>Risk Control / Mitigation</label>
            <textarea rows={2} className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] outline-none resize-none"
              style={{ borderColor: "#E5E7EB" }} placeholder="Describe the control measure (optional)…"
              value={form.mitigation} onChange={(e) => set("mitigation", e.target.value)} />
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-2.5" style={{ borderColor: "#E5E7EB" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-semibold" style={{ background: "#F3F4F6", color: "#374151" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={isLoading}
            className="px-4 py-2 rounded-xl text-[13px] font-semibold flex items-center gap-2"
            style={{ background: "linear-gradient(135deg,#DC2626,#EF4444)", color: "#fff", opacity: isLoading ? 0.7 : 1 }}>
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Report Hazard
          </button>
        </div>
      </div>
    </div>
  );
}

function HazardListTab({ hazards, isLoading, refetch }: { hazards: Hazard[]; isLoading: boolean; refetch: () => void }) {
  const [search, setSearch]       = useState("");
  const [sevFilter, setSevFilter] = useState("all");
  const [statusFilter, setStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);

  const filtered = useMemo(() => {
    let h = hazards;
    if (search)              h = h.filter((x) => (x.title || "").toLowerCase().includes(search.toLowerCase()) || (x.type || "").toLowerCase().includes(search.toLowerCase()));
    if (sevFilter !== "all") h = h.filter((x) => x.severity === sevFilter);
    if (statusFilter !== "all") h = h.filter((x) => x.status === statusFilter);
    return [...h].sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity));
  }, [hazards, search, sevFilter, statusFilter]);

  return (
    <div className="space-y-5">
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
          <input className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-[13px] outline-none bg-white"
            style={{ borderColor: "#E3E9F6" }} placeholder="Search hazards by title or type…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button onClick={refetch} className="p-2.5 rounded-xl border bg-white hover:bg-gray-50 transition-colors" style={{ borderColor: "#E3E9F6" }}>
          <RefreshCw className="w-4 h-4" style={{ color: "#6B7280" }} />
        </button>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#DC2626,#EF4444)" }}>
          <Plus className="w-4 h-4" />Report Hazard
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#9CA3AF" }} />
        <span className="text-[11px] font-semibold" style={{ color: "#9CA3AF" }}>Severity:</span>
        {["all", "critical", "high", "medium", "low"].map((s) => (
          <FilterBtn key={s} label={s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)} active={sevFilter === s} onClick={() => setSevFilter(s)} />
        ))}
        <span className="text-[11px] font-semibold ml-3" style={{ color: "#9CA3AF" }}>Status:</span>
        {["all", "open", "mitigated", "closed"].map((s) => (
          <FilterBtn key={s} label={s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)} active={statusFilter === s} onClick={() => setStatus(s)} />
        ))}
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: "#F3F4F6" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#FEE2E2" }}>
            <ShieldAlert className="w-4 h-4" style={{ color: "#DC2626" }} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>All Hazards</h2>
            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{filtered.length} of {hazards.length} hazards · sorted by severity</p>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
              {["Hazard / Type", "Severity", "Status", "Site / Zone", "Reported By", "Identified"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-12">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" style={{ color: "#D1D5DB" }} />
                <p className="text-[13px]" style={{ color: "#9CA3AF" }}>Loading hazards…</p>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-14">
                <ShieldAlert className="w-10 h-10 mx-auto mb-3" style={{ color: "#E5E7EB" }} />
                <p className="text-[14px] font-semibold" style={{ color: "#374151" }}>No hazards found</p>
                <p className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>Try adjusting your filters or report a new hazard.</p>
              </td></tr>
            ) : filtered.map((h) => (
              <tr key={h.id} className="border-t hover:bg-blue-50/30 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                <td className="px-5 py-3.5">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: sevCfg(h.severity).color }} />
                    <div>
                      <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{h.title || "—"}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>{h.type || "—"}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5"><SevBadge sev={h.severity} /></td>
                <td className="px-5 py-3.5"><StatusBadge status={h.status} /></td>
                <td className="px-5 py-3.5">
                  <div className="text-[12px]" style={{ color: "#6B7280" }}>{h.site_id || "—"}</div>
                  {h.zone_id && <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{h.zone_id}</div>}
                </td>
                <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{h.reported_by ? String(h.reported_by).slice(0, 16) : "—"}</td>
                <td className="px-5 py-3.5 text-[12px]" style={{ color: "#9CA3AF" }}>{h.identified_at ? new Date(h.identified_at).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <CreateHazardModal onClose={() => setShowModal(false)} onCreated={() => refetch()} />}
    </div>
  );
}

// ── TAB 2: Hazard Severity ────────────────────────────────────────────────────

function SevBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 text-[12px] font-semibold capitalize" style={{ color: "#374151" }}>{label}</div>
      <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="w-8 text-right text-[12px] font-bold" style={{ color }}>{count}</div>
      <div className="w-10 text-right text-[11px]" style={{ color: "#9CA3AF" }}>{pct}%</div>
    </div>
  );
}

function CriticalAlertSection({ hazards }: { hazards: Hazard[] }) {
  const critical = hazards.filter((h) => h.severity === "critical" && h.status === "open");
  if (critical.length === 0) return null;
  return (
    <div className="rounded-2xl border p-5" style={{ background: "#FFF1F2", borderColor: "#FECDD3" }}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#FEE2E2" }}>
          <Flame className="w-4 h-4" style={{ color: "#DC2626" }} />
        </div>
        <div>
          <h3 className="text-[14px] font-bold" style={{ color: "#991B1B" }}>
            {critical.length} Critical Hazard{critical.length !== 1 ? "s" : ""} — Immediate Action Required
          </h3>
          <p className="text-[11px]" style={{ color: "#B91C1C" }}>These open critical hazards pose immediate risk to personnel and operations.</p>
        </div>
      </div>
      <div className="space-y-2">
        {critical.map((h) => (
          <div key={h.id} className="bg-white rounded-xl border px-4 py-3 flex items-center gap-3" style={{ borderColor: "#FCA5A5" }}>
            <Flame className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#DC2626" }} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate" style={{ color: "#111827" }}>{h.title}</div>
              <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{h.type || "—"} · {h.site_id || "Unassigned site"}</div>
            </div>
            <StatusBadge status={h.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SeverityDistributionSection({ hazards }: { hazards: Hazard[] }) {
  const total = hazards.length || 1;
  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FFEDD5" }}>
            <BarChart3 className="w-5 h-5" style={{ color: "#EA580C" }} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>Severity Distribution</h2>
            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Breakdown across all {hazards.length} hazards</p>
          </div>
        </div>
      </div>
      <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 mb-2">
        {SEV_ORDER.map((sev) => {
          const cfg = SEV_CFG[sev];
          const Icon = cfg.Icon;
          const list = hazards.filter((h) => h.severity === sev);
          const pct = Math.round((list.length / total) * 100);
          const openCnt = list.filter((h) => h.status === "open").length;
          return (
            <div key={sev} className="rounded-2xl border p-4 text-center" style={{ background: cfg.bg + "40", borderColor: cfg.border }}>
              <div className="flex items-center justify-center mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: cfg.bg }}>
                  <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                </div>
              </div>
              <div className="text-[28px] font-black leading-none" style={{ color: "#111827" }}>{list.length}</div>
              <div className="text-[12px] font-bold mt-1" style={{ color: cfg.color }}>{cfg.label}</div>
              <div className="w-full h-1.5 rounded-full mt-2" style={{ background: "#E5E7EB" }}>
                <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: cfg.color }} />
              </div>
              <div className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>{openCnt} open · {pct}%</div>
            </div>
          );
        })}
      </div>
      <div className="px-6 pb-6 space-y-3">
        {SEV_ORDER.map((sev) => (
          <SevBar key={sev} label={SEV_CFG[sev].label} count={hazards.filter((h) => h.severity === sev).length} total={hazards.length} color={SEV_CFG[sev].color} />
        ))}
      </div>
    </div>
  );
}

function SeverityByTypeSection({ hazards }: { hazards: Hazard[] }) {
  const typeGroups = useMemo(() => {
    const map: Record<string, { total: number; critical: number; high: number; medium: number; low: number }> = {};
    for (const h of hazards) {
      const t = h.type || "Unclassified";
      if (!map[t]) map[t] = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
      map[t].total++;
      if (h.severity === "critical") map[t].critical++;
      else if (h.severity === "high") map[t].high++;
      else if (h.severity === "medium") map[t].medium++;
      else map[t].low++;
    }
    return Object.entries(map).sort(([, a], [, b]) => b.critical - a.critical || b.high - a.high || b.total - a.total);
  }, [hazards]);

  if (typeGroups.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#EDE9FE" }}>
            <Layers className="w-5 h-5" style={{ color: "#7C3AED" }} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>Severity by Hazard Type</h2>
            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Risk profile ranked by severity across hazard categories</p>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-3">
        {typeGroups.map(([type, counts]) => {
          const total = counts.total;
          return (
            <div key={type} className="rounded-xl border px-4 py-3" style={{ background: "#FAFBFF", borderColor: "#E9EEF8" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
                  <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>{type}</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#374151" }}>{total} total</span>
              </div>
              <div className="flex items-center gap-px h-4 rounded-full overflow-hidden">
                {SEV_ORDER.map((sev) => {
                  const cnt = counts[sev] || 0;
                  if (!cnt) return null;
                  const pct = Math.round((cnt / total) * 100);
                  return (
                    <div key={sev} style={{ width: `${pct}%`, background: SEV_CFG[sev].color, minWidth: 16 }}
                      className="h-full flex items-center justify-center text-white text-[10px] font-bold">{cnt}</div>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {SEV_ORDER.map((sev) => {
                  const cnt = counts[sev] || 0;
                  if (!cnt) return null;
                  return (
                    <span key={sev} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ color: SEV_CFG[sev].color, background: SEV_CFG[sev].bg }}>
                      {cnt} {SEV_CFG[sev].label}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AllHazardsBySeveritySection({ hazards }: { hazards: Hazard[] }) {
  const sorted = useMemo(() =>
    [...hazards].sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity)), [hazards]);
  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FEE2E2" }}>
            <ShieldAlert className="w-5 h-5" style={{ color: "#DC2626" }} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>All Hazards — Severity Sorted</h2>
            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{sorted.length} hazards · highest severity first</p>
          </div>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
            {["Hazard", "Severity", "Status", "Type", "Site"].map((h) => (
              <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr><td colSpan={5} className="text-center py-12">
              <ShieldAlert className="w-8 h-8 mx-auto mb-2" style={{ color: "#E5E7EB" }} />
              <p className="text-[13px]" style={{ color: "#9CA3AF" }}>No hazards recorded yet</p>
            </td></tr>
          ) : sorted.map((h) => (
            <tr key={h.id} className="border-t hover:bg-blue-50/30 transition-colors" style={{ borderColor: "#F3F4F6" }}>
              <td className="px-5 py-3.5">
                <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{h.title || "—"}</div>
                <div className="text-[11px]" style={{ color: "#9CA3AF" }}>ID: {h.id.slice(0, 8)}</div>
              </td>
              <td className="px-5 py-3.5"><SevBadge sev={h.severity} /></td>
              <td className="px-5 py-3.5"><StatusBadge status={h.status} /></td>
              <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{h.type || "—"}</td>
              <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{h.site_id || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HazardSeverityTab({ hazards, isLoading, refetch }: { hazards: Hazard[]; isLoading: boolean; refetch: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={refetch} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] font-semibold bg-white hover:bg-gray-50 transition-colors"
          style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
          <RefreshCw className="w-3.5 h-3.5" />Refresh
        </button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-7 h-7 animate-spin" style={{ color: "#D1D5DB" }} /></div>
      ) : (
        <>
          <CriticalAlertSection hazards={hazards} />
          <SeverityDistributionSection hazards={hazards} />
          <SeverityByTypeSection hazards={hazards} />
          <AllHazardsBySeveritySection hazards={hazards} />
        </>
      )}
    </div>
  );
}

// ── TAB 3: Risk Controls ──────────────────────────────────────────────────────

function ControlOverviewSection({ hazards }: { hazards: Hazard[] }) {
  const withControls    = hazards.filter((h) => !!(h.mitigation?.trim()));
  const withoutControls = hazards.filter((h) => !(h.mitigation?.trim()));
  const effective       = withControls.filter((h) => ["mitigated", "closed"].includes(h.status)).length;
  const controlOpen     = withControls.filter((h) => h.status === "open").length;
  const coveragePct     = hazards.length > 0 ? Math.round((withControls.length / hazards.length) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#EDE9FE" }}>
            <Shield className="w-5 h-5" style={{ color: "#7C3AED" }} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>Risk Control Overview</h2>
            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Control coverage across all registered hazards</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold" style={{ color: "#374151" }}>Control Coverage</span>
            <span className="text-[13px] font-black" style={{ color: coveragePct >= 80 ? "#16A34A" : coveragePct >= 50 ? "#D97706" : "#DC2626" }}>{coveragePct}%</span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${coveragePct}%`, background: coveragePct >= 80 ? "#16A34A" : coveragePct >= 50 ? "#D97706" : "#DC2626" }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px]" style={{ color: "#9CA3AF" }}>0%</span>
            <span className="text-[10px]" style={{ color: "#9CA3AF" }}>Target: 100%</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "With Controls",      value: withControls.length,    color: "#7C3AED", bg: "#EDE9FE", Icon: Lock },
            { label: "Controls Effective", value: effective,               color: "#16A34A", bg: "#DCFCE7", Icon: CheckCircle2 },
            { label: "Controls Open",      value: controlOpen,             color: "#D97706", bg: "#FEF3C7", Icon: AlertTriangle },
            { label: "No Controls",        value: withoutControls.length,  color: "#DC2626", bg: "#FEE2E2", Icon: Unlock },
          ].map(({ label, value, color, bg, Icon }) => (
            <div key={label} className="rounded-xl border p-4 text-center" style={{ background: bg + "60", borderColor: color + "44" }}>
              <div className="flex items-center justify-center mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
              </div>
              <div className="text-[26px] font-black leading-none" style={{ color: "#111827" }}>{value}</div>
              <div className="text-[11px] font-semibold mt-1" style={{ color }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HazardsWithControlsSection({ hazards }: { hazards: Hazard[] }) {
  const withControls = useMemo(() =>
    hazards.filter((h) => !!(h.mitigation?.trim())).sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity)),
    [hazards]);

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#DCFCE7" }}>
            <CheckCircle2 className="w-5 h-5" style={{ color: "#16A34A" }} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>
              Hazards with Risk Controls
              <span className="ml-2 text-[12px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#DCFCE7", color: "#16A34A" }}>{withControls.length}</span>
            </h2>
            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Mitigation measures assigned and tracked</p>
          </div>
        </div>
      </div>
      {withControls.length === 0 ? (
        <div className="p-12 text-center">
          <Shield className="w-10 h-10 mx-auto mb-3" style={{ color: "#E5E7EB" }} />
          <p className="text-[13px]" style={{ color: "#9CA3AF" }}>No hazards have risk controls assigned yet</p>
        </div>
      ) : (
        <div className="p-6 space-y-3">
          {withControls.map((h) => (
            <div key={h.id} className="rounded-xl border p-4" style={{ background: "#FAFBFF", borderColor: "#E9EEF8" }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: sevCfg(h.severity).color }} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold truncate" style={{ color: "#111827" }}>{h.title || "—"}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>{h.type || "—"}</div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <SevBadge sev={h.severity} />
                  <StatusBadge status={h.status} />
                </div>
              </div>
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                <Shield className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#16A34A" }} />
                <p className="text-[12px]" style={{ color: "#166534" }}>{h.mitigation}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HazardsWithoutControlsSection({ hazards }: { hazards: Hazard[] }) {
  const withoutControls = useMemo(() =>
    hazards.filter((h) => !(h.mitigation?.trim())).sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity)),
    [hazards]);
  const criticalHigh = withoutControls.filter((h) => h.severity === "critical" || h.severity === "high").length;

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FEE2E2" }}>
            <XCircle className="w-5 h-5" style={{ color: "#DC2626" }} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>
              Hazards Without Controls
              <span className="ml-2 text-[12px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>{withoutControls.length}</span>
            </h2>
            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>No mitigation measure assigned — action required</p>
          </div>
        </div>
      </div>
      {withoutControls.length === 0 ? (
        <div className="p-12 text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: "#16A34A" }} />
          <p className="text-[14px] font-semibold" style={{ color: "#16A34A" }}>All hazards have risk controls assigned</p>
          <p className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>Excellent risk management coverage.</p>
        </div>
      ) : (
        <>
          {criticalHigh > 0 && (
            <div className="mx-6 mt-5 flex items-start gap-3 px-4 py-3 rounded-xl border" style={{ background: "#FFF7ED", borderColor: "#FED7AA" }}>
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#EA580C" }} />
              <p className="text-[12px] font-semibold" style={{ color: "#9A3412" }}>
                {criticalHigh} critical/high hazard{criticalHigh !== 1 ? "s" : ""} have no risk control — assign mitigation urgently.
              </p>
            </div>
          )}
          <table className="w-full text-sm mt-5">
            <thead>
              <tr style={{ background: "#FFF5F5", borderBottom: "1px solid #FEE2E2" }}>
                {["Hazard", "Type", "Severity", "Status", "Site", "Reported By"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#DC2626" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {withoutControls.map((h) => (
                <tr key={h.id} className="border-t hover:bg-red-50/30 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-5 py-3.5">
                    <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{h.title || "—"}</div>
                    <div className="text-[11px]" style={{ color: "#9CA3AF" }}>ID: {h.id.slice(0, 8)}</div>
                  </td>
                  <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{h.type || "—"}</td>
                  <td className="px-5 py-3.5"><SevBadge sev={h.severity} /></td>
                  <td className="px-5 py-3.5"><StatusBadge status={h.status} /></td>
                  <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{h.site_id || "—"}</td>
                  <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{h.reported_by ? String(h.reported_by).slice(0, 16) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

function RiskControlsTab({ hazards, isLoading, refetch }: { hazards: Hazard[]; isLoading: boolean; refetch: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={refetch} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] font-semibold bg-white hover:bg-gray-50 transition-colors"
          style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
          <RefreshCw className="w-3.5 h-3.5" />Refresh
        </button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-7 h-7 animate-spin" style={{ color: "#D1D5DB" }} /></div>
      ) : (
        <>
          <ControlOverviewSection hazards={hazards} />
          <HazardsWithControlsSection hazards={hazards} />
          <HazardsWithoutControlsSection hazards={hazards} />
        </>
      )}
    </div>
  );
}

// ── TAB 4: Site Mapping ───────────────────────────────────────────────────────

function SiteHazardCardsSection({ hazards }: { hazards: Hazard[] }) {
  const { data: sites = [] } = useGetSitesQuery();
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  const siteMap = useMemo(() => {
    const map: Record<string, { name: string; location: string; hazards: Hazard[] }> = {};
    for (const s of sites) map[s.Site_ID] = { name: s.Site_Name, location: s.Location, hazards: [] };
    for (const h of hazards) {
      const key = h.site_id || "__unassigned__";
      if (!map[key]) map[key] = { name: key === "__unassigned__" ? "Unassigned" : (h.site_id ?? "Unknown"), location: "—", hazards: [] };
      map[key].hazards.push(h);
    }
    return Object.entries(map)
      .map(([id, data]) => ({ id, ...data }))
      .filter((s) => s.hazards.length > 0)
      .sort((a, b) => {
        const critA = a.hazards.filter((h) => h.severity === "critical").length;
        const critB = b.hazards.filter((h) => h.severity === "critical").length;
        return critB - critA || b.hazards.length - a.hazards.length;
      });
  }, [hazards, sites]);

  const activeSite = selectedSiteId ? siteMap.find((s) => s.id === selectedSiteId) ?? null : null;
  const sitesWithHighRisk = siteMap.filter((s) => s.hazards.some((h) => h.severity === "critical" || h.severity === "high")).length;

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#DBEAFE" }}>
            <Building2 className="w-5 h-5" style={{ color: "#2563EB" }} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>Sites with Hazards</h2>
            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>
              {siteMap.length} site{siteMap.length !== 1 ? "s" : ""} · {sitesWithHighRisk} with critical/high hazards · click to expand
            </p>
          </div>
        </div>
      </div>
      <div className="p-6">
        {sitesWithHighRisk > 0 && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl border mb-5" style={{ background: "#EFF6FF", borderColor: "#BFDBFE" }}>
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#2563EB" }} />
            <p className="text-[12px] font-semibold" style={{ color: "#1E40AF" }}>
              {sitesWithHighRisk} site{sitesWithHighRisk !== 1 ? "s" : ""} have critical or high-severity hazards — review site safety plans.
            </p>
          </div>
        )}
        {siteMap.length === 0 ? (
          <div className="py-12 text-center">
            <Globe className="w-10 h-10 mx-auto mb-3" style={{ color: "#E5E7EB" }} />
            <p className="text-[14px] font-semibold" style={{ color: "#374151" }}>No site data available</p>
            <p className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>Hazards will appear here once they have site assignments.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            {siteMap.map((site) => {
              const critCount = site.hazards.filter((h) => h.severity === "critical").length;
              const highCount = site.hazards.filter((h) => h.severity === "high").length;
              const openCount = site.hazards.filter((h) => h.status === "open").length;
              const isSelected = selectedSiteId === site.id;
              const riskColor = critCount > 0 ? "#DC2626" : highCount > 0 ? "#EA580C" : openCount > 0 ? "#D97706" : "#16A34A";
              const riskBg    = critCount > 0 ? "#FEE2E2" : highCount > 0 ? "#FFEDD5" : openCount > 0 ? "#FEF3C7" : "#DCFCE7";
              return (
                <button key={site.id} onClick={() => setSelectedSiteId(isSelected ? null : site.id)}
                  className="text-left rounded-xl border p-4 transition-all"
                  style={{ background: isSelected ? "#EEF2FF" : "#FAFBFF", borderColor: isSelected ? "#6366F1" : "#E9EEF8", boxShadow: isSelected ? "0 0 0 2px #6366F133" : "none" }}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="text-[13px] font-bold" style={{ color: "#111827" }}>{site.name}</div>
                      {site.location && site.location !== "—" && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" style={{ color: "#9CA3AF" }} />
                          <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{site.location}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: riskBg, color: riskColor }}>
                      {site.hazards.length} hazard{site.hazards.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {critCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>{critCount} critical</span>}
                    {highCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FFEDD5", color: "#EA580C" }}>{highCount} high</span>}
                    {openCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>{openCount} open</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {activeSite && (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#C7D2FE", background: "#EEF2FF" }}>
            <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "#C7D2FE", background: "#E0E7FF" }}>
              <MapPin className="w-4 h-4" style={{ color: "#6366F1" }} />
              <span className="text-[13px] font-bold" style={{ color: "#3730A3" }}>{activeSite.name} — Hazard Detail</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#EEF2FF", borderBottom: "1px solid #C7D2FE" }}>
                  {["Hazard", "Severity", "Status", "Zone", "Reporter"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#6366F1" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeSite.hazards.sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity)).map((h) => (
                  <tr key={h.id} className="border-t bg-white" style={{ borderColor: "#E0E7FF" }}>
                    <td className="px-4 py-3">
                      <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{h.title || "—"}</div>
                      <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{h.type || "—"}</div>
                    </td>
                    <td className="px-4 py-3"><SevBadge sev={h.severity} /></td>
                    <td className="px-4 py-3"><StatusBadge status={h.status} /></td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: "#6B7280" }}>{h.zone_id || "—"}</td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: "#6B7280" }}>{h.reported_by ? String(h.reported_by).slice(0, 16) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ZoneDistributionSection({ hazards }: { hazards: Hazard[] }) {
  const { data: zones = [] } = useGetZonesQuery();

  const zoneMap = useMemo(() => {
    const map: Record<string, { name: string; type: string; riskScore: number; hazards: Hazard[] }> = {};
    for (const z of zones) map[z.Zone_ID] = { name: z.Zone_Name, type: z.Zone_Type, riskScore: z.Risk_Score, hazards: [] };
    for (const h of hazards) {
      if (!h.zone_id) continue;
      if (!map[h.zone_id]) map[h.zone_id] = { name: h.zone_id, type: "—", riskScore: 0, hazards: [] };
      map[h.zone_id].hazards.push(h);
    }
    return Object.entries(map)
      .map(([id, data]) => ({ id, ...data }))
      .filter((z) => z.hazards.length > 0)
      .sort((a, b) => {
        const critA = a.hazards.filter((h) => h.severity === "critical").length;
        const critB = b.hazards.filter((h) => h.severity === "critical").length;
        return critB - critA || b.hazards.length - a.hazards.length;
      });
  }, [hazards, zones]);

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FEF3C7" }}>
            <Layers className="w-5 h-5" style={{ color: "#D97706" }} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>Zone-Level Hazard Distribution</h2>
            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Hazard counts and risk scores by zone</p>
          </div>
        </div>
      </div>
      {zoneMap.length === 0 ? (
        <div className="p-12 text-center">
          <Layers className="w-10 h-10 mx-auto mb-3" style={{ color: "#E5E7EB" }} />
          <p className="text-[13px]" style={{ color: "#9CA3AF" }}>No zones with hazards found</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
              {["Zone", "Type", "Risk Score", "Hazards", "Worst Severity", "Open"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {zoneMap.map((z) => {
              const worst = z.hazards.reduce<Hazard["severity"] | null>((acc, h) => {
                if (!acc) return h.severity;
                return SEV_ORDER.indexOf(h.severity) < SEV_ORDER.indexOf(acc) ? h.severity : acc;
              }, null);
              const openCount = z.hazards.filter((h) => h.status === "open").length;
              return (
                <tr key={z.id} className="border-t hover:bg-blue-50/20 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-5 py-3.5">
                    <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{z.name}</div>
                    <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{z.id}</div>
                  </td>
                  <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{z.type || "—"}</td>
                  <td className="px-5 py-3.5">
                    {z.riskScore > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min(z.riskScore, 100)}%`, background: z.riskScore >= 75 ? "#DC2626" : z.riskScore >= 50 ? "#EA580C" : z.riskScore >= 25 ? "#D97706" : "#16A34A" }} />
                        </div>
                        <span className="text-[12px] font-semibold" style={{ color: "#374151" }}>{z.riskScore}</span>
                      </div>
                    ) : <span className="text-[11px]" style={{ color: "#9CA3AF" }}>N/A</span>}
                  </td>
                  <td className="px-5 py-3.5 text-[13px] font-semibold" style={{ color: "#111827" }}>{z.hazards.length}</td>
                  <td className="px-5 py-3.5">{worst ? <SevBadge sev={worst} /> : "—"}</td>
                  <td className="px-5 py-3.5">
                    {openCount > 0
                      ? <span className="text-[12px] font-bold" style={{ color: "#DC2626" }}>{openCount} open</span>
                      : <span className="text-[11px]" style={{ color: "#16A34A" }}>All controlled</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function UnassignedHazardsSection({ hazards }: { hazards: Hazard[] }) {
  const unassigned = useMemo(() =>
    hazards.filter((h) => !h.site_id).sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity)),
    [hazards]);
  if (unassigned.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FEF3C7" }}>
            <Clock className="w-5 h-5" style={{ color: "#D97706" }} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>
              Unassigned Hazards
              <span className="ml-2 text-[12px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#D97706" }}>{unassigned.length}</span>
            </h2>
            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Hazards with no site linked — assign to a site for full mapping</p>
          </div>
        </div>
      </div>
      <div className="p-6 flex flex-wrap gap-2">
        {unassigned.map((h) => (
          <div key={h.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-medium"
            style={{ background: "#FFFBEB", borderColor: "#FDE68A", color: "#92400E" }}>
            <ShieldAlert className="w-3.5 h-3.5" style={{ color: sevCfg(h.severity).color }} />
            {h.title || "—"}
            <span className="font-bold ml-1" style={{ color: sevCfg(h.severity).color }}>({h.severity})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SiteMappingTab({ hazards, isLoading }: { hazards: Hazard[]; isLoading: boolean }) {
  const { isLoading: l2, refetch: r2 } = useGetSitesQuery();
  const { isLoading: l3, refetch: r3 } = useGetZonesQuery();
  const loading = isLoading || l2 || l3;
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => { r2(); r3(); }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] font-semibold bg-white hover:bg-gray-50 transition-colors"
          style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
          <RefreshCw className="w-3.5 h-3.5" />Refresh
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-7 h-7 animate-spin" style={{ color: "#D1D5DB" }} /></div>
      ) : (
        <>
          <SiteHazardCardsSection hazards={hazards} />
          <ZoneDistributionSection hazards={hazards} />
          <UnassignedHazardsSection hazards={hazards} />
        </>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string }[] = [
  { key: "list",     label: "Hazard List" },
  { key: "severity", label: "Hazard Severity" },
  { key: "controls", label: "Risk Controls" },
  { key: "mapping",  label: "Site Mapping" },
];

export function HazardListPage() {
  const { data: hazards = [], isLoading, refetch } = useListHazardsQuery();
  const [activeTab, setActiveTab] = useState<Tab>("list");

  const total     = hazards.length;
  const open      = hazards.filter((h) => h.status === "open").length;
  const critical  = hazards.filter((h) => h.severity === "critical").length;
  const mitigated = hazards.filter((h) => h.status === "mitigated").length;

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>
      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, #450A0A 0%, #1C1917 100%)" }}>
        <div className="px-8 pt-8 pb-0">
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Risk Module</p>
          <h1 className="text-[26px] font-black text-white">Hazard Register</h1>
          <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Identify, classify, control, and map all workplace hazards
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex border-t mt-6 divide-x" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <HeroStat label="Total Hazards" value={isLoading ? "…" : total} />
          <HeroStat label="Open"          value={isLoading ? "…" : open}      color="#FCA5A5" />
          <HeroStat label="Critical"      value={isLoading ? "…" : critical}  color="#FCA5A5" />
          <HeroStat label="Mitigated"     value={isLoading ? "…" : mitigated} color="#86EFAC" />
        </div>

        {/* Tab bar */}
        <div className="px-6 pt-4 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="px-5 py-2.5 text-[13px] font-semibold rounded-t-xl transition-all whitespace-nowrap"
              style={activeTab === tab.key
                ? { background: "#F5F7FF", color: "#111827" }
                : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.65)" }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === "list"     && <HazardListTab     hazards={hazards} isLoading={isLoading} refetch={refetch} />}
        {activeTab === "severity" && <HazardSeverityTab hazards={hazards} isLoading={isLoading} refetch={refetch} />}
        {activeTab === "controls" && <RiskControlsTab   hazards={hazards} isLoading={isLoading} refetch={refetch} />}
        {activeTab === "mapping"  && <SiteMappingTab    hazards={hazards} isLoading={isLoading} />}
      </div>
    </div>
  );
}
