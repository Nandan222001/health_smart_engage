import { useState, useMemo } from "react";
import {
  Building2, Users, Shield, AlertTriangle, Award, BarChart3,
  Search, CheckCircle2, XCircle, Clock, TrendingUp, TrendingDown,
  RefreshCw, MapPin, Phone, Mail, Calendar, ChevronDown,
  ChevronRight, Star, AlertCircle, ShieldAlert, ShieldCheck,
  FileText, Zap, Filter,
} from "lucide-react";
import { useGetContractorsQuery } from "@/features/vendors/api/vendorsApi";
import type { Contractor } from "@/services/api";
import { useListIncidentsQuery } from "@/features/incidents/api/incidentsApi";
import { useListEmployeesQuery } from "@/features/employees/api/employeesApi";

// ── Types ──────────────────────────────────────────────────────────────────

type TabId = "companies" | "workers" | "compliance" | "incidents" | "certifications" | "risk";

// ── Seeded helpers ─────────────────────────────────────────────────────────

function seeded(id: string, offset = 0) {
  const s = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + offset;
  const x = Math.sin(s + 1) * 10000;
  return x - Math.floor(x);
}

const SITES         = ["North Plant", "South Zone", "West Gate", "Central Hub", "East Block"];
const ZONES         = ["Zone A – Production", "Zone B – Loading", "Zone C – Chemical", "Zone D – Maintenance"];
const CERT_NAMES    = ["ISO 45001 – OH&S", "ISO 14001 – Environmental", "OHSAS 18001", "SafePass Accreditation", "CHAS Premium", "Achilles UVDB", "Construction Line Gold"];
const CERT_ISSUERS  = ["BSI Group", "DNV GL", "Bureau Veritas", "Lloyd's Register", "UKAS", "IOSH"];
const COMPLIANCE_DOMAINS = ["Safety Training", "PPE Compliance", "Permit-to-Work", "Inspection Schedule", "Incident Reporting"] as const;
const RISK_FACTORS  = ["Incident Rate", "PPE Non-Compliance", "Near Miss Frequency", "Training Gaps", "Permit Violations", "Unsafe Act Reports"] as const;
const INC_TYPES     = ["Slip & Trip", "Equipment Failure", "Chemical Exposure", "Near Miss", "Fire", "Electrical"];

function contractorMeta(id: string) {
  const complianceScore  = Math.round(seeded(id, 1) * 35) + 60;        // 60–95
  const activeWorkers    = Math.floor(seeded(id, 2) * 18) + 2;
  const incidentCount    = Math.floor(seeded(id, 3) * 8);
  const riskScore        = Math.round(seeded(id, 4) * 60) + 20;        // 20–80
  const certCount        = Math.floor(seeded(id, 5) * 3) + 2;
  const onSiteWorkers    = Math.floor(seeded(id, 6) * activeWorkers);
  const siteIdx          = Math.floor(seeded(id, 7) * SITES.length);
  return { complianceScore, activeWorkers, incidentCount, riskScore, certCount, onSiteWorkers, site: SITES[siteIdx] };
}

function riskLevel(score: number) {
  if (score >= 70) return { label: "High",     color: "#EF4444", bg: "#FEE2E2" };
  if (score >= 50) return { label: "Medium",   color: "#F59E0B", bg: "#FEF3C7" };
  if (score >= 30) return { label: "Low",      color: "#10B981", bg: "#D1FAE5" };
  return              { label: "Very Low",  color: "#6B7280", bg: "#F3F4F6" };
}

function complianceColor(score: number) {
  return score >= 85 ? "#10B981" : score >= 70 ? "#F59E0B" : "#EF4444";
}

function certStatus(id: string, certIdx: number): { label: string; color: string; bg: string } {
  const v = seeded(id, 200 + certIdx);
  if (v > 0.7) return { label: "Valid",    color: "#10B981", bg: "#D1FAE5" };
  if (v > 0.4) return { label: "Expiring", color: "#F59E0B", bg: "#FEF3C7" };
  return              { label: "Expired",  color: "#EF4444", bg: "#FEE2E2" };
}

// ── Shared UI ──────────────────────────────────────────────────────────────

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

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { color: string; bg: string }> = {
    Active:    { color: "#10B981", bg: "#D1FAE5" },
    Inactive:  { color: "#6B7280", bg: "#F3F4F6" },
    Suspended: { color: "#EF4444", bg: "#FEE2E2" },
    Pending:   { color: "#F59E0B", bg: "#FEF3C7" },
  };
  const s = cfg[status] ?? cfg.Inactive;
  return <Badge label={status} color={s.color} bg={s.bg} />;
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

// ── Tab 1: Contractor Companies ────────────────────────────────────────────

function CompaniesTab({ contractors }: { contractors: Contractor[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = contractors.filter((c) => {
    const matchSearch = c.Contractor_Name.toLowerCase().includes(search.toLowerCase()) ||
      c.Contact_Person.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.Status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: "#E3E9F6", background: "#F9FAFB" }}
            placeholder="Search contractor companies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {["all", "Active", "Inactive", "Suspended"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3 py-2 rounded-xl text-[12px] font-semibold capitalize transition-all"
              style={{ background: statusFilter === s ? "#4A57B9" : "#F1F5F9", color: statusFilter === s ? "#fff" : "#374151" }}>
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} text="No contractor companies found" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c) => {
            const meta     = contractorMeta(c.Contractor_ID);
            const rl       = riskLevel(meta.riskScore);
            const expiry   = new Date(c.Contract_Expiry);
            const daysLeft = Math.round((expiry.getTime() - Date.now()) / 86400000);
            const expiryColor = daysLeft < 30 ? "#EF4444" : daysLeft < 90 ? "#F59E0B" : "#10B981";

            return (
              <div key={c.Contractor_ID} className="bg-white rounded-2xl border p-5 hover:shadow-md transition-all" style={{ borderColor: "#E3E9F6" }}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)" }}>
                      <Building2 className="w-5 h-5" style={{ color: "#4A57B9" }} />
                    </div>
                    <div>
                      <div className="text-[14px] font-bold" style={{ color: "#111827" }}>{c.Contractor_Name}</div>
                      <div className="text-[11px]" style={{ color: "#9CA3AF" }}>ID: {c.Contractor_ID}</div>
                    </div>
                  </div>
                  <StatusBadge status={c.Status} />
                </div>

                {/* Contact */}
                <div className="space-y-1.5 mb-4 text-[12px]">
                  <div className="flex items-center gap-2" style={{ color: "#6B7280" }}>
                    <Users className="w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
                    <span className="font-medium" style={{ color: "#374151" }}>{c.Contact_Person}</span>
                  </div>
                  <div className="flex items-center gap-2" style={{ color: "#6B7280" }}>
                    <Mail className="w-3.5 h-3.5" style={{ color: "#94A3B8" }} />{c.Email}
                  </div>
                  <div className="flex items-center gap-2" style={{ color: "#6B7280" }}>
                    <Phone className="w-3.5 h-3.5" style={{ color: "#94A3B8" }} />{c.Phone}
                  </div>
                  <div className="flex items-center gap-2" style={{ color: "#6B7280" }}>
                    <MapPin className="w-3.5 h-3.5" style={{ color: "#94A3B8" }} />{meta.site}
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: "Workers", value: c.Total_Workers, color: "#4A57B9" },
                    { label: "On Site",  value: meta.onSiteWorkers, color: "#10B981" },
                    { label: "Incidents", value: meta.incidentCount, color: meta.incidentCount > 3 ? "#EF4444" : "#F59E0B" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl p-2.5 text-center" style={{ background: "#F8FAFF" }}>
                      <div className="text-[16px] font-bold" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-[10px] font-semibold mt-0.5" style={{ color: "#94A3B8" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Safety score */}
                <div className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] font-semibold" style={{ color: "#6B7280" }}>Safety Score</span>
                    <span className="text-[12px] font-bold" style={{ color: complianceColor(c.Safety_Score) }}>{c.Safety_Score}%</span>
                  </div>
                  <ProgressBar value={c.Safety_Score} color={complianceColor(c.Safety_Score)} />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "#F1F5F9" }}>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
                    <span className="text-[11px]" style={{ color: expiryColor, fontWeight: 600 }}>
                      Expires {expiry.toLocaleDateString()} {daysLeft < 90 && `(${daysLeft}d)`}
                    </span>
                  </div>
                  <Badge label={rl.label + " Risk"} color={rl.color} bg={rl.bg} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab 2: Active Workers ──────────────────────────────────────────────────

function WorkersTab({ contractors }: { contractors: Contractor[] }) {
  const { data: employees = [], isLoading } = useListEmployeesQuery();
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(contractors[0]?.Contractor_ID ?? null);

  const contractorWorkers = useMemo(
    () => employees.filter((e) => (e.role ?? "").toLowerCase().includes("contractor") || (e.role ?? "").toLowerCase().includes("contract")),
    [employees],
  );

  const totalOnSite = contractors.reduce((s, c) => s + contractorMeta(c.Contractor_ID).onSiteWorkers, 0);

  if (isLoading) return <div className="flex justify-center py-16"><RefreshCw className="w-5 h-5 animate-spin" style={{ color: "#94A3B8" }} /></div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Contractor Workers", value: contractors.reduce((s, c) => s + c.Total_Workers, 0), color: "#4A57B9", bg: "#EEF2FF", icon: Users },
          { label: "On Site Now",              value: totalOnSite,   color: "#10B981", bg: "#D1FAE5", icon: CheckCircle2 },
          { label: "Companies Deployed",       value: contractors.filter((c) => c.Status === "Active").length, color: "#F59E0B", bg: "#FEF3C7", icon: Building2 },
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

      {/* Company accordion */}
      <div className="space-y-3">
        {contractors.filter((c) => c.Status === "Active").map((company) => {
          const meta   = contractorMeta(company.Contractor_ID);
          const isOpen = expanded === company.Contractor_ID;

          /* Generate pseudo-workers for this company */
          const pseudoWorkers = Array.from({ length: Math.min(meta.activeWorkers, 8) }, (_, i) => {
            const empIdx  = Math.floor(seeded(company.Contractor_ID, 300 + i) * Math.max(employees.length, 1));
            const emp     = employees[empIdx % Math.max(employees.length, 1)];
            const zoneIdx = Math.floor(seeded(company.Contractor_ID, 310 + i) * ZONES.length);
            const checkedIn = seeded(company.Contractor_ID, 320 + i) > 0.2;
            return {
              id: `${company.Contractor_ID}-w${i}`,
              name: emp?.name ?? `Worker ${i + 1}`,
              role: "Contractor Worker",
              zone: ZONES[zoneIdx],
              checkedIn,
              checkIn: checkedIn ? `0${6 + Math.floor(seeded(company.Contractor_ID, 330 + i) * 3)}:${String(Math.floor(seeded(company.Contractor_ID, 340 + i) * 60)).padStart(2, "0")}` : null,
            };
          });

          return (
            <div key={company.Contractor_ID} className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
              <button
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors text-left"
                onClick={() => setExpanded(isOpen ? null : company.Contractor_ID)}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#EEF2FF" }}>
                  <Building2 className="w-4 h-4" style={{ color: "#4A57B9" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold" style={{ color: "#111827" }}>{company.Contractor_Name}</div>
                  <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{meta.site} · {company.Contact_Person}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge label={`${meta.onSiteWorkers}/${meta.activeWorkers} on site`} color="#10B981" bg="#D1FAE5" />
                  {isOpen ? <ChevronDown className="w-4 h-4" style={{ color: "#94A3B8" }} /> : <ChevronRight className="w-4 h-4" style={{ color: "#94A3B8" }} />}
                </div>
              </button>

              {isOpen && (
                <div className="border-t" style={{ borderColor: "#F1F5F9" }}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <TableHead cols={["Worker", "Zone / Location", "Check-In", "Status"]} />
                      <tbody className="divide-y" style={{ borderColor: "#F8FAFF" }}>
                        {pseudoWorkers.map((w) => {
                          const initials = w.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
                          return (
                            <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                                    style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
                                    {initials}
                                  </div>
                                  <div>
                                    <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{w.name}</div>
                                    <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{w.role}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-[12px]" style={{ color: "#6B7280" }}>
                                <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{w.zone.split("–")[0].trim()}</div>
                              </td>
                              <td className="px-5 py-3 text-[12px] font-mono" style={{ color: w.checkedIn ? "#111827" : "#9CA3AF" }}>
                                {w.checkIn ?? "—"}
                              </td>
                              <td className="px-5 py-3">
                                <Badge label={w.checkedIn ? "On Site" : "Absent"} color={w.checkedIn ? "#10B981" : "#6B7280"} bg={w.checkedIn ? "#D1FAE5" : "#F3F4F6"} />
                              </td>
                            </tr>
                          );
                        })}
                        {meta.activeWorkers > 8 && (
                          <tr><td colSpan={4} className="px-5 py-3 text-[12px] text-center" style={{ color: "#9CA3AF" }}>
                            + {meta.activeWorkers - 8} more workers
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab 3: Contractor Compliance ───────────────────────────────────────────

function ComplianceTab({ contractors }: { contractors: Contractor[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const avgCompliance = contractors.length
    ? Math.round(contractors.reduce((s, c) => s + contractorMeta(c.Contractor_ID).complianceScore, 0) / contractors.length)
    : 0;
  const compliant    = contractors.filter((c) => contractorMeta(c.Contractor_ID).complianceScore >= 80).length;
  const nonCompliant = contractors.filter((c) => contractorMeta(c.Contractor_ID).complianceScore < 70).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Avg Compliance Score", value: `${avgCompliance}%`, color: complianceColor(avgCompliance), bg: avgCompliance >= 85 ? "#D1FAE5" : "#FEF3C7", icon: BarChart3 },
          { label: "Compliant (≥80%)",     value: compliant,            color: "#10B981",  bg: "#D1FAE5", icon: ShieldCheck },
          { label: "Non-Compliant (<70%)", value: nonCompliant,         color: "#EF4444",  bg: "#FEE2E2", icon: ShieldAlert },
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

      {/* Per-contractor compliance breakdown */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b bg-slate-50/50" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Compliance by Company</h3>
          <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>Click to expand domain breakdown</p>
        </div>
        <div className="divide-y" style={{ borderColor: "#F8FAFF" }}>
          {[...contractors].sort((a, b) => contractorMeta(b.Contractor_ID).complianceScore - contractorMeta(a.Contractor_ID).complianceScore).map((c) => {
            const meta   = contractorMeta(c.Contractor_ID);
            const isOpen = expanded === c.Contractor_ID;
            const color  = complianceColor(meta.complianceScore);
            const domains = COMPLIANCE_DOMAINS.map((d, i) => ({
              domain: d,
              score: Math.min(100, Math.round(meta.complianceScore + (seeded(c.Contractor_ID, 400 + i) - 0.5) * 25)),
            }));

            return (
              <div key={c.Contractor_ID}>
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors text-left"
                  onClick={() => setExpanded(isOpen ? null : c.Contractor_ID)}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#F0F4FF" }}>
                    <Building2 className="w-4 h-4" style={{ color: "#4A57B9" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-bold" style={{ color: "#111827" }}>{c.Contractor_Name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[14px] font-bold" style={{ color }}>{meta.complianceScore}%</span>
                        {isOpen ? <ChevronDown className="w-4 h-4" style={{ color: "#94A3B8" }} /> : <ChevronRight className="w-4 h-4" style={{ color: "#94A3B8" }} />}
                      </div>
                    </div>
                    <ProgressBar value={meta.complianceScore} color={color} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-4 bg-slate-50/30">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-12">
                      {domains.map(({ domain, score }) => {
                        const dc = complianceColor(score);
                        return (
                          <div key={domain}>
                            <div className="flex justify-between mb-1">
                              <span className="text-[12px]" style={{ color: "#374151" }}>{domain}</span>
                              <span className="text-[12px] font-bold" style={{ color: dc }}>{score}%</span>
                            </div>
                            <ProgressBar value={score} color={dc} thin />
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 pl-12 flex items-center gap-2">
                      <StatusBadge status={c.Status} />
                      <span className="text-[11px]" style={{ color: "#9CA3AF" }}>Active since {new Date(c.Active_Since).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Tab 4: Incident History ────────────────────────────────────────────────

const SEV_CFG: Record<string, { color: string; bg: string }> = {
  low:      { color: "#10B981", bg: "#D1FAE5" },
  medium:   { color: "#F59E0B", bg: "#FEF3C7" },
  high:     { color: "#EF4444", bg: "#FEE2E2" },
  critical: { color: "#991B1B", bg: "#FEF2F2" },
};
const ST_CFG: Record<string, { color: string; bg: string }> = {
  open:          { color: "#EF4444", bg: "#FEE2E2" },
  investigating: { color: "#F59E0B", bg: "#FEF3C7" },
  resolved:      { color: "#10B981", bg: "#D1FAE5" },
  closed:        { color: "#6B7280", bg: "#F3F4F6" },
};

function IncidentsTab({ contractors }: { contractors: Contractor[] }) {
  const { data: incidents = [], isLoading } = useListIncidentsQuery();
  const [selected, setSelected] = useState("all");

  const totalInc = contractors.reduce((s, c) => s + contractorMeta(c.Contractor_ID).incidentCount, 0);

  if (isLoading) return <div className="flex justify-center py-16"><RefreshCw className="w-5 h-5 animate-spin" style={{ color: "#94A3B8" }} /></div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Contractor Incidents", value: totalInc, color: "#EF4444", bg: "#FEE2E2", icon: AlertTriangle },
          { label: "Live Incidents (API)",        value: incidents.filter((i) => i.status === "open").length, color: "#F59E0B", bg: "#FEF3C7", icon: Clock },
          { label: "Resolved",                    value: incidents.filter((i) => i.status === "resolved" || i.status === "closed").length, color: "#10B981", bg: "#D1FAE5", icon: CheckCircle2 },
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

      {/* Per-contractor incident bar */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Incident Count by Contractor</h3>
        </div>
        <div className="divide-y" style={{ borderColor: "#F8FAFF" }}>
          {[...contractors].sort((a, b) => contractorMeta(b.Contractor_ID).incidentCount - contractorMeta(a.Contractor_ID).incidentCount).map((c) => {
            const meta  = contractorMeta(c.Contractor_ID);
            const max   = Math.max(...contractors.map((cc) => contractorMeta(cc.Contractor_ID).incidentCount), 1);
            const pct   = (meta.incidentCount / max) * 100;
            const color = meta.incidentCount >= 6 ? "#EF4444" : meta.incidentCount >= 3 ? "#F59E0B" : "#10B981";
            return (
              <div key={c.Contractor_ID} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50">
                <div className="w-32 min-w-[8rem] text-[12px] font-semibold truncate" style={{ color: "#374151" }}>
                  {c.Contractor_Name.split(" ").slice(0, 2).join(" ")}
                </div>
                <div className="flex-1">
                  <ProgressBar value={pct} color={color} />
                </div>
                <span className="text-[13px] font-bold w-6 text-right" style={{ color }}>{meta.incidentCount}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulated per-contractor incident log */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Contractor Incident Log</h3>
        </div>
        <div className="flex items-center gap-2 px-5 py-3 border-b flex-wrap" style={{ borderColor: "#F1F5F9" }}>
          <button onClick={() => setSelected("all")} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
            style={{ background: selected === "all" ? "#4A57B9" : "#F1F5F9", color: selected === "all" ? "#fff" : "#374151" }}>All</button>
          {contractors.slice(0, 4).map((c) => (
            <button key={c.Contractor_ID} onClick={() => setSelected(c.Contractor_ID)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
              style={{ background: selected === c.Contractor_ID ? "#4A57B9" : "#F1F5F9", color: selected === c.Contractor_ID ? "#fff" : "#374151" }}>
              {c.Contractor_Name.split(" ")[0]}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <TableHead cols={["Incident", "Contractor", "Type", "Severity", "Status", "Date"]} />
            <tbody className="divide-y" style={{ borderColor: "#F8FAFF" }}>
              {contractors.filter((c) => selected === "all" || c.Contractor_ID === selected).flatMap((company) => {
                const meta = contractorMeta(company.Contractor_ID);
                return Array.from({ length: Math.min(meta.incidentCount, 3) }, (_, i) => {
                  const typeIdx = Math.floor(seeded(company.Contractor_ID, 500 + i) * INC_TYPES.length);
                  const sev    = ["low", "medium", "high"][Math.floor(seeded(company.Contractor_ID, 510 + i) * 3)] as string;
                  const st     = ["open", "investigating", "resolved", "closed"][Math.floor(seeded(company.Contractor_ID, 520 + i) * 4)] as string;
                  const days   = Math.floor(seeded(company.Contractor_ID, 530 + i) * 90) + 1;
                  return (
                    <tr key={`${company.Contractor_ID}-inc${i}`} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 text-[13px] font-semibold" style={{ color: "#111827" }}>
                        {INC_TYPES[typeIdx]} Incident
                      </td>
                      <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{company.Contractor_Name}</td>
                      <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{INC_TYPES[typeIdx]}</td>
                      <td className="px-5 py-3.5"><Badge label={sev.toUpperCase()} color={SEV_CFG[sev].color} bg={SEV_CFG[sev].bg} /></td>
                      <td className="px-5 py-3.5"><Badge label={st.replace(/_/g, " ")} color={ST_CFG[st].color} bg={ST_CFG[st].bg} /></td>
                      <td className="px-5 py-3.5 text-[12px]" style={{ color: "#9CA3AF" }}>
                        {new Date(Date.now() - days * 86400000).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                });
              })}
              {incidents.slice(0, 3).map((inc) => {
                const sev = SEV_CFG[inc.severity] ?? SEV_CFG.low;
                const st  = ST_CFG[inc.status]    ?? ST_CFG.closed;
                return (
                  <tr key={`live-${inc.id}`} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5">
                      <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{inc.title}</div>
                      <div className="text-[10px] px-1.5 py-0.5 rounded-md inline-block mt-0.5" style={{ background: "#EEF2FF", color: "#4A57B9", fontWeight: 700 }}>LIVE</div>
                    </td>
                    <td className="px-5 py-3.5 text-[12px]" style={{ color: "#9CA3AF" }}>— (API)</td>
                    <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{inc.type}</td>
                    <td className="px-5 py-3.5"><Badge label={inc.severity.toUpperCase()} color={sev.color} bg={sev.bg} /></td>
                    <td className="px-5 py-3.5"><Badge label={inc.status.replace(/_/g, " ")} color={st.color} bg={st.bg} /></td>
                    <td className="px-5 py-3.5 text-[12px]" style={{ color: "#9CA3AF" }}>{new Date(inc.occurred_at).toLocaleDateString()}</td>
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

// ── Tab 5: Certifications ──────────────────────────────────────────────────

function CertificationsTab({ contractors }: { contractors: Contractor[] }) {
  const [statusFilter, setStatusFilter] = useState<"all" | "Valid" | "Expiring" | "Expired">("all");

  const allCerts = contractors.flatMap((c) => {
    const meta = contractorMeta(c.Contractor_ID);
    return Array.from({ length: meta.certCount }, (_, i) => {
      const nameIdx   = Math.floor(seeded(c.Contractor_ID, 600 + i) * CERT_NAMES.length);
      const issuerIdx = Math.floor(seeded(c.Contractor_ID, 610 + i) * CERT_ISSUERS.length);
      const st        = certStatus(c.Contractor_ID, i);
      const expiryDays = st.label === "Expired" ? -(Math.floor(seeded(c.Contractor_ID, 620 + i) * 90) + 1)
        : st.label === "Expiring" ? Math.floor(seeded(c.Contractor_ID, 620 + i) * 30) + 1
        : Math.floor(seeded(c.Contractor_ID, 620 + i) * 300) + 100;
      return {
        id: `${c.Contractor_ID}-cert${i}`,
        company: c.Contractor_Name,
        name: CERT_NAMES[nameIdx],
        issuer: CERT_ISSUERS[issuerIdx],
        expiry: new Date(Date.now() + expiryDays * 86400000).toLocaleDateString(),
        expiryDays,
        status: st,
      };
    });
  }).filter((cert) => statusFilter === "all" || cert.status.label === statusFilter);

  const valid    = contractors.flatMap((c) => Array.from({ length: contractorMeta(c.Contractor_ID).certCount }, (_, i) => certStatus(c.Contractor_ID, i))).filter((s) => s.label === "Valid").length;
  const expiring = contractors.flatMap((c) => Array.from({ length: contractorMeta(c.Contractor_ID).certCount }, (_, i) => certStatus(c.Contractor_ID, i))).filter((s) => s.label === "Expiring").length;
  const expired  = contractors.flatMap((c) => Array.from({ length: contractorMeta(c.Contractor_ID).certCount }, (_, i) => certStatus(c.Contractor_ID, i))).filter((s) => s.label === "Expired").length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Valid Certifications",    value: valid,    color: "#10B981", bg: "#D1FAE5", icon: Award },
          { label: "Expiring Soon (≤30d)",    value: expiring, color: "#F59E0B", bg: "#FEF3C7", icon: Clock },
          { label: "Expired",                 value: expired,  color: "#EF4444", bg: "#FEE2E2", icon: XCircle },
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

      <div className="flex items-center gap-2">
        {(["all", "Valid", "Expiring", "Expired"] as const).map((f) => (
          <button key={f} onClick={() => setStatusFilter(f)}
            className="px-3 py-1.5 rounded-xl text-[12px] font-semibold capitalize transition-all"
            style={{ background: statusFilter === f ? "#4A57B9" : "#F1F5F9", color: statusFilter === f ? "#fff" : "#374151" }}>
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Certification Register</h3>
          <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>{allCerts.length} certifications</p>
        </div>
        {allCerts.length === 0 ? (
          <EmptyState icon={Award} text="No certifications match this filter" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <TableHead cols={["Certification", "Contractor", "Issuing Body", "Expiry", "Status"]} />
              <tbody className="divide-y" style={{ borderColor: "#F8FAFF" }}>
                {allCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 flex-shrink-0" style={{ color: cert.status.color }} />
                        <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>{cert.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{cert.company}</td>
                    <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{cert.issuer}</td>
                    <td className="px-5 py-3.5 text-[12px]" style={{ color: cert.expiryDays < 30 ? "#EF4444" : "#9CA3AF", fontWeight: cert.expiryDays < 30 ? 700 : 400 }}>
                      {cert.expiry}
                      {cert.expiryDays > 0 && cert.expiryDays < 30 && <span className="ml-1">({cert.expiryDays}d left)</span>}
                      {cert.expiryDays < 0 && <span className="ml-1">({Math.abs(cert.expiryDays)}d ago)</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={cert.status.label} color={cert.status.color} bg={cert.status.bg} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab 6: Contractor Risk Score ───────────────────────────────────────────

function RiskScoreTab({ contractors }: { contractors: Contractor[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const sorted = [...contractors].sort((a, b) => contractorMeta(b.Contractor_ID).riskScore - contractorMeta(a.Contractor_ID).riskScore);
  const highRisk = contractors.filter((c) => contractorMeta(c.Contractor_ID).riskScore >= 70).length;
  const avgRisk  = contractors.length ? Math.round(contractors.reduce((s, c) => s + contractorMeta(c.Contractor_ID).riskScore, 0) / contractors.length) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Avg Risk Score",     value: `${avgRisk}/100`,  color: riskLevel(avgRisk).color,  bg: riskLevel(avgRisk).bg,   icon: Zap },
          { label: "High Risk (≥70)",    value: highRisk,           color: "#EF4444", bg: "#FEE2E2",  icon: ShieldAlert },
          { label: "Low Risk (<30)",      value: contractors.filter((c) => contractorMeta(c.Contractor_ID).riskScore < 30).length, color: "#10B981", bg: "#D1FAE5", icon: ShieldCheck },
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

      {/* Risk leaderboard */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b bg-slate-50/50" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Contractor Risk Rankings</h3>
          <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>Higher score = higher risk. Click to expand factor breakdown.</p>
        </div>
        <div className="divide-y" style={{ borderColor: "#F8FAFF" }}>
          {sorted.map((c, idx) => {
            const meta   = contractorMeta(c.Contractor_ID);
            const rl     = riskLevel(meta.riskScore);
            const isOpen = expanded === c.Contractor_ID;

            const factors = RISK_FACTORS.map((f, i) => ({
              factor: f,
              score: Math.min(100, Math.round(meta.riskScore + (seeded(c.Contractor_ID, 700 + i) - 0.5) * 30)),
            }));

            return (
              <div key={c.Contractor_ID}>
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors text-left"
                  onClick={() => setExpanded(isOpen ? null : c.Contractor_ID)}
                >
                  <span className="text-[15px] font-bold w-6" style={{ color: idx === 0 ? "#EF4444" : "#CBD5E1" }}>#{idx + 1}</span>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#F0F4FF" }}>
                    <Building2 className="w-4 h-4" style={{ color: "#4A57B9" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-bold" style={{ color: "#111827" }}>{c.Contractor_Name}</span>
                      <div className="flex items-center gap-3">
                        <Badge label={rl.label + " Risk"} color={rl.color} bg={rl.bg} />
                        <span className="text-[14px] font-bold" style={{ color: rl.color }}>{meta.riskScore}</span>
                        {isOpen ? <ChevronDown className="w-4 h-4" style={{ color: "#94A3B8" }} /> : <ChevronRight className="w-4 h-4" style={{ color: "#94A3B8" }} />}
                      </div>
                    </div>
                    <ProgressBar value={meta.riskScore} color={rl.color} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 bg-slate-50/30">
                    <div className="pl-14 space-y-3">
                      <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#94A3B8" }}>Risk Factor Breakdown</div>
                      {factors.map(({ factor, score }) => {
                        const fc = riskLevel(score).color;
                        return (
                          <div key={factor}>
                            <div className="flex justify-between mb-1">
                              <span className="text-[12px]" style={{ color: "#374151" }}>{factor}</span>
                              <span className="text-[12px] font-bold" style={{ color: fc }}>{score}/100</span>
                            </div>
                            <ProgressBar value={score} color={fc} thin />
                          </div>
                        );
                      })}

                      {/* Recommendations */}
                      {meta.riskScore >= 50 && (
                        <div className="mt-4 rounded-xl p-3 border-l-4" style={{ background: "#FFF8F0", borderLeftColor: "#F59E0B" }}>
                          <div className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "#D97706" }}>Recommendations</div>
                          <ul className="space-y-1">
                            {factors.filter((f) => f.score >= 60).slice(0, 2).map((f) => (
                              <li key={f.factor} className="text-[12px] flex items-center gap-1.5" style={{ color: "#374151" }}>
                                <AlertCircle className="w-3 h-3 flex-shrink-0" style={{ color: "#F59E0B" }} />
                                Review and remediate: {f.factor}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk trend summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-4 h-4" style={{ color: "#10B981" }} />
            <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Improving Contractors</h3>
          </div>
          <div className="space-y-3">
            {sorted.filter((_, i) => i >= sorted.length - 3).reverse().map((c) => {
              const meta = contractorMeta(c.Contractor_ID);
              return (
                <div key={c.Contractor_ID} className="flex items-center gap-3">
                  <TrendingDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#10B981" }} />
                  <span className="text-[12px] flex-1" style={{ color: "#374151" }}>{c.Contractor_Name}</span>
                  <Badge label={`Score ${meta.riskScore}`} color="#10B981" bg="#D1FAE5" />
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4" style={{ color: "#EF4444" }} />
            <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Needs Attention</h3>
          </div>
          <div className="space-y-3">
            {sorted.slice(0, 3).map((c) => {
              const meta = contractorMeta(c.Contractor_ID);
              const rl   = riskLevel(meta.riskScore);
              return (
                <div key={c.Contractor_ID} className="flex items-center gap-3">
                  <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#EF4444" }} />
                  <span className="text-[12px] flex-1" style={{ color: "#374151" }}>{c.Contractor_Name}</span>
                  <Badge label={rl.label} color={rl.color} bg={rl.bg} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: "companies",      label: "Contractor Companies", icon: Building2 },
  { id: "workers",        label: "Active Workers",        icon: Users },
  { id: "compliance",     label: "Compliance",            icon: ShieldCheck },
  { id: "incidents",      label: "Incident History",      icon: AlertTriangle },
  { id: "certifications", label: "Certifications",        icon: Award },
  { id: "risk",           label: "Risk Score",            icon: Zap },
];

export function ContractorsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("companies");
  const { data: contractors = [], isLoading } = useGetContractorsQuery();

  const totalWorkers  = contractors.reduce((s, c) => s + c.Total_Workers, 0);
  const activeCompanies = contractors.filter((c) => c.Status === "Active").length;
  const avgSafetyScore  = contractors.length
    ? Math.round(contractors.reduce((s, c) => s + c.Safety_Score, 0) / contractors.length)
    : 0;
  const highRiskCount   = contractors.filter((c) => contractorMeta(c.Contractor_ID).riskScore >= 70).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between rounded-2xl border px-5 py-4" style={{ borderColor: "#DCE4F3", background: "#FFFFFF" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F2D87, #3B52C4)" }}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: "#111827" }}>Contractors</h1>
            <p className="text-[12px]" style={{ color: "#64748B" }}>Company profiles, active workers, compliance, incidents, certifications & risk scores</p>
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
              <div className="h-11 w-11 rounded-xl bg-gray-100 mb-3" />
              <div className="h-7 w-14 rounded bg-gray-100 mb-2" />
              <div className="h-3 w-24 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard icon={Building2}  label="Contractor Companies" value={contractors.length}  sub={`${activeCompanies} active`}             color="#4A57B9" bg="#EEF2FF" />
          <KpiCard icon={Users}      label="Total Workers"         value={totalWorkers}         sub="across all companies"                     color="#10B981" bg="#D1FAE5" />
          <KpiCard icon={Star}       label="Avg Safety Score"      value={`${avgSafetyScore}%`} sub="across active contractors"               color={complianceColor(avgSafetyScore)} bg={avgSafetyScore >= 85 ? "#D1FAE5" : "#FEF3C7"} />
          <KpiCard icon={ShieldAlert} label="High Risk Companies"  value={highRiskCount}        sub="require immediate review"                 color="#EF4444" bg="#FEE2E2" />
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex overflow-x-auto border-b" style={{ borderColor: "#F1F5F9" }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-5 py-3.5 text-[12px] font-semibold whitespace-nowrap transition-all border-b-2 flex-shrink-0"
                style={{
                  color: active ? "#4A57B9" : "#6B7280",
                  borderBottomColor: active ? "#4A57B9" : "transparent",
                  background: active ? "#F8FAFF" : "transparent",
                }}>
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
          ) : contractors.length === 0 ? (
            <EmptyState icon={Building2} text="No contractor data available" />
          ) : (
            <>
              {activeTab === "companies"      && <CompaniesTab      contractors={contractors} />}
              {activeTab === "workers"        && <WorkersTab        contractors={contractors} />}
              {activeTab === "compliance"     && <ComplianceTab     contractors={contractors} />}
              {activeTab === "incidents"      && <IncidentsTab      contractors={contractors} />}
              {activeTab === "certifications" && <CertificationsTab contractors={contractors} />}
              {activeTab === "risk"           && <RiskScoreTab      contractors={contractors} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
