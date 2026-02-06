"""
Web Fuzzing Worker

通过发送恶意Payload检测Web应用漏洞
支持SQL注入、XSS、路径遍历等常见漏洞检测
"""
import re
import requests
import logging
from typing import Dict, Any, Callable, List
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
import time

from app.models import ScanResult
from app.core.database import get_sync_db
from app.workers.payloads import (
    SQL_PAYLOADS, SQL_DETECTION_PATTERNS,
    XSS_PAYLOADS, XSS_DETECTION_PATTERNS,
    PATH_TRAVERSAL_PAYLOADS, PATH_DETECTION_PATTERNS
)

logger = logging.getLogger(__name__)


def fuzzing_worker(
    task_id: str,
    params: Dict[str, Any],
    progress_callback: Callable[[int, str, str, dict], None]
) -> dict:
    """
    Web Fuzzing扫描任务
    
    Args:
        task_id: 任务ID
        params: 参数字典，包含:
            - target_url: 目标URL
            - method: HTTP方法 (GET/POST)
            - test_types: 测试类型列表 (sql_injection, xss, path_traversal)
            - fuzz_timeout: 超时时间
            - fuzz_iterations: 迭代次数
        progress_callback: 进度回调函数
        
    Returns:
        dict: 扫描结果
    """
    target_url = params.get("target_url")
    method = params.get("method", "GET").upper()
    test_types = params.get("test_types", ["sql_injection", "xss", "path_traversal"])
    timeout = int(params.get("fuzz_timeout", 60))
    max_iterations = int(params.get("fuzz_iterations", 10000))
    
    if not target_url:
        raise ValueError("Missing required parameter: target_url")
    
    logger.info(f"Starting fuzzing scan for {target_url}")
    progress_callback(0, f"开始Fuzzing扫描: {target_url}", "INFO", {})
    
    # 初始化结果
    results = {
        'target_url': target_url,
        'method': method,
        'test_types': test_types,
        'total_requests': 0,
        'vulnerabilities_found': 0,
        'findings': []
    }
    
    # 性能指标跟踪
    metrics = {
        'start_time': time.time(),
        'request_times': [],
        'total_latency': 0,
        'request_count': 0
    }
    
    # 解析URL和参数
    parsed_url = urlparse(target_url)
    base_params = parse_qs(parsed_url.query) if parsed_url.query else {}
    
    progress_callback(5, f"准备Payload库", "INFO", {})
    
    # 选择Payload
    payloads_map = {}
    if "sql_injection" in test_types:
        payloads_map["SQL注入"] = {
            'payloads': SQL_PAYLOADS[:20],  # 限制数量避免太慢
            'patterns': SQL_DETECTION_PATTERNS
        }
    if "xss" in test_types:
        payloads_map["XSS"] = {
            'payloads': XSS_PAYLOADS[:20],
            'patterns': XSS_DETECTION_PATTERNS
        }
    if "path_traversal" in test_types:
        payloads_map["路径遍历"] = {
            'payloads': PATH_TRAVERSAL_PAYLOADS[:20],
            'patterns': PATH_DETECTION_PATTERNS
        }
    
    total_payloads = sum(len(p['payloads']) for p in payloads_map.values())
    progress_callback(10, f"加载了 {total_payloads} 个Payload", "INFO", {})
    
    # 执行Fuzzing测试
    current_payload = 0
    
    for vuln_type, payload_info in payloads_map.items():
        payloads = payload_info['payloads']
        patterns = payload_info['patterns']
        
        progress_callback(
            20 + (current_payload * 60 // total_payloads),
            f"测试 {vuln_type} 漏洞",
            "INFO",
            {}
        )
        
        for payload in payloads:
            current_payload += 1
            
            # 检查是否超过迭代限制
            if results['total_requests'] >= max_iterations:
                break
            
            # 测试所有参数
            if base_params:
                for param_name in base_params.keys():
                    # 记录请求开始时间
                    request_start = time.time()
                    
                    finding = _test_parameter(
                        target_url,
                        method,
                        param_name,
                        payload,
                        patterns,
                        vuln_type,
                        timeout
                    )
                    
                    # 记录性能指标
                    request_latency = (time.time() - request_start) * 1000  # 转为毫秒
                    metrics['request_times'].append(time.time())
                    metrics['total_latency'] += request_latency
                    metrics['request_count'] += 1
                    
                    results['total_requests'] += 1
                    
                    # 计算吞吐量（最近10秒的请求数）
                    recent_requests = [t for t in metrics['request_times'] if time.time() - t < 10]
                    throughput = len(recent_requests) / 10.0 if recent_requests else 0
                    
                    # 通过进度回调传递实时指标
                    progress_callback(
                        20 + (current_payload * 60 // total_payloads),
                        f"测试 {vuln_type}",
                        "INFO",
                        {
                            "latency": round(request_latency, 2),
                            "throughput": round(throughput, 2),
                            "total_requests": results['total_requests']
                        }
                    )
                    
                    if finding:
                        results['vulnerabilities_found'] += 1
                        results['findings'].append(finding)
                        
                        progress_callback(
                            20 + (current_payload * 60 // total_payloads),
                            f"发现 {vuln_type} 漏洞！",
                            "WARNING",
                            {
                                "latency": round(request_latency, 2),
                                "throughput": round(throughput, 2),
                                "vulnerability_found": True
                            }
                        )
            else:
                # URL没有参数，尝试在路径中注入
                request_start = time.time()
                
                finding = _test_url_path(
                    target_url,
                    method,
                    payload,
                    patterns,
                    vuln_type,
                    timeout
                )
                
                # 记录性能指标
                request_latency = (time.time() - request_start) * 1000
                metrics['request_times'].append(time.time())
                metrics['total_latency'] += request_latency
                metrics['request_count'] += 1
                
                results['total_requests'] += 1
                
                recent_requests = [t for t in metrics['request_times'] if time.time() - t < 10]
                throughput = len(recent_requests) / 10.0 if recent_requests else 0
                
                progress_callback(
                    20 + (current_payload * 60 // total_payloads),
                    f"测试 {vuln_type}",
                    "INFO",
                    {
                        "latency": round(request_latency, 2),
                        "throughput": round(throughput, 2),
                        "total_requests": results['total_requests']
                    }
                )
                
                if finding:
                    results['vulnerabilities_found'] += 1
                    results['findings'].append(finding)
    
    # 保存结果到数据库
    progress_callback(90, "保存扫描结果到数据库", "INFO", {})
    _save_scan_result(task_id, target_url, results)
    
    # 完成
    summary = f"扫描完成: 发送 {results['total_requests']} 个请求, 发现 {results['vulnerabilities_found']} 个漏洞"
    progress_callback(100, summary, "INFO", {})
    
    logger.info(f"Fuzzing scan completed for {target_url}: {results['vulnerabilities_found']} vulnerabilities found")
    return results


def _test_parameter(
    url: str,
    method: str,
    param_name: str,
    payload: str,
    patterns: List[str],
    vuln_type: str,
    timeout: int
) -> Dict[str, Any] | None:
    """
    测试单个参数
    
    Returns:
        如果发现漏洞返回finding字典，否则返回None
    """
    try:
        # 构造测试URL
        parsed = urlparse(url)
        params = parse_qs(parsed.query) if parsed.query else {}
        
        # 注入payload
        test_params = params.copy()
        test_params[param_name] = [payload]
        
        # 重新构造URL
        new_query = urlencode(test_params, doseq=True)
        test_url = urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            new_query,
            parsed.fragment
        ))
        
        # 发送请求
        if method == "GET":
            response = requests.get(test_url, timeout=timeout, verify=False)
        else:  # POST
            response = requests.post(url, data=test_params, timeout=timeout, verify=False)
        
        response_text = response.text
        
        # 检测漏洞
        for pattern in patterns:
            if re.search(pattern, response_text, re.IGNORECASE):
                return {
                    'type': vuln_type,
                    'severity': _get_severity(vuln_type),
                    'url': test_url,
                    'parameter': param_name,
                    'payload': payload,
                    'evidence': response_text[:500],  # 前500字符作为证据
                    'pattern_matched': pattern,
                    'status_code': response.status_code,
                    'timestamp': time.time()
                }
        
        return None
        
    except Exception as e:
        logger.debug(f"Request failed: {e}")
        return None


def _test_url_path(
    url: str,
    method: str,
    payload: str,
    patterns: List[str],
    vuln_type: str,
    timeout: int
) -> Dict[str, Any] | None:
    """
    在URL路径中测试payload
    """
    try:
        # 在URL末尾添加payload
        test_url = url.rstrip('/') + '/' + payload
        
        # 发送请求
        if method == "GET":
            response = requests.get(test_url, timeout=timeout, verify=False)
        else:
            response = requests.post(test_url, timeout=timeout, verify=False)
        
        response_text = response.text
        
        # 检测漏洞
        for pattern in patterns:
            if re.search(pattern, response_text, re.IGNORECASE):
                return {
                    'type': vuln_type,
                    'severity': _get_severity(vuln_type),
                    'url': test_url,
                    'parameter': 'URL路径',
                    'payload': payload,
                    'evidence': response_text[:500],
                    'pattern_matched': pattern,
                    'status_code': response.status_code,
                    'timestamp': time.time()
                }
        
        return None
        
    except Exception as e:
        logger.debug(f"Request failed: {e}")
        return None


def _get_severity(vuln_type: str) -> str:
    """根据漏洞类型判断严重程度"""
    severity_map = {
        "SQL注入": "HIGH",
        "XSS": "MEDIUM",
        "路径遍历": "MEDIUM"
    }
    return severity_map.get(vuln_type, "LOW")


def _save_scan_result(
    task_id: str,
    target_url: str,
    results: Dict[str, Any]
):
    """保存扫描结果到数据库"""
    db = next(get_sync_db())
    
    try:
        scan_result = ScanResult(
            task_id=task_id,
            scan_type="fuzzing_http",
            target=target_url,
            result=results
        )
        db.add(scan_result)
        db.commit()
        db.refresh(scan_result)
        
        logger.info(f"Saved fuzzing result {scan_result.id} for task {task_id}")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save scan result: {e}")
    finally:
        db.close()
