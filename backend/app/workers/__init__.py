"""
Task workers module

All workers should be registered here using @register_task decorator
"""
from app.core.task_executor import register_task
from .ping_scan import ping_scan_worker
from .nmap_scan import nmap_scan_worker

# Register workers
register_task("ping_scan")(ping_scan_worker)
register_task("nmap_scan")(nmap_scan_worker)

__all__ = ['ping_scan_worker', 'nmap_scan_worker']
