from app.services.key_vault_service import KeyVaultService


class AiService:
    def __init__(self):
        self.key_vault = KeyVaultService()

    def answer(self, question: str, context: dict | None = None) -> dict:
        if not question.strip():
            return {"answer": None, "citations": [], "status": "needs_human_escalation"}
        api_key = self.key_vault.get_secret("ai-api-key")
        if api_key:
            # Provider-specific implementation belongs here. The service boundary is ready for
            # Azure OpenAI, AI Foundry, or another approved model gateway.
            pass
        return {
            "answer": "AI provider integration is configured through AiService; source retrieval must supply approved knowledge passages.",
            "citations": context.get("citations", []) if context else [],
            "status": "draft",
        }

    def predictive_risk(self, area_id: str) -> dict:
        return {
            "areaId": area_id,
            "score": 0.0,
            "trend": [],
            "contributingFactors": [],
        }
