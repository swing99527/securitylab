#!/usr/bin/env python3
"""
测试版本匹配功能
验证NVD客户端的版本匹配逻辑是否正确
"""

import sys
sys.path.append('/Users/chenshangwei/code/securityLab/backend')

from app.services.nvd_client import NVDClient

def test_version_comparison():
    """测试版本比较功能"""
    print("=" * 60)
    print("测试版本比较功能")
    print("=" * 60)
    
    test_cases = [
        # (v1, v2, expected_result)
        ("2.4.1", "2.4.1", 0),   # 相等
        ("2.4.1", "2.4.2", -1),  # v1 < v2
        ("2.4.2", "2.4.1", 1),   # v1 > v2
        ("2.4", "2.4.0", 0),     # 补齐零
        ("1.19.0", "1.19", 0),   # v1 > v2系列
        ("1.19.1", "1.19.0", 1),
        ("2.0.0", "1.99.99", 1), # 主版本号更重要
        ("v2.4.1", "2.4.1", 0),  # 带v前缀
    ]
    
    passed = 0
    failed = 0
    
    for v1, v2, expected in test_cases:
        result = NVDClient._compare_versions(v1, v2)
        status = "✓" if result == expected else "✗"
        if result == expected:
            passed += 1
        else:
            failed += 1
        print(f"{status} {v1:12} vs {v2:12} => {result:2} (expected {expected})")
    
    print(f"\n结果: {passed} 通过, {failed} 失败\n")
    return failed == 0

def test_version_range():
    """测试版本范围匹配"""
    print("=" * 60)
    print("测试版本范围匹配")
    print("=" * 60)
    
    test_cases = [
        # (version, start_inc, start_exc, end_inc, end_exc, exact, expected)
        ("2.4.1", "2.4.0", None, "2.4.5", None, None, True),  # 在范围内
        ("2.4.6", "2.4.0", None, "2.4.5", None, None, False), # 超出上限
        ("2.3.9", "2.4.0", None, "2.4.5", None, None, False), # 低于下限
        ("2.4.1", None, None, None, None, "2.4.1", True),     # 精确匹配
        ("2.4.2", None, None, None, None, "2.4.1", False),    # 精确不匹配
        ("2.4.0", None, "2.4.0", "2.5.0", None, None, False), # excluding边界
        ("2.4.1", None, "2.4.0", "2.5.0", None, None, True),  # excluding后
    ]
    
    passed = 0
    failed = 0
    
    for version, start_inc, start_exc, end_inc, end_exc, exact, expected in test_cases:
        result = NVDClient._version_in_range(version, start_inc, start_exc, end_inc, end_exc, exact)
        status = "✓" if result == expected else "✗"
        if result == expected:
            passed += 1
        else:
            failed += 1
        
        range_str = ""
        if exact:
            range_str = f"exact={exact}"
        else:
            range_str = f"[{start_inc or '*'}, {end_inc or '*'}]"
        
        print(f"{status} {version} in {range_str:20} => {result} (expected {expected})")
    
    print(f"\n结果: {passed} 通过, {failed} 失败\n")
    return failed == 0

def test_product_matching():
    """测试产品版本匹配"""
    print("=" * 60)
    print("测试产品版本匹配")
    print("=" * 60)
    
    # 模拟CVE的affected_products数据
    test_cases = [
        {
            "service_version": "2.4.41",
            "affected_products": [
                {
                    "vendor": "apache",
                    "product": "http_server",
                    "version": "*",
                    "version_start_including": "2.4.0",
                    "version_end_excluding": "2.4.50",
                    "version_start_excluding": None,
                    "version_end_including": None
                }
            ],
            "expected": True,
            "description": "Apache 2.4.41 在受影响范围内 (2.4.0 to 2.4.50)"
        },
        {
            "service_version": "2.4.51",
            "affected_products": [
                {
                    "vendor": "apache",
                    "product": "http_server",
                    "version": "*",
                    "version_start_including": "2.4.0",
                    "version_end_excluding": "2.4.50",
                    "version_start_excluding": None,
                    "version_end_including": None
                }
            ],
            "expected": False,
            "description": "Apache 2.4.51 不在受影响范围内 (已修复)"
        },
        {
            "service_version": "1.19.0",
            "affected_products": [
                {
                    "vendor": "nginx",
                    "product": "nginx",
                    "version": "1.19.0",
                    "version_start_including": None,
                    "version_end_excluding": None,
                    "version_start_excluding": None,
                    "version_end_including": None
                }
            ],
            "expected": True,
            "description": "Nginx 1.19.0 精确匹配"
        }
    ]
    
    passed = 0
    failed = 0
    
    for test in test_cases:
        result = NVDClient.is_version_affected(
            test["service_version"],
            test["affected_products"]
        )
        status = "✓" if result == test["expected"] else "✗"
        if result == test["expected"]:
            passed += 1
        else:
            failed += 1
        
        print(f"{status} {test['description']}")
        print(f"   Version: {test['service_version']}, Affected: {result} (expected {test['expected']})")
    
    print(f"\n结果: {passed} 通过, {failed} 失败\n")
    return failed == 0

def main():
    print("\n🔬 NVD版本匹配功能测试\n")
    
    all_passed = True
    
    all_passed &= test_version_comparison()
    all_passed &= test_version_range()
    all_passed &= test_product_matching()
    
    print("=" * 60)
    if all_passed:
        print("🎉 所有测试通过！")
    else:
        print("⚠️  部分测试失败")
    print("=" * 60)

if __name__ == "__main__":
    main()
