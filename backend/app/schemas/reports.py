"""
Pydantic schemas for reports
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class ReportBase(BaseModel):
    """Base schema for reports"""
    title: str = Field(..., min_length=1, max_length=200)
    project_id: UUID
    version: Optional[str] = "v1.0"
    content: Optional[dict] = None

class ReportCreate(ReportBase):
    """Schema for creating a report"""
    pass

class ReportUpdate(BaseModel):
    """Schema for updating a report"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    version: Optional[str] = None
    status: Optional[str] = None
    content: Optional[dict] = None
    reviewer_id: Optional[UUID] = None

class ReportResponse(ReportBase):
    """Schema for report response"""
    id: UUID
    code: str
    status: str
    author_id: UUID
    author_name: Optional[str] = None
    reviewer_id: Optional[UUID] = None
    reviewer_name: Optional[str] = None
    project_name: Optional[str] = None
    project_code: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ReportListParams(BaseModel):
    """Schema for report list query parameters"""
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
    status: Optional[str] = None
    project_id: Optional[UUID] = None
    search: Optional[str] = None

class ReportDetail(ReportResponse):
    """Schema for detailed report response"""
    # Can include additional fields like related tasks, vulnerabilities, etc
    pass
