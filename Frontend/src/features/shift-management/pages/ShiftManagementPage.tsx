import { useState } from "react";
import { Plus, Clock, Users, CalendarClock, X } from "lucide-react";

type ShiftType = "Morning" | "Afternoon" | "Night";
type ShiftStatus = "Active" | "Scheduled" | "Completed";

interface Shift {
  id: number;
  name: string;
  type: ShiftType;
  startTime: string;
  endTime: string;
  workers: number;
  supervisor: string;
  status: ShiftStatus;
}

const INITIAL_SHIFTS: Shift[] = [
  { id: 1, name: "Alpha Morning", type: "Morning", startTime: "06:00", endTime: "14:00", workers: 84, supervisor: "James Carter", status: "Active" },
  { id: 2, name: "Beta Afternoon", type: "Afternoon", startTime: "14:00", endTime: "22:00", workers: 91, supervisor: "Sarah Kim", status: "Active" },
  { id: 3, name: "Gamma Night", type: "Night", startTime: "22:00", endTime: "06:00", workers: 72, supervisor: "David Osei", status: "Active" },
  { id: 4, name: "Delta Morning", type: "Morning", startTime: "06:00", endTime: "14:00", workers: 55, supervisor: "Emma Watts", status: "Scheduled" },
  { id: 5, name: "Epsilon Afternoon", type: "Afternoon", startTime: "14:00", endTime: "22:00", workers: 63, supervisor: "Roy Evans", status: "Scheduled" },
];

const STATUS_STYLES: Record<ShiftStatus, { bg: string; color: string }> = {
  Active: { bg: "#D1FAE5", color: "#10B981" },
  Scheduled: { bg: "#EEF2FF", color: "#4A57B9" },
  Completed: { bg: "#F3F4F6", color: "#6B7280" },
};

const TYPE_COLORS: Record<ShiftType, string> = {
  Morning: "#F59E0B",
  Afternoon: "#4A57B9",
  Night: "#6B7280",
};

interface FormState {
  name: string;
  type: ShiftType;
  startTime: string;
  endTime: string;
  supervisor: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  type: "Morning",
  startTime: "06:00",
  endTime: "14:00",
  supervisor: "",
};

export function ShiftManagementPage() {
  const [shifts, setShifts] = useState<Shift[]>(INITIAL_SHIFTS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const activeShifts = shifts.filter((s) => s.status === "Active").length;
  const totalWorkers = shifts
    .filter((s) => s.status === "Active")
    .reduce((sum, s) => sum + s.workers, 0);
  const upcomingShifts = shifts.filter((s) => s.status === "Scheduled").length;

  function handleSave() {
    if (!form.name.trim() || !form.supervisor.trim()) return;
    const newShift: Shift = {
      id: shifts.length + 1,
      name: form.name,
      type: form.type,
      startTime: form.startTime,
      endTime: form.endTime,
      workers: 0,
      supervisor: form.supervisor,
      status: "Scheduled",
    };
    setShifts((prev) => [...prev, newShift]);
    setForm(EMPTY_FORM);
    setShowForm(false);
  }

  function handleCancel() {
    setForm(EMPTY_FORM);
    setShowForm(false);
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Shift Management</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Manage and schedule workforce shifts</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
        >
          <Plus className="w-4 h-4" />
          Add Shift
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Shifts", value: activeShifts, color: "#10B981", icon: Clock },
          { label: "Total Workers on Shift", value: totalWorkers, color: "#4A57B9", icon: Users },
          { label: "Upcoming Shifts", value: upcomingShifts, color: "#F59E0B", icon: CalendarClock },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + "18" }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
            </div>
            <div className="text-3xl font-bold" style={{ color }}>{value}</div>
            <div className="text-xs font-medium mt-1" style={{ color: "#6B7280" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Add Shift Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>Add New Shift</h2>
            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: "#374151" }}>Shift Name</label>
              <input
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#E3E9F6" }}
                placeholder="e.g. Zeta Morning"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: "#374151" }}>Type</label>
              <select
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none bg-white"
                style={{ borderColor: "#E3E9F6" }}
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ShiftType }))}
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Night">Night</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: "#374151" }}>Start Time</label>
              <input
                type="time"
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#E3E9F6" }}
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: "#374151" }}>End Time</label>
              <input
                type="time"
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#E3E9F6" }}
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: "#374151" }}>Supervisor</label>
              <input
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#E3E9F6" }}
                placeholder="Supervisor name"
                value={form.supervisor}
                onChange={(e) => setForm((f) => ({ ...f, supervisor: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
            >
              Save Shift
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl border text-sm font-semibold transition-colors hover:bg-gray-50"
              style={{ borderColor: "#E3E9F6", color: "#374151" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Shifts Table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#E9EEF8" }}>
          <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>All Shifts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                {["Shift Name", "Type", "Start Time", "End Time", "Workers", "Supervisor", "Status"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => (
                <tr key={shift.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#E3E9F6" }}>
                  <td className="px-5 py-3.5 font-semibold" style={{ color: "#111827" }}>{shift.name}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: TYPE_COLORS[shift.type] + "18", color: TYPE_COLORS[shift.type] }}
                    >
                      {shift.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5" style={{ color: "#374151" }}>{shift.startTime}</td>
                  <td className="px-5 py-3.5" style={{ color: "#374151" }}>{shift.endTime}</td>
                  <td className="px-5 py-3.5 font-semibold" style={{ color: "#111827" }}>{shift.workers}</td>
                  <td className="px-5 py-3.5" style={{ color: "#6B7280" }}>{shift.supervisor}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        background: STATUS_STYLES[shift.status].bg,
                        color: STATUS_STYLES[shift.status].color,
                      }}
                    >
                      {shift.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
