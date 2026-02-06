"use client"

import { useState, useEffect } from "react"
import { AssetTree } from "./asset-tree"
import { NetworkTopology } from "./network-topology"
import { FuzzingDashboard } from "./fuzzing-dashboard"
import { FuzzingResults } from "./fuzzing-results"
import { FirmwareResults } from "./firmware-results"
import { VulnerabilityList } from "./vulnerability-list"
import { TaskProgress } from "./task-progress"
import { TerminalPanel } from "./terminal-panel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Pause, Square, Download, ChevronLeft, Trash2, Loader2, RotateCcw, Settings } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { taskApi } from "@/lib/api"

interface TaskCockpitProps {
  taskId: string
}

export function TaskCockpit({
  taskId,
}: TaskCockpitProps) {
  const [taskData, setTaskData] = useState<any>(null)
  const [taskStatus, setTaskStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [vulnStats, setVulnStats] = useState<any>(null)

  // Fetch task data
  useEffect(() => {
    async function fetchTask() {
      try {
        const response = await taskApi.getDetail(taskId)
        if (response.code === 200 && response.data) {
          setTaskData(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch task:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTask()
  }, [taskId])

  // Fetch vulnerability statistics for vuln_scan tasks
  useEffect(() => {
    async function fetchVulnStats() {
      if (!taskData || taskData.type !== 'vuln_scan') return

      try {
        const response = await fetch(`http://localhost:8000/api/v1/tasks/${taskId}/vulnerabilities?page=1&page_size=1`)
        const data = await response.json()
        if (data.code === 200 && data.data) {
          setVulnStats(data.data.statistics)
        }
      } catch (error) {
        console.error('Failed to fetch vuln stats:', error)
      }
    }

    fetchVulnStats()
  }, [taskId, taskData])

  // Poll task status every 2 seconds
  useEffect(() => {
    async function pollStatus() {
      try {
        const response = await taskApi.getStatus(taskId)
        if (response.code === 200 && response.data) {
          setTaskStatus(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch status:', error)
      }
    }

    pollStatus()
    const interval = setInterval(pollStatus, 2000)

    return () => clearInterval(interval)
  }, [taskId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!taskData) {
    return <div className="text-center text-muted-foreground">任务不存在</div>
  }

  const status = taskStatus?.status || taskData.status
  const progress = taskStatus?.progress || taskData.progress || 0
  const message = taskStatus?.message || ""
  const taskResult = taskStatus?.result // Real task result from Redis
  const taskType = taskData.type // Task type (ping_scan, nmap_scan, etc.)

  // Extract real-time stats from task result
  const extractStats = () => {
    if (!taskResult) {
      return {
        scannedItems: 0,
        discoveredServices: 0,
        foundVulns: 0,
        testCases: 0,
      }
    }

    // Stats based on task type
    switch (taskType) {
      case "ping_scan":
        return {
          scannedItems: taskResult.total_attempts || 0,
          discoveredServices: taskResult.successful || 0,
          foundVulns: 0, // Ping doesn't detect vulns
          testCases: 0,
          avgLatency: taskResult.avg_latency_ms,
          lossRate: taskResult.loss_rate,
        }

      case "nmap_scan":
        return {
          scannedItems: taskResult.ports_found || 0,
          discoveredServices: taskResult.services_identified || 0,
          foundVulns: 0, // Nmap doesn't detect vulnerabilities directly
          testCases: 0,
        }

      case "fuzzing":
        return {
          scannedItems: taskResult.total_requests || 0,
          discoveredServices: 0,
          foundVulns: taskResult.vulnerabilities_found || 0,
          testCases: taskResult.total_requests || 0,
        }

      case "vuln_scan":
        // Use vulnStats from database as fallback if taskResult doesn't have counts
        return {
          scannedItems: taskResult.services_scanned || 0,
          foundVulns: taskResult.vulnerabilities_found || vulnStats?.total_vulnerabilities || 0,
          criticalVulns: taskResult.critical_count || vulnStats?.critical || 0,
          highVulns: taskResult.high_count || vulnStats?.high || 0,
          mediumVulns: taskResult.medium_count || vulnStats?.medium || 0,
          lowVulns: taskResult.low_count || vulnStats?.low || 0,
        }

      case "firmware_analysis":
        return {
          scannedItems: taskResult.extraction?.total_files || 0,
          foundVulns: taskResult.findings?.length || 0,
          cryptoMaterial: (taskResult.crypto?.private_keys?.length || 0) + (taskResult.crypto?.certificates?.length || 0),
          extractedSize: taskResult.extraction?.filesystem_info?.total_size_mb || 0,
        }

      default:
        return {
          scannedItems: 0,
          discoveredServices: 0,
          foundVulns: 0,
          testCases: 0,
        }
    }
  }

  const stats = extractStats()

  const statusConfig: Record<string, { label: string; color: string }> = {
    "queued": { label: "排队中", color: "bg-gray-500" },
    "running": { label: "运行中", color: "bg-primary" },
    "paused": { label: "已暂停", color: "bg-yellow-500" },
    "completed": { label: "已完成", color: "bg-green-500" },
    "failed": { label: "失败", color: "bg-red-500" },
    "cancelled": { label: "已取消", color: "bg-gray-600" },
  }

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{taskData.name}</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <span>{taskData.code}</span>
            <span>|</span>
            <span>类型: {taskData.type}</span>
            <Badge
              className={`${statusConfig[status]?.color || 'bg-gray-500'} text-white`}
            >
              {statusConfig[status]?.label || status}
            </Badge>
          </div>
          {message && (
            <div className="text-xs text-muted-foreground mt-1">
              {message}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {status === "queued" ? (
            <Button
              variant="default"
              size="sm"
              onClick={async () => {
                try {
                  await taskApi.execute(taskId)
                  window.location.reload() // 刷新页面以获取最新状态
                } catch (error) {
                  console.error('Failed to start task:', error)
                  alert('启动任务失败，请检查控制台')
                }
              }}
            >
              <Play className="h-4 w-4 mr-1" />
              开始
            </Button>
          ) : status === "running" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await taskApi.pause(taskId)
                  window.location.reload() // 刷新页面以获取最新状态
                } catch (error) {
                  console.error('Failed to pause task:', error)
                }
              }}
            >
              <Pause className="h-4 w-4 mr-1" />
              暂停
            </Button>
          ) : status === "paused" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await taskApi.resume(taskId)
                  window.location.reload()
                } catch (error) {
                  console.error('Failed to resume task:', error)
                }
              }}
            >
              <Play className="h-4 w-4 mr-1" />
              继续
            </Button>
          ) : null}
          {status !== "completed" && status !== "cancelled" && status !== "failed" && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (confirm('确定要停止此任务吗？')) {
                  try {
                    await taskApi.stop(taskId)
                    window.location.reload()
                  } catch (error) {
                    console.error('Failed to stop task:', error)
                  }
                }
              }}
            >
              <Square className="h-4 w-4 mr-1" />
              停止
            </Button>
          )}

          {/* Delete button - only show for non-running tasks */}
          {status !== "running" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" />
                  删除
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认删除任务</AlertDialogTitle>
                  <AlertDialogDescription>
                    确定要删除任务 <span className="font-mono font-semibold">{taskData?.code || taskId}</span> 吗？
                    <br />
                    <span className="text-destructive">此操作无法撤销，所有相关数据将被永久删除。</span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90"
                    onClick={async () => {
                      try {
                        await taskApi.delete(taskId)
                        // Navigate back to task list
                        window.location.href = '/tasks'
                      } catch (error) {
                        console.error('Failed to delete task:', error)
                        alert('删除任务失败，请检查控制台')
                      }
                    }}
                  >
                    确认删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Button variant="outline" size="sm" disabled>
            <RotateCcw className="h-4 w-4 mr-1" />
            重启
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4 mr-1" />
            导出
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <TaskProgress progress={progress} message={message} />

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Left Panel - Asset Tree (only for scan tasks) */}
        {(taskType === "ping_scan" || taskType === "nmap_scan") && (
          <div className="col-span-3 min-h-0">
            <AssetTree taskId={taskId} taskResult={taskResult} taskType={taskType} />
          </div>
        )}

        {/* Middle Panel - Visualization */}
        <div className={`${taskType === "ping_scan" || taskType === "nmap_scan" ? "col-span-6" : "col-span-9"} min-h-0 flex flex-col gap-4`}>
          <Tabs
            defaultValue={
              taskType === "vuln_scan" ? "vulnerabilities" :
                taskType === "nmap_scan" ? "topology" :
                  taskType === "fuzzing" ? "results" :
                    "logs"
            }
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className="w-fit">
              {taskType === "nmap_scan" && <TabsTrigger value="topology">网络拓扑</TabsTrigger>}
              {taskType === "vuln_scan" && <TabsTrigger value="vulnerabilities">漏洞结果</TabsTrigger>}
              {taskType === "fuzzing" && (
                <>
                  <TabsTrigger value="results">漏洞结果</TabsTrigger>
                  <TabsTrigger value="fuzzing">性能监控</TabsTrigger>
                </>
              )}
              {taskType === "firmware_analysis" && <TabsTrigger value="results">分析结果</TabsTrigger>}
              <TabsTrigger value="logs">执行日志</TabsTrigger>
            </TabsList>

            {taskType === "nmap_scan" && (
              <TabsContent value="topology" className="flex-1 mt-2 min-h-0">
                <NetworkTopology taskResult={taskResult} />
              </TabsContent>
            )}

            {taskType === "vuln_scan" && (
              <TabsContent value="vulnerabilities" className="flex-1 mt-2 min-h-0 overflow-auto">
                <VulnerabilityList taskId={taskId} />
              </TabsContent>
            )}

            {taskType === "fuzzing" && (
              <>
                <TabsContent value="fuzzing" className="flex-1 mt-2 min-h-0">
                  <FuzzingDashboard taskId={taskId} />
                </TabsContent>
                <TabsContent value="results" className="flex-1 mt-2 min-h-0 overflow-auto">
                  <FuzzingResults taskId={taskId} result={taskResult} />
                </TabsContent>
              </>
            )}

            {taskType === "firmware_analysis" && (
              <TabsContent value="results" className="flex-1 mt-2 min-h-0 overflow-auto">
                <FirmwareResults taskId={taskId} result={taskResult} />
              </TabsContent>
            )}

            <TabsContent value="logs" className="flex-1 mt-2 min-h-0">
              <TerminalPanel taskId={taskId} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Stats */}
        <div className="col-span-3 space-y-4 min-h-0 overflow-auto">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">实时统计</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {taskType === "ping_scan" && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">测试次数</span>
                    <span className="font-mono">{stats.scannedItems}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">成功响应</span>
                    <span className="font-mono text-primary">{stats.discoveredServices}</span>
                  </div>
                  {stats.avgLatency && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">平均延迟</span>
                      <span className="font-mono">{stats.avgLatency.toFixed(2)} ms</span>
                    </div>
                  )}
                  {stats.lossRate !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">丢包率</span>
                      <span className={`font-mono ${stats.lossRate > 0 ? 'text-destructive' : 'text-green-500'}`}>
                        {(stats.lossRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </>
              )}

              {taskType === "nmap_scan" && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">已扫描端口</span>
                    <span className="font-mono">{stats.scannedItems}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">发现服务</span>
                    <span className="font-mono text-primary">{stats.discoveredServices}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">潜在漏洞</span>
                    <span className="font-mono text-destructive">{stats.foundVulns}</span>
                  </div>
                </>
              )}

              {taskType === "fuzzing" && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">测试请求</span>
                    <span className="font-mono">{stats.testCases}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">发现漏洞</span>
                    <span className="font-mono text-destructive">{stats.foundVulns}</span>
                  </div>
                </>
              )}

              {taskType === "vuln_scan" && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">扫描服务</span>
                    <span className="font-mono">{stats.scannedItems}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">总漏洞数</span>
                    <span className="font-mono text-destructive font-bold">{stats.foundVulns}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">严重</span>
                    <span className="font-mono text-red-600">{stats.criticalVulns || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">高危</span>
                    <span className="font-mono text-orange-600">{stats.highVulns || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">中危</span>
                    <span className="font-mono text-yellow-600">{stats.mediumVulns || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">低危</span>
                    <span className="font-mono text-blue-600">{stats.lowVulns || 0}</span>
                  </div>
                </>
              )}

              {taskType === "firmware_analysis" && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">提取文件数</span>
                    <span className="font-mono">{stats.scannedItems}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">安全发现</span>
                    <span className="font-mono text-destructive font-bold">{stats.foundVulns}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">加密材料</span>
                    <span className="font-mono text-yellow-600">{stats.cryptoMaterial || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">文件系统大小</span>
                    <span className="font-mono">{stats.extractedSize?.toFixed(2) || 0} MB</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Task Result Summary */}
          {taskResult && status === "completed" && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">任务结果</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {taskType === "ping_scan" && taskResult.status && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">目标状态: </span>
                    <Badge variant={taskResult.status === "reachable" ? "default" : "destructive"}>
                      {taskResult.status === "reachable" ? "可达" : "不可达"}
                    </Badge>
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  查看"执行日志"选项卡了解详细信息
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom Panel - Terminal (moved to tabs) */}
    </div>
  )
}
