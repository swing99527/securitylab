#!/usr/bin/env python3
"""
端到端测试：漏洞扫描功能
测试完整的扫描流程和API功能
"""

import requests
import time
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_vulnerability_api(task_id):
    """测试漏洞API端点"""
    print_section("测试漏洞API")
    
    # 1. 获取漏洞列表（无筛选）
    print("1️⃣ 获取漏洞列表（无筛选）...")
    response = requests.get(f"{BASE_URL}/tasks/{task_id}/vulnerabilities")
    
    print(f"   响应状态码: {response.status_code}")
    
    if response.status_code != 200:
        print(f"❌ HTTP错误: {response.status_code}")
        print(f"   响应内容: {response.text[:200]}")
        return False
    
    data = response.json()
    print(f"   响应数据键: {list(data.keys())}")
    
    # 检查两种可能的响应格式
    if 'code' in data and data['code'] == 200:
        stats = data['data']['statistics']
        vulns = data['data']['vulnerabilities']
    elif 'data' in data:
        # 直接在data中
        stats = data['data']['statistics']
        vulns = data['data']['vulnerabilities']
    else:
        print(f"❌ 未知响应格式: {data}")
        return False
    
    print(f"✅ 总漏洞数: {stats['total_vulnerabilities']}")
    print(f"   - 严重: {stats['critical']}")
    print(f"   - 高危: {stats['high']}")
    print(f"   - 中危: {stats['medium']}")
    print(f"   - 低危: {stats['low']}")
    print(f"   返回漏洞数: {len(vulns)}")
    
    # 2. 测试严重程度筛选
    print("\n2️⃣ 测试严重程度筛选（CRITICAL）...")
    response = requests.get(f"{BASE_URL}/tasks/{task_id}/vulnerabilities?severity=CRITICAL")
    data = response.json()
    
    if data['code'] == 200:
        critical_count = len(data['data']['vulnerabilities'])
        print(f"✅ 严重漏洞数: {critical_count}")
        if critical_count > 0:
            first = data['data']['vulnerabilities'][0]
            print(f"   示例: {first['cve_id']} - CVSS {first['cvss_score']}")
    else:
        print(f"❌ 失败: {data}")
        return False
    
    # 3. 测试分页
    print("\n3️⃣ 测试分页功能...")
    response = requests.get(f"{BASE_URL}/tasks/{task_id}/vulnerabilities?page=1&page_size=5")
    data = response.json()
    
    if data['code'] == 200:
        print(f"✅ 第1页（每页5条）")
        print(f"   总页数: {data['data']['total_pages']}")
        print(f"   返回数: {len(data['data']['vulnerabilities'])}")
    else:
        print(f"❌ 失败: {data}")
        return False
    
    # 4. 测试服务筛选
    if vulns and len(vulns) > 0:
        service_name = vulns[0]['service_name']
        print(f"\n4️⃣ 测试服务筛选（{service_name}）...")
        response = requests.get(f"{BASE_URL}/tasks/{task_id}/vulnerabilities?service={service_name}")
        data = response.json()
        
        if data['code'] == 200:
            service_vulns = len(data['data']['vulnerabilities'])
            print(f"✅ {service_name} 漏洞数: {service_vulns}")
        else:
            print(f"❌ 失败: {data}")
            return False
    
    return True

def test_task_status(task_id):
    """测试任务状态API"""
    print_section("测试任务状态API")
    
    response = requests.get(f"{BASE_URL}/tasks/{task_id}/status")
    
    if response.status_code != 200:
        print(f"❌ HTTP错误: {response.status_code}")
        return False
    
    data = response.json()
    
   # Handle both response formats
    task_data = data.get('data', data)
    
    print(f"✅ 任务状态: {task_data.get('status', 'unknown')}")
    print(f"   进度: {task_data.get('progress', 0)}%")
    print(f"   类型: {task_data.get('type', 'unknown')}")
    
    if task_data.get('result'):
        result = task_data['result']
        print(f"\n   结果统计:")
        print(f"   - 扫描服务数: {result.get('services_scanned', 0)}")
        print(f"   - 发现漏洞数: {result.get('vulnerabilities_found', 0)}")
        print(f"   - 严重: {result.get('critical_count', 0)}")
        print(f"   - 高危: {result.get('high_count', 0)}")
        print(f"   - 中危: {result.get('medium_count', 0)}")
        print(f"   - 低危: {result.get('low_count', 0)}")
    return True

def display_vuln_sample(task_id):
    """显示漏洞样本"""
    print_section("漏洞详情样本")
    
    response = requests.get(f"{BASE_URL}/tasks/{task_id}/vulnerabilities?page=1&page_size=3&severity=CRITICAL")
    data = response.json()
    
    if data['code'] == 200 and len(data['data']['vulnerabilities']) > 0:
        for i, vuln in enumerate(data['data']['vulnerabilities'][:3], 1):
            print(f"\n{i}. {vuln['cve_id']} - {vuln['severity']}")
            print(f"   CVSS: {vuln['cvss_score']} | Vector: {vuln['cvss_vector']}")
            print(f"   服务: {vuln['service_name']} v{vuln['service_version']} (端口 {vuln['port']}/{vuln['protocol']})")
            print(f"   描述: {vuln['description'][:100]}...")
            if vuln.get('references') and len(vuln['references']) > 0:
                print(f"   参考: {vuln['references'][0].get('url', 'N/A')}")
            if vuln.get('remediation'):
                print(f"   修复: {vuln['remediation'][:80]}...")

def main():
    print_section("🔍 漏洞扫描功能端到端测试")
    print(f"测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 使用现有的漏洞扫描任务ID
    task_id = input("\n请输入漏洞扫描任务ID (默认: TASK-IOT-2025-0010-005): ").strip()
    if not task_id:
        task_id = "TASK-IOT-2025-0010-005"
    
    # 运行测试
    tests = [
        ("任务状态API", lambda: test_task_status(task_id)),
        ("漏洞API端点", lambda: test_vulnerability_api(task_id)),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} 异常: {e}")
            results.append((test_name, False))
    
    # 显示样本数据
    try:
        display_vuln_sample(task_id)
    except Exception as e:
        print(f"⚠️ 无法显示样本: {e}")
    
    # 汇总结果
    print_section("测试结果汇总")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{status} - {test_name}")
    
    print(f"\n总计: {passed}/{total} 通过")
    
    if passed == total:
        print("\n🎉 所有测试通过！")
    else:
        print("\n⚠️ 部分测试失败，请检查错误信息")

if __name__ == "__main__":
    main()
