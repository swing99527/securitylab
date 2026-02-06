#!/usr/bin/env python3
"""
直接测试fuzzing worker是否能记录性能指标
"""
import sys
sys.path.insert(0, '/Users/chenshangwei/code/securityLab/backend')

from app.workers.fuzzing_worker import fuzzing_worker

# 模拟progress_callback
logs = []

def test_callback(progress, message, level, extra_data):
    logs.append({
        'progress': progress,
        'message': message,
        'level': level,
        'extra_data': extra_data
    })
    if extra_data.get('latency') or extra_data.get('throughput'):
        print(f"✅ 性能指标: latency={extra_data.get('latency')}, throughput={extra_data.get('throughput')}")

# 测试参数
params = {
    'target_url': 'http://httpbin.org/get?test=1',
    'method': 'GET',
    'test_types': ['sql_injection'],  # 只测试一种
    'fuzz_timeout': 5,
    'fuzz_iterations': 5  # 只测试5个请求
}

print("="*70)
print("  直接测试Fuzzing Worker")
print("="*70)
print(f"目标: {params['target_url']}")
print(f"测试类型: {params['test_types']}")
print(f"最大请求数: {params['fuzz_iterations']}")
print()

try:
    result = fuzzing_worker(
        task_id='test-task-id',
        params=params,
        progress_callback=test_callback
    )
    
    print("\n"+"="*70)
    print("  测试结果")
    print("="*70)
    print(f"总请求数: {result['total_requests']}")
    print(f"发现漏洞: {result['vulnerabilities_found']}")
    
    # 统计性能指标日志
    metrics_logs = [log for log in logs if log['extra_data'].get('latency') or log['extra_data'].get('throughput')]
    print(f"\n包含性能指标的日志: {len(metrics_logs)}")
    
    if metrics_logs:
        print("✅ 性能监控功能正常！")
        print(f"第1个指标: {metrics_logs[0]['extra_data']}")
    else:
        print("❌ 没有性能指标被记录！")
        
except Exception as e:
    print(f"\n❌ Worker执行失败: {e}")
    import traceback
    traceback.print_exc()
