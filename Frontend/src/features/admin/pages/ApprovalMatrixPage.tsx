import { useState, useEffect } from "react";
import {
  GitMerge, ChevronRight, Plus, Trash2, Save, X,
  CheckCircle2, AlertCircle, Loader2, ArrowRight,
  ArrowDown, Shield, Users, Clock, Zap, Bell,
  Mail, Smartphone, AlertTriangle, ClipboardCheck,
  FileText, Info, Lock, UserCheck, Settings,
  TrendingUp, RefreshCw, ToggleLeft, Edit,
} from "lucide-react";
import {
  useListEscalationRulesQuery,
  useCreateEscalationRuleMutation,
  useUpdateEscalationRuleMutation,
  useDeleteEscalationRuleMutation,
  type EscalationRule,
} from "@/features/workflow/api/escalationRulesApi";
import {
  useGetOrgSetupStep5Query,
  useSaveOrgSetupStep5Mutation,
} from "@/features/org-setup/api/orgSetupApi";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES = [
  "Worker", "Supervisor", "Department Head", "Site Manager",
  "Safety Officer", "HSE Manager", "Auditor", "Admin",
];

const PROCESS_TYPES = [
  { id: "incident",      label: "Incident",      icon: AlertTriangle,  color: "#DC2626", bg: "#FEF2F2" },
  { id: "permit",        label: "Permit to Work", icon: FileText,       color: "#2563EB", bg: "#EFF6FF" },
  { id: "capa",          label: "CAPA",           icon: ClipboardCheck, color: "#059669", bg: "#ECFDF5" },
  { id: "audit_finding", label: "Audit Finding",  icon: Shield,         color: "#7C3AED", bg: "#F5F3FF" },
  { id: "near_miss",     label: "Near Miss",      icon: AlertCircle,    color: "#D97706", bg: "#FFFBEB" },
  { id: "hazard",        label: "Hazard",         icon: Zap,            color: "#EA580C", bg: "#FFF7ED" },
] as const;

type ProcessId = typeof PROCESS_TYPES[number]["id"];

const SEVERITIES = ["critical", "high", "medium", "low"] as const;
type Severity = typeof SEVERITIES[number];

const SEV_META: Record<Severity, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: "Critical", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  high:     { label: "High",     color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA" },
  medium:   { label: "Medium",   color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  low:      { label: "Low",      color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
};

const ROLE_AUTHORITY: Record<string, { maxSeverity: Severity; color: string; bg: string }> = {
  "Worker":          { maxSeverity: "low",      color: "#9CA3AF", bg: "#F9FAFB"  },
  "Supervisor":      { maxSeverity: "medium",   color: "#D97706", bg: "#FFFBEB"  },
  "Department Head": { maxSeverity: "medium",   color: "#D97706", bg: "#FFFBEB"  },
  "Site Manager":    { maxSeverity: "high",     color: "#EA580C", bg: "#FFF7ED"  },
  "Safety Officer":  { maxSeverity: "high",     color: "#EA580C", bg: "#FFF7ED"  },
  "HSE Manager":     { maxSeverity: "critical", color: "#DC2626", bg: "#FEF2F2"  },
  "Auditor":         { maxSeverity: "high",     color: "#EA580C", bg: "#FFF7ED"  },
  "Admin":           { maxSeverity: "critical", color: "#7C3AED", bg: "#F5F3FF"  },
};

const TRIGGER_EVENTS = [
  "approval_pending", "sla_breach_imminent", "incident_reported",
  "capa_overdue", "audit_finding_raised", "near_miss_reported", "permit_submitted",
];

const NOTIF_CH = ["email", "sms", "push", "in_app"] as const;
const NOTIF_META: Record<string, { label: string; Icon: typeof Mail }> = {
  email:  { label: "Email",  Icon: Mail       },
  sms:    { label: "SMS",    Icon: Smartphone },
  push:   { label: "Push",   Icon: Bell       },
  in_app: { label: "In-App", Icon: Bell       },
};

const SEV_ORDER: Severity[] = ["low", "medium", "high", "critical"];

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApprovalLevel {
  id: string;
  role: string;
  slaHours: number;
  required: boolean;
  canDelegate: boolean;
}

type HierarchyMap = Record<ProcessId, ApprovalLevel[]>;

interface AuthorityRule {
  role: string;
  maxSeverity: Severity;
  canApprove: Record<ProcessId, boolean>;
  canDelegate: boolean;
  delegateTo: string;
  canOverride: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold"
      style={{ background: ok ? "#ECFDF5" : "#FEF2F2", color: ok ? "#065F46" : "#991B1B", border: `1px solid ${ok ? "#A7F3D0" : "#FECACA"}` }}>
      {ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      {msg}
    </div>
  );
}

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button onClick={() => !disabled && onChange(!value)} disabled={disabled}
      className="relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: value ? "#4F46E5" : "#D1D5DB" }}>
      <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: value ? "translateX(21px)" : "translateX(2px)" }} />
    </button>
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
        {saving ? "Saving…" : "Save Matrix"}
      </button>
      {success && <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600"><CheckCircle2 size={14} />Saved</span>}
      {error   && <span className="flex items-center gap-1.5 text-sm font-semibold text-red-600"><AlertCircle size={14} />{error}</span>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, color }: {
  icon: typeof Shield; title: string; subtitle: string; color: string;
}) {
  return (
    <div className="flex items-center gap-3 pb-4 mb-4 border-b" style={{ borderColor: "#F1F5F9" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}15` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Default hierarchy ────────────────────────────────────────────────────────

function defaultHierarchy(): HierarchyMap {
  const make = (roles: [string, number, boolean][]): ApprovalLevel[] =>
    roles.map(([role, slaHours, required]) => ({ id: uid(), role, slaHours, required, canDelegate: false }));

  return {
    incident:      make([["Supervisor", 4, true],  ["HSE Manager", 12, true], ["Admin", 24, false]]),
    permit:        make([["Supervisor", 2, true],  ["Site Manager", 8, true]]),
    capa:          make([["HSE Manager", 24, true], ["Admin", 48, false]]),
    audit_finding: make([["Auditor", 24, true],    ["HSE Manager", 48, true]]),
    near_miss:     make([["Supervisor", 8, true]]),
    hazard:        make([["Safety Officer", 12, true], ["HSE Manager", 24, true]]),
  };
}

function defaultAuthority(): AuthorityRule[] {
  return ROLES.map(role => ({
    role,
    maxSeverity: ROLE_AUTHORITY[role]?.maxSeverity ?? "low",
    canApprove: Object.fromEntries(PROCESS_TYPES.map(p => [p.id, ["HSE Manager", "Admin", "Safety Officer", "Site Manager"].includes(role)])) as Record<ProcessId, boolean>,
    canDelegate: ["HSE Manager", "Admin", "Site Manager"].includes(role),
    delegateTo: role === "HSE Manager" ? "Admin" : role === "Site Manager" ? "HSE Manager" : "",
    canOverride: ["Admin"].includes(role),
  }));
}

// ─── Tab 1: Approval Hierarchy ────────────────────────────────────────────────

function HierarchyTab() {
  const { data: step5 }                    = useGetOrgSetupStep5Query();
  const [saveStep5, { isLoading: saving }] = useSaveOrgSetupStep5Mutation();

  const [hierarchy, setHierarchy] = useState<HierarchyMap>(defaultHierarchy);
  const [activeProcess, setActiveProcess] = useState<ProcessId>("incident");
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (step5?.workflows?.approvalLevels?.config) {
      try {
        const parsed = JSON.parse(step5.workflows.approvalLevels.config);
        if (parsed?.hierarchy) setHierarchy(parsed.hierarchy);
      } catch { /* keep defaults */ }
    }
  }, [step5]);

  const proc = PROCESS_TYPES.find(p => p.id === activeProcess)!;
  const levels = hierarchy[activeProcess] ?? [];

  function addLevel() {
    setHierarchy(prev => ({
      ...prev,
      [activeProcess]: [...(prev[activeProcess] ?? []), { id: uid(), role: "Supervisor", slaHours: 24, required: true, canDelegate: false }],
    }));
  }

  function removeLevel(id: string) {
    setHierarchy(prev => ({ ...prev, [activeProcess]: prev[activeProcess].filter(l => l.id !== id) }));
  }

  function updateLevel(id: string, key: keyof ApprovalLevel, value: unknown) {
    setHierarchy(prev => ({
      ...prev,
      [activeProcess]: prev[activeProcess].map(l => l.id === id ? { ...l, [key]: value } : l),
    }));
  }

  async function handleSave() {
    try {
      setError(null);
      await saveStep5({
        workflows: {
          approvalLevels:    { enabled: true, config: JSON.stringify({ hierarchy }) },
          permitWorkflows:   step5?.workflows?.permitWorkflows   ?? { enabled: true, config: "" },
          incidentWorkflows: step5?.workflows?.incidentWorkflows ?? { enabled: true, config: "" },
          auditWorkflows:    step5?.workflows?.auditWorkflows    ?? { enabled: true, config: "" },
          capaWorkflows:     step5?.workflows?.capaWorkflows     ?? { enabled: true, config: "" },
          escalationRules:   step5?.workflows?.escalationRules   ?? { enabled: true, config: "" },
        },
      }).unwrap();
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch { setError("Failed to save hierarchy."); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Approval Hierarchy</h2>
        <p className="text-xs text-slate-500 mt-0.5">Define multi-level approval chains for each process type. Drag levels to reorder.</p>
      </div>

      {/* Process type selector */}
      <div className="grid grid-cols-3 gap-2">
        {PROCESS_TYPES.map(p => {
          const active = activeProcess === p.id;
          const Icon   = p.icon;
          const lvCount = (hierarchy[p.id] ?? []).length;
          return (
            <button key={p.id} onClick={() => setActiveProcess(p.id)}
              className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-left transition-all"
              style={active ? {
                background: p.bg, borderColor: p.color,
                boxShadow: `0 0 0 2px ${p.color}30`,
              } : { background: "white", borderColor: "#E3E9F6" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: active ? p.color : `${p.color}15` }}>
                <Icon size={15} style={{ color: active ? "white" : p.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: active ? p.color : "#374151" }}>{p.label}</p>
                <p className="text-[10px]" style={{ color: active ? p.color + "BB" : "#9CA3AF" }}>{lvCount} level{lvCount !== 1 ? "s" : ""}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Chain builder */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "#F1F5F9", background: proc.bg }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: proc.color }}>
              <proc.icon size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: proc.color }}>{proc.label} Approval Chain</p>
              <p className="text-xs" style={{ color: proc.color + "BB" }}>{levels.length} level{levels.length !== 1 ? "s" : ""} · approval is sequential</p>
            </div>
          </div>
          <button onClick={addLevel} disabled={levels.length >= 5}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold disabled:opacity-40 hover:opacity-90"
            style={{ background: proc.color }}>
            <Plus size={12} />Add Level
          </button>
        </div>

        <div className="p-5">
          {levels.length === 0 ? (
            <div className="py-12 text-center rounded-xl border-2 border-dashed" style={{ borderColor: "#E3E9F6" }}>
              <proc.icon size={28} className="mx-auto mb-2" style={{ color: "#D1D5DB" }} />
              <p className="text-sm text-slate-400">No approval levels defined</p>
              <p className="text-xs text-slate-300 mt-0.5">Click "Add Level" to build the chain</p>
            </div>
          ) : (
            <div className="space-y-3">
              {levels.map((lvl, idx) => (
                <div key={lvl.id} className="flex items-start gap-3">
                  {/* Connector */}
                  <div className="flex flex-col items-center gap-0 pt-3 flex-shrink-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-extrabold"
                      style={{ background: idx === 0 ? proc.color : idx === levels.length - 1 ? "#7C3AED" : "#6366F1" }}>
                      {idx + 1}
                    </div>
                    {idx < levels.length - 1 && (
                      <div className="w-0.5 h-6 mt-1" style={{ background: "#E3E9F6" }} />
                    )}
                  </div>

                  {/* Level card */}
                  <div className="flex-1 rounded-xl border p-4 group" style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }}>
                    <div className="grid grid-cols-4 gap-3 items-end">
                      {/* Role */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>Approver Role</label>
                        <select value={lvl.role} onChange={e => updateLevel(lvl.id, "role", e.target.value)}
                          className="w-full text-sm border rounded-xl px-3 py-2 bg-white outline-none"
                          style={{ borderColor: "#E3E9F6" }}>
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>

                      {/* SLA */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>SLA</label>
                        <div className="flex items-center gap-1.5">
                          <input type="number" min={1} max={168} value={lvl.slaHours}
                            onChange={e => updateLevel(lvl.id, "slaHours", Number(e.target.value))}
                            className="w-20 text-sm border rounded-xl px-3 py-2 text-center font-bold outline-none"
                            style={{ borderColor: "#E3E9F6" }} />
                          <span className="text-xs text-slate-400">hrs</span>
                        </div>
                      </div>

                      {/* Toggles */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-500">Required</span>
                          <Toggle value={lvl.required} onChange={v => updateLevel(lvl.id, "required", v)}
                            disabled={idx === 0} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-500">Can Delegate</span>
                          <Toggle value={lvl.canDelegate} onChange={v => updateLevel(lvl.id, "canDelegate", v)} />
                        </div>
                      </div>

                      {/* Remove */}
                      <div className="flex justify-end">
                        <button onClick={() => removeLevel(lvl.id)} disabled={idx === 0 && levels.length === 1}
                          className="p-2 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-0">
                          <Trash2 size={14} style={{ color: "#EF4444" }} />
                        </button>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-2 mt-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={lvl.required ? { background: "#EEF2FF", color: "#4F46E5" } : { background: "#F3F4F6", color: "#6B7280" }}>
                        {lvl.required ? "Required" : "Optional"}
                      </span>
                      {lvl.canDelegate && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">Delegatable</span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                        {lvl.slaHours}h SLA
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Final: auto-approve or escalate */}
              {levels.length > 0 && (
                <div className="flex items-center gap-3 pl-11">
                  <div className="h-6 w-0.5" style={{ background: "#E3E9F6" }} />
                </div>
              )}
              <div className="flex items-center gap-3 pl-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#ECFDF5" }}>
                  <CheckCircle2 size={15} style={{ color: "#059669" }} />
                </div>
                <div className="flex-1 rounded-xl border px-4 py-2.5" style={{ borderColor: "#A7F3D0", background: "#F0FDF4" }}>
                  <p className="text-xs font-semibold text-emerald-700">Approved — case proceeds to next stage</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* All-processes summary */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
          <Settings size={14} style={{ color: "#6B7280" }} />
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">All Approval Chains Summary</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8F9FF" }}>
              {["Process", "L1 Approver", "L2 Approver", "L3 Approver", "Total Levels", "Max SLA"].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PROCESS_TYPES.map(p => {
              const lvs = hierarchy[p.id] ?? [];
              const Icon = p.icon;
              const totalSLA = lvs.reduce((sum, l) => sum + l.slaHours, 0);
              return (
                <tr key={p.id} className="border-t hover:bg-slate-50 cursor-pointer transition-colors"
                  style={{ borderColor: "#F1F5F9", background: activeProcess === p.id ? p.bg : undefined }}
                  onClick={() => setActiveProcess(p.id)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: p.bg }}>
                        <Icon size={12} style={{ color: p.color }} />
                      </div>
                      <span className="font-semibold text-slate-700">{p.label}</span>
                    </div>
                  </td>
                  {[0, 1, 2].map(i => (
                    <td key={i} className="px-4 py-3 text-xs">
                      {lvs[i] ? (
                        <span className="px-2 py-0.5 rounded-full font-semibold" style={{ background: "#EEF2FF", color: "#4F46E5" }}>
                          {lvs[i].role}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <span className="text-sm font-extrabold" style={{ color: p.color }}>{lvs.length}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{totalSLA}h</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <SaveBar onSave={handleSave} saving={saving} success={success} error={error} />
    </div>
  );
}

// ─── Tab 2: Escalation Levels ──────────────────────────────────────────────────

function EscalationTab() {
  const { data: rawRules = [], isLoading: rulesLoad } = useListEscalationRulesQuery();
  const [createRule, { isLoading: creating }]         = useCreateEscalationRuleMutation();
  const [updateRule]                                  = useUpdateEscalationRuleMutation();
  const [deleteRule]                                  = useDeleteEscalationRuleMutation();

  const rules: EscalationRule[] = Array.isArray(rawRules) ? rawRules : [];

  const [modal,    setModal]    = useState(false);
  const [editRule, setEditRule] = useState<EscalationRule | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null);
  const [form, setForm] = useState<Partial<EscalationRule>>({
    name: "", trigger_event: "approval_pending", delay_minutes: 60,
    escalate_to_role: "HSE Manager", notify_via: ["email"], is_active: true,
  });

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  function openCreate() {
    setEditRule(null);
    setForm({ name: "", trigger_event: "approval_pending", delay_minutes: 60, escalate_to_role: "HSE Manager", notify_via: ["email"], is_active: true });
    setModal(true);
  }

  function openEdit(rule: EscalationRule) {
    setEditRule(rule);
    setForm({ ...rule });
    setModal(true);
  }

  async function handleSubmit() {
    if (!form.name?.trim()) return;
    try {
      if (editRule) {
        await updateRule({ ruleId: editRule.id, body: form }).unwrap();
        showToast("Rule updated.");
      } else {
        await createRule(form).unwrap();
        showToast("Escalation rule created.");
      }
      setModal(false); setEditRule(null);
    } catch { showToast("Failed to save rule.", false); }
  }

  async function handleToggle(rule: EscalationRule) {
    try { await updateRule({ ruleId: rule.id, body: { is_active: !rule.is_active } }).unwrap(); }
    catch { showToast("Failed to update.", false); }
  }

  async function handleDelete(id: string) {
    try { await deleteRule(id).unwrap(); showToast("Rule deleted.", false); }
    catch { showToast("Failed to delete.", false); }
    setDeleteId(null);
  }

  function toggleNotifCh(ch: string) {
    const cur = form.notify_via ?? [];
    setForm({ ...form, notify_via: cur.includes(ch) ? cur.filter(c => c !== ch) : [...cur, ch] });
  }

  // Group rules by escalate_to_role to build pyramid
  const byRole: Record<string, EscalationRule[]> = {};
  rules.forEach(r => { byRole[r.escalate_to_role] = [...(byRole[r.escalate_to_role] ?? []), r]; });

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Escalation Levels</h2>
          <p className="text-xs text-slate-500 mt-0.5">Define who gets escalated to when approvals time out or SLAs are breached.</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg, #D97706, #B45309)" }}>
          <Plus size={14} />New Rule
        </button>
      </div>

      {/* Escalation pyramid */}
      <div className="rounded-2xl border p-5" style={{ borderColor: "#E3E9F6", background: "#FFFBEB" }}>
        <SectionHeader icon={TrendingUp} title="Escalation Pyramid" subtitle="How unresolved cases bubble up the hierarchy" color="#D97706" />
        <div className="flex flex-col items-center gap-2">
          {[
            { label: "Admin",       color: "#7C3AED", bg: "#F5F3FF", count: byRole["Admin"]?.length        ?? 0, width: "40%" },
            { label: "HSE Manager", color: "#DC2626", bg: "#FEF2F2", count: byRole["HSE Manager"]?.length  ?? 0, width: "56%" },
            { label: "Site Manager",color: "#EA580C", bg: "#FFF7ED", count: byRole["Site Manager"]?.length ?? 0, width: "72%" },
            { label: "Supervisor",  color: "#D97706", bg: "#FFFBEB", count: byRole["Supervisor"]?.length   ?? 0, width: "88%" },
            { label: "Assigned",    color: "#059669", bg: "#ECFDF5", count: null,                              width: "100%" },
          ].map((tier, i) => (
            <div key={tier.label} className="relative" style={{ width: tier.width }}>
              {i > 0 && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <ArrowDown size={12} style={{ color: "#CBD5E1" }} />
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl"
                style={{ background: tier.bg, border: `1px solid ${tier.color}30` }}>
                <span className="text-xs font-bold" style={{ color: tier.color }}>{tier.label}</span>
                {tier.count !== null && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${tier.color}20`, color: tier.color }}>
                    {tier.count} rule{tier.count !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rules list */}
      {rulesLoad ? (
        <div className="py-12 text-center"><Loader2 size={24} className="mx-auto animate-spin text-amber-400" /></div>
      ) : rules.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border-2 border-dashed" style={{ borderColor: "#FDE68A" }}>
          <Zap size={32} className="mx-auto mb-3" style={{ color: "#FDE68A" }} />
          <p className="text-sm font-semibold text-slate-400">No escalation rules yet</p>
          <p className="text-xs text-slate-300 mt-1">Add rules to auto-escalate timed-out approvals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className="rounded-2xl border p-4 group hover:shadow-sm transition-shadow"
              style={{ borderColor: "#E3E9F6", background: rule.is_active ? "white" : "#F9FAFB" }}>
              <div className="flex items-start gap-3">
                <Toggle value={rule.is_active} onChange={() => handleToggle(rule)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800">{rule.name}</p>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => openEdit(rule)} className="p-1.5 rounded-lg hover:bg-indigo-50">
                        <Edit size={12} style={{ color: "#4F46E5" }} />
                      </button>
                      <button onClick={() => setDeleteId(rule.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                        <Trash2 size={12} style={{ color: "#EF4444" }} />
                      </button>
                    </div>
                  </div>

                  {/* Flow */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600">
                      <Zap size={10} />{rule.trigger_event.replace(/_/g, " ")}
                    </span>
                    <ArrowRight size={12} style={{ color: "#CBD5E1" }} />
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700">
                      <Clock size={10} />{rule.delay_minutes}min delay
                    </span>
                    <ArrowRight size={12} style={{ color: "#CBD5E1" }} />
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700">
                      <UserCheck size={10} />{rule.escalate_to_role}
                    </span>
                    <ArrowRight size={12} style={{ color: "#CBD5E1" }} />
                    <div className="flex items-center gap-1">
                      {(rule.notify_via ?? []).map(ch => {
                        const m = NOTIF_META[ch];
                        if (!m) return null;
                        const Icon = m.Icon;
                        return (
                          <span key={ch} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                            <Icon size={9} />{m.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {rule.description && (
                    <p className="text-xs text-slate-400 mt-1.5">{rule.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rule modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl border shadow-xl w-full max-w-lg mx-4" style={{ borderColor: "#E3E9F6" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#F1F5F9", background: "#FFFBEB" }}>
              <h3 className="text-base font-bold text-slate-800">{editRule ? "Edit Rule" : "New Escalation Rule"}</h3>
              <button onClick={() => setModal(false)} className="p-1 rounded-lg hover:bg-slate-100"><X size={16} style={{ color: "#6B7280" }} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Rule Name</label>
                <input value={form.name ?? ""} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Critical Incident 1-Hour Escalation"
                  className="w-full text-sm border rounded-xl px-3 py-2.5 outline-none" style={{ borderColor: "#E3E9F6" }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Trigger Event</label>
                  <select value={form.trigger_event ?? ""} onChange={e => setForm({ ...form, trigger_event: e.target.value })}
                    className="w-full text-sm border rounded-xl px-3 py-2.5 bg-white outline-none" style={{ borderColor: "#E3E9F6" }}>
                    {TRIGGER_EVENTS.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Delay (minutes)</label>
                  <input type="number" min={1} value={form.delay_minutes ?? 60}
                    onChange={e => setForm({ ...form, delay_minutes: Number(e.target.value) })}
                    className="w-full text-sm border rounded-xl px-3 py-2.5 outline-none" style={{ borderColor: "#E3E9F6" }} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Escalate To</label>
                  <select value={form.escalate_to_role ?? "HSE Manager"} onChange={e => setForm({ ...form, escalate_to_role: e.target.value })}
                    className="w-full text-sm border rounded-xl px-3 py-2.5 bg-white outline-none" style={{ borderColor: "#E3E9F6" }}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Notify Via</label>
                  <div className="flex flex-wrap gap-1.5">
                    {NOTIF_CH.map(ch => {
                      const selected = (form.notify_via ?? []).includes(ch);
                      return (
                        <button key={ch} onClick={() => toggleNotifCh(ch)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all"
                          style={selected ? { background: "#4F46E5", color: "white", borderColor: "#4F46E5" } : { background: "white", color: "#6B7280", borderColor: "#E3E9F6" }}>
                          {NOTIF_META[ch]?.label ?? ch}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Description (optional)</label>
                <input value={form.description ?? ""} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of when this rule triggers…"
                  className="w-full text-sm border rounded-xl px-3 py-2.5 outline-none" style={{ borderColor: "#E3E9F6" }} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: "#E3E9F6" }}>
                <p className="text-sm font-semibold text-slate-700">Rule Active</p>
                <Toggle value={form.is_active ?? true} onChange={v => setForm({ ...form, is_active: v })} />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex gap-3" style={{ borderColor: "#F1F5F9" }}>
              <button onClick={handleSubmit} disabled={creating || !form.name?.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #D97706, #B45309)" }}>
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editRule ? "Save Changes" : "Create Rule"}
              </button>
              <button onClick={() => setModal(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium border text-slate-500" style={{ borderColor: "#E3E9F6" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl border p-6 max-w-sm w-full mx-4 shadow-xl" style={{ borderColor: "#E3E9F6" }}>
            <h3 className="text-base font-bold text-slate-800 mb-2">Delete Rule?</h3>
            <p className="text-sm text-slate-500 mb-5">This rule will stop auto-escalating cases. Existing open escalations are unaffected.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: "#EF4444" }}>Delete</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border text-slate-500" style={{ borderColor: "#E3E9F6" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 3: Approval Authority ────────────────────────────────────────────────

function AuthorityTab() {
  const [authority, setAuthority] = useState<AuthorityRule[]>(defaultAuthority);
  const [activeRole, setActiveRole] = useState(ROLES[5]); // HSE Manager default
  const [success, setSuccess] = useState(false);

  const rule = authority.find(a => a.role === activeRole) ?? authority[0];

  function updateRule(key: keyof AuthorityRule, value: unknown) {
    setAuthority(prev => prev.map(a => a.role === activeRole ? { ...a, [key]: value } : a));
  }

  function toggleProcess(pid: ProcessId) {
    const cur = rule.canApprove;
    updateRule("canApprove", { ...cur, [pid]: !cur[pid] });
  }

  function handleSave() {
    setSuccess(true); setTimeout(() => setSuccess(false), 3000);
  }

  const sevIdx = (sev: Severity) => SEV_ORDER.indexOf(sev);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Approval Authority</h2>
        <p className="text-xs text-slate-500 mt-0.5">Define the maximum approval authority, delegation rights and override permissions per role.</p>
      </div>

      {/* Authority matrix overview */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
          <Shield size={14} style={{ color: "#4F46E5" }} />
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Authority Matrix — Role × Severity</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8F9FF" }}>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 w-40">Role</th>
                {SEVERITIES.map(s => {
                  const m = SEV_META[s];
                  return (
                    <th key={s} className="px-4 py-3 text-center text-xs font-semibold" style={{ color: m.color }}>{m.label}</th>
                  );
                })}
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">Delegate</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">Override</th>
              </tr>
            </thead>
            <tbody>
              {authority.map(a => {
                const maxIdx = sevIdx(a.maxSeverity);
                return (
                  <tr key={a.role}
                    className="border-t cursor-pointer transition-colors"
                    style={{ borderColor: "#F1F5F9", background: activeRole === a.role ? "#EEF2FF" : undefined }}
                    onClick={() => setActiveRole(a.role)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: ROLE_AUTHORITY[a.role]?.bg ?? "#F3F4F6" }}>
                          <Users size={13} style={{ color: ROLE_AUTHORITY[a.role]?.color ?? "#9CA3AF" }} />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{a.role}</span>
                      </div>
                    </td>
                    {SEVERITIES.map((sev, idx) => {
                      const m       = SEV_META[sev];
                      const canAppr = idx <= maxIdx;
                      return (
                        <td key={sev} className="px-4 py-3 text-center">
                          {canAppr ? (
                            <div className="inline-flex items-center justify-center w-7 h-7 rounded-full"
                              style={{ background: m.bg }}>
                              <CheckCircle2 size={13} style={{ color: m.color }} />
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100">
                              <X size={11} style={{ color: "#CBD5E1" }} />
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      {a.canDelegate
                        ? <CheckCircle2 size={15} className="mx-auto" style={{ color: "#059669" }} />
                        : <X size={13} className="mx-auto" style={{ color: "#CBD5E1" }} />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {a.canOverride
                        ? <Shield size={14} className="mx-auto" style={{ color: "#7C3AED" }} />
                        : <X size={13} className="mx-auto" style={{ color: "#CBD5E1" }} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role detail editor */}
      {rule && (
        <div className="grid grid-cols-2 gap-6">
          {/* Left: authority config */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
            <div className="px-5 py-4 border-b flex items-center gap-3"
              style={{ borderColor: "#F1F5F9", background: ROLE_AUTHORITY[activeRole]?.bg ?? "#F8F9FF" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: ROLE_AUTHORITY[activeRole]?.color ?? "#4F46E5" }}>
                <Users size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{activeRole}</p>
                <p className="text-xs text-slate-500">Configure authority for this role</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>
                  Maximum Approval Severity
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {SEVERITIES.map(sev => {
                    const m       = SEV_META[sev];
                    const active  = rule.maxSeverity === sev;
                    return (
                      <button key={sev} onClick={() => updateRule("maxSeverity", sev)}
                        className="py-2 rounded-xl text-xs font-bold border transition-all"
                        style={active ? { background: m.bg, color: m.color, borderColor: m.color } : { background: "white", color: "#6B7280", borderColor: "#E3E9F6" }}>
                        {m.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  This role can approve up to <strong style={{ color: SEV_META[rule.maxSeverity].color }}>{rule.maxSeverity}</strong> severity cases.
                </p>
              </div>

              <div className="pt-3 border-t" style={{ borderColor: "#F1F5F9" }}>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>Approvable Process Types</label>
                <div className="space-y-2">
                  {PROCESS_TYPES.map(p => {
                    const canAppr = rule.canApprove?.[p.id] ?? false;
                    const Icon    = p.icon;
                    return (
                      <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl border"
                        style={{ borderColor: canAppr ? p.color + "40" : "#E3E9F6", background: canAppr ? p.bg : "white" }}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: p.bg }}>
                            <Icon size={12} style={{ color: p.color }} />
                          </div>
                          <span className="text-xs font-semibold text-slate-700">{p.label}</span>
                        </div>
                        <Toggle value={canAppr} onChange={() => toggleProcess(p.id)} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right: delegation & override */}
          <div className="space-y-4">
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
              <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
                <UserCheck size={15} style={{ color: "#059669" }} />
                <p className="text-sm font-bold text-slate-700">Delegation</p>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: "#E3E9F6" }}>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Can Delegate Approvals</p>
                    <p className="text-xs text-slate-400 mt-0.5">Allow this role to delegate to another</p>
                  </div>
                  <Toggle value={rule.canDelegate} onChange={v => updateRule("canDelegate", v)} />
                </div>
                {rule.canDelegate && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Delegate To Role</label>
                    <select value={rule.delegateTo} onChange={e => updateRule("delegateTo", e.target.value)}
                      className="w-full text-sm border rounded-xl px-3 py-2.5 bg-white outline-none"
                      style={{ borderColor: "#E3E9F6" }}>
                      {ROLES.filter(r => r !== activeRole).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                      <Info size={10} />Delegation is temporary and logged in the audit trail.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
              <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
                <Lock size={15} style={{ color: "#7C3AED" }} />
                <p className="text-sm font-bold text-slate-700">Override Permissions</p>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: "#E3E9F6" }}>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Can Override Approval</p>
                    <p className="text-xs text-slate-400 mt-0.5">Bypass waiting approvals in emergency</p>
                  </div>
                  <Toggle value={rule.canOverride} onChange={v => updateRule("canOverride", v)} />
                </div>
                {rule.canOverride && (
                  <div className="mt-3 flex items-start gap-2 p-3 rounded-xl"
                    style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                    <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-red-600">
                      Override actions are fully logged and flagged for compliance review. Use with caution.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Role selector quick-jump */}
            <div className="rounded-2xl border p-4" style={{ borderColor: "#E3E9F6" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>Switch Role</p>
              <div className="flex flex-wrap gap-1.5">
                {ROLES.map(r => {
                  const a = ROLE_AUTHORITY[r];
                  return (
                    <button key={r} onClick={() => setActiveRole(r)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all"
                      style={activeRole === r
                        ? { background: a?.color ?? "#4F46E5", color: "white", borderColor: a?.color ?? "#4F46E5" }
                        : { background: "white", color: "#6B7280", borderColor: "#E3E9F6" }}>
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <SaveBar onSave={handleSave} saving={false} success={success} error={null} />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "hierarchy",  label: "Approval Hierarchy", icon: GitMerge,   color: "#4F46E5" },
  { id: "escalation", label: "Escalation Levels",  icon: Zap,        color: "#D97706" },
  { id: "authority",  label: "Approval Authority", icon: Shield,     color: "#7C3AED" },
] as const;

type TabId = typeof TABS[number]["id"];

export function ApprovalMatrixPage() {
  const [activeTab, setActiveTab] = useState<TabId>("hierarchy");
  const { data: rawRules = [] }   = useListEscalationRulesQuery();
  const rules: EscalationRule[]   = Array.isArray(rawRules) ? rawRules : [];

  const activeTabMeta = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>

      {/* ── Banner ── */}
      <div className="relative overflow-hidden px-6 pt-7 pb-6"
        style={{ background: "linear-gradient(135deg, #2E1065 0%, #4C1D95 45%, #0F172A 100%)" }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 20% 60%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 85% 25%, #C4B5FD 0%, transparent 45%)" }} />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <GitMerge size={18} className="text-violet-300" />
              <span className="text-violet-200 text-xs font-bold tracking-widest uppercase">Administration</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Approval Matrix</h1>
            <p className="text-violet-200 text-sm mt-1">
              Configure approval chains, escalation paths and role-based authority across all process types.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {[
              { label: "Process Types", value: PROCESS_TYPES.length },
              { label: "Escalation Rules", value: rules.length },
              { label: "Roles Configured", value: ROLES.length },
            ].map(s => (
              <div key={s.label} className="px-3 py-2 rounded-xl text-center"
                style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <div className="text-sm font-extrabold text-white">{s.value}</div>
                <div className="text-[10px] text-violet-300 mt-0.5">{s.label}</div>
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
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Configuration</p>
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

          {/* Quick guide */}
          <div className="mt-4 rounded-2xl border p-4 space-y-3" style={{ borderColor: "#E3E9F6", background: "white" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Quick Guide</p>
            {[
              { icon: GitMerge, text: "Hierarchy defines level-by-level approver sequences.", color: "#4F46E5" },
              { icon: Zap,      text: "Escalation auto-routes when SLA is missed.",            color: "#D97706" },
              { icon: Shield,   text: "Authority controls who can approve what severity.",     color: "#7C3AED" },
            ].map(g => (
              <div key={g.text} className="flex items-start gap-2">
                <g.icon size={11} className="flex-shrink-0 mt-0.5" style={{ color: g.color }} />
                <p className="text-[11px] text-slate-500">{g.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl p-3 flex items-start gap-2" style={{ background: "#F5F3FF", border: "1px solid #DDD6FE" }}>
            <Info size={13} className="text-violet-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-violet-600">
              Changes apply to new cases immediately. In-progress approvals follow the rules set when they were created.
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
                  {activeTab === "hierarchy"  && "Build multi-level approval chains per process type."}
                  {activeTab === "escalation" && "Auto-escalate timed-out approvals to the next authority."}
                  {activeTab === "authority"  && "Set max severity, delegation and override rights per role."}
                </p>
              </div>
            </div>

            {activeTab === "hierarchy"  && <HierarchyTab />}
            {activeTab === "escalation" && <EscalationTab />}
            {activeTab === "authority"  && <AuthorityTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
