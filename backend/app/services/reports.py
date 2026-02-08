"""
Report service layer
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from typing import Optional
from uuid import UUID
from datetime import datetime
import re
import base64
from pathlib import Path

from app.models import Report, Project, User
from app.schemas.reports import ReportCreate, ReportUpdate
from app.services import report_data_aggregator
from app.services.report_sections_helper import (
    _generate_test_object_section,
    _generate_standards_and_scope_section,
    _generate_conclusion_section,
    _generate_fuzzing_section
)

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

    return report

async def _aggregate_firmware_findings(tasks: list) -> tuple[str, int, int, int]:
    """
    Aggregate firmware analysis findings from completed tasks
    Returns: (html_content, total_findings, critical_count, high_count)
    """
    firmware_section = "<h3>2. 固件分析结果</h3>"
    total_findings = 0
    critical_count = 0
    high_count = 0
    
    firmware_tasks = [t for t in tasks if t.type == 'firmware_analysis' and t.results]
    
    if not firmware_tasks:
        firmware_section += "<p>无固件分析任务。</p>"
        return firmware_section, 0, 0, 0
    
    for task in firmware_tasks:
        results = task.results
        firmware_section += f"<h4>任务: {task.name} ({task.code})</h4>"
        
        # Extraction Info
        if 'extraction' in results:
            ext = results['extraction']
            firmware_section += f"""
            <p><strong>文件系统:</strong> {ext.get('filesystem_type', 'Unknown')}</p>
            <p><strong>提取文件数:</strong> {ext.get('total_files', 0)}</p>
            """
        
        # Findings
        if 'findings' in results and results['findings']:
            firmware_section += "<table border='1' cellspacing='0' cellpadding='5' style='width:100%; border-collapse: collapse;'>"
            firmware_section += "<tr style='background-color: #f2f2f2;'><th>严重程度</th><th>类型</th><th>文件</th><th>描述</th><th>匹配内容</th></tr>"
            
            for f in results['findings']:
                severity = f.get('severity', 'UNKNOWN')
                color = "black"
                if severity == 'CRITICAL': 
                    color = "red"
                    critical_count += 1
                    total_findings += 1
                elif severity == 'HIGH': 
                    color = "orange"
                    high_count += 1
                    total_findings += 1
                
                matched = f.get('matched', '')
                if len(matched) > 50:
                    matched = matched[:47] + "..."
                    
                firmware_section += f"""
                <tr>
                    <td style='color:{color}; font-weight:bold;'>{severity}</td>
                    <td>{f.get('type')}</td>
                    <td>{f.get('file')}</td>
                    <td>{f.get('description')}</td>
                    <td style='font-family:monospace; font-size: 0.9em; word-break: break-all;'>{matched}</td>
                </tr>
                """
            firmware_section += "</table><br/>"
        else:
            firmware_section += "<p>未发现明显漏洞。</p>"
    
    return firmware_section, total_findings, critical_count, high_count


async def _aggregate_network_topology(session: AsyncSession, project_id: UUID) -> str:
    """
    Aggregate network scan results from ScanResult table
    Returns: HTML content for network topology section
    """
    from app.models import ScanResult, Task
    
    # Query scan results through tasks
    stmt = select(ScanResult).join(Task).where(
        and_(
            Task.project_id == project_id,
            Task.status == 'completed',
            Task.type == 'nmap_scan'
        )
    )
    result = await session.execute(stmt)
    scan_results = result.scalars().all()
    
    if not scan_results:
        return "<h3>3. 网络拓扑</h3><p>无网络扫描数据。</p>"
    
    network_section = "<h3>3. 网络拓扑</h3>"
    
    total_hosts = 0
    total_ports = 0
    
    for scan in scan_results:
        result_data = scan.result
        hosts = result_data.get('hosts', [])
        total_hosts += len(hosts)
        
        network_section += f"<h4>扫描目标: {scan.target}</h4>"
        
        for host in hosts:
            ip = host.get('ip')
            hostname = host.get('hostname', 'N/A')
            state = host.get('state', 'unknown')
            ports = host.get('ports', [])
            
            total_ports += len(ports)
            
            network_section += f"""
            <div style='margin-bottom: 15px;'>
                <p><strong>主机:</strong> {ip} ({hostname}) - 状态: {state}</p>
            """
            
            if ports:
                network_section += "<table border='1' cellspacing='0' cellpadding='5' style='width:100%; border-collapse: collapse;'>"
                network_section += "<tr style='background-color: #f2f2f2;'><th>端口</th><th>协议</th><th>状态</th><th>服务</th><th>版本</th></tr>"
                
                for port in ports:
                    port_num = port.get('port')
                    protocol = port.get('protocol', 'tcp')
                    port_state = port.get('state', 'unknown')
                    service = port.get('service', 'unknown')
                    version = port.get('version', '')
                    product = port.get('product', '')
                    
                    version_info = f"{product} {version}".strip()
                    
                    # Highlight open ports
                    state_color = "green" if port_state == "open" else "gray"
                    
                    network_section += f"""
                    <tr>
                        <td><strong>{port_num}</strong></td>
                        <td>{protocol}</td>
                        <td style='color:{state_color};'>{port_state}</td>
                        <td>{service}</td>
                        <td>{version_info}</td>
                    </tr>
                    """
                
                network_section += "</table>"
            else:
                network_section += "<p>无开放端口。</p>"
            
            network_section += "</div>"
    
    network_section += f"<p><strong>汇总:</strong> 发现 {total_hosts} 台主机，{total_ports} 个开放端口。</p>"
    
    return network_section


async def _aggregate_vulnerabilities(session: AsyncSession, project_id: UUID) -> tuple[str, int, int, int, int]:
    """
    Aggregate CVE vulnerabilities from Vulnerability table
    Returns: (html_content, critical, high, medium, low counts)
    """
    from app.models import Vulnerability, Task
    
    # Query vulnerabilities through tasks
    stmt = select(Vulnerability).join(Task).where(
        and_(
            Task.project_id == project_id,
            Task.status == 'completed'
        )
    ).order_by(Vulnerability.cvss_score.desc())
    
    result = await session.execute(stmt)
    vulnerabilities = result.scalars().all()
    
    if not vulnerabilities:
        return "<h3>4. 漏洞分析</h3><p>无已知漏洞。</p>", 0, 0, 0, 0
    
    # Count by severity
    critical = sum(1 for v in vulnerabilities if v.severity == 'CRITICAL')
    high = sum(1 for v in vulnerabilities if v.severity == 'HIGH')
    medium = sum(1 for v in vulnerabilities if v.severity == 'MEDIUM')
    low = sum(1 for v in vulnerabilities if v.severity == 'LOW')
    
    vuln_section = "<h3>4. 漏洞分析</h3>"
    vuln_section += f"""
    <p><strong>漏洞统计:</strong></p>
    <ul>
        <li style='color: red;'><strong>严重 (CRITICAL):</strong> {critical}</li>
        <li style='color: orange;'><strong>高危 (HIGH):</strong> {high}</li>
        <li style='color: #ff9800;'><strong>中危 (MEDIUM):</strong> {medium}</li>
        <li style='color: #2196f3;'><strong>低危 (LOW):</strong> {low}</li>
    </ul>
    """
    
    vuln_section += "<table border='1' cellspacing='0' cellpadding='5' style='width:100%; border-collapse: collapse;'>"
    vuln_section += "<tr style='background-color: #f2f2f2;'><th>CVE ID</th><th>严重程度</th><th>CVSS</th><th>服务</th><th>端口</th><th>描述</th></tr>"
    
    for vuln in vulnerabilities:
        severity = vuln.severity
        severity_color = {
            'CRITICAL': 'red',
            'HIGH': 'orange',
            'MEDIUM': '#ff9800',
            'LOW': '#2196f3'
        }.get(severity, 'black')
        
        cve_id = vuln.cve_id or vuln.cve or 'N/A'
        cvss = f"{vuln.cvss_score:.1f}" if vuln.cvss_score else "N/A"
        service = f"{vuln.service_name} {vuln.service_version}".strip() or "N/A"
        port = vuln.port or "N/A"
        
        # Truncate description
        description = vuln.cve_description or vuln.description or "无描述"
        if len(description) > 100:
            description = description[:97] + "..."
        
        vuln_section += f"""
        <tr>
            <td><strong>{cve_id}</strong></td>
            <td style='color:{severity_color}; font-weight:bold;'>{severity}</td>
            <td>{cvss}</td>
            <td>{service}</td>
            <td>{port}</td>
            <td>{description}</td>
        </tr>
        """
    
    vuln_section += "</table>"
    
    return vuln_section, critical, high, medium, low


async def _aggregate_fuzzing_results(tasks: list) -> tuple[str, int]:
    """
    Aggregate fuzzing test results from completed tasks
    Returns: (HTML content, total crashes found)
    """
    fuzzing_tasks = [t for t in tasks if t.type == 'fuzzing' and t.results]
    
    if not fuzzing_tasks:
        return "", 0
    
    total_crashes = 0
    fuzzing_html = """
    <h3>模糊测试概述</h3>
    <p>本次模糊测试针对目标系统进行了自动化异常输入测试，旨在发现潜在的崩溃、内存泄漏和异常行为。</p>
    <table>
        <thead>
            <tr>
                <th>测试目标</th>
                <th>测试用例数</th>
                <th>发现崩溃</th>
                <th>覆盖率</th>
                <th>状态</th>
            </tr>
        </thead>
        <tbody>
    """
    
    for task in fuzzing_tasks:
        results = task.results or {}
        target = results.get('target_url', results.get('target', 'Unknown'))
        test_cases = results.get('total_requests', results.get('total_test_cases', 0))
        crashes = results.get('vulnerabilities_found', results.get('crashes_found', 0))
        coverage = results.get('coverage_percent', 0)
        status = 'completed' if task.status == 'completed' else task.status
        
        total_crashes += crashes
        
        fuzzing_html += f"""
            <tr>
                <td>{target}</td>
                <td>{test_cases}</td>
                <td><strong>{crashes}</strong></td>
                <td>{coverage}%</td>
                <td>{status}</td>
            </tr>
        """
    
    fuzzing_html += """
        </tbody>
    </table>
    """
    
    # Add crash details if any
    if total_crashes > 0:
        fuzzing_html += "<h4>发现的漏洞详情</h4>"
        for task in fuzzing_tasks:
            results = task.results or {}
            # Try 'findings' first (actual field name), then 'vulnerabilities', then 'crash_details'
            vulns = results.get('findings', results.get('vulnerabilities', results.get('crash_details', [])))
            if vulns:
                fuzzing_html += "<ul>"
                for vuln in vulns[:10]:
                    vuln_type = vuln.get('type', 'Unknown')
                    payload = vuln.get('payload', vuln.get('input', ''))[:100]
                    fuzzing_html += f"<li><strong>{vuln_type}</strong>: {payload}</li>"
                fuzzing_html += "</ul>"
    
    return fuzzing_html, total_crashes


async def generate_project_report_content(session: AsyncSession, project_id: UUID, template_type: str = "custom") -> dict:
    """
    Generate comprehensive report content based on project tasks
    Aggregates data from: Firmware Analysis, Network Scans, Vulnerability Scans
    """
    from app.models import Task
    
    # Fetch all completed tasks
    stmt = select(Task).where(
        and_(
            Task.project_id == project_id,
            Task.status == 'completed'
        )
    )
    result = await session.execute(stmt)
    tasks = result.scalars().all()
    
    if not tasks:
        return {
            "sections": [
                {
                    "id": "summary",
                    "title": "执行摘要",
                    "content": "<p>该项目暂无已完成的检测任务。</p>"
                }
            ]
        }
    
    # Aggregate data from different sources
    firmware_content, fw_findings, fw_critical, fw_high = await _aggregate_firmware_findings(tasks)
    network_content = await _aggregate_network_topology(session, project_id)
    vuln_content, vuln_critical, vuln_high, vuln_medium, vuln_low = await _aggregate_vulnerabilities(session, project_id)
    fuzzing_content, fuzzing_crashes = await _aggregate_fuzzing_results(tasks)
    
    # Combine findings
    total_critical = fw_critical + vuln_critical
    total_high = fw_high + vuln_high
    total_findings = fw_findings + vuln_critical + vuln_high + vuln_medium + vuln_low + fuzzing_crashes
    
    # Build summary
    summary_html = f"""
    <p>本次安全检测针对项目ID <strong>{project_id}</strong> 进行，共完成 <strong>{len(tasks)}</strong> 项检测任务。</p>
    <h4>漏洞汇总</h4>
    <ul>
        <li>总计发现漏洞: <strong>{total_findings}</strong></li>
        <li style='color: red;'>严重漏洞 (CRITICAL): <strong>{total_critical}</strong></li>
        <li style='color: orange;'>高危漏洞 (HIGH): <strong>{total_high}</strong></li>
        <li>中危漏洞 (MEDIUM): <strong>{vuln_medium}</strong></li>
        <li>低危漏洞 (LOW): <strong>{vuln_low}</strong></li>
    </ul>
    <p>检测由 SecurityLab 自动化平台生成。</p>
    """
    
    # Determine overall risk
    if total_critical > 0:
        risk_level = "高"
        risk_color = "red"
    elif total_high > 0:
        risk_level = "中"
        risk_color = "orange"
    else:
        risk_level = "低"
        risk_color = "green"
    
    risk_html = f"""
    <p>基于上述发现，项目整体风险等级评定为：<strong style='color:{risk_color};'>{risk_level}</strong>。</p>
    <h4>建议措施</h4>
    <ul>
    """
    
    if total_critical > 0:
        risk_html += "<li>立即修复所有严重漏洞，优先处理可被远程利用的漏洞</li>"
    if total_high > 0:
        risk_html += "<li>在下一版本中修复高危漏洞</li>"
    if vuln_medium > 0:
        risk_html += "<li>制定中危漏洞修复计划</li>"
    
    risk_html += "<li>定期进行安全扫描，监控新漏洞</li>"
    risk_html += "<li>加强安全开发培训，从源头减少漏洞</li>"
    risk_html += "</ul>"
    
    # Construct final content structure
    return {
        "sections": [
            {
                "id": "summary",
                "title": "执行摘要",
                "content": summary_html
            },
            {
                "id": "firmware",
                "title": "固件分析",
                "content": firmware_content
            },
            {
                "id": "network",
                "title": "网络拓扑",
                "content": network_content
            },
            {
                "id": "fuzzing",
                "title": "模糊测试",
                "content": fuzzing_content if fuzzing_content else "<p>未进行模糊测试。</p>"
            },
            {
                "id": "vulnerabilities",
                "title": "漏洞分析",
                "content": vuln_content
            },
            {
                "id": "risk",
                "title": "风险评估与建议",
                "content": risk_html
            }
        ]
    }

async def create_report(
    session: AsyncSession,
    report_data: ReportCreate,
    author_id: UUID
) -> Report:
    """Create a new report with intelligent auto-fill from project data"""
    # Generate unique code
    code = await generate_report_code(session, report_data.project_id)
    
    # Auto-aggregate metadata from project/sample/task if not provided
    # This allows manual overrides while auto-filling missing fields
    auto_data = await report_data_aggregator.aggregate_report_data(
        session=session,
        project_id=report_data.project_id,
        template=getattr(report_data, 'template', 'gb_t_iot'),
        sample_id=getattr(report_data, 'sample_id', None)
    )
    
    # Merge: prioritize user-provided data, use auto-filled as fallback
    def merge_field(user_value, auto_value):
        """Return user value if provided, otherwise auto value"""
        return user_value if user_value is not None else auto_value
    
    # Auto-generate content if not provided
    content = report_data.content
    if not content or not content.get("sections"):
        content = await generate_project_report_content(session, report_data.project_id)
    
    # Create report with merged data
    report = Report(
        code=code,
        title=report_data.title,
        project_id=report_data.project_id,
        version=report_data.version or "v1.0",
        content=content,
        author_id=author_id,
        status="draft",
        # Client & Testing Organization (auto-filled from project)
        client_company=merge_field(report_data.client_company, auto_data.get('client_company')),
        client_contact=merge_field(report_data.client_contact, auto_data.get('client_contact')),
        client_address=merge_field(report_data.client_address, auto_data.get('client_address')),
        testing_organization=merge_field(report_data.testing_organization, auto_data.get('testing_organization')),
        # Product (auto-filled from sample)
        product_name=merge_field(report_data.product_name, auto_data.get('product_name')),
        product_model=merge_field(report_data.product_model, auto_data.get('product_model')),
        manufacturer=merge_field(report_data.manufacturer, auto_data.get('manufacturer')),
        manufacturer_address=merge_field(report_data.manufacturer_address, auto_data.get('manufacturer_address')),
        sample_info=merge_field(report_data.sample_info, auto_data.get('sample_info')),
        # Test Standards & Scope (auto-filled from project + tasks)
        test_standards=merge_field(report_data.test_standards, auto_data.get('test_standards')),
        test_scope=merge_field(report_data.test_scope, auto_data.get('test_scope')),
        test_methodology=merge_field(report_data.test_methodology, auto_data.get('test_methodology')),
        test_limitations=merge_field(report_data.test_limitations, auto_data.get('test_limitations')),
        test_period_start=merge_field(report_data.test_period_start, auto_data.get('test_period_start')),
        test_period_end=merge_field(report_data.test_period_end, auto_data.get('test_period_end')),
        # Conclusion (auto-calculated from vulnerabilities)
        security_rating=merge_field(report_data.security_rating, auto_data.get('security_rating')),
        compliance_status=merge_field(report_data.compliance_status, auto_data.get('compliance_status')),
        certification_recommendation=merge_field(report_data.certification_recommendation, auto_data.get('certification_recommendation')),
        conclusion=merge_field(report_data.conclusion, auto_data.get('conclusion')),
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

async def sign_report(
    session: AsyncSession,
    report_id: UUID,
    signer_id: UUID
) -> Optional[Report]:
    """Sign an approved report (electronic signature)"""
    report = await session.get(Report, report_id)
    if not report or report.status != "approved":
        return None
    
    report.status = "signed"
    report.approver_id = signer_id  # Record who signed it
    # Keep approved_at timestamp, as it's already set
    
    await session.commit()
    await session.refresh(report)
    
    return report



async def export_report_pdf(session: AsyncSession, report_id: UUID) -> bytes:
    """
    Export report as PDF using WeasyPrint
    
    Args:
        session: Database session
        report_id: Report UUID
        
    Returns:
        PDF file bytes
        
    Raises:
        ValueError: If report not found
    """
    from weasyprint import HTML, CSS
    
    # Fetch report with relations
    report = await get_report(session, report_id)
    if not report:
        raise ValueError(f"Report not found: {report_id}")
    
    # Build HTML document
    html_content = await _build_pdf_html(report, session)
    css_content = _get_pdf_stylesheet()
    
    # Generate PDF using WeasyPrint
    html = HTML(string=html_content)
    pdf_bytes = html.write_pdf(stylesheets=[CSS(string=css_content)])
    
    return pdf_bytes


async def preview_report_html(session: AsyncSession, report_id: UUID) -> str:
    """
    Generate HTML preview of report for frontend display.
    Returns the same HTML that would be used for PDF generation.
    
    Args:
        session: Database session
        report_id: Report UUID
        
    Returns:
        HTML string for preview display
        
    Raises:
        ValueError: If report not found
    """
    # Fetch report with relations
    report = await get_report(session, report_id)
    if not report:
        raise ValueError(f"Report not found: {report_id}")
    
    # Build HTML document (same as PDF)
    # Build HTML document (same as PDF)
    html_content = await _build_pdf_html(report, session)
    
    # Embed local images for browser preview
    html_content = _embed_local_images(html_content)
    
    css_content = _get_pdf_stylesheet()
    
    # Return complete HTML with embedded CSS for preview
    preview_html = f"""
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <style>
            {css_content}
            /* Override for web preview - wider layout with !important */
            body {{ 
                max-width: 100% !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 20px 40px !important;
                background: #f5f5f5 !important;
                box-sizing: border-box !important;
            }}
            .cover-page {{
                background: white !important;
                padding: 50px 80px !important;
                margin-bottom: 20px !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
                border-radius: 8px !important;
                height: auto !important;
                page-break-after: auto !important;
            }}
            .report-content {{
                background: white !important;
                padding: 40px 80px !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
                border-radius: 8px !important;
            }}
            .section {{
                margin-bottom: 30px !important;
            }}
            .section-content {{
                line-height: 1.8 !important;
            }}
            .page-break {{
                height: 40px !important;
                background: #f5f5f5 !important;
                page-break-after: auto !important;
            }}
        </style>
    </head>
    {html_content.split('<body>')[1] if '<body>' in html_content else html_content}
    """
    
    return preview_html


def _embed_local_images(html: str) -> str:
    """Replace local image paths with base64 data URIs for browser preview"""
    def replace_match(match):
        src = match.group(1)
        # Check if it's a local file path (starts with /app or /tmp)
        if src.startswith('/app/') or src.startswith('/tmp/'):
            try:
                file_path = Path(src)
                if file_path.exists() and file_path.is_file():
                    with open(file_path, "rb") as f:
                        data = base64.b64encode(f.read()).decode('utf-8')
                        
                        # Determine mime type
                        suffix = file_path.suffix.lower()
                        mime_type = "image/png"  # Default
                        if suffix in ['.jpg', '.jpeg']:
                            mime_type = "image/jpeg"
                        elif suffix == '.svg':
                            mime_type = "image/svg+xml"
                        elif suffix == '.gif':
                            mime_type = "image/gif"
                            
                        return f'src="data:{mime_type};base64,{data}"'
            except Exception as e:
                # Log error but keep original path
                print(f"Error embedding image {src}: {e}")
                
        return match.group(0)

    # Regex for src="/path" - handles both single and double quotes
    return re.sub(r'src=["\']([^"\']+)["\']', replace_match, html)


async def _build_pdf_html(report: Report, session: AsyncSession) -> str:
    """Build complete HTML document for PDF generation"""
    
    project_name = report.project.name if report.project else "Unknown Project"
    project_code = report.project.code if report.project else "N/A"
    author_name = report.author.name if report.author else "System"
    
    # Build client and organization info
    client_info_html = ""
    if report.client_company:
        client_info_html += f"<p><strong>委托单位:</strong> {report.client_company}</p>"
    if report.testing_organization:
        client_info_html += f"<p><strong>检测机构:</strong> {report.testing_organization}</p>"
    
    # Build product info for cover
    product_info_html = ""
    if report.product_name:
        product_info_html += f"<p><strong>产品名称:</strong> {report.product_name}</p>"
    if report.product_model:
        product_info_html += f"<p><strong>产品型号:</strong> {report.product_model}</p>"
    if report.manufacturer:
        product_info_html += f"<p><strong>制造商:</strong> {report.manufacturer}</p>"
    
    # Extract sections from report content
    sections = report.content.get("sections", [])
    sections_html = ""
    
    # Insert metadata-based sections before technical sections
    # 1. Test Object Section (if metadata exists)
    test_object_html = _generate_test_object_section(report)
    if test_object_html:
        sections_html += f"""
        <div class="section">
            <h2 class="section-title">测试对象信息</h2>
            <div class="section-content">
                {test_object_html}
            </div>
        </div>
        """
    
    # 2. Standards and Scope Section (if metadata exists)
    standards_html = _generate_standards_and_scope_section(report)
    if standards_html:
        sections_html += f"""
        <div class="section">
            <h2 class="section-title">测试依据与范围</h2>
            <div class="section-content">
                {standards_html}
            </div>
        </div>
        """
    
    # 3. Original content sections (firmware, network, vulnerabilities, risk)
    for section in sections:
        section_title = section.get("title", "")
        section_content = section.get("content", "")
        
        sections_html += f"""
        <div class="section">
            <h2 class="section-title">{section_title}</h2>
            <div class="section-content">
                {section_content}
            </div>
        </div>
        """
    
    # 3.5 Fuzzing Results Section (dynamically fetched)
    fuzzing_html = await _generate_fuzzing_section(report, session)
    if fuzzing_html:
        sections_html += fuzzing_html
    
    # 4. Conclusion Section (if metadata exists)
    # Calculate totals from content for conclusion
    total_critical = 0
    total_high = 0
    for section in sections:
        content = section.get("content", "")
        if "CRITICAL" in content:
            total_critical +=str(content).count("CRITICAL")
        if "HIGH" in content:
            total_high += str(content).count("HIGH")
    
    conclusion_html = _generate_conclusion_section(report, total_critical, total_high)
    if conclusion_html:
        sections_html += f"""
        <div class="section">
            <h2 class="section-title">测试结论</h2>
            <div class="section-content">
                {conclusion_html}
            </div>
        </div>
        """

    
    # Build complete HTML
    html = f"""
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <title>{report.title}</title>
    </head>
    <body>
        <!-- Cover Page -->
        <div class="cover-page">
            <div class="cover-content">
                <h1 class="report-title">{report.title}</h1>
                <div class="report-meta">
                    <p><strong>报告编号:</strong> {report.code}</p>
                    <p><strong>项目名称:</strong> {project_name}</p>
                    <p><strong>项目编号:</strong> {project_code}</p>
                    {product_info_html}
                    {client_info_html}
                    <p><strong>版本:</strong> {report.version}</p>
                    <p><strong>生成日期:</strong> {report.created_at.strftime('%Y-%m-%d %H:%M:%S') if report.created_at else 'N/A'}</p>
                    <p><strong>生成人:</strong> {author_name}</p>
                </div>
                <div class="logo">
                    <h2>汕头人工智能实验室</h2>
                </div>
            </div>
        </div>
        
        
        <!-- Report Content -->
        <div class="report-content">
            {sections_html}
        </div>
        
        <!-- Footer (appears on every page) -->
        <div class="footer">
            <p>汕头人工智能实验室 智能玩具安全检测中心 | {report.code}</p>
        </div>
    </body>
    </html>
    """
    
    return html


def _get_pdf_stylesheet() -> str:
    """Get CSS stylesheet for PDF rendering"""
    
    return """
    @page {
        size: A4;
        margin: 2.5cm 2cm 3cm 2cm;
        
        @bottom-center {
            content: counter(page);
            font-size: 10pt;
            color: #666;
        }
    }
    
    body {
        font-family: "Noto Sans CJK SC", "Source Han Sans CN", "WenQuanYi Zen Hei", "WenQuanYi Micro Hei", "Microsoft YaHei", "DejaVu Sans", "Liberation Sans", Arial, sans-serif;
        font-size: 11pt;
        line-height: 1.6;
        color: #333;
    }
    
    /* Cover Page */
    .cover-page {
        page-break-after: always;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
    }
    
    .cover-content {
        width: 100%;
    }
    
    .report-title {
        font-size: 28pt;
        font-weight: bold;
        color: #1a1a1a;
        margin-bottom: 1.5cm;
    }
    
    .report-meta {
        font-size: 12pt;
        line-height: 2;
        margin-bottom: 1.5cm;
    }
    
    .report-meta p {
        margin: 0.3cm 0;
    }
    
    .logo {
        margin-top: 2cm;
        font-size: 18pt;
        color: #2196F3;
    }
    
    .logo p {
        font-size: 12pt;
        color: #666;
        margin-top: 0.5cm;
    }
    
    /* Content Styling */
    .section {
        margin-bottom: 1.5cm;
        page-break-inside: avoid;
    }
    
    .section-title {
        font-size: 16pt;
        font-weight: bold;
        color: #2196F3;
        border-bottom: 2pt solid #2196F3;
        padding-bottom: 0.3cm;
        margin-top: 1cm;
        margin-bottom: 0.8cm;
    }
    
    .section-content h3 {
        font-size: 14pt;
        font-weight: bold;
        color: #333;
        margin-top: 0.8cm;
        margin-bottom: 0.4cm;
    }
    
    .section-content h4 {
        font-size: 12pt;
        font-weight: bold;
        color: #555;
        margin-top: 0.6cm;
        margin-bottom: 0.3cm;
    }
    
    /* Tables */
    table {
        width: 100%;
        border-collapse: collapse;
        margin: 0.5cm 0;
        font-size: 10pt;
        page-break-inside: auto;
    }
    
    tr {
        page-break-inside: avoid;
        page-break-after: auto;
    }
    
    th {
        background-color: #f2f2f2;
        font-weight: bold;
        padding: 0.3cm;
        text-align: left;
        border: 1pt solid #ddd;
    }
    
    td {
        padding: 0.25cm;
        border: 1pt solid #ddd;
        vertical-align: top;
    }
    
    /* Lists */
    ul, ol {
        margin: 0.3cm 0;
        padding-left: 1cm;
    }
    
    li {
        margin: 0.2cm 0;
    }
    
    /* Paragraphs */
    p {
        margin: 0.3cm 0;
        text-align: justify;
    }
    
    /* Code/Monospace */
    code, pre {
        font-family: "DejaVu Sans Mono", "Courier New", monospace;
        font-size: 9pt;
        background-color: #f5f5f5;
        padding: 0.1cm 0.2cm;
        border-radius: 3pt;
    }
    
    /* Footer */
    .footer {
        position: fixed;
        bottom: 1cm;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 9pt;
        color: #999;
    }
    
    /* Utilities */
    .page-break {
        page-break-after: always;
    }
    
    strong {
        font-weight: bold;
        color: #1a1a1a;
    }
    """
