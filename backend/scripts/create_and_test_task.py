#!/usr/bin/env python3
"""
创建新的ping任务并验证日志
"""
import requests
import time
import json

BASE_URL = "http://localhost:8000/api/v1"

# 1. 登录
print("1. 登录...")
login_resp = requests.post(
    f"{BASE_URL}/auth/demo-login",
    json={}
)
token = login_resp.json()["data"]["token"]
print(f"✅ Token: {token[:20]}...")

headers = {"Authorization": f"Bearer {token}"}

# 2. 获取项目
projects_resp = requests.get(f"{BASE_URL}/projects?page=1&page_size=10", headers=headers)
project_id = projects_resp.json()["data"]["list"][0]["id"]
print(f"✅ Project ID: {project_id}")

# 3. 创建新的ping任务
print("\n2. 创建新的Ping任务...")
task_data = {
    "project_id": project_id,
    "name": "测试日志-新任务",
    "type": "ping_scan",
    "config": {
        "target": "8.8.8.8",
        "count": 3,
        "timeout": 1
    }
}

create_resp = requests.post(f"{BASE_URL}/tasks", json=task_data, headers=headers)
task = create_resp.json()["data"]
task_id = task["id"]
print(f"✅ 任务创建成功: {task_id}")
print(f"   任务代码: {task['code']}")
print(f"   状态: {task['status']}")

# 4. 启动任务
print("\n3. 启动任务...")
exec_resp = requests.post(f"{BASE_URL}/tasks/{task_id}/execute", json={"force": False}, headers=headers)
print(f"✅ 任务已启动")

# 5. 等待并检查日志
print("\n4. 检查日志...")
for i in range(10):
    time.sleep(1)
    
    # 获取状态
    status_resp = requests.get(f"{BASE_URL}/tasks/{task_id}/status", headers=headers)
    status_data = status_resp.json()["data"]
    print(f"  [{i+1}s] 状态: {status_data.get('status')}, 进度: {status_data.get('progress')}%")
    
    # 获取日志
    logs_resp = requests.get(f"{BASE_URL}/tasks/{task_id}/logs?limit=10", headers=headers)
    logs_data = logs_resp.json()["data"]
    log_count = logs_data["total"]
    
    if log_count > 0:
        print(f"  [{i+1}s] ✅ 日志数: {log_count}")
        print("\n  最新日志:")
        for log in logs_data["logs"][:3]:
            print(f"    [{log['level']}] {log['message']}")
        break
    else:
        print(f"  [{i+1}s] ⏳ 等待日志...")
    
    if status_data.get('status') in ['completed', 'failed']:
        break

# 6. 最终结果
print("\n5. 最终结果:")
logs_resp = requests.get(f"{BASE_URL}/tasks/{task_id}/logs?limit=50", headers=headers)
final_logs = logs_resp.json()["data"]
print(f"总日志数: {final_logs['total']}")

if final_logs['total'] > 0:
    print("\n所有日志:")
    for i, log in enumerate(final_logs['logs'], 1):
        print(f"{i}. [{log['level']}] {log['message']}")
    print("\n✅ 日志功能正常！")
else:
    print("\n❌ 没有日志！")

print(f"\n📝 任务详情页: http://localhost:3000/tasks/{task_id}")
