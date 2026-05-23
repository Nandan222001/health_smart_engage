import { useState } from "react";
import { useListSuperAdminUsersQuery } from "@/features/superadmin/api/adminApi";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active:    { bg: "#D1FAE5", text: "#065F46" },
  inactive:  { bg: "#F3F4F6", text: "#6B7280" },
  suspended: { bg: "#FEE2E2", text: "#991B1B" },
  pending:   { bg: "#FEF3C7", text: "#92400E" },
};

export function SuperAdminUsersPage() {
  const { data: users = [], isLoading, isError } = useListSuperAdminUsersQuery();
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.display_name.toLowerCase().includes(search.toLowerCase())
  );

  const initials = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

  return (
    <div className="p-6 space-y-6" style={{ background: "#F3F7FF", minHeight: "100vh" }}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Platform Users</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>All users across tenants</p>
        </div>
        <input
          type="text"
          placeholder="Search by name or email…"
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
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>User</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Email</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Tenant</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Status</th>
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
                  {search ? "No matching users" : "No users"}
                </td>
              </tr>
            ) : (
              filtered.map((user) => {
                const badge = STATUS_COLORS[user.status] ?? STATUS_COLORS.inactive;
                return (
                  <tr key={user.id} className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
                        >
                          {initials(user.display_name || user.email)}
                        </div>
                        <div>
                          <div className="font-semibold" style={{ color: "#111827" }}>{user.display_name}</div>
                          {user.is_superadmin && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "#FEF3C7", color: "#92400E" }}>
                              Super Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5" style={{ color: "#374151" }}>{user.email}</td>
                    <td className="px-5 py-3.5">
                      {user.role ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "#EEF2FB", color: "#4A57B9" }}>
                          {user.role}
                        </span>
                      ) : (
                        <span style={{ color: "#9CA3AF" }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5" style={{ color: "#374151" }}>
                      {user.tenant_name ?? (user.is_superadmin ? "Platform" : "—")}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize" style={{ background: badge.bg, color: badge.text }}>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
