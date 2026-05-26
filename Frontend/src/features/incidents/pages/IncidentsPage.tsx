import { useState } from "react";
import { useSearchParams } from "react-router";
import {
  AlertTriangle,
  Loader2,
  Plus,
  X,
  ChevronDown,
  Search,
  ClipboardList,
  Eye,
  ShieldAlert,
  BarChart3,
} from "lucide-react";

import {
  useListIncidentsQuery,
  useCreateIncidentMutation,
  useUpdateIncidentMutation,
  useClassifyIncidentMutation,
  useStartIncidentInvestigationMutation,
  useListUnsafeActsQuery,
  useCreateUnsafeActMutation,
  useListUnsafeConditionsQuery,
  useCreateUnsafeConditionMutation,
  useListInvestigationsQuery,
  useGetIncidentRcaQuery,
  useCreateIncidentRcaMutation,
  useListCorrectiveActionsQuery,
  useCreateCorrectiveActionMutation,
  useUpdateCorrectiveActionMutation,
  useGetIncidentAnalyticsQuery,
} from "@/features/incidents/api/incidentsApi";
import type { Incident, CorrectiveAction } from "@/features/incidents/api/incidentsApi";
import {
  useListNearMissQuery,
  useCreateNearMissMutation,
} from "@/features/hazards/api/hazardsApi";
import type { NearMiss } from "@/features/hazards/api/hazardsApi";

// ── Constants ─────────────────────────────────────────────────────────────────

const SEV_COLOR: Record<string, string> = {
  low: "#10B981",
  medium: "#F59E0B",
  high: "#F97316",
  critical: "#EF4444",
  unclassified: "#9CA3AF",
};

const STATUS_COLOR: Record<string, string> = {
  reported: "#6366F1",
  classified: "#8B5CF6",
  investigating: "#F59E0B",
  resolved: "#10B981",
  closed: "#6B7280",
  open: "#EF4444",
  in_progress: "#F59E0B",
  draft: "#9CA3AF",
};

const SEVERITIES = ["low", "medium", "high", "critical"] as const;

const INCIDENT_TYPES = [
  { value: "incident_report", label: "Incident Report" },
  { value: "environmental", label: "Environmental" },
  { value: "property_damage", label: "Property Damage" },
  { value: "injury", label: "Injury" },
  { value: "fatality", label: "Fatality" },
];

const RCA_METHODS = [
  { value: "5-why", label: "5-Why Analysis" },
  { value: "fishbone", label: "Fishbone / Ishikawa" },
  { value: "fault-tree", label: "Fault Tree Analysis" },
  { value: "bowtie", label: "Bowtie Analysis" },
];

const TABS = [
  { id: "reports", label: "Incident Reports", icon: ClipboardList },
  { id: "near-misses", label: "Near Misses", icon: AlertTriangle },
  { id: "unsafe-acts", label: "Unsafe Acts", icon: ShieldAlert },
  { id: "unsafe-conditions", label: "Unsafe Conditions", icon: Eye },
  { id: "investigation", label: "Investigations", icon: Search },
  { id: "rca", label: "Root Cause Analysis", icon: BarChart3 },
  { id: "corrective-actions", label: "Corrective Actions", icon: ClipboardList },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── Small shared components ───────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const color = SEV_COLOR[severity] ?? "#9CA3AF";
  return (
    <span
      className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ background: color + "1A", color }}
    >
      {severity || "—"}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? "#9CA3AF";
  return (
    <span
      className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ background: color + "1A", color }}
    >
      {status || "—"}
    </span>
  );
}

function TableHead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
        {cols.map((c) => (
          <th
            key={c}
            className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide"
            style={{ color: "#9CA3AF" }}
          >
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={99} className="text-center py-12">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
        <p className="text-sm" style={{ color: "#6B7280" }}>
          {message}
        </p>
      </td>
    </tr>
  );
}

function LoadingState() {
  return (
    <tr>
      <td colSpan={99} className="text-center py-10">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" style={{ color: "#4A57B9" }} />
        <p className="text-sm" style={{ color: "#9CA3AF" }}>
          Loading…
        </p>
      </td>
    </tr>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white rounded-2xl border p-5 ${className}`}
      style={{ borderColor: "#E3E9F6" }}
    >
      {children}
    </div>
  );
}

function KpiCard({
  label,
  value,
  color,
  loading,
}: {
  label: string;
  value: number | string;
  color: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E3E9F6" }}>
      <div className="text-2xl font-bold" style={{ color }}>
        {loading ? <Loader2 className="w-5 h-5 animate-spin" style={{ color }} /> : value}
      </div>
      <div className="text-xs font-medium mt-0.5" style={{ color: "#6B7280" }}>
        {label}
      </div>
    </div>
  );
}

// ── Inline form helpers ───────────────────────────────────────────────────────

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold" style={{ color: "#6B7280" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-100";
const inputStyle = { borderColor: "#E3E9F6", background: "#F9FAFB" };

function FormInput({
  value,
  onChange,
  placeholder = "",
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      className={inputCls}
      style={inputStyle}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function FormTextarea({
  value,
  onChange,
  placeholder = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      className={inputCls}
      style={inputStyle}
      rows={3}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function FormSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      className={inputCls}
      style={inputStyle}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">— Select —</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all hover:opacity-90"
      style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  onClick,
  children,
}: {
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
      style={{ borderColor: "#E3E9F6", color: "#6B7280" }}
    >
      {children}
    </button>
  );
}

// ── Tab: Reports ──────────────────────────────────────────────────────────────

function ReportsTab() {
  const { data: incidents = [], isLoading } = useListIncidentsQuery();
  const [createIncident, { isLoading: creating }] = useCreateIncidentMutation();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState("");

  const [form, setForm] = useState({
    description: "",
    incident_type: "",
    severity: "",
    location_id: "",
  });

  const filtered = incidents.filter((i) => {
    const matchSearch = (i.title ?? "").toLowerCase().includes(search.toLowerCase());
    const matchSev = !sevFilter || i.severity === sevFilter;
    return matchSearch && matchSev;
  });

  async function handleCreate() {
    if (!form.description) return;
    await createIncident({
      description: form.description,
      incident_type: form.incident_type || "incident_report",
      severity: form.severity || "unclassified",
      location_id: form.location_id || undefined,
    });
    setForm({ description: "", incident_type: "", severity: "", location_id: "" });
    setShowForm(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: "#E3E9F6", background: "#F9FAFB" }}
            placeholder="Search incidents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2.5 rounded-xl border text-sm outline-none"
          style={{ borderColor: "#E3E9F6" }}
          value={sevFilter}
          onChange={(e) => setSevFilter(e.target.value)}
        >
          <option value="">All severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <PrimaryButton onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" />
          Report Incident
        </PrimaryButton>
      </div>

      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: "#111827" }}>
              Report New Incident
            </h3>
            <button onClick={() => setShowForm(false)}>
              <X className="w-4 h-4" style={{ color: "#6B7280" }} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <FormRow label="Description">
              <FormTextarea
                value={form.description}
                onChange={(v) => setForm((f) => ({ ...f, description: v }))}
                placeholder="Describe what happened…"
              />
            </FormRow>
            <div className="space-y-4">
              <FormRow label="Incident Type">
                <FormSelect
                  value={form.incident_type}
                  onChange={(v) => setForm((f) => ({ ...f, incident_type: v }))}
                  options={INCIDENT_TYPES}
                />
              </FormRow>
              <FormRow label="Severity">
                <FormSelect
                  value={form.severity}
                  onChange={(v) => setForm((f) => ({ ...f, severity: v }))}
                  options={SEVERITIES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                />
              </FormRow>
              <FormRow label="Location (optional)">
                <FormInput
                  value={form.location_id}
                  onChange={(v) => setForm((f) => ({ ...f, location_id: v }))}
                  placeholder="Location ID or name"
                />
              </FormRow>
            </div>
          </div>
          <div className="flex gap-2">
            <PrimaryButton onClick={handleCreate} disabled={creating || !form.description}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Submit Report
            </PrimaryButton>
            <SecondaryButton onClick={() => setShowForm(false)}>Cancel</SecondaryButton>
          </div>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <TableHead cols={["Incident", "Type", "Severity", "Status", "Reported By", "Date", "Actions"]} />
          <tbody>
            {isLoading ? (
              <LoadingState />
            ) : filtered.length === 0 ? (
              <EmptyState message="No incidents found" />
            ) : (
              filtered.map((i) => <IncidentReportRow key={i.id} incident={i} />)
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function IncidentReportRow({ incident }: { incident: Incident }) {
  const [classify, { isLoading }] = useClassifyIncidentMutation();
  const [open, setOpen] = useState(false);

  async function handleClassify(sev: string) {
    setOpen(false);
    await classify({ incidentId: incident.id, classification: incident.incident_type ?? "incident_report", severity: sev });
  }

  return (
    <tr className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F3F4F6" }}>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: SEV_COLOR[incident.severity] ?? "#9CA3AF" }} />
          <div>
            <div className="text-sm font-semibold" style={{ color: "#111827" }}>
              {incident.title ?? incident.ref ?? incident.id}
            </div>
            <div className="text-xs" style={{ color: "#9CA3AF" }}>
              {incident.ref}
            </div>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-xs capitalize" style={{ color: "#6B7280" }}>
        {(incident.incident_type ?? "—").replace(/_/g, " ")}
      </td>
      <td className="px-5 py-3.5">
        <SeverityBadge severity={incident.severity} />
      </td>
      <td className="px-5 py-3.5">
        <StatusBadge status={incident.status} />
      </td>
      <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>
        {incident.reported_by?.slice(0, 8) ?? "—"}
      </td>
      <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>
        {incident.occurred_at ? new Date(incident.occurred_at).toLocaleDateString() : "—"}
      </td>
      <td className="px-5 py-3.5">
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-50 hover:bg-gray-50 transition-colors"
            style={{ borderColor: "#E3E9F6", color: "#6B7280" }}
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronDown className="w-3 h-3" />}
            Classify
          </button>
          {open && (
            <div
              className="absolute right-0 top-full mt-1 bg-white rounded-xl border shadow-lg z-10 overflow-hidden"
              style={{ borderColor: "#E3E9F6", minWidth: 120 }}
            >
              {SEVERITIES.map((sev) => (
                <button
                  key={sev}
                  onClick={() => handleClassify(sev)}
                  className="w-full text-left px-3 py-2 text-xs font-semibold capitalize hover:bg-gray-50 transition-colors flex items-center gap-2"
                  style={{ color: SEV_COLOR[sev] }}
                >
                  <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ background: SEV_COLOR[sev] }} />
                  {sev}
                </button>
              ))}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Tab: Near Misses ──────────────────────────────────────────────────────────

function NearMissesTab() {
  const { data: rawData, isLoading } = useListNearMissQuery();
  const [createNearMiss, { isLoading: creating }] = useCreateNearMissMutation();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", severity: "" });

  const items: NearMiss[] = Array.isArray(rawData) ? rawData : (rawData as { items?: NearMiss[] })?.items ?? [];

  async function handleCreate() {
    if (!form.title) return;
    await createNearMiss({
      title: form.title,
      description: form.description,
      severity: form.severity || "low",
    });
    setForm({ title: "", description: "", severity: "" });
    setShowForm(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <PrimaryButton onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" />
          Report Near Miss
        </PrimaryButton>
      </div>

      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: "#111827" }}>
              Report Near Miss
            </h3>
            <button onClick={() => setShowForm(false)}>
              <X className="w-4 h-4" style={{ color: "#6B7280" }} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <FormRow label="Title">
              <FormInput value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="Brief title" />
            </FormRow>
            <FormRow label="Severity">
              <FormSelect
                value={form.severity}
                onChange={(v) => setForm((f) => ({ ...f, severity: v }))}
                options={SEVERITIES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
              />
            </FormRow>
            <FormRow label="Description">
              <FormTextarea
                value={form.description}
                onChange={(v) => setForm((f) => ({ ...f, description: v }))}
                placeholder="Describe the near miss…"
              />
            </FormRow>
          </div>
          <div className="flex gap-2">
            <PrimaryButton onClick={handleCreate} disabled={creating || !form.title}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Submit
            </PrimaryButton>
            <SecondaryButton onClick={() => setShowForm(false)}>Cancel</SecondaryButton>
          </div>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <TableHead cols={["Title", "Severity", "Status", "Date"]} />
          <tbody>
            {isLoading ? (
              <LoadingState />
            ) : items.length === 0 ? (
              <EmptyState message="No near misses reported" />
            ) : (
              items.map((nm) => (
                <tr key={nm.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-5 py-3.5">
                    <div className="text-sm font-semibold" style={{ color: "#111827" }}>
                      {nm.title}
                    </div>
                    <div className="text-xs" style={{ color: "#9CA3AF" }}>
                      {nm.ref}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <SeverityBadge severity={nm.severity} />
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={nm.status} />
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>
                    —
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Tab: Unsafe Acts / Conditions (shared) ────────────────────────────────────

function UnsafeListTab({
  items,
  isLoading,
  onSubmit,
  submitting,
  label,
}: {
  items: Incident[];
  isLoading: boolean;
  onSubmit: (data: { description: string; severity: string; location_id?: string }) => Promise<void>;
  submitting: boolean;
  label: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: "", severity: "", location_id: "" });

  async function handleSubmit() {
    if (!form.description) return;
    await onSubmit({ description: form.description, severity: form.severity || "unclassified", location_id: form.location_id || undefined });
    setForm({ description: "", severity: "", location_id: "" });
    setShowForm(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <PrimaryButton onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" />
          Report {label}
        </PrimaryButton>
      </div>

      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: "#111827" }}>
              Report {label}
            </h3>
            <button onClick={() => setShowForm(false)}>
              <X className="w-4 h-4" style={{ color: "#6B7280" }} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <FormRow label="Description">
              <FormTextarea
                value={form.description}
                onChange={(v) => setForm((f) => ({ ...f, description: v }))}
                placeholder={`Describe the ${label.toLowerCase()}…`}
              />
            </FormRow>
            <div className="space-y-4">
              <FormRow label="Severity">
                <FormSelect
                  value={form.severity}
                  onChange={(v) => setForm((f) => ({ ...f, severity: v }))}
                  options={SEVERITIES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                />
              </FormRow>
              <FormRow label="Location (optional)">
                <FormInput value={form.location_id} onChange={(v) => setForm((f) => ({ ...f, location_id: v }))} placeholder="Location" />
              </FormRow>
            </div>
          </div>
          <div className="flex gap-2">
            <PrimaryButton onClick={handleSubmit} disabled={submitting || !form.description}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Submit
            </PrimaryButton>
            <SecondaryButton onClick={() => setShowForm(false)}>Cancel</SecondaryButton>
          </div>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <TableHead cols={["Description", "Severity", "Status", "Date"]} />
          <tbody>
            {isLoading ? (
              <LoadingState />
            ) : items.length === 0 ? (
              <EmptyState message={`No ${label.toLowerCase()}s reported`} />
            ) : (
              items.map((i) => (
                <tr key={i.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-5 py-3.5">
                    <div className="text-sm font-semibold" style={{ color: "#111827" }}>
                      {i.title ?? i.description?.slice(0, 60) ?? "—"}
                    </div>
                    <div className="text-xs" style={{ color: "#9CA3AF" }}>
                      {i.ref}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <SeverityBadge severity={i.severity} />
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={i.status} />
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>
                    {i.occurred_at ? new Date(i.occurred_at).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function UnsafeActsTab() {
  const { data: items = [], isLoading } = useListUnsafeActsQuery();
  const [createUnsafeAct, { isLoading: creating }] = useCreateUnsafeActMutation();

  return (
    <UnsafeListTab
      items={items}
      isLoading={isLoading}
      onSubmit={async (data) => { await createUnsafeAct(data); }}
      submitting={creating}
      label="Unsafe Act"
    />
  );
}

function UnsafeConditionsTab() {
  const { data: items = [], isLoading } = useListUnsafeConditionsQuery();
  const [createUnsafeCondition, { isLoading: creating }] = useCreateUnsafeConditionMutation();

  return (
    <UnsafeListTab
      items={items}
      isLoading={isLoading}
      onSubmit={async (data) => { await createUnsafeCondition(data); }}
      submitting={creating}
      label="Unsafe Condition"
    />
  );
}

// ── Tab: Investigation ────────────────────────────────────────────────────────

function InvestigationRow({ incident }: { incident: Incident }) {
  const { data: investigations = [], isLoading: loadingInv } = useListInvestigationsQuery(incident.id);
  const [startInv, { isLoading: starting }] = useStartIncidentInvestigationMutation();
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({ lead_investigator: "", rca_method: "", notes: "" });

  async function handleStart() {
    if (!form.lead_investigator) return;
    await startInv({ incidentId: incident.id, lead_investigator: form.lead_investigator, rca_method: form.rca_method || undefined, notes: form.notes || undefined });
    setExpanded(false);
    setForm({ lead_investigator: "", rca_method: "", notes: "" });
  }

  return (
    <>
      <tr className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F3F4F6" }}>
        <td className="px-5 py-3.5">
          <div className="text-sm font-semibold" style={{ color: "#111827" }}>
            {incident.title ?? incident.ref ?? incident.id}
          </div>
          <div className="text-xs" style={{ color: "#9CA3AF" }}>
            {incident.ref}
          </div>
        </td>
        <td className="px-5 py-3.5">
          <SeverityBadge severity={incident.severity} />
        </td>
        <td className="px-5 py-3.5">
          <StatusBadge status={incident.status} />
        </td>
        <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>
          {loadingInv ? "…" : investigations.length > 0 ? `${investigations.length} investigation(s)` : "None"}
        </td>
        <td className="px-5 py-3.5">
          <div className="flex gap-2">
            {incident.status !== "closed" && (
              <PrimaryButton onClick={() => setExpanded(!expanded)}>
                {expanded ? "Close" : "Start Investigation"}
              </PrimaryButton>
            )}
            {investigations.length > 0 && (
              <SecondaryButton onClick={() => setExpanded(!expanded)}>
                View
              </SecondaryButton>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr style={{ borderColor: "#F3F4F6" }}>
          <td colSpan={5} className="px-5 py-4 bg-blue-50">
            {investigations.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold mb-2" style={{ color: "#111827" }}>
                  Existing Investigations
                </h4>
                <div className="space-y-2">
                  {investigations.map((inv) => (
                    <div key={inv.id} className="bg-white rounded-xl p-3 text-xs" style={{ border: "1px solid #E3E9F6" }}>
                      <div className="flex gap-4">
                        <span style={{ color: "#6B7280" }}>Lead: <strong style={{ color: "#111827" }}>{inv.lead_user_id}</strong></span>
                        <span style={{ color: "#6B7280" }}>Method: <strong style={{ color: "#111827" }}>{inv.rca_method || "—"}</strong></span>
                        <StatusBadge status={inv.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <h4 className="text-xs font-semibold mb-3" style={{ color: "#111827" }}>
              Start New Investigation
            </h4>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <FormRow label="Lead Investigator">
                <FormInput
                  value={form.lead_investigator}
                  onChange={(v) => setForm((f) => ({ ...f, lead_investigator: v }))}
                  placeholder="Name or ID"
                />
              </FormRow>
              <FormRow label="RCA Method">
                <FormSelect
                  value={form.rca_method}
                  onChange={(v) => setForm((f) => ({ ...f, rca_method: v }))}
                  options={RCA_METHODS}
                />
              </FormRow>
              <FormRow label="Notes">
                <FormInput value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} placeholder="Initial notes" />
              </FormRow>
            </div>
            <div className="flex gap-2">
              <PrimaryButton onClick={handleStart} disabled={starting || !form.lead_investigator}>
                {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Assign Investigation
              </PrimaryButton>
              <SecondaryButton onClick={() => setExpanded(false)}>Cancel</SecondaryButton>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function InvestigationTab() {
  const { data: incidents = [], isLoading } = useListIncidentsQuery();

  return (
    <Card className="p-0 overflow-hidden">
      <table className="w-full text-sm">
        <TableHead cols={["Incident", "Severity", "Status", "Investigations", "Actions"]} />
        <tbody>
          {isLoading ? (
            <LoadingState />
          ) : incidents.length === 0 ? (
            <EmptyState message="No incidents to investigate" />
          ) : (
            incidents.map((i) => <InvestigationRow key={i.id} incident={i} />)
          )}
        </tbody>
      </table>
    </Card>
  );
}

// ── Tab: RCA ──────────────────────────────────────────────────────────────────

function RcaRow({ incident }: { incident: Incident }) {
  const { data: rcaItems = [], isLoading: loadingRca } = useGetIncidentRcaQuery(incident.id);
  const [createRca, { isLoading: creating }] = useCreateIncidentRcaMutation();
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({
    root_cause: "",
    contributing_factors: "",
    recommendations: "",
    rca_method: "",
  });

  async function handleCreate() {
    if (!form.root_cause || !form.rca_method) return;
    await createRca({ incidentId: incident.id, ...form });
    setForm({ root_cause: "", contributing_factors: "", recommendations: "", rca_method: "" });
    setExpanded(false);
  }

  return (
    <>
      <tr className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F3F4F6" }}>
        <td className="px-5 py-3.5">
          <div className="text-sm font-semibold" style={{ color: "#111827" }}>
            {incident.title ?? incident.ref ?? incident.id}
          </div>
          <div className="text-xs" style={{ color: "#9CA3AF" }}>
            {incident.ref}
          </div>
        </td>
        <td className="px-5 py-3.5">
          <SeverityBadge severity={incident.severity} />
        </td>
        <td className="px-5 py-3.5 text-xs" style={{ color: "#6B7280" }}>
          {loadingRca ? "…" : `${rcaItems.length} RCA(s)`}
        </td>
        <td className="px-5 py-3.5">
          <PrimaryButton onClick={() => setExpanded(!expanded)}>
            {expanded ? "Close" : "Add RCA"}
          </PrimaryButton>
        </td>
      </tr>
      {expanded && (
        <tr style={{ borderColor: "#F3F4F6" }}>
          <td colSpan={4} className="px-5 py-4 bg-blue-50">
            {rcaItems.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold mb-2" style={{ color: "#111827" }}>
                  Existing RCA Records
                </h4>
                <div className="space-y-2">
                  {rcaItems.map((r) => (
                    <div key={r.id} className="bg-white rounded-xl p-3 text-xs" style={{ border: "1px solid #E3E9F6" }}>
                      <div className="font-semibold mb-1" style={{ color: "#111827" }}>
                        Method: {r.rca_method}
                      </div>
                      <div style={{ color: "#6B7280" }}>Root cause: {r.root_cause}</div>
                      {r.recommendations && (
                        <div style={{ color: "#6B7280" }}>Recommendations: {r.recommendations}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <h4 className="text-xs font-semibold mb-3" style={{ color: "#111827" }}>
              Add Root Cause Analysis
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <FormRow label="Root Cause">
                <FormTextarea
                  value={form.root_cause}
                  onChange={(v) => setForm((f) => ({ ...f, root_cause: v }))}
                  placeholder="Describe the root cause…"
                />
              </FormRow>
              <div className="space-y-3">
                <FormRow label="RCA Method">
                  <FormSelect
                    value={form.rca_method}
                    onChange={(v) => setForm((f) => ({ ...f, rca_method: v }))}
                    options={RCA_METHODS}
                  />
                </FormRow>
                <FormRow label="Contributing Factors">
                  <FormInput
                    value={form.contributing_factors}
                    onChange={(v) => setForm((f) => ({ ...f, contributing_factors: v }))}
                    placeholder="Contributing factors"
                  />
                </FormRow>
                <FormRow label="Recommendations">
                  <FormInput
                    value={form.recommendations}
                    onChange={(v) => setForm((f) => ({ ...f, recommendations: v }))}
                    placeholder="Recommendations"
                  />
                </FormRow>
              </div>
            </div>
            <div className="flex gap-2">
              <PrimaryButton onClick={handleCreate} disabled={creating || !form.root_cause || !form.rca_method}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save RCA
              </PrimaryButton>
              <SecondaryButton onClick={() => setExpanded(false)}>Cancel</SecondaryButton>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function RcaTab() {
  const { data: incidents = [], isLoading } = useListIncidentsQuery();
  const activeIncidents = incidents.filter((i) => !["closed"].includes(i.status));

  return (
    <Card className="p-0 overflow-hidden">
      <table className="w-full text-sm">
        <TableHead cols={["Incident", "Severity", "RCA Count", "Actions"]} />
        <tbody>
          {isLoading ? (
            <LoadingState />
          ) : activeIncidents.length === 0 ? (
            <EmptyState message="No active incidents for RCA" />
          ) : (
            activeIncidents.map((i) => <RcaRow key={i.id} incident={i} />)
          )}
        </tbody>
      </table>
    </Card>
  );
}

// ── Tab: Corrective Actions ───────────────────────────────────────────────────

function CorrectiveActionsTab() {
  const { data: actions = [], isLoading } = useListCorrectiveActionsQuery();
  const { data: incidents = [] } = useListIncidentsQuery();
  const [createAction, { isLoading: creating }] = useCreateCorrectiveActionMutation();
  const [updateAction] = useUpdateCorrectiveActionMutation();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    incident_id: "",
    assigned_to: "",
    due_date: "",
    priority: "",
  });

  async function handleCreate() {
    if (!form.title) return;
    await createAction({ ...form, priority: form.priority || "medium" });
    setForm({ title: "", description: "", incident_id: "", assigned_to: "", due_date: "", priority: "" });
    setShowForm(false);
  }

  async function handleStatusUpdate(action: CorrectiveAction, newStatus: string) {
    await updateAction({ actionId: action.id, status: newStatus });
  }

  const STATUS_FLOW: Record<string, string> = { open: "in_progress", in_progress: "closed" };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <PrimaryButton onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" />
          Add Action
        </PrimaryButton>
      </div>

      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: "#111827" }}>
              Add Corrective Action
            </h3>
            <button onClick={() => setShowForm(false)}>
              <X className="w-4 h-4" style={{ color: "#6B7280" }} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <FormRow label="Action Title">
              <FormInput value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="Action title" />
            </FormRow>
            <FormRow label="Linked Incident">
              <FormSelect
                value={form.incident_id}
                onChange={(v) => setForm((f) => ({ ...f, incident_id: v }))}
                options={incidents.map((i) => ({ value: i.id, label: i.title ?? i.ref ?? i.id }))}
              />
            </FormRow>
            <FormRow label="Description">
              <FormTextarea value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="Description" />
            </FormRow>
            <div className="space-y-4">
              <FormRow label="Assigned To">
                <FormInput value={form.assigned_to} onChange={(v) => setForm((f) => ({ ...f, assigned_to: v }))} placeholder="Assignee name" />
              </FormRow>
              <FormRow label="Due Date">
                <FormInput type="date" value={form.due_date} onChange={(v) => setForm((f) => ({ ...f, due_date: v }))} />
              </FormRow>
              <FormRow label="Priority">
                <FormSelect
                  value={form.priority}
                  onChange={(v) => setForm((f) => ({ ...f, priority: v }))}
                  options={[
                    { value: "low", label: "Low" },
                    { value: "medium", label: "Medium" },
                    { value: "high", label: "High" },
                    { value: "critical", label: "Critical" },
                  ]}
                />
              </FormRow>
            </div>
          </div>
          <div className="flex gap-2">
            <PrimaryButton onClick={handleCreate} disabled={creating || !form.title}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Action
            </PrimaryButton>
            <SecondaryButton onClick={() => setShowForm(false)}>Cancel</SecondaryButton>
          </div>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <TableHead cols={["Action", "Linked Incident", "Assigned To", "Due Date", "Priority", "Status", "Update"]} />
          <tbody>
            {isLoading ? (
              <LoadingState />
            ) : actions.length === 0 ? (
              <EmptyState message="No corrective actions" />
            ) : (
              actions.map((a) => (
                <tr key={a.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-5 py-3.5">
                    <div className="text-sm font-semibold" style={{ color: "#111827" }}>
                      {a.title || "—"}
                    </div>
                    {a.description && (
                      <div className="text-xs" style={{ color: "#9CA3AF" }}>
                        {a.description.slice(0, 50)}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>
                    {a.incident_id ? (incidents.find((i) => i.id === a.incident_id)?.title ?? a.incident_id.slice(0, 8)) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>
                    {a.assigned_to || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>
                    {a.due_date ? new Date(a.due_date).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    {a.priority ? <SeverityBadge severity={a.priority} /> : <span style={{ color: "#9CA3AF" }}>—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    {STATUS_FLOW[a.status] && (
                      <SecondaryButton onClick={() => handleStatusUpdate(a, STATUS_FLOW[a.status])}>
                        → {STATUS_FLOW[a.status].replace(/_/g, " ")}
                      </SecondaryButton>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Tab: Analytics ────────────────────────────────────────────────────────────

function AnalyticsTab() {
  const { data: analytics, isLoading } = useGetIncidentAnalyticsQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#4A57B9" }} />
      </div>
    );
  }

  if (!analytics) {
    return <EmptyState message="Analytics unavailable" />;
  }

  const kpis = [
    { label: "Total Incidents", value: analytics.total_incidents, color: "#4A57B9" },
    { label: "TRIR", value: analytics.trir, color: "#F59E0B" },
    { label: "Open CAs", value: analytics.open_corrective_actions, color: "#EF4444" },
    { label: "Closed CAs", value: analytics.closed_corrective_actions, color: "#10B981" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} color={k.color} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* By Severity */}
        <Card>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#111827" }}>
            By Severity
          </h3>
          <div className="space-y-2">
            {Object.entries(analytics.by_severity ?? {}).map(([sev, count]) => (
              <div key={sev} className="flex items-center justify-between">
                <SeverityBadge severity={sev} />
                <span className="text-sm font-bold" style={{ color: "#111827" }}>
                  {count}
                </span>
              </div>
            ))}
            {Object.keys(analytics.by_severity ?? {}).length === 0 && (
              <p className="text-sm" style={{ color: "#9CA3AF" }}>
                No data
              </p>
            )}
          </div>
        </Card>

        {/* By Type */}
        <Card>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#111827" }}>
            By Type
          </h3>
          <div className="space-y-2">
            {Object.entries(analytics.by_type ?? {}).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-xs capitalize" style={{ color: "#6B7280" }}>
                  {type.replace(/_/g, " ")}
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: "#EEF2FF", color: "#4A57B9" }}
                >
                  {count}
                </span>
              </div>
            ))}
            {Object.keys(analytics.by_type ?? {}).length === 0 && (
              <p className="text-sm" style={{ color: "#9CA3AF" }}>
                No data
              </p>
            )}
          </div>
        </Card>

        {/* By Status */}
        <Card>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#111827" }}>
            By Status
          </h3>
          <div className="space-y-2">
            {Object.entries(analytics.by_status ?? {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <StatusBadge status={status} />
                <span className="text-sm font-bold" style={{ color: "#111827" }}>
                  {count}
                </span>
              </div>
            ))}
            {Object.keys(analytics.by_status ?? {}).length === 0 && (
              <p className="text-sm" style={{ color: "#9CA3AF" }}>
                No data
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function IncidentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabId) || "reports";

  const { data: incidents = [], isLoading: loadingIncidents } = useListIncidentsQuery();

  const totalIncidents = incidents.length;
  const openIncidents = incidents.filter((i) => !["closed", "resolved"].includes(i.status)).length;
  const criticalIncidents = incidents.filter((i) => i.severity === "critical").length;
  const underInvestigation = incidents.filter((i) => i.status === "investigating").length;

  function setTab(tab: TabId) {
    setSearchParams({ tab });
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>
          Incidents
        </h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
          Track, classify, investigate, and resolve workplace incidents
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Incidents" value={totalIncidents} color="#4A57B9" loading={loadingIncidents} />
        <KpiCard label="Open Incidents" value={openIncidents} color="#EF4444" loading={loadingIncidents} />
        <KpiCard label="Critical" value={criticalIncidents} color="#7C3AED" loading={loadingIncidents} />
        <KpiCard label="Under Investigation" value={underInvestigation} color="#F59E0B" loading={loadingIncidents} />
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(({ id, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={
                isActive
                  ? { background: "#4A57B9", color: "#fff" }
                  : { background: "#F3F4F6", color: "#6B7280" }
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "reports" && <ReportsTab />}
      {activeTab === "near-misses" && <NearMissesTab />}
      {activeTab === "unsafe-acts" && <UnsafeActsTab />}
      {activeTab === "unsafe-conditions" && <UnsafeConditionsTab />}
      {activeTab === "investigation" && <InvestigationTab />}
      {activeTab === "rca" && <RcaTab />}
      {activeTab === "corrective-actions" && <CorrectiveActionsTab />}
      {activeTab === "analytics" && <AnalyticsTab />}
    </div>
  );
}
