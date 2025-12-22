"""
漏洞扫描Worker

基于Nmap扫描结果查询CVE数据库
"""
import logging
from typing import Dict, Any, Callable, List
from sqlalchemy.orm import Session

from app.services.nvd_client import NVDClient
from app.models import ScanResult, Vulnerability
from app.core.database import get_db

logger = logging.getLogger(__name__)


async def vuln_scan_worker(
    task_id: str,
    params: Dict[str, Any],
    progress_callback: Callable[[int, str, str, dict], None]
) -> dict:
    """
    漏洞扫描任务
    
    Args:
        task_id: 任务ID
        params: 参数字典，包含:
            - scan_result_id: Nmap扫描结果ID (可选)
            - target_services: 手动指定的服务列表 (可选)
            - severity_filter: 严重程度过滤 (可选)
            - nvd_api_key: NVD API密钥 (可选)
        progress_callback: 进度回调函数
        
    Returns:
        dict: 扫描结果
    """
    scan_result_id = params.get("scan_result_id")
    target_services = params.get("target_services", [])
    severity_filter = params.get("severity_filter", ["CRITICAL", "HIGH", "MEDIUM", "LOW"])
    api_key = params.get("nvd_api_key")
    
    progress_callback(0, "开始漏洞扫描", "INFO")
    
    # 获取服务列表
    services = []
    
    if scan_result_id:
        # 从Nmap结果中提取服务
        progress_callback(10, "从Nmap扫描结果中提取服务信息", "INFO")
        services = await _extract_services_from_scan(scan_result_id, progress_callback)
    elif target_services:
        # 使用手动指定的服务
        services = target_services
    else:
        raise ValueError("Must provide either scan_result_id or target_services")
    
    if not services:
        progress_callback(100, "未发现可扫描的服务", "WARNING")
        return {"vulnerabilities_found": 0, "services_scanned": 0}
    
    progress_callback(20, f"发现 {len(services)} 个服务待扫描", "INFO")
    
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
            "INFO"
        )
        
        try:
            # 查询CVE
            cves = await nvd_client.search_cves(service_name, service_version, max_results=10)
            
            # 过滤严重程度
            filtered_cves = [
                cve for cve in cves
                if cve["severity"] in severity_filter
            ]
            
            if filtered_cves:
                progress_callback(
                    progress,
                    f"发现 {len(filtered_cves)} 个漏洞",
                    "WARNING"
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
                "ERROR"
            )
    
    # 保存结果
    progress_callback(85, "保存漏洞数据到数据库", "INFO")
    
    if scan_result_id:
        await _save_vulnerabilities(task_id, scan_result_id, all_vulnerabilities)
    
    # 完成
    summary = f"扫描完成: 发现 {len(all_vulnerabilities)} 个漏洞，扫描了 {len(services)} 个服务"
    progress_callback(100, summary, "INFO")
    
    return {
        "vulnerabilities_found": len(all_vulnerabilities),
        "services_scanned": len(services),
        "vulnerabilities": all_vulnerabilities
    }


async def _extract_services_from_scan(
    scan_result_id: str,
    progress_callback: Callable
) -> List[Dict]:
    """从扫描结果中提取服务信息"""
    db = next(get_db())
    
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


async def _save_vulnerabilities(
    task_id: str,
    scan_result_id: str,
    vulnerabilities: List[Dict]
):
    """保存漏洞到数据库"""
    db = next(get_db())
    
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
