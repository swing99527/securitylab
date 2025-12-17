"use client"

import type React from "react"

import { useState } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2, FileText, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const mockProjects = [
  { id: "PRJ-2024-001", name: "智能门锁安全检测", tasksCompleted: 5, totalTasks: 5 },
  { id: "PRJ-2024-002", name: "工业网关渗透测试", tasksCompleted: 3, totalTasks: 4 },
  { id: "PRJ-2024-003", name: "车载T-Box协议分析", tasksCompleted: 6, totalTasks: 6 },
]

const reportTemplates = [
  { value: "en18031", label: "EN 18031 检测报告模板" },
  { value: "etsi303645", label: "ETSI EN 303 645 报告模板" },
  { value: "pentest", label: "渗透测试报告模板" },
  { value: "firmware", label: "固件安全分析报告模板" },
  { value: "custom", label: "自定义模板" },
]

const reportSections = [
  { id: "summary", label: "执行摘要", default: true },
  { id: "scope", label: "检测范围", default: true },
  { id: "methodology", label: "检测方法", default: true },
  { id: "findings", label: "漏洞发现", default: true },
  { id: "compliance", label: "合规矩阵", default: true },
  { id: "risk", label: "风险评估", default: true },
  { id: "remediation", label: "修复建议", default: true },
  { id: "appendix", label: "附录 (原始日志)", default: false },
  { id: "screenshots", label: "截图证据", default: true },
]

export function CreateReportDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    projectId: "",
    template: "",
    sections: reportSections.filter((s) => s.default).map((s) => s.id),
    notes: "",
  })

  const handleSectionToggle = (sectionId: string) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.includes(sectionId)
        ? prev.sections.filter((s) => s !== sectionId)
        : [...prev.sections, sectionId],
    }))
  }

  const handleAutoGenerate = async () => {
    if (!formData.projectId) {
      toast({
        title: "请先选择项目",
        description: "需要选择关联项目后才能自动生成报告",
        variant: "destructive",
      })
      return
    }

    setGenerating(true)

    // Simulate auto-generation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const project = mockProjects.find((p) => p.id === formData.projectId)
    setFormData((prev) => ({
      ...prev,
      title: `${project?.name}报告`,
    }))

    toast({
      title: "报告内容已生成",
      description: "系统已根据项目检测结果自动生成报告草稿",
    })

    setGenerating(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.projectId || !formData.template) {
      toast({
        title: "请填写必填项",
        description: "报告标题、关联项目和报告模板为必填项",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    toast({
      title: "报告创建成功",
      description: `报告 "${formData.title}" 已创建，可进入编辑页面继续完善`,
    })

    setLoading(false)
    setOpen(false)
    setFormData({
      title: "",
      projectId: "",
      template: "",
      sections: reportSections.filter((s) => s.default).map((s) => s.id),
      notes: "",
    })
  }

  const selectedProject = mockProjects.find((p) => p.id === formData.projectId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          新建报告
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>新建检测报告</DialogTitle>
            <DialogDescription>基于项目检测结果生成报告，支持自动汇总漏洞发现和合规矩阵</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project">
                关联项目 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) => setFormData({ ...formData, projectId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择关联项目" />
                </SelectTrigger>
                <SelectContent>
                  {mockProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{project.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({project.tasksCompleted}/{project.totalTasks} 任务完成)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProject && selectedProject.tasksCompleted < selectedProject.totalTasks && (
                <p className="text-xs text-warning">警告: 该项目还有未完成的检测任务，生成的报告可能不完整</p>
              )}
            </div>

            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="title">
                  报告标题 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="例如：智能门锁安全检测报告"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="pt-8">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoGenerate}
                  disabled={generating || !formData.projectId}
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-1" />
                  )}
                  自动生成
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">
                报告模板 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.template}
                onValueChange={(value) => setFormData({ ...formData, template: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择报告模板" />
                </SelectTrigger>
                <SelectContent>
                  {reportTemplates.map((tpl) => (
                    <SelectItem key={tpl.value} value={tpl.value}>
                      {tpl.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>报告章节</Label>
              <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg bg-muted/30">
                {reportSections.map((section) => (
                  <div key={section.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={section.id}
                      checked={formData.sections.includes(section.id)}
                      onCheckedChange={() => handleSectionToggle(section.id)}
                    />
                    <Label htmlFor={section.id} className="text-sm font-normal cursor-pointer">
                      {section.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <Textarea
                id="notes"
                placeholder="输入报告编写注意事项、特殊要求等..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="p-4 bg-muted/50 rounded-lg flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">报告生成说明</p>
                <ul className="space-y-1">
                  <li>• 系统将自动汇总项目中所有任务的漏洞发现</li>
                  <li>• 合规矩阵数据将从项目合规审核结果导入</li>
                  <li>• 生成后可在编辑页面进行修改和完善</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              创建报告
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
