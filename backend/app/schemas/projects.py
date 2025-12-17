"""
Pydantic schemas for project management
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid


# Request Schemas
class ProjectCreate(BaseModel):
    """Create new project"""
    name: str = Field(..., min_length=1, max_length=200)
    client: str = Field(..., min_length=1, max_length=200)  # Changed from description
    standard: str = Field(..., max_length=50)  # Changed from compliance_standards list
    manager_id: uuid.UUID
    deadline: Optional[datetime] = None


class ProjectUpdate(BaseModel):
    """Update existing project"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    client: Optional[str] = Field(None, min_length=1, max_length=200)
    standard: Optional[str] = None
    status: Optional[str] = None  # pending, in_progress, review, completed, archived
    deadline: Optional[datetime] = None


class ProjectMemberAdd(BaseModel):
    """Add member to project"""
    user_id: uuid.UUID
    role: str = "member"  # manager, member, reviewer


class ProjectQuery(BaseModel):
    """Query parameters for listing projects"""
    status: Optional[str] = None
    manager_id: Optional[uuid.UUID] = None
    search: Optional[str] = None  # Search in name/description
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


# Response Schemas
class ProjectResponse(BaseModel):
    """Basic project response"""
    id: uuid.UUID
    code: str
    name: str
    client: str
    standard: str
    status: str
    progress: int = 0
    manager_id: uuid.UUID
    deadline: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ProjectMemberResponse(BaseModel):
    """Project member info"""
    user_id: uuid.UUID
    user_name: str
    user_email: str
    role: str
    added_at: datetime


class ProjectDetail(ProjectResponse):
    """Detailed project with members and stats"""
    manager_name: str
    members: List[ProjectMemberResponse] = []
    sample_count: int = 0
    task_count: int = 0
    completed_task_count: int = 0


class ProjectListResponse(BaseModel):
    """Paginated project list"""
    items: List[ProjectResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ComplianceMatrixItem(BaseModel):
    """Compliance matrix entry"""
    requirement_id: str
    requirement_title: str
    status: str  # not_started, in_progress, completed
    evidence: Optional[str] = None
    notes: Optional[str] = None


class ComplianceMatrixResponse(BaseModel):
    """Compliance matrix for project"""
    project_id: uuid.UUID
    project_code: str
    standard: str
    items: List[ComplianceMatrixItem]
    completion_percentage: float
    generated_at: datetime
