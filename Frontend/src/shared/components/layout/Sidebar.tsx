import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  House, BookOpenText, Users, CircleAlert, Briefcase,
  Lightbulb, ClipboardCheck, BarChart3, Building2,
  FolderClosed, AlertTriangle, Heart,
  LogOut, Shield, Settings, X, type LucideIcon,
  FileText, UserCheck, GraduationCap, ShieldAlert,
  LayoutDashboard, ChevronDown, ChevronRight,
  Database, BrainCircuit, GitBranch, Eye, RefreshCw,
  Mail as MailIcon, CreditCard, TrendingUp, Bell,
  SlidersHorizontal, ScrollText, MapPin, ShieldCheck, BookMarked,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

interface NavItem {
  name: string;
  icon: LucideIcon;
  path: string;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
  superAdminOnly?: boolean;
}

const MAIN_NAV: NavGroup[] = [
  {
    items: [
      { name: "Home", icon: House, path: "/" },
      { name: "Guide", icon: BookOpenText, path: "/checklists" },
      { name: "People", icon: Users, path: "/users" },
      { name: "Risk", icon: CircleAlert, path: "/root-cause-analysis" },
      { name: "Work", icon: Briefcase, path: "/actions" },
      { name: "AI Agent",        icon: Lightbulb,    path: "/ai-agent" },
      { name: "AI Intelligence", icon: BrainCircuit, path: "/ai-intelligence" },
      { name: "Workflow",        icon: GitBranch,    path: "/workflow" },
      { name: "Outputs",         icon: Eye,          path: "/outputs" },
      { name: "Learning Loop",   icon: RefreshCw,    path: "/learning" },
      { name: "Compliance", icon: ClipboardCheck, path: "/compliance" },
      { name: "Reports", icon: BarChart3, path: "/analytics" },
      { name: "Vendors", icon: Building2, path: "/vendors" },
      { name: "Assets", icon: FolderClosed, path: "/equipment-certification" },
      { name: "Incidents", icon: AlertTriangle, path: "/violations" },
      { name: "Engagement", icon: Heart, path: "/engagement" },
      { name: "Settings", icon: Settings, path: "/settings" },
    ],
  },
];

const ORG_ADMIN_NAV: NavGroup[] = [
  {
    label: "Organisation Admin",
    items: [
      { name: "Org Setup",        icon: Building2,    path: "/org-setup" },
      { name: "Sites & Zones",    icon: MapPin,        path: "/sites-zones" },
      { name: "Invitations",      icon: MailIcon,      path: "/admin/invitations" },
      { name: "Departments",      icon: Building2,     path: "/admin/departments" },
      { name: "HSE Managers",     icon: ShieldCheck,   path: "/admin/hse-managers" },
      { name: "Compliance",       icon: Shield,        path: "/compliance" },
      { name: "Workflows",        icon: GitBranch,     path: "/workflow" },
      { name: "Knowledge Centre", icon: BookMarked,    path: "/admin/documentation" },
      { name: "AI Intelligence",  icon: BrainCircuit,  path: "/ai-intelligence" },
      { name: "Reports",          icon: BarChart3,     path: "/analytics" },
    ],
  },
];

const OPERATIONS_NAV: NavGroup[] = [
  {
    label: "Operations",
    items: [
      { name: "Employees", icon: UserCheck, path: "/employees" },
      { name: "Permits", icon: FileText, path: "/permits" },
      { name: "Incident Log", icon: AlertTriangle, path: "/incidents" },
      { name: "Hazards & Risk", icon: ShieldAlert, path: "/hazards" },
      { name: "Training", icon: GraduationCap, path: "/training" },
      { name: "Audits & CAPA", icon: ClipboardCheck, path: "/audits" },
    ],
  },
];

const SUPERADMIN_NAV: NavGroup[] = [
  {
    label: "Super Admin",
    superAdminOnly: true,
    items: [
      { name: "SA Dashboard",        icon: LayoutDashboard,   path: "/superadmin" },
      { name: "Invitations",         icon: MailIcon,          path: "/superadmin/invitations" },
      { name: "Users",               icon: Users,             path: "/superadmin/users" },
      { name: "Roles & Permissions", icon: Shield,            path: "/superadmin/roles" },
      { name: "Platform Analytics",  icon: TrendingUp,        path: "/superadmin/analytics" },
      { name: "Notifications",       icon: Bell,              path: "/superadmin/notifications" },
      { name: "System Settings",     icon: SlidersHorizontal, path: "/superadmin/settings" },
      { name: "Audit Logs",          icon: ScrollText,        path: "/superadmin/audit-logs" },
      { name: "Storage Layer",       icon: Database,          path: "/superadmin/storage" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Org Admin — collapsible groups
// ---------------------------------------------------------------------------

interface OrgAdminSubItem { name: string; path: string; }
interface OrgAdminGroup  {
  icon: LucideIcon;
  items: OrgAdminSubItem[];
  /** Permission required to see this group. Undefined = always visible. */
  requiredPermission?: string;
  /** OrgInvitation module key that enables this group (empty allowed_modules = all visible). */
  moduleKey?: string;
}

const ORG_ADMIN_GROUPS: Record<string, OrgAdminGroup> = {
  "Home": {
    icon: House,
    // always visible — no permission or module required
    items: [
      { name: "Dashboard",         path: "/" },
      { name: "Overview",          path: "/overview" },
      { name: "Real-Time KPIs",    path: "/kpis" },
      { name: "Notifications",     path: "/notifications" },
      { name: "Recent Activities", path: "/activities" },
    ],
  },
  "People": {
    icon: Users,
    requiredPermission: "training:write",
    moduleKey: "people",
    items: [
      { name: "Users",                 path: "/users" },
      { name: "Workers",               path: "/workers" },
      { name: "Supervisors",           path: "/supervisors" },
      { name: "HSE Managers",          path: "/hse-managers" },
      { name: "Auditors",              path: "/auditors" },
      { name: "Contractors",           path: "/contractors" },
      { name: "Roles & Permissions",   path: "/roles-permissions" },
      { name: "Training & Competency", path: "/training" },
      { name: "Shift Management",      path: "/shift-management" },
    ],
  },
  "Vendors": {
    icon: Building2,
    requiredPermission: "vendors:read",
    moduleKey: "vendors",
    items: [
      { name: "Vendor List",       path: "/vendors" },
      { name: "Vendor Compliance", path: "/vendor-compliance" },
      { name: "Certifications",    path: "/vendor-certifications" },
      { name: "Vendor Risk Score", path: "/vendor-risk-score" },
    ],
  },
  "Assets": {
    icon: FolderClosed,
    requiredPermission: "assets:write",
    moduleKey: "assets",
    items: [
      { name: "Asset Register",        path: "/asset-register" },
      { name: "Asset Categories",      path: "/asset-categories" },
      { name: "Maintenance Logs",      path: "/maintenance-logs" },
      { name: "Equipment Inspections", path: "/equipment-inspections" },
      { name: "Asset Risk Mapping",    path: "/asset-risk-mapping" },
    ],
  },
  "Compliance": {
    icon: ClipboardCheck,
    requiredPermission: "audit:write",
    moduleKey: "compliance",
    items: [
      { name: "Compliance Dashboard", path: "/compliance-dashboard" },
      { name: "Standards & Policies", path: "/standards-policies" },
      { name: "Audit Management",     path: "/audit-management" },
      { name: "Inspections",          path: "/inspections" },
      { name: "CAPA",                 path: "/capa" },
      { name: "Regulatory Tracking",  path: "/regulatory-tracking" },
      { name: "Documentation",        path: "/documentation" },
    ],
  },
  "Risk": {
    icon: ShieldAlert,
    requiredPermission: "web:write",
    moduleKey: "risk",
    items: [
      { name: "Risk Assessments",  path: "/risk-assessments" },
      { name: "Hazard Register",   path: "/hazard-list" },
      { name: "Near Miss Reports", path: "/near-miss" },
      { name: "Risk Matrix",       path: "/risk-matrix" },
      { name: "High-Risk Areas",   path: "/high-risk-areas" },
    ],
  },
  "Work": {
    icon: Briefcase,
    requiredPermission: "permits:write",
    moduleKey: "work",
    items: [
      { name: "Permit To Work (PTW)", path: "/permits" },
      { name: "Permit Requests",      path: "/permit-requests" },
      { name: "Approval Queue",       path: "/approval-queue" },
      { name: "Active Work Permits",  path: "/active-work-permits" },
      { name: "Workflow Management",  path: "/workflow-management?tab=config" },
      { name: "Escalation Rules",     path: "/workflow-management?tab=escalation" },
      { name: "Site Operations",      path: "/sites-zones" },
    ],
  },
  "Incidents": {
    icon: AlertTriangle,
    requiredPermission: "web:read",
    moduleKey: "incidents",
    items: [
      { name: "Incident Management",  path: "/incident-management" },
      { name: "Incident Severity",    path: "/incident-severity" },
      { name: "Investigation Status", path: "/investigation-status" },
      { name: "Root Causes",          path: "/root-causes" },
    ],
  },
  "Intelligence": {
    icon: BrainCircuit,
    requiredPermission: "ai:read",
    moduleKey: "intelligence",
    items: [
      { name: "AI Dashboard",            path: "/ai-dashboard" },
      { name: "AI Assistant",            path: "/ai-agent" },
      { name: "Risk Predictions",        path: "/risk-predictions" },
      { name: "Compliance Intelligence", path: "/compliance-intelligence" },
      { name: "Safety Recommendations",  path: "/safety-recommendations" },
      { name: "Trend Analysis",          path: "/trend-analysis" },
      { name: "Benchmarking",            path: "/benchmarking" },
      { name: "AI Knowledge Search",     path: "/ai-agent?tab=search" },
    ],
  },
  "Data Management": {
    icon: Database,
    requiredPermission: "admin:write",
    moduleKey: "data",
    items: [
      { name: "Excel Upload",     path: "/data-management" },
      { name: "CSV Import",       path: "/csv-import" },
      { name: "API Integrations", path: "/api-integrations" },
      { name: "Import History",   path: "/import-history" },
      { name: "Validation Logs",  path: "/validation-logs" },
      { name: "Sync Status",      path: "/sync-status" },
    ],
  },
  "Reports": {
    icon: BarChart3,
    requiredPermission: "reports:export",
    moduleKey: "reports",
    items: [
      { name: "KPI Reports",        path: "/kpi-reports" },
      { name: "Incident Reports",   path: "/incident-reports" },
      { name: "Audit Reports",      path: "/audit-reports" },
      { name: "Compliance Reports", path: "/compliance-reports" },
      { name: "Risk Reports",       path: "/risk-reports" },
      { name: "Workforce Reports",  path: "/workforce-reports" },
      { name: "Management Reports", path: "/admin/management-reports" },
    ],
  },
  "Knowledge Hub": {
    icon: BookMarked,
    requiredPermission: "knowledge:write",
    moduleKey: "knowledge",
    items: [
      { name: "Documentation",    path: "/admin/documentation" },
      { name: "Resource Library", path: "/admin/documentation?tab=library" },
    ],
  },
  "Settings": {
    icon: Settings,
    requiredPermission: "admin:write",
    // always visible for full admins — moduleKey intentionally omitted
    items: [
      { name: "Organization Settings", path: "/admin/organization-settings" },
      { name: "Site Settings",         path: "/admin/site-settings" },
      { name: "Workflow Settings",     path: "/admin/workflow-settings" },
      { name: "Approval Matrix",       path: "/admin/approval-matrix" },
      { name: "Notification Settings", path: "/admin/notification-settings" },
      { name: "Security Settings",     path: "/admin/security-settings" },
      { name: "API Settings",          path: "/admin/api-settings" },
    ],
  },
  "Help": {
    icon: HelpCircle,
    // always visible — no permission or module required
    items: [
      { name: "Help Center",          path: "/help" },
      { name: "Raise Support Ticket", path: "/admin/support-tickets" },
      { name: "Contact Support",      path: "/contact-support" },
    ],
  },
};

// ---------------------------------------------------------------------------

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isSuperAdmin, logout } = useAuth();
  const [hovered, setHovered] = useState<string | null>(null);
  const [opsExpanded, setOpsExpanded] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const orgLabel = user?.companyName?.trim() || "";

  const isOrgAdmin = !isSuperAdmin && user?.role === "Admin";

  // Compute visible org admin groups dynamically based on backend permissions + modules
  const visibleOrgAdminGroups = useMemo(() => {
    if (!isOrgAdmin) return {};
    const perms = user?.permissions ?? [];
    const modules = user?.orgModules ?? [];
    // No permissions stored yet (e.g. Theta/Firebase login) → show everything
    const noRestrictions = perms.length === 0 && modules.length === 0;
    // Super-admin-level permission or write-all → show everything
    const hasAdminStar = perms.includes("admin:*");

    return Object.fromEntries(
      Object.entries(ORG_ADMIN_GROUPS).filter(([, group]) => {
        if (noRestrictions || hasAdminStar) return true;
        // Check permission gate
        const permOk = !group.requiredPermission || perms.includes(group.requiredPermission);
        // Check module gate — if orgModules is non-empty, group's moduleKey must be in it
        const moduleOk = !group.moduleKey || modules.length === 0 || modules.includes(group.moduleKey);
        return permOk && moduleOk;
      })
    ) as Record<string, OrgAdminGroup>;
  }, [isOrgAdmin, user?.permissions, user?.orgModules]);

  useEffect(() => {
    onCloseMobile?.();
  }, [location.pathname, onCloseMobile]);

  // Auto-expand ops section if on an ops route (for non-org-admin users)
  useEffect(() => {
    if (!isOrgAdmin) {
      const opsPaths = ["/employees", "/permits", "/incidents", "/incident-management", "/hazards", "/training", "/audits"];
      if (opsPaths.some((p) => location.pathname.startsWith(p))) {
        setOpsExpanded(true);
      }
    }
  }, [location.pathname, isOrgAdmin]);

  // Auto-expand the org admin group containing the current active route
  useEffect(() => {
    if (!isOrgAdmin) return;
    const pathname = location.pathname;
    for (const [groupName, group] of Object.entries(visibleOrgAdminGroups)) {
      const match = group.items.some((item) => {
        const base = item.path.split("?")[0];
        return base === "/" ? pathname === "/" : pathname.startsWith(base);
      });
      if (match) {
        setExpandedGroups((prev) => ({ ...prev, [groupName]: true }));
        break;
      }
    }
  }, [location.pathname, isOrgAdmin, visibleOrgAdminGroups]);

  const handleLogout = () => {
    logout();
    navigate("/auth/login", { replace: true });
  };

  const isActive = (path: string) => {
    if (path === "/" || path === "/superadmin") return location.pathname === path;
    return location.pathname.startsWith(path.split("?")[0]);
  };

  const isSubItemActive = (path: string) => {
    const [base, query] = path.split("?");
    if (query) {
      // Requires exact pathname + search match so query-param siblings don't all light up
      return location.pathname === base && location.search === `?${query}`;
    }
    // No query on this item: don't match when the current URL has a search string on the same base
    // (prevents "Workers /employees" being active while on "/employees?type=supervisor")
    if (location.search && location.pathname === base) {
      return false;
    }
    return base === "/" ? location.pathname === "/" : location.pathname.startsWith(base);
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const visibleGroups = isSuperAdmin ? SUPERADMIN_NAV : MAIN_NAV;

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/35 transition-opacity duration-200 lg:hidden ${mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onCloseMobile}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[250px] h-full flex flex-col border-r transition-transform duration-200 lg:static lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: 'linear-gradient(180deg, #FCFDFF 0%, #F4F7FD 100%)', borderColor: '#E3E9F6' }}
      >

        {/* Logo */}
        <div className="px-5 py-5 border-b" style={{ borderColor: '#E9EEF8' }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #505AB6, #7889F2)' }}>
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-[15px]" style={{ color: '#111827', fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>HSE Intelligence</span>
            </div>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md lg:hidden"
              style={{ color: '#63739B' }}
              onClick={onCloseMobile}
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {orgLabel && (
            <div className="mt-2.5">
              <span className="inline-block max-w-full truncate rounded-full px-2.5 py-0.5 text-[10px]" style={{ background: '#E8EEFF', color: '#3E4FB1', fontWeight: 700 }} title={orgLabel}>
                {orgLabel}
              </span>
            </div>
          )}
          {isSuperAdmin && (
            <div className="mt-1.5">
              <span className="inline-block rounded-full px-2.5 py-0.5 text-[10px]" style={{ background: '#FEF3C7', color: '#92400E', fontWeight: 700 }}>
                Super Admin
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-2">

          {/* Org Admin — collapsible groups (filtered by user permissions + orgModules) */}
          {isOrgAdmin && Object.entries(visibleOrgAdminGroups).map(([groupName, group]) => {
            const isOpen = !!expandedGroups[groupName];
            const GroupIcon = group.icon;
            const groupHasActive = group.items.some((item) => isSubItemActive(item.path));
            return (
              <div key={groupName}>
                <button
                  onClick={() => toggleGroup(groupName)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all"
                  style={{ background: isOpen || groupHasActive ? '#EEF2FB' : 'transparent' }}
                >
                  <GroupIcon className="w-[17px] h-[17px]" style={{ color: '#7C869C' }} />
                  <span className="text-[13px] flex-1 text-left font-medium" style={{ color: '#2F3A4F' }}>{groupName}</span>
                  {isOpen
                    ? <ChevronDown className="w-3.5 h-3.5" style={{ color: '#94A3B8' }} />
                    : <ChevronRight className="w-3.5 h-3.5" style={{ color: '#94A3B8' }} />}
                </button>

                {isOpen && (
                  <div className="mt-0.5 space-y-0.5 pl-3">
                    {group.items.map((item) => {
                      const active = isSubItemActive(item.path);
                      const hovKey = `oa-${groupName}-${item.name}`;
                      const isHovered = hovered === hovKey;
                      return (
                        <button
                          key={`${groupName}-${item.name}`}
                          onClick={() => { navigate(item.path); onCloseMobile?.(); }}
                          onMouseEnter={() => setHovered(hovKey)}
                          onMouseLeave={() => setHovered(null)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
                          style={active ? {
                            background: 'linear-gradient(135deg, #4A57B9 0%, #6F80E8 100%)',
                            boxShadow: '0 4px 12px rgba(79,94,190,0.22)',
                          } : { background: isHovered ? '#EEF2FB' : 'transparent' }}
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: active ? '#fff' : '#CBD5E1' }}
                          />
                          <span
                            className="text-[12px] flex-1 text-left"
                            style={{ color: active ? '#fff' : '#374151', fontWeight: active ? 600 : 400 }}
                          >
                            {item.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Main groups — shown to non-org-admin users (and superadmins via SUPERADMIN_NAV) */}
          {!isOrgAdmin && visibleGroups.map((group) => (
            <div key={group.label ?? "main-nav"}>
              {group.label && (
                <div className="px-3 py-1">
                  <span className="text-[10px] tracking-[1.1px] uppercase" style={{ color: group.superAdminOnly ? '#92400E' : '#94A3B8', fontWeight: 700 }}>
                    {group.label}
                  </span>
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.path);
                  const isHovered = hovered === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => { navigate(item.path); onCloseMobile?.(); }}
                      onMouseEnter={() => setHovered(item.name)}
                      onMouseLeave={() => setHovered(null)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group"
                      style={active ? {
                        background: group.superAdminOnly ? 'linear-gradient(135deg, #92400E 0%, #D97706 100%)' : 'linear-gradient(135deg, #4A57B9 0%, #6F80E8 100%)',
                        boxShadow: '0 6px 16px rgba(79, 94, 190, 0.28)',
                      } : { background: isHovered ? '#EEF2FB' : 'transparent' }}
                    >
                      <item.icon className="w-[17px] h-[17px] flex-shrink-0" style={{ color: active ? '#ffffff' : '#7C869C' }} />
                      <span className="text-[13px] flex-1 text-left" style={{ color: active ? '#ffffff' : '#2F3A4F', fontWeight: active ? 600 : 500 }}>
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Operations collapsible section — hidden for superadmins and org admins */}
          {!isSuperAdmin && !isOrgAdmin && <div>
            <button
              onClick={() => setOpsExpanded(!opsExpanded)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all"
              style={{ background: opsExpanded ? '#EEF2FB' : 'transparent' }}
            >
              <Briefcase className="w-[17px] h-[17px]" style={{ color: '#7C869C' }} />
              <span className="text-[13px] flex-1 text-left font-medium" style={{ color: '#2F3A4F' }}>Operations</span>
              {opsExpanded
                ? <ChevronDown className="w-3.5 h-3.5" style={{ color: '#94A3B8' }} />
                : <ChevronRight className="w-3.5 h-3.5" style={{ color: '#94A3B8' }} />}
            </button>

            {opsExpanded && (
              <div className="mt-0.5 space-y-0.5 pl-2">
                {OPERATIONS_NAV[0].items.map((item) => {
                  const active = isActive(item.path);
                  const isHovered = hovered === `ops-${item.name}`;
                  return (
                    <button
                      key={item.name}
                      onClick={() => { navigate(item.path); onCloseMobile?.(); }}
                      onMouseEnter={() => setHovered(`ops-${item.name}`)}
                      onMouseLeave={() => setHovered(null)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200"
                      style={active ? {
                        background: 'linear-gradient(135deg, #4A57B9 0%, #6F80E8 100%)',
                        boxShadow: '0 4px 12px rgba(79, 94, 190, 0.22)',
                      } : { background: isHovered ? '#EEF2FB' : 'transparent' }}
                    >
                      <item.icon className="w-[15px] h-[15px] flex-shrink-0" style={{ color: active ? '#ffffff' : '#9CA3AF' }} />
                      <span className="text-[12px] flex-1 text-left" style={{ color: active ? '#ffffff' : '#374151', fontWeight: active ? 600 : 500 }}>
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>}
        </nav>

        {/* User Profile */}
        <div className="px-4 py-4 border-t" style={{ borderColor: '#E4EAF7' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px]" style={{ background: 'linear-gradient(135deg, #505AB6, #7890F6)', fontWeight: 700 }}>
              {user?.initials || "US"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] truncate" style={{ color: '#111827', fontWeight: 600 }}>{user?.name || "User"}</div>
              <span className="text-[10px] px-2 py-0.5 rounded-full uppercase" style={{ background: '#E8EEFF', color: '#3E4FB1', fontWeight: 700 }}>
                {user?.role || "Admin"}
              </span>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-md transition-colors" style={{ background: '#F4F7FF' }} title="Sign out">
              <LogOut className="w-4 h-4" style={{ color: '#63739B' }} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
