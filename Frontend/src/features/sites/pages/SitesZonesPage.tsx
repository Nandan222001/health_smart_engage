import { useState } from "react";
import { Plus, MapPin, Building2, X, Loader2 } from "lucide-react";
import {
  useGetOrgSetupStep3SitesQuery,
  useCreateOrgSetupSiteMutation,
  useBulkUploadOrgSetupSitesMutation,
} from "@/features/org-setup/api/orgSetupApi";

const SITE_TYPES = ["Site", "Plant", "Branch", "Warehouse", "Office", "Other"];

export function SitesZonesPage() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Site", address: "" });
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: sites = [], isLoading, refetch } = useGetOrgSetupStep3SitesQuery();
  const [createSite, { isLoading: creating }] = useCreateOrgSetupSiteMutation();
  const [bulkUpload, { isLoading: uploading }] = useBulkUploadOrgSetupSitesMutation();

  async function handleAdd() {
    if (!form.name.trim()) return;
    await createSite({ name: form.name.trim(), type: form.type, address: form.address.trim() });
    setForm({ name: "", type: "Site", address: "" });
    setShowModal(false);
  }

  async function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await bulkUpload(fd).unwrap();
    } catch {
      setUploadError("Upload failed — check the CSV format (Name, Type, Address columns).");
    }
    e.target.value = "";
  }

  const typeColor: Record<string, string> = {
    Plant: "#EF4444",
    Warehouse: "#F59E0B",
    Branch: "#10B981",
    Office: "#6366F1",
    Site: "#1D4ED8",
    Other: "#6B7280",
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Sites & Zones</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
            {isLoading ? "Loading…" : `${sites.length} site${sites.length !== 1 ? "s" : ""} registered`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* CSV upload */}
          <label className="flex items-center gap-2 px-4 py-2 rounded-lg border text-[13px] cursor-pointer transition-colors hover:bg-[#F3F7FF]"
            style={{ borderColor: "#DBE7FF", color: "#4A5568" }}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Upload CSV
            <input type="file" accept=".csv,.xlsx" className="hidden" onChange={handleCSV} disabled={uploading} />
          </label>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[13px]"
            style={{ background: "linear-gradient(135deg, #0B3D91, #1D4ED8)", fontWeight: 600 }}
          >
            <Plus className="w-4 h-4" /> Add Site
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
          {uploadError}
        </div>
      )}

      {/* Sites grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1D4ED8" }} />
        </div>
      ) : sites.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 rounded-2xl border-2 border-dashed"
          style={{ borderColor: "#DBE7FF", background: "#F8FAFF" }}>
          <Building2 className="w-12 h-12 mb-3" style={{ color: "#DBE7FF" }} />
          <p className="text-sm font-medium" style={{ color: "#6B7280" }}>No sites yet</p>
          <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
            Add a site manually or upload a CSV (Name, Type, Address)
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sites.map((site) => {
            const color = typeColor[site.type] ?? typeColor.Other;
            return (
              <div key={site.id} className="bg-white rounded-xl border p-5"
                style={{ borderColor: "#E6EEFF", boxShadow: "0px 2px 12px rgba(11, 61, 145, 0.08)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}18` }}>
                      <Building2 className="w-4 h-4" style={{ color }} />
                    </div>
                    <h3 className="text-[14px] font-semibold leading-tight" style={{ color: "#111827" }}>
                      {site.name || "—"}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0"
                    style={{ background: `${color}18`, color }}>
                    {site.type || "Site"}
                  </span>
                </div>
                {site.address && (
                  <div className="flex items-center gap-2 text-[13px]" style={{ color: "#4A5568" }}>
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#9CA3AF" }} />
                    <span className="truncate">{site.address}</span>
                  </div>
                )}
                <div className="mt-3 pt-3 flex items-center justify-between"
                  style={{ borderTop: "1px solid #F3F7FF" }}>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: "#ECFDF5", color: "#059669" }}>
                    Active
                  </span>
                </div>
              </div>
            );
          })}

          {/* Add site card */}
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
      )}

      {/* Add Site Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowModal(false)} />
          <div className="fixed top-1/2 left-1/2 z-50 w-[calc(100vw-1.5rem)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white"
            style={{ boxShadow: "0px 8px 32px rgba(0,0,0,0.16)" }}>
            <div className="h-[3px]" style={{ background: "linear-gradient(135deg, #0B3D91, #1D4ED8, #3B82F6)" }} />
            <div className="px-8 py-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold" style={{ color: "#111827" }}>Add New Site</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-[#F3F7FF]">
                  <X className="w-5 h-5" style={{ color: "#4A5568" }} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: "#374151" }}>
                    Site Name <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    className="w-full h-10 px-4 rounded-lg border text-[13px] outline-none focus:border-blue-400"
                    style={{ borderColor: "#DBE7FF" }}
                    placeholder="e.g. Head Office"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: "#374151" }}>Type</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg border text-[13px] bg-white"
                    style={{ borderColor: "#DBE7FF" }}
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  >
                    {SITE_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: "#374151" }}>Address</label>
                  <input
                    className="w-full h-10 px-4 rounded-lg border text-[13px] outline-none focus:border-blue-400"
                    style={{ borderColor: "#DBE7FF" }}
                    placeholder="e.g. 123 Corporate Blvd, Mumbai"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-[13px]"
                  style={{ color: "#4A5568", fontWeight: 500 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={creating || !form.name.trim()}
                  className="px-6 py-2 rounded-lg text-white text-[13px] disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #0B3D91, #1D4ED8)", fontWeight: 600 }}
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Site"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
