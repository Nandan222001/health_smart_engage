import { useMemo } from "react";
import {
  Wrench, Clock, AlertTriangle, BarChart3,
  RefreshCw, Calendar, User, DollarSign,
  CheckCircle2, XCircle, Package, TrendingDown,
} from "lucide-react";
import {
  useGetMaintenanceLogsQuery,
  useGetAssetsQuery,
  type AssetMaintenanceLog,
  type Asset,
} from "@/features/assets/api/assetsApi";

// ── Helpers ────────────────────────────────────────────────────────────────

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function isCompleted(log: AssetMaintenanceLog) {
  return log.status === "completed" || log.status === "done";
}

function isBreakdown(log: AssetMaintenanceLog) {
  const t = (log.work_type ?? "").toLowerCase();
  return t.includes("breakdown") || t.includes("emergency") || t.includes("corrective") || t.includes("repair");
}

function isPast(dateStr: string | null) {
  if (!dateStr) return false;
  return new Date(dateStr) < TODAY;
}

function isUpcoming(dateStr: string | null) {
  if (!dateStr) return false;
  return new Date(dateStr) >= TODAY;
}

function daysDiff(dateStr: string) {
  const d = new Date(dateStr);
  return Math.round((d.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
}

function statusCfg(s: string) {
  if (s === "completed" || s === "done")
    return { color: "#059669", bg: "#D1FAE5", Icon: CheckCircle2 };
  if (s === "in_progress" || s === "in-progress")
    return { color: "#2563EB", bg: "#EFF6FF", Icon: Wrench };
  if (s === "overdue")
    return { color: "#DC2626", bg: "#FEE2E2", Icon: XCircle };
  return { color: "#D97706", bg: "#FEF3C7", Icon: Clock };
}

function workTypeCfg(w: string) {
  const t = w.toLowerCase();
  if (t.includes("breakdown") || t.includes("emergency"))
    return { color: "#DC2626", bg: "#FEF2F2" };
  if (t.includes("corrective") || t.includes("repair"))
    return { color: "#D97706", bg: "#FFFBEB" };
  if (t.includes("preventive") || t.includes("scheduled"))
    return { color: "#059669", bg: "#F0FDF4" };
  if (t.includes("inspection"))
    return { color: "#2563EB", bg: "#EFF6FF" };
  return { color: "#6B7280", bg: "#F9FAFB" };
}

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleDateString() : "—";
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap"
      style={{ color, background: bg }}>
      {label}
    </span>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────

function Section({
  icon: Icon, title, subtitle, accent, count, children,
}: {
  icon: React.ElementType; title: string; subtitle: string;
  accent: string; count: number; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: "#F3F4F6" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: accent + "18" }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>{title}</h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: accent + "15", color: accent }}>{count}</span>
          </div>
          <p className="text-[12px]" style={{ color: "#9CA3AF" }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="py-12 text-center">
      <Wrench className="w-8 h-8 mx-auto mb-2 text-gray-200" />
      <p className="text-[13px] text-gray-400">{text}</p>
    </div>
  );
}

// ── Section 1: Maintenance History ─────────────────────────────────────────

function MaintenanceHistorySection({ logs }: { logs: AssetMaintenanceLog[] }) {
  const history = useMemo(
    () =>
      [...logs]
        .filter((l) => isCompleted(l) || isPast(l.performed_on))
        .sort((a, b) =>
          new Date(b.performed_on ?? "").getTime() - new Date(a.performed_on ?? "").getTime(),
        ),
    [logs],
  );

  const totalCost = history.reduce((s, l) => s + (l.cost ?? 0), 0);

  return (
    <Section icon={Wrench} title="Maintenance History" accent="#059669" count={history.length}
      subtitle="Completed and past maintenance records">

      {history.length > 0 && (
        <div className="flex items-center gap-6 px-6 py-3 border-b" style={{ borderColor: "#F3F4F6", background: "#F0FDF4" }}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" style={{ color: "#059669" }} />
            <span className="text-[12px] font-semibold text-gray-600">{history.length} completed jobs</span>
          </div>
          {totalCost > 0 && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" style={{ color: "#059669" }} />
              <span className="text-[12px] font-bold" style={{ color: "#059669" }}>
                ${totalCost.toLocaleString()} total cost
              </span>
            </div>
          )}
        </div>
      )}

      {history.length === 0 ? <Empty text="No maintenance history found." /> : (
        <div className="divide-y" style={{ divideColor: "#F9FAFB" }}>
          {history.map((l) => {
            const sc  = statusCfg(l.status);
            const wtc = workTypeCfg(l.work_type);
            const SIcon = sc.Icon;
            return (
              <div key={l.id}
                className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: sc.bg }}>
                  <SIcon className="w-4 h-4" style={{ color: sc.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="text-[13px] font-bold" style={{ color: "#111827" }}>
                      {l.asset_name || l.asset_code}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                      {l.asset_code}
                    </span>
                    <Badge label={l.work_type} color={wtc.color} bg={wtc.bg} />
                  </div>
                  {l.description && (
                    <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: "#6B7280" }}>{l.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    {l.performed_on && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-[11px] text-gray-500">{fmt(l.performed_on)}</span>
                      </div>
                    )}
                    {l.performed_by && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-[11px] text-gray-500">{l.performed_by}</span>
                      </div>
                    )}
                    {l.cost != null && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-gray-400" />
                        <span className="text-[11px] text-gray-500">${l.cost.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Badge label={l.status} color={sc.color} bg={sc.bg} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

// ── Section 2: Upcoming Maintenance ───────────────────────────────────────

function UpcomingMaintenanceSection({ assets }: { assets: Asset[] }) {
  const upcoming = useMemo(
    () =>
      [...assets]
        .filter((a) => isUpcoming(a.next_maintenance_date))
        .sort(
          (a, b) =>
            new Date(a.next_maintenance_date!).getTime() -
            new Date(b.next_maintenance_date!).getTime(),
        ),
    [assets],
  );

  const overdue = assets.filter(
    (a) => a.next_maintenance_date && !isUpcoming(a.next_maintenance_date),
  );

  const due7   = upcoming.filter((a) => daysDiff(a.next_maintenance_date!) <= 7).length;
  const due30  = upcoming.filter((a) => daysDiff(a.next_maintenance_date!) <= 30 && daysDiff(a.next_maintenance_date!) > 7).length;

  return (
    <Section icon={Clock} title="Upcoming Maintenance" accent="#2563EB" count={upcoming.length}
      subtitle="Scheduled maintenance due for each asset">

      {(upcoming.length > 0 || overdue.length > 0) && (
        <div className="flex items-center gap-6 px-6 py-3 border-b" style={{ borderColor: "#F3F4F6", background: "#EFF6FF" }}>
          {overdue.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[11px] font-semibold text-red-600">{overdue.length} overdue</span>
            </div>
          )}
          {due7 > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[11px] font-semibold text-amber-600">{due7} due this week</span>
            </div>
          )}
          {due30 > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[11px] font-semibold text-blue-600">{due30} due this month</span>
            </div>
          )}
        </div>
      )}

      {upcoming.length === 0 ? <Empty text="No upcoming maintenance scheduled." /> : (
        <div className="divide-y" style={{ divideColor: "#F9FAFB" }}>
          {upcoming.map((a) => {
            const days = daysDiff(a.next_maintenance_date!);
            const urgency =
              days <= 7  ? { color: "#DC2626", bg: "#FEF2F2", label: `${days}d` } :
              days <= 30 ? { color: "#D97706", bg: "#FFFBEB", label: `${days}d` } :
                           { color: "#059669", bg: "#F0FDF4", label: `${days}d` };
            return (
              <div key={a.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: urgency.bg }}>
                  <Calendar className="w-4 h-4" style={{ color: urgency.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold" style={{ color: "#111827" }}>
                    {a.name || a.asset_code}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono text-gray-400">{a.asset_code}</span>
                    <span className="text-[11px] text-gray-400">{a.category}</span>
                    {a.location && <span className="text-[11px] text-gray-400">· {a.location}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[12px] text-gray-500">{fmt(a.next_maintenance_date)}</div>
                  <span className="text-[12px] font-black" style={{ color: urgency.color }}>
                    {urgency.label} left
                  </span>
                </div>
                {a.last_maintenance_date && (
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <div className="text-[10px] text-gray-400">Last done</div>
                    <div className="text-[11px] text-gray-500">{fmt(a.last_maintenance_date)}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

// ── Section 3: Breakdown Records ──────────────────────────────────────────

function BreakdownRecordsSection({ logs }: { logs: AssetMaintenanceLog[] }) {
  const breakdowns = useMemo(
    () =>
      [...logs]
        .filter(isBreakdown)
        .sort((a, b) =>
          new Date(b.performed_on ?? "").getTime() - new Date(a.performed_on ?? "").getTime(),
        ),
    [logs],
  );

  const open      = breakdowns.filter((l) => !isCompleted(l)).length;
  const resolved  = breakdowns.filter(isCompleted).length;
  const totalCost = breakdowns.reduce((s, l) => s + (l.cost ?? 0), 0);

  return (
    <Section icon={AlertTriangle} title="Breakdown Records" accent="#DC2626" count={breakdowns.length}
      subtitle="Emergency, corrective and unplanned maintenance events">

      {breakdowns.length > 0 && (
        <div className="grid grid-cols-3 border-b" style={{ borderColor: "#F3F4F6" }}>
          {[
            { label: "Open",     value: open,     color: "#DC2626", bg: "#FEF2F2" },
            { label: "Resolved", value: resolved, color: "#059669", bg: "#F0FDF4" },
            { label: "Total Cost",
              value: totalCost > 0 ? `$${totalCost.toLocaleString()}` : "—",
              color: "#D97706", bg: "#FFFBEB" },
          ].map((s, i) => (
            <div key={s.label}
              className={`flex flex-col items-center py-3 gap-0.5${i < 2 ? " border-r" : ""}`}
              style={{ borderColor: "#F3F4F6", background: s.bg }}>
              <span className="text-[20px] font-black leading-none" style={{ color: s.color }}>{s.value}</span>
              <span className="text-[10px] font-semibold" style={{ color: s.color + "99" }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {breakdowns.length === 0 ? <Empty text="No breakdown records found." /> : (
        <div className="divide-y" style={{ divideColor: "#F9FAFB" }}>
          {breakdowns.map((l) => {
            const wtc = workTypeCfg(l.work_type);
            const sc  = statusCfg(l.status);
            return (
              <div key={l.id}
                className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
                style={{ borderLeft: `3px solid ${wtc.color}` }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-bold" style={{ color: "#111827" }}>
                      {l.asset_name || l.asset_code}
                    </span>
                    <Badge label={l.work_type} color={wtc.color} bg={wtc.bg} />
                  </div>
                  {l.description && (
                    <p className="text-[11px] mt-0.5 line-clamp-2 text-gray-500">{l.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    {l.performed_on && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-[11px] text-gray-400">{fmt(l.performed_on)}</span>
                      </div>
                    )}
                    {l.performed_by && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-[11px] text-gray-400">{l.performed_by}</span>
                      </div>
                    )}
                    {l.cost != null && (
                      <span className="text-[11px] font-semibold" style={{ color: "#D97706" }}>
                        ${l.cost.toLocaleString()}
                      </span>
                    )}
                    {l.notes && (
                      <span className="text-[10px] text-gray-400 italic">{l.notes}</span>
                    )}
                  </div>
                </div>
                <Badge label={l.status} color={sc.color} bg={sc.bg} />
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

// ── Section 4: Downtime Analysis ──────────────────────────────────────────

function DowntimeAnalysisSection({ logs, assets }: { logs: AssetMaintenanceLog[]; assets: Asset[] }) {

  // Cost by category
  const costByCategory = useMemo(() => {
    const map: Record<string, { cost: number; count: number; breakdowns: number }> = {};
    for (const l of logs) {
      if (!map[l.category]) map[l.category] = { cost: 0, count: 0, breakdowns: 0 };
      map[l.category].cost       += l.cost ?? 0;
      map[l.category].count      += 1;
      map[l.category].breakdowns += isBreakdown(l) ? 1 : 0;
    }
    return Object.entries(map).sort((a, b) => b[1].cost - a[1].cost);
  }, [logs]);

  // Maintenance frequency per asset (most maintained)
  const freqByAsset = useMemo(() => {
    const map: Record<string, { name: string; code: string; count: number; cost: number }> = {};
    for (const l of logs) {
      if (!map[l.asset_id]) map[l.asset_id] = { name: l.asset_name, code: l.asset_code, count: 0, cost: 0 };
      map[l.asset_id].count += 1;
      map[l.asset_id].cost  += l.cost ?? 0;
    }
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [logs]);

  // Assets currently in maintenance
  const inMaintenance = assets.filter((a) => a.status === "Maintenance");

  const totalCost = logs.reduce((s, l) => s + (l.cost ?? 0), 0);
  const maxCost   = Math.max(...costByCategory.map(([, v]) => v.cost), 1);
  const maxFreq   = Math.max(...freqByAsset.map((v) => v.count), 1);

  return (
    <Section icon={BarChart3} title="Downtime Analysis" accent="#7C3AED" count={logs.length}
      subtitle="Cost analysis, maintenance frequency and assets currently down">

      {/* Summary row */}
      <div className="grid grid-cols-3 border-b" style={{ borderColor: "#F3F4F6" }}>
        {[
          { label: "Total Maintenance Cost", value: `$${totalCost.toLocaleString()}`, color: "#7C3AED", bg: "#F5F3FF" },
          { label: "Currently Down",          value: inMaintenance.length,             color: "#DC2626", bg: "#FEF2F2" },
          { label: "Breakdown Rate",
            value: logs.length > 0 ? `${Math.round((logs.filter(isBreakdown).length / logs.length) * 100)}%` : "—",
            color: "#D97706", bg: "#FFFBEB" },
        ].map((s, i) => (
          <div key={s.label}
            className={`flex flex-col items-center py-3 gap-0.5${i < 2 ? " border-r" : ""}`}
            style={{ borderColor: "#F3F4F6", background: s.bg }}>
            <span className="text-[20px] font-black leading-none" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[10px] font-semibold text-center px-2" style={{ color: s.color + "99" }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="p-6 space-y-6">

        {/* Cost by category */}
        {costByCategory.length > 0 && (
          <div>
            <div className="text-[11px] font-bold tracking-widest uppercase mb-3 text-gray-400">
              Maintenance Cost by Category
            </div>
            <div className="space-y-3">
              {costByCategory.map(([cat, data]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-[12px] font-semibold w-24 flex-shrink-0 text-gray-600">{cat}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                    <div className="h-2 rounded-full"
                      style={{ width: `${(data.cost / maxCost) * 100}%`, background: "#7C3AED" }} />
                  </div>
                  <div className="flex-shrink-0 text-right min-w-[100px]">
                    <span className="text-[12px] font-black" style={{ color: "#7C3AED" }}>
                      ${data.cost.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-1">
                      ({data.count} jobs, {data.breakdowns} breakdowns)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Maintenance frequency */}
        {freqByAsset.length > 0 && (
          <div>
            <div className="text-[11px] font-bold tracking-widest uppercase mb-3 text-gray-400">
              Most Maintained Assets
            </div>
            <div className="space-y-2">
              {freqByAsset.map((v) => (
                <div key={v.code} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-40">
                    <div className="text-[12px] font-semibold truncate text-gray-800">{v.name || v.code}</div>
                    <div className="text-[10px] font-mono text-gray-400">{v.code}</div>
                  </div>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                    <div className="h-2 rounded-full"
                      style={{ width: `${(v.count / maxFreq) * 100}%`, background: "#2563EB" }} />
                  </div>
                  <div className="flex-shrink-0 text-right min-w-[90px]">
                    <span className="text-[12px] font-black text-blue-600">{v.count} jobs</span>
                    {v.cost > 0 && (
                      <span className="text-[10px] text-gray-400 ml-1">${v.cost.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Currently in maintenance */}
        {inMaintenance.length > 0 && (
          <div>
            <div className="text-[11px] font-bold tracking-widest uppercase mb-3 text-gray-400">
              Assets Currently Down ({inMaintenance.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {inMaintenance.map((a) => (
                <div key={a.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                  style={{ borderColor: "#FDE68A", background: "#FFFBEB" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "#FEF3C7" }}>
                    <TrendingDown className="w-4 h-4" style={{ color: "#D97706" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold truncate text-gray-800">
                      {a.name || a.asset_code}
                    </div>
                    <div className="text-[10px] text-gray-400">{a.category} · {a.asset_code}</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ color: "#D97706", background: "#FEF3C7" }}>
                    In Maintenance
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {logs.length === 0 && <Empty text="No maintenance data for analysis." />}
      </div>
    </Section>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export function MaintenanceLogsPage() {
  const { data: logs = [],   isLoading: l1 } = useGetMaintenanceLogsQuery();
  const { data: assets = [], isLoading: l2 } = useGetAssetsQuery();

  const completed   = logs.filter(isCompleted).length;
  const pending     = logs.filter((l) => !isCompleted(l)).length;
  const breakdowns  = logs.filter(isBreakdown).length;
  const upcoming    = assets.filter((a) => isUpcoming(a.next_maintenance_date)).length;

  if (l1 || l2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <RefreshCw className="w-7 h-7 animate-spin text-green-500 mr-3" />
        <span className="text-sm text-gray-400">Loading maintenance data…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Banner ─────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, #064E3B 0%, #0F172A 100%)" }}>
        <div className="px-8 pt-8 pb-0">
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-1"
            style={{ color: "rgba(255,255,255,0.4)" }}>
            Assets
          </p>
          <h1 className="text-[26px] font-black text-white">Maintenance Logs</h1>
          <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Maintenance history · Upcoming schedule · Breakdown records · Downtime analysis
          </p>
        </div>

        <div className="flex flex-wrap border-t mt-6" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          {[
            { label: "Total Jobs",    value: logs.length, color: "#fff"    },
            { label: "Completed",     value: completed,   color: "#34D399" },
            { label: "Pending",       value: pending,     color: "#FBBF24" },
            { label: "Breakdowns",    value: breakdowns,  color: "#F87171" },
            { label: "Upcoming",      value: upcoming,    color: "#93C5FD" },
          ].map((s, i, arr) => (
            <div key={s.label}
              className="flex-1 min-w-[90px] flex flex-col items-center text-center px-3 py-4 gap-0.5"
              style={{ borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.1)" : undefined }}>
              <span className="text-[26px] font-black leading-none" style={{ color: s.color }}>{s.value}</span>
              <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Four sections ──────────────────────────────────── */}
      <div className="p-6 space-y-6">
        <MaintenanceHistorySection  logs={logs} />
        <UpcomingMaintenanceSection assets={assets} />
        <BreakdownRecordsSection    logs={logs} />
        <DowntimeAnalysisSection    logs={logs} assets={assets} />
      </div>
    </div>
  );
}
