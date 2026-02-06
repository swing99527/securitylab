"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { QrCode, Package, Save, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { projectApi } from "@/lib/api"

interface Project {
  id: string
  name: string
  code: string
}

export function SampleInbound() {
  const router = useRouter()
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [createdSample, setCreatedSample] = useState<any>(null)

  const [formData, setFormData] = useState({
    projectId: "",
    name: "",
    model: "",
    manufacturer: "",
    serialNumber: "",
    category: "",
    voltage: "",
    interface: "",
    firmware: "",
    location: "",
    notes: "",
  })

  // Fetch projects on mount
  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true)
        const response = await projectApi.getList({ page: 1, pageSize: 100 })
        if (response.code === 200 && response.data) {
          setProjects(response.data.list || [])
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error)
        toast({
          title: "错误",
          description: "加载项目列表失败",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.projectId) {
      toast({
        title: "错误",
        description: "请选择所属项目",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)

      // Get token from localStorage
      const token = localStorage.getItem("token")

      // Create sample via direct API call
      const response = await fetch("http://localhost:8000/api/v1/samples", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_id: formData.projectId,
          name: formData.name,
          model: formData.model,
          manufacturer: formData.manufacturer,
          location: formData.location,
          notes: formData.notes,
        }),
      })

      const data = await response.json()

      if (response.ok && data) {
        setCreatedSample(data)

        toast({
          title: "✅ 样品登记成功",
          description: `样品编号: ${data.code}`,
        })

        // Reset form after 2 seconds and navigate to samples list
        setTimeout(() => {
          router.push("/samples")
        }, 2000)
      } else {
        throw new Error(data.detail || data.message || "创建样品失败")
      }
    } catch (error: any) {
      console.error("Failed to create sample:", error)
      toast({
        title: "❌ 登记失败",
        description: error.message || "创建样品时出错，请重试",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-3 gap-6">
        {/* Form */}
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                样品入库登记
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Project Selection */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">项目归属</h3>
                  <div className="space-y-2">
                    <Label htmlFor="project">所属项目 *</Label>
                    <Select
                      value={formData.projectId}
                      onValueChange={(v) => setFormData({ ...formData, projectId: v })}
                      disabled={loading}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loading ? "加载中..." : "选择项目"} />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name} ({project.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      ⚠️ 样品必须归属于一个项目
                    </p>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">基本信息</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">样品名称 *</Label>
                      <Input
                        id="name"
                        placeholder="请输入样品名称"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        disabled={submitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">型号 *</Label>
                      <Input
                        id="model"
                        placeholder="请输入型号"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        required
                        disabled={submitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manufacturer">制造商 *</Label>
                      <Input
                        id="manufacturer"
                        placeholder="请输入制造商"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                        required
                        disabled={submitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serialNumber">序列号</Label>
                      <Input
                        id="serialNumber"
                        placeholder="请输入序列号"
                        value={formData.serialNumber}
                        onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>

                {/* Technical Specs */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">技术规格</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">产品类别</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(v) => setFormData({ ...formData, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择类别" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="iot">IoT设备</SelectItem>
                          <SelectItem value="industrial">工业控制器</SelectItem>
                          <SelectItem value="automotive">车载设备</SelectItem>
                          <SelectItem value="medical">医疗设备</SelectItem>
                          <SelectItem value="consumer">消费电子</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="voltage">工作电压</Label>
                      <Input
                        id="voltage"
                        placeholder="如: DC 5V"
                        value={formData.voltage}
                        onChange={(e) => setFormData({ ...formData, voltage: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="interface">接口类型</Label>
                      <Input
                        id="interface"
                        placeholder="如: UART/SPI/I2C"
                        value={formData.interface}
                        onChange={(e) => setFormData({ ...formData, interface: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="firmware">固件版本</Label>
                      <Input
                        id="firmware"
                        placeholder="如: v1.0.0"
                        value={formData.firmware}
                        onChange={(e) => setFormData({ ...formData, firmware: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Storage Location */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">存放信息</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">存放位置 *</Label>
                      <Select
                        value={formData.location}
                        onValueChange={(v) => setFormData({ ...formData, location: v })}
                        disabled={submitting}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择存放位置" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A-01">样品库 A-01</SelectItem>
                          <SelectItem value="A-02">样品库 A-02</SelectItem>
                          <SelectItem value="A-03">样品库 A-03</SelectItem>
                          <SelectItem value="B-01">样品库 B-01</SelectItem>
                          <SelectItem value="B-02">样品库 B-02</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>


                {/* Images - Removed for now */}

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">备注</Label>
                  <Textarea
                    id="notes"
                    placeholder="请输入备注信息..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={submitting}
                  />
                </div>


                {/* Actions */}
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1" disabled={submitting || loading}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        登记中...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        登记入库
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* QR Code Preview */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                二维码预览
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {createdSample ? (
                <>
                  <div className="w-48 h-48 bg-white p-4 rounded-lg border">
                    {createdSample.qr_code_url ? (
                      <img
                        src={createdSample.qr_code_url}
                        alt="Generated QR Code"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <QrCode className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <p className="text-lg font-mono font-bold mt-4">{createdSample.code}</p>
                  <p className="text-sm text-muted-foreground mt-1">样品编号</p>
                  <p className="text-xs text-success mt-2">✅ 登记成功</p>
                </>
              ) : (
                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <QrCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">提交后生成</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div >
  )
}
