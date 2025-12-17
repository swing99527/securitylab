"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Check,
  X,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Search,
  CheckCheck,
  Filter,
  Download,
  ImageIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ComplianceItem {
  id: string
  clause: string
  requirement: string
  testItem: string
  autoResult: "pass" | "fail" | "warning" | "pending"
  manualResult: "pass" | "fail" | "pending"
  evidence: string
  children?: ComplianceItem[]
}

const complianceData: ComplianceItem[] = [
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

interface ComplianceMatrixProps {
  projectId: string
}

export function ComplianceMatrix({ projectId }: ComplianceMatrixProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(["5", "5.1", "5.2", "5.3", "6"]))
  const [selectedItem, setSelectedItem] = useState<ComplianceItem | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const getStatusIcon = (status: "pass" | "fail" | "warning" | "pending") => {
    switch (status) {
      case "pass":
        return <Check className="h-4 w-4 text-success" />
      case "fail":
        return <X className="h-4 w-4 text-destructive" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-warning" />
      case "pending":
        return <span className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
    }
  }

  const getStatusBadge = (status: "pass" | "fail" | "warning" | "pending") => {
    switch (status) {
      case "pass":
        return <Badge className="bg-success/10 text-success border-success/20">通过</Badge>
      case "fail":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">失败</Badge>
      case "warning":
        return <Badge className="bg-warning/10 text-warning border-warning/20">警告</Badge>
      case "pending":
        return <Badge variant="outline">待定</Badge>
    }
  }

  const renderTreeItem = (item: ComplianceItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.id)
    const isLeaf = !hasChildren

    // Filter logic
    if (
      searchTerm &&
      !item.requirement.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !item.clause.includes(searchTerm)
    ) {
      if (!hasChildren) return null
    }

    if (filterStatus !== "all" && isLeaf) {
      if (filterStatus === "pass" && item.autoResult !== "pass") return null
      if (filterStatus === "fail" && item.autoResult !== "fail") return null
      if (filterStatus === "warning" && item.autoResult !== "warning") return null
      if (filterStatus === "pending" && item.autoResult !== "pending") return null
    }

    return (
      <div key={item.id}>
        <div
          className={cn(
            "flex items-center gap-2 py-2 px-3 hover:bg-accent/50 cursor-pointer border-b border-border transition-colors",
            selectedItem?.id === item.id && "bg-accent",
          )}
          style={{ paddingLeft: `${level * 24 + 12}px` }}
          onClick={() => isLeaf && setSelectedItem(item)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpand(item.id)
              }}
              className="p-0.5"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <span className="w-5" />
          )}

          {/* Clause */}
          <span className="w-16 font-mono text-sm text-muted-foreground flex-shrink-0">{item.clause}</span>

          {/* Requirement */}
          <span className={cn("flex-1 text-sm truncate", hasChildren && "font-medium")}>{item.requirement}</span>

          {/* Test Item */}
          <span className="w-36 text-sm text-muted-foreground truncate flex-shrink-0">
            {item.testItem !== "-" ? item.testItem : ""}
          </span>

          {/* Auto Result */}
          <div className="w-16 flex justify-center flex-shrink-0">{isLeaf && getStatusIcon(item.autoResult)}</div>

          {/* Manual Result */}
          <div className="w-20 flex-shrink-0">
            {isLeaf && (
              <Select defaultValue={item.manualResult}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass">通过</SelectItem>
                  <SelectItem value="fail">失败</SelectItem>
                  <SelectItem value="pending">待定</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && item.children!.map((child) => renderTreeItem(child, level + 1))}
      </div>
    )
  }

  // Count statistics
  const countItems = (items: ComplianceItem[]): { total: number; pass: number; fail: number; warning: number } => {
    let total = 0,
      pass = 0,
      fail = 0,
      warning = 0
    const count = (item: ComplianceItem) => {
      if (!item.children || item.children.length === 0) {
        total++
        if (item.autoResult === "pass") pass++
        if (item.autoResult === "fail") fail++
        if (item.autoResult === "warning") warning++
      } else {
        item.children.forEach(count)
      }
    }
    items.forEach(count)
    return { total, pass, fail, warning }
  }

  const stats = countItems(complianceData)

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">EN 18031 合规矩阵</h1>
          <p className="text-sm text-muted-foreground mt-1">项目: {projectId} | 智能门锁安全检测</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <CheckCheck className="h-4 w-4 mr-1" />
            一键通过绿色项
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            导出报告
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">总条款</span>
            <span className="text-2xl font-bold">{stats.total}</span>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">通过</span>
            <span className="text-2xl font-bold text-success">{stats.pass}</span>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">失败</span>
            <span className="text-2xl font-bold text-destructive">{stats.fail}</span>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">警告</span>
            <span className="text-2xl font-bold text-warning">{stats.warning}</span>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索条款或要求..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="pass">通过</SelectItem>
            <SelectItem value="fail">失败</SelectItem>
            <SelectItem value="warning">警告</SelectItem>
            <SelectItem value="pending">待定</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table Header */}
      <div className="flex items-center gap-2 py-2 px-3 bg-muted/50 rounded-t-lg text-sm font-medium border border-border">
        <span className="w-5" />
        <span className="w-16 flex-shrink-0">条款号</span>
        <span className="flex-1">要求描述</span>
        <span className="w-36 flex-shrink-0">关联测试项</span>
        <span className="w-16 text-center flex-shrink-0">自动判定</span>
        <span className="w-20 text-center flex-shrink-0">人工复核</span>
      </div>

      {/* Tree Table */}
      <Card className="flex-1 min-h-0">
        <ScrollArea className="h-full">{complianceData.map((item) => renderTreeItem(item))}</ScrollArea>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <SheetContent className="w-[600px] sm:max-w-[600px]">
          {selectedItem && (
            <>
              <SheetHeader>
                <SheetTitle>条款 {selectedItem.clause}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">要求描述</h4>
                  <p className="text-sm">{selectedItem.requirement}</p>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">自动判定结果</h4>
                    {getStatusBadge(selectedItem.autoResult)}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">人工复核结果</h4>
                    <Select defaultValue={selectedItem.manualResult}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pass">通过</SelectItem>
                        <SelectItem value="fail">失败</SelectItem>
                        <SelectItem value="pending">待定</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Tabs defaultValue="evidence">
                  <TabsList>
                    <TabsTrigger value="evidence">证据/备注</TabsTrigger>
                    <TabsTrigger value="logs">原始日志</TabsTrigger>
                    <TabsTrigger value="screenshots">截图</TabsTrigger>
                  </TabsList>
                  <TabsContent value="evidence" className="mt-4">
                    <Textarea
                      placeholder="输入证据或备注..."
                      defaultValue={selectedItem.evidence}
                      className="min-h-[200px]"
                    />
                    <Button className="mt-2" size="sm">
                      <ImageIcon className="h-4 w-4 mr-1" />
                      粘贴图片
                    </Button>
                  </TabsContent>
                  <TabsContent value="logs" className="mt-4">
                    <div className="bg-[#0a0a0a] rounded-lg p-4 font-mono text-xs text-green-400 h-[200px] overflow-auto">
                      <p>[2024-12-15 09:30:25] Starting test: {selectedItem.testItem}</p>
                      <p>[2024-12-15 09:30:26] Connecting to target: 192.168.1.100</p>
                      <p>[2024-12-15 09:30:27] Test payload sent</p>
                      <p>[2024-12-15 09:30:28] Response received: OK</p>
                      <p>[2024-12-15 09:30:29] Test completed: {selectedItem.autoResult.toUpperCase()}</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="screenshots" className="mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                        截图 1
                      </div>
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                        截图 2
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex gap-2 pt-4 border-t">
                  <Button className="flex-1 bg-transparent" variant="outline" onClick={() => setSelectedItem(null)}>
                    取消
                  </Button>
                  <Button className="flex-1">保存更改</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
