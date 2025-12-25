"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Loader2, FileText, Download, Trash2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { reportApi } from "@/lib/api"
import { ReportMetadataForm } from "@/components/reports/report-metadata-form"

interface Project {
  id: string
  name: string
  code: string
  tasksCompleted?: number
  totalTasks?: number
}

interface ProjectStats {
  sampleCount: number
  taskCount: number
  vulnCount: number
}

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
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    projectId: "",
    template: "",
    sections: reportSections.filter((s) => s.default).map((s) => s.id),
    notes: "",
  })

  const [metadata, setMetadata] = useState<any>({})
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set())
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // Fetch projects when dialog opens
  useEffect(() => {
    if (open && projects.length === 0) {
      fetchProjects()
    }
  }, [open])

  const fetchProjects = async () => {
    setLoadingProjects(true)
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
      const token = localStorage.getItem('token')

      const response = await fetch(`${apiBaseUrl}/api/v1/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()

        // Handle both response formats:
        // 1. Direct response: { items: [...], total: ..., page: ... }
        // 2. Wrapped response: { code: 200, data: { items: [...], total: ... } }
        let projectItems: Project[] = []

        if (data.items) {
          // Direct response format
          projectItems = data.items
        } else if (data.code === 200 && data.data?.items) {
          // Wrapped response format
          projectItems = data.data.items
        } else {
          console.warn('Unexpected response structure:', data)
        }

        setProjects(projectItems)
      } else {
        const errorText = await response.text()
        throw new Error(`API returned ${response.status}: ${errorText}`)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      toast({
        title: "加载项目失败",
        description: "无法获取项目列表，请刷新重试",
        variant: "destructive",
      })
    } finally {
      setLoadingProjects(false)
    }
  }

  const handleSectionToggle = (sectionId: string) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.includes(sectionId)
        ? prev.sections.filter((s) => s !== sectionId)
        : [...prev.sections, sectionId],
    }))
  }

  const fetchProjectStats = async (projectId: string) => {
    setLoadingStats(true)
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
      const token = localStorage.getItem('token')

      // Fetch tasks for this project
      const tasksRes = await fetch(`${apiBaseUrl}/api/v1/tasks?project_id=${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const tasksData = await tasksRes.json()

      // Count unique samples from tasks
      const tasks = tasksData.items || []
      const uniqueSampleIds = new Set(
        tasks
          .map((task: any) => task.sample_id)
          .filter((id: any) => id != null)
      )

      setProjectStats({
        sampleCount: uniqueSampleIds.size,
        taskCount: tasksData.total || 0,
        vulnCount: 0
      })
    } catch (error) {
      console.error('Failed to fetch project stats:', error)
      setProjectStats({ sampleCount: 0, taskCount: 0, vulnCount: 0 })
    } finally {
      setLoadingStats(false)
    }
  }

  const handleImportProjectData = async () => {
    if (!formData.projectId) {
      toast({
        title: "请先选择项目",
        description: "需要选择关联项目后才能导入数据",
        variant: "destructive",
      })
      return
    }

    if (!formData.template) {
      toast({
        title: "请先选择模板",
        description: "需要选择报告模板后才能导入数据",
        variant: "destructive",
      })
      return
    }

    setGenerating(true)

    try {
      // Call real Preview API
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
      const token = localStorage.getItem('token')

      const response = await fetch(
        `${apiBaseUrl}/api/v1/reports/preview-data?project_id=${formData.projectId}&template=${formData.template}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.metadata) {
        // Update metadata with auto-filled data
        setMetadata(data.metadata)

        // Track which fields were auto-filled
        const filledFields = new Set(Object.keys(data.metadata))
        setAutoFilledFields(filledFields)

        // Auto-generate title if not set
        const project = projects.find((p) => p.id === formData.projectId)
        if (!formData.title && project) {
          setFormData((prev) => ({
            ...prev,
            title: `${project.name} ${data.metadata.product_name || ''} 安全检测报告`.trim(),
          }))
        }

        toast({
          title: "✨ 数据导入成功",
          description: `已从项目导入 ${filledFields.size} 个元数据字段`,
        })
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Failed to fetch preview data:', error)
      toast({
        title: "导入失败",
        description: "无法从项目获取数据，请稍后重试或手动填写",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleClearMetadata = () => {
    setMetadata({})
    setAutoFilledFields(new Set())
    toast({
      title: "已清空",
      description: "所有元数据字段已清空",
    })
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

    // Call real API with metadata
    try {
      await reportApi.create({
        title: formData.title,
        projectId: formData.projectId,
        template: formData.template,
        ...metadata
      })

      toast({
        title: "报告创建成功",
        description: `报告 "${formData.title}" 已创建，可进入编辑页面继续完善`,
      })

      // Reload page to show new report in list (since we don't have global state management here yet)
      window.location.reload()
    } catch (error) {
      console.error(error)
      toast({
        title: "创建失败",
        description: "无法创建报告，请重试",
        variant: "destructive",
      })
    }

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          新建报告
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>新建检测报告</DialogTitle>
            <DialogDescription>基于项目检测结果生成报告，支持自动汇总漏洞发现和合规矩阵</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="py-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="metadata">报告元数据</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="project">
                  关联项目 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => {
                    setFormData({ ...formData, projectId: value })
                    if (value) {
                      fetchProjectStats(value)
                    } else {
                      setProjectStats(null)
                    }
                  }}
                  disabled={loadingProjects}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingProjects ? "加载项目..." : "选择关联项目"} />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{project.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {project.code}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                    {projects.length === 0 && !loadingProjects && (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        暂无项目
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
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
            </TabsContent>

            <TabsContent value="metadata" className="py-4">
              {/* Smart Import Section */}
              <div className="mb-6 p-4 border rounded-lg bg-muted/30">
                {formData.projectId ? (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <h4 className="text-sm font-medium">从项目导入元数据</h4>
                    </div>

                    {loadingStats ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>正在检查项目数据...</span>
                      </div>
                    ) : projectStats && (projectStats.sampleCount > 0 || projectStats.taskCount > 0) ? (
                      <>
                        <p className="text-sm text-muted-foreground mb-3">
                          项目包含: <span className="font-medium text-foreground">{projectStats.sampleCount}</span> 个样品 | <span className="font-medium text-foreground">{projectStats.taskCount}</span> 个任务
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleImportProjectData}
                            disabled={generating}
                          >
                            {generating ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4 mr-1" />
                            )}
                            导入项目数据
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleClearMetadata}
                            disabled={Object.keys(metadata).length === 0}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            清空字段
                          </Button>
                        </div>
                      </>
                    ) : projectStats ? (
                      <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-yellow-800 dark:text-yellow-400 mb-1">
                            当前项目暂无可导入数据
                          </p>
                          <p className="text-yellow-700 dark:text-yellow-500">
                            项目尚未添加样品或任务信息，请手动填写元数据
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    请先在"基本信息"中选择关联项目
                  </p>
                )}
              </div>

              <ReportMetadataForm
                projectData={projects.find(p => p.id === formData.projectId)}
                initialData={metadata}
                autoFilledFields={autoFilledFields}
                onChange={setMetadata}
              />
            </TabsContent>
          </Tabs>

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
