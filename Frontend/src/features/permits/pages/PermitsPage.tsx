import { useState } from "react";
import { useSearchParams } from "react-router";
import {
  FileText, Plus, Search, CheckCircle2, Clock, XCircle,
  AlertCircle, Loader2, ArrowUpRight, X,
} from "lucide-react";
import {
  useListPermitsQuery,
  useCreatePermitMutation,
  useSubmitPermitMutation,
  useApprovePermitMutation,
  useRejectPermitMutation,
  useClosePermitMutation,
  useExtendPermitMutation,
} from "@/features/permits/api/permitsApi";
import type { Permit } from "@/features/permits/api/permitsApi";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { color: string; icon: typeof CheckCircle2; bg: string }> = {
  draft:     { color: "#9CA3AF", icon: Clock,        bg: "#F3F4F6" },
  submitted: { color: "#F59E0B", icon: Clock,        bg: "#FEF3C7" },
  approved:  { color: "#10B981", icon: CheckCircle2, bg: "#D1FAE5" },
  rejected:  { color: "#EF4444", icon: XCircle,      bg: "#FEE2E2" },
  active:    { color: "#4A57B9", icon: CheckCircle2, bg: "#EEF2FB" },
  closed:    { color: "#6B7280", icon: AlertCircle,  bg: "#F3F4F6" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.draft;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ background: cfg.bg, color: cfg.color }}>
      <Icon className="w-3 h-3" />{status}
    </span>
  );
}

const PERMIT_TYPES = ["Hot Work", "Confined Space", "Working at Height", "Electrical Isolation", "Excavation", "General Work", "Chemical Handling"];

// ─── Create Permit Form ───────────────────────────────────────────────────────

interface CreateFormState {
  title: string;
  type: string;
  description: string;
  start_date: string;
  end_date: string;
}

const EMPTY_FORM: CreateFormState = { title: "", type: "Hot Work", description: "", start_date: "", end_date: "" };

function CreatePermitPanel({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<CreateFormState>(EMPTY_FORM);
  const [createPermit, { isLoading: creating }] = useCreatePermitMutation();
  const [submitPermit] = useSubmitPermitMutation();

  async function handleSave(andSubmit = false) {
    if (!form.title.trim()) return;
    const res = await createPermit(form).unwrap();
    if (andSubmit && res?.id) await submitPermit(res.id);
    onClose();
  }

  return (
    <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>New Permit Request</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-semibold" style={{ color: "#374151" }}>Title *</label>
          <input className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E3E9F6" }} placeholder="e.g. Hot Work — Boiler Room" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: "#374151" }}>Permit Type</label>
          <select className="w-full px-3 py-2.5 rounded-xl border text-sm bg-white outline-none" style={{ borderColor: "#E3E9F6" }} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            {PERMIT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: "#374151" }}>Description</label>
          <input className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E3E9F6" }} placeholder="Brief description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: "#374151" }}>Start Date</label>
          <input type="date" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E3E9F6" }} value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: "#374151" }}>End Date</label>
          <input type="date" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E3E9F6" }} value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} />
        </div>
      </div>
      <div className="flex items-center gap-3 mt-5">
        <button onClick={() => handleSave(false)} disabled={creating || !form.title.trim()} className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold disabled:opacity-60" style={{ borderColor: "#E3E9F6", color: "#374151" }}>
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save Draft
        </button>
        <button onClick={() => handleSave(true)} disabled={creating || !form.title.trim()} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-60" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Submit for Approval
        </button>
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm" style={{ color: "#6B7280" }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── PTW (all permits) ────────────────────────────────────────────────────────

function PTWTab({ permits, isLoading, search, setSearch }: { permits: Permit[]; isLoading: boolean; search: string; setSearch: (s: string) => void }) {
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = permits.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <>
      {showCreate && <CreatePermitPanel onClose={() => setShowCreate(false)} />}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
          <input className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E3E9F6", background: "#F9FAFB" }} placeholder="Search permits…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E3E9F6" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {Object.keys(STATUS_CFG).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
          <Plus className="w-4 h-4" /> New
        </button>
      </div>
      <PermitTable permits={filtered} isLoading={isLoading} />
    </>
  );
}

// ─── Permit Requests (draft + submitted) ─────────────────────────────────────

function RequestsTab({ permits, isLoading }: { permits: Permit[]; isLoading: boolean }) {
  const [showCreate, setShowCreate] = useState(false);
  const [submitPermit, { isLoading: submitting }] = useSubmitPermitMutation();
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const requests = permits.filter((p) => p.status === "draft" || p.status === "submitted");

  async function handleSubmit(id: string) {
    setSubmittingId(id);
    await submitPermit(id);
    setSubmittingId(null);
  }

  return (
    <>
      {showCreate && <CreatePermitPanel onClose={() => setShowCreate(false)} />}
      {!showCreate && (
        <div className="flex justify-end">
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
            <Plus className="w-4 h-4" /> New Request
          </button>
        </div>
      )}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
              {["Permit", "Type", "Status", "Start Date", "End Date", "Action"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="py-10 text-center text-sm" style={{ color: "#9CA3AF" }}>Loading…</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center"><p className="text-sm" style={{ color: "#6B7280" }}>No draft or submitted permits</p></td></tr>
            ) : requests.map((p) => (
              <tr key={p.id} className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                <td className="px-5 py-3.5 font-semibold" style={{ color: "#111827" }}>{p.title}</td>
                <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{p.type}</td>
                <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{p.start_date ? new Date(p.start_date).toLocaleDateString() : "—"}</td>
                <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{p.end_date ? new Date(p.end_date).toLocaleDateString() : "—"}</td>
                <td className="px-5 py-3.5">
                  {p.status === "draft" && (
                    <button
                      onClick={() => handleSubmit(p.id)}
                      disabled={submittingId === p.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                      style={{ background: "#4A57B9" }}
                    >
                      {submittingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowUpRight className="w-3 h-3" />}
                      Submit
                    </button>
                  )}
                  {p.status === "submitted" && (
                    <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "#FEF3C7", color: "#D97706" }}>Awaiting approval</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Approval Queue ───────────────────────────────────────────────────────────

function ApprovalTab({ permits, isLoading }: { permits: Permit[]; isLoading: boolean }) {
  const [approvePermit] = useApprovePermitMutation();
  const [rejectPermit] = useRejectPermitMutation();
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const queue = permits.filter((p) => p.status === "submitted");

  async function handleApprove(id: string) {
    setActionId(id);
    await approvePermit({ permitId: id });
    setActionId(null);
  }

  async function handleReject(id: string) {
    const reason = rejectReason[id] || "Rejected";
    setActionId(id);
    await rejectPermit({ permitId: id, reason });
    setActionId(null);
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#4A57B9" }} /></div>
      ) : queue.length === 0 ? (
        <div className="bg-white rounded-2xl border py-16 text-center" style={{ borderColor: "#E3E9F6" }}>
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: "#D1FAE5" }} />
          <p className="text-sm font-semibold" style={{ color: "#111827" }}>Approval queue is empty</p>
          <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>All submitted permits have been processed</p>
        </div>
      ) : queue.map((p) => (
        <div key={p.id} className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "#EEF2FF", color: "#4A57B9" }}>{p.type}</span>
                <StatusBadge status={p.status} />
              </div>
              <h3 className="text-[15px] font-bold" style={{ color: "#111827" }}>{p.title}</h3>
              <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                Requested by {p.requested_by || "—"} · {p.start_date ? new Date(p.start_date).toLocaleDateString() : "No date"} → {p.end_date ? new Date(p.end_date).toLocaleDateString() : "—"}
              </p>
              <div className="mt-3">
                <input
                  className="w-full px-3 py-2 rounded-lg border text-xs outline-none"
                  style={{ borderColor: "#E3E9F6" }}
                  placeholder="Rejection reason (required if rejecting)…"
                  value={rejectReason[p.id] || ""}
                  onChange={(e) => setRejectReason((r) => ({ ...r, [p.id]: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button onClick={() => handleApprove(p.id)} disabled={actionId === p.id} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-60" style={{ background: "#10B981" }}>
                {actionId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Approve
              </button>
              <button onClick={() => handleReject(p.id)} disabled={actionId === p.id} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-60" style={{ background: "#EF4444" }}>
                {actionId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Active Work Permits ──────────────────────────────────────────────────────

function ActivePermitsTab({ permits, isLoading }: { permits: Permit[]; isLoading: boolean }) {
  const [closePermit] = useClosePermitMutation();
  const [extendPermit] = useExtendPermitMutation();
  const [actionId, setActionId] = useState<string | null>(null);
  const [extendDate, setExtendDate] = useState<Record<string, string>>({});

  const active = permits.filter((p) => p.status === "active");

  async function handleClose(id: string) {
    if (!window.confirm("Close this permit?")) return;
    setActionId(id);
    await closePermit(id);
    setActionId(null);
  }

  async function handleExtend(id: string) {
    const newDate = extendDate[id];
    if (!newDate) return;
    setActionId(id);
    await extendPermit({ permitId: id, new_end_date: newDate });
    setExtendDate((d) => ({ ...d, [id]: "" }));
    setActionId(null);
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#4A57B9" }} /></div>
      ) : active.length === 0 ? (
        <div className="bg-white rounded-2xl border py-16 text-center" style={{ borderColor: "#E3E9F6" }}>
          <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
          <p className="text-sm font-semibold" style={{ color: "#111827" }}>No active permits</p>
          <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Approved permits become active here</p>
        </div>
      ) : active.map((p) => {
        const endDate = p.end_date ? new Date(p.end_date) : null;
        const daysLeft = endDate ? Math.ceil((endDate.getTime() - Date.now()) / 86_400_000) : null;
        return (
          <div key={p.id} className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E3E9F6" }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "#EEF2FF", color: "#4A57B9" }}>{p.type}</span>
                  <StatusBadge status="active" />
                  {daysLeft !== null && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: daysLeft <= 1 ? "#FEE2E2" : "#FEF3C7", color: daysLeft <= 1 ? "#EF4444" : "#D97706" }}>
                      {daysLeft <= 0 ? "Expired" : `${daysLeft}d left`}
                    </span>
                  )}
                </div>
                <h3 className="text-[15px] font-bold" style={{ color: "#111827" }}>{p.title}</h3>
                <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                  Approved by {p.approved_by || "—"} · {p.start_date ? new Date(p.start_date).toLocaleDateString() : "—"} → {p.end_date ? new Date(p.end_date).toLocaleDateString() : "—"}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="date"
                    className="px-3 py-1.5 rounded-lg border text-xs outline-none"
                    style={{ borderColor: "#E3E9F6" }}
                    value={extendDate[p.id] || ""}
                    onChange={(e) => setExtendDate((d) => ({ ...d, [p.id]: e.target.value }))}
                  />
                  <button
                    onClick={() => handleExtend(p.id)}
                    disabled={actionId === p.id || !extendDate[p.id]}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-50"
                    style={{ borderColor: "#4A57B9", color: "#4A57B9" }}
                  >
                    <ArrowUpRight className="w-3 h-3" /> Extend
                  </button>
                </div>
              </div>
              <button
                onClick={() => handleClose(p.id)}
                disabled={actionId === p.id}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border disabled:opacity-60 flex-shrink-0"
                style={{ borderColor: "#E3E9F6", color: "#6B7280" }}
              >
                {actionId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3.5 h-3.5" />} Close
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Generic permit table ─────────────────────────────────────────────────────

function PermitTable({ permits, isLoading }: { permits: Permit[]; isLoading: boolean }) {
  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
            {["Permit", "Status", "Requested By", "Start Date", "End Date"].map((h) => (
              <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={5} className="py-10 text-center text-sm" style={{ color: "#9CA3AF" }}>Loading permits…</td></tr>
          ) : permits.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-12 text-center">
                <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
                <p className="text-sm" style={{ color: "#6B7280" }}>No permits found</p>
              </td>
            </tr>
          ) : permits.map((p) => (
            <tr key={p.id} className="border-t hover:bg-gray-50 cursor-pointer" style={{ borderColor: "#F3F4F6" }}>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#EEF2FB" }}>
                    <FileText className="w-4 h-4" style={{ color: "#4A57B9" }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "#111827" }}>{p.title}</div>
                    <div className="text-xs" style={{ color: "#9CA3AF" }}>{p.type}</div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
              <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{p.requested_by}</td>
              <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{p.start_date ? new Date(p.start_date).toLocaleDateString() : "—"}</td>
              <td className="px-5 py-3.5 text-sm" style={{ color: "#6B7280" }}>{p.end_date ? new Date(p.end_date).toLocaleDateString() : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

type TabId = "ptw" | "requests" | "approval" | "active";

const TABS: { id: TabId; label: string }[] = [
  { id: "ptw",      label: "Permit to Work" },
  { id: "requests", label: "Permit Requests" },
  { id: "approval", label: "Approval Queue" },
  { id: "active",   label: "Active Work Permits" },
];

export function PermitsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") as TabId) ?? "ptw";
  const [search, setSearch] = useState("");

  const { data: rawPermits, isLoading } = useListPermitsQuery();
  const permits: Permit[] = Array.isArray(rawPermits) ? rawPermits : ((rawPermits as { items?: Permit[] })?.items ?? []);

  const counts = {
    active:    permits.filter((p) => p.status === "active").length,
    submitted: permits.filter((p) => p.status === "submitted").length,
    approved:  permits.filter((p) => p.status === "approved").length,
  };

  function setTab(id: TabId) {
    setSearchParams({ tab: id });
  }

  const tabBadges: Partial<Record<TabId, number>> = {
    approval: counts.submitted,
    active:   counts.active,
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Work Permits</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Permit-to-work management and approval workflow</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Permits",   value: counts.active,    color: "#4A57B9" },
          { label: "Pending Approval", value: counts.submitted, color: "#F59E0B" },
          { label: "Approved",         value: counts.approved,  color: "#10B981" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E3E9F6" }}>
            <div className="text-2xl font-bold" style={{ color }}>{isLoading ? "…" : value}</div>
            <div className="text-xs font-medium mt-0.5" style={{ color: "#6B7280" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map(({ id, label }) => {
          const badge = tabBadges[id];
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={tab === id
                ? { background: "#4A57B9", color: "#fff", boxShadow: "0 4px 10px rgba(74,87,185,0.25)" }
                : { background: "#F3F4F6", color: "#6B7280" }}
            >
              {label}
              {badge != null && badge > 0 && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full" style={{ background: tab === id ? "rgba(255,255,255,0.25)" : "#EF444430", color: tab === id ? "#fff" : "#EF4444" }}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === "ptw"      && <PTWTab permits={permits} isLoading={isLoading} search={search} setSearch={setSearch} />}
      {tab === "requests" && <RequestsTab permits={permits} isLoading={isLoading} />}
      {tab === "approval" && <ApprovalTab permits={permits} isLoading={isLoading} />}
      {tab === "active"   && <ActivePermitsTab permits={permits} isLoading={isLoading} />}
    </div>
  );
}
