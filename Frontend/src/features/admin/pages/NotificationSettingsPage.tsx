import { useState } from "react";
import {
  Bell, Mail, Smartphone, Send, CheckCircle2, AlertCircle,
  Save, Plus, Trash2, Edit, X, ChevronRight, Eye, EyeOff,
  Zap, Clock, Users, Shield, Info, Loader2, RefreshCw,
  AlertTriangle, ClipboardCheck, FileText, Settings,
  TestTube, Lock, Volume2, VolumeX, Moon, Sun,
  ArrowRight, UserCheck, Hash, Phone, AtSign,
} from "lucide-react";
import {
  useListEscalationRulesQuery,
  useCreateEscalationRuleMutation,
  useUpdateEscalationRuleMutation,
  useDeleteEscalationRuleMutation,
  type EscalationRule,
} from "@/features/workflow/api/escalationRulesApi";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES = ["Admin", "HSE Manager", "Site Manager", "Supervisor", "Safety Officer", "Auditor", "Worker"];

const TRIGGER_EVENTS = [
  { id: "incident_reported",        label: "Incident Reported",         severity: "high",     icon: AlertTriangle  },
  { id: "incident_critical",        label: "Critical Incident",         severity: "critical",  icon: AlertTriangle  },
  { id: "capa_overdue",             label: "CAPA Overdue",              severity: "high",      icon: ClipboardCheck },
  { id: "capa_due_soon",            label: "CAPA Due Soon",             severity: "medium",    icon: ClipboardCheck },
  { id: "audit_finding_raised",     label: "Audit Finding Raised",      severity: "medium",    icon: Shield         },
  { id: "audit_scheduled",          label: "Audit Scheduled",           severity: "low",       icon: FileText       },
  { id: "permit_submitted",         label: "Permit Submitted",          severity: "medium",    icon: FileText       },
  { id: "permit_expiring",          label: "Permit Expiring",           severity: "medium",    icon: FileText       },
  { id: "near_miss_reported",       label: "Near Miss Reported",        severity: "medium",    icon: AlertCircle    },
  { id: "hazard_identified",        label: "Hazard Identified",         severity: "high",      icon: Zap            },
  { id: "approval_pending",         label: "Approval Pending",          severity: "medium",    icon: CheckCircle2   },
  { id: "approval_sla_breach",      label: "Approval SLA Breach",       severity: "high",      icon: Clock          },
  { id: "compliance_gap",           label: "Compliance Gap Detected",   severity: "high",      icon: Shield         },
  { id: "user_invitation",          label: "User Invitation Sent",      severity: "low",       icon: Users          },
] as const;

type EventId = typeof TRIGGER_EVENTS[number]["id"];

const SEV_META: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: "#DC2626", bg: "#FEF2F2", label: "Critical" },
  high:     { color: "#EA580C", bg: "#FFF7ED", label: "High"     },
  medium:   { color: "#D97706", bg: "#FFFBEB", label: "Medium"   },
  low:      { color: "#059669", bg: "#ECFDF5", label: "Low"      },
};

const SMS_PROVIDERS = ["Twilio", "AWS SNS", "MessageBird", "Vonage", "Plivo", "Custom"];
const PUSH_PROVIDERS = ["Firebase (FCM)", "Apple (APNS)", "OneSignal", "Custom"];
const DIGEST_TIMES = ["06:00", "07:00", "08:00", "09:00", "17:00", "18:00", "19:00", "20:00"];
const QUIET_HOURS_START = ["20:00", "21:00", "22:00", "23:00"];
const QUIET_HOURS_END   = ["05:00", "06:00", "07:00", "08:00"];

const TRIGGER_EVENTS_ESC = [
  "approval_pending", "sla_breach_imminent", "incident_reported",
  "capa_overdue", "audit_finding_raised", "near_miss_reported", "permit_submitted",
];

// ─── Shared helpers ───────────────────────────────────────────────────────────

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

function Label({ text, hint }: { text: string; hint?: string }) {
  return (
    <div className="mb-1.5">
      <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: "#6B7280" }}>{text}</label>
      {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", icon: Icon, secret }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; icon?: typeof Mail; secret?: boolean;
}) {
  const [show, setShow] = useState(false);
  const inputType = secret ? (show ? "text" : "password") : type;
  return (
    <div className="relative">
      {Icon && <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />}
      <input type={inputType} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-sm border rounded-xl py-2.5 outline-none transition-all"
        style={{ borderColor: "#E3E9F6", color: "#111827", paddingLeft: Icon ? "2.25rem" : "0.875rem", paddingRight: secret ? "2.5rem" : "0.875rem" }}
        onFocus={e => { e.currentTarget.style.borderColor = "#4F46E5"; e.currentTarget.style.boxShadow = "0 0 0 3px #EEF2FF"; }}
        onBlur={e  => { e.currentTarget.style.borderColor = "#E3E9F6"; e.currentTarget.style.boxShadow = "none"; }}
      />
      {secret && (
        <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2">
          {show ? <EyeOff size={13} style={{ color: "#9CA3AF" }} /> : <Eye size={13} style={{ color: "#9CA3AF" }} />}
        </button>
      )}
    </div>
  );
}

function SelectInput({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full text-sm border rounded-xl px-3 py-2.5 bg-white outline-none"
      style={{ borderColor: "#E3E9F6", color: value ? "#111827" : "#9CA3AF" }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function SaveBar({ onSave, saving, success, error, onTest, testing, testLabel }: {
  onSave: () => void; saving: boolean; success: boolean; error: string | null;
  onTest?: () => void; testing?: boolean; testLabel?: string;
}) {
  return (
    <div className="flex items-center gap-3 pt-5 mt-2 border-t" style={{ borderColor: "#F1F5F9" }}>
      <button onClick={onSave} disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-60 hover:opacity-90 transition-opacity"
        style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)" }}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {saving ? "Saving…" : "Save Settings"}
      </button>
      {onTest && (
        <button onClick={onTest} disabled={testing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border disabled:opacity-50 hover:bg-slate-50 transition-colors"
          style={{ borderColor: "#E3E9F6", color: "#374151" }}>
          {testing ? <Loader2 size={14} className="animate-spin" /> : <TestTube size={14} />}
          {testing ? "Testing…" : (testLabel ?? "Send Test")}
        </button>
      )}
      {success && <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600"><CheckCircle2 size={14} />Saved</span>}
      {error   && <span className="flex items-center gap-1.5 text-sm font-semibold text-red-600"><AlertCircle size={14} />{error}</span>}
    </div>
  );
}

function ChannelBadge({ channel }: { channel: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    email:  { color: "#4F46E5", bg: "#EEF2FF" },
    sms:    { color: "#059669", bg: "#ECFDF5" },
    push:   { color: "#0891B2", bg: "#F0F9FF" },
    in_app: { color: "#D97706", bg: "#FFFBEB" },
  };
  const m = map[channel] ?? { color: "#6B7280", bg: "#F3F4F6" };
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
      style={{ background: m.bg, color: m.color }}>{channel.replace("_", " ")}</span>
  );
}

// ─── Event trigger row ────────────────────────────────────────────────────────

function EventRow({
  event, enabled, roles, mode, onToggle, onRoleToggle, onModeChange, color,
}: {
  event: typeof TRIGGER_EVENTS[number];
  enabled: boolean;
  roles: string[];
  mode: "instant" | "digest";
  onToggle: () => void;
  onRoleToggle: (r: string) => void;
  onModeChange: (m: "instant" | "digest") => void;
  color: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const m = SEV_META[event.severity];
  const Icon = event.icon;

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: enabled ? `${color}30` : "#E3E9F6" }}>
      <div className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${enabled ? "" : "opacity-60"}`}
        style={{ background: enabled ? `${color}06` : "white" }}
        onClick={() => enabled && setExpanded(!expanded)}>
        <Toggle value={enabled} onChange={onToggle} />
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: m.bg }}>
          <Icon size={13} style={{ color: m.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-700">{event.label}</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: m.bg, color: m.color }}>{m.label}</span>
        {enabled && (
          <ChevronRight size={13} style={{ color: "#9CA3AF", transform: expanded ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.2s" }} />
        )}
      </div>

      {enabled && expanded && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: "#F1F5F9" }}>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>Notify Roles</p>
              <div className="flex flex-wrap gap-1.5">
                {ROLES.slice(0, 5).map(r => (
                  <button key={r} onClick={() => onRoleToggle(r)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all"
                    style={roles.includes(r) ? { background: color, color: "white", borderColor: color } : { background: "white", color: "#6B7280", borderColor: "#E3E9F6" }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>Send Mode</p>
              <div className="flex gap-2">
                {(["instant", "digest"] as const).map(m => (
                  <button key={m} onClick={() => onModeChange(m)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold border capitalize transition-all"
                    style={mode === m ? { background: color, color: "white", borderColor: color } : { background: "white", color: "#6B7280", borderColor: "#E3E9F6" }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 1: Email Alerts ──────────────────────────────────────────────────────

function EmailTab() {
  const [smtp, setSmtp] = useState({ host: "", port: "587", user: "", pass: "", tls: true, fromName: "HSE Intelligence", fromEmail: "", replyTo: "" });
  const [digestEnabled, setDigestEnabled] = useState(true);
  const [digestTime, setDigestTime]       = useState("08:00");
  const [testing, setTesting]             = useState(false);
  const [saving,  setSaving]              = useState(false);
  const [success, setSuccess]             = useState(false);
  const [error,   setError]               = useState<string | null>(null);
  const [toast,   setToast]               = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  type EventState = { enabled: boolean; roles: string[]; mode: "instant" | "digest" };
  const [events, setEvents] = useState<Record<EventId, EventState>>(() =>
    Object.fromEntries(TRIGGER_EVENTS.map(e => [e.id, {
      enabled: ["incident_reported", "incident_critical", "capa_overdue", "approval_pending", "approval_sla_breach"].includes(e.id),
      roles: ["HSE Manager", "Admin"],
      mode: "instant" as const,
    }])) as Record<EventId, EventState>
  );

  function toggleEvent(id: EventId) {
    setEvents(prev => ({ ...prev, [id]: { ...prev[id], enabled: !prev[id].enabled } }));
  }
  function toggleRole(id: EventId, role: string) {
    setEvents(prev => {
      const cur = prev[id].roles;
      return { ...prev, [id]: { ...prev[id], roles: cur.includes(role) ? cur.filter(r => r !== role) : [...cur, role] } };
    });
  }
  function setMode(id: EventId, mode: "instant" | "digest") {
    setEvents(prev => ({ ...prev, [id]: { ...prev[id], mode } }));
  }

  async function handleTest() {
    if (!smtp.fromEmail) { showToast("Set a From Email address first.", false); return; }
    setTesting(true);
    await new Promise(r => setTimeout(r, 1500));
    setTesting(false);
    showToast("Test email sent successfully.");
  }

  function handleSave() {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSuccess(true); setTimeout(() => setSuccess(false), 3000); }, 800);
  }

  const enabledCount = Object.values(events).filter(e => e.enabled).length;

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} />}
      <div>
        <h2 className="text-lg font-bold text-slate-800">Email Alerts</h2>
        <p className="text-xs text-slate-500 mt-0.5">Configure SMTP server, sender identity and per-event email notification rules.</p>
      </div>

      {/* SMTP Config */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
          <Settings size={15} style={{ color: "#4F46E5" }} />
          <p className="text-sm font-bold text-slate-700">SMTP Configuration</p>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2 grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label text="SMTP Host" />
              <TextInput value={smtp.host} onChange={v => setSmtp({ ...smtp, host: v })} placeholder="smtp.mailserver.com" icon={Hash} />
            </div>
            <div>
              <Label text="Port" />
              <SelectInput value={smtp.port} onChange={v => setSmtp({ ...smtp, port: v })} options={["25", "465", "587", "2525"]} />
            </div>
          </div>
          <div>
            <Label text="SMTP Username" />
            <TextInput value={smtp.user} onChange={v => setSmtp({ ...smtp, user: v })} placeholder="noreply@company.com" icon={AtSign} />
          </div>
          <div>
            <Label text="SMTP Password" />
            <TextInput value={smtp.pass} onChange={v => setSmtp({ ...smtp, pass: v })} placeholder="••••••••" icon={Lock} secret />
          </div>
          <div className="col-span-2 flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: "#E3E9F6" }}>
            <div>
              <p className="text-sm font-semibold text-slate-700">Enable TLS / STARTTLS</p>
              <p className="text-xs text-slate-400">Encrypt connection to the SMTP server</p>
            </div>
            <Toggle value={smtp.tls} onChange={v => setSmtp({ ...smtp, tls: v })} />
          </div>
        </div>
      </div>

      {/* Sender identity */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
          <AtSign size={15} style={{ color: "#0891B2" }} />
          <p className="text-sm font-bold text-slate-700">Sender Identity</p>
        </div>
        <div className="p-5 grid grid-cols-3 gap-4">
          <div>
            <Label text="Display Name" hint="Shown in the From field" />
            <TextInput value={smtp.fromName} onChange={v => setSmtp({ ...smtp, fromName: v })} placeholder="HSE Intelligence" />
          </div>
          <div>
            <Label text="From Email Address" />
            <TextInput value={smtp.fromEmail} onChange={v => setSmtp({ ...smtp, fromEmail: v })} placeholder="noreply@company.com" icon={Mail} />
          </div>
          <div>
            <Label text="Reply-To Address" hint="Optional override" />
            <TextInput value={smtp.replyTo} onChange={v => setSmtp({ ...smtp, replyTo: v })} placeholder="support@company.com" icon={Mail} />
          </div>
        </div>
      </div>

      {/* Digest settings */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
          <div className="flex items-center gap-2">
            <Clock size={15} style={{ color: "#D97706" }} />
            <p className="text-sm font-bold text-slate-700">Daily Digest</p>
          </div>
          <Toggle value={digestEnabled} onChange={setDigestEnabled} />
        </div>
        {digestEnabled && (
          <div className="p-5 flex items-center gap-6">
            <div className="w-44">
              <Label text="Digest Send Time" />
              <SelectInput value={digestTime} onChange={setDigestTime} options={DIGEST_TIMES} />
            </div>
            <div className="flex items-start gap-2 p-3 rounded-xl flex-1" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
              <Info size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Events marked as <strong>Digest</strong> below will be bundled into a single email at <strong>{digestTime}</strong> daily. Critical events always send instantly regardless.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Event triggers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-slate-700">Event Notification Rules
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">{enabledCount} active</span>
          </p>
          <button onClick={() => setEvents(prev => Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, { ...v, enabled: true }])) as typeof prev)}
            className="text-xs text-indigo-600 font-semibold hover:underline">Enable all</button>
        </div>
        <div className="space-y-2">
          {TRIGGER_EVENTS.map(evt => (
            <EventRow key={evt.id} event={evt} color="#4F46E5"
              enabled={events[evt.id as EventId].enabled}
              roles={events[evt.id as EventId].roles}
              mode={events[evt.id as EventId].mode}
              onToggle={() => toggleEvent(evt.id as EventId)}
              onRoleToggle={r => toggleRole(evt.id as EventId, r)}
              onModeChange={m => setMode(evt.id as EventId, m)} />
          ))}
        </div>
      </div>

      <SaveBar onSave={handleSave} saving={saving} success={success} error={error}
        onTest={handleTest} testing={testing} testLabel="Send Test Email" />
    </div>
  );
}

// ─── Tab 2: SMS Notifications ─────────────────────────────────────────────────

function SMSTab() {
  const [provider,    setProvider]    = useState("Twilio");
  const [accountSid,  setAccountSid]  = useState("");
  const [authToken,   setAuthToken]   = useState("");
  const [fromNumber,  setFromNumber]  = useState("");
  const [enabled,     setEnabled]     = useState(true);
  const [quietEnabled, setQuietEnabled] = useState(true);
  const [quietStart,  setQuietStart]  = useState("22:00");
  const [quietEnd,    setQuietEnd]    = useState("07:00");
  const [testing,     setTesting]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [toast,       setToast]       = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  // Only high/critical events for SMS
  const smsEvents = TRIGGER_EVENTS.filter(e => ["critical", "high"].includes(e.severity));

  type SMSEventState = { enabled: boolean; roles: string[] };
  const [smsConfig, setSmsConfig] = useState<Record<string, SMSEventState>>(() =>
    Object.fromEntries(smsEvents.map(e => [e.id, { enabled: e.severity === "critical", roles: ["Admin", "HSE Manager"] }]))
  );

  function toggleSmsEvent(id: string) { setSmsConfig(prev => ({ ...prev, [id]: { ...prev[id], enabled: !prev[id].enabled } })); }
  function toggleSmsRole(id: string, role: string) {
    setSmsConfig(prev => {
      const cur = prev[id].roles;
      return { ...prev, [id]: { ...prev[id], roles: cur.includes(role) ? cur.filter(r => r !== role) : [...cur, role] } };
    });
  }

  async function handleTest() {
    if (!fromNumber) { showToast("Set a From Number first.", false); return; }
    setTesting(true);
    await new Promise(r => setTimeout(r, 1500));
    setTesting(false);
    showToast("Test SMS sent successfully.");
  }

  function handleSave() {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSuccess(true); setTimeout(() => setSuccess(false), 3000); }, 800);
  }

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} />}
      <div>
        <h2 className="text-lg font-bold text-slate-800">SMS Notifications</h2>
        <p className="text-xs text-slate-500 mt-0.5">Configure SMS provider, sending number, quiet hours and high-priority event triggers.</p>
      </div>

      {/* Master toggle */}
      <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ borderColor: "#E3E9F6", background: enabled ? "#F0FDF4" : "#F9FAFB" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: enabled ? "#059669" : "#E5E7EB" }}>
            <Smartphone size={16} style={{ color: enabled ? "white" : "#9CA3AF" }} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">SMS Notifications {enabled ? "Enabled" : "Disabled"}</p>
            <p className="text-xs text-slate-400">Master switch for all SMS alerts</p>
          </div>
        </div>
        <Toggle value={enabled} onChange={setEnabled} />
      </div>

      {/* Provider config */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
          <Settings size={15} style={{ color: "#059669" }} />
          <p className="text-sm font-bold text-slate-700">Provider Configuration</p>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label text="SMS Provider" />
            <SelectInput value={provider} onChange={setProvider} options={SMS_PROVIDERS} />
          </div>
          <div>
            <Label text={provider === "Twilio" ? "Account SID" : "API Key"} />
            <TextInput value={accountSid} onChange={setAccountSid} placeholder={`${provider} account identifier`} icon={Hash} />
          </div>
          <div>
            <Label text={provider === "Twilio" ? "Auth Token" : "API Secret"} />
            <TextInput value={authToken} onChange={setAuthToken} placeholder="••••••••••••" icon={Lock} secret />
          </div>
          <div className="col-span-2">
            <Label text="From Phone Number" hint="Include country code e.g. +1 555 000 0000" />
            <TextInput value={fromNumber} onChange={setFromNumber} placeholder="+1 555 000 0000" icon={Phone} />
          </div>
        </div>
      </div>

      {/* Quiet hours */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
          <div className="flex items-center gap-2">
            <Moon size={15} style={{ color: "#7C3AED" }} />
            <p className="text-sm font-bold text-slate-700">Quiet Hours</p>
            <span className="text-xs text-slate-400">(non-critical SMS paused)</span>
          </div>
          <Toggle value={quietEnabled} onChange={setQuietEnabled} />
        </div>
        {quietEnabled && (
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label text="Do Not Disturb From" />
                <SelectInput value={quietStart} onChange={setQuietStart} options={QUIET_HOURS_START} />
              </div>
              <div>
                <Label text="Resume Sending At" />
                <SelectInput value={quietEnd} onChange={setQuietEnd} options={QUIET_HOURS_END} />
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
              <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600">
                <strong>Critical severity</strong> SMS always bypass quiet hours regardless of this setting.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Character info */}
      <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "#F0F9FF", border: "1px solid #BAE6FD" }}>
        <Info size={14} className="text-sky-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-sky-700">
          <p className="font-semibold mb-1">SMS Character Limits</p>
          <p>Standard SMS: 160 chars · Unicode SMS: 70 chars. Long messages split into multiple parts, each billed separately. Keep templates concise.</p>
        </div>
      </div>

      {/* SMS triggers */}
      <div>
        <p className="text-sm font-bold text-slate-700 mb-3">
          High-Priority SMS Events
          <span className="ml-2 text-xs font-normal text-slate-400">Only Critical and High severity events are SMS-eligible</span>
        </p>
        <div className="space-y-2">
          {smsEvents.map(evt => {
            const cfg = smsConfig[evt.id] ?? { enabled: false, roles: [] };
            const m   = SEV_META[evt.severity];
            const Icon = evt.icon;
            return (
              <div key={evt.id} className="rounded-xl border p-3.5 flex items-center gap-3"
                style={{ borderColor: cfg.enabled ? `${m.color}30` : "#E3E9F6", background: cfg.enabled ? `${m.color}05` : "white" }}>
                <Toggle value={cfg.enabled} onChange={() => toggleSmsEvent(evt.id)} />
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: m.bg }}>
                  <Icon size={13} style={{ color: m.color }} />
                </div>
                <p className="flex-1 text-sm font-semibold text-slate-700">{evt.label}</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: m.bg, color: m.color }}>{m.label}</span>
                {cfg.enabled && (
                  <div className="flex flex-wrap gap-1">
                    {["Admin", "HSE Manager", "Site Manager"].map(r => (
                      <button key={r} onClick={() => toggleSmsRole(evt.id, r)}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold border transition-all"
                        style={cfg.roles.includes(r)
                          ? { background: "#059669", color: "white", borderColor: "#059669" }
                          : { background: "white", color: "#6B7280", borderColor: "#E3E9F6" }}>
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <SaveBar onSave={handleSave} saving={saving} success={success} error={null}
        onTest={handleTest} testing={testing} testLabel="Send Test SMS" />
    </div>
  );
}

// ─── Tab 3: Push Notifications ────────────────────────────────────────────────

function PushTab() {
  const [provider,    setProvider]    = useState("Firebase (FCM)");
  const [serverKey,   setServerKey]   = useState("");
  const [webPush,     setWebPush]     = useState(true);
  const [mobilePush,  setMobilePush]  = useState(true);
  const [sound,       setSound]       = useState(true);
  const [badge,       setBadge]       = useState(true);
  const [vibrate,     setVibrate]     = useState(true);
  const [quietEnabled, setQuietEnabled] = useState(false);
  const [quietStart,  setQuietStart]  = useState("23:00");
  const [quietEnd,    setQuietEnd]    = useState("07:00");
  const [saving,      setSaving]      = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [testing,     setTesting]     = useState(false);
  const [toast,       setToast]       = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  type PushState = { enabled: boolean; actionBtn: boolean };
  const [pushConfig, setPushConfig] = useState<Record<string, PushState>>(() =>
    Object.fromEntries(TRIGGER_EVENTS.map(e => [e.id, { enabled: ["incident_reported", "incident_critical", "capa_overdue", "approval_pending"].includes(e.id), actionBtn: ["incident_critical"].includes(e.id) }]))
  );

  function handleSave() { setSaving(true); setTimeout(() => { setSaving(false); setSuccess(true); setTimeout(() => setSuccess(false), 3000); }, 800); }
  async function handleTest() {
    setTesting(true); await new Promise(r => setTimeout(r, 1500)); setTesting(false);
    showToast("Test push notification delivered.");
  }

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} />}
      <div>
        <h2 className="text-lg font-bold text-slate-800">Push Notifications</h2>
        <p className="text-xs text-slate-500 mt-0.5">Configure push provider, device behaviour, quiet hours and per-event push rules.</p>
      </div>

      {/* Provider */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
          <Settings size={15} style={{ color: "#0891B2" }} />
          <p className="text-sm font-bold text-slate-700">Push Provider</p>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          <div>
            <Label text="Provider" />
            <SelectInput value={provider} onChange={setProvider} options={PUSH_PROVIDERS} />
          </div>
          <div>
            <Label text={provider.includes("Firebase") ? "FCM Server Key" : provider.includes("Apple") ? "APNS Key ID" : "API Key"} />
            <TextInput value={serverKey} onChange={setServerKey} placeholder="Server key / API key" icon={Lock} secret />
          </div>
        </div>
      </div>

      {/* Delivery options */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
          <Bell size={15} style={{ color: "#7C3AED" }} />
          <p className="text-sm font-bold text-slate-700">Delivery Options</p>
        </div>
        <div className="p-5 space-y-0">
          {[
            { label: "Web Push",              sub: "Send to browser / desktop clients",       value: webPush,    set: setWebPush    },
            { label: "Mobile Push",           sub: "Send to iOS and Android apps",            value: mobilePush, set: setMobilePush },
            { label: "Notification Sound",    sub: "Play alert sound on device",              value: sound,      set: setSound      },
            { label: "Badge Count",           sub: "Show unread count on app icon",           value: badge,      set: setBadge      },
            { label: "Vibration",             sub: "Vibrate device on mobile notification",   value: vibrate,    set: setVibrate    },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: "#F1F5F9" }}>
              <div>
                <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                <p className="text-xs text-slate-400">{item.sub}</p>
              </div>
              <Toggle value={item.value} onChange={item.set} />
            </div>
          ))}
        </div>
      </div>

      {/* Quiet hours */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
          <div className="flex items-center gap-2">
            <Moon size={15} style={{ color: "#4F46E5" }} />
            <p className="text-sm font-bold text-slate-700">Quiet Hours</p>
          </div>
          <Toggle value={quietEnabled} onChange={setQuietEnabled} />
        </div>
        {quietEnabled && (
          <div className="p-5 grid grid-cols-2 gap-4">
            <div>
              <Label text="Quiet From" />
              <SelectInput value={quietStart} onChange={setQuietStart} options={QUIET_HOURS_START} />
            </div>
            <div>
              <Label text="Resume At" />
              <SelectInput value={quietEnd} onChange={setQuietEnd} options={QUIET_HOURS_END} />
            </div>
          </div>
        )}
      </div>

      {/* Push notification preview */}
      <div className="rounded-2xl border p-5" style={{ borderColor: "#E3E9F6", background: "#F8F9FF" }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>Notification Preview</p>
        <div className="max-w-sm rounded-2xl overflow-hidden shadow-lg" style={{ background: "linear-gradient(135deg, #1E1B4B, #3730A3)" }}>
          <div className="px-4 py-3 flex items-center gap-2 border-b border-white/10">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
              <Shield size={12} className="text-white" />
            </div>
            <span className="text-xs font-bold text-white">HSE Intelligence</span>
            <span className="ml-auto text-[10px] text-indigo-300">now</span>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm font-bold text-white mb-0.5">🚨 Critical Incident Reported</p>
            <p className="text-xs text-indigo-200">Chemical spill detected at North Plant — Zone B. Immediate action required.</p>
            {badge && <div className="flex gap-2 mt-2.5">
              <button className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>View</button>
              <button className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "#DC2626", color: "white" }}>Respond</button>
            </div>}
          </div>
        </div>
      </div>

      {/* Push event rules */}
      <div>
        <p className="text-sm font-bold text-slate-700 mb-3">
          Push Event Rules
          <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-700">
            {Object.values(pushConfig).filter(c => c.enabled).length} active
          </span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          {TRIGGER_EVENTS.map(evt => {
            const cfg  = pushConfig[evt.id];
            const m    = SEV_META[evt.severity];
            const Icon = evt.icon;
            return (
              <div key={evt.id} className="flex items-center gap-2.5 p-3 rounded-xl border"
                style={{ borderColor: cfg.enabled ? `${m.color}30` : "#E3E9F6", background: cfg.enabled ? `${m.color}06` : "white" }}>
                <Toggle value={cfg.enabled} onChange={() => setPushConfig(prev => ({ ...prev, [evt.id]: { ...prev[evt.id], enabled: !prev[evt.id].enabled } }))} />
                <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: m.bg }}>
                  <Icon size={11} style={{ color: m.color }} />
                </div>
                <p className="flex-1 text-xs font-semibold text-slate-700 min-w-0 truncate">{evt.label}</p>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: m.bg, color: m.color }}>{m.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <SaveBar onSave={handleSave} saving={saving} success={success} error={null}
        onTest={handleTest} testing={testing} testLabel="Send Test Push" />
    </div>
  );
}

// ─── Tab 4: Escalation Notifications ─────────────────────────────────────────

interface EscContact {
  id: string; name: string; role: string;
  email: string; phone: string;
  priority: number; channels: string[];
}

function EscalationNotifTab() {
  const { data: rawRules = [], isLoading }  = useListEscalationRulesQuery();
  const [createRule, { isLoading: creating }] = useCreateEscalationRuleMutation();
  const [updateRule]                           = useUpdateEscalationRuleMutation();
  const [deleteRule]                           = useDeleteEscalationRuleMutation();

  const rules: EscalationRule[] = Array.isArray(rawRules) ? rawRules : [];

  const [contacts, setContacts] = useState<EscContact[]>([
    { id: "1", name: "Sarah Johnson",  role: "HSE Manager",  email: "sarah@co.com", phone: "+1 555 0101", priority: 1, channels: ["email", "sms", "push"] },
    { id: "2", name: "Mike Chen",      role: "Admin",        email: "mike@co.com",  phone: "+1 555 0102", priority: 2, channels: ["email", "push"]         },
    { id: "3", name: "Priya Sharma",   role: "Site Manager", email: "priya@co.com", phone: "+1 555 0103", priority: 3, channels: ["email"]                  },
  ]);

  const [bypassQuiet,   setBypassQuiet]   = useState(true);
  const [retryFailed,   setRetryFailed]   = useState(true);
  const [retryCount,    setRetryCount]    = useState(3);
  const [retryInterval, setRetryInterval] = useState(15);
  const [modal,         setModal]         = useState(false);
  const [ruleModal,     setRuleModal]     = useState(false);
  const [deleteId,      setDeleteId]      = useState<string | null>(null);
  const [toast,         setToast]         = useState<{ msg: string; ok: boolean } | null>(null);
  const [saving,        setSaving]        = useState(false);
  const [success,       setSuccess]       = useState(false);
  const [contactForm,   setContactForm]   = useState<Partial<EscContact>>({ name: "", role: "HSE Manager", email: "", phone: "", priority: contacts.length + 1, channels: ["email"] });
  const [ruleForm,      setRuleForm]      = useState<Partial<EscalationRule>>({
    name: "", trigger_event: "approval_pending", delay_minutes: 60,
    escalate_to_role: "HSE Manager", notify_via: ["email", "push"], is_active: true,
  });

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  function addContact() {
    if (!contactForm.name?.trim()) return;
    setContacts(prev => [...prev, { id: String(Date.now()), ...contactForm } as EscContact]);
    setModal(false);
    setContactForm({ name: "", role: "HSE Manager", email: "", phone: "", priority: contacts.length + 2, channels: ["email"] });
  }

  function removeContact(id: string) { setContacts(prev => prev.filter(c => c.id !== id)); }

  function toggleContactChannel(id: string, ch: string) {
    setContacts(prev => prev.map(c => c.id === id ? {
      ...c, channels: c.channels.includes(ch) ? c.channels.filter(x => x !== ch) : [...c.channels, ch],
    } : c));
  }

  async function handleCreateRule() {
    if (!ruleForm.name?.trim()) return;
    try {
      await createRule(ruleForm).unwrap();
      showToast("Escalation rule created."); setRuleModal(false);
    } catch { showToast("Failed to create rule.", false); }
  }

  async function handleToggleRule(rule: EscalationRule) {
    try { await updateRule({ ruleId: rule.id, body: { is_active: !rule.is_active } }).unwrap(); }
    catch { showToast("Failed to update.", false); }
  }

  async function handleDeleteRule(id: string) {
    try { await deleteRule(id).unwrap(); showToast("Rule deleted.", false); }
    catch { showToast("Failed to delete.", false); }
    setDeleteId(null);
  }

  function toggleRuleNotifCh(ch: string) {
    const cur = ruleForm.notify_via ?? [];
    setRuleForm({ ...ruleForm, notify_via: cur.includes(ch) ? cur.filter(c => c !== ch) : [...cur, ch] });
  }

  function handleSave() { setSaving(true); setTimeout(() => { setSaving(false); setSuccess(true); setTimeout(() => setSuccess(false), 3000); }, 800); }

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} />}
      <div>
        <h2 className="text-lg font-bold text-slate-800">Escalation Notifications</h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage escalation contacts, notification rules and retry behaviour for unresolved alerts.</p>
      </div>

      {/* Behaviour toggles */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
          <Zap size={15} style={{ color: "#D97706" }} />
          <p className="text-sm font-bold text-slate-700">Escalation Behaviour</p>
        </div>
        <div className="p-5 space-y-0">
          <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: "#F1F5F9" }}>
            <div>
              <p className="text-sm font-semibold text-slate-700">Bypass Quiet Hours for Critical Escalations</p>
              <p className="text-xs text-slate-400">Critical alerts always wake escalation contacts regardless of DND settings</p>
            </div>
            <Toggle value={bypassQuiet} onChange={setBypassQuiet} />
          </div>
          <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: "#F1F5F9" }}>
            <div>
              <p className="text-sm font-semibold text-slate-700">Retry Failed Notifications</p>
              <p className="text-xs text-slate-400">Automatically retry if delivery confirmation is not received</p>
            </div>
            <Toggle value={retryFailed} onChange={setRetryFailed} />
          </div>
          {retryFailed && (
            <div className="pt-3 pb-1 grid grid-cols-2 gap-4">
              <div>
                <Label text="Max Retry Attempts" />
                <div className="flex items-center gap-2">
                  <input type="number" min={1} max={10} value={retryCount}
                    onChange={e => setRetryCount(Number(e.target.value))}
                    className="w-20 text-sm border rounded-xl px-3 py-2 text-center font-bold outline-none"
                    style={{ borderColor: "#E3E9F6" }} />
                  <span className="text-xs text-slate-400">attempts</span>
                </div>
              </div>
              <div>
                <Label text="Retry Interval" />
                <div className="flex items-center gap-2">
                  <input type="number" min={5} max={120} value={retryInterval}
                    onChange={e => setRetryInterval(Number(e.target.value))}
                    className="w-20 text-sm border rounded-xl px-3 py-2 text-center font-bold outline-none"
                    style={{ borderColor: "#E3E9F6" }} />
                  <span className="text-xs text-slate-400">minutes</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Escalation contacts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-slate-700">Escalation Contacts
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">{contacts.length}</span>
          </p>
          <button onClick={() => setModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #D97706, #B45309)" }}>
            <Plus size={12} />Add Contact
          </button>
        </div>

        <div className="space-y-3">
          {contacts.map((c, idx) => (
            <div key={c.id} className="rounded-2xl border p-4 group hover:shadow-sm transition-shadow" style={{ borderColor: "#E3E9F6" }}>
              <div className="flex items-start gap-3">
                {/* Priority badge */}
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0"
                  style={{ background: idx === 0 ? "#DC2626" : idx === 1 ? "#EA580C" : "#D97706" }}>
                  {c.priority}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{c.role}</p>
                    </div>
                    <button onClick={() => removeContact(c.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={13} style={{ color: "#EF4444" }} />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Mail size={10} />{c.email}</span>
                    <span className="flex items-center gap-1"><Phone size={10} />{c.phone}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notify via:</span>
                    {(["email", "sms", "push", "in_app"] as const).map(ch => (
                      <button key={ch} onClick={() => toggleContactChannel(c.id, ch)}
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all"
                        style={c.channels.includes(ch)
                          ? { background: "#4F46E5", color: "white", borderColor: "#4F46E5" }
                          : { background: "white", color: "#D1D5DB", borderColor: "#E3E9F6" }}>
                        {ch.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Escalation rules from API */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-slate-700">Escalation Notification Rules
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">{rules.length}</span>
          </p>
          <button onClick={() => setRuleModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #EA580C, #DC2626)" }}>
            <Plus size={12} />Add Rule
          </button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center"><Loader2 size={20} className="mx-auto animate-spin text-orange-400" /></div>
        ) : rules.length === 0 ? (
          <div className="py-10 text-center rounded-2xl border-2 border-dashed" style={{ borderColor: "#FED7AA" }}>
            <Zap size={24} className="mx-auto mb-2 text-orange-300" />
            <p className="text-sm text-slate-400">No escalation rules configured</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rules.map(rule => (
              <div key={rule.id} className="rounded-xl border p-3.5 flex items-center gap-3 group"
                style={{ borderColor: "#E3E9F6", background: rule.is_active ? "#FFFBEB" : "#F9FAFB" }}>
                <Toggle value={rule.is_active} onChange={() => handleToggleRule(rule)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{rule.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                      {rule.trigger_event.replace(/_/g, " ")}
                    </span>
                    <ArrowRight size={10} style={{ color: "#CBD5E1" }} />
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold">
                      {rule.delay_minutes}min
                    </span>
                    <ArrowRight size={10} style={{ color: "#CBD5E1" }} />
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
                      {rule.escalate_to_role}
                    </span>
                    <div className="flex gap-1">
                      {(rule.notify_via ?? []).map(ch => <ChannelBadge key={ch} channel={ch} />)}
                    </div>
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
      </div>

      <SaveBar onSave={handleSave} saving={saving} success={success} error={null} />

      {/* Add contact modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl border shadow-xl w-full max-w-md mx-4" style={{ borderColor: "#E3E9F6" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#F1F5F9", background: "#FFFBEB" }}>
              <h3 className="text-base font-bold text-slate-800">Add Escalation Contact</h3>
              <button onClick={() => setModal(false)} className="p-1 rounded-lg hover:bg-slate-100"><X size={16} style={{ color: "#6B7280" }} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label text="Full Name" />
                  <TextInput value={contactForm.name ?? ""} onChange={v => setContactForm({ ...contactForm, name: v })} placeholder="e.g. Sarah Johnson" />
                </div>
                <div>
                  <Label text="Role" />
                  <SelectInput value={contactForm.role ?? "HSE Manager"} onChange={v => setContactForm({ ...contactForm, role: v })} options={ROLES} />
                </div>
                <div>
                  <Label text="Priority Order" hint="1 = first to notify" />
                  <input type="number" min={1} max={10} value={contactForm.priority ?? 1}
                    onChange={e => setContactForm({ ...contactForm, priority: Number(e.target.value) })}
                    className="w-full text-sm border rounded-xl px-3 py-2.5 outline-none" style={{ borderColor: "#E3E9F6" }} />
                </div>
                <div>
                  <Label text="Email Address" />
                  <TextInput value={contactForm.email ?? ""} onChange={v => setContactForm({ ...contactForm, email: v })} placeholder="name@company.com" icon={Mail} />
                </div>
                <div>
                  <Label text="Phone Number" />
                  <TextInput value={contactForm.phone ?? ""} onChange={v => setContactForm({ ...contactForm, phone: v })} placeholder="+1 555 000 0000" icon={Phone} />
                </div>
                <div className="col-span-2">
                  <Label text="Preferred Channels" />
                  <div className="flex gap-2 flex-wrap mt-1">
                    {["email", "sms", "push", "in_app"].map(ch => {
                      const sel = (contactForm.channels ?? []).includes(ch);
                      return (
                        <button key={ch} onClick={() => {
                          const cur = contactForm.channels ?? [];
                          setContactForm({ ...contactForm, channels: sel ? cur.filter(c => c !== ch) : [...cur, ch] });
                        }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize"
                          style={sel ? { background: "#4F46E5", color: "white", borderColor: "#4F46E5" } : { background: "white", color: "#6B7280", borderColor: "#E3E9F6" }}>
                          {ch.replace("_", " ")}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex gap-3" style={{ borderColor: "#F1F5F9" }}>
              <button onClick={addContact} disabled={!contactForm.name?.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #D97706, #B45309)" }}>
                <Plus size={14} />Add Contact
              </button>
              <button onClick={() => setModal(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium border text-slate-500" style={{ borderColor: "#E3E9F6" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add rule modal */}
      {ruleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl border shadow-xl w-full max-w-md mx-4" style={{ borderColor: "#E3E9F6" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#F1F5F9", background: "#FFF7ED" }}>
              <h3 className="text-base font-bold text-slate-800">New Escalation Rule</h3>
              <button onClick={() => setRuleModal(false)} className="p-1 rounded-lg hover:bg-slate-100"><X size={16} style={{ color: "#6B7280" }} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <Label text="Rule Name" />
                <TextInput value={ruleForm.name ?? ""} onChange={v => setRuleForm({ ...ruleForm, name: v })} placeholder="e.g. Critical Incident Immediate Escalation" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label text="Trigger Event" />
                  <SelectInput value={ruleForm.trigger_event ?? ""} onChange={v => setRuleForm({ ...ruleForm, trigger_event: v })} options={TRIGGER_EVENTS_ESC} />
                </div>
                <div>
                  <Label text="Delay (minutes)" />
                  <input type="number" min={0} value={ruleForm.delay_minutes ?? 60} onChange={e => setRuleForm({ ...ruleForm, delay_minutes: Number(e.target.value) })}
                    className="w-full text-sm border rounded-xl px-3 py-2.5 outline-none" style={{ borderColor: "#E3E9F6" }} />
                </div>
                <div>
                  <Label text="Escalate To Role" />
                  <SelectInput value={ruleForm.escalate_to_role ?? ""} onChange={v => setRuleForm({ ...ruleForm, escalate_to_role: v })} options={ROLES} />
                </div>
                <div>
                  <Label text="Notify Via" />
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(["email", "sms", "push", "in_app"] as const).map(ch => {
                      const sel = (ruleForm.notify_via ?? []).includes(ch);
                      return (
                        <button key={ch} onClick={() => toggleRuleNotifCh(ch)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all"
                          style={sel ? { background: "#EA580C", color: "white", borderColor: "#EA580C" } : { background: "white", color: "#6B7280", borderColor: "#E3E9F6" }}>
                          {ch.replace("_", " ")}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex gap-3" style={{ borderColor: "#F1F5F9" }}>
              <button onClick={handleCreateRule} disabled={creating || !ruleForm.name?.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #EA580C, #DC2626)" }}>
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}Create Rule
              </button>
              <button onClick={() => setRuleModal(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium border text-slate-500" style={{ borderColor: "#E3E9F6" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl border p-6 max-w-sm w-full mx-4 shadow-xl" style={{ borderColor: "#E3E9F6" }}>
            <h3 className="text-base font-bold text-slate-800 mb-2">Delete Rule?</h3>
            <p className="text-sm text-slate-500 mb-5">This escalation rule will stop firing. Open escalations are unaffected.</p>
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

// ─── Main Page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "email",      label: "Email Alerts",            icon: Mail,        color: "#4F46E5" },
  { id: "sms",        label: "SMS Notifications",        icon: Smartphone,  color: "#059669" },
  { id: "push",       label: "Push Notifications",       icon: Bell,        color: "#0891B2" },
  { id: "escalation", label: "Escalation Notifications", icon: Zap,         color: "#D97706" },
] as const;

type TabId = typeof TABS[number]["id"];

export function NotificationSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("email");
  const { data: rawRules = [] }   = useListEscalationRulesQuery();
  const rules                     = Array.isArray(rawRules) ? rawRules : [];
  const activeTabMeta             = TABS.find(t => t.id === activeTab)!;

  const channelStats = [
    { label: "Email Events",  value: TRIGGER_EVENTS.length, color: "#4F46E5" },
    { label: "SMS Triggers",  value: TRIGGER_EVENTS.filter(e => ["critical","high"].includes(e.severity)).length, color: "#059669" },
    { label: "Push Events",   value: TRIGGER_EVENTS.length, color: "#0891B2" },
    { label: "Escalation Rules", value: rules.length,       color: "#D97706" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>

      {/* ── Banner ── */}
      <div className="relative overflow-hidden px-6 pt-7 pb-6"
        style={{ background: "linear-gradient(135deg, #1C1917 0%, #292524 40%, #0F172A 100%)" }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 20% 60%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute inset-0 opacity-15"
          style={{ backgroundImage: "radial-gradient(circle at 80% 30%, #FCD34D 0%, transparent 40%)" }} />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Bell size={18} className="text-amber-300" />
              <span className="text-amber-200 text-xs font-bold tracking-widest uppercase">Administration</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Notification Settings</h1>
            <p className="text-amber-100/70 text-sm mt-1">Configure email, SMS, push and escalation notification rules across the platform.</p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {channelStats.map(s => (
              <div key={s.label} className="px-3 py-2 rounded-xl text-center"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div className="text-sm font-extrabold text-white">{s.value}</div>
                <div className="text-[10px] text-amber-200/70 mt-0.5">{s.label}</div>
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
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Channels</p>
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

          {/* Channel status */}
          <div className="mt-4 rounded-2xl border p-4 space-y-2.5" style={{ borderColor: "#E3E9F6", background: "white" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Channel Status</p>
            {[
              { icon: Mail,       label: "Email",     status: "Configured", color: "#4F46E5"  },
              { icon: Smartphone, label: "SMS",       status: "Not set up", color: "#9CA3AF"  },
              { icon: Bell,       label: "Push",      status: "Active",     color: "#0891B2"  },
              { icon: Zap,        label: "Escalation",status: `${rules.length} rules`, color: "#D97706" },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5" style={{ color: "#6B7280" }}>
                  <s.icon size={11} style={{ color: s.color }} />{s.label}
                </div>
                <span className="font-semibold" style={{ color: s.color }}>{s.status}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl p-3 flex items-start gap-2" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
            <Info size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700">
              Critical alerts bypass all quiet hour and digest settings and are always delivered instantly.
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
                  {activeTab === "email"      && "SMTP server, sender identity, digest schedule and per-event email triggers."}
                  {activeTab === "sms"        && "SMS provider credentials, quiet hours and high-priority event triggers."}
                  {activeTab === "push"       && "Push provider, device options, quiet hours and per-event push triggers."}
                  {activeTab === "escalation" && "Escalation contacts, notification rules and retry behaviour."}
                </p>
              </div>
            </div>

            {activeTab === "email"      && <EmailTab />}
            {activeTab === "sms"        && <SMSTab />}
            {activeTab === "push"       && <PushTab />}
            {activeTab === "escalation" && <EscalationNotifTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
