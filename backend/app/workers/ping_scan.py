"""
Ping扫描Worker

实现简单的Ping连通性测试，作为任务执行引擎的POC
"""
import subprocess
import time
import logging
from typing import Dict, Any, Callable

logger = logging.getLogger(__name__)


def ping_scan_worker(
    task_id: str,
    params: Dict[str, Any],
    progress_callback: Callable[[int, str, str, dict], None]
) -> dict:
    """
    Ping扫描任务
    
    Args:
        task_id: 任务ID
        params: 参数字典，包含:
            - target: 目标IP或域名
            - count: Ping次数（默认4次）
            - timeout: 超时时间（默认1秒）
        progress_callback: 进度回调函数
        
    Returns:
        dict: 扫描结果
    """
    target = params.get("target")
    count = params.get("count", 4)
    timeout = params.get("timeout", 1)
    
    if not target:
        raise ValueError("Missing required parameter: target")
    
    logger.info(f"Starting ping scan for {target} (count={count})")
    progress_callback(10, f"开始扫描 {target}", "INFO")
    
    results = []
    success_count = 0
    total_latency = 0.0
    
    for i in range(count):
        try:
            # 构建ping命令（跨平台）
            import platform
            if platform.system().lower() == "windows":
                cmd = ["ping", "-n", "1", "-w", str(timeout * 1000), target]
            else:
                cmd = ["ping", "-c", "1", "-W", str(timeout), target]
            
            # 执行ping
            start_time = time.time()
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout + 2  # 留2秒缓冲
            )
            elapsed = (time.time() - start_time) * 1000  # 转为毫秒
            
            success = result.returncode == 0
            
            # 解析延迟（简单实现，从输出中提取time=XXms）
            latency = None
            if success:
                output = result.stdout
                # 尝试提取time信息
                import re
                time_match = re.search(r'time[=<](\d+\.?\d*)\s*ms', output, re.IGNORECASE)
                if time_match:
                    latency = float(time_match.group(1))
                else:
                    latency = elapsed
            
            results.append({
                "attempt": i + 1,
                "success": success,
                "latency_ms": latency,
                "output": result.stdout if success else result.stderr
            })
            
            if success:
                success_count += 1
                if latency:
                    total_latency += latency
            
            # 更新进度
            progress = 10 + int((i + 1) / count * 85)
            log_level = "INFO" if success else "WARN"
            progress_callback(
                progress,
                f"Ping {i+1}/{count} - {'成功' if success else '失败'} (延迟: {latency:.2f}ms)" if latency else f"Ping {i+1}/{count} - {'成功' if success else '失败'}",
                log_level,
                {"attempt": i+1, "success": success, "latency_ms": latency}
            )
            
            # 间隔一下
            if i < count - 1:
                time.sleep(0.5)
                
        except subprocess.TimeoutExpired:
            results.append({
                "attempt": i + 1,
                "success": False,
                "latency_ms": None,
                "output": "Timeout"
            })
            progress_callback(
                10 + int((i + 1) / count * 85),
                f"Ping {i+1}/{count} - 超时",
                "ERROR",
                {"attempt": i+1, "error": "timeout"}
            )
        except Exception as e:
            logger.error(f"Ping attempt {i+1} failed: {e}")
            results.append({
                "attempt": i + 1,
                "success": False,
                "latency_ms": None,
                "output": str(e)
            })
    
    # 计算统计
    loss_rate = ((count - success_count) / count) * 100
    avg_latency = (total_latency / success_count) if success_count > 0 else None
    
    progress_callback(95, "分析结果", "INFO")
    
    final_result = {
        "target": target,
        "total_attempts": count,
        "successful": success_count,
        "failed": count - success_count,
        "loss_rate": round(loss_rate, 2),
        "avg_latency_ms": round(avg_latency, 2) if avg_latency else None,
        "min_latency_ms": min((r["latency_ms"] for r in results if r["latency_ms"]), default=None),
        "max_latency_ms": max((r["latency_ms"] for r in results if r["latency_ms"]), default=None),
        "details": results,
        "status": "reachable" if success_count > 0 else "unreachable"
    }
    
    logger.info(f"Ping scan completed for {target}: {success_count}/{count} successful")
    return final_result
