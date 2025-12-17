"""
Project management service layer
"""
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Tuple
from datetime import datetime
import uuid

from app.models.models import Project, User, Sample, Task
from app.schemas.projects import (
    ProjectCreate,
    ProjectUpdate,
    ProjectQuery,
    ProjectMemberResponse,
    ComplianceMatrixItem,
    ComplianceMatrixResponse
)


async def generate_project_code(db: AsyncSession) -> str:
    """
    Generate unique project code in format: IOT-YYYY-NNNN
    Example: IOT-2025-0001, IOT-2025-0002, etc.
    """
    current_year = datetime.now().year
    prefix = f"IOT-{current_year}-"
    
    # Get latest code for current year
    stmt = select(Project.code).where(
        Project.code.like(f"{prefix}%")
    ).order_by(Project.code.desc()).limit(1)
    
    result = await db.execute(stmt)
    latest_code = result.scalar_one_or_none()
    
    if latest_code:
        # Extract number and increment
        try:
            number = int(latest_code.split('-')[-1])
            new_number = number + 1
        except (ValueError, IndexError):
            new_number = 1
    else:
        new_number = 1
    
    # Format: IOT-2025-0001
    return f"{prefix}{new_number:04d}"


async def create_project(
    db: AsyncSession,
    project_data: ProjectCreate
) -> Project:
    """Create new project with auto-generated code"""
    # Generate unique code
    code = await generate_project_code(db)
    
    # Create project
    project = Project(
        id=uuid.uuid4(),
        code=code,
        name=project_data.name,
        client=project_data.client,
        standard=project_data.standard,
        manager_id=project_data.manager_id,
        deadline=project_data.deadline,
        status="pending",
        progress=0
    )
    
    db.add(project)
    await db.commit()
    await db.refresh(project)
    
    return project


async def get_project(
    db: AsyncSession,
    project_id: uuid.UUID
) -> Optional[Project]:
    """Get project by ID"""
    stmt = select(Project).where(Project.id == project_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def list_projects(
    db: AsyncSession,
    query: ProjectQuery
) -> Tuple[List[Project], int]:
    """
    List projects with pagination and filters
    Returns: (projects, total_count)
    """
    # Build query
    stmt = select(Project)
    count_stmt = select(func.count()).select_from(Project)
    
    # Apply filters
    filters = []
    
    if query.status:
        filters.append(Project.status == query.status)
    
    if query.manager_id:
        filters.append(Project.manager_id == query.manager_id)
    
    if query.search:
        search_pattern = f"%{query.search}%"
        filters.append(
            or_(
                Project.name.ilike(search_pattern),
                Project.description.ilike(search_pattern),
                Project.code.ilike(search_pattern)
            )
        )
    
    if filters:
        stmt = stmt.where(and_(*filters))
        count_stmt = count_stmt.where(and_(*filters))
    
    # Get total count
    total_result = await db.execute(count_stmt)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (query.page - 1) * query.page_size
    stmt = stmt.offset(offset).limit(query.page_size)
    
    # Order by created_at desc
    stmt = stmt.order_by(Project.created_at.desc())
    
    # Execute query
    result = await db.execute(stmt)
    projects = result.scalars().all()
    
    return list(projects), total


async def update_project(
    db: AsyncSession,
    project: Project,
    update_data: ProjectUpdate
) -> Project:
    """Update project fields"""
    update_dict = update_data.model_dump(exclude_unset=True)
    
    for field, value in update_dict.items():
        setattr(project, field, value)
    
    project.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(project)
    
    return project


async def delete_project(
    db: AsyncSession,
    project: Project
) -> Project:
    """Soft delete project (set status to archived)"""
    project.status = "archived"
    project.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(project)
    
    return project


async def get_project_stats(
    db: AsyncSession,
    project_id: uuid.UUID
) -> dict:
    """Get project statistics"""
    # Count samples
    sample_stmt = select(func.count()).select_from(Sample).where(
        Sample.project_id == project_id
    )
    sample_result = await db.execute(sample_stmt)
    sample_count = sample_result.scalar()
    
    # Count tasks
    task_stmt = select(func.count()).select_from(Task).where(
        Task.project_id == project_id
    )
    task_result = await db.execute(task_stmt)
    task_count = task_result.scalar()
    
    # Count completed tasks
    completed_stmt = select(func.count()).select_from(Task).where(
        and_(
            Task.project_id == project_id,
            Task.status == "completed"
        )
    )
    completed_result = await db.execute(completed_stmt)
    completed_count = completed_result.scalar()
    
    return {
        "sample_count": sample_count,
        "task_count": task_count,
        "completed_task_count": completed_count
    }


async def generate_compliance_matrix(
    db: AsyncSession,
    project: Project,
    standard: str = "EN 18031"
) -> ComplianceMatrixResponse:
    """
    Generate compliance matrix for project
    For now, returns a template matrix
    TODO: Implement full compliance checking against tasks
    """
    # EN 18031 template requirements (simplified)
    template_items = [
        ComplianceMatrixItem(
            requirement_id="5.1",
            requirement_title="No universal default passwords",
            status="not_started",
            evidence=None,
            notes=None
        ),
        ComplianceMatrixItem(
            requirement_id="5.2",
            requirement_title="Implement a means to manage reports of vulnerabilities",
            status="not_started",
            evidence=None,
            notes=None
        ),
        ComplianceMatrixItem(
            requirement_id="5.3",
            requirement_title="Keep software updated",
            status="not_started",
            evidence=None,
            notes=None
        ),
        ComplianceMatrixItem(
            requirement_id="5.4",
            requirement_title="Securely store sensitive security parameters",
            status="not_started",
            evidence=None,
            notes=None
        ),
        ComplianceMatrixItem(
            requirement_id="5.5",
            requirement_title="Communicate securely",
            status="not_started",
            evidence=None,
            notes=None
        ),
    ]
    
    # Calculate completion
    completed = sum(1 for item in template_items if item.status == "completed")
    completion_percentage = (completed / len(template_items)) * 100 if template_items else 0
    
    return ComplianceMatrixResponse(
        project_id=project.id,
        project_code=project.code,
        standard=standard,
        items=template_items,
        completion_percentage=completion_percentage,
        generated_at=datetime.utcnow()
    )
