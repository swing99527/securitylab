#!/usr/bin/env python3
"""
测试NVD API客户端和漏洞扫描功能
"""
import sys
import os
import asyncio
sys.path.insert(0, os.path.abspath('.'))

from app.services.nvd_client import NVDClient

async def test_nvd_client():
    """测试NVD客户端"""
    print("=" * 60)
    print("NVD API客户端测试")
    print("=" * 60)
    
    # 初始化客户端（无API密钥）
    client = NVDClient()
    print(f"\n✅ 客户端初始化成功")
    print(f"   速率限制: {client.rate_limit} 请求/{client.rate_window}秒")
    
    # 测试1: 搜索已知的CVE
    print("\n" + "=" * 60)
    print("测试1: 搜索Apache HTTP Server 2.4.49漏洞")
    print("=" * 60)
    
    try:
        results = await client.search_cves("Apache HTTP Server", "2.4.49", max_results=5)
        
        print(f"\n✅ 查询成功，找到 {len(results)} 个CVE")
        
        for idx, cve in enumerate(results[:3], 1):
            print(f"\n📋 CVE #{idx}:")
            print(f"   ID: {cve['cve_id']}")
            print(f"   严重程度: {cve['severity']}")
            print(f"   CVSS评分: {cve['cvss_score']}")
            print(f"   描述: {cve['description'][:100]}...")
            
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        return False
    
    # 测试2: 搜索另一个常见服务
    print("\n" + "=" * 60)
    print("测试2: 搜索OpenSSH 7.4漏洞")
    print("=" * 60)
    
    try:
        results = await client.search_cves("OpenSSH", "7.4", max_results=5)
        
        print(f"\n✅ 查询成功，找到 {len(results)} 个CVE")
        
        for idx, cve in enumerate(results[:2], 1):
            print(f"\n📋 CVE #{idx}:")
            print(f"   ID: {cve['cve_id']}")
            print(f"   严重程度: {cve['severity']}")
            print(f"   CVSS评分: {cve['cvss_score']}")
            
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        return False
    
    # 测试3: 严重程度分类
    print("\n" + "=" * 60)
    print("测试3: 严重程度分类测试")
    print("=" * 60)
    
    test_scores = [10.0, 9.0, 8.0, 7.0, 5.0, 4.0, 2.0, 0.1]
    for score in test_scores:
        severity = client._get_severity(score)
        print(f"   CVSS {score:4.1f} → {severity}")
    
    print("\n" + "=" * 60)
    print("✅ 所有测试通过！")
    print("=" * 60)
    return True

if __name__ == "__main__":
    result = asyncio.run(test_nvd_client())
    sys.exit(0 if result else 1)
