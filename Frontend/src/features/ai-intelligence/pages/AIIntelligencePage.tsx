import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router";
import {
  Brain, Gauge, BarChart3, ShieldAlert, CheckSquare,
  Eye, Users, RefreshCw, TrendingUp, TrendingDown,
  Minus, AlertTriangle, CheckCircle2, Zap, ArrowUpRight, ArrowDownRight,
  Activity, Cpu, Database, Star, Send, Search, Sparkles, Wifi, WifiOff,
  Bot, MessageSquare, BarChart2, FileSearch,
} from "lucide-react";
import {
  useGetComplianceBenchmarkingQuery,
  useGetRiskScoringQuery,
  useGetKPIIntelligenceQuery,
  useGetPIRSQuery,
  useGetCorrectiveRecommendationsQuery,
  useGetWorkOversightQuery,
  useGetLeadershipIntelligenceQuery,
  useGetContinuousLearningQuery,
  useAiChatMutation,
  useGetAiStatusQuery,
  useGetAiDashboardQuery,
  useGetRiskPredictionsQuery,
  useGetComplianceIntelligenceQuery,
  useGetSafetyRecommendationsQuery,
  useGetTrendAnalysisQuery,
  useAiKnowledgeSearchMutation,
} from "@/features/ai-intelligence/api/aiIntelligenceApi";
import type {
  ComplianceBenchmark, RiskScore, KPIIndicator, PIRSEntry,
  AIRecommendation, OversightAlert, LeadershipMetric, ModelStatus,
  ChatMessage,
} from "@/features/ai-intelligence/api/aiIntelligenceApi";

// ─── Mock data (fallback when backend returns stubs) ──────────────────────

const MOCK_COMPLIANCE = {
  overall_score: 83,
  last_updated: new Date().toISOString(),
  trend: [{ label: "Jan", value: 74 }, { label: "Feb", value: 77 }, { label: "Mar", value: 80 }, { label: "Apr", value: 83 }],
  benchmarks: [
    { standard: "ISO 45001", your_score: 87, industry_avg: 72, best_in_class: 95, gap: 8, status: "above" as const },
    { standard: "OSHA 300",  your_score: 78, industry_avg: 80, best_in_class: 96, gap: 18, status: "below" as const },
    { standard: "RIDDOR",    your_score: 91, industry_avg: 68, best_in_class: 94, gap: 3, status: "above" as const },
    { standard: "ISO 14001", your_score: 75, industry_avg: 75, best_in_class: 92, gap: 17, status: "on_par" as const },
  ],
};

const MOCK_RISK = {
  overall_risk_level: "medium" as const,
  avg_score: 42,
  trend: [{ label: "Mon", value: 55 }, { label: "Tue", value: 48 }, { label: "Wed", value: 42 }, { label: "Thu", value: 38 }],
  scores: [
    { id: "1", entity_type: "site" as const,      entity_name: "Main Factory",        score: 68, level: "high" as const,     factors: ["High footfall", "Machinery exposure"], changed_at: new Date().toISOString() },
    { id: "2", entity_type: "permit" as const,    entity_name: "Hot Work PTW #12",    score: 55, level: "medium" as const,   factors: ["Flammable materials nearby"],          changed_at: new Date().toISOString() },
    { id: "3", entity_type: "workforce" as const, entity_name: "Night Shift Team",    score: 34, level: "low" as const,      factors: ["Fatigue risk"],                        changed_at: new Date().toISOString() },
    { id: "4", entity_type: "task" as const,      entity_name: "Conveyor Maintenance", score: 81, level: "critical" as const, factors: ["Lockout/Tagout required", "Confined space"], changed_at: new Date().toISOString() },
  ],
};

const MOCK_KPI = {
  health_score: 76,
  leading_indicators: [
    { id: "l1", name: "Safety Observations Filed", type: "leading" as const, current_value: 143, target: 120, unit: "count", trend: "improving" as const, change_pct: 12 },
    { id: "l2", name: "Toolbox Talk Completion",   type: "leading" as const, current_value: 88,  target: 95,  unit: "%",     trend: "stable" as const,    change_pct: 1 },
    { id: "l3", name: "PPE Inspection Rate",       type: "leading" as const, current_value: 94,  target: 90,  unit: "%",     trend: "improving" as const, change_pct: 4 },
    { id: "l4", name: "Near-Miss Reports",         type: "leading" as const, current_value: 28,  target: 40,  unit: "count", trend: "declining" as const, change_pct: -8 },
  ],
  lagging_indicators: [
    { id: "g1", name: "Lost Time Injury Rate", type: "lagging" as const, current_value: 0.8, target: 0.5, unit: "per 200k hrs", trend: "improving" as const, change_pct: -12 },
    { id: "g2", name: "Total Recordable Rate", type: "lagging" as const, current_value: 2.1, target: 1.8, unit: "per 200k hrs", trend: "stable" as const,    change_pct: -2 },
    { id: "g3", name: "Days Since Lost Time",  type: "lagging" as const, current_value: 127, target: 200, unit: "days",         trend: "improving" as const, change_pct: 15 },
  ],
};

const MOCK_PIRS = {
  high_risk_count: 4,
  model_accuracy: 91.4,
  last_trained: "2026-05-20T02:00:00Z",
  predictions: [
    { entity_id: "w1", entity_name: "Worker: Marcus T.",   entity_type: "worker" as const, injury_probability: 0.73, risk_factors: [{ factor: "Fatigue pattern detected", weight: 0.4 }, { factor: "Recent near-miss", weight: 0.33 }], recommended_action: "Rotate to lighter duties for 48h", urgency: "high" as const },
    { entity_id: "s1", entity_name: "Zone: Compressor Bay", entity_type: "site" as const,   injury_probability: 0.61, risk_factors: [{ factor: "Noise level > 85dB", weight: 0.35 }, { factor: "Inadequate PPE", weight: 0.26 }], recommended_action: "Mandatory hearing protection audit", urgency: "high" as const },
    { entity_id: "t1", entity_name: "Task: Tank Cleaning",  entity_type: "task" as const,   injury_probability: 0.44, risk_factors: [{ factor: "Chemical exposure risk", weight: 0.3 }, { factor: "Lone worker detected", weight: 0.14 }], recommended_action: "Buddy system + gas detection", urgency: "medium" as const },
  ],
};

const MOCK_RECS = {
  total: 18, unactioned: 11,
  recommendations: [
    { id: "r1", title: "Increase inspection frequency in Compressor Bay", description: "AI detected 3 anomalies in 7 days — inspection cadence should double.", category: "Compliance", priority: "critical" as const, confidence: 0.94, source_events: ["Near-miss #44"], suggested_action: "Schedule daily walkthrough for 2 weeks", created_at: new Date().toISOString() },
    { id: "r2", title: "Replace PTW paper forms with digital workflow", description: "Paper permits have 23% error rate vs 2% digital.", category: "Process", priority: "high" as const, confidence: 0.88, source_events: ["Permit audit"], suggested_action: "Migrate to digital PTW by end of quarter", created_at: new Date().toISOString() },
  ],
};

const MOCK_OVERSIGHT = {
  active_alerts: 7, violations_today: 3, drift_events: 2, unsafe_acts: 2,
  alerts: [
    { id: "a1", type: "violation" as const,  description: "No-helmet zone breach — Zone 4 camera 3", site: "Main Factory", zone: "Zone 4", severity: "high" as const,     detected_at: new Date().toISOString(), resolved: false },
    { id: "a2", type: "drift" as const,      description: "Process deviation: conveyor speed 18% above SOP", site: "Warehouse A",  severity: "medium" as const,           detected_at: new Date().toISOString(), resolved: false },
    { id: "a3", type: "unsafe_act" as const, description: "Worker bypassed lockout procedure on Line 2", site: "Main Factory", zone: "Line 2", severity: "critical" as const, detected_at: new Date().toISOString(), resolved: false },
  ],
};

const MOCK_LEADERSHIP = {
  engagement_score: 72, safety_culture_score: 68, communication_score: 81,
  top_insights: ["Leadership visibility in safety walks up 15% this month", "Communication response time improved by 22%", "Safety suggestion uptake below benchmark"],
  metrics: [
    { dimension: "Safety Walk Frequency",     score: 78, benchmark: 70, insights: ["Above industry avg"] },
    { dimension: "Toolbox Talk Engagement",   score: 64, benchmark: 75, insights: ["Below benchmark"] },
    { dimension: "Incident Reporting",        score: 71, benchmark: 68, insights: ["Good reporting culture"] },
    { dimension: "Corrective Action Follow-through", score: 82, benchmark: 72, insights: ["Strong closure rate"] },
  ],
};

const MOCK_LEARNING = {
  data_points_collected: 284033, improvements_this_month: 7, next_training_at: "2026-06-01T02:00:00Z",
  models: [
    { model_name: "PPE Violation Detector",     version: "v3.2.1",    accuracy: 94.1, precision: 92.8, recall: 95.3, last_trained: "2026-05-15", training_samples: 82400,  status: "active" as const },
    { model_name: "Predictive Injury Risk",     version: "v2.0.4",    accuracy: 91.4, precision: 89.1, recall: 93.6, last_trained: "2026-05-10", training_samples: 44200,  status: "active" as const },
    { model_name: "Anomaly / Drift Detector",   version: "v1.8.0",    accuracy: 88.7, precision: 87.2, recall: 90.1, last_trained: "2026-04-28", training_samples: 31800,  status: "active" as const },
    { model_name: "NLP Compliance Extractor",   version: "v4.1.0",    accuracy: 96.2, precision: 95.0, recall: 97.4, last_trained: "2026-05-18", training_samples: 28100,  status: "active" as const },
    { model_name: "Risk Scoring Engine",        version: "v2.3.0-beta", accuracy: 89.3, precision: 88.0, recall: 90.5, last_trained: "2026-05-20", training_samples: 15200, status: "staged" as const },
  ],
};

// ─── Shared UI helpers ────────────────────────────────────────────────────

const RISK_COLOR: Record<string, string> = { low: "#10B981", medium: "#F59E0B", high: "#F97316", critical: "#EF4444" };
const PRIORITY_COLOR: Record<string, string> = { low: "#10B981", medium: "#F59E0B", high: "#F97316", critical: "#EF4444" };
const ALERT_TYPE_COLOR: Record<string, string> = { violation: "#EF4444", drift: "#F59E0B", unsafe_act: "#7C3AED" };

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border p-5 ${className}`} style={{ borderColor: "#E3E9F6" }}>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, sub, accent }: { icon: typeof Brain; title: string; sub: string; accent: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: accent + "18" }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <div>
        <h2 className="text-base font-bold" style={{ color: "#111827" }}>{title}</h2>
        <p className="text-xs" style={{ color: "#6B7280" }}>{sub}</p>
      </div>
    </div>
  );
}

function ScoreRing({ value, size = 72, color = "#4A57B9" }: { value: number; size?: number; color?: string }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={8} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" style={{ fontSize: size / 4.5, fontWeight: 700, fill: "#111827" }} transform={`rotate(90, ${size / 2}, ${size / 2})`}>
        {value}
      </text>
    </svg>
  );
}

function TrendIcon({ trend }: { trend: "improving" | "stable" | "declining" }) {
  if (trend === "improving") return <TrendingUp className="w-3.5 h-3.5" style={{ color: "#10B981" }} />;
  if (trend === "declining") return <TrendingDown className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />;
  return <Minus className="w-3.5 h-3.5" style={{ color: "#9CA3AF" }} />;
}

function Spinner() {
  return <p className="text-sm text-center py-8" style={{ color: "#9CA3AF" }}>Loading…</p>;
}

function AiUnconfiguredBanner({ message }: { message?: string }) {
  return (
    <div className="rounded-xl border p-4 flex items-start gap-3" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#D97706" }} />
      <div className="text-sm" style={{ color: "#92400E" }}>
        <p className="font-semibold mb-1">Azure AI Foundry not configured</p>
        <p style={{ color: "#B45309" }}>{message ?? "Add AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT to backend .env to enable AI-powered analysis."}</p>
      </div>
    </div>
  );
}

// ─── Tab 1: AI Dashboard ──────────────────────────────────────────────────

function AiDashboardTab() {
  const { data: statusData } = useGetAiStatusQuery();
  const { data: dashData, isLoading } = useGetAiDashboardQuery();
  const { data: riskData } = useGetRiskScoringQuery();
  const { data: recsData } = useGetCorrectiveRecommendationsQuery();
  const { data: oversightData } = useGetWorkOversightQuery();

  const riskD = riskData ?? MOCK_RISK;
  const recsD = recsData ?? MOCK_RECS;
  const oversightD = oversightData ?? MOCK_OVERSIGHT;

  const configured = statusData?.configured ?? dashData?.configured ?? false;

  const statCards = [
    { label: "Overall Risk", value: riskD.overall_risk_level, color: RISK_COLOR[riskD.overall_risk_level] ?? "#F59E0B" },
    { label: "Risk Avg Score", value: riskD.avg_score, color: "#F97316" },
    { label: "Open Recommendations", value: recsD.unactioned, color: "#4A57B9" },
    { label: "Active Alerts", value: oversightD.active_alerts, color: "#EF4444" },
    { label: "Violations Today", value: oversightD.violations_today, color: "#F97316" },
    { label: "Drift Events", value: oversightD.drift_events, color: "#F59E0B" },
  ];

  return (
    <div className="space-y-5">
      {/* Status banner */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: configured ? "#D1FAE5" : "#FEF3C7" }}>
              {configured ? <Wifi className="w-5 h-5" style={{ color: "#10B981" }} /> : <WifiOff className="w-5 h-5" style={{ color: "#D97706" }} />}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#111827" }}>Azure AI Foundry</p>
              <p className="text-xs" style={{ color: "#6B7280" }}>{configured ? `Connected · ${statusData?.model ?? dashData?.model ?? "gpt-4o"}` : "Not configured — AI analysis unavailable"}</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: configured ? "#D1FAE5" : "#FEF3C7", color: configured ? "#065F46" : "#92400E" }}>
            {configured ? "Online" : "Offline"}
          </span>
        </div>
      </Card>

      {!configured && <AiUnconfiguredBanner />}

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
        {statCards.map(({ label, value, color }) => (
          <Card key={label} className="text-center">
            <div className="text-2xl font-black capitalize" style={{ color }}>{value}</div>
            <div className="text-xs mt-1" style={{ color: "#6B7280" }}>{label}</div>
          </Card>
        ))}
      </div>

      {/* AI Summary */}
      {isLoading ? <Card><Spinner /></Card> : dashData ? (
        <Card>
          <SectionHeader icon={Sparkles} title="AI Executive Summary" sub="Generated by Azure AI Foundry" accent="#4A57B9" />
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#374151" }}>{dashData.ai_summary}</p>
          {dashData.top_risks?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#EF4444" }}>Top Risks Identified</p>
              <ul className="space-y-1.5">
                {dashData.top_risks.map((risk: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#374151" }}>
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#EF4444" }} />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}

// ─── Tab 2: AI Assistant ──────────────────────────────────────────────────

function AiAssistantTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hello! I'm your HSE AI Assistant powered by Azure AI Foundry. I can help you with safety queries, compliance questions, risk analysis, and regulatory guidance. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [sendChat, { isLoading: sending }] = useAiChatMutation();
  const { data: statusData } = useGetAiStatusQuery();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || sending) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    try {
      const res = await sendChat({ messages: next }).unwrap();
      setMessages([...next, { role: "assistant", content: res.content }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Sorry, I encountered an error. Please check your Azure AI Foundry configuration." }]);
    }
  }

  const configured = statusData?.configured ?? true;

  return (
    <div className="space-y-4">
      {!configured && <AiUnconfiguredBanner />}
      <Card className="flex flex-col" style={{ height: "60vh" }}>
        <div className="flex items-center gap-2 pb-3 border-b mb-3" style={{ borderColor: "#E3E9F6" }}>
          <Bot className="w-5 h-5" style={{ color: "#4A57B9" }} />
          <span className="text-sm font-bold" style={{ color: "#111827" }}>HSE AI Assistant</span>
          <span className="text-xs ml-auto px-2 py-0.5 rounded-full" style={{ background: configured ? "#D1FAE5" : "#FEF3C7", color: configured ? "#065F46" : "#92400E" }}>
            {configured ? `● ${statusData?.model ?? "gpt-4o"}` : "● Not configured"}
          </span>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${msg.role === "user" ? "text-white" : ""}`}
                style={{ background: msg.role === "user" ? "linear-gradient(135deg,#4A57B9,#6F80E8)" : "#F3F4F6", color: msg.role === "assistant" ? "#4A57B9" : undefined }}>
                {msg.role === "user" ? "U" : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                style={msg.role === "user"
                  ? { background: "linear-gradient(135deg,#4A57B9,#6F80E8)", color: "#fff" }
                  : { background: "#F8FAFF", color: "#374151", border: "1px solid #E3E9F6" }}>
                {msg.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#F3F4F6" }}>
                <Bot className="w-3.5 h-3.5" style={{ color: "#4A57B9" }} />
              </div>
              <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm" style={{ background: "#F8FAFF", border: "1px solid #E3E9F6", color: "#9CA3AF" }}>
                Thinking…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="pt-3 mt-3 border-t flex gap-2" style={{ borderColor: "#E3E9F6" }}>
          <input
            className="flex-1 text-sm px-4 py-2.5 rounded-xl border outline-none"
            style={{ borderColor: "#E3E9F6", color: "#111827" }}
            placeholder="Ask about safety, compliance, risk…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="px-4 py-2.5 rounded-xl text-white font-semibold flex items-center gap-1.5 text-sm disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#4A57B9,#6F80E8)" }}
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </div>
      </Card>

      {/* Suggested prompts */}
      <div className="flex flex-wrap gap-2">
        {[
          "What are our top 3 safety risks this week?",
          "How do we compare on ISO 45001 compliance?",
          "Summarise recent incident trends",
          "What corrective actions are overdue?",
        ].map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => setInput(prompt)}
            className="text-xs px-3 py-1.5 rounded-xl border font-medium transition-all hover:border-blue-300"
            style={{ borderColor: "#E3E9F6", color: "#4A57B9", background: "#F8FAFF" }}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Tab 3: Risk Predictions ──────────────────────────────────────────────

function RiskPredictionsTab() {
  const { data: aiPreds, isLoading: aiLoading } = useGetRiskPredictionsQuery();
  const { data: riskData, isLoading: riskLoading } = useGetRiskScoringQuery();
  const { data: pirsData, isLoading: pirsLoading } = useGetPIRSQuery();

  const riskD = riskData ?? MOCK_RISK;
  const pirsD = pirsData ?? MOCK_PIRS;

  return (
    <div className="space-y-5">
      {/* AI Predictions from Azure AI Foundry */}
      <Card>
        <SectionHeader icon={Sparkles} title="AI-Powered Risk Predictions" sub="Azure AI Foundry analyses patterns to predict future risks" accent="#4A57B9" />
        {aiLoading ? <Spinner /> : !aiPreds?.configured ? <AiUnconfiguredBanner /> : (
          <div className="space-y-3">
            {(aiPreds?.predictions ?? []).length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "#9CA3AF" }}>No predictions generated yet — add more data to improve model accuracy.</p>
            ) : (aiPreds?.predictions ?? []).map((pred, i) => {
              const likelihood = Math.round(pred.likelihood * 100);
              const impact = Math.round(pred.impact * 100);
              const score = Math.round(pred.score * 100);
              const color = score > 70 ? "#EF4444" : score > 40 ? "#F97316" : "#F59E0B";
              return (
                <div key={i} className="rounded-xl border p-4 space-y-2" style={{ borderColor: "#E3E9F6" }}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold" style={{ color: "#111827" }}>{pred.entity}</p>
                    <span className="text-lg font-black flex-shrink-0" style={{ color }}>{score}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1" style={{ color: "#6B7280" }}>
                        <span>Likelihood</span><span>{likelihood}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                        <div className="h-full rounded-full" style={{ width: `${likelihood}%`, background: "#F59E0B" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1" style={{ color: "#6B7280" }}>
                        <span>Impact</span><span>{impact}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                        <div className="h-full rounded-full" style={{ width: `${impact}%`, background: "#EF4444" }} />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs px-2.5 py-1.5 rounded-lg" style={{ background: "#EEF2FB", color: "#3730A3" }}>
                    <span className="font-semibold">AI Recommendation: </span>{pred.recommendation}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Existing risk scoring */}
      <Card>
        <SectionHeader icon={Gauge} title="Real-time Risk Scoring" sub="Task · Site · Permit · Workforce risk levels" accent="#EF4444" />
        {riskLoading ? <Spinner /> : (
          <div className="space-y-3">
            {riskD.scores.map((s: RiskScore) => {
              const color = RISK_COLOR[s.level];
              return (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F8FAFF" }}>
                  <div className="w-32 text-xs font-semibold flex-shrink-0" style={{ color: "#374151" }}>
                    <div>{s.entity_name}</div>
                    <div className="font-normal capitalize" style={{ color: "#9CA3AF" }}>{s.entity_type}</div>
                  </div>
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${s.score}%`, background: color }} />
                  </div>
                  <div className="w-8 text-sm font-bold text-right" style={{ color }}>{s.score}</div>
                  <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full w-16 text-center" style={{ background: color + "1A", color }}>{s.level}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* PIRS */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <SectionHeader icon={ShieldAlert} title="PIRS — Predictive Injury Risk Scoring" sub="AI predicts injury probability per worker, site, and task" accent="#F97316" />
          <div className="text-right flex-shrink-0">
            <div className="text-lg font-bold" style={{ color: "#4A57B9" }}>{pirsD.model_accuracy}%</div>
            <div className="text-xs" style={{ color: "#9CA3AF" }}>Model accuracy</div>
          </div>
        </div>
        {pirsLoading ? <Spinner /> : (
          <div className="space-y-3">
            {pirsD.predictions.map((p: PIRSEntry) => {
              const pct = Math.round(p.injury_probability * 100);
              const color = pct > 65 ? "#EF4444" : pct > 40 ? "#F97316" : "#F59E0B";
              return (
                <div key={p.entity_id} className="rounded-xl border p-3.5 space-y-2" style={{ borderColor: pct > 65 ? "#FECACA" : "#E3E9F6", background: pct > 65 ? "#FFF5F5" : "#F8FAFF" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "#111827" }}>{p.entity_name}</div>
                      <div className="text-xs capitalize" style={{ color: "#9CA3AF" }}>{p.entity_type}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black" style={{ color }}>{pct}%</div>
                      <div className="text-xs font-semibold" style={{ color }}>injury probability</div>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <div className="flex items-start gap-2 pt-1">
                    <div className="flex-1 text-xs space-y-0.5" style={{ color: "#6B7280" }}>
                      {p.risk_factors.map((f) => (
                        <div key={f.factor} className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                          {f.factor} <span className="font-medium" style={{ color: "#374151" }}>({Math.round(f.weight * 100)}%)</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 text-xs p-2 rounded-lg" style={{ background: "#EEF2FB", color: "#3730A3" }}>
                      <span className="font-semibold">Recommended: </span>{p.recommended_action}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Tab 4: Compliance Intelligence ──────────────────────────────────────

function ComplianceIntelligenceTab() {
  const { data: aiComp, isLoading: aiLoading } = useGetComplianceIntelligenceQuery();
  const { data: benchData, isLoading: benchLoading } = useGetComplianceBenchmarkingQuery();

  const benchD = benchData ?? MOCK_COMPLIANCE;
  const statusCfg = (s: string) =>
    s === "above" ? { color: "#10B981", label: "Above avg" } :
    s === "below" ? { color: "#EF4444", label: "Below avg" } :
    { color: "#F59E0B", label: "On par" };

  return (
    <div className="space-y-5">
      {/* AI Analysis */}
      <Card>
        <SectionHeader icon={Sparkles} title="AI Compliance Gap Analysis" sub="Azure AI Foundry identifies compliance gaps and risks" accent="#4A57B9" />
        {aiLoading ? <Spinner /> : !aiComp?.configured ? <AiUnconfiguredBanner /> : (
          <div className="space-y-4">
            {aiComp.overall_assessment && (
              <div className="rounded-xl p-4" style={{ background: "#F8FAFF", border: "1px solid #E3E9F6" }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#4A57B9" }}>Overall Assessment</p>
                <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{aiComp.overall_assessment}</p>
              </div>
            )}
            {(aiComp.gaps ?? []).length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#EF4444" }}>Identified Gaps</p>
                <div className="space-y-2">
                  {aiComp.gaps.map((gap, i) => {
                    const pColor = PRIORITY_COLOR[gap.priority] ?? "#F59E0B";
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "#E3E9F6" }}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold" style={{ color: "#111827" }}>{gap.area}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize" style={{ background: pColor + "1A", color: pColor }}>{gap.priority}</span>
                          </div>
                          <div className="flex gap-4 text-xs" style={{ color: "#6B7280" }}>
                            <span>Current: <strong style={{ color: "#111827" }}>{gap.current}%</strong></span>
                            <span>Required: <strong style={{ color: "#111827" }}>{gap.required}%</strong></span>
                            <span>Gap: <strong style={{ color: pColor }}>{gap.gap}%</strong></span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Existing benchmarking */}
      <Card>
        <SectionHeader icon={Brain} title="Compliance Benchmarking" sub="Compare your scores vs standards and best-in-class" accent="#4A57B9" />
        {benchLoading ? <Spinner /> : (
          <div className="flex gap-5 items-start">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <ScoreRing value={benchD.overall_score} color="#4A57B9" />
              <span className="text-xs font-semibold" style={{ color: "#4A57B9" }}>Overall score</span>
            </div>
            <div className="flex-1 space-y-2">
              {benchD.benchmarks.map((b: ComplianceBenchmark) => {
                const cfg = statusCfg(b.status);
                return (
                  <div key={b.standard} className="flex items-center gap-3 py-1.5">
                    <div className="w-24 text-xs font-semibold flex-shrink-0" style={{ color: "#374151" }}>{b.standard}</div>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                      <div className="h-full rounded-full" style={{ width: `${b.your_score}%`, background: cfg.color }} />
                    </div>
                    <div className="w-10 text-xs font-bold text-right" style={{ color: "#111827" }}>{b.your_score}%</div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold w-20 text-center" style={{ background: cfg.color + "18", color: cfg.color }}>{cfg.label}</span>
                    <div className="text-xs text-right w-28 flex-shrink-0" style={{ color: "#9CA3AF" }}>
                      Avg {b.industry_avg}% · Best {b.best_in_class}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Tab 5: Safety Recommendations ───────────────────────────────────────

function SafetyRecommendationsTab() {
  const { data: aiRecs, isLoading: aiLoading } = useGetSafetyRecommendationsQuery();
  const { data: recsData, isLoading: recsLoading } = useGetCorrectiveRecommendationsQuery();
  const { data: oversightData, isLoading: oversightLoading } = useGetWorkOversightQuery();

  const recsD = recsData ?? MOCK_RECS;
  const oversightD = oversightData ?? MOCK_OVERSIGHT;
  const typeLabel: Record<string, string> = { violation: "Violation", drift: "Process Drift", unsafe_act: "Unsafe Act" };

  return (
    <div className="space-y-5">
      {/* AI Recommendations */}
      <Card>
        <SectionHeader icon={Sparkles} title="AI Safety Recommendations" sub="Azure AI Foundry analyses your data and suggests actions" accent="#10B981" />
        {aiLoading ? <Spinner /> : !aiRecs?.configured ? <AiUnconfiguredBanner /> : (
          <div className="space-y-3">
            {[...(aiRecs?.ai_recommendations ?? []), ...(aiRecs?.platform_recommendations ?? [])].map((rec, i) => {
              const pColor = PRIORITY_COLOR[rec.priority] ?? "#F59E0B";
              return (
                <div key={i} className="rounded-xl border p-4 space-y-1.5" style={{ borderColor: "#E3E9F6" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: pColor + "1A", color: pColor }}>{rec.priority}</span>
                    <span className="text-xs" style={{ color: "#9CA3AF" }}>{rec.category}</span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "#111827" }}>{rec.title}</p>
                  <p className="text-xs" style={{ color: "#6B7280" }}>{rec.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Platform recommendations */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <SectionHeader icon={CheckSquare} title="Corrective Recommendations" sub="AI-suggested actions from platform data" accent="#10B981" />
          <div className="text-center">
            <div className="text-xl font-bold" style={{ color: "#EF4444" }}>{recsD.unactioned}</div>
            <div className="text-xs" style={{ color: "#9CA3AF" }}>Unactioned</div>
          </div>
        </div>
        {recsLoading ? <Spinner /> : (
          <div className="space-y-3">
            {recsD.recommendations.map((r: AIRecommendation) => {
              const color = PRIORITY_COLOR[r.priority];
              return (
                <div key={r.id} className="rounded-xl border p-4 space-y-2" style={{ borderColor: "#E3E9F6" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: color + "1A", color }}>{r.priority}</span>
                    <span className="text-xs" style={{ color: "#9CA3AF" }}>{r.category}</span>
                    <span className="text-xs font-semibold ml-auto" style={{ color: "#4A57B9" }}>{Math.round(r.confidence * 100)}% confidence</span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "#111827" }}>{r.title}</p>
                  <p className="text-xs" style={{ color: "#6B7280" }}>{r.description}</p>
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-xs px-2.5 py-1.5 rounded-lg" style={{ background: "#EEF2FB", color: "#3730A3" }}>
                      <span className="font-semibold">Action: </span>{r.suggested_action}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="text-xs px-3 py-1.5 rounded-lg border font-semibold" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>Dismiss</button>
                      <button type="button" className="text-xs px-3 py-1.5 rounded-lg text-white font-semibold" style={{ background: "#10B981" }}>Act Now</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Work Oversight */}
      <Card>
        <SectionHeader icon={Eye} title="Work Execution Oversight" sub="Violations, drift, and unsafe acts detected in real-time" accent="#7C3AED" />
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "Active Alerts",    value: oversightD.active_alerts,    color: "#EF4444" },
            { label: "Violations Today", value: oversightD.violations_today,  color: "#F97316" },
            { label: "Drift Events",     value: oversightD.drift_events,      color: "#F59E0B" },
            { label: "Unsafe Acts",      value: oversightD.unsafe_acts,       color: "#7C3AED" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl p-3 text-center" style={{ background: color + "0F" }}>
              <div className="text-2xl font-bold" style={{ color }}>{oversightLoading ? "…" : value}</div>
              <div className="text-xs font-medium mt-0.5" style={{ color: "#6B7280" }}>{label}</div>
            </div>
          ))}
        </div>
        {!oversightLoading && (
          <div className="space-y-2">
            {oversightD.alerts.map((a: OversightAlert) => {
              const color = ALERT_TYPE_COLOR[a.type] ?? "#9CA3AF";
              const sevColor = RISK_COLOR[a.severity];
              return (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl border" style={{ borderColor: "#E3E9F6" }}>
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold" style={{ color }}>{typeLabel[a.type]}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold capitalize" style={{ background: sevColor + "1A", color: sevColor }}>{a.severity}</span>
                      <span className="text-xs ml-auto" style={{ color: "#9CA3AF" }}>{a.site}{a.zone ? ` · ${a.zone}` : ""}</span>
                    </div>
                    <p className="text-xs" style={{ color: "#374151" }}>{a.description}</p>
                  </div>
                  {!a.resolved && (
                    <button type="button" className="text-xs px-2 py-1 rounded-lg font-semibold flex-shrink-0" style={{ background: "#EEF2FB", color: "#4A57B9" }}>Resolve</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Tab 6: Trend Analysis ────────────────────────────────────────────────

function TrendAnalysisTab() {
  const { data: aiTrend, isLoading: aiLoading } = useGetTrendAnalysisQuery();
  const { data: kpiData, isLoading: kpiLoading } = useGetKPIIntelligenceQuery();

  const kpiD = kpiData ?? MOCK_KPI;

  const monthly = aiTrend?.monthly_data ?? [];
  const maxVal = monthly.length ? Math.max(...monthly.map((m) => Math.max(m.incidents, m.near_misses, m.resolved)), 1) : 1;

  function KPIRow({ kpi }: { kpi: KPIIndicator }) {
    const hitTarget = kpi.current_value >= kpi.target;
    const pct = Math.min((kpi.current_value / (kpi.target * 1.2)) * 100, 100);
    return (
      <div className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: "#F3F4F6" }}>
        <TrendIcon trend={kpi.trend} />
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold" style={{ color: "#374151" }}>{kpi.name}</span>
            <span style={{ color: "#9CA3AF" }}>Target: {kpi.target} {kpi.unit}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: hitTarget ? "#10B981" : "#F59E0B" }} />
          </div>
        </div>
        <div className="text-xs font-bold w-20 text-right" style={{ color: hitTarget ? "#10B981" : "#F59E0B" }}>
          {kpi.current_value} {kpi.unit}
        </div>
        <span className="text-xs w-10 text-right" style={{ color: kpi.change_pct > 0 ? "#10B981" : kpi.change_pct < 0 ? "#EF4444" : "#9CA3AF" }}>
          {kpi.change_pct > 0 ? "+" : ""}{kpi.change_pct}%
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* AI Trend Analysis */}
      <Card>
        <SectionHeader icon={Sparkles} title="AI Incident Trend Analysis" sub="Azure AI Foundry identifies patterns and forecasts" accent="#4A57B9" />
        {aiLoading ? <Spinner /> : !aiTrend?.configured ? <AiUnconfiguredBanner /> : (
          <div className="space-y-4">
            {monthly.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#6B7280" }}>Monthly Incident Trend</p>
                <div className="flex items-end gap-2 h-36">
                  {monthly.map((m) => (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end gap-0.5" style={{ height: "110px" }}>
                        {[
                          { val: m.incidents, color: "#EF4444" },
                          { val: m.near_misses, color: "#F59E0B" },
                          { val: m.resolved, color: "#10B981" },
                        ].map(({ val, color }, j) => (
                          <div key={j} className="flex-1 rounded-t" style={{ height: `${(val / maxVal) * 100}%`, background: color, minHeight: "2px" }} />
                        ))}
                      </div>
                      <span className="text-xs" style={{ color: "#9CA3AF" }}>{m.month}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-2">
                  {[{ color: "#EF4444", label: "Incidents" }, { color: "#F59E0B", label: "Near Misses" }, { color: "#10B981", label: "Resolved" }].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: "#6B7280" }}>
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />{label}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {aiTrend.analysis && (
              <div className="rounded-xl p-4" style={{ background: "#F8FAFF", border: "1px solid #E3E9F6" }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#4A57B9" }}>AI Analysis</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#374151" }}>{aiTrend.analysis}</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* KPI Intelligence */}
      <Card>
        <SectionHeader icon={BarChart3} title="KPI Intelligence" sub="Leading and lagging safety indicators" accent="#8B5CF6" />
        {kpiLoading ? <Spinner /> : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#10B981" }}>Leading Indicators</p>
              {kpiD.leading_indicators.map((k: KPIIndicator) => <KPIRow key={k.id} kpi={k} />)}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#EF4444" }}>Lagging Indicators</p>
              {kpiD.lagging_indicators.map((k: KPIIndicator) => <KPIRow key={k.id} kpi={k} />)}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Tab 7: Benchmarking ──────────────────────────────────────────────────

function BenchmarkingTab() {
  const { data: leadershipData, isLoading: lLoading } = useGetLeadershipIntelligenceQuery();
  const { data: learningData, isLoading: clLoading } = useGetContinuousLearningQuery();

  const leaderD = leadershipData ?? MOCK_LEADERSHIP;
  const learningD = learningData ?? MOCK_LEARNING;

  return (
    <div className="space-y-5">
      {/* Leadership Intelligence */}
      <Card>
        <SectionHeader icon={Users} title="Leadership Intelligence" sub="Engagement, communications, and safety culture scores" accent="#06B6D4" />
        {lLoading ? <Spinner /> : (
          <div className="space-y-4">
            <div className="flex items-center gap-6 pb-4 border-b" style={{ borderColor: "#F3F4F6" }}>
              {[
                { label: "Engagement",     value: leaderD.engagement_score,     color: "#06B6D4" },
                { label: "Safety Culture", value: leaderD.safety_culture_score, color: "#8B5CF6" },
                { label: "Communication",  value: leaderD.communication_score,  color: "#10B981" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <ScoreRing value={value} size={60} color={color} />
                  <span className="text-xs font-medium" style={{ color: "#6B7280" }}>{label}</span>
                </div>
              ))}
              <div className="flex-1 space-y-1.5">
                {leaderD.top_insights.map((insight: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "#374151" }}>
                    <Star className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "#F59E0B" }} />
                    {insight}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {leaderD.metrics.map((m: LeadershipMetric) => {
                const above = m.score >= m.benchmark;
                return (
                  <div key={m.dimension} className="flex items-center gap-3">
                    <div className="w-44 text-xs font-semibold flex-shrink-0" style={{ color: "#374151" }}>{m.dimension}</div>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                      <div className="h-full rounded-full" style={{ width: `${m.score}%`, background: above ? "#10B981" : "#F59E0B" }} />
                    </div>
                    <span className="text-xs font-bold w-8" style={{ color: above ? "#10B981" : "#F59E0B" }}>{m.score}</span>
                    {above
                      ? <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#10B981" }} />
                      : <ArrowDownRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#EF4444" }} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Continuous Learning Models */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <SectionHeader icon={RefreshCw} title="Continuous Learning" sub="AI models learn and improve from operational data" accent="#F59E0B" />
          <div className="grid grid-cols-2 gap-3 flex-shrink-0">
            {[
              { label: "Data Points",     value: (learningD.data_points_collected ?? 0).toLocaleString(), icon: Database, color: "#4A57B9" },
              { label: "Improvements",    value: `+${learningD.improvements_this_month} this month`,      icon: Activity,  color: "#10B981" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="text-center px-3 py-2 rounded-xl" style={{ background: color + "0F" }}>
                <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
                <div className="text-sm font-bold" style={{ color }}>{value}</div>
                <div className="text-xs" style={{ color: "#9CA3AF" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
        {clLoading ? <Spinner /> : (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                  {["Model", "Accuracy", "Training Samples", "Last Trained", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {learningD.models.map((m: ModelStatus) => {
                  const statusCfg = {
                    active:     { color: "#10B981", bg: "#D1FAE5", label: "Active" },
                    training:   { color: "#F59E0B", bg: "#FEF3C7", label: "Training" },
                    staged:     { color: "#8B5CF6", bg: "#F5F3FF", label: "Staged" },
                    deprecated: { color: "#9CA3AF", bg: "#F3F4F6", label: "Deprecated" },
                  }[m.status];
                  return (
                    <tr key={m.model_name} className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold" style={{ color: "#111827" }}>{m.model_name}</div>
                        <div className="text-xs font-mono" style={{ color: "#9CA3AF" }}>{m.version}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                            <div className="h-full rounded-full" style={{ width: `${m.accuracy}%`, background: m.accuracy > 90 ? "#10B981" : "#F59E0B" }} />
                          </div>
                          <span className="text-xs font-bold" style={{ color: "#111827" }}>{m.accuracy}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{m.training_samples.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{m.last_trained}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between text-xs" style={{ color: "#9CA3AF" }}>
          <span>Next scheduled training: {new Date(learningD.next_training_at).toLocaleDateString()}</span>
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            <span>Auto-retraining enabled</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Tab 8: AI Knowledge Search ───────────────────────────────────────────

function KnowledgeSearchTab() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [search, { data, isLoading }] = useAiKnowledgeSearchMutation();

  async function handleSearch() {
    if (!query.trim()) return;
    setSubmitted(query.trim());
    await search({ query: query.trim() });
  }

  return (
    <div className="space-y-5">
      <Card>
        <SectionHeader icon={FileSearch} title="AI Knowledge Search" sub="Search your HSE knowledge base with AI-powered semantic search" accent="#4A57B9" />
        <div className="flex gap-2">
          <input
            className="flex-1 text-sm px-4 py-2.5 rounded-xl border outline-none"
            style={{ borderColor: "#E3E9F6", color: "#111827" }}
            placeholder="Search HSE knowledge base… e.g. 'confined space entry procedures'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={!query.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl text-white font-semibold flex items-center gap-1.5 text-sm disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#4A57B9,#6F80E8)" }}
          >
            <Search className="w-3.5 h-3.5" />
            Search
          </button>
        </div>

        {/* Suggested searches */}
        <div className="flex flex-wrap gap-2 mt-3">
          {["Confined space entry", "Hot work permit requirements", "COSHH assessment", "ISO 45001 clause 8", "RIDDOR reporting obligations"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setQuery(s)}
              className="text-xs px-3 py-1 rounded-xl border"
              style={{ borderColor: "#E3E9F6", color: "#4A57B9", background: "#F8FAFF" }}
            >
              {s}
            </button>
          ))}
        </div>
      </Card>

      {isLoading && <Card><Spinner /></Card>}

      {data && !isLoading && (
        <>
          {/* AI Answer */}
          {data.answer && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" style={{ color: "#4A57B9" }} />
                <span className="text-sm font-bold" style={{ color: "#111827" }}>AI Answer</span>
                <span className="text-xs ml-auto" style={{ color: "#9CA3AF" }}>for "{submitted}"</span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#374151" }}>{data.answer}</p>
            </Card>
          )}

          {/* Search results */}
          {data.results?.length > 0 && (
            <Card>
              <p className="text-sm font-semibold mb-3" style={{ color: "#111827" }}>
                {data.total} source{data.total !== 1 ? "s" : ""} found
              </p>
              <div className="space-y-3">
                {data.results.map((r, i) => (
                  <div key={r.id ?? i} className="rounded-xl border p-4" style={{ borderColor: "#E3E9F6" }}>
                    {r.title && <p className="text-sm font-semibold mb-1" style={{ color: "#111827" }}>{r.title}</p>}
                    <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>{r.content}</p>
                    {r.source && <p className="text-xs mt-2 font-medium" style={{ color: "#9CA3AF" }}>Source: {r.source}</p>}
                    {r.score != null && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="h-1 flex-1 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.round(r.score * 100)}%`, background: "#4A57B9" }} />
                        </div>
                        <span className="text-xs" style={{ color: "#9CA3AF" }}>{Math.round(r.score * 100)}% match</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {data.results?.length === 0 && (
            <Card>
              <div className="text-center py-6">
                <Search className="w-8 h-8 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
                <p className="text-sm font-medium" style={{ color: "#9CA3AF" }}>No results found for "{submitted}"</p>
                <p className="text-xs mt-1" style={{ color: "#D1D5DB" }}>Try indexing knowledge documents first via the Knowledge Sources section.</p>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

type TabId = "dashboard" | "assistant" | "risk-predictions" | "compliance-intelligence" | "safety-recommendations" | "trend-analysis" | "benchmarking" | "knowledge-search";

const TABS: { id: TabId; label: string; icon: typeof Brain }[] = [
  { id: "dashboard",               label: "AI Dashboard",          icon: Brain },
  { id: "assistant",               label: "AI Assistant",          icon: MessageSquare },
  { id: "risk-predictions",        label: "Risk Predictions",      icon: ShieldAlert },
  { id: "compliance-intelligence", label: "Compliance Intelligence", icon: CheckCircle2 },
  { id: "safety-recommendations",  label: "Safety Recommendations", icon: Zap },
  { id: "trend-analysis",          label: "Trend Analysis",        icon: BarChart2 },
  { id: "benchmarking",            label: "Benchmarking",          icon: BarChart3 },
  { id: "knowledge-search",        label: "AI Knowledge Search",   icon: FileSearch },
];

export function AIIntelligencePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") ?? "dashboard") as TabId;

  function setTab(id: TabId) {
    setSearchParams({ tab: id });
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>AI Intelligence</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Azure AI Foundry-powered safety intelligence and analytics</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={tab === id
              ? { background: "#4A57B9", color: "#fff", boxShadow: "0 4px 10px rgba(74,87,185,0.25)" }
              : { background: "#F3F4F6", color: "#6B7280" }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "dashboard"               && <AiDashboardTab />}
      {tab === "assistant"               && <AiAssistantTab />}
      {tab === "risk-predictions"        && <RiskPredictionsTab />}
      {tab === "compliance-intelligence" && <ComplianceIntelligenceTab />}
      {tab === "safety-recommendations"  && <SafetyRecommendationsTab />}
      {tab === "trend-analysis"          && <TrendAnalysisTab />}
      {tab === "benchmarking"            && <BenchmarkingTab />}
      {tab === "knowledge-search"        && <KnowledgeSearchTab />}
    </div>
  );
}
