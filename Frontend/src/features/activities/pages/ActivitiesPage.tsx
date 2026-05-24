import { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

type ActivityType = "Incident" | "Permit" | "Audit" | "User" | "System";

interface Activity {
  id: number;
  type: ActivityType;
  description: string;
  user: string;
  time: string;
}

const TYPE_COLORS: Record<ActivityType, string> = {
  Incident: "#EF4444",
  Permit: "#4A57B9",
  Audit: "#10B981",
  User: "#F59E0B",
  System: "#6B7280",
};

const ALL_ACTIVITIES: Activity[] = [
  { id: 1, type: "Incident", description: "New incident reported at Site A — chemical spill", user: "James Carter", time: "2 minutes ago" },
  { id: 2, type: "Permit", description: "Hot Work Permit PERM-204 approved for Zone 8", user: "Sarah Kim", time: "8 minutes ago" },
  { id: 3, type: "Audit", description: "Monthly safety audit completed at Warehouse B", user: "David Osei", time: "22 minutes ago" },
  { id: 4, type: "User", description: "New user John Mensah added to Operations team", user: "Admin", time: "34 minutes ago" },
  { id: 5, type: "System", description: "Automated daily compliance report generated", user: "System", time: "1 hour ago" },
  { id: 6, type: "Incident", description: "Near-miss event recorded at Loading Bay 3", user: "Emma Watts", time: "1 hour ago" },
  { id: 7, type: "Permit", description: "Confined Space Entry Permit PERM-205 expired", user: "System", time: "2 hours ago" },
  { id: 8, type: "Audit", description: "PPE compliance checklist submitted — 98% pass rate", user: "Linda Shaw", time: "2 hours ago" },
  { id: 9, type: "User", description: "User Maria Lopez role updated to Site Manager", user: "Admin", time: "3 hours ago" },
  { id: 10, type: "System", description: "HRMS sync completed — 847 employee records updated", user: "System", time: "3 hours ago" },
  { id: 11, type: "Incident", description: "Injury incident closed — corrective action verified", user: "Tom Hardy", time: "4 hours ago" },
  { id: 12, type: "Permit", description: "Electrical Work Permit PERM-198 created for Substation", user: "Roy Evans", time: "5 hours ago" },
  { id: 13, type: "Audit", description: "Fire safety inspection scheduled for next Monday", user: "Admin", time: "6 hours ago" },
  { id: 14, type: "User", description: "Password reset requested for contractor account", user: "Helpdesk", time: "7 hours ago" },
  { id: 15, type: "System", description: "AI engine risk model retrained with latest incident data", user: "System", time: "9 hours ago" },
];

const FILTER_OPTIONS = ["All", "Incidents", "Permits", "Audits", "Users", "System"] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

const PAGE_SIZE = 8;

export function ActivitiesPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterOption>("All");
  const [page, setPage] = useState(1);

  const typeMap: Record<FilterOption, ActivityType | null> = {
    All: null,
    Incidents: "Incident",
    Permits: "Permit",
    Audits: "Audit",
    Users: "User",
    System: "System",
  };

  const filtered = ALL_ACTIVITIES.filter((a) => {
    const matchesSearch =
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.user.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeMap[typeFilter] === null || a.type === typeMap[typeFilter];
    return matchesSearch && matchesType;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Recent Activities</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>All platform activity across your organisation</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: "#E3E9F6", background: "#F9FAFB" }}
            placeholder="Search activities…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="px-3 py-2.5 rounded-xl border text-sm outline-none bg-white"
          style={{ borderColor: "#E3E9F6", color: "#374151" }}
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value as FilterOption); setPage(1); }}
        >
          {FILTER_OPTIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        {paged.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: "#6B7280" }}>No activities found.</p>
          </div>
        ) : (
          <ul>
            {paged.map((activity, idx) => (
              <li
                key={activity.id}
                className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                style={{ borderTop: idx === 0 ? "none" : "1px solid #E3E9F6" }}
              >
                {/* Colored dot */}
                <div className="mt-1.5 flex-shrink-0">
                  <span
                    className="block w-2.5 h-2.5 rounded-full"
                    style={{ background: TYPE_COLORS[activity.type] }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "#111827" }}>{activity.description}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                    <span style={{ color: "#6B7280", fontWeight: 600 }}>{activity.user}</span>
                    {" · "}{activity.time}
                  </p>
                </div>
                <span
                  className="flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: TYPE_COLORS[activity.type] + "18", color: TYPE_COLORS[activity.type] }}
                >
                  {activity.type}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "#6B7280" }}>
          Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold disabled:opacity-40 transition-colors hover:bg-gray-50"
            style={{ borderColor: "#E3E9F6", color: "#374151" }}
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold disabled:opacity-40 transition-colors hover:bg-gray-50"
            style={{ borderColor: "#E3E9F6", color: "#374151" }}
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
