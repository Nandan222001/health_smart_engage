import { useState } from "react";
import {
  Building2,
  Users,
  AlertTriangle,
  ShieldCheck,
  MapPin,
  FileText,
  ClipboardList,
  Key,
  BarChart2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

const statCards = [
  { label: "Total Sites", value: "12", color: "#4A57B9" },
  { label: "Active Employees", value: "847", color: "#10B981" },
  { label: "Open Incidents", value: "3", color: "#EF4444" },
  { label: "Compliance Score", value: "94%", color: "#F59E0B" },
];

const quickLinks = [
  { label: "Sites & Zones", icon: MapPin, color: "#4A57B9" },
  { label: "Users", icon: Users, color: "#10B981" },
  { label: "Compliance", icon: ShieldCheck, color: "#F59E0B" },
  { label: "Permits", icon: Key, color: "#6F80E8" },
  { label: "Incidents", icon: AlertTriangle, color: "#EF4444" },
  { label: "Reports", icon: BarChart2, color: "#4A57B9" },
];

const systemHealth = [
  { label: "Database Status", status: "Healthy", icon: CheckCircle2, color: "#10B981" },
  { label: "AI Engine", status: "Active", icon: CheckCircle2, color: "#10B981" },
  { label: "Last Sync", status: "2 mins ago", icon: RefreshCw, color: "#4A57B9" },
];

const orgDetails = [
  { key: "Org Name", value: "HealthSmart Engage Ltd." },
  { key: "Industry", value: "Health & Safety" },
  { key: "Country", value: "United Kingdom" },
  { key: "Timezone", value: "Europe/London (GMT+1)" },
  { key: "Headquarters", value: "London, UK" },
  { key: "Plan", value: "Enterprise" },
];

export function OverviewPage() {
  const [_hover, setHover] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Organisation Overview</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Your organisation at a glance</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold" style={{ background: "#F0F4FF", color: "#4A57B9" }}>
          <Building2 className="w-4 h-4" />
          Admin View
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
            <div className="text-3xl font-bold" style={{ color }}>{value}</div>
            <div className="text-xs font-medium mt-1" style={{ color: "#6B7280" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Quick Links + System Health */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* Quick Links */}
        <div className="bg-white rounded-2xl border p-5 space-y-3" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>Quick Links</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {quickLinks.map(({ label, icon: Icon, color }) => (
              <button
                key={label}
                onMouseEnter={() => setHover(label)}
                onMouseLeave={() => setHover(null)}
                className="flex flex-col items-center gap-2 rounded-xl border py-4 px-3 text-sm font-semibold transition-colors hover:bg-gray-50"
                style={{ borderColor: "#E3E9F6", color: "#374151" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + "18" }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-2xl border p-5 space-y-3" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>System Health</h2>
          <div className="space-y-3">
            {systemHealth.map(({ label, status, icon: Icon, color }) => (
              <div key={label} className="flex items-center justify-between rounded-xl border px-4 py-3" style={{ borderColor: "#E3E9F6" }}>
                <span className="text-sm font-medium" style={{ color: "#374151" }}>{label}</span>
                <div className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4" style={{ color }} />
                  <span className="text-sm font-semibold" style={{ color }}>{status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Organisation Details */}
      <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
        <h2 className="text-[15px] font-bold mb-4" style={{ color: "#111827" }}>Organisation Details</h2>
        <table className="w-full text-sm">
          <tbody>
            {orgDetails.map(({ key, value }, idx) => (
              <tr
                key={key}
                className="hover:bg-gray-50"
                style={{ borderTop: idx === 0 ? "none" : "1px solid #E3E9F6" }}
              >
                <td className="py-3 pr-6 font-semibold w-48" style={{ color: "#374151" }}>{key}</td>
                <td className="py-3" style={{ color: "#6B7280" }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
