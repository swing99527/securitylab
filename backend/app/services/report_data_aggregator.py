"""
Report Data Aggregator Service

Automatically aggregates report metadata from projects, samples, tasks, and vulnerabilities.
Provides intelligent data extraction and merging for automated report generation.
"""
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models.models import Project, Sample, Task, Vulnerability, ScanResult


async def aggregate_report_data(
    session: AsyncSession,
    project_id: UUID,
    template: str = "gb_t_iot",
    sample_id: Optional[UUID] = None
) -> Dict[str, Any]:
    """
    Aggregate all available data for report generation.
    
    Args:
        session: Database session
        project_id: Project UUID
        template: Report template type
        sample_id: Optional specific sample to use (otherwise uses primary sample)
    
    Returns:
        Dictionary containing all aggregated metadata
    """
    # Load project with all relationships
    stmt = (
        select(Project)
        .where(Project.id == project_id)
        .options(
            selectinload(Project.samples),
            selectinload(Project.tasks).selectinload(Task.vulnerabilities),
            selectinload(Project.tasks).selectinload(Task.sample),
            selectinload(Project.manager)
        )
    )
    result = await session.execute(stmt)
    project = result.scalar_one_or_none()
    
    if not project:
        return {}
    
    # Determine which sample to use
    if sample_id:
        target_sample = next((s for s in project.samples if s.id == sample_id), None)
    else:
        # Use first sample as primary
        target_sample = project.samples[0] if project.samples else None
    
    # Aggregate data from various sources
    metadata = {}
    
    # Client information (from project)
    metadata.update(get_client_info(project))
    
    # Product information (from sample)
    metadata.update(get_product_info(target_sample, project.samples))
    
    # Testing organization (from config/default)
    metadata["testing_organization"] = "汕头人工智能实验室 玩具安全检测中心"
    
    # Test standards (from project)
    metadata.update(get_test_standards(project, template))
    
    # Test period (from tasks)
    metadata.update(await get_test_period(session, project_id))
    
    # Test methodology and scope (from tasks)
    metadata.update(await get_test_methodology(session, project_id))
    
    # Security assessment (from vulnerabilities)
    metadata.update(await calculate_security_assessment(session, project_id, project.standard))
    
    return metadata


def get_client_info(project: Project) -> Dict[str, Any]:
    """Extract client information from project."""
    return {
        "client_company": project.client,
        # These fields would require project model extension
        "client_contact": None,
        "client_address": None,
    }


def get_product_info(primary_sample: Optional[Sample], all_samples: List[Sample]) -> Dict[str, Any]:
    """Extract product and sample information."""
    if not primary_sample:
        return {
            "product_name": None,
            "product_model": None,
            "manufacturer": None,
            "manufacturer_address": None,
            "sample_info": {
                "quantity": len(all_samples),
                "samples": []
            }
        }
    
    # Build sample info JSONB
    sample_info = {
        "serial_number": primary_sample.code,
        "quantity": len(all_samples),
        "reception_date": primary_sample.created_at.isoformat() if primary_sample.created_at else None,
        "condition": "完好" if not primary_sample.notes else primary_sample.notes,
        "samples": [
            {
                "code": s.code,
                "name": s.name,
                "model": s.model,
                "status": s.status
            }
            for s in all_samples
        ]
    }
    
    return {
        "product_name": primary_sample.name,
        "product_model": primary_sample.model,
        "manufacturer": primary_sample.manufacturer,
        "manufacturer_address": None,  # Would require sample model extension
        "sample_info": sample_info
    }


def get_test_standards(project: Project, template: str) -> Dict[str, Any]:
    """Extract test standards from project and template."""
    # Parse project standard field
    standards_list = []
    
    if project.standard:
        # If project.standard contains multiple standards (comma-separated)
        standard_codes = [s.strip() for s in project.standard.split(",")]
        
        # Map standard codes to full information
        standard_mapping = {
            "GB/T 36951-2018": {"standard": "GB/T 36951-2018", "title": "信息安全技术 物联网感知终端应用安全技术要求"},
            "GB/T 38628-2020": {"standard": "GB/T 38628-2020", "title": "信息安全技术 物联网感知层网关安全技术要求"},
            "ISO/IEC 62443": {"standard": "ISO/IEC 62443", "title": "工业通信网络 网络和系统安全"},
            "OWASP IoT Top 10": {"standard": "OWASP IoT Top 10", "title": "物联网安全十大风险"},
        }
        
        for code in standard_codes:
            if code in standard_mapping:
                standards_list.append(standard_mapping[code])
            else:
                standards_list.append({"standard": code, "title": ""})
    
    # Add template-specific defaults if empty
    if not standards_list and template == "gb_t_iot":
        standards_list = [
            {"standard": "GB/T 36951-2018", "title": "信息安全技术 物联网感知终端应用安全技术要求"},
            {"standard": "GB/T 38628-2020", "title": "信息安全技术 物联网感知层网关安全技术要求"},
        ]
    
    return {
        "test_standards": standards_list
    }


async def get_test_period(session: AsyncSession, project_id: UUID) -> Dict[str, Any]:
    """Calculate test period from task execution times."""
    # Get earliest start time
    start_stmt = (
        select(func.min(Task.start_time))
        .where(Task.project_id == project_id)
        .where(Task.start_time.isnot(None))
    )
    start_result = await session.execute(start_stmt)
    earliest_start = start_result.scalar()
    
    # Get latest end time
    end_stmt = (
        select(func.max(Task.end_time))
        .where(Task.project_id == project_id)
        .where(Task.end_time.isnot(None))
    )
    end_result = await session.execute(end_stmt)
    latest_end = end_result.scalar()
    
    return {
        "test_period_start": earliest_start,
        "test_period_end": latest_end or datetime.now(),  # Use current time if no end time
    }


async def get_test_methodology(session: AsyncSession, project_id: UUID) -> Dict[str, Any]:
    """Generate test methodology and scope from tasks."""
    # Get all completed tasks
    stmt = (
        select(Task)
        .where(Task.project_id == project_id)
        .where(Task.status.in_(["completed", "running"]))
    )
    result = await session.execute(stmt)
    tasks = result.scalars().all()
    
    if not tasks:
        return {
            "test_scope": None,
            "test_methodology": None,
            "test_limitations": "本次测试基于送检样品及提供的技术文档进行，测试结论仅对送检样品负责。"
        }
    
    # Aggregate task types
    task_types = set(task.type for task in tasks)
    
    # Build methodology description
    methodology_map = {
        "ping_scan": "网络存活主机探测",
        "nmap_scan": "端口扫描与服务识别",
        "vuln_scan": "已知漏洞扫描",
        "firmware_analysis": "固件安全分析",
        "fuzzing": "模糊测试",
        "pentest": "渗透测试"
    }
    
    methodology_parts = [methodology_map.get(tt, tt) for tt in task_types]
    test_methodology = "本次测试采用以下方法进行：" + "、".join(methodology_parts) + "。"
    
    # Build scope description
    scope_parts = []
    if "firmware_analysis" in task_types:
        scope_parts.append("固件安全检测（固件提取、逆向分析、敏感信息检查）")
    if "nmap_scan" in task_types or "vuln_scan" in task_types:
        scope_parts.append("网络安全检测（端口扫描、服务识别、漏洞扫描）")
    if "pentest" in task_types or "fuzzing" in task_types:
        scope_parts.append("安全渗透测试（协议模糊测试、认证绕过测试）")
    
    test_scope = "测试范围包括：" + "；".join(scope_parts) + "。" if scope_parts else None
    
    return {
        "test_scope": test_scope,
        "test_methodology": test_methodology,
        "test_limitations": "本次测试基于送检样品及提供的技术文档进行，测试结论仅对送检样品负责。未测试项目不在本报告评价范围内。"
    }


async def calculate_security_assessment(
    session: AsyncSession,
    project_id: UUID,
    standard: str
) -> Dict[str, Any]:
    """
    Calculate security rating and compliance status based on vulnerabilities.
    
    Rating algorithm:
    - Excellent: No CRITICAL, 0-2 HIGH
    - Good: 0-1 CRITICAL, 3-5 HIGH
    - Fair: 2-3 CRITICAL, 6-10 HIGH
    - Poor: 4+ CRITICAL or 11+ HIGH
    """
    # Get vulnerability statistics
    stmt = (
        select(
            Vulnerability.severity,
            func.count(Vulnerability.id)
        )
        .join(Task, Task.id == Vulnerability.task_id)
        .where(Task.project_id == project_id)
        .group_by(Vulnerability.severity)
    )
    result = await session.execute(stmt)
    severity_counts = dict(result.all())
    
    # Normalize severity (handle both uppercase and lowercase)
    critical_count = severity_counts.get("CRITICAL", 0) + severity_counts.get("critical", 0)
    high_count = severity_counts.get("HIGH", 0) + severity_counts.get("high", 0)
    medium_count = severity_counts.get("MEDIUM", 0) + severity_counts.get("medium", 0)
    low_count = severity_counts.get("LOW", 0) + severity_counts.get("low", 0)
    
    # Calculate security rating
    if critical_count == 0 and high_count <= 2:
        security_rating = "excellent"
        rating_text = "优秀"
    elif critical_count <= 1 and high_count <= 5:
        security_rating = "good"
        rating_text = "良好"
    elif critical_count <= 3 and high_count <= 10:
        security_rating = "fair"
        rating_text = "中等"
    else:
        security_rating = "poor"
        rating_text = "较差"
    
    # Determine compliance status
    if critical_count == 0 and high_count == 0:
        compliance_status = "pass"
        compliance_text = "符合"
    elif critical_count == 0 and high_count <= 3:
        compliance_status = "conditional_pass"
        compliance_text = "基本符合"
    else:
        compliance_status = "fail"
        compliance_text = "不符合"
    
    # Generate conclusion
    conclusion = f"""
根据 {standard} 标准要求，本次测试共发现安全问题 {critical_count + high_count + medium_count + low_count} 项，
其中严重漏洞 {critical_count} 项、高危漏洞 {high_count} 项、中危漏洞 {medium_count} 项、低危漏洞 {low_count} 项。

综合评定：送检产品安全性等级为【{rating_text}】，标准符合性判定为【{compliance_text}】。
    """.strip()
    
    # Generate certification recommendation
    if compliance_status == "pass":
        cert_recommendation = "建议通过安全认证。产品安全性能良好，符合相关标准要求。"
    elif compliance_status == "conditional_pass":
        cert_recommendation = f"建议在整改 {high_count} 项高危漏洞后，进行复测并通过安全认证。"
    else:
        cert_recommendation = f"不建议通过安全认证。产品存在 {critical_count} 项严重漏洞和 {high_count} 项高危漏洞，需要进行全面安全加固后重新测试。"
    
    return {
        "security_rating": security_rating,
        "compliance_status": compliance_status,
        "conclusion": conclusion,
        "certification_recommendation": cert_recommendation,
    }
