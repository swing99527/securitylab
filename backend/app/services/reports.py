"""
Report service layer
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from typing import Optional
from uuid import UUID
from datetime import datetime

from app.models import Report, Project, User
from app.schemas.reports import ReportCreate, ReportUpdate

async def generate_report_code(session: AsyncSession, project_id: UUID) -> str:
    """
    Generate unique report code: RPT-{PROJECT_CODE}-{NNN}
    Example: RPT-IOT-2025-0001-001
    """
    # Get project code
    project = await session.get(Project, project_id)
    if not project:
        raise ValueError("Project not found")
    
    project_code = project.code
    
    # Count existing reports for this project
    stmt = select(func.count(Report.id)).where(Report.project_id == project_id)
    result = await session.execute(stmt)
    count = result.scalar() or 0
    
    # Generate code
    sequence_num = count + 1
    report_code = f"RPT-{project_code}-{sequence_num:03d}"
    
    return report_code

async def create_report(
    session: AsyncSession,
    report_data: ReportCreate,
    author_id: UUID
) -> Report:
    """Create a new report"""
    # Generate unique code
    code = await generate_report_code(session, report_data.project_id)
    
    report = Report(
        code=code,
        title=report_data.title,
        project_id=report_data.project_id,
        version=report_data.version or "v1.0",
        content=report_data.content or {},
        author_id=author_id,
        status="draft"
    )
    
    session.add(report)
    await session.commit()
    await session.refresh(report)
    
    return report

async def get_report(session: AsyncSession, report_id: UUID) -> Optional[Report]:
    """Get report by ID with related data"""
    stmt = (
        select(Report)
        .options(
            selectinload(Report.project),
            selectinload(Report.author),
            selectinload(Report.reviewer)
        )
        .where(Report.id == report_id)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()

async def list_reports(
    session: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    project_id: Optional[UUID] = None,
    search: Optional[str] = None
):
    """List reports with pagination and filters"""
    # Build base query
    stmt = select(Report).options(
        selectinload(Report.project),
        selectinload(Report.author),
        selectinload(Report.reviewer)
    )
    
    # Apply filters
    conditions = []
    if status:
        conditions.append(Report.status == status)
    if project_id:
        conditions.append(Report.project_id == project_id)
    if search:
        conditions.append(
            Report.title.ilike(f"%{search}%") | 
            Report.code.ilike(f"%{search}%")
        )
    
    if conditions:
        stmt = stmt.where(and_(*conditions))
    
    # Get total count
    count_stmt = select(func.count(Report.id))
    if conditions:
        count_stmt = count_stmt.where(and_(*conditions))
    
    total_result = await session.execute(count_stmt)
    total = total_result.scalar()
    
    # Apply pagination
    stmt = stmt.order_by(Report.created_at.desc())
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    
    result = await session.execute(stmt)
    reports = result.scalars().all()
    
    return {
        "items": reports,
        "total": total,
        "page": page,
        "page_size": page_size
    }

async def update_report(
    session: AsyncSession,
    report_id: UUID,
    update_data: ReportUpdate
) -> Optional[Report]:
    """Update report"""
    report = await session.get(Report, report_id)
    if not report:
        return None
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(report, key, value)
    
    await session.commit()
    await session.refresh(report)
    
    return report

async def delete_report(session: AsyncSession, report_id: UUID) -> bool:
    """Delete report"""
    report = await session.get(Report, report_id)
    if not report:
        return False
    
    await session.delete(report)
    await session.commit()
    
    return True

async def submit_for_review(
    session: AsyncSession,
    report_id: UUID,
    reviewer_id: UUID
) -> Optional[Report]:
    """Submit report for review"""
    report = await session.get(Report, report_id)
    if not report or report.status != "draft":
        return None
    
    report.status = "pending_review"
    report.reviewer_id = reviewer_id
    
    await session.commit()
    await session.refresh(report)
    
    return report

async def approve_report(session: AsyncSession, report_id: UUID) -> Optional[Report]:
    """Approve report"""
    report = await session.get(Report, report_id)
    if not report or report.status != "pending_review":
        return None
    
    report.status = "approved"
    report.approved_at = datetime.utcnow()
    
    await session.commit()
    await session.refresh(report)
    
    return report

async def reject_report(
    session: AsyncSession,
    report_id: UUID,
    reason: Optional[str] = None
) -> Optional[Report]:
    """Reject report"""
    report = await session.get(Report, report_id)
    if not report or report.status != "pending_review":
        return None
    
    report.status = "rejected"
    if reason and report.content:
        report.content["rejection_reason"] = reason
    
    await session.commit()
    await session.refresh(report)
    
    return report
