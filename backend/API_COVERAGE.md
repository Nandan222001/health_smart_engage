# Backend API Coverage

This document maps the API catalog into the FastAPI backend implementation.

## Summary

| API Group | Backend Module | Catalog Routes | Explicit Routes | Total Runtime Routes | Status |
|---|---|---:|---:|---:|---|
| Web APIs | `app/api/v1/routes/web.py` | 74 | 0 | 74 | Implemented |
| Mobile APIs | `app/api/v1/routes/mobile.py` | 40 | 0 | 40 | Implemented |
| Admin APIs | `app/api/v1/routes/admin.py` | 40 | 0 | 40 | Implemented |
| Integration APIs | `app/api/v1/routes/integrations.py` | 24 | 0 | 24 | Implemented |
| AI APIs | `app/api/v1/routes/ai.py` | 28 | 0 | 28 | Implemented |
| Shared Platform APIs | `app/api/v1/routes/shared.py` | 30 | 2 | 32 | Implemented |
| Total | `app/api/v1/router.py` | 236 | 2 | 238 | Implemented |

## Implementation Pattern

All catalog routes are registered through `register_catalog_routes`.

Request flow:

```text
Route -> CatalogController -> CatalogEndpointService -> RBAC -> BusinessRuleService -> DomainDispatcher -> Repository/Audit
```

## Implemented Backend Concerns

| Concern | Implementation |
|---|---|
| API routing | All catalog route paths are registered under `/api/v1` |
| MVC controller boundary | `app/controllers/catalog_controller.py` |
| Business services | `app/services/*` |
| Repositories | `app/repositories/*` |
| Domain models | `app/models/domain.py` |
| MySQL schema | `migrations/versions/0001_initial.py` |
| RBAC | `app/core/rbac.py` |
| JWT validation | `app/core/security.py` |
| Audit logging | `AuditService` and `AuditLogRepository` |
| Business validations | `BusinessRuleService` |
| Workflow transitions | `WorkflowService` |
| Azure Blob upload targets | `FileStorageService` |
| Azure Key Vault secrets | `KeyVaultService` |
| Notifications | `NotificationService` |
| Reports | `ReportService` |
| Mobile offline sync | `MobileSyncService` |
| AI advisor/predictive hooks | `AiService` |

## Notes

The API surface is implemented and wired. Provider-backed behavior such as real Azure credentials, notification provider delivery, report rendering engines, and production AI model calls are controlled by environment configuration and deployment integration.
