import { useState, useMemo } from "react";
import {
  Box, Search, Plus, X, MapPin, Tag, RefreshCw,
  CheckCircle2, Clock, AlertTriangle, ShieldAlert, Package,
} from "lucide-react";
import {
  useGetAssetsQuery,
  useCreateAssetMutation,
  type Asset,
  type CreateAssetInput,
} from "@/features/assets/api/assetsApi";

// ── Helpers ────────────────────────────────────────────────────────────────

function riskLevel(score: number | null): { label: string; color: string; bg: string } {
  if (score === null)  return { label: "Unknown", color: "#6B7280", bg: "#F3F4F6" };
  if (score >= 70)     return { label: "High",    color: "#DC2626", bg: "#FEE2E2" };
  if (score >= 40)     return { label: "Medium",  color: "#D97706", bg: "#FEF3C7" };
  return                      { label: "Low",     color: "#059669", bg: "#D1FAE5" };
}

function statusCfg(s: string): { color: string; bg: string; Icon: React.ElementType } {
  const map: Record<string, { color: string; bg: string; Icon: React.ElementType }> = {
    Active:         { color: "#059669", bg: "#D1FAE5", Icon: CheckCircle2  },
    Maintenance:    { color: "#D97706", bg: "#FEF3C7", Icon: Clock         },
    Retired:        { color: "#6B7280", bg: "#F3F4F6", Icon: Package       },
    Decommissioned: { color: "#DC2626", bg: "#FEE2E2", Icon: AlertTriangle },
  };
  return map[s] ?? map.Active;
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap"
      style={{ color, background: bg }}>
      {label}
    </span>
  );
}

// ── Add Asset Modal ────────────────────────────────────────────────────────

const CATEGORIES = ["Electrical", "Mechanical", "HVAC", "Civil", "Safety", "IT", "Vehicle", "Equipment", "Facility", "Other"];
const STATUSES   = ["Active", "Maintenance", "Retired", "Decommissioned"];

function AddAssetModal({ onClose }: { onClose: () => void }) {
  const [createAsset, { isLoading }] = useCreateAssetMutation();
  const [form, setForm] = useState<Record<string, string>>({
    asset_code: "", name: "", category: "Equipment", location: "",
    status: "Active", criticality: "medium", risk_score: "",
    manufacturer: "", serial_number: "", description: "",
  });
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.asset_code.trim()) { setError("Asset ID is required"); return; }
    if (!form.name.trim())       { setError("Asset name is required"); return; }
    try {
      const payload: CreateAssetInput = {
        asset_code:   form.asset_code.trim(),
        name:         form.name.trim(),
        category:     form.category,
        location:     form.location     || undefined,
        status:       form.status,
        criticality:  form.criticality  || undefined,
        risk_score:   form.risk_score   ? parseFloat(form.risk_score) : undefined,
        manufacturer: form.manufacturer || undefined,
        serial_number:form.serial_number|| undefined,
        description:  form.description  || undefined,
      };
      await createAsset(payload).unwrap();
      onClose();
    } catch {
      setError("Failed to add asset. Please try again.");
    }
  };

  const inp = "w-full px-3 py-2 rounded-xl border text-sm outline-none focus:border-blue-400 transition-colors";
  const inpStyle = { borderColor: "#E5E7EB", background: "#F9FAFB" };
  const lbl = "block text-[11px] font-semibold mb-1 text-gray-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E5E7EB" }}>
          <h2 className="text-[15px] font-bold text-gray-900">Add New Asset</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-50 text-red-600">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Asset ID *</label>
              <input className={inp} style={inpStyle} placeholder="e.g. AST-001"
                value={form.asset_code} onChange={(e) => set("asset_code", e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Asset Name *</label>
              <input className={inp} style={inpStyle} placeholder="e.g. Air Compressor Unit"
                value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Category</label>
              <select className={inp} style={inpStyle} value={form.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Status</label>
              <select className={inp} style={inpStyle} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={lbl}>Location</label>
            <input className={inp} style={inpStyle} placeholder="e.g. Building A, Level 2"
              value={form.location} onChange={(e) => set("location", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Risk Score (0–100)</label>
              <input className={inp} style={inpStyle} type="number" min="0" max="100" placeholder="e.g. 65"
                value={form.risk_score} onChange={(e) => set("risk_score", e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Criticality</label>
              <select className={inp} style={inpStyle} value={form.criticality} onChange={(e) => set("criticality", e.target.value)}>
                {["low", "medium", "high"].map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Manufacturer</label>
              <input className={inp} style={inpStyle} placeholder="Brand or make"
                value={form.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Serial Number</label>
              <input className={inp} style={inpStyle} placeholder="SN-XXXX"
                value={form.serial_number} onChange={(e) => set("serial_number", e.target.value)} />
            </div>
          </div>

          <div>
            <label className={lbl}>Description</label>
            <textarea className={inp} style={{ ...inpStyle, resize: "none" }} rows={2} placeholder="Optional notes…"
              value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "#E5E7EB" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isLoading}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60"
            style={{ background: "#1E3A5F" }}>
            {isLoading ? "Adding…" : "Add Asset"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Asset Row ──────────────────────────────────────────────────────────────

function AssetRow({ asset }: { asset: Asset }) {
  const sc  = statusCfg(asset.status);
  const rl  = riskLevel(asset.risk_score);
  const StatusIcon = sc.Icon;

  return (
    <tr className="border-b hover:bg-slate-50 transition-colors" style={{ borderColor: "#F1F5F9" }}>

      {/* Asset Name */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#EEF2FF" }}>
            <Box className="w-4 h-4" style={{ color: "#4A57B9" }} />
          </div>
          <div>
            <div className="text-[13px] font-bold" style={{ color: "#111827" }}>
              {asset.name || "—"}
            </div>
            {asset.manufacturer && (
              <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{asset.manufacturer}</div>
            )}
          </div>
        </div>
      </td>

      {/* Asset ID */}
      <td className="px-5 py-4">
        <span className="text-[12px] font-mono font-bold px-2.5 py-1 rounded-lg"
          style={{ background: "#F8FAFF", color: "#4A57B9", border: "1px solid #E0E7FF" }}>
          {asset.asset_code}
        </span>
      </td>

      {/* Location */}
      <td className="px-5 py-4">
        {asset.location ? (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#9CA3AF" }} />
            <span className="text-[12px]" style={{ color: "#374151" }}>{asset.location}</span>
          </div>
        ) : (
          <span className="text-[11px]" style={{ color: "#D1D5DB" }}>—</span>
        )}
      </td>

      {/* Asset Category */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#9CA3AF" }} />
          <span className="text-[12px] font-medium" style={{ color: "#374151" }}>{asset.category}</span>
        </div>
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: sc.bg }}>
            <StatusIcon className="w-3.5 h-3.5" style={{ color: sc.color }} />
          </div>
          <Badge label={asset.status} color={sc.color} bg={sc.bg} />
        </div>
      </td>

      {/* Risk Level */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <Badge label={rl.label} color={rl.color} bg={rl.bg} />
          {asset.risk_score !== null && (
            <span className="text-[11px] font-semibold" style={{ color: "#9CA3AF" }}>
              {asset.risk_score}
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

const STATUS_FILTERS = ["All", "Active", "Maintenance", "Retired", "Decommissioned"] as const;
const RISK_FILTERS   = ["All", "High", "Medium", "Low", "Unknown"] as const;

export function AssetRegisterPage() {
  const { data: assets = [], isLoading, refetch } = useGetAssetsQuery();
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("All");
  const [riskFilter, setRisk]       = useState("All");
  const [showModal, setShowModal]   = useState(false);

  const active      = assets.filter((a) => a.status === "Active").length;
  const maintenance = assets.filter((a) => a.status === "Maintenance").length;
  const highRisk    = assets.filter((a) => (a.risk_score ?? 0) >= 70).length;
  const retired     = assets.filter((a) => a.status === "Retired" || a.status === "Decommissioned").length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return assets.filter((a) => {
      const matchSearch =
        !q ||
        (a.name ?? "").toLowerCase().includes(q) ||
        a.asset_code.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        (a.location ?? "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "All" || a.status === statusFilter;
      const rl = riskLevel(a.risk_score).label;
      const matchRisk = riskFilter === "All" || rl === riskFilter;
      return matchSearch && matchStatus && matchRisk;
    });
  }, [assets, search, statusFilter, riskFilter]);

  return (
    <div className="min-h-screen bg-white">

      {/* ── Banner ───────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #0F172A 100%)" }}>
        <div className="px-8 pt-8 pb-0">
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-1"
            style={{ color: "rgba(255,255,255,0.4)" }}>
            Assets
          </p>
          <h1 className="text-[26px] font-black text-white">Asset Register</h1>
          <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Asset name · Asset ID · Location · Category · Status · Risk level
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex flex-wrap border-t mt-6" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          {[
            { label: "Total Assets",   value: assets.length, color: "#fff"    },
            { label: "Active",         value: active,        color: "#34D399" },
            { label: "Maintenance",    value: maintenance,   color: "#FBBF24" },
            { label: "High Risk",      value: highRisk,      color: "#F87171" },
            { label: "Retired / Decom",value: retired,       color: "#94A3B8" },
          ].map((s, i, arr) => (
            <div key={s.label}
              className="flex-1 min-w-[100px] flex flex-col items-center text-center px-4 py-4 gap-0.5"
              style={{ borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.1)" : undefined }}>
              <span className="text-[28px] font-black leading-none" style={{ color: s.color }}>{s.value}</span>
              <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 border-b"
        style={{ borderColor: "#F3F4F6" }}>
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 rounded-xl border text-sm outline-none focus:border-blue-400 transition-colors"
            style={{ borderColor: "#E5E7EB", background: "#F9FAFB" }}
            placeholder="Search name, ID, category, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button key={f} onClick={() => setStatus(f)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
              style={statusFilter === f
                ? { background: "#1E3A5F", color: "#fff" }
                : { background: "#F3F4F6", color: "#6B7280" }}>
              {f}
            </button>
          ))}
        </div>

        {/* Risk filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {RISK_FILTERS.map((f) => {
            const active = riskFilter === f;
            const col = f === "High" ? "#DC2626" : f === "Medium" ? "#D97706" : f === "Low" ? "#059669" : "#1E3A5F";
            return (
              <button key={f} onClick={() => setRisk(f)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
                style={active
                  ? { background: col, color: "#fff" }
                  : { background: "#F3F4F6", color: "#6B7280" }}>
                {f === "All" ? "All Risk" : f}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <button onClick={() => refetch()} className="p-2 rounded-xl border hover:bg-gray-50 transition-colors"
            style={{ borderColor: "#E5E7EB" }}>
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: "#1E3A5F" }}>
            <Plus className="w-4 h-4" />
            Add Asset
          </button>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-7 h-7 mx-auto mb-2 animate-spin text-blue-400" />
          <p className="text-sm text-gray-400">Loading assets…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p className="text-[13px] text-gray-400">
            {search || statusFilter !== "All" || riskFilter !== "All"
              ? "No assets match your filters."
              : "No assets registered yet."}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: "#F8FAFF" }}>
                <tr>
                  {["Asset Name", "Asset ID", "Location", "Category", "Status", "Risk Level"].map((h) => (
                    <th key={h}
                      className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: "#94A3B8" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => <AssetRow key={a.id} asset={a} />)}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t" style={{ borderColor: "#F1F5F9" }}>
            <p className="text-[12px] text-gray-400">
              Showing {filtered.length} of {assets.length} asset{assets.length !== 1 ? "s" : ""}
            </p>
          </div>
        </>
      )}

      {showModal && <AddAssetModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
