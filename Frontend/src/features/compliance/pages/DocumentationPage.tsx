import { useMemo, useState } from "react";
import {
  Search, CheckCircle2, Clock, AlertTriangle, XCircle,
  Calendar, User, Tag, FileText, BookOpen, FolderOpen,
  Upload, Shield, ScrollText, ClipboardList, Eye,
  FileCheck, Book, Archive, File,
} from "lucide-react";
import {
  useGetComplianceDocumentsQuery,
  type ComplianceDocument,
} from "@/features/compliance/api/complianceApi";

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function daysFrom(d: string | null | undefined): number {
  if (!d) return 9999;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
}

function docTypeGroup(doc: ComplianceDocument): "sop" | "manual" | "compliance" | "other" {
  const t = (doc.document_type || "").toLowerCase();
  if (t.includes("sop") || t.includes("procedure") || t.includes("standard operating"))
    return "sop";
  if (t.includes("manual") || t.includes("guide") || t.includes("handbook"))
    return "manual";
  if (
    t.includes("compliance") || t.includes("policy") ||
    t.includes("regulation") || t.includes("standard") ||
    t.includes("legal") || t.includes("regulatory")
  )
    return "compliance";
  return "other";
}

function statusStyle(status: string): { bg: string; color: string; dot: string; icon: React.ElementType } {
  const s = status.toLowerCase().replace(/_/g, " ");
  if (s === "active" || s === "published" || s === "approved")
    return { bg: "#D1FAE5", color: "#065F46", dot: "#16A34A", icon: CheckCircle2 };
  if (s === "draft" || s === "under review" || s === "in review" || s === "pending")
    return { bg: "#DBEAFE", color: "#1E40AF", dot: "#3B82F6", icon: Clock };
  if (s === "expired" || s === "retired" || s === "superseded")
    return { bg: "#FEE2E2", color: "#991B1B", dot: "#DC2626", icon: XCircle };
  if (s === "archived")
    return { bg: "#F3F4F6", color: "#6B7280", dot: "#9CA3AF", icon: Archive };
  return { bg: "#FEF3C7", color: "#92400E", dot: "#D97706", icon: AlertTriangle };
}

function docTypeIcon(type: string): React.ElementType {
  const t = type.toLowerCase();
  if (t.includes("sop") || t.includes("procedure"))   return ClipboardList;
  if (t.includes("manual") || t.includes("guide"))    return BookOpen;
  if (t.includes("policy") || t.includes("standard")) return Shield;
  if (t.includes("compliance") || t.includes("legal"))return FileCheck;
  return FileText;
}

function docTypeColor(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("sop") || t.includes("procedure"))    return "#0E7490";
  if (t.includes("manual") || t.includes("guide"))     return "#059669";
  if (t.includes("policy") || t.includes("standard"))  return "#1D4ED8";
  if (t.includes("compliance") || t.includes("legal")) return "#6D28D9";
  return "#374151";
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
      padding: "14px 18px", textAlign: "center", flex: "1 1 100px",
    }}>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color, fontWeight: 500, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = statusStyle(status);
  const Icon = s.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: s.bg, color: s.color,
      borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      <Icon size={11} />
      {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

function DocTypePill({ type }: { type: string }) {
  const color = docTypeColor(type);
  return (
    <span style={{
      fontSize: 11, background: color + "18", color, border: `1px solid ${color}33`,
      borderRadius: 5, padding: "2px 8px", fontWeight: 600, whiteSpace: "nowrap",
    }}>
      {type}
    </span>
  );
}

function SearchBar({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div style={{ position: "relative", marginBottom: 16 }}>
      <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
      <input
        value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 34px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "#F9FAFB" }}
      />
    </div>
  );
}

function FilterRow({ options, active, onFilter, color }: {
  options: string[]; active: string; onFilter: (v: string) => void; color: string;
}) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onFilter(o)}
          style={{
            padding: "5px 13px", borderRadius: 6, fontSize: 12, fontWeight: 600,
            cursor: "pointer", border: "none",
            background: active === o ? color : "#F3F4F6",
            color:      active === o ? "#fff" : "#374151",
          }}>
          {o}
        </button>
      ))}
    </div>
  );
}

// Card-style document row
function DocCard({ doc }: { doc: ComplianceDocument }) {
  const TypeIcon = docTypeIcon(doc.document_type || "");
  const typeColor = docTypeColor(doc.document_type || "");
  const expiresIn = daysFrom(doc.effective_date);
  const expiringSoon = expiresIn >= 0 && expiresIn <= 30;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 14,
      padding: "14px 16px", borderRadius: 10,
      background: "#FAFBFF", border: "1px solid #E8EEF8",
      transition: "box-shadow 0.15s",
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 8,
        background: typeColor + "18",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <TypeIcon size={18} color={typeColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
          <span style={{ fontWeight: 700, color: "#111827" }}>{doc.title}</span>
          {doc.version && (
            <span style={{ fontFamily: "monospace", background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 4, padding: "1px 6px", fontSize: 11 }}>
              v{doc.version}
            </span>
          )}
          {doc.document_type && <DocTypePill type={doc.document_type} />}
          {expiringSoon && (
            <span style={{ fontSize: 10, background: "#FEF3C7", color: "#D97706", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>
              EFFECTIVE SOON
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {doc.category && (
            <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
              <Tag size={11} />{doc.category}
            </span>
          )}
          {doc.created_by && (
            <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
              <User size={11} />{doc.created_by}
            </span>
          )}
          {doc.effective_date && (
            <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
              <Calendar size={11} />Effective: {fmt(doc.effective_date)}
            </span>
          )}
        </div>
        {doc.description && (
          <div style={{ marginTop: 5, fontSize: 12, color: "#6B7280", fontStyle: "italic", maxWidth: 480, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {doc.description}
          </div>
        )}
      </div>
      <StatusBadge status={doc.status} />
    </div>
  );
}

// Compact table row used in Uploaded Records
function RecordRow({ doc, index }: { doc: ComplianceDocument; index: number }) {
  const TypeIcon = docTypeIcon(doc.document_type || "");
  const typeColor = docTypeColor(doc.document_type || "");
  return (
    <tr style={{ borderTop: "1px solid #F3F4F6", background: index % 2 === 0 ? "transparent" : "#FAFBFF" }}>
      <td style={{ padding: "10px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TypeIcon size={14} color={typeColor} style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 600, color: "#111827" }}>{doc.title}</span>
        </div>
        {doc.description && (
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {doc.description}
          </div>
        )}
      </td>
      <td style={{ padding: "10px 14px" }}>
        {doc.document_type ? <DocTypePill type={doc.document_type} /> : <span style={{ color: "#9CA3AF" }}>—</span>}
      </td>
      <td style={{ padding: "10px 14px" }}>
        {doc.category
          ? <span style={{ fontSize: 12, background: "#EFF6FF", color: "#1E40AF", borderRadius: 5, padding: "2px 7px" }}>{doc.category}</span>
          : <span style={{ color: "#9CA3AF" }}>—</span>}
      </td>
      <td style={{ padding: "10px 14px" }}>
        {doc.version
          ? <span style={{ fontFamily: "monospace", background: "#F3F4F6", borderRadius: 4, padding: "2px 6px", fontSize: 11 }}>v{doc.version}</span>
          : <span style={{ color: "#9CA3AF" }}>—</span>}
      </td>
      <td style={{ padding: "10px 14px", whiteSpace: "nowrap", color: "#374151" }}>{fmt(doc.effective_date)}</td>
      <td style={{ padding: "10px 14px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#6B7280", fontSize: 12 }}><User size={11} />{doc.created_by || "—"}</span>
      </td>
      <td style={{ padding: "10px 14px" }}><StatusBadge status={doc.status} /></td>
    </tr>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export function DocumentationPage() {
  const { data: docs = [], isLoading } = useGetComplianceDocumentsQuery();

  const [sopSearch,    setSopSearch]    = useState("");
  const [sopStatus,    setSopStatus]    = useState("All");
  const [manSearch,    setManSearch]    = useState("");
  const [manStatus,    setManStatus]    = useState("All");
  const [compSearch,   setCompSearch]   = useState("");
  const [compStatus,   setCompStatus]   = useState("All");
  const [recSearch,    setRecSearch]    = useState("");
  const [recType,      setRecType]      = useState("All");
  const [recStatus,    setRecStatus]    = useState("All");

  // ── derive groups ─────────────────────────────────────────────────────────
  const sopDocs        = useMemo(() => docs.filter((d) => docTypeGroup(d) === "sop"),        [docs]);
  const manualDocs     = useMemo(() => docs.filter((d) => docTypeGroup(d) === "manual"),     [docs]);
  const complianceDocs = useMemo(() => docs.filter((d) => docTypeGroup(d) === "compliance"), [docs]);
  const otherDocs      = useMemo(() => docs.filter((d) => docTypeGroup(d) === "other"),      [docs]);

  // ── status tallies per group ──────────────────────────────────────────────
  function tally(arr: ComplianceDocument[]) {
    return {
      active:  arr.filter((d) => ["active","published","approved"].includes(d.status.toLowerCase())).length,
      draft:   arr.filter((d) => ["draft","under review","under_review","pending"].includes(d.status.toLowerCase().replace(/_/g," "))).length,
      expired: arr.filter((d) => ["expired","retired","superseded"].includes(d.status.toLowerCase())).length,
      archived:arr.filter((d) => d.status.toLowerCase() === "archived").length,
    };
  }
  const sopTally  = useMemo(() => tally(sopDocs),        [sopDocs]);
  const manTally  = useMemo(() => tally(manualDocs),     [manualDocs]);
  const compTally = useMemo(() => tally(complianceDocs), [complianceDocs]);

  // ── unique document types for records filter ──────────────────────────────
  const allTypes = useMemo(() => {
    const t = new Set(docs.map((d) => d.document_type).filter(Boolean));
    return ["All", ...Array.from(t)] as string[];
  }, [docs]);

  // ── global stats ─────────────────────────────────────────────────────────
  const totalActive   = useMemo(() => docs.filter((d) => ["active","published","approved"].includes(d.status.toLowerCase())).length, [docs]);
  const totalDraft    = useMemo(() => docs.filter((d) => ["draft","under review","pending"].includes(d.status.toLowerCase().replace(/_/g," "))).length, [docs]);
  const totalExpired  = useMemo(() => docs.filter((d) => ["expired","retired","superseded"].includes(d.status.toLowerCase())).length, [docs]);
  const effectiveSoon = useMemo(() => docs.filter((d) => { const df = daysFrom(d.effective_date); return df >= 0 && df <= 30; }).length, [docs]);

  // ── filtered lists ────────────────────────────────────────────────────────
  function filterDocs(arr: ComplianceDocument[], search: string, status: string) {
    const q = search.toLowerCase();
    return arr.filter((d) => {
      const mQ = !q || d.title.toLowerCase().includes(q)
        || (d.category || "").toLowerCase().includes(q)
        || (d.created_by || "").toLowerCase().includes(q)
        || (d.description || "").toLowerCase().includes(q);
      const mS = status === "All" || d.status.toLowerCase().replace(/_/g," ").includes(status.toLowerCase());
      return mQ && mS;
    });
  }

  const filteredSop      = useMemo(() => filterDocs(sopDocs,        sopSearch,  sopStatus),  [sopDocs,        sopSearch,  sopStatus]);
  const filteredManuals  = useMemo(() => filterDocs(manualDocs,     manSearch,  manStatus),  [manualDocs,     manSearch,  manStatus]);
  const filteredCompliance=useMemo(() => filterDocs(complianceDocs, compSearch, compStatus), [complianceDocs, compSearch, compStatus]);

  const filteredRecords  = useMemo(() => docs.filter((d) => {
    const q = recSearch.toLowerCase();
    const mQ = !q || d.title.toLowerCase().includes(q)
      || (d.document_type || "").toLowerCase().includes(q)
      || (d.category || "").toLowerCase().includes(q)
      || (d.created_by || "").toLowerCase().includes(q);
    const mT = recType   === "All" || d.document_type === recType;
    const mS = recStatus === "All" || d.status.toLowerCase().replace(/_/g," ").includes(recStatus.toLowerCase());
    return mQ && mT && mS;
  }), [docs, recSearch, recType, recStatus]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F3F7FF", paddingBottom: 40 }}>

      {/* Banner */}
      <div style={{
        background: "linear-gradient(135deg, #0A1628 0%, #1E3A5F 35%, #1A5276 65%, #1F618D 100%)",
        padding: "32px 32px 28px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{
            background: "rgba(255,255,255,0.15)", borderRadius: 10, width: 44, height: 44,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FolderOpen size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff" }}>Documentation</h1>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              SOPs · Manuals · Compliance Documents · Uploaded Records
            </p>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <HeroStat icon={FileText}    label="Total Documents"   value={docs.length}       sub={`${totalActive} active`}     iconBg="rgba(30,87,153,0.55)" />
          <HeroStat icon={ClipboardList} label="SOPs"            value={sopDocs.length}    sub={`${sopTally.active} active`} iconBg="rgba(14,116,144,0.55)" />
          <HeroStat icon={BookOpen}    label="Manuals"           value={manualDocs.length} sub={`${manTally.active} active`} iconBg="rgba(5,150,105,0.5)" />
          <HeroStat icon={Shield}      label="Compliance Docs"   value={complianceDocs.length} sub={`${compTally.active} active`} iconBg="rgba(109,40,217,0.5)" />
          <HeroStat icon={Clock}       label="Draft / Review"    value={totalDraft}        iconBg="rgba(29,78,216,0.5)" />
          <HeroStat icon={AlertTriangle} label="Expired"         value={totalExpired}      iconBg="rgba(185,28,28,0.55)" />
        </div>
      </div>

      <div style={{ padding: "28px 32px 0", display: "flex", flexDirection: "column", gap: 28 }}>
        {isLoading && (
          <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>Loading documentation…</div>
        )}

        {!isLoading && (
          <>
            {/* ── Section 1: SOPs ───────────────────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={ClipboardList} title="Standard Operating Procedures (SOPs)" count={sopDocs.length} color="#0E7490" />

              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>
                Step-by-step instructions for routine HSE operations and safety procedures.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <TallyCard label="Active"   value={sopTally.active}   bg="#D1FAE5" color="#065F46" border="#BBF7D0" />
                <TallyCard label="Draft"    value={sopTally.draft}    bg="#DBEAFE" color="#1E40AF" border="#BFDBFE" />
                <TallyCard label="Expired"  value={sopTally.expired}  bg="#FEE2E2" color="#991B1B" border="#FECACA" />
                <TallyCard label="Archived" value={sopTally.archived} bg="#F3F4F6" color="#6B7280" border="#E5E7EB" />
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                  <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input value={sopSearch} onChange={(e) => setSopSearch(e.target.value)} placeholder="Search SOPs by title, category, author…"
                    style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 34px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "#F9FAFB" }} />
                </div>
              </div>
              <FilterRow options={["All", "Active", "Draft", "Expired", "Archived"]} active={sopStatus} onFilter={setSopStatus} color="#0E7490" />

              {filteredSop.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>
                  {sopSearch || sopStatus !== "All" ? "No SOPs match your filter." : "No SOPs found."}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {filteredSop.map((d) => <DocCard key={d.id} doc={d} />)}
                </div>
              )}
              {filteredSop.length < sopDocs.length && (
                <p style={{ margin: "10px 0 0", fontSize: 12, color: "#9CA3AF", textAlign: "right" }}>
                  Showing {filteredSop.length} of {sopDocs.length}
                </p>
              )}
            </div>

            {/* ── Section 2: Manuals ────────────────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={BookOpen} title="Manuals" count={manualDocs.length} color="#059669" />

              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>
                Reference manuals, guides, and handbooks for equipment, operations, and safety systems.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <TallyCard label="Active"   value={manTally.active}   bg="#D1FAE5" color="#065F46" border="#BBF7D0" />
                <TallyCard label="Draft"    value={manTally.draft}    bg="#DBEAFE" color="#1E40AF" border="#BFDBFE" />
                <TallyCard label="Expired"  value={manTally.expired}  bg="#FEE2E2" color="#991B1B" border="#FECACA" />
                <TallyCard label="Archived" value={manTally.archived} bg="#F3F4F6" color="#6B7280" border="#E5E7EB" />
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                  <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input value={manSearch} onChange={(e) => setManSearch(e.target.value)} placeholder="Search manuals by title, category, author…"
                    style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 34px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "#F9FAFB" }} />
                </div>
              </div>
              <FilterRow options={["All", "Active", "Draft", "Expired", "Archived"]} active={manStatus} onFilter={setManStatus} color="#059669" />

              {filteredManuals.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>
                  {manSearch || manStatus !== "All" ? "No manuals match your filter." : "No manuals found."}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {filteredManuals.map((d) => <DocCard key={d.id} doc={d} />)}
                </div>
              )}
            </div>

            {/* ── Section 3: Compliance Documents ───────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={Shield} title="Compliance Documents" count={complianceDocs.length} color="#6D28D9" />

              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>
                Policies, regulatory compliance documents, legal filings, and standards supporting HSE obligations.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <TallyCard label="Active"   value={compTally.active}   bg="#D1FAE5" color="#065F46" border="#BBF7D0" />
                <TallyCard label="Draft"    value={compTally.draft}    bg="#EDE9FE" color="#4C1D95" border="#C4B5FD" />
                <TallyCard label="Expired"  value={compTally.expired}  bg="#FEE2E2" color="#991B1B" border="#FECACA" />
                <TallyCard label="Archived" value={compTally.archived} bg="#F3F4F6" color="#6B7280" border="#E5E7EB" />
              </div>

              {compTally.expired > 0 && (
                <div style={{
                  background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8,
                  padding: "10px 14px", marginBottom: 16,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <AlertTriangle size={14} color="#DC2626" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#991B1B" }}>
                    {compTally.expired} compliance document{compTally.expired > 1 ? "s" : ""} expired — renewal required
                  </span>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                  <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input value={compSearch} onChange={(e) => setCompSearch(e.target.value)} placeholder="Search compliance documents…"
                    style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 34px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "#F9FAFB" }} />
                </div>
              </div>
              <FilterRow options={["All", "Active", "Draft", "Expired", "Archived"]} active={compStatus} onFilter={setCompStatus} color="#6D28D9" />

              {filteredCompliance.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>
                  {compSearch || compStatus !== "All" ? "No compliance documents match your filter." : "No compliance documents found."}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {filteredCompliance.map((d) => <DocCard key={d.id} doc={d} />)}
                </div>
              )}
            </div>

            {/* ── Section 4: Uploaded Records ───────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={Upload} title="Uploaded Records" count={docs.length} color="#374151" />

              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>
                Master registry of all uploaded documentation across all types and categories.
              </p>

              {/* Breakdown by type */}
              {allTypes.length > 1 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                  {allTypes.slice(1).map((t) => {
                    const cnt = docs.filter((d) => d.document_type === t).length;
                    return (
                      <div key={t} style={{
                        background: docTypeColor(t) + "14",
                        border: `1px solid ${docTypeColor(t)}33`,
                        borderRadius: 8, padding: "6px 12px",
                        display: "flex", alignItems: "center", gap: 8,
                      }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: docTypeColor(t) }}>{cnt}</span>
                        <span style={{ fontSize: 12, color: docTypeColor(t), fontWeight: 600 }}>{t}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Search + type + status filters */}
              <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                  <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input value={recSearch} onChange={(e) => setRecSearch(e.target.value)} placeholder="Search all documents…"
                    style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 34px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "#F9FAFB" }} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "#9CA3AF", padding: "6px 4px", alignSelf: "center" }}>Type:</span>
                {allTypes.slice(0, 7).map((t) => (
                  <button key={t} type="button" onClick={() => setRecType(t)}
                    style={{
                      padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none",
                      background: recType === t ? "#374151" : "#F3F4F6",
                      color:      recType === t ? "#fff"    : "#374151",
                    }}>
                    {t}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: "#9CA3AF", padding: "6px 4px", alignSelf: "center" }}>Status:</span>
                {["All", "Active", "Draft", "Expired", "Archived"].map((s) => (
                  <button key={s} type="button" onClick={() => setRecStatus(s)}
                    style={{
                      padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none",
                      background: recStatus === s ? "#374151" : "#F3F4F6",
                      color:      recStatus === s ? "#fff"    : "#374151",
                    }}>
                    {s}
                  </button>
                ))}
              </div>

              {filteredRecords.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>
                  {recSearch || recType !== "All" || recStatus !== "All" ? "No records match your filter." : "No documents uploaded yet."}
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        {["Title", "Type", "Category", "Version", "Effective Date", "Created By", "Status"].map((h) => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#6B7280", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.slice(0, 50).map((d, i) => (
                        <RecordRow key={d.id} doc={d} index={i} />
                      ))}
                    </tbody>
                  </table>
                  {filteredRecords.length > 50 && (
                    <p style={{ margin: "10px 0 0", fontSize: 12, color: "#9CA3AF", textAlign: "right" }}>
                      Showing 50 of {filteredRecords.length} records
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
