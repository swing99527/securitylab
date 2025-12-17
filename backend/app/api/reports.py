"""
Report API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Generic, TypeVar
from uuid import UUID
from pydantic import BaseModel

from app.core.deps import get_current_user, get_db
from app.schemas.reports import (
    ReportCreate,
    ReportUpdate,
    ReportResponse,
    ReportListParams,
    ReportDetail
)
from app.services import reports as report_service
from app.models import User

# Generic paginated response
T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int

router = APIRouter(prefix="/reports", tags=["reports"])

@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    report_data: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new report"""
    try:
        report = await report_service.create_report(db, report_data, current_user.id)
        
        # Build response
        return ReportResponse(
            id=report.id,
            code=report.code,
            title=report.title,
            project_id=report.project_id,
            version=report.version,
            status=report.status,
            content=report.content,
            author_id=report.author_id,
            author_name=report.author.name if report.author else None,
            created_at=report.created_at,
            updated_at=report.updated_at
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("", response_model=PaginatedResponse[ReportResponse])
async def list_reports(
    page: int = 1,
    page_size: int = 20,
    status_filter: str = None,
    project_id: UUID = None,
    search: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List reports with pagination and filters"""
    result = await report_service.list_reports(
        db,
        page=page,
        page_size=page_size,
        status=status_filter,
        project_id=project_id,
        search=search
    )
    
    items = [
        ReportResponse(
            id=r.id,
            code=r.code,
            title=r.title,
            project_id=r.project_id,
            version=r.version,
            status=r.status,
            content=r.content,
            author_id=r.author_id,
            author_name=r.author.name if r.author else None,
            reviewer_id=r.reviewer_id,
            reviewer_name=r.reviewer.name if r.reviewer else None,
            project_name=r.project.name if r.project else None,
            project_code=r.project.code if r.project else None,
            approved_at=r.approved_at,
            created_at=r.created_at,
            updated_at=r.updated_at
        )
        for r in result["items"]
    ]
    
    return PaginatedResponse(
        items=items,
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )

@router.get("/{report_id}", response_model=ReportDetail)
async def get_report(
    report_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get report detail"""
    report = await report_service.get_report(db, report_id)
    
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    
    return ReportDetail(
        id=report.id,
        code=report.code,
        title=report.title,
        project_id=report.project_id,
        version=report.version,
        status=report.status,
        content=report.content,
        author_id=report.author_id,
        author_name=report.author.name if report.author else None,
        reviewer_id=report.reviewer_id,
        reviewer_name=report.reviewer.name if report.reviewer else None,
        project_name=report.project.name if report.project else None,
        project_code=report.project.code if report.project else None,
        approved_at=report.approved_at,
        created_at=report.created_at,
        updated_at=report.updated_at
    )

@router.put("/{report_id}", response_model=ReportResponse)
async def update_report(
    report_id: UUID,
    update_data: ReportUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update report"""
    report = await report_service.update_report(db, report_id, update_data)
    
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    
    return ReportResponse(
        id=report.id,
        code=report.code,
        title=report.title,
        project_id=report.project_id,
        version=report.version,
        status=report.status,
        content=report.content,
        author_id=report.author_id,
        created_at=report.created_at,
        updated_at=report.updated_at
    )

@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    report_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete report"""
    success = await report_service.delete_report(db, report_id)
    
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    
    return None

@router.post("/{report_id}/submit", response_model=ReportResponse)
async def submit_report(
    report_id: UUID,
    reviewer_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit report for review"""
    report = await report_service.submit_for_review(db, report_id, reviewer_id)
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Report not found or not in draft status"
        )
    
    return ReportResponse(
        id=report.id,
        code=report.code,
        title=report.title,
        project_id=report.project_id,
        version=report.version,
        status=report.status,
        content=report.content,
        author_id=report.author_id,
        reviewer_id=report.reviewer_id,
        created_at=report.created_at,
        updated_at=report.updated_at
    )

@router.post("/{report_id}/approve", response_model=ReportResponse)
async def approve_report(
    report_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Approve report"""
    report = await report_service.approve_report(db, report_id)
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Report not found or not in pending_review status"
        )
    
    return ReportResponse(
        id=report.id,
        code=report.code,
        title=report.title,
        project_id=report.project_id,
        version=report.version,
        status=report.status,
        content=report.content,
        author_id=report.author_id,
        approved_at=report.approved_at,
        created_at=report.created_at,
        updated_at=report.updated_at
    )

@router.post("/{report_id}/reject", response_model=ReportResponse)
async def reject_report(
    report_id: UUID,
    reason: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Reject report"""
    report = await report_service.reject_report(db, report_id, reason)
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Report not found or not in pending_review status"
        )
    
    return ReportResponse(
        id=report.id,
        code=report.code,
        title=report.title,
        project_id=report.project_id,
        version=report.version,
        status=report.status,
        content=report.content,
        author_id=report.author_id,
        created_at=report.created_at,
        updated_at=report.updated_at
    )


# Section update schema
class SectionUpdateRequest(BaseModel):
    content: str


@router.patch("/{report_id}/sections/{section_id}")
async def update_section_content(
    report_id: UUID,
    section_id: str,
    update_data: SectionUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a specific section's content in a report"""
    from datetime import datetime
    
    # Get report
    report = await report_service.get_report_by_id(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Recursive function to update section in tree
    def update_section_in_tree(sections: list, target_id: str, new_content: str) -> bool:
        """Recursively search and update section content"""
        for section in sections:
            if section.get('id') == target_id:
                section['content'] = new_content
                # Add last_modified timestamp
                section['last_modified'] = datetime.now().isoformat()
                return True
            # Check subsections
            if 'subsections' in section and section['subsections']:
                if update_section_in_tree(section['subsections'], target_id, new_content):
                    return True
        return False
    
    # Update content
    content = report.content.copy() if report.content else {}
    
    if 'sections' not in content or not content['sections']:
        raise HTTPException(status_code=400, detail="Report has no sections")
    
    # Try to update the section
    updated = update_section_in_tree(content['sections'], section_id, update_data.content)
    
    if not updated:
        raise HTTPException(status_code=404, detail=f"Section {section_id} not found")
    
    # Update report metadata
    if 'metadata' not in content:
        content['metadata'] = {}
    content['metadata']['last_modified'] = datetime.now().isoformat()
    
    # Save to database
    report.content = content
    report.updated_at = datetime.now()
    await db.commit()
    await db.refresh(report)
    
    return {
        "success": True,
        "message": "Section content updated successfully",
        "section_id": section_id
    }
