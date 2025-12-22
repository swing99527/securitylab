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
            
            results.append({
                "cve_id": cve_id,
                "description": description,
                "cvss_score": cvss_score,
                "cvss_vector": cvss_vector,
                "severity": severity,
                "published_date": published,
                "last_modified_date": modified,
                "references": references
            })
        
        return results
    
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
