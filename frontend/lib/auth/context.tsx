"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type AuthUser, type UserRole, type Permission, ROLE_PERMISSIONS, ROLE_META } from "./types"

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  canAccessRoute: (path: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 模拟用户数据
const MOCK_USERS: AuthUser[] = [
  {
    id: "user-001",
    name: "张管理员",
    email: "admin@stuailab.com",
    role: "admin",
    department: "信息中心",
    status: "active",
    createdAt: "2024-01-01",
  },
  {
    id: "user-002",
    name: "李主管",
    email: "director@stuailab.com",
    role: "director",
    department: "检测中心",
    status: "active",
    createdAt: "2024-01-01",
  },
  {
    id: "user-003",
    name: "王经理",
    email: "manager@stuailab.com",
    role: "manager",
    department: "项目部",
    status: "active",
    createdAt: "2024-01-01",
  },
  {
    id: "user-004",
    name: "陈工程师",
    email: "engineer@stuailab.com",
    role: "engineer",
    department: "检测中心",
    status: "active",
    createdAt: "2024-01-01",
  },
  {
    id: "user-005",
    name: "赵审核员",
    email: "reviewer@stuailab.com",
    role: "reviewer",
    department: "质量部",
    status: "active",
    createdAt: "2024-01-01",
  },
  {
    id: "user-006",
    name: "孙签字人",
    email: "signer@stuailab.com",
    role: "signer",
    department: "检测中心",
    status: "active",
    createdAt: "2024-01-01",
  },
  {
    id: "user-007",
    name: "周样品员",
    email: "sample@stuailab.com",
    role: "sample_admin",
    department: "样品库",
    status: "active",
    createdAt: "2024-01-01",
  },
  {
    id: "user-008",
    name: "客户A",
    email: "client@example.com",
    role: "client",
    department: "外部客户",
    status: "active",
    createdAt: "2024-01-01",
  },
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 初始化时检查本地存储的用户信息
  useEffect(() => {
    const storedUser = localStorage.getItem("auth_user")
    const storedToken = localStorage.getItem("token")

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem("auth_user")
        localStorage.removeItem("token")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    // 调用真实API
    try {
      const { authApi } = await import("@/lib/api")
      const result = await authApi.login({ email, password })

      if (result.code === 200 && result.data) {
        const apiUser = result.data.user
        // 转换为AuthUser格式
        const authUser: AuthUser = {
          id: apiUser.id,
          name: apiUser.name,
          email: apiUser.email,
          role: apiUser.role as UserRole,
          department: apiUser.department || "未知部门",
          status: apiUser.status || "active",
          createdAt: new Date().toISOString().split("T")[0],
        }

        setUser(authUser)
        localStorage.setItem("auth_user", JSON.stringify(authUser))
        localStorage.setItem("token", result.data.token)
        if (result.data.refreshToken) {
          localStorage.setItem("refreshToken", result.data.refreshToken)
        }
        return true
      }
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("auth_user")
    localStorage.removeItem("token")
    localStorage.removeItem("refreshToken")
  }

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false
    const permissions = ROLE_PERMISSIONS[user.role] || []
    return permissions.includes(permission)
  }

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some((p) => hasPermission(p))
  }

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every((p) => hasPermission(p))
  }

  const hasRole = (role: UserRole): boolean => {
    if (!user) return false
    if (user.roles) {
      return user.roles.includes(role)
    }
    return user.role === role
  }

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some((r) => hasRole(r))
  }

  const canAccessRoute = (path: string): boolean => {
    if (!user) return false
    // 管理员可以访问所有路由
    if (user.role === "admin") return true

    // 检查路由权限
    const requiredPermissions = Object.entries(ROLE_PERMISSIONS).find(([route]) => path.startsWith(route))

    if (!requiredPermissions) return true // 未定义权限的路由默认允许访问

    return hasAnyPermission(requiredPermissions[1] as Permission[])
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        hasAnyRole,
        canAccessRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// 获取角色显示信息
export function getRoleMeta(role: UserRole) {
  return ROLE_META[role]
}

// 获取所有角色列表
export function getAllRoles(): { value: UserRole; label: string; description: string }[] {
  return Object.entries(ROLE_META).map(([key, meta]) => ({
    value: key as UserRole,
    label: meta.name,
    description: meta.description,
  }))
}
