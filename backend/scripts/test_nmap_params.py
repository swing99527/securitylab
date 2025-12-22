#!/usr/bin/env python3
"""
测试Nmap配置参数构建
"""
import sys
import os
sys.path.insert(0, os.path.abspath('.'))

from app.workers.nmap_scan import _build_nmap_args

# 测试用例
test_cases = [
    {
        'name': 'Quick Scan',
        'params': {'scanType': 'quick'},
        'expected': '-T4 --top-ports 100'
    },
    {
        'name': 'Full Scan',
        'params': {'scanType': 'full'},
        'expected': '-T4 -p- -sV'
    },
    {
        'name': 'Stealth Scan',
        'params': {'scanType': 'stealth'},
        'expected': '-sS -T2'
    },
    {
        'name': 'Custom Scan - Basic',
        'params': {
            'scanType': 'custom',
            'ports': '1-1000'
        },
        'expected': '-T4 -p 1-1000'
    },
    {
        'name': 'Custom Scan - Full Options',
        'params': {
            'scanType': 'custom',
            'timing': 'T3',
            'ports': '80,443,8080',
            'serviceDetection': True,
            'osDetection': True,
            'verboseOutput': True,
            'skipHostDiscovery': True
        },
        'expected': '-T3 -p 80,443,8080 -sV -O -v -Pn'
    },
    {
        'name': 'Custom Scan - Stealth with Timing',
        'params': {
            'scanType': 'custom',
            'timing': 'T1',
            'ports': '22,80,443',
            'serviceDetection': True
        },
        'expected': '-T1 -p 22,80,443 -sV'
    },
]

print("=" * 60)
print("Nmap参数构建测试")
print("=" * 60)

passed = 0
failed = 0

for test in test_cases:
    result = _build_nmap_args(test['params'])
    
    if result == test['expected']:
        print(f"\n✅ {test['name']}")
        print(f"   参数: {result}")
        passed += 1
    else:
        print(f"\n❌ {test['name']}")
        print(f"   期望: {test['expected']}")
        print(f"   实际: {result}")
        failed += 1

print(f"\n{'=' * 60}")
print(f"测试结果: {passed}通过, {failed}失败")
print(f"{'=' * 60}")

if failed > 0:
    sys.exit(1)
else:
    print("\n✅ 所有测试通过！")
    sys.exit(0)
