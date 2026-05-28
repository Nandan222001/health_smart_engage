import { useState, useMemo } from "react";
import {
  FileText, CheckCircle2, XCircle, Clock, AlertTriangle,
  Search, Download, RefreshCw, ChevronDown, Database,
  FileSpreadsheet, TrendingUp, BarChart2,
} from "lucide-react";
import {
  useListImportsQuery,
  useListValidationLogsQuery,
} from "@/features/data-management/api/dataManagementApi";
import type { ImportRecord, ValidationLog } from "@/features/data-management/api/dataManagementApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusStyle(status: string): { text: string; bg: string; label: string } {
  switch (status) {
    case "success":    return { text: "#16A34A", bg: "#DCFCE7", label: "Success" };
    case "failed":     return { text: "#DC2626", bg: "#FEE2E2", label: "Failed" };
    case "partial":    return { text: "#D97706", bg: "#FEF3C7", label: "Partial" };
    case "processing": return { text: "#2563EB", bg: "#DBEAFE", label: "Processing" };
    case "pass":       return { text: "#16A34A", bg: "#DCFCE7", label: "Pass" };
    case "fail":       return { text: "#DC2626", bg: "#FEE2E2", label: "Fail" };
    case "warning":    return { text: "#D97706", bg: "#FEF3C7", label: "Warning" };
    default:           return { text: "#6B7280", bg: "#F3F4F6", label: status };
  }
}

const DATA_TYPE_META: Record<string, { icon: string; color: string; bg: string }> = {
  incidents:  { icon: "🚨", color: "#DC2626", bg: "#FEF2F2" },
  employees:  { icon: "👥", color: "#7C3AED", bg: "#F5F3FF" },
  vendors:    { icon: "🏢", color: "#2563EB", bg: "#EFF6FF" },
  hazards:    { icon: "⚠️", color: "#D97706", bg: "#FFFBEB" },
  assets:     { icon: "🔧", color: "#059669", bg: "#ECFDF5" },
  training:   { icon: "📚", color: "#0891B2", bg: "#ECFEFF" },
};

function dtMeta(type: string) {
  return DATA_TYPE_META[type] ?? { icon: "📄", color: "#6B7280", bg: "#F3F4F6" };
}

function fmtDate(d?: string): string {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return "—"; }
}

function fmtDT(d?: string): string {
  if (!d) return "—";
  try { return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
  catch { return "—"; }
}

function successRate(rec: ImportRecord): number {
  if (!rec.records_total) return 0;
  return Math.round((rec.records_success / rec.records_total) * 100);
}

// ── Monthly bucketing ─────────────────────────────────────────────────────────

interface MonthBucket { month: string; total: number; success: number; failed: number }

function bucketByMonth(imports: ImportRecord[]): MonthBucket[] {
  const now = new Date();
  const buckets: MonthBucket[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ month: d.toLocaleDateString("en-US", { month: "short" }), total: 0, success: 0, failed: 0 });
  }
  for (const imp of imports) {
    const d = new Date(imp.created_at);
    const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (diff >= 0 && diff <= 5) {
      const idx = 5 - diff;
      buckets[idx].total++;
      if (imp.status === "success") buckets[idx].success++;
      else if (imp.status === "failed" || imp.status === "partial") buckets[idx].failed++;
    }
  }
  return buckets;
}

// ── Import Activity Chart ─────────────────────────────────────────────────────

function ImportBarChart({ data }: { data: MonthBucket[] }) {
  const maxVal = Math.max(...data.map(d => d.total), 1);
  const W = 340, H = 72, barW = 30;
  const gap = (W - data.length * barW) / (data.length + 1);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 22}`} preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const x = gap + i * (barW + gap);
        const totalH = (d.total / maxVal) * H;
        const failedH = (d.failed / maxVal) * H;
        const successH = Math.max(0, totalH - failedH);
        return (
          <g key={d.month}>
            {d.total === 0 ? (
              <rect x={x} y={H - 2} width={barW} height={2} fill="#E5E7EB" rx="1" />
            ) : (
              <>
                {successH > 0 && <rect x={x} y={H - totalH} width={barW} height={successH} fill="#16A34A" rx="3 3 0 0" />}
                {failedH > 0 && <rect x={x} y={H - failedH} width={barW} height={failedH} fill="#EF4444" rx="0 0 3 3" />}
              </>
            )}
            <text x={x + barW / 2} y={H + 16} textAnchor="middle" fontSize={10} fill="#9CA3AF">{d.month}</text>
            {d.total > 0 && (
              <text x={x + barW / 2} y={H - totalH - 4} textAnchor="middle" fontSize={9} fill="#6B7280">{d.total}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = statusStyle(status);
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: s.text, background: s.bg }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.text }} />
      {s.label}
    </span>
  );
}

// ── Validation Logs for one import ────────────────────────────────────────────

function ImportValidationLogs({ importId, logs }: { importId: string; logs: ValidationLog[] }) {
  const matched = logs.filter(l => l.import_id === importId);
  if (matched.length === 0) return (
    <p className="text-xs italic" style={{ color: "#9CA3AF" }}>No validation logs for this import.</p>
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ background: "#F5F7FF" }}>
            {["Rule", "Status", "Records Affected", "Message"].map(h => (
              <th key={h} className="px-3 py-2 text-left font-semibold" style={{ color: "#6B7280" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matched.map(log => (
            <tr key={log.id} className="border-t" style={{ borderColor: "#F3F4F6" }}>
              <td className="px-3 py-2 font-medium" style={{ color: "#374151" }}>{log.rule}</td>
              <td className="px-3 py-2"><StatusBadge status={log.status} /></td>
              <td className="px-3 py-2 font-semibold" style={{ color: "#374151" }}>{log.records_affected}</td>
              <td className="px-3 py-2" style={{ color: "#6B7280" }}>{log.message ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Import Row ────────────────────────────────────────────────────────────────

function ImportRow({ record, logs }: { record: ImportRecord; logs: ValidationLog[] }) {
  const [expanded, setExpanded] = useState(false);
  const meta = dtMeta(record.data_type);
  const rate = successRate(record);

  function downloadErrorReport() {
    const errLogs = logs.filter(l => l.import_id === record.id && l.status === "fail");
    const rows = [["Rule", "Records Affected", "Message"],
      ...errLogs.map(l => [l.rule, String(l.records_affected), l.message ?? ""])];
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `errors_${record.file_name.replace(/[^a-z0-9]/gi, "_")}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <>
      <tr className={`border-t hover:bg-gray-50 cursor-pointer ${expanded ? "bg-blue-50/30" : ""}`}
        style={{ borderColor: "#F3F4F6" }} onClick={() => setExpanded(e => !e)}>
        {/* File name + type */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
              style={{ background: meta.bg }}>{meta.icon}</div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate max-w-48" style={{ color: "#111827" }}>{record.file_name}</div>
              <div className="flex items-center gap-1 mt-0.5">
                {record.import_type === "csv"
                  ? <FileText className="w-3 h-3" style={{ color: "#9CA3AF" }} />
                  : <FileSpreadsheet className="w-3 h-3" style={{ color: "#9CA3AF" }} />}
                <span className="text-[10px] uppercase font-semibold" style={{ color: "#9CA3AF" }}>{record.import_type}</span>
              </div>
            </div>
          </div>
        </td>

        {/* Data type */}
        <td className="px-4 py-3">
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
            style={{ background: meta.bg, color: meta.color }}>{record.data_type}</span>
        </td>

        {/* Upload date */}
        <td className="px-4 py-3">
          <div className="text-xs font-medium" style={{ color: "#374151" }}>{fmtDate(record.created_at)}</div>
          <div className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>
            {new Date(record.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </div>
        </td>

        {/* Records bar */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold" style={{ color: "#16A34A" }}>{record.records_success.toLocaleString()}</span>
                <span className="text-xs" style={{ color: "#9CA3AF" }}>/ {record.records_total.toLocaleString()}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${rate}%`, background: rate === 100 ? "#16A34A" : rate >= 80 ? "#F59E0B" : "#EF4444" }} />
              </div>
            </div>
            <span className="text-xs font-bold flex-shrink-0"
              style={{ color: rate === 100 ? "#16A34A" : rate >= 80 ? "#D97706" : "#DC2626" }}>{rate}%</span>
          </div>
          {record.records_failed > 0 && (
            <div className="text-[10px] mt-1" style={{ color: "#DC2626" }}>
              {record.records_failed.toLocaleString()} failed
            </div>
          )}
        </td>

        {/* Status */}
        <td className="px-4 py-3"><StatusBadge status={record.status} /></td>

        {/* Uploaded by */}
        <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{record.uploaded_by}</td>

        {/* Expand + actions */}
        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            {(record.status === "failed" || record.status === "partial") && (
              <button onClick={downloadErrorReport}
                className="p-1.5 rounded-lg hover:bg-red-50" title="Download error report">
                <Download className="w-3.5 h-3.5" style={{ color: "#DC2626" }} />
              </button>
            )}
            <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-lg hover:bg-gray-100">
              <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                style={{ color: "#9CA3AF" }} />
            </button>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr style={{ background: "#F9FAFB" }}>
          <td colSpan={7} className="px-4 pb-4 pt-2">
            <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: "#E3E9F6", background: "white" }}>
              {/* Detail grid */}
              <div className="grid grid-cols-5 gap-4">
                {[
                  { label: "Total Records",   value: record.records_total.toLocaleString(),   color: "#374151" },
                  { label: "Successful",      value: record.records_success.toLocaleString(),  color: "#16A34A" },
                  { label: "Failed",          value: record.records_failed.toLocaleString(),   color: record.records_failed > 0 ? "#DC2626" : "#374151" },
                  { label: "Success Rate",    value: `${rate}%`,                               color: rate >= 90 ? "#16A34A" : rate >= 70 ? "#D97706" : "#DC2626" },
                  { label: "Import Type",     value: record.import_type.toUpperCase(),          color: "#374151" },
                ].map(d => (
                  <div key={d.label}>
                    <div className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#9CA3AF" }}>{d.label}</div>
                    <div className="text-base font-black" style={{ color: d.color }}>{d.value}</div>
                  </div>
                ))}
              </div>

              {record.error_message && (
                <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#DC2626" }} />
                  <div>
                    <div className="text-xs font-semibold mb-0.5" style={{ color: "#991B1B" }}>Import Error</div>
                    <div className="text-xs" style={{ color: "#B91C1C" }}>{record.error_message}</div>
                  </div>
                </div>
              )}

              {/* Validation logs */}
              <div>
                <div className="text-xs font-bold mb-2" style={{ color: "#374151" }}>Validation Logs</div>
                <ImportValidationLogs importId={record.id} logs={logs} />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ImportHistoryPage() {
  const { data: importsRaw = [], isFetching: loadingImports, refetch } = useListImportsQuery();
  const { data: logsRaw = [], isFetching: loadingLogs } = useListValidationLogsQuery();

  const imports: ImportRecord[] = Array.isArray(importsRaw) ? importsRaw : [];
  const logs: ValidationLog[]   = Array.isArray(logsRaw) ? logsRaw : [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failed" | "partial" | "processing">("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalSuccess    = imports.filter(i => i.status === "success").length;
  const totalFailed     = imports.filter(i => i.status === "failed").length;
  const totalPartial    = imports.filter(i => i.status === "partial").length;
  const totalProcessing = imports.filter(i => i.status === "processing").length;
  const totalRecords    = imports.reduce((s, i) => s + i.records_total, 0);
  const totalImported   = imports.reduce((s, i) => s + i.records_success, 0);

  const dataTypes = useMemo(() => Array.from(new Set(imports.map(i => i.data_type))).sort(), [imports]);
  const monthlyData = useMemo(() => bucketByMonth(imports), [imports]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => imports.filter(rec => {
    const matchSearch = !search ||
      rec.file_name.toLowerCase().includes(search.toLowerCase()) ||
      rec.uploaded_by.toLowerCase().includes(search.toLowerCase()) ||
      rec.data_type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || rec.status === statusFilter;
    const matchType   = typeFilter === "all" || rec.data_type === typeFilter;
    const matchFrom   = !dateFrom || new Date(rec.created_at) >= new Date(dateFrom);
    const matchTo     = !dateTo   || new Date(rec.created_at) <= new Date(dateTo + "T23:59:59");
    return matchSearch && matchStatus && matchType && matchFrom && matchTo;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  [imports, search, statusFilter, typeFilter, dateFrom, dateTo]);

  const hasFailed = totalFailed > 0 || totalPartial > 0;
  const overallSuccessRate = totalRecords > 0 ? Math.round((totalImported / totalRecords) * 100) : 0;

  return (
    <div className="p-6 space-y-5" style={{ background: "#F5F7FF", minHeight: "100vh" }}>
      {/* Banner */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 45%, #0F172A 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 10% 50%, #818CF8 0%, transparent 50%), radial-gradient(circle at 90% 20%, #A5B4FC 0%, transparent 40%)"
        }} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-5 h-5" style={{ color: "#A5B4FC" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#A5B4FC" }}>Import History</span>
            </div>
            <h1 className="text-2xl font-black mb-1">Data Import Logs</h1>
            <p className="text-sm" style={{ color: "#C7D2FE" }}>Track all imports, upload dates, record counts, and validation results</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Total Imports",      value: imports.length,                                                  sub: "all time" },
              { label: "Successful",         value: totalSuccess,                                                     sub: "completed" },
              { label: "Failed / Partial",   value: totalFailed + totalPartial,                                       sub: totalPartial > 0 ? `${totalPartial} partial` : "no issues", alert: hasFailed },
              { label: "Records Imported",   value: totalImported >= 1000 ? `${(totalImported / 1000).toFixed(1)}k` : totalImported, sub: `${overallSuccessRate}% success rate` },
              { label: "Processing",         value: totalProcessing,                                                  sub: "in progress" },
            ].map(stat => (
              <div key={stat.label} className="px-4 py-3 rounded-xl text-center"
                style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", minWidth: 100 }}>
                <div className={`text-2xl font-black ${stat.alert ? "text-red-300" : "text-white"}`}>{stat.value}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#C7D2FE" }}>{stat.label}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "#A5B4FC" }}>{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Failed alert strip */}
      {hasFailed && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "#DC2626" }} />
          <p className="text-sm font-medium" style={{ color: "#991B1B" }}>
            {totalFailed} import{totalFailed !== 1 ? "s" : ""} failed and {totalPartial} completed partially.
            Expand rows below to view errors and download error reports.
          </p>
          <button onClick={() => setStatusFilter("failed")}
            className="ml-auto text-xs font-semibold px-3 py-1 rounded-lg whitespace-nowrap"
            style={{ background: "#FEE2E2", color: "#DC2626" }}>
            View Failed
          </button>
        </div>
      )}

      {/* Activity chart + data type breakdown */}
      <div className="grid grid-cols-3 gap-4">
        {/* Chart */}
        <div className="col-span-2 rounded-2xl border p-4" style={{ borderColor: "#E3E9F6", background: "white" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-bold" style={{ color: "#111827" }}>Import Activity</div>
              <div className="text-xs" style={{ color: "#6B7280" }}>Last 6 months — green: success, red: failed/partial</div>
            </div>
            <BarChart2 className="w-4 h-4" style={{ color: "#9CA3AF" }} />
          </div>
          {imports.length === 0 ? (
            <div className="h-24 flex items-center justify-center" style={{ color: "#9CA3AF" }}>
              <span className="text-xs">No import data yet</span>
            </div>
          ) : (
            <ImportBarChart data={monthlyData} />
          )}
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "#16A34A" }} /><span className="text-xs" style={{ color: "#6B7280" }}>Successful</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "#EF4444" }} /><span className="text-xs" style={{ color: "#6B7280" }}>Failed / Partial</span></div>
          </div>
        </div>

        {/* Data type breakdown */}
        <div className="rounded-2xl border p-4" style={{ borderColor: "#E3E9F6", background: "white" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold" style={{ color: "#111827" }}>By Data Type</div>
            <TrendingUp className="w-4 h-4" style={{ color: "#9CA3AF" }} />
          </div>
          {dataTypes.length === 0 ? (
            <div className="h-24 flex items-center justify-center" style={{ color: "#9CA3AF" }}>
              <span className="text-xs">No data yet</span>
            </div>
          ) : (
            <div className="space-y-2">
              {dataTypes.map(dt => {
                const count = imports.filter(i => i.data_type === dt).length;
                const pct = imports.length > 0 ? Math.round((count / imports.length) * 100) : 0;
                const meta = dtMeta(dt);
                return (
                  <div key={dt}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span>{meta.icon}</span>
                        <span className="text-xs font-semibold capitalize" style={{ color: "#374151" }}>{dt}</span>
                      </div>
                      <span className="text-xs font-bold" style={{ color: meta.color }}>{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: meta.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "success", "processing", "partial", "failed"] as const).map(s => {
          const counts: Record<string, number> = {
            all: imports.length,
            success: totalSuccess, processing: totalProcessing,
            partial: totalPartial, failed: totalFailed,
          };
          const styles: Record<string, { color: string; activeBg: string; activeText: string }> = {
            all:        { color: "#6B7280", activeBg: "#1E1B4B",  activeText: "white" },
            success:    { color: "#16A34A", activeBg: "#DCFCE7",  activeText: "#16A34A" },
            processing: { color: "#2563EB", activeBg: "#DBEAFE",  activeText: "#2563EB" },
            partial:    { color: "#D97706", activeBg: "#FEF3C7",  activeText: "#D97706" },
            failed:     { color: "#DC2626", activeBg: "#FEE2E2",  activeText: "#DC2626" },
          };
          const st = styles[s];
          const active = statusFilter === s;
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
              style={active
                ? { background: st.activeBg, color: st.activeText, borderColor: st.activeBg }
                : { background: "white", color: "#6B7280", borderColor: "#E3E9F6" }}>
              <span className="capitalize">{s === "all" ? "All Imports" : s}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active ? "" : "bg-gray-100"}`}
                style={{ background: active ? "rgba(0,0,0,0.12)" : "#F3F4F6", color: active ? st.activeText : "#6B7280" }}>
                {counts[s]}
              </span>
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => refetch()} disabled={loadingImports}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border"
            style={{ borderColor: "#E3E9F6", color: "#374151" }}>
            <RefreshCw className={`w-3.5 h-3.5 ${loadingImports ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search + date + type filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 min-w-48"
          style={{ borderColor: "#E3E9F6", background: "white" }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#9CA3AF" }} />
          <input type="text" placeholder="Search by file name, uploader, or data type…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none flex-1" style={{ color: "#111827" }} />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: "#E3E9F6", color: "#374151", background: "white" }}>
          <option value="all">All Types</option>
          {dataTypes.map(dt => <option key={dt} value={dt} className="capitalize">{dt}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 rounded-xl border text-xs outline-none" style={{ borderColor: "#E3E9F6", color: "#374151", background: "white" }} />
          <span className="text-xs" style={{ color: "#9CA3AF" }}>to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 rounded-xl border text-xs outline-none" style={{ borderColor: "#E3E9F6", color: "#374151", background: "white" }} />
        </div>
        {(search || typeFilter !== "all" || dateFrom || dateTo) && (
          <button onClick={() => { setSearch(""); setTypeFilter("all"); setDateFrom(""); setDateTo(""); }}
            className="text-xs font-semibold hover:underline" style={{ color: "#DC2626" }}>
            Clear filters
          </button>
        )}
        <span className="text-xs ml-auto" style={{ color: "#6B7280" }}>
          {filtered.length} of {imports.length} import{imports.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Imports table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6", background: "white" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F5F7FF" }}>
              <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>File Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Data Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Upload Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Records (Success / Total)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Uploaded By</th>
              <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingImports ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2" style={{ color: "#9CA3AF" }}>
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span className="text-sm">Loading import history…</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center gap-2" style={{ color: "#9CA3AF" }}>
                    <Database className="w-8 h-8" />
                    <p className="text-sm font-medium">No imports found</p>
                    <p className="text-xs">
                      {imports.length === 0
                        ? "No imports have been made yet. Use CSV Import to get started."
                        : "Try adjusting your search or filters."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(rec => (
                <ImportRow key={rec.id} record={rec} logs={logs} />
              ))
            )}
          </tbody>
        </table>

        {/* Footer summary */}
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t flex items-center gap-6" style={{ borderColor: "#E3E9F6", background: "#F9FAFB" }}>
            <span className="text-xs font-semibold" style={{ color: "#374151" }}>
              Showing {filtered.length} import{filtered.length !== 1 ? "s" : ""}
            </span>
            <span className="text-xs" style={{ color: "#6B7280" }}>
              {filtered.reduce((s, r) => s + r.records_success, 0).toLocaleString()} records imported
            </span>
            <span className="text-xs" style={{ color: "#DC2626" }}>
              {filtered.reduce((s, r) => s + r.records_failed, 0).toLocaleString()} records failed
            </span>
            <span className="text-xs ml-auto" style={{ color: "#6B7280" }}>
              Last updated: {fmtDT(filtered[0]?.created_at)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
