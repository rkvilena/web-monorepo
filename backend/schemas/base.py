"""Base Pydantic schemas and utilities."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    """Base schema with common configuration."""

    model_config = ConfigDict(
        from_attributes=True,
        str_strip_whitespace=True,
    )


class TimestampSchema(BaseSchema):
    """Schema mixin for timestamp fields."""

    created_at: datetime
    updated_at: datetime


class PaginatedResponse(BaseSchema):
    """Generic paginated response schema."""

    items: list
    total: int
    page: int
    page_size: int
    total_pages: int


class MessageResponse(BaseSchema):
    """Simple message response schema."""

    message: str
    success: bool = True
