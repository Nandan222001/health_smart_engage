import { useState } from "react";
import { ClipboardCheck, Search, Plus } from "lucide-react";
import { useListAuditChecklistsQuery, useListCAPAsQuery } from "@/features/audits/api/auditsApi";
import type { CAPA } from "@/features/audits/api/auditsApi";

const CAPA_STATUS_COLOR: Record<string, string> = {
  open: "#EF4444",
  in_progress: "#F59E0B",
  pending_closure: "#8B5CF6",
  closed: "#10B981",
};

function CAPARow({ capa }: { capa: CAPA }) {
  const color = CAPA_STATUS_COLOR[capa.status] ?? "#9CA3AF";
  return (
    <tr className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
      <td className="px-5 py-3.5">
        <div className="text-sm font-semibold" style={{ color: "#111827" }}>{capa.title}</div>
        <div className="text-xs truncate max-w-[220px]" style={{ color: "#9CA3AF" }}>{capa.description}</div>
      </td>
      <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{capa.assignee}</td>
      <td className="px-5 py-3.5">
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ background: color + "1A", color }}>
          {capa.status.replace(/_/g, " ")}
        </span>
      </td>
      <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{new Date(capa.due_date).toLocaleDateString()}</td>
    </tr>
  );
}

export function AuditsPage() {
  const { data: checklists = [], isLoading: checklistsLoading } = useListAuditChecklistsQuery();
  const { data: capas = [], isLoading: capasLoading } = useListCAPAsQuery();
  const [tab, setTab] = useState<"checklists" | "capas">("checklists");
  const [search, setSearch] = useState("");

  const openCapas = capas.filter((c) => c.status !== "closed").length;
  const published = checklists.filter((c) => c.status === "published").length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Audits & CAPA</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Audit checklists, findings, and corrective actions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
          <Plus className="w-4 h-4" /> New Audit
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Published Checklists", value: published, color: "#4A57B9" },
          { label: "Open CAPAs", value: openCapas, color: "#EF4444" },
          { label: "Total Checklists", value: checklists.length, color: "#10B981" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E3E9F6" }}>
            <div className="text-2xl font-bold" style={{ color }}>{checklistsLoading || capasLoading ? "…" : value}</div>
            <div className="text-xs font-medium mt-0.5" style={{ color: "#6B7280" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(["checklists", "capas"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all" style={tab === t ? { background: "#fff", color: "#4A57B9", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" } : { color: "#6B7280" }}>
            {t === "capas" ? "CAPAs" : "Checklists"}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
        <input className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E3E9F6", background: "#F9FAFB" }} placeholder={`Search ${tab}…`} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        {tab === "checklists" ? (
          <table className="w-full text-sm">
            <thead><tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
              {["Checklist", "Category", "Status", "Items"].map((h) => <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {checklistsLoading ? <tr><td colSpan={4} className="text-center py-10 text-sm" style={{ color: "#9CA3AF" }}>Loading…</td></tr>
                : checklists.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())).map((c) => (
                  <tr key={c.id} className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-5 py-3.5"><div className="flex items-center gap-3"><ClipboardCheck className="w-4 h-4" style={{ color: "#4A57B9" }} /><span className="text-sm font-semibold" style={{ color: "#111827" }}>{c.name}</span></div></td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{c.category}</td>
                    <td className="px-5 py-3.5"><span className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ background: c.status === "published" ? "#D1FAE5" : "#F3F4F6", color: c.status === "published" ? "#10B981" : "#9CA3AF" }}>{c.status}</span></td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{c.items?.length ?? 0} items</td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead><tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
              {["CAPA Title", "Assignee", "Status", "Due Date"].map((h) => <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {capasLoading ? <tr><td colSpan={4} className="text-center py-10 text-sm" style={{ color: "#9CA3AF" }}>Loading…</td></tr>
                : capas.filter((c) => c.title.toLowerCase().includes(search.toLowerCase())).map((c) => <CAPARow key={c.id} capa={c} />)}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
