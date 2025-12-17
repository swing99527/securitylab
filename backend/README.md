# IoT Security Testing Platform - Backend

基于 FastAPI 的统一后端应用（单体架构）

## 项目结构

```
backend/
├── app/
│   ├── main.py              # FastAPI 应用入口
│   ├── api/                 # API 路由
│   │   ├── auth.py          # 认证相关
│   │   ├── projects.py      # 项目管理
│   │   ├── samples.py       # 样品管理
│   │   ├── tasks.py         # 任务管理
│   │   ├── files.py         # 文件管理
│   │   ├── compliance.py    # 合规管理
│   │   ├── knowledge.py     # 知识库
│   │   └── dashboard.py     # 仪表盘
│   ├── core/                # 核心模块
│   │   ├── config.py        # 配置管理
│   │   ├── security.py      # 安全模块 (JWT, 密码)
│   │   └── permissions.py   # RBAC 权限
│   ├── models/              # SQLAlchemy 模型
│   ├── schemas/             # Pydantic Schemas
│   ├── services/            # 业务逻辑
│   └── utils/               # 工具函数
├── workers/                 # Celery Workers
├── alembic/                 # 数据库迁移
├── tests/                   # 测试文件
├── docker-compose.yml       # Docker 配置
├── pyproject.toml           # Poetry 依赖
└── .env                     # 环境变量

```

## 快速开始

### 1. 安装依赖

```bash
# 确保 Poetry 已安装
poetry --version

# 安装所有依赖
poetry install
```

### 2. 启动基础设施

```bash
# 启动 PostgreSQL, Redis, MinIO
docker-compose up -d postgres redis minio
```

### 3. 运行应用

```bash
# 开发模式（自动重载）
poetry run uvicorn app.main:app --reload --port 8000

# 或使用 Poetry shell
poetry shell
uvicorn app.main:app --reload --port 8000
```

### 4. 访问服务

- **API 文档**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc
- **健康检查**: http://localhost:8000/health

## 技术栈

- **Web 框架**: FastAPI 0.104+
- **数据库**: PostgreSQL 15 + SQLAlchemy (Async)
- **ORM 迁移**: Alembic  
- **缓存**: Redis 7
- **任务队列**: Celery
- **对象存储**: MinIO
- **认证**: JWT + Passlib (bcrypt)
- **文档生成**: python-docx + Matplotlib

## 开发指南

### 添加新的 API 端点

1. 在 `app/api/` 下创建或编辑路由文件
2. 在 `app/main.py` 中引入并注册路由
3. 定义 Pydantic schemas in `app/schemas/`
4. 实现业务逻辑 in `app/services/`

### 数据库迁移

```bash
# 创建新迁移
alembic revision --autogenerate -m "description"

# 执行迁移
alembic upgrade head

# 回滚
alembic downgrade -1
```

### 运行测试

```bash
poetry run pytest

# 带覆盖率
poetry run pytest --cov=app --cov-report=html
```

### 代码格式化

```bash
# 格式化代码
poetry run black app/
poetry run isort app/

# 代码检查
poetry run flake8 app/
```

## Docker 部署

```bash
# 构建镜像
docker build -t iot-backend .

# 运行容器
docker-compose up -d
```

## 环境变量

参见 `.env.example` 文件。

## License

Proprietary - 汕头人工智能实验室
