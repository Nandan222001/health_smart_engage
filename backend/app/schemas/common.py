from typing import Any

from pydantic import BaseModel, Field


class ApiResponse(BaseModel):
    success: bool = True
    message: str = "OK"
    data: Any = None


class ErrorResponse(BaseModel):
    code: str
    message: str
    details: dict[str, Any] = Field(default_factory=dict)
    correlation_id: str | None = None
    timestamp: str


class CommandPayload(BaseModel):
    data: dict[str, Any] = Field(default_factory=dict)
    comment: str | None = None
    idempotency_key: str | None = None


class QueryResult(BaseModel):
    items: list[dict[str, Any]] = Field(default_factory=list)
    total: int = 0
    page: int = 1
    page_size: int = 25
