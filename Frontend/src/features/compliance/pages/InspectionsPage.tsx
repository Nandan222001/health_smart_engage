import { useMemo, useState } from "react";
import {
  Search, CheckCircle2, XCircle, Clock, AlertTriangle,
  Calendar, User, Tag, MapPin, Camera, Shield,
  ClipboardList, FileSearch, AlertOctagon, Building2,
  Wrench, Eye,
} from "lucide-react";
import {
  useGetInspectionsQuery,
  type InspectionRecord,
} from "@/features/compliance/api/complianceApi";
import {
  useGetAllInspectionsQuery,
  type AssetInspectionRecord,
} from "@/features/assets/api/assetsApi";
import { useGetViolationsQuery } from "@/features/violations/api/violationsApi";
import type { Violation } from "@/services/api";

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function daysDiff(dateStr: string | null | undefined): number {
  if (!dateStr) return 9999;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function inspStatusStyle(status: string): { bg: string; color: string; dot: string } {
  const s = status.toLowerCase().replace(/_/g, " ");
  if (s === "completed")                     return { bg: "#D1FAE5", color: "#065F46", dot: "#16A34A" };
  if (s === "in progress" || s === "in_progress") return { bg: "#DBEAFE", color: "#1E40AF", dot: "#3B82F6" };
  if (s === "scheduled" || s === "planned")  return { bg: "#E0F2FE", color: "#0369A1", dot: "#0EA5E9" };
  if (s === "overdue")                       return { bg: "#FEE2E2", color: "#991B1B", dot: "#DC2626" };
  return { bg: "#F3F4F6", color: "#374151", dot: "#9CA3AF" };
}

function resultStyle(result: string): { bg: string; color: string; icon: React.ElementType } {
  const r = result.toLowerCase();
  if (r === "pass" || r === "passed") return { bg: "#D1FAE5", color: "#065F46", icon: CheckCircle2 };
  if (r === "fail" || r === "failed") return { bg: "#FEE2E2", color: "#991B1B", icon: XCircle };
  return { bg: "#FEF3C7", color: "#92400E", icon: AlertTriangle };
}

function severityStyle(sev: string): { bg: string; color: string; border: string } {
  const s = sev.toLowerCase();
  if (s === "critical") return { bg: "#FEF2F2", color: "#7F1D1D", border: "#FECACA" };
  if (s === "high")     return { bg: "#FFF1F2", color: "#9F1239", border: "#FECDD3" };
  if (s === "medium")   return { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" };
  return                       { bg: "#FFFBEB", color: "#92400E", border: "#FDE68A" };
}

function StatusBadge({ status }: { status: string }) {
  const s = inspStatusStyle(status);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: s.bg, color: s.color,
      borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {status.replace(/_/g, " ")}
    </span>
  );
}

function ResultBadge({ result }: { result: string }) {
  const s = resultStyle(result);
  const Icon = s.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: s.bg, color: s.color,
      borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 700,
    }}>
      <Icon size={11} />{result}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const s = severityStyle(severity);
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 6, padding: "2px 9px", fontSize: 12, fontWeight: 700,
    }}>
      {severity}
    </span>
  );
}

function HeroStat({ icon: Icon, label, value, sub, iconBg }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; iconBg: string;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.10)", borderRadius: 12, padding: "18px 22px",
      display: "flex", alignItems: "center", gap: 14, flex: "1 1 150px", minWidth: 130,
    }}>
      <div style={{
        background: iconBg, borderRadius: 10, width: 42, height: 42,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
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
      <div style={{
        background: color, borderRadius: 8, width: 34, height: 34,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={17} color="#fff" />
      </div>
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>{title}</h2>
      {count !== undefined && (
        <span style={{
          marginLeft: "auto", background: "#F3F4F6", color: "#374151",
          borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600,
        }}>{count}</span>
      )}
    </div>
  );
}

function TallyCard({ label, value, bg, color, border }: {
  label: string; value: number; bg: string; color: string; border: string;
}) {
  return (
    <div style={{
      background: bg, border: `1px solid ${border}`, borderRadius: 10,
      padding: "14px 16px", textAlign: "center", flex: "1 1 110px",
    }}>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color, fontWeight: 500, marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export function InspectionsPage() {
  const { data: siteInspections    = [], isLoading: l1 } = useGetInspectionsQuery();
  const { data: equipInspections   = [], isLoading: l2 } = useGetAllInspectionsQuery();
  const { data: violations         = [], isLoading: l3 } = useGetViolationsQuery();

  const [siteSearch,    setSiteSearch]    = useState("");
  const [siteStatus,    setSiteStatus]    = useState("All");
  const [equipSearch,   setEquipSearch]   = useState("");
  const [equipResult,   setEquipResult]   = useState("All");
  const [reportSearch,  setReportSearch]  = useState("");
  const [violSearch,    setViolSearch]    = useState("");
  const [violSeverity,  setViolSeverity]  = useState("All");

  const loading = l1 || l2 || l3;

  // ── site inspection derived ────────────────────────────────────────────────
  const siteCompleted  = useMemo(() => siteInspections.filter((i) => i.status.toLowerCase() === "completed"), [siteInspections]);
  const siteScheduled  = useMemo(() => siteInspections.filter((i) => ["scheduled","planned"].includes(i.status.toLowerCase())), [siteInspections]);
  const siteInProgress = useMemo(() => siteInspections.filter((i) => ["in_progress","in progress"].includes(i.status.toLowerCase())), [siteInspections]);
  const siteOverdue    = useMemo(() => siteInspections.filter((i) => {
    const notDone = !["completed"].includes(i.status.toLowerCase());
    return notDone && i.scheduled_date && daysDiff(i.scheduled_date) < 0;
  }), [siteInspections]);

  // ── equipment inspection derived ──────────────────────────────────────────
  const equipPassed  = useMemo(() => equipInspections.filter((i) => ["pass","passed"].includes(i.result.toLowerCase())), [equipInspections]);
  const equipFailed  = useMemo(() => equipInspections.filter((i) => ["fail","failed"].includes(i.result.toLowerCase())), [equipInspections]);
  const equipOther   = useMemo(() => equipInspections.filter((i) => !["pass","passed","fail","failed"].includes(i.result.toLowerCase())), [equipInspections]);

  const equipPassRate = equipInspections.length > 0 ? Math.round((equipPassed.length / equipInspections.length) * 100) : 0;

  // ── violation derived ─────────────────────────────────────────────────────
  const openViolations   = useMemo(() => violations.filter((v) => !["resolved","closed"].includes((v.Status||"").toLowerCase())), [violations]);
  const criticalViol     = useMemo(() => violations.filter((v) => v.Severity === "Critical"), [violations]);

  // ── filtered lists ────────────────────────────────────────────────────────
  const filteredSite = useMemo(() => siteInspections.filter((i) => {
    const q = siteSearch.toLowerCase();
    const matchQ = !q || (i.title||"").toLowerCase().includes(q) || (i.audit_type||"").toLowerCase().includes(q) || (i.site_id||"").toLowerCase().includes(q);
    const matchS = siteStatus === "All" || i.status.toLowerCase().replace(/_/g," ") === siteStatus.toLowerCase();
    return matchQ && matchS;
  }), [siteInspections, siteSearch, siteStatus]);

  const filteredEquip = useMemo(() => equipInspections.filter((i) => {
    const q = equipSearch.toLowerCase();
    const matchQ = !q || i.asset_name.toLowerCase().includes(q) || i.asset_code.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
    const matchR = equipResult === "All" ||
      (equipResult === "Pass" && ["pass","passed"].includes(i.result.toLowerCase())) ||
      (equipResult === "Fail" && ["fail","failed"].includes(i.result.toLowerCase())) ||
      (equipResult === "Other" && !["pass","passed","fail","failed"].includes(i.result.toLowerCase()));
    return matchQ && matchR;
  }), [equipInspections, equipSearch, equipResult]);

  // Combined report list
  const allReports = useMemo(() => {
    const siteRows = siteInspections.map((i) => ({
      id: `site-${i.id}`,
      kind: "Site" as const,
      title: i.title || "Site Inspection",
      type: i.audit_type || "General",
      date: i.completed_date || i.scheduled_date,
      inspector: i.auditor_user_id,
      result: i.status,
      note: i.checklist_name,
      site: i.site_id,
    }));
    const equipRows = equipInspections.map((i) => ({
      id: `equip-${i.id}`,
      kind: "Equipment" as const,
      title: i.asset_name,
      type: i.inspection_type,
      date: i.inspected_on,
      inspector: i.inspector_user_id,
      result: i.result,
      note: i.notes,
      site: i.asset_code,
    }));
    return [...siteRows, ...equipRows]
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .filter((r) => {
        const q = reportSearch.toLowerCase();
        return !q || r.title.toLowerCase().includes(q) || r.type.toLowerCase().includes(q) || (r.inspector||"").toLowerCase().includes(q);
      });
  }, [siteInspections, equipInspections, reportSearch]);

  const filteredViol = useMemo(() => violations.filter((v) => {
    const q = violSearch.toLowerCase();
    const matchQ = !q || v.Violation_Type.toLowerCase().includes(q) || v.Site_ID.toLowerCase().includes(q) || v.Zone_ID.toLowerCase().includes(q) || (v.Worker_ID||"").toLowerCase().includes(q);
    const matchS = violSeverity === "All" || v.Severity === violSeverity;
    return matchQ && matchS;
  }), [violations, violSearch, violSeverity]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F3F7FF", paddingBottom: 40 }}>

      {/* Banner */}
      <div style={{
        background: "linear-gradient(135deg, #0B2040 0%, #134E74 35%, #0E7490 65%, #0891B2 100%)",
        padding: "32px 32px 28px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{
            background: "rgba(255,255,255,0.15)", borderRadius: 10, width: 44, height: 44,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Eye size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff" }}>Inspections</h1>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              Site · Equipment · Reports · Violations
            </p>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <HeroStat icon={Building2}    label="Site Inspections"    value={siteInspections.length}   sub={`${siteCompleted.length} completed`}  iconBg="rgba(14,116,144,0.55)" />
          <HeroStat icon={Wrench}       label="Equipment Inspected" value={equipInspections.length}  sub={`${equipPassRate}% pass rate`}         iconBg="rgba(5,150,105,0.5)" />
          <HeroStat icon={XCircle}      label="Equipment Failures"  value={equipFailed.length}       iconBg="rgba(220,38,38,0.5)" />
          <HeroStat icon={ClipboardList}label="Total Reports"       value={siteInspections.length + equipInspections.length} iconBg="rgba(124,45,212,0.5)" />
          <HeroStat icon={AlertTriangle}label="Violations"          value={violations.length}        sub={`${openViolations.length} open`}       iconBg="rgba(217,119,6,0.5)" />
          <HeroStat icon={AlertOctagon} label="Site Overdue"        value={siteOverdue.length}       iconBg="rgba(153,27,27,0.5)" />
        </div>
      </div>

      <div style={{ padding: "28px 32px 0", display: "flex", flexDirection: "column", gap: 28 }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>Loading inspection data…</div>
        )}

        {!loading && (
          <>
            {/* ── Section 1: Site Inspections ───────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={Building2} title="Site Inspections" count={siteInspections.length} color="#0E7490" />

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <TallyCard label="Completed"   value={siteCompleted.length}  bg="#D1FAE5" color="#065F46" border="#BBF7D0" />
                <TallyCard label="In Progress" value={siteInProgress.length} bg="#DBEAFE" color="#1E40AF" border="#BFDBFE" />
                <TallyCard label="Scheduled"   value={siteScheduled.length}  bg="#E0F2FE" color="#0369A1" border="#BAE6FD" />
                <TallyCard label="Overdue"     value={siteOverdue.length}    bg="#FEE2E2" color="#991B1B" border="#FECACA" />
              </div>

              {/* Search + status filter */}
              <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                  <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input value={siteSearch} onChange={(e) => setSiteSearch(e.target.value)} placeholder="Search site inspections…"
                    style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 34px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "#F9FAFB" }} />
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["All", "Scheduled", "In Progress", "Completed"].map((s) => (
                    <button key={s} type="button" onClick={() => setSiteStatus(s)}
                      style={{ padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none",
                        background: siteStatus === s ? "#0E7490" : "#F3F4F6",
                        color:      siteStatus === s ? "#fff"    : "#374151" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {filteredSite.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>
                  {siteSearch || siteStatus !== "All" ? "No site inspections match your filter." : "No site inspections found."}
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        {["Title", "Type", "Checklist", "Site", "Auditor", "Scheduled", "Completed", "Status"].map((h) => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#6B7280", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSite.map((insp) => {
                        const od = !["completed"].includes(insp.status.toLowerCase()) && insp.scheduled_date && daysDiff(insp.scheduled_date) < 0;
                        return (
                          <tr key={insp.id} style={{ borderTop: "1px solid #F3F4F6", background: od ? "#FFF5F5" : "transparent" }}>
                            <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827" }}>
                              {insp.title || "Inspection"}
                              {od && <span style={{ marginLeft: 6, fontSize: 10, color: "#DC2626", fontWeight: 700 }}>OVERDUE</span>}
                            </td>
                            <td style={{ padding: "10px 14px", color: "#374151" }}>{insp.audit_type || "—"}</td>
                            <td style={{ padding: "10px 14px", color: "#6B7280" }}>{insp.checklist_name || "—"}</td>
                            <td style={{ padding: "10px 14px", color: "#374151" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <MapPin size={11} color="#9CA3AF" />{insp.site_id || "—"}
                              </span>
                            </td>
                            <td style={{ padding: "10px 14px", color: "#6B7280" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><User size={11} />{insp.auditor_user_id}</span>
                            </td>
                            <td style={{ padding: "10px 14px", color: "#374151", whiteSpace: "nowrap" }}>{fmt(insp.scheduled_date)}</td>
                            <td style={{ padding: "10px 14px", color: "#374151", whiteSpace: "nowrap" }}>{fmt(insp.completed_date)}</td>
                            <td style={{ padding: "10px 14px" }}><StatusBadge status={insp.status} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredSite.length < siteInspections.length && (
                    <p style={{ margin: "10px 0 0", fontSize: 12, color: "#9CA3AF", textAlign: "right" }}>
                      Showing {filteredSite.length} of {siteInspections.length} inspections
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── Section 2: Equipment Inspections ──────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={Wrench} title="Equipment Inspections" count={equipInspections.length} color="#059669" />

              {/* Pass/fail tally + progress bar */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                <TallyCard label="Passed"      value={equipPassed.length}  bg="#D1FAE5" color="#065F46" border="#BBF7D0" />
                <TallyCard label="Failed"      value={equipFailed.length}  bg="#FEE2E2" color="#991B1B" border="#FECACA" />
                <TallyCard label="Conditional" value={equipOther.length}   bg="#FEF3C7" color="#92400E" border="#FDE68A" />
                <TallyCard label="Pass Rate"   value={equipPassRate}       bg="#EFF6FF" color="#1E40AF" border="#BFDBFE" />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ height: 8, background: "#F3F4F6", borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ width: `${equipPassRate}%`, height: "100%", background: "#16A34A", borderRadius: 5 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{equipPassed.length} passed</span>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{equipInspections.length} total</span>
                </div>
              </div>

              {/* Search + result filter */}
              <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                  <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input value={equipSearch} onChange={(e) => setEquipSearch(e.target.value)} placeholder="Search by asset name, code, category…"
                    style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 34px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "#F9FAFB" }} />
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["All", "Pass", "Fail", "Other"].map((r) => (
                    <button key={r} type="button" onClick={() => setEquipResult(r)}
                      style={{ padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none",
                        background: equipResult === r ? "#059669" : "#F3F4F6",
                        color:      equipResult === r ? "#fff"    : "#374151" }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {filteredEquip.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>
                  {equipSearch || equipResult !== "All" ? "No equipment inspections match your filter." : "No equipment inspections found."}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {filteredEquip.map((insp) => {
                    const rs = resultStyle(insp.result);
                    const Icon = rs.icon;
                    return (
                      <div key={insp.id} style={{
                        borderLeft: `4px solid ${rs.color}`,
                        background: rs.bg, borderRadius: "0 10px 10px 0",
                        padding: "12px 16px", display: "flex", alignItems: "center", gap: 14,
                      }}>
                        <Icon size={18} color={rs.color} style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, color: "#111827" }}>{insp.asset_name}</span>
                            <span style={{ fontFamily: "monospace", background: "#fff", border: "1px solid #E5E7EB", borderRadius: 4, padding: "1px 6px", fontSize: 11 }}>
                              {insp.asset_code}
                            </span>
                            <span style={{ fontSize: 12, color: "#6B7280", background: "#F3F4F6", borderRadius: 4, padding: "1px 7px" }}>
                              {insp.category}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><Tag size={11} />{insp.inspection_type}</span>
                            <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><Calendar size={11} />{fmt(insp.inspected_on)}</span>
                            <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><User size={11} />{insp.inspector_user_id}</span>
                            {insp.notes && <span style={{ fontSize: 12, color: "#6B7280", fontStyle: "italic" }}>{insp.notes.slice(0, 60)}{insp.notes.length > 60 ? "…" : ""}</span>}
                          </div>
                        </div>
                        <ResultBadge result={insp.result} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Section 3: Inspection Reports ─────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={FileSearch} title="Inspection Reports" count={allReports.length} color="#7C3AED" />

              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>
                Combined view of all site and equipment inspection records, sorted by most recent.
              </p>

              <div style={{ position: "relative", marginBottom: 16 }}>
                <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input value={reportSearch} onChange={(e) => setReportSearch(e.target.value)} placeholder="Search all inspection reports…"
                  style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 34px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "#F9FAFB" }} />
              </div>

              {allReports.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>No inspection reports found.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        {["Type", "Title / Asset", "Inspection Type", "Date", "Inspector", "Site / Code", "Result / Status"].map((h) => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#6B7280", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allReports.slice(0, 30).map((r) => (
                        <tr key={r.id} style={{ borderTop: "1px solid #F3F4F6" }}>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{
                              fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "2px 8px",
                              background: r.kind === "Site" ? "#E0F2FE" : "#D1FAE5",
                              color: r.kind === "Site" ? "#0369A1" : "#065F46",
                            }}>
                              {r.kind === "Site" ? <Building2 size={10} style={{ verticalAlign: "middle", marginRight: 3 }} /> : <Wrench size={10} style={{ verticalAlign: "middle", marginRight: 3 }} />}
                              {r.kind}
                            </span>
                          </td>
                          <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827" }}>{r.title}</td>
                          <td style={{ padding: "10px 14px", color: "#374151" }}>{r.type}</td>
                          <td style={{ padding: "10px 14px", color: "#374151", whiteSpace: "nowrap" }}>{fmt(r.date)}</td>
                          <td style={{ padding: "10px 14px", color: "#6B7280" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><User size={11} />{r.inspector}</span>
                          </td>
                          <td style={{ padding: "10px 14px", color: "#6B7280" }}>
                            {r.site ? <span style={{ fontFamily: r.kind === "Equipment" ? "monospace" : undefined, fontSize: r.kind === "Equipment" ? 11 : 13 }}>{r.site}</span> : "—"}
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            {r.kind === "Equipment"
                              ? <ResultBadge result={r.result} />
                              : <StatusBadge status={r.result} />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {allReports.length > 30 && (
                    <p style={{ margin: "10px 0 0", fontSize: 12, color: "#9CA3AF", textAlign: "right" }}>
                      Showing 30 of {allReports.length} reports
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── Section 4: Violations ─────────────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={AlertTriangle} title="Violations" count={violations.length} color="#DC2626" />

              {/* Tally */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <TallyCard label="Critical" value={violations.filter((v) => v.Severity === "Critical").length} bg="#FEF2F2" color="#7F1D1D" border="#FECACA" />
                <TallyCard label="High"     value={violations.filter((v) => v.Severity === "High").length}     bg="#FFF1F2" color="#9F1239" border="#FECDD3" />
                <TallyCard label="Medium"   value={violations.filter((v) => v.Severity === "Medium").length}   bg="#FFF7ED" color="#C2410C" border="#FED7AA" />
                <TallyCard label="Low"      value={violations.filter((v) => v.Severity === "Low").length}      bg="#FFFBEB" color="#92400E" border="#FDE68A" />
                <TallyCard label="Open"     value={openViolations.length}                                       bg="#FEE2E2" color="#991B1B" border="#FECACA" />
              </div>

              {/* Alert for critical */}
              {criticalViol.length > 0 && (
                <div style={{
                  background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8,
                  padding: "10px 14px", marginBottom: 16,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <AlertOctagon size={14} color="#DC2626" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#991B1B" }}>
                    {criticalViol.length} critical violation{criticalViol.length > 1 ? "s" : ""} require immediate attention
                  </span>
                </div>
              )}

              {/* Search + severity filter */}
              <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                  <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input value={violSearch} onChange={(e) => setViolSearch(e.target.value)} placeholder="Search violations by type, site, zone, worker…"
                    style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 34px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "#F9FAFB" }} />
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["All", "Critical", "High", "Medium", "Low"].map((sev) => (
                    <button key={sev} type="button" onClick={() => setViolSeverity(sev)}
                      style={{ padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none",
                        background: violSeverity === sev ? "#DC2626" : "#F3F4F6",
                        color:      violSeverity === sev ? "#fff"    : "#374151" }}>
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              {filteredViol.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: 32, background: "#F0FDF4",
                  borderRadius: 10, border: "1px solid #BBF7D0",
                }}>
                  <CheckCircle2 size={32} color="#16A34A" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#15803D" }}>
                    {violSearch || violSeverity !== "All" ? "No violations match your filter." : "No violations recorded."}
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        {["Violation Type", "Site", "Zone", "Severity", "Worker", "Shift", "Detected At", "Status", "Assigned To"].map((h) => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#6B7280", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredViol.slice(0, 30).map((v) => {
                        const isOpen = !["resolved","closed"].includes((v.Status||"").toLowerCase());
                        const sev = severityStyle(v.Severity);
                        return (
                          <tr key={v.Violation_ID} style={{ borderTop: "1px solid #F3F4F6", background: v.Severity === "Critical" && isOpen ? "#FFF9F9" : "transparent" }}>
                            <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827" }}>
                              {v.Violation_Type}
                              {v.PPE_Missing && <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>PPE: {v.PPE_Missing}</div>}
                            </td>
                            <td style={{ padding: "10px 14px", color: "#374151" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} color="#9CA3AF" />{v.Site_ID}</span>
                            </td>
                            <td style={{ padding: "10px 14px", color: "#374151" }}>{v.Zone_ID}</td>
                            <td style={{ padding: "10px 14px" }}><SeverityBadge severity={v.Severity} /></td>
                            <td style={{ padding: "10px 14px", color: "#6B7280" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><User size={11} />{v.Worker_ID || "—"}</span>
                            </td>
                            <td style={{ padding: "10px 14px", color: "#374151" }}>{v.Shift}</td>
                            <td style={{ padding: "10px 14px", color: "#374151", whiteSpace: "nowrap" }}>{fmtTime(v.Detected_At)}</td>
                            <td style={{ padding: "10px 14px" }}>
                              <span style={{
                                background: isOpen ? "#FEE2E2" : "#D1FAE5",
                                color: isOpen ? "#991B1B" : "#065F46",
                                borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600,
                              }}>
                                {v.Status || "Open"}
                              </span>
                            </td>
                            <td style={{ padding: "10px 14px", color: "#6B7280" }}>{v.Assigned_To || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredViol.length > 30 && (
                    <p style={{ margin: "10px 0 0", fontSize: 12, color: "#9CA3AF", textAlign: "right" }}>
                      Showing 30 of {filteredViol.length} violations
                    </p>
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
