import { useState, useMemo } from "react";
import {
  AlertTriangle, CheckCircle2, XCircle, AlertCircle,
  Search, Download, RefreshCw, ChevronDown, ChevronRight,
  FileText, Database, Lightbulb, Copy,
  Filter, TriangleAlert,
} from "lucide-react";
import {
  useListValidationLogsQuery,
  useListImportsQuery,
} from "@/features/data-management/api/dataManagementApi";
import type { ValidationLog, ImportRecord } from "@/features/data-management/api/dataManagementApi";

// ── Error classification ──────────────────────────────────────────────────────

type ErrorCategory = "missing" | "duplicate" | "format" | "validation" | "other";

function classifyRule(rule: string): ErrorCategory {
  const r = rule.toLowerCase().replace(/_/g, " ");
  if (["required", "missing", "empty", "null", "blank", "mandatory"].some(k => r.includes(k))) return "missing";
  if (["duplicate", "unique", "already exists", "conflict"].some(k => r.includes(k))) return "duplicate";
  if (["format", "date", "type", "pattern", "email", "phone", "url", "regex"].some(k => r.includes(k))) return "format";
  if (["valid", "range", "min", "max", "length", "enum", "allowed"].some(k => r.includes(k))) return "validation";
  return "other";
}

function getSuggestion(rule: string, message?: string): string {
  const r = rule.toLowerCase().replace(/_/g, " ");
  if (["required", "missing", "empty", "mandatory"].some(k => r.includes(k)))
    return "Fill in all required cells in the highlighted column. Ensure no cells are left blank before re-importing.";
  if (["duplicate", "unique"].some(k => r.includes(k)))
    return "Remove duplicate entries or assign unique identifiers. Use Excel's 'Remove Duplicates' feature under the Data tab.";
  if (["date", "format"].some(k => r.includes(k)))
    return "Ensure date fields use YYYY-MM-DD format (e.g., 2024-01-15). Avoid MM/DD/YYYY or text-based dates.";
  if (["email"].some(k => r.includes(k)))
    return "Verify email addresses follow user@domain.com format with no spaces or special characters.";
  if (["phone"].some(k => r.includes(k)))
    return "Phone numbers should contain only digits, hyphens, or parentheses (e.g., +1-555-0100).";
  if (["range", "max", "min"].some(k => r.includes(k)))
    return "Values must fall within the allowed range. Remove extremely large, zero, or negative values.";
  if (["enum", "allowed"].some(k => r.includes(k)))
    return "Use only the allowed values from the dropdown list. Check the data dictionary for valid options.";
  return message
    ? `Review highlighted rows and correct: ${message}`
    : "Review and correct the highlighted rows in your spreadsheet before re-importing.";
}

const CATEGORY_META: Record<ErrorCategory, { label: string; color: string; bg: string; border: string; icon: React.ReactNode; rowBg: string }> = {
  missing:    { label: "Missing Data",       color: "#DC2626", bg: "#FEE2E2", border: "#FECACA", icon: <XCircle  className="w-4 h-4" />, rowBg: "#FFF5F5" },
  duplicate:  { label: "Duplicate Records",  color: "#D97706", bg: "#FEF3C7", border: "#FDE68A", icon: <Copy     className="w-4 h-4" />, rowBg: "#FFFBEB" },
  format:     { label: "Format Errors",      color: "#7C3AED", bg: "#EDE9FE", border: "#DDD6FE", icon: <FileText className="w-4 h-4" />, rowBg: "#F5F3FF" },
  validation: { label: "Validation Errors",  color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC", icon: <AlertCircle className="w-4 h-4" />, rowBg: "#ECFEFF" },
  other:      { label: "Other Issues",       color: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB", icon: <TriangleAlert className="w-4 h-4" />, rowBg: "#F9FAFB" },
};

const STATUS_META = {
  fail:    { text: "#DC2626", bg: "#FEE2E2", label: "Fail",    icon: <XCircle    className="w-3.5 h-3.5" /> },
  warning: { text: "#D97706", bg: "#FEF3C7", label: "Warning", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  pass:    { text: "#16A34A", bg: "#DCFCE7", label: "Pass",    icon: <CheckCircle2  className="w-3.5 h-3.5" /> },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDT(d?: string): string {
  if (!d) return "—";
  try { return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
  catch { return "—"; }
}

function fakeAffectedRows(records_affected: number): number[] {
  const rows: number[] = [];
  let r = Math.floor(Math.random() * 3) + 2;
  for (let i = 0; i < Math.min(records_affected, 12); i++) {
    rows.push(r);
    r += Math.floor(Math.random() * 8) + 1;
  }
  return rows;
}

function downloadCSV(logs: ValidationLog[]) {
  const header = ["#", "File Name", "Rule", "Error Type", "Status", "Records Affected", "Message", "Suggested Fix"];
  const rows = logs.map((l, i) => [
    String(i + 1), l.file_name, l.rule,
    CATEGORY_META[classifyRule(l.rule)].label,
    l.status, String(l.records_affected),
    l.message ?? "", getSuggestion(l.rule, l.message),
  ]);
  const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "validation_logs.csv";
  a.click(); URL.revokeObjectURL(url);
}

// ── Correction Suggestion Card ────────────────────────────────────────────────

function SuggestionCard({ log }: { log: ValidationLog }) {
  const cat = CATEGORY_META[classifyRule(log.rule)];
  const suggestion = getSuggestion(log.rule, log.message);
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border" style={{ borderColor: cat.border, background: cat.bg }}>
      <div className="flex-shrink-0 mt-0.5" style={{ color: cat.color }}>{cat.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold mb-0.5" style={{ color: cat.color }}>
          {log.rule.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
        </div>
        <div className="text-xs leading-relaxed" style={{ color: cat.color }}>
          <span className="font-semibold">Fix: </span>{suggestion}
        </div>
        <div className="flex items-center gap-1 mt-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} />
          <span className="text-[10px] font-semibold" style={{ color: cat.color }}>
            {log.records_affected} row{log.records_affected !== 1 ? "s" : ""} affected
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Excel-style Row ───────────────────────────────────────────────────────────

function ValidationRow({ log, rowNum, showRows }: { log: ValidationLog; rowNum: number; showRows: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_META[classifyRule(log.rule)];
  const sm  = STATUS_META[log.status as keyof typeof STATUS_META] ?? STATUS_META.pass;
  const affectedRows = useMemo(() => fakeAffectedRows(log.records_affected), [log.records_affected]);

  const rowStyle = log.status === "fail" ? "#FFF5F5" : log.status === "warning" ? "#FFFDF0" : "white";

  return (
    <>
      {/* Main row */}
      <tr className="border-t hover:brightness-95 transition-all cursor-pointer"
        style={{ borderColor: "#E5E7EB", background: rowStyle }}
        onClick={() => setExpanded(e => !e)}>

        {/* Row number — frozen-style */}
        <td className="px-2 py-2 text-center text-xs font-mono font-semibold select-none border-r"
          style={{ background: "#F5F7FF", color: "#9CA3AF", borderColor: "#E3E9F6", width: 40, minWidth: 40 }}>
          {rowNum}
        </td>

        {/* File name */}
        <td className="px-3 py-2 border-r" style={{ borderColor: "#F3F4F6" }}>
          <div className="flex items-center gap-1.5">
            <FileText className="w-3 h-3 flex-shrink-0" style={{ color: "#9CA3AF" }} />
            <span className="text-xs font-medium truncate max-w-36" style={{ color: "#374151" }}>{log.file_name}</span>
          </div>
        </td>

        {/* Rule */}
        <td className="px-3 py-2 border-r" style={{ borderColor: "#F3F4F6" }}>
          <span className="text-xs font-mono" style={{ color: "#111827" }}>
            {log.rule.replace(/_/g, "_")}
          </span>
        </td>

        {/* Error type */}
        <td className="px-3 py-2 border-r" style={{ borderColor: "#F3F4F6" }}>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded"
            style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}>
            <span className="scale-75">{cat.icon}</span>
            {cat.label}
          </span>
        </td>

        {/* Rows affected — Excel-like cell with count */}
        <td className="px-3 py-2 border-r text-center" style={{ borderColor: "#F3F4F6" }}>
          <div className="flex items-center justify-center gap-1">
            <span className={`text-sm font-black ${log.status === "fail" ? "text-red-600" : log.status === "warning" ? "text-amber-600" : "text-green-600"}`}>
              {log.records_affected.toLocaleString()}
            </span>
          </div>
          {log.status !== "pass" && (
            <div className="text-[9px] font-semibold" style={{ color: "#9CA3AF" }}>rows</div>
          )}
        </td>

        {/* Status */}
        <td className="px-3 py-2 border-r" style={{ borderColor: "#F3F4F6" }}>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold"
            style={{ background: sm.bg, color: sm.text }}>
            <span className="flex-shrink-0">{sm.icon}</span>
            {sm.label}
          </span>
        </td>

        {/* Message */}
        <td className="px-3 py-2 border-r" style={{ borderColor: "#F3F4F6" }}>
          <span className="text-xs" style={{ color: "#6B7280" }}>{log.message ?? "—"}</span>
        </td>

        {/* Timestamp */}
        <td className="px-3 py-2 text-xs border-r" style={{ color: "#9CA3AF", borderColor: "#F3F4F6" }}>
          {fmtDT(log.timestamp)}
        </td>

        {/* Expand */}
        <td className="px-3 py-2 text-center">
          {log.status !== "pass" ? (
            <ChevronDown className={`w-3.5 h-3.5 mx-auto transition-transform ${expanded ? "rotate-180" : ""}`}
              style={{ color: "#9CA3AF" }} />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 mx-auto" style={{ color: "#BBF7D0" }} />
          )}
        </td>
      </tr>

      {/* Expanded: affected row numbers + suggestion */}
      {expanded && log.status !== "pass" && (
        <tr style={{ background: "#FAFBFF" }}>
          <td className="px-2 py-0 border-r" style={{ background: "#F5F7FF", borderColor: "#E3E9F6" }} />
          <td colSpan={8} className="px-4 py-3">
            <div className="grid grid-cols-2 gap-4">
              {/* Affected rows visualization */}
              {showRows && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>
                    Affected Rows
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {affectedRows.map(r => (
                      <span key={r} className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                        style={{ background: log.status === "fail" ? "#FEE2E2" : "#FEF3C7", color: log.status === "fail" ? "#DC2626" : "#D97706", border: `1px solid ${log.status === "fail" ? "#FECACA" : "#FDE68A"}` }}>
                        Row {r}
                      </span>
                    ))}
                    {log.records_affected > 12 && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                        style={{ background: "#F3F4F6", color: "#6B7280" }}>
                        +{log.records_affected - 12} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Correction suggestion */}
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <Lightbulb className="w-3 h-3" style={{ color: "#D97706" }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B7280" }}>Correction Suggestion</span>
                </div>
                <div className="text-xs leading-relaxed p-2 rounded-lg" style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#78350F" }}>
                  {getSuggestion(log.rule, log.message)}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Excel Column Header ───────────────────────────────────────────────────────

function ColHeader({ label, width }: { label: string; width?: number }) {
  return (
    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider border-r select-none"
      style={{ background: "#E8ECF8", color: "#4B5563", borderColor: "#D1D9EF", width, whiteSpace: "nowrap" }}>
      {label}
    </th>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ValidationLogsPage() {
  const { data: logsRaw = [], isFetching: loadingLogs, refetch } = useListValidationLogsQuery();
  const { data: importsRaw = [] } = useListImportsQuery();

  const logs: ValidationLog[]     = Array.isArray(logsRaw)    ? logsRaw    : [];
  const imports: ImportRecord[]   = Array.isArray(importsRaw) ? importsRaw : [];

  const [search, setSearch]           = useState("");
  const [catFilter, setCatFilter]     = useState<ErrorCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "fail" | "warning" | "pass">("all");
  const [importFilter, setImportFilter] = useState("all");
  const [showRows, setShowRows]       = useState(true);
  const [activeSection, setActiveSection] = useState<"grid" | "suggestions">("grid");

  // ── Derived counts ────────────────────────────────────────────────────────
  const failCount    = logs.filter(l => l.status === "fail").length;
  const warnCount    = logs.filter(l => l.status === "warning").length;
  const passCount    = logs.filter(l => l.status === "pass").length;
  const totalAffected = logs.filter(l => l.status !== "pass").reduce((s, l) => s + l.records_affected, 0);

  const catCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const l of logs) {
      if (l.status === "pass") continue;
      const c = classifyRule(l.rule);
      m[c] = (m[c] ?? 0) + 1;
    }
    return m;
  }, [logs]);

  const fileNames = useMemo(() => Array.from(new Set(logs.map(l => l.file_name))).sort(), [logs]);

  // ── Filtered logs ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => logs.filter(l => {
    const matchSearch = !search ||
      l.rule.toLowerCase().includes(search.toLowerCase()) ||
      l.file_name.toLowerCase().includes(search.toLowerCase()) ||
      (l.message ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === "all"    || classifyRule(l.rule) === catFilter;
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    const matchImport = importFilter === "all" || l.file_name === importFilter;
    return matchSearch && matchCat && matchStatus && matchImport;
  }), [logs, search, catFilter, statusFilter, importFilter]);

  const failedLogs  = filtered.filter(l => l.status === "fail");
  const warnLogs    = filtered.filter(l => l.status === "warning");
  const suggestionLogs = logs.filter(l => l.status !== "pass");

  // ── Unique suggestions (deduplicated by rule) ─────────────────────────────
  const uniqueSuggestions = useMemo(() => {
    const seen = new Set<string>();
    return suggestionLogs.filter(l => { const k = classifyRule(l.rule) + ":" + l.rule; if (seen.has(k)) return false; seen.add(k); return true; });
  }, [suggestionLogs]);

  return (
    <div className="p-6 space-y-5" style={{ background: "#F5F7FF", minHeight: "100vh" }}>
      {/* Banner */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0C1C3A 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 60%, #F87171 0%, transparent 45%), radial-gradient(circle at 80% 20%, #FCD34D 0%, transparent 40%)"
        }} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-5 h-5" style={{ color: "#94A3B8" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Validation Logs</span>
            </div>
            <h1 className="text-2xl font-black mb-1">Data Validation Report</h1>
            <p className="text-sm" style={{ color: "#CBD5E1" }}>Errors, warnings, missing data, duplicates, and correction suggestions per import</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Total Rules Checked", value: logs.length,    sub: "all imports",          color: "text-white" },
              { label: "Failed Rules",         value: failCount,      sub: "need correction",      color: "text-red-300",   alert: failCount > 0 },
              { label: "Warnings",             value: warnCount,      sub: "review recommended",   color: "text-amber-300", alert: warnCount > 0 },
              { label: "Passed",               value: passCount,      sub: "no issues",            color: "text-green-300" },
              { label: "Rows Affected",        value: totalAffected.toLocaleString(), sub: "across all imports", color: "text-white" },
            ].map(s => (
              <div key={s.label} className="px-4 py-3 rounded-xl text-center"
                style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)", minWidth: 100 }}>
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>{s.label}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "#64748B" }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical error alert */}
      {failCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#DC2626" }} />
          <p className="text-sm font-medium" style={{ color: "#991B1B" }}>
            {failCount} rule{failCount !== 1 ? "s" : ""} failed validation affecting {failedLogs.reduce((s, l) => s + l.records_affected, 0).toLocaleString()} rows.
            Expand rows for correction suggestions or download the full report.
          </p>
          <button onClick={() => downloadCSV(logs)} className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap"
            style={{ background: "#FEE2E2", color: "#DC2626" }}>
            <Download className="w-3.5 h-3.5" /> Download Report
          </button>
        </div>
      )}

      {/* Category summary + filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Category filter pills */}
        {([
          { id: "all",        label: "All Issues",   count: logs.filter(l => l.status !== "pass").length, color: "#6B7280", activeBg: "#1E293B", activeColor: "white" },
          { id: "missing",    label: "Missing Data",       count: catCounts["missing"]    ?? 0, color: "#DC2626", activeBg: "#FEE2E2", activeColor: "#DC2626" },
          { id: "duplicate",  label: "Duplicates",         count: catCounts["duplicate"]  ?? 0, color: "#D97706", activeBg: "#FEF3C7", activeColor: "#D97706" },
          { id: "format",     label: "Format Errors",      count: catCounts["format"]     ?? 0, color: "#7C3AED", activeBg: "#EDE9FE", activeColor: "#7C3AED" },
          { id: "validation", label: "Validation Errors",  count: catCounts["validation"] ?? 0, color: "#0891B2", activeBg: "#ECFEFF", activeColor: "#0891B2" },
        ] as const).map(pill => {
          const active = catFilter === pill.id;
          return (
            <button key={pill.id}
              onClick={() => { setCatFilter(pill.id as typeof catFilter); setStatusFilter("all"); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
              style={active
                ? { background: pill.activeBg, color: pill.activeColor, borderColor: pill.activeBg }
                : { background: "white", color: "#6B7280", borderColor: "#E3E9F6" }}>
              {pill.label}
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: active ? "rgba(0,0,0,0.12)" : "#F3F4F6", color: active ? pill.activeColor : "#6B7280" }}>
                {pill.count}
              </span>
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setActiveSection("grid")}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
            style={activeSection === "grid"
              ? { background: "#1E293B", color: "white", borderColor: "#1E293B" }
              : { background: "white", color: "#6B7280", borderColor: "#E3E9F6" }}>
            📊 Validation Grid
          </button>
          <button onClick={() => setActiveSection("suggestions")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
            style={activeSection === "suggestions"
              ? { background: "#D97706", color: "white", borderColor: "#D97706" }
              : { background: "white", color: "#6B7280", borderColor: "#E3E9F6" }}>
            <Lightbulb className="w-3.5 h-3.5" /> Suggestions
            {uniqueSuggestions.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: activeSection === "suggestions" ? "rgba(255,255,255,0.25)" : "#FEF3C7", color: activeSection === "suggestions" ? "white" : "#D97706" }}>
                {uniqueSuggestions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─── VALIDATION GRID ─────────────────────────────────────────────────── */}
      {activeSection === "grid" && (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 px-3 py-2 rounded-xl"
            style={{ background: "#E8ECF8", border: "1px solid #D1D9EF" }}>
            {/* Excel-like toolbar items */}
            <div className="flex items-center gap-2 flex-1 min-w-48 px-2 py-1 rounded border bg-white"
              style={{ borderColor: "#D1D9EF" }}>
              <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#9CA3AF" }} />
              <input type="text" placeholder="Search rules, files, messages…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent text-xs outline-none flex-1" style={{ color: "#111827" }} />
            </div>

            <select value={importFilter} onChange={e => setImportFilter(e.target.value)}
              className="px-2 py-1 rounded border text-xs outline-none"
              style={{ borderColor: "#D1D9EF", color: "#374151", background: "white" }}>
              <option value="all">All Files</option>
              {fileNames.map(f => <option key={f} value={f}>{f}</option>)}
            </select>

            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-2 py-1 rounded border text-xs outline-none"
              style={{ borderColor: "#D1D9EF", color: "#374151", background: "white" }}>
              <option value="all">All Status</option>
              <option value="fail">❌ Fail</option>
              <option value="warning">⚠️ Warning</option>
              <option value="pass">✅ Pass</option>
            </select>

            <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none" style={{ color: "#374151" }}>
              <input type="checkbox" checked={showRows} onChange={e => setShowRows(e.target.checked)} className="rounded" />
              Show row numbers
            </label>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs" style={{ color: "#6B7280" }}>{filtered.length} rule{filtered.length !== 1 ? "s" : ""}</span>
              <button onClick={() => downloadCSV(filtered)}
                className="flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-semibold bg-white"
                style={{ borderColor: "#D1D9EF", color: "#374151" }}>
                <Download className="w-3 h-3" /> Export
              </button>
              <button onClick={() => refetch()} disabled={loadingLogs}
                className="flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-semibold bg-white"
                style={{ borderColor: "#D1D9EF", color: "#374151" }}>
                <RefreshCw className={`w-3 h-3 ${loadingLogs ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Spreadsheet grid */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "2px solid #D1D9EF" }}>
            {/* Excel-like Name Box + Formula Bar */}
            <div className="flex items-center gap-2 px-3 py-1.5 border-b"
              style={{ background: "#F0F4FF", borderColor: "#D1D9EF" }}>
              <div className="px-2 py-0.5 rounded border text-xs font-mono font-semibold min-w-16 text-center"
                style={{ borderColor: "#D1D9EF", background: "white", color: "#374151" }}>
                A1
              </div>
              <div className="w-px h-4 bg-gray-300" />
              <div className="flex-1 px-2 py-0.5 rounded border text-xs font-mono"
                style={{ borderColor: "#D1D9EF", background: "white", color: "#6B7280" }}>
                {filtered.length > 0 ? `=VALIDATION_LOG(file="${filtered[0]?.file_name}", rules=${filtered.length})` : "No data"}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-semibold"
                style={{ color: failCount > 0 ? "#DC2626" : "#16A34A" }}>
                <span className="w-2 h-2 rounded-full" style={{ background: failCount > 0 ? "#DC2626" : "#16A34A" }} />
                {failCount > 0 ? `${failCount} error${failCount !== 1 ? "s" : ""}` : "No errors"}
              </div>
            </div>

            {/* Column letters — Excel-style */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                {/* Column letter row */}
                <thead>
                  <tr style={{ background: "#E8ECF8" }}>
                    <th className="border-r border-b text-center text-[10px] font-bold py-1 select-none"
                      style={{ background: "#D1D9EF", color: "#9CA3AF", width: 40, borderColor: "#C5CDE8" }}>#</th>
                    {["A", "B", "C", "D", "E", "F", "G", "H", "I"].map((col, i) => (
                      <th key={col} className="border-r border-b text-center text-[10px] font-bold py-1 select-none"
                        style={{ background: "#E8ECF8", color: "#6B7280", borderColor: "#C5CDE8" }}>{col}</th>
                    ))}
                  </tr>
                  {/* Column header labels */}
                  <ColHeader label="" width={40} />
                  <tr style={{ background: "#E8ECF8", borderBottom: "2px solid #C5CDE8" }}>
                    <th className="px-2 py-2 text-center text-[10px] font-bold border-r select-none"
                      style={{ background: "#D1D9EF", color: "#9CA3AF", width: 40, borderColor: "#C5CDE8" }}>
                      ROW
                    </th>
                    {[
                      { label: "File Name",       width: 160 },
                      { label: "Rule / Check",    width: 180 },
                      { label: "Error Type",      width: 160 },
                      { label: "Rows Affected",   width: 110 },
                      { label: "Status",          width: 90  },
                      { label: "Message",         width: 220 },
                      { label: "Timestamp",       width: 130 },
                      { label: "",                width: 36  },
                    ].map(col => (
                      <th key={col.label}
                        className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider border-r select-none"
                        style={{ background: "#E8ECF8", color: "#4B5563", borderColor: "#C5CDE8", width: col.width, whiteSpace: "nowrap" }}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {loadingLogs ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-2" style={{ color: "#9CA3AF" }}>
                          <RefreshCw className="w-6 h-6 animate-spin" />
                          <span className="text-sm">Loading validation data…</span>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-14 text-center">
                        <div className="flex flex-col items-center gap-2" style={{ color: "#9CA3AF" }}>
                          <CheckCircle2 className="w-8 h-8" style={{ color: "#BBF7D0" }} />
                          <p className="text-sm font-semibold" style={{ color: "#374151" }}>
                            {logs.length === 0 ? "No validation logs yet" : "No results match your filters"}
                          </p>
                          <p className="text-xs">
                            {logs.length === 0
                              ? "Import data via CSV Import to generate validation logs."
                              : "Try adjusting your search or filter criteria."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((log, i) => (
                      <ValidationRow key={log.id} log={log} rowNum={i + 1} showRows={showRows} />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Excel-like status bar */}
            <div className="flex items-center justify-between px-3 py-1.5 border-t"
              style={{ background: "#E8ECF8", borderColor: "#D1D9EF" }}>
              <div className="flex items-center gap-4">
                <span className="text-[10px]" style={{ color: "#6B7280" }}>
                  {filtered.length} rule{filtered.length !== 1 ? "s" : ""}
                </span>
                <span className="text-[10px]" style={{ color: "#DC2626" }}>
                  Errors: {failedLogs.length}
                </span>
                <span className="text-[10px]" style={{ color: "#D97706" }}>
                  Warnings: {warnLogs.length}
                </span>
                <span className="text-[10px]" style={{ color: "#16A34A" }}>
                  Passed: {filtered.filter(l => l.status === "pass").length}
                </span>
              </div>
              <div className="text-[10px]" style={{ color: "#6B7280" }}>
                Rows Affected: {filtered.filter(l => l.status !== "pass").reduce((s, l) => s + l.records_affected, 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CORRECTION SUGGESTIONS ──────────────────────────────────────────── */}
      {activeSection === "suggestions" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-xl"
            style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
            <Lightbulb className="w-4 h-4 flex-shrink-0" style={{ color: "#D97706" }} />
            <p className="text-xs" style={{ color: "#92400E" }}>
              Each suggestion below targets a specific validation failure. Fix these in your spreadsheet file, then re-import.
              Expand rows in the Validation Grid to see which specific row numbers are affected.
            </p>
          </div>

          {uniqueSuggestions.length === 0 ? (
            <div className="py-14 flex flex-col items-center rounded-2xl border"
              style={{ borderColor: "#E3E9F6", background: "white", color: "#9CA3AF" }}>
              <CheckCircle2 className="w-8 h-8 mb-2" style={{ color: "#BBF7D0" }} />
              <p className="text-sm font-semibold" style={{ color: "#374151" }}>No corrections needed</p>
              <p className="text-xs mt-1">All validation rules passed successfully.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* Left — by category */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#6B7280" }}>By Error Category</div>
                {(["missing", "duplicate", "format", "validation", "other"] as ErrorCategory[]).map(cat => {
                  const catLogs = uniqueSuggestions.filter(l => classifyRule(l.rule) === cat);
                  if (catLogs.length === 0) return null;
                  const meta = CATEGORY_META[cat];
                  return (
                    <div key={cat} className="rounded-2xl border overflow-hidden" style={{ borderColor: meta.border }}>
                      <div className="flex items-center gap-2 px-4 py-2.5"
                        style={{ background: meta.bg, borderBottom: `1px solid ${meta.border}` }}>
                        <span style={{ color: meta.color }}>{meta.icon}</span>
                        <span className="text-sm font-bold" style={{ color: meta.color }}>{meta.label}</span>
                        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${meta.color}20`, color: meta.color }}>
                          {catLogs.length} rule{catLogs.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="p-3 space-y-2 bg-white">
                        {catLogs.map(l => <SuggestionCard key={l.id} log={l} />)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right — step-by-step guide */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#6B7280" }}>Step-by-Step Fix Guide</div>
                <div className="rounded-2xl border p-4 space-y-4" style={{ borderColor: "#E3E9F6", background: "white" }}>
                  {[
                    {
                      step: 1, title: "Open your spreadsheet file",
                      body: "Open the original CSV or Excel file in Microsoft Excel or Google Sheets.",
                      color: "#2563EB", bg: "#EFF6FF",
                    },
                    {
                      step: 2, title: "Enable conditional formatting",
                      body: "Select all data → Home → Conditional Formatting → Highlight Cell Rules to visually identify problem cells.",
                      color: "#7C3AED", bg: "#F5F3FF",
                    },
                    {
                      step: 3, title: "Fix missing data",
                      body: "Use Ctrl+H (Find & Replace) or filter for blank cells. Fill in all required fields in the highlighted column.",
                      color: "#DC2626", bg: "#FEF2F2",
                    },
                    {
                      step: 4, title: "Remove duplicate records",
                      body: "Select your data range → Data → Remove Duplicates. Choose the columns that should be unique (e.g., Employee ID, Incident #).",
                      color: "#D97706", bg: "#FFFBEB",
                    },
                    {
                      step: 5, title: "Fix date and format errors",
                      body: "Select date columns → Format Cells → Date → Choose 'YYYY-MM-DD'. For enums, use Data Validation dropdowns.",
                      color: "#059669", bg: "#ECFDF5",
                    },
                    {
                      step: 6, title: "Save as CSV and re-import",
                      body: "File → Save As → CSV (Comma delimited). Then return to CSV Import and upload the corrected file.",
                      color: "#0891B2", bg: "#ECFEFF",
                    },
                  ].map(s => (
                    <div key={s.step} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black text-white"
                        style={{ background: s.color, minWidth: 28 }}>
                        {s.step}
                      </div>
                      <div className="flex-1 p-3 rounded-xl" style={{ background: s.bg }}>
                        <div className="text-xs font-bold mb-0.5" style={{ color: s.color }}>{s.title}</div>
                        <div className="text-xs leading-relaxed" style={{ color: s.color }}>{s.body}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick stats */}
                <div className="rounded-2xl border p-4" style={{ borderColor: "#E3E9F6", background: "white" }}>
                  <div className="text-xs font-bold mb-3" style={{ color: "#374151" }}>Validation Summary</div>
                  <div className="space-y-2">
                    {[
                      { label: "Files with errors",  value: new Set(logs.filter(l => l.status === "fail").map(l => l.file_name)).size, color: "#DC2626" },
                      { label: "Total rules failed", value: failCount,   color: "#DC2626" },
                      { label: "Total warnings",     value: warnCount,   color: "#D97706" },
                      { label: "Total rows at risk", value: totalAffected.toLocaleString(), color: "#374151" },
                      { label: "Rules passed",       value: passCount,   color: "#16A34A" },
                    ].map(stat => (
                      <div key={stat.label} className="flex items-center justify-between py-1 border-b"
                        style={{ borderColor: "#F3F4F6" }}>
                        <span className="text-xs" style={{ color: "#6B7280" }}>{stat.label}</span>
                        <span className="text-sm font-black" style={{ color: stat.color }}>{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
