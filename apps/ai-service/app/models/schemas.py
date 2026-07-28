from pydantic import BaseModel, Field
from typing import List, Optional
from app.models.enums import AIOperation, Severity

class SelectionRange(BaseModel):
    start_line: int = Field(..., ge=1, description="Starting line number (1-indexed)")
    end_line: int = Field(..., ge=1, description="Ending line number (1-indexed)")

class ChatMessage(BaseModel):
    role: str = Field(..., description="Message role: 'user', 'assistant', or 'system'")
    content: str = Field(..., description="Message text content")

class AIGenerateRequest(BaseModel):
    operation: AIOperation = Field(..., description="Target AI operation")
    code: Optional[str] = Field(None, description="Active editor code content")
    language: Optional[str] = Field("typescript", description="Generic programming language string")
    scope: Optional[str] = Field("full_file", description="'full_file' or 'selection'")
    selection: Optional[SelectionRange] = Field(None, description="Selection line bounds")
    conversation: List[ChatMessage] = Field(default_factory=list, description="Chat message history")
    stream: bool = Field(default=True, description="Enable SSE token streaming")
    request_id: Optional[str] = Field(None, description="Unique correlation ID for tracing")

class AIRequest(BaseModel):
    request_id: str
    operation: AIOperation
    prompt: str
    system_prompt: str
    temperature: float = 0.2
    max_tokens: int = 4096
    stream: bool = True

class IssueItem(BaseModel):
    line: int = Field(..., description="Line number of issue (1-indexed)")
    severity: str = Field(..., description="'error', 'warning', or 'info'")
    message: str = Field(..., description="Description of the bug, security, or style issue")
    suggestion: Optional[str] = Field(None, description="Suggested fix snippet or guidance")

class RefactorItem(BaseModel):
    line_start: int = Field(..., description="Starting line")
    line_end: int = Field(..., description="Ending line")
    description: str = Field(..., description="Refactoring description")
    suggested_code: str = Field(..., description="Clean refactored code block")

class ResponseMetadata(BaseModel):
    requestId: str = Field(..., description="Correlation ID for request tracing")
    provider: str = Field(..., description="Provider name (e.g. 'ollama')")
    model: str = Field(..., description="Model identifier (e.g. 'qwen2.5-coder:7b')")
    durationMs: float = Field(..., description="Total processing latency in milliseconds")
    tokensGenerated: int = Field(..., description="Total output token count")

class AIGenerateResponse(BaseModel):
    summary: str = Field(..., description="High-level summary of analysis")
    issues: List[IssueItem] = Field(default_factory=list)
    refactor: List[RefactorItem] = Field(default_factory=list)
    code_output: Optional[str] = Field(None, description="Generated code or unit test suite")
    explanation: Optional[str] = Field(None, description="Detailed code explanation")
    metadata: ResponseMetadata
