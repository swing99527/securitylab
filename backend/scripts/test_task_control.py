#!/usr/bin/env python3
"""测试任务控制功能 (Pause, Resume, Stop)"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.task_executor import task_executor

async def main():
    # 初始化
    await task_executor.init_redis()
    
    # 提交一个简单的测试任务
    print("🚀 提交测试任务...")
    task_id = "test-control-task-001"
    
    # 设置初始队列状态
    task_executor.redis_sync.hset(
        f"task:{task_id}",
        mapping={
            "status": "running",
            "progress": 50,
            "message": "任务运行中...",
            "type": "test"
        }
    )
    task_executor.redis_sync.expire(f"task:{task_id}", 600)
    
    print(f"✅ 任务已创建: {task_id}\n")
    
    # 测试1: 暂停任务
    print("📝 测试1: 暂停任务")
    success = await task_executor.cancel_task(task_id)
    print(f"   Result: {'✅ Success' if success else '❌ Failed'}")
    status = await task_executor.get_task_status(task_id)
    print(f"   Status: {status.get('status')}")
    print(f"   Message: {status.get('message')}\n")
    
    # 测试2: 更新为运行状态（模拟resume）
    print("📝 测试2: 恢复任务")
    task_executor.redis_sync.hset(
        f"task:{task_id}",
        mapping={
            "status": "running",
            "message": "任务已恢复"
        }
    )
    status = await task_executor.get_task_status(task_id)
    print(f"   Status: {status.get('status')}")
    print(f"   Message: {status.get('message')}\n")
    
    # 测试3: 再次停止
    print("📝 测试3: 停止任务")
    success = await task_executor.cancel_task(task_id)
    print(f"   Result: {'✅ Success' if success else '❌ Failed'}")
    status = await task_executor.get_task_status(task_id)
    print(f"   Status: {status.get('status')}")
    print(f"   Message: {status.get('message')}\n")
    
    # 清理
    print("🧹 清理测试数据...")
    task_executor.redis_sync.delete(f"task:{task_id}")
    
    await task_executor.close()
    print("\n✅ 测试完成！")

if __name__ == "__main__":
    asyncio.run(main())
