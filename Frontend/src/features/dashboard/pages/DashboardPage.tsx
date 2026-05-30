import { useNavigate } from "react-router";
import { SiteInspectorDashboard } from "@/features/dashboard/components/SiteInspectorDashboard";
import { SiteEngineerDashboard } from "@/features/dashboard/components/SiteEngineerDashboard";
import { WorkerDashboard } from "@/features/dashboard/components/WorkerDashboard";
import { OrgAdminDashboard } from "@/features/dashboard/components/OrgAdminDashboard";
import { useAuth } from "@/app/context/AuthContext";

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = (user?.name || "User").trim().split(" ")[0] || "User";

  let content = <WorkerDashboard />;
  if (user?.role === "Site Inspector") {
    content = <SiteInspectorDashboard />;
  } else if (user?.role === "Site Engineer") {
    content = <SiteEngineerDashboard />;
  } else if (user?.role === "Admin") {
    content = <OrgAdminDashboard />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border px-5 py-4" style={{ borderColor: '#DCE4F3', background: '#FFFFFF' }}>
        <div>
          <h1>Welcome, {firstName}</h1>
          <p className="text-[14px] mt-1" style={{ color: '#64748B' }}>Focus on leading indicators and high-priority actions first.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[13px]" style={{ color: '#94A3B8' }}>Last updated: 2 min ago</span>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#5B6DE8' }} />
          </div>
        </div>
      </div>

      {content}
    </div>
  );
}