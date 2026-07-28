from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any
from app.models.schemas import AIRequest

class AIProvider(ABC):
    @abstractmethod
    async def generate_stream(
        self, request: AIRequest
    ) -> AsyncGenerator[str, None]:
        """Stream raw text tokens asynchronously from the LLM provider."""
        pass

    @abstractmethod
    async def check_health(self) -> Dict[str, Any]:
        """Return provider health status, latency, and model availability."""
        pass
