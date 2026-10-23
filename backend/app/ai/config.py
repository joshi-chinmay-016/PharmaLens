import os
import json
import logging
from typing import Optional, Dict, Any, List
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
                max_retries=settings.GROQ_MAX_RETRIES,
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
    ) -> Dict[str, Any]:
        """
        Executes chat completion with enforced JSON response mode.
        Handles provider errors safely without exposing secrets.
        """
        client = cls.get_client()
        if not client:
            raise ValueError("Groq API key is not configured. Please set GROQ_API_KEY in server environment.")

        model = model_override or settings.GROQ_MODEL
        temp = temperature if temperature is not None else settings.AI_TEMPERATURE

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=temp,
                max_tokens=settings.AI_MAX_OUTPUT_TOKENS,
            )
            raw_content = response.choices[0].message.content or "{}"
            parsed = json.loads(raw_content)
            return parsed
        except json.JSONDecodeError as jde:
            logger.error("Groq response was not valid JSON: %s", str(jde))
            raise ValueError(f"AI provider returned unparseable output: {str(jde)}")
        except groq.AuthenticationError:
            logger.error("Groq authentication failure. Invalid API key.")
            raise PermissionError("AI provider authentication failed. Please verify GROQ_API_KEY configuration.")
        except groq.RateLimitError as rle:
            logger.warning("Groq rate limit exceeded: %s", str(rle))
            raise RuntimeError("AI provider rate limit reached. Please wait a moment before retrying.")
        except groq.APITimeoutError:
            logger.warning("Groq request timed out after %s seconds.", settings.GROQ_TIMEOUT_SECONDS)
            raise TimeoutError("AI inference request timed out. Please try again.")
        except Exception as e:
            logger.error("Groq API request error: %s", type(e).__name__)
            raise RuntimeError(f"AI generation failed: {type(e).__name__}")
