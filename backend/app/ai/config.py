import json
import logging
import re
import time
from typing import Optional, Dict, Any

import groq
from app.core.config import settings

logger = logging.getLogger("pharmalens.ai")


class GroqClientManager:
    """Manages Groq API client lifecycle, parameters, and safe execution."""

    _client: Optional[groq.Groq] = None

    @classmethod
    def get_client(cls) -> Optional[groq.Groq]:
        if not settings.GROQ_API_KEY:
            return None
        if cls._client is None:
            cls._client = groq.Groq(
                api_key=settings.GROQ_API_KEY,
                timeout=settings.GROQ_TIMEOUT_SECONDS,
                max_retries=0,  # Manual retry with backoff
            )
        return cls._client

    @classmethod
    def is_configured(cls) -> bool:
        return bool(settings.GROQ_API_KEY and len(settings.GROQ_API_KEY.strip()) > 5)

    @classmethod
    def generate_chat_json(
        cls,
        system_prompt: str,
        user_prompt: str,
        model_override: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Executes chat completion with enforced JSON response mode.
        Paces calls to stay within the free-tier 1000 OTPM limit.
        Retries on transient rate limits with smart backoff.
        """
        client = cls.get_client()
        if not client:
            raise ValueError("Groq API key is not configured. Please set GROQ_API_KEY in server environment.")

        model = model_override or settings.GROQ_MODEL
        temp = temperature if temperature is not None else settings.AI_TEMPERATURE
        tok_limit = max_tokens if max_tokens is not None else settings.AI_MAX_OUTPUT_TOKENS

        # Qwen models emit <think>...</think> reasoning blocks — suppress them for clean JSON.
        effective_system = system_prompt
        if "qwen" in model.lower():
            effective_system = "/no_think\n\n" + system_prompt

        messages = [
            {"role": "system", "content": effective_system},
            {"role": "user", "content": user_prompt},
        ]

        # Free tier OTPM limit: 1000 tokens/min.
        # With tailored max_tokens (180-260), ~1.5s spacing prevents burst collision
        INTER_CALL_SLEEP = 1.5  # seconds between successful calls

        # Fast retry schedule for temporary rate limits
        RETRY_WAITS = [8, 15]

        last_error: Optional[Exception] = None

        for attempt, wait_before in enumerate([(0)] + RETRY_WAITS):
            if wait_before:
                logger.info("Rate limit backoff: waiting %ds for OTPM bucket (attempt %d)...", wait_before, attempt + 1)
                time.sleep(wait_before)

            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    response_format={"type": "json_object"},
                    temperature=temp,
                    max_tokens=tok_limit,
                )
                raw_content = response.choices[0].message.content or "{}"

                # Strip any leaked <think>...</think> reasoning blocks
                raw_content = re.sub(r"<think>.*?</think>", "", raw_content, flags=re.DOTALL).strip()
                if not raw_content:
                    raw_content = "{}"

                parsed = json.loads(raw_content)

                # Small pacing sleep to prevent rapid burst
                time.sleep(INTER_CALL_SLEEP)
                return parsed

            except json.JSONDecodeError as jde:
                logger.error("Groq response was not valid JSON: %s", str(jde))
                raise ValueError(f"AI provider returned unparseable output: {str(jde)}")

            except groq.AuthenticationError:
                logger.error("Groq authentication failure. Invalid API key.")
                raise PermissionError("AI provider authentication failed. Please verify GROQ_API_KEY configuration.")

            except groq.RateLimitError as rle:
                last_error = rle
                logger.warning(
                    "Groq OTPM rate limit hit (attempt %d/%d): %s",
                    attempt + 1, len(RETRY_WAITS) + 1, str(rle)[:200]
                )
                if attempt >= len(RETRY_WAITS):
                    break  # All retries exhausted
                continue  # Wait is applied at top of loop

            except groq.APITimeoutError:
                logger.warning("Groq request timed out after %s seconds.", settings.GROQ_TIMEOUT_SECONDS)
                raise TimeoutError("AI inference request timed out. Please try again.")

            except Exception as e:
                logger.error("Groq API request error: %s", type(e).__name__)
                raise RuntimeError(f"AI generation failed: {type(e).__name__}")

        raise RuntimeError("AI provider rate limit reached after retries. Please wait a moment before retrying.")
