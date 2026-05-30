import { useGetPlatformAnalyticsQuery } from "@/features/superadmin/api/adminApi";

function KPICard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
      <div className="text-2xl font-bold" style={{ color: "#111827" }}>{value}</div>
      <div className="text-[13px] font-medium mt-1" style={{ color: "#6B7280" }}>{label}</div>
      {sub && <div className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>{sub}</div>}
    </div>
  );
}

export function PlatformAnalyticsPage() {
  const { data, isLoading, isError } = useGetPlatformAnalyticsQuery();

  if (isLoading) {
    return (
      <div className="p-6" style={{ color: "#9CA3AF" }}>Loading…</div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6" style={{ color: "#EF4444" }}>Failed to load</div>
    );
  }

  return (
    <div className="p-6 space-y-6" style={{ background: "#F3F7FF", minHeight: "100vh" }}>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Platform Analytics</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Cross-tenant performance metrics and trends</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard label="Total Tenants" value={data.total_tenants ?? 0} />
        <KPICard label="Active Tenants" value={data.active_tenants ?? 0} />
        <KPICard label="Total Users" value={(data as Record<string, unknown>).total_users as number ?? 0} />
        <KPICard label="Total Incidents" value={data.total_incidents ?? 0} />
        <KPICard label="Compliance Score" value={`${(data as Record<string, unknown>).compliance_score ?? data.compliance_rate ?? 0}%`} />
        <KPICard label="New Tenants" value={(data as Record<string, unknown>).new_tenants_this_month as number ?? 0} sub="This month" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "#E9EEF8", background: "#F8FAFF" }}>
            <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>Tenant Growth</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #E9EEF8" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Month</th>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>New Tenants</th>
              </tr>
            </thead>
            <tbody>
              {((data as Record<string, unknown>).tenant_growth as {month:string;count:number}[] ?? []).length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-5 py-6 text-center text-sm" style={{ color: "#9CA3AF" }}>No data</td>
                </tr>
              ) : (
                ((data as Record<string, unknown>).tenant_growth as {month:string;count:number}[] ?? []).map((row) => (
                  <tr key={row.month} className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-5 py-3.5 font-medium" style={{ color: "#111827" }}>{row.month}</td>
                    <td className="px-5 py-3.5" style={{ color: "#374151" }}>{row.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "#E9EEF8", background: "#F8FAFF" }}>
            <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>Top Incident Types</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #E9EEF8" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {((data as Record<string, unknown>).top_incidents_by_type as {type:string;count:number}[] ?? (data as Record<string, unknown>).incident_trend as {type:string;count:number}[] ?? []).length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-5 py-6 text-center text-sm" style={{ color: "#9CA3AF" }}>No data</td>
                </tr>
              ) : (
                ((data as Record<string, unknown>).top_incidents_by_type as {type:string;count:number}[] ?? (data as Record<string, unknown>).incident_trend as {type:string;count:number}[] ?? []).map((row) => (
                  <tr key={row.type} className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-5 py-3.5 font-medium" style={{ color: "#111827" }}>{row.type}</td>
                    <td className="px-5 py-3.5" style={{ color: "#374151" }}>{row.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>Total Violations</div>
          <div className="text-3xl font-bold" style={{ color: "#EF4444" }}>{(data as Record<string, unknown>).total_violations as number ?? 0}</div>
        </div>
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>Total Audits</div>
          <div className="text-3xl font-bold" style={{ color: "#4A57B9" }}>{data.total_audits ?? 0}</div>
        </div>
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>Incidents This Month</div>
          <div className="text-3xl font-bold" style={{ color: "#F59E0B" }}>{(data as Record<string, unknown>).incidents_this_month as number ?? 0}</div>
        </div>
      </div>
    </div>
  );
}
