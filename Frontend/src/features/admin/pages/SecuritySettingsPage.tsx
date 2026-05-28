import { useState, useEffect } from "react";
import {
  Shield, Lock, Clock, Globe, Users, Key,
  CheckCircle2, AlertCircle, Loader2, Save,
  Plus, Trash2, X, ChevronRight, Eye, EyeOff,
  Info, AlertTriangle, Monitor, MapPin, Smartphone,
  ShieldCheck, ShieldAlert, ShieldOff, LogIn,
  RefreshCw, ToggleLeft, Check, Settings,
  Hash, Calendar, UserCheck, Database,
} from "lucide-react";
import {
  useGetSecurityPolicyQuery,
  useUpdateSecurityPolicyMutation,
  useListRolesQuery,
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useListPermissionsQuery,
  useUpdateRolePermissionsMutation,
} from "@/features/superadmin/api/adminApi";

// ─── Constants ────────────────────────────────────────────────────────────────

const PASSWORD_STRENGTHS = [
  { label: "Very Weak", color: "#EF4444", bg: "#FEF2F2" },
  { label: "Weak",      color: "#F97316", bg: "#FFF7ED" },
  { label: "Fair",      color: "#FBBF24", bg: "#FFFBEB" },
  { label: "Strong",    color: "#22C55E", bg: "#F0FDF4" },
  { label: "Very Strong",color:"#059669", bg: "#ECFDF5" },
];

const SESSION_TIMEOUT_OPTIONS = [
  { value: 15,   label: "15 minutes"  },
  { value: 30,   label: "30 minutes"  },
  { value: 60,   label: "1 hour"      },
  { value: 120,  label: "2 hours"     },
  { value: 240,  label: "4 hours"     },
  { value: 480,  label: "8 hours"     },
  { value: 0,    label: "Never"       },
];

const LOCKOUT_DURATION_OPTIONS = [
  { value: 5,    label: "5 minutes"   },
  { value: 15,   label: "15 minutes"  },
  { value: 30,   label: "30 minutes"  },
  { value: 60,   label: "1 hour"      },
  { value: -1,   label: "Until unlock"},
];

const REMEMBER_ME_OPTIONS = [
  { value: 1,  label: "1 day"   },
  { value: 7,  label: "7 days"  },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
  { value: 0,  label: "Disabled"},
];

const PASSWORD_EXPIRY_OPTIONS = [
  { value: 0,   label: "Never"    },
  { value: 30,  label: "30 days"  },
  { value: 60,  label: "60 days"  },
  { value: 90,  label: "90 days"  },
  { value: 180, label: "180 days" },
];

const RETENTION_OPTIONS = [
  { value: 30,  label: "30 days"  },
  { value: 90,  label: "90 days"  },
  { value: 180, label: "180 days" },
  { value: 365, label: "1 year"   },
  { value: 730, label: "2 years"  },
  { value: 1825,label: "5 years"  },
];

const PERM_GROUP_META: Record<string, { color: string; bg: string }> = {
  Core:        { color: "#4F46E5", bg: "#EEF2FF" },
  Safety:      { color: "#DC2626", bg: "#FEF2F2" },
  Compliance:  { color: "#059669", bg: "#ECFDF5" },
  Operations:  { color: "#D97706", bg: "#FFFBEB" },
  Insights:    { color: "#0891B2", bg: "#F0F9FF" },
  Admin:       { color: "#7C3AED", bg: "#F5F3FF" },
  People:      { color: "#DB2777", bg: "#FDF2F8" },
};

const MOCK_SESSIONS = [
  { id: "s1", user: "Sarah Johnson",  role: "HSE Manager", device: "Chrome / Windows", ip: "192.168.1.45",   location: "London, UK",     since: "2h ago",   current: true  },
  { id: "s2", user: "Mike Chen",      role: "Admin",       device: "Safari / macOS",   ip: "10.0.0.12",      location: "Singapore",      since: "4h ago",   current: false },
  { id: "s3", user: "Priya Sharma",   role: "Supervisor",  device: "Mobile / Android", ip: "172.16.0.5",     location: "Mumbai, India",  since: "1d ago",   current: false },
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

function FieldRow({ label, hint, children, danger }: {
  label: string; hint?: string; children: React.ReactNode; danger?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-3.5 border-b last:border-0" style={{ borderColor: "#F1F5F9" }}>
      <div className="min-w-0">
        <p className="text-sm font-semibold" style={{ color: danger ? "#DC2626" : "#374151" }}>{label}</p>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Card({ title, subtitle, icon: Icon, color, children }: {
  title: string; subtitle: string; icon: typeof Shield; color: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
      <div className="flex items-center gap-2.5 px-5 py-4 border-b" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
          <Icon size={15} style={{ color }} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{title}</p>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function SaveBar({ onSave, saving, success, error }: {
  onSave: () => void; saving: boolean; success: boolean; error: string | null;
}) {
  return (
    <div className="flex items-center gap-4 pt-5 mt-2 border-t" style={{ borderColor: "#F1F5F9" }}>
      <button onClick={onSave} disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-60 hover:opacity-90 transition-opacity"
        style={{ background: "linear-gradient(135deg, #1E3A5F, #1D4ED8)" }}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {saving ? "Saving…" : "Save Settings"}
      </button>
      {success && <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600"><CheckCircle2 size={14} />Saved</span>}
      {error   && <span className="flex items-center gap-1.5 text-sm font-semibold text-red-600"><AlertCircle size={14} />{error}</span>}
    </div>
  );
}

// ─── Password strength scorer ─────────────────────────────────────────────────

function scorePassword(len: number, upper: boolean, lower: boolean, num: boolean, special: boolean, expiry: number): number {
  let s = 0;
  if (len >= 12) s++;
  if (len >= 16) s++;
  if (upper && lower) s++;
  if (num) s++;
  if (special) s++;
  if (expiry > 0 && expiry <= 90) s = Math.max(s, 1);
  return Math.min(s, 4);
}

// ─── Tab 1: Password Policies ─────────────────────────────────────────────────

function PasswordTab() {
  const { data: policy, isLoading }               = useGetSecurityPolicyQuery();
  const [updatePolicy, { isLoading: saving }]     = useUpdateSecurityPolicyMutation();

  const [minLen,    setMinLen]    = useState(12);
  const [upper,     setUpper]     = useState(true);
  const [lower,     setLower]     = useState(true);
  const [numbers,   setNumbers]   = useState(true);
  const [special,   setSpecial]   = useState(true);
  const [noCommon,  setNoCommon]  = useState(true);
  const [expiry,    setExpiry]    = useState(90);
  const [history,   setHistory]   = useState(5);
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [lockDuration, setLockDuration] = useState(30);
  const [mfa,       setMfa]       = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    if (policy) {
      if (policy.password_min_length)  setMinLen(policy.password_min_length);
      if (policy.max_login_attempts)   setMaxAttempts(policy.max_login_attempts);
      if (policy.mfa_required != null) setMfa(policy.mfa_required);
    }
  }, [policy]);

  const strength = scorePassword(minLen, upper, lower, numbers, special, expiry);
  const strengthInfo = PASSWORD_STRENGTHS[strength];

  async function handleSave() {
    try {
      setError(null);
      await updatePolicy({ password_min_length: minLen, mfa_required: mfa, max_login_attempts: maxAttempts }).unwrap();
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch { setError("Failed to save password policy."); }
  }

  if (isLoading) return <div className="py-16 text-center"><Loader2 size={24} className="mx-auto animate-spin text-blue-400" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Password Policies</h2>
        <p className="text-xs text-slate-500 mt-0.5">Define complexity requirements, expiry rules and lockout behaviour for all user accounts.</p>
      </div>

      {/* Strength indicator */}
      <div className="rounded-2xl p-5 border" style={{ borderColor: `${strengthInfo.color}40`, background: strengthInfo.bg }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold" style={{ color: strengthInfo.color }}>Policy Strength: {strengthInfo.label}</p>
          <ShieldCheck size={18} style={{ color: strengthInfo.color }} />
        </div>
        <div className="flex gap-1.5">
          {PASSWORD_STRENGTHS.map((s, i) => (
            <div key={i} className="flex-1 h-2 rounded-full transition-all duration-500"
              style={{ background: i <= strength ? s.color : "#E5E7EB" }} />
          ))}
        </div>
        <p className="text-xs mt-2" style={{ color: strengthInfo.color }}>
          {strength < 2 && "Add more complexity requirements to strengthen this policy."}
          {strength === 2 && "Good policy — consider adding special character requirements."}
          {strength === 3 && "Strong policy — consider enabling MFA for maximum security."}
          {strength >= 4 && "Excellent policy configuration."}
        </p>
      </div>

      {/* Complexity */}
      <Card icon={Key} title="Password Complexity" subtitle="Minimum requirements for all user passwords" color="#1D4ED8">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>Minimum Length: <span style={{ color: "#1D4ED8" }}>{minLen} characters</span></p>
          <input type="range" min={8} max={32} value={minLen} onChange={e => setMinLen(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: "#1D4ED8" }} />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>8 (min)</span><span>16 (recommended)</span><span>32 (max)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3 border-t" style={{ borderColor: "#F1F5F9" }}>
          {[
            { label: "Uppercase letters (A–Z)",       value: upper,    set: setUpper    },
            { label: "Lowercase letters (a–z)",        value: lower,    set: setLower    },
            { label: "Numbers (0–9)",                  value: numbers,  set: setNumbers  },
            { label: "Special characters (!@#$…)",     value: special,  set: setSpecial  },
            { label: "Reject common passwords",        value: noCommon, set: setNoCommon },
            { label: "No username in password",        value: true,     set: () => {}    },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-2.5 rounded-xl border" style={{ borderColor: "#E3E9F6" }}>
              <span className="text-xs font-medium text-slate-600">{item.label}</span>
              <Toggle value={item.value} onChange={item.set} />
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* Expiry */}
        <Card icon={Calendar} title="Password Expiry" subtitle="Force password rotation on a schedule" color="#7C3AED">
          <FieldRow label="Password Expires After" hint="Users must reset after this period">
            <select value={expiry} onChange={e => setExpiry(Number(e.target.value))}
              className="text-sm border rounded-xl px-3 py-2 bg-white outline-none min-w-32"
              style={{ borderColor: "#E3E9F6" }}>
              {PASSWORD_EXPIRY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </FieldRow>
          <FieldRow label="Password History" hint="Cannot reuse last N passwords">
            <div className="flex items-center gap-2">
              <input type="number" min={0} max={24} value={history}
                onChange={e => setHistory(Number(e.target.value))}
                className="w-16 text-sm border rounded-xl px-3 py-1.5 text-center font-bold outline-none"
                style={{ borderColor: "#E3E9F6" }} />
              <span className="text-xs text-slate-400">passwords</span>
            </div>
          </FieldRow>
        </Card>

        {/* Lockout */}
        <Card icon={ShieldAlert} title="Account Lockout" subtitle="Protect against brute-force attacks" color="#DC2626">
          <FieldRow label="Max Failed Attempts" hint="Before account is locked">
            <div className="flex items-center gap-2">
              {[3, 5, 10].map(n => (
                <button key={n} onClick={() => setMaxAttempts(n)}
                  className="w-10 h-9 rounded-xl text-sm font-extrabold border transition-all"
                  style={maxAttempts === n
                    ? { background: "#DC2626", color: "white", borderColor: "#DC2626" }
                    : { background: "white", color: "#6B7280", borderColor: "#E3E9F6" }}>
                  {n}
                </button>
              ))}
            </div>
          </FieldRow>
          <FieldRow label="Lockout Duration" hint="How long before the account auto-unlocks">
            <select value={lockDuration} onChange={e => setLockDuration(Number(e.target.value))}
              className="text-sm border rounded-xl px-3 py-2 bg-white outline-none min-w-36"
              style={{ borderColor: "#E3E9F6" }}>
              {LOCKOUT_DURATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </FieldRow>
        </Card>
      </div>

      {/* MFA */}
      <Card icon={Smartphone} title="Multi-Factor Authentication" subtitle="Add a second verification step for all sign-ins" color="#059669">
        <FieldRow label="Require MFA for All Users" hint="Users must verify via authenticator app or SMS on every login." danger>
          <Toggle value={mfa} onChange={setMfa} />
        </FieldRow>
        <FieldRow label="Grace Period for New Users" hint="Days allowed before MFA must be set up">
          <div className="flex items-center gap-2">
            <input type="number" min={0} max={30} defaultValue={7}
              className="w-16 text-sm border rounded-xl px-3 py-1.5 text-center font-bold outline-none"
              style={{ borderColor: "#E3E9F6" }} />
            <span className="text-xs text-slate-400">days</span>
          </div>
        </FieldRow>
        {mfa && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl" style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
            <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700">MFA is enabled — all users will be prompted to set up an authenticator on their next login.</p>
          </div>
        )}
      </Card>

      <SaveBar onSave={handleSave} saving={saving} success={success} error={error} />
    </div>
  );
}

// ─── Tab 2: Session Timeout ────────────────────────────────────────────────────

function SessionTab() {
  const { data: policy }                          = useGetSecurityPolicyQuery();
  const [updatePolicy, { isLoading: saving }]     = useUpdateSecurityPolicyMutation();

  const [timeout,    setTimeout_]   = useState(60);
  const [idle,       setIdle]        = useState(30);
  const [concurrent, setConcurrent]  = useState(true);
  const [maxSessions,setMaxSessions] = useState(3);
  const [rememberMe, setRememberMe]  = useState(7);
  const [forceReauth,setForceReauth] = useState(true);
  const [sessionAudit, setSessionAudit] = useState(true);
  const [revokedIds, setRevokedIds] = useState<string[]>([]);
  const [success,    setSuccess]     = useState(false);
  const [error,      setError]       = useState<string | null>(null);

  useEffect(() => {
    if (policy?.session_timeout_minutes) setTimeout_(policy.session_timeout_minutes);
  }, [policy]);

  async function handleSave() {
    try {
      setError(null);
      await updatePolicy({ session_timeout_minutes: timeout }).unwrap();
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch { setError("Failed to save session settings."); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Session Timeout</h2>
        <p className="text-xs text-slate-500 mt-0.5">Control how long user sessions remain active and configure concurrent session rules.</p>
      </div>

      {/* Timeout config */}
      <Card icon={Clock} title="Session Duration" subtitle="When inactive or maximum session length" color="#1D4ED8">
        <FieldRow label="Session Timeout" hint="Auto-logout after this period of total session time">
          <div className="flex flex-wrap gap-1.5">
            {SESSION_TIMEOUT_OPTIONS.map(o => (
              <button key={o.value} onClick={() => setTimeout_(o.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
                style={timeout === o.value
                  ? { background: "#1D4ED8", color: "white", borderColor: "#1D4ED8" }
                  : { background: "white", color: "#6B7280", borderColor: "#E3E9F6" }}>
                {o.label}
              </button>
            ))}
          </div>
        </FieldRow>
        <FieldRow label="Idle Timeout" hint="Auto-logout after this period of inactivity">
          <div className="flex flex-wrap gap-1.5">
            {[15, 30, 60, 120].map(m => (
              <button key={m} onClick={() => setIdle(m)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
                style={idle === m
                  ? { background: "#7C3AED", color: "white", borderColor: "#7C3AED" }
                  : { background: "white", color: "#6B7280", borderColor: "#E3E9F6" }}>
                {m}min
              </button>
            ))}
          </div>
        </FieldRow>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* Concurrent sessions */}
        <Card icon={Monitor} title="Concurrent Sessions" subtitle="Control simultaneous logins from multiple devices" color="#0891B2">
          <FieldRow label="Allow Multiple Sessions" hint="Users can be logged in from multiple devices simultaneously">
            <Toggle value={concurrent} onChange={setConcurrent} />
          </FieldRow>
          {concurrent && (
            <FieldRow label="Max Concurrent Sessions" hint="Maximum devices a user can be active on">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 5].map(n => (
                  <button key={n} onClick={() => setMaxSessions(n)}
                    className="w-9 h-9 rounded-xl text-sm font-extrabold border transition-all"
                    style={maxSessions === n
                      ? { background: "#0891B2", color: "white", borderColor: "#0891B2" }
                      : { background: "white", color: "#6B7280", borderColor: "#E3E9F6" }}>
                    {n}
                  </button>
                ))}
              </div>
            </FieldRow>
          )}
          <FieldRow label="Remember Me Duration" hint="Extend session when user checks 'Stay signed in'">
            <select value={rememberMe} onChange={e => setRememberMe(Number(e.target.value))}
              className="text-sm border rounded-xl px-3 py-2 bg-white outline-none min-w-28"
              style={{ borderColor: "#E3E9F6" }}>
              {REMEMBER_ME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </FieldRow>
        </Card>

        {/* Security options */}
        <Card icon={ShieldCheck} title="Session Security" subtitle="Additional verification and audit options" color="#059669">
          <FieldRow label="Re-authenticate for Sensitive Actions" hint="Require password confirm before deleting records or changing security settings">
            <Toggle value={forceReauth} onChange={setForceReauth} />
          </FieldRow>
          <FieldRow label="Session Audit Logging" hint="Log every login, logout and session event to the audit trail">
            <Toggle value={sessionAudit} onChange={setSessionAudit} />
          </FieldRow>
          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl" style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
            <Info size={13} className="text-indigo-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-600">JWT tokens are rotated on each request. Sessions are invalidated immediately on password change or logout.</p>
          </div>
        </Card>
      </div>

      {/* Active sessions */}
      <Card icon={LogIn} title="Active Sessions" subtitle="Currently authenticated users — revoke any session immediately" color="#DC2626">
        <div className="space-y-2">
          {MOCK_SESSIONS.map(s => (
            <div key={s.id} className="flex items-center gap-3 p-3.5 rounded-xl border"
              style={{ borderColor: s.current ? "#A5B4FC" : "#E3E9F6", background: s.current ? "#EEF2FF" : "white" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: s.current ? "#4F46E5" : "#F1F5F9" }}>
                <Monitor size={15} style={{ color: s.current ? "white" : "#9CA3AF" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800">{s.user}</p>
                  {s.current && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">Current</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                  <span>{s.role}</span>
                  <span>·</span>
                  <span>{s.device}</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5"><MapPin size={10} />{s.location}</span>
                  <span>·</span>
                  <span>{s.ip}</span>
                  <span>·</span>
                  <span>{s.since}</span>
                </div>
              </div>
              {!s.current && (
                revokedIds.includes(s.id) ? (
                  <span className="px-2 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-600">Revoked</span>
                ) : (
                  <button onClick={() => setRevokedIds(p => [...p, s.id])}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors hover:bg-red-50"
                    style={{ borderColor: "#FECACA", color: "#DC2626" }}>
                    Revoke
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      </Card>

      <SaveBar onSave={handleSave} saving={saving} success={success} error={error} />
    </div>
  );
}

// ─── Tab 3: Access Restrictions ───────────────────────────────────────────────

function AccessTab() {
  const { data: policy }                          = useGetSecurityPolicyQuery();
  const [updatePolicy, { isLoading: saving }]     = useUpdateSecurityPolicyMutation();

  const [ipList,      setIpList]      = useState<string[]>([]);
  const [newIp,       setNewIp]       = useState("");
  const [ipEnabled,   setIpEnabled]   = useState(false);
  const [timeRestrict,setTimeRestrict]= useState(false);
  const [workStart,   setWorkStart]   = useState("08:00");
  const [workEnd,     setWorkEnd]     = useState("18:00");
  const [workDays,    setWorkDays]    = useState([1,2,3,4,5]);
  const [deviceTrust, setDeviceTrust] = useState(false);
  const [geoBlock,    setGeoBlock]    = useState(false);
  const [blockedCountries, setBlocked]= useState<string[]>([]);
  const [retention,   setRetention]   = useState(365);
  const [success,     setSuccess]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [toast,       setToast]       = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (policy) {
      if (policy.ip_whitelist?.length)   { setIpList(policy.ip_whitelist); setIpEnabled(true); }
      if (policy.audit_retention_days)    setRetention(policy.audit_retention_days);
    }
  }, [policy]);

  function addIp() {
    const ip = newIp.trim();
    if (!ip || ipList.includes(ip)) return;
    setIpList(p => [...p, ip]); setNewIp("");
  }

  function toggleDay(d: number) { setWorkDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]); }

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const COUNTRIES = ["China", "Russia", "North Korea", "Iran", "Belarus", "Venezuela"];
  function toggleCountry(c: string) { setBlocked(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]); }

  async function handleSave() {
    try {
      setError(null);
      await updatePolicy({ ip_whitelist: ipEnabled ? ipList : [], audit_retention_days: retention }).unwrap();
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch { setError("Failed to save restrictions."); }
  }

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} />}
      <div>
        <h2 className="text-lg font-bold text-slate-800">Access Restrictions</h2>
        <p className="text-xs text-slate-500 mt-0.5">Control where, when and how users can access the platform.</p>
      </div>

      {/* IP Whitelist */}
      <Card icon={Globe} title="IP Whitelist" subtitle="Only allow logins from approved IP addresses or ranges" color="#1D4ED8">
        <FieldRow label="Enable IP Whitelist" hint="Users outside listed IPs will be denied access">
          <Toggle value={ipEnabled} onChange={setIpEnabled} />
        </FieldRow>

        {ipEnabled && (
          <>
            <div className="flex gap-2 mt-4 mb-3">
              <div className="flex-1 relative">
                <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                <input value={newIp} onChange={e => setNewIp(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addIp()}
                  placeholder="e.g. 192.168.1.0/24 or 10.0.0.5"
                  className="w-full text-sm border rounded-xl pl-8 pr-3 py-2.5 outline-none"
                  style={{ borderColor: "#E3E9F6" }} />
              </div>
              <button onClick={addIp} disabled={!newIp.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 hover:opacity-90"
                style={{ background: "#1D4ED8" }}>
                <Plus size={14} />Add
              </button>
            </div>

            {ipList.length === 0 ? (
              <div className="py-6 text-center rounded-xl border-2 border-dashed" style={{ borderColor: "#BFDBFE" }}>
                <p className="text-xs text-slate-400">No IP addresses added — all IPs currently allowed</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {ipList.map(ip => (
                  <div key={ip} className="flex items-center justify-between px-3 py-2 rounded-xl border"
                    style={{ borderColor: "#BFDBFE", background: "#EFF6FF" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <code className="text-sm font-mono text-blue-800">{ip}</code>
                    </div>
                    <button onClick={() => setIpList(p => p.filter(x => x !== ip))} className="p-1 rounded hover:bg-red-50">
                      <X size={13} style={{ color: "#EF4444" }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-start gap-2 p-3 rounded-xl" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
              <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">
                Ensure your own IP is listed before saving — you may lock yourself out of the platform.
              </p>
            </div>
          </>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* Time-based access */}
        <Card icon={Clock} title="Time-Based Access" subtitle="Restrict logins to business hours only" color="#D97706">
          <FieldRow label="Enable Time Restrictions">
            <Toggle value={timeRestrict} onChange={setTimeRestrict} />
          </FieldRow>
          {timeRestrict && (
            <>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#9CA3AF" }}>Login From</p>
                  <input type="time" value={workStart} onChange={e => setWorkStart(e.target.value)}
                    className="w-full text-sm border rounded-xl px-3 py-2.5 outline-none" style={{ borderColor: "#E3E9F6" }} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#9CA3AF" }}>Login Until</p>
                  <input type="time" value={workEnd} onChange={e => setWorkEnd(e.target.value)}
                    className="w-full text-sm border rounded-xl px-3 py-2.5 outline-none" style={{ borderColor: "#E3E9F6" }} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>Allowed Days</p>
                <div className="flex gap-1.5">
                  {DAY_LABELS.map((d, i) => (
                    <button key={d} onClick={() => toggleDay(i)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all"
                      style={workDays.includes(i)
                        ? { background: "#D97706", color: "white", borderColor: "#D97706" }
                        : { background: "white", color: "#6B7280", borderColor: "#E3E9F6" }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Device trust */}
        <Card icon={Monitor} title="Device & Location" subtitle="Require trusted devices and block risky locations" color="#7C3AED">
          <FieldRow label="Require Device Registration" hint="Users must register their device on first login">
            <Toggle value={deviceTrust} onChange={setDeviceTrust} />
          </FieldRow>
          <FieldRow label="Geographic Blocking">
            <Toggle value={geoBlock} onChange={setGeoBlock} />
          </FieldRow>
          {geoBlock && (
            <div className="mt-3">
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>Block These Countries</p>
              <div className="flex flex-wrap gap-1.5">
                {COUNTRIES.map(c => (
                  <button key={c} onClick={() => toggleCountry(c)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all"
                    style={blockedCountries.includes(c)
                      ? { background: "#DC2626", color: "white", borderColor: "#DC2626" }
                      : { background: "white", color: "#6B7280", borderColor: "#E3E9F6" }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Data retention */}
      <Card icon={Database} title="Audit Log Retention" subtitle="How long security and access logs are retained before purge" color="#059669">
        <FieldRow label="Retention Period" hint="Logs older than this are automatically purged">
          <div className="flex flex-wrap gap-1.5">
            {RETENTION_OPTIONS.map(o => (
              <button key={o.value} onClick={() => setRetention(o.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
                style={retention === o.value
                  ? { background: "#059669", color: "white", borderColor: "#059669" }
                  : { background: "white", color: "#6B7280", borderColor: "#E3E9F6" }}>
                {o.label}
              </button>
            ))}
          </div>
        </FieldRow>
        <div className="mt-3 flex items-start gap-2 p-3 rounded-xl" style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
          <Info size={13} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-700">ISO 45001 and SOC 2 compliance typically require 1–2 years of audit log retention. Consult your compliance team before reducing this value.</p>
        </div>
      </Card>

      <SaveBar onSave={handleSave} saving={saving} success={success} error={error} />
    </div>
  );
}

// ─── Tab 4: Role Permissions ───────────────────────────────────────────────────

function RolesTab() {
  const { data: rawRoles = [],  isLoading: rolesLoading }  = useListRolesQuery();
  const { data: rawPerms = [],  isLoading: permsLoading }  = useListPermissionsQuery();
  const [createRole, { isLoading: creating }]              = useCreateRoleMutation();
  const [deleteRole]                                       = useDeleteRoleMutation();
  const [updatePerms]                                      = useUpdateRolePermissionsMutation();

  const roles = Array.isArray(rawRoles) ? rawRoles : [];
  const perms  = Array.isArray(rawPerms) ? rawPerms : [];

  // Group permissions by their group field
  const permGroups = perms.reduce<Record<string, typeof perms>>((acc, p) => {
    acc[p.group] = [...(acc[p.group] ?? []), p];
    return acc;
  }, {});

  // Fallback groups if API returns nothing
  const FALLBACK_GROUPS: Record<string, string[]> = {
    Core:        ["view_dashboard", "view_overview", "manage_notifications"],
    Safety:      ["view_incidents", "create_incident", "manage_incidents", "view_hazards", "manage_hazards", "view_near_miss"],
    Compliance:  ["view_audits", "create_audit", "manage_audits", "view_findings", "manage_capas"],
    Operations:  ["view_permits", "create_permit", "manage_permits", "view_shifts", "manage_shifts"],
    Insights:    ["view_kpis", "view_analytics", "export_reports", "view_reports"],
    Admin:       ["manage_users", "manage_roles", "manage_settings", "view_billing", "manage_billing"],
  };

  const displayGroups = Object.keys(permGroups).length > 0 ? permGroups : null;

  const [localPerms, setLocalPerms] = useState<Record<string, Set<string>>>({});
  const [modal,      setModal]      = useState(false);
  const [deleteId,   setDeleteId]   = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null);
  const [saving,     setSaving]     = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    const init: Record<string, Set<string>> = {};
    roles.forEach(r => { init[r.id] = new Set(r.permissions ?? []); });
    setLocalPerms(init);
  }, [roles]);

  function hasPermission(roleId: string, permId: string): boolean {
    return localPerms[roleId]?.has(permId) ?? false;
  }

  function togglePermission(roleId: string, permId: string) {
    setLocalPerms(prev => {
      const cur = new Set(prev[roleId] ?? []);
      cur.has(permId) ? cur.delete(permId) : cur.add(permId);
      return { ...prev, [roleId]: cur };
    });
  }

  function toggleGroup(roleId: string, groupPerms: string[]) {
    const cur   = localPerms[roleId] ?? new Set<string>();
    const allOn = groupPerms.every(p => cur.has(p));
    setLocalPerms(prev => {
      const next = new Set(prev[roleId] ?? []);
      groupPerms.forEach(p => allOn ? next.delete(p) : next.add(p));
      return { ...prev, [roleId]: next };
    });
  }

  async function saveRolePerms(roleId: string) {
    setSaving(roleId);
    try {
      await updatePerms({ roleId, permissions: [...(localPerms[roleId] ?? [])] }).unwrap();
      showToast("Permissions saved.");
    } catch { showToast("Failed to save.", false); }
    setSaving(null);
  }

  async function handleCreateRole() {
    if (!newRoleName.trim()) return;
    try {
      await createRole({ name: newRoleName.trim(), permissions: [] }).unwrap();
      showToast("Role created."); setModal(false); setNewRoleName("");
    } catch { showToast("Failed to create role.", false); }
  }

  async function handleDeleteRole(id: string) {
    try { await deleteRole(id).unwrap(); showToast("Role deleted.", false); }
    catch { showToast("Failed to delete role.", false); }
    setDeleteId(null);
  }

  const ROLE_META: Record<string, { color: string; icon: typeof Shield }> = {
    admin:       { color: "#7C3AED", icon: Shield    },
    hse_manager: { color: "#DC2626", icon: ShieldCheck},
    supervisor:  { color: "#D97706", icon: UserCheck  },
    worker:      { color: "#059669", icon: Users      },
    auditor:     { color: "#0891B2", icon: ShieldAlert},
  };

  function roleColor(name: string): string {
    const key = name.toLowerCase().replace(/\s+/g, "_");
    return ROLE_META[key]?.color ?? "#6B7280";
  }

  if (rolesLoading || permsLoading) {
    return <div className="py-16 text-center"><Loader2 size={24} className="mx-auto animate-spin text-blue-400" /></div>;
  }

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} />}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Role Permissions</h2>
          <p className="text-xs text-slate-500 mt-0.5">Define what each role can see and do across every module.</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg, #1E3A5F, #1D4ED8)" }}>
          <Plus size={14} />New Role
        </button>
      </div>

      {/* Roles list */}
      <div className="grid grid-cols-3 gap-3 mb-2">
        {roles.map(role => {
          const color   = roleColor(role.name);
          const permCnt = (localPerms[role.id]?.size ?? 0);
          return (
            <div key={role.id} className="rounded-xl border p-3.5 flex items-center gap-2.5 group hover:shadow-sm transition-shadow"
              style={{ borderColor: "#E3E9F6", background: "white" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-extrabold"
                style={{ background: color }}>
                {role.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{role.name}</p>
                <p className="text-[10px] text-slate-400">{permCnt} permission{permCnt !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => setDeleteId(role.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 size={12} style={{ color: "#EF4444" }} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Permission matrix */}
      {roles.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
          <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
            <div className="flex items-center gap-2">
              <Lock size={14} style={{ color: "#1D4ED8" }} />
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Permission Matrix</p>
            </div>
            <p className="text-xs text-slate-400">Click group header to toggle all · Click cell to toggle one</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: `${200 + roles.length * 110}px` }}>
              <thead>
                <tr style={{ background: "#F8F9FF" }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 w-48 sticky left-0" style={{ background: "#F8F9FF" }}>Permission</th>
                  {roles.map(r => {
                    const color = roleColor(r.name);
                    return (
                      <th key={r.id} className="px-3 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-extrabold"
                            style={{ background: color }}>
                            {r.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[10px] font-bold truncate max-w-20" style={{ color }}>{r.name}</span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="px-3 py-3 w-20" />
                </tr>
              </thead>
              <tbody>
                {Object.entries(displayGroups ?? FALLBACK_GROUPS).map(([group, groupPermsRaw]) => {
                  const groupPermIds = displayGroups
                    ? (groupPermsRaw as typeof perms).map(p => p.id)
                    : (groupPermsRaw as string[]);
                  const groupMeta = PERM_GROUP_META[group] ?? { color: "#6B7280", bg: "#F3F4F6" };

                  return [
                    // Group header row
                    <tr key={`${group}-header`} style={{ background: groupMeta.bg }}>
                      <td className="px-4 py-2.5 sticky left-0" style={{ background: groupMeta.bg }}>
                        <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: groupMeta.color }}>{group}</span>
                      </td>
                      {roles.map(r => {
                        const allOn = groupPermIds.every(p => hasPermission(r.id, p));
                        return (
                          <td key={r.id} className="px-3 py-2.5 text-center">
                            <button onClick={() => toggleGroup(r.id, groupPermIds)}
                              className="w-6 h-6 rounded flex items-center justify-center mx-auto transition-colors"
                              style={allOn ? { background: groupMeta.color } : { background: "white", border: `1.5px solid ${groupMeta.color}40` }}>
                              {allOn && <Check size={12} className="text-white" />}
                            </button>
                          </td>
                        );
                      })}
                      <td />
                    </tr>,
                    // Individual permission rows
                    ...(displayGroups
                      ? (groupPermsRaw as typeof perms).map(p => (
                          <tr key={p.id} className="border-t hover:bg-slate-50 transition-colors" style={{ borderColor: "#F9FAFB" }}>
                            <td className="px-4 py-2 sticky left-0 bg-white">
                              <div className="pl-3">
                                <p className="text-xs font-semibold text-slate-700">{p.operation}</p>
                                {p.description && <p className="text-[10px] text-slate-400">{p.description}</p>}
                              </div>
                            </td>
                            {roles.map(r => (
                              <td key={r.id} className="px-3 py-2 text-center">
                                <button onClick={() => togglePermission(r.id, p.id)}
                                  className="w-5 h-5 rounded flex items-center justify-center mx-auto transition-colors"
                                  style={hasPermission(r.id, p.id)
                                    ? { background: groupMeta.color }
                                    : { background: "white", border: "1.5px solid #E3E9F6" }}>
                                  {hasPermission(r.id, p.id) && <Check size={10} className="text-white" />}
                                </button>
                              </td>
                            ))}
                            <td />
                          </tr>
                        ))
                      : (groupPermsRaw as string[]).map(permId => (
                          <tr key={permId} className="border-t hover:bg-slate-50 transition-colors" style={{ borderColor: "#F9FAFB" }}>
                            <td className="px-4 py-2 sticky left-0 bg-white">
                              <p className="pl-3 text-xs font-semibold text-slate-600 capitalize">{permId.replace(/_/g, " ")}</p>
                            </td>
                            {roles.map(r => (
                              <td key={r.id} className="px-3 py-2 text-center">
                                <button onClick={() => togglePermission(r.id, permId)}
                                  className="w-5 h-5 rounded flex items-center justify-center mx-auto transition-colors"
                                  style={hasPermission(r.id, permId)
                                    ? { background: groupMeta.color }
                                    : { background: "white", border: "1.5px solid #E3E9F6" }}>
                                  {hasPermission(r.id, permId) && <Check size={10} className="text-white" />}
                                </button>
                              </td>
                            ))}
                            <td />
                          </tr>
                        ))
                    ),
                  ];
                })}
              </tbody>
            </table>
          </div>

          {/* Save per-role footer */}
          <div className="px-5 py-4 border-t flex flex-wrap gap-2" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
            {roles.map(r => (
              <button key={r.id} onClick={() => saveRolePerms(r.id)} disabled={saving === r.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border disabled:opacity-50 hover:opacity-90 transition-opacity"
                style={{ background: "white", borderColor: roleColor(r.name), color: roleColor(r.name) }}>
                {saving === r.id ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                Save {r.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {roles.length === 0 && (
        <div className="py-16 text-center rounded-2xl border-2 border-dashed" style={{ borderColor: "#E3E9F6" }}>
          <Shield size={32} className="mx-auto mb-3" style={{ color: "#D1D5DB" }} />
          <p className="text-sm font-semibold text-slate-400">No roles defined</p>
          <p className="text-xs text-slate-300 mt-1">Create your first role above</p>
        </div>
      )}

      {/* Create role modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl border shadow-xl w-full max-w-sm mx-4" style={{ borderColor: "#E3E9F6" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
              <h3 className="text-base font-bold text-slate-800">New Role</h3>
              <button onClick={() => setModal(false)} className="p-1 rounded-lg hover:bg-slate-100"><X size={16} style={{ color: "#6B7280" }} /></button>
            </div>
            <div className="px-6 py-5">
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>Role Name</label>
              <input value={newRoleName} onChange={e => setNewRoleName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCreateRole()}
                placeholder="e.g. Site Inspector"
                className="w-full text-sm border rounded-xl px-3 py-2.5 outline-none" style={{ borderColor: "#E3E9F6" }} />
            </div>
            <div className="px-6 py-4 border-t flex gap-3" style={{ borderColor: "#F1F5F9" }}>
              <button onClick={handleCreateRole} disabled={creating || !newRoleName.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #1E3A5F, #1D4ED8)" }}>
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}Create Role
              </button>
              <button onClick={() => setModal(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium border text-slate-500" style={{ borderColor: "#E3E9F6" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl border p-6 max-w-sm w-full mx-4 shadow-xl" style={{ borderColor: "#E3E9F6" }}>
            <h3 className="text-base font-bold text-slate-800 mb-2">Delete Role?</h3>
            <p className="text-sm text-slate-500 mb-5">Users assigned this role will lose associated permissions. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDeleteRole(deleteId)} className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: "#EF4444" }}>Delete</button>
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
  { id: "password",   label: "Password Policies",  icon: Key,     color: "#1D4ED8" },
  { id: "session",    label: "Session Timeout",     icon: Clock,   color: "#7C3AED" },
  { id: "access",     label: "Access Restrictions", icon: Globe,   color: "#DC2626" },
  { id: "roles",      label: "Role Permissions",    icon: Shield,  color: "#059669" },
] as const;

type TabId = typeof TABS[number]["id"];

export function SecuritySettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("password");
  const { data: policy }          = useGetSecurityPolicyQuery();
  const { data: rawRoles = [] }   = useListRolesQuery();
  const roles = Array.isArray(rawRoles) ? rawRoles : [];
  const activeTabMeta = TABS.find(t => t.id === activeTab)!;

  const bannerStats = [
    { label: "MFA",             value: policy?.mfa_required ? "Enabled" : "Disabled" },
    { label: "Session Timeout", value: policy?.session_timeout_minutes ? `${policy.session_timeout_minutes}min` : "60min" },
    { label: "IP Whitelist",    value: policy?.ip_whitelist?.length ? `${policy.ip_whitelist.length} IPs` : "Open" },
    { label: "Roles",           value: roles.length },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>

      {/* ── Banner ── */}
      <div className="relative overflow-hidden px-6 pt-7 pb-6"
        style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #1E1B4B 100%)" }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 20% 60%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 85% 25%, #93C5FD 0%, transparent 40%)" }} />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldCheck size={18} className="text-blue-300" />
              <span className="text-blue-200 text-xs font-bold tracking-widest uppercase">Administration</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Security Settings</h1>
            <p className="text-blue-200/80 text-sm mt-1">Configure password policies, session controls, access restrictions and role permissions.</p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {bannerStats.map(s => (
              <div key={s.label} className="px-3 py-2 rounded-xl text-center"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div className="text-sm font-extrabold text-white">{s.value}</div>
                <div className="text-[10px] text-blue-300/80 mt-0.5">{s.label}</div>
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
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Security</p>
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

          {/* Security score */}
          <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: "#E3E9F6", background: "white" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>Security Score</p>
            {(() => {
              const checks = [
                { label: "Password Policy",  ok: true },
                { label: "MFA Enabled",      ok: policy?.mfa_required ?? false },
                { label: "Session Timeout",  ok: (policy?.session_timeout_minutes ?? 0) > 0 && (policy?.session_timeout_minutes ?? 0) <= 240 },
                { label: "IP Whitelist",     ok: (policy?.ip_whitelist?.length ?? 0) > 0 },
                { label: "Roles Defined",    ok: roles.length > 0 },
              ];
              const score = Math.round((checks.filter(c => c.ok).length / checks.length) * 100);
              const scoreColor = score >= 80 ? "#059669" : score >= 60 ? "#D97706" : "#DC2626";
              return (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-3xl font-extrabold" style={{ color: scoreColor }}>{score}%</div>
                    <div className="text-xs text-slate-400">{score >= 80 ? "Strong" : score >= 60 ? "Moderate" : "Weak"}</div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: "#E5E7EB" }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, background: scoreColor }} />
                  </div>
                  <div className="space-y-1.5">
                    {checks.map(c => (
                      <div key={c.label} className="flex items-center gap-1.5 text-xs">
                        {c.ok ? <CheckCircle2 size={11} style={{ color: "#059669" }} /> : <AlertCircle size={11} style={{ color: "#DC2626" }} />}
                        <span style={{ color: c.ok ? "#374151" : "#6B7280" }}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>

          <div className="mt-4 rounded-xl p-3 flex items-start gap-2" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
            <Info size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-700">All security changes are logged to the audit trail with actor, timestamp and previous value.</p>
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
                  {activeTab === "password" && "Complexity, expiry, history, lockout and MFA requirements."}
                  {activeTab === "session"  && "Timeout durations, concurrent sessions and active session management."}
                  {activeTab === "access"   && "IP whitelist, time restrictions, device trust and geo-blocking."}
                  {activeTab === "roles"    && "Create roles and define granular permissions per module."}
                </p>
              </div>
            </div>

            {activeTab === "password" && <PasswordTab />}
            {activeTab === "session"  && <SessionTab />}
            {activeTab === "access"   && <AccessTab />}
            {activeTab === "roles"    && <RolesTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
