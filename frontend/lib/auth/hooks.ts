"use client"

import { useAuth } from "./context"
import type { Permission, UserRole } from "./types"

// 权限检查 Hook
export function usePermission(permission: Permission) {
  const { hasPermission } = useAuth()
  return hasPermission(permission)
}

// 多权限检查 Hook（任一满足）
export function useAnyPermission(permissions: Permission[]) {
  const { hasAnyPermission } = useAuth()
  return hasAnyPermission(permissions)
}

// 多权限检查 Hook（全部满足）
export function useAllPermissions(permissions: Permission[]) {
  const { hasAllPermissions } = useAuth()
  return hasAllPermissions(permissions)
}

// 角色检查 Hook
export function useRole(role: UserRole) {
  const { hasRole } = useAuth()
  return hasRole(role)
}

// 多角色检查 Hook
export function useAnyRole(roles: UserRole[]) {
  const { hasAnyRole } = useAuth()
  return hasAnyRole(roles)
}
