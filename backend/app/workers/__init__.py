"""
Task workers module

All workers MUST be imported here to ensure registration
"""
from app.core.task_executor import task_executor
from .ping_scan import ping_scan_worker
from .nmap_scan import nmap_scan_worker
from .vuln_scan import vuln_scan_worker
from .fuzzing_worker import fuzzing_worker
from .firmware_worker import firmware_worker

# Register workers by directly adding to registry
task_executor.task_registry["ping_scan"] = ping_scan_worker
task_executor.task_registry["nmap_scan"] = nmap_scan_worker
task_executor.task_registry["vuln_scan"] = vuln_scan_worker
task_executor.task_registry["fuzzing"] = fuzzing_worker
task_executor.task_registry["firmware_analysis"] = firmware_worker

import logging
logger = logging.getLogger(__name__)
logger.info(f"✅ Registered {len(task_executor.task_registry)} workers: {list(task_executor.task_registry.keys())}")

__all__ = ['ping_scan_worker', 'nmap_scan_worker', 'vuln_scan_worker', 'fuzzing_worker', 'firmware_worker']
