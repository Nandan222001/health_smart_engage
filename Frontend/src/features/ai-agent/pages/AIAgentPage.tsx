import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, Bot, BrainCircuit, ClipboardList, FileText,
  History, Lightbulb, Lock, Mic, Search, Send, Sparkles,
  TrendingUp, Zap, RefreshCw, MessageSquare, Shield,
} from 'lucide-react';
import { Link } from 'react-router';
import { chatWithAIAgent, type ChatMessage } from '@/services/aiService';
import { getOnboardingAccessProfile, getViolations, getZones } from '@/services/api';
import { FormattedMessage } from '@/shared/components/common/FormattedMessage';
import { useAuth } from '@/app/context/AuthContext';

// ── Types ────────────────────────────────────────────────────────────────────

type UiMessage = {
  role: 'user' | 'ai';
  content: string;
  loading?: boolean;
  suggestions?: string[];
};

// ── Constants ────────────────────────────────────────────────────────────────

const STARTER_SUGGESTIONS = [
  'Show high-risk sites',
  'Which department has most incidents?',
  'Suggest CAPA for repeated incidents',
];

const ASSISTANT_ACTIONS = [
  {
    title: 'Ask Safety Questions',
    description: 'Get direct answers for HSE, risk, compliance, and site safety queries.',
    icon: Bot,
    color: '#1D4ED8',
    bg: '#EFF6FF',
    prompt: 'Show high-risk sites',
  },
  {
    title: 'Search SOPs',
    description: 'Find procedures, safe work instructions, and policy references quickly.',
    icon: Search,
    color: '#7C3AED',
    bg: '#F5F3FF',
    prompt: 'Search SOPs for high-risk work controls',
  },
  {
    title: 'Query Incident History',
    description: 'Review repeated incidents, departments, locations, and trends.',
    icon: History,
    color: '#DC2626',
    bg: '#FEF2F2',
    prompt: 'Which department has most incidents?',
  },
  {
    title: 'Get AI Recommendations',
    description: 'Generate practical controls, CAPA ideas, and prevention actions.',
    icon: Lightbulb,
    color: '#D97706',
    bg: '#FFFBEB',
    prompt: 'Suggest CAPA for repeated incidents',
  },
  {
    title: 'Generate Reports',
    description: 'Create summaries for leadership, site teams, audits, and reviews.',
    icon: FileText,
    color: '#059669',
    bg: '#ECFDF5',
    prompt: 'Generate a weekly incident report summary',
  },
];

const RISK_COLORS: Record<string, string> = {
  Critical: '#DC2626',
  High:     '#EA580C',
  Medium:   '#D97706',
  Low:      '#16A34A',
};

const RISK_BG: Record<string, string> = {
  Critical: '#FEE2E2',
  High:     '#FFEDD5',
  Medium:   '#FEF3C7',
  Low:      '#DCFCE7',
};

// ── Hero Stat (banner) ────────────────────────────────────────────────────────

function HeroStat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex-1 px-6 py-4 text-center">
      <div className="text-[26px] font-black text-white leading-none" style={color ? { color } : undefined}>
        {value}
      </div>
      <div className="text-[11px] font-semibold mt-1 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {label}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function AIAgentPage() {
  const { subscriptionPlan, user, setSubscriptionPlan, canAccessModuleLabel } = useAuth();
  const [effectivePlan, setEffectivePlan] = useState(subscriptionPlan);
  const [activeTab, setActiveTab] = useState<'chat' | 'predictive' | 'whatif'>('chat');
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [sessionStats, setSessionStats] = useState({ queries: 0, sops: 0, incidents: 0, reports: 0 });

  const [messages, setMessages] = useState<UiMessage[]>(() => {
    const orgLabel = user?.companyName?.trim() || user?.orgCode?.trim() || 'your organization';
    return [
      {
        role: 'ai',
        content: `Hello! I'm your HSE AI assistant for **${orgLabel}**. Ask safety questions, search SOPs, query incident history, get AI recommendations, or generate reports.`,
        suggestions: STARTER_SUGGESTIONS,
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const orgLabel = user?.companyName?.trim() || user?.orgCode?.trim() || 'your organization';
  const isLocked = Boolean(user?.onboardingScoped) && !canAccessModuleLabel('AI Agent');

  const predictiveCards = useMemo(
    () => [
      { zone: 'Highest Risk Zone', risk: 'Critical', predicted: 12, confidence: 94 },
      { zone: 'Second Risk Zone',  risk: 'High',     predicted: 8,  confidence: 87 },
      { zone: 'Watchlist Zone',    risk: 'Medium',   predicted: 5,  confidence: 79 },
    ],
    [],
  );

  const insightCards = useMemo(
    () => [
      { text: `Recent safety training in ${orgLabel} is correlated with fewer incidents`, metric: '67% reduction', color: '#059669' },
      { text: 'Peak violation window is 10:00–11:00 AM',                                 metric: '32% of daily total', color: '#D97706' },
      { text: 'One high-risk zone contributes the largest critical-violation share',      metric: '38% concentration', color: '#DC2626' },
    ],
    [orgLabel],
  );

  // ── Side-effects ──────────────────────────────────────────────────────────

  useEffect(() => { setEffectivePlan(subscriptionPlan); }, [subscriptionPlan]);

  useEffect(() => {
    if (!user?.email || !user?.onboardingScoped) return;
    let cancelled = false;
    const refreshPlan = async () => {
      try {
        let profile = await getOnboardingAccessProfile(user.email, user.orgCode);
        if (!profile?.found && user.orgCode) profile = await getOnboardingAccessProfile(user.email);
        const raw = String(profile?.subscription_plan || '').trim().toLowerCase();
        const normalized = raw.includes('pro') ? 'Pro' : raw.includes('enterprise') ? 'Enterprise' : raw.includes('free') ? 'Free' : null;
        if (!cancelled && normalized) {
          setEffectivePlan(normalized);
          if (normalized !== subscriptionPlan) setSubscriptionPlan(normalized);
        }
      } catch { /* silent */ }
    };
    refreshPlan();
    return () => { cancelled = true; };
  }, [user?.email, user?.orgCode, user?.onboardingScoped, subscriptionPlan, setSubscriptionPlan]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SR();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.onresult = (e: any) => { setInput(e.results[0][0].transcript || ''); setIsListening(false); };
    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.onend   = () => setIsListening(false);
    return () => { if (recognitionRef.current) recognitionRef.current.stop(); };
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const buildContextPrompt = async (question: string) => {
    try {
      const [violations, zones] = await Promise.all([getViolations(), getZones()]);
      return [
        'You are an HSE intelligence assistant. Use the context below to answer precisely.',
        `Organization: ${orgLabel}`,
        `Total Violations: ${violations.length}`,
        `Critical Violations: ${violations.filter((v: any) => v.Severity === 'Critical').length}`,
        `Total Zones: ${zones.length}`,
        `High Risk Zones: ${zones.filter((z: any) => z.Risk_Score > 70).length}`,
        `User Question: ${question}`,
      ].join('\n');
    } catch {
      return ['You are an HSE intelligence assistant.', `Organization: ${orgLabel}`, `User Question: ${question}`].join('\n');
    }
  };

  const askAi = async (question: string) => {
    if (!question.trim() || isProcessing) return;
    setIsProcessing(true);
    setMessages((prev) => [...prev, { role: 'user', content: question }, { role: 'ai', content: '', loading: true }]);

    // update session stats
    const q = question.toLowerCase();
    setSessionStats((s) => ({
      queries:   s.queries + 1,
      sops:      s.sops      + (q.includes('sop') ? 1 : 0),
      incidents: s.incidents + (q.includes('incident') || q.includes('department') ? 1 : 0),
      reports:   s.reports   + (q.includes('report') || q.includes('generate') ? 1 : 0),
    }));

    try {
      const contextPrompt = await buildContextPrompt(question);
      const nextHistory: ChatMessage[] = [...conversationHistory, { role: 'user', content: contextPrompt }];
      const reply = await chatWithAIAgent(contextPrompt, conversationHistory);
      setConversationHistory([...nextHistory, { role: 'assistant', content: reply }]);
      setMessages((prev) => [
        ...prev.filter((m) => !m.loading),
        { role: 'ai', content: reply, suggestions: ['Search SOPs for this topic', 'Generate an incident report summary', 'Create CAPA recommendations'] },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev.filter((m) => !m.loading),
        { role: 'ai', content: `I couldn't complete this request: **${error?.message || 'AI request failed'}**. Please try again.` },
      ]);
    } finally {
      setIsProcessing(false);
      setInput('');
    }
  };

  const handleMicClick = () => {
    if (!recognitionRef.current || isProcessing) return;
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); return; }
    recognitionRef.current.start();
    setIsListening(true);
  };

  // ── Tabs config ───────────────────────────────────────────────────────────

  const TABS = [
    { id: 'chat',       label: 'AI Chat',            icon: MessageSquare },
    { id: 'predictive', label: 'AI Recommendations', icon: BrainCircuit  },
    { id: 'whatif',     label: 'Generate Reports',   icon: FileText      },
  ] as const;

  // ── Locked screen ─────────────────────────────────────────────────────────

  if (isLocked) {
    return (
      <div className="min-h-screen" style={{ background: '#F5F7FF' }}>
        {/* Banner */}
        <div style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1D4ED8 100%)' }}>
          <div className="px-8 pt-8 pb-6">
            <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Intelligence
            </p>
            <h1 className="text-[26px] font-black text-white">AI Assistant</h1>
            <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Safety questions · SOP search · Incident history · Recommendations · Reports
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-24 px-6">
          <div className="bg-white rounded-2xl border p-10 text-center max-w-md" style={{ borderColor: '#E3E9F6' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: '#EFF6FF' }}>
              <Lock className="w-8 h-8" style={{ color: '#1D4ED8' }} />
            </div>
            <h2 className="text-[20px] font-black mb-2" style={{ color: '#111827' }}>Pro & Enterprise Only</h2>
            <p className="text-[13px] mb-8" style={{ color: '#6B7280' }}>
              Upgrade your plan to unlock AI safety questions, SOP search, incident history queries, recommendations, and report generation.
            </p>
            <Link
              to="/subscription"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #0B3D91, #3B82F6)' }}
            >
              <Sparkles className="w-4 h-4" />
              View Subscription Plans
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: '#F5F7FF' }}>

      {/* ── Banner ─────────────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1D4ED8 100%)' }}>
        <div className="px-8 pt-8 pb-0">
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Intelligence
          </p>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-[26px] font-black text-white">AI Assistant</h1>
              <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Safety questions · SOP search · Incident history · Recommendations · Reports
              </p>
            </div>
            <span
              className="mt-1 px-3 py-1 rounded-full text-[11px] uppercase font-bold"
              style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              {effectivePlan || 'Pro'} Plan
            </span>
          </div>
        </div>

        {/* Hero stats */}
        <div className="flex border-t mt-6 divide-x" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
          <HeroStat label="Queries Asked"      value={sessionStats.queries}   color="#93C5FD" />
          <HeroStat label="SOPs Searched"      value={sessionStats.sops}      color="#A5B4FC" />
          <HeroStat label="Incidents Analysed" value={sessionStats.incidents} color="#FCD34D" />
          <HeroStat label="Reports Generated"  value={sessionStats.reports}   color="#6EE7B7" />
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="p-6 space-y-5">

        {/* Tab bar */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-all"
                style={active
                  ? { background: '#1D4ED8', color: '#fff', boxShadow: '0 4px 12px rgba(29,78,216,0.25)' }
                  : { background: '#fff', color: '#6B7280', border: '1px solid #E3E9F6' }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}

          <div className="ml-auto flex-shrink-0">
            <button
              onClick={() => {
                setMessages([{
                  role: 'ai',
                  content: `Hello! I'm your HSE AI assistant for **${orgLabel}**. Ask safety questions, search SOPs, query incident history, get AI recommendations, or generate reports.`,
                  suggestions: STARTER_SUGGESTIONS,
                }]);
                setConversationHistory([]);
                setInput('');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] font-semibold bg-white transition-colors hover:bg-gray-50"
              style={{ borderColor: '#E3E9F6', color: '#6B7280' }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              New Chat
            </button>
          </div>
        </div>

        {/* ── Chat Tab ─────────────────────────────────────────────────────── */}
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-10 xl:gap-6 xl:items-start">

            {/* Left column */}
            <div className="space-y-4 xl:col-span-3">

              {/* Admin Can Do */}
              <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E3E9F6' }}>
                <div className="px-5 py-4 border-b" style={{ background: 'linear-gradient(135deg, #0B3D91, #1D4ED8)', borderColor: 'transparent' }}>
                  <div className="flex items-center gap-2 text-white">
                    <ClipboardList className="w-4 h-4" />
                    <span className="text-[13px] font-bold">Admin Can Do</span>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {ASSISTANT_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.title}
                        onClick={() => askAi(action.prompt)}
                        className="flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all hover:shadow-sm"
                        style={{ borderColor: '#E3E9F6' }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = action.color + '40')}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E3E9F6')}
                      >
                        <span
                          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                          style={{ background: action.bg }}
                        >
                          <Icon className="h-4 w-4" style={{ color: action.color }} />
                        </span>
                        <span>
                          <span className="block text-[13px] font-bold" style={{ color: '#111827' }}>{action.title}</span>
                          <span className="block text-[11px] leading-5 mt-0.5" style={{ color: '#9CA3AF' }}>{action.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Example Queries */}
              <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E3E9F6' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#FFFBEB' }}>
                    <Lightbulb className="w-4 h-4" style={{ color: '#D97706' }} />
                  </div>
                  <span className="text-[13px] font-bold" style={{ color: '#111827' }}>Example Queries</span>
                </div>
                <div className="space-y-2">
                  {STARTER_SUGGESTIONS.map((query) => (
                    <button
                      key={query}
                      onClick={() => askAi(query)}
                      className="w-full rounded-xl border px-3 py-2.5 text-left text-[12px] font-semibold transition-colors hover:bg-blue-50"
                      style={{ borderColor: '#DBE7FF', color: '#1D4ED8' }}
                    >
                      "{query}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Predicted High Risk */}
              <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E3E9F6' }}>
                <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: '#F3F4F6' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#FEE2E2' }}>
                      <AlertTriangle className="w-4 h-4" style={{ color: '#DC2626' }} />
                    </div>
                    <div>
                      <h3 className="text-[13px] font-bold" style={{ color: '#111827' }}>Predicted High Risk</h3>
                      <p className="text-[11px]" style={{ color: '#9CA3AF' }}>AI-forecasted risk zones</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {predictiveCards.map((risk) => (
                    <div key={risk.zone} className="rounded-xl border p-3" style={{ borderColor: RISK_COLORS[risk.risk] + '30', background: RISK_BG[risk.risk] + '40' }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[13px] font-semibold" style={{ color: '#111827' }}>{risk.zone}</span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] uppercase font-bold"
                          style={{ background: RISK_BG[risk.risk], color: RISK_COLORS[risk.risk] }}
                        >
                          {risk.risk}
                        </span>
                      </div>
                      <p className="text-[11px] mb-2" style={{ color: '#9CA3AF' }}>~{risk.predicted} predicted violations</p>
                      <div className="w-full rounded-full h-1.5" style={{ background: '#E5E7EB' }}>
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{ width: `${risk.confidence}%`, background: RISK_COLORS[risk.risk] }}
                        />
                      </div>
                      <p className="text-[10px] mt-1 text-right" style={{ color: '#9CA3AF' }}>{risk.confidence}% confidence</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat panel */}
            <div
              className="bg-white rounded-2xl border flex flex-col xl:col-span-7"
              style={{ borderColor: '#E3E9F6', minHeight: 560, maxHeight: 'calc(100vh - 280px)' }}
            >
              {/* Chat header */}
              <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: '#E3E9F6' }}>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #0B3D91, #1D4ED8)' }}
                >
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <span className="text-[14px] font-bold" style={{ color: '#111827' }}>HSE AI Assistant</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[11px]" style={{ color: '#9CA3AF' }}>Online · Ready to assist</span>
                  </div>
                </div>
                <span
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase"
                  style={{ background: '#EFF6FF', color: '#1D4ED8' }}
                >
                  AI Powered
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'ai' && (
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center mr-2 mt-0.5 flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #0B3D91, #1D4ED8)' }}
                      >
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="max-w-[80%]">
                      <div
                        className="rounded-2xl px-4 py-3 text-[13px]"
                        style={
                          msg.role === 'user'
                            ? { background: 'linear-gradient(135deg, #0B3D91, #1D4ED8)', color: '#fff', borderRadius: '18px 18px 4px 18px' }
                            : { background: '#F8FAFF', border: '1px solid #E3E9F6', color: '#111827', borderRadius: '4px 18px 18px 18px' }
                        }
                      >
                        {msg.loading ? (
                          <div className="flex items-center gap-1.5 py-1">
                            {[0, 150, 300].map((delay) => (
                              <div key={delay} className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#1D4ED8', animationDelay: `${delay}ms` }} />
                            ))}
                          </div>
                        ) : (
                          <FormattedMessage content={msg.content} isAI={msg.role === 'ai'} />
                        )}
                      </div>

                      {msg.suggestions && !msg.loading && (
                        <div className="flex flex-wrap gap-2 mt-2 ml-1">
                          {msg.suggestions.map((s) => (
                            <button
                              key={s}
                              onClick={() => askAi(s)}
                              className="px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors hover:bg-blue-50"
                              style={{ borderColor: '#DBE7FF', color: '#1D4ED8' }}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center ml-2 mt-0.5 flex-shrink-0"
                        style={{ background: '#EFF6FF' }}
                      >
                        <Shield className="w-4 h-4" style={{ color: '#1D4ED8' }} />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div className="px-6 py-4 border-t" style={{ borderColor: '#E3E9F6' }}>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && askAi(input)}
                      placeholder="Ask safety questions, search SOPs, query incidents, or generate reports…"
                      className="w-full h-11 pl-4 pr-4 rounded-xl border text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-100"
                      style={{ borderColor: '#E3E9F6', background: '#F9FAFB' }}
                    />
                  </div>
                  <button
                    onClick={handleMicClick}
                    disabled={isProcessing}
                    className="w-11 h-11 rounded-xl flex items-center justify-center border transition-colors"
                    style={{
                      borderColor: isListening ? '#1D4ED8' : '#E3E9F6',
                      background: isListening ? '#EFF6FF' : '#fff',
                    }}
                    title="Voice input"
                  >
                    <Mic className="w-4 h-4" style={{ color: isListening ? '#1D4ED8' : '#9CA3AF' }} />
                  </button>
                  <button
                    onClick={() => askAi(input)}
                    disabled={isProcessing || !input.trim()}
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white transition-opacity"
                    style={{ background: 'linear-gradient(135deg, #0B3D91, #1D4ED8)', opacity: isProcessing || !input.trim() ? 0.45 : 1 }}
                    title="Send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-center" style={{ color: '#D1D5DB' }}>
                  AI responses are generated based on your organisation's HSE data.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Recommendations Tab ───────────────────────────────────────────── */}
        {activeTab === 'predictive' && (
          <div className="space-y-5">
            {/* Section heading */}
            <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E3E9F6' }}>
              <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: '#F3F4F6' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                    <BrainCircuit className="w-5 h-5" style={{ color: '#1D4ED8' }} />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-bold" style={{ color: '#111827' }}>AI Risk Predictions</h2>
                    <p className="text-[12px]" style={{ color: '#9CA3AF' }}>Predictive analysis of high-risk zones and violation probabilities</p>
                  </div>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                {predictiveCards.map((risk) => (
                  <div key={risk.zone} className="rounded-2xl border p-5 flex flex-col gap-3"
                    style={{ borderColor: RISK_COLORS[risk.risk] + '30', background: RISK_BG[risk.risk] + '40' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-bold" style={{ color: '#111827' }}>{risk.zone}</span>
                      <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase"
                        style={{ background: RISK_BG[risk.risk], color: RISK_COLORS[risk.risk] }}>
                        {risk.risk}
                      </span>
                    </div>
                    <div>
                      <div className="text-[28px] font-black leading-none" style={{ color: '#111827' }}>{risk.predicted}</div>
                      <div className="text-[12px] mt-0.5" style={{ color: '#6B7280' }}>predicted violations</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px]" style={{ color: '#9CA3AF' }}>Confidence</span>
                        <span className="text-[12px] font-bold" style={{ color: RISK_COLORS[risk.risk] }}>{risk.confidence}%</span>
                      </div>
                      <div className="w-full rounded-full h-2" style={{ background: '#E5E7EB' }}>
                        <div className="h-2 rounded-full transition-all"
                          style={{ width: `${risk.confidence}%`, background: RISK_COLORS[risk.risk] }} />
                      </div>
                    </div>
                    <button
                      onClick={() => { setActiveTab('chat'); askAi(`Get AI recommendations for ${risk.zone.toLowerCase()}`); }}
                      className="mt-auto flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold transition-colors"
                      style={{ background: RISK_COLORS[risk.risk] + '12', color: RISK_COLORS[risk.risk] }}
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      Get Recommendations
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E3E9F6' }}>
              <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: '#F3F4F6' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#FFFBEB' }}>
                    <TrendingUp className="w-5 h-5" style={{ color: '#D97706' }} />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold" style={{ color: '#111827' }}>Safety Insights</h2>
                    <p className="text-[11px]" style={{ color: '#9CA3AF' }}>AI-generated observations from your HSE data</p>
                  </div>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                {insightCards.map((ins, i) => (
                  <div key={i} className="rounded-2xl border p-4 flex flex-col gap-2" style={{ borderColor: '#E3E9F6' }}>
                    <div className="text-[22px] font-black leading-none" style={{ color: ins.color }}>{ins.metric}</div>
                    <p className="text-[12px]" style={{ color: '#6B7280' }}>{ins.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Reports Tab ───────────────────────────────────────────────────── */}
        {activeTab === 'whatif' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {/* Report Generator */}
              <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E3E9F6' }}>
                <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: '#F3F4F6' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FFFBEB' }}>
                      <Zap className="w-5 h-5" style={{ color: '#D97706' }} />
                    </div>
                    <div>
                      <h2 className="text-[15px] font-bold" style={{ color: '#111827' }}>Report Generator</h2>
                      <p className="text-[12px]" style={{ color: '#9CA3AF' }}>Generate audit-ready reports instantly</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  {[
                    { label: 'Weekly Incident Report',     prompt: 'Generate a weekly incident report summary with high-risk sites and repeated CAPA themes.' },
                    { label: 'Safety Compliance Report',   prompt: 'Generate a safety compliance report highlighting gaps and regulatory risks.' },
                    { label: 'CAPA Summary Report',        prompt: 'Generate a CAPA summary report with open actions and responsible parties.' },
                    { label: 'Executive Safety Briefing',  prompt: 'Generate an executive safety briefing for senior leadership with key metrics.' },
                  ].map(({ label, prompt }) => (
                    <button
                      key={label}
                      onClick={() => { setActiveTab('chat'); askAi(prompt); }}
                      className="w-full flex items-center gap-3 rounded-xl border p-4 text-left transition-all hover:shadow-sm hover:border-blue-200"
                      style={{ borderColor: '#E3E9F6' }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#EFF6FF' }}>
                        <FileText className="w-4 h-4" style={{ color: '#1D4ED8' }} />
                      </div>
                      <span className="text-[13px] font-semibold" style={{ color: '#111827' }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Queries */}
              <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E3E9F6' }}>
                <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: '#F3F4F6' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                      <TrendingUp className="w-5 h-5" style={{ color: '#1D4ED8' }} />
                    </div>
                    <div>
                      <h2 className="text-[15px] font-bold" style={{ color: '#111827' }}>Quick Analysis Queries</h2>
                      <p className="text-[12px]" style={{ color: '#9CA3AF' }}>Common questions to analyse your safety data</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  {[
                    'Show high-risk sites',
                    'Which department has most incidents?',
                    'Suggest CAPA for repeated incidents',
                    'What are the top hazard categories this month?',
                    'List all open corrective actions',
                    'Show compliance gaps across sites',
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => { setActiveTab('chat'); askAi(prompt); }}
                      className="w-full text-left px-4 py-3 rounded-xl border text-[13px] font-semibold transition-all hover:shadow-sm hover:border-blue-200"
                      style={{ borderColor: '#E3E9F6', color: '#1D4ED8' }}
                    >
                      "{prompt}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
