#!/usr/bin/env python3
"""简化的任务执行引擎测试脚本"""
import requests
import time
import json

API_BASE = "http://localhost:8000/api/v1"

def main():
    print("🚀 任务执行引擎测试")
    print("=" * 40)
    
    # Step 1: 登录
    print("\n📝 Step 1: 登录")
    login_resp = requests.post(
        f"{API_BASE}/auth/login",
        json={"email": "admin@iot-lab.com", "password": "admin123"}
    )
    login_data = login_resp.json()
    token = login_data["access_token"]
    user_id = login_data["user"]["id"]
    print(f"✅ 登录成功 (User ID: {user_id})")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Step 2: 创建项目
    print("\n📦 Step 2: 创建项目")
    project_resp = requests.post(
        f"{API_BASE}/projects",
        headers=headers,
        json={
            "name": "任务执行测试",
            "client": "内部测试",
            "standard": "自定义",
            "manager_id": user_id
        }
    )
    project_data = project_resp.json()
    project_id = project_data["id"]
    print(f"✅ 项目创建成功 (ID: {project_id})")
    
    # Step 3: 创建Ping任务
    print("\n🎯 Step 3: 创建Ping扫描任务")
    task_resp = requests.post(
        f"{API_BASE}/tasks",
        headers=headers,
        json={
            "project_id": project_id,
            "name": "Ping扫描 - Google DNS",
            "type": "ping_scan",
            "config": {
                "target": "8.8.8.8",
                "count": 4,
                "timeout": 1
            }
        }
    )
    
    if task_resp.status_code != 201:
        print(f"❌ 任务创建失败 (status: {task_resp.status_code})")
        print(f"Response: {task_resp.text}")
        return
    
    task_data = task_resp.json()
    task_id = task_data["id"]
    task_code = task_data["code"]
    print(f"✅ 任务创建成功 (Code: {task_code})")
    
    # Step 4: 轮询状态
    print("\n⏳ Step 4: 监控任务执行")
    print("-" * 40)
    
    for i in range(30):
        status_resp = requests.get(
            f"{API_BASE}/tasks/{task_id}/status",
            headers=headers
        )
        status_data = status_resp.json()
        
        status = status_data.get("status", "unknown")
        progress = status_data.get("progress", 0)
        message = status_data.get("message", "")
        
        # 进度条
        bar_len = int(progress / 5)
        bar = "█" * bar_len + "░" * (20 - bar_len)
        print(f"\r[{bar}] {progress:3d}% - {message}", end="", flush=True)
        
        if status in ["completed", "failed"]:
            print()  # 换行
            break
        
        time.sleep(2)
    
    # 显示结果
    print("\n")
    if status == "completed":
        print("✅ 任务执行成功！")
        print("\n📊 扫描结果:")
        print("-" * 40)
        result = status_data.get("result", {})
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(f"❌ 任务失败: {status_data.get('error')}")
    
    print("\n🎉 测试完成！")
    print(f"Project: {project_id}")
    print(f"Task: {task_code}")
    print(f"Status: {status}")

if __name__ == "__main__":
    main()
