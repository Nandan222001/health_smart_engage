import { useMemo, useState } from "react";
import {
  Search, CheckCircle2, Clock, AlertTriangle, XCircle,
  Calendar, User, Tag, RefreshCw, Award, Gavel,
  FileText, Shield, ScrollText, FolderOpen, Globe,
  AlertOctagon, ChevronDown, ChevronRight,
} from "lucide-react";
import {
  useGetComplianceStandardsQuery,
  useGetComplianceDocumentsQuery,
  type ComplianceStandard,
  type ComplianceDocument,
} from "@/features/compliance/api/complianceApi";

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function daysUntil(d: string | null | undefined): number {
  if (!d) return 9999;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
}

// ── classifiers ───────────────────────────────────────────────────────────────
function isISO(s: ComplianceStandard) {
  const n = (s.name || "").toLowerCase();
  const c = (s.code || "").toLowerCase();
  const cat = (s.category || "").toLowerCase();
  return n.includes("iso") || c.startsWith("iso") || cat.includes("iso");
}
function isOSHA(s: ComplianceStandard) {
  const n = (s.name || "").toLowerCase();
  const c = (s.code || "").toLowerCase();
  const cat = (s.category || "").toLowerCase();
  const j = (s.jurisdiction || "").toLowerCase();
  return n.includes("osha") || c.includes("osha") || cat.includes("osha") || j.includes("osha");
}
function isSOP(d: ComplianceDocument) {
  const t = (d.document_type || "").toLowerCase();
  const cat = (d.category || "").toLowerCase();
  const title = (d.title || "").toLowerCase();
  return t === "sop" || t.includes("procedure") || cat.includes("sop") ||
    title.includes("sop") || cat.includes("procedure");
}
function isInternalPolicy(d: ComplianceDocument) {
  const t = (d.document_type || "").toLowerCase();
  const cat = (d.category || "").toLowerCase();
  const title = (d.title || "").toLowerCase();
  return t === "policy" || t.includes("policy") || cat.includes("policy") ||
    cat.includes("internal") || title.includes("policy");
}

// ── review urgency ────────────────────────────────────────────────────────────
function reviewUrgency(date: string | null | undefined): { label: string; bg: string; color: string; border: string } | null {
  if (!date) return null;
  const d = daysUntil(date);
  if (d < 0)   return { label: "Review Overdue",  bg: "#FEF2F2", color: "#991B1B", border: "#FECACA" };
  if (d <= 30)  return { label: "Review Due Soon", bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" };
  if (d <= 90)  return { label: "Review Upcoming", bg: "#FFFBEB", color: "#854D0E", border: "#FDE68A" };
  return null;
}

// ── status styles ─────────────────────────────────────────────────────────────
function statusStyle(status: string): { bg: string; color: string; dot: string; icon: React.ElementType } {
  const s = status.toLowerCase().replace(/_/g, " ");
  if (s === "active" || s === "published" || s === "compliant" || s === "approved")
    return { bg: "#D1FAE5", color: "#065F46", dot: "#16A34A", icon: CheckCircle2 };
  if (s === "draft")
    return { bg: "#DBEAFE", color: "#1E40AF", dot: "#3B82F6", icon: Clock };
  if (s === "under review" || s === "in review" || s === "under_review")
    return { bg: "#E0F2FE", color: "#0369A1", dot: "#0EA5E9", icon: RefreshCw };
  if (s === "pending")
    return { bg: "#FEF3C7", color: "#92400E", dot: "#D97706", icon: AlertTriangle };
  if (s === "expired" || s === "retired" || s === "superseded")
    return { bg: "#FEE2E2", color: "#991B1B", dot: "#DC2626", icon: XCircle };
  return { bg: "#F3F4F6", color: "#374151", dot: "#9CA3AF", icon: Clock };
}

// ─── sub-components ──────────────────────────────────────────────────────────

function HeroStat({ icon: Icon, label, value, sub, iconBg }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; iconBg: string;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.10)", borderRadius: 12, padding: "18px 22px",
      display: "flex", alignItems: "center", gap: 14, flex: "1 1 150px", minWidth: 130,
    }}>
      <div style={{ background: iconBg, borderRadius: 10, width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={20} color="#fff" />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, count, color }: {
  icon: React.ElementType; title: string; count?: number; color: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <div style={{ background: color, borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={17} color="#fff" />
      </div>
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>{title}</h2>
      {count !== undefined && (
        <span style={{ marginLeft: "auto", background: "#F3F4F6", color: "#374151", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>
          {count}
        </span>
      )}
    </div>
  );
}

function TallyCard({ label, value, bg, color, border }: {
  label: string; value: number; bg: string; color: string; border: string;
}) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "12px 18px", textAlign: "center", flex: "1 1 100px" }}>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color, fontWeight: 500, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = statusStyle(status);
  const Icon = s.icon;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: s.bg, color: s.color, borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
      <Icon size={11} />{status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

function FilterButtons({ options, active, onSelect, color }: {
  options: string[]; active: string; onSelect: (v: string) => void; color: string;
}) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onSelect(o)}
          style={{ padding: "5px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none",
            background: active === o ? color : "#F3F4F6",
            color:      active === o ? "#fff" : "#374151" }}>
          {o}
        </button>
      ))}
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div style={{ position: "relative", marginBottom: 14, flex: 1, minWidth: 220 }}>
      <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 34px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "#F9FAFB" }} />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ textAlign: "center", padding: "36px 24px", background: "#F9FAFB", borderRadius: 10, border: "1px dashed #D1D5DB" }}>
      <FolderOpen size={32} color="#D1D5DB" style={{ marginBottom: 8 }} />
      <div style={{ fontSize: 13, color: "#9CA3AF" }}>{message}</div>
    </div>
  );
}

// ── Standard card (ISO / OSHA) ────────────────────────────────────────────────
function StandardCard({ std, accentColor }: { std: ComplianceStandard; accentColor: string }) {
  const urgency = reviewUrgency(std.review_date);
  const reviewDays = daysUntil(std.review_date);
  return (
    <div style={{
      borderLeft: `4px solid ${accentColor}`,
      background: "#FAFBFF", border: "1px solid #E8EEF8", borderLeftColor: accentColor, borderLeftWidth: 4,
      borderRadius: "0 12px 12px 0", padding: "16px 18px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: "#111827", fontSize: 14, marginBottom: 5 }}>{std.name}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {std.code && (
              <span style={{ fontFamily: "monospace", background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 4, padding: "1px 7px", fontSize: 11, color: "#374151" }}>
                {std.code}
              </span>
            )}
            {std.version && (
              <span style={{ fontFamily: "monospace", background: accentColor + "14", border: `1px solid ${accentColor}33`, borderRadius: 4, padding: "1px 7px", fontSize: 11, color: accentColor, fontWeight: 600 }}>
                v{std.version}
              </span>
            )}
            {std.category && (
              <span style={{ background: "#EFF6FF", color: "#1E40AF", borderRadius: 4, padding: "1px 7px", fontSize: 11, fontWeight: 500 }}>
                {std.category}
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={std.status} />
      </div>

      {std.description && (
        <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 10px", fontStyle: "italic", lineHeight: 1.5 }}>
          {std.description.slice(0, 140)}{std.description.length > 140 ? "…" : ""}
        </p>
      )}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {std.jurisdiction && (
          <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
            <Globe size={11} color="#9CA3AF" />{std.jurisdiction}
          </span>
        )}
        {std.owner && (
          <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
            <User size={11} color="#9CA3AF" />{std.owner}
          </span>
        )}
        {std.effective_date && (
          <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
            <Calendar size={11} color="#9CA3AF" />Effective: {fmt(std.effective_date)}
          </span>
        )}
        {std.review_date && (
          <span style={{ fontSize: 12, color: reviewDays <= 30 ? "#D97706" : "#6B7280", fontWeight: reviewDays <= 30 ? 600 : 400, display: "flex", alignItems: "center", gap: 4 }}>
            <RefreshCw size={11} />Review: {fmt(std.review_date)}
            {reviewDays <= 90 && reviewDays >= 0 && (
              <span style={{ fontSize: 11, color: reviewDays <= 30 ? "#D97706" : "#9CA3AF" }}>({reviewDays}d)</span>
            )}
          </span>
        )}
      </div>

      {urgency && (
        <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5, background: urgency.bg, border: `1px solid ${urgency.border}`, borderRadius: 6, padding: "3px 10px" }}>
          <AlertTriangle size={11} color={urgency.color} />
          <span style={{ fontSize: 11, fontWeight: 700, color: urgency.color }}>{urgency.label}</span>
          {std.review_date && daysUntil(std.review_date) < 0 && (
            <span style={{ fontSize: 11, color: urgency.color }}>({Math.abs(daysUntil(std.review_date))}d overdue)</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Document card (SOP / Policy) ──────────────────────────────────────────────
function DocumentCard({ doc, accentColor }: { doc: ComplianceDocument; accentColor: string }) {
  const effectiveDays = daysUntil(doc.effective_date);
  const comingSoon = effectiveDays >= 0 && effectiveDays <= 30;
  return (
    <div style={{
      borderLeft: `4px solid ${accentColor}`,
      background: "#FAFBFF", border: "1px solid #E8EEF8", borderLeftColor: accentColor, borderLeftWidth: 4,
      borderRadius: "0 12px 12px 0", padding: "14px 16px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: "#111827", fontSize: 14, marginBottom: 5 }}>
            {doc.title}
            {comingSoon && (
              <span style={{ marginLeft: 8, fontSize: 10, background: "#FEF3C7", color: "#D97706", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>
                EFFECTIVE SOON
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {doc.document_type && (
              <span style={{ background: accentColor + "18", color: accentColor, border: `1px solid ${accentColor}33`, borderRadius: 4, padding: "1px 7px", fontSize: 11, fontWeight: 600 }}>
                {doc.document_type}
              </span>
            )}
            {doc.version && (
              <span style={{ fontFamily: "monospace", background: "#F3F4F6", borderRadius: 4, padding: "1px 6px", fontSize: 11 }}>
                v{doc.version}
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={doc.status} />
      </div>

      {doc.description && (
        <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 10px", fontStyle: "italic", lineHeight: 1.5 }}>
          {doc.description.slice(0, 130)}{doc.description.length > 130 ? "…" : ""}
        </p>
      )}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {doc.created_by && (
          <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
            <User size={11} color="#9CA3AF" />{doc.created_by}
          </span>
        )}
        {doc.effective_date && (
          <span style={{ fontSize: 12, color: comingSoon ? "#D97706" : "#6B7280", fontWeight: comingSoon ? 600 : 400, display: "flex", alignItems: "center", gap: 4 }}>
            <Calendar size={11} />Effective: {fmt(doc.effective_date)}
            {comingSoon && <span style={{ fontSize: 11, color: "#D97706" }}>({effectiveDays}d)</span>}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Category group for SOP / Policy sections ──────────────────────────────────
function CategoryGroup({ cat, docs, accentColor, defaultOpen = true }: {
  cat: string; docs: ComplianceDocument[]; accentColor: string; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 14 }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          padding: "4px 0", marginBottom: open ? 8 : 0, width: "100%",
        }}
      >
        {open
          ? <ChevronDown size={14} color={accentColor} />
          : <ChevronRight size={14} color={accentColor} />}
        <span style={{ fontSize: 12, fontWeight: 700, color: accentColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {cat}
        </span>
        <span style={{ fontSize: 11, fontWeight: 400, color: "#9CA3AF" }}>({docs.length})</span>
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {docs.map((d) => <DocumentCard key={d.id} doc={d} accentColor={accentColor} />)}
        </div>
      )}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export function StandardsPoliciesPage() {
  const { data: standards = [], isLoading: l1 } = useGetComplianceStandardsQuery();
  const { data: documents = [], isLoading: l2 } = useGetComplianceDocumentsQuery();

  // search states
  const [isoSearch,    setIsoSearch]    = useState("");
  const [isoStatus,    setIsoStatus]    = useState("All");
  const [oshaSearch,   setOshaSearch]   = useState("");
  const [oshaStatus,   setOshaStatus]   = useState("All");
  const [sopSearch,    setSopSearch]    = useState("");
  const [sopStatus,    setSopStatus]    = useState("All");
  const [polSearch,    setPolSearch]    = useState("");
  const [polStatus,    setPolStatus]    = useState("All");

  const loading = l1 || l2;

  // ── classification ────────────────────────────────────────────────────────
  const isoStandards   = useMemo(() => standards.filter(isISO),             [standards]);
  const oshaStandards  = useMemo(() => standards.filter(isOSHA),            [standards]);
  const otherStandards = useMemo(() => standards.filter((s) => !isISO(s) && !isOSHA(s)), [standards]);
  const sopDocs        = useMemo(() => documents.filter(isSOP),             [documents]);
  const policyDocs     = useMemo(() => documents.filter(isInternalPolicy),  [documents]);
  const otherDocs      = useMemo(() => documents.filter((d) => !isSOP(d) && !isInternalPolicy(d)), [documents]);

  // ── global stats ──────────────────────────────────────────────────────────
  const overdueReview  = useMemo(() => standards.filter((s) => s.review_date && daysUntil(s.review_date) < 0).length, [standards]);
  const activeISO      = useMemo(() => isoStandards.filter((s)  => ["active","published"].includes(s.status.toLowerCase())).length,  [isoStandards]);
  const activeOSHA     = useMemo(() => oshaStandards.filter((s) => ["active","published"].includes(s.status.toLowerCase())).length,  [oshaStandards]);
  const activeSOP      = useMemo(() => sopDocs.filter((d)       => ["active","published"].includes(d.status.toLowerCase())).length,  [sopDocs]);
  const activePolicy   = useMemo(() => policyDocs.filter((d)    => ["active","published"].includes(d.status.toLowerCase())).length,  [policyDocs]);

  // ── tally helpers ─────────────────────────────────────────────────────────
  function stdTally(arr: ComplianceStandard[]) {
    return {
      active:  arr.filter((s) => ["active","published"].includes(s.status.toLowerCase())).length,
      draft:   arr.filter((s) => s.status.toLowerCase() === "draft").length,
      review:  arr.filter((s) => s.status.toLowerCase().includes("review")).length,
      expired: arr.filter((s) => ["expired","retired","superseded"].includes(s.status.toLowerCase())).length,
    };
  }
  function docTally(arr: ComplianceDocument[]) {
    return {
      active:  arr.filter((d) => ["active","published","approved"].includes(d.status.toLowerCase())).length,
      draft:   arr.filter((d) => d.status.toLowerCase() === "draft").length,
      review:  arr.filter((d) => d.status.toLowerCase().includes("review")).length,
      expired: arr.filter((d) => ["expired","retired","superseded"].includes(d.status.toLowerCase())).length,
    };
  }

  const isoT  = useMemo(() => stdTally(isoStandards),  [isoStandards]);
  const oshaT = useMemo(() => stdTally(oshaStandards),  [oshaStandards]);
  const sopT  = useMemo(() => docTally(sopDocs),        [sopDocs]);
  const polT  = useMemo(() => docTally(policyDocs),     [policyDocs]);

  // ── filtered lists ────────────────────────────────────────────────────────
  function filterStd(arr: ComplianceStandard[], search: string, status: string) {
    const q = search.toLowerCase();
    return arr.filter((s) => {
      const mQ = !q || s.name.toLowerCase().includes(q)
        || (s.code || "").toLowerCase().includes(q)
        || (s.category || "").toLowerCase().includes(q)
        || (s.description || "").toLowerCase().includes(q)
        || (s.jurisdiction || "").toLowerCase().includes(q);
      const mS = status === "All"
        || (status === "Active" && ["active","published"].includes(s.status.toLowerCase()))
        || (status === "Draft" && s.status.toLowerCase() === "draft")
        || (status === "Under Review" && s.status.toLowerCase().includes("review"))
        || (status === "Expired" && ["expired","retired","superseded"].includes(s.status.toLowerCase()));
      return mQ && mS;
    });
  }
  function filterDoc(arr: ComplianceDocument[], search: string, status: string) {
    const q = search.toLowerCase();
    return arr.filter((d) => {
      const mQ = !q || d.title.toLowerCase().includes(q)
        || (d.category || "").toLowerCase().includes(q)
        || (d.created_by || "").toLowerCase().includes(q)
        || (d.description || "").toLowerCase().includes(q);
      const mS = status === "All"
        || (status === "Active" && ["active","published","approved"].includes(d.status.toLowerCase()))
        || (status === "Draft" && d.status.toLowerCase() === "draft")
        || (status === "Under Review" && d.status.toLowerCase().includes("review"))
        || (status === "Expired" && ["expired","retired","superseded"].includes(d.status.toLowerCase()));
      return mQ && mS;
    });
  }

  const filteredISO  = useMemo(() => filterStd(isoStandards,  isoSearch,  isoStatus),  [isoStandards,  isoSearch,  isoStatus]);
  const filteredOSHA = useMemo(() => filterStd(oshaStandards, oshaSearch, oshaStatus), [oshaStandards, oshaSearch, oshaStatus]);
  const filteredSOP  = useMemo(() => filterDoc(sopDocs,        sopSearch,  sopStatus),  [sopDocs,       sopSearch,  sopStatus]);
  const filteredPol  = useMemo(() => filterDoc(policyDocs,     polSearch,  polStatus),  [policyDocs,    polSearch,  polStatus]);

  // category map for grouped SOP / Policy views
  function byCategory(arr: ComplianceDocument[]): Record<string, ComplianceDocument[]> {
    const map: Record<string, ComplianceDocument[]> = {};
    arr.forEach((d) => {
      const k = d.category || "General";
      if (!map[k]) map[k] = [];
      map[k].push(d);
    });
    return map;
  }

  const sopByCategory = useMemo(() => byCategory(filteredSOP),  [filteredSOP]);
  const polByCategory = useMemo(() => byCategory(filteredPol),  [filteredPol]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F3F7FF", paddingBottom: 40 }}>

      {/* Banner */}
      <div style={{
        background: "linear-gradient(135deg, #0C1A35 0%, #1A3461 35%, #1E4D8C 65%, #1D6FA4 100%)",
        padding: "32px 32px 28px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ScrollText size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff" }}>Standards & Policies</h1>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              ISO Standards · OSHA Policies · SOP Documents · Internal Policies
            </p>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <HeroStat icon={Award}         label="ISO Standards"    value={isoStandards.length}   sub={`${activeISO} active`}   iconBg="rgba(30,58,138,0.55)" />
          <HeroStat icon={Gavel}         label="OSHA Policies"    value={oshaStandards.length}  sub={`${activeOSHA} active`}  iconBg="rgba(153,27,27,0.55)" />
          <HeroStat icon={FileText}      label="SOP Documents"    value={sopDocs.length}        sub={`${activeSOP} active`}   iconBg="rgba(5,150,105,0.5)"  />
          <HeroStat icon={Shield}        label="Internal Policies" value={policyDocs.length}   sub={`${activePolicy} active`} iconBg="rgba(109,40,217,0.5)" />
          <HeroStat icon={ScrollText}    label="All Standards"    value={standards.length}      sub={`${otherStandards.length} other`} iconBg="rgba(217,119,6,0.45)" />
          <HeroStat icon={AlertOctagon}  label="Review Overdue"   value={overdueReview}         sub="standards past review"   iconBg="rgba(220,38,38,0.5)"  />
        </div>
      </div>

      <div style={{ padding: "28px 32px 0", display: "flex", flexDirection: "column", gap: 28 }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>Loading standards and policies…</div>
        )}

        {!loading && (
          <>
            {/* ── Section 1: ISO Standards ──────────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={Award} title="ISO Standards" count={isoStandards.length} color="#1D4ED8" />

              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>
                International Organisation for Standardisation standards applicable to this organisation's HSE management system.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <TallyCard label="Active"       value={isoT.active}  bg="#D1FAE5" color="#065F46" border="#BBF7D0" />
                <TallyCard label="Draft"        value={isoT.draft}   bg="#DBEAFE" color="#1E40AF" border="#BFDBFE" />
                <TallyCard label="Under Review" value={isoT.review}  bg="#E0F2FE" color="#0369A1" border="#BAE6FD" />
                <TallyCard label="Expired"      value={isoT.expired} bg="#FEE2E2" color="#991B1B" border="#FECACA" />
              </div>

              {overdueReview > 0 && isoStandards.some((s) => s.review_date && daysUntil(s.review_date) < 0) && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertOctagon size={14} color="#DC2626" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#991B1B" }}>
                    {isoStandards.filter((s) => s.review_date && daysUntil(s.review_date) < 0).length} ISO standard{isoStandards.filter((s) => s.review_date && daysUntil(s.review_date) < 0).length > 1 ? "s" : ""} past review date
                  </span>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <SearchInput value={isoSearch} onChange={setIsoSearch} placeholder="Search by name, code, category, jurisdiction…" />
              </div>
              <FilterButtons options={["All", "Active", "Draft", "Under Review", "Expired"]} active={isoStatus} onSelect={setIsoStatus} color="#1D4ED8" />

              {filteredISO.length === 0 ? (
                <EmptyState message={isoSearch || isoStatus !== "All" ? "No ISO standards match your filter." : "No ISO standards found. Standards with 'ISO' in name, code, or category appear here."} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {filteredISO.map((s) => <StandardCard key={s.id} std={s} accentColor="#1D4ED8" />)}
                </div>
              )}
            </div>

            {/* ── Section 2: OSHA Policies ──────────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={Gavel} title="OSHA Policies" count={oshaStandards.length} color="#B91C1C" />

              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>
                Occupational Safety and Health Administration regulations and enforcement policies tracked for compliance.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <TallyCard label="Active"       value={oshaT.active}  bg="#D1FAE5" color="#065F46" border="#BBF7D0" />
                <TallyCard label="Draft"        value={oshaT.draft}   bg="#DBEAFE" color="#1E40AF" border="#BFDBFE" />
                <TallyCard label="Under Review" value={oshaT.review}  bg="#E0F2FE" color="#0369A1" border="#BAE6FD" />
                <TallyCard label="Expired"      value={oshaT.expired} bg="#FEE2E2" color="#991B1B" border="#FECACA" />
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <SearchInput value={oshaSearch} onChange={setOshaSearch} placeholder="Search OSHA policies by name, code, jurisdiction…" />
              </div>
              <FilterButtons options={["All", "Active", "Draft", "Under Review", "Expired"]} active={oshaStatus} onSelect={setOshaStatus} color="#B91C1C" />

              {filteredOSHA.length === 0 ? (
                <EmptyState message={oshaSearch || oshaStatus !== "All" ? "No OSHA policies match your filter." : "No OSHA policies found. Standards with 'OSHA' in name, code, or jurisdiction appear here."} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {filteredOSHA.map((s) => <StandardCard key={s.id} std={s} accentColor="#B91C1C" />)}
                </div>
              )}

              {/* Other unclassified standards as a collapsible extra */}
              {otherStandards.length > 0 && (
                <details style={{ marginTop: 20 }}>
                  <summary style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", gap: 6, userSelect: "none" }}>
                    <Tag size={12} /> Other Regulatory Standards ({otherStandards.length})
                  </summary>
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                    {otherStandards.map((s) => <StandardCard key={s.id} std={s} accentColor="#6B7280" />)}
                  </div>
                </details>
              )}
            </div>

            {/* ── Section 3: SOP Documents ──────────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={FileText} title="SOP Documents" count={sopDocs.length} color="#059669" />

              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>
                Standard Operating Procedures governing routine HSE operations, safety protocols, and emergency responses.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <TallyCard label="Published"    value={sopT.active}  bg="#D1FAE5" color="#065F46" border="#BBF7D0" />
                <TallyCard label="Draft"        value={sopT.draft}   bg="#DBEAFE" color="#1E40AF" border="#BFDBFE" />
                <TallyCard label="Under Review" value={sopT.review}  bg="#E0F2FE" color="#0369A1" border="#BAE6FD" />
                <TallyCard label="Retired"      value={sopT.expired} bg="#FEE2E2" color="#991B1B" border="#FECACA" />
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <SearchInput value={sopSearch} onChange={setSopSearch} placeholder="Search SOPs by title, category, author…" />
              </div>
              <FilterButtons options={["All", "Active", "Draft", "Under Review", "Expired"]} active={sopStatus} onSelect={setSopStatus} color="#059669" />

              {filteredSOP.length === 0 ? (
                <EmptyState message={sopSearch || sopStatus !== "All" ? "No SOPs match your filter." : "No SOP documents found. Documents with type 'sop' or 'procedure' appear here."} />
              ) : (
                <div>
                  {Object.entries(sopByCategory).map(([cat, docs], i) => (
                    <CategoryGroup key={cat} cat={cat} docs={docs} accentColor="#059669" defaultOpen={i === 0} />
                  ))}
                </div>
              )}
            </div>

            {/* ── Section 4: Internal Policies ──────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={Shield} title="Internal Policies" count={policyDocs.length} color="#7C3AED" />

              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>
                Organisation-specific HSE policies, codes of conduct, and workplace safety rules.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <TallyCard label="Published"    value={polT.active}  bg="#D1FAE5" color="#065F46" border="#BBF7D0" />
                <TallyCard label="Draft"        value={polT.draft}   bg="#EDE9FE" color="#4C1D95" border="#C4B5FD" />
                <TallyCard label="Under Review" value={polT.review}  bg="#E0F2FE" color="#0369A1" border="#BAE6FD" />
                <TallyCard label="Retired"      value={polT.expired} bg="#FEE2E2" color="#991B1B" border="#FECACA" />
              </div>

              {polT.expired > 0 && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertTriangle size={14} color="#DC2626" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#991B1B" }}>
                    {polT.expired} internal polic{polT.expired > 1 ? "ies" : "y"} expired — review and renew required
                  </span>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <SearchInput value={polSearch} onChange={setPolSearch} placeholder="Search policies by title, category, author…" />
              </div>
              <FilterButtons options={["All", "Active", "Draft", "Under Review", "Expired"]} active={polStatus} onSelect={setPolStatus} color="#7C3AED" />

              {filteredPol.length === 0 ? (
                <EmptyState message={polSearch || polStatus !== "All" ? "No policies match your filter." : "No internal policy documents found. Documents with type 'policy' appear here."} />
              ) : (
                <div>
                  {Object.entries(polByCategory).map(([cat, docs], i) => (
                    <CategoryGroup key={cat} cat={cat} docs={docs} accentColor="#7C3AED" defaultOpen={i === 0} />
                  ))}
                </div>
              )}

              {/* Other docs not yet classified */}
              {otherDocs.length > 0 && (
                <details style={{ marginTop: 20 }}>
                  <summary style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", gap: 6, userSelect: "none" }}>
                    <Tag size={12} /> Other Documents ({otherDocs.length})
                  </summary>
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                    {otherDocs.map((d) => <DocumentCard key={d.id} doc={d} accentColor="#9CA3AF" />)}
                  </div>
                </details>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
