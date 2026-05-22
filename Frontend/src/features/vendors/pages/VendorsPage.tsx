import { VendorSidebarDashboard } from "@/features/dashboard/components/VendorSidebarDashboard";
import { useAuth } from "@/app/context/AuthContext";

export function VendorsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <VendorSidebarDashboard currentUserName={user?.name} />
    </div>
  );
}
