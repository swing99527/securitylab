"""
Pydantic schemas for task management
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid


# Request Schemas
class TaskCreate(BaseModel):
    """Create new task"""
    name: str = Field(..., min_length=1, max_length=200)
    type: str = Field(..., description="Task type: nmap_scan, vuln_scan, firmware_analysis, fuzzing, pentest")
    project_id: uuid.UUID
    sample_id: Optional[uuid.UUID] = None
    config: Dict[str, Any] = Field(default_factory=dict, description="JSONB configuration")
    priority: str = Field(default="medium", description="Priority: low, medium, high, urgent")
    assignee_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None


class TaskUpdate(BaseModel):
    """Update existing task"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    status: Optional[str] = None  # queued, running, paused, completed, failed, cancelled
    priority: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    assignee_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None


class TaskExecute(BaseModel):
    """Execute task request"""
    force: bool = Field(default=False, description="Force execution even if already running")


class TaskQuery(BaseModel):
    """Query parameters for listing tasks"""
    status: Optional[str] = None
    type: Optional[str] = None
    project_id: Optional[uuid.UUID] = None
    sample_id: Optional[uuid.UUID] = None
    assignee_id: Optional[uuid.UUID] = None
    search: Optional[str] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


# Response Schemas
class TaskResponse(BaseModel):
    """Basic task response"""
    id: uuid.UUID
    code: str
    name: str
    type: str
    status: str
    priority: str
    progress: int
    project_id: uuid.UUID
    sample_id: Optional[uuid.UUID]
    assignee_id: Optional[uuid.UUID]
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TaskDetail(TaskResponse):
    """Detailed task with config and results"""
    config: Dict[str, Any]
    notes: Optional[str]
    celery_task_id: Optional[str]
    project_name: str
    sample_code: Optional[str]
    assignee_name: Optional[str]
    result_count: int = 0
    vulnerability_count: int = 0


class TaskListResponse(BaseModel):
    """Paginated task list"""
    items: List[TaskResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class TaskResultResponse(BaseModel):
    """Task execution result"""
    task_id: uuid.UUID
    task_code: str
    status: str
    progress: int
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    duration_seconds: Optional[int]
    message: Optional[str]


class ScanResultCreate(BaseModel):
    """Create scan result"""
    task_id: uuid.UUID
    result_data: Dict[str, Any]
    severity: str = "medium"  # low, medium, high, critical
    score: Optional[int] = Field(None, ge=0, le=100)
