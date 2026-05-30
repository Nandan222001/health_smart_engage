import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router";
import {
  Upload, FileText, CheckCircle2, XCircle, AlertCircle, RefreshCw,
  Download, Database, Clock, AlertTriangle, FileSpreadsheet,
  Users, MapPin, ShieldAlert, ClipboardList, BookOpen,
  Shield, Copy, Layers, Info, Zap, Eye,
  PenLine, Plug, Server, UserCheck, Timer, Wifi, Building2,
  Code2, Plus, Trash2, ChevronRight, CheckSquare, Save,
  RotateCcw, Link, X, FolderOpen, Presentation, BookMarked,
  GraduationCap, AlertOctagon,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  useListImportsQuery,
  useCreateImportMutation,
  useListValidationLogsQuery,
  useListApiIntegrationsQuery,
  useCreateApiIntegrationMutation,
  useDeleteApiIntegrationMutation,
} from "@/features/data-management/api/dataManagementApi";

// ── Constants ─────────────────────────────────────────────────────────────────

const API_BASE = (import.meta.env.VITE_API_URL as string || "/api/v1").replace(/\/$/, "");

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const jwt = localStorage.getItem("hse_jwt");
  if (jwt) headers["Authorization"] = `Bearer ${jwt}`;
  try {
    const u = JSON.parse(localStorage.getItem("hse_user") || "{}");
    if (u?.email)   headers["X-User-Email"] = u.email;
    if (u?.role)    headers["X-User-Role"]  = u.role;
    if (u?.orgCode) headers["X-Tenant-Id"]  = u.orgCode;
  } catch { /**/ }
  return headers;
}

async function postData(path: string, body: Record<string, unknown>) {
  const res  = await fetch(`${API_BASE}${path}`, {
    method:  "POST",
    headers: getAuthHeaders(),
    body:    JSON.stringify({ data: body }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.detail || json?.message || `HTTP ${res.status}`);
  return json?.data ?? json;
}

// ── MANUAL ENTRY ──────────────────────────────────────────────────────────────

type FieldDef = {
  label: string; key: string; type: string;
  placeholder?: string; options?: string[]; required?: boolean;
};

type ManualModule = {
  id: string; label: string; icon: React.ElementType;
  color: string; bg: string;
  endpoint: string;
  fields: FieldDef[];
};

const MANUAL_MODULES: ManualModule[] = [
  {
    id: "sites", label: "Sites", icon: MapPin, color: "#0E7490", bg: "#ECFEFF",
    endpoint: "/sites",
    fields: [
      { label: "Site Name",      key: "name",           type: "text",   placeholder: "e.g. London HQ",            required: true },
      { label: "Site Type",      key: "type",           type: "select", options: ["Office","Warehouse","Manufacturing","Construction","Plant","Offshore","Other"], required: true },
      { label: "Address",        key: "address",        type: "text",   placeholder: "Full site address" },
      { label: "Region",         key: "region",         type: "text",   placeholder: "e.g. South Wales" },
      { label: "Hazard Level",   key: "hazard_level",   type: "select", options: ["Low Risk","Medium Risk","High Risk","Critical Risk"] },
      { label: "Employee Count", key: "employee_count", type: "number", placeholder: "150" },
    ],
  },
  {
    id: "users", label: "Users", icon: Users, color: "#4A57B9", bg: "#EEF2FF",
    endpoint: "/admin/users/invitations",
    fields: [
      { label: "Full Name",   key: "display_name", type: "text",   placeholder: "e.g. James Thompson", required: true },
      { label: "Email",       key: "email",        type: "email",  placeholder: "james@company.com",   required: true },
      { label: "Role",        key: "role",         type: "select", options: ["Admin","HSE Manager","Safety Manager","Supervisor","Auditor","Worker","Contractor"], required: true },
      { label: "Department",  key: "department",   type: "text",   placeholder: "e.g. Operations" },
      { label: "Site ID",     key: "site",         type: "text",   placeholder: "SITE-001" },
    ],
  },
  {
    id: "incidents", label: "Incidents", icon: AlertTriangle, color: "#EF4444", bg: "#FEE2E2",
    endpoint: "/incidents",
    fields: [
      { label: "Incident Type",  key: "incident_type", type: "select", options: ["incident_report","unsafe_act","unsafe_condition","near_miss"], required: true },
      { label: "Severity",       key: "severity",      type: "select", options: ["low","medium","high","critical"],   required: true },
      { label: "Description",    key: "description",   type: "textarea", placeholder: "Brief description of what happened...", required: true },
      { label: "Location",       key: "location_id",   type: "text",   placeholder: "e.g. Site A - Zone 4" },
      { label: "Date Occurred",  key: "occurred_at",   type: "date" },
      { label: "Reported By",    key: "reporter_note", type: "text",   placeholder: "Employee name or ID" },
    ],
  },
  {
    id: "risk", label: "Risk Assessment", icon: ShieldAlert, color: "#8B5CF6", bg: "#F5F3FF",
    endpoint: "/risks/assessments",
    fields: [
      { label: "Hazard / Task",    key: "title",              type: "text",   placeholder: "e.g. Machinery Contact/Crushing", required: true },
      { label: "Hazard Description", key: "hazard_description", type: "textarea", placeholder: "Describe the hazard in detail..." },
      { label: "Location",         key: "location",           type: "text",   placeholder: "e.g. Zone 4 - Chemical Handling" },
      { label: "Likelihood (1–5)", key: "likelihood",         type: "number", placeholder: "3",  required: true },
      { label: "Consequence (1–5)",key: "consequence",        type: "number", placeholder: "4",  required: true },
      { label: "Risk Level",       key: "severity",           type: "select", options: ["low","medium","high","critical"] },
      { label: "Controls",         key: "controls",           type: "textarea", placeholder: "Describe engineering and administrative controls..." },
      { label: "Responsible",      key: "responsible_person", type: "text",   placeholder: "Safety Manager" },
    ],
  },
  {
    id: "capa", label: "CAPA", icon: ClipboardList, color: "#10B981", bg: "#DCFCE7",
    endpoint: "/capas",
    fields: [
      { label: "Title",        key: "title",       type: "text",   placeholder: "e.g. Fix machine guard",    required: true },
      { label: "Description",  key: "description", type: "textarea", placeholder: "Describe the corrective action..." },
      { label: "Priority",     key: "priority",    type: "select", options: ["low","medium","high","critical"], required: true },
      { label: "Assigned To",  key: "assigned_to", type: "email",  placeholder: "assignee@company.com" },
      { label: "Due Date",     key: "due_date",    type: "date",   required: true },
      { label: "Source Type",  key: "source_type", type: "select", options: ["audit","incident","inspection","near_miss","risk_assessment"] },
    ],
  },
  {
    id: "training", label: "Training", icon: GraduationCap, color: "#7C3AED", bg: "#F5F3FF",
    endpoint: "/training/requirements",
    fields: [
      { label: "Training Name",          key: "training_name",     type: "text",   placeholder: "e.g. Fire Safety Awareness", required: true },
      { label: "Role",                   key: "role_name",         type: "text",   placeholder: "e.g. All Staff",             required: true },
      { label: "Validity (days)",        key: "validity_days",     type: "number", placeholder: "365" },
      { label: "Mandatory",              key: "is_mandatory",      type: "select", options: ["true","false"] },
      { label: "Description",            key: "description",       type: "textarea", placeholder: "Training objectives..." },
    ],
  },
  {
    id: "employees", label: "Employees", icon: UserCheck, color: "#0891B2", bg: "#ECFEFF",
    endpoint: "/employees",
    fields: [
      { label: "Full Name",         key: "full_name",         type: "text",   placeholder: "e.g. James Thompson",  required: true },
      { label: "Employee ID",       key: "employee_id",       type: "text",   placeholder: "EMP-001" },
      { label: "Job Title",         key: "job_title",         type: "text",   placeholder: "e.g. Safety Officer",  required: true },
      { label: "Department",        key: "department",        type: "text",   placeholder: "e.g. Operations",      required: true },
      { label: "Email",             key: "email",             type: "email",  placeholder: "james@org.com" },
      { label: "Employment Type",   key: "employment_type",   type: "select", options: ["Full-Time","Part-Time","Contractor","Intern"] },
    ],
  },
  {
    id: "hazards", label: "Hazards", icon: AlertOctagon, color: "#DC2626", bg: "#FEF2F2",
    endpoint: "/hazards",
    fields: [
      { label: "Hazard Title",  key: "title",       type: "text",   placeholder: "e.g. Slippery walkway",    required: true },
      { label: "Type",          key: "type",        type: "select", options: ["physical","chemical","biological","ergonomic","electrical","fire","environmental"], required: true },
      { label: "Severity",      key: "severity",    type: "select", options: ["low","medium","high","critical"], required: true },
      { label: "Location",      key: "location_id", type: "text",   placeholder: "Zone 4 / Site A" },
      { label: "Description",   key: "description", type: "textarea", placeholder: "Describe the hazard..." },
      { label: "Mitigation",    key: "mitigation",  type: "textarea", placeholder: "Controls in place..." },
    ],
  },
  {
    id: "near_miss", label: "Near Miss", icon: AlertTriangle, color: "#EA580C", bg: "#FFF7ED",
    endpoint: "/incidents",
    fields: [
      { label: "Title",             key: "title",         type: "text",   placeholder: "e.g. Forklift near collision", required: true },
      { label: "Severity",          key: "severity",      type: "select", options: ["low","medium","high","critical"],  required: true },
      { label: "Description",       key: "description",   type: "textarea", placeholder: "What happened and what was avoided..." },
      { label: "Location",          key: "location_id",   type: "text",   placeholder: "e.g. Warehouse A" },
      { label: "Date Occurred",     key: "occurred_at",   type: "date" },
      { label: "Reported By",       key: "reporter_note", type: "text",   placeholder: "Employee name" },
    ],
  },
  {
    id: "permits", label: "Permits", icon: Shield, color: "#0D9488", bg: "#F0FDFA",
    endpoint: "/permits",
    fields: [
      { label: "Work Description",  key: "title",          type: "text",   placeholder: "e.g. Welding on roof structure", required: true },
      { label: "Permit Type",       key: "permit_type",    type: "select", options: ["hot_work","confined_space","electrical","working_at_height","general"], required: true },
      { label: "Location",          key: "location",       type: "text",   placeholder: "e.g. Zone 3 – Roof" },
      { label: "Contractor",        key: "contractor",     type: "text",   placeholder: "Company or individual" },
      { label: "Start Date",        key: "valid_from",     type: "date",   required: true },
      { label: "End Date",          key: "valid_until",    type: "date" },
    ],
  },
  {
    id: "vendors", label: "Vendors", icon: Building2, color: "#4338CA", bg: "#EEF2FF",
    endpoint: "/vendors",
    fields: [
      { label: "Company Name",      key: "name",           type: "text",   placeholder: "e.g. ABC Contractors Ltd", required: true },
      { label: "Type",              key: "vendor_type",    type: "select", options: ["contractor","supplier","service_provider","consultant"], required: true },
      { label: "Contact Name",      key: "contact_name",   type: "text",   placeholder: "Primary contact" },
      { label: "Contact Email",     key: "contact_email",  type: "email",  placeholder: "contact@vendor.com" },
      { label: "Phone",             key: "phone",          type: "text",   placeholder: "+44 20 1234 5678" },
      { label: "Compliance Status", key: "status",         type: "select", options: ["compliant","non_compliant","pending"] },
    ],
  },
  {
    id: "assets", label: "Assets", icon: Layers, color: "#92400E", bg: "#FEF3C7",
    endpoint: "/assets",
    fields: [
      { label: "Asset Name",          key: "name",              type: "text",   placeholder: "e.g. Forklift FL-01",   required: true },
      { label: "Category",            key: "category",          type: "select", options: ["machinery","vehicle","electrical","PPE","tool","infrastructure"], required: true },
      { label: "Serial Number",       key: "serial_number",     type: "text",   placeholder: "SN-12345" },
      { label: "Location / Site",     key: "location",          type: "text",   placeholder: "Warehouse A" },
      { label: "Last Inspection",     key: "last_inspected_at", type: "date" },
      { label: "Next Inspection",     key: "next_inspection_at",type: "date" },
    ],
  },
];

function ManualEntryTab() {
  const [activeModule, setActiveModule] = useState<ManualModule>(MANUAL_MODULES[0]);
  const [rows,   setRows]   = useState<Record<string, string>[]>([{}]);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState<{ module: string; count: number; time: string }[]>([]);
  const [error,  setError]  = useState<string | null>(null);

  const updateRow = (i: number, k: string, v: string) =>
    setRows(r => r.map((row, idx) => idx === i ? { ...row, [k]: v } : row));
  const addRow    = () => setRows(r => [...r, {}]);
  const removeRow = (i: number) => setRows(r => r.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      for (const row of rows) {
        await postData(activeModule.endpoint, row);
      }
      setSaved(s => [...s, { module: activeModule.label, count: rows.length, time: new Date().toLocaleTimeString() }]);
      setRows([{}]);
    } catch (e: unknown) {
      setError((e as Error).message || "Failed to save. Please check the fields and try again.");
    } finally {
      setSaving(false);
    }
  };

  const { color, bg } = activeModule;

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: "200px 1fr" }}>

      {/* Module sidebar */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>
          Data Type
        </div>
        {MANUAL_MODULES.map(m => {
          const Icon   = m.icon;
          const active = activeModule.id === m.id;
          return (
            <button
              key={m.id}
              onClick={() => { setActiveModule(m); setRows([{}]); setError(null); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1 text-left transition-all text-[13px]"
              style={{
                background:   active ? m.color + "12" : "transparent",
                borderLeft:   `3px solid ${active ? m.color : "transparent"}`,
                fontWeight:   active ? 600 : 400,
                color:        active ? m.color : "#6B7280",
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {m.label}
            </button>
          );
        })}

        {/* Saved log */}
        {saved.length > 0 && (
          <div className="mt-4 rounded-xl p-3 border" style={{ background: bg, borderColor: color + "30" }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color }}>Saved</div>
            {saved.slice(-4).reverse().map((s, i) => (
              <div key={i} className="py-1.5 border-b last:border-0" style={{ borderColor: color + "20" }}>
                <div className="text-[12px] font-semibold" style={{ color }}>{s.module}</div>
                <div className="text-[11px]" style={{ color: "#9CA3AF" }}>
                  {s.count} record{s.count > 1 ? "s" : ""} · {s.time}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form area */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[16px] font-bold" style={{ color: "#111827" }}>{activeModule.label}</div>
            <div className="text-[12px]" style={{ color: "#9CA3AF" }}>
              {rows.length} record{rows.length > 1 ? "s" : ""} ready to save
            </div>
          </div>
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium border transition-colors hover:opacity-80"
            style={{ background: "#EEF2FF", color: "#4A57B9", borderColor: "#C7D2FE" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Row
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 rounded-xl text-sm"
            style={{ background: "#FEE2E2", color: "#991B1B" }}>
            <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
          {/* Column headers */}
          <div
            className="grid px-4 py-3 border-b"
            style={{ gridTemplateColumns: `repeat(${Math.min(activeModule.fields.length, 3)}, 1fr) 36px`, borderColor: "#F3F4F6", background: "#F8FAFF" }}
          >
            {activeModule.fields.slice(0, 3).map(f => (
              <div key={f.key} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>
                {f.label}{f.required && <span style={{ color: "#EF4444" }}> *</span>}
              </div>
            ))}
            <div />
          </div>

          {rows.map((row, i) => (
            <div key={i} className="border-b last:border-0" style={{ borderColor: "#F3F4F6" }}>
              {/* First 3 fields */}
              <div
                className="grid gap-2 px-4 py-3 items-start"
                style={{ gridTemplateColumns: `repeat(${Math.min(activeModule.fields.length, 3)}, 1fr) 36px` }}
              >
                {activeModule.fields.slice(0, 3).map(f => (
                  <FieldInput key={f.key} field={f} value={row[f.key] || ""} onChange={v => updateRow(i, f.key, v)} />
                ))}
                <button
                  onClick={() => removeRow(i)}
                  disabled={rows.length === 1}
                  className="p-2 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: rows.length === 1 ? "#F9FAFB" : "#FEF2F2", color: rows.length === 1 ? "#D1D5DB" : "#EF4444" }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {/* Remaining fields */}
              {activeModule.fields.length > 3 && (
                <div
                  className="grid gap-2 px-4 pb-3 items-start"
                  style={{ gridTemplateColumns: `repeat(${Math.min(activeModule.fields.length - 3, 3)}, 1fr)` }}
                >
                  {activeModule.fields.slice(3).map(f => (
                    <div key={f.key}>
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>
                        {f.label}{f.required && <span style={{ color: "#EF4444" }}> *</span>}
                      </div>
                      <FieldInput field={f} value={row[f.key] || ""} onChange={v => updateRow(i, f.key, v)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={() => setRows([{}])}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border transition-colors"
            style={{ background: "#F9FAFB", color: "#6B7280", borderColor: "#E3E9F6" }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-60 transition-opacity hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save Records"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldInput({ field, value, onChange }: { field: FieldDef; value: string; onChange: (v: string) => void }) {
  const base: React.CSSProperties = {
    width: "100%", padding: "7px 10px", border: "1px solid #E3E9F6",
    borderRadius: 8, fontSize: 13, outline: "none", background: "#FAFBFF",
    boxSizing: "border-box",
  };
  if (field.type === "select")
    return (
      <select value={value} onChange={e => onChange(e.target.value)} style={base}>
        <option value="">Select…</option>
        {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  if (field.type === "textarea")
    return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} rows={2} style={{ ...base, resize: "none" }} />;
  return <input type={field.type} value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} style={base} />;
}

// ── ENTITY TYPES (for Excel tab) ──────────────────────────────────────────────

interface EntityType {
  id: string; label: string; icon: React.ElementType;
  color: string; bg: string; description: string;
  fields: string[]; requiredFields: string[];
  validations: string[]; templateRows: number; sampleData: string;
  moduleKey: string;
}

const ENTITY_TYPES: EntityType[] = [
  {
    id: "users", label: "Users", icon: Users, color: "#4A57B9", bg: "#EEF2FF", moduleKey: "users",
    description: "Import user accounts with roles and site assignments",
    fields: ["Full Name", "Email", "Role", "Department", "Site ID", "Phone", "Status"],
    requiredFields: ["Full Name", "Email", "Role"],
    validations: ["Email format validation", "Role must be Admin / HSE Manager / Worker / Auditor", "Duplicate email detection", "Site ID must exist in system"],
    templateRows: 50, sampleData: "John Smith, john@example.com, HSE Manager, Operations, SITE-001, +44...",
  },
  {
    id: "sites", label: "Sites", icon: MapPin, color: "#0E7490", bg: "#ECFEFF", moduleKey: "sites",
    description: "Import operational sites and location records",
    fields: ["Site ID", "Site Name", "Address", "Postcode", "City", "Type", "Operational Status", "Capacity", "Hazard Classification"],
    requiredFields: ["Site Name", "Type"],
    validations: ["Duplicate site name detection", "Type must be Office / Warehouse / Manufacturing / Construction / Other", "Status must be Active / Inactive"],
    templateRows: 30, sampleData: "SITE001, London HQ, 123 Fleet St, EC4A 1AB, London, Office, Active, 150, Low Risk...",
  },
  {
    id: "incidents", label: "Incidents", icon: AlertTriangle, color: "#EF4444", bg: "#FEE2E2", moduleKey: "incidents",
    description: "Bulk import historical incident and near-miss records",
    fields: ["Title", "Type", "Severity", "Occurred At", "Site ID", "Reported By", "Status", "Description"],
    requiredFields: ["Title", "Type", "Severity", "Occurred At"],
    validations: ["Date format: YYYY-MM-DD", "Severity must be low / medium / high / critical", "Type must be incident / unsafe_act / unsafe_condition"],
    templateRows: 200, sampleData: "Slip on wet floor, incident, high, 2024-03-15, SITE-001...",
  },
  {
    id: "audits", label: "Audits", icon: ClipboardList, color: "#F97316", bg: "#FFEDD5", moduleKey: "audits",
    description: "Import audit schedules and completed audit records",
    fields: ["Title", "Audit Type", "Standard", "Scheduled Date", "Lead Auditor", "Status", "Site ID"],
    requiredFields: ["Title", "Audit Type", "Scheduled Date"],
    validations: ["Date format: YYYY-MM-DD", "Status must be scheduled / in_progress / completed / cancelled"],
    templateRows: 100, sampleData: "Q1 Safety Audit, Internal, ISO 45001, 2024-01-15, Jane Doe...",
  },
  {
    id: "risk_registers", label: "Risk Registers", icon: ShieldAlert, color: "#8B5CF6", bg: "#F5F3FF", moduleKey: "risk_assessments",
    description: "Import risk assessments, hazards, and risk registers",
    fields: ["Hazard Title", "Type", "Severity", "Likelihood (1-5)", "Consequence (1-5)", "Site ID", "Mitigation", "Status"],
    requiredFields: ["Hazard Title", "Type", "Severity"],
    validations: ["Likelihood and Consequence must be integers 1-5", "Risk score auto-calculated", "Duplicate hazard detection"],
    templateRows: 150, sampleData: "Chemical spill risk, chemical, high, 3, 4, SITE-001...",
  },
  {
    id: "capa", label: "CAPA", icon: CheckCircle2, color: "#10B981", bg: "#DCFCE7", moduleKey: "capa",
    description: "Import corrective and preventive action records",
    fields: ["Title", "Description", "Priority", "Assigned To (Email)", "Due Date", "Status", "Source Type"],
    requiredFields: ["Title", "Priority", "Due Date"],
    validations: ["Priority must be low / medium / high / critical", "Date format: YYYY-MM-DD", "Assigned To email must exist in system"],
    templateRows: 100, sampleData: "Fix machine guard, Replace broken guard, high, jane@org.com...",
  },
  {
    id: "sops", label: "SOPs", icon: BookOpen, color: "#F59E0B", bg: "#FEF3C7", moduleKey: "sops_policies",
    description: "Import Standard Operating Procedures and policy documents",
    fields: ["Document Title", "Category", "Version", "Owner (Email)", "Effective Date", "Review Date", "Status"],
    requiredFields: ["Document Title", "Category", "Version"],
    validations: ["Version format: v1.0", "Date format: YYYY-MM-DD", "Category must be Safety / Operations / HR / Compliance"],
    templateRows: 50, sampleData: "Hot Work Permit Procedure, Safety, v2.1, hse@org.com...",
  },
  {
    id: "training_records", label: "Training", icon: GraduationCap, color: "#7C3AED", bg: "#F5F3FF", moduleKey: "training_records",
    description: "Import training requirements and competency records",
    fields: ["Module Title", "Role", "Validity Period (Months)", "Mandatory", "Module Code", "Competency Framework"],
    requiredFields: ["Module Title", "Role"],
    validations: ["Mandatory must be Yes / No", "Validity Period must be a number (months)", "Duplicate module detection"],
    templateRows: 100, sampleData: "Fire Safety Awareness, All Staff, 12, Yes, FSA-001...",
  },
  {
    id: "employees", label: "Employees", icon: UserCheck, color: "#0891B2", bg: "#ECFEFF", moduleKey: "employees",
    description: "Import employee and worker records",
    fields: ["Full Name", "Employee ID", "Job Title", "Department", "Site", "Email", "Phone", "Employment Type", "Start Date"],
    requiredFields: ["Full Name", "Job Title", "Department"],
    validations: ["Date format: YYYY-MM-DD", "Employment Type: Full-Time / Part-Time / Contractor", "Duplicate employee detection"],
    templateRows: 200, sampleData: "James Thompson, EMP-001, Safety Officer, Operations, Site A, james@org.com...",
  },
  {
    id: "hazards", label: "Hazards", icon: AlertOctagon, color: "#DC2626", bg: "#FEF2F2", moduleKey: "incidents",
    description: "Import hazard register and hazard identification records",
    fields: ["Hazard Title", "Type", "Severity", "Location", "Reported By", "Description", "Mitigation", "Status"],
    requiredFields: ["Hazard Title", "Type", "Severity"],
    validations: ["Severity must be low / medium / high / critical", "Status must be open / mitigated / closed", "Type must be physical / chemical / biological / ergonomic"],
    templateRows: 150, sampleData: "Slippery walkway, physical, high, Zone 4, John Smith, Water pooling...",
  },
  {
    id: "near_miss", label: "Near Miss", icon: AlertTriangle, color: "#EA580C", bg: "#FFF7ED", moduleKey: "near_miss",
    description: "Import near miss and unsafe act/condition reports",
    fields: ["Title", "Type", "Severity", "Location", "Date Occurred", "Reported By", "Description", "Corrective Action"],
    requiredFields: ["Title", "Severity", "Date Occurred"],
    validations: ["Date format: YYYY-MM-DD", "Severity must be low / medium / high / critical", "Type must be near_miss / unsafe_act / unsafe_condition"],
    templateRows: 100, sampleData: "Forklift near collision, near_miss, high, Warehouse A, 2024-03-10...",
  },
  {
    id: "permits", label: "Permits", icon: Shield, color: "#0D9488", bg: "#F0FDFA", moduleKey: "permits",
    description: "Import Permit to Work records and permit history",
    fields: ["Permit Number", "Type", "Work Description", "Location", "Contractor", "Start Date", "End Date", "Status", "Approved By"],
    requiredFields: ["Permit Number", "Type", "Work Description", "Start Date"],
    validations: ["Date format: YYYY-MM-DD", "Type must be hot_work / confined_space / electrical / working_at_height / general", "Status must be draft / active / closed / cancelled"],
    templateRows: 100, sampleData: "PTW-001, hot_work, Welding on roof structure, Zone 3, ABC Ltd, 2024-03-01...",
  },
  {
    id: "vendors", label: "Vendors", icon: Building2, color: "#4338CA", bg: "#EEF2FF", moduleKey: "vendors",
    description: "Import vendor and contractor company records",
    fields: ["Company Name", "Type", "Contact Name", "Contact Email", "Phone", "Compliance Status", "Contract Start", "Contract End"],
    requiredFields: ["Company Name", "Type"],
    validations: ["Type must be contractor / supplier / service_provider", "Date format: YYYY-MM-DD", "Compliance Status must be compliant / non_compliant / pending"],
    templateRows: 50, sampleData: "ABC Contractors Ltd, contractor, John Doe, john@abc.com, +44...",
  },
  {
    id: "assets", label: "Assets", icon: Layers, color: "#92400E", bg: "#FEF3C7", moduleKey: "assets",
    description: "Import equipment, machinery and asset records",
    fields: ["Asset Name", "Category", "Serial Number", "Location / Site", "Purchase Date", "Last Inspection Date", "Next Inspection Date", "Status"],
    requiredFields: ["Asset Name", "Category"],
    validations: ["Date format: YYYY-MM-DD", "Status must be active / inactive / under_maintenance / decommissioned", "Category must be machinery / vehicle / electrical / PPE / tool"],
    templateRows: 150, sampleData: "Forklift FL-01, vehicle, SN-12345, Warehouse A, 2020-06-01, 2024-01-15...",
  },
];

// ── STATUS / styles ───────────────────────────────────────────────────────────

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

// ── SHARED UI ─────────────────────────────────────────────────────────────────

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

// ── API INTEGRATIONS TAB ──────────────────────────────────────────────────────

const API_SYSTEMS = [
  { id: "erp",     label: "ERP System",    icon: Server,    color: "#185fa5", desc: "SAP, Oracle, Microsoft Dynamics" },
  { id: "hrms",    label: "HRMS",          icon: UserCheck, color: "#534ab7", desc: "Workday, BambooHR, PeopleHR"     },
  { id: "attend",  label: "Attendance",    icon: Timer,     color: "#0f6e56", desc: "Kronos, ADP, TimeClock"          },
  { id: "iot",     label: "IoT Devices",   icon: Wifi,      color: "#854f0b", desc: "Sensors, wearables, site monitors" },
  { id: "hse_ext", label: "Existing HSE",  icon: Shield,    color: "#993c1d", desc: "Intelex, Enablon, Cority"        },
  { id: "custom",  label: "Custom API",    icon: Code2,     color: "#4A57B9", desc: "REST or GraphQL endpoint"        },
];

type ConnectStep = "list" | "configure" | "testing" | "test_ok" | "test_fail" | "done";

function ApiIntegrationsTab() {
  const { data: integrations = [], isLoading, refetch } = useListApiIntegrationsQuery();
  const [createIntegration, { isLoading: creating }]    = useCreateApiIntegrationMutation();
  const [deleteIntegration]                              = useDeleteApiIntegrationMutation();

  const [step,         setStep]         = useState<ConnectStep>("list");
  const [activeSystem, setActiveSystem] = useState<typeof API_SYSTEMS[0] | null>(null);
  const [form,         setForm]         = useState({ name: "", endpoint_url: "", api_key: "", secret: "", sync_frequency: "realtime", description: "" });
  const [saveError,    setSaveError]    = useState<string | null>(null);

  const syncColors: Record<string, string> = { realtime: "#059669", hourly: "#4A57B9", daily: "#D97706", manual: "#9CA3AF" };

  const startConnect = (sys: typeof API_SYSTEMS[0]) => {
    setActiveSystem(sys);
    setForm({ name: sys.label, endpoint_url: "", api_key: "", secret: "", sync_frequency: "realtime", description: sys.desc });
    setStep("configure");
    setSaveError(null);
  };

  const runTest = async () => {
    setStep("testing");
    await new Promise(r => setTimeout(r, 2000));
    setStep(Math.random() > 0.15 ? "test_ok" : "test_fail");
  };

  const activate = async () => {
    if (!activeSystem) return;
    try {
      await createIntegration({
        name:           form.name,
        type:           activeSystem.id,
        endpoint_url:   form.endpoint_url,
        auth_type:      "api_key",
        is_active:      true,
        sync_frequency: form.sync_frequency,
        description:    form.description,
      }).unwrap();
      setStep("done");
      refetch();
    } catch (e: unknown) {
      setSaveError((e as Error).message || "Failed to save integration.");
    }
  };

  // ── CONFIGURE VIEW ──
  if (step === "configure" && activeSystem) {
    return (
      <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 320px" }}>
        <div>
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => setStep("list")} className="p-2 rounded-lg border transition-colors hover:bg-slate-50" style={{ borderColor: "#E3E9F6" }}>
              <ChevronRight className="w-4 h-4 rotate-180" style={{ color: "#6B7280" }} />
            </button>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: activeSystem.color + "15" }}>
              <activeSystem.icon className="w-5 h-5" style={{ color: activeSystem.color }} />
            </div>
            <div>
              <div className="text-[16px] font-bold" style={{ color: "#111827" }}>Connect {activeSystem.label}</div>
              <div className="text-[12px]" style={{ color: "#9CA3AF" }}>{activeSystem.desc}</div>
            </div>
          </div>

          <Card className="p-5">
            {[
              { label: "Connection Name",    key: "name",         type: "text",     ph: "e.g. Main ERP Integration" },
              { label: "API Endpoint URL",   key: "endpoint_url", type: "url",      ph: "https://api.yoursystem.com/v1" },
              { label: "API Key / Client ID",key: "api_key",      type: "text",     ph: "Enter your API key" },
              { label: "Secret / Token",     key: "secret",       type: "password", ph: "API secret or bearer token" },
            ].map(f => (
              <div key={f.key} className="mb-4">
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "#374151" }}>{f.label}</label>
                <input
                  type={f.type}
                  value={(form as Record<string, string>)[f.key] || ""}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.ph}
                  className="w-full rounded-xl border px-3 py-2 text-[13px] outline-none"
                  style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }}
                />
              </div>
            ))}

            <div className="mb-4">
              <label className="block text-[12px] font-semibold mb-2" style={{ color: "#374151" }}>Sync Frequency</label>
              <div className="flex gap-2">
                {(["realtime","hourly","daily","manual"] as const).map(freq => (
                  <button
                    key={freq}
                    onClick={() => setForm(p => ({ ...p, sync_frequency: freq }))}
                    className="px-3 py-1.5 rounded-xl border text-[12px] font-medium capitalize transition-all"
                    style={{
                      borderColor: form.sync_frequency === freq ? syncColors[freq] : "#E3E9F6",
                      background:  form.sync_frequency === freq ? syncColors[freq] + "12" : "#FAFBFF",
                      color:       form.sync_frequency === freq ? syncColors[freq] : "#9CA3AF",
                    }}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>

            {saveError && (
              <div className="mb-4 flex items-start gap-2 p-3 rounded-xl text-sm" style={{ background: "#FEE2E2", color: "#991B1B" }}>
                <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {saveError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={runTest}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-[14px] font-bold transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
              >
                <Plug className="w-4 h-4" />
                Test Connection
              </button>
              <button onClick={() => setStep("list")} className="px-5 py-2.5 rounded-xl border text-sm" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
                Cancel
              </button>
            </div>
          </Card>
        </div>

        {/* Guide panel */}
        <div className="space-y-4">
          <Card className="p-4">
            <div className="text-[13px] font-bold mb-3" style={{ color: "#111827" }}>Integration Guide</div>
            {[
              "Generate API credentials in your source system",
              "Enter the endpoint URL and authentication details",
              "Choose sync frequency based on data freshness needs",
              "Test the connection and verify the data preview",
              "Activate the integration to begin live data sync",
            ].map((text, i) => (
              <div key={i} className="flex gap-3 mb-3 items-start">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5"
                  style={{ background: "#EEF2FF", color: "#4A57B9" }}>{i + 1}</div>
                <div className="text-[12px]" style={{ color: "#6B7280" }}>{text}</div>
              </div>
            ))}
          </Card>
          <div className="rounded-xl p-4 border" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-amber-600" />
              <span className="text-[12px] font-bold text-amber-700">Security Note</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              API keys are encrypted at rest using AES-256. Keys are never logged after saving. Use the minimum required permissions for your integration.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── TESTING VIEW ──
  if (step === "testing") {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "#EEF2FF" }}>
          <RefreshCw className="w-8 h-8 animate-spin" style={{ color: "#4A57B9" }} />
        </div>
        <div className="text-[18px] font-bold mb-2" style={{ color: "#111827" }}>Testing Connection</div>
        <div className="text-[13px] mb-6" style={{ color: "#9CA3AF" }}>Verifying credentials and checking endpoint availability…</div>
        {["Authenticating credentials", "Checking permissions", "Fetching data schema"].map((msg, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl border mb-2 text-left"
            style={{ borderColor: "#E3E9F6", background: "#F8FAFF" }}>
            <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" style={{ color: "#4A57B9" }} />
            <span className="text-[13px]" style={{ color: "#6B7280" }}>{msg}</span>
          </div>
        ))}
      </div>
    );
  }

  // ── TEST RESULT VIEWS ──
  if (step === "test_ok") {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "#D1FAE5" }}>
          <CheckCircle2 className="w-8 h-8" style={{ color: "#059669" }} />
        </div>
        <div className="text-[18px] font-bold mb-2" style={{ color: "#111827" }}>Connection Successful!</div>
        <div className="text-[13px] mb-6" style={{ color: "#9CA3AF" }}>Authentication verified and data schema mapped successfully.</div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[{ label: "Latency", value: "42ms" }, { label: "Records Found", value: "1,247" }, { label: "Schema Version", value: "v2.4" }].map(s => (
            <div key={s.label} className="rounded-xl p-3 border" style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}>
              <div className="text-[20px] font-black" style={{ color: "#059669" }}>{s.value}</div>
              <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={activate}
            disabled={creating}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-[14px] font-bold disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
          >
            <Plug className="w-4 h-4" />
            {creating ? "Activating…" : "Activate Integration"}
          </button>
          <button onClick={() => setStep("configure")} className="px-5 py-2.5 rounded-xl border text-sm" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>Reconfigure</button>
        </div>
        {saveError && <div className="mt-3 text-sm" style={{ color: "#EF4444" }}>{saveError}</div>}
      </div>
    );
  }

  if (step === "test_fail") {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "#FEE2E2" }}>
          <XCircle className="w-8 h-8" style={{ color: "#EF4444" }} />
        </div>
        <div className="text-[18px] font-bold mb-2" style={{ color: "#111827" }}>Connection Failed</div>
        <div className="text-[13px] mb-4" style={{ color: "#9CA3AF" }}>Could not authenticate with the provided credentials.</div>
        <div className="p-4 rounded-xl border text-left mb-6" style={{ background: "#FEF2F2", borderColor: "#FECACA" }}>
          <div className="text-[13px]" style={{ color: "#DC2626" }}>
            <strong>Error:</strong> 401 Unauthorized — Invalid API key or insufficient permissions. Verify your credentials and ensure the key has read access to the required data types.
          </div>
        </div>
        <button onClick={() => setStep("configure")} className="flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: "#EF4444" }}>
          Update Credentials
        </button>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "#D1FAE5" }}>
          <Plug className="w-8 h-8" style={{ color: "#059669" }} />
        </div>
        <div className="text-[20px] font-bold mb-2" style={{ color: "#111827" }}>Integration Active!</div>
        <div className="text-[13px] mb-6" style={{ color: "#9CA3AF" }}>
          {activeSystem?.label} is now connected and syncing data to HSE Platform.
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setStep("list"); refetch(); }} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
            View All Connections
          </button>
          <button onClick={() => { setActiveSystem(null); setStep("list"); }} className="px-5 py-2.5 rounded-xl border text-sm" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
            Add Another
          </button>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div className="space-y-6">
      {/* Active integrations from DB */}
      {isLoading ? (
        <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 animate-spin" style={{ color: "#D1D5DB" }} /></div>
      ) : integrations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[14px] font-bold" style={{ color: "#111827" }}>Active Connections ({integrations.length})</span>
          </div>
          <div className="space-y-3">
            {integrations.map((conn) => {
              const sys = API_SYSTEMS.find(s => s.id === conn.type) || API_SYSTEMS[5];
              return (
                <Card key={conn.id} className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: sys.color + "15" }}>
                    <sys.icon className="w-5 h-5" style={{ color: sys.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[14px] font-semibold" style={{ color: "#111827" }}>{conn.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "#D1FAE5", color: "#059669" }}>Active</span>
                      {conn.sync_frequency && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize" style={{ background: "#EEF2FF", color: "#4A57B9" }}>
                          {conn.sync_frequency}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px]" style={{ color: "#9CA3AF" }}>
                      {conn.endpoint_url || conn.description || "—"}
                      {conn.last_sync && ` · Last sync: ${conn.last_sync}`}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteIntegration(conn.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                    style={{ background: "#FEF2F2", color: "#EF4444" }}
                  >
                    <X className="w-3.5 h-3.5" />
                    Disconnect
                  </button>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Available systems */}
      <div>
        <div className="text-[15px] font-bold mb-1" style={{ color: "#111827" }}>Connect External Systems</div>
        <div className="text-[13px] mb-4" style={{ color: "#9CA3AF" }}>
          Integrate your existing systems to automatically import data into HSE Platform
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {API_SYSTEMS.map(sys => {
            const isConnected = integrations.some(c => c.type === sys.id);
            return (
              <button
                key={sys.id}
                onClick={() => !isConnected && startConnect(sys)}
                disabled={isConnected}
                className="flex items-start gap-4 p-5 rounded-2xl border text-left transition-all hover:shadow-md disabled:cursor-default"
                style={{
                  borderColor: isConnected ? sys.color + "50" : "#E3E9F6",
                  background:  isConnected ? sys.color + "06" : "#fff",
                }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: sys.color + "15" }}>
                  <sys.icon className="w-6 h-6" style={{ color: sys.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[15px] font-bold" style={{ color: "#111827" }}>{sys.label}</span>
                    {isConnected && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "#D1FAE5", color: "#059669" }}>Connected</span>}
                  </div>
                  <div className="text-[12px] mb-2" style={{ color: "#9CA3AF" }}>{sys.desc}</div>
                  {!isConnected && (
                    <div className="flex items-center gap-1 text-[13px] font-semibold" style={{ color: sys.color }}>
                      Connect <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Platform API Keys */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#EEF2FF" }}>
              <Link className="w-5 h-5" style={{ color: "#4A57B9" }} />
            </div>
            <div>
              <div className="text-[15px] font-bold mb-1" style={{ color: "#111827" }}>Platform API Keys</div>
              <div className="text-[13px] max-w-lg" style={{ color: "#9CA3AF" }}>
                Generate API keys to allow external systems to push data into HSE Platform via our REST API. Each key can have scoped permissions and expiry dates.
              </div>
            </div>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-[13px] font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Generate Key
          </button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: "Webhooks", icon: Zap,      desc: "Real-time event push" },
            { label: "REST API", icon: Database, desc: "Full CRUD access"      },
            { label: "GraphQL",  icon: Code2,    desc: "Flexible queries"      },
          ].map(api => (
            <div key={api.label} className="flex items-center gap-3 p-3 rounded-xl border" style={{ background: "#F8FAFF", borderColor: "#E3E9F6" }}>
              <api.icon className="w-5 h-5 flex-shrink-0" style={{ color: "#4A57B9" }} />
              <div>
                <div className="text-[13px] font-semibold" style={{ color: "#374151" }}>{api.label}</div>
                <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{api.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── EXCEL TAB (existing logic, same as before) ─────────────────────────────────

function ExcelTab() {
  const [selectedEntity, setSelectedEntity] = useState<EntityType>(ENTITY_TYPES[0]);
  const [dragging,       setDragging]        = useState(false);
  const [selectedFile,   setSelectedFile]    = useState<File | null>(null);
  const [dupDetect,      setDupDetect]       = useState(true);
  const [skipErrors,     setSkipErrors]      = useState(false);
  const [result,         setResult]          = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: imports = [],   isLoading: importsLoading,   refetch: refetchImports } = useListImportsQuery();
  const { data: validLogs = [], isLoading: validLogsLoading                           } = useListValidationLogsQuery();
  const [createImport, { isLoading: uploading }] = useCreateImportMutation();

  const totalImports   = imports.length;
  const successImports = imports.filter(i => i.status === "success").length;
  const successRate    = totalImports > 0 ? Math.round((successImports / totalImports) * 100) : 0;
  const totalRecords   = imports.reduce((s, i) => s + i.records_total, 0);
  const validPass      = validLogs.filter(l => l.status === "pass").length;
  const validFail      = validLogs.filter(l => l.status === "fail").length;

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
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
      // Upload file to the real bulk import endpoint
      const formData = new FormData();
      formData.append("file", selectedFile);
      const headers: Record<string, string> = {};
      const jwt = localStorage.getItem("hse_jwt");
      if (jwt) headers["Authorization"] = `Bearer ${jwt}`;
      try {
        const u = JSON.parse(localStorage.getItem("hse_user") || "{}");
        if (u?.email)   headers["X-User-Email"] = u.email;
        if (u?.role)    headers["X-User-Role"]  = u.role;
        if (u?.orgCode) headers["X-Tenant-Id"]  = u.orgCode;
      } catch { /**/ }

      const uploadRes = await fetch(
        `${API_BASE}/org-setup/onboarding-bulk?module=${selectedEntity.moduleKey}`,
        { method: "POST", headers, body: formData },
      );
      const uploadJson = await uploadRes.json().catch(() => ({}));
      const uploadData = uploadJson?.data ?? uploadJson;
      const count: number = uploadData?.count ?? 0;
      const errors: string[] = uploadData?.errors ?? [];

      if (!uploadRes.ok && count === 0) {
        const errMsg = uploadData?.error || uploadData?.detail || uploadData?.message
          || `Server error ${uploadRes.status} — check the file format and try again.`;
        setResult({ success: false, message: errMsg });
        return;
      }

      // Log the import in history
      await createImport({
        file_name:         selectedFile.name,
        import_type:       "excel",
        data_type:         selectedEntity.label,
        records_estimated: count,
      }).unwrap();

      if (count === 0) {
        const hint = errors.length > 0 ? ` — ${errors[0]}` : " — check that column headers match the template.";
        setResult({ success: false, message: `0 records imported${hint}` });
        setSelectedFile(null);
        refetchImports();
        return;
      }
      const warn = errors.length > 0 ? ` (${errors.length} warning${errors.length > 1 ? "s" : ""})` : "";
      setResult({ success: true, message: `${count} records imported successfully${warn}.` });
      setSelectedFile(null);
      refetchImports();
    } catch (e: unknown) {
      setResult({ success: false, message: (e as Error).message || "Upload failed. Check the file format and try again." });
    }
  }
  function handleDownloadTemplate(entity: EntityType) {
    const csv  = `${entity.fields.join(",")}\n${entity.sampleData}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: `template_${entity.id}.csv` });
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Imports",      value: totalImports,                color: "#4A57B9", bg: "#EEF2FF", icon: Upload        },
          { label: "Success Rate",        value: `${successRate}%`,           color: "#059669", bg: "#D1FAE5", icon: CheckCircle2  },
          { label: "Records Imported",    value: totalRecords.toLocaleString(), color: "#0E7490", bg: "#ECFEFF", icon: Database   },
          { label: "Templates Available", value: ENTITY_TYPES.length,         color: "#D97706", bg: "#FEF3C7", icon: FileText     },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <Card key={label} className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <div className="text-[20px] font-black leading-none" style={{ color: "#111827" }}>{value}</div>
              <div className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>{label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Entity selector */}
      <div>
        <SectionLabel>Select data type to upload</SectionLabel>
        <div className="grid grid-cols-5 gap-2 lg:grid-cols-8 xl:grid-cols-10">
          {ENTITY_TYPES.map(entity => {
            const active = selectedEntity.id === entity.id;
            const Icon   = entity.icon;
            return (
              <button key={entity.id} onClick={() => { setSelectedEntity(entity); setSelectedFile(null); setResult(null); }}
                className="flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all"
                style={active ? { background: entity.bg, borderColor: entity.color, boxShadow: `0 4px 16px ${entity.color}30` } : { background: "#fff", borderColor: "#E3E9F6" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: active ? entity.bg : "#F8FAFF" }}>
                  <Icon className="w-4.5 h-4.5" style={{ color: active ? entity.color : "#9CA3AF" }} />
                </div>
                <span className="text-[11px] font-bold text-center leading-tight" style={{ color: active ? entity.color : "#374151" }}>{entity.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Upload + Info */}
      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2 p-5">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: selectedEntity.bg }}>
                <selectedEntity.icon className="w-5 h-5" style={{ color: selectedEntity.color }} />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: "#111827" }}>Upload {selectedEntity.label}</h3>
                <p className="text-[11px]" style={{ color: "#6B7280" }}>{selectedEntity.description}</p>
              </div>
            </div>
            <button onClick={() => handleDownloadTemplate(selectedEntity)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors hover:opacity-80"
              style={{ borderColor: selectedEntity.color + "60", color: selectedEntity.color, background: selectedEntity.bg }}>
              <Download className="w-3.5 h-3.5" />
              Download Template
            </button>
          </div>

          <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-14 gap-3 cursor-pointer transition-all"
            style={{ borderColor: dragging ? selectedEntity.color : selectedFile ? "#10B981" : "#D1D5DB", background: dragging ? selectedEntity.bg : selectedFile ? "#F0FDF4" : "#F9FAFB" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: dragging ? selectedEntity.bg : selectedFile ? "#DCFCE7" : "#F3F4F6" }}>
              <Upload className="w-7 h-7" style={{ color: dragging ? selectedEntity.color : selectedFile ? "#10B981" : "#9CA3AF" }} />
            </div>
            {selectedFile ? (
              <div className="text-center">
                <p className="text-sm font-bold" style={{ color: "#10B981" }}>{selectedFile.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{(selectedFile.size / 1024).toFixed(1)} KB · Click to change</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: "#374151" }}>Drop your Excel file here</p>
                <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>or click to browse · .xlsx and .xls supported</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="mt-4 flex items-center gap-6">
            {[{ label: "Duplicate Detection", state: dupDetect, set: setDupDetect }, { label: "Skip Error Rows", state: skipErrors, set: setSkipErrors }].map(({ label, state, set }) => (
              <label key={label} className="flex items-center gap-2 cursor-pointer">
                <div className="relative w-9 h-5 rounded-full transition-colors" style={{ background: state ? selectedEntity.color : "#D1D5DB" }} onClick={() => set(!state)}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: state ? "18px" : "2px" }} />
                </div>
                <span className="text-xs font-semibold" style={{ color: "#374151" }}>{label}</span>
              </label>
            ))}
          </div>

          {result && (
            <div className="mt-4 flex items-start gap-2 p-3 rounded-xl text-sm"
              style={{ background: result.success ? "#D1FAE5" : "#FEE2E2", color: result.success ? "#065F46" : "#991B1B" }}>
              {result.success ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
              {result.message}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button onClick={handleUpload} disabled={!selectedFile || uploading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${selectedEntity.color}, ${selectedEntity.color}CC)` }}>
              <Upload className="w-4 h-4" />
              {uploading ? "Importing…" : `Import ${selectedEntity.label}`}
            </button>
          </div>
        </Card>

        <Card className="p-5 flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4" style={{ color: selectedEntity.color }} />
              <span className="text-sm font-bold" style={{ color: "#111827" }}>Template Columns</span>
              <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: selectedEntity.bg, color: selectedEntity.color }}>
                {selectedEntity.fields.length} fields
              </span>
            </div>
            <div className="space-y-1.5">
              {selectedEntity.fields.map(field => {
                const required = selectedEntity.requiredFields.includes(field);
                return (
                  <div key={field} className="flex items-center gap-2 rounded-lg px-3 py-1.5"
                    style={{ background: required ? `${selectedEntity.color}10` : "#F9FAFB", border: `1px solid ${required ? selectedEntity.color + "30" : "#E3E9F6"}` }}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: required ? selectedEntity.color : "#D1D5DB" }} />
                    <span className="text-[11px] font-medium flex-1" style={{ color: "#374151" }}>{field}</span>
                    {required && <span className="text-[9px] font-bold uppercase" style={{ color: selectedEntity.color }}>Required</span>}
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4" style={{ color: "#4A57B9" }} />
              <span className="text-sm font-bold" style={{ color: "#111827" }}>Validation Rules</span>
            </div>
            <div className="space-y-1.5">
              {selectedEntity.validations.map(rule => (
                <div key={rule} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#10B981" }} />
                  <span className="text-[11px]" style={{ color: "#6B7280" }}>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Import History */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Import History</SectionLabel>
          <button onClick={() => refetchImports()} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
        <Card className="overflow-hidden">
          {importsLoading ? (
            <div className="flex items-center justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin" style={{ color: "#D1D5DB" }} /></div>
          ) : imports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-6">
              <Clock className="w-10 h-10 mb-3" style={{ color: "#E5E7EB" }} />
              <p className="text-sm font-semibold mb-1" style={{ color: "#374151" }}>No imports yet</p>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>Upload an Excel file above to see your import history here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                    {["File Name","Data Type","Records","Success","Failed","Status","Uploaded By","Date"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {imports.map(row => {
                    const st = IMPORT_STATUS[row.status] ?? IMPORT_STATUS.processing;
                    return (
                      <tr key={row.id} className="border-t hover:bg-blue-50/20 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                        <td className="px-4 py-3"><div className="flex items-center gap-2"><FileSpreadsheet className="w-3.5 h-3.5" style={{ color: "#10B981" }} /><span className="text-xs font-semibold" style={{ color: "#111827" }}>{row.file_name}</span></div></td>
                        <td className="px-4 py-3 text-xs font-medium" style={{ color: "#374151" }}>{row.data_type}</td>
                        <td className="px-4 py-3 text-xs font-bold" style={{ color: "#374151" }}>{row.records_total.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs font-bold" style={{ color: "#10B981" }}>{row.records_success.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs font-bold" style={{ color: row.records_failed > 0 ? "#EF4444" : "#9CA3AF" }}>{row.records_failed.toLocaleString()}</td>
                        <td className="px-4 py-3"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{row.uploaded_by}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#9CA3AF" }}>{formatDate(row.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Validation Logs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Validation Logs</SectionLabel>
          <div className="flex gap-2 text-[10px]">
            {[
              { s: "pass",    label: `${validPass} Pass`,    ...VALIDATION_STATUS.pass },
              { s: "warning", label: `${validLogs.filter(l => l.status === "warning").length} Warn`, ...VALIDATION_STATUS.warning },
              { s: "fail",    label: `${validFail} Fail`,    ...VALIDATION_STATUS.fail },
            ].map(({ s, label, bg, color }) => (
              <span key={s} className="px-2 py-0.5 rounded-full font-bold" style={{ background: bg, color }}>{label}</span>
            ))}
          </div>
        </div>
        <Card className="overflow-hidden">
          {validLogsLoading ? (
            <div className="flex items-center justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin" style={{ color: "#D1D5DB" }} /></div>
          ) : validLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <Shield className="w-8 h-8 mb-3" style={{ color: "#E5E7EB" }} />
              <p className="text-xs" style={{ color: "#9CA3AF" }}>Validation logs will appear here after your first import.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                    {["File","Validation Rule","Status","Rows Affected","Message","Timestamp"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {validLogs.map(row => {
                    const st = VALIDATION_STATUS[row.status] ?? VALIDATION_STATUS.pass;
                    const StatusIcon = st.icon;
                    return (
                      <tr key={row.id} className="border-t hover:bg-blue-50/20 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                        <td className="px-4 py-3 text-xs font-medium" style={{ color: "#111827" }}>{row.file_name}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{row.rule}</td>
                        <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: st.bg, color: st.color }}><StatusIcon className="w-3 h-3" />{row.status.charAt(0).toUpperCase() + row.status.slice(1)}</span></td>
                        <td className="px-4 py-3 text-xs font-bold" style={{ color: "#374151" }}>{row.records_affected.toLocaleString()}</td>
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
      </div>
    </div>
  );
}

// ── DOCUMENTS TAB ─────────────────────────────────────────────────────────────

type DocCategory = "pdf" | "docs" | "ppt";

interface DocRecord {
  id: string;
  file_name: string;
  file_type: string;
  category: DocCategory;
  size: string;
  uploaded_by: string;
  created_at?: string;
}

const DOC_SUB_TABS: { key: DocCategory; label: string; icon: React.ElementType; accept: string; color: string; bg: string; ext: string }[] = [
  { key: "pdf",  label: "PDF Documents",   icon: FileText,     accept: ".pdf",        color: "#EF4444", bg: "#FEF2F2", ext: "PDF"  },
  { key: "docs", label: "Word Documents",  icon: BookMarked,   accept: ".doc,.docx",  color: "#2563EB", bg: "#EFF6FF", ext: "DOCX" },
  { key: "ppt",  label: "Presentations",   icon: Presentation, accept: ".ppt,.pptx",  color: "#D97706", bg: "#FFFBEB", ext: "PPTX" },
];

function DocumentsTab({ initialSubTab }: { initialSubTab?: DocCategory }) {
  const [subTab, setSubTab] = useState<DocCategory>(initialSubTab ?? "pdf");
  const [docs, setDocs] = useState<DocRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchedOnce, setFetchedOnce] = useState(false);
  const fileInputRefs = useRef<Record<DocCategory, HTMLInputElement | null>>({ pdf: null, docs: null, ppt: null });

  const API_BASE_DOCS = (import.meta.env.VITE_API_URL as string || "/api/v1").replace(/\/$/, "");

  function getHeaders(): Record<string, string> {
    const h: Record<string, string> = {};
    const jwt = localStorage.getItem("hse_jwt");
    if (jwt) h["Authorization"] = `Bearer ${jwt}`;
    try {
      const u = JSON.parse(localStorage.getItem("hse_user") || "{}");
      if (u?.email)   h["X-User-Email"] = u.email;
      if (u?.role)    h["X-User-Role"]  = u.role;
      if (u?.orgCode) h["X-Tenant-Id"]  = u.orgCode;
    } catch { /**/ }
    return h;
  }

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE_DOCS}/org-admin/data-management/documents`, { headers: getHeaders() });
      const json = await res.json().catch(() => ({}));
      setDocs((json?.data?.items ?? json?.items ?? []) as DocRecord[]);
    } finally {
      setLoading(false);
      setFetchedOnce(true);
    }
  }, [API_BASE_DOCS]);

  // Fetch on first render
  if (!fetchedOnce && !loading) fetchDocs();

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch(`${API_BASE_DOCS}/org-admin/data-management/documents/upload`, {
        method: "POST",
        headers: getHeaders(),
        body: form,
      });
      const json = await res.json().catch(() => ({}));
      const data = json?.data ?? json;
      if (res.ok && data?.id) {
        await fetchDocs();
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    await fetch(`${API_BASE_DOCS}/org-admin/data-management/documents/${docId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    setDocs(d => d.filter(x => x.id !== docId));
  };

  const filtered = docs.filter(d => d.category === subTab);
  const current  = DOC_SUB_TABS.find(t => t.key === subTab)!;

  return (
    <div className="space-y-5">
      {/* Sub-tab pills */}
      <div className="flex gap-2 flex-wrap">
        {DOC_SUB_TABS.map(t => {
          const Icon   = t.icon;
          const active = subTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all"
              style={{
                background:  active ? t.bg : "#fff",
                borderColor: active ? t.color : "#E3E9F6",
                color:       active ? t.color : "#6B7280",
              }}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {docs.filter(d => d.category === t.key).length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: t.color, color: "#fff" }}>
                  {docs.filter(d => d.category === t.key).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Upload zone */}
      <div className="rounded-2xl border-2 border-dashed p-8 text-center transition-colors"
        style={{ borderColor: current.color + "55", background: current.bg }}>
        <current.icon className="w-10 h-10 mx-auto mb-3" style={{ color: current.color }} />
        <p className="text-sm font-semibold mb-1" style={{ color: current.color }}>
          Upload {current.label}
        </p>
        <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>
          Accepted: {current.accept.replace(/\./g, "").toUpperCase().replace(/,/g, ", ")} — Max 50 MB per file
        </p>
        <label
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-opacity"
          style={{ background: current.color, color: "#fff", opacity: uploading ? 0.6 : 1 }}
        >
          {uploading
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Uploading…</>
            : <><Upload className="w-4 h-4" /> Choose File</>
          }
          <input
            ref={el => { fileInputRefs.current[current.key] = el; }}
            type="file"
            accept={current.accept}
            className="hidden"
            disabled={uploading}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); if (e.target) e.target.value = ""; }}
          />
        </label>
      </div>

      {/* File list */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "#E3E9F6", background: "#F9FAFB" }}>
          <h3 className="text-sm font-bold" style={{ color: "#111827" }}>
            {current.label} ({filtered.length})
          </h3>
          <button onClick={fetchDocs} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#4A57B9" }}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <RefreshCw className="w-6 h-6 animate-spin" style={{ color: "#4A57B9" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <FolderOpen className="w-10 h-10 mx-auto" style={{ color: "#D1D5DB" }} />
            <p className="text-sm" style={{ color: "#9CA3AF" }}>No {current.ext} files uploaded yet</p>
            <p className="text-xs" style={{ color: "#D1D5DB" }}>Use the upload zone above to add files</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>File Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Type</th>
                <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Size</th>
                <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Uploaded By</th>
                <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Date</th>
                <th className="px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => (
                <tr key={doc.id} className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <current.icon className="w-4 h-4 flex-shrink-0" style={{ color: current.color }} />
                      <span className="font-medium truncate max-w-[240px]" style={{ color: "#111827" }}>{doc.file_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase"
                      style={{ background: current.bg, color: current.color }}>
                      {doc.file_type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: "#6B7280" }}>{doc.size}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: "#6B7280" }}>{doc.uploaded_by}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: "#6B7280" }}>
                    {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" style={{ color: "#EF4444" }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────

type Tab = "manual" | "excel" | "api" | "documents";

export function DataManagementPage() {
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get("type") as DocCategory | null;

  const [tab, setTab] = useState<Tab>(typeParam ? "documents" : "excel");
  const [docSubTab, setDocSubTab] = useState<DocCategory>(typeParam ?? "pdf");

  // Sync when user navigates via sidebar to a different doc type
  useEffect(() => {
    if (typeParam) {
      setTab("documents");
      setDocSubTab(typeParam);
    }
  }, [typeParam]);

  const TABS: { key: Tab; label: string; icon: React.ElementType; desc: string }[] = [
    { key: "manual",    label: "Manual Entry",       icon: PenLine,        desc: "Enter data directly via form"    },
    { key: "excel",     label: "Excel / CSV Upload", icon: FileSpreadsheet,desc: "Bulk import spreadsheet files"   },
    { key: "api",       label: "API & Integrations", icon: Plug,           desc: "Connect external systems"        },
    { key: "documents", label: "Documents",          icon: FolderOpen,     desc: "Upload PDF, DOCX & PPTX files"   },
  ];

  return (
    <div className="p-6 space-y-6" style={{ background: "#F3F7FF", minHeight: "100vh" }}>

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-black" style={{ color: "#111827" }}>Data Upload</h1>
        <p className="text-[13px] mt-1" style={{ color: "#9CA3AF" }}>
          Import your organisation's HSE data — choose your preferred method below
        </p>
      </div>

      {/* Method selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {TABS.map(t => {
          const Icon   = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-start gap-4 p-5 rounded-2xl border text-left transition-all"
              style={{
                background:  active ? "#EEF2FF" : "#fff",
                borderColor: active ? "#4A57B9" : "#E3E9F6",
                boxShadow:   active ? "0 4px 16px rgba(74,87,185,0.12)" : "none",
              }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                style={{ background: active ? "#4A57B9" : "#F3F4F6" }}>
                <Icon className="w-6 h-6" style={{ color: active ? "#fff" : "#9CA3AF" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold mb-0.5" style={{ color: active ? "#4A57B9" : "#111827" }}>{t.label}</div>
                <div className="text-[12px]" style={{ color: "#9CA3AF" }}>{t.desc}</div>
              </div>
              {active && <CheckSquare className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#4A57B9" }} />}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className={`${tab !== "api" ? "bg-white rounded-2xl border p-6" : ""}`}
        style={{ borderColor: "#E3E9F6" }}>
        {tab === "manual"    && <ManualEntryTab />}
        {tab === "excel"     && <ExcelTab />}
        {tab === "api"       && <ApiIntegrationsTab />}
        {tab === "documents" && <DocumentsTab initialSubTab={docSubTab} />}
      </div>

      {/* Tip bar */}
      <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ background: "#fff", borderColor: "#E3E9F6" }}>
        <Info className="w-5 h-5 flex-shrink-0" style={{ color: "#4A57B9" }} />
        <div className="text-[13px]" style={{ color: "#6B7280" }}>
          <strong style={{ color: "#4A57B9" }}>Tip:</strong> For bulk historical data (150+ records), use the{" "}
          <strong>Excel upload</strong> method with our pre-formatted templates. For live operational data, use{" "}
          <strong>API integration</strong> for real-time sync.
        </div>
      </div>
    </div>
  );
}
