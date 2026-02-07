// API 类型定义 - 与后端接口对应

// 通用响应类型
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// 分页参数
export interface PaginationParams {
  page: number
  pageSize: number
}

// 分页响应
export interface PaginatedResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// ==================== 用户相关 ====================
export interface User {
  id: string
  name: string
  avatar?: string
  role: "admin" | "engineer" | "reviewer" | "auditor"
  status: "idle" | "busy" | "offline"
  email?: string
  department?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

// ==================== 项目相关 ====================
export type ProjectStatus = "pending" | "in_progress" | "completed" | "on_hold"

export interface Project {
  id: string
  name: string
  client: string
  status: ProjectStatus
  progress: number
  startDate: string
  deadline: string
  manager: string
  team: string[]
  description?: string
}

export interface ProjectListParams extends PaginationParams {
  status?: ProjectStatus
  keyword?: string
}

// ==================== 任务相关 ====================
export type TaskStatus = "running" | "paused" | "completed" | "queued" | "failed"

export interface Task {
  id: string
  name: string
  projectId: string
  projectName?: string
  status: TaskStatus
  progress: number
  stage: string
  startTime: string
  endTime?: string
  assignee?: string
}

export interface TaskDetail extends Task {
  logs: TaskLog[]
  vulnerabilities: Vulnerability[]
  assets: Asset[]
}

export interface TaskLog {
  timestamp: string
  level: "info" | "warning" | "error" | "success"
  message: string
}

export interface TaskListParams extends PaginationParams {
  status?: TaskStatus
  projectId?: string
  keyword?: string
}

// ==================== 漏洞相关 ====================
export type VulnerabilitySeverity = "critical" | "high" | "medium" | "low" | "info"

export interface Vulnerability {
  id: string
  name: string
  severity: VulnerabilitySeverity
  status: "open" | "confirmed" | "fixed" | "false_positive"
  target: string
  discoveredAt: string
  description?: string
  solution?: string
  cve?: string
}

// ==================== 资产相关 ====================
export interface Asset {
  id: string
  name: string
  type: "device" | "firmware" | "protocol" | "service" | "port"
  ip?: string
  mac?: string
  version?: string
  children?: Asset[]
}

// ==================== 合规相关 ====================
export type ComplianceStatus = "pass" | "fail" | "warning" | "pending"

export interface ComplianceItem {
  id: string
  clause: string
  requirement: string
  testItem: string
  autoResult: ComplianceStatus
  manualResult: ComplianceStatus
  evidence: string
  children?: ComplianceItem[]
}

export interface ComplianceUpdateRequest {
  itemId: string
  manualResult: ComplianceStatus
  evidence?: string
}

// ==================== 报告相关 ====================
export type ReportStatus = "draft" | "pending_review" | "approved" | "rejected" | "signed"

export interface Report {
  id: string
  title: string
  projectId: string
  projectName?: string
  version: string
  status: ReportStatus
  author: string
  authorId: string
  reviewer?: string
  reviewerId?: string
  createdAt: string
  updatedAt: string
  content?: ReportContent
}

// 报告内容结构
export interface ReportContent {
  template?: string
  metadata?: {
    version?: string
    created_at?: string
    last_modified?: string
    progress?: number
    rejection_reason?: string
  }
  sections: ReportSection[]
  statistics?: {
    findings: number
    critical: number
    high: number
    medium?: number
    low?: number
    all_resolved?: boolean
  }
}

// 报告章节
export interface ReportSection {
  id: string
  title: string
  level: number
  order: number
  type?: 'text' | 'vulnerability_list' | 'table'
  content?: string
  subsections?: ReportSection[]
  vulnerabilities?: ReportVulnerability[]
}

// 报告中的漏洞
export interface ReportVulnerability {
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  cvss: number
  description: string
  recommendation: string
  status?: 'open' | 'resolved'
}

export interface ReportAnnotation {
  id: string
  reportId: string
  sectionId: string
  content: string
  author: string
  authorId: string
  createdAt: string
  resolved: boolean
  replies?: ReportAnnotationReply[]
}

export interface ReportAnnotationReply {
  id: string
  content: string
  author: string
  authorId: string
  createdAt: string
}

export interface ReportListParams extends PaginationParams {
  status?: ReportStatus
  projectId?: string
  keyword?: string
}

export interface ReportReviewRequest {
  action: "approve" | "reject"
  comment?: string
}

export interface ReportSignRequest {
  password: string
}

// ==================== 样品相关 ====================
export type SampleStatus = "in_stock" | "in_use" | "returned" | "scrapped"

export interface Sample {
  id: string
  name: string
  model: string
  manufacturer: string
  status: SampleStatus
  location: string
  currentHolder?: string
  currentHolderId?: string
  projectId?: string
  projectName?: string
  inDate: string
  outDate?: string
  lastUpdated: string
  serialNumber?: string
  description?: string
  qrCode?: string
}

export interface SampleFlow {
  id: string
  sampleId: string
  action: "in" | "out" | "transfer" | "return" | "scrap"
  operator: string
  operatorId: string
  fromLocation?: string
  toLocation?: string
  reason?: string
  timestamp: string
}

export interface SampleDetail extends Sample {
  flows: SampleFlow[]
}

export interface SampleListParams extends PaginationParams {
  status?: SampleStatus
  location?: string
  keyword?: string
}

export interface SampleIntakeRequest {
  name: string
  model: string
  manufacturer: string
  serialNumber?: string
  location: string
  description?: string
}

export interface SampleCheckoutRequest {
  sampleId: string
  projectId: string
  reason: string
}

export interface SampleReturnRequest {
  sampleId: string
  location: string
  condition?: string
}

// ==================== 仪表盘相关 ====================
export interface DashboardStats {
  projectsInProgress: number
  projectsTrend: number
  pendingReports: number
  reportsTrend: number
  samplesToday: number
  samplesTrend: number
  abnormalDevices: number
}

export interface HeatmapData {
  date: string
  value: number
}

export interface VulnerabilityTrendData {
  date: string
  critical: number
  high: number
  medium: number
  low: number
}

export interface TodoItem {
  id: string
  title: string
  description: string
  type: "review" | "task" | "sample" | "meeting"
  priority: "high" | "medium" | "low"
  dueDate?: string
  completed: boolean
}

// ==================== 通知相关 ====================
export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "error" | "success"
  timestamp: string
  read: boolean
  link?: string
}

// ==================== 硬件探针相关 ====================
export type ProbeStatus = "online" | "offline" | "warning"

export interface HardwareStatus {
  wifi: ProbeStatus
  ble: ProbeStatus
  zigbee: ProbeStatus
}

// ==================== Fuzzing 相关 ====================
export interface FuzzingStats {
  execSpeed: number
  totalExecs: number
  coverage: number
  crashes: number
  hangs: number
  uniqueCrashes: number
}

export interface FuzzingCoverage {
  time: string
  coverage: number
}

// ==================== 网络拓扑相关 ====================
export interface TopologyNode {
  id: string
  label: string
  type: "router" | "switch" | "device" | "target" | "attacker"
  ip?: string
  x?: number
  y?: number
}

export interface TopologyEdge {
  id: string
  source: string
  target: string
  traffic?: number
  status?: "active" | "inactive" | "attacking"
}

export interface NetworkTopology {
  nodes: TopologyNode[]
  edges: TopologyEdge[]
}

// ==================== 知识库相关 ====================
export type ArticleType = "article" | "video" | "document"

export interface Article {
  id: string
  title: string
  content: string
  summary: string
  category: string
  categoryName: string
  type: ArticleType
  views: number
  createdAt: string
  updatedAt: string
  author: string
  authorId: string
  starred: boolean
  tags: string[]
  attachments?: ArticleAttachment[]
}

export interface ArticleAttachment {
  id: string
  name: string
  url: string
  size: number
  type: string
}

export interface KnowledgeCategory {
  id: string
  name: string
  icon: string
  count: number
  parentId?: string
  children?: KnowledgeCategory[]
}

export interface ArticleListParams extends PaginationParams {
  category?: string
  type?: ArticleType
  keyword?: string
  starred?: boolean
}

export interface CreateArticleRequest {
  title: string
  content: string
  summary: string
  category: string
  type: ArticleType
  tags: string[]
}

export interface UpdateArticleRequest extends Partial<CreateArticleRequest> {
  id: string
}

export interface ReadingHistory {
  articleId: string
  articleTitle: string
  readAt: string
}
