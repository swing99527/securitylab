#!/usr/bin/env python3
"""
Simple Nmap worker test

Tests the nmap_scan worker directly
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Check if nmap is installed
import subprocess
try:
    result = subprocess.run(['nmap', '--version'], capture_output=True, text=True)
    print("✅ Nmap is installed")
    print(result.stdout.split('\n')[0])
except FileNotFoundError:
    print("❌ Nmap not installed!")
    print("Install with: brew install nmap")
    sys.exit(1)

print("\n" + "=" * 60)
print("🧪 Testing Nmap Worker Directly")
print("=" * 60)

# Import worker
from app.workers.nmap_scan import nmap_scan_worker

# Test configuration
task_id = "test-nmap-001"
params = {
    "target": "scanme.nmap.org",  # Official Nmap test server
    "scanType": "quick"
}

# Progress callback
logs = []
def progress_callback(progress, message, level, extra=None):
    logs.append(f"[{level:5s}] {progress:3d}% - {message}")
    print(f"[{level:5s}] {progress:3d}% - {message}")

print(f"\n📋 Test Configuration:")
print(f"  Target: {params['target']}")
print(f"  Type: {params['scanType']}")

print(f"\n⏳ Running scan...\n")

try:
    result = nmap_scan_worker(task_id, params, progress_callback)
    
    print(f"\n✅ Scan completed successfully!")
    print("-" * 60)
    print(f"📊 Results:")
    print(f"  Target: {result['target']}")
    print(f"  Scan Type: {result['scan_type']}")
    print(f"  Hosts Found: {len(result['hosts'])}")
    print(f"  Ports Found: {result['ports_found']}")
    print(f"  Services Identified: {result['services_identified']}")
    
    if result['hosts']:
        for host in result['hosts']:
            print(f"\n  Host: {host['ip']}")
            print(f"  State: {host['state']}")
            print(f"  Hostname: {host['hostname'] or 'N/A'}")
            print(f"  Open Ports: {len(host['ports'])}")
            
            if host['ports']:
                print(f"\n  Port Details:")
                for port in host['ports'][:10]:  # Show first 10
                    service_info = f"{port['service']}"
                    if port['version']:
                        service_info += f" {port['version']}"
                    if port['product']:
                        service_info += f" ({port['product']})"
                    
                    print(f"    {port['port']:5d}/{port['protocol']:3s} - {service_info}")
                
                if len(host['ports']) > 10:
                    print(f"    ... and {len(host['ports']) - 10} more ports")
    
    print("\n" + "=" * 60)
    print(f"Total logs generated: {len(logs)}")
    print("✅ Test Passed!")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ Test Failed!")
    print(f"Error: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
