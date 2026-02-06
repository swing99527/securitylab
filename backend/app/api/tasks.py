"""
Task Management AP endpoints
"""
from typing import Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import math
import shutil
from pathlib import Path
import os

from app.core.deps import get_db, get_current_active_user
from app.models.models import User
from app.schemas.tasks import (
    TaskCreate,
    TaskUpdate,
    TaskExecute,
    TaskQuery,
    TaskResponse,
    TaskDetail,
    TaskListResponse,
    TaskResultResponse
)
from app.services import tasks as task_service
from datetime import datetime

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create new task and start execution
    
    - Auto-generates task code: TASK-PROJECT_CODE-NNN
    - Sets initial status to 'queued'
    - Does NOT auto-execute (user must manually start)
    - Supports JSONB configuration
    """
    # Create task in database (status will be 'queued')
    task = await task_service.create_task(db, task_data)
    
    return task


@router.get("", response_model=TaskListResponse)
async def list_tasks(
    status_filter: str = None,
    type_filter: str = None,
    project_id: str = None,
    sample_id: str = None,
    assignee_id: str = None,
    search: str = None,
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List tasks with pagination and filters
    
    - Filter by status, type, project, sample, assignee
    - Search in name, code, notes
    - Paginated results
    """
    query = TaskQuery(
        status=status_filter,
        type=type_filter,
        project_id=uuid.UUID(project_id) if project_id else None,
        sample_id=uuid.UUID(sample_id) if sample_id else None,
        assignee_id=uuid.UUID(assignee_id) if assignee_id else None,
        search=search,
        page=page,
        page_size=min(page_size, 100)
    )
    
    tasks, total = await task_service.list_tasks(db, query)
    
    total_pages = math.ceil(total / query.page_size) if total > 0 else 0
    
    return TaskListResponse(
        items=tasks,
        total=total,
        page=query.page,
        page_size=query.page_size,
        total_pages=total_pages
    )


@router.get("/{task_id}/status")
async def get_task_status(
    task_id: uuid.UUID,
    # current_user: User = Depends(get_current_active_user),  # TODO: Re-enable after testing
    db: AsyncSession = Depends(get_db)
):
    """
    Get real-time task execution status from Redis
    
    Returns:
        - status: queued|running|completed|failed|cancelled
        - progress: 0-100
        - message: current activity description
        - result: task result (if completed)
        - error: error message (if failed)
    """
    from app.core.task_executor import task_executor
    from app.models.models import Task as TaskModel
    
    # Get task from DB for basic info
    result = await db.execute(select(TaskModel).where(TaskModel.id == task_id))
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Get real-time status from Redis
    task_status_data = await task_executor.get_task_status(str(task_id))
    
    if not task_status_data:
        # Task not yet started or status expired
        return {
            "id": str(task.id),
            "code": task.code,
            "type": task.type,
            "status": task.status,
            "progress": task.progress,
            "message": "Task status not available",
            "created_at": task.created_at.isoformat() if task.created_at else None
        }
    
    # Parse result if available
    import json
    result_data = None
    if "result" in task_status_data:
        try:
            result_data = json.loads(task_status_data["result"])
        except:
            pass
    
    return {
        "id": str(task.id),
        "code": task.code,
        "name": task.name,
        "type": task.type,
        "status": task_status_data.get("status", task.status),
        "progress": int(task_status_data.get("progress", task.progress or 0)),
        "message": task_status_data.get("message", ""),
        "result": result_data,
        "error": task_status_data.get("error"),
        "created_at": task.created_at.isoformat() if task.created_at else None
    }


@router.get("/{task_id}/logs", summary="获取任务日志")
async def get_task_logs(
    task_id: str,
    limit: int = Query(200, description="返回日志条数", ge=1, le=1000),
    level: str = Query(None, description="过滤日志级别 (DEBUG/INFO/WARN/ERROR)"),
    db: AsyncSession = Depends(get_db),
    # current_user: dict = Depends(get_current_active_user)  # TODO: Re-enable after testing
):
    """获取任务执行日志"""
    from app.core.task_executor import task_executor
    from app.models.models import Task as TaskModel
    
    # Get task from DB
    result = await db.execute(select(TaskModel).where(TaskModel.id == task_id))
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Get logs from Redis
    logs = await task_executor.get_task_logs(str(task_id), limit=limit, level=level)
    
    return {
        "code": 200,
        "message": "success",
        "data": {
            "task_id": task_id,
            "total": len(logs),
            "logs": logs
        }
    }


@router.get("/{task_id}", response_model=TaskDetail)
async def get_task(
    task_id: uuid.UUID,
    # current_user: User = Depends(get_current_active_user),  # TODO: Re-enable after testing
    db: AsyncSession = Depends(get_db)
):
    """
    Get task details with full configuration and statistics
    """
    from sqlalchemy.orm import selectinload
    from app.models.models import Task as TaskModel
    
    # Query task with all relationships
    stmt = select(TaskModel).options(
        selectinload(TaskModel.project),
        selectinload(TaskModel.sample),
        selectinload(TaskModel.assignee)
    ).where(TaskModel.id == task_id)
    
    result = await db.execute(stmt)
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    stats = await task_service.get_task_stats(db, task_id)
    
    # Get related names
    project_name = task.project.name if task.project else "Unknown Project"
    sample_code = task.sample.code if task.sample else None
    assignee_name = task.assignee.name if task.assignee else None
    
    return TaskDetail(
        **task.__dict__,
        project_name=project_name,
        sample_code=sample_code,
        assignee_name=assignee_name,
        **stats
    )


@router.post("/{task_id}/stop")
async def stop_task(
    task_id: uuid.UUID,
    # current_user: User = Depends(get_current_active_user),  # TODO: Re-enable after testing
    db: AsyncSession = Depends(get_db)
):
    """
    Stop a running task
    
    - Sends a stop signal to the task executor
    - Updates task status to 'cancelled' in the database
    """
    from app.models.models import Task as TaskModel
    from app.core.task_executor import task_executor
    
    result = await db.execute(select(TaskModel).where(TaskModel.id == task_id))
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    if task.status not in ["running", "queued"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Task is not running or queued (current status: {task.status})"
        )
    
    try:
        await task_executor.stop_task(str(task_id))
        task.status = "cancelled"
        task.end_time = datetime.now()
        await db.commit()
        await db.refresh(task)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to stop task {task.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send stop signal to task: {str(e)}"
        )
    
    return {
        "code": 200,
        "message": "Task stop signal sent successfully",
        "data": {
            "task_id": task.id,
            "status": task.status
        }
    }


@router.patch("/{task_id}", response_model=TaskDetail)
async def update_task(
    task_id: uuid.UUID,
    task_update: TaskUpdate,
    # current_user: User = Depends(get_current_active_user),  # TODO: Re-enable after testing
    db: AsyncSession = Depends(get_db)
):
    """
    Update task information
    
    - Update name, status, priority, config, assignee, notes
    """
    task = await task_service.get_task(db, task_id)
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    updated_task = await task_service.update_task(db, task, update_data)
    return updated_task


@router.post("/{task_id}/execute", response_model=TaskResultResponse)
async def execute_task(
    task_id: uuid.UUID,
    execute_data: TaskExecute,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Execute task manually
    
    - Submits task to task_executor
    - Sets status to 'queued' in Redis
    - Task will start executing asynchronously
    """
    from app.models.models import Task # Added for the new code
    from sqlalchemy import func # Added for the new code
    from sqlalchemy.future import select # Added for the new code
    
    # Get task from database
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check if task can be executed
    if task.status in ["running", "completed"]:
        if not execute_data.force:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Task is already {task.status}. Use force=true to restart."
            )
    
    # Submit to task executor
    from app.core.task_executor import task_executor
    try:
        await task_executor.submit_task(
            task_id=str(task.id),
            task_type=task.type,
            params=task.config or {}
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to submit task {task.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start task execution: {str(e)}"
        )
    
    # Update task status in DB to 'running'
    task.status = "running"
    task.start_time = func.now()
    await db.commit()
    await db.refresh(task)
    
    return TaskResultResponse(
        task_id=task.id,
        task_code=task.code,
        status=task.status,
        progress=0,
        started_at=task.start_time,
        completed_at=None,
        duration_seconds=None,
        message="Task submitted to executor and will start shortly"
    )

@router.delete("/{task_id}")
async def delete_task(
    task_id: uuid.UUID,
    # current_user: User = Depends(get_current_active_user),  # TODO: Re-enable after testing
    db: AsyncSession = Depends(get_db)
):
    """
    删除任务 (暂时禁用权限检查以便测试)
    
    - 检查任务是否存在
    - 只有管理员或任务所属项目成员可删除
    - 级联删除相关记录（scan_results, vulnerabilities等）
    - 清理Redis缓存数据
    """
    from app.models.models import Task as TaskModel
    from sqlalchemy.future import select
    from app.core.task_executor import task_executor
    import logging
    
    logger = logging.getLogger(__name__)
    
    try:
        # 获取任务
        result = await db.execute(select(TaskModel).where(TaskModel.id == task_id))
        task = result.scalar_one_or_none()
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # 检查任务状态 - 运行中的任务需要先停止
        if task.status == "running":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete running task. Please stop it first."
            )
        
        # 删除数据库记录（级联删除会自动处理相关记录）
        await db.delete(task)
        await db.commit()
        logger.info(f"Deleted task {task_id} from database")
        
        # 清理Redis数据 - 使用异步客户端
        try:
            if task_executor.redis_async:
                await task_executor.redis_async.delete(f"task:{task_id}")
                await task_executor.redis_async.delete(f"task:{task_id}:logs")
                logger.info(f"Cleaned Redis data for task {task_id}")
        except Exception as e:
            logger.warning(f"Failed to clean Redis for task {task_id}: {e}")
        
        return {
            "code": 200,
            "message": "Task deleted successfully",
            "data": None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete task {task_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete task: {str(e)}"
        )



@router.get("/{task_id}/vulnerabilities")
async def get_task_vulnerabilities(
    task_id: uuid.UUID,
    severity: Optional[str] = Query(None, description="Filter by severity (CRITICAL|HIGH|MEDIUM|LOW)"),
    service: Optional[str] = Query(None, description="Filter by service name"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    # current_user: User = Depends(get_current_active_user),  # TODO: Re-enable after testing
    db: AsyncSession = Depends(get_db)
):
    """
    Get vulnerabilities found by vulnerability scan task
    
    - Returns list of CVE vulnerabilities with details
    - Supports filtering by severity and service
    - Paginated results
    """
    from app.models.models import Task as TaskModel, Vulnerability
    from sqlalchemy import func, desc
    
    # Verify task exists and is vuln_scan type
    result = await db.execute(select(TaskModel).where(TaskModel.id == task_id))
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    if task.type != "vuln_scan":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This endpoint is only for vulnerability scan tasks"
        )
    
    # Build query
    query = select(Vulnerability).where(Vulnerability.task_id == task_id)
    
    # Apply filters
    if severity:
        query = query.where(Vulnerability.severity == severity.upper())
    if service:
        query = query.where(Vulnerability.service_name == service)
    
    # Get total count
    count_query = select(func.count()).select_from(query.alias())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination and sorting (by CVSS score descending)
    query = query.order_by(desc(Vulnerability.cvss_score), desc(Vulnerability.severity))
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    # Execute query
    vulns_result = await db.execute(query)
    vulnerabilities = vulns_result.scalars().all()
    
    # Convert to dict
    vulns_data = []
    for vuln in vulnerabilities:
        vuln_dict = {
            "id": str(vuln.id),
            "cve_id": vuln.cve_id,
            "severity": vuln.severity,
            "cvss_score": vuln.cvss_score,
            "cvss_vector": vuln.cvss_vector,
            "description": vuln.cve_description,
            "service_name": vuln.service_name,
            "service_version": vuln.service_version,
            "port": vuln.port,
            "protocol": vuln.protocol,
            "status": vuln.status,
            "published_date": vuln.published_date.isoformat() if vuln.published_date else None,
            "last_modified_date": vuln.last_modified_date.isoformat() if vuln.last_modified_date else None,
            "references": vuln.references,
            "remediation": vuln.remediation,
            "discovered_at": vuln.discovered_at.isoformat() if vuln.discovered_at else None
        }
        vulns_data.append(vuln_dict)
    
    # Get statistics
    stats_query = select(
        Vulnerability.severity,
        func.count(Vulnerability.id).label('count')
    ).where(Vulnerability.task_id == task_id).group_by(Vulnerability.severity)
    
    stats_result = await db.execute(stats_query)
    severity_stats = {row.severity: row.count for row in stats_result}
    
    return {
        "code": 200,
        "message": "success",
        "data": {
            "task_id": str(task_id),
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if total > 0 else 0,
            "vulnerabilities": vulns_data,
            "statistics": {
                "total_vulnerabilities": total,
                "critical": severity_stats.get("CRITICAL", 0),
                "high": severity_stats.get("HIGH", 0),
                "medium": severity_stats.get("MEDIUM", 0),
                "low": severity_stats.get("LOW", 0)
            }
        }
    }


@router.get("/{task_id}/vulnerabilities/export")
async def export_task_vulnerabilities(
    task_id: uuid.UUID,
    format: str = Query("csv", description="Export format: csv or json"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    # current_user: User = Depends(get_current_active_user),  # TODO: Re-enable after testing
    db: AsyncSession = Depends(get_db)
):
    """
    Export vulnerabilities to CSV or JSON format
    
    - CSV format: Excel-compatible with all vulnerability details
    - JSON format: Complete structured data for technical analysis
    """
    from app.models.models import Task as TaskModel, Vulnerability
    from sqlalchemy import desc
    from fastapi.responses import StreamingResponse
    import io
    import csv
    import json as json_lib
    
    # Verify task exists and is vuln_scan type
    result = await db.execute(select(TaskModel).where(TaskModel.id == task_id))
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    if task.type != "vuln_scan":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This endpoint is only for vulnerability scan tasks"
        )
    
    # Build query
    query = select(Vulnerability).where(Vulnerability.task_id == task_id)
    
    # Apply severity filter if provided
    if severity:
        query = query.where(Vulnerability.severity == severity.upper())
    
    # Order by CVSS score
    query = query.order_by(desc(Vulnerability.cvss_score))
    
    # Execute query
    vulns_result = await db.execute(query)
    vulnerabilities = vulns_result.scalars().all()
    
    if format.lower() == "csv":
        # Generate CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "CVE ID",
            "Severity",
            "CVSS Score",
            "CVSS Vector",
            "Service",
            "Version",
            "Port",
            "Protocol",
            "Status",
            "Description",
            "Published Date",
            "Last Modified",
            "Remediation"
        ])
        
        # Data rows
        for vuln in vulnerabilities:
            writer.writerow([
                vuln.cve_id,
                vuln.severity,
                vuln.cvss_score,
                vuln.cvss_vector,
                vuln.service_name,
                vuln.service_version,
                vuln.port,
                vuln.protocol,
                vuln.status,
                vuln.cve_description,
                vuln.published_date.isoformat() if vuln.published_date else "",
                vuln.last_modified_date.isoformat() if vuln.last_modified_date else "",
                vuln.remediation or ""
            ])
        
        output.seek(0)
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=vulnerabilities_{task.code}_{severity or 'all'}.csv"
            }
        )
    
    elif format.lower() == "json":
        # Generate JSON
        export_data = {
            "task_id": str(task_id),
            "task_code": task.code,
            "export_date": datetime.now().isoformat(),
            "total_vulnerabilities": len(vulnerabilities),
            "vulnerabilities": []
        }
        
        for vuln in vulnerabilities:
            vuln_dict = {
                "cve_id": vuln.cve_id,
                "severity": vuln.severity,
                "cvss_score": vuln.cvss_score,
                "cvss_vector": vuln.cvss_vector,
                "description": vuln.cve_description,
                "service": {
                    "name": vuln.service_name,
                    "version": vuln.service_version,
                    "port": vuln.port,
                    "protocol": vuln.protocol
                },
                "status": vuln.status,
                "published_date": vuln.published_date.isoformat() if vuln.published_date else None,
                "last_modified_date": vuln.last_modified_date.isoformat() if vuln.last_modified_date else None,
                "references": vuln.references,
                "remediation": vuln.remediation,
                "discovered_at": vuln.discovered_at.isoformat() if vuln.discovered_at else None
            }
            export_data["vulnerabilities"].append(vuln_dict)
        
        return StreamingResponse(
            iter([json_lib.dumps(export_data, indent=2)]),
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename=vulnerabilities_{task.code}_{severity or 'all'}.json"
            }
        )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid format. Use 'csv' or 'json'"
        )

# Firmware upload endpoint
FIRMWARE_UPLOAD_DIR = "/tmp/firmware_uploads"

@router.post("/firmware/upload")
async def upload_firmware(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload firmware file for analysis
    
    - Max size: 500MB
    - Supported formats: .bin, .img, .zip, .tar.gz, .tar, .fw
    - Returns: File path for use in task creation
    """
    # Validate file extension
    allowed_extensions = {'.bin', '.img', '.zip', '.gz', '.tar', '.fw', '.elf'}
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file_ext}. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Validate file size (max 500MB)
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    max_size = 500 * 1024 * 1024  # 500MB
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large: {file_size / (1024*1024):.2f}MB. Max: 500MB"
        )
    
    # Create unique directory for this upload
    upload_id = str(uuid.uuid4())
    upload_path = Path(FIRMWARE_UPLOAD_DIR) / upload_id
    upload_path.mkdir(parents=True, exist_ok=True)
    
    # Save file
    file_path = upload_path / file.filename
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {
        "code": 200,
        "message": "Firmware uploaded successfully",
        "data": {
            "upload_id": upload_id,
            "filename": file.filename,
            "file_path": str(file_path),
            "size": file_size,
            "size_mb": round(file_size / (1024 * 1024), 2)
        }
    }
