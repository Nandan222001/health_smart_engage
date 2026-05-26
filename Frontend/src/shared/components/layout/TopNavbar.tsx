import { Search, Bell, ChevronDown, ChevronRight, Moon, Sun, LogOut, Menu } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "@/app/context/AuthContext";
import { useState, useRef, useEffect } from "react";

const breadcrumbMap: Record<string, string> = {
  "/": "Dashboard",
  "/violations": "Incidents",
  "/near-miss": "Near By",
  "/actions": "Work",
  "/checklists": "Daily Checklists",
  "/compliance": "Compliance",
  "/sites-zones": "Sites & Zones",
  "/cameras-devices": "Cameras & Devices",
  "/policies": "Policies & Rules",
  "/users": "Users",
  "/ai-agent": "AI Agent",
  "/analytics": "Analytics",
  "/billing": "Billing",
  "/notifications": "Notifications",
  "/engagement": "Engagement",
  "/equipment-certification": "Assets",
  "/root-cause-analysis": "Risk",
  "/settings": "System Settings",
};

interface TopNavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSidebar: () => void;
}

export function TopNavbar({ darkMode, onToggleDarkMode, onOpenSidebar }: TopNavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentPage = breadcrumbMap[location.pathname] || "Dashboard";
  const orgLabel = user?.companyName?.trim() || "";

  const handleLogout = () => {
    logout();
    navigate("/auth/login", { replace: true });
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="min-h-16 flex items-center gap-3 px-3 py-2 sm:px-4 md:px-6 border-b bg-card" style={{ borderColor: darkMode ? '#1E3663' : '#DBE7FF' }}>
      <button
        type="button"
        onClick={onOpenSidebar}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg md:hidden"
        style={{ background: darkMode ? '#172846' : '#F3F7FF', color: darkMode ? '#AFC4EE' : '#4A5568' }}
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Breadcrumb */}
      <div className="flex-1 flex items-center gap-1.5 text-[13px]" style={{ color: '#9CA3AF' }}>
        <span className="hidden md:inline">HSE Intelligence</span>
        {orgLabel && (
          <>
            <ChevronRight className="w-3.5 h-3.5 hidden md:inline" />
            <span
              className="text-[11px] px-2 py-0.5 rounded-full"
              style={{
                background: darkMode ? '#11387D' : '#EFF6FF',
                color: '#1D4ED8',
                fontWeight: 600,
              }}
            >
              {orgLabel}
            </span>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span style={{ color: darkMode ? '#EEF4FF' : '#0A0A0A', fontWeight: 500 }}>{currentPage}</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Dark mode toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-lg transition-colors hover:bg-[#F3F7FF]"
          style={darkMode ? { background: '#172846' } : {}}
        >
          {darkMode ? <Sun className="w-4 h-4" style={{ color: '#93C5FD' }} /> : <Moon className="w-4 h-4" style={{ color: '#4A5568' }} />}
        </button>

        {/* Notification Bell */}
        <button className="relative p-2 rounded-lg transition-colors hover:bg-[#F3F7FF]" style={darkMode ? { background: '#172846' } : {}}>
          <Bell className="w-[18px] h-[18px]" style={{ color: darkMode ? '#AFC4EE' : '#4A5568' }} />
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#DC2626] text-white text-[9px] flex items-center justify-center" style={{ fontWeight: 600 }}>
            3
          </span>
        </button>

        {/* Separator */}
        <div className="hidden h-8 w-px sm:block" style={{ background: darkMode ? '#1E3663' : '#DBE7FF' }} />

        {/* User */}
        <div className="relative" ref={menuRef}>
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px]" style={{ background: 'linear-gradient(135deg, #0B3D91, #3B82F6)', fontWeight: 600 }}>
              {user?.initials || "JD"}
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full uppercase" style={{ background: darkMode ? '#11387D' : '#EFF6FF', color: '#1D4ED8', fontWeight: 600 }}>
              {user?.role || "Admin"}
            </span>
            <ChevronDown className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
          </div>

          {/* Dropdown menu */}
          {showUserMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-lg border py-2 z-50"
              style={{
                background: darkMode ? '#111811' : '#ffffff',
                borderColor: darkMode ? '#1E2E1E' : '#E2E8E2',
              }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: darkMode ? '#1E2E1E' : '#E2E8E2' }}>
                <div className="text-[13px]" style={{ color: darkMode ? '#F0F4F0' : '#0A0A0A', fontWeight: 500 }}>
                  {user?.name || "User"}
                </div>
                <div className="text-[12px]" style={{ color: '#9CA3AF' }}>
                  {user?.email || "user@organization.com"}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors hover:bg-red-50"
                style={{ color: '#DC2626' }}
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
