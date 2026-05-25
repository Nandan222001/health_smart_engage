import { useState, useMemo } from "react";
import {
  ShieldCheck, MapPin, ClipboardList, AlertTriangle,
  TrendingUp, CheckCircle2, Clock, XCircle, RefreshCw,
  Building2, Activity, BarChart3, FileSearch, ChevronDown,
  ChevronRight, Star, Search, Shield, Layers,
} from "lucide-react";
import { useListIncidentsQuery } from "@/features/incidents/api/incidentsApi";
import { useListAuditChecklistsQuery, useListCAPAsQuery } from "@/features/audits/api/auditsApi";
import { useListPermitsQuery } from "@/features/permits/api/permitsApi";

// ── Types ──────────────────────────────────────────────────────────────────

type TabId = "sites" | "compliance" | "audits" | "risk" | "investigations";

interface HSEManager {
  id: string;
  name: string;
  email: string;
  site: string;
  department: string;
  status: "Active" | "Inactive" | "Pending";
  complianceScore: number;
  openIncidents: number;
  joinedAt: string;
}

// ── Static manager data (mirrors admin panel source of truth) ──────────────

const MANAGERS: HSEManager[] = [
  { id: "m1", name: "Rajan Mehta",   email: "rajan.mehta@site.com",  site: "North Plant",  department: "Safety & Compliance", status: "Active",   complianceScore: 94, openIncidents: 2, joinedAt: "2026-04-01" },
  { id: "m2", name: "Priya Sharma",  email: "priya.s@site.com",       site: "South Zone",   department: "Operations",          status: "Active",   complianceScore: 88, openIncidents: 5, joinedAt: "2026-04-05" },
  { id: "m3", name: "Sunita Verma",  email: "sunita.v@site.com",      site: "West Gate",    department: "Environmental",        status: "Pending",  complianceScore: 0,  openIncidents: 0, joinedAt: "2026-05-20" },
  { id: "m4", name: "Mohan Das",     email: "mohan@site.com",          site: "Central Hub",  department: "Security",             status: "Active",   complianceScore: 76, openIncidents: 8, joinedAt: "2026-03-15" },
  { id: "m5", name: "Ajay Kumar",    email: "ajay.k@site.com",         site: "East Block",   department: "Maintenance",          status: "Inactive", complianceScore: 65, openIncidents: 0, joinedAt: "2026-02-10" },
];

// ── Deterministic seeded helpers ───────────────────────────────────────────

function seeded(id: string, offset = 0) {
  const s = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + offset;
  const x = Math.sin(s + 1) * 10000;
  return x - Math.floor(x);
}

const COMPLIANCE_DOMAINS = ["Fire Safety", "Chemical Handling", "PPE Standards", "Emergency Response", "Work Permits"] as const;
const RISK_LEVELS = [
  { label: "Critical", color: "#991B1B", bg: "#FEF2F2" },
  { label: "High",     color: "#EF4444", bg: "#FEE2E2" },
  { label: "Medium",   color: "#F59E0B", bg: "#FEF3C7" },
  { label: "Low",      color: "#10B981", bg: "#D1FAE5" },
] as const;
const RISK_TYPES   = ["Chemical Exposure", "Fire Hazard", "Electrical", "Fall Risk", "Mechanical", "Biological"];
const AUDIT_NAMES  = ["Fire Safety Inspection", "PPE Compliance Audit", "Chemical Storage Review", "Emergency Drill Assessment", "Permit-to-Work Audit", "Environmental Audit"];
const SITE_ZONES   = ["Zone A – Production", "Zone B – Loading", "Zone C – Chemical", "Zone D – Maintenance"];

function mgrMeta(id: string) {
  const auditsTotal     = Math.floor(seeded(id, 1) * 8) + 4;
  const auditsDone      = Math.floor(seeded(id, 2) * auditsTotal);
  const riskOpen        = Math.floor(seeded(id, 3) * 5) + 1;
  const riskClosed      = Math.floor(seeded(id, 4) * 12) + 5;
  const invOpen         = Math.floor(seeded(id, 5) * 4);
  const invInProgress   = Math.floor(seeded(id, 6) * 3);
  const invClosed       = Math.floor(seeded(id, 7) * 15) + 3;
  const additionalSites = Math.floor(seeded(id, 8) * 2);          // 0-1 extra sites
  return { auditsTotal, auditsDone, riskOpen, riskClosed, invOpen, invInProgress, invClosed, additionalSites };
}

// ── Shared UI ─────────────────────────────────────────────────────────────

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const dim = size === "lg" ? "w-12 h-12 text-sm" : size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";
  return (
    <div className={`${dim} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ background: "linear-gradient(135deg, #2D3FA8, #6475E8)" }}>
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

function ProgressBar({ value, color = "#4A57B9", thin }: { value: number; color?: string; thin?: boolean }) {
  return (
    <div className={`w-full ${thin ? "h-1" : "h-1.5"} bg-slate-100 rounded-full overflow-hidden`}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(value, 100)}%`, background: color }} />
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

const STATUS_CFG = {
  Active:   { color: "#065F46", bg: "#D1FAE5" },
  Inactive: { color: "#6B7280", bg: "#F3F4F6" },
  Pending:  { color: "#92400E", bg: "#FEF3C7" },
};

function scoreColor(n: number) {
  return n >= 90 ? "#10B981" : n >= 75 ? "#F59E0B" : "#EF4444";
}

// ── Tab 1: Assigned Sites ──────────────────────────────────────────────────

const ALL_SITES = [
  { name: "North Plant",  health: "Green",  safetyScore: 96, zones: 4, activePermits: 12 },
  { name: "South Zone",   health: "Yellow", safetyScore: 82, zones: 3, activePermits: 8  },
  { name: "West Gate",    health: "Green",  safetyScore: 91, zones: 2, activePermits: 5  },
  { name: "Central Hub",  health: "Red",    safetyScore: 71, zones: 5, activePermits: 15 },
  { name: "East Block",   health: "Yellow", safetyScore: 78, zones: 3, activePermits: 7  },
];

function SitesTab({ managers }: { managers: HSEManager[] }) {
  const [search, setSearch] = useState("");

  const filtered = managers.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.site.toLowerCase().includes(search.toLowerCase()),
  );

  const HEALTH_CFG = {
    Green:  { color: "#10B981", bg: "#D1FAE5", label: "Healthy" },
    Yellow: { color: "#F59E0B", bg: "#FEF3C7", label: "Attention" },
    Red:    { color: "#EF4444", bg: "#FEE2E2", label: "Critical" },
  };

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
        <input
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
          style={{ borderColor: "#E3E9F6", background: "#F9FAFB" }}
          placeholder="Search by manager or site…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Site overview grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_SITES.map((site) => {
          const hCfg  = HEALTH_CFG[site.health as keyof typeof HEALTH_CFG];
          const mgr   = filtered.find((m) => m.site === site.name);
          return (
            <div key={site.name} className="bg-white rounded-2xl border p-5 hover:shadow-md transition-all" style={{ borderColor: "#E3E9F6" }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#F0F4FF" }}>
                    <Building2 className="w-4 h-4" style={{ color: "#4A57B9" }} />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold" style={{ color: "#111827" }}>{site.name}</div>
                    <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{site.zones} zones · {site.activePermits} permits</div>
                  </div>
                </div>
                <Badge label={hCfg.label} color={hCfg.color} bg={hCfg.bg} />
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold" style={{ color: "#6B7280" }}>Safety Score</span>
                  <span className="text-[13px] font-bold" style={{ color: scoreColor(site.safetyScore) }}>{site.safetyScore}%</span>
                </div>
                <ProgressBar value={site.safetyScore} color={scoreColor(site.safetyScore)} />
              </div>

              <div className="pt-3 border-t" style={{ borderColor: "#F1F5F9" }}>
                {mgr ? (
                  <div className="flex items-center gap-2.5">
                    <Avatar name={mgr.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold truncate" style={{ color: "#111827" }}>{mgr.name}</div>
                      <div className="text-[10px]" style={{ color: "#9CA3AF" }}>{mgr.department}</div>
                    </div>
                    <Badge label={mgr.status} color={STATUS_CFG[mgr.status].color} bg={STATUS_CFG[mgr.status].bg} />
                  </div>
                ) : (
                  <div className="text-[12px] text-center" style={{ color: "#9CA3AF" }}>No manager assigned</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Manager → Sites detail list */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b bg-slate-50/50" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Manager Site Assignments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: "#F8FAFF" }}>
              <tr>
                {["Manager", "Primary Site", "Department", "Additional Sites", "Status", "Joined"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: "#94A3B8" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#F8FAFF" }}>
              {filtered.map((mgr) => {
                const meta = mgrMeta(mgr.id);
                const sc   = STATUS_CFG[mgr.status];
                const extraSites = ALL_SITES.filter((s) => s.name !== mgr.site).slice(0, meta.additionalSites).map((s) => s.name);
                return (
                  <tr key={mgr.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={mgr.name} />
                        <div>
                          <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{mgr.name}</div>
                          <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{mgr.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "#374151" }}>
                        <MapPin className="w-3.5 h-3.5" style={{ color: "#94A3B8" }} />{mgr.site}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{mgr.department}</td>
                    <td className="px-5 py-3.5">
                      {extraSites.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {extraSites.map((s) => (
                            <span key={s} className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: "#F0F4FF", color: "#4A57B9", fontWeight: 600 }}>{s}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[12px]" style={{ color: "#9CA3AF" }}>Primary only</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5"><Badge label={mgr.status} color={sc.color} bg={sc.bg} /></td>
                    <td className="px-5 py-3.5 text-[12px]" style={{ color: "#9CA3AF" }}>
                      {new Date(mgr.joinedAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Tab 2: Compliance Scores ───────────────────────────────────────────────

function ComplianceTab({ managers }: { managers: HSEManager[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const avg = managers.filter((m) => m.status !== "Pending")
    .reduce((a, m, _, arr) => a + m.complianceScore / arr.length, 0);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Org Avg Compliance",   value: `${Math.round(avg)}%`, color: scoreColor(avg),  bg: avg >= 90 ? "#D1FAE5" : avg >= 75 ? "#FEF3C7" : "#FEE2E2", icon: BarChart3 },
          { label: "Above Target (≥90%)",  value: managers.filter((m) => m.complianceScore >= 90).length, color: "#10B981", bg: "#D1FAE5", icon: CheckCircle2 },
          { label: "Below Target (<75%)",  value: managers.filter((m) => m.complianceScore > 0 && m.complianceScore < 75).length, color: "#EF4444", bg: "#FEE2E2", icon: AlertTriangle },
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

      {/* Per-manager breakdown */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b bg-slate-50/50" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Compliance Score Breakdown</h3>
          <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>Click to expand domain scores</p>
        </div>
        <div className="divide-y" style={{ borderColor: "#F8FAFF" }}>
          {managers.map((mgr) => {
            const isOpen = expanded === mgr.id;
            const domainScores = COMPLIANCE_DOMAINS.map((d, i) => ({
              domain: d,
              score: mgr.status === "Pending" ? 0 : Math.min(100, Math.round(mgr.complianceScore + (seeded(mgr.id, 60 + i) - 0.5) * 20)),
            }));

            return (
              <div key={mgr.id}>
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors text-left"
                  onClick={() => setExpanded(isOpen ? null : mgr.id)}
                >
                  <Avatar name={mgr.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <span className="text-[13px] font-bold" style={{ color: "#111827" }}>{mgr.name}</span>
                        <span className="text-[11px] ml-2" style={{ color: "#9CA3AF" }}>{mgr.site}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {mgr.status === "Pending" ? (
                          <Badge label="Pending" color="#92400E" bg="#FEF3C7" />
                        ) : (
                          <span className="text-[14px] font-bold" style={{ color: scoreColor(mgr.complianceScore) }}>
                            {mgr.complianceScore}%
                          </span>
                        )}
                        {isOpen
                          ? <ChevronDown className="w-4 h-4" style={{ color: "#94A3B8" }} />
                          : <ChevronRight className="w-4 h-4" style={{ color: "#94A3B8" }} />}
                      </div>
                    </div>
                    {mgr.status !== "Pending" && (
                      <ProgressBar value={mgr.complianceScore} color={scoreColor(mgr.complianceScore)} />
                    )}
                  </div>
                </button>

                {isOpen && mgr.status !== "Pending" && (
                  <div className="px-5 pb-4 pt-1 bg-slate-50/30">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-12">
                      {domainScores.map(({ domain, score }) => (
                        <div key={domain}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[12px]" style={{ color: "#374151" }}>{domain}</span>
                            <span className="text-[12px] font-bold" style={{ color: scoreColor(score) }}>{score}%</span>
                          </div>
                          <ProgressBar value={score} color={scoreColor(score)} thin />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Ranking table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Compliance Ranking</h3>
        </div>
        <div className="divide-y" style={{ borderColor: "#F8FAFF" }}>
          {[...managers]
            .filter((m) => m.status !== "Pending")
            .sort((a, b) => b.complianceScore - a.complianceScore)
            .map((mgr, idx) => (
              <div key={mgr.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                <span className="text-[15px] font-bold w-6 text-center" style={{ color: idx === 0 ? "#F59E0B" : "#CBD5E1" }}>
                  #{idx + 1}
                </span>
                <Avatar name={mgr.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>{mgr.name}</span>
                  <span className="text-[11px] ml-2" style={{ color: "#9CA3AF" }}>{mgr.site}</span>
                </div>
                {idx === 0 && <Star className="w-4 h-4" style={{ color: "#F59E0B" }} />}
                <span className="text-[14px] font-bold" style={{ color: scoreColor(mgr.complianceScore) }}>
                  {mgr.complianceScore}%
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab 3: Audit Completion ────────────────────────────────────────────────

const AUDIT_STATUS_CFG = {
  Planned:     { color: "#4A57B9", bg: "#EEF2FF" },
  "In Progress": { color: "#F59E0B", bg: "#FEF3C7" },
  Completed:   { color: "#10B981", bg: "#D1FAE5" },
  Overdue:     { color: "#EF4444", bg: "#FEE2E2" },
} as const;

function AuditsTab({ managers }: { managers: HSEManager[] }) {
  const { data: checklists = [], isLoading } = useListAuditChecklistsQuery();

  const totalAudits    = managers.reduce((a, m) => a + mgrMeta(m.id).auditsTotal, 0);
  const completedAudits = managers.reduce((a, m) => a + mgrMeta(m.id).auditsDone, 0);
  const completionRate = totalAudits > 0 ? Math.round((completedAudits / totalAudits) * 100) : 0;

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><RefreshCw className="w-5 h-5 animate-spin" style={{ color: "#94A3B8" }} /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Audits Assigned", value: totalAudits,     color: "#4A57B9", bg: "#EEF2FF", icon: ClipboardList },
          { label: "Completed",             value: completedAudits,  color: "#10B981", bg: "#D1FAE5", icon: CheckCircle2 },
          { label: "Completion Rate",        value: `${completionRate}%`, color: completionRate >= 80 ? "#10B981" : "#F59E0B", bg: completionRate >= 80 ? "#D1FAE5" : "#FEF3C7", icon: TrendingUp },
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

      {/* Per-manager audit responsibilities */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Audit Responsibilities per Manager</h3>
        </div>
        <div className="divide-y" style={{ borderColor: "#F8FAFF" }}>
          {managers.map((mgr) => {
            const meta = mgrMeta(mgr.id);
            const pct  = meta.auditsTotal > 0 ? Math.round((meta.auditsDone / meta.auditsTotal) * 100) : 0;
            const color = pct >= 80 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#EF4444";

            const audits = Array.from({ length: meta.auditsTotal }, (_, i) => {
              const statusOptions = ["Completed", "In Progress", "Planned", "Overdue"] as const;
              const statusIdx = i < meta.auditsDone ? 0 : Math.floor(seeded(mgr.id, 80 + i) * 3) + 1;
              const status = statusOptions[Math.min(statusIdx, 3)];
              const nameIdx = Math.floor(seeded(mgr.id, 90 + i) * AUDIT_NAMES.length);
              return {
                id: `${mgr.id}-au${i}`,
                name: AUDIT_NAMES[nameIdx],
                status,
                due: new Date(Date.now() + (Math.floor(seeded(mgr.id, 100 + i) * 30) - 10) * 86400000).toLocaleDateString(),
              };
            });

            return (
              <div key={mgr.id} className="px-5 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={mgr.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-[13px] font-bold" style={{ color: "#111827" }}>{mgr.name}</span>
                        <span className="text-[11px] ml-2" style={{ color: "#9CA3AF" }}>{mgr.site}</span>
                      </div>
                      <span className="text-[12px] font-bold" style={{ color }}>
                        {meta.auditsDone}/{meta.auditsTotal} · {pct}%
                      </span>
                    </div>
                    <ProgressBar value={pct} color={color} />
                  </div>
                </div>
                <div className="space-y-1.5 pl-12">
                  {audits.map((a) => {
                    const cfg = AUDIT_STATUS_CFG[a.status];
                    return (
                      <div key={a.id} className="flex items-center justify-between gap-2 text-[12px]">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                          <span style={{ color: "#374151" }}>{a.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span style={{ color: "#9CA3AF" }}>{a.due}</span>
                          <Badge label={a.status} color={cfg.color} bg={cfg.bg} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Published audit checklists */}
      {checklists.length > 0 && (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
            <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Published Audit Templates</h3>
            <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>{checklists.length} templates available</p>
          </div>
          <div className="divide-y" style={{ borderColor: "#F8FAFF" }}>
            {checklists.map((cl) => (
              <div key={cl.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                <div>
                  <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{cl.name}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>{cl.category} · {cl.items?.length ?? 0} items</div>
                </div>
                <Badge
                  label={cl.status === "published" ? "Published" : "Draft"}
                  color={cl.status === "published" ? "#10B981" : "#6B7280"}
                  bg={cl.status === "published" ? "#D1FAE5" : "#F3F4F6"}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 4: Risk Assessments ────────────────────────────────────────────────

function RiskTab({ managers }: { managers: HSEManager[] }) {
  const totalOpen   = managers.reduce((a, m) => a + mgrMeta(m.id).riskOpen, 0);
  const totalClosed = managers.reduce((a, m) => a + mgrMeta(m.id).riskClosed, 0);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Open Risk Assessments",   value: totalOpen,   color: "#EF4444", bg: "#FEE2E2", icon: AlertTriangle },
          { label: "Closed / Mitigated",      value: totalClosed, color: "#10B981", bg: "#D1FAE5", icon: CheckCircle2 },
          { label: "Total Managed",           value: totalOpen + totalClosed, color: "#4A57B9", bg: "#EEF2FF", icon: Layers },
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

      {/* Per-manager risk list */}
      <div className="space-y-4">
        {managers.map((mgr) => {
          const meta = mgrMeta(mgr.id);
          const risks = Array.from({ length: meta.riskOpen + 2 }, (_, i) => {
            const riskIdx  = Math.floor(seeded(mgr.id, 110 + i) * RISK_LEVELS.length);
            const typeIdx  = Math.floor(seeded(mgr.id, 120 + i) * RISK_TYPES.length);
            const zoneIdx  = Math.floor(seeded(mgr.id, 130 + i) * SITE_ZONES.length);
            const isClosed = i >= meta.riskOpen;
            return {
              id: `${mgr.id}-r${i}`,
              type: RISK_TYPES[typeIdx],
              level: RISK_LEVELS[riskIdx],
              zone: SITE_ZONES[zoneIdx],
              closed: isClosed,
              daysAgo: Math.floor(seeded(mgr.id, 140 + i) * 60),
            };
          });

          return (
            <div key={mgr.id} className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
              <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: "#F1F5F9" }}>
                <Avatar name={mgr.name} size="sm" />
                <div className="flex-1">
                  <span className="text-[13px] font-bold" style={{ color: "#111827" }}>{mgr.name}</span>
                  <span className="text-[11px] ml-2" style={{ color: "#9CA3AF" }}>{mgr.site}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge label={`${meta.riskOpen} open`} color="#EF4444" bg="#FEE2E2" />
                  <Badge label={`${meta.riskClosed} closed`} color="#10B981" bg="#D1FAE5" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ background: "#F8FAFF" }}>
                    <tr>
                      {["Risk Type", "Level", "Zone", "Status", "Age"].map((h) => (
                        <th key={h} className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: "#94A3B8" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "#F8FAFF" }}>
                    {risks.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 text-[12px] font-semibold" style={{ color: "#111827" }}>{r.type}</td>
                        <td className="px-5 py-3"><Badge label={r.level.label} color={r.level.color} bg={r.level.bg} /></td>
                        <td className="px-5 py-3 text-[11px]" style={{ color: "#6B7280" }}>
                          <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.zone.split("–")[0].trim()}</div>
                        </td>
                        <td className="px-5 py-3">
                          <Badge label={r.closed ? "Mitigated" : "Open"} color={r.closed ? "#10B981" : "#EF4444"} bg={r.closed ? "#D1FAE5" : "#FEE2E2"} />
                        </td>
                        <td className="px-5 py-3 text-[11px]" style={{ color: "#9CA3AF" }}>
                          {r.daysAgo === 0 ? "Today" : `${r.daysAgo}d ago`}
                        </td>
                      </tr>
                    ))}
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

// ── Tab 5: Incident Investigations ────────────────────────────────────────

const INC_SEV: Record<string, { color: string; bg: string }> = {
  low:      { color: "#10B981", bg: "#D1FAE5" },
  medium:   { color: "#F59E0B", bg: "#FEF3C7" },
  high:     { color: "#EF4444", bg: "#FEE2E2" },
  critical: { color: "#991B1B", bg: "#FEF2F2" },
};
const INC_STATUS: Record<string, { color: string; bg: string }> = {
  open:          { color: "#EF4444", bg: "#FEE2E2" },
  investigating: { color: "#F59E0B", bg: "#FEF3C7" },
  resolved:      { color: "#10B981", bg: "#D1FAE5" },
  closed:        { color: "#6B7280", bg: "#F3F4F6" },
};

function InvestigationsTab({ managers }: { managers: HSEManager[] }) {
  const { data: incidents = [], isLoading } = useListIncidentsQuery();
  const [selectedMgr, setSelectedMgr] = useState<string>("all");

  const totalOpen       = managers.reduce((a, m) => a + mgrMeta(m.id).invOpen, 0);
  const totalInProgress = managers.reduce((a, m) => a + mgrMeta(m.id).invInProgress, 0);
  const totalClosed     = managers.reduce((a, m) => a + mgrMeta(m.id).invClosed, 0);

  const displayed = selectedMgr === "all"
    ? incidents
    : incidents.filter((inc) => {
        const mgr = managers.find((m) => m.id === selectedMgr);
        if (!mgr) return false;
        const nameParts = mgr.name.toLowerCase().split(" ");
        return nameParts.some((p) => inc.reported_by.toLowerCase().includes(p));
      });

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><RefreshCw className="w-5 h-5 animate-spin" style={{ color: "#94A3B8" }} /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Open Investigations",      value: totalOpen,       color: "#EF4444", bg: "#FEE2E2", icon: AlertTriangle },
          { label: "In Progress",              value: totalInProgress,  color: "#F59E0B", bg: "#FEF3C7", icon: Activity },
          { label: "Closed / Resolved",        value: totalClosed,      color: "#10B981", bg: "#D1FAE5", icon: CheckCircle2 },
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

      {/* Per-manager investigation load */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Investigation Workload</h3>
        </div>
        <div className="divide-y" style={{ borderColor: "#F8FAFF" }}>
          {managers.map((mgr) => {
            const meta  = mgrMeta(mgr.id);
            const total = meta.invOpen + meta.invInProgress + meta.invClosed;
            const closedPct = total > 0 ? Math.round((meta.invClosed / total) * 100) : 0;
            return (
              <div key={mgr.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                <Avatar name={mgr.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>{mgr.name}</span>
                      <span className="text-[11px] ml-2" style={{ color: "#9CA3AF" }}>{mgr.site}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {meta.invOpen > 0 && <Badge label={`${meta.invOpen} open`} color="#EF4444" bg="#FEE2E2" />}
                      {meta.invInProgress > 0 && <Badge label={`${meta.invInProgress} active`} color="#F59E0B" bg="#FEF3C7" />}
                      <Badge label={`${meta.invClosed} closed`} color="#10B981" bg="#D1FAE5" />
                    </div>
                  </div>
                  <ProgressBar value={closedPct} color="#10B981" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter + incident list */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setSelectedMgr("all")}
          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
          style={{ background: selectedMgr === "all" ? "#4A57B9" : "#F1F5F9", color: selectedMgr === "all" ? "#fff" : "#374151" }}
        >
          All
        </button>
        {managers.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedMgr(m.id)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
            style={{ background: selectedMgr === m.id ? "#4A57B9" : "#F1F5F9", color: selectedMgr === m.id ? "#fff" : "#374151" }}
          >
            {m.name.split(" ")[0]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "#F1F5F9" }}>
          <FileSearch className="w-4 h-4" style={{ color: "#94A3B8" }} />
          <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>
            Incident Log {displayed.length > 0 && <span style={{ color: "#94A3B8", fontWeight: 400 }}>({displayed.length})</span>}
          </h3>
        </div>
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
                  const sev = INC_SEV[inc.severity]   ?? INC_SEV.low;
                  const st  = INC_STATUS[inc.status]  ?? INC_STATUS.closed;
                  return (
                    <tr key={inc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{inc.title}</div>
                        {inc.description && (
                          <div className="text-[11px] line-clamp-1 mt-0.5" style={{ color: "#9CA3AF" }}>{inc.description}</div>
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
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: "sites",          label: "Assigned Sites",       icon: MapPin },
  { id: "compliance",     label: "Compliance Scores",    icon: Shield },
  { id: "audits",         label: "Audit Completion",     icon: ClipboardList },
  { id: "risk",           label: "Risk Assessments",     icon: AlertTriangle },
  { id: "investigations", label: "Incident Investigations", icon: FileSearch },
];

export function HSEManagersScreen() {
  const [activeTab, setActiveTab] = useState<TabId>("sites");

  const activeManagers  = MANAGERS.filter((m) => m.status === "Active");
  const sitesCovered    = new Set(MANAGERS.map((m) => m.site)).size;
  const avgCompliance   = activeManagers.length
    ? Math.round(activeManagers.reduce((a, m) => a + m.complianceScore, 0) / activeManagers.length)
    : 0;
  const totalOpenInc    = MANAGERS.reduce((a, m) => a + m.openIncidents, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between rounded-2xl border px-5 py-4" style={{ borderColor: "#DCE4F3", background: "#FFFFFF" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2D3FA8, #6475E8)" }}>
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: "#111827" }}>HSE Managers</h1>
            <p className="text-[12px]" style={{ color: "#64748B" }}>Site coverage, compliance performance, audit duties & investigation oversight</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "#94A3B8" }}>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#10B981" }} />
          Live
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={ShieldCheck}  label="Total HSE Managers"  value={MANAGERS.length}     sub={`${activeManagers.length} active`}       color="#4A57B9" bg="#EEF2FF" />
        <KpiCard icon={Building2}    label="Sites Covered"        value={sitesCovered}         sub="across organisation"                     color="#10B981" bg="#D1FAE5" />
        <KpiCard icon={TrendingUp}   label="Avg Compliance"       value={`${avgCompliance}%`}  sub="active managers"                         color={scoreColor(avgCompliance)} bg={avgCompliance >= 90 ? "#D1FAE5" : avgCompliance >= 75 ? "#FEF3C7" : "#FEE2E2"} />
        <KpiCard icon={AlertTriangle} label="Open Incidents"      value={totalOpenInc}          sub="need investigation"                      color="#EF4444" bg="#FEE2E2" />
      </div>

      {/* Tabs */}
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
          {activeTab === "sites"          && <SitesTab          managers={MANAGERS} />}
          {activeTab === "compliance"     && <ComplianceTab     managers={MANAGERS} />}
          {activeTab === "audits"         && <AuditsTab         managers={MANAGERS} />}
          {activeTab === "risk"           && <RiskTab           managers={MANAGERS} />}
          {activeTab === "investigations" && <InvestigationsTab managers={MANAGERS} />}
        </div>
      </div>
    </div>
  );
}
