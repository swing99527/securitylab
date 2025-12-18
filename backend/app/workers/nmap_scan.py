"""
Nmap扫描Worker

实现端口扫描和服务识别功能
"""
import nmap
import logging
from typing import Dict, Any, Callable

logger = logging.getLogger(__name__)


def nmap_scan_worker(
    task_id: str,
    params: Dict[str, Any],
    progress_callback: Callable[[int, str, str, dict], None]
) -> dict:
    """
    Nmap扫描任务
    
    Args:
        task_id: 任务ID
        params: 参数字典，包含:
            - target: 目标IP或域名
            - scanType: 扫描类型 (quick/full/stealth/custom)
            - ports: 端口范围 (custom时有效)
            - timing: 扫描速度 T0-T5 (custom时有效)
            - serviceDetection: 是否检测服务版本
            - osDetection: 是否检测操作系统
            - verboseOutput: 是否详细输出
            - skipHostDiscovery: 是否禁用主机发现
        progress_callback: 进度回调函数
        
    Returns:
        dict: 扫描结果
    """
    target = params.get("target")
    scan_type = params.get("scanType", "quick")
    
    if not target:
        raise ValueError("Missing required parameter: target")
    
    logger.info(f"Starting nmap scan for {target} (type={scan_type})")
    progress_callback(0, f"开始Nmap扫描: {target}", "INFO")
    
    # 构建nmap参数
    arguments = _build_nmap_args(params)
    progress_callback(10, f"扫描参数: {arguments}", "INFO")
    
    # 执行扫描
    try:
        nm = nmap.PortScanner()
        nm.scan(hosts=target, arguments=arguments)
        
        # 初始化结果
        results = {
            'target': target,
            'scan_type': scan_type,
            'hosts': [],
            'ports_found': 0,
            'services_identified': 0
        }
        
        # 解析扫描结果
        for host in nm.all_hosts():
            progress_callback(30, f"解析主机结果: {host}", "INFO")
            
            host_info = {
                'ip': host,
                'hostname': nm[host].hostname(),
                'state': nm[host].state(),
                'ports': []
            }
            
            # 解析端口信息
            for proto in nm[host].all_protocols():
                ports = nm[host][proto].keys()
                
                for port in sorted(ports):
                    port_info = nm[host][proto][port]
                    
                    port_data = {
                        'port': port,
                        'protocol': proto,
                        'state': port_info['state'],
                        'service': port_info['name'],
                        'version': port_info.get('version', ''),
                        'product': port_info.get('product', ''),
                        'extrainfo': port_info.get('extrainfo', '')
                    }
                    
                    host_info['ports'].append(port_data)
                    results['ports_found'] += 1
                    
                    # 统计识别的服务
                    if port_info.get('version') or port_info.get('product'):
                        results['services_identified'] += 1
                    
                    # 进度日志
                    service_name = port_info['name']
                    version_info = f" {port_info.get('product', '')} {port_info.get('version', '')}".strip()
                    
                    progress_callback(
                        50 + (len(host_info['ports']) % 40),
                        f"发现端口: {port}/{proto} - {service_name}{version_info}",
                        "INFO"
                    )
            
            results['hosts'].append(host_info)
        
        # 完成
        summary = f"扫描完成: 发现{results['ports_found']}个端口, 识别{results['services_identified']}个服务"
        progress_callback(100, summary, "INFO")
        
        logger.info(f"Nmap scan completed for {target}: {results['ports_found']} ports found")
        return results
        
    except nmap.PortScannerError as e:
        error_msg = f"Nmap扫描失败: {str(e)}"
        progress_callback(0, error_msg, "ERROR")
        logger.error(error_msg)
        raise
    except Exception as e:
        error_msg = f"扫描过程出错: {str(e)}"
        progress_callback(0, error_msg, "ERROR")
        logger.error(error_msg)
        raise


def _build_nmap_args(params: Dict[str, Any]) -> str:
    """
    构建nmap命令参数
    
    Args:
        params: 扫描参数
        
    Returns:
        str: nmap命令行参数
    """
    scan_type = params.get('scanType', 'quick')
    
    if scan_type == 'quick':
        # 快速扫描：Top 100端口
        args = '-T4 --top-ports 100'
        
    elif scan_type == 'full':
        # 完整扫描：所有端口 + 服务检测
        args = '-T4 -p- -sV'
        
    elif scan_type == 'stealth':
        # 隐蔽扫描：SYN扫描（不完成TCP连接）
        args = '-sS -T2'
        
    else:  # custom
        # 获取速度参数
        timing = params.get('timing', 'T4')
        args = f'-{timing}'
        
        # 自定义端口
        if params.get('ports'):
            args += f" -p {params['ports']}"
        else:
            args += ' --top-ports 100'  # 默认top 100
        
        # 服务检测
        if params.get('serviceDetection'):
            args += ' -sV'
        
        # OS检测
        if params.get('osDetection'):
            args += ' -O'
        
        # 详细输出
        if params.get('verboseOutput'):
            args += ' -v'
        
        # 禁用主机发现（对防火墙后的主机有用）
        if params.get('skipHostDiscovery'):
            args += ' -Pn'
            
        # 激进扫描 (legacy support)
        if params.get('aggressiveScan'):
            args += ' -A'
    
    return args
