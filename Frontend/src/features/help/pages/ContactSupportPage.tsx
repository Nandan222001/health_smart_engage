import { useState } from "react";
import {
  Mail,
  Phone,
  MessageCircle,
  Wrench,
  ChevronRight,
  ShieldCheck,
  Clock,
  ExternalLink,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router";

const SUPPORT_CHANNELS = [
  {
    title: "Live Chat",
    description: "Average response time: < 2 minutes",
    icon: MessageCircle,
    color: "#4A57B9",
    action: "Start Live Chat",
    availability: "Available 24/7 for Enterprise Admins"
  },
  {
    title: "Email Support",
    description: "support@hse-intelligence.com",
    icon: Mail,
    color: "#10B981",
    action: "Send Message",
    availability: "Response within 4 business hours"
  },
  {
    title: "Call Support",
    description: "+1 (800) HSE-HELP-LINE",
    icon: Phone,
    color: "#F59E0B",
    action: "Call Now",
    availability: "Mon-Fri, 9:00 AM - 6:00 PM EST"
  },
  {
    title: "Technical Assistance",
    description: "For API, integration or system issues",
    icon: Wrench,
    color: "#7C3AED",
    action: "Open Tech Ticket",
    availability: "Expert engineering support"
  }
];

export function ContactSupportPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen pb-20" style={{ background: "#F8FAFC" }}>
      {/* ── Header ── */}
      <div className="px-8 pt-8 pb-12" style={{ background: "linear-gradient(135deg, #0C1A3D 0%, #1A2F6B 100%)" }}>
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-6 text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back to Help Center
        </button>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Contact HSE Support</h1>
            <p className="text-blue-100/70 text-lg max-w-2xl">
              As an Organisation Administrator, you have priority access to our global support network. 
              Choose your preferred channel below.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="text-emerald-400" size={20} />
            </div>
            <div>
              <p className="text-white text-xs font-bold uppercase tracking-wider">Priority Status</p>
              <p className="text-blue-200 text-sm">Enterprise Support Active</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SUPPORT_CHANNELS.map((channel) => {
            const Icon = channel.icon;
            return (
              <div key={channel.title} className="bg-white rounded-3xl border p-6 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full" style={{ borderColor: "#E2E8F0" }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110" style={{ background: channel.color + "10" }}>
                  <Icon size={28} style={{ color: channel.color }} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{channel.title}</h3>
                <p className="text-sm text-slate-600 mb-4 flex-grow">{channel.description}</p>
                
                <div className="pt-4 border-t border-slate-50 mt-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock size={14} className="text-slate-400" />
                    <span className="text-[11px] font-medium text-slate-500">{channel.availability}</span>
                  </div>
                  <button 
                    className="w-full py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 group-hover:shadow-lg transition-all"
                    style={{ background: "linear-gradient(135deg, " + channel.color + ", " + channel.color + "DD)" }}
                  >
                    {channel.action}
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Support Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl border p-8 shadow-sm" style={{ borderColor: "#E2E8F0" }}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Mail className="text-blue-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Send a Quick Message</h2>
                <p className="text-sm text-slate-500">Not urgent? Describe your issue and we'll get back to you.</p>
              </div>
            </div>

            {submitted ? (
              <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                  <ShieldCheck size={40} className="text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Request Sent Successfully</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Thank you for contacting us. Your ticket ID is <strong>#HSE-882-99</strong>. 
                  An email confirmation has been sent to your registered address.
                </p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="mt-4 px-8 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</label>
                    <select className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-sm focus:border-blue-500 transition-colors bg-slate-50">
                      <option>General Inquiry</option>
                      <option>Technical Issue</option>
                      <option>Billing & Subscription</option>
                      <option>Feature Request</option>
                      <option>Feedback</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Urgency</label>
                    <select className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-sm focus:border-blue-500 transition-colors bg-slate-50">
                      <option>Low - Just a question</option>
                      <option>Medium - Affecting workflow</option>
                      <option>High - Critical blocker</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Detailed Description</label>
                  <textarea 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-sm focus:border-blue-500 transition-colors bg-slate-50 min-h-[150px]"
                    placeholder="Please provide as much detail as possible..."
                  />
                </div>
                <div className="flex items-center justify-end">
                  <button 
                    onClick={() => setSubmitted(true)}
                    className="px-10 py-4 rounded-xl text-white font-bold shadow-lg shadow-blue-200 hover:scale-[1.02] transition-all"
                    style={{ background: "linear-gradient(135deg, #1E3A5F, #1D4ED8)" }}
                  >
                    Submit Priority Request
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl" />
              <h3 className="text-xl font-bold mb-4 relative z-10">Admin Knowledge Base</h3>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed relative z-10">
                Browse our administrator-specific documentation for troubleshooting common configuration issues.
              </p>
              <button className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold border border-white/10 flex items-center justify-center gap-2 transition-all">
                Search Articles <ExternalLink size={14} />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-3xl p-8">
              <h3 className="text-lg font-bold text-blue-900 mb-4">System Status</h3>
              <div className="space-y-4">
                {[
                  { name: "Global API", status: "Operational", color: "#10B981" },
                  { name: "Data Processing", status: "Operational", color: "#10B981" },
                  { name: "AI Insight Engine", status: "Maintenance", color: "#F59E0B" }
                ].map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-bold" style={{ color: item.color }}>{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-2 text-blue-600 text-xs font-bold uppercase tracking-widest hover:text-blue-800 transition-colors">
                View Full Status Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
