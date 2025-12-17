# 角色权限设计文档

> 汕头人工智能实验室 - 网络测试平台

## 一、设计概述

本系统采用 **RBAC (Role-Based Access Control)** 基于角色的访问控制模型，实现细粒度的权限管理。

### 核心设计原则

| 原则 | 说明 |
|------|------|
| **最小权限** | 用户只拥有完成工作所需的最少权限 |
| **职责分离** | 关键操作需要多角色协作（如报告需工程师编写 → 审核员审核 → 签字人签章） |
| **层级管理** | 高级角色可管理低级角色（管理员 > 主管 > 经理 > 工程师） |
| **可审计** | 所有权限操作均有日志记录 |

---

## 二、角色定义

### 2.1 角色层级图

\`\`\`
                    ┌─────────────┐
                    │   admin     │  Level 0 - 系统管理员
                    │  系统管理员  │  最高权限
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │  director   │ │   signer    │ │   manager   │  Level 1-2
    │  实验室主管  │ │   签字人    │ │  项目经理   │  管理层
    └──────┬──────┘ └─────────────┘ └──────┬──────┘
           │                               │
    ┌──────▼──────┐                 ┌──────▼──────┐
    │  engineer   │                 │  reviewer   │  Level 3
    │  测试工程师  │                 │   审核员    │  执行层
    └──────┬──────┘                 └─────────────┘
           │
    ┌──────▼──────┐
    │ sample_admin│  Level 4 - 样品管理员
    │  样品管理员  │  专项职能
    └─────────────┘
           
    ┌─────────────┐
    │   client    │  Level 5 - 客户
    │    客户     │  外部只读
    └─────────────┘
\`\`\`

### 2.2 角色详细说明

| 角色 ID | 角色名称 | 权限等级 | 职责描述 |
|---------|---------|---------|---------|
| `admin` | 系统管理员 | 0 | 系统最高权限，可管理所有功能、用户、系统配置 |
| `director` | 实验室主管 | 1 | 实验室负责人，可审批项目、签章报告、管理硬件 |
| `manager` | 项目经理 | 2 | 负责项目管理、任务分配、资源调度 |
| `signer` | 签字人 | 2 | CMA/CNAS 授权签字人，负责报告电子签章 |
| `engineer` | 测试工程师 | 3 | 执行检测任务、编写报告、填写合规证据 |
| `reviewer` | 审核员 | 3 | 负责报告技术审核、合规审批 |
| `sample_admin` | 样品管理员 | 4 | 负责样品出入库、流转管理 |
| `client` | 客户 | 5 | 外部客户，只读访问自己的项目和报告 |

---

## 三、权限定义

### 3.1 权限命名规范

\`\`\`
{模块}:{操作}

示例：
- project:view    - 查看项目
- project:create  - 创建项目
- report:sign     - 签章报告
\`\`\`

### 3.2 完整权限列表

#### 仪表盘模块
| 权限 | 说明 |
|------|------|
| `dashboard:view` | 查看仪表盘 |

#### 项目模块
| 权限 | 说明 |
|------|------|
| `project:view` | 查看项目列表和详情 |
| `project:create` | 创建新项目 |
| `project:edit` | 编辑项目信息 |
| `project:delete` | 删除项目 |
| `project:assign` | 分配项目成员 |

#### 任务模块
| 权限 | 说明 |
|------|------|
| `task:view` | 查看任务列表和详情 |
| `task:create` | 创建检测任务 |
| `task:execute` | 执行/启动任务 |
| `task:pause` | 暂停任务 |
| `task:cancel` | 取消/终止任务 |

#### 报告模块
| 权限 | 说明 |
|------|------|
| `report:view` | 查看报告 |
| `report:create` | 创建报告 |
| `report:edit` | 编辑报告内容 |
| `report:review` | 审核报告（批注、驳回、通过） |
| `report:sign` | 电子签章 |
| `report:download` | 下载报告 |

#### 样品模块
| 权限 | 说明 |
|------|------|
| `sample:view` | 查看样品信息 |
| `sample:intake` | 样品入库 |
| `sample:checkout` | 样品领用 |
| `sample:return` | 样品归还 |
| `sample:scrap` | 样品报废 |

#### 合规模块
| 权限 | 说明 |
|------|------|
| `compliance:view` | 查看合规矩阵 |
| `compliance:edit` | 编辑合规条款判定 |
| `compliance:approve` | 审批合规结果 |

#### 知识库模块
| 权限 | 说明 |
|------|------|
| `knowledge:view` | 查看知识库文章 |
| `knowledge:create` | 创建文章 |
| `knowledge:edit` | 编辑文章 |
| `knowledge:delete` | 删除文章 |

#### 设置模块
| 权限 | 说明 |
|------|------|
| `settings:view` | 查看设置页面 |
| `settings:user_manage` | 用户管理（CRUD） |
| `settings:hardware` | 硬件设备管理 |
| `settings:system` | 系统配置 |

---

## 四、角色权限矩阵

| 权限 | admin | director | manager | engineer | reviewer | signer | sample_admin | client |
|------|:-----:|:--------:|:-------:|:--------:|:--------:|:------:|:------------:|:------:|
| **仪表盘** |
| dashboard:view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **项目** |
| project:view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| project:create | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| project:edit | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| project:delete | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| project:assign | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **任务** |
| task:view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| task:create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| task:execute | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| task:pause | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| task:cancel | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **报告** |
| report:view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| report:create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| report:edit | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| report:review | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| report:sign | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| report:download | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| **样品** |
| sample:view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| sample:intake | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| sample:checkout | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| sample:return | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| sample:scrap | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **合规** |
| compliance:view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| compliance:edit | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| compliance:approve | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **知识库** |
| knowledge:view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| knowledge:create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| knowledge:edit | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| knowledge:delete | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **设置** |
| settings:view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| settings:user_manage | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| settings:hardware | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| settings:system | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 五、技术实现

### 5.1 文件结构

\`\`\`
lib/auth/
├── types.ts      # 类型定义（角色、权限、用户）
├── context.tsx   # AuthProvider 和 useAuth Hook
├── hooks.ts      # 权限检查 Hooks
├── components.tsx # 权限控制组件
└── index.ts      # 统一导出
\`\`\`

### 5.2 核心 API

#### AuthProvider
\`\`\`tsx
<AuthProvider>
  <App />
</AuthProvider>
\`\`\`

#### useAuth Hook
\`\`\`tsx
const { 
  user,                // 当前用户
  isAuthenticated,     // 是否已登录
  hasPermission,       // 检查单个权限
  hasAnyPermission,    // 检查任一权限
  hasAllPermissions,   // 检查全部权限
  hasRole,             // 检查角色
  login,               // 登录
  logout               // 登出
} = useAuth()
\`\`\`

#### 权限检查组件
\`\`\`tsx
// 按权限显示/隐藏
<PermissionGate permission="report:sign">
  <SignButton />
</PermissionGate>

// 按角色显示/隐藏
<RoleGate roles={["admin", "director"]}>
  <AdminPanel />
</RoleGate>

// 无权限时显示替代内容
<PermissionGate 
  permission="project:delete" 
  fallback={<span>无权限</span>}
>
  <DeleteButton />
</PermissionGate>
\`\`\`

### 5.3 使用示例

#### 条件渲染按钮
\`\`\`tsx
function ReportActions() {
  const { hasPermission } = useAuth()
  
  return (
    <div>
      {hasPermission("report:edit") && (
        <Button>编辑</Button>
      )}
      {hasPermission("report:review") && (
        <Button>审核</Button>
      )}
      {hasPermission("report:sign") && (
        <Button>签章</Button>
      )}
    </div>
  )
}
\`\`\`

#### 路由守卫
\`\`\`tsx
function ProtectedPage() {
  const { hasPermission } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!hasPermission("settings:user_manage")) {
      router.push("/403")
    }
  }, [])
  
  return <UserManagement />
}
\`\`\`

---

## 六、业务流程权限控制

### 6.1 报告审批流程

\`\`\`
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  engineer   │ ──► │  reviewer   │ ──► │   signer    │ ──► │   完成      │
│  编写报告   │     │  技术审核   │     │  电子签章   │     │             │
│ report:edit │     │report:review│     │ report:sign │     │             │
└─────────────┘     └──────┬──────┘     └─────────────┘     └─────────────┘
                           │
                           ▼ 驳回
                    ┌─────────────┐
                    │  engineer   │
                    │  修改报告   │
                    └─────────────┘
\`\`\`

### 6.2 样品流转流程

\`\`\`
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│sample_admin │ ──► │  engineer   │ ──► │  engineer   │ ──► │sample_admin │
│   入库      │     │   领用      │     │   归还      │     │   确认      │
│sample:intake│     │sample:checkout│   │sample:return│     │sample:return│
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
\`\`\`

---

## 七、扩展设计

### 7.1 多角色支持

用户可以同时拥有多个角色：

\`\`\`typescript
interface AuthUser {
  role: UserRole      // 主角色
  roles?: UserRole[]  // 附加角色（可选）
}

// 权限计算：取所有角色权限的并集
\`\`\`

### 7.2 数据范围控制（未来扩展）

\`\`\`typescript
type DataScope = 
  | "all"           // 全部数据
  | "department"    // 本部门数据
  | "self"          // 仅自己的数据

// 示例：工程师只能看到分配给自己的任务
\`\`\`

### 7.3 临时授权（未来扩展）

\`\`\`typescript
interface TemporaryPermission {
  userId: string
  permission: Permission
  grantedBy: string
  expiresAt: Date
  reason: string
}
\`\`\`

---

## 八、安全考虑

1. **前端权限控制仅用于 UI 显示**，真正的安全控制必须在后端 API 层实现
2. **Token 验证**：每个 API 请求都应验证用户 Token 和权限
3. **操作日志**：所有敏感操作（如签章、删除）都应记录审计日志
4. **会话管理**：支持单点登录、会话超时、强制下线
5. **密码策略**：强密码要求、定期更换、登录失败锁定
