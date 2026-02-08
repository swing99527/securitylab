# 智能玩具安全检测系统 - 后端 API 接口文档

> 汕头人工智能实验室
> 版本: 1.0.0
> 最后更新: 2024年12月

## 目录

- [一、概述](#一概述)
- [二、通用规范](#二通用规范)
- [三、数据库设计](#三数据库设计)
- [四、API 接口列表](#四api-接口列表)
- [五、WebSocket 事件](#五websocket-事件)
- [六、权限控制](#六权限控制)
- [七、错误码定义](#七错误码定义)

---

## 一、概述

### 1.1 技术栈建议

| 层级 | 推荐技术 | 备选方案 |
|------|---------|---------|
| 后端框架 | Spring Boot 3.x / Go Gin | Node.js NestJS |
| 数据库 | PostgreSQL 15+ | MySQL 8.0+ |
| 缓存 | Redis 7.x | - |
| 消息队列 | RabbitMQ / Kafka | Redis Streams |
| 文件存储 | MinIO / 阿里云 OSS | 本地存储 |
| 搜索引擎 | Elasticsearch 8.x | PostgreSQL 全文搜索 |

### 1.2 系统架构

\`\`\`
┌─────────────────────────────────────────────────────────────────────────┐
│                              前端 (Next.js)                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API 网关 (Nginx/Kong)                         │
│                        JWT 验证 / 限流 / 日志                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│  业务服务     │         │  任务调度服务  │         │  文件服务     │
│  (REST API)   │         │  (WebSocket)   │         │  (上传/下载)  │
└───────────────┘         └───────────────┘         └───────────────┘
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    ▼
                    ┌───────────────────────────────┐
                    │         PostgreSQL            │
                    │         Redis                 │
                    │         MinIO                 │
                    └───────────────────────────────┘
\`\`\`

---

## 二、通用规范

### 2.1 请求格式

**基础 URL**: `https://api.example.com/v1`

**请求头**:
\`\`\`http
Content-Type: application/json
Authorization: Bearer <access_token>
X-Request-ID: <uuid>  # 可选，用于链路追踪
\`\`\`

### 2.2 响应格式

**成功响应**:
\`\`\`json
{
  "code": 200,
  "message": "success",
  "data": { ... },
  "timestamp": "2024-12-15T10:30:00Z"
}
\`\`\`

**分页响应**:
\`\`\`json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [ ... ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
\`\`\`

**错误响应**:
\`\`\`json
{
  "code": 400,
  "message": "参数错误",
  "error": {
    "field": "email",
    "reason": "邮箱格式不正确"
  },
  "timestamp": "2024-12-15T10:30:00Z"
}
\`\`\`

### 2.3 分页参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码，从 1 开始 |
| pageSize | number | 20 | 每页数量，最大 100 |
| sortBy | string | createdAt | 排序字段 |
| sortOrder | string | desc | 排序方向：asc/desc |

### 2.4 通用查询参数

| 参数 | 类型 | 说明 |
|------|------|------|
| keyword | string | 关键字搜索 |
| startDate | string | 开始日期 (ISO 8601) |
| endDate | string | 结束日期 (ISO 8601) |
| status | string | 状态筛选 |

---

## 三、数据库设计

### 3.1 ER 图

\`\`\`
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │   projects   │       │    tasks     │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │       │ id (PK)      │
│ name         │◄──┐   │ name         │◄──┐   │ name         │
│ email        │   │   │ client       │   │   │ project_id   │──►
│ password     │   │   │ status       │   │   │ status       │
│ role         │   │   │ manager_id   │───┘   │ stage        │
│ status       │   │   │ deadline     │       │ assignee_id  │──►
│ created_at   │   │   │ created_at   │       │ created_at   │
└──────────────┘   │   └──────────────┘       └──────────────┘
                   │          │                      │
                   │          │ 1:N                  │ 1:N
                   │          ▼                      ▼
                   │   ┌──────────────┐       ┌──────────────┐
                   │   │   reports    │       │vulnerabilities│
                   │   ├──────────────┤       ├──────────────┤
                   │   │ id (PK)      │       │ id (PK)      │
                   │   │ project_id   │──►    │ task_id      │──►
                   │   │ title        │       │ name         │
                   │   │ status       │       │ severity     │
                   │   │ author_id    │───┐   │ status       │
                   │   │ reviewer_id  │───┤   │ target       │
                   │   │ created_at   │   │   │ cve          │
                   │   └──────────────┘   │   │ created_at   │
                   │                      │   └──────────────┘
                   └──────────────────────┘

┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   samples    │       │ sample_flows │       │  compliance  │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │◄──┐   │ id (PK)      │       │ id (PK)      │
│ name         │   │   │ sample_id    │───┘   │ project_id   │──►
│ model        │   │   │ action       │       │ clause       │
│ manufacturer │   │   │ operator_id  │──►    │ requirement  │
│ status       │   │   │ from_location│       │ auto_result  │
│ location     │   │   │ to_location  │       │ manual_result│
│ holder_id    │───┘   │ timestamp    │       │ evidence     │
│ created_at   │       └──────────────┘       │ created_at   │
└──────────────┘                              └──────────────┘
\`\`\`

### 3.2 表结构定义

#### users (用户表)

\`\`\`sql
CREATE TABLE users (
    id              VARCHAR(36) PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    avatar          VARCHAR(500),
    role            VARCHAR(20) NOT NULL DEFAULT 'engineer',
    department      VARCHAR(100),
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
    last_login_at   TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_role CHECK (role IN ('admin', 'director', 'manager', 'engineer', 'reviewer', 'signer', 'sample_admin', 'client')),
    CONSTRAINT chk_status CHECK (status IN ('active', 'inactive', 'locked'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
\`\`\`

#### projects (项目表)

\`\`\`sql
CREATE TABLE projects (
    id              VARCHAR(36) PRIMARY KEY,
    code            VARCHAR(50) NOT NULL UNIQUE,  -- 项目编号，如 PRJ-2024-001
    name            VARCHAR(200) NOT NULL,
    client          VARCHAR(200) NOT NULL,
    client_contact  VARCHAR(100),
    client_email    VARCHAR(255),
    standard        VARCHAR(50) NOT NULL,         -- 检测标准
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    progress        INTEGER DEFAULT 0,
    description     TEXT,
    manager_id      VARCHAR(36) REFERENCES users(id),
    start_date      DATE,
    deadline        DATE,
    completed_at    TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_status CHECK (status IN ('pending', 'in_progress', 'review', 'completed', 'on_hold', 'archived'))
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_manager ON projects(manager_id);
CREATE INDEX idx_projects_code ON projects(code);
\`\`\`

#### project_members (项目成员关联表)

\`\`\`sql
CREATE TABLE project_members (
    id              VARCHAR(36) PRIMARY KEY,
    project_id      VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id         VARCHAR(36) NOT NULL REFERENCES users(id),
    role            VARCHAR(20) NOT NULL,  -- 在项目中的角色
    joined_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(project_id, user_id)
);
\`\`\`

#### samples (样品表)

\`\`\`sql
CREATE TABLE samples (
    id              VARCHAR(36) PRIMARY KEY,
    code            VARCHAR(50) NOT NULL UNIQUE,  -- 样品编号，如 SPL-2024-0042
    name            VARCHAR(200) NOT NULL,
    model           VARCHAR(100),
    manufacturer    VARCHAR(200),
    serial_number   VARCHAR(100),
    firmware_version VARCHAR(50),
    status          VARCHAR(20) NOT NULL DEFAULT 'in_stock',
    location        VARCHAR(100) NOT NULL,
    holder_id       VARCHAR(36) REFERENCES users(id),
    project_id      VARCHAR(36) REFERENCES projects(id),
    qr_code         VARCHAR(500),
    description     TEXT,
    in_date         DATE NOT NULL,
    out_date        DATE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_status CHECK (status IN ('in_stock', 'in_use', 'returned', 'scrapped'))
);

CREATE INDEX idx_samples_status ON samples(status);
CREATE INDEX idx_samples_code ON samples(code);
CREATE INDEX idx_samples_location ON samples(location);
\`\`\`

#### sample_flows (样品流转记录表)

\`\`\`sql
CREATE TABLE sample_flows (
    id              VARCHAR(36) PRIMARY KEY,
    sample_id       VARCHAR(36) NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
    action          VARCHAR(20) NOT NULL,
    operator_id     VARCHAR(36) NOT NULL REFERENCES users(id),
    from_location   VARCHAR(100),
    to_location     VARCHAR(100),
    reason          TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_action CHECK (action IN ('in', 'out', 'transfer', 'return', 'scrap'))
);

CREATE INDEX idx_sample_flows_sample ON sample_flows(sample_id);
\`\`\`

#### tasks (任务表)

\`\`\`sql
CREATE TABLE tasks (
    id              VARCHAR(36) PRIMARY KEY,
    code            VARCHAR(50) NOT NULL UNIQUE,  -- 任务编号，如 TSK-2024-001
    name            VARCHAR(200) NOT NULL,
    project_id      VARCHAR(36) NOT NULL REFERENCES projects(id),
    type            VARCHAR(50) NOT NULL,          -- 任务类型
    status          VARCHAR(20) NOT NULL DEFAULT 'queued',
    stage           VARCHAR(50),                   -- 当前阶段
    progress        INTEGER DEFAULT 0,
    priority        INTEGER DEFAULT 5,             -- 优先级 1-10
    config          JSONB,                         -- 任务配置参数
    assignee_id     VARCHAR(36) REFERENCES users(id),
    engine          VARCHAR(50),                   -- 使用的测试引擎
    start_time      TIMESTAMP,
    end_time        TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_status CHECK (status IN ('queued', 'running', 'paused', 'completed', 'failed', 'cancelled')),
    CONSTRAINT chk_type CHECK (type IN ('port_scan', 'vuln_scan', 'firmware_analysis', 'fuzzing', 'pentest', 'wireless'))
);

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
\`\`\`

#### task_logs (任务日志表)

\`\`\`sql
CREATE TABLE task_logs (
    id              VARCHAR(36) PRIMARY KEY,
    task_id         VARCHAR(36) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    level           VARCHAR(10) NOT NULL,
    message         TEXT NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_level CHECK (level IN ('info', 'warning', 'error', 'success', 'debug'))
);

CREATE INDEX idx_task_logs_task ON task_logs(task_id);
CREATE INDEX idx_task_logs_time ON task_logs(created_at);
\`\`\`

#### vulnerabilities (漏洞表)

\`\`\`sql
CREATE TABLE vulnerabilities (
    id              VARCHAR(36) PRIMARY KEY,
    task_id         VARCHAR(36) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    severity        VARCHAR(20) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'open',
    target          VARCHAR(200),
    cve             VARCHAR(50),
    cvss_score      DECIMAL(3,1),
    description     TEXT,
    solution        TEXT,
    evidence        TEXT,
    discovered_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at    TIMESTAMP,
    confirmed_by    VARCHAR(36) REFERENCES users(id),
    
    CONSTRAINT chk_severity CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    CONSTRAINT chk_status CHECK (status IN ('open', 'confirmed', 'fixed', 'false_positive', 'accepted'))
);

CREATE INDEX idx_vulnerabilities_task ON vulnerabilities(task_id);
CREATE INDEX idx_vulnerabilities_severity ON vulnerabilities(severity);
\`\`\`

#### compliance_items (合规条款表)

\`\`\`sql
CREATE TABLE compliance_items (
    id              VARCHAR(36) PRIMARY KEY,
    project_id      VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_id       VARCHAR(36) REFERENCES compliance_items(id),
    clause          VARCHAR(50) NOT NULL,          -- 条款号
    requirement     TEXT NOT NULL,                 -- 要求描述
    test_item       VARCHAR(200),                  -- 关联测试项
    auto_result     VARCHAR(20) DEFAULT 'pending',
    manual_result   VARCHAR(20) DEFAULT 'pending',
    evidence        TEXT,
    evidence_files  JSONB,                         -- 证据文件列表
    reviewed_by     VARCHAR(36) REFERENCES users(id),
    reviewed_at     TIMESTAMP,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_auto_result CHECK (auto_result IN ('pass', 'fail', 'warning', 'pending', 'na')),
    CONSTRAINT chk_manual_result CHECK (manual_result IN ('pass', 'fail', 'warning', 'pending', 'na'))
);

CREATE INDEX idx_compliance_project ON compliance_items(project_id);
CREATE INDEX idx_compliance_parent ON compliance_items(parent_id);
\`\`\`

#### reports (报告表)

\`\`\`sql
CREATE TABLE reports (
    id              VARCHAR(36) PRIMARY KEY,
    code            VARCHAR(50) NOT NULL UNIQUE,  -- 报告编号
    project_id      VARCHAR(36) NOT NULL REFERENCES projects(id),
    title           VARCHAR(300) NOT NULL,
    version         VARCHAR(20) NOT NULL DEFAULT '1.0',
    status          VARCHAR(20) NOT NULL DEFAULT 'draft',
    template        VARCHAR(50),                   -- 使用的模板
    content         JSONB,                         -- 报告内容结构
    author_id       VARCHAR(36) NOT NULL REFERENCES users(id),
    reviewer_id     VARCHAR(36) REFERENCES users(id),
    signer_id       VARCHAR(36) REFERENCES users(id),
    submitted_at    TIMESTAMP,
    reviewed_at     TIMESTAMP,
    signed_at       TIMESTAMP,
    pdf_url         VARCHAR(500),
    signature_data  JSONB,                         -- 电子签章信息
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_status CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'signed'))
);

CREATE INDEX idx_reports_project ON reports(project_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_author ON reports(author_id);
\`\`\`

#### report_annotations (报告批注表)

\`\`\`sql
CREATE TABLE report_annotations (
    id              VARCHAR(36) PRIMARY KEY,
    report_id       VARCHAR(36) NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    section_id      VARCHAR(50),                   -- 章节ID
    page_number     INTEGER,
    position        JSONB,                         -- 标注位置 {x, y, width, height}
    content         TEXT NOT NULL,
    author_id       VARCHAR(36) NOT NULL REFERENCES users(id),
    resolved        BOOLEAN DEFAULT FALSE,
    resolved_at     TIMESTAMP,
    resolved_by     VARCHAR(36) REFERENCES users(id),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_annotations_report ON report_annotations(report_id);
\`\`\`

#### report_annotation_replies (批注回复表)

\`\`\`sql
CREATE TABLE report_annotation_replies (
    id              VARCHAR(36) PRIMARY KEY,
    annotation_id   VARCHAR(36) NOT NULL REFERENCES report_annotations(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    author_id       VARCHAR(36) NOT NULL REFERENCES users(id),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_replies_annotation ON report_annotation_replies(annotation_id);
\`\`\`

#### articles (知识库文章表)

\`\`\`sql
CREATE TABLE articles (
    id              VARCHAR(36) PRIMARY KEY,
    title           VARCHAR(300) NOT NULL,
    content         TEXT NOT NULL,
    summary         VARCHAR(500),
    category_id     VARCHAR(36) NOT NULL,
    type            VARCHAR(20) NOT NULL DEFAULT 'article',
    views           INTEGER DEFAULT 0,
    author_id       VARCHAR(36) NOT NULL REFERENCES users(id),
    tags            JSONB,
    attachments     JSONB,
    published       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_type CHECK (type IN ('article', 'video', 'document'))
);

CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_published ON articles(published);

-- 全文搜索索引
CREATE INDEX idx_articles_fulltext ON articles USING gin(to_tsvector('chinese', title || ' ' || content));
\`\`\`

#### article_stars (文章收藏表)

\`\`\`sql
CREATE TABLE article_stars (
    id              VARCHAR(36) PRIMARY KEY,
    article_id      VARCHAR(36) NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id         VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(article_id, user_id)
);
\`\`\`

#### notifications (通知表)

\`\`\`sql
CREATE TABLE notifications (
    id              VARCHAR(36) PRIMARY KEY,
    user_id         VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    message         TEXT NOT NULL,
    type            VARCHAR(20) NOT NULL DEFAULT 'info',
    link            VARCHAR(500),
    read            BOOLEAN DEFAULT FALSE,
    read_at         TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_type CHECK (type IN ('info', 'warning', 'error', 'success'))
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
\`\`\`

#### audit_logs (审计日志表)

\`\`\`sql
CREATE TABLE audit_logs (
    id              VARCHAR(36) PRIMARY KEY,
    user_id         VARCHAR(36) REFERENCES users(id),
    action          VARCHAR(50) NOT NULL,
    resource_type   VARCHAR(50) NOT NULL,
    resource_id     VARCHAR(36),
    details         JSONB,
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(500),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_time ON audit_logs(created_at);
\`\`\`

---

## 四、API 接口列表

### 4.1 认证模块 (Auth)

#### POST /auth/login
登录获取 Token

**请求体**:
\`\`\`json
{
  "email": "user@example.com",
  "password": "password123"
}
\`\`\`

**响应**:
\`\`\`json
{
  "code": 200,
  "message": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600,
    "user": {
      "id": "user-001",
      "name": "张工程师",
      "email": "user@example.com",
      "role": "engineer",
      "avatar": "https://...",
      "department": "检测部"
    }
  }
}
\`\`\`

#### POST /auth/refresh
刷新 Token

#### POST /auth/logout
登出

#### GET /auth/me
获取当前用户信息

#### PUT /auth/password
修改密码

---

### 4.2 用户管理模块 (Users)

#### GET /users
获取用户列表（需要 admin 权限）

**查询参数**:
- role: 角色筛选
- status: 状态筛选
- keyword: 关键字搜索

#### POST /users
创建用户（需要 admin 权限）

**请求体**:
\`\`\`json
{
  "name": "新用户",
  "email": "new@example.com",
  "password": "initial123",
  "role": "engineer",
  "department": "检测部"
}
\`\`\`

#### GET /users/:id
获取用户详情

#### PUT /users/:id
更新用户信息

#### DELETE /users/:id
删除用户

#### PUT /users/:id/status
更新用户状态（启用/禁用/锁定）

#### PUT /users/:id/role
更新用户角色

---

### 4.3 项目模块 (Projects)

#### GET /projects
获取项目列表

**查询参数**:
- status: pending | in_progress | review | completed | on_hold | archived
- managerId: 项目经理 ID
- keyword: 关键字搜索
- startDate / endDate: 日期范围

**响应示例**:
\`\`\`json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": "PRJ-2024-001",
        "code": "PRJ-2024-001",
        "name": "智能门锁安全检测",
        "client": "某科技有限公司",
        "standard": "EN 18031",
        "status": "in_progress",
        "progress": 65,
        "manager": {
          "id": "user-001",
          "name": "张经理"
        },
        "deadline": "2024-12-30",
        "createdAt": "2024-12-01T10:00:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "pageSize": 20
  }
}
\`\`\`

#### POST /projects
创建项目

**请求体**:
\`\`\`json
{
  "name": "智能门锁安全检测",
  "client": "某科技有限公司",
  "clientContact": "李先生",
  "clientEmail": "li@client.com",
  "standard": "EN 18031",
  "description": "针对智能门锁的网络安全检测",
  "managerId": "user-001",
  "members": ["user-002", "user-003"],
  "sampleIds": ["SPL-2024-0042"],
  "deadline": "2024-12-30"
}
\`\`\`

#### GET /projects/:id
获取项目详情

#### PUT /projects/:id
更新项目信息

#### DELETE /projects/:id
删除项目

#### PUT /projects/:id/status
更新项目状态

#### GET /projects/:id/members
获取项目成员

#### POST /projects/:id/members
添加项目成员

#### DELETE /projects/:id/members/:userId
移除项目成员

#### GET /projects/:id/timeline
获取项目时间线/活动记录

---

### 4.4 任务模块 (Tasks)

#### GET /tasks
获取任务列表

**查询参数**:
- projectId: 项目 ID
- status: queued | running | paused | completed | failed | cancelled
- type: port_scan | vuln_scan | firmware_analysis | fuzzing | pentest | wireless
- assigneeId: 执行人 ID

#### POST /tasks
创建任务

**请求体**:
\`\`\`json
{
  "name": "端口扫描任务",
  "projectId": "PRJ-2024-001",
  "type": "port_scan",
  "assigneeId": "user-002",
  "priority": 8,
  "engine": "nmap",
  "config": {
    "target": "192.168.1.100",
    "portRange": "1-65535",
    "scanType": "syn",
    "timing": 4
  }
}
\`\`\`

#### GET /tasks/:id
获取任务详情

**响应示例**:
\`\`\`json
{
  "code": 200,
  "data": {
    "id": "TSK-2024-001",
    "name": "端口扫描任务",
    "project": {
      "id": "PRJ-2024-001",
      "name": "智能门锁安全检测"
    },
    "type": "port_scan",
    "status": "running",
    "stage": "scanning",
    "progress": 45,
    "engine": "nmap",
    "config": { ... },
    "assignee": {
      "id": "user-002",
      "name": "李工程师"
    },
    "startTime": "2024-12-15T10:00:00Z",
    "statistics": {
      "scannedPorts": 29250,
      "openPorts": 12,
      "filteredPorts": 5
    }
  }
}
\`\`\`

#### PUT /tasks/:id
更新任务

#### DELETE /tasks/:id
删除任务

#### POST /tasks/:id/start
启动任务

#### POST /tasks/:id/pause
暂停任务

#### POST /tasks/:id/resume
恢复任务

#### POST /tasks/:id/stop
停止任务

#### GET /tasks/:id/logs
获取任务日志

**查询参数**:
- level: info | warning | error | success
- since: 时间戳，获取此时间之后的日志
- limit: 返回条数限制

#### GET /tasks/:id/vulnerabilities
获取任务发现的漏洞列表

#### GET /tasks/:id/topology
获取网络拓扑数据

#### GET /tasks/:id/fuzzing/stats
获取 Fuzzing 统计数据

**响应示例**:
\`\`\`json
{
  "code": 200,
  "data": {
    "execSpeed": 1234,
    "totalExecs": 5678900,
    "coverage": 78.5,
    "crashes": 12,
    "hangs": 3,
    "uniqueCrashes": 5,
    "lastCrashTime": "2024-12-15T09:30:00Z"
  }
}
\`\`\`

---

### 4.5 漏洞模块 (Vulnerabilities)

#### GET /vulnerabilities
获取漏洞列表

**查询参数**:
- projectId: 项目 ID
- taskId: 任务 ID
- severity: critical | high | medium | low | info
- status: open | confirmed | fixed | false_positive | accepted

#### GET /vulnerabilities/:id
获取漏洞详情

#### PUT /vulnerabilities/:id
更新漏洞信息

#### PUT /vulnerabilities/:id/status
更新漏洞状态

**请求体**:
\`\`\`json
{
  "status": "confirmed",
  "comment": "已确认该漏洞存在"
}
\`\`\`

#### GET /vulnerabilities/statistics
获取漏洞统计

**响应示例**:
\`\`\`json
{
  "code": 200,
  "data": {
    "total": 156,
    "bySeverity": {
      "critical": 5,
      "high": 23,
      "medium": 67,
      "low": 45,
      "info": 16
    },
    "byStatus": {
      "open": 89,
      "confirmed": 45,
      "fixed": 12,
      "false_positive": 10
    },
    "trend": [
      { "date": "2024-12-01", "count": 12 },
      { "date": "2024-12-02", "count": 8 }
    ]
  }
}
\`\`\`

---

### 4.6 合规模块 (Compliance)

#### GET /projects/:projectId/compliance
获取项目合规矩阵

**响应示例**:
\`\`\`json
{
  "code": 200,
  "data": {
    "standard": "EN 18031",
    "items": [
      {
        "id": "comp-001",
        "clause": "3.2",
        "requirement": "安全启动与固件更新",
        "children": [
          {
            "id": "comp-001-1",
            "clause": "3.2.1",
            "requirement": "设备应实现安全启动机制",
            "testItem": "TSK-001",
            "autoResult": "pass",
            "manualResult": "pending",
            "evidence": ""
          }
        ]
      }
    ],
    "statistics": {
      "total": 47,
      "pass": 28,
      "fail": 5,
      "warning": 8,
      "pending": 6
    }
  }
}
\`\`\`

#### PUT /compliance/:id
更新合规项

**请求体**:
\`\`\`json
{
  "manualResult": "pass",
  "evidence": "见附件截图，设备启动时验证了固件签名"
}
\`\`\`

#### POST /compliance/:id/evidence
上传合规证据

**请求体**: multipart/form-data
- file: 文件
- description: 描述

#### POST /projects/:projectId/compliance/batch-pass
批量通过绿色项

---

### 4.7 样品模块 (Samples)

#### GET /samples
获取样品列表

**查询参数**:
- status: in_stock | in_use | returned | scrapped
- location: 位置筛选
- projectId: 关联项目
- keyword: 关键字搜索

#### POST /samples
样品入库

**请求体**:
\`\`\`json
{
  "name": "智能门锁主机",
  "model": "SL-2000",
  "manufacturer": "某科技有限公司",
  "serialNumber": "SN20241201001",
  "firmwareVersion": "v2.3.1",
  "location": "A区-001",
  "description": "客户送检样品，含配件包"
}
\`\`\`

**响应**: 返回样品信息和生成的二维码

#### GET /samples/:id
获取样品详情（含流转记录）

#### PUT /samples/:id
更新样品信息

#### POST /samples/:id/checkout
样品领用

**请求体**:
\`\`\`json
{
  "projectId": "PRJ-2024-001",
  "reason": "进行安全检测"
}
\`\`\`

#### POST /samples/:id/return
样品归还

**请求体**:
\`\`\`json
{
  "location": "A区-001",
  "condition": "完好"
}
\`\`\`

#### POST /samples/:id/transfer
样品转移

**请求体**:
\`\`\`json
{
  "toLocation": "B区-003",
  "reason": "转移至无线测试区"
}
\`\`\`

#### POST /samples/:id/scrap
样品报废

**请求体**:
\`\`\`json
{
  "reason": "检测过程中损坏"
}
\`\`\`

#### GET /samples/scan/:code
扫码查询样品

#### GET /samples/:id/flows
获取样品流转记录

#### GET /samples/:id/qrcode
获取样品二维码图片

---

### 4.8 报告模块 (Reports)

#### GET /reports
获取报告列表

**查询参数**:
- projectId: 项目 ID
- status: draft | pending_review | approved | rejected | signed
- authorId: 作者 ID

#### POST /reports
创建报告

**请求体**:
\`\`\`json
{
  "projectId": "PRJ-2024-001",
  "title": "智能门锁安全检测报告",
  "template": "en18031",
  "sections": ["summary", "scope", "findings", "compliance", "recommendations"]
}
\`\`\`

#### GET /reports/:id
获取报告详情

#### PUT /reports/:id
更新报告内容

#### DELETE /reports/:id
删除报告

#### POST /reports/:id/submit
提交审核

#### POST /reports/:id/review
审核报告

**请求体**:
\`\`\`json
{
  "action": "approve",  // approve | reject
  "comment": "审核通过，可以进行签章"
}
\`\`\`

#### POST /reports/:id/sign
电子签章

**请求体**:
\`\`\`json
{
  "password": "签章密码",
  "position": {
    "page": 1,
    "x": 450,
    "y": 700
  }
}
\`\`\`

#### GET /reports/:id/pdf
获取报告 PDF

#### GET /reports/:id/annotations
获取报告批注列表

#### POST /reports/:id/annotations
添加批注

**请求体**:
\`\`\`json
{
  "sectionId": "findings",
  "pageNumber": 5,
  "position": { "x": 100, "y": 200, "width": 300, "height": 50 },
  "content": "此处截图不够清晰，请重新截取"
}
\`\`\`

#### PUT /annotations/:id
更新批注

#### DELETE /annotations/:id
删除批注

#### POST /annotations/:id/resolve
标记批注已解决

#### POST /annotations/:id/replies
回复批注

---

### 4.9 知识库模块 (Knowledge)

#### GET /knowledge/categories
获取分类列表

#### GET /knowledge/articles
获取文章列表

**查询参数**:
- categoryId: 分类 ID
- type: article | video | document
- keyword: 关键字搜索
- starred: 仅收藏

#### POST /knowledge/articles
创建文章

**请求体**:
\`\`\`json
{
  "title": "EN 18031 标准解读",
  "content": "# 概述\n...",
  "summary": "本文详细解读 EN 18031 标准要求",
  "categoryId": "standards",
  "type": "article",
  "tags": ["EN 18031", "标准解读", "网络安全"]
}
\`\`\`

#### GET /knowledge/articles/:id
获取文章详情

#### PUT /knowledge/articles/:id
更新文章

#### DELETE /knowledge/articles/:id
删除文章

#### POST /knowledge/articles/:id/star
收藏文章

#### DELETE /knowledge/articles/:id/star
取消收藏

#### GET /knowledge/search
搜索文章

**查询参数**:
- q: 搜索关键词
- ai: 是否使用 AI 语义搜索 (true/false)

---

### 4.10 仪表盘模块 (Dashboard)

#### GET /dashboard/stats
获取统计数据

**响应示例**:
\`\`\`json
{
  "code": 200,
  "data": {
    "projectsInProgress": 12,
    "projectsTrend": 8.5,
    "pendingReports": 5,
    "reportsTrend": -2.3,
    "samplesToday": 3,
    "samplesTrend": 15.0,
    "abnormalDevices": 1
  }
}
\`\`\`

#### GET /dashboard/heatmap
获取实验室负荷热力图数据

**响应示例**:
\`\`\`json
{
  "code": 200,
  "data": [
    { "date": "2024-12-15", "hour": 9, "value": 3 },
    { "date": "2024-12-15", "hour": 10, "value": 2 }
  ]
}
\`\`\`

#### GET /dashboard/vulnerability-trend
获取漏洞趋势数据

#### GET /dashboard/todos
获取待办事项

#### PUT /dashboard/todos/:id/complete
完成待办事项

---

### 4.11 通知模块 (Notifications)

#### GET /notifications
获取通知列表

**查询参数**:
- unreadOnly: 仅未读

#### PUT /notifications/:id/read
标记已读

#### PUT /notifications/read-all
全部标记已读

#### DELETE /notifications/:id
删除通知

#### DELETE /notifications
清空通知

---

### 4.12 硬件模块 (Hardware)

#### GET /hardware/status
获取硬件状态

**响应示例**:
\`\`\`json
{
  "code": 200,
  "data": {
    "probes": [
      {
        "id": "probe-wifi-01",
        "name": "WiFi 探针",
        "type": "wifi",
        "status": "online",
        "ip": "192.168.1.101",
        "lastHeartbeat": "2024-12-15T10:29:55Z"
      },
      {
        "id": "probe-ble-01",
        "name": "BLE 探针",
        "type": "ble",
        "status": "offline",
        "lastHeartbeat": "2024-12-15T09:15:00Z"
      }
    ]
  }
}
\`\`\`

#### POST /hardware/:id/reconnect
重连硬件

#### GET /hardware/:id/logs
获取硬件日志

---

### 4.13 系统设置模块 (Settings)

#### GET /settings
获取系统设置

#### PUT /settings
更新系统设置

#### GET /settings/audit-logs
获取审计日志

**查询参数**:
- userId: 用户 ID
- action: 操作类型
- resourceType: 资源类型
- startDate / endDate: 时间范围

---

## 五、WebSocket 事件

### 5.1 连接

\`\`\`javascript
const ws = new WebSocket('wss://api.example.com/ws?token=<access_token>');
\`\`\`

### 5.2 事件类型

#### 任务进度更新
\`\`\`json
{
  "event": "task:progress",
  "data": {
    "taskId": "TSK-2024-001",
    "progress": 65,
    "stage": "scanning",
    "message": "正在扫描端口 32000-40000"
  }
}
\`\`\`

#### 任务日志
\`\`\`json
{
  "event": "task:log",
  "data": {
    "taskId": "TSK-2024-001",
    "level": "info",
    "message": "发现开放端口: 22 (SSH)",
    "timestamp": "2024-12-15T10:30:00Z"
  }
}
\`\`\`

#### 漏洞发现
\`\`\`json
{
  "event": "task:vulnerability",
  "data": {
    "taskId": "TSK-2024-001",
    "vulnerability": {
      "id": "VUL-001",
      "name": "SSH 弱密码",
      "severity": "high",
      "target": "192.168.1.100:22"
    }
  }
}
\`\`\`

#### 任务状态变更
\`\`\`json
{
  "event": "task:status",
  "data": {
    "taskId": "TSK-2024-001",
    "status": "completed",
    "message": "任务执行完成"
  }
}
\`\`\`

#### 硬件状态变更
\`\`\`json
{
  "event": "hardware:status",
  "data": {
    "probeId": "probe-wifi-01",
    "status": "offline",
    "message": "连接超时"
  }
}
\`\`\`

#### 新通知
\`\`\`json
{
  "event": "notification",
  "data": {
    "id": "notif-001",
    "title": "报告审核通过",
    "message": "您的报告 RPT-2024-001 已审核通过",
    "type": "success",
    "link": "/reports/RPT-2024-001"
  }
}
\`\`\`

### 5.3 客户端订阅

\`\`\`json
// 订阅特定任务的更新
{
  "action": "subscribe",
  "channel": "task:TSK-2024-001"
}

// 取消订阅
{
  "action": "unsubscribe",
  "channel": "task:TSK-2024-001"
}
\`\`\`

---

## 六、权限控制

### 6.1 角色定义

| 角色代码 | 角色名称 | 权限级别 |
|----------|----------|----------|
| admin | 系统管理员 | 0 (最高) |
| director | 实验室主管 | 1 |
| manager | 项目经理 | 2 |
| signer | 签字人 | 2 |
| engineer | 测试工程师 | 3 |
| reviewer | 审核员 | 3 |
| sample_admin | 样品管理员 | 4 |
| client | 客户 | 5 (最低) |

### 6.2 权限代码

\`\`\`
# 格式: 模块:操作
dashboard:view          # 查看仪表盘
project:view            # 查看项目
project:create          # 创建项目
project:edit            # 编辑项目
project:delete          # 删除项目
project:assign          # 分配项目成员
task:view               # 查看任务
task:create             # 创建任务
task:execute            # 执行任务
task:pause              # 暂停任务
task:cancel             # 取消任务
report:view             # 查看报告
report:create           # 创建报告
report:edit             # 编辑报告
report:review           # 审核报告
report:sign             # 签章报告
report:download         # 下载报告
sample:view             # 查看样品
sample:intake           # 样品入库
sample:checkout         # 样品领用
sample:return           # 样品归还
sample:scrap            # 样品报废
compliance:view         # 查看合规矩阵
compliance:edit         # 编辑合规项
compliance:approve      # 审批合规结果
knowledge:view          # 查看知识库
knowledge:create        # 创建文章
knowledge:edit          # 编辑文章
knowledge:delete        # 删除文章
settings:view           # 查看设置
settings:user_manage    # 用户管理
settings:hardware       # 硬件管理
settings:system         # 系统设置
\`\`\`

### 6.3 角色权限矩阵

参见 `docs/RBAC-DESIGN.md` 中的详细权限矩阵。

### 6.4 后端实现建议

\`\`\`java
// Spring Security 示例
@PreAuthorize("hasPermission('project', 'create')")
@PostMapping("/projects")
public ResponseEntity<Project> createProject(@RequestBody CreateProjectRequest request) {
    // ...
}

// 数据范围控制
@PreAuthorize("hasPermission('project', 'view')")
@GetMapping("/projects")
public ResponseEntity<Page<Project>> listProjects(
    @AuthenticationPrincipal User user,
    Pageable pageable
) {
    // 根据用户角色过滤数据
    if (user.getRole() == Role.CLIENT) {
        // 客户只能看到自己的项目
        return projectService.findByClient(user.getClientId(), pageable);
    } else if (user.getRole() == Role.ENGINEER) {
        // 工程师只能看到分配给自己的项目
        return projectService.findByMember(user.getId(), pageable);
    }
    // 管理员/主管可以看到所有项目
    return projectService.findAll(pageable);
}
\`\`\`

---

## 七、错误码定义

### 7.1 通用错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| 200 | 200 | 成功 |
| 400 | 400 | 请求参数错误 |
| 401 | 401 | 未认证 |
| 403 | 403 | 无权限 |
| 404 | 404 | 资源不存在 |
| 409 | 409 | 资源冲突 |
| 422 | 422 | 业务逻辑错误 |
| 429 | 429 | 请求过于频繁 |
| 500 | 500 | 服务器内部错误 |

### 7.2 业务错误码

| 错误码 | 说明 |
|--------|------|
| 10001 | 用户名或密码错误 |
| 10002 | 账户已被锁定 |
| 10003 | Token 已过期 |
| 10004 | 无效的 Token |
| 20001 | 项目不存在 |
| 20002 | 项目已完成，无法修改 |
| 20003 | 项目成员已存在 |
| 30001 | 任务不存在 |
| 30002 | 任务正在执行，无法删除 |
| 30003 | 任务已完成，无法重启 |
| 40001 | 报告不存在 |
| 40002 | 报告已签章，无法修改 |
| 40003 | 签章密码错误 |
| 50001 | 样品不存在 |
| 50002 | 样品已领用，无法重复领用 |
| 50003 | 样品不在库中，无法归还 |

---

## 附录

### A. 环境变量配置

\`\`\`env
# 数据库
DATABASE_URL=postgresql://user:pass@localhost:5432/security_lab
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=3600
JWT_REFRESH_EXPIRES_IN=604800

# 文件存储
STORAGE_TYPE=minio
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=security-lab

# WebSocket
WS_PING_INTERVAL=30000
WS_PING_TIMEOUT=10000

# 日志
LOG_LEVEL=info
LOG_FILE=/var/log/security-lab/app.log
\`\`\`

### B. 部署架构

\`\`\`
                    ┌─────────────┐
                    │   Nginx     │
                    │  (负载均衡)  │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
   ┌───────────┐     ┌───────────┐     ┌───────────┐
   │  API-1    │     │  API-2    │     │  API-3    │
   │ (业务服务) │     │ (业务服务) │     │ (业务服务) │
   └─────┬─────┘     └─────┬─────┘     └─────┬─────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
   ┌───────────┐     ┌───────────┐     ┌───────────┐
   │ PostgreSQL│     │   Redis   │     │   MinIO   │
   │  (主从)    │     │  (集群)   │     │  (集群)   │
   └───────────┘     └───────────┘     └───────────┘
\`\`\`

---

*文档版本: 1.0.0*
*最后更新: 2024年12月*
*汕头人工智能实验室*
