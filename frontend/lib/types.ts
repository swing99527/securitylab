import type React from "react"
// 系统核心类型定义

// 用户相关类型
export interface User {
  id: string
  name: string
  avatar?: string
  role: "admin" | "engineer" | "reviewer" | "auditor"
  status: "idle" | "busy" | "offline"
}

// 硬件探针状态
export interface ProbeStatus {
  wifi: "online" | "offline" | "warning"
  ble: "online" | "offline" | "warning"
  zigbee: "online" | "offline" | "warning"
}

// 通知类型
export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "error" | "success"
  timestamp: Date
  read: boolean
}

// 标签页类型
export interface TabItem {
  id: string
  title: string
  path: string
  icon?: string
  closable?: boolean
}

// 菜单项类型
export interface MenuItem {
  key: string
  label: string
  icon: React.ReactNode
  path?: string
  children?: MenuItem[]
}

// 项目状态
export type ProjectStatus = "pending" | "in_progress" | "completed" | "on_hold"

// 漏洞等级
export type VulnerabilitySeverity = "critical" | "high" | "medium" | "low" | "info"

// 合规状态
export type ComplianceStatus = "pass" | "fail" | "warning" | "pending"
