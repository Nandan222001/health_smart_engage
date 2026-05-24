import { useState } from "react";
import {
  Search,
  BookOpen,
  Code2,
  ShieldCheck,
  FileText,
  PlayCircle,
  Mail,
  Phone,
  MessageCircle,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Ticket,
  HelpCircle,
} from "lucide-react";

type TabId = "Help Center" | "Documentation" | "Raise Ticket" | "Contact Support";

const TABS: TabId[] = ["Help Center", "Documentation", "Raise Ticket", "Contact Support"];

// ── Help Center ─────────────────────────────────────────────────────────────

interface FAQCard {
  title: string;
  description: string;
}

const FAQ_CARDS: FAQCard[] = [
  {
    title: "Getting Started",
    description: "Learn how to set up your organisation, invite team members, and configure your first safety workflow in HealthSmart Engage.",
  },
  {
    title: "Managing Permits",
    description: "Understand how to create, approve, and track permits-to-work including hot work, confined space entry, and electrical permits.",
  },
  {
    title: "Setting Up Workflows",
    description: "Configure automated approval workflows, notification rules, and escalation paths for incidents, permits, and audits.",
  },
  {
    title: "User Roles & Access",
    description: "Discover how to assign roles such as Admin, Site Manager, Site Inspector, and Worker and control access to different modules.",
  },
  {
    title: "Incident Reporting",
    description: "Step-by-step guide to logging incidents, near misses, and hazards — including photo attachments and CAPA assignment.",
  },
  {
    title: "AI Features",
    description: "Explore predictive risk scoring, AI-generated compliance reports, and intelligent recommendations powered by the HSE AI engine.",
  },
];

// ── Documentation ───────────────────────────────────────────────────────────

interface DocSection {
  title: string;
  description: string;
  icon: typeof BookOpen;
  color: string;
}

const DOC_SECTIONS: DocSection[] = [
  { title: "User Guide", description: "Complete walkthrough of all platform features and modules for end users.", icon: BookOpen, color: "#4A57B9" },
  { title: "API Reference", description: "Full REST API documentation with endpoints, parameters, and example responses.", icon: Code2, color: "#10B981" },
  { title: "Admin Manual", description: "In-depth guide for organisation administrators covering configuration and governance.", icon: ShieldCheck, color: "#F59E0B" },
  { title: "Release Notes", description: "Changelog of features, improvements, and bug fixes for every platform version.", icon: FileText, color: "#6B7280" },
  { title: "Video Tutorials", description: "Library of short video tutorials covering key workflows and new feature walkthroughs.", icon: PlayCircle, color: "#EF4444" },
];

// ── Raise Ticket ────────────────────────────────────────────────────────────

type Category = "Technical" | "Account" | "Billing" | "Feature Request" | "Other";
type Priority = "Low" | "Medium" | "High";

const CATEGORIES: Category[] = ["Technical", "Account", "Billing", "Feature Request", "Other"];
const PRIORITIES: Priority[] = ["Low", "Medium", "High"];

const PRIORITY_STYLES: Record<Priority, { bg: string; color: string }> = {
  Low: { bg: "#D1FAE5", color: "#10B981" },
  Medium: { bg: "#FEF3C7", color: "#F59E0B" },
  High: { bg: "#FEE2E2", color: "#EF4444" },
};

interface TicketForm {
  subject: string;
  category: Category;
  priority: Priority;
  description: string;
}

const EMPTY_TICKET: TicketForm = {
  subject: "",
  category: "Technical",
  priority: "Medium",
  description: "",
};

// ── Contact Support ─────────────────────────────────────────────────────────

interface ContactCard {
  title: string;
  detail: string;
  icon: typeof Mail;
  color: string;
  action?: string;
}

const CONTACT_CARDS: ContactCard[] = [
  { title: "Email Support", detail: "support@hse.com", icon: Mail, color: "#4A57B9", action: "Send Email" },
  { title: "Phone", detail: "+1 800 HSE HELP", icon: Phone, color: "#10B981", action: "Call Now" },
  { title: "Live Chat", detail: "Available 9am – 6pm GMT", icon: MessageCircle, color: "#F59E0B", action: "Start Chat" },
  { title: "Emergency Line", detail: "24/7 critical incident support", icon: AlertCircle, color: "#EF4444", action: "Call Emergency" },
];

// ── Main Page ───────────────────────────────────────────────────────────────

export function HelpPage() {
  const [activeTab, setActiveTab] = useState<TabId>("Help Center");
  const [helpSearch, setHelpSearch] = useState("");
  const [ticket, setTicket] = useState<TicketForm>(EMPTY_TICKET);
  const [submitted, setSubmitted] = useState(false);

  const filteredFaqs = FAQ_CARDS.filter(
    (faq) =>
      helpSearch.trim() === "" ||
      faq.title.toLowerCase().includes(helpSearch.toLowerCase()) ||
      faq.description.toLowerCase().includes(helpSearch.toLowerCase()),
  );

  function handleSubmitTicket() {
    if (!ticket.subject.trim() || !ticket.description.trim()) return;
    setSubmitted(true);
    setTicket(EMPTY_TICKET);
    setTimeout(() => setSubmitted(false), 4000);
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#EEF2FF" }}>
          <HelpCircle className="w-6 h-6" style={{ color: "#4A57B9" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Help & Support</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>Find answers, raise tickets, and get in touch with our team</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl border p-1 w-fit flex-wrap" style={{ borderColor: "#E3E9F6" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={
              activeTab === tab
                ? { background: "linear-gradient(135deg, #4A57B9, #6F80E8)", color: "#fff" }
                : { color: "#6B7280" }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Help Center ── */}
      {activeTab === "Help Center" && (
        <div className="space-y-5">
          {/* Search */}
          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
            <input
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: "#E3E9F6", background: "#F9FAFB" }}
              placeholder="Search help articles..."
              value={helpSearch}
              onChange={(e) => setHelpSearch(e.target.value)}
            />
          </div>

          {/* FAQ Grid */}
          {filteredFaqs.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: "#6B7280" }}>No articles match your search.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredFaqs.map((faq) => (
                <div key={faq.title} className="bg-white rounded-2xl border p-5 space-y-2 hover:shadow-sm transition-shadow" style={{ borderColor: "#E3E9F6" }}>
                  <h3 className="text-[15px] font-bold" style={{ color: "#111827" }}>{faq.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{faq.description}</p>
                  <button
                    className="inline-flex items-center gap-1 text-sm font-semibold mt-1 transition-opacity hover:opacity-75"
                    style={{ color: "#4A57B9" }}
                  >
                    Read More <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Documentation ── */}
      {activeTab === "Documentation" && (
        <div className="space-y-3">
          {DOC_SECTIONS.map((doc) => {
            const Icon = doc.icon;
            return (
              <div
                key={doc.title}
                className="bg-white rounded-2xl border p-5 flex items-center gap-4"
                style={{ borderColor: "#E3E9F6" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: doc.color + "18" }}
                >
                  <Icon className="w-5 h-5" style={{ color: doc.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-bold" style={{ color: "#111827" }}>{doc.title}</h3>
                  <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>{doc.description}</p>
                </div>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
                >
                  View <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Raise Ticket ── */}
      {activeTab === "Raise Ticket" && (
        <div className="bg-white rounded-2xl border p-5 max-w-2xl" style={{ borderColor: "#E3E9F6" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#EEF2FF" }}>
              <Ticket className="w-5 h-5" style={{ color: "#4A57B9" }} />
            </div>
            <h2 className="text-[15px] font-bold" style={{ color: "#111827" }}>Raise a Support Ticket</h2>
          </div>

          {submitted && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: "#D1FAE5", color: "#10B981" }}>
              <ShieldCheck className="w-4 h-4" />
              Your ticket has been submitted. We'll respond within 24 hours.
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: "#374151" }}>Subject</label>
              <input
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#E3E9F6" }}
                placeholder="Brief summary of the issue"
                value={ticket.subject}
                onChange={(e) => setTicket((t) => ({ ...t, subject: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold" style={{ color: "#374151" }}>Category</label>
                <select
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none bg-white"
                  style={{ borderColor: "#E3E9F6" }}
                  value={ticket.category}
                  onChange={(e) => setTicket((t) => ({ ...t, category: e.target.value as Category }))}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold" style={{ color: "#374151" }}>Priority</label>
                <div className="flex items-center gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      onClick={() => setTicket((t) => ({ ...t, priority: p }))}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors"
                      style={
                        ticket.priority === p
                          ? { background: PRIORITY_STYLES[p].bg, color: PRIORITY_STYLES[p].color, borderColor: PRIORITY_STYLES[p].color }
                          : { borderColor: "#E3E9F6", color: "#6B7280" }
                      }
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: "#374151" }}>Description</label>
              <textarea
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                style={{ borderColor: "#E3E9F6" }}
                rows={5}
                placeholder="Describe the issue in detail..."
                value={ticket.description}
                onChange={(e) => setTicket((t) => ({ ...t, description: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: "#374151" }}>Attachments (optional)</label>
              <input
                type="file"
                multiple
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#E3E9F6" }}
              />
            </div>

            <button
              onClick={handleSubmitTicket}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
            >
              Submit Ticket
            </button>
          </div>
        </div>
      )}

      {/* ── Contact Support ── */}
      {activeTab === "Contact Support" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CONTACT_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: "#E3E9F6" }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: card.color + "18" }}
                  >
                    <Icon className="w-5 h-5" style={{ color: card.color }} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold" style={{ color: "#111827" }}>{card.title}</h3>
                    <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>{card.detail}</p>
                  </div>
                </div>
                {card.action && (
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold w-full justify-center"
                    style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
                  >
                    {card.action}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
