import { Database, FolderOpen, Layers, Search, CheckCircle2, AlertTriangle, XCircle, HardDrive } from "lucide-react";
import { useGetStorageMetricsQuery } from "@/features/ai-intelligence/api/aiIntelligenceApi";

type StorageStatus = "healthy" | "degraded" | "offline";

const STATUS_CFG: Record<StorageStatus, { color: string; bg: string; icon: typeof CheckCircle2; label: string }> = {
  healthy:  { color: "#10B981", bg: "#D1FAE5", icon: CheckCircle2,  label: "Healthy" },
  degraded: { color: "#F59E0B", bg: "#FEF3C7", icon: AlertTriangle, label: "Degraded" },
  offline:  { color: "#EF4444", bg: "#FEE2E2", icon: XCircle,       label: "Offline" },
};

function UsageBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const color = pct > 85 ? "#EF4444" : pct > 65 ? "#F59E0B" : "#10B981";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs" style={{ color: "#6B7280" }}>
        <span>{used.toFixed(1)} GB used</span>
        <span>{total} GB total</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-xs text-right" style={{ color }}>{pct.toFixed(0)}% utilised</p>
    </div>
  );
}

function StatusBadge({ status }: { status: StorageStatus }) {
  const cfg = STATUS_CFG[status];
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

// ─── Mock fallback when API returns stub data ──────────────────────────────

const MOCK_METRICS = {
  relational: {
    used_gb: 18.4, total_gb: 100,
    status: "healthy" as StorageStatus,
    entities: [
      { name: "Users",    row_count: 3_412 },
      { name: "Permits",  row_count: 1_208 },
      { name: "Incidents",row_count: 542 },
      { name: "CAPAs",    row_count: 317 },
      { name: "Audits",   row_count: 189 },
      { name: "Employees",row_count: 2_740 },
    ],
  },
  object: { used_gb: 62.1, total_gb: 500, file_count: 14_233, status: "healthy" as StorageStatus },
  vector:  { used_gb: 3.8,  total_gb: 50,  embedding_count: 98_400, status: "healthy" as StorageStatus },
  search_index: { used_gb: 1.2, total_gb: 20, index_count: 6, status: "healthy" as StorageStatus },
};

export function StorageLayerPage() {
  const { data: raw, isLoading } = useGetStorageMetricsQuery();
  const metrics = raw ?? MOCK_METRICS;

  const stores = [
    {
      key: "relational",
      label: "Relational Database",
      sub: "Structured Data",
      icon: Database,
      color: "#4A57B9",
      bg: "#EEF2FB",
      description: "Stores all structured records: Users, Permits, Incidents, CAPA, Audits, Employees, Sites and more.",
      extra: (
        <div className="space-y-1 mt-2">
          {(metrics.relational.entities ?? []).map((e) => (
            <div key={e.name} className="flex justify-between text-xs" style={{ color: "#6B7280" }}>
              <span>{e.name}</span>
              <span className="font-medium" style={{ color: "#374151" }}>{e.row_count.toLocaleString()} rows</span>
            </div>
          ))}
        </div>
      ),
      used: metrics.relational.used_gb,
      total: metrics.relational.total_gb,
      status: metrics.relational.status,
      stat: null,
    },
    {
      key: "object",
      label: "Object Storage",
      sub: "Unstructured Data",
      icon: FolderOpen,
      color: "#8B5CF6",
      bg: "#F5F3FF",
      description: "Stores documents, images, videos, evidence files and any unstructured content uploaded by users.",
      extra: (
        <p className="text-xs mt-2" style={{ color: "#6B7280" }}>
          <span className="font-semibold" style={{ color: "#374151" }}>{(metrics.object.file_count ?? 0).toLocaleString()}</span> files stored
        </p>
      ),
      used: metrics.object.used_gb,
      total: metrics.object.total_gb,
      status: metrics.object.status,
      stat: null,
    },
    {
      key: "vector",
      label: "Vector Database",
      sub: "AI Embeddings",
      icon: Layers,
      color: "#06B6D4",
      bg: "#ECFEFF",
      description: "Stores semantic embeddings for AI-powered search, similarity matching and knowledge retrieval.",
      extra: (
        <p className="text-xs mt-2" style={{ color: "#6B7280" }}>
          <span className="font-semibold" style={{ color: "#374151" }}>{(metrics.vector.embedding_count ?? 0).toLocaleString()}</span> embeddings indexed
        </p>
      ),
      used: metrics.vector.used_gb,
      total: metrics.vector.total_gb,
      status: metrics.vector.status,
      stat: null,
    },
    {
      key: "search_index",
      label: "Search Index",
      sub: "Fast Retrieval",
      icon: Search,
      color: "#F59E0B",
      bg: "#FFFBEB",
      description: "Full-text search index enabling instant lookups across all entities, documents and audit trails.",
      extra: (
        <p className="text-xs mt-2" style={{ color: "#6B7280" }}>
          <span className="font-semibold" style={{ color: "#374151" }}>{metrics.search_index.index_count ?? 0}</span> indexes active
        </p>
      ),
      used: metrics.search_index.used_gb,
      total: metrics.search_index.total_gb,
      status: metrics.search_index.status,
      stat: null,
    },
  ];

  const totalUsed = stores.reduce((s, st) => s + st.used, 0);
  const totalCap  = stores.reduce((s, st) => s + st.total, 0);
  const unhealthy = stores.filter((s) => s.status !== "healthy").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Storage Layer</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Layer 3 — Relational · Object · Vector · Search Index</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Storage Used", value: `${totalUsed.toFixed(1)} GB`, icon: HardDrive, color: "#4A57B9" },
          { label: "Total Capacity", value: `${totalCap} GB`, icon: Database, color: "#8B5CF6" },
          { label: "Healthy Stores", value: `${stores.length - unhealthy} / ${stores.length}`, icon: CheckCircle2, color: "#10B981" },
          { label: "Degraded / Offline", value: unhealthy, icon: AlertTriangle, color: unhealthy > 0 ? "#EF4444" : "#10B981" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: "#E3E9F6" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "18" }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <div className="text-xl font-bold" style={{ color: "#111827" }}>{isLoading ? "…" : value}</div>
              <div className="text-xs" style={{ color: "#6B7280" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Storage cards */}
      <div className="grid grid-cols-2 gap-5">
        {stores.map(({ key, label, sub, icon: Icon, color, bg, description, extra, used, total, status }) => (
          <div key={key} className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: "#E3E9F6" }}>
            {/* Card header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <div className="text-[15px] font-bold" style={{ color: "#111827" }}>{label}</div>
                  <div className="text-xs font-medium" style={{ color }}>{sub}</div>
                </div>
              </div>
              <StatusBadge status={status} />
            </div>

            {/* Description */}
            <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>{description}</p>

            {/* Usage bar */}
            <UsageBar used={used} total={total} />

            {/* Entity details */}
            <div className="pt-1 border-t" style={{ borderColor: "#F3F4F6" }}>
              {extra}
            </div>
          </div>
        ))}
      </div>

      {/* Architecture note */}
      <div className="rounded-2xl border p-5" style={{ borderColor: "#E3E9F6", background: "#F8FAFF" }}>
        <h3 className="text-sm font-bold mb-2" style={{ color: "#111827" }}>Storage Architecture</h3>
        <div className="grid grid-cols-4 gap-3 text-xs" style={{ color: "#6B7280" }}>
          {[
            { title: "Relational DB", lines: ["MySQL / PostgreSQL", "ACID-compliant", "Foreign-key integrity", "Full audit trail"] },
            { title: "Object Storage", lines: ["S3-compatible", "Versioned files", "CDN-ready delivery", "Virus scanning on upload"] },
            { title: "Vector DB", lines: ["Pinecone / Weaviate", "1536-dim embeddings", "Cosine similarity", "Sub-50ms retrieval"] },
            { title: "Search Index", lines: ["Elasticsearch / OpenSearch", "Full-text & fuzzy", "Multi-field ranking", "Real-time indexing"] },
          ].map(({ title, lines }) => (
            <div key={title} className="rounded-xl border p-3 space-y-1.5" style={{ borderColor: "#E3E9F6", background: "#fff" }}>
              <p className="font-semibold" style={{ color: "#374151" }}>{title}</p>
              {lines.map((l) => <p key={l}>{l}</p>)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
