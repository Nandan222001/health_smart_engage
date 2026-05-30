from fastapi import APIRouter
from app.api.v1.route_factory import register_catalog_routes

router = APIRouter()

ENDPOINTS = [
    ("POST", "/", "onboarding_submit", "Submit client onboarding"),
    ("GET", "/requests", "onboarding_requests_list", "List onboarding requests"),
    ("GET", "/requests/{uuid}", "onboarding_requests_get", "Get onboarding request"),
    ("PATCH", "/requests/{uuid}/status", "onboarding_requests_update_status", "Update status"),
    ("DELETE", "/requests/{uuid}", "onboarding_requests_delete", "Delete request"),
    ("GET", "/processing-queue", "onboarding_processing_queue_list", "List processing queue"),
    ("POST", "/requests/{uuid}/start-processing", "onboarding_requests_start_processing", "Start processing"),
    ("GET", "/request-status", "onboarding_request_status_get", "Get status by email"),
    ("GET", "/layer-options", "onboarding_layer_options", "Get region layer options"),
    ("POST", "/requests/{uuid}/post-approval-setup", "onboarding_post_approval_setup", "Post-approval setup"),
    ("POST", "/requests/{uuid}/post-approval-files", "onboarding_post_approval_files", "Post-approval files"),
    ("POST", "/password-reset/theta/request", "onboarding_pw_reset_request", "Request password reset"),
    ("POST", "/password-reset/theta/confirm", "onboarding_pw_reset_confirm", "Confirm password reset"),
    ("POST", "/password-reset/theta/direct", "onboarding_pw_reset_direct", "Direct password reset"),
    ("POST", "/theta-auth/login", "onboarding_theta_login", "Theta direct login"),
    ("POST", "/access-request", "onboarding_access_request_submit", "Submit access request"),
    ("GET", "/access-requests", "onboarding_access_requests_list", "List access requests"),
    ("POST", "/access-requests/{requestId}/review", "onboarding_access_request_review", "Review access request"),
    ("GET", "/access-profile", "onboarding_access_profile_get", "Get access profile"),
]

register_catalog_routes(router, "onboarding", ENDPOINTS)
