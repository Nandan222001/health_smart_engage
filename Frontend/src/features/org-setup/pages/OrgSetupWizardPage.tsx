import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/app/context/AuthContext";
import {
  CheckCircle2,
  Circle,
  Lock,
  Loader2,
  Building2,
  ChevronRight,
  ChevronDown,
  Upload,
  Download,
  Plus,
  Trash2,
  X,
  Check,
  AlertTriangle,
  FileText,
  Brain,
  Zap,
  BarChart3,
  Users,
  Shield,
  Clock,
} from "lucide-react";
import {
  useGetOrgSetupProgressQuery,
  useGetOrgSetupStep1Query,
  useGetOrgSetupStep3SitesQuery,
  useGetOrgSetupStep4UsersQuery,
  useGetOrgSetupStep6DocumentsQuery,
  useGetOrgSetupStep6aImportsQuery,
  useSaveOrgSetupStep1Mutation,
  useSaveOrgSetupStep2Mutation,
  useCreateOrgSetupSiteMutation,
  useBulkUploadOrgSetupSitesMutation,
  useCreateOrgSetupUserMutation,
  useBulkUploadOrgSetupUsersMutation,
  useSaveOrgSetupStep5Mutation,
  useUploadOrgSetupKnowledgeMutation,
  useImportOrgSetupDataMutation,
  useSaveOrgSetupStep7Mutation,
  useActivateOrganizationMutation,
  useHrmsImportMutation,
  useParseOrgExcelMutation,
  useConnectOrgApiMutation,
} from "@/features/org-setup/api/orgSetupApi";

// ── Helpers ────────────────────────────────────────────────────────────────────

const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

async function downloadTemplate(path: string, filename: string) {
  const token = localStorage.getItem("hse_jwt");
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Constants ──────────────────────────────────────────────────────────────────

const STEP_LABELS = [
  "Org Details",
  "Compliance",
  "Sites",
  "Users",
  "Workflows",
  "Knowledge",
  "AI Setup",
  "Review",
];

const INDUSTRY_TYPES = [
  "Construction",
  "Oil & Gas",
  "Manufacturing",
  "Mining",
  "Logistics & Transport",
  "Power & Utilities",
  "Healthcare",
  "Other",
];

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const STANDARDS = ["ISO 45001", "ISO 14001", "OSHA", "HSE", "Internal SOP"];

const PERMIT_TYPES_LIST = [
  "Hot Work",
  "Electrical",
  "Work at Height",
  "Confined Space",
  "Excavation",
  "Cold Work",
];

const SITE_TYPES = ["Site", "Plant", "Branch", "Zone", "Department", "Unit"];

const USER_ROLES = [
  "Site HSE Manager",
  "Supervisor",
  "Worker",
  "Auditor",
];

const WORKFLOW_CARDS = [
  { key: "permitWorkflows", label: "Permit Workflows" },
  { key: "incidentWorkflows", label: "Incident Workflows" },
  { key: "auditWorkflows", label: "Audit Workflows" },
  { key: "capaWorkflows", label: "CAPA Workflows" },
  { key: "escalationRules", label: "Escalation Rules" },
  { key: "approvalLevels", label: "Approval Levels / Closure Rules" },
];

const AI_FEATURES = [
  { key: "aiAssistant", label: "AI Assistant", desc: "Natural language interface for HSE queries and guidance" },
  { key: "predictiveRiskEngine", label: "Predictive Risk Engine", desc: "ML-powered risk prediction based on historical data" },
  { key: "complianceAI", label: "Compliance AI", desc: "Automated compliance monitoring and gap analysis" },
  { key: "aiRecommendations", label: "AI Recommendations", desc: "Contextual safety recommendations and best practices" },
  { key: "benchmarkingEngine", label: "Benchmarking Engine", desc: "Industry benchmark comparisons and performance tracking" },
  { key: "fatigueAnalysis", label: "Fatigue Analysis", desc: "Worker fatigue detection and shift schedule optimization" },
  { key: "trendAnalysis", label: "Trend Analysis", desc: "Incident and near-miss trend detection and forecasting" },
];

const DOC_TYPES = [
  "Policy",
  "Procedure",
  "Risk Assessment",
  "Training Material",
  "Audit Report",
  "SOP",
  "Regulation",
  "Other",
];

const DATA_IMPORT_TYPES = [
  { key: "incident_records", label: "Incident Records", icon: AlertTriangle },
  { key: "near_miss", label: "Near Miss", icon: Shield },
  { key: "permit_records", label: "Permit Records", icon: FileText },
  { key: "audit_reports", label: "Audit Reports", icon: Check },
  { key: "training_records", label: "Training Records", icon: Users },
  { key: "sops_policies", label: "SOPs & Policies", icon: FileText },
  { key: "risk_assessments", label: "Risk Assessments", icon: AlertTriangle },
  { key: "capa_data", label: "CAPA Data", icon: Zap },
  { key: "hr_shift_data", label: "HR Shift Data", icon: Clock },
  { key: "contractor_records", label: "Contractor Records", icon: Building2 },
];

// ── Style helpers ──────────────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-100";
const inputStyle = { borderColor: "#E3E9F6" };
const labelCls = "block text-xs font-semibold mb-1";
const labelStyle = { color: "#6B7280" };
const primaryBtnCls = "px-4 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2 transition-opacity";
const primaryBtnStyle = { background: "linear-gradient(135deg, #4A57B9, #6F80E8)" };
const secondaryBtnCls = "px-4 py-2 rounded-xl text-sm font-semibold border flex items-center gap-2 transition-colors";
const secondaryBtnStyle = { borderColor: "#E3E9F6", color: "#6B7280" };
const cardCls = "bg-white rounded-2xl border p-5";
const cardStyle = { borderColor: "#E3E9F6" };

// ── Step Indicator ─────────────────────────────────────────────────────────────

function StepIndicator({
  currentStep,
  completedSteps,
  onStepClick,
}: {
  currentStep: number;
  completedSteps: number[];
  onStepClick?: (step: number) => void;
}) {
  // Steps beyond the furthest completed step + 1 are locked
  const maxReachable = completedSteps.length > 0
    ? Math.min(Math.max(...completedSteps) + 1, 8)
    : 1;

  return (
    <div className="bg-white rounded-2xl border p-5 overflow-x-auto" style={{ borderColor: "#E3E9F6" }}>
      <div className="flex items-center min-w-max gap-0">
        {STEP_LABELS.map((label, idx) => {
          const step = idx + 1;
          const isActive = step === currentStep;
          const isDone = completedSteps.includes(step);
          const isLocked = step > maxReachable;
          const isClickable = !isLocked && onStepClick;

          return (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                  style={
                    isDone
                      ? { background: "#10B981", color: "#fff", cursor: isClickable ? "pointer" : "default" }
                      : isActive
                      ? { background: "linear-gradient(135deg, #4A57B9, #6F80E8)", color: "#fff", boxShadow: "0 4px 12px rgba(74,87,185,0.35)", cursor: "default" }
                      : isLocked
                      ? { background: "#F3F4F6", color: "#D1D5DB", cursor: "not-allowed" }
                      : { background: "#F3F4F6", color: "#9CA3AF", cursor: isClickable ? "pointer" : "default" }
                  }
                  onClick={() => isClickable && onStepClick(step)}
                  title={isLocked ? "Complete previous steps first" : isDone ? `Go to step ${step}` : undefined}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : isLocked ? <Lock className="w-3.5 h-3.5" /> : <span>{step}</span>}
                </div>
                <span
                  className="text-[10px] font-semibold text-center w-16 leading-tight"
                  style={{ color: isActive ? "#4A57B9" : isDone ? "#10B981" : isLocked ? "#D1D5DB" : "#9CA3AF" }}
                >
                  {label}
                </span>
              </div>
              {idx < STEP_LABELS.length - 1 && (
                <div
                  className="h-0.5 w-8 mx-1 mb-5 rounded-full"
                  style={{ background: completedSteps.includes(step) ? "#10B981" : "#E3E9F6" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 1: Organization Details ───────────────────────────────────────────────

type OrgForm = {
  organizationName: string; industryType: string; employeeCount: string;
  numberOfSites: string; officialEmail: string; contactNumber: string;
  country: string; timezone: string; headquartersAddress: string;
};

const EMPTY_FORM: OrgForm = {
  organizationName: "", industryType: "", employeeCount: "",
  numberOfSites: "", officialEmail: "", contactNumber: "",
  country: "", timezone: "", headquartersAddress: "",
};

function OrgDetailsForm({ form, set }: { form: OrgForm; set: (k: string, v: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className={labelCls} style={labelStyle}>Organization Name *</label>
        <input className={inputCls} style={inputStyle} placeholder="Enter organization name" value={form.organizationName} onChange={(e) => set("organizationName", e.target.value)} />
      </div>
      <div>
        <label className={labelCls} style={labelStyle}>Industry Type</label>
        <select className={inputCls} style={inputStyle} value={form.industryType} onChange={(e) => set("industryType", e.target.value)}>
          <option value="">Select industry</option>
          {INDUSTRY_TYPES.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls} style={labelStyle}>Employee Count</label>
        <input type="number" className={inputCls} style={inputStyle} placeholder="0" value={form.employeeCount} onChange={(e) => set("employeeCount", e.target.value)} />
      </div>
      <div>
        <label className={labelCls} style={labelStyle}>Number of Sites</label>
        <input type="number" className={inputCls} style={inputStyle} placeholder="0" value={form.numberOfSites} onChange={(e) => set("numberOfSites", e.target.value)} />
      </div>
      <div>
        <label className={labelCls} style={labelStyle}>Official Email *</label>
        <input type="email" className={inputCls} style={inputStyle} placeholder="admin@company.com" value={form.officialEmail} onChange={(e) => set("officialEmail", e.target.value)} />
      </div>
      <div>
        <label className={labelCls} style={labelStyle}>Contact Number</label>
        <input className={inputCls} style={inputStyle} placeholder="+1 234 567 8900" value={form.contactNumber} onChange={(e) => set("contactNumber", e.target.value)} />
      </div>
      <div>
        <label className={labelCls} style={labelStyle}>Country</label>
        <input className={inputCls} style={inputStyle} placeholder="e.g. United States" value={form.country} onChange={(e) => set("country", e.target.value)} />
      </div>
      <div>
        <label className={labelCls} style={labelStyle}>Timezone</label>
        <select className={inputCls} style={inputStyle} value={form.timezone} onChange={(e) => set("timezone", e.target.value)}>
          <option value="">Select timezone</option>
          {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className={labelCls} style={labelStyle}>Headquarters Address</label>
        <textarea className={inputCls} style={inputStyle} rows={3} placeholder="Enter full address..." value={form.headquartersAddress} onChange={(e) => set("headquartersAddress", e.target.value)} />
      </div>
    </div>
  );
}

function Step1({
  onNext,
  dataEntryOption: parentDataEntryOption,
  onDataEntryChange,
}: {
  onNext: () => void;
  dataEntryOption: "manual" | "excel" | "api";
  onDataEntryChange: (opt: "manual" | "excel" | "api") => void;
}) {
  const [saveStep1, { isLoading: saving }] = useSaveOrgSetupStep1Mutation();
  const [parseExcel, { isLoading: parsing }] = useParseOrgExcelMutation();
  const [connectApi, { isLoading: connecting }] = useConnectOrgApiMutation();
  const { data: saved } = useGetOrgSetupStep1Query();
  const excelRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<OrgForm>(EMPTY_FORM);
  const [excelStatus, setExcelStatus] = useState<"idle" | "success" | "error">("idle");
  const [excelMsg, setExcelMsg] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [apiStatus, setApiStatus] = useState<"idle" | "success" | "error">("idle");
  const [apiMsg, setApiMsg] = useState("");
  const [stepError, setStepError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Pre-fill saved data
  useEffect(() => {
    if (saved && Object.keys(saved).length > 0) {
      const s = saved as Record<string, unknown>;
      setForm({
        organizationName: String(s.organizationName ?? ""),
        industryType: String(s.industryType ?? ""),
        employeeCount: String(s.employeeCount ?? ""),
        numberOfSites: String(s.numberOfSites ?? ""),
        officialEmail: String(s.officialEmail ?? ""),
        contactNumber: String(s.contactNumber ?? ""),
        country: String(s.country ?? ""),
        timezone: String(s.timezone ?? ""),
        headquartersAddress: String(s.headquartersAddress ?? ""),
      });
      if (s.dataEntryOption && ["manual", "excel", "api"].includes(s.dataEntryOption as string)) {
        onDataEntryChange(s.dataEntryOption as "manual" | "excel" | "api");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelStatus("idle");
    const fd = new FormData();
    fd.append("file", file);
    const result = await parseExcel(fd);
    // baseApi unwraps the envelope: result.data is already the org fields dict directly
    const parsed = "data" in result ? (result.data as Record<string, string>) : {};
    const fieldCount = Object.keys(parsed).filter((k) => parsed[k]).length;
    if (fieldCount > 0) {
      setForm((f) => ({ ...f, ...parsed }));
      setExcelStatus("success");
      setExcelMsg(`${fieldCount} fields imported — review and edit below, then click Next`);
    } else {
      setExcelStatus("error");
      setExcelMsg("Could not read org details from file. Make sure it uses the template format.");
    }
    if (excelRef.current) excelRef.current.value = "";
  };

  const handleApiConnect = async () => {
    if (!apiUrl.trim()) { setApiStatus("error"); setApiMsg("Please enter an API URL"); return; }
    setApiStatus("idle");
    const result = await connectApi({ url: apiUrl.trim(), api_key: apiKey.trim(), token: apiToken.trim() });
    if ("data" in result && result.data) {
      const d = result.data as Record<string, string>;
      const fieldCount = Object.keys(d).filter((k) => d[k]).length;
      if (fieldCount > 0) {
        setForm((f) => ({ ...f, ...d }));
        setApiStatus("success");
        setApiMsg(`Connected! ${fieldCount} fields populated — review below and click Next`);
      } else {
        setApiStatus("success");
        setApiMsg("Connected successfully. No matching org fields found — fill in the form below manually.");
      }
    } else {
      setApiStatus("error");
      setApiMsg("Connection failed — check the URL and try again");
    }
  };

  const handleNext = async () => {
    // Validate required fields
    if (!form.organizationName.trim()) {
      setStepError("Organization name is required to proceed.");
      return;
    }
    if (!form.officialEmail.trim()) {
      setStepError("Official email is required to proceed.");
      return;
    }
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(form.officialEmail.trim())) {
      setStepError("Please enter a valid email address (e.g. admin@company.com).");
      return;
    }
    setStepError("");
    await saveStep1({
      ...form,
      employeeCount: Number(form.employeeCount) || 0,
      numberOfSites: Number(form.numberOfSites) || 0,
      dataEntryOption: parentDataEntryOption,
      ...(parentDataEntryOption === "api" ? { apiUrl, apiKey, apiToken } : {}),
    });
    onNext();
  };

  const methods = [
    {
      key: "manual" as const,
      label: "Manual Entry",
      icon: "✏️",
      desc: "Fill in the organization details directly using the form",
      color: "#4A57B9",
      bg: "#EEF2FF",
    },
    {
      key: "excel" as const,
      label: "Excel / CSV Upload",
      icon: "📊",
      desc: "Upload a spreadsheet to automatically populate organization details",
      color: "#059669",
      bg: "#D1FAE5",
    },
    {
      key: "api" as const,
      label: "API Integration",
      icon: "🔗",
      desc: "Connect to your existing ERP, HRMS, or external system via REST API",
      color: "#7C3AED",
      bg: "#F5F3FF",
    },
  ];

  const active = parentDataEntryOption;

  return (
    <div className="space-y-5">
      {/* Method Selector */}
      <div className={cardCls} style={cardStyle}>
        <h2 className="text-base font-bold mb-1" style={{ color: "#111827" }}>How would you like to set up your organization?</h2>
        <p className="text-xs mb-4" style={{ color: "#6B7280" }}>Select a method — your choice determines how data is entered in all steps.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {methods.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => onDataEntryChange(m.key)}
              className="p-5 rounded-2xl border-2 text-left transition-all"
              style={active === m.key
                ? { borderColor: m.color, background: m.bg, boxShadow: `0 0 0 3px ${m.color}22` }
                : { borderColor: "#E3E9F6", background: "#fff" }}
            >
              <div className="text-2xl mb-2">{m.icon}</div>
              <div className="text-sm font-bold mb-1" style={{ color: active === m.key ? m.color : "#111827" }}>{m.label}</div>
              <div className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>{m.desc}</div>
              {active === m.key && (
                <div className="mt-2 text-xs font-semibold px-2 py-0.5 rounded-full w-fit" style={{ background: m.color, color: "#fff" }}>Selected</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Manual Entry ── */}
      {active === "manual" && (
        <div className={cardCls} style={{ ...cardStyle, borderColor: "#4A57B9", borderWidth: 2 }}>
          <h2 className="text-base font-bold mb-4" style={{ color: "#111827" }}>Organization Information</h2>
          <OrgDetailsForm form={form} set={set} />
        </div>
      )}

      {/* ── Excel / CSV Upload ── */}
      {active === "excel" && (
        <>
          <div className={cardCls} style={{ ...cardStyle, borderColor: "#059669", borderWidth: 2 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold" style={{ color: "#111827" }}>Upload Organization Details</h2>
              <button
                className={secondaryBtnCls}
                style={secondaryBtnStyle}
                onClick={() => downloadTemplate("/org-setup/step1/template", "org_details_template.csv")}
              >
                <Download className="w-4 h-4" /> Download Template
              </button>
            </div>
            <p className="text-xs mb-4" style={{ color: "#6B7280" }}>
              Download the template, fill in your organization details, then upload the completed file.
            </p>

            {excelStatus === "success" && (
              <div className="mb-4 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "#D1FAE5", color: "#059669" }}>
                ✓ {excelMsg}
              </div>
            )}
            {excelStatus === "error" && (
              <div className="mb-4 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "#FEF2F2", color: "#EF4444" }}>
                {excelMsg}
              </div>
            )}

            <label
              className="flex flex-col items-center justify-center w-full py-10 rounded-2xl border-2 border-dashed cursor-pointer transition-colors"
              style={{ borderColor: "#6EE7B7", background: "#F0FDF4" }}
            >
              {parsing
                ? <Loader2 className="w-10 h-10 mb-3 animate-spin" style={{ color: "#059669" }} />
                : <Upload className="w-10 h-10 mb-3" style={{ color: "#059669" }} />}
              <span className="text-sm font-bold" style={{ color: "#059669" }}>
                {parsing ? "Parsing file…" : "Click to upload or drag & drop"}
              </span>
              <span className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Excel (.xlsx, .xls) or CSV</span>
              <input ref={excelRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelUpload} />
            </label>
          </div>

          {/* Preview / edit form after upload */}
          {excelStatus === "success" && (
            <div className={cardCls} style={cardStyle}>
              <h2 className="text-base font-bold mb-4" style={{ color: "#111827" }}>Review & Edit Details</h2>
              <OrgDetailsForm form={form} set={set} />
            </div>
          )}
        </>
      )}

      {/* ── API Integration ── */}
      {active === "api" && (
        <>
          <div className={cardCls} style={{ ...cardStyle, borderColor: "#7C3AED", borderWidth: 2 }}>
            <h2 className="text-base font-bold mb-1" style={{ color: "#111827" }}>Connect via API</h2>
            <p className="text-xs mb-4" style={{ color: "#6B7280" }}>
              Enter your system's API endpoint and credentials. We'll pull your organization details automatically.
            </p>

            {apiStatus === "success" && (
              <div className="mb-4 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "#F5F3FF", color: "#7C3AED" }}>
                ✓ {apiMsg}
              </div>
            )}
            {apiStatus === "error" && (
              <div className="mb-4 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "#FEF2F2", color: "#EF4444" }}>
                {apiMsg}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className={labelCls} style={labelStyle}>API Endpoint URL *</label>
                <input className={inputCls} style={inputStyle} placeholder="https://api.yourcompany.com/org/info" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} style={labelStyle}>API Key</label>
                  <input className={inputCls} style={inputStyle} placeholder="Your API key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>Bearer Token</label>
                  <input className={inputCls} style={inputStyle} placeholder="Bearer token (if applicable)" value={apiToken} onChange={(e) => setApiToken(e.target.value)} />
                </div>
              </div>
              <button
                className={primaryBtnCls}
                style={{ ...primaryBtnStyle, background: "linear-gradient(135deg,#7C3AED,#9F67F5)" }}
                onClick={handleApiConnect}
                disabled={connecting}
              >
                {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {connecting ? "Connecting…" : "Connect & Pull Data"}
              </button>
            </div>
          </div>

          {/* Review form after API pull (or always show for manual fill-in) */}
          <div className={cardCls} style={cardStyle}>
            <h2 className="text-base font-bold mb-4" style={{ color: "#111827" }}>
              {apiStatus === "success" ? "Review & Edit Details" : "Organization Details"}
            </h2>
            {apiStatus !== "success" && (
              <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>
                Connect to your API above to auto-fill, or enter details manually below.
              </p>
            )}
            <OrgDetailsForm form={form} set={set} />
          </div>
        </>
      )}

      {stepError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {stepError}
        </div>
      )}
      <div className="flex justify-end">
        <button className={primaryBtnCls} style={primaryBtnStyle} onClick={handleNext} disabled={saving || (active === "excel" && excelStatus === "idle" && !form.organizationName)}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Next Step <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Step 2: Industry & Compliance Setup ────────────────────────────────────────

function Step2({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [saveStep2, { isLoading }] = useSaveOrgSetupStep2Mutation();
  const [stepError, setStepError] = useState("");

  const [selectedStandards, setSelectedStandards] = useState<string[]>([]);
  const [regulatoryRegion, setRegulatoryRegion] = useState("");
  const [severityMatrix, setSeverityMatrix] = useState([
    { level: "Low", description: "" },
    { level: "Medium", description: "" },
    { level: "High", description: "" },
    { level: "Critical", description: "" },
  ]);
  const [auditFrequency, setAuditFrequency] = useState("");
  const [capaCritical, setCapaCritical] = useState("");
  const [capaStandard, setCapaStandard] = useState("");
  const [selectedPermits, setSelectedPermits] = useState<string[]>([]);

  const toggleStandard = (s: string) =>
    setSelectedStandards((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const togglePermit = (p: string) =>
    setSelectedPermits((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  const updateSeverity = (idx: number, desc: string) => {
    setSeverityMatrix((prev) => prev.map((row, i) => i === idx ? { ...row, description: desc } : row));
  };

  const handleNext = async () => {
    if (selectedStandards.length === 0) {
      setStepError("Please select at least one compliance standard before proceeding.");
      return;
    }
    setStepError("");
    await saveStep2({
      applicableStandards: selectedStandards,
      regulatoryRegion,
      incidentSeverityMatrix: severityMatrix,
      auditFrequency,
      capaSlaCriticalDays: Number(capaCritical),
      capaSlaStandardDays: Number(capaStandard),
      permitTypes: selectedPermits,
    });
    onNext();
  };

  const severityColors: Record<string, string> = {
    Low: "#10B981",
    Medium: "#F59E0B",
    High: "#EF4444",
    Critical: "#7C3AED",
  };

  const riskMatrix = [
    ["Rare", "Unlikely", "Possible"],
    ["Minor", "Moderate", "Major"],
    ["Low", "Medium", "High"],
  ];

  const riskColors = [
    ["#10B981", "#F59E0B", "#F59E0B"],
    ["#F59E0B", "#F59E0B", "#EF4444"],
    ["#10B981", "#EF4444", "#EF4444"],
  ];

  return (
    <div className="space-y-5">
      <div className={cardCls} style={cardStyle}>
        <h2 className="text-base font-bold mb-4" style={{ color: "#111827" }}>Applicable Standards</h2>
        <div className="flex flex-wrap gap-3">
          {STANDARDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleStandard(s)}
              className="px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all"
              style={selectedStandards.includes(s)
                ? { borderColor: "#4A57B9", background: "#EEF2FF", color: "#4A57B9" }
                : { borderColor: "#E3E9F6", color: "#6B7280" }}
            >
              {selectedStandards.includes(s) && <span className="mr-1">✓</span>}
              {s}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <label className={labelCls} style={labelStyle}>Regulatory Region</label>
          <input className={inputCls} style={inputStyle} placeholder="e.g. EU, US-OSHA, UK-HSE" value={regulatoryRegion} onChange={(e) => setRegulatoryRegion(e.target.value)} />
        </div>
      </div>

      <div className={cardCls} style={cardStyle}>
        <h2 className="text-base font-bold mb-4" style={{ color: "#111827" }}>Incident Severity Matrix</h2>
        <div className="space-y-3">
          {severityMatrix.map((row, idx) => (
            <div key={row.level} className="flex items-center gap-3">
              <span
                className="w-20 text-xs font-bold px-2 py-1 rounded-lg text-center flex-shrink-0"
                style={{ background: severityColors[row.level] + "20", color: severityColors[row.level] }}
              >
                {row.level}
              </span>
              <input
                className={inputCls}
                style={inputStyle}
                placeholder={`Description for ${row.level} severity...`}
                value={row.description}
                onChange={(e) => updateSeverity(idx, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className={cardCls} style={cardStyle}>
        <h2 className="text-base font-bold mb-4" style={{ color: "#111827" }}>Risk Matrix (Likelihood × Severity)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="p-2 text-left" style={{ color: "#9CA3AF" }}>Likelihood \ Severity</th>
                <th className="p-2 text-center" style={{ color: "#9CA3AF" }}>Minor</th>
                <th className="p-2 text-center" style={{ color: "#9CA3AF" }}>Moderate</th>
                <th className="p-2 text-center" style={{ color: "#9CA3AF" }}>Major</th>
              </tr>
            </thead>
            <tbody>
              {riskMatrix.map((row, ri) => (
                <tr key={ri}>
                  <td className="p-2 font-semibold" style={{ color: "#6B7280" }}>
                    {["High", "Medium", "Low"][ri]}
                  </td>
                  {row.map((cell, ci) => (
                    <td key={ci} className="p-2 text-center">
                      <span
                        className="px-3 py-1 rounded-lg text-xs font-bold"
                        style={{ background: riskColors[ri][ci] + "25", color: riskColors[ri][ci] }}
                      >
                        {cell}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={cardCls} style={cardStyle}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls} style={labelStyle}>Audit Frequency</label>
            <select className={inputCls} style={inputStyle} value={auditFrequency} onChange={(e) => setAuditFrequency(e.target.value)}>
              <option value="">Select frequency</option>
              {["Monthly", "Quarterly", "Bi-Annual", "Annual"].map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>CAPA SLA — Critical (days)</label>
            <input type="number" className={inputCls} style={inputStyle} placeholder="7" value={capaCritical} onChange={(e) => setCapaCritical(e.target.value)} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>CAPA SLA — Standard (days)</label>
            <input type="number" className={inputCls} style={inputStyle} placeholder="30" value={capaStandard} onChange={(e) => setCapaStandard(e.target.value)} />
          </div>
        </div>
      </div>

      <div className={cardCls} style={cardStyle}>
        <h2 className="text-base font-bold mb-4" style={{ color: "#111827" }}>Permit Types</h2>
        <div className="flex flex-wrap gap-2">
          {PERMIT_TYPES_LIST.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => togglePermit(p)}
              className="px-3 py-1.5 rounded-full border text-xs font-semibold transition-all"
              style={selectedPermits.includes(p)
                ? { borderColor: "#4A57B9", background: "#EEF2FF", color: "#4A57B9" }
                : { borderColor: "#E3E9F6", color: "#6B7280" }}
            >
              {selectedPermits.includes(p) && "✓ "}
              {p}
            </button>
          ))}
        </div>
      </div>

      {stepError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {stepError}
        </div>
      )}
      <div className="flex justify-between">
        <button className={secondaryBtnCls} style={secondaryBtnStyle} onClick={onBack}>Back</button>
        <button className={primaryBtnCls} style={primaryBtnStyle} onClick={handleNext} disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Next Step <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Site Structure Setup ───────────────────────────────────────────────

function Step3({
  onNext,
  onBack,
  dataEntryOption,
}: {
  onNext: () => void;
  onBack: () => void;
  dataEntryOption: "manual" | "excel" | "api";
}) {
  const { data: sites = [], isLoading: sitesLoading, refetch } = useGetOrgSetupStep3SitesQuery();
  const [createSite, { isLoading: creating }] = useCreateOrgSetupSiteMutation();
  const [bulkUpload, { isLoading: uploading }] = useBulkUploadOrgSetupSitesMutation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadSuccess, setUploadSuccess] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [nextError, setNextError] = useState("");

  const [form, setForm] = useState({ name: "", type: "", address: "" });
  const [error, setError] = useState("");

  const handleAdd = async () => {
    if (!form.name.trim()) { setError("Site name is required"); return; }
    setError("");
    await createSite({ name: form.name, type: form.type, address: form.address });
    setForm({ name: "", type: "", address: "" });
    refetch();
  };

  const handleBulkFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploadSuccess(null);
    const fd = new FormData();
    fd.append("file", file);
    const result = await bulkUpload(fd);
    if ("data" in result) {
      const d = result.data as { count?: number };
      setUploadSuccess(d?.count ?? 0);
    } else {
      setUploadError("Upload failed. Check that your file has Name, Type, Address columns.");
    }
    refetch();
    if (fileRef.current) fileRef.current.value = "";
  };

  const bulkUploadCard = (
    <div className={cardCls} style={{ ...cardStyle, borderColor: dataEntryOption === "excel" ? "#4A57B9" : "#E3E9F6", borderWidth: dataEntryOption === "excel" ? 2 : 1 }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold" style={{ color: "#111827" }}>
          {dataEntryOption === "excel" ? "Upload Sites — Excel / CSV" : "Bulk Upload"}
        </h2>
        {dataEntryOption === "excel" && (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "#EEF2FF", color: "#4A57B9" }}>Preferred method</span>
        )}
      </div>
      {uploadSuccess !== null && (
        <div className="mb-3 text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: "#D1FAE5", color: "#059669" }}>
          ✓ {uploadSuccess} site{uploadSuccess !== 1 ? "s" : ""} imported successfully
        </div>
      )}
      {uploadError && (
        <div className="mb-3 text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: "#FEF2F2", color: "#EF4444" }}>{uploadError}</div>
      )}
      <label
        className="flex flex-col items-center justify-center w-full py-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors mb-3"
        style={{ borderColor: "#C7D2FE", background: uploading ? "#F5F7FF" : "#F8FAFF" }}
      >
        {uploading
          ? <Loader2 className="w-8 h-8 mb-2 animate-spin" style={{ color: "#4A57B9" }} />
          : <Upload className="w-8 h-8 mb-2" style={{ color: "#4A57B9" }} />}
        <span className="text-sm font-semibold" style={{ color: "#4A57B9" }}>
          {uploading ? "Uploading…" : "Click to upload or drag & drop"}
        </span>
        <span className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Excel (.xlsx, .xls) or CSV — columns: Name, Type, Address</span>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleBulkFile} />
      </label>
      <button className={secondaryBtnCls} style={secondaryBtnStyle} onClick={() => downloadTemplate("/org-setup/step3/template", "sites_template.csv")}>
        <Download className="w-4 h-4" /> Download Template
      </button>
    </div>
  );

  const manualCard = (
    <div className={cardCls} style={cardStyle}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold" style={{ color: "#111827" }}>Add a Site Manually</h2>
        {dataEntryOption !== "manual" && (
          <span className="text-xs" style={{ color: "#9CA3AF" }}>optional</span>
        )}
      </div>
      {error && <div className="mb-3 text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: "#FEF2F2", color: "#EF4444" }}>{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div>
          <label className={labelCls} style={labelStyle}>Site Name *</label>
          <input className={inputCls} style={inputStyle} placeholder="Site name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Type</label>
          <select className={inputCls} style={inputStyle} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            <option value="">Select type</option>
            {SITE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Address</label>
          <input className={inputCls} style={inputStyle} placeholder="Address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        </div>
      </div>
      <button className={primaryBtnCls} style={primaryBtnStyle} onClick={handleAdd} disabled={creating}>
        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Add Site
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      {dataEntryOption === "excel" ? (
        <>{bulkUploadCard}{manualCard}</>
      ) : dataEntryOption === "api" ? (
        <>
          <div className={cardCls} style={{ ...cardStyle, borderColor: "#4A57B9", borderWidth: 2 }}>
            <h2 className="text-base font-bold mb-2" style={{ color: "#111827" }}>API Integration — Sites</h2>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Your API integration preference will sync sites automatically once the platform is active. You can still add sites manually below, or upload a CSV to seed your initial data.
            </p>
          </div>
          {bulkUploadCard}
          {manualCard}
        </>
      ) : (
        <>{manualCard}{bulkUploadCard}</>
      )}

      {/* Sites Table */}
      <div className={cardCls} style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-base font-bold" style={{ color: "#111827" }}>Sites ({sites.length})</h2>
        </div>
        {sitesLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#4A57B9" }} /></div>
        ) : sites.length === 0 ? (
          <div className="text-center py-10 text-sm" style={{ color: "#9CA3AF" }}>No sites added yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Type</th>
                <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Address</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((site) => (
                <tr key={site.id} className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-5 py-3 font-medium" style={{ color: "#111827" }}>{site.name}</td>
                  <td className="px-5 py-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "#EEF2FF", color: "#4A57B9" }}>{site.type}</span>
                  </td>
                  <td className="px-5 py-3" style={{ color: "#6B7280" }}>{site.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {nextError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {nextError}
        </div>
      )}
      <div className="flex justify-between">
        <button className={secondaryBtnCls} style={secondaryBtnStyle} onClick={onBack}>Back</button>
        <button
          className={primaryBtnCls}
          style={primaryBtnStyle}
          onClick={() => {
            if (sites.length === 0) {
              setNextError("Please add at least one site before proceeding to the next step.");
              return;
            }
            setNextError("");
            onNext();
          }}
        >
          Next Step <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Step 4: Roles & Users Setup ────────────────────────────────────────────────

function Step4({
  onNext,
  onBack,
  dataEntryOption,
}: {
  onNext: () => void;
  onBack: () => void;
  dataEntryOption: "manual" | "excel" | "api";
}) {
  const { data: users = [], isLoading: usersLoading, refetch } = useGetOrgSetupStep4UsersQuery();
  const [createUser, { isLoading: creating }] = useCreateOrgSetupUserMutation();
  const [bulkUpload, { isLoading: uploading }] = useBulkUploadOrgSetupUsersMutation();
  const fileRef = useRef<HTMLInputElement>(null);

  const [hrmsImport, { isLoading: hrmsLoading }] = useHrmsImportMutation();
  const [nextError, setNextError] = useState("");

  const [form, setForm] = useState({ name: "", email: "", role: "", department: "" });
  const [error, setError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [showHrmsModal, setShowHrmsModal] = useState(false);
  const [hrmsUrl, setHrmsUrl] = useState("");
  const [hrmsToken, setHrmsToken] = useState("");
  const [hrmsError, setHrmsError] = useState("");

  const handleAdd = async () => {
    if (!form.name.trim() || !form.email.trim()) { setError("Name and email are required"); return; }
    setError("");
    await createUser({ name: form.name, email: form.email, role: form.role, department: form.department });
    setForm({ name: "", email: "", role: "", department: "" });
    refetch();
  };

  const handleBulkFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploadSuccess(null);
    const fd = new FormData();
    fd.append("file", file);
    const result = await bulkUpload(fd);
    if ("data" in result) {
      const d = result.data as { count?: number };
      setUploadSuccess(d?.count ?? 0);
    } else {
      setUploadError("Upload failed. Check that your file has Name, Email, Role, Department columns.");
    }
    refetch();
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleHrmsConnect = async () => {
    if (!hrmsUrl.trim()) { setHrmsError("Please enter the HRMS API URL"); return; }
    setHrmsError("");
    const result = await hrmsImport({ url: hrmsUrl.trim(), token: hrmsToken.trim() });
    if ("data" in result && (result.data as { error?: string })?.error) {
      setHrmsError((result.data as { error: string }).error);
      return;
    }
    setShowHrmsModal(false);
    setHrmsUrl("");
    setHrmsToken("");
    refetch();
  };

  const bulkUploadCard = (
    <div className={cardCls} style={{ ...cardStyle, borderColor: dataEntryOption === "excel" ? "#4A57B9" : "#E3E9F6", borderWidth: dataEntryOption === "excel" ? 2 : 1 }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold" style={{ color: "#111827" }}>
          {dataEntryOption === "excel" ? "Upload Users — Excel / CSV" : "Bulk Upload"}
        </h2>
        {dataEntryOption === "excel" && (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "#EEF2FF", color: "#4A57B9" }}>Preferred method</span>
        )}
      </div>
      {uploadSuccess !== null && (
        <div className="mb-3 text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: "#D1FAE5", color: "#059669" }}>
          ✓ {uploadSuccess} user{uploadSuccess !== 1 ? "s" : ""} imported successfully
        </div>
      )}
      {uploadError && (
        <div className="mb-3 text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: "#FEF2F2", color: "#EF4444" }}>{uploadError}</div>
      )}
      <label
        className="flex flex-col items-center justify-center w-full py-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors mb-3"
        style={{ borderColor: "#C7D2FE", background: uploading ? "#F5F7FF" : "#F8FAFF" }}
      >
        {uploading
          ? <Loader2 className="w-8 h-8 mb-2 animate-spin" style={{ color: "#4A57B9" }} />
          : <Upload className="w-8 h-8 mb-2" style={{ color: "#4A57B9" }} />}
        <span className="text-sm font-semibold" style={{ color: "#4A57B9" }}>
          {uploading ? "Uploading…" : "Click to upload or drag & drop"}
        </span>
        <span className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Excel (.xlsx, .xls) or CSV — columns: Name, Email, Role, Department</span>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleBulkFile} />
      </label>
      <div className="flex gap-2 flex-wrap">
        <button className={secondaryBtnCls} style={secondaryBtnStyle} onClick={() => downloadTemplate("/org-setup/step4/template", "users_template.csv")}>
          <Download className="w-4 h-4" /> Download Template
        </button>
        <button className={secondaryBtnCls} style={secondaryBtnStyle} onClick={() => setShowHrmsModal(true)}>
          <Users className="w-4 h-4" /> Import from HRMS
        </button>
      </div>
    </div>
  );

  const manualCard = (
    <div className={cardCls} style={cardStyle}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold" style={{ color: "#111827" }}>Add User Manually</h2>
        {dataEntryOption !== "manual" && <span className="text-xs" style={{ color: "#9CA3AF" }}>optional</span>}
      </div>
      {error && <div className="mb-3 text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: "#FEF2F2", color: "#EF4444" }}>{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <div>
          <label className={labelCls} style={labelStyle}>Full Name *</label>
          <input className={inputCls} style={inputStyle} placeholder="Full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Email *</label>
          <input type="email" className={inputCls} style={inputStyle} placeholder="user@company.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Role</label>
          <select className={inputCls} style={inputStyle} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
            <option value="">Select role</option>
            {USER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Department</label>
          <input className={inputCls} style={inputStyle} placeholder="Department" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} />
        </div>
      </div>
      <button className={primaryBtnCls} style={primaryBtnStyle} onClick={handleAdd} disabled={creating}>
        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Add User
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      {showHrmsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" style={{ border: "1px solid #E3E9F6" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: "#111827" }}>Import from HRMS</h3>
              <button onClick={() => setShowHrmsModal(false)}><X className="w-5 h-5" style={{ color: "#9CA3AF" }} /></button>
            </div>
            {hrmsError && <div className="mb-3 text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: "#FEF2F2", color: "#EF4444" }}>{hrmsError}</div>}
            <label className={labelCls} style={labelStyle}>HRMS API Endpoint URL *</label>
            <input className={`${inputCls} mb-3`} style={inputStyle} placeholder="https://hrms.company.com/api/employees" value={hrmsUrl} onChange={(e) => setHrmsUrl(e.target.value)} />
            <label className={labelCls} style={labelStyle}>API Token (optional)</label>
            <input className={`${inputCls} mb-4`} style={inputStyle} placeholder="Bearer token or API key" value={hrmsToken} onChange={(e) => setHrmsToken(e.target.value)} />
            <div className="flex gap-3">
              <button className={primaryBtnCls} style={primaryBtnStyle} onClick={handleHrmsConnect} disabled={hrmsLoading}>
                {hrmsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Connect & Import
              </button>
              <button className={secondaryBtnCls} style={secondaryBtnStyle} onClick={() => setShowHrmsModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {dataEntryOption === "excel" ? (
        <>{bulkUploadCard}{manualCard}</>
      ) : dataEntryOption === "api" ? (
        <>
          <div className={cardCls} style={{ ...cardStyle, borderColor: "#4A57B9", borderWidth: 2 }}>
            <h2 className="text-base font-bold mb-2" style={{ color: "#111827" }}>API Integration — Users</h2>
            <p className="text-sm mb-3" style={{ color: "#6B7280" }}>
              Connect your HRMS to automatically import employees. You can also upload a CSV or add users manually below.
            </p>
            <button className={primaryBtnCls} style={primaryBtnStyle} onClick={() => setShowHrmsModal(true)}>
              <Users className="w-4 h-4" /> Connect HRMS / API
            </button>
          </div>
          {bulkUploadCard}
          {manualCard}
        </>
      ) : (
        <>{manualCard}{bulkUploadCard}</>
      )}

      <div className={cardCls} style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-base font-bold" style={{ color: "#111827" }}>Users ({users.length})</h2>
        </div>
        {usersLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#4A57B9" }} /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-10 text-sm" style={{ color: "#9CA3AF" }}>No users added yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Email</th>
                <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Role</th>
                <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Department</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-5 py-3 font-medium" style={{ color: "#111827" }}>{user.name}</td>
                  <td className="px-5 py-3" style={{ color: "#6B7280" }}>{user.email}</td>
                  <td className="px-5 py-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "#EEF2FF", color: "#4A57B9" }}>{user.role}</span>
                  </td>
                  <td className="px-5 py-3" style={{ color: "#6B7280" }}>{user.department}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {nextError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {nextError}
        </div>
      )}
      <div className="flex justify-between">
        <button className={secondaryBtnCls} style={secondaryBtnStyle} onClick={onBack}>Back</button>
        <button
          className={primaryBtnCls}
          style={primaryBtnStyle}
          onClick={() => {
            if (users.length === 0) {
              setNextError("Please add at least one user before proceeding to the next step.");
              return;
            }
            setNextError("");
            onNext();
          }}
        >
          Next Step <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Step 5: Workflow Configuration ─────────────────────────────────────────────

type WorkflowState = Record<string, { enabled: boolean; config: string; expanded: boolean }>;

function Step5({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [saveStep5, { isLoading }] = useSaveOrgSetupStep5Mutation();

  const initialWorkflows: WorkflowState = {};
  WORKFLOW_CARDS.forEach(({ key }) => {
    initialWorkflows[key] = { enabled: true, config: "", expanded: false };
  });
  const [workflows, setWorkflows] = useState<WorkflowState>(initialWorkflows);

  const toggle = (key: string, field: "enabled" | "expanded") => {
    setWorkflows((prev) => ({ ...prev, [key]: { ...prev[key], [field]: !prev[key][field] } }));
  };
  const setConfig = (key: string, v: string) => {
    setWorkflows((prev) => ({ ...prev, [key]: { ...prev[key], config: v } }));
  };

  const handleNext = async () => {
    const payload = {
      workflows: WORKFLOW_CARDS.map(({ key, label }) => ({
        name: label,
        enabled: workflows[key].enabled,
        config: workflows[key].config,
      })),
    };
    await saveStep5(payload);
    onNext();
  };

  return (
    <div className="space-y-5">
      <div className={cardCls} style={cardStyle}>
        <h2 className="text-base font-bold mb-4" style={{ color: "#111827" }}>Workflow Configuration</h2>
        <p className="text-sm mb-4" style={{ color: "#6B7280" }}>Enable and configure each workflow type for your organization</p>
        <div className="space-y-3">
          {WORKFLOW_CARDS.map(({ key, label }) => (
            <div key={key} className="rounded-xl border" style={{ borderColor: "#E3E9F6" }}>
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => toggle(key, "expanded")}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggle(key, "enabled"); }}
                    className="w-10 h-5.5 rounded-full flex items-center transition-colors relative p-0.5"
                    style={{
                      background: workflows[key].enabled ? "linear-gradient(135deg, #4A57B9, #6F80E8)" : "#E5E7EB",
                      minWidth: "2.5rem",
                      height: "1.5rem",
                    }}
                  >
                    <span
                      className="block w-4 h-4 rounded-full bg-white shadow transition-transform"
                      style={{ transform: workflows[key].enabled ? "translateX(1rem)" : "translateX(0)" }}
                    />
                  </button>
                  <span className="text-sm font-semibold" style={{ color: "#111827" }}>{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={workflows[key].enabled ? { background: "#D1FAE5", color: "#059669" } : { background: "#F3F4F6", color: "#9CA3AF" }}>
                    {workflows[key].enabled ? "Enabled" : "Disabled"}
                  </span>
                  {workflows[key].expanded
                    ? <ChevronDown className="w-4 h-4" style={{ color: "#9CA3AF" }} />
                    : <ChevronRight className="w-4 h-4" style={{ color: "#9CA3AF" }} />}
                </div>
              </div>
              {workflows[key].expanded && (
                <div className="px-4 pb-4 border-t" style={{ borderColor: "#F3F4F6" }}>
                  <label className={`${labelCls} mt-3`} style={labelStyle}>Configuration / Description</label>
                  <textarea
                    className={inputCls}
                    style={inputStyle}
                    rows={4}
                    placeholder={`Enter ${label} configuration or JSON...`}
                    value={workflows[key].config}
                    onChange={(e) => setConfig(key, e.target.value)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button className={secondaryBtnCls} style={secondaryBtnStyle} onClick={onBack}>Back</button>
        <button className={primaryBtnCls} style={primaryBtnStyle} onClick={handleNext} disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Next Step <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Step 6: Knowledge Centre + 6A AI Data Import ───────────────────────────────

function Step6({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<"knowledge" | "import">("knowledge");
  const { data: documents = [], isLoading: docsLoading, refetch: refetchDocs } = useGetOrgSetupStep6DocumentsQuery();
  const { data: imports = [], isLoading: importsLoading, refetch: refetchImports } = useGetOrgSetupStep6aImportsQuery();
  const [uploadKnowledge, { isLoading: uploading }] = useUploadOrgSetupKnowledgeMutation();
  const [importData, { isLoading: importing }] = useImportOrgSetupDataMutation();
  const [nextError, setNextError] = useState("");

  const docFileRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const [docForm, setDocForm] = useState({ name: "", type: "" });
  const [selectedDataType, setSelectedDataType] = useState("");
  const [importMethod, setImportMethod] = useState<"manual" | "bulk" | "api">("bulk");
  const [apiUrl, setApiUrl] = useState("");

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKB = Math.round(file.size / 1024);
    await uploadKnowledge({
      name: docForm.name || file.name,
      type: docForm.type,
      size: sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)}MB` : `${sizeKB}KB`,
      fileName: file.name,
    });
    setDocForm({ name: "", type: "" });
    refetchDocs();
    if (docFileRef.current) docFileRef.current.value = "";
  };

  const handleImport = async (e?: React.ChangeEvent<HTMLInputElement>) => {
    if (importMethod === "api") {
      await importData({ dataType: selectedDataType, method: "api", url: apiUrl });
      refetchImports();
      return;
    }
    const file = e?.target.files?.[0];
    if (!file) return;
    await importData({ dataType: selectedDataType, method: importMethod, fileName: file.name });
    refetchImports();
    if (importFileRef.current) importFileRef.current.value = "";
  };

  return (
    <div className="space-y-5">
      {/* Tab Switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(["knowledge", "import"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-1.5 rounded-lg text-sm font-semibold transition-all"
            style={tab === t ? { background: "#fff", color: "#4A57B9", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" } : { color: "#6B7280" }}
          >
            {t === "knowledge" ? "Knowledge Centre" : "AI Data Import"}
          </button>
        ))}
      </div>

      {tab === "knowledge" && (
        <>
          <div className={cardCls} style={cardStyle}>
            <h2 className="text-base font-bold mb-4" style={{ color: "#111827" }}>Upload Document</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div>
                <label className={labelCls} style={labelStyle}>Document Name</label>
                <input className={inputCls} style={inputStyle} placeholder="Enter document name" value={docForm.name} onChange={(e) => setDocForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Document Type</label>
                <select className={inputCls} style={inputStyle} value={docForm.type} onChange={(e) => setDocForm((f) => ({ ...f, type: e.target.value }))}>
                  <option value="">Select type</option>
                  {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <label
              className="flex flex-col items-center justify-center w-full py-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors"
              style={{ borderColor: "#C7D2FE", background: "#F5F7FF" }}
            >
              <Upload className="w-8 h-8 mb-2" style={{ color: "#4A57B9" }} />
              <span className="text-sm font-semibold" style={{ color: "#4A57B9" }}>{uploading ? "Uploading…" : "Click to upload or drag & drop"}</span>
              <span className="text-xs mt-1" style={{ color: "#9CA3AF" }}>PDF, DOCX, XLSX, CSV — Max 50MB</span>
              <input ref={docFileRef} type="file" className="hidden" accept=".pdf,.docx,.doc,.xlsx,.xls,.csv" onChange={handleDocUpload} />
            </label>
          </div>

          <div className={cardCls} style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: "#E3E9F6" }}>
              <h2 className="text-base font-bold" style={{ color: "#111827" }}>Uploaded Documents ({documents.length})</h2>
            </div>
            {docsLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#4A57B9" }} /></div>
            ) : documents.length === 0 ? (
              <div className="text-center py-10 text-sm" style={{ color: "#9CA3AF" }}>No documents uploaded yet</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#F9FAFB" }}>
                    <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Name</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Type</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Size</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                      <td className="px-5 py-3 font-medium" style={{ color: "#111827" }}>{doc.name}</td>
                      <td className="px-5 py-3">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "#EEF2FF", color: "#4A57B9" }}>{doc.type}</span>
                      </td>
                      <td className="px-5 py-3" style={{ color: "#6B7280" }}>{doc.size}</td>
                      <td className="px-5 py-3" style={{ color: "#6B7280" }}>{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab === "import" && (
        <>
          <div className={cardCls} style={cardStyle}>
            <h2 className="text-base font-bold mb-4" style={{ color: "#111827" }}>Select Data Type</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {DATA_IMPORT_TYPES.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDataType(key)}
                  className="p-3 rounded-xl border-2 text-center transition-all"
                  style={selectedDataType === key
                    ? { borderColor: "#4A57B9", background: "#EEF2FF" }
                    : { borderColor: "#E3E9F6", background: "#fff" }}
                >
                  <Icon className="w-5 h-5 mx-auto mb-1.5" style={{ color: selectedDataType === key ? "#4A57B9" : "#9CA3AF" }} />
                  <span className="text-xs font-semibold" style={{ color: selectedDataType === key ? "#4A57B9" : "#374151" }}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={cardCls} style={cardStyle}>
            <h2 className="text-base font-bold mb-4" style={{ color: "#111827" }}>Import Method</h2>
            <div className="flex gap-3 mb-5 flex-wrap">
              {(["manual", "bulk", "api"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setImportMethod(m)}
                  className="px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all capitalize"
                  style={importMethod === m
                    ? { borderColor: "#4A57B9", background: "#EEF2FF", color: "#4A57B9" }
                    : { borderColor: "#E3E9F6", color: "#6B7280" }}
                >
                  {m === "manual" ? "Manual Entry" : m === "bulk" ? "Bulk Upload" : "API Integration"}
                </button>
              ))}
            </div>

            {importMethod === "manual" && (
              <div className="p-4 rounded-xl text-sm" style={{ background: "#F9FAFB", color: "#6B7280" }}>
                Manual entry mode — data will be entered directly into the system after setup is complete.
              </div>
            )}

            {importMethod === "bulk" && (
              <div className="flex items-center gap-3 flex-wrap">
                <label
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold cursor-pointer transition-colors"
                  style={{ borderColor: "#E3E9F6", color: "#4A57B9" }}
                >
                  <Upload className="w-4 h-4" />
                  {importing ? "Importing…" : "Upload File"}
                  <input
                    ref={importFileRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleImport}
                    disabled={!selectedDataType}
                  />
                </label>
                <button className={secondaryBtnCls} style={secondaryBtnStyle}>
                  <Download className="w-4 h-4" /> Download Template
                </button>
                {!selectedDataType && <span className="text-xs" style={{ color: "#F59E0B" }}>Select a data type above first</span>}
              </div>
            )}

            {importMethod === "api" && (
              <div className="space-y-3">
                <div>
                  <label className={labelCls} style={labelStyle}>API Endpoint URL</label>
                  <input className={inputCls} style={inputStyle} placeholder="https://api.example.com/data" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} />
                </div>
                <button className={primaryBtnCls} style={primaryBtnStyle} onClick={() => handleImport()} disabled={importing || !selectedDataType}>
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Connect & Import
                </button>
              </div>
            )}
          </div>

          <div className={cardCls} style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: "#E3E9F6" }}>
              <h2 className="text-base font-bold" style={{ color: "#111827" }}>Import History ({imports.length})</h2>
            </div>
            {importsLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#4A57B9" }} /></div>
            ) : imports.length === 0 ? (
              <div className="text-center py-10 text-sm" style={{ color: "#9CA3AF" }}>No data imports yet</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#F9FAFB" }}>
                    <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Data Type</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Method</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Records</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Imported</th>
                  </tr>
                </thead>
                <tbody>
                  {imports.map((imp) => (
                    <tr key={imp.id} className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                      <td className="px-5 py-3 font-medium capitalize" style={{ color: "#111827" }}>{imp.dataType.replace(/_/g, " ")}</td>
                      <td className="px-5 py-3 capitalize" style={{ color: "#6B7280" }}>{imp.method}</td>
                      <td className="px-5 py-3" style={{ color: "#6B7280" }}>{imp.records}</td>
                      <td className="px-5 py-3" style={{ color: "#6B7280" }}>{new Date(imp.importedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {nextError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {nextError}
        </div>
      )}
      <div className="flex justify-between">
        <button className={secondaryBtnCls} style={secondaryBtnStyle} onClick={onBack}>Back</button>
        <button
          className={primaryBtnCls}
          style={primaryBtnStyle}
          onClick={() => {
            if (documents.length === 0 && imports.length === 0) {
              setNextError("Please upload at least one document or import data before proceeding.");
              return;
            }
            setNextError("");
            onNext();
          }}
        >
          Next Step <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Step 7: AI & Intelligence Setup ───────────────────────────────────────────

function Step7({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [saveStep7, { isLoading }] = useSaveOrgSetupStep7Mutation();

  const initialState: Record<string, boolean> = {};
  AI_FEATURES.forEach(({ key }) => { initialState[key] = true; });
  const [features, setFeatures] = useState<Record<string, boolean>>(initialState);

  const toggle = (key: string) => setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));

  const aiIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    aiAssistant: Brain,
    predictiveRiskEngine: BarChart3,
    complianceAI: Shield,
    aiRecommendations: Zap,
    benchmarkingEngine: BarChart3,
    fatigueAnalysis: Clock,
    trendAnalysis: BarChart3,
  };

  const handleNext = async () => {
    const payload = {
      aiFeatures: AI_FEATURES.map(({ key, label }) => ({ name: label, enabled: features[key] })),
    };
    await saveStep7(payload);
    onNext();
  };

  return (
    <div className="space-y-5">
      <div className={cardCls} style={cardStyle}>
        <h2 className="text-base font-bold mb-2" style={{ color: "#111827" }}>AI & Intelligence Features</h2>
        <p className="text-sm mb-5" style={{ color: "#6B7280" }}>Enable or disable AI-powered capabilities for your organization</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AI_FEATURES.map(({ key, label, desc }) => {
            const Icon = aiIcons[key] || Brain;
            const enabled = features[key];
            return (
              <div
                key={key}
                className="flex items-start gap-4 p-4 rounded-xl border-2 transition-all"
                style={enabled ? { borderColor: "#4A57B9", background: "#F5F7FF" } : { borderColor: "#E3E9F6", background: "#fff" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: enabled ? "linear-gradient(135deg, #4A57B9, #6F80E8)" : "#F3F4F6" }}>
                  <Icon className="w-5 h-5" style={{ color: enabled ? "#fff" : "#9CA3AF" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold mb-0.5" style={{ color: "#111827" }}>{label}</div>
                  <div className="text-xs" style={{ color: "#6B7280" }}>{desc}</div>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  className="flex-shrink-0 rounded-full flex items-center p-0.5 transition-colors"
                  style={{
                    width: "2.5rem",
                    height: "1.5rem",
                    background: enabled ? "linear-gradient(135deg, #4A57B9, #6F80E8)" : "#E5E7EB",
                  }}
                >
                  <span
                    className="block w-4 h-4 rounded-full bg-white shadow transition-transform"
                    style={{ transform: enabled ? "translateX(1rem)" : "translateX(0)" }}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between">
        <button className={secondaryBtnCls} style={secondaryBtnStyle} onClick={onBack}>Back</button>
        <button className={primaryBtnCls} style={primaryBtnStyle} onClick={handleNext} disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Next Step <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Step 8: Review & Activate ──────────────────────────────────────────────────

function Step8({
  onBack,
  completedSteps,
}: {
  onBack: () => void;
  completedSteps: number[];
}) {
  const navigate = useNavigate();
  const { markOnboardingSetupCompleted } = useAuth();
  const [activateOrg, { isLoading }] = useActivateOrganizationMutation();
  const { data: sites = [] } = useGetOrgSetupStep3SitesQuery();
  const { data: users = [] } = useGetOrgSetupStep4UsersQuery();
  const { data: documents = [] } = useGetOrgSetupStep6DocumentsQuery();
  const { data: imports = [] } = useGetOrgSetupStep6aImportsQuery();

  const [activated, setActivated] = useState(false);
  const [activateError, setActivateError] = useState("");

  const allStepsComplete = [1, 2, 3, 4, 5, 6, 7].every((s) => completedSteps.includes(s));

  const handleActivate = async () => {
    if (!allStepsComplete) {
      const missing = [1, 2, 3, 4, 5, 6, 7]
        .filter((s) => !completedSteps.includes(s))
        .map((s) => STEP_LABELS[s - 1]);
      setActivateError(`Please complete all steps before activating. Missing: ${missing.join(", ")}`);
      return;
    }
    setActivateError("");
    const result = await activateOrg({ confirmed: true });
    if ("data" in result && (result.data as Record<string, unknown>)?.error) {
      setActivateError(String((result.data as Record<string, unknown>).error));
      return;
    }
    setActivated(true);
  };

  const checkItems = [
    { label: "Organization Details", done: completedSteps.includes(1) },
    { label: "Compliance Setup", done: completedSteps.includes(2) },
    { label: `Sites & Departments (${sites.length})`, done: completedSteps.includes(3) },
    { label: `Users & Roles (${users.length})`, done: completedSteps.includes(4) },
    { label: "Workflows Configured", done: completedSteps.includes(5) },
    { label: `Knowledge Documents (${documents.length})`, done: completedSteps.includes(6) },
    { label: `Data Imports (${imports.length})`, done: completedSteps.includes(6) },
    { label: "AI Configuration", done: completedSteps.includes(7) },
  ];

  if (activated) {
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: "#E3E9F6" }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "#D1FAE5" }}>
            <CheckCircle2 className="w-10 h-10" style={{ color: "#10B981" }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#111827" }}>Organization Activated Successfully!</h2>
          <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: "#6B7280" }}>
            Your organization has been fully configured and activated. All features are now available.
          </p>
          <button
            className={primaryBtnCls + " mx-auto"}
            style={{ ...primaryBtnStyle, padding: "12px 32px" }}
            onClick={() => { markOnboardingSetupCompleted(); navigate("/"); }}
          >
            Go to Dashboard <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className={cardCls} style={cardStyle}>
        <h2 className="text-base font-bold mb-5" style={{ color: "#111827" }}>Setup Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {checkItems.map(({ label, done }) => (
            <div
              key={label}
              className="flex items-center gap-3 p-4 rounded-xl border"
              style={done ? { borderColor: "#A7F3D0", background: "#F0FDF4" } : { borderColor: "#FDE68A", background: "#FFFBEB" }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={done ? { background: "#10B981" } : { background: "#F59E0B" }}
              >
                {done ? <Check className="w-4 h-4 text-white" /> : <AlertTriangle className="w-4 h-4 text-white" />}
              </div>
              <span className="text-sm font-semibold" style={{ color: "#111827" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={cardCls} style={cardStyle}>
        <h2 className="text-base font-bold mb-2" style={{ color: "#111827" }}>Ready to Activate</h2>
        <p className="text-sm mb-5" style={{ color: "#6B7280" }}>
          Clicking "Confirm & Activate" will finalize the organization setup and make all configured features live.
        </p>
        {!allStepsComplete && (
          <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: "#FFFBEB", color: "#92400E", border: "1px solid #FDE68A" }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Some steps are incomplete. Please go back and finish all required steps before activating.
          </div>
        )}
        {activateError && (
          <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {activateError}
          </div>
        )}
        <div className="flex justify-between items-center flex-wrap gap-3">
          <button className={secondaryBtnCls} style={secondaryBtnStyle} onClick={onBack}>Back</button>
          <button
            className={`${primaryBtnCls} px-8 py-3 text-base`}
            style={{ ...primaryBtnStyle, background: allStepsComplete ? "linear-gradient(135deg, #059669, #10B981)" : "#D1D5DB" }}
            onClick={handleActivate}
            disabled={isLoading || !allStepsComplete}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            Confirm & Activate
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Wizard Page ───────────────────────────────────────────────────────────

export function OrgSetupWizardPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [dataEntryOption, setDataEntryOption] = useState<"manual" | "excel" | "api">("manual");

  const { data: progressRaw } = useGetOrgSetupProgressQuery();
  const { data: step1Saved } = useGetOrgSetupStep1Query();

  // Restore progress from backend on first load
  useEffect(() => {
    if (progressRaw && !progressLoaded) {
      const raw = progressRaw as unknown as { steps_completed?: number[]; activated?: boolean };
      const done: number[] = raw.steps_completed ?? [];
      setCompletedSteps(done);
      if (done.length > 0) {
        const nextStep = Math.min(Math.max(...done) + 1, 8);
        setCurrentStep(nextStep);
      }
      setProgressLoaded(true);
    }
  }, [progressRaw, progressLoaded]);

  // Restore dataEntryOption from saved step 1
  useEffect(() => {
    if (step1Saved) {
      const s = step1Saved as unknown as { dataEntryOption?: string };
      if (s.dataEntryOption && ["manual", "excel", "api"].includes(s.dataEntryOption)) {
        setDataEntryOption(s.dataEntryOption as "manual" | "excel" | "api");
      }
    }
  }, [step1Saved]);

  const markDone = (step: number) => {
    setCompletedSteps((prev) => prev.includes(step) ? prev : [...prev, step]);
  };

  const goNext = (fromStep: number) => {
    markDone(fromStep);
    setCurrentStep(fromStep + 1);
  };

  const goBack = (fromStep: number) => {
    setCurrentStep(fromStep - 1);
  };

  const stepTitles = [
    "Organization Details",
    "Industry & Compliance Setup",
    "Site Structure Setup",
    "Roles & Users Setup",
    "Workflow Configuration",
    "Knowledge Centre & AI Data Import",
    "AI & Intelligence Setup",
    "Review & Activate",
  ];

  return (
    <div className="p-6 space-y-5" style={{ background: "#F6F8FC", minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Organization Setup</h1>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Step {currentStep} of 8 — {stepTitles[currentStep - 1]}
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={(step) => {
          const maxReachable = completedSteps.length > 0
            ? Math.min(Math.max(...completedSteps) + 1, 8)
            : 1;
          if (step <= maxReachable) {
            setCurrentStep(step);
          }
        }}
      />

      {/* Step Content */}
      {currentStep === 1 && (
        <Step1 onNext={() => goNext(1)} dataEntryOption={dataEntryOption} onDataEntryChange={setDataEntryOption} />
      )}
      {currentStep === 2 && (
        <Step2 onNext={() => goNext(2)} onBack={() => goBack(2)} />
      )}
      {currentStep === 3 && (
        <Step3 onNext={() => goNext(3)} onBack={() => goBack(3)} dataEntryOption={dataEntryOption} />
      )}
      {currentStep === 4 && (
        <Step4 onNext={() => goNext(4)} onBack={() => goBack(4)} dataEntryOption={dataEntryOption} />
      )}
      {currentStep === 5 && (
        <Step5 onNext={() => goNext(5)} onBack={() => goBack(5)} />
      )}
      {currentStep === 6 && (
        <Step6 onNext={() => goNext(6)} onBack={() => goBack(6)} />
      )}
      {currentStep === 7 && (
        <Step7 onNext={() => goNext(7)} onBack={() => goBack(7)} />
      )}
      {currentStep === 8 && (
        <Step8 onBack={() => goBack(8)} completedSteps={completedSteps} />
      )}
    </div>
  );
}
