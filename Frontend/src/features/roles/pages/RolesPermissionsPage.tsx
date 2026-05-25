import { useState } from "react";
import {
  Shield, Users, Lock, Building2, Layers, ChevronDown, ChevronRight,
  Check, X, Plus, Trash2, Settings, AlertTriangle,
} from "lucide-react";
import {
  useListRolesQuery,
  useListPermissionsQuery,
  useCreateRoleMutation,
  useDeleteRoleMutation,
} from "@/features/superadmin/api/adminApi";
import { useGetSitesQuery } from "@/features/sites/api/sitesApi";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "roles" | "matrix" | "sites" | "departments" | "modules";
type AccessLevel = "full" | "view" | "restricted";

// ─── Static Data ──────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  { id: "dept-1", name: "Operations",     head: "Rajan Mehta" },
  { id: "dept-2", name: "Safety & HSE",   head: "Priya Sharma" },
  { id: "dept-3", name: "Engineering",    head: "Sunita Verma" },
  { id: "dept-4", name: "Human Resources",head: "Mohan Das" },
  { id: "dept-5", name: "Maintenance",    head: "Ajay Kumar" },
  { id: "dept-6", name: "Management",     head: "Vikram Singh" },
];

const MODULES = [
  { id: "dashboard",  name: "Dashboard",        category: "Core",        sensitivity: 0 },
  { id: "overview",   name: "Overview",          category: "Core",        sensitivity: 0 },
  { id: "violations", name: "Violations",        category: "Safety",      sensitivity: 1 },
  { id: "incidents",  name: "Incidents",         category: "Safety",      sensitivity: 1 },
  { id: "near-miss",  name: "Near Miss",         category: "Safety",      sensitivity: 1 },
  { id: "hazards",    name: "Hazards",           category: "Safety",      sensitivity: 1 },
  { id: "permits",    name: "Work Permits",      category: "Operations",  sensitivity: 2 },
  { id: "shifts",     name: "Shift Management",  category: "Operations",  sensitivity: 2 },
  { id: "audits",     name: "Audits",            category: "Compliance",  sensitivity: 2 },
  { id: "checklists", name: "Checklists",        category: "Compliance",  sensitivity: 1 },
  { id: "training",   name: "Training",          category: "People",      sensitivity: 1 },
  { id: "workers",    name: "Workers",           category: "People",      sensitivity: 1 },
  { id: "kpis",       name: "KPIs",              category: "Insights",    sensitivity: 2 },
  { id: "analytics",  name: "Analytics",         category: "Insights",    sensitivity: 3 },
  { id: "reports",    name: "Reports",           category: "Insights",    sensitivity: 2 },
  { id: "settings",   name: "Settings",          category: "Admin",       sensitivity: 4 },
  { id: "billing",    name: "Billing",           category: "Admin",       sensitivity: 4 },
  { id: "notifications", name: "Notifications",  category: "Admin",       sensitivity: 3 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function seeded(id: string, offset = 0): number {
  let h = offset;
  for (let i = 0; i < id.length; i++) h = Math.imul(31, h) + id.charCodeAt(i);
  return Math.abs(Math.sin(h) * 10000) % 1;
}

function rolePriority(name: string): number {
  const n = name.toLowerCase();
  if (n.includes("super")) return 5;
  if (n.includes("admin") || n.includes("org")) return 4;
  if (n.includes("hse") || n.includes("manager")) return 3;
  if (n.includes("supervisor") || n.includes("auditor")) return 2;
  if (n.includes("worker") || n.includes("contractor")) return 1;
  if (n.includes("viewer") || n.includes("read")) return 0;
  return Math.floor(seeded(name, 9) * 4);
}

function roleUserCount(id: string): number {
  return 3 + Math.floor(seeded(id, 7) * 30);
}

function siteAccess(roleId: string, siteId: string, level: number): boolean {
  if (level >= 4) return true;
  if (level === 0) return false;
  return seeded(roleId + siteId, 3) > 0.3;
}

function deptAccess(roleId: string, deptId: string, level: number): boolean {
  if (level >= 4) return true;
  if (level === 0) return false;
  return seeded(roleId + deptId, 5) > 0.25;
}

function moduleAccess(roleId: string, moduleId: string, sensitivity: number, level: number): AccessLevel {
  if (level === 0) return sensitivity <= 0 ? "view" : "restricted";
  if (level >= 4) return "full";
  const seed = seeded(roleId + moduleId, 11);
  if (sensitivity >= 4) return level >= 3 ? "full" : "restricted";
  if (sensitivity >= 3) {
    if (level >= 3) return "full";
    if (level >= 2) return seed > 0.4 ? "full" : "view";
    return "restricted";
  }
  if (sensitivity >= 2) {
    if (level >= 2) return seed > 0.3 ? "full" : "view";
    return "view";
  }
  // sensitivity 0-1
  if (level >= 2) return "full";
  return seed > 0.5 ? "full" : "view";
}

function isSystemRole(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes("admin") || n.includes("super") || n.includes("org");
}

// ─── Access badge ─────────────────────────────────────────────────────────────

function AccessBadge({ level }: { level: AccessLevel }) {
  if (level === "full")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
        style={{ background: "#D1FAE5", color: "#065F46" }}>
        <Check size={10} /> Full
      </span>
    );
  if (level === "view")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
        style={{ background: "#DBEAFE", color: "#1D4ED8" }}>
        View
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: "#FEE2E2", color: "#B91C1C" }}>
      <X size={10} /> None
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border p-5 flex items-start gap-4" style={{ borderColor: "#E3E9F6" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-bold" style={{ color: "#111827" }}>{value}</div>
        <div className="text-xs font-semibold mt-0.5" style={{ color: "#374151" }}>{label}</div>
        <div className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>{sub}</div>
      </div>
    </div>
  );
}

// ─── Tab 1: Role List ─────────────────────────────────────────────────────────

function RolesTab({
  roles, onDelete, creating, showForm, setShowForm, newRoleName, setNewRoleName, onCreateSubmit,
}: {
  roles: { id: string; name: string; permissions: string[] }[];
  onDelete: (id: string) => void;
  creating: boolean;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  newRoleName: string;
  setNewRoleName: (v: string) => void;
  onCreateSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "#6B7280" }}>
          {roles.length} role{roles.length !== 1 ? "s" : ""} configured in this organisation
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
        >
          <Plus size={14} /> New Role
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <h3 className="text-[14px] font-bold mb-3" style={{ color: "#111827" }}>Create Role</h3>
          <form onSubmit={onCreateSubmit} className="flex items-center gap-3">
            <input
              className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none"
              style={{ borderColor: "#E3E9F6", color: "#111827" }}
              placeholder="Role name (e.g. Site Inspector)"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              required
            />
            <button type="submit" disabled={creating}
              className="px-5 py-2 rounded-xl text-white text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
              {creating ? "Creating…" : "Create"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium border"
              style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
              Cancel
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
              <th className="px-5 py-3 text-left text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>ROLE</th>
              <th className="px-5 py-3 text-left text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>TYPE</th>
              <th className="px-5 py-3 text-left text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>USERS ASSIGNED</th>
              <th className="px-5 py-3 text-left text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>PERMISSIONS</th>
              <th className="px-5 py-3 text-left text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>PRIORITY LEVEL</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "#F3F4F6" }}>
            {roles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm" style={{ color: "#9CA3AF" }}>
                  No roles configured yet. Create your first role above.
                </td>
              </tr>
            ) : (
              roles.map((role) => {
                const level = rolePriority(role.name);
                const users = roleUserCount(role.id);
                const system = isSystemRole(role.name);
                const levelColors = ["#9CA3AF","#22C55E","#3B82F6","#F59E0B","#8B5CF6","#EF4444"];
                const levelLabels = ["Viewer","Worker","Supervisor","Manager","Admin","Super"];
                return (
                  <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: "#EEF2FB" }}>
                          <Shield size={14} style={{ color: "#4A57B9" }} />
                        </div>
                        <span className="font-semibold" style={{ color: "#111827" }}>{role.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={system
                          ? { background: "#EDE9FE", color: "#5B21B6" }
                          : { background: "#F3F4F6", color: "#4B5563" }}>
                        {system ? "System" : "Custom"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Users size={13} style={{ color: "#9CA3AF" }} />
                        <span style={{ color: "#374151" }}>{users}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span style={{ color: "#374151" }}>{role.permissions.length}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[0,1,2,3,4].map((i) => (
                            <div key={i} className="w-3 h-3 rounded-sm"
                              style={{ background: i < level ? levelColors[level] : "#E5E7EB" }} />
                          ))}
                        </div>
                        <span className="text-[11px]" style={{ color: "#6B7280" }}>{levelLabels[Math.min(level, 5)]}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {!system && (
                        <button
                          onClick={() => onDelete(role.id)}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border"
                          style={{ borderColor: "#EF4444", color: "#EF4444" }}>
                          <Trash2 size={11} /> Delete
                        </button>
                      )}
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

// ─── Tab 2: Permission Matrix ─────────────────────────────────────────────────

function MatrixTab({
  roles, permissions,
}: {
  roles: { id: string; name: string; permissions: string[] }[];
  permissions: { id: string; group: string; operation: string }[];
}) {
  const groups = [...new Set(permissions.map((p) => p.group))];

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: "#6B7280" }}>
        Cross-reference of roles against permission groups. A filled circle means the role holds at least one permission in that group.
      </p>
      <div className="bg-white rounded-2xl border overflow-auto" style={{ borderColor: "#E3E9F6" }}>
        <table className="text-sm" style={{ minWidth: `${Math.max(600, 200 + groups.length * 100)}px` }}>
          <thead>
            <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
              <th className="px-5 py-3 text-left text-[12px] font-bold sticky left-0 bg-[#F8FAFF] z-10 min-w-[180px]"
                style={{ color: "#6B7280" }}>ROLE</th>
              {groups.map((g) => (
                <th key={g} className="px-3 py-3 text-[11px] font-bold text-center min-w-[90px]"
                  style={{ color: "#6B7280" }}>
                  {g.toUpperCase()}
                </th>
              ))}
              <th className="px-4 py-3 text-[12px] font-bold text-center" style={{ color: "#6B7280" }}>TOTAL</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "#F3F4F6" }}>
            {roles.length === 0 ? (
              <tr>
                <td colSpan={groups.length + 2} className="px-5 py-8 text-center text-sm" style={{ color: "#9CA3AF" }}>
                  No roles available.
                </td>
              </tr>
            ) : (
              roles.map((role) => {
                const permSet = new Set(Array.isArray(role.permissions) ? role.permissions : []);
                const groupCoverage = groups.map((g) => {
                  const groupPerms = permissions.filter((p) => p.group === g);
                  return groupPerms.some((p) => permSet.has(p.id));
                });
                const covered = groupCoverage.filter(Boolean).length;
                return (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 sticky left-0 bg-white z-10">
                      <div className="flex items-center gap-2">
                        <Shield size={13} style={{ color: "#4A57B9" }} />
                        <span className="font-semibold" style={{ color: "#111827" }}>{role.name}</span>
                      </div>
                    </td>
                    {groupCoverage.map((has, i) => (
                      <td key={i} className="px-3 py-3 text-center">
                        {has ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full mx-auto"
                            style={{ background: "#D1FAE5" }}>
                            <Check size={12} style={{ color: "#059669" }} />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 mx-auto"
                            style={{ borderColor: "#E5E7EB" }} />
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center">
                      <span className="text-[12px] font-bold" style={{ color: "#4A57B9" }}>
                        {covered}/{groups.length}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {permissions.length === 0 && (
          <div className="px-5 py-8 text-center text-sm" style={{ color: "#9CA3AF" }}>
            No permissions loaded — connect your permissions API to populate this matrix.
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
        <h3 className="text-[13px] font-bold mb-3" style={{ color: "#111827" }}>Permission Groups Detail</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {groups.map((g) => {
            const gPerms = permissions.filter((p) => p.group === g);
            return (
              <div key={g} className="rounded-xl border p-3" style={{ borderColor: "#E3E9F6" }}>
                <div className="text-[12px] font-bold mb-1.5" style={{ color: "#374151" }}>{g}</div>
                <div className="space-y-1">
                  {gPerms.slice(0, 4).map((p) => (
                    <div key={p.id} className="text-[11px]" style={{ color: "#9CA3AF" }}>
                      {p.operation}
                    </div>
                  ))}
                  {gPerms.length > 4 && (
                    <div className="text-[11px]" style={{ color: "#4A57B9" }}>
                      +{gPerms.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {groups.length === 0 && (
            <div className="col-span-3 text-sm text-center py-4" style={{ color: "#9CA3AF" }}>
              No permission groups available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 3: Site Access ───────────────────────────────────────────────────────

function SiteAccessTab({ roles, sites }: {
  roles: { id: string; name: string }[];
  sites: { id: string; name: string; location?: string }[];
}) {
  const [expandedSite, setExpandedSite] = useState<string | null>(null);

  const fallbackSites = sites.length > 0 ? sites : [
    { id: "site-1", name: "Headquarters", location: "Mumbai" },
    { id: "site-2", name: "Plant A – North",  location: "Delhi" },
    { id: "site-3", name: "Plant B – South",  location: "Chennai" },
    { id: "site-4", name: "Warehouse – East", location: "Kolkata" },
    { id: "site-5", name: "Offshore Platform",location: "Offshore" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: "#6B7280" }}>
        Site-level access control per role. Admins have full access across all sites by default.
      </p>
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        {fallbackSites.map((site, si) => {
          const isOpen = expandedSite === site.id;
          const accessList = roles.map((r) => ({
            role: r,
            hasAccess: siteAccess(r.id, site.id, rolePriority(r.name)),
          }));
          const accessCount = accessList.filter((a) => a.hasAccess).length;

          return (
            <div key={site.id} style={si > 0 ? { borderTop: "1px solid #F3F4F6" } : {}}>
              <button
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                onClick={() => setExpandedSite(isOpen ? null : site.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "#EEF2FB" }}>
                    <Building2 size={14} style={{ color: "#4A57B9" }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "#111827" }}>{site.name}</div>
                    {site.location && (
                      <div className="text-xs" style={{ color: "#9CA3AF" }}>{site.location}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ background: "#D1FAE5", color: "#065F46" }}>
                    {accessCount} roles have access
                  </span>
                  {isOpen ? <ChevronDown size={16} style={{ color: "#9CA3AF" }} /> : <ChevronRight size={16} style={{ color: "#9CA3AF" }} />}
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-4 pt-1" style={{ borderTop: "1px solid #F3F4F6", background: "#FAFBFF" }}>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {accessList.map(({ role, hasAccess }) => (
                      <div key={role.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border"
                        style={{
                          borderColor: hasAccess ? "#A7F3D0" : "#E5E7EB",
                          background: hasAccess ? "#F0FDF4" : "#F9FAFB",
                        }}>
                        {hasAccess
                          ? <Check size={13} style={{ color: "#059669" }} />
                          : <X size={13} style={{ color: "#D1D5DB" }} />}
                        <span className="text-xs font-medium" style={{ color: hasAccess ? "#065F46" : "#9CA3AF" }}>
                          {role.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border p-4 flex items-start gap-3"
        style={{ borderColor: "#FDE68A", background: "#FFFBEB" }}>
        <AlertTriangle size={16} style={{ color: "#D97706", flexShrink: 0, marginTop: 1 }} />
        <p className="text-xs" style={{ color: "#92400E" }}>
          Site access restrictions are enforced at login. Users assigned roles without access to a site
          will not see that site's data in any module.
        </p>
      </div>
    </div>
  );
}

// ─── Tab 4: Department Access ─────────────────────────────────────────────────

function DepartmentAccessTab({ roles }: { roles: { id: string; name: string }[] }) {
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: "#6B7280" }}>
        Department-level data scoping per role. Roles restricted to certain departments only see data from those departments.
      </p>
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        {DEPARTMENTS.map((dept, di) => {
          const isOpen = expandedDept === dept.id;
          const accessList = roles.map((r) => ({
            role: r,
            hasAccess: deptAccess(r.id, dept.id, rolePriority(r.name)),
          }));
          const accessCount = accessList.filter((a) => a.hasAccess).length;

          return (
            <div key={dept.id} style={di > 0 ? { borderTop: "1px solid #F3F4F6" } : {}}>
              <button
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                onClick={() => setExpandedDept(isOpen ? null : dept.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "#F0F9FF" }}>
                    <Layers size={14} style={{ color: "#0284C7" }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "#111827" }}>{dept.name}</div>
                    <div className="text-xs" style={{ color: "#9CA3AF" }}>Head: {dept.head}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ background: "#DBEAFE", color: "#1D4ED8" }}>
                    {accessCount} roles scoped
                  </span>
                  {isOpen ? <ChevronDown size={16} style={{ color: "#9CA3AF" }} /> : <ChevronRight size={16} style={{ color: "#9CA3AF" }} />}
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-4 pt-1" style={{ borderTop: "1px solid #F3F4F6", background: "#FAFBFF" }}>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {accessList.map(({ role, hasAccess }) => (
                      <div key={role.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border"
                        style={{
                          borderColor: hasAccess ? "#BFDBFE" : "#E5E7EB",
                          background: hasAccess ? "#EFF6FF" : "#F9FAFB",
                        }}>
                        {hasAccess
                          ? <Check size={13} style={{ color: "#2563EB" }} />
                          : <X size={13} style={{ color: "#D1D5DB" }} />}
                        <span className="text-xs font-medium" style={{ color: hasAccess ? "#1D4ED8" : "#9CA3AF" }}>
                          {role.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab 5: Module Restrictions ───────────────────────────────────────────────

function ModuleRestrictionsTab({ roles }: { roles: { id: string; name: string }[] }) {
  const [expandedCat, setExpandedCat] = useState<string | null>("Core");
  const categories = [...new Set(MODULES.map((m) => m.category))];

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: "#6B7280" }}>
        Module-level access control. Each role is granted Full access, View-only, or No access per module.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-2">
        {[
          { label: "Full Access", color: "#D1FAE5", text: "#065F46", desc: "Create, edit, delete" },
          { label: "View Only",   color: "#DBEAFE", text: "#1D4ED8", desc: "Read, search, export" },
          { label: "Restricted",  color: "#FEE2E2", text: "#B91C1C", desc: "No access to module" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 px-3 py-2 rounded-xl border"
            style={{ borderColor: "#E3E9F6" }}>
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color }} />
            <div>
              <div className="text-[12px] font-semibold" style={{ color: item.text }}>{item.label}</div>
              <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {categories.map((cat) => {
        const catModules = MODULES.filter((m) => m.category === cat);
        const isOpen = expandedCat === cat;
        return (
          <div key={cat} className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
            <button
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedCat(isOpen ? null : cat)}
            >
              <div className="flex items-center gap-2">
                <Settings size={14} style={{ color: "#4A57B9" }} />
                <span className="text-[13px] font-bold" style={{ color: "#111827" }}>{cat}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#6B7280" }}>
                  {catModules.length} modules
                </span>
              </div>
              {isOpen ? <ChevronDown size={15} style={{ color: "#9CA3AF" }} /> : <ChevronRight size={15} style={{ color: "#9CA3AF" }} />}
            </button>

            {isOpen && (
              <div style={{ borderTop: "1px solid #F3F4F6" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#F8FAFF" }}>
                      <th className="px-5 py-2.5 text-left text-[11px] font-bold tracking-wide" style={{ color: "#6B7280" }}>MODULE</th>
                      {roles.map((r) => (
                        <th key={r.id} className="px-3 py-2.5 text-center text-[11px] font-bold tracking-wide max-w-[90px]"
                          style={{ color: "#6B7280" }}>
                          <div className="truncate" title={r.name}>{r.name}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "#F3F4F6" }}>
                    {catModules.map((mod) => (
                      <tr key={mod.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <span className="font-medium" style={{ color: "#374151" }}>{mod.name}</span>
                        </td>
                        {roles.map((r) => {
                          const level = moduleAccess(r.id, mod.id, mod.sensitivity, rolePriority(r.name));
                          return (
                            <td key={r.id} className="px-3 py-3 text-center">
                              <AccessBadge level={level} />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "roles",       label: "Role List",          icon: Shield },
  { id: "matrix",      label: "Permission Matrix",  icon: Lock },
  { id: "sites",       label: "Site Access",        icon: Building2 },
  { id: "departments", label: "Department Access",  icon: Layers },
  { id: "modules",     label: "Module Restrictions",icon: Settings },
];

export function RolesPermissionsPage() {
  const [tab, setTab] = useState<TabId>("roles");
  const [showForm, setShowForm] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  const { data: roles = [], isLoading: rolesLoading } = useListRolesQuery();
  const { data: permissions = [], isLoading: permsLoading } = useListPermissionsQuery();
  const { data: sites = [] } = useGetSitesQuery();
  const [createRole, { isLoading: creating }] = useCreateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    await createRole({ name: newRoleName.trim() });
    setNewRoleName("");
    setShowForm(false);
  };

  const permGroups = [...new Set(permissions.map((p) => p.group))];
  const totalUsers = roles.reduce((sum, r) => sum + roleUserCount(r.id), 0);

  const isLoading = rolesLoading || permsLoading;

  return (
    <div style={{ background: "#F3F7FF", minHeight: "100vh" }} className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Roles & Permissions</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
            Manage access control — who can do what, where, and in which modules
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: "#EEF2FB", color: "#4A57B9" }}>
          <Shield size={14} />
          <span className="text-xs font-semibold">{roles.length} Roles Active</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Roles" value={roles.length}
          sub="Configured in org" icon={Shield} color="#4A57B9"
        />
        <KpiCard
          label="Users Under RBAC" value={totalUsers}
          sub="Across all roles" icon={Users} color="#0284C7"
        />
        <KpiCard
          label="Permission Groups" value={permGroups.length}
          sub="Distinct permission sets" icon={Lock} color="#7C3AED"
        />
        <KpiCard
          label="Sites Configured" value={sites.length || 5}
          sub="With access restrictions" icon={Building2} color="#059669"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-2xl border p-1.5 overflow-x-auto"
        style={{ borderColor: "#E3E9F6" }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
            style={
              tab === id
                ? { background: "linear-gradient(135deg, #4A57B9, #6F80E8)", color: "#fff" }
                : { color: "#6B7280" }
            }
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border p-12 text-center text-sm"
          style={{ borderColor: "#E3E9F6", color: "#9CA3AF" }}>
          Loading…
        </div>
      ) : (
        <>
          {tab === "roles" && (
            <RolesTab
              roles={roles}
              onDelete={(id) => deleteRole(id)}
              creating={creating}
              showForm={showForm}
              setShowForm={setShowForm}
              newRoleName={newRoleName}
              setNewRoleName={setNewRoleName}
              onCreateSubmit={handleCreate}
            />
          )}
          {tab === "matrix" && <MatrixTab roles={roles} permissions={permissions} />}
          {tab === "sites" && <SiteAccessTab roles={roles} sites={sites} />}
          {tab === "departments" && <DepartmentAccessTab roles={roles} />}
          {tab === "modules" && <ModuleRestrictionsTab roles={roles} />}
        </>
      )}
    </div>
  );
}
