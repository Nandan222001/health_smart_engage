import { useState } from "react";
import {
  LayoutDashboard, BookOpen, ClipboardList, Search, Plus, X,
  CheckCircle2, AlertTriangle, Clock, RefreshCw, ChevronDown,
  ChevronRight, Shield, FileText, BarChart3, AlertCircle,
  ScrollText, BookMarked, Gavel, FolderOpen,
} from "lucide-react";
import {
  useGetComplianceDashboardQuery,
  useGetAuditChecklistsQuery,
  useCreateAuditChecklistMutation,
  usePublishChecklistMutation,
  useGetAuditsQuery,
  useCreateAuditMutation,
  useUpdateAuditMutation,
  useGetFindingsQuery,
  useCreateFindingMutation,
  useGetCapasQuery,
  useCreateCapaMutation,
  useSubmitCapaClosureMutation,
  useApproveCapaClosureMutation,
  useGetInspectionsQuery,
  useCreateInspectionMutation,
  useGetComplianceStandardsQuery,
  useCreateComplianceStandardMutation,
  useUpdateComplianceStandardMutation,
  useGetRegulatoryRequirementsQuery,
  useCreateRegulatoryRequirementMutation,
  useUpdateRegulatoryRequirementMutation,
  useGetComplianceDocumentsQuery,
  useCreateComplianceDocumentMutation,
  useUpdateComplianceDocumentMutation,
  type AuditRecord,
  type CapaRecord,
  type ComplianceStandard,
  type RegulatoryRequirement,
  type ComplianceDocument,
} from "@/features/compliance/api/complianceApi";
import { useGetAuditChecklistsQuery as useChecklistsQ } from "@/features/compliance/api/complianceApi";

// ── Types ──────────────────────────────────────────────────────────────────

type TabId = "dashboard" | "standards" | "audits" | "inspections" | "capa" | "regulatory" | "documentation";

// ── Helpers ────────────────────────────────────────────────────────────────

function severityColor(s: string) {
  const m: Record<string, { color: string; bg: string }> = {
    critical: { color: "#991B1B", bg: "#FEE2E2" },
    high:     { color: "#EF4444", bg: "#FEE2E2" },
    major:    { color: "#DC2626", bg: "#FEE2E2" },
    medium:   { color: "#F59E0B", bg: "#FEF3C7" },
    minor:    { color: "#D97706", bg: "#FEF3C7" },
    low:      { color: "#10B981", bg: "#D1FAE5" },
    observation: { color: "#6B7280", bg: "#F3F4F6" },
  };
  return m[s?.toLowerCase()] ?? m.low;
}

function statusColor(s: string) {
  const m: Record<string, { color: string; bg: string }> = {
    open:             { color: "#EF4444", bg: "#FEE2E2" },
    "in_progress":    { color: "#F59E0B", bg: "#FEF3C7" },
    completed:        { color: "#10B981", bg: "#D1FAE5" },
    closed:           { color: "#10B981", bg: "#D1FAE5" },
    scheduled:        { color: "#6B7280", bg: "#F3F4F6" },
    draft:            { color: "#F59E0B", bg: "#FEF3C7" },
    published:        { color: "#10B981", bg: "#D1FAE5" },
    archived:         { color: "#6B7280", bg: "#F3F4F6" },
    pending:          { color: "#F59E0B", bg: "#FEF3C7" },
    "pending_approval": { color: "#8B5CF6", bg: "#EDE9FE" },
    "under_review":   { color: "#3B82F6", bg: "#EFF6FF" },
    active:           { color: "#10B981", bg: "#D1FAE5" },
    "non_compliant":  { color: "#EF4444", bg: "#FEE2E2" },
    compliant:        { color: "#10B981", bg: "#D1FAE5" },
    "under review":   { color: "#3B82F6", bg: "#EFF6FF" },
  };
  return m[s?.toLowerCase()] ?? m.scheduled;
}

// ── Shared UI ──────────────────────────────────────────────────────────────

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ color, background: bg }}>
      {label}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color, bg }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string; bg: string;
}) {
  return (
    <div className="bg-white rounded-2xl border p-5 flex items-start gap-4" style={{ borderColor: "#E3E9F6" }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <div className="text-[22px] font-bold leading-none" style={{ color: "#111827" }}>{value}</div>
        <div className="text-[12px] font-semibold mt-1" style={{ color: "#6B7280" }}>{label}</div>
        {sub && <div className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>{sub}</div>}
      </div>
    </div>
  );
}

function TableHead({ cols }: { cols: string[] }) {
  return (
    <thead style={{ background: "#F8FAFF" }}>
      <tr>
        {cols.map((h) => (
          <th key={h} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: "#94A3B8" }}>{h}</th>
        ))}
      </tr>
    </thead>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="py-14 text-center">
      <Icon className="w-9 h-9 mx-auto mb-2.5" style={{ color: "#D1D5DB" }} />
      <p className="text-[13px]" style={{ color: "#6B7280" }}>{text}</p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="py-14 text-center">
      <RefreshCw className="w-7 h-7 mx-auto animate-spin" style={{ color: "#CBD5E1" }} />
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-xl border text-sm outline-none focus:border-blue-400 transition-colors";
const inputStyle = { borderColor: "#E3E9F6", background: "#F9FAFB" };
const labelCls = "block text-[11px] font-semibold mb-1";
const labelStyle = { color: "#6B7280" };

// ── Tab 1: Compliance Dashboard ────────────────────────────────────────────

function ComplianceDashboardTab() {
  const { data, isLoading } = useGetComplianceDashboardQuery();

  if (isLoading) return <LoadingSpinner />;
  if (!data) return <EmptyState icon={LayoutDashboard} text="No compliance data available yet." />;

  const { compliance_score, audits, capas, findings, standards, recent_audits } = data;
  const score = compliance_score ?? 0;
  const scoreColor = score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#EF4444";
  const scoreLabel = score >= 80 ? "Excellent" : score >= 60 ? "Moderate" : "Needs Attention";

  const findingsSev = findings.by_severity ?? {};
  const capasSev = capas.by_severity ?? {};

  return (
    <div className="space-y-6">
      {/* Score + KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border p-5 col-span-2 xl:col-span-1 flex items-center gap-4" style={{ borderColor: "#E3E9F6" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: score >= 80 ? "#D1FAE5" : score >= 60 ? "#FEF3C7" : "#FEE2E2" }}>
            <Shield className="w-8 h-8" style={{ color: scoreColor }} />
          </div>
          <div>
            <div className="text-[32px] font-black leading-none" style={{ color: scoreColor }}>{score}%</div>
            <div className="text-[13px] font-bold" style={{ color: "#111827" }}>Compliance Score</div>
            <div className="text-[12px]" style={{ color: "#6B7280" }}>{scoreLabel}</div>
          </div>
        </div>
        <KpiCard icon={ClipboardList} label="Total Audits" value={audits.total} sub={`${audits.completed} completed`} color="#4A57B9" bg="#EEF0FB" />
        <KpiCard icon={AlertTriangle} label="Open CAPAs" value={capas.open} sub={capas.overdue > 0 ? `${capas.overdue} overdue` : "on track"} color={capas.overdue > 0 ? "#EF4444" : "#F59E0B"} bg={capas.overdue > 0 ? "#FEE2E2" : "#FEF3C7"} />
        <KpiCard icon={FileText} label="Open Findings" value={findings.open} color="#8B5CF6" bg="#EDE9FE" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Audit Breakdown */}
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <h3 className="text-[14px] font-bold mb-4" style={{ color: "#111827" }}>Audit Status</h3>
          <div className="space-y-3">
            {[
              { label: "Completed", value: audits.completed, color: "#10B981", bg: "#D1FAE5" },
              { label: "In Progress", value: audits.in_progress, color: "#F59E0B", bg: "#FEF3C7" },
              { label: "Scheduled",  value: audits.scheduled,  color: "#6B7280", bg: "#F3F4F6" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: row.color }} />
                  <span className="text-[13px]" style={{ color: "#374151" }}>{row.label}</span>
                </div>
                <Badge label={String(row.value)} color={row.color} bg={row.bg} />
              </div>
            ))}
          </div>
        </div>

        {/* Findings by Severity */}
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <h3 className="text-[14px] font-bold mb-4" style={{ color: "#111827" }}>Findings by Severity</h3>
          <div className="space-y-2.5">
            {Object.entries(findingsSev).map(([sev, count]) => {
              const sc = severityColor(sev);
              return (
                <div key={sev} className="flex items-center justify-between">
                  <span className="text-[13px] capitalize" style={{ color: "#374151" }}>{sev}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min((count / Math.max(findings.open, 1)) * 100, 100)}%`, background: sc.color }} />
                    </div>
                    <Badge label={String(count)} color={sc.color} bg={sc.bg} />
                  </div>
                </div>
              );
            })}
            {Object.keys(findingsSev).length === 0 && <p className="text-[13px]" style={{ color: "#9CA3AF" }}>No findings recorded</p>}
          </div>
        </div>

        {/* CAPA by Severity */}
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <h3 className="text-[14px] font-bold mb-4" style={{ color: "#111827" }}>CAPAs by Severity</h3>
          <div className="space-y-2.5">
            {Object.entries(capasSev).map(([sev, count]) => {
              const sc = severityColor(sev);
              return (
                <div key={sev} className="flex items-center justify-between">
                  <span className="text-[13px] capitalize" style={{ color: "#374151" }}>{sev}</span>
                  <Badge label={String(count)} color={sc.color} bg={sc.bg} />
                </div>
              );
            })}
            {Object.keys(capasSev).length === 0 && <p className="text-[13px]" style={{ color: "#9CA3AF" }}>No CAPAs recorded</p>}
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between" style={{ borderColor: "#F1F5F9" }}>
            <div className="text-center">
              <div className="text-[18px] font-bold" style={{ color: "#EF4444" }}>{capas.open}</div>
              <div className="text-[11px]" style={{ color: "#6B7280" }}>Open</div>
            </div>
            <div className="text-center">
              <div className="text-[18px] font-bold" style={{ color: "#10B981" }}>{capas.closed}</div>
              <div className="text-[11px]" style={{ color: "#6B7280" }}>Closed</div>
            </div>
            <div className="text-center">
              <div className="text-[18px] font-bold" style={{ color: "#DC2626" }}>{capas.overdue}</div>
              <div className="text-[11px]" style={{ color: "#6B7280" }}>Overdue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Audits */}
      <div className="bg-white rounded-2xl border" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
          <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Recent Audits</h3>
        </div>
        {recent_audits.length === 0 ? (
          <EmptyState icon={ClipboardList} text="No audit records yet." />
        ) : (
          <table className="w-full">
            <TableHead cols={["Title", "Type", "Status", "Scheduled"]} />
            <tbody>
              {recent_audits.map((a) => {
                const sc = statusColor(a.status);
                return (
                  <tr key={a.id} className="border-t hover:bg-slate-50 transition-colors" style={{ borderColor: "#E3E9F6" }}>
                    <td className="px-5 py-3 text-[13px] font-semibold" style={{ color: "#111827" }}>{a.title}</td>
                    <td className="px-5 py-3 text-[13px]" style={{ color: "#374151" }}>{a.audit_type || "Internal"}</td>
                    <td className="px-5 py-3"><Badge label={a.status} color={sc.color} bg={sc.bg} /></td>
                    <td className="px-5 py-3 text-[13px]" style={{ color: "#6B7280" }}>{a.scheduled_date || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Tab 2: Standards & Policies ────────────────────────────────────────────

function CreateStandardModal({ onClose }: { onClose: () => void }) {
  const [create, { isLoading }] = useCreateComplianceStandardMutation();
  const [form, setForm] = useState({
    name: "", code: "", category: "ISO", description: "", status: "Active",
    version: "", effective_date: "", review_date: "", owner: "", jurisdiction: "",
  });
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    try {
      await create({
        name: form.name.trim(), code: form.code || undefined, category: form.category,
        description: form.description || undefined, status: form.status,
        version: form.version || undefined, effective_date: form.effective_date || undefined,
        review_date: form.review_date || undefined, owner: form.owner || undefined,
        jurisdiction: form.jurisdiction || undefined,
      }).unwrap();
      onClose();
    } catch { setError("Failed to create standard."); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[16px] font-bold" style={{ color: "#111827" }}>Add Standard / Policy</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" style={{ color: "#6B7280" }} /></button>
        </div>
        <div className="px-6 py-4 space-y-3">
          {error && <p className="text-[13px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className={labelCls} style={labelStyle}>Name *</label><input className={inputCls} style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="ISO 45001:2018" /></div>
            <div><label className={labelCls} style={labelStyle}>Code</label><input className={inputCls} style={inputStyle} value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="ISO-45001" /></div>
            <div><label className={labelCls} style={labelStyle}>Category</label>
              <select className={inputCls} style={inputStyle} value={form.category} onChange={(e) => set("category", e.target.value)}>
                {["ISO", "OSHA", "EPA", "Local", "Internal", "Industry", "Other"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className={labelCls} style={labelStyle}>Version</label><input className={inputCls} style={inputStyle} value={form.version} onChange={(e) => set("version", e.target.value)} /></div>
            <div><label className={labelCls} style={labelStyle}>Status</label>
              <select className={inputCls} style={inputStyle} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {["Active", "Draft", "Archived"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className={labelCls} style={labelStyle}>Effective Date</label><input type="date" className={inputCls} style={inputStyle} value={form.effective_date} onChange={(e) => set("effective_date", e.target.value)} /></div>
            <div><label className={labelCls} style={labelStyle}>Review Date</label><input type="date" className={inputCls} style={inputStyle} value={form.review_date} onChange={(e) => set("review_date", e.target.value)} /></div>
            <div><label className={labelCls} style={labelStyle}>Owner</label><input className={inputCls} style={inputStyle} value={form.owner} onChange={(e) => set("owner", e.target.value)} /></div>
            <div><label className={labelCls} style={labelStyle}>Jurisdiction</label><input className={inputCls} style={inputStyle} value={form.jurisdiction} onChange={(e) => set("jurisdiction", e.target.value)} /></div>
            <div className="col-span-2"><label className={labelCls} style={labelStyle}>Description</label><input className={inputCls} style={inputStyle} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "#E3E9F6" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-semibold hover:bg-slate-50" style={{ color: "#6B7280" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={isLoading} className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: "#4A57B9" }}>
            {isLoading ? "Saving..." : "Add Standard"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StandardsPoliciesTab() {
  const { data: standards = [], isLoading } = useGetComplianceStandardsQuery();
  const [updateStandard] = useUpdateComplianceStandardMutation();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = standards.filter((s) => {
    const q = search.toLowerCase();
    return (s.name + (s.code || "") + s.category + (s.owner || "")).toLowerCase().includes(q);
  });

  const active = standards.filter((s) => s.status === "Active").length;
  const draft = standards.filter((s) => s.status === "Draft").length;

  const cycleStatus = async (s: ComplianceStandard) => {
    const next = s.status === "Active" ? "Archived" : s.status === "Archived" ? "Draft" : "Active";
    await updateStandard({ id: s.id, data: { status: next } });
  };

  return (
    <div className="space-y-6">
      {showCreate && <CreateStandardModal onClose={() => setShowCreate(false)} />}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={BookMarked} label="Total Standards" value={standards.length} color="#4A57B9" bg="#EEF0FB" />
        <KpiCard icon={CheckCircle2} label="Active" value={active} color="#10B981" bg="#D1FAE5" />
        <KpiCard icon={AlertCircle} label="Draft" value={draft} color="#F59E0B" bg="#FEF3C7" />
        <KpiCard icon={Shield} label="Archived" value={standards.length - active - draft} color="#6B7280" bg="#F3F4F6" />
      </div>
      <div className="bg-white rounded-2xl border" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>Standards & Policies</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search standards..." className="pl-9 pr-3 py-2 rounded-xl border text-[13px] outline-none w-48" style={{ borderColor: "#E3E9F6", background: "#F8FAFF" }} />
            </div>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white" style={{ background: "#4A57B9" }}>
              <Plus className="w-3.5 h-3.5" /> Add Standard
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? <LoadingSpinner /> : filtered.length === 0 ? (
            <EmptyState icon={BookMarked} text={search ? "No standards match" : "No standards added yet."} />
          ) : (
            <table className="w-full">
              <TableHead cols={["Name", "Code", "Category", "Version", "Owner", "Effective", "Review", "Status"]} />
              <tbody>
                {filtered.map((s) => {
                  const sc = statusColor(s.status);
                  return (
                    <tr key={s.id} className="border-t hover:bg-slate-50 transition-colors" style={{ borderColor: "#E3E9F6" }}>
                      <td className="px-5 py-3">
                        <div className="text-[13px] font-bold" style={{ color: "#111827" }}>{s.name}</div>
                        {s.description && <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{s.description.slice(0, 60)}</div>}
                      </td>
                      <td className="px-5 py-3 text-[13px]" style={{ color: "#4A57B9" }}>{s.code || "—"}</td>
                      <td className="px-5 py-3 text-[13px]" style={{ color: "#374151" }}>{s.category}</td>
                      <td className="px-5 py-3 text-[13px]" style={{ color: "#374151" }}>{s.version || "—"}</td>
                      <td className="px-5 py-3 text-[13px]" style={{ color: "#374151" }}>{s.owner || "—"}</td>
                      <td className="px-5 py-3 text-[13px]" style={{ color: "#6B7280" }}>{s.effective_date || "—"}</td>
                      <td className="px-5 py-3 text-[13px]" style={{ color: "#6B7280" }}>{s.review_date || "—"}</td>
                      <td className="px-5 py-3">
                        <button onClick={() => cycleStatus(s)} title="Click to cycle status">
                          <Badge label={s.status} color={sc.color} bg={sc.bg} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab 3: Audit Management ────────────────────────────────────────────────

function CreateAuditModal({ onClose }: { onClose: () => void }) {
  const { data: checklists = [] } = useGetAuditChecklistsQuery();
  const [createAudit, { isLoading }] = useCreateAuditMutation();
  const [form, setForm] = useState({
    checklist_id: "", title: "", audit_type: "Internal", site_id: "", scheduled_date: "",
  });
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.checklist_id) { setError("Please select a checklist"); return; }
    try {
      await createAudit({
        checklist_id: form.checklist_id, title: form.title || undefined,
        audit_type: form.audit_type, site_id: form.site_id || undefined,
        scheduled_date: form.scheduled_date || undefined,
      }).unwrap();
      onClose();
    } catch { setError("Failed to create audit."); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[16px] font-bold" style={{ color: "#111827" }}>Schedule Audit</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" style={{ color: "#6B7280" }} /></button>
        </div>
        <div className="px-6 py-4 space-y-3">
          {error && <p className="text-[13px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls} style={labelStyle}>Checklist *</label>
              <select className={inputCls} style={inputStyle} value={form.checklist_id} onChange={(e) => set("checklist_id", e.target.value)}>
                <option value="">Select a checklist...</option>
                {checklists.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-span-2"><label className={labelCls} style={labelStyle}>Title</label><input className={inputCls} style={inputStyle} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Q1 Safety Audit" /></div>
            <div><label className={labelCls} style={labelStyle}>Audit Type</label>
              <select className={inputCls} style={inputStyle} value={form.audit_type} onChange={(e) => set("audit_type", e.target.value)}>
                {["Internal", "External", "Regulatory", "Supplier", "Safety Inspection"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className={labelCls} style={labelStyle}>Scheduled Date</label><input type="date" className={inputCls} style={inputStyle} value={form.scheduled_date} onChange={(e) => set("scheduled_date", e.target.value)} /></div>
            <div className="col-span-2"><label className={labelCls} style={labelStyle}>Site ID (optional)</label><input className={inputCls} style={inputStyle} value={form.site_id} onChange={(e) => set("site_id", e.target.value)} /></div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "#E3E9F6" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-semibold hover:bg-slate-50" style={{ color: "#6B7280" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={isLoading || checklists.length === 0} className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: "#4A57B9" }}>
            {isLoading ? "Scheduling..." : "Schedule Audit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AuditManagementTab() {
  const { data: audits = [], isLoading: auditsLoading } = useGetAuditsQuery();
  const { data: findings = [], isLoading: findingsLoading } = useGetFindingsQuery();
  const { data: checklists = [], isLoading: clLoading } = useGetAuditChecklistsQuery();
  const [createChecklist, { isLoading: clCreating }] = useCreateAuditChecklistMutation();
  const [publishCl] = usePublishChecklistMutation();
  const [updateAudit] = useUpdateAuditMutation();
  const [search, setSearch] = useState("");
  const [showAudit, setShowAudit] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [clForm, setClForm] = useState({ name: "", standard: "ISO 45001", version: "1.0", audit_type: "Internal" });

  const filteredAudits = audits.filter((a) => {
    const q = search.toLowerCase();
    return (a.title + (a.audit_type || "") + a.status).toLowerCase().includes(q);
  });

  const completed = audits.filter((a) => a.status === "completed").length;

  const markStatus = async (audit: AuditRecord, status: string) => {
    const extra = status === "completed" ? { completed_date: new Date().toISOString().slice(0, 10) } : {};
    await updateAudit({ id: audit.id, data: { status, ...extra } });
  };

  return (
    <div className="space-y-6">
      {showAudit && <CreateAuditModal onClose={() => setShowAudit(false)} />}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={ClipboardList} label="Total Audits" value={audits.length} color="#4A57B9" bg="#EEF0FB" />
        <KpiCard icon={CheckCircle2} label="Completed" value={completed} color="#10B981" bg="#D1FAE5" />
        <KpiCard icon={AlertTriangle} label="Findings" value={findings.length} color="#EF4444" bg="#FEE2E2" />
        <KpiCard icon={BookOpen} label="Checklists" value={checklists.length} color="#8B5CF6" bg="#EDE9FE" />
      </div>

      {/* Checklists quick-create */}
      <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
        <h3 className="text-[14px] font-bold mb-3" style={{ color: "#111827" }}>Audit Checklists</h3>
        <div className="flex gap-3 mb-4">
          {(["name", "standard", "version", "audit_type"] as const).map((k) => (
            <div key={k} className="flex-1">
              <label className={labelCls} style={labelStyle}>{k.replace("_", " ")}</label>
              {k === "audit_type" ? (
                <select className={inputCls} style={inputStyle} value={clForm[k]} onChange={(e) => setClForm((f) => ({ ...f, [k]: e.target.value }))}>
                  {["Internal", "External", "Regulatory", "Supplier"].map((t) => <option key={t}>{t}</option>)}
                </select>
              ) : (
                <input className={inputCls} style={inputStyle} value={clForm[k]} onChange={(e) => setClForm((f) => ({ ...f, [k]: e.target.value }))} placeholder={k === "name" ? "Q1 Safety Checklist" : k === "standard" ? "ISO 45001" : "1.0"} />
              )}
            </div>
          ))}
          <div className="flex items-end">
            <button onClick={async () => {
              if (!clForm.name.trim()) return;
              await createChecklist({ name: clForm.name, standard: clForm.standard, version: clForm.version, audit_type: clForm.audit_type });
              setClForm({ name: "", standard: "ISO 45001", version: "1.0", audit_type: "Internal" });
            }} disabled={clCreating} className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50 whitespace-nowrap" style={{ background: "#4A57B9" }}>
              <Plus className="w-3.5 h-3.5 inline mr-1" /> Add
            </button>
          </div>
        </div>
        {clLoading ? <LoadingSpinner /> : (
          <div className="flex flex-wrap gap-2">
            {checklists.map((c) => {
              const sc = statusColor(c.status);
              return (
                <div key={c.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ borderColor: "#E3E9F6" }}>
                  <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>{c.name}</span>
                  <Badge label={c.status} color={sc.color} bg={sc.bg} />
                  {c.status === "draft" && (
                    <button onClick={() => publishCl(c.id)} className="text-[11px] font-semibold" style={{ color: "#4A57B9" }}>Publish</button>
                  )}
                </div>
              );
            })}
            {checklists.length === 0 && <p className="text-[13px]" style={{ color: "#9CA3AF" }}>No checklists yet</p>}
          </div>
        )}
      </div>

      {/* Audits table */}
      <div className="bg-white rounded-2xl border" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>Audit Executions</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search audits..." className="pl-9 pr-3 py-2 rounded-xl border text-[13px] outline-none w-48" style={{ borderColor: "#E3E9F6", background: "#F8FAFF" }} />
            </div>
            <button onClick={() => setShowAudit(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white" style={{ background: "#4A57B9" }}>
              <Plus className="w-3.5 h-3.5" /> Schedule Audit
            </button>
          </div>
        </div>
        {auditsLoading ? <LoadingSpinner /> : filteredAudits.length === 0 ? (
          <EmptyState icon={ClipboardList} text={search ? "No audits match" : "No audits scheduled yet."} />
        ) : (
          <div className="divide-y" style={{ borderColor: "#E3E9F6" }}>
            {filteredAudits.map((a) => {
              const sc = statusColor(a.status);
              const isOpen = expanded === a.id;
              const auditFindings = findings.filter((f) => f.audit_id === a.id);
              return (
                <div key={a.id}>
                  <button className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left" onClick={() => setExpanded(isOpen ? null : a.id)}>
                    {isOpen ? <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "#94A3B8" }} /> : <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "#94A3B8" }} />}
                    <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                      <div>
                        <div className="text-[13px] font-bold" style={{ color: "#111827" }}>{a.title}</div>
                        <div className="text-[11px]" style={{ color: "#6B7280" }}>{a.checklist_name || "No checklist"}</div>
                      </div>
                      <div className="text-[13px]" style={{ color: "#374151" }}>{a.audit_type || "Internal"}</div>
                      <Badge label={a.status} color={sc.color} bg={sc.bg} />
                      <div className="text-[12px]" style={{ color: "#6B7280" }}>
                        {a.scheduled_date ? `Scheduled: ${a.scheduled_date}` : "No date set"}
                      </div>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-14 pb-4 border-t space-y-3" style={{ borderColor: "#F1F5F9" }}>
                      <div className="flex gap-2 mt-3">
                        {a.status === "scheduled" && (
                          <button onClick={() => markStatus(a, "in_progress")} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: "#F59E0B" }}>Mark In Progress</button>
                        )}
                        {a.status === "in_progress" && (
                          <button onClick={() => markStatus(a, "completed")} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: "#10B981" }}>Mark Completed</button>
                        )}
                      </div>
                      {auditFindings.length > 0 && (
                        <div>
                          <div className="text-[11px] font-bold mb-2" style={{ color: "#6B7280" }}>FINDINGS ({auditFindings.length})</div>
                          <div className="space-y-1.5">
                            {auditFindings.map((f) => {
                              const fc = severityColor(f.severity);
                              return (
                                <div key={f.id} className="flex items-center gap-2 text-[13px]">
                                  <Badge label={f.severity} color={fc.color} bg={fc.bg} />
                                  <span style={{ color: "#374151" }}>{f.title}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab 4: Inspections ─────────────────────────────────────────────────────

function InspectionsTab() {
  const { data: inspections = [], isLoading } = useGetInspectionsQuery();
  const [createInspection, { isLoading: creating }] = useCreateInspectionMutation();
  const [form, setForm] = useState({ title: "", audit_type: "Safety Inspection", scheduled_date: "" });
  const [search, setSearch] = useState("");
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const filtered = inspections.filter((i) => {
    const q = search.toLowerCase();
    return (i.title + (i.audit_type || "") + i.status).toLowerCase().includes(q);
  });

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    await createInspection({ title: form.title, audit_type: form.audit_type, scheduled_date: form.scheduled_date || undefined });
    setForm({ title: "", audit_type: "Safety Inspection", scheduled_date: "" });
  };

  const completed = inspections.filter((i) => i.status === "completed").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={Search} label="Total Inspections" value={inspections.length} color="#4A57B9" bg="#EEF0FB" />
        <KpiCard icon={CheckCircle2} label="Completed" value={completed} color="#10B981" bg="#D1FAE5" />
        <KpiCard icon={Clock} label="Scheduled" value={inspections.filter((i) => i.status === "scheduled").length} color="#6B7280" bg="#F3F4F6" />
        <KpiCard icon={AlertTriangle} label="In Progress" value={inspections.filter((i) => i.status === "in_progress").length} color="#F59E0B" bg="#FEF3C7" />
      </div>

      <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
        <h3 className="text-[14px] font-bold mb-3" style={{ color: "#111827" }}>Schedule Inspection</h3>
        <div className="flex gap-3">
          <div className="flex-1"><label className={labelCls} style={labelStyle}>Title</label><input className={inputCls} style={inputStyle} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Site Safety Inspection" /></div>
          <div className="w-48"><label className={labelCls} style={labelStyle}>Type</label>
            <select className={inputCls} style={inputStyle} value={form.audit_type} onChange={(e) => set("audit_type", e.target.value)}>
              {["Safety Inspection", "Inspection", "Site Inspection", "Fire Safety", "Equipment Check"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="w-44"><label className={labelCls} style={labelStyle}>Date</label><input type="date" className={inputCls} style={inputStyle} value={form.scheduled_date} onChange={(e) => set("scheduled_date", e.target.value)} /></div>
          <div className="flex items-end">
            <button onClick={handleCreate} disabled={creating || !form.title.trim()} className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: "#4A57B9" }}>
              <Plus className="w-3.5 h-3.5 inline mr-1" /> Schedule
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>All Inspections</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-9 pr-3 py-2 rounded-xl border text-[13px] outline-none w-44" style={{ borderColor: "#E3E9F6", background: "#F8FAFF" }} />
          </div>
        </div>
        {isLoading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState icon={Search} text={search ? "No inspections match" : "No inspections scheduled yet."} />
        ) : (
          <table className="w-full">
            <TableHead cols={["Title", "Type", "Status", "Scheduled", "Completed"]} />
            <tbody>
              {filtered.map((ins) => {
                const sc = statusColor(ins.status);
                return (
                  <tr key={ins.id} className="border-t hover:bg-slate-50 transition-colors" style={{ borderColor: "#E3E9F6" }}>
                    <td className="px-5 py-3 text-[13px] font-semibold" style={{ color: "#111827" }}>{ins.title}</td>
                    <td className="px-5 py-3 text-[13px]" style={{ color: "#374151" }}>{ins.audit_type || "—"}</td>
                    <td className="px-5 py-3"><Badge label={ins.status} color={sc.color} bg={sc.bg} /></td>
                    <td className="px-5 py-3 text-[13px]" style={{ color: "#6B7280" }}>{ins.scheduled_date || "—"}</td>
                    <td className="px-5 py-3 text-[13px]" style={{ color: "#6B7280" }}>{ins.completed_date || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Tab 5: CAPA ────────────────────────────────────────────────────────────

function CreateCapaModal({ onClose }: { onClose: () => void }) {
  const [createCapa, { isLoading }] = useCreateCapaMutation();
  const [form, setForm] = useState({
    title: "", description: "", source_type: "Audit Finding", due_date: "",
    severity: "medium", root_cause: "", corrective_action: "",
  });
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError("Title is required"); return; }
    try {
      await createCapa({
        title: form.title.trim(), description: form.description || undefined,
        source_type: form.source_type, due_date: form.due_date || undefined,
        severity: form.severity, root_cause: form.root_cause || undefined,
        corrective_action: form.corrective_action || undefined,
      }).unwrap();
      onClose();
    } catch { setError("Failed to create CAPA."); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[16px] font-bold" style={{ color: "#111827" }}>Create CAPA</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" style={{ color: "#6B7280" }} /></button>
        </div>
        <div className="px-6 py-4 space-y-3">
          {error && <p className="text-[13px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className={labelCls} style={labelStyle}>Title *</label><input className={inputCls} style={inputStyle} value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
            <div><label className={labelCls} style={labelStyle}>Source Type</label>
              <select className={inputCls} style={inputStyle} value={form.source_type} onChange={(e) => set("source_type", e.target.value)}>
                {["Audit Finding", "Incident", "Inspection", "Risk Assessment", "Observation"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className={labelCls} style={labelStyle}>Severity</label>
              <select className={inputCls} style={inputStyle} value={form.severity} onChange={(e) => set("severity", e.target.value)}>
                {["critical", "high", "medium", "low"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2"><label className={labelCls} style={labelStyle}>Due Date</label><input type="date" className={inputCls} style={inputStyle} value={form.due_date} onChange={(e) => set("due_date", e.target.value)} /></div>
            <div className="col-span-2"><label className={labelCls} style={labelStyle}>Description</label><input className={inputCls} style={inputStyle} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
            <div className="col-span-2"><label className={labelCls} style={labelStyle}>Root Cause</label><input className={inputCls} style={inputStyle} value={form.root_cause} onChange={(e) => set("root_cause", e.target.value)} /></div>
            <div className="col-span-2"><label className={labelCls} style={labelStyle}>Corrective Action</label><input className={inputCls} style={inputStyle} value={form.corrective_action} onChange={(e) => set("corrective_action", e.target.value)} /></div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "#E3E9F6" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-semibold hover:bg-slate-50" style={{ color: "#6B7280" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={isLoading} className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: "#4A57B9" }}>
            {isLoading ? "Creating..." : "Create CAPA"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CapaTab() {
  const { data: capas = [], isLoading } = useGetCapasQuery();
  const [submitClosure] = useSubmitCapaClosureMutation();
  const [approveClosure] = useApproveCapaClosureMutation();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = capas.filter((c) => {
    const q = search.toLowerCase();
    return (c.title + c.source_type + c.status + c.severity).toLowerCase().includes(q);
  });

  const open = capas.filter((c) => c.status === "open").length;
  const overdue = capas.filter((c) => c.overdue).length;
  const pendingApproval = capas.filter((c) => c.status === "pending_approval").length;
  const closed = capas.filter((c) => c.status === "closed").length;

  return (
    <div className="space-y-6">
      {showCreate && <CreateCapaModal onClose={() => setShowCreate(false)} />}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={AlertTriangle} label="Open CAPAs" value={open} color="#EF4444" bg="#FEE2E2" />
        <KpiCard icon={Clock} label="Overdue" value={overdue} color="#DC2626" bg="#FEE2E2" />
        <KpiCard icon={AlertCircle} label="Pending Approval" value={pendingApproval} color="#8B5CF6" bg="#EDE9FE" />
        <KpiCard icon={CheckCircle2} label="Closed" value={closed} color="#10B981" bg="#D1FAE5" />
      </div>

      <div className="bg-white rounded-2xl border" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>CAPA Register</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search CAPAs..." className="pl-9 pr-3 py-2 rounded-xl border text-[13px] outline-none w-48" style={{ borderColor: "#E3E9F6", background: "#F8FAFF" }} />
            </div>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white" style={{ background: "#4A57B9" }}>
              <Plus className="w-3.5 h-3.5" /> Create CAPA
            </button>
          </div>
        </div>
        {isLoading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState icon={AlertTriangle} text={search ? "No CAPAs match" : "No CAPAs created yet."} />
        ) : (
          <div className="divide-y" style={{ borderColor: "#E3E9F6" }}>
            {filtered.map((capa: CapaRecord) => {
              const sc = statusColor(capa.status);
              const sev = severityColor(capa.severity);
              const isOpen = expanded === capa.id;
              return (
                <div key={capa.id}>
                  <button className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left" onClick={() => setExpanded(isOpen ? null : capa.id)}>
                    {isOpen ? <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "#94A3B8" }} /> : <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "#94A3B8" }} />}
                    <div className="flex-1 grid grid-cols-5 gap-3 items-center">
                      <div className="col-span-2">
                        <div className="text-[13px] font-bold flex items-center gap-1.5" style={{ color: "#111827" }}>
                          {capa.overdue && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                          {capa.title}
                        </div>
                        <div className="text-[11px]" style={{ color: "#6B7280" }}>{capa.source_type}</div>
                      </div>
                      <div className="flex gap-2">
                        <Badge label={capa.severity} color={sev.color} bg={sev.bg} />
                        <Badge label={capa.status.replace("_", " ")} color={sc.color} bg={sc.bg} />
                      </div>
                      <div className="text-[12px]" style={{ color: capa.overdue ? "#EF4444" : "#6B7280" }}>
                        {capa.due_date ? `Due: ${capa.due_date}` : "No due date"}
                      </div>
                      <div className="text-[12px]" style={{ color: "#6B7280" }}>
                        {capa.days_left != null ? (capa.days_left < 0 ? `${Math.abs(capa.days_left)}d overdue` : `${capa.days_left}d left`) : "—"}
                      </div>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-14 pb-4 border-t space-y-3" style={{ borderColor: "#F1F5F9" }}>
                      {capa.description && <p className="text-[13px] mt-3" style={{ color: "#374151" }}>{capa.description}</p>}
                      {capa.root_cause && <div><span className="text-[11px] font-bold" style={{ color: "#6B7280" }}>ROOT CAUSE: </span><span className="text-[13px]" style={{ color: "#374151" }}>{capa.root_cause}</span></div>}
                      {capa.corrective_action && <div><span className="text-[11px] font-bold" style={{ color: "#6B7280" }}>CORRECTIVE ACTION: </span><span className="text-[13px]" style={{ color: "#374151" }}>{capa.corrective_action}</span></div>}
                      <div className="flex gap-2 mt-2">
                        {capa.status === "open" && (
                          <button onClick={() => submitClosure(capa.id)} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: "#8B5CF6" }}>Submit Closure</button>
                        )}
                        {capa.status === "pending_approval" && (
                          <button onClick={() => approveClosure(capa.id)} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: "#10B981" }}>Approve Closure</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab 6: Regulatory Tracking ─────────────────────────────────────────────

function CreateRegulatoryModal({ onClose }: { onClose: () => void }) {
  const [create, { isLoading }] = useCreateRegulatoryRequirementMutation();
  const [form, setForm] = useState({
    regulation_name: "", jurisdiction: "", category: "Environmental", description: "",
    due_date: "", status: "Pending", owner: "", notes: "",
  });
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.regulation_name.trim()) { setError("Regulation name is required"); return; }
    try {
      await create({
        regulation_name: form.regulation_name.trim(), jurisdiction: form.jurisdiction || undefined,
        category: form.category, description: form.description || undefined,
        due_date: form.due_date || undefined, status: form.status,
        owner: form.owner || undefined, notes: form.notes || undefined,
      }).unwrap();
      onClose();
    } catch { setError("Failed to create requirement."); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[16px] font-bold" style={{ color: "#111827" }}>Add Regulatory Requirement</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" style={{ color: "#6B7280" }} /></button>
        </div>
        <div className="px-6 py-4 space-y-3">
          {error && <p className="text-[13px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className={labelCls} style={labelStyle}>Regulation Name *</label><input className={inputCls} style={inputStyle} value={form.regulation_name} onChange={(e) => set("regulation_name", e.target.value)} placeholder="OSHA 29 CFR 1910.119" /></div>
            <div><label className={labelCls} style={labelStyle}>Jurisdiction</label><input className={inputCls} style={inputStyle} value={form.jurisdiction} onChange={(e) => set("jurisdiction", e.target.value)} placeholder="Federal / State / Local" /></div>
            <div><label className={labelCls} style={labelStyle}>Category</label>
              <select className={inputCls} style={inputStyle} value={form.category} onChange={(e) => set("category", e.target.value)}>
                {["Environmental", "Safety", "Health", "Fire", "Chemical", "Electrical", "Construction", "Other"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className={labelCls} style={labelStyle}>Status</label>
              <select className={inputCls} style={inputStyle} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {["Compliant", "Non-Compliant", "Pending", "Under Review"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className={labelCls} style={labelStyle}>Due Date</label><input type="date" className={inputCls} style={inputStyle} value={form.due_date} onChange={(e) => set("due_date", e.target.value)} /></div>
            <div><label className={labelCls} style={labelStyle}>Owner</label><input className={inputCls} style={inputStyle} value={form.owner} onChange={(e) => set("owner", e.target.value)} /></div>
            <div><label className={labelCls} style={labelStyle}>Notes</label><input className={inputCls} style={inputStyle} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
            <div className="col-span-2"><label className={labelCls} style={labelStyle}>Description</label><input className={inputCls} style={inputStyle} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "#E3E9F6" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-semibold hover:bg-slate-50" style={{ color: "#6B7280" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={isLoading} className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: "#4A57B9" }}>
            {isLoading ? "Saving..." : "Add Requirement"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RegulatoryTrackingTab() {
  const { data: reqs = [], isLoading } = useGetRegulatoryRequirementsQuery();
  const [updateReq] = useUpdateRegulatoryRequirementMutation();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = reqs.filter((r) => {
    const q = search.toLowerCase();
    return (r.regulation_name + (r.jurisdiction || "") + (r.category || "") + r.status).toLowerCase().includes(q);
  });

  const compliant = reqs.filter((r) => r.status === "Compliant").length;
  const nonCompliant = reqs.filter((r) => r.status === "Non-Compliant").length;

  const markReviewed = async (r: RegulatoryRequirement) => {
    await updateReq({ id: r.id, data: { last_reviewed_date: new Date().toISOString().slice(0, 10) } });
  };

  return (
    <div className="space-y-6">
      {showCreate && <CreateRegulatoryModal onClose={() => setShowCreate(false)} />}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={Gavel} label="Total Requirements" value={reqs.length} color="#4A57B9" bg="#EEF0FB" />
        <KpiCard icon={CheckCircle2} label="Compliant" value={compliant} color="#10B981" bg="#D1FAE5" />
        <KpiCard icon={AlertTriangle} label="Non-Compliant" value={nonCompliant} color="#EF4444" bg="#FEE2E2" />
        <KpiCard icon={Clock} label="Pending / Under Review" value={reqs.length - compliant - nonCompliant} color="#F59E0B" bg="#FEF3C7" />
      </div>

      <div className="bg-white rounded-2xl border" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>Regulatory Register</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search regulations..." className="pl-9 pr-3 py-2 rounded-xl border text-[13px] outline-none w-48" style={{ borderColor: "#E3E9F6", background: "#F8FAFF" }} />
            </div>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white" style={{ background: "#4A57B9" }}>
              <Plus className="w-3.5 h-3.5" /> Add Requirement
            </button>
          </div>
        </div>
        {isLoading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState icon={Gavel} text={search ? "No regulations match" : "No regulatory requirements added yet."} />
        ) : (
          <table className="w-full">
            <TableHead cols={["Regulation", "Jurisdiction", "Category", "Status", "Due Date", "Owner", "Last Reviewed"]} />
            <tbody>
              {filtered.map((r) => {
                const sc = statusColor(r.status.toLowerCase().replace(" ", "_").replace("-", "_"));
                return (
                  <tr key={r.id} className="border-t hover:bg-slate-50 transition-colors" style={{ borderColor: "#E3E9F6" }}>
                    <td className="px-5 py-3">
                      <div className="text-[13px] font-bold" style={{ color: "#111827" }}>{r.regulation_name}</div>
                      {r.description && <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{r.description.slice(0, 60)}</div>}
                    </td>
                    <td className="px-5 py-3 text-[13px]" style={{ color: "#374151" }}>{r.jurisdiction || "—"}</td>
                    <td className="px-5 py-3 text-[13px]" style={{ color: "#374151" }}>{r.category || "—"}</td>
                    <td className="px-5 py-3"><Badge label={r.status} color={sc.color} bg={sc.bg} /></td>
                    <td className="px-5 py-3 text-[13px]" style={{ color: r.days_until_due != null && r.days_until_due < 0 ? "#EF4444" : "#6B7280" }}>
                      {r.due_date || "—"}
                    </td>
                    <td className="px-5 py-3 text-[13px]" style={{ color: "#374151" }}>{r.owner || "—"}</td>
                    <td className="px-5 py-3">
                      <div className="text-[12px]" style={{ color: "#6B7280" }}>{r.last_reviewed_date || "Never"}</div>
                      <button onClick={() => markReviewed(r)} className="text-[11px] font-semibold mt-0.5" style={{ color: "#4A57B9" }}>Mark Reviewed</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Tab 7: Documentation ───────────────────────────────────────────────────

function CreateDocumentModal({ onClose }: { onClose: () => void }) {
  const [create, { isLoading }] = useCreateComplianceDocumentMutation();
  const [form, setForm] = useState({
    title: "", document_type: "Policy", category: "Safety", version: "1.0",
    status: "Draft", description: "", effective_date: "",
  });
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError("Title is required"); return; }
    try {
      await create({
        title: form.title.trim(), document_type: form.document_type, category: form.category || undefined,
        version: form.version || undefined, status: form.status,
        description: form.description || undefined, effective_date: form.effective_date || undefined,
      }).unwrap();
      onClose();
    } catch { setError("Failed to create document."); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[16px] font-bold" style={{ color: "#111827" }}>Add Document</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" style={{ color: "#6B7280" }} /></button>
        </div>
        <div className="px-6 py-4 space-y-3">
          {error && <p className="text-[13px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className={labelCls} style={labelStyle}>Title *</label><input className={inputCls} style={inputStyle} value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
            <div><label className={labelCls} style={labelStyle}>Document Type</label>
              <select className={inputCls} style={inputStyle} value={form.document_type} onChange={(e) => set("document_type", e.target.value)}>
                {["Policy", "Procedure", "Form", "Template", "Report", "Register", "Plan"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className={labelCls} style={labelStyle}>Category</label>
              <select className={inputCls} style={inputStyle} value={form.category} onChange={(e) => set("category", e.target.value)}>
                {["Safety", "Environmental", "Quality", "HR", "Operations", "Legal", "Other"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className={labelCls} style={labelStyle}>Version</label><input className={inputCls} style={inputStyle} value={form.version} onChange={(e) => set("version", e.target.value)} /></div>
            <div><label className={labelCls} style={labelStyle}>Status</label>
              <select className={inputCls} style={inputStyle} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {["Draft", "Active", "Under Review", "Archived"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2"><label className={labelCls} style={labelStyle}>Effective Date</label><input type="date" className={inputCls} style={inputStyle} value={form.effective_date} onChange={(e) => set("effective_date", e.target.value)} /></div>
            <div className="col-span-2"><label className={labelCls} style={labelStyle}>Description</label><input className={inputCls} style={inputStyle} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "#E3E9F6" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-semibold hover:bg-slate-50" style={{ color: "#6B7280" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={isLoading} className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: "#4A57B9" }}>
            {isLoading ? "Saving..." : "Add Document"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DocumentationTab() {
  const { data: docs = [], isLoading } = useGetComplianceDocumentsQuery();
  const [updateDoc] = useUpdateComplianceDocumentMutation();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = docs.filter((d) => {
    const q = search.toLowerCase();
    return (d.title + d.document_type + (d.category || "") + d.status).toLowerCase().includes(q);
  });

  const active = docs.filter((d) => d.status === "Active").length;
  const byType = docs.reduce<Record<string, number>>((acc, d) => {
    acc[d.document_type] = (acc[d.document_type] || 0) + 1;
    return acc;
  }, {});

  const cycleDocStatus = async (d: ComplianceDocument) => {
    const next = d.status === "Draft" ? "Active" : d.status === "Active" ? "Under Review" : d.status === "Under Review" ? "Archived" : "Draft";
    await updateDoc({ id: d.id, data: { status: next } });
  };

  return (
    <div className="space-y-6">
      {showCreate && <CreateDocumentModal onClose={() => setShowCreate(false)} />}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={FolderOpen} label="Total Documents" value={docs.length} color="#4A57B9" bg="#EEF0FB" />
        <KpiCard icon={CheckCircle2} label="Active" value={active} color="#10B981" bg="#D1FAE5" />
        <KpiCard icon={AlertCircle} label="Draft" value={docs.filter((d) => d.status === "Draft").length} color="#F59E0B" bg="#FEF3C7" />
        <KpiCard icon={BarChart3} label="Document Types" value={Object.keys(byType).length} color="#8B5CF6" bg="#EDE9FE" />
      </div>

      {/* Type breakdown */}
      {Object.keys(byType).length > 0 && (
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <h3 className="text-[14px] font-bold mb-3" style={{ color: "#111827" }}>By Document Type</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byType).map(([type, count]) => (
              <div key={type} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[13px]" style={{ borderColor: "#E3E9F6" }}>
                <FileText className="w-3.5 h-3.5" style={{ color: "#4A57B9" }} />
                <span style={{ color: "#374151" }}>{type}</span>
                <span className="font-bold" style={{ color: "#4A57B9" }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>Document Library</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents..." className="pl-9 pr-3 py-2 rounded-xl border text-[13px] outline-none w-48" style={{ borderColor: "#E3E9F6", background: "#F8FAFF" }} />
            </div>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white" style={{ background: "#4A57B9" }}>
              <Plus className="w-3.5 h-3.5" /> Add Document
            </button>
          </div>
        </div>
        {isLoading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState icon={FolderOpen} text={search ? "No documents match" : "No compliance documents added yet."} />
        ) : (
          <table className="w-full">
            <TableHead cols={["Title", "Type", "Category", "Version", "Created By", "Effective", "Status"]} />
            <tbody>
              {filtered.map((d) => {
                const sc = statusColor(d.status.toLowerCase().replace(" ", "_"));
                return (
                  <tr key={d.id} className="border-t hover:bg-slate-50 transition-colors" style={{ borderColor: "#E3E9F6" }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#4A57B9" }} />
                        <div>
                          <div className="text-[13px] font-bold" style={{ color: "#111827" }}>{d.title}</div>
                          {d.description && <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{d.description.slice(0, 50)}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[13px]" style={{ color: "#374151" }}>{d.document_type}</td>
                    <td className="px-5 py-3 text-[13px]" style={{ color: "#374151" }}>{d.category || "—"}</td>
                    <td className="px-5 py-3 text-[13px]" style={{ color: "#374151" }}>{d.version || "—"}</td>
                    <td className="px-5 py-3 text-[13px]" style={{ color: "#374151" }}>{d.created_by || "—"}</td>
                    <td className="px-5 py-3 text-[13px]" style={{ color: "#6B7280" }}>{d.effective_date || "—"}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => cycleDocStatus(d)} title="Click to cycle status">
                        <Badge label={d.status} color={sc.color} bg={sc.bg} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "dashboard",     label: "Compliance Dashboard", icon: LayoutDashboard },
  { id: "standards",     label: "Standards & Policies", icon: BookMarked },
  { id: "audits",        label: "Audit Management",     icon: ClipboardList },
  { id: "inspections",   label: "Inspections",          icon: Search },
  { id: "capa",          label: "CAPA",                 icon: AlertTriangle },
  { id: "regulatory",    label: "Regulatory Tracking",  icon: Gavel },
  { id: "documentation", label: "Documentation",        icon: FolderOpen },
];

export function CompliancePage() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold" style={{ color: "#111827" }}>Compliance Management</h1>
        <p className="text-[13px] mt-0.5" style={{ color: "#6B7280" }}>Track audits, CAPAs, standards, regulatory requirements, and compliance documentation.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl border flex-wrap" style={{ borderColor: "#E3E9F6", background: "#F8FAFF" }}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all"
              style={active ? { background: "#fff", color: "#4A57B9", boxShadow: "0 1px 4px rgba(74,87,185,0.15)" } : { color: "#6B7280" }}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "dashboard"     && <ComplianceDashboardTab />}
      {activeTab === "standards"     && <StandardsPoliciesTab />}
      {activeTab === "audits"        && <AuditManagementTab />}
      {activeTab === "inspections"   && <InspectionsTab />}
      {activeTab === "capa"          && <CapaTab />}
      {activeTab === "regulatory"    && <RegulatoryTrackingTab />}
      {activeTab === "documentation" && <DocumentationTab />}
    </div>
  );
}
