import { useNavigate } from "react-router";
import {
  Building2, Users, ClipboardList, Activity, ArrowRight, CheckCircle2, Clock, XCircle,
  Globe, Mail as MailIcon, Shield, CreditCard, TrendingUp, Bell, SlidersHorizontal,
} from "lucide-react";
import { useListTenantsQuery } from "@/features/superadmin/api/adminApi";
import { useGetOnboardingProcessingQueueQuery } from "@/features/onboarding/api/onboardingApi";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof Building2;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border p-5 flex items-center gap-4" style={{ borderColor: "#E3E9F6" }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "18" }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-bold" style={{ color: "#111827" }}>{value}</div>
        <div className="text-[13px] font-medium" style={{ color: "#6B7280" }}>{label}</div>
        {sub && <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{sub}</div>}
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  active: "#10B981",
  pending: "#F59E0B",
  suspended: "#EF4444",
  inactive: "#9CA3AF",
};

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  active: CheckCircle2,
  pending: Clock,
  suspended: XCircle,
  inactive: XCircle,
};

export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { data: tenants = [], isLoading: tenantsLoading } = useListTenantsQuery();
  const { data: queue } = useGetOnboardingProcessingQueueQuery();

  const active = tenants.filter((t) => t.status === "active").length;
  const pending = tenants.filter((t) => t.status === "pending").length;
  const queueCount = (queue as { items?: unknown[] } | undefined)?.items?.length ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Super Admin Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Platform-wide overview — all tenants, onboarding, system health</p>
        </div>
        <button
          onClick={() => navigate("/superadmin/onboarding-wizard")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
        >
          + New Tenant
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Total Tenants" value={tenantsLoading ? "…" : tenants.length} color="#4A57B9" />
        <StatCard icon={CheckCircle2} label="Active Tenants" value={active} color="#10B981" />
        <StatCard icon={Clock} label="Pending Approval" value={pending} sub="Awaiting review" color="#F59E0B" />
        <StatCard icon={ClipboardList} label="Processing Queue" value={queueCount} sub="Onboarding jobs" color="#8B5CF6" />
      </div>

      {/* Tenant list */}
      <div className="bg-white rounded-2xl border" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E9EEF8" }}>
          <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>Tenants</h2>
          <button
            onClick={() => navigate("/superadmin/tenants")}
            className="flex items-center gap-1 text-sm font-medium"
            style={{ color: "#4A57B9" }}
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {tenantsLoading ? (
          <div className="p-8 text-center text-sm" style={{ color: "#9CA3AF" }}>Loading tenants…</div>
        ) : tenants.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 className="w-10 h-10 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
            <p className="text-sm font-medium" style={{ color: "#6B7280" }}>No tenants yet</p>
            <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Use the 8-step wizard to create the first organisation.</p>
            <button
              onClick={() => navigate("/superadmin/onboarding-wizard")}
              className="mt-4 px-4 py-2 rounded-xl text-white text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
            >
              Create First Tenant
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#F3F4F6" }}>
            {tenants.slice(0, 8).map((tenant) => {
              const color = STATUS_COLORS[tenant.status] ?? "#9CA3AF";
              const Icon = STATUS_ICONS[tenant.status] ?? Activity;
              return (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/superadmin/tenants/${tenant.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
                      {tenant.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "#111827" }}>{tenant.name}</div>
                      <div className="text-xs" style={{ color: "#9CA3AF" }}>{tenant.org_code} · {tenant.plan}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                    <span className="text-xs font-medium capitalize" style={{ color }}>{tenant.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Tenant Management",   path: "/superadmin/tenants",       icon: Globe },
          { label: "Invitations",         path: "/superadmin/invitations",   icon: MailIcon },
          { label: "Users",               path: "/superadmin/users",         icon: Users },
          { label: "Roles & Permissions", path: "/superadmin/roles",         icon: Shield },
          { label: "Subscriptions",       path: "/superadmin/subscriptions", icon: CreditCard },
          { label: "Platform Analytics",  path: "/superadmin/analytics",     icon: TrendingUp },
          { label: "Notifications",       path: "/superadmin/notifications", icon: Bell },
          { label: "System Settings",     path: "/superadmin/settings",      icon: SlidersHorizontal },
        ].map(({ label, path, icon: Icon }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="bg-white rounded-xl border p-4 flex flex-col items-start gap-3 text-left hover:shadow-md transition-shadow"
            style={{ borderColor: "#E3E9F6" }}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#EEF2FB" }}>
              <Icon className="w-4 h-4" style={{ color: "#4A57B9" }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: "#111827" }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
