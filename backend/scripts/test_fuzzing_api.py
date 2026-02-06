#!/usr/bin/env python3
"""
通过API创建并执行fuzzing任务，测试worker是否真正执行
"""
import requests
import time
import json

BASE_URL = "http://localhost:8000/api/v1"

print("="*70)
print("  创建并执行Fuzzing任务测试")
print("="*70)

# 1. 获取第一个项目
try:
    resp = requests.get(f"{BASE_URL}/projects?page=1&page_size=1")
    if resp.status_code == 200:
        data = resp.json()
        if data['data']['list']:
            project_id = data['data']['list'][0]['id']
            print(f"✅ 找到项目: {project_id}")
        else:
            print("❌ 没有项目")
            exit(1)
    else:
        print(f"❌ 获取项目失败: {resp.status_code}")
        exit(1)
except Exception as e:
    print(f"❌ 请求失败: {e}")
    exit(1)

# 2. 创建Fuzzing任务
task_data = {
    "name": "API测试-Fuzzing性能监控",
    "project_id": project_id,
    "type": "fuzzing",
    "config": {
        "target_url": "http://httpbin.org/get?test=1",
        "method": "GET",
        "test_types": ["sql_injection"],
        "fuzz_timeout": 5,
        "fuzz_iterations": 5
    }
}

print(f"\n创建任务...")
resp = requests.post(f"{BASE_URL}/tasks", json=task_data)
if resp.status_code in [200, 201]:
    result = resp.json()
    task_id = result['data']['id']
    print(f"✅ 任务创建成功: {task_id}")
else:
    print(f"❌ 创建失败: {resp.status_code}")
    print(resp.text)
    exit(1)

# 3. 执行任务
print(f"\n执行任务...")
resp = requests.post(f"{BASE_URL}/tasks/{task_id}/execute")
if resp.status_code == 200:
    print(f"✅ 任务已提交执行")
else:
    print(f"❌ 执行失败: {resp.status_code}")
    print(resp.text)

# 4. 等待并检查日志
print(f"\n等待10秒后检查日志...")
time.sleep(10)

resp = requests.get(f"{BASE_URL}/tasks/{task_id}/logs?limit=200")
if resp.status_code == 200:
    logs_data = resp.json()
    logs = logs_data['data']['logs']
    print(f"\n总日志数: {len(logs)}")
    
    # 检查性能指标
    metrics_logs = [log for log in logs if log.get('data') and 
                   ('latency' in log.get('data', {}) or 'throughput' in log.get('data', {}))]
    
    print(f"包含性能指标的日志: {len(metrics_logs)}")
    
    if metrics_logs:
        print("\n🎉 成功！性能指标示例:")
        for i, log in enumerate(metrics_logs[:3], 1):
            print(f"  #{i}: latency={log['data'].get('latency')}, throughput={log['data'].get('throughput')}")
    else:
        print("\n❌ 没有性能指标")
        print("\n所有日志:")
        for log in logs[:5]:
            print(f"  - {log['level']}: {log['message']}")
else:
    print(f"❌ 获取日志失败: {resp.status_code}")

print("\n" + "="*70)
print(f"任务ID: {task_id}")
print("="*70)
