import { useState, useEffect } from "react";
import {
  GitBranch, CheckCircle2, AlertCircle, Loader2,
  Save, Plus, Trash2, Edit, X, ChevronRight,
  AlertTriangle, ClipboardCheck, Shield, Bell,
  Clock, Zap, Users, Mail, Smartphone, RefreshCw,
  Settings, ToggleLeft, ToggleRight, Info, Lock,
  ArrowRight, UserCheck, Flag, BookOpen,
} from "lucide-react";
import {
  useGetOrgSetupStep2Query,
  useSaveOrgSetupStep2Mutation,
  useGetOrgSetupStep5Query,
  useSaveOrgSetupStep5Mutation,
} from "@/features/org-setup/api/orgSetupApi";
import {
  useListEscalationRulesQuery,
  useCreateEscalationRuleMutation,
  useUpdateEscalationRuleMutation,
  useDeleteEscalationRuleMutation,
  type EscalationRule,
} from "@/features/workflow/api/escalationRulesApi";
import { useGetWorkflowDashboardQuery } from "@/features/workflow/api/workflowEngineApi";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES     = ["Admin", "HSE Manager", "Supervisor", "Auditor", "Site Manager", "Department Head", "Safety Officer"];
const NOTIF_CH  = ["email", "sms", "push", "in_app"] as const;
const NOTIF_META: Record<string, { label: string; icon: typeof Mail }> = {
  email:  { label: "Email",     icon: Mail       },
  sms:    { label: "SMS",       icon: Smartphone },
  push:   { label: "Push",      icon: Bell       },
  in_app: { label: "In-App",    icon: Bell       },
};

const TRIGGER_EVENTS = [
  "incident_reported", "incident_severity_changed", "permit_submitted",
  "capa_overdue", "audit_finding_raised", "near_miss_reported",
  "approval_pending", "sla_breach_imminent",
];

const SEV_COLORS: Record<string, { color: string; bg: string }> = {
  critical: { color: "#DC2626", bg: "#FEF2F2" },
  high:     { color: "#EA580C", bg: "#FFF7ED" },
  medium:   { color: "#D97706", bg: "#FFFBEB" },
  low:      { color: "#059669", bg: "#ECFDF5" },
};

// ─── Shared components ────────────────────────────────────────────────────────

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold"
      style={{ background: ok ? "#ECFDF5" : "#FEF2F2", color: ok ? "#065F46" : "#991B1B", border: `1px solid ${ok ? "#A7F3D0" : "#FECACA"}` }}>
      {ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      {msg}
    </div>
  );
}

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button onClick={() => !disabled && onChange(!value)} disabled={disabled}
      className="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: value ? "#4F46E5" : "#E5E7EB" }}>
      <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: value ? "translateX(21px)" : "translateX(2px)" }} />
    </button>
  );
}

function SectionCard({ title, subtitle, icon: Icon, color, children }: {
  title: string; subtitle: string; icon: typeof GitBranch; color: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3 border-b last:border-0" style={{ borderColor: "#F1F5F9" }}>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function NumberInput({ value, onChange, min = 0, max = 999, suffix }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input type="number" value={value} min={min} max={max}
        onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
        className="w-20 text-sm border rounded-xl px-3 py-1.5 text-center outline-none font-bold"
        style={{ borderColor: "#E3E9F6", color: "#111827" }} />
      {suffix && <span className="text-xs text-slate-400">{suffix}</span>}
    </div>
  );
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="text-sm border rounded-xl px-3 py-1.5 bg-white outline-none min-w-36"
      style={{ borderColor: "#E3E9F6", color: "#111827" }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function SaveBar({ onSave, saving, success, error }: {
  onSave: () => void; saving: boolean; success: boolean; error: string | null;
}) {
  return (
    <div className="flex items-center gap-4 pt-5 mt-2 border-t" style={{ borderColor: "#F1F5F9" }}>
      <button onClick={onSave} disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-60 hover:opacity-90 transition-opacity"
        style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)" }}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {saving ? "Saving…" : "Save Changes"}
      </button>
      {success && <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600"><CheckCircle2 size={14} />Saved</div>}
      {error   && <div className="flex items-center gap-1.5 text-sm font-semibold text-red-600"><AlertCircle size={14} />{error}</div>}
    </div>
  );
}

// ─── Tab: Approval Workflows ──────────────────────────────────────────────────

function ApprovalTab() {
  const { data: step5 }                               = useGetOrgSetupStep5Query();
  const [saveStep5, { isLoading: saving }]            = useSaveOrgSetupStep5Mutation();
  const { data: rawRules = [], isLoading: rulesLoad } = useListEscalationRulesQuery();
  const [createRule, { isLoading: creating }]         = useCreateEscalationRuleMutation();
  const [updateRule]                                  = useUpdateEscalationRuleMutation();
  const [deleteRule]                                  = useDeleteEscalationRuleMutation();

  const rules: EscalationRule[] = Array.isArray(rawRules) ? rawRules : [];

  const [enabled, setEnabled]   = useState(true);
  const [levels,  setLevels]    = useState(2);
  const [approvers, setApprovers] = useState<Record<number, string>>({ 1: "Supervisor", 2: "HSE Manager", 3: "Admin" });
  const [slaHours, setSlaHours]   = useState<Record<number, number>>({ 1: 24, 2: 48, 3: 72 });
  const [toast,   setToast]     = useState<{ msg: string; ok: boolean } | null>(null);
  const [success, setSuccess]   = useState(false);
  const [error,   setError]     = useState<string | null>(null);
  const [ruleModal, setRuleModal] = useState(false);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [ruleForm, setRuleForm]   = useState<Partial<EscalationRule>>({
    name: "", trigger_event: "approval_pending", delay_minutes: 60,
    escalate_to_role: "HSE Manager", notify_via: ["email"], is_active: true,
  });

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (step5?.workflows?.permitWorkflows) {
      setEnabled(step5.workflows.permitWorkflows.enabled ?? true);
    }
  }, [step5]);

  async function handleSave() {
    try {
      setError(null);
      await saveStep5({
        workflows: {
          permitWorkflows:   { enabled, config: JSON.stringify({ levels, approvers, slaHours }) },
          incidentWorkflows: step5?.workflows?.incidentWorkflows ?? { enabled: true, config: "" },
          auditWorkflows:    step5?.workflows?.auditWorkflows    ?? { enabled: true, config: "" },
          capaWorkflows:     step5?.workflows?.capaWorkflows     ?? { enabled: true, config: "" },
          escalationRules:   step5?.workflows?.escalationRules   ?? { enabled: true, config: "" },
          approvalLevels:    step5?.workflows?.approvalLevels    ?? { enabled: true, config: "" },
        },
      }).unwrap();
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch { setError("Failed to save approval settings."); }
  }

  async function handleCreateRule() {
    if (!ruleForm.name?.trim()) return;
    try {
      await createRule(ruleForm).unwrap();
      showToast("Escalation rule created."); setRuleModal(false);
      setRuleForm({ name: "", trigger_event: "approval_pending", delay_minutes: 60, escalate_to_role: "HSE Manager", notify_via: ["email"], is_active: true });
    } catch { showToast("Failed to create rule.", false); }
  }

  async function handleToggleRule(rule: EscalationRule) {
    try { await updateRule({ ruleId: rule.id, body: { is_active: !rule.is_active } }).unwrap(); }
    catch { showToast("Failed to update rule.", false); }
  }

  async function handleDeleteRule(id: string) {
    try { await deleteRule(id).unwrap(); showToast("Rule deleted.", false); }
    catch { showToast("Failed to delete rule.", false); }
    setDeleteId(null);
  }

  function toggleNotifCh(ch: string) {
    const current = ruleForm.notify_via ?? [];
    setRuleForm({ ...ruleForm, notify_via: current.includes(ch) ? current.filter(c => c !== ch) : [...current, ch] });
  }

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} />}

      <div>
        <h2 className="text-lg font-bold text-slate-800">Approval Workflows</h2>
        <p className="text-xs text-slate-500 mt-0.5">Configure multi-level approval chains, SLA timeouts and auto-escalation rules.</p>
      </div>

      {/* Master toggle */}
      <SectionCard icon={Shield} title="Approval Workflow" subtitle="Enable or disable the approval engine across all case types" color="#4F46E5">
        <FieldRow label="Enable Approval Workflow" hint="When disabled, cases proceed without requiring approvals.">
          <Toggle value={enabled} onChange={setEnabled} />
        </FieldRow>
        <FieldRow label="Number of Approval Levels" hint="How many sequential approvers must sign off on a case.">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(n => (
              <button key={n} onClick={() => setLevels(n)}
                className="w-9 h-9 rounded-xl text-sm font-extrabold border transition-all"
                style={levels === n
                  ? { background: "#4F46E5", color: "white", borderColor: "#4F46E5" }
                  : { background: "white", color: "#6B7280", borderColor: "#E3E9F6" }}>
                {n}
              </button>
            ))}
          </div>
        </FieldRow>
      </SectionCard>

      {/* Approval levels */}
      <SectionCard icon={Users} title="Approval Level Configuration" subtitle="Set the approver role and SLA for each level" color="#0891B2">
        {Array.from({ length: levels }, (_, i) => i + 1).map(lvl => (
          <div key={lvl} className="flex items-center gap-4 py-3 border-b last:border-0" style={{ borderColor: "#F1F5F9" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0"
              style={{ background: lvl === 1 ? "#0891B2" : lvl === 2 ? "#4F46E5" : "#7C3AED" }}>
              {lvl}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-700">Level {lvl} Approver</p>
              <p className="text-xs text-slate-400">First approver in the chain</p>
            </div>
            <SelectInput value={approvers[lvl] ?? "Supervisor"} onChange={v => setApprovers({ ...approvers, [lvl]: v })} options={ROLES} />
            <div className="flex items-center gap-2">
              <NumberInput value={slaHours[lvl] ?? 24} onChange={v => setSlaHours({ ...slaHours, [lvl]: v })} min={1} max={168} suffix="hrs SLA" />
            </div>
          </div>
        ))}
      </SectionCard>

      {/* Escalation rules */}
      <SectionCard icon={Zap} title="Escalation Rules" subtitle="Auto-escalate cases when SLA thresholds are breached" color="#D97706">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-slate-500">{rules.length} rule{rules.length !== 1 ? "s" : ""} configured</p>
          <button onClick={() => setRuleModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #D97706, #B45309)" }}>
            <Plus size={12} />Add Rule
          </button>
        </div>

        {rulesLoad ? (
          <div className="py-8 text-center"><Loader2 size={20} className="mx-auto animate-spin text-amber-400" /></div>
        ) : rules.length === 0 ? (
          <div className="py-10 text-center rounded-xl border-2 border-dashed" style={{ borderColor: "#FDE68A" }}>
            <Zap size={24} className="mx-auto mb-2 text-amber-300" />
            <p className="text-sm text-slate-400">No escalation rules yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rules.map(rule => (
              <div key={rule.id} className="flex items-center gap-3 p-3.5 rounded-xl border group"
                style={{ borderColor: "#E3E9F6", background: rule.is_active ? "#FFFBEB" : "#F9FAFB" }}>
                <Toggle value={rule.is_active} onChange={() => handleToggleRule(rule)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{rule.name}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="capitalize">{rule.trigger_event.replace(/_/g, " ")}</span>
                    <span>·</span>
                    <span>After {rule.delay_minutes}min → {rule.escalate_to_role}</span>
                    <span>·</span>
                    <span>{(rule.notify_via ?? []).join(", ")}</span>
                  </div>
                </div>
                <button onClick={() => setDeleteId(rule.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={13} style={{ color: "#EF4444" }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Approval matrix */}
      <SectionCard icon={Flag} title="Approval Matrix" subtitle="Define approval behaviour per case type and severity" color="#7C3AED">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8F9FF" }}>
                <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500">Case Type</th>
                {["Critical", "High", "Medium", "Low"].map(s => (
                  <th key={s} className="px-4 py-2.5 text-center text-xs font-bold" style={{ color: SEV_COLORS[s.toLowerCase()]?.color }}>{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {["Incident", "Permit", "CAPA", "Audit Finding", "Near Miss"].map((type, tIdx) => (
                <tr key={type} className="border-t" style={{ borderColor: "#F1F5F9" }}>
                  <td className="px-4 py-3 font-semibold text-slate-700">{type}</td>
                  {["critical", "high", "medium", "low"].map(sev => {
                    const needsApproval = sev === "critical" || sev === "high" || (sev === "medium" && tIdx < 3);
                    const m = SEV_COLORS[sev];
                    return (
                      <td key={sev} className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: needsApproval ? m.bg : "#F3F4F6", color: needsApproval ? m.color : "#9CA3AF" }}>
                          {needsApproval ? `${tIdx < 2 ? levels : 1}-Level` : "Auto"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SaveBar onSave={handleSave} saving={saving} success={success} error={error} />

      {/* Add rule modal */}
      {ruleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl border shadow-xl w-full max-w-md mx-4" style={{ borderColor: "#E3E9F6" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
              <h3 className="text-base font-bold text-slate-800">New Escalation Rule</h3>
              <button onClick={() => setRuleModal(false)} className="p-1 rounded-lg hover:bg-slate-100"><X size={16} style={{ color: "#6B7280" }} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Rule Name</label>
                <input value={ruleForm.name ?? ""} onChange={e => setRuleForm({ ...ruleForm, name: e.target.value })}
                  placeholder="e.g. Critical Incident Escalation"
                  className="w-full text-sm border rounded-xl px-3 py-2.5 outline-none" style={{ borderColor: "#E3E9F6" }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Trigger Event</label>
                  <select value={ruleForm.trigger_event ?? ""} onChange={e => setRuleForm({ ...ruleForm, trigger_event: e.target.value })}
                    className="w-full text-sm border rounded-xl px-3 py-2.5 bg-white outline-none" style={{ borderColor: "#E3E9F6" }}>
                    {TRIGGER_EVENTS.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Delay (minutes)</label>
                  <input type="number" min={1} value={ruleForm.delay_minutes ?? 60} onChange={e => setRuleForm({ ...ruleForm, delay_minutes: Number(e.target.value) })}
                    className="w-full text-sm border rounded-xl px-3 py-2.5 outline-none" style={{ borderColor: "#E3E9F6" }} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Escalate To</label>
                  <select value={ruleForm.escalate_to_role ?? "HSE Manager"} onChange={e => setRuleForm({ ...ruleForm, escalate_to_role: e.target.value })}
                    className="w-full text-sm border rounded-xl px-3 py-2.5 bg-white outline-none" style={{ borderColor: "#E3E9F6" }}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Notify Via</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {NOTIF_CH.map(ch => (
                      <button key={ch} onClick={() => toggleNotifCh(ch)}
                        className="px-2 py-1 rounded-lg text-xs font-semibold border transition-all"
                        style={(ruleForm.notify_via ?? []).includes(ch)
                          ? { background: "#4F46E5", color: "white", borderColor: "#4F46E5" }
                          : { background: "white", color: "#6B7280", borderColor: "#E3E9F6" }}>
                        {NOTIF_META[ch]?.label ?? ch}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex gap-3" style={{ borderColor: "#F1F5F9" }}>
              <button onClick={handleCreateRule} disabled={creating || !ruleForm.name?.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #D97706, #B45309)" }}>
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}Create Rule
              </button>
              <button onClick={() => setRuleModal(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium border text-slate-500" style={{ borderColor: "#E3E9F6" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl border p-6 max-w-sm w-full mx-4 shadow-xl" style={{ borderColor: "#E3E9F6" }}>
            <h3 className="text-base font-bold text-slate-800 mb-2">Delete Escalation Rule?</h3>
            <p className="text-sm text-slate-500 mb-5">This will permanently remove the rule. Cases relying on it will not be auto-escalated.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDeleteRule(deleteId)} className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: "#EF4444" }}>Delete</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border text-slate-500" style={{ borderColor: "#E3E9F6" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Incident Workflow ────────────────────────────────────────────────────

function IncidentTab() {
  const { data: step5 }                    = useGetOrgSetupStep5Query();
  const [saveStep5, { isLoading: saving }] = useSaveOrgSetupStep5Mutation();

  const [enabled,        setEnabled]        = useState(true);
  const [autoAssign,     setAutoAssign]      = useState(true);
  const [nearMissFlow,   setNearMissFlow]    = useState(true);
  const [requireRCA,     setRequireRCA]      = useState(true);
  const [autoNotify,     setAutoNotify]      = useState(true);
  const [notifRoles,     setNotifRoles]      = useState<string[]>(["HSE Manager", "Supervisor"]);
  const [notifChannels,  setNotifChannels]   = useState<string[]>(["email", "in_app"]);
  const [assignRole,     setAssignRole]      = useState("Supervisor");
  const [slaConfig,      setSlaConfig]       = useState({ critical: 2, high: 8, medium: 24, low: 72 });
  const [mandatoryFields, setMandatoryFields] = useState({
    photo: true, witness: false, location: true, description: true, injured_persons: true,
  });
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (step5?.workflows?.incidentWorkflows) {
      setEnabled(step5.workflows.incidentWorkflows.enabled ?? true);
    }
  }, [step5]);

  function toggleNotifRole(r: string) { setNotifRoles(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r]); }
  function toggleNotifCh(ch: string)  { setNotifChannels(p => p.includes(ch) ? p.filter(x => x !== ch) : [...p, ch]); }

  async function handleSave() {
    try {
      setError(null);
      const cfg = JSON.stringify({ autoAssign, nearMissFlow, requireRCA, autoNotify, notifRoles, notifChannels, assignRole, slaConfig, mandatoryFields });
      await saveStep5({
        workflows: {
          incidentWorkflows: { enabled, config: cfg },
          permitWorkflows:   step5?.workflows?.permitWorkflows   ?? { enabled: true, config: "" },
          auditWorkflows:    step5?.workflows?.auditWorkflows    ?? { enabled: true, config: "" },
          capaWorkflows:     step5?.workflows?.capaWorkflows     ?? { enabled: true, config: "" },
          escalationRules:   step5?.workflows?.escalationRules   ?? { enabled: true, config: "" },
          approvalLevels:    step5?.workflows?.approvalLevels    ?? { enabled: true, config: "" },
        },
      }).unwrap();
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch { setError("Failed to save incident workflow."); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Incident Workflow</h2>
        <p className="text-xs text-slate-500 mt-0.5">Configure how incidents are routed, assigned, notified and resolved.</p>
      </div>

      <SectionCard icon={AlertTriangle} title="Workflow Control" subtitle="Master switches for incident workflow behaviour" color="#DC2626">
        <FieldRow label="Enable Incident Workflow" hint="Activate automatic routing when an incident is reported.">
          <Toggle value={enabled} onChange={setEnabled} />
        </FieldRow>
        <FieldRow label="Auto-Assignment" hint="Automatically assign incidents to the configured role.">
          <Toggle value={autoAssign} onChange={setAutoAssign} />
        </FieldRow>
        <FieldRow label="Near-Miss Workflow" hint="Apply the same flow to near-miss reports.">
          <Toggle value={nearMissFlow} onChange={setNearMissFlow} />
        </FieldRow>
        <FieldRow label="Require RCA for Critical/High" hint="Block closure until a root cause analysis is submitted.">
          <Toggle value={requireRCA} onChange={setRequireRCA} />
        </FieldRow>
        <FieldRow label="Auto Notifications" hint="Send alerts immediately when an incident is logged.">
          <Toggle value={autoNotify} onChange={setAutoNotify} />
        </FieldRow>
      </SectionCard>

      {/* Assignment & notification */}
      <div className="grid grid-cols-2 gap-6">
        <SectionCard icon={UserCheck} title="Auto-Assignment" subtitle="Who gets assigned when an incident is reported" color="#0891B2">
          <FieldRow label="Default Assignee Role">
            <SelectInput value={assignRole} onChange={setAssignRole} options={ROLES} />
          </FieldRow>
          <div className="pt-3">
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>Notify Roles</p>
            <div className="flex flex-wrap gap-1.5">
              {ROLES.slice(0, 5).map(r => (
                <button key={r} onClick={() => toggleNotifRole(r)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all"
                  style={notifRoles.includes(r)
                    ? { background: "#0891B2", color: "white", borderColor: "#0891B2" }
                    : { background: "white", color: "#6B7280", borderColor: "#E3E9F6" }}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-4">
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>Notification Channels</p>
            <div className="flex flex-wrap gap-1.5">
              {NOTIF_CH.map(ch => (
                <button key={ch} onClick={() => toggleNotifCh(ch)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all"
                  style={notifChannels.includes(ch)
                    ? { background: "#4F46E5", color: "white", borderColor: "#4F46E5" }
                    : { background: "white", color: "#6B7280", borderColor: "#E3E9F6" }}>
                  {NOTIF_META[ch]?.label ?? ch}
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={Clock} title="Resolution SLAs" subtitle="Target resolution time per severity (hours)" color="#D97706">
          {(["critical", "high", "medium", "low"] as const).map(sev => {
            const m = SEV_COLORS[sev];
            return (
              <div key={sev} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: "#F1F5F9" }}>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize" style={{ background: m.bg, color: m.color }}>{sev}</span>
                <NumberInput value={slaConfig[sev]} onChange={v => setSlaConfig({ ...slaConfig, [sev]: v })} min={1} max={720} suffix="hours" />
              </div>
            );
          })}
        </SectionCard>
      </div>

      {/* Mandatory fields */}
      <SectionCard icon={BookOpen} title="Mandatory Report Fields" subtitle="Require these fields to be filled before submission" color="#7C3AED">
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(mandatoryFields).map(([field, val]) => (
            <div key={field} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: "#E3E9F6" }}>
              <span className="text-sm font-medium text-slate-700 capitalize">{field.replace(/_/g, " ")}</span>
              <Toggle value={val} onChange={v => setMandatoryFields({ ...mandatoryFields, [field]: v })} />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Workflow pipeline */}
      <SectionCard icon={ArrowRight} title="Incident Pipeline Stages" subtitle="The sequential stages an incident moves through" color="#059669">
        <div className="flex items-center gap-1 flex-wrap">
          {["Reported", "Assigned", "Under Investigation", "RCA Complete", "Action Raised", "Pending Closure", "Closed"].map((stage, i, arr) => (
            <div key={stage} className="flex items-center gap-1">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: i === 0 ? "#DC2626" : i === arr.length - 1 ? "#059669" : "#EEF2FF", color: i === 0 ? "white" : i === arr.length - 1 ? "white" : "#4F46E5" }}>
                {stage}
              </div>
              {i < arr.length - 1 && <ArrowRight size={12} style={{ color: "#CBD5E1" }} />}
            </div>
          ))}
        </div>
      </SectionCard>

      <SaveBar onSave={handleSave} saving={saving} success={success} error={error} />
    </div>
  );
}

// ─── Tab: CAPA Workflow ────────────────────────────────────────────────────────

function CapaTab() {
  const { data: step2 }                    = useGetOrgSetupStep2Query();
  const [saveStep2, { isLoading: saving }] = useSaveOrgSetupStep2Mutation();
  const { data: step5 }                    = useGetOrgSetupStep5Query();
  const [saveStep5, { isLoading: saving5 }] = useSaveOrgSetupStep5Mutation();

  const [enabled,       setEnabled]       = useState(true);
  const [autoGenInc,    setAutoGenInc]    = useState(true);
  const [autoGenAudit,  setAutoGenAudit]  = useState(true);
  const [requireEvidence, setReqEv]       = useState(true);
  const [dualVerify,    setDualVerify]    = useState(false);
  const [ownerRole,     setOwnerRole]     = useState("HSE Manager");
  const [sla,           setSla]           = useState({ critical: 3, high: 7, medium: 14, low: 30 });
  const [reminders,     setReminders]     = useState({ first: 3, second: 1 });
  const [closureSteps,  setClosureSteps]  = useState({ root_cause: true, corrective_action: true, evidence: true, verification: true });
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (step2) {
      if (step2.capaSlaCriticalDays) setSla(s => ({ ...s, critical: step2.capaSlaCriticalDays! }));
      if (step2.capaSlaStandardDays) setSla(s => ({ ...s, medium: step2.capaSlaStandardDays! }));
    }
    if (step5?.workflows?.capaWorkflows) setEnabled(step5.workflows.capaWorkflows.enabled ?? true);
  }, [step2, step5]);

  async function handleSave() {
    try {
      setError(null);
      await Promise.all([
        saveStep2({ capaSlaCriticalDays: sla.critical, capaSlaStandardDays: sla.medium }).unwrap(),
        saveStep5({
          workflows: {
            capaWorkflows:     { enabled, config: JSON.stringify({ autoGenInc, autoGenAudit, requireEvidence, dualVerify, ownerRole, sla, reminders, closureSteps }) },
            permitWorkflows:   step5?.workflows?.permitWorkflows   ?? { enabled: true, config: "" },
            incidentWorkflows: step5?.workflows?.incidentWorkflows ?? { enabled: true, config: "" },
            auditWorkflows:    step5?.workflows?.auditWorkflows    ?? { enabled: true, config: "" },
            escalationRules:   step5?.workflows?.escalationRules   ?? { enabled: true, config: "" },
            approvalLevels:    step5?.workflows?.approvalLevels    ?? { enabled: true, config: "" },
          },
        }).unwrap(),
      ]);
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch { setError("Failed to save CAPA workflow."); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">CAPA Workflow</h2>
        <p className="text-xs text-slate-500 mt-0.5">Configure corrective and preventive action SLAs, triggers, closure requirements and reminders.</p>
      </div>

      <SectionCard icon={ClipboardCheck} title="CAPA Control" subtitle="Master switches for the CAPA engine" color="#059669">
        <FieldRow label="Enable CAPA Workflow">
          <Toggle value={enabled} onChange={setEnabled} />
        </FieldRow>
        <FieldRow label="Auto-generate CAPAs from Incidents" hint="Automatically create a CAPA when a critical/high incident is closed.">
          <Toggle value={autoGenInc} onChange={setAutoGenInc} />
        </FieldRow>
        <FieldRow label="Auto-generate CAPAs from Audit Findings" hint="Create CAPAs for every open audit finding.">
          <Toggle value={autoGenAudit} onChange={setAutoGenAudit} />
        </FieldRow>
        <FieldRow label="Require Evidence for Closure" hint="Block CAPA closure until supporting evidence is uploaded.">
          <Toggle value={requireEvidence} onChange={setReqEv} />
        </FieldRow>
        <FieldRow label="Dual Verification" hint="Require a second approver to verify CAPA closure.">
          <Toggle value={dualVerify} onChange={setDualVerify} />
        </FieldRow>
        <FieldRow label="Default CAPA Owner Role">
          <SelectInput value={ownerRole} onChange={setOwnerRole} options={ROLES} />
        </FieldRow>
      </SectionCard>

      <div className="grid grid-cols-2 gap-6">
        {/* SLA */}
        <SectionCard icon={Clock} title="SLA by Priority" subtitle="Days to close a CAPA per priority level" color="#D97706">
          {(["critical", "high", "medium", "low"] as const).map(p => {
            const m = SEV_COLORS[p];
            return (
              <div key={p} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: "#F1F5F9" }}>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize" style={{ background: m.bg, color: m.color }}>{p}</span>
                <NumberInput value={sla[p]} onChange={v => setSla({ ...sla, [p]: v })} min={1} max={180} suffix="days" />
              </div>
            );
          })}
        </SectionCard>

        {/* Reminders */}
        <SectionCard icon={Bell} title="Reminder Schedule" subtitle="Days before SLA deadline to send reminders" color="#7C3AED">
          <FieldRow label="First Reminder" hint="Days before due date">
            <NumberInput value={reminders.first} onChange={v => setReminders({ ...reminders, first: v })} min={1} max={30} suffix="days before" />
          </FieldRow>
          <FieldRow label="Final Reminder" hint="Days before due date (must be ≤ first reminder)">
            <NumberInput value={reminders.second} onChange={v => setReminders({ ...reminders, second: v })} min={1} max={reminders.first} suffix="days before" />
          </FieldRow>
          <div className="mt-3 p-3 rounded-xl" style={{ background: "#F5F3FF", border: "1px solid #DDD6FE" }}>
            <p className="text-xs font-semibold text-violet-700 mb-2">Reminder Timeline</p>
            <div className="flex items-center gap-1 text-xs text-violet-600">
              <div className="px-2 py-0.5 rounded-full bg-violet-200 text-violet-800 font-bold">Open</div>
              <ArrowRight size={10} />
              <span>…</span>
              <ArrowRight size={10} />
              <div className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-bold">−{reminders.first}d</div>
              <ArrowRight size={10} />
              <div className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold">−{reminders.second}d</div>
              <ArrowRight size={10} />
              <div className="px-2 py-0.5 rounded-full bg-red-500 text-white font-bold">Due</div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Closure steps */}
      <SectionCard icon={CheckCircle2} title="Closure Requirements" subtitle="Steps that must be completed before a CAPA can be closed" color="#0891B2">
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(closureSteps).map(([step, val]) => (
            <div key={step} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: "#E3E9F6" }}>
              <div>
                <p className="text-sm font-semibold text-slate-700 capitalize">{step.replace(/_/g, " ")}</p>
              </div>
              <Toggle value={val} onChange={v => setClosureSteps({ ...closureSteps, [step]: v })}
                disabled={step === "corrective_action"} />
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
          <Lock size={11} />Corrective action is always required and cannot be disabled.
        </p>
      </SectionCard>

      {/* CAPA pipeline */}
      <SectionCard icon={ArrowRight} title="CAPA Pipeline" subtitle="Standard stages in the CAPA lifecycle" color="#059669">
        <div className="flex items-center gap-1 flex-wrap">
          {["Open", "Assigned", "In Progress", "Evidence Submitted", "Pending Closure", "Under Review", "Closed"].map((stage, i, arr) => (
            <div key={stage} className="flex items-center gap-1">
              <div className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: i === 0 ? "#DC2626" : i === arr.length - 1 ? "#059669" : "#EEF2FF", color: i === 0 ? "white" : i === arr.length - 1 ? "white" : "#4F46E5" }}>
                {stage}
              </div>
              {i < arr.length - 1 && <ArrowRight size={12} style={{ color: "#CBD5E1" }} />}
            </div>
          ))}
        </div>
      </SectionCard>

      <SaveBar onSave={handleSave} saving={saving || saving5} success={success} error={error} />
    </div>
  );
}

// ─── Tab: Audit Workflow ──────────────────────────────────────────────────────

function AuditTab() {
  const { data: step2 }                    = useGetOrgSetupStep2Query();
  const [saveStep2, { isLoading: saving }] = useSaveOrgSetupStep2Mutation();
  const { data: step5 }                    = useGetOrgSetupStep5Query();
  const [saveStep5, { isLoading: saving5 }] = useSaveOrgSetupStep5Mutation();

  const [enabled,        setEnabled]        = useState(true);
  const [autoSchedule,   setAutoSchedule]   = useState(true);
  const [autoCapaFindings, setAutoCapaF]    = useState(true);
  const [requireChecklist, setReqChecklist] = useState(true);
  const [signOff,        setSignOff]        = useState(true);
  const [frequency,      setFrequency]      = useState("quarterly");
  const [findingWindow,  setFindingWindow]  = useState(14);
  const [preNotifyDays,  setPreNotifyDays]  = useState(7);
  const [assignMethod,   setAssignMethod]   = useState("manual");
  const [assignRole,     setAssignRole]     = useState("Auditor");
  const [standards,      setStandards]      = useState<string[]>(["ISO 45001", "ISO 14001"]);
  const [newStd,         setNewStd]         = useState("");
  const [auditTypes,     setAuditTypes]     = useState({
    internal: true, external: true, regulatory: true, surveillance: false,
  });
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (step2?.auditFrequency) setFrequency(step2.auditFrequency);
    if (step2?.applicableStandards?.length) setStandards(step2.applicableStandards);
    if (step5?.workflows?.auditWorkflows) setEnabled(step5.workflows.auditWorkflows.enabled ?? true);
  }, [step2, step5]);

  async function handleSave() {
    try {
      setError(null);
      const cfg = JSON.stringify({ autoSchedule, autoCapaFindings, requireChecklist, signOff, findingWindow, preNotifyDays, assignMethod, assignRole, auditTypes });
      await Promise.all([
        saveStep2({ auditFrequency: frequency, applicableStandards: standards }).unwrap(),
        saveStep5({
          workflows: {
            auditWorkflows:    { enabled, config: cfg },
            permitWorkflows:   step5?.workflows?.permitWorkflows   ?? { enabled: true, config: "" },
            incidentWorkflows: step5?.workflows?.incidentWorkflows ?? { enabled: true, config: "" },
            capaWorkflows:     step5?.workflows?.capaWorkflows     ?? { enabled: true, config: "" },
            escalationRules:   step5?.workflows?.escalationRules   ?? { enabled: true, config: "" },
            approvalLevels:    step5?.workflows?.approvalLevels    ?? { enabled: true, config: "" },
          },
        }).unwrap(),
      ]);
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch { setError("Failed to save audit workflow."); }
  }

  function addStandard() {
    if (!newStd.trim() || standards.includes(newStd.trim())) return;
    setStandards([...standards, newStd.trim()]); setNewStd("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Audit Workflow</h2>
        <p className="text-xs text-slate-500 mt-0.5">Configure audit scheduling, assignment, finding follow-ups and closure requirements.</p>
      </div>

      <SectionCard icon={ClipboardCheck} title="Audit Control" subtitle="Master switches for the audit workflow engine" color="#0891B2">
        <FieldRow label="Enable Audit Workflow">
          <Toggle value={enabled} onChange={setEnabled} />
        </FieldRow>
        <FieldRow label="Auto-Scheduling" hint="Automatically create scheduled audit records based on frequency.">
          <Toggle value={autoSchedule} onChange={setAutoSchedule} />
        </FieldRow>
        <FieldRow label="Auto-Create CAPAs from Findings" hint="Raise a CAPA automatically for each open audit finding.">
          <Toggle value={autoCapaFindings} onChange={setAutoCapaF} />
        </FieldRow>
        <FieldRow label="Require Checklist Completion" hint="Auditors must complete all checklist items before closure.">
          <Toggle value={requireChecklist} onChange={setReqChecklist} />
        </FieldRow>
        <FieldRow label="Require Auditor Sign-Off" hint="Digital signature required to close an audit.">
          <Toggle value={signOff} onChange={setSignOff} />
        </FieldRow>
      </SectionCard>

      <div className="grid grid-cols-2 gap-6">
        {/* Scheduling */}
        <SectionCard icon={Clock} title="Scheduling" subtitle="Frequency and notification settings" color="#059669">
          <FieldRow label="Default Audit Frequency" hint="How often internal audits are scheduled.">
            <SelectInput value={frequency} onChange={setFrequency} options={["weekly", "monthly", "quarterly", "bi-annual", "annual", "custom"]} />
          </FieldRow>
          <FieldRow label="Pre-Audit Notification" hint="Days in advance to notify the auditor.">
            <NumberInput value={preNotifyDays} onChange={setPreNotifyDays} min={1} max={30} suffix="days" />
          </FieldRow>
          <FieldRow label="Finding Follow-up Window" hint="Days allowed to address an open finding after audit.">
            <NumberInput value={findingWindow} onChange={setFindingWindow} min={1} max={90} suffix="days" />
          </FieldRow>
        </SectionCard>

        {/* Assignment */}
        <SectionCard icon={UserCheck} title="Auditor Assignment" subtitle="How audits are assigned to team members" color="#7C3AED">
          <FieldRow label="Assignment Method">
            <div className="flex gap-2">
              {["manual", "auto", "round-robin"].map(m => (
                <button key={m} onClick={() => setAssignMethod(m)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all capitalize"
                  style={assignMethod === m
                    ? { background: "#7C3AED", color: "white", borderColor: "#7C3AED" }
                    : { background: "white", color: "#6B7280", borderColor: "#E3E9F6" }}>
                  {m}
                </button>
              ))}
            </div>
          </FieldRow>
          <FieldRow label="Default Auditor Role">
            <SelectInput value={assignRole} onChange={setAssignRole} options={ROLES} />
          </FieldRow>
          <div className="mt-4 p-3 rounded-xl" style={{ background: "#F5F3FF", border: "1px solid #DDD6FE" }}>
            <p className="text-xs font-semibold text-violet-700 mb-1">Audit Types Enabled</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {Object.entries(auditTypes).map(([type, val]) => (
                <div key={type} className="flex items-center justify-between p-2 rounded-lg bg-white border" style={{ borderColor: "#E3E9F6" }}>
                  <span className="text-xs font-medium text-slate-600 capitalize">{type}</span>
                  <Toggle value={val} onChange={v => setAuditTypes({ ...auditTypes, [type]: v })} />
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Standards */}
      <SectionCard icon={BookOpen} title="Applicable Standards" subtitle="Standards this organization audits against" color="#D97706">
        <div className="flex gap-2 mb-4">
          <input value={newStd} onChange={e => setNewStd(e.target.value)} onKeyDown={e => e.key === "Enter" && addStandard()}
            placeholder="e.g. ISO 9001, OSHA 1926…"
            className="flex-1 text-sm border rounded-xl px-3 py-2 outline-none" style={{ borderColor: "#E3E9F6" }} />
          <button onClick={addStandard} disabled={!newStd.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #D97706, #B45309)" }}>
            <Plus size={14} />Add
          </button>
        </div>
        {standards.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">No standards added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {standards.map(std => (
              <div key={std} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
                style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}>
                {std}
                <button onClick={() => setStandards(standards.filter(s => s !== std))} className="hover:text-red-500 transition-colors">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Audit pipeline */}
      <SectionCard icon={ArrowRight} title="Audit Pipeline" subtitle="Standard stages an audit moves through" color="#059669">
        <div className="flex items-center gap-1 flex-wrap">
          {["Scheduled", "Notified", "In Progress", "Findings Raised", "CAPA Linked", "Under Review", "Sign-Off", "Closed"].map((stage, i, arr) => (
            <div key={stage} className="flex items-center gap-1">
              <div className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: i === 0 ? "#0891B2" : i === arr.length - 1 ? "#059669" : "#EEF2FF", color: i === 0 || i === arr.length - 1 ? "white" : "#4F46E5" }}>
                {stage}
              </div>
              {i < arr.length - 1 && <ArrowRight size={12} style={{ color: "#CBD5E1" }} />}
            </div>
          ))}
        </div>
      </SectionCard>

      <SaveBar onSave={handleSave} saving={saving || saving5} success={success} error={error} />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "approval",  label: "Approval Workflows", icon: Shield,        color: "#4F46E5" },
  { id: "incident",  label: "Incident Workflow",  icon: AlertTriangle, color: "#DC2626" },
  { id: "capa",      label: "CAPA Workflow",      icon: ClipboardCheck,color: "#059669" },
  { id: "audit",     label: "Audit Workflow",     icon: BookOpen,      color: "#0891B2" },
] as const;

type TabId = typeof TABS[number]["id"];

export function WorkflowSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("approval");
  const { data: dashboard }       = useGetWorkflowDashboardQuery();

  const activeTabMeta = TABS.find(t => t.id === activeTab)!;

  const overviewStats = [
    { label: "Active Cases",    value: dashboard?.active_cases?.length   ?? 0 },
    { label: "Pending Approvals", value: dashboard?.pending_approvals?.length ?? 0 },
    { label: "Open CAPAs",      value: dashboard?.open_capas?.length     ?? 0 },
    { label: "Overdue",         value: dashboard?.overdue_count          ?? 0 },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>

      {/* ── Banner ── */}
      <div className="relative overflow-hidden px-6 pt-7 pb-6"
        style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #4338CA 50%, #0F172A 100%)" }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 20% 60%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 85% 25%, #A5B4FC 0%, transparent 45%)" }} />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <GitBranch size={18} className="text-indigo-300" />
              <span className="text-indigo-200 text-xs font-bold tracking-widest uppercase">Administration</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Workflow Settings</h1>
            <p className="text-indigo-200 text-sm mt-1">Configure approval chains, incident routing, CAPA management and audit schedules.</p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {overviewStats.map(s => (
              <div key={s.label} className="px-3 py-2 rounded-xl text-center"
                style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <div className="text-sm font-extrabold text-white">{s.value}</div>
                <div className="text-[10px] text-indigo-300 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-6 py-6 flex gap-6">

        {/* Sidebar */}
        <div className="w-52 flex-shrink-0">
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6", background: "white" }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Workflow Types</p>
            </div>
            <nav className="p-2 space-y-0.5">
              {TABS.map(tab => {
                const active = activeTab === tab.id;
                const Icon   = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all"
                    style={active ? {
                      background: `${tab.color}12`, color: tab.color,
                      fontWeight: 700, border: `1px solid ${tab.color}25`,
                    } : {
                      color: "#4B5563", fontWeight: 500,
                      background: "transparent", border: "1px solid transparent",
                    }}>
                    <Icon size={16} style={{ color: active ? tab.color : "#9CA3AF", flexShrink: 0 }} />
                    <span className="flex-1">{tab.label}</span>
                    {active && <ChevronRight size={12} style={{ color: tab.color }} />}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Live overview */}
          <div className="mt-4 rounded-2xl border p-4 space-y-3" style={{ borderColor: "#E3E9F6", background: "white" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Live Overview</p>
            {[
              { icon: GitBranch,  label: "Active Cases",   value: dashboard?.active_cases?.length   ?? 0, color: "#4F46E5" },
              { icon: Clock,      label: "Pending",        value: dashboard?.pending_approvals?.length ?? 0, color: "#D97706" },
              { icon: Zap,        label: "Escalated",      value: dashboard?.escalated_count        ?? 0, color: "#DC2626" },
              { icon: CheckCircle2, label: "Resolved Today", value: dashboard?.resolved_today       ?? 0, color: "#059669" },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5" style={{ color: "#6B7280" }}>
                  <s.icon size={11} style={{ color: s.color }} />{s.label}
                </div>
                <span className="font-bold text-slate-700">{s.value}</span>
              </div>
            ))}
            {dashboard?.avg_resolution_hours !== undefined && (
              <div className="pt-2 border-t" style={{ borderColor: "#F1F5F9" }}>
                <p className="text-[10px] text-slate-400">Avg resolution</p>
                <p className="text-sm font-extrabold" style={{ color: "#4F46E5" }}>
                  {dashboard.avg_resolution_hours.toFixed(1)}h
                </p>
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="mt-4 rounded-xl p-3 flex items-start gap-2" style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
            <Info size={13} className="text-indigo-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-indigo-600">
              Changes take effect immediately for new cases. Existing open cases follow the workflow active at the time they were created.
            </p>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: "#E3E9F6" }}>
            {/* Tab header */}
            <div className="flex items-center gap-3 pb-5 mb-5 border-b" style={{ borderColor: "#F1F5F9" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${activeTabMeta.color}12`, border: `1px solid ${activeTabMeta.color}20` }}>
                <activeTabMeta.icon size={20} style={{ color: activeTabMeta.color }} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">{activeTabMeta.label}</h2>
                <p className="text-xs text-slate-400">
                  {activeTab === "approval" && "Multi-level approval chains, SLA timeouts and auto-escalation rules."}
                  {activeTab === "incident" && "Incident routing, assignment, notifications and resolution SLAs."}
                  {activeTab === "capa"     && "CAPA SLAs, closure steps, reminders and auto-generation triggers."}
                  {activeTab === "audit"    && "Audit scheduling, assignment method, finding follow-ups and standards."}
                </p>
              </div>
            </div>

            {activeTab === "approval" && <ApprovalTab />}
            {activeTab === "incident" && <IncidentTab />}
            {activeTab === "capa"     && <CapaTab />}
            {activeTab === "audit"    && <AuditTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
