# 为什么 Fuzzing 扫描没有发现漏洞？

如果您在使用本地靶场（如 DVWA）进行扫描时发现结果为 0 漏洞，通常是因为**未处于登录状态**。

## 原因分析

1.  **认证拦截**：DVWA 等靶场需要登录才能访问有漏洞的页面。
2.  **默认重定向**：如果未提供登录 Cookie，扫描器访问 `http://localhost:8080/vulnerabilities/sqli/` 时会被重定向到登录页 (`/login.php`)。
3.  **扫描器行为**：当前的 Fuzzing 引擎只能对公开页面进行测试，暂不支持自动登录或携带 Cookie。

## 解决方案

您可以尝试以下几种方法：

### 方法 1：测试开放的端点（推荐）

使用 **OWASP Juice Shop** 并测试其公开 API，例如：

*   **URL**: `http://localhost:3000/rest/products/search?q=` (产品搜索接口，存在 SQL 注入)
*   **方法**: `GET`

### 方法 2：降低 DVWA 安全级别

如果您想测试 DVWA，需要先手动登录并调整设置（虽然扫描器仍会被拦截，但这有助于您手动验证）：

1.  访问 `http://localhost:8080` 并登录 (`admin` / `password`)。
2.  点击左侧菜单的 **"DVWA Security"**。
3.  将 Security Level 设置为 **"Low"** 并提交。

### 方法 3：手动验证 URL

若要验证扫描器的连通性，可以尝试扫描一些不需要认证的公开测试站点，例如：
*   http://testphp.vulnweb.com/listproducts.php?cat=1

## 计划中的改进

我们正在开发下一代扫描引擎，将支持：
- [ ] 自定义 HTTP 请求头（Cookie/Authorization）
- [ ] 自动表单登录
- [ ] 浏览器驱动的深度扫描 (爬虫)
