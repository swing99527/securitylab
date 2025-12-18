#!/usr/bin/env python3
"""
实时监控Nmap扫描进度
"""
import sys
import time
import redis
import json
from datetime import datetime

# Connect to Redis
r = redis.Redis.from_url('redis://localhost:6379/0', decode_responses=True)

# Find running tasks
task_keys = r.keys('task:*')
running_tasks = []

for key in task_keys:
    if ':logs' not in key:
        task_data = r.hgetall(key)
        if task_data.get('status') == 'running':
            task_id = key.split(':')[1]
            running_tasks.append({
                'id': task_id,
                'key': key,
                'status': task_data.get('status'),
                'progress': task_data.get('progress', '0'),
            })

if not running_tasks:
    print("❌ 没有运行中的任务")
    sys.exit(0)

# Monitor the first running task
task = running_tasks[0]
task_id = task['id']

print(f"🔍 监控任务: {task_id}")
print(f"⏳ 扫描进行中... (按Ctrl+C停止监控)\n")
print("=" * 60)

last_log_count = 0
start_time = time.time()

try:
    while True:
        # Get current status
        task_data = r.hgetall(f"task:{task_id}")
        status = task_data.get('status')
        progress = task_data.get('progress', '0')
        message = task_data.get('message', '')
        
        # Get logs
        logs = r.lrange(f'task:{task_id}:logs', 0, -1)
        log_count = len(logs)
        
        # Calculate elapsed time
        elapsed = int(time.time() - start_time)
        mins, secs = divmod(elapsed, 60)
        
        # Display status
        print(f"\r⏱️  运行时间: {mins}m {secs}s | 状态: {status} | 进度: {progress}% | 日志: {log_count}条", end='', flush=True)
        
        # Show new logs
        if log_count > last_log_count:
            print()  # New line
            new_logs = logs[last_log_count:]
            for log_entry in new_logs:
                try:
                    log_data = json.loads(log_entry)
                    timestamp = log_data.get('timestamp', '')[:19]
                    level = log_data.get('level', 'INFO')
                    msg = log_data.get('message', '')
                    print(f"  [{timestamp}] [{level:5s}] {msg}")
                except:
                    print(f"  {log_entry}")
            last_log_count = log_count
            print()
        
        # Check if completed
        if status in ['completed', 'failed', 'cancelled']:
            print(f"\n\n{'=' * 60}")
            print(f"✅ 任务已完成!")
            print(f"📊 最终状态: {status}")
            print(f"📝 总日志数: {log_count}")
            print(f"⏱️  总耗时: {mins}m {secs}s")
            
            # Show last 10 logs
            if logs:
                print(f"\n📋 最后10条日志:")
                for log_entry in logs[-10:]:
                    try:
                        log_data = json.loads(log_entry)
                        level = log_data.get('level', 'INFO')
                        msg = log_data.get('message', '')
                        print(f"  [{level:5s}] {msg}")
                    except:
                        print(f"  {log_entry}")
            
            break
        
        time.sleep(2)  # Check every 2 seconds
        
except KeyboardInterrupt:
    print(f"\n\n⏸️  监控已停止 (任务仍在后台运行)")
    print(f"扫描进度: {progress}%")
