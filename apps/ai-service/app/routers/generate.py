from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse
from app.models.schemas import AIGenerateRequest
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api/v1/ai", tags=["AI Generation"])

@router.post("/generate")
async def generate_ai_response(request: AIGenerateRequest):
    return EventSourceResponse(
        ai_service.stream_generate_events(request)
    )
