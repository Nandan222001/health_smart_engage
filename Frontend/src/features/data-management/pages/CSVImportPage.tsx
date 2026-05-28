import { useState, useRef, useMemo, useCallback } from "react";
import {
  Upload, FileText, Map, Eye, CheckCircle2, ChevronRight,
  AlertTriangle, X, RefreshCw, Loader2, AlertCircle,
  Download, Database, Clock, CheckCheck, XCircle, Info,
} from "lucide-react";
import {
  useCreateImportMutation,
  useListImportsQuery,
  useListValidationLogsQuery,
} from "@/features/data-management/api/dataManagementApi";
import type { ImportRecord } from "@/features/data-management/api/dataManagementApi";

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  function parseLine(line: string): string[] {
    const result: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        result.push(cur.trim()); cur = "";
      } else {
        cur += ch;
      }
    }
    result.push(cur.trim());
    return result;
  }

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

// ── Field definitions per data type ──────────────────────────────────────────

const DATA_TYPES: Record<string, { label: string; icon: string; fields: { key: string; label: string; required: boolean; type: "string" | "date" | "enum"; enum?: string[] }[] }> = {
  incidents: {
    label: "Incidents", icon: "🚨",
    fields: [
      { key: "title",       label: "Title",         required: true,  type: "string" },
      { key: "type",        label: "Type",           required: false, type: "string" },
      { key: "severity",    label: "Severity",       required: true,  type: "enum",   enum: ["critical","high","medium","low"] },
      { key: "status",      label: "Status",         required: false, type: "enum",   enum: ["open","investigating","resolved","closed"] },
      { key: "occurred_at", label: "Occurred At",    required: true,  type: "date" },
      { key: "location",    label: "Location",       required: false, type: "string" },
      { key: "description", label: "Description",    required: false, type: "string" },
    ],
  },
  employees: {
    label: "Employees", icon: "👤",
    fields: [
      { key: "name",        label: "Full Name",      required: true,  type: "string" },
      { key: "email",       label: "Email",          required: true,  type: "string" },
      { key: "role",        label: "Role",           required: false, type: "string" },
      { key: "department",  label: "Department",     required: false, type: "string" },
      { key: "status",      label: "Status",         required: false, type: "enum",   enum: ["active","inactive"] },
      { key: "joined_at",   label: "Joined Date",    required: false, type: "date" },
    ],
  },
  vendors: {
    label: "Vendors", icon: "🏢",
    fields: [
      { key: "company_name",  label: "Company Name",   required: true,  type: "string" },
      { key: "contact",       label: "Contact Person", required: false, type: "string" },
      { key: "email",         label: "Email",          required: false, type: "string" },
      { key: "phone",         label: "Phone",          required: false, type: "string" },
      { key: "trade_type",    label: "Trade / Service",required: false, type: "string" },
      { key: "status",        label: "Status",         required: false, type: "enum",   enum: ["Active","Pending","Inactive","Suspended"] },
      { key: "site_location", label: "Site Location",  required: false, type: "string" },
    ],
  },
  hazards: {
    label: "Hazards", icon: "⚠️",
    fields: [
      { key: "title",       label: "Title",          required: true,  type: "string" },
      { key: "type",        label: "Hazard Type",    required: false, type: "string" },
      { key: "severity",    label: "Severity",       required: true,  type: "enum",   enum: ["critical","high","medium","low"] },
      { key: "status",      label: "Status",         required: false, type: "enum",   enum: ["open","mitigated","closed"] },
      { key: "description", label: "Description",    required: false, type: "string" },
      { key: "mitigation",  label: "Mitigation",     required: false, type: "string" },
    ],
  },
  assets: {
    label: "Assets", icon: "🔧",
    fields: [
      { key: "name",          label: "Asset Name",     required: true,  type: "string" },
      { key: "type",          label: "Asset Type",     required: false, type: "string" },
      { key: "status",        label: "Status",         required: false, type: "string" },
      { key: "serial_number", label: "Serial Number",  required: false, type: "string" },
      { key: "purchased_at",  label: "Purchase Date",  required: false, type: "date" },
      { key: "location",      label: "Location",       required: false, type: "string" },
    ],
  },
  training: {
    label: "Training Records", icon: "📚",
    fields: [
      { key: "employee_name", label: "Employee Name",  required: true,  type: "string" },
      { key: "course_name",   label: "Course Name",    required: true,  type: "string" },
      { key: "completed_at",  label: "Completed Date", required: false, type: "date" },
      { key: "score",         label: "Score",          required: false, type: "string" },
      { key: "status",        label: "Status",         required: false, type: "enum",   enum: ["completed","failed","in_progress"] },
    ],
  },
};

// ── Auto-map helper ───────────────────────────────────────────────────────────

function autoMap(headers: string[], dataType: string): Record<string, string> {
  const fields = DATA_TYPES[dataType]?.fields ?? [];
  const map: Record<string, string> = {};
  headers.forEach((h) => {
    const hLower = h.toLowerCase().replace(/[\s_-]/g, "");
    const match = fields.find((f) => {
      const fLower = f.key.replace(/_/g, "");
      const lLower = f.label.toLowerCase().replace(/\s/g, "");
      return hLower === fLower || hLower === lLower || hLower.includes(fLower) || fLower.includes(hLower);
    });
    if (match) map[h] = match.key;
  });
  return map;
}

// ── Validation ────────────────────────────────────────────────────────────────

interface ValidationError { row: number; field: string; message: string; severity: "error" | "warning" }

function validateRows(rows: string[][], headers: string[], fieldMap: Record<string, string>, dataType: string): ValidationError[] {
  const fields = DATA_TYPES[dataType]?.fields ?? [];
  const errors: ValidationError[] = [];
  const reverseMap: Record<string, number> = {};
  headers.forEach((h, i) => { reverseMap[h] = i; });

  rows.forEach((row, ri) => {
    fields.forEach((field) => {
      const csvHeader = Object.keys(fieldMap).find((k) => fieldMap[k] === field.key);
      if (!csvHeader) {
        if (field.required) {
          errors.push({ row: ri + 2, field: field.label, message: "Required field not mapped", severity: "error" });
        }
        return;
      }
      const colIdx = reverseMap[csvHeader];
      const val = row[colIdx]?.trim() ?? "";

      if (field.required && !val) {
        errors.push({ row: ri + 2, field: field.label, message: "Required value is empty", severity: "error" });
        return;
      }
      if (!val) return;

      if (field.type === "date") {
        const d = new Date(val);
        if (isNaN(d.getTime())) {
          errors.push({ row: ri + 2, field: field.label, message: `Invalid date: "${val}"`, severity: "error" });
        }
      }
      if (field.type === "enum" && field.enum) {
        if (!field.enum.includes(val) && !field.enum.includes(val.toLowerCase())) {
          errors.push({ row: ri + 2, field: field.label, message: `"${val}" not in [${field.enum.join(", ")}]`, severity: "warning" });
        }
      }
    });
  });
  return errors;
}

// ── Shared atoms ──────────────────────────────────────────────────────────────

function HeroStat({ label, value, color, sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div className="flex-1 px-5 py-4 text-center">
      <div className="text-[22px] font-black text-white leading-none" style={color ? { color } : undefined}>{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{sub}</div>}
      <div className="text-[11px] font-semibold mt-1 uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.55)" }}>{label}</div>
    </div>
  );
}
function HeroDivider() { return <div className="w-px my-3" style={{ background: "rgba(255,255,255,0.15)" }} />; }

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border bg-white ${className}`} style={{ borderColor: "#E3E9F6" }}>{children}</div>;
}

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: "Upload",    icon: Upload },
  { n: 2, label: "Configure", icon: Database },
  { n: 3, label: "Map Fields",icon: Map },
  { n: 4, label: "Preview",   icon: Eye },
  { n: 5, label: "Import",    icon: CheckCheck },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 px-6 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
      {STEPS.map((s, i) => {
        const done    = current > s.n;
        const active  = current === s.n;
        const color   = done ? "#16A34A" : active ? "#3B57C4" : "#D1D9F0";
        const textCol = done ? "#16A34A" : active ? "#3B57C4" : "#9CA3AF";
        return (
          <div key={s.n} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all"
                style={{ background: done ? "#DCFCE7" : active ? "#EEF2FF" : "#F8FAFF", border: `2px solid ${color}` }}>
                {done ? <CheckCircle2 size={13} style={{ color: "#16A34A" }} /> : (
                  <span style={{ color }}>{s.n}</span>
                )}
              </div>
              <span className="text-[11px] font-bold hidden sm:block" style={{ color: textCol }}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-8 sm:w-12 h-px mx-2" style={{ background: current > s.n ? "#16A34A" : "#E3E9F6" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: Upload ────────────────────────────────────────────────────────────

function StepUpload({ onFile }: { onFile: (file: File, headers: string[], rows: string[][]) => void }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setError("");
    if (!file.name.endsWith(".csv")) { setError("Only .csv files are supported."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("File must be under 10 MB."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0) { setError("CSV appears to be empty or unreadable."); return; }
      onFile(file, headers, rows);
    };
    reader.readAsText(file);
  }, [onFile]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h3 className="text-sm font-black text-gray-800">Upload CSV File</h3>
        <p className="text-xs text-gray-400 mt-0.5">Supported: .csv · Max size: 10 MB · UTF-8 encoding</p>
      </div>

      <div
        className="relative rounded-2xl border-2 border-dashed p-12 text-center transition-all cursor-pointer"
        style={{ borderColor: dragging ? "#3B57C4" : "#D1D9F0", background: dragging ? "#EEF2FF" : "#F8FAFF" }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept=".csv" className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: dragging ? "#DBEAFE" : "#EEF2FF" }}>
          <Upload size={22} style={{ color: "#3B57C4" }} />
        </div>
        <p className="text-sm font-bold text-gray-700">Drag & drop your CSV here</p>
        <p className="text-xs text-gray-400 mt-1">or <span className="text-blue-600 font-semibold">click to browse</span></p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: "#FEF2F2" }}>
          <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
          <span className="text-xs font-semibold text-red-600">{error}</span>
        </div>
      )}

      {/* Supported record types */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-3">Supported Record Types</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(DATA_TYPES).map(([key, dt]) => (
            <div key={key} className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "#F8FAFF" }}>
              <span className="text-base">{dt.icon}</span>
              <span className="text-xs font-semibold text-gray-700">{dt.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Configure ─────────────────────────────────────────────────────────

function StepConfigure({ file, headers, rows, dataType, onDataType, onNext }: {
  file: File; headers: string[]; rows: string[][];
  dataType: string; onDataType: (t: string) => void; onNext: () => void;
}) {
  return (
    <div className="p-6 space-y-5">
      <div>
        <h3 className="text-sm font-black text-gray-800">Configure Import</h3>
        <p className="text-xs text-gray-400 mt-0.5">Select what type of records this CSV contains</p>
      </div>

      {/* File info */}
      <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "#F0FDF4" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#DCFCE7" }}>
          <FileText size={16} className="text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 truncate">{file.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {rows.length} rows · {headers.length} columns · {(file.size / 1024).toFixed(1)} KB
          </p>
        </div>
        <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
      </div>

      {/* CSV columns preview */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Detected Columns ({headers.length})</p>
        <div className="flex flex-wrap gap-1.5">
          {headers.map((h) => (
            <span key={h} className="px-2.5 py-1 rounded-lg text-xs font-semibold"
              style={{ background: "#EEF2FF", color: "#3B57C4" }}>{h}</span>
          ))}
        </div>
      </div>

      {/* Data type selection */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Select Record Type *</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(DATA_TYPES).map(([key, dt]) => (
            <button key={key} onClick={() => onDataType(key)}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl border text-left transition-all"
              style={{
                borderColor: dataType === key ? "#3B57C4" : "#E3E9F6",
                background: dataType === key ? "#EEF2FF" : "#F8FAFF",
              }}>
              <span className="text-lg">{dt.icon}</span>
              <div>
                <div className="text-xs font-bold" style={{ color: dataType === key ? "#3B57C4" : "#374151" }}>
                  {dt.label}
                </div>
                <div className="text-[10px] text-gray-400">{dt.fields.length} fields</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={onNext} disabled={!dataType}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all"
          style={{ background: "linear-gradient(135deg, #3B57C4, #1E3A8A)" }}>
          Map Fields <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Field Mapping ─────────────────────────────────────────────────────

function StepFieldMapping({ headers, dataType, fieldMap, onChange, onNext, onBack }: {
  headers: string[]; dataType: string; fieldMap: Record<string, string>;
  onChange: (map: Record<string, string>) => void; onNext: () => void; onBack: () => void;
}) {
  const fields = DATA_TYPES[dataType]?.fields ?? [];
  const requiredMapped = fields.filter((f) => f.required).every((f) => Object.values(fieldMap).includes(f.key));

  return (
    <div className="p-6 space-y-5">
      <div>
        <h3 className="text-sm font-black text-gray-800">Map CSV Columns to System Fields</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Match each CSV column to the correct {DATA_TYPES[dataType]?.label} field. Required fields are marked with *
        </p>
      </div>

      <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#E3E9F6" }}>
        <div className="grid grid-cols-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-400"
          style={{ background: "#F8FAFF", borderBottom: "1px solid #E3E9F6" }}>
          <span>CSV Column</span>
          <span>System Field</span>
        </div>
        <div className="divide-y" style={{ borderColor: "#E3E9F6" }}>
          {headers.map((h) => {
            const mapped = fieldMap[h] ?? "";
            const isMappedField = fields.find((f) => f.key === mapped);
            const isRequired = isMappedField?.required;
            return (
              <div key={h} className="grid grid-cols-2 gap-4 items-center px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700 truncate">{h}</span>
                  {mapped && (
                    <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                  )}
                </div>
                <select
                  className="w-full text-xs px-3 py-1.5 rounded-lg border outline-none focus:ring-2 focus:ring-blue-100"
                  style={{ borderColor: mapped ? "#86EFAC" : "#D1D9F0" }}
                  value={mapped}
                  onChange={(e) => onChange({ ...fieldMap, [h]: e.target.value })}>
                  <option value="">— Skip this column —</option>
                  {fields.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}{f.required ? " *" : ""}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>

      {/* Required fields checklist */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Required Fields</p>
        <div className="flex flex-wrap gap-2">
          {fields.filter((f) => f.required).map((f) => {
            const mapped = Object.values(fieldMap).includes(f.key);
            return (
              <span key={f.key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                style={{ color: mapped ? "#16A34A" : "#DC2626", background: mapped ? "#DCFCE7" : "#FEE2E2" }}>
                {mapped ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                {f.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors">
          ← Back
        </button>
        <button onClick={onNext} disabled={!requiredMapped}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all"
          style={{ background: "linear-gradient(135deg, #3B57C4, #1E3A8A)" }}>
          Preview Data <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ── Step 4: Preview & Validate ────────────────────────────────────────────────

function StepPreview({ headers, rows, fieldMap, dataType, onNext, onBack }: {
  headers: string[]; rows: string[][];
  fieldMap: Record<string, string>; dataType: string;
  onNext: () => void; onBack: () => void;
}) {
  const errors = useMemo(() =>
    validateRows(rows, headers, fieldMap, dataType),
    [rows, headers, fieldMap, dataType]
  );

  const errCount  = errors.filter((e) => e.severity === "error").length;
  const warnCount = errors.filter((e) => e.severity === "warning").length;
  const mappedHeaders = headers.filter((h) => fieldMap[h]);
  const previewRows = rows.slice(0, 10);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-black text-gray-800">Preview & Validate</h3>
          <p className="text-xs text-gray-400 mt-0.5">Showing first {previewRows.length} of {rows.length} rows</p>
        </div>
        <div className="flex gap-2">
          {errCount > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
              style={{ color: "#DC2626", background: "#FEE2E2" }}>
              <XCircle size={11} /> {errCount} errors
            </span>
          )}
          {warnCount > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
              style={{ color: "#D97706", background: "#FEF3C7" }}>
              <AlertTriangle size={11} /> {warnCount} warnings
            </span>
          )}
          {errCount === 0 && warnCount === 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
              style={{ color: "#16A34A", background: "#DCFCE7" }}>
              <CheckCircle2 size={11} /> All valid
            </span>
          )}
        </div>
      </div>

      {/* Data preview table */}
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "#E3E9F6" }}>
        <table className="w-full text-left text-xs">
          <thead style={{ background: "#F8FAFF" }}>
            <tr>
              <th className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase">#</th>
              {mappedHeaders.map((h) => (
                <th key={h} className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase whitespace-nowrap">
                  {fieldMap[h].replace(/_/g, " ")}
                  <span className="text-gray-300 ml-1">({h})</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "#E3E9F6" }}>
            {previewRows.map((row, ri) => {
              const rowErrors = errors.filter((e) => e.row === ri + 2);
              const hasError = rowErrors.some((e) => e.severity === "error");
              const hasWarn  = rowErrors.some((e) => e.severity === "warning");
              return (
                <tr key={ri} style={{ background: hasError ? "#FFF5F5" : hasWarn ? "#FFFBEB" : undefined }}>
                  <td className="px-3 py-2 text-gray-400 font-mono">{ri + 2}</td>
                  {mappedHeaders.map((h) => {
                    const colIdx = headers.indexOf(h);
                    const val = row[colIdx] ?? "";
                    const fieldKey = fieldMap[h];
                    const colError = rowErrors.find((e) => {
                      const field = DATA_TYPES[dataType]?.fields.find((f) => f.key === fieldKey);
                      return field && e.field === field.label;
                    });
                    return (
                      <td key={h} className="px-3 py-2 max-w-[140px] truncate"
                        style={{ color: colError?.severity === "error" ? "#DC2626" : colError?.severity === "warning" ? "#D97706" : "#374151" }}>
                        {val || <span className="text-gray-300">—</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Validation errors list */}
      {errors.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Validation Issues</p>
          <div className="max-h-40 overflow-y-auto space-y-1.5 rounded-xl border p-3" style={{ borderColor: "#E3E9F6" }}>
            {errors.slice(0, 20).map((e, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                {e.severity === "error"
                  ? <XCircle size={12} className="text-red-500 flex-shrink-0 mt-0.5" />
                  : <AlertTriangle size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />}
                <span className="text-gray-500">Row {e.row} · <b className="text-gray-700">{e.field}</b>: {e.message}</span>
              </div>
            ))}
            {errors.length > 20 && (
              <p className="text-[10px] text-gray-400 text-center pt-1">+{errors.length - 20} more issues</p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors">
          ← Back
        </button>
        <button onClick={onNext} disabled={errCount > 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all"
          style={{ background: errCount > 0 ? "#9CA3AF" : "linear-gradient(135deg, #3B57C4, #1E3A8A)" }}>
          {errCount > 0 ? "Fix errors to continue" : "Import Now"} <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ── Step 5: Import ────────────────────────────────────────────="───────────────

function StepImport({ file, rows, dataType, onReset }: {
  file: File; rows: string[][];
  dataType: string; onReset: () => void;
}) {
  const [createImport, { isLoading }] = useCreateImportMutation();
  const [result, setResult] = useState<{ status: string; id: string; message: string } | null>(null);
  const [error, setError] = useState("");

  const doImport = async () => {
    try {
      const res = await createImport({
        file_name:         file.name,
        import_type:       "csv",
        data_type:         dataType,
        records_estimated: rows.length,
      }).unwrap();
      setResult(res);
    } catch {
      setError("Import failed. Please check your connection and try again.");
    }
  };

  const dt = DATA_TYPES[dataType];

  if (result) {
    return (
      <div className="p-10 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: "#DCFCE7" }}>
          <CheckCircle2 size={30} className="text-green-500" />
        </div>
        <div>
          <h3 className="text-base font-black text-gray-800">Import Queued Successfully</h3>
          <p className="text-xs text-gray-400 mt-1">{result.message || "Your file is being processed."}</p>
          <p className="text-[10px] font-mono text-gray-300 mt-1">Job ID: {result.id}</p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
          style={{ background: "#F0FDF4", color: "#16A34A" }}>
          <Info size={12} /> Processing {rows.length} {dt?.label} records from <b>{file.name}</b>
        </div>
        <button onClick={onReset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white mx-auto transition-all"
          style={{ background: "linear-gradient(135deg, #3B57C4, #1E3A8A)" }}>
          <Upload size={14} /> Import Another File
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h3 className="text-sm font-black text-gray-800">Confirm & Import</h3>
        <p className="text-xs text-gray-400 mt-0.5">Review the summary below before submitting</p>
      </div>

      <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#E3E9F6" }}>
        {[
          { label: "File",         value: file.name },
          { label: "Record Type",  value: `${dt?.icon} ${dt?.label}` },
          { label: "Total Rows",   value: `${rows.length} records` },
          { label: "File Size",    value: `${(file.size / 1024).toFixed(1)} KB` },
          { label: "Import Type",  value: "CSV" },
        ].map(({ label, value }, i) => (
          <div key={label} className="flex items-center justify-between px-4 py-3"
            style={{ background: i % 2 === 0 ? "#F8FAFF" : "#fff", borderBottom: "1px solid #E3E9F6" }}>
            <span className="text-xs font-bold text-gray-400">{label}</span>
            <span className="text-xs font-semibold text-gray-800">{value}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: "#FEF2F2" }}>
          <AlertCircle size={13} className="text-red-500" />
          <span className="text-xs text-red-600 font-semibold">{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button onClick={onReset} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100">
          ← Start Over
        </button>
        <button onClick={doImport} disabled={isLoading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #16A34A, #15803D)" }}>
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
          {isLoading ? "Importing…" : "Confirm Import"}
        </button>
      </div>
    </div>
  );
}

// ── Import History ────────────────────────────────────────────────────────────

const IMP_STATUS_CFG: Record<string, { color: string; bg: string; Icon: React.ElementType }> = {
  success:    { color: "#16A34A", bg: "#DCFCE7", Icon: CheckCircle2 },
  partial:    { color: "#D97706", bg: "#FEF3C7", Icon: AlertTriangle },
  failed:     { color: "#DC2626", bg: "#FEE2E2", Icon: XCircle },
  processing: { color: "#2563EB", bg: "#DBEAFE", Icon: Loader2 },
};

function ImportHistorySection({ imports }: { imports: ImportRecord[] }) {
  if (imports.length === 0) return null;
  return (
    <Card>
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
        <div className="p-2 rounded-xl" style={{ background: "#EEF2FF" }}>
          <Clock size={15} style={{ color: "#3B57C4" }} />
        </div>
        <h3 className="font-bold text-gray-800 text-sm">Recent Import History</h3>
        <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: "#EEF2FF", color: "#3B57C4" }}>{imports.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead style={{ background: "#F8FAFF" }}>
            <tr className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
              <th className="px-5 py-3">File</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Records</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Uploaded By</th>
              <th className="px-5 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "#E3E9F6" }}>
            {imports.map((imp) => {
              const cfg = IMP_STATUS_CFG[imp.status] ?? IMP_STATUS_CFG.failed;
              const successRate = imp.records_total > 0
                ? Math.round((imp.records_success / imp.records_total) * 100) : 0;
              return (
                <tr key={imp.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={13} className="text-blue-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-gray-700 truncate max-w-[160px]">{imp.file_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-lg capitalize"
                      style={{ background: "#EEF2FF", color: "#3B57C4" }}>
                      {imp.data_type}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-xs">
                      <span className="font-bold text-gray-800">{imp.records_success}</span>
                      <span className="text-gray-400">/{imp.records_total}</span>
                      {imp.records_failed > 0 && (
                        <span className="ml-1 font-bold text-red-500">({imp.records_failed} failed)</span>
                      )}
                    </div>
                    <div className="w-20 h-1 rounded-full mt-1" style={{ background: "#E3E9F6" }}>
                      <div className="h-1 rounded-full"
                        style={{ width: `${successRate}%`, background: successRate === 100 ? "#16A34A" : "#F59E0B" }} />
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize"
                      style={{ color: cfg.color, background: cfg.bg }}>
                      <cfg.Icon size={10} className={imp.status === "processing" ? "animate-spin" : ""} />
                      {imp.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">{imp.uploaded_by}</td>
                  <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(imp.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function CSVImportPage() {
  const { data: rawImports, refetch } = useListImportsQuery();
  const imports: ImportRecord[] = Array.isArray(rawImports) ? rawImports : [];

  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [dataType, setDataType] = useState("");
  const [fieldMap, setFieldMap] = useState<Record<string, string>>({});

  const totalImports    = imports.length;
  const successImports  = imports.filter((i) => i.status === "success").length;
  const processingCount = imports.filter((i) => i.status === "processing").length;
  const totalRecords    = imports.reduce((s, i) => s + i.records_success, 0);

  const handleFile = (f: File, h: string[], r: string[][]) => {
    setFile(f); setHeaders(h); setRows(r); setStep(2);
  };

  const handleDataType = (dt: string) => {
    setDataType(dt);
    setFieldMap(autoMap(headers, dt));
  };

  const reset = () => {
    setStep(1); setFile(null); setHeaders([]); setRows([]);
    setDataType(""); setFieldMap({});
    refetch();
  };

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>
      {/* Banner */}
      <div className="relative overflow-hidden px-8 pt-8 pb-6"
        style={{ background: "linear-gradient(135deg, #0C1A3D 0%, #0F172A 100%)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 70% 50%, rgba(59,87,196,0.18) 0%, transparent 70%)" }} />
        <div className="relative flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Upload size={18} style={{ color: "#93C5FD" }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#93C5FD" }}>
                Data Management
              </span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">CSV Import</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
              Import historical data and legacy records with field mapping, validation, and preview
            </p>
          </div>
          <button onClick={() => refetch()}
            className="p-2 rounded-xl transition-all"
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}>
            <RefreshCw size={15} />
          </button>
        </div>
        <div className="relative flex rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <HeroStat label="Total Imports" value={totalImports} />
          <HeroDivider />
          <HeroStat label="Successful" value={successImports} color="#34D399" />
          <HeroDivider />
          <HeroStat label="Processing" value={processingCount} color="#FBBF24" />
          <HeroDivider />
          <HeroStat label="Records Imported" value={totalRecords.toLocaleString()} color="#93C5FD" />
          <HeroDivider />
          <HeroStat label="Record Types" value={Object.keys(DATA_TYPES).length} />
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6 space-y-6">
        {/* Wizard card */}
        <Card>
          <StepIndicator current={step} />
          {step === 1 && <StepUpload onFile={handleFile} />}
          {step === 2 && file && (
            <StepConfigure file={file} headers={headers} rows={rows}
              dataType={dataType} onDataType={handleDataType}
              onNext={() => setStep(3)} />
          )}
          {step === 3 && (
            <StepFieldMapping headers={headers} dataType={dataType}
              fieldMap={fieldMap} onChange={setFieldMap}
              onNext={() => setStep(4)} onBack={() => setStep(2)} />
          )}
          {step === 4 && (
            <StepPreview headers={headers} rows={rows}
              fieldMap={fieldMap} dataType={dataType}
              onNext={() => setStep(5)} onBack={() => setStep(3)} />
          )}
          {step === 5 && file && (
            <StepImport file={file} rows={rows} dataType={dataType} onReset={reset} />
          )}
        </Card>

        {/* Import history */}
        <ImportHistorySection imports={imports} />
      </div>
    </div>
  );
}
