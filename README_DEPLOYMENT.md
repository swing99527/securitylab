# 部署配置说明

## 环境变量配置

### API Base URL 配置

在 `.env` 文件中配置 `NEXT_PUBLIC_API_BASE_URL` 来适应不同的部署场景:

#### 1. Docker Compose 部署 (推荐)

前后端通过 Nginx 统一代理,前端使用相对路径访问后端:

```bash
NEXT_PUBLIC_API_BASE_URL=
```

**说明**: 设置为空字符串时,所有 API 请求使用相对路径 `/api/v1/...`,由 Nginx 代理到后端服务。

#### 2. 生产环境 - 前后端分离部署

前端和后端部署在不同的服务器或域名:

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

**说明**: 前端会直接访问指定的后端 API 地址。

#### 3. 本地开发 (不使用 Docker)

直接在本地运行前端和后端:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

**说明**: 前端直接访问本地后端服务。

## 部署步骤

### Docker Compose 部署

1. 配置环境变量:
   ```bash
   cp .env.example .env
   # 编辑 .env 文件,设置 NEXT_PUBLIC_API_BASE_URL=
   ```

2. 构建并启动服务:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

3. 访问应用:
   - 前端: http://localhost:3000
   - 后端 API: http://localhost:3000/api/v1/...

### 生产环境部署

1. 配置环境变量:
   ```bash
   # 如果使用 Nginx 统一代理
   NEXT_PUBLIC_API_BASE_URL=
   
   # 如果前后端分离
   NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
   ```

2. 构建前端:
   ```bash
   docker-compose build --no-cache frontend
   ```

3. 重启服务:
   ```bash
   docker-compose restart frontend
   ```

## 注意事项

- `NEXT_PUBLIC_API_BASE_URL` 是在**构建时**注入的环境变量
- 修改此变量后需要**重新构建**前端容器
- 空字符串 (`""`) 和未设置是不同的,请确保设置为空字符串以使用相对路径
