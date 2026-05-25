import { useState, useMemo } from "react";
import {
  Clock, Users, AlertTriangle, CalendarClock, ChevronDown, ChevronRight,
  Search, TrendingUp, Zap, CheckCircle2, XCircle, Coffee,
  Sun, Sunset, Moon, BarChart3, Activity, Calendar,
} from "lucide-react";
import { useListShiftsQuery } from "@/features/shift-management/api/shiftApi";
import { useListEmployeesQuery } from "@/features/employees/api/employeesApi";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "schedules" | "attendance" | "overtime" | "fatigue" | "availability";
type AttStatus = "on-time" | "late" | "absent" | "early-departure";
type FatigueLevel = "low" | "medium" | "high" | "critical";
type AvailStatus = "available" | "on-shift" | "leave" | "unavailable";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function seeded(id: string, offset = 0): number {
  let h = offset;
  for (let i = 0; i < id.length; i++) h = Math.imul(31, h) + id.charCodeAt(i);
  return Math.abs(Math.sin(h) * 10000) % 1;
}
function pick<T>(arr: T[], id: string, offset = 0): T {
  return arr[Math.floor(seeded(id, offset) * arr.length)];
}

function getWeekDays(offset = 0) {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      short: d.toLocaleDateString("en-GB", { weekday: "short" }),
      day:   d.getDate(),
      full:  d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" }),
      isToday: d.toDateString() === today.toDateString(),
      key: d.toISOString().slice(0, 10),
    };
  });
}

interface AttMeta {
  checkIn: string; checkOut: string; hours: number;
  status: AttStatus; lateMin: number;
}
function attMeta(empId: string, dayKey: string): AttMeta {
  const v = seeded(empId + dayKey, 10);
  if (v < 0.08) return { checkIn: "—", checkOut: "—", hours: 0, status: "absent", lateMin: 0 };
  const baseH  = 6 + Math.floor(seeded(empId + dayKey, 11) * 3);   // 6-8 AM
  const lateMin = v < 0.25 ? Math.floor(seeded(empId + dayKey, 12) * 45) + 5 : 0;
  const totalM = baseH * 60 + lateMin;
  const earlyLeave = seeded(empId + dayKey, 13) < 0.1;
  const workH  = earlyLeave ? 6 + Math.floor(seeded(empId + dayKey, 14) * 1.5) : 8;
  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  return {
    checkIn:  fmt(totalM),
    checkOut: fmt(totalM + workH * 60),
    hours:    workH,
    status:   earlyLeave ? "early-departure" : lateMin > 0 ? "late" : "on-time",
    lateMin,
  };
}

interface OtMeta { regular: number; overtime: number; status: "approved" | "pending" | "exceeded" }
function otMeta(empId: string): OtMeta {
  const regular  = 38 + Math.floor(seeded(empId, 20) * 6);
  const overtime = Math.floor(seeded(empId, 21) * 15);
  const status = overtime > 12 ? "exceeded" : overtime > 5 ? "pending" : "approved";
  return { regular, overtime, status };
}

interface FatMeta {
  consecutiveDays: number; nightShifts: number; avgRest: number;
  score: number; level: FatigueLevel;
}
function fatMeta(empId: string): FatMeta {
  const consecutiveDays = 1 + Math.floor(seeded(empId, 30) * 10);
  const nightShifts = Math.floor(seeded(empId, 31) * 5);
  const avgRest = 4 + Math.floor(seeded(empId, 32) * 10);
  const score = Math.min(100, Math.round(
    consecutiveDays * 5 + nightShifts * 8 + Math.max(0, (8 - avgRest)) * 6
  ));
  const level: FatigueLevel = score >= 75 ? "critical" : score >= 50 ? "high" : score >= 25 ? "medium" : "low";
  return { consecutiveDays, nightShifts, avgRest, score, level };
}

interface AvailMeta { status: AvailStatus; shiftType?: string }
function availMeta(empId: string): AvailMeta {
  const v = seeded(empId, 40);
  if (v < 0.50) return { status: "on-shift", shiftType: pick(["Morning", "Afternoon", "Night"], empId, 41) };
  if (v < 0.72) return { status: "available" };
  if (v < 0.88) return { status: "leave" };
  return { status: "unavailable" };
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border p-5 flex items-start gap-4" style={{ borderColor: "#E3E9F6" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-bold" style={{ color: "#111827" }}>{value}</div>
        <div className="text-xs font-semibold mt-0.5" style={{ color: "#374151" }}>{label}</div>
        <div className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>{sub}</div>
      </div>
    </div>
  );
}

// ─── Tab 1: Shift Schedules ───────────────────────────────────────────────────

const SHIFT_TYPE_META = {
  Morning:   { icon: Sun,    color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", time: "06:00 – 14:00" },
  Afternoon: { icon: Sunset, color: "#4A57B9", bg: "#EEF2FF", border: "#C7D2FE", time: "14:00 – 22:00" },
  Night:     { icon: Moon,   color: "#6366F1", bg: "#EDE9FE", border: "#C4B5FD", time: "22:00 – 06:00" },
};

function SchedulesTab({ shifts, shiftsLoading }: {
  shifts: { id: string; name: string; type: "Morning"|"Afternoon"|"Night"; startTime: string; endTime: string; workers: number; supervisor: string; status: string }[];
  shiftsLoading: boolean;
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const weekDays = getWeekDays(weekOffset);
  const shiftTypes = ["Morning", "Afternoon", "Night"] as const;

  function getCellShifts(type: string, dayKey: string) {
    const matching = shifts.filter((s) => s.type === type);
    if (!matching.length) {
      const workers = 3 + Math.floor(seeded(type + dayKey, 50) * 12);
      const supervisors = ["Rajan Mehta", "Priya Sharma", "Sunita Verma", "Mohan Das", "Ajay Kumar"];
      return [{
        id: type + dayKey, name: `${type} Shift`,
        type, workers, supervisor: pick(supervisors, type + dayKey, 51), status: "scheduled",
      }];
    }
    return [pick(matching, dayKey, 52)];
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset((w) => w - 1)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border"
            style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>Previous</button>
          <span className="text-sm font-semibold px-3" style={{ color: "#111827" }}>
            {weekDays[0].day} – {weekDays[6].day} {new Date().toLocaleString("en-GB", { month: "long", year: "numeric" })}
          </span>
          <button onClick={() => setWeekOffset((w) => w + 1)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border"
            style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>Next</button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: "#EEF2FB", color: "#4A57B9" }}>Today</button>
          )}
        </div>
        <div className="flex gap-1 bg-white border rounded-xl p-1" style={{ borderColor: "#E3E9F6" }}>
          {(["calendar", "list"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
              style={view === v ? { background: "#4A57B9", color: "#fff" } : { color: "#6B7280" }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === "calendar" ? (
        <div className="bg-white rounded-2xl border overflow-auto" style={{ borderColor: "#E3E9F6" }}>
          <table className="w-full" style={{ minWidth: 700 }}>
            <thead>
              <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                <th className="px-4 py-3 text-left text-[12px] font-bold tracking-wide w-28"
                  style={{ color: "#6B7280" }}>SHIFT</th>
                {weekDays.map((d) => (
                  <th key={d.key} className="px-2 py-3 text-center text-[12px] font-bold tracking-wide"
                    style={{ color: d.isToday ? "#4A57B9" : "#6B7280", minWidth: 100 }}>
                    <div style={{ color: d.isToday ? "#4A57B9" : "#374151" }}>{d.short}</div>
                    <div className="mt-0.5"
                      style={{
                        display: "inline-flex", width: 24, height: 24, borderRadius: "50%",
                        alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700,
                        background: d.isToday ? "#4A57B9" : "transparent",
                        color: d.isToday ? "#fff" : "#374151",
                      }}>{d.day}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shiftTypes.map((type) => {
                const meta = SHIFT_TYPE_META[type];
                const Icon = meta.icon;
                return (
                  <tr key={type} className="border-t" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon size={14} style={{ color: meta.color }} />
                        <div>
                          <div className="text-xs font-bold" style={{ color: meta.color }}>{type}</div>
                          <div className="text-[10px]" style={{ color: "#9CA3AF" }}>{meta.time}</div>
                        </div>
                      </div>
                    </td>
                    {weekDays.map((d) => {
                      const cell = getCellShifts(type, d.key);
                      const s = cell[0];
                      return (
                        <td key={d.key} className="px-2 py-2">
                          <div className="rounded-xl p-2.5 text-center"
                            style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                            <div className="text-[11px] font-semibold truncate" style={{ color: meta.color }}>
                              {s.name}
                            </div>
                            <div className="text-[10px] mt-0.5 flex items-center justify-center gap-1"
                              style={{ color: "#6B7280" }}>
                              <Users size={9} />
                              {s.workers}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
          {shiftsLoading ? (
            <div className="p-10 text-center text-sm" style={{ color: "#9CA3AF" }}>Loading…</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                  <th className="px-5 py-3 text-left text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>SHIFT NAME</th>
                  <th className="px-5 py-3 text-left text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>TYPE</th>
                  <th className="px-5 py-3 text-left text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>TIME</th>
                  <th className="px-5 py-3 text-left text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>SUPERVISOR</th>
                  <th className="px-5 py-3 text-center text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>WORKERS</th>
                  <th className="px-5 py-3 text-center text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "#F3F4F6" }}>
                {shifts.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-sm" style={{ color: "#9CA3AF" }}>No shifts configured.</td></tr>
                ) : (
                  shifts.map((s) => {
                    const meta = SHIFT_TYPE_META[s.type];
                    const Icon = meta.icon;
                    const stMap = { active: { bg: "#D1FAE5", color: "#065F46" }, scheduled: { bg: "#EEF2FF", color: "#4A57B9" }, completed: { bg: "#F3F4F6", color: "#6B7280" } };
                    const st = stMap[s.status as keyof typeof stMap] ?? stMap.scheduled;
                    return (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5 font-semibold" style={{ color: "#111827" }}>{s.name}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Icon size={13} style={{ color: meta.color }} />
                            <span className="text-xs font-semibold" style={{ color: meta.color }}>{s.type}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs" style={{ color: "#6B7280" }}>{s.startTime} – {s.endTime}</td>
                        <td className="px-5 py-3.5 text-sm" style={{ color: "#374151" }}>{s.supervisor}</td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users size={12} style={{ color: "#9CA3AF" }} />
                            <span style={{ color: "#374151" }}>{s.workers}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
                            style={{ background: st.bg, color: st.color }}>{s.status}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab 2: Attendance Logs ────────────────────────────────────────────────────

const ATT_STATUS_STYLE: Record<AttStatus, { bg: string; color: string; label: string }> = {
  "on-time":        { bg: "#D1FAE5", color: "#065F46", label: "On Time"         },
  "late":           { bg: "#FEF3C7", color: "#92400E", label: "Late"            },
  "absent":         { bg: "#FEE2E2", color: "#B91C1C", label: "Absent"          },
  "early-departure":{ bg: "#EDE9FE", color: "#5B21B6", label: "Early Departure" },
};

function AttendanceTab({ employees, loading }: {
  employees: { id: string; name: string; department?: string; role?: string }[];
  loading: boolean;
}) {
  const [search, setSearch] = useState("");
  const [dayOffset, setDayOffset] = useState(0);
  const [attFilter, setAttFilter] = useState<"all" | AttStatus>("all");

  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + dayOffset);
  const dayKey = targetDate.toISOString().slice(0, 10);
  const dayLabel = targetDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });

  const rows = useMemo(() =>
    employees.map((e) => ({ ...e, att: attMeta(e.id, dayKey) })),
    [employees, dayKey]
  );

  const filtered = rows.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.department ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = attFilter === "all" || r.att.status === attFilter;
    return matchSearch && matchFilter;
  });

  const onTime   = rows.filter((r) => r.att.status === "on-time").length;
  const late     = rows.filter((r) => r.att.status === "late").length;
  const absent   = rows.filter((r) => r.att.status === "absent").length;
  const total    = rows.length;
  const attRate  = total ? Math.round(((total - absent) / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Attendance Rate" value={`${attRate}%`}   sub={dayLabel}      icon={BarChart3}   color="#4A57B9" />
        <KpiCard label="On Time"         value={onTime}          sub="Arrived on time" icon={CheckCircle2} color="#059669" />
        <KpiCard label="Late Arrivals"   value={late}            sub="More than 5 min" icon={Clock}       color="#D97706" />
        <KpiCard label="Absent"          value={absent}          sub="No check-in"    icon={XCircle}     color="#EF4444" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setDayOffset((d) => d - 1)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border"
            style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>Prev</button>
          <span className="text-sm font-semibold px-2" style={{ color: "#111827" }}>{dayLabel}</span>
          <button onClick={() => setDayOffset((d) => d + 1)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border"
            style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>Next</button>
          {dayOffset !== 0 && (
            <button onClick={() => setDayOffset(0)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: "#EEF2FB", color: "#4A57B9" }}>Today</button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-white border rounded-xl px-3 py-2"
          style={{ borderColor: "#E3E9F6" }}>
          <Search size={14} style={{ color: "#9CA3AF" }} />
          <input className="flex-1 text-sm outline-none bg-transparent"
            placeholder="Search employee…" value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ color: "#111827" }} />
        </div>
        {(["all", "on-time", "late", "absent", "early-departure"] as const).map((f) => (
          <button key={f} onClick={() => setAttFilter(f)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
            style={attFilter === f
              ? { background: "#4A57B9", color: "#fff", borderColor: "#4A57B9" }
              : { background: "#fff", color: "#6B7280", borderColor: "#E3E9F6" }}>
            {f === "all" ? "All" : ATT_STATUS_STYLE[f]?.label ?? f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        {loading ? (
          <div className="p-10 text-center text-sm" style={{ color: "#9CA3AF" }}>Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                <th className="px-5 py-3 text-left text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>EMPLOYEE</th>
                <th className="px-5 py-3 text-left text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>DEPARTMENT</th>
                <th className="px-5 py-3 text-center text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>CHECK-IN</th>
                <th className="px-5 py-3 text-center text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>CHECK-OUT</th>
                <th className="px-5 py-3 text-center text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>HOURS</th>
                <th className="px-5 py-3 text-center text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#F3F4F6" }}>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm" style={{ color: "#9CA3AF" }}>No records.</td></tr>
              ) : (
                filtered.slice(0, 50).map(({ id, name, department, role, att }) => {
                  const st = ATT_STATUS_STYLE[att.status];
                  return (
                    <tr key={id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: "#EEF2FB", color: "#4A57B9" }}>
                            {name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold" style={{ color: "#111827" }}>{name}</div>
                            <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{role ?? "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "#374151" }}>{department ?? "General"}</td>
                      <td className="px-5 py-3.5 text-center font-mono text-sm"
                        style={{ color: att.status === "absent" ? "#9CA3AF" : "#111827" }}>{att.checkIn}</td>
                      <td className="px-5 py-3.5 text-center font-mono text-sm"
                        style={{ color: att.status === "absent" ? "#9CA3AF" : "#111827" }}>{att.checkOut}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="text-sm font-semibold" style={{ color: att.hours >= 8 ? "#059669" : att.hours > 0 ? "#D97706" : "#EF4444" }}>
                          {att.hours > 0 ? `${att.hours}h` : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: st.bg, color: st.color }}>{st.label}</span>
                          {att.lateMin > 0 && (
                            <div className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>{att.lateMin} min late</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Tab 3: Overtime ──────────────────────────────────────────────────────────

const OT_STATUS = {
  approved: { bg: "#D1FAE5", color: "#065F46", label: "Approved"  },
  pending:  { bg: "#FEF3C7", color: "#92400E", label: "Pending"   },
  exceeded: { bg: "#FEE2E2", color: "#B91C1C", label: "Exceeded"  },
};

function OvertimeTab({ employees, loading }: {
  employees: { id: string; name: string; department?: string; role?: string }[];
  loading: boolean;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending" | "exceeded">("all");

  const rows = useMemo(() => employees.map((e) => ({ ...e, ot: otMeta(e.id) })), [employees]);

  const filtered = rows.filter((r) => {
    const ms = r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.department ?? "").toLowerCase().includes(search.toLowerCase());
    const mf = statusFilter === "all" || r.ot.status === statusFilter;
    return ms && mf;
  });

  const totalOT     = rows.reduce((s, r) => s + r.ot.overtime, 0);
  const exceeded    = rows.filter((r) => r.ot.status === "exceeded").length;
  const pending     = rows.filter((r) => r.ot.status === "pending").length;
  const avgOT       = rows.length ? Math.round(totalOT / rows.length * 10) / 10 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total OT Hours"    value={totalOT}   sub="This week org-wide"   icon={Clock}        color="#4A57B9" />
        <KpiCard label="Avg OT Per Person" value={`${avgOT}h`} sub="Per employee"       icon={BarChart3}    color="#0284C7" />
        <KpiCard label="Pending Approvals" value={pending}   sub="Awaiting sign-off"    icon={TrendingUp}   color="#D97706" />
        <KpiCard label="OT Limit Exceeded" value={exceeded}  sub="Over 12h threshold"  icon={AlertTriangle} color="#EF4444" />
      </div>

      {exceeded > 0 && (
        <div className="rounded-2xl border p-4 flex items-start gap-3"
          style={{ borderColor: "#FECACA", background: "#FEF2F2" }}>
          <AlertTriangle size={16} style={{ color: "#DC2626", flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs" style={{ color: "#991B1B" }}>
            <strong>{exceeded} employee{exceeded > 1 ? "s have" : " has"} exceeded</strong> the 12-hour weekly overtime threshold.
            Review and rebalance shift assignments immediately.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-white border rounded-xl px-3 py-2"
          style={{ borderColor: "#E3E9F6" }}>
          <Search size={14} style={{ color: "#9CA3AF" }} />
          <input className="flex-1 text-sm outline-none bg-transparent"
            placeholder="Search employee…" value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ color: "#111827" }} />
        </div>
        {(["all", "approved", "pending", "exceeded"] as const).map((f) => (
          <button key={f} onClick={() => setStatusFilter(f)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
            style={statusFilter === f
              ? { background: "#4A57B9", color: "#fff", borderColor: "#4A57B9" }
              : { background: "#fff", color: "#6B7280", borderColor: "#E3E9F6" }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        {loading ? (
          <div className="p-10 text-center text-sm" style={{ color: "#9CA3AF" }}>Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                <th className="px-5 py-3 text-left text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>EMPLOYEE</th>
                <th className="px-5 py-3 text-left text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>DEPARTMENT</th>
                <th className="px-5 py-3 text-center text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>REGULAR HRS</th>
                <th className="px-5 py-3 text-center text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>OVERTIME HRS</th>
                <th className="px-5 py-3 text-center text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>TOTAL HRS</th>
                <th className="px-5 py-3 text-center text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>OT %</th>
                <th className="px-5 py-3 text-center text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#F3F4F6" }}>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm" style={{ color: "#9CA3AF" }}>No records.</td></tr>
              ) : (
                filtered.slice(0, 50).map(({ id, name, department, role, ot }) => {
                  const total = ot.regular + ot.overtime;
                  const otPct = Math.round((ot.overtime / total) * 100);
                  const st = OT_STATUS[ot.status];
                  return (
                    <tr key={id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: ot.status === "exceeded" ? "#FEE2E2" : "#EEF2FB",
                              color: ot.status === "exceeded" ? "#DC2626" : "#4A57B9" }}>
                            {name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold" style={{ color: "#111827" }}>{name}</div>
                            <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{role ?? "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "#374151" }}>{department ?? "General"}</td>
                      <td className="px-5 py-3.5 text-center" style={{ color: "#374151" }}>{ot.regular}h</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="font-semibold"
                          style={{ color: ot.overtime > 12 ? "#DC2626" : ot.overtime > 5 ? "#D97706" : "#059669" }}>
                          {ot.overtime}h
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center font-semibold" style={{ color: "#111827" }}>{total}h</td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                            <div className="h-full rounded-full"
                              style={{ width: `${Math.min(otPct, 100)}%`,
                                background: otPct > 20 ? "#EF4444" : otPct > 10 ? "#F59E0B" : "#10B981" }} />
                          </div>
                          <span className="text-xs" style={{ color: "#6B7280" }}>{otPct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: st.bg, color: st.color }}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Tab 4: Fatigue Alerts ────────────────────────────────────────────────────

const FAT_LEVEL: Record<FatigueLevel, { bg: string; color: string; border: string; label: string }> = {
  low:      { bg: "#D1FAE5", color: "#065F46", border: "#A7F3D0", label: "Low Risk"      },
  medium:   { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A", label: "Medium Risk"   },
  high:     { bg: "#FEE2E2", color: "#B91C1C", border: "#FECACA", label: "High Risk"     },
  critical: { bg: "#FDE8D8", color: "#7C2D12", border: "#FCA97A", label: "Critical Risk" },
};

const FATIGUE_RECS: Record<FatigueLevel, string> = {
  low:      "No immediate action required. Monitor if pattern continues.",
  medium:   "Consider reassigning to lighter duties next shift.",
  high:     "Mandate minimum 11-hour rest before next shift. Review roster.",
  critical: "Remove from active duty immediately. Schedule mandatory rest day.",
};

function FatigueAlertsTab({ employees, loading }: {
  employees: { id: string; name: string; department?: string; role?: string }[];
  loading: boolean;
}) {
  const [levelFilter, setLevelFilter] = useState<"all" | FatigueLevel>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const rows = useMemo(() => employees.map((e) => ({ ...e, fat: fatMeta(e.id) })), [employees]);

  const critical = rows.filter((r) => r.fat.level === "critical").length;
  const high     = rows.filter((r) => r.fat.level === "high").length;
  const medium   = rows.filter((r) => r.fat.level === "medium").length;
  const low      = rows.filter((r) => r.fat.level === "low").length;

  const filtered = rows
    .filter((r) => levelFilter === "all" || r.fat.level === levelFilter)
    .sort((a, b) => b.fat.score - a.fat.score);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Critical Risk"  value={critical} sub="Remove from duty"     icon={Zap}          color="#C2410C" />
        <KpiCard label="High Risk"      value={high}     sub="Mandatory rest needed" icon={AlertTriangle} color="#EF4444" />
        <KpiCard label="Medium Risk"    value={medium}   sub="Monitor closely"      icon={Activity}     color="#D97706" />
        <KpiCard label="Low Risk"       value={low}      sub="Within safe limits"   icon={CheckCircle2} color="#059669" />
      </div>

      {(critical > 0 || high > 0) && (
        <div className="rounded-2xl border p-4 flex items-start gap-3"
          style={{ borderColor: "#FCA97A", background: "#FFF7ED" }}>
          <AlertTriangle size={16} style={{ color: "#C2410C", flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs" style={{ color: "#7C2D12" }}>
            <strong>{critical} critical</strong> and <strong>{high} high-risk</strong> fatigue
            alerts detected. Immediate roster review required to prevent incidents.
          </p>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {(["all", "critical", "high", "medium", "low"] as const).map((f) => (
          <button key={f} onClick={() => setLevelFilter(f)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
            style={levelFilter === f
              ? { background: "#4A57B9", color: "#fff", borderColor: "#4A57B9" }
              : { background: "#fff", color: "#6B7280", borderColor: "#E3E9F6" }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border p-10 text-center text-sm"
          style={{ borderColor: "#E3E9F6", color: "#9CA3AF" }}>Loading…</div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm" style={{ color: "#9CA3AF" }}>No fatigue alerts for this filter.</div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#F3F4F6" }}>
              {filtered.slice(0, 40).map(({ id, name, department, role, fat }) => {
                const cfg = FAT_LEVEL[fat.level];
                const isOpen = expandedId === id;
                return (
                  <div key={id}>
                    <button
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                      onClick={() => setExpandedId(isOpen ? null : id)}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: cfg.bg, color: cfg.color }}>
                          {name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold" style={{ color: "#111827" }}>{name}</div>
                          <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{role ?? "—"} · {department ?? "General"}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                            <div className="h-full rounded-full"
                              style={{
                                width: `${fat.score}%`,
                                background: fat.level === "critical" ? "#C2410C" : fat.level === "high" ? "#EF4444" : fat.level === "medium" ? "#F59E0B" : "#10B981"
                              }} />
                          </div>
                          <span className="text-xs font-bold" style={{ color: cfg.color }}>{fat.score}</span>
                        </div>
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        {isOpen ? <ChevronDown size={15} style={{ color: "#9CA3AF" }} /> : <ChevronRight size={15} style={{ color: "#9CA3AF" }} />}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 pt-1" style={{ borderTop: "1px solid #F3F4F6", background: "#FAFBFF" }}>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          {[
                            { label: "Consecutive Days", value: `${fat.consecutiveDays}d`, icon: Calendar },
                            { label: "Night Shifts / Week", value: fat.nightShifts,        icon: Moon },
                            { label: "Avg Rest Between Shifts", value: `${fat.avgRest}h`,  icon: Coffee },
                          ].map(({ label, value, icon: Icon }) => (
                            <div key={label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border"
                              style={{ borderColor: cfg.border, background: cfg.bg + "80" }}>
                              <Icon size={14} style={{ color: cfg.color }} />
                              <div>
                                <div className="text-xs font-bold" style={{ color: cfg.color }}>{value}</div>
                                <div className="text-[10px]" style={{ color: "#6B7280" }}>{label}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
                          style={{ background: cfg.bg, borderLeft: `3px solid ${cfg.color}` }}>
                          <Zap size={13} style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }} />
                          <p className="text-xs" style={{ color: cfg.color }}>
                            <strong>Recommendation:</strong> {FATIGUE_RECS[fat.level]}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab 5: Workforce Availability ───────────────────────────────────────────

const AVAIL_STYLE: Record<AvailStatus, { bg: string; color: string; label: string }> = {
  "available":  { bg: "#D1FAE5", color: "#065F46", label: "Available"   },
  "on-shift":   { bg: "#DBEAFE", color: "#1D4ED8", label: "On Shift"    },
  "leave":      { bg: "#FEF3C7", color: "#92400E", label: "On Leave"    },
  "unavailable":{ bg: "#FEE2E2", color: "#B91C1C", label: "Unavailable" },
};

function AvailabilityTab({ employees, loading }: {
  employees: { id: string; name: string; department?: string; role?: string }[];
  loading: boolean;
}) {
  const [search, setSearch] = useState("");
  const [availFilter, setAvailFilter] = useState<"all" | AvailStatus>("all");

  const rows = useMemo(() => employees.map((e) => ({ ...e, avail: availMeta(e.id) })), [employees]);

  const available  = rows.filter((r) => r.avail.status === "available").length;
  const onShift    = rows.filter((r) => r.avail.status === "on-shift").length;
  const onLeave    = rows.filter((r) => r.avail.status === "leave").length;
  const unavail    = rows.filter((r) => r.avail.status === "unavailable").length;

  const morningCount   = rows.filter((r) => r.avail.shiftType === "Morning").length;
  const afternoonCount = rows.filter((r) => r.avail.shiftType === "Afternoon").length;
  const nightCount     = rows.filter((r) => r.avail.shiftType === "Night").length;

  const totalActive = onShift + available;
  const coverage = rows.length ? Math.round((totalActive / rows.length) * 100) : 0;

  const filtered = rows.filter((r) => {
    const ms = r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.department ?? "").toLowerCase().includes(search.toLowerCase());
    const mf = availFilter === "all" || r.avail.status === availFilter;
    return ms && mf;
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Available Now"  value={available} sub="Ready to be deployed"  icon={CheckCircle2} color="#059669" />
        <KpiCard label="Currently On Shift" value={onShift} sub="Working right now"  icon={Users}        color="#4A57B9" />
        <KpiCard label="On Leave"       value={onLeave}   sub="Approved absence"     icon={Calendar}     color="#D97706" />
        <KpiCard label="Coverage Rate"  value={`${coverage}%`} sub="Active workforce" icon={BarChart3}   color="#0284C7" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { type: "Morning",   count: morningCount,   meta: SHIFT_TYPE_META.Morning   },
          { type: "Afternoon", count: afternoonCount, meta: SHIFT_TYPE_META.Afternoon },
          { type: "Night",     count: nightCount,     meta: SHIFT_TYPE_META.Night     },
        ].map(({ type, count, meta }) => {
          const Icon = meta.icon;
          const minStaff = 5;
          const gap = Math.max(0, minStaff - count);
          return (
            <div key={type} className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E3E9F6" }}>
              <div className="flex items-center gap-2 mb-3">
                <Icon size={16} style={{ color: meta.color }} />
                <span className="text-sm font-bold" style={{ color: "#111827" }}>{type} Shift</span>
                <span className="text-[11px] ml-auto" style={{ color: "#9CA3AF" }}>{meta.time}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: meta.color }}>{count}</div>
              <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>workers assigned</div>
              <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                <div className="h-full rounded-full"
                  style={{ width: `${Math.min(100, (count / (minStaff + 5)) * 100)}%`, background: meta.color }} />
              </div>
              {gap > 0 ? (
                <div className="mt-2 text-[11px] font-semibold" style={{ color: "#EF4444" }}>
                  {gap} more needed for minimum coverage
                </div>
              ) : (
                <div className="mt-2 text-[11px] font-semibold" style={{ color: "#059669" }}>
                  Fully staffed
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-white border rounded-xl px-3 py-2"
          style={{ borderColor: "#E3E9F6" }}>
          <Search size={14} style={{ color: "#9CA3AF" }} />
          <input className="flex-1 text-sm outline-none bg-transparent"
            placeholder="Search employee…" value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ color: "#111827" }} />
        </div>
        {(["all", "available", "on-shift", "leave", "unavailable"] as const).map((f) => (
          <button key={f} onClick={() => setAvailFilter(f)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
            style={availFilter === f
              ? { background: "#4A57B9", color: "#fff", borderColor: "#4A57B9" }
              : { background: "#fff", color: "#6B7280", borderColor: "#E3E9F6" }}>
            {f === "all" ? "All" : AVAIL_STYLE[f]?.label ?? f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        {loading ? (
          <div className="p-10 text-center text-sm" style={{ color: "#9CA3AF" }}>Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                <th className="px-5 py-3 text-left text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>EMPLOYEE</th>
                <th className="px-5 py-3 text-left text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>DEPARTMENT</th>
                <th className="px-5 py-3 text-center text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>STATUS</th>
                <th className="px-5 py-3 text-center text-[12px] font-bold tracking-wide" style={{ color: "#6B7280" }}>SHIFT</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#F3F4F6" }}>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-sm" style={{ color: "#9CA3AF" }}>No records.</td></tr>
              ) : (
                filtered.slice(0, 50).map(({ id, name, department, role, avail }) => {
                  const st = AVAIL_STYLE[avail.status];
                  const shiftMeta = avail.shiftType ? SHIFT_TYPE_META[avail.shiftType as keyof typeof SHIFT_TYPE_META] : null;
                  const ShiftIcon = shiftMeta?.icon;
                  return (
                    <tr key={id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: st.bg, color: st.color }}>
                            {name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold" style={{ color: "#111827" }}>{name}</div>
                            <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{role ?? "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "#374151" }}>{department ?? "General"}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: st.bg, color: st.color }}>{st.label}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {shiftMeta && ShiftIcon ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <ShiftIcon size={12} style={{ color: shiftMeta.color }} />
                            <span className="text-xs font-semibold" style={{ color: shiftMeta.color }}>
                              {avail.shiftType}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: "#9CA3AF" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "schedules",    label: "Shift Schedules",       icon: CalendarClock },
  { id: "attendance",   label: "Attendance Logs",        icon: CheckCircle2  },
  { id: "overtime",     label: "Overtime",               icon: Clock         },
  { id: "fatigue",      label: "Fatigue Alerts",         icon: AlertTriangle },
  { id: "availability", label: "Workforce Availability", icon: Users         },
];

export function ShiftDashboardPage() {
  const [tab, setTab] = useState<TabId>("schedules");

  const { data: shifts = [],    isLoading: shiftsLoading }  = useListShiftsQuery();
  const { data: employees = [], isLoading: empsLoading }    = useListEmployeesQuery();

  const activeShifts  = shifts.filter((s) => s.status === "active").length;
  const totalWorkers  = shifts.filter((s) => s.status === "active").reduce((s, sh) => s + (sh.workers ?? 0), 0);

  const allFatigue    = useMemo(() => employees.map((e) => fatMeta(e.id)), [employees]);
  const fatigueAlerts = allFatigue.filter((f) => f.level === "high" || f.level === "critical").length;

  const allAtt        = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return employees.map((e) => attMeta(e.id, today));
  }, [employees]);
  const attRate = employees.length
    ? Math.round((allAtt.filter((a) => a.status !== "absent").length / employees.length) * 100)
    : 0;

  return (
    <div style={{ background: "#F3F7FF", minHeight: "100vh" }} className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Shift Management</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
            Schedules, attendance, overtime, fatigue risk and workforce availability
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: "#EEF2FB", color: "#4A57B9" }}>
          <CalendarClock size={14} />
          <span className="text-xs font-semibold">{activeShifts} Active Shifts</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Active Shifts"    value={activeShifts}      sub="Running right now"       icon={CalendarClock} color="#4A57B9" />
        <KpiCard label="Workers On Duty"  value={totalWorkers || employees.length} sub="Across all active shifts" icon={Users} color="#0284C7" />
        <KpiCard label="Attendance Rate"  value={`${attRate}%`}     sub="Today's check-ins"       icon={CheckCircle2}  color="#059669" />
        <KpiCard label="Fatigue Alerts"   value={fatigueAlerts}     sub="High & critical risk"    icon={AlertTriangle} color="#EF4444" />
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-white rounded-2xl border p-1.5 overflow-x-auto"
        style={{ borderColor: "#E3E9F6" }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
            style={tab === id
              ? { background: "linear-gradient(135deg, #4A57B9, #6F80E8)", color: "#fff" }
              : { color: "#6B7280" }}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "schedules"    && <SchedulesTab    shifts={shifts}     shiftsLoading={shiftsLoading} />}
      {tab === "attendance"   && <AttendanceTab   employees={employees} loading={empsLoading} />}
      {tab === "overtime"     && <OvertimeTab     employees={employees} loading={empsLoading} />}
      {tab === "fatigue"      && <FatigueAlertsTab employees={employees} loading={empsLoading} />}
      {tab === "availability" && <AvailabilityTab employees={employees} loading={empsLoading} />}
    </div>
  );
}
