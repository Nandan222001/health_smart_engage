import { useState, useEffect, useMemo } from "react";
import {
  Activity, RefreshCw, Flame, Zap, ArrowUpFromLine, Disc, Layers, Lock,
  FileText, MapPin, Clock, AlertTriangle, CheckCircle2, Shield,
  Users, Eye, XCircle, TrendingUp, AlertOctagon,
} from "lucide-react";
import { useListPermitsQuery } from "@/features/permits/api/permitsApi";
import { useListHazardsQuery } from "@/features/hazards/api/hazardsApi";
import { useGetViolationsQuery } from "@/features/violations/api/violationsApi";
import { useClosePermitMutation } from "@/features/permits/api/permitsApi";
import type { Permit } from "@/features/permits/api/permitsApi";
import type { Hazard } from "@/features/hazards/api/hazardsApi";
import type { Violation } from "@/services/api";

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

type Tab = "live" | "sites" | "hazards" | "violations";

interface TypeCfg { icon: typeof Flame; color: string; bg: string; border: string; riskLabel: string; isHighRisk: boolean; }
const TYPE_CFG: Record<string, TypeCfg> = {
  "Hot Work":        { icon: Flame,           color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", riskLabel: "High Risk",  isHighRisk: true },
  "Electrical Work": { icon: Zap,             color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", riskLabel: "High Risk",  isHighRisk: true },
  "Work at Height":  { icon: ArrowUpFromLine, color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", riskLabel: "High Risk",  isHighRisk: true },
  "Confined Space":  { icon: Disc,            color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", riskLabel: "Critical",   isHighRisk: true },
  "Excavation":      { icon: Layers,          color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA", riskLabel: "High Risk",  isHighRisk: true },
  "Isolation/LOTO":  { icon: Lock,            color: "#374151", bg: "#F3F4F6", border: "#E5E7EB", riskLabel: "Controlled", isHighRisk: false },
};
function getTypeCfg(type: string): TypeCfg {
  const k = Object.keys(TYPE_CFG).find((k) => type?.toLowerCase().includes(k.toLowerCase()));
  return k ? TYPE_CFG[k] : { icon: FileText, color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", riskLabel: "Standard", isHighRisk: false };
}

function isActive(p: Permit) { return p.status === "active" || p.status === "approved"; }

interface ExpiryInfo { msLeft: number; label: string; color: string; bg: string; border: string; urgent: boolean; expired: boolean; }
function expiryInfo(endDate: string | undefined, now: number): ExpiryInfo {
  if (!endDate) return { msLeft: Infinity, label: "No expiry set", color: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB", urgent: false, expired: false };
  const msLeft = new Date(endDate).getTime() - now;
  const expired = msLeft <= 0;
  const h = Math.floor(Math.abs(msLeft) / 3_600_000);
  const m = Math.floor((Math.abs(msLeft) % 3_600_000) / 60_000);
  const d = Math.floor(h / 24);
  const label = expired
    ? `Expired ${d > 0 ? `${d}d` : `${h}h`} ago`
    : d >= 2 ? `${d}d ${h % 24}h left`
    : h >= 1 ? `${h}h ${m}m left`
    : `${m}m left`;

  if (expired)        return { msLeft, label, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", urgent: true,  expired: true  };
  if (msLeft < 3.6e6 * 4)  return { msLeft, label, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", urgent: true,  expired: false }; // < 4h
  if (msLeft < 3.6e6 * 24) return { msLeft, label, color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", urgent: true,  expired: false }; // < 24h
  return                          { msLeft, label, color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", urgent: false, expired: false };
}

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const SEV_COLOR: Record<string, string> = { critical: "#DC2626", Critical: "#DC2626", high: "#EA580C", High: "#EA580C", medium: "#D97706", Medium: "#D97706", low: "#16A34A", Low: "#16A34A" };

// ---------------------------------------------------------------------------
// Expiry Countdown Ring
// ---------------------------------------------------------------------------

function ExpiryRing({ info, size = 60 }: { info: ExpiryInfo; size?: number }) {
  if (!isFinite(info.msLeft)) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ width: size, height: size, borderRadius: "50%", border: `3px solid #E5E7EB`, display: "flex", alignItems: "center", justifyContent: "center", background: "#F9FAFB" }}>
          <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, textAlign: "center", lineHeight: 1.2, padding: 4 }}>No Expiry</span>
        </div>
      </div>
    );
  }
  const total24h = 24 * 3_600_000;
  const pct = info.expired ? 0 : Math.min(100, (info.msLeft / total24h) * 100);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ width: size, height: size, borderRadius: "50%", border: `3px solid ${info.color}`, display: "flex", alignItems: "center", justifyContent: "center", background: info.bg, position: "relative" }}>
        {info.urgent && !info.expired && (
          <div style={{ position: "absolute", top: -3, right: -3, width: 12, height: 12, borderRadius: "50%", background: "#DC2626", border: "2px solid #fff" }} />
        )}
        <div style={{ textAlign: "center", padding: 4 }}>
          <div style={{ fontSize: size > 50 ? 11 : 9, fontWeight: 700, color: info.color, lineHeight: 1.2 }}>
            {info.label.split(" ").slice(0, 2).join("\n")}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 9, color: "#9CA3AF", marginTop: 2 }}>Expiry</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Permit Card
// ---------------------------------------------------------------------------

function ActivePermitCard({ permit, now, onClose }: { permit: Permit; now: number; onClose: (id: string) => void }) {
  const typeCfg  = getTypeCfg(permit.type);
  const TypeIcon = typeCfg.icon;
  const expiry   = expiryInfo(permit.end_date, now);

  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${expiry.expired ? "#FECACA" : expiry.urgent ? "#FDE68A" : "#E5E7EB"}`,
      borderLeft: `4px solid ${expiry.color}`,
      borderRadius: "0 14px 14px 0",
      padding: "16px 18px",
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* Type icon */}
        <div style={{ width: 40, height: 40, borderRadius: 10, background: typeCfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <TypeIcon size={18} color={typeCfg.color} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title + badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{permit.title}</span>
            <span style={{ padding: "2px 8px", borderRadius: 10, background: "#EFF6FF", border: "1px solid #BFDBFE", fontSize: 10, fontWeight: 700, color: "#2563EB" }}>ACTIVE</span>
            {typeCfg.isHighRisk && <span style={{ padding: "2px 8px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", fontSize: 10, fontWeight: 700, color: "#DC2626" }}>HIGH RISK</span>}
            {expiry.expired && <span style={{ padding: "2px 8px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", fontSize: 10, fontWeight: 700, color: "#DC2626" }}>EXPIRED</span>}
          </div>

          {/* Meta row */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <MapPin size={11} color="#9CA3AF" />
              <span style={{ fontSize: 12, color: "#6B7280" }}>{permit.site_id || "No site"}{permit.zone_id ? ` · ${permit.zone_id}` : ""}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Users size={11} color="#9CA3AF" />
              <span style={{ fontSize: 12, color: "#6B7280" }}>{permit.requested_by}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Users size={11} color="#9CA3AF" />
              <span style={{ fontSize: 12, color: "#6B7280" }}>{permit.worker_count || 0} Workers</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <TypeIcon size={11} color={typeCfg.color} />
              <span style={{ fontSize: 12, color: typeCfg.color, fontWeight: 600 }}>{permit.type}</span>
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: "flex", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>Start: <strong style={{ color: "#374151" }}>{fmt(permit.start_date)}</strong></span>
            <span style={{ fontSize: 11, color: expiry.expired ? "#DC2626" : "#9CA3AF" }}>End: <strong style={{ color: expiry.expired ? "#DC2626" : "#374151" }}>{fmt(permit.end_date)}</strong></span>
          </div>

          {/* Risk + close */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: "#FEF2F2", border: "1px solid #FECACA" }}>
              <Shield size={11} color={typeCfg.color} />
              <span style={{ fontSize: 11, fontWeight: 700, color: typeCfg.color }}>{typeCfg.riskLabel}</span>
            </div>
            <button onClick={() => onClose(permit.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#F9FAFB", fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
              <XCircle size={12} /> Close Permit
            </button>
          </div>
        </div>

        {/* Expiry ring */}
        <ExpiryRing info={expiry} size={62} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1 — Live Permits
// ---------------------------------------------------------------------------

function LivePermitsTab({ permits, now, onClose }: { permits: Permit[]; now: number; onClose: (id: string) => void }) {
  const [filter, setFilter] = useState<"all" | "highrisk" | "expiring">("all");
  const active = permits.filter(isActive);

  const visible = filter === "highrisk"
    ? active.filter((p) => getTypeCfg(p.type).isHighRisk)
    : filter === "expiring"
      ? active.filter((p) => p.end_date && expiryInfo(p.end_date, now).urgent)
      : active;

  const expiringCount  = active.filter((p) => p.end_date && expiryInfo(p.end_date, now).urgent && !expiryInfo(p.end_date, now).expired).length;
  const expiredCount   = active.filter((p) => p.end_date && expiryInfo(p.end_date, now).expired).length;
  const highRiskCount  = active.filter((p) => getTypeCfg(p.type).isHighRisk).length;

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Mini summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { key: "all",       label: "All Active",      value: active.length,      color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
          { key: "highrisk",  label: "High-Risk Work",  value: highRiskCount,      color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
          { key: "expiring",  label: "Expiring Soon",   value: expiringCount,      color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
          { key: "_expired",  label: "Expired",         value: expiredCount,       color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
        ].map((s) => (
          <button key={s.key} disabled={s.key === "_expired"} onClick={() => s.key !== "_expired" && setFilter(s.key as "all" | "highrisk" | "expiring")}
            style={{ flex: "1 1 130px", padding: "12px 16px", borderRadius: 10, border: `2px solid ${filter === s.key ? s.color : s.border}`, background: s.bg, cursor: s.key === "_expired" ? "default" : "pointer", textAlign: "left" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>{s.label}</div>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center" }}>
          <Activity size={36} color="#D1D5DB" style={{ display: "block", margin: "0 auto 12px" }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>No active permits</div>
          <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>No permits match this filter.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {visible.map((p) => <ActivePermitCard key={p.id} permit={p} now={now} onClose={onClose} />)}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 — Site Operations Status
// ---------------------------------------------------------------------------

function SiteOperationsTab({ permits, now }: { permits: Permit[]; now: number }) {
  const active = permits.filter(isActive);

  const siteMap = useMemo(() => {
    const m = new Map<string, { permits: Permit[]; highRisk: number; expiring: number; expired: number }>();
    for (const p of active) {
      const site = p.site_id || "Unassigned";
      if (!m.has(site)) m.set(site, { permits: [], highRisk: 0, expiring: 0, expired: 0 });
      const s = m.get(site)!;
      s.permits.push(p);
      if (getTypeCfg(p.type).isHighRisk) s.highRisk++;
      const ei = expiryInfo(p.end_date, now);
      if (ei.expired) s.expired++;
      else if (ei.urgent) s.expiring++;
    }
    return Array.from(m.entries()).sort((a, b) => b[1].permits.length - a[1].permits.length);
  }, [active, now]);

  if (siteMap.length === 0) {
    return <div style={{ padding: 48, textAlign: "center", color: "#9CA3AF" }}>No active site operations.</div>;
  }

  return (
    <div style={{ padding: "24px 28px" }}>
      {siteMap.map(([site, data]) => {
        const hasAlerts = data.highRisk > 0 || data.expiring > 0 || data.expired > 0;
        return (
          <div key={site} style={{ background: "#fff", border: `1px solid ${hasAlerts ? "#FDE68A" : "#E5E7EB"}`, borderRadius: 14, marginBottom: 16, overflow: "hidden" }}>
            {/* Site header */}
            <div style={{ background: hasAlerts ? "#FFFBEB" : "#F9FAFB", padding: "14px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: hasAlerts ? "#FDE68A" : "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MapPin size={16} color={hasAlerts ? "#D97706" : "#6B7280"} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{site}</div>
                  <div style={{ fontSize: 11, color: "#6B7280" }}>{data.permits.length} active permit{data.permits.length !== 1 ? "s" : ""}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {data.highRisk > 0 && <span style={{ padding: "3px 10px", borderRadius: 20, background: "#FEF2F2", border: "1px solid #FECACA", fontSize: 11, fontWeight: 700, color: "#DC2626" }}>{data.highRisk} High Risk</span>}
                {data.expiring > 0 && <span style={{ padding: "3px 10px", borderRadius: 20, background: "#FFFBEB", border: "1px solid #FDE68A", fontSize: 11, fontWeight: 700, color: "#D97706" }}>{data.expiring} Expiring</span>}
                {data.expired > 0  && <span style={{ padding: "3px 10px", borderRadius: 20, background: "#FEF2F2", border: "1px solid #FECACA", fontSize: 11, fontWeight: 700, color: "#DC2626" }}>{data.expired} Expired</span>}
                <span style={{ padding: "3px 10px", borderRadius: 20, background: "#EFF6FF", border: "1px solid #BFDBFE", fontSize: 11, fontWeight: 700, color: "#2563EB" }}>LIVE</span>
              </div>
            </div>
            {/* Permits */}
            <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {data.permits.map((p) => {
                const typeCfg = getTypeCfg(p.type);
                const TI = typeCfg.icon;
                const ei = expiryInfo(p.end_date, now);
                return (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#FAFAFA", borderRadius: 10, border: "1px solid #F3F4F6" }}>
                    <TI size={14} color={typeCfg.color} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: "#6B7280" }}>{p.type} · {p.requested_by}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: ei.color, whiteSpace: "nowrap" }}>{ei.label}</div>
                    <span style={{ padding: "2px 8px", borderRadius: 10, background: typeCfg.bg, fontSize: 10, fontWeight: 700, color: typeCfg.color, whiteSpace: "nowrap" }}>{typeCfg.riskLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3 — Hazard Monitoring
// ---------------------------------------------------------------------------

function HazardMonitoringTab({ permits, hazards }: { permits: Permit[]; hazards: Hazard[] }) {
  const activeZones = useMemo(() => {
    const zones = new Set<string>();
    const sites = new Set<string>();
    for (const p of permits.filter(isActive)) {
      if (p.zone_id) zones.add(p.zone_id);
      if (p.site_id) sites.add(p.site_id);
    }
    return { zones, sites };
  }, [permits]);

  const relevantHazards = useMemo(() =>
    hazards.filter((h) =>
      (h.zone_id && activeZones.zones.has(h.zone_id)) ||
      (h.site_id && activeZones.sites.has(h.site_id))
    ).sort((a, b) => {
      const ord: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (ord[a.severity] ?? 4) - (ord[b.severity] ?? 4);
    }),
    [hazards, activeZones]
  );

  const critical = relevantHazards.filter((h) => h.severity === "critical");
  const openHazards = relevantHazards.filter((h) => h.status === "open");

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Alert banner */}
      {critical.length > 0 && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
          <AlertTriangle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#DC2626" }}>Critical Hazards in Active Work Zones</div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>{critical.length} critical hazard{critical.length !== 1 ? "s" : ""} detected in zones with live permits — immediate attention required.</div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Hazards in Active Zones", value: relevantHazards.length, color: "#374151", bg: "#F9FAFB", border: "#E5E7EB" },
          { label: "Critical",               value: relevantHazards.filter((h) => h.severity === "critical").length, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
          { label: "Open / Unmitigated",     value: openHazards.length,       color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA" },
          { label: "Zones Monitored",        value: activeZones.zones.size + activeZones.sites.size, color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
        ].map((s) => (
          <div key={s.label} style={{ flex: "1 1 140px", background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {relevantHazards.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center" }}>
          <CheckCircle2 size={36} color="#16A34A" style={{ opacity: 0.3, display: "block", margin: "0 auto 10px" }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>No hazards in active work zones</div>
          <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>Work areas are clear of recorded hazards.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {relevantHazards.map((h) => {
            const col = SEV_COLOR[h.severity] ?? "#6B7280";
            const relatedPermits = permits.filter(isActive).filter((p) => p.zone_id === h.zone_id || p.site_id === h.site_id);
            return (
              <div key={h.id} style={{ background: "#fff", border: `1px solid ${h.severity === "critical" ? "#FECACA" : "#E5E7EB"}`, borderLeft: `4px solid ${col}`, borderRadius: "0 12px 12px 0", padding: "14px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{h.title}</span>
                      <span style={{ padding: "2px 8px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", fontSize: 10, fontWeight: 700, color: col, textTransform: "uppercase" }}>{h.severity}</span>
                      <span style={{ padding: "2px 8px", borderRadius: 10, background: "#F3F4F6", fontSize: 10, fontWeight: 600, color: "#374151" }}>{h.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>{h.type} · Zone: {h.zone_id || h.site_id || "Unknown"}</div>
                  </div>
                </div>
                {relatedPermits.length > 0 && (
                  <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: "8px 12px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#D97706", marginBottom: 4 }}>ACTIVE PERMITS IN THIS ZONE</div>
                    {relatedPermits.map((rp) => (
                      <div key={rp.id} style={{ fontSize: 12, color: "#374151", display: "flex", alignItems: "center", gap: 6 }}>
                        <Activity size={11} color="#D97706" /> {rp.title} ({rp.type})
                      </div>
                    ))}
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

// ---------------------------------------------------------------------------
// Tab 4 — Permit Violations
// ---------------------------------------------------------------------------

function PermitViolationsTab({ permits, violations }: { permits: Permit[]; violations: Violation[] }) {
  const activeZones = useMemo(() => {
    const zones = new Set<string>(); const sites = new Set<string>();
    for (const p of permits.filter(isActive)) { if (p.zone_id) zones.add(p.zone_id); if (p.site_id) sites.add(p.site_id); }
    return { zones, sites };
  }, [permits]);

  const relevantViolations = useMemo(() =>
    violations.filter((v) =>
      (v.Zone_ID && activeZones.zones.has(v.Zone_ID)) ||
      (v.Site_ID && activeZones.sites.has(v.Site_ID))
    ).sort((a, b) => {
      const ord: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return (ord[a.Severity] ?? 4) - (ord[b.Severity] ?? 4);
    }),
    [violations, activeZones]
  );

  const critical = relevantViolations.filter((v) => v.Severity === "Critical").length;
  const open     = relevantViolations.filter((v) => v.Status !== "closed" && v.Status !== "resolved").length;

  return (
    <div style={{ padding: "24px 28px" }}>
      {critical > 0 && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
          <AlertOctagon size={20} color="#DC2626" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#DC2626" }}>Critical Violations in Active Work Zones</div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>{critical} critical violation{critical !== 1 ? "s" : ""} detected — potential permit non-compliance.</div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Violations in Active Zones", value: relevantViolations.length, color: "#374151", bg: "#F9FAFB", border: "#E5E7EB" },
          { label: "Critical",  value: critical, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
          { label: "Open",      value: open,     color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA" },
        ].map((s) => (
          <div key={s.label} style={{ flex: "1 1 140px", background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {relevantViolations.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center" }}>
          <CheckCircle2 size={36} color="#16A34A" style={{ opacity: 0.3, display: "block", margin: "0 auto 10px" }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>No violations in active permit zones</div>
          <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>Permit operations are running without recorded violations.</div>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", padding: "10px 16px", gap: 8 }}>
            {["Violation Type", "Zone", "Severity", "Status", "Detected"].map((h) => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>{h}</div>
            ))}
          </div>
          {relevantViolations.map((v, i) => {
            const col = SEV_COLOR[v.Severity] ?? "#6B7280";
            const relatedPermits = permits.filter(isActive).filter((p) => p.zone_id === v.Zone_ID || p.site_id === v.Site_ID);
            return (
              <div key={v.Violation_ID} style={{ borderBottom: "1px solid #F3F4F6" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "11px 16px", gap: 8, background: i % 2 === 0 ? "#fff" : "#FAFAFA", alignItems: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{v.Violation_Type}</div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>{v.Zone_ID || v.Site_ID || "—"}</div>
                  <span style={{ padding: "2px 8px", borderRadius: 10, background: `${col}15`, fontSize: 11, fontWeight: 700, color: col, display: "inline-block" }}>{v.Severity}</span>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>{v.Status}</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>{v.Detected_At ? new Date(v.Detected_At).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—"}</div>
                </div>
                {relatedPermits.length > 0 && (
                  <div style={{ padding: "6px 16px 10px", background: "#FFFBEB", borderTop: "1px solid #FEF3C7" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#D97706" }}>ACTIVE PERMIT: </span>
                    {relatedPermits.map((rp) => (
                      <span key={rp.id} style={{ fontSize: 11, color: "#374151", marginLeft: 4 }}>{rp.title}</span>
                    ))}
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

// ---------------------------------------------------------------------------
// Page shell
// ---------------------------------------------------------------------------

const TABS: { key: Tab; label: string; icon: typeof Activity }[] = [
  { key: "live",       label: "Live Permits",       icon: Activity },
  { key: "sites",      label: "Site Operations",     icon: MapPin },
  { key: "hazards",    label: "Hazard Monitoring",   icon: AlertTriangle },
  { key: "violations", label: "Permit Violations",   icon: Eye },
];

export function ActiveWorkPermitsPage() {
  const { data: permits    = [], isLoading: l1, refetch: r1 } = useListPermitsQuery();
  const { data: hazards    = [], isLoading: l2, refetch: r2 } = useListHazardsQuery();
  const { data: violations = [], isLoading: l3, refetch: r3 } = useGetViolationsQuery();
  const [closePermit] = useClosePermitMutation();
  const [activeTab, setActiveTab] = useState<Tab>("live");

  // Live clock — updates every 30s so expiry timers stay current
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const isLoading = l1 || l2 || l3;
  const handleClose = async (id: string) => { try { await closePermit(id).unwrap(); } catch { /**/ } };
  const handleRefresh = () => { r1(); r2(); r3(); setNow(Date.now()); };

  const active      = permits.filter(isActive);
  const highRisk    = active.filter((p) => getTypeCfg(p.type).isHighRisk);
  const expiring    = active.filter((p) => p.end_date && expiryInfo(p.end_date, now).urgent && !expiryInfo(p.end_date, now).expired);
  const sitesActive = new Set(active.map((p) => p.site_id).filter(Boolean)).size;
  const totalWorkers = active.reduce((acc, p) => acc + (p.worker_count || 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: "#F3F7FF" }}>
      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, #064E3B 0%, #065F46 45%, #0F172A 100%)", padding: "28px 32px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <Activity size={22} color="#6EE7B7" />
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#fff" }}>Active Work Permits</h1>
              {/* Live pulse */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 20 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 6px #34D399" }} />
                <span style={{ fontSize: 11, color: "#6EE7B7", fontWeight: 700 }}>LIVE</span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#A7F3D0", opacity: 0.85 }}>
              Real-time tracking of all active permits · hazard &amp; violation monitoring
            </p>
          </div>
          <button onClick={handleRefresh} disabled={isLoading}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "#fff", fontSize: 13, cursor: "pointer" }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 0 }}>
          {[
            { label: "Live Active Permits",  value: active.length,     color: "#6EE7B7" },
            { label: "High-Risk Work",       value: highRisk.length,   color: "#FCA5A5" },
            { label: "Total Workers",        value: totalWorkers,      color: "#93C5FD" },
            { label: "Sites Operational",    value: sitesActive,       color: "#93C5FD" },
            { label: "Expiring Soon",        value: expiring.length,   color: "#FDE68A" },
            { label: "Hazards Monitored",    value: hazards.filter((h) => active.some((p) => p.zone_id === h.zone_id || p.site_id === h.site_id)).length, color: "#FCA5A5" },
          ].map((s, i) => (
            <div key={s.label} style={{ flex: 1, padding: "12px 20px", borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginTop: 16 }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "10px 20px", border: "none", cursor: "pointer",
                borderRadius: "8px 8px 0 0", fontSize: 13, fontWeight: isActive ? 600 : 500,
                ...(isActive ? { background: "#F5F7FF", color: "#111827" } : { background: "transparent", color: "rgba(255,255,255,0.65)" }),
              }}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
          <Activity size={28} color="#16A34A" style={{ opacity: 0.3 }} />
          <span style={{ marginLeft: 12, color: "#9CA3AF", fontSize: 14 }}>Loading active permits…</span>
        </div>
      )}

      {!isLoading && (
        <div style={{ background: "#fff", borderRadius: "0 0 12px 12px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          {activeTab === "live"       && <LivePermitsTab       permits={permits} now={now} onClose={handleClose} />}
          {activeTab === "sites"      && <SiteOperationsTab    permits={permits} now={now} />}
          {activeTab === "hazards"    && <HazardMonitoringTab  permits={permits} hazards={hazards} />}
          {activeTab === "violations" && <PermitViolationsTab  permits={permits} violations={violations} />}
        </div>
      )}
    </div>
  );
}
