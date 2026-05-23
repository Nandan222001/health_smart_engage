import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Building2, Shield, MapPin, Users, GitBranch,
  BookOpen, Brain, CheckCircle2, ChevronRight, ChevronLeft,
} from "lucide-react";
import { useCreateTenantMutation } from "@/features/superadmin/api/adminApi";

const STEPS = [
  { id: 1, label: "Organisation Details", icon: Building2, description: "Basic org info, branding, and contact" },
  { id: 2, label: "Industry & Compliance", icon: Shield, description: "Industry type and compliance frameworks" },
  { id: 3, label: "Site Structure Setup", icon: MapPin, description: "Sites, zones, and departments hierarchy" },
  { id: 4, label: "Roles & Users Setup", icon: Users, description: "User roles and initial team members" },
  { id: 5, label: "Workflow Configuration", icon: GitBranch, description: "Permit, incident, and audit workflows" },
  { id: 6, label: "Knowledge Centre Setup", icon: BookOpen, description: "Document library and SOPs" },
  { id: 7, label: "AI & Intelligence Setup", icon: Brain, description: "AI models, alerts, and predictions" },
  { id: 8, label: "Review & Activate", icon: CheckCircle2, description: "Final review before tenant activation" },
];

interface WizardData {
  // Step 1
  org_name: string;
  org_code: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  // Step 2
  industry: string;
  compliance_frameworks: string[];
  // Step 3
  sites: { name: string; type: string }[];
  // Step 4
  plan: string;
  admin_email: string;
  // Step 5
  permit_workflow: boolean;
  incident_workflow: boolean;
  audit_workflow: boolean;
  // Step 6
  enable_knowledge_centre: boolean;
  // Step 7
  enable_ai: boolean;
  ai_features: string[];
}

const DEFAULT_DATA: WizardData = {
  org_name: "",
  org_code: "",
  contact_email: "",
  contact_phone: "",
  address: "",
  industry: "",
  compliance_frameworks: [],
  sites: [{ name: "", type: "office" }],
  plan: "Pro",
  admin_email: "",
  permit_workflow: true,
  incident_workflow: true,
  audit_workflow: true,
  enable_knowledge_centre: true,
  enable_ai: true,
  ai_features: ["violations", "risk_prediction"],
};

const INDUSTRIES = ["Manufacturing", "Construction", "Oil & Gas", "Mining", "Healthcare", "Logistics", "Utilities", "Other"];
const FRAMEWORKS = ["ISO 45001", "OSHA", "RIDDOR", "NEBOSH", "COSHH", "ISO 14001"];
const AI_FEATURES = [
  { id: "violations", label: "PPE & Violation Detection" },
  { id: "risk_prediction", label: "Risk Prediction" },
  { id: "near_miss", label: "Near-Miss Analysis" },
  { id: "permit_assist", label: "Permit AI Assist" },
];

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>{children}</label>;
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
      style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function Step1({ data, set }: { data: WizardData; set: (k: keyof WizardData, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Organisation Name *</Label>
          <Input value={data.org_name} onChange={(v) => set("org_name", v)} placeholder="Acme Corp" />
        </div>
        <div>
          <Label>Organisation Code *</Label>
          <Input value={data.org_code} onChange={(v) => set("org_code", v.toUpperCase())} placeholder="ACME" />
          <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Unique identifier (uppercase, no spaces)</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Contact Email *</Label>
          <Input value={data.contact_email} onChange={(v) => set("contact_email", v)} placeholder="admin@acme.com" type="email" />
        </div>
        <div>
          <Label>Contact Phone</Label>
          <Input value={data.contact_phone} onChange={(v) => set("contact_phone", v)} placeholder="+1 555 000 0000" />
        </div>
      </div>
      <div>
        <Label>Address</Label>
        <Input value={data.address} onChange={(v) => set("address", v)} placeholder="123 Industrial Ave, City, Country" />
      </div>
    </div>
  );
}

function Step2({ data, set }: { data: WizardData; set: (k: keyof WizardData, v: unknown) => void }) {
  const toggle = (framework: string) => {
    const current = data.compliance_frameworks;
    set("compliance_frameworks", current.includes(framework) ? current.filter((f) => f !== framework) : [...current, framework]);
  };
  return (
    <div className="space-y-5">
      <div>
        <Label>Industry *</Label>
        <div className="grid grid-cols-4 gap-2 mt-2">
          {INDUSTRIES.map((ind) => (
            <button
              key={ind}
              type="button"
              onClick={() => set("industry", ind)}
              className="px-3 py-2 rounded-xl border text-xs font-medium transition-all"
              style={data.industry === ind ? { background: "#4A57B9", color: "#fff", borderColor: "#4A57B9" } : { borderColor: "#E3E9F6", color: "#374151" }}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Compliance Frameworks</Label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {FRAMEWORKS.map((fw) => (
            <button
              key={fw}
              type="button"
              onClick={() => toggle(fw)}
              className="px-3 py-2 rounded-xl border text-xs font-medium transition-all text-left"
              style={data.compliance_frameworks.includes(fw) ? { background: "#EEF2FB", color: "#4A57B9", borderColor: "#4A57B9" } : { borderColor: "#E3E9F6", color: "#374151" }}
            >
              {data.compliance_frameworks.includes(fw) && "✓ "}{fw}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step3({ data, set }: { data: WizardData; set: (k: keyof WizardData, v: unknown) => void }) {
  const updateSite = (i: number, field: string, value: string) => {
    const sites = [...data.sites];
    sites[i] = { ...sites[i], [field]: value };
    set("sites", sites);
  };
  const addSite = () => set("sites", [...data.sites, { name: "", type: "office" }]);
  const removeSite = (i: number) => set("sites", data.sites.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      {data.sites.map((site, i) => (
        <div key={i} className="flex items-center gap-3 p-4 rounded-xl border" style={{ borderColor: "#E3E9F6" }}>
          <div className="flex-1">
            <Label>Site Name</Label>
            <Input value={site.name} onChange={(v) => updateSite(i, "name", v)} placeholder={`Site ${i + 1}`} />
          </div>
          <div className="w-36">
            <Label>Type</Label>
            <select
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: "#E3E9F6" }}
              value={site.type}
              onChange={(e) => updateSite(i, "type", e.target.value)}
            >
              {["office", "factory", "warehouse", "field", "construction", "other"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          {data.sites.length > 1 && (
            <button type="button" onClick={() => removeSite(i)} className="text-xs text-red-400 mt-5 hover:text-red-600">Remove</button>
          )}
        </div>
      ))}
      <button type="button" onClick={addSite} className="text-sm font-medium" style={{ color: "#4A57B9" }}>+ Add another site</button>
    </div>
  );
}

function Step4({ data, set }: { data: WizardData; set: (k: keyof WizardData, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Subscription Plan *</Label>
        <div className="grid grid-cols-3 gap-3 mt-2">
          {["Free", "Pro", "Enterprise"].map((plan) => (
            <button
              key={plan}
              type="button"
              onClick={() => set("plan", plan)}
              className="p-4 rounded-xl border text-sm font-semibold transition-all"
              style={data.plan === plan ? { background: "#4A57B9", color: "#fff", borderColor: "#4A57B9" } : { borderColor: "#E3E9F6", color: "#374151" }}
            >
              {plan}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Primary Admin Email *</Label>
        <Input value={data.admin_email} onChange={(v) => set("admin_email", v)} placeholder="admin@organisation.com" type="email" />
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>An invitation will be sent to this address.</p>
      </div>
    </div>
  );
}

function ToggleRow({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: "#E3E9F6" }}>
      <div>
        <div className="text-sm font-semibold" style={{ color: "#111827" }}>{label}</div>
        {sub && <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{sub}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="w-11 h-6 rounded-full transition-colors relative flex-shrink-0"
        style={{ background: checked ? "#4A57B9" : "#E5E7EB" }}
      >
        <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform" style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }} />
      </button>
    </div>
  );
}

function Step5({ data, set }: { data: WizardData; set: (k: keyof WizardData, v: unknown) => void }) {
  return (
    <div className="space-y-3">
      <ToggleRow label="Permit-to-Work Workflow" sub="Multi-stage permit approval with conflict detection" checked={data.permit_workflow} onChange={(v) => set("permit_workflow", v)} />
      <ToggleRow label="Incident Investigation Workflow" sub="Root cause → CAPA → closure loop" checked={data.incident_workflow} onChange={(v) => set("incident_workflow", v)} />
      <ToggleRow label="Audit & CAPA Workflow" sub="Checklist-driven audits with corrective actions" checked={data.audit_workflow} onChange={(v) => set("audit_workflow", v)} />
    </div>
  );
}

function Step6({ data, set }: { data: WizardData; set: (k: keyof WizardData, v: unknown) => void }) {
  return (
    <div className="space-y-3">
      <ToggleRow label="Enable Knowledge Centre" sub="Document library, SOPs, and AI-indexed knowledge base" checked={data.enable_knowledge_centre} onChange={(v) => set("enable_knowledge_centre", v)} />
      <p className="text-sm px-1" style={{ color: "#6B7280" }}>
        The knowledge centre can be populated with documents after activation. Enabling it now provisions the storage index.
      </p>
    </div>
  );
}

function Step7({ data, set }: { data: WizardData; set: (k: keyof WizardData, v: unknown) => void }) {
  const toggleFeature = (id: string) => {
    const current = data.ai_features;
    set("ai_features", current.includes(id) ? current.filter((f) => f !== id) : [...current, id]);
  };
  return (
    <div className="space-y-3">
      <ToggleRow label="Enable AI & Intelligence Layer" sub="Powers all AI features below" checked={data.enable_ai} onChange={(v) => set("enable_ai", v)} />
      {data.enable_ai && (
        <div className="mt-4 space-y-2 pl-2">
          {AI_FEATURES.map((feat) => (
            <button
              key={feat.id}
              type="button"
              onClick={() => toggleFeature(feat.id)}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all"
              style={data.ai_features.includes(feat.id) ? { borderColor: "#4A57B9", background: "#EEF2FB" } : { borderColor: "#E3E9F6" }}
            >
              <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: data.ai_features.includes(feat.id) ? "#4A57B9" : "#D1D5DB", background: data.ai_features.includes(feat.id) ? "#4A57B9" : "transparent" }}>
                {data.ai_features.includes(feat.id) && <span className="text-white text-xs">✓</span>}
              </div>
              <span className="text-sm font-medium" style={{ color: "#111827" }}>{feat.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Step8({ data, isLoading }: { data: WizardData; isLoading: boolean }) {
  const rows = [
    ["Organisation", data.org_name || "—"],
    ["Org Code", data.org_code || "—"],
    ["Contact Email", data.contact_email || "—"],
    ["Industry", data.industry || "—"],
    ["Compliance", data.compliance_frameworks.join(", ") || "None"],
    ["Sites", data.sites.filter((s) => s.name).map((s) => s.name).join(", ") || "—"],
    ["Plan", data.plan],
    ["Admin Email", data.admin_email || "—"],
    ["Workflows", [data.permit_workflow && "Permit", data.incident_workflow && "Incident", data.audit_workflow && "Audit"].filter(Boolean).join(", ") || "None"],
    ["Knowledge Centre", data.enable_knowledge_centre ? "Enabled" : "Disabled"],
    ["AI Layer", data.enable_ai ? `Enabled (${data.ai_features.length} features)` : "Disabled"],
  ];
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl p-4 text-sm" style={{ color: "#1D4ED8" }}>
        Review the configuration below before activating the tenant. Once activated, an invitation email is sent to the admin.
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        {rows.map(([label, value], i) => (
          <div key={label} className="flex text-sm" style={{ borderBottom: i < rows.length - 1 ? "1px solid #F3F4F6" : undefined }}>
            <div className="w-44 px-4 py-3 font-semibold flex-shrink-0" style={{ color: "#6B7280", background: "#F8FAFF" }}>{label}</div>
            <div className="px-4 py-3" style={{ color: "#111827" }}>{value}</div>
          </div>
        ))}
      </div>
      {isLoading && <p className="text-sm text-center" style={{ color: "#4A57B9" }}>Creating tenant…</p>}
    </div>
  );
}

export function OnboardingWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(DEFAULT_DATA);
  const [createTenant, { isLoading }] = useCreateTenantMutation();

  const set = (key: keyof WizardData, value: unknown) => setData((prev) => ({ ...prev, [key]: value }));

  const canNext = () => {
    if (step === 1) return data.org_name.trim() && data.org_code.trim() && data.contact_email.trim();
    if (step === 2) return Boolean(data.industry);
    if (step === 4) return data.admin_email.trim();
    return true;
  };

  const handleActivate = async () => {
    try {
      await createTenant({
        name: data.org_name,
        org_code: data.org_code,
        plan: data.plan,
        status: "active",
      }).unwrap();
      navigate("/superadmin/tenants");
    } catch {
      // Error handled by RTK Query, user can retry
    }
  };

  const StepContent = () => {
    switch (step) {
      case 1: return <Step1 data={data} set={set} />;
      case 2: return <Step2 data={data} set={set} />;
      case 3: return <Step3 data={data} set={set} />;
      case 4: return <Step4 data={data} set={set} />;
      case 5: return <Step5 data={data} set={set} />;
      case 6: return <Step6 data={data} set={set} />;
      case 7: return <Step7 data={data} set={set} />;
      case 8: return <Step8 data={data} isLoading={isLoading} />;
      default: return null;
    }
  };

  const current = STEPS[step - 1];
  const Icon = current.icon;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Create New Tenant</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>8-step onboarding wizard — set up a new organisation end-to-end</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((s) => {
          const StepIcon = s.icon;
          const done = s.id < step;
          const active = s.id === step;
          return (
            <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => done && setStep(s.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={
                  active
                    ? { background: "#4A57B9", color: "#fff" }
                    : done
                    ? { background: "#EEF2FB", color: "#4A57B9", cursor: "pointer" }
                    : { background: "#F3F4F6", color: "#9CA3AF" }
                }
              >
                {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <StepIcon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.id}</span>
              </button>
              {s.id < STEPS.length && <div className="w-4 h-px flex-shrink-0" style={{ background: done ? "#4A57B9" : "#E5E7EB" }} />}
            </div>
          );
        })}
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border p-6 space-y-5" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#EEF2FB" }}>
            <Icon className="w-5 h-5" style={{ color: "#4A57B9" }} />
          </div>
          <div>
            <div className="text-base font-bold" style={{ color: "#111827" }}>Step {step} — {current.label}</div>
            <div className="text-xs" style={{ color: "#9CA3AF" }}>{current.description}</div>
          </div>
        </div>

        <StepContent />
      </div>

      {/* Nav buttons */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => (step === 1 ? navigate("/superadmin") : setStep(step - 1))}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold"
          style={{ borderColor: "#E3E9F6", color: "#374151" }}
        >
          <ChevronLeft className="w-4 h-4" /> {step === 1 ? "Cancel" : "Back"}
        </button>

        {step < 8 ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleActivate}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isLoading ? "Activating…" : "Activate Tenant"}
          </button>
        )}
      </div>
    </div>
  );
}
