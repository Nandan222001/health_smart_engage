import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/app/context/AuthContext";
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
  useGetOrgSetupProgressQuery,
  useGetOrgSetupStep1Query,
  useGetOrgSetupStep2Query,
  useGetOrgSetupStep3SitesQuery,
  useGetOrgSetupStep4UsersQuery,
  useGetOrgSetupStep5Query,
  useGetOrgSetupStep6DocumentsQuery,
  useGetOrgSetupStep6aImportsQuery,
  useGetOrgSetupStep7Query,
  useSaveOrgSetupStep1Mutation,
  useSaveOrgSetupStep2Mutation,
  useCreateOrgSetupSiteMutation,
  useBulkUploadOrgSetupSitesMutation,
  useCreateOrgSetupUserMutation,
  useBulkUploadOrgSetupUsersMutation,
  useSaveOrgSetupStep5Mutation,
  useUploadOrgSetupKnowledgeMutation,
  useImportOrgSetupDataMutation,
  useBulkImportModuleMutation,
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

const INDUSTRY_SECTORS = [
  "Construction",
  "Oil & Gas",
  "Manufacturing",
  "Mining",
  "Logistics & Transport",
  "Power & Utilities",
  "Healthcare",
  "Chemicals",
  "Agriculture",
  "Other",
];

const ISO_45001_STATUSES = [
  "Certified",
  "In Progress",
  "Planned",
  "Not Started",
  "Expired",
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

const SITE_TYPES = ["Site", "Plant", "Branch", "Zone", "Department", "Unit", "Manufacturing & Assembly", "Warehouse", "Distribution Centre", "Research & Development"];

const OPERATIONAL_STATUSES = ["Active", "Inactive", "Under Construction", "Maintenance", "Decommissioned"];

const HAZARD_CLASSIFICATIONS = ["Low Risk", "Medium Risk", "High Risk", "Critical"];

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
  { key: "employees",        label: "Employees",          icon: Users },
  { key: "departments",      label: "Departments",         icon: Building2 },
  { key: "working_stations", label: "Working Stations",    icon: BarChart3 },
  { key: "roles",            label: "Roles",               icon: Shield },
  { key: "policies",         label: "Policies",            icon: FileText },
  { key: "permit_types",     label: "Permit Types",        icon: FileText },
  { key: "hazard_categories",label: "Hazard Categories",   icon: AlertTriangle },
  { key: "hazards",          label: "Hazards",             icon: AlertTriangle },
  { key: "training_programs",label: "Training Programs",   icon: Brain },
  { key: "permits_to_work",  label: "Permits To Work",     icon: FileText },
  { key: "incidents",        label: "Incidents",            icon: AlertTriangle },
  { key: "near_misses",      label: "Near Misses",          icon: Shield },
  { key: "safety_walks",     label: "Safety Walks",         icon: Check },
  { key: "capa_actions",     label: "CAPA Actions",         icon: Zap },
  { key: "shift_schedule",   label: "Shift Schedule",       icon: Clock },
];

type FieldDef = { label: string; key: string; type: string; placeholder?: string; options?: string[]; required?: boolean };

const IMPORT_FIELDS: Record<string, FieldDef[]> = {
  employees: [
    { label: "Employee ID",           key: "employee_id",           type: "text",   placeholder: "EMP001",          required: true },
    { label: "Full Name",             key: "full_name",             type: "text",   placeholder: "Jessica Hernandez",required: true },
    { label: "Date of Birth",         key: "date_of_birth",         type: "date" },
    { label: "Gender",                key: "gender",                type: "select", options: ["M","F","Other"] },
    { label: "Employment Type",       key: "employment_type",       type: "select", options: ["Permanent","Contract","Part-time","Temporary"] },
    { label: "Employment Start Date", key: "employment_start_date", type: "date" },
    { label: "Job Title / Role ID",   key: "job_title",             type: "text",   placeholder: "ROLE001 or Plant Manager" },
    { label: "Department",            key: "department",            type: "text",   placeholder: "DEPT001 or Heavy Assembly" },
    { label: "Shift Pattern",         key: "shift_pattern",         type: "select", options: ["Rotating","Days","Nights","Afternoon","Fixed"] },
    { label: "Manager ID",            key: "manager_id",            type: "text",   placeholder: "EMP001" },
    { label: "Induction Date",        key: "induction_date",        type: "date" },
    { label: "Active Status",         key: "active_status",         type: "select", options: ["Active","Inactive","On Leave"] },
  ],
  departments: [
    { label: "Department ID",   key: "department_id",   type: "text",   placeholder: "DEPT001",        required: true },
    { label: "Site ID",         key: "site_id",         type: "text",   placeholder: "SITE001",        required: true },
    { label: "Department Name", key: "department_name", type: "text",   placeholder: "Heavy Assembly",  required: true },
    { label: "Manager ID",      key: "manager_id",      type: "text",   placeholder: "EMP001" },
    { label: "Number of Teams", key: "number_of_teams", type: "number", placeholder: "3" },
  ],
  working_stations: [
    { label: "Station ID",              key: "station_id",              type: "text",   placeholder: "STN001",                    required: true },
    { label: "Station Name",            key: "station_name",            type: "text",   placeholder: "Heavy Assembly Station 1",  required: true },
    { label: "Site ID",                 key: "site_id",                 type: "text",   placeholder: "SITE001" },
    { label: "Department",              key: "department",              type: "text",   placeholder: "Heavy Assembly" },
    { label: "Zone Classification",     key: "zone_classification",     type: "text",   placeholder: "e.g. Heavy Assembly" },
    { label: "Primary Hazards",         key: "primary_hazards",         type: "text",   placeholder: "HAZ001, HAZ002" },
    { label: "Staffing Requirement",    key: "staffing_requirement",    type: "number", placeholder: "3" },
    { label: "Equipment List",          key: "equipment_list",          type: "text",   placeholder: "Equipment Set 1" },
    { label: "Permit Types Required",   key: "permit_types_required",   type: "text",   placeholder: "Hot Work, Work at Height" },
    { label: "Access Restrictions",     key: "access_restrictions",     type: "text",   placeholder: "Authorized Personnel Only" },
  ],
  roles: [
    { label: "Role ID",          key: "role_id",          type: "text",   placeholder: "ROLE001",          required: true },
    { label: "Role Name",        key: "role_name",        type: "text",   placeholder: "Plant Manager",    required: true },
    { label: "Job Category",     key: "job_category",     type: "text",   placeholder: "Senior Management" },
    { label: "Authority Level",  key: "authority_level",  type: "number", placeholder: "5" },
    { label: "Permit Authority", key: "permit_authority", type: "select", options: ["Yes","No"] },
    { label: "Safety Signatory", key: "safety_signatory", type: "select", options: ["Yes","No"] },
  ],
  policies: [
    { label: "Policy ID",    key: "policy_id",    type: "text",  placeholder: "POL001",          required: true },
    { label: "Policy Name",  key: "policy_name",  type: "text",  placeholder: "Hot Work Safety", required: true },
    { label: "Category",     key: "category",     type: "text",  placeholder: "Hot Work" },
    { label: "Issue Date",   key: "issue_date",   type: "date" },
    { label: "Owner",        key: "owner",        type: "text",  placeholder: "Safety Manager" },
    { label: "Status",       key: "status",       type: "select",options: ["Current","Archived","Under Review","Draft"] },
  ],
  permit_types: [
    { label: "Permit Type ID",         key: "permit_type_id",         type: "text",   placeholder: "PT001",           required: true },
    { label: "Permit Type Name",       key: "permit_type_name",       type: "text",   placeholder: "Hot Work Permit", required: true },
    { label: "Risk Level",             key: "risk_level",             type: "select", options: ["Critical","High","Medium","Low"] },
    { label: "Validity Period (Hours)",key: "validity_period_hours",  type: "number", placeholder: "8" },
    { label: "Concurrent Limit",       key: "concurrent_limit",       type: "number", placeholder: "5" },
  ],
  hazard_categories: [
    { label: "Category ID",   key: "hazard_category_id", type: "text",     placeholder: "HC001",      required: true },
    { label: "Category Name", key: "category_name",      type: "text",     placeholder: "Mechanical", required: true },
    { label: "Description",   key: "description",        type: "textarea", placeholder: "Moving machinery, rotating equipment…" },
  ],
  hazards: [
    { label: "Hazard ID",    key: "hazard_id",   type: "text",   placeholder: "HAZ001",         required: true },
    { label: "Category ID",  key: "category_id", type: "text",   placeholder: "HC001" },
    { label: "Hazard Name",  key: "hazard_name", type: "text",   placeholder: "Moving Machinery",required: true },
    { label: "Severity",     key: "severity",    type: "select", options: ["Fatal","Serious","Moderate","Minor"] },
    { label: "Probability",  key: "probability", type: "select", options: ["Certain","Likely","Possible","Unlikely","Rare"] },
  ],
  training_programs: [
    { label: "Training ID",     key: "training_id",   type: "text",   placeholder: "TRN001",               required: true },
    { label: "Training Name",   key: "training_name", type: "text",   placeholder: "Permit-to-Work System", required: true },
    { label: "Duration (Hours)",key: "duration_hours",type: "number", placeholder: "4" },
    { label: "Frequency",       key: "frequency",     type: "select", options: ["Annual","Bi-Annual","Quarterly","Monthly","Once"] },
    { label: "Certification",   key: "certification", type: "select", options: ["Yes","No"] },
    { label: "Expiry (Months)", key: "expiry_months", type: "number", placeholder: "12" },
  ],
  permits_to_work: [
    { label: "Permit ID",              key: "permit_id",               type: "text",   placeholder: "PTW000001",   required: true },
    { label: "Permit Type ID",         key: "permit_type_id",          type: "text",   placeholder: "PT001" },
    { label: "Date Issued",            key: "date_issued",             type: "date",   required: true },
    { label: "Time Issued",            key: "time_issued",             type: "text",   placeholder: "08:00" },
    { label: "Location / Station ID",  key: "location_station_id",     type: "text",   placeholder: "STN001" },
    { label: "Work Description",       key: "work_description",        type: "textarea",placeholder: "Welding repairs…" },
    { label: "Duration Requested (h)", key: "duration_requested_hours",type: "number", placeholder: "8" },
    { label: "Issued By (Employee ID)",key: "issued_by",               type: "text",   placeholder: "EMP036" },
    { label: "Approved By",            key: "approved_by",             type: "text",   placeholder: "EMP149" },
    { label: "Number of Workers",      key: "number_of_workers",       type: "number", placeholder: "4" },
    { label: "Status",                 key: "status",                  type: "select", options: ["Active","Closed","Expired","Cancelled"] },
    { label: "Deviation Reported",     key: "deviation_reported",      type: "select", options: ["Yes","No"] },
    { label: "Incident Occurred",      key: "incident_occurred",       type: "select", options: ["Yes","No"] },
  ],
  incidents: [
    { label: "Incident ID",          key: "incident_id",          type: "text",    placeholder: "INC00001",      required: true },
    { label: "Report Date",          key: "report_date",          type: "date",    required: true },
    { label: "Incident Date & Time", key: "incident_datetime",    type: "text",    placeholder: "2024-04-28 15:37" },
    { label: "Location / Station",   key: "location_station",     type: "text",    placeholder: "STN031" },
    { label: "Incident Type",        key: "incident_type",        type: "select",  options: ["Injury","Damage","Near-miss","Fire","Environmental","Unsafe Act","Unsafe Condition","Chemical Spill"] },
    { label: "Severity",             key: "severity",             type: "select",  options: ["Minor","Significant","Serious","Lost Time","Fatality"] },
    { label: "Persons Involved",     key: "number_persons_involved",type: "number",placeholder: "1" },
    { label: "Description",          key: "description",          type: "textarea",placeholder: "Brief description…" },
    { label: "Immediate Cause",      key: "immediate_cause",      type: "text",    placeholder: "Human Error" },
    { label: "Root Cause",           key: "root_cause",           type: "text",    placeholder: "Training Deficiency" },
    { label: "Hazard Involved",      key: "hazard_involved",      type: "text",    placeholder: "HAZ001" },
    { label: "Reported By",          key: "reported_by",          type: "text",    placeholder: "EMP020" },
    { label: "Investigation Status", key: "investigation_status", type: "select",  options: ["Open","In Progress","Completed","Closed"] },
    { label: "CAPA Generated",       key: "capa_generated",       type: "select",  options: ["Yes","No"] },
    { label: "Days Away",            key: "days_away",            type: "number",  placeholder: "0" },
    { label: "Root Cause Category",  key: "root_cause_category",  type: "text",    placeholder: "Training, Management System…" },
  ],
  near_misses: [
    { label: "Near Miss ID",        key: "near_miss_id",        type: "text",     placeholder: "NM00001",            required: true },
    { label: "Report Date",         key: "report_date",         type: "date",     required: true },
    { label: "Event Date & Time",   key: "event_datetime",      type: "text",     placeholder: "2024-03-09 09:39" },
    { label: "Location / Station",  key: "location_station",    type: "text",     placeholder: "STN019" },
    { label: "Description",         key: "description",         type: "textarea", placeholder: "What happened…",     required: true },
    { label: "Potential Consequence",key: "potential_consequence",type: "select",  options: ["Injury","Fatality","Property Damage","Environmental Release","Production Loss"] },
    { label: "Hazard Involved",     key: "hazard_involved",     type: "text",     placeholder: "HAZ010" },
    { label: "Underlying Cause",    key: "underlying_cause",    type: "text",     placeholder: "Procedure Gap" },
    { label: "Control Failure",     key: "control_failure",     type: "select",   options: ["Yes","No"] },
    { label: "Reported By",         key: "reported_by",         type: "text",     placeholder: "EMP057" },
    { label: "CAPA Escalation",     key: "capa_escalation",     type: "select",   options: ["Yes","No"] },
  ],
  safety_walks: [
    { label: "Inspection ID",        key: "inspection_id",        type: "text",    placeholder: "SW00001",   required: true },
    { label: "Inspection Date & Time",key: "inspection_datetime",  type: "text",   placeholder: "2025-09-22 09:50" },
    { label: "Location / Station",   key: "location_station",     type: "text",    placeholder: "STN020" },
    { label: "Inspector (Employee ID)",key: "inspector",           type: "text",    placeholder: "EMP053" },
    { label: "Inspection Type",      key: "inspection_type",      type: "select",  options: ["Routine","Compliance","Scheduled","Unannounced","Follow-up"] },
    { label: "Issues Found",         key: "issues_found",         type: "number",  placeholder: "2" },
    { label: "Critical Issues",      key: "critical_issues",      type: "number",  placeholder: "1" },
    { label: "Housekeeping Rating (1-5)",key: "housekeeping_rating",type: "number",placeholder: "4" },
    { label: "Compliance Rating (1-5)",key: "compliance_rating",  type: "number",  placeholder: "3" },
    { label: "Follow Up Required",   key: "follow_up_required",   type: "select",  options: ["Yes","No"] },
  ],
  capa_actions: [
    { label: "Action ID",            key: "action_id",            type: "text",     placeholder: "CAPA00001",  required: true },
    { label: "Incident ID",          key: "incident_id",          type: "text",     placeholder: "INC00001" },
    { label: "Action Type",          key: "action_type",          type: "select",   options: ["Corrective","Preventive","Improvement"] },
    { label: "Description",          key: "description",          type: "textarea", placeholder: "CAPA action description…" },
    { label: "Root Cause Addressed", key: "root_cause_addressed", type: "text",     placeholder: "Training, Procedure Gap…" },
    { label: "Responsible Person",   key: "responsible_person",   type: "text",     placeholder: "EMP037" },
    { label: "Due Date",             key: "due_date",             type: "date",     required: true },
    { label: "Status",               key: "status",               type: "select",   options: ["Open","In Progress","Completed","Overdue","Closed"] },
    { label: "Effectiveness Rating", key: "effectiveness_rating", type: "number",   placeholder: "1–5" },
  ],
  shift_schedule: [
    { label: "Schedule ID",       key: "schedule_id",         type: "text",   placeholder: "SH00000001" },
    { label: "Employee ID",       key: "employee_id",         type: "text",   placeholder: "EMP001",  required: true },
    { label: "Shift Date",        key: "shift_date",          type: "date",   required: true },
    { label: "Shift Type",        key: "shift_type",          type: "select", options: ["Days","Nights","Afternoon","Weekend","Overtime","Rotating"] },
    { label: "Shift Start",       key: "shift_start",         type: "text",   placeholder: "06:00" },
    { label: "Shift End",         key: "shift_end",           type: "text",   placeholder: "14:30" },
    { label: "Actual Hours Worked",key: "actual_hours_worked",type: "number", placeholder: "8.5" },
    { label: "Station Assigned",  key: "station_assigned",    type: "text",   placeholder: "STN015" },
    { label: "Supervisor",        key: "supervisor",          type: "text",   placeholder: "EMP118" },
  ],
};

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
  return (
    <div className="bg-white rounded-2xl border p-5 overflow-x-auto" style={{ borderColor: "#E3E9F6" }}>
      <div className="flex items-center min-w-max gap-0">
        {STEP_LABELS.map((label, idx) => {
          const step = idx + 1;
          const isActive = step === currentStep;
          const isDone = completedSteps.includes(step);
          const isClickable = isDone && onStepClick;

          return (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${isClickable ? "cursor-pointer hover:opacity-80" : ""}`}
                  style={
                    isDone
                      ? { background: "#10B981", color: "#fff" }
                      : isActive
                      ? { background: "linear-gradient(135deg, #4A57B9, #6F80E8)", color: "#fff", boxShadow: "0 4px 12px rgba(74,87,185,0.35)" }
                      : { background: "#F3F4F6", color: "#9CA3AF" }
                  }
                  onClick={() => isClickable && onStepClick(step)}
                  title={isClickable ? `Go back to ${label}` : undefined}
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

type OrgForm = {
  organisationId: string;
  organisationName: string;
  country: string;
  industrySector: string;
  numberOfEmployees: string;
  headquartersLocation: string;
  parentCompany: string;
  iso45001Status: string;
  regulatoryAuthority: string;
  establishmentDate: string;
};

const EMPTY_FORM: OrgForm = {
  organisationId: "",
  organisationName: "",
  country: "",
  industrySector: "",
  numberOfEmployees: "",
  headquartersLocation: "",
  parentCompany: "",
  iso45001Status: "",
  regulatoryAuthority: "",
  establishmentDate: "",
};

function OrgDetailsForm({ form, set }: { form: OrgForm; set: (k: string, v: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className={labelCls} style={labelStyle}>Organisation ID</label>
        <input className={inputCls} style={inputStyle} placeholder="e.g. ORG-001" value={form.organisationId} onChange={(e) => set("organisationId", e.target.value)} />
      </div>
      <div>
        <label className={labelCls} style={labelStyle}>Organisation Name</label>
        <input className={inputCls} style={inputStyle} placeholder="Enter organisation name" value={form.organisationName} onChange={(e) => set("organisationName", e.target.value)} />
      </div>
      <div>
        <label className={labelCls} style={labelStyle}>Country</label>
        <input className={inputCls} style={inputStyle} placeholder="e.g. United Kingdom" value={form.country} onChange={(e) => set("country", e.target.value)} />
      </div>
      <div>
        <label className={labelCls} style={labelStyle}>Industry Sector</label>
        <select className={inputCls} style={inputStyle} value={form.industrySector} onChange={(e) => set("industrySector", e.target.value)}>
          <option value="">Select industry sector</option>
          {INDUSTRY_SECTORS.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls} style={labelStyle}>Number of Employees</label>
        <input type="number" className={inputCls} style={inputStyle} placeholder="0" min="0" value={form.numberOfEmployees} onChange={(e) => set("numberOfEmployees", e.target.value)} />
      </div>
      <div>
        <label className={labelCls} style={labelStyle}>Headquarters Location</label>
        <input className={inputCls} style={inputStyle} placeholder="City, Country" value={form.headquartersLocation} onChange={(e) => set("headquartersLocation", e.target.value)} />
      </div>
      <div>
        <label className={labelCls} style={labelStyle}>Parent Company</label>
        <input className={inputCls} style={inputStyle} placeholder="Parent company name (if any)" value={form.parentCompany} onChange={(e) => set("parentCompany", e.target.value)} />
      </div>
      <div>
        <label className={labelCls} style={labelStyle}>ISO 45001 Status</label>
        <select className={inputCls} style={inputStyle} value={form.iso45001Status} onChange={(e) => set("iso45001Status", e.target.value)}>
          <option value="">Select status</option>
          {ISO_45001_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls} style={labelStyle}>Regulatory Authority</label>
        <input className={inputCls} style={inputStyle} placeholder="e.g. HSE UK, OSHA" value={form.regulatoryAuthority} onChange={(e) => set("regulatoryAuthority", e.target.value)} />
      </div>
      <div>
        <label className={labelCls} style={labelStyle}>Establishment Date</label>
        <input type="date" className={inputCls} style={inputStyle} value={form.establishmentDate} onChange={(e) => set("establishmentDate", e.target.value)} />
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

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Pre-fill saved data
  useEffect(() => {
    if (saved && Object.keys(saved).length > 0) {
      const s = saved as Record<string, unknown>;
      setForm({
        organisationId: String(s.organisationId ?? ""),
        organisationName: String(s.organisationName ?? ""),
        country: String(s.country ?? ""),
        industrySector: String(s.industrySector ?? ""),
        numberOfEmployees: String(s.numberOfEmployees ?? ""),
        headquartersLocation: String(s.headquartersLocation ?? ""),
        parentCompany: String(s.parentCompany ?? ""),
        iso45001Status: String(s.iso45001Status ?? ""),
        regulatoryAuthority: String(s.regulatoryAuthority ?? ""),
        establishmentDate: String(s.establishmentDate ?? ""),
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
    // baseApi already unwraps the envelope, so result.data IS the field map directly
    const parsed = ("data" in result ? result.data : {}) as Record<string, string>;
    const backendError = parsed?._error;
    const fieldCount = Object.keys(parsed ?? {}).filter((k) => parsed[k] && k !== "_error").length;
    if (fieldCount > 0) {
      const { _error: _e, ...fields } = parsed;
      void _e;
      setForm((f) => ({ ...f, ...fields }));
      setExcelStatus("success");
      setExcelMsg(`${fieldCount} fields imported — review and edit below, then click Next`);
    } else {
      setExcelStatus("error");
      setExcelMsg(backendError || "Could not read org details from file. Make sure it uses the template format.");
    }
    if (excelRef.current) excelRef.current.value = "";
  };

  const handleApiConnect = async () => {
    if (!apiUrl.trim()) { setApiStatus("error"); setApiMsg("Please enter an API URL"); return; }
    setApiStatus("idle");
    const result = await connectApi({ url: apiUrl.trim(), api_key: apiKey.trim(), token: apiToken.trim() });
    if ("data" in result && result.data) {
      const envelope = result.data as { success?: boolean; data?: Record<string, string> };
      const d = envelope.data ?? {};
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
    await saveStep1({
      ...form,
      numberOfEmployees: Number(form.numberOfEmployees) || 0,
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

      <div className="flex justify-end">
        <button className={primaryBtnCls} style={primaryBtnStyle} onClick={handleNext} disabled={saving}>
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
  const { data: saved2 } = useGetOrgSetupStep2Query();

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
  const [step2Error, setStep2Error] = useState("");

  // Pre-fill from saved data
  useEffect(() => {
    if (saved2 && Object.keys(saved2).length > 0) {
      const s = saved2 as Record<string, unknown>;
      if (Array.isArray(s.applicableStandards)) setSelectedStandards(s.applicableStandards as string[]);
      if (typeof s.regulatoryRegion === "string") setRegulatoryRegion(s.regulatoryRegion);
      if (typeof s.auditFrequency === "string") setAuditFrequency(s.auditFrequency);
      if (s.capaSlaCriticalDays != null) setCapaCritical(String(s.capaSlaCriticalDays));
      if (s.capaSlaStandardDays != null) setCapaStandard(String(s.capaSlaStandardDays));
      if (Array.isArray(s.permitTypes)) setSelectedPermits(s.permitTypes as string[]);
      if (Array.isArray(s.incidentSeverityMatrix)) setSeverityMatrix(s.incidentSeverityMatrix as typeof severityMatrix);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved2]);

  const toggleStandard = (s: string) =>
    setSelectedStandards((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const togglePermit = (p: string) =>
    setSelectedPermits((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  const updateSeverity = (idx: number, desc: string) => {
    setSeverityMatrix((prev) => prev.map((row, i) => i === idx ? { ...row, description: desc } : row));
  };

  const handleNext = async () => {
    if (selectedStandards.length === 0) {
      setStep2Error("Select at least one applicable standard before proceeding.");
      return;
    }
    setStep2Error("");
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

      {step2Error && (
        <div className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ background: "#FEF2F2", color: "#EF4444" }}>
          {step2Error}
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

  const [form, setForm] = useState({
    name: "", type: "", address: "", postcode: "", city: "",
    operationalStatus: "", workingStations: "", capacity: "",
    primaryProducts: "", hazardClassification: "",
  });
  const [error, setError] = useState("");

  const handleAdd = async () => {
    if (!form.name.trim()) { setError("Site name is required"); return; }
    setError("");
    await createSite({
      name: form.name, type: form.type, address: form.address,
      postcode: form.postcode, city: form.city,
      operationalStatus: form.operationalStatus,
      workingStations: form.workingStations,
      capacity: form.capacity,
      primaryProducts: form.primaryProducts,
      hazardClassification: form.hazardClassification,
    });
    setForm({
      name: "", type: "", address: "", postcode: "", city: "",
      operationalStatus: "", workingStations: "", capacity: "",
      primaryProducts: "", hazardClassification: "",
    });
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
      setUploadError("Upload failed. Check that your file has a 'Site Name' column and matches the template format.");
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
        <span className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Excel (.xlsx, .xls) or CSV — Site Name, Address, Postcode, City, Type, Status, Stations, Capacity, Products, Hazard</span>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelCls} style={labelStyle}>Site Name *</label>
          <input className={inputCls} style={inputStyle} placeholder="e.g. Bridgend Manufacturing Complex" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Type</label>
          <select className={inputCls} style={inputStyle} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            <option value="">Select type</option>
            {SITE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={labelCls} style={labelStyle}>Address</label>
          <input className={inputCls} style={inputStyle} placeholder="Street address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Postcode</label>
          <input className={inputCls} style={inputStyle} placeholder="e.g. CF31 3TR" value={form.postcode} onChange={(e) => setForm((f) => ({ ...f, postcode: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>City</label>
          <input className={inputCls} style={inputStyle} placeholder="e.g. Bridgend" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Operational Status</label>
          <select className={inputCls} style={inputStyle} value={form.operationalStatus} onChange={(e) => setForm((f) => ({ ...f, operationalStatus: e.target.value }))}>
            <option value="">Select status</option>
            {OPERATIONAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Number of Working Stations</label>
          <input type="number" min="0" className={inputCls} style={inputStyle} placeholder="e.g. 32" value={form.workingStations} onChange={(e) => setForm((f) => ({ ...f, workingStations: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Capacity</label>
          <input type="number" min="0" className={inputCls} style={inputStyle} placeholder="e.g. 150" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Primary Products</label>
          <input className={inputCls} style={inputStyle} placeholder="e.g. Wind Turbine Nacelles" value={form.primaryProducts} onChange={(e) => setForm((f) => ({ ...f, primaryProducts: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Hazard Classification</label>
          <select className={inputCls} style={inputStyle} value={form.hazardClassification} onChange={(e) => setForm((f) => ({ ...f, hazardClassification: e.target.value }))}>
            <option value="">Select classification</option>
            {HAZARD_CLASSIFICATIONS.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
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
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>City</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Stations</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Primary Products</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>Hazard</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((site) => (
                <tr key={site.id} className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "#111827" }}>{site.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "#EEF2FF", color: "#4A57B9" }}>{site.type || "—"}</span>
                  </td>
                  <td className="px-4 py-3" style={{ color: "#6B7280" }}>{site.city || "—"}</td>
                  <td className="px-4 py-3">
                    {site.operationalStatus ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{
                        background: site.operationalStatus === "Active" ? "#D1FAE5" : "#F3F4F6",
                        color: site.operationalStatus === "Active" ? "#059669" : "#6B7280",
                      }}>{site.operationalStatus}</span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-center" style={{ color: "#6B7280" }}>{site.workingStations ?? "—"}</td>
                  <td className="px-4 py-3" style={{ color: "#6B7280" }}>{site.primaryProducts || "—"}</td>
                  <td className="px-4 py-3">
                    {site.hazardClassification ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{
                        background: site.hazardClassification === "Critical" ? "#FEE2E2" : site.hazardClassification === "High Risk" ? "#FEF3C7" : site.hazardClassification === "Medium Risk" ? "#FEF9C3" : "#D1FAE5",
                        color: site.hazardClassification === "Critical" ? "#DC2626" : site.hazardClassification === "High Risk" ? "#D97706" : site.hazardClassification === "Medium Risk" ? "#CA8A04" : "#059669",
                      }}>{site.hazardClassification}</span>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {sites.length === 0 && !sitesLoading && (
        <div className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ background: "#FEF2F2", color: "#EF4444" }}>
          Add at least one site before proceeding to the next step.
        </div>
      )}
      <div className="flex justify-between">
        <button className={secondaryBtnCls} style={secondaryBtnStyle} onClick={onBack}>Back</button>
        <button className={primaryBtnCls} style={primaryBtnStyle} onClick={onNext} disabled={sites.length === 0}>
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

      {users.length === 0 && !usersLoading && (
        <div className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ background: "#FEF2F2", color: "#EF4444" }}>
          Add at least one user before proceeding to the next step.
        </div>
      )}
      <div className="flex justify-between">
        <button className={secondaryBtnCls} style={secondaryBtnStyle} onClick={onBack}>Back</button>
        <button className={primaryBtnCls} style={primaryBtnStyle} onClick={onNext} disabled={users.length === 0}>
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
  const { data: saved5 } = useGetOrgSetupStep5Query();

  const initialWorkflows: WorkflowState = {};
  WORKFLOW_CARDS.forEach(({ key }) => {
    initialWorkflows[key] = { enabled: true, config: "", expanded: false };
  });
  const [workflows, setWorkflows] = useState<WorkflowState>(initialWorkflows);

  // Pre-fill from saved data
  useEffect(() => {
    if (saved5 && Object.keys(saved5).length > 0) {
      const s = saved5 as Record<string, unknown>;
      if (Array.isArray(s.workflows)) {
        const saved = s.workflows as { name: string; enabled: boolean; config: string }[];
        setWorkflows((prev) => {
          const next = { ...prev };
          saved.forEach(({ name, enabled, config }) => {
            const card = WORKFLOW_CARDS.find((c) => c.label === name);
            if (card) next[card.key] = { enabled, config, expanded: false };
          });
          return next;
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved5]);

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
  const [importData, { isLoading: importingLegacy }] = useImportOrgSetupDataMutation();
  const [bulkImportModule, { isLoading: importingBulk }] = useBulkImportModuleMutation();
  const importing = importingLegacy || importingBulk;

  const docFileRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const [docForm, setDocForm] = useState({ name: "", type: "" });
  const [selectedDataType, setSelectedDataType] = useState("");
  const [importMethod, setImportMethod] = useState<"manual" | "bulk" | "api">("bulk");
  const [apiUrl, setApiUrl] = useState("");
  const [manualFormData, setManualFormData] = useState<Record<string, string>>({});
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ count: number; errors?: string[] } | null>(null);

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
    setBulkResult(null);
    if (importMethod === "api") {
      await importData({ dataType: selectedDataType, method: "api", url: apiUrl });
      refetchImports();
      return;
    }
    const file = e?.target.files?.[0];
    if (!file) return;
    const result = await bulkImportModule({ module: selectedDataType, file });
    if ("data" in result && result.data) {
      setBulkResult(result.data);
    }
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
                      <td className="px-5 py-3" style={{ color: "#6B7280" }}>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "—"}</td>
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

            {importMethod === "manual" && (() => {
              const fields = selectedDataType ? (IMPORT_FIELDS[selectedDataType] ?? []) : [];
              if (!selectedDataType) {
                return (
                  <div className="p-4 rounded-xl text-sm" style={{ background: "#F9FAFB", color: "#6B7280" }}>
                    Select a data type above to see the entry form.
                  </div>
                );
              }
              const handleManualSubmit = async () => {
                const required = fields.filter(f => f.required);
                const missing = required.filter(f => !manualFormData[f.key]?.trim());
                if (missing.length) return;
                setManualSubmitting(true);
                try {
                  await importData({ dataType: selectedDataType, method: "manual", ...manualFormData });
                  setManualFormData({});
                  setManualSuccess(true);
                  setTimeout(() => setManualSuccess(false), 3000);
                  refetchImports();
                } finally {
                  setManualSubmitting(false);
                }
              };
              return (
                <div className="space-y-4">
                  {manualSuccess && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: "#D1FAE5", color: "#065F46" }}>
                      <Check className="w-4 h-4" /> Record saved successfully
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {fields.map((f) => (
                      <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
                        <label className={labelCls} style={labelStyle}>
                          {f.label}{f.required && <span style={{ color: "#EF4444" }}> *</span>}
                        </label>
                        {f.type === "select" ? (
                          <select
                            className={inputCls} style={inputStyle}
                            value={manualFormData[f.key] ?? ""}
                            onChange={e => setManualFormData(d => ({ ...d, [f.key]: e.target.value }))}
                          >
                            <option value="">Select…</option>
                            {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : f.type === "textarea" ? (
                          <textarea
                            rows={3}
                            className={inputCls} style={inputStyle}
                            placeholder={f.placeholder}
                            value={manualFormData[f.key] ?? ""}
                            onChange={e => setManualFormData(d => ({ ...d, [f.key]: e.target.value }))}
                          />
                        ) : (
                          <input
                            type={f.type}
                            className={inputCls} style={inputStyle}
                            placeholder={f.placeholder}
                            value={manualFormData[f.key] ?? ""}
                            onChange={e => setManualFormData(d => ({ ...d, [f.key]: e.target.value }))}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    className={primaryBtnCls} style={primaryBtnStyle}
                    onClick={handleManualSubmit}
                    disabled={manualSubmitting}
                  >
                    {manualSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save Record
                  </button>
                </div>
              );
            })()}

            {importMethod === "bulk" && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <label
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold cursor-pointer transition-colors"
                    style={{ borderColor: "#E3E9F6", color: "#4A57B9", opacity: (!selectedDataType || importing) ? 0.6 : 1 }}
                  >
                    {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {importing ? "Importing…" : "Upload File (.xlsx / .csv)"}
                    <input
                      ref={importFileRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={handleImport}
                      disabled={!selectedDataType || importing}
                    />
                  </label>
                  <button
                    className={secondaryBtnCls}
                    style={{ ...secondaryBtnStyle, opacity: selectedDataType ? 1 : 0.5 }}
                    disabled={!selectedDataType}
                    onClick={() => selectedDataType && downloadTemplate(`/v1/org-setup/template/${selectedDataType}`, `${selectedDataType}_template.csv`)}
                  >
                    <Download className="w-4 h-4" /> Download Template
                  </button>
                  {!selectedDataType && <span className="text-xs" style={{ color: "#F59E0B" }}>Select a data type above first</span>}
                </div>
                {bulkResult && (
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ background: (bulkResult.errors?.length ?? 0) > 0 ? "#FEF3C7" : "#D1FAE5", color: (bulkResult.errors?.length ?? 0) > 0 ? "#92400E" : "#065F46" }}
                  >
                    <Check className="w-4 h-4" />
                    {bulkResult.count} records imported successfully
                    {(bulkResult.errors?.length ?? 0) > 0 && ` (${bulkResult.errors!.length} warnings)`}
                  </div>
                )}
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

      {documents.length === 0 && imports.length === 0 && !docsLoading && !importsLoading && (
        <div className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ background: "#FFFBEB", color: "#D97706" }}>
          Upload at least one knowledge document or import a data module before proceeding.
        </div>
      )}
      <div className="flex justify-between">
        <button className={secondaryBtnCls} style={secondaryBtnStyle} onClick={onBack}>Back</button>
        <button className={primaryBtnCls} style={primaryBtnStyle} onClick={onNext} disabled={documents.length === 0 && imports.length === 0}>
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
  const { data: saved7 } = useGetOrgSetupStep7Query();

  const initialState: Record<string, boolean> = {};
  AI_FEATURES.forEach(({ key }) => { initialState[key] = true; });
  const [features, setFeatures] = useState<Record<string, boolean>>(initialState);

  // Pre-fill from saved data
  useEffect(() => {
    if (saved7 && Object.keys(saved7).length > 0) {
      const s = saved7 as Record<string, unknown>;
      if (Array.isArray(s.aiFeatures)) {
        const saved = s.aiFeatures as { name: string; enabled: boolean }[];
        setFeatures((prev) => {
          const next = { ...prev };
          saved.forEach(({ name, enabled }) => {
            const feat = AI_FEATURES.find((f) => f.label === name);
            if (feat) next[feat.key] = enabled;
          });
          return next;
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved7]);

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
      <div className="flex items-center justify-between flex-wrap gap-3">
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
        {completedSteps.length > 0 && currentStep > 1 && (
          <button
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors"
            style={{ borderColor: "#E3E9F6", color: "#6B7280", background: "#fff" }}
            onClick={() => { setCurrentStep(1); setCompletedSteps([]); setProgressLoaded(false); }}
            title="Clear progress and restart from Step 1"
          >
            ↺ Start Over
          </button>
        )}
      </div>

      {/* Step Indicator — click any green step to go back to it */}
      <StepIndicator
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={(step) => setCurrentStep(step)}
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
