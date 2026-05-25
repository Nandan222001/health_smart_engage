import { useState, useMemo } from "react";
import {
  ClipboardCheck, Search, CheckCircle2, Clock, AlertTriangle,
  XCircle, RefreshCw, TrendingUp, Calendar, ChevronDown,
  ChevronRight, FileSearch, AlertCircle, BarChart3,
  CalendarClock, Layers, ShieldAlert, BookOpen, Filter,
} from "lucide-react";
import { useListEmployeesQuery, type Employee } from "@/features/employees/api/employeesApi";
import { useListAuditChecklistsQuery, useListCAPAsQuery } from "@/features/audits/api/auditsApi";

// ── Types ──────────────────────────────────────────────────────────────────

type TabId = "assigned" | "completed" | "findings" | "nonconformities" | "schedules";

// ── Deterministic seeded helpers ───────────────────────────────────────────

function seeded(id: string, offset = 0) {
  const s = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + offset;
  const x = Math.sin(s + 1) * 10000;
  return x - Math.floor(x);
}

const AUDIT_TYPES    = ["Safety Inspection", "Environmental Compliance", "Fire Safety", "PPE Audit", "Chemical Handling", "Electrical Safety", "Emergency Preparedness", "Work at Height"];
const SITES          = ["North Plant", "South Zone", "West Gate", "Central Hub", "East Block"];
const FINDING_DESCS  = [
  "Inadequate PPE storage near chemical handling area",
  "Fire extinguisher inspection overdue by 14 days",
  "Emergency exit partially blocked by equipment",
  "Safety signage missing in Zone C corridor",
  "Spill kit not restocked after last incident",
  "Monthly safety drill not documented",
  "Lockout/tagout procedure not followed",
  "Hot work permit expired before job completion",
];
const NC_TYPES = ["Documentation Gap", "Procedural Non-Compliance", "Equipment Deficiency", "Training Non-Compliance", "Regulatory Breach", "PPE Violation"];
const SCHEDULE_FREQ  = ["Monthly", "Quarterly", "Bi-Annual", "Annual"];

const NCR_LEVELS = [
  { label: "Critical",     color: "#991B1B", bg: "#FEF2F2" },
  { label: "Major",        color: "#EF4444", bg: "#FEE2E2" },
  { label: "Minor",        color: "#F59E0B", bg: "#FEF3C7" },
  { label: "Observation",  color: "#6B7280", bg: "#F3F4F6" },
] as const;

const AUDIT_KEYWORDS = ["auditor", "audit", "inspector", "inspection"];

function isAuditor(emp: Employee) {
  return AUDIT_KEYWORDS.some((kw) => (emp.role ?? "").toLowerCase().includes(kw));
}

function auditorMeta(id: string) {
  const assignedTotal   = Math.floor(seeded(id, 1) * 6) + 3;
  const assignedActive  = Math.floor(seeded(id, 2) * assignedTotal);
  const completedTotal  = Math.floor(seeded(id, 3) * 20) + 8;
  const avgScore        = Math.round(seeded(id, 4) * 25) + 75;   // 75-100
  const findingsPending = Math.floor(seeded(id, 5) * 6) + 1;
  const findingsClosed  = Math.floor(seeded(id, 6) * 15) + 5;
  const ncrOpen         = Math.floor(seeded(id, 7) * 4);
  const ncrClosed       = Math.floor(seeded(id, 8) * 10) + 3;
  const nextAuditDays   = Math.floor(seeded(id, 9) * 28) + 1;
  return { assignedTotal, assignedActive, completedTotal, avgScore, findingsPending, findingsClosed, ncrOpen, ncrClosed, nextAuditDays };
}

// ── Shared UI ──────────────────────────────────────────────────────────────

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const dim = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";
  return (
    <div className={`${dim} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ background: "linear-gradient(135deg, #1D3FAA, #5B6DE8)" }}>
      {initials}
    </div>
  );
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ color, background: bg }}>
      {label}
    </span>
  );
}

function ProgressBar({ value, color = "#4A57B9" }: { value: number; color?: string }) {
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${Math.min(value, 100)}%`, background: color }} />
    </div>
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

// ── Auditor chip filter bar ────────────────────────────────────────────────

function AuditorFilter({ auditors, selected, onChange }: {
  auditors: Employee[]; selected: string; onChange: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => onChange("all")}
        className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
        style={{ background: selected === "all" ? "#4A57B9" : "#F1F5F9", color: selected === "all" ? "#fff" : "#374151" }}
      >
        All Auditors
      </button>
      {auditors.map((a) => (
        <button
          key={a.id}
          onClick={() => onChange(a.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
          style={{ background: selected === a.id ? "#4A57B9" : "#F1F5F9", color: selected === a.id ? "#fff" : "#374151" }}
        >
          {a.name.split(" ")[0]}
        </button>
      ))}
    </div>
  );
}

// ── Tab 1: Assigned Audits ────────────────────────────────────────────────

const ASSIGN_STATUS = [
  { label: "Assigned",    color: "#4A57B9", bg: "#EEF2FF" },
  { label: "In Progress", color: "#F59E0B", bg: "#FEF3C7" },
  { label: "Overdue",     color: "#EF4444", bg: "#FEE2E2" },
] as const;
const PRIORITY = [
  { label: "High",   color: "#EF4444", bg: "#FEE2E2" },
  { label: "Medium", color: "#F59E0B", bg: "#FEF3C7" },
  { label: "Low",    color: "#10B981", bg: "#D1FAE5" },
] as const;

function AssignedTab({ auditors }: { auditors: Employee[] }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(auditors[0]?.id ?? null);

  const filtered = auditors.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.department ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const totalAssigned = auditors.reduce((s, a) => s + auditorMeta(a.id).assignedTotal, 0);
  const totalActive   = auditors.reduce((s, a) => s + auditorMeta(a.id).assignedActive, 0);

  return (
    <div className="space-y-5">
      {/* Mini KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Audits Assigned", value: totalAssigned,                            color: "#4A57B9", bg: "#EEF2FF",  icon: ClipboardCheck },
          { label: "Currently Active",      value: totalActive,                              color: "#F59E0B", bg: "#FEF3C7",  icon: Clock },
          { label: "Auditors on Duty",      value: auditors.filter((a) => a.status === "active").length, color: "#10B981", bg: "#D1FAE5", icon: CheckCircle2 },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: "#E3E9F6" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-[20px] font-bold" style={{ color: "#111827" }}>{s.value}</div>
              <div className="text-[11px] font-semibold" style={{ color: "#6B7280" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
        <input
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
          style={{ borderColor: "#E3E9F6", background: "#F9FAFB" }}
          placeholder="Search auditors…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardCheck} text="No auditors found" />
      ) : (
        <div className="space-y-3">
          {filtered.map((auditor) => {
            const meta   = auditorMeta(auditor.id);
            const isOpen = expanded === auditor.id;

            const audits = Array.from({ length: meta.assignedTotal }, (_, i) => {
              const statusIdx   = i < meta.assignedActive ? Math.floor(seeded(auditor.id, 20 + i) * 2) + 1 : 0;
              const typeIdx     = Math.floor(seeded(auditor.id, 30 + i) * AUDIT_TYPES.length);
              const siteIdx     = Math.floor(seeded(auditor.id, 40 + i) * SITES.length);
              const priorityIdx = Math.floor(seeded(auditor.id, 50 + i) * PRIORITY.length);
              const dueInDays   = Math.floor(seeded(auditor.id, 60 + i) * 20) - 3;
              const dueDate     = new Date(Date.now() + dueInDays * 86400000).toLocaleDateString();
              const overdue     = dueInDays < 0;
              return {
                id: `${auditor.id}-a${i}`,
                name: AUDIT_TYPES[typeIdx],
                site: SITES[siteIdx],
                status: overdue ? ASSIGN_STATUS[2] : ASSIGN_STATUS[statusIdx],
                priority: PRIORITY[priorityIdx],
                dueDate,
                overdue,
              };
            });

            return (
              <div key={auditor.id} className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors text-left"
                  onClick={() => setExpanded(isOpen ? null : auditor.id)}
                >
                  <Avatar name={auditor.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[14px] font-bold" style={{ color: "#111827" }}>{auditor.name}</span>
                      <Badge
                        label={auditor.status === "active" ? "Active" : "Inactive"}
                        color={auditor.status === "active" ? "#10B981" : "#6B7280"}
                        bg={auditor.status === "active" ? "#D1FAE5" : "#F3F4F6"}
                      />
                    </div>
                    <div className="text-[11px]" style={{ color: "#9CA3AF" }}>
                      {auditor.department || "—"} · {auditor.role || "Auditor"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge label={`${meta.assignedTotal} audits`} color="#4A57B9" bg="#EEF2FF" />
                    {meta.assignedActive > 0 && (
                      <Badge label={`${meta.assignedActive} active`} color="#F59E0B" bg="#FEF3C7" />
                    )}
                    {isOpen
                      ? <ChevronDown className="w-4 h-4" style={{ color: "#94A3B8" }} />
                      : <ChevronRight className="w-4 h-4" style={{ color: "#94A3B8" }} />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t" style={{ borderColor: "#F1F5F9" }}>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <TableHead cols={["Audit Name", "Site", "Priority", "Status", "Due Date"]} />
                        <tbody className="divide-y" style={{ borderColor: "#F8FAFF" }}>
                          {audits.map((a) => (
                            <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <ClipboardCheck className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#94A3B8" }} />
                                  <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>{a.name}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-[12px]" style={{ color: "#6B7280" }}>{a.site}</td>
                              <td className="px-5 py-3"><Badge label={a.priority.label} color={a.priority.color} bg={a.priority.bg} /></td>
                              <td className="px-5 py-3"><Badge label={a.status.label} color={a.status.color} bg={a.status.bg} /></td>
                              <td className="px-5 py-3 text-[12px]" style={{ color: a.overdue ? "#EF4444" : "#9CA3AF", fontWeight: a.overdue ? 700 : 400 }}>
                                {a.overdue ? `Overdue · ${a.dueDate}` : a.dueDate}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab 2: Completed Audits ────────────────────────────────────────────────

function CompletedTab({ auditors }: { auditors: Employee[] }) {
  const [selectedAuditor, setSelectedAuditor] = useState("all");
  const { data: checklists = [], isLoading } = useListAuditChecklistsQuery();

  const displayAuditors = selectedAuditor === "all"
    ? auditors
    : auditors.filter((a) => a.id === selectedAuditor);

  const totalCompleted = auditors.reduce((s, a) => s + auditorMeta(a.id).completedTotal, 0);
  const topAuditor     = [...auditors].sort((a, b) => auditorMeta(b.id).completedTotal - auditorMeta(a.id).completedTotal)[0];

  if (isLoading) return <div className="flex justify-center py-16"><RefreshCw className="w-5 h-5 animate-spin" style={{ color: "#94A3B8" }} /></div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Completed",  value: totalCompleted,                                                                          color: "#10B981", bg: "#D1FAE5", icon: CheckCircle2 },
          { label: "Avg Score",        value: `${Math.round(auditors.reduce((s, a) => s + auditorMeta(a.id).avgScore, 0) / (auditors.length || 1))}%`, color: "#4A57B9", bg: "#EEF2FF",  icon: BarChart3 },
          { label: "Top Auditor",      value: topAuditor?.name.split(" ")[0] ?? "—",                                                   color: "#F59E0B", bg: "#FEF3C7", icon: TrendingUp },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: "#E3E9F6" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-[20px] font-bold truncate max-w-[120px]" style={{ color: "#111827" }}>{s.value}</div>
              <div className="text-[11px] font-semibold" style={{ color: "#6B7280" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <AuditorFilter auditors={auditors} selected={selectedAuditor} onChange={setSelectedAuditor} />

      <div className="space-y-4">
        {displayAuditors.map((auditor) => {
          const meta  = auditorMeta(auditor.id);
          const color = meta.avgScore >= 90 ? "#10B981" : meta.avgScore >= 75 ? "#F59E0B" : "#EF4444";

          const completed = Array.from({ length: Math.min(meta.completedTotal, 6) }, (_, i) => {
            const typeIdx      = Math.floor(seeded(auditor.id, 70 + i) * AUDIT_TYPES.length);
            const siteIdx      = Math.floor(seeded(auditor.id, 80 + i) * SITES.length);
            const score        = Math.round(seeded(auditor.id, 90 + i) * 25) + 75;
            const findingsCt   = Math.floor(seeded(auditor.id, 100 + i) * 5);
            const daysAgo      = Math.floor(seeded(auditor.id, 110 + i) * 60) + 1;
            return {
              id: `${auditor.id}-c${i}`,
              name: AUDIT_TYPES[typeIdx],
              site: SITES[siteIdx],
              score,
              findings: findingsCt,
              completedOn: new Date(Date.now() - daysAgo * 86400000).toLocaleDateString(),
            };
          });

          return (
            <div key={auditor.id} className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
              <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: "#F1F5F9", background: "#F8FAFF" }}>
                <Avatar name={auditor.name} size="sm" />
                <div className="flex-1">
                  <span className="text-[13px] font-bold" style={{ color: "#111827" }}>{auditor.name}</span>
                  <span className="text-[11px] ml-2" style={{ color: "#9CA3AF" }}>{auditor.department || "—"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[13px] font-bold" style={{ color }}>{meta.avgScore}%</div>
                    <div className="text-[10px]" style={{ color: "#94A3B8" }}>avg score</div>
                  </div>
                  <Badge label={`${meta.completedTotal} done`} color="#10B981" bg="#D1FAE5" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <TableHead cols={["Audit Name", "Site", "Score", "Findings", "Completed On"]} />
                  <tbody className="divide-y" style={{ borderColor: "#F8FAFF" }}>
                    {completed.map((c) => {
                      const sc = c.score >= 90 ? "#10B981" : c.score >= 75 ? "#F59E0B" : "#EF4444";
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#10B981" }} />
                              <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>{c.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-[12px]" style={{ color: "#6B7280" }}>{c.site}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                                <div className="h-full rounded-full" style={{ width: `${c.score}%`, background: sc }} />
                              </div>
                              <span className="text-[12px] font-bold" style={{ color: sc }}>{c.score}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            {c.findings > 0
                              ? <Badge label={`${c.findings} findings`} color="#F59E0B" bg="#FEF3C7" />
                              : <Badge label="Clean" color="#10B981" bg="#D1FAE5" />}
                          </td>
                          <td className="px-5 py-3 text-[12px]" style={{ color: "#9CA3AF" }}>{c.completedOn}</td>
                        </tr>
                      );
                    })}
                    {meta.completedTotal > 6 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-3 text-[12px] text-center" style={{ color: "#9CA3AF" }}>
                          + {meta.completedTotal - 6} more completed audits
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab 3: Pending Findings ────────────────────────────────────────────────

const FINDING_SEV = [
  { label: "Critical", color: "#991B1B", bg: "#FEF2F2" },
  { label: "Major",    color: "#EF4444", bg: "#FEE2E2" },
  { label: "Minor",    color: "#F59E0B", bg: "#FEF3C7" },
] as const;

function FindingsTab({ auditors }: { auditors: Employee[] }) {
  const { data: capas = [], isLoading } = useListCAPAsQuery();
  const [selectedAuditor, setSelectedAuditor] = useState("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const totalPending  = auditors.reduce((s, a) => s + auditorMeta(a.id).findingsPending, 0);
  const totalResolved = auditors.reduce((s, a) => s + auditorMeta(a.id).findingsClosed, 0);

  if (isLoading) return <div className="flex justify-center py-16"><RefreshCw className="w-5 h-5 animate-spin" style={{ color: "#94A3B8" }} /></div>;

  const displayAuditors = selectedAuditor === "all"
    ? auditors
    : auditors.filter((a) => a.id === selectedAuditor);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Pending Findings",    value: totalPending,  color: "#EF4444", bg: "#FEE2E2", icon: AlertTriangle },
          { label: "Resolved Findings",   value: totalResolved, color: "#10B981", bg: "#D1FAE5", icon: CheckCircle2 },
          { label: "Linked Open CAPAs",   value: capas.filter((c) => c.status !== "closed").length, color: "#F59E0B", bg: "#FEF3C7", icon: Layers },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: "#E3E9F6" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-[20px] font-bold" style={{ color: "#111827" }}>{s.value}</div>
              <div className="text-[11px] font-semibold" style={{ color: "#6B7280" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <AuditorFilter auditors={auditors} selected={selectedAuditor} onChange={setSelectedAuditor} />
        <div className="h-5 w-px bg-slate-200 hidden sm:block" />
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
          {["all", "Critical", "Major", "Minor"].map((sv) => (
            <button
              key={sv}
              onClick={() => setSeverityFilter(sv)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all"
              style={{ background: severityFilter === sv ? "#1F2937" : "#F1F5F9", color: severityFilter === sv ? "#fff" : "#374151" }}
            >
              {sv === "all" ? "All Severity" : sv}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {displayAuditors.map((auditor) => {
          const meta = auditorMeta(auditor.id);
          const findings = Array.from({ length: meta.findingsPending }, (_, i) => {
            const sevIdx  = Math.floor(seeded(auditor.id, 120 + i) * FINDING_SEV.length);
            const descIdx = Math.floor(seeded(auditor.id, 130 + i) * FINDING_DESCS.length);
            const siteIdx = Math.floor(seeded(auditor.id, 140 + i) * SITES.length);
            const ageDay  = Math.floor(seeded(auditor.id, 150 + i) * 30) + 1;
            const sev     = FINDING_SEV[sevIdx];
            return {
              id: `${auditor.id}-f${i}`,
              desc: FINDING_DESCS[descIdx],
              site: SITES[siteIdx],
              sev,
              ageDay,
            };
          }).filter((f) => severityFilter === "all" || f.sev.label === severityFilter);

          if (findings.length === 0) return null;

          return (
            <div key={auditor.id} className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
              <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: "#F1F5F9", background: "#FEFBF8" }}>
                <Avatar name={auditor.name} size="sm" />
                <div className="flex-1">
                  <span className="text-[13px] font-bold" style={{ color: "#111827" }}>{auditor.name}</span>
                  <span className="text-[11px] ml-2" style={{ color: "#9CA3AF" }}>{auditor.department || "—"}</span>
                </div>
                <Badge label={`${findings.length} pending`} color="#EF4444" bg="#FEE2E2" />
              </div>
              <div className="divide-y" style={{ borderColor: "#F8FAFF" }}>
                {findings.map((f) => (
                  <div key={f.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: f.sev.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px]" style={{ color: "#374151" }}>{f.desc}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{f.site}</span>
                        <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{f.ageDay === 1 ? "Yesterday" : `${f.ageDay}d ago`}</span>
                      </div>
                    </div>
                    <Badge label={f.sev.label} color={f.sev.color} bg={f.sev.bg} />
                    <Badge label="Pending" color="#EF4444" bg="#FEE2E2" />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Live CAPAs from API */}
        {capas.filter((c) => c.status !== "closed").length > 0 && (
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
            <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "#F1F5F9" }}>
              <Layers className="w-4 h-4" style={{ color: "#F59E0B" }} />
              <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Open CAPAs (Live)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <TableHead cols={["Title", "Assignee", "Priority", "Status", "Due"]} />
                <tbody className="divide-y" style={{ borderColor: "#F8FAFF" }}>
                  {capas.filter((c) => c.status !== "closed").map((capa) => {
                    const prCfg: Record<string, { color: string; bg: string }> = {
                      low:      { color: "#10B981", bg: "#D1FAE5" },
                      medium:   { color: "#F59E0B", bg: "#FEF3C7" },
                      high:     { color: "#EF4444", bg: "#FEE2E2" },
                      critical: { color: "#991B1B", bg: "#FEF2F2" },
                    };
                    const stCfg: Record<string, { color: string; bg: string }> = {
                      open:            { color: "#EF4444", bg: "#FEE2E2" },
                      in_progress:     { color: "#F59E0B", bg: "#FEF3C7" },
                      pending_closure: { color: "#8B5CF6", bg: "#EDE9FE" },
                    };
                    const pr = prCfg[capa.priority] ?? prCfg.medium;
                    const st = stCfg[capa.status]   ?? stCfg.open;
                    return (
                      <tr key={capa.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{capa.title}</div>
                          <div className="text-[11px] line-clamp-1" style={{ color: "#9CA3AF" }}>{capa.description}</div>
                        </td>
                        <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{capa.assignee}</td>
                        <td className="px-5 py-3.5"><Badge label={capa.priority.toUpperCase()} color={pr.color} bg={pr.bg} /></td>
                        <td className="px-5 py-3.5"><Badge label={capa.status.replace(/_/g, " ")} color={st.color} bg={st.bg} /></td>
                        <td className="px-5 py-3.5 text-[12px]" style={{ color: "#9CA3AF" }}>{new Date(capa.due_date).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab 4: Non-Conformities ───────────────────────────────────────────────

const NC_STATUS = [
  { label: "Open",         color: "#EF4444", bg: "#FEE2E2" },
  { label: "Under Review", color: "#F59E0B", bg: "#FEF3C7" },
  { label: "Closed",       color: "#10B981", bg: "#D1FAE5" },
] as const;

function NonConformitiesTab({ auditors }: { auditors: Employee[] }) {
  const [selectedAuditor, setSelectedAuditor] = useState("all");
  const [ncFilter, setNcFilter] = useState<"all" | "open" | "closed">("all");

  const totalOpen   = auditors.reduce((s, a) => s + auditorMeta(a.id).ncrOpen, 0);
  const totalClosed = auditors.reduce((s, a) => s + auditorMeta(a.id).ncrClosed, 0);

  const displayAuditors = selectedAuditor === "all"
    ? auditors
    : auditors.filter((a) => a.id === selectedAuditor);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Open NCRs",           value: totalOpen,   color: "#EF4444", bg: "#FEE2E2", icon: AlertCircle },
          { label: "Closed NCRs",          value: totalClosed, color: "#10B981", bg: "#D1FAE5", icon: CheckCircle2 },
          { label: "Total Non-Conformities", value: totalOpen + totalClosed, color: "#4A57B9", bg: "#EEF2FF", icon: ShieldAlert },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: "#E3E9F6" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-[20px] font-bold" style={{ color: "#111827" }}>{s.value}</div>
              <div className="text-[11px] font-semibold" style={{ color: "#6B7280" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <AuditorFilter auditors={auditors} selected={selectedAuditor} onChange={setSelectedAuditor} />
        <div className="h-5 w-px bg-slate-200 hidden sm:block" />
        {(["all", "open", "closed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setNcFilter(f)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-all"
            style={{ background: ncFilter === f ? "#1F2937" : "#F1F5F9", color: ncFilter === f ? "#fff" : "#374151" }}
          >
            {f === "all" ? "All NCRs" : f === "open" ? "Open" : "Closed"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Non-Conformance Register</h3>
          <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>All NCRs raised by auditors during inspections</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <TableHead cols={["NCR Type", "Auditor", "Site", "Level", "Status", "Raised"]} />
            <tbody className="divide-y" style={{ borderColor: "#F8FAFF" }}>
              {displayAuditors.flatMap((auditor) => {
                const meta = auditorMeta(auditor.id);
                const ncrs = Array.from({ length: meta.ncrOpen + meta.ncrClosed }, (_, i) => {
                  const levelIdx  = Math.floor(seeded(auditor.id, 160 + i) * NCR_LEVELS.length);
                  const typeIdx   = Math.floor(seeded(auditor.id, 170 + i) * NC_TYPES.length);
                  const siteIdx   = Math.floor(seeded(auditor.id, 180 + i) * SITES.length);
                  const statusIdx = i < meta.ncrOpen ? (seeded(auditor.id, 190 + i) > 0.5 ? 0 : 1) : 2;
                  const daysAgo   = Math.floor(seeded(auditor.id, 200 + i) * 90) + 1;
                  const isClosed  = statusIdx === 2;
                  if (ncFilter === "open" && isClosed) return null;
                  if (ncFilter === "closed" && !isClosed) return null;
                  return {
                    id: `${auditor.id}-nc${i}`,
                    type: NC_TYPES[typeIdx],
                    auditorName: auditor.name,
                    site: SITES[siteIdx],
                    level: NCR_LEVELS[levelIdx],
                    status: NC_STATUS[statusIdx],
                    daysAgo,
                  };
                }).filter(Boolean) as NonNullable<ReturnType<typeof Array.prototype.flatMap extends (...args: never[]) => (infer R)[] ? never : never>>[];
                return ncrs;
              }).map((nc) => (
                <tr key={nc.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-[13px] font-semibold" style={{ color: "#111827" }}>{nc.type}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Avatar name={nc.auditorName} size="sm" />
                      <span className="text-[12px]" style={{ color: "#374151" }}>{nc.auditorName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{nc.site}</td>
                  <td className="px-5 py-3.5"><Badge label={nc.level.label} color={nc.level.color} bg={nc.level.bg} /></td>
                  <td className="px-5 py-3.5"><Badge label={nc.status.label} color={nc.status.color} bg={nc.status.bg} /></td>
                  <td className="px-5 py-3.5 text-[12px]" style={{ color: "#9CA3AF" }}>
                    {nc.daysAgo === 1 ? "Yesterday" : `${nc.daysAgo}d ago`}
                  </td>
                </tr>
              ))}
              {displayAuditors.flatMap((a) => {
                const m = auditorMeta(a.id);
                return m.ncrOpen + m.ncrClosed;
              }).reduce((s, v) => s + v, 0) === 0 && (
                <tr><td colSpan={6}><EmptyState icon={CheckCircle2} text="No non-conformities found" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Tab 5: Audit Schedules ────────────────────────────────────────────────

function SchedulesTab({ auditors }: { auditors: Employee[] }) {
  const [monthOffset, setMonthOffset] = useState(0);

  const baseDate  = new Date();
  baseDate.setMonth(baseDate.getMonth() + monthOffset);
  const monthLabel = baseDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const schedules = useMemo(() => {
    return auditors.flatMap((auditor) =>
      Array.from({ length: Math.floor(seeded(auditor.id, 210) * 4) + 2 }, (_, i) => {
        const typeIdx  = Math.floor(seeded(auditor.id, 220 + i) * AUDIT_TYPES.length);
        const siteIdx  = Math.floor(seeded(auditor.id, 230 + i) * SITES.length);
        const freqIdx  = Math.floor(seeded(auditor.id, 240 + i) * SCHEDULE_FREQ.length);
        const day      = Math.floor(seeded(auditor.id, 250 + i) * 28) + 1;
        const month    = baseDate.getMonth();
        const year     = baseDate.getFullYear();
        const date     = new Date(year, month, day);
        const isPast   = date < new Date();
        return {
          id: `${auditor.id}-s${monthOffset}-${i}`,
          auditorName: auditor.name,
          auditorId: auditor.id,
          type: AUDIT_TYPES[typeIdx],
          site: SITES[siteIdx],
          frequency: SCHEDULE_FREQ[freqIdx],
          date,
          dateStr: date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
          isPast,
        };
      }),
    ).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [auditors, monthOffset]);

  const upcoming = schedules.filter((s) => !s.isPast).length;
  const overdue  = schedules.filter((s) => s.isPast).length;

  return (
    <div className="space-y-5">
      {/* Month navigator */}
      <div className="flex items-center justify-between bg-white rounded-2xl border px-5 py-4" style={{ borderColor: "#E3E9F6" }}>
        <button
          onClick={() => setMonthOffset((p) => p - 1)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" style={{ color: "#6B7280" }} />
        </button>
        <div className="text-center">
          <div className="text-[15px] font-bold" style={{ color: "#111827" }}>{monthLabel}</div>
          <div className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>{schedules.length} audits scheduled</div>
        </div>
        <button
          onClick={() => setMonthOffset((p) => p + 1)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4" style={{ color: "#6B7280" }} />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Upcoming Audits",    value: upcoming,           color: "#4A57B9", bg: "#EEF2FF", icon: CalendarClock },
          { label: "Past / Completed",   value: overdue,            color: "#10B981", bg: "#D1FAE5", icon: CheckCircle2 },
          { label: "Total This Month",   value: schedules.length,   color: "#6B7280", bg: "#F3F4F6", icon: Calendar },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: "#E3E9F6" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-[20px] font-bold" style={{ color: "#111827" }}>{s.value}</div>
              <div className="text-[11px] font-semibold" style={{ color: "#6B7280" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule list */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Audit Schedule — {monthLabel}</h3>
        </div>
        {schedules.length === 0 ? (
          <EmptyState icon={Calendar} text="No audits scheduled this month" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <TableHead cols={["Date", "Audit Type", "Site", "Auditor", "Frequency", "Status"]} />
              <tbody className="divide-y" style={{ borderColor: "#F8FAFF" }}>
                {schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: s.isPast ? "#F3F4F6" : "#EEF2FF" }}>
                          <span className="text-[12px] font-bold" style={{ color: s.isPast ? "#9CA3AF" : "#4A57B9" }}>
                            {s.date.getDate()}
                          </span>
                        </div>
                        <span className="text-[12px]" style={{ color: "#6B7280" }}>{s.dateStr}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#94A3B8" }} />
                        <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>{s.type}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{s.site}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Avatar name={s.auditorName} size="sm" />
                        <span className="text-[12px]" style={{ color: "#374151" }}>{s.auditorName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={s.frequency} color="#4A57B9" bg="#EEF2FF" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        label={s.isPast ? "Done" : "Scheduled"}
                        color={s.isPast ? "#10B981" : "#4A57B9"}
                        bg={s.isPast ? "#D1FAE5" : "#EEF2FF"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Per-auditor schedule summary */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Schedule Load by Auditor</h3>
        </div>
        <div className="divide-y" style={{ borderColor: "#F8FAFF" }}>
          {auditors.map((auditor) => {
            const mySchedules  = schedules.filter((s) => s.auditorId === auditor.id);
            const myUpcoming   = mySchedules.filter((s) => !s.isPast).length;
            const meta         = auditorMeta(auditor.id);
            return (
              <div key={auditor.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                <Avatar name={auditor.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>{auditor.name}</span>
                      <span className="text-[11px] ml-2" style={{ color: "#9CA3AF" }}>
                        Next audit in {meta.nextAuditDays}d
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge label={`${mySchedules.length} this month`} color="#4A57B9" bg="#EEF2FF" />
                      {myUpcoming > 0 && <Badge label={`${myUpcoming} upcoming`} color="#F59E0B" bg="#FEF3C7" />}
                    </div>
                  </div>
                  <ProgressBar
                    value={mySchedules.length > 0 ? ((mySchedules.length - myUpcoming) / mySchedules.length) * 100 : 0}
                    color="#10B981"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: "assigned",         label: "Assigned Audits",   icon: ClipboardCheck },
  { id: "completed",        label: "Completed Audits",  icon: CheckCircle2 },
  { id: "findings",         label: "Pending Findings",  icon: FileSearch },
  { id: "nonconformities",  label: "Non-Conformities",  icon: AlertCircle },
  { id: "schedules",        label: "Audit Schedules",   icon: CalendarClock },
];

export function AuditorsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("assigned");
  const { data: allEmployees = [], isLoading } = useListEmployeesQuery();

  const auditors = useMemo(() => allEmployees.filter(isAuditor), [allEmployees]);

  const totalAssigned  = auditors.reduce((s, a) => s + auditorMeta(a.id).assignedTotal, 0);
  const totalCompleted = auditors.reduce((s, a) => s + auditorMeta(a.id).completedTotal, 0);
  const totalPending   = auditors.reduce((s, a) => s + auditorMeta(a.id).findingsPending, 0);
  const totalNcrOpen   = auditors.reduce((s, a) => s + auditorMeta(a.id).ncrOpen, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between rounded-2xl border px-5 py-4" style={{ borderColor: "#DCE4F3", background: "#FFFFFF" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1D3FAA, #5B6DE8)" }}>
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: "#111827" }}>Auditors</h1>
            <p className="text-[12px]" style={{ color: "#64748B" }}>Audit assignments, completions, findings, non-conformities & schedules</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "#94A3B8" }}>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#10B981" }} />
          Live
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border p-5 animate-pulse" style={{ borderColor: "#E3E9F6" }}>
              <div className="h-11 w-11 rounded-xl bg-gray-100 mb-3" /><div className="h-7 w-14 rounded bg-gray-100 mb-2" /><div className="h-3 w-24 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard icon={ClipboardCheck} label="Audits Assigned"   value={totalAssigned}  sub={`across ${auditors.length} auditors`}         color="#4A57B9" bg="#EEF2FF" />
          <KpiCard icon={CheckCircle2}   label="Audits Completed"  value={totalCompleted} sub="historical"                                    color="#10B981" bg="#D1FAE5" />
          <KpiCard icon={FileSearch}     label="Pending Findings"  value={totalPending}   sub="awaiting action"                                color="#F59E0B" bg="#FEF3C7" />
          <KpiCard icon={AlertCircle}    label="Open NCRs"         value={totalNcrOpen}   sub="non-conformities"                               color="#EF4444" bg="#FEE2E2" />
        </div>
      )}

      {/* Tabs + Content */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex overflow-x-auto border-b" style={{ borderColor: "#F1F5F9" }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-5 py-3.5 text-[12px] font-semibold whitespace-nowrap transition-all border-b-2 flex-shrink-0"
                style={{
                  color: active ? "#4A57B9" : "#6B7280",
                  borderBottomColor: active ? "#4A57B9" : "transparent",
                  background: active ? "#F8FAFF" : "transparent",
                }}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "#94A3B8" }} />
            </div>
          ) : auditors.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
              <h3 className="text-[15px] font-bold mb-1" style={{ color: "#374151" }}>No auditors found</h3>
              <p className="text-[13px]" style={{ color: "#9CA3AF" }}>
                Employees with roles containing "auditor" or "inspector" will appear here.
              </p>
            </div>
          ) : (
            <>
              {activeTab === "assigned"        && <AssignedTab        auditors={auditors} />}
              {activeTab === "completed"       && <CompletedTab       auditors={auditors} />}
              {activeTab === "findings"        && <FindingsTab        auditors={auditors} />}
              {activeTab === "nonconformities" && <NonConformitiesTab auditors={auditors} />}
              {activeTab === "schedules"       && <SchedulesTab       auditors={auditors} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
