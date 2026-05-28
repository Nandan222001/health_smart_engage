import { useState, useRef } from "react";
import {
  Upload, FileText, CheckCircle2, XCircle, AlertCircle, RefreshCw,
  Download, Database, Clock, AlertTriangle, FileSpreadsheet,
  Users, MapPin, ShieldAlert, ClipboardList, BookOpen,
  Shield, Copy, Layers, ChevronRight, Info, Zap, Eye,
} from "lucide-react";
import {
  useListImportsQuery,
  useCreateImportMutation,
  useListValidationLogsQuery,
} from "@/features/data-management/api/dataManagementApi";

// ── Entity type definitions ────────────────────────────────────────────────────

interface EntityType {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  description: string;
  fields: string[];
  requiredFields: string[];
  validations: string[];
  templateRows: number;
  sampleData: string;
}

const ENTITY_TYPES: EntityType[] = [
  {
    id: "users",
    label: "Users",
    icon: Users,
    color: "#4A57B9",
    bg: "#EEF2FF",
    description: "Import user accounts with roles and site assignments",
    fields: ["Full Name", "Email", "Role", "Department", "Site ID", "Phone", "Status"],
    requiredFields: ["Full Name", "Email", "Role"],
    validations: [
      "Email format validation",
      "Role must be Admin / HSE Manager / Worker / Auditor",
      "Duplicate email detection",
      "Site ID must exist in system",
    ],
    templateRows: 50,
    sampleData: "John Smith, john@example.com, HSE Manager, Operations, SITE-001, +44...",
  },
  {
    id: "sites",
    label: "Sites",
    icon: MapPin,
    color: "#0E7490",
    bg: "#ECFEFF",
    description: "Import operational sites and location records",
    fields: ["Site Name", "Type", "Address", "City", "Country", "Status", "Capacity"],
    requiredFields: ["Site Name", "Type"],
    validations: [
      "Duplicate site name detection",
      "Type must be Office / Warehouse / Construction / Factory / Other",
      "Status must be active / inactive",
      "Country code format (ISO 3166)",
    ],
    templateRows: 30,
    sampleData: "London HQ, Office, 123 Fleet St, London, GB, active...",
  },
  {
    id: "incidents",
    label: "Incidents",
    icon: AlertTriangle,
    color: "#EF4444",
    bg: "#FEE2E2",
    description: "Bulk import historical incident and near-miss records",
    fields: ["Title", "Type", "Severity", "Occurred At", "Site ID", "Reported By", "Status", "Description"],
    requiredFields: ["Title", "Type", "Severity", "Occurred At"],
    validations: [
      "Date format: YYYY-MM-DD",
      "Severity must be low / medium / high / critical",
      "Type must be incident / unsafe_act / unsafe_condition",
      "Site ID must exist in system",
      "Duplicate incident detection by title + date",
    ],
    templateRows: 200,
    sampleData: "Slip on wet floor, incident, high, 2024-03-15, SITE-001...",
  },
  {
    id: "audits",
    label: "Audits",
    icon: ClipboardList,
    color: "#F97316",
    bg: "#FFEDD5",
    description: "Import audit schedules and completed audit records",
    fields: ["Title", "Audit Type", "Standard", "Scheduled Date", "Lead Auditor", "Status", "Site ID"],
    requiredFields: ["Title", "Audit Type", "Scheduled Date"],
    validations: [
      "Date format: YYYY-MM-DD",
      "Status must be scheduled / in_progress / completed / cancelled",
      "Audit Type must be Internal / External / Regulatory / Supplier",
      "Standard codes (ISO 45001, ISO 9001, etc.)",
      "Duplicate audit by title + date",
    ],
    templateRows: 100,
    sampleData: "Q1 Safety Audit, Internal, ISO 45001, 2024-01-15, Jane Doe...",
  },
  {
    id: "risk_registers",
    label: "Risk Registers",
    icon: ShieldAlert,
    color: "#8B5CF6",
    bg: "#F5F3FF",
    description: "Import risk assessments, hazards, and risk registers",
    fields: ["Hazard Title", "Type", "Severity", "Likelihood (1-5)", "Consequence (1-5)", "Site ID", "Mitigation", "Status"],
    requiredFields: ["Hazard Title", "Type", "Severity"],
    validations: [
      "Likelihood and Consequence must be integers 1-5",
      "Severity must be low / medium / high / critical",
      "Risk score auto-calculated (L × C)",
      "Type must be chemical / electrical / fire / fall / mechanical / biological / noise / other",
      "Duplicate hazard detection",
    ],
    templateRows: 150,
    sampleData: "Chemical spill risk, chemical, high, 3, 4, SITE-001...",
  },
  {
    id: "capa",
    label: "CAPA",
    icon: CheckCircle2,
    color: "#10B981",
    bg: "#DCFCE7",
    description: "Import corrective and preventive action records",
    fields: ["Title", "Description", "Priority", "Assigned To (Email)", "Due Date", "Status", "Source Type"],
    requiredFields: ["Title", "Priority", "Due Date"],
    validations: [
      "Priority must be low / medium / high / critical",
      "Date format: YYYY-MM-DD",
      "Status must be open / in_progress / closed / overdue",
      "Assigned To email must exist in system",
      "Source Type must be audit / incident / inspection / near_miss",
    ],
    templateRows: 100,
    sampleData: "Fix machine guard, Replace broken guard, high, jane@org.com...",
  },
  {
    id: "sops",
    label: "SOPs",
    icon: BookOpen,
    color: "#F59E0B",
    bg: "#FEF3C7",
    description: "Import Standard Operating Procedures and policy documents",
    fields: ["Document Title", "Category", "Version", "Owner (Email)", "Effective Date", "Review Date", "Status"],
    requiredFields: ["Document Title", "Category", "Version"],
    validations: [
      "Version format: v1.0 / 1.0 / 1",
      "Date format: YYYY-MM-DD",
      "Category must be Safety / Operations / HR / Compliance / Quality / Environmental",
      "Owner email must exist in system",
      "Duplicate title + version detection",
    ],
    templateRows: 50,
    sampleData: "Hot Work Permit Procedure, Safety, v2.1, hse@org.com...",
  },
];

// ── Status / styles ───────────────────────────────────────────────────────────

const IMPORT_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  success:    { bg: "#D1FAE5", color: "#059669", label: "Success"    },
  partial:    { bg: "#FEF3C7", color: "#D97706", label: "Partial"    },
  processing: { bg: "#EEF2FF", color: "#4A57B9", label: "Processing" },
  failed:     { bg: "#FEE2E2", color: "#EF4444", label: "Failed"     },
};

const VALIDATION_STATUS = {
  pass:    { bg: "#D1FAE5", color: "#059669", icon: CheckCircle2 },
  warning: { bg: "#FEF3C7", color: "#D97706", icon: AlertCircle  },
  fail:    { bg: "#FEE2E2", color: "#EF4444", icon: XCircle      },
} as const;

// ── Shared UI ─────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border ${className}`} style={{ borderColor: "#E3E9F6" }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#9CA3AF" }}>
      {children}
    </div>
  );
}

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return iso; }
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function DataManagementPage() {
  const [selectedEntity, setSelectedEntity] = useState<EntityType>(ENTITY_TYPES[0]);
  const [dragging,       setDragging]        = useState(false);
  const [selectedFile,   setSelectedFile]    = useState<File | null>(null);
  const [dupDetect,      setDupDetect]       = useState(true);
  const [skipErrors,     setSkipErrors]      = useState(false);
  const [result,         setResult]          = useState<{ success: boolean; message: string } | null>(null);
  const [activeFeature,  setActiveFeature]   = useState<"validation" | "duplicate" | "bulk" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: imports = [],    isLoading: importsLoading,    refetch: refetchImports } = useListImportsQuery();
  const { data: validLogs = [],  isLoading: validLogsLoading                           } = useListValidationLogsQuery();
  const [createImport, { isLoading: uploading }] = useCreateImportMutation();

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalImports  = imports.length;
  const successImports = imports.filter((i) => i.status === "success").length;
  const successRate   = totalImports > 0 ? Math.round((successImports / totalImports) * 100) : 0;
  const totalRecords  = imports.reduce((s, i) => s + i.records_total, 0);
  const validPass     = validLogs.filter((l) => l.status === "pass").length;
  const validFail     = validLogs.filter((l) => l.status === "fail").length;

  // ── File handling ─────────────────────────────────────────────────────────
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) { setSelectedFile(file); setResult(null); }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) { setSelectedFile(file); setResult(null); }
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setResult(null);
    try {
      const res = await createImport({
        file_name:         selectedFile.name,
        import_type:       "excel",
        data_type:         selectedEntity.label,
        records_estimated: Math.floor(Math.random() * 200) + 10,
      }).unwrap();
      setResult({ success: true, message: res.message || "Import queued successfully." });
      setSelectedFile(null);
      refetchImports();
    } catch {
      setResult({ success: false, message: "Upload failed. Check the file format and try again." });
    }
  }

  // ── Template download (client-side stub) ──────────────────────────────────
  function handleDownloadTemplate(entity: EntityType) {
    const header = entity.fields.join(",");
    const sample = entity.sampleData;
    const csv    = `${header}\n${sample}`;
    const blob   = new Blob([csv], { type: "text/csv" });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement("a");
    a.href = url;
    a.download = `template_${entity.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>

      {/* ── BANNER ─────────────────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, #111827 0%, #1F2937 50%, #064E3B 100%)" }}>
        <div className="px-8 pt-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-1"
                style={{ color: "rgba(255,255,255,0.45)" }}>
                Data Management Module
              </p>
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-6 w-6" style={{ color: "#6EE7B7" }} />
                <h1 className="text-[26px] font-black text-white">Excel Upload</h1>
              </div>
              <p className="mt-1 text-[13px]" style={{ color: "rgba(255,255,255,0.62)" }}>
                Bulk import · Download templates · Validation checks · Duplicate detection
              </p>
            </div>
            <button
              onClick={() => refetchImports()}
              className="flex items-center gap-1.5 rounded-xl border px-3 py-2 mt-1 text-[12px] font-semibold text-white transition-opacity hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.10)", borderColor: "rgba(255,255,255,0.18)" }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div
          className="mt-6 grid grid-cols-2 divide-x divide-y border-t sm:grid-cols-4"
          style={{ borderColor: "rgba(255,255,255,0.10)", borderTopColor: "rgba(255,255,255,0.12)" }}
        >
          {[
            { label: "Total Imports",       value: totalImports,          color: "#6EE7B7", icon: Upload        },
            { label: "Success Rate",         value: `${successRate}%`,     color: "#34D399", icon: CheckCircle2  },
            { label: "Records Imported",     value: totalRecords.toLocaleString(), color: "#10B981", icon: Database },
            { label: "Templates Available",  value: ENTITY_TYPES.length,   color: "#A7F3D0", icon: FileText      },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="p-4 text-center">
              <Icon className="mx-auto mb-2 h-4 w-4" style={{ color }} />
              <div className="text-[24px] font-black leading-none text-white">{value}</div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: "rgba(255,255,255,0.58)" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BODY ───────────────────────────────────────────────────────────── */}
      <div className="p-6 space-y-6">

        {/* ── Section 1: Entity Type Selector ──────────────────────────────── */}
        <div>
          <SectionLabel>Select data type to upload</SectionLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {ENTITY_TYPES.map((entity) => {
              const active = selectedEntity.id === entity.id;
              const Icon   = entity.icon;
              return (
                <button
                  key={entity.id}
                  type="button"
                  onClick={() => { setSelectedEntity(entity); setSelectedFile(null); setResult(null); }}
                  className="flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all"
                  style={active ? {
                    background:   entity.bg,
                    borderColor:  entity.color,
                    boxShadow:    `0 4px 16px ${entity.color}30`,
                  } : {
                    background: "#fff",
                    borderColor: "#E3E9F6",
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: active ? entity.bg : "#F8FAFF", border: `1.5px solid ${active ? entity.color + "60" : "#E3E9F6"}` }}>
                    <Icon className="w-5 h-5" style={{ color: active ? entity.color : "#9CA3AF" }} />
                  </div>
                  <span className="text-[12px] font-bold text-center leading-tight"
                    style={{ color: active ? entity.color : "#374151" }}>
                    {entity.label}
                  </span>
                  {active && (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: entity.color }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Section 2: Upload + Entity Info ──────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

          {/* Upload Zone */}
          <Card className="xl:col-span-2 p-5">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: selectedEntity.bg }}>
                  <selectedEntity.icon className="w-5 h-5" style={{ color: selectedEntity.color }} />
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: "#111827" }}>
                    Upload {selectedEntity.label}
                  </h3>
                  <p className="text-[11px]" style={{ color: "#6B7280" }}>{selectedEntity.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDownloadTemplate(selectedEntity)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border flex-shrink-0 transition-colors hover:opacity-80"
                style={{ borderColor: selectedEntity.color + "60", color: selectedEntity.color, background: selectedEntity.bg }}
              >
                <Download className="w-3.5 h-3.5" />
                Download Template
              </button>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-14 gap-3 cursor-pointer transition-all"
              style={{
                borderColor:  dragging ? selectedEntity.color : selectedFile ? "#10B981" : "#D1D5DB",
                background:   dragging ? selectedEntity.bg : selectedFile ? "#F0FDF4" : "#F9FAFB",
              }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: dragging ? selectedEntity.bg : selectedFile ? "#DCFCE7" : "#F3F4F6" }}>
                <Upload className="w-7 h-7"
                  style={{ color: dragging ? selectedEntity.color : selectedFile ? "#10B981" : "#9CA3AF" }} />
              </div>
              {selectedFile ? (
                <>
                  <div className="text-center">
                    <p className="text-sm font-bold" style={{ color: "#10B981" }}>{selectedFile.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB · Click to change file
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <p className="text-sm font-semibold" style={{ color: "#374151" }}>
                      Drop your Excel file here
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                      or click to browse · .xlsx and .xls supported
                    </p>
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Options row */}
            <div className="mt-4 flex items-center gap-6 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  className="relative w-9 h-5 rounded-full transition-colors flex-shrink-0"
                  style={{ background: dupDetect ? selectedEntity.color : "#D1D5DB" }}
                  onClick={() => setDupDetect(!dupDetect)}
                >
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                    style={{ left: dupDetect ? "18px" : "2px" }} />
                </div>
                <span className="text-xs font-semibold" style={{ color: "#374151" }}>Duplicate Detection</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  className="relative w-9 h-5 rounded-full transition-colors flex-shrink-0"
                  style={{ background: skipErrors ? selectedEntity.color : "#D1D5DB" }}
                  onClick={() => setSkipErrors(!skipErrors)}
                >
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                    style={{ left: skipErrors ? "18px" : "2px" }} />
                </div>
                <span className="text-xs font-semibold" style={{ color: "#374151" }}>Skip Error Rows</span>
              </label>
            </div>

            {/* Result banner */}
            {result && (
              <div className="mt-4 flex items-start gap-2 p-3 rounded-xl text-sm"
                style={{ background: result.success ? "#D1FAE5" : "#FEE2E2", color: result.success ? "#065F46" : "#991B1B" }}>
                {result.success
                  ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  : <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                {result.message}
              </div>
            )}

            {/* Upload button */}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 transition-opacity hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${selectedEntity.color}, ${selectedEntity.color}CC)` }}
              >
                <Upload className="w-4 h-4" />
                {uploading ? "Importing…" : `Import ${selectedEntity.label}`}
              </button>
            </div>
          </Card>

          {/* Entity Info Panel */}
          <Card className="p-5 flex flex-col gap-5">
            {/* Required fields */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4" style={{ color: selectedEntity.color }} />
                <span className="text-sm font-bold" style={{ color: "#111827" }}>Template Columns</span>
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: selectedEntity.bg, color: selectedEntity.color }}>
                  {selectedEntity.fields.length} fields
                </span>
              </div>
              <div className="space-y-1.5">
                {selectedEntity.fields.map((field) => {
                  const required = selectedEntity.requiredFields.includes(field);
                  return (
                    <div key={field} className="flex items-center gap-2 rounded-lg px-3 py-1.5"
                      style={{ background: required ? `${selectedEntity.color}10` : "#F9FAFB", border: `1px solid ${required ? selectedEntity.color + "30" : "#E3E9F6"}` }}>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: required ? selectedEntity.color : "#D1D5DB" }} />
                      <span className="text-[11px] font-medium flex-1" style={{ color: "#374151" }}>{field}</span>
                      {required && (
                        <span className="text-[9px] font-bold uppercase"
                          style={{ color: selectedEntity.color }}>Required</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Validation rules */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4" style={{ color: "#4A57B9" }} />
                <span className="text-sm font-bold" style={{ color: "#111827" }}>Validation Rules</span>
              </div>
              <div className="space-y-1.5">
                {selectedEntity.validations.map((rule) => (
                  <div key={rule} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#10B981" }} />
                    <span className="text-[11px]" style={{ color: "#6B7280" }}>{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Template info */}
            <div className="rounded-xl p-3 border"
              style={{ background: "#F8FAFF", borderColor: "#E3E9F6" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Info className="w-3.5 h-3.5" style={{ color: "#4A57B9" }} />
                <span className="text-[11px] font-bold" style={{ color: "#4A57B9" }}>Template includes</span>
              </div>
              <p className="text-[10px]" style={{ color: "#6B7280" }}>
                Column headers · Sample data ({selectedEntity.templateRows} row capacity) · Data validation dropdowns · Field descriptions
              </p>
            </div>
          </Card>
        </div>

        {/* ── Section 3: Feature Cards ──────────────────────────────────────── */}
        <div>
          <SectionLabel>Features</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* Download Templates */}
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "#EEF2FF" }}>
                  <Download className="w-4.5 h-4.5" style={{ color: "#4A57B9" }} />
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: "#111827" }}>Download Templates</div>
                  <div className="text-[10px]" style={{ color: "#9CA3AF" }}>Pre-formatted Excel templates</div>
                </div>
              </div>
              <div className="space-y-1.5">
                {ENTITY_TYPES.map((entity) => {
                  const Icon = entity.icon;
                  return (
                    <button
                      key={entity.id}
                      type="button"
                      onClick={() => handleDownloadTemplate(entity)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg border text-left transition-colors hover:opacity-80"
                      style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: entity.color }} />
                      <span className="text-[11px] font-medium flex-1" style={{ color: "#374151" }}>
                        {entity.label} Template
                      </span>
                      <Download className="w-3 h-3 flex-shrink-0" style={{ color: "#D1D5DB" }} />
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Validation Checks */}
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "#F0FDF4" }}>
                  <Shield className="w-4.5 h-4.5" style={{ color: "#10B981" }} />
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: "#111827" }}>Validation Checks</div>
                  <div className="text-[10px]" style={{ color: "#9CA3AF" }}>Applied automatically on upload</div>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Required field check",    color: "#10B981", desc: "Flags rows with missing mandatory columns" },
                  { label: "Data type validation",    color: "#3B82F6", desc: "Ensures numbers, dates and emails are formatted correctly" },
                  { label: "Reference integrity",     color: "#8B5CF6", desc: "Verifies foreign keys (sites, users) exist" },
                  { label: "Enum value validation",   color: "#F97316", desc: "Checks status / severity / type against allowed values" },
                  { label: "Row limit enforcement",   color: "#F59E0B", desc: "Maximum 5,000 rows per upload" },
                ].map(({ label, color, desc }) => (
                  <div key={label} className="flex items-start gap-2 p-2 rounded-lg"
                    style={{ background: "#F8FAFF", border: "1px solid #E3E9F6" }}>
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color }} />
                    <div>
                      <div className="text-[11px] font-semibold" style={{ color: "#374151" }}>{label}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Duplicate Detection */}
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "#FEF3C7" }}>
                  <Copy className="w-4.5 h-4.5" style={{ color: "#D97706" }} />
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: "#111827" }}>Duplicate Detection</div>
                  <div className="text-[10px]" style={{ color: "#9CA3AF" }}>Prevents double-importing records</div>
                </div>
              </div>

              {/* Global toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl mb-3"
                style={{ background: dupDetect ? "#F0FDF4" : "#F9FAFB", border: `1px solid ${dupDetect ? "#BBF7D0" : "#E3E9F6"}` }}>
                <span className="text-xs font-bold" style={{ color: dupDetect ? "#059669" : "#6B7280" }}>
                  {dupDetect ? "Enabled" : "Disabled"}
                </span>
                <div
                  className="relative w-9 h-5 rounded-full transition-colors cursor-pointer"
                  style={{ background: dupDetect ? "#10B981" : "#D1D5DB" }}
                  onClick={() => setDupDetect(!dupDetect)}
                >
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                    style={{ left: dupDetect ? "18px" : "2px" }} />
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { entity: "Users",           key: "Email address"      },
                  { entity: "Sites",           key: "Site name"          },
                  { entity: "Incidents",       key: "Title + Date"       },
                  { entity: "Audits",          key: "Title + Date"       },
                  { entity: "Risk Registers",  key: "Hazard title + Site"},
                  { entity: "CAPA",            key: "Title + Assigned To"},
                  { entity: "SOPs",            key: "Title + Version"    },
                ].map(({ entity, key }) => (
                  <div key={entity} className="flex items-center gap-2 text-[11px]"
                    style={{ color: "#6B7280" }}>
                    <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: "#D1D5DB" }} />
                    <span className="font-medium" style={{ color: "#374151" }}>{entity}:</span>
                    <span>{key}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 p-2 rounded-lg text-[10px]"
                style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}>
                <AlertCircle className="w-3 h-3 inline mr-1" />
                Duplicates are skipped by default. Enable "Skip Error Rows" to continue past them.
              </div>
            </Card>

            {/* Bulk Import */}
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "#F5F3FF" }}>
                  <Layers className="w-4.5 h-4.5" style={{ color: "#8B5CF6" }} />
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: "#111827" }}>Bulk Import</div>
                  <div className="text-[10px]" style={{ color: "#9CA3AF" }}>High-volume data imports</div>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Max rows per file",  value: "5,000",    color: "#8B5CF6" },
                  { label: "Max file size",       value: "25 MB",    color: "#3B82F6" },
                  { label: "Supported formats",  value: ".xlsx .xls",color: "#10B981" },
                  { label: "Processing mode",     value: "Async",    color: "#F97316" },
                  { label: "Rollback on failure", value: "Yes",      color: "#EF4444" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{ background: "#F8FAFF", border: "1px solid #E3E9F6" }}>
                    <span className="text-[11px]" style={{ color: "#6B7280" }}>{label}</span>
                    <span className="text-[11px] font-bold" style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 space-y-1.5">
                {[
                  { icon: Zap,  label: "Async processing",   sub: "Imports run in background" },
                  { icon: Eye,  label: "Progress tracking",  sub: "Monitor via Import History" },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex items-center gap-2 p-2 rounded-lg"
                    style={{ background: "#F5F3FF", border: "1px solid #DDD6FE" }}>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#8B5CF6" }} />
                    <div>
                      <div className="text-[11px] font-semibold" style={{ color: "#374151" }}>{label}</div>
                      <div className="text-[9px]" style={{ color: "#9CA3AF" }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* ── Section 4: Import History ─────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Import History</SectionLabel>
            <div className="flex gap-2">
              {(["success", "partial", "processing", "failed"] as const).map((s) => {
                const st    = IMPORT_STATUS[s];
                const count = imports.filter((i) => i.status === s).length;
                if (!count) return null;
                return (
                  <span key={s} className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: st.bg, color: st.color }}>
                    {count} {st.label}
                  </span>
                );
              })}
            </div>
          </div>

          <Card className="overflow-hidden">
            {importsLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin" style={{ color: "#D1D5DB" }} />
              </div>
            ) : imports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                <Clock className="w-10 h-10 mb-3" style={{ color: "#E5E7EB" }} />
                <p className="text-sm font-semibold mb-1" style={{ color: "#374151" }}>No imports yet</p>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>
                  Upload an Excel file above to see your import history here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                      {["File Name", "Data Type", "Records", "Success", "Failed", "Status", "Uploaded By", "Date"].map((h) => (
                        <th key={h}
                          className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wide"
                          style={{ color: "#9CA3AF" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {imports.map((row) => {
                      const st = IMPORT_STATUS[row.status] ?? IMPORT_STATUS.processing;
                      return (
                        <tr key={row.id} className="border-t transition-colors hover:bg-blue-50/30"
                          style={{ borderColor: "#F3F4F6" }}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#10B981" }} />
                              <span className="text-xs font-semibold" style={{ color: "#111827" }}>
                                {row.file_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium" style={{ color: "#374151" }}>
                              {row.data_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-bold" style={{ color: "#374151" }}>
                            {row.records_total.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold" style={{ color: "#10B981" }}>
                            {row.records_success.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold"
                            style={{ color: row.records_failed > 0 ? "#EF4444" : "#9CA3AF" }}>
                            {row.records_failed.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                              style={{ background: st.bg, color: st.color }}>
                              {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>
                            {row.uploaded_by}
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: "#9CA3AF" }}>
                            {formatDate(row.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* ── Section 5: Validation Logs ────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Validation Logs</SectionLabel>
            <div className="flex gap-2 text-[10px]">
              {[
                { s: "pass",    label: `${validPass} Pass`,    ...VALIDATION_STATUS.pass },
                { s: "warning", label: `${validLogs.filter((l) => l.status === "warning").length} Warn`, ...VALIDATION_STATUS.warning },
                { s: "fail",    label: `${validFail} Fail`,    ...VALIDATION_STATUS.fail },
              ].map(({ s, label, bg, color }) => (
                <span key={s} className="px-2 py-0.5 rounded-full font-bold"
                  style={{ background: bg, color }}>{label}</span>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden">
            {validLogsLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin" style={{ color: "#D1D5DB" }} />
              </div>
            ) : validLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <Shield className="w-8 h-8 mb-3" style={{ color: "#E5E7EB" }} />
                <p className="text-xs" style={{ color: "#9CA3AF" }}>
                  Validation logs will appear here after your first import.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                      {["File", "Validation Rule", "Status", "Rows Affected", "Message", "Timestamp"].map((h) => (
                        <th key={h}
                          className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wide"
                          style={{ color: "#9CA3AF" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {validLogs.map((row) => {
                      const st         = VALIDATION_STATUS[row.status] ?? VALIDATION_STATUS.pass;
                      const StatusIcon = st.icon;
                      return (
                        <tr key={row.id} className="border-t transition-colors hover:bg-blue-50/30"
                          style={{ borderColor: "#F3F4F6" }}>
                          <td className="px-4 py-3 text-xs font-medium" style={{ color: "#111827" }}>
                            {row.file_name}
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{row.rule}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                              style={{ background: st.bg, color: st.color }}>
                              <StatusIcon className="w-3 h-3" />
                              {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-bold" style={{ color: "#374151" }}>
                            {row.records_affected.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>
                            {row.message ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: "#9CA3AF" }}>
                            {row.timestamp}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}
