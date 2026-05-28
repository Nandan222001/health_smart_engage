import json
from app.core.config import settings


HSE_SYSTEM_PROMPT = """You are an expert HSE (Health, Safety & Environment) AI assistant embedded in an enterprise safety platform.
Your expertise covers ISO 45001, OSHA, RIDDOR, ISO 14001, EPA regulations, and global safety standards.
Be concise, practical, and always prioritise worker safety and regulatory compliance.
When referencing data provided, cite specific numbers. Respond in clear structured paragraphs."""


def _make_anthropic_client():
    if not settings.anthropic_api_key:
        return None
    try:
        import anthropic
        kwargs: dict = {"api_key": settings.anthropic_api_key}
        if settings.anthropic_base_url:
            kwargs["base_url"] = settings.anthropic_base_url
            kwargs["default_headers"] = {"api-key": settings.anthropic_api_key}
        return anthropic.Anthropic(**kwargs)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to initialize Anthropic client: {e}")
        return None


def _make_azure_client():
    if not settings.azure_openai_api_key or not settings.azure_openai_endpoint:
        return None
    try:
        from openai import AzureOpenAI
        return AzureOpenAI(
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
            azure_endpoint=settings.azure_openai_endpoint,
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to initialize Azure OpenAI client: {e}")
        return None


class AiService:
    def __init__(self):
        self._anthropic = _make_anthropic_client()
        self._azure = _make_azure_client()

    @property
    def is_configured(self) -> bool:
        return self._anthropic is not None or self._azure is not None

    @property
    def provider(self) -> str:
        if self._azure:
            return "Azure AI Foundry"
        if self._anthropic:
            return "Anthropic Claude"
        return "Not Configured"

    @property
    def model(self) -> str:
        if self._azure:
            return settings.azure_openai_deployment
        return settings.anthropic_model or "claude-sonnet-4-6"

    # ── Core chat ─────────────────────────────────────────────────────────────

    def chat(self, messages: list[dict], extra_context: str = "") -> dict:
        if not self.is_configured:
            return {
                "content": (
                    "AI service is not configured.\n\n"
                    "Add one of these to your backend `.env`:\n\n"
                    "**Option A: Azure AI Foundry (Preferred)**\n"
                    "```\n"
                    "AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/\n"
                    "AZURE_OPENAI_API_KEY=<your-key>\n"
                    "AZURE_OPENAI_DEPLOYMENT=gpt-4o\n"
                    "```\n\n"
                    "**Option B: Anthropic Claude**\n"
                    "```\n"
                    "ANTHROPIC_API_KEY=<your-key>\n"
                    "ANTHROPIC_MODEL=claude-sonnet-4-6\n"
                    "```"
                ),
                "model": "not_configured",
                "finish_reason": "not_configured",
                "configured": False,
            }

        system_content = HSE_SYSTEM_PROMPT
        if extra_context:
            system_content += f"\n\nLive platform data:\n{extra_context}"

        # Prepare messages for the specific provider
        if self._azure:
            return self._chat_azure(messages, system_content)
        return self._chat_anthropic(messages, system_content)

    def _chat_anthropic(self, messages: list[dict], system_content: str) -> dict:
        # Anthropic requires alternating user/assistant roles starting with 'user'
        anthropic_messages = []
        for m in messages:
            role = m.get("role")
            content = m.get("content")
            if role not in ("user", "assistant") or not content:
                continue
            if anthropic_messages and anthropic_messages[-1]["role"] == role:
                anthropic_messages[-1]["content"] += f"\n\n{content}"
                continue
            if not anthropic_messages and role != "user":
                continue
            anthropic_messages.append({"role": role, "content": content})

        if not anthropic_messages:
            return {"content": "I'm ready to help. What safety or compliance question do you have?", "model": self.model, "finish_reason": "no_user_messages", "configured": True}

        try:
            resp = self._anthropic.messages.create(
                model=self.model,
                system=system_content,
                messages=anthropic_messages,
                max_tokens=1500,
                temperature=0.7,
            )
            return {
                "content": resp.content[0].text if resp.content else "",
                "model": resp.model,
                "finish_reason": resp.stop_reason,
                "usage": {
                    "prompt_tokens": resp.usage.input_tokens,
                    "completion_tokens": resp.usage.output_tokens,
                    "total_tokens": resp.usage.input_tokens + resp.usage.output_tokens,
                },
                "configured": True,
            }
        except Exception as e:
            return {"content": f"Anthropic request failed: {e}", "model": self.model, "finish_reason": "error", "configured": True}

    def _chat_azure(self, messages: list[dict], system_content: str) -> dict:
        # Azure OpenAI (GPT) supports system messages in the array and is more lenient
        openai_messages = [{"role": "system", "content": system_content}]
        for m in messages:
            role = m.get("role")
            content = m.get("content")
            if role in ("user", "assistant", "system") and content:
                openai_messages.append({"role": role, "content": content})

        try:
            resp = self._azure.chat.completions.create(
                model=self.model,
                messages=openai_messages,
                max_tokens=1500,
                temperature=0.7,
            )
            return {
                "content": resp.choices[0].message.content or "",
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
            return {"content": f"Azure AI request failed: {e}", "model": self.model, "finish_reason": "error", "configured": True}

    # ── Structured analysis ───────────────────────────────────────────────────

    def analyze(self, prompt: str, context: dict | None = None, as_json: bool = False) -> str | dict:
        if not self.is_configured:
            return {} if as_json else "AI service not configured."

        user_content = prompt
        if context:
            user_content += f"\n\nData:\n{json.dumps(context, default=str)[:6000]}"
        if as_json:
            user_content += "\n\nRespond with valid JSON only, no markdown fences."

        if self._azure:
            try:
                resp = self._azure.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": HSE_SYSTEM_PROMPT},
                        {"role": "user", "content": user_content}
                    ],
                    max_tokens=2000,
                    temperature=0.3,
                )
                content = resp.choices[0].message.content or ""
            except Exception as e:
                return {} if as_json else f"Azure analyze failed: {e}"
        else:
            try:
                resp = self._anthropic.messages.create(
                    model=self.model,
                    system=HSE_SYSTEM_PROMPT,
                    messages=[{"role": "user", "content": user_content}],
                    max_tokens=2000,
                    temperature=0.3,
                )
                content = resp.content[0].text if resp.content else ""
            except Exception as e:
                return {} if as_json else f"Anthropic analyze failed: {e}"

        if as_json:
            cleaned = content.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            try:
                return json.loads(cleaned)
            except Exception:
                return {}
        return content

    # ── Knowledge search (keyword fallback) ───────────────────────────────────

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
