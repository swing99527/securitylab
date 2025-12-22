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
import { Plus, Loader2, Upload, Network, FileCode, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { projectApi, sampleApi, taskApi } from "@/lib/api"

const scanTemplates = [
  { value: "quick", label: "快速扫描", description: "基础端口和服务检测" },
  { value: "standard", label: "标准扫描", description: "完整端口扫描 + 漏洞检测" },
  { value: "deep", label: "深度扫描", description: "全端口 + 深度漏洞分析" },
  { value: "custom", label: "自定义", description: "自定义扫描参数" },
]

const testEngines = [
  { value: "ping_scan", label: "Ping扫描", category: "network" },
  { value: "nmap", label: "Nmap", category: "network" },
  { value: "openvas", label: "OpenVAS", category: "vuln" },
  { value: "nessus", label: "Nessus", category: "vuln" },
  { value: "binwalk", label: "Binwalk", category: "firmware" },
  { value: "firmwalker", label: "Firmwalker", category: "firmware" },
  { value: "boofuzz", label: "Boofuzz", category: "fuzzing" },
  { value: "aflnet", label: "AFLNet", category: "fuzzing" },
]

export function CreateTaskDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
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
      const [projectsRes, samplesRes] = await Promise.all([
        projectApi.getList({ page: 1, pageSize: 100 }),
        sampleApi.getList({ page: 1, pageSize: 100 })
      ])

      if (projectsRes.code === 200 && projectsRes.data) {
        setProjects(projectsRes.data.list || [])
      }
      if (samplesRes.code === 200 && samplesRes.data) {
        setSamples(samplesRes.data.list || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoadingData(false)
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
    // Fuzzing config
    fuzzProtocol: "",
    fuzzTimeout: "60",
    fuzzIterations: "10000",

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
        // Reset form
        setFormData({
          name: "",
          projectId: "",
          sampleId: "",
          taskType: "ping_scan",
          description: "",
          targetIp: "",
          portRange: "1-65535",
          scanTemplate: "standard",
          vulnEngines: [],
          firmwareFile: null,
          fuzzProtocol: "",
          fuzzTimeout: "30",
          fuzzIterations: "10000",
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="network">网络扫描</TabsTrigger>
              <TabsTrigger value="firmware">固件分析</TabsTrigger>
              <TabsTrigger value="fuzzing">模糊测试</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  任务名称 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="例如：智能门锁固件安全检测"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

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
                      <div className="p-2 text-sm text-muted-foreground">暂无样品</div>
                    ) : (
                      samples.map((sample) => (
                        <SelectItem key={sample.id} value={sample.id}>
                          {sample.name} ({sample.code})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>任务类型 *</Label>
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

              {/* 任务类型特定配置 */}
              {formData.taskType === "ping_scan" && (
                <div className="space-y-2">
                  <Label htmlFor="targetIp">目标 IP/域名 *</Label>
                  <Input
                    id="targetIp"
                    placeholder="例如: 8.8.8.8 或 google.com"
                    value={formData.targetIp}
                    onChange={(e) => setFormData({ ...formData, targetIp: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    输入要测试连通性的目标IP地址或域名
                  </p>
                </div>
              )}

              {/* Ping Scan配置 */}
              {formData.taskType === 'ping_scan' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetIp">目标IP/域名 *</Label>
                    <Input
                      id="targetIp"
                      placeholder="例如: baidu.com 或 192.168.1.1"
                      value={formData.targetIp || ''}
                      onChange={(e) => setFormData({ ...formData, targetIp: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="count">Ping次数</Label>
                    <Input
                      id="count"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.count || 4}
                      onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              )}

              {/* Nmap Scan配置 */}
              {formData.taskType === 'nmap_scan' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nmapTarget">扫描目标 *</Label>
                    <Input
                      id="nmapTarget"
                      placeholder="支持: IP(192.168.1.1) | 网段(192.168.1.0/24) | 域名(example.com) | 范围(192.168.1.1-50)"
                      value={formData.target || ''}
                      onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      支持单IP、CIDR网段、IP范围或域名，多个目标用空格分隔
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scanType">扫描类型</Label>
                    <Select
                      value={formData.scanType || 'quick'}
                      onValueChange={(value) => setFormData({ ...formData, scanType: value })}
                    >
                      <SelectTrigger id="scanType">
                        <SelectValue placeholder="选择扫描类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quick">快速发现 (Top 100端口，~30秒)</SelectItem>
                        <SelectItem value="full">完整审计 (全部65535端口 + 服务检测，10-30分钟)</SelectItem>
                        <SelectItem value="stealth">隐蔽扫描 (SYN扫描，规避检测)</SelectItem>
                        <SelectItem value="custom">高级配置 (完全自定义)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {formData.scanType === 'quick' && '扫描常用的100个端口，适合快速发现'}
                      {formData.scanType === 'full' && '扫描所有端口并检测服务版本，耗时较长但信息完整'}
                      {formData.scanType === 'stealth' && '使用SYN扫描，不完成TCP连接，更隐蔽'}
                      {formData.scanType === 'custom' && '自定义扫描范围、速度和检测选项'}
                    </p>
                  </div>

                  {formData.scanType === 'custom' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="ports">端口范围</Label>
                        <Input
                          id="ports"
                          placeholder="例如: 1-1000 或 80,443,8080"
                          value={formData.ports || ''}
                          onChange={(e) => setFormData({ ...formData, ports: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          支持范围(1-1000)、列表(80,443)或组合
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="timing">扫描速度</Label>
                        <Select
                          value={formData.timing || 'T4'}
                          onValueChange={(value) => setFormData({ ...formData, timing: value })}
                        >
                          <SelectTrigger id="timing">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="T0">偏执模式 (极慢，规避IDS)</SelectItem>
                            <SelectItem value="T1">鬼祟模式 (很慢)</SelectItem>
                            <SelectItem value="T2">文雅模式 (慢)</SelectItem>
                            <SelectItem value="T3">常规模式 (默认)</SelectItem>
                            <SelectItem value="T4">激进模式 (快速，推荐)</SelectItem>
                            <SelectItem value="T5">疯狂模式 (最快，可能不准)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          速度越快越容易被IDS/IPS检测，根据目标环境选择
                        </p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <Label>检测选项</Label>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="serviceDetection"
                            checked={formData.serviceDetection || false}
                            onChange={(e) => setFormData({ ...formData, serviceDetection: e.target.checked })}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="serviceDetection" className="font-normal cursor-pointer">
                            服务版本检测 (-sV)
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="osDetection"
                            checked={formData.osDetection || false}
                            onChange={(e) => setFormData({ ...formData, osDetection: e.target.checked })}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="osDetection" className="font-normal cursor-pointer">
                            操作系统检测 (-O，需要root权限)
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="verboseOutput"
                            checked={formData.verboseOutput || false}
                            onChange={(e) => setFormData({ ...formData, verboseOutput: e.target.checked })}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="verboseOutput" className="font-normal cursor-pointer">
                            详细输出 (-v)
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="skipHostDiscovery"
                            checked={formData.skipHostDiscovery || false}
                            onChange={(e) => setFormData({ ...formData, skipHostDiscovery: e.target.checked })}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="skipHostDiscovery" className="font-normal cursor-pointer">
                            禁用主机发现 (-Pn，扫描防火墙后主机)
                          </Label>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {formData.taskType === "nmap_scan" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="targetIp">目标 IP/网段 *</Label>
                    <Input
                      id="targetIp"
                      placeholder="192.168.1.100 或 192.168.1.0/24"
                      value={formData.targetIp}
                      onChange={(e) => setFormData({ ...formData, targetIp: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portRange">端口范围</Label>
                    <Input
                      id="portRange"
                      placeholder="1-65535"
                      value={formData.portRange}
                      onChange={(e) => setFormData({ ...formData, portRange: e.target.value })}
                    />
                  </div>
                </div>
              )}

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
            </TabsContent>

            <TabsContent value="network" className="space-y-4 mt-4">
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                <Network className="h-5 w-5 text-primary" />
                <span className="text-sm">网络扫描配置</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetIp">目标 IP/网段</Label>
                  <Input
                    id="targetIp"
                    placeholder="192.168.1.100 或 192.168.1.0/24"
                    value={formData.targetIp}
                    onChange={(e) => setFormData({ ...formData, targetIp: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portRange">端口范围</Label>
                  <Input
                    id="portRange"
                    placeholder="1-65535"
                    value={formData.portRange}
                    onChange={(e) => setFormData({ ...formData, portRange: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>扫描模板</Label>
                <div className="grid grid-cols-2 gap-3">
                  {scanTemplates.map((template) => (
                    <div
                      key={template.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${formData.scanTemplate === template.value
                        ? "border-primary bg-primary/10"
                        : "hover:border-muted-foreground/50"
                        }`}
                      onClick={() => setFormData({ ...formData, scanTemplate: template.value })}
                    >
                      <div className="font-medium text-sm">{template.label}</div>
                      <div className="text-xs text-muted-foreground">{template.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="firmware" className="space-y-4 mt-4">
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                <FileCode className="h-5 w-5 text-primary" />
                <span className="text-sm">固件分析配置</span>
              </div>

              <div className="space-y-2">
                <Label>上传固件文件</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">拖拽固件文件到此处，或点击上传</p>
                  <p className="text-xs text-muted-foreground mt-1">支持 .bin, .img, .hex, .elf 格式，最大 500MB</p>
                  <Input
                    type="file"
                    className="hidden"
                    accept=".bin,.img,.hex,.elf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setFormData({ ...formData, firmwareFile: file })
                      }
                    }}
                  />
                </div>
                {formData.firmwareFile && <p className="text-sm text-success">已选择: {formData.firmwareFile.name}</p>}
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">固件分析将执行:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 文件系统解包 (Binwalk)</li>
                  <li>• 敏感信息扫描 (硬编码密钥、凭证)</li>
                  <li>• 二进制漏洞分析</li>
                  <li>• 加密算法检测</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="fuzzing" className="space-y-4 mt-4">
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                <Zap className="h-5 w-5 text-primary" />
                <span className="text-sm">模糊测试配置</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuzzProtocol">目标协议</Label>
                <Select
                  value={formData.fuzzProtocol}
                  onValueChange={(value) => setFormData({ ...formData, fuzzProtocol: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择测试协议" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="http">HTTP/HTTPS</SelectItem>
                    <SelectItem value="mqtt">MQTT</SelectItem>
                    <SelectItem value="coap">CoAP</SelectItem>
                    <SelectItem value="modbus">Modbus</SelectItem>
                    <SelectItem value="ble">BLE GATT</SelectItem>
                    <SelectItem value="zigbee">ZigBee</SelectItem>
                    <SelectItem value="custom">自定义协议</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fuzzTimeout">超时时间 (秒)</Label>
                  <Input
                    id="fuzzTimeout"
                    type="number"
                    value={formData.fuzzTimeout}
                    onChange={(e) => setFormData({ ...formData, fuzzTimeout: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuzzIterations">迭代次数</Label>
                  <Input
                    id="fuzzIterations"
                    type="number"
                    value={formData.fuzzIterations}
                    onChange={(e) => setFormData({ ...formData, fuzzIterations: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
                <p className="text-sm text-warning">
                  <strong>注意:</strong> 模糊测试可能导致目标设备崩溃或重启，请确保测试环境已隔离
                </p>
              </div>
            </TabsContent>
          </Tabs>

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
