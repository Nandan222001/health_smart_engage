import { useState } from "react";
import { useListAdminAuditLogsQuery } from "@/features/superadmin/api/adminApi";

export function PlatformAuditLogsPage() {
  const { data: logs = [], isLoading, isError } = useListAdminAuditLogsQuery();
  const [search, setSearch] = useState("");

  const filtered = logs.filter(
    (log) =>
      log.actor_email.toLowerCase().includes(search.toLowerCase()) ||
      log.event_type.toLowerCase().includes(search.toLowerCase())
  );

  const summary = (metadata?: Record<string, unknown>) => {
    if (!metadata) return "—";
    const vals = Object.values(metadata).slice(0, 2);
    return vals.map((v) => String(v)).join(", ");
  };

  return (
    <div className="p-6 space-y-6" style={{ background: "#F3F7FF", minHeight: "100vh" }}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Platform Audit Logs</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Cross-tenant administrator activity trail</p>
        </div>
        <input
          type="text"
          placeholder="Search by email or event type…"
          className="border rounded-xl px-4 py-2 text-sm outline-none w-72"
          style={{ borderColor: "#E3E9F6", color: "#111827" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Timestamp</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Actor Email</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Event Type</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Resource</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Summary</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ color: "#9CA3AF" }}>Loading…</td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ color: "#EF4444" }}>Failed to load</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ color: "#9CA3AF" }}>
                  {search ? "No matching logs" : "No audit logs"}
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: "#9CA3AF" }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 font-medium" style={{ color: "#111827" }}>{log.actor_email}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "#EEF2FB", color: "#4A57B9" }}>
                      {log.event_type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5" style={{ color: "#374151" }}>{log.resource}</td>
                  <td className="px-5 py-3.5 text-xs max-w-xs truncate" style={{ color: "#9CA3AF" }}>
                    {summary(log.metadata)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
