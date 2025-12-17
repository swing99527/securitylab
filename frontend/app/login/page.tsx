"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, getAllRoles } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Loader2,
  Shield,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ChevronRight,
  CheckCircle2,
  Scan,
  FileSearch,
  Bug,
  ShieldCheck,
  Wifi,
} from "lucide-react"

// 演示账号
const DEMO_ACCOUNTS = [
  { email: "admin@stuailab.com", role: "admin", name: "张管理员" },
  { email: "director@stuailab.com", role: "director", name: "李主管" },
  { email: "manager@stuailab.com", role: "manager", name: "王经理" },
  { email: "engineer@stuailab.com", role: "engineer", name: "陈工程师" },
  { email: "reviewer@stuailab.com", role: "reviewer", name: "赵审核员" },
  { email: "signer@stuailab.com", role: "signer", name: "孙签字人" },
  { email: "sample@stuailab.com", role: "sample_admin", name: "周样品员" },
  { email: "client@example.com", role: "client", name: "客户A" },
]

export default function LoginPage() {
  // 客户端生成星星位置,避免hydration error
  const [stars, setStars] = useState<Array<{ top: number; left: number; delay: number; duration: number }>>([])

  useEffect(() => {
    // 只在客户端生成随机位置
    setStars(
      Array.from({ length: 20 }, () => ({
        top: Math.random() * 100,
        left: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 2,
      }))
    )
  }, [])
  const router = useRouter()
  const { login } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [selectedDemo, setSelectedDemo] = useState<string>("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const success = await login(email, password)
      if (success) {
        toast({ title: "登录成功", description: "欢迎回来！" })

        // 检查是否有保存的重定向路径
        const redirectPath = localStorage.getItem("redirect_after_login")
        if (redirectPath) {
          localStorage.removeItem("redirect_after_login")
          router.push(redirectPath)
        } else {
          router.push("/dashboard")
        }
      } else {
        toast({ title: "登录失败", description: "邮箱或密码错误", variant: "destructive" })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    if (!selectedDemo) {
      toast({ title: "请选择演示账号", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      const success = await login(selectedDemo, "123456")
      if (success) {
        const account = DEMO_ACCOUNTS.find((a) => a.email === selectedDemo)
        toast({ title: "登录成功", description: `已切换为 ${account?.name}` })

        // 检查是否有保存的重定向路径
        const redirectPath = localStorage.getItem("redirect_after_login")
        if (redirectPath) {
          localStorage.removeItem("redirect_after_login")
          router.push(redirectPath)
        } else {
          router.push("/dashboard")
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const roles = getAllRoles()

  return (
    <div className="min-h-screen flex">
      {/* 左侧品牌区 - 深色背景配图 */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a1628] overflow-hidden">
        {/* 背景图片层 */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage: `url('/abstract-dark-blue-technology-network-cybersecurit.jpg')`,
          }}
        />

        {/* 渐变叠加层 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-[#0a1628]/90 to-[#0a1628]" />

        {/* 光效装饰 */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-cyan-500/15 rounded-full blur-[80px]" />

        {/* 背景动画星星 - 仅客户端渲染避免hydration error */}
        <div className="absolute inset-0 overflow-hidden">
          {stars.map((star, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400/60 rounded-full animate-pulse"
              style={{
                top: `${star.top}%`,
                left: `${star.left}%`,
                animationDelay: `${star.delay}s`,
                animationDuration: `${star.duration}s`,
              }}
            />
          ))}
        </div>

        {/* 中心内容 - Logo 和品牌名称 */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          {/* Logo */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-6">
            <Shield className="h-10 w-10 text-white" />
          </div>

          {/* 品牌名称 */}
          <h1 className="text-4xl font-bold text-white tracking-wide mb-2">网络测试平台</h1>
          <h2 className="text-xl text-blue-300/90 font-medium tracking-widest mb-2">汕头人工智能实验室</h2>
          <p className="text-sm text-slate-500 tracking-wider mb-10">SHANTOU AI LABORATORY</p>

          {/* 平台介绍 */}
          <div className="w-full max-w-md space-y-6">
            <p className="text-slate-400 text-center text-sm leading-relaxed">
              专业的网络安全检测与实验室管理一体化平台，提供从样品入库到检测报告全流程数字化管理
            </p>

            {/* 核心功能特性 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white text-sm font-medium">合规检测</h3>
                  <p className="text-slate-500 text-xs mt-0.5">EN 18031 / ETSI EN 303 645</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <Scan className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white text-sm font-medium">漏洞扫描</h3>
                  <p className="text-slate-500 text-xs mt-0.5">OpenVAS / Nessus 集成</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Bug className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white text-sm font-medium">模糊测试</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Boofuzz / AFL++ 自动化</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <FileSearch className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white text-sm font-medium">固件分析</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Binwalk 自动解包</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <Wifi className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-white text-sm font-medium">无线测试</h3>
                  <p className="text-slate-500 text-xs mt-0.5">蓝牙 / Wi-Fi / Zigbee</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-white text-sm font-medium">智能报告</h3>
                  <p className="text-slate-500 text-xs mt-0.5">AI 辅助生成与审核</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* 移动端 Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">网络测试平台</h1>
              <p className="text-xs text-blue-600">汕头人工智能实验室</p>
            </div>
          </div>

          {/* 标题 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">登录</h2>
            <p className="text-gray-500">请选择您的登录方式</p>
          </div>

          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 h-11">
              <TabsTrigger
                value="account"
                className="text-sm data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                账号登录
              </TabsTrigger>
              <TabsTrigger
                value="demo"
                className="text-sm data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                演示体验
              </TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="mt-0">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    邮箱地址
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-11 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      密码
                    </Label>
                    <Button variant="link" className="h-auto p-0 text-sm text-blue-600 hover:text-blue-700">
                      忘记密码？
                    </Button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="输入密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-11 pr-11 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 text-gray-400 hover:text-gray-600 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                    记住登录状态
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base shadow-lg shadow-blue-600/25"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      登录中...
                    </>
                  ) : (
                    <>
                      登录
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="demo" className="mt-0 space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">选择演示角色</Label>
                <Select value={selectedDemo} onValueChange={setSelectedDemo}>
                  <SelectTrigger className="h-12 bg-gray-50 border-gray-200 text-gray-900">
                    <SelectValue placeholder="选择一个演示账号" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {DEMO_ACCOUNTS.map((account) => {
                      const roleMeta = roles.find((r) => r.value === account.role)
                      return (
                        <SelectItem
                          key={account.email}
                          value={account.email}
                          className="text-gray-900 focus:bg-blue-50"
                        >
                          <span>{account.name}</span>
                          <span className="text-sm text-gray-500 ml-2">({roleMeta?.label})</span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedDemo && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-sm text-blue-700">
                    {
                      roles.find((r) => r.value === DEMO_ACCOUNTS.find((a) => a.email === selectedDemo)?.role)
                        ?.description
                    }
                  </p>
                </div>
              )}

              <Button
                onClick={handleDemoLogin}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base shadow-lg shadow-blue-600/25"
                disabled={isLoading || !selectedDemo}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    登录中...
                  </>
                ) : (
                  <>
                    以此角色登录
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-gray-500">
                演示账号密码: <span className="text-gray-700 font-mono">123456</span>
              </p>
            </TabsContent>
          </Tabs>

          {/* 分隔线 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500">没有账号？</span>
            </div>
          </div>

          {/* 注册提示 */}
          <div className="text-center">
            <Button variant="link" className="text-blue-600 hover:text-blue-700 font-medium">
              联系管理员申请账号
            </Button>
          </div>

          {/* 版权信息 */}
          <p className="text-center text-xs text-gray-400 mt-8">© 2025 汕头人工智能实验室 · 网络测试平台</p>
        </div>
      </div>
    </div>
  )
}
