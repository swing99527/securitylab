#!/usr/bin/env python3
"""
创建新的漏洞扫描任务来测试改进效果
"""
import sys
sys.path.append('/Users/chenshangwei/code/securityLab/backend')

import requests
import time
import json

BASE_URL = "http://localhost:8000/api/v1"

def get_completed_nmap_scan():
    """获取一个已完成的Nmap扫描任务"""
    response = requests.get(f"{BASE_URL}/tasks?type_filter=nmap_scan&status=completed&page_size=1")
    data = response.json()
    
    if data['code'] == 200 and len(data['data']['items']) > 0:
        task = data['data']['items'][0]
        print(f"✅ 找到Nmap扫描: {task['code']} - {task['name']}")
        return task['id']
    else:
        print("❌ 没有找到已完成的Nmap扫描")
        return None

def create_vuln_scan(nmap_task_id):
    """创建漏洞扫描任务"""
    payload = {
        "name": "测试版本匹配改进",
        "type": "vuln_scan",
        "config": {
            "nmap_task_id": nmap_task_id,
            "severity_filter": ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
            "max_cves_per_service": 20
        },
        "priority": "high"
    }
    
    response = requests.post(f"{BASE_URL}/tasks", json=payload)
    data = response.json()
    
    if data['code'] == 200:
        task = data['data']
        print(f"\n✅ 创建漏洞扫描任务成功!")
        print(f"   任务ID: {task['id']}")
        print(f"   任务代码: {task['code']}")
        return task['id']
    else:
        print(f"❌ 创建失败: {data}")
        return None

def monitor_task(task_id, max_wait=300):
    """监控任务执行"""
    print(f"\n📊 监控任务执行...")
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        response = requests.get(f"{BASE_URL}/tasks/{task_id}/status")
        data = response.json()
        
        if data['code'] == 200:
            task = data['data']
            status = task['status']
            progress = task.get('progress', 0)
            
            print(f"\r   状态: {status:12} | 进度: {progress:3}%", end='', flush=True)
            
            if status in ['completed', 'failed', 'cancelled']:
                print(f"\n\n✅ 任务{status}!")
                if task.get('result'):
                    result = task['result']
                    print(f"\n📈 扫描结果:")
                    print(f"   - 扫描服务数: {result.get('services_scanned', 0)}")
                    print(f"   - 发现漏洞数: {result.get('vulnerabilities_found', 0)}")
                    if result.get('vulnerabilities_found', 0) > 0:
                        print(f"   - 严重: {result.get('critical_count', 0)}")
                        print(f"   - 高危: {result.get('high_count', 0)}")
                        print(f"   - 中危: {result.get('medium_count', 0)}")
                        print(f"   - 低危: {result.get('low_count', 0)}")
                return status == 'completed'
        
        time.sleep(2)
    
    print("\n⏰ 超时")
    return False

def main():
    print("=" * 60)
    print("  🔬 测试增强版漏洞扫描")
    print("=" * 60)
    
    # 1. 获取Nmap扫描
    nmap_task_id = get_completed_nmap_scan()
    if not nmap_task_id:
        print("\n💡 提示: 请先运行一个Nmap扫描")
        return
    
    # 2. 创建漏洞扫描
    task_id = create_vuln_scan(nmap_task_id)
    if not task_id:
        return
    
    # 3. 监控执行
    success = monitor_task(task_id)
    
    # 4. 获取日志查看详情
    if success:
        print("\n📋 查看详细日志:")
        response = requests.get(f"{BASE_URL}/tasks/{task_id}/logs?limit=100")
        data = response.json()
        
        if data['code'] == 200:
            logs = data['data']['logs']
            for log in logs:
                msg = log['message']
                # 只显示关键日志
                if any(kw in msg for kw in ['NVD returned', 'After filtering', '发现', '扫描完成']):
                    print(f"   [{log['level']}] {msg}")
    
    print("\n" + "=" * 60)
    print(f"✅ 完成! 在UI中查看任务详情: http://localhost:3000/tasks/{task_id}")
    print("=" * 60)

if __name__ == "__main__":
    main()
