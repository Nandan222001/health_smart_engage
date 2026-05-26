import { useMemo, useState } from "react";
import {
  Award, CheckCircle2, Clock, XCircle, Calendar,
  Search, RefreshCw, AlertTriangle, RotateCcw, FileText,
} from "lucide-react";
import {
  useGetVendorCertificationsQuery,
  type VendorCertification,
} from "@/features/vendors/api/vendorsApi";

// ── Helpers ────────────────────────────────────────────────────────────────

function certCfg(status: string) {
  if (status === "Valid")    return { color: "#059669", bg: "#D1FAE5", border: "#6EE7B7", Icon: CheckCircle2 };
  if (status === "Expiring") return { color: "#D97706", bg: "#FEF3C7", border: "#FCD34D", Icon: Clock };
  return                            { color: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5", Icon: XCircle };
}

function renewalCfg(cert: VendorCertification) {
  if (cert.cert_status === "Expired")  return { label: "Overdue Renewal",  color: "#DC2626", bg: "#FEF2F2", dot: "#EF4444" };
  if (cert.cert_status === "Expiring") return { label: "Renewal Due Soon", color: "#D97706", bg: "#FFFBEB", dot: "#F59E0B" };
  return                                      { label: "Renewed / Valid",  color: "#059669", bg: "#F0FDF4", dot: "#10B981" };
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap"
      style={{ color, background: bg }}>
      {label}
    </span>
  );
}

// ── Section header ─────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon, title, subtitle, accent, count,
}: {
  icon: React.ElementType; title: string; subtitle: string; accent: string; count: number;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: accent + "20" }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-[16px] font-bold" style={{ color: "#111827" }}>{title}</h2>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: accent + "18", color: accent }}>
            {count}
          </span>
        </div>
        <p className="text-[12px]" style={{ color: "#9CA3AF" }}>{subtitle}</p>
      </div>
    </div>
  );
}

// ── Section 1: Vendor Certifications — master list ─────────────────────────

function VendorCertificationsSection({ certs }: { certs: VendorCertification[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return certs.filter(
      (c) =>
        !q ||
        c.vendor_name.toLowerCase().includes(q) ||
        c.document_type.toLowerCase().includes(q) ||
        (c.issuing_body ?? "").toLowerCase().includes(q),
    );
  }, [certs, search]);

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <SectionHeader
          icon={FileText}
          title="Vendor Certifications"
          subtitle="All certifications registered across vendors"
          accent="#4A57B9"
          count={certs.length}
        />
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 rounded-xl border text-sm outline-none focus:border-indigo-400 transition-colors"
            style={{ borderColor: "#E5E7EB", background: "#F9FAFB" }}
            placeholder="Search vendor, certificate type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="divide-y" style={{ divideColor: "#F9FAFB" }}>
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Award className="w-8 h-8 mx-auto mb-2 text-gray-200" />
            <p className="text-[13px] text-gray-400">No certifications found.</p>
          </div>
        ) : filtered.map((c) => {
          const cfg = certCfg(c.cert_status);
          const CIcon = cfg.Icon;
          return (
            <div key={c.id}
              className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
              {/* Status icon */}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: cfg.bg }}>
                <CIcon className="w-4 h-4" style={{ color: cfg.color }} />
              </div>

              {/* Vendor + cert type */}
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold" style={{ color: "#111827" }}>{c.vendor_name}</div>
                <div className="text-[12px] mt-0.5" style={{ color: "#6B7280" }}>{c.document_type}</div>
                {c.issuing_body && (
                  <div className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>{c.issuing_body}</div>
                )}
              </div>

              {/* Expiry */}
              <div className="text-right flex-shrink-0">
                {c.expiry_date && (
                  <div className="flex items-center gap-1 justify-end mb-0.5">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span className="text-[12px]" style={{ color: "#374151" }}>
                      {new Date(c.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Status badge */}
              <div className="flex-shrink-0 w-24 text-right">
                <Badge label={c.cert_status} color={cfg.color} bg={cfg.bg} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Section 2: Expiry Dates — timeline view ────────────────────────────────

function ExpiryDatesSection({ certs }: { certs: VendorCertification[] }) {
  const withExpiry = useMemo(() =>
    [...certs]
      .filter((c) => c.expiry_date)
      .sort((a, b) => new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime()),
    [certs],
  );

  // Group into buckets
  const overdue   = withExpiry.filter((c) => (c.days_left ?? 0) < 0);
  const within30  = withExpiry.filter((c) => (c.days_left ?? 0) >= 0 && (c.days_left ?? 0) <= 30);
  const within90  = withExpiry.filter((c) => (c.days_left ?? 0) > 30 && (c.days_left ?? 0) <= 90);
  const beyond    = withExpiry.filter((c) => (c.days_left ?? 0) > 90);

  const groups = [
    { label: "Overdue",          items: overdue,  color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
    { label: "Expires ≤ 30 days", items: within30, color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
    { label: "Expires 31–90 days",items: within90, color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
    { label: "Expires > 90 days", items: beyond,   color: "#059669", bg: "#F0FDF4", border: "#BBF7D0" },
  ];

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <SectionHeader
          icon={Calendar}
          title="Expiry Dates"
          subtitle="Certificates grouped by time remaining to expiry"
          accent="#D97706"
          count={withExpiry.length}
        />
      </div>

      <div className="p-6 space-y-4">
        {groups.map((g) => g.items.length > 0 && (
          <div key={g.label} className="rounded-xl border overflow-hidden" style={{ borderColor: g.border }}>
            {/* Group header */}
            <div className="flex items-center justify-between px-4 py-2.5"
              style={{ background: g.bg, borderBottom: `1px solid ${g.border}` }}>
              <span className="text-[12px] font-bold" style={{ color: g.color }}>{g.label}</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "#fff", color: g.color }}>
                {g.items.length}
              </span>
            </div>

            {/* Items */}
            <div className="divide-y" style={{ divideColor: g.border + "60" }}>
              {g.items.map((c) => {
                const overdueDays = c.days_left !== null && c.days_left < 0;
                return (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] font-semibold" style={{ color: "#111827" }}>{c.vendor_name}</span>
                      <span className="text-[11px] ml-2" style={{ color: "#9CA3AF" }}>{c.document_type}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[12px]" style={{ color: "#6B7280" }}>
                        {c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : "—"}
                      </span>
                      {c.days_left !== null && (
                        <span className="text-[11px] font-black min-w-[70px] text-right"
                          style={{ color: g.color }}>
                          {overdueDays
                            ? `${Math.abs(c.days_left)}d overdue`
                            : `${c.days_left}d left`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {withExpiry.length === 0 && (
          <div className="py-10 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-200" />
            <p className="text-[13px] text-gray-400">No expiry dates recorded.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section 3: Renewal Status ──────────────────────────────────────────────

function RenewalStatusSection({ certs }: { certs: VendorCertification[] }) {
  const overdue  = certs.filter((c) => c.cert_status === "Expired");
  const dueSoon  = certs.filter((c) => c.cert_status === "Expiring");
  const valid    = certs.filter((c) => c.cert_status === "Valid");

  const groups = [
    {
      label: "Overdue Renewal",
      desc: "Certificate has expired — renewal required immediately",
      items: overdue,
      color: "#DC2626", bg: "#FEF2F2", border: "#FECACA",
      Icon: XCircle,
    },
    {
      label: "Renewal Due Soon",
      desc: "Expiring within the next 30 days — action needed",
      items: dueSoon,
      color: "#D97706", bg: "#FFFBEB", border: "#FDE68A",
      Icon: Clock,
    },
    {
      label: "Renewed / Valid",
      desc: "Certificate is active and within validity period",
      items: valid,
      color: "#059669", bg: "#F0FDF4", border: "#BBF7D0",
      Icon: CheckCircle2,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <SectionHeader
          icon={RotateCcw}
          title="Renewal Status"
          subtitle="Current renewal state for every vendor certification"
          accent="#8B5CF6"
          count={certs.length}
        />
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 border-b" style={{ borderColor: "#F3F4F6" }}>
        {[
          { label: "Overdue",  value: overdue.length,  color: "#DC2626", bg: "#FEF2F2" },
          { label: "Due Soon", value: dueSoon.length,  color: "#D97706", bg: "#FFFBEB" },
          { label: "Valid",    value: valid.length,    color: "#059669", bg: "#F0FDF4" },
        ].map((s, i) => (
          <div key={s.label}
            className={`flex flex-col items-center py-4 gap-0.5${i < 2 ? " border-r" : ""}`}
            style={{ borderColor: "#F3F4F6", background: s.bg }}>
            <span className="text-[26px] font-black leading-none" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[11px] font-semibold" style={{ color: s.color + "BB" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* 3 renewal groups */}
      <div className="p-6 space-y-4">
        {groups.map((g) => (
          <div key={g.label} className="rounded-xl border overflow-hidden" style={{ borderColor: g.border }}>
            {/* Group header */}
            <div className="flex items-center gap-3 px-5 py-3"
              style={{ background: g.bg, borderBottom: g.items.length > 0 ? `1px solid ${g.border}` : undefined }}>
              <g.Icon className="w-4 h-4 flex-shrink-0" style={{ color: g.color }} />
              <div className="flex-1">
                <span className="text-[12px] font-bold" style={{ color: g.color }}>{g.label}</span>
                <span className="text-[11px] ml-2" style={{ color: g.color + "90" }}>{g.desc}</span>
              </div>
              <span className="text-[12px] font-black px-2.5 py-0.5 rounded-full bg-white"
                style={{ color: g.color }}>
                {g.items.length}
              </span>
            </div>

            {g.items.length > 0 && (
              <div className="divide-y bg-white" style={{ divideColor: "#F9FAFB" }}>
                {g.items.map((c) => (
                  <div key={c.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] font-semibold" style={{ color: "#111827" }}>{c.vendor_name}</span>
                      <span className="text-[11px] ml-2" style={{ color: "#9CA3AF" }}>{c.document_type}</span>
                      {c.issuing_body && (
                        <div className="text-[10px] mt-0.5" style={{ color: "#D1D5DB" }}>{c.issuing_body}</div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {c.expiry_date && (
                        <div className="text-[11px]" style={{ color: "#6B7280" }}>
                          {new Date(c.expiry_date).toLocaleDateString()}
                        </div>
                      )}
                      {c.days_left !== null && (
                        <div className="text-[11px] font-black" style={{ color: g.color }}>
                          {c.days_left < 0
                            ? `${Math.abs(c.days_left)}d overdue`
                            : `${c.days_left}d left`}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export function VendorCertificationsPage() {
  const { data: certs = [], isLoading, refetch } = useGetVendorCertificationsQuery();

  const valid    = certs.filter((c) => c.cert_status === "Valid").length;
  const expiring = certs.filter((c) => c.cert_status === "Expiring").length;
  const expired  = certs.filter((c) => c.cert_status === "Expired").length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <RefreshCw className="w-7 h-7 animate-spin text-amber-500 mr-3" />
        <span className="text-sm text-gray-400">Loading certifications…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Banner ───────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, #78350F 0%, #1C1917 100%)" }}>
        <div className="px-8 pt-8 pb-0">
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-1"
            style={{ color: "rgba(255,255,255,0.4)" }}>
            Vendor Management
          </p>
          <h1 className="text-[26px] font-black text-white">Certifications</h1>
          <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Vendor certifications · Expiry tracking · Renewal status
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex border-t mt-6" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          {[
            { label: "Total Certs",  value: certs.length, color: "#fff"     },
            { label: "Valid",        value: valid,         color: "#34D399"  },
            { label: "Expiring",     value: expiring,      color: "#FBBF24"  },
            { label: "Expired",      value: expired,       color: "#F87171"  },
          ].map((s, i, arr) => (
            <div key={s.label} className="flex-1 flex flex-col items-center text-center px-4 py-4 gap-0.5"
              style={{ borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.1)" : undefined }}>
              <span className="text-[30px] font-black leading-none" style={{ color: s.color }}>{s.value}</span>
              <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Three sections ───────────────────────────────────── */}
      <div className="p-6 space-y-6">
        <VendorCertificationsSection certs={certs} />
        <ExpiryDatesSection certs={certs} />
        <RenewalStatusSection certs={certs} />
      </div>
    </div>
  );
}
