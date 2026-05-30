import { useState } from "react";
import {
  Box, Wrench, ClipboardList, Search, Plus, X, ChevronDown, ChevronRight,
  AlertTriangle, CheckCircle2, Clock, Activity, BarChart3, Shield,
  Package, Settings, Calendar, MapPin, RefreshCw, FileText, Zap,
} from "lucide-react";
import {
  useGetAssetsQuery,
  useCreateAssetMutation,
  useGetAssetCategoriesQuery,
  useGetMaintenanceLogsQuery,
  useCreateMaintenanceLogMutation,
  useGetAllInspectionsQuery,
  useCreateInspectionMutation,
  useGetAssetRiskMappingQuery,
  type Asset,
  type AssetRiskItem,
} from "@/features/assets/api/assetsApi";

// ── Types ──────────────────────────────────────────────────────────────────

type TabId = "register" | "categories" | "maintenance" | "inspections" | "risk";

// ── Helpers ────────────────────────────────────────────────────────────────

function riskColor(level: string) {
  if (level === "High")   return { color: "#EF4444", bg: "#FEE2E2" };
  if (level === "Medium") return { color: "#F59E0B", bg: "#FEF3C7" };
  return                         { color: "#10B981", bg: "#D1FAE5" };
}

function criticalityColor(c: string) {
  if (c === "high")   return { color: "#EF4444", bg: "#FEE2E2" };
  if (c === "medium") return { color: "#F59E0B", bg: "#FEF3C7" };
  return                     { color: "#10B981", bg: "#D1FAE5" };
}

function statusColor(s: string) {
  const map: Record<string, { color: string; bg: string }> = {
    Active:          { color: "#10B981", bg: "#D1FAE5" },
    Maintenance:     { color: "#F59E0B", bg: "#FEF3C7" },
    Retired:         { color: "#6B7280", bg: "#F3F4F6" },
    Decommissioned:  { color: "#EF4444", bg: "#FEE2E2" },
  };
  return map[s] ?? map.Active;
}

function resultColor(r: string) {
  if (r === "pass" || r === "Pass")   return { color: "#10B981", bg: "#D1FAE5" };
  if (r === "fail" || r === "Fail")   return { color: "#EF4444", bg: "#FEE2E2" };
  return                                     { color: "#F59E0B", bg: "#FEF3C7" };
}

function complianceColor(s: string) {
  if (s === "compliant")     return { color: "#10B981", bg: "#D1FAE5" };
  if (s === "non_compliant") return { color: "#EF4444", bg: "#FEE2E2" };
  return                            { color: "#F59E0B", bg: "#FEF3C7" };
}

// ── Shared UI ──────────────────────────────────────────────────────────────

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ color, background: bg }}>
      {label}
    </span>
  );
}

function ProgressBar({ value, color = "#4A57B9" }: { value: number; color?: string }) {
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
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

function LoadingSpinner() {
  return (
    <div className="py-14 text-center">
      <RefreshCw className="w-7 h-7 mx-auto animate-spin" style={{ color: "#CBD5E1" }} />
    </div>
  );
}

// ── Create Asset Modal ─────────────────────────────────────────────────────

function CreateAssetModal({ onClose }: { onClose: () => void }) {
  const [createAsset, { isLoading }] = useCreateAssetMutation();
  const [form, setForm] = useState({
    asset_code: "", name: "", description: "", category: "Mechanical",
    location: "", criticality: "medium", manufacturer: "", serial_number: "",
    status: "Active", risk_score: "", purchase_date: "",
    last_maintenance_date: "", next_maintenance_date: "",
  });
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.asset_code.trim()) { setError("Asset code is required"); return; }
    if (!form.category.trim())   { setError("Category is required"); return; }
    try {
      await createAsset({
        asset_code: form.asset_code.trim(),
        name: form.name || undefined,
        description: form.description || undefined,
        category: form.category,
        location: form.location || undefined,
        criticality: form.criticality,
        manufacturer: form.manufacturer || undefined,
        serial_number: form.serial_number || undefined,
        status: form.status,
        risk_score: form.risk_score ? parseFloat(form.risk_score) : undefined,
        purchase_date: form.purchase_date || undefined,
        last_maintenance_date: form.last_maintenance_date || undefined,
        next_maintenance_date: form.next_maintenance_date || undefined,
      }).unwrap();
      onClose();
    } catch {
      setError("Failed to create asset. Please try again.");
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-xl border text-sm outline-none focus:border-blue-400 transition-colors";
  const inputStyle = { borderColor: "#E3E9F6", background: "#F9FAFB" };
  const labelCls = "block text-[11px] font-semibold mb-1";
  const labelStyle = { color: "#6B7280" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[16px] font-bold" style={{ color: "#111827" }}>Register Asset</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" style={{ color: "#6B7280" }} />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {error && <p className="text-[13px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={labelStyle}>Asset Code *</label>
              <input className={inputCls} style={inputStyle} value={form.asset_code} onChange={(e) => set("asset_code", e.target.value)} placeholder="AST-001" />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Display Name</label>
              <input className={inputCls} style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Pump A12" />
            </div>
            <div className="col-span-2">
              <label className={labelCls} style={labelStyle}>Description</label>
              <input className={inputCls} style={inputStyle} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Brief description..." />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Category *</label>
              <select className={inputCls} style={inputStyle} value={form.category} onChange={(e) => set("category", e.target.value)}>
                {["Mechanical", "Electrical", "Instrumentation", "Safety", "Civil", "Vehicles", "IT Equipment", "Other"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Location</label>
              <input className={inputCls} style={inputStyle} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Site A - Block 3" />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Criticality</label>
              <select className={inputCls} style={inputStyle} value={form.criticality} onChange={(e) => set("criticality", e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Status</label>
              <select className={inputCls} style={inputStyle} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {["Active", "Maintenance", "Retired", "Decommissioned"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Manufacturer</label>
              <input className={inputCls} style={inputStyle} value={form.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Serial Number</label>
              <input className={inputCls} style={inputStyle} value={form.serial_number} onChange={(e) => set("serial_number", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Risk Score (0–100)</label>
              <input type="number" min={0} max={100} className={inputCls} style={inputStyle} value={form.risk_score} onChange={(e) => set("risk_score", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Purchase Date</label>
              <input type="date" className={inputCls} style={inputStyle} value={form.purchase_date} onChange={(e) => set("purchase_date", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Last Maintenance</label>
              <input type="date" className={inputCls} style={inputStyle} value={form.last_maintenance_date} onChange={(e) => set("last_maintenance_date", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Next Maintenance</label>
              <input type="date" className={inputCls} style={inputStyle} value={form.next_maintenance_date} onChange={(e) => set("next_maintenance_date", e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "#E3E9F6" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-semibold hover:bg-slate-50 transition-colors" style={{ color: "#6B7280" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={isLoading} className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white transition-colors disabled:opacity-50" style={{ background: "#4A57B9" }}>
            {isLoading ? "Registering..." : "Register Asset"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Maintenance Log Modal ──────────────────────────────────────────────

function AddMaintenanceLogModal({ assets, onClose }: { assets: Asset[]; onClose: () => void }) {
  const [createLog, { isLoading }] = useCreateMaintenanceLogMutation();
  const [form, setForm] = useState({
    asset_id: assets[0]?.id || "",
    work_type: "Preventive", description: "", performed_by: "",
    performed_on: new Date().toISOString().slice(0, 10),
    cost: "", status: "completed", notes: "",
  });
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.asset_id) { setError("Please select an asset"); return; }
    if (!form.work_type.trim()) { setError("Work type is required"); return; }
    try {
      await createLog({
        assetId: form.asset_id,
        data: {
          work_type: form.work_type,
          description: form.description || undefined,
          performed_by: form.performed_by || undefined,
          performed_on: form.performed_on || undefined,
          cost: form.cost ? parseFloat(form.cost) : undefined,
          status: form.status,
          notes: form.notes || undefined,
        },
      }).unwrap();
      onClose();
    } catch {
      setError("Failed to add maintenance log.");
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-xl border text-sm outline-none focus:border-blue-400 transition-colors";
  const inputStyle = { borderColor: "#E3E9F6", background: "#F9FAFB" };
  const labelCls = "block text-[11px] font-semibold mb-1";
  const labelStyle = { color: "#6B7280" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[16px] font-bold" style={{ color: "#111827" }}>Log Maintenance</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" style={{ color: "#6B7280" }} /></button>
        </div>
        <div className="px-6 py-4 space-y-3">
          {error && <p className="text-[13px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls} style={labelStyle}>Asset *</label>
              <select className={inputCls} style={inputStyle} value={form.asset_id} onChange={(e) => set("asset_id", e.target.value)}>
                {assets.map((a) => <option key={a.id} value={a.id}>{a.name || a.asset_code}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Work Type</label>
              <select className={inputCls} style={inputStyle} value={form.work_type} onChange={(e) => set("work_type", e.target.value)}>
                {["Preventive", "Corrective", "Predictive", "Emergency", "Overhaul", "Calibration"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Status</label>
              <select className={inputCls} style={inputStyle} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {["completed", "in_progress", "scheduled"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls} style={labelStyle}>Description</label>
              <input className={inputCls} style={inputStyle} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Performed By</label>
              <input className={inputCls} style={inputStyle} value={form.performed_by} onChange={(e) => set("performed_by", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Performed On</label>
              <input type="date" className={inputCls} style={inputStyle} value={form.performed_on} onChange={(e) => set("performed_on", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Cost ($)</label>
              <input type="number" className={inputCls} style={inputStyle} value={form.cost} onChange={(e) => set("cost", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Notes</label>
              <input className={inputCls} style={inputStyle} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "#E3E9F6" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-semibold hover:bg-slate-50" style={{ color: "#6B7280" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={isLoading} className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: "#4A57B9" }}>
            {isLoading ? "Saving..." : "Save Log"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Inspection Modal ───────────────────────────────────────────────────

function AddInspectionModal({ assets, onClose }: { assets: Asset[]; onClose: () => void }) {
  const [createInspection, { isLoading }] = useCreateInspectionMutation();
  const [form, setForm] = useState({
    asset_id: assets[0]?.id || "",
    inspection_type: "Safety Check", inspected_on: new Date().toISOString().slice(0, 10),
    result: "pass", notes: "",
  });
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.asset_id) { setError("Please select an asset"); return; }
    try {
      await createInspection({
        assetId: form.asset_id,
        data: {
          inspection_type: form.inspection_type,
          inspected_on: form.inspected_on,
          result: form.result,
          notes: form.notes || undefined,
        },
      }).unwrap();
      onClose();
    } catch {
      setError("Failed to record inspection.");
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-xl border text-sm outline-none focus:border-blue-400 transition-colors";
  const inputStyle = { borderColor: "#E3E9F6", background: "#F9FAFB" };
  const labelCls = "block text-[11px] font-semibold mb-1";
  const labelStyle = { color: "#6B7280" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[16px] font-bold" style={{ color: "#111827" }}>Record Inspection</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" style={{ color: "#6B7280" }} /></button>
        </div>
        <div className="px-6 py-4 space-y-3">
          {error && <p className="text-[13px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls} style={labelStyle}>Asset *</label>
              <select className={inputCls} style={inputStyle} value={form.asset_id} onChange={(e) => set("asset_id", e.target.value)}>
                {assets.map((a) => <option key={a.id} value={a.id}>{a.name || a.asset_code}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Inspection Type</label>
              <select className={inputCls} style={inputStyle} value={form.inspection_type} onChange={(e) => set("inspection_type", e.target.value)}>
                {["Safety Check", "Compliance Audit", "Preventive", "Routine", "Emergency", "Calibration"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Date</label>
              <input type="date" className={inputCls} style={inputStyle} value={form.inspected_on} onChange={(e) => set("inspected_on", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Result</label>
              <select className={inputCls} style={inputStyle} value={form.result} onChange={(e) => set("result", e.target.value)}>
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
                <option value="conditional">Conditional</option>
              </select>
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Notes</label>
              <input className={inputCls} style={inputStyle} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "#E3E9F6" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-semibold hover:bg-slate-50" style={{ color: "#6B7280" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={isLoading} className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: "#4A57B9" }}>
            {isLoading ? "Saving..." : "Record"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab 1: Asset Register ──────────────────────────────────────────────────

function AssetRegisterTab() {
  const { data: assets = [], isLoading } = useGetAssetsQuery();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = assets.filter((a) => {
    const q = search.toLowerCase();
    return (a.asset_code + (a.name || "") + a.category + (a.location || "")).toLowerCase().includes(q);
  });

  const total = assets.length;
  const active = assets.filter((a) => (a.status || "").toLowerCase() === "active").length;
  const maintenance = assets.filter((a) => (a.status || "").toLowerCase() === "maintenance").length;
  const highRisk = assets.filter((a) => (a.risk_score || 0) >= 70 || (a.criticality || "").toLowerCase() === "high").length;

  return (
    <div className="space-y-6">
      {showCreate && <CreateAssetModal onClose={() => setShowCreate(false)} />}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={Box} label="Total Assets" value={total} sub="registered" color="#4A57B9" bg="#EEF0FB" />
        <KpiCard icon={CheckCircle2} label="Active" value={active} sub="operational" color="#10B981" bg="#D1FAE5" />
        <KpiCard icon={Wrench} label="In Maintenance" value={maintenance} sub="under service" color="#F59E0B" bg="#FEF3C7" />
        <KpiCard icon={AlertTriangle} label="High Risk" value={highRisk} sub="needs attention" color="#EF4444" bg="#FEE2E2" />
      </div>

      <div className="bg-white rounded-2xl border" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>Asset Register</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search assets..."
                className="pl-9 pr-3 py-2 rounded-xl border text-[13px] outline-none w-52"
                style={{ borderColor: "#E3E9F6", background: "#F8FAFF" }}
              />
            </div>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-colors" style={{ background: "#4A57B9" }}>
              <Plus className="w-3.5 h-3.5" /> Register Asset
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? <LoadingSpinner /> : filtered.length === 0 ? (
            <EmptyState icon={Box} text={search ? "No assets match your search" : "No assets registered yet. Click Register Asset to add one."} />
          ) : (
            <table className="w-full">
              <TableHead cols={["Asset Code", "Name", "Category", "Location", "Criticality", "Status", "Risk Score", "Compliance"]} />
              <tbody>
                {filtered.map((a) => {
                  const crit = criticalityColor(a.criticality || "medium");
                  const stat = statusColor(a.status || "Active");
                  const comp = complianceColor(a.compliance_status || "compliant");
                  const risk = a.risk_score ?? 0;
                  const rl = risk >= 70 ? riskColor("High") : risk >= 40 ? riskColor("Medium") : riskColor("Low");
                  return (
                    <tr key={a.id} className="border-t hover:bg-slate-50 transition-colors" style={{ borderColor: "#E3E9F6" }}>
                      <td className="px-5 py-3 text-[13px] font-bold" style={{ color: "#4A57B9" }}>{a.asset_code}</td>
                      <td className="px-5 py-3 text-[13px]" style={{ color: "#111827" }}>{a.name || "—"}</td>
                      <td className="px-5 py-3 text-[13px]" style={{ color: "#374151" }}>{a.category}</td>
                      <td className="px-5 py-3 text-[13px]" style={{ color: "#6B7280" }}>{a.location || "—"}</td>
                      <td className="px-5 py-3"><Badge label={a.criticality || "medium"} color={crit.color} bg={crit.bg} /></td>
                      <td className="px-5 py-3"><Badge label={a.status || "Active"} color={stat.color} bg={stat.bg} /></td>
                      <td className="px-5 py-3">
                        <span className="text-[13px] font-bold" style={{ color: rl.color }}>{risk.toFixed(0)}</span>
                      </td>
                      <td className="px-5 py-3"><Badge label={(a.compliance_status || "compliant").replace("_", " ")} color={comp.color} bg={comp.bg} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab 2: Asset Categories ────────────────────────────────────────────────

function AssetCategoriesTab() {
  const { data: categories = [], isLoading } = useGetAssetCategoriesQuery();
  const { data: assets = [] } = useGetAssetsQuery();
  const [expanded, setExpanded] = useState<string | null>(null);

  const assetsByCategory = (cat: string) => assets.filter((a) => a.category === cat);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={Package} label="Total Categories" value={categories.length} color="#4A57B9" bg="#EEF0FB" />
        <KpiCard icon={Activity} label="Total Assets" value={assets.length} color="#10B981" bg="#D1FAE5" />
        <KpiCard icon={AlertTriangle} label="High Criticality" value={categories.reduce((s, c) => s + c.high_criticality, 0)} color="#EF4444" bg="#FEE2E2" />
        <KpiCard icon={Wrench} label="In Maintenance" value={categories.reduce((s, c) => s + c.maintenance, 0)} color="#F59E0B" bg="#FEF3C7" />
      </div>

      <div className="bg-white rounded-2xl border" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>Asset Categories</h2>
        </div>
        {isLoading ? <LoadingSpinner /> : categories.length === 0 ? (
          <EmptyState icon={Package} text="No asset categories found. Register assets to see categories." />
        ) : (
          <div className="divide-y" style={{ borderColor: "#E3E9F6" }}>
            {categories.map((cat) => {
              const isOpen = expanded === cat.category;
              const pct = cat.total > 0 ? Math.round((cat.active / cat.total) * 100) : 0;
              const catAssets = assetsByCategory(cat.category);
              return (
                <div key={cat.category}>
                  <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors" onClick={() => setExpanded(isOpen ? null : cat.category)}>
                    <div className="flex items-center gap-4">
                      {isOpen ? <ChevronDown className="w-4 h-4" style={{ color: "#94A3B8" }} /> : <ChevronRight className="w-4 h-4" style={{ color: "#94A3B8" }} />}
                      <div className="text-left">
                        <div className="text-[14px] font-bold" style={{ color: "#111827" }}>{cat.category}</div>
                        <div className="text-[12px]" style={{ color: "#6B7280" }}>{cat.total} assets total</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-[12px]" style={{ color: "#6B7280" }}>Active rate</div>
                        <div className="w-32"><ProgressBar value={pct} color="#10B981" /></div>
                        <div className="text-[11px]" style={{ color: "#10B981" }}>{pct}%</div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge label={`${cat.active} Active`} color="#10B981" bg="#D1FAE5" />
                        {cat.maintenance > 0 && <Badge label={`${cat.maintenance} Maint.`} color="#F59E0B" bg="#FEF3C7" />}
                        {cat.high_criticality > 0 && <Badge label={`${cat.high_criticality} High`} color="#EF4444" bg="#FEE2E2" />}
                      </div>
                    </div>
                  </button>
                  {isOpen && catAssets.length > 0 && (
                    <div className="px-5 pb-4 border-t" style={{ borderColor: "#F1F5F9" }}>
                      <table className="w-full mt-2">
                        <TableHead cols={["Code", "Name", "Location", "Criticality", "Status"]} />
                        <tbody>
                          {catAssets.map((a) => {
                            const crit = criticalityColor(a.criticality || "medium");
                            const stat = statusColor(a.status || "Active");
                            return (
                              <tr key={a.id} className="border-t" style={{ borderColor: "#F1F5F9" }}>
                                <td className="px-5 py-2.5 text-[12px] font-bold" style={{ color: "#4A57B9" }}>{a.asset_code}</td>
                                <td className="px-5 py-2.5 text-[12px]" style={{ color: "#374151" }}>{a.name || "—"}</td>
                                <td className="px-5 py-2.5 text-[12px]" style={{ color: "#6B7280" }}>{a.location || "—"}</td>
                                <td className="px-5 py-2.5"><Badge label={a.criticality || "medium"} color={crit.color} bg={crit.bg} /></td>
                                <td className="px-5 py-2.5"><Badge label={a.status || "Active"} color={stat.color} bg={stat.bg} /></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab 3: Maintenance Logs ────────────────────────────────────────────────

function MaintenanceLogsTab() {
  const { data: logs = [], isLoading } = useGetMaintenanceLogsQuery();
  const { data: assets = [] } = useGetAssetsQuery();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    return (l.asset_name + l.asset_code + l.work_type + (l.performed_by || "")).toLowerCase().includes(q);
  });

  const totalCost = logs.reduce((s, l) => s + (l.cost || 0), 0);
  const completed = logs.filter((l) => l.status === "completed").length;

  return (
    <div className="space-y-6">
      {showAdd && assets.length > 0 && <AddMaintenanceLogModal assets={assets} onClose={() => setShowAdd(false)} />}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={ClipboardList} label="Total Logs" value={logs.length} color="#4A57B9" bg="#EEF0FB" />
        <KpiCard icon={CheckCircle2} label="Completed" value={completed} color="#10B981" bg="#D1FAE5" />
        <KpiCard icon={Clock} label="In Progress" value={logs.filter((l) => l.status === "in_progress").length} color="#F59E0B" bg="#FEF3C7" />
        <KpiCard icon={BarChart3} label="Total Cost" value={`$${totalCost.toLocaleString()}`} sub="maintenance spend" color="#8B5CF6" bg="#EDE9FE" />
      </div>

      <div className="bg-white rounded-2xl border" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>Maintenance Logs</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search logs..." className="pl-9 pr-3 py-2 rounded-xl border text-[13px] outline-none w-48" style={{ borderColor: "#E3E9F6", background: "#F8FAFF" }} />
            </div>
            <button onClick={() => setShowAdd(true)} disabled={assets.length === 0} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: "#4A57B9" }}>
              <Plus className="w-3.5 h-3.5" /> Log Maintenance
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? <LoadingSpinner /> : filtered.length === 0 ? (
            <EmptyState icon={Wrench} text={search ? "No logs match your search" : "No maintenance logs recorded yet."} />
          ) : (
            <table className="w-full">
              <TableHead cols={["Asset", "Work Type", "Performed By", "Date", "Cost", "Status"]} />
              <tbody>
                {filtered.map((log) => {
                  const statColor = log.status === "completed" ? { color: "#10B981", bg: "#D1FAE5" }
                    : log.status === "in_progress" ? { color: "#F59E0B", bg: "#FEF3C7" }
                    : { color: "#6B7280", bg: "#F3F4F6" };
                  return (
                    <tr key={log.id} className="border-t hover:bg-slate-50 transition-colors" style={{ borderColor: "#E3E9F6" }}>
                      <td className="px-5 py-3">
                        <div className="text-[13px] font-bold" style={{ color: "#4A57B9" }}>{log.asset_code}</div>
                        <div className="text-[11px]" style={{ color: "#6B7280" }}>{log.asset_name}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-[13px]" style={{ color: "#111827" }}>{log.work_type}</div>
                        {log.description && <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{log.description}</div>}
                      </td>
                      <td className="px-5 py-3 text-[13px]" style={{ color: "#374151" }}>{log.performed_by || "—"}</td>
                      <td className="px-5 py-3 text-[13px]" style={{ color: "#374151" }}>{log.performed_on || "—"}</td>
                      <td className="px-5 py-3 text-[13px] font-semibold" style={{ color: "#111827" }}>{log.cost ? `$${log.cost.toLocaleString()}` : "—"}</td>
                      <td className="px-5 py-3"><Badge label={log.status} color={statColor.color} bg={statColor.bg} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab 4: Equipment Inspections ───────────────────────────────────────────

function EquipmentInspectionsTab() {
  const { data: inspections = [], isLoading } = useGetAllInspectionsQuery();
  const { data: assets = [] } = useGetAssetsQuery();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = inspections.filter((ins) => {
    const q = search.toLowerCase();
    return (ins.asset_name + ins.asset_code + ins.inspection_type + ins.result).toLowerCase().includes(q);
  });

  const passCount = inspections.filter((i) => i.result.toLowerCase() === "pass").length;
  const failCount = inspections.filter((i) => i.result.toLowerCase() === "fail").length;

  return (
    <div className="space-y-6">
      {showAdd && assets.length > 0 && <AddInspectionModal assets={assets} onClose={() => setShowAdd(false)} />}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={FileText} label="Total Inspections" value={inspections.length} color="#4A57B9" bg="#EEF0FB" />
        <KpiCard icon={CheckCircle2} label="Passed" value={passCount} color="#10B981" bg="#D1FAE5" />
        <KpiCard icon={AlertTriangle} label="Failed" value={failCount} sub="require action" color="#EF4444" bg="#FEE2E2" />
        <KpiCard icon={Activity} label="Pass Rate" value={inspections.length > 0 ? `${Math.round((passCount / inspections.length) * 100)}%` : "—"} color="#8B5CF6" bg="#EDE9FE" />
      </div>

      <div className="bg-white rounded-2xl border" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>Equipment Inspections</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inspections..." className="pl-9 pr-3 py-2 rounded-xl border text-[13px] outline-none w-52" style={{ borderColor: "#E3E9F6", background: "#F8FAFF" }} />
            </div>
            <button onClick={() => setShowAdd(true)} disabled={assets.length === 0} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: "#4A57B9" }}>
              <Plus className="w-3.5 h-3.5" /> Record Inspection
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? <LoadingSpinner /> : filtered.length === 0 ? (
            <EmptyState icon={ClipboardList} text={search ? "No inspections match your search" : "No inspection records yet."} />
          ) : (
            <table className="w-full">
              <TableHead cols={["Asset", "Inspection Type", "Date", "Result", "Notes"]} />
              <tbody>
                {filtered.map((ins) => {
                  const rc = resultColor(ins.result);
                  return (
                    <tr key={ins.id} className="border-t hover:bg-slate-50 transition-colors" style={{ borderColor: "#E3E9F6" }}>
                      <td className="px-5 py-3">
                        <div className="text-[13px] font-bold" style={{ color: "#4A57B9" }}>{ins.asset_code}</div>
                        <div className="text-[11px]" style={{ color: "#6B7280" }}>{ins.asset_name}</div>
                      </td>
                      <td className="px-5 py-3 text-[13px]" style={{ color: "#374151" }}>{ins.inspection_type}</td>
                      <td className="px-5 py-3 text-[13px]" style={{ color: "#374151" }}>{ins.inspected_on || "—"}</td>
                      <td className="px-5 py-3"><Badge label={ins.result} color={rc.color} bg={rc.bg} /></td>
                      <td className="px-5 py-3 text-[12px]" style={{ color: "#6B7280" }}>{ins.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab 5: Asset Risk Mapping ──────────────────────────────────────────────

function AssetRiskMappingTab() {
  const { data: riskItems = [], isLoading } = useGetAssetRiskMappingQuery();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = riskItems.filter((r) => {
    const q = search.toLowerCase();
    return (r.asset_code + r.name + r.category + (r.location || "")).toLowerCase().includes(q);
  });

  const high = riskItems.filter((r) => r.risk_level === "High").length;
  const medium = riskItems.filter((r) => r.risk_level === "Medium").length;
  const low = riskItems.filter((r) => r.risk_level === "Low").length;
  const avgRisk = riskItems.length > 0
    ? Math.round(riskItems.reduce((s, r) => s + r.risk_score, 0) / riskItems.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={AlertTriangle} label="High Risk" value={high} sub="critical assets" color="#EF4444" bg="#FEE2E2" />
        <KpiCard icon={Shield} label="Medium Risk" value={medium} color="#F59E0B" bg="#FEF3C7" />
        <KpiCard icon={CheckCircle2} label="Low Risk" value={low} color="#10B981" bg="#D1FAE5" />
        <KpiCard icon={Zap} label="Avg Risk Score" value={avgRisk} sub="across all assets" color="#8B5CF6" bg="#EDE9FE" />
      </div>

      <div className="bg-white rounded-2xl border" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>Asset Risk Mapping</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assets..." className="pl-9 pr-3 py-2 rounded-xl border text-[13px] outline-none w-52" style={{ borderColor: "#E3E9F6", background: "#F8FAFF" }} />
          </div>
        </div>
        {isLoading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState icon={Shield} text={search ? "No assets match" : "No asset risk data. Register assets with risk scores."} />
        ) : (
          <div className="divide-y" style={{ borderColor: "#E3E9F6" }}>
            {filtered.map((item) => {
              const rl = riskColor(item.risk_level);
              const crit = criticalityColor(item.criticality);
              const stat = statusColor(item.status);
              const isOpen = expanded === item.id;
              return (
                <div key={item.id}>
                  <button className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left" onClick={() => setExpanded(isOpen ? null : item.id)}>
                    {isOpen ? <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "#94A3B8" }} /> : <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "#94A3B8" }} />}
                    <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                      <div>
                        <div className="text-[13px] font-bold" style={{ color: "#4A57B9" }}>{item.asset_code}</div>
                        <div className="text-[11px]" style={{ color: "#6B7280" }}>{item.name}</div>
                      </div>
                      <div className="text-[13px]" style={{ color: "#374151" }}>{item.category}</div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <MapPin className="w-3 h-3" style={{ color: "#94A3B8" }} />
                          <span className="text-[12px]" style={{ color: "#6B7280" }}>{item.location || "—"}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge label={item.risk_level} color={rl.color} bg={rl.bg} />
                        <Badge label={item.criticality} color={crit.color} bg={crit.bg} />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1"><ProgressBar value={item.risk_score} color={rl.color} /></div>
                        <span className="text-[13px] font-bold w-8 text-right" style={{ color: rl.color }}>{item.risk_score}</span>
                      </div>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-14 pb-4 grid grid-cols-3 gap-4 border-t" style={{ borderColor: "#F1F5F9" }}>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <div className="text-[11px] font-bold mb-2" style={{ color: "#6B7280" }}>STATUS</div>
                        <Badge label={item.status} color={stat.color} bg={stat.bg} />
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <div className="text-[11px] font-bold mb-2" style={{ color: "#6B7280" }}>COMPLIANCE</div>
                        <Badge label={(item.compliance_status || "compliant").replace("_", " ")} color={complianceColor(item.compliance_status).color} bg={complianceColor(item.compliance_status).bg} />
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <div className="text-[11px] font-bold mb-2" style={{ color: "#6B7280" }}>MAINTENANCE</div>
                        <div className="text-[12px]" style={{ color: "#374151" }}>
                          <div>Last: {item.last_maintenance_date || "—"}</div>
                          <div>Next: {item.next_maintenance_date || "—"}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "register",     label: "Asset Register",        icon: Box },
  { id: "categories",   label: "Asset Categories",      icon: Package },
  { id: "maintenance",  label: "Maintenance Logs",      icon: Wrench },
  { id: "inspections",  label: "Equipment Inspections", icon: ClipboardList },
  { id: "risk",         label: "Asset Risk Mapping",    icon: Shield },
];

export function AssetsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("register");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold" style={{ color: "#111827" }}>Asset Management</h1>
        <p className="text-[13px] mt-0.5" style={{ color: "#6B7280" }}>Register, track, and manage all your assets, maintenance, and inspections.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl border" style={{ borderColor: "#E3E9F6", background: "#F8FAFF" }}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all flex-1 justify-center"
              style={active ? { background: "#fff", color: "#4A57B9", boxShadow: "0 1px 4px rgba(74,87,185,0.15)" } : { color: "#6B7280" }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "register"    && <AssetRegisterTab />}
      {activeTab === "categories"  && <AssetCategoriesTab />}
      {activeTab === "maintenance" && <MaintenanceLogsTab />}
      {activeTab === "inspections" && <EquipmentInspectionsTab />}
      {activeTab === "risk"        && <AssetRiskMappingTab />}
    </div>
  );
}
