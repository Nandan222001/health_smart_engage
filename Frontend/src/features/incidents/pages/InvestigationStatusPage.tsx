import { useMemo, useState } from "react";
import {
  Search, ClipboardList, CheckCircle2, Clock, XCircle,
  AlertTriangle, Loader2, RefreshCw, UserCheck, GitBranch,
} from "lucide-react";
import {
  useListIncidentsQuery,
  useListInvestigationsQuery,
} from "@/features/incidents/api/incidentsApi";
import type { Investigation, Incident } from "@/features/incidents/api/incidentsApi";

// ── Helpers ─────────────────────────────────────────────────────────────────

const INV_STATUS_CFG: Record<string, { color: string; bg: string; Icon: React.ElementType; label: string }> = {
  open:        { color: "#D97706", bg: "#FEF3C7", Icon: Clock,         label: "Open" },
  in_progress: { color: "#2563EB", bg: "#DBEAFE", Icon: ClipboardList, label: "In Progress" },
  completed:   { color: "#16A34A", bg: "#DCFCE7", Icon: CheckCircle2,  label: "Completed" },
  closed:      { color: "#6B7280", bg: "#F3F4F6", Icon: XCircle,       label: "Closed" },
};

function invStatusCfg(s: string) {
  return INV_STATUS_CFG[s?.toLowerCase()] ?? INV_STATUS_CFG.open;
}

const RCA_METHODS: Record<string, { color: string; bg: string }> = {
  "5-why":         { color: "#2563EB", bg: "#DBEAFE" },
  "fishbone":      { color: "#7C3AED", bg: "#EDE9FE" },
  "fault-tree":    { color: "#D97706", bg: "#FEF3C7" },
  "bow-tie":       { color: "#16A34A", bg: "#DCFCE7" },
  "timeline":      { color: "#EA580C", bg: "#FFEDD5" },
};

function rcaCfg(method: string) {
  return RCA_METHODS[method?.toLowerCase()] ?? { color: "#6B7280", bg: "#F3F4F6" };
}

function HeroStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex-1 px-6 py-4 text-center">
      <div className="text-[26px] font-black text-white leading-none">{value}</div>
      <div className="text-[11px] font-semibold mt-1 uppercase tracking-wide"
        style={{ color: "rgba(255,255,255,0.55)" }}>{label}</div>
    </div>
  );
}

function InvStatusBadge({ status }: { status: string }) {
  const cfg = invStatusCfg(status);
  const Icon = cfg.Icon;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize"
      style={{ color: cfg.color, background: cfg.bg }}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const color = severity === "critical" ? "#DC2626" : severity === "high" ? "#EA580C"
    : severity === "medium" ? "#D97706" : "#16A34A";
  const bg = severity === "critical" ? "#FEE2E2" : severity === "high" ? "#FFEDD5"
    : severity === "medium" ? "#FEF3C7" : "#DCFCE7";
  return (
    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize"
      style={{ color, background: bg }}>
      {severity || "—"}
    </span>
  );
}

// ── Active Investigations Section ─────────────────────────────────────────────

function ActiveInvestigationsSection({
  investigations,
  incidentMap,
}: {
  investigations: Investigation[];
  incidentMap: Map<string, Incident>;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return investigations.filter((inv) => {
      const inc = incidentMap.get(inv.incident_id);
      const matchQ = !q
        || inv.id.toLowerCase().includes(q)
        || (inv.lead_investigator || "").toLowerCase().includes(q)
        || (inc?.title || "").toLowerCase().includes(q);
      const matchStatus = !statusFilter || inv.status?.toLowerCase() === statusFilter;
      return matchQ && matchStatus;
    });
  }, [investigations, incidentMap, search, statusFilter]);

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-6 pt-5 pb-4 border-b flex flex-wrap items-center gap-3" style={{ borderColor: "#F3F4F6" }}>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#DBEAFE" }}>
            <ClipboardList className="w-5 h-5" style={{ color: "#2563EB" }} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>All Investigations</h2>
            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{filtered.length} record{filtered.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#9CA3AF" }} />
          <input
            className="pl-8 pr-3 py-2 rounded-xl border text-[12px] outline-none"
            style={{ borderColor: "#E5E7EB", width: 200 }}
            placeholder="Search investigations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 rounded-xl border text-[12px] outline-none"
          style={{ borderColor: "#E5E7EB" }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {Object.entries(INV_STATUS_CFG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
            {["Linked Incident", "Severity", "Lead Investigator", "RCA Method", "Status", "Started"].map((h) => (
              <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-14">
                <ClipboardList className="w-10 h-10 mx-auto mb-3" style={{ color: "#E5E7EB" }} />
                <p className="text-[14px] font-semibold" style={{ color: "#374151" }}>No investigations found</p>
                <p className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>
                  Investigations are started from the Incident Reports screen.
                </p>
              </td>
            </tr>
          ) : (
            filtered.map((inv) => {
              const inc = incidentMap.get(inv.incident_id);
              const rca = rcaCfg(inv.rca_method);
              return (
                <tr key={inv.id} className="border-t hover:bg-blue-50/30 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#D97706" }} />
                      <div>
                        <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>
                          {inc?.title || "Incident " + inv.incident_id.slice(0, 8)}
                        </div>
                        <div className="text-[11px]" style={{ color: "#9CA3AF" }}>ID: {inv.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <SeverityBadge severity={inc?.severity || "—"} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" style={{ color: "#9CA3AF" }} />
                      <span className="text-[12px]" style={{ color: "#374151" }}>
                        {inv.lead_investigator ? inv.lead_investigator.slice(0, 20) : "Unassigned"}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase"
                      style={{ color: rca.color, background: rca.bg }}>
                      {inv.rca_method || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <InvStatusBadge status={inv.status} />
                  </td>
                  <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>
                    {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "—"}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Investigation Pipeline Section ────────────────────────────────────────────

function InvestigationPipelineSection({ investigations }: { investigations: Investigation[] }) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const inv of investigations) {
      const s = inv.status?.toLowerCase() || "open";
      map[s] = (map[s] || 0) + 1;
    }
    return map;
  }, [investigations]);

  const pipeline = Object.entries(INV_STATUS_CFG).map(([key, cfg]) => ({
    key, ...cfg, count: counts[key] || 0,
  }));

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#EDE9FE" }}>
            <GitBranch className="w-5 h-5" style={{ color: "#7C3AED" }} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>Investigation Pipeline</h2>
            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Status breakdown across all investigations</p>
          </div>
        </div>
      </div>
      <div className="p-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {pipeline.map(({ key, label, color, bg, Icon, count }) => (
          <div key={key} className="rounded-2xl border p-4" style={{ borderColor: "#E5E7EB" }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <span className="text-[12px] font-bold" style={{ color }}>{label}</span>
            </div>
            <div className="text-[28px] font-black leading-none" style={{ color: "#111827" }}>{count}</div>
            <p className="text-[11px] mt-1" style={{ color: "#9CA3AF" }}>investigations</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Incident Investigation Candidates ─────────────────────────────────────────

function InvestigationCandidatesSection({
  incidents,
  investigatedIds,
}: {
  incidents: Incident[];
  investigatedIds: Set<string>;
}) {
  const candidates = useMemo(() =>
    incidents
      .filter((i) => i.status === "investigating" || (["open", "reported"].includes(i.status) && !investigatedIds.has(i.id)))
      .sort((a, b) => {
        const order = ["critical", "high", "medium", "low", "unclassified"];
        return order.indexOf(a.severity?.toLowerCase()) - order.indexOf(b.severity?.toLowerCase());
      })
      .slice(0, 8),
    [incidents, investigatedIds],
  );

  if (candidates.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FEF3C7" }}>
            <AlertTriangle className="w-5 h-5" style={{ color: "#D97706" }} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold" style={{ color: "#111827" }}>Pending Investigation</h2>
            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Incidents requiring investigation review</p>
          </div>
        </div>
      </div>
      <div className="divide-y" style={{ divideColor: "#F3F4F6" }}>
        {candidates.map((inc) => {
          const sevColor = inc.severity === "critical" ? "#DC2626" : inc.severity === "high" ? "#EA580C"
            : inc.severity === "medium" ? "#D97706" : "#16A34A";
          return (
            <div key={inc.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sevColor }} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate" style={{ color: "#111827" }}>{inc.title || "Untitled"}</div>
                <div className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>{inc.type || "Unknown type"}</div>
              </div>
              <SeverityBadge severity={inc.severity} />
              <span className="text-[11px]" style={{ color: "#9CA3AF" }}>
                {inc.occurred_at ? new Date(inc.occurred_at).toLocaleDateString() : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function InvestigationStatusPage() {
  const { data: incidents = [],      isLoading: l1, refetch: r1 } = useListIncidentsQuery();
  const { data: investigations = [], isLoading: l2, refetch: r2 } = useListInvestigationsQuery();
  const isLoading = l1 || l2;

  const incidentMap = useMemo(() => {
    const m = new Map<string, Incident>();
    for (const i of incidents) m.set(i.id, i);
    return m;
  }, [incidents]);

  const investigatedIds = useMemo(() => new Set(investigations.map((i) => i.incident_id)), [investigations]);

  const open        = investigations.filter((i) => i.status === "open").length;
  const inProgress  = investigations.filter((i) => i.status === "in_progress").length;
  const completed   = investigations.filter((i) => ["completed", "closed"].includes(i.status)).length;

  const handleRefresh = () => { r1(); r2(); };

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>
      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #0F172A 100%)" }}>
        <div className="px-8 pt-8 pb-0">
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Incident Management
          </p>
          <h1 className="text-[26px] font-black text-white">Investigation Status</h1>
          <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Active investigations · Pipeline status · RCA tracking
          </p>
        </div>
        <div className="flex border-t mt-6 divide-x" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <HeroStat label="Total Investigations" value={isLoading ? "…" : investigations.length} />
          <HeroStat label="Open"                  value={isLoading ? "…" : open} />
          <HeroStat label="In Progress"           value={isLoading ? "…" : inProgress} />
          <HeroStat label="Completed"             value={isLoading ? "…" : completed} />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Refresh */}
        <div className="flex justify-end">
          <button onClick={handleRefresh} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] font-semibold bg-white transition-colors hover:bg-gray-50"
            style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#D1D5DB" }} />
          </div>
        ) : (
          <>
            <InvestigationPipelineSection investigations={investigations} />
            <InvestigationCandidatesSection incidents={incidents} investigatedIds={investigatedIds} />
            <ActiveInvestigationsSection investigations={investigations} incidentMap={incidentMap} />
          </>
        )}
      </div>
    </div>
  );
}
