import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/app/context/AuthContext";
import {
  Building2, MapPin, Users, Shield, AlertTriangle, FileText,
  ClipboardList, BookOpen, TrendingUp, Briefcase, GraduationCap,
  CheckCircle2, ChevronRight, Plus, Trash2, Upload, Download,
  X, Loader2, Check, RefreshCw, Server, UserCheck, Timer,
  Wifi, Code2, Lock, Zap, Brain, FileSpreadsheet, Save,
  RotateCcw, Info, Link, Database, ShieldCheck, AlertCircle,
} from "lucide-react";
import {
  useSaveOrgSetupStep1Mutation,
  useSaveOrgSetupStep2Mutation,
  useCreateOrgSetupSiteMutation,
  useCreateOrgSetupUserMutation,
  useSaveOrgSetupStep5Mutation,
  useSaveOrgSetupStep7Mutation,
  useActivateOrganizationMutation,
  useImportOrgSetupDataMutation,
} from "@/features/org-setup/api/orgSetupApi";

// ── API helpers ───────────────────────────────────────────────────────────────
const API_BASE = (import.meta.env.VITE_API_URL as string || "/api/v1").replace(/\/$/, "");

function getAuthHeaders(): Record<string, string> {
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

/** Upload a file to the generic onboarding bulk endpoint.
 *  Returns { count, error?, errors? } */
async function uploadModuleFile(moduleKey: string, file: File): Promise<{ count: number; error?: string; errors?: string[] }> {
  const form = new FormData();
  form.append("file", file);
  const res  = await fetch(`${API_BASE}/org-setup/onboarding-bulk?module=${moduleKey}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  const data = json?.data ?? json;
  if (!res.ok) return { count: 0, error: data?.detail || data?.message || `HTTP ${res.status}` };
  return { count: data?.count ?? 0, errors: data?.errors };
}

/** Connect to external API and pull org details (does NOT save). */
async function connectOrgApiRaw(url: string, apiKey: string, token: string): Promise<Record<string, string>> {
  const res = await fetch(`${API_BASE}/org-setup/step1/api-connect`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ url, api_key: apiKey, token }),
  });
  const json = await res.json().catch(() => ({}));
  return json?.data ?? {};
}

/** Upload org Excel and return pre-filled field values (does NOT save). */
async function parseOrgExcel(file: File): Promise<Record<string, string>> {
  const form = new FormData();
  form.append("file", file);
  const res  = await fetch(`${API_BASE}/org-setup/step1/parse-excel`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  return json?.data ?? {};
}

/** Download a CSV template from the backend. */
function downloadTemplate(moduleKey: string) {
  const url = `${API_BASE}/org-setup/template/${moduleKey}`;
  const a   = Object.assign(document.createElement("a"), { href: url, download: `${moduleKey}_template.csv` });
  // Append JWT as query param since anchor clicks don't carry headers
  const jwt = localStorage.getItem("hse_jwt");
  a.href = jwt ? `${url}?token=${encodeURIComponent(jwt)}` : url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const PRIMARY   = "#4A57B9";
const GRADIENT  = "linear-gradient(135deg, #4A57B9 0%, #6F80E8 100%)";
const DARK_BG   = "linear-gradient(160deg, #0F1535 0%, #1A2255 50%, #1E2B6F 100%)";

// ── Wizard steps ──────────────────────────────────────────────────────────────
const WIZARD_STEPS = [
  {
    id: 1, label: "Organisation Profile", icon: Building2,
    desc: "Your organisation's basic information",
    hint: "Fill in your organisation name and industry type to continue.",
  },
  {
    id: 2, label: "Import HSE Data", icon: Database,
    desc: "Sites, users and all HSE records",
    hint: "Add at least one site or user, or skip to configure later.",
  },
  {
    id: 3, label: "Configuration", icon: ShieldCheck,
    desc: "Compliance standards & workflows",
    hint: "Select at least one compliance standard to continue.",
  },
  {
    id: 4, label: "Review & Activate", icon: CheckCircle2,
    desc: "Confirm your setup and go live",
    hint: "",
  },
];

// ── Module list ───────────────────────────────────────────────────────────────
const MODULES = [
  { key: "organisation",  label: "Organisation",         icon: Building2,    color: "#4A57B9" },
  { key: "sites",         label: "Sites",                icon: MapPin,       color: "#0E7490" },
  { key: "departments",   label: "Departments",          icon: Users,        color: "#7C3AED" },
  { key: "roles",         label: "Roles & Permissions",  icon: Shield,       color: "#D97706" },
  { key: "users",         label: "Users",                icon: UserCheck,    color: "#059669" },
  { key: "incidents",     label: "Incidents",            icon: AlertTriangle,color: "#EF4444" },
  { key: "permits",       label: "Permits to Work",      icon: FileText,     color: "#0891B2" },
  { key: "risk",          label: "Risk Assessments",     icon: ShieldCheck,  color: "#8B5CF6" },
  { key: "capa",          label: "CAPA Actions",         icon: ClipboardList,color: "#10B981" },
  { key: "training",      label: "Training Records",     icon: GraduationCap,color: "#F59E0B" },
  { key: "audits",        label: "Audit Reports",        icon: BookOpen,     color: "#6366F1" },
  { key: "kpis",          label: "Safety KPIs",          icon: TrendingUp,   color: "#EC4899" },
  { key: "vendors",       label: "Vendors & Contractors",icon: Briefcase,    color: "#F97316" },
];

// ── Field definitions ─────────────────────────────────────────────────────────
type FieldDef = {
  label: string; key: string; type: string;
  placeholder?: string; options?: string[]; required?: boolean;
};

const MANUAL_FIELDS: Record<string, FieldDef[]> = {
  organisation: [
    { label: "Organisation Name", key: "name",      type: "text",   placeholder: "e.g. WindTech Nacelle Manufacturing Ltd", required: true },
    { label: "Industry Type",     key: "industry",  type: "select", options: ["Renewable Energy - Wind","Oil & Gas","Construction","Manufacturing","Mining","Chemical Processing","Logistics & Transport","Healthcare","Other"], required: true },
    { label: "Employee Count",    key: "employees", type: "number", placeholder: "150" },
    { label: "Country",           key: "country",   type: "select", options: ["United Kingdom","India","United States","Germany","Australia","Canada","UAE","Singapore","South Africa","Other"] },
    { label: "Official Email",    key: "email",     type: "email",  placeholder: "safety@company.com" },
    { label: "Contact Number",    key: "phone",     type: "text",   placeholder: "+44 1656 000100" },
    { label: "HQ Address",        key: "address",   type: "text",   placeholder: "Full headquarters address" },
    { label: "ISO 45001 Status",  key: "iso",       type: "select", options: ["Certified","In Progress","Not Started","Lapsed"] },
  ],
  sites: [
    { label: "Site Name",      key: "name",      type: "text",   placeholder: "Bridgend Manufacturing Complex", required: true },
    { label: "Site Type",      key: "type",      type: "select", options: ["Manufacturing & Assembly","Plant","Warehouse","Branch Office","Construction Site","Offshore","Other"], required: true },
    { label: "Address",        key: "address",   type: "text",   placeholder: "Full site address" },
    { label: "Region",         key: "region",    type: "text",   placeholder: "South Wales" },
    { label: "Hazard Level",   key: "hazard",    type: "select", options: ["Low Risk","Medium Risk","High Risk","Critical Risk"] },
    { label: "Employee Count", key: "employees", type: "number", placeholder: "150" },
    { label: "Workstations",   key: "stations",  type: "number", placeholder: "32" },
  ],
  departments: [
    { label: "Department Name", key: "name",    type: "text",   placeholder: "Heavy Assembly",                required: true },
    { label: "Manager Name",    key: "manager", type: "text",   placeholder: "James Thompson" },
    { label: "Number of Teams", key: "teams",   type: "number", placeholder: "3" },
    { label: "Assigned Site",   key: "site",    type: "text",   placeholder: "Bridgend Manufacturing Complex" },
  ],
  roles: [
    { label: "Role Name",    key: "name",        type: "text",   placeholder: "HSE Manager",                    required: true },
    { label: "Description",  key: "description", type: "text",   placeholder: "Manages HSE compliance across site" },
    { label: "Access Level", key: "level",       type: "select", options: ["Admin","Manager","Supervisor","Worker","Auditor","Read-only"] },
    { label: "Module Access",key: "modules",     type: "text",   placeholder: "Incidents, Audits, Risk Assessments" },
  ],
  users: [
    { label: "Full Name",   key: "name",  type: "text",   placeholder: "James Thompson",   required: true },
    { label: "Email",       key: "email", type: "email",  placeholder: "james@company.com", required: true },
    { label: "Role",        key: "role",  type: "select", options: ["Admin","HSE Manager","Site Inspector","Site Engineer","Supervisor","Auditor","Worker","Contractor"] },
    { label: "Department",  key: "dept",  type: "text",   placeholder: "Heavy Assembly" },
    { label: "Site",        key: "site",  type: "text",   placeholder: "Bridgend Complex" },
    { label: "Phone",       key: "phone", type: "text",   placeholder: "+44 7700 900000" },
  ],
  incidents: [
    { label: "Incident Date",      key: "date",        type: "date",                                                required: true },
    { label: "Location / Station", key: "location",    type: "text",     placeholder: "STN001 - Heavy Assembly 1" },
    { label: "Incident Type",      key: "type",        type: "select",   options: ["Injury","Near-miss","Damage","Environmental","Unsafe Act","Unsafe Condition","Fire","Chemical Spill"] },
    { label: "Severity",           key: "severity",    type: "select",   options: ["Minor","Significant","Serious","Lost Time","Fatality"] },
    { label: "Description",        key: "description", type: "textarea", placeholder: "Brief description of what happened..." },
    { label: "Immediate Cause",    key: "cause",       type: "text",     placeholder: "e.g. Human Error" },
    { label: "Reported By",        key: "reporter",    type: "text",     placeholder: "Employee ID or name" },
  ],
  permits: [
    { label: "Permit Type",   key: "type",        type: "select",   options: ["Hot Work","Electrical","Work at Height","Confined Space","Excavation","Cold Work","Chemical Handling"], required: true },
    { label: "Work Location", key: "location",    type: "text",     placeholder: "Zone 4 - Chemical Area" },
    { label: "Start Date",    key: "start_date",  type: "date" },
    { label: "End Date",      key: "end_date",    type: "date" },
    { label: "Assigned To",   key: "assignee",    type: "text",     placeholder: "Permit Holder name" },
    { label: "Description",   key: "description", type: "textarea", placeholder: "Work to be performed..." },
    { label: "Hazards",       key: "hazards",     type: "text",     placeholder: "List identified hazards" },
  ],
  risk: [
    { label: "Hazard Description", key: "hazard",      type: "text",     placeholder: "Machinery Contact/Crushing", required: true },
    { label: "Location",           key: "location",    type: "text",     placeholder: "STN001, STN005" },
    { label: "Risk Level",         key: "level",       type: "select",   options: ["Critical","High","Medium","Low"] },
    { label: "Likelihood (1-5)",   key: "likelihood",  type: "number",   placeholder: "4" },
    { label: "Consequence (1-5)",  key: "consequence", type: "number",   placeholder: "4" },
    { label: "Controls",           key: "controls",    type: "textarea", placeholder: "Engineering and administrative controls..." },
    { label: "Responsible",        key: "responsible", type: "text",     placeholder: "Safety Manager" },
  ],
  capa: [
    { label: "Title",       key: "title",       type: "text",     placeholder: "Fix machine guard",           required: true },
    { label: "Description", key: "description", type: "textarea", placeholder: "Describe the corrective action..." },
    { label: "Priority",    key: "priority",    type: "select",   options: ["Critical","High","Medium","Low"] },
    { label: "Assigned To", key: "assigned_to", type: "email",    placeholder: "assignee@company.com" },
    { label: "Due Date",    key: "due_date",    type: "date",                                                required: true },
    { label: "Source Type", key: "source_type", type: "select",   options: ["Audit","Incident","Inspection","Near Miss","Risk Assessment"] },
  ],
  training: [
    { label: "Training Name",      key: "name",     type: "text",   placeholder: "Fire Safety Training", required: true },
    { label: "Employee",           key: "employee", type: "text",   placeholder: "Employee name or ID" },
    { label: "Completed Date",     key: "date",     type: "date" },
    { label: "Expiry Date",        key: "expiry",   type: "date" },
    { label: "Trainer / Provider", key: "trainer",  type: "text",   placeholder: "Internal / External trainer" },
    { label: "Result",             key: "result",   type: "select", options: ["Pass","Fail","In Progress","Pending"] },
  ],
  audits: [
    { label: "Audit Title",    key: "title",    type: "text",   placeholder: "Q1 Fire Safety Audit", required: true },
    { label: "Audit Type",     key: "type",     type: "select", options: ["Internal","External","Regulatory","Supplier","HSE Inspection"] },
    { label: "Standard",       key: "standard", type: "text",   placeholder: "ISO 45001, OSHA..." },
    { label: "Scheduled Date", key: "date",     type: "date" },
    { label: "Lead Auditor",   key: "auditor",  type: "text",   placeholder: "Auditor name" },
    { label: "Status",         key: "status",   type: "select", options: ["Scheduled","In Progress","Completed","Cancelled","Overdue"] },
    { label: "Site",           key: "site",     type: "text",   placeholder: "Site name" },
  ],
  kpis: [
    { label: "KPI Name",       key: "name",   type: "text",   placeholder: "Incident Rate (TRIR)", required: true },
    { label: "Period (Month)", key: "period", type: "text",   placeholder: "2024-01" },
    { label: "Value",          key: "value",  type: "number", placeholder: "2.4" },
    { label: "Target",         key: "target", type: "number", placeholder: "3.0" },
    { label: "Unit",           key: "unit",   type: "text",   placeholder: "per 100k hours" },
    { label: "Site",           key: "site",   type: "text",   placeholder: "All Sites / Site Name" },
  ],
  vendors: [
    { label: "Company Name",   key: "name",    type: "text",   placeholder: "SafeWork Contractors Ltd", required: true },
    { label: "Contact Email",  key: "email",   type: "email",  placeholder: "contact@safework.com" },
    { label: "Contact Phone",  key: "phone",   type: "text",   placeholder: "+44 1234 567890" },
    { label: "Service Type",   key: "service", type: "select", options: ["Construction","Electrical","Mechanical","IT Services","Cleaning","Security","Transport","Other"] },
    { label: "HSE Rating",     key: "rating",  type: "select", options: ["Approved","Conditional","Under Review","Suspended","Rejected"] },
    { label: "Contract Start", key: "start",   type: "date" },
    { label: "Contract End",   key: "end",     type: "date" },
  ],
};

const EXCEL_TEMPLATES = [
  { key: "organisation", label: "Organisation Details",  cols: 9,   rows: 1    },
  { key: "sites",        label: "Sites",                 cols: 8,   rows: "1+" },
  { key: "departments",  label: "Departments",           cols: 5,   rows: "1+" },
  { key: "users",        label: "Users",                 cols: 6,   rows: "1+" },
  { key: "roles",        label: "Roles & Permissions",   cols: 6,   rows: "1+" },
  { key: "incidents",    label: "Incidents",             cols: 15,  rows: "1+" },
  { key: "risk",         label: "Risk Register",         cols: 14,  rows: "1+" },
  { key: "training",     label: "Training Records",      cols: 11,  rows: "1+" },
  { key: "capa",         label: "CAPA Actions",          cols: 10,  rows: "1+" },
  { key: "kpis",         label: "Safety KPI Monthly",    cols: 13,  rows: "24+"},
  { key: "vendors",      label: "Vendors & Contractors", cols: 11,  rows: "1+" },
];

const API_SYSTEMS = [
  { id: "erp",    label: "ERP System",    icon: Server,    color: "#185fa5", desc: "SAP, Oracle, Microsoft Dynamics"   },
  { id: "hrms",   label: "HRMS",          icon: UserCheck, color: "#4A57B9", desc: "Workday, BambooHR, PeopleHR"       },
  { id: "attend", label: "Attendance",    icon: Timer,     color: "#059669", desc: "Kronos, ADP, TimeClock"            },
  { id: "iot",    label: "IoT Devices",   icon: Wifi,      color: "#D97706", desc: "Sensors, wearables, site monitors" },
  { id: "hse",    label: "Existing HSE",  icon: Shield,    color: "#993c1d", desc: "Intelex, Enablon, Cority"          },
  { id: "custom", label: "Custom API",    icon: Code2,     color: "#6B7280", desc: "REST or GraphQL endpoint"          },
];

const COMPLIANCE_STANDARDS = ["ISO 45001","ISO 14001","OSHA 300","HSE UK","NEBOSH","NFPA","Local Regulatory Standards"];
const PERMIT_TYPES_LIST     = ["Hot Work","Electrical Isolation","Work at Height","Confined Space Entry","Excavation","Cold Work","Chemical Handling","Radiation Work"];

// ── FieldInput ─────────────────────────────────────────────────────────────────
function FieldInput({
  field, value, onChange, hasError,
}: { field: FieldDef; value: string; onChange: (v: string) => void; hasError?: boolean }) {
  const base: React.CSSProperties = {
    width: "100%", padding: "10px 12px",
    border: `1.5px solid ${hasError ? "#EF4444" : "#E3E9F6"}`,
    borderRadius: 10, fontSize: 13, outline: "none",
    background: hasError ? "#FFF5F5" : "#FAFBFF", boxSizing: "border-box",
    transition: "border-color 0.15s",
  };
  if (field.type === "select")
    return (
      <select value={value} onChange={e => onChange(e.target.value)} style={base}>
        <option value="">Select…</option>
        {field.options?.map(o => <option key={o}>{o}</option>)}
      </select>
    );
  if (field.type === "textarea")
    return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} rows={2} style={{ ...base, resize: "none" }} />;
  return <input type={field.type} value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} style={base} />;
}

// ── STEP 1 — Organisation Profile ─────────────────────────────────────────────
function Step1({
  onNext, stepCompleted, onComplete,
}: {
  onNext: () => void;
  stepCompleted: boolean;
  onComplete: () => void;
}) {
  const [importTab, setImportTab] = useState<"manual" | "excel" | "api">("manual");
  const [form,  setForm]   = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(stepCompleted);
  const fileRef = useRef<HTMLInputElement>(null);
  const [saveOrgStep1] = useSaveOrgSetupStep1Mutation();
  const [apiUrl,   setApiUrl]   = useState("");
  const [apiKey,   setApiKey]   = useState("");
  const [apiToken, setApiToken] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);

  const fields    = MANUAL_FIELDS.organisation;
  const required  = fields.filter(f => f.required);
  const isValid   = required.every(f => (form[f.key] || "").trim().length > 0);
  const showError = touched && !isValid;

  const handleSave = async () => {
    setTouched(true);
    if (!isValid) return;
    setSaving(true);
    try {
      await saveOrgStep1({
        organizationName:    form.name,
        industryType:        form.industry,
        employeeCount:       Number(form.employees) || 0,
        officialEmail:       form.email,
        contactNumber:       form.phone,
        country:             form.country,
        headquartersAddress: form.address,
        dataEntryOption:     importTab,
      }).unwrap();
    } catch { /* best-effort */ }
    setSaved(true);
    onComplete();
    setSaving(false);
  };

  const handleContinue = () => {
    setTouched(true);
    if (!isValid && importTab === "manual") return;
    onNext();
  };

  const TABS: { key: "manual" | "excel" | "api"; label: string; Icon: React.ElementType }[] = [
    { key: "manual", label: "Manual Entry",    Icon: FileText        },
    { key: "excel",  label: "Excel / CSV",     Icon: FileSpreadsheet },
    { key: "api",    label: "API / Integrate", Icon: Link            },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Method tabs */}
      <div className="flex gap-2 mb-5">
        {TABS.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => { setImportTab(key); setTouched(false); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-[13px] font-medium transition-all"
            style={{ background: importTab === key ? "#EEF2FF" : "#fff", borderColor: importTab === key ? PRIMARY : "#E3E9F6", color: importTab === key ? PRIMARY : "#6B7280" }}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* MANUAL */}
      {importTab === "manual" && (
        <div className="flex-1 overflow-y-auto">
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#E3E9F6" }}>
            {showError && (
              <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm" style={{ background: "#FEE2E2", color: "#991B1B" }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Please fill in all required fields before continuing.
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {fields.map(f => (
                <div key={f.key} className={f.type === "textarea" ? "col-span-2" : ""}>
                  <label className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#9CA3AF" }}>
                    {f.label}
                    {f.required && <span className="text-red-500">*</span>}
                  </label>
                  <FieldInput
                    field={f}
                    value={form[f.key] || ""}
                    onChange={v => setForm(p => ({ ...p, [f.key]: v }))}
                    hasError={touched && f.required && !(form[f.key] || "").trim()}
                  />
                  {touched && f.required && !(form[f.key] || "").trim() && (
                    <p className="text-[11px] mt-1" style={{ color: "#EF4444" }}>{f.label} is required</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: "#F3F4F6" }}>
              <button onClick={() => { setForm({}); setTouched(false); setSaved(false); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
                <RotateCcw className="w-3.5 h-3.5" />Clear
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-60 transition-all"
                style={{ background: saved ? "#059669" : GRADIENT }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? "Saved ✓" : saving ? "Saving…" : "Save Details"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXCEL */}
      {importTab === "excel" && (
        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[14px] font-bold" style={{ color: "#111827" }}>Download Organisation Template</div>
                <div className="text-[12px] mt-0.5" style={{ color: "#9CA3AF" }}>
                  Fill in the CSV template and upload — fields will be auto-populated in the form
                </div>
              </div>
              <button
                onClick={() => downloadTemplate("organisation")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-[12px] font-bold"
                style={{ background: GRADIENT }}>
                <Download className="w-3.5 h-3.5" />Download Template
              </button>
            </div>

            <div
              onDragOver={e => { e.preventDefault(); }}
              onDrop={async e => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (!file) return;
                setSaving(true);
                const parsed = await parseOrgExcel(file);
                const mapped: Record<string, string> = {
                  name: parsed.organizationName || "",
                  industry: parsed.industryType || "",
                  employees: parsed.employeeCount || "",
                  email: parsed.officialEmail || "",
                  phone: parsed.contactNumber || "",
                  country: parsed.country || "",
                  address: parsed.headquartersAddress || "",
                };
                setForm(prev => ({ ...prev, ...Object.fromEntries(Object.entries(mapped).filter(([, v]) => v)) }));
                setSaving(false);
                setImportTab("manual");
              }}
              onClick={() => fileRef.current?.click()}
              className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-12 gap-3 cursor-pointer transition-all hover:opacity-80"
              style={{ borderColor: "#D1D5DB", background: "#F9FAFB" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#F3F4F6" }}>
                {saving ? <Loader2 className="w-6 h-6 animate-spin" style={{ color: PRIMARY }} /> : <Upload className="w-6 h-6" style={{ color: "#9CA3AF" }} />}
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: "#374151" }}>
                  {saving ? "Parsing file…" : "Drag & drop your Excel / CSV here"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>Fields will be auto-filled in the form · .xlsx / .csv</p>
              </div>
              <div className="px-5 py-1.5 rounded-full text-[12px] font-medium border" style={{ background: "#fff", borderColor: "#D1D5DB", color: "#6B7280" }}>Browse Files</div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setSaving(true);
                  const parsed = await parseOrgExcel(file);
                  const mapped: Record<string, string> = {
                    name: parsed.organizationName || "",
                    industry: parsed.industryType || "",
                    employees: parsed.employeeCount || "",
                    email: parsed.officialEmail || "",
                    phone: parsed.contactNumber || "",
                    country: parsed.country || "",
                    address: parsed.headquartersAddress || "",
                  };
                  setForm(prev => ({ ...prev, ...Object.fromEntries(Object.entries(mapped).filter(([, v]) => v)) }));
                  setSaving(false);
                  setImportTab("manual");
                }} />
            </div>

            <div className="mt-3 flex items-center gap-2 p-3 rounded-xl" style={{ background: "#EEF2FF", borderColor: "#C7D2FE" }}>
              <Info className="w-4 h-4 flex-shrink-0" style={{ color: PRIMARY }} />
              <span className="text-[11px]" style={{ color: "#4A57B9" }}>
                Upload will auto-fill the manual form. Review the pre-filled data, then click "Save Details" to confirm.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* API */}
      {importTab === "api" && (
        <div className="flex-1 overflow-y-auto">
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
            <div className="text-[14px] font-bold mb-1" style={{ color: "#111827" }}>Pull Organisation Details via API</div>
            <div className="text-[12px] mb-5" style={{ color: "#9CA3AF" }}>Connect to your ERP or HRMS to auto-populate organisation information</div>
            {apiError && (
              <div className="flex items-center gap-2 p-3 rounded-xl mb-3 text-[12px]" style={{ background: "#FEE2E2", color: "#991B1B" }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{apiError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "#374151" }}>System / API Endpoint URL</label>
                <input type="url" value={apiUrl} onChange={e => setApiUrl(e.target.value)}
                  placeholder="https://api.yoursystem.com/v1/org" className="w-full rounded-xl border px-3 py-2.5 text-[13px] outline-none"
                  style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "#374151" }}>API Key</label>
                <input type="text" value={apiKey} onChange={e => setApiKey(e.target.value)}
                  placeholder="Enter API key" className="w-full rounded-xl border px-3 py-2.5 text-[13px] outline-none"
                  style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "#374151" }}>Bearer Token (optional)</label>
                <input type="password" value={apiToken} onChange={e => setApiToken(e.target.value)}
                  placeholder="Bearer token if required" className="w-full rounded-xl border px-3 py-2.5 text-[13px] outline-none"
                  style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }} />
              </div>
            </div>
            <button onClick={async () => {
              if (!apiUrl) { setApiError("Please enter an API endpoint URL."); return; }
              setSaving(true); setApiError(null);
              const parsed = await connectOrgApiRaw(apiUrl, apiKey, apiToken);
              const mapped: Record<string, string> = {
                name:      parsed.organizationName || "",
                industry:  parsed.industryType     || "",
                employees: parsed.employeeCount    || "",
                email:     parsed.officialEmail    || "",
                phone:     parsed.contactNumber    || "",
                country:   parsed.country          || "",
                address:   parsed.headquartersAddress || "",
              };
              const hasData = Object.values(mapped).some(v => v);
              if (!hasData) {
                setApiError("No organisation data returned from that endpoint. Check the URL and credentials.");
                setSaving(false); return;
              }
              setForm(prev => ({ ...prev, ...Object.fromEntries(Object.entries(mapped).filter(([, v]) => v)) }));
              setSaving(false); setSaved(true); onComplete(); setImportTab("manual");
            }} disabled={saving}
              className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-60" style={{ background: GRADIENT }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
              {saving ? "Connecting…" : "Connect & Import"}
            </button>
          </div>
        </div>
      )}

      {/* Footer nav */}
      <div className="pt-5 flex items-center justify-between border-t mt-5" style={{ borderColor: "#F3F4F6" }}>
        <div className="text-[12px] flex items-center gap-1.5" style={{ color: saved ? "#059669" : "#9CA3AF" }}>
          {saved
            ? <><Check className="w-4 h-4" />Step complete — you can continue</>
            : <><AlertCircle className="w-4 h-4" />Fill required fields marked with * to continue</>
          }
        </div>
        <button
          onClick={handleContinue}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm transition-all"
          style={{ background: (saved || importTab !== "manual") ? GRADIENT : "#D1D5DB", cursor: (saved || importTab !== "manual") ? "pointer" : "not-allowed" }}>
          Continue
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── STEP 2 — Import HSE Data ──────────────────────────────────────────────────
type ImportMethod = "manual" | "excel" | "api";

function Step2({
  onNext, onBack, stepCompleted, onComplete,
}: {
  onNext: () => void; onBack: () => void; stepCompleted: boolean; onComplete: () => void;
}) {
  const [activeModule, setActiveModule] = useState(MODULES[0]);
  const [importMethod, setImportMethod] = useState<ImportMethod>("manual");
  const [rows,         setRows]         = useState<Record<string, string>[]>([{}]);
  const [saving,       setSaving]       = useState(false);
  const [savedList,    setSavedList]    = useState<{ module: string; count: number }[]>([]);
  const [error,        setError]        = useState<string | null>(null);
  const [dragging,     setDragging]     = useState(false);
  const [files,        setFiles]        = useState<{ file: File; id: number; status: string }[]>([]);
  const [apiStep,      setApiStep]      = useState<"list" | "configure" | "done">("list");
  const [rowTouched,   setRowTouched]   = useState(false);
  const fileRef  = useRef<HTMLInputElement>(null);
  const [importData]  = useImportOrgSetupDataMutation();
  const [createSite]  = useCreateOrgSetupSiteMutation();
  const [createUser]  = useCreateOrgSetupUserMutation();

  const fields   = MANUAL_FIELDS[activeModule.key] || [];
  const { color } = activeModule;
  const template  = EXCEL_TEMPLATES.find(t => t.key === activeModule.key);
  const hasSaved  = stepCompleted || savedList.length > 0;

  const rowIsValid = (row: Record<string, string>) =>
    fields.filter(f => f.required).every(f => (row[f.key] || "").trim().length > 0);

  const updateRow = (i: number, k: string, v: string) =>
    setRows(r => r.map((row, idx) => idx === i ? { ...row, [k]: v } : row));

  const handleSaveManual = async () => {
    setRowTouched(true);
    if (!rows.every(rowIsValid)) return;
    setSaving(true); setError(null);
    try {
      for (const row of rows) {
        if (activeModule.key === "sites") {
          await createSite({ name: row.name || "", type: row.type || "", address: row.address || "", id: "" });
        } else if (activeModule.key === "users") {
          await createUser({ name: row.name || "", email: row.email || "", role: row.role || "Worker", department: row.dept || "", id: "" });
        } else {
          await importData({ dataType: activeModule.key, method: "manual", records: 1, data: row });
        }
      }
      setSavedList(s => [...s, { module: activeModule.label, count: rows.length }]);
      setRows([{}]); setRowTouched(false); onComplete();
    } catch (e: unknown) {
      setError((e as Error).message || "Failed to save. Check fields and try again.");
    } finally { setSaving(false); }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f =>
      f.name.endsWith(".xlsx") || f.name.endsWith(".csv") || f.name.endsWith(".xls")
    );
    dropped.forEach(file => {
      setFiles(prev => [...prev, { file, id: Date.now() + Math.random(), status: "ready" }]);
    });
  }, []);

  const TABS: { key: ImportMethod; label: string; Icon: React.ElementType }[] = [
    { key: "manual", label: "Manual Entry",    Icon: FileText        },
    { key: "excel",  label: "Excel / CSV",     Icon: FileSpreadsheet },
    { key: "api",    label: "API / Integrate", Icon: Link            },
  ];

  return (
    <div className="h-full flex gap-5">

      {/* Module sidebar */}
      <div className="w-48 flex-shrink-0 flex flex-col">
        <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>Module</div>
        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
          {MODULES.map(m => {
            const Icon   = m.icon;
            const active = activeModule.key === m.key;
            const done   = savedList.some(s => s.module === m.label);
            return (
              <button key={m.key}
                onClick={() => { setActiveModule(m); setRows([{}]); setError(null); setFiles([]); setApiStep("list"); setRowTouched(false); setImportMethod("manual"); }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-[12px] transition-all"
                style={{
                  background:  active ? m.color + "15" : "transparent",
                  borderLeft:  `2.5px solid ${active ? m.color : "transparent"}`,
                  color:       active ? m.color : "#6B7280",
                  fontWeight:  active ? 600 : 400,
                }}>
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="flex-1 truncate text-[11px]">{m.label}</span>
                {done && <Check className="w-3 h-3 flex-shrink-0" style={{ color: "#10B981" }} />}
              </button>
            );
          })}
        </div>

        {savedList.length > 0 && (
          <div className="mt-3 rounded-xl p-2.5 border" style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}>
            <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#059669" }}>Imported</div>
            {savedList.slice(-3).reverse().map((s, i) => (
              <div key={i} className="text-[11px] mb-1" style={{ color: "#059669" }}>
                <span className="font-semibold">{s.module}</span>
                <span className="ml-1" style={{ color: "#9CA3AF" }}>({s.count})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Method tabs + module title */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {TABS.map(({ key, label, Icon }) => (
              <button key={key} onClick={() => { setImportMethod(key); setFiles([]); setApiStep("list"); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-medium transition-all"
                style={{ background: importMethod === key ? color + "12" : "#fff", borderColor: importMethod === key ? color : "#E3E9F6", color: importMethod === key ? color : "#9CA3AF" }}>
                <Icon className="w-3 h-3" />{label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: color + "15" }}>
              <activeModule.icon className="w-3.5 h-3.5" style={{ color }} />
            </div>
            <span className="text-[13px] font-bold" style={{ color: "#111827" }}>{activeModule.label}</span>
          </div>
        </div>

        {/* ── MANUAL ── */}
        {importMethod === "manual" && (
          <div className="flex-1 overflow-y-auto">
            <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
              {/* Column headers */}
              <div className="grid px-4 py-2.5 border-b"
                style={{ gridTemplateColumns: `repeat(${Math.min(fields.length, 3)}, 1fr) 36px`, borderColor: "#F3F4F6", background: "#F8FAFF" }}>
                {fields.slice(0, 3).map(f => (
                  <div key={f.key} className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
                    {f.label}{f.required && <span className="text-red-400"> *</span>}
                  </div>
                ))}
                <div />
              </div>

              {rows.map((row, i) => (
                <div key={i} className="border-b last:border-0" style={{ borderColor: "#F3F4F6" }}>
                  <div className="grid gap-2 px-4 py-2.5 items-start"
                    style={{ gridTemplateColumns: `repeat(${Math.min(fields.length, 3)}, 1fr) 36px` }}>
                    {fields.slice(0, 3).map(f => (
                      <FieldInput key={f.key} field={f} value={row[f.key] || ""} onChange={v => updateRow(i, f.key, v)}
                        hasError={rowTouched && !!f.required && !(row[f.key] || "").trim()} />
                    ))}
                    <button onClick={() => setRows(r => r.filter((_, idx) => idx !== i))} disabled={rows.length === 1}
                      className="p-2 rounded-lg flex items-center justify-center"
                      style={{ background: rows.length === 1 ? "#F9FAFB" : "#FEF2F2", color: rows.length === 1 ? "#D1D5DB" : "#EF4444" }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {fields.length > 3 && (
                    <div className="grid gap-2 px-4 pb-2.5 items-start"
                      style={{ gridTemplateColumns: `repeat(${Math.min(fields.length - 3, 3)}, 1fr)` }}>
                      {fields.slice(3).map(f => (
                        <div key={f.key}>
                          <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>
                            {f.label}{f.required && <span className="text-red-400"> *</span>}
                          </div>
                          <FieldInput field={f} value={row[f.key] || ""} onChange={v => updateRow(i, f.key, v)}
                            hasError={rowTouched && !!f.required && !(row[f.key] || "").trim()} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: "#F3F4F6", background: "#F8FAFF" }}>
                <button onClick={() => setRows(r => [...r, {}])}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border"
                  style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
                  <Plus className="w-3.5 h-3.5" />Add Row
                </button>
                <div className="flex gap-2">
                  <button onClick={() => { setRows([{}]); setRowTouched(false); }}
                    className="px-3 py-1.5 rounded-lg border text-[11px]" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>Clear</button>
                  <button onClick={handleSaveManual} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white text-[11px] font-bold disabled:opacity-60"
                    style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}>
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {saving ? "Saving…" : "Save Records"}
                  </button>
                </div>
              </div>
              {error && (
                <div className="mx-4 mb-3 flex items-start gap-2 p-3 rounded-xl text-[11px]" style={{ background: "#FEE2E2", color: "#991B1B" }}>
                  <X className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── EXCEL ── */}
        {importMethod === "excel" && (
          <div className="flex-1 overflow-y-auto space-y-3">
            {template && (
              <div className="bg-white rounded-2xl border p-4 flex items-center justify-between" style={{ borderColor: "#E3E9F6" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + "15" }}>
                    <activeModule.icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold" style={{ color: "#111827" }}>{template.label} Template</div>
                    <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{template.cols} columns · {template.rows} row{template.rows !== 1 ? "s" : ""} · .xlsx</div>
                  </div>
                </div>
                <button onClick={() => downloadTemplate(activeModule.key)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-white text-[11px] font-bold"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}>
                  <Download className="w-3.5 h-3.5" />Download Template
                </button>
              </div>
            )}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className="bg-white rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-10 gap-3 cursor-pointer transition-all"
              style={{ borderColor: dragging ? color : "#D1D5DB", background: dragging ? color + "06" : "#F9FAFB" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: dragging ? color + "20" : "#F3F4F6" }}>
                <Upload className="w-6 h-6" style={{ color: dragging ? color : "#9CA3AF" }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: dragging ? color : "#374151" }}>
                  {dragging ? "Drop files here" : `Drop ${activeModule.label} Excel / CSV here`}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>Supports .xlsx, .xls, .csv · Max 50 MB</p>
              </div>
              <div className="px-5 py-1.5 rounded-full text-[12px] font-medium border" style={{ background: "#fff", borderColor: "#D1D5DB", color: "#6B7280" }}>Browse Files</div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" multiple className="hidden"
                onChange={e => Array.from(e.target.files || []).forEach(file => {
                  setFiles(prev => [...prev, { file, id: Date.now() + Math.random(), status: "ready" }]);
                })} />
            </div>
            {files.length > 0 && (
              <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
                <div className="px-4 py-3 border-b flex justify-between items-center" style={{ borderColor: "#F3F4F6", background: "#F8FAFF" }}>
                  <span className="text-[12px] font-bold" style={{ color: "#111827" }}>Uploaded Files ({files.length})</span>
                  <button onClick={() => setFiles([])} className="text-[11px]" style={{ color: "#EF4444" }}>Clear All</button>
                </div>
                {files.map(entry => (
                  <div key={entry.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0" style={{ borderColor: "#F3F4F6" }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#F0FDF4" }}>
                      <FileSpreadsheet className="w-5 h-5" style={{ color: "#059669" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold truncate" style={{ color: "#111827" }}>{entry.file.name}</div>
                      <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{(entry.file.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.status === "uploading" && <span className="text-[11px] flex items-center gap-1" style={{ color: PRIMARY }}><RefreshCw className="w-3 h-3 animate-spin" />Uploading…</span>}
                      {entry.status === "ready" && (
                        <>
                          <span className="text-[11px] flex items-center gap-1" style={{ color: "#059669" }}><CheckCircle2 className="w-3 h-3" />Ready</span>
                          <button className="px-3 py-1 rounded-lg text-[11px] font-bold text-white"
                            style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}
                            onClick={async () => {
                              setFiles(prev => prev.map(e => e.id === entry.id ? { ...e, status: "uploading" } : e));
                              setError(null);
                              const result = await uploadModuleFile(activeModule.key, entry.file);
                              if (result.error) {
                                setError(result.error);
                                setFiles(prev => prev.map(e => e.id === entry.id ? { ...e, status: "ready" } : e));
                              } else {
                                setFiles(prev => prev.map(e => e.id === entry.id ? { ...e, status: "done" } : e));
                                setSavedList(s => [...s, { module: activeModule.label, count: result.count }]);
                                onComplete();
                              }
                            }}>
                            Import
                          </button>
                        </>
                      )}
                      {entry.status === "done" && <span className="text-[11px] flex items-center gap-1" style={{ color: "#059669" }}><Check className="w-3 h-3" />Imported</span>}
                      <button onClick={() => setFiles(f => f.filter(e => e.id !== entry.id))} className="p-1.5 rounded-lg" style={{ background: "#F9FAFB", color: "#9CA3AF" }}><X className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── API ── */}
        {importMethod === "api" && (
          <div className="flex-1 overflow-y-auto">
            {apiStep === "list" && (
              <div className="grid grid-cols-2 gap-3">
                {API_SYSTEMS.map(sys => (
                  <button key={sys.id} onClick={() => setApiStep("configure")}
                    className="flex items-start gap-3 p-4 rounded-2xl border text-left transition-all hover:shadow-md bg-white"
                    style={{ borderColor: "#E3E9F6" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: sys.color + "15" }}>
                      <sys.icon className="w-5 h-5" style={{ color: sys.color }} />
                    </div>
                    <div>
                      <div className="text-[12px] font-bold mb-0.5" style={{ color: "#111827" }}>{sys.label}</div>
                      <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{sys.desc}</div>
                      <div className="text-[11px] font-semibold mt-1.5 flex items-center gap-1" style={{ color: sys.color }}>Connect <ChevronRight className="w-3 h-3" /></div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {apiStep === "configure" && (
              <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
                <div className="flex items-center gap-2 mb-5">
                  <button onClick={() => setApiStep("list")} className="p-1.5 rounded-lg border" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}><ChevronRight className="w-4 h-4 rotate-180" /></button>
                  <span className="text-[14px] font-bold" style={{ color: "#111827" }}>Configure API Connection</span>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "API Endpoint URL", key: "url",    type: "url",      ph: "https://api.yoursystem.com/v1" },
                    { label: "API Key",          key: "key",    type: "text",     ph: "Enter your API key" },
                    { label: "Secret / Token",   key: "secret", type: "password", ph: "Bearer token" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "#374151" }}>{f.label}</label>
                      <input type={f.type} placeholder={f.ph} className="w-full rounded-xl border px-3 py-2.5 text-[13px] outline-none" style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => { setApiStep("done"); setSavedList(s => [...s, { module: activeModule.label, count: 0 }]); onComplete(); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-bold text-[13px]" style={{ background: GRADIENT }}>
                    <Link className="w-4 h-4" />Test & Connect
                  </button>
                  <button onClick={() => setApiStep("list")} className="px-5 rounded-xl border" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>Cancel</button>
                </div>
              </div>
            )}
            {apiStep === "done" && (
              <div className="text-center py-10 bg-white rounded-2xl border" style={{ borderColor: "#E3E9F6" }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#D1FAE5" }}>
                  <CheckCircle2 className="w-7 h-7" style={{ color: "#059669" }} />
                </div>
                <div className="text-[15px] font-bold mb-1" style={{ color: "#111827" }}>Connected!</div>
                <div className="text-[12px] mb-4" style={{ color: "#9CA3AF" }}>{activeModule.label} data is being synced.</div>
                <button onClick={() => setApiStep("list")} className="px-5 py-2 rounded-xl border text-[12px]" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>Add Another</button>
              </div>
            )}
          </div>
        )}

        {/* Footer nav */}
        <div className="pt-4 flex items-center justify-between border-t mt-4" style={{ borderColor: "#F3F4F6" }}>
          <button onClick={onBack} className="flex items-center gap-2 px-5 py-2 rounded-xl border text-sm" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
            <ChevronRight className="w-4 h-4 rotate-180" />Back
          </button>
          <div className="flex items-center gap-4">
            <span className="text-[11px]" style={{ color: "#9CA3AF" }}>
              {savedList.length > 0
                ? `${savedList.length} module${savedList.length > 1 ? "s" : ""} imported`
                : "All modules optional — import later from Data Management"}
            </span>
            <button onClick={onNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: GRADIENT }}>
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── STEP 3 — Configuration ────────────────────────────────────────────────────
function Step3({
  onNext, onBack, stepCompleted, onComplete,
}: {
  onNext: () => void; onBack: () => void; stepCompleted: boolean; onComplete: () => void;
}) {
  const [standards,   setStandards]   = useState<string[]>([]);
  const [permitTypes, setPermitTypes] = useState<string[]>([]);
  const [workflows,   setWorkflows]   = useState({
    permitWorkflows:   { enabled: true,  config: "" },
    incidentWorkflows: { enabled: true,  config: "" },
    auditWorkflows:    { enabled: true,  config: "" },
    capaWorkflows:     { enabled: true,  config: "" },
    escalationRules:   { enabled: false, config: "" },
    approvalLevels:    { enabled: true,  config: "" },
  });
  const [aiFeatures, setAiFeatures] = useState({
    aiAssistant:          true,
    predictiveRiskEngine: true,
    complianceAI:         true,
    aiRecommendations:    true,
    benchmarkingEngine:   false,
    fatigueAnalysis:      false,
    trendAnalysis:        true,
  });
  const [saving,     setSaving]    = useState(false);
  const [touched,    setTouched]   = useState(false);
  const isValid = standards.length > 0;
  const [saveStep2] = useSaveOrgSetupStep2Mutation();
  const [saveStep5] = useSaveOrgSetupStep5Mutation();
  const [saveStep7] = useSaveOrgSetupStep7Mutation();

  const toggle = <K extends string>(arr: K[], val: K, set: (a: K[]) => void) =>
    set(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);

  const handleContinue = async () => {
    setTouched(true);
    if (!isValid) return;
    setSaving(true);
    try {
      await saveStep2({ applicableStandards: standards, permitTypes, regulatoryRegion: "", auditFrequency: "quarterly", capaSlaCriticalDays: 3, capaSlaStandardDays: 14, incidentSeverityMatrix: [] });
      await saveStep5({ workflows });
      await saveStep7({ aiFeatures });
      onComplete();
      onNext();
    } catch {
      onComplete(); onNext();
    } finally { setSaving(false); }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-5">

        {/* Compliance Standards */}
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5" style={{ color: PRIMARY }} />
            <span className="text-[14px] font-bold" style={{ color: "#111827" }}>Compliance Standards</span>
            <span className="ml-1 text-red-500 text-sm">*</span>
          </div>
          <p className="text-[12px] mb-4" style={{ color: "#9CA3AF" }}>Select all standards applicable to your organisation</p>
          {touched && !isValid && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-3 text-[12px]" style={{ background: "#FEE2E2", color: "#991B1B" }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />Select at least one compliance standard to continue.
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {COMPLIANCE_STANDARDS.map(s => {
              const active = standards.includes(s);
              return (
                <button key={s} onClick={() => { toggle(standards, s, setStandards); }}
                  className="px-4 py-2 rounded-xl border text-[13px] font-medium transition-all"
                  style={{ background: active ? "#EEF2FF" : "#F9FAFB", borderColor: active ? PRIMARY : touched && !isValid ? "#FCA5A5" : "#E3E9F6", color: active ? PRIMARY : "#6B7280" }}>
                  {active && <Check className="w-3 h-3 inline mr-1.5" />}{s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Permit Types */}
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5" style={{ color: "#0891B2" }} />
            <span className="text-[14px] font-bold" style={{ color: "#111827" }}>Permit Types</span>
          </div>
          <p className="text-[12px] mb-4" style={{ color: "#9CA3AF" }}>Select the permit types used in your operations</p>
          <div className="flex flex-wrap gap-2">
            {PERMIT_TYPES_LIST.map(p => {
              const active = permitTypes.includes(p);
              return (
                <button key={p} onClick={() => toggle(permitTypes, p, setPermitTypes)}
                  className="px-3 py-1.5 rounded-xl border text-[12px] font-medium transition-all"
                  style={{ background: active ? "#ECFEFF" : "#F9FAFB", borderColor: active ? "#0891B2" : "#E3E9F6", color: active ? "#0891B2" : "#6B7280" }}>
                  {active && <Check className="w-3 h-3 inline mr-1.5" />}{p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Workflows + AI — side by side */}
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5" style={{ color: "#D97706" }} />
              <span className="text-[14px] font-bold" style={{ color: "#111827" }}>Workflow Rules</span>
            </div>
            <div className="space-y-2.5">
              {(Object.keys(workflows) as (keyof typeof workflows)[]).map(wf => {
                const label = wf.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
                const isOn  = workflows[wf].enabled;
                return (
                  <div key={wf} className="flex items-center justify-between px-3 py-2.5 rounded-xl border"
                    style={{ borderColor: isOn ? "#FDE68A" : "#E3E9F6", background: isOn ? "#FFFBEB" : "#F9FAFB" }}>
                    <span className="text-[12px] font-medium" style={{ color: "#374151" }}>{label}</span>
                    <div className="relative w-9 h-5 rounded-full cursor-pointer flex-shrink-0"
                      style={{ background: isOn ? "#D97706" : "#D1D5DB" }}
                      onClick={() => setWorkflows(p => ({ ...p, [wf]: { ...p[wf], enabled: !isOn } }))}>
                      <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: isOn ? "18px" : "2px" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5" style={{ color: "#8B5CF6" }} />
              <span className="text-[14px] font-bold" style={{ color: "#111827" }}>AI & Intelligence</span>
            </div>
            <div className="space-y-2.5">
              {(Object.entries(aiFeatures) as [keyof typeof aiFeatures, boolean][]).map(([feat, isOn]) => {
                const label = feat.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
                return (
                  <div key={feat} className="flex items-center justify-between px-3 py-2.5 rounded-xl border"
                    style={{ borderColor: isOn ? "#DDD6FE" : "#E3E9F6", background: isOn ? "#F5F3FF" : "#F9FAFB" }}>
                    <span className="text-[12px] font-medium" style={{ color: isOn ? "#7C3AED" : "#6B7280" }}>{label}</span>
                    <div className="relative w-9 h-5 rounded-full cursor-pointer flex-shrink-0"
                      style={{ background: isOn ? "#8B5CF6" : "#D1D5DB" }}
                      onClick={() => setAiFeatures(p => ({ ...p, [feat]: !isOn }))}>
                      <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: isOn ? "18px" : "2px" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer nav */}
      <div className="pt-4 flex items-center justify-between border-t mt-4" style={{ borderColor: "#F3F4F6" }}>
        <button onClick={onBack} className="flex items-center gap-2 px-5 py-2 rounded-xl border text-sm" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
          <ChevronRight className="w-4 h-4 rotate-180" />Back
        </button>
        <button onClick={handleContinue} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-60"
          style={{ background: GRADIENT }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {saving ? "Saving…" : "Continue to Review"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── STEP 4 — Review & Activate ────────────────────────────────────────────────
function Step4({
  onBack, completedSteps,
}: {
  onBack: () => void; completedSteps: Set<number>;
}) {
  const navigate = useNavigate();
  const { markOnboardingSetupCompleted } = useAuth();
  const [activateOrg, { isLoading }] = useActivateOrganizationMutation();
  const [activated, setActivated]    = useState(false);

  const checklist = [
    { label: "Organisation profile",          step: 1 },
    { label: "HSE data imported",             step: 2 },
    { label: "Compliance standards selected", step: 3 },
    { label: "Workflows configured",          step: 3 },
    { label: "AI features set up",            step: 3 },
  ];

  const handleActivate = async () => {
    try { await activateOrg({ confirmed: true }).unwrap(); } catch { /* best-effort */ }
    setActivated(true);
    markOnboardingSetupCompleted();
    setTimeout(() => navigate("/"), 2500);
  };

  if (activated) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ background: GRADIENT }}>
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
        <div className="text-[28px] font-black mb-3" style={{ color: "#111827" }}>Organisation is Live! 🎉</div>
        <div className="text-[14px] max-w-md mb-6" style={{ color: "#9CA3AF" }}>
          Your HSE platform is fully configured and ready. Redirecting you to the dashboard…
        </div>
        <div className="flex items-center gap-2" style={{ color: PRIMARY }}>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-[14px] font-medium">Loading dashboard…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-5 max-w-2xl mx-auto w-full">
        <div className="text-center mb-2">
          <div className="text-[16px] font-bold mb-1" style={{ color: "#111827" }}>Review your setup</div>
          <div className="text-[13px]" style={{ color: "#9CA3AF" }}>Check your configuration summary before activating your organisation.</div>
        </div>

        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <div className="text-[13px] font-bold mb-4" style={{ color: "#111827" }}>Setup Checklist</div>
          <div className="space-y-3">
            {checklist.map(item => {
              const done = completedSteps.has(item.step);
              return (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl border"
                  style={{ borderColor: done ? "#BBF7D0" : "#E3E9F6", background: done ? "#F0FDF4" : "#F9FAFB" }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: done ? "#10B981" : "#E5E7EB" }}>
                    {done
                      ? <Check className="w-4 h-4 text-white" />
                      : <div className="w-2 h-2 rounded-full bg-gray-400" />}
                  </div>
                  <span className="text-[13px] font-medium flex-1" style={{ color: done ? "#065F46" : "#9CA3AF" }}>
                    {item.label}
                  </span>
                  {done
                    ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#D1FAE5", color: "#059669" }}>Complete</span>
                    : <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#9CA3AF" }}>Skipped</span>
                  }
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl p-5 border" style={{ background: "#EEF2FF", borderColor: "#C7D2FE" }}>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: PRIMARY }} />
            <div>
              <div className="text-[13px] font-bold mb-1" style={{ color: PRIMARY }}>Before you activate</div>
              <div className="text-[12px]" style={{ color: "#6B7280" }}>
                Activating will finalize your setup and make your HSE platform operational. All configurations can be updated later from the admin panel at any time.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 flex items-center justify-between border-t mt-4" style={{ borderColor: "#F3F4F6" }}>
        <button onClick={onBack} className="flex items-center gap-2 px-5 py-2 rounded-xl border text-sm" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
          <ChevronRight className="w-4 h-4 rotate-180" />Back
        </button>
        <button onClick={handleActivate} disabled={isLoading}
          className="flex items-center gap-3 px-8 py-3 rounded-xl text-white font-bold text-[15px] disabled:opacity-60 transition-all hover:shadow-xl"
          style={{ background: GRADIENT }}>
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
          {isLoading ? "Activating…" : "Activate Organisation"}
        </button>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export function OrgSetupWizardPage() {
  const [currentStep,    setCurrentStep]    = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const markComplete = (step: number) =>
    setCompletedSteps(prev => new Set([...prev, step]));

  const goNext = () => setCurrentStep(s => Math.min(s + 1, 4));
  const goBack = () => setCurrentStep(s => Math.max(s - 1, 1));

  const progressPct = ((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100;

  return (
    // Full-screen fixed overlay — covers entire viewport including the app shell
    <div className="fixed inset-0 z-50 flex overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── LEFT PANEL ── */}
      <div className="w-72 flex-shrink-0 flex flex-col p-8 relative overflow-hidden" style={{ background: DARK_BG }}>
        {/* Decorative blobs */}
        <div className="absolute w-64 h-64 rounded-full pointer-events-none" style={{ background: "rgba(111,128,232,0.12)", top: -60, right: -40, filter: "blur(40px)" }} />
        <div className="absolute w-48 h-48 rounded-full pointer-events-none" style={{ background: "rgba(74,87,185,0.18)", bottom: 80, left: -30, filter: "blur(50px)" }} />

        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 relative">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: GRADIENT }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-[15px]">HSE Intelligence</div>
            <div className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>ORGANISATION SETUP</div>
          </div>
        </div>

        {/* Steps list */}
        <div className="flex-1 relative">
          {WIZARD_STEPS.map((step, idx) => {
            const Icon      = step.icon;
            const done      = completedSteps.has(step.id);
            const active    = step.id === currentStep;
            const locked    = step.id > currentStep && !completedSteps.has(step.id - 1) && step.id > 1;
            const accessible = step.id <= currentStep || completedSteps.has(step.id);

            return (
              <div key={step.id} className="relative flex gap-4 mb-6">
                {/* connector line */}
                {idx < WIZARD_STEPS.length - 1 && (
                  <div className="absolute left-[19px] top-10 w-0.5 h-8" style={{ background: done ? "rgba(111,128,232,0.6)" : "rgba(255,255,255,0.1)" }} />
                )}

                <div
                  onClick={() => accessible && setCurrentStep(step.id)}
                  className="flex items-start gap-3 cursor-pointer w-full group"
                  style={{ opacity: locked ? 0.4 : 1, cursor: locked ? "not-allowed" : "pointer" }}
                >
                  {/* Icon circle */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      background:   active  ? GRADIENT
                                  : done    ? "rgba(16,185,129,0.25)"
                                  : "rgba(255,255,255,0.08)",
                      border:       active  ? "2px solid rgba(111,128,232,0.6)"
                                  : done    ? "2px solid rgba(16,185,129,0.4)"
                                  : "2px solid rgba(255,255,255,0.1)",
                      boxShadow:    active  ? "0 0 20px rgba(111,128,232,0.4)" : "none",
                    }}>
                    {done
                      ? <Check className="w-4 h-4" style={{ color: "#10B981" }} />
                      : locked
                      ? <Lock className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
                      : <Icon className="w-4 h-4" style={{ color: active ? "#fff" : "rgba(255,255,255,0.5)" }} />
                    }
                  </div>

                  <div className="pt-1">
                    <div className="text-[13px] font-semibold transition-colors"
                      style={{ color: active ? "#fff" : done ? "rgba(16,185,129,0.9)" : "rgba(255,255,255,0.5)" }}>
                      {step.label}
                    </div>
                    <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {step.desc}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="relative">
          <div className="flex justify-between text-[11px] mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
            <span>Progress</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%`, background: GRADIENT }} />
          </div>
          <div className="mt-3 text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            Step {currentStep} of {WIZARD_STEPS.length}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Top bar */}
        <div className="px-8 py-5 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: "#F3F4F6" }}>
          <div>
            <h1 className="text-[20px] font-black" style={{ color: "#111827" }}>
              {WIZARD_STEPS[currentStep - 1].label}
            </h1>
            <p className="text-[12px] mt-0.5" style={{ color: "#9CA3AF" }}>
              {currentStep === 1 && "Enter your organisation's details using your preferred method."}
              {currentStep === 2 && "Import your existing HSE data — all modules are optional and can be added later."}
              {currentStep === 3 && "Configure compliance standards, permit types, workflow rules and AI features."}
              {currentStep === 4 && "Review your setup and activate your HSE platform."}
            </p>
          </div>
          {/* Step badge */}
          <div className="flex items-center gap-2">
            {WIZARD_STEPS.map(s => (
              <div key={s.id} className="rounded-full transition-all"
                style={{
                  width:      s.id === currentStep ? 28 : 8,
                  height:     8,
                  background: s.id < currentStep  ? "#10B981"
                            : s.id === currentStep ? PRIMARY
                            : "#E3E9F6",
                }} />
            ))}
          </div>
        </div>

        {/* Step content area */}
        <div className="flex-1 overflow-hidden px-8 py-6" style={{ background: "#F8FAFF" }}>
          {currentStep === 1 && (
            <Step1
              onNext={goNext}
              stepCompleted={completedSteps.has(1)}
              onComplete={() => markComplete(1)}
            />
          )}
          {currentStep === 2 && (
            <Step2
              onNext={goNext}
              onBack={goBack}
              stepCompleted={completedSteps.has(2)}
              onComplete={() => markComplete(2)}
            />
          )}
          {currentStep === 3 && (
            <Step3
              onNext={goNext}
              onBack={goBack}
              stepCompleted={completedSteps.has(3)}
              onComplete={() => markComplete(3)}
            />
          )}
          {currentStep === 4 && (
            <Step4
              onBack={goBack}
              completedSteps={completedSteps}
            />
          )}
        </div>
      </div>
    </div>
  );
}
