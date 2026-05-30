import { useState, useMemo } from "react";
import {
  BookOpen, Award, AlertTriangle, CheckCircle2, Clock, Users,
  TrendingUp, ChevronDown, ChevronRight, Search, Star, Target,
  Lightbulb, Calendar, BarChart3,
} from "lucide-react";
import { useListEmployeesQuery } from "@/features/employees/api/employeesApi";
import {
  useListTrainingGapsQuery,
  useGetTrainingMatrixQuery,
} from "@/features/training/api/trainingApi";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "completion" | "skills" | "certifications" | "competency" | "recommendations";
type CertStatus = "valid" | "expiring" | "expired";
type ProfLevel = 0 | 1 | 2 | 3;    // 0=Not Assessed, 1=Basic, 2=Proficient, 3=Expert
type CompetencyScore = 1 | 2 | 3 | 4 | 5;

// ─── Static Catalogs ──────────────────────────────────────────────────────────

const COURSES = [
  { id: "c1",  name: "Basic Fire Safety",          category: "Safety",      hours: 4 },
  { id: "c2",  name: "PPE Usage & Inspection",     category: "Safety",      hours: 2 },
  { id: "c3",  name: "Chemical Handling",          category: "Safety",      hours: 6 },
  { id: "c4",  name: "Emergency Response",         category: "Safety",      hours: 8 },
  { id: "c5",  name: "Incident Reporting",         category: "Compliance",  hours: 3 },
  { id: "c6",  name: "Risk Assessment Basics",     category: "Compliance",  hours: 5 },
  { id: "c7",  name: "Permit to Work System",      category: "Operations",  hours: 4 },
  { id: "c8",  name: "Audit Techniques",           category: "Compliance",  hours: 8 },
  { id: "c9",  name: "HSE Management System",      category: "Management",  hours: 16 },
  { id: "c10", name: "Leadership & Communication", category: "Management",  hours: 8 },
  { id: "c11", name: "First Aid & CPR",            category: "Safety",      hours: 8 },
  { id: "c12", name: "Environmental Compliance",   category: "Compliance",  hours: 4 },
];

const SKILLS = [
  { id: "s1",  name: "Hazard Identification",  category: "Safety"      },
  { id: "s2",  name: "Risk Assessment",         category: "Safety"      },
  { id: "s3",  name: "PPE Selection & Use",     category: "Safety"      },
  { id: "s4",  name: "Emergency Response",      category: "Safety"      },
  { id: "s5",  name: "First Aid",               category: "Safety"      },
  { id: "s6",  name: "Incident Investigation",  category: "Compliance"  },
  { id: "s7",  name: "Audit & Inspection",      category: "Compliance"  },
  { id: "s8",  name: "Environmental Monitoring",category: "Compliance"  },
  { id: "s9",  name: "Permit Management",       category: "Operations"  },
  { id: "s10", name: "Chemical Handling",       category: "Operations"  },
  { id: "s11", name: "Team Leadership",         category: "Management"  },
  { id: "s12", name: "Report Writing",          category: "Management"  },
];

const ROLE_PROFILES = [
  { id: "rp-worker",      label: "Worker",      color: "#3B82F6" },
  { id: "rp-supervisor",  label: "Supervisor",  color: "#8B5CF6" },
  { id: "rp-hse-manager", label: "HSE Manager", color: "#059669" },
  { id: "rp-auditor",     label: "Auditor",     color: "#D97706" },
  { id: "rp-contractor",  label: "Contractor",  color: "#6366F1" },
];

const COMPETENCY_DOMAINS = [
  { id: "technical",     name: "Technical Skills"       },
  { id: "safety",        name: "Safety Awareness"       },
  { id: "communication", name: "Communication"          },
  { id: "leadership",    name: "Leadership"             },
  { id: "compliance",    name: "Regulatory Compliance"  },
];

const CERT_NAMES = [
  "NEBOSH General Certificate",
  "IOSH Managing Safely",
  "First Aid at Work",
  "Fire Warden Certification",
  "Chemical Safety Handler",
  "Confined Space Entry",
  "Working at Heights",
  "Scaffolding Inspector",
  "Electrical Safety",
  "Forklift Operation",
];
const CERT_ISSUERS = ["NEBOSH", "IOSH", "Red Cross", "BSI", "HSE Board", "CITB"];

const REC_REASONS = [
  "Role requirement not yet fulfilled",
  "Identified gap from last audit",
  "Certification renewal due",
  "Regulatory compliance mandate",
  "Site-specific hazard exposure",
  "Promotion readiness pathway",
  "Incident pattern in department",
];

// ─── Seeded helpers ───────────────────────────────────────────────────────────

function seeded(id: string, offset = 0): number {
  let h = offset;
  for (let i = 0; i < id.length; i++) h = Math.imul(31, h) + id.charCodeAt(i);
  return Math.abs(Math.sin(h) * 10000) % 1;
}

function pick<T>(arr: T[], id: string, offset = 0): T {
  return arr[Math.floor(seeded(id, offset) * arr.length)];
}

interface EmpMeta {
  done: number; total: number; pct: number; score: number;
  status: "compliant" | "in-progress" | "overdue";
  completedThisMonth: boolean;
}
function empMeta(id: string): EmpMeta {
  const total = 4 + Math.floor(seeded(id, 1) * 8);
  const pct = Math.floor(30 + seeded(id, 2) * 70);
  const done = Math.round(total * pct / 100);
  const score = Math.floor(55 + seeded(id, 3) * 45);
  const status = pct >= 90 ? "compliant" : pct >= 50 ? "in-progress" : "overdue";
  const completedThisMonth = seeded(id, 4) > 0.6;
  return { done, total, pct, score, status, completedThisMonth };
}

interface CertEntry {
  name: string; issuer: string; issuedYear: number;
  expiryDays: number; status: CertStatus;
}
function empCerts(id: string): CertEntry[] {
  const count = 1 + Math.floor(seeded(id, 20) * 4);
  return Array.from({ length: count }, (_, i) => {
    const name = pick(CERT_NAMES, id + i, 21);
    const issuer = pick(CERT_ISSUERS, id + i, 22);
    const issuedYear = 2022 + Math.floor(seeded(id + i, 23) * 3);
    const raw = Math.floor(-60 + seeded(id + i, 24) * 500);
    const status: CertStatus = raw < 0 ? "expired" : raw < 45 ? "expiring" : "valid";
    return { name, issuer, issuedYear, expiryDays: raw, status };
  });
}

function skillLevel(roleId: string, skillId: string): ProfLevel {
  const v = seeded(roleId + skillId, 30);
  if (v < 0.15) return 0;
  if (v < 0.40) return 1;
  if (v < 0.72) return 2;
  return 3;
}

function compScore(empId: string, domainId: string): CompetencyScore {
  return (1 + Math.floor(seeded(empId + domainId, 40) * 5)) as CompetencyScore;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border p-5 flex items-start gap-4" style={{ borderColor: "#E3E9F6" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-bold" style={{ color: "#111827" }}>{value}</div>
        <div className="text-xs font-semibold mt-0.5" style={{ color: "#374151" }}>{label}</div>
        <div className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>{sub}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: EmpMeta["status"] }) {
  const map = {
    compliant:    { bg: "#D1FAE5", color: "#065F46", label: "Compliant"    },
    "in-progress":{ bg: "#DBEAFE", color: "#1D4ED8", label: "In Progress"  },
    overdue:      { bg: "#FEE2E2", color: "#B91C1C", label: "Overdue"      },
  };
  const s = map[status];
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}>{s.label}</span>
  );
}

function CertBadge({ status }: { status: CertStatus }) {
  const map = {
    valid:    { bg: "#D1FAE5", color: "#065F46", label: "Valid"          },
    expiring: { bg: "#FEF3C7", color: "#92400E", label: "Expiring Soon"  },
    expired:  { bg: "#FEE2E2", color: "#B91C1C", label: "Expired"        },
  };
  const s = map[status];
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}>{s.label}</span>
  );
}

const PROF_LABELS: Record<ProfLevel, string> = { 0: "—", 1: "Basic", 2: "Proficient", 3: "Expert" };
const PROF_COLORS: Record<ProfLevel, { bg: string; text: string }> = {
  0: { bg: "#F3F4F6", text: "#9CA3AF" },
  1: { bg: "#DBEAFE", text: "#1D4ED8" },
  2: { bg: "#EDE9FE", text: "#5B21B6" },
  3: { bg: "#D1FAE5", text: "#065F46" },
};

function ProfCell({ level }: { level: ProfLevel }) {
  const { bg, text } = PROF_COLORS[level];
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: bg, color: text }}>
      {PROF_LABELS[level]}
    </span>
  );
}

// ─── Tab 1: Training Completion ───────────────────────────────────────────────

function CompletionTab({ employees, loading }: {
  employees: { id: string; name: string; department?: string; role?: string }[];
  loading: boolean;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | EmpMeta["status"]>("all");

  const rows = useMemo(() =>
    employees.map((e) => ({ ...e, meta: empMeta(e.id) })),
    [employees]
  );

  const filtered = rows.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.department ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || r.meta.status === filter;
    return matchSearch && matchFilter;
  });

  const overallPct = rows.length
    ? Math.round(rows.reduce((s, r) => s + r.meta.pct, 0) / rows.length)
    : 0;
  const compliantCount = rows.filter((r) => r.meta.status === "compliant").length;
  const overdueCount = rows.filter((r) => r.meta.status === "overdue").length;
  const completedThisMonth = rows.filter((r) => r.meta.completedThisMonth).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Overall Completion" value={`${overallPct}%`} sub="Org-wide average" icon={BarChart3} color="#4A57B9" />
        <KpiCard label="Fully Compliant" value={compliantCount} sub="All courses done" icon={CheckCircle2} color="#059669" />
        <KpiCard label="Overdue" value={overdueCount} sub="Need immediate action" icon={AlertTriangle} color="#EF4444" />
        <KpiCard label="Completed This Month" value={completedThisMonth} sub="New completions" icon={TrendingUp} color="#D97706" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-white border rounded-xl px-3 py-2"
          style={{ borderColor: "#E3E9F6" }}>
          <Search size={14} style={{ color: "#9CA3AF" }} />
          <input className="flex-1 text-sm outline-none bg-transparent"
            placeholder="Search employees…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ color: "#111827" }} />
        </div>
        {(["all", "compliant", "in-progress", "overdue"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
            style={filter === f
              ? { background: "#4A57B9", color: "#fff", borderColor: "#4A57B9" }
              : { background: "#fff", color: "#6B7280", borderColor: "#E3E9F6" }}>
            {f === "all" ? "All" : f === "in-progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        {loading ? (
          <div className="p-10 text-center text-sm" style={{ color: "#9CA3AF" }}>Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                <th className="px-5 py-3 text-left text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>EMPLOYEE</th>
                <th className="px-5 py-3 text-left text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>DEPARTMENT</th>
                <th className="px-5 py-3 text-left text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>PROGRESS</th>
                <th className="px-5 py-3 text-center text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>COURSES</th>
                <th className="px-5 py-3 text-center text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>AVG SCORE</th>
                <th className="px-5 py-3 text-center text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#F3F4F6" }}>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm" style={{ color: "#9CA3AF" }}>No records found.</td></tr>
              ) : (
                filtered.slice(0, 50).map(({ id, name, department, role, meta }) => (
                  <tr key={id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: "#EEF2FB", color: "#4A57B9" }}>
                          {name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold" style={{ color: "#111827" }}>{name}</div>
                          <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{role ?? "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "#374151" }}>
                      {department ?? "General"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#F3F4F6", minWidth: 80 }}>
                          <div className="h-full rounded-full transition-all"
                            style={{
                              width: `${meta.pct}%`,
                              background: meta.pct >= 90 ? "#10B981" : meta.pct >= 50 ? "#4A57B9" : "#EF4444",
                            }} />
                        </div>
                        <span className="text-xs font-semibold w-9 text-right" style={{ color: "#374151" }}>{meta.pct}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span style={{ color: "#374151" }}>{meta.done}</span>
                      <span style={{ color: "#9CA3AF" }}>/{meta.total}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="text-sm font-semibold"
                        style={{ color: meta.score >= 80 ? "#059669" : meta.score >= 60 ? "#D97706" : "#EF4444" }}>
                        {meta.score}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge status={meta.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Tab 2: Skill Matrix ──────────────────────────────────────────────────────

function SkillMatrixTab() {
  const [expandedCat, setExpandedCat] = useState<string | null>("Safety");
  const skillCategories = [...new Set(SKILLS.map((s) => s.category))];

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: "#6B7280" }}>
        Proficiency level of each role across all skill domains. Used to identify training needs and assign work appropriately.
      </p>

      <div className="flex gap-3 mb-1">
        {([0, 1, 2, 3] as ProfLevel[]).map((l) => (
          <div key={l} className="flex items-center gap-1.5">
            <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: PROF_COLORS[l].bg, color: PROF_COLORS[l].text }}>
              {PROF_LABELS[l] === "—" ? "Not Assessed" : PROF_LABELS[l]}
            </span>
          </div>
        ))}
      </div>

      {skillCategories.map((cat) => {
        const catSkills = SKILLS.filter((s) => s.category === cat);
        const isOpen = expandedCat === cat;
        return (
          <div key={cat} className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
            <button
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedCat(isOpen ? null : cat)}
            >
              <div className="flex items-center gap-2">
                <Target size={14} style={{ color: "#4A57B9" }} />
                <span className="text-[13px] font-bold" style={{ color: "#111827" }}>{cat}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#6B7280" }}>
                  {catSkills.length} skills
                </span>
              </div>
              {isOpen ? <ChevronDown size={15} style={{ color: "#9CA3AF" }} /> : <ChevronRight size={15} style={{ color: "#9CA3AF" }} />}
            </button>

            {isOpen && (
              <div style={{ borderTop: "1px solid #F3F4F6", overflowX: "auto" }}>
                <table className="w-full text-sm" style={{ minWidth: 600 }}>
                  <thead>
                    <tr style={{ background: "#F8FAFF" }}>
                      <th className="px-5 py-2.5 text-left text-[11px] font-bold tracking-wide sticky left-0 bg-[#F8FAFF]"
                        style={{ color: "#6B7280", minWidth: 180 }}>SKILL</th>
                      {ROLE_PROFILES.map((r) => (
                        <th key={r.id} className="px-4 py-2.5 text-center text-[11px] font-bold tracking-wide"
                          style={{ color: "#6B7280", minWidth: 100 }}>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                            style={{ background: r.color + "18", color: r.color }}>
                            {r.label}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "#F3F4F6" }}>
                    {catSkills.map((skill) => (
                      <tr key={skill.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 sticky left-0 bg-white">
                          <span className="font-medium" style={{ color: "#374151" }}>{skill.name}</span>
                        </td>
                        {ROLE_PROFILES.map((r) => (
                          <td key={r.id} className="px-4 py-3 text-center">
                            <ProfCell level={skillLevel(r.id, skill.id)} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab 3: Certification Expiry ──────────────────────────────────────────────

function CertificationExpiryTab({ employees, loading }: {
  employees: { id: string; name: string; department?: string; role?: string }[];
  loading: boolean;
}) {
  const [certFilter, setCertFilter] = useState<"all" | CertStatus>("all");
  const [search, setSearch] = useState("");

  const allCerts = useMemo(() =>
    employees.flatMap((e) =>
      empCerts(e.id).map((c) => ({ ...c, empName: e.name, dept: e.department ?? "General", role: e.role ?? "—" }))
    ),
    [employees]
  );

  const expiring = allCerts.filter((c) => c.status === "expiring").length;
  const expired  = allCerts.filter((c) => c.status === "expired").length;
  const valid    = allCerts.filter((c) => c.status === "valid").length;

  const filtered = allCerts
    .filter((c) => {
      const matchFilter = certFilter === "all" || c.status === certFilter;
      const matchSearch = c.empName.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    })
    .sort((a, b) => a.expiryDays - b.expiryDays);

  return (
    <div className="space-y-4">
      {(expiring > 0 || expired > 0) && (
        <div className="rounded-2xl border p-4 flex items-start gap-3"
          style={{ borderColor: "#FDE68A", background: "#FFFBEB" }}>
          <AlertTriangle size={16} style={{ color: "#D97706", flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs" style={{ color: "#92400E" }}>
            <strong>{expired} certifications expired</strong> and{" "}
            <strong>{expiring} expiring within 45 days.</strong> Renew them promptly to stay compliant.
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Valid Certifications"   value={valid}    sub="Up to date"            icon={CheckCircle2}  color="#059669" />
        <KpiCard label="Expiring Soon"          value={expiring} sub="Within 45 days"         icon={Clock}         color="#D97706" />
        <KpiCard label="Expired"               value={expired}  sub="Action required"        icon={AlertTriangle} color="#EF4444" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-white border rounded-xl px-3 py-2"
          style={{ borderColor: "#E3E9F6" }}>
          <Search size={14} style={{ color: "#9CA3AF" }} />
          <input className="flex-1 text-sm outline-none bg-transparent"
            placeholder="Search employee or certificate…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ color: "#111827" }} />
        </div>
        {(["all", "valid", "expiring", "expired"] as const).map((f) => (
          <button key={f} onClick={() => setCertFilter(f)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
            style={certFilter === f
              ? { background: "#4A57B9", color: "#fff", borderColor: "#4A57B9" }
              : { background: "#fff", color: "#6B7280", borderColor: "#E3E9F6" }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        {loading ? (
          <div className="p-10 text-center text-sm" style={{ color: "#9CA3AF" }}>Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                <th className="px-5 py-3 text-left text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>EMPLOYEE</th>
                <th className="px-5 py-3 text-left text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>CERTIFICATE</th>
                <th className="px-5 py-3 text-left text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>ISSUED BY</th>
                <th className="px-5 py-3 text-center text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>ISSUED YEAR</th>
                <th className="px-5 py-3 text-center text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>DAYS LEFT</th>
                <th className="px-5 py-3 text-center text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#F3F4F6" }}>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm" style={{ color: "#9CA3AF" }}>No certificates match filter.</td></tr>
              ) : (
                filtered.slice(0, 60).map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold" style={{ color: "#111827" }}>{c.empName}</div>
                      <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{c.dept}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Award size={13} style={{ color: "#4A57B9" }} />
                        <span style={{ color: "#374151" }}>{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5" style={{ color: "#6B7280" }}>{c.issuer}</td>
                    <td className="px-5 py-3.5 text-center" style={{ color: "#374151" }}>{c.issuedYear}</td>
                    <td className="px-5 py-3.5 text-center">
                      {c.expiryDays < 0 ? (
                        <span className="text-xs font-semibold" style={{ color: "#EF4444" }}>
                          {Math.abs(c.expiryDays)}d overdue
                        </span>
                      ) : (
                        <span className="text-xs font-semibold"
                          style={{ color: c.expiryDays < 45 ? "#D97706" : "#059669" }}>
                          {c.expiryDays}d
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <CertBadge status={c.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Tab 4: Competency Levels ─────────────────────────────────────────────────

function CompetencyLevelsTab({ employees, loading }: {
  employees: { id: string; name: string; department?: string; role?: string }[];
  loading: boolean;
}) {
  const [activeRole, setActiveRole] = useState(ROLE_PROFILES[0].id);
  const [expandedEmp, setExpandedEmp] = useState<string | null>(null);

  const profile = ROLE_PROFILES.find((r) => r.id === activeRole)!;

  const roleKeyword = profile.label.toLowerCase();
  const roleEmps = employees.filter((e) =>
    (e.role ?? "").toLowerCase().includes(roleKeyword) ||
    (e.department ?? "").toLowerCase().includes(roleKeyword)
  ).slice(0, 12);

  const displayEmps = roleEmps.length >= 3 ? roleEmps : employees.slice(0, 8);

  function ScoreBar({ score, color }: { score: CompetencyScore; color: string }) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-4 h-2.5 rounded-sm"
              style={{ background: i <= score ? color : "#E5E7EB" }} />
          ))}
        </div>
        <span className="text-[11px] font-semibold" style={{ color: "#6B7280" }}>
          {["", "Novice", "Beginner", "Competent", "Proficient", "Expert"][score]}
        </span>
      </div>
    );
  }

  const domainAverages = COMPETENCY_DOMAINS.map((d) => {
    const scores = displayEmps.map((e) => compScore(e.id, d.id));
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return { ...d, avg: Math.round(avg * 10) / 10 };
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {ROLE_PROFILES.map((r) => (
          <button key={r.id} onClick={() => setActiveRole(r.id)}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all"
            style={activeRole === r.id
              ? { background: r.color, color: "#fff", borderColor: r.color }
              : { background: "#fff", color: "#6B7280", borderColor: "#E3E9F6" }}>
            {r.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full" style={{ background: profile.color }} />
          <h3 className="text-[13px] font-bold" style={{ color: "#111827" }}>
            {profile.label} — Domain Averages
          </h3>
        </div>
        <div className="space-y-3">
          {domainAverages.map((d) => (
            <div key={d.id} className="flex items-center gap-4">
              <div className="text-xs font-medium w-40 flex-shrink-0" style={{ color: "#374151" }}>{d.name}</div>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${(d.avg / 5) * 100}%`, background: profile.color }} />
              </div>
              <span className="text-xs font-bold w-8 text-right" style={{ color: profile.color }}>{d.avg}</span>
              <span className="text-[11px] w-20" style={{ color: "#9CA3AF" }}>
                {["", "Novice", "Beginner", "Competent", "Proficient", "Expert"][Math.round(d.avg)] ?? ""}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-3.5 border-b" style={{ borderColor: "#E9EEF8", background: "#F8FAFF" }}>
          <h3 className="text-[13px] font-bold" style={{ color: "#111827" }}>Individual Competency Breakdown</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: "#9CA3AF" }}>Loading…</div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#F3F4F6" }}>
            {displayEmps.map((e) => {
              const isOpen = expandedEmp === e.id;
              const scores = COMPETENCY_DOMAINS.map((d) => compScore(e.id, d.id));
              const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10;
              return (
                <div key={e.id}>
                  <button
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                    onClick={() => setExpandedEmp(isOpen ? null : e.id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: profile.color + "18", color: profile.color }}>
                        {e.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: "#111827" }}>{e.name}</div>
                        <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{e.department ?? "General"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} size={11}
                            style={{ color: i <= avg ? profile.color : "#E5E7EB", fill: i <= avg ? profile.color : "none" }} />
                        ))}
                        <span className="text-xs font-semibold ml-1" style={{ color: profile.color }}>{avg}</span>
                      </div>
                      {isOpen ? <ChevronDown size={15} style={{ color: "#9CA3AF" }} /> : <ChevronRight size={15} style={{ color: "#9CA3AF" }} />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 grid grid-cols-1 md:grid-cols-2 gap-2"
                      style={{ borderTop: "1px solid #F3F4F6", background: "#FAFBFF" }}>
                      {COMPETENCY_DOMAINS.map((d, i) => (
                        <div key={d.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border"
                          style={{ borderColor: "#E3E9F6" }}>
                          <span className="text-xs font-medium w-36 flex-shrink-0" style={{ color: "#374151" }}>{d.name}</span>
                          <ScoreBar score={scores[i]} color={profile.color} />
                        </div>
                      ))}
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

// ─── Tab 5: Training Recommendations ─────────────────────────────────────────

function RecommendationsTab({ employees, gaps, loading }: {
  employees: { id: string; name: string; department?: string; role?: string }[];
  gaps: { employee_id: string; employee_name: string; role: string; missing_courses: string[]; priority: "low" | "medium" | "high" }[];
  loading: boolean;
}) {
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");

  const apiRecs = gaps.map((g) =>
    g.missing_courses.map((course) => ({
      empId: g.employee_id,
      empName: g.employee_name,
      dept: "—",
      role: g.role,
      course,
      priority: g.priority,
      reason: pick(REC_REASONS, g.employee_id + course, 50),
      hours: COURSES.find((c) => c.name === course)?.hours ?? (2 + Math.floor(seeded(course, 51) * 6)),
    }))
  ).flat();

  const seededRecs = employees.slice(0, 15).flatMap((e) => {
    const meta = empMeta(e.id);
    if (meta.status !== "overdue" && meta.status !== "in-progress") return [];
    const courseCount = 1 + Math.floor(seeded(e.id, 60) * 2);
    return Array.from({ length: courseCount }, (_, i) => {
      const course = pick(COURSES, e.id + i, 61);
      return {
        empId: e.id,
        empName: e.name,
        dept: e.department ?? "General",
        role: e.role ?? "—",
        course: course.name,
        priority: meta.status === "overdue" ? "high" : (seeded(e.id + i, 62) > 0.5 ? "medium" : "low") as "high" | "medium" | "low",
        reason: pick(REC_REASONS, e.id + course.id, 63),
        hours: course.hours,
      };
    });
  });

  const allRecs = [...apiRecs, ...seededRecs].filter((r, idx, arr) =>
    arr.findIndex((x) => x.empId === r.empId && x.course === r.course) === idx
  );

  const filtered = allRecs.filter((r) => priorityFilter === "all" || r.priority === priorityFilter);
  const highCount = allRecs.filter((r) => r.priority === "high").length;
  const medCount  = allRecs.filter((r) => r.priority === "medium").length;
  const lowCount  = allRecs.filter((r) => r.priority === "low").length;

  const priorityConfig = {
    high:   { bg: "#FEE2E2", text: "#B91C1C", border: "#FECACA", label: "High Priority"   },
    medium: { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A", label: "Medium Priority" },
    low:    { bg: "#D1FAE5", text: "#065F46", border: "#A7F3D0", label: "Low Priority"    },
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="High Priority"   value={highCount} sub="Immediate action needed" icon={AlertTriangle} color="#EF4444" />
        <KpiCard label="Medium Priority" value={medCount}  sub="Schedule within 30 days" icon={Clock}        color="#D97706" />
        <KpiCard label="Low Priority"    value={lowCount}  sub="Plan for next quarter"   icon={BookOpen}     color="#059669" />
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "high", "medium", "low"] as const).map((f) => (
          <button key={f} onClick={() => setPriorityFilter(f)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
            style={priorityFilter === f
              ? { background: "#4A57B9", color: "#fff", borderColor: "#4A57B9" }
              : { background: "#fff", color: "#6B7280", borderColor: "#E3E9F6" }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border p-10 text-center text-sm"
          style={{ borderColor: "#E3E9F6", color: "#9CA3AF" }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border p-10 text-center text-sm"
          style={{ borderColor: "#E3E9F6", color: "#9CA3AF" }}>No recommendations for this filter.</div>
      ) : (
        <div className="space-y-3">
          {(["high", "medium", "low"] as const)
            .filter((p) => priorityFilter === "all" || priorityFilter === p)
            .map((pLevel) => {
              const group = filtered.filter((r) => r.priority === pLevel);
              if (group.length === 0) return null;
              const cfg = priorityConfig[pLevel];
              return (
                <div key={pLevel}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-px flex-1" style={{ background: "#E3E9F6" }} />
                    <span className="text-[11px] font-bold px-3 py-0.5 rounded-full"
                      style={{ background: cfg.bg, color: cfg.text }}>
                      {cfg.label} — {group.length}
                    </span>
                    <div className="h-px flex-1" style={{ background: "#E3E9F6" }} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {group.slice(0, 20).map((rec, i) => (
                      <div key={i} className="bg-white rounded-2xl border p-4 flex items-start gap-3"
                        style={{ borderColor: cfg.border }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: cfg.bg }}>
                          <Lightbulb size={16} style={{ color: cfg.text }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold" style={{ color: "#111827" }}>{rec.course}</div>
                          <div className="text-xs mt-0.5" style={{ color: "#374151" }}>
                            {rec.empName}
                            {rec.dept !== "—" && <span style={{ color: "#9CA3AF" }}> · {rec.dept}</span>}
                          </div>
                          <div className="text-[11px] mt-1.5 flex items-start gap-1" style={{ color: "#6B7280" }}>
                            <span className="flex-shrink-0">Reason:</span>
                            <span>{rec.reason}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar size={11} style={{ color: "#9CA3AF" }} />
                            <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{rec.hours}h estimated</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "completion",      label: "Training Completion",    icon: CheckCircle2 },
  { id: "skills",          label: "Skill Matrix",           icon: Target       },
  { id: "certifications",  label: "Certification Expiry",   icon: Award        },
  { id: "competency",      label: "Competency Levels",      icon: Star         },
  { id: "recommendations", label: "Training Recommendations", icon: Lightbulb  },
];

export function TrainingCompetencyPage() {
  const [tab, setTab] = useState<TabId>("completion");

  const { data: employees = [], isLoading: empsLoading } = useListEmployeesQuery();
  const { data: gaps = [],      isLoading: gapsLoading } = useListTrainingGapsQuery();
  useGetTrainingMatrixQuery(); // prefetch matrix

  const overallPct = useMemo(() => {
    if (!employees.length) return 0;
    return Math.round(employees.reduce((s, e) => s + empMeta(e.id).pct, 0) / employees.length);
  }, [employees]);

  const allCerts = useMemo(() =>
    employees.flatMap((e) => empCerts(e.id)),
    [employees]
  );
  const expiringCount = allCerts.filter((c) => c.status === "expiring").length;
  const totalGaps = gaps.reduce((s, g) => s + g.missing_courses.length, 0);

  return (
    <div style={{ background: "#F3F7FF", minHeight: "100vh" }} className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Training & Competency</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
            Organisation-wide training progress, skill levels, certifications and competency tracking
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: "#EEF2FB", color: "#4A57B9" }}>
          <BookOpen size={14} />
          <span className="text-xs font-semibold">{overallPct}% Overall Completion</span>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Avg Completion Rate" value={`${overallPct}%`}   sub="Org-wide average"        icon={BarChart3}   color="#4A57B9" />
        <KpiCard label="Total Employees"     value={employees.length}   sub="In training programme"  icon={Users}       color="#0284C7" />
        <KpiCard label="Certs Expiring Soon" value={expiringCount}      sub="Within 45 days"         icon={Award}       color="#D97706" />
        <KpiCard label="Training Gaps"       value={totalGaps}          sub="Courses not yet done"   icon={AlertTriangle} color="#EF4444" />
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-white rounded-2xl border p-1.5 overflow-x-auto"
        style={{ borderColor: "#E3E9F6" }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
            style={
              tab === id
                ? { background: "linear-gradient(135deg, #4A57B9, #6F80E8)", color: "#fff" }
                : { color: "#6B7280" }
            }
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "completion" && (
        <CompletionTab employees={employees} loading={empsLoading} />
      )}
      {tab === "skills" && <SkillMatrixTab />}
      {tab === "certifications" && (
        <CertificationExpiryTab employees={employees} loading={empsLoading} />
      )}
      {tab === "competency" && (
        <CompetencyLevelsTab employees={employees} loading={empsLoading} />
      )}
      {tab === "recommendations" && (
        <RecommendationsTab employees={employees} gaps={gaps} loading={empsLoading || gapsLoading} />
      )}
    </div>
  );
}
