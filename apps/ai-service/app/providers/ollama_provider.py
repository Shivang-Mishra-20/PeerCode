import time
import json
import httpx
from typing import AsyncGenerator, Dict, Any
from app.providers.base import AIProvider
from app.models.schemas import AIRequest
from app.config import settings

class OllamaProvider(AIProvider):
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip('/')
        self.model = settings.OLLAMA_MODEL
        self.timeout = httpx.Timeout(settings.REQUEST_TIMEOUT_SECONDS, connect=5.0)

    async def generate_stream(
        self, request: AIRequest
    ) -> AsyncGenerator[str, None]:
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": request.prompt,
            "system": request.system_prompt,
            "stream": True,
            "options": {
                "temperature": request.temperature,
                "num_predict": request.max_tokens,
            },
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                async with client.stream("POST", url, json=payload) as response:
                    if response.status_code != 200:
                        error_body = await response.aread()
                        raise Exception(
                            f"Ollama returned HTTP {response.status_code}: {error_body.decode('utf-8')}"
                        )

                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        try:
                            data = json.loads(line)
                            chunk = data.get("response", "")
                            if chunk:
                                yield chunk
                            if data.get("done", False):
                                break
                        except json.JSONDecodeError:
                            continue
            except httpx.ConnectError:
                raise Exception(
                    f"Could not connect to Ollama daemon at {self.base_url}. Please verify Ollama is running."
                )

    async def check_health(self) -> Dict[str, Any]:
        start_time = time.time()
        url = f"{self.base_url}/api/tags"

        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
            try:
                response = await client.get(url)
                latency_ms = round((time.time() - start_time) * 1000, 2)

                if response.status_code == 200:
                    data = response.json()
                    models = [m.get("name") for m in data.get("models", [])]
                    model_available = any(self.model in m for m in models)

                    return {
                        "status": "healthy" if model_available else "degraded",
                        "provider": "ollama",
                        "model": self.model,
                        "available": model_available,
                        "responseTimeMs": latency_ms,
                        "installedModels": models,
                    }
                else:
                    return {
                        "status": "unhealthy",
                        "provider": "ollama",
                        "model": self.model,
                        "available": False,
                        "responseTimeMs": latency_ms,
                        "error": f"Ollama HTTP {response.status_code}",
                    }
            except Exception as e:
                return {
                    "status": "unhealthy",
                    "provider": "ollama",
                    "model": self.model,
                    "available": False,
                    "responseTimeMs": 0.0,
                    "error": str(e),
                }

ollama_provider = OllamaProvider()
