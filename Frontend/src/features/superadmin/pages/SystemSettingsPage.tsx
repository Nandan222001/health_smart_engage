import { useState, useEffect } from "react";
import {
  useGetSecurityPolicyQuery,
  useUpdateSecurityPolicyMutation,
  useGetComplianceConfigQuery,
  useUpdateComplianceConfigMutation,
} from "@/features/superadmin/api/adminApi";

const STANDARDS = ["ISO_45001", "OSHA", "ISO_14001"];
const SCHEDULES = ["monthly", "quarterly", "annually"];

export function SystemSettingsPage() {
  const { data: secPolicy, isLoading: secLoading, isError: secError } = useGetSecurityPolicyQuery();
  const { data: compConfig, isLoading: compLoading, isError: compError } = useGetComplianceConfigQuery();
  const [updateSecurity, { isLoading: savingSec }] = useUpdateSecurityPolicyMutation();
  const [updateCompliance, { isLoading: savingComp }] = useUpdateComplianceConfigMutation();

  const [sec, setSec] = useState({
    password_min_length: 8,
    mfa_required: false,
    session_timeout_minutes: 60,
    max_login_attempts: 5,
    audit_retention_days: 365,
    ip_whitelist: [] as string[],
  });

  const [comp, setComp] = useState({
    active_standards: [] as string[],
    auto_audit_schedule: "monthly",
    require_evidence_upload: false,
    capa_sla_days: 30,
    finding_escalation_days: 7,
  });

  useEffect(() => {
    if (secPolicy) {
      setSec({
        password_min_length: secPolicy.password_min_length,
        mfa_required: secPolicy.mfa_required,
        session_timeout_minutes: secPolicy.session_timeout_minutes,
        max_login_attempts: secPolicy.max_login_attempts,
        audit_retention_days: secPolicy.audit_retention_days,
        ip_whitelist: secPolicy.ip_whitelist,
      });
    }
  }, [secPolicy]);

  useEffect(() => {
    if (compConfig) {
      setComp({
        active_standards: compConfig.active_standards,
        auto_audit_schedule: compConfig.auto_audit_schedule,
        require_evidence_upload: compConfig.require_evidence_upload,
        capa_sla_days: compConfig.capa_sla_days,
        finding_escalation_days: compConfig.finding_escalation_days,
      });
    }
  }, [compConfig]);

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSecurity(sec);
  };

  const handleSaveCompliance = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCompliance(comp);
  };

  const toggleStandard = (std: string) => {
    setComp((prev) => ({
      ...prev,
      active_standards: prev.active_standards.includes(std)
        ? prev.active_standards.filter((s) => s !== std)
        : [...prev.active_standards, std],
    }));
  };

  return (
    <div className="p-6 space-y-6" style={{ background: "#F3F7FF", minHeight: "100vh" }}>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>System Settings</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Platform-wide security and compliance configuration</p>
      </div>

      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#E3E9F6" }}>
        <h2 className="text-[15px] font-bold mb-5" style={{ color: "#111827" }}>Security Policy</h2>
        {secLoading ? (
          <p className="text-sm" style={{ color: "#9CA3AF" }}>Loading…</p>
        ) : secError ? (
          <p className="text-sm" style={{ color: "#EF4444" }}>Failed to load</p>
        ) : (
          <form onSubmit={handleSaveSecurity} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Min Password Length</label>
              <input
                type="number"
                min={6}
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                value={sec.password_min_length}
                onChange={(e) => setSec({ ...sec, password_min_length: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Session Timeout (minutes)</label>
              <input
                type="number"
                min={5}
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                value={sec.session_timeout_minutes}
                onChange={(e) => setSec({ ...sec, session_timeout_minutes: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Max Login Attempts</label>
              <input
                type="number"
                min={1}
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                value={sec.max_login_attempts}
                onChange={(e) => setSec({ ...sec, max_login_attempts: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Audit Retention (days)</label>
              <input
                type="number"
                min={30}
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                value={sec.audit_retention_days}
                onChange={(e) => setSec({ ...sec, audit_retention_days: Number(e.target.value) })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>IP Whitelist (one per line)</label>
              <textarea
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none resize-none"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                rows={3}
                value={sec.ip_whitelist.join("\n")}
                onChange={(e) =>
                  setSec({ ...sec, ip_whitelist: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })
                }
                placeholder="192.168.1.0/24"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sec.mfa_required}
                  onChange={(e) => setSec({ ...sec, mfa_required: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium" style={{ color: "#374151" }}>Require MFA for all users</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={savingSec}
                className="px-5 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
              >
                {savingSec ? "Saving…" : "Save Security Policy"}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#E3E9F6" }}>
        <h2 className="text-[15px] font-bold mb-5" style={{ color: "#111827" }}>Compliance Configuration</h2>
        {compLoading ? (
          <p className="text-sm" style={{ color: "#9CA3AF" }}>Loading…</p>
        ) : compError ? (
          <p className="text-sm" style={{ color: "#EF4444" }}>Failed to load</p>
        ) : (
          <form onSubmit={handleSaveCompliance} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold mb-2" style={{ color: "#374151" }}>Active Standards</label>
              <div className="flex flex-wrap gap-2">
                {STANDARDS.map((std) => (
                  <button
                    key={std}
                    type="button"
                    onClick={() => toggleStandard(std)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors"
                    style={
                      comp.active_standards.includes(std)
                        ? { background: "#4A57B9", color: "#fff", borderColor: "#4A57B9" }
                        : { background: "#F8FAFF", color: "#374151", borderColor: "#E3E9F6" }
                    }
                  >
                    {std}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Auto Audit Schedule</label>
              <select
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                value={comp.auto_audit_schedule}
                onChange={(e) => setComp({ ...comp, auto_audit_schedule: e.target.value })}
              >
                {SCHEDULES.map((s) => (
                  <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>CAPA SLA (days)</label>
              <input
                type="number"
                min={1}
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                value={comp.capa_sla_days}
                onChange={(e) => setComp({ ...comp, capa_sla_days: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Finding Escalation (days)</label>
              <input
                type="number"
                min={1}
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                value={comp.finding_escalation_days}
                onChange={(e) => setComp({ ...comp, finding_escalation_days: Number(e.target.value) })}
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={comp.require_evidence_upload}
                  onChange={(e) => setComp({ ...comp, require_evidence_upload: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium" style={{ color: "#374151" }}>Require evidence upload for findings</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={savingComp}
                className="px-5 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
              >
                {savingComp ? "Saving…" : "Save Compliance Config"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
