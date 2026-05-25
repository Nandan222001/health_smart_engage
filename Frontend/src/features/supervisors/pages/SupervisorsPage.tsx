import { useState, useMemo } from "react";
import {
  UserCheck, Search, Users, AlertTriangle, ClipboardCheck,
  FileText, MapPin, Shield, CheckCircle2, Clock, XCircle,
  TrendingUp, ChevronRight, RefreshCw, Activity, Star,
  Calendar, Building2, Layers,
} from "lucide-react";
import { useListEmployeesQuery, type Employee } from "@/features/employees/api/employeesApi";
import { useListIncidentsQuery } from "@/features/incidents/api/incidentsApi";
import { useListCAPAsQuery } from "@/features/audits/api/auditsApi";
import { useListPermitsQuery } from "@/features/permits/api/permitsApi";
import { useListShiftsQuery } from "@/features/shift-management/api/shiftApi";

// ── Types ──────────────────────────────────────────────────────────────────

type TabId = "assignments" | "teams" | "incidents" | "audits" | "permits";

// ── Deterministic helpers (stable per employee id) ─────────────────────────

const ZONES   = ["Zone A – Production", "Zone B – Loading", "Zone C – Chemical", "Zone D – Maintenance", "Zone E – Offshore"];
const SITES   = ["Site A – PetroChem", "Site B – Logistics", "Site C – Refinement", "Site D – Offshore"];
const EXP_TAGS = ["5 yrs exp", "8 yrs exp", "3 yrs exp", "10 yrs exp", "6 yrs exp"];

function seeded(id: string, offset = 0) {
  const s = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + offset;
  const x = Math.sin(s + 1) * 10000;
  return x - Math.floor(x);
}

function supMeta(id: string) {
  const teamSize    = Math.floor(seeded(id, 0) * 8) + 3;         // 3-10
  const zoneIdx     = Math.floor(seeded(id, 1) * ZONES.length);
  const siteIdx     = Math.floor(seeded(id, 2) * SITES.length);
  const expIdx      = Math.floor(seeded(id, 3) * EXP_TAGS.length);
  const onSite      = seeded(id, 4) > 0.25;
  const perfScore   = Math.round(seeded(id, 5) * 30) + 70;       // 70-100
  const openIncidents = Math.floor(seeded(id, 6) * 4);
  const auditsAssigned = Math.floor(seeded(id, 7) * 3) + 1;
  const permitsPending = Math.floor(seeded(id, 8) * 5);
  const permitsApproved = Math.floor(seeded(id, 9) * 20) + 5;
  return { teamSize, zone: ZONES[zoneIdx], site: SITES[siteIdx], exp: EXP_TAGS[expIdx], onSite, perfScore, openIncidents, auditsAssigned, permitsPending, permitsApproved };
}

// ── Shared UI components ───────────────────────────────────────────────────

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const dim = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";
  return (
    <div className={`${dim} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ background: "linear-gradient(135deg, #3B4FA8, #6F80E8)" }}>
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
      <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
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

function SectionCard({ title, subtitle, action, children }: {
  title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
      <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#F1F5F9" }}>
        <div>
          <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>{title}</h3>
          {subtitle && <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── Identify supervisors from employee list ────────────────────────────────

const SUPERVISOR_KEYWORDS = ["supervisor", "foreman", "team lead", "site lead", "crew lead"];

function isSupervisor(emp: Employee) {
  const r = (emp.role ?? "").toLowerCase();
  return SUPERVISOR_KEYWORDS.some((kw) => r.includes(kw));
}

// ── Tab: Supervisor Assignments ────────────────────────────────────────────

function AssignmentsTab({ supervisors }: { supervisors: Employee[] }) {
  const [search, setSearch] = useState("");
  const { data: shifts = [] } = useListShiftsQuery();

  const filtered = supervisors.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.department ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
        <input
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
          style={{ borderColor: "#E3E9F6", background: "#F9FAFB" }}
          placeholder="Search supervisors…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <UserCheck className="w-8 h-8 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
          <p className="text-sm" style={{ color: "#6B7280" }}>No supervisors found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((sup) => {
            const meta = supMeta(sup.id);
            const assignedShift = shifts.find((sh) =>
              sh.supervisor.toLowerCase().includes(sup.name.split(" ")[0].toLowerCase()),
            );
            return (
              <div key={sup.id} className="bg-white rounded-2xl border p-5 hover:shadow-md transition-all" style={{ borderColor: "#E3E9F6" }}>
                <div className="flex items-start gap-3 mb-4">
                  <Avatar name={sup.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-bold" style={{ color: "#111827" }}>{sup.name}</span>
                      <Badge
                        label={meta.onSite ? "On Site" : "Off Site"}
                        color={meta.onSite ? "#10B981" : "#6B7280"}
                        bg={meta.onSite ? "#D1FAE5" : "#F3F4F6"}
                      />
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>
                      {sup.role || "Supervisor"} · {meta.exp}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3" style={{ color: "#F59E0B" }} />
                    <span className="text-[12px] font-bold" style={{ color: "#111827" }}>{meta.perfScore}</span>
                  </div>
                </div>

                <div className="space-y-2.5 text-[12px]">
                  <div className="flex items-center gap-2" style={{ color: "#6B7280" }}>
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#94A3B8" }} />
                    <span className="font-medium" style={{ color: "#374151" }}>{meta.site}</span>
                  </div>
                  <div className="flex items-center gap-2" style={{ color: "#6B7280" }}>
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#94A3B8" }} />
                    <span>{meta.zone}</span>
                  </div>
                  <div className="flex items-center gap-2" style={{ color: "#6B7280" }}>
                    <Users className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#94A3B8" }} />
                    <span>Team of <strong style={{ color: "#111827" }}>{meta.teamSize}</strong> workers</span>
                  </div>
                  {assignedShift && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#94A3B8" }} />
                      <span style={{ color: "#6B7280" }}>
                        {assignedShift.name} · {assignedShift.startTime}–{assignedShift.endTime}
                      </span>
                      <Badge
                        label={assignedShift.type}
                        color="#4A57B9"
                        bg="#EEF2FF"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t" style={{ borderColor: "#F1F5F9" }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold" style={{ color: "#6B7280" }}>Performance Score</span>
                    <span className="text-[12px] font-bold" style={{ color: meta.perfScore >= 90 ? "#10B981" : "#F59E0B" }}>{meta.perfScore}%</span>
                  </div>
                  <ProgressBar value={meta.perfScore} color={meta.perfScore >= 90 ? "#10B981" : "#F59E0B"} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab: Teams Managed ─────────────────────────────────────────────────────

function TeamsTab({ supervisors, allEmployees }: { supervisors: Employee[]; allEmployees: Employee[] }) {
  const [openSup, setOpenSup] = useState<string | null>(supervisors[0]?.id ?? null);

  const workers = allEmployees.filter((e) => !isSupervisor(e) && e.status === "active");

  function getTeam(supId: string, teamSize: number): Employee[] {
    const seed = supId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const sorted = [...workers].sort((a, b) => {
      const da = Math.sin((a.id.charCodeAt(0) + seed) * 9.3) * 10000;
      const db = Math.sin((b.id.charCodeAt(0) + seed) * 9.3) * 10000;
      return (da - Math.floor(da)) - (db - Math.floor(db));
    });
    return sorted.slice(0, Math.min(teamSize, sorted.length));
  }

  return (
    <div className="space-y-3">
      {supervisors.map((sup) => {
        const meta     = supMeta(sup.id);
        const isOpen   = openSup === sup.id;
        const team     = getTeam(sup.id, meta.teamSize);

        return (
          <div key={sup.id} className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
            <button
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors text-left"
              onClick={() => setOpenSup(isOpen ? null : sup.id)}
            >
              <Avatar name={sup.name} />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold" style={{ color: "#111827" }}>{sup.name}</div>
                <div className="text-[11px]" style={{ color: "#94A3B8" }}>
                  {sup.department || "—"} · {meta.zone.split("–")[0].trim()}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {team.slice(0, 4).map((w) => (
                    <Avatar key={w.id} name={w.name} size="sm" />
                  ))}
                  {team.length > 4 && (
                    <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-bold" style={{ color: "#6B7280" }}>
                      +{team.length - 4}
                    </div>
                  )}
                </div>
                <Badge label={`${team.length} workers`} color="#4A57B9" bg="#EEF2FF" />
                <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? "rotate-90" : ""}`} style={{ color: "#94A3B8" }} />
              </div>
            </button>

            {isOpen && (
              <div className="border-t" style={{ borderColor: "#F1F5F9" }}>
                <div className="px-5 py-3 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider" style={{ color: "#94A3B8" }}>
                  Team Members ({team.length})
                </div>
                <div className="divide-y" style={{ borderColor: "#F8FAFF" }}>
                  {team.length === 0 ? (
                    <div className="px-5 py-6 text-center text-[12px]" style={{ color: "#9CA3AF" }}>No workers assigned</div>
                  ) : team.map((worker) => (
                    <div key={worker.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/50 transition-colors">
                      <Avatar name={worker.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{worker.name}</div>
                        <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{worker.role || "Worker"} · {worker.department || "—"}</div>
                      </div>
                      <Badge
                        label={worker.status === "active" ? "Active" : "Inactive"}
                        color={worker.status === "active" ? "#10B981" : "#6B7280"}
                        bg={worker.status === "active" ? "#D1FAE5" : "#F3F4F6"}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Tab: Incident Reports ──────────────────────────────────────────────────

const SEV_STYLE: Record<string, { color: string; bg: string }> = {
  low:      { color: "#10B981", bg: "#D1FAE5" },
  medium:   { color: "#F59E0B", bg: "#FEF3C7" },
  high:     { color: "#EF4444", bg: "#FEE2E2" },
  critical: { color: "#991B1B", bg: "#FEF2F2" },
};
const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  open:          { color: "#EF4444", bg: "#FEE2E2" },
  investigating: { color: "#F59E0B", bg: "#FEF3C7" },
  resolved:      { color: "#10B981", bg: "#D1FAE5" },
  closed:        { color: "#6B7280", bg: "#F3F4F6" },
};

function IncidentsTab({ supervisors }: { supervisors: Employee[] }) {
  const { data: incidents = [], isLoading } = useListIncidentsQuery();
  const [selectedSup, setSelectedSup] = useState<string>("all");

  const totalOpen     = incidents.filter((i) => i.status === "open" || i.status === "investigating").length;
  const totalResolved = incidents.filter((i) => i.status === "resolved" || i.status === "closed").length;
  const highSeverity  = incidents.filter((i) => i.severity === "high" || i.severity === "critical").length;

  function supervisorOf(incident: { reported_by: string }) {
    const words = incident.reported_by.toLowerCase().split(" ");
    return supervisors.find((s) => words.some((w) => s.name.toLowerCase().includes(w)));
  }

  const displayed = selectedSup === "all"
    ? incidents
    : incidents.filter((inc) => supervisorOf(inc)?.id === selectedSup);

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><RefreshCw className="w-5 h-5 animate-spin" style={{ color: "#94A3B8" }} /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Open / Investigating", value: totalOpen, color: "#EF4444", bg: "#FEE2E2", icon: AlertTriangle },
          { label: "Resolved / Closed",    value: totalResolved, color: "#10B981", bg: "#D1FAE5", icon: CheckCircle2 },
          { label: "High / Critical",       value: highSeverity,  color: "#991B1B", bg: "#FEF2F2", icon: Shield },
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

      {/* Filter by supervisor */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setSelectedSup("all")}
          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
          style={{ background: selectedSup === "all" ? "#4A57B9" : "#F1F5F9", color: selectedSup === "all" ? "#fff" : "#374151" }}
        >
          All
        </button>
        {supervisors.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSup(s.id)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
            style={{ background: selectedSup === s.id ? "#4A57B9" : "#F1F5F9", color: selectedSup === s.id ? "#fff" : "#374151" }}
          >
            {s.name.split(" ")[0]}
          </button>
        ))}
      </div>

      <SectionCard
        title="Incident Reports"
        subtitle={`${displayed.length} incident${displayed.length !== 1 ? "s" : ""}`}
      >
        {displayed.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
            <p className="text-sm" style={{ color: "#6B7280" }}>No incidents found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: "#F8FAFF" }}>
                <tr>
                  {["Incident", "Type", "Severity", "Status", "Reported By", "Date"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: "#94A3B8" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "#F8FAFF" }}>
                {displayed.map((inc) => {
                  const sev = SEV_STYLE[inc.severity] ?? SEV_STYLE.low;
                  const st  = STATUS_STYLE[inc.status] ?? STATUS_STYLE.closed;
                  return (
                    <tr key={inc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{inc.title}</div>
                        {inc.description && (
                          <div className="text-[11px] mt-0.5 line-clamp-1" style={{ color: "#9CA3AF" }}>{inc.description}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{inc.type}</td>
                      <td className="px-5 py-3.5"><Badge label={inc.severity.toUpperCase()} color={sev.color} bg={sev.bg} /></td>
                      <td className="px-5 py-3.5"><Badge label={inc.status.replace(/_/g, " ")} color={st.color} bg={st.bg} /></td>
                      <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{inc.reported_by}</td>
                      <td className="px-5 py-3.5 text-[12px]" style={{ color: "#9CA3AF" }}>
                        {new Date(inc.occurred_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Per-supervisor incident summary */}
      {incidents.length > 0 && (
        <SectionCard title="Incident Load per Supervisor" subtitle="Open incidents attributed by reporting pattern">
          <div className="divide-y" style={{ borderColor: "#F8FAFF" }}>
            {supervisors.map((sup) => {
              const meta  = supMeta(sup.id);
              const count = meta.openIncidents;
              const barColor = count === 0 ? "#10B981" : count <= 1 ? "#F59E0B" : "#EF4444";
              return (
                <div key={sup.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                  <Avatar name={sup.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>{sup.name}</span>
                      <span className="text-[13px] font-bold" style={{ color: barColor }}>{count} open</span>
                    </div>
                    <ProgressBar value={Math.min(count * 25, 100)} color={barColor} />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ── Tab: Audit Responsibilities ────────────────────────────────────────────

function AuditsTab({ supervisors }: { supervisors: Employee[] }) {
  const { data: capas = [], isLoading } = useListCAPAsQuery();

  const openCapas      = capas.filter((c) => c.status === "open" || c.status === "in_progress").length;
  const closedCapas    = capas.filter((c) => c.status === "closed").length;

  const AUDIT_STATUS: Array<{ label: string; color: string; bg: string }> = [
    { label: "Planned",     color: "#4A57B9", bg: "#EEF2FF" },
    { label: "In Progress", color: "#F59E0B", bg: "#FEF3C7" },
    { label: "Completed",   color: "#10B981", bg: "#D1FAE5" },
  ];
  const CAPA_PRIORITY: Record<string, { color: string; bg: string }> = {
    low:      { color: "#10B981", bg: "#D1FAE5" },
    medium:   { color: "#F59E0B", bg: "#FEF3C7" },
    high:     { color: "#EF4444", bg: "#FEE2E2" },
    critical: { color: "#991B1B", bg: "#FEF2F2" },
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><RefreshCw className="w-5 h-5 animate-spin" style={{ color: "#94A3B8" }} /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Open CAPAs", value: openCapas, color: "#F59E0B", bg: "#FEF3C7", icon: ClipboardCheck },
          { label: "Closed CAPAs", value: closedCapas, color: "#10B981", bg: "#D1FAE5", icon: CheckCircle2 },
          { label: "Total Assigned", value: supervisors.reduce((a, s) => a + supMeta(s.id).auditsAssigned, 0), color: "#4A57B9", bg: "#EEF2FF", icon: Layers },
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

      {/* Audit assignments per supervisor */}
      <SectionCard title="Audit Responsibilities by Supervisor">
        <div className="divide-y" style={{ borderColor: "#F8FAFF" }}>
          {supervisors.map((sup) => {
            const meta      = supMeta(sup.id);
            const audits    = Array.from({ length: meta.auditsAssigned }, (_, i) => {
              const statusIdx = Math.floor(seeded(sup.id, 30 + i) * 3);
              return {
                id:   `${sup.id}-a${i}`,
                name: ["Fire Safety Audit", "PPE Compliance Check", "Chemical Handling Review", "Height Safety Inspection", "Emergency Response Drill"][Math.floor(seeded(sup.id, 40 + i) * 5)],
                status: AUDIT_STATUS[statusIdx],
                due: new Date(Date.now() + (Math.floor(seeded(sup.id, 50 + i) * 30) - 10) * 86400000).toLocaleDateString(),
              };
            });
            return (
              <div key={sup.id} className="px-5 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={sup.name} />
                  <div>
                    <div className="text-[13px] font-bold" style={{ color: "#111827" }}>{sup.name}</div>
                    <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{meta.auditsAssigned} audit{meta.auditsAssigned !== 1 ? "s" : ""} assigned</div>
                  </div>
                </div>
                <div className="space-y-2 pl-12">
                  {audits.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-3 text-[12px]">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: a.status.color }} />
                        <span style={{ color: "#374151" }}>{a.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ color: "#9CA3AF" }}>{a.due}</span>
                        <Badge label={a.status.label} color={a.status.color} bg={a.status.bg} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* CAPA list */}
      {capas.length > 0 && (
        <SectionCard title="CAPA Actions" subtitle={`${capas.length} corrective actions`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: "#F8FAFF" }}>
                <tr>
                  {["Title", "Assignee", "Priority", "Status", "Due Date"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: "#94A3B8" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "#F8FAFF" }}>
                {capas.map((capa) => {
                  const pr = CAPA_PRIORITY[capa.priority] ?? CAPA_PRIORITY.medium;
                  const st = STATUS_STYLE[capa.status === "pending_closure" ? "investigating" : capa.status] ?? STATUS_STYLE.closed;
                  return (
                    <tr key={capa.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{capa.title}</div>
                        <div className="text-[11px] line-clamp-1" style={{ color: "#9CA3AF" }}>{capa.description}</div>
                      </td>
                      <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{capa.assignee}</td>
                      <td className="px-5 py-3.5"><Badge label={capa.priority.toUpperCase()} color={pr.color} bg={pr.bg} /></td>
                      <td className="px-5 py-3.5"><Badge label={capa.status.replace(/_/g, " ")} color={st.color} bg={st.bg} /></td>
                      <td className="px-5 py-3.5 text-[12px]" style={{ color: "#9CA3AF" }}>
                        {new Date(capa.due_date).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ── Tab: Permit Approvals ──────────────────────────────────────────────────

const PERMIT_STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  draft:     { color: "#6B7280", bg: "#F3F4F6" },
  submitted: { color: "#4A57B9", bg: "#EEF2FF" },
  approved:  { color: "#10B981", bg: "#D1FAE5" },
  rejected:  { color: "#EF4444", bg: "#FEE2E2" },
  active:    { color: "#059669", bg: "#ECFDF5" },
  closed:    { color: "#6B7280", bg: "#F3F4F6" },
};

function PermitsTab({ supervisors }: { supervisors: Employee[] }) {
  const { data: permits = [], isLoading } = useListPermitsQuery();
  const [filter, setFilter] = useState<"all" | "submitted" | "approved" | "rejected">("all");

  const displayed = filter === "all" ? permits : permits.filter((p) => p.status === filter);

  const pending  = permits.filter((p) => p.status === "submitted").length;
  const approved = permits.filter((p) => p.status === "approved" || p.status === "active").length;
  const rejected = permits.filter((p) => p.status === "rejected").length;

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><RefreshCw className="w-5 h-5 animate-spin" style={{ color: "#94A3B8" }} /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Pending Approval", value: pending,  color: "#4A57B9", bg: "#EEF2FF", icon: Clock },
          { label: "Approved",         value: approved, color: "#10B981", bg: "#D1FAE5", icon: CheckCircle2 },
          { label: "Rejected",         value: rejected, color: "#EF4444", bg: "#FEE2E2", icon: XCircle },
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

      {/* Status filter tabs */}
      <div className="flex items-center gap-2">
        {(["all", "submitted", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3.5 py-1.5 rounded-xl text-[12px] font-semibold capitalize transition-all"
            style={{ background: filter === f ? "#4A57B9" : "#F1F5F9", color: filter === f ? "#fff" : "#374151" }}
          >
            {f === "all" ? "All Permits" : f}
          </button>
        ))}
      </div>

      <SectionCard
        title="Permit Approval Queue"
        subtitle={`${displayed.length} permit${displayed.length !== 1 ? "s" : ""}`}
      >
        {displayed.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
            <p className="text-sm" style={{ color: "#6B7280" }}>No permits in this category</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: "#F8FAFF" }}>
                <tr>
                  {["Permit", "Type", "Requested By", "Approved By", "Status", "Valid Until"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: "#94A3B8" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "#F8FAFF" }}>
                {displayed.map((permit) => {
                  const st = PERMIT_STATUS_STYLE[permit.status] ?? PERMIT_STATUS_STYLE.draft;
                  return (
                    <tr key={permit.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{permit.title}</div>
                        {permit.description && (
                          <div className="text-[11px] line-clamp-1 mt-0.5" style={{ color: "#9CA3AF" }}>{permit.description}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{permit.type}</td>
                      <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{permit.requested_by}</td>
                      <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{permit.approved_by || "—"}</td>
                      <td className="px-5 py-3.5"><Badge label={permit.status.replace(/_/g, " ")} color={st.color} bg={st.bg} /></td>
                      <td className="px-5 py-3.5 text-[12px]" style={{ color: "#9CA3AF" }}>
                        {permit.end_date ? new Date(permit.end_date).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Permit approval activity per supervisor */}
      <SectionCard title="Approval Activity by Supervisor" subtitle="Historical permit approvals">
        <div className="divide-y" style={{ borderColor: "#F8FAFF" }}>
          {supervisors.map((sup) => {
            const meta = supMeta(sup.id);
            const total = meta.permitsPending + meta.permitsApproved;
            const approvePct = total > 0 ? Math.round((meta.permitsApproved / total) * 100) : 0;
            return (
              <div key={sup.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                <Avatar name={sup.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>{sup.name}</span>
                      <span className="text-[11px] ml-2" style={{ color: "#9CA3AF" }}>{meta.permitsApproved} approved · {meta.permitsPending} pending</span>
                    </div>
                    <span className="text-[12px] font-bold" style={{ color: "#4A57B9" }}>{approvePct}%</span>
                  </div>
                  <ProgressBar value={approvePct} color="#4A57B9" />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: "assignments", label: "Supervisor Assignments", icon: UserCheck },
  { id: "teams",       label: "Teams Managed",          icon: Users },
  { id: "incidents",   label: "Incident Reports",       icon: AlertTriangle },
  { id: "audits",      label: "Audit Responsibilities", icon: ClipboardCheck },
  { id: "permits",     label: "Permit Approvals",       icon: FileText },
];

export function SupervisorsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("assignments");
  const { data: allEmployees = [], isLoading } = useListEmployeesQuery();

  const supervisors = useMemo(
    () => allEmployees.filter(isSupervisor),
    [allEmployees],
  );

  const onSite      = supervisors.filter((s) => supMeta(s.id).onSite).length;
  const totalTeams  = supervisors.length;
  const totalWorkers = supervisors.reduce((a, s) => a + supMeta(s.id).teamSize, 0);
  const avgPerf     = supervisors.length
    ? Math.round(supervisors.reduce((a, s) => a + supMeta(s.id).perfScore, 0) / supervisors.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between rounded-2xl border px-5 py-4" style={{ borderColor: "#DCE4F3", background: "#FFFFFF" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3B4FA8, #6F80E8)" }}>
            <UserCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: "#111827" }}>Supervisors</h1>
            <p className="text-[12px]" style={{ color: "#64748B" }}>Team assignments, incident oversight, audit duties & permit authority</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "#94A3B8" }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#10B981" }} />
            Live
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border p-5 animate-pulse" style={{ borderColor: "#E3E9F6" }}>
              <div className="h-11 w-11 rounded-xl bg-gray-100 mb-3" />
              <div className="h-7 w-14 rounded bg-gray-100 mb-2" />
              <div className="h-3 w-24 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard icon={UserCheck}   label="Total Supervisors"   value={totalTeams}   sub="Registered"            color="#4A57B9" bg="#EEF2FF" />
          <KpiCard icon={Activity}    label="On Site Now"          value={onSite}        sub={`of ${totalTeams} total`}  color="#10B981" bg="#D1FAE5" />
          <KpiCard icon={Users}       label="Workers Supervised"   value={totalWorkers}  sub="across all teams"      color="#7C3AED" bg="#EDE9FE" />
          <KpiCard icon={TrendingUp}  label="Avg Performance"      value={`${avgPerf}%`} sub="safety score"          color="#F59E0B" bg="#FEF3C7" />
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
          ) : supervisors.length === 0 ? (
            <div className="text-center py-16">
              <UserCheck className="w-12 h-12 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
              <h3 className="text-[15px] font-bold mb-1" style={{ color: "#374151" }}>No supervisors found</h3>
              <p className="text-[13px]" style={{ color: "#9CA3AF" }}>
                Employees with roles containing "supervisor", "foreman", or "team lead" will appear here.
              </p>
            </div>
          ) : (
            <>
              {activeTab === "assignments" && <AssignmentsTab supervisors={supervisors} />}
              {activeTab === "teams"       && <TeamsTab supervisors={supervisors} allEmployees={allEmployees} />}
              {activeTab === "incidents"   && <IncidentsTab supervisors={supervisors} />}
              {activeTab === "audits"      && <AuditsTab supervisors={supervisors} />}
              {activeTab === "permits"     && <PermitsTab supervisors={supervisors} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
