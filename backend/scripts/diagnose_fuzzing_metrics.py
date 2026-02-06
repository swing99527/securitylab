#!/usr/bin/env python3
"""
快速诊断Fuzzing性能数据问题
"""
import sys
sys.path.insert(0, '/Users/chenshangwei/code/securityLab/backend')

from app.core.database import get_sync_db
from app.models import Task
from sqlalchemy import desc
import json

db = next(get_sync_db())

print("=" * 70)
print("  🔍 Fuzzing任务诊断")
print("=" * 70)

# 查找最近的fuzzing任务
tasks = db.query(Task).filter(Task.type == 'fuzzing').order_by(desc(Task.created_at)).limit(3).all()

if not tasks:
    print("\n❌ 没有找到任何Fuzzing任务")
    print("\n💡 请创建一个新的Fuzzing任务来测试")
else:
    for i, task in enumerate(tasks, 1):
        print(f"\n{'='*70}")
        print(f"任务 #{i}: {task.code}")
        print(f"{'='*70}")
        print(f"ID: {task.id}")
        print(f"状态: {task.status}")
        print(f"创建时间: {task.created_at}")
        print(f"配置: {json.dumps(task.config, indent=2, ensure_ascii=False)}")
        
        # 检查Redis中的日志
        from app.core.redis_client import redis_client
        import pickle
        
        # 获取日志键
        log_key = f"task_logs:{task.id}"
        log_entries = redis_client.lrange(log_key, 0, -1)
        
        if log_entries:
            print(f"\nRedis日志数: {len(log_entries)}")
            
            # 解析日志
            metrics_count = 0
            for entry in log_entries:
                try:
                    log = pickle.loads(entry)
                    if 'extra_data' in log and log['extra_data']:
                        if 'latency' in log['extra_data'] or 'throughput' in log['extra_data']:
                            metrics_count += 1
                except:
                    pass
            
            print(f"包含性能指标的日志: {metrics_count}")
            
            if metrics_count > 0:
                print("\n✅ 有性能数据！")
                # 显示第一个性能日志
                for entry in log_entries:
                    try:
                        log = pickle.loads(entry)
                        if 'extra_data' in log and log['extra_data']:
                            if 'latency' in log['extra_data']:
                                print(f"\n示例: latency={log['extra_data']['latency']}, "
                                      f"throughput={log['extra_data'].get('throughput', 'N/A')}")
                                break
                    except:
                        pass
            else:
                print("\n❌ 没有性能数据")
                print("   这可能是旧任务（在代码更新前创建）")
                print("   或者worker代码没有正确加载")
        else:
            print(f"\n❌ Redis中没有日志")

db.close()

print("\n" + "=" * 70)
print("💡 建议:")
print("=" * 70)
print("1. 创建一个全新的Fuzzing任务")
print("2. 确保任务状态是'running'或'completed'")
print("3. 查看浏览器Console的日志输出")
print("=" * 70)
