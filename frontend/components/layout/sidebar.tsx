"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"
import { useAuth, getRoleMeta } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  FolderKanban,
  Database,
  ScanLine,
  FileText,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  SwitchCamera,
} from "lucide-react"

const menuItems = [
  { id: "dashboard", label: "工作台", icon: LayoutDashboard, path: "/dashboard" },
  { id: "projects", label: "项目管理", icon: FolderKanban, path: "/projects" },
  { id: "samples", label: "样品库", icon: Database, path: "/samples" },
  { id: "tasks", label: "检测任务", icon: ScanLine, path: "/tasks" },
  { id: "reports", label: "报告中心", icon: FileText, path: "/reports" },
  { id: "knowledge", label: "知识库", icon: BookOpen, path: "/knowledge" },
  { id: "settings", label: "系统设置", icon: Settings, path: "/settings" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar, userStatus, setUserStatus } = useAppStore()
  const { user, logout } = useAuth()

  const roleMeta = user ? getRoleMeta(user.role) : null

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar-bg border-r border-sidebar-border transition-all duration-300 flex flex-col",
          sidebarCollapsed ? "w-16" : "w-60",
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center h-14 px-4 border-b border-sidebar-border",
            sidebarCollapsed ? "justify-center" : "justify-between",
          )}
        >
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">ST</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sidebar-foreground text-sm leading-tight">网络测试平台</span>
                <span className="text-[10px] text-muted-foreground leading-tight">汕头人工智能实验室</span>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">ST</span>
            </div>
          )}
        </div>

        {/* Toggle button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="absolute right-2 top-3 h-8 w-8 text-sidebar-foreground hover:bg-accent"
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + "/")
            const Icon = item.icon

            const linkContent = (
              <Link
                href={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground",
                  sidebarCollapsed && "justify-center px-2",
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            )

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.id}>{linkContent}</div>
          })}
        </nav>

        <div className={cn("p-4 border-t border-sidebar-border", sidebarCollapsed && "px-2")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-3 w-full rounded-lg p-1 hover:bg-accent transition-colors",
                  sidebarCollapsed && "justify-center",
                )}
              >
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-sidebar-bg cursor-pointer",
                      userStatus === "idle" ? "bg-success" : "bg-warning",
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      setUserStatus(userStatus === "idle" ? "busy" : "idle")
                    }}
                  />
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name || "未登录"}</p>
                    <div className="flex items-center gap-1">
                      {roleMeta && (
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded", roleMeta.color, "text-white")}>
                          {roleMeta.name}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {userStatus === "idle" ? "空闲" : "忙碌"}
                      </span>
                    </div>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user?.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  个人设置
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/login" className="cursor-pointer">
                  <SwitchCamera className="mr-2 h-4 w-4" />
                  切换账号
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  )
}
