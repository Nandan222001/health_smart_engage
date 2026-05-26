import { useMemo } from "react";
import {
  ClipboardList, CheckCircle2, XCircle, Clock, AlertTriangle,
  Calendar, User, Tag, Wrench, TrendingUp, ChevronRight,
  ShieldAlert, FileSearch, BarChart2, FileClock,
} from "lucide-react";
import {
  useGetAllInspectionsQuery,
  useGetAssetsQuery,
  useGetMaintenanceLogsQuery,
  type AssetInspectionRecord,
  type Asset,
  type AssetMaintenanceLog,
} from "@/features/assets/api/assetsApi";

// ─── helpers ─────────────────────────────────────────────────────────────────

function daysDiff(dateStr: string | null): number {
  if (!dateStr) return 9999;
  const now = new Date();
  const d = new Date(dateStr);
  return Math.ceil((d.getTime() - now.getTime()) / 86_400_000);
}

function fmt(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function resultBadge(result: string) {
  const r = result.toLowerCase();
  if (r === "pass" || r === "passed") {
    return (
      <span
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          background: "#D1FAE5", color: "#065F46",
          borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600,
        }}
      >
        <CheckCircle2 size={12} /> Pass
      </span>
    );
  }
  if (r === "fail" || r === "failed") {
    return (
      <span
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          background: "#FEE2E2", color: "#991B1B",
          borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600,
        }}
      >
        <XCircle size={12} /> Fail
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        background: "#FEF3C7", color: "#92400E",
        borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600,
      }}
    >
      <AlertTriangle size={12} /> {result}
    </span>
  );
}

function scheduleStatus(diff: number) {
  if (diff < 0)
    return { label: "Overdue", bg: "#FEE2E2", color: "#991B1B" };
  if (diff <= 7)
    return { label: "Due Soon", bg: "#FEF3C7", color: "#92400E" };
  return { label: "Scheduled", bg: "#D1FAE5", color: "#065F46" };
}

function correctivePriority(log: AssetMaintenanceLog) {
  const t = (log.work_type || "").toLowerCase();
  if (t.includes("emergency") || t.includes("breakdown")) return "High";
  if (t.includes("corrective") || t.includes("repair")) return "Medium";
  return "Low";
}

function priorityStyle(priority: string) {
  if (priority === "High") return { bg: "#FEE2E2", color: "#991B1B" };
  if (priority === "Medium") return { bg: "#FEF3C7", color: "#92400E" };
  return { bg: "#D1FAE5", color: "#065F46" };
}

function isCorrectiveAction(log: AssetMaintenanceLog): boolean {
  const t = (log.work_type || "").toLowerCase();
  return (
    t.includes("corrective") ||
    t.includes("repair") ||
    t.includes("breakdown") ||
    t.includes("emergency")
  );
}

// ─── sub-components ─────────────────────────────────────────────────────────

function HeroStat({
  icon: Icon, label, value, sub, iconBg,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  iconBg: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.10)",
        borderRadius: 12,
        padding: "18px 22px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        flex: "1 1 160px",
        minWidth: 140,
      }}
    >
      <div
        style={{
          background: iconBg,
          borderRadius: 10,
          width: 42,
          height: 42,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={20} color="#fff" />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon, title, count, color,
}: {
  icon: React.ElementType;
  title: string;
  count?: number;
  color: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <div
        style={{
          background: color,
          borderRadius: 8,
          width: 34,
          height: 34,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={17} color="#fff" />
      </div>
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>{title}</h2>
      {count !== undefined && (
        <span
          style={{
            marginLeft: "auto",
            background: "#F3F4F6",
            color: "#374151",
            borderRadius: 20,
            padding: "2px 10px",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export function EquipmentInspectionsPage() {
  const { data: inspections = [], isLoading: loadingInsp } = useGetAllInspectionsQuery();
  const { data: assets = [], isLoading: loadingAssets } = useGetAssetsQuery();
  const { data: maintenanceLogs = [], isLoading: loadingLogs } = useGetMaintenanceLogsQuery();

  const loading = loadingInsp || loadingAssets || loadingLogs;

  // ── derived ──────────────────────────────────────────────────────────────
  const passed = useMemo(
    () => inspections.filter((i) => ["pass", "passed"].includes(i.result.toLowerCase())),
    [inspections],
  );
  const failed = useMemo(
    () => inspections.filter((i) => ["fail", "failed"].includes(i.result.toLowerCase())),
    [inspections],
  );
  const conditional = useMemo(
    () => inspections.filter(
      (i) => !["pass", "passed", "fail", "failed"].includes(i.result.toLowerCase()),
    ),
    [inspections],
  );

  // Scheduled assets — those with a future next_maintenance_date
  const scheduledAssets = useMemo(
    () =>
      assets
        .filter((a) => a.next_maintenance_date)
        .sort(
          (a, b) =>
            new Date(a.next_maintenance_date!).getTime() -
            new Date(b.next_maintenance_date!).getTime(),
        ),
    [assets],
  );

  const overdueAssets = useMemo(
    () => scheduledAssets.filter((a) => daysDiff(a.next_maintenance_date) < 0),
    [scheduledAssets],
  );

  // Corrective actions from maintenance logs
  const correctiveActions = useMemo(
    () => maintenanceLogs.filter(isCorrectiveAction),
    [maintenanceLogs],
  );
  const openActions = correctiveActions.filter(
    (l) => !["completed", "done"].includes((l.status || "").toLowerCase()),
  );
  const completedActions = correctiveActions.filter((l) =>
    ["completed", "done"].includes((l.status || "").toLowerCase()),
  );

  // Failure breakdown by category
  const failsByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    failed.forEach((i) => {
      map[i.category] = (map[i.category] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [failed]);

  // Inspection type breakdown
  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    inspections.forEach((i) => {
      map[i.inspection_type] = (map[i.inspection_type] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [inspections]);

  const passRate =
    inspections.length > 0
      ? Math.round((passed.length / inspections.length) * 100)
      : 0;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F3F7FF", padding: "0 0 40px" }}>
      {/* Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #431407 0%, #7C2D12 40%, #9A3412 70%, #C2410C 100%)",
          padding: "32px 32px 28px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div
            style={{
              background: "rgba(255,255,255,0.15)",
              borderRadius: 10,
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileSearch size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff" }}>
              Equipment Inspections
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              Schedules · Reports · Failures · Corrective Actions
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <HeroStat icon={ClipboardList} label="Total Inspections" value={inspections.length} iconBg="rgba(255,255,255,0.2)" />
          <HeroStat icon={CheckCircle2} label="Passed" value={passed.length} sub={`${passRate}% pass rate`} iconBg="rgba(5,150,105,0.5)" />
          <HeroStat icon={XCircle} label="Failed" value={failed.length} iconBg="rgba(185,28,28,0.5)" />
          <HeroStat icon={AlertTriangle} label="Conditional" value={conditional.length} iconBg="rgba(180,83,9,0.5)" />
          <HeroStat icon={Calendar} label="Scheduled" value={scheduledAssets.length} sub={`${overdueAssets.length} overdue`} iconBg="rgba(91,33,182,0.5)" />
          <HeroStat icon={Wrench} label="Corrective Actions" value={correctiveActions.length} sub={`${openActions.length} open`} iconBg="rgba(30,58,138,0.5)" />
        </div>
      </div>

      <div style={{ padding: "28px 32px 0", display: "flex", flexDirection: "column", gap: 28 }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>
            Loading inspection data…
          </div>
        )}

        {!loading && (
          <>
            {/* ── Section 1: Inspection Schedules ───────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={Calendar} title="Inspection Schedules" count={scheduledAssets.length} color="#7C3AED" />

              {/* Summary pills */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                {[
                  { label: "Overdue", count: scheduledAssets.filter((a) => daysDiff(a.next_maintenance_date) < 0).length, bg: "#FEE2E2", color: "#991B1B" },
                  { label: "Due ≤7 days", count: scheduledAssets.filter((a) => { const d = daysDiff(a.next_maintenance_date); return d >= 0 && d <= 7; }).length, bg: "#FEF3C7", color: "#92400E" },
                  { label: "Due ≤30 days", count: scheduledAssets.filter((a) => { const d = daysDiff(a.next_maintenance_date); return d > 7 && d <= 30; }).length, bg: "#DBEAFE", color: "#1E40AF" },
                  { label: "Scheduled >30 days", count: scheduledAssets.filter((a) => daysDiff(a.next_maintenance_date) > 30).length, bg: "#D1FAE5", color: "#065F46" },
                ].map((b) => (
                  <div
                    key={b.label}
                    style={{
                      background: b.bg,
                      borderRadius: 8,
                      padding: "8px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 20, fontWeight: 800, color: b.color }}>{b.count}</span>
                    <span style={{ fontSize: 12, color: b.color, fontWeight: 500 }}>{b.label}</span>
                  </div>
                ))}
              </div>

              {scheduledAssets.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>
                  No scheduled inspections found.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        {["Asset Name", "Code", "Category", "Location", "Scheduled Date", "Status"].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: "10px 14px",
                              textAlign: "left",
                              fontWeight: 600,
                              color: "#6B7280",
                              fontSize: 12,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {scheduledAssets.slice(0, 20).map((asset) => {
                        const diff = daysDiff(asset.next_maintenance_date);
                        const st = scheduleStatus(diff);
                        return (
                          <tr
                            key={asset.id}
                            style={{ borderTop: "1px solid #F3F4F6" }}
                          >
                            <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827" }}>
                              {asset.name || "—"}
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              <span style={{ fontFamily: "monospace", background: "#F3F4F6", borderRadius: 4, padding: "2px 6px", fontSize: 11 }}>
                                {asset.asset_code}
                              </span>
                            </td>
                            <td style={{ padding: "10px 14px", color: "#374151" }}>{asset.category}</td>
                            <td style={{ padding: "10px 14px", color: "#6B7280" }}>{asset.location || "—"}</td>
                            <td style={{ padding: "10px 14px", color: "#374151" }}>
                              {fmt(asset.next_maintenance_date)}
                              {diff < 0 && (
                                <span style={{ marginLeft: 6, fontSize: 11, color: "#991B1B", fontWeight: 600 }}>
                                  ({Math.abs(diff)}d overdue)
                                </span>
                              )}
                              {diff >= 0 && diff <= 30 && (
                                <span style={{ marginLeft: 6, fontSize: 11, color: "#92400E", fontWeight: 600 }}>
                                  (in {diff}d)
                                </span>
                              )}
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              <span
                                style={{
                                  background: st.bg,
                                  color: st.color,
                                  borderRadius: 6,
                                  padding: "2px 10px",
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                              >
                                {st.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {scheduledAssets.length > 20 && (
                    <p style={{ margin: "12px 0 0", fontSize: 12, color: "#9CA3AF", textAlign: "right" }}>
                      Showing 20 of {scheduledAssets.length} scheduled assets
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── Section 2: Inspection Reports ─────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={ClipboardList} title="Inspection Reports" count={inspections.length} color="#1D4ED8" />

              {/* Type breakdown */}
              {byType.length > 0 && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                  {byType.map(([type, cnt]) => (
                    <div
                      key={type}
                      style={{
                        background: "#EFF6FF",
                        border: "1px solid #BFDBFE",
                        borderRadius: 8,
                        padding: "6px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Tag size={12} color="#1D4ED8" />
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1E40AF" }}>{type}</span>
                      <span
                        style={{
                          background: "#1D4ED8",
                          color: "#fff",
                          borderRadius: 10,
                          padding: "0 7px",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {cnt}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {inspections.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>
                  No inspection reports found.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        {["Asset Name", "Code", "Category", "Inspection Type", "Date", "Inspector", "Result", "Notes"].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: "10px 14px",
                              textAlign: "left",
                              fontWeight: 600,
                              color: "#6B7280",
                              fontSize: 12,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {inspections.slice(0, 25).map((rec) => (
                        <tr key={rec.id} style={{ borderTop: "1px solid #F3F4F6" }}>
                          <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827" }}>
                            {rec.asset_name}
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ fontFamily: "monospace", background: "#F3F4F6", borderRadius: 4, padding: "2px 6px", fontSize: 11 }}>
                              {rec.asset_code}
                            </span>
                          </td>
                          <td style={{ padding: "10px 14px", color: "#374151" }}>{rec.category}</td>
                          <td style={{ padding: "10px 14px", color: "#374151" }}>{rec.inspection_type}</td>
                          <td style={{ padding: "10px 14px", color: "#374151", whiteSpace: "nowrap" }}>
                            {fmt(rec.inspected_on)}
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#6B7280" }}>
                              <User size={12} />
                              <span>{rec.inspector_user_id || "—"}</span>
                            </div>
                          </td>
                          <td style={{ padding: "10px 14px" }}>{resultBadge(rec.result)}</td>
                          <td style={{ padding: "10px 14px", color: "#6B7280", maxWidth: 180 }}>
                            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {rec.notes || "—"}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {inspections.length > 25 && (
                    <p style={{ margin: "12px 0 0", fontSize: 12, color: "#9CA3AF", textAlign: "right" }}>
                      Showing 25 of {inspections.length} inspection records
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── Section 3: Failed Inspections ─────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={XCircle} title="Failed Inspections" count={failed.length} color="#DC2626" />

              {/* Failure tally row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#991B1B" }}>{failed.length}</div>
                  <div style={{ fontSize: 12, color: "#B91C1C", fontWeight: 500 }}>Total Failures</div>
                </div>
                <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#C2410C" }}>
                    {passRate < 100 ? 100 - passRate : 0}%
                  </div>
                  <div style={{ fontSize: 12, color: "#EA580C", fontWeight: 500 }}>Failure Rate</div>
                </div>
                {failsByCategory.slice(0, 3).map(([cat, cnt]) => (
                  <div
                    key={cat}
                    style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}
                  >
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#991B1B" }}>{cnt}</div>
                    <div style={{ fontSize: 11, color: "#B91C1C", fontWeight: 500 }}>{cat}</div>
                  </div>
                ))}
              </div>

              {failed.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: 32,
                    background: "#F0FDF4",
                    borderRadius: 10,
                    border: "1px solid #BBF7D0",
                  }}
                >
                  <CheckCircle2 size={36} color="#16A34A" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#15803D" }}>
                    No failed inspections — great work!
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {failed.map((rec) => (
                    <div
                      key={rec.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 14,
                        borderLeft: "4px solid #DC2626",
                        background: "#FEF2F2",
                        borderRadius: "0 10px 10px 0",
                        padding: "14px 16px",
                      }}
                    >
                      <ShieldAlert size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, color: "#111827" }}>{rec.asset_name}</span>
                          <span style={{ fontFamily: "monospace", background: "#fff", border: "1px solid #FECACA", borderRadius: 4, padding: "1px 6px", fontSize: 11, color: "#991B1B" }}>
                            {rec.asset_code}
                          </span>
                          <span style={{ fontSize: 12, color: "#B91C1C", background: "#fee", border: "1px solid #fca5a5", borderRadius: 4, padding: "1px 6px" }}>
                            {rec.category}
                          </span>
                        </div>
                        <div style={{ marginTop: 6, display: "flex", gap: 16, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                            <Tag size={11} /> {rec.inspection_type}
                          </span>
                          <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                            <Calendar size={11} /> {fmt(rec.inspected_on)}
                          </span>
                          <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                            <User size={11} /> {rec.inspector_user_id || "—"}
                          </span>
                        </div>
                        {rec.notes && (
                          <div style={{ marginTop: 6, fontSize: 12, color: "#374151", fontStyle: "italic" }}>
                            {rec.notes}
                          </div>
                        )}
                      </div>
                      {resultBadge(rec.result)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Section 4: Corrective Actions ─────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={Wrench} title="Corrective Actions" count={correctiveActions.length} color="#0F766E" />

              {/* Status summary bar */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                {[
                  { label: "Open / Pending", value: openActions.filter((l) => (l.status || "").toLowerCase() === "pending" || !l.status).length, bg: "#FEF9C3", color: "#854D0E", border: "#FDE047" },
                  { label: "In Progress", value: openActions.filter((l) => (l.status || "").toLowerCase() === "in_progress" || (l.status || "").toLowerCase() === "in progress").length, bg: "#EFF6FF", color: "#1E40AF", border: "#93C5FD" },
                  { label: "Completed", value: completedActions.length, bg: "#F0FDF4", color: "#065F46", border: "#86EFAC" },
                  { label: "High Priority", value: correctiveActions.filter((l) => correctivePriority(l) === "High").length, bg: "#FEF2F2", color: "#991B1B", border: "#FCA5A5" },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: s.bg,
                      border: `1px solid ${s.border}`,
                      borderRadius: 10,
                      padding: "14px 16px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: s.color, fontWeight: 500, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {correctiveActions.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>
                  No corrective action records found.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {correctiveActions.map((log) => {
                    const priority = correctivePriority(log);
                    const ps = priorityStyle(priority);
                    const isComplete = ["completed", "done"].includes(
                      (log.status || "").toLowerCase(),
                    );
                    return (
                      <div
                        key={log.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 14,
                          borderLeft: `4px solid ${isComplete ? "#16A34A" : priority === "High" ? "#DC2626" : "#D97706"}`,
                          background: isComplete ? "#F0FDF4" : priority === "High" ? "#FEF2F2" : "#FFFBEB",
                          borderRadius: "0 10px 10px 0",
                          padding: "14px 16px",
                        }}
                      >
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            background: isComplete ? "#D1FAE5" : ps.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {isComplete ? (
                            <CheckCircle2 size={18} color="#16A34A" />
                          ) : (
                            <Wrench size={18} color={ps.color} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 700, color: "#111827" }}>{log.asset_name}</span>
                            <span style={{ fontFamily: "monospace", background: "#fff", border: "1px solid #E5E7EB", borderRadius: 4, padding: "1px 6px", fontSize: 11 }}>
                              {log.asset_code}
                            </span>
                            <span
                              style={{
                                background: ps.bg,
                                color: ps.color,
                                borderRadius: 6,
                                padding: "2px 8px",
                                fontSize: 11,
                                fontWeight: 600,
                              }}
                            >
                              {priority} Priority
                            </span>
                          </div>
                          <div style={{ marginTop: 5, display: "flex", gap: 16, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>
                              {log.work_type}
                            </span>
                            {log.performed_by && (
                              <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                                <User size={11} /> {log.performed_by}
                              </span>
                            )}
                            {log.performed_on && (
                              <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                                <Calendar size={11} /> {fmt(log.performed_on)}
                              </span>
                            )}
                            {log.cost != null && (
                              <span style={{ fontSize: 12, color: "#6B7280" }}>
                                Cost: ${log.cost.toLocaleString()}
                              </span>
                            )}
                          </div>
                          {log.description && (
                            <div style={{ marginTop: 5, fontSize: 12, color: "#374151", fontStyle: "italic" }}>
                              {log.description}
                            </div>
                          )}
                        </div>
                        <span
                          style={{
                            flexShrink: 0,
                            background: isComplete ? "#D1FAE5" : "#F3F4F6",
                            color: isComplete ? "#065F46" : "#374151",
                            borderRadius: 6,
                            padding: "2px 10px",
                            fontSize: 12,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {log.status || "Pending"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
