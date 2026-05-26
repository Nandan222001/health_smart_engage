import { useState } from "react";
import { 
  MapPin, Users, Briefcase, Activity, AlertTriangle, 
  Settings, Zap, Shield, Search, Filter, 
  ArrowUpRight, HardHat, Construction
} from "lucide-react";

interface SiteOpStatus {
  id: string;
  name: string;
  location: string;
  active_projects: number;
  workforce_count: number;
  equipment_count: number;
  violations_today: number;
  risk_status: "Low" | "Medium" | "High" | "Critical";
  ongoing_activities: string[];
}

const MOCK_SITE_OPS: SiteOpStatus[] = [
  {
    id: "s1",
    name: "North Refinery Hub",
    location: "Jamnagar, Gujarat",
    active_projects: 3,
    workforce_count: 142,
    equipment_count: 24,
    violations_today: 0,
    risk_status: "Low",
    ongoing_activities: ["Pipeline Maintenance", "Storage Tank Cleaning", "Structural Welding"]
  },
  {
    id: "s2",
    name: "Coastal Wind Farm",
    location: "Kanyakumari, TN",
    active_projects: 5,
    workforce_count: 86,
    equipment_count: 12,
    violations_today: 2,
    risk_status: "Medium",
    ongoing_activities: ["Turbine Blade Inspection", "Substation Wiring", "Site Excavation"]
  },
  {
    id: "s3",
    name: "Metro Construction Line 4",
    location: "Mumbai, MH",
    active_projects: 8,
    workforce_count: 320,
    equipment_count: 45,
    violations_today: 5,
    risk_status: "High",
    ongoing_activities: ["Underground Boring", "Pillar Casting", "Traffic Diversion Mgmt"]
  },
  {
    id: "s4",
    name: "Data Center Phase 2",
    location: "Hyderabad, TS",
    active_projects: 2,
    workforce_count: 110,
    equipment_count: 18,
    violations_today: 1,
    risk_status: "Low",
    ongoing_activities: ["Server Rack Installation", "HVAC Testing", "Fiber Optic Splicing"]
  }
];

export function SiteOperationsPage() {
  const [selectedId, setSelectedId] = useState(MOCK_SITE_OPS[0].id);
  const selected = MOCK_SITE_OPS.find(s => s.id === selectedId) || MOCK_SITE_OPS[0];
  const [searchQuery, setSearchQuery] = useState("");

  const totalWorkforce = MOCK_SITE_OPS.reduce((acc, s) => acc + s.workforce_count, 0);
  const totalViolations = MOCK_SITE_OPS.reduce((acc, s) => acc + s.violations_today, 0);
  const highRiskSites = MOCK_SITE_OPS.filter(s => s.risk_status === "High" || s.risk_status === "Critical").length;

  return (
    <div style={{ minHeight: "100vh", background: "#F3F7FF" }}>
      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, #065F46 0%, #059669 45%, #0F172A 100%)", padding: "28px 32px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <Activity size={22} color="#6EE7B7" />
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#fff" }}>Site Operations</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 20 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 6px #34D399" }} />
                <span style={{ fontSize: 11, color: "#6EE7B7", fontWeight: 700 }}>LIVE TRACKING</span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#A7F3D0", opacity: 0.85 }}>
              Real-time monitoring of site activities · workforce presence · equipment usage
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Filter size={16} /> Filters
            </button>
            <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#fff", border: "none", borderRadius: 10, color: "#065F46", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
              <MapPin size={18} /> Global View
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 0, paddingBottom: 2 }}>
          {[
            { label: "Total Sites",      value: MOCK_SITE_OPS.length, color: "#93C5FD" },
            { label: "Active Workforce", value: totalWorkforce,       color: "#6EE7B7" },
            { label: "Open Violations",  value: totalViolations,      color: "#FCA5A5" },
            { label: "High Risk Areas",  value: highRiskSites,        color: "#FDE68A" },
            { label: "Equipment Utilization", value: "88%",           color: "#93C5FD" },
          ].map((s, i) => (
            <div key={s.label} style={{ flex: 1, padding: "12px 20px", borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "24px 32px" }}>
        <div style={{ display: "flex", gap: 24 }}>
          {/* Site List */}
          <div style={{ width: 340, flexShrink: 0 }}>
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E3E9F6", overflow: "hidden" }}>
              <div style={{ padding: 16, borderBottom: "1px solid #F3F4F6" }}>
                <div style={{ position: "relative" }}>
                  <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input 
                    type="text" 
                    placeholder="Search sites..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px 8px 34px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13 }}
                  />
                </div>
              </div>
              <div style={{ maxHeight: "calc(100vh - 350px)", overflowY: "auto" }}>
                {MOCK_SITE_OPS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    style={{ 
                      width: "100%", textAlign: "left", padding: "16px 20px", border: "none", borderBottom: "1px solid #F3F4F6", cursor: "pointer",
                      background: selectedId === s.id ? "#ECFDF5" : "transparent",
                      borderLeft: selectedId === s.id ? "4px solid #059669" : "4px solid transparent",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{s.name}</span>
                      <span style={{ 
                        fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, 
                        background: s.risk_status === "Low" ? "#D1FAE5" : s.risk_status === "Medium" ? "#FEF3C7" : "#FEE2E2", 
                        color: s.risk_status === "Low" ? "#065F46" : s.risk_status === "Medium" ? "#92400E" : "#B91C1C", 
                        textTransform: "uppercase" 
                      }}>
                        {s.risk_status} Risk
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={10} /> {s.location}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Dashboard */}
          <div style={{ flex: 1 }}>
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E3E9F6", padding: 32 }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>{selected.name}</h2>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>Live operational snapshot for {selected.location}</p>
                </div>
                <button style={{ padding: "8px 16px", background: "transparent", border: "1px solid #E5E7EB", borderRadius: 8, color: "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <Settings size={14} /> Site Config
                </button>
              </div>

              {/* Top Row: Quick Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 40 }}>
                {[
                  { label: "Workforce", value: selected.workforce_count, icon: Users, color: "#3B82F6" },
                  { label: "Active Projects", value: selected.active_projects, icon: Construction, color: "#10B981" },
                  { label: "Equipment", value: selected.equipment_count, icon: HardHat, color: "#6366F1" },
                  { label: "Violations", value: selected.violations_today, icon: AlertTriangle, color: selected.violations_today > 0 ? "#EF4444" : "#10B981" },
                ].map(stat => (
                  <div key={stat.label} style={{ padding: "20px", background: "#F9FAFB", borderRadius: 16, border: "1px solid #E5E7EB" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <stat.icon size={18} color={stat.color} />
                      </div>
                      <ArrowUpRight size={14} color="#9CA3AF" />
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>{stat.value}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginTop: 4 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                {/* Ongoing Activities */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" }}>Ongoing Activities</label>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#059669" }}>{selected.ongoing_activities.length} ACTIVE</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {selected.ongoing_activities.map((act, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#F9FAFB", borderRadius: 12, border: "1px solid #E5E7EB" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 4px #10B981" }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Safety & Risk Status */}
                <div>
                   <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 20 }}>Live Site Risk Status</label>
                   <div style={{ padding: 24, borderRadius: 20, background: selected.risk_status === "High" ? "#FEF2F2" : "#ECFDF5", border: "1px solid", borderColor: selected.risk_status === "High" ? "#FEE2E2" : "#D1FAE5" }}>
                     <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                        <div style={{ width: 48, height: 44, borderRadius: 12, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid", borderColor: selected.risk_status === "High" ? "#FEE2E2" : "#D1FAE5" }}>
                          <Shield size={24} color={selected.risk_status === "High" ? "#EF4444" : "#10B981"} />
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: selected.risk_status === "High" ? "#991B1B" : "#065F46" }}>{selected.risk_status} Risk Level</div>
                          <div style={{ fontSize: 12, color: selected.risk_status === "High" ? "#B91C1C" : "#059669", opacity: 0.8 }}>Operational safety status is {selected.risk_status.toLowerCase()}</div>
                        </div>
                     </div>
                     
                     <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                           <span style={{ color: "#6B7280" }}>Safety Compliance</span>
                           <span style={{ fontWeight: 700 }}>92%</span>
                        </div>
                        <div style={{ height: 6, background: "rgba(0,0,0,0.05)", borderRadius: 3, overflow: "hidden" }}>
                           <div style={{ width: "92%", height: "100%", background: selected.risk_status === "High" ? "#EF4444" : "#10B981" }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 4 }}>
                           <span style={{ color: "#9CA3AF" }}>Last incidence: 48h ago</span>
                           <span style={{ color: "#9CA3AF" }}>Next audit: Tomorrow</span>
                        </div>
                     </div>
                   </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
