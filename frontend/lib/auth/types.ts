// 用户角色权限系统 - 类型定义

// ==================== 角色定义 ====================
export type UserRole =
  | "admin" // 系统管理员 - 最高权限
  | "director" // 实验室主管 - 审批、签章权限
  | "manager" // 项目经理 - 项目管理、资源调度
  | "engineer" // 测试工程师 - 执行检测任务
  | "reviewer" // 审核员 - 报告审核
  | "signer" // 签字人 - 电子签章
  | "sample_admin" // 样品管理员 - 样品出入库
  | "client" // 客户 - 只读门户访问

// ==================== 权限定义 ====================
export type Permission =
  // 仪表盘
  | "dashboard:view"
  // 项目
  | "project:view"
  | "project:create"
  | "project:edit"
  | "project:delete"
  | "project:assign"
  // 任务
  | "task:view"
  | "task:create"
  | "task:execute"
  | "task:pause"
  | "task:cancel"
  // 报告
  | "report:view"
  | "report:create"
  | "report:edit"
  | "report:review"
  | "report:sign"
  | "report:download"
  // 样品
  | "sample:view"
  | "sample:intake"
  | "sample:checkout"
  | "sample:return"
  | "sample:scrap"
  // 合规
  | "compliance:view"
  | "compliance:edit"
  | "compliance:approve"
  // 知识库
  | "knowledge:view"
  | "knowledge:create"
  | "knowledge:edit"
  | "knowledge:delete"
  // 设置
  | "settings:view"
  | "settings:user_manage"
  | "settings:hardware"
  | "settings:system"

// ==================== 角色权限映射 ====================
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // 管理员拥有所有权限
    "dashboard:view",
    "project:view",
    "project:create",
    "project:edit",
    "project:delete",
    "project:assign",
    "task:view",
    "task:create",
    "task:execute",
    "task:pause",
    "task:cancel",
    "report:view",
    "report:create",
    "report:edit",
    "report:review",
    "report:sign",
    "report:download",
    "sample:view",
    "sample:intake",
    "sample:checkout",
    "sample:return",
    "sample:scrap",
    "compliance:view",
    "compliance:edit",
    "compliance:approve",
    "knowledge:view",
    "knowledge:create",
    "knowledge:edit",
    "knowledge:delete",
    "settings:view",
    "settings:user_manage",
    "settings:hardware",
    "settings:system",
  ],
  director: [
    "dashboard:view",
    "project:view",
    "project:create",
    "project:edit",
    "project:assign",
    "task:view",
    "task:create",
    "task:execute",
    "task:pause",
    "task:cancel",
    "report:view",
    "report:create",
    "report:edit",
    "report:review",
    "report:sign",
    "report:download",
    "sample:view",
    "sample:checkout",
    "sample:return",
    "compliance:view",
    "compliance:edit",
    "compliance:approve",
    "knowledge:view",
    "knowledge:create",
    "knowledge:edit",
    "settings:view",
    "settings:hardware",
  ],
  manager: [
    "dashboard:view",
    "project:view",
    "project:create",
    "project:edit",
    "project:assign",
    "task:view",
    "task:create",
    "report:view",
    "report:create",
    "report:download",
    "sample:view",
    "sample:checkout",
    "sample:return",
    "compliance:view",
    "knowledge:view",
    "knowledge:create",
    "settings:view",
  ],
  engineer: [
    "dashboard:view",
    "project:view",
    "task:view",
    "task:create",
    "task:execute",
    "task:pause",
    "task:cancel",
    "report:view",
    "report:create",
    "report:edit",
    "sample:view",
    "sample:checkout",
    "sample:return",
    "compliance:view",
    "compliance:edit",
    "knowledge:view",
    "knowledge:create",
    "knowledge:edit",
    "settings:view",
  ],
  reviewer: [
    "dashboard:view",
    "project:view",
    "task:view",
    "report:view",
    "report:review",
    "report:download",
    "sample:view",
    "compliance:view",
    "compliance:approve",
    "knowledge:view",
    "settings:view",
  ],
  signer: [
    "dashboard:view",
    "project:view",
    "task:view",
    "report:view",
    "report:sign",
    "report:download",
    "sample:view",
    "compliance:view",
    "knowledge:view",
    "settings:view",
  ],
  sample_admin: [
    "dashboard:view",
    "project:view",
    "sample:view",
    "sample:intake",
    "sample:checkout",
    "sample:return",
    "sample:scrap",
    "knowledge:view",
    "settings:view",
  ],
  client: ["project:view", "report:view", "report:download", "sample:view"],
}

// ==================== 角色元数据 ====================
export interface RoleMeta {
  name: string
  description: string
  level: number // 权限等级，数字越小权限越高
  color: string
}

export const ROLE_META: Record<UserRole, RoleMeta> = {
  admin: {
    name: "系统管理员",
    description: "系统最高权限，可管理所有功能和用户",
    level: 0,
    color: "bg-red-500",
  },
  director: {
    name: "实验室主管",
    description: "实验室负责人，可审批报告和签章",
    level: 1,
    color: "bg-purple-500",
  },
  manager: {
    name: "项目经理",
    description: "负责项目管理和资源调度",
    level: 2,
    color: "bg-blue-500",
  },
  engineer: {
    name: "测试工程师",
    description: "执行检测任务，编写报告",
    level: 3,
    color: "bg-green-500",
  },
  reviewer: {
    name: "审核员",
    description: "负责报告技术审核",
    level: 3,
    color: "bg-yellow-500",
  },
  signer: {
    name: "签字人",
    description: "授权签字人，负责报告签章",
    level: 2,
    color: "bg-orange-500",
  },
  sample_admin: {
    name: "样品管理员",
    description: "负责样品出入库管理",
    level: 4,
    color: "bg-cyan-500",
  },
  client: {
    name: "客户",
    description: "外部客户，只读访问项目和报告",
    level: 5,
    color: "bg-gray-500",
  },
}

// ==================== 用户类型扩展 ====================
export interface AuthUser {
  id: string
  name: string
  email: string
  avatar?: string
  role: UserRole
  roles?: UserRole[] // 支持多角色
  department?: string
  status: "active" | "inactive" | "locked"
  lastLogin?: string
  createdAt: string
}

// ==================== 路由权限映射 ====================
export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  "/dashboard": ["dashboard:view"],
  "/projects": ["project:view"],
  "/projects/new": ["project:create"],
  "/tasks": ["task:view"],
  "/tasks/new": ["task:create"],
  "/reports": ["report:view"],
  "/reports/new": ["report:create"],
  "/samples": ["sample:view"],
  "/samples/intake": ["sample:intake"],
  "/knowledge": ["knowledge:view"],
  "/knowledge/new": ["knowledge:create"],
  "/settings": ["settings:view"],
  "/settings/users": ["settings:user_manage"],
  "/settings/hardware": ["settings:hardware"],
}
