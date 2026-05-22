import { baseApi } from "@/services/api/baseApi";
import type {
  OnboardingAccessProfile,
  OnboardingSubmissionPayload,
  OnboardingSubmissionResponse,
  OnboardingLayerOptionsResponse,
  RequestStatusResponse,
  OnboardingProcessingQueueResponse,
  StartOnboardingProcessingResponse,
  ThetaAuthLoginResponse,
  OnboardingAccessRequestResponse,
  OrgAccessRequestsResponse,
  ReviewOrgAccessRequestResponse,
} from "@/services/api";

export const onboardingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOnboardingAccessProfile: builder.query<
      OnboardingAccessProfile,
      { email: string; orgCode?: string }
    >({
      query: ({ email, orgCode }) => {
        const params = new URLSearchParams();
        params.set("email", email.trim().toLowerCase());
        if (orgCode?.trim()) params.set("org_code", orgCode.trim().toUpperCase());
        return `/onboarding/access-profile?${params.toString()}`;
      },
      providesTags: ["Onboarding"],
    }),
    getOnboardingLayerOptions: builder.query<OnboardingLayerOptionsResponse, string>({
      query: (countryCode) =>
        `/onboarding/layer-options?country_code=${encodeURIComponent(countryCode.trim().toUpperCase())}`,
      providesTags: ["Onboarding"],
    }),
    getRequestStatusByEmail: builder.query<RequestStatusResponse, string>({
      query: (email) =>
        `/onboarding/request-status?email=${encodeURIComponent(email.trim().toLowerCase())}`,
      providesTags: ["Onboarding"],
    }),
    getOnboardingProcessingQueue: builder.query<OnboardingProcessingQueueResponse, void>({
      query: () => "/onboarding/processing-queue",
      providesTags: ["Onboarding"],
    }),
    getOrgAccessRequests: builder.query<OrgAccessRequestsResponse, string | void>({
      query: (orgCode) => {
        const params = new URLSearchParams();
        if (orgCode?.trim()) params.set("org_code", orgCode.trim().toUpperCase());
        const query = params.toString();
        return `/onboarding/access-requests${query ? `?${query}` : ""}`;
      },
      providesTags: ["Onboarding"],
    }),
    submitClientOnboarding: builder.mutation<OnboardingSubmissionResponse, OnboardingSubmissionPayload>({
      query: (payload) => ({ url: "/onboarding", method: "POST", body: payload }),
      invalidatesTags: ["Onboarding"],
    }),
    loginWithThetaCredentials: builder.mutation<
      ThetaAuthLoginResponse,
      { email: string; password: string; orgCode?: string }
    >({
      query: ({ email, password, orgCode }) => ({
        url: "/onboarding/theta-auth/login",
        method: "POST",
        body: {
          email: email.trim().toLowerCase(),
          password,
          ...(orgCode?.trim() ? { org_code: orgCode.trim().toUpperCase() } : {}),
        },
      }),
    }),
    submitOnboardingAccessRequest: builder.mutation<
      OnboardingAccessRequestResponse,
      { email: string; orgCode: string; name?: string }
    >({
      query: ({ email, orgCode, name }) => ({
        url: "/onboarding/access-request",
        method: "POST",
        body: {
          email: email.trim().toLowerCase(),
          org_code: orgCode.trim().toUpperCase(),
          ...(name?.trim() ? { name: name.trim() } : {}),
        },
      }),
      invalidatesTags: ["Onboarding"],
    }),
    reviewOrgAccessRequest: builder.mutation<
      ReviewOrgAccessRequestResponse,
      {
        requestId: number;
        action: "approve" | "reject";
        role: "Admin" | "Site Engineer" | "Site Inspector" | "Worker/Contractor";
      }
    >({
      query: ({ requestId, action, role }) => ({
        url: `/onboarding/access-requests/${requestId}/review`,
        method: "PATCH",
        body: { action, role },
      }),
      invalidatesTags: ["Onboarding"],
    }),
    updateOnboardingStatus: builder.mutation<
      { message: string },
      { uuid: string; status: "approved" | "archived" | "submitted" }
    >({
      query: ({ uuid, status }) => ({
        url: `/onboarding/requests/${uuid}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Onboarding"],
    }),
    startOnboardingProcessing: builder.mutation<StartOnboardingProcessingResponse, string>({
      query: (uuid) => ({
        url: `/onboarding/requests/${uuid}/start-processing`,
        method: "POST",
      }),
      invalidatesTags: ["Onboarding"],
    }),
    deleteOnboardingRequest: builder.mutation<void, string>({
      query: (uuid) => ({ url: `/onboarding/requests/${uuid}`, method: "DELETE" }),
      invalidatesTags: ["Onboarding"],
    }),
    requestThetaPasswordResetOtp: builder.mutation<
      { status: string },
      { email: string; orgCode?: string }
    >({
      query: ({ email, orgCode }) => ({
        url: "/onboarding/password-reset/theta/request",
        method: "POST",
        body: {
          email: email.trim().toLowerCase(),
          ...(orgCode?.trim() ? { org_code: orgCode.trim().toUpperCase() } : {}),
        },
      }),
    }),
    confirmThetaPasswordReset: builder.mutation<
      { status: string },
      { email: string; otp: string; newPassword: string; orgCode?: string }
    >({
      query: ({ email, otp, newPassword, orgCode }) => ({
        url: "/onboarding/password-reset/theta/confirm",
        method: "POST",
        body: {
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          new_password: newPassword,
          ...(orgCode?.trim() ? { org_code: orgCode.trim().toUpperCase() } : {}),
        },
      }),
    }),
    resetThetaPasswordDirect: builder.mutation<
      { status: string },
      { email: string; newPassword: string; orgCode?: string }
    >({
      query: ({ email, newPassword, orgCode }) => ({
        url: "/onboarding/password-reset/theta/direct",
        method: "POST",
        body: {
          email: email.trim().toLowerCase(),
          new_password: newPassword,
          ...(orgCode?.trim() ? { org_code: orgCode.trim().toUpperCase() } : {}),
        },
      }),
    }),
  }),
});

export const {
  useGetOnboardingAccessProfileQuery,
  useGetOnboardingLayerOptionsQuery,
  useGetRequestStatusByEmailQuery,
  useGetOnboardingProcessingQueueQuery,
  useGetOrgAccessRequestsQuery,
  useSubmitClientOnboardingMutation,
  useLoginWithThetaCredentialsMutation,
  useSubmitOnboardingAccessRequestMutation,
  useReviewOrgAccessRequestMutation,
  useUpdateOnboardingStatusMutation,
  useStartOnboardingProcessingMutation,
  useDeleteOnboardingRequestMutation,
  useRequestThetaPasswordResetOtpMutation,
  useConfirmThetaPasswordResetMutation,
  useResetThetaPasswordDirectMutation,
} = onboardingApi;
