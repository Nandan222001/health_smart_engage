from fastapi import APIRouter

from app.api.v1.route_factory import register_catalog_routes

router = APIRouter()

ENDPOINTS = [
    ("POST", "/integrations/hr/employees/upsert", "integrations_hr_employees_upsert", "Upsert employees"),
    ("POST", "/integrations/hr/departments/upsert", "integrations_hr_departments_upsert", "Upsert departments"),
    ("POST", "/integrations/hr/shifts/upsert", "integrations_hr_shifts_upsert", "Upsert shifts"),
    ("POST", "/integrations/procurement/vendors/upsert", "integrations_procurement_vendors_upsert", "Upsert vendors"),
    ("POST", "/integrations/assets/upsert", "integrations_assets_upsert", "Upsert assets"),
    ("POST", "/integrations/locations/upsert", "integrations_locations_upsert", "Upsert locations"),
    ("GET", "/integrations/webhooks/subscriptions", "integrations_webhooks_subscriptions_list", "List webhook subscriptions"),
    ("POST", "/integrations/webhooks/subscriptions", "integrations_webhooks_subscriptions_create", "Create webhook subscription"),
    ("PATCH", "/integrations/webhooks/subscriptions/{subscriptionId}", "integrations_webhooks_subscriptions_update", "Update webhook subscription"),
    ("DELETE", "/integrations/webhooks/subscriptions/{subscriptionId}", "integrations_webhooks_subscriptions_delete", "Disable webhook subscription"),
    ("POST", "/integrations/webhooks/subscriptions/{subscriptionId}/test", "integrations_webhooks_subscriptions_test", "Send test webhook"),
    ("GET", "/integrations/webhooks/deliveries", "integrations_webhook_deliveries", "Webhook delivery history"),
    ("POST", "/integrations/notifications/email/send", "integrations_notifications_email_send", "Send email"),
    ("POST", "/integrations/notifications/push/send", "integrations_notifications_push_send", "Send push"),
    ("POST", "/integrations/notifications/sms/send", "integrations_notifications_sms_send", "Send SMS"),
    ("GET", "/integrations/notifications/deliveries/{deliveryId}", "integrations_notification_delivery", "Notification delivery status"),
    ("POST", "/integrations/documents/upload-url", "integrations_documents_upload_url", "Create upload URL"),
    ("POST", "/integrations/documents/scan-callback", "integrations_documents_scan_callback", "Malware scan callback"),
    ("GET", "/integrations/documents/{documentId}/metadata", "integrations_documents_metadata", "Document metadata"),
    ("POST", "/integrations/documents/{documentId}/archive", "integrations_documents_archive", "Archive document"),
    ("GET", "/integrations/status", "integrations_status", "Integration health"),
    ("GET", "/integrations/jobs", "integrations_jobs_list", "Sync job list"),
    ("GET", "/integrations/jobs/{jobId}", "integrations_jobs_get", "Sync job detail"),
    ("POST", "/integrations/jobs/{jobId}/retry", "integrations_jobs_retry", "Retry sync job"),
]

register_catalog_routes(router, "integrations", ENDPOINTS)
