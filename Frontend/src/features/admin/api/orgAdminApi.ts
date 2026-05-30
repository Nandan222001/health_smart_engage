const API_BASE = (import.meta.env.VITE_API_URL as string || "/api/v1").replace(/\/$/, "");

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const jwt = localStorage.getItem("hse_jwt");
  if (jwt) headers["Authorization"] = `Bearer ${jwt}`;
  try {
    const stored = localStorage.getItem("hse_user");
    const u = stored ? (JSON.parse(stored) as { email?: string; role?: string; orgCode?: string }) : null;
    if (u?.email) headers["X-User-Email"] = u.email;
    if (u?.role) headers["X-User-Role"] = u.role;
    if (u?.orgCode) headers["X-Tenant-Id"] = u.orgCode;
  } catch { /* ignore */ }
  return headers;
}

/** Generic GET helper — returns items array from any list endpoint */
export async function fetchItems<T = Record<string, unknown>>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: getAuthHeaders() });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return [];
    return (json?.data?.items ?? json?.items ?? []) as T[];
  } catch {
    return [];
  }
}

export interface InviteUserPayload {
  name: string;
  email: string;
  role: string;
  site: string;
  phone?: string;
  department?: string;
}

export interface InviteUserResult {
  id: string;
  status: string;
  email_sent?: boolean;
}

/** POST /api/v1/admin/users/invitations — invite a team member and send credentials via email */
export async function inviteUser(payload: InviteUserPayload): Promise<InviteUserResult> {
  const res = await fetch(`${API_BASE}/admin/users/invitations`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ data: payload }),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = json?.detail || json?.message || json?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return json?.data ?? json;
}
