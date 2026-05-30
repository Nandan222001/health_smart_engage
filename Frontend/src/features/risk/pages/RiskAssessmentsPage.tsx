import { useMemo, useState } from "react";
import {
  Search, AlertTriangle, CheckCircle2, Clock, AlertOctagon,
  Calendar, User, MapPin, Tag, Shield, ShieldAlert,
  Activity, BarChart2, Layers, Wrench, XCircle,
  TrendingDown, Building2, ChevronDown, ChevronRight,
} from "lucide-react";
import {
  useListRiskAssessmentsQuery,
  useListHazardsQuery,
  type RiskAssessment,
  type Hazard,
} from "@/features/hazards/api/hazardsApi";
import { useGetRootCauseAnalysisQuery } from "@/features/risk/api/riskApi";
import type { RootCauseAnalysis } from "@/services/api";

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function riskLevelStyle(level: string): { bg: string; color: string; border: string; bar: string } {
  switch (level.toLowerCase()) {
    case "critical": return { bg: "#FEF2F2", color: "#7F1D1D", border: "#FECACA", bar: "#DC2626" };
    case "high":     return { bg: "#FFF1F2", color: "#9F1239", border: "#FECDD3", bar: "#F43F5E" };
    case "medium":   return { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA", bar: "#F97316" };
    default:         return { bg: "#F0FDF4", color: "#065F46", border: "#BBF7D0", bar: "#22C55E" };
  }
}

function statusStyle(status: string): { bg: string; color: string; dot: string } {
  switch (status.toLowerCase()) {
    case "active":    return { bg: "#D1FAE5", color: "#065F46", dot: "#16A34A" };
    case "draft":     return { bg: "#DBEAFE", color: "#1E40AF", dot: "#3B82F6" };
    case "archived":  return { bg: "#F3F4F6", color: "#6B7280", dot: "#9CA3AF" };
    case "open":      return { bg: "#FEE2E2", color: "#991B1B", dot: "#DC2626" };
    case "mitigated": return { bg: "#D1FAE5", color: "#065F46", dot: "#16A34A" };
    case "closed":    return { bg: "#F3F4F6", color: "#6B7280", dot: "#9CA3AF" };
    default:          return { bg: "#FEF3C7", color: "#92400E", dot: "#D97706" };
  }
}

function priorityStyle(p: string): { bg: string; color: string; border: string } {
  const s = p.toLowerCase();
  if (s === "critical" || s === "high") return { bg: "#FEF2F2", color: "#991B1B", border: "#FECACA" };
  if (s === "medium")                   return { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" };
  return                                       { bg: "#F0FDF4", color: "#065F46", border: "#BBF7D0" };
}

// ─── sub-components ──────────────────────────────────────────────────────────

function HeroStat({ icon: Icon, label, value, sub, iconBg }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; iconBg: string;
}) {
  return (
    <div style={{ background: "rgba(255,255,255,0.10)", borderRadius: 12, padding: "18px 22px", display: "flex", alignItems: "center", gap: 14, flex: "1 1 150px", minWidth: 130 }}>
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
        <span style={{ marginLeft: "auto", background: "#F3F4F6", color: "#374151", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>{count}</span>
      )}
    </div>
  );
}

function TallyCard({ label, value, bg, color, border }: {
  label: string; value: number; bg: string; color: string; border: string;
}) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "13px 18px", textAlign: "center", flex: "1 1 100px" }}>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color, fontWeight: 500, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function RiskLevelBadge({ level }: { level: string }) {
  const s = riskLevelStyle(level);
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 700, textTransform: "capitalize", whiteSpace: "nowrap" }}>
      {level}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = statusStyle(status);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: s.bg, color: s.color, borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
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
            background: active === o ? color : "#F3F4F6", color: active === o ? "#fff" : "#374151" }}>
          {o}
        </button>
      ))}
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ position: "relative", marginBottom: 10 }}>
      <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 34px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "#F9FAFB" }} />
    </div>
  );
}

// ── horizontal level bar ──────────────────────────────────────────────────────
function LevelBar({ label, count, total, color, bg, border }: {
  label: string; count: number; total: number; color: string; bg: string; border: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{count} <span style={{ fontWeight: 400, color: "#9CA3AF", fontSize: 11 }}>({Math.round(pct)}%)</span></span>
      </div>
      <div style={{ height: 10, background: "#F3F4F6", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 6, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

// ── hazard category accordion ─────────────────────────────────────────────────
function HazardCategoryGroup({ type, hazards }: { type: string; hazards: Hazard[] }) {
  const [open, setOpen] = useState(true);
  const critical = hazards.filter((h) => h.severity === "critical").length;
  const high     = hazards.filter((h) => h.severity === "high").length;
  const open_    = hazards.filter((h) => h.status === "open").length;
  const worstLevel = critical > 0 ? "critical" : high > 0 ? "high" : hazards[0]?.severity || "low";
  const ls = riskLevelStyle(worstLevel);
  return (
    <div style={{ border: `1px solid ${ls.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 10 }}>
      <button type="button" onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: ls.bg, border: "none", cursor: "pointer", textAlign: "left" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: ls.bar, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ShieldAlert size={16} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: "#111827", fontSize: 14 }}>{type}</div>
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
            {hazards.length} hazard{hazards.length !== 1 ? "s" : ""}
            {open_ > 0 && <span style={{ marginLeft: 8, color: "#DC2626", fontWeight: 600 }}>{open_} open</span>}
            {critical > 0 && <span style={{ marginLeft: 8, color: "#7F1D1D", fontWeight: 600 }}>{critical} critical</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {critical > 0 && <span style={{ fontSize: 11, background: "#FEF2F2", color: "#7F1D1D", border: "1px solid #FECACA", borderRadius: 5, padding: "1px 7px", fontWeight: 700 }}>{critical} Critical</span>}
          {high     > 0 && <span style={{ fontSize: 11, background: "#FFF1F2", color: "#9F1239", border: "1px solid #FECDD3", borderRadius: 5, padding: "1px 7px", fontWeight: 700 }}>{high} High</span>}
        </div>
        {open ? <ChevronDown size={16} color="#9CA3AF" /> : <ChevronRight size={16} color="#9CA3AF" />}
      </button>
      {open && (
        <div style={{ padding: "12px 16px 16px", background: "#fff" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {hazards.map((h) => {
              const hs = riskLevelStyle(h.severity);
              return (
                <div key={h.id} style={{
                  borderLeft: `4px solid ${hs.bar}`, background: hs.bg,
                  borderRadius: "0 8px 8px 0", padding: "10px 14px",
                  display: "flex", alignItems: "flex-start", gap: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: "#111827" }}>{h.title}</span>
                      <RiskLevelBadge level={h.severity} />
                      <StatusBadge status={h.status} />
                    </div>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                      {h.site_id  && <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} />{h.site_id}</span>}
                      {h.zone_id  && <span style={{ fontSize: 12, color: "#6B7280" }}>Zone: {h.zone_id}</span>}
                      <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><User size={11} />{h.reported_by}</span>
                      <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><Calendar size={11} />{fmt(h.identified_at)}</span>
                    </div>
                    {h.description && <div style={{ marginTop: 4, fontSize: 12, color: "#374151", fontStyle: "italic" }}>{h.description.slice(0, 100)}{h.description.length > 100 ? "…" : ""}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export function RiskAssessmentsPage() {
  const { data: assessments = [], isLoading: l1 } = useListRiskAssessmentsQuery();
  const { data: hazards     = [], isLoading: l2 } = useListHazardsQuery();
  const { data: rcas        = [], isLoading: l3 } = useGetRootCauseAnalysisQuery();

  const [raSearch,  setRaSearch]  = useState("");
  const [raStatus,  setRaStatus]  = useState("All");
  const [raLevel,   setRaLevel]   = useState("All");
  const [hazSearch, setHazSearch] = useState("");
  const [hazStatus, setHazStatus] = useState("All");
  const [mitSearch, setMitSearch] = useState("");
  const [mitFilter, setMitFilter] = useState("All");

  const loading = l1 || l2 || l3;

  // ── assessment derived ────────────────────────────────────────────────────
  const activeRA   = useMemo(() => assessments.filter((a) => a.status === "active"),   [assessments]);
  const draftRA    = useMemo(() => assessments.filter((a) => a.status === "draft"),    [assessments]);
  const archivedRA = useMemo(() => assessments.filter((a) => a.status === "archived"), [assessments]);
  const criticalRA = useMemo(() => assessments.filter((a) => a.risk_level === "critical"), [assessments]);
  const highRA     = useMemo(() => assessments.filter((a) => a.risk_level === "high"),     [assessments]);

  // ── hazard derived ────────────────────────────────────────────────────────
  const openHazards      = useMemo(() => hazards.filter((h) => h.status === "open"),      [hazards]);
  const mitigatedHazards = useMemo(() => hazards.filter((h) => h.status === "mitigated"), [hazards]);
  const criticalHazards  = useMemo(() => hazards.filter((h) => h.severity === "critical"), [hazards]);
  const withMitigation   = useMemo(() => hazards.filter((h) => !!(h.mitigation && h.mitigation.trim())), [hazards]);

  // ── hazard categories ─────────────────────────────────────────────────────
  const hazardCategories = useMemo(() => {
    const map: Record<string, Hazard[]> = {};
    hazards.forEach((h) => {
      const k = h.type || "Uncategorised";
      if (!map[k]) map[k] = [];
      map[k].push(h);
    });
    return Object.entries(map).sort((a, b) => {
      const aHigh = a[1].filter((h) => ["critical","high"].includes(h.severity)).length;
      const bHigh = b[1].filter((h) => ["critical","high"].includes(h.severity)).length;
      return bHigh - aHigh;
    });
  }, [hazards]);

  // ── mitigation plans combined from hazards + RCAs ────────────────────────
  const rcaWithActions = useMemo(
    () => rcas.filter((r) => (r.Corrective_Actions || r.Preventive_Measures || "").trim()),
    [rcas],
  );

  // ── filtered lists ────────────────────────────────────────────────────────
  const filteredRA = useMemo(() => assessments.filter((a) => {
    const q = raSearch.toLowerCase();
    const mQ = !q || a.title.toLowerCase().includes(q)
      || (a.site_id || "").toLowerCase().includes(q)
      || (a.department || "").toLowerCase().includes(q)
      || a.assessor.toLowerCase().includes(q);
    const mS = raStatus === "All" || a.status === raStatus.toLowerCase();
    const mL = raLevel  === "All" || a.risk_level === raLevel.toLowerCase();
    return mQ && mS && mL;
  }), [assessments, raSearch, raStatus, raLevel]);

  const filteredHaz = useMemo(() => hazards.filter((h) => {
    const q = hazSearch.toLowerCase();
    const mQ = !q || h.title.toLowerCase().includes(q)
      || (h.type || "").toLowerCase().includes(q)
      || (h.site_id || "").toLowerCase().includes(q)
      || h.reported_by.toLowerCase().includes(q);
    const mS = hazStatus === "All"
      || (hazStatus === "Open"      && h.status === "open")
      || (hazStatus === "Mitigated" && h.status === "mitigated")
      || (hazStatus === "Closed"    && h.status === "closed")
      || (hazStatus === "Critical"  && h.severity === "critical")
      || (hazStatus === "High"      && h.severity === "high");
    return mQ && mS;
  }), [hazards, hazSearch, hazStatus]);

  const filteredCategories = useMemo(() => {
    if (!hazSearch && hazStatus === "All") return hazardCategories;
    const hazSet = new Set(filteredHaz.map((h) => h.id));
    return hazardCategories
      .map(([type, hs]) => [type, hs.filter((h) => hazSet.has(h.id))] as [string, Hazard[]])
      .filter(([, hs]) => hs.length > 0);
  }, [hazardCategories, filteredHaz, hazSearch, hazStatus]);

  const filteredMit = useMemo(() => {
    const q = mitSearch.toLowerCase();
    const hazMit = withMitigation.filter((h) => {
      const mQ = !q || h.title.toLowerCase().includes(q) || (h.mitigation || "").toLowerCase().includes(q) || (h.site_id || "").toLowerCase().includes(q);
      const mF = mitFilter === "All" || mitFilter === "Hazard";
      return mQ && mF;
    });
    const rcaMit = rcaWithActions.filter((r) => {
      const mQ = !q || r.Root_Causes.toLowerCase().includes(q) || r.Corrective_Actions.toLowerCase().includes(q) || r.Site_ID.toLowerCase().includes(q) || r.Conducted_By.toLowerCase().includes(q);
      const mF = mitFilter === "All" || mitFilter === "RCA";
      return mQ && mF;
    });
    return { hazMit, rcaMit };
  }, [withMitigation, rcaWithActions, mitSearch, mitFilter]);

  // ── level totals for combined risk level view ─────────────────────────────
  const raLevelCounts = useMemo(() => ({
    critical: assessments.filter((a) => a.risk_level === "critical").length,
    high:     assessments.filter((a) => a.risk_level === "high").length,
    medium:   assessments.filter((a) => a.risk_level === "medium").length,
    low:      assessments.filter((a) => a.risk_level === "low").length,
  }), [assessments]);

  const hazLevelCounts = useMemo(() => ({
    critical: hazards.filter((h) => h.severity === "critical").length,
    high:     hazards.filter((h) => h.severity === "high").length,
    medium:   hazards.filter((h) => h.severity === "medium").length,
    low:      hazards.filter((h) => h.severity === "low").length,
  }), [hazards]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F3F7FF", paddingBottom: 40 }}>

      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, #1A0A00 0%, #431407 35%, #7C2D12 65%, #9A3412 100%)", padding: "32px 32px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldAlert size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff" }}>Risk Assessments</h1>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              Active Assessments · Risk Levels · Hazard Categories · Mitigation Plans
            </p>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <HeroStat icon={Activity}    label="Total Assessments" value={assessments.length}     sub={`${activeRA.length} active`}      iconBg="rgba(220,38,38,0.5)"  />
          <HeroStat icon={AlertOctagon}label="Critical Risk"     value={criticalRA.length}      sub="require immediate action"         iconBg="rgba(153,27,27,0.6)"  />
          <HeroStat icon={ShieldAlert} label="Open Hazards"      value={openHazards.length}     sub={`${criticalHazards.length} critical`} iconBg="rgba(234,88,12,0.55)" />
          <HeroStat icon={Wrench}      label="Mitigation Plans"  value={withMitigation.length}  sub={`${mitigatedHazards.length} mitigated`} iconBg="rgba(5,150,105,0.5)" />
          <HeroStat icon={Layers}      label="Hazard Categories" value={hazardCategories.length} iconBg="rgba(109,40,217,0.5)"  />
          <HeroStat icon={BarChart2}   label="RCA Actions"       value={rcaWithActions.length}   sub="with corrective actions"         iconBg="rgba(30,58,138,0.5)"  />
        </div>
      </div>

      <div style={{ padding: "28px 32px 0", display: "flex", flexDirection: "column", gap: 28 }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>Loading risk data…</div>
        )}

        {!loading && (
          <>
            {/* ── Section 1: Active Risk Assessments ───────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={Activity} title="Active Risk Assessments" count={assessments.length} color="#DC2626" />

              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>
                All risk assessments across sites and departments, filterable by status and risk level.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <TallyCard label="Active"   value={activeRA.length}   bg="#D1FAE5" color="#065F46" border="#BBF7D0" />
                <TallyCard label="Draft"    value={draftRA.length}    bg="#DBEAFE" color="#1E40AF" border="#BFDBFE" />
                <TallyCard label="Archived" value={archivedRA.length} bg="#F3F4F6" color="#6B7280" border="#E5E7EB" />
                <TallyCard label="Critical" value={criticalRA.length} bg="#FEF2F2" color="#7F1D1D" border="#FECACA" />
                <TallyCard label="High"     value={highRA.length}     bg="#FFF1F2" color="#9F1239" border="#FECDD3" />
              </div>

              {criticalRA.length > 0 && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertOctagon size={14} color="#DC2626" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#991B1B" }}>
                    {criticalRA.length} critical risk assessment{criticalRA.length > 1 ? "s" : ""} require immediate action
                  </span>
                </div>
              )}

              <SearchInput value={raSearch} onChange={setRaSearch} placeholder="Search by title, site, department, assessor…" />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 5, fontWeight: 600 }}>STATUS</div>
                  <FilterButtons options={["All", "Active", "Draft", "Archived"]} active={raStatus} onSelect={setRaStatus} color="#DC2626" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 5, fontWeight: 600 }}>RISK LEVEL</div>
                  <FilterButtons options={["All", "Critical", "High", "Medium", "Low"]} active={raLevel} onSelect={setRaLevel} color="#DC2626" />
                </div>
              </div>

              {filteredRA.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>
                  {raSearch || raStatus !== "All" || raLevel !== "All" ? "No assessments match your filter." : "No risk assessments found."}
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        {["Title", "Site", "Department", "Risk Level", "Assessor", "Created", "Last Reviewed", "Status"].map((h) => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#6B7280", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRA.map((a) => (
                        <tr key={a.id} style={{ borderTop: "1px solid #F3F4F6", background: a.risk_level === "critical" ? "#FFFBFB" : "transparent" }}>
                          <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827" }}>
                            {a.title}
                            {a.risk_level === "critical" && <span style={{ marginLeft: 7, fontSize: 10, background: "#FEF2F2", color: "#DC2626", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>CRITICAL</span>}
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#6B7280" }}><MapPin size={11} />{a.site_id || "—"}</span>
                          </td>
                          <td style={{ padding: "10px 14px", color: "#374151" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Building2 size={11} color="#9CA3AF" />{a.department || "—"}</span>
                          </td>
                          <td style={{ padding: "10px 14px" }}><RiskLevelBadge level={a.risk_level} /></td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#6B7280" }}><User size={11} />{a.assessor}</span>
                          </td>
                          <td style={{ padding: "10px 14px", color: "#374151", whiteSpace: "nowrap" }}>{fmt(a.created_at)}</td>
                          <td style={{ padding: "10px 14px", color: "#374151", whiteSpace: "nowrap" }}>{fmt(a.reviewed_at)}</td>
                          <td style={{ padding: "10px 14px" }}><StatusBadge status={a.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredRA.length < assessments.length && (
                    <p style={{ margin: "10px 0 0", fontSize: 12, color: "#9CA3AF", textAlign: "right" }}>
                      Showing {filteredRA.length} of {assessments.length}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── Section 2: Risk Levels ─────────────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={BarChart2} title="Risk Levels" color="#D97706" />

              <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6B7280" }}>
                Breakdown of risk levels across all assessments and registered hazards.
              </p>

              <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
                {/* Risk Assessments breakdown */}
                <div style={{ flex: "1 1 280px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <Activity size={15} color="#DC2626" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Risk Assessments</span>
                    <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: "auto" }}>{assessments.length} total</span>
                  </div>
                  {([
                    { label: "Critical", count: raLevelCounts.critical, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
                    { label: "High",     count: raLevelCounts.high,     color: "#F43F5E", bg: "#FFF1F2", border: "#FECDD3" },
                    { label: "Medium",   count: raLevelCounts.medium,   color: "#F97316", bg: "#FFF7ED", border: "#FED7AA" },
                    { label: "Low",      count: raLevelCounts.low,      color: "#22C55E", bg: "#F0FDF4", border: "#BBF7D0" },
                  ] as const).map((lvl) => (
                    <div key={lvl.label}>
                      <LevelBar label={lvl.label} count={lvl.count} total={assessments.length} color={lvl.color} bg={lvl.bg} border={lvl.border} />
                    </div>
                  ))}

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                    <TallyCard label="Critical" value={raLevelCounts.critical} bg="#FEF2F2" color="#7F1D1D" border="#FECACA" />
                    <TallyCard label="High"     value={raLevelCounts.high}     bg="#FFF1F2" color="#9F1239" border="#FECDD3" />
                    <TallyCard label="Medium"   value={raLevelCounts.medium}   bg="#FFF7ED" color="#C2410C" border="#FED7AA" />
                    <TallyCard label="Low"      value={raLevelCounts.low}      bg="#F0FDF4" color="#065F46" border="#BBF7D0" />
                  </div>
                </div>

                {/* Divider */}
                <div style={{ width: 1, background: "#F3F4F6", alignSelf: "stretch" }} />

                {/* Hazards breakdown */}
                <div style={{ flex: "1 1 280px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <ShieldAlert size={15} color="#EA580C" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Hazard Severity</span>
                    <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: "auto" }}>{hazards.length} total</span>
                  </div>
                  {([
                    { label: "Critical", count: hazLevelCounts.critical, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
                    { label: "High",     count: hazLevelCounts.high,     color: "#F43F5E", bg: "#FFF1F2", border: "#FECDD3" },
                    { label: "Medium",   count: hazLevelCounts.medium,   color: "#F97316", bg: "#FFF7ED", border: "#FED7AA" },
                    { label: "Low",      count: hazLevelCounts.low,      color: "#22C55E", bg: "#F0FDF4", border: "#BBF7D0" },
                  ] as const).map((lvl) => (
                    <div key={lvl.label}>
                      <LevelBar label={lvl.label} count={lvl.count} total={hazards.length} color={lvl.color} bg={lvl.bg} border={lvl.border} />
                    </div>
                  ))}

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                    <TallyCard label="Open"      value={openHazards.length}      bg="#FEE2E2" color="#991B1B" border="#FECACA" />
                    <TallyCard label="Mitigated" value={mitigatedHazards.length} bg="#D1FAE5" color="#065F46" border="#BBF7D0" />
                    <TallyCard label="Closed"    value={hazards.filter((h) => h.status === "closed").length} bg="#F3F4F6" color="#6B7280" border="#E5E7EB" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 3: Hazard Categories ──────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={Layers} title="Hazard Categories" count={hazardCategories.length} color="#7C3AED" />

              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>
                All registered hazards grouped by type, ordered by severity. Click a category to expand its hazards.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <TallyCard label="Total Hazards"   value={hazards.length}          bg="#EDE9FE" color="#4C1D95" border="#C4B5FD" />
                <TallyCard label="Open"            value={openHazards.length}      bg="#FEE2E2" color="#991B1B" border="#FECACA" />
                <TallyCard label="Mitigated"       value={mitigatedHazards.length} bg="#D1FAE5" color="#065F46" border="#BBF7D0" />
                <TallyCard label="Categories"      value={hazardCategories.length} bg="#F5F3FF" color="#6D28D9" border="#DDD6FE" />
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                  <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input value={hazSearch} onChange={(e) => setHazSearch(e.target.value)} placeholder="Search hazards by title, type, site…"
                    style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 34px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "#F9FAFB" }} />
                </div>
              </div>
              <FilterButtons
                options={["All", "Open", "Mitigated", "Closed", "Critical", "High"]}
                active={hazStatus} onSelect={setHazStatus} color="#7C3AED"
              />

              {filteredCategories.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>
                  {hazSearch || hazStatus !== "All" ? "No hazards match your filter." : "No hazards registered."}
                </div>
              ) : (
                <div>
                  {filteredCategories.map(([type, hs]) => (
                    <HazardCategoryGroup key={type} type={type} hazards={hs} />
                  ))}
                </div>
              )}
            </div>

            {/* ── Section 4: Mitigation Plans ───────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={TrendingDown} title="Mitigation Plans" count={withMitigation.length + rcaWithActions.length} color="#059669" />

              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>
                Active mitigation plans from hazard records and corrective/preventive actions from root cause analyses.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <TallyCard label="Hazard Plans"   value={withMitigation.length}  bg="#D1FAE5" color="#065F46" border="#BBF7D0" />
                <TallyCard label="RCA Actions"    value={rcaWithActions.length}  bg="#DBEAFE" color="#1E40AF" border="#BFDBFE" />
                <TallyCard label="Total Plans"    value={withMitigation.length + rcaWithActions.length} bg="#F0FDF4" color="#065F46" border="#BBF7D0" />
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                  <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input value={mitSearch} onChange={(e) => setMitSearch(e.target.value)} placeholder="Search mitigation plans…"
                    style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 34px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "#F9FAFB" }} />
                </div>
              </div>
              <FilterButtons options={["All", "Hazard", "RCA"]} active={mitFilter} onSelect={setMitFilter} color="#059669" />

              {filteredMit.hazMit.length === 0 && filteredMit.rcaMit.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>
                  {mitSearch || mitFilter !== "All" ? "No mitigation plans match your filter." : "No mitigation plans recorded."}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

                  {/* Hazard mitigation plans */}
                  {filteredMit.hazMit.length > 0 && (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                        <ShieldAlert size={12} /> Hazard Mitigation Plans ({filteredMit.hazMit.length})
                      </div>
                      {filteredMit.hazMit.map((h) => {
                        const ls = riskLevelStyle(h.severity);
                        return (
                          <div key={h.id} style={{
                            borderLeft: `4px solid ${ls.bar}`, background: ls.bg,
                            border: `1px solid ${ls.border}`, borderLeftWidth: 4,
                            borderRadius: "0 12px 12px 0", padding: "14px 16px",
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                              <div>
                                <div style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>{h.title}</div>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  <RiskLevelBadge level={h.severity} />
                                  <StatusBadge status={h.status} />
                                  {h.type && <span style={{ fontSize: 11, background: "#EFF6FF", color: "#1E40AF", borderRadius: 4, padding: "1px 7px" }}>{h.type}</span>}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: h.mitigation ? 10 : 0 }}>
                              {h.site_id && <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} />{h.site_id}</span>}
                              <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><User size={11} />{h.reported_by}</span>
                              <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><Calendar size={11} />{fmt(h.identified_at)}</span>
                            </div>
                            {h.mitigation && (
                              <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "10px 12px", marginTop: 8 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", textTransform: "uppercase", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
                                  <Wrench size={11} /> Mitigation Plan
                                </div>
                                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{h.mitigation}</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}

                  {/* RCA corrective / preventive actions */}
                  {filteredMit.rcaMit.length > 0 && (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: filteredMit.hazMit.length > 0 ? 10 : 0, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                        <Activity size={12} /> RCA Corrective & Preventive Actions ({filteredMit.rcaMit.length})
                      </div>
                      {filteredMit.rcaMit.map((r) => {
                        const ps = priorityStyle(r.Priority || "low");
                        return (
                          <div key={r.RCA_ID} style={{
                            borderLeft: "4px solid #1D4ED8", background: "#EFF6FF",
                            border: "1px solid #BFDBFE", borderLeftWidth: 4,
                            borderRadius: "0 12px 12px 0", padding: "14px 16px",
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                              <div>
                                <div style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>{r.Incident_Type || `RCA ${r.RCA_ID}`}</div>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  {r.Priority && (
                                    <span style={{ background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`, borderRadius: 6, padding: "2px 9px", fontSize: 12, fontWeight: 700 }}>
                                      {r.Priority} Priority
                                    </span>
                                  )}
                                  <StatusBadge status={r.Status || "open"} />
                                </div>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
                              <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} />{r.Site_ID}</span>
                              {r.Zone_ID && <span style={{ fontSize: 12, color: "#6B7280" }}>Zone: {r.Zone_ID}</span>}
                              <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><User size={11} />{r.Conducted_By}</span>
                              <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><Calendar size={11} />Completed: {fmt(r.Completion_Date)}</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {r.Root_Causes && (
                                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 12px" }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", textTransform: "uppercase", marginBottom: 4 }}>Root Causes</div>
                                  <div style={{ fontSize: 13, color: "#374151" }}>{r.Root_Causes}</div>
                                </div>
                              )}
                              {r.Corrective_Actions && (
                                <div style={{ background: "#DBEAFE", border: "1px solid #BFDBFE", borderRadius: 8, padding: "10px 12px" }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "#1D4ED8", textTransform: "uppercase", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
                                    <Wrench size={11} /> Corrective Actions
                                  </div>
                                  <div style={{ fontSize: 13, color: "#374151" }}>{r.Corrective_Actions}</div>
                                </div>
                              )}
                              {r.Preventive_Measures && (
                                <div style={{ background: "#D1FAE5", border: "1px solid #BBF7D0", borderRadius: 8, padding: "10px 12px" }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", textTransform: "uppercase", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
                                    <Shield size={11} /> Preventive Measures
                                  </div>
                                  <div style={{ fontSize: 13, color: "#374151" }}>{r.Preventive_Measures}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
