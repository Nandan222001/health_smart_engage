import { useMemo } from "react";
import {
  Shield, AlertTriangle, Award, AlertCircle,
  Calendar, CheckCircle2, XCircle, Clock,
  TrendingUp, RefreshCw, MapPin, ChevronRight,
} from "lucide-react";
import {
  useGetVendorComplianceQuery,
  useGetVendorCertificationsQuery,
  useGetVendorsQuery,
} from "@/features/vendors/api/vendorsApi";
import {
  useGetFindingsQuery,
  useGetRegulatoryRequirementsQuery,
} from "@/features/compliance/api/complianceApi";

// ── Helpers ────────────────────────────────────────────────────────────────

function scoreColor(v: number) {
  return v >= 85 ? "#10B981" : v >= 70 ? "#F59E0B" : "#EF4444";
}
function scoreTag(v: number) {
  return v >= 85
    ? { label: "Compliant",  color: "#065F46", bg: "#D1FAE5" }
    : v >= 70
    ? { label: "Moderate",   color: "#92400E", bg: "#FEF3C7" }
    : { label: "At Risk",    color: "#991B1B", bg: "#FEE2E2" };
}
function sevCfg(s: string) {
  const m: Record<string, { dot: string; label: string }> = {
    critical:    { dot: "#EF4444", label: "Critical"    },
    major:       { dot: "#F97316", label: "Major"       },
    minor:       { dot: "#F59E0B", label: "Minor"       },
    observation: { dot: "#9CA3AF", label: "Observation" },
  };
  return m[s.toLowerCase()] ?? m.observation;
}
function certCfg(s: string) {
  if (s === "Valid")    return { color: "#10B981", bg: "#D1FAE5", Icon: CheckCircle2 };
  if (s === "Expiring") return { color: "#F59E0B", bg: "#FEF3C7", Icon: Clock };
  return                       { color: "#EF4444", bg: "#FEE2E2", Icon: XCircle };
}
function regColor(status: string, overdue: boolean) {
  if (overdue || status === "Non-Compliant") return { color: "#DC2626", bg: "#FEE2E2" };
  if (status === "Compliant")               return { color: "#059669", bg: "#D1FAE5" };
  return                                           { color: "#D97706", bg: "#FEF3C7" };
}

// ── Shared pill ────────────────────────────────────────────────────────────

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap"
      style={{ color, background: bg }}>
      {label}
    </span>
  );
}

// ── Hero stat block ────────────────────────────────────────────────────────

function HeroStat({ value, label, sub, accent }: {
  value: string | number; label: string; sub?: string; accent: string;
}) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-4">
      <span className="text-[36px] font-black leading-none" style={{ color: accent }}>{value}</span>
      <span className="text-[12px] font-semibold mt-1 text-white/80">{label}</span>
      {sub && <span className="text-[10px] mt-0.5 text-white/50">{sub}</span>}
    </div>
  );
}

// ── Section panel ──────────────────────────────────────────────────────────

function Panel({
  title, icon: Icon, topColor, panelBg, borderColor, countBadge, children,
}: {
  title: string;
  icon: React.ElementType;
  topColor: string;
  panelBg: string;
  borderColor: string;
  countBadge?: { value: number; color: string; bg: string };
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: panelBg, border: `1.5px solid ${borderColor}` }}>
      {/* Coloured top bar */}
      <div className="flex items-center gap-2.5 px-5 py-3.5"
        style={{ background: topColor }}>
        <Icon className="w-4 h-4 text-white" />
        <span className="text-[13px] font-bold text-white flex-1">{title}</span>
        {countBadge && (
          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full"
            style={{ color: countBadge.color, background: countBadge.bg }}>
            {countBadge.value}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto max-h-[420px]">
        {children}
      </div>
    </div>
  );
}

function PanelEmpty({ text }: { text: string }) {
  return (
    <div className="py-12 text-center">
      <Shield className="w-7 h-7 mx-auto mb-2 opacity-20" />
      <p className="text-[12px] text-gray-400">{text}</p>
    </div>
  );
}

// ── 1. Compliance Score items ──────────────────────────────────────────────

function ScoreItem({ name, score, domains, activeSince }: {
  name: string; score: number; domains: { domain: string; score: number }[]; activeSince: string | null;
}) {
  const col = scoreColor(score);
  const tag = scoreTag(score);
  return (
    <div className="flex items-start gap-3 px-5 py-3.5 border-b border-blue-100 last:border-0 hover:bg-blue-50/60 transition-colors">
      {/* Circle score */}
      <div className="flex-shrink-0 w-12 h-12 rounded-full flex flex-col items-center justify-center border-2"
        style={{ borderColor: col, background: col + "12" }}>
        <span className="text-[13px] font-black leading-none" style={{ color: col }}>{Math.round(score)}</span>
        <span className="text-[8px] font-bold" style={{ color: col }}>%</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-bold text-gray-800 truncate">{name}</span>
          <Pill label={tag.label} color={tag.color} bg={tag.bg} />
        </div>
        {activeSince && (
          <span className="text-[10px] text-gray-400">Since {new Date(activeSince).getFullYear()}</span>
        )}
        {domains.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {domains.slice(0, 4).map((d) => (
              <span key={d.domain}
                className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                style={{ background: scoreColor(d.score) + "18", color: scoreColor(d.score) }}>
                {d.domain} {Math.round(d.score)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 2. Finding item ────────────────────────────────────────────────────────

function FindingItem({ title, description, severity, source, isoClause, status }: {
  title: string; description: string; severity: string; source: string;
  isoClause: string | null; status: string;
}) {
  const { dot, label } = sevCfg(severity);
  const isOpen = status === "open";
  return (
    <div className="px-5 py-3.5 border-b border-red-100 last:border-0 hover:bg-red-50/40 transition-colors">
      <div className="flex items-start gap-2">
        <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: dot }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[12px] font-bold text-gray-800 leading-snug">{title}</span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Pill label={label} color={dot} bg={dot + "18"} />
              <Pill
                label={isOpen ? "Open" : "Closed"}
                color={isOpen ? "#DC2626" : "#059669"}
                bg={isOpen ? "#FEE2E2" : "#D1FAE5"}
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{description}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-gray-400">{source}</span>
            {isoClause && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                {isoClause}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 3. Cert item ───────────────────────────────────────────────────────────

function CertItem({ vendorName, docType, issuingBody, expiryDate, daysLeft, certStatus }: {
  vendorName: string; docType: string; issuingBody: string | null;
  expiryDate: string | null; daysLeft: number | null; certStatus: string;
}) {
  const { color, bg, Icon } = certCfg(certStatus);
  const overdue = daysLeft !== null && daysLeft < 0;
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-amber-100 last:border-0 hover:bg-amber-50/40 transition-colors">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: bg }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-bold text-gray-800 truncate">{vendorName}</span>
          <Pill label={certStatus} color={color} bg={bg} />
        </div>
        <span className="text-[11px] text-gray-500">{docType}</span>
        {issuingBody && <span className="text-[10px] text-gray-400 block">{issuingBody}</span>}
      </div>
      <div className="text-right flex-shrink-0">
        {expiryDate && (
          <div className="flex items-center gap-1 text-gray-400 justify-end">
            <Calendar className="w-3 h-3" />
            <span className="text-[10px]">{new Date(expiryDate).toLocaleDateString()}</span>
          </div>
        )}
        {daysLeft !== null && (
          <span className="text-[10px] font-black block mt-0.5"
            style={{ color: overdue ? "#EF4444" : daysLeft < 30 ? "#F59E0B" : "#10B981" }}>
            {overdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
          </span>
        )}
      </div>
    </div>
  );
}

// ── 4. Regulatory item ─────────────────────────────────────────────────────

function RegItem({ name, jurisdiction, category, status, dueDate, daysUntilDue, owner }: {
  name: string; jurisdiction: string | null; category: string | null; status: string;
  dueDate: string | null; daysUntilDue: number | null; owner: string | null;
}) {
  const overdue = daysUntilDue !== null && daysUntilDue < 0 && status !== "Compliant";
  const { color, bg } = regColor(status, overdue);
  return (
    <div className="flex items-start gap-3 px-5 py-3.5 border-b border-purple-100 last:border-0 hover:bg-purple-50/40 transition-colors">
      <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[12px] font-bold text-gray-800 leading-snug">{name}</span>
          <Pill label={overdue ? "Overdue" : status} color={color} bg={bg} />
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          {jurisdiction && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-gray-300" />
              <span className="text-[10px] text-gray-400">{jurisdiction}</span>
            </div>
          )}
          {category && <span className="text-[10px] text-gray-400">{category}</span>}
          {owner   && <span className="text-[10px] text-gray-400">{owner}</span>}
        </div>
      </div>
      {dueDate && (
        <div className="text-right flex-shrink-0">
          <div className="text-[10px] text-gray-400">{new Date(dueDate).toLocaleDateString()}</div>
          {daysUntilDue !== null && status !== "Compliant" && (
            <span className="text-[10px] font-black block mt-0.5"
              style={{ color: overdue ? "#EF4444" : daysUntilDue < 30 ? "#F59E0B" : "#10B981" }}>
              {overdue ? `${Math.abs(daysUntilDue)}d overdue` : `${daysUntilDue}d left`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export function VendorCompliancePage() {
  const { data: compRecords = [], isLoading: l1 } = useGetVendorComplianceQuery();
  const { data: certs = [],       isLoading: l2 } = useGetVendorCertificationsQuery();
  const { data: vendors = [] }                    = useGetVendorsQuery();
  const { data: findings = [],    isLoading: l3 } = useGetFindingsQuery();
  const { data: reqs = [],        isLoading: l4 } = useGetRegulatoryRequirementsQuery();

  const nameMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const v of vendors) m[v.id] = v.company_name;
    return m;
  }, [vendors]);

  const avgScore    = compRecords.length
    ? Math.round(compRecords.reduce((s, r) => s + r.overall_score, 0) / compRecords.length)
    : 0;
  const openFindings  = findings.filter((f) => f.status === "open").length;
  const certAlerts    = certs.filter((c) => c.cert_status !== "Valid").length;
  const violations    = reqs.filter(
    (r) => r.status === "Non-Compliant" ||
      (r.days_until_due !== null && r.days_until_due < 0 && r.status !== "Compliant"),
  ).length;

  const sortedScores = useMemo(
    () => [...compRecords].sort((a, b) => a.overall_score - b.overall_score),
    [compRecords],
  );
  const sortedFindings = useMemo(() => {
    const ord = ["critical", "major", "minor", "observation"];
    return [...findings].sort((a, b) => ord.indexOf(a.severity) - ord.indexOf(b.severity));
  }, [findings]);
  const sortedCerts = useMemo(
    () => [...certs].sort((a, b) => {
      const o = ["Expired", "Expiring", "Valid"];
      return o.indexOf(a.cert_status) - o.indexOf(b.cert_status);
    }),
    [certs],
  );
  const sortedReqs = useMemo(() => {
    const rank = (r: typeof reqs[0]) => {
      const ov = r.days_until_due !== null && r.days_until_due < 0 && r.status !== "Compliant";
      return ov ? 0 : r.status === "Non-Compliant" ? 1 : r.status === "Pending" ? 2 : 3;
    };
    return [...reqs].sort((a, b) => rank(a) - rank(b));
  }, [reqs]);

  if (l1 || l2 || l3 || l4) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-indigo-500" />
          <p className="text-sm text-gray-400">Loading compliance data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Dark hero banner ─────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, #1E2A78 0%, #0F172A 100%)" }}>
        <div className="px-8 pt-8 pb-6">
          <p className="text-[11px] font-semibold tracking-widest text-white/40 uppercase mb-1">
            Vendor Management
          </p>
          <h1 className="text-[26px] font-black text-white">Vendor Compliance</h1>
          <p className="text-[13px] text-white/50 mt-1">
            Compliance scores · Audit findings · Certifications · Regulatory status
          </p>
        </div>

        {/* 4 stat blocks */}
        <div className="flex flex-wrap border-t border-white/10">
          <div className="flex-1 border-r border-white/10 min-w-[130px]">
            <HeroStat
              value={`${avgScore}%`}
              label="Avg Compliance Score"
              sub={avgScore >= 85 ? "Compliant" : avgScore >= 70 ? "Moderate" : "At Risk"}
              accent={avgScore >= 85 ? "#34D399" : avgScore >= 70 ? "#FBBF24" : "#F87171"}
            />
          </div>
          <div className="flex-1 border-r border-white/10 min-w-[130px]">
            <HeroStat
              value={openFindings}
              label="Open Findings"
              sub={openFindings > 0 ? "Requires action" : "All clear"}
              accent={openFindings > 0 ? "#F87171" : "#34D399"}
            />
          </div>
          <div className="flex-1 border-r border-white/10 min-w-[130px]">
            <HeroStat
              value={certAlerts}
              label="Cert Alerts"
              sub="Expiring or expired"
              accent={certAlerts > 0 ? "#FBBF24" : "#34D399"}
            />
          </div>
          <div className="flex-1 min-w-[130px]">
            <HeroStat
              value={violations}
              label="Violations"
              sub="Non-compliant items"
              accent={violations > 0 ? "#F87171" : "#34D399"}
            />
          </div>
        </div>
      </div>

      {/* ── 2×2 panel grid ───────────────────────────────────── */}
      <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* 1 — Compliance Score */}
        <Panel
          title="Compliance Score"
          icon={TrendingUp}
          topColor="#3730A3"
          panelBg="#F5F7FF"
          borderColor="#C7D2FE"
          countBadge={{ value: compRecords.length, color: "#3730A3", bg: "#E0E7FF" }}
        >
          {sortedScores.length === 0 ? (
            <PanelEmpty text="No compliance records yet." />
          ) : sortedScores.map((r) => (
            <ScoreItem
              key={r.vendor_id}
              name={nameMap[r.vendor_id] || r.vendor_name}
              score={r.overall_score}
              domains={r.domains || []}
              activeSince={r.active_since}
            />
          ))}
        </Panel>

        {/* 2 — Audit Findings */}
        <Panel
          title="Audit Findings"
          icon={AlertTriangle}
          topColor="#B91C1C"
          panelBg="#FFF8F8"
          borderColor="#FECACA"
          countBadge={openFindings > 0
            ? { value: openFindings, color: "#B91C1C", bg: "#FEE2E2" }
            : undefined}
        >
          {sortedFindings.length === 0 ? (
            <PanelEmpty text="No audit findings recorded." />
          ) : sortedFindings.map((f) => (
            <FindingItem
              key={f.id}
              title={f.title}
              description={f.description}
              severity={f.severity}
              source={f.source_type}
              isoClause={f.iso_clause}
              status={f.status}
            />
          ))}
        </Panel>

        {/* 3 — Certification Status */}
        <Panel
          title="Certification Status"
          icon={Award}
          topColor="#B45309"
          panelBg="#FFFDF5"
          borderColor="#FDE68A"
          countBadge={certAlerts > 0
            ? { value: certAlerts, color: "#B45309", bg: "#FEF3C7" }
            : undefined}
        >
          {sortedCerts.length === 0 ? (
            <PanelEmpty text="No certifications on record." />
          ) : sortedCerts.map((c) => (
            <CertItem
              key={c.id}
              vendorName={c.vendor_name}
              docType={c.document_type}
              issuingBody={c.issuing_body}
              expiryDate={c.expiry_date}
              daysLeft={c.days_left}
              certStatus={c.cert_status}
            />
          ))}
        </Panel>

        {/* 4 — Regulatory Violations */}
        <Panel
          title="Regulatory Violations"
          icon={AlertCircle}
          topColor="#6D28D9"
          panelBg="#FAFAFF"
          borderColor="#DDD6FE"
          countBadge={violations > 0
            ? { value: violations, color: "#6D28D9", bg: "#EDE9FE" }
            : undefined}
        >
          {sortedReqs.length === 0 ? (
            <PanelEmpty text="No regulatory requirements tracked." />
          ) : sortedReqs.map((r) => (
            <RegItem
              key={r.id}
              name={r.regulation_name}
              jurisdiction={r.jurisdiction}
              category={r.category}
              status={r.status}
              dueDate={r.due_date}
              daysUntilDue={r.days_until_due}
              owner={r.owner}
            />
          ))}
        </Panel>

      </div>
    </div>
  );
}

