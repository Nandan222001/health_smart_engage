# AI APIs

APIs for the AI Safety Advisor, predictive intelligence, audit insights, recommended controls, and weekly safety briefings.

## AI Advisor APIs

| Method | Endpoint | Purpose | Required Controls |
|---|---|---|---|
| POST | `/api/v1/ai/advisor/query` | Ask HSE question against approved knowledge | Source citation, logging |
| GET | `/api/v1/ai/advisor/conversations` | List conversations | User/role scoping |
| GET | `/api/v1/ai/advisor/conversations/{conversationId}` | Conversation detail | Access controlled |
| POST | `/api/v1/ai/advisor/responses/{responseId}/feedback` | Submit answer feedback | Quality review |
| POST | `/api/v1/ai/advisor/escalations` | Escalate unanswered question to expert | Human owner required |

## Knowledge Retrieval APIs

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| POST | `/api/v1/ai/knowledge/index` | Index approved knowledge document | Document Controller/System |
| POST | `/api/v1/ai/knowledge/reindex` | Rebuild knowledge index | Admin only |
| GET | `/api/v1/ai/knowledge/sources` | List indexed sources | Includes version |
| POST | `/api/v1/ai/knowledge/search` | Semantic source search | Returns cited passages |
| POST | `/api/v1/ai/knowledge/sources/{sourceId}/disable` | Disable source from AI retrieval | Audited |

## Predictive Risk APIs

| Method | Endpoint | Purpose | Consumers |
|---|---|---|---|
| GET | `/api/v1/ai/predictive-risk/areas` | List work area risk scores | Dashboard, mobile |
| GET | `/api/v1/ai/predictive-risk/areas/{areaId}` | Work area risk detail | Plant Manager |
| GET | `/api/v1/ai/predictive-risk/areas/{areaId}/contributors` | Top contributing factors | Safety Manager |
| POST | `/api/v1/ai/predictive-risk/recalculate` | Trigger risk score recalculation | Admin/Data |
| GET | `/api/v1/ai/predictive-risk/model-status` | Model status and last run | Data/AI team |

## AI Audit and CAPA APIs

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| POST | `/api/v1/ai/audits/{auditId}/insights` | Generate audit insights | After audit completion |
| GET | `/api/v1/ai/audits/{auditId}/insights` | Retrieve audit insights | Linked to findings |
| POST | `/api/v1/ai/risks/recommended-controls` | Recommend controls for hazard/risk | Source-grounded |
| POST | `/api/v1/ai/capas/recommend-actions` | Recommend CAPA actions | Human approval required |
| POST | `/api/v1/ai/incidents/leading-indicators` | Detect leading indicators | Uses observations/near misses |

## AI Briefing APIs

| Method | Endpoint | Purpose | Output |
|---|---|---|---|
| POST | `/api/v1/ai/briefings/weekly/generate` | Generate weekly briefing | Draft briefing |
| GET | `/api/v1/ai/briefings/weekly/latest` | Latest approved briefing | JSON/PDF |
| POST | `/api/v1/ai/briefings/{briefingId}/approve` | Approve briefing | Executive/Safety Manager |
| POST | `/api/v1/ai/briefings/{briefingId}/publish` | Publish briefing | Email/dashboard |

## AI Governance APIs

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| GET | `/api/v1/ai/governance/logs` | AI usage and quality logs | Restricted |
| GET | `/api/v1/ai/governance/unsupported-questions` | Questions AI could not answer | Expert assignment |
| POST | `/api/v1/ai/governance/review-items/{itemId}/resolve` | Resolve quality review item | Audited |
| GET | `/api/v1/ai/governance/model-cards` | Model card and version information | Compliance review |
