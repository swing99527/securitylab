"""
Task workers module

All workers should be registered here using @register_task decorator
"""
from app.core.task_executor import task_executor
from .ping_scan import ping_scan_worker
from .nmap_scan import nmap_scan_worker
from .vuln_scan import vuln_scan_worker

# Register workers
task_executor.register_task("ping_scan")(ping_scan_worker)
task_executor.register_task("nmap_scan")(nmap_scan_worker)
task_executor.register_task("vuln_scan")(vuln_scan_worker)

__all__ = ['ping_scan_worker', 'nmap_scan_worker', 'vuln_scan_worker']
