import { useState } from "react";
import { Plus, Clock, Users, CalendarClock, X, Trash2, Loader2 } from "lucide-react";
import {
  useListShiftsQuery,
  useCreateShiftMutation,
  useDeleteShiftMutation,
  type Shift,
} from "@/features/shift-management/api/shiftApi";

type ShiftType = Shift["type"];
type ShiftStatus = Shift["status"];

const STATUS_STYLES: Record<ShiftStatus, { bg: string; color: string }> = {
  active:    { bg: "#D1FAE5", color: "#10B981" },
  scheduled: { bg: "#EEF2FF", color: "#4A57B9" },
  completed: { bg: "#F3F4F6", color: "#6B7280" },
};

const TYPE_COLORS: Record<ShiftType, string> = {
  Morning:   "#F59E0B",
  Afternoon: "#4A57B9",
  Night:     "#6B7280",
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
  const { data: shifts = [], isLoading } = useListShiftsQuery();
  const [createShift, { isLoading: isCreating }] = useCreateShiftMutation();
  const [deleteShift, { isLoading: isDeletingId }] = useDeleteShiftMutation();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeShifts   = shifts.filter((s) => s.status === "active").length;
  const totalWorkers   = shifts.filter((s) => s.status === "active").reduce((sum, s) => sum + (s.workers ?? 0), 0);
  const upcomingShifts = shifts.filter((s) => s.status === "scheduled").length;

  async function handleSave() {
    if (!form.name.trim() || !form.supervisor.trim()) return;
    await createShift({
      name:      form.name,
      type:      form.type,
      startTime: form.startTime,
      endTime:   form.endTime,
      supervisor: form.supervisor,
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this shift?")) return;
    setDeletingId(id);
    await deleteShift(id);
    setDeletingId(null);
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
          { label: "Active Shifts",          value: activeShifts,   color: "#10B981", icon: Clock },
          { label: "Total Workers on Shift", value: totalWorkers,   color: "#4A57B9", icon: Users },
          { label: "Upcoming Shifts",        value: upcomingShifts, color: "#F59E0B", icon: CalendarClock },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + "18" }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
            </div>
            <div className="text-3xl font-bold" style={{ color }}>
              {isLoading ? "—" : value}
            </div>
            <div className="text-xs font-medium mt-1" style={{ color: "#6B7280" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Add Shift Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>Add New Shift</h2>
            <button onClick={() => { setForm(EMPTY_FORM); setShowForm(false); }} className="text-gray-400 hover:text-gray-600">
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
              disabled={isCreating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-70"
              style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isCreating ? "Saving…" : "Save Shift"}
            </button>
            <button
              onClick={() => { setForm(EMPTY_FORM); setShowForm(false); }}
              className="px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-gray-50"
              style={{ borderColor: "#E3E9F6", color: "#374151" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Shifts Table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E9EEF8" }}>
          <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>All Shifts</h2>
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: "#EEF2FF", color: "#4A57B9" }}>
            {shifts.length} total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                {["Shift Name", "Type", "Start Time", "End Time", "Workers", "Supervisor", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm" style={{ color: "#9CA3AF" }}>
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" />
                    Loading shifts…
                  </td>
                </tr>
              ) : shifts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
                    <p className="text-sm" style={{ color: "#6B7280" }}>No shifts yet. Add your first shift above.</p>
                  </td>
                </tr>
              ) : (
                shifts.map((shift) => (
                  <tr key={shift.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#E3E9F6" }}>
                    <td className="px-5 py-3.5 font-semibold" style={{ color: "#111827" }}>{shift.name}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: (TYPE_COLORS[shift.type] ?? "#9CA3AF") + "18", color: TYPE_COLORS[shift.type] ?? "#9CA3AF" }}
                      >
                        {shift.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5" style={{ color: "#374151" }}>{shift.startTime ?? "—"}</td>
                    <td className="px-5 py-3.5" style={{ color: "#374151" }}>{shift.endTime ?? "—"}</td>
                    <td className="px-5 py-3.5 font-semibold" style={{ color: "#111827" }}>{shift.workers ?? 0}</td>
                    <td className="px-5 py-3.5" style={{ color: "#6B7280" }}>{shift.supervisor}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
                        style={{
                          background: (STATUS_STYLES[shift.status] ?? STATUS_STYLES.active).bg,
                          color:      (STATUS_STYLES[shift.status] ?? STATUS_STYLES.active).color,
                        }}
                      >
                        {shift.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleDelete(shift.id)}
                        disabled={deletingId === shift.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                        title="Delete shift"
                      >
                        {deletingId === shift.id
                          ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#DC2626" }} />
                          : <Trash2 className="w-4 h-4" style={{ color: "#DC2626" }} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
