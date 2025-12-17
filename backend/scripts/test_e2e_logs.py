#!/usr/bin/env python3
"""
端到端测试：创建任务并检查日志
"""
import asyncio
import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app.workers  # Import to register workers
from app.core.task_executor import task_executor

async def test_end_to_end():
    print("🧪 端到端日志测试")
    print("=" * 60)
    
    await task_executor.init_redis()
    
    # 提交一个新的ping任务
    test_task_id = "test-logs-e2e"
    
    print(f"\n📝 创建测试任务: {test_task_id}")
    await task_executor.submit_task(
        task_id=test_task_id,
        task_type="ping_scan",
        params={"target": "8.8.8.8", "count": 2}
    )
    
    print("⏳ 等待任务执行...")
    
    # 等待并检查日志
    for i in range(15):  # 最多等15秒
        await asyncio.sleep(1)
        
        # 检查状态
        status = await task_executor.get_task_status(test_task_id)
        if status:
            print(f"  [{i+1}s] Status: {status.get('status')}, Progress: {status.get('progress')}%")
            
            # 检查日志
            logs = await task_executor.get_task_logs(test_task_id, limit=10)
            print(f"  [{i+1}s] 日志条数: {len(logs)}")
            
            if logs:
                print("\n📋 前3条日志:")
                for log in logs[:3]:
                    print(f"  - [{log['level']}] {log['message']}")
            
            if status.get('status') in ['completed', 'failed']:
                print(f"\n✅ 任务完成，状态: {status.get('status')}")
                break
    
    # 最终检查
    print("\n" + "=" * 60)
    print("最终结果:")
    
    status = await task_executor.get_task_status(test_task_id)
    logs = await task_executor.get_task_logs(test_task_id)
    
    print(f"状态: {status.get('status') if status else 'None'}")
    print(f"日志总数: {len(logs)}")
    
    if logs:
        print("\n所有日志:")
        for i, log in enumerate(logs, 1):
            print(f"{i}. [{log['level']}] {log['message']}")
    else:
        print("❌ 没有日志！")
    
    # 清理
    task_executor.redis_sync.delete(f"task:{test_task_id}")
    task_executor.redis_sync.delete(f"task:{test_task_id}:logs")
    
    await task_executor.close()

if __name__ == "__main__":
    asyncio.run(test_end_to_end())
