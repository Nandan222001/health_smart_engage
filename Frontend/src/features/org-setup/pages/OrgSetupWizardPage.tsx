import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  CheckCircle2,
  Circle,
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
} from "@/features/org-setup/api/orgSetupApi";

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
}: {
  currentStep: number;
  completedSteps: number[];
}) {
  return (
    <div className="bg-white rounded-2xl border p-5 overflow-x-auto" style={{ borderColor: "#E3E9F6" }}>
      <div className="flex items-center min-w-max gap-0">
        {STEP_LABELS.map((label, idx) => {
          const step = idx + 1;
          const isActive = step === currentStep;
          const isDone = completedSteps.includes(step);

          return (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                  style={
                    isDone
                      ? { background: "#10B981", color: "#fff" }
                      : isActive
                      ? { background: "linear-gradient(135deg, #4A57B9, #6F80E8)", color: "#fff", boxShadow: "0 4px 12px rgba(74,87,185,0.35)" }
                      : { background: "#F3F4F6", color: "#9CA3AF" }
                  }
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <span>{step}</span>}
                </div>
                <span
                  className="text-[10px] font-semibold text-center w-16 leading-tight"
                  style={{ color: isActive ? "#4A57B9" : isDone ? "#10B981" : "#9CA3AF" }}
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

function Step1({
  onNext,
}: {
  onNext: () => void;
}) {
  const [saveStep1, { isLoading }] = useSaveOrgSetupStep1Mutation();

  const [form, setForm] = useState({
    organizationName: "",
    industryType: "",
    employeeCount: "",
    numberOfSites: "",
    officialEmail: "",
    contactNumber: "",
    country: "",
    timezone: "",
    headquartersAddress: "",
    dataEntryOption: "manual" as "manual" | "excel" | "api",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleNext = async () => {
    await saveStep1({
      ...form,
      employeeCount: Number(form.employeeCount),
      numberOfSites: Number(form.numberOfSites),
    });
    onNext();
  };

  const dataEntryOptions = [
    { value: "manual", label: "Manual Entry", desc: "Enter data directly through the web interface" },
    { value: "excel", label: "Excel Upload", desc: "Import data using Excel or CSV templates" },
    { value: "api", label: "API Integration", desc: "Connect via REST API for automated data sync" },
  ];

  return (
    <div className="space-y-5">
      <div className={cardCls} style={cardStyle}>
        <h2 className="text-base font-bold mb-4" style={{ color: "#111827" }}>Organization Information</h2>
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
      </div>

      <div className={cardCls} style={cardStyle}>
        <h2 className="text-base font-bold mb-4" style={{ color: "#111827" }}>Data Entry Preference</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {dataEntryOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set("dataEntryOption", opt.value)}
              className="p-4 rounded-xl border-2 text-left transition-all"
              style={form.dataEntryOption === opt.value
                ? { borderColor: "#4A57B9", background: "#EEF2FF" }
                : { borderColor: "#E3E9F6", background: "#fff" }}
            >
              <div className="text-sm font-bold mb-1" style={{ color: form.dataEntryOption === opt.value ? "#4A57B9" : "#111827" }}>{opt.label}</div>
              <div className="text-xs" style={{ color: "#6B7280" }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button className={primaryBtnCls} style={primaryBtnStyle} onClick={handleNext} disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
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
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { data: sites = [], isLoading: sitesLoading, refetch } = useGetOrgSetupStep3SitesQuery();
  const [createSite, { isLoading: creating }] = useCreateOrgSetupSiteMutation();
  const [bulkUpload, { isLoading: uploading }] = useBulkUploadOrgSetupSitesMutation();
  const fileRef = useRef<HTMLInputElement>(null);

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
    const fd = new FormData();
    fd.append("file", file);
    await bulkUpload(fd);
    refetch();
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-5">
      <div className={cardCls} style={cardStyle}>
        <h2 className="text-base font-bold mb-4" style={{ color: "#111827" }}>Add a Site</h2>
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

      {/* Bulk Upload */}
      <div className={cardCls} style={cardStyle}>
        <h2 className="text-base font-bold mb-3" style={{ color: "#111827" }}>Bulk Upload</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <label
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold cursor-pointer transition-colors"
            style={{ borderColor: "#E3E9F6", color: "#4A57B9" }}
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading…" : "Upload Excel File"}
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleBulkFile} />
          </label>
          <button className={secondaryBtnCls} style={secondaryBtnStyle}>
            <Download className="w-4 h-4" /> Download Template
          </button>
          <span className="text-xs" style={{ color: "#9CA3AF" }}>Supported: .xlsx, .xls, .csv</span>
        </div>
      </div>

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

      <div className="flex justify-between">
        <button className={secondaryBtnCls} style={secondaryBtnStyle} onClick={onBack}>Back</button>
        <button className={primaryBtnCls} style={primaryBtnStyle} onClick={onNext}>
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
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { data: users = [], isLoading: usersLoading, refetch } = useGetOrgSetupStep4UsersQuery();
  const [createUser, { isLoading: creating }] = useCreateOrgSetupUserMutation();
  const [bulkUpload, { isLoading: uploading }] = useBulkUploadOrgSetupUsersMutation();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ name: "", email: "", role: "", department: "" });
  const [error, setError] = useState("");
  const [showHrmsModal, setShowHrmsModal] = useState(false);
  const [hrmsUrl, setHrmsUrl] = useState("");

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
    const fd = new FormData();
    fd.append("file", file);
    await bulkUpload(fd);
    refetch();
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-5">
      {showHrmsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" style={{ border: "1px solid #E3E9F6" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: "#111827" }}>Import from HRMS</h3>
              <button onClick={() => setShowHrmsModal(false)}><X className="w-5 h-5" style={{ color: "#9CA3AF" }} /></button>
            </div>
            <label className={labelCls} style={labelStyle}>HRMS API Endpoint URL</label>
            <input className={`${inputCls} mb-4`} style={inputStyle} placeholder="https://hrms.company.com/api/employees" value={hrmsUrl} onChange={(e) => setHrmsUrl(e.target.value)} />
            <div className="flex gap-3">
              <button className={primaryBtnCls} style={primaryBtnStyle} onClick={() => setShowHrmsModal(false)}>Connect & Import</button>
              <button className={secondaryBtnCls} style={secondaryBtnStyle} onClick={() => setShowHrmsModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className={cardCls} style={cardStyle}>
        <h2 className="text-base font-bold mb-4" style={{ color: "#111827" }}>Add User</h2>
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
        <div className="flex gap-2 flex-wrap">
          <button className={primaryBtnCls} style={primaryBtnStyle} onClick={handleAdd} disabled={creating}>
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add User
          </button>
          <label className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold cursor-pointer" style={{ borderColor: "#E3E9F6", color: "#4A57B9" }}>
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading…" : "Bulk Upload Excel"}
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleBulkFile} />
          </label>
          <button className={secondaryBtnCls} style={secondaryBtnStyle} onClick={() => setShowHrmsModal(true)}>
            <Users className="w-4 h-4" /> Import from HRMS
          </button>
        </div>
      </div>

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

      <div className="flex justify-between">
        <button className={secondaryBtnCls} style={secondaryBtnStyle} onClick={onBack}>Back</button>
        <button className={primaryBtnCls} style={primaryBtnStyle} onClick={onNext}>
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

  const docFileRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const [docForm, setDocForm] = useState({ name: "", type: "" });
  const [selectedDataType, setSelectedDataType] = useState("");
  const [importMethod, setImportMethod] = useState<"manual" | "bulk" | "api">("bulk");
  const [apiUrl, setApiUrl] = useState("");

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", docForm.name || file.name);
    fd.append("type", docForm.type);
    await uploadKnowledge(fd);
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
    const fd = new FormData();
    fd.append("file", file);
    fd.append("dataType", selectedDataType);
    fd.append("method", importMethod);
    await importData(fd);
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

      <div className="flex justify-between">
        <button className={secondaryBtnCls} style={secondaryBtnStyle} onClick={onBack}>Back</button>
        <button className={primaryBtnCls} style={primaryBtnStyle} onClick={onNext}>
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
  const [activateOrg, { isLoading }] = useActivateOrganizationMutation();
  const { data: sites = [] } = useGetOrgSetupStep3SitesQuery();
  const { data: users = [] } = useGetOrgSetupStep4UsersQuery();
  const { data: documents = [] } = useGetOrgSetupStep6DocumentsQuery();
  const { data: imports = [] } = useGetOrgSetupStep6aImportsQuery();

  const [activated, setActivated] = useState(false);

  const handleActivate = async () => {
    await activateOrg({ confirmed: true });
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
            onClick={() => navigate("/")}
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
        <div className="flex justify-between items-center flex-wrap gap-3">
          <button className={secondaryBtnCls} style={secondaryBtnStyle} onClick={onBack}>Back</button>
          <button
            className={`${primaryBtnCls} px-8 py-3 text-base`}
            style={{ ...primaryBtnStyle, background: "linear-gradient(135deg, #059669, #10B981)" }}
            onClick={handleActivate}
            disabled={isLoading}
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
      <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />

      {/* Step Content */}
      {currentStep === 1 && (
        <Step1 onNext={() => goNext(1)} />
      )}
      {currentStep === 2 && (
        <Step2 onNext={() => goNext(2)} onBack={() => goBack(2)} />
      )}
      {currentStep === 3 && (
        <Step3 onNext={() => goNext(3)} onBack={() => goBack(3)} />
      )}
      {currentStep === 4 && (
        <Step4 onNext={() => goNext(4)} onBack={() => goBack(4)} />
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
