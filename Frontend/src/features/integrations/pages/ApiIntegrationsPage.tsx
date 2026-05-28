import { Plug } from "lucide-react";

export function ApiIntegrationsPage() {
  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>API Integrations</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
          Connect external systems and manage API integrations
        </p>
      </div>
      <div
        className="flex flex-col items-center justify-center rounded-2xl border py-20"
        style={{ borderColor: "#E3E9F6", background: "#F8FAFF" }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "#EEF2FB" }}
        >
          <Plug className="w-7 h-7" style={{ color: "#4A57B9" }} />
        </div>
        <p className="text-base font-semibold" style={{ color: "#111827" }}>
          No integrations configured
        </p>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
          API integration management coming soon.
        </p>
      </div>
    </div>
  );
}
