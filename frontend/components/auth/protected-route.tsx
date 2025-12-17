"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/context"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
    children: React.ReactNode
    requireAuth?: boolean
    redirectTo?: string
}

/**
 * 路由保护组件 - 确保只有已认证用户才能访问
 * 
 * @param children - 子组件
 * @param requireAuth - 是否需要认证（默认true）
 * @param redirectTo - 未认证时重定向的路径（默认/login）
 */
export function ProtectedRoute({
    children,
    requireAuth = true,
    redirectTo = "/login"
}: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && requireAuth && !isAuthenticated) {
            // 保存当前路径，登录后可以返回
            const currentPath = window.location.pathname
            localStorage.setItem("redirect_after_login", currentPath)

            router.push(redirectTo)
        }
    }, [isAuthenticated, isLoading, requireAuth, redirectTo, router])

    // 加载中显示loading
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="mt-4 text-sm text-muted-foreground">加载中...</p>
                </div>
            </div>
        )
    }

    // 未认证时返回null（将被重定向）
    if (requireAuth && !isAuthenticated) {
        return null
    }

    // 已认证或不需要认证，渲染子组件
    return <>{children}</>
}
