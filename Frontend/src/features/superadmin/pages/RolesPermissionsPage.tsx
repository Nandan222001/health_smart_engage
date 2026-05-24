import { useState } from "react";
import {
  useListRolesQuery,
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useListPermissionsQuery,
  useUpdateRolePermissionsMutation,
} from "@/features/superadmin/api/adminApi";

export function RolesPermissionsPage() {
  const { data: roles = [], isLoading: rolesLoading, isError: rolesError } = useListRolesQuery();
  const { data: permissions = [], isLoading: permsLoading } = useListPermissionsQuery();
  const [createRole, { isLoading: creating }] = useCreateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();
  const [updateRolePermissions, { isLoading: saving }] = useUpdateRolePermissionsMutation();

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [checkedPerms, setCheckedPerms] = useState<Record<string, boolean>>({});

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  const handleSelectRole = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    setSelectedRoleId(roleId);
    const map: Record<string, boolean> = {};
    const permKeys = Array.isArray(role.permissions)
      ? (role.permissions as string[])
      : Object.keys((role.permissions as Record<string, unknown>) ?? {});
    permissions.forEach((p) => {
      map[p.id] = permKeys.includes(p.id);
    });
    setCheckedPerms(map);
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    await createRole({ name: newRoleName.trim() });
    setNewRoleName("");
    setShowForm(false);
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;
    const selected = Object.entries(checkedPerms)
      .filter(([, v]) => v)
      .map(([k]) => k);
    await updateRolePermissions({ roleId: selectedRoleId, permissions: selected });
  };

  const grouped = permissions.reduce<Record<string, typeof permissions>>((acc, p) => {
    (acc[p.group] = acc[p.group] || []).push(p);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6" style={{ background: "#F3F7FF", minHeight: "100vh" }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Roles & Permissions</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Manage platform roles and their permission sets</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
        >
          + New Role
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold mb-4" style={{ color: "#111827" }}>Create Role</h2>
          <form onSubmit={handleCreateRole} className="flex items-center gap-3">
            <input
              className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none"
              style={{ borderColor: "#E3E9F6", color: "#111827" }}
              placeholder="Role name"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 rounded-xl text-white text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
            >
              {creating ? "Creating…" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium border"
              style={{ borderColor: "#E3E9F6", color: "#6B7280" }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "#E9EEF8", background: "#F8FAFF" }}>
            <h2 className="text-[13px] font-bold" style={{ color: "#111827" }}>Roles</h2>
          </div>
          <div className="divide-y" style={{ borderColor: "#F3F4F6" }}>
            {rolesLoading ? (
              <div className="px-5 py-6 text-sm text-center" style={{ color: "#9CA3AF" }}>Loading…</div>
            ) : rolesError ? (
              <div className="px-5 py-6 text-sm text-center" style={{ color: "#EF4444" }}>Failed to load</div>
            ) : roles.length === 0 ? (
              <div className="px-5 py-6 text-sm text-center" style={{ color: "#9CA3AF" }}>No roles yet</div>
            ) : (
              roles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors"
                  style={selectedRoleId === role.id ? { background: "#EEF2FB" } : {}}
                  onClick={() => handleSelectRole(role.id)}
                >
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "#111827" }}>{role.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                      {role.permissions.length} permission{role.permissions.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteRole(role.id); }}
                    className="text-xs px-2.5 py-1 rounded-lg border"
                    style={{ borderColor: "#EF4444", color: "#EF4444" }}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E9EEF8", background: "#F8FAFF" }}>
            <h2 className="text-[13px] font-bold" style={{ color: "#111827" }}>
              {selectedRole ? `Permissions — ${selectedRole.name}` : "Select a role to edit permissions"}
            </h2>
            {selectedRole && (
              <button
                onClick={handleSavePermissions}
                disabled={saving}
                className="px-4 py-1.5 rounded-xl text-white text-xs font-semibold"
                style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
              >
                {saving ? "Saving…" : "Save Permissions"}
              </button>
            )}
          </div>

          {!selectedRole ? (
            <div className="p-8 text-center text-sm" style={{ color: "#9CA3AF" }}>
              Select a role from the left panel to manage its permissions.
            </div>
          ) : permsLoading ? (
            <div className="p-8 text-center text-sm" style={{ color: "#9CA3AF" }}>Loading…</div>
          ) : (
            <div className="p-5 space-y-5 overflow-y-auto max-h-[500px]">
              {Object.entries(grouped).map(([group, perms]) => (
                <div key={group}>
                  <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>{group}</div>
                  <div className="space-y-1.5">
                    {perms.map((perm) => (
                      <label key={perm.id} className="flex items-center gap-3 cursor-pointer px-3 py-2 rounded-xl hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={!!checkedPerms[perm.id]}
                          onChange={(e) => setCheckedPerms({ ...checkedPerms, [perm.id]: e.target.checked })}
                          className="rounded"
                        />
                        <div>
                          <span className="text-sm font-medium" style={{ color: "#111827" }}>{perm.operation}</span>
                          {perm.description && (
                            <span className="text-xs ml-2" style={{ color: "#9CA3AF" }}>{perm.description}</span>
                          )}
                        </div>
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#6B7280" }}>
                          {perm.method}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
