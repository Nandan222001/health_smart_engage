import { useState, useRef } from "react";
import { useSearchParams } from "react-router";
import {
  Upload, FileText, CheckCircle2, XCircle, AlertCircle, RefreshCw,
  Download, Database, Plus, Trash2, Edit2, X, Link, Key, Clock,
  Activity, Wifi, WifiOff, AlertTriangle, BarChart3, FileSpreadsheet,
} from "lucide-react";
import {
  useListImportsQuery,
  useCreateImportMutation,
  useListValidationLogsQuery,
  useGetSyncStatusQuery,
  useTriggerSyncMutation,
  useListApiIntegrationsQuery,
  useCreateApiIntegrationMutation,
  useUpdateApiIntegrationMutation,
  useDeleteApiIntegrationMutation,
} from "@/features/data-management/api/dataManagementApi";
import type { ApiIntegration } from "@/features/data-management/api/dataManagementApi";

// ─── Shared helpers ───────────────────────────────────────────────────────

const SUPPORTED_DATA_TYPES = [
  "Incidents", "Near Miss", "Permits", "Audits",
  "Training Records", "Employees", "Risk Assessments", "Contractors",
];

const STATUS_STYLES = {
  import: {
    success:    { bg: "#D1FAE5", color: "#10B981", label: "Success" },
    partial:    { bg: "#FEF3C7", color: "#F59E0B", label: "Partial" },
    processing: { bg: "#EEF2FF", color: "#4A57B9", label: "Processing" },
    failed:     { bg: "#FEE2E2", color: "#EF4444", label: "Failed" },
  },
  validation: {
    pass:    { bg: "#D1FAE5", color: "#10B981", icon: CheckCircle2 },
    warning: { bg: "#FEF3C7", color: "#F59E0B", icon: AlertCircle },
    fail:    { bg: "#FEE2E2", color: "#EF4444", icon: XCircle },
  },
  sync: {
    active:  { bg: "#D1FAE5", color: "#10B981", label: "Active" },
    syncing: { bg: "#EEF2FF", color: "#4A57B9", label: "Syncing" },
    warning: { bg: "#FEF3C7", color: "#F59E0B", label: "Warning" },
    error:   { bg: "#FEE2E2", color: "#EF4444", label: "Error" },
    paused:  { bg: "#F3F4F6", color: "#9CA3AF", label: "Paused" },
  },
} as const;

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border p-5 ${className}`} style={{ borderColor: "#E3E9F6" }}>
      {children}
    </div>
  );
}

function Spinner() {
  return <p className="text-sm text-center py-8" style={{ color: "#9CA3AF" }}>Loading…</p>;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <Database className="w-8 h-8 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
      <p className="text-sm" style={{ color: "#9CA3AF" }}>{message}</p>
    </div>
  );
}

// ─── Tab 1 & 2: Upload Card (shared by Excel Upload and CSV Import) ───────

function UploadTab({ type }: { type: "excel" | "csv" }) {
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dataType, setDataType] = useState(SUPPORTED_DATA_TYPES[0]);
  const [createImport, { isLoading }] = useCreateImportMutation();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accept = type === "excel" ? ".xlsx,.xls" : ".csv";
  const title = type === "excel" ? "Excel Upload" : "CSV Import";
  const Icon = type === "excel" ? FileSpreadsheet : FileText;

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setResult(null);
    try {
      const res = await createImport({
        file_name: selectedFile.name,
        import_type: type,
        data_type: dataType,
        records_estimated: Math.floor(Math.random() * 300) + 10,
      }).unwrap();
      setResult({ success: true, message: res.message });
      setSelectedFile(null);
    } catch {
      setResult({ success: false, message: "Upload failed. Please try again." });
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#EEF2FF" }}>
            <Icon className="w-5 h-5" style={{ color: "#4A57B9" }} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: "#111827" }}>{title}</h3>
            <p className="text-xs" style={{ color: "#6B7280" }}>Supported: {accept.toUpperCase()}</p>
          </div>
          <a
            href="#"
            className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border"
            style={{ borderColor: "#E3E9F6", color: "#4A57B9" }}
            onClick={(e) => e.preventDefault()}
          >
            <Download className="w-3.5 h-3.5" />
            Download Template
          </a>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-12 gap-2 cursor-pointer transition-colors"
          style={{ borderColor: dragging ? "#4A57B9" : selectedFile ? "#10B981" : "#D1D5DB", background: dragging ? "#EEF2FF" : selectedFile ? "#F0FDF4" : "#F9FAFB" }}
        >
          <Upload className="w-8 h-8 mb-1" style={{ color: dragging ? "#4A57B9" : selectedFile ? "#10B981" : "#9CA3AF" }} />
          {selectedFile ? (
            <>
              <p className="text-sm font-semibold" style={{ color: "#10B981" }}>{selectedFile.name}</p>
              <p className="text-xs" style={{ color: "#6B7280" }}>{(selectedFile.size / 1024).toFixed(1)} KB · Click to change</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium" style={{ color: "#374151" }}>Drag & drop your file here</p>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>or click to browse</p>
            </>
          )}
          <input ref={fileInputRef} type="file" accept={accept} className="hidden" onChange={handleFileChange} />
        </div>

        {/* Data type selector */}
        <div className="mt-4">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Data Type</label>
          <select
            value={dataType}
            onChange={(e) => setDataType(e.target.value)}
            className="w-full text-sm px-3 py-2.5 rounded-xl border outline-none"
            style={{ borderColor: "#E3E9F6", color: "#111827" }}
          >
            {SUPPORTED_DATA_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Result banner */}
        {result && (
          <div className={`mt-3 flex items-start gap-2 p-3 rounded-xl text-sm`}
            style={{ background: result.success ? "#D1FAE5" : "#FEE2E2", color: result.success ? "#065F46" : "#991B1B" }}>
            {result.success ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
            {result.message}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
          >
            <Upload className="w-4 h-4" />
            {isLoading ? "Uploading…" : "Upload & Import"}
          </button>
        </div>
      </Card>

      {/* Supported types */}
      <Card>
        <h2 className="text-sm font-bold mb-4" style={{ color: "#111827" }}>Supported Data Types</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SUPPORTED_DATA_TYPES.map((t) => (
            <div key={t} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border" style={{ borderColor: "#E3E9F6" }}>
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#10B981" }} />
              <span className="text-sm font-medium" style={{ color: "#374151" }}>{t}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Tab 3: API Integrations ──────────────────────────────────────────────

const INTEGRATION_TYPES = ["REST API", "Webhook", "ERP", "HRMS", "IoT", "SCADA", "Custom"];
const AUTH_TYPES = ["API Key", "OAuth 2.0", "Basic Auth", "Bearer Token", "None"];
const SYNC_FREQUENCIES = ["Real-time", "Every 15 min", "Hourly", "Daily", "Weekly"];

function ApiIntegrationsTab() {
  const { data: integrations = [], isLoading } = useListApiIntegrationsQuery();
  const [createIntegration] = useCreateApiIntegrationMutation();
  const [updateIntegration] = useUpdateApiIntegrationMutation();
  const [deleteIntegration] = useDeleteApiIntegrationMutation();

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiIntegration | null>(null);
  const [form, setForm] = useState({
    name: "", type: "REST API", endpoint_url: "", auth_type: "API Key",
    sync_frequency: "Hourly", is_active: true, description: "",
  });

  function openAdd() {
    setEditTarget(null);
    setForm({ name: "", type: "REST API", endpoint_url: "", auth_type: "API Key", sync_frequency: "Hourly", is_active: true, description: "" });
    setShowModal(true);
  }

  function openEdit(item: ApiIntegration) {
    setEditTarget(item);
    setForm({
      name: item.name,
      type: item.type,
      endpoint_url: item.endpoint_url,
      auth_type: item.auth_type,
      sync_frequency: item.sync_frequency ?? "Hourly",
      is_active: item.is_active,
      description: item.description ?? "",
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.endpoint_url.trim()) return;
    if (editTarget) {
      await updateIntegration({ integrationId: editTarget.id, ...form });
    } else {
      await createIntegration(form);
    }
    setShowModal(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold" style={{ color: "#111827" }}>API Integrations</h2>
          <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Connect external systems via REST, webhooks, or direct integrations</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
        >
          <Plus className="w-4 h-4" />
          Add Integration
        </button>
      </div>

      {isLoading ? <Card><Spinner /></Card> : integrations.length === 0 ? (
        <Card>
          <EmptyState message="No integrations configured. Add one to connect an external system." />
          <div className="text-center mt-3">
            <button type="button" onClick={openAdd} className="text-sm font-semibold" style={{ color: "#4A57B9" }}>
              + Add your first integration
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {integrations.map((item) => (
            <Card key={item.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#EEF2FF" }}>
                    <Link className="w-4.5 h-4.5" style={{ color: "#4A57B9" }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#111827" }}>{item.name}</p>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>{item.type}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{
                  background: item.is_active ? "#D1FAE5" : "#F3F4F6",
                  color: item.is_active ? "#065F46" : "#9CA3AF",
                }}>
                  {item.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="space-y-1.5 text-xs mb-4" style={{ color: "#6B7280" }}>
                <div className="flex items-center gap-2">
                  <Link className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate font-mono">{item.endpoint_url}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Key className="w-3 h-3 flex-shrink-0" />
                  <span>{item.auth_type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span>{item.sync_frequency ?? "Manual"}</span>
                </div>
                {item.records_synced != null && (
                  <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 flex-shrink-0" />
                    <span>{item.records_synced.toLocaleString()} records synced</span>
                  </div>
                )}
              </div>

              {item.description && (
                <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>{item.description}</p>
              )}

              <div className="flex gap-2 pt-3 border-t" style={{ borderColor: "#F3F4F6" }}>
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border flex-1 justify-center"
                  style={{ borderColor: "#E3E9F6", color: "#4A57B9" }}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteIntegration(item.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border"
                  style={{ borderColor: "#FEE2E2", color: "#EF4444" }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl border p-6 w-full max-w-lg mx-4" style={{ borderColor: "#E3E9F6" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold" style={{ color: "#111827" }}>
                {editTarget ? "Edit Integration" : "Add API Integration"}
              </h3>
              <button type="button" onClick={() => setShowModal(false)}>
                <X className="w-4 h-4" style={{ color: "#9CA3AF" }} />
              </button>
            </div>

            <div className="space-y-4">
              {[
                { label: "Integration Name", key: "name", placeholder: "e.g. SAP ERP Production" },
                { label: "Endpoint URL", key: "endpoint_url", placeholder: "https://api.example.com/v1/..." },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>{label}</label>
                  <input
                    className="w-full text-sm px-3 py-2.5 rounded-xl border outline-none"
                    style={{ borderColor: "#E3E9F6", color: "#111827" }}
                    placeholder={placeholder}
                    value={form[key as keyof typeof form] as string}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Type", key: "type", options: INTEGRATION_TYPES },
                  { label: "Auth Type", key: "auth_type", options: AUTH_TYPES },
                  { label: "Sync Frequency", key: "sync_frequency", options: SYNC_FREQUENCIES },
                ].map(({ label, key, options }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>{label}</label>
                    <select
                      className="w-full text-sm px-3 py-2.5 rounded-xl border outline-none"
                      style={{ borderColor: "#E3E9F6", color: "#111827" }}
                      value={form[key as keyof typeof form] as string}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    >
                      {options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-xs font-semibold" style={{ color: "#374151" }}>Active</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Description (optional)</label>
                <textarea
                  rows={2}
                  className="w-full text-sm px-3 py-2.5 rounded-xl border outline-none resize-none"
                  style={{ borderColor: "#E3E9F6", color: "#111827" }}
                  placeholder="Brief description of this integration…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ borderColor: "#E3E9F6", color: "#6B7280" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!form.name.trim() || !form.endpoint_url.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
              >
                {editTarget ? "Save Changes" : "Add Integration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 4: Import History ────────────────────────────────────────────────

function ImportHistoryTab() {
  const { data: imports = [], isLoading } = useListImportsQuery();

  function formatDate(iso: string) {
    try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return iso; }
  }

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E9EEF8" }}>
        <div>
          <h2 className="text-sm font-bold" style={{ color: "#111827" }}>Import History</h2>
          <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{imports.length} import{imports.length !== 1 ? "s" : ""} on record</p>
        </div>
        <div className="flex gap-3 text-xs">
          {(["success", "partial", "processing", "failed"] as const).map((s) => {
            const st = STATUS_STYLES.import[s];
            const count = imports.filter((i) => i.status === s).length;
            if (!count) return null;
            return (
              <span key={s} className="px-2 py-0.5 rounded-full font-semibold" style={{ background: st.bg, color: st.color }}>
                {count} {st.label}
              </span>
            );
          })}
        </div>
      </div>

      {isLoading ? <div className="p-5"><Spinner /></div> : imports.length === 0 ? (
        <div className="p-5"><EmptyState message="No imports yet. Upload an Excel or CSV file to get started." /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                {["File Name", "Type", "Data Type", "Records", "Success", "Failed", "Status", "Uploaded By", "Date"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {imports.map((row) => {
                const st = STATUS_STYLES.import[row.status] ?? STATUS_STYLES.import.processing;
                return (
                  <tr key={row.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {row.import_type === "excel"
                          ? <FileSpreadsheet className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#10B981" }} />
                          : <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#4A57B9" }} />}
                        <span className="font-medium text-xs" style={{ color: "#111827" }}>{row.file_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs uppercase font-semibold" style={{ color: "#6B7280" }}>{row.import_type}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#374151" }}>{row.data_type}</td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: "#374151" }}>{row.records_total.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: "#10B981" }}>{row.records_success.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: row.records_failed > 0 ? "#EF4444" : "#9CA3AF" }}>{row.records_failed.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{row.uploaded_by}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{formatDate(row.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ─── Tab 5: Validation Logs ───────────────────────────────────────────────

function ValidationLogsTab() {
  const { data: logs = [], isLoading } = useListValidationLogsQuery();

  const passCount    = logs.filter((l) => l.status === "pass").length;
  const warningCount = logs.filter((l) => l.status === "warning").length;
  const failCount    = logs.filter((l) => l.status === "fail").length;

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E9EEF8" }}>
        <div>
          <h2 className="text-sm font-bold" style={{ color: "#111827" }}>Validation Logs</h2>
          <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Rules applied during import processing</p>
        </div>
        <div className="flex gap-2 text-xs">
          {[
            { label: `${passCount} Pass`,    style: STATUS_STYLES.validation.pass },
            { label: `${warningCount} Warn`, style: STATUS_STYLES.validation.warning },
            { label: `${failCount} Fail`,    style: STATUS_STYLES.validation.fail },
          ].map(({ label, style }) => (
            <span key={label} className="px-2 py-0.5 rounded-full font-semibold" style={{ background: style.bg, color: style.color }}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {isLoading ? <div className="p-5"><Spinner /></div> : logs.length === 0 ? (
        <div className="p-5"><EmptyState message="No validation logs yet." /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                {["File", "Rule", "Status", "Records Affected", "Message", "Timestamp"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((row) => {
                const style = STATUS_STYLES.validation[row.status] ?? STATUS_STYLES.validation.pass;
                const StatusIcon = style.icon;
                return (
                  <tr key={row.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-4 py-3 text-xs font-medium" style={{ color: "#111827" }}>{row.file_name}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{row.rule}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: style.bg, color: style.color }}>
                        <StatusIcon className="w-3 h-3" />
                        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: "#374151" }}>{row.records_affected.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{row.message ?? "—"}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#9CA3AF" }}>{row.timestamp}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ─── Tab 6: Sync Status ───────────────────────────────────────────────────

function SyncStatusTab() {
  const { data, isLoading, refetch } = useGetSyncStatusQuery();
  const [triggerSync, { isLoading: syncing }] = useTriggerSyncMutation();
  const integrations = data?.integrations ?? [];

  async function handleSync(name?: string) {
    await triggerSync({ integration: name });
    refetch();
  }

  const TYPE_ICONS: Record<string, typeof Database> = {
    erp: BarChart3, hrms: Activity, iot: Wifi, safety: AlertTriangle,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold" style={{ color: "#111827" }}>Sync Status</h2>
          <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Monitor live sync state for all connected systems</p>
        </div>
        <button
          type="button"
          onClick={() => handleSync()}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-70"
          style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          Sync All
        </button>
      </div>

      {isLoading ? <Card><Spinner /></Card> : integrations.length === 0 ? (
        <Card><EmptyState message="No sync integrations configured." /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {integrations.map((item, i) => {
            const st = STATUS_STYLES.sync[item.status as keyof typeof STATUS_STYLES.sync] ?? STATUS_STYLES.sync.active;
            const IconComponent = TYPE_ICONS[item.integration_type ?? ""] ?? Database;
            return (
              <Card key={item.id ?? i}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#EEF2FF" }}>
                      <IconComponent className="w-5 h-5" style={{ color: "#4A57B9" }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold" style={{ color: "#111827" }}>{item.name}</h3>
                      {item.integration_type && (
                        <p className="text-xs uppercase font-semibold" style={{ color: "#9CA3AF" }}>{item.integration_type}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.status === "active" ? (
                      <Wifi className="w-3.5 h-3.5" style={{ color: "#10B981" }} />
                    ) : item.status === "error" ? (
                      <WifiOff className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />
                    ) : null}
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: "#6B7280" }}>Last sync</span>
                    <span className="font-semibold text-xs" style={{ color: "#374151" }}>{item.last_sync}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: "#6B7280" }}>Records synced</span>
                    <span className="font-semibold text-xs" style={{ color: "#374151" }}>{item.records_synced.toLocaleString()}</span>
                  </div>
                  {item.error_message && (
                    <div className="flex items-start gap-1.5 text-xs p-2 rounded-lg" style={{ background: "#FEE2E2", color: "#991B1B" }}>
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {item.error_message}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleSync(item.name)}
                  disabled={syncing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold w-full justify-center disabled:opacity-70"
                  style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                  Sync Now
                </button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

type TabId = "excel-upload" | "csv-import" | "api-integrations" | "import-history" | "validation-logs" | "sync-status";

const TABS: { id: TabId; label: string; icon: typeof Upload }[] = [
  { id: "excel-upload",      label: "Excel Upload",      icon: FileSpreadsheet },
  { id: "csv-import",        label: "CSV Import",        icon: FileText },
  { id: "api-integrations",  label: "API Integrations",  icon: Link },
  { id: "import-history",    label: "Import History",    icon: Clock },
  { id: "validation-logs",   label: "Validation Logs",   icon: CheckCircle2 },
  { id: "sync-status",       label: "Sync Status",       icon: RefreshCw },
];

export function DataManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") ?? "excel-upload") as TabId;

  function setTab(id: TabId) {
    setSearchParams({ tab: id });
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Data Management</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Import, validate and sync your organisation data</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={tab === id
              ? { background: "#4A57B9", color: "#fff", boxShadow: "0 4px 10px rgba(74,87,185,0.25)" }
              : { background: "#F3F4F6", color: "#6B7280" }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "excel-upload"     && <UploadTab type="excel" />}
      {tab === "csv-import"       && <UploadTab type="csv" />}
      {tab === "api-integrations" && <ApiIntegrationsTab />}
      {tab === "import-history"   && <ImportHistoryTab />}
      {tab === "validation-logs"  && <ValidationLogsTab />}
      {tab === "sync-status"      && <SyncStatusTab />}
    </div>
  );
}
