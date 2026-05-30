import { useState, useMemo } from "react";
import {
  Users, Search, Shield, Clock, BookOpen, AlertTriangle,
  CheckCircle2, XCircle, ChevronRight, Activity, HardHat,
  UserCheck, CalendarClock, Zap, TrendingUp, MapPin, Eye,
  Filter, Download, RefreshCw,
} from "lucide-react";
import { useListEmployeesQuery } from "@/features/employees/api/employeesApi";
import { useListShiftsQuery } from "@/features/shift-management/api/shiftApi";

// ── Types ──────────────────────────────────────────────────────────────────

type TabId = "overview" | "shifts" | "attendance" | "training" | "risk" | "ppe";

interface WorkerStats {
  total: number;
  active: number;
  onShift: number;
  ppeCompliant: number;
  trainingCompliant: number;
}

// ── Mock helpers (deterministic per worker id) ────────────────────────────

const ZONES = ["Zone A – Production", "Zone B – Loading", "Zone C – Chemical", "Zone D – Maintenance", "Zone E – Office"];
const PPE_ITEMS = ["Helmet", "Gloves", "Safety Boots", "Hi-Vis Vest", "Eye Protection"];
const TRAINING_MODULES = ["Fire Safety", "Chemical Handling", "First Aid", "Height Safety", "PPE Usage"];
const RISK_LEVELS: Array<{ label: string; color: string; bg: string }> = [
  { label: "Low",    color: "#10B981", bg: "#D1FAE5" },
  { label: "Medium", color: "#F59E0B", bg: "#FEF3C7" },
  { label: "High",   color: "#EF4444", bg: "#FEE2E2" },
];

function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function workerSeed(id: string): number {
  return id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

function getWorkerMeta(id: string) {
  const s = workerSeed(id);
  const riskIdx = Math.floor(seededRandom(s) * 3);
  const zoneIdx = Math.floor(seededRandom(s + 1) * ZONES.length);
  const attendanceDays = Math.floor(seededRandom(s + 2) * 5) + 18; // 18–22
  const ppeScore = Math.floor(seededRandom(s + 3) * 30) + 70; // 70–100
  const trainingDone = Math.floor(seededRandom(s + 4) * 3) + 3; // 3–5
  const checkedIn = seededRandom(s + 5) > 0.2;
  const checkInHour = Math.floor(seededRandom(s + 6) * 4) + 6; // 6–9
  const checkInMin = Math.floor(seededRandom(s + 7) * 60);
  const missingPpe = PPE_ITEMS.filter((_, i) => seededRandom(s + 10 + i) > (ppeScore / 100 + 0.1));
  return {
    risk: RISK_LEVELS[riskIdx],
    zone: ZONES[zoneIdx],
    attendanceDays,
    ppeScore,
    trainingDone,
    trainingTotal: TRAINING_MODULES.length,
    checkedIn,
    checkInTime: checkedIn ? `${String(checkInHour).padStart(2, "0")}:${String(checkInMin).padStart(2, "0")}` : null,
    missingPpe,
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color, bg }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string; bg: string;
}) {
  return (
    <div className="bg-white rounded-2xl border p-5 flex items-start gap-4" style={{ borderColor: "#E3E9F6" }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <div className="text-[22px] font-bold leading-none" style={{ color: "#111827" }}>{value}</div>
        <div className="text-[12px] font-semibold mt-1" style={{ color: "#6B7280" }}>{label}</div>
        {sub && <div className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>{sub}</div>}
      </div>
    </div>
  );
}

function StatusBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold" style={{ color, background: bg }}>
      {label}
    </span>
  );
}

function ProgressBar({ value, color = "#4A57B9" }: { value: number; color?: string }) {
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

function WorkerAvatar({ name }: { name: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
      style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
      {initials}
    </div>
  );
}

// ── Tab: Overview ─────────────────────────────────────────────────────────

function OverviewTab({ employees, stats }: { employees: ReturnType<typeof useListEmployeesQuery>["data"]; stats: WorkerStats }) {
  const [search, setSearch] = useState("");
  const list = employees ?? [];

  const filtered = list.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.department ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
        <input
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
          style={{ borderColor: "#E3E9F6", background: "#F9FAFB" }}
          placeholder="Search workers by name or department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "#F1F5F9", background: "#F8FAFF" }}>
          <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "#94A3B8" }}>
            {filtered.length} Workers
          </span>
          <span className="text-[11px]" style={{ color: "#94A3B8" }}>Active · Zone · Risk · PPE</span>
        </div>
        <div className="divide-y" style={{ borderColor: "#F8FAFF" }}>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-8 h-8 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
              <p className="text-sm" style={{ color: "#6B7280" }}>No workers found</p>
            </div>
          ) : filtered.map((emp) => {
            const meta = getWorkerMeta(emp.id);
            return (
              <div key={emp.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                <WorkerAvatar name={emp.name} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{emp.name}</div>
                  <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{emp.department || "—"} · {emp.role || "Worker"}</div>
                </div>
                <div className="hidden sm:block text-[12px]" style={{ color: "#6B7280" }}>
                  <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{meta.zone.split("–")[0].trim()}</div>
                </div>
                <StatusBadge
                  label={meta.checkedIn ? "On Site" : "Absent"}
                  color={meta.checkedIn ? "#10B981" : "#6B7280"}
                  bg={meta.checkedIn ? "#D1FAE5" : "#F3F4F6"}
                />
                <StatusBadge label={meta.risk.label + " Risk"} color={meta.risk.color} bg={meta.risk.bg} />
                <div className="text-right hidden md:block">
                  <div className="text-[12px] font-bold" style={{ color: "#111827" }}>{meta.ppeScore}%</div>
                  <div className="text-[10px]" style={{ color: "#94A3B8" }}>PPE</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Shift Assignments ────────────────────────────────────────────────

function ShiftsTab({ employees }: { employees: ReturnType<typeof useListEmployeesQuery>["data"] }) {
  const { data: shifts = [], isLoading } = useListShiftsQuery();
  const list = employees ?? [];

  const SHIFT_TYPE_COLORS: Record<string, string> = {
    Morning: "#F59E0B", Afternoon: "#4A57B9", Night: "#6366F1",
  };
  const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
    active:    { bg: "#D1FAE5", color: "#10B981" },
    scheduled: { bg: "#EEF2FF", color: "#4A57B9" },
    completed: { bg: "#F3F4F6", color: "#6B7280" },
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><RefreshCw className="w-5 h-5 animate-spin" style={{ color: "#94A3B8" }} /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Active Shifts", value: shifts.filter(s => s.status === "active").length, color: "#10B981", bg: "#D1FAE5" },
          { label: "Scheduled", value: shifts.filter(s => s.status === "scheduled").length, color: "#4A57B9", bg: "#EEF2FF" },
          { label: "Completed Today", value: shifts.filter(s => s.status === "completed").length, color: "#6B7280", bg: "#F3F4F6" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: "#E3E9F6" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
              <CalendarClock className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-[20px] font-bold" style={{ color: "#111827" }}>{s.value}</div>
              <div className="text-[11px] font-semibold" style={{ color: "#6B7280" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {shifts.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: "#E3E9F6" }}>
          <CalendarClock className="w-10 h-10 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
          <p className="text-sm font-medium" style={{ color: "#6B7280" }}>No shifts configured yet</p>
          <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Go to Shift Management to create shifts</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shifts.map((shift) => {
            const style = STATUS_STYLES[shift.status] ?? STATUS_STYLES.scheduled;
            const typeColor = SHIFT_TYPE_COLORS[shift.type] ?? "#4A57B9";
            const assignedWorkers = list.slice(0, shift.workers ?? 0);
            return (
              <div key={shift.id} className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: typeColor }} />
                      <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>{shift.name}</h3>
                      <StatusBadge label={shift.status.toUpperCase()} color={style.color} bg={style.bg} />
                    </div>
                    <div className="flex flex-wrap gap-4 text-[12px]" style={{ color: "#6B7280" }}>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{shift.startTime} – {shift.endTime}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{shift.workers ?? 0} workers</span>
                      <span className="flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" />Supervisor: {shift.supervisor}</span>
                    </div>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-md font-bold" style={{ background: `${typeColor}18`, color: typeColor }}>
                    {shift.type}
                  </span>
                </div>
                {assignedWorkers.length > 0 && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: "#F1F5F9" }}>
                    <div className="text-[11px] font-bold uppercase tracking-wider mb-2.5" style={{ color: "#94A3B8" }}>Assigned Workers</div>
                    <div className="flex flex-wrap gap-2">
                      {assignedWorkers.map((w) => (
                        <div key={w.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px]" style={{ background: "#F8FAFF", color: "#374151" }}>
                          <WorkerAvatar name={w.name} />
                          <span className="font-medium">{w.name.split(" ")[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab: Attendance ───────────────────────────────────────────────────────

function AttendanceTab({ employees }: { employees: ReturnType<typeof useListEmployeesQuery>["data"] }) {
  const list = employees ?? [];
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  const present = list.filter((e) => getWorkerMeta(e.id).checkedIn).length;
  const absent  = list.length - present;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Present Today", value: present, color: "#10B981", bg: "#D1FAE5", icon: UserCheck },
          { label: "Absent / Off-Site", value: absent, color: "#EF4444", bg: "#FEE2E2", icon: XCircle },
          { label: "Attendance Rate", value: `${list.length ? Math.round((present / list.length) * 100) : 0}%`, color: "#4A57B9", bg: "#EEF2FF", icon: TrendingUp },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: "#E3E9F6" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-[20px] font-bold" style={{ color: "#111827" }}>{s.value}</div>
              <div className="text-[11px] font-semibold" style={{ color: "#6B7280" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#F1F5F9" }}>
          <div>
            <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Daily Attendance Log</h3>
            <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>{today}</p>
          </div>
          <Activity className="w-4 h-4" style={{ color: "#94A3B8" }} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: "#F8FAFF" }}>
              <tr>
                {["Worker", "Department", "Check-In", "Zone", "Monthly Days", "Status"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: "#94A3B8" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#F8FAFF" }}>
              {list.map((emp) => {
                const meta = getWorkerMeta(emp.id);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <WorkerAvatar name={emp.name} />
                        <div>
                          <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>{emp.name}</div>
                          <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{emp.role || "Worker"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px]" style={{ color: "#6B7280" }}>{emp.department || "—"}</td>
                    <td className="px-5 py-3.5 text-[13px] font-mono" style={{ color: meta.checkedIn ? "#111827" : "#9CA3AF" }}>
                      {meta.checkInTime ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{meta.zone.split("–")[0].trim()}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>{meta.attendanceDays}</span>
                        <span className="text-[11px]" style={{ color: "#94A3B8" }}>/ 22</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge
                        label={meta.checkedIn ? "Present" : "Absent"}
                        color={meta.checkedIn ? "#10B981" : "#EF4444"}
                        bg={meta.checkedIn ? "#D1FAE5" : "#FEE2E2"}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Safety Training ──────────────────────────────────────────────────

function TrainingTab({ employees }: { employees: ReturnType<typeof useListEmployeesQuery>["data"] }) {
  const list = employees ?? [];

  const fullyTrained = list.filter((e) => {
    const meta = getWorkerMeta(e.id);
    return meta.trainingDone >= meta.trainingTotal;
  }).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Fully Trained", value: fullyTrained, color: "#10B981", bg: "#D1FAE5", icon: CheckCircle2 },
          { label: "Partial / In Progress", value: list.length - fullyTrained, color: "#F59E0B", bg: "#FEF3C7", icon: BookOpen },
          { label: "Overall Compliance", value: `${list.length ? Math.round((fullyTrained / list.length) * 100) : 0}%`, color: "#4A57B9", bg: "#EEF2FF", icon: TrendingUp },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: "#E3E9F6" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-[20px] font-bold" style={{ color: "#111827" }}>{s.value}</div>
              <div className="text-[11px] font-semibold" style={{ color: "#6B7280" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Training Status per Worker</h3>
          <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>Modules: {TRAINING_MODULES.join(" · ")}</p>
        </div>
        <div className="divide-y" style={{ borderColor: "#F8FAFF" }}>
          {list.map((emp) => {
            const meta = getWorkerMeta(emp.id);
            const pct = Math.round((meta.trainingDone / meta.trainingTotal) * 100);
            const barColor = pct === 100 ? "#10B981" : pct >= 60 ? "#4A57B9" : "#EF4444";
            return (
              <div key={emp.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                <WorkerAvatar name={emp.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>{emp.name}</span>
                      <span className="text-[11px] ml-2" style={{ color: "#9CA3AF" }}>{emp.department || "—"}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[13px] font-bold" style={{ color: barColor }}>{pct}%</span>
                      <span className="text-[11px] ml-1" style={{ color: "#9CA3AF" }}>({meta.trainingDone}/{meta.trainingTotal})</span>
                    </div>
                  </div>
                  <ProgressBar value={pct} color={barColor} />
                </div>
                <StatusBadge
                  label={pct === 100 ? "Complete" : pct >= 60 ? "In Progress" : "Overdue"}
                  color={pct === 100 ? "#10B981" : pct >= 60 ? "#4A57B9" : "#EF4444"}
                  bg={pct === 100 ? "#D1FAE5" : pct >= 60 ? "#EEF2FF" : "#FEE2E2"}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Risk Exposure ────────────────────────────────────────────────────

function RiskTab({ employees }: { employees: ReturnType<typeof useListEmployeesQuery>["data"] }) {
  const list = employees ?? [];

  const riskCounts = { Low: 0, Medium: 0, High: 0 };
  list.forEach((e) => {
    const r = getWorkerMeta(e.id).risk.label as keyof typeof riskCounts;
    riskCounts[r]++;
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "High Risk Workers", value: riskCounts.High, color: "#EF4444", bg: "#FEE2E2", icon: AlertTriangle },
          { label: "Medium Risk Workers", value: riskCounts.Medium, color: "#F59E0B", bg: "#FEF3C7", icon: Zap },
          { label: "Low Risk Workers", value: riskCounts.Low, color: "#10B981", bg: "#D1FAE5", icon: CheckCircle2 },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: "#E3E9F6" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-[20px] font-bold" style={{ color: "#111827" }}>{s.value}</div>
              <div className="text-[11px] font-semibold" style={{ color: "#6B7280" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>Worker Risk Exposure Map</h3>
          <Eye className="w-4 h-4" style={{ color: "#94A3B8" }} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: "#F8FAFF" }}>
              <tr>
                {["Worker", "Zone / Location", "Risk Level", "Dept", "Last Incident", "Action"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: "#94A3B8" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#F8FAFF" }}>
              {list.map((emp) => {
                const meta = getWorkerMeta(emp.id);
                const lastIncidentDays = Math.floor(seededRandom(workerSeed(emp.id) + 20) * 90);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <WorkerAvatar name={emp.name} />
                        <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>
                      <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{meta.zone}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label={meta.risk.label} color={meta.risk.color} bg={meta.risk.bg} />
                    </td>
                    <td className="px-5 py-3.5 text-[12px]" style={{ color: "#6B7280" }}>{emp.department || "—"}</td>
                    <td className="px-5 py-3.5 text-[12px]" style={{ color: "#9CA3AF" }}>
                      {lastIncidentDays === 0 ? "Today" : `${lastIncidentDays}d ago`}
                    </td>
                    <td className="px-5 py-3.5">
                      {meta.risk.label === "High" && (
                        <button className="text-[11px] px-2.5 py-1 rounded-lg font-semibold" style={{ background: "#FEE2E2", color: "#EF4444" }}>
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Tab: PPE Compliance ───────────────────────────────────────────────────

function PPETab({ employees }: { employees: ReturnType<typeof useListEmployeesQuery>["data"] }) {
  const list = employees ?? [];

  const avgPpe = list.length
    ? Math.round(list.reduce((sum, e) => sum + getWorkerMeta(e.id).ppeScore, 0) / list.length)
    : 0;
  const fullyCompliant = list.filter((e) => getWorkerMeta(e.id).ppeScore === 100).length;
  const nonCompliant   = list.filter((e) => getWorkerMeta(e.id).missingPpe.length > 0).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Avg PPE Compliance", value: `${avgPpe}%`, color: "#4A57B9", bg: "#EEF2FF", icon: Shield },
          { label: "Fully Compliant", value: fullyCompliant, color: "#10B981", bg: "#D1FAE5", icon: CheckCircle2 },
          { label: "Non-Compliant", value: nonCompliant, color: "#EF4444", bg: "#FEE2E2", icon: AlertTriangle },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: "#E3E9F6" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-[20px] font-bold" style={{ color: "#111827" }}>{s.value}</div>
              <div className="text-[11px] font-semibold" style={{ color: "#6B7280" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-[14px] font-bold" style={{ color: "#111827" }}>PPE Compliance per Worker</h3>
          <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>Required: {PPE_ITEMS.join(" · ")}</p>
        </div>
        <div className="divide-y" style={{ borderColor: "#F8FAFF" }}>
          {list.map((emp) => {
            const meta = getWorkerMeta(emp.id);
            const pct  = meta.ppeScore;
            const barColor = pct >= 95 ? "#10B981" : pct >= 80 ? "#F59E0B" : "#EF4444";
            return (
              <div key={emp.id} className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <WorkerAvatar name={emp.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>{emp.name}</span>
                        <span className="text-[11px] ml-2" style={{ color: "#9CA3AF" }}>{emp.department || "—"}</span>
                      </div>
                      <span className="text-[13px] font-bold" style={{ color: barColor }}>{pct}%</span>
                    </div>
                    <ProgressBar value={pct} color={barColor} />
                    {meta.missingPpe.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <AlertTriangle className="w-3 h-3" style={{ color: "#EF4444" }} />
                        <span className="text-[11px]" style={{ color: "#EF4444" }}>
                          Missing: {meta.missingPpe.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                  <HardHat className="w-4 h-4 flex-shrink-0" style={{ color: pct >= 95 ? "#10B981" : "#EF4444" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: "overview",   label: "Active Workers",      icon: Users },
  { id: "shifts",     label: "Shift Assignments",   icon: CalendarClock },
  { id: "attendance", label: "Attendance",           icon: UserCheck },
  { id: "training",   label: "Training Status",     icon: BookOpen },
  { id: "risk",       label: "Risk Exposure",        icon: AlertTriangle },
  { id: "ppe",        label: "PPE Compliance",       icon: HardHat },
];

export function WorkersPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const { data: employees = [], isLoading } = useListEmployeesQuery();

  const stats: WorkerStats = useMemo(() => {
    const active   = employees.filter((e) => e.status === "active").length;
    const onShift  = employees.filter((e) => getWorkerMeta(e.id).checkedIn).length;
    const ppeCompliant = employees.filter((e) => getWorkerMeta(e.id).ppeScore >= 95).length;
    const trainingCompliant = employees.filter((e) => {
      const m = getWorkerMeta(e.id);
      return m.trainingDone >= m.trainingTotal;
    }).length;
    return { total: employees.length, active, onShift, ppeCompliant, trainingCompliant };
  }, [employees]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between rounded-2xl border px-5 py-4" style={{ borderColor: "#DCE4F3", background: "#FFFFFF" }}>
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[18px] font-bold" style={{ color: "#111827" }}>Workers</h1>
              <p className="text-[12px]" style={{ color: "#64748B" }}>Workforce monitoring — safety, shifts, attendance & compliance</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "#94A3B8" }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#10B981" }} />
            Live
          </div>
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-white text-[12px] font-semibold" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border p-5 animate-pulse" style={{ borderColor: "#E3E9F6" }}>
              <div className="h-11 w-11 rounded-xl bg-gray-100 mb-3" />
              <div className="h-7 w-14 rounded bg-gray-100 mb-2" />
              <div className="h-3 w-24 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users}      label="Total Workers"     value={stats.total}         sub="Registered in system" color="#4A57B9" bg="#EEF2FF" />
          <StatCard icon={Activity}   label="On Site Now"       value={stats.onShift}       sub={`of ${stats.active} active`}  color="#10B981" bg="#D1FAE5" />
          <StatCard icon={HardHat}    label="PPE Compliant"     value={`${stats.total ? Math.round((stats.ppeCompliant / stats.total) * 100) : 0}%`} sub={`${stats.ppeCompliant} workers`} color="#F59E0B" bg="#FEF3C7" />
          <StatCard icon={BookOpen}   label="Training Complete"  value={`${stats.total ? Math.round((stats.trainingCompliant / stats.total) * 100) : 0}%`} sub={`${stats.trainingCompliant} workers`} color="#7C3AED" bg="#EDE9FE" />
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex overflow-x-auto border-b" style={{ borderColor: "#F1F5F9" }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-5 py-3.5 text-[12px] font-semibold whitespace-nowrap transition-all border-b-2 flex-shrink-0"
                style={{
                  color: active ? "#4A57B9" : "#6B7280",
                  borderBottomColor: active ? "#4A57B9" : "transparent",
                  background: active ? "#F8FAFF" : "transparent",
                }}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "#94A3B8" }} />
            </div>
          ) : (
            <>
              {activeTab === "overview"   && <OverviewTab   employees={employees} stats={stats} />}
              {activeTab === "shifts"     && <ShiftsTab     employees={employees} />}
              {activeTab === "attendance" && <AttendanceTab employees={employees} />}
              {activeTab === "training"   && <TrainingTab   employees={employees} />}
              {activeTab === "risk"       && <RiskTab       employees={employees} />}
              {activeTab === "ppe"        && <PPETab        employees={employees} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
