import { useState, useEffect } from "react";
import {
  Building2,
  Palette,
  Globe,
  Clock,
  LayoutGrid,
  Save,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import {
  useGetOrgAdminOverviewQuery,
  useSaveOrgSetupStep1Mutation,
  Step1Data
} from "@/features/org-setup/api/orgSetupApi";
import {
  useListOrganisationNodesQuery,
  useCreateOrganisationNodeMutation,
  useDeleteOrganisationNodeMutation
} from "@/features/admin/api/foundationApi";

export function OrganizationSettingsPage() {
  const [activeTab, setActiveTab] = useState("details");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Data fetching
  const { data: overview, isLoading: overviewLoading } = useGetOrgAdminOverviewQuery();
  const [saveDetails, { isLoading: isSaving }] = useSaveOrgSetupStep1Mutation();
  const { data: businessUnits = [], isLoading: buLoading } = useListOrganisationNodesQuery({ type: "business_unit" });
  const [createBU, { isLoading: isCreatingBU }] = useCreateOrganisationNodeMutation();
  const [deleteBU] = useDeleteOrganisationNodeMutation();

  // Form states
  const [detailsForm, setDetailsForm] = useState<Partial<Step1Data>>({});
  const [branding, setBranding] = useState({ primaryColor: "#4A57B9", logoUrl: "" });
  const [newBUName, setNewBUName] = useState("");

  useEffect(() => {
    if (overview) {
      setDetailsForm({
        organizationName: overview.orgName,
        officialEmail: overview.officialEmail,
        contactNumber: overview.contactNumber,
        country: overview.country,
        timezone: overview.timezone,
        headquartersAddress: overview.headquartersAddress,
        industryType: overview.industry,
      });
    }
  }, [overview]);

  const handleSaveDetails = async () => {
    try {
      setSaveError(null);
      await saveDetails(detailsForm).unwrap();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err?.data?.message || "Failed to save organization details");
    }
  };

  const handleAddBU = async () => {
    if (!newBUName.trim()) return;
    try {
      await createBU({ name: newBUName, node_type: "business_unit" }).unwrap();
      setNewBUName("");
    } catch (err) {
      console.error("Failed to create business unit", err);
    }
  };

  const tabs = [
    { id: "details", label: "Organization Details", icon: Building2 },
    { id: "branding", label: "Branding", icon: Palette },
    { id: "business-units", label: "Business Units", icon: LayoutGrid },
    { id: "localization", label: "Localization", icon: Globe },
  ];

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" style={{ background: "#F8FAFF", minHeight: "100vh" }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your organization's core identity and structure.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-64 flex flex-col gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-white text-blue-600 shadow-sm border border-blue-100"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-blue-600" : "text-gray-400"}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-2xl border p-8 shadow-sm" style={{ borderColor: "#E3E9F6" }}>
          {activeTab === "details" && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Organization Identity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Organization Name</label>
                  <input
                    type="text"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    style={{ borderColor: "#E3E9F6" }}
                    value={detailsForm.organizationName || ""}
                    onChange={(e) => setDetailsForm({ ...detailsForm, organizationName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Official Email</label>
                  <input
                    type="email"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    style={{ borderColor: "#E3E9F6" }}
                    value={detailsForm.officialEmail || ""}
                    onChange={(e) => setDetailsForm({ ...detailsForm, officialEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Contact Number</label>
                  <input
                    type="text"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    style={{ borderColor: "#E3E9F6" }}
                    value={detailsForm.contactNumber || ""}
                    onChange={(e) => setDetailsForm({ ...detailsForm, contactNumber: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Headquarters Address</label>
                  <textarea
                    rows={3}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    style={{ borderColor: "#E3E9F6" }}
                    value={detailsForm.headquartersAddress || ""}
                    onChange={(e) => setDetailsForm({ ...detailsForm, headquartersAddress: e.target.value })}
                  />
                </div>
              </div>
              <div className="pt-4 border-t flex items-center gap-4">
                <button
                  onClick={handleSaveDetails}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Details
                </button>
                {saveSuccess && (
                  <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Changes saved successfully
                  </div>
                )}
                {saveError && (
                  <div className="flex items-center gap-1.5 text-red-600 text-sm font-semibold">
                    <AlertCircle className="w-4 h-4" /> {saveError}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "branding" && (
            <div className="space-y-8 max-w-2xl">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Branding & Identity</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Organization Logo</label>
                  <div className="flex items-start gap-6">
                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 transition-all cursor-pointer" style={{ borderColor: "#E3E9F6" }}>
                      <Upload className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-bold">UPLOAD</span>
                    </div>
                    <div className="flex-1 space-y-2 pt-2">
                      <p className="text-sm font-semibold text-gray-700">Logo Guidelines</p>
                      <p className="text-xs text-gray-500">Recommended size 256x256px. PNG or SVG. Max 2MB.</p>
                      <button className="text-[11px] font-bold text-blue-600 hover:underline">Download current logo</button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Primary Brand Color</label>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl border shadow-sm" style={{ background: branding.primaryColor, borderColor: "#E3E9F6" }} />
                    <input
                      type="text"
                      className="border rounded-xl px-4 py-2.5 text-sm font-mono outline-none w-32"
                      style={{ borderColor: "#E3E9F6" }}
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">Used for buttons, links, and primary UI highlights.</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <button
                    className="px-6 py-2.5 rounded-xl text-white text-sm font-bold"
                    style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
                  >
                    Apply Branding
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "business-units" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Business Units</h2>
                  <p className="text-sm text-gray-500">High-level organizational segments for reporting and security.</p>
                </div>
              </div>

              <div className="flex gap-3 max-w-md">
                <input
                  type="text"
                  className="flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                  style={{ borderColor: "#E3E9F6" }}
                  placeholder="Enter business unit name..."
                  value={newBUName}
                  onChange={(e) => setNewBUName(e.target.value)}
                />
                <button
                  onClick={handleAddBU}
                  disabled={isCreatingBU}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
                >
                  <Plus className="w-4 h-4" /> Add BU
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                {buLoading ? (
                  <div className="col-span-2 text-center py-8 text-gray-400">Loading units...</div>
                ) : businessUnits.length === 0 ? (
                  <div className="col-span-2 text-center py-12 border-2 border-dashed rounded-2xl text-gray-400" style={{ borderColor: "#E3E9F6" }}>
                    No business units defined yet.
                  </div>
                ) : (
                  businessUnits.map((bu) => (
                    <div key={bu.id} className="flex items-center justify-between p-4 rounded-xl border bg-gray-50/50" style={{ borderColor: "#E3E9F6" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                          <LayoutGrid className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="font-semibold text-gray-800">{bu.name}</span>
                      </div>
                      <button 
                        onClick={() => deleteBU(bu.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "localization" && (
            <div className="space-y-6 max-w-xl">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Localization & Time</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Default Timezone</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-3 w-4 h-4 text-gray-400" />
                    <select
                      className="w-full border rounded-xl pl-11 pr-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-100 appearance-none"
                      style={{ borderColor: "#E3E9F6" }}
                      value={detailsForm.timezone || ""}
                      onChange={(e) => setDetailsForm({ ...detailsForm, timezone: e.target.value })}
                    >
                      <option value="Asia/Kolkata">(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi</option>
                      <option value="UTC">(GMT+00:00) UTC</option>
                      <option value="Europe/London">(GMT+00:00) London</option>
                      <option value="America/New_York">(GMT-05:00) New York</option>
                      <option value="Asia/Dubai">(GMT+04:00) Abu Dhabi, Muscat</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2">All system logs and scheduled reports will use this timezone as default.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">System Language</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-3 w-4 h-4 text-gray-400" />
                    <select
                      className="w-full border rounded-xl pl-11 pr-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-100 appearance-none"
                      style={{ borderColor: "#E3E9F6" }}
                    >
                      <option value="en">English (UK)</option>
                      <option value="en-us">English (US)</option>
                      <option value="hi">Hindi</option>
                      <option value="es">Spanish</option>
                      <option value="ar">Arabic</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2">Default language for organization-wide notifications and system labels.</p>
                </div>

                <div className="pt-4 border-t">
                  <button
                    onClick={handleSaveDetails}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold"
                    style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
                  >
                    Save Localization
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
