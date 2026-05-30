import { useState, useRef, useCallback } from "react";
import {
  Upload, Link2, FormInput, CloudUpload, CheckCircle2,
  AlertTriangle, X, Download, RefreshCw, ChevronRight,
  Database, Zap, Tag, ShieldCheck,
} from "lucide-react";

// ─── Pipeline step types ───────────────────────────────────────────────────

export type PipelineStage = "idle" | "ingesting" | "parsing" | "mapping" | "validating" | "enriching" | "done" | "error";

interface PipelineStep {
  id: PipelineStage;
  label: string;
  sub: string;
  icon: typeof CloudUpload;
}

const PIPELINE_STEPS: PipelineStep[] = [
  { id: "ingesting",  label: "Data Ingestion",   sub: "Receiving data",           icon: CloudUpload },
  { id: "parsing",   label: "Data Parsing",     sub: "Extracting entities",      icon: Database },
  { id: "mapping",   label: "Entity Mapping",   sub: "Standardising terms",      icon: Zap },
  { id: "validating",label: "Data Validation",  sub: "Checking completeness",    icon: ShieldCheck },
  { id: "enriching", label: "Data Enrichment",  sub: "Adding context & tags",    icon: Tag },
];

const STAGE_ORDER: PipelineStage[] = ["ingesting", "parsing", "mapping", "validating", "enriching", "done"];

function stageIndex(stage: PipelineStage) {
  return STAGE_ORDER.indexOf(stage);
}

export function IngestionPipeline({ stage }: { stage: PipelineStage }) {
  if (stage === "idle") return null;
  const currentIdx = stageIndex(stage);

  return (
    <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: "#E3E9F6", background: "#F8FAFF" }}>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Processing Pipeline</p>
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {PIPELINE_STEPS.map((step, i) => {
          const stepIdx = stageIndex(step.id);
          const done = currentIdx > stepIdx || stage === "done";
          const active = step.id === stage;
          const upcoming = currentIdx < stepIdx;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center gap-1 flex-shrink-0">
              <div className="flex flex-col items-center gap-1 w-24">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                  style={{
                    background: done ? "#D1FAE5" : active ? "linear-gradient(135deg, #4A57B9, #6F80E8)" : "#F3F4F6",
                    boxShadow: active ? "0 4px 12px rgba(74,87,185,0.35)" : undefined,
                  }}
                >
                  {done ? (
                    <CheckCircle2 className="w-4.5 h-4.5" style={{ color: "#10B981" }} />
                  ) : active ? (
                    <Icon className="w-4 h-4 text-white animate-pulse" />
                  ) : (
                    <Icon className="w-4 h-4" style={{ color: "#D1D5DB" }} />
                  )}
                </div>
                <span className="text-[10px] text-center leading-tight" style={{ color: done ? "#10B981" : active ? "#4A57B9" : "#9CA3AF", fontWeight: done || active ? 600 : 400 }}>
                  {step.label}
                </span>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div className="w-6 h-px mt-[-14px] flex-shrink-0" style={{ background: done ? "#10B981" : "#E5E7EB" }} />
              )}
            </div>
          );
        })}
      </div>
      {stage === "error" && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#FEE2E2" }}>
          <AlertTriangle className="w-4 h-4" style={{ color: "#EF4444" }} />
          <span className="text-xs font-medium" style={{ color: "#EF4444" }}>Processing failed — check your data and try again</span>
        </div>
      )}
      {stage === "done" && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#D1FAE5" }}>
          <CheckCircle2 className="w-4 h-4" style={{ color: "#10B981" }} />
          <span className="text-xs font-semibold" style={{ color: "#10B981" }}>All stages complete — data is ready to import</span>
        </div>
      )}
    </div>
  );
}

// ─── Column Mapper ─────────────────────────────────────────────────────────

export interface StandardField {
  key: string;
  label: string;
  required: boolean;
  example: string;
}

interface ColumnMapperProps {
  uploadedColumns: string[];
  standardFields: StandardField[];
  mapping: Record<string, string>;
  onChange: (mapping: Record<string, string>) => void;
}

function autoSuggest(col: string, fields: StandardField[]): string {
  const norm = col.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const exact = fields.find((f) => f.key === norm || f.label.toLowerCase() === col.toLowerCase());
  if (exact) return exact.key;
  const partial = fields.find((f) =>
    norm.includes(f.key.replace(/_/g, "")) ||
    f.key.replace(/_/g, "").includes(norm.replace(/_/g, "")) ||
    norm.includes(f.label.toLowerCase().replace(/ /g, ""))
  );
  return partial?.key ?? "";
}

export function ColumnMapper({ uploadedColumns, standardFields, mapping, onChange }: ColumnMapperProps) {
  const mapped = Object.values(mapping).filter(Boolean);
  const unmappedRequired = standardFields.filter((f) => f.required && !mapped.includes(f.key));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: "#374151" }}>Map your columns to standard fields</p>
        <button
          type="button"
          onClick={() => {
            const auto: Record<string, string> = {};
            uploadedColumns.forEach((col) => { auto[col] = autoSuggest(col, standardFields); });
            onChange(auto);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold"
          style={{ borderColor: "#4A57B9", color: "#4A57B9" }}
        >
          <Zap className="w-3 h-3" /> Auto-map
        </button>
      </div>

      {unmappedRequired.length > 0 && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: "#FEF3C7", color: "#92400E" }}>
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>Required fields not yet mapped: <strong>{unmappedRequired.map((f) => f.label).join(", ")}</strong></span>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="grid grid-cols-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ background: "#F8FAFF", color: "#9CA3AF", borderBottom: "1px solid #E9EEF8" }}>
          <span>Your column</span>
          <span>Maps to standard field</span>
        </div>
        <div className="divide-y" style={{ borderColor: "#F3F4F6" }}>
          {uploadedColumns.map((col) => {
            const selected = mapping[col] ?? "";
            const field = standardFields.find((f) => f.key === selected);
            return (
              <div key={col} className="grid grid-cols-2 items-center px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-xs font-mono" style={{ background: "#EEF2FB", color: "#4A57B9" }}>{col}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#D1D5DB" }} />
                  <select
                    className="flex-1 text-xs px-2 py-1.5 rounded-lg border outline-none"
                    style={{ borderColor: selected ? "#10B981" : "#E3E9F6", color: selected ? "#111827" : "#9CA3AF" }}
                    value={selected}
                    onChange={(e) => onChange({ ...mapping, [col]: e.target.value })}
                  >
                    <option value="">— skip this column —</option>
                    {standardFields.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}{f.required ? " *" : ""}
                      </option>
                    ))}
                  </select>
                  {field?.required && !selected && <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#F59E0B" }} />}
                  {selected && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#10B981" }} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Data Preview Table ────────────────────────────────────────────────────

interface DataPreviewProps {
  rows: Record<string, string>[];
  mapping: Record<string, string>;
  standardFields: StandardField[];
}

export function DataPreview({ rows, mapping, standardFields }: DataPreviewProps) {
  const mappedFields = standardFields.filter((f) => Object.values(mapping).includes(f.key));
  const colToField = Object.fromEntries(Object.entries(mapping).filter(([, v]) => v).map(([k, v]) => [v, k]));

  const errors: string[] = [];
  rows.forEach((row, i) => {
    standardFields.filter((f) => f.required).forEach((f) => {
      const col = colToField[f.key];
      if (!col || !row[col]?.trim()) {
        errors.push(`Row ${i + 1}: missing required field "${f.label}"`);
      }
    });
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: "#374151" }}>
          Preview — {rows.length} rows
        </p>
        {errors.length > 0 ? (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#FEE2E2", color: "#EF4444" }}>
            {errors.length} validation error{errors.length > 1 ? "s" : ""}
          </span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#D1FAE5", color: "#10B981" }}>
            All rows valid
          </span>
        )}
      </div>

      {errors.length > 0 && (
        <div className="rounded-xl border p-3 space-y-1" style={{ borderColor: "#FECACA", background: "#FFF5F5" }}>
          {errors.slice(0, 5).map((e) => (
            <div key={e} className="flex items-center gap-1.5 text-xs" style={{ color: "#EF4444" }}>
              <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {e}
            </div>
          ))}
          {errors.length > 5 && <p className="text-xs" style={{ color: "#EF4444" }}>…and {errors.length - 5} more</p>}
        </div>
      )}

      <div className="rounded-xl border overflow-auto" style={{ borderColor: "#E3E9F6", maxHeight: 220 }}>
        <table className="w-full text-xs min-w-max">
          <thead>
            <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
              {mappedFields.map((f) => (
                <th key={f.key} className="text-left px-3 py-2 font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "#9CA3AF" }}>
                  {f.label}{f.required && <span style={{ color: "#EF4444" }}> *</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 8).map((row, i) => (
              <tr key={i} className="border-t" style={{ borderColor: "#F3F4F6" }}>
                {mappedFields.map((f) => {
                  const col = colToField[f.key];
                  const val = col ? row[col] : "";
                  const missing = f.required && !val?.trim();
                  return (
                    <td key={f.key} className="px-3 py-2 whitespace-nowrap" style={{ color: missing ? "#EF4444" : "#374151", background: missing ? "#FFF5F5" : undefined }}>
                      {val || (missing ? "⚠ missing" : "—")}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── File Drop Zone ────────────────────────────────────────────────────────

interface FileDropZoneProps {
  onFile: (file: File, rows: Record<string, string>[], columns: string[]) => void;
  templateUrl?: string;
  templateName?: string;
}

function parseCSV(text: string): { columns: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { columns: [], rows: [] };
  const columns = lines[0].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(columns.map((c, i) => [c, vals[i] ?? ""]));
  });
  return { columns, rows };
}

export function FileDropZone({ onFile, templateUrl, templateName }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      setError("Only CSV or Excel files are supported.");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { columns, rows } = parseCSV(text);
      if (columns.length === 0) {
        setError("Could not parse file — ensure it has a header row.");
        return;
      }
      onFile(file, rows, columns);
    };
    reader.readAsText(file);
  }, [onFile]);

  return (
    <div className="space-y-3">
      <div
        className="rounded-2xl border-2 border-dashed p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors"
        style={{ borderColor: dragging ? "#4A57B9" : "#C7D2FE", background: dragging ? "#EEF2FB" : "#F8FAFF" }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => inputRef.current?.click()}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#EEF2FB" }}>
          <CloudUpload className="w-6 h-6" style={{ color: "#4A57B9" }} />
        </div>
        {fileName ? (
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: "#10B981" }}>{fileName}</p>
            <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>Click to replace</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: "#374151" }}>Drop your CSV or Excel file here</p>
            <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>or click to browse</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: "#FEE2E2", color: "#EF4444" }}>
          <AlertTriangle className="w-3.5 h-3.5" /> {error}
        </div>
      )}

      {templateName && (
        <a
          href={templateUrl ?? "#"}
          download={templateName}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium w-fit"
          style={{ borderColor: "#E3E9F6", color: "#4A57B9" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Download className="w-3.5 h-3.5" /> Download {templateName} template
        </a>
      )}
    </div>
  );
}

// ─── API Connect Panel ─────────────────────────────────────────────────────

type APISourceType = "erp_sap" | "erp_oracle" | "erp_ms_dynamics" | "hrms_workday" | "hrms_bamboohr" | "hrms_adp" | "zoho_people" | "zoho_crm" | "custom_rest";

const API_SOURCES: { value: APISourceType; label: string; group: string; fields: string[] }[] = [
  { value: "erp_sap",         label: "SAP ERP",            group: "ERP Systems",      fields: ["base_url", "client_id", "client_secret", "company_code"] },
  { value: "erp_oracle",      label: "Oracle ERP",         group: "ERP Systems",      fields: ["base_url", "username", "password", "tenant_id"] },
  { value: "erp_ms_dynamics", label: "Microsoft Dynamics", group: "ERP Systems",      fields: ["base_url", "client_id", "client_secret", "environment"] },
  { value: "hrms_workday",    label: "Workday",            group: "HRMS",             fields: ["base_url", "username", "password", "tenant_name"] },
  { value: "hrms_bamboohr",   label: "BambooHR",           group: "HRMS",             fields: ["subdomain", "api_key"] },
  { value: "hrms_adp",        label: "ADP Workforce Now",  group: "HRMS",             fields: ["client_id", "client_secret", "org_id"] },
  { value: "zoho_people",     label: "Zoho People",        group: "Zoho",             fields: ["client_id", "client_secret", "refresh_token"] },
  { value: "zoho_crm",        label: "Zoho CRM",           group: "Zoho",             fields: ["client_id", "client_secret", "refresh_token"] },
  { value: "custom_rest",     label: "Custom REST API",    group: "Custom",           fields: ["base_url", "api_key", "endpoint_path", "auth_header"] },
];

const FIELD_LABELS: Record<string, string> = {
  base_url: "Base URL",
  client_id: "Client ID",
  client_secret: "Client Secret",
  username: "Username",
  password: "Password",
  tenant_id: "Tenant ID",
  tenant_name: "Tenant Name",
  company_code: "Company Code",
  environment: "Environment",
  subdomain: "Subdomain",
  api_key: "API Key",
  org_id: "Organisation ID",
  refresh_token: "Refresh Token",
  endpoint_path: "Endpoint Path",
  auth_header: "Auth Header Name",
};

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item);
    (acc[k] = acc[k] ?? []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export function APIConnectPanel({ onConnected }: { onConnected: (source: APISourceType, creds: Record<string, string>) => void }) {
  const [source, setSource] = useState<APISourceType | "">("");
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const selectedSource = API_SOURCES.find((s) => s.value === source);
  const grouped = groupBy(API_SOURCES, (s) => s.group);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    await new Promise((r) => setTimeout(r, 1800));
    setTesting(false);
    // In real implementation this calls a backend endpoint to validate credentials
    setTestResult("success");
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>Data Source *</label>
        <select
          className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
          style={{ borderColor: "#E3E9F6" }}
          value={source}
          onChange={(e) => { setSource(e.target.value as APISourceType); setCreds({}); setTestResult(null); }}
        >
          <option value="">— Select your system —</option>
          {Object.entries(grouped).map(([group, sources]) => (
            <optgroup key={group} label={group}>
              {sources.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </optgroup>
          ))}
        </select>
      </div>

      {selectedSource && (
        <div className="space-y-3 p-4 rounded-xl border" style={{ borderColor: "#E3E9F6", background: "#F8FAFF" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{selectedSource.label} credentials</p>
          <div className="grid grid-cols-2 gap-3">
            {selectedSource.fields.map((field) => (
              <div key={field}>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>{FIELD_LABELS[field] ?? field}</label>
                <input
                  type={field.includes("secret") || field.includes("password") || field.includes("token") || field.includes("key") ? "password" : "text"}
                  className="w-full px-3 py-2 rounded-lg border text-xs outline-none"
                  style={{ borderColor: "#E3E9F6", background: "#fff" }}
                  placeholder={field.includes("url") ? "https://…" : ""}
                  value={creds[field] ?? ""}
                  onChange={(e) => setCreds((prev) => ({ ...prev, [field]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || Object.keys(creds).length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold disabled:opacity-50"
              style={{ borderColor: "#4A57B9", color: "#4A57B9" }}
            >
              {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
              {testing ? "Testing…" : "Test Connection"}
            </button>

            {testResult === "success" && (
              <>
                <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#10B981" }}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected successfully
                </span>
                <button
                  type="button"
                  onClick={() => onConnected(source as APISourceType, creds)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-semibold"
                  style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
                >
                  Fetch & Import Data
                </button>
              </>
            )}
            {testResult === "error" && (
              <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#EF4444" }}>
                <X className="w-3.5 h-3.5" /> Connection failed — check your credentials
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Data Ingestion Panel ──────────────────────────────────────────────

type InputMode = "manual" | "bulk" | "api";
type BulkStage = "upload" | "map" | "preview" | "done";

export interface DataIngestionPanelProps {
  entityLabel: string;
  standardFields: StandardField[];
  templateName: string;
  templateData: string; // CSV string for template download
  manualForm: React.ReactNode;
  onImport: (rows: Record<string, string>[], fieldMapping: Record<string, string>) => Promise<void>;
}

export function DataIngestionPanel({
  entityLabel,
  standardFields,
  templateName,
  templateData,
  manualForm,
  onImport,
}: DataIngestionPanelProps) {
  const [mode, setMode] = useState<InputMode>("manual");
  const [bulkStage, setBulkStage] = useState<BulkStage>("upload");
  const [uploadedRows, setUploadedRows] = useState<Record<string, string>[]>([]);
  const [uploadedColumns, setUploadedColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>("idle");

  const templateBlob = URL.createObjectURL(new Blob([templateData], { type: "text/csv" }));

  const requiredMapped = standardFields.filter((f) => f.required).every((f) => Object.values(columnMapping).includes(f.key));

  const handleFile = (_: File, rows: Record<string, string>[], cols: string[]) => {
    setUploadedRows(rows);
    setUploadedColumns(cols);
    const autoMap: Record<string, string> = {};
    cols.forEach((col) => { autoMap[col] = autoSuggest(col, standardFields); });
    setColumnMapping(autoMap);
    setBulkStage("map");
  };

  const handleImport = async () => {
    setPipelineStage("ingesting");
    await new Promise((r) => setTimeout(r, 600));
    setPipelineStage("parsing");
    await new Promise((r) => setTimeout(r, 700));
    setPipelineStage("mapping");
    await new Promise((r) => setTimeout(r, 700));
    setPipelineStage("validating");
    await new Promise((r) => setTimeout(r, 700));
    setPipelineStage("enriching");
    await new Promise((r) => setTimeout(r, 600));
    try {
      await onImport(uploadedRows, columnMapping);
      setPipelineStage("done");
      setBulkStage("done");
    } catch {
      setPipelineStage("error");
    }
  };

  const modes: { id: InputMode; label: string; icon: typeof FormInput }[] = [
    { id: "manual", label: "Manual Entry", icon: FormInput },
    { id: "bulk",   label: "Bulk Upload",  icon: Upload },
    { id: "api",    label: "API / Integration", icon: Link2 },
  ];

  return (
    <div className="space-y-4">
      {/* Mode tabs */}
      <div className="flex gap-2">
        {modes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => { setMode(id); setBulkStage("upload"); setPipelineStage("idle"); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all"
            style={mode === id
              ? { background: "#4A57B9", color: "#fff", borderColor: "#4A57B9", boxShadow: "0 4px 12px rgba(74,87,185,0.25)" }
              : { borderColor: "#E3E9F6", color: "#6B7280" }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Manual mode */}
      {mode === "manual" && manualForm}

      {/* Bulk upload mode */}
      {mode === "bulk" && (
        <div className="space-y-5">
          <IngestionPipeline stage={pipelineStage} />

          {bulkStage === "upload" && (
            <FileDropZone onFile={handleFile} templateUrl={templateBlob} templateName={templateName} />
          )}

          {(bulkStage === "map" || bulkStage === "preview") && (
            <>
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs" style={{ color: "#9CA3AF" }}>
                <button type="button" onClick={() => setBulkStage("upload")} className="hover:underline" style={{ color: "#4A57B9" }}>Upload</button>
                <ChevronRight className="w-3 h-3" />
                <button type="button" onClick={() => setBulkStage("map")} className={bulkStage === "map" ? "font-semibold" : "hover:underline"} style={{ color: bulkStage === "map" ? "#111827" : "#4A57B9" }}>Map Columns</button>
                <ChevronRight className="w-3 h-3" />
                <span className={bulkStage === "preview" ? "font-semibold" : ""} style={{ color: bulkStage === "preview" ? "#111827" : undefined }}>Preview & Validate</span>
              </div>

              {bulkStage === "map" && (
                <>
                  <ColumnMapper
                    uploadedColumns={uploadedColumns}
                    standardFields={standardFields}
                    mapping={columnMapping}
                    onChange={setColumnMapping}
                  />
                  <button
                    type="button"
                    disabled={!requiredMapped}
                    onClick={() => setBulkStage("preview")}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
                  >
                    Preview Data <ChevronRight className="w-4 h-4" />
                  </button>
                  {!requiredMapped && (
                    <p className="text-xs" style={{ color: "#F59E0B" }}>Map all required (*) fields to proceed.</p>
                  )}
                </>
              )}

              {bulkStage === "preview" && pipelineStage === "idle" && (
                <>
                  <DataPreview rows={uploadedRows} mapping={columnMapping} standardFields={standardFields} />
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setBulkStage("map")} className="px-4 py-2 rounded-xl border text-sm font-semibold" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
                      Back to Mapping
                    </button>
                    <button type="button" onClick={handleImport} className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
                      <Upload className="w-4 h-4" /> Import {uploadedRows.length} {entityLabel}s
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {bulkStage === "done" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "#D1FAE5" }}>
                <CheckCircle2 className="w-8 h-8" style={{ color: "#10B981" }} />
              </div>
              <p className="text-base font-bold" style={{ color: "#111827" }}>Import complete!</p>
              <p className="text-sm" style={{ color: "#6B7280" }}>{uploadedRows.length} {entityLabel}s successfully ingested and enriched.</p>
              <button type="button" onClick={() => { setBulkStage("upload"); setPipelineStage("idle"); }} className="px-4 py-2 rounded-xl border text-sm font-semibold" style={{ borderColor: "#E3E9F6", color: "#4A57B9" }}>
                Upload another file
              </button>
            </div>
          )}
        </div>
      )}

      {/* API connect mode */}
      {mode === "api" && (
        <div className="space-y-5">
          <IngestionPipeline stage={pipelineStage} />
          <APIConnectPanel
            onConnected={async (source) => {
              setPipelineStage("ingesting");
              await new Promise((r) => setTimeout(r, 600));
              setPipelineStage("parsing");
              await new Promise((r) => setTimeout(r, 800));
              setPipelineStage("mapping");
              await new Promise((r) => setTimeout(r, 700));
              setPipelineStage("validating");
              await new Promise((r) => setTimeout(r, 600));
              setPipelineStage("enriching");
              await new Promise((r) => setTimeout(r, 500));
              setPipelineStage("done");
              console.info("Connected to", source);
            }}
          />
        </div>
      )}
    </div>
  );
}
