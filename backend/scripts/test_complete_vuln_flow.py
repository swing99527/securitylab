#!/usr/bin/env python3
"""
完整的Nmap + 漏洞扫描自动化测试
验证版本检测和漏洞匹配改进
"""
import sys
sys.path.append('/Users/chenshangwei/code/securityLab/backend')

import requests
import time
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"

def print_section(title):
    """打印分隔线"""
    print(f"\n{'=' * 70}")
    print(f"  {title}")
    print('=' * 70)

def create_nmap_scan(target="192.168.1.1"):
    """创建Nmap扫描任务（带版本检测）"""
    print_section("📡 步骤1: 创建Nmap扫描")
    
    payload = {
        "name": f"自动测试-Nmap-{datetime.now().strftime('%H%M%S')}",
        "type": "nmap_scan",
        "config": {
            "target": target,
            "scanType": "quick"  # 现在已包含 -sV
        },
        "priority": "high"
    }
    
    response = requests.post(f"{BASE_URL}/tasks", json=payload)
    data = response.json()
    
    task = data.get('data', data)
    if task and task.get('id'):
        print(f"✅ Nmap扫描任务已创建")
        print(f"   任务ID: {task['id']}")
        print(f"   任务代码: {task.get('code', 'N/A')}")
        print(f"   目标: {target}")
        return task['id']
    else:
        print(f"❌ 创建失败: {data}")
        return None

def monitor_task(task_id, task_name="任务", max_wait=180):
    """监控任务执行"""
    print(f"\n⏳ 监控{task_name}执行...")
    start_time = time.time()
    last_progress = -1
    
    while time.time() - start_time < max_wait:
        try:
            response = requests.get(f"{BASE_URL}/tasks/{task_id}/status")
            data = response.json()
            
            task = data.get('data', data)
            status = task.get('status', 'unknown')
            progress = task.get('progress', 0)
            
            # 只在进度变化时打印
            if progress != last_progress:
                print(f"   [{datetime.now().strftime('%H:%M:%S')}] 状态: {status:12} | 进度: {progress:3}%")
                last_progress = progress
            
            if status in ['completed', 'failed', 'cancelled']:
                print(f"\n{'✅' if status == 'completed' else '❌'} {task_name}{status}!")
                return status == 'completed', task
        except Exception as e:
            print(f"   ⚠️  监控出错: {e}")
        
        time.sleep(2)
    
    print(f"\n⏰ {task_name}超时（{max_wait}秒）")
    return False, None

def check_nmap_versions(task_id):
    """检查Nmap是否检测到版本信息"""
    print_section("🔍 步骤2: 验证版本检测")
    
    from app.core.database import get_sync_db
    from app.models import ScanResult
    
    db = next(get_sync_db())
    try:
        scan_result = db.query(ScanResult).filter(ScanResult.task_id == task_id).first()
        
        if not scan_result:
            print("❌ 未找到扫描结果")
            return False
        
        result = scan_result.result
        has_versions = False
        version_count = 0
        
        if 'hosts' in result:
            for host in result['hosts']:
                print(f"\n主机: {host['ip']}")
                print(f"{'':4}{'端口':8}{'协议':8}{'服务':15}{'产品':20}{'版本':15}")
                print(f"{'':4}{'-'*66}")
                
                for port_info in host.get('ports', [])[:10]:  # 显示前10个
                    port = port_info.get('port', 0)
                    proto = port_info.get('protocol', '')
                    service = port_info.get('service', '')
                    product = port_info.get('product', '')
                    version = port_info.get('version', '')
                    
                    has_version = bool(version or product)
                    if has_version:
                        has_versions = True
                        version_count += 1
                    
                    indicator = '✓' if has_version else '✗'
                    print(f"  {indicator} {port:<8}{proto:<8}{service:<15}{product:<20}{version:<15}")
        
        print(f"\n📊 版本检测统计:")
        print(f"   - 有版本信息的端口: {version_count}")
        print(f"   - 总端口数: {result.get('ports_found', 0)}")
        
        if has_versions:
            print(f"   ✅ 版本检测成功！")
        else:
            print(f"   ⚠️  未检测到版本信息（目标可能阻止了版本探测）")
        
        return has_versions
        
    finally:
        db.close()

def create_vuln_scan(nmap_task_id):
    """创建漏洞扫描任务"""
    print_section("🔒 步骤3: 创建漏洞扫描")
    
    payload = {
        "name": f"自动测试-漏洞扫描-{datetime.now().strftime('%H%M%S')}",
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
    
    task = data.get('data', data)
    if task and task.get('id'):
        print(f"✅ 漏洞扫描任务已创建")
        print(f"   任务ID: {task['id']}")
        print(f"   任务代码: {task.get('code', 'N/A')}")
        return task['id']
    else:
        print(f"❌ 创建失败: {data}")
        return None

def check_vuln_results(task_id):
    """检查漏洞扫描结果"""
    print_section("📊 步骤4: 分析扫描结果")
    
    # 获取任务结果
    response = requests.get(f"{BASE_URL}/tasks/{task_id}/status")
    data = response.json()
    task = data.get('data', data)
    result = task.get('result', {})
    
    print(f"扫描统计:")
    print(f"   - 扫描服务数: {result.get('services_scanned', 0)}")
    print(f"   - 发现漏洞数: {result.get('vulnerabilities_found', 0)}")
    
    if result.get('vulnerabilities_found', 0) > 0:
        print(f"\n漏洞分布:")
        print(f"   - 严重 (CRITICAL): {result.get('critical_count', 0)}")
        print(f"   - 高危 (HIGH): {result.get('high_count', 0)}")
        print(f"   - 中危 (MEDIUM): {result.get('medium_count', 0)}")
        print(f"   - 低危 (LOW): {result.get('low_count', 0)}")
    
    # 获取详细日志
    print(f"\n🔍 关键日志:")
    response = requests.get(f"{BASE_URL}/tasks/{task_id}/logs?limit=100")
    data = response.json()
    
    if 'data' in data:
        logs = data['data'].get('logs', [])
        for log in logs:
            msg = log['message']
            # 显示关键信息
            if any(kw in msg for kw in ['NVD returned', 'After filtering', '发现', '扫描完成']):
                level_icon = {'INFO': 'ℹ️', 'WARNING': '⚠️', 'ERROR': '❌'}.get(log['level'], '•')
                print(f"   {level_icon} {msg}")
    
    return result.get('vulnerabilities_found', 0)

def main():
    print("╔" + "=" * 68 + "╗")
    print("║" + " " * 15 + "🧪 完整漏洞扫描自动化测试" + " " * 17 + "║")
    print("╚" + "=" * 68 + "╝")
    print(f"\n开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 步骤1: 创建Nmap扫描
    nmap_task_id = create_nmap_scan()
    if not nmap_task_id:
        print("\n❌ 测试失败: 无法创建Nmap扫描")
        return
    
    # 监控Nmap扫描
    success, nmap_task = monitor_task(nmap_task_id, "Nmap扫描", max_wait=180)
    if not success:
        print("\n❌ 测试失败: Nmap扫描未完成")
        return
    
    # 步骤2: 检查版本检测
    has_versions = check_nmap_versions(nmap_task_id)
    
    # 步骤3: 创建漏洞扫描
    vuln_task_id = create_vuln_scan(nmap_task_id)
    if not vuln_task_id:
        print("\n❌ 测试失败: 无法创建漏洞扫描")
        return
    
    # 监控漏洞扫描
    success, vuln_task = monitor_task(vuln_task_id, "漏洞扫描", max_wait=180)
    if not success:
        print("\n❌ 测试失败: 漏洞扫描未完成")
        return
    
    # 步骤4: 检查结果
    vuln_count = check_vuln_results(vuln_task_id)
    
    # 最终总结
    print_section("✨ 测试总结")
    
    print(f"Nmap扫描:")
    print(f"   ✅ 任务ID: {nmap_task_id}")
    print(f"   {'✅' if has_versions else '⚠️'} 版本检测: {'成功' if has_versions else '未检测到版本'}")
    
    print(f"\n漏洞扫描:")
    print(f"   ✅ 任务ID: {vuln_task_id}")
    print(f"   📊 发现漏洞: {vuln_count} 个")
    
    print(f"\n🌐 查看详情:")
    print(f"   Nmap: http://localhost:3000/tasks/{nmap_task_id}")
    print(f"   漏洞: http://localhost:3000/tasks/{vuln_task_id}")
    
    print(f"\n完成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    # 判断测试是否成功
    if has_versions and vuln_count > 0:
        print("\n🎉 测试成功！版本检测和漏洞匹配都正常工作！")
    elif not has_versions:
        print("\n⚠️  测试部分成功：版本检测未生效（可能是目标主机限制）")
    elif vuln_count == 0:
        print("\n⚠️  测试部分成功：未发现漏洞（可能是目标没有公开漏洞或NVD未返回数据）")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  测试被用户中断")
    except Exception as e:
        print(f"\n\n❌ 测试出错: {e}")
        import traceback
        traceback.print_exc()
