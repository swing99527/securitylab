"""
漏洞扫描Worker

基于Nmap扫描结果查询CVE数据库
"""
import logging
from typing import Dict, Any, Callable, List
from sqlalchemy.orm import Session

from app.services.nvd_client import NVDClient
from app.models import ScanResult, Vulnerability
from app.core.database import get_sync_db

logger = logging.getLogger(__name__)


def vuln_scan_worker(
    task_id: str,
    params: Dict[str, Any],
    progress_callback: Callable[[int, str, str, dict], None]
) -> dict:
    """
    漏洞扫描任务
    
    Args:
        task_id: 任务ID
        params: 参数字典，包含:
            - scan_result_id: Nmap扫描结果记录ID (可选)
            - nmap_task_id: Nmap任务ID，会自动查询其scan_result (可选)
            - target_services: 手动指定的服务列表 (可选)
            - severity_filter: 严重程度过滤 (可选)
            - nvd_api_key: NVD API密钥 (可选)
        progress_callback: 进度回调函数
        
    Returns:
        dict: 扫描结果
    """
    scan_result_id = params.get("scan_result_id")
    nmap_task_id = params.get("nmap_task_id")
    target_services = params.get("target_services", [])
    severity_filter = params.get("severity_filter", ["CRITICAL", "HIGH", "MEDIUM", "LOW"])
    api_key = params.get("nvd_api_key")
    
    progress_callback(0, "开始漏洞扫描", "INFO", {})
    
    # 如果提供了nmap_task_id，查询其scan_result_id
    if nmap_task_id and not scan_result_id:
        progress_callback(5, f"查询Nmap任务 {nmap_task_id} 的扫描结果", "INFO", {})
        scan_result_id = _get_scan_result_id_from_task(nmap_task_id, progress_callback)
        if not scan_result_id:
            raise ValueError(f"未找到Nmap任务 {nmap_task_id} 的扫描结果，请确保该任务已完成")
    
    # 获取服务列表
    services = []
    
    if scan_result_id:
        # 从Nmap结果中提取服务
        progress_callback(10, "从Nmap扫描结果中提取服务信息", "INFO", {})
        services = _extract_services_from_scan(scan_result_id, progress_callback)
    elif target_services:
        # 使用手动指定的服务
        services = target_services
    else:
        raise ValueError("Must provide either scan_result_id, nmap_task_id, or target_services")
    
    if not services:
        progress_callback(100, "未发现可扫描的服务", "WARNING", {})
        return {"vulnerabilities_found": 0, "services_scanned": 0}
    
    progress_callback(20, f"发现 {len(services)} 个服务待扫描", "INFO", {})
    
    # 初始化NVD客户端
    nvd_client = NVDClient(api_key=api_key)
    
    # 扫描每个服务
    all_vulnerabilities = []
    for idx, service in enumerate(services):
        progress = 20 + int((idx / len(services)) * 60)
        
        service_name = service.get("name")
        service_version = service.get("version", "")
        port = service.get("port")
        
        progress_callback(
            progress,
            f"扫描服务: {service_name} {service_version} (端口{port})",
            "INFO",
            {}
        )
        
        try:
            # 查询CVE (使用同步方法)
            import asyncio
            from datetime import datetime
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                cves = loop.run_until_complete(
                    nvd_client.search_cves(service_name, service_version, max_results=20)
                )
            finally:
                loop.close()
            
            logger.info(f"NVD returned {len(cves)} CVEs for {service_name} {service_version}")
            
            # 多层过滤提高准确性
            filtered_cves = []
            current_year = datetime.now().year
            
            for cve in cves:
                # 1. 过滤严重程度
                if cve["severity"] not in severity_filter:
                    logger.debug(f"Filtered by severity: {cve['cve_id']} ({cve['severity']})")
                    continue
                
                # 2. 时间过滤：排除过于老旧的CVE (15年前，放宽限制)
                if cve.get("published_date"):
                    try:
                        pub_year = int(cve["published_date"][:4])
                        if pub_year < current_year - 15:  # 改为15年
                            logger.debug(f"Filtered old CVE: {cve['cve_id']} ({pub_year})")
                            continue
                    except (ValueError, TypeError):
                        pass
                
                # 3. 版本匹配：如果有版本信息，检查是否真的影响该版本
                if service_version and cve.get("affected_products"):
                    if not nvd_client.is_version_affected(service_version, cve["affected_products"]):
                        logger.debug(f"Filtered non-matching version: {cve['cve_id']} for {service_name} {service_version}")
                        continue
                
                filtered_cves.append(cve)
            
            logger.info(f"After filtering: {len(filtered_cves)} CVEs remain for {service_name}")
            
            if filtered_cves:
                progress_callback(
                    progress,
                    f"发现 {len(filtered_cves)} 个漏洞",
                    "WARNING",
                    {}
                )
                
                # 添加服务信息
                for cve in filtered_cves:
                    cve.update({
                        "service_name": service_name,
                        "service_version": service_version,
                        "port": port,
                        "protocol": service.get("protocol", "tcp")
                    })
                
                all_vulnerabilities.extend(filtered_cves)
            
        except Exception as e:
            logger.error(f"Error scanning {service_name}: {e}")
            progress_callback(
                progress,
                f"扫描失败: {service_name} - {str(e)}",
                "ERROR",
                {}
            )
    
    # 保存结果
    progress_callback(85, "保存漏洞数据到数据库", "INFO", {})
    
    if scan_result_id:
        _save_vulnerabilities(task_id, scan_result_id, all_vulnerabilities)
    
    # 完成
    summary = f"扫描完成: 发现 {len(all_vulnerabilities)} 个漏洞，扫描了 {len(services)} 个服务"
    progress_callback(100, summary, "INFO", {})
    
    # 统计各严重程度数量
    severity_counts = {
        "critical_count": sum(1 for v in all_vulnerabilities if v.get("severity") == "CRITICAL"),
        "high_count": sum(1 for v in all_vulnerabilities if v.get("severity") == "HIGH"),
        "medium_count": sum(1 for v in all_vulnerabilities if v.get("severity") == "MEDIUM"),
        "low_count": sum(1 for v in all_vulnerabilities if v.get("severity") == "LOW"),
    }
    
    return {
        "vulnerabilities_found": len(all_vulnerabilities),
        "services_scanned": len(services),
        "vulnerabilities": all_vulnerabilities,
        **severity_counts
    }


def _get_scan_result_id_from_task(
    nmap_task_id: str,
    progress_callback: Callable
) -> str:
    """从Nmap任务ID获取最新的scan_result记录ID"""
    db = next(get_sync_db())
    
    try:
        # 查询该任务最新的scan_result
        scan_result = db.query(ScanResult).filter(
            ScanResult.task_id == nmap_task_id
        ).order_by(ScanResult.created_at.desc()).first()
        
        if scan_result:
            logger.info(f"Found scan_result {scan_result.id} for task {nmap_task_id}")
            return str(scan_result.id)
        else:
            logger.warning(f"No scan_result found for task {nmap_task_id}")
            return None
            
    finally:
        db.close()


def _extract_services_from_scan(
    scan_result_id: str,
    progress_callback: Callable
) -> List[Dict]:
    """从扫描结果中提取服务信息"""
    db = next(get_sync_db())
    
    try:
        scan_result = db.query(ScanResult).filter(
            ScanResult.id == scan_result_id
        ).first()
        
        if not scan_result:
            raise ValueError(f"Scan result not found: {scan_result_id}")
        
        # 解析结果
        result_data = scan_result.result
        services = []
        
        for host in result_data.get("hosts", []):
            for port_data in host.get("ports", []):
                service_name = port_data.get("service")
                service_version = port_data.get("version", "")
                
                # 只扫描已识别的服务
                if service_name and service_name not in ["unknown", "tcpwrapped"]:
                    services.append({
                        "name": service_name,
                        "version": service_version,
                        "port": port_data.get("port"),
                        "protocol": port_data.get("protocol", "tcp"),
                        "product": port_data.get("product", "")
                    })
        
        logger.info(f"Extracted {len(services)} services from scan result")
        return services
        
    finally:
        db.close()


def _save_vulnerabilities(
    task_id: str,
    scan_result_id: str,
    vulnerabilities: List[Dict]
):
    """保存漏洞到数据库"""
    db = next(get_sync_db())
    
    try:
        for vuln_data in vulnerabilities:
            vulnerability = Vulnerability(
                task_id=task_id,
                scan_result_id=scan_result_id,
                cve_id=vuln_data["cve_id"],
                cve_description=vuln_data["description"],
                service_name=vuln_data["service_name"],
                service_version=vuln_data["service_version"],
                port=vuln_data["port"],
                protocol=vuln_data["protocol"],
                severity=vuln_data["severity"],
                status="open",
                cvss_score=vuln_data["cvss_score"],
                cvss_vector=vuln_data["cvss_vector"],
                published_date=vuln_data.get("published_date"),
                last_modified_date=vuln_data.get("last_modified_date"),
                references=vuln_data.get("references", [])
            )
            db.add(vulnerability)
        
        db.commit()
        logger.info(f"Saved {len(vulnerabilities)} vulnerabilities")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving vulnerabilities: {e}")
        raise
    finally:
        db.close()
