"""
Task management service layer
"""
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Tuple, Dict, Any
from datetime import datetime
import uuid

from app.models.models import Task, Project, Sample, ScanResult, Vulnerability
from app.schemas.tasks import (
    TaskCreate,
    TaskUpdate,
    TaskQuery
)


async def generate_task_code(db: AsyncSession, project_id: uuid.UUID) -> str:
    """
    Generate unique task code in format: TASK-PROJECT_CODE-NNN
    Example: TASK-IOT-2025-0001-001, TASK-IOT-2025-0001-002
    """
    # Get project code
    project_stmt = select(Project.code).where(Project.id == project_id)
    project_result = await db.execute(project_stmt)
    project_code = project_result.scalar_one_or_none()
    
    if not project_code:
        raise ValueError("Project not found")
    
    prefix = f"TASK-{project_code}-"
    
    # Get latest task code for this project
    stmt = select(Task.code).where(
        Task.code.like(f"{prefix}%")
    ).order_by(Task.code.desc()).limit(1)
    
    result = await db.execute(stmt)
    latest_code = result.scalar_one_or_none()
    
    if latest_code:
        try:
            number = int(latest_code.split('-')[-1])
            new_number = number + 1
        except (ValueError, IndexError):
            new_number = 1
    else:
        new_number = 1
    
    return f"{prefix}{new_number:03d}"


async def create_task(
    db: AsyncSession,
    task_data: TaskCreate
) -> Task:
    """Create new task with auto-generated code"""
    # ⭐ Phase 3: Validate project exists
    project_stmt = select(Project).where(Project.id == task_data.project_id)
    project_result = await db.execute(project_stmt)
    project = project_result.scalar_one_or_none()
    
    if not project:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404,
            detail=f"Project {task_data.project_id} not found"
        )
    
    # ⭐⭐⭐ Phase 3: CRITICAL - Validate sample belongs to same project
    if task_data.sample_id:
        sample_stmt = select(Sample).where(Sample.id == task_data.sample_id)
        sample_result = await db.execute(sample_stmt)
        sample = sample_result.scalar_one_or_none()
        
        if not sample:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=404,
                detail=f"Sample {task_data.sample_id} not found"
            )
        
        # ⭐⭐⭐ KEY VALIDATION: Sample must belong to same project
        if sample.project_id != task_data.project_id:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Sample does not belong to this project",
                    "sample_id": str(task_data.sample_id),
                    "sample_project_id": str(sample.project_id),
                    "task_project_id": str(task_data.project_id),
                    "message": f"Sample '{sample.name}' belongs to project {sample.project_id}, but task is for project {task_data.project_id}. Please select a sample from the same project."
                }
            )
    
    # Generate task code
    code = await generate_task_code(db, task_data.project_id)
    
    task = Task(
        id=uuid.uuid4(),
        code=code,
        name=task_data.name,
        type=task_data.type,
        project_id=task_data.project_id,
        sample_id=task_data.sample_id,
        config=task_data.config,
        priority=task_data.priority,
        assignee_id=task_data.assignee_id,
        notes=task_data.notes,
        status="queued",
        progress=0
    )
    
    db.add(task)
    await db.commit()
    await db.refresh(task)
    
    return task


async def get_task(db: AsyncSession, task_id: uuid.UUID) -> Optional[Task]:
    """Get task by ID"""
    stmt = select(Task).where(Task.id == task_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def list_tasks(
    db: AsyncSession,
    query: TaskQuery
) -> Tuple[List[Task], int]:
    """List tasks with pagination and filters"""
    stmt = select(Task)
    count_stmt = select(func.count()).select_from(Task)
    
    filters = []
    
    if query.status:
        filters.append(Task.status == query.status)
    
    if query.type:
        filters.append(Task.type == query.type)
    
    if query.project_id:
        filters.append(Task.project_id == query.project_id)
    
    if query.sample_id:
        filters.append(Task.sample_id == query.sample_id)
    
    if query.assignee_id:
        filters.append(Task.assignee_id == query.assignee_id)
    
    if query.search:
        search_pattern = f"%{query.search}%"
        filters.append(
            or_(
                Task.name.ilike(search_pattern),
                Task.code.ilike(search_pattern),
                Task.notes.ilike(search_pattern)
            )
        )
    
    if filters:
        stmt = stmt.where(and_(*filters))
        count_stmt = count_stmt.where(and_(*filters))
    
    total_result = await db.execute(count_stmt)
    total = total_result.scalar()
    
    offset = (query.page - 1) * query.page_size
    stmt = stmt.offset(offset).limit(query.page_size)
    stmt = stmt.order_by(Task.created_at.desc())
    
    result = await db.execute(stmt)
    tasks = result.scalars().all()
    
    return list(tasks), total


async def update_task(
    db: AsyncSession,
    task: Task,
    update_data: TaskUpdate
) -> Task:
    """Update task fields and auto-update project progress if status changes"""
    update_dict = update_data.model_dump(exclude_unset=True)
    
    # Track if status is changing to/from 'completed'
    old_status = task.status
    status_changed_to_completed = False
    status_changed_from_completed = False
    
    if 'status' in update_dict:
        new_status = update_dict['status']
        if old_status != 'completed' and new_status == 'completed':
            status_changed_to_completed = True
        elif old_status == 'completed' and new_status != 'completed':
            status_changed_from_completed = True
    
    # Update task fields
    for field, value in update_dict.items():
        setattr(task, field, value)
    
    task.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(task)
    
    # Auto-update project progress if task completion status changed
    if status_changed_to_completed or status_changed_from_completed:
        from app.services.projects import update_project_progress
        try:
            await update_project_progress(db, task.project_id, auto_calculate=True)
        except Exception as e:
            # Log error but don't fail the task update
            print(f"Warning: Failed to update project progress: {e}")
    
    return task



async def delete_task(db: AsyncSession, task: Task) -> Task:
    """Soft delete task (set status to cancelled) and update project progress"""
    old_status = task.status
    task.status = "cancelled"
    task.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(task)
    
    # Auto-update project progress if task was completed
    if old_status == 'completed':
        from app.services.projects import update_project_progress
        try:
            await update_project_progress(db, task.project_id, auto_calculate=True)
        except Exception as e:
            print(f"Warning: Failed to update project progress: {e}")
    
    return task



async def execute_task(
    db: AsyncSession,
    task: Task,
    force: bool = False
) -> Task:
    """
    Execute task (placeholder - actual execution would be async via Celery)
    """
    if task.status == "running" and not force:
        raise ValueError("Task is already running")
    
    if task.status in ["completed", "failed", "cancelled"]:
        raise ValueError(f"Cannot execute task with status: {task.status}")
    
    # Update status
    task.status = "running"
    task.start_time = datetime.utcnow()
    task.updated_at = datetime.utcnow()
    
    # TODO: Trigger async Celery task here
    # celery_task = execute_task_async.delay(str(task.id))
    # task.celery_task_id = celery_task.id
    
    await db.commit()
    await db.refresh(task)
    
    return task


async def get_task_stats(
    db: AsyncSession,
    task_id: uuid.UUID
) -> Dict[str, int]:
    """Get task statistics"""
    # Count scan results
    result_stmt = select(func.count()).select_from(ScanResult).where(
        ScanResult.task_id == task_id
    )
    result_count_result = await db.execute(result_stmt)
    result_count = result_count_result.scalar()
    
    # Count vulnerabilities
    vuln_stmt = select(func.count()).select_from(Vulnerability).where(
        Vulnerability.task_id == task_id
    )
    vuln_count_result = await db.execute(vuln_stmt)
    vuln_count = vuln_count_result.scalar()
    
    return {
        "result_count": result_count,
        "vulnerability_count": vuln_count
    }
