import json
from app.core.config import settings


HSE_SYSTEM_PROMPT = """You are an expert HSE (Health, Safety & Environment) AI assistant embedded in an enterprise safety platform.
Your expertise covers ISO 45001, OSHA, RIDDOR, ISO 14001, EPA regulations, and global safety standards.
Be concise, practical, and always prioritise worker safety and regulatory compliance.
When referencing data provided, cite specific numbers. Respond in clear structured paragraphs."""


def _make_client():
    if not (settings.azure_openai_endpoint and settings.azure_openai_api_key):
        return None
    try:
        from openai import AzureOpenAI
        return AzureOpenAI(
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
        )
    except Exception:
        return None


class AiService:
    def __init__(self):
        self._client = _make_client()

    @property
    def is_configured(self) -> bool:
        return self._client is not None

    @property
    def model(self) -> str:
        return settings.azure_openai_deployment or "gpt-4o"

    # ── Core chat ─────────────────────────────────────────────────────────────

    def chat(self, messages: list[dict], extra_context: str = "") -> dict:
        if not self._client:
            return {
                "content": (
                    "Azure AI Foundry is not configured.\n\n"
                    "Add these variables to your backend `.env`:\n"
                    "```\n"
                    "AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com/\n"
                    "AZURE_OPENAI_API_KEY=<your-key>\n"
                    "AZURE_OPENAI_DEPLOYMENT=gpt-4o\n"
                    "```"
                ),
                "model": "not_configured",
                "finish_reason": "not_configured",
                "configured": False,
            }

        system_content = HSE_SYSTEM_PROMPT
        if extra_context:
            system_content += f"\n\nLive platform data:\n{extra_context}"

        try:
            resp = self._client.chat.completions.create(
                model=self.model,
                messages=[{"role": "system", "content": system_content}] + messages,
                temperature=0.7,
                max_tokens=1500,
            )
            return {
                "content": resp.choices[0].message.content,
                "model": resp.model,
                "finish_reason": resp.choices[0].finish_reason,
                "usage": {
                    "prompt_tokens": resp.usage.prompt_tokens,
                    "completion_tokens": resp.usage.completion_tokens,
                    "total_tokens": resp.usage.total_tokens,
                },
                "configured": True,
            }
        except Exception as e:
            return {"content": f"AI request failed: {e}", "model": self.model, "finish_reason": "error", "configured": True}

    # ── Structured analysis ───────────────────────────────────────────────────

    def analyze(self, prompt: str, context: dict | None = None, as_json: bool = False) -> str | dict:
        if not self._client:
            return {} if as_json else "Azure AI Foundry not configured."
        user_content = prompt
        if context:
            user_content += f"\n\nData:\n{json.dumps(context, default=str)[:6000]}"
        kwargs: dict = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": HSE_SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            "temperature": 0.3,
            "max_tokens": 2000,
        }
        if as_json:
            kwargs["response_format"] = {"type": "json_object"}
        try:
            resp = self._client.chat.completions.create(**kwargs)
            content = resp.choices[0].message.content
            return json.loads(content) if as_json else content
        except Exception as e:
            return {} if as_json else str(e)

    # ── Knowledge search (keyword fallback when Azure Search not set) ─────────

    def knowledge_search(self, query: str, documents: list[dict]) -> list[dict]:
        if not documents:
            return []
        q = query.lower().split()
        scored = []
        for doc in documents:
            text = " ".join(str(v) for v in doc.values()).lower()
            score = sum(1 for w in q if w in text)
            if score > 0:
                scored.append({**doc, "_score": score})
        return sorted(scored, key=lambda x: x["_score"], reverse=True)[:10]

    # ── Legacy compatibility ──────────────────────────────────────────────────

    def answer(self, question: str, context: dict | None = None) -> dict:
        result = self.chat([{"role": "user", "content": question}])
        return {
            "answer": result.get("content"),
            "citations": context.get("citations", []) if context else [],
            "status": "answered" if result.get("finish_reason") not in ("error", "not_configured") else "needs_human_escalation",
        }

    def predictive_risk(self, area_id: str) -> dict:
        return {"areaId": area_id, "score": 0.0, "trend": [], "contributingFactors": []}
