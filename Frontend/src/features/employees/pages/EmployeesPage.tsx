import { useState } from "react";
import { Users, Search, Plus } from "lucide-react";
import { useSearchParams } from "react-router";
import { useListEmployeesQuery } from "@/features/employees/api/employeesApi";
import type { Employee } from "@/features/employees/api/employeesApi";

const TYPE_CONFIG: Record<string, { label: string; roleKeywords: string[]; color: string; bg: string }> = {
  supervisor: {
    label: "Supervisors",
    roleKeywords: ["supervisor"],
    color: "#6F80E8",
    bg: "#EEF2FF",
  },
  "hse-manager": {
    label: "HSE Managers",
    roleKeywords: ["hse manager", "hse", "health", "safety manager"],
    color: "#10B981",
    bg: "#D1FAE5",
  },
  auditor: {
    label: "Auditors",
    roleKeywords: ["auditor", "audit"],
    color: "#F59E0B",
    bg: "#FEF3C7",
  },
};

function matchesType(employee: Employee, type: string): boolean {
  const config = TYPE_CONFIG[type];
  if (!config) return true;
  const role = (employee.role || "").toLowerCase();
  return config.roleKeywords.some((kw) => role.includes(kw));
}

function EmployeeRow({ employee }: { employee: Employee }) {
  const initials = employee.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <tr className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F3F4F6" }}>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
            {initials}
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "#111827" }}>{employee.name}</div>
            <div className="text-xs" style={{ color: "#9CA3AF" }}>{employee.email}</div>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{employee.department || "—"}</td>
      <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{employee.role || "—"}</td>
      <td className="px-5 py-3.5">
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ background: employee.status === "active" ? "#D1FAE5" : "#F3F4F6", color: employee.status === "active" ? "#10B981" : "#9CA3AF" }}>
          {employee.status}
        </span>
      </td>
      <td className="px-5 py-3.5 text-sm" style={{ color: "#9CA3AF" }}>{employee.joined_at ? new Date(employee.joined_at).toLocaleDateString() : "—"}</td>
    </tr>
  );
}

export function EmployeesPage() {
  const { data: employees = [], isLoading } = useListEmployeesQuery();
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "";

  const typeConfig = TYPE_CONFIG[type] ?? null;
  const pageTitle = typeConfig?.label ?? "Workers";

  const typeFiltered = type ? employees.filter((e) => matchesType(e, type)) : employees;

  const filtered = typeFiltered.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    (e.department ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const active = typeFiltered.filter((e) => e.status === "active").length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>{pageTitle}</h1>
            {typeConfig && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: typeConfig.bg, color: typeConfig.color }}>
                {pageTitle}
              </span>
            )}
          </div>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
            {active} active of {typeFiltered.length} total
            {type && <span style={{ color: "#9CA3AF" }}> (filtered from {employees.length} employees)</span>}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
          <Plus className="w-4 h-4" /> Add {typeConfig?.label.replace(/s$/, "") ?? "Employee"}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
        <input
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
          style={{ borderColor: "#E3E9F6", background: "#F9FAFB" }}
          placeholder={`Search ${pageTitle.toLowerCase()}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
              {["Employee", "Department", "Role", "Status", "Joined"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-10 text-sm" style={{ color: "#9CA3AF" }}>Loading {pageTitle.toLowerCase()}…</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12">
                  <Users className="w-8 h-8 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
                  <p className="text-sm" style={{ color: "#6B7280" }}>No {pageTitle.toLowerCase()} found</p>
                  {type && (
                    <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                      No employees with a matching "{typeConfig?.roleKeywords[0]}" role
                    </p>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((e) => <EmployeeRow key={e.id} employee={e} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
