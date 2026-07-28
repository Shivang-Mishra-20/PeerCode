import time
import json
import uuid
import re
from typing import AsyncGenerator
from app.models.schemas import (
    AIGenerateRequest,
    AIRequest,
    AIGenerateResponse,
    ResponseMetadata,
    IssueItem,
)
from app.providers.ollama_provider import ollama_provider
from app.services.prompt_service import prompt_service
from app.config import settings

class AIService:
    def __init__(self):
        self.provider = ollama_provider

    async def stream_generate_events(
        self, request: AIGenerateRequest
    ) -> AsyncGenerator[dict, None]:
        request_id = request.request_id or f"req-{uuid.uuid4().hex[:8]}"
        start_time = time.time()

        # Emit initial status event
        yield {
            "event": "status",
            "data": json.dumps({"stage": "generating", "requestId": request_id}),
        }

        try:
            system_prompt, user_prompt = prompt_service.build_prompts(request)

            ai_req = AIRequest(
                request_id=request_id,
                operation=request.operation,
                prompt=user_prompt,
                system_prompt=system_prompt,
                temperature=settings.TEMPERATURE,
                max_tokens=settings.MAX_TOKENS,
                stream=True,
            )

            accumulated_tokens = []
            token_count = 0

            # Stream token chunks from provider
            async for token in self.provider.generate_stream(ai_req):
                accumulated_tokens.append(token)
                token_count += 1
                yield {
                    "event": "token",
                    "data": json.dumps({"text": token}),
                }

            duration_ms = round((time.time() - start_time) * 1000, 2)
            raw_text = "".join(accumulated_tokens).strip()

            # Clean markdown JSON block wrappers if model includes them
            cleaned_text = raw_text
            if cleaned_text.startswith("```"):
                cleaned_text = re.sub(r"^```[a-zA-Z]*\n?", "", cleaned_text)
                cleaned_text = re.sub(r"\n?```$", "", cleaned_text).strip()

            # Attempt JSON validation
            parsed_response: AIGenerateResponse
            try:
                data = json.loads(cleaned_text)
                metadata = ResponseMetadata(
                    requestId=request_id,
                    provider="ollama",
                    model=settings.OLLAMA_MODEL,
                    durationMs=duration_ms,
                    tokensGenerated=token_count,
                )
                data["metadata"] = metadata.model_dump()
                parsed_response = AIGenerateResponse(**data)
            except Exception as parse_err:
                # Fallback to plain summary if model output is non-JSON
                parsed_response = AIGenerateResponse(
                    summary=raw_text or "Analysis completed successfully.",
                    issues=[],
                    refactor=[],
                    metadata=ResponseMetadata(
                        requestId=request_id,
                        provider="ollama",
                        model=settings.OLLAMA_MODEL,
                        durationMs=duration_ms,
                        tokensGenerated=token_count,
                    ),
                )

            # Emit final completion event
            yield {
                "event": "complete",
                "data": json.dumps(parsed_response.model_dump()),
            }

        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"message": str(e), "requestId": request_id}),
            }

ai_service = AIService()
