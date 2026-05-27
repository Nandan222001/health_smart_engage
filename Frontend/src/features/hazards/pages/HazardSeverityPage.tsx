import { useMemo } from "react";
import {
  ShieldAlert, AlertTriangle, AlertCircle, CheckCircle2,
  Flame, Layers, BarChart3, Loader2, RefreshCw,
} from "lucide-react";
import { useListHazardsQuery } from "@/features/hazards/api/hazardsApi";
import type { Hazard } from "@/features/hazards/api/hazardsApi";

// ── Helpers ─────────────────────────────────────────────────────────────────

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

function sevCfg(s: string) { return SEV_CFG[s?.toLowerCase()] ?? SEV_CFG.low; }

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

// ── Severity Distribution Section ────────────────────────────────────────────

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

// ── Critical Alert Section ────────────────────────────────────────────────────

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

// ── Severity by Type Section ─────────────────────────────────────────────────

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
    return Object.entries(map)
      .sort(([, a], [, b]) => b.critical - a.critical || b.high - a.high || b.total - a.total);
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
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#374151" }}>
                  {total} total
                </span>
              </div>
              <div className="flex items-center gap-px h-4 rounded-full overflow-hidden">
                {SEV_ORDER.map((sev) => {
                  const cnt = counts[sev] || 0;
                  if (!cnt) return null;
                  const pct = Math.round((cnt / total) * 100);
                  return (
                    <div key={sev} style={{ width: `${pct}%`, background: SEV_CFG[sev].color, minWidth: 16 }}
                      className="h-full flex items-center justify-center text-white text-[10px] font-bold">
                      {cnt}
                    </div>
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

// ── All Hazards Table ────────────────────────────────────────────────────────

function AllHazardsBySeveritySection({ hazards }: { hazards: Hazard[] }) {
  const sorted = useMemo(() =>
    [...hazards].sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity)),
    [hazards],
  );

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
            <tr>
              <td colSpan={5} className="text-center py-12">
                <ShieldAlert className="w-8 h-8 mx-auto mb-2" style={{ color: "#E5E7EB" }} />
                <p className="text-[13px]" style={{ color: "#9CA3AF" }}>No hazards recorded yet</p>
              </td>
            </tr>
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

// ── Main Page ────────────────────────────────────────────────────────────────

export function HazardSeverityPage() {
  const { data: hazards = [], isLoading, refetch } = useListHazardsQuery();

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const h of hazards) { const s = h.severity?.toLowerCase(); m[s] = (m[s] || 0) + 1; }
    return m;
  }, [hazards]);

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>
      <div style={{ background: "linear-gradient(135deg, #7C2D12 0%, #1C1917 100%)" }}>
        <div className="px-8 pt-8 pb-0">
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Hazard Register</p>
          <h1 className="text-[26px] font-black text-white">Hazard Severity</h1>
          <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Severity classification · Risk profiling · Type analysis
          </p>
        </div>
        <div className="flex border-t mt-6 divide-x" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <HeroStat label="Critical" value={isLoading ? "…" : (counts.critical || 0)} color="#FCA5A5" />
          <HeroStat label="High"     value={isLoading ? "…" : (counts.high || 0)}     color="#FDB898" />
          <HeroStat label="Medium"   value={isLoading ? "…" : (counts.medium || 0)}   color="#FCD34D" />
          <HeroStat label="Low"      value={isLoading ? "…" : (counts.low || 0)}      color="#86EFAC" />
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <button onClick={() => refetch()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] font-semibold bg-white hover:bg-gray-50 transition-colors"
            style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#D1D5DB" }} />
          </div>
        ) : (
          <>
            <CriticalAlertSection hazards={hazards} />
            <SeverityDistributionSection hazards={hazards} />
            <SeverityByTypeSection hazards={hazards} />
            <AllHazardsBySeveritySection hazards={hazards} />
          </>
        )}
      </div>
    </div>
  );
}
