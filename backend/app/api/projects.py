"""
Project Management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid
import math

from app.core.deps import get_db, get_current_active_user
from app.models.models import User, Project
from app.schemas.projects import (
    ProjectCreate,
    ProjectUpdate,
    ProjectQuery,
    ProjectResponse,
    ProjectDetail,
    ProjectListResponse,
    ProjectMemberResponse,
    ComplianceMatrixResponse
)
from app.services import projects as project_service

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create new project with auto-generated code
    
    - Auto-generates unique project code: IOT-YYYY-NNNN
    - Sets initial status to 'pending'
    - Requires authentication
    """
    # Verify manager exists
    if project_data.manager_id != current_user.id:
        # Only admin can create projects for others
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only create projects for yourself unless you're an admin"
            )
    
    project = await project_service.create_project(db, project_data)
    return project


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    status_filter: str = None,
    manager_id: str = None,
    search: str = None,
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List projects with pagination and filters
    
    - Filter by status, manager, or search term
    - Paginated results (default 20 per page)
    - Sorted by creation date (newest first)
    """
    # Build query
    query = ProjectQuery(
        status=status_filter,
        manager_id=uuid.UUID(manager_id) if manager_id else None,
        search=search,
        page=page,
        page_size=min(page_size, 100)  # Max 100 per page
    )
    
    projects, total = await project_service.list_projects(db, query)
    
    total_pages = math.ceil(total / query.page_size) if total > 0 else 0
    
    return ProjectListResponse(
        items=projects,
        total=total,
        page=query.page,
        page_size=query.page_size,
        total_pages=total_pages
    )


@router.get("/{project_id}", response_model=ProjectDetail)
async def get_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get project details with members and statistics
    
    - Returns full project information
    - Includes manager name
    - Shows sample/task statistics
    """
    from sqlalchemy.orm import selectinload
    from app.models.models import User as UserModel
    
    # Query project with manager relationship
    stmt = select(Project).options(
        selectinload(Project.manager)
    ).where(Project.id == project_id)
    
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Get statistics
    stats = await project_service.get_project_stats(db, project_id)
    
    # Get manager name
    manager_name = project.manager.name if project.manager else "Unknown"
    
    return ProjectDetail(
        **project.__dict__,
        manager_name=manager_name,
        members=[],  # TODO: Implement member management
        **stats
    )


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    update_data: ProjectUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update project information
    
    - Update name, description, status, or notes
    - Only manager or admin can update
    """
    project = await project_service.get_project(db, project_id)
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check permissions
    if project.manager_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project manager or admin can update project"
        )
    
    updated_project = await project_service.update_project(db, project, update_data)
    return updated_project


@router.delete("/{project_id}", response_model=ProjectResponse)
async def delete_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Archive project (soft delete)
    
    - Sets status to 'archived'
    - Only manager or admin can delete
    - Does not actually delete data
    """
    project = await project_service.get_project(db, project_id)
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check permissions
    if project.manager_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project manager or admin can delete project"
        )
    
    archived_project = await project_service.delete_project(db, project)
    return archived_project


@router.get("/{project_id}/compliance-matrix", response_model=ComplianceMatrixResponse)
async def get_compliance_matrix(
    project_id: uuid.UUID,
    standard: str = "EN 18031",
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate compliance matrix for project
    
    - Shows EN 18031 compliance status
    - Lists requirements and evidence
    - Calculates completion percentage
    """
    project = await project_service.get_project(db, project_id)
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    matrix = await project_service.generate_compliance_matrix(db, project, standard)
    return matrix
