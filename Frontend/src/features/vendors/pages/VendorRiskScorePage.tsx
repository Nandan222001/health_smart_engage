import { useMemo } from "react";
import {
  ShieldAlert, TrendingUp, TrendingDown, AlertTriangle,
  RefreshCw, Shield, Activity, BarChart3,
} from "lucide-react";
import {
  useGetVendorRiskScoresQuery,
  useGetVendorComplianceQuery,
  type VendorRiskScore,
} from "@/features/vendors/api/vendorsApi";

// ── Helpers ────────────────────────────────────────────────────────────────

function riskCfg(score: number) {
  if (score >= 70) return { label: "High",      color: "#DC2626", bg: "#FEF2F2", bar: "#EF4444", dot: "#EF4444" };
  if (score >= 50) return { label: "Medium",    color: "#D97706", bg: "#FFFBEB", bar: "#F59E0B", dot: "#F59E0B" };
  if (score >= 30) return { label: "Low",       color: "#2563EB", bg: "#EFF6FF", bar: "#3B82F6", dot: "#3B82F6" };
  return                   { label: "Very Low", color: "#059669", bg: "#F0FDF4", bar: "#10B981", dot: "#10B981" };
}

function safetyCfg(score: number) {
  if (score >= 80) return { color: "#059669", bg: "#F0FDF4", label: "Excellent" };
  if (score >= 60) return { color: "#2563EB", bg: "#EFF6FF", label: "Good"      };
  if (score >= 40) return { color: "#D97706", bg: "#FFFBEB", label: "Fair"      };
  return                   { color: "#DC2626", bg: "#FEF2F2", label: "Poor"     };
}

function complianceCfg(score: number) {
  if (score >= 85) return { label: "Compliant", color: "#059669", bg: "#D1FAE5" };
  if (score >= 70) return { label: "Moderate",  color: "#D97706", bg: "#FEF3C7" };
  return                   { label: "At Risk",  color: "#DC2626", bg: "#FEE2E2" };
}

function Bar({ value, color, height = "h-2" }: { value: number; color: string; height?: string }) {
  return (
    <div className={`w-full ${height} rounded-full overflow-hidden bg-gray-100`}>
      <div className={`${height} rounded-full transition-all`}
        style={{ width: `${Math.min(value, 100)}%`, background: color }} />
    </div>
  );
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap"
      style={{ color, background: bg }}>
      {label}
    </span>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────

function Section({
  icon: Icon, title, subtitle, accent, count, children,
}: {
  icon: React.ElementType; title: string; subtitle: string;
  accent: string; count: number; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: "#F3F4F6" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: accent + "18" }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>{title}</h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: accent + "15", color: accent }}>
              {count}
            </span>
          </div>
          <p className="text-[12px]" style={{ color: "#9CA3AF" }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="py-12 text-center">
      <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-gray-200" />
      <p className="text-[13px] text-gray-400">{text}</p>
    </div>
  );
}

// ── Section 1: Vendor Risk Rating ──────────────────────────────────────────

function VendorRiskRatingSection({ vendors }: { vendors: VendorRiskScore[] }) {
  const sorted = useMemo(
    () => [...vendors].sort((a, b) => b.risk_score - a.risk_score),
    [vendors],
  );

  const high    = vendors.filter((v) => v.risk_score >= 70).length;
  const medium  = vendors.filter((v) => v.risk_score >= 50 && v.risk_score < 70).length;
  const low     = vendors.filter((v) => v.risk_score >= 30 && v.risk_score < 50).length;
  const veryLow = vendors.filter((v) => v.risk_score < 30).length;

  return (
    <Section icon={ShieldAlert} title="Vendor Risk Rating" accent="#DC2626" count={vendors.length}
      subtitle="Overall risk score per vendor — sorted highest to lowest">

      {/* Quick tally */}
      <div className="grid grid-cols-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        {[
          { label: "High",     value: high,    color: "#DC2626", bg: "#FEF2F2" },
          { label: "Medium",   value: medium,  color: "#D97706", bg: "#FFFBEB" },
          { label: "Low",      value: low,     color: "#2563EB", bg: "#EFF6FF" },
          { label: "Very Low", value: veryLow, color: "#059669", bg: "#F0FDF4" },
        ].map((s, i) => (
          <div key={s.label}
            className={`flex flex-col items-center py-3 gap-0.5${i < 3 ? " border-r" : ""}`}
            style={{ borderColor: "#F3F4F6", background: s.bg }}>
            <span className="text-[20px] font-black leading-none" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[10px] font-semibold" style={{ color: s.color + "AA" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {sorted.length === 0 ? <Empty text="No risk data available." /> : (
        <div className="divide-y" style={{ divideColor: "#F9FAFB" }}>
          {sorted.map((v) => {
            const rc = riskCfg(v.risk_score);
            return (
              <div key={v.vendor_id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                {/* Risk dot */}
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: rc.dot }} />

                {/* Vendor name */}
                <div className="w-44 flex-shrink-0">
                  <div className="text-[13px] font-bold" style={{ color: "#111827" }}>{v.vendor_name}</div>
                  <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{v.status}</div>
                </div>

                {/* Bar + score */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold" style={{ color: "#9CA3AF" }}>Risk Score</span>
                    <span className="text-[15px] font-black" style={{ color: rc.color }}>{v.risk_score}</span>
                  </div>
                  <Bar value={v.risk_score} color={rc.bar} />
                </div>

                {/* Badge */}
                <div className="flex-shrink-0 w-20 text-right">
                  <Badge label={rc.label} color={rc.color} bg={rc.bg} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

// ── Section 2: Safety Performance ─────────────────────────────────────────

function SafetyPerformanceSection({ vendors }: { vendors: VendorRiskScore[] }) {
  const sorted = useMemo(
    () => [...vendors].sort((a, b) => a.safety_score - b.safety_score),
    [vendors],
  );

  const avgSafety = vendors.length
    ? Math.round(vendors.reduce((s, v) => s + v.safety_score, 0) / vendors.length)
    : 0;

  return (
    <Section icon={Activity} title="Safety Performance" accent="#2563EB" count={vendors.length}
      subtitle="Safety score per vendor — sorted lowest first to highlight underperformers">

      {/* Avg banner */}
      <div className="flex items-center gap-3 px-6 py-3 border-b" style={{ borderColor: "#F3F4F6", background: "#F8FAFF" }}>
        <span className="text-[12px] font-semibold" style={{ color: "#6B7280" }}>Average Safety Score</span>
        <div className="flex-1 max-w-xs">
          <Bar value={avgSafety} color={safetyCfg(avgSafety).color} />
        </div>
        <span className="text-[16px] font-black" style={{ color: safetyCfg(avgSafety).color }}>{avgSafety}</span>
        <Badge label={safetyCfg(avgSafety).label} color={safetyCfg(avgSafety).color} bg={safetyCfg(avgSafety).bg} />
      </div>

      {sorted.length === 0 ? <Empty text="No safety data available." /> : (
        <div className="divide-y" style={{ divideColor: "#F9FAFB" }}>
          {sorted.map((v) => {
            const sc = safetyCfg(v.safety_score);
            const isPoor = v.safety_score < 60;
            return (
              <div key={v.vendor_id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
                style={isPoor ? { borderLeft: "3px solid #EF4444" } : {}}>
                {/* Vendor */}
                <div className="w-44 flex-shrink-0">
                  <div className="text-[13px] font-bold" style={{ color: "#111827" }}>{v.vendor_name}</div>
                </div>

                {/* Bar */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold" style={{ color: "#9CA3AF" }}>Safety Score</span>
                    <span className="text-[15px] font-black" style={{ color: sc.color }}>{v.safety_score}</span>
                  </div>
                  <Bar value={v.safety_score} color={sc.color} />
                </div>

                {/* Rating badge */}
                <div className="flex-shrink-0 w-24 text-right">
                  <Badge label={sc.label} color={sc.color} bg={sc.bg} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

// ── Section 3: Incident Trends ─────────────────────────────────────────────

function IncidentTrendsSection({ vendors }: { vendors: VendorRiskScore[] }) {
  const sorted = useMemo(
    () => [...vendors].sort((a, b) => b.incident_count - a.incident_count),
    [vendors],
  );

  const totalIncidents = vendors.reduce((s, v) => s + v.incident_count, 0);
  const maxIncidents   = Math.max(...vendors.map((v) => v.incident_count), 1);
  const zeroIncidents  = vendors.filter((v) => v.incident_count === 0).length;

  return (
    <Section icon={AlertTriangle} title="Incident Trends" accent="#D97706" count={vendors.length}
      subtitle="Incident count per vendor — sorted most incidents first">

      {/* Summary */}
      <div className="grid grid-cols-3 border-b" style={{ borderColor: "#F3F4F6" }}>
        {[
          { label: "Total Incidents",  value: totalIncidents, color: "#DC2626", bg: "#FEF2F2" },
          { label: "Vendors With Incidents", value: vendors.length - zeroIncidents, color: "#D97706", bg: "#FFFBEB" },
          { label: "Zero Incidents",   value: zeroIncidents,  color: "#059669", bg: "#F0FDF4" },
        ].map((s, i) => (
          <div key={s.label}
            className={`flex flex-col items-center py-3 gap-0.5 ${i < 2 ? "border-r" : ""}`}
            style={{ borderColor: "#F3F4F6", background: s.bg }}>
            <span className="text-[20px] font-black leading-none" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[10px] font-semibold text-center px-2"
              style={{ color: s.color + "AA" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {sorted.length === 0 ? <Empty text="No incident data available." /> : (
        <div className="divide-y" style={{ divideColor: "#F9FAFB" }}>
          {sorted.map((v) => {
            const pct = maxIncidents > 0 ? (v.incident_count / maxIncidents) * 100 : 0;
            const barColor = v.incident_count === 0 ? "#10B981"
              : v.incident_count >= 5 ? "#EF4444"
              : v.incident_count >= 2 ? "#F59E0B"
              : "#3B82F6";
            return (
              <div key={v.vendor_id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                {/* Trend icon */}
                <div className="flex-shrink-0">
                  {v.incident_count === 0
                    ? <TrendingDown className="w-5 h-5" style={{ color: "#10B981" }} />
                    : <TrendingUp   className="w-5 h-5" style={{ color: v.incident_count >= 3 ? "#EF4444" : "#F59E0B" }} />}
                </div>

                {/* Vendor */}
                <div className="w-40 flex-shrink-0">
                  <div className="text-[13px] font-bold" style={{ color: "#111827" }}>{v.vendor_name}</div>
                </div>

                {/* Incident bar */}
                <div className="flex-1">
                  <Bar value={pct} color={barColor} />
                </div>

                {/* Count */}
                <div className="flex-shrink-0 w-28 flex items-center justify-end gap-2">
                  <span className="text-[15px] font-black" style={{ color: barColor }}>
                    {v.incident_count}
                  </span>
                  <span className="text-[11px]" style={{ color: "#9CA3AF" }}>
                    incident{v.incident_count !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

// ── Section 4: Compliance Score ────────────────────────────────────────────

function ComplianceScoreSection() {
  const { data: records = [], isLoading } = useGetVendorComplianceQuery();

  const sorted = useMemo(
    () => [...records].sort((a, b) => a.overall_score - b.overall_score),
    [records],
  );

  const avgScore    = records.length
    ? Math.round(records.reduce((s, r) => s + r.overall_score, 0) / records.length)
    : 0;
  const compliant   = records.filter((r) => r.overall_score >= 85).length;
  const moderate    = records.filter((r) => r.overall_score >= 70 && r.overall_score < 85).length;
  const atRisk      = records.filter((r) => r.overall_score < 70).length;

  if (isLoading) {
    return (
      <Section icon={BarChart3} title="Compliance Score" accent="#8B5CF6" count={0}
        subtitle="Vendor compliance scores from audit data">
        <div className="py-10 text-center">
          <RefreshCw className="w-6 h-6 mx-auto animate-spin text-purple-400" />
        </div>
      </Section>
    );
  }

  return (
    <Section icon={BarChart3} title="Compliance Score" accent="#8B5CF6" count={records.length}
      subtitle="Overall compliance score per vendor — sorted lowest first">

      {/* Avg + breakdown */}
      <div className="flex items-center gap-4 px-6 py-3 border-b" style={{ borderColor: "#F3F4F6", background: "#FAFAFF" }}>
        <div className="flex-1 flex items-center gap-3">
          <span className="text-[12px] font-semibold" style={{ color: "#6B7280" }}>Average</span>
          <div className="flex-1 max-w-xs">
            <Bar value={avgScore}
              color={avgScore >= 85 ? "#10B981" : avgScore >= 70 ? "#F59E0B" : "#EF4444"} />
          </div>
          <span className="text-[16px] font-black"
            style={{ color: avgScore >= 85 ? "#059669" : avgScore >= 70 ? "#D97706" : "#DC2626" }}>
            {avgScore}%
          </span>
        </div>
        <div className="flex items-center gap-3 border-l pl-4" style={{ borderColor: "#E5E7EB" }}>
          {[
            { label: "Compliant", value: compliant, color: "#059669" },
            { label: "Moderate",  value: moderate,  color: "#D97706" },
            { label: "At Risk",   value: atRisk,    color: "#DC2626" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-[14px] font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] font-semibold" style={{ color: s.color + "99" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? <Empty text="No compliance data available." /> : (
        <div className="divide-y" style={{ divideColor: "#F9FAFB" }}>
          {sorted.map((r) => {
            const cc = complianceCfg(r.overall_score);
            const barColor = r.overall_score >= 85 ? "#10B981" : r.overall_score >= 70 ? "#F59E0B" : "#EF4444";
            return (
              <div key={r.vendor_id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                {/* Vendor */}
                <div className="w-44 flex-shrink-0">
                  <div className="text-[13px] font-bold" style={{ color: "#111827" }}>{r.vendor_name}</div>
                  {(r.domains || []).length > 0 && (
                    <div className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>
                      {r.domains.length} domain{r.domains.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                {/* Bar */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold" style={{ color: "#9CA3AF" }}>Score</span>
                    <span className="text-[15px] font-black" style={{ color: barColor }}>
                      {Math.round(r.overall_score)}%
                    </span>
                  </div>
                  <Bar value={r.overall_score} color={barColor} />
                </div>

                {/* Badge */}
                <div className="flex-shrink-0 w-24 text-right">
                  <Badge label={cc.label} color={cc.color} bg={cc.bg} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export function VendorRiskScorePage() {
  const { data: vendors = [], isLoading, refetch } = useGetVendorRiskScoresQuery();

  const avgRisk      = vendors.length
    ? Math.round(vendors.reduce((s, v) => s + v.risk_score, 0) / vendors.length) : 0;
  const highRisk     = vendors.filter((v) => v.risk_score >= 70).length;
  const totalInc     = vendors.reduce((s, v) => s + v.incident_count, 0);
  const avgSafety    = vendors.length
    ? Math.round(vendors.reduce((s, v) => s + v.safety_score, 0) / vendors.length) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <RefreshCw className="w-7 h-7 animate-spin text-red-400 mr-3" />
        <span className="text-sm text-gray-400">Loading risk data…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Banner ───────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, #7F1D1D 0%, #0F172A 100%)" }}>
        <div className="px-8 pt-8 pb-0">
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-1"
            style={{ color: "rgba(255,255,255,0.4)" }}>
            Vendor Management
          </p>
          <h1 className="text-[26px] font-black text-white">Vendor Risk Score</h1>
          <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Risk ratings · Safety performance · Incident trends · Compliance scores
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex flex-wrap border-t mt-6" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          {[
            { label: "Avg Risk Score",  value: avgRisk,   color: avgRisk >= 50 ? "#F87171" : "#34D399" },
            { label: "High Risk",       value: highRisk,  color: "#F87171" },
            { label: "Total Incidents", value: totalInc,  color: "#FBBF24" },
            { label: "Avg Safety",      value: avgSafety, color: avgSafety >= 60 ? "#34D399" : "#F87171" },
          ].map((s, i, arr) => (
            <div key={s.label} className="flex-1 min-w-[110px] flex flex-col items-center text-center px-4 py-4 gap-0.5"
              style={{ borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.1)" : undefined }}>
              <span className="text-[30px] font-black leading-none" style={{ color: s.color }}>{s.value}</span>
              <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4 sections ───────────────────────────────────────── */}
      <div className="p-6 space-y-6">
        <VendorRiskRatingSection  vendors={vendors} />
        <SafetyPerformanceSection vendors={vendors} />
        <IncidentTrendsSection    vendors={vendors} />
        <ComplianceScoreSection />
      </div>
    </div>
  );
}
