from fastapi import APIRouter

from app.api.v1.route_factory import register_catalog_routes

router = APIRouter()

ENDPOINTS = [
    ("POST", "/ai/advisor/query", "ai_advisor_query", "Ask AI advisor"),
    ("GET", "/ai/advisor/conversations", "ai_advisor_conversations", "List AI conversations"),
    ("GET", "/ai/advisor/conversations/{conversationId}", "ai_advisor_conversation_get", "AI conversation detail"),
    ("POST", "/ai/advisor/responses/{responseId}/feedback", "ai_advisor_feedback", "Submit AI feedback"),
    ("POST", "/ai/advisor/escalations", "ai_advisor_escalations", "Escalate unanswered question"),
    ("POST", "/ai/knowledge/index", "ai_knowledge_index", "Index knowledge document"),
    ("POST", "/ai/knowledge/reindex", "ai_knowledge_reindex", "Rebuild knowledge index"),
    ("GET", "/ai/knowledge/sources", "ai_knowledge_sources", "List indexed sources"),
    ("POST", "/ai/knowledge/search", "ai_knowledge_search", "Semantic source search"),
    ("POST", "/ai/knowledge/sources/{sourceId}/disable", "ai_knowledge_source_disable", "Disable AI source"),
    ("GET", "/ai/predictive-risk/areas", "ai_predictive_risk_areas", "List work area risk scores"),
    ("GET", "/ai/predictive-risk/areas/{areaId}", "ai_predictive_risk_area_get", "Work area risk detail"),
    ("GET", "/ai/predictive-risk/areas/{areaId}/contributors", "ai_predictive_risk_contributors", "Risk contributors"),
    ("POST", "/ai/predictive-risk/recalculate", "ai_predictive_risk_recalculate", "Recalculate predictive risk"),
    ("GET", "/ai/predictive-risk/model-status", "ai_predictive_risk_model_status", "Predictive model status"),
    ("POST", "/ai/audits/{auditId}/insights", "ai_audit_insights_generate", "Generate audit insights"),
    ("GET", "/ai/audits/{auditId}/insights", "ai_audit_insights_get", "Get audit insights"),
    ("POST", "/ai/risks/recommended-controls", "ai_risk_recommended_controls", "Recommend risk controls"),
    ("POST", "/ai/capas/recommend-actions", "ai_capa_recommend_actions", "Recommend CAPA actions"),
    ("POST", "/ai/incidents/leading-indicators", "ai_incident_leading_indicators", "Detect leading indicators"),
    ("POST", "/ai/briefings/weekly/generate", "ai_weekly_briefing_generate", "Generate weekly briefing"),
    ("GET", "/ai/briefings/weekly/latest", "ai_weekly_briefing_latest", "Latest weekly briefing"),
    ("POST", "/ai/briefings/{briefingId}/approve", "ai_briefing_approve", "Approve briefing"),
    ("POST", "/ai/briefings/{briefingId}/publish", "ai_briefing_publish", "Publish briefing"),
    ("GET", "/ai/governance/logs", "ai_governance_logs", "AI governance logs"),
    ("GET", "/ai/governance/unsupported-questions", "ai_governance_unsupported_questions", "Unsupported AI questions"),
    ("POST", "/ai/governance/review-items/{itemId}/resolve", "ai_governance_review_resolve", "Resolve AI review item"),
    ("GET", "/ai/governance/model-cards", "ai_governance_model_cards", "AI model cards"),
]

register_catalog_routes(router, "ai", ENDPOINTS)
