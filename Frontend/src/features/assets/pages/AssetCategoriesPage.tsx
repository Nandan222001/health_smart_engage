import { useMemo } from "react";
import {
  Layers, Cog, Tag, RefreshCw, CheckCircle2, Clock,
  Package, AlertTriangle, Zap, Truck, Wind, Building2,
  Shield, Monitor, HardHat, Box,
} from "lucide-react";
import {
  useGetAssetCategoriesQuery,
  useGetAssetsQuery,
  type AssetCategory,
  type Asset,
} from "@/features/assets/api/assetsApi";

// ── Category icon map ──────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Electrical:  Zap,
  Mechanical:  Cog,
  HVAC:        Wind,
  Civil:       Building2,
  Safety:      HardHat,
  IT:          Monitor,
  Vehicle:     Truck,
  Equipment:   Box,
  Facility:    Building2,
  Other:       Package,
};

const CATEGORY_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  Electrical:  { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  Mechanical:  { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  HVAC:        { color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC" },
  Civil:       { color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
  Safety:      { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  IT:          { color: "#4A57B9", bg: "#EEF2FF", border: "#C7D2FE" },
  Vehicle:     { color: "#059669", bg: "#F0FDF4", border: "#BBF7D0" },
  Equipment:   { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  Facility:    { color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB" },
  Other:       { color: "#9CA3AF", bg: "#F9FAFB", border: "#E5E7EB" },
};

// Machinery-type categories (Section 2)
const MACHINERY_CATEGORIES = ["Mechanical", "Electrical", "HVAC", "Vehicle", "Equipment"];

// ── Helpers ────────────────────────────────────────────────────────────────

function criticalityCfg(c: string) {
  if (c === "high")   return { label: "High",   color: "#DC2626", bg: "#FEF2F2" };
  if (c === "medium") return { label: "Medium", color: "#D97706", bg: "#FEF3C7" };
  return                     { label: "Low",    color: "#059669", bg: "#D1FAE5" };
}

function complianceCfg(s: string) {
  if (s === "compliant")     return { label: "Compliant",     color: "#059669", bg: "#D1FAE5" };
  if (s === "non_compliant") return { label: "Non-Compliant", color: "#DC2626", bg: "#FEE2E2" };
  return                            { label: "Under Review",  color: "#D97706", bg: "#FEF3C7" };
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function SectionHeader({
  icon: Icon, title, subtitle, accent, count,
}: {
  icon: React.ElementType; title: string; subtitle: string; accent: string; count: number;
}) {
  return (
    <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: "#F3F4F6" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: accent + "18" }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>{title}</h2>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: accent + "15", color: accent }}>{count}</span>
        </div>
        <p className="text-[12px]" style={{ color: "#9CA3AF" }}>{subtitle}</p>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="py-12 text-center">
      <Layers className="w-8 h-8 mx-auto mb-2 text-gray-200" />
      <p className="text-[13px] text-gray-400">{text}</p>
    </div>
  );
}

// ── Section 1: Equipment Types ─────────────────────────────────────────────

function EquipmentTypesSection({ categories }: { categories: AssetCategory[] }) {
  const maxTotal = Math.max(...categories.map((c) => c.total), 1);

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <SectionHeader
        icon={Layers} title="Equipment Types" accent="#4A57B9" count={categories.length}
        subtitle="All registered asset types with status breakdown"
      />

      {categories.length === 0 ? <Empty text="No equipment types found." /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {categories.map((cat) => {
            const cfg  = CATEGORY_COLORS[cat.category] ?? CATEGORY_COLORS.Other;
            const Icon = CATEGORY_ICONS[cat.category] ?? Package;
            const activePct      = cat.total > 0 ? Math.round((cat.active / cat.total) * 100) : 0;
            const maintPct       = cat.total > 0 ? Math.round((cat.maintenance / cat.total) * 100) : 0;
            const retiredPct     = cat.total > 0 ? Math.round((cat.retired / cat.total) * 100) : 0;

            return (
              <div key={cat.category}
                className="rounded-2xl border overflow-hidden hover:shadow-md transition-shadow"
                style={{ borderColor: cfg.border }}>
                {/* Card header */}
                <div className="flex items-center gap-3 px-5 py-4"
                  style={{ background: cfg.bg, borderBottom: `1px solid ${cfg.border}` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white">
                    <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold" style={{ color: "#111827" }}>{cat.category}</div>
                    <div className="text-[11px]" style={{ color: cfg.color }}>
                      {cat.high_criticality} high criticality
                    </div>
                  </div>
                  <div className="text-[28px] font-black leading-none" style={{ color: cfg.color }}>
                    {cat.total}
                  </div>
                </div>

                {/* Status breakdown */}
                <div className="px-5 py-4 bg-white space-y-2.5">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px] font-semibold text-gray-500">Active</span>
                      <span className="text-[11px] font-bold" style={{ color: "#059669" }}>
                        {cat.active} <span className="text-gray-400 font-normal">({activePct}%)</span>
                      </span>
                    </div>
                    <Bar value={cat.active} max={maxTotal} color="#10B981" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px] font-semibold text-gray-500">Maintenance</span>
                      <span className="text-[11px] font-bold" style={{ color: "#D97706" }}>
                        {cat.maintenance} <span className="text-gray-400 font-normal">({maintPct}%)</span>
                      </span>
                    </div>
                    <Bar value={cat.maintenance} max={maxTotal} color="#F59E0B" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px] font-semibold text-gray-500">Retired</span>
                      <span className="text-[11px] font-bold" style={{ color: "#6B7280" }}>
                        {cat.retired} <span className="text-gray-400 font-normal">({retiredPct}%)</span>
                      </span>
                    </div>
                    <Bar value={cat.retired} max={maxTotal} color="#9CA3AF" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Section 2: Machinery Categories ───────────────────────────────────────

function MachineryCategoriesSection({ categories, assets }: {
  categories: AssetCategory[]; assets: Asset[];
}) {
  const machinery = useMemo(
    () => categories.filter((c) => MACHINERY_CATEGORIES.includes(c.category)),
    [categories],
  );

  const machineryAssets = useMemo(
    () => assets.filter((a) => MACHINERY_CATEGORIES.includes(a.category)),
    [assets],
  );

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <SectionHeader
        icon={Cog} title="Machinery Categories" accent="#2563EB" count={machinery.length}
        subtitle="Mechanical, Electrical, HVAC, Vehicle and Equipment assets"
      />

      {machinery.length === 0 ? <Empty text="No machinery categories found." /> : (
        <div className="p-6 space-y-4">
          {/* Category comparison table */}
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "#E5E7EB" }}>
            <table className="w-full">
              <thead style={{ background: "#F8FAFF" }}>
                <tr>
                  {["Category", "Total", "Active", "In Maintenance", "Retired", "High Criticality", "Utilisation"].map((h) => (
                    <th key={h}
                      className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: "#94A3B8" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {machinery.map((cat) => {
                  const cfg       = CATEGORY_COLORS[cat.category] ?? CATEGORY_COLORS.Other;
                  const Icon      = CATEGORY_ICONS[cat.category] ?? Package;
                  const utilPct   = cat.total > 0 ? Math.round((cat.active / cat.total) * 100) : 0;
                  return (
                    <tr key={cat.category} className="border-t hover:bg-slate-50 transition-colors"
                      style={{ borderColor: "#F3F4F6" }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: cfg.bg }}>
                            <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                          </div>
                          <span className="text-[13px] font-bold" style={{ color: "#111827" }}>{cat.category}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[14px] font-black" style={{ color: "#111827" }}>{cat.total}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-semibold" style={{ color: "#059669" }}>{cat.active}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-semibold" style={{ color: "#D97706" }}>{cat.maintenance}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-semibold" style={{ color: "#6B7280" }}>{cat.retired}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-semibold"
                          style={{ color: cat.high_criticality > 0 ? "#DC2626" : "#059669" }}>
                          {cat.high_criticality}
                        </span>
                      </td>
                      <td className="px-4 py-3 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                            <div className="h-1.5 rounded-full"
                              style={{ width: `${utilPct}%`, background: utilPct >= 70 ? "#10B981" : utilPct >= 40 ? "#F59E0B" : "#EF4444" }} />
                          </div>
                          <span className="text-[11px] font-bold w-8 text-right"
                            style={{ color: utilPct >= 70 ? "#059669" : utilPct >= 40 ? "#D97706" : "#DC2626" }}>
                            {utilPct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Individual machinery assets */}
          {machineryAssets.length > 0 && (
            <div>
              <div className="text-[12px] font-bold mb-3" style={{ color: "#6B7280" }}>
                MACHINERY ASSETS ({machineryAssets.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {machineryAssets.map((a) => {
                  const cfg  = CATEGORY_COLORS[a.category] ?? CATEGORY_COLORS.Other;
                  const Icon = CATEGORY_ICONS[a.category] ?? Package;
                  const activeStyle = a.status === "Active"
                    ? { color: "#059669", bg: "#D1FAE5" }
                    : a.status === "Maintenance"
                    ? { color: "#D97706", bg: "#FEF3C7" }
                    : { color: "#6B7280", bg: "#F3F4F6" };
                  return (
                    <div key={a.id}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border hover:shadow-sm transition-shadow"
                      style={{ borderColor: cfg.border, background: cfg.bg }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white flex-shrink-0">
                        <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-bold truncate" style={{ color: "#111827" }}>
                          {a.name || a.asset_code}
                        </div>
                        <div className="text-[10px]" style={{ color: cfg.color }}>{a.asset_code}</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ color: activeStyle.color, background: activeStyle.bg }}>
                        {a.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Section 3: Asset Classification ───────────────────────────────────────

function AssetClassificationSection({ assets }: { assets: Asset[] }) {
  const byCategory = useMemo(() => {
    const map: Record<string, Asset[]> = {};
    for (const a of assets) {
      if (!map[a.category]) map[a.category] = [];
      map[a.category].push(a);
    }
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [assets]);

  const highCrit   = assets.filter((a) => a.criticality === "high").length;
  const medCrit    = assets.filter((a) => a.criticality === "medium").length;
  const lowCrit    = assets.filter((a) => a.criticality === "low").length;
  const compliant  = assets.filter((a) => a.compliance_status === "compliant").length;
  const nonComp    = assets.filter((a) => a.compliance_status === "non_compliant").length;
  const review     = assets.filter((a) => a.compliance_status !== "compliant" && a.compliance_status !== "non_compliant").length;

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <SectionHeader
        icon={Tag} title="Asset Classification" accent="#7C3AED" count={assets.length}
        subtitle="Assets classified by criticality and compliance status"
      />

      {assets.length === 0 ? <Empty text="No assets to classify." /> : (
        <div className="p-6 space-y-6">

          {/* Criticality summary */}
          <div>
            <div className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: "#9CA3AF" }}>
              Criticality
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "High Criticality",   value: highCrit, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
                { label: "Medium Criticality", value: medCrit,  color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
                { label: "Low Criticality",    value: lowCrit,  color: "#059669", bg: "#F0FDF4", border: "#BBF7D0" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border p-4 text-center"
                  style={{ borderColor: s.border, background: s.bg }}>
                  <div className="text-[28px] font-black leading-none mb-1" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[11px] font-semibold" style={{ color: s.color + "AA" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance status */}
          <div>
            <div className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: "#9CA3AF" }}>
              Compliance Status
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Compliant",     value: compliant, color: "#059669", bg: "#F0FDF4", border: "#BBF7D0" },
                { label: "Non-Compliant", value: nonComp,   color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
                { label: "Under Review",  value: review,    color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border p-4 text-center"
                  style={{ borderColor: s.border, background: s.bg }}>
                  <div className="text-[28px] font-black leading-none mb-1" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[11px] font-semibold" style={{ color: s.color + "AA" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Per-category classification table */}
          <div>
            <div className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: "#9CA3AF" }}>
              Classification by Category
            </div>
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
              <table className="w-full">
                <thead style={{ background: "#F8FAFF" }}>
                  <tr>
                    {["Category", "Total", "High Crit.", "Compliant", "Non-Compliant", "Under Review"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: "#94A3B8" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byCategory.map(([cat, list]) => {
                    const cfg      = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other;
                    const Icon     = CATEGORY_ICONS[cat] ?? Package;
                    const highC    = list.filter((a) => a.criticality === "high").length;
                    const comp     = list.filter((a) => a.compliance_status === "compliant").length;
                    const nonC     = list.filter((a) => a.compliance_status === "non_compliant").length;
                    const rev      = list.length - comp - nonC;
                    return (
                      <tr key={cat} className="border-t hover:bg-slate-50 transition-colors"
                        style={{ borderColor: "#F3F4F6" }}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: cfg.bg }}>
                              <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                            </div>
                            <span className="text-[13px] font-bold" style={{ color: "#111827" }}>{cat}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-[14px] font-black" style={{ color: "#111827" }}>{list.length}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-[12px] font-semibold"
                            style={{ color: highC > 0 ? "#DC2626" : "#9CA3AF" }}>
                            {highC}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-[12px] font-semibold" style={{ color: "#059669" }}>{comp}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-[12px] font-semibold"
                            style={{ color: nonC > 0 ? "#DC2626" : "#9CA3AF" }}>
                            {nonC}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-[12px] font-semibold" style={{ color: "#D97706" }}>{rev}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export function AssetCategoriesPage() {
  const { data: categories = [], isLoading: l1 } = useGetAssetCategoriesQuery();
  const { data: assets = [],     isLoading: l2 } = useGetAssetsQuery();

  const totalAssets  = assets.length;
  const totalCats    = categories.length;
  const machineryCount = categories.filter((c) => MACHINERY_CATEGORIES.includes(c.category)).length;
  const highCritCount  = assets.filter((a) => a.criticality === "high").length;

  if (l1 || l2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <RefreshCw className="w-7 h-7 animate-spin text-indigo-400 mr-3" />
        <span className="text-sm text-gray-400">Loading categories…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Banner ───────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, #312E81 0%, #0F172A 100%)" }}>
        <div className="px-8 pt-8 pb-0">
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-1"
            style={{ color: "rgba(255,255,255,0.4)" }}>
            Assets
          </p>
          <h1 className="text-[26px] font-black text-white">Asset Categories</h1>
          <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Equipment types · Machinery categories · Asset classification
          </p>
        </div>

        <div className="flex flex-wrap border-t mt-6" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          {[
            { label: "Total Assets",        value: totalAssets,    color: "#fff"    },
            { label: "Categories",          value: totalCats,      color: "#A5B4FC" },
            { label: "Machinery Types",     value: machineryCount, color: "#67E8F9" },
            { label: "High Criticality",    value: highCritCount,  color: "#F87171" },
          ].map((s, i, arr) => (
            <div key={s.label}
              className="flex-1 min-w-[110px] flex flex-col items-center text-center px-4 py-4 gap-0.5"
              style={{ borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.1)" : undefined }}>
              <span className="text-[30px] font-black leading-none" style={{ color: s.color }}>{s.value}</span>
              <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Three sections ───────────────────────────────────── */}
      <div className="p-6 space-y-6">
        <EquipmentTypesSection    categories={categories} />
        <MachineryCategoriesSection categories={categories} assets={assets} />
        <AssetClassificationSection assets={assets} />
      </div>
    </div>
  );
}
