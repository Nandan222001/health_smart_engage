import { auth } from '../config/firebase';

// API Configuration
const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

type DevStoredUser = {
  email?: string;
  role?: string;
};

async function buildHeaders(options?: RequestInit): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn('Unable to resolve Firebase token for API request:', error);
  }

  try {
    const storedUserRaw = localStorage.getItem('hse_user');
    const storedUser = storedUserRaw ? (JSON.parse(storedUserRaw) as DevStoredUser) : null;
    if (storedUser?.email) {
      headers['X-User-Email'] = storedUser.email;
    }
    if (storedUser?.role) {
      headers['X-User-Role'] = storedUser.role;
    }
  } catch (error) {
    console.warn('Unable to resolve local demo user for API request:', error);
  }

  const incoming = options?.headers;
  if (incoming instanceof Headers) {
    incoming.forEach((value, key) => {
      headers[key] = value;
    });
  } else if (Array.isArray(incoming)) {
    incoming.forEach(([key, value]) => {
      headers[key] = value;
    });
  } else if (incoming) {
    Object.assign(headers, incoming as Record<string, string>);
  }

  return headers;
}

/**
 * Generic API fetch wrapper with error handling
 */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const headers = await buildHeaders(options);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({} as Record<string, unknown>));
      const message = String((data as { error?: string }).error || response.statusText || 'Request failed');
      throw new Error(`API Error ${response.status}: ${message}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// ============= Sites =============
export interface Site {
  Site_ID: string;
  Site_Name: string;
  Location: string;
  Country: string;
  Timezone: string;
  Status: string;
  Total_Zones: number;
  Total_Workers: number;
  Compliance_Rate: number;
  Manager: string;
  Emergency_Contact: string;
  Established_Date: string;
}

export const getSites = () => apiFetch<Site[]>('/sites');

// ============= Zones =============
export interface Zone {
  Zone_ID: string;
  Zone_Name: string;
  Site_ID: string;
  Zone_Type: string;
  Parent_Zone: string;
  Risk_Score: number;
  Status: string;
  Time_Activation: string;
  Required_PPE: string;
  Max_Occupancy: number;
}

export const getZones = (siteId?: string) => 
  apiFetch<Zone[]>(`/zones${siteId ? `?site_id=${siteId}` : ''}`);

// ============= Shifts =============
export interface Shift {
  Shift_ID: string;
  Shift_Name: string;
  Start_Time: string;
  End_Time: string;
  Sites: string;
  Active_Rules: number;
  Status: string;
}

export const getShifts = () => apiFetch<Shift[]>('/shifts');

// ============= Cameras =============
export interface Camera {
  Camera_ID: string;
  Camera_Name: string;
  Zone_ID: string;
  Site_ID: string;
  IP_Address: string;
  Protocol: string;
  Resolution: string;
  FPS: number;
  Installed_Date: string;
  Status: string;
  Last_Maintenance: string;
}

export const getCameras = (siteId?: string) => 
  apiFetch<Camera[]>(`/cameras${siteId ? `?site_id=${siteId}` : ''}`);

// ============= RFID Readers =============
export interface RFIDReader {
  RFID_ID: string;
  Gate_Name: string;
  Zone_ID: string;
  Site_ID: string;
  Reader_Type: string;
  Last_Seen: string;
  Status: string;
  Total_Reads_Today: number;
}

export const getRFIDReaders = () => apiFetch<RFIDReader[]>('/rfid-readers');

// ============= Edge Devices =============
export interface EdgeDevice {
  Device_ID: string;
  Device_Name: string;
  Device_Type: string;
  Site_ID: string;
  Zone_ID: string;
  Firmware_Version: string;
  AI_Model_Version: string;
  Last_Seen: string;
  Status: string;
  CPU_Usage: number;
  GPU_Usage: number;
  Memory_Usage: number;
}

export const getEdgeDevices = () => apiFetch<EdgeDevice[]>('/edge-devices');

// ============= Users =============
export interface User {
  User_ID: string;
  Full_Name: string;
  Email: string;
  Role: string;
  Site_Assignment: string;
  Phone: string;
  Status: string;
  Last_Login: string;
  Join_Date: string;
}

export const getUsers = () => apiFetch<User[]>('/users');

// ============= Workers =============
export interface Worker {
  Worker_ID: string;
  Full_Name: string;
  Badge_Number: string;
  RFID_Tag: string;
  Contractor: string;
  Site_Assignment: string;
  Role: string;
  Shift: string;
  Status: string;
  Phone: string;
  Emergency_Contact: string;
  Hire_Date: string;
}

export const getWorkers = (contractor?: string) => 
  apiFetch<Worker[]>(`/workers${contractor ? `?contractor=${contractor}` : ''}`);

// ============= Violations =============
export interface Violation {
  Violation_ID: string;
  Violation_Type: string;
  Zone_ID: string;
  Site_ID: string;
  Severity: 'Critical' | 'High' | 'Medium' | 'Low';
  PPE_Missing: string;
  Worker_ID: string;
  Camera_ID: string;
  Shift: string;
  Detected_At: string;
  Status: string;
  Assigned_To: string;
  Confidence_Score: number;
  Image_Path: string;
}

export interface ViolationFilters {
  site_id?: string;
  zone_id?: string;
  severity?: string;
  status?: string;
  shift?: string;
}

export const getViolations = (filters?: ViolationFilters) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }
  const query = params.toString();
  return apiFetch<Violation[]>(`/violations${query ? `?${query}` : ''}`);
};

export const getViolationDetail = (violationId: string) => 
  apiFetch<Violation>(`/violations/${violationId}`);

// ============= Actions =============
export interface Action {
  Action_ID: string;
  Description: string;
  Violation_ID: string;
  Action_Type: string;
  Assigned_To: string;
  Due_Date: string;
  Priority: string;
  Status: string;
  Created_At: string;
  Completed_At: string;
}

export const getActions = (violationId?: string, status?: string) => {
  const params = new URLSearchParams();
  if (violationId) params.append('violation_id', violationId);
  if (status) params.append('status', status);
  const query = params.toString();
  return apiFetch<Action[]>(`/actions${query ? `?${query}` : ''}`);
};

// ============= Rules =============
export interface Rule {
  Rule_ID: string;
  Rule_Name: string;
  Zone_ID: string;
  Site_ID: string;
  PPE_Required: string;
  Severity: string;
  Shift: string;
  Conditions: string;
  Status: string;
  Version: string;
  Created_By: string;
  Created_At: string;
  Last_Modified: string;
}

export const getRules = () => apiFetch<Rule[]>('/rules');

// ============= PPE Types =============
export interface PPEType {
  PPE_ID: string;
  PPE_Name: string;
  Category: string;
  Color_Detection: string;
  Compliance_Standard: string;
  Min_Confidence: number;
  Status: string;
}

export const getPPETypes = () => apiFetch<PPEType[]>('/ppe-types');

// ============= Contractors =============
export interface Contractor {
  Contractor_ID: string;
  Contractor_Name: string;
  Contact_Person: string;
  Email: string;
  Phone: string;
  Safety_Score: number;
  Total_Workers: number;
  Active_Since: string;
  Contract_Expiry: string;
  Status: string;
  Certification: string;
}

export const getContractors = () => apiFetch<Contractor[]>('/contractors');

// ============= Access Log =============
export interface AccessLog {
  Log_ID: string;
  Worker_ID: string;
  RFID_Reader_ID: string;
  Gate_Name: string;
  Entry_Type: string;
  Timestamp: string;
  Result: string;
  Denial_Reason: string;
}

export const getAccessLog = () => apiFetch<AccessLog[]>('/access-log');

// ============= SLA Configuration =============
export interface SLAConfig {
  Severity: string;
  Resolution_Time_Hours: number;
  Warning_Time_Hours: number;
  Escalation_Time_Hours: number;
  Auto_Assign: string;
  Notification_Channel: string;
}

export const getSLAConfig = () => apiFetch<SLAConfig[]>('/sla-config');

// ============= Compliance Standards =============
export interface ComplianceStandard {
  Standard_ID: string;
  Standard_Name: string;
  Compliance_Rate: number;
  Last_Audit_Date: string;
  Next_Audit_Date: string;
  Auditor: string;
  Certificate_Number: string;
  Status: string;
}

export const getComplianceStandards = () => apiFetch<ComplianceStandard[]>('/compliance-standards');

// ============= Audit Trail =============
export interface AuditTrail {
  Audit_ID: string;
  Timestamp: string;
  User: string;
  Action: string;
  Module: string;
  Record_ID: string;
  Previous_Value: string;
  New_Value: string;
  IP_Address: string;
}

export const getAuditTrail = () => apiFetch<AuditTrail[]>('/audit-trail');

// ============= Dashboard Stats =============
export interface DashboardStats {
  total_violations_today: number;
  compliance_rate: number;
  open_actions: number;
  workers_on_site: number;
  avg_response_time: string;
}

export interface OnboardingAccessProfile {
  response_version?: string;
  source?: string;
  found: boolean;
  approved: boolean;
  approval_state?: string;
  reason?: string;
  onboarding_uuid?: string;
  company_name?: string;
  org_code?: string;
  country_code?: string;
  country_name?: string;
  admin_name?: string;
  admin_email?: string;
  worker_name?: string;
  worker_email?: string;
  user_name?: string;
  display_name?: string;
  user_email?: string;
  user_role?: 'Admin' | 'Site Engineer' | 'Site Inspector' | 'Worker/Contractor';
  subscription_plan?: 'Free' | 'Pro' | 'Enterprise';
  profile_source?: 'admin_email' | 'worker_email';
  selected_modules?: string[];
  selected_checklist_types?: string[];
  active_workers?: number;
  setup_required?: boolean;
  setup_completed?: boolean;
  configured_users_count?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OnboardingSubmissionPayload {
  company_name: string;
  country_code: string;
  country_name: string;
  use_global_layer: boolean;
  use_country_layer: boolean;
  use_org_layer: boolean;
  selected_checklist_types: string[];
  selected_modules: string[];
  site_count: number;
  zone_count: number;
  active_workers: number;
  admin_name: string;
  admin_email: string;
  admin_phone?: string;
  requirements_notes?: string;
}

export interface OnboardingSubmissionResponse {
  status: 'submitted';
  onboarding_uuid: string;
  org_code: string;
  dashboard_redirect: string;
  message: string;
}

export interface OnboardingLayerOption {
  id: string;
  label: string;
  file_name: string;
  layer: 'global' | 'country';
}

export interface OnboardingLayerOptionsResponse {
  country_code: string;
  global_options: OnboardingLayerOption[];
  country_options: OnboardingLayerOption[];
  counts: {
    global: number;
    country: number;
  };
}

export interface RequestStatusResponse {
  found: boolean;
  message?: string;
  onboarding_uuid?: string;
  company_name?: string;
  org_code?: string;
  country_code?: string;
  country_name?: string;
  status?: 'submitted' | 'approved' | 'archived';
  admin_name?: string;
  admin_email?: string;
  admin_phone?: string;
  active_workers?: number;
  selected_modules?: string[];
  selected_checklist_types?: string[];
  post_approval_setup?: {
    org_data_summary?: string;
    workers?: Array<{
      name: string;
      email: string;
      phone: string;
      role: 'Admin' | 'Site Engineer' | 'Site Inspector' | 'Worker/Contractor';
      employee_id?: string;
      certification?: string;
    }>;
    uploaded_files?: Array<{ original_name: string; stored_name: string; stored_path: string; content_type: string; size_bytes: number }>;
    worker_uploaded_files?: Array<{ original_name: string; stored_name: string; stored_path: string; content_type: string; size_bytes: number }>;
    saved_at?: string;
  };
  onboarding_requirements?: {
    profile?: Record<string, unknown>;
    industry_taxonomy?: Record<string, unknown>;
    plan_capabilities?: Record<string, unknown>;
    governance_layers?: Record<string, unknown>;
    kpi_sla?: Record<string, unknown>;
    risk_and_compliance?: Record<string, unknown>;
    emergency_readiness?: Record<string, unknown>;
    admin_ownership?: Record<string, unknown>;
    implementation?: Record<string, unknown>;
    custom_notes?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface OnboardingProcessingQueueItem {
  onboarding_uuid: string;
  company_name: string;
  org_code: string;
  country_code?: string;
  admin_name?: string;
  admin_email?: string;
  status: 'submitted' | 'approved' | 'archived' | string;
  setup_ready: boolean;
  org_data_summary?: string;
  uploaded_files_count: number;
  worker_files_count: number;
  workers_count: number;
  processing: {
    status: 'pending' | 'processing' | 'completed' | 'failed' | string;
    started_at?: string | null;
    completed_at?: string | null;
    last_run_uuid?: string | null;
    last_error?: string | null;
    indexed_docs?: number | null;
    failed_files?: number | null;
    total_files?: number | null;
  };
  created_at?: string;
  updated_at?: string;
}

export interface OnboardingProcessingQueueResponse {
  requests: OnboardingProcessingQueueItem[];
  count: number;
}

export interface StartOnboardingProcessingResponse {
  status: 'completed' | 'failed' | string;
  message?: string;
  onboarding_uuid: string;
  org_code: string;
  web_app_url?: string;
  mobile_app_url?: string;
  processing?: Record<string, unknown>;
  error?: string;
}

export interface PostApprovalSetupPayload {
  org_data_summary: string;
  workers: Array<{
    name: string;
    email: string;
    phone: string;
    role: 'Admin' | 'Site Engineer' | 'Site Inspector' | 'Worker/Contractor';
    employee_id?: string;
    certification?: string;
  }>;
  org_files?: File[];
  worker_files?: File[];
}

export interface PostApprovalSetupResponse {
  status: 'saved';
  message: string;
  org_code: string;
  company_name: string;
  web_app_url: string;
  mobile_app_url: string;
  uploaded_files_count?: number;
  worker_files_count?: number;
  max_workers_allowed?: number;
  configured_workers_count?: number;
}

export interface DeletePostApprovalFileResponse {
  status: 'deleted';
  stored_name: string;
  file_group: 'org' | 'worker';
}

export interface ThetaPasswordResetRequestResponse {
  status: 'otp_issued';
  email: string;
  org_code: string;
  delivery: 'email' | 'email_failed';
  delivery_detail?: string;
  dev_otp_preview?: string;
}

export interface ThetaPasswordResetConfirmResponse {
  status: 'password_reset_success';
  email: string;
  org_code: string;
  message: string;
}

export interface ThetaPasswordResetDirectResponse {
  status: 'password_reset_success';
  email: string;
  org_code: string;
  message: string;
}

export interface ThetaAuthLoginResponse {
  status: 'success' | 'password_setup_required' | 'pending_approval' | 'invalid_credentials' | 'not_found' | 'error';
  access_profile?: OnboardingAccessProfile;
  reason?: string;
  error?: string;
}

export interface OnboardingAccessRequestResponse {
  status: 'request_submitted' | 'already_provisioned';
  message: string;
  org_code: string;
  company_name?: string;
  approval_state?: string;
}

export interface OrgAccessRequestItem {
  request_id: number;
  onboarding_uuid: string;
  org_code: string;
  company_name?: string;
  admin_email?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'Admin' | 'Site Engineer' | 'Site Inspector' | 'Worker/Contractor';
  status: 'requested' | 'invited' | 'active' | 'rejected' | string;
  created_at?: string;
  updated_at?: string;
}

export interface OrgAccessRequestsResponse {
  requests: OrgAccessRequestItem[];
  count: number;
}

export interface ReviewOrgAccessRequestResponse {
  status: 'reviewed';
  request_id: number;
  action: 'approve' | 'reject';
  role: 'Admin' | 'Site Engineer' | 'Site Inspector' | 'Worker/Contractor';
  worker_email: string;
  new_status: 'invited' | 'rejected' | string;
}

export const getDashboardStats = () => apiFetch<DashboardStats>('/dashboard/stats');

export const getOnboardingAccessProfile = (email: string, orgCode?: string) => {
  const params = new URLSearchParams();
  params.set('email', email.trim().toLowerCase());
  if (orgCode?.trim()) {
    params.set('org_code', orgCode.trim().toUpperCase());
  }
  return apiFetch<OnboardingAccessProfile>(`/onboarding/access-profile?${params.toString()}`);
};

export async function submitClientOnboarding(payload: OnboardingSubmissionPayload): Promise<OnboardingSubmissionResponse> {
  const response = await fetch(`${API_BASE_URL}/onboarding`, {
    method: 'POST',
    headers: await buildHeaders({ headers: { 'Content-Type': 'application/json' } }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string })?.error || response.statusText || 'Onboarding submission failed');
  }

  return response.json();
}

export async function deleteOnboardingRequest(uuid: string) {
  const response = await fetch(`${API_BASE_URL}/onboarding/requests/${uuid}`, {
    method: 'DELETE',
    headers: await buildHeaders({ headers: { 'Content-Type': 'application/json' } }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string })?.error || response.statusText || 'Failed to delete request');
  }

  return response.json();
}

export async function updateOnboardingStatus(uuid: string, status: 'approved' | 'archived' | 'submitted') {
  const response = await fetch(`${API_BASE_URL}/onboarding/requests/${uuid}/status`, {
    method: 'PATCH',
    headers: await buildHeaders({ headers: { 'Content-Type': 'application/json' } }),
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string })?.error || response.statusText || 'Failed to update status');
  }

  return response.json() as Promise<{ message: string; email_delivery?: { attempted: boolean; sent: boolean; detail: string } }>;
}

export async function fetchOnboardingRequests() {
  const response = await fetch(`${API_BASE_URL}/onboarding/requests`, {
    method: 'GET',
    headers: await buildHeaders({ headers: { 'Content-Type': 'application/json' } }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string })?.error || response.statusText || 'Failed to fetch onboarding requests');
  }

  return response.json();
}

export async function fetchOnboardingProcessingQueue(): Promise<OnboardingProcessingQueueResponse> {
  const response = await fetch(`${API_BASE_URL}/onboarding/processing-queue`, {
    method: 'GET',
    headers: await buildHeaders({ headers: { 'Content-Type': 'application/json' } }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string })?.error || response.statusText || 'Failed to fetch processing queue');
  }

  return response.json();
}

export async function startOnboardingProcessing(onboardingUuid: string): Promise<StartOnboardingProcessingResponse> {
  const response = await fetch(`${API_BASE_URL}/onboarding/requests/${onboardingUuid}/start-processing`, {
    method: 'POST',
    headers: await buildHeaders({ headers: { 'Content-Type': 'application/json' } }),
  });

  const data = await response.json().catch(() => ({} as StartOnboardingProcessingResponse));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || response.statusText || 'Failed to start onboarding processing');
  }

  return data;
}

export async function fetchRequestStatusByEmail(email: string): Promise<RequestStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/onboarding/request-status?email=${encodeURIComponent(email.trim().toLowerCase())}`, {
    method: 'GET',
    headers: await buildHeaders({ headers: { 'Content-Type': 'application/json' } }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string })?.error || response.statusText || 'Failed to fetch request status');
  }

  return response.json();
}

export async function fetchOnboardingLayerOptions(countryCode: string): Promise<OnboardingLayerOptionsResponse> {
  const code = (countryCode || '').trim().toUpperCase();
  const response = await fetch(`${API_BASE_URL}/onboarding/layer-options?country_code=${encodeURIComponent(code)}`, {
    method: 'GET',
    headers: await buildHeaders({ headers: { 'Content-Type': 'application/json' } }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string })?.error || response.statusText || 'Failed to fetch layer options');
  }

  return response.json();
}

export async function savePostApprovalSetup(
  onboardingUuid: string,
  payload: PostApprovalSetupPayload,
): Promise<PostApprovalSetupResponse> {
  const formData = new FormData();
  formData.append('org_data_summary', payload.org_data_summary || '');
  formData.append('workers_json', JSON.stringify(payload.workers || []));
  (payload.org_files || []).forEach((file) => {
    formData.append('org_files', file);
  });
  (payload.worker_files || []).forEach((file) => {
    formData.append('worker_files', file);
  });

  const multipartHeaders = { ...(await buildHeaders() as Record<string, string>) };
  delete multipartHeaders['Content-Type'];
  delete multipartHeaders['content-type'];

  const response = await fetch(`${API_BASE_URL}/onboarding/requests/${onboardingUuid}/post-approval-setup`, {
    method: 'POST',
    headers: multipartHeaders,
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string })?.error || response.statusText || 'Failed to save post-approval setup');
  }

  return response.json();
}

export async function deletePostApprovalFile(
  onboardingUuid: string,
  storedName: string,
  fileGroup: 'org' | 'worker',
): Promise<DeletePostApprovalFileResponse> {
  const response = await fetch(`${API_BASE_URL}/onboarding/requests/${onboardingUuid}/post-approval-files`, {
    method: 'DELETE',
    headers: await buildHeaders({ headers: { 'Content-Type': 'application/json' } }),
    body: JSON.stringify({ stored_name: storedName, file_group: fileGroup }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string })?.error || response.statusText || 'Failed to delete uploaded file');
  }

  return response.json();
}

export async function requestThetaPasswordResetOtp(
  email: string,
  orgCode?: string,
): Promise<ThetaPasswordResetRequestResponse> {
  const payload: { email: string; org_code?: string } = {
    email: email.trim().toLowerCase(),
  };
  if (orgCode?.trim()) {
    payload.org_code = orgCode.trim().toUpperCase();
  }

  const response = await fetch(`${API_BASE_URL}/onboarding/password-reset/theta/request`, {
    method: 'POST',
    headers: await buildHeaders({ headers: { 'Content-Type': 'application/json' } }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string })?.error || response.statusText || 'Failed to request Theta reset OTP');
  }

  return response.json();
}

export async function confirmThetaPasswordReset(
  email: string,
  otp: string,
  newPassword: string,
  orgCode?: string,
): Promise<ThetaPasswordResetConfirmResponse> {
  const payload: { email: string; otp: string; new_password: string; org_code?: string } = {
    email: email.trim().toLowerCase(),
    otp: otp.trim(),
    new_password: newPassword,
  };
  if (orgCode?.trim()) {
    payload.org_code = orgCode.trim().toUpperCase();
  }

  const response = await fetch(`${API_BASE_URL}/onboarding/password-reset/theta/confirm`, {
    method: 'POST',
    headers: await buildHeaders({ headers: { 'Content-Type': 'application/json' } }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string })?.error || response.statusText || 'Failed to confirm Theta password reset');
  }

  return response.json();
}

export async function resetThetaPasswordDirect(
  email: string,
  newPassword: string,
  orgCode?: string,
): Promise<ThetaPasswordResetDirectResponse> {
  const payload: { email: string; new_password: string; org_code?: string } = {
    email: email.trim().toLowerCase(),
    new_password: newPassword,
  };
  if (orgCode?.trim()) {
    payload.org_code = orgCode.trim().toUpperCase();
  }

  const response = await fetch(`${API_BASE_URL}/onboarding/password-reset/theta/direct`, {
    method: 'POST',
    headers: await buildHeaders({ headers: { 'Content-Type': 'application/json' } }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string })?.error || response.statusText || 'Failed to reset Theta password');
  }

  return response.json();
}

export async function loginWithThetaCredentials(
  email: string,
  password: string,
  orgCode?: string,
): Promise<ThetaAuthLoginResponse> {
  const payload: { email: string; password: string; org_code?: string } = {
    email: email.trim().toLowerCase(),
    password,
  };
  if (orgCode?.trim()) {
    payload.org_code = orgCode.trim().toUpperCase();
  }

  const response = await fetch(`${API_BASE_URL}/onboarding/theta-auth/login`, {
    method: 'POST',
    headers: await buildHeaders({ headers: { 'Content-Type': 'application/json' } }),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({} as ThetaAuthLoginResponse));
  if (!response.ok && !data.status) {
    const err = (data as { error?: string }).error || response.statusText || 'Theta login failed';
    throw new Error(err);
  }
  return data;
}

export async function submitOnboardingAccessRequest(
  email: string,
  orgCode: string,
  name?: string,
): Promise<OnboardingAccessRequestResponse> {
  const payload: { email: string; org_code: string; name?: string } = {
    email: email.trim().toLowerCase(),
    org_code: orgCode.trim().toUpperCase(),
  };
  if (name?.trim()) {
    payload.name = name.trim();
  }

  const response = await fetch(`${API_BASE_URL}/onboarding/access-request`, {
    method: 'POST',
    headers: await buildHeaders({ headers: { 'Content-Type': 'application/json' } }),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({} as OnboardingAccessRequestResponse & { error?: string }));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || response.statusText || 'Failed to submit access request');
  }

  return data as OnboardingAccessRequestResponse;
}

export async function fetchOrgAccessRequests(orgCode?: string): Promise<OrgAccessRequestsResponse> {
  const params = new URLSearchParams();
  if (orgCode?.trim()) {
    params.set('org_code', orgCode.trim().toUpperCase());
  }
  const query = params.toString();

  const response = await fetch(`${API_BASE_URL}/onboarding/access-requests${query ? `?${query}` : ''}`, {
    method: 'GET',
    headers: await buildHeaders({ headers: { 'Content-Type': 'application/json' } }),
  });

  const data = await response.json().catch(() => ({} as OrgAccessRequestsResponse & { error?: string }));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || response.statusText || 'Failed to fetch org access requests');
  }
  return data as OrgAccessRequestsResponse;
}

export async function reviewOrgAccessRequest(
  requestId: number,
  action: 'approve' | 'reject',
  role: 'Admin' | 'Site Engineer' | 'Site Inspector' | 'Worker/Contractor',
): Promise<ReviewOrgAccessRequestResponse> {
  const response = await fetch(`${API_BASE_URL}/onboarding/access-requests/${requestId}/review`, {
    method: 'PATCH',
    headers: await buildHeaders({ headers: { 'Content-Type': 'application/json' } }),
    body: JSON.stringify({ action, role }),
  });

  const data = await response.json().catch(() => ({} as ReviewOrgAccessRequestResponse & { error?: string }));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || response.statusText || 'Failed to review access request');
  }
  return data as ReviewOrgAccessRequestResponse;
}

// ============= Analytics =============
export interface PPEComplianceData {
  name: string;
  violations: number;
}

export interface ZoneRiskData {
  name: string;
  risk: number;
  violations: number;
}

export const getPPECompliance = () => apiFetch<PPEComplianceData[]>('/analytics/ppe-compliance');
export const getZoneRisk = () => apiFetch<ZoneRiskData[]>('/analytics/zone-risk');

// ============= Near Miss =============
export interface NearMiss {
  NearMiss_ID: string;
  Title: string;
  Description: string;
  Site_ID: string;
  Zone_ID: string;
  Reported_By: string;
  Reported_At: string;
  Incident_Date: string;
  Category: string;
  Severity: 'Critical' | 'High' | 'Medium' | 'Low';
  Potential_Outcome: string;
  Immediate_Action: string;
  Status: string;
  Investigation_Status: string;
}

export interface NearMissFilters {
  site_id?: string;
  severity?: string;
  status?: string;
}

export const getNearMiss = (filters?: NearMissFilters) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }
  const query = params.toString();
  return apiFetch<NearMiss[]>(`/near-miss${query ? `?${query}` : ''}`);
};

export const getNearMissDetail = (id: string) =>
  apiFetch<NearMiss>(`/near-miss/${id}`);

// ============= Root Cause Analysis =============
export interface RootCauseAnalysis {
  RCA_ID: string;
  Incident_ID: string;
  Incident_Type: string;
  Site_ID: string;
  Zone_ID: string;
  Conducted_By: string;
  Start_Date: string;
  Completion_Date: string;
  Root_Causes: string;
  Contributing_Factors: string;
  Corrective_Actions: string;
  Preventive_Measures: string;
  Status: string;
  Priority: string;
}

export interface RCAFilters {
  site_id?: string;
  status?: string;
}

export const getRootCauseAnalysis = (filters?: RCAFilters) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }
  const query = params.toString();
  return apiFetch<RootCauseAnalysis[]>(`/root-cause-analysis${query ? `?${query}` : ''}`);
};

// ============= Equipment Certification =============
export interface EquipmentCertification {
  Cert_ID: string;
  Equipment_Name: string;
  Equipment_Type: string;
  Site_ID: string;
  Zone_ID: string;
  Serial_Number: string;
  Manufacturer: string;
  Model: string;
  Certification_Type: string;
  Certified_By: string;
  Issue_Date: string;
  Expiry_Date: string;
  Next_Inspection: string;
  Status: string;
  Compliance_Standard: string;
}

export interface EquipmentCertFilters {
  site_id?: string;
  status?: string;
  equipment_type?: string;
}

export const getEquipmentCertifications = (filters?: EquipmentCertFilters) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }
  const query = params.toString();
  return apiFetch<EquipmentCertification[]>(`/equipment-certification${query ? `?${query}` : ''}`);
};

// ============= Checklists =============
export interface ChecklistTemplateItem {
  section_name: string;
  item_no: number;
  item_text: string;
  is_required: number;
}

export interface ChecklistTemplate {
  checklist_type: string;
  display_name: string;
  submitter_roles: string[];
  validator_roles: string[];
  items: ChecklistTemplateItem[];
  item_count: number;
  ui?: {
    form_title?: string;
    short_label?: string;
    version_tag?: string;
  } | null;
  sla?: {
    draft_submission_sla_hours?: number;
    validation_sla_hours?: number;
  } | null;
}

export interface ChecklistSubmissionSummary {
  submission_uuid: string;
  checklist_type: string;
  site_id?: string | null;
  zone_id?: string | null;
  shift_name?: string | null;
  checklist_date: string;
  submitted_by_email: string;
  submitted_by_role: string;
  status: string;
  created_at: string;
  updated_at: string;
  submit_due_at?: string | null;
  validate_due_at?: string | null;
  submit_sla_breached?: number;
  validate_sla_breached?: number;
}

export interface ChecklistSubmissionItemDetail extends ChecklistTemplateItem {
  response_value?: string | null;
  remark?: string | null;
  evidence_json?: string | null;
  updated_by_email?: string | null;
  updated_by_role?: string | null;
  updated_at?: string | null;
  attachments?: Array<{
    id: number;
    item_no: number;
    file_name: string;
    file_path: string;
    mime_type?: string | null;
    file_size_bytes?: number | null;
    uploaded_by_email?: string | null;
    uploaded_by_role?: string | null;
    created_at?: string | null;
  }>;
}

export interface ChecklistSubmissionDetail {
  submission: ChecklistSubmissionSummary & {
    validation_decision?: string | null;
    validation_notes?: string | null;
  };
  template: {
    checklist_type: string;
    display_name: string;
    submitter_roles: string[];
    validator_roles: string[];
    ui?: ChecklistTemplate['ui'];
    sla?: ChecklistTemplate['sla'];
  };
  items: ChecklistSubmissionItemDetail[];
  logs: Array<{
    action_type: string;
    actor_email: string;
    actor_role: string;
    from_status?: string | null;
    to_status?: string | null;
    notes?: string | null;
    created_at: string;
  }>;
}

export interface CreateChecklistSubmissionPayload {
  checklist_type: string;
  site_id?: string;
  zone_id?: string;
  shift_name?: string;
  checklist_date?: string;
  metadata?: Record<string, unknown>;
}

export interface SaveChecklistItemPayload {
  item_no: number;
  response_value?: string | null;
  remark?: string | null;
  evidence?: Record<string, unknown>;
}

export const bootstrapChecklistTemplates = () =>
  apiFetch<{ status: string; message: string; counts: Record<string, number> }>('/checklists/templates/bootstrap', {
    method: 'POST',
  });

export const getChecklistTemplates = () => apiFetch<ChecklistTemplate[]>('/checklists/templates');

export const createChecklistSubmission = (payload: CreateChecklistSubmissionPayload) =>
  apiFetch<{ submission_uuid: string; status: string; deadline?: { submit_due_at?: string; validate_due_at?: string | null } }>('/checklists/submissions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const saveChecklistSubmissionItems = (submissionUuid: string, items: SaveChecklistItemPayload[]) =>
  apiFetch<{ status: string; updated_items: number }>(`/checklists/submissions/${submissionUuid}/items`, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });

export const submitChecklistSubmission = (submissionUuid: string) =>
  apiFetch<{ status: string; submission_uuid: string }>(`/checklists/submissions/${submissionUuid}/submit`, {
    method: 'POST',
  });

export const validateChecklistSubmission = (submissionUuid: string, decision: 'approved' | 'rejected', notes?: string) =>
  apiFetch<{ status: string; submission_uuid: string }>(`/checklists/submissions/${submissionUuid}/validate`, {
    method: 'POST',
    body: JSON.stringify({ decision, notes }),
  });

export const getChecklistSubmissions = (filters?: Record<string, string | number | undefined>) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
  }
  const query = params.toString();
  return apiFetch<ChecklistSubmissionSummary[]>(`/checklists/submissions${query ? `?${query}` : ''}`);
};

export const getChecklistSubmissionDetail = (submissionUuid: string) =>
  apiFetch<ChecklistSubmissionDetail>(`/checklists/submissions/${submissionUuid}`);

// ============= Health Check =============
export const healthCheck = () => apiFetch<{ status: string; timestamp: string }>('/health');
