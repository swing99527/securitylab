"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth"
import { PermissionGate } from "@/lib/auth/components"
import { UserManagement } from "./user-management"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  User,
  Bell,
  Shield,
  Monitor,
  HardDrive,
  Cpu,
  Wifi,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Users,
} from "lucide-react"

interface HardwareDevice {
  id: string
  name: string
  type: string
  status: "online" | "offline" | "warning"
  ip: string
  lastSeen: string
}

const hardwareDevices: HardwareDevice[] = [
  { id: "1", name: "频谱分析仪 R&S FSW43", type: "spectrum", status: "online", ip: "192.168.1.101", lastSeen: "刚刚" },
  {
    id: "2",
    name: "矢量网络分析仪 Keysight N5227B",
    type: "vna",
    status: "online",
    ip: "192.168.1.102",
    lastSeen: "刚刚",
  },
  {
    id: "3",
    name: "信号发生器 R&S SMW200A",
    type: "generator",
    status: "warning",
    ip: "192.168.1.103",
    lastSeen: "5分钟前",
  },
  { id: "4", name: "Fuzzing 测试主机 #1", type: "server", status: "online", ip: "192.168.1.201", lastSeen: "刚刚" },
  { id: "5", name: "Fuzzing 测试主机 #2", type: "server", status: "offline", ip: "192.168.1.202", lastSeen: "2小时前" },
]

export function SettingsPanel() {
  const { user, hasPermission } = useAuth()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [browserNotifications, setBrowserNotifications] = useState(true)
  const [taskAlerts, setTaskAlerts] = useState(true)
  const [reportAlerts, setReportAlerts] = useState(true)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  const getStatusIcon = (status: HardwareDevice["status"]) => {
    switch (status) {
      case "online":
        return <CheckCircle2 className="h-4 w-4 text-success" />
      case "offline":
        return <XCircle className="h-4 w-4 text-danger" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-warning" />
    }
  }

  const getStatusBadge = (status: HardwareDevice["status"]) => {
    switch (status) {
      case "online":
        return <Badge className="bg-success/20 text-success border-success/30">在线</Badge>
      case "offline":
        return <Badge className="bg-danger/20 text-danger border-danger/30">离线</Badge>
      case "warning":
        return <Badge className="bg-warning/20 text-warning border-warning/30">警告</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">系统设置</h1>
        <p className="text-muted-foreground mt-1">管理系统配置、硬件设备和用户偏好</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            通用设置
          </TabsTrigger>
          {hasPermission("settings:user_manage") && (
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              用户管理
            </TabsTrigger>
          )}
          <TabsTrigger value="hardware" className="gap-2">
            <Monitor className="h-4 w-4" />
            硬件管理
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            通知设置
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            安全设置
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                个人信息
              </CardTitle>
              <CardDescription>管理您的账户信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">姓名</Label>
                  <Input id="name" defaultValue={user?.name || ""} className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input id="email" type="email" defaultValue={user?.email || ""} className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">部门</Label>
                  <Input id="department" defaultValue={user?.department || ""} className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">角色</Label>
                  <Input id="role" value={user?.role || ""} disabled className="bg-background" />
                </div>
              </div>
              <Button>保存更改</Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>界面设置</CardTitle>
              <CardDescription>自定义界面显示偏好</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>主题模式</Label>
                  <p className="text-sm text-muted-foreground">选择界面主题</p>
                </div>
                <Select defaultValue="dark">
                  <SelectTrigger className="w-32 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">深色</SelectItem>
                    <SelectItem value="light">浅色</SelectItem>
                    <SelectItem value="system">跟随系统</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>语言</Label>
                  <p className="text-sm text-muted-foreground">选择界面语言</p>
                </div>
                <Select defaultValue="zh">
                  <SelectTrigger className="w-32 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh">简体中文</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>数据刷新间隔</Label>
                  <p className="text-sm text-muted-foreground">仪表盘数据自动刷新频率</p>
                </div>
                <Select defaultValue="30">
                  <SelectTrigger className="w-32 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 秒</SelectItem>
                    <SelectItem value="30">30 秒</SelectItem>
                    <SelectItem value="60">1 分钟</SelectItem>
                    <SelectItem value="300">5 分钟</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <PermissionGate
            permission="settings:user_manage"
            fallback={<div className="text-center py-8 text-muted-foreground">您没有权限访问用户管理</div>}
          >
            <UserManagement />
          </PermissionGate>
        </TabsContent>

        {/* Hardware Management */}
        <TabsContent value="hardware" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    硬件设备
                  </CardTitle>
                  <CardDescription>管理和监控连接的测试设备</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <RefreshCw className="h-4 w-4" />
                  刷新状态
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hardwareDevices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-background border border-border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-card">
                        {device.type === "spectrum" || device.type === "vna" ? (
                          <Wifi className="h-5 w-5 text-primary" />
                        ) : device.type === "generator" ? (
                          <Cpu className="h-5 w-5 text-primary" />
                        ) : (
                          <HardDrive className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(device.status)}
                          <span className="font-medium text-foreground">{device.name}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>IP: {device.ip}</span>
                          <span>最后响应: {device.lastSeen}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(device.status)}
                      <Button variant="outline" size="sm">
                        配置
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>添加新设备</CardTitle>
              <CardDescription>添加新的测试设备到系统</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deviceName">设备名称</Label>
                  <Input id="deviceName" placeholder="输入设备名称" className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deviceIp">IP 地址</Label>
                  <Input id="deviceIp" placeholder="192.168.1.xxx" className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deviceType">设备类型</Label>
                  <Select>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spectrum">频谱分析仪</SelectItem>
                      <SelectItem value="vna">矢量网络分析仪</SelectItem>
                      <SelectItem value="generator">信号发生器</SelectItem>
                      <SelectItem value="server">测试主机</SelectItem>
                      <SelectItem value="other">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="mt-4">添加设备</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                通知渠道
              </CardTitle>
              <CardDescription>选择接收通知的方式</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>邮件通知</Label>
                  <p className="text-sm text-muted-foreground">通过邮件接收重要通知</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>浏览器通知</Label>
                  <p className="text-sm text-muted-foreground">在浏览器中显示推送通知</p>
                </div>
                <Switch checked={browserNotifications} onCheckedChange={setBrowserNotifications} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>通知类型</CardTitle>
              <CardDescription>选择要接收的通知类型</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>任务状态变更</Label>
                  <p className="text-sm text-muted-foreground">任务开始、完成或失败时通知</p>
                </div>
                <Switch checked={taskAlerts} onCheckedChange={setTaskAlerts} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>报告审核提醒</Label>
                  <p className="text-sm text-muted-foreground">报告提交审核或审核完成时通知</p>
                </div>
                <Switch checked={reportAlerts} onCheckedChange={setReportAlerts} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>高危漏洞发现</Label>
                  <p className="text-sm text-muted-foreground">发现高危或严重漏洞时立即通知</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>硬件状态异常</Label>
                  <p className="text-sm text-muted-foreground">设备离线或异常时通知</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                账户安全
              </CardTitle>
              <CardDescription>管理账户安全设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>双因素认证</Label>
                  <p className="text-sm text-muted-foreground">使用手机验证码增强账户安全</p>
                </div>
                <div className="flex items-center gap-3">
                  {twoFactorEnabled ? (
                    <Badge className="bg-success/20 text-success border-success/30">已启用</Badge>
                  ) : (
                    <Badge variant="outline">未启用</Badge>
                  )}
                  <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>修改密码</Label>
                  <p className="text-sm text-muted-foreground">定期更换密码以保护账户安全</p>
                </div>
                <Button variant="outline">修改密码</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>登录会话</Label>
                  <p className="text-sm text-muted-foreground">管理已登录的设备和会话</p>
                </div>
                <Button variant="outline">查看会话</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>审计日志</CardTitle>
              <CardDescription>查看账户活动记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { action: "登录系统", ip: "192.168.1.50", time: "今天 09:30" },
                  { action: "创建检测任务 TSK-2024-0456", ip: "192.168.1.50", time: "今天 10:15" },
                  { action: "导出报告 RPT-2024-0089", ip: "192.168.1.50", time: "今天 14:20" },
                  { action: "修改个人设置", ip: "192.168.1.50", time: "昨天 16:45" },
                ].map((log, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <span className="text-sm text-foreground">{log.action}</span>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{log.ip}</span>
                      <span>{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="link" className="mt-2 px-0">
                查看完整日志
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
