import { Database, FolderOpen, Layers, Search, CheckCircle2, AlertTriangle, XCircle, HardDrive } from "lucide-react";
import { useGetAdminStorageMetricsQuery } from "@/features/superadmin/api/adminApi";

type StorageStatus = "healthy" | "degraded" | "offline";

const STATUS_CFG: Record<StorageStatus, { color: string; bg: string; icon: typeof CheckCircle2; label: string }> = {
  healthy:  { color: "#10B981", bg: "#D1FAE5", icon: CheckCircle2,  label: "Healthy" },
  degraded: { color: "#F59E0B", bg: "#FEF3C7", icon: AlertTriangle, label: "Degraded" },
  offline:  { color: "#EF4444", bg: "#FEE2E2", icon: XCircle,       label: "Offline" },
};

const STORE_META: Record<string, { label: string; sub: string; icon: typeof Database; color: string; bg: string; description: string }> = {
  relational: {
    label: "Relational Database", sub: "Structured Data", icon: Database, color: "#4A57B9", bg: "#EEF2FB",
    description: "Stores all structured records: Users, Permits, Incidents, CAPA, Audits, Employees, Sites and more.",
  },
  object: {
    label: "Object Storage", sub: "Unstructured Data", icon: FolderOpen, color: "#8B5CF6", bg: "#F5F3FF",
    description: "Stores documents, images, videos, evidence files and any unstructured content uploaded by users.",
  },
  vector: {
    label: "Vector Database", sub: "AI Embeddings", icon: Layers, color: "#06B6D4", bg: "#ECFEFF",
    description: "Stores semantic embeddings for AI-powered search, similarity matching and knowledge retrieval.",
  },
  search: {
    label: "Search Index", sub: "Fast Retrieval", icon: Search, color: "#F59E0B", bg: "#FFFBEB",
    description: "Full-text search index enabling instant lookups across all entities, documents and audit trails.",
  },
};

function UsageBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const color = pct > 85 ? "#EF4444" : pct > 65 ? "#F59E0B" : "#10B981";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs" style={{ color: "#6B7280" }}>
        <span>{used.toFixed(3)} GB used</span>
        <span>{total} GB total</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-xs text-right" style={{ color }}>{pct.toFixed(1)}% utilised</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[(status as StorageStatus)] ?? STATUS_CFG.healthy;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

export function StorageLayerPage() {
  const { data, isLoading } = useGetAdminStorageMetricsQuery();

  const stores = data?.stores ?? [];
  const summary = data?.summary;

  const totalUsed = summary?.total_used_gb ?? stores.reduce((s, st) => s + st.used_gb, 0);
  const totalCap = summary?.total_capacity_gb ?? stores.reduce((s, st) => s + st.capacity_gb, 0);
  const healthyCount = summary?.healthy_stores ?? stores.filter((s) => s.status === "healthy").length;
  const unhealthy = stores.length - healthyCount;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Storage Layer</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Layer 3 — Relational · Object · Vector · Search Index</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Storage Used", value: `${totalUsed.toFixed(2)} GB`, icon: HardDrive, color: "#4A57B9" },
          { label: "Total Capacity", value: `${totalCap} GB`, icon: Database, color: "#8B5CF6" },
          { label: "Healthy Stores", value: `${healthyCount} / ${stores.length}`, icon: CheckCircle2, color: "#10B981" },
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
      {isLoading ? (
        <div className="text-sm" style={{ color: "#9CA3AF" }}>Loading storage metrics…</div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {stores.map((store) => {
            const meta = STORE_META[store.id] ?? {
              label: store.name, sub: store.type, icon: Database, color: "#6B7280", bg: "#F3F4F6",
              description: `${store.name} storage layer.`,
            };
            const Icon = meta.icon;
            const entityEntries = Object.entries(store.entities ?? {});
            return (
              <div key={store.id} className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: "#E3E9F6" }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.bg }}>
                      <Icon className="w-5 h-5" style={{ color: meta.color }} />
                    </div>
                    <div>
                      <div className="text-[15px] font-bold" style={{ color: "#111827" }}>{meta.label}</div>
                      <div className="text-xs font-medium" style={{ color: meta.color }}>{meta.sub}</div>
                    </div>
                  </div>
                  <StatusBadge status={store.status} />
                </div>

                <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>{meta.description}</p>

                <UsageBar used={store.used_gb} total={store.capacity_gb} />

                {entityEntries.length > 0 && (
                  <div className="pt-1 border-t space-y-1" style={{ borderColor: "#F3F4F6" }}>
                    {entityEntries.slice(0, 6).map(([key, count]) => (
                      <div key={key} className="flex justify-between text-xs" style={{ color: "#6B7280" }}>
                        <span className="capitalize">{key.replace(/_/g, " ")}</span>
                        <span className="font-medium" style={{ color: "#374151" }}>{Number(count).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
