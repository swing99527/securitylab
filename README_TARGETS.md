# 本地模糊测试靶场部署指南

SecurityLab 默认并未安装本地测试靶场，但我们为您提供了便捷的部署脚本。

## 快速开始

在项目根目录下，运行以下命令即可一键启动所有测试靶场：

```bash
docker-compose -f docker-compose-targets.yml up -d
```

## 包含的靶场

启动后，您可以通过以下地址访问：

1.  **DVWA (Damn Vulnerable Web App)**
    *   **地址**: `http://localhost:8080/`
    *   **默认凭据**: `admin` / `password`
    *   **首次使用**: 访问页面后点击 "Create / Reset Database"

2.  **OWASP Juice Shop**
    *   **地址**: `http://localhost:3000/`
    *   **说明**: 现代化的 Web 应用漏洞靶场，无需特定凭据

3.  **WebGoat**
    *   **地址**: `http://localhost:8081/WebGoat/login`
    *   **说明**: 经典的 Java Web 漏洞教学环境
    *   **注册**: 首次访问需点击 "Register new user" 创建账号

## 停止靶场

测试完成后，可以使用以下命令停止并移除容器：

```bash
docker-compose -f docker-compose-targets.yml down
```

## 注意事项

*   **端口冲突**：如果通过 `npm run dev` 在本地运行前端，可能会占用 3000 端口。请确保在启动 Juice Shop 前停止本地前端开发服务器，或者修改 `docker-compose-targets.yml` 中的端口映射。
*   **资源占用**：同时运行所有靶场可能会占用较多内存（约 1-2GB）。
*   **安全风险**：这些应用包含大量已知漏洞，请勿直接暴露在互联网上！仅限本地测试使用。
