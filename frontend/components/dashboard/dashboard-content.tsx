"use client"

import { useEffect, useState } from "react"
import { StatCard } from "./stat-card"
import { HeatmapCalendar } from "./heatmap-calendar"
import { VulnerabilityTrend } from "./vulnerability-trend"
import { TodoList } from "./todo-list"
import { FolderKanban, FileText, Database, AlertTriangle } from "lucide-react"
import { dashboardApi } from "@/lib/api"
import type { DashboardStats, HeatmapData, VulnerabilityTrendData, TodoItem } from "@/lib/api/types"
import { toast } from "sonner"

export function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([])
  const [trendData, setTrendData] = useState<VulnerabilityTrendData[]>([])
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, heatmapRes, trendRes, todosRes] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getHeatmap(),
          dashboardApi.getVulnerabilityTrend(),
          dashboardApi.getTodos(),
        ])

        if (statsRes.data) setStats(statsRes.data)
        if (heatmapRes.data) setHeatmapData(heatmapRes.data)
        if (trendRes.data) setTrendData(trendRes.data)
        if (todosRes.data) setTodos(todosRes.data)
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
        toast.error("获取仪表盘数据失败")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div className="flex h-96 items-center justify-center text-muted-foreground">加载中...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="进行中项目"
          value={stats?.projectsInProgress || 0}
          icon={FolderKanban}
          trend={{ value: Math.abs(stats?.projectsTrend || 0), isUp: (stats?.projectsTrend || 0) >= 0 }}
          variant="default"
        />
        <StatCard
          title="待审核报告"
          value={stats?.pendingReports || 0}
          icon={FileText}
          trend={{ value: Math.abs(stats?.reportsTrend || 0), isUp: (stats?.reportsTrend || 0) >= 0 }}
          variant="warning"
        />
        <StatCard
          title="今日入库样品"
          value={stats?.samplesToday || 0}
          icon={Database}
          trend={{ value: Math.abs(stats?.samplesTrend || 0), isUp: (stats?.samplesTrend || 0) >= 0 }}
          variant="success"
        />
        <StatCard
          title="异常设备"
          value={stats?.abnormalDevices || 0}
          icon={AlertTriangle}
          variant="danger"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HeatmapCalendar data={heatmapData} />
        <VulnerabilityTrend data={trendData} />
      </div>

      {/* Todo List */}
      <TodoList items={todos} />
    </div>
  )
}
