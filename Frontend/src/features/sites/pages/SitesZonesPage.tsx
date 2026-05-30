import { useState } from "react";
import { Plus, MapPin, Building2, Layers, X, Loader2, Trash2 } from "lucide-react";
import {
  useListSitesQuery,
  useCreateSiteMutation,
  useDeleteSiteMutation,
  useListZonesQuery,
  useCreateZoneMutation,
  useDeleteZoneMutation,
} from "@/features/sites/api/sitesApi";

const SITE_TYPES = ["Site", "Plant", "Branch", "Warehouse", "Office", "Other"];
const ZONE_TYPES = ["Production", "Storage", "Office", "Maintenance", "Loading", "Other"];

const TYPE_COLOR: Record<string, string> = {
  Plant: "#EF4444", Warehouse: "#F59E0B", Branch: "#10B981",
  Office: "#6366F1", Site: "#1D4ED8", Other: "#6B7280",
};

type ActiveTab = "sites" | "zones";

export function SitesZonesPage() {
  const [tab, setTab] = useState<ActiveTab>("sites");
  const [showModal, setShowModal] = useState(false);
  const [siteForm, setSiteForm] = useState({ name: "", type: "Site", address: "" });
  const [zoneForm, setZoneForm] = useState({ name: "", type: "Production", site_id: "", description: "" });

  const { data: sites = [], isLoading: loadingSites } = useListSitesQuery();
  const { data: zones = [], isLoading: loadingZones } = useListZonesQuery();
  const [createSite, { isLoading: creatingSite }] = useCreateSiteMutation();
  const [deleteSite] = useDeleteSiteMutation();
  const [createZone, { isLoading: creatingZone }] = useCreateZoneMutation();
  const [deleteZone] = useDeleteZoneMutation();

  async function handleAddSite() {
    if (!siteForm.name.trim()) return;
    await createSite({ name: siteForm.name.trim(), type: siteForm.type, address: siteForm.address.trim() });
    setSiteForm({ name: "", type: "Site", address: "" });
    setShowModal(false);
  }

  async function handleAddZone() {
    if (!zoneForm.name.trim()) return;
    await createZone({ name: zoneForm.name.trim(), type: zoneForm.type, site_id: zoneForm.site_id, description: zoneForm.description.trim() });
    setZoneForm({ name: "", type: "Production", site_id: "", description: "" });
    setShowModal(false);
  }

  const isSites = tab === "sites";

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Sites & Zones</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
            {loadingSites || loadingZones ? "Loading…" : `${sites.length} sites · ${zones.length} zones`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[13px]"
          style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)", fontWeight: 600 }}
        >
          <Plus className="w-4 h-4" /> Add {isSites ? "Site" : "Zone"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["sites", "zones"] as ActiveTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize"
            style={tab === t
              ? { background: "#4A57B9", color: "#fff" }
              : { background: "#F3F4F6", color: "#6B7280" }}
          >
            {t === "sites" ? <><Building2 className="w-3.5 h-3.5 inline mr-1.5" />Sites ({sites.length})</> : <><Layers className="w-3.5 h-3.5 inline mr-1.5" />Zones ({zones.length})</>}
          </button>
        ))}
      </div>

      {/* Sites Grid */}
      {tab === "sites" && (
        loadingSites ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#4A57B9" }} />
          </div>
        ) : sites.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 rounded-2xl border-2 border-dashed" style={{ borderColor: "#DBE7FF", background: "#F8FAFF" }}>
            <Building2 className="w-12 h-12 mb-3" style={{ color: "#DBE7FF" }} />
            <p className="text-sm font-medium" style={{ color: "#6B7280" }}>No sites yet</p>
            <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Add your first site to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sites.map((site) => {
              const color = TYPE_COLOR[site.type] ?? TYPE_COLOR.Other;
              return (
                <div key={site.id} className="bg-white rounded-xl border p-5 group" style={{ borderColor: "#E6EEFF", boxShadow: "0 2px 12px rgba(11,61,145,0.08)" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                        <Building2 className="w-4 h-4" style={{ color }} />
                      </div>
                      <h3 className="text-[14px] font-semibold" style={{ color: "#111827" }}>{site.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: `${color}18`, color }}>{site.type}</span>
                      <button
                        onClick={() => deleteSite(site.id)}
                        className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                        title="Delete site"
                      >
                        <Trash2 className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />
                      </button>
                    </div>
                  </div>
                  {site.address && (
                    <div className="flex items-center gap-2 text-[13px]" style={{ color: "#4A5568" }}>
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#9CA3AF" }} />
                      <span className="truncate">{site.address}</span>
                    </div>
                  )}
                  <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid #F3F7FF" }}>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#ECFDF5", color: "#059669" }}>Active</span>
                    <span className="text-[11px]" style={{ color: "#9CA3AF" }}>
                      {zones.filter((z) => z.site_id === site.id).length} zone{zones.filter((z) => z.site_id === site.id).length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              );
            })}
            <button
              onClick={() => setShowModal(true)}
              className="rounded-xl border-2 border-dashed p-5 flex flex-col items-center justify-center gap-3 transition-colors hover:bg-[#F3F7FF]"
              style={{ borderColor: "#DBE7FF" }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#EFF6FF" }}>
                <Plus className="w-6 h-6" style={{ color: "#1D4ED8" }} />
              </div>
              <span className="text-[13px]" style={{ color: "#1D4ED8", fontWeight: 500 }}>Add Site</span>
            </button>
          </div>
        )
      )}

      {/* Zones List */}
      {tab === "zones" && (
        loadingZones ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#4A57B9" }} />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                  {["Zone Name", "Type", "Site", "Description", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zones.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <Layers className="w-8 h-8 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
                      <p className="text-sm" style={{ color: "#6B7280" }}>No zones yet. Add your first zone.</p>
                    </td>
                  </tr>
                ) : zones.map((zone) => {
                  const site = sites.find((s) => s.id === zone.site_id);
                  return (
                    <tr key={zone.id} className="border-t hover:bg-gray-50 group" style={{ borderColor: "#E3E9F6" }}>
                      <td className="px-5 py-3.5 font-semibold" style={{ color: "#111827" }}>{zone.name}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "#EEF2FF", color: "#4A57B9" }}>{zone.type || "—"}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{site?.name || zone.site_id || "—"}</td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{zone.description || "—"}</td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => deleteZone(zone.id)}
                          className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                          title="Delete zone"
                        >
                          <Trash2 className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowModal(false)} />
          <div className="fixed top-1/2 left-1/2 z-50 w-[calc(100vw-1.5rem)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.16)" }}>
            <div className="h-[3px]" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }} />
            <div className="px-8 py-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold" style={{ color: "#111827" }}>Add {isSites ? "Site" : "Zone"}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" style={{ color: "#4A5568" }} />
                </button>
              </div>

              {isSites ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium mb-1.5" style={{ color: "#374151" }}>Site Name *</label>
                    <input className="w-full h-10 px-4 rounded-lg border text-[13px] outline-none" style={{ borderColor: "#DBE7FF" }} placeholder="e.g. Main Factory" value={siteForm.name} onChange={(e) => setSiteForm((f) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium mb-1.5" style={{ color: "#374151" }}>Type</label>
                    <select className="w-full h-10 px-3 rounded-lg border text-[13px] bg-white" style={{ borderColor: "#DBE7FF" }} value={siteForm.type} onChange={(e) => setSiteForm((f) => ({ ...f, type: e.target.value }))}>
                      {SITE_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium mb-1.5" style={{ color: "#374151" }}>Address</label>
                    <input className="w-full h-10 px-4 rounded-lg border text-[13px] outline-none" style={{ borderColor: "#DBE7FF" }} placeholder="e.g. 123 Corporate Blvd" value={siteForm.address} onChange={(e) => setSiteForm((f) => ({ ...f, address: e.target.value }))} />
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-[13px]" style={{ color: "#4A5568" }}>Cancel</button>
                    <button onClick={handleAddSite} disabled={creatingSite || !siteForm.name.trim()} className="px-6 py-2 rounded-lg text-white text-[13px] disabled:opacity-50" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)", fontWeight: 600 }}>
                      {creatingSite ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Site"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium mb-1.5" style={{ color: "#374151" }}>Zone Name *</label>
                    <input className="w-full h-10 px-4 rounded-lg border text-[13px] outline-none" style={{ borderColor: "#DBE7FF" }} placeholder="e.g. Zone A - North" value={zoneForm.name} onChange={(e) => setZoneForm((f) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium mb-1.5" style={{ color: "#374151" }}>Type</label>
                    <select className="w-full h-10 px-3 rounded-lg border text-[13px] bg-white" style={{ borderColor: "#DBE7FF" }} value={zoneForm.type} onChange={(e) => setZoneForm((f) => ({ ...f, type: e.target.value }))}>
                      {ZONE_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium mb-1.5" style={{ color: "#374151" }}>Site</label>
                    <select className="w-full h-10 px-3 rounded-lg border text-[13px] bg-white" style={{ borderColor: "#DBE7FF" }} value={zoneForm.site_id} onChange={(e) => setZoneForm((f) => ({ ...f, site_id: e.target.value }))}>
                      <option value="">— Select site (optional) —</option>
                      {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium mb-1.5" style={{ color: "#374151" }}>Description</label>
                    <input className="w-full h-10 px-4 rounded-lg border text-[13px] outline-none" style={{ borderColor: "#DBE7FF" }} placeholder="Optional description" value={zoneForm.description} onChange={(e) => setZoneForm((f) => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-[13px]" style={{ color: "#4A5568" }}>Cancel</button>
                    <button onClick={handleAddZone} disabled={creatingZone || !zoneForm.name.trim()} className="px-6 py-2 rounded-lg text-white text-[13px] disabled:opacity-50" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)", fontWeight: 600 }}>
                      {creatingZone ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Zone"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
