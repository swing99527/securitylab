#!/usr/bin/env python3
"""测试task status端点"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.task_executor import task_executor

async def main():
    # 初始化Redis
    await task_executor.init_redis()
    
    task_id = "7e5e514b-13da-43b0-a147-1e4eee896f82"
    
    print(f"Testing get_task_status for task: {task_id}")
    
    try:
        status_data = await task_executor.get_task_status(task_id)
        print(f"Status data: {status_data}")
        print(f"Type: {type(status_data)}")
        
        if status_data:
            for key, value in status_data.items():
                print(f"  {key}: {value} (type: {type(value)})")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
    
    await task_executor.close()

if __name__ == "__main__":
    asyncio.run(main())
