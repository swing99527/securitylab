"""
Pydantic schemas for sample management
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid


# Request Schemas
class SampleCreate(BaseModel):
    """Create new sample"""
    name: str = Field(..., min_length=1, max_length=200)
    model: str = Field(..., max_length=100)
    manufacturer: str = Field(..., max_length=200)
    project_id: uuid.UUID
    location: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class SampleUpdate(BaseModel):
    """Update existing sample"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    status: Optional[str] = None  # in_stock, in_use, returned, scrapped
    location: Optional[str] = None
    notes: Optional[str] = None


class SampleQuery(BaseModel):
    """Query parameters for listing samples"""
    status: Optional[str] = None
    project_id: Optional[uuid.UUID] = None
    search: Optional[str] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


# Response Schemas
class SampleResponse(BaseModel):
    """Basic sample response"""
    id: uuid.UUID
    code: str
    name: str
    model: str
    manufacturer: str
    status: str
    project_id: uuid.UUID
    location: Optional[str]
    qr_code_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SampleDetail(SampleResponse):
    """Detailed sample with project info"""
    notes: Optional[str]
    project_name: str
    project_code: str


class SampleListResponse(BaseModel):
    """Paginated sample list"""
    items: List[SampleResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class QRCodeResponse(BaseModel):
    """QR code generation response"""
    sample_id: uuid.UUID
    sample_code: str
    qr_code_url: str
    generated_at: datetime
