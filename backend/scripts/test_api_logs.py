#!/usr/bin/env python3
"""
测试backend的getLogs API
"""
import requests

# 创建任务
response = requests.post(
    "http://localhost:8000/api/v1/auth/login",
    json={"email": "admin@stuailab.com", "password": "123456"}
)
token = response.json()["data"]["token"]

headers = {"Authorization": f"Bearer {token}"}

# 获取最新任务
tasks_resp = requests.get("http://localhost:8000/api/v1/tasks?page=1&page_size=10", headers=headers)
tasks = tasks_resp.json()["data"]["list"]

if tasks:
    task_id = tasks[0]["id"]
    print(f"检查任务: {task_id}")
    print(f"任务类型: {tasks[0]['type']}")
    print(f"任务状态: {tasks[0]['status']}")
    
    # 获取日志
    logs_resp = requests.get(f"http://localhost:8000/api/v1/tasks/{task_id}/logs", headers=headers)
    print(f"\n日志API响应:")
    print(f"Status Code: {logs_resp.status_code}")
    print(f"Response: {logs_resp.json()}")
else:
    print("没有任务")
