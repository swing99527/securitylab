"""
Dashboard API endpoints - Real data aggregation from database
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, case, and_, or_, extract
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_sync_db
from app.models.models import Project, Task, Sample, Report, Vulnerability

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


# ==================== Response Models ====================

class DashboardStats(BaseModel):
    projectsInProgress: int
    projectsTrend: int  # percentage change vs last week
    pendingReports: int
    reportsTrend: int
    samplesToday: int
    samplesTrend: int
    abnormalDevices: int


class HeatmapData(BaseModel):
    date: str
    value: int


class VulnerabilityTrendData(BaseModel):
    date: str
    critical: int
    high: int
    medium: int
    low: int


class TodoItem(BaseModel):
    id: str
    title: str
    description: str
    type: str  # review, task, sample
    priority: str  # high, medium, low
    dueDate: Optional[str] = None
    completed: bool = False


# ==================== API Endpoints ====================

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_sync_db)):
    """Get dashboard statistics with trend data"""
    today = date.today()
    yesterday = today - timedelta(days=1)
    last_week = today - timedelta(days=7)
    two_weeks_ago = today - timedelta(days=14)
    
    # Active projects (pending + in_progress)
    projects_in_progress = db.query(func.count(Project.id)).filter(
        Project.status.in_(["pending", "in_progress"])
    ).scalar() or 0
    
    # Active projects trend (compare with last week)
    projects_last_week = db.query(func.count(Project.id)).filter(
        and_(
            Project.status.in_(["pending", "in_progress"]),
            Project.created_at < last_week
        )
    ).scalar() or 0
    projects_trend = calculate_trend(projects_in_progress, projects_last_week)
    
    # Pending reports
    pending_reports = db.query(func.count(Report.id)).filter(
        Report.status == "pending_review"
    ).scalar() or 0
    
    # Reports trend
    reports_last_week = db.query(func.count(Report.id)).filter(
        and_(
            Report.status == "pending_review",
            Report.created_at < last_week
        )
    ).scalar() or 0
    reports_trend = calculate_trend(pending_reports, reports_last_week)
    
    # Samples received today
    samples_today = db.query(func.count(Sample.id)).filter(
        func.date(Sample.created_at) == today
    ).scalar() or 0
    
    # Samples yesterday for trend
    samples_yesterday = db.query(func.count(Sample.id)).filter(
        func.date(Sample.created_at) == yesterday
    ).scalar() or 0
    samples_trend = calculate_trend(samples_today, samples_yesterday)
    
    # Abnormal devices (failed tasks)
    abnormal_devices = db.query(func.count(Task.id)).filter(
        Task.status == "failed"
    ).scalar() or 0
    
    return DashboardStats(
        projectsInProgress=projects_in_progress,
        projectsTrend=projects_trend,
        pendingReports=pending_reports,
        reportsTrend=reports_trend,
        samplesToday=samples_today,
        samplesTrend=samples_trend,
        abnormalDevices=abnormal_devices
    )


@router.get("/heatmap", response_model=List[HeatmapData])
def get_dashboard_heatmap(db: Session = Depends(get_sync_db)):
    """Get activity heatmap data for the last 365 days (task creation count by date)"""
    today = date.today()
    start_date = today - timedelta(days=365)
    
    # Query task counts by date
    results = db.query(
        func.date(Task.created_at).label("date"),
        func.count(Task.id).label("value")
    ).filter(
        Task.created_at >= start_date
    ).group_by(
        func.date(Task.created_at)
    ).all()
    
    # Create a dict for quick lookup
    date_counts = {str(r.date): r.value for r in results}
    
    # Fill in all 365 days
    heatmap_data = []
    for i in range(365):
        d = start_date + timedelta(days=i)
        date_str = str(d)
        heatmap_data.append(HeatmapData(
            date=date_str,
            value=date_counts.get(date_str, 0)
        ))
    
    return heatmap_data


@router.get("/vulnerability-trend", response_model=List[VulnerabilityTrendData])
def get_vulnerability_trend(db: Session = Depends(get_sync_db)):
    """Get vulnerability trend data for the last 7 days"""
    today = date.today()
    start_date = today - timedelta(days=6)  # 7 days including today
    
    # Query vulnerabilities grouped by date and severity
    results = db.query(
        func.date(Vulnerability.discovered_at).label("date"),
        Vulnerability.severity,
        func.count(Vulnerability.id).label("count")
    ).filter(
        Vulnerability.discovered_at >= start_date
    ).group_by(
        func.date(Vulnerability.discovered_at),
        Vulnerability.severity
    ).all()
    
    # Organize by date
    date_data = {}
    for r in results:
        date_str = r.date.strftime("%m/%d") if r.date else None
        if date_str:
            if date_str not in date_data:
                date_data[date_str] = {"critical": 0, "high": 0, "medium": 0, "low": 0}
            severity = r.severity.lower() if r.severity else "low"
            if severity in ["critical", "high", "medium", "low"]:
                date_data[date_str][severity] = r.count
    
    # Fill all 7 days
    trend_data = []
    for i in range(7):
        d = start_date + timedelta(days=i)
        date_str = d.strftime("%m/%d")
        data = date_data.get(date_str, {"critical": 0, "high": 0, "medium": 0, "low": 0})
        trend_data.append(VulnerabilityTrendData(
            date=date_str,
            **data
        ))
    
    return trend_data


@router.get("/todos", response_model=List[TodoItem])
def get_todo_items(db: Session = Depends(get_sync_db)):
    """Get pending todo items from reports, tasks, and samples"""
    todos = []
    
    # 1. Pending review reports
    pending_reports = db.query(Report).filter(
        Report.status == "pending_review"
    ).order_by(Report.created_at.desc()).limit(5).all()
    
    for report in pending_reports:
        todos.append(TodoItem(
            id=f"todo-report-{report.id}",
            title=f"审核报告: {report.title}",
            description=f"{report.code} 待审核",
            type="review",
            priority="high",
            dueDate=None,
            completed=False
        ))
    
    # 2. Overdue or stuck tasks
    stuck_tasks = db.query(Task).filter(
        or_(
            Task.status == "failed",
            and_(
                Task.status == "running",
                Task.start_time < datetime.now() - timedelta(hours=24)
            )
        )
    ).order_by(Task.updated_at.desc()).limit(5).all()
    
    for task in stuck_tasks:
        todos.append(TodoItem(
            id=f"todo-task-{task.id}",
            title=f"处理任务: {task.name}",
            description=f"{task.code} 状态: {task.status}",
            type="task",
            priority="high" if task.status == "failed" else "medium",
            dueDate=None,
            completed=False
        ))
    
    # 3. Samples awaiting return
    samples_to_return = db.query(Sample).filter(
        Sample.status == "in_use"
    ).order_by(Sample.updated_at.asc()).limit(5).all()
    
    for sample in samples_to_return:
        todos.append(TodoItem(
            id=f"todo-sample-{sample.id}",
            title=f"归还样品: {sample.name}",
            description=f"{sample.code} 当前位置: {sample.location or '未知'}",
            type="sample",
            priority="low",
            dueDate=None,
            completed=False
        ))
    
    return todos[:10]  # Limit to 10 items


# ==================== Helper Functions ====================

def calculate_trend(current: int, previous: int) -> int:
    """Calculate percentage trend between two values"""
    if previous == 0:
        return 100 if current > 0 else 0
    return int(((current - previous) / previous) * 100)
