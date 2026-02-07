"use client"

import type { ReactNode } from "react"
import { useAuth } from "./context"
import { type Permission, type UserRole, ROLE_META } from "./types"
import { Badge } from "@/components/ui/badge"
import { Lock } from "lucide-react"

interface PermissionGateProps {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
}

// 权限门控组件 - 单个权限
export function PermissionGate({ permission, children, fallback }: PermissionGateProps) {
  const { hasPermission } = useAuth()

  if (hasPermission(permission)) {
    return <>{children}</>
  }

  return fallback ? <>{fallback}</> : null
}

interface AnyPermissionGateProps {
  permissions: Permission[]
  children: ReactNode
  fallback?: ReactNode
}

// 权限门控组件 - 任一权限
export function AnyPermissionGate({ permissions, children, fallback }: AnyPermissionGateProps) {
  const { hasAnyPermission } = useAuth()

  if (hasAnyPermission(permissions)) {
    return <>{children}</>
  }

  return fallback ? <>{fallback}</> : null
}

interface RoleGateProps {
  role: UserRole | UserRole[]
  children: ReactNode
  fallback?: ReactNode
}

// 角色门控组件
export function RoleGate({ role, children, fallback }: RoleGateProps) {
  const { hasRole, hasAnyRole } = useAuth()

  const hasAccess = Array.isArray(role) ? hasAnyRole(role) : hasRole(role)

  if (hasAccess) {
    return <>{children}</>
  }

  return fallback ? <>{fallback}</> : null
}

interface RoleBadgeProps {
  role: UserRole
  size?: "sm" | "default"
}

// 角色徽章组件
export function RoleBadge({ role, size = "default" }: RoleBadgeProps) {
  const meta = ROLE_META[role]

  return (
    <Badge variant="secondary" className={`${meta.color} text-white ${size === "sm" ? "text-xs px-1.5 py-0" : ""}`}>
      {meta.name}
    </Badge>
  )
}

// 无权限提示组件
export function NoPermission({ message = "您没有权限访问此内容" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Lock className="h-12 w-12 mb-4 opacity-50" />
      <p className="text-lg font-medium">访问受限</p>
      <p className="text-sm mt-1">{message}</p>
    </div>
  )
}
