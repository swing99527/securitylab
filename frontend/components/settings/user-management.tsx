"use client"

import type React from "react"

import { useState } from "react"
import { useAuth, getAllRoles, type AuthUser, type UserRole } from "@/lib/auth"
import { RoleBadge } from "@/lib/auth/components"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Lock, Unlock, Key, Users, UserCheck, UserX } from "lucide-react"

// 模拟用户列表
const MOCK_USERS: AuthUser[] = [
  {
    id: "user-001",
    name: "张管理员",
    email: "admin@stuailab.com",
    role: "admin",
    department: "信息中心",
    status: "active",
    lastLogin: "2024-12-15 09:30",
    createdAt: "2024-01-01",
  },
  {
    id: "user-002",
    name: "李主管",
    email: "director@stuailab.com",
    role: "director",
    department: "检测中心",
    status: "active",
    lastLogin: "2024-12-15 08:45",
    createdAt: "2024-01-15",
  },
  {
    id: "user-003",
    name: "王经理",
    email: "manager@stuailab.com",
    role: "manager",
    department: "项目部",
    status: "active",
    lastLogin: "2024-12-14 17:20",
    createdAt: "2024-02-01",
  },
  {
    id: "user-004",
    name: "陈工程师",
    email: "engineer@stuailab.com",
    role: "engineer",
    department: "检测中心",
    status: "active",
    lastLogin: "2024-12-15 10:15",
    createdAt: "2024-03-01",
  },
  {
    id: "user-005",
    name: "赵审核员",
    email: "reviewer@stuailab.com",
    role: "reviewer",
    department: "质量部",
    status: "active",
    lastLogin: "2024-12-15 09:00",
    createdAt: "2024-03-15",
  },
  {
    id: "user-006",
    name: "孙签字人",
    email: "signer@stuailab.com",
    role: "signer",
    department: "检测中心",
    status: "inactive",
    lastLogin: "2024-12-10 16:30",
    createdAt: "2024-04-01",
  },
  {
    id: "user-007",
    name: "周样品员",
    email: "sample@stuailab.com",
    role: "sample_admin",
    department: "样品库",
    status: "active",
    lastLogin: "2024-12-15 08:00",
    createdAt: "2024-04-15",
  },
  {
    id: "user-008",
    name: "客户A",
    email: "client@example.com",
    role: "client",
    department: "外部客户",
    status: "locked",
    lastLogin: "2024-12-01 14:00",
    createdAt: "2024-05-01",
  },
]

export function UserManagement() {
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<AuthUser[]>(MOCK_USERS)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null)

  // 统计数据
  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    inactive: users.filter((u) => u.status === "inactive").length,
    locked: users.filter((u) => u.status === "locked").length,
  }

  // 过滤用户
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleCreateUser = (data: Partial<AuthUser>) => {
    const newUser: AuthUser = {
      id: `user-${Date.now()}`,
      name: data.name || "",
      email: data.email || "",
      role: data.role || "engineer",
      department: data.department || "",
      status: "active",
      createdAt: new Date().toISOString().split("T")[0],
    }
    setUsers([...users, newUser])
    setIsCreateDialogOpen(false)
    toast({ title: "创建成功", description: `用户 ${newUser.name} 已创建` })
  }

  const handleUpdateUser = (userId: string, data: Partial<AuthUser>) => {
    setUsers(users.map((u) => (u.id === userId ? { ...u, ...data } : u)))
    setEditingUser(null)
    toast({ title: "更新成功", description: "用户信息已更新" })
  }

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      toast({ title: "操作失败", description: "不能删除自己的账号", variant: "destructive" })
      return
    }
    setUsers(users.filter((u) => u.id !== userId))
    toast({ title: "删除成功", description: "用户已删除" })
  }

  const handleToggleLock = (userId: string) => {
    setUsers(users.map((u) => (u.id === userId ? { ...u, status: u.status === "locked" ? "active" : "locked" } : u)))
    toast({ title: "操作成功", description: "用户状态已更新" })
  }

  const handleResetPassword = (userId: string) => {
    toast({ title: "密码已重置", description: "新密码已发送至用户邮箱" })
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 grid-cols-4">
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总用户</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <UserCheck className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">活跃</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <UserX className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">未激活</p>
                <p className="text-2xl font-bold">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Lock className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">已锁定</p>
                <p className="text-2xl font-bold">{stats.locked}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 工具栏 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索用户名或邮箱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="角色筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部角色</SelectItem>
              {getAllRoles().map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="状态筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">活跃</SelectItem>
              <SelectItem value="inactive">未激活</SelectItem>
              <SelectItem value="locked">已锁定</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新建用户
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新建用户</DialogTitle>
              <DialogDescription>创建新的系统用户账号</DialogDescription>
            </DialogHeader>
            <UserForm onSubmit={handleCreateUser} onCancel={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* 用户列表 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>部门</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>最后登录</TableHead>
                <TableHead className="w-[80px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} size="sm" />
                  </TableCell>
                  <TableCell>{user.department}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.status === "active" ? "default" : user.status === "inactive" ? "secondary" : "destructive"
                      }
                      className="text-xs"
                    >
                      {user.status === "active" ? "活跃" : user.status === "inactive" ? "未激活" : "已锁定"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{user.lastLogin || "-"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingUser(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                          <Key className="h-4 w-4 mr-2" />
                          重置密码
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleLock(user.id)}>
                          {user.status === "locked" ? (
                            <>
                              <Unlock className="h-4 w-4 mr-2" />
                              解锁账号
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4 mr-2" />
                              锁定账号
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.id === currentUser?.id}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          删除用户
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 编辑用户对话框 */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>修改用户信息</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <UserForm
              initialData={editingUser}
              onSubmit={(data) => handleUpdateUser(editingUser.id, data)}
              onCancel={() => setEditingUser(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface UserFormProps {
  initialData?: AuthUser
  onSubmit: (data: Partial<AuthUser>) => void
  onCancel: () => void
}

function UserForm({ initialData, onSubmit, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    role: initialData?.role || "engineer",
    department: initialData?.department || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">姓名</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">邮箱</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">角色</Label>
        <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getAllRoles().map((role) => (
              <SelectItem key={role.value} value={role.value}>
                <div className="flex flex-col">
                  <span>{role.label}</span>
                  <span className="text-xs text-muted-foreground">{role.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="department">部门</Label>
        <Input
          id="department"
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit">{initialData ? "保存" : "创建"}</Button>
      </DialogFooter>
    </form>
  )
}
