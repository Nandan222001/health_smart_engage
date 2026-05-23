import { useEffect, useState } from "react";
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
  SlidersHorizontal, ScrollText,
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
      { name: "Org Setup", icon: Building2, path: "/org-setup" },
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
      { name: "Subscriptions",       icon: CreditCard,        path: "/superadmin/subscriptions" },
      { name: "Platform Analytics",  icon: TrendingUp,        path: "/superadmin/analytics" },
      { name: "Notifications",       icon: Bell,              path: "/superadmin/notifications" },
      { name: "System Settings",     icon: SlidersHorizontal, path: "/superadmin/settings" },
      { name: "Audit Logs",          icon: ScrollText,        path: "/superadmin/audit-logs" },
      { name: "Storage Layer",       icon: Database,          path: "/superadmin/storage" },
    ],
  },
];

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
  const orgLabel = (user?.companyName || user?.orgCode || "").trim();

  useEffect(() => {
    onCloseMobile?.();
  }, [location.pathname, onCloseMobile]);

  // Auto-expand ops section if on an ops route
  useEffect(() => {
    const opsPaths = ["/employees", "/permits", "/incidents", "/hazards", "/training", "/audits"];
    if (opsPaths.some((p) => location.pathname.startsWith(p))) {
      setOpsExpanded(true);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/auth/login", { replace: true });
  };

  const isActive = (path: string) => {
    if (path === "/" || path === "/superadmin") return location.pathname === path;
    return location.pathname.startsWith(path.split("?")[0]);
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
          {/* Main groups */}
          {visibleGroups.map((group) => (
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

          {/* Operations collapsible section — hidden for super admins */}
          {!isSuperAdmin && <div>
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
