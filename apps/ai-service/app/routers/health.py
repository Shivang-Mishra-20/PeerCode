from fastapi import APIRouter
from app.providers.ollama_provider import ollama_provider

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    health_data = await ollama_provider.check_health()
    return health_data
