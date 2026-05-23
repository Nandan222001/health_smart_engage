import { useState } from "react";
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle, RefreshCw, Download, Database } from "lucide-react";

type TabId = "Upload" | "Import History" | "Validation Logs" | "Sync Status";

const TABS: TabId[] = ["Upload", "Import History", "Validation Logs", "Sync Status"];

// ── Import History ──────────────────────────────────────────────────────────

interface ImportRecord {
  fileName: string;
  type: string;
  records: number;
  status: "Success" | "Failed" | "Processing";
  uploadedBy: string;
  date: string;
}

const IMPORT_HISTORY: ImportRecord[] = [
  { fileName: "incidents_may_2025.xlsx", type: "Incidents", records: 142, status: "Success", uploadedBy: "James Carter", date: "22 May 2025" },
  { fileName: "near_miss_q1.csv", type: "Near Miss", records: 87, status: "Success", uploadedBy: "Sarah Kim", date: "20 May 2025" },
  { fileName: "permits_batch_04.xlsx", type: "Permits", records: 53, status: "Failed", uploadedBy: "David Osei", date: "18 May 2025" },
  { fileName: "training_records_apr.csv", type: "Training Records", records: 312, status: "Success", uploadedBy: "Emma Watts", date: "15 May 2025" },
  { fileName: "employees_update.xlsx", type: "Employees", records: 847, status: "Success", uploadedBy: "Admin", date: "12 May 2025" },
  { fileName: "risk_assessments_q1.csv", type: "Risk Assessments", records: 29, status: "Processing", uploadedBy: "Roy Evans", date: "10 May 2025" },
  { fileName: "audits_april.xlsx", type: "Audits", records: 64, status: "Success", uploadedBy: "Linda Shaw", date: "8 May 2025" },
  { fileName: "permits_batch_03.csv", type: "Permits", records: 41, status: "Failed", uploadedBy: "Tom Hardy", date: "5 May 2025" },
];

const IMPORT_STATUS_STYLES: Record<ImportRecord["status"], { bg: string; color: string }> = {
  Success: { bg: "#D1FAE5", color: "#10B981" },
  Failed: { bg: "#FEE2E2", color: "#EF4444" },
  Processing: { bg: "#FEF3C7", color: "#F59E0B" },
};

// ── Validation Logs ─────────────────────────────────────────────────────────

type ValidationStatus = "Pass" | "Fail" | "Warning";

interface ValidationLog {
  file: string;
  rule: string;
  status: ValidationStatus;
  recordsAffected: number;
  timestamp: string;
}

const VALIDATION_LOGS: ValidationLog[] = [
  { file: "incidents_may_2025.xlsx", rule: "Required fields check", status: "Pass", recordsAffected: 142, timestamp: "22 May 2025, 09:14" },
  { file: "near_miss_q1.csv", rule: "Date format validation", status: "Pass", recordsAffected: 87, timestamp: "20 May 2025, 11:32" },
  { file: "permits_batch_04.xlsx", rule: "Duplicate entry check", status: "Fail", recordsAffected: 8, timestamp: "18 May 2025, 14:07" },
  { file: "training_records_apr.csv", rule: "Employee ID reference", status: "Warning", recordsAffected: 12, timestamp: "15 May 2025, 10:50" },
  { file: "employees_update.xlsx", rule: "Email format validation", status: "Warning", recordsAffected: 3, timestamp: "12 May 2025, 08:22" },
  { file: "audits_april.xlsx", rule: "Site code reference", status: "Pass", recordsAffected: 64, timestamp: "8 May 2025, 16:45" },
];

const VAL_STATUS_STYLES: Record<ValidationStatus, { bg: string; color: string; icon: typeof CheckCircle2 }> = {
  Pass: { bg: "#D1FAE5", color: "#10B981", icon: CheckCircle2 },
  Fail: { bg: "#FEE2E2", color: "#EF4444", icon: XCircle },
  Warning: { bg: "#FEF3C7", color: "#F59E0B", icon: AlertCircle },
};

// ── Sync Status ─────────────────────────────────────────────────────────────

type SyncStatusType = "Synced" | "Syncing" | "Error";

interface SyncIntegration {
  name: string;
  lastSync: string;
  status: SyncStatusType;
  recordsSynced: number;
}

const SYNC_INTEGRATIONS: SyncIntegration[] = [
  { name: "ERP System", lastSync: "2 minutes ago", status: "Synced", recordsSynced: 2341 },
  { name: "HRMS", lastSync: "3 minutes ago", status: "Synced", recordsSynced: 847 },
  { name: "IoT Sensors", lastSync: "Just now", status: "Syncing", recordsSynced: 1024 },
  { name: "Safety Sensors", lastSync: "12 minutes ago", status: "Error", recordsSynced: 512 },
];

const SYNC_STATUS_STYLES: Record<SyncStatusType, { bg: string; color: string }> = {
  Synced: { bg: "#D1FAE5", color: "#10B981" },
  Syncing: { bg: "#EEF2FF", color: "#4A57B9" },
  Error: { bg: "#FEE2E2", color: "#EF4444" },
};

const SUPPORTED_TYPES = [
  "Incidents", "Near Miss", "Permits", "Audits", "Training Records", "Employees", "Risk Assessments",
];

// ── Upload Card ─────────────────────────────────────────────────────────────

function UploadCard({ title, accept, icon: Icon }: { title: string; accept: string; icon: typeof Upload }) {
  const [dragging, setDragging] = useState(false);

  return (
    <div className="bg-white rounded-2xl border p-5 flex flex-col gap-4" style={{ borderColor: "#E3E9F6" }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#EEF2FF" }}>
          <Icon className="w-5 h-5" style={{ color: "#4A57B9" }} />
        </div>
        <h3 className="text-[15px] font-bold" style={{ color: "#111827" }}>{title}</h3>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); }}
        className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-10 gap-2 transition-colors"
        style={{ borderColor: dragging ? "#4A57B9" : "#D1D5DB", background: dragging ? "#EEF2FF" : "#F9FAFB" }}
      >
        <Upload className="w-8 h-8 mb-1" style={{ color: dragging ? "#4A57B9" : "#9CA3AF" }} />
        <p className="text-sm font-medium" style={{ color: "#374151" }}>Drag & drop your file here</p>
        <p className="text-xs" style={{ color: "#9CA3AF" }}>Supported: {accept.toUpperCase()}</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-colors hover:bg-gray-50"
          style={{ borderColor: "#E3E9F6", color: "#374151" }}
        >
          <Download className="w-4 h-4" />
          Download Template
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
        >
          <Upload className="w-4 h-4" />
          Upload
        </button>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export function DataManagementPage() {
  const [activeTab, setActiveTab] = useState<TabId>("Upload");

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Data Management</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Import, validate and sync your organisation data</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl border p-1 w-fit" style={{ borderColor: "#E3E9F6" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={
              activeTab === tab
                ? { background: "linear-gradient(135deg, #4A57B9, #6F80E8)", color: "#fff" }
                : { color: "#6B7280" }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Upload ── */}
      {activeTab === "Upload" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UploadCard title="Excel Upload" accept=".xlsx, .xls" icon={FileText} />
            <UploadCard title="CSV Import" accept=".csv" icon={Upload} />
          </div>

          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
            <h2 className="text-[15px] font-bold mb-4" style={{ color: "#111827" }}>Supported Data Types</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {SUPPORTED_TYPES.map((type) => (
                <div key={type} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border" style={{ borderColor: "#E3E9F6" }}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#10B981" }} />
                  <span className="text-sm font-medium" style={{ color: "#374151" }}>{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Import History ── */}
      {activeTab === "Import History" && (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "#E9EEF8" }}>
            <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>Import History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                  {["File Name", "Type", "Records", "Status", "Uploaded By", "Date"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {IMPORT_HISTORY.map((row, idx) => (
                  <tr key={idx} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#E3E9F6" }}>
                    <td className="px-5 py-3.5 font-medium" style={{ color: "#111827" }}>{row.fileName}</td>
                    <td className="px-5 py-3.5" style={{ color: "#6B7280" }}>{row.type}</td>
                    <td className="px-5 py-3.5 font-semibold" style={{ color: "#374151" }}>{row.records.toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: IMPORT_STATUS_STYLES[row.status].bg, color: IMPORT_STATUS_STYLES[row.status].color }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5" style={{ color: "#6B7280" }}>{row.uploadedBy}</td>
                    <td className="px-5 py-3.5" style={{ color: "#6B7280" }}>{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Validation Logs ── */}
      {activeTab === "Validation Logs" && (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "#E9EEF8" }}>
            <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>Validation Logs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                  {["File", "Rule", "Status", "Records Affected", "Timestamp"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VALIDATION_LOGS.map((row, idx) => {
                  const style = VAL_STATUS_STYLES[row.status];
                  const StatusIcon = style.icon;
                  return (
                    <tr key={idx} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#E3E9F6" }}>
                      <td className="px-5 py-3.5 font-medium" style={{ color: "#111827" }}>{row.file}</td>
                      <td className="px-5 py-3.5" style={{ color: "#6B7280" }}>{row.rule}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: style.bg, color: style.color }}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold" style={{ color: "#374151" }}>{row.recordsAffected}</td>
                      <td className="px-5 py-3.5" style={{ color: "#6B7280" }}>{row.timestamp}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Sync Status ── */}
      {activeTab === "Sync Status" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SYNC_INTEGRATIONS.map((integration) => {
            const style = SYNC_STATUS_STYLES[integration.status];
            return (
              <div key={integration.name} className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: "#E3E9F6" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#EEF2FF" }}>
                      <Database className="w-5 h-5" style={{ color: "#4A57B9" }} />
                    </div>
                    <h3 className="text-[15px] font-bold" style={{ color: "#111827" }}>{integration.name}</h3>
                  </div>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: style.bg, color: style.color }}
                  >
                    {integration.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: "#6B7280" }}>Last sync</span>
                    <span className="font-semibold" style={{ color: "#374151" }}>{integration.lastSync}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: "#6B7280" }}>Records synced</span>
                    <span className="font-semibold" style={{ color: "#374151" }}>{integration.recordsSynced.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold w-full justify-center"
                  style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Sync Now
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
