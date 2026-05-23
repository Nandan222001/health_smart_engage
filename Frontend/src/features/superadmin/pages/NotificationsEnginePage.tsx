import { useState } from "react";
import {
  useListSuperAdminNotifTemplatesQuery,
  useCreateSuperAdminNotifTemplateMutation,
  useUpdateSuperAdminNotifTemplateMutation,
  useDeleteSuperAdminNotifTemplateMutation,
} from "@/features/superadmin/api/adminApi";

const CHANNEL_STYLES: Record<string, { bg: string; text: string }> = {
  email: { bg: "#DBEAFE", text: "#1E40AF" },
  sms:   { bg: "#D1FAE5", text: "#065F46" },
  push:  { bg: "#EDE9FE", text: "#5B21B6" },
};

interface TemplateForm {
  name: string;
  channel: string;
  event_type: string;
  subject: string;
  body_template: string;
}

const EMPTY_FORM: TemplateForm = {
  name: "",
  channel: "email",
  event_type: "",
  subject: "",
  body_template: "",
};

export function NotificationsEnginePage() {
  const { data: templates = [], isLoading, isError } = useListSuperAdminNotifTemplatesQuery();
  const [createTemplate, { isLoading: creating }] = useCreateSuperAdminNotifTemplateMutation();
  const [updateTemplate, { isLoading: updating }] = useUpdateSuperAdminNotifTemplateMutation();
  const [deleteTemplate] = useDeleteSuperAdminNotifTemplateMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm>(EMPTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTemplate(form);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const handleEditStart = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setEditingId(id);
    setForm({
      name: t.name,
      channel: t.channel,
      event_type: t.event_type,
      subject: t.subject ?? "",
      body_template: t.body_template,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateTemplate({ templateId: editingId, body: form });
      setEditingId(null);
    } else {
      await createTemplate(form);
    }
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    await deleteTemplate(id);
    setDeleteConfirmId(null);
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await updateTemplate({ templateId: id, body: { is_active: !current } });
  };

  return (
    <div className="p-6 space-y-6" style={{ background: "#F3F7FF", minHeight: "100vh" }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Notifications Engine</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Manage platform-wide notification templates</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setForm(EMPTY_FORM);
            setShowForm(!showForm);
          }}
          className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
        >
          + New Template
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#E3E9F6" }}>
          <h2 className="text-[15px] font-bold mb-4" style={{ color: "#111827" }}>
            {editingId ? "Edit Template" : "New Notification Template"}
          </h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Name</label>
              <input
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Channel</label>
              <select
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="push">Push</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Event Type</label>
              <input
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                value={form.event_type}
                onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Subject</label>
              <input
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Body Template</label>
              <textarea
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none resize-none"
                style={{ borderColor: "#E3E9F6", color: "#111827" }}
                rows={4}
                value={form.body_template}
                onChange={(e) => setForm({ ...form, body_template: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={creating || updating}
                className="px-5 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}
              >
                {creating || updating ? "Saving…" : editingId ? "Update Template" : "Create Template"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
                className="px-4 py-2 rounded-xl text-sm font-medium border"
                style={{ borderColor: "#E3E9F6", color: "#6B7280" }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Name</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Channel</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Event Type</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Active</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ color: "#9CA3AF" }}>Loading…</td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ color: "#EF4444" }}>Failed to load</td>
              </tr>
            ) : templates.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ color: "#9CA3AF" }}>No templates yet</td>
              </tr>
            ) : (
              templates.map((t) => {
                const channelStyle = CHANNEL_STYLES[t.channel] ?? { bg: "#F3F4F6", text: "#6B7280" };
                return (
                  <tr key={t.id} className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-5 py-3.5 font-medium" style={{ color: "#111827" }}>{t.name}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize" style={{ background: channelStyle.bg, color: channelStyle.text }}>
                        {t.channel}
                      </span>
                    </td>
                    <td className="px-5 py-3.5" style={{ color: "#374151" }}>{t.event_type}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggleActive(t.id, t.is_active)}
                        className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                        style={{ background: t.is_active ? "#10B981" : "#D1D5DB" }}
                      >
                        <span
                          className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                          style={{ transform: t.is_active ? "translateX(18px)" : "translateX(2px)" }}
                        />
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditStart(t.id)}
                          className="px-3 py-1 rounded-lg text-xs font-medium border"
                          style={{ borderColor: "#4A57B9", color: "#4A57B9" }}
                        >
                          Edit
                        </button>
                        {deleteConfirmId === t.id ? (
                          <>
                            <button
                              onClick={() => handleDelete(t.id)}
                              className="px-3 py-1 rounded-lg text-xs font-medium text-white"
                              style={{ background: "#EF4444" }}
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-3 py-1 rounded-lg text-xs font-medium border"
                              style={{ borderColor: "#E3E9F6", color: "#6B7280" }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(t.id)}
                            className="px-3 py-1 rounded-lg text-xs font-medium border"
                            style={{ borderColor: "#EF4444", color: "#EF4444" }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
