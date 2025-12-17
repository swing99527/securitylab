#!/usr/bin/env python3
"""
手动同步所有任务状态从Redis到数据库
"""
import asyncio
import sys
import os
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.task_executor import task_executor

async def sync_all_tasks():
    print("🔄 开始同步任务状态...")
    
    # 初始化Redis  
    await task_executor.init_redis()
    
    # 获取所有queued任务
    engine = create_engine(settings.DATABASE_URL.replace('+asyncpg', '+psycopg2'))
    
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT id FROM tasks WHERE status = 'queued'
        """))
        
        queued_tasks = [str(row[0]) for row in result]
    
    print(f"📋 找到 {len(queued_tasks)} 个queued状态的任务")
    
    synced = 0
    for task_id in queued_tasks:
        # 从Redis获取实际状态
        redis_status = await task_executor.get_task_status(task_id)
        
        if redis_status and redis_status['status'] != 'queued':
            redis_state = redis_status['status']
            result_data = None
            
            # 获取result
            if 'result' in redis_status:
                import json
                try:
                    result_data = json.loads(redis_status['result'])
                except:
                    result_data = redis_status.get('result')
            
            # 同步到数据库 (不需要传result参数)
            task_executor._sync_status_to_db(task_id, redis_state)
            print(f"  ✅ {task_id[:8]}... : queued → {redis_state}")
            synced += 1
        else:
            print(f"  ⏭️  {task_id[:8]}... : 无Redis数据或状态相同")
    
    print(f"\n✨ 完成! 同步了 {synced} 个任务")
    
    await task_executor.close()

if __name__ == "__main__":
    asyncio.run(sync_all_tasks())
