#!/usr/bin/env python3
"""
诊断ping任务日志问题
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.task_executor import task_executor

async def diagnose_ping_logs():
    print("🔍 诊断Ping任务日志问题...")
    
    await task_executor.init_redis()
    
    # 查找最近的ping任务
    tasks = task_executor.redis_sync.keys("task:*")
    ping_tasks = []
    
    for task_key in tasks:
        if not task_key.endswith(":logs"):
            task_data = task_executor.redis_sync.hgetall(task_key)
            if task_data.get("type") == "ping_scan":
                task_id = task_key.replace("task:", "")
                ping_tasks.append({
                    "id": task_id,
                    "status": task_data.get("status"),
                    "message": task_data.get("message")
                })
    
    if not ping_tasks:
        print("❌ 没有找到ping_scan任务")
        return
    
    print(f"\n📋 找到 {len(ping_tasks)} 个ping任务:")
    for task in ping_tasks[:3]:  # 只检查最新3个
        print(f"\n{'='*60}")
        print(f"Task ID: {task['id']}")
        print(f"Status: {task['status']}")
        print(f"Message: {task['message']}")
        
        # 检查日志
        log_key = f"task:{task['id']}:logs"
        log_count = task_executor.redis_sync.llen(log_key)
        print(f"日志条数: {log_count}")
        
        if log_count > 0:
            logs = task_executor.redis_sync.lrange(log_key, 0, 5)
            print(f"\n前5条日志:")
            import json
            for i, log in enumerate(logs[:5], 1):
                try:
                    entry = json.loads(log)
                    print(f"  {i}. [{entry['level']}] {entry['message']}")
                except:
                    print(f"  {i}. {log}")
        else:
            print("⚠️  没有日志记录！")
            print("\n可能原因:")
            print("  1. progress_callback没有被调用")
            print("  2. 日志key格式错误")
            print("  3. Redis TTL过期")
    
    await task_executor.close()

if __name__ == "__main__":
    asyncio.run(diagnose_ping_logs())
