"use client"

import { StatCard } from "./stat-card"
import { HeatmapCalendar } from "./heatmap-calendar"
import { VulnerabilityTrend } from "./vulnerability-trend"
import { TodoList } from "./todo-list"
import { FolderKanban, FileText, Database, AlertTriangle } from "lucide-react"

export function DashboardContent() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="进行中项目"
          value={12}
          icon={FolderKanban}
          trend={{ value: 8, isUp: true }}
          variant="default"
        />
        <StatCard title="待审核报告" value={5} icon={FileText} trend={{ value: 2, isUp: false }} variant="warning" />
        <StatCard title="今日入库样品" value={8} icon={Database} trend={{ value: 15, isUp: true }} variant="success" />
        <StatCard title="异常设备" value={2} icon={AlertTriangle} variant="danger" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HeatmapCalendar />
        <VulnerabilityTrend />
      </div>

      {/* Todo List */}
      <TodoList />
    </div>
  )
}
