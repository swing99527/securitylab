"""
NVD (National Vulnerability Database) API Client

Provides interface for querying CVE data with rate limiting support
"""
import httpx
import asyncio
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class NVDClient:
    """NVD CVE数据库API客户端"""
    
    BASE_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"
    
    def __init__(self, api_key: Optional[str] = None):
        """
        初始化NVD客户端
        
        Args:
            api_key: NVD API密钥 (可选，提高速率限制)
        """
        self.api_key = api_key
        self.rate_limit = 50 if api_key else 5
        self.rate_window = 30  # seconds
        
        self._request_times: List[datetime] = []
        
    async def search_cves(
        self, 
        product: str, 
        version: Optional[str] = None,
        max_results: int = 20
    ) -> List[Dict]:
        """
        搜索CVE
        
        Args:
            product: 产品名称 (如 "Apache", "nginx")
            version: 版本号 (可选)
            max_results: 最大结果数
            
        Returns:
            CVE列表
        """
        await self._check_rate_limit()
        
        # 构建搜索关键词
        keyword = product
        if version:
            keyword = f"{product} {version}"
        
        params = {
            "keywordSearch": keyword,
            "resultsPerPage": min(max_results, 100)
        }
        
        headers = {}
        if self.api_key:
            headers["apiKey"] = self.api_key
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    self.BASE_URL,
                    params=params,
                    headers=headers
                )
                response.raise_for_status()
                
                data = response.json()
                vulnerabilities = data.get("vulnerabilities", [])
                
                logger.info(f"NVD API: Found {len(vulnerabilities)} CVEs for {keyword}")
                return self._parse_cves(vulnerabilities)
                
        except httpx.HTTPError as e:
            logger.error(f"NVD API error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error querying NVD: {e}")
            raise
    
    def _parse_cves(self, vulnerabilities: List[Dict]) -> List[Dict]:
        """解析CVE数据"""
        results = []
        
        for vuln in vulnerabilities:
            cve = vuln.get("cve", {})
            cve_id = cve.get("id")
            
            if not cve_id:
                continue
            
            # 描述
            descriptions = cve.get("descriptions", [])
            description = next(
                (d["value"] for d in descriptions if d.get("lang") == "en"),
                ""
            )
            
            # CVSS评分 (优先使用V3.1, 其次V3.0, 最后V2)
            metrics = cve.get("metrics", {})
            cvss_data = (
                metrics.get("cvssMetricV31", []) or
                metrics.get("cvssMetricV30", []) or
                metrics.get("cvssMetricV2", [])
            )
            
            cvss_score = 0.0
            cvss_vector = ""
            severity = "UNKNOWN"
            
            if cvss_data:
                cvss = cvss_data[0].get("cvssData", {})
                cvss_score = float(cvss.get("baseScore", 0.0))
                cvss_vector = cvss.get("vectorString", "")
                severity = self._get_severity(cvss_score)
            
            # 日期
            published = cve.get("published")
            modified = cve.get("lastModified")
            
            # 参考链接
            references = [
                {"url": ref.get("url"), "source": ref.get("source", "")}
                for ref in cve.get("references", [])[:5]  # 限制前5个
            ]
            
            # 提取CPE配置和受影响版本
            configurations = cve.get("configurations", [])
            affected_products = self._extract_affected_products(configurations)
            
            results.append({
                "cve_id": cve_id,
                "description": description,
                "cvss_score": cvss_score,
                "cvss_vector": cvss_vector,
                "severity": severity,
                "published_date": published,
                "last_modified_date": modified,
                "references": references,
                "affected_products": affected_products  # 新增：受影响的产品和版本
            })
        
        return results
    
    def _extract_affected_products(self, configurations: List[Dict]) -> List[Dict]:
        """
        提取受影响的产品和版本信息
        
        Returns:
            List of {product, vendor, version_start, version_end, ...}
        """
        products = []
        
        for config in configurations:
            nodes = config.get("nodes", [])
            for node in nodes:
                cpe_matches = node.get("cpeMatch", [])
                for cpe_match in cpe_matches:
                    if not cpe_match.get("vulnerable", True):
                        continue
                    
                    cpe_uri = cpe_match.get("criteria", "")
                    # Parse CPE: cpe:2.3:a:vendor:product:version:...
                    cpe_parts = cpe_uri.split(":")
                    
                    if len(cpe_parts) >= 5:
                        product_info = {
                            "vendor": cpe_parts[3] if len(cpe_parts) > 3 else "",
                            "product": cpe_parts[4] if len(cpe_parts) > 4 else "",
                            "version": cpe_parts[5] if len(cpe_parts) > 5 else "*",
                            "version_start_including": cpe_match.get("versionStartIncluding"),
                            "version_start_excluding": cpe_match.get("versionStartExcluding"),
                            "version_end_including": cpe_match.get("versionEndIncluding"),
                            "version_end_excluding": cpe_match.get("versionEndExcluding"),
                        }
                        products.append(product_info)
        
        return products
    
    def _get_severity(self, cvss_score: float) -> str:
        """根据CVSS评分判断严重程度"""
        if cvss_score >= 9.0:
            return "CRITICAL"
        elif cvss_score >= 7.0:
            return "HIGH"
        elif cvss_score >= 4.0:
            return "MEDIUM"
        elif cvss_score > 0:
            return "LOW"
        else:
            return "NONE"
    
    async def _check_rate_limit(self):
        """检查并等待速率限制"""
        now = datetime.now()
        
        # 清理旧请求
        self._request_times = [
            t for t in self._request_times
            if (now - t).total_seconds() < self.rate_window
        ]
        
        # 如果达到限制，等待
        if len(self._request_times) >= self.rate_limit:
            oldest = self._request_times[0]
            wait_time = self.rate_window - (now - oldest).total_seconds()
            if wait_time > 0:
                logger.info(f"Rate limit reached, waiting {wait_time:.1f}s")
                await asyncio.sleep(wait_time)
                # 清理后重新检查
                self._request_times = [
                    t for t in self._request_times
                    if (datetime.now() - t).total_seconds() < self.rate_window
                ]
        
        self._request_times.append(now)
    
    @staticmethod
    def is_version_affected(service_version: str, affected_products: List[Dict]) -> bool:
        """
        检查服务版本是否受CVE影响
        
        Args:
            service_version: 服务版本号 (如 "2.4.1", "1.19.0")
            affected_products: CVE受影响的产品列表
            
        Returns:
            True if version is affected, False otherwise
        """
        if not service_version or not affected_products:
            return True  # 无版本信息时默认包含
        
        # 清理版本号
        service_version = service_version.strip().lstrip('vV')
        
        for product in affected_products:
            # 检查版本范围
            if NVDClient._version_in_range(
                service_version,
                product.get("version_start_including"),
                product.get("version_start_excluding"),
                product.get("version_end_including"),
                product.get("version_end_excluding"),
                product.get("version")
            ):
                return True
        
        return False
    
    @staticmethod
    def _version_in_range(
        version: str,
        start_including: Optional[str],
        start_excluding: Optional[str],
        end_including: Optional[str],
        end_excluding: Optional[str],
        exact_version: Optional[str]
    ) -> bool:
        """检查版本是否在范围内"""
        try:
            # 精确匹配
            if exact_version and exact_version != "*" and exact_version != "-":
                return NVDClient._compare_versions(version, exact_version) == 0
            
            # 范围匹配
            if start_including:
                if NVDClient._compare_versions(version, start_including) < 0:
                    return False
            
            if start_excluding:
                if NVDClient._compare_versions(version, start_excluding) <= 0:
                    return False
            
            if end_including:
                if NVDClient._compare_versions(version, end_including) > 0:
                    return False
            
            if end_excluding:
                if NVDClient._compare_versions(version, end_excluding) >= 0:
                    return False
            
            # 如果有任何范围定义，且通过了所有检查，则在范围内
            if any([start_including, start_excluding, end_including, end_excluding]):
                return True
            
            # 无范围信息时返回True (宽松匹配)
            return True
            
        except Exception:
            # 版本比较失败时返回True (宽松匹配)
            return True
    
    @staticmethod
    def _compare_versions(v1: str, v2: str) -> int:
        """
        比较两个版本号
        
        Returns:
            -1 if v1 < v2
             0 if v1 == v2
             1 if v1 > v2
        """
        # 清理版本号前缀
        v1 = v1.strip().lstrip('vV')
        v2 = v2.strip().lstrip('vV')
        
        def normalize(v: str) -> List[int]:
            """将版本号转为数字列表"""
            parts = v.replace('-', '.').replace('_', '.').split('.')
            result = []
            for part in parts:
                # 尝试提取数字部分
                num_str = ''
                for char in part:
                    if char.isdigit():
                        num_str += char
                    else:
                        break
                if num_str:
                    result.append(int(num_str))
                elif part:  # 非数字部分
                    result.append(0)
            return result
        
        v1_parts = normalize(v1)
        v2_parts = normalize(v2)
        
        # 补齐长度
        max_len = max(len(v1_parts), len(v2_parts))
        v1_parts.extend([0] * (max_len - len(v1_parts)))
        v2_parts.extend([0] * (max_len - len(v2_parts)))
        
        for a, b in zip(v1_parts, v2_parts):
            if a < b:
                return -1
            elif a > b:
                return 1
        
        return 0
