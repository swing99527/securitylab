// 模拟数据 - 开发环境使用，生产环境替换为真实API调用

import type {
  Task,
  Project,
  Report,
  Sample,
  SampleFlow,
  ComplianceItem,
  DashboardStats,
  HeatmapData,
  VulnerabilityTrendData,
  TodoItem,
  Notification,
  Vulnerability,
  Asset,
  TaskLog,
  FuzzingStats,
  FuzzingCoverage,
  NetworkTopology,
  ReportAnnotation,
  KnowledgeCategory,
  Article,
  ReadingHistory,
} from "./types"

// ==================== 任务数据 ====================
export const mockTasks: Task[] = [
  {
    id: "TSK-2024-001",
    name: "智能门锁固件安全检测",
    projectId: "PRJ-2024-001",
    projectName: "智能门锁安全评估",
    status: "running",
    progress: 65,
    stage: "漏洞扫描",
    startTime: "2024-12-15 09:30",
  },
  {
    id: "TSK-2024-002",
    name: "工业网关渗透测试",
    projectId: "PRJ-2024-002",
    projectName: "工业网关安全检测",
    status: "paused",
    progress: 30,
    stage: "端口扫描",
    startTime: "2024-12-15 08:00",
  },
  {
    id: "TSK-2024-003",
    name: "车载T-Box协议分析",
    projectId: "PRJ-2024-003",
    projectName: "车载系统安全评估",
    status: "completed",
    progress: 100,
    stage: "完成",
    startTime: "2024-12-14 14:00",
  },
  {
    id: "TSK-2024-004",
    name: "智能摄像头固件解包",
    projectId: "PRJ-2024-004",
    projectName: "摄像头安全检测",
    status: "queued",
    progress: 0,
    stage: "等待中",
    startTime: "-",
  },
]

// ==================== 项目数据 ====================
export const mockProjects: Project[] = [
  {
    id: "PRJ-2024-001",
    name: "智能门锁安全评估",
    client: "安防科技有限公司",
    status: "in_progress",
    progress: 65,
    startDate: "2024-12-01",
    deadline: "2024-12-31",
    manager: "张工程师",
    team: ["张工程师", "李测试", "王分析师"],
  },
  {
    id: "PRJ-2024-002",
    name: "工业网关安全检测",
    client: "工控集团",
    status: "in_progress",
    progress: 30,
    startDate: "2024-12-05",
    deadline: "2025-01-15",
    manager: "王工程师",
    team: ["王工程师", "陈测试"],
  },
  {
    id: "PRJ-2024-003",
    name: "车载系统安全评估",
    client: "汽车科技",
    status: "completed",
    progress: 100,
    startDate: "2024-11-15",
    deadline: "2024-12-15",
    manager: "陈工程师",
    team: ["陈工程师", "刘测试", "赵分析师"],
  },
]

// ==================== 报告数据 ====================
export const mockReports: Report[] = [
  {
    id: "RPT-2024-001",
    title: "智能门锁安全检测报告",
    projectId: "PRJ-2024-001",
    projectName: "智能门锁安全评估",
    version: "v1.2",
    status: "pending_review",
    author: "张工程师",
    authorId: "user-001",
    reviewer: "李审核员",
    reviewerId: "user-002",
    createdAt: "2024-12-10",
    updatedAt: "2024-12-15",
  },
  {
    id: "RPT-2024-002",
    title: "车载网关渗透测试报告",
    projectId: "PRJ-2024-002",
    projectName: "工业网关安全检测",
    version: "v1.0",
    status: "draft",
    author: "王工程师",
    authorId: "user-003",
    createdAt: "2024-12-12",
    updatedAt: "2024-12-14",
  },
  {
    id: "RPT-2024-003",
    title: "工业控制器固件分析报告",
    projectId: "PRJ-2024-003",
    projectName: "车载系统安全评估",
    version: "v2.1",
    status: "approved",
    author: "陈工程师",
    authorId: "user-004",
    reviewer: "李审核员",
    reviewerId: "user-002",
    createdAt: "2024-12-05",
    updatedAt: "2024-12-13",
  },
  {
    id: "RPT-2024-004",
    title: "智能摄像头安全评估报告",
    projectId: "PRJ-2024-004",
    projectName: "摄像头安全检测",
    version: "v1.1",
    status: "rejected",
    author: "张工程师",
    authorId: "user-001",
    reviewer: "王主管",
    reviewerId: "user-005",
    createdAt: "2024-12-08",
    updatedAt: "2024-12-12",
  },
  {
    id: "RPT-2024-005",
    title: "医疗设备通信安全报告",
    projectId: "PRJ-2024-005",
    projectName: "医疗设备检测",
    version: "v1.0",
    status: "signed",
    author: "李工程师",
    authorId: "user-006",
    reviewer: "王主管",
    reviewerId: "user-005",
    createdAt: "2024-11-28",
    updatedAt: "2024-12-10",
  },
]

// ==================== 报告批注数据 ====================
export const mockAnnotations: ReportAnnotation[] = [
  {
    id: "ann-001",
    reportId: "RPT-2024-001",
    sectionId: "section-2",
    content: "这里的漏洞等级描述需要更加详细，建议补充CVE编号和影响范围",
    author: "李审核员",
    authorId: "user-002",
    createdAt: "2024-12-15 10:30",
    resolved: false,
    replies: [
      {
        id: "reply-001",
        content: "好的，我会补充CVE-2024-1234的相关信息",
        author: "张工程师",
        authorId: "user-001",
        createdAt: "2024-12-15 11:00",
      },
    ],
  },
  {
    id: "ann-002",
    reportId: "RPT-2024-001",
    sectionId: "section-3",
    content: "测试方法章节缺少具体的测试工具版本信息",
    author: "李审核员",
    authorId: "user-002",
    createdAt: "2024-12-15 10:45",
    resolved: true,
    replies: [],
  },
  {
    id: "ann-003",
    reportId: "RPT-2024-001",
    sectionId: "section-4",
    content: "建议在结论部分增加风险等级汇总表",
    author: "王主管",
    authorId: "user-005",
    createdAt: "2024-12-15 14:20",
    resolved: false,
    replies: [],
  },
]

// ==================== 样品数据 ====================
export const mockSamples: Sample[] = [
  {
    id: "SPL-2024-001",
    name: "智能门锁主控板",
    model: "SL-200A",
    manufacturer: "安防科技",
    status: "in_use",
    location: "屏蔽室A",
    currentHolder: "张工程师",
    currentHolderId: "user-001",
    projectId: "PRJ-2024-001",
    projectName: "智能门锁安全评估",
    inDate: "2024-12-01",
    lastUpdated: "2024-12-15",
    serialNumber: "SN-20241201-001",
  },
  {
    id: "SPL-2024-002",
    name: "车载网关模块",
    model: "VG-100",
    manufacturer: "车联智能",
    status: "in_stock",
    location: "样品库A-03",
    inDate: "2024-12-05",
    lastUpdated: "2024-12-05",
    serialNumber: "SN-20241205-002",
  },
  {
    id: "SPL-2024-003",
    name: "工业控制器",
    model: "IC-500",
    manufacturer: "工控科技",
    status: "in_use",
    location: "测试台3",
    currentHolder: "王工程师",
    currentHolderId: "user-003",
    projectId: "PRJ-2024-003",
    projectName: "车载系统安全评估",
    inDate: "2024-11-20",
    lastUpdated: "2024-12-10",
    serialNumber: "SN-20241120-003",
  },
  {
    id: "SPL-2024-004",
    name: "智能摄像头",
    model: "CAM-HD200",
    manufacturer: "视讯科技",
    status: "returned",
    location: "待出库区",
    inDate: "2024-11-15",
    lastUpdated: "2024-12-12",
    serialNumber: "SN-20241115-004",
  },
  {
    id: "SPL-2024-005",
    name: "医疗监护仪",
    model: "MED-100",
    manufacturer: "医疗设备",
    status: "scrapped",
    location: "报废区",
    inDate: "2024-10-01",
    lastUpdated: "2024-12-01",
    serialNumber: "SN-20241001-005",
  },
]

// ==================== 样品流转记录 ====================
export const mockSampleFlows: SampleFlow[] = [
  {
    id: "flow-001",
    sampleId: "SPL-2024-001",
    action: "in",
    operator: "库管员",
    operatorId: "user-010",
    toLocation: "样品库A-01",
    reason: "新样品入库",
    timestamp: "2024-12-01 09:00",
  },
  {
    id: "flow-002",
    sampleId: "SPL-2024-001",
    action: "out",
    operator: "张工程师",
    operatorId: "user-001",
    fromLocation: "样品库A-01",
    toLocation: "屏蔽室A",
    reason: "项目检测需要",
    timestamp: "2024-12-05 10:30",
  },
  {
    id: "flow-003",
    sampleId: "SPL-2024-001",
    action: "transfer",
    operator: "张工程师",
    operatorId: "user-001",
    fromLocation: "屏蔽室A",
    toLocation: "测试台2",
    reason: "更换测试环境",
    timestamp: "2024-12-10 14:00",
  },
]

// ==================== 合规数据 ====================
export const mockComplianceData: ComplianceItem[] = [
  {
    id: "5",
    clause: "5",
    requirement: "安全要求",
    testItem: "-",
    autoResult: "pending",
    manualResult: "pending",
    evidence: "",
    children: [
      {
        id: "5.1",
        clause: "5.1",
        requirement: "访问控制",
        testItem: "-",
        autoResult: "pending",
        manualResult: "pending",
        evidence: "",
        children: [
          {
            id: "5.1.1",
            clause: "5.1.1",
            requirement: "密码应当具有足够的复杂度，包含大小写字母、数字和特殊字符",
            testItem: "Brute Force Test",
            autoResult: "pass",
            manualResult: "pass",
            evidence: "测试结果显示密码策略符合要求",
          },
          {
            id: "5.1.2",
            clause: "5.1.2",
            requirement: "应限制连续错误登录尝试次数，并在超过限制后锁定账户",
            testItem: "Login Lockout Test",
            autoResult: "pass",
            manualResult: "pass",
            evidence: "5次错误后账户锁定30分钟",
          },
          {
            id: "5.1.3",
            clause: "5.1.3",
            requirement: "默认凭证应当在首次使用时强制更改",
            testItem: "Default Credential Test",
            autoResult: "fail",
            manualResult: "pending",
            evidence: "",
          },
        ],
      },
      {
        id: "5.2",
        clause: "5.2",
        requirement: "数据保护",
        testItem: "-",
        autoResult: "pending",
        manualResult: "pending",
        evidence: "",
        children: [
          {
            id: "5.2.1",
            clause: "5.2.1",
            requirement: "敏感数据应当使用加密存储",
            testItem: "Storage Encryption Test",
            autoResult: "pass",
            manualResult: "pass",
            evidence: "使用AES-256加密",
          },
          {
            id: "5.2.2",
            clause: "5.2.2",
            requirement: "数据传输应当使用TLS 1.2或更高版本",
            testItem: "TLS Version Test",
            autoResult: "warning",
            manualResult: "pending",
            evidence: "检测到TLS 1.1仍然启用",
          },
        ],
      },
      {
        id: "5.3",
        clause: "5.3",
        requirement: "软件更新",
        testItem: "-",
        autoResult: "pending",
        manualResult: "pending",
        evidence: "",
        children: [
          {
            id: "5.3.1",
            clause: "5.3.1",
            requirement: "应提供安全的软件更新机制",
            testItem: "Update Mechanism Test",
            autoResult: "pass",
            manualResult: "pass",
            evidence: "支持签名验证的OTA更新",
          },
          {
            id: "5.3.2",
            clause: "5.3.2",
            requirement: "更新包应当经过数字签名验证",
            testItem: "Signature Verification Test",
            autoResult: "pass",
            manualResult: "pass",
            evidence: "RSA-2048签名验证通过",
          },
        ],
      },
    ],
  },
  {
    id: "6",
    clause: "6",
    requirement: "隐私要求",
    testItem: "-",
    autoResult: "pending",
    manualResult: "pending",
    evidence: "",
    children: [
      {
        id: "6.1",
        clause: "6.1",
        requirement: "个人数据收集最小化",
        testItem: "Data Minimization Audit",
        autoResult: "warning",
        manualResult: "pending",
        evidence: "发现收集了非必要的设备信息",
      },
    ],
  },
]

// ==================== 仪表盘数据 ====================
export const mockDashboardStats: DashboardStats = {
  projectsInProgress: 12,
  projectsTrend: 8,
  pendingReports: 5,
  reportsTrend: -2,
  samplesToday: 8,
  samplesTrend: 15,
  abnormalDevices: 2,
}

export const mockHeatmapData: HeatmapData[] = Array.from({ length: 365 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - (365 - i))
  return {
    date: date.toISOString().split("T")[0],
    value: Math.floor(Math.random() * 10),
  }
})

export const mockVulnerabilityTrend: VulnerabilityTrendData[] = [
  { date: "12/09", critical: 2, high: 5, medium: 8, low: 12 },
  { date: "12/10", critical: 1, high: 6, medium: 10, low: 15 },
  { date: "12/11", critical: 3, high: 4, medium: 7, low: 11 },
  { date: "12/12", critical: 2, high: 7, medium: 9, low: 14 },
  { date: "12/13", critical: 1, high: 5, medium: 11, low: 16 },
  { date: "12/14", critical: 4, high: 8, medium: 6, low: 10 },
  { date: "12/15", critical: 2, high: 6, medium: 8, low: 13 },
]

export const mockTodoItems: TodoItem[] = [
  {
    id: "todo-001",
    title: "审核智能门锁检测报告",
    description: "RPT-2024-001 待审核",
    type: "review",
    priority: "high",
    dueDate: "2024-12-16",
    completed: false,
  },
  {
    id: "todo-002",
    title: "完成车载网关渗透测试",
    description: "TSK-2024-002 进度30%",
    type: "task",
    priority: "medium",
    dueDate: "2024-12-20",
    completed: false,
  },
  {
    id: "todo-003",
    title: "样品归还确认",
    description: "SPL-2024-004 待归还",
    type: "sample",
    priority: "low",
    dueDate: "2024-12-18",
    completed: false,
  },
]

// ==================== 通知数据 ====================
export const mockNotifications: Notification[] = [
  {
    id: "notif-001",
    title: "扫描完成",
    message: "项目 PRJ-2024-001 端口扫描已完成",
    type: "success",
    timestamp: "2024-12-15 10:30",
    read: false,
    link: "/tasks/TSK-2024-001",
  },
  {
    id: "notif-002",
    title: "待审核",
    message: "有 3 份报告等待您的审核",
    type: "warning",
    timestamp: "2024-12-15 09:00",
    read: false,
    link: "/reports",
  },
  {
    id: "notif-003",
    title: "设备异常",
    message: "BLE探针连接中断，请检查",
    type: "error",
    timestamp: "2024-12-15 08:45",
    read: true,
  },
]

// ==================== 漏洞数据 ====================
export const mockVulnerabilities: Vulnerability[] = [
  {
    id: "vuln-001",
    name: "弱密码策略",
    severity: "high",
    status: "open",
    target: "192.168.1.100:80",
    discoveredAt: "2024-12-15 10:30",
    description: "目标系统允许使用弱密码",
    cve: "CVE-2024-1234",
  },
  {
    id: "vuln-002",
    name: "未加密通信",
    severity: "critical",
    status: "confirmed",
    target: "192.168.1.100:8080",
    discoveredAt: "2024-12-15 10:35",
    description: "发现未加密的HTTP通信",
  },
  {
    id: "vuln-003",
    name: "过期SSL证书",
    severity: "medium",
    status: "open",
    target: "192.168.1.100:443",
    discoveredAt: "2024-12-15 10:40",
  },
]

// ==================== 资产树数据 ====================
export const mockAssets: Asset[] = [
  {
    id: "asset-001",
    name: "智能门锁设备",
    type: "device",
    ip: "192.168.1.100",
    children: [
      {
        id: "asset-002",
        name: "固件 v2.1.0",
        type: "firmware",
        version: "2.1.0",
      },
      {
        id: "asset-003",
        name: "BLE 服务",
        type: "service",
        children: [
          { id: "asset-004", name: "认证服务", type: "service" },
          { id: "asset-005", name: "配置服务", type: "service" },
        ],
      },
      {
        id: "asset-006",
        name: "HTTP 服务",
        type: "service",
        children: [
          { id: "asset-007", name: "端口 80", type: "port" },
          { id: "asset-008", name: "端口 8080", type: "port" },
        ],
      },
    ],
  },
]

// ==================== 任务日志数据 ====================
export const mockTaskLogs: TaskLog[] = [
  { timestamp: "2024-12-15 09:30:00", level: "info", message: "[*] 初始化扫描引擎..." },
  { timestamp: "2024-12-15 09:30:01", level: "info", message: "[*] 目标: 192.168.1.100" },
  { timestamp: "2024-12-15 09:30:02", level: "info", message: "[*] 开始端口扫描..." },
  { timestamp: "2024-12-15 09:30:05", level: "success", message: "[+] 发现开放端口: 22 (SSH)" },
  { timestamp: "2024-12-15 09:30:06", level: "success", message: "[+] 发现开放端口: 80 (HTTP)" },
  { timestamp: "2024-12-15 09:30:07", level: "success", message: "[+] 发现开放端口: 443 (HTTPS)" },
  { timestamp: "2024-12-15 09:30:10", level: "warning", message: "[!] 检测到弱密码策略" },
  { timestamp: "2024-12-15 09:30:15", level: "error", message: "[-] 发现高危漏洞: 未加密通信" },
]

// ==================== Fuzzing 数据 ====================
export const mockFuzzingStats: FuzzingStats = {
  execSpeed: 1250,
  totalExecs: 156789,
  coverage: 67.8,
  crashes: 12,
  hangs: 3,
  uniqueCrashes: 8,
}

export const mockFuzzingCoverage: FuzzingCoverage[] = [
  { time: "09:30", coverage: 15.2 },
  { time: "09:35", coverage: 28.5 },
  { time: "09:40", coverage: 42.1 },
  { time: "09:45", coverage: 51.3 },
  { time: "09:50", coverage: 58.9 },
  { time: "09:55", coverage: 63.4 },
  { time: "10:00", coverage: 67.8 },
]

// ==================== 网络拓扑数据 ====================
export const mockNetworkTopology: NetworkTopology = {
  nodes: [
    { id: "attacker", label: "攻击机", type: "attacker", ip: "192.168.1.50", x: 100, y: 200 },
    { id: "router", label: "路由器", type: "router", ip: "192.168.1.1", x: 300, y: 200 },
    { id: "switch", label: "交换机", type: "switch", x: 500, y: 200 },
    { id: "target1", label: "门锁主控", type: "target", ip: "192.168.1.100", x: 700, y: 100 },
    { id: "target2", label: "门锁网关", type: "device", ip: "192.168.1.101", x: 700, y: 200 },
    { id: "target3", label: "云服务器", type: "device", ip: "10.0.0.1", x: 700, y: 300 },
  ],
  edges: [
    { id: "e1", source: "attacker", target: "router", traffic: 85, status: "attacking" },
    { id: "e2", source: "router", target: "switch", traffic: 60, status: "active" },
    { id: "e3", source: "switch", target: "target1", traffic: 45, status: "active" },
    { id: "e4", source: "switch", target: "target2", traffic: 30, status: "active" },
    { id: "e5", source: "switch", target: "target3", traffic: 20, status: "inactive" },
  ],
}

// ==================== 知识库数据 ====================
export const mockKnowledgeCategories: KnowledgeCategory[] = [
  {
    id: "standards",
    name: "标准规范",
    icon: "Shield",
    count: 45,
    children: [
      { id: "en18031", name: "EN 18031", icon: "FileText", count: 12, parentId: "standards" },
      { id: "iec62443", name: "IEC 62443", icon: "FileText", count: 8, parentId: "standards" },
      { id: "iso27001", name: "ISO 27001", icon: "FileText", count: 15, parentId: "standards" },
      { id: "etsi", name: "ETSI EN 303 645", icon: "FileText", count: 10, parentId: "standards" },
    ],
  },
  {
    id: "radio",
    name: "无线电测试",
    icon: "Radio",
    count: 32,
    children: [
      { id: "wifi", name: "Wi-Fi 测试", icon: "Wifi", count: 10, parentId: "radio" },
      { id: "bluetooth", name: "蓝牙测试", icon: "Bluetooth", count: 8, parentId: "radio" },
      { id: "zigbee", name: "ZigBee 测试", icon: "Radio", count: 6, parentId: "radio" },
      { id: "lora", name: "LoRa 测试", icon: "Radio", count: 8, parentId: "radio" },
    ],
  },
  {
    id: "network",
    name: "网络安全",
    icon: "Wifi",
    count: 58,
    children: [
      { id: "penetration", name: "渗透测试", icon: "Target", count: 20, parentId: "network" },
      { id: "vulnerability", name: "漏洞扫描", icon: "Bug", count: 15, parentId: "network" },
      { id: "fuzzing", name: "Fuzzing 测试", icon: "Zap", count: 12, parentId: "network" },
      { id: "protocol", name: "协议分析", icon: "FileCode", count: 11, parentId: "network" },
    ],
  },
  {
    id: "crypto",
    name: "密码学",
    icon: "Lock",
    count: 28,
    children: [
      { id: "tls", name: "TLS/SSL", icon: "Lock", count: 10, parentId: "crypto" },
      { id: "encryption", name: "加密算法", icon: "Key", count: 8, parentId: "crypto" },
      { id: "certificate", name: "证书管理", icon: "Award", count: 10, parentId: "crypto" },
    ],
  },
]

export const mockArticles: Article[] = [
  {
    id: "article-001",
    title: "EN 18031-1 无线电设备网络安全要求详解",
    content: `# EN 18031-1 无线电设备网络安全要求详解

## 1. 标准概述

EN 18031-1 是欧洲针对无线电设备网络安全的标准，是 RED 指令（2014/53/EU）第 3.3(d)、(e)、(f) 条款的协调标准。

## 2. 适用范围

本标准适用于以下类型的无线电设备：
- 连接到互联网的无线设备
- 处理个人数据的无线设备
- 具有金融交易功能的无线设备

## 3. 核心安全要求

### 3.1 访问控制
- 设备应实施适当的身份认证机制
- 默认凭证应在首次使用时强制更改
- 应限制连续错误登录尝试次数

### 3.2 数据保护
- 敏感数据应当使用加密存储
- 数据传输应当使用 TLS 1.2 或更高版本

### 3.3 软件更新
- 应提供安全的软件更新机制
- 更新包应当经过数字签名验证

## 4. 测试方法

详细的测试方法请参考 EN 18031-1 附录中的测试规范...`,
    summary: "详细解读 EN 18031-1 标准的核心安全要求，包括访问控制、数据保护和软件更新等方面。",
    category: "en18031",
    categoryName: "EN 18031",
    type: "article",
    views: 1250,
    createdAt: "2024-01-05",
    updatedAt: "2024-01-10",
    author: "张工程师",
    authorId: "user-001",
    starred: true,
    tags: ["EN 18031", "RED", "网络安全", "合规"],
  },
  {
    id: "article-002",
    title: "Wi-Fi 6E 安全测试方法与工具",
    content: `# Wi-Fi 6E 安全测试方法与工具

## 1. Wi-Fi 6E 概述

Wi-Fi 6E 是 Wi-Fi 6 的扩展，支持 6GHz 频段，提供更多频谱资源和更低的干扰。

## 2. 安全测试要点

### 2.1 WPA3 测试
- SAE (Simultaneous Authentication of Equals) 测试
- PMF (Protected Management Frames) 测试
- OWE (Opportunistic Wireless Encryption) 测试

### 2.2 漏洞测试
- KRACK 攻击测试
- DragonBlood 漏洞测试
- FragAttacks 测试

## 3. 测试工具

### 3.1 开源工具
- Aircrack-ng
- Wifite
- Bettercap

### 3.2 商业工具
- WiFi Pineapple
- Acryllic WiFi Professional`,
    summary: "介绍 Wi-Fi 6E 的安全测试方法，包括 WPA3 测试、漏洞测试和常用测试工具。",
    category: "wifi",
    categoryName: "Wi-Fi 测试",
    type: "article",
    views: 890,
    createdAt: "2024-01-03",
    updatedAt: "2024-01-08",
    author: "李工程师",
    authorId: "user-002",
    starred: false,
    tags: ["Wi-Fi", "Wi-Fi 6E", "无线测试", "安全"],
  },
  {
    id: "article-003",
    title: "Fuzzing 测试入门到精通",
    content: `# Fuzzing 测试入门到精通

## 1. 什么是 Fuzzing

Fuzzing（模糊测试）是一种自动化软件测试技术，通过向程序输入大量随机或半随机数据来发现潜在的安全漏洞。

## 2. Fuzzing 类型

### 2.1 黑盒 Fuzzing
- 不需要源代码
- 通过观察输入输出行为

### 2.2 白盒 Fuzzing
- 需要源代码
- 基于代码覆盖率引导

### 2.3 灰盒 Fuzzing
- 结合黑盒和白盒的优点
- 使用插桩技术获取反馈

## 3. 常用 Fuzzing 工具

- AFL (American Fuzzy Lop)
- LibFuzzer
- Boofuzz
- Peach Fuzzer`,
    summary: "全面介绍 Fuzzing 测试技术，从基础概念到高级应用，包括常用工具和最佳实践。",
    category: "fuzzing",
    categoryName: "Fuzzing 测试",
    type: "video",
    views: 2100,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-05",
    author: "王工程师",
    authorId: "user-003",
    starred: true,
    tags: ["Fuzzing", "漏洞挖掘", "自动化", "安全测试"],
  },
  {
    id: "article-004",
    title: "TLS 1.3 协议安全性分析",
    content: `# TLS 1.3 协议安全性分析

## 1. TLS 1.3 改进

TLS 1.3 相比 TLS 1.2 有以下主要改进：
- 移除了不安全的加密算法
- 减少了握手延迟 (1-RTT 和 0-RTT)
- 增强了前向安全性

## 2. 安全特性

### 2.1 加密套件
- 仅支持 AEAD 加密
- 移除了 RSA 密钥传输
- 强制使用 PFS

### 2.2 握手安全
- 加密的握手消息
- 数字签名保护`,
    summary: "深入分析 TLS 1.3 协议的安全特性和改进，以及与 TLS 1.2 的对比。",
    category: "tls",
    categoryName: "TLS/SSL",
    type: "document",
    views: 760,
    createdAt: "2023-12-28",
    updatedAt: "2024-01-03",
    author: "陈工程师",
    authorId: "user-004",
    starred: false,
    tags: ["TLS", "密码学", "协议", "安全"],
  },
  {
    id: "article-005",
    title: "IEC 62443 工业控制系统安全标准解读",
    content: `# IEC 62443 工业控制系统安全标准解读

## 1. 标准体系

IEC 62443 是一套完整的工业控制系统网络安全标准体系，包括：
- IEC 62443-1-x: 通用部分
- IEC 62443-2-x: 策略和程序
- IEC 62443-3-x: 系统要求
- IEC 62443-4-x: 组件要求

## 2. 安全等级

标准定义了四个安全等级 (SL 1-4)，对应不同的威胁等级和安全要求。`,
    summary: "系统解读 IEC 62443 工业控制系统安全标准体系，包括标准结构和安全等级定义。",
    category: "iec62443",
    categoryName: "IEC 62443",
    type: "article",
    views: 1580,
    createdAt: "2023-12-25",
    updatedAt: "2024-01-01",
    author: "张工程师",
    authorId: "user-001",
    starred: false,
    tags: ["IEC 62443", "工控安全", "标准", "OT安全"],
  },
  {
    id: "article-006",
    title: "蓝牙低功耗(BLE)安全漏洞案例分析",
    content: `# 蓝牙低功耗(BLE)安全漏洞案例分析

## 1. BLE 安全机制

BLE 提供以下安全机制：
- 配对和绑定
- 加密 (AES-CCM)
- 隐私保护 (地址随机化)

## 2. 常见漏洞

### 2.1 BlueBorne
CVE-2017-1000251: 允许远程代码执行

### 2.2 KNOB Attack
CVE-2019-9506: 密钥协商漏洞

### 2.3 BLURtooth
CVE-2020-15802: CTKD 实现漏洞`,
    summary: "分析 BLE 协议的安全机制和已知漏洞案例，包括 BlueBorne、KNOB 和 BLURtooth。",
    category: "bluetooth",
    categoryName: "蓝牙测试",
    type: "article",
    views: 920,
    createdAt: "2023-12-20",
    updatedAt: "2023-12-28",
    author: "李工程师",
    authorId: "user-002",
    starred: true,
    tags: ["蓝牙", "BLE", "漏洞", "安全"],
  },
]

export const mockReadingHistory: ReadingHistory[] = [
  { articleId: "article-001", articleTitle: "EN 18031-1 无线电设备网络安全要求详解", readAt: "2024-01-15 14:30" },
  { articleId: "article-003", articleTitle: "Fuzzing 测试入门到精通", readAt: "2024-01-14 10:00" },
  { articleId: "article-002", articleTitle: "Wi-Fi 6E 安全测试方法与工具", readAt: "2024-01-13 16:45" },
]

export const mockStarredArticles: Set<string> = new Set(["article-001", "article-003", "article-006"])
