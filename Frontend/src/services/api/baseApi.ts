import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { auth } from "@/config/firebase";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: async (headers) => {
      // Prefer the HSE backend JWT (set when logging in via the backend auth endpoint).
      // Fall back to Firebase token for Firebase-authenticated users (regular org admins).
      const hseJwt = localStorage.getItem("hse_jwt");
      if (hseJwt) {
        headers.set("Authorization", `Bearer ${hseJwt}`);
      } else {
        try {
          const token = await auth.currentUser?.getIdToken();
          if (token) headers.set("Authorization", `Bearer ${token}`);
        } catch {
          // Firebase token unavailable — proceed without auth header
        }
      }
      try {
        const stored = localStorage.getItem("hse_user");
        const user = stored ? (JSON.parse(stored) as { email?: string; role?: string; orgCode?: string }) : null;
        if (user?.email) headers.set("X-User-Email", user.email);
        if (user?.role) headers.set("X-User-Role", user.role);
        if (user?.orgCode) headers.set("X-Tenant-Id", user.orgCode);
      } catch {
        // localStorage unavailable — proceed without custom headers
      }
      return headers;
    },
});

// Unwrap the standard backend envelope: {success, message, data: <payload>}
// List payloads ({items: [...]}) are unwrapped to plain arrays.
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.data && typeof result.data === "object") {
    const body = result.data as Record<string, unknown>;
    if ("data" in body) {
      const inner = body.data as Record<string, unknown> | null | undefined;
      if (inner && typeof inner === "object" && Array.isArray(inner.items)) {
        return { ...result, data: inner.items };
      }
      return { ...result, data: inner ?? {} };
    }
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: [
    "Site", "Zone", "Shift", "Camera", "RFIDReader", "EdgeDevice",
    "User", "Worker", "Violation", "Action", "Rule", "PPEType",
    "Contractor", "AccessLog", "SLAConfig", "ComplianceStandard",
    "AuditTrail", "Dashboard", "NearMiss", "RCA", "EquipmentCert",
    "Checklist", "Analytics", "Onboarding",
    "Tenant", "OrgNode", "Role", "Permission", "Workflow",
    "Employee", "Training", "Vendor", "Asset", "Permit",
    "Audit", "CAPA", "Risk", "Hazard", "Incident",
    "OrgSetup", "Activity", "EscalationRule",
    "Import", "ApiIntegration",
  ],
  endpoints: () => ({}),
});
