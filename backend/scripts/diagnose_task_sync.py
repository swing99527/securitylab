#!/usr/bin/env python3
"""
任务状态同步诊断脚本
检查Redis和数据库的状态差异
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.task_executor import task_executor

async def diagnose():
    print("=" * 60)
    print("🔍 任务状态同步诊断")
    print("=" * 60)
    
    # 1. 初始化Redis
    await task_executor.init_redis()
    
    # 2. 从数据库获取所有任务
    print("\n📊 数据库中的任务状态:")
    engine = create_engine(settings.DATABASE_URL.replace('+asyncpg', ''))
    
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT id, code, name, type, status, created_at 
            FROM tasks 
            ORDER BY created_at DESC 
            LIMIT 10
        """))
        
        db_tasks = []
        for row in result:
            task_id = str(row[0])
            db_tasks.append({
                'id': task_id,
                'code': row[1],
                'name': row[2],
                'type': row[3],
                'status': row[4],
                'created_at': row[5]
            })
            print(f"  {row[1]}: {row[4]} (DB)")
    
    # 3. 检查Redis中的状态
    print("\n🔴 Redis中的任务状态:")
    for task in db_tasks:
        task_id = task['id']
        redis_status = await task_executor.get_task_status(task_id)
        
        if redis_status:
            print(f"  {task['code']}: {redis_status['status']} (Redis)")
            
            # 比较
            if task['status'] != redis_status['status']:
                print(f"    ⚠️  不一致! DB={task['status']}, Redis={redis_status['status']}")
        else:
            print(f"  {task['code']}: 无Redis数据")
    
    # 4. 测试同步功能
    print("\n🧪 测试数据库同步功能:")
    try:
        # 创建一个测试任务
        test_id = "test-sync-" + str(uuid.uuid4())[:8]
        
        with engine.connect() as conn:
            # 插入测试任务
            conn.execute(text("""
                INSERT INTO tasks (id, code, name, type, status, project_id, config)
                VALUES (:id, :code, :name, :type, :status, 
                        (SELECT id FROM projects LIMIT 1), '{}')
            """), {
                'id': uuid.UUID(test_id),
                'code': 'TEST-SYNC',
                'name': 'Test Sync',
                'type': 'ping_scan',
                'status': 'queued'
            })
            conn.commit()
        
        print(f"  ✅ 创建测试任务: {test_id}")
        
        # 尝试更新状态
        task_executor._sync_status_to_db(test_id, "completed", {"test": "data"})
        
        # 验证
        with engine.connect() as conn:
            result = conn.execute(text("SELECT status FROM tasks WHERE id = :id"), {'id': uuid.UUID(test_id)})
            new_status = result.scalar()
            
            if new_status == "completed":
                print(f"  ✅ 同步成功! 状态已更新为 completed")
            else:
                print(f"  ❌ 同步失败! 状态仍为 {new_status}")
            
            # 清理
            conn.execute(text("DELETE FROM tasks WHERE id = :id"), {'id': uuid.UUID(test_id)})
            conn.commit()
            
    except Exception as e:
        print(f"  ❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
    
    # 5. 检查backend是否运行最新代码
    print("\n🔧 Backend代码版本检查:")
    import inspect
    sync_code = inspect.getsource(task_executor._sync_status_to_db)
    if "同步任务状态到数据库" in sync_code:
        print("  ✅ Backend代码已更新（包含_sync_status_to_db方法）")
    else:
        print("  ❌ Backend代码未更新（缺少_sync_status_to_db方法）")
        print("  🔄 请重启backend服务器: cd backend && poetry run uvicorn app.main:app --reload")
    
    await task_executor.close()
    
    print("\n" + "=" * 60)
    print("诊断完成")
    print("=" * 60)

import uuid

if __name__ == "__main__":
    asyncio.run(diagnose())
