import { useState, useEffect, useRef } from "react";
import {
  Building2, Palette, Globe, Clock, LayoutGrid,
  Save, Plus, Trash2, Upload, CheckCircle2, AlertCircle,
  Loader2, Mail, Phone, MapPin, Factory, Hash,
  Users, Image as ImageIcon, Monitor, Languages,
  Calendar, DollarSign, RefreshCw, Shield, Info,
  ChevronRight, Eye,
} from "lucide-react";
import {
  useGetOrgAdminOverviewQuery,
  useSaveOrgSetupStep1Mutation,
  type Step1Data,
} from "@/features/org-setup/api/orgSetupApi";
import {
  useListOrganisationNodesQuery,
  useCreateOrganisationNodeMutation,
  useDeleteOrganisationNodeMutation,
} from "@/features/admin/api/foundationApi";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMEZONES = [
  { value: "UTC",                label: "(UTC+00:00) Coordinated Universal Time" },
  { value: "Europe/London",      label: "(UTC+00:00) London" },
  { value: "Europe/Paris",       label: "(UTC+01:00) Paris, Berlin, Rome" },
  { value: "Europe/Istanbul",    label: "(UTC+03:00) Istanbul" },
  { value: "Asia/Dubai",         label: "(UTC+04:00) Abu Dhabi, Dubai" },
  { value: "Asia/Karachi",       label: "(UTC+05:00) Karachi, Islamabad" },
  { value: "Asia/Kolkata",       label: "(UTC+05:30) Chennai, Mumbai, New Delhi" },
  { value: "Asia/Dhaka",         label: "(UTC+06:00) Dhaka" },
  { value: "Asia/Bangkok",       label: "(UTC+07:00) Bangkok, Jakarta" },
  { value: "Asia/Singapore",     label: "(UTC+08:00) Singapore, Kuala Lumpur" },
  { value: "Asia/Tokyo",         label: "(UTC+09:00) Tokyo, Seoul" },
  { value: "Australia/Sydney",   label: "(UTC+10:00) Sydney, Melbourne" },
  { value: "Pacific/Auckland",   label: "(UTC+12:00) Auckland" },
  { value: "America/New_York",   label: "(UTC-05:00) New York, Toronto" },
  { value: "America/Chicago",    label: "(UTC-06:00) Chicago, Dallas" },
  { value: "America/Denver",     label: "(UTC-07:00) Denver, Phoenix" },
  { value: "America/Los_Angeles",label: "(UTC-08:00) Los Angeles, Vancouver" },
  { value: "America/Sao_Paulo",  label: "(UTC-03:00) São Paulo, Rio de Janeiro" },
];

const LANGUAGES = [
  { value: "en-gb",  label: "English (United Kingdom)", flag: "🇬🇧" },
  { value: "en-us",  label: "English (United States)",  flag: "🇺🇸" },
  { value: "ar",     label: "Arabic (العربية)",          flag: "🇸🇦" },
  { value: "zh",     label: "Chinese (中文)",            flag: "🇨🇳" },
  { value: "fr",     label: "French (Français)",        flag: "🇫🇷" },
  { value: "de",     label: "German (Deutsch)",         flag: "🇩🇪" },
  { value: "hi",     label: "Hindi (हिन्दी)",              flag: "🇮🇳" },
  { value: "id",     label: "Indonesian (Bahasa)",      flag: "🇮🇩" },
  { value: "ja",     label: "Japanese (日本語)",          flag: "🇯🇵" },
  { value: "ko",     label: "Korean (한국어)",            flag: "🇰🇷" },
  { value: "ms",     label: "Malay (Bahasa Melayu)",    flag: "🇲🇾" },
  { value: "pt",     label: "Portuguese (Português)",  flag: "🇧🇷" },
  { value: "es",     label: "Spanish (Español)",        flag: "🇪🇸" },
  { value: "tr",     label: "Turkish (Türkçe)",         flag: "🇹🇷" },
  { value: "ur",     label: "Urdu (اردو)",               flag: "🇵🇰" },
];

const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY  (e.g. 29/05/2026)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY  (e.g. 05/29/2026)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD  (e.g. 2026-05-29)" },
  { value: "DD MMM YYYY",label: "DD MMM YYYY (e.g. 29 May 2026)" },
];

const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar ($)" },
  { value: "GBP", label: "GBP — British Pound (£)" },
  { value: "EUR", label: "EUR — Euro (€)" },
  { value: "AED", label: "AED — UAE Dirham (د.إ)" },
  { value: "INR", label: "INR — Indian Rupee (₹)" },
  { value: "SGD", label: "SGD — Singapore Dollar (S$)" },
  { value: "MYR", label: "MYR — Malaysian Ringgit (RM)" },
  { value: "AUD", label: "AUD — Australian Dollar (A$)" },
  { value: "SAR", label: "SAR — Saudi Riyal (﷼)" },
  { value: "PKR", label: "PKR — Pakistani Rupee (₨)" },
];

const INDUSTRIES = [
  "Oil & Gas", "Construction", "Mining", "Manufacturing",
  "Chemical & Petrochemical", "Energy & Utilities", "Transportation & Logistics",
  "Facility Management", "Healthcare", "Ports & Maritime",
  "Food & Beverage", "Aerospace", "Telecoms", "Other",
];

const BU_COLORS = [
  "#4F46E5","#0891B2","#059669","#D97706",
  "#DC2626","#7C3AED","#DB2777","#2563EB",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] mt-1.5" style={{ color: "#9CA3AF" }}>{hint}</p>}
    </div>
  );
}

function InputField({
  value, onChange, type = "text", placeholder, icon: Icon, disabled,
}: {
  value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
  icon?: React.ElementType; disabled?: boolean;
}) {
  return (
    <div className="relative">
      {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full text-sm border rounded-xl py-2.5 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          borderColor: "#E3E9F6", color: "#111827",
          paddingLeft: Icon ? "2.25rem" : "0.875rem",
          paddingRight: "0.875rem",
        }}
        onFocus={e => { e.currentTarget.style.borderColor = "#6366F1"; e.currentTarget.style.boxShadow = "0 0 0 3px #EEF2FF"; }}
        onBlur={e  => { e.currentTarget.style.borderColor = "#E3E9F6"; e.currentTarget.style.boxShadow = "none"; }}
      />
    </div>
  );
}

function SelectField({
  value, onChange, children,
}: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full text-sm border rounded-xl px-3 py-2.5 bg-white outline-none appearance-none"
      style={{ borderColor: "#E3E9F6", color: "#111827" }}
      onFocus={e => { e.currentTarget.style.borderColor = "#6366F1"; e.currentTarget.style.boxShadow = "0 0 0 3px #EEF2FF"; }}
      onBlur={e  => { e.currentTarget.style.borderColor = "#E3E9F6"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {children}
    </select>
  );
}

function SaveBar({
  onSave, saving, success, error,
}: { onSave: () => void; saving: boolean; success: boolean; error: string | null }) {
  return (
    <div className="flex items-center gap-4 pt-5 mt-5 border-t" style={{ borderColor: "#F1F5F9" }}>
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-60 transition-opacity hover:opacity-90"
        style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)" }}
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {saving ? "Saving…" : "Save Changes"}
      </button>
      {success && (
        <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
          <CheckCircle2 size={15} />Saved successfully
        </div>
      )}
      {error && (
        <div className="flex items-center gap-1.5 text-sm font-semibold text-red-600">
          <AlertCircle size={15} />{error}
        </div>
      )}
    </div>
  );
}

// ─── Section: Organization Details ────────────────────────────────────────────

function DetailsSection({
  form, setForm, onSave, saving, success, error,
}: {
  form: Partial<Step1Data>;
  setForm: (f: Partial<Step1Data>) => void;
  onSave: () => void;
  saving: boolean;
  success: boolean;
  error: string | null;
}) {
  const set = (k: keyof Step1Data) => (v: string | number) => setForm({ ...form, [k]: v });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Organization Identity</h2>
        <p className="text-xs text-slate-500 mt-0.5">Core information displayed across reports, notifications and documents.</p>
      </div>

      {/* Identity */}
      <div className="rounded-2xl border p-5 space-y-4" style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }}>
        <div className="flex items-center gap-2 mb-1">
          <Building2 size={15} style={{ color: "#4F46E5" }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#4F46E5" }}>Identity</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Organization Name">
              <InputField value={form.organizationName ?? ""} onChange={set("organizationName")}
                placeholder="e.g. Acme HSE Solutions Ltd" icon={Building2} />
            </Field>
          </div>
          <Field label="Industry Type">
            <SelectField value={form.industryType ?? ""} onChange={set("industryType")}>
              <option value="">Select industry…</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </SelectField>
          </Field>
          <Field label="Registration / License No.">
            <InputField value={(form as any).registrationNumber ?? ""} onChange={() => {}}
              placeholder="Company registration number" icon={Hash} />
          </Field>
        </div>
      </div>

      {/* Contact */}
      <div className="rounded-2xl border p-5 space-y-4" style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }}>
        <div className="flex items-center gap-2 mb-1">
          <Mail size={15} style={{ color: "#0891B2" }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#0891B2" }}>Contact Information</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Official Email">
            <InputField value={form.officialEmail ?? ""} onChange={set("officialEmail")}
              type="email" placeholder="admin@company.com" icon={Mail} />
          </Field>
          <Field label="Contact Number">
            <InputField value={form.contactNumber ?? ""} onChange={set("contactNumber")}
              placeholder="+1 (555) 000-0000" icon={Phone} />
          </Field>
          <div className="col-span-2">
            <Field label="Headquarters Address">
              <textarea
                rows={2}
                value={form.headquartersAddress ?? ""}
                onChange={e => set("headquartersAddress")(e.target.value)}
                placeholder="Street address, city, state/province, postcode"
                className="w-full text-sm border rounded-xl px-3 py-2.5 outline-none resize-none"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                onFocus={e => { e.currentTarget.style.borderColor = "#6366F1"; e.currentTarget.style.boxShadow = "0 0 0 3px #EEF2FF"; }}
                onBlur={e  => { e.currentTarget.style.borderColor = "#E3E9F6"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </Field>
          </div>
          <Field label="Country">
            <InputField value={form.country ?? ""} onChange={set("country")}
              placeholder="e.g. United Kingdom" icon={MapPin} />
          </Field>
        </div>
      </div>

      {/* Scale */}
      <div className="rounded-2xl border p-5 space-y-4" style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }}>
        <div className="flex items-center gap-2 mb-1">
          <Factory size={15} style={{ color: "#059669" }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#059669" }}>Scale & Structure</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Total Employees" hint="Approximate headcount">
            <InputField value={String(form.employeeCount ?? "")} onChange={v => set("employeeCount")(Number(v))}
              type="number" placeholder="e.g. 500" icon={Users} />
          </Field>
          <Field label="Number of Sites" hint="Offices, plants or depots">
            <InputField value={String(form.numberOfSites ?? "")} onChange={v => set("numberOfSites")(Number(v))}
              type="number" placeholder="e.g. 4" icon={MapPin} />
          </Field>
          <Field label="Data Entry Method">
            <SelectField value={form.dataEntryOption ?? "manual"} onChange={v => set("dataEntryOption")(v as any)}>
              <option value="manual">Manual Entry</option>
              <option value="excel">Excel / CSV Upload</option>
              <option value="api">API Integration</option>
            </SelectField>
          </Field>
        </div>
      </div>

      <SaveBar onSave={onSave} saving={saving} success={success} error={error} />
    </div>
  );
}

// ─── Section: Branding ────────────────────────────────────────────────────────

function BrandingSection() {
  const [primaryColor, setPrimaryColor]   = useState("#4F46E5");
  const [accentColor,  setAccentColor]    = useState("#0891B2");
  const [appName,      setAppName]        = useState("HSE Intelligence");
  const [logoPreview,  setLogoPreview]    = useState<string | null>(null);
  const [faviconPreview, setFavPreview]   = useState<string | null>(null);
  const [darkMode,     setDarkMode]       = useState(false);
  const [saved,        setSaved]          = useState(false);
  const logoRef    = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
  }

  function handleFaviconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFavPreview(url);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Branding & Identity</h2>
        <p className="text-xs text-slate-500 mt-0.5">Customize how your organization appears across the platform.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left: config */}
        <div className="space-y-5">

          {/* Logo */}
          <div className="rounded-2xl border p-5" style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }}>
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon size={15} style={{ color: "#4F46E5" }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#4F46E5" }}>Logo & Favicon</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Logo upload */}
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Organization Logo</p>
                <div
                  onClick={() => logoRef.current?.click()}
                  className="relative w-full h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors"
                  style={{ borderColor: logoPreview ? "#6366F1" : "#CBD5E1" }}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="max-h-20 max-w-full object-contain rounded-lg" />
                  ) : (
                    <>
                      <Upload size={20} className="mb-1" style={{ color: "#94A3B8" }} />
                      <span className="text-[11px] font-semibold text-slate-400">Click to upload</span>
                      <span className="text-[10px] text-slate-300 mt-0.5">PNG, SVG · max 2 MB</span>
                    </>
                  )}
                  <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </div>
                {logoPreview && (
                  <button onClick={() => setLogoPreview(null)} className="text-[11px] text-red-500 mt-1 hover:underline">
                    Remove
                  </button>
                )}
              </div>

              {/* Favicon upload */}
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Favicon</p>
                <div
                  onClick={() => faviconRef.current?.click()}
                  className="relative w-full h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-sky-50 transition-colors"
                  style={{ borderColor: faviconPreview ? "#0891B2" : "#CBD5E1" }}>
                  {faviconPreview ? (
                    <img src={faviconPreview} alt="Favicon" className="w-16 h-16 object-contain rounded" />
                  ) : (
                    <>
                      <Monitor size={20} className="mb-1" style={{ color: "#94A3B8" }} />
                      <span className="text-[11px] font-semibold text-slate-400">Browser icon</span>
                      <span className="text-[10px] text-slate-300 mt-0.5">ICO, PNG 32×32</span>
                    </>
                  )}
                  <input ref={faviconRef} type="file" accept="image/*" className="hidden" onChange={handleFaviconChange} />
                </div>
                {faviconPreview && (
                  <button onClick={() => setFavPreview(null)} className="text-[11px] text-red-500 mt-1 hover:underline">
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="rounded-2xl border p-5" style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }}>
            <div className="flex items-center gap-2 mb-4">
              <Palette size={15} style={{ color: "#7C3AED" }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#7C3AED" }}>Brand Colors</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Primary Color</label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                      className="w-12 h-10 rounded-xl border cursor-pointer p-0.5"
                      style={{ borderColor: "#E3E9F6" }} />
                  </div>
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">#</span>
                    <input type="text" value={primaryColor.replace("#", "")}
                      onChange={e => { if (/^[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setPrimaryColor(`#${e.target.value}`); }}
                      className="w-full text-sm border rounded-xl pl-7 pr-3 py-2.5 font-mono outline-none"
                      style={{ borderColor: "#E3E9F6" }} />
                  </div>
                  <div className="w-10 h-10 rounded-xl border flex-shrink-0" style={{ background: primaryColor, borderColor: "#E5E7EB" }} />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">Used for buttons, active nav items, and highlights.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                    className="w-12 h-10 rounded-xl border cursor-pointer p-0.5"
                    style={{ borderColor: "#E3E9F6" }} />
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">#</span>
                    <input type="text" value={accentColor.replace("#", "")}
                      onChange={e => { if (/^[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setAccentColor(`#${e.target.value}`); }}
                      className="w-full text-sm border rounded-xl pl-7 pr-3 py-2.5 font-mono outline-none"
                      style={{ borderColor: "#E3E9F6" }} />
                  </div>
                  <div className="w-10 h-10 rounded-xl border flex-shrink-0" style={{ background: accentColor, borderColor: "#E5E7EB" }} />
                </div>
              </div>
            </div>
          </div>

          {/* App settings */}
          <div className="rounded-2xl border p-5" style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }}>
            <div className="flex items-center gap-2 mb-4">
              <Monitor size={15} style={{ color: "#0891B2" }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#0891B2" }}>App Display</span>
            </div>
            <div className="space-y-4">
              <Field label="Application Display Name" hint="Shown in browser tab and header.">
                <InputField value={appName} onChange={setAppName} placeholder="Your platform name" icon={Shield} />
              </Field>
              <div className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: "#E3E9F6" }}>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Dark Mode</p>
                  <p className="text-xs text-slate-400">Enable dark theme as default for all users</p>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
                  style={{ background: darkMode ? "#4F46E5" : "#E5E7EB" }}>
                  <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
                    style={{ transform: darkMode ? "translateX(20px)" : "translateX(2px)" }} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: live preview */}
        <div className="sticky top-6 self-start">
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
            <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "#E3E9F6", background: "#F8F9FF" }}>
              <Eye size={13} style={{ color: "#6B7280" }} />
              <span className="text-xs font-bold text-slate-600">Live Preview</span>
            </div>
            <div className="p-5" style={{ background: "#F5F7FF" }}>
              {/* Simulated sidebar */}
              <div className="flex gap-3">
                <div className="w-40 rounded-xl p-3 flex flex-col gap-2" style={{ background: "white", border: "1px solid #E3E9F6" }}>
                  <div className="flex items-center gap-2 mb-2">
                    {logoPreview
                      ? <img src={logoPreview} alt="logo" className="w-6 h-6 object-contain rounded" />
                      : <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: primaryColor }}>
                          <Shield size={12} className="text-white" />
                        </div>
                    }
                    <span className="text-[10px] font-bold truncate" style={{ color: "#111827" }}>{appName}</span>
                  </div>
                  {["Dashboard","Incidents","Reports","Compliance"].map((item, i) => (
                    <div key={item} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-semibold"
                      style={i === 0
                        ? { background: primaryColor, color: "white" }
                        : { color: "#6B7280" }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: i === 0 ? "white" : "#CBD5E1" }} />
                      {item}
                    </div>
                  ))}
                </div>
                {/* Simulated content */}
                <div className="flex-1">
                  <div className="rounded-xl p-3 mb-2 text-white text-[10px] font-bold"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}>
                    KPI Dashboard
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {["Safety Score","Compliance","Open Incidents","Near Misses"].map((s, i) => (
                      <div key={s} className="rounded-lg p-2 text-center" style={{ background: "white", border: "1px solid #E3E9F6" }}>
                        <div className="text-sm font-extrabold" style={{ color: i % 2 === 0 ? primaryColor : accentColor }}>
                          {["94%","88%","12","3"][i]}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">{s}</div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-2 py-1.5 rounded-lg text-white text-[10px] font-bold"
                    style={{ background: primaryColor }}>
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl p-3 flex items-start gap-2" style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
            <Info size={13} className="text-indigo-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-indigo-600">
              Branding changes apply to all users in your organization. Logo is used in PDFs and email notifications.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-3 pt-4 border-t" style={{ borderColor: "#F1F5F9" }}>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)" }}>
              <Save size={15} />Apply Branding
            </button>
            {saved && (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                <CheckCircle2 size={15} />Branding applied
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Business Units ───────────────────────────────────────────────────

function BusinessUnitsSection() {
  const { data: businessUnits = [], isLoading: buLoading } = useListOrganisationNodesQuery({ type: "business_unit" });
  const [createBU, { isLoading: isCreatingBU }] = useCreateOrganisationNodeMutation();
  const [deleteBU] = useDeleteOrganisationNodeMutation();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!newName.trim()) return;
    try {
      setError(null);
      await createBU({ name: newName.trim(), node_type: "business_unit" }).unwrap();
      setNewName("");
    } catch {
      setError("Failed to create business unit. Please try again.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Business Units</h2>
        <p className="text-xs text-slate-500 mt-0.5">High-level organizational segments used for reporting boundaries and data security.</p>
      </div>

      {/* Add form */}
      <div className="rounded-2xl border p-5" style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }}>
        <div className="flex items-center gap-2 mb-4">
          <Plus size={15} style={{ color: "#4F46E5" }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#4F46E5" }}>Add Business Unit</span>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <LayoutGrid size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              placeholder="e.g. North Region Operations, Offshore Division…"
              className="w-full text-sm border rounded-xl pl-8 pr-4 py-2.5 outline-none"
              style={{ borderColor: "#E3E9F6" }}
              onFocus={e => { e.currentTarget.style.borderColor = "#6366F1"; e.currentTarget.style.boxShadow = "0 0 0 3px #EEF2FF"; }}
              onBlur={e  => { e.currentTarget.style.borderColor = "#E3E9F6"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={isCreatingBU || !newName.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)" }}>
            {isCreatingBU ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add Unit
          </button>
        </div>
        {error && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle size={13} />{error}
          </div>
        )}
      </div>

      {/* List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Business Units
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">{businessUnits.length}</span>
          </p>
        </div>

        {buLoading ? (
          <div className="py-12 text-center">
            <Loader2 size={24} className="mx-auto animate-spin text-indigo-400" />
          </div>
        ) : businessUnits.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border-2 border-dashed" style={{ borderColor: "#E3E9F6" }}>
            <LayoutGrid size={32} className="mx-auto mb-3" style={{ color: "#CBD5E1" }} />
            <p className="text-sm font-semibold text-slate-400">No business units yet</p>
            <p className="text-xs text-slate-300 mt-1">Add your first unit above to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {businessUnits.map((bu, idx) => {
              const color = BU_COLORS[idx % BU_COLORS.length];
              return (
                <div key={bu.id} className="flex items-center gap-3 p-4 rounded-xl border group hover:shadow-sm transition-shadow"
                  style={{ borderColor: "#E3E9F6", background: "white" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0"
                    style={{ background: color }}>
                    {bu.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{bu.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5 capitalize">{bu.node_type.replace("_", " ")}</p>
                  </div>
                  <button
                    onClick={() => deleteBU(bu.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl p-4 flex items-start gap-2" style={{ background: "#F0F9FF", border: "1px solid #BAE6FD" }}>
        <Info size={13} className="text-sky-500 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-sky-600">
          Business units group sites, teams and data for scoped reporting and role-based access. Changes apply immediately.
        </p>
      </div>
    </div>
  );
}

// ─── Section: Timezone ─────────────────────────────────────────────────────────

function TimezoneSection({
  form, setForm, onSave, saving, success, error,
}: {
  form: Partial<Step1Data>;
  setForm: (f: Partial<Step1Data>) => void;
  onSave: () => void;
  saving: boolean;
  success: boolean;
  error: string | null;
}) {
  const [nowStr, setNowStr] = useState("");

  useEffect(() => {
    const tz = form.timezone || "UTC";
    function tick() {
      try {
        setNowStr(new Date().toLocaleString("en-GB", { timeZone: tz, weekday: "short", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      } catch {
        setNowStr(new Date().toLocaleString());
      }
    }
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [form.timezone]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Timezone & Date Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">All reports, logs and scheduled tasks use these settings.</p>
      </div>

      {/* Live clock */}
      <div className="rounded-2xl p-5 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1E1B4B, #3730A3)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #A5B4FC 0%, transparent 50%)" }} />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300 mb-1">Current Time</p>
            <p className="text-3xl font-black tracking-tight">{nowStr || "—"}</p>
            <p className="text-sm text-indigo-300 mt-1">{form.timezone || "UTC"}</p>
          </div>
          <Clock size={48} className="text-indigo-400 opacity-50" />
        </div>
      </div>

      <div className="rounded-2xl border p-5 space-y-5" style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }}>
        <div className="flex items-center gap-2 mb-1">
          <Clock size={15} style={{ color: "#4F46E5" }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#4F46E5" }}>Timezone</span>
        </div>

        <Field label="Organization Timezone" hint="All audit logs, incident timestamps and scheduled reports use this timezone.">
          <div className="relative">
            <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
            <select
              value={form.timezone || "UTC"}
              onChange={e => setForm({ ...form, timezone: e.target.value })}
              className="w-full text-sm border rounded-xl pl-9 pr-4 py-2.5 bg-white outline-none appearance-none"
              style={{ borderColor: "#E3E9F6" }}>
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
            <ChevronRight size={13} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" style={{ color: "#9CA3AF" }} />
          </div>
        </Field>

        {/* Date format & first day of week */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t" style={{ borderColor: "#F1F5F9" }}>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={15} style={{ color: "#0891B2" }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#0891B2" }}>Date Format</span>
            </div>
            <Field label="Display Format" hint="Used in all reports and date pickers.">
              <SelectField value="DD/MM/YYYY" onChange={() => {}}>
                {DATE_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </SelectField>
            </Field>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={15} style={{ color: "#059669" }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#059669" }}>Week Settings</span>
            </div>
            <Field label="First Day of Week" hint="Affects calendar views and shift reports.">
              <SelectField value="monday" onChange={() => {}}>
                <option value="monday">Monday</option>
                <option value="sunday">Sunday</option>
                <option value="saturday">Saturday</option>
              </SelectField>
            </Field>
          </div>
        </div>
      </div>

      <SaveBar onSave={onSave} saving={saving} success={success} error={error} />
    </div>
  );
}

// ─── Section: Language ─────────────────────────────────────────────────────────

function LanguageSection({
  onSave, saving, success, error,
}: { onSave: () => void; saving: boolean; success: boolean; error: string | null }) {
  const [language, setLanguage] = useState("en-gb");
  const [currency, setCurrency] = useState("USD");
  const [numFormat, setNumFormat] = useState("1,234.56");
  const [rtl, setRtl] = useState(false);

  const selLang = LANGUAGES.find(l => l.value === language);
  const isArabicOrUrdu = ["ar", "ur"].includes(language);

  useEffect(() => {
    setRtl(isArabicOrUrdu);
  }, [isArabicOrUrdu]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Language & Regional Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">Controls system labels, notifications, number and currency display across the platform.</p>
      </div>

      {/* Language selector */}
      <div className="rounded-2xl border p-5" style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }}>
        <div className="flex items-center gap-2 mb-4">
          <Languages size={15} style={{ color: "#4F46E5" }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#4F46E5" }}>System Language</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {LANGUAGES.map(lang => (
            <button
              key={lang.value}
              onClick={() => setLanguage(lang.value)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-xs transition-all"
              style={{
                borderColor: language === lang.value ? "#4F46E5" : "#E3E9F6",
                background: language === lang.value ? "#EEF2FF" : "white",
                color: language === lang.value ? "#4F46E5" : "#374151",
                fontWeight: language === lang.value ? 700 : 400,
                boxShadow: language === lang.value ? "0 0 0 2px #C7D2FE" : "none",
              }}>
              <span className="text-base leading-none">{lang.flag}</span>
              <span className="truncate">{lang.label.split(" ")[0]} {lang.label.split(" ").slice(1).join(" ")}</span>
            </button>
          ))}
        </div>

        {selLang && (
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
            <span className="text-2xl">{selLang.flag}</span>
            <div>
              <p className="text-sm font-bold text-indigo-800">{selLang.label}</p>
              <p className="text-xs text-indigo-500">Selected as the default system language</p>
            </div>
          </div>
        )}
      </div>

      {/* Regional settings */}
      <div className="rounded-2xl border p-5" style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }}>
        <div className="flex items-center gap-2 mb-4">
          <Globe size={15} style={{ color: "#059669" }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#059669" }}>Regional Formats</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Currency" hint="Used in cost-tracking and budget reports.">
            <div className="relative">
              <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full text-sm border rounded-xl pl-8 pr-4 py-2.5 bg-white outline-none appearance-none"
                style={{ borderColor: "#E3E9F6" }}>
                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </Field>

          <Field label="Number Format" hint="Controls how large numbers are displayed.">
            <SelectField value={numFormat} onChange={setNumFormat}>
              <option value="1,234.56">1,234.56 — Comma thousands, dot decimal</option>
              <option value="1.234,56">1.234,56 — Dot thousands, comma decimal</option>
              <option value="1 234.56">1 234.56 — Space thousands, dot decimal</option>
            </SelectField>
          </Field>
        </div>
      </div>

      {/* Text direction */}
      <div className="rounded-2xl border p-5" style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }}>
        <div className="flex items-center gap-2 mb-4">
          <Monitor size={15} style={{ color: "#D97706" }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#D97706" }}>Text Direction</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: "#E3E9F6", background: "white" }}>
          <div>
            <p className="text-sm font-semibold text-slate-700">Right-to-Left (RTL) Layout</p>
            <p className="text-xs text-slate-400 mt-0.5">Auto-enabled for Arabic and Urdu. Override manually if needed.</p>
          </div>
          <button
            onClick={() => setRtl(!rtl)}
            className="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
            style={{ background: rtl ? "#4F46E5" : "#E5E7EB" }}>
            <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
              style={{ transform: rtl ? "translateX(20px)" : "translateX(2px)" }} />
          </button>
        </div>
        {rtl && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 px-1">
            <Info size={12} />RTL mode activated — UI will mirror layout for Arabic / Urdu users.
          </div>
        )}
      </div>

      <SaveBar onSave={onSave} saving={saving} success={success} error={error} />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "details",        label: "Org Details",     icon: Building2,  color: "#4F46E5" },
  { id: "branding",       label: "Branding",         icon: Palette,    color: "#7C3AED" },
  { id: "business-units", label: "Business Units",   icon: LayoutGrid, color: "#0891B2" },
  { id: "timezone",       label: "Timezone",         icon: Clock,      color: "#D97706" },
  { id: "language",       label: "Language",         icon: Globe,      color: "#059669" },
] as const;

type TabId = typeof TABS[number]["id"];

export function OrganizationSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError,   setSaveError]   = useState<string | null>(null);

  const { data: overview, isLoading: overviewLoading } = useGetOrgAdminOverviewQuery();
  const [saveDetails, { isLoading: isSaving }] = useSaveOrgSetupStep1Mutation();

  const [detailsForm, setDetailsForm] = useState<Partial<Step1Data>>({});

  useEffect(() => {
    if (overview) {
      setDetailsForm({
        organizationName:    overview.orgName,
        officialEmail:       overview.officialEmail,
        contactNumber:       overview.contactNumber,
        country:             overview.country,
        timezone:            overview.timezone,
        headquartersAddress: overview.headquartersAddress,
        industryType:        overview.industry,
      });
    }
  }, [overview]);

  async function handleSave() {
    try {
      setSaveError(null);
      await saveDetails(detailsForm).unwrap();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err?.data?.message || "Failed to save. Please try again.");
    }
  }

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#F5F7FF" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#4F46E5" }} />
      </div>
    );
  }

  const activeTabMeta = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FF" }}>

      {/* ── Banner ── */}
      <div className="relative overflow-hidden px-6 pt-7 pb-6"
        style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #3730A3 50%, #0F172A 100%)" }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 20% 60%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 85% 20%, #A5B4FC 0%, transparent 45%)" }} />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Building2 size={18} className="text-indigo-300" />
              <span className="text-indigo-200 text-xs font-bold tracking-widest uppercase">Administration</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Organization Settings</h1>
            <p className="text-indigo-200 text-sm mt-1">
              Configure your organization's identity, branding, structure and regional preferences.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {overview && (
              <div className="flex items-center gap-3">
                {[
                  { label: "Plan",     value: overview.plan     || "Standard" },
                  { label: "Status",   value: overview.status   || "Active"   },
                  { label: "Sites",    value: overview.totalSites ?? 0        },
                  { label: "Employees",value: overview.activeEmployees ?? 0   },
                ].map(s => (
                  <div key={s.label} className="px-3 py-2 rounded-xl text-center"
                    style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}>
                    <div className="text-sm font-extrabold text-white">{s.value}</div>
                    <div className="text-[10px] text-indigo-300 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-6 py-6 flex gap-6">

        {/* Sidebar */}
        <div className="w-52 flex-shrink-0">
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6", background: "white" }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: "#F1F5F9", background: "#F8F9FF" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Settings</p>
            </div>
            <nav className="p-2 space-y-0.5">
              {TABS.map(tab => {
                const active = activeTab === tab.id;
                const Icon   = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all"
                    style={active ? {
                      background: `${tab.color}12`,
                      color: tab.color,
                      fontWeight: 700,
                      border: `1px solid ${tab.color}25`,
                    } : {
                      color: "#4B5563",
                      fontWeight: 500,
                      background: "transparent",
                      border: "1px solid transparent",
                    }}>
                    <Icon size={16} style={{ color: active ? tab.color : "#9CA3AF", flexShrink: 0 }} />
                    <span className="flex-1">{tab.label}</span>
                    {active && <ChevronRight size={12} style={{ color: tab.color }} />}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Org snapshot */}
          {overview && (
            <div className="mt-4 rounded-2xl border p-4 space-y-2.5" style={{ borderColor: "#E3E9F6", background: "white" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Org Snapshot</p>
              {[
                { icon: Shield,   label: "Compliance", value: `${Math.round(overview.complianceScore)}%` },
                { icon: AlertCircle, label: "Open Incidents", value: overview.openIncidents },
                { icon: RefreshCw,   label: "Last Sync",  value: overview.systemHealth?.lastSync ?? "—" },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <s.icon size={11} style={{ color: "#9CA3AF" }} />{s.label}
                  </div>
                  <span className="text-xs font-bold text-slate-700">{s.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: "#E3E9F6" }}>

            {/* Tab content header */}
            <div className="flex items-center gap-3 pb-5 mb-5 border-b" style={{ borderColor: "#F1F5F9" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${activeTabMeta.color}12`, border: `1px solid ${activeTabMeta.color}20` }}>
                <activeTabMeta.icon size={20} style={{ color: activeTabMeta.color }} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">{activeTabMeta.label}</h2>
                <p className="text-xs text-slate-400">
                  {activeTab === "details"        && "Core identity, contact and scale information."}
                  {activeTab === "branding"       && "Logo, colors, app name and display preferences."}
                  {activeTab === "business-units" && "Define and manage organizational segments."}
                  {activeTab === "timezone"       && "Timezone, date format and calendar preferences."}
                  {activeTab === "language"       && "Language, currency, number format and text direction."}
                </p>
              </div>
            </div>

            {activeTab === "details" && (
              <DetailsSection
                form={detailsForm} setForm={setDetailsForm}
                onSave={handleSave} saving={isSaving}
                success={saveSuccess} error={saveError} />
            )}
            {activeTab === "branding" && <BrandingSection />}
            {activeTab === "business-units" && <BusinessUnitsSection />}
            {activeTab === "timezone" && (
              <TimezoneSection
                form={detailsForm} setForm={setDetailsForm}
                onSave={handleSave} saving={isSaving}
                success={saveSuccess} error={saveError} />
            )}
            {activeTab === "language" && (
              <LanguageSection
                onSave={handleSave} saving={isSaving}
                success={saveSuccess} error={saveError} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
