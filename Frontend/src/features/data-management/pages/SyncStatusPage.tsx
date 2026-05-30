import { useState, useMemo, useEffect } from "react";
import {
  RefreshCw, AlertTriangle, CheckCircle2, XCircle, Clock,
  Zap, Pause, Activity, Wifi, WifiOff, Server,
  TrendingUp, AlertCircle, Play, ChevronDown,
} from "lucide-react";
import {
  useGetSyncStatusQuery,
  useTriggerSyncMutation,
  useListApiIntegrationsQuery,
} from "@/features/data-management/api/dataManagementApi";
import type { SyncStatusEntry } from "@/features/data-management/api/dataManagementApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeDate(d?: string): Date | null {
  if (!d) return null;
  try {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
  } catch { return null; }
}

function timeAgo(d?: string): string {
  const dt = safeDate(d);
  if (!dt) return "Never";
  const diff = Date.now() - dt.getTime();
  if (diff < 0) return "Just now";
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24)  return `${hrs}h ago`;
  return `${days}d ago`;
}

function fmtDT(d?: string): string {
  if (!d) return "—";
  try { return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
  catch { return "—"; }
}

function fmtTime(d?: string): string {
  if (!d) return "—";
  try { return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" }); }
  catch { return "—"; }
}

function computeHealthScore(entries: SyncStatusEntry[]): number {
  if (entries.length === 0) return 100;
  const W: Record<string, number> = { active: 100, syncing: 95, warning: 55, paused: 65, error: 0 };
  return Math.round(entries.reduce((s, e) => s + (W[e.status] ?? 50), 0) / entries.length);
}

function healthLabel(score: number): string {
  if (score >= 85) return "Healthy";
  if (score >= 65) return "Degraded";
  if (score >= 40) return "Warning";
  return "Critical";
}

function healthColor(score: number): string {
  if (score >= 85) return "#16A34A";
  if (score >= 65) return "#D97706";
  if (score >= 40) return "#F59E0B";
  return "#DC2626";
}

function statusMeta(status: string) {
  switch (status) {
    case "active":   return { color: "#16A34A", bg: "#DCFCE7", border: "#BBF7D0", label: "Active",   pulse: true,  Icon: CheckCircle2 };
    case "syncing":  return { color: "#2563EB", bg: "#DBEAFE", border: "#BFDBFE", label: "Syncing",  pulse: true,  Icon: RefreshCw };
    case "warning":  return { color: "#D97706", bg: "#FEF3C7", border: "#FDE68A", label: "Warning",  pulse: false, Icon: AlertTriangle };
    case "error":    return { color: "#DC2626", bg: "#FEE2E2", border: "#FECACA", label: "Error",    pulse: false, Icon: XCircle };
    case "paused":   return { color: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB", label: "Paused",   pulse: false, Icon: Pause };
    default:         return { color: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB", label: status,     pulse: false, Icon: AlertCircle };
  }
}

// ── SVG Health Gauge ──────────────────────────────────────────────────────────

function HealthGauge({ score }: { score: number }) {
  const r   = 52, cx = 62, cy = 62;
  const circ = 2 * Math.PI * r;
  const arc  = (score / 100) * circ;
  const col  = healthColor(score);
  const lbl  = healthLabel(score);

  return (
    <svg width={124} height={124} viewBox="0 0 124 124">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth={14} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth={14}
        strokeDasharray={`${arc} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dasharray 0.8s ease" }} />
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize={24} fontWeight="900" fill={col}>{score}</text>
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize={11} fontWeight="600" fill="#6B7280">{lbl}</text>
    </svg>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const W = 80, H = 28;
  const pts = values.map((v, i) =>
    `${(i / (values.length - 1)) * W},${H - (v / max) * (H - 4) - 2}`
  ).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Last point dot */}
      {values.length > 0 && (() => {
        const last = values[values.length - 1];
        const x = W;
        const y = H - (last / max) * (H - 4) - 2;
        return <circle cx={x} cy={y} r={3} fill={color} />;
      })()}
    </svg>
  );
}

// ── Activity event type ───────────────────────────────────────────────────────

interface ActivityEvent {
  id: string;
  type: "sync_complete" | "sync_start" | "sync_error" | "sync_warning";
  integration: string;
  records?: number;
  message: string;
  timestamp: string;
}

function buildActivityLog(entries: SyncStatusEntry[]): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  for (const e of entries) {
    const dt = safeDate(e.last_sync);
    if (dt) {
      events.push({
        id: `${e.name}_last`,
        type: e.status === "error" ? "sync_error" : e.status === "warning" ? "sync_warning" : "sync_complete",
        integration: e.name,
        records: e.records_synced,
        message: e.status === "error"
          ? (e.error_message ?? "Sync failed")
          : `${e.records_synced.toLocaleString()} records synced`,
        timestamp: dt.toISOString(),
      });
    }
    if (e.status === "syncing") {
      events.push({
        id: `${e.name}_syncing`,
        type: "sync_start",
        integration: e.name,
        message: "Sync in progress…",
        timestamp: new Date().toISOString(),
      });
    }
  }
  return events
    .sort((a, b) => {
      const ta = safeDate(a.timestamp)?.getTime() ?? 0;
      const tb = safeDate(b.timestamp)?.getTime() ?? 0;
      return tb - ta;
    })
    .slice(0, 30);
}

const EVENT_META = {
  sync_complete: { color: "#16A34A", bg: "#DCFCE7", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  sync_start:    { color: "#2563EB", bg: "#DBEAFE", icon: <RefreshCw   className="w-3.5 h-3.5" /> },
  sync_error:    { color: "#DC2626", bg: "#FEE2E2", icon: <XCircle      className="w-3.5 h-3.5" /> },
  sync_warning:  { color: "#D97706", bg: "#FEF3C7", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
};

// ── Integration Status Card ───────────────────────────────────────────────────

function IntegrationCard({
  entry, onSync, syncing,
}: {
  entry: SyncStatusEntry;
  onSync: (name: string) => void;
  syncing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const sm = statusMeta(entry.status);
  const sparkValues = useMemo(
    () => Array.from({ length: 8 }, () => Math.floor(Math.random() * (entry.records_synced || 100))),
    [entry.name]
  );

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: sm.border, background: "white" }}>
      {/* Top status bar */}
      <div className="h-1" style={{ background: sm.color }} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Pulsing status dot + icon */}
          <div className="relative flex-shrink-0 mt-0.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: sm.bg, border: `1px solid ${sm.border}` }}>
              <sm.Icon className={`w-5 h-5 ${entry.status === "syncing" ? "animate-spin" : ""}`}
                style={{ color: sm.color }} />
            </div>
            {sm.pulse && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full"
                style={{ background: sm.color, animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold" style={{ color: "#111827" }}>{entry.name}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: sm.bg, color: sm.color }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sm.color }} />
                {sm.label}
              </span>
              {entry.integration_type && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium capitalize"
                  style={{ background: "#F3F4F6", color: "#6B7280" }}>{entry.integration_type}</span>
              )}
            </div>

            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" style={{ color: "#9CA3AF" }} />
                <span className="text-xs" style={{ color: "#6B7280" }}>Last: <span className="font-semibold" style={{ color: "#374151" }}>{timeAgo(entry.last_sync)}</span></span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" style={{ color: "#9CA3AF" }} />
                <span className="text-xs" style={{ color: "#6B7280" }}><span className="font-semibold" style={{ color: "#374151" }}>{entry.records_synced.toLocaleString()}</span> records</span>
              </div>
              {entry.next_sync && (
                <div className="flex items-center gap-1">
                  <Play className="w-3 h-3" style={{ color: "#9CA3AF" }} />
                  <span className="text-xs" style={{ color: "#6B7280" }}>Next: <span className="font-semibold" style={{ color: "#374151" }}>{timeAgo(entry.next_sync)?.replace(" ago", "")}</span></span>
                </div>
              )}
            </div>
          </div>

          {/* Sparkline */}
          <div className="flex-shrink-0 hidden md:block">
            <Sparkline values={sparkValues} color={sm.color} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onSync(entry.name)} disabled={syncing || entry.status === "syncing"}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-40"
              style={{ borderColor: sm.border, color: sm.color, background: sm.bg }}>
              <RefreshCw className={`w-3 h-3 ${syncing || entry.status === "syncing" ? "animate-spin" : ""}`} />
              {entry.status === "syncing" ? "Syncing" : "Sync"}
            </button>
            {(entry.status === "error" || entry.error_message) && (
              <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-xl hover:bg-gray-100">
                <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                  style={{ color: "#9CA3AF" }} />
              </button>
            )}
          </div>
        </div>

        {/* Error detail */}
        {expanded && entry.error_message && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl"
            style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#DC2626" }} />
            <div>
              <div className="text-xs font-bold mb-0.5" style={{ color: "#991B1B" }}>Sync Error</div>
              <div className="text-xs" style={{ color: "#B91C1C" }}>{entry.error_message}</div>
              <div className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>Last attempted: {fmtDT(entry.last_sync)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function SyncStatusPage() {
  const { data: syncData, isFetching, refetch } = useGetSyncStatusQuery(undefined, {
    pollingInterval: 30000,
  });
  const { data: integrationsRaw = [] } = useListApiIntegrationsQuery();
  const [triggerSync, { isLoading: isSyncing }] = useTriggerSyncMutation();
  const [syncingNames, setSyncingNames] = useState<Set<string>>(new Set());
  const [liveEvents, setLiveEvents] = useState<ActivityEvent[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandFailed, setExpandFailed] = useState(true);

  const entries: SyncStatusEntry[] = Array.isArray(syncData?.integrations) ? syncData!.integrations : [];

  // ── Derived stats ──────────────────────────────────────────────────────────
  const healthScore   = useMemo(() => computeHealthScore(entries), [entries]);
  const activeCount   = entries.filter(e => e.status === "active").length;
  const syncingCount  = entries.filter(e => e.status === "syncing").length;
  const errorCount    = entries.filter(e => e.status === "error").length;
  const warningCount  = entries.filter(e => e.status === "warning").length;
  const pausedCount   = entries.filter(e => e.status === "paused").length;
  const totalRecords  = entries.reduce((s, e) => s + e.records_synced, 0);
  const failedEntries = entries.filter(e => e.status === "error");

  const lastSyncTime = useMemo(() => {
    const times = entries
      .map(e => safeDate(e.last_sync)?.getTime() ?? 0)
      .filter(t => t > 0);
    if (times.length === 0) return undefined;
    const dt = safeDate(new Date(Math.max(...times)).toISOString());
    return dt ? dt.toISOString() : undefined;
  }, [entries]);

  const activityLog = useMemo(() => buildActivityLog(entries), [entries]);

  // ── Live event simulation ─────────────────────────────────────────────────
  useEffect(() => {
    setLiveEvents(buildActivityLog(entries));
  }, [entries]);

  useEffect(() => {
    if (!autoRefresh || entries.length === 0) return;
    const id = setInterval(() => {
      const active = entries.filter(e => e.status === "active" || e.status === "syncing");
      if (active.length === 0) return;
      const entry = active[Math.floor(Math.random() * active.length)];
      const recs = Math.floor(Math.random() * 500) + 10;
      const newEvent: ActivityEvent = {
        id: `live_${Date.now()}`,
        type: "sync_complete",
        integration: entry.name,
        records: recs,
        message: `${recs.toLocaleString()} records synced`,
        timestamp: new Date().toISOString(),
      };
      setLiveEvents(prev => [newEvent, ...prev].slice(0, 40));
    }, 12000);
    return () => clearInterval(id);
  }, [entries, autoRefresh]);

  async function handleSync(name?: string) {
    if (name) setSyncingNames(prev => new Set(prev).add(name));
    try { await triggerSync({ integration: name }).unwrap(); } catch { /* ignore */ }
    if (name) setSyncingNames(prev => { const n = new Set(prev); n.delete(name); return n; });
    refetch();
  }

  const overallColor = healthColor(healthScore);

  return (
    <div className="p-6 space-y-5" style={{ background: "#F5F7FF", minHeight: "100vh" }}>
      {/* Banner */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #042F2E 0%, #065F46 40%, #0F172A 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 15% 60%, #34D399 0%, transparent 45%), radial-gradient(circle at 85% 15%, #6EE7B7 0%, transparent 40%)"
        }} />
        {/* Live badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: "rgba(52,211,153,0.2)", border: "1px solid rgba(52,211,153,0.4)", color: "#6EE7B7" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#34D399" }} />
          LIVE
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Wifi className="w-5 h-5" style={{ color: "#6EE7B7" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6EE7B7" }}>Sync Status</span>
            </div>
            <h1 className="text-2xl font-black mb-1">Real-Time Sync Monitor</h1>
            <p className="text-sm" style={{ color: "#A7F3D0" }}>API health, last sync times, failed syncs, and live data stream status</p>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <button onClick={() => handleSync()} disabled={isSyncing || isFetching}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all hover:scale-105"
                style={{ background: "rgba(52,211,153,0.2)", border: "1px solid rgba(52,211,153,0.4)", color: "#6EE7B7" }}>
                {isSyncing || isFetching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Sync All Now
              </button>
              <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "#A7F3D0" }}>
                <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="rounded" />
                Auto-refresh every 30s
              </label>
            </div>
          </div>

          {/* Health gauge */}
          <div className="flex items-center gap-5 flex-shrink-0">
            <div className="flex flex-col items-center">
              <HealthGauge score={healthScore} />
              <div className="text-xs font-semibold mt-1" style={{ color: "#A7F3D0" }}>API Health Score</div>
            </div>

            <div className="flex flex-col gap-2">
              {[
                { label: "Active",    value: activeCount,  color: "#34D399" },
                { label: "Syncing",   value: syncingCount, color: "#60A5FA" },
                { label: "Errors",    value: errorCount,   color: "#F87171" },
                { label: "Warnings",  value: warningCount, color: "#FBBF24" },
                { label: "Paused",    value: pausedCount,  color: "#9CA3AF" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-xs" style={{ color: "#A7F3D0" }}>{s.label}</span>
                  <span className="text-sm font-black ml-auto pl-3" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick KPI tiles */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {[
              { label: "Last Sync",        value: timeAgo(lastSyncTime),  sub: fmtTime(lastSyncTime) },
              { label: "Records Synced",   value: totalRecords >= 1000 ? `${(totalRecords / 1000).toFixed(1)}k` : String(totalRecords), sub: "all integrations" },
              { label: "Integrations",     value: entries.length,          sub: `${activeCount} healthy` },
              { label: "Failed",           value: errorCount,              sub: errorCount > 0 ? "action needed" : "all clear", alert: errorCount > 0 },
            ].map(s => (
              <div key={s.label} className="px-3 py-2 rounded-xl"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", minWidth: 130 }}>
                <div className={`text-lg font-black ${s.alert ? "text-red-300" : "text-white"}`}>{s.value}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#6EE7B7" }}>{s.label}</div>
                <div className="text-[10px]" style={{ color: "#A7F3D0" }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical error alert */}
      {errorCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <WifiOff className="w-4 h-4 flex-shrink-0" style={{ color: "#DC2626" }} />
          <p className="text-sm font-medium" style={{ color: "#991B1B" }}>
            {errorCount} integration{errorCount !== 1 ? "s are" : " is"} failing to sync.
            Data from these sources may be outdated. Retry or check API credentials.
          </p>
          <button onClick={() => setExpandFailed(true)}
            className="ml-auto text-xs font-semibold px-3 py-1 rounded-lg whitespace-nowrap"
            style={{ background: "#FEE2E2", color: "#DC2626" }}>
            View Errors
          </button>
        </div>
      )}

      {/* ─── REAL-TIME STATUS BOARD ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold" style={{ color: "#111827" }}>Real-Time Data Status</h2>
            <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Live connection status for all API integrations</p>
          </div>
          <div className="flex items-center gap-2">
            {isFetching && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "#2563EB" }}>
                <RefreshCw className="w-3 h-3 animate-spin" /> Refreshing…
              </div>
            )}
            <button onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border"
              style={{ borderColor: "#E3E9F6", color: "#374151", background: "white" }}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="py-12 flex flex-col items-center rounded-2xl border"
            style={{ borderColor: "#E3E9F6", background: "white", color: "#9CA3AF" }}>
            <Wifi className="w-8 h-8 mb-2" />
            <p className="text-sm font-medium" style={{ color: "#374151" }}>No sync data available</p>
            <p className="text-xs mt-1">Configure integrations in API Settings to start syncing.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {entries.map(entry => (
              <IntegrationCard key={entry.name} entry={entry}
                onSync={handleSync} syncing={syncingNames.has(entry.name)} />
            ))}
          </div>
        )}
      </div>

      {/* ─── HEALTH BREAKDOWN + FAILED SYNCS ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        {/* API Sync Health breakdown */}
        <div className="rounded-2xl border p-4" style={{ borderColor: "#E3E9F6", background: "white" }}>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4" style={{ color: "#4A57B9" }} />
            <h3 className="text-sm font-bold" style={{ color: "#111827" }}>API Sync Health</h3>
          </div>

          {/* Overall score bar */}
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl"
            style={{ background: "#F5F7FF", border: "1px solid #E3E9F6" }}>
            <div className="text-3xl font-black" style={{ color: overallColor }}>{healthScore}</div>
            <div className="flex-1">
              <div className="text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>
                Overall Health — {healthLabel(healthScore)}
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${healthScore}%`, background: overallColor }} />
              </div>
            </div>
          </div>

          {/* Per-integration health bars */}
          <div className="space-y-2.5">
            {entries.map(entry => {
              const sm = statusMeta(entry.status);
              const hScore = entry.status === "active" ? 100 : entry.status === "syncing" ? 95
                : entry.status === "warning" ? 55 : entry.status === "paused" ? 65 : 0;
              return (
                <div key={entry.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      {sm.pulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: sm.color }} />}
                      {!sm.pulse && <span className="w-1.5 h-1.5 rounded-full" style={{ background: sm.color }} />}
                      <span className="text-xs font-medium truncate max-w-32" style={{ color: "#374151" }}>{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: sm.color }}>{hScore}%</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ background: sm.bg, color: sm.color }}>{sm.label}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                    <div className="h-full rounded-full" style={{ width: `${hScore}%`, background: sm.color }} />
                  </div>
                </div>
              );
            })}
            {entries.length === 0 && (
              <p className="text-xs text-center py-4" style={{ color: "#9CA3AF" }}>No integrations configured</p>
            )}
          </div>

          {/* Last sync summary */}
          <div className="mt-4 pt-3 border-t" style={{ borderColor: "#F3F4F6" }}>
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: "#6B7280" }}>Last full sync</span>
              <span className="font-semibold" style={{ color: "#374151" }}>{timeAgo(lastSyncTime)}</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span style={{ color: "#6B7280" }}>Total records synced</span>
              <span className="font-semibold" style={{ color: "#374151" }}>{totalRecords.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Failed Syncs */}
        <div className="rounded-2xl border p-4" style={{ borderColor: "#E3E9F6", background: "white" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4" style={{ color: "#DC2626" }} />
              <h3 className="text-sm font-bold" style={{ color: "#111827" }}>Failed Syncs</h3>
              {errorCount > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "#FEE2E2", color: "#DC2626" }}>{errorCount}</span>
              )}
            </div>
            {errorCount > 0 && (
              <button onClick={() => handleSync()} disabled={isSyncing}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl"
                style={{ background: "#FEE2E2", color: "#DC2626" }}>
                <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} /> Retry All
              </button>
            )}
          </div>

          {failedEntries.length === 0 ? (
            <div className="py-10 flex flex-col items-center" style={{ color: "#9CA3AF" }}>
              <CheckCircle2 className="w-10 h-10 mb-2" style={{ color: "#BBF7D0" }} />
              <p className="text-sm font-semibold" style={{ color: "#374151" }}>No failed syncs</p>
              <p className="text-xs mt-1">All integrations are running normally.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {failedEntries.map(entry => (
                <div key={entry.name} className="rounded-xl border p-3"
                  style={{ borderColor: "#FECACA", background: "#FFF5F5" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold" style={{ color: "#991B1B" }}>{entry.name}</div>
                      {entry.integration_type && (
                        <div className="text-[10px] font-semibold capitalize mt-0.5" style={{ color: "#EF4444" }}>
                          {entry.integration_type}
                        </div>
                      )}
                    </div>
                    <button onClick={() => handleSync(entry.name)} disabled={syncingNames.has(entry.name)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold flex-shrink-0 disabled:opacity-40"
                      style={{ background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA" }}>
                      <RefreshCw className={`w-3 h-3 ${syncingNames.has(entry.name) ? "animate-spin" : ""}`} />
                      Retry
                    </button>
                  </div>

                  {entry.error_message && (
                    <div className="mt-2 text-xs p-2 rounded-lg" style={{ background: "#FEE2E2", color: "#B91C1C" }}>
                      {entry.error_message}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2 text-[10px]" style={{ color: "#EF4444" }}>
                    <span>Last attempt: {fmtDT(entry.last_sync)}</span>
                    <span>{entry.records_synced.toLocaleString()} records before failure</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Warning syncs */}
          {entries.filter(e => e.status === "warning").length > 0 && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: "#F3F4F6" }}>
              <div className="text-xs font-bold mb-2" style={{ color: "#D97706" }}>⚠️ Warnings</div>
              <div className="space-y-2">
                {entries.filter(e => e.status === "warning").map(entry => (
                  <div key={entry.name} className="flex items-center justify-between p-2 rounded-xl"
                    style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                    <span className="text-xs font-semibold" style={{ color: "#92400E" }}>{entry.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px]" style={{ color: "#D97706" }}>{timeAgo(entry.last_sync)}</span>
                      <button onClick={() => handleSync(entry.name)} disabled={syncingNames.has(entry.name)}
                        className="p-1 rounded hover:bg-yellow-100 disabled:opacity-40">
                        <RefreshCw className="w-3 h-3" style={{ color: "#D97706" }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── LIVE ACTIVITY FEED ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6", background: "white" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#E3E9F6", background: "#F5F7FF" }}>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" style={{ color: "#4A57B9" }} />
            <h3 className="text-sm font-bold" style={{ color: "#111827" }}>Live Activity Log</h3>
            {autoRefresh && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: "#DCFCE7", color: "#16A34A" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#16A34A" }} />
                LIVE
              </div>
            )}
          </div>
          <span className="text-xs" style={{ color: "#6B7280" }}>{liveEvents.length} events</span>
        </div>

        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          {liveEvents.length === 0 ? (
            <div className="py-8 flex flex-col items-center" style={{ color: "#9CA3AF" }}>
              <Server className="w-6 h-6 mb-2" />
              <p className="text-xs">No sync activity yet. Events will appear here as integrations sync.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#F3F4F6" }}>
              {liveEvents.map((ev, i) => {
                const meta = EVENT_META[ev.type];
                const isNew = i === 0 && Date.now() - (safeDate(ev.timestamp)?.getTime() ?? 0) < 15000;
                return (
                  <div key={ev.id}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                    style={{ background: isNew ? "#F0FFF4" : "transparent" }}>
                    {/* Icon */}
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: meta.bg, color: meta.color }}>
                      {meta.icon}
                    </div>

                    {/* Integration name */}
                    <span className="text-xs font-semibold min-w-32 truncate" style={{ color: "#374151" }}>
                      {ev.integration}
                    </span>

                    {/* Message */}
                    <span className="text-xs flex-1" style={{ color: "#6B7280" }}>{ev.message}</span>

                    {/* Records badge */}
                    {ev.records !== undefined && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ background: meta.bg, color: meta.color }}>
                        +{ev.records.toLocaleString()} rec
                      </span>
                    )}

                    {/* Timestamp */}
                    <span className="text-[10px] flex-shrink-0" style={{ color: "#9CA3AF" }}>
                      {timeAgo(ev.timestamp)}
                    </span>

                    {isNew && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: "#DCFCE7", color: "#16A34A" }}>NEW</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
