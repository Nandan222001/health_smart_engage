import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { 
  GitBranch, Plus, Settings, Zap, Clock, ChevronRight, 
  Search, Filter, Save, RotateCcw, ShieldCheck, 
  Activity, Bell, UserCheck, LayoutDashboard,
  ShieldAlert, Mail, Smartphone, MessageSquare
} from "lucide-react";

interface WorkflowConfig {
  id: string;
  name: string;
  description: string;
  type: "permit" | "incident" | "audit";
  permit_category?: string;
  risk_level: "High" | "Medium" | "Low";
  status: "active" | "draft" | "inactive";
  department: string;
  site_restriction?: string;
  approval_levels: { 
    role: string; 
    time_limit: number; 
    required_ppe?: string[];
    require_signature: boolean;
    require_comment: boolean;
  }[];
  escalation: { 
    hours: number; 
    target: string;
    notify_via: ("email" | "sms" | "push")[];
  };
  automation_rules: { id: string; name: string; trigger: string; condition?: string }[];
}

const MOCK_CONFIGS: WorkflowConfig[] = [
  {
    id: "w1", name: "Hot Work Permit", type: "permit", permit_category: "Flame/Heat", risk_level: "High", status: "active", department: "Operations",
    description: "Standard workflow for operations involving open flames or high heat sources.",
    site_restriction: "All Sites",
    approval_levels: [
      { role: "Fire Safety Officer", time_limit: 2, required_ppe: ["Fire Suit", "Shield"], require_signature: true, require_comment: true },
      { role: "Site Supervisor", time_limit: 4, require_signature: true, require_comment: false },
      { role: "HSE Manager", time_limit: 8, require_signature: true, require_comment: true }
    ],
    escalation: { hours: 12, target: "Operations Director", notify_via: ["email", "push"] },
    automation_rules: [
      { id: "r1", name: "Auto-assign to shift manager", trigger: "On Submission" },
      { id: "r2", name: "Notify fire safety team", trigger: "On Approval", condition: "If Risk == High" },
      { id: "r3", name: "Check LOTO status", trigger: "Pre-Approval" }
    ]
  },
  {
    id: "w2", name: "High Voltage Isolation", type: "permit", permit_category: "Electrical", risk_level: "High", status: "active", department: "Maintenance",
    description: "Critical safety path for electrical isolation and lock-out procedures.",
    site_restriction: "Substation Alpha, Substation Beta",
    approval_levels: [
      { role: "Electrical Lead", time_limit: 2, require_signature: true, require_comment: true },
      { role: "Site Manager", time_limit: 4, require_signature: true, require_comment: true }
    ],
    escalation: { hours: 6, target: "Technical Director", notify_via: ["email", "sms", "push"] },
    automation_rules: [
      { id: "r4", name: "LOTO verification required", trigger: "Mandatory" },
      { id: "r5", name: "Contractor cert check", trigger: "On Submission" }
    ]
  }
];

type TabId = "config" | "approvals" | "escalation" | "automation";

export function WorkflowManagementPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const activeTab = (searchParams.get("tab") as TabId) || "config";

  const [selectedId, setSelectedId] = useState(MOCK_CONFIGS[0].id);
  const selected = MOCK_CONFIGS.find(c => c.id === selectedId) || MOCK_CONFIGS[0];

  const setTab = (tab: TabId) => {
    navigate(`?tab=${tab}`, { replace: true });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F3F7FF" }}>
      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, #1E3A8A 0%, #3B82F6 45%, #0F172A 100%)", padding: "28px 32px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <GitBranch size={22} color="#93C5FD" />
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#fff" }}>Workflow Management</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", background: "rgba(147,197,253,0.15)", border: "1px solid rgba(147,197,253,0.3)", borderRadius: 20 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#60A5FA", boxShadow: "0 0 6px #60A5FA" }} />
                <span style={{ fontSize: 11, color: "#93C5FD", fontWeight: 700 }}>ENGINE ACTIVE</span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#BFDBFE", opacity: 0.85 }}>
              Configure PTW approval levels · escalation paths · automation rules
            </p>
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#fff", border: "none", borderRadius: 10, color: "#1E3A8A", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            <Plus size={18} /> Create Workflow
          </button>
        </div>

        {/* Dynamic Tabs */}
        <div style={{ display: "flex", gap: 8, paddingBottom: 0 }}>
          {[
            { id: "config",     label: "General Configuration", icon: Settings },
            { id: "approvals",  label: "Approval Levels",      icon: UserCheck },
            { id: "escalation", label: "Escalation Policy",    icon: Clock },
            { id: "automation", label: "Automation Rules",     icon: Zap },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as TabId)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", border: "none", borderRadius: "12px 12px 0 0", cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all 0.2s",
                background: activeTab === t.id ? "#F3F7FF" : "transparent",
                color: activeTab === t.id ? "#1E3A8A" : "rgba(255,255,255,0.6)"
              }}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "24px 32px" }}>
        <div style={{ display: "flex", gap: 24 }}>
          {/* Sidebar */}
          <div style={{ width: 300, flexShrink: 0 }}>
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E3E9F6", overflow: "hidden" }}>
              <div style={{ padding: 16, borderBottom: "1px solid #F3F4F6" }}>
                <input type="text" placeholder="Search workflows..." style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13 }} />
              </div>
              {MOCK_CONFIGS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  style={{ width: "100%", textAlign: "left", padding: "16px 20px", border: "none", borderBottom: "1px solid #F3F4F6", cursor: "pointer", background: selectedId === c.id ? "#EFF6FF" : "transparent", borderLeft: selectedId === c.id ? "4px solid #3B82F6" : "4px solid transparent" }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>{c.department} · {c.status}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Panel */}
          <div style={{ flex: 1 }}>
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E3E9F6", padding: 32 }}>
              
              {/* Actions Header */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{selected.name}</h2>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>Editing {activeTab} for this workflow path</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button style={{ padding: "8px 24px", background: "#3B82F6", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                    <Save size={14} /> Save {activeTab}
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === "config" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 8 }}>Workflow Status</label>
                      <select style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #E5E7EB" }}>
                        <option>{selected.status}</option>
                        <option>active</option>
                        <option>draft</option>
                        <option>inactive</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 8 }}>Primary Department</label>
                      <select style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #E5E7EB" }}>
                        <option>{selected.department}</option>
                        <option>Operations</option>
                        <option>Maintenance</option>
                        <option>HSE</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 8 }}>Description</label>
                    <textarea value={selected.description} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #E5E7EB", minHeight: 80 }} readOnly />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 8 }}>Site Restrictions</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#F9FAFB", fontSize: 13 }}>
                      <ShieldCheck size={16} color="#3B82F6" />
                      {selected.site_restriction}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "approvals" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {selected.approval_levels.map((lvl, i) => (
                    <div key={i} style={{ padding: 20, borderRadius: 12, border: "1px solid #E5E7EB", background: "#F9FAFB" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>Level {i+1}: {lvl.role}</span>
                        <div style={{ display: "flex", gap: 24 }}>
                           <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                             <div style={{ width: 14, height: 14, borderRadius: 4, background: lvl.require_signature ? "#3B82F6" : "#E5E7EB" }} />
                             <span style={{ fontSize: 10, fontWeight: 800, color: "#6B7280" }}>SIGNATURE REQ</span>
                           </div>
                           <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                             <div style={{ width: 14, height: 14, borderRadius: 4, background: lvl.require_comment ? "#3B82F6" : "#E5E7EB" }} />
                             <span style={{ fontSize: 10, fontWeight: 800, color: "#6B7280" }}>COMMENT REQ</span>
                           </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: "#6B7280" }}>
                        SLA: {lvl.time_limit} Hours · Required PPE: {lvl.required_ppe?.join(", ") || "None"}
                      </div>
                    </div>
                  ))}
                  <button style={{ padding: 12, border: "2px dashed #D1D5DB", borderRadius: 12, background: "none", color: "#6B7280", fontWeight: 700, cursor: "pointer" }}>+ Add Approval Level</button>
                </div>
              )}

              {activeTab === "escalation" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                  <div style={{ padding: 24, borderRadius: 16, background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#92400E", marginBottom: 16 }}>Inactivity Trigger</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                       <span style={{ fontSize: 13 }}>Escalate after</span>
                       <input type="number" value={selected.escalation.hours} style={{ width: 80, padding: 8, borderRadius: 6, border: "1px solid #FDE68A" }} />
                       <span style={{ fontSize: 13 }}>hours of no action.</span>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 8 }}>Escalation Target</label>
                    <select style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #E5E7EB" }}>
                      <option>{selected.escalation.target}</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 12 }}>Notification Channels</label>
                    <div style={{ display: "flex", gap: 12 }}>
                      {[
                        { id: "email", icon: Mail, label: "Email" },
                        { id: "sms",   icon: MessageSquare, label: "SMS" },
                        { id: "push",  icon: Smartphone, label: "App Push" },
                      ].map(ch => (
                        <div key={ch.id} style={{ flex: 1, padding: 16, borderRadius: 12, border: "1px solid", borderColor: selected.escalation.notify_via.includes(ch.id as any) ? "#D97706" : "#E5E7EB", background: selected.escalation.notify_via.includes(ch.id as any) ? "#FFFBEB" : "#fff", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                          <ch.icon size={20} color={selected.escalation.notify_via.includes(ch.id as any) ? "#D97706" : "#9CA3AF"} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: selected.escalation.notify_via.includes(ch.id as any) ? "#92400E" : "#6B7280" }}>{ch.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "automation" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {selected.automation_rules.map((rule) => (
                    <div key={rule.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: 20, borderRadius: 12, background: "#EFF6FF", border: "1px solid #DBEAFE" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Zap size={20} color="#fff" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#1E40AF" }}>{rule.name}</div>
                        <div style={{ fontSize: 11, color: "#3B82F6", fontWeight: 700, marginTop: 2 }}>TRIGGER: {rule.trigger} {rule.condition && `· CONDITION: ${rule.condition}`}</div>
                      </div>
                      <button style={{ padding: 8, background: "#fff", border: "1px solid #DBEAFE", borderRadius: 8 }}><Settings size={14} color="#3B82F6" /></button>
                    </div>
                  ))}
                  <button style={{ padding: 12, border: "2px dashed #DBEAFE", borderRadius: 12, background: "none", color: "#3B82F6", fontWeight: 700, cursor: "pointer" }}>+ Create New Rule</button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
