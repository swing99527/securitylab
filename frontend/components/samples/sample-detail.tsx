"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { QrCode, Package, User, MapPin, ArrowRight, Download, Printer, History, Edit, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimelineEvent {
  id: string
  type: "in" | "out" | "transfer" | "return" | "scrap"
  timestamp: string
  operator: string
  description: string
  location?: string
  purpose?: string
}

const mockTimeline: TimelineEvent[] = [
  {
    id: "1",
    type: "in",
    timestamp: "2024-12-01 09:30",
    operator: "李管理员",
    description: "样品入库登记",
    location: "样品库A-03",
  },
  {
    id: "2",
    type: "out",
    timestamp: "2024-12-05 10:15",
    operator: "张工程师",
    description: "领用出库",
    location: "屏蔽室A",
    purpose: "固件安全测试",
  },
  {
    id: "3",
    type: "transfer",
    timestamp: "2024-12-10 14:00",
    operator: "张工程师",
    description: "转移至测试台",
    location: "测试台2",
    purpose: "渗透测试",
  },
  {
    id: "4",
    type: "transfer",
    timestamp: "2024-12-15 09:00",
    operator: "张工程师",
    description: "返回屏蔽室",
    location: "屏蔽室A",
    purpose: "继续测试",
  },
]

const eventConfig = {
  in: { label: "入库", color: "bg-success", icon: Package },
  out: { label: "出库", color: "bg-primary", icon: ArrowRight },
  transfer: { label: "转移", color: "bg-warning", icon: MapPin },
  return: { label: "归还", color: "bg-success", icon: Package },
  scrap: { label: "报废", color: "bg-destructive", icon: Package },
}

interface SampleDetailProps {
  sampleId: string
}

export function SampleDetail({ sampleId }: SampleDetailProps) {
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [sample, setSample] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch sample detail from API
  useEffect(() => {
    async function fetchSample() {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:8000/api/v1/samples/${sampleId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch sample')
        }

        const data = await response.json()
        setSample(data)
      } catch (err) {
        console.error('Error fetching sample:', err)
        setError('加载样品详情失败')
      } finally {
        setLoading(false)
      }
    }
    fetchSample()
  }, [sampleId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">加载样品详情中...</span>
      </div>
    )
  }

  if (error || !sample) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>{error || "样品不存在"}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{sample.name}</h1>
            <Badge className={cn(
              sample.status === 'in_stock' ? 'bg-success/10 text-success border-success/20' :
                sample.status === 'in_use' ? 'bg-primary/10 text-primary border-primary/20' :
                  'bg-muted'
            )}>
              {sample.status === 'in_stock' ? '在库' :
                sample.status === 'in_use' ? '使用中' :
                  sample.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {sample.code} | {sample.model} | {sample.manufacturer}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-1" />
            打印标签
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-1" />
            编辑
          </Button>
          <Button size="sm" onClick={() => setShowTransferDialog(true)}>
            <ArrowRight className="h-4 w-4 mr-1" />
            流转操作
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Info & QR */}
        <div className="col-span-4 space-y-6">
          {/* QR Code Card */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                样品二维码
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="w-48 h-48 bg-white p-4 rounded-lg border">
                {sample.qr_code_url ? (
                  <img
                    src={sample.qr_code_url}
                    alt="Sample QR Code"
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <QrCode className="h-12 w-12" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-mono">{sample.code}</p>
              <Button variant="outline" size="sm" className="mt-3 bg-transparent">
                <Download className="h-4 w-4 mr-1" />
                下载二维码
              </Button>
            </CardContent>
          </Card>

          {/* Basic Info Card */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">序列号</span>
                <span className="font-mono">{sample.serial_number || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">入库日期</span>
                <span>{sample.created_at ? new Date(sample.created_at).toLocaleDateString('zh-CN') : '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">产品类别</span>
                <span>{sample.category || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">固件版本</span>
                <span>{sample.firmware || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">工作电压</span>
                <span>{sample.voltage || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">接口类型</span>
                <span>{sample.interface || '-'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">当前状态</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">位置:</span>
                <span className="font-medium">{sample.location || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">持有人:</span>
                <span className="font-medium">{sample.current_holder || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">关联项目:</span>
                <span className="font-medium">{sample.project_name || '-'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Timeline & Images */}
        <div className="col-span-8">
          <Tabs defaultValue="timeline">
            <TabsList>
              <TabsTrigger value="timeline">
                <History className="h-4 w-4 mr-1" />
                流转记录
              </TabsTrigger>
              <TabsTrigger value="images">样品图片</TabsTrigger>
              <TabsTrigger value="tests">测试记录</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {/* Vertical Timeline */}
                  <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />

                    <div className="space-y-6">
                      {mockTimeline.map((event, index) => {
                        const config = eventConfig[event.type]
                        const Icon = config.icon
                        return (
                          <div key={event.id} className="relative flex gap-4">
                            {/* Timeline Node */}
                            <div
                              className={cn(
                                "relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                config.color,
                              )}
                            >
                              <Icon className="h-4 w-4 text-white" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-6">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {config.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{event.timestamp}</span>
                              </div>
                              <p className="text-sm font-medium mt-1">{event.description}</p>
                              <div className="mt-2 text-sm text-muted-foreground space-y-1">
                                <p>操作人: {event.operator}</p>
                                {event.location && <p>位置: {event.location}</p>}
                                {event.purpose && <p>用途: {event.purpose}</p>}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="images" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    {(sample.images || []).map((img, idx) => (
                      <div key={idx} className="aspect-video bg-muted rounded-lg overflow-hidden">
                        <img
                          src={img || "/placeholder.svg"}
                          alt={`样品图片 ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    <div className="aspect-video bg-muted/50 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted transition-colors">
                      <span className="text-sm text-muted-foreground">+ 添加图片</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tests" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">固件安全扫描</p>
                          <p className="text-sm text-muted-foreground">TASK-2024-001 | 2024-12-10</p>
                        </div>
                        <Badge className="bg-success/10 text-success">已完成</Badge>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">渗透测试</p>
                          <p className="text-sm text-muted-foreground">TASK-2024-002 | 2024-12-15</p>
                        </div>
                        <Badge className="bg-primary/10 text-primary">进行中</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>样品流转操作</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">操作类型</label>
              <Select defaultValue="transfer">
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">位置转移</SelectItem>
                  <SelectItem value="return">归还入库</SelectItem>
                  <SelectItem value="handover">人员交接</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">目标位置</label>
              <Select>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="选择目标位置" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lab-a">屏蔽室A</SelectItem>
                  <SelectItem value="lab-b">屏蔽室B</SelectItem>
                  <SelectItem value="test-1">测试台1</SelectItem>
                  <SelectItem value="test-2">测试台2</SelectItem>
                  <SelectItem value="storage">样品库A-03</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">用途/备注</label>
              <Textarea placeholder="请输入流转用途或备注..." className="mt-2" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
              取消
            </Button>
            <Button>确认流转</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
