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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { projectApi, sampleApi, taskApi } from "@/lib/api"

// Import task-specific config components
import { PingScanConfig } from "./task-configs/ping-scan-config"
import { NmapScanConfig } from "./task-configs/nmap-scan-config"
import { VulnScanConfig } from "./task-configs/vuln-scan-config"
import { FirmwareConfig } from "./task-configs/firmware-config"
import { FuzzingConfig } from "./task-configs/fuzzing-config"

export function CreateTaskDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Real data from API
  const [projects, setProjects] = useState<any[]>([])
  const [samples, setSamples] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)

  // Fetch projects and samples when dialog opens
  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open])

  const fetchData = async () => {
    setLoadingData(true)
    try {
      // Fetch projects
      const projectsRes = await projectApi.getList({ page: 1, pageSize: 100 })

      if (projectsRes.code === 200 && projectsRes.data) {
        setProjects(projectsRes.data.list || [])
      }

      // ⭐ Samples will be fetched when project is selected
      // Don't fetch all samples here to avoid showing wrong samples
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  // ⭐ NEW: Fetch samples for selected project
  const fetchProjectSamples = async (projectId: string) => {
    if (!projectId) {
      setSamples([])
      return
    }

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
      const token = localStorage.getItem('token')

      const response = await fetch(
        `${apiBaseUrl}/api/v1/samples?project_id=${projectId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setSamples(data.items || [])
      } else {
        setSamples([])
      }
    } catch (error) {
      console.error('Failed to fetch project samples:', error)
      setSamples([])
    }
  }

  const [formData, setFormData] = useState({
    name: "",
    projectId: "",
    sampleId: "",
    taskType: "",
    description: "",
    // Ping scan config
    targetIp: "",
    count: 4,
    // Nmap scan config
    target: "",
    scanType: "quick",
    ports: "",
    timing: "T4",
    serviceDetection: false,
    osDetection: false,
    verboseOutput: false,
    skipHostDiscovery: false,
    // Old nmap fields (keep for compatibility)
    portRange: "1-65535",
    scanTemplate: "standard",
    // Vulnerability scan config
    vulnEngines: [] as string[],
    // Firmware config
    firmwareFile: null as File | null,
    firmware_file: "",
    firmware_filename: "",
    firmware_size: 0,
    analysis_depth: "standard",
    scan_types: ["strings", "credentials", "crypto"],
    // Fuzzing config
    target_url: "",
    method: "GET",
    test_types: ["sql_injection", "xss", "path_traversal"],
    fuzzProtocol: "",
    fuzzTimeout: "10",
    fuzzIterations: "1000",

    // Vulnerability scan config
    vulnScanResultId: "",
    severityFilter: ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as string[],
    nvdApiKey: "",
  })

  const handleEngineToggle = (engine: string) => {
    setFormData((prev) => ({
      ...prev,
      vulnEngines: prev.vulnEngines.includes(engine)
        ? prev.vulnEngines.filter((e) => e !== engine)
        : [...prev.vulnEngines, engine],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('📝 Submitting task creation...', formData)

    // Prevent duplicate submissions
    if (loading) {
      console.log('⚠️ Already submitting, ignoring duplicate')
      return
    }

    // Validate required fields (trim whitespace)
    const trimmedName = formData.name.trim()
    if (!trimmedName || !formData.projectId) {
      console.log('❌ Validation failed:', { name: trimmedName, projectId: formData.projectId })
      toast({
        title: "请填写必填项",
        description: "任务名称和关联项目为必填项",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    console.log('🚀 Creating task with data:', {
      project_id: formData.projectId,
      name: trimmedName,
      type: formData.taskType,
      sample_id: formData.sampleId,
    })

    try {
      // Build config based on task type
      const config: any = {}

      if (formData.taskType === "ping_scan") {
        if (!formData.targetIp || !formData.targetIp.trim()) {
          toast({
            title: "缺少必填项",
            description: "请输入目标IP地址或域名",
            variant: "destructive",
          })
          return
        }
        config.target = formData.targetIp.trim()
        config.count = 4
        config.timeout = 1
      } else if (formData.taskType === "nmap_scan") {
        if (!formData.target || !formData.target.trim()) {
          toast({
            title: "缺少必填项",
            description: "请输入扫描目标",
            variant: "destructive",
          })
          return
        }
        config.target = formData.target.trim()
        config.scanType = formData.scanType || 'quick'

        // Only include optional fields if custom scan
        if (formData.scanType === 'custom') {
          if (formData.ports) {
            config.ports = formData.ports
          }
          config.timing = formData.timing || 'T4'
          config.serviceDetection = formData.serviceDetection || false
          config.osDetection = formData.osDetection || false
          config.verboseOutput = formData.verboseOutput || false
          config.skipHostDiscovery = formData.skipHostDiscovery || false
        }
      }
      else if (formData.taskType === "vuln_scan") {
        if (!formData.vulnScanResultId) {
          toast({
            title: "缺少必填项",
            description: "请选择Nmap扫描结果",
            variant: "destructive",
          })
          return
        }
        // Send nmap_task_id instead of scan_result_id
        config.nmap_task_id = formData.vulnScanResultId
        config.severity_filter = formData.severityFilter
        if (formData.nvdApiKey) {
          config.nvd_api_key = formData.nvdApiKey
        }
      }
      else if (formData.taskType === "fuzzing") {
        // Validate required fields for fuzzing
        if (!formData.target_url || !formData.target_url.trim()) {
          toast({
            title: "缺少必填项",
            description: "请输入目标URL",
            variant: "destructive",
          })
          return
        }

        config.target_url = formData.target_url.trim()
        config.method = formData.method || "GET"
        config.test_types = formData.test_types || ["sql_injection", "xss", "path_traversal"]
        config.fuzz_timeout = parseInt(formData.fuzzTimeout) || 10
        config.fuzz_iterations = parseInt(formData.fuzzIterations) || 1000
      }
      else if (formData.taskType === "firmware_analysis") {
        // Validate firmware file uploaded
        if (!formData.firmware_file) {
          toast({
            title: "缺少必填项",
            description: "请上传固件文件",
            variant: "destructive",
          })
          return
        }

        config.firmware_file = formData.firmware_file
        config.analysis_depth = formData.analysis_depth || "standard"
        config.scan_types = formData.scan_types || ["strings", "credentials", "crypto"]
      }

      console.log("🔍 Debug formData before creating firmware task:", {
        firmware_file: formData.firmware_file,
        firmware_filename: formData.firmware_filename,
        firmware_size: formData.firmware_size
      })

      console.log('📦 Task config:', config)

      // Create task via API
      const response = await taskApi.create({
        project_id: formData.projectId,
        name: trimmedName,
        type: formData.taskType,
        config: config,
        sample_id: formData.sampleId || undefined,
        notes: formData.description || undefined
      })

      console.log('✅ Task creation response:', response)

      if (response.code === 200 || response.code === 201) {
        toast({
          title: "任务创建成功",
          description: `任务 "${formData.name}" 已加入执行队列`,
        })

        setOpen(false)
        // Reset form to initial state
        setFormData({
          name: "",
          projectId: "",
          sampleId: "",
          taskType: "",
          description: "",
          // Ping scan
          targetIp: "",
          count: 4,
          // Nmap scan
          target: "",
          scanType: "quick",
          ports: "",
          timing: "T4",
          serviceDetection: false,
          osDetection: false,
          verboseOutput: false,
          skipHostDiscovery: false,
          // Legacy fields (kept for compatibility)
          portRange: "1-65535",
          scanTemplate: "standard",
          // Vuln scan
          vulnScanResultId: "",
          severityFilter: ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as string[],
          nvdApiKey: "",
          // Firmware
          firmwareFile: null as File | null,
          // Fuzzing
          target_url: "",
          method: "GET",
          test_types: ["sql_injection", "xss", "path_traversal"],
          fuzzProtocol: "",
          fuzzTimeout: "10",
          fuzzIterations: "1000",
          vulnEngines: [],
        })

        // Reload page to show new task
        window.location.reload()
      } else {
        toast({
          title: "创建失败",
          description: response.message || "创建任务时出错",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error('Failed to create task:', error)
      toast({
        title: "创建失败",
        description: error.message || "创建任务时出错",
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
          新建任务
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>新建检测任务</DialogTitle>
            <DialogDescription>配置检测任务参数，支持网络扫描、漏洞检测、固件分析和协议模糊测试</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  任务名称 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="例如：智能门锁固件安全检测"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project">
                  关联项目 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => {
                    setFormData({ ...formData, projectId: value, sampleId: "" })  // ⭐ Clear sample when project changes
                    fetchProjectSamples(value)  // ⭐ Fetch samples for selected project
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择关联项目" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingData ? (
                      <div className="p-2 text-sm text-muted-foreground">加载中...</div>
                    ) : projects.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">暂无项目</div>
                    ) : (
                      projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name} ({project.code})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sample">关联样品 (可选)</Label>
                {!formData.projectId ? (
                  <p className="text-sm text-muted-foreground p-2 border rounded">
                    请先选择关联项目
                  </p>
                ) : (
                  <Select
                    value={formData.sampleId}
                    onValueChange={(value) => setFormData({ ...formData, sampleId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择关联样品（可选）" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingData ? (
                        <div className="p-2 text-sm text-muted-foreground">加载中...</div>
                      ) : samples.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          当前项目暂无样品
                        </div>
                      ) : (
                        samples.map((sample) => (
                          <SelectItem key={sample.id} value={sample.id}>
                            {sample.name} ({sample.code})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>任务类型 <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.taskType}
                  onValueChange={(value) => setFormData({ ...formData, taskType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择任务类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ping_scan">Ping扫描 - 网络连通性测试</SelectItem>
                    <SelectItem value="nmap_scan">Nmap扫描 - 端口和服务检测</SelectItem>
                    <SelectItem value="vuln_scan">漏洞扫描 - 安全漏洞检测</SelectItem>
                    <SelectItem value="firmware_analysis">固件分析 - 固件安全分析</SelectItem>
                    <SelectItem value="fuzzing">Fuzzing测试 - 模糊测试</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">任务描述</Label>
                <Textarea
                  id="description"
                  placeholder="输入任务描述、特殊要求等..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            {/* Dynamic Task Configuration */}
            {formData.taskType && (
              <div className="border-t pt-6">
                {formData.taskType === 'ping_scan' && <PingScanConfig formData={formData} setFormData={setFormData} />}
                {formData.taskType === 'nmap_scan' && <NmapScanConfig formData={formData} setFormData={setFormData} />}
                {formData.taskType === 'vuln_scan' && <VulnScanConfig formData={formData} setFormData={setFormData} />}
                {formData.taskType === 'firmware_analysis' && <FirmwareConfig formData={formData} setFormData={setFormData} />}
                {formData.taskType === 'fuzzing' && <FuzzingConfig formData={formData} setFormData={setFormData} />}
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              创建任务
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
