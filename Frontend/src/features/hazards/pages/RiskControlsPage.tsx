import { useMemo } from "react";
import {
  Shield, ShieldAlert, CheckCircle2, XCircle,
  AlertTriangle, Loader2, RefreshCw, Lock, Unlock,
} from "lucide-react";
import { useListHazardsQuery } from "@/features/hazards/api/hazardsApi";
import type { Hazard } from "@/features/hazards/api/hazardsApi";

// ── Helpers ─────────────────────────────────────────────────────────────────

const SEV_ORDER: Hazard["severity"][] = ["critical", "high", "medium", "low"];

const SEV_CFG: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: "#DC2626", bg: "#FEE2E2", label: "Critical" },
  high:     { color: "#EA580C", bg: "#FFEDD5", label: "High" },
  medium:   { color: "#D97706", bg: "#FEF3C7", label: "Medium" },
  low:      { color: "#16A34A", bg: "#DCFCE7", label: "Low" },
};

const ST_CFG: Record<string, { color: string; bg: string }> = {
  open:      { color: "#DC2626", bg: "#FEE2E2" },
  mitigated: { color: "#16A34A", bg: "#DCFCE7" },
  closed:    { color: "#6B7280", bg: "#F3F4F6" },
};

function sevCfg(s: string) { return SEV_CFG[s?.toLowerCase()] ?? { color: "#6B7280", bg: "#F3F4F6", label: s }; }

function SevBadge({ sev }: { sev: string }) {
  const cfg = sevCfg(sev);
  return <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize" style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const cfg = ST_CFG[status?.toLowerCase()] ?? ST_CFG.open;
  return <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize" style={{ color: cfg.color, background: cfg.bg }}>{status}</span>;
}

function HeroStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex-1 px-6 py-4 text-center">
      <div className="text-[26px] font-black text-white leading-none">{value}</div>
      <div className="text-[11px] font-semibold mt-1 uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.55)" }}>{label}</div>
    </div>
  );
}

// ── Control Overview Section ──────────────────────────────────────────────────

function ControlOverviewSection({ hazards }: { hazards: Hazard[] }) {
  const withControls    = hazards.filter((h) => !!(h.mitigation?.trim()));
  const withoutControls = hazards.filter((h) => !(h.mitigation?.trim()));
  const effective       = withControls.filter((h) => ["mitigated", "closed"].includes(h.status)).length;
  const controlOpen     = withControls.filter((h) => h.status === "open").length;

  const coveragePct = hazards.length > 0 ? Math.round((withControls.length / hazards.length) * 100) : 0;

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
        {/* Coverage bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold" style={{ color: "#374151" }}>Control Coverage</span>
            <span className="text-[13px] font-black" style={{ color: coveragePct >= 80 ? "#16A34A" : coveragePct >= 50 ? "#D97706" : "#DC2626" }}>
              {coveragePct}%
            </span>
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

        {/* Tally grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "With Controls",      value: withControls.length,    color: "#7C3AED", bg: "#EDE9FE",  Icon: Lock },
            { label: "Controls Effective", value: effective,               color: "#16A34A", bg: "#DCFCE7",  Icon: CheckCircle2 },
            { label: "Controls Open",      value: controlOpen,             color: "#D97706", bg: "#FEF3C7",  Icon: AlertTriangle },
            { label: "No Controls",        value: withoutControls.length,  color: "#DC2626", bg: "#FEE2E2",  Icon: Unlock },
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

// ── Hazards With Controls Section ─────────────────────────────────────────────

function HazardsWithControlsSection({ hazards }: { hazards: Hazard[] }) {
  const withControls = useMemo(() =>
    hazards
      .filter((h) => !!(h.mitigation?.trim()))
      .sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity)),
    [hazards],
  );

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
              <span className="ml-2 text-[12px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#DCFCE7", color: "#16A34A" }}>
                {withControls.length}
              </span>
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

// ── Hazards Without Controls Section ─────────────────────────────────────────

function HazardsWithoutControlsSection({ hazards }: { hazards: Hazard[] }) {
  const withoutControls = useMemo(() =>
    hazards
      .filter((h) => !(h.mitigation?.trim()))
      .sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity)),
    [hazards],
  );

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
              <span className="ml-2 text-[12px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                {withoutControls.length}
              </span>
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

// ── Main Page ────────────────────────────────────────────────────────────────

export function RiskControlsPage() {
  const { data: hazards = [], isLoading, refetch } = useListHazardsQuery();

  const withControls    = hazards.filter((h) => !!(h.mitigation?.trim())).length;
  const withoutControls = hazards.length - withControls;
  const effective       = hazards.filter((h) => !!(h.mitigation?.trim()) && ["mitigated", "closed"].includes(h.status)).length;

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>
      <div style={{ background: "linear-gradient(135deg, #3B0764 0%, #1C1917 100%)" }}>
        <div className="px-8 pt-8 pb-0">
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Hazard Register</p>
          <h1 className="text-[26px] font-black text-white">Risk Controls</h1>
          <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Mitigation measures · Control effectiveness · Uncontrolled hazards
          </p>
        </div>
        <div className="flex border-t mt-6 divide-x" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <HeroStat label="With Controls"    value={isLoading ? "…" : withControls} />
          <HeroStat label="Controls Effective" value={isLoading ? "…" : effective} />
          <HeroStat label="No Controls"      value={isLoading ? "…" : withoutControls} />
          <HeroStat label="Total Hazards"    value={isLoading ? "…" : hazards.length} />
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
            <ControlOverviewSection hazards={hazards} />
            <HazardsWithControlsSection hazards={hazards} />
            <HazardsWithoutControlsSection hazards={hazards} />
          </>
        )}
      </div>
    </div>
  );
}
