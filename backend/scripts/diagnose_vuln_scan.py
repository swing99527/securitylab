#!/usr/bin/env python3
"""
Diagnostic script for vulnerability scan worker
"""
import sys
sys.path.insert(0, '/Users/chenshangwei/code/securityLab/backend')

from app.workers import task_executor

print("=" * 80)
print("VULN SCAN WORKER DIAGNOSTICS")
print("=" * 80)

# Check registered tasks
print("\n✓ Registered task types:")
for task_type in task_executor.task_registry.keys():
    print(f"  - {task_type}")

# Check if vuln_scan is registered
if 'vuln_scan' in task_executor.task_registry:
    print("\n✓ vuln_scan worker is registered")
    worker_func = task_executor.task_registry['vuln_scan']
    print(f"  Worker function: {worker_func.__name__}")
    print(f"  Module: {worker_func.__module__}")
else:
    print("\n❌ vuln_scan worker is NOT registered!")
    sys.exit(1)

# Try to import the worker directly
print("\n✓ Import check:")
try:
    from app.workers.vuln_scan import vuln_scan_worker
    print(f"  Successfully imported: {vuln_scan_worker}")
except Exception as e:
    print(f"  ❌ Failed to import: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Check if NVD client is available
print("\n✓ NVD Client check:")
try:
    from app.services.nvd_client import NVDClient
    print(f"  NVDClient available: {NVDClient}")
except Exception as e:
    print(f"  ❌ NVDClient import failed: {e}")

# Check database models
print("\n✓ Database models check:")
try:
    from app.models.models import Vulnerability, ScanResult
    print(f"  Vulnerability model: {Vulnerability}")
    print(f"  ScanResult model: {ScanResult}")
except Exception as e:
    print(f"  ❌ Model import failed: {e}")

print("\n" + "=" * 80)
print("DIAGNOSTICS COMPLETE")
print("=" * 80)
