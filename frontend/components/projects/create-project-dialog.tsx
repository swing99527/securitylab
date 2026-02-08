"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { projectApi, authApi } from "@/lib/api"

const complianceStandards = [
  { value: "en18031", label: "EN 18031 无线电设备安全" },
  { value: "etsi303645", label: "ETSI EN 303 645 消费类IoT" },
  { value: "iso27001", label: "ISO/IEC 27001 信息安全" },
  { value: "gdpr", label: "GDPR 数据保护" },
  { value: "custom", label: "自定义检测" },
]

const mockSamples = [
  { id: "SPL-2024-001", name: "智能门锁样机 A" },
  { id: "SPL-2024-002", name: "工业网关设备 B" },
  { id: "SPL-2024-003", name: "车载 T-Box 样品" },
  { id: "SPL-2024-004", name: "智能摄像头 C" },
]

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [users, setUsers] = useState<Array<{ id: string; name: string; role: string }>>([])
  const { toast } = useToast()
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    client: "",
    standard: "",
    sampleId: "",
    engineerId: "",
    dueDate: "",
    description: "",
  })

  // Fetch users when dialog opens
  useEffect(() => {
    if (open && users.length === 0) {
      loadUsers()
    }
  }, [open])

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const result = await authApi.getUsers()
      if (result.code === 200 && result.data) {
        // Filter to show only managers, engineers, and admins
        const filteredUsers = result.data.filter((u: any) =>
          ['admin', 'manager', 'engineer', 'director'].includes(u.role)
        )
        setUsers(filteredUsers)
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.client || !formData.standard) {
      toast({
        title: "请填写必填项",
        description: "项目名称、客户名称和检测标准为必填项",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const result = await projectApi.create({
        name: formData.name,
        client: formData.client,
        standard: formData.standard,
        sampleId: formData.sampleId || undefined,
        engineerId: formData.engineerId || undefined,
        dueDate: formData.dueDate || undefined,
        description: formData.description || undefined,
      })

      if (result.code === 200) {
        toast({
          title: "项目创建成功",
          description: `项目 "${formData.name}" 已创建`,
        })
        setOpen(false)
        setFormData({
          name: "",
          client: "",
          standard: "",
          sampleId: "",
          engineerId: "",
          dueDate: "",
          description: "",
        })
        // 刷新页面以显示新项目
        router.refresh()
      } else {
        toast({
          title: "创建失败",
          description: result.message || "请稍后重试",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "创建失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          新建项目
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>新建检测项目</DialogTitle>
            <DialogDescription>创建新的安全检测项目，填写基本信息后可关联样品和分配工程师</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  项目名称 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="例如：智能门锁安全检测"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">
                  客户名称 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="client"
                  placeholder="例如：XX科技有限公司"
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="standard">
                  检测标准 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.standard}
                  onValueChange={(value) => setFormData({ ...formData, standard: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择检测标准" />
                  </SelectTrigger>
                  <SelectContent>
                    {complianceStandards.map((std) => (
                      <SelectItem key={std.value} value={std.value}>
                        {std.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sample">关联样品</Label>
                <Select
                  value={formData.sampleId}
                  onValueChange={(value) => setFormData({ ...formData, sampleId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择已入库样品" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockSamples.map((sample) => (
                      <SelectItem key={sample.id} value={sample.id}>
                        {sample.name} ({sample.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="engineer">指派工程师</Label>
                <Select
                  value={formData.engineerId}
                  onValueChange={(value) => setFormData({ ...formData, engineerId: value })}
                  disabled={loadingUsers}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingUsers ? "加载中..." : "选择负责工程师"} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">预计完成日期</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">项目描述</Label>
              <Textarea
                id="description"
                placeholder="输入项目描述、检测要求等信息..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              创建项目
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
