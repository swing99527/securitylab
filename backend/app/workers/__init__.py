"""
Workers package

Import and register all task workers
"""

from app.core.task_executor import task_executor
from app.workers.ping_scan import ping_scan_worker

# Register workers
task_executor.register_task("ping_scan")(ping_scan_worker)

__all__ = ['ping_scan_worker']
