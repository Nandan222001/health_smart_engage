import { useMemo } from "react";
import {
  ShieldAlert, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
  MapPin, Tag, Calendar, Activity, BarChart2, Zap, Eye,
  Flame, Target, TriangleAlert,
} from "lucide-react";
import {
  useGetAssetRiskMappingQuery,
  useGetAssetsQuery,
  useGetMaintenanceLogsQuery,
  type AssetRiskItem,
} from "@/features/assets/api/assetsApi";

// ─── helpers ─────────────────────────────────────────────────────────────────

function daysDiff(dateStr: string | null | undefined): number {
  if (!dateStr) return 9999;
  const now = new Date();
  const d = new Date(dateStr);
  return Math.ceil((d.getTime() - now.getTime()) / 86_400_000);
}

function fmt(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function riskColor(level: string): { bg: string; color: string; border: string } {
  const l = level.toLowerCase();
  if (l === "high" || l === "critical")
    return { bg: "#FEF2F2", color: "#991B1B", border: "#FECACA" };
  if (l === "medium")
    return { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" };
  return { bg: "#F0FDF4", color: "#065F46", border: "#BBF7D0" };
}

function riskBadge(level: string) {
  const s = riskColor(level);
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 700,
    }}>
      {level}
    </span>
  );
}

function ScoreBar({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.min((score / max) * 100, 100);
  const color = score >= 70 ? "#DC2626" : score >= 40 ? "#D97706" : "#16A34A";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
      <div style={{ flex: 1, height: 7, background: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.4s" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 28, textAlign: "right" }}>
        {score}
      </span>
    </div>
  );
}

function failurePrediction(item: AssetRiskItem, breakdownCount: number): "Imminent" | "At Risk" | "Monitor" | "Stable" {
  const overdueDays = -daysDiff(item.next_maintenance_date);
  const isOverdue = overdueDays > 0;
  if (item.risk_score >= 70 && (isOverdue || breakdownCount >= 2)) return "Imminent";
  if (item.risk_score >= 50 || (isOverdue && overdueDays > 14)) return "At Risk";
  if (item.risk_score >= 30 || breakdownCount >= 1) return "Monitor";
  return "Stable";
}

function predictionStyle(level: string): { bg: string; color: string; border: string; dot: string } {
  if (level === "Imminent") return { bg: "#FEF2F2", color: "#991B1B", border: "#FECACA", dot: "#DC2626" };
  if (level === "At Risk")  return { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA", dot: "#D97706" };
  if (level === "Monitor")  return { bg: "#FFFBEB", color: "#854D0E", border: "#FDE68A", dot: "#F59E0B" };
  return { bg: "#F0FDF4", color: "#065F46", border: "#BBF7D0", dot: "#16A34A" };
}

// ─── sub-components ─────────────────────────────────────────────────────────

function HeroStat({
  icon: Icon, label, value, sub, iconBg,
}: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; iconBg: string;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.10)", borderRadius: 12, padding: "18px 22px",
      display: "flex", alignItems: "center", gap: 14, flex: "1 1 150px", minWidth: 130,
    }}>
      <div style={{
        background: iconBg, borderRadius: 10, width: 42, height: 42,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={20} color="#fff" />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon, title, count, color,
}: {
  icon: React.ElementType; title: string; count?: number; color: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <div style={{
        background: color, borderRadius: 8, width: 34, height: 34,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={17} color="#fff" />
      </div>
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>{title}</h2>
      {count !== undefined && (
        <span style={{
          marginLeft: "auto", background: "#F3F4F6", color: "#374151",
          borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600,
        }}>
          {count}
        </span>
      )}
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export function AssetRiskMappingPage() {
  const { data: riskItems = [], isLoading: loadingRisk } = useGetAssetRiskMappingQuery();
  const { data: assets = [], isLoading: loadingAssets } = useGetAssetsQuery();
  const { data: logs = [], isLoading: loadingLogs } = useGetMaintenanceLogsQuery();

  const loading = loadingRisk || loadingAssets || loadingLogs;

  // ── derived data ──────────────────────────────────────────────────────────

  const highRisk   = useMemo(() => riskItems.filter((r) => r.risk_score >= 70), [riskItems]);
  const medRisk    = useMemo(() => riskItems.filter((r) => r.risk_score >= 40 && r.risk_score < 70), [riskItems]);
  const lowRisk    = useMemo(() => riskItems.filter((r) => r.risk_score < 40), [riskItems]);
  const critical   = useMemo(() => riskItems.filter((r) => ["critical", "high"].includes(r.criticality.toLowerCase())), [riskItems]);
  const avgScore   = riskItems.length > 0
    ? Math.round(riskItems.reduce((s, r) => s + r.risk_score, 0) / riskItems.length)
    : 0;

  // Breakdown counts per asset
  const breakdownsByAsset = useMemo(() => {
    const map: Record<string, number> = {};
    logs.forEach((l) => {
      const t = (l.work_type || "").toLowerCase();
      if (t.includes("breakdown") || t.includes("emergency")) {
        map[l.asset_id] = (map[l.asset_id] || 0) + 1;
      }
    });
    return map;
  }, [logs]);

  // Failure prediction for each item
  const withPrediction = useMemo(
    () =>
      riskItems.map((item) => ({
        item,
        prediction: failurePrediction(item, breakdownsByAsset[item.id] || 0),
        breakdowns: breakdownsByAsset[item.id] || 0,
      })),
    [riskItems, breakdownsByAsset],
  );

  const imminent = withPrediction.filter((x) => x.prediction === "Imminent");
  const atRisk   = withPrediction.filter((x) => x.prediction === "At Risk");
  const monitor  = withPrediction.filter((x) => x.prediction === "Monitor");
  const stable   = withPrediction.filter((x) => x.prediction === "Stable");

  // Hazard mapping — group by location
  const locationMap = useMemo(() => {
    const map: Record<string, { assets: AssetRiskItem[]; totalScore: number }> = {};
    riskItems.forEach((r) => {
      const loc = r.location || "Unknown";
      if (!map[loc]) map[loc] = { assets: [], totalScore: 0 };
      map[loc].assets.push(r);
      map[loc].totalScore += r.risk_score;
    });
    return Object.entries(map)
      .map(([loc, data]) => ({
        location: loc,
        total: data.assets.length,
        highRiskCount: data.assets.filter((a) => a.risk_score >= 70).length,
        avgScore: Math.round(data.totalScore / data.assets.length),
        topCategory: (() => {
          const cm: Record<string, number> = {};
          data.assets.forEach((a) => { cm[a.category] = (cm[a.category] || 0) + 1; });
          return Object.entries(cm).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
        })(),
        assets: data.assets,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [riskItems]);

  // Category risk breakdown
  const categoryRisk = useMemo(() => {
    const map: Record<string, { count: number; totalScore: number; high: number }> = {};
    riskItems.forEach((r) => {
      if (!map[r.category]) map[r.category] = { count: 0, totalScore: 0, high: 0 };
      map[r.category].count++;
      map[r.category].totalScore += r.risk_score;
      if (r.risk_score >= 70) map[r.category].high++;
    });
    return Object.entries(map)
      .map(([cat, d]) => ({ cat, count: d.count, avg: Math.round(d.totalScore / d.count), high: d.high }))
      .sort((a, b) => b.avg - a.avg);
  }, [riskItems]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F3F7FF", padding: "0 0 40px" }}>

      {/* Banner */}
      <div style={{
        background: "linear-gradient(135deg, #1A0505 0%, #450A0A 35%, #7F1D1D 65%, #991B1B 100%)",
        padding: "32px 32px 28px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{
            background: "rgba(255,255,255,0.15)", borderRadius: 10, width: 44, height: 44,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Target size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff" }}>
              Asset Risk Mapping
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              Risk Scores · Critical Assets · Failure Prediction · Hazard Mapping
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <HeroStat icon={BarChart2}     label="Total Assets"      value={riskItems.length}     iconBg="rgba(255,255,255,0.2)" />
          <HeroStat icon={Flame}         label="High Risk"         value={highRisk.length}       sub={`Score ≥ 70`}             iconBg="rgba(220,38,38,0.5)" />
          <HeroStat icon={AlertTriangle} label="Medium Risk"       value={medRisk.length}        sub={`Score 40–69`}            iconBg="rgba(217,119,6,0.5)" />
          <HeroStat icon={ShieldAlert}   label="Critical Assets"   value={critical.length}       sub="High criticality"         iconBg="rgba(124,45,212,0.5)" />
          <HeroStat icon={Activity}      label="Avg Risk Score"    value={avgScore}              sub="across all assets"        iconBg="rgba(30,58,138,0.5)" />
          <HeroStat icon={Zap}           label="Imminent Failures" value={imminent.length}       sub="needs immediate action"   iconBg="rgba(180,30,30,0.6)" />
        </div>
      </div>

      <div style={{ padding: "28px 32px 0", display: "flex", flexDirection: "column", gap: 28 }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>Loading risk data…</div>
        )}

        {!loading && (
          <>
            {/* ── Section 1: Asset Risk Scores ────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={BarChart2} title="Asset Risk Scores" count={riskItems.length} color="#DC2626" />

              {/* Risk level count cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "High Risk",   count: highRisk.length, bg: "#FEF2F2", color: "#991B1B", border: "#FECACA" },
                  { label: "Medium Risk", count: medRisk.length,  bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
                  { label: "Low Risk",    count: lowRisk.length,  bg: "#F0FDF4", color: "#065F46", border: "#BBF7D0" },
                  { label: "Avg Score",   count: avgScore,        bg: "#EFF6FF", color: "#1E40AF", border: "#BFDBFE" },
                ].map((c) => (
                  <div key={c.label} style={{
                    background: c.bg, border: `1px solid ${c.border}`,
                    borderRadius: 10, padding: "14px 16px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.count}</div>
                    <div style={{ fontSize: 12, color: c.color, fontWeight: 500, marginTop: 2 }}>{c.label}</div>
                  </div>
                ))}
              </div>

              {/* Category breakdown */}
              {categoryRisk.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>
                    Risk by Category
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {categoryRisk.map(({ cat, count, avg, high }) => (
                      <div key={cat} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 140, fontSize: 13, color: "#374151", fontWeight: 500, flexShrink: 0 }}>
                          {cat}
                          <span style={{ marginLeft: 6, fontSize: 11, color: "#9CA3AF" }}>({count})</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <ScoreBar score={avg} />
                        </div>
                        {high > 0 && (
                          <span style={{
                            fontSize: 11, fontWeight: 600, color: "#991B1B",
                            background: "#FEE2E2", borderRadius: 4, padding: "1px 6px", flexShrink: 0,
                          }}>
                            {high} high
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full table */}
              {riskItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>No risk data available.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        {["Asset Name", "Code", "Category", "Location", "Risk Score", "Risk Level", "Compliance", "Last Maintenance"].map((h) => (
                          <th key={h} style={{
                            padding: "10px 14px", textAlign: "left", fontWeight: 600,
                            color: "#6B7280", fontSize: 12, whiteSpace: "nowrap",
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...riskItems].sort((a, b) => b.risk_score - a.risk_score).slice(0, 30).map((item) => (
                        <tr key={item.id} style={{ borderTop: "1px solid #F3F4F6" }}>
                          <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827" }}>{item.name || "—"}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ fontFamily: "monospace", background: "#F3F4F6", borderRadius: 4, padding: "2px 6px", fontSize: 11 }}>
                              {item.asset_code}
                            </span>
                          </td>
                          <td style={{ padding: "10px 14px", color: "#374151" }}>{item.category}</td>
                          <td style={{ padding: "10px 14px", color: "#6B7280" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <MapPin size={11} />{item.location || "—"}
                            </span>
                          </td>
                          <td style={{ padding: "10px 14px", minWidth: 140 }}>
                            <ScoreBar score={item.risk_score} />
                          </td>
                          <td style={{ padding: "10px 14px" }}>{riskBadge(item.risk_level)}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{
                              fontSize: 12, fontWeight: 600, borderRadius: 6, padding: "2px 8px",
                              background: item.compliance_status === "compliant" ? "#D1FAE5" : "#FEF3C7",
                              color: item.compliance_status === "compliant" ? "#065F46" : "#92400E",
                            }}>
                              {item.compliance_status}
                            </span>
                          </td>
                          <td style={{ padding: "10px 14px", color: "#6B7280", whiteSpace: "nowrap" }}>
                            {fmt(item.last_maintenance_date)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {riskItems.length > 30 && (
                    <p style={{ margin: "10px 0 0", fontSize: 12, color: "#9CA3AF", textAlign: "right" }}>
                      Showing top 30 of {riskItems.length} assets
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── Section 2: Critical Assets ───────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={Flame} title="Critical Assets" count={critical.length} color="#B91C1C" />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Critical",  count: riskItems.filter((r) => r.criticality.toLowerCase() === "critical").length,  bg: "#FEF2F2", color: "#991B1B", border: "#FECACA" },
                  { label: "High",      count: riskItems.filter((r) => r.criticality.toLowerCase() === "high").length,      bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
                  { label: "Medium",    count: riskItems.filter((r) => r.criticality.toLowerCase() === "medium").length,    bg: "#FFFBEB", color: "#92400E", border: "#FDE68A" },
                  { label: "Low",       count: riskItems.filter((r) => r.criticality.toLowerCase() === "low").length,       bg: "#F0FDF4", color: "#065F46", border: "#BBF7D0" },
                ].map((c) => (
                  <div key={c.label} style={{
                    background: c.bg, border: `1px solid ${c.border}`,
                    borderRadius: 10, padding: "14px 16px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: c.color }}>{c.count}</div>
                    <div style={{ fontSize: 12, color: c.color, fontWeight: 500, marginTop: 2 }}>{c.label} Criticality</div>
                  </div>
                ))}
              </div>

              {critical.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>No critical assets found.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                  {[...critical].sort((a, b) => b.risk_score - a.risk_score).map((item) => {
                    const rc = riskColor(item.risk_level);
                    const overdueDays = -daysDiff(item.next_maintenance_date);
                    return (
                      <div key={item.id} style={{
                        borderLeft: `4px solid ${rc.color}`,
                        background: rc.bg,
                        border: `1px solid ${rc.border}`,
                        borderLeftWidth: 4,
                        borderRadius: "0 10px 10px 0",
                        padding: "14px 16px",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div>
                            <div style={{ fontWeight: 700, color: "#111827", fontSize: 14 }}>{item.name || item.asset_code}</div>
                            <div style={{ fontSize: 11, color: "#6B7280", fontFamily: "monospace", marginTop: 2 }}>{item.asset_code}</div>
                          </div>
                          {riskBadge(item.risk_level)}
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <ScoreBar score={item.risk_score} />
                        </div>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, color: "#6B7280", display: "flex", alignItems: "center", gap: 3 }}>
                            <Tag size={10} /> {item.category}
                          </span>
                          <span style={{ fontSize: 11, color: "#6B7280", display: "flex", alignItems: "center", gap: 3 }}>
                            <MapPin size={10} /> {item.location || "—"}
                          </span>
                          {overdueDays > 0 && (
                            <span style={{ fontSize: 11, color: "#DC2626", fontWeight: 600 }}>
                              ⚠ {overdueDays}d overdue
                            </span>
                          )}
                        </div>
                        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600, borderRadius: 4, padding: "2px 7px",
                            background: "#FEF2F2", color: "#991B1B",
                          }}>
                            {item.criticality}
                          </span>
                          <span style={{
                            fontSize: 11, fontWeight: 600, borderRadius: 4, padding: "2px 7px",
                            background: item.compliance_status === "compliant" ? "#D1FAE5" : "#FEF3C7",
                            color: item.compliance_status === "compliant" ? "#065F46" : "#92400E",
                          }}>
                            {item.compliance_status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Section 3: Failure Prediction ───────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={TrendingUp} title="Failure Prediction" count={riskItems.length} color="#7C3AED" />

              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>
                Prediction based on risk score, overdue maintenance, and historical breakdown frequency.
              </p>

              {/* Prediction tally */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 24 }}>
                {[
                  { label: "Imminent",  count: imminent.length, ...predictionStyle("Imminent") },
                  { label: "At Risk",   count: atRisk.length,   ...predictionStyle("At Risk") },
                  { label: "Monitor",   count: monitor.length,  ...predictionStyle("Monitor") },
                  { label: "Stable",    count: stable.length,   ...predictionStyle("Stable") },
                ].map((c) => (
                  <div key={c.label} style={{
                    background: c.bg, border: `1px solid ${c.border}`,
                    borderRadius: 10, padding: "14px 16px", textAlign: "center",
                  }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.dot }} />
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: c.color }}>{c.count}</div>
                    <div style={{ fontSize: 12, color: c.color, fontWeight: 500, marginTop: 2 }}>{c.label}</div>
                  </div>
                ))}
              </div>

              {/* Imminent failures prominently */}
              {imminent.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
                    padding: "8px 12px", background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA",
                  }}>
                    <Zap size={14} color="#DC2626" />
                    <span style={{ fontWeight: 700, color: "#991B1B", fontSize: 13 }}>
                      Imminent Failures — Immediate Action Required
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {imminent.map(({ item, breakdowns }) => {
                      const overdueDays = -daysDiff(item.next_maintenance_date);
                      return (
                        <div key={item.id} style={{
                          borderLeft: "4px solid #DC2626",
                          background: "#FEF2F2", borderRadius: "0 10px 10px 0",
                          padding: "12px 16px", display: "flex", alignItems: "center", gap: 14,
                        }}>
                          <Zap size={18} color="#DC2626" style={{ flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: "#111827" }}>{item.name || item.asset_code}</div>
                            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3, display: "flex", gap: 14, flexWrap: "wrap" }}>
                              <span>{item.category}</span>
                              <span><MapPin size={10} style={{ verticalAlign: "middle" }} /> {item.location || "—"}</span>
                              {overdueDays > 0 && <span style={{ color: "#DC2626", fontWeight: 600 }}>{overdueDays}d maintenance overdue</span>}
                              {breakdowns > 0 && <span style={{ color: "#DC2626", fontWeight: 600 }}>{breakdowns} breakdowns recorded</span>}
                            </div>
                          </div>
                          <ScoreBar score={item.risk_score} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* At Risk list */}
              {atRisk.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#C2410C", marginBottom: 8 }}>
                    At Risk ({atRisk.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {atRisk.map(({ item, breakdowns }) => {
                      const overdueDays = -daysDiff(item.next_maintenance_date);
                      return (
                        <div key={item.id} style={{
                          borderLeft: "4px solid #D97706",
                          background: "#FFFBEB", borderRadius: "0 10px 10px 0",
                          padding: "10px 16px", display: "flex", alignItems: "center", gap: 14,
                        }}>
                          <TriangleAlert size={16} color="#D97706" style={{ flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: "#111827", fontSize: 13 }}>{item.name || item.asset_code}</div>
                            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2, display: "flex", gap: 10, flexWrap: "wrap" }}>
                              <span>{item.category}</span>
                              {overdueDays > 0 && <span style={{ color: "#D97706", fontWeight: 600 }}>{overdueDays}d overdue</span>}
                              {breakdowns > 0 && <span>{breakdowns} breakdown(s)</span>}
                            </div>
                          </div>
                          <ScoreBar score={item.risk_score} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Monitor list (compact) */}
              {monitor.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#854D0E", marginBottom: 8 }}>
                    Monitor ({monitor.length})
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {monitor.map(({ item }) => (
                      <div key={item.id} style={{
                        background: "#FFFBEB", border: "1px solid #FDE68A",
                        borderRadius: 8, padding: "6px 12px",
                        display: "flex", alignItems: "center", gap: 8,
                      }}>
                        <Eye size={12} color="#92400E" />
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#92400E" }}>{item.name || item.asset_code}</span>
                        <span style={{ fontSize: 11, color: "#A16207" }}>{item.risk_score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Section 4: Hazard Mapping ────────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon={MapPin} title="Hazard Mapping" count={locationMap.length} color="#0F766E" />

              <p style={{ margin: "0 0 18px", fontSize: 13, color: "#6B7280" }}>
                Risk concentration by location — sorted by average risk score.
              </p>

              {locationMap.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>No location data available.</div>
              ) : (
                <>
                  {/* Location risk heatmap cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14, marginBottom: 24 }}>
                    {locationMap.map((loc) => {
                      const heat = loc.avgScore >= 70 ? "#DC2626" : loc.avgScore >= 40 ? "#D97706" : "#16A34A";
                      const heatBg = loc.avgScore >= 70 ? "#FEF2F2" : loc.avgScore >= 40 ? "#FFF7ED" : "#F0FDF4";
                      const heatBorder = loc.avgScore >= 70 ? "#FECACA" : loc.avgScore >= 40 ? "#FED7AA" : "#BBF7D0";
                      return (
                        <div key={loc.location} style={{
                          background: heatBg, border: `1px solid ${heatBorder}`,
                          borderRadius: 12, padding: "16px 18px",
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <MapPin size={14} color={heat} />
                              <span style={{ fontWeight: 700, color: "#111827", fontSize: 14 }}>{loc.location}</span>
                            </div>
                            <span style={{
                              fontSize: 18, fontWeight: 800, color: heat,
                              background: "#fff", border: `1px solid ${heatBorder}`,
                              borderRadius: 8, padding: "2px 10px",
                            }}>{loc.avgScore}</span>
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <ScoreBar score={loc.avgScore} />
                          </div>
                          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{loc.total}</div>
                              <div style={{ fontSize: 10, color: "#6B7280" }}>Assets</div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontSize: 15, fontWeight: 700, color: "#DC2626" }}>{loc.highRiskCount}</div>
                              <div style={{ fontSize: 10, color: "#6B7280" }}>High Risk</div>
                            </div>
                            <div style={{ textAlign: "center", minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {loc.topCategory}
                              </div>
                              <div style={{ fontSize: 10, color: "#6B7280" }}>Top Category</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Hazard table */}
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#F9FAFB" }}>
                          {["Location", "Total Assets", "High Risk", "Avg Risk Score", "Risk Level", "Top Category"].map((h) => (
                            <th key={h} style={{
                              padding: "10px 14px", textAlign: "left", fontWeight: 600,
                              color: "#6B7280", fontSize: 12, whiteSpace: "nowrap",
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {locationMap.map((loc) => {
                          const lvl = loc.avgScore >= 70 ? "High" : loc.avgScore >= 40 ? "Medium" : "Low";
                          return (
                            <tr key={loc.location} style={{ borderTop: "1px solid #F3F4F6" }}>
                              <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827" }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <MapPin size={12} color="#6B7280" />{loc.location}
                                </span>
                              </td>
                              <td style={{ padding: "10px 14px", color: "#374151", textAlign: "center" }}>{loc.total}</td>
                              <td style={{ padding: "10px 14px", textAlign: "center" }}>
                                {loc.highRiskCount > 0 ? (
                                  <span style={{
                                    fontWeight: 700, color: "#DC2626",
                                    background: "#FEF2F2", borderRadius: 6,
                                    padding: "2px 8px", fontSize: 12,
                                  }}>{loc.highRiskCount}</span>
                                ) : <span style={{ color: "#9CA3AF" }}>0</span>}
                              </td>
                              <td style={{ padding: "10px 14px", minWidth: 160 }}>
                                <ScoreBar score={loc.avgScore} />
                              </td>
                              <td style={{ padding: "10px 14px" }}>{riskBadge(lvl)}</td>
                              <td style={{ padding: "10px 14px", color: "#374151" }}>{loc.topCategory}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
